# 스트리밍 언어-언어  모시, 히비키, 그리고 전체 두글 대화

> 2024-2026년 음성 인공지능을 재정립하였다. 모시는 200 ms 지연으로 동시에 듣고 말하는 단일 모델을 배포하였다. 히비키는 음성-언어 번역을 조각-중-중으로 한다. 두 사람은 미미 코덱 토큰에 대한 통합된 풀-두플렉스 아키텍처를 위해 ASR → LLM → TTS 파이프라인을 포기하였다. 이것은 새로운 참조 디자인이다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 13 (Neural Audio Codecs), Phase 6 · 11 (Real-Time Audio), Phase 7 · 05 (Full Transformer)
**Time:** ~75 minutes

## 문제

11+12 수업에서 만들어진 모든 음성 에이전트는 300-500 ms의 기본 지연 수준을 가지고 있습니다. VAD 화재, STT 프로세스, LLM 이유, TTS 생성. 각 단계는 자신의 최소한의 지연 시간을 가지고 있습니다. 당신은 조정 및 평행화 할 수 있습니다, 그러나 파이프 라인 모양은 당신을 뚜렷하게 제한합니다.

모시 (쿠타이, 2024-2026) 는 다른 질문을 던집니다. 파이프라인이 없다면 어떻게 될까요? 어떤 모델이 오디오를 입력하고 오디오를 직접, 지속적으로 전송한다면요?

답은**full-duplex speech-to-speech**이론적 지연시간 160 ms (미미 프레임 80 ms + 음향 지연 80 ms) L4 GPU에서 실질적인 지연시간 200 ms.

## 개념

![Moshi architecture: two parallel Mimi streams + inner-monologue text](../assets/moshi-hibiki.svg)

### 모시 건축물

**Inputs.**두 개의 미미 코덱 스트림, 둘 다 12.5 Hz × 8 코드북:

- 스트림 1: 사용자 오디오 (미미 코딩, 지속적으로 도착)
- 스트리트 2: 모시의 오디오 (모시 제작)

**The transformer.**7B 매개 변수 시간 변환기는 스트림과 텍스트 "내용 모놀로그" 스트림을 모두 처리합니다. 각 80 ms 단계에서는

1. 최신 사용자 미미 토큰 (8 코드북) 을 소비합니다.
2. 가장 최근의 모시 미미 토큰 (8개의 코드북, 생산된 대로) 를 소비한다.
3. 다음 모시 텍스트 토큰 (내용 모놀로그) 을 생성합니다.
4. 다음 모시 미미 토큰 (8 개의 코드북을 작은 딥 트랜스포머를 통해 생성합니다).

세 스트림 모두 사용자 오디오, 모시 오디오, 모시 텍스트, 모시 텍스트가 병렬으로 실행됩니다. 모시는 사용자가 말하는 동안 사용자 소리를 들을 수 있습니다. 사용자가 중단 할 때 자신을 중단 할 수 있습니다. 주요 발음을 깨지 않고 백 채널 ("mhm") 를 할 수 있습니다.

**The depth transformer.**프레임 내에서 8개의 코드북은 평행적으로 예측되지 않습니다. 그들은 코드북 간 의존성을 가지고 있습니다. 작은 2층 "깊음 변환기"는 80 ms 이내에 순차적으로 예측합니다. 이것은 AR 코덱 LMs (VALL-E, VibeVoice) 에서도 사용되는 표준 인산화입니다.

### 왜 내적 단편 문서는 도움이 되는가

명시적인 텍스트가 없으면 모델은 암시적으로 어휘를 음향 스트림에 모델링해야 합니다. 모시의 통찰력: 오디오와 함께 텍스트 토큰을 발송하도록 강요합니다. 텍스트 스트림은 기본적으로 모시가 말하는 것의 전개입니다. 이것은 의미적 일관성을 향상시키고 언어 모델 헤드를 교환하는 것을 더 쉽게 만들고, 전개물을 무료로 제공합니다.

### 히비키: 스트리밍 음성에서 음성으로 번역

동일한 아키텍처, 번역 쌍에서 훈련. 소스 오디오, 목표 언어 오디오, 지속적으로. Hibiki-Zero (2026년 2월) 는 단어 수준의 조선 훈련 데이터의 필요성을 제거합니다.

초기에는 4개의 언어쌍이 지원되어 있으며, 1000시간으로 새로운 언어로 적응할 수 있습니다.

### 더 넓은 키우타이 스택 (2026)

- **Moshi**  듀플렉스 대화 (프랑스어 먼저, 영어 지원이 잘 되어)
- **Hibiki / Hibiki-Zero** 동시 음성 번역
- **Kyutai STT** 스트리밍 ASR (500 ms 또는 2.5s 전향)
- **Kyutai Pocket TTS** 100M-파라임 TTS는 CPU에서 실행된다 (2026년 1월)
- **Unmute** 공공 서버에서 이 2가지의 결합을 하는 전체 파이프라인

L40S GPU의 처리량: 3x 실시간으로 64개의 동시 세션

### 세사임 CSM  사촌

세사임 CSM (2025) 는 미미 코덱 헤드 (Mimi codec head) 을 가진 Llama-3 척추를 비슷한 아이디어를 사용합니다. 그러나 CSM는 전체 듀플렉스보다는 단일 방향 (콘텍스트 + 텍스트를 취하고 음성을 생산합니다). 시장에서 가장 좋은 "소음 존재" TTS입니다. 모시의 전체 듀플렉스 기능과 완전히 동일하지 않습니다.

### 2026 성능 번호

| Model | Latency | Use case | License |
|-------|---------|----------|---------|
| Moshi | 200 ms (L4) | full-duplex English / French dialogue | CC-BY 4.0 |
| Hibiki | 12.5 Hz framerate | French ↔ English streaming translation | CC-BY 4.0 |
| Hibiki-Zero | same | 5 language-pairs, no aligned data | CC-BY 4.0 |
| Sesame CSM-1B | 200 ms TTFA | context-conditioned TTS | Apache-2.0 |
| GPT-4o Realtime | ~300 ms | closed, OpenAI API | commercial |
| Gemini 2.5 Live | ~350 ms | closed, Google API | commercial |

```figure
sp-fullduplex
```

## 건설 해

### 단계 1: 인터페이스

모시는 웹소켓 서버를 노출시켜 미미 코딩된 오디오의 80mns의 조각을 가져다가 미미 코딩된 오디오의 80mns의 조각을 반환합니다.

```python
import asyncio
import websockets
from moshi.client_utils import encode_audio_mimi, decode_audio_mimi

async def moshi_chat():
    async with websockets.connect("ws://localhost:8998/api/chat") as ws:
        mic_task = asyncio.create_task(stream_mic_to(ws))
        spk_task = asyncio.create_task(stream_from_to_speaker(ws))
        await asyncio.gather(mic_task, spk_task)
```

### 단계 2: 전체 듀플렉스 루프

```python
async def stream_mic_to(ws):
    async for chunk_80ms in mic_stream_at_12_5_hz():
        mimi_tokens = encode_audio_mimi(chunk_80ms)
        await ws.send(serialize(mimi_tokens))

async def stream_from_to_speaker(ws):
    async for msg in ws:
        mimi_tokens, text_token = deserialize(msg)
        audio = decode_audio_mimi(mimi_tokens)
        await play(audio)
```

두 방향 모두 동시에 실행됩니다. 파이썬 아시언시오 또는 러스트 선물은 표준 운송입니다.

### 단계 3: 교육 목표 (설계적)

80 ms 프레임마다`t`이 부분의 본문은

- 입력:`user_mimi[0..t]``moshi_mimi[0..t-1]``moshi_text[0..t-1]`
- 예측:`moshi_text[t]`그럼`moshi_mimi[t, codebook_0..7]`

텍스트는 오디오 (내용 모놀로그) 이전에 예측된다. 오디오는 깊이 변환기 내에서 코드북 순서로 예측된다.

### 4단계: 모시가 승리하고, 그렇지 않은 곳

모시가 승리:

- 저비용 하드웨어에서 250 ms의 스탠드-투-엔드
- 자연스러운 백채널과 방해
- 파이프라인  코드가 없습니다.

모시는 승리하지 않습니다.

- 도구 호출 (이용 훈련이 없습니다; 당신은 별도의 LLM 경로를 필요로 합니다).
- 긴 논리 (모시는 8B의 대화 모델이고 클로드/GPT-4가 아닙니다).
- 틈새 주제에 대한 사실적 정확성
- 대부분의 생산기업 사용 사례 (2026년에도 파이프라인을 사용한다).

## 사용 하 고

| Situation | Pick |
|-----------|------|
| Lowest-latency voice companion | Moshi |
| Live translation call | Hibiki |
| Voice demo / research | Moshi, CSM |
| Enterprise agent with tools | Pipeline (Lesson 12), not Moshi |
| Custom-voice TTS in context | Sesame CSM |
| Speech-to-speech, any languages | GPT-4o Realtime or Gemini 2.5 Live (commercial) |

## 함정

- **Limited tool calling.**모시는 대화 모델이 아니라 에이전트 프레임워크입니다. 도구의 파이프라인과 결합합니다.
- **Specific-voice conditioning.**모시는 훈련된 단 하나의 인물을 사용합니다. 복제하는 것은 별도의 훈련입니다.
- **Language coverage.**프랑스어 + 영어는 훌륭하지만 다른 언어는 제한적입니다. Hibiki-Zero는 도움이 되지만, 여전히 훈련 데이터가 필요합니다.
- **Resource cost.**전체 모시 세션에는 GPU 슬롯이 있습니다. 저렴한 공유 임차용 배포 패턴이 아닙니다.

## 선박

`outputs/skill-duplex-pipeline.md`음성 에이전트 작업 부하에 파이프라인과 풀 듀플렉스 아키텍처를 선택하세요.

## 운동

1. **Easy.**달아`code/main.py`그것은 상징적으로 2류 + 내 모놀로그 아키텍처를 시뮬레이션합니다.
2. **Medium.**모시를 HuggingFace에서 꺼내서 서버를 실행해 한 번의 대화를 테스트해 내면 시계를 측정해
3. **Hard.**12강 파이프라인 에이전트를 가져와 20개의 일치된 테스트 진술에 대해 P50 지연률과 Moshi를 비교해 보세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Full-duplex | Hear-and-speak at once | Two audio streams active simultaneously on the same model. |
| Inner monologue | Model's text stream | Moshi emits text tokens alongside its audio output. |
| Depth transformer | Inter-codebook predictor | Small transformer that predicts 8 codebooks within one 80 ms frame. |
| Mimi | Kyutai's codec | 12.5 Hz × 8 codebooks; semantic+acoustic; powers Moshi. |
| Streaming S2S | Audio → audio live | Chunk-by-chunk translation/dialogue, no pipeline stages. |
| Back-channeling | "Mhm" reactions | Moshi can emit small acknowledgments without breaking its turn. |

## 더 많은 읽기

- [Défossez et al. (2024). Moshi — speech-text foundation model](https://arxiv.org/html/2410.00037v2)- 신문
- [Kyutai Labs (2026). Hibiki-Zero](https://arxiv.org/abs/2602.12345) 조화 된 데이터 없이 스트리밍 번역
- [Sesame (2025). Crossing the uncanny valley of voice](https://www.sesame.com/research/crossing_the_uncanny_valley_of_voice) CSM 사양
- [Kyutai — Moshi repo](https://github.com/kyutai-labs/moshi) 설치 + 서버
- [OpenAI — Realtime API](https://platform.openai.com/docs/guides/realtime) 폐쇄적인 상업적 동급
- [Kyutai — Delayed Streams Modeling](https://github.com/kyutai-labs/delayed-streams-modeling) 뚜 아래의 STT/TTS 프레임워크.
