# 샘플링 방법

> 샘플링은 인공지능이 가능성의 공간을 탐구하는 방법입니다.

**Type:** Build
**Language:**파이썬
**Prerequisites:** Phase 1, Lessons 06-07 (Probability, Bayes' Theorem)
**Time:** ~120 minutes

## 학습 목표

- 오직 균일한 무작위 숫자를 사용하여 역 CDF, 거부 및 중요성 샘플링을 처음부터 구현
- 언어 모델 토큰 생성을위한 온도, 톱-k, 톱-p (핵) 샘플링을 구축
- 재발량화 트릭과 왜 VAEs에서 샘플링을 통해 반발을 가능하게 하는지를 설명하십시오.
- 메트로폴리스-하스팅스 MCMC를 실행하여 비정상화된 목표 분포에서 샘플을

## 문제

언어 모델은 여러분의 프롬프트를 처리하고 50,000개의 로그티의 벡터를 생성합니다. 단어자료의 모든 토큰에 대한 하나입니다. 이제 하나의 벡터를 선택해야 합니다. 어떻게요?

항상 가장 높은 확률의 토큰을 선택하면 모든 반응이 동일합니다. 결정적. 지루합니다. 일률적으로 무작위로 선택하면 출력은 미묘합니다. 대답은 이 극단 사이의 어딘가에 있습니다. 그리고 그 어딘가에 샘플링을 통해 제어됩니다.

샘플링은 텍스트 생성에만 국한되지 않습니다. 강화 학습은 샘플링 궤도를 통해 정책 기하급수치를 추정합니다. VAE는 학습된 분포에서 샘플을 채취하고 무작위로 뒤로 퍼져서 잠그어 있는 표현을 학습합니다. 디푸전 모델은 소음을 샘플링하고 반복적으로 소멸함으로써 이미지를 생성합니다. 몬테카로 방법은 닫힌 형태의 솔루션을 갖지 않는 통합을 추정합니다. MCMC 알고리즘은 수립이 불가능한 고차원 후속 분포를 탐구합니다.

모든 생성 AI 시스템은 샘플링 시스템입니다. 샘플링 전략은 출력 품질, 다양성 및 제어성을 결정합니다. 이 수업은 균일한 무작위 숫자에서 시작하여 현대 LLM와 생성 모델을 작동시키는 기술로 끝나는 모든 주요 샘플링 방법을 처음부터 구축합니다.

## 개념

### 샘플링 이 중요 한 이유

샘플링은 인공지능과 기계 학습의 네 가지 기본 역할에 걸쳐 나타납니다.

**Generation.**언어 모델, 전파 모델, GAN 모두 샘플링을 통해 출력을 생산합니다. 샘플링 알고리즘은 창의력, 일관성 및 다양성을 직접 제어합니다. 온도, 상위 k, 핵 샘플링은 엔지니어들이 매일 회전하는 버튼입니다.

**Training.**스토카스틱 매개 변수 하락 샘플은 미니 배트입니다. 신경 세포를 비활성화하기 위해 드롭트 샘플을 사용합니다. 데이터 증강 샘플은 무작위 변환을 보여줍니다. 중요성 샘플링은 강화 학습의 매개 변수를 줄이기 위해 샘플을 중화합니다.

**Estimation.**ML의 많은 양은 닫힌 형태의 솔루션을 가지고 있지 않습니다. 데이터 분포에 대한 예상 손실, 에너지 기반 모델의 분할 기능, 베이시안 추론의 증거. 몬테카로 추정은 샘플을 평균하여 이 모든 것을 대략적으로 나타냅니다.

**Exploration.**MCMC 알고리즘은 베이시안 추론에서 후속 분포를 탐구한다. 진화 전략은 매개 변수 혼란을 샘플링한다. 톰슨 샘플링은 강도에서 탐구와 착취를 균형 잡는다.

핵심 과제는 간단하게 분포된 샘플 (일본적, 정상적) 에서 직접 샘플을 얻을 수 있다는 것입니다. 다른 모든 것에서는 간단한 샘플을 목표 분포에서 샘플로 변환하는 방법이 필요합니다.

### 일률적인 무작위 샘플링

샘플링 방법은 여기서 시작됩니다. 균일한 무작위 숫자 생성자는 값들을 생성합니다.$[0, 1)$같은 길이의 모든 하위 간격이 같은 확률을 가지고 있는

```
U ~ Uniform(0, 1)

P(a <= U <= b) = b - a    for 0 <= a <= b <= 1

Properties:
  E[U] = 0.5
  Var(U) = 1/12
```

$n$상품, 생성$U$그리고 돌아와$\lfloor n U \rfloor$. 연속적인 범위에서 샘플을$[a, b]$, 계산$a + (b - a) U$- 그래

핵심 통찰력: 단일 균일 무작위 숫자는 어떤 분포에서 하나의 샘플을 생성하기 위해 정확한 무작위량을 포함합니다. 트릭은 올바른 변환을 찾는 것입니다.

### 역 CDF 방법 (반복 변환 샘플링)

누적 분포 함수 (CDF) 는 확률로 값을 지도합니다.

```
F(x) = P(X <= x)

Properties:
  F is non-decreasing
  F(-inf) = 0
  F(+inf) = 1
  F maps the real line to [0, 1]
```

역 CDF는 확률을 값으로 다시 나타냅니다.$U \sim \text{Uniform}(0, 1)$그럼$X = F^{-1}(U)$목표 분포를 따르고 있습니다.

```
Algorithm:
  1. Generate u ~ Uniform(0, 1)
  2. Return F_inverse(u)

Why it works:
  P(X <= x) = P(F_inverse(U) <= x) = P(U <= F(x)) = F(x)
```

**Exponential distribution example:**

```
PDF: f(x) = lambda * exp(-lambda * x),   x >= 0
CDF: F(x) = 1 - exp(-lambda * x)

Solve F(x) = u for x:
  u = 1 - exp(-lambda * x)
  exp(-lambda * x) = 1 - u
  x = -ln(1 - u) / lambda

Since (1 - U) and U have the same distribution:
  x = -ln(u) / lambda
```

이 방법은 잘 쓰면 잘 됩니다$F^{-1}$닫힌 형태로. 정상적인 분포에 대해서는 닫힌 형태의 역 CDF가 없습니다. 그래서 우리는 다른 방법을 사용합니다 (박스-뮬러 또는 수치 근접).

**Discrete version:**분배를 위한 CDF를 누적 수원으로 구성하여 생성$U$, 그리고 누적 금액이 이보다 높은 첫 번째 지수를 찾아내기$U$- 이렇게 해`sample_categorical`6강에서 작업합니다.

### 거부 표본

CDF를 뒤집을 수 없지만 목표 PDF를 일정으로 평가할 수 있을 때, 거부 샘플링이 작동합니다.

```
Target distribution: p(x)  (can evaluate, possibly unnormalized)
Proposal distribution: q(x)  (can sample from)
Bound: M such that p(x) <= M * q(x) for all x

Algorithm:
  1. Sample x ~ q(x)
  2. Sample u ~ Uniform(0, 1)
  3. If u < p(x) / (M * q(x)), accept x
  4. Otherwise, reject and go to step 1

Acceptance rate = 1/M
```

더 긴 경계가$M$, 수용률이 높을수록, 낮은 차원 (1-3) 에서 거부 샘플링이 잘 작동합니다. 높은 차원에서는 제안량의 대부분이 거부되기 때문에 수용률이 기하급수적으로 떨어집니다. 이것은 거부 샘플링의 차원성 저주입니다.

**Example: sampling from a truncated normal.**단축된 범위에서 일률적인 제안을 사용하십시오.$M$그 범위의 일반적인 PDF의 최대입니다.

**Example: sampling from a semicircle.**정사각형의 경계선에서 균일하게 제안합니다. 이 점이 반경 안에 떨어지면 받아보세요. 몬테카로 계산은 이렇게 합니다.$\pi$: 수용률은 면적 비율에 해당한다 $\pi/4$- 그래

### 중요성 샘플링

때로는 대상 배포에서 샘플이 필요하지 않습니다.$p(x)$- 예상값을 계산해야 합니다$p(x)$, 그리고 다른 분포의 샘플을 가지고 있습니다$q(x)$- 그래

```
Goal: estimate E_p[f(x)] = integral of f(x) * p(x) dx

Rewrite:
  E_p[f(x)] = integral of f(x) * (p(x)/q(x)) * q(x) dx
            = E_q[f(x) * w(x)]

where w(x) = p(x) / q(x)  are the importance weights.

Estimator:
  E_p[f(x)] ~ (1/N) * sum(f(x_i) * w(x_i))    where x_i ~ q(x)
```

이것은 강화 학습에 매우 중요합니다. PPO (Prosimal Policy Optimization) 에서, 당신은 오래된 정책에 따라 궤도를 수집합니다.$\pi_{\text{old}}$하지만 새로운 정책을 최적화하고 싶어합니다$\pi_{\text{new}}$. 중요성 무게는$\pi_{\text{new}}(a \mid s) / \pi_{\text{old}}(a \mid s)$PPO는 새로운 정책이 기존 정책과 너무 멀어지지 않도록 이러한 무게를 절단합니다.

중요성 샘플링 추정치의 변수는 얼마나 유사했는지에 달려 있습니다 $q$$p$- 만약$q$$p$, 몇 가지 샘플은 엄청난 무게를 얻으며 추정치를 지배합니다. 자기 정상화 된 중요성 샘플링은 이 문제를 줄이기 위해 무게의 합으로 나눕니다:

```math
\mathbb{E}_p[f(x)] \approx \frac{\sum_i w_i \, f(x_i)}{\sum_i w_i}
```

### 몬테카로 추정

몬테카로 추정은 무작위 샘플을 평균하여 통합을 근접합니다. 큰 숫자의 법칙은 공감대를 보장합니다.

```
Goal: estimate I = integral of g(x) dx over domain D

Method:
  1. Sample x_1, ..., x_N uniformly from D
  2. I ~ (Volume of D / N) * sum(g(x_i))

Error: O(1 / sqrt(N))   regardless of dimension
```

오류율은 차원 독립적입니다. 그래서 몬테카로 방법은 그리드 기반 통합이 불가능한 높은 차원에서 지배적입니다.

**Estimating pi:**

```
Sample (x, y) uniformly from [-1, 1] x [-1, 1]
Count how many fall inside the unit circle: x^2 + y^2 <= 1
pi ~ 4 * (count inside) / (total count)
```

**Estimating expectations:**

```
E[f(X)] ~ (1/N) * sum(f(x_i))    where x_i ~ p(x)

The sample mean converges to the true expectation.
Variance of the estimator = Var(f(X)) / N
```

### 마코프 체인 몬테카를로 (MCMC): 메트로폴리스-하스팅스

MCMC는 마코프 체인을 구축하고 있으며 그 고정된 유통은 목표 유통입니다.$p(x)$. 충분한 단계 후에, 체인에서 샘플은 (대부분)$p(x)$- 그래

```
Target: p(x)  (known up to a normalizing constant)
Proposal: q(x'|x)  (how to propose the next state given the current state)

Metropolis-Hastings algorithm:
  1. Start at some x_0
  2. For t = 1, 2, ..., T:
     a. Propose x' ~ q(x'|x_t)
     b. Compute acceptance ratio:
        alpha = [p(x') * q(x_t|x')] / [p(x_t) * q(x'|x_t)]
     c. Accept with probability min(1, alpha):
        - If u < alpha (u ~ Uniform(0,1)): x_{t+1} = x'
        - Otherwise: x_{t+1} = x_t
  3. Discard first B samples (burn-in)
  4. Return remaining samples
```

대칭적인 제안에 대해$(q(x' \mid x) = q(x \mid x'))$, 비율은 단순화되어 $p(x')/p(x)$이것은 원래의 메트로폴리스 알고리즘입니다.

**Why it works.**수용 규칙은 세부적인 균형을 보장합니다:$x$그리고 $x'$$x'$그리고 $x$. 상세한 균형은$p(x)$체인의 고정된 분포입니다.

**Practical considerations:**
- 연소: 체인이 균형을 이루기 전에 초기 샘플을 폐기한다
- 얇아지는: 모든 것을 유지하십시오$k$-자동관계를 줄이기 위한 제1 샘플
- 제안 규모: 너무 작고 연쇄가 느리게 움직인다 (고용성, 탐구 속도가 느리)
- 고차원 가우시안 제안에 대한 최적의 수용률은 약 0.234입니다.

### 기브스 샘플링

기브스 샘플링은 다변형 분포를 위한 MCMC의 특별한 사례입니다. 모든 차원의 이동을 한 번에 제안하는 대신 조건부 분포에서 한 변수를 한 번에 업데이트합니다.

```
Target: p(x_1, x_2, ..., x_d)

Algorithm:
  For each iteration t:
    Sample x_1^{t+1} ~ p(x_1 | x_2^t, x_3^t, ..., x_d^t)
    Sample x_2^{t+1} ~ p(x_2 | x_1^{t+1}, x_3^t, ..., x_d^t)
    ...
    Sample x_d^{t+1} ~ p(x_d | x_1^{t+1}, x_2^{t+1}, ..., x_{d-1}^{t+1})
```

기브스 샘플링은 조건부 배포에서 샘플을 가져야 합니다$p(x_i \mid x_{-i})$이것은 많은 모델들에게 간단합니다.
- 베이시안 네트워크: 조건은 그래프 구조에서 따른다
- 가우스 미화: 조건은 가우스 미화
- 이징 모델: 각 스핀의 조건은 단지 이웃에 달려 있습니다

수용률은 항상 1 (모든 제안은 받아들여진다) 왜냐하면 정확한 조건에서 샘플링이 자동으로 세부적인 균형을 만족시키기 때문입니다.

**Limitation.**변수가 매우 상관관계에 있을 때, 기브스 샘플링은 한 변수를 한 번에 업데이트하는 것이 분포를 통해 큰 단각 움직임을 할 수 없기 때문에 천천히 혼합됩니다.

### 온도 샘플링 (LLM에서 사용된다)

언어 모델 출력 로그 $z_1, \ldots, z_V$Softmax는 확률로 변환합니다. 온도는 softmax 전에 로그이트를 다시 측정합니다.

```
p_i = exp(z_i / T) / sum(exp(z_j / T))

T = 1.0: standard softmax (original distribution)
T -> 0:  argmax (deterministic, always picks highest logit)
T -> inf: uniform (all tokens equally likely)
T < 1.0: sharpens the distribution (more confident, less diverse)
T > 1.0: flattens the distribution (less confident, more diverse)
```

**Why it works.**로그트를 나눈$T < 1$로그이트 사이의 차이를 증폭시킵니다.$z_1 = 2$그리고$z_2 = 1$, 으로 나눌 수 있습니다$T = 0.5$주는$z_1/T = 4$그리고$z_2/T = 2$Softmax 이후 가장 높은 로그이트 토큰은 훨씬 더 큰 비중을 얻습니다.

**In practice:**
- $T = 0.0$: 탐욕적인 해독, 사실적인 질문과 답변을 위한 최적의
- $T = 0.3\text{-}0.7$: 약간 창의적이고 코드 생성에 좋은
- $T = 0.7\text{-}1.0$: 균형 잡힌, 일반적인 대화에 좋은
- $T = 1.0\text{-}1.5$: 창의적인 글쓰기, 브레인스토밍
- $T > 1.5$: 점점 무작위, 거의 유용하지 않습니다

온도는 어떤 토큰이 가능하는지 바꾸지 않고, 각각의 토큰에 할당된 확률 질량을 바꾸어 놓습니다.

### 1K 표본

-k 샘플링은  후보자를 설정한$k$가장 높은 확률을 가진 토큰, 그리고 그 제한된 집합에서 다시 정상화 및 샘플

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Keep only the top k tokens
  4. Renormalize: p_i' = p_i / sum(p_j for j in top-k)
  5. Sample from the renormalized distribution

k = 1:  greedy decoding
k = V:  no filtering (standard sampling)
k = 40: typical setting, removes long tail of unlikely tokens
```

TOP-K는 모델이 어휘 배포의 긴 꼬리에 존재하는 매우 희귀한 토큰 (타이포, 노 nonsense) 을 선택하는 것을 막습니다. 문제는: $k$맥락에 관계없이 고정됩니다. 모델이 자신있게 (통신표가 95% 확률을 가지고)$k = 40$아직 39가지의 대안이 허용됩니다. 모델이 불확실하다면 (가능성은 1000개의 토큰에 분포됩니다.)$k = 40$그럴듯한 선택권을 차단합니다.

### 상위 (핵) 샘플링

톱-P 샘플링은 후보 세트의 크기를 동적으로 조정합니다. 고정된 수의 토큰을 유지하기 보다는 누적 확률이 초과되는 가장 작은 토큰을 유지합니다 $p$- 그래

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Find smallest k such that sum of top-k probabilities >= p
  4. Keep only those k tokens
  5. Renormalize and sample

p = 0.9:  keeps tokens covering 90% of probability mass
p = 1.0:  no filtering
p = 0.1:  very restrictive, nearly greedy
```

모델이 자신감을 갖는 경우 핵 샘플링은 몇 개의 토큰 (아마도 2-3) 을 유지한다. 모델이 불확실할 때 많은 토큰 (아마도 200) 을 유지한다. 이러한 적응적 행동은 일반적으로 핵 샘플링이 상위 k보다 더 나은 텍스트를 생성하는 이유입니다.

**Common combinations:**
- 온도는 0.7 + 상위 p 0.9: 일반적인 목적의 설정이 좋습니다.
- 온도는 0.0 (만욕): 결정적 작업에 가장 좋습니다
- 온도 1.0 + 상위 k 50: Fan et al. (2018) 원본 종이 설정

상위 K와 상위 P를 결합하면, 상위 K를 먼저 적용하고, 나머지 세트에 상위 P를 적용하면

### 재발전기술 (VAEs에서 사용된다)

변동자동화호기 (VAE) 는 잠정 공간의 배포에 입력된 입력들을 암호화하여 배포로부터 샘플을 채취하고 샘플을 다시 복제하여 학습한다. 문제는 샘플링 작업을 통해 배포할 수 없다는 것이다.

```
Standard sampling (not differentiable):
  z ~ N(mu, sigma^2)

  The randomness blocks gradient flow.
  d/d_mu [sample from N(mu, sigma^2)] = ???
```

재변경화 트릭은 무작위성을 매개 변수로부터 분리합니다.

```
Reparameterized sampling:
  epsilon ~ N(0, 1)          (fixed random noise, no parameters)
  z = mu + sigma * epsilon   (deterministic function of parameters)

  Now z is a deterministic, differentiable function of mu and sigma.
  d(z)/d(mu) = 1
  d(z)/d(sigma) = epsilon

  Gradients flow through mu and sigma.
```

이 방법은 효과가 있기 때문입니다$\mathcal{N}(\mu, \sigma^2)$분포율이 $\mu + \sigma \cdot \mathcal{N}(0, 1)$. 핵심 통찰력: 무작위성을 매개 변수 없는 원천으로 이동 ($\epsilon$), 다음으로 샘플을 매개 변수의 분화 가능한 변환으로 표현합니다.

**In the VAE training loop:**
1. 코드 출력$\mu$그리고$\log(\sigma^2)$각 입력값에
2. 샘플$\epsilon \sim \mathcal{N}(0, 1)$
3. 계산$z = \mu + \sigma \epsilon$
4. 해독$z$입력값을 재구성하기 위해서
5. 단계 4, 3, 2, 1을 통해 뒤로 퍼져나갈 수 있습니다 (단계 3가 차별화되기 때문에 가능합니다)

재발전 트릭이 없으면 표준적인 후속 확산을 통해 VAEs를 훈련시킬 수 없습니다. 이 단일 통찰은 VAEs를 실용화했습니다.

### Gumbel-Softmax (분별 가능한 분류 샘플링)

재정분리 트릭은 연속 분포 (가우스주의) 에서 작동합니다. 분포된 범주 분포에 대해서는 다른 접근법이 필요합니다. Gumbel-Softmax는 범주 샘플링에 대한 차별화 가능한 근접을 제공합니다.

**The Gumbel-Max trick (non-differentiable):**

```
To sample from a categorical distribution with log-probabilities log(p_1), ..., log(p_k):
  1. Sample g_i ~ Gumbel(0, 1) for each category
     (g = -log(-log(u)), where u ~ Uniform(0, 1))
  2. Return argmax(log(p_i) + g_i)

This produces exact categorical samples.
```

**Gumbel-Softmax (differentiable approximation):**

```
Replace the hard argmax with a soft softmax:
  y_i = exp((log(p_i) + g_i) / tau) / sum(exp((log(p_j) + g_j) / tau))

tau (temperature) controls the approximation:
  tau -> 0:  approaches a one-hot vector (hard categorical)
  tau -> inf: approaches uniform (1/k, 1/k, ..., 1/k)
  tau = 1.0: soft approximation
```

벨-소프트맥스는 디스크릿 샘플의 연속적인 긴장을 풀 수 있다. 출력은 하드 벨 대신 확률 벡터 (soft one-hot) 이다. 벨 벨은 소프트맥스를 통해 흐른다. 훈련에서 앞으로 통과하는 동안 "직접으로" 추정기를 사용할 수 있다. 앞 통과에 하드 argmax을 사용하지만 후퇴 통과에 부드러운 벨-소프트맥스 기하를 사용한다.

**Applications:**
- VAEs에서 유연한 변수
- 신경 구조 검색 (비분별한 동작을 선택)
- 하드 주의 메커니즘
- 배타적 행동으로 강화 학습

### 층형 샘플링

표준 몬테카로 샘플링은 우연히 샘플 공간에서 격차를 남겨 둘 수 있습니다. 층형 샘플링은 공간을 층으로 나누고 각 층에서 샘플링을 통해 커버링을 심지어 강요합니다.

```
Standard Monte Carlo:
  Sample N points uniformly from [0, 1]
  Some regions may have clusters, others gaps

Stratified sampling:
  Divide [0, 1] into N equal strata: [0, 1/N), [1/N, 2/N), ..., [(N-1)/N, 1)
  Sample one point uniformly within each stratum
  x_i = (i + u_i) / N   where u_i ~ Uniform(0, 1),  i = 0, ..., N-1
```

층형 샘플링은 항상 표준 몬테카로와 비교하여 낮은 또는 동등한 변수를 가지고 있습니다.

```
Var(stratified) <= Var(standard Monte Carlo)

The improvement is largest when f(x) varies smoothly.
For piecewise-constant functions, stratified sampling is exact.
```

**Applications:**
- 수학적 통합 (마네트 카를로)
- 훈련 데이터 분할 (각 폴드에서 클래스 균형을 보장)
- 계층화와 함께 중요성 샘플링 (두 기술을 결합)
- NeRF (Neural Radiance Fields) 는 카메라 반지 일선으로 층화된 샘플링을 사용합니다.

### 전파 모델과의 연결

디프루전 모델은 샘플링 과정을 통해 이미지를 생성합니다. 앞 프로세스는 이미지 위에 가우스 잡음을 추가합니다.$T$순수한 소리로 변하기까지 단계별로 진행됩니다. 반전 과정은 소멸을 배우며, 원작 이미지를 단계적으로 복구합니다.

```
Forward process (known):
  x_t = sqrt(alpha_t) * x_{t-1} + sqrt(1 - alpha_t) * epsilon
  where epsilon ~ N(0, I)

  After T steps: x_T ~ N(0, I)  (pure noise)

Reverse process (learned):
  x_{t-1} = (1/sqrt(alpha_t)) * (x_t - (1 - alpha_t)/sqrt(1 - alpha_bar_t) * epsilon_theta(x_t, t)) + sigma_t * z
  where z ~ N(0, I)

  Each denoising step is a sampling step.
```

이 수업의 방법과 연결:
- 각 단절 단계에서는 재정정형화 트릭을 사용합니다 ( 샘플 잡음, 결정적 변환을 적용)
- 잡음 시간표$\lbrace \alpha_t \rbrace$온도 을 조절하는
- 교육은 몬테카로 추정치를 사용하여 ELBO (증명 아래쪽 경계) 를 근접합니다
- 디푸전 모델에서 조상 샘플링은 마코프 연쇄 (모든 단계는 현재 상태에만 달려 있습니다)

전체 이미지 생성 과정은 반복적인 샘플링입니다. 잡음에서 시작하여, 각 단계에서는 학습된 비명 모델에 따라 조건화된 약간 덜 잡음적인 버전을 샘플링합니다.

```figure
monte-carlo-pi
```

## 건설 해

### 단계 1: 일률적이고 역 CDF 샘플링

```python
import math
import random

def sample_uniform(a, b):
    return a + (b - a) * random.random()

def sample_exponential_inverse_cdf(lam):
    u = random.random()
    return -math.log(u) / lam
```

10,000개의 기하급수 샘플을 생성하고 평균값을 확인합니다$1/\lambda$- 그래

### 단계 2: 거부 샘플링

```python
def rejection_sample(target_pdf, proposal_sample, proposal_pdf, M):
    while True:
        x = proposal_sample()
        u = random.random()
        if u < target_pdf(x) / (M * proposal_pdf(x)):
            return x
```

분포가 줄여진 정상적인 분포에서 추출을 위해 거부 샘플링을 사용하십시오. 샘플의 히스토그램을 통해 모양을 확인하십시오.

### 단계 3: 중요성 샘플링

```python
def importance_sampling_estimate(f, target_pdf, proposal_pdf, proposal_sample, n):
    total = 0
    for _ in range(n):
        x = proposal_sample()
        w = target_pdf(x) / proposal_pdf(x)
        total += f(x) * w
    return total / n
```

추정$\mathbb{E}[X^2]$일정한 제안으로 일반적인 분포를 통해$\mu^2 + \sigma^2$)

### 단계 4: 몬테카로 평가를

```python
def monte_carlo_pi(n):
    inside = 0
    for _ in range(n):
        x = random.uniform(-1, 1)
        y = random.uniform(-1, 1)
        if x*x + y*y <= 1:
            inside += 1
    return 4 * inside / n
```

### 단계 5: 메트로폴리스-하스팅스 MCMC

```python
def metropolis_hastings(target_log_pdf, proposal_sample, proposal_log_pdf, x0, n_samples, burn_in):
    samples = []
    x = x0
    for i in range(n_samples + burn_in):
        x_new = proposal_sample(x)
        log_alpha = (target_log_pdf(x_new) + proposal_log_pdf(x, x_new)
                     - target_log_pdf(x) - proposal_log_pdf(x_new, x))
        if math.log(random.random()) < log_alpha:
            x = x_new
        if i >= burn_in:
            samples.append(x)
    return samples
```

쌍모형 분포 (가우시안 두 개의 혼합) 에서 샘플. 체인의 궤도를 시각화하십시오.

### 단계 6: 기브스 샘플링

```python
def gibbs_sampling_2d(conditional_x_given_y, conditional_y_given_x, x0, y0, n_samples, burn_in):
    x, y = x0, y0
    samples = []
    for i in range(n_samples + burn_in):
        x = conditional_x_given_y(y)
        y = conditional_y_given_x(x)
        if i >= burn_in:
            samples.append((x, y))
    return samples
```

### 단계 7: 온도 샘플링

```python
def softmax(logits):
    max_l = max(logits)
    exps = [math.exp(z - max_l) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

def temperature_sample(logits, temperature):
    scaled = [z / temperature for z in logits]
    probs = softmax(scaled)
    return sample_from_probs(probs)
```

토큰 로그티의 집합에서 온도가 출력 배포를 어떻게 변화시키는지를 보여주십시오.

### 단계 8: 상위 K 및 상위 P 샘플링

```python
def top_k_sample(logits, k):
    indexed = sorted(enumerate(logits), key=lambda x: -x[1])
    top = indexed[:k]
    top_logits = [l for _, l in top]
    probs = softmax(top_logits)
    idx = sample_from_probs(probs)
    return top[idx][0]

def top_p_sample(logits, p):
    probs = softmax(logits)
    indexed = sorted(enumerate(probs), key=lambda x: -x[1])
    cumsum = 0
    selected = []
    for token_idx, prob in indexed:
        cumsum += prob
        selected.append((token_idx, prob))
        if cumsum >= p:
            break
    sel_probs = [pr for _, pr in selected]
    total = sum(sel_probs)
    sel_probs = [pr / total for pr in sel_probs]
    idx = sample_from_probs(sel_probs)
    return selected[idx][0]
```

### 9단계: 재발전기술

```python
def reparam_sample(mu, sigma):
    epsilon = random.gauss(0, 1)
    return mu + sigma * epsilon

def reparam_gradient(mu, sigma, epsilon):
    dz_dmu = 1.0
    dz_dsigma = epsilon
    return dz_dmu, dz_dsigma
```

재차량 샘플을 통해 gradients가 흐르는 것을 증명하지만 직접 샘플링을 통해 흐르지 않습니다.

### 10단계: Gumbel-Softmax

```python
def gumbel_sample():
    u = random.random()
    return -math.log(-math.log(u))

def gumbel_softmax(logits, temperature):
    gumbels = [math.log(p) + gumbel_sample() for p in logits]
    return softmax([g / temperature for g in gumbels])
```

온도가 감소하는 것이 출력 벡터를 한 핫 벡터로 접근하게 하는 방법을 보여준다.

모든 시각화와 함께 완전한 구현이 `code/sampling.py`- 그래

## 사용 하 고

NumPy와 SciPy를 통해 생산 버전은:

```python
import numpy as np

rng = np.random.default_rng(42)

exponential_samples = rng.exponential(scale=2.0, size=10000)
print(f"Exponential mean: {exponential_samples.mean():.4f} (expected 2.0)")

from scipy import stats
normal = stats.norm(loc=0, scale=1)
print(f"CDF at 1.96: {normal.cdf(1.96):.4f}")
print(f"Inverse CDF at 0.975: {normal.ppf(0.975):.4f}")

logits = np.array([2.0, 1.0, 0.5, 0.1, -1.0])
temperature = 0.7
scaled = logits / temperature
probs = np.exp(scaled - scaled.max()) / np.exp(scaled - scaled.max()).sum()
token = rng.choice(len(logits), p=probs)
print(f"Sampled token index: {token}")
```

규모 MCMC에 대해서는 전용 라이브러리를 사용하십시오.
- PyMC: NUTS (응응성 HMC) 를 가진 완전한 베이시안 모델링
- emcee: MCMC 샘플러
- NumPyro/JAX: GPU 가속 MCMC

이 모든 걸 처음부터 만들어냈어 이제 도서관 전화가 뭘 하는지 알잖아

## 운동

1. 카우시 분포에 대해 역 CDF 샘플링을 실시합니다. CDF는 $F(x) = 0.5 + \arctan(x)/\pi$. 10,000개의 샘플을 생성하고 실제 PDF에 대한 히스토그램을 그려보세요. 무거운 꼬리를 (중심에서 멀리 있는 극단적인 값) 알아보세요.

2. 거부 샘플링을 사용하여 유니폼 (Uniform) [1] (0, 1) 제안을 사용하여 베타 (Beta) 배포에서 샘플을 생성하십시오. 실제 베타 (Beta) PDF에 대한 수용 샘플을 그려보세요. 이론적 수용률은 무엇입니까?

3. $\sin(x)$0에서 $\pi$몬테카를로에서 1,000, 10,000, 100,000 샘플을 사용해서 각 레벨의 오류를 비교해 보세요.$O(1/\sqrt{N})$- 그래

4. 2D 분포에서 샘플을 채취하기 위해 Metropolis-Hastings를 구현합니다 $p(x, y)$$\exp(-(x^2 y^2 + x^2 + y^2 - 8x - 8y) / 2)$. 샘플과 체인 궤도를 그려서, 다른 제안 표준차각을 실험한다.

5. 전체 텍스트 생성 데모를 구축하십시오. 로그이트와 함께 10 단어의 어휘를 제공하면 (a) 탐욕, (b) 온도 = 0.7, (c) 상위 k = 3, (d) 상위 p = 0.9을 사용하여 20 개의 토큰의 순서를 생성하십시오. 5 번의 출력에서 출력 다양성을 비교하십시오.

### 암시

**Exercise 1.**해결해$u = F(x)$$x$, 즉$x = \tan(\pi(u - 0.5))$샘플 중반이 0에 가깝고 샘플의 약 6%가$\lvert x \rvert > 10$, 즉$1 - (2/\pi)\arctan(10)$- 그래

**Exercise 2.**베타 (Beta) 2, 5) 밀도는$30x(1-x)^4$. 모드에서 가장 큰 값을 찾아내기$x = 1/5$그리고 그 값을$M$`rejection_sample`이론적 인 수용률은$1/M$, 그래서 여러분이 받아들이는 제안의 분자와 비교해 보세요.

**Exercise 3.**정확한 값은 2입니다`monte_carlo_integral(math.sin, 0, math.pi, n)`각$n$그리고 여러 씨앗을 가지고 각 라인을 반복합니다.$n$10배 증가하면 평균 오류가 약 10배 감소해야 합니다.$\sqrt{10} \approx 3.2$- 그래

**Exercise 4.**목표의 로그를 작성해 보세요$-(x^2 y^2 + x^2 + y^2 - 8x - 8y)/2$, 그리고 그것을 전달합니다`metropolis_hastings_2d`. 각 제안 표준차례에 대한 수용률을 기록하라: 아주 작은 값은 거의 모든 단계를 받아들이지만 천천히 움직이고, 매우 큰 값은 거의 모든 단계를 거부한다.

**Exercise 5.**탐욕적인 해독은 각 단계에 가장 큰 로그티의 지수를 가져옵니다.`temperature_sample``top_k_sample`그리고`top_p_sample`다른 세 가지 방법의 경우, 탐욕은 5개의 행렬에서 동일한 순서를 제시해야 합니다. 따라서 다양성을 측정하기 위해 각 방법의 다른 순서를 계산합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Sampling | "Drawing random values" | Generating values according to a probability distribution. The mechanism behind all generative AI |
| Uniform distribution | "All equally likely" | Every value in $[a, b]$ has equal probability density $1/(b-a)$. The starting point for all sampling methods |
| Inverse CDF | "Probability transform" | $F^{-1}(U)$ converts a uniform sample into a sample from any distribution with known CDF. Exact and efficient |
| Rejection sampling | "Propose and accept/reject" | Generate from a simple proposal, accept with probability proportional to target/proposal ratio. Exact but wastes samples |
| Importance sampling | "Reweight samples" | Estimate expectations under $p(x)$ using samples from $q(x)$ by weighting each sample by $p(x)/q(x)$. Core to PPO in RL |
| Monte Carlo | "Average random samples" | Approximate integrals as sample averages. Error $O(1/\sqrt{N})$ regardless of dimension |
| MCMC | "Random walk that converges" | Construct a Markov chain whose stationary distribution is the target. Metropolis-Hastings is the foundational algorithm |
| Metropolis-Hastings | "Accept uphill, sometimes downhill" | Propose moves, accept based on density ratio. Detailed balance ensures convergence to target distribution |
| Gibbs sampling | "One variable at a time" | Update each variable from its conditional distribution holding others fixed. 100% acceptance rate |
| Temperature | "Confidence knob" | Divides logits by $T$ before softmax. $T<1$ sharpens (more confident), $T>1$ flattens (more diverse) |
| Top-k sampling | "Keep the k best" | Zero out all but the $k$ highest-probability tokens, renormalize, sample. Fixed candidate set size |
| Nucleus sampling (top-p) | "Keep the probable ones" | Keep the smallest set of tokens whose cumulative probability exceeds $p$. Adaptive candidate set size |
| Reparameterization trick | "Move randomness outside" | Write $z = \mu + \sigma \epsilon$ where $\epsilon \sim \mathcal{N}(0,1)$. Makes sampling differentiable. Essential for VAE training |
| Gumbel-Softmax | "Soft categorical sampling" | Differentiable approximation to categorical sampling using Gumbel noise + softmax with temperature |
| Stratified sampling | "Forced coverage" | Divide sample space into strata, sample from each. Always lower variance than naive Monte Carlo |
| Burn-in | "Warm-up period" | Initial MCMC samples discarded before the chain reaches its stationary distribution |
| Detailed balance | "Reversibility condition" | $p(x) T(x \to y) = p(y) T(y \to x)$. Sufficient condition for $p$ to be the stationary distribution of a Markov chain |
| Diffusion sampling | "Iterative denoising" | Generate data by starting from noise and applying learned denoising steps. Each step is a conditional sampling operation |

## 더 많은 읽기

- [Holbrook (2023): The Metropolis-Hastings Algorithm](https://arxiv.org/abs/2304.07010)- MCMC 기초에 대한 상세한 설명
- [Jang, Gu, Poole (2017): Categorical Reparameterization with Gumbel-Softmax](https://arxiv.org/abs/1611.01144)- 원본 Gumbel-Softmax 종이
- [Holtzman et al. (2020): The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)- 핵 (top-p) 샘플링 종이
- [Kingma & Welling (2014): Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)- 재발량화 기법을 소개하는 VAE 문서
- [Ho, Jain, Abbeel (2020): Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)- DDPM는 샘플링과 이미지 생성
