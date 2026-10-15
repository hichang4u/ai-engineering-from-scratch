# 정보 검색

> BM25는 정확하지만 부서지기 쉽다. 덩치가 넓은 네트워크를 던지지만 키워드를 놓치고 있습니다. 하이브리드는 기본 2026입니다. 다른 모든 것이 조정됩니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 minutes

## 문제

사용자 는 "누군가 돈을 얻기 위해 거짓말을 한다면 어떻게 될까"라고 입력 하고 실제로 이를 다루는 법령을 찾기를 기대 합니다. "IPC 제 420조". 키워드 검색은 완전히 놓치고 있습니다. 공유 된 어휘가 없습니다. 의미적 검색은 법적 텍스트에 임베디드가 훈련되지 않은 경우 놓치고 있습니다. 실제 검색은 둘 다 처리해야합니다.

IR는 모든 RAG 시스템, 모든 검색 바, 모든 문서 사이트의 미묘한 검색 아래의 파이프라인입니다. 생산에서 작동하는 2026 아키텍처는 단일 방법이 아닙니다. 그것은 각각의 실패를 포착하는 상호 보완적인 방법의 연쇄입니다.

이 교훈은 모든 걸 만들어내고, 모든 걸 실패한 이름을 붙여줍니다.

## 개념

![Hybrid retrieval: BM25 + dense + RRF + cross-encoder rerank](../assets/retrieval.svg)

네 층, 필요한 층을 선택해

1. **Sparse retrieval (BM25).**빠른, 정확한 일치, 의미학에서 끔찍한. 역향 지수를 실행합니다. 수백만 문서에 대한 조회에 10ms 미만. 법정 참조, 제품 코드, 오류 메시지, 이름의 엔티티를 얻을 수 있습니다.
2. **Dense retrieval.**벡터로 쿼리 및 문서를 앵코드합니다. 가장 가까운 이웃 검색. 패라프라시 및 의미적 유사성을 캡처합니다. 한 문자로 차이가있는 정확한 키워드 일치가 빠집니다. FAISS 또는 벡터 DB와 한 쿼리에 50-200ms.
3. **Fusion.**순위 목록은 희소하고 밀집한 목록에서 통합합니다. 상호 순위 융합 (RRF) 은 원자 점수를 무시하고 (다른 스케일에서 살고) 순위 위치를만 사용합니다. 한 신호가 영역에 지배한다는 것을 알 때 중량 융합은 옵션입니다.
4. **Cross-encoder rerank.**융합에서 상위 30을 가져가세요. 크로스 코더를 실행하세요 (쿼리 + 문서 함께, 각 쌍을 점수를) 상위 5을 유지하세요. 크로스 코더는 쌍당 2개 코더보다 느려지만 훨씬 더 정확합니다. 당신은 상위 30에만 실행하면 amortize합니다.

3방향 검색 (BM25 + SPLADE와 같은 밀집 + 학습된 공간) 은 2026년 기준에서 2방향을 능가하지만 학습된 공간 지표의 인프라가 필요합니다. 대부분의 팀에게는 2방향 더 크로스 코더 재등급이 가장 좋은 장소입니다.

```figure
gx-hybrid-retrieval
```

## 건설 해

### 단계 1: 처음부터 BM25

```python
import math
import re
from collections import Counter

TOKEN_RE = re.compile(r"[a-z0-9]+")


def tokenize(text):
    return TOKEN_RE.findall(text.lower())


class BM25:
    def __init__(self, corpus, k1=1.5, b=0.75):
        if not corpus:
            raise ValueError("corpus must not be empty")
        self.corpus = [tokenize(d) for d in corpus]
        self.k1 = k1
        self.b = b
        self.n_docs = len(self.corpus)
        self.avg_dl = sum(len(d) for d in self.corpus) / self.n_docs
        self.df = Counter()
        for doc in self.corpus:
            for term in set(doc):
                self.df[term] += 1

    def idf(self, term):
        n = self.df.get(term, 0)
        return math.log(1 + (self.n_docs - n + 0.5) / (n + 0.5))

    def score(self, query, doc_idx):
        q_tokens = tokenize(query)
        doc = self.corpus[doc_idx]
        dl = len(doc)
        freq = Counter(doc)
        score = 0.0
        for term in q_tokens:
            f = freq.get(term, 0)
            if f == 0:
                continue
            numerator = f * (self.k1 + 1)
            denominator = f + self.k1 * (1 - self.b + self.b * dl / self.avg_dl)
            score += self.idf(term) * numerator / denominator
        return score

    def rank(self, query, top_k=10):
        scored = [(self.score(query, i), i) for i in range(self.n_docs)]
        scored.sort(reverse=True)
        return scored[:top_k]
```

두 가지 변수들이 알아야 합니다.`k1=1.5`더 높은 것은 더 많은 무게를 의미하며,`b=0.75`길이 정상화를 제어합니다. 0은 문서 길이를 무시하고, 1은 완전히 정상화합니다. 기본은 원래 논문에서 로버트슨의 권고이며 거의 조정이 필요하지 않습니다.

### 단계 2: 2인코더로 밀집한 검색

```python
from sentence_transformers import SentenceTransformer
import numpy as np


def build_dense_index(corpus, model_id="sentence-transformers/all-MiniLM-L6-v2"):
    encoder = SentenceTransformer(model_id)
    embeddings = encoder.encode(corpus, normalize_embeddings=True)
    return encoder, embeddings


def dense_search(encoder, embeddings, query, top_k=10):
    q_emb = encoder.encode([query], normalize_embeddings=True)
    sims = (embeddings @ q_emb.T).flatten()
    order = np.argsort(-sims)[:top_k]
    return [(float(sims[i]), int(i)) for i in order]
```

L2에 대한 적립을 정상화하여 점 곱은 코시네스`all-MiniLM-L6-v2`384 덩어리, 빠르고, 대부분의 영어 검색에 충분합니다. 다국어 작업에, 사용 `paraphrase-multilingual-MiniLM-L12-v2`. 최대의 정확성,`bge-large-en-v1.5`또는`e5-large-v2`- 그래

### 단계 3: 상호 순위 합병

```python
def reciprocal_rank_fusion(rankings, k=60):
    scores = {}
    for ranking in rankings:
        for rank, (_, doc_idx) in enumerate(ranking):
            scores[doc_idx] = scores.get(doc_idx, 0.0) + 1.0 / (k + rank + 1)
    fused = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [(score, doc_idx) for doc_idx, score in fused]
```

`k=60`이 변수는 원래의 RRF 종이에서 나온다.`k`계급의 차이에 대한 기여를 평평하게 합니다.`k`60은 출판된 기본이며 거의 조정이 필요하지 않습니다.

### 단계 4: 하이브리드 검색 + 재등급

```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


def hybrid_search(query, bm25, encoder, dense_embeddings, corpus, top_k=5, pool_size=30, reranker=reranker):
    sparse_ranking = bm25.rank(query, top_k=pool_size)
    dense_ranking = dense_search(encoder, dense_embeddings, query, top_k=pool_size)
    fused = reciprocal_rank_fusion([sparse_ranking, dense_ranking])[:pool_size]

    pairs = [(query, corpus[doc_idx]) for _, doc_idx in fused]
    scores = reranker.predict(pairs)
    reranked = sorted(zip(scores, [doc_idx for _, doc_idx in fused]), reverse=True)
    return reranked[:top_k]
```

3 단계 구성. BM25는 레크ಸಿಕ 일치를 찾습니다. 밀도가 의미 일치를 찾습니다. RRF는 점수 캘리브레이션이 필요하지 않고 두 순위를 통합합니다. 크로스 앵코더는 쿼리- 문서 쌍을 사용하여 상위 30위를 다시 점수합니다. 이는 미세한 곡물 관련성을 캡처합니다. 앵코더가 놓친 앵코더. 상위 5을 유지하십시오.

### 단계 5: 평가

| Metric | Meaning |
|--------|---------|
| Recall@k | Of queries where the correct document exists, how often is it in the top-k? |
| MRR (Mean Reciprocal Rank) | Average of 1/rank of first relevant document. |
| nDCG@k | Accounts for relevance gradations, not just binary relevant/not. |

특히 RAG에 대해**Recall@k**검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자가 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자가 검색자 중 가장 중요한 숫자는 검색자 중 가장 중요한 숫자가 검색된 숫자가 검색된 숫자에 포함되지 않으면 해당하는 숫자가 검색된 숫자가 검색된 숫자에 포함되지 않으면 해당하는 숫자가 답할 수 없습니다

디버깅 팁: 실패한 쿼리들에 대해 희귀하고 밀집한 순위를 구분하십시오. 한쪽이 올바른 문서를 발견하고 다른 쪽이 그렇지 않으면, 어휘 부합 (정치: 부족한 반을 추가) 또는 의미 모호함 (정치: 더 나은 임베디션 또는 재랭커) 이 있습니다.

## 사용 하 고

2026년 스택:

| Scale | Stack |
|-------|-------|
| 1k-100k docs | In-memory BM25 + `all-MiniLM-L6-v2` embeddings + RRF. No separate DB. |
| 100k-10M docs | FAISS or pgvector for dense + Elasticsearch / OpenSearch for BM25. Run in parallel. |
| 10M+ docs | Qdrant / Weaviate / Vespa / Milvus with hybrid support. Cross-encoder rerank on top-30. |
| Best-quality frontier | Three-way (BM25 + dense + SPLADE) + ColBERT late-interaction reranking |

어떤 선택이든, 평가용 예산. 벤치마크 검색은 엔드-투-엔드 RAG 정확성을 벤치마킹하기 전에 회수합니다. 독자는 검색자가 놓친 것을 수정할 수 없습니다.

### 2026년 생산 RAG에서 얻은 힘든 교훈

- **80% of RAG failures trace to ingestion and chunking, not the model.**팀들은 LLM를 교환하고 명령어를 조정하는 데 몇 주를 보내고 검색은 3번마다 잘못된 맥락을 다시 돌려줍니다.
- **Chunking strategy matters more than chunk size.**고정 크기의 분단은 테이블, 코드 및 둥지를 틀어 놓은 헤더를 깨고 있습니다. 문장 인식은 기본입니다. 의미 또는 LLM 기반의 킹은 기술 문서 및 제품 설명서에 보답합니다.
- **Parent-doc pattern.**정확성 을 위해 작은 "아이" 조각 을 검색 합니다. 같은 부모 섹션 에서 여러 자녀 들 이 나타났을 때, 컨텍스트 를 보존 하기 위해 부모 블록 을 교환 하십시오. 이것은 재 훈련 없이 지속적으로 응답 품질을 높여줍니다.
- **k_rerank=3 is usually optimal.**만약 k=8이 k=3보다 더 좋은 경우, 재등급기는 저하된 성능을 발휘합니다.
- **HyDE / query expansion.**질문에서 가설적인 답을 생성하고, 삽입하고, 검색합니다. 짧은 질문과 긴 문서 사이의 문법 격차를 다릅니다. 훈련 없이 무료 정밀 승강입니다.
- **Context budget under 8K tokens.**그 한계에 대한 연속적인 타격은 리랭커의 임기가 너무 느려졌다는 것을 의미합니다.
- **Version everything.**명령어, 쪼개리 규칙, 임베디션 모델, 리렌커. 어떤 파동은 침묵으로 답변 품질을 깨고. CI 게이트는 신뢰성, 맥락 정확성, 응답되지 않은 질문 비율이 사용자가 보기 전에 블록 회귀.
- **Three-way retrieval (BM25 + dense + learned-sparse like SPLADE) outperforms two-way**2026 기준에 대해, 특히 적절한 명목과 의미학을 혼합하는 쿼리를 위해.

적절한 검색 설계는 2026 년 산업 측정에 따르면 환각을 70-90% 감소시킵니다. 대부분의 RAG 성능 향상은 더 나은 검색에서 비롯됩니다. 모델 정렬이 아닙니다.

## 선박

`outputs/skill-retrieval-picker.md`이 부분의 본문은

```markdown
---
name: retrieval-picker
description: Pick a retrieval stack for a given corpus and query pattern.
version: 1.0.0
phase: 5
lesson: 14
tags: [nlp, retrieval, rag, search]
---

Given requirements (corpus size, query pattern, latency budget, quality bar, infra constraints), output:

1. Stack. BM25 only, dense only, hybrid (BM25 + dense + RRF), hybrid + cross-encoder rerank, or three-way (BM25 + dense + learned-sparse).
2. Dense encoder. Name the specific model. Match to language(s), domain, and context length.
3. Reranker. Name the specific cross-encoder model if used. Flag that rerank adds 30-100ms latency on top-30.
4. Evaluation plan. Recall@10 is the primary retriever metric. MRR for multi-answer. Baseline first, incremental improvements measured against it.

Refuse to recommend dense-only for corpora with named entities, error codes, or product SKUs unless the user has evidence dense handles exact matches. Refuse to skip reranking for high-stakes retrieval (legal, medical) where the final top-5 decides the user's answer.
```

## 운동

1. **Easy.**시행`hybrid_search`500개의 문서의 코퍼스에서 20개의 질문을 테스트하고 BM25만, 덩어리만, 하이브리드만 5개의 기억을 비교합니다.
2. **Medium.**MRR 계산을 추가하십시오. 알려진 올바른 문서의 모든 테스트 쿼리에서 BM25, 밀집 및 하이브리드 순위에서 올바른 문서의 순위를 찾아보십시오. 각 MRR를 보고하십시오.
3. **Hard.**다중 음향 랭킹 손실 (Sentence Transformers) 을 사용하여 도메인에서 밀집한 코더를 정렬하십시오. 500 개의 쿼리 문서 쌍에서 훈련 세트를 구축하십시오. 정렬 전과 후 리콜을 비교하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BM25 | Keyword search | Okapi BM25. Scores documents by term frequency, IDF, and length. |
| Dense retrieval | Vector search | Encode query + doc into vectors, find nearest neighbors. |
| Bi-encoder | Embedding model | Encodes query and doc independently. Fast at query time. |
| Cross-encoder | Reranker model | Encodes query + doc together. Slow but accurate. |
| RRF | Rank fusion | Combine two rankings by summing `1/(k + rank)`. |
| Recall@k | Retrieval metric | Fraction of queries where a relevant doc is in the top-k. |

## 더 많은 읽기

- [Robertson and Zaragoza (2009). The Probabilistic Relevance Framework: BM25 and Beyond](https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf) 최종 BM25 치료
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) DPR, 가톨릭의 양호기
- [Formal et al. (2021). SPLADE: Sparse Lexical and Expansion Model](https://arxiv.org/abs/2107.05720)                                                                                                                                                                                                                                                              
- [Cormack, Clarke, Büttcher (2009). Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) RRF 종이
- [Khattab and Zaharia (2020). ColBERT: Efficient and Effective Passage Search](https://arxiv.org/abs/2004.12832) 늦은 상호작용 검색
