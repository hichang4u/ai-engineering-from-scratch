# 정신 이론 과 급성장한 조정

> 리 등 (arXiv:2310.10701) 는 협동체 텍스트 게임 전시에서 LLM 에이전트들이**emergent high-order Theory of Mind**(ToM)  다른 요원이 제3 요인의 신념에 대해 믿는 것에 대해 논리하는  그러나 맥락 관리 및 환각으로 인해 장기 계획에 실패합니다. 리들 (arXiv:2510.05174) 는 인구 전체에서 더 높은 순서대의 시너지를 측정하고 발견했습니다**only**ToM-prompt 조건은 정체성과 연결된 차별화와 목표 지향적인 보완성을 생성하고, 낮은 용량 LLM는 거짓된 출현만을 나타냅니다. 즉, 조율의 등장은 즉각적인 조건으로 이루어지고 모델에 의존하고 무료가 아닙니다. 이 수업은 최소한의 ToM에 대한 인식이 있는 요인을 구현하고, ToM의 요청과 함께 협력 작업을 수행하고, Riedl 2025 프로토콜에 대한 조정 델타를 측정합니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 07 (Society of Mind and Debate), Phase 16 · 17 (Generative Agents)
**Time:** ~75 minutes

## 문제

다중 에이전트 조정은 종종 마법처럼 보입니다. 에이전트들은 노동을 나누고, 서로를 예상하고, 과잉을 피합니다. 일반적으로 이 "발생"은 프롬프트 엔지니어링의 유물입니다. 누군가가 에이전트에 "조선"하라고 말했다.

리엘의 2025 연구 결과는 더 엄격합니다. 통제된 조건에서, 협동은 에이전트가**other agents' minds**(ToM) ToM 시동 없이도 강력한 모델들은 통계적 통제를 극복하지 못하는 조정 패턴을 보여준다. 이것은 생산에 중요합니다. 팀들은 시동에 의존하고 부서지기 쉬운 "다 대원 조정" 기능을 배포한다.

이 수업은 ToM를 특정 능력으로 다루고 (신앙에 대한 신념에 대한 논의를) 최소한의 ToM 인식 요인을 구축하고 실제 조정과 신속한 드레스링이 어떻게 보이는지 측정합니다.

## 개념

### ToM 의 의미

발달심리학: 3 세 어린이는 누구의 내면세계가 그들의 세계와 일치한다고 생각한다. 5 세 어린이는 다른 사람들이 다른 신념을 가지고 있음을 이해합니다. 7 세 어린이는 신념에 대한 신념에 대한 이유를 ("나는 공이 컵 아래 있다고 생각한다") 생각합니다. 이것들은 제로스, 1 차, 그리고 2 차 ToM입니다.

LLM 에이전트들을 위해 ToM는 다음의 지도를 주문합니다.

- **Zeroth-order:**다른 사람의 모델이 없습니다. 에이전트는 자신의 관찰에 따라만 행동합니다.
- **First-order:**에이전트는 다른 에이전트의 신념을 모형으로 만들어 놨습니다.
- **Second-order:**에이전트는 재발적 신념을 모델로 합니다. "아리스는 밥이 X를 믿는다고 믿는다".

리 및 동료들은 2023 년이 발견한 결과 협동 게임에서 LLM 에이전트에서 1 및 2 순위 ToM가 등장하지만 긴 지평과 신뢰할 수 없는 통신으로 쇠퇴합니다.

### 세일리 앤 테스트, 간단히

1985년 거짓 믿음 시험: 살리는 바구니 A에 화석을 넣고 떠난다. 앤은 바구니 B로 옮긴다. 살리는 돌아왔을 때 어디로 보는가?

GPT-4 시대 LLM는 명확하게 포즈를 취했을 때 Sally-Anne 스타일의 테스트를 통과합니다. 이야기는 길고, 장면이 여러 번 변경되거나 질문은 간접적으로 표현되면 실패합니다. 이것이 생산 LLM에서 ToM의 실질적인 2026 상태입니다.

### 리들의 조정 측정

리엘 (arXiv:2510.05174) 는 인구 규모의 테스트를 만들었습니다: N 에이전트, 협력 목표, 변동적 인 시급 조건. 측정:

1. **Identity-linked differentiation.**에이전트는 시간이 지남에 따라 안정적인 역할 차이를 형성합니까?
2. **Goal-directed complementarity.**요원의 행동은 복제보다는 서로 보완 (다양한 하위 작업) 하는가?
3. **Higher-order synergy.**어떤 부수집단이 달성할 수 없는 것을 그룹이 달성하는지 여부에 대한 통계적 측정.

결과: ToM 프롬프트 조건에서만 세 가지 매트릭은 기본값보다 높은 신호를 생성합니다. ToM 프롬프트 없이, 매트릭은 중소 용량 모델에 거의 확률이 높습니다. 큰 모델은 명시적인 ToM 프롬프트 없이 약간의 조정력을 보여줍니다. 그러나 효과는 명시적인 프롬프트보다 작습니다.

### 조정 착각

통계적 통제가 없으면, 디모에서 "응급 조정"은 종종 다음과 같은 것을 반영합니다.

- 조율을 조율하는 빠른 엔지니어링 (시스템 명령어 "함께 작업하라")
- 관찰자 편향 (우리는 예상하는 패턴을 봅니다).
- 성공한 경기의 후반 선택

측정 가능한 신호 없이 "응동 조정"을 시장에 내놓는 생산 시스템은 마케팅으로 취급되어야 합니다.

### 최소한의 TOM에 대한 인식이 있는 요원

구조:

```
agent state:
  own_beliefs:    {facts the agent believes}
  other_models:   {other_agent_id -> {beliefs_the_agent_attributes_to_them}}
  actions_last_N: [history of others' actions]

observation update:
  - update own_beliefs from direct observation
  - update other_models[agent_id] from their action + prior beliefs

action selection:
  - enumerate candidate actions
  - for each, predict what each other agent will do next given their modeled beliefs
  - pick action that maximizes joint outcome under those predictions
```

`other_models`속성은 ToM 상태입니다. 첫 번째 순서 ToM는 한 레벨만 유지합니다. 두 번째 순서 추가합니다.`other_models[i][other_models_of_j]`제 생각엔 에이전트 J가 믿는 것 같아요

### 왜 장평선이 아프지

리 에트 알. 문서: 맥락 제한은 요인들이 어느 신념이 누구에게 속하는지 잊게 만듭니다. 환각은 다른 요인 모델에 거짓 신념을 추가합니다. 둘 다 시간이 지남에 따라 합병되는 "나는 그가 X을 생각했었다" 오류를 발생시킵니다.

논문에서 기록된 완화 및 2024~2026년 후속 작업:

- **Explicit ToM state in the prompt.**구조형: `{agent_id: belief_list}`- 신분과 신념을 유지하기 위해 복원력을 강요합니다.
- **Shorter reasoning chains.**ToM 업데이트가 줄어들면 합성 환각이 줄어들게 됩니다.
- **External ToM store.**모델은 LLM 맥락에서 벗어나도록 유지하십시오.

### ToM가 생산에 실패할 경우

- **Adversarial settings.**좋은 ToM를 가진 에이전트는 조작하기 쉽다 (그들이 당신을 모델링하고, 그것을 이용하면 된다).
- **Heterogeneous teams.**모델이 다르면, 하나의 상대방에 대해 작동하는 ToM 모델은 일반화되지 않습니다.
- **Ground-truth-dependent tasks.**ToM는 신념에 관한 것입니다. 정확성이 사실에 달려 있다면 ToM는 방해가 될 수 있습니다.

### 실제로 측정할 수 있는 조정

팀의 조정이 즉각적으로 입는 것보다 실제적인 것을 보여주는 세 가지 실제 신호:

1. **Complementarity over time.**여러 차례의 작업에 대해, 요원의 행동은 다른 부 작업을 포함합니까?
2. **Anticipation.**T+1의 전환에서 에이전트 A의 행동이 T+2에서 B의 동작에 대한 예측에 의존하는가?
3. **Correction.**A가 T를 돌면서 B의 신념을 잘못 읽으면 A가 T+2를 돌면서 올바르게 여긴다

이 시스템은 기록된 다중 에이전트 시스템에서 측정될 수 있습니다. 그들은 "조정" 내레이션의 실질적인 버전입니다.

```figure
sw-theory-of-mind
```

## 건설 해

`code/main.py`이 도구는

- `ToMAgent` 자신의 신념과 다른 요원들의 신념 모델을 추적합니다.
- 협동적인 작업: 세 명의 에이전트가 세 개의 상자에서 세 개의 토큰을 수집해야 하며, 각 상자는 하나의 토큰을 보유할 수 있습니다. 에이전트는 의사소통을 할 수 없습니다. 그들은 서로의 행동에서 의도를 추론합니다.
- 두 가지 구성:`zeroth_order`(TOM가 없습니다)`first_order`(TOM는 한 단계적인 신념 모델입니다).
- 200개의 무작위 실험을 측정: 완수율, 복제율 ( 같은 상자를 대상으로 한 두 대원), 완수까지 평균 회전.

실행:

```
python3 code/main.py
```

예상 출력: 제로 순위 에이전트들은 ~ 35%의 비율로 노력을 두 배로 하고 10 차례에 걸쳐 실험의 ~ 60%를 완료한다. 1 순위 ToM 에이전트들은 ~ 5%로 반복하고 ~ 95%를 완료한다.

## 사용 하 고

`outputs/skill-tom-auditor.md`다중 에이전트 시스템의 "응급 조정"의 주장을 감사하는 기술입니다.

## 선박

조정 청구 체크리스트:

- **Control condition.**조정 명령 없이 시스템 버전이 있어요
- **Statistical test.**시스템과 제어 사이의 차이는`p < 0.05`- 네 메트릭에?
- **Complementarity measure.**시간이 지남에 따라 행동의 분열, 최종 성공뿐만 아니라
- **Failure-case log.**에이전트가 잘못 조정되면, TOM 주가 어떻게 생겼을까요?
- **Model-capacity disclosure.**작은 모델에서 효과가 사라진다면, 그렇게 말해주세요.

## 운동

1. 달아`code/main.py`1차 순서 ToM가 7배나 더블률을 줄여주죠. 5개의 에이전트와 5개의 박스로 확장하면 격차가 계속되나요?
2. 2차 순위 ToM (Agent A는 B가 C에 대해 생각하는 것을 모델링) 을 구현합니다.
3. A 주입**hallucination**ToM 상태: 순차적으로 1개의 신념을 돌리면
4. 리 등 (arXiv:2310.10701) 를 읽어 보세요. "장수 지평화 저하"의 결과를 재현하세요.
5. 리엘 2025 (arXiv:2510.05174) 를 읽어 보세요. 시뮬레이션 로그에 더 높은 순위 시너지 통계를 구현하세요. ToM 프롬프트 조건 없이 효과는 존재하는가?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Theory of Mind | "Understanding others' minds" | The capacity to model another agent's beliefs. Graded by order (0, 1, 2+). |
| Sally-Anne test | "The false-belief test" | 1985 developmental psychology; LLMs pass plain versions, fail complex ones. |
| First-order ToM | "A believes X" | Modeling one other's beliefs about facts. |
| Second-order ToM | "A believes B believes X" | Recursive modeling one level deeper. |
| Identity-linked differentiation | "Stable roles over time" | Riedl's metric: roles persist, not random. |
| Goal-directed complementarity | "Disjoint actions" | Agents target different subtasks, not the same one. |
| Higher-order synergy | "Group exceeds any subset" | Riedl's statistical measure for real coordination. |
| Coordination illusion | "It looks coordinated" | Prompt-dressed appearance of coordination without measurable signal. |

## 더 많은 읽기

- [Li et al. — Theory of Mind for Multi-Agent Collaboration via Large Language Models](https://arxiv.org/abs/2310.10701) 협동 게임에서의 새로운 ToM; 장기적 실패 모드
- [Riedl — Emergent Coordination in Multi-Agent Language Models](https://arxiv.org/abs/2510.05174) 인구 규모 측정; ToM 촉구 는 부담 상태입니다
- [Premack & Woodruff — Does the chimpanzee have a theory of mind?](https://doi.org/10.1017/S0140525X00076512) ToM 개념의 기원은 1978년
- [Baron-Cohen, Leslie, Frith — Does the autistic child have a theory of mind?](https://doi.org/10.1016/0010-0277(85)90022-8)  Sally-Anne 논문 (1985)
