# 코레퍼런스 결의

> "그녀는 그를 불렀습니다. 그는 대답하지 않았습니다. 의사가 점심식사 중이었습니다". 두 명의 사람을 언급한 세 가지, 아무도 이름이 알려지지 않았습니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 07 (POS & Parsing)
**Time:** ~60 minutes

## 문제

300 단어의 기사를 통해 애플에 대한 모든 언급을 추출하세요. 기사가 " 애플"이라고 하면 쉽다. " 회사", "그들은", "쿠퍼티노의 기술 거장" 또는 "직업의 회사"라고 하면 힘들죠.

코레퍼런스 해상도는 동일한 실제 세계 엔티티를 가리키는 모든 표현을 하나의 클러스터로 연결합니다. 그것은 표면 수준의 NLP (NER, 분석) 와 하류 의미론 (IE, QA, 요약, KG) 사이의 접착입니다.

2026년에 왜 중요한지

- 요약: "CEO가 발표한... "와 "Tim Cook가 발표한... "
- "누가 전화 했습니까?"라는 질문에 대답하려면 "그녀"를 해결해야 합니다.
- 정보 추출: "PER1이 애플을 설립했다"와 "Jobs는 애플을 설립했다"는 별도의 항목으로 지식 그래프가 잘못되었습니다.
- 다문서 IE: 같은 사건에 대한 기사를 통한 언급을 통합하는 것은 다문서 핵심 참조입니다.

## 개념

![Coreference clustering: mentions → entities](../assets/coref.svg)

**The task.**입력: 문서. 출력: 각 클러스터가 하나의 단체를 가리키는 언급 (스페인) 의 집합.

**Mention types.**

- **Named entity.**"팀 쿡"
- **Nominal.**"CEO" "회사"
- **Pronominal.**"그 사람", "그녀", "그들은", "그 사람"
- **Appositive.**"팀 쿡, 애플의 CEO,

**Architectures.**

1. **Rule-based (Hobbs, 1978).**문법 규칙을 이용한 문법적 대명사 해상도 잘 되어서 대명사에서 이길 수 없을 정도로 힘들어
2. **Mention-pair classifier.**모든 언급에 대해$(m_i, m_j)$2016년 이전 표준으로,
3. **Mention-ranking.**각 언급에 대해 후보자의 전신 (사진 없는 것) 을 순위 로 지정 하십시오.
4. **Span-based end-to-end (Lee et al., 2017).**트랜스포머 코더. 모든 후보 범위를 길이가 한 뚜까지 나열합니다. 점수를 언급합니다. 각 범위에 대한 선행 확률을 예측합니다. 탐욕적으로 클러스터합니다. 현대 기본입니다.
5. **Generative (2024+).**LLM를 취득하세요: "이 텍스트와 그 전신에 있는 모든 명칭을 나열하세요".

**The evaluation metrics.**5개의 표준 매트릭 (MUC, B3, CEAF, BLANC, LEA) 은 단일 매트릭이 클러스터링 품질을 파악하지 않기 때문에. 첫 세 가지의 평균을 CoNLL F1로 보고하십시오. CoNLL-2012: ~83 F1.

**Known hard cases.**

- 이전에 소개된 페이지에 해당하는 단체를 가리키는 정의된 설명
- 브리지링 아나포라 ("바퀴" → 앞서 언급한 자동차).
- 중국어와 일본어 같은 언어에서 아나포라가 제로입니다.
- 카타포라 (명사자 앞의 명사): "언제**she**"메리 웃으면서 들어갔어요".

```figure
coref-links
```

## 건설 해

### 단계 1: 사전 훈련된 신경 코레퍼런스 (AllenNLP / spaCy- 실험)

```python
import spacy
nlp = spacy.load("en_coreference_web_trf")   # experimental model
doc = nlp("Apple announced new products. The company said they would ship soon.")
for cluster in doc._.coref_clusters:
    print(cluster, "->", [m.text for m in cluster])
```

더 긴 문서에서는 다음과 같은 것을 얻을 수 있습니다.
- 클러스터 1: [애플, 회사, 그들은]
- 클러스터 2: [새로운 제품]

### 단계 2: 규칙 기반의 성명 해결자 (교습)

보시다시피`code/main.py`단 한 번의 실행에 대해서는:

1. 추출 언급: 이름의 단체 (자본형 범위), 명명 (이명 검색), 확실한 설명 ("X").
2. 각 대명사에서 이전 K 언급을 살펴보고,
   - 성별/수수 합의 (유리스틱)
   - 최근 (최근 승자)
   - 문법적 역할 (예적 대상)
3. 가장 높은 점수를 받은 선구자를 연결해 주세요.

신경 모델과 경쟁력이 없지만, 검색 공간과 종결 모델이 해야 할 결정을 보여줍니다.

### 단계 3: 코어퍼런스 위해 LLM를 사용하는 것

```python
prompt = f"""Text: {text}

List every pronoun and noun phrase that refers to a person or company.
Cluster them by what they refer to. Output JSON:
[{{"entity": "Apple", "mentions": ["Apple", "the company", "it"]}}, ...]
"""
```

두 가지 실패 모드 를 시청 합니다. 첫째, LLM는 과잉 융합 ("그는"와 "그녀"는 두 사람 을 가리키는) 둘째, LLM는 긴 문서 에 언급 을 조용히 떨어 뜨립니다. 항상 랜프-오프셋 체크 를 통해 확인합니다.

### 단계 4: 평가

표준 conll-2012 스크립트는 MUC, B3, CEAF-φ4를 계산하고 평균을 보고합니다. 내부 평가에 대해, 스파인 수준의 정확성을 시작하여 표기된 테스트 세트를 다시 불러 불러오고, 언급 링크 F1을 추가하십시오.

## 함정

- **Singleton explosion.**어떤 시스템은 모든 언급을 자신의 클러스터로 보고합니다. B3는 용인합니다. MUC는 이것을 처벌합니다. 항상 세 가지 메트릭을 모두 확인하십시오.
- **Pronouns in long context.**2,000개의 토큰 이상의 문서에서 성능이 15 F1로 떨어집니다. 조심스럽게 분해하세요.
- **Gender assumptions.**성별 규제가 엄격히 규정한 것은 비비너리 참조자, 조직, 동물에 위반됩니다. 학습된 모델이나 중립적인 점수를 사용하십시오.
- **LLM drift on long docs.**하나의 API 호출은 50개 이상의 문장을 통해 신뢰할 수 있는 클러스터 언급을 할 수 없습니다. 슬라이딩 윈도우 + 융합을 사용하십시오.

## 사용 하 고

2026년 스택:

| Situation | Pick |
|-----------|------|
| English, single document | `en_coreference_web_trf` (spaCy-experimental) or AllenNLP neural coref |
| Multilingual | SpanBERT / XLM-R trained on OntoNotes or Multilingual CoNLL |
| Cross-document event coref | Specialized end-to-end models (2025–26 SOTA) |
| Quick LLM baseline | GPT-4o / Claude with structured-output coref prompt |
| Production dialog systems | Rule-based fallback + neural primary + manual review for critical slots |

2026 년 에 발급 될 통합 패턴: NER 를 먼저 실행, 코어프 를 실행, 코어프 클러스터 를 NER 단위로 통합. 하류 작업 은 한 단체가 아닌 한 단체가 언급 한 단위로 볼 수 있습니다.

## 선박

`outputs/skill-coref-picker.md`이 부분의 본문은

```markdown
---
name: coref-picker
description: Pick a coreference approach, evaluation plan, and integration strategy.
version: 1.0.0
phase: 5
lesson: 24
tags: [nlp, coref, information-extraction]
---

Given a use case (single-doc / multi-doc, domain, language), output:

1. Approach. Rule-based / neural span-based / LLM-prompted / hybrid. One-sentence reason.
2. Model. Named checkpoint if neural.
3. Integration. Order of operations: tokenize → NER → coref → downstream task.
4. Evaluation. CoNLL F1 (MUC + B³ + CEAF-φ4 average) on held-out set + manual cluster review on 20 documents.

Refuse LLM-only coref for documents over 2,000 tokens without sliding-window merge. Refuse any pipeline that runs coref without a mention-level precision-recall report. Flag gender-heuristic systems deployed in demographically diverse text.
```

## 운동

1. **Easy.**규칙 기반의 해결기를 실행하세요`code/main.py`5개의 손으로 만든 문항에 대해 언급- 링크 정확성을 기본 진실에 맞게 측정합니다.
2. **Medium.**뉴스 기사에서 미리 훈련된 신경 핵심 모델을 사용해서 클러스터를 직접 설명하는 것과 비교해 보세요.
3. **Hard.**핵심개발자료의 발전을 위한 NER 파이프라인 구축: 먼저 NER, 그리고 핵심 클러스터를 통해 통합. 100개의 항목에 대한 엔터티 커버리지 개선과 NER만 측정.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Mention | A reference | A span of text that refers to an entity (name, pronoun, noun phrase). |
| Antecedent | What "it" refers to | The earlier mention a later one corefers with. |
| Cluster | The entity's mentions | Set of mentions that all refer to the same real-world entity. |
| Anaphora | Backward reference | Later mention refers to earlier ("he" → "John"). |
| Cataphora | Forward reference | Earlier mention refers to later ("When he arrived, John..."). |
| Bridging | Implicit reference | "I bought a car. The wheels were bad." (wheels of THAT car.) |
| CoNLL F1 | The number on leaderboards | Average of MUC, B³, CEAF-φ4 F1 scores. |

## 더 많은 읽기

- [Jurafsky & Martin, SLP3 Ch. 26 — Coreference Resolution and Entity Linking](https://web.stanford.edu/~jurafsky/slp3/26.pdf) 성서 교과서 장
- [Lee et al. (2017). End-to-end Neural Coreference Resolution](https://arxiv.org/abs/1707.07045) 스탠프 기반 엔드-투-엔드
- [Joshi et al. (2020). SpanBERT](https://arxiv.org/abs/1907.10529) 심장을 향상시키는 사전 훈련
- [Pradhan et al. (2012). CoNLL-2012 Shared Task](https://aclanthology.org/W12-4501/) 기준표
- [Hobbs (1978). Resolving Pronoun References](https://www.sciencedirect.com/science/article/pii/0024384178900064) 규칙에 근거한 고전
