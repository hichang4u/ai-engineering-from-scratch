# BERT  마스크 된 언어 모델링

> GPT는 다음 단어를 예측합니다. BERT는 사라진 단어를 예측합니다. 한 문장 차이  그리고 모든 것을 임베디션 모양으로 한 반 십 년.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 5 · 02 (Text Representation)
**Time:** ~45 minutes

## 문제

2018년 모든 NLP 작업  감정, NER, QA, 포함 은 자체 라벨 데이터에 의해 처음부터 자체 모델을 훈련했습니다. 정비할 수 있는 사전 훈련된 "영어를 이해하십시오" 체크포인트는 없었습니다. ELMo (2018) 는 쌍방향 LSTM로 컨텍스트 임베디션을 사전 훈련시킬 수 있음을 보여주었습니다. 그것은 도움이되었지만 일반화하지는 않았습니다.

BERT (Devlin et al. 2018) 는 이렇게 물었습니다. 만약 우리가 트랜스포머 코더를 가지고 인터넷의 모든 문장을 훈련시켜서 두 쪽에서 문맥에서 빠진 단어를 예측하도록 강요한다면 어떨까요?

그 결과: 18개월 이내에 BERT 및 그 변형 (로베르타, 알베르트, 엘렉트라) 는 존재했던 모든 NLP 순위표에 지배를 가했다. 2020 년까지 지구상의 모든 검색 엔진, 콘텐츠 모дера션 파이프라인 및 의미 검색 시스템에는 BERT가있었습니다.

2026년엔코더 모델은 여전히 분류, 검색 및 구조화된 추출을 위한 적절한 도구입니다. 그들은 디코더보다 510x 더 빨리 토큰을 실행하고 임베디드는 모든 현대 검색 스택의 척추입니다. ModernBERT (2024년 12월) 는 플래시 주의 + RoPE + GeGLU로 아키텍처를 8K 컨텍스트로 밀어 넣었습니다.

## 개념

![Masked language modeling: pick tokens, mask them, predict originals](../assets/bert-mlm.svg)

### 훈련 신호

문장을 생각해보세요.`the quick brown fox jumps over the lazy dog`- 그래

토큰의 15%를 무작위로 마스크:

```
input:  the [MASK] brown fox jumps [MASK] the lazy dog
target: the  quick brown fox jumps  over  the lazy dog
```

모형은 마스크된 위치에서 원래 토큰을 예측하도록 훈련합니다. 왜냐하면 코더는 양방향이기 때문에 예측합니다.`[MASK]`1 위치에서 사용할 수 있습니다`brown fox jumps`2+ 위치에서, GPT가 할 수 없는 일입니다.

### BERT 마스크 규칙

예측에 선택된 토큰의 15% 중

- 80%가 대체됩니다.`[MASK]`- 그래
- 10%는 무작위 토큰으로 대체됩니다.
- 10%는 변하지 않습니다.

왜 항상 안되죠?`[MASK]`왜냐하면`[MASK]`모형은 예측할 수 있도록 훈련합니다`[MASK]`100% 마스크된 위치에서 훈련 전과 정렬 사이의 분배 전환을 만들 수 있습니다. 10% 무작위 + 10% 변하지 않은 모델은 정직하게 유지됩니다.

### 다음 문장 예측 (NSP)  그리고 왜 떨어졌는지

원래 BERT는 NSP에 대한 훈련을 받았습니다. A와 B의 두 문장을 제공하면 A를 따르는 경우 예측합니다. RoBERTa (2019) 는 그것을 삭제하고 NSP가 해를 끼쳤다고 보여주었습니다. 도움이되지 않았습니다. 현대 엔코더는 그것을 건너뛰습니다.

### 2026년에 무슨 변화가 있었습니까?

2024년 모던BERT 종이 2026년 원시적인 것으로 블록을 재건했습니다.

| Component | Original BERT (2018) | ModernBERT (2024) |
|-----------|----------------------|-------------------|
| Positional | Learned absolute | RoPE |
| Activation | GELU | GeGLU |
| Normalization | LayerNorm | Pre-norm RMSNorm |
| Attention | Full dense | Alternating local (128) + global |
| Context length | 512 | 8192 |
| Tokenizer | WordPiece | BPE |

2018년 스택과 달리 플래시 주의가 내재되어 있습니다. 은 더 나은 GLUE 점수를 가진 DeBERTa-v3보다 8K의 순서 길이를 통해 23x 더 빠르다.

### 2026년에 여전히 코더를 선택하는 사용 케이스

| Task | Why encoder beats decoder |
|------|---------------------------|
| Retrieval / semantic search embeddings | Bidirectional context = better embedding quality per token |
| Classification (sentiment, intent, toxicity) | One forward pass; no generation overhead |
| NER / token labeling | Per-position output, natively bidirectional |
| Zero-shot entailment (NLI) | Classifier head on top of encoder |
| Reranker for RAG | Cross-encoder scoring, 10x faster than LLM rerankers |

```figure
transformer-residual
```

## 건설 해

### 단계 1: 마스크 로직

보시다시피`code/main.py`. 기능`create_mlm_batch`토큰 ID, 어휘 크기, 마스크 확률의 목록을 가져옵니다. 입력 ID (마스크를 적용) 및 레이블 (마스크된 위치에서만, -100 다른 곳에서 PyTorch의 인덱스 협약을 무시합니다) 를 반환합니다.

```python
def create_mlm_batch(tokens, vocab_size, mask_prob=0.15, rng=None):
    input_ids = list(tokens)
    labels = [-100] * len(tokens)
    for i, t in enumerate(tokens):
        if rng.random() < mask_prob:
            labels[i] = t
            r = rng.random()
            if r < 0.8:
                input_ids[i] = MASK_ID
            elif r < 0.9:
                input_ids[i] = rng.randrange(vocab_size)
            # else: keep original
    return input_ids, labels
```

### 단계 2: 작은 코퍼스에서 MLM 예측을 실행

2층 코더 + MLM 머신 20 단어, 200 문장 단어자리에 훈련합니다. gradient 없습니다.

### 3단계: 마스크 종류를 비교

3방향 규칙이 어떻게 모델을 사용하지 않고 사용할 수 있게 해주는지를 보여주세요`[MASK]`.모델은 훈련에서 두 패턴을 보았기 때문에 두 가지 모두 합리적인 표본 분포를 만들어야 합니다.

### 단계 4: 세밀한 조정 머신

장난감 감성 데이터 세트에 있는 MLM 헤드를 분류 헤드로 교체하십시오. 헤드만 열고, 코더는 얼어붙습니다. BERT 애플리케이션마다 다음과 같은 패턴입니다.

## 사용 하 고

```python
from transformers import AutoModel, AutoTokenizer

tok = AutoTokenizer.from_pretrained("answerdotai/ModernBERT-base")
model = AutoModel.from_pretrained("answerdotai/ModernBERT-base")

text = "Attention is all you need."
inputs = tok(text, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, N, 768)
```

**Embedding models are fine-tuned BERT.** `sentence-transformers`모델들`all-MiniLM-L6-v2`방조 손실을 훈련받은 BERT입니다. 코딩은 동일합니다. 손실은 변경되었습니다.

**Cross-encoder rerankers are also fine-tuned BERT.** 쌍 분류`[CLS] query [SEP] doc [SEP]`. query와 doc 사이의 쌍방향 주의는 바로 크로스 코더가 양방향 코더에 비해 품질 우위를 주는 것입니다.

**When not to pick BERT in 2026.**생성성 있는 모든 것. 코더는 자율적으로 토큰을 생성하는 건 건지 않습니다. 또한: 작은 디코더가 더 유연하게 품질을 맞추는 1B 파라미드 이하의 모든 것 (Phi-3-Mini, Qwen2-1.5B).

## 선박

보시다시피`outputs/skill-bert-finetuner.md`. 기술 범위는 새로운 분류 또는 추출 작업에 대한 BERT 미세조 (백본 선택, 헤드 스펙, 데이터, eval, 스톱) 를 제공합니다.

## 운동

1. **Easy.**달아`code/main.py`그리고 10,000개의 토큰에 걸쳐 마스크 분포를 인쇄합니다. 확인 ~ 15%가 선택되고, 그 ~ 80%가 됩니다.`[MASK]`- 그래
2. **Medium.**전체 단어 마스크를 구현: 단어가 하위 단어로 표기되어 있다면 모든 하위 단어를 함께 마스크하거나 아무것도하지 마십시오. 이것은 500 문장 코퍼스에서 MLM 정확성을 향상하는지 측정하십시오.
3. **Hard.**공공 데이터 세트에서 10,000 문장을 사용하여 작은 (2층, d=64) BERT를 훈련하십시오.`[CLS]`SST-2 감성을 위한 토큰.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| MLM | "Masked language modeling" | Training signal: randomly replace 15% of tokens with `[MASK]`, predict the originals. |
| Bidirectional | "Looks both ways" | Encoder attention has no causal mask — every position sees every other position. |
| `[CLS]` | "The pooler token" | A special token prepended to every sequence; its final embedding is used as the sentence-level representation. |
| `[SEP]` | "Segment separator" | Separates paired sequences (e.g. query/doc, sentence A/B). |
| NSP | "Next sentence prediction" | BERT's second pretraining task; shown to be useless in RoBERTa, dropped after 2019. |
| Fine-tuning | "Adapt to a task" | Keep the encoder mostly frozen; train a small head on top for the downstream task. |
| Cross-encoder | "A reranker" | A BERT that takes both query and doc as input, outputs a relevance score. |
| ModernBERT | "2024 refresh" | Encoder rebuilt with RoPE, RMSNorm, GeGLU, alternating local/global attention, 8K context. |

## 더 많은 읽기

- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805) 원본 종이
- [Liu et al. (2019). RoBERTa: A Robustly Optimized BERT Pretraining Approach](https://arxiv.org/abs/1907.11692) BERT를 제대로 훈련시키는 방법; NSP를 죽인다.
- [Clark et al. (2020). ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators](https://arxiv.org/abs/2003.10555) 대체된 토큰 탐지 방식은 일치된 컴퓨팅에서 MLM를 능가한다.
- [Warner et al. (2024). Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder](https://arxiv.org/abs/2412.13663) 모던BERT 종이
- [HuggingFace `modeling_bert.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/bert/modeling_bert.py) 카논िकल 코더 참조
