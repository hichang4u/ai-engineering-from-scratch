# 국가 그래프 오케스트레이션  지속가능한 실행 및 체크포인트

> 에이전트는 상태 기계입니다. 노드는 함수이며, 가장자리는 전환입니다. 각 노드의 후 상태가 체크포인트로 지정됩니다. 마지막 성공적인 체크포인트에서 모든 실패에서 재개합니다. 랭그그래프는 낮은 수준의 상태가 있는 오케스트레이션의 이 모델의 2026 참조입니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~75 minutes

## 학습 목표

- 랭그라프의 핵심 모델을 설명하십시오. 타이핑 상태, 함수 노드, 조건부 가장자리 및 노드 후 체크포인트의 상태 기계.
- 문서에서 강조된 네 가지 기능을 명명하세요: 내구성 실행, 스트리밍, 인-이-loop, 포괄적인 메모리.
- 랭그그래프가 지원하는 3가지 오케스트레이션 토폴로지를 설명하십시오. 감독, 피어-투-피어 (스워임), 계층 (네스트 된 서브그래프).
- 입력된 상태, 조건부 가장자리와 체크포인트/레전시 사이클을 가진 stdlib 상태 그래프를 구현한다.

## 문제

에이전트와 워크플로우는 하나의 문제를 공유합니다. 40 단계 실행이 38 단계에서 실패하면, 당신은 38 단계에서 다시 시작하기를 원합니다. 다시 시작하지 않습니다.

랭그그래프의 디자인 답: 상태는 1급 타이핑 객체이며, 돌연변이가 명시적이며, 체크포인트는 각 노드 후에 계속됩니다.`load_state(session_id)`전화해

## 개념

### 그래프

그래프는 다음과 같이 정의됩니다.

- **State type.**각 노드가 읽고 돌연변이를 하는 타이핑된 디렉트 (또는 피다닉 모델)
- **Nodes.**순수 기능`(state) -> state_update`업데이트는 복귀 후 상태로 통합됩니다.
- **Edges.**노드들 사이의 조건 또는 직접적인 전환
- **Entry and exit.** `START`그리고`END`경비원 노드는 경계를 표시합니다.

예를 들어: `classify``refund``bug``sales``done`노드  라우팅 작업 흐름은 그래프로

### 지속가능한 실행

각 노드가 반환되면 런타임은 상태를 일련화하여 체크포인터 (SQLite, Postgres, Redis, 사용자 지정) 에 작성합니다. 단계 N에서 실패하면 런타임이 `resume(session_id)`그리고 정확한 상태와 함께 단계 N+1에서 시작하십시오.

랭그라프 문서들은 생산 사용자들에게 중요한 부분을 명시적으로 강조합니다. 클라나, 우버, JP 모건. 주장은 그래프 모양이 아니라 그래프 모양과 체크포인팅이 복구에 저렴한 것을 만듭니다.

### 스트리밍

각 노드는 부분 출력을 줄 수 있습니다. 그래프는 노드-델타 사건에 따라 호출자에게 스트리밍이므로 UI가 그래프가 실행됨에 따라 업데이트됩니다.

### 인간과 함께

노드 간 상태를 검사하고 수정합니다. 구현: 중요한 노드 전에 일시 중지, 인간에게 표면 상태를, 변경 사항을 받아들이고, 재개. 체크포인터는 상태가 이미 일련화되어 있기 때문에 이것을 쉽게 만듭니다.

### 기억

단기 (연전 상태에서  대화 역사) 및 장기 (연전 시점과 별도의 장기 저장소를 통해 지속되는 ) LangGraph는 도구를 통해 외부 메모리 시스템 (Mem0, 사용자 지정) 과 통합됩니다.

### 3개의 토폴로지

1. **Supervisor.**중앙 라우터 LLM는 전문적인 서바게ଣ୍ଟ에게 파견됩니다.`create_supervisor()``langgraph-supervisor`(만일 2026년 랭체인 연구팀은 이를 직접적인 도구 통한 컨텍스트 제어 요구를 통해 수행할 것을 권장한다).
2. **Swarm / peer-to-peer.**에이전트들은 공유 도구 표면을 통해 직접 전달합니다. 중앙 라우터도 없습니다.
3. **Hierarchical.**하위 감독자를 관리하는 감독자, 둥근 하위 그래프로 구현

### 이 패턴이 잘못되는 곳

- **Checkpoints too small.**단지 체크포인트 대화 회전만 도구 상태를 남겨두고 메모리는 복구되지 않습니다. 전체 상태는 일련화되어야합니다.
- **Non-deterministic nodes.**리뷰미는 노드 입력이 동일한 상태 업데이트를 생성한다고 가정합니다. 무작위 씨앗, 벽 시계, 외부 API를 캡처해야합니다.
- **Over-use of conditional edges.**모든 가장자리가 조건이 있는 그래프는 정계에 대한 논의를 할 수 없는 기계입니다. 가끔 가지 있는 선형 연쇄를 선호합니다.

```figure
langgraph-state
```

## 건설 해

`code/main.py`stdlib 상태 그래프를 구현합니다:

- `State`  `messages``step``route``output``human_approval`- 그래
- `Node` 통칭 상태 및 업데이트 명령어 반환
- `StateGraph` 노드 + 엣지 + 조건부 엣지 + 실행 + 재개
- `SQLiteCheckpointer`(in-memory fake)  각 노드 이후에 상태를 연속화합니다.`load(session_id)`복원합니다.
- 데모 그래프: 분류 -> 지부(회환 / 버그 / 판매) -> 인문 -> 전송.

실행하세요:

```
python3 code/main.py
```

흔적이 보여준 것은 첫 번째 경기가 실패하고, 지속해서 최종 출력을 다시 시작한다는 것입니다.

## 사용 하 고

- **LangGraph** 참고자료, 생산 준비. 사용 `create_react_agent``create_supervisor`또는 자신의 그래프를 만들 수도 있습니다.
- **AutoGen v0.4**(강좌 14)  높은 경쟁률 시나리오에 대한 배우 모델 대안.
- **Claude Agent SDK**(강습 17)  내장된 세션 스토어와 함께 관리 된 배너스
- **Custom** 상태 모양이나 체크포인터 백엔드를 정확히 제어할 필요가 있을 때

## 선박

`outputs/skill-state-graph.md`체크포인팅과 리수미를 연결한 모든 목표 실행 시간에 LangGraph 모양의 상태 그래프를 생성합니다.

## 운동

1. 에서 조건부 가장자리를 추가`classify` `end`분류 신뢰도가 열계 이하에 있을 때`route`수동으로
2. SQLite 같은 가짜를 진짜 SQLite 체크포인터로 교환해
3. 병렬 가장자리를 구현: 두 개의 노드가 동시에 실행되고 사용자 지정 줄인기로 합쳐집니다. 이 곳에서 변함없는 상태가 무엇을 구입합니까?
4. 읽으세요`langgraph-supervisor`참고로 장난감을 `create_supervisor`흔적 모양을 비교해 보세요.
5. 스트리밍을 추가: 각 노드는 실행 중 부분 상태를 생성합니다. 도착할 때 델타를 인쇄합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| State graph | "Agent as state machine" | Typed state + nodes + edges + reducers |
| Checkpointer | "Persistence backend" | Serializes state after every node; enables resume |
| Reducer | "State merger" | Function that combines current state with a node's update |
| Conditional edge | "Branch" | Edge chosen by a function of state |
| Subgraph | "Nested graph" | A graph used as a node inside another graph |
| Durable execution | "Resume from failure" | Restart at the last successful node with exact state |
| Supervisor | "Router LLM" | Central dispatcher for specialist subagents |
| Swarm | "P2P agents" | Agents hand off via shared tools; no central router |

## 더 많은 읽기

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) 참조 문서
- [langgraph-supervisor reference](https://reference.langchain.com/python/langgraph/supervisor/) 감독 패턴 API
- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) 배우 모델 대안
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) 세션 매장 및 서바겐트
