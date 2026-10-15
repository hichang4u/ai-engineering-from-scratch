# 계층적 건축물 과 그 실패 방식

> 위주층은 감독자, 관리자, 부 관리자, 직원이 있습니다.`Process.hierarchical`교과서 버전: a `manager_llm`랑그라프 대칭은 `create_supervisor(create_supervisor(...))`. 작업이 실제 조직표가 될 때 자연스러운 패턴입니다. 또한 관리적 루프로 붕괴될 가능성이 가장 높은 패턴입니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 05 (Supervisor Pattern)
**Time:** ~60 minutes

## 문제

감독 패턴을 클릭하면 다음 단계의 자연스러운 단계는 "노동자들이 스스로 감독자라면 어떨까요?" 팀들은 하위 팀, 회사들은 부서 부처를 가지고 있습니다. 계층 구조는 그것을 반영합니다.

문제는 LLM 관리자는 인간 관리자와 동일하지 않습니다. 인간 관리자는 자신의 보고서에 대해 안정적인 전적을 가지고 있습니다. LLM 관리자는 그 맥락에서 어떤 상황에서도 조직을 재설계합니다. 그 맥락에서 작은 파동이 발생하고 전체 나무는 일을 잘못 배분합니다.

## 개념

### 형태

```
                 Manager
                 ┌─────┐
                 └──┬──┘
           ┌────────┴────────┐
           ▼                 ▼
       Sub-Mgr A         Sub-Mgr B
       ┌─────┐           ┌─────┐
       └──┬──┘           └──┬──┘
         ┌┴──┬──┐          ┌┴──┐
         ▼   ▼  ▼          ▼   ▼
       W1  W2  W3         W4  W5
```

모든 내부 노드는 계획, 배임, 합성합니다.

### 빛나는 곳

- **Clear org mapping.**실제 작업이 부서적이라면 ("법적 검토 문서, 금융 검토 문서, 엔지니어링 검토 문서, 그리고 exec를 요약"), hierarchy는 명시적입니다.
- **Local summarization.**각 하위 관리자는 최고 관리자가 보기 전에 팀의 출력을 합성합니다. 최고 관리자는 15 명의 직원 출력을 아닌 세 명의 하위 관리자 요약을 봅니다.

### 어있는 곳

2026년 포스트모르테임에서 계속 발견되는 3가지 실패 모드:

1. **Task assignment error.**관리자는 목표를 읽고 분해를 환각시키고 잘못된 하위 관리자에게 위임합니다. 하위 관리자가 주어진 것에 순종적으로 작동하기 때문에 오류는 최고 합성에서 만 나타납니다.
2. **Output misinterpretation.**하위 관리자는 "X 주장을 확인할 수 없습니다". 상위 관리자는 "X 주장은 확인되지 않았습니다".
3. **Consensus loops.**두 명의 부 관리자는 동의하지 않습니다. 최고 관리자는 그들을 조화 시키라고 요청합니다. 그들은 다시 위임합니다. 직원들은 다시 실행합니다. 부 관리자는 약간 다른 답변을 제공합니다.`Process.hierarchical`단계적 한계를 가지고 이를 방지합니다. 하지만 한계는 이제 하이퍼파라미터입니다.

### 결정적인 질문

순서적 (선형 파이프라인) 대 계층적: 당신의 작업은 실제로 독립된 하위 팀들을 가지고 있는가, 아니면 나무가 될 척 하는 한 선형 흐름인가?

### 역할 프레임워크의 구현

크루아이의`Process.hierarchical`전문 인력들을 통해 관리자 LLM를 전개합니다.

- 최고 수준의 업무를 맡고,
- 승무원에게 하위 과제를 할당합니다.
- 승무원 출력을 평가하고,
- 받아들이거나, 재배임하거나 반복할지 결정합니다.

문서: https://docs.crewai.com/en/introduction(중앙 개념에서 "위계 과정"을 검색하십시오).

### 그래프 프레임워크 구현

랭그라프 는 둥지를 틀어 `create_supervisor`내부 감독자는 자신의 그래프를 가지고 있고, 외부 감독자는 내부 그래프를 불투명한 노드로 취급한다. 이것은 디버깅을 위해 CrewAI보다 깨끗하다 (당신은 각 그래프를 개별적으로 통과할 수 있습니다), 그러나 나무의 역동적인 재구조를 표현하기 어렵다.

참고:https://reference.langchain.com/python/langgraph-supervisor.

```figure
swarm-hierarchy-token
```

## 건설 해

`code/main.py`3 레벨의 계층 순위를 운영합니다.

- 최고 관리자: "공학"과 "법" 분야로 업무를 나눈다.
- 엔지니어링 하위 관리자: "전향" 및 "후향" 노동자로 나뉘어,
- 법정 부관리자: 1명의 근로자

데모는 행복한 경로를 반대합니다 (모든 사람들이 동의합니다)**perturbed path**최고 관리자의 분해가 "법적"이라고 "금융"이라고 잘못 표시하고 오류 캐스카드를 관찰하는 경우

실행:

```
python3 code/main.py
```

출력으로 두 경로가 모두 "무엇이 요청되었는지"와 "무엇이 전달되었는지"에 따라 명확하게 표시됩니다.

## 사용 하 고

`outputs/skill-hierarchy-fitness.md`주어진 작업이 계층적, 순서적 또는 평평한 감독을 사용해야 하는지 여부를 평가합니다. 입력: 작업 설명, org 구조, 조화 예산. 출력: 특정 실패 모드를 보호해야 하는 패턴 추천.

## 선박

순위적인 배포를 하면:

- **Cap tree depth at 2.**세 레벨은 이미 대부분의 오류를 관찰가능하지 않게 숨기고 있습니다.
- **Explicit reconciliation budget.**최고 관리자가 공약하기 전에 최대 공을 세우고
- **Provenance on every synthesis.**각 노드의 요약은 어떤 잎 출력으로 생성되었는지 적어야 합니다.
- **Alert on decomposition drift.**관리자의 분해를 단계별로 기록하여 사용자 질의와 다르게 표시합니다. 분해가 더 이상 질의를 포함하지 않으면 알림을 열십시오.

## 운동

1. 달아`code/main.py`그리고 행복과 혼란스러운 비교. 최고 출력에서 사용자의 질문에서 완전히 벗어날 때까지 관리자의 수급수준이 얼마나 될까요?
2. 세 번째 레벨 (위 → 하 → 하 → 근로자) 를 추가하십시오. 방해 된 경로가 깊이가 커질수록 완전히 경각심을 가지게 되는 것과 얼마나 자주 수정되는지를 측정하십시오.
3. 각 하위 관리자 에게 "캐너리" 작업자를 구현 하여 원래 사용자 의 질문 을 항상 변경 하지 않고 묻는다. 해체 유동 을 감지 하기 위해 캐너리 답변 을 사용 한다. 캐너리 는 합성 된 답변 에 동의 하지 않을 때 관리자 는 어떻게 반응 해야 합니까?
4. 크루아이의 글을 읽어보세요`Process.hierarchical`문서: CrewAI가 적용하는 콘크리트 보호막 (단계 제한, 관리자_llm 제한) 을 확인하고 어떤 실패 모드를 대상으로 하는지 설명합니다.
5. 랭그그래프 감독자를 크루아이 계층과 비교해 보시면, 조화 루프를 더 저렴하게 감지할 수 있게 해줍니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Hierarchical | "Org chart pattern" | Supervisors over supervisors; only leaves do work. |
| Manager LLM | "The boss" | The LLM that decomposes, assigns, and validates at an internal node. |
| Decomposition drift | "The boss lost the plot" | Top manager's split no longer covers the original question. |
| Reconciliation loop | "Endless meetings" | Sub-managers disagree; top re-delegates; workers re-run; loop until budget exhausted. |
| Depth-2 ceiling | "Don't go deeper than 2 levels" | Empirical guardrail: 3+ levels collapses observability. |
| Canary question | "Ground truth at every level" | A worker that is always asked the original query unchanged, to detect drift. |
| Provenance chain | "Who said what" | Trace from each synthesis back to the leaf outputs that produced it. |

## 더 많은 읽기

- [CrewAI introduction — Process.hierarchical](https://docs.crewai.com/en/introduction) 관리자 LLM와 교과서 계층
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor)       `create_supervisor`
- [Anthropic engineering — Research system](https://www.anthropic.com/engineering/multi-agent-research-system) 왜 안드로픽은 고의적으로 순위적인 감독보다 평면 감독을 선택했는지
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST 분류학; 조정 실패에 관한 섹션
