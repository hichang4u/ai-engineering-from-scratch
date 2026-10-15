# 그룹 채팅 및 스피커 선택

> 공유 대화 오케스트레이션은 N 에이전트를 하나의 대화에 넣고, 선택 기능 (LLM, 롤-로빈, 또는 커스터마이징) 는 다음 연설자를 선택합니다. 이것은 등장하는 다중 에이전트 대화의 원형입니다. 에이전트는 정적 그래프에서 자신의 역할을 알지 못하고, 공유된 풀에 반응합니다. AutoGen GroupChat과 AG2 GroupChat은 참조 구현입니다. AutoGen v0.2의 GroupChat 의미론은 AG2 포크에 보존되었다. AutoGen v0.4는 이벤트 중심의 배우 모델로 다시 작성했습니다. 마이크로소프트는 2026년 2월 AutoGen을 유지보수 모드로 배치하고, 세맨틱 커널과 Microsoft 에이전트 프레임워크 (RC 2026년 2월) 에 통합했다. 그룹채트 원시기는 AG2와 마이크로소프트 에이전트 프레임워크에서 살아남습니다. 한번 배워서 어디서나 사용하세요.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## 문제

정적 그래프 (LangGraph) 는 작업 흐름이 알려져 있을 때 훌륭합니다. 실제 대화는 정적하지 않습니다. 때때로 코더는 평가를, 때로는 연구자, 때로는 작가를 요청합니다. 가능한 모든 전달을 하드코딩하면 가장자리 폭발을 발생시킵니다. 당신은 * 에이전트가 공유 풀에 반응하기를 원합니다*, 어떤 기능이 다음으로 누가 말하는지 결정합니다.

바로 이것이 바로 AutoGen GroupChat이 하는 일입니다.

## 개념

### 형태

```
              ┌─── shared pool ────┐
              │   m1  m2  m3  ...  │
              └─────────┬──────────┘
                        │ (everyone reads all)
      ┌───────┬─────────┼─────────┬───────┐
      ▼       ▼         ▼         ▼       ▼
    Agent A  Agent B  Agent C  Agent D  Selector
                                           │
                                           ▼
                                  "next speaker = C"
```

모든 에이전트는 모든 메시지를 보고, 선택기능이 각 회전에서 호출되어 다음으로 말하는 사람을 선택합니다.

### 세 가지 선택자 맛

**Round-robin.**고정된 주기는 결정적 이다. 선형적으로 N에서 확장하지만 맥락을 무시합니다. 코더는 주제가 법적 검토일 때에도 차례를 얻습니다.

**LLM-selected.**최근 풀을 읽고 다음 최고의 스피커를 반환하는 LLM에 대한 호출. 맥락을 인식하지만 느리죠. 매 차례에 LLM 호출을 추가합니다. 오토제인의 기본입니다.

**Custom.**파이썬 함수는 원하는 논리로 됩니다. 전형적인 경우: Fallback 규칙으로 LLM를 선택합니다 (예를 들어, "항상 검증자에게 코더를 따라 번을 주십시오").

### 컨버서블 에이전트 API

```
agent = ConversableAgent(
    name="coder",
    system_message="You write Python.",
    llm_config={...},
)
chat = GroupChat(agents=[coder, reviewer, tester], messages=[])
manager = GroupChatManager(groupchat=chat, llm_config={...})
```

`GroupChatManager`선택자를 유지합니다. 에이전트가 회전을 완료하면 관리자는 선택자를 호출합니다.

### 해체

세 가지 일반적인 패턴:

- **Max rounds.**전체 회전에서 단단한 캡
- **"TERMINATE" token.**요원들은 경비자를 보내게 될 수도 있고, 관리자가 나타나면 멈춰야 합니다.
- **Goal-reached check.**가벼운 검증기는 각 회전을 실행하고 끝나는 채팅을 멈추게 합니다.

### 혈통: 포크 및 합병

2025년 초, 마이크로소프트는 이벤트 기반의 배우 모델을 중심으로 오토겐 (v0.4) 의 주요 재편을 시작했습니다. 커뮤니티는 오토겐 v0.2의 그룹채팅 의미론을 AG2로 포크했습니다. 초기 도입자들이 통합한 API를 보존했습니다.

2026년 2월, 마이크로소프트는 오토겐이 유지보수 모드로 전환될 것이라고 발표했고, 이벤트 기반의 배우 모델이 융합되어**Microsoft Agent Framework**(RC 2 월 2026, 현재 Semantic Kernel와 통합되었다). 그룹채트 개념은 두 트랙에서 살아남습니다. 구현 세부 사항은 다릅니다. AG2는 v0.2 호환성 코드에서 선호하는 상류입니다.

### 그룹채팅이 잘 되면

- **Emergent conversations.**다음 스피커를 미리 연결하고 싶지 않습니다.
- **Role-mixing tasks.**코더는 연구자에게, 연구자는 기록자에게, 기록자는 코드에게 다시 요청합니다. 흐름은 DAG가 아닙니다.
- **Exploratory problem-solving.**"brainstorm meeting"라고 생각하세요. "assembly line"이 아니라

### 실패할 때

- **Strict determinism.**LLM 선택자는 일관성이 떨어질 수 있습니다. 같은 시음, 다른 실행, 다른 다음 스피커.
- **Sycophancy cascades.**에이전트들은 가장 자신있게 말을 한 사람에게서
- **Context bloat.**모든 에이전트는 모든 메시지를 읽습니다. 10회 뒤에는 맥락이 엄청납니다.
- **Hot speakers.**한 대리인이 대화에 지배적 인 이유는 선택자가 특성을 선호하기 때문입니다.

### 그룹 채팅과 감독

동일한 원시형, 다른 기본:

- 감독: 한 에이전트가 계획을 세우고 다른 사람은 실행한다. 선택자는 "계획자에게 무엇을 해야 할지 물어보십시오".
- 그룹 채팅: 모든 에이전트는 동료; 선택자는 공유 풀에 대한 기능입니다.

두 사람은 모두 레슨 04에서 네 가지 원시법을 사용합니다. 그룹 채팅은 LLM에서 선택된 오케스트라 및 풀 풀 공유 상태로 기본으로 설정됩니다.

```figure
swarm-speaker
```

## 건설 해

`code/main.py`stdlib에서 GroupChat을 처음부터 구현합니다. 세 명의 에이전트 (코더, 리뷰어, 매니저), 라운드 로빈 및 LLM- 선택 된 변종, 그리고 종료`TERMINATE`토큰

데모는 대화 표본과 선택자의 결정 추적을 두 변종에 인쇄합니다.

실행:

```
python3 code/main.py
```

## 사용 하 고

`outputs/skill-groupchat-selector.md`주어진 작업에 대한 GroupChat 선택자를 구성합니다  라운드-로빈 vs LLM 선택 vs 사용자 지정, 그리고 선택자의 입력 (최근 메시지, 에이전트 특성, 턴 카운트) 를 사용해야 합니다.

## 선박

체크리스트:

- **Max rounds cap.**보통 작업에 10-20번 정도
- **Speaker-balance metric.**매개체별로 트랙 회전; 불균형이 임계점을 초과할 때 경보
- **Termination token.** `TERMINATE`또는 특별 검증기.
- **Projection or scoped memory.**~ 10개의 메시지가 끝난 후, 각 에이전트에 단지 범위의 시각만 제공하여 컨텍스트 부풀이를 방지하는 것을 고려하십시오.
- **Selector logging.**LLM 선택된 변종에 대해서는 선택자의 입력과 선택 모두 기록하십시오. 그렇지 않으면 디버깅이 불가능합니다.

## 운동

1. 달아`code/main.py`론드 로빈과 LLM 선발자 사이의 대화를 비교해 보세요. 어느 에이전트가 각각 지배적인가?
2. 선택기에는 "대상위원당 최고가 말하는 것" 규칙이 추가됩니다. 이 규칙은 기록에 어떤 영향을 미치나요?
3. 목표에 도달한 종료를 실행: 검토자가 " 승인"을 반환하면 중지하십시오.
4. GroupChat에서 AutoGen 안정 문서들을 읽어보세요 (https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html). 에서 사용하는 기본 선택자를 식별합니다.`GroupChatManager`- 그래
5. AG2 repo를 읽어보세요 (https://github.com/ag2ai/ag2v0.4는 어떤 구체적인 성질을 (출력, 결함 용납성, 컴포지बिल리티) 추가합니다?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GroupChat | "Agents in one chat room" | Shared message pool + selector function. AutoGen / AG2 primitive. |
| Speaker selection | "Who talks next" | The function that picks the next agent. Round-robin, LLM-selected, or custom. |
| GroupChatManager | "The meeting host" | AutoGen component that owns the selector and loops over turns. |
| ConversableAgent | "The base agent" | AutoGen base class; an agent that can send and receive messages. |
| Termination token | "The 'stop' word" | Sentinel string (usually `TERMINATE`) that ends the chat. |
| Hot speaker | "One agent dominates" | Failure mode where the selector keeps picking the same agent. |
| Context bloat | "Pool grows unbounded" | Each agent reads every prior message; context grows with turns. |
| Projection | "Scoped view" | Role-specific view into the shared pool to prevent context bloat. |

## 더 많은 읽기

- [AutoGen group chat docs](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html) 참조 실시
- [AG2 repo](https://github.com/ag2ai/ag2) 커뮤니티 오토겐 v0.2 계속
- [Microsoft Agent Framework docs](https://learn.microsoft.com/en-us/agent-framework/) 합병 후계자, RC 2026년 2월
- [AutoGen v0.4 release notes](https://microsoft.github.io/autogen/stable/) 이벤트 기반 배우 모델 재편
