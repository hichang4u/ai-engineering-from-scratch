# LLM 평가  RAGAS, DeepEval, G-Eval

> 정확한 일치와 F1는 의미적 동등성을 놓치고 있습니다. 인간 검토는 확장되지 않습니다. LLM-법률 판사는 숫자를 신뢰할 수 있는 충분한 기량으로 생산 답변입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 13 (Question Answering), Phase 5 · 14 (Information Retrieval)
**Time:** ~75 minutes

## 문제

RAG 시스템은 "2007년 6월 29일"이라고 답합니다.
금의 기준은 "2007년 6월 29일"입니다.
정확한 경기 점수는 0. F1 점수는 ~75%. 인간도 100% 점수를 받을 수 있습니다.

이제 10,000개의 테스트 케이스에 곱해 보세요. 검색기, 쪼개기, 트, 또는 모델의 모든 변경에 다시 곱해 보세요. 의미들을 이해하는 평가자가 필요합니다. 규모가 저렴하고, 회귀에 대해 거짓말을 하지 않으며, 올바른 실패 모드를 나타냅니다.

2026년에는 이 문제를 해결하기 위한 세 가지 프레임워크가 있습니다.

- **RAGAS.**검색- 증강 세대 ASsessment. NLI + LLM 판사 백그랜드와 함께 네 가지 RAG 매트릭 (실실성, 응답 관련성, 맥락 정확성, 맥락 회수) 연구 지원, 가벼운.
- **DeepEval.**LLM에 대한 피테스트. G-Eval, 작업 완료, 환각, 편향 측정. CI/CD- 네이티브.
- **G-Eval.**방법 (그리고 DeepEval 메트릭): 사슬의 사고, 사용자 지정 기준, 0-1 점수를 가진 LLM-as-judge.

이 수업은 이 방법과 그 주변의 신뢰층에 대한 직관성을 구축합니다.

## 개념

![Four evaluation dimensions, LLM-as-judge architecture](../assets/llm-evaluation.svg)

**LLM-as-judge.**정적 매트릭을 주위 항목에 따른 출력을 점수를 주는 LLM로 교체하십시오.`(query, context, answer)`, 재판관 LLM에 요청: "신실성 0-1 점수".

왜 효과가 있습니까? LLM는 비용의 작은 부분에서 인간의 판단을 대략적으로 합니다.$0.003 per scored case enables 1000-sample regression eval runs for under $5.

왜 침묵으로 실패하는지:

1. **Judge bias.**판사들은 더 긴 답변을 선호합니다. 자신의 모델 가족에서 나오는 답변입니다.
2. **JSON parsing failures.**나쁜 JSON → NaN 점수는 → 무음으로 집합에서 제외된다. RAGAS 사용자는 이 고통을 알고 있다. try/except + 명시적 실패 모드로 게이트.
3. **Drift over model versions.**판사를 업그레이드하면 모든 매트릭이 바뀌게 됩니다. 판사 모델 + 버전을 얼어붙게 합니다.

**The RAG four.**

| Metric | Question | Backend |
|--------|----------|---------|
| Faithfulness | Does each claim in the answer come from the retrieved context? | NLI-based entailment |
| Answer relevance | Does the answer address the question? | Generate hypothetical questions from answer; compare to real question |
| Context precision | Of retrieved chunks, what fraction were relevant? | LLM-judge |
| Context recall | Did retrieval return everything needed? | LLM-judge against gold answer |

**G-Eval.**사용자 지정 기준을 정의하십시오. "응답은 올바른 소스를 인용했습니까?" 프레임워크는 자동으로 사상 연쇄 평가 단계로 확장되며 0-1을 점수합니다.

**Calibration.**인간 표기판에 대한 상관관계를 가지고 있을 때까지 절대 무작위 판사의 점수를 신뢰하지 마십시오. 100개의 손으로 표기된 예제를 실행하세요. 음반 판사와 인간. 스피어먼 rho를 계산하세요. rho가 0.7보다 작다면 판사의 라브릭이 작동해야 합니다.

```figure
n5-judge-gauge
```

## 건설 해

### 단계 1: NLI (RAGAS 스타일) 에 대한 충실성

```python
from typing import Callable
from transformers import pipeline

nli = pipeline("text-classification",
               model="MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli",
               top_k=None)

# `llm` is any callable: prompt str -> generated str.
# Example: llm = lambda p: client.messages.create(model="claude-haiku-4-5", ...).content[0].text
LLM = Callable[[str], str]


def atomic_claims(answer: str, llm: LLM) -> list[str]:
    prompt = f"""Break this answer into simple factual claims (one per line):
{answer}
"""
    return llm(prompt).splitlines()


def faithfulness(answer: str, context: str, llm: LLM) -> float:
    claims = atomic_claims(answer, llm)
    if not claims:
        return 0.0
    supported = 0
    for claim in claims:
        result = nli({"text": context, "text_pair": claim})[0]
        entail = next((s for s in result if s["label"] == "entailment"), None)
        if entail and entail["score"] > 0.5:
            supported += 1
    return supported / len(claims)
```

답은 원자상 주장으로 분해한다. NLI는 각 주장을 검색된 맥락에 따라 확인한다. 신뢰성 = 분자 지원

### 단계 2: 응답의 관련성

```python
import numpy as np
from sentence_transformers import SentenceTransformer

# encoder: any model implementing .encode(texts, normalize_embeddings=True) -> ndarray
# e.g., encoder = SentenceTransformer("BAAI/bge-small-en-v1.5")

def answer_relevance(question: str, answer: str, encoder, llm: LLM, n: int = 3) -> float:
    prompt = f"Write {n} questions this answer could be the answer to:\n{answer}"
    generated = [line for line in llm(prompt).splitlines() if line.strip()][:n]
    if not generated:
        return 0.0
    q_emb = np.asarray(encoder.encode([question], normalize_embeddings=True)[0])
    g_embs = np.asarray(encoder.encode(generated, normalize_embeddings=True))
    sims = [float(q_emb @ g_emb) for g_emb in g_embs]
    return sum(sims) / len(sims)
```

만약 답이 질문된 것과 다른 질문을 내포한다면, 관련성이 떨어진다.

### 단계 3: G-Eval 사용자 지정 매트릭

```python
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCaseParams, LLMTestCase

metric = GEval(
    name="Correctness",
    criteria="The answer should be factually accurate and match the expected output.",
    evaluation_steps=[
        "Read the expected output.",
        "Read the actual output.",
        "List factual claims in the actual output.",
        "For each claim, mark supported or unsupported by the expected output.",
        "Return score = fraction supported.",
    ],
    evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
)

test = LLMTestCase(input="When was the first iPhone released?",
                   actual_output="June 29th, 2007.",
                   expected_output="June 29, 2007.")
metric.measure(test)
print(metric.score, metric.reason)
```

평가 단계들은 라부릭입니다. 명시적인 단계들은 암시적인 "0-1 점수" 요청보다 더 안정적입니다.

### 단계 4: CI 게이트

```python
import deepeval
from deepeval.metrics import FaithfulnessMetric, ContextualRelevancyMetric


def test_rag_system():
    cases = load_regression_cases()
    faith = FaithfulnessMetric(threshold=0.85)
    rel = ContextualRelevancyMetric(threshold=0.7)
    for case in cases:
        faith.measure(case)
        assert faith.score >= 0.85, f"faithfulness regression on {case.id}"
        rel.measure(case)
        assert rel.score >= 0.7, f"relevancy regression on {case.id}"
```

파일 파일로 배포하고 모든 PR를 실행하고 블록은 회귀에 합쳐집니다.

### 단계 5: 처음부터 장난감 평가

보시다시피`code/main.py`.신성 (사답 주장의 맥락과 겹치는) 과 관련성 (사답 토큰의 질문 토큰의 겹치는) 의 대략적인 추정은 생산이 아니라 형태를 나타냅니다.

## 함정

- **No calibration.**인간 표지와 0.3의 상관관계가 있는 판사는 소음입니다. 배송 전에 캘리브레이션 실행이 필요합니다.
- **Self-evaluation.**같은 LLM를 사용하여 생성하고 판단하는 것은 점수를 10-20%로 증가시킵니다. 판사에게 다른 모델 가족을 사용하십시오.
- **Positional bias in pairwise judging.**판사는 첫 번째 옵션을 선호합니다. 항상 순서를 무작위로 실행합니다.
- **Raw aggregate hides failures.**평균 점수는 0.85로 5%의 실패를 숨기기도 합니다. 항상 아래 쿼티를 검사하세요.
- **Golden dataset rot.**시간으로 유도되는 비판형 평가 집합은 길쭉한 비교를 깨고 모든 변경 사항에 데이터 세트를 표시합니다.
- **LLM cost.**규모로 판사는 비용을 지배합니다. 가장 저렴한 모델을 사용하세요.

## 사용 하 고

2026년 스택:

| Use case | Framework |
|---------|-----------|
| RAG quality monitoring | RAGAS (4 metrics) |
| CI/CD regression gates | DeepEval + pytest |
| Custom domain criteria | G-Eval within DeepEval |
| Online live-traffic monitoring | RAGAS with reference-free mode |
| Human-in-the-loop spot checks | LangSmith or Phoenix with annotation UI |
| Red-teaming / safety eval | Promptfoo + DeepEval |

전형적인 스택: 모니터링을 위한 RAGAS, CI를 위한 DeepEval, 새로운 차원을 위한 G-Eval. 세 가지 모두 실행하세요.

## 선박

`outputs/skill-eval-architect.md`이 부분의 본문은

```markdown
---
name: eval-architect
description: Design an LLM evaluation plan with calibrated judge and CI gates.
version: 1.0.0
phase: 5
lesson: 27
tags: [nlp, evaluation, rag]
---

Given a use case (RAG / agent / generative task), output:

1. Metrics. Faithfulness / relevance / context-precision / context-recall + any custom G-Eval metrics with criteria.
2. Judge model. Named model + version, rationale for cost vs accuracy.
3. Calibration. Hand-labeled set size, target Spearman rho vs human > 0.7.
4. Dataset versioning. Tag strategy, change log, stratification.
5. CI gate. Thresholds per metric, regression-window logic, bottom-quantile alert.

Refuse to rely on a judge untested against ≥50 human-labeled examples. Refuse self-evaluation (same model generates + judges). Refuse aggregate-only reporting without bottom-10% surfacing. Flag any pipeline where judge upgrade lands without parallel baseline eval.
```

## 운동

1. **Easy.**알려진 환각을 가진 10개의 RAG 예제에서 RAGAS를 사용해서 각각의 메트릭의 충실성을 확인하세요.
2. **Medium.**50 QA의 수치는 0-1입니다. G-Eval로 점수를 얻습니다.
3. **Hard.**DeepEval로 가장 큰 CI 게이트를 만들 수 있습니다. 의도적으로 리트리버를 되돌려 놓습니다. 게이트가 실패하는지 확인합니다. 가장 낮은 10%에 임계 체크를 통해 최저 쿼틸 알림을 추가합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| LLM-as-judge | Scoring with an LLM | Prompt a judge model to score outputs 0-1 given a rubric. |
| RAGAS | The RAG metric library | Open-source eval framework with 4 reference-free RAG metrics. |
| Faithfulness | Is the answer grounded? | Fraction of answer claims entailed by retrieved context. |
| Context precision | Were retrieved chunks relevant? | Fraction of top-K chunks that actually mattered. |
| Context recall | Did retrieval find everything? | Fraction of gold-answer claims supported by retrieved chunks. |
| G-Eval | Custom LLM judge | Rubric + chain-of-thought eval steps + 0-1 score. |
| Calibration | Trust but verify | Spearman correlation between judge score and human score. |

## 더 많은 읽기

- [Es et al. (2023). RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217) RAGAS 논문
- [Liu et al. (2023). G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment](https://arxiv.org/abs/2303.16634) G-Eval 종이
- [DeepEval docs](https://deepeval.com/docs/metrics-introduction) 오픈 생산 스택
- [Zheng et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) 편견, 기량, 제한
- [MLflow GenAI Scorer](https://mlflow.org/blog/third-party-scorers) RAGAS, DeepEval, Phoenix를 통합하는 통합 프레임워크
