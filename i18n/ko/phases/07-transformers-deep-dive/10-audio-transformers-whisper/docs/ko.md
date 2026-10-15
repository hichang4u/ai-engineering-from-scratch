# 오디오 트랜스포머  휘파람 건축

> 음성은 시간의 흐름에 따른 주파수의 이미지입니다. 휘파람은 멜 스펙트럼을 잡아내어 다시 말하는 ViT입니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 08 (Encoder-Decoder), Phase 7 · 09 (ViT)
**Time:** ~45 minutes

## 문제

와이스퍼 (OpenAI, Radford et al. 2022) 이전에는 최첨단 자동 음성 인식 (ASR) 은 wav2vec 2.0 및 HuBERT  자체 감독 기능 추출기 및 정렬 된 헤드를 의미했습니다. 고품질, 비싼 데이터 파이프라인, 도메인 부서지기. 다국어 음성 인식은 언어 가족마다 별도의 모델이 필요했습니다.

위스퍼는 세 가지 베팅을 했습니다.

1. **Train on everything.**인터넷에서 약 680만시간의 소음, 97개 언어로,
2. **Multi-task single model.**한 디코더는 작업 토큰을 통해 복사, 번역, 음성 활동 탐지, 언어 ID 및 타임 스탬핑에 공동으로 훈련되었습니다.
3. **Standard encoder-decoder transformer.**록메일 스펙트로그램을 사용하며, 디코더는 자동으로 텍스트 토큰을 생성합니다. vocoder, CTC, HMM는 없습니다.

결과는: Whisper large-v3는 0%의 깨끗한 레이블 데이터를 가진 억양, 잡음 및 언어에서 견고합니다. 2026 년 모든 오픈 소스 음성 보조 및 대부분의 상업용용용을위한 기본 음성 전면입니다.

## 개념

![Whisper pipeline: audio → mel → encoder → decoder → text](../assets/whisper.svg)

### 단계 1  재 샘플 + 창

16 kHz에서 오디오. 30초까지 클립/패드. 로그-메일 스펙트럼을 계산: 80 메일 빈, 10 ms 단계 → ~3,000 프레임 × 80 기능. 이것은 위스퍼가 보는 "인पुट 이미지"입니다.

### 단계 2      

커널 3와 스테이드 2의 2개의 컨브1D 레이어는 3,000개의 프레임을 1500개로 줄이고, 많은 매개 변수를 추가하지 않고서

### 단계 3  코더

24층 (큰용) 트랜스포머 앵코더 1500 시간 단계 이상. 시누사이드 위치 앵코딩, 자기 주의, GELU FFN. 1,500 × 1,280 숨겨진 상태를 생성합니다.

### 단계 4  디코더

24층 트랜스포머 디코더. 그것은 오디오 특유의 몇 가지 특수 토큰으로 GPT-2의 초집합인 BPE 어휘에서 토큰을 자동으로 생성합니다.

### 단계 5  작업 토큰

디코더 명령어는 모델에 무엇을 해야 하는지 알려주는 제어 토큰으로 시작합니다.

```
<|startoftranscript|>  <|en|>  <|transcribe|>  <|0.00|>
```

또는

```
<|startoftranscript|>  <|fr|>  <|translate|>   <|0.00|>
```

이 모델은 이 컨벤션에서 훈련되었습니다. 당신은 직역을 사전으로 제어합니다. 2026의 명령 조율과 동등하지만 연설에 적용됩니다.

### 단계 6  출력

로그-프로브 문턱을 가진 반지 검색 (5 너비) 시간표는 오디오의 0.02 초마다 예측됩니다.`<|notimestamps|>`토큰이 없어

### 속삭이는 크기가

| Model | Params | Layers | d_model | Heads | VRAM (fp16) |
|-------|--------|--------|---------|-------|-------------|
| Tiny | 39M | 4 | 384 | 6 | ~1 GB |
| Base | 74M | 6 | 512 | 8 | ~1 GB |
| Small | 244M | 12 | 768 | 12 | ~2 GB |
| Medium | 769M | 24 | 1024 | 16 | ~5 GB |
| Large | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3 | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3-turbo | 809M | 32 | 1280 | 20 | ~6 GB (4-layer decoder) |

Large-v3-turbo (2024) 는 32층에서 <1 WER 포인트 회귀로 4.8x 더 빠른 디코딩으로 디코더를 줄였습니다. 이 디코딩 속도 해제가 Whisper-turbo가 2026 년 실시간 음성 에이전트에서 기본으로 된 이유입니다.

### 윙윙이 하지 않는 일

- 기기화도 안 돼, 피아노트와 조화를 해
- 실시간 스트리밍이 없습니다.`faster-whisper``WhisperX`) VAD+ 초복을 통해 스트리밍을 전개합니다.
- 30초 이상으로 장기적인 컨텍스트가 없습니다. 외부의 쪼개림 없이도 실제적으로 잘 작동합니다. 왜냐하면 인간의 언어는 복사하기 위해 장기적인 컨텍스트가 거의 필요하지 않기 때문입니다.

### 2026년 풍경

| Task | Model | Notes |
|------|-------|-------|
| English ASR | Whisper-turbo, Moonshine | Moonshine is 4× faster on edge |
| Multilingual ASR | Whisper-large-v3 | 97 languages |
| Streaming ASR | faster-whisper + VAD | 150 ms latency targets achievable |
| TTS | Piper, XTTS-v2, Kokoro | Encoder-decoder pattern, but Whisper-shaped |
| Audio + language | AudioLM, SeamlessM4T | Text tokens + audio tokens in one transformer |

```figure
n5-mel-decode
```

## 건설 해

보시다시피`code/main.py`우리는 Whisper를 훈련하지 않습니다. 우리는 로그 메일 스펙트럼 파이프라인을 + 작업 토큰 프롬프트 포맷을 만듭니다.

### 단계 1: 오디오를 합성

1초의 시노파를 440Hz에서 16kHz에서 샘플링합니다. 16,000개의 샘플입니다.

### 단계 2: 로그멜 스펙트럼 (편화)

전체 멜 스펙트럼은 FFT를 필요로 합니다. 우리는 파이프라인을 요구하지 않고 보여주는 프레임에 대한 에너지 버전 + 단순화된 프레임을 합니다.`librosa`이 부분의 본문은

```python
def frame_signal(x, frame_size=400, hop=160):
    frames = []
    for start in range(0, len(x) - frame_size + 1, hop):
        frames.append(x[start:start + frame_size])
    return frames
```

프레임 = 25 ms, hop = 10 ms. Whisper의 창과 일치합니다. 프레임에 대한 에너지는 교육의 멜 칸을 대신합니다.

### 단계 3: 30초에 패드

스피퍼는 항상 30초의 조각을 처리합니다. 스펙트럼을 3000 프레임으로 습니다.

### 단계 4: 프롬프트 토큰을 생성

```python
def whisper_prompt(lang="en", task="transcribe", timestamps=True):
    tokens = ["<|startoftranscript|>", f"<|{lang}|>", f"<|{task}|>"]
    if not timestamps:
        tokens.append("<|notimestamps|>")
    return tokens
```

4개의 도큰의 전두엽이 있습니다.

## 사용 하 고

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("meeting.wav", language="en", task="transcribe")
print(result["text"])
print(result["segments"][0]["start"], result["segments"][0]["end"])
```

더 빠르고 OpenAI 호환 가능:

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3-turbo", compute_type="int8_float16")
segments, info = model.transcribe("meeting.wav", vad_filter=True)
for s in segments:
    print(f"{s.start:.2f} - {s.end:.2f}: {s.text}")
```

**When to pick Whisper in 2026:**

- 한 모델로 다국어 ASR
- 험난하고 다양한 오디오의 강력한 전개
- 연구/ 프로토타입 ASR  가장 빠른 출발점

**When to pick something else:**

- 가장자리에 스트리밍하는 초저연속  월샤인
- 실시간 대화 AI가 필요한 <200 ms  전용 스트리밍 ASR
- 스피커 다이어리징   스피퍼는 이것을 하지 않습니다.

## 선박

보시다시피`outputs/skill-asr-configurator.md`. 기술은 ASR 모델, 디코딩 매개 변수, 그리고 새로운 음성 응용 프로그램에서 사전 처리 파이프라인을 선택합니다.

## 운동

1. **Easy.**달아`code/main.py`16kHz에서 1초 신호를 확인해 10ms hop은 ~100 프레임입니다. 30초 동안: ~3,000 프레임입니다.
2. **Medium.**로그 메일 스펙트럼을 전체로 구성하여 `numpy.fft`80개의 메일빈이 일치하는지 확인해`librosa.feature.melspectrogram(n_mels=80)`숫자의 오류 내에서
3. **Hard.**스트리밍 추론을 구현: 2 시 초복되는 10 시의 창으로 오디오 조각을 실행, 각 조각에 휘스퍼를 실행, 각 조각에 녹음을 통합. 5 분짜리 팟캐스트 샘플에서 단어 오류 비율을 측정하고 단일 패스를 측정합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Mel spectrogram | "Audio image" | 2D representation: frequency bins on one axis, time frames on the other; log-scaled energy per cell. |
| Log-mel | "What Whisper sees" | Mel spectrogram passed through log; approximates human perception of loudness. |
| Frame | "One time slice" | A 25 ms window of samples; overlapping at 10 ms stride. |
| Task token | "Prompt prefix for speech" | Special tokens like `<\|transcribe\|>` / `<\|translate\|>` in the decoder prompt. |
| Voice activity detection (VAD) | "Find the speech" | Gate that removes silence before ASR; cuts cost massively. |
| CTC | "Connectionist Temporal Classification" | Classic ASR loss for alignment-free training; Whisper does NOT use it. |
| Whisper-turbo | "Small decoder, full encoder" | large-v3 encoder + 4-layer decoder; 8× faster decoding. |
| Faster-whisper | "The production wrapper" | CTranslate2 reimplementation; int8 quantization; 4× faster than OpenAI's reference. |

## 더 많은 읽기

- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356)      
- [OpenAI Whisper repo](https://github.com/openai/whisper) 참조 코드 + 모델 무게.`whisper/model.py`Conv1D 줄기 + 코더 + 디코더를 아래쪽에서 아래쪽으로 400 줄로 볼 수 있습니다.
- [OpenAI Whisper — `whisper/decoding.py`](https://github.com/openai/whisper/blob/main/whisper/decoding.py) 단계 56에서 설명된 빔 검색 + 작업 토큰 논리는 여기 있습니다. 500 줄, 완전히 읽을 수 있습니다.
- [Baevski et al. (2020). wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations](https://arxiv.org/abs/2006.11477) 선구자; 일부 설정에서는 여전히 SOTA 기능이 있습니다.
- [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) 생산 포장재, 참조보다 4x 더 빠르다.
- [Jia et al. (2024). Moonshine: Speech Recognition for Live Transcription and Voice Commands](https://arxiv.org/abs/2410.15608) 2024 엣지 친화적인 ASR, 휘어 모양이지만 작습니다.
- [HuggingFace blog — "Fine-Tune Whisper For Multilingual ASR with 🤗 Transformers"](https://huggingface.co/blog/fine-tune-whisper) 메일 스펙트로그램 사전 처리 장치 및 토큰 타임 스탬프 처리 장치 등 가공적인 정렬 요리법
- [HuggingFace `modeling_whisper.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/whisper/modeling_whisper.py) 수업의 건축 다이어그램을 반영하는 완전한 구현 (코더, 디코더, 크로스-아트런스, 생성).
