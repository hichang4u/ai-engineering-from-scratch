# 오케스트레이션 패턴: 감독, 스 swarm, 계층

> 2026 프레임워크에서 4가지 오케스트레이션 패턴이 반복됩니다. 감독-노동자, 무대/평균, 계층적, 토론. 인류학의 지침: "당신의 필요에 맞는 올바른 시스템을 구축하는 것"입니다. 간단한 시작으로; 단일 에이전트와 5개의 워크플로우 패턴이 충분하지 않을 때만 토폴로지 추가하십시오.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12 (Workflow Patterns), Phase 14 · 25 (Multi-Agent Debate)
**Time:** ~60 minutes

## 학습 목표

- 반복되는 네 가지 오케스트라 패턴과 각각의 적절한 시기를 명명 하십시오.
- 2026년 랭체인 추천을 설명하라: 도구 기반의 감독과 감독 라이브러리
- 인류학의 "옳은 시스템을 구축하라" 규칙과 토폴로지 선택에 어떻게 대응하는지 설명해 주세요.
- 4가지의 경우 모두 STDlib에 적용하여 일반적인 LLM에 적용한다.

## 문제

팀들은 "다중 대리자"를 필요로 하기 전에 찾아내기 위해 노력합니다. 네 가지 패턴은 프레임워크에서 반복됩니다. 일단 이름을 지정하면 올바른 을 선택할 수 있습니다. 또는 전체적으로 토폴로지를 건너뛰습니다.

## 개념

### 감독자-노동자

- 중앙 라우팅 LLM는 전문 에이전트에 전송됩니다.
- 스스로에게 돌아서 전문가에게 넘겨서 끝낼 수 있습니다.
- 전문가들은 서로 대화하지 않고 모든 라우팅은 감독자를 통해 진행됩니다.

프레임워크: 랭그라프 `create_supervisor`, 인류 오케스트레이터-노동자, CrewAI Hierarchical Process

**2026 LangChain recommendation:**직접적인 도구 호출을 통해 감독을 수행하기 보다는`create_supervisor`. 더 나은 컨텍스트 엔지니어링 제어를 제공합니다.

### 스파임 / 피어-투-피어

- 에이전트는 공유 도구 표면을 통해 직접 전달합니다.
- 중앙 라우터도 없죠
- 감독보다 낮은 지연시간 (하루가 줄어들)
- (통제점도 없다)

프레임워크: 랭그라프 스와름 토폴로지, 오픈AI 에이전트 SDK 전달 (모든 에이전트가 다른 모든 사람에게 전달할 수 있는 경우).

### 계층적

- 관리하는 감독자, 직원을 관리하는 부 감독자
- 랭그라프에서 둥지를 틀어 놓은 서브그래프로 구현; CrewAI에서 둥지를 틀어 놓은 승무원
- 운영 복잡성의 비용으로 대대적인 대원 인구에 대한 규모.

필요한 경우: 하나의 감독자의 컨텍스트 예산에서 모든 전문가를 설명할 수 없는 경우

### 토론

- 병렬 제안자 + 반복적 십계 비판 (강좌 25).
- 실제로 오케스트레이션이 아니라 더 많은 검증이 있지만 프레임워크에서 토폴로직 선택으로 나타납니다.

### 자율적인 승무원 vs 결정적 흐름

크루아이 (CrewAI) 는 두 가지 배치 방식을 공식화합니다.

- **Flow**결정적인 이벤트 기반 자동화 (생산의 권장 출발점)
- **Crew**자율적인 역할 기반 협업을 위한

이것은 위의 네 가지 패턴과 정렬하지만 토폴로지 지도입니다. 흐름은 일반적으로 감독자 또는 계층적입니다. 승무원은 일반적으로 LLM 라우터와 함께 감독자입니다.

### 인류학의 지침

"LLM 분야에서 성공하는 것은 가장 정교한 시스템을 만드는 것이 아니라, 당신의 필요에 맞는 시스템을 만드는 것입니다".

결정 순서:

1. 단일 에이전트 + 작업 흐름 패턴 (강좌 12)
2. 감독-노동자  2-4명의 전문가가 있을 때
3.                         
4. 위계층  감독의 컨텍스트 예산이 실패할 때만.
5. 정확한 것이 비용보다 중요할 때 토론

### 이 패턴이 잘못되는 곳

- **Topology-first thinking.**"우리는 멀티 에이전트가 필요합니다".
- **Bouncing handoffs in swarm.**A -> B -> A -> B. 홉 카운터를 사용하세요.
- **Fake hierarchy.**3층은 기업으로 2개의 팀으로 붕괴

```figure
orchestration-pattern
```

## 건설 해

`code/main.py`스크립트 된 LLM에 대한 stdlib에서 네 가지 패턴을 구현합니다:

- `Supervisor` 중앙 라우터
- `Swarm` 직접적인 전달을 통해 짝ချင်း
- `Hierarchical` 감독자의 감독자
- `Debate` 평행 제안 + 비판

각 패턴은 동일한 세 가지 목적 작업 (회환 / 버그 / 판매) 을 처리합니다.

실행하세요:

```
python3 code/main.py
```

출력: 패턴별 추적 + 시술 수. 감독은 가장 깨끗하고, 무리가 가장 짧고, 계층적은 가장 깊고, 토론은 가장 비싸다.

## 사용 하 고

- **LangGraph**감독 및 계층 (가장된 하위 그래프)
- **OpenAI Agents SDK**도구로 전달하는 (감독 모양)
- **CrewAI Flow**생산 결정론을 위한
- **Custom**논쟁을 위해 또는 정확한 통제를 원하는 경우.

## 선박

`outputs/skill-orchestration-picker.md`토폴로지를 선택하고 실행합니다.

## 운동

1. 라우터를 제거해서 감독을 하는 직원을 무더기로 바꾸면, 무엇이 깨지고, 무엇이 개선되는가?
2. 3번의 반납 후 반납을 하는  카운터를 더해 주세요. A->B->A를 반납하는 것을 잡을 수 있나요?
3. 12개 전문 분야에 대해 2단계 계층적 시스템을 구축합니다.
4. 생산형 작업량에 대한 네 가지 패턴을 프로파일하십시오. 어느 메트릭 (연체성, 비용, 정확성, 디버깅 가능성) 에서 승리합니까?
5. 앤트로피크의 "건설 효과적 요인" 포스트를 읽어 보세요. 네 가지 생산 흐름 중 하나에 대한 지도를 매핑하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor-worker | "Router + specialists" | Central LLM dispatches to specialists; they don't talk to each other |
| Swarm | "Peer-to-peer" | Direct handoffs via shared tools; no central router |
| Hierarchical | "Supervisors of supervisors" | Nested subgraphs for large populations |
| Debate | "Proposer + critique" | Parallel proposers, cross-critique (Lesson 25) |
| Tool-call-based supervision | "Supervisor without a library" | Implement supervisor as direct tool calls for context control |
| Crew | "Autonomous team" | CrewAI's role-based collaboration mode |
| Flow | "Deterministic workflow" | CrewAI's event-driven production mode |

## 더 많은 읽기

- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 5가지 패턴 + 에이전트 vs 워크플로우
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) 감독자, 무대, 계층
- [CrewAI docs](https://docs.crewai.com/en/introduction) 승무원 vs 흐름
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) 토론 패턴
