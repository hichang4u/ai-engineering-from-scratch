# 음성 에이전트: 피펙트 및 라이브킷

> 음성 에이전트는 2026년 1급 생산 카테고리입니다. 피펙트는 파이썬 프레임 기반 파이프라인 (VAD → STT → LLM → TTS → 운송) 을 제공합니다. 라이브킷 에이전트는 웹RTC를 통해 AI 모델을 사용자에게 연결합니다. 프리미엄 스택의 생산 지연기 목표는 450600ms로 끝에서 끝으로 떨어집니다.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~60 minutes

## 학습 목표

- 피펙트의 프레임 기반 파이프 라인을 설명하십시오: DOWNSTREAM (원자→sink) 및 UPSTREAM (통제).
- 피펙트 지원이 운반되는 가전성 음성 파이프라인의 단계와 그 단계를 명명하십시오.
- 라이브키트 에이전트의 두 개의 음성 에이전트 클래스 (멀티모달 에이전트, 음성 파이프라인 에이전트) 와 각각의 적합성을 설명하십시오.
- 2026년 생산 지연기 예상과 건축 선택에 영향을 미치는 방법을 요약하십시오.

## 문제

음성 에이전트는 TTS를 연결한 텍스트 루프가 아닙니다. 지연 예산은 잔인하다 (~ 600ms), 부분 오디오는 기본이며, 회전 탐지 모델이며, 통신은 SIP에서 WebRTC까지의 전화 범위입니다. 프레임 기반 파이프라인 (Pipecat) 을 만들거나 플랫폼 (LiveKit) 에 의존합니다.

## 개념

### 피페카트 (pipecat-ai/pipecat)

- 파이썬 프레임 기반 파이프라인 프레임워크
- `Frame`→`FrameProcessor`체인
- 두 가지 흐름 방향:
  - **DOWNSTREAM** 소스 → 싱크 (음성 입력, TTS 출력)
  - **UPSTREAM** 피드백과 제어 ( 취소, 측정, 바지인)
- `PipelineTask`이벤트와 함께 생활주기를 관리 (`on_pipeline_started``on_pipeline_finished``on_idle_timeout`) 및 측정/ 추적/RTVI의 관찰자

전형적인 파이프라인:

```
VAD (Silero) → STT → LLM (context alternates user/assistant) → TTS → transport
```

운송: 매일, 라이브키트, 스몰웹RTC트랜스포트, 패스트API 웹소켓, 왓츠앱.

피펙트 플로우는 구조화된 대화 (국립 기계) 를 추가합니다. 피펙트 클라우드는 관리되는 실행 시간입니다.

### 라이브킷 에이전트 (livekit/agent)

- 웹RTC를 통해 AI 모델을 사용자에게 연결합니다.
- 주요 개념:`Agent``AgentSession``entrypoint``AgentServer`- 그래
- 두 개의 음성 에이전트 수업:
  - **MultimodalAgent** OpenAI 실시간 또는 동등한 실시간으로 직접 오디오를 전송합니다.
  - **VoicePipelineAgent** STT → LLM → TTS 카스케이드; 텍스트 레벨 제어 기능을 제공합니다.
- 트랜스포머 모델로 의미 회전 검출
- 네이티브 MCP 통합
- SIP를 통해 전화
- 라이브킷 인퍼런스를 통해 API 키가 없는 50+ 모델, 플러그인을 통해 200+ 더 많은 모델.

### 상업 플랫폼

Vapi (~ 450600ms 최적화된 프리미엄 스택) 와 Retell (~ 600ms 180개의 테스트 호출에서 끝에서 끝으로) 이 모두 위에 구축되어 있습니다. WebRTC 팀 없이 관리되는 음성 스택을 원하는 경우 플랫폼을 선택하십시오.

### 이 패턴이 잘못되는 곳

- **No barge-in handling.**사용자가 중단하고 에이전트가 계속 이야기합니다. UPSTREAM이 라이브키트에서 동등한 피펙트 프레임을 취소하도록 요구합니다.
- **STT confidence ignored.**신뢰도 낮은 기록이 마치 복음처럼 LLM에 전달됩니다. 신뢰도 Gate 또는 확인 요청.
- **TTS mid-sentence cutoff.**파이프라인이 중음력 중간에 취소되면 TTS는 오디오를 알고 또는 끊어야 합니다.
- **Latency budget ignored.**각 부품은 50~200ms를 더합니다. 배송 전에 체인을 합시다.

### 전형적인 2026년 지연

- VAD: 20~60ms
- STT 부분: 100250ms
- LLM 첫 번째 토큰: 150400ms
- TTS 첫 음향: 100~200ms
- 운송 RTT: 3080ms

엔드-투-엔드 450~600ms는 프리미엄입니다. 800~1200ms는 일반적입니다. 1500ms 이상이면 깨진 느낌입니다.

```figure
voice-pipeline
```

## 건설 해

`code/main.py`프레임 기반의 장난감 파이프라인으로,

- `Frame`타입 (음성, 표본, 텍스트, tts_audio, 제어).
- `Processor``process(frame)`- 그래
- 스크립트 프로세서로서 5단계 파이프라인 (VAD → STT → LLM → TTS → 운송)
- 을 표시하는 UPSTREAM 취소 프레임

실행하세요:

```
python3 code/main.py
```

흔적이 정상 흐름과 TTS 중출을 막는 바르지인 취소를 보여줍니다.

## 사용 하 고

- **Pipecat**전체 제어  사용자 지정 프로세서, 파이썬-첫, 플러그블 제공자.
- **LiveKit Agents**웹RTC-처음 배치 및 전화기
- **Vapi / Retell**WebRTC 팀 없이 호스트 된 음성 에이전트
- **OpenAI Realtime / Gemini Live**직접 오디오 입력/오디오 출력 (MultimodalAgent)

## 선박

`outputs/skill-voice-pipeline.md`VAD + STT + LLM + TTS + 운송 + 바지인 조작을 위한 피펙트 모양의 음성 파이프라인을 구축합니다.

## 운동

1. 장난감 파이프라인에 매트릭스 관찰자를 추가합니다. 초당 단계에 프레임을 계산합니다.
2. 신뢰성 경호 STT를 구현: 열기 이하에서 "그것을 반복할 수 있나요?"
3. 의미적 회전 탐지 추가: 간단한 규칙  만약 회전 문자가 "?", "회전 끝"으로 끝나면.
4. 피펙트의 운송 문서들을 읽어 보세요. stdlib 운송을 SmallWebRTCTransport 구성 (stub) 로 교환하세요.
5. 같은 질의에서 OpenAI 실시간 대 STT+LLM+TTS 카스카드를 측정합니다. 텍스트 레벨 제어에는 얼마나 많은 지연 비용이 발생합니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Frame | "Event" | Typed unit of data in the pipeline (audio, transcript, text, control) |
| Processor | "Pipeline stage" | Handler with process(frame) |
| DOWNSTREAM | "Forward flow" | Source to sink: audio in, speech out |
| UPSTREAM | "Feedback flow" | Control: cancel, metrics, barge-in |
| VAD | "Voice activity detection" | Detects when user is speaking |
| Semantic turn detection | "Smart end-of-turn" | Model-based decision that the user is done |
| MultimodalAgent | "Direct audio agent" | Audio in, audio out; no text in the middle |
| VoicePipelineAgent | "Cascade agent" | STT + LLM + TTS; text-level control |

## 더 많은 읽기

- [Pipecat docs](https://docs.pipecat.ai/getting-started/introduction) 프레임 기반 파이프라인, 프로세서, 운송
- [LiveKit Agents docs](https://docs.livekit.io/agents/) WebRTC + 음성 원시
- [Vapi](https://vapi.ai/) 관리되는 음성 플랫폼
- [Retell AI](https://www.retellai.com/) 관리된 음성, 지연 기준
