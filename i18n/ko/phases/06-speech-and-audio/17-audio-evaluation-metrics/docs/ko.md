# 오디오 평가  WER, MOS, UTMOS, MMAU, FAD, 그리고 오픈 레인더보드

> 측정할 수 없는 것을 전송할 수 없습니다. 이 수업은 각 오디오 작업에 대한 2026 메트릭을 지정합니다. ASR (WER, CER, RTFx), TTS (MOS, UTMOS, SECS, WER-on-ASR-round-trip), 오디오 언어 (MMAU, LongAudioBench), 음악 (FAD, CLAP), 스피커 (EER).

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 06, 07, 09, 10; Phase 2 · 09 (Model Evaluation)
**Time:** ~60 minutes

## 문제

모든 오디오 작업에는 여러 가지 측정값이 있습니다. 각 값은 다른 축을 측정합니다. 잘못된 측정값을 사용하면 대시보드에 훌륭하게 보이는 모델을 전송하는 방법입니다. 그리고 생산에 끔찍합니다. 2026의 규격 목록:

| Task | Primary | Secondary |
|------|---------|-----------|
| ASR | WER | CER · RTFx · first-token latency |
| TTS | MOS / UTMOS | SECS · WER-on-ASR-round-trip · CER · TTFA |
| Voice cloning | SECS (ECAPA cosine) | MOS · CER |
| Speaker verification | EER | minDCF · FAR / FRR at operating point |
| Diarization | DER | JER · speaker confusion |
| Audio classification | top-1 · mAP | macro F1 · per-class recall |
| Music generation | FAD | CLAP · listening panel MOS |
| Audio language model | MMAU-Pro | LongAudioBench · AudioCaps FENSE |
| Streaming S2S | latency P50/P95 | WER · MOS |

## 개념

![Audio evaluation matrix — metrics vs tasks vs 2026 leaderboards](../assets/eval-landscape.svg)

### ASR 측정

**WER (Word Error Rate).** `(S + D + I) / N`- 작자, 띠 문호, 점수를 받기 전에 숫자를 정상화하라`jiwer`또는 OpenAI의`whisper_normalizer`. &lt;5% = 인간평등 읽기 언어

**CER (Character Error Rate).**동일한 공식, 문자 수준. 단어 세그먼트가 모호한 음향 언어 (만다린, 칸토네스어) 에 사용됩니다.

**RTFx (inverse real-time factor).**음향초는 벽 시계 초당 처리됩니다. 더 높으면 더 좋습니다. 파라키트-TDT는 3380x에 도달합니다.

**First-token latency.**오디오 입력에서 첫 번째 표본 토큰까지의 벽 시계. 스트리밍에 중요합니다.

### TTS 측정

**MOS (Mean Opinion Score).**1-5인류 평점 금 표준이지만 느린 샘플마다 20명 이상의 청취자를 수집하고 모델마다 100명 이상의 샘플을 수집합니다

**UTMOS (2022-2026).**학습된 MOS 예측기. 표준 기준에 인간 MOS와 0.9 정도 상관관계가 있습니다. F5-TTS: UTMOS 3.95; 기본 진실: 4.08.

**SECS (Speaker Encoder Cosine Similarity).**음성 클론링을 위해. ECAPA 참조 및 클론 출력 사이에 코시네를 삽입합니다. &gt; 0.75 = 인식 가능한 클론.

**WER-on-ASR-round-trip.**TTS 출력에서 Whisper를 실행하고 입력 텍스트에 WER를 계산합니다. 이해력 회귀를 잡습니다. 2026 SOTA: &lt; 2% CER.

**TTFA (time-to-first-audio).**벽 시계 지연시간: KOKORO-82M: ~100 ms; F5-TTS: ~1s

### 음성 복제 특성

**SECS + MOS + CER**높은 SECS, 낮은 MOS를 가진 클론은 음색이 옳지만 자연스럽지 않은 것을 의미하며, 반대는 자연스러운 음색이지만 잘못된 스피커를 의미합니다.

### 스피커 확인

**EER (Equal Error Rate).**거짓 수용률이 거짓 거부율과 같을 수 있는 임계값.

**minDCF (min Detection Cost).**선택된 운영 지점에서 중계된 비용 (일반적으로 FAR=0.01).

### 수염증

**DER (Diarization Error Rate).** `(FA + Miss + Confusion) / total_speaker_time`. 실종된 음성 + 거짓 알람 음성 + 스피커- 혼동, 각각 분자. AMI 회담: DER ~ 10-20%는 현실적입니다. pyannote 3.1 + Precision-2 광고: &lt;10% DER 잘 녹음된 오디오.

**JER (Jaccard Error Rate).**DER에 대한 대안으로, 단분간 편향에 대한 견고한

### 오디오 분류

다중표: **mAP (mean Average Precision)**모든 클래스 에 적용 됩니다. 오디오셋: BEATs-iter3 에 0.548 mAP

복합급 전용: **top-1, top-5 accuracy**. 음성 명령 v2: 99.0% 톱-1 (Audio-MAE).

불균형:**macro F1**+ **per-class recall**. 클래스별 보고  합적 정확도는 어떤 클래스가 실패하는지 숨깁니다.

### 음악 세대

**FAD (Fréchet Audio Distance).**VGGish 내장된 실제 음향 배포와 생성된 음향의 간격. MusicGen MusicCaps: 4.5. MusicLM: 4.0. 더 낮은 음향.

**CLAP Score.**CLAP 임베디션을 사용하여 텍스트-오디오 조렬 점수는. &gt; 0.3 = 합리적인 조율.

**Listening panel MOS.**소비자 음악의 마지막 단어입니다. TTS 아레나에서 Suno v5 ELO 1293 (인간의 선택에서)

### 오디오 언어 기준

**MMAU (Massive Multi-Audio Understanding).**10만 개의 음향 QA 쌍.

**MMAU-Pro.**1800 하드 아이템, 네 카테고리: 음성 / 소리 / 음악 / 멀티 오디오. 무작위 확률 25% 4 방식. 쌍둥이 2.5 프로 전체 ~ 60%; 멀티 오디오 ~ 22% 모든 모델에 걸쳐.

**LongAudioBench.**수분 간격의 영상들, 오디오 플라밍고 다음은 제미니 2.5 프로를 제치고

**AudioCaps / Clotho.**표본 기준: SPICE, CIDER, FENSE 매트릭스

### 대화에서 대화로 스트리밍

**Latency P50 / P95 / P99.**사용자 말에서 처음 들리는 반응까지 벽 시계. 모시: 200 ms; GPT-4o 실시간: 300 ms.

**WER / MOS**출력에서

**Barge-in responsiveness.**사용자 인터럽트에서 보조 무명까지의 시간. 목표 &lt;150 ms.

### 2026년 선두표

| Leaderboard | Tracks | URL |
|------------|--------|-----|
| Open ASR Leaderboard (HF) | English + multilingual + long-form | `huggingface.co/spaces/hf-audio/open_asr_leaderboard` |
| TTS Arena (HF) | English TTS | `huggingface.co/spaces/TTS-AGI/TTS-Arena` |
| Artificial Analysis Speech | TTS + STT, ELO from paired votes | `artificialanalysis.ai/speech` |
| MMAU-Pro | LALM reasoning | `sonalkum.github.io/mmau-pro` |
| SpeakerBench / VoxSRC | Speaker recognition | `voxsrc.github.io` |
| MMAU music subset | Music LALM | (within MMAU) |
| HEAR benchmark | Self-supervised audio | `hearbenchmark.com` |

```figure
sp-wer-align
```

## 건설 해

### 단계 1: 정상화와 함께 WER

```python
from jiwer import wer, Compose, ToLowerCase, RemovePunctuation, Strip

transform = Compose([ToLowerCase(), RemovePunctuation(), Strip()])
score = wer(
    truth="Please turn on the lights.",
    hypothesis="please turn on the light",
    truth_transform=transform,
    hypothesis_transform=transform,
)
# ~0.17
```

### 단계 2: TTS 반여행 WER

```python
def ttr_wer(tts_model, asr_model, texts):
    errors = []
    for txt in texts:
        audio = tts_model.synthesize(txt)
        recog = asr_model.transcribe(audio)
        errors.append(wer(truth=txt, hypothesis=recog))
    return sum(errors) / len(errors)
```

### 단계 3: 음성 복제 위한 SECS

```python
from speechbrain.inference.speaker import EncoderClassifier
sv = EncoderClassifier.from_hparams("speechbrain/spkrec-ecapa-voxceleb")

emb_ref = sv.encode_batch(load_wav("reference.wav"))
emb_clone = sv.encode_batch(load_wav("cloned.wav"))
secs = torch.nn.functional.cosine_similarity(emb_ref, emb_clone, dim=-1).item()
```

### 단계 4: 음악 생성에 대한 FAD

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()
score = fad.get_fad_score("generated_folder/", "reference_folder/")
```

### 단계 5: 스피커 검증에 대한 EER (목록 6과 동일한 코드)

```python
def eer(same_scores, diff_scores):
    thresholds = sorted(set(same_scores + diff_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in diff_scores if s >= t) / len(diff_scores)
        frr = sum(1 for s in same_scores if s < t) / len(same_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

## 사용 하 고

모든 배포를 모든 모델 업데이트에서 실행되는 고정된 평가 배너스와 결합합니다. 세 가지 기본 규칙:

1. **Normalize before scoring.**작자, 문호, 숫자, 정규화 규칙에 대해 보고하세요
2. **Report distributions, not averages.**지연기간에 P50/P95/P99 클래스별 리콜, 분류에 대해 MMAU에 대해
3. **Run one canonical public benchmark.**생산 자료가 다르더라도, 오픈 ASR/TTS 아레나/MMAU에서 보고하는 것은 심사위원들에게 사과와 사과를 비교할 수 있게 해준다.

## 함정

- **UTMOS extrapolation.**VCTK 스타일의 깨끗한 연설에 훈련 받았으며, 소음 / 복제 / 감정적 오디오 점수는 좋지 않습니다.
- **MOS panel bias.**20명의 아마존 메카니컬 터크 직원은 20명의 대상 사용자입니다.
- **FAD depends on reference set.**모델들 간의 동일한 참조 분포에 비교해 보세요.
- **Aggregate WER.**전체적으로 5%의 WER는 강조된 연설에서 30%의 WER를 숨길 수 있습니다.
- **Public benchmark saturation.**대부분의 프론터 모델은 표준 기준에 따라 천장에 가깝습니다. 트래픽을 반영하는 내장 수직 세트를 구축하십시오.

## 선박

`outputs/skill-audio-evaluator.md`. 모든 오디오 모델 발매에 대한 측정, 기준 및 보고서 형식을 선택하십시오.

## 운동

1. **Easy.**달아`code/main.py`장난감 입력값에 WER/ CER/ EER/ SECS/ FAD-ish/ MMAU-ish을 계산한다.
2. **Medium.**TTS 회전 WER 배너스를 구축하세요. Whisper를 통해 Kokoro 또는 F5-TTS 출력을 실행하세요. 50개의 명령어를 넘어서 WER를 계산하세요. WER와 10%의 플래그 명령어를 실행하세요.
3. **Hard.**MMAU-Pro 연설 + 다중 오디오 하위 집합 (50 항목 각) 에 대한 10 레슨 LALM 선택 점수를 얻으십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| WER | ASR score | `(S+D+I)/N` at word level after normalization. |
| CER | Character WER | For tone languages or char-level systems. |
| MOS | Human opinion | 1-5 rating; 20+ listeners × 100 samples. |
| UTMOS | ML MOS predictor | Learned model; correlates ~0.9 with human MOS. |
| SECS | Voice-clone similarity | ECAPA cosine between reference and clone. |
| EER | Speaker verif score | Threshold where FAR = FRR. |
| DER | Diarization score | (FA + Miss + Confusion) / total. |
| FAD | Music-gen quality | Fréchet distance on VGGish embeddings. |
| RTFx | Throughput | Audio seconds per wall-clock second. |

## 더 많은 읽기

- [jiwer](https://github.com/jitsi/jiwer) 정상화 유틸리티를 가진 WER/CER 라이브러리.
- [UTMOS (Saeki et al. 2022)](https://arxiv.org/abs/2204.02152) MOS 예측을 배웠어요.
- [Fréchet Audio Distance (Kilgour et al. 2019)](https://arxiv.org/abs/1812.08466) 음악 세대 표준
- [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard)2026년 라이브 순위
- [TTS Arena](https://huggingface.co/spaces/TTS-AGI/TTS-Arena) TTS의 인적 투표 순위표
- [MMAU-Pro benchmark](https://sonalkum.github.io/mmau-pro/) LALM 추론 랭킹
- [HEAR benchmark](https://hearbenchmark.com/) 오디오 SSL 기준
