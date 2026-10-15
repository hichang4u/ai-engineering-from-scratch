# 배우-비평가 A2C와 A3C

> 재강은 소란적이기 때문에, 학습하는 평론자를 추가해 주세요.$\hat{V}(s)$A2C는 시크로노로 실행하고 A3C는 스레드들을 통해 실행합니다. 둘 다 모든 현대 깊은 RL 방법의 정신적 모델입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (TD Learning), Phase 9 · 06 (REINFORCE)
**Time:** ~75 minutes

## 문제

바닐라 리인포스 효과가 있지만, 그 변수는 끔찍합니다. 몬테카로 돌아옵니다.$G_t$이 두 개의 에피소드 사이에 10배로 변할 수 있습니다.$\nabla \log \pi$평균은 수 천 개의 에피소드를 필요로 하는 gradient estimator를 생성합니다.

변수는 원본을 빼면$b(s_t)$ 학습된 값을 포함한 상태의 모든 함수  기대는 변하지 않고 변동이 감소한다. 가장 잘 처리 가능한 기본 라인은 $\hat{V}(s_t)$이제 양을 곱해봅시다$\nabla \log \pi$이점*:

```math
A(s, a) = G - \hat{V}(s)
```

한 행위는 평균 이상의 수익을 얻으면 좋으며, 아래에서 나쁜 경우도 좋다. 배우-비평가*라는 학문적 평론자를 통해 재강한다. 평론자는 배우에게 낮은 변동률을 가진 교사로 부여한다. 이것은 2015년 이후 모든 심오한 정책 방법 (A2C, A3C, PPO, SAC, IMPALA) 이다.

## 개념

![Actor-critic: policy net plus value net, TD residual as advantage](../assets/actor-critic.svg)

**Two networks, one shared loss:**

- **Actor** $\pi_\theta(a \mid s)$정책. 행동하기 위해 샘플링. 정책 gradient를 훈련.
- **Critic** $V_\phi(s)$: 예상 국가로부터의 수익을 예상. 최소화 훈련$(V_\phi(s) - \text{target})^2$- 그래

**The advantage.**두 가지 표준 양식:

- *MC의 장점:*$A_t = G_t - V_\phi(s_t)$편향적이지 않고 더 높은 변동성
- *TD 장점*$A_t = r_{t+1} + \gamma V_\phi(s_{t+1}) - V_\phi(s_t)$. 편견 (이용)$V_\phi$), 훨씬 낮은 변수.$\delta_t$- 그래

**n-step advantage.**둘 사이를 간섭한다

```math
A_t^{(n)} = r_{t+1} + \gamma r_{t+2} + \ldots + \gamma^{n-1} r_{t+n} + \gamma^n V_\phi(s_{t+n}) - V_\phi(s_t)
```

$n = 1$순수 TD입니다.$n = \infty$대부분의 구현은$n = 5$아타리용$n = 2048$무조코의 PPO를 위해

**Generalized Advantage Estimation (GAE).**Schulman et al. (2016) 는 모든 n 단계의 장점에 대한 기하급수적 중계 평균을 제안했습니다.

```math
A_t^{\text{GAE}} = \sum_{l=0}^{\infty} (\gamma \lambda)^l \delta_{t+l}
```

$\lambda \in [0, 1]$-$\lambda = 0$TD (저 변수, 높은 편향) 이다. $\lambda = 1$MC (고차별, 편향 없는) 이다.$\lambda = 0.95$2026의 기본  음향이 변수/변화 다이얼이 원하는 곳에 있을 때까지

**A2C: synchronous advantage actor-critic.**수집$T$ $N$평행 환경. 각 단계에 대한 장점을 계산합니다. 결합된 배트에 배우와 비평가 업데이트합니다. 반복합니다. A3C의 더 간단하고 확장 가능한 형제자매입니다.

**A3C: asynchronous advantage actor-critic.**Mnih et al. (2016). 스파운 $N$작업자 스레드, 각 작업자가 엔비디아를 실행한다. 각 작업자는 자신의 로롤에서 현지적으로 그레디언트를 계산하고, 그것을 공유 매개 변수 서버에 비동기적으로 적용한다. 재생 버퍼가 필요하지 않습니다. 작업자들은 다른 궤도를 실행함으로써 디코레레이션을 수행합니다. A3C는 규모로 CPU를 훈련시킬 수 있음을 증명했습니다. 2026 년, GPU 기반 A2C (배치 병렬 엔비디아) 는 GPU가 큰 대량을 원하기 때문에 지배합니다.

**The combined loss.**

```math
L(\theta, \phi) = -\mathbb{E}[ A_t \cdot \log \pi_\theta(a_t \mid s_t) ] + c_v \cdot \mathbb{E}[(V_\phi(s_t) - G_t)^2] - c_e \cdot \mathbb{E}[H(\pi_\theta(\cdot \mid s_t))]
```

세 가지 조건: 정책적 계층 손실, 가치 회귀, 엔트로피 보너스.`c_v ~ 0.5``c_e ~ 0.01`가톨릭의 출발점입니다.

```figure
actor-critic
```

## 건설 해

### 단계 1: 비평가

선형 비평가$V_\phi(s) = w \cdot \text{features}(s)$MSE로 업데이트:

```python
def critic_update(w, x, target, lr):
    v_hat = dot(w, x)
    err = target - v_hat
    for j in range(len(w)):
        w[j] += lr * err * x[j]
    return v_hat
```

표적 환경에서는 평론가들이 몇 백 에피소드로 합쳐진다. 아타리에서는 선형 평론자를 공유된 CNN 트렁크 + 가치 헤드로 대체한다.

### 단계 2: n 단계의 이점

길이가 길어지면$T$그리고 붐스트라프 결승전$V(s_T)$이 부분의 본문은

```python
def compute_advantages(rewards, values, gamma=0.99, lam=0.95, last_value=0.0):
    advantages = [0.0] * len(rewards)
    gae = 0.0
    for t in reversed(range(len(rewards))):
        next_v = values[t + 1] if t + 1 < len(values) else last_value
        delta = rewards[t] + gamma * next_v - values[t]
        gae = delta + gamma * lam * gae
        advantages[t] = gae
    returns = [a + v for a, v in zip(advantages, values)]
    return advantages, returns
```

`returns`비판적인 목표입니다.`advantages`이 숫자는 곱하기$\nabla \log \pi$- 그래

### 단계 3: 결합 업데이트

```python
for step_i, (x, a, _r, probs) in enumerate(traj):
    adv = advantages[step_i]
    target_v = returns[step_i]

    # critic
    critic_update(w, x, target_v, lr_v)

    # actor
    for i in range(N_ACTIONS):
        grad_logpi = (1.0 if i == a else 0.0) - probs[i]
        for j in range(N_FEAT):
            theta[i][j] += lr_a * adv * grad_logpi * x[j]
```

정책에 관한 것, 업데이트당 한 번, 배우와 비평가의 학습율을 분리합니다.

### 단계 4: 병렬화 (A3C vs.A2C)

- **A3C:**$N$스레드. 각 자신의 엔비디아와 자신의 전진을 실행. 주기적으로 공유 마스터의 gradient 업데이트를 밀어. 마스터  레이스에는 잠금 없습니다, 그들은 단지 소음을 추가합니다.
- **A2C:**                 $N$하나의 과정의 사례를 포함하여 관찰을 `[N, obs_dim]`배트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트, 패스트,

우리의 장난감 코드는 명확성을 위해 단선으로 되어 있습니다. A2C를 배팅으로 다시 쓰면 3 줄이 니다.

## 함정

- **Critic bias before actor gradient.**만약 평론가가 무작위라면, 그 기준은 정보적이지 않고, 당신은 순수한 소음으로 훈련하고 있습니다. 정책 기하급수를 활성화하기 전에 평론자를 몇 백 단계 동안 따뜻하게 해보세요. 또는 느린 배우 학습 속도를 사용하세요.
- **Advantage normalization.**배트당 평균/단위/std의 0으로 장점을 정상화하고, 거의 0의 비용으로 대량 훈련을 안정시킵니다.
- **Shared trunk.**이미지 입력에 배우와 비평가에 대한 공유 기능 추출기를 사용하십시오. 별도의 헤드. 공유 기능은 두 손실에서 자유 운전입니다.
- **On-policy contract.**A2C는 정확히 한 업데이트를 위해 데이터를 재사용합니다. 더 많은 경우 gradient가 편향됩니다 (중요한 샘플링 수정은 PPO가 추가합니다).
- **Entropy collapse.**    없이$c_e > 0$, 정책은 몇 백 개 업데이트에 거의 결정적인 것으로 변하고 탐색을 멈추게 됩니다.
- **Reward scale.**이점 규모는 보상 규모에 달려 있습니다. 작업 중 일관된 기하급수 규모를 위해 보상을 정상화하십시오.

## 사용 하 고

A2C/A3C는 2026년에 최종 선택이 거의 없습니다. 하지만 그들은 나중에 모든 것이 정교하게 만드는 건축입니다.

| Method | Relation to A2C |
|--------|----------------|
| PPO | A2C + clipped importance ratio for multi-epoch updates |
| IMPALA | A3C + V-trace off-policy correction |
| SAC (Phase 9 · 07) | Off-policy A2C with a soft-value critic (next lesson) |
| GRPO (Phase 9 · 12) | A2C without the critic — group-relative advantage |
| DPO | A2C collapsed into a preference-ranking loss, no sampling |
| AlphaStar / OpenAI Five | A2C with league training + imitation pre-training |

2026년 논문에서 "우익"을 볼 때 배우 평론가들을 생각해보세요.

## 선박

`outputs/skill-actor-critic-trainer.md`이 부분의 본문은

```markdown
---
name: actor-critic-trainer
description: Produce an A2C / A3C / GAE configuration for a given environment, with advantage estimation and loss weights specified.
version: 1.0.0
phase: 9
lesson: 7
tags: [rl, actor-critic, gae]
---

Given an environment and compute budget, output:

1. Parallelism. A2C (GPU batched) vs A3C (CPU async) and the number of workers.
2. Rollout length T. Steps per env per update.
3. Advantage estimator. n-step or GAE(λ); specify λ.
4. Loss weights. `c_v` (value), `c_e` (entropy), gradient clip.
5. Learning rates. Actor and critic (separate if using).

Refuse single-worker A2C on environments with horizon > 1000 (too on-policy, too slow). Refuse to ship without advantage normalization. Flag any run with `c_e = 0` and observed entropy < 0.1 as entropy-collapsed.
```

## 운동

1. **Easy.**MC의 장점을 가진 배우-비평가들을 훈련시키세요$(G_t - V(s_t))$4×4 그리드월드에서 샘플 효율성을 레슨 06에서 실행 중인 평균 기준으로 REINFORCE와 비교하십시오.
2. **Medium.**TD- residue 이점으로 전환$(r + \gamma V(s') - V(s))$이점 배트의 변수를 측정해 보세요.
3. **Hard.**GAE를 시행합니다.$\lambda \in \lbrace 0, 0.5, 0.9, 0.95, 1.0 \rbrace$이 작업에 있어서 편향/변화 단점은 어디인가요?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Actor | "The policy net" | $\pi_\theta(a \mid s)$, updated by policy gradient. |
| Critic | "The value net" | $V_\phi(s)$, updated by MSE regression to returns / TD targets. |
| Advantage | "How much better than average" | $A(s, a) = Q(s, a) - V(s)$ or its estimators. Multiplier for $\nabla \log \pi$. |
| TD residual | "δ" | $\delta_t = r + \gamma V(s') - V(s)$; one-step advantage estimate. |
| GAE | "The interpolation knob" | Exponentially weighted sum of n-step advantages, parameterized by $\lambda$. |
| A2C | "Synchronous actor-critic" | Batched across envs; one gradient step per rollout. |
| A3C | "Async actor-critic" | Worker threads push gradients to a shared param server. Original paper; less common in 2026. |
| Bootstrap | "Use V at the horizon" | Truncate the rollout, add $\gamma^n V(s_{t+n})$ to close the sum. |

## 더 많은 읽기

- [Mnih et al. (2016). Asynchronous Methods for Deep Reinforcement Learning](https://arxiv.org/abs/1602.01783) A3C, 원래의 아싱크 배우-비평 논문.
- [Schulman et al. (2016). High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438) GAE
- [Sutton & Barto (2018). Ch. 13 — Actor-Critic Methods](http://incompleteideas.net/book/RLbook2020.pdf) 기초; 이를 함수 근접에 대한 9장과 결합시켜 비평가자가 신경망이 될 때
- [Espeholt et al. (2018). IMPALA](https://arxiv.org/abs/1802.01561) V-trace 정책 외의 수정으로 확장 가능한 분산 행위자 비평가
- [OpenAI Baselines / Stable-Baselines3](https://stable-baselines3.readthedocs.io/) 생산 A2C/PPO 구현을 읽어볼 가치가 있습니다.
- [Konda & Tsitsiklis (2000). Actor-Critic Algorithms](https://papers.nips.cc/paper/1786-actor-critic-algorithms) 두 번제 스케일 배우-비평 분해의 기본적 인 공렴 결과.
