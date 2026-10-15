# 거하는 전략, 비교

> 킹은 당신의 리트리버가 어떤 표면에 나올 수 있는지 결정합니다. 그 경계를 잘못 파악하고, 임베디션 모델, 리너랭커, LLM는 하류의 손상을 복구할 수 없습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 lessons 04 (embeddings), 06 (RAG), 07 (advanced RAG); Phase 19 Track B foundations (lessons 20-29)
**Time:** ~90 minutes

## 학습 목표
- 처음부터 다섯 가지 쪼개리 전략을 구현하십시오. 고정된 창, 문장, 재발적 분할, 의미 집합 및 구조적 표시 헤더.
- 금으로 표시된 답변 범위가 있는 고정된 자료에 recall@k를 측정하고 왜 하나의 전략이 시사에서 승리하고 다른 전략이 기술 문서에서 승리하는지 설명하십시오.
- 장 분포를 읽어보고 각각의 전략이 주입하는 실패 모드를 인식하십시오. 고아 문장, 중간 상징 절단, 헤더만 사용하는 , 의미 유동.
- 벤치마크를 실행하지 않고 새로운 코퍼스의 기본값을 선택하여 문서 유형, 평균 문장 길이가, 그리고 형식이 명시적인 구조를 가지고 있는지 확인합니다.

## 문제

RAG 파이프라인마다 소스 문서들을 충분히 작은 조각으로 잘라서 배포 모델이 적합하고 각각의 조각이 자립된 아이디어를 가지고 있을 만큼 큰 조각으로 잘라서 시작합니다. 잘라내는 장소의 선택은 과다 매개 변수가 아닙니다. 그것은 검색자가 언제까지나 돌아올 수 있는 상위 경계입니다.

"예산 중단률이 어떻게 생겼는지"라는 질문을 하는 질문은 성공할 수 있는 것은 중단률을 유지하는 부분만 도달할 수 있다면만이다. 고정 창 분열기가 주변 맥락에서 임브레이드 값을 절감하면, 임베디션은 다른 클러스터로 이동하고, BM25 점수는 떨어지고, 리렌커들은 소음을 볼 수 있고, LLM가 생성하는 대답은 잘못된 것입니다. 2024년 논문 "LongRAG: Long-context LLM를 통해 검색 증강된 세대 증진"은 단순히 쪼개진 선택으로 검색 추출의 절대적인 전환률이 35%를 측정했습니다. 2025년에 컨텍스트 부분 헤더에 대한 후속 작업은 격차를 좁혔지만, 그 격차를 지 않았다.

이 수업은 5가지 전략을 함께 구성하고, 금으로 표시된 응답 범위가 있는 고정된 코퍼스와 비교해,

## 개념

```mermaid
flowchart LR
  Doc[Source Document] --> S1[Fixed Window]
  Doc --> S2[Sentence]
  Doc --> S3[Recursive Split]
  Doc --> S4[Semantic Cluster]
  Doc --> S5[Structural Markdown]
  S1 --> Chunks1[Chunks]
  S2 --> Chunks2[Chunks]
  S3 --> Chunks3[Chunks]
  S4 --> Chunks4[Chunks]
  S5 --> Chunks5[Chunks]
  Chunks1 --> Index[Embedding Index]
  Chunks2 --> Index
  Chunks3 --> Index
  Chunks4 --> Index
  Chunks5 --> Index
  Index --> Eval[Recall@k vs Gold Spans]
```

### 고정된 창

무력 기본 라인. N 문자를 모두 자르십시오. 선택적으로 초복하여 N 위치에서 자른 문장이 N 위치에서 시작되는 조각 안에 전체적으로 나타납니다.

### 문장

레전스 또는 간단한 상태 기계로 문장 경계를 나눌 수 있습니다. 목표 문자 예산까지 한 조각에 한 문장 또는 여러 문장을 포장합니다. 단어 중간에 절을 중단합니다. 여전히 문장 중간에 절을 합니다. 많은 초기 RAG 파이프라인에서 기본 설정 및 다른 구조가없는 시 prose를 합리적으로 선택합니다.

### 재발전 분할

2023 시대 도서관에서 대중화 된 계층 전략. 가장 강력한 분분자를 먼저 (중편 신선, 문장), 다음으로 ( 단일 신선), 다음 문장으로, 문자로 나누려고 노력하십시오. 반복은 예산에 맞는 때 종료됩니다. 지역별로 적응하기 때문에 불합리한 구조를 가진 문서에 강하다.

### 의미적 집합

각 문장을 삽입한다. 주제를 중심으로 나누는 직렬 문장을 묶어 놓는다. 주제를 중심으로 하는 유사성이 문장 밑으로 떨어질 때마다 삭감한다. 경계는 문자보다는 의미를 반영한다. 구축 속도가 느리고 임베디션 모델에 의존하지만 문장 내 주제를 변경하는 문서에 저항한다.

### 구조적 지표 헤더

명시적인 구조를 가지고 있는 문서 (표지, 구조조정된 텍스트, RFC 스타일의 번호된 섹션) 에 대해서는 제목 경계에서 절단한다. 각 조각은 제목과 그 아래의 모든 것이 같은 수준 또는 더 높은 다음 제목으로 내려가게 된다. 주제별로 가장 작은 조각, 그러나 단지 코퍼스가 잘 형성되면 사용할 수 있습니다.

### recall@k가 경계에 대한 선택의 측정 방법을

금으로 표시된 질의는 소스 문서 내부의 응답 범위의 정확한 문자 오프셋을 가지고 있습니다. 쪼개진 후, 여러분은 질문합니다. 리버가 반환한 상위 K 조각 중 하나가 금 덩어리를 덮고 있습니까? 만약 그래면, 그 질의에 대한 recall@k는 1입니다. 그렇지 않으면 0입니다. 질의 집합에서 평균 각 전략에 대한 동일한 평가를 실행하고 스프레드는 당신이 가지고 있는 코퍼스에서 어느 경계 정책이 살아남는지를 보여줍니다.

```figure
ci-chunk-boundaries
```

## 건설 해

`code/main.py`이 도구는

- `fixed_window(text, size, overlap)`- 기본 기준
- `sentence_chunks(text, target)`- 간단한 문장 포장.
- `recursive_split(text, separators, target)`- hierarchical recursion (위계적 재발)
- `semantic_chunks(text, similarity_threshold)`- 중추기반 기반의 집합이 결정적 모형 임베디션 위에 있습니다.
- `structural_markdown(text)`- 헤더 인식 스플리터
- `mock_embed(text, dim)`- 해시 기반 임베디션으로 루프가 오프라인으로 실행됩니다.
- `DenseIndex`- 19단계 트랙 B의 하이브리드 검색 수업에서 사용된 모양과 같은 모양
- `eval_recall(strategy, corpus, queries, k)`- 비교 루프
- A`main()`매 전략은 고정된 장치의 일체에 실행되고 recall@k 테이블을 인쇄합니다.

실행하세요:

```bash
python3 code/main.py
```

출력은 전략당 1 줄과 k당 1 열을 가진 작은 테이블입니다. 문장은 구조된 고정관념에서 손실됩니다. 구조적 표시가 표시된 고정관념에서 승리합니다. 반복은 혼합된 고정관념에 자신의 것을 유지합니다. 반복이 적응하기 때문에. 의미적 집합은 유용한 구조적 신호가없는 prose 고정관념에서 승리합니다.

## 실패 모드 테이블은 숨기지 않습니다

**Orphan sentences.**문장 포장은 주제가 없는 문장을 생성하고, 배포는 잘못된 클러스터를 가리킨다.

**Mid-symbol cuts.**고정된 창 내부 코드 또는 YAML는 식별자를 반으로 갈라놓습니다. 두 반은 소리로 삽입됩니다.

**Header-only chunks.**구조적 지표는 을 제외한 다른 것을 포함하고 있는`## Title`다음 부분의 첫 번째 문장을 연결하거나 필터링하세요.

**Semantic drift.**의미 뭉치 는 주제 에 대한 일률적 인 내용 을 나타내는 경우 하위 절단 을 한다. 5000 문자 의 조각 은 여러 가지 구체적인 답변 을 하나의 퍼포스 임베디션 으로 포장 한다. 의미 뭉치를 하드 문자 캡 과 결합 한다.

**Stale embeddings.**의미 집합은 임베디션 모델을 사용합니다. 모델을 변경하면 덩어리도 변경합니다. 덩어리 모델을 검색 모델과 분리하여 거나 인덱스를 다시 함께 구성합니다.

## 벤치마크를 실행하지 않고 기본값을 선택

3가지 속성은 새로운 코퍼스의 기본 덩어리를 결정합니다.

| Property | Value | Default |
|----------|-------|---------|
| Document type | Prose with no structure | Recursive split, target 800 |
| Document type | Markdown / RFC / API docs | Structural markdown |
| Document type | Code | AST-aware (out of scope; see Phase 19 lesson 02) |
| Paragraph length | Long, single topic | Sentence, target 500 |
| Paragraph length | Short, mixed topics | Semantic, threshold 0.6 |

의심할 때, 재발적 분할을 선택하세요.

## 사용 하 고

생산 패턴:

- 새로운 파이프라인을 전송하기 전에 eval를 실행하세요. 라이브러리가 기본 설정하는 전략을 신뢰하지 마십시오.
- 임베디션 모델이나 코퍼스 믹스를 변경할 때마다 재시험을 실행하세요. 승자는 코퍼스 의존적입니다.
- 각 조각의 메타데이터에 전략 이름을 유지하여 나중에 회귀를 할 수 있습니다.

## 선박

레슨 69의 트랙 F 엔드-투-엔드 RAG 시스템은 여기서 선택한 커를 첫 번째 단계로 사용합니다. 레슨 68의 eval 하인스는 recall@k와 같은 모양으로 읽습니다.`eval_recall`이 수업에서 돌아오는 것은, 당신의 코퍼스에서 승리하는 전략을 선택하고, 그것을 앞으로 전달하는 것입니다.

## 운동

1. 여섯 번째 전략을 추가:  토큰 창을 사용하여`tiktoken`문자 숫자를 대신 한 번 비교해 보세요.
2. 코드 블록의 30%를 프로라 피스트에 주입하고 테이블을 다시 실행하고 구조적 마크다운을 제외한 모든 전략이 기억을 잃는 이유를 설명하십시오.
3. 결정적 임베디션을 프로젝트의 실제 공급업체에서 제공하는 것으로 교체하십시오. 의미적 클러스터링 리콜 델타를 측정하십시오. 전략 사이의 간격이 넓어지거나 좁아지는지 보고하십시오.
4. `summary`별 필드: 한 문장 중추적 설명. 체에 합쳐진 요약과 함께 eval을 다시 실행하십시오. 상기 리플을 측정합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Recall@k | "Did we get the right chunk?" | Fraction of queries where any of the top-k chunks overlaps the gold answer span |
| Chunk overlap | "Sliding window" | Re-include the last N characters of the previous chunk in the next chunk |
| Structural splitter | "Header-aware chunks" | Cut at H1/H2/H3 boundaries; the heading text is part of the chunk |
| Semantic chunker | "Topic-aware chunks" | Embed sentences, cluster by centroid similarity, cut on drift |
| Centroid drift | "Topic shift" | Cosine similarity between the running mean and the next sentence drops past a threshold |

## 더 많은 읽기

- [LongRAG: Enhancing Retrieval-Augmented Generation with Long-context LLMs (arXiv 2406.15319)](https://arxiv.org/abs/2406.15319)
- [Anthropic, Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)
- [LlamaIndex, Chunking strategies for production RAG](https://docs.llamaindex.ai/en/stable/optimizing/production_rag/)
- 단계 11 수업 06 - RAG 기본
- 단계 11 수업 07 - 고급 RAG
- 단계 19 수업 65 - 하이브리드 검색
- 19단계 수업 68 - 생산에서 전략 선택에 대한 점수를 주는 평가 배포
