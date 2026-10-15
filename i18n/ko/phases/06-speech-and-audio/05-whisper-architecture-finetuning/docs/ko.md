#  건축 & 정교 조정

> Whisper는 30초짜리 창 변환기 앵코더-독호기, 680k 시간 동안 다국어 약하게 감독되는 오디오 텍스트 쌍을 훈련시킵니다. 하나의 아키텍처, 여러 작업, 99개 언어로 견고합니다. 2026 참조 ASR.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 5 · 10 (Attention), Phase 7 · 05 (Full Transformer)
**Time:** ~75 minutes

## 문제

2022년 9월 오픈AI에서 출시한 와이퍼는 오디오를 붙여넣기, 텍스트를 얻는, 99개의 언어, 노이즈에 견고하며 노트북에서 실행되는 최초의 ASR 모델이다. 2024년까지 오픈AI는 래지-v3와 터보 버전을 배포했다. 2026년까지, 와이퍼는 포드캐스트 전개서에서 음성 보조자, 유튜브 자막까지 모든 것에 기본 기본 기본 기준이다.

하지만 윙어리는 영원히 블랙박스처럼 취급할 수 있는 파이프라인이 아닙니다. 도메인 셔프는 그것을 죽인다. 기술적인 용어, 스피커의 억양, 적절한 명자, 짧은 클립, 침묵.

1. 실제로 내부에 있는 것.
2. 어떻게 잘 된 오디오를 쪼개서, 스트리밍, 또는 장편으로 전달할 수 있는지
3. 언제 어떻게 정렬해야 하는지

## 개념

![Whisper encoder-decoder, tasks, chunked inference, fine-tune](../assets/whisper.svg)

**Architecture.**표준 트랜스포머 앵코더-덱코더

- 입력: 30초 로그멜 스펙트럼, 80mels, 10ms hop → 3000 프레임. 클립 더 짧은 클립은 제로 패드, 클립 더 긴 조각입니다.
- 코더: conv-downsample (단계 2) + `N`변압기 블록, 대 3층, 1280층, 20개의 헤드
- 디코더:`N`변조기 블록은 인과성 자기-전환 + 코더 출력으로 교차적 인 인 연결이 있습니다.
- 출력: 51,865개의 토큰의 단어에 BPE 토큰

Large-v3는 1.55B 파라마를 가지고 있다. 터보는 4층 디코더를 사용한다 (32개에서), <1% WER 히트로 8x 지연을 절감한다.

**The prompt format.**Whisper는 디코더 프롬프트에서 특별한 토큰으로 제어되는 멀티태스킹 모델입니다.

```
<|startoftranscript|><|en|><|transcribe|><|notimestamps|> Hello world.<|endoftext|>
```

- `<|en|>` 언어 태그; 번역과 번역 행동을 강요합니다.
- `<|transcribe|>`또는`<|translate|>` 영어 출력을 어떤 언어 입력에서 번역하거나 말 그대로 번역합니다.
- `<|notimestamps|>` 단어 레벨 타임 스탬프를 건너뛰기 (더 빨리).

프롬프트는 하나의 모델이 여러 작업을 수행할 수 있게 해주는 것입니다. 변경 `<|en|>` `<|fr|>`그리고 프랑스어로 번역합니다.

**30-second window.**모든 것이 30초에 고정되어 있습니다. 더 긴 클립은 쪼개야 합니다. 더 짧은 클립은 입니다. 윈도우는 원천적으로 스트리밍되지 않습니다.

**Log-mel normalization.** `(log_mel - mean) / std`위스퍼의 훈련 코퍼스에서 얻은 통계 자료입니다.`whisper.audio.log_mel_spectrogram`), 아니 `librosa.feature.melspectrogram`- 그래

### 2026 년 에 변종

| Variant | Params | Latency (A100) | WER (LibriSpeech-clean) |
|---------|--------|----------------|------------------------|
| Tiny | 39M | 1× realtime | 5.4% |
| Base | 74M | 1× | 4.1% |
| Small | 244M | 1× | 3.0% |
| Medium | 769M | 1× | 2.7% |
| Large-v3 | 1.55B | 2× | 1.8% |
| Large-v3-turbo | 809M | 8× | 1.58% |
| Whisper-Streaming (2024) | 1.55B | streaming | 2.0% |

### 미세조

2026년 캐논िकल 작업 흐름:

1. 소속된 기록으로 10~100시간의 대상 영역 오디오를 수집합니다.
2. 달아`transformers.Seq2SeqTrainer``generate_with_loss`다시 전화해
3. 매개 변수 효율: LoRA `q_proj``k_proj``v_proj`주의층의 GPU 메모리를 4x로 줄이는 WER 비용 < 0.3
4. 10시간 이상만 있으면 코더를 얼어붙이세요. 디코더만 조정하세요.
5. Whisper의 자체 토큰화 및 프롬프트 형식을 사용하세요; 토큰화 교환을 해서는 안됩니다.

지역사회 결과: 정교한 조정 의료 명령 20시간의 중간 사용은 의료 어휘의 WER를 12%에서 4.5%로 떨어뜨립니다.

```figure
sp-asr-attention
```

## 건설 해

### 단계 1: 박스 밖으로 휘스퍼를 실행

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe(
    "clip.wav",
    language="en",
    task="transcribe",
    temperature=0.0,
    condition_on_previous_text=False,  # prevents runaway repetition
)
print(result["text"])
for seg in result["segments"]:
    print(f"[{seg['start']:.2f}–{seg['end']:.2f}] {seg['text']}")
```

항상 삭제해야 하는 기본 오류: `temperature=0.0`(실본상값을 0.0 → 0.2 → 0.4 ...로  수 있습니다)`condition_on_previous_text=False`(체 환각 문제를 예방합니다)`no_speech_threshold=0.6`(음성 검출)

### 단계 2: 쪼개진 긴 형태

```python
# whisperx is the 2026 reference for long-form with word-level timestamps
import whisperx
model = whisperx.load_model("large-v3-turbo", device="cuda", compute_type="float16")
segments = model.transcribe("1hour.mp3", batch_size=16, chunk_size=30)
```

WhisperX는 (1) Silero VAD 게팅, (2) wav2vec 2.0를 통해 단어 레벨 조화를 추가하고, (3) 워크래킹을 통해`pyannote.audio`2026년 제작 전개용 작업마을

### 단계 3: 로라로 정렬

```python
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from peft import LoraConfig, get_peft_model

model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-large-v3-turbo")
lora = LoraConfig(
    r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"],
    lora_dropout=0.1, bias="none", task_type="SEQ_2_SEQ_LM",
)
model = get_peft_model(model, lora)
# model.print_trainable_parameters()  -> ~3M trainable / 809M total
```

다음엔 표준 트레이너 루프, 1000단계마다 체크포인트, WER로 수납을 평가합니다.

### 4단계: 각 층이 배운 내용을 확인하세요

```python
# Grab cross-attention weights during decode to see what the decoder attends to.
with torch.inference_mode():
    out = model.generate(
        input_features=features,
        return_dict_in_generate=True,
        output_attentions=True,
    )
# out.cross_attentions: layer × head × step × src_len
```

열지도를 통해 시각화하면 디코더 단계를 통해 디코더 프레임을 스캔하는 데 따라 디아그날 정렬을 볼 수 있습니다. 이 디아그날은 Whisper의 단어 타임스테이프 개념입니다.

## 사용 하 고

2026년 스택:

| Situation | Pick |
|-----------|------|
| General English, offline | Large-v3-turbo via `whisperx` |
| Mobile / edge | Whisper-Tiny quantized (int8) or Moonshine |
| Multilingual long-form | Large-v3 via `whisperx` + diarization |
| Low-resource language | Fine-tune Medium or Turbo with LoRA |
| Streaming (2 s latency) | Whisper-Streaming or Parakeet-TDT |
| Word-level timestamps | WhisperX (forced alignment via wav2vec 2.0) |

`faster-whisper`(CTranslate2 백엔드) 는 2026년 가장 빠른 CPU+GPU 추론 실행 시간입니다. 동일한 출력으로 바닐라보다 4x 더 빠르다.

## 2026 년에도 여전히 선박되는 함정이

- **Hallucinated text on silence.**캡션에 훈련된 휘스퍼에는 "보신 것에 감사해요!", "자료하세요!", 노래 가사가 포함되어 있습니다. 전화하기 전에 항상 VAD-gate.
- **`condition_on_previous_text` cascade.**한 가지 환각은 다음 창문을 오염시킵니다.`False`만약 당신이 덩어리들을 통해 유창한 것이 필요하지 않는다면
- **Short-clip padding.**2초짜리 클립을 30초로 면 후속 침묵에서 환각을 일으킬 수 있습니다.`pad=False`또는 VAD 게이트.
- **Wrong mel stats.**리브로사 이 아닌 휘스퍼를 사용하면 거의 무작위 출력을 생성합니다.`whisper.audio.log_mel_spectrogram`- 그래

## 선박

`outputs/skill-whisper-tuner.md`. 특정 도메인에서 Whisper 정교화 또는 추론 파이프라인을 설계합니다.

## 운동

1. **Easy.**달아`code/main.py`Whisper형의 명령어를 토큰화하고, 암호화된 모양 예산을 계산하고, 10분짜리 클립의 덩어리 스케줄을 인쇄합니다.
2. **Medium.**설치`faster-whisper`10분짜리 팟캐스트를 녹음하고 WER를 인간 녹음과 비교해 보세요.`language="auto"`강제`language="en"`- 그래
3. **Hard.**HF를 이용합니다`datasets`, Whisper가 사용하는 언어를 선택하고 (예: 우르두) 를 사용하며, 2시간 동안 2시 동안 Medium와 LoRA를 정밀하게 조정하고 WER 델타를 보고합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| 30-sec window | Whisper's limit | Hard input cap; chunk longer audio. |
| SOT | Start-of-transcript | `<\|startoftranscript\|>` kicks off the decoder prompt. |
| Timestamps token | Temporal alignment | Every 0.02 s offset is a special token in the 51k vocab. |
| Turbo | The fast variant | 4-decoder layers, 8× faster, <1% WER regression. |
| WhisperX | The long-form wrapper | VAD + Whisper + wav2vec alignment + diarization. |
| LoRA fine-tune | Efficient tuning | Add low-rank adapters to attention; train ~0.3% of params. |
| Hallucination | The silent failure | Whisper produces fluent English from noise/silence. |

## 더 많은 읽기

- [Radford et al. (2022). Whisper paper](https://arxiv.org/abs/2212.04356) 원래 건축과 훈련 레시피.
- [OpenAI (2024). Whisper Large-v3-turbo release](https://github.com/openai/whisper/discussions/2363)4층 디코더, 8배 가속화
- [Bain et al. (2023). WhisperX](https://arxiv.org/abs/2303.00747) 긴 형태, 단어와 일치, 일기화.
- [Systran — faster-whisper repo](https://github.com/SYSTRAN/faster-whisper)CTranslate2 지원, 4x 더 빠른.
- [HuggingFace — Whisper fine-tune tutorial](https://huggingface.co/blog/fine-tune-whisper) 정통 LoRA/Ft 통행
