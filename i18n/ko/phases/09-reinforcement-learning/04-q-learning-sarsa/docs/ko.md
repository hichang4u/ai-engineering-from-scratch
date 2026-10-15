# 시간적 차이  Q-Learning & SARSA

> 몬테카를로는 에피소드가 끝날 때까지 기다립니다. 다음 가치 추정치를 부트스트래핑하여 TD가 모든 단계를 업데이트합니다. Q-학습은 정책 외의 긍정적이고, SARSA는 정책 내의 신중합니다. 둘 다 하나의 코드 라인입니다. 이 단계에서 두 가지 모두 모든 딥-RL 메소드를 뒷받침합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming), Phase 9 · 03 (Monte Carlo)
**Time:** ~75 minutes

## 문제

몬테카를로는 두 가지 비용이 많이 들지만 작동합니다. 그것은 종료되는 에피소드가 필요합니다. 그리고 최종 반환이 도착한 후에야 업데이트됩니다. 당신의 에피소드는 1,000 단계라면 MC는 1,000 단계가 기다리고 있습니다.

동적 프로그래밍은 반대 프로파일을 가지고 있습니다.

시간차별 (TD) 학습은 차이를 나눕니다.$(s, a, r, s')$, 한 단계의 목표를 형성합니다$r + \gamma V(s')$그리고 밀어$V(s)$모델도 없고, 완전한 에피소드도 없고, 대략적인$V$RHS에 대한, 하지만 MC와 온라인 업데이트보다 극적으로 낮은 변동 단계 1.

이것은 모든 현대 RL  DQN, A2C, PPO, SAC 이 회전하는 중추입니다. 나머지 9 단계는 이 수업에서 작성할 한 단계 TD 업데이트 위에 구축된 함수 추대와 트릭의 층입니다.

## 개념

![Q-learning vs SARSA: off-policy max vs on-policy Q(s', a')](../assets/td.svg)

**The TD(0) update for V:**

```math
V(s) \leftarrow V(s) + \alpha [r + \gamma V(s') - V(s)]
```

          $\delta = r + \gamma V(s') - V(s)$. 그것은 온라인 아날로그입니다$G_t - V(s_t)$MC에서 konvergence가 요구됩니다$\alpha$로빈스-몬로 ($\sum \alpha = \infty$$\sum \alpha^2 < \infty$) 그리고 모든 주들은 무한히 자주 방문했습니다.

**Q-learning.**정책 외의 TD 제어 방법:

```math
Q(s, a) \leftarrow Q(s, a) + \alpha [r + \gamma \max_{a'} Q(s', a') - Q(s, a)]
```

`max`* 탐욕* 정책이 $s'$그 분해는 Q 학습을 가능하게 합니다.$Q^{\ast}$에-고비 ( ε-greedy) 를 통해 탐구하는 동안. Mnih et al. (2015) 은 이것을 아타리 (Lesson 05) 에서 깊이 있는 Q 학습으로 변환했습니다.

**SARSA.**정책에 관한 TD 방법:

```math
Q(s, a) \leftarrow Q(s, a) + \alpha [r + \gamma Q(s', a') - Q(s, a)]
```

이름은 튜플입니다$(s, a, r, s', a')$SARSA는 이 행동을 이용합니다$a'$에이전트가 다음으로 니다, 탐욕적인 사람이 아닙니다`argmax`$Q^\pi$뭐든 탐욕적인$\pi$실행 중인, 그 한계에 $\epsilon \to 0$$Q^{\ast}$- 그래

**The cliff-walking difference.**클래식 클립 걷기 작업 (fall-off-cliff = reward -100) 에서, Q-learning은 클립 가장자리에 따라 최적의 경로를 학습하지만 때때로 탐구 중에 페널티를 취합니다. SARSA는 탐구 소음을 Q-값에 포함하기 때문에 클립에서 한 발 더 안전한 경로를 학습합니다. 훈련으로, 둘 다 최적의 경로에 도달합니다.$\epsilon \to 0$실제적으로는 중요한 것은 탐사가 실제로 배치될 때 SARSA의 행동은 더 보수적입니다.

**Expected SARSA.**대체$Q(s', a')$예상값이 $\pi$이 부분의 본문은

```math
Q(s, a) \leftarrow Q(s, a) + \alpha [r + \gamma \sum_{a'} \pi(a' \mid s') Q(s', a') - Q(s, a)]
```

SARSA보다 낮은 변동 ($a'$), 같은 정책 목표. 종종 현대 교과서에서 기본입니다.

**n-step TD and TD(λ).**TD(0) 와 MC 사이에 대기하여 중계합니다 $n$부트 스트래핑 전에 걸리는 단계.$n=1$TD입니다$n=\infty$MC. TD(λ) 평균이 모든 $n$기하학적 무게를 가진$(1-\lambda)\lambda^{n-1}$. 대부분의 깊은 RL 사용$n$3~20분 사이입니다.

```figure
qlearning-gridworld
```

## 건설 해

### 단계 1: 야심주의 정책에 대한 SARSA

```python
def sarsa(env, episodes, alpha=0.1, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})

    def choose(s):
        if random() < epsilon:
            return choice(ACTIONS)
        return max(Q[s], key=Q[s].get)

    for _ in range(episodes):
        s = env.reset()
        a = choose(s)
        while True:
            s_next, r, done = env.step(s, a)
            a_next = choose(s_next) if not done else None
            target = r + (gamma * Q[s_next][a_next] if not done else 0.0)
            Q[s][a] += alpha * (target - Q[s][a])
            if done:
                break
            s, a = s_next, a_next
    return Q
```

8개의 라인. Q-학습과 유일한 차이점은 목표 라인입니다.

### 단계 2: Q 학습

```python
def q_learning(env, episodes, alpha=0.1, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})
    for _ in range(episodes):
        s = env.reset()
        while True:
            a = choose(s, Q, epsilon)
            s_next, r, done = env.step(s, a)
            target = r + (gamma * max(Q[s_next].values()) if not done else 0.0)
            Q[s][a] += alpha * (target - Q[s][a])
            if done:
                break
            s = s_next
    return Q
```

`max`그 하나의 상징은 정책과 정책 밖의 차이입니다.

### 단계 3: 학습 곡선

100 에피소드당 수익률을 추적하는 평균. Q-학습은 간단한 결정적 그리드월드에서 더 빨리 konverges; SARSA는 클립 워킹에서 더 보수적입니다.`code/main.py`2천개의 에피소드 후 모두 거의 최적화되었습니다$\alpha=0.1, \epsilon=0.1$- 그래

### 4단계: DP 진실과 비교

실행 값 반복 (강좌 02) 을 얻으려면$Q^{\ast}$체크$\max_{s,a} \lvert Q_{\text{learned}}(s,a) - Q^{\ast}(s,a) \rvert$. 건강한 표형 TD 대리인이 `~0.5`4×4 그리드월드에서 10,000개의 에피소드를 찍은 후

## 함정

- **Initial Q values matter.**낙관적인 초기 ($Q = 0$비관적인 시작은 탐욕적인 정책을 영원히 함락시킬 수 있습니다.
- **α schedule.**항상$\alpha$정지 상태가 아닌 문제로 잘 처리됩니다.$\alpha_n = 1/n$이론적으로 공감각을 나타내지만 실제적으로는 너무 느려집니다$\alpha$`[0.05, 0.3]`학습 곡선을 감시하고
- **ε schedule.**높은 시작 ($\epsilon=1.0$), 붕괴$\epsilon=0.05$. "GLIE" (무궁무진한 탐구와 한계에 탐욕) 은 공감 조건입니다.
- **Max bias in Q-learning.**`max`$Q$과다평가로 이어집니다. Hasselt의 두 번째 Q 학습 (DDDQN에서 수업 05) 은 두 개의 Q 테이블로 문제를 해결합니다.
- **Non-terminating episodes.**TD는 터미널 없이 학습할 수 있지만, 단계들을 캡하거나 캡에서 부트스트랩을 올바르게 처리해야 합니다. 표준: 캡을 터미널이 아닌 것으로 취급하고, 계속 부트스트랩을 해야 합니다.
- **State hashing.**주가 튜플/텐서라면 해쉬블 키를 사용한다 (투플, 리스트가 아니라, 튜플의 플롯이 둥글고, 원료가 아니다).

## 사용 하 고

2026년 TD의 풍경:

| Task | Method | Reason |
|------|--------|--------|
| Small tabular environments | Q-learning | Learns optimal policy directly. |
| On-policy safety-critical | SARSA / Expected SARSA | Conservative during exploration. |
| High-dimensional state | DQN (Phase 9 · 05) | Neural-net Q-function with replay and target net. |
| Continuous actions | SAC / TD3 (Phase 9 · 07) | TD update on a Q-network; policy net emits actions. |
| LLM RL (reward-model-based) | PPO / GRPO (Phase 9 · 08, 12) | Actor-critic with TD-style advantage via GAE. |
| Offline RL | CQL / IQL (Phase 9 · 08) | Q-learning with conservative regularization. |

2026년 논문에서 읽은 "RL"의 90%는 Q-learning 또는 SARSA의 일부 개발입니다. 더 깊이 읽기 전에 손가락에 있는 표기 업데이트를 이해하세요.

## 선박

`outputs/skill-td-agent.md`이 부분의 본문은

```markdown
---
name: td-agent
description: Pick between Q-learning, SARSA, Expected SARSA for a tabular or small-feature RL task.
version: 1.0.0
phase: 9
lesson: 4
tags: [rl, td-learning, q-learning, sarsa]
---

Given a tabular or small-feature environment, output:

1. Algorithm. Q-learning / SARSA / Expected SARSA / n-step variant. One-sentence reason tied to on-policy vs off-policy and variance.
2. Hyperparameters. α, γ, ε, decay schedule.
3. Initialization. Q_0 value (optimistic vs zero) and justification.
4. Convergence diagnostic. Target learning curve, `|Q - Q*|` check if DP is possible.
5. Deployment caveat. How will exploration behave at inference? Is SARSA's conservatism needed?

Refuse to apply tabular TD to state spaces > 10⁶. Refuse to ship a Q-learning agent without a max-bias caveat. Flag any agent trained with ε held at 1.0 throughout (no exploitation phase).
```

## 운동

1. **Easy.**Q-learning 및 SARSA를 4×4 GridWorld에서 구현합니다. 2,000 에피소드 동안 학습 곡선을 (100 에피소드당 평균 수익률) 계획합니다. 누가 더 빨리 konverges합니까?
2. **Medium.**클립 걸음 환경 (4×12, 마지막 줄은 클립과 보상 -100 및 시작으로 재설정) 을 구축하십시오. Q-러닝과 SARSA 최종 정책을 비교하십시오. 각 경로를 스크린샷으로 촬영하십시오. 클립에 가장 가까운 곳은 무엇입니까?
3. **Hard.**두 번씩 Q 학습을 실시합니다.$\sigma=5$단계별 보상으로 추가) 과부평가된 Q-학습을 나타냅니다.$V^{\ast}(0,0)$이중 Q 학습은 그렇지 않습니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| TD error | "The update signal" | $\delta = r + \gamma V(s') - V(s)$, the bootstrapped residual. |
| TD(0) | "One-step TD" | Update after every transition using only the next state's estimate. |
| Q-learning | "Off-policy RL 101" | TD update with `max` over next-state actions; learns $Q^{\ast}$ regardless of behavior policy. |
| SARSA | "On-policy Q-learning" | TD update using the actual next action; learns $Q^\pi$ for current ε-greedy π. |
| Expected SARSA | "The low-variance SARSA" | Replace sampled $a'$ with its expectation under π. |
| GLIE | "Correct exploration schedule" | Greedy in the Limit with Infinite Exploration; needed for Q-learning convergence. |
| Bootstrapping | "Using current estimate in the target" | What distinguishes TD from MC. Source of bias but massive variance reduction. |
| Maximization bias | "Q-learning overestimates" | `max` over noisy estimates is upward-biased; fixed by Double Q-learning. |

## 더 많은 읽기

- [Watkins & Dayan (1992). Q-learning](https://link.springer.com/article/10.1007/BF00992698) 본문과 공감증
- [Sutton & Barto (2018). Ch. 6 — Temporal-Difference Learning](http://incompleteideas.net/book/RLbook2020.pdf) TD(0), SARSA, Q-학습, 예상 SARSA.
- [Hasselt (2010). Double Q-learning](https://papers.nips.cc/paper_files/paper/2010/hash/091d584fced301b442654dd8c23b3fc9-Abstract.html) 최대화 편향을 수정합니다.
- [Seijen, Hasselt, Whiteson, Wiering (2009). A Theoretical and Empirical Analysis of Expected SARSA](https://ieeexplore.ieee.org/document/4927542) 예상 SARSA 동기부여
- [Rummery & Niranjan (1994). On-line Q-learning using connectionist systems](https://www.researchgate.net/publication/2500611_On-Line_Q-Learning_Using_Connectionist_Systems) SARSA (이 때 "변화 된 연결주의 Q 학습"이라고 불렸던) 를 만들어낸 논문.
- [Sutton & Barto (2018). Ch. 7 — n-step Bootstrapping](http://incompleteideas.net/book/RLbook2020.pdf) TD(0) 에서 TD(n) 로 일반화하여 Q-학습에서 자격자료로 이어지고, 나중에 PPO에서 GAE로 이어집니다.
