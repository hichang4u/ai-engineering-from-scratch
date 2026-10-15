# 근방정책 최적화 (PPO)

> A2C는 한 업데이트 후 모든 롤러를 버립니다. PPO는 정책 기하급수성을 절감된 중요성 비율로 포장하여 정책이 폭발하지 않고 동일한 데이터에 10+ 시대를 수행 할 수 있습니다. Schulman et al. (2017). 여전히 기본 정책 기하급수 알고리즘은 2026 년입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~75 minutes

## 문제

A2C (강좌 07) 은 정책에 관한 것입니다.$\mathbb E_{\pi_\theta}[A \cdot \nabla \log \pi_\theta]$*현재*에서 샘플링된 데이터를 필요로 합니다.$\pi_\theta$한 번 업데이트를 해$\pi_\theta$변경된 데이터, 사용된 데이터, 이제 비정책입니다. 재사용하고, 그 gradient는 편향적입니다.

롤러우트는 비싸다. 아타리에서는 8 엔비디아 × 128 단계의 1 개의 롤러우트는 1024 개의 전환과 12 초의 환경 시간이 됩니다. 한 단계의 gradient 단계 후에 그것을 버리는 것은 낭비입니다.

신뢰 지역 정책 최적화 (TRPO, Schulman 2015) 는 첫 번째 해결이었습니다. 모든 업데이트를 제한하여 이전과 새로운 정책 사이의 KL 격차가 낮게 유지됩니다.$\delta$이론적으로 깨끗하지만 업데이트당 합성 계층 해법을 필요로 합니다. 2026년에 아무도 TRPO를 실행하지 않습니다.

PPO (Schulman et al. 2017) 는 하드 트러스트-리지온 제약을 간단한 절단된 목표로 대체합니다. 코드 한 줄이 추가됩니다. 임시 출력당 10 시대. 합성 gradients 없습니다. 충분한 이론적 보장. 9 년 후 여전히 MuJoCo에서 RLHF에 이르기까지 모든 것에 기본 정책- gradient 알고리즘입니다.

## 개념

![PPO clipped surrogate objective: ratio clipping at 1 ± ε](../assets/ppo.svg)

**The importance ratio.**

```math
r_t(\theta) = \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)}
```

이것은 새로운 정책과 데이터를 수집한 정책의 확률 비율입니다. $r_t = 1$변함이 없다는 뜻이죠.$r_t = 2$새로운 정책이 2배 더 많은$a_t$옛날처럼

**The clipped surrogate.**

```math
L^{\text{CLIP}}(\theta) = \mathbb{E}_t \left[ \min\left( r_t(\theta) A_t, \mathop{\mathrm{clip}}(r_t(\theta), 1-\epsilon, 1+\epsilon) A_t \right) \right]
```

두 가지 조건:

- 이점이 있다면$A_t > 0$그리고 그 비율은 더 이상 증가하려고 노력합니다$1 + \epsilon$, 클립은 gradient를 평평하게 합니다  좋은 행동을 더 멀리 밀어하지 않습니다$+\epsilon$오래된 확률보다 높습니다.
- 이점이 있다면$A_t < 0$그리고 그 비율은 더 이상 증가하려고 노력합니다$1 - \epsilon$(그 뜻은 우리가 그 단축된 감소에 비해 나쁜 행동을 더 확률로 만들 수 있다는 뜻) 클립은 gradient를  아래로 나쁜 행동을 밀어내지 않습니다$-\epsilon$- 그래

`min`다른 방향으로 처리합니다. 비율이 * 유익한* 방향으로 움직인다면, 여전히 기울기를 얻습니다 (면으로 절단하지 않으면 당신을 해칠 수 있습니다).

전형적인$\epsilon = 0.2$           $r_t$: "좋은 편"에 평면 지붕과 "나쁜 편"에 평면 바닥을 가진 조각형 선형 기능.

**The full PPO loss.**

```math
L(\theta, \phi) = L^{\text{CLIP}}(\theta) - c_v \cdot (V_\phi(s_t) - V_t^{\text{target}})^2 + c_e \cdot H(\pi_\theta(\cdot \mid s_t))
```

A2C와 같은 배우-비평 구조. 보통 3개의 계수$c_v = 0.5$$c_e = 0.01$$\epsilon = 0.2$- 그래

**The training loop.**

1. 수집$N \times T$$N$$T$각 단계.
2. 계산상의 장점을 (GAE) 계산하고, 일정으로 얼어붙여라.
3. 얼어붙여$\pi_{\theta_{\text{old}}}$현재의 단숨 사진으로$\pi_\theta$- 그래
4. $K$에포크, 각 미니 배트 `(s, a, A, V_target, log π_old(a|s))`이 부분의 본문은
   - 계산$r_t(\theta) = \exp(\log \pi_\theta(a \mid s) - \log \pi_{\text{old}}(a \mid s))$- 그래
   - 적용$L^{\text{CLIP}}$+ 가치 손실 + 엔트로피
   - 단계 단계
5. 배포를 폐기하고 단계 1로 돌아가

$K = 10$64의 미니배치는 표준 하이퍼파라미터 집합입니다. PPO는 견고합니다. 정확한 숫자는 거의 ± 50% 안의 중요성이 없습니다.

**KL-penalty variant.**본 논문에서는 적응형 KL 벌금을 이용한 대안을 제안하였다.$L = L^{\text{PG}} - \beta \cdot \mathrm{KL}(\pi_\theta \Vert \pi_{\text{old}})$$\beta$관찰된 KL에 따라 조정되었습니다. 절단 버전이 지배적 인 것으로 나타났습니다. KL 변종은 RLHF에서 살아남습니다 (reference policy에 대한 KL는 어쨌든 항상 원하는 별도의 제약입니다).

```figure
ppo-clip
```

## 건설 해

### 1단계: 포착`log π_old(a | s)`발급 시점

```python
for step in range(T):
    probs = softmax(logits(theta, state_features(s)))
    a = sample(probs, rng)
    s_next, r, done = env.step(s, a)
    buffer.append({
        "s": s, "a": a, "r": r, "done": done,
        "v_old": value(w, state_features(s)),
        "log_pi_old": log(probs[a] + 1e-12),
    })
    s = s_next
```

이 스냅샷은 출력 시점에 한 번 촬영되며 업데이트 기간 동안 변경되지 않습니다.

### 단계 2: GAE의 장점을 계산하라 (강좌 07)

A2C와 같죠.

### 단계 3: 대리신행 업데이트를 단축

```python
for _ in range(K_EPOCHS):
    for mb in minibatches(buffer, size=64):
        for rec in mb:
            x = state_features(rec["s"])
            probs = softmax(logits(theta, x))
            logp = log(probs[rec["a"]] + 1e-12)
            ratio = exp(logp - rec["log_pi_old"])
            adv = rec["advantage"]
            surrogate = min(
                ratio * adv,
                clamp(ratio, 1 - EPS, 1 + EPS) * adv,
            )
            # backprop -surrogate, add value loss, subtract entropy
            grad_logpi = onehot(rec["a"]) - probs
            if (adv > 0 and ratio >= 1 + EPS) or (adv < 0 and ratio <= 1 - EPS):
                pg_grad = 0.0  # clipped
            else:
                pg_grad = ratio * adv
            for i in range(N_ACTIONS):
                for j in range(N_FEAT):
                    theta[i][j] += LR * pg_grad * grad_logpi[i] * x[j]
```

"절단 → 제로 기하급수" 패턴은 PPO의 핵심입니다. 새로운 정책이 이미 유익한 방향으로 너무 멀리 이동했다면 업데이트는 중단됩니다.

### 단계 4: 가치와 엔트로피

평론자 대상에 표준 MSE와 A2C와 같은 배우에 엔트로피 보너스를 추가합니다.

### 5단계: 진단

모든 업데이트를 지켜볼 3가지

- **Mean KL** $\mathbb{E}[\log \pi_{\text{old}} - \log \pi_\theta]$안 돼야 돼`[0, 0.02]`- 지나가면`0.1`, 줄여주기`K_EPOCHS`또는`LR`- 그래
- **Clip fraction** 그 비율이 외부에 있는 샘플의 분자$[1-\epsilon, 1+\epsilon]$- 그럴 것 같네요`~0.1-0.3`- 만약`~0`, 클립은 절대 을 일으키지 않습니다`LR`또는`K_EPOCHS`- 만약`~0.5+`, 당신은 너무 롤라웃을 조정 → 그들을 낮추는.
- **Explained variance** $1 - \text{Var}(V_{\text{target}} - V_{\text{pred}}) / \text{Var}(V_{\text{target}})$비판적 품질 측정기. 평론가가가 배우면서 1으로 올라갈 수 있습니다.

## 함정

- **Clip coefficient mistuned.** $\epsilon = 0.2$사실 기준입니다.`0.1`업데이트를 너무 당황하게 만듭니다.`0.3+`불안정성을 불러일으키죠.
- **Too many epochs.** $K > 20$정책이 멀리 떨어져 있기 때문에 일상적으로 불안정화됩니다$\pi_{\text{old}}$특히 큰 네트워크에 있어서
- **No reward normalization.**큰 보상 스케일은 클립 범위에 들어가게 됩니다. 계산상의 장점보다 먼저 보상 (running std) 을 정상화하십시오.
- **Forgetting advantage normalization.**패치당 0 평균/단위 STD 정상화는 표준입니다. 그것을 건너뛰는 것은 대부분의 기준에서 PPO를 파괴합니다.
- **Learning rate not decayed.**PPO는 선형 LR 붕괴에서 0으로 이익을 얻습니다. 상형 LR는 종종 더 나쁘습니다.
- **Importance ratio math errors.**항상`exp(log_new - log_old)`수학적 안정성, 아니 `new / old`- 그래
- **Wrong gradient sign.**대리모를 극대화 = * 최소화*$-L^{\text{CLIP}}$반향된 표지판은 가장 흔한 PPO 버그입니다.

## 사용 하 고

PPO는 2026년, 놀라운 수의 도메인에서 기본 RL 알고리즘입니다.

| Use case | PPO variant |
|----------|-------------|
| MuJoCo / robotics control | PPO with Gaussian policy, GAE(0.95) |
| Atari / discrete games | PPO with categorical policy, rolling 128-step rollouts |
| RLHF for LLMs | PPO with KL penalty to reference model, reward from RM at end of response |
| Large-scale game agents | IMPALA + PPO (AlphaStar, OpenAI Five) |
| Reasoning LLMs | GRPO (Lesson 12) — PPO variant without critic |
| Preference-only data | DPO — closed-form collapsing of PPO+KL, no online sampling |

PPO * 손실 모양*  절단 대리 + 가치 + 엔트로피 은 DPO, GRPO 및 거의 모든 RLHF 파이프 라인의 기판입니다.

## 선박

`outputs/skill-ppo-trainer.md`이 부분의 본문은

```markdown
---
name: ppo-trainer
description: Produce a PPO training config and a diagnostic plan for a given environment.
version: 1.0.0
phase: 9
lesson: 8
tags: [rl, ppo, policy-gradient]
---

Given an environment and training budget, output:

1. Rollout size. `N` envs × `T` steps.
2. Update schedule. `K` epochs, minibatch size, LR schedule.
3. Surrogate params. `ε` (clip), `c_v`, `c_e`, advantage normalization on.
4. Advantage. GAE(`λ`) with explicit `γ` and `λ`.
5. Diagnostics plan. KL, clip fraction, explained variance thresholds with alerts.

Refuse `K > 30` or `ε > 0.3` (unsafe trust region). Refuse any PPO run without advantage normalization or KL/clip monitoring. Flag clip fraction sustained above 0.4 as drift.
```

## 운동

1. **Easy.**4×4 그리드월드에서 PPO를 실행하세요$\epsilon=0.2, K=4$. 샘플 효율을 A2C (롤러에 한 시기가) 와 비교하여
2. **Medium.** 扫$K \in \lbrace 1, 4, 10, 30 \rbrace$- 플롯 복귀와 엔비디아 단계와 추적 평균 KL$K$KL이 이 작업에서 폭발할 수 있을까요?
3. **Hard.**절단된 대리신료를 적응형 KL 벌금으로 대체 ($\beta$이중화될 경우$\mathrm{KL} > 2 \cdot \text{target}$, 절반으로 줄여$\mathrm{KL} < \text{target}/2$) 최종 수익률, 안정성, 클립 없는 상태를 비교해 보세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Importance ratio | "r_t(θ)" | $\pi_\theta(a \mid s) / \pi_{\text{old}}(a \mid s)$; deviation from the policy that collected the data. |
| Clipped surrogate | "PPO's main trick" | $\min(r \cdot A, \mathop{\mathrm{clip}}(r, 1-\epsilon, 1+\epsilon) \cdot A)$; flat gradient past the clip on beneficial side. |
| Trust region | "TRPO / PPO intent" | Limit each update's KL to guarantee monotone improvement. |
| KL penalty | "Soft trust region" | Alternative PPO: $L - \beta \cdot \mathrm{KL}(\pi_\theta \Vert \pi_{\text{old}})$. Adaptive $\beta$. |
| Clip fraction | "How often clipping triggers" | Diagnostic — should be 0.1-0.3; outside means mistuned. |
| Multi-epoch training | "Data reuse" | K epochs on each rollout; variance cost traded for sample efficiency. |
| On-policy-ish | "Mostly on-policy" | PPO is nominally on-policy but K>1 epochs uses slightly-off-policy data safely. |
| PPO-KL | "The other PPO" | KL-penalty variant; used in RLHF where KL-to-reference is already a constraint. |

## 더 많은 읽기

- [Schulman et al. (2017). Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347)- 신문
- [Schulman et al. (2015). Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477) TRPO, PPO의 전신
- [Andrychowicz et al. (2021). What Matters In On-Policy RL? A Large-Scale Empirical Study](https://arxiv.org/abs/2006.05990) 모든 PPO 과다 매개 변수가 제거됩니다.
- [Ouyang et al. (2022). Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) InstructGPT; PPO-in-RLHF 요리법
- [OpenAI Spinning Up — PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html) PyTorch로 깨끗한 현대적인 전시
- [CleanRL PPO implementation](https://github.com/vwxyzjn/cleanrl) 많은 논문에서 사용되는 단일 파일 PPO 참조.
- [Hugging Face TRL — PPOTrainer](https://huggingface.co/docs/trl/main/en/ppo_trainer) 언어 모델에 대한 PPO의 생산 레시피; 레슨 09 (RLHF) 와 함께 읽으십시오.
- [Engstrom et al. (2020). Implementation Matters in Deep Policy Gradients](https://arxiv.org/abs/2005.12729) "37 코드 레벨 최적화" 논문; PPO 트릭은 부담을 내며 어떤 것이 민속이야기입니다.
