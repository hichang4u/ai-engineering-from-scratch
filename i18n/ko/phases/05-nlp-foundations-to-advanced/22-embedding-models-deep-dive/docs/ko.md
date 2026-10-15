# 모형을 삽입하는  2026 년 깊은 다이빙

> Word2Vec는 단어당 벡터를 제공했습니다. 현대 임베디션 모델은 간편, 밀집하고 다중 벡터 관점을 가진, 단편별 벡터를 제공했습니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec), Phase 5 · 14 (Information Retrieval)
**Time:** ~60 minutes

## 문제

RAG 시스템은 40%의 경우 잘못된 패스를 검색합니다. 범인은 거의 벡터 데이터베이스 또는 프롬프트가 아닙니다. 그것은 임베디션 모델입니다.

2026년에 임베디션을 선택한다는 것은 다섯 개의 축을 뚫고 선택한다는 것을 의미합니다.

1. **Dense vs sparse vs multi-vector.**하나의 벡터, 하나의 표기, 또는 소소한 단어의 무게가 있는 가방.
2. **Language coverage.**영어 모형 모델은 여전히 영어 전용 과제를 이기며, 복사체들이 혼합되면 다국어 모델이 승리합니다.
3. **Context length.**512 토큰과 8,192 대 32,768  그리고 실제 효과적 용량은 광고된 최대량의 60-70%입니다.
4. **Dimension budget.**3,072개의 전밀함수 = 12 KB/벡터. 100M의 벡터에서는 매월 1,300달러에 저장됩니다.
5. **Open vs hosted.**오픈 웨이트는 스택과 데이터를 제어하는 것을 의미합니다. 호스팅은 항상 최신으로 제어권을 교환하는 것을 의미합니다.

이 수업은 타협에 대한 이름을 붙여서 증거에 대한 정보를 얻을 수 있습니다. 지난 분기에 인기 있는 자료에 대한 것이 아니라

## 개념

![Dense, sparse, and multi-vector embeddings](../assets/embedding-modes.svg)

**Dense embeddings.**한 방면 (일반적으로 384-3,072 차원) 에 한 방면. 코시네 유사성은 방면들을 의미적 근접성으로 분류한다.`text-embedding-3-large`, BGE-M3 밀집 모드, Voyage-3. 기본 선택

**Sparse embeddings.**SPLADE 스타일. 트랜스포머는 각 어휘 토큰의 무게를 예측하고, 그 중 대부분을 0으로 내다. 결과는 크기의 희소한 벡터입니다. 어휘의 일치 (BM25와 같은) 를 캡처하지만 학습된 용어 무게를 가지고 있습니다. 키워드 무거운 질의에 강하다.

**Multi-vector (late interaction).**ColBERTv2, Jina-ColBERT. 토큰당 1개의 벡터. 매스시밍으로 점수를: 각 쿼리 토큰에 대해 가장 유사한 문서 토큰을 찾아, 점수를 합시다. 저장하고 점수를 얻는 데 더 비싸지만 긴 쿼리와 도메인 특정 코퍼에서 승리합니다.

**BGE-M3: all three at once.**단일 모델 출력은 밀집, 희소, 그리고 다중 벡터 표현을 동시에 생성합니다. 각각은 독립적으로 질의할 수 있습니다. 점수는 중량 수를 통해 융합됩니다. 한 점검점에서 유연성을 원하는 경우 기본 2026

**Matryoshka Representation Learning.**이렇게 훈련된 것은 벡터의 첫 N 차원이 유용한 독립적인 임베디션을 형성합니다. 1,536-dim 벡터를 256 dim로 줄이고 6x 저장 저장 비용을 ~ 1% 정확성을 지불합니다. OpenAI 텍스트-3, 코헤르 v4, 여행-4, 지나 v5, 젠미니 임베디션 2, 노믹 v1.5+에서 지원합니다.

### MTEB의 순위표는 부분적인 이야기를 담고 있습니다.

대용량 텍스트 임베디언 벤치마크 (2022) 는 MTEB v2에서 100 이상의 작업으로 확장되었으며, 2026년 초에, Gemini Embedding 2는 검색 (67.71 MTEB-R) 를 최고로 달성했습니다. Cohere embed-v4는 일반 (65.2 MTEB) 를 이끌고 있습니다. BGE-M3는 오픈 웨이트 다국어 (63.0) 를 이끌고 있습니다.

### 3층 패턴

| Use case | Pattern |
|----------|---------|
| Fast first-pass | Dense bi-encoder (BGE-M3, text-3-small) |
| Recall boost | Sparse (SPLADE, BGE-M3 sparse) + RRF fuse |
| Precision on top-50 | Multi-vector (ColBERTv2) or cross-encoder reranker |

대부분의 생산 스택은 세 가지를 모두 사용합니다.

```figure
gx-matryoshka
```

## 건설 해

### 단계 1: 기본 라인  문장-BERT로 밀집한 임베디션

```python
from sentence_transformers import SentenceTransformer
import numpy as np

encoder = SentenceTransformer("BAAI/bge-small-en-v1.5")
corpus = [
    "The first iPhone launched in 2007.",
    "Apple released the iPod in 2001.",
    "Android is an operating system from Google.",
]
emb = encoder.encode(corpus, normalize_embeddings=True)

query = "When was the iPhone released?"
q_emb = encoder.encode([query], normalize_embeddings=True)[0]
scores = emb @ q_emb
print(sorted(enumerate(scores), key=lambda x: -x[1]))
```

`normalize_embeddings=True`이 점 곱이 코시노 유사성 같으면 항상 설정합니다

### 단계 2: 마트리오스카 단절

```python
def truncate(vectors, dim):
    out = vectors[:, :dim]
    return out / np.linalg.norm(out, axis=1, keepdims=True)

emb_256 = truncate(emb, 256)
emb_128 = truncate(emb, 128)
```

단축 후 다시 정상화하십시오. Nomic v1.5, OpenAI 텍스트-3, 및 Voyage-4는 훈련되어있어 첫 몇 단계 동안 손실이 없습니다. 비-마트리오스카 모델 (원본 문장-BERT) 는 단축되면 급격하게 떨어집니다.

### 단계 3: BGE-M3 다기능성

```python
from FlagEmbedding import BGEM3FlagModel

model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True)

output = model.encode(
    corpus,
    return_dense=True,
    return_sparse=True,
    return_colbert_vecs=True,
)
# output["dense_vecs"]:    (n_docs, 1024)
# output["lexical_weights"]: list of dict {token_id: weight}
# output["colbert_vecs"]:  list of (n_tokens, 1024) arrays
```

3개의 지표, 1개의 추론 호출

```python
dense_score = ... # cosine over dense_vecs
sparse_score = model.compute_lexical_matching_score(q_lex, d_lex)
colbert_score = model.colbert_score(q_col, d_col)
final = 0.4 * dense_score + 0.2 * sparse_score + 0.4 * colbert_score
```

네 영역에 무게를 조정해

### 단계 4: 사용자 지정 작업에 MTEB 평가

```python
from mteb import MTEB

tasks = ["ArguAna", "SciFact", "NFCorpus"]
evaluation = MTEB(tasks=tasks)
results = evaluation.run(encoder, output_folder="./mteb-results")
```

* 대표적인* 하위 집합에 따라 후보 모델을 실행하세요.

### 단계 5: 처음부터 손으로 롤한 코시네

보시다시피`code/main.py`. 평균 해싱 트릭 임베디션 (stdlib-만) 트랜스포머 임베디션과 경쟁력이 없지만 모양을 나타냅니다: 토큰화 → 벡터 → 정상화 → 점 제품.

## 함정

- **Same model for query and doc.**일부 모델 (Voyage, Jina-ColBERT) 은 비대칭 코딩을 사용한다.
- **Missing prefix.** `bge-*`모델이 필요해요`"Represent this sentence for searching relevant passages: "`질문 준비 중입니다. 기억이 안되는 경우 3-5 점의 기억 격차
- **Over-trimming Matryoshka.**1,536 → 256은 일반적으로 안전합니다. 1,536 → 64은 안전하지 않습니다. 당신의 평가 세트에 유효합니다.
- **Context truncation.**대부분의 모델들은 최대 길이에 걸쳐 입력값을 조용히 줄이고 있다. 긴 문서들은 쪼개질 필요가 있다 (강습 23 참조).
- **Ignoring latency tail.**MTEB 점수는 p99 지연을 숨기죠. 600M 모델은 335M 모델을 2점으로 제치고 있지만 질의당 3배 더 많은 비용이 들 수 있습니다.

## 사용 하 고

2026년 스택:

| Situation | Pick |
|-----------|------|
| English-only, fast, API | `text-embedding-3-large` or `voyage-3-large` |
| Open-weight, English | `BAAI/bge-large-en-v1.5` |
| Open-weight, multilingual | `BAAI/bge-m3` or `Qwen3-Embedding-8B` |
| Long context (32k+) | Voyage-3-large, Cohere embed-v4, Qwen3-Embedding-8B |
| CPU-only deployment | Nomic Embed v2 (137M params, MoE) |
| Storage-constrained | Matryoshka-truncated + int8 quantization |
| Keyword-heavy queries | Add SPLADE sparse, RRF-fuse with dense |

2026 패턴: BGE-M3 또는 텍스트-3 크기로 시작하여 MTEB로 도메인을 평가하고, 도메인 특정 모델이 3점 이상 승을 당하면 교환합니다.

## 선박

`outputs/skill-embedding-picker.md`이 부분의 본문은

```markdown
---
name: embedding-picker
description: Pick embedding model, dimension, and retrieval mode for a given corpus and deployment.
version: 1.0.0
phase: 5
lesson: 22
tags: [nlp, embeddings, retrieval]
---

Given a corpus (size, languages, domain, avg length), deployment target (cloud / edge / on-prem), latency budget, and storage budget, output:

1. Model. Named checkpoint or API. One-sentence reason.
2. Dimension. Full / Matryoshka-truncated / int8-quantized. Reason tied to storage budget.
3. Mode. Dense / sparse / multi-vector / hybrid. Reason.
4. Query prefix / template if required by the model card.
5. Evaluation plan. MTEB tasks relevant to domain + held-out domain eval with nDCG@10.

Refuse recommendations that truncate Matryoshka to <64 dims without domain validation. Refuse ColBERTv2 for corpora under 10k passages (overhead not justified). Flag long-document corpora (>8k tokens) routed to models with 512-token windows.
```

## 운동

1. **Easy.**  로 100 문장을  암호화`bge-small-en-v1.5`전체 dim (384), Matryoshka 128에서 10 개의 질의에서 MRR를 측정합니다.
2. **Medium.**BGE-M3 밀도가, 희소성, 그리고 콜베르트를 500개의 도메인에서 비교해보세요. 기억@10에서 어느 쪽이 승리할까요?
3. **Hard.**MTEB를 2개의 도메인 작업에서 3개의 후보 모델에서 실행하세요. MTEB 점수를 보고하고, 100개의 쿼리 배치에서 p99 지연수, 그리고 1백만 달러의 쿼리를 보고하세요. Pareto 최적의 쿼리를 선택하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Dense embedding | The vector | One fixed-size vector per text. Cosine similarity for ranking. |
| Sparse embedding | Learned BM25 | One weight per vocab token; mostly zeros; trained end-to-end. |
| Multi-vector | ColBERT-style | One vector per token; MaxSim scoring; bigger index, better recall. |
| Matryoshka | Russian doll trick | First N dims are a valid smaller embedding on their own. |
| MTEB | The benchmark | Massive Text Embedding Benchmark — 56 tasks at launch, 100+ in v2. |
| BEIR | The retrieval benchmark | 18 zero-shot retrieval tasks; often cited for cross-domain robustness. |
| Asymmetric encoding | Query ≠ doc path | Model uses different projections for queries and documents. |

## 더 많은 읽기

- [Reimers, Gurevych (2019). Sentence-BERT](https://arxiv.org/abs/1908.10084) 이중 앵코더 종이
- [Muennighoff et al. (2022). MTEB: Massive Text Embedding Benchmark](https://arxiv.org/abs/2210.07316) 랭킹보드
- [Chen et al. (2024). BGE-M3: Multi-lingual, Multi-functionality, Multi-granularity](https://arxiv.org/abs/2402.03216) 통일된 3 모드 모델
- [Kusupati et al. (2022). Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) 차원 계단 교육 목표
- [Santhanam et al. (2022). ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://arxiv.org/abs/2112.01488) 생산에 늦은 상호 작용.
- [MTEB leaderboard on Hugging Face](https://huggingface.co/spaces/mteb/leaderboard) 실시간 순위
