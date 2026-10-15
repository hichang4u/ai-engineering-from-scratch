# 병렬 / 스파르 / 네트워크 구조

> 감독과 대조적으로 중앙 결정자가 없습니다. 에이전트는 공유 이벤트 버스를 읽고, 일을 비동이적으로 시작하고, 결과를 다시 작성합니다. 랭그라프는 분산적이고 역동적인 환경의 "스워임 아키텍처"를 명시적으로 지원합니다. 매트릭스 (arXiv:2511.21686) 는 오케스트레이터 병목을 제거하기 위해 분산된 줄을 통해 전달되는 일련의 메시지로서 제어 및 데이터 흐름을 모두 나타냅니다. 타협은 명백합니다. 확장성을 위한 결정론과 추적성. 스 swarm는 많은 독립적인 부분 문제와 함께 하는 작업에 적합합니다. 단일 일관된 계획이 필요한 작업에는 적합하지 않습니다.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`, `queue`)
**Prerequisites:** Phase 16 · 05 (Supervisor Pattern), Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

## 문제

감독은 몇 명의 노동자에게만 규모를 줄이는데, 수백 명의 노동자들은 어떨까요? 감독자 자신은 병목이 됩니다. 누가 어떤 일을 하는지에 대한 모든 결정은 한 명의 에이전트를 통해 이루어집니다. 한 단계의 계획은 전체 시스템을 정지시킵니다.

스 swarm 아키텍처는 디자인을 뒤집는다. 중앙 계획자 작업 배포 대신, 노동자들은 공유 된 줄을에서 작업을 선택합니다. "조ordination"는 이벤트 버스 의미에 굽습니다. 오케스트레이터 없습니다. 시스템  스케일링은 줄을 때까지합니다.

## 개념

### 형태

```
                ┌──── shared queue ────┐
                │                      │
       ┌────────┼────────┐  ◄──────┬───┘
       ▼        ▼        ▼         │
     Worker  Worker  Worker   Worker
      A       B       C        D
       │        │        │         │
       └────────┴────────┴─────────┘
                 │
                 ▼
            results pool
```

조직원도 없습니다. 모든 작업자는 반복합니다. 작업을 끌어내어 처리하고 결과를 작성합니다.

### 무리가 맞을 때

- **Many independent tasks.**스크래핑, 변환, 분류, 서로 다른 작업이 없습니다.
- **Variable-duration work.**어떤 작업이 100ms, 다른 작업은 10ms를 걸리면, 무리가 자동으로  빠른 작업자들이 다음 작업을 끌어내야 합니다. 감독은 기간을 예측해야 합니다.
- **Throughput over determinism.**당신은 전체 완성 시간에 관심이 있고 엄격한 주문이 아닙니다.

### 무리가 실패할 때

- **Ordered workflows.**3단계 2의 출력이 필요하다면, 무리가 2단계 2이 끝나기 전에 3단계 3의 발사를 위험합니다.
- **Global-plan tasks.**복잡한 연구 질문 은 계획자 의 도움 이 된다. 연구자 들 의 무리 는 일관성 있는 보고 를 작성 하는 것 이 아니라 독립적 인 사실 을 작성 한다.
- **Debugging.**중앙 로그와 비동기 작업이 없으면 버그를 재현하는 것은 비싸다.

### 매트릭스 (arXiv:2511.21686)

매트릭스는 2025년 논문으로 스와임을 자연스러운 결론으로 이끌어 냅니다. 제어 흐름과 데이터 흐름 모두 분산된 줄을 따라 일련의 메시지입니다. 중앙 조정자는 없습니다. 오류 용납성은 메시지 내구성에서 비롯됩니다. 확장성은 메시지 중개자의 문제이며 시스템의 문제가 아닙니다.

기여: 다중 에이전트 조정이 "이 에이전트가 어떤 메시지 주제에 가입합니까?"가 아니라 "이 에이전트가 다음으로 어떤 에이전트를 선택합니까?"라는 프로그래밍 모델입니다. 이것은 시스템을 퍼블 / 서브 이벤트 매쉬처럼 만듭니다.

### 그래프 프레임에서 스 swarm

랭그라프 2025 문서들은 "스와임 아키텍처"를 다중 에이전트 패턴 중 하나로 명시적으로 설명합니다. 에이전트는 노드이지만 가장자리는 사이클과 함께 지시된 그래프를 형성하고 모든 노드를 풀에서 활성화 할 수 있습니다. 작업자는 감독의 임무를 따라가 아니라 조건에 따라 사용할 수 있는 작업을 선택합니다.

### 실패 모드: 기근과 온점

만약 모든 노동자들이 가능한 가장 빠른 작업을 수행한다면, 장기적인 작업은 오직 그 작업만이 남아 있을 때까지 선택되지 않습니다.

완화:
- 명시적인 노화와 함께 우선 순위 행렬 (예정 시간으로 우선 순위를 증가시킨다).
- 근로자 전문성: 일부 근로자들은 "장시간" 작업만을 수행한다.
- 반압: 줄을 들어가는 빠른 작업의 수를 제한한다.

### 내용 기반 라우팅 링크

스 swarm pairs naturally with content-based routing (Lesson 22). 일반적 줄을 대신 메시지 유형에 한 줄을 가지고 있습니다. 전문 노동자들은 단지 그 유형에 가입합니다. 이것은 수천 명의 에이전트를 확장하는 메시지 버스 아키텍처의 기초입니다.

```figure
sw-work-stealing
```

## 건설 해

`code/main.py`공유된 `queue.Queue`. 작업은 일정 기간이 달라집니다 (일부로 빠르고, 일부는 느리게).

- **Sequential baseline:**한 노동자는 모든 작업을 일련적으로 처리합니다.
- **Fixed assignment:**특정 근로자에게 미리 할당된 각 임무 (감독 방식)
- **Swarm:**노동자들은 공유된 줄을 습니다.

스 swarm balances는 자동으로 로드 됩니다. 일정한 임무를 하면 빠른 노동자들이 임무를 느리게 할 때 무작위로 일하게 됩니다.

실행:

```
python3 code/main.py
```

출력은 일인 작업자 개수 (더미가 불평등하지만 최적적으로 분포) 및 벽 시계 시간을 보여줍니다.

## 사용 하 고

`outputs/skill-swarm-fit.md`작업이 스와임과 감독자를 사용해야 하는지 여부를 평가합니다. 입력: 작업 독립성, 기간 변동, 주문 요구 사항, 디버깅 가능성 요구 사항.

## 선박

체크리스트:

- **Priority queue with aging.**긴 작업의 굶주림을 막기 위해서입니다.
- **Worker idempotency.**작업자 중간에 추락하면 작업이 한 번 이상 수행될 수 있습니다. 작업자들은 무력해야 합니다.
- **Durable queue.**제작에 카프카, 레디스 스트림 또는 데이터베이스 지원된 줄을 사용하십시오. `queue.Queue`기억상실만 있는 것 같아요
- **Observability per task.**모든 작업에는 추적 ID가 있습니다. 모든 작업자는 그 작업과 함께 시작/끝을 기록합니다.
- **Back-pressure.**만약 노동자들이 배수하는 것보다 서열이 더 빨리 늘어나는 경우 생산자를 늦추십시오.

## 운동

1. 달아`code/main.py`변수 기간 작업량에서 무리가 순차적으로 수행하는 것보다 얼마나 빨리 움직일 수 있을까요?
2. 우선 순위 행렬 변형을 추가 (사용 `queue.PriorityQueue`) 과제 "중요한 것" 필드에 우선순위를 지정하여 낮은 우선순위 과제가 연속적인 부하에 굶주리는지 관찰하십시오.
3. 온점 탐지기를 구현: 어떤 작업자가 가장 느린 작업자보다 3배 더 많은 작업을 처리할 때 로그. 작업 기간 분포에 대해 이것이 무엇을 나타냅니다?
4. 매트릭스 논문 (arXiv:2511.21686) 추상과 섹션 3을 읽어보십시오. 매트릭스가 받아들이는 특정 트레이드 오프 (스칼레이블리티 이득) 과 포기하는 특정 트레이드 오프 ( 추적성, 결정주의) 를 식별하십시오.
5.                                                                                                  `queue.Queue`(task_type, payload) tuples의 일종으로, 작업자들은 특정 타입만을 가입한다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Swarm architecture | "Decentralized agents" | Workers pull from shared queue; no central orchestrator. |
| Event bus | "Agents subscribe to topics" | Message broker that routes tasks to workers by type or content. |
| Starvation | "Task never runs" | Low-priority task never gets picked because higher-priority work arrives continuously. |
| Hot-spotting | "One worker drowns" | Load imbalance where one worker gets most tasks. |
| Back-pressure | "Slow down the producer" | Mechanism that signals upstream to stop producing when the queue fills up. |
| Idempotent worker | "Safe to re-run" | A task processed twice produces the same result. Required because workers may crash mid-run. |
| Durable queue | "Survives crashes" | Queue backed by disk or replicated storage; tasks are not lost when a worker crashes. |
| Matrix framework | "Full message-passing swarm" | Both data and control flow are serialized messages on distributed queues. |

## 더 많은 읽기

- [LangGraph workflows and agents — Swarm Architecture](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 명시적인 무더기 지원
- [Matrix — A Decentralized Framework for Multi-Agent Systems](https://arxiv.org/abs/2511.21686) 전체 메시지 전달 무더기
- [Anthropic engineering — why supervisor not swarm in Research](https://www.anthropic.com/engineering/multi-agent-research-system) 특정 생산 체계가 왜 무리를 대신해 감독자를 선택했는지
- [AutoGen v0.4 actor-model docs](https://microsoft.github.io/autogen/stable/) 이벤트 중심의 배우 재편, v0.2의 그룹 채팅보다 더 가까이
