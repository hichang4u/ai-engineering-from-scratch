# 실시간 오디오 처리

> 배트 파이프라인은 파일을 처리합니다. 실시간 파이프라인은 다음 20 밀리초가 도착하기 전에 다음 20 밀리초를 처리합니다. 대화 AI, 방송 스튜디오, 전화 로봇은 이 지연 예산으로 살아 죽습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 6 · 04 (ASR), Phase 6 · 07 (TTS)
**Time:** ~75 minutes

## 문제

당신은 살아있는 음성 보조기를 원해요. 인간 대화의 턴-테이크 레이텐스는 ~230 ms (성명-대응) 입니다. 500 ms 이상의 모든 것은 로봇처럼 느껴집니다. 1500 ms 이상의 것은 깨진 느낌입니다.**hear → understand → respond → speak**2026년 루프는

| Stage | Budget |
|-------|--------|
| Mic → buffer | 20 ms |
| VAD | 10 ms |
| ASR (streaming) | 150 ms |
| LLM (first token) | 100 ms |
| TTS (first chunk) | 100 ms |
| Render → speaker | 20 ms |
| **Total** | **~400 ms** |

모시 (쿠타이, 2024) 는 200 ms의 풀두플렉스 시계를 기록했다. GPT-4o 실시간 (2024) 시계는 ~ 320 ms. 2022 년 Cascaded 파이프라인은 2500 ms로 배포되었다. 10x 개선은 세 가지 기술로 왔습니다: (1) 모든 곳에서 스트리밍, (2) 부분적인 결과를 가진 비동기 파이프라인은, (3) 중단 가능한 생성.

## 개념

![Streaming audio pipeline with ring buffer, VAD gate, interruption](../assets/real-time.svg)

**Frame / chunk / window.**실시간 오디오는 고정 크기의 블록으로 흐른다. 일반적인 선택: 20 ms (320kHz에서 샘플) 이 16 kHz. 하류 모든 것은 이 순차와 따라야합니다.

**Ring buffer.**고정 크기의 순환 버퍼. 생산 thread은 새로운 프레임을 작성하고 소비 thread을 읽습니다. 뜨거운 경로에서 할당을 방지합니다. 크기는 ≈ 최대 지연 × 샘플 속도; 2초 16 kHz 반지는 = 32,000 샘플.

**VAD (Voice Activity Detection).**게이츠는 아무도 말하지 않을 때 하류로 작동합니다. Silero VAD 4.0 (2024) 는 CPU에서 30 ms 프레임에 <1 ms를 실행합니다. `webrtcvad`더 오래된 대안입니다.

**Streaming ASR.**오디오가 도착할 때 부분적인 전경을 방출하는 모델. 스트리밍 모드 (NeMo, 2024) 에서 Parakeet-CTC-0.6B는 320 ms 지연으로 25% WER를 수행합니다.

**Interruption.**보조가 말하는 동안 사용자가 말할 때, 당신은 (a) 바지인 (barge-in) 을 감지해야 합니다, (b) TTS를 중지해야 합니다, (c) 남은 LLM 출력을 폐기해야 합니다.

**WebRTC Opus transport.**20 ms 프레임, 48 kHz, 적응성 비트 속도 8128 kbps. 브라우저 및 모바일용 표준. 라이브키트, 데일리닷컴, 피온은 음성 앱 구축에 대한 2026 스택입니다.

**Jitter buffer.**네트워크 패킷은 순서로 / 늦어 도착합니다. jitter 버퍼는 순서로 다시 순서로 이동하고 부드럽습니다. 너무 작은 → 음향 격차, 너무 큰 → 지연. 6080 ms 전형적입니다.

### 일반적인 고스

- **Thread contention.**파이썬의 GIL+ 중형 모델은 오디오 스레드를 소급하게 만들 수 있습니다. C 호출 오디오 라이브러리를 사용해서 파이썬을 뜨거운 경로에서 벗어나게 합니다.
- **Sample-rate conversion latency.**파이프라인 내부의 재 샘플링은 520 ms을 추가합니다. 앞면 재 샘플링 또는 제로 레이텐시 재 샘플링을 사용하십시오 (폴리페이스, `soxr_hq`)
- **TTS priming.**코코로 같은 빠른 TTS도 첫 번째 요청에 100~200 ms의 온난화를 가지고 있습니다. 캐시 모델 + 첫 번째 실제 회전 전에 도미치 런으로 따뜻하게합니다.
- **Echo cancellation.**AEC 없이 TTS 출력은 마이크에 다시 들어가서, 로봇의 자신의 목소리에 ASR를 유발합니다. WebRTC AEC3는 오픈소스 기본이다.

```figure
nyquist-aliasing
```

## 건설 해

### 단계 1: 반지 버퍼

```python
import collections

class RingBuffer:
    def __init__(self, capacity):
        self.buf = collections.deque(maxlen=capacity)
    def write(self, frame):
        self.buf.extend(frame)
    def read(self, n):
        return [self.buf.popleft() for _ in range(min(n, len(self.buf)))]
    def level(self):
        return len(self.buf)
```

용량은 최대 버퍼 지연을 결정합니다. 16kHz에서 32,000 샘플 = 2초

### 단계 2: VAD 게이트

```python
def simple_energy_vad(frame, threshold=0.01):
    return sum(x * x for x in frame) / len(frame) > threshold ** 2
```

생산 시 Silero VAD로 대체:

```python
import torch
vad, _ = torch.hub.load("snakers4/silero-vad", "silero_vad")
is_speech = vad(torch.tensor(frame), 16000).item() > 0.5
```

### 단계 3: 스트리밍 ASR

```python
# Parakeet-CTC-0.6B streaming via NeMo
from nemo.collections.asr.models import EncDecCTCModelBPE
asr = EncDecCTCModelBPE.from_pretrained("nvidia/parakeet-ctc-0.6b")
# chunk_ms=320 ms, look_ahead_ms=80 ms
for chunk in audio_stream():
    partial_text = asr.transcribe_streaming(chunk)
    print(partial_text, end="\r")
```

### 단계 4: 인터럽션 핸들

```python
class Dialog:
    def __init__(self):
        self.tts_task = None

    def on_user_speech(self, frame):
        if self.tts_task and not self.tts_task.done():
            self.tts_task.cancel()   # barge-in
        # then feed to streaming ASR

    def on_final_user_utterance(self, text):
        self.tts_task = asyncio.create_task(self.reply(text))

    async def reply(self, text):
        async for tts_chunk in llm_then_tts(text):
            speaker.write(tts_chunk)
```

무동현성 I/O 및 취소 가능한 TTS 스트리밍에 달려 있습니다. WebRTC peerconnection.stop() 오디오 트랙은 가전적인 방법입니다.

## 사용 하 고

2026년 스택:

| Layer | Pick |
|-------|------|
| Transport | LiveKit (WebRTC) or Pion (Go) |
| VAD | Silero VAD 4.0 |
| Streaming ASR | Parakeet-CTC-0.6B or Whisper-Streaming |
| LLM first-token | Groq, Cerebras, vLLM-streaming |
| Streaming TTS | Kokoro or ElevenLabs Turbo v2.5 |
| Echo cancel | WebRTC AEC3 |
| End-to-end native | OpenAI Realtime API or Moshi |

## 함정

- **Buffering 500 ms to be safe.**버퍼는 당신의 지연층입니다.
- **Not pinning threads.**우선순위보다 낮은 UI 스레드에서 오디오 호출 = 로드중 오류
- **TTS chunks too small.**200m 미 미세먼지는 보코더 유물을 들을 수 있게 해줍니다. 320m 미세먼지는 달콤한 곳입니다.
- **No jitter buffer.**진짜 네트워크는 긴장합니다. 부드럽게 하지 않으면 팝을 얻을 수 있습니다.
- **Single-shot error handling.**오디오 파이프라인은 충돌 방지해야 합니다.

## 선박

`outputs/skill-realtime-designer.md`. 각 단계에 대한 구체적인 지연 예산으로 실시간 오디오 파이프라인을 설계합니다.

## 운동

1. **Easy.**달아`code/main.py`. 반지 버퍼 + 에너지 VAD를 시뮬레이션하고, 가짜 10초 스트림의 단계 지연을 인쇄합니다.
2. **Medium.**사용 `sounddevice`, 20ms 프레임으로 마이크를 처리하고 각 프레임에서 VAD 상태를 인쇄하는
3. **Hard.**                                                                                                                                                                                                                                                                      `aiortc`: 브라우저 → WebRTC → 파이썬 → WebRTC → 브라우저. 1 kHz 충동으로 유리-글라스 지연을 측정합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Ring buffer | The circular queue | Fixed-size, lock-free (or SPSC-locked) FIFO for audio frames. |
| VAD | Silence gate | Model or heuristic marking speech vs non-speech. |
| Streaming ASR | Real-time STT | Emits partial text as audio arrives; bounded lookahead. |
| Jitter buffer | Network smoother | Queue reordering out-of-order packets; 60–80 ms typical. |
| AEC | Echo cancellation | Subtracts speaker-to-mic feedback path. |
| Barge-in | User interrupt | System detects user speech mid-TTS; must cancel playback. |
| Full duplex | Simultaneous both ways | User and bot can talk at the same time; Moshi is full duplex. |

## 더 많은 읽기

- [Macháček et al. (2023). Whisper-Streaming](https://arxiv.org/abs/2307.14743) 거의 흐르는 어
- [Kyutai (2024). Moshi](https://kyutai.org/Moshi.pdf) 200 ms의 완전 듀플렉스 지연시간
- [LiveKit Agents framework (2024)](https://docs.livekit.io/agents/) 제작 오디오 에이전트 오케스트라
- [Silero VAD repo](https://github.com/snakers4/silero-vad) sub-1 ms VAD, Apache 2.0.
- [WebRTC AEC3 paper](https://webrtc.googlesource.com/src/+/main/modules/audio_processing/aec3/) 오픈소스 아래 에코 취소
