# RAG에 대한 쪼개리 전략

> 싱 구성은 임베디션 모델의 선택만큼 검색 품질에 영향을 미칩니다 (Vectara NAACL 2025). 싱을 잘못하면 어떤 재등급도 당신을 절약하지 않습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 14 (Information Retrieval), Phase 5 · 22 (Embedding Models)
**Time:** ~60 minutes

## 문제

RAG 시스템에 50 페이지의 계약을 넣습니다. 사용자가 " 종료 조항은 무엇입니까?"라고 묻습니다. 검색자는 표면 페이지를 반환합니다. 왜? 모델은 512 개의 토큰 조각에 훈련되었기 때문에 종료 조항은 20 페이지에 위치하고 있으며 페이지 휴식기를 통해 나뉘어 있으며 로컬 키워드가 검색에 연결되지 않습니다.

"더 나은 임베디션 모델을 사세요"는 문제가 아니라 "더 큰 것"입니다.

2026년 2월 기준은 놀라운 결과를 보여줍니다.

- 2026년 벡터 연구: 512 토큰의 재발성 쪼개지는 의미적 쪼개기를 69% → 54% 정확성을 제치고 있습니다.
- 자연문제에서 SPLADE + Mistral-8B: 겹치는 것은 측정 가능한 이익이 전혀 없습니다.
- 컨텍스트 클립: 반응 품질은 2,500개의 컨텍스트 토큰에 급격히 떨어집니다.

"연연"의 답 (말론적 쪼개림, 20%의 초복, 1000개의 토큰) 은 종종 틀립니다. 이 수업은 6가지 전략을 위한 직관성을 구축하고 언제 어느 쪽에 도달해야 하는지 알려줍니다.

## 개념

![Six chunking strategies visualized on one passage](../assets/chunking.svg)

**Fixed chunking.**모든 N 문자나 토큰을 나눌 수 있습니다. 가장 간단한 기본 라인입니다. 문장의 중간에서 깨집니다.

**Recursive.**랭체인`RecursiveCharacterTextSplitter`- 나뉘어봐`\n\n`먼저, 그 다음`\n`그럼`.`2026년 기본으로 다시 떨어집니다.

**Semantic.**각 문장을 삽입하십시오. 인접 문장 간의 코시노 유사성을 계산하십시오. 유사성이 문턱 아래로 떨어지는 곳에서 분할하십시오. 주제의 일관성을 유지합니다. 느리거나 때로는 40 토큰의 작은 조각을 생성합니다.

**Sentence.**문장 경계로 나눌 수 있습니다. 한 문장당 한 문장 또는 N 문장의 창. 비용의 일부로 ~ 5k 토큰까지 의미적 조각과 일치합니다.

**Parent-document.**어린 아이 조각을 검색하기 위해 저장하고, 큰 부모 조각을 컨텍스트에 저장합니다. 자녀별로 검색하고, 부모로 반환합니다. 우아하게 degrades: 나쁜 자녀 조각은 여전히 합리적인 부모로 반환합니다.

**Late chunking (2024).**먼저 토큰 수준에서 전체 문서를 삽입하고, 그 다음 칩 토큰 임베디션을 칩 칩 칩 칩에 통합합니다. 칩 칩 칩 컨텍스트를 보존합니다. 긴 컨텍스트 임베디터 (BGE-M3, Jina v3) 와 함께 작동합니다. 더 높은 계산.

**Contextual retrieval (Anthropic, 2024).**각 부분들을 문서에 있는 LLM에서 생성된 위치의 요약으로 준비하십시오 ("이 부분은 종료 조항의 3.2 섹션입니다"...).

### 모든 기본 규칙을 이길 수 있는 규칙

fragment 크기를 질의 유형과 일치합니다:

| Query type | Chunk size |
|------------|-----------|
| Factoid ("what is the CEO's name?") | 256-512 tokens |
| Analytical / multi-hop | 512-1024 tokens |
| Whole-section comprehension | 1024-2048 tokens |

NVIDIA의 2026 기준. 이 조각은 답을 포함할 만큼 큰데, 지역 맥락을 포함할 만큼 작게 되는데, 그 리트리버의 상위 K 반환은 맥락 소음보다는 답을 집중시킬 수 있을 정도로 작게 되죠.

```figure
n5-chunk-cuts
```

## 건설 해

### 단계 1: 고정 및 재발성 쪼개리

```python
def chunk_fixed(text, size=512, overlap=0):
    step = size - overlap
    return [text[i:i + size] for i in range(0, len(text), step)]


def chunk_recursive(text, size=512, seps=("\n\n", "\n", ". ", " ")):
    if len(text) <= size:
        return [text]
    for sep in seps:
        if sep not in text:
            continue
        parts = text.split(sep)
        chunks = []
        buf = ""
        for p in parts:
            if len(p) > size:
                if buf:
                    chunks.append(buf)
                    buf = ""
                chunks.extend(chunk_recursive(p, size=size, seps=seps[1:] or (" ",)))
                continue
            candidate = buf + sep + p if buf else p
            if len(candidate) <= size:
                buf = candidate
            else:
                if buf:
                    chunks.append(buf)
                buf = p
        if buf:
            chunks.append(buf)
        return [c for c in chunks if c.strip()]
    return chunk_fixed(text, size)
```

### 단계 2: 의미적 조각

```python
def chunk_semantic(text, encoder, threshold=0.6, min_chars=200, max_chars=2048):
    sentences = split_sentences(text)
    if not sentences:
        return []
    embs = encoder.encode(sentences, normalize_embeddings=True)
    chunks = [[sentences[0]]]
    for i in range(1, len(sentences)):
        sim = float(embs[i] @ embs[i - 1])
        current_len = sum(len(s) for s in chunks[-1])
        if sim < threshold and current_len >= min_chars:
            chunks.append([sentences[i]])
        else:
            chunks[-1].append(sentences[i])

    result = []
    for group in chunks:
        text_group = " ".join(group)
        if len(text_group) > max_chars:
            result.extend(chunk_recursive(text_group, size=max_chars))
        else:
            result.append(text_group)
    return result
```

 `threshold`너무 높고, 너무 낮고, 하나의 거대한 조각이 있습니다.

### 단계 3: 부모 문서

```python
def chunk_parent_child(text, parent_size=2048, child_size=256):
    parents = chunk_recursive(text, size=parent_size)
    mapping = []
    for p_idx, parent in enumerate(parents):
        children = chunk_recursive(parent, size=child_size)
        for child in children:
            mapping.append({"child": child, "parent_idx": p_idx, "parent": parent})
    return mapping


def retrieve_parent(child_query, mapping, encoder, top_k=3):
    child_embs = encoder.encode([m["child"] for m in mapping], normalize_embeddings=True)
    q_emb = encoder.encode([child_query], normalize_embeddings=True)[0]
    scores = child_embs @ q_emb
    top = np.argsort(-scores)[:top_k]
    seen, parents = set(), []
    for i in top:
        if mapping[i]["parent_idx"] not in seen:
            parents.append(mapping[i]["parent"])
            seen.add(mapping[i]["parent_idx"])
    return parents
```

핵심 통찰력: 배신 부모. 여러 자녀들이 같은 부모에게 지도를 만들 수 있습니다. 모든 것을 반환하면 맥락을 낭비할 것입니다.

### 단계 4: 맥락 검색 (인тропо적 패턴)

```python
def contextualize_chunks(document, chunks, llm):
    context_prompts = [
        f"""<document>{document}</document>
Here is the chunk to situate: <chunk>{c}</chunk>
Write 50-100 words placing this chunk in the document's context."""
        for c in chunks
    ]
    contexts = llm.batch(context_prompts)
    return [f"{ctx}\n\n{c}" for ctx, c in zip(contexts, chunks)]
```

컨텍스트화된 덩어리를 지표합니다. 질의 시간에, 검색은 추가적인 주변 신호에서 이익을 얻습니다.

### 단계 5: 평가

```python
def recall_at_k(queries, corpus_chunks, encoder, k=5):
    chunk_embs = encoder.encode(corpus_chunks, normalize_embeddings=True)
    hits = 0
    for q_text, gold_idxs in queries:
        q_emb = encoder.encode([q_text], normalize_embeddings=True)[0]
        top = np.argsort(-(chunk_embs @ q_emb))[:k]
        if any(i in gold_idxs for i in top):
            hits += 1
    return hits / len(queries)
```

항상 기준을 세우고, 당신의 코퍼시스에 대한 "최고" 전략은 블로그 게시물에 일치하지 않을 수도 있습니다.

## 함정

- **Chunking evaluated only on factoid queries.**멀티 홉 쿼리는 매우 다른 수상자를 나타냅니다. 쿼리 타입의 계층화된 평가 세트를 사용하세요.
- **Semantic chunking without a minimum size.**40개의 토큰 조각을 생성해 검색을 해치죠`min_tokens`- 그래
- **Overlap as cargo cult.**2026 연구 결과, 겹치는 경우 종종 제로 혜택과 이중 지표 비용을 제공한다는 것을 발견했습니다.
- **No min/max enforcement.**5개의 토큰이나 5000개의 토큰의 조각은 모두 검색을 해체합니다.
- **Cross-doc chunking.**두 문서의 한 조각은 뭉쳐서 뭉쳐지지 않도록 해

## 사용 하 고

2026년 스택:

| Situation | Strategy |
|-----------|----------|
| First build, unknown corpus | Recursive, 512 tokens, no overlap |
| Factoid QA | Recursive, 256-512 tokens |
| Analytical / multi-hop | Recursive, 512-1024 tokens + parent-document |
| Heavy cross-reference (contracts, papers) | Late chunking or contextual retrieval |
| Conversational / dialog corpus | Turn-level chunks + speaker metadata |
| Short utterances (tweets, reviews) | One document = one chunk |

리큐티브 512에서 시작하세요. 50 개의 질의 평가 세트에 recall@5을 측정하세요.

## 선박

`outputs/skill-chunker.md`이 부분의 본문은

```markdown
---
name: chunker
description: Pick a chunking strategy, size, and overlap for a given corpus and query distribution.
version: 1.0.0
phase: 5
lesson: 23
tags: [nlp, rag, chunking]
---

Given a corpus (document types, avg length, domain) and query distribution (factoid / analytical / multi-hop), output:

1. Strategy. Recursive / sentence / semantic / parent-document / late / contextual. Reason.
2. Chunk size. Token count. Reason tied to query type.
3. Overlap. Default 0; justify if >0.
4. Min/max enforcement. `min_tokens`, `max_tokens` guards.
5. Evaluation plan. Recall@5 on 50-query stratified eval set (factoid, analytical, multi-hop).

Refuse any chunking strategy without min/max chunk size enforcement. Refuse overlap above 20% without an ablation showing it helps. Flag semantic chunking recommendations without a min-token floor.
```

## 운동

1. **Easy.**20 페이지의 문서 중 하나를 고정된 ((512, 0), 재발적 ((512, 0), 재발적 ((512, 100) 로 조각으로 나누십시오.
2. **Medium.**5개의 문서에 대한 30개의 질문 평가 세트를 구축합니다. 재발적, 의미적, 부모 문서에 대한 recall@5을 측정합니다. 어느 것이 승리합니까? 블로그 게시물에 일치합니까?
3. **Hard.**맥락적 검색을 실행하십시오. 기본 리큐티브보다 MRR의 향상을 측정하십시오. 실적 인덱스 비용 (LLM 호출) 을 정확성 증가에 대한 보고서

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Chunk | A piece of a doc | Sub-document unit that gets embedded, indexed, and retrieved. |
| Overlap | Safety margin | N tokens shared between adjacent chunks; often useless in 2026 benchmarks. |
| Semantic chunking | Smart chunking | Split where adjacent-sentence embedding similarity drops. |
| Parent-document | Two-level retrieval | Retrieve small children, return larger parents. |
| Late chunking | Chunk after embedding | Embed full doc at token level, pool into chunk vectors. |
| Contextual retrieval | Anthropic's trick | LLM-generated summary prepended to each chunk before indexing. |
| Context cliff | 2500-token wall | Quality drop observed around 2.5k context tokens in RAG (Jan 2026). |

## 더 많은 읽기

- [Yepes et al. / LangChain — Recursive Character Splitting docs](https://python.langchain.com/docs/how_to/recursive_text_splitter/) 생산의 결함이
- [Vectara (2024, NAACL 2025). Chunking configurations analysis](https://arxiv.org/abs/2410.13070) 선택의 요소를 포함시키는 것만큼이나 중요한 요소입니다.
- [Jina AI — Late Chunking in Long-Context Embedding Models (2024)](https://jina.ai/news/late-chunking-in-long-context-embedding-models/) 늦은 종이 조각
- [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) LLM에서 생성된 컨텍스트 프리픽스와 함께 35-50%의 검색 개선.
- [NVIDIA 2026 chunk-size benchmark — Premai summary](https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/) 질의 유형에 따라 덩어리 크기가
