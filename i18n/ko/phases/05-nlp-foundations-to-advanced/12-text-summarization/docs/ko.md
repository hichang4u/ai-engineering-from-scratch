# 본문 요약

> 추출 시스템들은 문서가 무엇을 말하고 있는지 알려줍니다. 추상 시스템들은 저자가 무엇을 의미하는지 알려줍니다. 다른 작업, 다른 함정이 있습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 11 (Machine Translation)
**Time:** ~75 minutes

## 문제

2,000 단어의 뉴스 기사는 피드에 도착합니다. 120 단어로 포착해야 합니다. 기사를 통해 가장 중요한 세 문장을 선택하거나 자신의 단어로 재발표할 수 있습니다. 둘 다 요약이라고 합니다. 그것들은 완전히 다른 문제입니다.

추출적 요약은 순위 문제입니다. 각 문장을 점수하고, 상위...`k`. 출력기는 항상 문법적이기 때문에 말 그대로 들어갑니다. 기사에 분포되는 내용이 빠질 위험이 있습니다.

추상적 요약은 생성 문제입니다. 트랜스포머는 입력에 따라 조건화된 새로운 텍스트를 생성합니다. 출력은 유동적이고 압축적이지만 소재에 있지 않은 사실을 환각시킬 수 있습니다. 위험은 자신감 있는 제조입니다.

이 교훈은 두 가지 모두 구축하고, 각각의 실패 모드가 있습니다.

## 개념

![Extractive TextRank vs abstractive transformer](../assets/summarization.svg)

**Extractive.**기사를 노드 (nodes) 가 문장이고 가장자리는 유사점이라는 그래프로 취급하십시오. 그 그래프 위에 페이지랭크 (또는 비슷한 것) 를 실행하여 문장을 다른 모든 것과 얼마나 연결되어 있는지에 따라 점수를 얻으십시오. 가장 높은 점수를 얻은 문장은 요약입니다.**TextRank**(미하르케아와 타라우, 2004).

**Abstractive.**문서-조약쌍에서 트랜스포머 앵코더-독코더 (BART, T5, Pegasus) 를 정렬하십시오. 추론을 할 때, 모델은 문서를 읽고 간접주의를 통해 요약 토큰을 생성합니다. 특히 페가수스는 격차 문장을 미리 훈련시키는 목표를 사용합니다. 이는 많은 정렬 없이 요약하는 데 탁월합니다.

**ROUGE**(Remall-Oriented Understudy for Gisting Evaluation) ROUGE-1과 ROUGE-2 점수는 unigram과 bigram가 겹치는 것으로 나타났습니다. ROUGE-L 점수는 가장 긴 공통 계열입니다. 더 높이는 것이 좋습니다. 그러나 40 ROUGE-L는 "좋은"이고 50은 "특수"입니다. 모든 논문은 세 가지 모두 보고합니다.`rouge-score`패키지

```figure
summarize-collapse
```

## 건설 해

### 단계 1: 텍스트 랭크 (출제)

```python
import math
import re
from collections import Counter


def sentence_split(text):
    return re.split(r"(?<=[.!?])\s+", text.strip())


def similarity(s1, s2):
    w1 = Counter(s1.lower().split())
    w2 = Counter(s2.lower().split())
    intersection = sum((w1 & w2).values())
    denom = math.log(len(w1) + 1) + math.log(len(w2) + 1)
    if denom == 0:
        return 0.0
    return intersection / denom


def textrank(text, top_k=3, damping=0.85, iterations=50, epsilon=1e-4):
    sentences = sentence_split(text)
    n = len(sentences)
    if n <= top_k:
        return sentences

    sim = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                sim[i][j] = similarity(sentences[i], sentences[j])

    scores = [1.0] * n
    for _ in range(iterations):
        new_scores = [1 - damping] * n
        for i in range(n):
            total_out = sum(sim[i]) or 1e-9
            for j in range(n):
                if sim[i][j] > 0:
                    new_scores[j] += damping * sim[i][j] / total_out * scores[i]
        if max(abs(s - ns) for s, ns in zip(scores, new_scores)) < epsilon:
            scores = new_scores
            break
        scores = new_scores

    ranked = sorted(range(n), key=lambda k: scores[k], reverse=True)[:top_k]
    ranked.sort()
    return [sentences[i] for i in ranked]
```

두 가지 명칭이 가치가 있습니다. 유사 함수는 원래의 텍스트 랭크 변종인 로그 정상화된 단어 중복을 사용합니다. TF-IDF 벡터의 코시네도 작동합니다. 감축 인수 0.85 및 반복 수치는 페이지 랭크 기본입니다.

### 단계 2: BART로 추상

```python
from transformers import pipeline

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

article = """(long news article text)"""

summary = summarizer(article, max_length=120, min_length=60, do_sample=False)
print(summary[0]["summary_text"])
```

BART-large-CNN는 CNN/DailyMail 코퍼스에서 정비되어 있습니다. 뉴스 스타일의 요약을 상자 밖으로 생성합니다. 다른 영역 (과학 논문, 대화, 법률) 에 대해서는 해당 페가수스 체크포인트 또는 목표 데이터에 정비하십시오.

### 단계 3: ROUGE 평가

```python
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
scores = scorer.score(reference_summary, generated_summary)
print({k: round(v.fmeasure, 3) for k, v in scores.items()})
```

항상 스팅을 사용하세요. 그 없이 "running"과 "run"는 서로 다른 단어로 간주되며 ROUGE는 미흡합니다.

### ROUGE를 넘어 (2026년 요약 평가)

ROUGE는 20 년 동안 지배적인 요약 메트릭이 되었으며 2026 년에는 자체적으로 충분하지 않습니다. NLG 논문의 대규모 메타 분석은 다음과 같이 나타났습니다.

- **BERTScore**(현황적 배포 유사성) 은 2023년까지 지지를 얻었고 현재 대부분의 요약 논문에서 ROUGE와 함께 보고되고 있습니다.
- **BARTScore**평가를 생성으로 취급합니다: 미리 훈련된 BART가 소스를 고려하여 어떤 확률로 요약을 할당하는지 기준으로 요약을 점수합니다.
- **MoverScore**(Earth Mover's Distance over contextual embeddings) 는 ROUGE보다 더 나은 의미적 중복을 포착하기 때문에 2025년 요약 기준에서 최고 자리를 차지했습니다.
- **FactCC**그리고**QA-based faithfulness**2021-2023년에도 일반적이었는데, 지금은 종종 대체로 **G-Eval**(GPT-4 초급 연쇄, 연계, 유창성, 연계 사고 논리와 관련성을 점수하는).
- **G-Eval**그리고 비슷한 LLM 판사 접근법은 인적 판단과 일치합니다 ~ 80%의 경우 라우브릭이 잘 설계되어 있습니다.

생산 추천: 레거시 비교를 위해 ROUGE-L 보고, 의미적 중복을 위해 BERTScore 보고, 일관성과 사실성을 위해 G-Eval 보고. 인간 표기된 50-100 개 요약에 맞게 캘리브레이트.

### 4단계: 사실성 문제

추상적 요약은 환각에 유리한다. 추상적 요약은 출력이 소재에서 말 그대로 제거되기 때문에 환각 위험이 훨씬 낮습니다. 그러나 원본 문장이 비현관화되거나 구석되거나 순서로 인용되면 여전히 오해 할 수 있습니다. 이것은 생산 시스템이 여전히 준수와 인접한 콘텐츠를 위해 추상적 방법을 선호하는 유일한 가장 큰 이유입니다.

명칭을 할루시네이션 유형:

- **Entity swap.**소스는 "존 스미스"라고 하고 요약은 "존 브라운"라고 하고
- **Number drift.**소스는 "25,000"라고 하고 요약은 "2500만"라고 합니다.
- **Polarity flip.**소스는 "제 제안은 거절했다"고 말했고, 요약은 "제 제안은 받아들였다"고 말했어요.
- **Fact invention.**소스는 CEO를 언급하지 않고 CEO가 승인했다고 요약합니다.

평가 방식은 다음과 같습니다.

- **FactCC.**소스 문장과 요약 문장 사이의 연관성에 대한 훈련된 바이너리 분류자. 사실/사실이 아닌 예측.
- **QA-based factuality.**QA 모델 질문 을 해 보십시오. 그 질문 의 답 은 출처 에 있습니다. 요약 은 다른 답변 을 뒷받침 하는 경우, 표시 하십시오.
- **Entity-level F1.**소재와 요약에 있는 이름의 단체를 비교해 보세요. 요약에 있는 단체는 의심의 여지가 있습니다.

사실성이 중요하게 되는 사용자와 관련된 모든 것 (뉴스, 의료, 법률, 금융) 에 있어서 추출은 더 안전한 기본입니다. 추출은 사실성 검증이 필요합니다.

## 사용 하 고

2026년 스택:

| Use case | Recommended |
|---------|-------------|
| News, 3-5 sentence summary, English | `facebook/bart-large-cnn` |
| Scientific papers | `google/pegasus-pubmed` or a tuned T5 |
| Multi-document, long-form | Any LLM with 32k+ context, prompted |
| Dialog summarization | `philschmid/bart-large-cnn-samsum` |
| Extractive, low hallucination risk by construction | TextRank or `sumy`'s LSA / LexRank |

장기적인 맥락을 가진 LLM는 2026년에 전문 모델보다 더 많은 결과를 얻을 수 있습니다. 계산이 한계되지 않는 경우.

## 선박

`outputs/skill-summary-picker.md`이 부분의 본문은

```markdown
---
name: summary-picker
description: Pick extractive or abstractive, named library, factuality check.
version: 1.0.0
phase: 5
lesson: 12
tags: [nlp, summarization]
---

Given a task (document type, compliance requirement, length, compute budget), output:

1. Approach. Extractive or abstractive. Explain in one sentence why.
2. Starting model / library. Name it. `sumy.TextRankSummarizer`, `facebook/bart-large-cnn`, `google/pegasus-pubmed`, or an LLM prompt.
3. Evaluation plan. ROUGE-1, ROUGE-2, ROUGE-L (use rouge-score with stemming). Plus factuality check if abstractive.
4. One failure mode to probe. Entity swap is the most common in abstractive news summarization; flag samples where source entities do not appear in summary.

Refuse abstractive summarization for medical, legal, financial, or regulated content without a factuality gate. Flag input over the model's context window as needing chunked map-reduce summarization (not just truncation).
```

## 운동

1. **Easy.**5개의 뉴스 기사에서 텍스트 랭크를 실행하세요. 상위 3개의 문장을 참조 요약에 비교하세요. ROUGE-L를 측정하세요. CNN/DailyMail 스타일의 기사에서 30-45 ROUGE-L를 보실 수 있습니다.
2. **Medium.**엔터테인먼트 수준의 사실관계를 구현: 소스 및 요약 (spaCy) 에서 이름 붙인 엔터테인먼트를 추출하고, 요약에서 소스 엔터테인먼트의 계산 회수 및 소스에 대한 요약 엔터테인먼트의 정확성. 높은 정확성과 낮은 회수라는 것은 안전하지만 간결한 것을 의미합니다. 낮은 정확도는 환각된 엔터테인먼트를 의미합니다.
3. **Hard.**50개의 CNN/DailyMail 기사에서 BART-large-CNN와 LLM (Claude 또는 GPT-4) 를 비교하십시오. ROUGE-L, 사실성 (단체 F1) 및 요약별 비용에 대한 보고서를 작성하십시오. 각자가 승리하는 문서.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Extractive | Pick sentences | Return sentences verbatim from the source. Never hallucinates. |
| Abstractive | Rewrite | Generate new text conditioned on source. Can hallucinate. |
| ROUGE | Summary metric | N-gram / LCS overlap between system output and reference. |
| TextRank | Graph-based extractive | PageRank over sentence similarity graph. |
| Factuality | Is it right | Whether summary claims are supported by the source. |
| Hallucination | Made-up content | Content in the summary that the source does not support. |

## 더 많은 읽기

- [Mihalcea and Tarau (2004). TextRank: Bringing Order into Texts](https://aclanthology.org/W04-3252/) 추출적 성서 논문
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training](https://arxiv.org/abs/1910.13461) BART 종이
- [Zhang et al. (2019). PEGASUS: Pre-training with Extracted Gap-sentences](https://arxiv.org/abs/1912.08777) 페가소스와 격차 문장 목표
- [Lin (2004). ROUGE: A Package for Automatic Evaluation of Summaries](https://aclanthology.org/W04-1013/) 빨간색 종이
- [Maynez et al. (2020). On Faithfulness and Factuality in Abstractive Summarization](https://arxiv.org/abs/2005.00661) 사실적 인 풍경 논문
