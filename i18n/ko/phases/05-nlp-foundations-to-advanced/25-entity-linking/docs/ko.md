# 엔티티 링크 및 불분명

> NER는 "파리스"를 찾습니다. "파리스"를 연결하는 엔티티는 결정합니다. 파리, 프랑스? 파리 힐튼? 파리, 텍사스? 파리 (트로이안 왕자)?

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 24 (Coreference Resolution)
**Time:** ~60 minutes

## 문제

문장은 "조르단 언론을 꺾었다"라고 써있어요. 네 NER는 "조르단"을 PERSON로 표시합니다.

- 마이클 조던 (야구) ?
- 마이클 B. 조던 (배우)
- 마이클 I. 조던 (버클리 ML 교수  네, ML 논문에서 이런 혼란은 현실적인 것)
- 요르단 (국)
- 요르단 (히브리어 첫 이름)?

엔티티 링크 (EL) 는 지식 데이터베이스의 고유 항목으로 각 언급을 해결합니다. 위키데이터, 위키백과, DBpedia 또는 귀하의 도메인 KB. 두 가지 하위 작업:

1. **Candidate generation.**"조던"을 고려하면 KB 항목은 어떤 것들이 가능할까요?
2. **Disambiguation.**그 맥락을 고려하면, 어떤 후보가 옳은가?

두 단계 모두 학습가능합니다. 둘 다 벤치마킹입니다. 결합된 파이프 라인은 10 년 동안 안정적이었습니다.

## 개념

![Entity linking pipeline: mention → candidates → disambiguated entity](../assets/entity-linking.svg)

**Candidate generation.**언급 표면 형태 ("조르단") 를 고려하면 별명 지표에서 후보자를 검색하십시오. 위키백과 별명 사전은 대부분의 이름 지목된 단체를 포함합니다. "JFK" → 존 F. 케네디, 자클린 케네디, JFK 공항, JFK (영화). 전형적인 지표는 언급당 10-30 명의 후보를 반환합니다.

**Disambiguation: three approaches.**

1. **Prior + context (Milne & Witten, 2008).** `P(entity | mention) × context-similarity(entity, text)`잘 작동하고, 빨리, 훈련도 안 돼
2. **Embedding-based (ESS / REL / Blink).**에코드 언급 + 컨텍스트. 각 후보의 설명에 코드. 최대 코시네를 선택. 2020-2024 기본.
3. **Generative (GENRE, 2021; LLM-based, 2023+).**엔티티의 가공적 이름 토큰-비-토큰을 해독합니다. 유효한 엔티티 이름의 트리에 제한되어, 출력이 유효한 KB ID가 보장됩니다.

**End-to-end vs pipeline.**현대 모델 (ELQ, BLINK, ExtEnD, GENRE) 는 한 패스에서 NER + 후보 생성 + 불분명성을 실행합니다. 파이프라인 시스템은 여전히 생산에서 지배적 인 요소를 교환 할 수 있기 때문입니다.

### 두 가지 측정

- **Mention recall (candidate gen).**금의 분자는 후보 목록에서 올바른 KB 항목이 표시되는 곳에 표시됩니다. 전체 파이프라인에 대한 바닥.
- **Disambiguation accuracy / F1.**올바른 후보자를 보면 1위 후보가 얼마나 자주 옳을까요?

항상 둘 다 보고하세요. 80%의 후보 회수에 99%의 불분명성이 있는 시스템은 80%의 파이프라인입니다.

```figure
gx-entity-linking
```

## 건설 해

### 단계 1: 위키백과 리디렉트에서 별명 인덱스를 생성

```python
alias_to_entities = {
    "jordan": ["Q41421 (Michael Jordan)", "Q810 (Jordan, country)", "Q254110 (Michael B. Jordan)"],
    "paris":  ["Q90 (Paris, France)", "Q663094 (Paris, Texas)", "Q55411 (Paris Hilton)"],
    "apple":  ["Q312 (Apple Inc.)", "Q89 (apple, fruit)"],
}
```

위키백과 alias 데이터: ~18M (alias, entity) 쌍. 위키데이터 덤프에서 다운로드. 역인덱스로 저장.

### 단계 2: 맥락에 기반한 불분명성

```python
def disambiguate(mention, context, alias_index, entity_desc):
    candidates = alias_index.get(mention.lower(), [])
    if not candidates:
        return None, 0.0
    context_words = set(tokenize(context))
    best, best_score = None, -1
    for entity_id in candidates:
        desc_words = set(tokenize(entity_desc[entity_id]))
        union = len(context_words | desc_words)
        score = len(context_words & desc_words) / union if union else 0.0
        if score > best_score:
            best, best_score = entity_id, score
    return best, best_score
```

자카드 겹치는 것 은 장난감 이다. 임베디션 에 코시네 유사성 을 대체 해 (보 참조)`code/main.py`트랜스포머 버전의 경우 2 단계)

### 단계 3: 임베디션 기반 (BLINK 스타일)

```python
from sentence_transformers import SentenceTransformer
encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed_mention(text, mention_span):
    start, end = mention_span
    marked = f"{text[:start]} [MENTION] {text[start:end]} [/MENTION] {text[end:]}"
    return encoder.encode([marked], normalize_embeddings=True)[0]

def embed_entity(entity_id, description):
    return encoder.encode([f"{entity_id}: {description}"], normalize_embeddings=True)[0]
```

 индекс 시간에 KB 단체를 한 번 삽입하세요. 질의 시간에 언급 + 컨텍스트를 한 번 삽입하세요. 후보자 풀에 대한 점-프로덕트를 선택하여 최대 선택하세요.

### 단계 4: 생성적인 엔티티 연결 ( 개념)

GENRE는 엔티티의 위키백과의 제목을 문자별로 해독합니다. 제한 해독 (강좌 20) 은 유효한 제목만 출력할 수 있도록 보장합니다. KB 지원 트리와 긴밀한 통합. 현대의 후손은 구조화된 출력으로 REL-GEN 및 LLM-prompted EL입니다.

```python
prompt = f"""Text: {text}
Mention: {mention}
List the best Wikipedia title for this mention.
Respond with JSON: {{"title": "..."}}"""
```

백명 목록과 결합 (방면)`choice`), 이것은 2026년에 발송될 가장 간단한 EL 파이프라인입니다.

### 단계 5: AIDA-CoNLL에 대한 평가

AIDA-CoNLL는 표준 EL 기준입니다: 1,393개의 로이터 기사, 34k 언급, 위키백과 단체는`P@1`) 및 KB외의 NIL 검출률.

## 함정

- **NIL handling.**일부 언급은 KB (흥상 엔티티, 미지의 사람들) 에 있지 않습니다. 시스템은 잘못된 엔티티를 추측하는 대신 NIL를 예측해야합니다. 별도로 측정됩니다.
- **Mention boundary errors.**상류 NER는 부분적인 랜드를 놓치고 ("뱅크 오브 아메리카"는 "뱅크"로 표시됩니다). EL 회수량은 떨어집니다.
- **Popularity bias.**훈련된 시스템은 빈번한 단체를 너무 예측합니다. ML 논문에서 "미하엘 I. 조던"의 언급은 종종 농구 조던과 연결됩니다.
- **Cross-lingual EL.**중국어 텍스트에서 영어 위키백과 단체를 언급하는 지도. 다국어 코더 또는 번역 단계를 필요로 합니다.
- **KB staleness.**새로운 기업, 이벤트, 사람들이 작년 위키백과 쓰레기통에 있지 않습니다. 생산 파이프라인은 리프레쉬 루프가 필요합니다.

## 사용 하 고

2026년 스택:

| Situation | Pick |
|-----------|------|
| General-purpose English + Wikipedia | BLINK or REL |
| Cross-lingual, KB = Wikipedia | mGENRE |
| LLM-friendly, few mentions/day | Prompt Claude/GPT-4 with candidate list + constrained JSON |
| Domain-specific KB (medical, legal) | Custom BERT with KB-aware retrieval + fine-tune on domain AIDA-style set |
| Extremely low-latency | Exact-match prior only (Milne-Witten baseline) |
| Research SOTA | GENRE / ExtEnD / generative LLM-EL |

2026년에 발송되는 생산 패턴: 각 언급에 대한 NER → coref → EL → 클러스터를 클러스터마다 한 가톨릭 단위로 붕괴시킵니다. 출력: 문서에 있는 단위로 한 KB ID, 언급에 대한 단위로 아닙니다.

## 선박

`outputs/skill-entity-linker.md`이 부분의 본문은

```markdown
---
name: entity-linker
description: Design an entity linking pipeline — KB, candidate generator, disambiguator, evaluation.
version: 1.0.0
phase: 5
lesson: 25
tags: [nlp, entity-linking, knowledge-graph]
---

Given a use case (domain KB, language, volume, latency budget), output:

1. Knowledge base. Wikidata / Wikipedia / custom KB. Version date. Refresh cadence.
2. Candidate generator. Alias-index, embedding, or hybrid. Target mention recall @ K.
3. Disambiguator. Prior + context, embedding-based, generative, or LLM-prompted.
4. NIL strategy. Threshold on top score, classifier, or explicit NIL candidate.
5. Evaluation. Mention recall @ 30, top-1 accuracy, NIL-detection F1 on held-out set.

Refuse any EL pipeline without a mention-recall baseline (you cannot evaluate a disambiguator without knowing candidate gen surfaced the right entity). Refuse any pipeline using LLM-prompted EL without constrained output to valid KB ids. Flag systems where popularity bias affects minority entities (e.g. name-clashes) without domain fine-tuning.
```

## 운동

1. **Easy.**에서 전 + 맥락 분분자를 구현`code/main.py`10개의 모호한 언급 (파리, 요르단, 애플) 에 대해 적어주세요. 올바른 단체를 손으로 표시하세요. 정확성을 측정하세요.
2. **Medium.**문장 변환기와 함께 50개의 모호한 언급을 암호화하십시오. 각 후보자의 설명을 삽입하세요. 삽입 기반의 모호함을 Jaccard 맥락의 겹치기와 비교하세요.
3. **Hard.**1k 엔티티 도메인 KB를 구축하세요 (예를 들어 회사 직원 + 제품) NER + EL를 종면으로 구현하세요. 100개의 수장된 문장을 정확성을 측정하고 회수하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Entity linking (EL) | Link to Wikipedia | Map a mention to a unique KB entry. |
| Candidate generation | Who could it be? | Return a shortlist of plausible KB entries for a mention. |
| Disambiguation | Pick the right one | Score candidates using context, pick the winner. |
| Alias index | The lookup table | Map from surface form → candidate entities. |
| NIL | Not in KB | Explicit prediction that no KB entry matches. |
| KB | Knowledge base | Wikidata, Wikipedia, DBpedia, or your domain KB. |
| AIDA-CoNLL | The benchmark | 1,393 Reuters articles with gold entity links. |

## 더 많은 읽기

- [Milne, Witten (2008). Learning to Link with Wikipedia](https://researchcommons.waikato.ac.nz/entities/publication/b9a0b520-abc5-47c5-a86a-da6c579893ab) 기본적 전 + 맥락 접근법
- [Wu et al. (2020). Zero-shot Entity Linking with Dense Entity Retrieval (BLINK)](https://arxiv.org/abs/1911.03814) 임베디션 기반의 작업마
- [De Cao et al. (2021). Autoregressive Entity Retrieval (GENRE)](https://arxiv.org/abs/2010.00904) 제한된 디코딩으로 생성 EL.
- [Hoffart et al. (2011). Robust Disambiguation of Named Entities in Text (AIDA)](https://www.aclweb.org/anthology/D11-1072.pdf) 기준서
- [REL: An Entity Linker Standing on the Shoulders of Giants (2020)](https://arxiv.org/abs/2006.01969) 오픈 생산 스택
