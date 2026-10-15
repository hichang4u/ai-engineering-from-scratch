# 규모 를 측정 하는 법

> 2020년 카플란 논문에서는 더 큰 모델, 더 적은 손실이 있다고 했습니다. 2022년 하프먼 논문에서는 당신이 훈련이 부족하다고 했습니다. 계산은 두 개의 桶에  매개 변수와 토큰으로  갈라지고 분할은 명백하지 않습니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 07 (GPT)
**Time:** ~45 minutes

## 문제

C FLOP의 훈련 컴퓨팅을 가지고 최고의 모델을 원한다면 두 가지 버튼을 마주합니다.

1. **How many parameters (N)?**더 큰 모델, 더 큰 용량.
2. **How many training tokens (D)?**더 많은 데이터, 더 나은 용량 사용.

FLOP의 규모는 대략 `6 × N × D`N을 위로, D를 내려, 또는 D를 위로, N을 내려 밀어 넣을 수 있습니다. 어느 쪽이 더 좋을까요?

2022 년 이전에는 "N 하드 푸시"라는 답이있었습니다. GPT-3 (2020) 은 175B 매개 변수입니다. ~ 300B 토큰에 훈련되었습니다. 매개 변수에 약 1.7 토큰의 비율입니다. 카플란 확장 법칙은 이것을 뒷받침했습니다.

호프만等人 (2022) 는 칠라라는 작은 모델 가족을 훈련시켜서 다른 것을 발견했습니다.**20 tokens per parameter**.GPT-3는 10x 미흡한 상태였다. 칠라 (70B 파라마, 1.4T 토큰) 는 모든 벤치마크에서 2.5x 미흡한 추론 비용으로 GPT-3 (175B, 300B 토큰) 를 이겼다.

2026년은 치야의 세계입니다. Llama 3 8B는 매개 변수당 1,875개의 토큰의 비율로 15조 토큰에 훈련되었습니다. 치야의 최적보다 94배 이상. 치야의 비용은 규모로 사용될 모델에 대한 훈련 비용보다 더 중요합니다. 따라서 더 작은 배포 가능한 발자국을 위해 과도한 훈련 (치야의 과거) 는 2026 기본입니다.

## 개념

![Chinchilla curves: loss vs compute at various N/D ratios](../assets/scaling-laws.svg)

### 호프먼 법칙

칠라 논문에서 손실은 다음과 같습니다.

```math
L(N, D) = \frac{A}{N^\alpha} + \frac{B}{D^\beta} + E
```

- $N$= 매개 변수 (부착되지 않은)
- $D$= 훈련 토큰
- $\alpha \approx 0.34$$\beta \approx 0.28$(거론 대칭)
- $E \approx 1.69$, 감소할 수 없는 손실 천장
- $A \approx 406$$B \approx 411$- 그래

두 용어는 서로 상거래 할 수 있습니다.$N$고정된 계산 ($C = 6ND$) 를 해결하고:

```math
\begin{aligned}
N_{\text{opt}} &\approx 0.6 \times (C/6)^{0.5} \\
D_{\text{opt}} &\approx 0.6 \times (C/6)^{0.5} \\
D_{\text{opt}} / N_{\text{opt}} &\approx 20
\end{aligned}
```

계산 최적: 매개 변수 20개의 토큰

### 왜 너무 훈련해야지

칠라-오피털은 훈련에 대한 손실을 최소화합니다. 하지만 훈련 비용은 한 번 지불하지만, 추론 비용은 영원히 지불됩니다.

한 달에 1조 개의 토큰을 서비스하는 채팅 로봇에 있어서 추론은 전체 비용을 지배합니다. 라마의 접근 방식은: 더 작은, 더 긴 기차를 열립니다. 8B에서 15T 토큰은 추론에 의해 깊이 최적화됩니다.

- 소비자 GPU에 맞습니다.
- 지연도는 70B의 분자입니다.
- 대부분의 작업에 있어서 질은 충분히 가깝습니다.

DeepMind의 2024 논문 ("오버 트레이닝은 새로운 최적") 은 이것을 공식화했다. 추론 지배적인 작업 부하에 대한 올바른 비율은 서비스 부피에 따라 매개 변수에 100500 토큰에 가깝습니다.

### 출현과 부드러움

주장: 특정 능력 (수학자, 다단계 추론, 사슬의 추론) 은 어느 정도 갑자기 "어래"됩니다.

샤이퍼等人 (2023) 는 이것이 측정 유물이라고 주장하였다: 신흥 매트릭은 원활한 곡선을 보여주는 원활한 점수를 (정확 일치, 문턱에서 정확성) 사용한다.

2026년 합의는: 지속적인 손실을 통한 예측은 신뢰할 수 있습니다. 벤치마크 점프는 종종 점수있는 유물입니다. 지속적인 측정에 따라 예산을 계획하십시오.

### 2026년 사진

확장 법칙은 여전히 유효하지만:

| Factor | Changed how |
|--------|-------------|
| Data quality | Curating "good" tokens (Phi-style) shifts curves by >2× effective compute |
| MoE | Total params decouple from active FLOPs; scaling laws per-active-FLOP |
| Post-training | Some capabilities (instruction following, code) shift with SFT+RLHF more than pretraining |
| Multimodality | Image + text tokens scale together; separate curves per modality |
| Synthetic data | Models generate training data; effective compute can compound |

Muon 최적화 (Kimi Moonlight, 2024) 는 일치된 데이터에서 AdamW에 대한 ~2x 효과적인 계산 이득을 보여주었습니다. 2026 훈련 경기는 기본적으로 Muon을 사용합니다. 스케일 법칙의 절대적 상수, 모양이 아닌 변경합니다.

```figure
scaling-laws
```

## 건설 해

보시다시피`code/main.py`우리는 칠라 손실 방정식을 구현하고 계산 최적의 해결$(N, D)$여러 계산 예산의 각각에

### 단계 1: 치라 손실

```python
def chinchilla_loss(N, D, A=406.4, B=410.7, alpha=0.34, beta=0.28, E=1.69):
    return A / N ** alpha + B / D ** beta + E
```

줄거리 $L$$(N, D)$고정된$C = 6ND$최소한의 것을 찾아라

### 단계 2: 컴퓨팅 최적의 경계

`1e17` `1e25`FLOPs, 찾아$(N, D)$$6ND = C$비율을 확인하세요$D/N \approx 20$- 그래

### 3단계: 과도한 훈련 비용

10 × 더 작은 모델을 훈련하기 위해 지불하는 추가 손실을 계산하십시오. 최적의 N의 10/10, 최적의 D의 10 ×.

### 4단계: 실제 모델과 비교

알 수 있는 `(N, D)`GPT-3, Chinchilla, Llama 3 8B, DeepSeek- V3 (활성 패람) 의 부쌍을 비교하고 예측된 손실과 보고된 손실을 비교하십시오.

## 사용 하 고

당신은 직접 한계 모델을 훈련시킬 가능성이 낮지만, 확장 법칙은

1. **Whether your fine-tune has enough data.**작업에 대한 데이터가 기본 모델의 매개 변수 20개 이하에 있다면, 어떤 손실 바닥에서 포화기를 기대하십시오.
2. **Whether to pick a bigger base model.**만약 여러분이 모든 예산을 추론에 쓰면, 더 작고 더 길게 훈련된 모델을 선호하세요.
3. **Where the returns diminish.**1000x 칠라 최적의 경우, 로그 손실 변화는 소음으로 변합니다.

**The research trajectory in 2026:**

- **Data-constrained regime.**웹은 고품질 토큰의 제한된 숫자를 가지고 있습니다. 필터링 후 510조 영어). 국경 사전 훈련이 이 천장에 가까워지고 있습니다. 합성 데이터, 다국어, 다모달 및 RLHF 스케일 정밀 조정은 다음 레버입니다.
- **Compute-multiplier tricks.**미온 최적화, MoE, 더 나은 데이터 커레이션
- **Scaling laws for RL.**초기 증거는 RL 샘플에서 권력 법칙을 암시하지만 훈련 전보다 매우 다른 표본이 있습니다.

## 선박

보시다시피`outputs/skill-training-budget-estimator.md`- 기술 선택`(N, D, hours, GPU)`새로운 교육 연주를 위해 계산 예산, 배포 제한 및 목표 손실을 고려하십시오.

## 운동

1. **Easy.**달아`code/main.py`칠라 최적의 인쇄$(N, D)$컴퓨터 예산에 대한`1e20``1e22``1e24`실제 모델 테이블과 비교해 보세요.
2. **Medium.**호프먼의 손실-함수-컴퓨터 곡선을 구현합니다.`log10(C)`컴퓨터 최적의 경계선에 대해 알아내면 법이 언제 필요한지$>10^{28}$다음 0.1의 크로스 엔트로피 감소에 대한 FLOPs
3. **Hard.**동일한 데이터 세트에 훈련된 5 개의 작은 모델 (100K에서 10M 파라미) 에 대한 자신의 확장 법칙을 적용하십시오. 추정$\alpha$그리고$E$- 당신의 표본이 출판된 것과 얼마나 잘 일치하는가?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Parameters (N) | "Model size" | Non-embedding weight count; determines capacity. |
| Tokens (D) | "Training data" | Number of training tokens seen; determines how well the parameters get used. |
| Compute (C) | "FLOPs spent" | Approximately `6 × N × D` for a standard transformer. |
| Chinchilla-optimal | "D/N ≈ 20" | Ratio that minimizes loss per FLOP of pretraining. |
| Over-training | "Past Chinchilla" | Spend extra training FLOPs to save inference FLOPs; D/N >> 20. |
| Irreducible loss | "The floor" | The $E$ term in the scaling law; the entropy of the data itself. |
| Emergent capability | "Sudden jumps at scale" | Often a scorer artifact; continuous loss is smooth. |
| Effective compute | "Training-efficiency multiplier" | Better data / optimizer / architecture multiplies how far a FLOP goes. |

## 더 많은 읽기

- [Kaplan et al. (2020). Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) 첫 번째 확장 법률 논문;
- [Hoffmann et al. (2022). Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556)  
- [Schaeffer et al. (2023). Are Emergent Abilities of Large Language Models a Mirage?](https://arxiv.org/abs/2304.15004) 측정 유물로서의 등장
- [Sardana, Frankle (2024). Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws](https://arxiv.org/abs/2401.00448) 왜 라마의 과도한 훈련이 그 업무에 적합할까요?
- [Jordan et al. (2024). Muon: An optimizer for hidden layers in neural networks](https://kellerjordan.github.io/posts/muon/) 2x 계산 곱셈
