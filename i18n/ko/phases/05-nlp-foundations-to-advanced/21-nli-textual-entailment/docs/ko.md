# 자연어 추론  텍스트적 인 포함

> "t 가 h 를 포함 한다"는 사람 t 가 h 를 진실 한 것으로 결론 내리는 것을 의미합니다. NLI 는 포함 / 모순 / 중립을 예측하는 작업입니다. 표면에서 지루함, 생산에서 부담을 내기.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment Analysis), Phase 5 · 13 (Question Answering)
**Time:** ~60 minutes

## 문제

요약서를 만들었는데요 요약은 어떻게 알 수 있을까요?

채팅 로봇을 만들었는데 답은 "예"입니다.

10,000개의 뉴스 기사를 주제에 따라 분류해야 합니다. 훈련 표지가 없습니다. 모델을 재사용할 수 있나요?

이 세 가지 문제 모두 자연어 추론으로 줄게 됩니다. NLI는 이렇게 질문합니다:`t`그리고 가설`h`, 이 `h``t`, 모순 또는 중립 (관계가 없는)?

- **Hallucination check:** `t`= 출처 문서, `h`= 요약 주장, 즉, 함유된 것 = 환각
- **Grounded QA:** `t`= 검색된 문장`h`= 생성된 답.
- **Zero-shot classification:** `t`= 문서,`h`= 말 그대로 표시된 표지판 ("이건 스포츠에 관한 것")

하나의 작업, 세 개의 생산 사용이 있습니다. 그래서 모든 RAG 평가 프레임워크는 NLI 모델을 모자가 아래로 보내줍니다.

## 개념

![NLI: three-way classification, premise vs hypothesis](../assets/nli.svg)

**The three labels.**

- **Entailment.** `t`→`h`"고양이 매트에 있네"는 "고양이 있다"라는 뜻입니다.
- **Contradiction.** `t`→`h`"고양이 매트에 있네"는 "고양이 없다"는 것과는 대조적이다.
- **Neutral.**"고양이 매트에 있다"는 "고양이 배고프다"에 중립적입니다.

**Not logical entailment.**NLI는 일반적인 인간 독자가 추론하는 것을 의미하며 엄격한 논리적인 결론이 아닙니다. "존은 개를 걷었다"는 것은 NLI에서 "존은 개를 가지고 있다"는 것을 의미합니다. 그러나 엄격한 첫 번째 질의 논리는 소유를 독자적으로 정의하면만 인정할 것입니다.

**Datasets.**

- **SNLI**(2015). 570k 인간에 의해 언급 된 쌍, 영상 캡션이 전용으로. 좁은 영역.
- **MultiNLI**(2017). 10 가지 장르의 433k 쌍. 2026 년 표준 교육 코퍼스.
- **ANLI**(2019). 역설적 NLI. 인간은 기존 모델을 깨기 위해 특별히 설계된 예제를 썼다. 더 힘들다.
- **DocNLI, ConTRoL**(2020~21) 문서 길이를 가진 전용물. 다중 홉 및 장거리 추론 테스트.

**The architecture.**트랜스포머 코더 (BERT, RoBERTa, DeBERTa) 는 읽는다 `[CLS] premise [SEP] hypothesis [SEP]`- `[CLS]`3가지의 소프트맥스를 공급합니다. MNLI를 통해 훈련하고, 유지된 벤치마크에 따라 평가하고, 배포쌍에서 90% 이상의 정확성을 얻습니다.

**Zero-shot via NLI.**문서와 후보 라벨을 제공하면 각 라벨을 가설로 변환하십시오 ("이 텍스트는 스포츠에 관한 것입니다"). 각 문서에 대한 포함 확률을 계산하십시오. 최대값을 선택하십시오. 이것은 Hugging Face의 메커니즘입니다 `zero-shot-classification`파이프라인

```figure
nli-router
```

## 건설 해

### 단계 1: 미리 훈련된 NLI 모델을 실행

```python
from transformers import pipeline

nli = pipeline("text-classification",
               model="facebook/bart-large-mnli",
               top_k=None)  # return all labels; replaces deprecated return_all_scores=True

premise = "The cat is sleeping on the couch."
hypothesis = "There is a cat in the room."

result = nli({"text": premise, "text_pair": hypothesis})[0]
print(result)
# [{'label': 'entailment', 'score': 0.97},
#  {'label': 'neutral', 'score': 0.02},
#  {'label': 'contradiction', 'score': 0.01}]
```

생산 NLI에 대해서는 `facebook/bart-large-mnli`그리고`MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli`DeBERTa-v3는 순위표에서 가장 높은 점수를 차지합니다.

### 단계 2: 0 샷 분류

```python
zs = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

text = "The stock market rallied after the central bank cut interest rates."
labels = ["finance", "sports", "politics", "technology"]

result = zs(text, candidate_labels=labels)
print(result)
# {'labels': ['finance', 'politics', 'technology', 'sports'],
#  'scores': [0.92, 0.05, 0.02, 0.01]}
```

템플릿은 기본적으로 "이 예제에서 {etiket}."에 대해 표시됩니다.`hypothesis_template`훈련 자료가 필요없고 정렬도 필요없고, 순서대로 작동합니다.

### 단계 3: RAG에 대한 충실성 검증

```python
def is_faithful(answer, context, threshold=0.5):
    result = nli({"text": context, "text_pair": answer})[0]
    entail = next(s for s in result if s["label"] == "entailment")
    return entail["score"] > threshold
```

RAGAS의 신뢰성의 핵심은 이것입니다. 생성된 답을 원자력 주장으로 나눕니다. 각 주장을 검색된 맥락에 따라 확인합니다. 그 결과의 분자를 보고합니다.

### 단계 4: 핸드 롤 NLI 분류기 (설계)

보시다시피`code/main.py`stdlib만 있는 장난감: 전제와 가설은 레스컬 오버라프 + 부정 검출을 통해 비교된다. 트랜스포머 모델과 경쟁력이 없다  하지만 작업의 형태를 보여줍니다: 두 텍스트, 3방향 라벨, 손실 = 크로스 엔트로피 `{entail, contradict, neutral}`- 그래

## 함정

- **Hypothesis-only shortcuts.**모델은 SNLI에서 가설만으로 약 60%의 레이블을 예측할 수 있습니다. 왜냐하면 "아니오", "아무도", "아무도"는 모순과 상관관계가 있기 때문입니다.
- **Lexical overlap heuristic.**후속 유리스틱 ("모든 후속이 포함된다") 는 SNLI를 통과하지만 HANS/ANLI를 실패합니다. 적립 기준을 사용하십시오.
- **Document-length degradation.**단일 문장 NLI 모델은 문서 길이의 공간에서 20+ F1를 떨어뜨립니다. 긴 맥락에서 DocNLI를 훈련한 모델을 사용하십시오.
- **Zero-shot template sensitivity.**"이 예제에는 {라벨}"와 "{라벨}"와 "이 주제는 {라벨}"에 대한 정확도가 10+ 포인트로 변할 수 있습니다. 템플릿을 조정하십시오.
- **Domain mismatch.**MNLI는 일반 영어 교육을 실시한다. 법률, 의학 및 과학 텍스트는 영역별 NLI 모델 (예를 들어 SciNLI, MedNLI) 를 필요로 한다.

## 사용 하 고

2026년 스택:

| Use case | Model |
|---------|-------|
| General-purpose NLI | `MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli` |
| Fast / edge | `cross-encoder/nli-deberta-v3-base` |
| Zero-shot classification (lightweight) | `facebook/bart-large-mnli` |
| Document-level NLI | `MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli` |
| Multilingual | `MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli` |
| Hallucination detection in RAG | NLI layer inside RAGAS / DeepEval |

2026 메타 패턴: NLI는 텍스트 이해의 접착 테이프입니다. "A가 B를 지원합니까?" 또는 "A가 B를 모순합니까?"

## 선박

`outputs/skill-nli-picker.md`이 부분의 본문은

```markdown
---
name: nli-picker
description: Pick an NLI model, label template, and evaluation setup for a classification / faithfulness / zero-shot task.
version: 1.0.0
phase: 5
lesson: 21
tags: [nlp, nli, zero-shot]
---

Given a use case (faithfulness check, zero-shot classification, document-level inference), output:

1. Model. Named NLI checkpoint. Reason tied to domain, length, language.
2. Template (if zero-shot). Verbalization pattern. Example.
3. Threshold. Entailment cutoff for the decision rule. Reason based on calibration.
4. Evaluation. Accuracy on held-out labeled set, hypothesis-only baseline, adversarial subset.

Refuse to ship zero-shot classification without a 100-example labeled sanity check. Refuse to use a sentence-level NLI model on document-length premises. Flag any claim that NLI solves hallucination — it reduces it; it does not eliminate it.
```

## 운동

1. **Easy.**달아`facebook/bart-large-mnli`20개의 손으로 만든 (기본, 가설, 라벨) 삼중을 모두 포함하고 있습니다. 정확성을 측정합니다. 적대적 "서서열 유리스틱" 함정을 추가합니다 ("나는 케이크를 먹지 않았다"와 "나는 케이크를 먹었다") 그리고 그것이 깨지는지 확인하십시오.
2. **Medium.**0 샷 템플릿을 비교하세요`"This text is about {label}"`반대`"The topic is {label}"`그리고`"{label}"`100개의 AG 뉴스 헤드라인에서 보고합니다.
3. **Hard.**RAG 충실성 검사를 구축: 원자소신 분해 + 각소신에 대한 NLI. 금 컨텍스트를 가진 50 개의 RAG 생성 답변에 대해 평가하십시오. 거짓 긍정 및 거짓 부정률을 측정합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| NLI | Natural Language Inference | 3-way classification of premise-hypothesis relationship. |
| RTE | Recognizing Textual Entailment | Older name for NLI; same task. |
| Entailment | "t implies h" | A typical reader would conclude h is true given t. |
| Contradiction | "t rules out h" | A typical reader would conclude h is false given t. |
| Neutral | "undecided" | No inference from t to h either way. |
| Zero-shot classification | NLI as classifier | Verbalize labels as hypotheses, pick max entailment. |
| Faithfulness | Is the answer supported? | NLI over (retrieved context, generated answer). |

## 더 많은 읽기

- [Bowman et al. (2015). A large annotated corpus for learning natural language inference](https://arxiv.org/abs/1508.05326) SNLI
- [Williams, Nangia, Bowman (2017). A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426) 다중
- [Nie et al. (2019). Adversarial NLI](https://arxiv.org/abs/1910.14599) ANLI 기준표
- [Yin, Hay, Roth (2019). Benchmarking Zero-shot Text Classification](https://arxiv.org/abs/1909.00161) NLI-as-classifier
- [He et al. (2021). DeBERTa: Decoding-enhanced BERT with Disentangled Attention](https://arxiv.org/abs/2006.03654)2026년 NLI의 일마
