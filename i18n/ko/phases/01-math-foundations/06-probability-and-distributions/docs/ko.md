# 확률 및 분포

> 확률은 인공지능이 불확실성을 표현하는 언어로 사용한다.

**Type:** Learn
**Language:**파이썬
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~75 minutes

## 학습 목표

- 베르누리, 카테고리, 포이스온, 유니폼, 정상적인 분포를 위해 PMF 및 PDF를 처음부터 구현
- 예상된 값, 변수를 계산하고, 왜 가우시안들이 지배하는지 설명하기 위해 중앙 제한 정리를 사용하십시오.
- 수학적 안정성 트릭 (max logit) 을 사용하여 softmax 및 log-softmax 함수를 구축하십시오.
- 로그이트에서 크로스 엔트로피 손실을 계산하고 부정적인 로그 확률에 연결합니다

## 문제

분류자 출력`[0.03, 0.91, 0.06]`언어 모델은 50,000명의 후보자로부터 다음 단어를 선택합니다. 분포 모델은 학습된 분포에서 샘플을 받아 이미지를 생성합니다. 이 모든 것은 행동의 확률입니다.

모델이 하는 모든 예측은 확률 분포입니다. 모든 손실 함수는 예측된 분포가 실제 분포에서 얼마나 멀리 있는지 측정합니다. 모든 훈련 단계에서는 한 분포가 다른 분포와 더 닮을 수 있도록 매개 변수를 조정합니다. 확률이 없으면 단일 ML 논문을 읽을 수 없습니다. 단일 모델을 디버깅하거나 훈련 손실이 NaN인 이유를 이해할 수 없습니다.

## 개념

### 사건, 샘플 공간 및 확률

샘플 공간$S$모든 가능한 결과의 집합입니다. 이벤트는 샘플 공간의 하위 집합입니다. 확률은 이벤트들을 0에서 1 사이의 숫자로 지도합니다.

```
Coin flip:
  S = {H, T}
  P(H) = 0.5,  P(T) = 0.5

Single die roll:
  S = {1, 2, 3, 4, 5, 6}
  P(even) = P({2, 4, 6}) = 3/6 = 0.5
```

세 가지 자부심이 확률을 정의합니다.
1. $P(A) \ge 0$모든 이벤트에$A$
2. $P(S) = 1$(어떤 일이 항상 일어나는)
3. $P(A \text{ or } B) = P(A) + P(B)$언제$A$그리고$B$둘 다 일어날 수 없습니다

다른 모든 것 (베이즈 정리, 기대, 분포) 이 세 가지 규칙에서 따른다.

### 조건부 가능성과 독립

$P(A \mid B)$확률이 $A$그 점을 고려하면$B$무슨 일이 일어났어요

```
P(A|B) = P(A and B) / P(B)

Example: deck of cards
  P(King | Face card) = P(King and Face card) / P(Face card)
                      = (4/52) / (12/52)
                      = 4/12 = 1/3
```

두 가지 사건은 독립적이죠. 한 사건은 다른 사건에 대해 아무 것도 말하지 않습니다.

```math
\begin{aligned}
\text{Independent:} \quad & P(A \mid B) = P(A) \\
\text{Equivalent to:} \quad & P(A \text{ and } B) = P(A) \cdot P(B)
\end{aligned}
```

동전 던지는 것은 독립적이지만, 교체 없이 카드를 뽑는 것은 그렇지 않습니다.

### 확률 질량 함수와 확률 밀도 함수

유연한 무작위 변수는 확률 질량 함수를 (PMF) 가지고 있습니다. 각각의 결과에는 직접 읽을 수 있는 특정 확률이 있습니다.

```
PMF: P(X = k)

Fair die:
  P(X = 1) = 1/6
  P(X = 2) = 1/6
  ...
  P(X = 6) = 1/6

  Sum of all probabilities = 1
```

연속적인 무작위 변수는 확률 밀도 함수를 (PDF) 가지고 있다. 단일 지점에서의 밀도는 확률이 아니다. 확률은 간격에 걸쳐 밀도를 통합하는 것으로 나온다.

```
PDF: f(x)

P(a <= X <= b) = integral of f(x) from a to b

f(x) can be greater than 1 (density, not probability)
integral from -inf to +inf of f(x) dx = 1
```

이 구별은 ML에서 중요합니다. 분류 출력은 PMF (비밀 선택) 이다. VAE 잠자리 공간은 PDF ( 연속) 를 사용합니다.

### 일반적인 분포

**Bernoulli:**한 실험, 두 결과, 모형의 바이너리 분류

```math
\begin{aligned}
P(X = 1) &= p \\
P(X = 0) &= 1 - p \\
\text{Mean} = p, &\quad \text{Variance} = p(1-p)
\end{aligned}
```

**Categorical:**한 번의 재판$k$결과: 모델들 다급 분류 (softmax output)

```math
\begin{aligned}
& P(X = i) = p_i, \quad \text{where } \textstyle\sum_i p_i = 1 \\
& \text{Example: } P(\text{cat}) = 0.7, \quad P(\text{dog}) = 0.2, \quad P(\text{bird}) = 0.1
\end{aligned}
```

**Uniform:**모든 결과도 똑같이 가능하죠.

```math
\begin{aligned}
\text{Discrete:} \quad & P(X = k) = 1/n \text{ for } k \in \lbrace 1, \ldots, n \rbrace \\
\text{Continuous:} \quad & f(x) = 1/(b-a) \text{ for } x \in [a, b]
\end{aligned}
```

**Normal (Gaussian):**벨 곡선 (중소로 매개된)$\mu$) 및 변동 ($\sigma^2$)

```
f(x) = (1 / sqrt(2*pi*sigma^2)) * exp(-(x - mu)^2 / (2*sigma^2))

Standard normal: mu = 0, sigma = 1
  68% of data within 1 sigma
  95% within 2 sigma
  99.7% within 3 sigma
```

**Poisson:**일정한 간격에서 희귀한 사건들을 계산하고,

```math
\begin{aligned}
P(X = k) &= \frac{\lambda^k e^{-\lambda}}{k!} \\
\text{Mean} = \lambda, &\quad \text{Variance} = \lambda
\end{aligned}
```

### 예상 가치 와 다양성

예상값은 중계된 평균 결과입니다.

```math
\begin{aligned}
\text{Discrete:} \quad & \mathbb{E}[X] = \sum_i x_i \, P(X = x_i) \\
\text{Continuous:} \quad & \mathbb{E}[X] = \int x \, f(x) \, dx
\end{aligned}
```

변동 측정은 평균에 걸쳐 있습니다.

```math
\begin{aligned}
\mathrm{Var}(X) &= \mathbb{E}[(X - \mathbb{E}[X])^2] = \mathbb{E}[X^2] - (\mathbb{E}[X])^2 \\
\text{Standard deviation} &= \sqrt{\mathrm{Var}(X)}
\end{aligned}
```

ML에서 예상 값은 손실 함수 (데이터 분포에 대한 평균 손실) 로 나타난다. 변이는 모델 안정성에 대해 알려줍니다. gradients의 높은 변이는 소음 훈련을 의미합니다.

### 공동 및 소외 분포

공동 분배$P(X, Y)$두 개의 무작위 변수를 함께 설명합니다.

공동 PMF 예제 ($X$= 날씨,$Y$= 낙서

| | $Y=0$ (no umbrella) | $Y=1$ (umbrella) | Marginal $P(X)$ |
|---|---|---|---|
| $X=0$ (sun) | 0.40 | 0.10 | $P(X=0) = 0.50$ |
| $X=1$ (rain) | 0.05 | 0.45 | $P(X=1) = 0.50$ |
| **Marginal $P(Y)$** | $P(Y=0) = 0.45$ | $P(Y=1) = 0.55$ | 1.00 |

가장자리 분포는 다른 변수를 합쳐줍니다.

```math
P(X = x) = \sum_{y} P(X = x, Y = y)
```

위의 표의 줄과 열 총수는 소재자입니다.

### 왜 일반 분포가 어디 에든 나타난다

중앙 제한 정리: 많은 독립적인 무작위 변수의 합 (또는 평균) 은 원래 분포에 관계없이 정상적인 분포로 공감합니다.

```
Roll 1 die:  uniform distribution (flat)
Average of 2 dice:  triangular (peaked)
Average of 30 dice: nearly perfect bell curve

This works for ANY starting distribution.
```

이 이유:
- 측정 오류는 대략 정상적입니다 (많은 작은 독립된 출처)
- 신경망의 무게 초기화는 정상적인 분포를 사용합니다
- SGD의 기하급수 소음은 대략 정상 (많은 샘플 기하급수의 합)
- 정상적인 분포는 주어진 평균과 변이의 최대 엔트로피 분포입니다.

### 로그 확률

원시 확률은 수치적인 문제를 일으킨다. 많은 작은 확률을 곱하면 빠르게 0으로 미끄러집니다.

```math
\begin{aligned}
P(\text{sentence}) &= P(\text{word}_1) \cdot P(\text{word}_2) \cdot \ldots \cdot P(\text{word}_n) \\
&= 0.01 \cdot 0.003 \cdot 0.02 \cdot \ldots \\
&\to 0.0 \quad \text{(underflow after } \sim 30 \text{ terms)}
\end{aligned}
```

로그 확률이 문제를 해결합니다. 곱셈은 덧셈이 됩니다.

```math
\begin{aligned}
\log P(\text{sentence}) &= \log P(\text{word}_1) + \log P(\text{word}_2) + \ldots + \log P(\text{word}_n) \\
&= -4.6 + -5.8 + -3.9 + \ldots \\
&\to \text{finite number (no underflow)}
\end{aligned}
```

규칙:
- $\log(a \cdot b) = \log(a) + \log(b)$
- 로그 확률은 항상$\le 0$(이하$0 < P \le 1$)
- 더 부정적인 = 확률이 낮다
- 크로스 엔트로피 손실은 올바른 클래스의 음 로그 확률입니다

### 확률 분포로 소프트맥스

신경망은 원자 점수를 (logits) 내보내죠. Softmax는 이를 유효한 확률 분포로 변환합니다.

```
softmax(z_i) = exp(z_i) / sum(exp(z_j) for all j)

Properties:
  - All outputs are in (0, 1)
  - All outputs sum to 1
  - Preserves relative ordering of inputs
  - exp() amplifies differences between logits
```

소프트맥스 트릭: 과잉을 방지하기 위해 기하급수적으로 표시하기 전에 최대 로그트를 빼십시오.

```
z = [100, 101, 102]
exp(102) = overflow

z_shifted = z - max(z) = [-2, -1, 0]
exp(0) = 1  (safe)

Same result, no overflow.
```

로그 소프트맥스는 톱맥스와 로그를 결합하여 수치 안정성을 제공합니다. PyTorch는 이것을 내부적으로 크로스 엔트로피 손실에 사용합니다.

### 샘플링

샘플링이란 분포에서 무작위 값을 추출하는 것을 의미합니다.
- 어떤 신경 세포가 무작위로 을 수 있는지
- 데이터 증강 샘플 랜덤 변환
- 언어 모델은 예측된 배포에서 다음 토큰을 샘플링합니다
- 방산 모델은 소음을 샘플링하고 점차적으로 소멸시킵니다

임의의 분포에서 샘플링은 역 변환 샘플링, 거부 샘플링 또는 재정분량 트릭 (VAEs에서 사용되는) 같은 기술을 필요로합니다.

```figure
gaussian-pdf
```

## 건설 해

### 단계 1: 확률 기본

```python
import math
import random

def factorial(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

def combinations(n, k):
    return factorial(n) // (factorial(k) * factorial(n - k))

def conditional_probability(p_a_and_b, p_b):
    return p_a_and_b / p_b

p_king_given_face = conditional_probability(4/52, 12/52)
print(f"P(King | Face card) = {p_king_given_face:.4f}")
```

### 단계 2: 처음부터 PMF 및 PDF

```python
def bernoulli_pmf(k, p):
    return p if k == 1 else (1 - p)

def categorical_pmf(k, probs):
    return probs[k]

def poisson_pmf(k, lam):
    return (lam ** k) * math.exp(-lam) / factorial(k)

def uniform_pdf(x, a, b):
    if a <= x <= b:
        return 1.0 / (b - a)
    return 0.0

def normal_pdf(x, mu, sigma):
    coeff = 1.0 / (sigma * math.sqrt(2 * math.pi))
    exponent = -0.5 * ((x - mu) / sigma) ** 2
    return coeff * math.exp(exponent)
```

### 단계 3: 예상 값과 변동

```python
def expected_value(values, probabilities):
    return sum(v * p for v, p in zip(values, probabilities))

def variance(values, probabilities):
    mu = expected_value(values, probabilities)
    return sum(p * (v - mu) ** 2 for v, p in zip(values, probabilities))

die_values = [1, 2, 3, 4, 5, 6]
die_probs = [1/6] * 6
mu = expected_value(die_values, die_probs)
var = variance(die_values, die_probs)
print(f"Die: E[X] = {mu:.4f}, Var(X) = {var:.4f}, SD = {var**0.5:.4f}")
```

### 단계 4: 분포에서 샘플링

```python
def sample_bernoulli(p, n=1):
    return [1 if random.random() < p else 0 for _ in range(n)]

def sample_categorical(probs, n=1):
    cumulative = []
    total = 0
    for p in probs:
        total += p
        cumulative.append(total)
    samples = []
    for _ in range(n):
        r = random.random()
        for i, c in enumerate(cumulative):
            if r <= c:
                samples.append(i)
                break
    return samples

def sample_normal_box_muller(mu, sigma, n=1):
    samples = []
    for _ in range(n):
        u1 = random.random()
        u2 = random.random()
        z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
        samples.append(mu + sigma * z)
    return samples
```

### 단계 5: 소프트맥스 및 로그 확률

```python
def softmax(logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    exps = [math.exp(z) for z in shifted]
    total = sum(exps)
    return [e / total for e in exps]

def log_softmax(logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    log_sum_exp = max_logit + math.log(sum(math.exp(z) for z in shifted))
    return [z - log_sum_exp for z in logits]

def cross_entropy_loss(logits, target_index):
    log_probs = log_softmax(logits)
    return -log_probs[target_index]
```

### 단계 6: 중앙 한계 정리를 증명

```python
def demonstrate_clt(dist_fn, n_samples, n_averages):
    averages = []
    for _ in range(n_averages):
        samples = [dist_fn() for _ in range(n_samples)]
        averages.append(sum(samples) / len(samples))
    return averages
```

### 7단계: 시각화

```python
import matplotlib.pyplot as plt

xs = [mu + sigma * (i - 500) / 100 for i in range(1001)]
ys = [normal_pdf(x, mu, sigma) for x, mu, sigma in ...]
plt.plot(xs, ys)
```

모든 시각화와 함께 완전한 구현이 `code/probability.py`- 그래

## 사용 하 고

NumPy와 SciPy는 위의 모든 것이 일 라인입니다.

```python
import numpy as np
from scipy import stats

normal = stats.norm(loc=0, scale=1)
samples = normal.rvs(size=10000)
print(f"Mean: {np.mean(samples):.4f}, Std: {np.std(samples):.4f}")
print(f"P(X < 1.96) = {normal.cdf(1.96):.4f}")

logits = np.array([2.0, 1.0, 0.1])
from scipy.special import softmax, log_softmax
probs = softmax(logits)
log_probs = log_softmax(logits)
print(f"Softmax: {probs}")
print(f"Log-softmax: {log_probs}")
```

이 모든 걸 처음부터 만들어냈어 이제 도서관 전화가 뭘 하는지 알잖아

## 운동

1. 기하급수적 분포에 대해 역 변환 샘플링을 구현합니다. 10,000 값의 샘플링을 통해 확인하고 histogram를 실제 PDF와 비교합니다.

2. 두 개의 로드 된 도자 를 위한 공동 분포 테이블 을 만들어, 가장자리 분포 를 계산 하고 도자 는 독립적 인 것 을 확인 하십시오.

3. 로그이트를 출력하는 5급 분류기 위해 크로스 엔트로피 손실을 계산합니다 `[2.0, 0.5, -1.0, 3.0, 0.1]`올바른 클래스가 인덱스 3인 경우 PyTorch의 답변을 확인하세요`nn.CrossEntropyLoss`- 그래

4. 로그 확률의 목록을 가지고 가장 확률 높은 순서, 전체 로그 확률, 그리고 동등한 원본 확률을 반환하는 함수를 작성하십시오. 각 단어의 확률이 0.01인 50 단어 문장을 사용하여 테스트하십시오.

### 암시

**Exercise 1.**추첨`u`일정한 분배와 반환$-\ln(1 - u) / \lambda$샘플 평균이 $1/\lambda$그리고 히스토그램 칸이 따라가게 되죠$\lambda e^{-\lambda x}$- 그래

**Exercise 2.**6x6 테이블을 채우면 모든 세포가 확률이고 모든 세포의 합이 1이 되죠`joint_to_marginals`사용하세요`check_independence`: 두 개의 덩어리는 각각의 세포가 두 개의 소수의 곱하기 값이 같으면만 독립됩니다.

**Exercise 3.**적용`softmax`로그티스까지 가서 가져가라$-\ln$3 지표에서 확률의 0.421에 가까운 결과를 가져야 합니다.`nn.CrossEntropyLoss`같은 로그티와 목표에 대해

**Exercise 4.**로그 확률을 더해봅시다. 원본 확률을 곱하지 마십시오. 확률 0.01의 50 단어에 대해, 총수는$50 \ln(0.01) \approx -230.26$, 그리고 순위 확률은$10^{-100}$- 그래

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Sample space | "All the possibilities" | The set $S$ of every possible outcome of an experiment |
| PMF | "The probability function" | A function that gives the exact probability of each discrete outcome, summing to 1 |
| PDF | "The probability curve" | A density function for continuous variables. Integrate it over an interval to get probability |
| Conditional probability | "Probability given something" | $P(A \mid B) = P(A \text{ and } B) / P(B)$. The foundation of Bayesian thinking and Bayes' theorem |
| Independence | "They don't affect each other" | $P(A \text{ and } B) = P(A) \cdot P(B)$. Knowing one event tells you nothing about the other |
| Expected value | "The average" | The probability-weighted sum of all outcomes. The loss function is an expected value |
| Variance | "How spread out" | The expected squared deviation from the mean. High variance = noisy, unstable estimates |
| Normal distribution | "The bell curve" | $f(x) = (1/\sqrt{2\pi\sigma^2}) \cdot \exp(-(x-\mu)^2/(2\sigma^2))$. Appears everywhere due to the CLT |
| Central Limit Theorem | "Averages become normal" | The mean of many independent samples converges to a normal distribution regardless of the source |
| Joint distribution | "Two variables together" | $P(X, Y)$ describes the probability of every combination of $X$ and $Y$ outcomes |
| Marginal distribution | "Sum out the other variable" | $P(X) = \sum_y P(X, Y)$. Recovers one variable's distribution from the joint |
| Log probability | "Log of the probability" | $\log P(x)$. Turns products into sums, preventing numerical underflow in long sequences |
| Softmax | "Turn scores into probabilities" | $\text{softmax}(z_i) = \exp(z_i) / \sum_j \exp(z_j)$. Maps real-valued logits to a valid probability distribution |
| Cross-entropy | "The loss function" | $-\sum p_{\text{true}} \cdot \log(p_{\text{predicted}})$. Measures how different two distributions are. Lower is better |
| Logits | "Raw model outputs" | Unnormalized scores before softmax. Named after the logistic function |
| Sampling | "Drawing random values" | Generating values according to a probability distribution. How models generate output |

## 더 많은 읽기

- [3Blue1Brown: But what is the Central Limit Theorem?](https://www.youtube.com/watch?v=zeJD6dqJ5lo)- 평균이 왜 정상화되는지 시각적 증거
- [Stanford CS229 Probability Review](https://cs229.stanford.edu/section/cs229-prob.pdf)- 여기 모든 것을 다루는 간결한 참조 및 더 많은
- [The Log-Sum-Exp Trick](https://gregorygundersen.com/blog/2020/02/09/log-sum-exp/)- 숫자 안정성이 왜 중요하고 어떻게 달성할 수 있는지
