# 딥 Q 네트워크 (DQN)

> 2013년: Mnih는 원소 픽셀로 한 개의 Q-러닝 네트워크를 훈련시켰으며, 아타리 7개의 게임에서 모든 고전 RL 에이전트를 제치고 있다. 2015년: 49개 게임에 연장되어, 네이처에서 출판되었다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 04 (Q-learning, SARSA)
**Time:** ~75 minutes

## 문제

표기 Q 학습은 각 (정치, 행동) 쌍에 별도의 Q 값이 필요합니다. 체스 보드는 ~1043 개의 상태를 가지고 있습니다. 아타리 프레임은 210 × 160 × 3 = 100,800 개의 특징입니다. 표기 RL는 수천 개의 상태에서 죽습니다. 수십억을 말할 것도 없습니다.

후시로 보면 해결방법은 분명합니다. Q 테이블을 신경망으로 대체합니다.$Q(s, a; \theta)$그러나 명백한 후보는 수십 년 동안 걸렸다. 순진함수 근접과 Q 학습은 "죽음의 삼위일체"  함수 근접 + 부트스트래핑 + 정책 외 학습에 따라 차이가 있다. Mnih et al. (2013, 2015) 는 학습을 안정시키는 세 가지 엔지니어링 트릭을 확인했다:

1. **Experience replay**전환을 비관합니다.
2. **Target network**부트 스트랩 목표물을 얼리게 합니다.
3. **Reward clipping**그라디언트 규모를 정상화합니다.

아타리 DQN는 단일 하이퍼파라미터 세트를 가진 단일 아키텍처가 처음으로 원소 픽셀에서 수십 개의 제어 문제를 해결했습니다. DDQN, 레인보우, 듀얼, 유통, R2D2, 에이전트57  이후 만들어진 모든 "딥-RL"는 이 세 가지 트릭 기반 위에 쌓여 있습니다.

## 개념

![DQN training loop: env, replay buffer, online net, target net, Bellman TD loss](../assets/dqn.svg)

**The objective.**DQN는 신경 Q 기능에 대한 한 단계 TD 손실을 최소화합니다.

```math
L(\theta) = \mathbb{E}_{(s,a,r,s') \sim D}[ (r + \gamma \max_{a'} Q(s', a'; \theta^-) - Q(s, a; \theta))^2 ]
```

$\theta$= 온라인 네트워크, gradient 하락으로 모든 단계에 업데이트. $\theta^-$= 목표 네트워크, 주기적으로 복사$\theta$(~10,000단계마다)$D$= 과거 전환의 재 재생 버퍼

**The three tricks, in order of importance:**

**Experience replay.**   `~10⁶`트랜지션 단계마다 미니배치를 일률적으로 무작위로 샘플링합니다. 이것은 시간적 상관관계를 깨고 (잇따라 프레임은 거의 동일합니다), 네트워크가 드문 보상적인 전환에서 여러 번 배울 수 있도록합니다. 그리고 연속적인 기하급수 업데이트를 디코레레이트합니다. 이 없이는 정책에 있는 TD는 신경망으로 아타리에서 분할됩니다.

**Target network.**같은 네트워크를 이용해서$Q(\cdot; \theta)$벨만 방정식의 양쪽 모두에서 목표가 모든 업데이트를 움직이게 합니다$Q(\cdot; \theta^-)$얼어붙은 무게로$C$단계, 복사$\theta \to \theta^-$이 방법은 수천 개의 기하급수 단계에 대한 회귀 목표를 안정시킵니다.$\theta^- \leftarrow \tau \theta + (1-\tau) \theta^-$(DDPG, SAC에서 사용된다) 는 더 부드러운 변형이다.

**Reward clipping.**아타리 보상 규모는 1에서 1000+까지 다양합니다.$\lbrace-1, 0, +1 \rbrace$그레이덴트를 지배하는 게임만 막는 거죠. 보상 규모가 중요할 때 잘못됐습니다.

**Double DQN.**Hasselt (2016) 은 극대화 편향을 수정합니다. 온라인 네트워크를 사용하여 행동을 선택하고, 목표물을 사용하여 그것을 평가합니다.

```math
\text{target} = r + \gamma Q(s', \arg\max_{a'} Q(s', a'; \theta); \theta^-)
```

롤-인 교체, 항상 더 낫습니다. 기본으로 사용하세요.

**Other improvements (Rainbow, 2017):**우선순위 재생 ( 샘플 높은 TD 오류 전환 더), 듀얼 아키텍처 (분별 $V(s)$그리고 우수 헤드), 잡음 네트워크 (학습 탐구), n 단계 반환, 분산 Q (C51/QR-DQN), 다 단계 부트스트래핑. 각은 몇 퍼센트 더합니다. 이득은 대략적으로 추가됩니다.

```figure
f3-dqn-stability
```

## 건설 해

여기 코드는 stdlib-only numpy-free입니다. 우리는 작은 연속적인 GridWorld에서 손으로 롤된 단일 숨겨진 계층 MLP를 사용합니다. 그래서 모든 훈련 단계는 마이크로초에 실행됩니다. 알고리즘은 규모로 Atari DQN와 동일합니다.

### 단계 1: 재연열 버퍼

```python
class ReplayBuffer:
    def __init__(self, capacity):
        self.buf = []
        self.capacity = capacity
    def push(self, s, a, r, s_next, done):
        if len(self.buf) == self.capacity:
            self.buf.pop(0)
        self.buf.append((s, a, r, s_next, done))
    def sample(self, batch, rng):
        return rng.sample(self.buf, batch)
```

아타리용 용량은 5만원, 장난감용 용량은 5만원

### 단계 2: 작은 Q 네트워크 (동동 MLP)

```python
class QNet:
    def __init__(self, n_in, n_hidden, n_actions, rng):
        self.W1 = [[rng.gauss(0, 0.3) for _ in range(n_in)] for _ in range(n_hidden)]
        self.b1 = [0.0] * n_hidden
        self.W2 = [[rng.gauss(0, 0.3) for _ in range(n_hidden)] for _ in range(n_actions)]
        self.b2 = [0.0] * n_actions
    def forward(self, x):
        h = [max(0.0, sum(w * xi for w, xi in zip(row, x)) + b) for row, b in zip(self.W1, self.b1)]
        q = [sum(w * hi for w, hi in zip(row, h)) + b for row, b in zip(self.W2, self.b2)]
        return q, h
```

앞선: 선형 → ReLU → 선형. 전체 네트워크입니다.

### 단계 3: DQN 업데이트

```python
def train_step(online, target, batch, gamma, lr):
    grads = zeros_like(online)
    for s, a, r, s_next, done in batch:
        q, h = online.forward(s)
        if done:
            y = r
        else:
            q_next, _ = target.forward(s_next)
            y = r + gamma * max(q_next)
        td_error = q[a] - y
        accumulate_grads(grads, online, s, h, a, td_error)
    apply_sgd(online, grads, lr / len(batch))
```

형태는 두 가지 차이로 수업 04에서 Q- 학습입니다: (a) 우리는 차별화 가능한 $Q(\cdot; \theta)$표를 지표하는 대신, (b) 목표 사용 $Q(\cdot; \theta^-)$- 그래

### 단계 4: 외부 루프

각 에피소드에서,    $Q(\cdot; \theta)$, 버퍼에 전환을 밀어 넣고, 미니배치를 샘플링하고, gradient 단계로 이동하여 주기적으로 동기화합니다$\theta^- \leftarrow \theta$패턴:

```python
for episode in range(N):
    s = env.reset()
    while not done:
        a = epsilon_greedy(online, s, epsilon)
        s_next, r, done = env.step(s, a)
        buffer.push(s, a, r, s_next, done)
        if len(buffer) >= batch:
            train_step(online, target, buffer.sample(batch), gamma, lr)
        if steps % sync_every == 0:
            target = copy(online)
        s = s_next
```

16차원 단층 상태의 작은 그리드월드에서 에이전트는 약 500개의 에피소드에서 거의 최적의 정책을 학습합니다. 아타리에서는 200만개의 프레임으로 확장하고 CNN 기능 추출기를 추가합니다.

## 함정

- **Deadly triad.**함수 근접 + 정책 외의 + 부트 스트래핑은 다를 수 있습니다. DQN는 목표 네트워크 + 재 재생으로 완화됩니다. 둘 다 제거하지 마십시오.
- **Exploration.**ε는 훈련의 첫 ~ 10% 동안 일반적으로 1.0에서 0.01까지 붕괴해야합니다. 충분한 조기 탐색이 없으면 Q-네트 는 지역 저수지로 konverges.
- **Overestimation.** `max`음 Q는 상승 편향을 가지고 있습니다. 항상 생산에서 두 배 DQN를 사용하십시오.
- **Reward scale.**보상 크기를 클립하거나 정상화하십시오. 그라디언 크기는 보상 크기에 비례합니다.
- **Replay buffer coldstart.**버퍼가 몇 천 개의 전환을 할 때까지 훈련하지 마십시오. 20개의 샘플에 대한 초기 경각심이
- **Target sync frequency.**너무 자주 ≈ 목표물 네트워크가 없습니다. 너무 드물게 ≈ 오래된 목표물. 아타리 DQN는 10,000 엔비디아 단계를 사용합니다. 엄지손가락 규칙: 훈련 지평선에서 1/100을 동기화하십시오.
- **Observation preprocessing.**아타리 DQN는 4개의 프레임을 쌓아서 마코프 상태를 만듭니다. 속도 정보를 가진 모든 환경은 프레임 스택 또는 반복 상태를 필요로 합니다.

## 사용 하 고

2026년, DQN는 거의 최신의 기술이지만 정책 외의 참조 알고리즘으로 남아 있습니다.

| Task | Method of choice | Why not DQN? |
|------|------------------|--------------|
| Discrete-action Atari-like | Rainbow DQN or Muesli | Same framework, more tricks. |
| Continuous control | SAC / TD3 (Phase 9 · 07) | DQN has no policy network. |
| On-policy / high-throughput | PPO (Phase 9 · 08) | No replay buffer; easier to scale. |
| Offline RL | CQL / IQL / Decision Transformer | Conservative Q targets, no bootstrapping blowups. |
| Large discrete action spaces (recommender) | DQN with action embedding, or IMPALA | Fine; decoration matters. |
| LLM RL | PPO / GRPO | Sequence-level, not step-level; different loss. |

리플레이는 여전히 여행 중입니다. SAC, TD3, DDPG, SAC-X, AlphaZero의 셀프 플레이 버퍼 및 모든 오프라인 RL 메소드에서 재생 및 목표 네트워크가 나타납니다. 보너스 클리핑은 PPO에서 이점 정상화로 계속됩니다. 아키텍처는 청사진입니다.

## 선박

`outputs/skill-dqn-trainer.md`이 부분의 본문은

```markdown
---
name: dqn-trainer
description: Produce a DQN training config (buffer, target sync, ε schedule, reward clipping) for a discrete-action RL task.
version: 1.0.0
phase: 9
lesson: 5
tags: [rl, dqn, deep-rl]
---

Given a discrete-action environment (observation shape, action count, horizon, reward scale), output:

1. Network. Architecture (MLP / CNN / Transformer), feature dim, depth.
2. Replay buffer. Capacity, minibatch size, warmup size.
3. Target network. Sync strategy (hard every C steps or soft τ).
4. Exploration. ε start / end / schedule length.
5. Loss. Huber vs MSE, gradient clip value, reward clipping rule.
6. Double DQN. On by default unless explicit reason to disable.

Refuse to ship a DQN with no target network, no replay buffer, or ε held at 1. Refuse continuous-action tasks (route to SAC / TD3). Flag any reward range > 10× per-step mean as needing clipping or scale normalization.
```

## 운동

1. **Easy.**달아`code/main.py`에피소드당 반환 곡선을 그려보세요. 실행 평균이 -10을 넘기기 전까지 몇 에피소드?
2. **Medium.**목표 네트워크를 비활성화 (벨만 목표의 양쪽에서 온라인 네트워크를 사용) 훈련 불안정성을 측정
3. **Hard.**두 배의 DQN를 추가: 온라인 네트워크를 사용하여 선택하십시오 `argmax a'`, 목표물 네트워크 평가.`Q(s_0, best_a)`사실에 반해$V^{\ast}(s_0)$1000개의 에피소드 후, 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| DQN | "Deep Q-learning" | Q-learning with a neural Q-function, replay buffer, and target network. |
| Experience replay | "Shuffled transitions" | Ring buffer sampled uniformly each gradient step; decorrelates data. |
| Target network | "Frozen bootstrap" | Periodic copy of Q used in the Bellman target; stabilizes training. |
| Deadly triad | "Why RL diverges" | Function approximation + bootstrapping + off-policy = no convergence guarantee. |
| Double DQN | "Fix for maximization bias" | Online net selects action, target net evaluates it. |
| Dueling DQN | "V and A heads" | Decompose Q = V + A - mean(A); same output, better gradient flow. |
| Rainbow | "All the tricks" | DDQN + PER + dueling + n-step + noisy + distributional in one. |
| PER | "Prioritized Replay" | Sample transitions proportional to TD-error magnitude. |

## 더 많은 읽기

- [Mnih et al. (2013). Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602) 2013년 NeurIPS 워크샵 논문으로 깊은 RL를 시작하였습니다.
- [Mnih et al. (2015). Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236) 네이처 논문, 49 게임 DQN.
- [Hasselt, Guez, Silver (2016). Deep Reinforcement Learning with Double Q-learning](https://arxiv.org/abs/1509.06461) DDQN
- [Wang et al. (2016). Dueling Network Architectures](https://arxiv.org/abs/1511.06581) DQN의 듀얼
- [Hessel et al. (2018). Rainbow: Combining Improvements in Deep RL](https://arxiv.org/abs/1710.02298)               
- [Sutton & Barto (2018). Ch. 9 — On-policy Prediction with Approximation](http://incompleteideas.net/book/RLbook2020.pdf) DQN의 목표 네트워크와 재생 버퍼가 소화하도록 설계된 "죽음의 삼위" (함수 근접 + 부트스트래핑 + 정책 외) 의 교과서 처리가.
- [CleanRL DQN implementation](https://docs.cleanrl.dev/rl-algorithms/dqn/) 압축 연구에서 사용되는 단일 파일 DQN 참조; 이 수업의 처음부터 버전과 함께 읽을 수 있습니다.
