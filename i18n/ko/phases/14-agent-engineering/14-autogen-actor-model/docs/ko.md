# 에이전트들의 배우 모델  아싱크 메시지 및 타입 실행 시간

> 에이전트 역할: 비시ync 메시지 교환, 이벤트 기반 처리, 오류 고립, 자연 동시성. 오토 제인 v0.4 (마이크로소프트 리서치, 2025년 1월) 는 이 모델을 중심으로 에이전트 오케스트레이션을 재설계했으며, 프레임워크는 현재 유지보수 모드이며, 마이크로소프트 에이전트 프레임워크 (공공중 미리보기 2025년 10월) 는 생산 후계자입니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~75 minutes

## 학습 목표

- 배우 모델: 에이전트들이 배우로서, 메시지는 유일한 IPC로서, 배우당 실패 고립
- AutoGen v0.4의 3개의 API 계층을 이름 붙여주세요.
- 왜 처리로부터 메시지를 전달하는 것을 분리하는 것이 오류 고립과 자연스러운 동시성을 주는지를 설명해 주십시오.
- 파이썬에서 stdlib 배우 실행 시간을 구현하고 2 대원 코드 리뷰 흐름을 이쪽으로 포트하십시오.

## 문제

대부분의 에이전트 프레임워크는 동기화됩니다. 한 에이전트가 생산하고 한 에이전트가 소비합니다. 호출 스택에서 실패합니다. 동행이 작동합니다. 배포는 다시 작성해야합니다.

AutoGen v0.4의 대답은: 배우 모델. 각 에이전트는 개인 수신 상자를 가진 배우입니다. 메시지는 유일한 상호 작용입니다. 런타임은 처리로부터 배달을 분리합니다. 실패는 한 배우로 고립됩니다. 경쟁은 원산적입니다. 배포는 다른 운송입니다.

## 개념

### 배우

배우는

- 개인 국가 (외로부터 직접 접촉한 적이 없다).
- 수신함 (메신저 대기열)
- 관리자:`receive(message) -> effects`"응답"을 하고, "다른 배우에게 보내" "새로운 배우를 낳고, "현재 상태를" "자신을 멈추고"

두 배우는 기억을 공유할 수 없습니다. 그들은 메시지를 보낼 수 있습니다.

### 3개의 API 계층

AutoGen v0.4은 표면을 세 부분으로 나눈다.

1. **Core.**낮은 수준의 배우 프레임워크. `AgentRuntime``Agent``Message``Topic`- 무작정 메시지 교환, 이벤트 기반
2. **AgentChat.**작업 기반 고급 API (v0.2의 컨버서블 에이전트의 대체) `AssistantAgent``UserProxyAgent``RoundRobinGroupChat``SelectorGroupChat`- 그래
3. **Extensions.**통합  OpenAI, 인류학, 아저, 도구, 메모리.

### 왜 분리 가 중요 한 이유

v0.2 모델에서, 호출`agent_a.chat(agent_b)`A인터넷이 다시 돌아오는 동안 A인터넷이 동시적으로 차단됩니다.`send(agent_b, msg)`메세지를 에이전트_b의 인박스에 넣고 반환합니다. 실행 시간은 나중에 전달됩니다. 세 가지 결과는:

- **Fault isolation.**B 요원이 충돌하지 않습니다 A 요원이  런타임은 B의 핸들러에서 실패를 발견하고 무엇을 해야할지 결정합니다 (log, 재시험, dead-letter).
- **Natural concurrency.**여러 메시지가 동시에 비행중이며, 배우들은 동시에 우편 상자를 처리합니다.
- **Distribution-ready.**수신함 + 운송은 배우가 진행 중이든 다른 호스트에서든 동일한 추상입니다.

### 토폴로지

- **RoundRobinGroupChat.**요원들은 일정 순환으로 순차적으로 돌고 있습니다.
- **SelectorGroupChat.**선택 에이전트는 대화 맥락에 따라 다음을 선택합니다.
- **Magentic-One.**웹 브라우징, 코드 실행, 파일 처리, AgentChat에 기반한

### 관찰 가능

오픈텔레메트리 지원이 내장되어 있습니다. 모든 메시지는 기간을 방출하고, 도구 호출은 전송됩니다.`gen_ai.*`2026 OTel GenAI의 의미 협약에 따른 속성 (강좌 23)

### 상태: 유지보수 방식

2026년 초: 오토겐 v0.7.x는 연구 및 프로토타입 제작에 안정적입니다. 마이크로소프트는 생산 후계인 마이크로소프트 에이전트 프레임워크로 활발한 개발을 옮겼다 (공공 공개 미리보기 2025년 10월 1일; 1.0 GA는 2026년 1분말에 목표로 한다).

```figure
actor-mailbox
```

## 건설 해

`code/main.py`STDlib 배우 실행 시간을 구현합니다:

- `Message`  `sender``recipient``topic``body`- 그래
- `Actor` 추상 `receive(message, runtime)`- 그래
- `Runtime` 공유된 줄을, 배달, 실패 고립을 가진 이벤트 루프.
- 두 배우의 데모:`ReviewerAgent`리뷰 코드, `ChecklistAgent`체크리스트를 운영하고, 합의까지 메시지를 주고받습니다.

실행하세요:

```
python3 code/main.py
```

추적은 메시지 전달, 다른 배우를 충돌시키지 않는 한 배우의 시뮬레이션 실패와 공유된 판결에 대한 공감대를 보여줍니다.

## 사용 하 고

- **AutoGen v0.4/v0.7**연구, 프로토타입 제작, 다중 요원 패턴에 안정적인
- **Microsoft Agent Framework** 제작 후속 (공공 공개 개봉 2025년 10월); 동일한 배우 모델 아이디어가 업데이트된 API에 포함되어 있습니다.
- **LangGraph swarm topology**(강습 13)  공유 도구 를 통해 비슷한 패턴 을 사용 합니다.
- **Custom actor runtime** 특정 운송 (NATS, RabbitMQ, gRPC) 을 필요로 하는 경우

## 선박

`outputs/skill-actor-runtime.md`주어진 멀티 에이전트 작업에 대해 최소 배우 실행 시간을 추가하여 팀 템플릿 (RoundRobin 또는 Selector) 을 생성합니다.

## 운동

1. 죽은 글자를 잇는 줄을 추가하세요. 핸들러가 잇는 순간, 실패한 메시지를 인간 검사로 주차하세요. DLQ가 장난감에 얼마나 자주 타격을 받나요?
2. 시행`SelectorGroupChat`: 선택 행위자는 대화 상태에 따라 다음 메시지를 처리하는 사람을 선택합니다.
3. 분산 운송을 추가: 프로세스 중인 줄을 JSON-over-HTTP 서버로 교환하여 배우가 별도의 프로세스에서 실행할 수 있습니다.
4. 메시지에 OTel 스탠드를 전송 (또는 No-op 스탠드인)`gen_ai.agent.name``gen_ai.operation.name`23학습에 따라
5. 오토제인 v0.4의 아키텍처 포스트를 읽어보세요. 장난감을 실제로 옮기세요.`autogen_core`제작에서 중요한 것은 뭘 놓쳤어?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Actor | "Agent" | Private state + inbox + handler; no shared memory |
| Message | "Event" | Typed payload; the only way actors interact |
| Inbox | "Mailbox" | Per-actor queue of pending messages |
| Runtime | "Agent host" | Event loop that routes messages and isolates failures |
| Topic | "Channel" | Named publish-subscribe route between actors |
| Fault isolation | "Let it crash" | One actor failing does not crash others |
| RoundRobinGroupChat | "Fixed-rotation team" | Agents take turns in order |
| SelectorGroupChat | "Context-routed team" | Selector picks who goes next |
| Magentic-One | "Reference team" | Multi-agent squad for web + code + files |

## 더 많은 읽기

- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) 재설계 포스트
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) 그래프 모양의 대안
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) Autogen이 기본적으로 방출하는  랜즈
