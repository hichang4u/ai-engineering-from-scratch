# 질문 에 대답 하는 시스템

> 세 가지 시스템은 현대적인 QA를 형성했습니다. 추출적 발견 스펜. 검색으로 증대된 문서에 지워졌습니다. 생성적 응답을 생산했습니다. 모든 현대 AI 보조원은 세 가지의 혼합입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 11 (Machine Translation), Phase 5 · 10 (Attention Mechanism)
**Time:** ~75 minutes

## 문제

사용자가 "첫 번째 아이폰이 언제 출시되었나요?"라고 입력하고 "2007년 6월 29일"라고 예상합니다. "Apple의 역사는 길고 다양하다". "2007년"은 아닙니다. 문장이 없이 격리되어 앉아 있습니다. 직접적이고, 지형적이고 올바른 답입니다.

지난 10년간 3개의 건축물이 QA를 지배했습니다.

- **Extractive QA.**질문과 답을 포함하고 있는 것으로 알려진 구절을 보면, 그 구절에서 답 기간의 시작과 끝 지표를 찾아보십시오. SQuAD는 정통적 기준입니다.
- **Open-domain QA.**그 구절은 알려지지 않았습니다. 먼저 관련 구절을 검색하고, 그 다음 답을 추출하거나 생성합니다. 이것은 오늘날 모든 RAG 파이프라인의 기초입니다.
- **Generative / Closed-book QA.**큰 언어 모델은 매개 변수 메모리를 통해 답을 얻습니다. 검색도 없습니다. 추론에서 가장 빠르며 사실에 대한 신뢰도가 낮습니다.

2026 년의 트렌드는 하이브리드입니다. 가장 좋은 몇 개의 구절을 검색하고 그 구절에 기반한 답변을 생성하는 모형을 요청합니다. RAG입니다. 수업 14 은 검색 절반을 깊이 다루고 있습니다. 이 수업은 QA 절반을 구축합니다.

## 개념

![QA architectures: extractive, retrieval-augmented, generative](../assets/qa.svg)

**Extractive.**트랜스포머 (BERT 가족) 과 함께 질문과 통과를 앵코드하십시오. 답의 시작과 끝 표지표를 예측하는 두 머리를 훈련하십시오. 손실은 유효한 위치에 대한 크로스 엔트로피입니다. 출력은 통과에서 간격입니다. 결코 환각하지 않습니다 (건설을 통해), 결코 통과가 대답할 수 없는 질문을 처리하지 않습니다 (건설을 통해).

**Retrieval-augmented (RAG).**두 단계, 먼저, 리트리버가 상위...`k`두 번째, 독자 (출제 또는 생성) 는 그 구절을 사용하여 답을 생성합니다. 리트리버-레더 분단은 각각 독립적으로 훈련되고 평가될 수 있습니다. 현대 RAG는 종종 그들 사이에 재등급기를 추가합니다.

**Generative.**디코더만 사용하는 LLM (GPT, Claude, Llama) 는 학습된 무게에서 응답합니다. 검색 단계가 없습니다. 일반적인 지식에서 우수한, 희귀 또는 최근의 사실에서 재앙적입니다. 환각 비율은 훈련 전 데이터에서 사실 빈도에 반대의 상관관계를 가지고 있습니다.

```figure
qa-span
```

## 건설 해

### 단계 1: 미리 훈련된 모델로 추출 QA

```python
from transformers import pipeline

qa = pipeline("question-answering", model="deepset/roberta-base-squad2")

passage = (
    "Apple Inc. released the first iPhone on June 29, 2007. "
    "The device was announced by Steve Jobs at Macworld in January 2007."
)
question = "When was the first iPhone released?"

answer = qa(question=question, context=passage)
print(answer)
```

```python
{'score': 0.98, 'start': 57, 'end': 70, 'answer': 'June 29, 2007'}
```

`deepset/roberta-base-squad2`SQuAD 2.0에 대한 교육이 이루어져 있으며, 여기에는 답이 없는 질문들이 포함되어 있습니다.`question-answering`파이프라인에서 모델의 null 점수가 승리할 때에도 가장 높은 점수를 받는 기간을 반환합니다.`handle_impossible_answer=True`파이프라인 호출: 파이프라인에서 빈 답변을 반환하는 것은 null 점수가 모든 span 점수를 초과할 때만입니다. 항상 `score`어떤 식으로든 현장

### 단계 2: 검색을 위한 증강 파이프라인 (sketch)

```python
from sentence_transformers import SentenceTransformer
import numpy as np

encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

corpus = [
    "Apple Inc. released the first iPhone on June 29, 2007.",
    "Macworld 2007 featured the iPhone announcement by Steve Jobs.",
    "Android launched in 2008 as Google's mobile operating system.",
    "The first iPod was released in 2001.",
]
corpus_embeddings = encoder.encode(corpus, normalize_embeddings=True)


def retrieve(question, top_k=2):
    q_emb = encoder.encode([question], normalize_embeddings=True)
    sims = (corpus_embeddings @ q_emb.T).squeeze()
    order = np.argsort(-sims)[:top_k]
    return [corpus[i] for i in order]


def answer(question):
    passages = retrieve(question, top_k=2)
    combined = " ".join(passages)
    return qa(question=question, context=combined)


print(answer("When was the first iPhone released?"))
```

두 단계 파이프라인. 밀도가 높은 검색기 (Sentence-BERT) 는 의미적 유사성으로 관련 문서를 찾습니다. 추출성 독자 (RoBERTa-SquAD) 는 결합된 상위 문서를 통해 응답 범위를 끌어내습니다. 작은 소체에서 작업합니다. 백만 개의 문서 korpusu를 위해 FAISS 또는 벡터 데이터베이스를 사용하십시오.

### 단계 3: RAG로 생성

```python
def rag_generate(question, llm):
    passages = retrieve(question, top_k=3)
    prompt = f"""Context:
{chr(10).join('- ' + p for p in passages)}

Question: {question}

Answer using only the context above. If the context does not contain the answer, say "I don't know."
"""
    return llm(prompt)
```

순식간에 유의가 중요합니다. 맥락에서 모형을 뚜렷하게 지탱하고, 맥락이 충분하지 않을 때 "나는 모른다"라고 반환하면 순식간에 유의가 40% -60% 감소합니다. 더 복잡한 패턴은 인용, 신뢰 점수 및 구조화된 추출을 추가합니다.

### 4단계: 실제 세계를 반영한 평가

SQuAD의 사용**Exact Match (EM)**그리고**token-level F1**- 그래 EM는 정상화 후 엄격한 일치 (하위자, 스트립 점문, 항목을 제거) F1는 예측과 참조 사이의 토큰 초복을 통해 계산되며 부분적인 신용을 제공합니다. 두 개의 신용 이하의 패러프라시: "2007년 6월 29일"와 "2007년 6월 29일"은 일반적으로 0 EM (정상화 정규절) 를 얻지만 여전히 상복된 토큰에서 상당한 F1을 얻습니다.

생산 QA:

- **Answer accuracy**(LLM 또는 인간 판단, 측정은 의미적 동등성을 캡처하지 않기 때문에).
- **Citation accuracy.**인용된 구절이 실제로 답을 뒷받침합니까? 인용된 구절과 검색된 구절 사이의 문자열 일치를 자동으로 확인하는 것은 비하입니다.
- **Refusal calibration.**답이 검색 된 구절 에 있지 않은 경우, 시스템은 "나는 모른다"라고 올바르게 말합니까?
- **Retrieval recall.**독자를 평가하기 전에, 검색자가`k`독자는 놓친 구절을 고칠 수 없습니다.

### RAGAS: 2026년 생산 평가 프레임워크

`RAGAS`RAG 시스템들을 위해 특별히 제작되었으며 2026년에 배송 기본입니다. 금 참조가 필요하지 않고 네 차원을 점수합니다.

- **Faithfulness.**답의 모든 주장은 검색된 맥락에서 나온가? NLI 기반의 결과로 측정됩니다.
- **Answer relevance.**답은 질문에 답하는가? 답에서 가설적인 질문을 생성하고 실제 질문에 비교함으로써 측정됩니다.
- **Context precision.**검색된 조각 중 실제로 어떤 분자가 관련되었나요?
- **Context recall.**검색된 집합은 필요한 모든 정보를 포함했습니까?

참조 없는 점수는 순서대로 정리한 금 답변 없이 실시간 제작 트래픽을 평가할 수 있습니다. 정확한 일치 메트릭이 쓸모없는 오픈 엔딩 질문에서 상위 LLM-와 판사.

`pip install ragas`리트리버 + 리더를 연결해 질 수 있는 4개의 스칼러를 얻으세요

## 사용 하 고

2026년 팩

| Use case | Recommended |
|---------|-------------|
| Given passage, find answer span | `deepset/roberta-base-squad2` |
| Over a fixed corpus, closed-book not acceptable | RAG: dense retriever + LLM reader |
| Real-time over a document store | RAG with hybrid (BM25 + dense) retriever + reranker (lesson 14) |
| Conversational QA (follow-up questions) | LLM with conversation history + RAG on each turn |
| Highly factual, regulated domains | Extractive over an authoritative corpus; never generative alone |

추출적 질적 검증은 2026년에 비모드화되었습니다. 왜냐하면 LLM를 가진 RAG가 더 많은 사건을 처리하기 때문입니다. 그것은 여전히 문자적 인용이 필요한 맥락에서 배포됩니다. 법률 연구, 규제 준수, 감사 도구.

## 선박

`outputs/skill-qa-architect.md`이 부분의 본문은

```markdown
---
name: qa-architect
description: Choose QA architecture, retrieval strategy, and evaluation plan.
version: 1.0.0
phase: 5
lesson: 13
tags: [nlp, qa, rag]
---

Given requirements (corpus size, question type, factuality constraint, latency budget), output:

1. Architecture. Extractive, RAG with extractive reader, RAG with generative reader, or closed-book LLM. One-sentence reason.
2. Retriever. None, BM25, dense (name the encoder), or hybrid.
3. Reader. SQuAD-tuned model, LLM by name, or "domain-fine-tuned DistilBERT."
4. Evaluation. EM + F1 for extractive benchmarks; answer accuracy + citation accuracy + refusal calibration for production. Name what you are measuring and how you are measuring it.

Refuse closed-book LLM answers for regulatory or compliance-sensitive questions. Refuse any QA system without a retrieval-recall baseline (you cannot evaluate the reader without knowing the retriever surfaced the right passage). Flag questions that require multi-hop reasoning as needing specialized multi-hop retrievers like HotpotQA-trained systems.
```

## 운동

1. **Easy.**위키백과 10개의 구절에 SQuAD 추출 파이프라인을 설정하십시오. 수동으로 10개의 질문을 합니다. 답이 얼마나 자주 올바르게 있는지 측정합니다. 문장과 질문들이 깨끗하다면 7-9을 올바르게 보아야 합니다.
2. **Medium.**거부 분류자를 추가하십시오. 최고 검색 점수가 열계值 (예컨대 0.3 코시네스) 아래를 놓으면, 독자를 호출하는 대신 "나는 모른다"를 반환합니다. 열계值를 유지된 세트에 조정합니다.
3. **Hard.**10,000개의 문서의 코퍼스를 통해 RAG 파이프라인을 구축하세요. RRF 융합으로 하이브리드 검색 (BM25 + 팽창) 을 구현하세요. (강습 14 참조). 하이브리드 단계와 그 없이 답변 정확성을 측정하세요. 어떤 질문 유형이 가장 유익한 문서가 있는지 확인하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Extractive QA | Find the answer span | Predict start and end indices of the answer within a given passage. |
| Open-domain QA | QA over a corpus | No given passage; must retrieve then answer. |
| RAG | Retrieve then generate | Retrieval-augmented generation. Retriever + reader pipeline. |
| SQuAD | Canonical benchmark | Stanford Question Answering Dataset. EM + F1 metrics. |
| Hallucination | Made-up answer | Reader output not supported by retrieved context. |
| Refusal calibration | Know when to shut up | System correctly says "I don't know" when unable to answer. |

## 더 많은 읽기

- [Rajpurkar et al. (2016). SQuAD: 100,000+ Questions for Machine Comprehension of Text](https://arxiv.org/abs/1606.05250) 기준서
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) DPR, QA의 가밀한 복원기
- [Lewis et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) RAG라는 신문을 썼습니다.
- [Gao et al. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey](https://arxiv.org/abs/2312.10997) 종합적인 RAG 조사
