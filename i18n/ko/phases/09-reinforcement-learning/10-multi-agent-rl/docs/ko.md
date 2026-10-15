# 다중 에이전트 RL

> 단일 에이전트 RL는 환경이 고정된 것으로 가정합니다. 두 개의 학습 에이전트를 같은 세계에 넣으면 그 가정이 깨집니다. 각 에이전트는 다른 환경의 일부이며 둘 다 변화하고 있습니다. 다중 에이전트 RL는 마르코프 가정이 더 이상 유효하지 않을 때 학습을 공감시키는 트릭의 집합입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (Q-learning), Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~45 minutes

## 문제

로봇이 방을 탐색하는 법을 배우는 것은 단일 에이전트 RL 문제입니다. 축구 팀은 그렇지 않습니다. 알파스타 vs 스타크래프트 상대는 그렇지 않습니다. 입찰 에이전트 시장은 그렇지 않습니다. 네 가지 방법으로 정류하는 두 자동차는 그렇지 않습니다. 많은 현실 세계의 문제들은 그렇지 않습니다.

모든 다중 요원 환경에서, 어떤 요인의 관점에서, 다른 요인은 * 환경의 일부입니다. 그들이 학습하고 행동을 변화시키면서 환경은 비정형이 됩니다. 마르코프 속성은 "다음 주체는 현재 주체와 내 행동에만 의존한다"는 것이 위반됩니다. 왜냐하면 다음 주체는 다른 요인들이 선택한 것에 달려 있기 때문에, 그들의 정책은 목표물을 움직이고 있기 때문입니다.

이것은 테이블적 인 인 인접관성 증명 (Q-learning의 보증은 고정된 환경을 가정한다) 를 깨고 또한 순진한 깊은 RL를 깨고: 에이전트들은 서로 룰에서 쫓고, 안정적인 정책으로 결코 konverge하지 않습니다.

2026 응용 프로그램: 로봇 무대, 교통 라우팅, 자율주행 차량 함대, 시장 시뮬레이터, 멀티 에이전트 LLM 시스템 (단계 16), 그리고 하나의 지능적인 플레이어 이상의 게임을.

## 개념

![Four MARL regimes: indep, centralized critic, self-play, league](../assets/marl.svg)

**Formalism: Markov Game.**MDP의 일반화: 국가 $S$, 공동행동$a = (a_1, \ldots, a_n)$, 전환$P(s' \mid s, a)$, 그리고 대리인당 보상$R_i(s, a, s')$- 모든 에이전트$i$자신의 정책에 따라 자신의 수익을 극대화합니다$\pi_i$보상도 동일하다면**fully cooperative**만약 0이면,**adversarial**혼합된 경우, 그것은**general-sum**- 그래

**Core challenges:**

- **Non-stationarity.** $P(s' \mid s, a_i)$대리인으로부터$i$관점의 기준이$\pi_{-i}$, 즉 변화하고 있습니다.
- **Credit assignment.**공유된 보상으로, 어떤 요원이 그 일을 일으켰습니까?
- **Exploration coordination.**에이전트는 상호 보완적인 전략을 모색해야 하고, 같은 상태를 과잉적으로 모색하지 말아야 합니다.
- **Scalability.**공동 행동 공간은 $n$- 그래
- **Partial observability.**각각의 요원은 자신의 관찰만 볼 수 있습니다. 지구 상태는 숨겨져 있습니다.

**Four dominant regimes:**

**1. Independent Q-learning / independent PPO (IQL, IPPO).**각 에이전트는 다른 사람들을 환경의 일부로 취급하면서 자신의 Q 또는 정책을 학습합니다. 간단하지만 때로는 효과가 있습니다. 특히 경험 재연이 부드러운 에이전트 모델링 트릭으로 작용합니다. 이론적 인 공감: 없습니다. 실제: 느슨하게 결합된 작업에 좋습니다. 밀접하게 결합된 작업에 나쁘습니다.

**2. Centralized training, decentralized execution (CTDE).**가장 일반적인 현대 패러다임은 모든 에이전트가 자신의 정책을 가지고 있습니다$\pi_i$지역 관찰에 대한 조건$o_i$ 배포 시 표준 분산 실행. *훈련* 중에, 중앙 집중된 비평가 $Q(s, a_1, \ldots, a_n)$전 세계 상태와 공동의 행동에 대한 조건.
- **MADDPG**(Lowe et al. 2017): DDPG는 에이전트에 중앙 집중된 비평가와 함께
- **COMA**(Foerster et al. 2017): 반사적인 기준  질문 "내가 행동을 취했다면 내 보상이 무엇이었을까?$a'$대신?" 은 제 기여를 고립합니다.
- **MAPPO**- **IPPO**공유 비평가 (Yu et al. 2022): 중앙집중된 가치 기능이 있는 PPO. 2026년 협동조합 MARL에서 지배적이다.
- **QMIX**(Rashid et al. 2018): 가치 분해$Q_{\text{tot}}(s, a) = f(Q_1(s, a_1), \ldots, Q_n(s, a_n))$단조로운 혼합으로

**3. Self-play.**같은 에이전트의 두 개의 복사본이 서로 플레이합니다. 상대방의 정책은 과거의 스냅샷에서 내 정책입니다. 알파고 / 알파제로 / 무제로. 오픈아이 5 . 제로섬 게임에서는 가장 잘 작동합니다. 훈련 신호는 대칭입니다.

**4. League play.**자기 플레이의 확장: 과거와 현재의 정책을 보유, 리그에서 상대를 샘플링하고, 그들에 대한 훈련을 한다. 착취자를 추가 (현재 최고의 것을 물리치는 데 전문) 및 주요 착취자를 추가 (사용자를 물리치는 데 전문). 알파스타 (스타크래프트 II). 게임이 "록 페이퍼-신축" 전략 순환을 허용 할 때 필요합니다.

**Communication.**에이전트들이 학습된 메시지를 보내도록 허용하세요$m_i$협동체 환경에서 작업. Foerster et al. (2016) 은 차별화 가능한 대리인 상호 통신이 종결에서 종결까지 훈련될 수 있음을 보여주었다. 오늘날의 LLM 기반의 다중 대리인 시스템 (단계 16) 은 본질적으로 자연 언어로 통신한다.

```figure
f3-marl-orbit
```

## 건설 해

이 수업은 6 × 6 그리드월드를 사용하여 두 명의 협력 에이전트를 사용합니다. 그들은 반대 각에서 시작하여 공동 목표를 달성해야합니다. 공유 보상:`-1`한 단계에 한 단계로 이동하는 동안`+10`둘 다 도착할 때`code/main.py`- 그래

### 단계 1: 다중 에이전트 환경

```python
class CoopGridWorld:
    def __init__(self):
        self.size = 6
        self.goal = (5, 5)

    def reset(self):
        return ((0, 0), (5, 0))  # two agents

    def step(self, state, actions):
        a1, a2 = state
        new1 = move(a1, actions[0])
        new2 = move(a2, actions[1])
        done = (new1 == self.goal) and (new2 == self.goal)
        reward = 10.0 if done else -1.0
        return (new1, new2), reward, done
```

*공동* 행동 공간은`|A|² = 16`세계적 상태는 두 가지 위치입니다.

### 단계 2: 독립적인 Q 학습

각 에이전트는 공동 상태에 키를 가진 Q 테이블을 실행합니다. 각 단계: 둘 다 ε- 탐욕적인 행동을 선택하고 공동 전환을 수집하고, 각각 공유된 보상으로 자신의 Q를 업데이트합니다.

```python
def independent_q(env, episodes, alpha, gamma, epsilon):
    Q1, Q2 = defaultdict(default_q), defaultdict(default_q)
    for _ in range(episodes):
        s = env.reset()
        while not done:
            a1 = epsilon_greedy(Q1, s, epsilon)
            a2 = epsilon_greedy(Q2, s, epsilon)
            s_next, r, done = env.step(s, (a1, a2))
            target1 = r + gamma * max(Q1[s_next].values())
            target2 = r + gamma * max(Q2[s_next].values())
            Q1[s][a1] += alpha * (target1 - Q1[s][a1])
            Q2[s][a2] += alpha * (target2 - Q2[s][a2])
            s = s_next
```

이 작업에 성공하기 위해서는 보상이 밀집하고 조화 되어 있기 때문이며, 밀접하게 결합된 작업에 실패하기 때문일 것이다.

### 단계 3: 분해된 값 업데이트를 가진 중앙 집중 Q

공동 작업에 대해 1 Q를 사용하십시오 $Q(s, a_1, a_2)$. 공유 보상에서 업데이트.$\pi_i(s) = \arg\max_{a_i} \max_{a_{-i}} Q(s, a_1, a_2)$. 전 세계적 시각을 *정확하게* 만들기 위해 기하급수적 공동 행동 공간을 거래합니다.

### 4단계: 간단한 자기 플레이 (대립 2대원)

같은 에이전트, 두 역할, A와 B의 대열$K$에피소드, A의 무게를 B로 복사합니다.

## 함정

- **Non-stationary replay.**독립적인 에이전트들과의 경험 재연은 싱글 에이전트보다 더 나쁘다. 왜냐하면 오래된 전환은 이제 쓸모없는 상대가 만들어냈기 때문입니다.
- **Credit assignment ambiguity.**긴 에피소드 후 공유된 보상; 어떤 에이전트가 기여했는지 명확하게 말할 방법이 없습니다. 수정: 반사 사실 기준 (COMA) 또는 에이전트 당 보상 형식.
- **Policy drift / chasing.**각 에이전트의 가장 좋은 반응은 다른 업데이트와 함께 변화합니다. 고치는: 중앙 집중된 비평가, 학습 속도가 느리거나 한 번에 한 번 얼어붙습니다.
- **Reward hacking via coordination.**에이전트는 설계자가 예상하지 못한 조정된 착취를 발견합니다. 경매 에이전트는 시상식 0으로 합당합니다. 수정: 신중한 보상 설계, 행동적 제약.
- **Exploration redundancy.**두 에이전트가 동일한 상태 행동 쌍을 탐구합니다.
- **League cycles.**순수한 자기 플레이는 지배적 순환에 갇혀있을 수 있습니다.
- **Sample explosion.** `n`대리자 × 상태 공간 × 공동 행동. 함수 근접과 함께 대략적으로; 계수적인 행동 공간 (원당 정책 출력 헤드 1 개)

## 사용 하 고

2026년 MARL 응용 지도:

| Domain | Method | Notes |
|--------|--------|-------|
| Cooperative navigation / manipulation | MAPPO / QMIX | CTDE; shared critic + decentralized actors. |
| Two-player games (chess, Go, poker) | Self-play with MCTS (AlphaZero) | Zero-sum; symmetric training. |
| Complex multiplayer (Dota, StarCraft) | League play + imitation pretraining | OpenAI Five, AlphaStar. |
| Autonomous-vehicle fleets | CTDE MAPPO / PPO with attention | Partial obs; variable team sizes. |
| Auction markets | Game-theoretic equilibrium + RL | Mean-field RL when `n` → ∞. |
| LLM multi-agent systems (Phase 16) | Natural-language comm + role conditioning | RL loop at the agent-planning layer. |

2026년, MARL의 가장 큰 성장 영역은 LLM 기반의 언어 모델 에이전트들의 무리가 협상, 토론, 소프트웨어 구축을 합니다.

## 선박

`outputs/skill-marl-architect.md`이 부분의 본문은

```markdown
---
name: marl-architect
description: Pick the right multi-agent RL regime (IPPO, CTDE, self-play, league) for a given task.
version: 1.0.0
phase: 9
lesson: 10
tags: [rl, multi-agent, marl, self-play]
---

Given a task with `n` agents, output:

1. Regime classification. Cooperative / adversarial / general-sum. Justify.
2. Algorithm. IPPO / MAPPO / QMIX / self-play / league. Reason tied to coupling tightness and reward structure.
3. Information access. Centralized training (what global info goes to the critic)? Decentralized execution?
4. Credit assignment. Counterfactual baseline, value decomposition, or reward shaping.
5. Exploration plan. Per-agent entropy, population-based training, or league.

Refuse independent Q-learning on tightly-coupled cooperative tasks. Refuse to recommend self-play for general-sum with cycle risks. Flag any MARL pipeline without a fixed-opponent eval (cherry-picked self-play numbers are common).
```

## 운동

1. **Easy.**2 대원 협동조합 GridWorld에서 독립 Q-learning을 훈련하십시오. 평균 반환이 > 0까지 몇 에피소드? 공동 학습 곡선을 그려보십시오.
2. **Medium.**"조정" 작업을 추가: 두 요원이 같은 방향으로 그 목표에 걸리면만 목표가 달성됩니다. 독립 Q는 여전히 공렴합니까? 무엇이 깨나요?
3. **Hard.**MAPPO 방식의 훈련에 대한 중앙 집중된 비평가 구현 및 조정 작업에 있어서 독립적인 PPO와 컨버전스 속도 비교.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Markov game | "Multi-agent MDP" | $(S, A_1, \ldots, A_n, P, R_1, \ldots, R_n)$; each agent has its own reward. |
| CTDE | "Centralized training, decentralized execution" | Joint critic at training time; each agent's policy uses only local obs. |
| IPPO | "Independent PPO" | Each agent runs PPO separately. Simple baseline; often underrated. |
| MAPPO | "Multi-agent PPO" | PPO with a centralized value function conditioned on global state. |
| QMIX | "Monotonic value decomposition" | $Q_{\text{tot}} = f_{\text{monotone}}(Q_1, \ldots, Q_n)$ allows decentralized argmax. |
| COMA | "Counterfactual multi-agent" | Advantage = my Q minus expected Q marginalizing over my action. |
| Self-play | "Agent vs past self" | Single agent, two roles; standard for zero-sum games. |
| League play | "Population training" | Cache past policies, sample opponents from the pool; handles strategy cycles. |

## 더 많은 읽기

- [Lowe et al. (2017). Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments (MADDPG)](https://arxiv.org/abs/1706.02275) 중앙 집중된 비평가와 함께 CTDE
- [Foerster et al. (2017). Counterfactual Multi-Agent Policy Gradients (COMA)](https://arxiv.org/abs/1705.08926) 신용 할당에 대한 반사적 기준
- [Rashid et al. (2018). QMIX: Monotonic Value Function Factorisation](https://arxiv.org/abs/1803.11485) 단조적인 값 분해.
- [Yu et al. (2022). The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games (MAPPO)](https://arxiv.org/abs/2103.01955) PPO는 MARL에 대해 놀랍도록 강합니다.
- [Vinyals et al. (2019). Grandmaster level in StarCraft II using multi-agent reinforcement learning (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z) 리그 경기 규모
- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270) 0의 합으로 이루어진 게임에서의 순수한 자기 플레이.
- [Sutton & Barto (2018). Ch. 15 — Neuroscience & Ch. 17 — Frontiers](http://incompleteideas.net/book/RLbook2020.pdf) 교과서에서 다중 에이전트 설정에 대한 짧은 처리와 CTDE가 해결하도록 설계된 비상성 문제까지 포함합니다.
- [Zhang, Yang & Başar (2021). Multi-Agent Reinforcement Learning: A Selective Overview](https://arxiv.org/abs/1911.10635) 협동, 경쟁 및 혼합 MARL를 대상으로 한 조사
