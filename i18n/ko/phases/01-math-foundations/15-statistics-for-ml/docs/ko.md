# 기계 학습 통계

> 통계학은 모델이 실제로 작동하는지 아니면 운이 좋는지 알 수 있는 방법입니다.

**Type:** Build
**Language:**파이썬
**Prerequisites:** Phase 1, Lessons 06 (Probability and Distributions), 07 (Bayes' Theorem)
**Time:** ~120 minutes

## 학습 목표

- 설명적인 통계, 피어슨/스피어먼 상관관계, 그리고 코바리안스 매트릭스를 처음부터 계산한다
- 가설 테스트 (t 테스트, chi 제곱) 를 수행하고 p 값과 신뢰 간격을 올바르게 해석합니다.
- 분포 가설 없이 모든 매트릭에 대한 신뢰 간격을 구성하기 위해 부트스트랩 재 샘플링을 사용
- 효과 크기의 측정을 사용하여 통계적 의미와 실제적 의미의 차이를 구별한다

## 문제

두 모델을 훈련시켰습니다. 모델 A는 테스트 세트에서 0.87 점수를 얻었고, 모델 B는 0.89 점수를 얻었습니다.

모델 B는 실제로 모델 A보다 더 좋은 성능을 보여주지 않았습니다. 0.02의 차이점은 잡음이었습니다. 테스트 세트는 너무 작거나 변수가 너무 높거나 둘 다였습니다.

이런 일이 끊임없이 일어나고 있습니다. 랭킹 표를 니다. 재현하지 못하는 논문들. 몇 백개의 샘플에 근거하여 수상자를 선언하는 A/B 테스트. 근본적인 원인은 항상 동일합니다. 누군가가 통계를 건너뛰었습니다.

통계학은 신호와 소음을 구별할 수 있는 도구를 제공합니다. 그것은 언제 차이가 실제적인지, 얼마나 자신감을 가질 수 있는지, 그리고 결과를 믿을 수 있을 때 얼마나 많은 데이터가 필요하는지 알려줍니다. 모든 ML 파이프라인, 모든 모델 비교, 모든 실험은 통계가 필요합니다. 그것 없이는, 당신은 추측합니다.

## 개념

### 설명적 인 통계: 데이터 를 요약 하는 것

어떤 것을 모델링하기 전에, 당신은 당신의 데이터가 어떻게 보이는지 알아야 합니다. 설명적인 통계는 데이터 세트를 몇 개의 숫자로 압축하여 그 모양을 파악합니다.

**Measures of central tendency**"중쪽은 어디?"

```
Mean:   sum of all values / count
        mu = (1/n) * sum(x_i)

Median: middle value when sorted
        Robust to outliers. If you have [1, 2, 3, 4, 1000], the mean is 202
        but the median is 3.

Mode:   most frequent value
        Useful for categorical data. For continuous data, rarely informative.
```

평균은 균형점이고 중반은 반차점입니다. 이 둘이 분할될 때 분포는 왜곡됩니다. 소득 분포는$\text{mean} \gg \text{median}$(비리언어들의 오른쪽 편향) 훈련 중에 손실 분배는 종종$\text{mean} \ll \text{median}$(단순한 샘플에서 왼쪽 편향)

**Measures of spread**"데이터가 얼마나 분산되어 있는가?"

```
Variance:   average squared deviation from the mean
            sigma^2 = (1/n) * sum((x_i - mu)^2)

Standard deviation:  square root of variance
                     sigma = sqrt(sigma^2)
                     Same units as the data, so more interpretable.

Range:      max - min
            Sensitive to outliers. Almost never useful alone.

IQR:        Q3 - Q1 (interquartile range)
            The range of the middle 50% of the data.
            Robust to outliers. Used for box plots and outlier detection.
```

**Percentiles**분류된 데이터를 100개의 동등한 부분으로 나눌 수 있습니다. 25번째 퍼센틸 (Q1) 은 25%의 값이 이 점보다 낮아지는 것을 의미합니다. 50번째 퍼센틸은 중반입니다. 75번째 퍼센틸은 Q3.

```
For latency monitoring:
  P50 = median latency        (typical user experience)
  P95 = 95th percentile       (bad but not worst case)
  P99 = 99th percentile       (tail latency, often 10x the median)
```

ML에서는 추론 지연, 예측 신뢰 분포, 오류 분포를 이해하는 데의 percentiles에 대해 신경쓰습니다. 평균 오류가 낮은 모델이지만 끔찍한 P99 오류가 안전에 중요한 응용 프로그램에 쓸모가 없을 수 있습니다.

**Sample vs population statistics.**샘플에서 계산한 변수를 나누면 $(n-1)$대신$n$이것은 베셀의 수정입니다. 그것은 샘플 평균이 실제 인구 평균이 아니라는 사실을 보상합니다.$n$분자에서, 당신은 체계적으로 진정한 변수를 과소평가합니다.$(n-1)$, 추산은 편향적이지 않습니다.

```math
\begin{aligned}
\text{Population variance:} \quad \sigma^2 &= \frac{1}{N} \sum (x_i - \mu)^2 \\
\text{Sample variance:} \quad s^2 &= \frac{1}{n-1} \sum (x_i - \bar{x})^2
\end{aligned}
```

실제:$n$이 경우, 이 표본은$n$작은 (다섯 개의 샘플) 이 중요하지만

### 상관관계: 변수들이 어떻게 함께 움직인다는 것

상관관계는 두 변수 사이의 선형 관계의 강도와 방향을 측정합니다.

**Pearson correlation coefficient**선형 연관성 조치는

```
r = sum((x_i - x_bar)(y_i - y_bar)) / (n * s_x * s_y)

r = +1:  perfect positive linear relationship
r = -1:  perfect negative linear relationship
r =  0:  no linear relationship (but there might be a nonlinear one!)

Range: [-1, 1]
```

피어슨은 이 관계가 선형적이라고 가정하고 두 변수는 대략 정상적으로 분포되어 있다.$r$0.1에서 0.9까지

**Spearman rank correlation**단조적인 연관성을 측정합니다.

```
1. Replace each value with its rank (1, 2, 3, ...)
2. Compute Pearson correlation on the ranks

Spearman catches any monotonic relationship, not just linear.
If y = x^3, Pearson gives r < 1 but Spearman gives rho = 1.
```

**When to use each:**

```
Pearson:    Both variables are continuous and roughly normal.
            You care about the linear relationship specifically.
            No extreme outliers.

Spearman:   Ordinal data (rankings, ratings).
            Data is not normally distributed.
            You suspect a monotonic but not linear relationship.
            Outliers are present.
```

**The golden rule:**상관관계는 인과관계를 의미하지 않습니다. 아이스크림 판매와 익사 사망률은 여름에 증가하기 때문에 상관관계를 맺습니다. 모델의 정확성과 매개 변수 수는 상관관계를 맺지만 매개 변수를 추가하면 정확도가 자동으로 향상되지 않습니다.

### 코버리안스 매트릭스

두 변수 사이의 합동성 은 그들이 어떻게 서로 다른지를 측정한다:

```
Cov(X, Y) = (1/n) * sum((x_i - x_bar)(y_i - y_bar))

Cov(X, Y) > 0:  X and Y tend to increase together
Cov(X, Y) < 0:  when X increases, Y tends to decrease
Cov(X, Y) = 0:  no linear co-movement
```

$d$특징, 코버라이언스 매트릭스 $C$$d \times d$매트릭스$C[i][j] = \mathop{\mathrm{Cov}}(\text{feature}_i, \text{feature}_j)$. 디아곤럴 입구$C[i][i]$각 특징의 차이는

```
C = | Var(x1)      Cov(x1,x2)  Cov(x1,x3) |
    | Cov(x2,x1)  Var(x2)      Cov(x2,x3) |
    | Cov(x3,x1)  Cov(x3,x2)  Var(x3)     |

Properties:
  - Symmetric: C[i][j] = C[j][i]
  - Positive semi-definite: all eigenvalues >= 0
  - Diagonal = variances
  - Off-diagonal = covariances
```

**Connection to PCA.**PCA 자체는 코버리안스 매트릭스를 구성한다. 독자벡터는 주요 구성 요소 (최대 변함의 방향) 이다. 독자 값은 각각의 구성 요소가 얼마나 많은 변이를 포착하는지 알려줍니다. 이것은 10 장이 다루는 것이 정확히지만 이제 코버리안스 매트릭스가 왜 분해하는 것이 옳은지 알 수 있습니다. 그것은 데이터의 모든 쌍형 선형 관계를 암호화합니다.

**Connection to correlation.**상관관계 행렬은 표준화된 변수들의 코바리안스 행렬 (항일 표준차로 나뉘어) 이다. 상관관계는 코바리안스를 정상화하므로 모든 값이 $[-1, 1]$- 그래

### 가설 테스트

가설 테스트는 불확실성 속에서 결정을 내리는 프레임워크입니다. 당신은 주장을 시작하여 데이터를 수집하고 그 데이터들이 주장과 일치하는지 여부를 결정합니다.

**The setup:**

```
Null hypothesis (H0):        the default assumption, usually "no effect"
Alternative hypothesis (H1): what you are trying to show

Example:
  H0: Model A and Model B have the same accuracy
  H1: Model B has higher accuracy than Model A
```

**The p-value**H0가 사실이라고 가정하면, 당신이 관찰한 것과 같은 극단적인 데이터를 보는 확률입니다.

```
p-value = P(data this extreme | H0 is true)

If p-value < alpha (typically 0.05):
    Reject H0. The result is "statistically significant."
If p-value >= alpha:
    Fail to reject H0. You do not have enough evidence.
    This does NOT mean H0 is true.
```

**Confidence intervals**매개 변수에 대한 용이한 값의 범위를 표시합니다.

```
95% confidence interval for the mean:
    x_bar +/- z * (s / sqrt(n))

where z = 1.96 for 95% confidence

Interpretation: if you repeated this experiment many times, 95% of the
computed intervals would contain the true mean. It does NOT mean there
is a 95% probability the true mean is in this specific interval.
```

신뢰 간격의 폭은 정확성에 대해 알려줍니다. 넓은 간격은 높은 불확실성을 의미합니다. 좁은 간격은 당신의 추정치가 정확하다는 것을 의미합니다 (그러나 데이터가 편향적이라면 반드시 정확하지는 않습니다).

### t 테스트

t 테스트는 여러 가지 맛을 비교합니다.

**One-sample t-test:**인구 평균은 가설된 값과 다르나요?

```math
\begin{aligned}
t &= \frac{\bar{x} - \mu_0}{s / \sqrt{n}} \\[4pt]
\text{degrees of freedom} &= n - 1
\end{aligned}
```

**Two-sample t-test (independent):**두 그룹은 다른 의미일까요?

```
t = (x_bar_1 - x_bar_2) / sqrt(s1^2/n1 + s2^2/n2)

This is Welch's t-test, which does not assume equal variances.
Always use Welch's unless you have a specific reason for equal variances.
```

**Paired t-test:**측정이 쌍으로 이루어질 때 ( 동일한 데이터 분할에서 평가된 동일한 모델):

```
Compute d_i = x_i - y_i for each pair
Then run a one-sample t-test on the d_i values against mu_0 = 0
```

ML에서, 쌍 t 테스트는 일반적입니다. 두 모델을 동일한 10 개의 크로스 검증 폴드에 실행하고, 그들의 점수를 쌍으로 비교합니다.

### 치 제곱 테스트

치 제곱 테스트는 관찰된 주파수가 예상된 주파수에 일치하는지 확인합니다.

```
chi^2 = sum((observed - expected)^2 / expected)

Example: does a language model's output distribution match the
training distribution across categories?

Category    Observed   Expected
Positive       120        100
Negative        80        100
chi^2 = (120-100)^2/100 + (80-100)^2/100 = 4 + 4 = 8

With 1 degree of freedom, chi^2 = 8 gives p < 0.005.
The difference is significant.
```

### ML 모델에 대한 A/B 테스트

ML에서 A/B 테스트는 웹 A/B 테스트와 동일하지 않습니다. 모델 비교는 특정 과제를 가지고 있습니다.

```
1. Same test set:    Both models must be evaluated on identical data.
                     Different test sets make comparison meaningless.

2. Multiple metrics: Accuracy alone is not enough. You need precision,
                     recall, F1, latency, and fairness metrics.

3. Variance:         Use cross-validation or bootstrap to estimate
                     the variance of each metric, not just point estimates.

4. Data leakage:     If the test set was used during model selection,
                     your comparison is biased. Hold out a final test set.
```

**The procedure:**

```
1. Define your metric and significance level (alpha = 0.05)
2. Run both models on the same k-fold cross-validation splits
3. Collect paired scores: [(a1, b1), (a2, b2), ..., (ak, bk)]
4. Compute differences: d_i = b_i - a_i
5. Run a paired t-test on the differences
6. Check: is the mean difference significantly different from 0?
7. Compute a confidence interval for the mean difference
8. Compute effect size (Cohen's d) to judge practical significance
```

### 통계적 의미 와 실제적 의미

그 결과 통계적으로 중요하지만 실질적으로 의미가 없습니다. 충분한 자료를 가지고 있으면 소소한 차이도 통계적으로 중요해집니다.

```
Example:
  Model A accuracy: 0.9234
  Model B accuracy: 0.9237
  n = 1,000,000 test samples
  p-value = 0.001

Statistically significant? Yes.
Practically significant? A 0.03% improvement is not worth the
engineering cost of deploying a new model.
```

**Effect size**샘플 크기와 상관없이 차이가 얼마나 큰지 양자적으로 나타냅니다.

```math
\begin{aligned}
\text{Cohen's } d &= \frac{\text{mean}_1 - \text{mean}_2}{\text{pooled\_std}} \\[4pt]
d &= 0.2: \quad \text{small effect} \\
d &= 0.5: \quad \text{medium effect} \\
d &= 0.8: \quad \text{large effect}
\end{aligned}
```

항상 p 값과 효과 크기를 모두 보고하십시오. p 값은 차이가 실제인지 알려줍니다. 효과 크기는 그것이 중요하다면 알려줍니다.

### 여러 가지 비교 문제

많은 가설을 테스트할 때, 어떤 가설은 우연히 "미치"을 얻을 수 있습니다.$\alpha = 0.05$, 당신은 1 거짓 긍정의 기대를 합니다. 아무것도 실제는 없습니다.

```
P(at least one false positive) = 1 - (1 - alpha)^m

m = 20 tests, alpha = 0.05:
P(false positive) = 1 - 0.95^20 = 0.64

You have a 64% chance of at least one false positive.
```

**Bonferroni correction:**나눌 수 있습니다$\alpha$시험의 수에 따라

```
Adjusted alpha = alpha / m = 0.05 / 20 = 0.0025

Only reject H0 if p-value < 0.0025.
Conservative but simple. Works when tests are independent.
```

ML에서, 이것은 여러 메트릭스에서 모델을 비교하거나, 많은 하이퍼파라미터 구성을 테스트하거나, 여러 데이터 세트에 평가할 때 중요합니다.

### 부트스트랩 방법

부트스트래핑은 데이터의 샘플링 배포를 대체로 재 샘플링함으로써 통계의 샘플링 배포를 추정합니다. 기본 배포에 대한 가설이 필요하지 않습니다.

**The algorithm:**

```
1. You have n data points
2. Draw n samples WITH replacement (some points appear multiple times,
   some not at all)
3. Compute your statistic on this bootstrap sample
4. Repeat B times (typically B = 1000 to 10000)
5. The distribution of bootstrap statistics approximates the
   sampling distribution
```

**Bootstrap confidence interval (percentile method):**

```
Sort the B bootstrap statistics
95% CI = [2.5th percentile, 97.5th percentile]
```

**Why bootstrap matters for ML:**

```
- Test set accuracy is a point estimate. Bootstrap gives you
  confidence intervals.
- You cannot assume metric distributions are normal (especially
  for AUC, F1, precision at k).
- Bootstrap works for ANY statistic: median, ratio of two means,
  difference in AUC between two models.
- No closed-form formula needed.
```

**Bootstrap for model comparison:**

```
1. You have predictions from Model A and Model B on the same test set
2. For each bootstrap iteration:
   a. Resample test indices with replacement
   b. Compute metric_A and metric_B on the resampled set
   c. Store diff = metric_B - metric_A
3. 95% CI for the difference:
   [2.5th percentile of diffs, 97.5th percentile of diffs]
4. If the CI does not contain 0, the difference is significant
```

이것은 t 테스트보다 더 강합니다. 왜냐하면 분포 가정을 하지 않기 때문입니다.

### 파라메트릭 대 비 파라메트릭 테스트

**Parametric tests**특정 분포를 가정한다 (일반적으로 정상):

```
t-test:         assumes normally distributed data (or large n by CLT)
ANOVA:          assumes normality and equal variances
Pearson r:      assumes bivariate normality
```

**Non-parametric tests**분배 가정을 하지 않습니다.

```
Mann-Whitney U:     compares two groups (replaces independent t-test)
Wilcoxon signed-rank: compares paired data (replaces paired t-test)
Spearman rho:       correlation on ranks (replaces Pearson)
Kruskal-Wallis:     compares multiple groups (replaces ANOVA)
```

**When to use non-parametric:**

```
- Small sample size (n < 30) and data is clearly non-normal
- Ordinal data (ratings, rankings)
- Heavy outliers you cannot remove
- Skewed distributions
```

**When to use parametric:**

```
- Large sample size (CLT makes the test statistic approximately normal)
- Data is roughly symmetric without extreme outliers
- More statistical power (better at detecting real differences)
```

ML 실험에서는 일반적으로 작은 $n$(5 또는 10개의 십자정확인 접착) 이므로 윌코슨 서명 랭크와 같은 비파라메트릭 테스트는 t 테스트보다 종종 더 적합합니다.

### 중앙 한계 정리: 실용적 인 영향

CLT는 샘플의 분포가 평균적으로 정상적인 분포에 접근한다고 말합니다.$n$그 기반 인구 분포에 관계없이 증가합니다.

```
If X_1, X_2, ..., X_n are iid with mean mu and variance sigma^2:

    X_bar ~ Normal(mu, sigma^2 / n)    as n -> infinity

Works for n >= 30 in most cases.
For highly skewed distributions, you might need n >= 100.
```

**Why this matters for ML:**

```
1. Justifies confidence intervals and t-tests on aggregated metrics
2. Explains why averaging over cross-validation folds gives stable
   estimates even when individual folds vary wildly
3. Mini-batch gradient descent works because the average gradient
   over a batch approximates the true gradient (CLT in action)
4. Ensemble methods: averaging predictions from many models gives
   more stable output than any single model
```

**What CLT does NOT do:**

```
- Does NOT make your data normal. It makes the MEAN of samples normal.
- Does NOT work for heavy-tailed distributions with infinite variance
  (Cauchy distribution).
- Does NOT apply to dependent data (time series without correction).
```

### ML 문서의 일반적인 통계 오류

1. **Testing on the training set.**항상 모델이 훈련 중에 볼 수 없는 데이터를 보관합니다.

2. **No confidence intervals.**불확실성이 없는 단일 정확성 번호를 보고하면 결과는 재현되지 않고 검증되지 않습니다.

3. **Ignoring multiple comparisons.**50개의 구성을 테스트하고 가장 좋은 것을 수정하지 않고 보고하면 잘못된 긍정적 인 비율이 증가합니다.

4. **Confusing statistical and practical significance.**0.001의 p 값은 0.01%의 정확성 향상에 의미가 없습니다.

5. **Using accuracy on imbalanced data.**99% 부정적 클래스 있는 데이터 세트에 99%의 정확도는 모델이 아무것도 배우지 않았다는 것을 의미합니다. 정확성, 회수, F1 또는 AUC를 사용하십시오.

6. **Cherry-picking metrics.**모델이 승리한 메트릭만 보고하고 정직한 평가로 모든 메트릭을 보고합니다.

7. **Leaking information across train/test splits.**나뉘기 전에 정상화하거나, 과거를 예측하기 위해 미래의 데이터를 사용한다.

8. **Small test sets with no variance estimates.**100개의 샘플을 통해 평가하고 2%의 개선이 있다고 주장하는 것은 신호가 아니라 소음입니다.

9. **Assuming independence when data is not independent.**같은 환자에서 의료진의 사진, 같은 문서에서 여러 문장. 집단 내 관찰은 상관관계가 있습니다.

10. **P-hacking.**다른 테스트, 하위 집합 또는 배제 기준을 시도하는 동안$p < 0.05$그 결과, 검색의 유물입니다.

## 그 를 건설

다음을 구현할 것입니다.

1. **Descriptive statistics from scratch**(평균, 중위, 모드, 표준차각, 퍼센틸, IQR)
2. **Correlation functions**(피어슨과 스피어먼, 코버라이언스 매트릭스)
3. **Hypothesis tests**(1 샘플 t 테스트, 2 샘플 t 테스트, chi-제곱 테스트)
4. **Bootstrap confidence intervals**(어떤 통계 자료에 대해서는 가정이 필요 없습니다)
5. **A/B test simulator**(데이터를 생성하고, 테스트하고, 타입 I 및 타입 II 오류를 확인)
6. **Statistical vs practical significance demo**(그렇게 큰 것을 보여)$n$모든 것을 "중요한 것"으로 만듭니다.)

모두 처음부터, 오직`math`그리고`random`- 이 없어, 이 없어

```figure
f3-bootstrap-resample
```

## 주요 용어

| Term | Definition |
|---|---|
| Mean | Sum of values divided by count. Sensitive to outliers. |
| Median | Middle value of sorted data. Robust to outliers. |
| Standard deviation | Square root of variance. Measures spread in original units. |
| Percentile | Value below which a given percentage of data falls. |
| IQR | Interquartile range. Q3 minus Q1. The spread of the middle 50%. |
| Pearson correlation | Measures linear association between two variables. Range $[-1, 1]$. |
| Spearman correlation | Measures monotonic association using ranks. |
| Covariance matrix | Matrix of pairwise covariances between all features. |
| Null hypothesis | Default assumption of no effect or no difference. |
| p-value | Probability of data this extreme given the null hypothesis is true. |
| Confidence interval | Range of plausible values for a parameter at a given confidence level. |
| t-test | Tests whether means differ significantly. Uses the t-distribution. |
| Chi-squared test | Tests whether observed frequencies differ from expected frequencies. |
| Effect size | Magnitude of a difference, independent of sample size. Cohen's d is common. |
| Bonferroni correction | Divides significance threshold by number of tests to control false positives. |
| Bootstrap | Resampling with replacement to estimate sampling distributions. |
| Type I error | False positive. Rejecting H0 when it is true. |
| Type II error | False negative. Failing to reject H0 when it is false. |
| Statistical power | Probability of correctly rejecting a false H0. Power = 1 minus Type II error rate. |
| Central limit theorem | Sample means converge to a normal distribution as sample size grows. |
| Parametric test | Assumes a specific distribution for the data (usually normal). |
| Non-parametric test | Makes no distributional assumptions. Works on ranks or signs. |
