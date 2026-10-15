# 게임용 RL  알파제로, 무제로, LLM-레저닝 시대

> 1992년: TD-Gammon은 순수한 TD로 백게몬에서 인간 챔피언을 물리쳤다. 2016년: AlphaGo는 Lee Sedol를 물리쳤다. 2017년: AlphaZero는 초점부터 체스, 쇼기, 그리고 고를 지배했다. 2024년: DeepSeek-R1는 동일한 레시피를 증명했다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 05 (DQN), Phase 9 · 08 (PPO), Phase 9 · 09 (RLHF), Phase 9 · 10 (MARL)
**Time:** ~120 minutes

## 문제

RL가 원하는 모든 것이 게임입니다. 순수한 보상 (승/패). 무한한 에피소드 (자동 플레이 리셋). 완벽한 시뮬레이션 (게임 *이* 시뮬레이터). 단호하거나 작은 연속적인 액션 공간. 적대적 강도를 강요하는 멀티 에이전트 구조.

그리고 게임들은 RL의 모든 주요 돌파구를 테스트하는 방식입니다. TD-Gammon (백가몬, 1992). 아타리-DQN (2013). 알파고 (2016) 알파제로 (2017). 오픈AI 5 (도타 2, 2019). 알파스타 (스타크래프트 II, 2019). 무제로 (학습 모델, 2019). 알파텐서 (매트릭스 곱셈, 2022). 알파데브 (분별 알고리즘, 2023).  딥시크-R1 (수학적 추론, 2025)  게임-RL 기술이 텍스트에 작동한다는 최신 증명

이 돌은 하나의 통합 렌즈를 통해 3개의  알파제로, 무제로, 그리고 GRPO 건축물을 조사합니다.**self-play + search + policy improvement**. 각자는 이전을 일반화한다. 특히 GRPO는 LLM 추론에 적용되는 AlphaZero의 레시피이며, 토큰은 행동이며 수학 검증은 승리의 신호입니다.

## 개념

![AlphaZero ↔ MuZero ↔ GRPO: same loop, different environments](../assets/rl-games.svg)

**The unifying loop.**

```
while True:
    trajectory = self_play(current_policy, search)     # play game against self
    policy_target = search.improved_policy(trajectory) # search improves raw policy
    policy_net.update(policy_target, value_target)     # supervised on search output
```

**AlphaZero (2017).**실버 등. 알려진 규칙이 있는 게임 (셰어스, 쇼기, 고) 을 보면:

- 정책적 가치 네트워크: 하나의 탑 $f_\theta(s) \to (p, v)$-$p$법적인 움직임에 대한 선구자입니다.$v$예상되는 게임 결과입니다.
- 몬테카로 트리 검색 (MCTS): 각 움직임에 따라 가능한 연속으로 나무를 확장하십시오. 사용 $(p, v)$UCB (PUCT) 에 따라 노드를 선택하세요: $a^{\ast} = \arg\max_a Q(s, a) + c \cdot p(a \mid s) \cdot \sqrt{N(s)} / (1 + N(s, a))$- 그래
- 자율 플레이: 에이전트와 에이전트 경기가 진행됩니다.$t$, MCTS 방문 분포$\pi_t$정책 교육의 목표가 됩니다.
- 손실:$L = (v - z)^2 - \pi \cdot \log p + c \cdot \lVert \theta \rVert^2$-$z$게임 결과 (+1/0/ -1) 입니다.

인간 지식은 전혀 없고, 손으로 만든 유리스틱은 전혀 없고, 체스, 쇼기, 고를 한 명씩 몇 십만개의 게임 후 모두 익히고 있는 하나의 요리법입니다.

**MuZero (2019).**슈트비저等人. 규칙이 알려져야 한다는 요구사항을 제거합니다.

- 고정된 환경 대신, *실동적인 동적 모델*을 배우십시오.$(h, g, f)$이 부분의 본문은
  - $h(s)$: 관찰을 잠자리 상태로 암호화합니다.
  - $g(s_{\text{latent}}, a)$: 다음 잠잠 상태 + 보상 예측.
  - $f(s_{\text{latent}})$: 정책 전 + 가치 예측
- MCTS는 학습된 잠자리 공간에서 실행됩니다. 같은 검색, 동일한 훈련 루프.
- 고, 체스, 쇼기, 아타리 등에 적용된 알고리즘이 하나, 규칙은 없다.

**Stochastic MuZero (2022).**스토카스틱 역학과 우연의 노드를 추가하고, 백게몬 클래스 게임까지 확장합니다.

**Muesli, Gumbel MuZero (2022-2024).**샘플 효율성과 결정적 검색의 향상

**GRPO (2024-2025).**DeepSeek-R1 레시피. 같은 알파제로 모양의 루프, 언어 모델 추론에 적용:

- "게임": 수학 / 코딩 / 추론 문제에 답. "Win" = 검증기 (테스트 케이스 합격, 수학적 답 일치) 는 1을 반환합니다.
- 정책: LLM. 행동: 토큰. 상태: 신속 + 응답-지금까지.
- 비평가도 없습니다 (PPO 스타일)$V_\phi$) 대신, 각 시사 시 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사 시사$G$정책에서 완료된 모든 것. 각 개에 대한 보상 계산.**group-relative advantage** $A_i = (r_i - \text{mean}_r) / \text{std}_r$REINFORCE 스타일의 업데이트 신호로
- KL의 기준 정책으로 인한 벌금 (RLHF와 같은)
- 완전 손실:

  $L_{\text{GRPO}}(\theta) = -\mathbb E_{q, \lbrace o_i \rbrace} \left[ \frac{1}{G} \sum_i A_i \cdot \log \pi_\theta(o_i \mid q) \right] + \beta \cdot \mathrm{KL}(\pi_\theta \Vert \pi_{\text{ref}})$

보상 모델, 비평가, MCTS가 없습니다. 그룹 관계 기본은 세 가지 모두를 대체합니다. 계산의 일부에서 추론 기준의 PPO-RLHF 품질과 일치하거나 초과합니다.

**The R1 recipe in full.**딥시크-R1 (DeepSeek 2025) 는 하나의 논문에서 두 가지 모델입니다.

- **R1-Zero.**DeepSeek-V3 기본 모델에서 시작하십시오. SFT가 없습니다. GRPO를 두 개의 보상 구성 요소로 직접 적용하십시오: * 정확성 보상 * (규칙 기반의  최종 답변이 올바른 숫자로 분석되었는지 / 코드 단위 테스트가 통과되었는지) 및 * 형식 보상 * (완전이 사슬을  수 있습니까?`<think>…</think>`태그) 수천 단계에 걸쳐 평균 응답 길이는 ~100에서 ~10,000 토큰으로 증가하고 수학 벤치마크 점수는 거의 o1 미리보기 수준으로 올라간다. 모델은 처음부터 사유를 배우게 된다. 단점은: 그것의 사고 체인은 종종 읽지 못하며, 언어를 혼합하고, 스타일리시즘의 이 부족합니다.
- **R1.**4단계 파이프라인으로 R1-Zero의 읽기 문제들을 해결한다:
  1. **Cold-start SFT.**몇 천 개의 긴 CoT 시범을 수집하고, 깔끔한 포맷을 통해,
  2. **Reasoning-oriented GRPO.**코드 전환을 방지하기 위해 정확성+프라맷 보상과 *언어 일관성* 보상으로 GRPO를 적용하십시오.
  3. **Rejection sampling + SFT round 2.**RL 체크포인트에서 ~600K의 추론 궤도를 샘플링하고, 올바른 최종 답변과 읽을 수 있는 CoT를 가진 경우만 보관하고, 추론하지 않는 ~200K의 SFT 예제 (쓰기, QA, 자기 인식) 를 결합하여 다시 기초를 정렬하십시오.
  4. **Full-spectrum GRPO.**또 한 번 더 RL 라운드 (규칙에 근거한 보상) 과 일반 조화를 (사용성/무해성 선호도에 근거한 보상) 모두 포함합니다.

이 결과는 열린 무게에서 AIME와 MATH-500에 o1와 일치하며, 수분화하기에 충분히 작습니다. 같은 논문에서는 R1의 추론 흔적에 SFT'을 사용하여 6 개의 수분화 밀도가 높은 모델을 (Qwen-1.5B에서 Llama-70B) 내놓습니다. 학생의 크기에 강한 RL 선생의 수분화는 지속적으로 RL를 초점에서 이길 수 있습니다.

**Why GRPO instead of PPO for reasoning.**딥시크마스 논문 (Feb 2024) 에 나오는 세 가지 이유: (1) 훈련할 가치가 없는 네트워크, 메모리 절반으로 감소; (2) 그룹 기본선은 논리 작업이 생성하는 희귀한 궤도 끝 보상과 자연스럽게 처리합니다; (3) 초급상규화는 매우 다른 어려움의 문제들을 비교할 수 있는 장점을 만듭니다.

**Search-free vs search-based.**게임들은 분할되어 있습니다.

- *장거리 지평을 가진 완벽한 정보 게임* (GO, 체스): 여전히 검색 기반.
- *LLM 추론*: 아직 MCTS가 생산되지 않고, 전체 로플로우트에서 GRPO가 있습니다. 추론 계산에 있어서 가장 좋은 기술입니다. 프로세스 보너스 모델 (PRM) 은 단계적 검색이 추가되는 것을 암시합니다.

```figure
f3-selfplay-ladder
```

## 건설 해

코드는 `code/main.py`실행 **GRPO in miniature** 샘플의 여러 그룹을 가진 강도. 알고리즘은 LLM와 동일하지만 정책과 환경이 더 간단합니다. 이 방법은 * 손실* 및 * 그룹 관계상의 이점*을 가르칩니다. 이는 2025 년 혁신입니다.

### 단계 1: 작은 검증기 환경

```python
QUESTIONS = [
    {"prompt": "q1", "correct": 3},
    {"prompt": "q2", "correct": 1},
]

def verify(prompt_idx, answer_token):
    return 1.0 if answer_token == QUESTIONS[prompt_idx]["correct"] else 0.0
```

실제 GRPO에서 검증기는 단위 테스트를 실행하거나 수학 평등을 확인합니다.

### 단계 2: 정책: prompt에 대한 softmax 상 K 응답 토큰

```python
def policy_probs(theta, p_idx):
    return softmax(theta[p_idx])
```

즉, 임플라운드에 따라 조건화된 LLM의 최종 계층 출력과 동등합니다.

### 단계 3: 그룹 샘플링 및 그룹 관계상의 이점

```python
def grpo_step(theta, p_idx, G=8, beta=0.01, lr=0.1, rng=None):
    probs = policy_probs(theta, p_idx)
    samples = [sample(probs, rng) for _ in range(G)]
    rewards = [verify(p_idx, s) for s in samples]
    mean_r = sum(rewards) / G
    std_r = stddev(rewards) + 1e-8
    advs = [(r - mean_r) / std_r for r in rewards]

    for a, A in zip(samples, advs):
        grad = onehot(a) - probs
        for i in range(len(probs)):
            theta[p_idx][i] += lr * A * grad[i]
    # KL penalty: pull theta toward reference
    for i in range(len(probs)):
        theta[p_idx][i] -= beta * (theta[p_idx][i] - reference[p_idx][i])
```

그룹 관계적 이점은 2024 딥 검색 트릭입니다. 비평가 필요 없습니다. "기본선"은 그룹 평균이고 정상화는 그룹 std를 사용합니다.

### 단계 4: REINFORCE의 기본 기준과 비교 (값 없는)

같은 설정, 같은 계산, 단순한 REINFORCE. GRPO가 더 빠르고 안정적으로 공렴합니다.

### 단계 5: 엔트로피와 KL를 관찰하십시오

RLHF와 같은 진단: 참고로 KL를 의미합니다, 정책 엔트로피, 보상 시간. 이 모든 것이 안정되면 훈련이 완료됩니다.

## 함정

- **Reward hacking via verifier gaming.**GRPO는 RLHF의 위험을 물려받습니다. 검증자가 잘못되거나 착취할 수 있다면 LLM는 착취를 발견합니다.
- **Group size too small.**그룹 기준의 변수는 다음과 같습니다 $1/\sqrt{G}$아래쪽$G = 4$, 이점 신호는 고, 표준 선택은$G = 8$64까지
- **Length bias.**다른 길이의 LLM 완료는 다른 로그 확률을 가지고 있습니다. 토큰 수를 통해 정상화하거나 순서 레벨 로그-프로그를 사용하거나 최대 길이로 줄여서
- **Pure self-play cycles.**알파 제로 스타일의 훈련은 일반 수금 게임에서의 지배 루프에 갇힐 수 있습니다. 다양한 상대 풀 (리그 플레이, 레슨 10) 으로 완화됩니다.
- **Search-policy mismatch.**알파제로는 검색 결과물을 모방하기 위해 정책을 훈련시킵니다. 검색 배포를 나타낼 수 없을 정도로 정책망이 너무 작다면 훈련 상점이 있습니다.
- **Compute floor.**MuZero / AlphaZero는 대규모 컴퓨팅이 필요합니다. 단일 추축은 종종 수백 개의 GPU-시간이 됩니다. 학습을 위해 미니어 디모 (예를 들어, 커넥트 4에서 알파제로) 가 있습니다.
- **Verifier coverage.**버그 솔루션에 합격한 단위 테스트는 버그를 강화합니다. 가장자리를 잡는 검증기를 설계합니다.

## 사용 하 고

2026년 게임-RL 경상, 영역별로:

| Domain | Dominant method |
|--------|-----------------|
| Two-player zero-sum board games (Go, chess, shogi) | AlphaZero / MuZero / KataGo |
| Imperfect info card games (poker) | CFR + deep learning (DeepStack, Libratus, Pluribus) |
| Atari / pixel games | Muesli / MuZero / IMPALA-PPO |
| Large multiplayer strategy (Dota, StarCraft) | PPO + self-play + league (OpenAI Five, AlphaStar) |
| LLM math/code reasoning | GRPO (DeepSeek-R1, Qwen-RL, open replications) |
| LLM alignment | DPO / RLHF-PPO (not GRPO; verifier is preference not verifiable) |
| Robotics | PPO + DR (not game-RL, but uses same policy-gradient tools) |
| Combinatorial problems | AlphaZero variants (AlphaTensor, AlphaDev) |

* 레시피*  자기 플레이, 검색 향상, 정책 정제  텍스트, 픽셀 및 물리적 제어에 걸쳐 있습니다. GRPO는 가장 젊은 예입니다. 더 많은 것이 다가오고 있습니다.

## 선박

`outputs/skill-game-rl-designer.md`이 부분의 본문은

```markdown
---
name: game-rl-designer
description: Design a game-RL or reasoning-RL training pipeline (AlphaZero / MuZero / GRPO) for a given domain.
version: 1.0.0
phase: 9
lesson: 12
tags: [rl, alphazero, muzero, grpo, self-play]
---

Given a target (perfect-info game / imperfect-info / Atari / LLM reasoning / combinatorial), output:

1. Environment fit. Known rules? Markov? Stochastic? Multi-agent? Informs AlphaZero vs MuZero vs GRPO.
2. Search strategy. MCTS (PUCT with learned prior), Gumbel-sampled, best-of-N, or none.
3. Self-play plan. Symmetric self-play / league / offline data / verifier-generated.
4. Target signal. Game outcome / verifier reward / preference / learned model. Include robustness plan.
5. Diagnostics. Win rate vs baseline, ELO curve, verifier pass rate, KL to reference.

Refuse AlphaZero on imperfect-info games (route to CFR). Refuse GRPO without a trusted verifier. Refuse any game-RL pipeline without a fixed baseline opponent set (self-play ELO is uncalibrated otherwise).
```

## 운동

1. **Easy.**GRPO 강도들을 실행하라`code/main.py`. 2개의 명령어 × 4개의 응답 토큰을 각각 훈련시켜라.$G=8$- 그래
2. **Medium.**PPO (剪切) 과 바닐라 REINFORCE를 연결해 보세요. 같은 강도에서 샘플 효율과 보상 변수를 GRPO와 비교해 보세요.
3. **Hard.**2 길이의 "논리 연쇄"까지 확장: 에이전트가 두 개의 토큰을 발행하고 검증자가 쌍을 보상한다. GRPO가 2 단계 순서로 신용 할당을 처리하는 방법을 측정한다. (힌트: *पूर्ण 순서*에 대한 계산 그룹 이점, 두 토큰 위치로 전파한다.)

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| MCTS | "Tree search with learned net" | Monte Carlo Tree Search; UCB1/PUCT selection with learned $(p, v)$ priors. |
| AlphaZero | "Self-play + MCTS" | Policy-value net trained to match MCTS visits and game outcome. |
| MuZero | "Learned-model AlphaZero" | Same loop but in latent space via learned dynamics. |
| GRPO | "Critic-free PPO" | Group Relative Policy Optimization; REINFORCE with group-mean baseline + KL. |
| PUCT | "AlphaZero's UCB" | $Q + c \cdot p \cdot \sqrt{N} / (1 + N_a)$ — balances value estimate with prior. |
| Self-play | "Agent vs past self" | Standard for zero-sum; symmetric training signal. |
| League play | "Population-based self-play" | Past + current + exploiters sampled as opponents. |
| Verifier reward | "Verifiable RL" | Reward comes from a deterministic checker (tests pass, answer matches). |
| Process reward | "PRM" | Scores each reasoning step, not just the final answer. |

## 더 많은 읽기

- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270)- 그래
- [Silver et al. (2018). A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play (AlphaZero)](https://www.science.org/doi/10.1126/science.aar6404)- 그래
- [Schrittwieser et al. (2020). Mastering Atari, Go, chess and shogi by planning with a learned model (MuZero)](https://www.nature.com/articles/s41586-020-03051-4)- 그래
- [Vinyals et al. (2019). Grandmaster level in StarCraft II (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z)- 그래
- [DeepSeek-AI (2024). DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (GRPO)](https://arxiv.org/abs/2402.03300) GRPO와 그룹 관련 기준을 도입한 논문
- [DeepSeek-AI (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948) 전체 4단계 R1 레시피와 R1-제로 압축
- [Brown et al. (2019). Superhuman AI for multiplayer poker (Pluribus)](https://www.science.org/doi/10.1126/science.aay2400) CFR+ 심도 학습 규모
- [Tesauro (1995). Temporal Difference Learning and TD-Gammon](https://dl.acm.org/doi/10.1145/203330.203343)모든 것을 시작한 신문입니다.
- [Hugging Face TRL — GRPOTrainer](https://huggingface.co/docs/trl/main/en/grpo_trainer) 사용자 지정 보상 기능으로 GRPO를 적용하는 생산 참조
- [Qwen Team (2024). Qwen2.5-Math — GRPO replication](https://github.com/QwenLM/Qwen2.5-Math) R1 레시피를 여러 척도로 공개적으로 복제합니다.
- [Sutton & Barto (2018). Ch. 17 — Frontiers of Reinforcement Learning](http://incompleteideas.net/book/RLbook2020.pdf) R1이 LLM 규모에서 제시하는 자기 놀이, 검색 및 "디자인 보상"을 위한 교과서 프레임워크.
