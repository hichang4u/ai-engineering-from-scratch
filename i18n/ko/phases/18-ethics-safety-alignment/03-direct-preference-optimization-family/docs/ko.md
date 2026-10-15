# 직선 선호도 최적화 가족

> 라파일로프 등 (2023) 는 RLHF의 최적의 선호도 데이터 측면에서 닫힌 형태를 가지고 있음을 보여주었습니다. 따라서 명시적인 보상 모델을 건너뛰고 정책을 직접 최적화 할 수 있습니다. 이 통찰은 IPO, KTO, SimPO, ORPO, BPO의 가족들을 낳았습니다. 각각 DPO의 실패 모드를 수정했습니다. 2026년, 직렬 조율 알고리즘은 PPO보다 더 많은 경계를 위한 훈련 후 경주를 배포한다. 하지만 2강에서 나온 과잉 최적화 곡선은 여전히 적용됩니다. DAA는 구다르트에서 탈출하지 않고, 그냥 물리는 곳으로 이동합니다.

**Type:** Learn
**Languages:** Python (stdlib, six-variant preference-loss comparator)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking), Phase 10 · 08 (DPO basics)
**Time:** ~75 minutes

## 학습 목표

- DPO 닫힌 형태를 RLHF-with-KL 최적에서 추출한다.
- DPO에서 IPO, KTO, SimPO, ORPO, BPO의 각각의 오류 모드를 명시합니다.
- "간접적인 보상 격차"와 "우선력"을 구분하고 IPO의 정체성 지도가 중요한 이유를 설명한다.
- 라파일로프等人 (NeurIPS 2024) 는 명백한 RM가 없음에도 불구하고 DAA가 과잉 최적화되는 이유를 설명하십시오.

## 문제

RLHF의 목표는 (강좌 1)

```math
\max_{\pi} \; \mathbb{E}_{x, y \sim \pi} \big[ r(x, y) \big] - \beta \, \mathrm{KL}(\pi \,\|\, \pi_{\text{ref}})
```

알려진 최적의 경우

```math
\pi^*(y \mid x) = \frac{1}{Z(x)} \, \pi_{\text{ref}}(y \mid x) \exp\!\left(\frac{r(x, y)}{\beta}\right)
```

따라서 보상은 최적의 정책과 참조의 비율에 의해 간결하게 정의됩니다.

```math
r(x, y) = \beta \log \frac{\pi^*(y \mid x)}{\pi_{\text{ref}}(y \mid x)} + \beta \log Z(x)
```

이 부분을 브래들리-테리 선호 확률과 파티션 함수에 교체합니다`Z(x)`취소하는 이유는`x`. 남은 것은 정책 매개 변수들만 손실이 됩니다.

: 추리 는 최적의 가용 가능 하 여, 선호 데이터 는 분포 하 에 있으며, 참조 정책 은 실제 모드 앵커 이다. 이 중 어느 것도 정확하게 유지 되지 않는다. 가족 의 모든 구성원 은 다른 위반 가정 을 수정 한다.

## 개념

### DPO (Rafailov et al., 2023)

```math
L_{\text{DPO}} = -\log \sigma\!\left(
  \beta \log \frac{\pi(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)}
  - \beta \log \frac{\pi(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}
\right)
```

무엇이 잘못될 수 있을까요?

- 임시 보상 격차`beta * (log(pi/pi_ref)_w - log(pi/pi_ref)_l)`작은 선호도만으로도 임의로 큰 격차가 발생할 수 있습니다.
- 손실 드라이브는 선택된 로그 탐사선과 거부된 로그 탐사선과 반대 방향으로 이동합니다. 거부된 로그 탐사선이 더 빨리 떨어질 때까지 선택된 절대 로그 탐사선을 아래로 밀어 넣을 수 있습니다. 이것은 디그라드된 선택된 반응 현상입니다.
- 배포되지 않은 선호 (유소한 희귀 쌍과 희귀한 희귀 쌍) 은 임의의 임시 보상을 낳습니다.

### IPO (Azar et al., 2024)

정체성 선호도 최적화는 로그-시그모이드를 선호도 확률에 대한 정체성 지도로 대체합니다. 손실은 제한된 목표에서 사각형 오류가됩니다:

```math
L_{\text{IPO}} = \left( \log \frac{\pi(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \log \frac{\pi(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)} - \frac{1}{2\beta} \right)^2
```

이 지표는 `1/(2 beta)`우선순위 강도와 암시적인 보상 격차는 비례적입니다.

### KTO (Ethayarajh et al., 2024)

카네만-트버스키 최적화는 쌍방향 구조를 완전히 떨어뜨립니다. 단일 라벨 출력과 바이너리 " 바람직한 "또는 " 바람직하지 않은 " 신호를 감안하면, 전망 이론 유틸리티에 매핑됩니다:

```math
v(x, y) = \sigma\!\left(\beta \log \frac{\pi(y \mid x)}{\pi_{\text{ref}}(y \mid x)} - z_{\text{ref}}\right)
```

이점: 부쌍되지 않은 데이터를 사용할 수 있습니다. 이는 훨씬 더 풍부합니다.

### 심포 (Meng et al., 2024)

간단한 선호도 최적화는 훈련 신호와 생성을 조정합니다. 참조 정책을 완전히 제거하고 길이로 로그 확률을 정상화합니다.

```math
L_{\text{SimPO}} = -\log \sigma\!\left(
  \frac{\beta}{|y_w|} \log \pi(y_w \mid x)
  - \frac{\beta}{|y_l|} \log \pi(y_l \mid x)
  - \gamma
\right)
```

한 가지 차이로`gamma`길이가 정상화 된 것은 DPO의 길이가 편향 실패 모드를 이용하는 인센티브를 제거합니다 (더 길게`y_w`건설에 의해 더 큰 로그-프로 격차를 제공합니다).

### ORPO (Hong et al., 2024)

확률 비율 선호도 최적화는 표준 SFT 부정적 로그 확률에 선호 용어를 추가합니다.

```math
\begin{aligned}
L_{\text{ORPO}} &= L_{\text{NLL}}(y_w) + \lambda L_{\text{OR}} \\
L_{\text{OR}} &= -\log \sigma\!\left(\log \frac{\text{odds}(y_w)}{\text{odds}(y_l)}\right)
\end{aligned}
```

참고 정책  SFT 용어는 조절기입니다. 기본 모델에서 정렬된 모델까지 한 단계에 열차합니다. 별도의 SFT 체크포인트 없습니다.

### BPO (ICLR 2026 제출, OpenReview id=b97EwMUWu7)

디그레이드된 선택된 응답 문제를 식별합니다: DPO는 순위를 유지합니다 `y_w > y_l`하지만 절대적인 로그-프로브는`y_w`BPO는 선택된 응답에 대한 하향 동작을 처벌하는 단일 라인 수정을 추가합니다. Llama-3.1-8B-DPO에 대한 수학 추론에 대한 +10.1% 정확성을보고했습니다.

### 보편적 결과: DAA는 여전히 과잉 최적화

라파일로프 등은 "직접 조형 알고리즘에서 보상 모델 과잉 최적화를 위한 확장 법칙" (NeurIPS 2024) 로 DPO, IPO, SLiC를 통해 KL 예산의 여러 데이터 세트에 훈련된 정책을 수행했다. 금-상품-대-KL 곡선은 동일한 Gao 등과 같은 피크- 및 붕괴 형태를 가지고 있다. 임시 보상 요청은 훈련 중에 배포되지 않은 샘플을 요청합니다. KL 규제는 이것을 안정시키지 않습니다.

DAA는 구드하트에서 벗어나지 않습니다. 그것은 "상품 모델이 너무 최적화 된 것"에서 " 참조 정책 비율이 너무 최적화 된 것"으로 니다. 보편적 수정  더 나은 데이터, 집합, 조기 중지 은 둘 모두에게 적용됩니다.

### 그 들 가운데 선택 (2026)

- 큰 쌍용 선호도 데이터를 가지고 있다면: DPO와 보수적인 베타, 길이가 편향되는 경우 SimPO.
- 만약 당신이 부적절한 바이너리 피드백을 가지고 있다면: KTO.
- 만약 당신이 기본 모델에서 단일 단계 파이프라인을 원한다면: ORPO.
- DPO 로그에서 유해된 선택된 로그 탐사기를 보면 BPO입니다.
- 선호도가 크게 다르고 DPO가 포화되는 경우: IPO.

모든 실험실은 5가지 모두 배터리에 달려서 각각의 작업에 승자를 선택합니다. 수학 논리와 안전에 있어서 최적의 방법은 동일하지 않은 이유는 없습니다.

```figure
dpo-margin
```

## 사용 하 고

`code/main.py`장난감 선호도 데이터 세트에서 실제 선호도 강도가 쌍마다 달라지는 6개의 손실 (DPO, IPO, KTO, SimPO, ORPO, BPO) 을 비교합니다. 각각의 손실은 작은 소프트맥스 정책으로 동일한 500 쌍 샘플에 최적화됩니다.

## 선박

이 교훈은`outputs/skill-preference-loss-selector.md`. 데이터 세트 통계 (쌍형과 부쌍형, 변형과 균일한 선호도 강도, 길이의 분포) 및 목표 ( 단일 단계 또는 SFT-이중 선호) 를 고려하면 선호도 손실을 권장하고, 그로부터 보호되는 실패 모드를 보고하십시오.

## 운동

1. 달아`code/main.py`. DPO 및 BPO에 대한 최종 선택된 로그-프로그램 하락을 보고합니다. BPO는 선택된 절대 확률을 더 높게 유지해야 합니다.

2. 우선순위 데이터를 수정하여 모든 쌍이 동일한 강도를 갖도록 합니다. 여섯 가지 방법 중 어느 방법이 가장 견고하고 어느 방법이 더 강하다?

3. 거절된 응답을 선택된 것보다 2배 더 길게 만들어서, 다른 것을 변경하지 않고, DPO의 길이를 수적으로 활용하고 SimPO의 수정을 표시합니다.

4. 라파일로프等人 (NeurIPS 2024) 는 DAAs가 과잉 최적화한다고 주장한다. 단일 포인트 버전을 재생한다: 플롯 선택-미нус 거부 KL 분차 및 큰 베타에서 DPO에서 과잉 최적화를 관찰한다.

5. BPO 논문 추석을 읽어보십시오 (OpenReview b97EwMUWu7). DPO에 BPO가 추가한 일 줄의 수정 사항을 적어 보십시오.`code/main.py`- 그래

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DPO | "RLHF without a reward model" | Loss derived from the closed-form RLHF optimum; policy parameters only |
| Implicit reward | "the log-ratio" | `beta * log(pi(y\|x) / pi_ref(y\|x))` — the DPO-implied reward |
| IPO | "bounded DPO" | Replaces log-sigmoid with identity; implicit reward gap capped by `1/(2 beta)` |
| KTO | "unpaired DPO" | Prospect-theory utility over single labels with loss aversion |
| SimPO | "reference-free DPO" | Length-normalized log-likelihood + margin; no reference policy |
| ORPO | "one-stage DPO" | NLL + odds-ratio preference term; trains from base model in one pass |
| BPO | "chosen-preserving DPO" | DPO plus a penalty for decreasing the chosen response's absolute log-prob |
| Degraded Chosen | "chosen goes down" | DPO decreases chosen log-prob so long as rejected falls faster |
| DAA | "direct alignment algorithm" | Any preference-loss method that skips an explicit RM |

## 더 많은 읽기

- [Rafailov et al. — Direct Preference Optimization (NeurIPS 2023, arXiv:2305.18290)](https://arxiv.org/abs/2305.18290)
- [Azar et al. — A General Theoretical Paradigm to Understand Learning from Human Preferences (AISTATS 2024, arXiv:2310.12036)](https://arxiv.org/abs/2310.12036) IPO
- [Ethayarajh et al. — KTO: Model Alignment as Prospect Theoretic Optimization (arXiv:2402.01306)](https://arxiv.org/abs/2402.01306)
- [Meng, Xia, Chen — SimPO (NeurIPS 2024, arXiv:2405.14734)](https://arxiv.org/abs/2405.14734)
- [Hong, Lee, Thorne — ORPO (EMNLP 2024, arXiv:2403.07691)](https://arxiv.org/abs/2403.07691)
- [BPO — Behavior Preservation Optimization (ICLR 2026 OpenReview b97EwMUWu7)](https://openreview.net/forum?id=b97EwMUWu7)
- [Rafailov et al. — Scaling Laws for RM Overoptimization in DAAs (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900)
