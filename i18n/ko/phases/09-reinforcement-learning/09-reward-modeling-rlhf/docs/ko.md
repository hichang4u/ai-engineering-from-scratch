# 보너스 모델링 & RLHF

> 인간들은 "좋은 보조 응답"에 대한 보상 함수를 쓸 수는 없지만 두 가지 응답을 비교하고 더 나은 하나를 선택할 수 있습니다. 그 비교에 보상 모델을 맞게, 그 다음 언어 모델을 그 반대로 RL하십시오. 크리스티아노 2017.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment), Phase 9 · 08 (PPO)
**Time:** ~45 minutes

## 문제

다음 토큰 예측 목표에 대한 언어 모델을 훈련 시켰습니다. 문법적 영어도 작성합니다. 또한 거짓말을 하고, 거꾸로 돌아다니며 거부하는 것입니다. 더 많은 사전 훈련으로 문제를 해결할 수 없습니다. 웹 텍스트는 치료가 아닙니다.

"수준상수"는 도큰에 대한 폐쇄적인 표현이 아닙니다. 하지만 인간은 두 가지 출력을 비교하고 선호도를 표시할 수 있습니다. 그 값은 규모로 수집하는 데 저렴합니다.

RLHF (Christiano et al. 2017; Ouyang et al. 2022) 는 선호도를 보상 모델로 변환하고, 그 보상에 대한 LM를 PPO를 통해 최적화합니다. 세 단계: SFT → RM → PPO. 그것은 20232025년에 ChatGPT, Claude, Gemini 및 다른 모든 라인업 LLM를 배포한 요리법입니다.

2026년 PPO 단계가 대부분 DPO (Phase 10 · 08) 로 대체됩니다. 왜냐하면 그것은 더 저렴하고 조율 조율에 거의 좋기 때문입니다. 그러나 *상품 모델* 조각은 여전히 모든 Best-of-N 샘플러, 모든 RL-에서 확인할 수 있는 보상 파이프라인, 그리고 모든 논리 모델이 프로세스 보상 모델을 사용하는 것입니다. RLHF를 이해하면 전체 조율 스택을 이해합니다.

## 개념

![Three-stage RLHF: SFT, RM training on pairwise prefs, PPO with KL penalty](../assets/rlhf.svg)

**Stage 1: Supervised Fine-Tuning (SFT).**미리 훈련된 기본 모델에서 시작하여 목표 행동의 인간으로 작성된 시범 (명령을 따르는 응답, 유용한 응답 등) 을 정밀하게 조정합니다. 결과: 모델 $\pi_{\text{SFT}}$좋은 행동에 대한 편견이 있지만 여전히 제한없는 행동 공간을 가지고 있습니다.

**Stage 2: Reward Model training.**

- 응답 쌍을 수집합니다 $(y_+, y_-)$충고에$x$, 인간에 의해 "y_+는 y_-."로 표기됩니다.
- 보상 모델을 훈련시켜$R_\phi(x, y)$더 높은 점수를 부여하기 위해$y_+$- 그래
- 손실:**Bradley-Terry pairwise logistic**이 부분의 본문은

  $L(\phi) = -\mathbb{E}[ \log \sigma(R_\phi(x, y_+) - R_\phi(x, y_-)) ]$

  $\sigma$이 경우, BT는 1952년부터 표준 (브래들리-테리) 으로 사용되고 있으며 현대 RLHF에서 지배적인 선택이다.

- $R_\phi$일반적으로 SFT 모델에서 초기화되어 상단에 스칼라 헤드 (scalar head) 을 가지고 있습니다. 동일한 트랜스포머 척추; 단일 선형 층이 보상을 내보내습니다.

**Stage 3: PPO against the RM with KL penalty.**

- 훈련 가능한 정책을 시작하라$\pi_\theta$$\pi_{\text{SFT}}$- 얼어붙은 참조$\pi_{\text{ref}} = \pi_{\text{SFT}}$- 그래
- 응답 끝에서 보상$y$이 부분의 본문은

  $r_{\text{total}}(x, y) = R_\phi(x, y) - \beta \cdot \mathrm{KL}(\pi_\theta(\cdot \mid x) \Vert \pi_{\text{ref}}(\cdot \mid x))$

  KL의 벌금으로 막힌다$\pi_\theta$$\pi_{\text{SFT}}$ 그것은 *규제자*이고, 신뢰성이 어려운 지역이 아닙니다. $\beta$일반적으로 0.01-0.05
- 이 보상으로 PPO (Lesson 08) 를 실행하십시오. 이점은 토큰 레벨 궤도에 계산되지만 RM는 전체 응답만을 점수합니다.

**Why the KL?**이 장치 없이는 PPO는 보상 해킹 전략을 찾게 될 것입니다. RM는 유통 중 완료에만 훈련되었습니다. 유통 밖의 반응은 사람이 작성한 것보다 더 높은 점수를 얻을 수 있습니다. KL는 유지합니다.$\pi_\theta$RM가 훈련된 다리점 근처에 있는 이 단편은 RLHF에서 가장 중요한 단편입니다.

**2026 status:**

- **DPO**(라파일로프 2023): 폐쇄형 대수학은 2+3 단계가 우선 데이터에 대한 단일 감독 손실로 붕괴됩니다. RM, PPO가 없습니다. 계산의 일부에 대한 조화 기준에 대한 동일한 품질. 10 · 08 단계에서 다루어집니다.
- **GRPO**(DeepSeek 20242025): 비평가 대신 그룹 관계 기준을 가진 PPO, 인간 훈련된 RM 대신 *verifier* (코드 실행 / 수학 응답 일치) 로부터 보상. 추론 모델에 지배적이다. 9 · 12 단계에서 다루어집니다.
- **Process reward models (PRMs):**RLHF와 GRPO 양식에 모두 논리적으로 사용되는 점수 부분 솔루션 (논리 단계마다).
- **Constitutional AI / RLAIF:**인간 대신 선호도를 창출하기 위해 조선된 LLM를 사용하세요.

```figure
reward-model
```

## 건설 해

이 수업은 문자열로 표현된 작은 합성 "추진"과 "응답"을 사용합니다. RM는 토큰 가방 표현에 대한 선형 점수자입니다. 실제 LLM는 파이프라인의 * 모양 *가 중요하지 않습니다. 규모는 아닙니다. 참조`code/main.py`- 그래

### 단계 1: 합성 선호도 데이터

```python
PROMPTS = ["help me", "answer me", "explain this"]
GOOD_WORDS = {"clear", "specific", "kind", "thorough"}
BAD_WORDS = {"vague", "rude", "wrong", "short"}

def make_pair(rng):
    x = rng.choice(PROMPTS)
    y_good = rng.choice(list(GOOD_WORDS)) + " " + rng.choice(list(GOOD_WORDS))
    y_bad = rng.choice(list(BAD_WORDS)) + " " + rng.choice(list(BAD_WORDS))
    return (x, y_good, y_bad)
```

실제 RLHF에서는 인간 표기기들로 대체됩니다.`(prompt, preferred_response, rejected_response)`은 동일합니다.

### 단계 2: 브래들리-테리 보상 모델

선형 점수는: `R(x, y) = w · bag(y)`BT 쌍용 로그 손실을 최소화하기 위한 훈련:

```python
def rm_train_step(w, x, y_pos, y_neg, lr):
    r_pos = dot(w, bag(y_pos))
    r_neg = dot(w, bag(y_neg))
    p = sigmoid(r_pos - r_neg)
    for tok, cnt in bag(y_pos).items():
        w[tok] += lr * (1 - p) * cnt
    for tok, cnt in bag(y_neg).items():
        w[tok] -= lr * (1 - p) * cnt
```

몇 백개의 업데이트를 거쳐`w`좋은 단어 표지판에 긍정적인 무게를 부여하고 나쁜 단어에는 부정적인 무게를 부여합니다.

### 단계 3: RM에 대한 PPO 같은 정책

우리 장난감 정책은 단어에서 하나의 토큰을 생산합니다.$\log \pi_\theta(\text{token} \mid \text{prompt})$, KL-reference penalty를 추가하고,

```python
def rlhf_step(theta, ref, w, prompt, rng, eps=0.2, beta=0.1, lr=0.05):
    logits_theta = policy_logits(theta, prompt)
    probs = softmax(logits_theta)
    token = sample(probs, rng)
    logits_ref = policy_logits(ref, prompt)
    probs_ref = softmax(logits_ref)
    reward = dot(w, bag([token])) - beta * kl(probs, probs_ref)
    # ppo-style update on theta, treating reward as the return
    ...
```

### 4단계: KL를 감시하라

추적 평균$\mathrm{KL}(\pi_\theta \Vert \pi_{\text{ref}})$모든 업데이트를 해봐`~5-10`정책은 멀리 떨어져 있습니다$\pi_{\text{SFT}}$ 아래$\beta$이 방법은 실제 RLHF의 최고 진단입니다.

### 단계 5: TRL로 생산 레시피

장난감 파이프라인을 이해하면 실제 도서관 사용자가 쓰는 루프와 같습니다.[TRL](https://huggingface.co/docs/trl)참조 구현 `RewardTrainer`2단계 및`PPOTrainer`(기본으로 내장된 KL-to-reference) 단계 3.

```python
# Stage 2: reward model from pairwise preferences
from trl import RewardTrainer, RewardConfig
from transformers import AutoModelForSequenceClassification, AutoTokenizer

tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B-Instruct")
rm = AutoModelForSequenceClassification.from_pretrained(
    "meta-llama/Llama-3.1-8B-Instruct", num_labels=1
)

# dataset rows: {"prompt", "chosen", "rejected"} — Bradley-Terry format
trainer = RewardTrainer(
    model=rm,
    tokenizer=tok,
    train_dataset=preference_data,
    args=RewardConfig(output_dir="./rm", num_train_epochs=1, learning_rate=1e-5),
)
trainer.train()
```

```python
# Stage 3: PPO against the RM with KL penalty to the SFT reference
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead

policy = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")
ref    = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")  # frozen

ppo = PPOTrainer(
    config=PPOConfig(learning_rate=1.41e-5, batch_size=64, init_kl_coef=0.05,
                     target_kl=6.0, adap_kl_ctrl=True),
    model=policy, ref_model=ref, tokenizer=tok,
)

for batch in dataloader:
    responses = ppo.generate(batch["query_ids"], max_new_tokens=128)
    rewards   = rm(torch.cat([batch["query_ids"], responses], dim=-1)).logits[:, 0]
    stats     = ppo.step(batch["query_ids"], responses, rewards)
    # stats includes: mean_kl, clip_frac, value_loss — the three PPO diagnostics
```

도서관이 당신을 위해 하는 세 가지 일.`adap_kl_ctrl=True`적응-β 스케줄을 구현한다: 관찰된 KL가 `target_kl`, β가 두 배로 나뉘어, 반이 미만이면 β가 반으로 나뉘어 있습니다.`policy`그리고 가치 헤드 는 정책과 같은 척추에 살고 있습니다 (`AutoModelForCausalLMWithValueHead`스칼라 MLP 헤드 (Scallar MLP Head) 를 붙여 놓은 것 입니다.`policy/kl`그리고`value/loss`별도로

## 함정

- **Over-optimization / reward hacking.**RM는 불완전합니다.$\pi_\theta$높은 점수를 얻지만 나쁜 결과물을 찾습니다. 증상: 보상 점수가 무한히 상승하는 반면 인간 평가 점수는 고원 또는 감소합니다. 수정: 일찍 멈추고, 상승합니다 $\beta$, RM 훈련 데이터를 확장합니다.
- **Length hacking.**도움 이 되는 응답에 훈련 된 RM는 종종 임시로 길이를 보상합니다. 정책은 응답을 을 배우습니다. 보완: 길이를 정상화 한 보상 또는 길이를 인식하는 RM와 RLAIF.
- **Too-small RM.**작은 RM는 정책의 출력을 충실히 점수를 받을 수 없습니다.
- **KL tuning.**너무 낮은 β → 파동 및 보상 해킹. 너무 높은 β → 정책은 거의 변하지 않습니다. 표준 트릭은 단계별 고정 KL를 목표로 하는 * 적응성* β입니다.
- **Preference-data noise.**~ 30%의 인간 표기판은 거나 모호하다. 합의 필터링 데이터에 대한 RM를 훈련시키거나 BT에 온도를 사용함으로써 캘리버링하십시오.
- **Off-policy problems.**첫 번째 시대 이후 PPO 데이터는 약간 정책에 어긋납니다.

## 사용 하 고

2026년 RLHF는 다음과 같이 층으로 이루어집니다.

| Layer | Target | Method |
|-------|--------|--------|
| Instruction following, helpfulness, harmlessness | Alignment | DPO (Phase 10 · 08) preferred over RLHF-PPO. |
| Reasoning correctness (math, code) | Capability | GRPO with verifier reward (Phase 9 · 12). |
| Long-horizon multi-step tasks | Agentic | PPO / GRPO with process reward models over steps. |
| Safety / refusal behavior | Safety | RLHF-PPO with separate safety RM, or Constitutional AI. |
| Best-of-N at inference | Fast alignment | Use RM at decode time; no policy training needed. |
| Reward distillation | Inference compute | Train a small "reward head" on top of a frozen LM. |

RLHF는 2022년 2024년 * 방법이었다. 2026년, 생산 조렬 파이프라인은 RM가 집중적이거나 안전에 중요한 단계에서만 DPO-첫, PPO-일 뿐이다.

## 선박

`outputs/skill-rlhf-architect.md`이 부분의 본문은

```markdown
---
name: rlhf-architect
description: Design an RLHF / DPO / GRPO alignment pipeline for a language model, including RM, KL, and data strategy.
version: 1.0.0
phase: 9
lesson: 9
tags: [rl, rlhf, alignment, llm]
---

Given a base LM, a target behavior (alignment / reasoning / refusal / agent), and a preference or verifier budget, output:

1. Stage. SFT? RM? DPO? GRPO? With justification.
2. Preference or verifier source. Humans, AI feedback, rule-based, unit-test-pass, or reward distillation.
3. KL strategy. Fixed β, adaptive β, or DPO (implicit KL).
4. Diagnostics. Mean KL, reward stability, over-optimization guard (holdout human eval).
5. Safety gate. Red-team set, refusal rate, safety RM separate from helpfulness RM.

Refuse to ship RLHF-PPO without a KL monitor. Refuse to use an RM smaller than the target policy. Refuse length-only rewards. Flag any pipeline that does not hold back a blind human-eval set as lacking over-optimization protection.
```

## 운동

1. **Easy.**브래들리 테리 보상 모델을 훈련시켜`code/main.py`500개의 합성 선호도 쌍에서, 100개의 수직된 쌍에서, 쌍별 정확성을 측정한다. 90%를 초과한다.
2. **Medium.**장난감 PPO-RLHF 루프를 실행하세요$\beta \in \lbrace 0.0, 0.1, 1.0 \rbrace$각 점수를 RM 점수를 KL에 대한 참조로 업데이트를 통해
3. **Hard.**동일한 선호 데이터에 DPO (결정 형태의 선호도 확률 손실) 를 구현하고 계산에서 사용되고 최종 RM 점수를 달성한 RLHF-PPO 파이프라인과 비교하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| RLHF | "Alignment RL" | Three-stage SFT + RM + PPO pipeline (Christiano 2017, Ouyang 2022). |
| Reward Model (RM) | "The scoring net" | Learned scalar function fit to pairwise preferences via Bradley-Terry. |
| Bradley-Terry | "Pairwise logistic loss" | $P(y_+ \succ y_-) = \sigma(R(y_+) - R(y_-))$; the standard RM objective. |
| KL penalty | "Stay near the reference" | $\beta \cdot \mathrm{KL}(\pi_\theta \Vert \pi_{\text{ref}})$ in the reward; the anti-reward-hacking regularizer. |
| Reward hacking | "Goodhart's law" | Policy exploits RM flaws; symptoms: reward up, human eval flat. |
| RLAIF | "AI-labeled preferences" | RLHF where labels come from another LM instead of humans. |
| PRM | "Process Reward Model" | Scores partial reasoning steps; used in reasoning pipelines. |
| Constitutional AI | "Anthropic's method" | AI-generated preferences guided by explicit rules. |

## 더 많은 읽기

- [Christiano et al. (2017). Deep Reinforcement Learning from Human Preferences](https://arxiv.org/abs/1706.03741) RLHF를 시작한 신문
- [Ouyang et al. (2022). InstructGPT — Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) ChatGPT의 레시피
- [Stiennon et al. (2020). Learning to summarize with human feedback](https://arxiv.org/abs/2009.01325) 예전에 RLHF를 요약하기 위해
- [Rafailov et al. (2023). Direct Preference Optimization](https://arxiv.org/abs/2305.18290) DPO; 2026년 RLHF 이후의 결제
- [Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) RLAIF 및 자기 비판 루프
- [Anthropic RLHF paper (Bai et al. 2022). Training a Helpful and Harmless Assistant](https://arxiv.org/abs/2204.05862)HH 종이
- [Hugging Face TRL library](https://huggingface.co/docs/trl)생산`RewardTrainer`그리고`PPOTrainer`. 적응력 KL 및 가치 헤드 세부사항을 훈련자 소스를 읽어보세요.
- [Hugging Face — Illustrating Reinforcement Learning from Human Feedback](https://huggingface.co/blog/rlhf)램베르트, 카스트리카토, 폰 베라, 하브릴라  3단계 파이프라인의 카논िकल 걸음걸음을 다이어그램으로
- [von Werra et al. (2020). TRL: Transformer Reinforcement Learning](https://github.com/huggingface/trl) 도서관`examples/`라마, 미스트랄, 퀸의 종말부터 종말까지 RLHF 스크립트를 가지고 있습니다.
- [Sutton & Barto (2018). Ch. 17.4 — Designing Reward Signals](http://incompleteideas.net/book/RLbook2020.pdf) 보상 가설 관점; 보상 해킹에 대해 생각하는 필수적인 전제 조건.
