#  국적 없는 오케스트라

> 오픈아이의 스와임 (2024년 10월) 은 두 가지 원시적인 다중 에이전트 오케스트레이션을 원조화했습니다.**routines**(시스템 명령어로서 지침 + 도구) 및 **handoffs**(다른 에이전트를 돌려주는 도구) 국가 기계, DSL를 분할하지 않습니다. 오픈아이 에이전트 SDK (2025년 3월) 는 생산 후계자입니다. 스 swarm 자체는 가장 깨끗한 개념적 참조입니다 패턴은 API 표면이 대략 "agent = prompt + tools; handoff = function returning agent"이기 때문에 바이러스성입니다. 제한: 무국적, 그래서 메모리는 호출자의 문제입니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## 문제

모든 멀티 에이전트 프레임워크는 당신이 자신의 DSL를 배우고 싶어합니다. 랭그그래프 노드와 가장자리, 크루아이 팀과 작업, 오토겐 그룹 채팅 및 관리자. DSL는 실제 추상화이지만, 그들은 그것이 필요 이상으로 무거운 것을 느끼게합니다.

스 swarm는 반대 방향으로 밀어붙인다. 모델이 이미 가지고 있는 도구 호출 기능을 사용한다. 전달은 도구 호출이 된다. 오케스트레이터는 현재 대화를 진행하는 에이전트입니다. 상태 기계는 에이전트의 시스템 명령에 임시입니다.

## 개념

### 두 원시

**Routine.**에이전트의 역할과 사용할 수 있는 도구를 정의하는 시스템 명령어. "당신은 배상 에이전트입니다. 사용자가 환불에 대해 묻는다면 환불 에이전트에 넘겨주세요".

**Handoff.**에이전트가 호출할 수 있는 도구로 새로운 에이전트 객체를 반환합니다. 스파람 실행 시간은 에이전트 반환 값을 감지하고 다음 회전으로 활성 에이전트를 전환합니다.

이것이 전체 추상입니다.

```
def transfer_to_refunds():
    return refund_agent  # Swarm sees Agent return → switch active agent

triage_agent = Agent(
    name="triage",
    instructions="Route the user to the right specialist.",
    functions=[transfer_to_refunds, transfer_to_sales, transfer_to_support],
)
```

트리저 에이전트의 시스템 명령은 사용자 메시지에 따라 올바른 전달을 선택하도록 합니다. LLM의 도구 호출은 라우팅을 수행합니다.

### 왜 바이러스적 인 이유

- **Small API.**두 가지 개념이 배워야 합니다.
- **Uses what the model already does.**도구 호출은 이미 공급자 간 생산 수준입니다.
- **No state-machine burden.**그래프를 설명하지 않고, 에이전트의 명령은 그들이 누구에게 넘겨주는지 설명합니다.

### 국적 없는 무역

스 swarm는 실행 중이면서 명시적으로 무국립합니다. 프레임워크는 실행 중 메시지 역사를 유지하지만 아무것도 지속하지 않습니다. 메모리, 연속성, 장기 실행 작업은 호출자의 모든 문제입니다.

생산 (OpenAI Agents SDK, 2025년 3월) 에서 이것은 변화된 주요 요소 중 하나였습니다. SDK는 내장된 세션 관리, 경비 및 추적을 추가하면서 전달이 원시적입니다.

### 스와임/만드프가 잘 어울릴 때

- **Triage patterns.**전선 요원이 전문가를 안내합니다.
- **Skill-based handoffs.**"사업에 코드가 필요한 경우 코더를 불러; 연구가 필요한 경우 연구자를 불러".
- **Short, bounded conversations.**고객 지원, FAQ-to-ticket, 간단한 작업 흐름

### 스와임이 투쟁할 때

- **Long sessions with shared memory.**매개체들은 대화 상태를 새로운 에이전트의 프롬프트+역사에 재설정합니다.
- **Parallel execution.**핸도프는 1회에 1회  활성 에이전트 스위치입니다. 평행성은 호출자가 여러 스와르마 실행을 조정하는 것을 요구합니다.
- **Audit and replay.**국적 없는 경기는 정확히 재생하기 어렵다. LLM의 선택은 결정적이지 않습니다.

### 오픈아이 에이전트 SDK (2025년 3월)

생산 후속자는 다음과 같이 덧붙인다.

- **Session state.**을 가로지르는 끈이 계속됩니다.
- **Guardrails.**입력/출력 검증 해킹
- **Tracing.**모든 도구 통화와 전달은 기록되어 있습니다.
- **Handoff filters.**어떤 컨텍스트가 전달되는지 통제하세요.

이 원시적인 가공은 살아남아, 생산 에르고노미는 그 주위에 추가됩니다.

### 스와르크 vs 그룹 채팅

둘 다 LLM를 이용한 라우팅을 사용하지만,**who picks next**이 부분의 본문은

- 그룹 채팅: 선택자 (역사 또는 LLM) 는 외부에서 다음 스피커를 선택합니다.
- 스 swarm: 현재 에이전트는 후계자를 선택하여

스와름은 "대리인이 다음을 결정한다"; 그룹채트는 "관리자는 다음을 결정한다". 스와름의 결정은 활성 에이전트의 도구 호출에 달려있다; 그룹채트는 `GroupChatManager`- 그래

```figure
sw-handoff-routing
```

## 건설 해

`code/main.py`스파르크를 처음부터 구현합니다. 에이전트 데이터 클래스, 전달 메커니즘 (툴은 에이전트를 반환합니다) 및 에이전트 스위치를 감지하는 실행 루프.

데모: 배상, 판매 또는 지원 전문가를 위한 분류 에이전트 경로. 각 전문가는 자신의 도구를 가지고 있습니다. 실행 루프는 모든 전달을 인쇄합니다.

실행:

```
python3 code/main.py
```

## 사용 하 고

`outputs/skill-handoff-designer.md`주어진 작업에 대한 전달 토폴로지를 설계합니다. 어떤 에이전트가 존재하는지, 어떤 전달을 호출할 수 있는지, 어떤 맥락이 전송되는지.

## 선박

체크리스트:

- **Handoff logging.**모든 전달은 에이전트에서 에이전트까지의 컨텍스트 스냅샷을 가지고 추적 이벤트를 작성합니다.
- **Context transfer rules.**전달에 따라 어떤 것이 움직인다고 결정하세요: 전체 역사 (비용이 높다), 마지막 N 메시지, 또는 요약.
- **Guardrail on handoff.**다른 도구 권한이 있는 전문인력에게 전달하는 것은 인증되어야 합니다.
- **Loop detection.**앞뒤로 2개의 에이전트가 전달되는 것은 일반적인 실패입니다. 간단한 마지막 K 링 체크로 감지합니다.
- **Fallback agent.**만약 전달 대상이 존재하지 않는다면, 안전장치로 돌아가십시오.

## 운동

1. 달아`code/main.py`2회 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동 중동
2. 루프 탐지 규칙을 추가하십시오. 같은 두 대원이 연속 3 번 배역을 한 경우, 출구를 강요합니다.
3. 랜더프 필터에 대한 OpenAI 에이전트 SDK 문서를 읽어보십시오. "랜더프에 대한 요약" 버전을 구현하십시오. 출력 에이전트는 출입 에이전트가 업무를 맡기 전에 컨텍스트를 총알 요약으로 압축합니다.
4. 스와르름의 전달을 그룹 채팅 관리자 선택기와 비교해보세요. 어떤 패턴이 즉각적인 주사를 더 악화시키죠? 왜요?
5. 스파임 요리책 (https://developers.openai.com/cookbook/examples/orchestrating_agents). 한 가지 명시적인 설계 결정을 확인합니다. Swarm는 OpenAI 에이전트 SDK를 변경하거나 유지하도록 합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Routine | "The agent prompt" | System prompt + tool list. Defines role and available handoffs. |
| Handoff | "Transfer to another agent" | A tool the active agent can call that returns a new Agent. The runtime switches active agent. |
| Stateless | "No memory between runs" | Swarm does not persist anything; memory is the caller's responsibility. |
| Active agent | "Who's speaking now" | The agent currently holding the conversation. Handoff changes this. |
| Context transfer | "What moves on handoff" | Policy for what history the incoming agent sees: full, last N, or summarized. |
| Handoff loop | "Agents ping-pong" | Failure mode where two agents keep handing back to each other. |
| OpenAI Agents SDK | "Production Swarm" | March 2025 successor; adds sessions, guardrails, tracing on top of the handoff primitive. |
| Handoff filter | "Gate on transfer" | SDK feature to inspect and modify context at the handoff boundary. |

## 더 많은 읽기

- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) 참조 문구
- [OpenAI Swarm repo](https://github.com/openai/swarm) 본래 실시, 개념적 참조로 보관
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 세션 및 추적을 가진 생산 후속
- [Anthropic handoff-in-Claude notes](https://docs.anthropic.com/en/docs/claude-code) 클로드 코드 서바겐트가 어떻게 `Task`
