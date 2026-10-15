# 하이브리드 메모리: 벡터 + 그래프 + KV

> 하이브리드 메모리는 세 개의 매장을 병렬적으로 실행합니다. 시맨틱 유사성을 위한  벡터, 빠른 사실 검색을 위한 KV, 엔티티 관계 추론을 위한 그래프.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**Time:** ~75 minutes

## 학습 목표

- 단일 저장소 (벡터만, 그래프만, KV만) 가 에이전트 메모리에 충분하지 않은 이유를 설명하십시오.
- Mem0의 3개의 병렬 매장을 이름지시고 각각의 최적화 목적에 대해 말씀드리겠습니다.
- Mem0의 융합 점수를 설명해 보십시오.  관련성, 중요성, 최근성  그리고 왜 이것이 계층이 아닌 중계된 금액이 되는지를 설명해 주십시오.
- 3층 메모리 장난감을 STDlib에 구현하여 `add()`3개 모두에 쓰여진 글과`search()`그 결과물들을 합쳐놓습니다.

## 문제

한 매장은 세 개의 질의 클래스 중 하나에 잘못됩니다.

- **Semantic similarity** "우리는 지난 주에 에이전트 드레프트에 대해 무엇을 논의했습니까?" 벡터 승자, KV와 그래프 미스
- **Fact lookup** "이용자의 전화번호는 무엇입니까?" KV는 승리합니다. 벡터는 낭비, 그래프는 과잉입니다.
- **Relationship reasoning** "어떤 고객들이 같은 청구소득을 공유하는가?" 그래프가 승리하고, 벡터와 KV는 답할 수 없습니다.

제작 에이전트는 세 가지 모두 한 세션에서 발행합니다. 단일 스토어 메모리는 두 가지에 항상 잘못됩니다. Mem0의 기여는 세 가지 모두 하나의 배열에 연결됩니다.`add`- 그래`search`표면은 점수를 얻는 기능으로 융합됩니다.

## 개념

### 3개의 상점

Mem0 (arXiv:2504.19413, 2025년 4월)`add(text, user_id, metadata)`이 부분의 본문은

1. 본문에서 후보자 사실을 추출한다 (LLM를 중심으로 한 단계).
2. 매 사실을 벡터 저장소에 (인베딩) 기록하여 의미 검색을 할 수 있습니다.
3. 각 사실을 KV 저장소에 입력하여 입력합니다 (user_id, fact_type, entity)$O(1)$- 찾아봐
4. 관계 질의에 대한 각 사실을 그래프 저장소에 (Mem0g) 입력한 가장자리로 적어 주십시오.

   `search(query, user_id)`이 부분의 본문은

1. 벡터 스토어는 코시네를 삽입하여 상위 K를 반환합니다.
2. KV 스토어는 질의 (user_id, type, entity) 에서 생성된 키로 입력된 직접적인 힌트를 반환합니다.
3. 그래프 저장소는 질의 단위에서 접근 가능한 하위 그래프를 반환합니다.
4. 점수층은 세 가지를 합쳐줍니다.

### 융합 점수를

```
score = w_relevance * relevance(q, record)
      + w_importance * importance(record)
      + w_recency * recency(record)
```

- **Relevance** 벡터 코시네스, KV 정확한 일치, 그래프 경로 중
- **Importance** 작성 시점에 표시되거나 학습 (일부 사실들은 더 중요합니다. 이름, 신분증, 정책).
- **Recency** 마지막 글이나 읽음 이후의 시간적 기하급수적 붕괴

무게는 제품마다 조정됩니다. 더 높습니다.`w_recency`채팅 에이전트들, 더 높은`w_importance`컴플라이언스 에이전트들`w_relevance`검색 요원

### 기기 및 시간적 추론

Mem0g 는 충돌 탐지기를 추가 합니다. 새로운 사실이 기존의 가장자리에 반조할 때, 기존의 가장자리는 무효가 표시되지만 삭제되지 않습니다. 시간적 질의 ("마르치에 사용자의 도시는 무엇입니까?") 는 유효한 시간 하위 그래프를 통과합니다.

이것은 렛타의 비효율 패턴이 일반화하는 컴플라이언스 수준의 행동입니다.

### 기준 번호

Mem0 문서 보고 (2025):

- **LoCoMo**(장기 대화 기억): 91.6
- **LongMemEval**(장시간 에피소디컬 메모리): 93.4
- **BEAM 1M**(1M 토큰 메모리 기준): 64.1

비교 기준 (전환 128k LLM, 평면 벡터 저장소, 평면 KV) 은 모두 10+ 포인트로 손실됩니다. 벤치마크만으로는 선택의 정당성을 입증하지는 않습니다.

### 범위를 분류

Mem0는 범위에 따라 메모리를 나눈다:

- **User memory** 세션 내내 지속되며, 키가 켜져 있습니다.`user_id`- 그래
- **Session memory** 하나의 끈 내에서 지속됩니다.
- **Agent memory** 대리인 개체 상태

각 글은 하나의 범위를 선택합니다. 검색은 범위를 통해 범위를 측정할 수 있습니다. 범위를 생각없이 혼합하는 것은 "보브의 프로젝트에 대해 보조가 앨리스에게 말했다" 사건의 방법입니다.

### 이 패턴이 잘못되는 곳

- **Embedding drift.**첫 100개의 질서에서 잘 보이는 벡터 결과들은 몸집이 성장함에 따라 쇠퇴합니다. 가장 N가 사용되는 기록들을 주기적으로 재시설합니다.
- **KV schema creep.** `(user_id, type, entity)`모든 팀이 자신의 팀을 추가할 때까지 간단합니다`type`. 4분기마다 정해진 타입을 점검합니다.
- **Graph explosion.**한 험난한 추출기는 메시지에 50 개의 가장자리를 추가합니다.`add`전화; 낮은 신뢰를 떨어뜨리는 가장자리.

```figure
ae-memory-fusion
```

## 건설 해

`code/main.py`stdlib에서 세 층 패턴을 구현합니다:

- `VectorStore` 임베디션 스탠드인으로서의 순진적인 토큰 오버라프 유사성
- `KVStore`    `(user_id, fact_type, entity)`- 그래
- `GraphStore` 입력한 가장자리 (주체, 관계, 객체, 유효성).
- `Mem0`  `add()``search()`, 핵융합 점수를, 그리고 범위 인식 검색.
- 다중 사용자, 다중 세션 대화에 대한 연구 결과가 나왔어요.

실행하세요:

```
python3 code/main.py
```

출력으로 3개의 분리된 회수 경로를 더하여 융합된 상위 k를 나타냅니다.`main()`순위 변화도 지켜보세요.

## 사용 하 고

- **Mem0 (Apache 2.0)** 생산 준비. Postgres + Qdrant + Neo4j를 통해 자체 호스트 또는 관리 클라우드를 사용하십시오.
- **Letta** 3층 코어/레콜/아카이브; 자신의 벡터 및 그래프 백그랜드를 가져오십시오.
- **Zep** 시간적 KG와 사실 추출을 위한 상업적 대안.
- **Custom builds** 추출기 (응고) 또는 핵융합중도에 대한 정확한 통제가 필요할 때 (소음 요원, 신음성이 지배하는 곳).

## 선박

`outputs/skill-hybrid-memory.md`3층의 메모리 스카프를 생성합니다. 융합 점수, 범위 분류학, 시간 무효가 연결되어 있습니다.

## 운동

1. 장난감 벡터 유사성을 실제 임베디션 모델 (사진 변환기, 올라마, 오픈AI 임베디션) 로 대체하십시오. 합성 긴 대화에서 recall@10을 측정하십시오. 1000 이상의 순위 추동이 쓰나요?
2. 시간적 질의를 추가합니다: `search(query, as_of=timestamp)`그 시간 또는 그 이전까지 유효한 기록만을 반환하세요. 어느 가게가 가장 많은 작업을 필요로 합니까?
3. 충돌 탐지기를 구현: 입력된 사실들이 그래프 가장자리에 반조하는 경우, 오래된 가장자리를 무효화하고 둘 다 로그. "이용자 거주 베를린" -> "이용자 거주 리스본"에 대한 테스트.
4.                                                            `user_feedback`크기는 (출장된 기록에 대한 엄지손가락을 올려). 게임 (전까지 좋아했던 기록만 에이전트가 반환하는) 을 어떻게 방지할 수 있습니까?
5. Mem0 문서들을 읽어보세요 (`docs.mem0.ai` ). 장난감을 가져오세요`mem0`동일한 20개의 테스트 쿼리에 대한 검색 품질을 비교해 보세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Hybrid memory | "Vector plus graph plus KV" | Three stores written in parallel, fused on retrieval |
| Fact extraction | "Memory ingestion" | LLM step that breaks text into (entity, relation, fact) tuples |
| Fusion scoring | "Relevance ranking" | Weighted sum of relevance, importance, recency |
| Scope | "Memory namespace" | user / session / agent — determines who sees what |
| Mem0g | "Memory graph" | Typed edges with temporal validity for relationship queries |
| Temporal invalidation | "Soft delete" | Mark contradicted edges invalid; never delete |
| Embedding drift | "Retrieval rot" | Vector quality degrades as corpus grows; re-embed periodically |

## 더 많은 읽기

- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) 원본 종이를
- [Mem0 docs](https://docs.mem0.ai/platform/overview) 생산 API, SDK, 관리 클라우드
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) 가상 맥락 전신
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) 3단계형형형형 디자인
