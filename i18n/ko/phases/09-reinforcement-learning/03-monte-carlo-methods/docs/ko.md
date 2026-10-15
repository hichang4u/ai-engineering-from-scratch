# 몬테카로 방법  완전 에피소드 에서 배우는 방법

> 동적 프로그래밍은 모델이 필요해요. 몬테카로에는 에피소드만 필요해요. 정책을 실행하고, 수익을 보고, 평균적으로 계산해 보세요. RL에서 가장 간단한 아이디어는 이고 모든 것을 하류로 풀 수 있는 아이디어입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming)
**Time:** ~75 minutes

## 문제

다이내믹 프로그래밍은 우아하지만, 질문할 수 있다고 가정합니다.$P(s' \mid s, a)$모든 상태와 행동에 대해 거의 아무것도 실제 세계에서 그렇게 작동하지 않습니다. 로봇은 공동의 토크 후 카메라 픽셀에 대한 분포를 분석적으로 계산 할 수 없습니다. 가격 알고리즘은 모든 가능한 고객 반응에 통합 할 수 없습니다. LLM는 토큰 후 가능한 모든 연속을 수립 할 수 없습니다.

환경으로부터 샘플을 내기 위한 능력만 필요한 방법이죠.`s_0, a_0, r_1, s_1, a_1, r_2, …, s_T`- 값에 대한 추정을 해봐요.

DP에서 MC로의 전환은 철학적으로 중요합니다. 우리는 * 알려진 모델 + 정확한 백업*에서 * 샘플 로루트 + 평균 수익*로 이동합니다. 변동률이 급격히 증가하지만 적용 가능성은 폭발적으로 증가합니다. 이 수업 이후 모든 RL 알고리즘은 TD, Q-learning, REINFORCE, PPO, GRPO 이 몬테카롤로 추정치입니다.

## 개념

![Monte Carlo: rollout, compute returns, average; first-visit vs every-visit](../assets/monte-carlo.svg)

**The core idea, in one line:** $V^\pi(s) = \mathbb E_\pi[G_t \mid s_t = s] \approx (1/N) \sum_i G^{(i)}(s)$어디$G^{(i)}(s)$방문 후의 보고가 관찰됩니다 $s$정책에 따라$\pi$- 그래

**First-visit vs every-visit MC.**주 방문한 에피소드를 고려하면$s$여러 번, 첫 방문 MC는 첫 방문에서 반환을 계산합니다. 모든 방문 MC는 모든 방문을 계산합니다. 둘 다 한계에 있어서 편향적입니다. 첫 방문은 분석하기 쉽습니다. 모든 방문은 에피소드당 더 많은 데이터를 사용합니다. 일반적으로 실제에서 더 빨리 공감합니다.

**Incremental mean.**모든 수익을 저장하는 대신 실행 평균을 업데이트하십시오:

```math
V_n(s) = V_{n-1}(s) + (1/n) [G_n - V_{n-1}(s)]
```

재조직: $V_{\text{new}} = V_{\text{old}} + \alpha \cdot (\text{target} - V_{\text{old}})$$\alpha = 1/n$          $1/n$일정 단계 크기의 경우$\alpha \in (0, 1)$그리고 당신은 고정되지 않은 MC 추정기를 얻습니다.$\pi$이 움직임은 MC에서 TD로 모든 현대 RL 알고리즘으로의 모든 도약을 의미합니다.

**Exploration is now a problem.**DP는 모든 주들을 수록으로 만났습니다. MC는 국가들의 정책 방문만 볼 수 있습니다.$\pi$정해진 공간의 전체 지역은 샘플을 받아 볼 수 없으며, 그 값의 추정값은 영원히 0에 머물러 있습니다.

1. **Exploring starts.**각각의 에피소드를 무작위 (s, a) 쌍에서 시작하십시오. 보장은 커버리지를 보장합니다. 실제에서는 현실적이지 않습니다 (robot을 임의 상태로 "부턴 설정" 할 수 없습니다).
2. **ε-greedy.**탐욕적인 행동으로, 현재 Q를 지만 확률로$\epsilon$모든 상태 행동 쌍은 무작위로 샘플링됩니다.
3. **Off-policy MC.**행동 정책에 따라 데이터를 수집합니다$\mu$, 목표 정책에 대해 알아내기$\pi$중요성 샘플링을 통해 높은 변수를 얻습니다. 하지만 DQN와 같은 재 재생 버퍼 방법의 연결이 됩니다.

**Monte Carlo Control.**평가 → 개선 → 평가, 정책 반복과 마찬가지로, 하지만 평가는 샘플링 기반입니다:

1. 달아$\pi$에피소드를 찍어봐
2. 업데이트$Q(s, a)$관찰된 결과로부터
3.  $\pi$   $Q$- 그래
4. 다시 말해

$Q^{\ast}$그리고$\pi^{\ast}$가벼운 조건에서 확률 1 (모든 쌍은 무한한 자주 방문되었습니다)$\alpha$로빈스-몬로에게 만족하는

```figure
epsilon-greedy
```

## 건설 해

### 단계 1: 발급 → 목록 (s, a, r)

```python
def rollout(env, policy, max_steps=200):
    trajectory = []
    s = env.reset()
    for _ in range(max_steps):
        a = policy(s)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r))
        s = s_next
        if done:
            break
    return trajectory
```

모델이 없어`env.reset()`그리고`env.step(s, a)`체육관과 같은 인터페이스이지만 벗겨져

### 단계 2: 계산 반환 (반복 스래프)

```python
def returns_from(trajectory, gamma):
    returns = []
    G = 0.0
    for _, _, r in reversed(trajectory):
        G = r + gamma * G
        returns.append(G)
    return list(reversed(returns))
```

한 번만 통과해$O(T)$. 후진 반복$G_t = r_{t+1} + \gamma G_{t+1}$재조합을 피한다.

### 단계 3: 첫 방문 MC 평가

```python
def mc_policy_evaluation(env, policy, episodes, gamma=0.99):
    V = defaultdict(float)
    counts = defaultdict(int)
    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for t, ((s, _, _), G) in enumerate(zip(trajectory, returns)):
            if s in seen:
                continue
            seen.add(s)
            counts[s] += 1
            V[s] += (G - V[s]) / counts[s]
    return V
```

세 줄이 작업을 수행합니다. 첫 방문에서 보이는 상태를 표시하고, 증가수와 업데이트 실행 평균을 표시합니다.

### 단계 4: ε-만만족 MC 통제 (정책에 관한)

```python
def mc_control(env, episodes, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})
    counts = defaultdict(lambda: {a: 0 for a in ACTIONS})

    def policy(s):
        if random() < epsilon:
            return choice(ACTIONS)
        return max(Q[s], key=Q[s].get)

    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for (s, a, _), G in zip(trajectory, returns):
            if (s, a) in seen:
                continue
            seen.add((s, a))
            counts[s][a] += 1
            Q[s][a] += (G - Q[s][a]) / counts[s][a]
    return Q, policy
```

### 단계 5: DP 금 표준에 비교

당신의 MC 추정치$V^\pi$∞ 에피소드로 수업 02의 DP 결과와 일치해야 합니다. 실제: 4×4 GridWorld에서 50,000 에피소드`~0.1`DP 답변의

## 함정

- **Infinite episodes.**MC는 에피소드를 끝낼 필요가 있습니다.`max_steps`그리드월드는 을 정작 곱하기 규칙적인 정책으로 정해 놓습니다.
- **Variance.**MC는 전체 수익을 사용한다. 긴 에피소드에서, 변동은 거대한$V(s_0)$같은 금액으로 TD 방법 (강좌 04) 이 부트스트래핑을 통해
- **State coverage.**넥타이와 함께 한 Q의 탐욕적인 MC는 한 번의 액션을 시도할 것입니다. 당신은 * 탐욕적이어야합니다.
- **Non-stationary policies.**만약$\pi$MC 제어 (MC 제어) 에서의 변화와 같이, 오래된 반환은 다른 정책에서 발생합니다.
- **Off-policy importance sampling.**무게가 $\pi(a \mid s)/\mu(a \mid s)$궤도를 가로질러 곱합니다. 변이는 지평으로 폭발합니다. 결정당 중량 IS를 가진 캡 또는 TD로 전환합니다.

## 사용 하 고

2026년 몬테카로 방법의 역할:

| Use case | Why MC |
|----------|--------|
| Short-horizon games (blackjack, poker) | Episodes terminate naturally; returns are clean. |
| Offline evaluation of a logged policy | Average discounted returns over stored trajectories. |
| Monte Carlo Tree Search (AlphaZero) | MC rollouts from tree leaves guide selection. |
| LLM RL evaluation | Compute average reward over sampled completions for a given policy. |
| Baseline estimation in PPO | The advantage target $A_t = G_t - V(s_t)$ uses an MC $G_t$. |
| Teaching RL | Simplest algorithm that actually works — strip bootstrapping to see the core. |

현대 깊은 RL 알고리즘 (PPO, SAC) 은 순 MC (완전 수익) 와 순 TD (단계 1 단계 부트 스트랩) 를 잇따라$n$- 단계 반환 또는 GAE. 두 최종점은 동일한 추정치의 예제입니다.

## 선박

`outputs/skill-mc-evaluator.md`이 부분의 본문은

```markdown
---
name: mc-evaluator
description: Evaluate a policy via Monte Carlo rollouts and produce a convergence report with DP-comparison if available.
version: 1.0.0
phase: 9
lesson: 3
tags: [rl, monte-carlo, evaluation]
---

Given an environment (episodic, with reset+step API) and a policy, output:

1. Method. First-visit vs every-visit MC. Reason.
2. Episode budget. Target number, variance diagnostic, expected standard error.
3. Exploration plan. ε schedule (if needed) or exploring starts.
4. Gold-standard comparison. DP-optimal V* if tabular; otherwise a bound from a Q-learning / PPO baseline.
5. Termination check. Max-step cap, timeouts, handling of non-terminating trajectories.

Refuse to run MC on non-episodic tasks without a finite horizon cap. Refuse to report V^π estimates from fewer than 100 episodes per state for tabular tasks. Flag any policy with zero-variance actions as an exploration risk.
```

## 운동

1. **Easy.**4×4 그리드월드에서 유니폼 무작위 정책에 대한 첫 방문 MC 평가를 실시하고 10,000 에피소드를 실행합니다.$V(0,0)$대책 응답에 대한 에피소드 수를 함수로
2. **Medium.**                                                    $\epsilon \in \lbrace 0.01, 0.1, 0.3 \rbrace$20만 에피소드 후 평균 수익을 비교해 보세요. 곡선이 어떻게 생겼을까요? 편향 변동의 교류가 어디에 있을까요?
3. **Hard.**중요성 샘플링을 가진 *off-policy* MC를 구현: 일률적인 무작위 정책에 따라 데이터를 수집합니다 $\mu$, 추정$V^\pi$결정적 최적 정책에 대해$\pi$. 평정 IS와 결정별 IS와 중형 IS를 비교해 보세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Monte Carlo | "Random sampling" | Estimate expectations by averaging over iid samples from the distribution. |
| Return $G_t$ | "Future reward" | Sum of discounted rewards from step $t$ to episode end: $\sum_{k\ge 0} \gamma^k r_{t+k+1}$. |
| First-visit MC | "Count each state once" | Only the first visit in an episode contributes to the value estimate. |
| Every-visit MC | "Use all visits" | Every visit contributes; slightly biased but more sample-efficient. |
| ε-greedy | "Exploration noise" | Pick greedy action with prob $1-\epsilon$; random action with prob $\epsilon$. |
| Importance sampling | "Correcting for sampling from the wrong distribution" | Reweight returns by $\pi(a \mid s)/\mu(a \mid s)$ products to estimate $V^\pi$ from $\mu$ data. |
| On-policy | "Learn from my own data" | Target policy = behavior policy. Vanilla MC, PPO, SARSA. |
| Off-policy | "Learn from someone else's data" | Target policy ≠ behavior policy. Importance-sampled MC, Q-learning, DQN. |

## 더 많은 읽기

- [Sutton & Barto (2018). Ch. 5 — Monte Carlo Methods](http://incompleteideas.net/book/RLbook2020.pdf) 가톨릭 치료
- [Singh & Sutton (1996). Reinforcement Learning with Replacing Eligibility Traces](https://link.springer.com/article/10.1007/BF00114726) 첫 방문과 모든 방문 분석
- [Precup, Sutton, Singh (2000). Eligibility Traces for Off-Policy Policy Evaluation](http://incompleteideas.net/papers/PSS-00.pdf) 정책 외 MC 및 변동 통제
- [Mahmood et al. (2014). Weighted Importance Sampling for Off-Policy Learning](https://arxiv.org/abs/1404.6362) 현대 저 변수 IS 추정기
- [Tesauro (1995). TD-Gammon, A Self-Teaching Backgammon Program](https://dl.acm.org/doi/10.1145/203330.203343) MC/TD의 자기 플레이가 초인적 플레이로 접어들기 위한 첫 대규모 경험적 시범이 이 단계의 후반기에 모든 수업의 개념적 전개자입니다.
