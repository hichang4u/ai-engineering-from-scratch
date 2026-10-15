# 음성 보조 파이프라인 구축 6단계 캡스톤

> 01-11 수업에서 모든 것이 엮여 있습니다. 듣기, 논리화, 그리고 이야기하는 음성 보조를 구축하십시오. 2026 년에는 그것이 해결 된 엔지니어링 문제입니다. 연구 문제가 아닙니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 05, 06, 07, 11; Phase 11 · 09 (Function Calling); Phase 14 · 01 (Agent Loop)
**Time:** ~120 minutes

## 문제

종결에서 종결까지의 보조를 만들

1. 마이크 입력 (16kHz 모노) 를 캡처합니다.
2. 사용자 음성 시작/말 탐지
3. 스트리밍을 전송합니다.
4. 도구 (타이머, 날씨, 달력) 를 호출할 수 있는 LLM에 기록을 통과합니다.
5. TTS에 LLM 텍스트를 스트리밍합니다.
6. 사용자에게 오디오를 재생합니다.
7. 사용자가 중간 응답을 중단하면 중지됩니다.

지연성 목표: 노트북 CPU에서 발언을 끝내는 사용자로부터 800 ms 이내에 첫 번째 TTS 오디오 바이트. 품질 목표: 놓친 단어, 침묵에 환각 된 자막이 없습니다, 음성 복제 유출이 없습니다, 즉각적인 주사 성공이 없습니다.

## 개념

![Voice assistant pipeline: mic → VAD → STT → LLM+tools → TTS → speaker](../assets/voice-assistant.svg)

### 7가지 요소

1. **Audio capture.**마이크로 → 16kHz 모노 → 20ms 덩어리. 보통 `sounddevice`파이썬 또는 네이티브 AudioUnit/ALSA/WASAPI에서 제작.
2. **VAD (Lesson 11).**시레로 VAD @ 문턱 0.5, min 연설 250 ms, 침묵  500 ms. 신호 "시작" 및 "말".
3. **Streaming STT (Lesson 4-5).**비스퍼 스트리밍, 파라키트-TDT, 또는 딥그램 노바-3 (API). 부분 + 최종 기록.
4. **LLM with tool calling.**GPT-4o / Claude 3.5 / Gemini 2.5 플래시. 도구에 대한 JSON 스케마. 스트리밍 토큰.
5. **Streaming TTS (Lesson 7).**코코로-82M (최고 개장) 또는 카르테시아 소닉 (상업)
6. **Playback.**스피커를 내놓은 것, 낮은 대역폭 네트워크에 대한 오퍼스 코딩
7. **Interruption handler.**TTS 재생 중 VAD가 발사되면 재생을 중지하고 LLM를 취소하고 STT를 다시 시작하십시오.

### 3가지 실패 모드가

1. **First-word clip.**VAD는 너무 늦어서 시작합니다. 사용자 "하이"가 없어집니다. 시작 문턱은 0.3에서 시작됩니다. 0.5이 아닙니다.
2. **Mid-response interrupt confusion.**LLM는 사용자 중단을 후 계속 생성; 보조는 사용자에 대해 이야기합니다.
3. **Silence hallucination.**비스퍼는 조용한 온도 프레임에 "보신 감사합니다"를 외칩니다. 항상 VAD 게이트

### 2026 생산 기준 스택

| Stack | Latency | License | Notes |
|-------|---------|---------|-------|
| LiveKit + Deepgram + GPT-4o + Cartesia | 350-500 ms | commercial API | Industry default 2026 |
| Pipecat + Whisper-streaming + GPT-4o + Kokoro | 500-800 ms | mostly open | DIY-friendly |
| Moshi (full-duplex) | 200-300 ms | CC-BY 4.0 | Single-model; different architecture, lesson 15 |
| Vapi / Retell (managed) | 300-500 ms | commercial | Fastest to launch; limited customization |
| Whisper.cpp + llama.cpp + Kokoro-ONNX | offline | open | Privacy / edge |

```figure
v4-voice-latency
```

## 건설 해

### 단계 1: 킹 (스웨이코드) 으로 마이크 캡처

```python
import sounddevice as sd

def mic_stream(chunk_ms=20, sr=16000):
    q = queue.Queue()
    def cb(indata, frames, time, status):
        q.put(indata.copy().flatten())
    with sd.InputStream(channels=1, samplerate=sr, blocksize=int(sr * chunk_ms/1000), callback=cb):
        while True:
            yield q.get()
```

### 단계 2: VAD 게이트 된 회전 캡처

```python
def capture_turn(stream, vad, pre_roll_ms=300, silence_ms=500):
    buf, pre, triggered = [], collections.deque(maxlen=pre_roll_ms // 20), False
    silent = 0
    for chunk in stream:
        pre.append(chunk)
        if vad(chunk):
            if not triggered:
                buf = list(pre)
                triggered = True
            buf.append(chunk)
            silent = 0
        elif triggered:
            silent += 20
            buf.append(chunk)
            if silent >= silence_ms:
                return b"".join(buf)
```

### 단계 3: STT → LLM → TTS를 스트리밍

```python
async def turn(audio_bytes):
    transcript = await stt.transcribe(audio_bytes)
    async for token in llm.stream(transcript):
        async for audio in tts.stream(token):
            await speaker.play(audio)
```

### 단계 4: LLM 루프 내부에서 통칭하는 도구

```python
tools = [
    {"name": "get_weather", "parameters": {"location": "string"}},
    {"name": "set_timer", "parameters": {"seconds": "int"}},
]

async for chunk in llm.stream(user_text, tools=tools):
    if chunk.type == "tool_call":
        result = dispatch(chunk.name, chunk.args)
        continue_streaming(result)
    if chunk.type == "text":
        await tts.stream(chunk.text)
```

### 단계 5: 중단 처리

```python
tts_task = asyncio.create_task(tts_loop())
while True:
    chunk = await mic.get()
    if vad(chunk):
        tts_task.cancel()
        await speaker.stop()
        await new_turn()
        break
```

## 사용 하 고

보시다시피`code/main.py`실행 가능한 시뮬레이션에서 7개의 구성 요소를 스텀 모델로 연결하여 하드웨어 없이도 파이프라인 모양을 볼 수 있습니다. 실제 구현을 위해 스텀을

- `silero-vad`(`pip install silero-vad`)
- `deepgram-sdk`또는`openai-whisper`
- `openai`(`gpt-4o`) 또는`anthropic`
- `kokoro`또는`cartesia`
- `sounddevice`I/O

## 함정

- **Logging PII forever.**대부분의 관할권에서는 전체 회전 오디오는 PII입니다. 30일 동안 저장되어 있으며,
- **No barge-in.**이용자들은 방해를 받습니다.
- **TTS that blocks.**동기 TTS는 이벤트 루프를 차단합니다. 아시크 또는 별도의 스레드를 사용하십시오.
- **No tool-call error handling.**도구가 실패합니다. LLM는 오류를 다시 얻을 필요가 있습니다 + 다시 한번 시도하고, 그 다음 우아하게 degraded.
- **Overzealous hallucination filters.**과잉 필터링이 되면 비서님이 "그건 내가 할 수 없어"라고 반복하고
- **No wake-word option.**항상 듣는 것은 개인 정보 보호 책임입니다. 깨어 있는 단어 게이트 (Porcupine 또는 openWakeWord) 를 추가하십시오.

## 선박

`outputs/skill-voice-assistant-architect.md`예산 + 규모 + 언어 + 준수 제한을 고려하면 전체 스택 스펙을 작성합니다.

## 운동

1. **Easy.**달아`code/main.py`- 한 번씩 턴을 끝에서 끝으로 시뮬레이션하고
2. **Medium.**STT 톱을 미리 녹음된 실제 Whisper 모델로 교체하세요`.wav`WER 및 엔드-투-엔드 지연을 측정합니다.
3. **Hard.**도구 호출을 추가: 구현 `get_weather`(어떤 API) 및 `set_timer`. LLM를 도구들을 통해 로우트하고 사용자가 "5분 타이머를 설정하라"라고 하면 올바른 함수가 발동되고 음성 응답이 그것을 확인하는지 확인합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Turn | A user + assistant round-trip | One VAD-bounded user speech + one LLM-TTS response. |
| Barge-in | Interruption | User speaks while assistant talks; assistant stops. |
| Wake word | "Hey assistant" | Short keyword detector; Porcupine, Snowboy, openWakeWord. |
| End-pointing | Turn ending | VAD + min-silence decision that user has finished. |
| Pre-roll | Pre-speech buffer | Keep 200-400 ms of audio before VAD fires to avoid first-word clip. |
| Tool call | Function invocation | LLM emits JSON; runtime dispatches; result feeds back in-loop. |

## 더 많은 읽기

- [LiveKit — voice agent quickstart](https://docs.livekit.io/agents/) 생산급 참조
- [Pipecat — voice agent examples](https://github.com/pipecat-ai/pipecat) DIY 친화적인 프레임워크
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) 관리된 음성 모국 경로
- [Kyutai Moshi](https://github.com/kyutai-labs/moshi) 완전 듀플렉스 참조 (강좌 15).
- [Porcupine wake-word](https://picovoice.ai/products/porcupine/) 경보 문
- [Anthropic — tool use guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) LLM 기능 호출
