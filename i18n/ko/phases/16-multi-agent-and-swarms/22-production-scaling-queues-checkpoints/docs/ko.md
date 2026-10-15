# 생산 규모  줄을, 점검점, 내구성

> 수천 개의 동시 실행에 대한 다중 에이전트 시스템을 확장하는 것은 **durable execution** 작업 줄을 추가하여 체크포인트, 따라서 임의 노동자가 임의의 충돌 후 모든 실행을 재개할 수 있습니다, 임대 처리, 무력 부작용, 결정적 재생이 있는 조건으로. LangGraph의 실행 시간은 참조 예제입니다: 그것은 각 슈퍼 단계 키에 의해 입력된 후에 체크포인트를 작성합니다.`thread_id`(전립적으로 후급) 노동자 추락은 임대 계약을 해제하고 다른 노동자가 재개합니다. 에이전트는 인간의 입구를 기다리고 무한히 잠을 자 수 있습니다. **MegaAgent**(arXiv:2408.09955) 는 3 개의 상태 (Idle / Processing / Response) 및 2층 조정 (그룹 내 채팅 + 그룹 간 관리자 채팅) 를 가진 매개체 당 생산자-소비자 줄을 실행했습니다. **Fiber/async**LLM 스트리밍에 대한 스레드-당-직업: 스레드들은 토큰을 기다리는 99%의 시간 동안 무작위로 앉아, 섬유는 협동적으로 I/O에서 생산합니다.**FastAPI + Postgres + nothing else**로드가 그렇지 않은 것을 증명하기 전까지는  간단한 아키텍처가 예상보다 더 멀리 간다. 이 수업은 내구성 있는 체크포인트 로그, 상태 전환과 함께 대리인 작업 줄을, 아싱크-대 스레드 데모를 구축하고 실용적인 "start simple" 규칙을 내포합니다.

**Type:** Learn + Build
**Languages:** Python (stdlib, `asyncio`, `sqlite3`)
**Prerequisites:** Phase 16 · 09 (Parallel Swarm Networks), Phase 16 · 13 (Shared Memory)
**Time:** ~75 minutes

## 문제

프로토타입 멀티 에이전트 시스템이 하나의 노트북에서 작동합니다. 메모리 이벤트 루프에서 세 에이전트를 가지고 있습니다. 당신은 생산에 이동합니다.

- 에이전트는 때때로 몇 시간 동안 실행합니다 (장시간 연구, 인-이-loop 대기).
- 작업자 프로세스가 충돌하고, 재발동은 상태가 떨어집니다.
- 최고 로드는 평균 10x입니다. 수평적인 스케일링이 필요합니다.
- 사용자는 대리인을 통해 지불합니다. 충전하기 위해 정확히 한 번의 의미론이 필요합니다.

메모리 이벤트 루프는 이 모든 것을 하지 않습니다. 아래에는 내구성 실행 계층이 필요합니다. 2026 가 정해진 옵션은:

1. 체크포인트 (타임포럴, 랭그라프 실행시간) 을 갖춘 작업 흐름 엔진
2. 국가 매장 (Postgres + SQS/RabbitMQ) 에 있는 메시지 줄을
3. 배우 모델 프레임워크 (매가 에이전트의 생산자-소비자
4. 손으로 롤된 FastAPI + Postgres (베디의 주장)

이 수업은 각각의 미니어티우를 만들어냅니다.

## 개념

### 내구성 실행, 패턴

내구성 실행 엔진은 각 "단계" (LangGraph의 언어로 슈퍼단계) 에 따라 전체 프로그램 상태를 유지합니다. 충돌 시:

```
worker crashes mid-step
  -> lease timeout
  -> another worker picks up the thread_id
  -> resumes from last checkpoint
  -> no duplicate side effects
```

이 작업에 필요한 사항:

- **Serializable state.**모든 에이전트 상태는 지속가능해야 합니다. 실시간 데이터베이스 연결을 가진 기능 폐쇄는 생존하지 않습니다.
- **Deterministic resume.**동일한 상태와 동일한 입력값을 고려하면 에이전트는 동일한 동작을 생성합니다 (또는 LLM 호출을 위해 외부 결정적 오라클에 연기합니다).
- **Idempotent side effects.**외부 호출 (툴 호출, 지불) 은 무력하거나 분배 키를 사용해야 합니다.

랭그그래프는 각 슈퍼 단계 후에 체크포인트, 템포럴은 모든 활동 후에 체크포인트, 리스테이트는 이벤트 소스 잡지를 사용합니다. 세 가지 모두 동일한 패턴을 구현합니다.

### 점검점별로 단계별로 실행시간

랭그그래프의 실행 시간은 작업된 예입니다. 각 에이전트는 `thread_id`; 상태는 입력된 명령어입니다. 각 초단 단계는 체크포인트 테이블에 줄을 쓰습니다. 재개편에서는 마지막 체크포인트에서 실행 시간을 다시 재생합니다. 처음부터 아닙니다. 에이전트들은 `interrupt()`인간 입력을 기다리고 있는 상태에서, 실행시간은 지속되어 노동자를 풀어줍니다. 입력이 도착하면 모든 노동자가 다시 시작할 수 있습니다.

이 사진은 2026년 4월 기준 생산 설계입니다.

### 메가 에이전트의 에이전트당 대기열

arXiv:2408.09955는 규모 실험을 설명합니다. 한 클러스터에 수천 개의 동시 대원입니다.

```
agent i:
  state ∈ {Idle, Processing, Response}
  in_queue   <- messages addressed to agent i
  out_queue  -> replies + side effects

coordinators:
  intra-group chat  (agents in the same group)
  inter-group admin chat  (high-level routing)
```

두 층의 조정은 그룹 내 대화가 밀도가 높을 수 있도록 해 그룹 간 대화가 희소하게 유지됩니다. 수천 명의 에이전트에서 비용을 선형으로 유지하는 데 사용되는 패턴입니다.

### 아싱크 vs 스레드-퍼-직업

LLM 호출은 I/O 결합입니다. 다음 토큰을 기다리는 스레드는 99%의 시간 동안 비활성입니다. 스레드는 각각 ~ 1MB RAM, 10,000 개의 동시 호출에서, 단지 스택에 10GB입니다.

섬유 (Python `asyncio`, 가구틴, `tokio`) 협동적으로 I/O에서 수익을 창출합니다. 같은 10,000 개의 호출은 프로세스에 편안하게 적합합니다. LLM- 에이전트 규모에서, 동기화는 최적화가 아닙니다.

예외: CPU에 묶인 포스트프로세싱 (인베딩, 토케니저 트릭) 은 여전히 스레드 또는 프로세스를 필요로 합니다.

### 베디의 반점

"스칼링 에이전틱 소프트웨어" (Ashpreet Bedi, 2026) 는 대부분의 팀이 로드를 측정하기 전에 과도하게 엔지니어링한다고 주장합니다. 실용적인 기본:

- 패스트아피 + 포스트그레스
- 각 에이전트 실행은 줄입니다. 낙관적인 동시성으로 현장에서 업데이트 된 상태입니다.
- `pg_notify`아니면 단순한 셀러리 노동자일 수도 있습니다.
- 응용 프로그램 코드에서 다시 시도하십시오.

관리 가능한 작업에 대한 동시 대리인 실행 중 ~ 100 개 이하의 로드에서는 이 정도가 필요한 경우가 많습니다.

규칙: 간단한 건축물들이 해결할 수 없는 구체적인 문제를 겪을 때 지속 가능한 실행 프레임워크를 채택하세요. 조기 채택은 무효가 되는 의식에 시간을 낭비합니다.

### 정확히 한 번의 의미론

유료 에이전트 러닝을 위해서는 "정확 한 번 효과적" (최소 한 번 배달 + 무능한 소비자) 이 필요합니다.

- **Dedup key per run.**부작용 전화에 포함해 주세요.
- **Outbox pattern.**부작용은 먼저 테이블에 기록하고, 다른 프로세스가 실행합니다. 두 단계 모두 무력합니다.
- **Compensating transactions.**부작용이 성공하지만 추적 기록이 실패하면 보상금을 계획하십시오.

이 데이터베이스 엔지니어링 패턴은 LLM 특수한 것이 아닙니다. LLM 세금은 LLM 호출이 느린 것뿐입니다. 다른 모든 것은 표준 분산 시스템입니다.

### 레인보우 배포

애너트로피크의 다중 에이전트 연구 시스템은 "레인보우 배포"를 사용합니다. 에이전트 런타임의 여러 버전이 동시에 실행되기 때문에 오랜 기간 동안 실행되는 에이전트들은 모든 코드 배포에서 죽여야하지 않습니다. 카나리 새로운 버전은 트래픽의 한 조각에 있습니다. 에이전트들이 완료되면 오래된 버전은 퇴직됩니다.

이것은 장기적인 상태 시스템에서 표준입니다. 2026 개정에는 요원이 몇 시간 동안 살 수 있으므로 배포 주기는 수용되어야합니다.

### 가공의 검증 목록

- 내구성 상태 (검정점, 스냅샷 또는 아웃박스 + 재생 가능한 로그)
- 무능한 부작용
- LLM 호출에 대한 A/O 계층의 동기화
- 적어도 한 번씩 배달하면
- 상태가 많은 작업량에 대한 Rainbow/Canary 배포
- 관찰 가능: 대리인 단위로 추적, 초단계 감사, 재실험 카운터.

```figure
sw-checkpoint-replay
```

## 건설 해

`code/main.py`이 도구는

- `CheckpointStore` 스레드 아이디 키와 함께 SQLite 지원 체크포인트 로그. 각 슈퍼 단계에 줄이 추가됩니다.
- `run_with_checkpoint(agent, thread_id)` 중동 사고를 시뮬레이션하고, 마지막 체크포인트에서 두번째 직원이 재개한다.
- `AgentQueue` 대리인당 작은 작업 줄을 가진 비동기/처리/응답 상태 기계
- `demo_async_vs_threads()` 아시뉴스 및 스레드 등을 통해 500 개의 동시 시뮬레이션 "LLM 호출"을 실행하고, 벽 시계 및 픽 메모리를 보고합니다 (대거).

실행:

```
python3 code/main.py
```

예상 출력: 시뮬레이션 충돌 후 체크포인트 재개 작업이 성공한다. 아싱크 버전은 < 1s에서 500 개의 동시 호출을 처리한다. 스레드 버전은 몇 초 걸리고 동시 단위로 큰도의 많은 메모리를 사용합니다.

## 사용 하 고

`outputs/skill-scaling-advisor.md`내구성 실행 선택에 대한 조언: FastAPI + Postgres, LangGraph 실행 시간, 시간적 또는 사용자 지정. 로드, 상태 유지 필요 및 배포 주파수에 따라 캘리브러.

## 선박

캐논िकल 생산 가혹:

- **Start simple (Bedi's rule).**패스트API + 포스트그레스 측정이 실패할 때까지
- **Instrument everything before optimizing.**실행 시간, 단계 시간, 재시 count, 실패 분류
- **Outbox pattern for side effects.**특히 결제와 외부 API 호출
- **Rainbow deploys.**비행 중에 조종사를 죽이지 말아요
- **Adopt durable-execution engines (Temporal / LangGraph / Restate) when**특정 문제들을 겪게 되죠. 수시간 동안 인근 대기, 지역 간 조정, 복잡한 재실험/배상 정책.
- **Async for the I/O layer.**CPU에 연결된 후처리용 전선만

## 운동

1. 달아`code/main.py`체크포인트 재개 작업 확인; 아싱크와 스레드 동시함 차이를 측정
2. **outbox**테이블: 모든 도구 호출은 먼저 아웃박스에 작성되고, 다음에는 별도의 goroutine/task가 실행됩니다. 도구 호출을 두 번 실행하여 무력성을 확인합니다.
3. 시뮬레이션**rainbow deploy**: 두 개의 동시 실행 시간 버전; 새로운 스레드_이드를 각각으로 중간에 연결; 이전 버전의 비행 속 스레드들이 중단되지 않았다는 것을 확인합니다.
4. 랭그라프의 런타임 문서 (하에 링크된) 를 읽어 보세요. 핸드 로롤 FastAPI + Postgres 버전에서 실행시간의 특징이 가장 오래 걸리는 것을 확인하세요. 이것이 채택할 이유가입니까? 아니면 연기할 수 있습니까?
5. 메가 에이전트 (arXiv:2408.09955) 3부 3세기를 읽어보세요. 두층 조정 (그룹 내 + 그룹 간 관리자 채팅) 은 명시적입니다. 두 개의 줄을 가진 메시지 줄을 어떻게 지도할 것인지 스케치하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Durable execution | "Persist the program state" | Engine writes state after each super-step; crash recovery is deterministic. |
| Super-step | "Transactional boundary" | Unit of work between checkpoints. LangGraph term. |
| thread_id | "Agent run identifier" | Key that binds checkpoints and resume logic. |
| Idempotency | "Safe to retry" | Repeating a side effect produces the same result as one attempt. |
| Outbox pattern | "Decouple side effects" | Write intent to a table; a separate executor performs and marks done. |
| At-least-once delivery | "Possible duplicates" | Message queue semantics; dedup key makes consumer effective-once. |
| Rainbow deploy | "Overlapping versions" | Multiple runtime versions concurrent during long-running workloads. |
| Async fiber | "Cooperative yielding" | User-mode concurrency; cheap compared to threads for I/O-bound loads. |
| Checkpoint | "State snapshot" | Serialized state at a super-step boundary; key for resume. |

## 더 많은 읽기

- [LangChain — The runtime behind production deep agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) 랭그라프 실행 시간 설계
- [MegaAgent](https://arxiv.org/abs/2408.09955) 대리자당 생산자-소비자 순차; 수천 개의 동행 대리자에서 두층 조정
- [Matrix](https://arxiv.org/abs/2511.21686) 통신줄이 조율 기질로 decentralized framework
- [Temporal docs](https://docs.temporal.io/) 내구성 실행을 위한 참조 작업 흐름 엔진
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) 레인보우 배포를 포함한 생산 수업
