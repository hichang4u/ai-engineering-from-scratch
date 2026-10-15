# MDP, 국가, 액션 및 보상은

> 마코프 결정 프로세스는 다섯 가지입니다. 상태, 행동, 전환, 보상, 할인. RL  Q-학습, PPO, DPO, GRPO 의 모든 것이 이 형태를 최적화합니다. 한 번 배워, 나머지 강화 학습을 무료로 읽으십시오.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Probability & Distributions), Phase 2 · 01 (ML Taxonomy)
**Time:** ~45 minutes

## 문제

체스 로봇이나 재고 기획자, 거래 에이전트, 또는 추론 모델을 훈련시키는 PPO 루프 등 4가지 영역, 하나의 놀라운 사실: 모두 같은 수학 객체로 붕괴됩니다.

감독된 학습은 당신에게`(x, y)`이 운동은 게임을 이기는가? 재충전 결정은 돈을 절약했는가? 무역은 이익을 얻었는가? LLM가 만든 토큰은 판사로부터 더 높은 보상을 가져왔는가?

이 흐름에서 정식화하기 전까지는 배울 수 없습니다. "내가 본 것", "내가 한 것", "이후 무슨 일이 일어났는지", "이 얼마나 좋은 것"은 모두 당신이 논의를 할 수 있는 객체가 되어야 합니다. 그 정식화는 마르코프 결정 과정입니다. 이 단계에서 모든 RL 알고리즘, RLHF와 GRPO 루프를 포함하여 끝에서, 이 모양에 대해 최적화합니다.

## 개념

![Markov decision process: states, actions, transitions, rewards, discount](../assets/mdp.svg)

**The five objects.**

- **States** $S$그리드월드에서 셀, 체스, 보드, LLM에서 컨텍스트 윈도우, 그리고 모든 기억
- **Actions** $A$선택, 위로, 아래로, 왼쪽으로, 오른쪽으로 이동, 움직임을 보냅니다.
- **Transitions** $P(s' \mid s, a)$- 국가를 고려하면$s$그리고 행동$a$체스에서 결정적이고, 재고에서 정립적이며, LLM에서 거의 결정적입니다.
- **Rewards** $R(s, a, s')$. 스칼라 신호. 승률 = +1, 손실 = -1. 수익률 미소 비용.
- **Discount** $\gamma \in [0, 1)$. 미래의 보상과 현재는 얼마나 중요한지$\gamma = 0.99$~ 100발의 지평을 구매합니다.$\gamma = 0.9$10을 구매합니다.

**The Markov property** $P(s_{t+1} \mid s_t, a_t) = P(s_{t+1} \mid s_0, a_0, \ldots, s_t, a_t)$미래는 현재 상태에만 달려 있습니다. 그렇지 않으면 국가 대표는 불완전합니다.

**Policies and returns.**정책$\pi(a \mid s)$지도는 행동 분포에 대한 상태입니다.$G_t = r_t + \gamma r_{t+1} + \gamma^2 r_{t+2} + \ldots$미래 보상의 할인된 금액입니다.$V^\pi(s) = \mathbb{E}[G_t \mid s_t = s]$$s$정책에 따라$\pi$Q값$Q^\pi(s, a) = \mathbb{E}[G_t \mid s_t = s, a_t = a]$RL 알고리즘은 두 가지 중 하나를 추정하고, 그 다음 개선합니다$\pi$따라서

**The Bellman equations.**이 단계에서 모든 것이 사용하는 고정점 방정식은

```math
\begin{aligned}
V^\pi(s) &= \sum_a \pi(a \mid s) \sum_{s', r} P(s', r \mid s, a) [r + \gamma V^\pi(s')] \\
Q^\pi(s, a) &= \sum_{s', r} P(s', r \mid s, a) [r + \gamma \sum_{a'} \pi(a' \mid s') Q^\pi(s', a')]
\end{aligned}
```

이 분할은 "이 단계의 보상"과 "당신이 착륙하는 곳의 할인된 값"으로 반환됩니다. 재발적. 9 단계의 모든 알고리즘은 이 방정식을 공감 (동적 프로그래밍), 샘플 (몬테 카를로) 으로 반복하거나 한 단계 (시간 차이) 로 부트스트래프합니다.

```figure
discount-horizon
```

## 건설 해

### 단계 1: 작은 결정적 MDP

4×4 그리드월드, 에이전트 왼쪽 위, 오른쪽 아래로 시작, 1단계 1단계 보상, 액션`{up, down, left, right}`- 보시다시피`code/main.py`- 그래

```python
GRID = 4
TERMINAL = (3, 3)
ACTIONS = {"up": (-1, 0), "down": (1, 0), "left": (0, -1), "right": (0, 1)}

def step(state, action):
    if state == TERMINAL:
        return state, 0.0, True
    dr, dc = ACTIONS[action]
    r, c = state
    nr = min(max(r + dr, 0), GRID - 1)
    nc = min(max(c + dc, 0), GRID - 1)
    return (nr, nc), -1.0, (nr, nc) == TERMINAL
```

5개의 선, 즉 전체 환경, 결정적인 전환, 일정 단계 형벌, 흡수적인 최종 상태.

### 2단계: 정책의 시행

정책은 상태에서 행동 분포에 대한 기능입니다. 가장 간단한 것은 일률적인 무작위입니다.

```python
def uniform_policy(state):
    return {a: 0.25 for a in ACTIONS}

def rollout(policy, max_steps=200):
    s, total, steps = (0, 0), 0.0, 0
    for _ in range(max_steps):
        a = sample(policy(s))
        s, r, done = step(s, a)
        total += r
        steps += 1
        if done:
            break
    return total, steps
```

1000번 무작위 정책을 실행하세요. 이 4×4 보드에 대한 평균 수익은 -60~ -80 정도입니다. 최적의 수익은 -6 (직선 경로 아래로 오른쪽으로) 입니다. 그 격차를 닫는 것은 9단계에서 모든 것입니다.

### 3단계: 계산`V^π`바로 벨먼 방정식

작은 MDP에 대해 벨먼 방정식은 선형 시스템입니다. 수록 상태, 기대를 적용, 값이 변경되는 것을 멈추기 전까지 반복합니다.

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in all_states()}
    while True:
        delta = 0.0
        for s in all_states():
            if s == TERMINAL:
                continue
            v = 0.0
            for a, pi_a in policy(s).items():
                s_next, r, _ = step(s, a)
                v += pi_a * (r + gamma * V[s_next])
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

이것은 반복적인 정책 평가입니다. 그것은 Sutton & Barto의 첫 번째 알고리즘이며 다음의 모든 RL 방법의 이론적 기초입니다.

### 4단계:`γ`물리적인 의미의 하이퍼파라메터입니다

효과적 지평은 대략적으로$1 / (1 - \gamma)$-$\gamma = 0.9$→ 10단계$\gamma = 0.99$→ 100발$\gamma = 0.999$1000발 정도가 됩니다.

너무 낮고 에이전트가 근경적으로 행동합니다. 너무 높고 신용 할당이 험난하게됩니다. 왜냐하면 많은 초기 단계가 먼 미래의 보상에 대한 책임을 공유하기 때문입니다. LLM RLHF는 일반적으로 $\gamma = 1$에피소드가 짧고 제한적이기 때문에 제어 작업은`0.95–0.99`. 장평선 전략 게임 사용`0.999`- 그래

## 함정

- **Non-Markovian state.**마지막 3가지 관찰이 결정될 필요가 있다면, "상태"는 현재 관찰에만 해당되지 않습니다. 수정: 스택 프레임 (Atari 스택 4의 DQN) 또는 반복 상태를 사용하십시오 (LSTM/GRU)
- **Sparse rewards.**이득 전용 보상 은 큰 상태 공간 에서 학습 을 거의 불가능 하게 한다. 형상 보상 (중간 신호) 또는 모방 과 함께 시작 (단계 9 · 09).
- **Reward hacking.**프록시 보너스를 최적화하면 병리학적 행동을 유발합니다. 오픈AI의 보트 레이싱 에이전트는 경주를 끝내는 대신 영원히 파워업을 수집하는 원으로 회전합니다. 항상 대상을 목표 결과에 따라 정의하십시오. 프록시가 아닙니다.
- **Discount mis-spec.** $\gamma = 1$무한한 지평선 작업에서 모든 값이 무한합니다. 항상 무한한 지평선 또는$\gamma < 1$- 그래
- **Reward scale.**{+100, -100} 대 {+1, -1}의 보상으로 동일한 최적의 정책이 있지만 크게 다른 기하급수 크기가 나타납니다.`[-1, 1]`- PPO/DQN에 연결하기 전에

## 사용 하 고

2026 스택은 모든 RL 파이프라인을 MDP로 줄이고 코드에 닿기 전에:

| Situation | State | Action | Reward | γ |
|-----------|-------|--------|--------|---|
| Control (locomotion, manipulation) | Joint angles + velocities | Continuous torques | Task-specific shaped | 0.99 |
| Games (chess, Go, poker) | Board + history | Legal move | Win=+1 / loss=-1 | 1.0 (finite) |
| Inventory / pricing | Stock + demand | Order qty | Revenue - cost | 0.95 |
| RLHF for LLMs | Context tokens | Next token | Reward-model score at end | 1.0 (episode ~200 tokens) |
| GRPO for reasoning | Prompt + partial response | Next token | Verifier 0/1 at end | 1.0 |

훈련 루프를 작성하기 전에 다섯 개의 튜플을 작성하십시오. 대부분의 "RL가 작동하지 않습니다" 버그 보고서는 종이 위에 깨진 MDP 공식으로 이어집니다.

## 선박

`outputs/skill-mdp-modeler.md`이 부분의 본문은

```markdown
---
name: mdp-modeler
description: Given a task description, produce a Markov Decision Process spec and flag formulation risks before training.
version: 1.0.0
phase: 9
lesson: 1
tags: [rl, mdp, modeling]
---

Given a task (control / game / recommendation / LLM fine-tuning), output:

1. State. Exact feature vector or tensor spec. Justify Markov property.
2. Action. Discrete set or continuous range. Dimensionality.
3. Transition. Deterministic, stochastic-with-known-model, or sample-only.
4. Reward. Function and source. Sparse vs shaped. Terminal vs per-step.
5. Discount. Value and horizon justification.

Refuse to ship any MDP where the state is non-Markovian without explicit mention of frame-stacking or recurrent state. Refuse any reward that was not defined in terms of the target outcome. Flag any `γ ≥ 1.0` on an infinite-horizon task. Flag any reward range >100x the typical step reward as a likely gradient-explosion source.
```

## 운동

1. **Easy.**4×4 그리드월드와 무작위 정책 배포를 구현합니다`code/main.py`10,000개의 에피소드를 실행하고, 평균 및 STD를 보고하고, 최적의 수익률을 비교해 보세요.
2. **Medium.**달아`policy_evaluation`$\gamma \in \lbrace 0.5, 0.9, 0.99 \rbrace$유니폼 무작위 정책에 대해`V`각 4 × 4 그리드로서. 터미널 근처의 상태 값이 더 큰 것을 더 빨리 증가하는 이유를 설명하십시오.$\gamma$- 그래
3. **Hard.**그릿월드를 스톡하스틱으로 돌리: 각 액션은 확률로 인접한 방향으로 미끄러집니다 $p = 0.1$- 통일 정책에 대한 재평가`V[start]`더 나아질까요?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| MDP | "Reinforcement learning setup" | Tuple $(S, A, P, R, \gamma)$ satisfying the Markov property. |
| State | "What the agent sees" | Sufficient statistic for future dynamics under the chosen policy class. |
| Policy | "Agent's behavior" | Conditional distribution $\pi(a \mid s)$ or deterministic map $s \to a$. |
| Return | "Total reward" | Discounted sum $\sum \gamma^t r_t$ from the current step. |
| Value | "How good a state is" | Expected return under $\pi$ starting from $s$. |
| Q-value | "How good an action is" | Expected return under $\pi$ starting from $s$ with first action $a$. |
| Bellman equation | "Dynamic programming recursion" | Fixed-point decomposition of value / Q into one-step reward plus discounted successor value. |
| Discount $\gamma$ | "Future vs present" | Geometric weight on far-future reward; effective horizon $\approx 1/(1-\gamma)$. |

## 더 많은 읽기

- [Sutton & Barto (2018). Reinforcement Learning: An Introduction, 2nd ed.](http://incompleteideas.net/book/RLbook2020.pdf) 교과서. 3장에서는 MDP와 벨먼 방정식을 다루고, 1장에서는 다음 수업에 기초하는 보상 가설을 동기화한다.
- [Bellman (1957). Dynamic Programming](https://press.princeton.edu/books/paperback/9780691146683/dynamic-programming) 벨만 방정식의 기원은
- [OpenAI Spinning Up — Part 1: Key Concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) 깊은 RL 각에서 간결한 MDP 프라이머.
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) MDP와 정확한 해결 방법들에 대한 운영 연구 참조.
- [Littman (1996). Algorithms for Sequential Decision Making (PhD thesis)](https://cs.brown.edu/media/filer_public/d1/a6/d1a6f66a-289a-4b81-9596-417114843489/littman.pdf) 역동적 프로그래밍 전문 분야로서 MDP의 가장 깨끗한 추출
