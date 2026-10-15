# 주제 모델링  LDA 및 BERTopic

> LDA: 문서 는 주제 의 혼합물 이고, 주제 는 단어 의 분포 이다. BERTopic: 문서 는 임베디 칸 에 집합 되어 있고, 집합 은 주제 이다. 동일한 목표, 다른 분해.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word2Vec)
**Time:** ~45 minutes

## 문제

고객 지원 티켓 10,000개, 뉴스 기사 50,000개, 트위터 200,000개, 수집품에 대해 읽지 않고도 알아야 합니다. 카테고리를 표시하지 않습니다. 몇 개의 카테고리가 있는지조차 모릅니다.

주제 모델링은 감독 없이 답을 제공합니다. 코퍼스를 제공하여, 작은 일련의 일관된 주제들을 다시 얻습니다. 그리고 각 문서에 대해, 그 주제들에 대한 배포를 얻습니다.

두 개의 알고리즘 가족들이 지배한다. LDA (2003) 는 각 문서를 잠잠한 주제의 혼합과 각 주제를 단어에 대한 분포로 취급한다. 추론은 베이시어이다. 그것은 여전히 혼합 멤버십 주제가 할당되고 설명 가능한 단어 수준 확률 분포가 필요한 생산에 배포된다.

BERTopic (2020) 은 BERT로 문서를 암호화하고, UMAP로 차원성을 줄이고, HDBSCAN로 클러스터를 만들고, 클래스 기반 TF-IDF를 통해 주제 단어를 추출합니다. 짧은 텍스트, 소셜 미디어 및 단어 중복보다 의미적 유사성이 중요하게 된 모든 것을 이길 수 있습니다. 한 문서는 한 주제로, 이는 긴 형태의 콘텐츠의 한계입니다.

이 수업은 두 가지의 직관과 특정 코퍼스에 어떤 이름을 선택해야 하는지 보여줍니다.

## 개념

![LDA mixture model vs BERTopic clustering](../assets/topic-modeling.svg)

**LDA generative story.**각 주제는 단어에 대한 분포입니다. 각 문서는 주제의 혼합입니다. 문서에서 단어를 생성하려면 문서의 혼합에서 주제를 샘플링하고, 그 주체의 분포에서 단어를 샘플링합니다. 추론은 이것을 역전합니다. 관찰 된 단어를 주어서 문서에 대한 주체의 분포와 주체에 대한 단어 분포를 추론합니다. 붕괴된 기브스 샘플링 또는 변동 베이즈가 수학을합니다.

키 LDA 출력:

- `doc_topic`: 매트릭스`(n_docs, n_topics)`, 각 줄은 1 (문서 주제가 혼합) 로 합당한다.
- `topic_word`: 매트릭스`(n_topics, vocab_size)`, 각 줄은 1 (주문의 단어 분포) 로 합당한다.

**BERTopic pipeline.**

1. 문장 변환기 (예를 들어, ) 로 각 문서를 암호화`all-MiniLM-L6-v2`) 384차원 벡터
2. UMAP로 차원성을 ~ 5 차원으로 줄이십시오. BERT 임베디션은 클러스터링에 너무 얇습니다.
3. HDBSCAN을 사용하는 클러스터. 밀도 기반, 변형 크기의 클러스터와 "아탈리아" 라벨을 생성합니다.
4. 각 클러스터에 대해 클래스 기반 TF-IDF를 클러스터 문서에 계산하여 주요 단어를 추출합니다.

출력 (output) 은 문서당 하나의 주제가 (plus a -1 outlier label) 이다. 선택적으로 HDBSCAN의 확률 벡터를 통해 부드러운 회원가입이다.

```figure
topic-drift
```

## 건설 해

### 단계 1: Sikit-learn을 통해 LDA

```python
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
import numpy as np


def fit_lda(documents, n_topics=5, max_features=1000):
    cv = CountVectorizer(
        max_features=max_features,
        stop_words="english",
        min_df=2,
        max_df=0.9,
    )
    X = cv.fit_transform(documents)
    lda = LatentDirichletAllocation(
        n_components=n_topics,
        random_state=42,
        max_iter=50,
        learning_method="online",
    )
    doc_topic = lda.fit_transform(X)
    feature_names = cv.get_feature_names_out()
    return lda, cv, doc_topic, feature_names


def print_top_words(lda, feature_names, n_top=10):
    for idx, topic in enumerate(lda.components_):
        top_idx = np.argsort(-topic)[:n_top]
        words = [feature_names[i] for i in top_idx]
        print(f"topic {idx}: {' '.join(words)}")
```

참고: 스톱워드 삭제, min_df 및 max_df 필터 희귀하고 유비쿼터스 용어, CountVectorizer (TfidfVectorizer) 로 인해 LDA는 원자력 계산을 기대합니다.

### 단계 2: BERTopic (생산)

```python
from bertopic import BERTopic

topic_model = BERTopic(
    embedding_model="sentence-transformers/all-MiniLM-L6-v2",
    min_topic_size=15,
    verbose=True,
)

topics, probs = topic_model.fit_transform(documents)
info = topic_model.get_topic_info()
print(info.head(20))
valid_topics = info[info["Topic"] != -1]["Topic"].tolist()
for topic_id in valid_topics[:5]:
    print(f"topic {topic_id}: {topic_model.get_topic(topic_id)[:10]}")
```

필터가 켜져 있어요`Topic != -1`BERTopic의 외상 덤불을 떨어뜨립니다 (HDBSCAN 문서가 클러스터할 수 없었습니다). `min_topic_size`HDBSCAN의 최소 클러스터 크기를 제어합니다. BERTopic의 라이브러리 기본은 10. 이 예제에서는 수업 규모를 위해 명시적으로 15으로 설정합니다. 10,000 개 이상의 문서에 대해 50 또는 100으로 증가합니다.

### 단계 3: 평가

두 가지 방법 모두 주제 단어들을 생성합니다. 문제는 그 단어들이 일치하는지 여부입니다.

- **Topic coherence (c_v).**슬라이딩 창 컨텍스트에서 상위 단어 쌍의 NPMI (정상화 된 점 지향 상호 정보) 를 결합하여 주체 벡터로 점수를 합쳐, 코시노 유사성으로 해당 벡터를 비교합니다. 더 높으면 더 좋습니다. 사용 `gensim.models.CoherenceModel``coherence="c_v"`- 그래
- **Topic diversity.**모든 주제의 주요 단어들 중 고유한 단어의 분자. 더 높으면 더 좋습니다 (목적은 겹치지 않습니다).
- **Qualitative inspection.**각 주제 의 주요 단어 를 읽어 보십시오. 그 들 은 실제적 인 것 을 이름 지고 있습니까? 인간 의 판단 은 여전히 마지막 방어 라인 입니다.

## 언제 선택해야 하는 것

| Situation | Pick |
|-----------|------|
| Short text (tweets, reviews, headlines) | BERTopic |
| Long documents with topic mixtures | LDA |
| No GPU / limited compute | LDA or NMF |
| Need document-level multi-topic distributions | LDA |
| LLM integration for topic labeling | BERTopic (direct support) |
| Resource-constrained edge deployment | LDA |
| Max semantic coherence | BERTopic |

가장 큰 실용적인 고려 사항은 문서 길다. BERT 임베디션은 줄여서, LDA는 임베디션 모델의 맥락보다 긴 문서에 대해 LDA를 사용한다.

## 사용 하 고

2026년 스택:

- **BERTopic.**짧은 텍스트와 의미론이 중요한 모든 것을 기본으로 설정합니다.
- **`gensim.models.LdaModel`.**고전형 생산형 LDA, 성숙하고 전투 테스트를 거쳐
- **`sklearn.decomposition.LatentDirichletAllocation`.**실험에 쉬운 LDA
- **NMF.**비 부정적 매트릭스 인산화. LDA에 대한 빠른 대안, 짧은 텍스트에 비교 가능한 품질.
- **Top2Vec.**BERTopic과 비슷한 디자인, 작은 커뮤니티이지만 일부 기준에 따라 좋은 디자인입니다.
- **FASTopic.**아주 큰 코퍼스에서 BERTopic보다 더 빠르고 새로운
- **LLM-based labeling.**클러스터링을 실행하고, 각각의 클러스터를 이름 붙이는 모델을 요청하십시오.

## 선박

`outputs/skill-topic-picker.md`이 부분의 본문은

```markdown
---
name: topic-picker
description: Pick LDA or BERTopic for a corpus. Specify library, knobs, evaluation.
version: 1.0.0
phase: 5
lesson: 15
tags: [nlp, topic-modeling]
---

Given a corpus description (document count, avg length, domain, language, compute budget), output:

1. Algorithm. LDA / NMF / BERTopic / Top2Vec / FASTopic. One-sentence reason.
2. Configuration. Number of topics: `recommended = max(5, round(sqrt(n_docs)))`, clamped to 200 for corpora under 40,000 docs; permit >200 only when the corpus is genuinely large (>40k) and note the increased compute cost. `min_df` / `max_df` filters and embedding model for neural approaches also belong here.
3. Evaluation. Topic coherence (c_v) via `gensim.models.CoherenceModel`, topic diversity, and a 20-sample human read.
4. Failure mode to probe. For LDA, "junk topics" absorbing stopwords and frequent terms. For BERTopic, the -1 outlier cluster swallowing ambiguous documents.

Refuse BERTopic on documents longer than the embedding model's context window without a chunking strategy. Refuse LDA on very short text (tweets, reviews under 10 tokens) as coherence collapses. Flag any n_topics choice below 5 as likely wrong; flag >200 on corpora under 40k docs as likely over-splitting.
```

## 운동

1. **Easy.**20개의 뉴스그룹 데이터 세트에 5개의 주제와 LDA를 맞게 합니다. 주제마다 10개의 단어를 인쇄합니다. 각 주제에 손으로 표기합니다. 알고리즘은 실제 범주를 찾습니까?
2. **Medium.**같은 20개의 뉴스그룹 하위집에 BERTopic를 적용하세요. 발견된 주제, 주요 단어, 질적 일관성을 LDA에 비교하세요. 실제 범위를 더 깨끗하게 표면에 내세우는 것은 무엇입니까?
3. **Hard.**LDA와 BERTopic 모두에 대한 c_v 호응을 계산하세요. 각각 5, 10, 20, 50개의 주제를 실행하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Topic | A thing the corpus is about | A probability distribution over words (LDA) or a cluster of similar documents (BERTopic). |
| Mixed membership | Doc is multiple topics | LDA assigns each document a distribution over all topics. |
| UMAP | Dimensionality reduction | Manifold learning that preserves local structure; used in BERTopic. |
| HDBSCAN | Density clustering | Finds variable-size clusters; produces "noise" label (-1) for outliers. |
| c_v coherence | Topic quality metric | Average pointwise mutual information of top topic words within sliding windows. |

## 더 많은 읽기

- [Blei, Ng, Jordan (2003). Latent Dirichlet Allocation](https://www.jmlr.org/papers/volume3/blei03a/blei03a.pdf) LDA 논문
- [Grootendorst (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure](https://arxiv.org/abs/2203.05794) BERTopic 논문
- [Röder, Both, Hinneburg (2015). Exploring the Space of Topic Coherence Measures](https://svn.aksw.org/papers/2015/WSDM_Topic_Evaluation/public.pdf) C_v와 친구들을 소개한 논문
- [BERTopic documentation](https://maartengr.github.io/BERTopic/) 생산 기준. 우수한 예제.
