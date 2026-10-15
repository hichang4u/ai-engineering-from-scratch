# 캡스톤 03  실시간 음성 보조 (ASR에서 LLM에서 TTS)

> 올바른 목소리 에이전트는 800ms 이하의 엔드-투-엔드 레이턴티를 가지고 있으며, 언제 말을 멈추는지 알고, 바지-인을 처리하고, 리텔, 비피, 라이브킷 에이전트, 피펙트는 모두 2026년에 이 바를 밟습니다. 그들은 같은 모양으로 합니다. 스트리밍 ASR, 턴 디테이터, 스트리밍 LLM, 스트리밍 TTS, 모두 WebRTC를 통해 연결되며, 하나 만들어 WER와 MOS를 측정하고 거짓 절감율을 측정하고 패킷 손실을 하에 실행합니다.

**Type:** Capstone
**Languages:** Python (agent + pipeline), TypeScript (web client)
**Prerequisites:** Phase 6 (speech and audio), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 17 (infrastructure)
**Phases exercised:**P6 · P7 · P11 · P13 · P14 · P17
**Time:** 30 hours

## 문제

음성은 2025~2026년 가장 빠르게 움직이는 AI UX 카테고리였습니다. 기술적인 천장은 4분마다 떨어졌습니다. OpenAI 실시간 API, Gemini 2.5 라이브, 카르테시아 소닉-2, 일레븐랩스 플래시 v3, 라이브킷 에이전트 1.0 및 피펙트 0.0.70 모두 800ms 이하의 첫 번째 오디오를 내놓았습니다. 바는 지연이 아닙니다. 그것은 상호작용의 느낌입니다. 사용자로 하여금 끊지 않고, 끊지 않고, 문장의 중간 중간에 방해가 된 것을 회복하고, 오디오를 멈추지 않고 대화 중간에 도구를 호출하고, 긴장된 모바일 네트워크를 생존하는 것입니다.

3개의 REST 호출을 꿰매서 거기에 도달할 수 없습니다. 구조는 끝에서 끝으로 스트리밍을 파이프라인으로 합니다. 그것을 구축하고 실패 모드가 눈에 띄게됩니다. 배경 TV에 전화 오디오 촬영을 위해 조정 된 VAD, 결코 오지 않는 점수를 기다리는 턴 디테커, 방출하기 전에 400ms를 버퍼하는 TTS. 최후의 목표는 로드 하에 한 번에 하나씩 수정하고 지연 및 품질 보고서를 게시하는 것입니다.

## 개념

파이프라인은 5개의 스트리밍 단계로 이루어져 있습니다.**audio in**(브라우저 또는 PSTN에서 웹RTC)**ASR**(Deepgram Nova-3 또는 더 빠른 속삭임에서 부분적인 전자를 스트리밍)**turn detection**(VAD와 괄호를 위한 부분적인 기록들을 읽는 작은 턴 디테커 모델)**LLM**(전환이 완료된 즉시 토큰을 스트리밍)**TTS**(첫 번째 LLM 토큰 이후 ~ 200ms 이내에 오디오 스트리밍)

3가지 간편한 문제점**Barge-in**: 사용자가 에이전트가 말하는 동안 말을 시작하면 TTS가 취소하고 ASR가 즉시 시작됩니다. **Tool use**: 대화 기능 중기의 호출 (기후, 달력) 은 오디오를 중단하지 않고 부방 채널에서 실행되어야 합니다. 만약 지연이 300ms를 초과한다면 에이전트는 미리 확인 토큰 ("1초...") 를 채우게 됩니다. **Backpressure**: 패킷 손실에 따라 부분적인 기록이 보관되고, VAD는 음성 게이트 문턱을 높이고, 에이전트는 인정되지 않은 메시지에 대해 말하는 것을 피합니다.

측정 바는 양적이다. 15 dB SNR에서 함밍 VAD 기준에서 WER는 8% 미만이다. 측정된 100 번의 호출에서 첫 번째 오디오 아웃 p50는 800ms 미만이다. 측정된 통화에서 3%. TTS에서 4.2 이상의 MOS. 단일 g5.xlarge에서 50 개의 동시 호출이 있습니다. 이러한 숫자는 전달됩니다.

## 건축

```
browser / Twilio PSTN
        |
        v
   WebRTC / SIP edge
        |
        v
  LiveKit Agents 1.0  (or Pipecat 0.0.70)
        |
   +----+--------------+--------------+-----------------+
   |                   |              |                 |
   v                   v              v                 v
  ASR              VAD v5         turn-detector     side-channel
(Deepgram         (Silero)          (LiveKit)        tools
 Nova-3 /         speech-gate    completion score    (weather,
 Whisper-v3)      per 20ms        on partials        calendar)
   |                   |              |
   +--------+----------+--------------+
            v
        LLM (streaming)
     GPT-4o-realtime / Gemini 2.5 Flash /
     cascaded Claude Haiku 4.5
            |
            v
        TTS streaming
     Cartesia Sonic-2 / ElevenLabs Flash v3
            |
            v
     audio back to caller
            |
            v
   OpenTelemetry voice traces -> Langfuse
```

## 

- 교통: 라이브킷 에이전트 1.0 (WebRTC) + 트위리오 PSTN 게이트웨이; 대체 프레임워크로 피펙트 0.0.70
- ASR: Deepgram Nova-3 (스트리밍, sub-300ms 첫 번째 부분) 또는 더 빠른 속삭임 Whisper-v3-turbo 자체 호스팅
- VAD: Silero VAD v5 플러스 라이브키트 회전 탐지기 (부부분적인 전자를 읽는 작은 변압기)
- LLM: 긴밀한 통합을 위한 OpenAI GPT-4o 실시간, Gemini 2.5 Flash Live, 또는 캐스케이드 클로드 하이쿠 4.5 (스트리밍 완료, 별도의 오디오 경로)
- TTS: 카르테시아 소닉-2 (최저 1바이트), ElevenLabs 플래시 v3, 또는 오프노스 오프레우스
- 도구: 날씨/예술/ 예약용 FastMCP 부근 채널; 도구가 300ms 이상으로 소요되는 경우 에이전트 사전 발급 필러
- 관찰 가능: OpenTelemetry 음성 스캔, 음향 재생으로 랭푸스 음성 흔적이
- 배포: 자체 호스팅된 Whisper + Orpheus에 대한 단일 g5.xlarge (24GB VRAM); 최저 지연기간에 대한 호스팅된 API

```figure
ce-voice-latency
```

## 건설 해

1. **WebRTC session.**라이브킷 방과 마이크 오디오 스트리밍을 제공하는 웹 클라이언트를 설치하고 서버에 에이젠트 작업자를 연결하여

2. **ASR streaming.**20ms PCM 프레임을 Deepgram Nova-3 (또는 GPU에 더 빠른 속삭임) 로 공급하십시오. 부분 및 최종 전개에 가입하십시오. 부분 지연 시간당 로그.

3. **VAD and turn detector.**프레임 스트림에서 Silero VAD v5를 실행하십시오. 음성 종료 이벤트에서 최신 부분 표본에 대한 LiveKit 회전 탐지기를 실행하십시오. VAD가 500ms 동안 침묵을 말하고 회전 탐지기가 완료> 0.6을 점수를 받을 때만 "완전"하도록 약속하십시오.

4. **LLM stream.**완료되면, 실행 대화와 최종 기록으로 LLM 전화를 시작하세요. 토큰을 스트리밍하세요. 첫 번째 토큰에서, TTS에 전달하세요.

5. **TTS stream.**카르테시아 소닉-2는 오디오 조각을 다시 스트리밍합니다. 첫 번째 조각은 첫 LLM 토큰으로부터 200ms 이내에 서버를 떠나야 합니다. LiveKit 방으로 조각을 전송합니다. 클라이언트는 WebRTC jitter 버퍼를 통해 재생합니다.

6. **Barge-in.**VAD가 TTS가 재생되는 동안 새로운 사용자 음성을 감지하면 TTS 스트림을 즉시 취소하고 나머지 LLM 출력을 떨어뜨리고 ASR를 다시 장착하십시오.`tts_canceled`스탠드

7. **Tool side channel.**기상 및 달력 기기를 함수 호출 도구로 등록하십시오. 호출되면 호출을 동시에 실행하십시오. 300ms 이내에 해결되지 않으면 LLM가 "하나 초, 확인하도록 해 주십시오"를 채용으로 발사하십시오. 도구가 반환되면 재개하십시오.

8. **Eval harness.**100번의 전화를 기록합니다. WER (어린이 기록에 대한 계산), 거짓 차단율 (이용자가 문장의 중간에있을 때 TTS를 취소), 첫 번째 오디오 종료 p50, TTS MOS (인간 또는 NISQA), 그리고 jitter-loss 테스트 (파킷의 3% 떨어뜨리십시오).

9. **Load test.**합성 호출기 (synthetic caller) 를 사용하여 단일 g5.xlarge에서 50 개의 동시 호출을 실행하십시오.

## 사용 하 고

```
caller: "what is the weather in tokyo tomorrow"
[asr  ] partial @280ms: "what is the"
[asr  ] partial @540ms: "what is the weather"
[turn ] completion score 0.82 at @820ms; commit
[llm  ] first token @960ms
[tool ] weather.tokyo tomorrow -> 68/52 partly cloudy @1140ms
[tts  ] first audio-out @1040ms: "Tokyo tomorrow will be partly cloudy..."
turn latency: 1040ms user-stop -> audio-out
```

## 선박

`outputs/skill-voice-agent.md`도메인 (고객 지원, 스케줄링 또는 키오스크) 을 고려하면, 그것은 측정 바에 조정된 ASR/VAD/LLM/TTS 파이프라인으로 라이브키트 에이전트를 나타냅니다.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | End-to-end latency | p50 first-audio-out under 800ms across 100 recorded calls |
| 20 | Turn-taking quality | False-cutoff rate under 3% on the Hamming VAD benchmark |
| 20 | Tool-use correctness | Mid-conversation tool calls that return the right data without stalling audio |
| 20 | Reliability under packet loss | WER and turn-taking stability with 3% packet drop injected |
| 15 | Eval harness completeness | Reproducible measurements with public config |
| **100** | | |

## 운동

1. G5.xlarge에서 더 빠른 속삭임 V3 터보를 위해 Deepgram Nova-3를 교환합니다. 지연과 WER 격차를 측정합니다. CPU와 GPU의 결정이 중요한 위치를 확인합니다.

2. 인터럽트-아브레이트 정책: 도구 호출 중 사용자가 침입할 때 에이전트가 어떻게 하는지를 추가하세요? 세 가지 정책을 비교하세요 (하드 취소, 픽업-툴-더스-스톱, 다음 차례에 줄을 서십시오).

3. 반대의 전환 탐지 테스트를 실행: 문장 중 사용자에게 긴 휴식을 부여합니다. 900ms를 넘지 않고 가장 낮은 거짓 차단을 위해 VAD 침묵 문턱과 전환 탐지기 점수 문턱을 조정하십시오.

4. 트위리오를 통해 PSTN에 동일한 에이전트를 배치하십시오. PSTN의 첫 번째 오디오 아웃을 WebRTC와 비교하십시오. jitter-buffer와 코덱의 차이를 설명하십시오.

5. 영어 (일본어, 스페인어) 이외의 언어에 음성 활동 검출을 추가합니다. Silero VAD v5의 거짓 트리거 비율을 언어별 정밀한 음향에 비교하여 측정합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Turn detection | "End of utterance" | Classifier that, given VAD silence and a partial transcript, decides the user is done speaking |
| Barge-in | "Interruption handling" | Canceling TTS mid-playback when VAD detects new user speech |
| First-audio-out | "Latency" | Time from user stops speaking to the first audio packet leaving the server |
| VAD | "Speech gate" | Model classifying audio frames as speech vs silence; Silero VAD v5 is the 2026 default |
| Jitter buffer | "Audio smoothing" | Client-side buffer that holds packets briefly to absorb network variance |
| Filler | "Acknowledgment token" | Short phrase the agent emits to avoid silence when a tool is slow |
| MOS | "Mean opinion score" | Perceptual speech quality rating; NISQA is the automated proxy |

## 더 많은 읽기

- [LiveKit Agents 1.0](https://github.com/livekit/agents) 참조 WebRTC 에이전트 프레임워크
- [Pipecat](https://github.com/pipecat-ai/pipecat) 대안 파이썬-첫 스트리밍 에이전트 프레임워크
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) 통합적인 음성 모델에 대한 참조
- [Deepgram Nova-3 documentation](https://developers.deepgram.com/docs) 스트리밍 ASR 참조
- [Silero VAD v5](https://github.com/snakers4/silero-vad) VAD 참조 모델
- [Cartesia Sonic-2](https://docs.cartesia.ai) 저 지연성 TTS 참조
- [Retell AI architecture](https://docs.retellai.com) 생산 음성 에이전트 아키텍처
- [Vapi.ai production stack](https://docs.vapi.ai) 대체 생산 기준
