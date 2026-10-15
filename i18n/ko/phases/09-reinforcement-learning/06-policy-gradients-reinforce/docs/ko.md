# 정책 기하급수  처음부터 재강

> 가치 추정을 중단하십시오. 정책을 직접 매개시하고, 예상 수익률 기하를 계산하고, 상승 단계로 이동하십시오. 윌리엄스 (1992) 는 한 정리를 작성했습니다. 그래서 PPO, GRPO, 그리고 모든 LLM RL 루프가 존재한다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 03 (Monte Carlo), Phase 9 · 04 (TD Learning)
**Time:** ~75 minutes

## 문제

Q-learning 및 DQN는 *값* 함수를 매개 변수를 설정합니다.`argmax Q`이 방법은 분리된 동작과 분리된 상태에서 잘 작동합니다.`argmax`10차원 토크를 넘어서?) 또는 스토카스틱 정책을 원하는 경우 (`argmax`(이건의 구조에 의해 결정적)

정책 기하급수들은 대신 * 정책*을 매개 변수를 나타냅니다. $\pi_\theta(a \mid s)$행동에 대한 분포를 내놓는 신경망입니다.$\theta$- 언덕 위로 올라갈 거야`argmax`벨만 회귀가 없어, 그냥 기하급수 상승$J(\theta) = \mathbb E_{\pi_\theta}[G]$- 그래

REINFORCE 정리는 (Williams 1992) 이 gradient이 계산 가능한 것을 알려줍니다:$\nabla J(\theta) = \mathbb E_\pi[ G \cdot \nabla_\theta \log \pi_\theta(a \mid s) ]$에피소드를 실행하고, 수익을 계산하고, 곱하기$\nabla \log \pi_\theta(a \mid s)$모든 단계에 평균, 계층 상승, 완료

2026 년 에 모든 LLM-RL 알고리즘 은 REINFORCE 의 한 정제 이다. 이 단계 의 나머지 단계 와 10 · 07 단계 (RLHF 구현) 와 10 · 08 단계 (DPO) 의 필수 조건 이다.

## 개념

![Policy gradient: softmax policy, log-π gradient, return-weighted update](../assets/policy-gradient.svg)

**The policy gradient theorem.**모든 정책에 대해$\pi_\theta$$\theta$이 부분의 본문은

```math
\nabla J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}[ \sum_{t=0}^{T} G_t \cdot \nabla_\theta \log \pi_\theta(a_t \mid s_t) ]
```

어디$G_t = \sum_{k=t}^{T} \gamma^{k-t} r_{k+1}$ 단계에서 할인된 수익률입니다$t$. 예상은 전 궤도를 넘어서고 있습니다.$\tau$$\pi_\theta$- 그래

**The proof is short.**차별화$J(\theta) = \sum_\tau P(\tau; \theta) G(\tau)$기대 아래 있습니다.$\nabla P(\tau; \theta) = P(\tau; \theta) \nabla \log P(\tau; \theta)$(조직 파생 트릭)$\log P(\tau; \theta) = \sum \log \pi_\theta(a_t \mid s_t) + \text{environment terms that do not depend on } \theta$환경 용어는 사라집니다. 2개의 정수 줄이 정리를 제공합니다.

**Variance reduction tricks.**바닐라 리인포스        $\nabla \log \pi$두 가지 표준 수정:

1. **Baseline subtraction.**대체$G_t$$G_t - b(s_t)$어떤 기준 기준에 대해서도$b(s_t)$이 문제는$a_t$- 편견 없는 것$\mathbb{E}[b(s_t) \cdot \nabla \log \pi(a_t \mid s_t)] = 0$. 전형적인 선택:$b(s_t) = \hat{V}(s_t)$비평가 → 배우-비평가 (Lesson 07) 에서 배운 것
2. **Reward-to-go.**대체$\sum_t G_t \cdot \nabla \log \pi_\theta(a_t \mid s_t)$$\sum_t G_t^{\text{from } t} \cdot \nabla \log \pi_\theta(a_t \mid s_t)$. 주어진 행동에 있어서 중요한 것은 미래의 수익만

합쳐서, 당신은:

```math
\nabla J \approx (1/N) \sum_{i=1}^{N} \sum_{t=0}^{T_i} [ G_t^{(i)} - \hat{V}(s_t^{(i)}) ] \cdot \nabla_\theta \log \pi_\theta(a_t^{(i)} \mid s_t^{(i)})
```

이 중 하나는 A2C (강좌 07) 와 PPO (강좌 08) 의 직접적인 조상인

**Softmax policy parameterization.**개별적인 행위에 대해서는 표준 선택:

```math
\pi_\theta(a \mid s) = \exp(f_\theta(s, a)) / \sum_{a'} \exp(f_\theta(s, a'))
```

어디$f_\theta$각 동작에 대한 점수를 내리는 신경망입니다. 그라디엔트는 깨끗한 형태를 가지고 있습니다.

```math
\nabla_\theta \log \pi_\theta(a \mid s) = \nabla_\theta f_\theta(s, a) - \sum_{a'} \pi_\theta(a' \mid s) \nabla_\theta f_\theta(s, a')
```

즉, 정책에 따른 예상값을 빼고 취한 조치의 점수.

**Gaussian policy for continuous actions.** $\pi_\theta(a \mid s) = N(\mu_\theta(s), \sigma_\theta(s))$-$\nabla \log N(a; \mu, \sigma)$닫힌 형태를 가지고 있습니다.

```figure
policy-gradient-landscape
```

## 건설 해

### 단계 1: softmax 정책 네트워크

```python
def policy_logits(theta, state_features):
    return [dot(theta[a], state_features) for a in range(N_ACTIONS)]

def softmax(logits):
    m = max(logits)
    exps = [exp(l - m) for l in logits]
    Z = sum(exps)
    return [e / Z for e in exps]
```

아타리용 테이블 을 위해 선형 정책 (행동당 한 중량 벡터) 을 사용하십시오. CNN에 교환하고 소프트맥스 헤드를 유지하십시오.

### 단계 2: 샘플링 및 로그 확률

```python
def sample_action(probs, rng):
    x = rng.random()
    cum = 0
    for a, p in enumerate(probs):
        cum += p
        if x <= cum:
            return a
    return len(probs) - 1

def log_prob(probs, a):
    return log(probs[a] + 1e-12)
```

### 단계 3: 로그 탐사선으로 발사

```python
def rollout(theta, env, rng, gamma):
    trajectory = []
    s = env.reset()
    while not done:
        logits = policy_logits(theta, s)
        probs = softmax(logits)
        a = sample_action(probs, rng)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r, probs))
        s = s_next
    return trajectory
```

### 단계 4: REINFORCE 업데이트

```python
def reinforce_step(theta, trajectory, gamma, lr, baseline=0.0):
    returns = compute_returns(trajectory, gamma)
    for (s, a, _, probs), G in zip(trajectory, returns):
        advantage = G - baseline
        grad_log_pi_a = [-p for p in probs]
        grad_log_pi_a[a] += 1.0
        for i in range(N_ACTIONS):
            for j in range(len(s)):
                theta[i][j] += lr * advantage * grad_log_pi_a[i] * s[j]
```

그레이디언$\nabla \log \pi(a \mid s) = e_a - \pi(\cdot \mid s)$(이중)$a$- 확률) 은 소프트맥스 정책 기하급수의 핵심입니다. 근육 메모리에 태워요.

### 단계 5: 기본 라인

$G$최근 에피소드 에 비해 4×4 GridWorld 가 실행 될 수 있는 변동성 감소 는 충분 합니다.$\hat{V}(s)$그리고 배우 평론가도 되죠.

## 함정

- **Exploding gradients.**환불은 엄청나게 많죠. 항상 정상화되죠.$G$ `~N(0, 1)`배치를 통해 배치를 곱하기 전에$\nabla \log \pi$- 그래
- **Entropy collapse.**정책은 너무 일찍 결정주의적 행동으로 접어들면서 탐색을 멈추고, 갇혀 있습니다.$\beta \cdot H(\pi(\cdot \mid s))$목표에 도달합니다.
- **High variance.**반닐라 REINFORCE는 수천 개의 에피소드가 필요합니다. 비평론적 기본 라인 (강좌 07) 또는 TRPO/PPO의 신뢰 지역 (강좌 08) 은 표준 수정입니다.
- **Sample inefficiency.**정책에 대한 내용은 한 업데이트 후 모든 전환을 버리는 것을 의미합니다. 중요성 샘플링을 통해 정책 외의 수정은 변동의 비용으로 데이터를 가져옵니다 (PPO의 비율은 IS 중량을 줄입니다).
- **Non-stationary gradients.**100편 전과 같은 기하급수와 오래된 기하급수도 사용된다$\pi$정책에 관한 방법들은 이런 이유로 몇 개씩 업데이트됩니다.
- **Credit assignment.**보너스-to-go 없이, 과거의 보너스가 소음을 더해줍니다. 항상 보너스-to-go를 사용하세요.

## 사용 하 고

2026년, REINFORCE는 거의 직접 실행되지 않지만 그 gradient 공식은 모든 곳에 있습니다.

| Use case | Derived method |
|----------|---------------|
| Continuous control | PPO / SAC with Gaussian policy |
| LLM RLHF | PPO with KL penalty, running on token-level policy |
| LLM reasoning (DeepSeek) | GRPO — REINFORCE with group-relative baseline, no critic |
| Multi-agent | Centralized-critic REINFORCE (MADDPG, COMA) |
| Discrete action robotics | A2C, A3C, PPO |
| Preference-only settings | DPO — REINFORCE rewritten as a preference-likelihood loss, no sampling |

읽으면`loss = -advantage * log_prob`2026년 교육 스크립트에서, 즉 기본 라인 (base line) 을 가진 REINFORCE입니다. 전체 논문 (DPO, GRPO, RLOO) 는 이 한 라인 위에 변동 감소 트릭입니다.

## 선박

`outputs/skill-policy-gradient-trainer.md`이 부분의 본문은

```markdown
---
name: policy-gradient-trainer
description: Produce a REINFORCE / actor-critic / PPO training config for a given task and diagnose variance issues.
version: 1.0.0
phase: 9
lesson: 6
tags: [rl, policy-gradient, reinforce]
---

Given an environment (discrete / continuous actions, horizon, reward stats), output:

1. Policy head. Softmax (discrete) or Gaussian (continuous) with parameter counts.
2. Baseline. None (vanilla), running mean, learned `V̂(s)`, or A2C critic.
3. Variance controls. Reward-to-go on by default, return normalization, gradient clip value.
4. Entropy bonus. Coefficient β and decay schedule.
5. Batch size. Episodes per update; on-policy data freshness contract.

Refuse REINFORCE-no-baseline on horizons > 500 steps. Refuse continuous-action control with a softmax head. Flag any run with `β = 0` and observed policy entropy < 0.1 as entropy-collapsed.
```

## 운동

1. **Easy.**라인형 소프트맥스 정책으로 4×4 그리드월드에서 REINFORCE를 구현하십시오. 기본 라인 없이 1,000 에피소드를 훈련하십시오. 학습 곡선을 그려보세요. 변수를 측정하십시오.
2. **Medium.**평균 연출 기준을 추가해 다시 훈련해 보세요. 샘플 효율성과 변수를 바닐라 연출과 비교해 보세요.
3. **Hard.**엔트로피 보너스를 추가합니다$\beta \cdot H(\pi)$- 扫$\beta \in \lbrace 0, 0.01, 0.1, 1.0 \rbrace$마지막 수익과 정책 엔트로피의 계획입니다. 이 작업의 달콤한 점은 어디죠?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy gradient | "Train the policy directly" | $\nabla J(\theta) = \mathbb{E}[G \cdot \nabla \log \pi_\theta(a \mid s)]$; derived from the log-derivative trick. |
| REINFORCE | "The original PG algorithm" | Williams (1992); Monte Carlo returns multiplied by log-policy gradient. |
| Log-derivative trick | "Score function estimator" | $\nabla P(\tau;\theta) = P(\tau;\theta) \cdot \nabla \log P(\tau;\theta)$; makes gradients of expectations tractable. |
| Baseline | "Variance reduction" | Any $b(s)$ subtracted from $G$; unbiased because $\mathbb{E}[b \cdot \nabla \log \pi] = 0$. |
| Reward-to-go | "Only future returns count" | $G_t^{\text{from } t}$ instead of the full $G_0$; correct and lower-variance. |
| Entropy bonus | "Encourage exploration" | $+\beta \cdot H(\pi(\cdot \mid s))$ term keeps the policy from collapsing. |
| On-policy | "Train on what you just saw" | Gradient expectation is w.r.t. the current policy — cannot reuse old data directly. |
| Advantage | "How much better than average" | $A(s, a) = G(s, a) - V(s)$; the signed quantity REINFORCE-with-baseline multiplies. |

## 더 많은 읽기

- [Williams (1992). Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning](https://link.springer.com/article/10.1007/BF00992696) 원래 REINFORCE 문서.
- [Sutton et al. (2000). Policy Gradient Methods for Reinforcement Learning with Function Approximation](https://papers.nips.cc/paper_files/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html) 함수 근접과 함께 현대 정책-기급 이론.
- [Sutton & Barto (2018). Ch. 13 — Policy Gradient Methods](http://incompleteideas.net/book/RLbook2020.pdf) 교과서 발표
- [OpenAI Spinning Up — VPG / REINFORCE](https://spinningup.openai.com/en/latest/algorithms/vpg.html) PyTorch 코드와 함께 명확한 교육적 설명.
- [Peters & Schaal (2008). Reinforcement Learning of Motor Skills with Policy Gradients](https://homes.cs.washington.edu/~todorov/courses/amath579/reading/PolicyGradient.pdf) 변동 감소와 REINFORCE를 신뢰 지역 가족 (TRPO, PPO) 에 연결하는 자연-배열 관점
