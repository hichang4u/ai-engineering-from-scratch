# 주관국제기기  그래프, 노드, 체크포인트

> 손으로 작성된 ReAct 루프는 `while True`랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩은 랩

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 14 (Model Context Protocol)
**Time:** ~75 minutes

## 문제

함수를 호출하는 에이전트를 전송합니다. 그것은 세 차례 작동합니다. 그리고 뭔가 잘못됩니다. 모델은 500을 반환하는 도구를 시도합니다. 사용자는 중 작업에 대해 생각을 변경합니다. 또는 에이전트는 사람이 서명하지 않고 주문을 환불하기로 결정합니다.`while True:`루프에는 할크가 없습니다. 당신은 그것을 멈추지 않고, 다시 돌려도 할 수 없습니다. 그리고 "모델이 다른 도구를 선택했다면 어떨까요?"로 갈라질 수 없습니다.

다음 단계는 당신이 그것을 본 후에 분명합니다. 에이전트는 이미 상태 기계  시스템 프롬프트 + 메시지 역사 + 대기 중 도구 호출 + 다음 액션입니다. 정체 기계를 명시적으로 만들어라: "모델이 생각하는 것", " 도구가 실행되고" "인간이 승인하는 것"과 "그들 사이의 조건적 전환을 위한 가장자리" 그래프가 명시되면, 하네스는 4가지 것들을 무료로 얻을 수 있습니다. 체크포인팅 (단계 사이의 상태를 저장), 인터럽트 (인간에게 일시 중지), 스트리밍 (스트림 토큰 및 중간 이벤트) 및 시간 여행 ( 이전 상태로 다시 돌아가 다른 분사를 시도하십시오).

이 추상화의 참조 구현은 LangGraph이다. 그것은 LangChain 의미에서 에이전트 프레임워크가 아닙니다 ("이곳은 에이전트 실행자, 행운을 빌리십시오"). 그것은 일급 상태, 일급 내구성 및 일급 중단이있는 그래프 실행 시간입니다. 에이전트 루프는 당신이 손으로 작성하는 것이 아니라 سىز고있는 것입니다.

## 개념

![LangGraph StateGraph: nodes, edges, and the checkpointer](../assets/langgraph-stategraph.svg)

A`StateGraph`세 가지 요소가 있습니다.

1. **State.**그래프를 통해 흐르는 타이핑 디렉트 (TypedDict 또는 Pydantic 모델) 는 각 노드가 전체 상태를 수신하고 부분 업데이트를 반환하여 랭그그래프가 각 필드에 대한 * reduktor * 를 사용하여 통합합니다.`operator.add`축적되어야 하는 목록에 대해서는 기본적으로 덮어쓰기
2. **Nodes.**파이썬 함수`state -> partial_state`각각의 단계들은 개별적인 단계입니다. "모델을 호출하고", "툴을 실행하고", "자결합니다".
3. **Edges.**노드 간 전환. 정적 가장자리는 한 곳으로 이동. 조건적인 가장자리는 라우터 기능을 취합니다.`state -> next_node_name`그래프는 모델 출력으로 갈라질 수 있습니다.

그래프를 컴파일합니다. 컴파일은 토폴로지를 묶고, 체크포인터를 붙여줍니다 (선택하지만 생산에 필수적입니다), 그리고 실행 가능한 것을 반환합니다. 당신은 초기 상태와 `thread_id`- 집행의 모든 단계에는`(thread_id, checkpoint_id)`- 그래

### 네 개의 초강대국

**Checkpointing.**각 노드 전환은 새로운 상태를 저장소에 기록합니다 (테스트에 대한 메모리, 프로드에 대한 Postgres/Redis/SQLite). 같은 그래프를 다시 호출하여 재개합니다 `thread_id`그래프는 멈춘 곳에서 다시 시작됩니다.

**Interrupts.** 로 노드를 표시`interrupt_before=["human_review"]`이 상태는 계속됩니다. API는 사용자에게 "허가를 기다리고 있습니다".`thread_id``Command(resume=...)`집행이 재개됩니다.

**Streaming.** `graph.stream(state, mode="updates")`델타 주에서 발생한다.`mode="messages"`모델 노드 안에 LLM 토큰을 스트리밍합니다. `mode="values"`전체 스냅샷을 내놓습니다. 사용자 인터페이스에서 어떤 것을 표면에 내놓을 것인지 선택하세요.

**Time-travel.** `graph.get_state_history(thread_id)`체크포인트 전체 로그를 반환합니다.`checkpoint_id` `graph.invoke`디버깅을 할 수 있습니다 ("모델이 대신 도구 B를 선택했다면 어떨까요?") 그리고 생산 흔적을 재생하는 회귀 테스트를 위해 좋습니다.

### 줄이는 것이 핵심입니다.

모든 상태 필드는 줄인자를 가지고 있습니다. 대부분의 기본값은 괜찮습니다. 새로운 값은 오래된 값을 덮습니다. 그러나 메시지 목록은 필요합니다.`operator.add`그래서 새로운 메시지는 교체하는 대신 추가됩니다. 평행 가장자리는 리디커를 통해 업데이트를 통합합니다. 두 노드가 모두 업데이트되면`messages`그리고 당신은 잊었습니다`Annotated[list, add_messages]`이 두 번째 은 침묵으로 승리하고 당신은 반 회전을 잃습니다. 줄이는 것은 도서관에서 유일한 미묘한 것입니다.

### ReAct 그래프는 4개의 노드로

생산 ReAct 에이전트는 4개의 노드와 2개의 가장자리로 구성됩니다.

1. `agent` 현재 메시지 역사와 함께 LLM를 호출합니다. 보조 메시지가 반환됩니다 (이 도구_콜을 포함할 수 있습니다).
2. `tools` 마지막 보조 메시지에서 모든 툴_콜을 실행하고 툴 결과물을 툴 메시지로 추가합니다.
3.   조건부 우위를`agent`이 노선은`tools`마지막 메시지는 tool_calls를 포함하면, 다른 `END`- 그래
4. `tools`다시 `agent`- 그래

ReAct 루프 (Thought → Action → Observation → Thought → ...) 를 전체적으로 40 줄의 코드 로 체크포인팅, 인터럽트 및 스트리밍으로 얻을 수 있습니다.

### StateGraph vs 전송 (fanout)

`Send(node_name, state)`노드에서 병렬 하위 그래프를 전송할 수 있습니다. 예제: 에이전트는 3개의 검색기를 동시에 검색하기로 결정합니다.`Send`이 결과들은 상태 감소자를 통해 합쳐집니다. 이렇게 랭그그래프는 원시들을 스레드하지 않고 오케스트레이터-노동자 패턴을 표현합니다.

### 부문

컴파일된 그래프는 다른 그래프의 노드일 수 있다. 외부 그래프는 하나의 노드를 볼 수 있다. 내부 그래프는 자체적인 상태와 자체적인 체크포인트를 가지고 있다. 이렇게 팀들이 감독-노동자 에이전트를 구축한다. 감독 그래프는 사용자 의도를 도메인별로 작업자 서브그래프로 로팅한다.

```figure
l5-state-graph-ledger
```

## 건설 해

### 단계 1: 상태 및 노드

```python
from typing import Annotated, TypedDict
from langchain_core.messages import AnyMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]

def agent_node(state: State) -> dict:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state: State) -> str:
    last = state["messages"][-1]
    return "tools" if getattr(last, "tool_calls", None) else END

tool_node = ToolNode(tools=[search_web, read_file])

graph = StateGraph(State)
graph.add_node("agent", agent_node)
graph.add_node("tools", tool_node)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")

app = graph.compile(checkpointer=MemorySaver())
```

`add_messages`이 오류는, 문자열의 중복을 위해 사용된 문자열의 중복을 위해 사용된 문자열의 중복을 위해 사용된 문자열의 중복을 위해 사용된 문자열의 중복을 위해 사용된 문자열의 중복을 위해 사용된 문자열의 중복을 위해 사용된 문자열의 중복을 위해 사용된 문자열의 중복을 위해 사용된 문자열의 중복을 위해 사용된 문자열의 중복을 위해 사용된 문자열을 사용한다.

### 단계 2: 스레드로 실행

```python
config = {"configurable": {"thread_id": "user-42"}}
for event in app.stream(
    {"messages": [HumanMessage("find the Anthropic headquarters address")]},
    config,
    stream_mode="updates",
):
    print(event)
```

모든 업데이트는 명령입니다`{node_name: state_delta}`프론트엔드는 이 영상을 UI에 스트리밍해 " 에이전트가 생각하고 있는 것"을 볼 수 있습니다. 검색 웹을 호출하고,

### 단계 3: 루프에 있는 인물을 방해하는

노드를 표시하여 실행이 실행되기 전에 중단됩니다.

```python
app = graph.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["tools"],  # pause before every tool call
)

state = app.invoke({"messages": [HumanMessage("delete the production database")]}, config)
# state["__interrupt__"] is set. Inspect proposed tool calls.
# If approved:
from langgraph.types import Command
app.invoke(Command(resume=True), config)
# If denied: write a rejection message and resume
app.update_state(config, {"messages": [AIMessage("Blocked by human reviewer.")]})
```

상태, 체크포인트, 스레드 모두 중단 기간 동안 지속됩니다. 실행 중 외에는 기억에 아무것도 없습니다.

### 단계 4: 디버깅을 위한 시간 여행

```python
history = list(app.get_state_history(config))
for snapshot in history:
    print(snapshot.values["messages"][-1].content[:80], snapshot.config)

# Fork from a prior checkpoint
target = history[3].config  # three steps back
for event in app.stream(None, target, stream_mode="values"):
    pass  # replay from that point forward
```

지나가는`None`입력값이 주어진 체크포인트에서 재생되는 동안, 값을 통과하면 다시 시작하기 전에 해당 체크포인트 상태에 업데이트로 추가합니다. 이렇게 하면 전체 대화를 다시 실행하지 않고 나쁜 에이전트를 재생합니다.

### 5단계: 생산을 위해 체크포인트 교환

```python
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string("postgresql://...") as checkpointer:
    checkpointer.setup()
    app = graph.compile(checkpointer=checkpointer)
```

SQLite, Redis, 그리고 Postgres가 배송되었습니다.`MemorySaver`다시 시작하면 계속되는 모든 것은 진짜 매장을 필요로 합니다.

## 능력

> 당신은 그래프로 에이전트를 만들지 않고`while True`루프

랭그라프에 도달하기 전에 60초짜리 디자인을 해 보세요.

1. **Name the nodes.**모든 결정이나 부작용이 하나의 노드입니다. "원조가 생각하는 것", "툴이 실행되고", "평론가 승인하고", "응답 스트림".
2. **Declare the state.**리스트 필드마다 줄인 이 있는 최소 타입 디렉트. 모든 것을 넣지 마십시오.`messages`; 업무를 특정한 필드를  (일작 `plan`, a `budget`카운터, a`retrieved_docs`(제1차)
3. **Draw the edges.**다음 단계가 모델 출력에 달려있지 않으면 정형입니다. 모든 조건적인 가장자리는 라우터 함수가 필요합니다.
4. **Choose a checkpointer up front.** `MemorySaver`테스트를 위해 Postgres/Redis/SQLite, 다른 모든 것. 한 가지 없이 배송하지 마십시오.
5. **Decide interrupts before tools run, not after.**승인은 부작용 노드로 가장자리에 들어가서 피해를 입기 전에 취소할 수 있습니다. 검증은 모델의 가장자리에 들어가서 값싸게 나쁜 전화를 거부할 수 있습니다.
6. **Stream by default.** `mode="updates"`UI에 대해`mode="messages"`모델 노드 내부에서 토큰 레벨 스트리밍을 위해, `mode="values"`평가 중에 전체 스냅샷을 위해

체크포인트 없는 랭그그래프 에이전트를 보내지 않거나 부작용이 발생하면 중단을 하는 에이전트를 보내지 않거나`messages` 없는 필드`add_messages`그 감소제로서

## 운동

1. **Easy.**계산기 도구와 웹 검색 도구로 위의 네 노드 ReAct 그래프를 구현하십시오.`list(app.get_state_history(config))`두 차례의 대화에 최소 4개의 체크포인트로 돌아갑니다.
2. **Medium.**`planner`앞을       `agent`그리고 구조화된 글을 쓰고 있습니다.`plan: list[str]`주로 들어가`agent`계획 단계들을 표시하고 시험에 실패하면`plan`체크포인트 재개정에서 손실됩니다 (실반 감소).
3. **Hard.**3개의 하위 그래프 (`researcher``writer``reviewer`) 를 이용`Send`각 서브그래프는 각 주와 체크포인터를 가지고 있습니다.`interrupt_before=["writer"]`외부 그래프에 있는 것으로서 인간에게 연구보고서를 승인할 수 있도록 합니다. 이전 체크포인트에서 시간 여행이

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| StateGraph | "The LangGraph graph" | The builder object you add nodes and edges to before compile. |
| Reducer | "How the field merges" | A function `(old, new) -> merged` applied when a node returns an update for that field; default is overwrite, `add_messages` appends. |
| Thread | "A conversation ID" | A `thread_id` string that scopes all checkpoints for one session. |
| Checkpoint | "A paused state" | A persisted snapshot of the full graph state after a node transition, keyed on `(thread_id, checkpoint_id)`. |
| Interrupt | "Pause for a human" | `interrupt_before` / `interrupt_after` stop execution at a node boundary; resume with `Command(resume=...)`. |
| Time-travel | "Fork from a prior step" | `graph.invoke(None, config_with_old_checkpoint_id)` replays from that checkpoint forward. |
| Send | "Parallel subgraph dispatch" | A constructor a node can return to spawn N parallel executions of a target node. |
| Subgraph | "A compiled graph as a node" | A compiled StateGraph used as a node in another graph; preserves its own state scope. |

## 더 많은 읽기

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) StateGraph, reducers, checkpointers, 그리고 인터럽트에 대한 가전적 참조.
- [LangGraph concepts: state, reducers, checkpointers](https://langchain-ai.github.io/langgraph/concepts/low_level/) 이 강의에서 사용하는 정신 모델은 바로 그 원천에서 나온다.
- [LangGraph Persistence and Checkpoints](https://langchain-ai.github.io/langgraph/concepts/persistence/) Postgres/SQLite/Redis 매장, 체크포인트 이름 공간 및 스레드 ID에 대한 세부 사항.
- [LangGraph Human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/)`interrupt_before``interrupt_after``Command(resume=...)`, 그리고 편집 상태 패턴
- [Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)](https://arxiv.org/abs/2210.03629) 각 랭그그래프 에이전트가 구현하는 패턴; 추론 추론 추론을 위해 그것을 읽으십시오.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) 어떤 그래프 형태 (사슬, 라우터, 오케스트레이터-노동자, 평가자-오프티마저) 를 선호하고 언제
- 단계 11 · 09 (함수 호출)  도구 호출 원시 각 LangGraph 에이전트 노드 재사용.
- 11 · 14 단계 (모델 컨텍스트 프로토콜)  랭그라프에 연결되는 외부 도구 발견 `ToolNode`MCP 어댑터를 통해
- 11 · 17 단계 (원 프레임워크 트레이드오프)  CrewAI, AutoGen, 또는 Agno에 비해 LangGraph을 선택할 때.
