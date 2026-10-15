# 동적 프로그래밍  정책 반복 & 가치 반복

> 다이내믹 프로그래밍은 속임수와 RL입니다. 당신은 이미 전환과 보상 기능을 알고 있습니다. 당신은 단지 Bellman 방정식을 반복하기까지$V$또는$\pi$그것은 샘플링 기반의 모든 방법이 접근하려고 하는 기준입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs)
**Time:** ~75 minutes

## 문제

알려진 모델이 있는 MDP를 가지고 있습니다.$P(s' \mid s, a)$그리고$R(s, a, s')$어떤 상태 행동 쌍에도. 수록 관리자는 수요 분포를 알고 있습니다. 보드 게임은 결정적인 전환을 가지고 있습니다. 그리드 월드는 파이썬의 네 줄입니다. 당신은 * 모델 *

모델 무료 RL (Q-learning, PPO, REINFORCE) 는 당신이 모델을 가지고 있지 않은 경우에 발명되었습니다. 당신은 환경을 통해 샘플을 얻을 수 있습니다. 그러나 당신이 그것을 가지고있을 때, 더 빠르고 더 나은 방법들이 있습니다. 동적 프로그래밍. 벨먼은 1957 년에 설계했습니다. 그들은 여전히 정확성을 정의합니다. 사람들이 "이 MDP에 대한 최적 정책"이라고 할 때, 그들은 정책 DP가 돌아올 것을 의미합니다.

2026년에 세 가지 이유로 필요하죠. 첫째, RL 연구의 모든 테이블 환경 (그리드월드, 프롤즈레이크, 클리프 워킹) 은 황금 표준 정책을 만들기 위해 DP로 해결됩니다. 둘째, 정확한 값은 샘플링 방법을 * 디버깅 할 수 있습니다.$V^{\ast}(s_0)$3번째, 현대적인 오프라인 RL와 계획 방법 (MCTS, AlphaZero의 검색, 9 · 10 단계의 모델 기반 RL) 은 학습된 또는 주어진 모델에 대해 벨만 백업을 반복합니다.

## 개념

![Policy iteration and value iteration, side by side](../assets/dp.svg)

**Two algorithms, both fixed-point iteration on Bellman.**

**Policy iteration.**정책이 바뀌지 않는 한 두 단계를 순차적으로 수행합니다.

1. *평가를*: 주어진 정책$\pi$, 계산$V^\pi$반복적으로 적용함으로써$V(s) \leftarrow \sum_a \pi(a \mid s) \sum_{s',r} P(s',r \mid s,a) [r + \gamma V(s')]$이 둘이 합쳐지는 때까지
2. *개선:* 제공$V^\pi$, 제조$\pi$탐욕적인 W.R.T.$V^\pi$이 책:$\pi(s) \leftarrow \arg\max_a \sum_{s',r} P(s',r \mid s,a) [r + \gamma V(s')]$- 그래

(a) 개선 단계마다$\pi$동일하거나 엄격히 증가합니다$V^\pi$어떤 상태에서는 (b) 결정적 정책의 공간이 한정되어 있다. 보통 큰 상태 공간에서도 ~520의 외부 반복으로 합쳐진다.

**Value iteration.**평가와 개선이 하나의 스윙으로 붕괴됩니다. 벨만 * 최적화 * 방정식을 적용하십시오:

```math
V(s) \leftarrow \max_a \sum_{s',r} P(s',r \mid s,a) [r + \gamma V(s')]
```

반복해서 $\max_s \lvert V_{\text{new}}(s) - V(s) \rvert < \epsilon$. 탐욕적인 행동을 취함으로써 정책을 최종적으로 추출합니다. 반복당 엄격히 더 빠른  내부 평가 루프  하지만 일반적으로 더 많은 반복이 konverge 할 필요가 있습니다.

**Generalized policy iteration (GPI).**통일 프레임링. 가치 기능과 정책은 양방향 개선 루프에 잠겨있다. 상호 일관성을 향하는 두 가지 방법을 (동동화 값 반복, 수정 정책 반복, Q-학습, 배우 비판, PPO) 은 GPI의 예이다.

**Why $\gamma < 1$ matters.**벨먼 운영자는$\gamma$-sup-norm의 수축:$\lVert T V - T V' \rVert_\infty \le \gamma \lVert V - V' \rVert_\infty$. 수축은 독특한 고정점과 기하학적 공감대를 의미한다.$\gamma < 1$그리고 당신은 보증을 잃습니다. 당신은 한정된 지평이나 흡수성 최종 상태를 필요로 합니다.

```figure
value-iteration-gamma
```

## 건설 해

### 단계 1: GridWorld MDP 모델을 구축

1학습에서 같은 4×4 그리드월드를 사용해서, 우리는 확률로`0.1`대원들은 무작위로 수직 방향으로 미끄러집니다.

```python
SLIP = 0.1

def transitions(state, action):
    if state == TERMINAL:
        return [(state, 0.0, 1.0)]
    outcomes = []
    for direction, prob in action_probs(action):
        outcomes.append((apply_move(state, direction), -1.0, prob))
    return outcomes
```

`transitions(s, a)` 목록을 반환합니다`(s', r, p)`- 이건 전체 모델입니다.

### 단계 2: 정책 평가

정책에 따라`π(s) = {action: prob}`, 벨먼 방정식을 반복해서 $V$움직임을 멈추는 것:

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = sum(pi_a * sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a))
                   for a, pi_a in policy(s).items())
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

### 3단계: 정책 개선

대체$\pi$탐욕적인 정책과 함께$V$- 만약$\pi$변하지 않았죠. 다시 돌아왔죠.

```python
def policy_improvement(V, gamma=0.99):
    new_policy = {}
    for s in states():
        best_a = max(
            ACTIONS,
            key=lambda a: sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a)),
        )
        new_policy[s] = best_a
    return new_policy
```

### 4단계: 다

```python
def policy_iteration(gamma=0.99):
    policy = {s: "up" for s in states()}   # arbitrary start
    for _ in range(100):
        V = policy_evaluation(lambda s: {policy[s]: 1.0}, gamma)
        new_policy = policy_improvement(V, gamma)
        if new_policy == policy:
            return V, policy
        policy = new_policy
```

4×4: 46 외변의 전형적인 공렴. 출력 $V^{\ast}(0,0) \approx -6$그리고 단계의 숫자를 엄격히 줄이는 정책입니다.

### 단계 5: 값 반복 (하나 루프 버전)

```python
def value_iteration(gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = max(sum(p * (r + gamma * V[s_prime])
                       for s_prime, r, p in transitions(s, a))
                   for a in ACTIONS)
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            break
    policy = policy_improvement(V, gamma)
    return V, policy
```

같은 고정된 점, 코드 줄이 적어

## 함정

- **Forgetting to handle terminals.**벨만을 흡수 상태로 적용하면, 여전히 "최고의 동작"을 감지합니다.`if s == terminal: V[s] = 0`- 그래
- **Sup-norm vs L2 convergence.**사용`max |V_new - V|`이론적으로 보장되는 것은 수급 기준에 달려 있습니다.
- **In-place vs synchronous updates.**업데이트`V[s]`이 장소 (가우스-세일) 는 별도의 `V_new`(Jacobi) 생산 코드 사용 장소
- **Policy ties.**만약 두 액션이 같은 Q 값을 가지고 있다면`argmax`이변마다 다른 방식으로 넥타이를 끊을 수 있어 "정책 안정" 체크가 흔들리게 된다.
- **State-space explosion.**DP는$O(\lvert S \rvert \cdot \lvert A \rvert)$1 건의 스파이. ~ 107 건의 상태까지 작동합니다. 그 외에도 함수 근접이 필요합니다. (단계 9 · 05 이후).

## 사용 하 고

2026년, DP는 계획자의 정확성 기준과 내부 루프입니다.

| Use case | Method |
|----------|--------|
| Solve a small tabular MDP exactly | Value iteration (simpler) or policy iteration (fewer outer steps) |
| Verify a Q-learning / PPO implementation | Compare to DP-optimal $V^{\ast}$ on a toy environment |
| Model-based RL (Phase 9 · 10) | Bellman backup on a learned transition model |
| Planning in AlphaZero / MuZero | Monte Carlo Tree Search = async Bellman backup |
| Offline RL (CQL, IQL) | Conservative Q-iteration — DP with a penalty on OOD actions |

"최적 값 함수"라고 말하는 때마다, 그들은 "DP 고정점"을 의미합니다.$V^{\ast}$또는$Q^{\ast}$이 루프를 상상해보세요.

## 선박

`outputs/skill-dp-solver.md`이 부분의 본문은

```markdown
---
name: dp-solver
description: Solve a small tabular MDP exactly via policy iteration or value iteration. Report convergence behavior.
version: 1.0.0
phase: 9
lesson: 2
tags: [rl, dynamic-programming, bellman]
---

Given an MDP with a known model, output:

1. Choice. Policy iteration vs value iteration. Reason tied to |S|, |A|, γ.
2. Initialization. V_0, starting policy. Convergence sensitivity.
3. Stopping. Sup-norm tolerance ε. Expected number of sweeps.
4. Verification. V*(s_0) computed exactly. Greedy policy extracted.
5. Use. How this baseline will be used to debug/evaluate sampling-based methods.

Refuse to run DP on state spaces > 10⁷. Refuse to claim convergence without a sup-norm check. Flag any γ ≥ 1 on an infinite-horizon task as a guarantee violation.
```

## 운동

1. **Easy.**4×4 GridWorld에서 값 반복을 실행합니다$\gamma \in \lbrace 0.9, 0.99 \rbrace$얼마나 많은 건 $\max \lvert \Delta V \rvert < 10^{-6}$?$V^{\ast}$4x4 그리드처럼
2. **Medium.**정책 반복과 값 반복을 비교하여 * 스토카스틱 * GridWorld (스립 확률 `0.1`수: 스와이즈, 벽 시계 시간, 최종 $V^{\ast}(0,0)$이변에서 더 빨리 합쳐지는 것이?
3. **Hard.**수정된 정책 반복을 생성: 평가 단계에서는 실행만 합니다 $k$이 이 이 이 이 이$V^{\ast}(0,0)$오류 vs$k$$k \in \lbrace 1, 2, 5, 10, 50 \rbrace$- 평가를/개선을 위한 대가에서 곡선은 무엇을 말해줍니다?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy iteration | "DP algorithm" | Alternating evaluation ($V^\pi$) and improvement (greedy $\pi$ w.r.t. $V^\pi$) until the policy stops changing. |
| Value iteration | "Faster DP" | Bellman optimality backup applied in one sweep; converges to $V^{\ast}$ geometrically. |
| Bellman operator | "The recursion" | $(T V)(s) = \max_a \sum P (r + \gamma V(s'))$; a $\gamma$-contraction in sup-norm. |
| Contraction | "Why DP converges" | Any operator $T$ with $\lVert T x - T y \rVert \le \gamma \lVert x - y \rVert$ has a unique fixed point. |
| GPI | "Everything is DP" | Generalized Policy Iteration: any method driving $V$ and $\pi$ to mutual consistency. |
| Synchronous update | "Jacobi-style" | Use old $V$ throughout a sweep; cleanly analyzable but slower. |
| In-place update | "Gauss-Seidel-style" | Use $V$ as it's being updated; converges faster in practice. |

## 더 많은 읽기

- [Sutton & Barto (2018). Ch. 4 — Dynamic Programming](http://incompleteideas.net/book/RLbook2020.pdf) 정책 반복과 가치 반복의 가전적인 제시
- [Bertsekas (2019). Reinforcement Learning and Optimal Control](http://www.athenasc.com/rlbook_athena.html) 수축 지도 논리들에 대한 엄격한 처리.
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) 정책 반복 및 그 공감 분석을 수정했습니다.
- [Howard (1960). Dynamic Programming and Markov Processes](https://mitpress.mit.edu/9780262582300/dynamic-programming-and-markov-processes/) 원래 정책 반복 논문
- [Bertsekas & Tsitsiklis (1996). Neuro-Dynamic Programming](http://www.athenasc.com/ndpbook.html) 다음 수업마다 사용되는 DP에서 대략-DP/깊은 RL까지의 다리.
