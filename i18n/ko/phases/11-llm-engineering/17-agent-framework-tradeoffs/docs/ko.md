# 에이전트 프레임워크 트레이드오프스  그래프, 역할, 배우 오케스트라

> 모든 프레임워크는 동일한 데모를 판매하고 (연구 에이전트가 보고서를 만듭니다) 그리고 동일한 버그를 숨깁니다 (국립 스케마는 오케스트레이션 계층과 싸웁니다). 추상화들이 문제의 모양과 일치하는 프레임워크를 선택하십시오. 나머지는 두 번 작성하는 립입니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 16 (LangGraph)
**Time:** ~45 minutes

## 문제

한 번 이상의 LLM 호출이 필요한 작업이 있습니다. 아마도 그것은 연구 작업 흐름 (계획, 검색, 요약, 인용) 이다. 어쩌면 그것은 코드 검토 파이프라인 (분석 차이, 비판, 패치, 유효성). 어쩌면 그것은 비행을 책, 이메일을 작성, 그리고 비용 보고서를 파일하는 다 차례 보조자. 당신은 프레임워크를 선택합니다.

3일 후에 프레임워크의 추상물 누출이 발견됩니다. 크루아이는 역할만 주지만 "연구자"가 "작가"에게 구조화된 계획을 전달해야 할 때 싸운다. 오토제인은 에이전트들 간의 채팅을 주지만 1급 상태가 없으므로 체크포인트는 대화 로그의 한 조각입니다. 랭그그래프는 국가 그래프를 제시하지만, 에이전트가 무엇을 할지 알기 전에 모든 전환을 명명하도록 강요합니다. 아노는 단행성 추상화를 해줍니다. 3명의 동행 노동자에게 퍼져나갈 때 소리치는 거죠.

해결 방법은 "최고의 프레임워크를 선택하세요"는 아닙니다. 그것은 프레임워크의 핵심 추상과 문제의 모양에 일치하는 것입니다. 이 교훈은 그 지도를 그리습니다.

## 개념

![Agent framework matrix: core abstraction vs problem shape](../assets/framework-matrix.svg)

2026년 경관을 지배하는 네 가지 프레임워크가 있습니다. 그들의 핵심 추상화는 동일하지 않습니다.

| Framework | Core abstraction | Best fit | Worst fit |
|-----------|------------------|----------|-----------|
| **LangGraph** | `StateGraph` — typed state, nodes, conditional edges, checkpointer. | Workflows with explicit state and human-in-the-loop interrupts; production agents needing time-travel debugging. | Loose, role-driven brainstorming where the topology is unknown. |
| **CrewAI** | `Crew` — roles (goal, backstory), tasks, process (sequential or hierarchical). | Role-playing or persona-driven workflows with a short linear/hierarchical plan. | Anything stateful beyond the crew's turn history; complex branching. |
| **AutoGen** | `ConversableAgent` pair — two or more agents that speak in turns until an exit condition. | Multi-agent *dialogue* (teacher-student, proposer-critic, actor-reviewer) where the thinking emerges from the chat. | Deterministic workflows with a known DAG; anything needing durable state across restarts. |
| **Agno** | `Agent` — a single LLM + tools + memory, composable into teams. | Fast-to-build single agents and lightweight teams; strong multi-modality and built-in storage drivers. | Deep, explicitly-branched graphs with custom reducers. |

### "자유론"이란 말의 의미는

프레임워크의 핵심 추상화는 당신이 아키텍처를 시공할 때 화이트보드 위에 그려내는 것입니다.

- **LangGraph**이 그래프를 그리면 노드는 단계이고 가장자리는 전환이고 각 지점에서의 상태 객체가 입력됩니다.
- **CrewAI**→ 당신은 조직 차트를 그리고 있습니다. 각 역할은 직업 설명과 관리자가 작업을 라우팅합니다. 정신 모델은 전문가의 작은 팀입니다.
- **AutoGen**두 명의 에이전트가 서로 메시지를 주고받으며, 세 번째가 모더니터가 필요하다면 합류합니다.
- **Agno**이 모든 것은 모두 다른 종류의 도구와 함께 있습니다.

### 국가문제

국가는 대부분의 프레임워크 선택이 생산에서 붕괴되는 곳입니다.

- **LangGraph.**타입 상태 (`TypedDict`또는 피단틱 모델), 필드별 줄인, 1급 체크포인터 (SQLite/Postgres/Redis).
- **CrewAI.**  `context`                `output_pydantic`- 승무원 개개인 상점도 없으니, 승무원이 다시 시작하면 스스로 탈퇴해야 합니다.
- **AutoGen.**상태는 채팅 역사와 사용자 정의의 모든 상태입니다 `context`대화 표본은 계속 유지됩니다. 어댑터를 작성하지 않는 한 임의 작업 흐름 상태는 그렇지 않습니다.
- **Agno.** 에 연결된 내장된 저장 장치 드라이버 (SQLite, Postgres, Mongo, Redis, DynamoDB)`Agent``storage=` 대화 세션 및 사용자 기억은 자동으로 유지됩니다. 전체 그래프 체크포인터가 아니라 세션 스토어입니다.

### 분할 문제

비단적인 에이전트들이 다 지부를 맡고

- **LangGraph** 조건부 가장자리를 통해 결정합니다. 라우팅은 이름 지어진 지점으로 된 파이썬 함수입니다. 지점들은 컴파일된 그래프에서 1급입니다. 체크포인터는 어떤 지점을 가져간 지점을 기록합니다.
- **CrewAI** 관리자는 계층 모드에서 결정하고, 순서 모드에서는 제작 시간에 결정합니다. 라우팅은 작업 목록에 포함됩니다. 관리자의 명령어 이외에는 1급 "만약"이 없습니다.
- **AutoGen** 에이전트는 채팅을 통해 결정합니다. 분할은 다음으로 누가 말하는지 결정됩니다. `GroupChatManager`다음 스피커를 선택합니다.`speaker_selection_method`하지만 기본적으로는 LLM가 적용됩니다.
- **Agno** 에이전트는 다음으로 어떤 도구를 사용해야 하는지 결정합니다. 팀들은 조정자/ 라우터/ 협력자 모드를 가지고 있습니다. 그 이상의 분할은 개발자의 책임입니다.

### 관찰 가능성 문제는

- **LangGraph** LangSmith 또는 OTel 수출자 를 통해 OpenTelemetry. 각 노드 전환은 추적 기간; 체크포인트 는 재생 가능한 추적으로 두 배로 증가한다. LangSmith는 첫 번째 당원 옵션; Langfuse/Phoenix 또한 어댑터 가 있습니다.
- **CrewAI** 2025년 말부터 1급 오픈텔레미트리; 랭푸스, 피닉스, 오픽, 에이전트오프스와 통합.
- **AutoGen** 오픈텔레미트리 통합을 통해`autogen-core`; 에이전트오프스와 오픽은 커넥터를 가지고 있습니다. 추적 미분성은 매개체 메시지, 매듭이 아닙니다.
- **Agno** 내장 `monitoring=True`플래그 플러스 오픈테레미트리 수출자; 세션 추적을 위해 Langfuse와 긴밀한 통합.

### 비용 및 지연시간

네 개의 프레임워크 모두 호출 당 오버헤드를 추가합니다 (프레임워크 로직, 검증, 시리에리얼링). 대략적인 오버헤드를 증가시키는 순서: Agno ≈ LangGraph < CrewAI ≈ AutoGen. 차이점은 프레임워크에 추가 LLM 라우팅이 얼마나 많은 것이 지배적이다. CrewAI의 계층 관리자는 다음으로 가는 것을 결정하는 토큰을 사용합니다.`GroupChatManager`랭그라프도 당신이 쓰는 곳에만 토큰을 쓸 수 있습니다`llm.invoke`아고의 단일 에이전트 경로는 얇습니다.

1회에 한 번씩의 비용이 중요할 때, 명시적인 라우팅을 선호합니다 (LangGraph edges, AutoGen `speaker_selection_method`) 를 통해 LLM 선택된 라우팅을

### 상호 운용성

- **LangGraph****LangChain**도구, 검색기, LLM. 1급 MCP 어댑터 (MCP 서버로 수입된 도구)
- **CrewAI** 도구가 물려받는 것`BaseTool`; 랭체인 도구, 라마 인덱스 도구, MCP 도구 모두 적응합니다.`allow_delegation=True`- 그래
- **AutoGen**→`FunctionTool`파이썬으로 호출할 수 있는 모든 것을 꽉 찼습니다. MCP 어댑터도 사용할 수 있습니다. 에이전트에서 에이전트 패턴을 위해 AG2 생태계와 긴밀하게 결합합니다.
- **Agno**→`@tool`디코레이터 또는 BaseTool 하위급; MCP 어댑터; 도구는 에이전트 및 팀들 사이에서 공유될 수 있습니다.

## 능력

> 한 문장으로 설명할 수 있습니다. 어떤 프레임워크가 특정 에이전트 문제에 적합한 이유를요.

사전 제작 체크리스트:

1. **Draw the shape.**그래프 (타이핑 상태, 이름의 전환) 의 경우, 역할 놀이 (전문가들이 일을 맡고)? 채팅 (사무원들이 말 할 때까지 이야기) 의 경우, 도구가 있는 단일 에이전트?
2. **Decide who branches.**개발자 결정 된 분할 → LangGraph. 관리자- 에이전트 결정 된 → CrewAI 계층적. 채팅-흥 → AutoGen. 도구-콜 결정 된 → Agno.
3. **Check the state budget.**체크포인트에서 재개 과정이 필요합니까? 시간 여행이 필요합니까? 인간으로 중간에 중단되는가요? 만약 그렇다면, 랭그라프는 기본입니다.
4. **Check the cost budget.**LLM의 선택된 라우팅은 매회 추가 토큰을 지불합니다. 에이전트가 하루에 수천 번 실행하면 명시적인 라우팅을 선호합니다.
5. **Budget the framework overhead.**모든 프레임워크는 다른 의존성입니다. 작업이 두 개의 LLM 호출과 도구라면, 간단한 파이썬의 30 줄을 작성하십시오. 프레임워크는 프레임워크보다 저렴합니다.

그래프, org 차트, 채팅 또는 에이전트 박스를 그리기 전에 프레임워크를 찾아내지 않거나, 당신이 실제로 필요로 하는 것을 위해 국가 모델에 맞서 싸워야 하는 프레임워크를 선택하지 않기를 거부하십시오.

## 결정 매트릭스

| Problem shape | Preferred framework | Why |
|---------------|---------------------|-----|
| Workflow DAG with typed state, human approvals, long-running | LangGraph | First-class state, checkpointer, interrupts, time-travel. |
| Research / writing pipeline with distinct roles | CrewAI (sequential) or LangGraph subgraphs | Role-per-task is cheap to express in CrewAI; scale up with LangGraph when branching gets complex. |
| Proposer-critic or teacher-student dialogue | AutoGen | Two-agent chat is its native shape. |
| Single agent with tools, sessions, memory | Agno | Thinnest setup, built-in storage and memory. |
| Thousands of parallel fanouts with reducers | LangGraph + `Send` | The only one with a first-class parallel-dispatch API. |
| Quick prototype, no framework commitment | Plain Python + provider SDK | No framework is the fastest framework. |

```figure
l5-framework-fit
```

## 운동

1. **Easy.**같은 작업을 수행합니다. "Anthropic 본부를 조사하고 200 단어의 브릿프를 작성하고 소스를 인용하십시오". LangGraph (네 노드: 계획, 검색, 쓰기, 인용) 및 CrewAI (삼 역할: 연구자, 작가는, 편집자) 에서 구현합니다. 실행 및 코드 라인당 토큰 비용을보고하십시오.
2. **Medium.**AutoGen에서 동일한 작업을 구축하십시오 (연구자  작가 채팅, 편집자가 `GroupChat`) 와 아고 (일자 대리인이`search_tools`그리고`write_tools`(a) 실행 당 비용, (b) 충돌 후 재개 가능, (c) 작성 단계 전에 인체의 승인을 주입 할 수 있는 능력.
3. **Hard.**결정나무 스크립트를 작성하세요 `pick_framework.py`짧은 문제 설명 (JSON: `{has_typed_state, has_roles, has_dialogue, has_parallel_fanout, needs_resume}`) 를 한 문장 의 근거 로 추천 을 반환 합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Orchestration | "How the agents coordinate" | The layer that decides which node/role/agent runs next. |
| Durable state | "Resume after a restart" | State that survives process death, attached to a checkpoint or session store. |
| LLM-selected routing | "Let the model decide" | A planner LLM picks the next step each turn; flexible but pays tokens on every decision. |
| Explicit routing | "Developer decides" | A Python function or static edge picks the next step; cheap and auditable. |
| Crew | "A CrewAI team" | Roles + tasks + process (sequential or hierarchical) bound into a single runnable. |
| GroupChat | "AutoGen's multi-agent chat" | A managed conversation between N agents with a speaker selector. |
| Team (Agno) | "Multi-agent Agno" | Route / coordinate / collaborate mode over a set of agents. |
| StateGraph | "LangGraph's graph" | Typed-state, node, conditional-edge, checkpointer abstraction. |

## 더 많은 읽기

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) 국가 그래프, 체크포인트, 인터럽트, 시간 여행.
- [CrewAI documentation](https://docs.crewai.com/) 승무원, 흐름, 요원, 임무, 프로세스
- [AutoGen documentation](https://microsoft.github.io/autogen/) 대화 가능한 에이전트, 그룹 채팅, 팀, 도구.
- [Agno documentation](https://docs.agno.com/) 에이전트, 팀, 워크플로우, 저장, 메모리
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) 패턴 라이브러리 (프롬프트 체인, 라우팅, 병렬화, 오케스트레이터-노동자, 평가자-최시) 프레임워크-아고스틱.
- [Yao et al., "ReAct: Synergizing Reasoning and Acting" (ICLR 2023)](https://arxiv.org/abs/2210.03629) 각 프레임워크의 루프가 잘 어울립니다.
- [Wu et al., "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation" (2023)](https://arxiv.org/abs/2308.08155) 오토겐의 디자인 페이퍼
- [Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (UIST 2023)](https://arxiv.org/abs/2304.03442) CrewAI 스타일의 인격 스택이 구축하는 역할 플레이 기반.
- 11 · 16 단계 (LangGraph)  이 수업의 기준 프레임워크
- 11 · 19 단계 (반복)   랑그라프에 깔끔하게 지도를 그리는 패턴이지만 CrewAI에 어색합니다.
- 11 · 22 단계 (생산 관찰 가능성)  어떤 프레임워크를 선택하느냐에 따라 어떻게 기기를 사용할 수 있는지
