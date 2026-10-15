# 음성 활동 탐지 및 회전  시레로, 코브라, 플러시 트릭

> 모든 음성 에이전트는 두 가지 결정에 따라 살아가고 죽습니다. 사용자가 지금 말하고 있습니까? 그리고 그들은 완료합니까? VAD는 첫 번째에 답합니다. 회전 탐지 (VAD + 침묵-어 + 의미적 엔드포인트 모델) 는 두 번째에 답합니다. 잘못하면 당신의 보조는 사용자가 차단하거나 절대 침묵하지 않습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 11 (Real-Time Audio), Phase 6 · 12 (Voice Assistant)
**Time:** ~45 minutes

## 문제

음성 에이전트가 20mps에 한 번씩 3가지 결정을 내리는 겁니다.

1. **Is this frame speech?** VAD, 바이너리, 프레임
2. **Has the user started a new utterance?** 발병 발병 감지
3. **Has the user finished?** 최종 시끄러움 (turn-end).

순진한 답 (에너지 문턱) 은 모든 잡음, 키보드, 대중의 거북이에 실패합니다. 2026 해답: Silero VAD (오픈, 깊이 학습) + 회전 탐지 모델 (성어적 최종 지표) + VAD- 캘리브 된 침묵 기질.

## 개념

![VAD cascade: energy → Silero → turn-detector → flush trick](../assets/vad-turn-taking.svg)

### 3단계 VAD 캐스카드

**Tier 1: energy gate.**가장 저렴한, -40 dBFS의 RMS 임계, 명백한 침묵을 필터링하지만 임의의 소음보다 더 높은 소음에 불을 지르는

**Tier 2: Silero VAD**(2020-2026, MIT). 1M 매개 변수. 6000+ 언어에 훈련. 단일 CPU 스레드에서 30 ms 조각에 ~ 1 ms에서 실행됩니다. 5% FPR에서 87.7% TPR. 오픈 소스 기본.

**Tier 3: semantic turn detector.**라이브킷의 차례 감지 모델 (2024-2026) 또는 자신의 작은 분류기. "언어 중간에 일시 중지"과 "말이 완료"을 구별합니다.

### 주요 매개 변수 및 그 기본 설정

- **Threshold.**시레로는 확률을 내포하고, &gt; 0.5 (장애) 또는 &gt; 0.3 (감각) 로 연설을 분류한다. 낮은 임기 = 첫 단어 클립이 적은, 더 많은 거짓 긍정.
- **Minimum speech duration.**250 ms 보다 짧은 말을 거부하십시오. 일반적으로 기침이나 의자 소음이 발생합니다.
- **Silence hangover (end-pointing).**VAD가 0으로 돌아온 후, 회전 종료 선언하기 전에 500-800 ms를 기다립니다. 너무 짧아 → 사용자 중단. 너무 오래 → 느려집니다.
- **Pre-roll buffer.**VAD가 발사하기 전에 300~500 ms의 오디오를 저장해두고 "Hey"가 잘라내지 않도록 합니다.

### 플래시 트릭 (쿠타이 2025)

스트리밍 STT 모델은 앞뒤로 보기 지연을 가지고 있습니다 (Kyutai STT-1B에 500 ms, STT-2.6B에 2.5 s). 일반적으로 당신은 음성 끝 이후 그 정도 기다립니다.**send a flush signal to the STT**즉흥 출력을 강요합니다. STT는 ~4x 실시간으로 처리됩니다. 그래서 500 ms 버퍼는 ~125 ms에 완료됩니다.

엔드-투-엔드: 125 ms VAD + 플래시 STT = 대화 지연시간

### 2026 VAD 비교

| VAD | TPR @ 5% FPR | Latency | License |
|-----|--------------|---------|---------|
| WebRTC VAD (Google, 2013) | 50.0% | 30 ms | BSD |
| Silero VAD (2020-2026) | 87.7% | ~1 ms | MIT |
| Cobra VAD (Picovoice) | 98.9% | ~1 ms | commercial |
| pyannote segmentation | 95% | ~10 ms | MIT-ish |

시레로는 올바른 기본입니다. 코브라는 컴플라이언스 / 정확성 업그레이드입니다. 에너지 전용 VAD는 2026 생산에 대한 장소가 없습니다.

```figure
sp-vad-cascade
```

## 건설 해

### 단계 1: 에너지 게이트

```python
def energy_vad(chunk, threshold_dbfs=-40.0):
    rms = (sum(x * x for x in chunk) / len(chunk)) ** 0.5
    dbfs = 20.0 * math.log10(max(rms, 1e-10))
    return dbfs > threshold_dbfs
```

### 단계 2: 파이썬에서 Silero VAD

```python
from silero_vad import load_silero_vad, get_speech_timestamps

vad = load_silero_vad()
audio = torch.tensor(waveform_16k, dtype=torch.float32)
segments = get_speech_timestamps(
    audio, vad, sampling_rate=16000,
    threshold=0.5,
    min_speech_duration_ms=250,
    min_silence_duration_ms=500,
    speech_pad_ms=300,
)
for s in segments:
    print(f"{s['start']/16000:.2f}s - {s['end']/16000:.2f}s")
```

### 단계 3: 턴 엔드 상태 기계

```python
class TurnDetector:
    def __init__(self, silence_hangover_ms=500, min_speech_ms=250):
        self.state = "idle"
        self.speech_ms = 0
        self.silence_ms = 0
        self.silence_hangover_ms = silence_hangover_ms
        self.min_speech_ms = min_speech_ms

    def update(self, is_speech, chunk_ms=20):
        if is_speech:
            self.speech_ms += chunk_ms
            self.silence_ms = 0
            if self.state == "idle" and self.speech_ms >= self.min_speech_ms:
                self.state = "speaking"
                return "START"
        else:
            self.silence_ms += chunk_ms
            if self.state == "speaking" and self.silence_ms >= self.silence_hangover_ms:
                self.state = "idle"
                self.speech_ms = 0
                return "END"
        return None
```

### 4단계: 플러스 트릭 스켈레톤

```python
def flush_on_end(stt_client, audio_buffer):
    stt_client.send_audio(audio_buffer)
    stt_client.send_flush()
    return stt_client.recv_transcript(timeout_ms=150)
```

STT (Kyutai, Deepgram, AssemblyAI) 는 이 기능을 하기 위해 플러쉬를 지원해야 합니다. 휘스퍼 스트리밍은 블록 기반의 것이 아니라 항상 조각을 기다리고 있습니다.

## 사용 하 고

| Situation | VAD choice |
|-----------|-----------|
| Open, fast, general | Silero VAD |
| Commercial call center | Cobra VAD |
| On-device (phone) | Silero VAD ONNX |
| Research / diarization | pyannote segmentation |
| Zero-dependency fallback | WebRTC VAD (legacy) |
| Need turn-ending quality | Silero + LiveKit turn-detector layered |

엄지손가락 규칙: 다른 선택이 없다면 전력 전용 VAD를 배포하지 마십시오.

## 함정

- **Fixed threshold.**조용한 상태에서 작동하고, 잡음으로 실패합니다.
- **Too-short silence hangover.**대리인이 문장을 중간에 중단합니다. 500-800 ms는 대화 연설의 가장 좋은 장소입니다.
- **Too-long hangover.**A/B 테스트를 타겟 사용자들과
- **No pre-roll buffer.**처음 200~300 ms의 사용자 오디오가 손실됐습니다. 항상 전속으로 롤링을 유지하세요.
- **Ignoring semantic endpointing.**"우마, 생각해봐"...는 긴 휴식기를 포함하고 있습니다. 사용자가 생각 중 끊어지는 것을 싫어합니다. 라이브킷의 턴 디테이터를 사용하거나 비슷한 것을 사용하세요.

## 선박

`outputs/skill-vad-tuner.md`VAD 모델, 임계, 홍역, 전전, 그리고 턴 탐지 전략을 선택하세요.

## 운동

1. **Easy.**달아`code/main.py`. 음성 + 침묵 + 음성 + 기침 순서기를 시뮬레이션하고 세 개의 VAD 레벨을 테스트합니다.
2. **Medium.**설치`silero-vad`5분 녹음, 첫 번째 단어 클립과 거짓 트리거를 최소화하기 위해 문턱을 조정합니다. 정확성/회복을 보고합니다.
3. **Hard.**미니 턴 디테커를 구축: 시레로 VAD + 마지막 10 단어의 임베디션에 3층 MLP (사진 변환기를 사용) 를 사용하십시오. 손으로 표시된 턴 엔드 데이터 세트에 훈련하십시오. 시레로-만 10% F1를 이길 수 있습니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| VAD | Voice detector | Binary per-frame: is this speech? |
| Turn detection | End-pointing | VAD + silence-hangover + semantic endpoint. |
| Silence hangover | Wait-after-speech | Time to wait before declaring turn end; 500-800 ms. |
| Pre-roll | Pre-speech buffer | Keep 300-500 ms audio before VAD fires. |
| Flush trick | Kyutai hack | VAD → flush-STT → 125 ms instead of 500 ms delay. |
| Semantic endpoint | "Did they mean to stop?" | ML classifier that looks at words, not just silence. |
| TPR @ FPR 5% | ROC point | Standard VAD benchmark; 87.7% for Silero, 50% WebRTC. |

## 더 많은 읽기

- [Silero VAD](https://github.com/snakers4/silero-vad) 참조 오픈 VAD.
- [Picovoice Cobra VAD](https://picovoice.ai/products/voice/voice-activity-detection/) 상업적 정확성 선두자
- [Kyutai — Unmute + flush trick](https://kyutai.org/stt) sub-200 ms 엔지니어링 트릭
- [LiveKit — turn detection](https://docs.livekit.io/agents/logic/turns/) 생산에서 의미적 끝표
- [WebRTC VAD](https://webrtc.googlesource.com/src/) 기존의 기본 기준
- [pyannote segmentation](https://github.com/pyannote/pyannote-audio) 일기화 수준의 세그먼트
