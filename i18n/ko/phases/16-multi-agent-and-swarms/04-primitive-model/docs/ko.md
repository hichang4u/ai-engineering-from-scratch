# 다중 요원 원시 모델

> 4개의 원시적인 것, 더 이상 아무것도 없습니다  에이전트, 랜더, 공유 상태, 오케스트레이터  네 차원 디자인 공간을 니다. 그리고 2026년에 주요 멀티 에이전트 프레임워크 (AutoGen, LangGraph, CrewAI, OpenAI 에이전트 SDK, 마이크로소프트 에이전트 프레임워크) 가 파인트입니다. 이 수업은 0에서 그것들을 만들고, 4개 모두에서 장난감 시스템을 실행하고, 모든 주요 프레임워크를 같은 축에 지도하여 새로운 리포를 한 문장으로 읽을 수 있습니다.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 (Agent Engineering), Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

## 문제

6개월마다 새로운 멀티 에이전트 프레임워크 배가. 2023년 오토겐. 2024년 크루아이. 2024년 랭그그래프와 오픈아이 스와르. 2025년 4월 구글 ADK. 2026년 2월 마이크로소프트 에이전트 프레임워크 RC. 각 보도자료는 "옳은 추상화"라고 주장한다.

한 번에 하나씩 학습하려고 하면, 당신은 불타게 될 것입니다. API는 다르게 보입니다. "원"이 무엇인지에 대해 문서가 동의하지 않습니다. 한 프레임워크는 공유 메모리를 "블랙보드"라고 부르며, 다른 하나는 "메세지 풀"라고 부르며, 세 번째는 "스테이트그래프"라고 부르며, 필드가 단지 윙크하고 있다고 의심하기 시작합니다.

마케팅 아래 네 가지 원시적인 요소는 안정적입니다. 한 번씩 배우고, 모든 새로운 틀을 한 문장으로 읽어보세요.

## 개념

### 네 가지 원시적인

1. **Agent** 시스템 프롬프트와 도구 목록. 국정 없는; 모든 실행은 시스템 프롬프트와 현재 메시지 역사에서 시작됩니다.
2. **Handoff** 한 에이전트에서 다른 에이전트로 구조화된 제어 전송. 기계적으로, 새로운 에이전트를 반환하는 도구 호출 또는 조건에 따라 그래프 가장자리.
3. **Shared state** 한 대 이상의 에이전트가 읽을 수 있는 데이터 구조 (때문으로는 작성할 수 있습니다). 메시지 풀, 블랙보드, 키 값 저장, 벡터 메모리.
4. **Orchestrator** 다음으로 누가 말하는지 결정하는 사람. 옵션: 명시적인 그래프 (결정론), LLM 스피커-selektor (soft), 마지막 스피커의 handoff 호출 (OpenAI Swarm), 또는 줄을 (swarm 아키텍처) 를 스케줄러.

모든 프레임워크는 각 축에 대한 기본값을 선택하고 나머지는 표면 문법입니다.

### 2026년 모든 프레임워크가 어떻게 그

| Framework | Agent | Handoff | Shared state | Orchestrator |
|-----------|-------|---------|--------------|--------------|
| OpenAI Swarm / Agents SDK | `Agent(instructions, tools)` | tool returns Agent | caller's problem | the LLM's next handoff call |
| AutoGen v0.4 / AG2 | `ConversableAgent` | speaker-selector on GroupChat | message pool | selector function (LLM or round-robin) |
| CrewAI | `Agent(role, goal, backstory)` | `Process.Sequential / Hierarchical` | Task outputs chained | manager LLM or static order |
| LangGraph | node function | graph edge + condition | `StateGraph` reducer | the graph, deterministic |
| Microsoft Agent Framework | agent + orchestration patterns | pattern-specific | thread / context | pattern-specific |
| Google ADK | agent + A2A card | A2A task | A2A artifacts | host decides |

표면 차이도 엄청나게 보이는데 아래쪽은 같은 4개의 버튼이 있습니다.

### 왜 이 점 이 중요 합니까?

일단 원시들을 보면 프레임워크 비교는 짧은 체크리스트가 됩니다.

- 오케스트레이터는 LLM를 로팅 (Swarm) 에 신뢰합니까? 아니면 로팅을 코드 (LangGraph) 에 핑합니까?
- 공유된 상태 전체 역사 (GroupChat) 또는 프로젝션 (StateGraph reducer) 인가?
- 에이전트는 서로의 명령어를 수정할 수 있는가 (CrewAI 관리자) 아니면 그냥 전달할 수 있는가 (Swarm)?

이 세 가지 질문에 대한 답은 어떤 프레임워크가 주어진 문제에 맞는지의 80%입니다. 당신은 "최고의 멀티 에이전트 프레임워크"를 구입하는 것을 멈추고 실제로 관심있는 축을 위해 설계하기 시작합니다.

### 국가 없는 통찰력

공유 상태를 제외한 모든 원시들은 무국립이다. 에이전트는 함수 (프롬프트, 도구) 이다. 전달은 함수 호출이다. 오케스트레이터는 스케줄러이다.**The only stateful thing in the system is shared state.**흥미로운 버그가 있는 곳이죠. 메모리 중독 (강좌 15), 메시지 순서, 버전, 쓰기 논란.

공유 상태를 숨기는 프레임워크 (Swarm) 는 문제를 호출자에게 밀어넣습니다. 이를 중앙집권시키는 프레임워크 (LangGraph 체크포인트, AutoGen 풀) 는 검사 할 수 있지만, 조정 비용을 공유 상태 구현에 옮긴다.

### 단일 원시의 해부학적

#### 에이전트

```
Agent = (system_prompt, tools, model, optional_name)
```

메모리도 없고 상태도 없고 같은 시스템 프롬프트와 도구를 사용하는 두 에이전트가 교환 가능하며, 에이전트별 상태처럼 보이는 모든 것은 공유 상태 또는 전달 프로토콜입니다.

#### 수송

```
Handoff = (from_agent, to_agent, reason, payload)
```

세 가지 구현이 지배적이다:

- **Function return** 도구는 다음 에이전트를 반환합니다. 이것은 OpenAI 스파임 패턴입니다. 에이전트는 도구 스케마에 라우팅을 수행합니다.
- **Graph edge** 랭그라프. 가장자리는 선언적 이다. LLM는 값을 생성; 조건은 다음 노드를 선택한다.
- **Speaker selection** AutoGen GroupChat. 선택 기능 (때로는 LLM 호출) 은 풀을 읽고 다음 연설자를 선택합니다.

#### 공유 국가

```
SharedState = { messages: [], artifacts: {}, context: {} }
```

최소 메시지 목록. 종종 더 많은 경우: 구조화된 유물 (CrewAI 작업 출력), 타이핑된 컨텍스트 (LangGraph 줄인), 외부 메모리 (MCP, 벡터 DB).

두 가지 토폴로지:**full pool**(모든 에이전트가 모든 메시지를 보며)**projected**(사무자들이 역할 스캔의 시각을 참조하십시오). 전체 풀은 간단하고 규모가 좋지 않습니다. 계획된 풀은 규모가 있지만 초기 스케마 설계가 필요합니다.

#### 오케스트레이터

```
Orchestrator = ({state, last_speaker}) -> next_agent
```

네 가지 맛:

- **Static** 그래프는 제작 시간에 고정됩니다 (langgraph 결정적, CrewAI 순서적).
- **LLM-selected** LLM는 풀을 읽고 다음 스피커를 선택합니다 (AutoGen, CrewAI Hierarchical).
- **Handoff-driven** 현재 대리인은 전달 도구 (Swarm) 를 호출하여 결정합니다.
- **Queue-driven** 노동자들은 공유된 줄을 고, 다음 스피커 (스쿼드 아키텍처, 매트릭스) 가 없습니다.

### 프레임워크들 사이의 변화는 무엇인가

원시적인 것이 고정되면, 나머지 설계 결정은 다음과 같습니다.

- **Memory strategy** 일시적 대 내구적 체크포인팅 (LangGraph 체크포인팅)
- **Safety boundary** 한 가지 전달을 승인 할 수 있는 사람 (loop-in-the-loop)
- **Cost accounting** 대리인당 토큰 예산
- **Observability**                                                                                                                                                                                                                                                              

모든 것이 원시적인 것 위에 구현될 수 있습니다. 그들 중 누구도 새로운 원시적인 것은 아닙니다.

```figure
a5-primitive-radar
```

## 건설 해

`code/main.py`이 방법은 Python의 150 라인에서 4개의 원자리를 구현합니다. 실제 LLM는 없습니다. 각 에이전트는 스크립트 정책이기 때문에 집중은 조정 구조에 있습니다.

파일이 수출:

- `Agent` 이름, 시스템 프롬프트, 도구, 정책 기능의 데이터 클래스.
- `Handoff` 새로운 에이전트를 반환하는 함수
- `SharedState` 스레드 안전 메시지 풀
- `Orchestrator` 3가지 변종:`StaticOrchestrator``HandoffOrchestrator``LLMSelectorOrchestrator`(시뮬레이션)

데모는 세 가지 오케스트레이터 유형을 모두 통해 동일한 세 가지 에이전트 파이프라인을 실행하고 끝에서 메시지 풀을 인쇄합니다. 출력량은 다음을 선택하는 사람에서만 다르다는 것을 알 수 있습니다. 에이전트 및 공유 상태는 실행 중 동일합니다.

실행하세요:

```
python3 code/main.py
```

예상 출력: 3 개의 오케스트레이터 실행, 패턴마다 1 개. 각이 최종 메시지 풀을 인쇄합니다. 전달으로 운반되는 실행은 연구자가 일찍 수행하기로 결정하면 적은 에이전트에 도달합니다.

## 사용 하 고

`outputs/skill-primitive-mapper.md`다중 에이전트 코드베이스 또는 프레임워크 문서를 읽고 네 원형 지도를 반환하는 기술입니다. 문서를 깊이 읽기 전에 한 문항의 이해를 얻기 위해 새로운 프레임워크 버전에서 실행하십시오.

## 선박

새로운 프레임 워크를 채택하기 전에 원시 지도를 작성하십시오. 만약 당신이 할 수 없다면, 문서가 불완전하거나 프레임 워크는 다섯 번째 원시 (당신이 보지 못한 공유 상태 맛을 확인하기 위해 희귀합니다).

아키텍처 문서에 매핑을 꽂아주세요. 새로운 팀원이 가입하면 API 문서보다 먼저 매핑을 보내주세요. 프레임워크 버전이 변경되면 매핑이 달라지지만 변경록이 아닙니다.

## 운동

1. 달아`code/main.py`다른 에이전트 정책과 함께 3번이나 진행합니다.
2. 네 번째 오케스트레이터 타입을 구현하세요. 요원들의 투표가 어떤 일을 하는지에 대한 공통적인 의견이 있는 줄을 따라 움직이는 방식이죠. 어떤 정지장이 일어날 수 있고, 어떻게 그것을 감지할 수 있을까요?
3. LangGraph 스피드스타트를 이용하세요 (https://docs.langchain.com/oss/python/langgraph/workflows-agents랭그그래프의 추상 지도 1:1에서 어느 쪽이 편리함 팩러인가?
4. OpenAI 스파임 요리책 (https://developers.openai.com/cookbook/examples/orchestrating_agents). 스와름이 가장 ergonomic하고, 호출자에게 밀어주는 네 원시 중 어느 것을 식별하십시오.
5. 이 테이블에서 공유 상태를 완전히 숨기는 한 프레임워크를 찾아라.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | "An LLM with tools" | A `(system_prompt, tools, model)` triple. Stateless. |
| Handoff | "Transfer of control" | A structured call that names the next agent and optional payload. Three implementations: function return, graph edge, speaker selection. |
| Shared state | "Memory" / "context" | The only stateful part of a multi-agent system. Message pool or blackboard. |
| Orchestrator | "Coordinator" | Whoever decides who runs next. Static graph, LLM selector, handoff-driven, or queue-driven. |
| Primitive | "Abstraction" | One of the four axes every framework parameterizes. Not a framework feature. |
| Message pool | "Shared chat history" | Full-history shared state. Easy to reason about, scales badly. |
| Projected state | "Scoped view" | Role-specific view into shared state. Scales, requires schema design. |
| Speaker selection | "Who talks next" | Orchestrator pattern where a function (often an LLM) picks the next agent from a group. |

## 더 많은 읽기

- [OpenAI cookbook: Orchestrating Agents — Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents)                         
- [AutoGen stable docs](https://microsoft.github.io/autogen/stable/) 그룹채트 + 스피커 선택은 LLM에서 선택된 오케스트라에 대한 참조입니다
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 그래프 가장자리 오케스트라 및 리디저 기반 공유 상태
- [CrewAI introduction](https://docs.crewai.com/en/introduction) 역할 목표 배경 이야기 요인, 순서적 / 계층적 과정
- [AG2 (community AutoGen continuation)](https://github.com/ag2ai/ag2) 마이크로소프트가 v0.4를 유지보수로 옮긴 후 라이브 오토겐 v0.2 라인
