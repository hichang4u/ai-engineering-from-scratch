# 음성 인식 (ASR)  CTC, RNN-T, 주의

> 음성 인식은 모든 시간 단계에 오디오 분류입니다. 영어와 침묵을 아는 순서 모델에 의해 붙여집니다. CTC, RNN-T, 그리고 주의는 그것을 수행하는 세 가지 방법입니다. 하나를 선택하고 이유를 이해하십시오.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 08 (CNNs & RNNs for Text), Phase 5 · 10 (Attention)
**Time:** ~45 minutes

## 문제

10초 16kHz 클립이 있습니다. 문자열을 원하세요: "방등을 켜십시오". 문제는 구조적입니다. 오디오 프레임은 문자와 하나씩 조화를 이루지 않습니다. "좋아요"라는 단어는 200 ms 또는 1200 ms를 걸릴 수 있습니다. 침묵은 발음을 점점합니다. 일부 음색은 다른 것보다 길습니다. 출력 토큰의 수는 미리 알려져 있지 않습니다.

세 가지 공식이 문제를 해결합니다.

1. **CTC (Connectionist Temporal Classification).**프레임별 토큰 확률을 배포하여 특별 * 빈 * 를 포함합니다. 디코드 시점에서의 붕괴 반복 및 빈. 자율적 인, 빠른. wav2vec 2.0에서 사용된다. MMS.
2. **RNN-T (Recurrent Neural Network Transducer).**공동 네트워크는 다음 토큰을 예측합니다. 코더 프레임과 이전 토큰. 스트리메이블. 구글의 장치 ASR, NVIDIA Parakeet에서 사용됩니다.
3. **Attention encoder-decoder.**엔코더는 오디오를 숨겨진 상태로 압축하고, 디코더는 자율적으로 토큰을 생성하는 크로스-이치.

2026년, LibriSpeech 테스트 클린에 SOTA WER는 1.4% (Parakeet-TDT-1.1B, NVIDIA) 와 1.58% (Whisper-Large-v3-turbo) 이다. 차이점은 작지만, 배포 차이점은 엄청납니다.

## 개념

![Three ASR formulations: CTC, RNN-T, attention-encoder-decoder](../assets/asr-formulations.svg)

**CTC intuition.**코더 출력하도록`T`프레임 레벨 분포`V+1`토큰 (V 기호 + 빈)`y`길이가 `U < T`, 모든 프레임 라인업이 붕괴되는`y`CTC 손실은 이러한 모든 조화를 합한다. 추론: 프레임 당 argmax, 붕괴 반복, 빈 공간을 제거한다.

장점: 자기 회전성, 스트리밍성, 시선점점점점점점점점점: * 조건부 독립성 가정*  각 프레임 예측은 다른 프레임으로부터 독립적이므로 내부 언어 모델이 없습니다.

**RNN-T intuition.**토큰 역사를 통합하는 *프레디커터* 네트워크를 추가하고, 코더 프레임과 예측 상태를 결합한 *joiner*를 결합하여 겹쳐서 배포합니다.`V+1`(이 `+1`CTC는 무시한 조건부 의존성을 명시적으로 모델링합니다. 각 단계는 과거의 프레임과 과거의 토큰에만 조건이 있기 때문에 스트리밍이 가능합니다.

장점: 스트리밍 가능한 + 내부 LM. 단점: 훈련은 더 복잡하고 메모리 소급 (3D 손실 격자); RNN-T 손실 커널은 자체적으로 전체 라이브러리 카테고리입니다.

**Attention encoder-decoder.**로그메일 프레임에 대한 엔코더 (6-32 변환기 계층) . 디코더 (6-32 변환기 계층) 는 자율적으로 토큰을 생성하기 위해 엔코더 출력을 가로막는다. 조렬 제한은 없습니다.

장점: 오프라인 ASR에서 최고 품질, 표준 seq2seq 도구로 훈련하기 쉽습니다. 단점: 자동 퇴행성 지연은 출력 길이에 비례하며 엔지니어링 없이는 스트리밍 할 수 없습니다.

### WER: 1번

**Word Error Rate**=$(S + D + I) / N$, 어디$S$= 대체,$D$= 삭제,$I$=insertions,$N$= 참조 단어 수. 레벤슈타인 편집 거리와 단어 수준에 일치합니다. 낮은 것이 더 좋습니다. 20% 이상의 WER는 일반적으로 사용 불가능합니다. 5% 이하는 읽기 음성에서 인간-평등입니다. 표준 기준에 대한 2026 숫자:

| Model | LibriSpeech test-clean | LibriSpeech test-other | Size |
|-------|------------------------|------------------------|------|
| Parakeet-TDT-1.1B | 1.40% | 2.78% | 1.1B params |
| Whisper-Large-v3-turbo | 1.58% | 3.03% | 809M |
| Canary-1B Flash | 1.48% | 2.87% | 1B |
| Seamless M4T v2 | 1.7% | 3.5% | 2.3B |

이 모든 것은 코더-디코더 또는 RNN-T 기반의 순수 CTC 시스템 (wav2vec 2.0) 은 테스트-클린에서 1.82.1% 정도에 달한다.

```figure
ctc-collapse
```

## 건설 해

### 단계 1: 탐욕적인 CTC 디코딩

```python
def ctc_greedy(frame_logits, blank=0, vocab=None):
    # frame_logits: list of per-frame probability vectors
    preds = [max(range(len(p)), key=lambda i: p[i]) for p in frame_logits]
    out = []
    prev = -1
    for p in preds:
        if p != prev and p != blank:
            out.append(p)
        prev = p
    return "".join(vocab[i] for i in out) if vocab else out
```

두 가지 규칙: 연속 반복으로 붕괴, 빈 공간을 떨어뜨리는 것. 예제:`a a _ _ a b b _ c`→`a a b c`- 그래

### 단계 2: 반지 탐색 CTC

```python
def ctc_beam(frame_logits, beam=8, blank=0):
    import math
    beams = [([], 0.0)]  # (tokens, log_prob)
    for p in frame_logits:
        log_p = [math.log(max(pi, 1e-10)) for pi in p]
        candidates = []
        for seq, lp in beams:
            for t, lpt in enumerate(log_p):
                new = seq[:] if t == blank else (seq + [t] if not seq or seq[-1] != t else seq)
                candidates.append((new, lp + lpt))
        candidates.sort(key=lambda x: -x[1])
        beams = candidates[:beam]
    return beams[0][0]
```

생산은 LM 융합으로 사전 나무 빔 검색을 사용합니다. 이것은 개념적 골격입니다.

### 단계 3: WER

```python
def wer(ref, hyp):
    r, h = ref.split(), hyp.split()
    dp = [[0] * (len(h) + 1) for _ in range(len(r) + 1)]
    for i in range(len(r) + 1):
        dp[i][0] = i
    for j in range(len(h) + 1):
        dp[0][j] = j
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            cost = 0 if r[i - 1] == h[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
    return dp[len(r)][len(h)] / max(1, len(r))
```

### 단계 4: 휘파람에 대한 추론

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("clip.wav")
print(result["text"])
```

2026년 가장 강력한 일반 ASR를 위한 1 라인형

### 단계 5: Parakeet 또는 wav2vec 2.0로 스트리밍

```python
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="nvidia/parakeet-tdt-1.1b")
for chunk in streaming_audio():
    print(asr(chunk, return_timestamps=True))
```

스트리밍 ASR는 조각적인 코더 관심과 운반 상태가 필요합니다. 이를 지원하는 라이브러리를 사용하십시오 (NeMo for Parakeet, `transformers``chunk_length_s`)

## 사용 하 고

2026년 스택:

| Situation | Pick |
|-----------|------|
| English, offline, max quality | Whisper-large-v3-turbo |
| Multilingual, robust | SeamlessM4T v2 |
| Streaming, low latency | Parakeet-TDT-1.1B or Riva |
| Edge, mobile, <500 ms latency | Whisper-Tiny quantized or Moonshine (2024) |
| Long-form | Whisper with VAD-based chunking (WhisperX) |
| Domain-specific (medical, legal) | Fine-tune wav2vec 2.0 + domain LM fusion |

## 2026 년에도 여전히 선박되는 함정이

- **No VAD.**침묵에 휘말리는 속삭임은 환각을 일으킨다 ("보시는 것에 감사합니다!"). 항상 VAD로 문.
- **Character vs word vs subword WER.**말 수준 WER *after* 정상화 (하위자, 문호 제거) 를 보고하십시오.
- **Language ID drift.**휘스퍼의 자동 LID는 험난한 클립을 일본어 또는 웨일스어로 잘못 연결합니다.`language="en"`당신이 알고 있을 때
- **Long clips without chunking.**윙어리는 30초의 시간을 가지고 있습니다.`chunk_length_s=30, stride=5`더 오래 걸리는 건

## 선박

`outputs/skill-asr-picker.md`. 특정 배치 목표에 대한 모델, 디코딩 전략, 싱 및 LM 융합을 선택하십시오.

## 운동

1. **Easy.**달아`code/main.py`. 그것은 탐욕적으로 손으로 만든 CTC 출력을 해독하고 WER를 참조에 따라 계산합니다.
2. **Medium.**단계 2에서 선두-나무 반지 검색을 제대로 수행하십시오 (공허 융합 규칙에 대한 계산). 10 예제 합성 데이터 세트에 탐욕과 비교하십시오.
3. **Hard.**사용`whisper-large-v3-turbo` [LibriSpeech test-clean](https://www.openslr.org/12)첫 100개의 발언에 WER를 계산하고 발표된 숫자를 비교해 보세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| CTC | The blank-token loss | Marginal over all frame-to-token alignments; non-AR. |
| RNN-T | The streaming loss | CTC + next-token predictor; handles word-order. |
| Attention enc-dec | Whisper-style | Encoder + cross-attending decoder; best offline quality. |
| WER | The number you report | `(S+D+I)/N` at word level. |
| Blank | The emptiness | Special token in CTC signalling "no emission this frame". |
| LM fusion | External language model | Add weighted LM log-probs during beam search. |
| VAD | The silence gate | Voice activity detector; trims non-speech. |

## 더 많은 읽기

- [Graves et al. (2006). Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf) CTC 논문
- [Graves (2012). Sequence Transduction with RNNs](https://arxiv.org/abs/1211.3711) RNN-T 논문
- [Radford et al. / OpenAI (2022). Whisper: Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) 2022년 신화 논문; 2024년 v3 터보 확장
- [NVIDIA NeMo — Parakeet-TDT card](https://huggingface.co/nvidia/parakeet-tdt-1.1b)2026 오픈 ASR 리더보드 리더
- [Hugging Face — Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 25개 이상의 모델에 대한 라이브 벤치마크
