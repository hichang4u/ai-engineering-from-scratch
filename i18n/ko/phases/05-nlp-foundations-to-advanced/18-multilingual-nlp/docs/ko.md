# 다국어 NLP

> 한 모델, 100개 이상의 언어, 대부분 훈련 데이터가 없습니다. 언어 간 전송은 2020년대 실제 기적입니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 04 (GloVe, FastText, Subword), Phase 5 · 11 (Machine Translation)
**Time:** ~45 minutes

## 문제

영어에는 수십억 개의 표기된 예가 있습니다. 우르두는 수천 개, 마이티리에는 거의 없습니다. 글로벌 청중에게 봉사하는 모든 실용적인 NLP 시스템은 작업에 대한 특정 교육 데이터가 존재하지 않는 언어의 긴 꼬리에 작업해야합니다.

다국어 모델은 한 모델이 여러 언어로 동시에 훈련함으로써 문제를 해결합니다. 공유된 표현은 모델이 높은 자원 언어로 배운 기술을 저 자원 언어로 전송할 수 있게 해준다. 영어 감성 분석에 대한 모델을 정밀하게 조정하여 우르두에 대한 놀라운 좋은 감성 예측을 만들어냅니다. 이것은 언어 간 전송이 불가능한 것입니다. 그리고 그것은 NLP가 세상에 전달되는 방식을 재구조했습니다.

이 수업은 교류와 가교적 모델, 그리고 다국어 작업에 새로운 팀을 이끌고 있는 하나의 결정을 나눈다.

## 개념

![Cross-lingual transfer via shared multilingual embedding space](../assets/multilingual.svg)

**Shared vocabulary.**다국어 모델은 모든 대상 언어의 텍스트에 훈련된 SentencePiece 또는 WordPiece 토큰을 사용합니다. 어휘는 공유됩니다. 같은 하위 단어 단위는 관련 언어들 중 동일한 형태를 나타냅니다. `anti-`영어와 이탈리아어로도 같은 표본을 얻습니다.

**Shared representation.**여러 언어의 마스크 언어 모델링에 미리 훈련받은 트랜스포머는 다른 언어의 의미적으로 유사한 문장이 유사한 숨겨진 상태를 생성한다는 것을 알게됩니다. mBERT, XLM-R, NLLB 모두 이것을 보여줍니다. 영어에서 "cat"에 대한 임베디션은 프랑스어에서 "chat"와 스페인어로 "gato" 근처에 클러스터, 그리고 풀 문장 임베디션도 마찬가지입니다.

**Zero-shot transfer.**한 언어 (일반적으로 영어) 에 표시된 데이터에 모델을 정밀 조정하십시오. 결론에 따라 모델이 지원하는 다른 언어로 실행하십시오. 대상 언어 레이블이 필요하지 않습니다. 결과는 전형적으로 관련 언어에 강하고 먼 언어에 약합니다.

**Few-shot fine-tuning.**표적 언어에서 100-500 개의 표기된 예제를 추가하십시오. 분류 작업에 대한 영어 기준의 95-98%까지 정확도가 뛰어납니다. 이것은 다국어 NLP에서 가장 비용 효율적인 레버입니다.

## 모델

| Model | Year | Coverage | Notes |
|-------|------|----------|-------|
| mBERT | 2018 | 104 languages | Trained on Wikipedia. First practical multilingual LM. Weak on low-resource. |
| XLM-R | 2019 | 100 languages | Trained on CommonCrawl (much larger than Wikipedia). Sets the cross-lingual baseline. Base 270M, Large 550M. |
| XLM-V | 2023 | 100 languages | XLM-R with 1M-token vocabulary (vs 250k). Better on low-resource. |
| mT5 | 2020 | 101 languages | T5 architecture for multilingual generation. |
| NLLB-200 | 2022 | 200 languages | Meta's translation model; includes 55 low-resource languages. |
| BLOOM | 2022 | 46 languages + 13 programming | Open 176B LLM trained multilingually. |
| Aya-23 | 2024 | 23 languages | Cohere's multilingual LLM. Strong on Arabic, Hindi, Swahili. |

사용 사례에 따라 선택하십시오. XLM-R-base를 기본으로 분류하는 것은 잘 작동합니다. 번역과 오픈 세대에 따라 세대 작업은 mT5 또는 NLLB를 요구합니다.

## 출처 언어 결정 (2026 연구)

대부분의 팀들은 영어로 정렬을 하는 데 기본 사용한다. 최근 연구 (2026) 는 이것이 종종 잘못되었다고 보여준다.

언어 유사성은 원자체 크기에 비해 전송 품질을 더 잘 예측합니다. 슬라브어 대상에서 독일어 또는 러시아어는 종종 영어보다 더 잘합니다. 인디어 대상에서는 힌디어가 종종 영어보다 더 잘합니다.**qWALS**유사성 측정기 (2026, 세계 언어 구조의 아틀라스 특징에 기초하여) 이 양을 나타냅니다. **LANGRANK**(Lin et al., ACL 2019) 는 언어적 유사성, 몸집 크기와 유전적 관련성 조합에서 후보 출처 언어를 순위화하는 분리된, 이전 방법이다.

실용적인 규칙: 만약 당신의 목표 언어는 전형적으로 가까운 고자원 친척이 있다면, 그 언어에 먼저 정밀 조정을 시도하고, 그 다음 영어 정밀 조정을 비교하십시오.

```figure
n5-crosslingual-bridge
```

## 건설 해

### 단계 1: 제로 샷의 언어 간 분류

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

tok = AutoTokenizer.from_pretrained("joeddav/xlm-roberta-large-xnli")
model = AutoModelForSequenceClassification.from_pretrained("joeddav/xlm-roberta-large-xnli")


def classify(text, candidate_labels, hypothesis_template="This text is about {}."):
    scores = {}
    for label in candidate_labels:
        hypothesis = hypothesis_template.format(label)
        inputs = tok(text, hypothesis, return_tensors="pt", truncation=True)
        with torch.no_grad():
            logits = model(**inputs).logits[0]
        entail_score = torch.softmax(logits, dim=-1)[2].item()
        scores[label] = entail_score
    return dict(sorted(scores.items(), key=lambda x: -x[1]))


print(classify("I love this product!", ["positive", "negative", "neutral"]))
print(classify("मुझे यह उत्पाद पसंद है!", ["positive", "negative", "neutral"]))
print(classify("J'adore ce produit !", ["positive", "negative", "neutral"]))
```

한 모델, 세 언어, 동일한 API. NLI에 훈련된 XLM-R는 함유함 트릭을 통해 분류에 잘 전송합니다.

### 단계 2: 다국어 임베디션 공간

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

pairs = [
    ("The cat is sleeping.", "Le chat dort."),
    ("The cat is sleeping.", "El gato está durmiendo."),
    ("The cat is sleeping.", "Die Katze schläft."),
    ("The cat is sleeping.", "The dog is barking."),
]

for eng, other in pairs:
    emb_eng = model.encode([eng], normalize_embeddings=True)[0]
    emb_other = model.encode([other], normalize_embeddings=True)[0]
    sim = float(np.dot(emb_eng, emb_other))
    print(f"  {eng!r} <-> {other!r}: cos={sim:.3f}")
```

번역은 임베디션 공간에 가깝고 다른 영어 문장이 더 멀리 떨어집니다. 이것이 언어 간 검색, 클러스터링, 유사성 작업을 만듭니다.

### 단계 3: 몇 번의 샷 미세 조율 전략

```python
from transformers import TrainingArguments, Trainer
from datasets import Dataset


def few_shot_finetune(base_model, base_tokenizer, examples):
    ds = Dataset.from_list(examples)

    def tokenize_fn(ex):
        out = base_tokenizer(ex["text"], truncation=True, max_length=128)
        out["labels"] = ex["label"]
        return out

    ds = ds.map(tokenize_fn)
    args = TrainingArguments(
        output_dir="out",
        per_device_train_batch_size=8,
        num_train_epochs=5,
        learning_rate=2e-5,
        save_strategy="no",
    )
    trainer = Trainer(model=base_model, args=args, train_dataset=ds)
    trainer.train()
    return base_model
```

100~500개의 표적 언어 예제에서,`num_train_epochs=5`그리고`learning_rate=2e-5`더 높은 학습률은 다국어적 조율이 붕괴되는 것을 초래하고 영어만 사용하는 모델을 얻을 수 있습니다.

## 실제로 작동하는 평가

- **Per-language accuracy on held-out sets.**합성된 것이 아니라 긴 꼬리를 숨기죠.
- **Benchmark against monolingual baseline.**충분한 데이터를 가진 언어에서는 처음부터 훈련된 단일 언어 모델은 때로는 다국어 모델을 이길 수 있습니다. 테스트.
- **Entity-level tests.**표적 언어의 이름단체. 다국어 모델은 종종 라틴어와는 멀리 있는 스크립트들에 대한 약한 표기법을 가지고 있습니다.
- **Cross-lingual consistency.**두 언어의 동일한 의미는 동일한 예측을 만들어 낼 수 있습니다. 격차를 측정합니다.

## 사용 하 고

2026년 스택:

| Task | Recommended |
|-----|-------------|
| Classification, 100 languages | XLM-R-base (~270M) fine-tuned |
| Zero-shot text classification | `joeddav/xlm-roberta-large-xnli` |
| Multilingual sentence embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| Translation, 200 languages | `facebook/nllb-200-distilled-600M` (see lesson 11) |
| Generative multilingual | Claude, GPT-4, Aya-23, mT5-XXL |
| Low-resource language NLP | XLM-V or a domain-specific fine-tune on related high-resource language |

항상 목표 언어 에 대한 재정적 조정 을 해야 합니다.

### 토큰화 세금 (소재가 낮은 언어에 대해 무엇이 잘못되는가)

다국어 모델들은 모든 언어들 사이에 하나의 토큰을 공유합니다. 그 어휘는 영어, 프랑스어, 스페인어, 중국어, 독일어들이 지배하는 코퍼스에서 훈련됩니다. 지배적인 집합 이외의 언어에 대해서는 세 가지 세금이 침묵으로 합쳐집니다:

- **Fertility tax.**저자원 언어 텍스트는 영어보다 훨씬 더 많은 토큰으로 표시됩니다. 한 힌디어 문장은 동등한 영어 문장의 3-5배의 토큰이 필요할 수 있습니다. 그 3-5배는 컨텍스트 창, 훈련 효율 및 지연을 소비합니다.
- **Variant recovery tax.**각 타이포, 디아크리틱 변종, 유니코드 정상화 불합동 또는 케이스 변수는 임베디션 공간에서 냉동 시작 무관한 순서로 변한다. 모델은 모국어 사용자가 당연하게 생각하는 철자 대응을 배울 수 없다.
- **Capacity spillover tax.**1 및 2 과서는 맥락 위치, 계층 깊이, 임베디션 차원을 소비합니다. 실제 추론에 남아있는 것은 동일한 모델에서 높은 리소스 언어를 얻는 것보다 체계적으로 작습니다.

실제 증상은: 모델은 보통 힌디어로 훈련하고, 손실 곡선은 옳고 그름이고, 평가 혼란은 합리적인 것으로 보이며, 생산 결과물은 미묘하게 잘못되어 있습니다. 문장 중에서 형태학이 붕괴됩니다. 희귀한 굴곡은 회복되지 않습니다.**You cannot data-scale your way out of a broken tokenizer.**

완화: 목표 언어에 대한 좋은 보급을 가진 토큰라이저를 선택하십시오 (XLM-V의 1M 토큰 어휘는 직접적인 수정입니다); 훈련 전에 보유된 목표 텍스트에 대한 토큰화 비옥성을 확인하십시오; 바이트 레벨의 재발을 사용하십시오 (SentencePiece `byte_fallback=True`, GPT-2형 바이트 레벨 BPE) 를 통해 실제로 긴 꼬리 스크립트를 사용할 수 있으므로 OOV는 없습니다.

## 선박

`outputs/skill-multilingual-picker.md`이 부분의 본문은

```markdown
---
name: multilingual-picker
description: Pick source language, target model, and evaluation plan for a multilingual NLP task.
version: 1.0.0
phase: 5
lesson: 18
tags: [nlp, multilingual, cross-lingual]
---

Given requirements (target languages, task type, available labeled data per language), output:

1. Source language for fine-tuning. Default English; check LANGRANK or qWALS if target language has a typologically close high-resource language.
2. Base model. XLM-R (classification), mT5 (generation), NLLB (translation), Aya-23 (generative LLM).
3. Few-shot budget. Start with 100-500 target-language examples if available. Zero-shot only if labeling is infeasible.
4. Evaluation plan. Per-language accuracy (not aggregate), cross-lingual consistency, entity-level F1 on non-Latin scripts.

Refuse to ship a multilingual model without per-language evaluation — aggregate metrics hide long-tail failures. Flag scripts with low tokenization coverage (Amharic, Tigrinya, many African languages) as needing a model with byte-fallback (SentencePiece with byte_fallback=True, or byte-level tokenizer like GPT-2).
```

## 운동

1. **Easy.**영어, 프랑스어, 힌디어, 아랍어 각 언어에 10 문장을 대상으로 0 샷 분류 파이프라인을 실행하세요. 각각에 대한 정확성을 보고하세요. 강한 프랑스어, 괜찮은 힌디어, 변수 아랍어를 볼 수 있습니다.
2. **Medium.**사용`paraphrase-multilingual-MiniLM-L12-v2`작은 혼합 언어 코퍼스를 통해 언어 간 검색기를 구축하기 위해서입니다. 영어로 검색하고, 어떤 언어로든 문서를 검색합니다.
3. **Hard.**한글 분류 작업에 대한 영어-원 및 힌디어-원 정렬을 비교하십시오. 두 정권에서 몇 번의 정렬을 위해 500 개의 목표 언어 예제를 사용하십시오. 어느 원이 더 나은 힌디어 정확성을 생산하고 얼마나 많은 것을 보고하십시오. 이것은 소형의 LANGRANK 논문입니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Multilingual model | One model, many languages | Shared vocabulary and parameters across languages. |
| Cross-lingual transfer | Train on one language, run on another | Fine-tune on source, evaluate on target without target-language labels. |
| Zero-shot | No target-language labels | Transfer without fine-tuning on the target language. |
| Few-shot | Small target labels | 100-500 target-language examples used for fine-tuning. |
| mBERT | First multilingual LM | 104-language BERT pretrained on Wikipedia. |
| XLM-R | Standard cross-lingual baseline | 100-language RoBERTa pretrained on CommonCrawl. |
| NLLB | Meta's 200-language MT | No Language Left Behind. Includes 55 low-resource languages. |

## 더 많은 읽기

- [Conneau et al. (2019). Unsupervised Cross-lingual Representation Learning at Scale](https://arxiv.org/abs/1911.02116) XLM-R 종이
- [Pires, Schlinger, Garrette (2019). How Multilingual is Multilingual BERT?](https://arxiv.org/abs/1906.01502) 언어 간 전송 연구 라인을 시작시킨 분석 논문
- [Costa-jussà et al. (2022). No Language Left Behind](https://arxiv.org/abs/2207.04672) NLLB-200 논문
- [Üstün et al. (2024). Aya Model: An Instruction Finetuned Open-Access Multilingual Language Model](https://arxiv.org/abs/2402.07827) 아야, 코헤어의 다국어 LLM
- [Language Similarity Predicts Cross-Lingual Transfer Learning Performance (2026)](https://www.mdpi.com/2504-4990/8/3/65) QWALS/LANGRANK 소스 언어 논문
