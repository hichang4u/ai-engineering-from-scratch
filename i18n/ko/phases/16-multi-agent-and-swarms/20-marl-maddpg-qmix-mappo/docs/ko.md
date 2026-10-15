# MARL  MADDPG, QMIX, MAPPO

> 2026 년에도 LLM-agent 시스템을 여전히 알리는 다중 에이전트 조정의 강화 학습 유산. **MADDPG**(Lowe et al., NeurIPS 2017, arXiv:1706.02275) 는 중앙 집중화된 교육, 분산화된 실행 (CTDE) 를 도입했다: 각 비평가들은 훈련 중에 모든 에이전트의 상태와 행동을 볼 수 있으며, 테스트 시간에 지역 배우만 실행한다. 협동, 경쟁 및 혼합 설정에 대한 작업. **QMIX**(Rashid et al., ICML 2018, arXiv:1803.11485) 는 단조적인 혼합 네트워크로 값 분해입니다.`argmax`스타크래프트 멀티 에이전트 챌린지 (SMAC) 에서 을 지배적으로 분산합니다. **MAPPO**(Yu et al., NeurIPS 2022, arXiv:2103.01955) 은 PPO가 중앙 집중화된 가치 기능을 가진다. 미세먼지 세계, SMAC, 구글 리서치 축구, 한아비에서 최소 조정으로 "놀이하게 효과적"이다. 이 것들은 분중적으로 행동해야 하는 에이전트 팀들을 위한 훈련 정책을 뒷받침한다. MAPPO는 **default 2026 cooperative-MARL baseline**이 수업은 작은 그리드 세계 장난감에서 각각을 구성하고 3가지 아이디어를 근육 기억에 내포하고 LLM 요원 훈련에 닿기 전에

**Type:** Learn
**Languages:** Python (stdlib, small NumPy-free implementations)
**Prerequisites:** Phase 09 (Reinforcement Learning), Phase 16 · 09 (Parallel Swarm Networks)
**Time:** ~90 minutes

## 문제

LLM-agent 시스템들은 점점 더 많은 기관 간 조정 정책을 훈련시킵니다. 언제 연기해야 하는지, 언제 행동해야 하는지, 누가 동대심을 해야 하는지. 그러한 정책을 훈련하는 방법을 알려주는 문학은 LLM 파동에 앞서있는 멀티 에이전트 강화 학습 (MARL) 이며 소수의 지배적 알고리즘이 있습니다.

패턴 어휘 없이 MARL 논문을 읽는 것은 고통스럽다. 중앙 집중화된 훈련, 분산된 실행 (CTDE), 가치 분해, 중앙 집중된 비평가들은 버즈워드가 아닙니다.

- 독립적인 RL (모든 에이전트가 혼자 학습한다) 는 각 에이전트의 관점에서 비정형입니다. 나쁜.
- 중앙 집중된 RL (하나의 에이전트가 모든 것을 제어한다) 는 확장되지 않으며 실행 제한을 위반합니다.
- CTDE는 두 가지의 최고를 얻습니다. 글로벌 정보를 훈련하고, 지역 정책에 적용합니다.

## 개념

### 논문에서 사용되는 3가지 환경

- **Particle World (multi-agent particle env).**협력/경쟁력 과제들을 가진 간단한 2D 물리학. MADDPG의 원래 시험용 침대.
- **StarCraft Multi-Agent Challenge (SMAC).**협동조합 미생 관리, 부분 관찰, QMIX의 시험장, 단호한 행동, 연속 상태
- **Google Research Football, Hanabi, MPE.**지도 기준 라인

다른 환경은 다른 행동/관측 유형을 가지고 있습니다. 알고리즘은 그에 따라 선택합니다.

### MADDPG (2017)  CTDE 패턴

모든 에이전트`i`배우가 있어요`mu_i(o_i)`각 요원마다 비판자가 있습니다.`Q_i(x, a_1, ..., a_n)`훈련 중에 모든 관찰과 모든 행동을 볼 수 있습니다. 배우는 평단의 평가에 따라 정책적 차원에서 업데이트됩니다.

```
actor update:    grad_theta_i J = E[grad_theta mu_i(o_i) * grad_a_i Q_i(x, a_1..n) at a_i=mu_i(o_i)]
critic update:   TD on Q_i(x, a_1..n) given next-state joint estimate
```

왜 CTDE: 훈련 시간에 우리는 모든 사람들의 행동을 알고 있습니다. 우리는 그것을 각 평론가에서 변수를 줄이기 위해 사용합니다. 배치 시간에, 각 에이전트는 단지 `o_i`그리고 전화`mu_i(o_i)`- 그래

실패 모드: N 에이전트 (인पुट은 모든 동작을 포함합니다). 대략 없이 ~10 에이전트를 넘지 않습니다.

### QMIX (2018)  가치 분해

협동력만. 글로벌 보상은 에이전트당 Q 값의 단조직 함수의 합입니다.

```math
Q_{\text{tot}}(\tau, a) = f\big(Q_1(\tau_1, a_1), \ldots, Q_n(\tau_n, a_n)\big), \quad \frac{\partial f}{\partial Q_i} \ge 0
```

단조성 보장`argmax_a Q_tot`각 에이전트가 선택할 수 있는 계산`argmax_{a_i} Q_i`독립적으로, 즉**exactly the decentralized execution property**훈련 시에는 혼합 네트워크가 생산하는`Q_tot`대리인당 Qs에서

왜 QMIX가 SMAC에서 승리하는지: 협동조합 스타크래프트 마이크로 관리에는 균일한 에이전트, 지역 엑스, 글로벌 보상이 있습니다

실패 모드: 단조성 제한은 제한적입니다. 일부 작업에는 단조성 분해가 불가능한 보상 구조가 있습니다. (팀을 위해 희생하는 한 대원). 확장 (QTRAN, QPLEX) 는 이것을 완화합니다.

### MAPPO (2022)  과장된 결제

다중 에이전트 PPO: 중앙집중된 가치 기능을 가진 PPO. 각 에이전트는 자체 정책을 가지고 있습니다. 모든 에이전트는 전체 상태를 볼 수 있는 가치 기능을 공유 (또는 에이전트당) 합니다. Yu et al. 2022는 MADDPG, QMIX와 그들의 확장들을 다섯 가지 기준에 기준으로 비교하여 다음과 같이 발견했습니다.

- MAPPO는 미세먼지 세계, SMAC, Google 연구 축구, Hanabi, MPE에서 정책 외 MARL 방법을 일치하거나 이기고 있습니다.
- 최소 하이퍼파라미터 조정이 필요합니다.
- 안정적인 훈련, 씨앗들 사이에 재생 가능

이 논문까지 커뮤니티는 정책에 관한 MARL를 과소평가했습니다. 2026년, MAPPO는 협동조합 MARL의 기본 기준입니다. 새로운 방법은 그것을 이길 수 있습니다.

### LLM 에이전트 엔지니어들이 왜 신경 써야 하는 걸까요?

3가지 직접적인 사용법:

1. **Router training.**메타 에이전트는 어떤 하위 에이전트가 작업을 처리하는지 선택합니다. 이것은 N 분산 하위 에이전트와 하나의 중앙 집중된 라우터와 함께 MARL 문제입니다. MAPPO는 적합합니다.
2. **Role emergence.**생성물인 시뮬레이션에서, 시간이 지남에 따라 상호 보완적인 역할을 채택하는 훈련물인 것은 MAL의 위장 문제입니다. QMIX 스타일의 가치 분해는 건설에 의해 보완성을 강요합니다.
3. **Multi-agent tool use.**에이전트들이 도구를 공유하고 예산에 경쟁할 때 CTDE를 통해 훈련하는 것은 자원 제한을 존중하는 지역 정책들을 생산합니다.

실용적인 경고: 2026년, 대부분의 생산 LLM 에이전트 시스템들은 교육을 대신 정책에 부추기고 있습니다. MARL는 (a) 많은 상호 작용 데이터를 가지고, (b) 명확한 보상 신호를 가지고, (c) 교육 인프라에 투자하려는 의지를 가지고 있을 때 발생합니다.

### RL를 넘어서는 설계 패턴으로서 CTDE

훈련 없이도 CTDE는 유용한 건축 패턴입니다.

- *디자인* 중에 팀의 전체 가시성을 가정하십시오.
- * 런타임*에서 분산 실행을 시행: 각 에이전트는 만 볼 수 있습니다`o_i`- 그래

이 패턴은 매개체 상태가 명시적되어 있고 부분적인 관찰 가능성에 대해 미리 생각하도록 강요합니다. 많은 생산 멀티 에이전트 시스템은 침묵으로 모든 곳에서 공유된 상태를 가정합니다.

### 비상류성 문제

여러 에이전트가 동시에 학습할 때, 각 에이전트의 환경 (다른 에이전트의 정책을 포함) 은 고정적이지 않습니다. 고전적 단일 에이전트 RL 증명은 깨집니다. 이 수업의 MARL 알고리즘은 모두 다음과 같은 문제를 해결합니다.

- MADDPG: 글로벌 비평가들은 모든 행동을 보고, 그 가치 추정치는 고정되어 있습니다.
- QMIX: 값 분해는 학습을 최적화가 잘 정의된 Q 공동 공간으로 이동시킵니다.
- 지도: 중앙집권화된 가치 기능은 다른 사람들의 정책 변화에 대한 차이는 완화합니다.

LLM-agent 시스템에서, 비상동성은 "내 에이전트가 지난 달 일했고, 다른 에이전트가 하류에 변경되었으므로, 내의 잘못된 행동이다". CTDE와 MARL 훈련은 원칙적 수정입니다.

### 이 교훈 에서 다루지 않는 것

실제 네트워크 훈련은 9 단계의 주제입니다. 이 수업은 CTDE, 가치 분해, 그리고 중화 된 가치 패턴을 그라디언트 업데이트 없이 보여주는 스크립트 정책 버전을 구축합니다. 목표는 완전한 MARL 라이브러리를 (PyMARL, MARLlib, RLlib 멀티 에이전트) 취득하기 전에 패턴을 내재하는 것입니다.

```figure
sw-ctde
```

## 건설 해

`code/main.py`세 가지 패턴을 구현합니다. 모두 작은 2 대원 협동망 세계에서:

- 환경: 4x4 그리드 위에 있는 2개의 에이전트, 1개의 보너스 펠렛. 어떤 에이전트가 펠렛에 도달하면 1개의 보너스. 작업이 완료됩니다.
- `IndependentAgents` 각 요원은 다른 요인을 환경으로 취급합니다.
- `MADDPGStyle`중앙 집중적 비평가 는 공동 가치 를 계산 하고, 배우 정책 은 그것 에서 업데이트 되고, 정책 개선 은 스크립트 되어 있다.
- `QMIXStyle` 단조음 혼합기로 값 분해
- `MAPPOStyle` 중앙 집중된 가치 기능; 공유 기본 라인에 비해 정책 업데이트

네 가지 에피소드는 모두 같은 에피소드를 실행하고 평균 단계-목표 보고합니다. CTDE 변종은 독립적인 기본 라인보다 더 짧은 경로로 konverge 합니다.

실행:

```
python3 code/main.py
```

예상 출력: 독립적 인 에이전트는 평균 ~ 6 단계를 거쳐 CTDE 변종은 ~ 3.5 단계로 konverge (4x4 그리드에서 최적은 3) 스스크립트 정책에도 불구하고 패턴 차이점이 나타납니다.

## 사용 하 고

`outputs/skill-marl-picker.md`주어진 멀티 에이전트 작업에 대한 MARL 알고리즘을 선택하는 기술입니다: 협동적 vs 경쟁력, 균일 vs 이질적, 행동 공간 유형, 규모, 보상 신호.

## 선박

생산되는 MARL은 드물다.

- **Start with MAPPO.**2022년 논문에서는 이를 기본으로 설정했고, 이를 복제하는 것은 몇 주 동안 더 멋진 방법을 추구하는 시간을 절약합니다.
- **Log every agent's observation and action stream.**매개체 추적 없이 MARL를 해독하는 것은 희망이 없다.
- **Separate training code from execution code.**CTDE는 학문입니다. 실행 경로가 실제로 볼 수 있도록`o_i`- 그래
- **Reward shaping warning.**MARL는 보상 디자인에 매우 민감합니다. 한 번의 조정 오류가 형성되고, 에이전트가 그것을 이용하는 법을 배우죠.
- **For LLM agents**우선 순식간에 진행되는 정책들을 고려해 보세요. 상호작용 데이터 + 보상 신호 + 인프라가 모두 존재할 때만 MARL 교육에 투자하세요.

## 운동

1. 달아`code/main.py`독립적인 대리인들과 MAPPO형 대리인 사이의 단계별 격차를 측정합니다. 6x6 그리드에서 격차가 커지거나 줄어든가?
2. 경쟁적인 변형을 구현: 두 대사, 한 펠렛, 첫 번째 도달하는 사람만이 보상을 받게 됩니다. 어떤 패턴이 경쟁을 깨끗하게 처리합니까?
3. MADDPG (arXiv:1706.02275) 3부 참조. 정확한 비판 업데이트 규칙을 상징적으로 자신의 단어로 사이비코드로 구현하십시오.
4. MAPPO (arXiv:2103.01955) 를 읽어 보십시오. 왜 저자들은 중앙집중된 가치 + PPO가 정책 외의 MARL를 상대로 주장하는가? 가장 강력한 세 가지 주장을 나열하세요.
5. 가설적인 LLM-agent 시스템 (예를 들어, 연구 에이전트 + 요약자 + 코더) 에 CTDE를 설계 패턴으로 적용하십시오. 설계 시 사용할 수 있는 공동 정보는 실행 시 사용할 수 없는 것이 무엇입니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MARL | "Multi-Agent RL" | Reinforcement learning for multi-agent systems. |
| CTDE | "Centralized Training, Decentralized Execution" | Train with global info; deploy with local policies. |
| MADDPG | "Multi-Agent DDPG" | CTDE with per-agent critic seeing all observations + actions. |
| QMIX | "Value decomposition" | Monotonic mixing of per-agent Qs. Cooperative. |
| MAPPO | "Multi-Agent PPO" | PPO with centralized value function. 2026 default baseline. |
| Value decomposition | "Sum of individual Qs" | Joint Q represented as a monotone function of per-agent Qs. |
| Non-stationarity | "Moving targets" | Each agent's env changes as others learn. The core MARL problem. |
| On-policy / off-policy | "Learn from current / replay" | PPO is on-policy (MAPPO); DDPG and Q-learning are off-policy. |
| SMAC | "StarCraft Multi-Agent Challenge" | Cooperative micromanagement benchmark; QMIX's homegrown ground. |

## 더 많은 읽기

- [Lowe et al. — Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments](https://arxiv.org/abs/1706.02275) MADDPG; 2017년 뉴리프스
- [Rashid et al. — QMIX: Monotonic Value Function Factorisation for Deep Multi-Agent Reinforcement Learning](https://arxiv.org/abs/1803.11485) QMIX; ICML 2018
- [Yu et al. — The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games](https://arxiv.org/abs/2103.01955) MAPPO; NeurIPS 2022
- [BAIR blog post on MAPPO](https://bair.berkeley.edu/blog/2021/07/14/mappo/) MAPPO 결과의 가독 가능한 프레임
- [SMAC repository](https://github.com/oxwhirl/smac) 스타크래프트 멀티 에이전트 도전
