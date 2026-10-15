# T5, BART  엔코더- 디코더 모델

> 앵코더는 이해합니다. 앵코더는 생성합니다. 다시 합쳐서 입력 → 출력 작업을 위해 만들어진 모델을 얻을 수 있습니다. 번역, 요약, 재편, 번역.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 06 (BERT), Phase 7 · 07 (GPT)
**Time:** ~45 minutes

## 문제

디코더만 사용하는 GPT와 코더만 사용하는 BERT은 각각 다른 목표를 위해 2017 아키텍처를 띠게 합니다. 그러나 많은 작업은 자연스럽게 입력 출력입니다.

- 번역: 영어 → 프랑스어
- 요약: 5,000 토큰 기사 → 200 토큰 요약.
- 음성 인식: 오디오 토큰 → 텍스트 토큰
- 구조화된 추출: prose → JSON.

이 경우, 엔코더-독독자는 가장 깨끗한 적합성을 제공합니다. 엔코더는 소스의 밀집한 표현을 생성합니다. 디코더는 출력을 생성하고, 모든 단계에서 그 표현에 교차적으로 응시합니다. 출력 측면에서는 훈련이 하나씩 이동합니다. GPT와 동일한 손실, 단지 엔코더 출력에 조건입니다.

두 개의 논문으로 현대적인 플레이북을 정의했습니다.

1. **T5**" 텍스트-텍스트 전송 변환기". 모든 NLP 작업은 텍스트-인, 텍스트-아웃으로 재구성되었습니다. 단일 아키텍처, 단일 어휘, 단일 손실. 마스크된 기간 예측 (인포에서 부패한 기간, 출력에서 해독) 에 훈련되었습니다.
2. **BART**(Lewis et al. 2019). "비디렉션 및 자동 회전 변환기". 자동 엽기: 여러 가지 방법으로 손상된 입력 (중화, 마스크, 삭제, 회전) 을 거부하여 디코더에게 원본을 재구성하도록 요청하십시오.

2026년엔 엔코더-독호기 형식은 입력 구조가 중요한 곳에 계속 유지됩니다.

- 속삭여 (소설 → 텍스트)
- 구글의 번역 스택.
- 특정 컨텍스트 및 편집 구조를 가진 코드 완료 / 수리 모델.
- Flan-T5 및 구조화된 추론 과제용 변종

디코더만 주목받았지만, 디코더는 사라지지 않았습니다.

## 개념

![Encoder-decoder with cross-attention](../assets/encoder-decoder.svg)

### 앞 ループ

```
source tokens ─▶ encoder ─▶ (N_src, d_model)  ──┐
                                                 │
target tokens ─▶ decoder block                   │
                 ├─▶ masked self-attention       │
                 ├─▶ cross-attention ◀───────────┘
                 └─▶ FFN
                ↓
              next-token logits
```

중요한 것은, 엔코더가 입력당 한 번 실행됩니다. 디코더는 자동으로 실행되지만 모든 단계에서 * 같은 * 엔코더 출력을 보냅니다. 엔코더 출력을 캐시하는 것은 긴 입력에 대한 무료 가속입니다.

### T5 예능  기간 부패

입력의 무작위 스파인을 선택하십시오 (평균 길이는 3 토큰, 전체 15%). 각각의 스파인을 고유한 sentinel로 교체하십시오: `<extra_id_0>``<extra_id_1>`, 등 디코더는 손상된 스랜을 그 선전자 선전자로 출력합니다.

```
source: The quick <extra_id_0> fox jumps <extra_id_1> dog
target: <extra_id_0> brown <extra_id_1> over the lazy
```

전체 순서 예측보다 저렴한 신호. T5 종이에 대한 압축에 MLM (BERT) 와 전두환-LM (UniLM) 와 경쟁력 있는

### BART 사전 훈련  다중 소음 소멸

BART는 5개의 소음 기능을 시도합니다.

1. 토큰 마스크
2. 토큰 삭제
3. 텍스트를 채우기 (역량을 마스크하고, 디코더가 올바른 길이를 삽입한다).
4. 문장 변동
5. 문서 회전

텍스트 충전 + 문장 변변화를 결합하면 가장 좋은 하류 숫자가 발생한다. 디코더는 항상 원본을 재구성한다. BART의 출력은 손상된   뿐만 아니라 전체 순서입니다. 따라서 사전 계산은 T5보다 높습니다.

### 추론

GPT와 동일한 오토레그레시브 생성. 탐욕 / 빔 / 톱-P 샘플링이 적용됩니다. 빔 검색 (폭 45) 은 번역 및 요약에 표준입니다. 출력 분포는 채팅보다 좁기 때문입니다.

### 2026년에 각 변종을 언제 선택해야 할까요?

| Task | Encoder-decoder? | Why |
|------|------------------|-----|
| Translation | Yes, usually | Clear source sequence; fixed output distribution; beam search works |
| Speech-to-text | Yes (Whisper) | Input modality differs from output; encoder shapes audio features |
| Chat / reasoning | No, decoder-only | No persistent "input" — the conversation is the sequence |
| Code completion | Usually no | Decoder-only with long context wins; code models like Qwen 2.5 Coder are decoder-only |
| Summarization | Either works | BART, PEGASUS beat earlier decoder-only baselines; modern decoder-only LLMs match them |
| Structured extraction | Either | T5 is clean because "text → text" absorbs any output format |

~2022 년 이후의 추세는: 디코더-독독자가 이전에는 소유했던 작업을 맡고 있기 때문에 (a) 명령으로 조정된 디코더-독독 LLM는 촉구로 무엇이든 일반화, (b) 하나의 아키텍처 규모는 두 개보다 더 쉽습니다, (c) RLHF는 디코더를 가정합니다. 엔코더-디코더는 입력 방식이 다른 곳 (말, 이미지) 또는 빔 검색 품질이 중요한 곳에서 유지됩니다.

```figure
encoder-decoder
```

## 건설 해

보시다시피`code/main.py`우리는 장난감 코퍼스에서 T5 스타일의 스파인 부패를 구현합니다. 이 수업의 가장 유용한 단편입니다. 왜냐하면 그것은 그 이후로 모든 코더-독호기 사전 훈련 레시피에서 나타납니다.

### 단계 1: 랜프 부패

```python
def corrupt_spans(tokens, mask_rate=0.15, mean_span=3.0, rng=None):
    """Pick spans summing to ~mask_rate of tokens. Return (corrupted_input, target)."""
    n = len(tokens)
    n_mask = max(1, int(n * mask_rate))
    n_spans = max(1, int(round(n_mask / mean_span)))
    ...
```

목표형은 T5 협약입니다: `<sent0> span0 <sent1> span1 ...`손상된 입력은 변함없는 토큰과 스탠델 토큰을 팽창 위치에서 융합합니다.

### 2단계: 돌아가는 여정을 확인

손상된 입력과 목표물을 고려하면 원래 문장을 재구성하십시오. 만약 당신의 부패가 되돌릴 수 있다면, 앞으로의 통과는 잘 정의됩니다. 이것은 정신 건강 검진입니다. 실제 훈련은 결코 이것을하지 않습니다. 그러나 테스트는 저렴하며, 당신의 스파인 회계에서 하나씩 버그를 잡습니다.

### 단계 3: BART 소음

다섯 가지 기능:`token_mask``token_delete``text_infill``sentence_permute``document_rotate`두 개를 합쳐서 결과를 보여드리겠습니다.

## 사용 하 고

HuggingFace 참조:

```python
from transformers import T5ForConditionalGeneration, T5Tokenizer
tok = T5Tokenizer.from_pretrained("google/flan-t5-base")
model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")

inputs = tok("translate English to French: Attention is all you need.", return_tensors="pt")
out = model.generate(**inputs, max_new_tokens=32)
print(tok.decode(out[0], skip_special_tokens=True))
```

T5 트릭: 작업 이름은 입력 텍스트에 들어가고 있습니다. 동일한 모델은 각각의 작업이 텍스트-인, 텍스트-아웃이기 때문에 수십 개의 작업을 처리합니다. 2026 년 이 패턴은 명령어 조정 디코더 모델에서만 일반화되었지만 T5는 먼저 규정을했습니다.

## 선박

보시다시피`outputs/skill-seq2seq-picker.md`. 기술력은 입력 출력 구조, 지연성 및 품질 목표를 고려하여 새로운 작업에 대한 코더-독제자 및 디코더-독제자 사이에서 선택합니다.

## 운동

1. **Easy.**달아`code/main.py`, 30 토큰 문장에 스펜 부패를 적용하여, 센티널이 아닌 소스 토큰과 디코딩된 타겟 스펜을 연결하여 원본을 재생하는지 확인합니다.
2. **Medium.**BART의 시행`text_infill`소음: 무작위 스탠을 단일 스탠으로 교체합니다 `<mask>`도켓을 표시하고 디코더가 올바른 스파인 길이를 더한 내용을 추론해야 합니다.
3. **Hard.**미세한 조율`flan-t5-small`작은 영어 → 돼지-라틴 코퍼스 (200 쌍) 에 있는 블루를 50 쌍의 수직 세트 에 측정 해 보세요.`Llama-3.2-1B`같은 데이터와 같은 계산을 하는

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder-decoder | "Seq2seq transformer" | Two stacks: bidirectional encoder for input, causal decoder with cross-attention for output. |
| Cross-attention | "Where source talks to target" | Decoder's Q × encoder's K/V. The only place encoder information enters the decoder. |
| Span corruption | "T5's pretraining trick" | Replace random spans with sentinel tokens; decoder outputs the spans. |
| Denoising objective | "BART's game" | Apply a noise function to the input, train the decoder to reconstruct the clean sequence. |
| Sentinel token | "The `<extra_id_N>` placeholder" | Special tokens that tag corrupted spans in the source and re-tag them in the target. |
| Flan | "Instruction-tuned T5" | T5 fine-tuned on >1,800 tasks; made encoder-decoder competitive at instruction-following. |
| Beam search | "Decoding strategy" | Keep top-k partial sequences at each step; standard for translation/summarization. |
| Teacher forcing | "Training-time input" | During training, feed the true previous output token to the decoder, not the sampled one. |

## 더 많은 읽기

- [Raffel et al. (2019). Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683) T5
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension](https://arxiv.org/abs/1910.13461) 바트
- [Chung et al. (2022). Scaling Instruction-Finetuned Language Models](https://arxiv.org/abs/2210.11416) 플랜-T5
- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356)                                                                                                                                                                                                                                                              
- [HuggingFace `modeling_t5.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/t5/modeling_t5.py) 참조 실행
