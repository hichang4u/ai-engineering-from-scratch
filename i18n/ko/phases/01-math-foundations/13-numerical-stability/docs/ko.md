# 수학적 안정성

> 떠 있는 지점은 유출된 추상입니다. 훈련 중에 물려서,

**Type:** Build
**Language:**파이썬
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~120 minutes

## 학습 목표

- 최대 추수 트릭을 사용하여 수적으로 안정된 소프트맥스와 로그섬-엑스플을 구현
- 유동점 계산에서 과류, 미세류 및 재난 취소를 식별한다
- 중앙집권한 유한 차이를 사용하여 수치적 유한과 분석 기하급수 검증
- 훈련에 있어서 bfloat16가 float16보다 선호되는 이유를 설명하고 손실 확장이 gradient underflow를 방지하는 방법을 설명합니다.

## 문제

3시간 동안 모델이 열차되고 손실이 NaN가 됩니다. 인쇄 문서를 추가합니다. 로그티는 단계 9.000에서 괜찮습니다. 단계 9.001에서는 괜찮습니다.`inf`. 단계 9,002에 따라 각 경각지대가`nan`훈련은 끝났어

또는: 모델이 완성될 때까지 작동하지만 정확도는 종이 주장보다 2% 더 나쁘다. 당신은 모든 것을 확인합니다. 건축이 일치합니다. 하이퍼파라메터가 일치합니다. 데이터도 일치합니다. 문제는 종이 float32를 사용했고 당신은 올바른 스케일링 없이 float16를 사용했습니다. 축적된 32 비트의 라운딩 오류는 조용히 당신의 정확성을 먹었습니다.

또는: 크로스 엔트로피 손실을 처음부터 구현합니다. 그것은 작은 로그티에 작동합니다. 로그티가 100를 초과하면 반환합니다.`inf`이 너무 많았어요`exp(100)`이 방법은 2줄의 트릭으로 처리됩니다.

수학적 안정성은 이론적 문제 아닙니다. 그것은 성공한 훈련과 침묵으로 실패하는 훈련 사이의 차이입니다. 당신이 디버깅 할 모든 심각한 ML 버그가 결국 부동의 점으로 떨어집니다.

## 개념

### IEEE 754: 컴퓨터가 실제 숫자를 저장하는 방법

컴퓨터는 IEEE 754 표준에 따라 부동의 점 값으로 실제 숫자를 저장합니다. 부동는 세 부분: 신호 비트, 기하수, 그리고 mantissa (표시함) 이다.

```
Float32 layout (32 bits total):
[1 sign] [8 exponent] [23 mantissa]

Value = (-1)^sign * 2^(exponent - 127) * 1.mantissa
```

매티사 (Mantissa) 는 정확도를 결정한다 (무엇의 중요한 숫자를 결정한다).

```
Format     Bits   Exponent  Mantissa  Decimal digits  Range (approx)
float64    64     11        52        ~15-16          +/- 1.8e308
float32    32     8         23        ~7-8            +/- 3.4e38
float16    16     5         10        ~3-4            +/- 65,504
bfloat16   16     8         7         ~2-3            +/- 3.4e38
```

float32은 정확도가 약 7개 지수입니다. 즉, 1.0000001와 1.0000002를 구별할 수 있지만, 1.00000001과 1.00000002를 구별할 수 없습니다. 7개 지수를 거친 후 모든 것이 둥글게 소음입니다.

float16는 약 3자리입니다. 가장 큰 숫자는 65,504입니다. 로그이트, 기하급수 및 활성화가 일상적으로 이보다 더 많은 ML에 대해 불안정하게 작습니다.

bfloat16는 Google의 float16의 범위 문제에 대한 해답입니다. 그것은 float32와 같은 8 비트 기하수를 가지고 있습니다 ( 동일한 범위, 3.4e38) 하지만 7 개의 mantissa 비트 (float16보다 정확도가 낮습니다).

### 왜 0.1 + 0.2 != 0.3

0.1은 바이너리 부동소수점에서 정확하게 표현할 수 없습니다.

```
0.1 in binary = 0.0001100110011001100110011... (repeating forever)
```

플로트32는 이것을 23 비트의 매티사로 줄입니다. 저장된 값은 약 0.100000001490116. 마찬가지로 0.2는 약 0.200000002980232로 저장됩니다. 그들의 합은 0.300000004470348입니다. 0.3이 아닙니다.

```
In Python:
>>> 0.1 + 0.2
0.30000000000000004

>>> 0.1 + 0.2 == 0.3
False
```

ML에 있어서 이것은 중요하기 때문입니다.

1. 손실 비교`if loss < threshold`잘못된 답변을 줄 수 있습니다
2. 많은 작은 값들을 축적 (천여 단계에 걸쳐 순차적으로 업데이트) 하는 것은 실제 금액에서 유도된다
3. 수와 재생가능성 테스트는 수와 비교하면 실패합니다`==`

해법: 플롯을 비교하지 말아요`==`사용하세요`abs(a - b) < epsilon`또는`math.isclose()`- 그래

### 재앙적 인 취소

거의 같은 부동소수점 숫자를 빼면 중요한 숫자가 취소되고, 우위를 점하는 소음이 있습니다.

```
a = 1.0000001    (stored as 1.00000011920929 in float32)
b = 1.0000000    (stored as 1.00000000000000 in float32)

True difference:  0.0000001
Computed:         0.00000011920929

Relative error: 19.2%
```

이것은 하나의 추수에서 19%의 상대적 오류입니다. ML에서, 이것은 당신이

- 큰 평균의 데이터의 변수를 계산합니다: $\mathbb{E}[x^2] - \mathbb{E}[x]^2$언제$\mathbb{E}[x]$크다
- 거의 동일한 로그 확률을 빼
- 너무 작은 에프실론으로 유한차각 기하급수들을 계산한다

수정: 큰 거의 동일한 숫자를 빼는 것을 피하기 위해 공식을 재편하십시오. 변형을 위해 먼저 웨일포드 알고리즘을 사용하거나 데이터를 중심으로하십시오. 로그 확률을 위해 전체 로그 공간에서 작업하십시오.

### 과잉 흐름과 하중 흐름

과잉 흐름은 결과물이 너무 큰 경우 발생하고, 과잉 흐름은 너무 작 때 발생한다 (최소 표현 가능한 긍정적 숫자에 비해 0에 가깝다).

```
Float32 boundaries:
  Maximum:  3.4028235e+38
  Minimum positive (normal): 1.175e-38
  Minimum positive (denorm): 1.401e-45
  Overflow:  anything > 3.4e38 becomes inf
  Underflow: anything < 1.4e-45 becomes 0.0
```

`exp()`함수는 ML에서 가장 큰 overflow 원천입니다.

```
exp(88.7)  = 3.40e+38   (barely fits in float32)
exp(89.0)  = inf         (overflow)
exp(-87.3) = 1.18e-38   (barely above underflow)
exp(-104)  = 0.0         (underflow to zero)
```

`log()`함수는 다른 방향으로 움직입니다.

```
log(0.0)   = -inf
log(-1.0)  = nan
log(1e-45) = -103.3      (fine)
log(1e-46) = -inf        (input underflowed to 0, then log(0) = -inf)
```

ML에서`exp()`softmax, sigmoid, 그리고 확률 계산에서 나타납니다. `log()` () 은  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의  () 의 `log(exp(x))`제대로 된 트릭이 없는 미인장입니다.

### 로그섬-엑스프 트릭

컴퓨터`log(sum(exp(x_i)))`직접적으로 발생하면 수치적으로 위험합니다.`x_i`큰 것 같네요`exp(x_i)`모든 물들이 넘어서면`x_i`매우 부정적인, 모든 `exp(x_i)`0으로 하락하는`log(0)` `-inf`- 그래

트릭은: 기하급수화하기 전에 최대 값을 빼면 됩니다.

```math
\log\left(\sum_i \exp(x_i)\right) = \max(x) + \log\left(\sum_i \exp(x_i - \max(x))\right)
```

왜 이렇게 작동하는지: 빼기 후에`max(x)`, 가장 큰 지표는`exp(0) = 1`. 과잉이 불가능합니다. 최소 1개의 용어는 1이고, 따라서 합은 최소 1이고`log(1) = 0`- 하위로 흐르지 않습니다`-inf`가능하죠.

증거:

```math
\begin{aligned}
& \log\left(\sum_i \exp(x_i)\right) \\
&= \log\left(\sum_i \exp(x_i - c + c)\right) && \text{(add and subtract } c\text{)} \\
&= \log\left(\sum_i \exp(x_i - c) \cdot \exp(c)\right) && (\exp(a+b) = \exp(a) \cdot \exp(b)) \\
&= \log\left(\exp(c) \cdot \sum_i \exp(x_i - c)\right) && \text{(factor out } \exp(c)\text{)} \\
&= c + \log\left(\sum_i \exp(x_i - c)\right) && (\log(a \cdot b) = \log(a) + \log(b))
\end{aligned}
```

세트 `c = max(x)`그리고 과잉이 없어집니다.

이 트릭은 ML에서 모든 곳에 나타납니다.
- 소프트맥스 정상화
- 크로스 엔트로피 손실 계산
- 로그 확률 합성
- 가우스족의 혼합물
- 변동 추론

### 왜 소프트맥스가 맥스 추출 트릭을 필요로 하는 지

소프트맥스는 로그티를 확률로 변환합니다.

```math
\mathop{\mathrm{softmax}}(x_i) = \frac{\exp(x_i)}{\sum_j \exp(x_j)}
```

이 트릭이 없으면 [100, 101, 102]의 로그이트가 지나치게 흐르는데

```
exp(100) = 2.69e43
exp(101) = 7.31e43
exp(102) = 1.99e44
sum      = 2.99e44

These overflow float32 (max ~3.4e38)? No, 2.69e43 < 3.4e38? Actually:
exp(88.7) is already at the float32 limit.
exp(100) = inf in float32.
```

이 트릭으로, 최대 x = 102를 빼면 됩니다.

```
exp(100 - 102) = exp(-2) = 0.135
exp(101 - 102) = exp(-1) = 0.368
exp(102 - 102) = exp(0)  = 1.000
sum = 1.503

softmax = [0.090, 0.245, 0.665]
```

확률은 동일합니다. 계산은 안전합니다. 이것은 최적화가 아닙니다. 정확성의 요구 사항입니다.

### NaN 및 Inf: 검출 및 예방

`nan`(수수 아닌) 그리고`inf`컴퓨터로 바이러스 감염을 퍼뜨리는 것입니다.`nan`gradient 업데이트에서 무게를 만듭니다`nan`, 즉, 모든 다음 출력을 만들어 냅니다.`nan`훈련은 한 발자국 안에 끝납니다.

어떻게`inf`나타납니다:
- `exp()`큰 양성 숫자의
- 0으로 나눌 때:`1.0 / 0.0`
- `float32`축적의 과잉

어떻게`nan`나타납니다:
- `0.0 / 0.0`
- `inf - inf`
- `inf * 0`
- `sqrt()`음수
- `log()`음수
- 기존의 수학적`nan`

탐지:

```python
import math

math.isnan(x)       # True if x is nan
math.isinf(x)       # True if x is +inf or -inf
math.isfinite(x)    # True if x is neither nan nor inf
```

예방 전략:

1.    클램프 입력`exp()`이 책:`exp(clamp(x, -80, 80))`
2. 나명자 에프실론을 추가: `x / (y + 1e-8)`
3. 에프실론을 넣으세요`log()`이 책:`log(x + 1e-8)`
4. 안정적인 구현을 사용 (log-sum-exp, stable softmax)
5. 무게 폭발을 방지하기 위해 속 절단
6. 확인해`nan`- 그래`inf`디버깅 중 모든 앞으로 통과 후

### 수학적 계층 검증

분석 기하급수 (backpropagation) 는 버그를 가질 수 있다. 수치 기하급수 검사는 제한된 차이점을 가진 기하급수 계산을 통해 이를 확인한다.

중앙화된 차이 수식은

```math
\frac{df}{dx} \approx \frac{f(x + h) - f(x - h)}{2h}
```

이쪽은$O(h^2)$정확하고, 앞으로의 차이보다 훨씬 더 낫습니다$(f(x+h) - f(x)) / h$그 중 하나는$O(h)$- 그래

선택$h$너무 작고 재앙적인 취소로 인해 그 답이 파괴됩니다.`h = 1e-5` `1e-7`전형적인 것 같습니다.

검사: 분석 및 수치적 기하급수 사이의 상대적인 차이를 계산한다.

```math
\text{relative\_error} = \frac{\lvert \text{grad}_{\text{analytical}} - \text{grad}_{\text{numerical}} \rvert}{\max(\lvert \text{grad}_{\text{analytical}} \rvert, \lvert \text{grad}_{\text{numerical}} \rvert, 10^{-8})}
```

엄지 손가락 규칙:
- relative_error < 1e-7: 완벽, 기하급수가 맞습니다
- relative_error < 1e-5: 허용가능, 아마도 정확
- relative_error > 1e-3: 뭔가 잘못됐습니다
- relative_error > 1: 기하급수가 완전히 틀렸습니다

새로운 계층 또는 손실 함수를 구현할 때 항상 기하급수 확인합니다. PyTorch는 `torch.autograd.gradcheck()`이 때문에

### 혼합 된 정확성 훈련

현대 GPU는 float16 매트릭스 곱셈을 float32보다 2-8배 더 빠르게 계산하는 전문 하드웨어 (텐서 코어) 를 가지고 있습니다. 혼합 정밀 훈련은 이것을 활용합니다.

```
1. Maintain float32 master copy of weights
2. Forward pass in float16 (fast)
3. Compute loss in float32 (prevents overflow)
4. Backward pass in float16 (fast)
5. Scale gradients to float32
6. Update float32 master weights
```

순수 플롯16 훈련의 문제는: 그라디언트는 종종 매우 작습니다 (1e-8 또는 더 작습니다). 플롯16는 ~ 6e-8에서 0까지 모든 것을 하하로 흐릅니다. 모든 그라디언트 업데이트가 0이기 때문에 모델은 학습을 중단합니다.

해결 방법은 손실 확장입니다.

```
1. Multiply loss by a large scale factor (e.g., 1024)
2. Backward pass computes gradients of (loss * 1024)
3. All gradients are 1024x larger (pushed above float16 underflow)
4. Divide gradients by 1024 before updating weights
5. Net effect: same update, but no underflow
```

동적 손실 스케일링은 자동으로 스케일 요소를 조정합니다. 큰 값 (65536) 로 시작하십시오. gradients가 을 넘으면`inf`반으로 줄여주면$N$발걸음도 지나지 않고, 두 배로 넘어가고

### bfloat16 vs. float16: 왜 bfloat16 훈련에 승리하는 지

```
float16:   [1 sign] [5 exponent]  [10 mantissa]
bfloat16:  [1 sign] [8 exponent]  [7 mantissa]
```

float16는 더 정확하지만, 범위가 제한되어 있습니다 (최고 ~65,504). bfloat16는 정확도가 낮지만, 범위가 float32와 동일합니다 (최고 ~3.4e38).

신경망 훈련에 관한 사항:

- 운동 톱니 때 활성화 및 로그티는 정기적으로 65,504개를 초과한다.
- 손실 확장은 float16에서 요구되지만, 그 범위가 gradient magnitude 스펙트럼을 커버하기 때문에 bfloat16에서는 일반적으로 불필요합니다.
- bfloat16는 float32의 간단한 단축입니다. 맨티사의 16 비트 아래쪽을 떨어뜨립니다. 변환은 비약적이며 기하급수에서 손실이 없습니다.

이 경우, 이 시스템은 Bfloat16를 사용하며, 이 시스템은 Bfloat16의 기본 기능을 사용한다.

### 점진적 절단

폭발적인 기하급수성은 기하급수적으로 여러 층을 통해 증가할 때 발생합니다 (RNN, 깊은 네트워크 및 변환기에서 흔히 볼 수 있습니다). 하나의 큰 기하급수로는 한 단계에 모든 무게를 손상시킬 수 있습니다.

두 가지 유형의 절단:

**Clip by value:**각 기하급수 요소를 독립적으로 꽉 습니다.

```
grad = clamp(grad, -max_val, max_val)
```

간단하지만 gradient vector의 방향을 바꿀 수 있습니다.

**Clip by norm:**그레이디언 벡터 전체를 확장하여 그 기준이 한 문턱을 초과하지 않도록 한다.

```
if ||grad|| > max_norm:
    grad = grad * (max_norm / ||grad||)
```

그레이덴트의 방향을 유지합니다.`torch.nn.utils.clip_grad_norm_()`하지만, 그건 표준 선택입니다.

전형적인 값: `max_norm=1.0`트랜스포머에`max_norm=0.5`RL에 대해`max_norm=5.0`더 간단한 네트워크에

그라디언트 절단 은 해킹 이 아니라 안전 장치 입니다. 그 없이 한 번 이질적 인 배트 가 수습 을 망칠 만큼 큰 그라디언트를 만들어 낼 수 있습니다.

### 정상화 계층은 수치 안정제로서

배트 정상화, 계층 정상화, RMS 정상화 등은 일반적으로 훈련의 컨버전지를 돕는 규제제로 제시된다.

정상화 없이는 활성화는 계층을 통해 기하급수적으로 증가하거나 줄일 수 있습니다.

```
Layer 1: values in [0, 1]
Layer 5: values in [0, 100]
Layer 10: values in [0, 10,000]
Layer 50: values in [0, inf]
```

모든 계층에서 정상화 갱신 및 재 확장 활성화를:

```math
\mathop{\mathrm{LayerNorm}}(x) = \frac{x - \mathop{\mathrm{mean}}(x)}{\mathop{\mathrm{std}}(x) + \epsilon} \cdot \gamma + \beta
```

`epsilon`(일반적으로 1e-5) 는 모든 활성화가 동일할 때 0으로 나뉘는 것을 방지합니다.`gamma`그리고`beta`네트워크가 필요한 규모를 복구하도록

이것은 네트워크 전체에서 수치적으로 안전한 범위에서 값을 유지하며, 앞으로의 통과에서 과잉과 뒤로의 통과에서 기하급수 폭발을 막습니다.

### 일반적인 ML 수학적 버그

**Bug: Loss is NaN after a few epochs.**
원인: 로지트가 너무 커지고, 소프트맥스가 너무 많이 흐르고, 학습률이 너무 높고, 무게가 분할되어 있습니다.
수정: 안정적인 소프트맥스를 사용 (최고 추출), 학습 속도를 줄이고, gradient clipping를 추가합니다.

**Bug: Loss is stuck at log(num_classes).**
원인: 모델 출력들은 거의 균일한 확률입니다. 종종 그라디언트가 사라지고 있거나 모델이 전혀 학습하지 않는다는 것을 의미합니다.
수정: 데이터 레이블이 올바른지 확인, 손실 함수를 확인, 죽은 RELU를 확인.

**Bug: Validation accuracy is lower than expected by 1-3%.**
원인: 적당한 손실 확장 없이 혼합된 정확성. 기하급수적 하류는 소규모 업데이트를 조용히 무산합니다.
수정: 동적 손실 확장 기능을 활성화하거나 bfloat16로 전환하십시오.

**Bug: Gradient norms are 0.0 for some layers.**
원인: 죽은 ReLU 신경 세포 (모든 입력값은 부정적) 또는 float16 하류
수정: LeakyReLU 또는 GELU를 사용, gradient 스칼링을 사용, 무게 초기화를 확인.

**Bug: Model works on one GPU but gives different results on another.**
원인: 비결정적인 부동소수점 축적 순서. GPU 병렬 감소는 다른 하드웨어에서 다른 순서로 합되며 부동소수점 덧셈은 연관적이지 않습니다.
수정: 작은 차이를 받아들여 (1e-6), 또는 집계 `torch.use_deterministic_algorithms(True)`그리고 속속 벌금을 받아보세요.

**Bug: `exp()` returns `inf` in loss computation.**
원인: 원료 로그티가 `exp()`최대 추수 트릭이 없죠.
수정: 사용`torch.nn.functional.log_softmax()`내부적으로 로그섬 엑스플을 구현하는

**Bug: Training diverges after switching from float32 to float16.**
원인: float16는 6e-8 이하의 기하급수적 규모 또는 65,504 이상의 활성화를 나타낼 수 없습니다.
수정: 손실 스케일링 (AMP) 과 혼합된 정확도를 사용하거나 대신 bfloat16을 사용하십시오.

```figure
logsumexp-stability
```

## 건설 해

### 단계 1: 부동소수점 정밀도 제한을 증명한다

```python
print("=== Floating Point Precision ===")
print(f"0.1 + 0.2 = {0.1 + 0.2}")
print(f"0.1 + 0.2 == 0.3? {0.1 + 0.2 == 0.3}")
print(f"Difference: {(0.1 + 0.2) - 0.3:.2e}")
```

### 단계 2: 순수 vs 안정적인 소프트맥스를 구현

```python
import math

def softmax_naive(logits):
    exps = [math.exp(z) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

def softmax_stable(logits):
    max_logit = max(logits)
    exps = [math.exp(z - max_logit) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

safe_logits = [2.0, 1.0, 0.1]
print(f"Naive:  {softmax_naive(safe_logits)}")
print(f"Stable: {softmax_stable(safe_logits)}")

dangerous_logits = [100.0, 101.0, 102.0]
print(f"Stable: {softmax_stable(dangerous_logits)}")
# softmax_naive(dangerous_logits) would return [nan, nan, nan]
```

### 단계 3: 안정적인 로그섬-엑스프를 구현

```python
def logsumexp_naive(values):
    return math.log(sum(math.exp(v) for v in values))

def logsumexp_stable(values):
    c = max(values)
    return c + math.log(sum(math.exp(v - c) for v in values))

safe = [1.0, 2.0, 3.0]
print(f"Naive:  {logsumexp_naive(safe):.6f}")
print(f"Stable: {logsumexp_stable(safe):.6f}")

large = [500.0, 501.0, 502.0]
print(f"Stable: {logsumexp_stable(large):.6f}")
# logsumexp_naive(large) returns inf
```

### 단계 4: 안정적인 크로스 엔트로피를 구현

```python
def cross_entropy_naive(true_class, logits):
    probs = softmax_naive(logits)
    return -math.log(probs[true_class])

def cross_entropy_stable(true_class, logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    log_sum_exp = math.log(sum(math.exp(s) for s in shifted))
    log_prob = shifted[true_class] - log_sum_exp
    return -log_prob

logits = [2.0, 5.0, 1.0]
true_class = 1
print(f"Naive:  {cross_entropy_naive(true_class, logits):.6f}")
print(f"Stable: {cross_entropy_stable(true_class, logits):.6f}")
```

### 단계 5: 단계적 검진

```python
def numerical_gradient(f, x, h=1e-5):
    grad = []
    for i in range(len(x)):
        x_plus = x[:]
        x_minus = x[:]
        x_plus[i] += h
        x_minus[i] -= h
        grad.append((f(x_plus) - f(x_minus)) / (2 * h))
    return grad

def check_gradient(analytical, numerical, tolerance=1e-5):
    for i, (a, n) in enumerate(zip(analytical, numerical)):
        denom = max(abs(a), abs(n), 1e-8)
        rel_error = abs(a - n) / denom
        status = "OK" if rel_error < tolerance else "FAIL"
        print(f"  param {i}: analytical={a:.8f} numerical={n:.8f} "
              f"rel_error={rel_error:.2e} [{status}]")

def f(params):
    x, y = params
    return x**2 + 3*x*y + y**3

def f_grad(params):
    x, y = params
    return [2*x + 3*y, 3*x + 3*y**2]

point = [2.0, 1.0]
analytical = f_grad(point)
numerical = numerical_gradient(f, point)
check_gradient(analytical, numerical)
```

## 사용 하 고

### 혼합 정밀 시뮬레이션

```python
import struct

def float32_to_float16_round(x):
    packed = struct.pack('f', x)
    f32 = struct.unpack('f', packed)[0]
    packed16 = struct.pack('e', f32)
    return struct.unpack('e', packed16)[0]

def simulate_bfloat16(x):
    packed = struct.pack('f', x)
    as_int = int.from_bytes(packed, 'little')
    truncated = as_int & 0xFFFF0000
    repacked = truncated.to_bytes(4, 'little')
    return struct.unpack('f', repacked)[0]
```

### 속 절단

```python
def clip_by_norm(gradients, max_norm):
    total_norm = math.sqrt(sum(g**2 for g in gradients))
    if total_norm > max_norm:
        scale = max_norm / total_norm
        return [g * scale for g in gradients]
    return gradients

grads = [10.0, 20.0, 30.0]
clipped = clip_by_norm(grads, max_norm=5.0)
print(f"Original norm: {math.sqrt(sum(g**2 for g in grads)):.2f}")
print(f"Clipped norm:  {math.sqrt(sum(g**2 for g in clipped)):.2f}")
print(f"Direction preserved: {[c/clipped[0] for c in clipped]} == {[g/grads[0] for g in grads]}")
```

### NaN/Inf 검출

```python
def check_tensor(name, values):
    has_nan = any(math.isnan(v) for v in values)
    has_inf = any(math.isinf(v) for v in values)
    if has_nan or has_inf:
        print(f"WARNING {name}: nan={has_nan} inf={has_inf}")
        return False
    return True

check_tensor("good", [1.0, 2.0, 3.0])
check_tensor("bad",  [1.0, float('nan'), 3.0])
check_tensor("ugly", [1.0, float('inf'), 3.0])
```

보시다시피`code/numerical.py`모든 가장자리 사례가 입증된 완전한 구현을 위해.

## 선박

이 교훈은 다음과 같은 결과를 낳습니다.
- `code/numerical.py`안정적인 소프트맥스, 로그섬-엑스프, 크로스 엔트로피, 그라디언트 검사 및 혼합 정밀 시뮬레이션
- `outputs/prompt-numerical-debugger.md`교육에서 NaN/Inf 진단 및 수치 문제

이러한 안정적인 구현은 훈련 루프 구축을 위한 3단계와 주의 메커니즘을 구현하는 4단계에서 다시 나타난다.

## 운동

1. **Catastrophic cancellation.**순수 공식을 사용하여 [1000000.0, 1000001.0, 1000002.0]의 변수를 계산합니다 $\mathbb{E}[x^2] - \mathbb{E}[x]^2$다음으로 웨일포드 온라인 알고리즘을 사용하여 계산합니다. 오류를 실제 변동 (0.6667) 과 비교하십시오.

2. **Precision hunt.**가장 작은 긍정적 float32 값을 찾아보세요 `x`그런 것`1.0 + x == 1.0`파이썬에서 이 기계는 에프실론입니다.`numpy.finfo(numpy.float32).eps`- 그래

3. **Log-sum-exp edge cases.**테스트를 해봐`logsumexp_stable`함수는: (a) 모든 값이 같고, (b) 한 값이 나머지 값보다 훨씬 더 크고, (c) 모든 값이 매우 부정적 (-1000) 이다.

4. **Gradient checking a neural network layer.**단일 선형층을 구현합니다`y = Wx + b`그리고 분석적 역전승을 합니다.`numerical_gradient`3x2중량 매트릭스의 정확성을 확인하기 위해서

5. **Loss scaling experiment.**플롯16를 사용하여 훈련 시뮬레이션: [1e-9, 1e-3] 범위에서 무작위 기하급수성을 생성하고 플롯16로 변환하고 어떤 분자가 0이되는지를 측정합니다. 그 다음 손실 스칼링을 적용하고 (1024로 곱하면) 플롯16로 변환하고 다시 0 분자를 측정합니다.

### 암시

**Exercise 1.**3개의 값을 변환하여`np.float32`당신이 그들을 평평하게 하기 전에, 전화`variance_naive`그리고`welford_variance`.$10^{12}$float32에서는 1보다 훨씬 큰 거리가 있습니다. 그래서 순진한 결과가 0.6667에서 멀리 떨어져 있고 웨일포드 결과는 가까이 있을 것으로 예상합니다.

**Exercise 2.**시작해`x = np.float32(1.0)`그리고 반으로 줄여서`np.float32(1.0) + x != np.float32(1.0)`. 모든 값을 float32에 저장하고, 그 다음의 값과 비교해 보세요`numpy.finfo(numpy.float32).eps`, 즉$2^{-23}$- 그래

**Exercise 3.**먼저 모든 답을 예측해 보세요$n$동등한 가치$c$, 결과는$c + \ln n$- 1 대 값의 경우 그 값에 가까운 결과입니다. - 1000 가까이의 값에서는 그 값에 가까운 결과입니다.$-1000 + \ln n$,`logsumexp_naive`수익금`-inf`왜냐하면 각 기하급수적 흐름이 0으로 하락하기 때문입니다.

**Exercise 4.**$y = Wx + b$손실로$L$, 의 기하급수$W$은 상류 기하급수의 외부 산물이고$x$. 손실을 납작한 함수로 포장$W$, 전화`numerical_gradient`, 그리고 두 결과를 모두 `check_gradient`- 그래

**Exercise 5.**로그 스케일에서 규모를 샘플링합니다`10 ** np.random.uniform(-9, -3, n)`그리고 `np.float16`. Float16는 약  이하의 값을 유지할 수 없습니다.$6 \times 10^{-8}$, 그래서 4분의 1의 값이 0으로 곱하기 전에 0이 될 것으로 예상하고, 1024으로 곱하면 거의 0이 될 것으로 예상합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| IEEE 754 | "The float standard" | International standard defining binary floating point formats, rounding rules, and special values (inf, nan). Every modern CPU and GPU implements it. |
| Machine epsilon | "The precision limit" | The smallest value $e$ such that $1.0 + e \ne 1.0$ in a given float format. For float32, it is about 1.19e-7. |
| Catastrophic cancellation | "Precision loss from subtraction" | When subtracting nearly equal floating point numbers, significant digits cancel and rounding noise dominates the result. |
| Overflow | "Number too big" | A result exceeds the maximum representable value and becomes inf. exp(89) overflows float32. |
| Underflow | "Number too small" | A result is closer to zero than the smallest representable positive number and becomes 0.0. exp(-104) underflows float32. |
| Log-sum-exp trick | "Subtract the max first" | Computing $\log(\sum \exp(x))$ by factoring out $\exp(\max(x))$ to prevent overflow and underflow. Used in softmax, cross-entropy, and log-probability math. |
| Stable softmax | "Softmax that does not explode" | Subtracting $\max(\text{logits})$ before exponentiating. Numerically identical result, no overflow possible. |
| Gradient checking | "Verify your backprop" | Comparing analytical gradients from backpropagation against numerical gradients from finite differences to catch implementation bugs. |
| Mixed precision | "Float16 forward, float32 backward" | Using lower-precision floats for speed-critical operations and higher-precision floats for numerically sensitive operations. Typical speedup is 2-3x. |
| Loss scaling | "Prevent gradient underflow" | Multiplying the loss by a large constant before backprop so gradients stay in float16's representable range, then dividing by the same constant before weight updates. |
| bfloat16 | "Brain floating point" | Google's 16-bit format with 8 exponent bits (same range as float32) and 7 mantissa bits (less precision than float16). Preferred for training. |
| Gradient clipping | "Cap the gradient norm" | Scaling the gradient vector so its norm does not exceed a threshold. Prevents exploding gradients from ruining weights. |
| NaN | "Not a Number" | Special float value from undefined operations (0/0, inf-inf, sqrt(-1)). Propagates through all subsequent arithmetic. |
| Inf | "Infinity" | Special float value from overflow or division by zero. Can combine to produce NaN (inf - inf, inf * 0). |
| Numerical gradient | "Brute force derivative" | Approximating a derivative by evaluating $f(x+h)$ and $f(x-h)$ and dividing by $2h$. Slow but reliable for verification. |

## 더 많은 읽기

- [What Every Computer Scientist Should Know About Floating-Point Arithmetic (Goldberg 1991)](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)-- 최종적인 참조, 밀집하지만 완전
- [Mixed Precision Training (Micikevicius et al., 2018)](https://arxiv.org/abs/1710.03740)-- NVIDIA의 논문으로, 플롯16 훈련에 대한 손실 확장법을 도입했습니다.
- [AMP: Automatic Mixed Precision (PyTorch docs)](https://pytorch.org/docs/stable/amp.html)-- PyTorch에서 혼합 정밀성을 위한 실용적인 가이드
- [bfloat16 format (Google Cloud TPU docs)](https://cloud.google.com/tpu/docs/bfloat16)-- 왜 구글이 TPU를 위해 이 형식을 선택했는가
- [Kahan Summation (Wikipedia)](https://en.wikipedia.org/wiki/Kahan_summation_algorithm)-- 부동의 포인트 수수의 라운드 오류를 줄이는 알고리즘
