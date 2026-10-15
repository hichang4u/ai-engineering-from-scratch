# 생산의 모니터링 모델  데이터 드리프 및 개념 드리프

> 배포된 모델은 오류 메시지가 없어도 실패합니다. 전 세계가 훈련 데이터에서 멀어지는 동안 점수를 계속 반환합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2, Lessons 09 (Model Evaluation), 16 (Anomaly Detection), and 19 (ML System Design)
**Time:** ~110 minutes

## 학습 목표

- 시스템 건강, 입력, 예측 및 결과: 4 층에서 모니터링 신호를 선택하십시오
- 코바리아트 드리프, 이전 드리프, 개념 드리프를 변화하는 공동 분포의 부분으로 구분한다
- 인구 안정성 지표, 두 샘플 콜모고로프-스미르노프 통계, 그리고 치 제곱 테스트를 처음부터 구현
- 고정된 참조 창과 슬라이딩 현상의 창을 비교하고, 창의 크기가 어떻게 소음과 지연을 변화시키는지를 설명하십시오.
- 실효 크기와 여러 테스트 수정 및 지속 규칙으로 거짓 알람을 제한하는 경고 정책을 설계하십시오
- 어떤 종류의 파동이 재교육을 필요로 하는지, 어떤 종류의 새 라벨이 필요한지, 어떤 종류의 행동이 필요하지 않은지 결정합니다.

## 문제

지불 위험 모델 은 95% 정확성 으로 생기고 있다. 두 달 후, 마케팅 캠페인은 더 큰 바구니 를 가지고 있는 앱 사용자를 끌어들인다. 4 개월 후, 사기꾼 은 전용 방법 을 바꾸고, 이전 에 안전 한 지불 은 다시 충전금 으로 변하기 시작 합니다.

모델 서비스는 이 모든 동안 모든 요청에 대해 HTTP 200를 반환합니다. 지연은 정상이며 로그에는 오류가 없습니다. 문제 첫 번째 징후는 피해가 발생한 몇 주 후에 충전회환에 대한 금융 보고입니다.

소프트웨어 모니터링은 서비스 응답 여부를 확인합니다. 모델 모니터링은 응답이 여전히 올바르고 데이터가 여전히 모델을 훈련시킨 데이터와 비슷하는지 확인합니다. 이 수업은 두 번째 작업에 대한 통계, 창 및 경고 정책을 구축합니다. 두 개의 주입 변경으로 합성 스트림을 실행하고 어떤 모니터가 어떤 변경에 반응하는지 관찰합니다.

## 개념

### 무엇을 감시해야 하는 것

네 층을 감시하고 첫 세 층은 조기 경고를 하고 네 번째 층만 정확성을 측정하고 늦어집니다.

| Layer | Signals | Available | Question it answers |
|---|---|---|---|
| System health | p50 and p99 latency, error rate, throughput, memory | At once | Does the service answer? |
| Inputs | Distribution of each feature, missing-value rate, schema, new categories | At once | Does live data look like training data? |
| Predictions | Score distribution, positive rate, share of default answers | At once | Does the model behave as before? |
| Outcomes | Accuracy, precision, calibration, business metric | After the label delay | Is the model still right? |

이 강의의 주요 주제는 입력 모니터링입니다. 왜냐하면 그것은 레이블이 도착하기 전에 작동하기 때문입니다. 데모에서 보여주는 한계가 있습니다. 일부 변경 사항은 입력값을 손상시키지 않습니다.

### 3가지 종류의 파동

입력의 공동 분포를 작성합니다 `x`그리고 표지`y`두 가지 방법으로

```math
P(x, y) = P(x) \cdot P(y \mid x) = P(y) \cdot P(x \mid y)
```

각 종류의 파동은 다른 요인을 변화시킵니다.

| Drift | What changes | What stays | Payment example | Which monitor sees it |
|---|---|---|---|---|
| Covariate drift | `P(x)` | `P(y \| x)` | More app users with larger baskets | Input monitors |
| Prior drift | `P(y)` | `P(x \| y)` | The fraud rate doubles during an attack, and fraud looks the same | Prediction and outcome monitors |
| Concept drift | `P(y \| x)` | Can stay | The same basket now has a different fraud risk | Outcome monitors only |

가마 등은 변경을 요청합니다`P(y | x)`실제 개념의 파동. 그들은 변화라고 합니다.`P(x)`그 후`P(y | x)`또한, 그들의 조사에서는 시간이 지남에 따라 어떻게 일어나는지에 따라 도피를 분류합니다. 즉흥적으로, 단계적으로,

코버이아트 드래프트는 항상 해를 끼치지 않습니다.`P(y | x)`하지만, 모든 입력에 맞게 유지됩니다. 트래픽이 훈련 데이터가 거의 없는 지역이나 의사 결정 경계에 가까운 지역으로 이동할 때 정확도가 떨어질 수도 있습니다.

### 지연된 표기

예측 후 결과가 나오는데, 지연은 문제에 달려 있습니다.

| Problem | When the label arrives |
|---|---|
| Ad click | Seconds |
| Churn in the next 30 days | 30 days |
| Card fraud | When the chargeback arrives, often weeks later |
| Loan default | Months or years |

지연 기간 동안 입력과 예측이 있지만 결과는 없습니다. 입력과 예측을 모니터링하고, 도착할 때 라벨에 가입하고, 라벨된 부분에서만 결과 매트릭을 계산합니다. 데모는 500 이벤트의 레이블 지연을 사용합니다. 따라서 결과 모니터는 항상 500 이벤트를 과거로 돌아 봅니다.

### 참조 및 현재 창

각 파동 테스트는 두 개의 샘플을 비교합니다.

- **Reference window.**훈련 자료나 수동으로 확인한 생산 기간은 다시 훈련할 때까지 고정되어 있습니다.
- **Current window.**가장 최근의 사건, 혹은 마지막 사건`N`사건이나 마지막 사건`T`몇 시간 동안

슬라이딩 창은 크기에 비해 한 단계 작아진 상태에서 앞으로 이동하므로 연속적인 창은 겹쳐진다. 윙윙 창은 전체 크기로 이동한다. 창의 크기는 타협이다. 작은 창은 빠르게 반응하지만 소음을 추동하는 것으로 점수를 받는다. 큰 창은 안정적이지만 늦게 변화를 보고한다.

계절성 은 순진 한 창 을 깨뜨리죠. 월요일 교통 은 많은 제품 들 에서 토요일 교통 과 다르죠. 참조 를 한 전체 순환 을 덮어 놓거나, 이전 순환 에 있는 같은 기간 에 있는 각 창 을 비교 하십시오.

### 인구 안정성 지표

PSI는 신용 점수를 통해 나온다. 참조 값은 통로 나눌 수 있습니다. 일반적으로 10 통로 기준 데실로, 각 통은 참조의 10%를 보유하고 있습니다. 각 통에서 현재 값의 비중을 계산합니다. 다음 각 통로 한 단어가 합시다:

```math
\text{PSI} = \sum_{\text{bins}} (\text{current\_share} - \text{reference\_share}) \cdot \ln\left(\frac{\text{current\_share}}{\text{reference\_share}}\right)
```

0의 비중이 있는 빈은 로그를 무한하게 만듭니다. 따라서 모든 비중을 0.0001 같은 작은 값으로 클립합니다. PSI는 대칭입니다. 그것은 현재로부터 참조까지 KL의 차이는 더하여 현재로부터 참조까지 KL의 차이는 같습니다.

실무자들은 PSI를 고정된 밴드와 함께 읽습니다. 0.1 이하의 경우 안정적이거나 0.1에서 0.25까지는 중소적인 변화이며 0.25 이상은 상당한 변화입니다. 이러한 밴드를 시험이 아닌 협약으로 간주하십시오. PSI는 캔의 수와 함께 증가하고 샘플 크기와 함께 줄어들습니다. 데모에서, 500개의 이벤트의 창은 0.01에서 0.04 사이의 유도 점수를 얻지 않고 있습니다.

### 콜모고로프-스미르노프 통계

두 가지 샘플 KS 통계는`D`두 경험적 누적 분포 함수 사이의 가장 큰 수직 격차입니다.

```math
D = \max_x \left\lvert F_{\text{reference}}(x) - F_{\text{current}}(x) \right\rvert
```

`D`동일한 샘플에 대해서는 0이고, 겹치지 않는 샘플에 대해서는 1입니다. 칸이 필요하지 않습니다. p 값은 실제 샘플 크기와 함께 콜모고로프 분포에서 나온다.`n * m / (n + m)`- 그래

큰 샘플에서, p 값은 아무도 신경 쓰지 않는 격차를 위해 0으로 이동합니다. 0.02 표준 경각심을 변화하는 것은 매 창에 백만 개의 이벤트로 "의미하다". 사용 `D`그 자체는 효과 크기로, 그리고 모두 `D`그리고 p 값은 그 문턱을 넘어서게 됩니다.

### 카테고리 특징을 위한 치 제곱 테스트

지불 채널과 같은 범주적 기능에 대해 2 줄 ( 참조, 현재) 및 1 열을 가진 테이블을 구성하십시오. 각 셀의 예상 수치는 행과 열 총에서 나옵니다.

```math
\begin{aligned}
\text{expected}[r][c] &= \text{row\_total}[r] \cdot \text{column\_total}[c] / \text{grand\_total} \\
\text{chi2} &= \sum_{\text{cells}} (\text{observed} - \text{expected})^2 / \text{expected}
\end{aligned}
```

테스트는`k - 1`자유의 정도`k`범주: 현재 창에서만 나타나는 범주에는 큰 용어가 추가되어, 테스트는 새로운 값에 반응합니다. 크레머의 V는 효과 크기가 있습니다. 두 줄이있는 테이블에서, 그것은 의 제곱근에 해당합니다.`chi2 / grand_total`- 그래

### 경고 문턱 및 거짓 경고

모든 테스트는 가짜 알람률을 가지고 있습니다`alpha`시내에서 50개의 기능이 확인되고`alpha = 0.05`하루 60개의 가짜 알람이 나올 것으로 예상하고 있는데, 그 전에 사람들은 알림을 읽지 않습니다.

4가지 규칙으로 경보율이 유용하게 유지됩니다.

1. **Correct for multiple tests.**보네퍼로니 수정은 나뉘어`alpha`테스트의 숫자에 따라.`alpha`두 가지 테스트에서 0.01의 경우, 각 테스트는 0.005을 사용합니다.
2. **Require an effect size.**PSI가 발생했을 때만 알림`D`, 또는 크레머의 V도 문턱을 통과합니다.
3. **Require persistence.**경고가 끝나면`k`연속적인 유동 창.`k = 2`- 그래
4. **Separate warnings from alerts.**경고는 대시보드, 경고는 사람에게 전달됩니다.

데모는 규칙 2가 작동하는 것을 보여줍니다. 한 깨끗한 창에는 0.0009의 chi-제곱 p 값이 있습니다.`alpha`크레머 V는 0.1 이하로 되어 있어 경보가 기록되어 있지요

### 재훈련 트리거

재교육에 대한 일반적인 트리거는 세 가지입니다.

- **Schedule.**일주일에 한 번씩 또는 매달 다시 훈련합니다. 이것은 간단하지만 아무것도 바뀌지 않을 때 다시 훈련합니다. 그리고 뭔가 바뀌었을 때 기다립니다.
- **Drift.**중요한 특징에 대한 입력 파동이 문턱을 넘어서면 다시 훈련합니다.
- **Performance.**결과 측정값이 기준값을 빼면 용납값이 떨어지면 다시 훈련한다.

이 종류의 파동은 재교육이 무엇을 할 수 있는지 결정합니다.

| Drift | Useful action |
|---|---|
| Covariate drift, accuracy stable | Often none. Keep watching the outcome metric. |
| Covariate drift into regions with little data | Retrain on recent data that includes those regions |
| Prior drift | Recalibrate the scores or move the decision threshold |
| Concept drift | Collect new labels first. Retraining on old labels teaches the old concept again. |

재훈련 후, 최신 라벨된 데이터에 따라 새로운 모델을 테스트하고, 시스템 설계 수업에서 그림자와 카나리 단계로 롤 आउट하고, 새로운 훈련 데이터에 대한 참조 창을 다시 설정하십시오.

```figure
mlprod-drift-psi
```

## 건설 해

코드는 `code/main.py`표준 라이브러리를 이용합니다.

### 단계 1: 양자 캔 및 PSI

빗자루 가장자리는 참조 데실입니다.`bisect_right`각 값의 칸을 찾습니다.

```python
def quantile_edges(reference: list[float], bins: int = 10) -> list[float]:
    ordered = sorted(reference)
    n = len(ordered)
    edges = [ordered[min(n - 1, (n * i) // bins)] for i in range(1, bins)]
    return sorted(set(edges))


def psi_from_fractions(expected: list[float], actual: list[float], eps: float = 1e-4) -> float:
    total = 0.0
    for e, a in zip(expected, actual):
        e, a = max(e, eps), max(a, eps)
        total += (a - e) * math.log(a / e)
    return total
```

### 단계 2: KS 통계 및 그 p 값

두 개의 분류된 샘플을 함께 이동합니다. 각각의 값에서 두 샘플의 모든 복사본을 지나가며 두 개의 누적 공유를 비교합니다. 이것은 연결을 올바르게 처리합니다.

```python
def ks_statistic(sample_a: list[float], sample_b: list[float]) -> float:
    a, b = sorted(sample_a), sorted(sample_b)
    n, m = len(a), len(b)
    i = j = 0
    d = 0.0
    while i < n and j < m:
        x = min(a[i], b[j])
        while i < n and a[i] <= x:
            i += 1
        while j < m and b[j] <= x:
            j += 1
        d = max(d, abs(i / n - j / m))
    return d
```

p 값은 Kolmogorov 분포에 대한 일련을 사용합니다.`2 * sum((-1)^(k-1) * exp(-2 k^2 lambda^2))`,`lambda = sqrt(n * m / (n + m)) * D`- 그래

### 3단계: 치 제곱 테스트

`chi2_sf`정규화된 상부 불완전 마 함수를 통해 치 제곱 생존 함수를 계산합니다. 작은 주장에 일련과 큰 주장에 연속 분수를 사용합니다. `chi_square_test`2줄 테이블을 만들고, 통계를 계산하고, p 값과 크레머의 V를 반환합니다.

```python
def chi_square_test(reference_counts: dict[str, int], current_counts: dict[str, int]) -> ChiSquareResult:
    categories = [c for c in sorted(set(reference_counts) | set(current_counts))
                  if reference_counts.get(c, 0) + current_counts.get(c, 0) > 0]
    rows = [[reference_counts.get(c, 0) for c in categories], [current_counts.get(c, 0) for c in categories]]
    row_totals = [sum(r) for r in rows]
    grand = sum(row_totals)
    if len(categories) < 2 or 0 in row_totals:
        return ChiSquareResult(0.0, 0, 1.0, 0.0)
    statistic = 0.0
    for col, _ in enumerate(categories):
        col_total = rows[0][col] + rows[1][col]
        for r in range(2):
            expected = row_totals[r] * col_total / grand
            statistic += (rows[r][col] - expected) ** 2 / expected
    dof = len(categories) - 1
    return ChiSquareResult(statistic, dof, chi2_sf(statistic, dof), math.sqrt(statistic / grand))
```

### 단계 4: 윈도우와 드립 모니터

`SlidingWindow`마지막을 지키고 있어요`size``deque`-`DriftMonitor`참고 칸을 계산하고 한 번 계산합니다.`check`방법 PSI를 반환합니다.`D`, 그리고 각 수치 속성의 KS p 값, 그리고 각 범주 속성의 chi-제곱 결과.

### 단계 5: 경보 정책

정책은 매 매트릭을 레벨로 변환하고 신호당 연속적인 유동 창을 계산합니다.

```python
def level(self, metrics: dict[str, float]) -> str:
    if "psi" in metrics:
        if metrics["psi"] >= self.psi_drift or (metrics["ks"] >= self.ks_drift and metrics["ks_p"] < self.alpha):
            return "drift"
        return "warn" if metrics["psi"] >= self.psi_warn else "ok"
    if metrics["p"] < self.alpha and metrics["v"] >= self.min_cramers_v:
        return "drift"
    return "warn" if metrics["p"] < self.alpha else "ok"
```

`update`수익금`ALERT`그 줄을 완성하는 창에, 그리고`resolved`경보를 받은 후 첫 번째 깨끗한 창에

### 단계 6: 주입된 파류로 흐르는 흐름

스트림은 9000개의 지불 이벤트를 가지고 있습니다.`amount`, a `channel`, 그리고 사기꾼`label`4개의 부분에서 정의됩니다.

| Events | Amount | Channel mix (app, store, web) | Label boundary | Change |
|---|---|---|---|---|
| 0 to 2999 | mean 100, sd 20 | 35, 15, 50 percent | 120 | Reference period |
| 3000 to 4999 | mean 118, sd 24 | 60, 10, 30 percent | 120 | Covariate drift |
| 5000 to 6499 | mean 100, sd 20 | 35, 15, 50 percent | 120 | Back to normal |
| 6500 to 8999 | mean 100, sd 20 | 35, 15, 50 percent | 105 | Concept drift |

모델은 `amount`윈도우는 500개의 이벤트를 개최하고 250개로 이동합니다.

```bash
python3 code/main.py
```

```console
  end    PSI   KS D   chi2 p    acc  levels (amount/channel/accuracy)  events
 3000  0.010  0.041  3.0e-01  0.932  ok/ok/ok
 3250  0.152  0.163  7.6e-06  0.924  drift/warn/ok
 3500  0.463  0.298  2.8e-26  0.936  drift/drift/ok                     ALERT amount
 3750  0.609  0.343  3.5e-35  0.942  drift/drift/ok                     ALERT channel
 ...
 5500  0.026  0.044  2.6e-01  0.898  ok/ok/ok                           resolved amount, resolved channel
 ...
 7250  0.040  0.048  7.1e-01  0.848  ok/ok/drift
 7500  0.022  0.039  6.1e-01  0.778  ok/ok/drift                        ALERT accuracy
```

이 결과를 세 부분으로 읽어 보세요.

- **Covariate drift.**유동은 3000번 이벤트에서 시작됩니다`amount`알림은 3500로 이어집니다. 정확도는 0.89에서 0.95 사이로 유지됩니다. 왜냐하면 라벨 규칙이 변하지 않았기 때문입니다.
- **Recovery.**입력값은 5000에서 정상으로 돌아와 두 알림은 5500에서 해결됩니다.
- **Concept drift.**파동은 6500에서 시작되며 입력 모니터들은 입력값이 변하지 않았기 때문에 조용합니다. 정확도는 0.946에서 0.76에서 0.79 사이에 떨어집니다. 정확성 알림은 변경 후 7500, 1000 이벤트에 나타납니다. 레이블 지연은 그 중 500 개에 해당합니다.

## 사용 하 고

**scipy.** `scipy.stats`이 수업을 실행하기 위해 스피피피가 필요하지 않습니다.

```python
from scipy import stats

result = stats.ks_2samp(reference_amounts, current_amounts)
print(result.statistic, result.pvalue)

table = [[1000, 700, 300], [140, 290, 70]]
chi2 = stats.chi2_contingency(table)
print(chi2.statistic, chi2.pvalue, chi2.dof)
```

확인했네`ks_statistic`그리고`chi_square_test`무작위 샘플에서 scipy 1.18.1에 대한 비교. KS 통계, chi-제곱 통계, 그리고 chi-제곱 p 값은 부동소수점 정확도에 일치했습니다. 200 개 무작위 샘플에서 KS p 값은 scipy 값의 최대 18%에 달한다. 가장 큰 격차는 매우 작은 p 값에 있었다.

이 격차는 방법에서 나온다. 우리의 코드는 제한적인 콜모고로프 분포를 사용합니다. 기본적으로,`ks_2samp`두 샘플 모두 최대 10,000 값을 갖는 경우 정확한 방법을 사용합니다. 그 비정상적 모드는 분포된 샘플을 사용하며, 원형 실제 샘플 크기를 사용합니다. 두 가지 범주로,`chi2_contingency`예이트스의 연속성 수정값을 기본으로 적용해서 통계는 다르죠.

**Monitoring libraries.**여러 오픈소스 라이브러리는 이러한 테스트를 보고서와 대시보드로 패키지합니다.

- **Evidently**각 열에 대한 유동 테스트를 선택합니다. 1000 줄 또는 그보다 적은 참조에 대해, 그것은 숫자 열에 대한 KS 테스트와 범주 열에 대한 chi-제곱 테스트를 사용합니다. 더 큰 데이터에 대해, 그것은 0.1의 임계로 와스스스테인 거리와 Jensen-Shannon 분리를 사용합니다. PSI는 당신이 선택할 수있는 다른 방법 중 하나입니다.
- **NannyML**에이블 도착하기 전에 모델 성능을 추정합니다. 신뢰 기반 성능 추정 (CBPE) 는 모델의 예측 확률을 사용합니다. 이는 잘 캘리브해야 합니다. NannyML 문서에서는 CBPE가 변동 변동을 처리하지만 개념 유동에 대처하지 않는다고 명시합니다. 데모 스트림은 왜: 레이블만이 개념 유동을 밝혀낸지 보여줍니다.
- **TensorFlow Data Validation**연속적인 데이터 범위를 비교합니다. 범주적 특징을 위해 L-무궁무진 거리를 사용하고 수치적인 특징을 위해 대략적인 Jensen-Shannon 분리를 사용합니다. 또한 기능 저장 수업에서 다루는 서비스 데이터와 훈련 데이터를 비교합니다.

초점 코드 는 이 도구 들 의 각 하나 가 계산 하는 것 을 알려 줍니다. 도구 들 은 저장 장치, 일정을 설정, 대시보드, 그리고 더 많은 테스트 를 추가 합니다.

LLM 신청에 대해서는[LLM observability lesson](../../../17-infrastructure-and-production/13-llm-observability/docs/en.md)인프라 단계에서는 추적 및 평가 도구를 포함합니다. 이 수업의 아이디어는 여전히 이러한 시스템의 입력 및 출력에 적용됩니다.

## 선박

이 교훈은`outputs/skill-drift-monitoring.md`. 기술 은 새로운 모델 을 위한 모니터 를 계획 하고, 도래 경고 를 분류 한다. 어떤 층 이 발사 되었는지, 어떤 종류의 도래가 증거 에 맞는 것인지, 그리고 올바른 행동 은 기다림, 재계급, 라벨 수집 또는 재 훈련 여부를 묻는다.

## 운동

1. 200 및 2000 이벤트의 창을 사용하여 스트림을 실행하고 3000 이벤트 이전 거짓 경고와 경고 지연을 기록하십시오.
2. 세트 `n_tests=1``patience=1`그리고`min_cramers_v=0`- 청정 기간 동안 알림을 5000에서 6500까지 계산해 보세요
3. 100 사건당 평균 0.01 증가하는 특징을 추가하고 어떤 신호, PSI 또는 KS가 먼저 반응하는지 찾아보십시오.
4. 같은 덱셀 캔에 젠센-샤논 거리를 적용해 모든 창에 PSI와 비교해 보세요.
5. 모델 의 긍정적 인 예측 속도 를 나타내는 모니터 를 추가 하고, 모델 의 개념 이 흐르는 동안 왜 조용 하게 유지 되는 지 설명 하십시오.

## 주요 용어

| Term | What people say | What it means |
|------|----------------|----------------------|
| Data drift | "The data changed" | A change in the distribution of inputs, predictions, or labels compared with a reference window |
| Covariate drift | "New kinds of users" | `P(x)` changes while `P(y \| x)` stays the same |
| Prior drift | "More positives than before" | `P(y)` changes while `P(x \| y)` stays the same, also called label shift |
| Concept drift | "The rules of the game changed" | `P(y \| x)` changes, so the same input now has a different correct answer |
| Reference window | "The baseline data" | A fixed sample, often the training data, that every current window is compared with |
| PSI | "The stability score" | A symmetric sum over bins of (current share minus reference share) times the log of their ratio |
| KS statistic | "The KS test" | The largest gap between two empirical cumulative distribution functions |
| Cramér's V | "Effect size for categories" | The chi-square statistic scaled to the range 0 to 1 |
| Label delay | "Ground truth comes later" | The time between a prediction and the arrival of its true outcome |
| Alert fatigue | "Too many pages" | People ignore alerts because most of them were false alarms |

## 더 많은 읽기

- [Gama et al., A Survey on Concept Drift Adaptation (ACM Computing Surveys, 2014)](https://research.tue.nl/en/publications/a-survey-on-concept-drift-adaptation): 실제 및 가상 유동, 유동 패턴 및 적응 방법
- [Rabanser, Günnemann, and Lipton, Failing Loudly: An Empirical Study of Methods for Detecting Dataset Shift (NeurIPS 2019)](https://arxiv.org/abs/1810.11953): 시동 감지에 대한 두 샘플 테스트
- [Lu et al., Learning under Concept Drift: A Review (2020)](https://arxiv.org/abs/2004.05785): 유동 탐지, 이해 및 적응 방법
- [Yurdakul, Statistical Properties of Population Stability Index (Western Michigan University, 2018)](https://scholarworks.wmich.edu/dissertations/3208/): PSI가 샘플 크기와 덩어리 수를 어떻게 행동하는지
- [scipy.stats.ks_2samp documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ks_2samp.html): 두 샘플 KS 테스트에 대한 정확한 및 비정상적 p 값 방법
- [Evidently, How data drift detection works](https://docs.evidentlyai.com/metrics/explainer_drift): 기둥 타입 및 데이터 크기에 따라 기본 테스트 선택
- [NannyML, Performance estimation](https://nannyml.readthedocs.io/en/stable/how_it_works/performance_estimation.html): CBPE 및 그 가정
