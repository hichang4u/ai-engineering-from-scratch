# 관계 추출 & 지식 그래프 구축

> NER는 단체를 발견했다. 단체가 연결하여 그들을 어. 관계 추출은 그 사이의 가장자리를 찾습니다. 지식 그래프는 노드, 가장자리와 그 기원을 합한다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 25 (Entity Linking)
**Time:** ~60 minutes

## 문제

한 분석가가 는 "팀 쿡 은 2011 년 에 애플의 CEO 로 임명 되었다"고 합니다.

- `(Tim Cook, role, CEO)`
- `(Tim Cook, employer, Apple)`
- `(Tim Cook, start_date, 2011)`
- `(Apple, type, Organization)`

관계 추출 (RE) 은 자유 텍스트를 구조화된 트리플로 변환합니다 `(subject, relation, object)`큐브에 집합해서 지식 그래프를 갖게 됩니다. 집합해서 질문하면 RAG, 분석, 또는 컴플라이언스 감사에 대한 논리 기반을 갖게 됩니다.

2026년 문제: LLM는 열광적으로 관계를 추출합니다. 너무 열광적으로. 그들은 원본 텍스트가 지원하지 않는 삼각을 환각시킵니다. 출처 없이는 실제 삼각을 가설적인 소설에서 구별할 수 없습니다. 2026년 대답은 AEVS 스타일의 앵커 및 확인 파이프라인입니다.

## 개념

![Text → triples → knowledge graph](../assets/relation-extraction.svg)

**Triple form.** `(subject_entity, relation_type, object_entity)`. 관계들은 폐쇄된 온톨로지 (Wikidata 속성, FIBO, UMLS) 또는 개방된 집합 (OpenIE 스타일, 무엇이든 가능합니다) 에서 나온다.

**Three extraction approaches.**

1. **Rule / pattern-based.**Hearst 패턴: "X는 Y"`(Y, isA, X)`- 그리고 손으로 만든 레전스, 가벼운, 정확한, 설명할 수 있는
2. **Supervised classifier.**문장에서 두 개의 엔티티 언급을 고려하면 고정된 집합에서 관계를 예측하십시오. TACRED, ACE, KBP에 훈련되었습니다. 표준 20152022.
3. **Generative LLM.**모델이 3배를 발산하도록 해

**AEVS (Anchor-Extraction-Verification-Supplement, 2026).**현재 환각 완화 프레임워크:

- **Anchor.**정확한 위치와 함께 모든 엔터티 스파드와 관계 문장 스파드를 식별한다.
- **Extract.**항구 팽창에 연결된 트리플을 생성합니다.
- **Verify.**각 삼중 요소를 원본 텍스트로 다시 연결하고 지원되지 않는 모든 것을 거부합니다.
- **Supplement.**커버리지 패스는 앵커링 스탠이드가 떨어지지 않도록 합니다.

환각은 급격히 떨어지고, 더 많은 계산이 필요하지만,

**The open-vs-closed tradeoff.**

- **Closed ontology.**고정된 속성 목록 (예를 들어, 위키데이터의 11,000+ 속성)
- **Open IE.**말 그대로의 문장은 관계로 변합니다. 기억력이 높습니다. 정확도가 낮습니다. 질문에는 엉망입니다.

생산 KGs는 일반적으로 혼합됩니다. 발견을 위해 IE를 열어, 다음은 주요 그래프로 통합되기 전에 폐쇄된 온톨로지에 관계를 가нони화합니다.

```figure
relation-triples
```

## 건설 해

### 단계 1: 패턴 기반 추출

```python
PATTERNS = [
    (r"(?P<s>[A-Z]\w+) (?:is|was) (?:a|an|the) (?P<o>[A-Z]?\w+)", "isA"),
    (r"(?P<s>[A-Z]\w+) (?:is|was) born in (?P<o>\w+)", "bornIn"),
    (r"(?P<s>[A-Z]\w+) works? (?:at|for) (?P<o>[A-Z]\w+)", "worksAt"),
    (r"(?P<s>[A-Z]\w+) founded (?P<o>[A-Z]\w+)", "founded"),
]
```

보시다시피`code/main.py`Hearst 패턴은 여전히 도메인 특정 파이프라인에서 전송됩니다. 왜냐하면 그들은 디버깅이 가능하기 때문입니다.

### 단계 2: 감독된 관계 분류

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tok = AutoTokenizer.from_pretrained("Babelscape/rebel-large")
model = AutoModelForSequenceClassification.from_pretrained("Babelscape/rebel-large")

text = "Tim Cook was born in Alabama. He later became CEO of Apple."
encoded = tok(text, return_tensors="pt", truncation=True)
output = model.generate(**encoded, max_length=200)
triples = tok.batch_decode(output, skip_special_tokens=False)
```

REBEL는 secu2seq 관계 추출기: 텍스트, 세 배, 이미 위키데이터 재산 ID. 원격 감시 데이터에 잘 조정. 표준 오픈 웨이트 기본.

### 단계 3: 앵커링으로 LLM-프롬프레이트 추출

```python
prompt = f"""Extract (subject, relation, object) triples from the text.
For each triple, include the exact character span in the source text.

Text: {text}

Output JSON:
[{{"subject": {{"text": "...", "span": [start, end]}},
   "relation": "...",
   "object": {{"text": "...", "span": [start, end]}}}}, ...]

Only include triples fully supported by the text. No inference beyond what is stated.
"""
```

모든 반환된 스랜을 원천에 대해 확인하고`text[start:end] != triple_entity`이것은 AEVS의 최소한의 형태로 "확인" 단계입니다.

### 단계 4: 폐쇄된 온톨로지에 가파르게

```python
RELATION_MAP = {
    "is the CEO of": "P169",       # "chief executive officer"
    "was born in":   "P19",         # "place of birth"
    "founded":        "P112",       # "founded by" (inverted subject/object)
    "works at":       "P108",       # "employer"
}


def canonicalize(relation):
    rel_low = relation.lower().strip()
    if rel_low in RELATION_MAP:
        return RELATION_MAP[rel_low]
    return None   # drop unmapped open relations or route to manual review
```

공학 작업의 60~80%가 공학화로 이루어집니다.

### 단계 5: 작은 그래프와 질서를 작성

```python
triples = extract(text)
graph = {}
for s, r, o in triples:
    graph.setdefault(s, []).append((r, o))


def neighbors(node, relation=None):
    return [(r, o) for r, o in graph.get(node, []) if relation is None or r == relation]


print(neighbors("Tim Cook", relation="P108"))    # -> [(P108, Apple)]
```

이것은 모든 RAG-over-KG 시스템의 원자입니다. RDF 트리플 스토어 (블레제그라프, 버투오소), 재산 그래프 (Neo4j) 또는 벡터 증강 그래프 스토어로 스케일합니다.

## 함정

- **Coreference before RE.**"그는 애플을 설립했다"  RE는 "그는"가 누구인지 알아야 합니다. 먼저 코어프를 실행하세요 (강습 24).
- **Entity canonicalization.**"Apple Inc"과 "Apple"는 같은 노드에 연결되어야 합니다. 먼저 연결하는 엔티티 (강습 25).
- **Hallucinated triples.**LLM는 텍스트가 지원하지 않는 트리플을 발사합니다.
- **Relation canonicalization drift.**오픈 IE 관계들은 모순이 없습니다 ("생명," "서 왔으며", "이 본인입니다"). 카논िकल ID 또는 그래프로 붕괴는 극복할 수 없습니다.
- **Temporal errors.**"Tim Cook는 Apple의 CEO입니다".  현재 사실, 2005년 거짓. 많은 관계는 시간 제한입니다.`P580`시작 시간`P582`위키데이터에서 종료 시간)
- **Domain mismatch.**리벨은 위키백과에서 교육을 받았습니다. 법률, 의학, 과학 문서는 종종 영역에 정비된 RE 모델을 필요로 합니다.

## 사용 하 고

2026년 스택:

| Situation | Pick |
|-----------|------|
| Fast production, general domain | REBEL or LlamaPred with Wikidata canonicalization |
| Domain-specific (biomed, legal) | SciREX-style domain fine-tune + custom ontology |
| LLM-prompted, audited output | AEVS pipeline: anchor → extract → verify → supplement |
| High-volume news IE | Pattern-based + supervised hybrid |
| Building a KG from scratch | Open IE + manual canonicalization pass |
| Temporal KG | Extract with qualifiers (start/end time, point in time) |

통합 패턴: NER → coref → entity linking → 관계 추출 → 온톨로지 지도 → 그래프 로드. 각 단계는 잠재적 인 품질 게이트입니다.

## 선박

`outputs/skill-re-designer.md`이 부분의 본문은

```markdown
---
name: re-designer
description: Design a relation extraction pipeline with provenance and canonicalization.
version: 1.0.0
phase: 5
lesson: 26
tags: [nlp, relation-extraction, knowledge-graph]
---

Given a corpus (domain, language, volume) and downstream use (KG-RAG, analytics, compliance), output:

1. Extractor. Pattern-based / supervised / LLM / AEVS hybrid. Reason tied to precision vs recall target.
2. Ontology. Closed property list (Wikidata / domain) or open IE with canonicalization pass.
3. Provenance. Every triple carries source char-span + doc id. Non-negotiable for audit.
4. Merge strategy. Canonical entity id + relation id + temporal qualifiers; dedup policy.
5. Evaluation. Precision / recall on 200 hand-labelled triples + hallucination-rate on LLM-extracted sample.

Refuse any LLM-based RE pipeline without span verification (source provenance). Refuse open-IE output flowing into a production graph without canonicalization. Flag pipelines with no temporal qualifier on time-bounded relations (employer, spouse, position).
```

## 운동

1. **Easy.**패턴 추출기를 실행하세요`code/main.py`5개의 뉴스 기사 문장을 통해 확인해 보세요
2. **Medium.**같은 문장을 REBEL (또는 작은 LLM) 로 사용하세요. 세 번이나 비교하세요. 어느 추출기보다 더 정확합니까? 더 높은 회수?
3. **Hard.**AEVS 파이프 라인을 구축: LLM +를 사용하여 추출하여 출처에 대한 팽창을 확인합니다. 50 개의 위키백과 형식의 문장을 확인하기 전에 반 후 환각률을 측정합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Triple | Subject-relation-object | `(s, r, o)` tuple that is the atomic unit of a KG. |
| Open IE | Extract anything | Open-vocabulary relation phrases; high recall, low precision. |
| Closed ontology | Fixed schema | Bounded set of relation types (Wikidata, UMLS, FIBO). |
| Canonicalization | Normalize everything | Map surface names / relations to canonical ids. |
| AEVS | Grounded extraction | Anchor-Extraction-Verification-Supplement pipeline (2026). |
| Provenance | Source-of-truth link | Every triple carries a doc id + char-span to its source. |
| Distant supervision | Cheap labels | Align text with an existing KG to create training data. |

## 더 많은 읽기

- [Mintz et al. (2009). Distant supervision for relation extraction without labeled data](https://www.aclweb.org/anthology/P09-1113.pdf) 원격감독 서류
- [Huguet Cabot, Navigli (2021). REBEL: Relation Extraction By End-to-end Language generation](https://aclanthology.org/2021.findings-emnlp.204.pdf) RE의 직종마
- [Wadden et al. (2019). Entity, Relation, and Event Extraction with Contextualized Span Representations (DyGIE++)](https://arxiv.org/abs/1909.03546) 공동 IE
- [AEVS — Anchor-Extraction-Verification-Supplement framework](https://www.mdpi.com/2073-431X/15/3/178)2026 환각 완화 설계
- [Wikidata SPARQL tutorial](https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial) 가논 그래프 쿼리
