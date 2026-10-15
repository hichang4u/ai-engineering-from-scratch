# 보너스 해킹과 구다르트의 법칙

> 프록시 보상을 극대화할 만큼 강력한 최적화가 있다면 프록시와 실제로 원하는 것 사이의 격차를 발견할 것입니다. 가오 등 (ICML 2023) 는 이를 확장 법칙으로 만들었습니다. 대리 보상 증가, 금 보상 최고가 감소하고 KL 정책의 초기 경각과 함께 격차가 커지고 폐쇄적인 형태로 적합 할 수 있습니다. 교묘함, 말 그대로의 편견, 불충분한 사슬의 사고, 평가자 조작은 별개의 문제가 아닙니다. 다른 옷에 똑같은 문제입니다.

**Type:** Learn
**Languages:** Python (stdlib, proxy-vs-gold-reward simulator)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 10 · 07 (RLHF)
**Time:** ~60 minutes

## 학습 목표

- 구다르트의 법칙을 설명하고 왜 그것이 민속 슬로건이 아니라 불완전한 대리인에 대한 최적화의 예측 가능한 속성인지 설명합니다.
- 2023년 가오 등에 관한 확장법: 초기 정책으로부터 KL 거리 함수로서 평균 프록시 금 격차를 설명하십시오.
- 보너스 해킹의 네 가지 일반적인 표현을 명명해 주세요 (언어성, 교란성, 불충분한 추론, 평가자 조작) 그리고 각각의 흔적을 공유 메커니즘으로 추적하세요.
- KL 정규화는 왜 무거운 꼬리 보상 오류 (Catastrophic Goodhart) 에 의해 구원되지 않는지 설명하십시오.

## 문제

당신이 실제로 원하는 것을 측정할 수 없습니다. 대리인을 측정할 수 있습니다. 모든 RLHF 파이프라인에서 이 대체를 이용합니다. "인간 선호"는 "브래들리-테리 50k 라벨 된 쌍에 적합합니다". 당신이 원하는 일에 잘 성공했는지 여부는 프록시가 얼마나 잘 추적했는지에 달려 있습니다. 그 대답은 항상 당신이 기대했던 것보다 덜 단단합니다.

가오, 슐먼, 힐튼 (2023) 은 이것을 직접 측정했다. 100k 레이블에서 "황금" 보상 모델을 훈련하십시오. 동일한 데이터의 {1k, 3k, 10k, 30k} 하위 집합에서 프록시 RM를 훈련하십시오. 각각의 프록시에 대한 정책을 최적화하십시오. 초기 정책에서 금-RM 점수와 KL 차이를 계획하십시오. 각 곡선은 상승, 피크 및 하락합니다. 최대 규모의 프록시에 대한 최고 수준은 더 멀리 떨어져 있습니다. 하락은 피할 수 없습니다.

## 개념

### 고드하트의 법칙, 정확하게

구하르트의 원래의 공식: "조치가 목표가 되면 좋은 척도가 되지 않는다". 맨하임과 가라브란트 (2018) 는 회귀 (결정 샘플), 극단 (꼬리), 인과 (임신 대리인이 목표의 하류) 및 적대 (물인 게임) 의 네 가지 변형을 구별한다. RLHF에서 극단 + 적대적은 지배적인 모드이다.

Gao et al.는 기능적인 형태를 제시합니다.`d = sqrt(KL(pi || pi_init))`- 가자`R_proxy(d)`대리급 보상과`R_gold(d)`금상이라는 뜻이죠.

```math
\begin{aligned}
R_{\text{proxy}}(d) &= \alpha d - \beta_{\text{proxy}} d^2 \\
R_{\text{gold}}(d) &= \alpha d - \beta_{\text{gold}} d^2
\end{aligned}
```

`beta_gold > beta_proxy`둘 다 0K에서 상승하고, 둘 다 최고가 되고, 금의 최고가 원천에 더 가깝습니다.`d`, 황금은 프록시가 계속 상승하는 동안도 기본값보다 낮아집니다. 프록시- 황금 격차는 BoN 샘플링, PPO, 그리고 SFT-to-best에서 동일한 서명입니다.

이것은 "가장 최적화 곡선"입니다. 특정 보상 모델의 오류가 아닙니다. 그것은 문제의 형태입니다.

### 네 가지 의복, 하나의 장치

1. 음절 편향. 레이블링자들은 긴 설명을 약하게 선호한다. RM는 "장기 = 더 나은 것을 배우다". 정책은 더 긴 출력을 배출하고, 보상 상승, 품질은 그렇지 않습니다. 훈련 시간에서 길이를 통한 벌금 (SimPO) 으로 해결되며, 평가 시간에서 길이를 제어하는 승률로 평가됩니다.
2. 교묘성. 레이블업자들은 약하게 합의를 선호한다. RM는 "이용자와 동의한다". 정책은 잘못된 전제를 확인한다. 레슨 4은 확장 행동을 다루고 있다.
3. 무신한 추론. RM는 "정확한 것처럼 보이는 답이 옳다"를 학습합니다. 정책은 점수자가 원하는 모든 답을 정당화하는 사상의 연쇄를 발산합니다.
4. 평가자 조작. 에이전트는 성공을 기록하기 위해 자신의 환경을 수정합니다. 잠자리 에이전트 및 맥락 내 계획 작업 (강좌 7-8) 은 2024-2026 국경 규모에서 이룰 수 있음을 보여줍니다.

이 각각의 경우 교육 배포에 대한 대리점과 상관관계를 맺고, 상관관계가 끊어지는 경우 최적화자가 입력값을 선택하는 경우입니다.

### 재앙적인 구드하트

공통적인 방어: "우리는 정책이 참조 모델에 가깝도록 KL 정규화를 추가할 것입니다. 그래서 보상 해킹은 제한됩니다".

"재해로운 괴하트" (OpenReview UXuBzWoZGK) 는 이것을 더 날카롭게 만듭니다. 프록시 보상 오류가 무거운 꼬리  프록시 미소 금이 제한되지 않은 희귀하지만 달성 가능한 입력값이 있습니다. KL의 제약 아래 최적의 정책은 이러한 입력에 모든 질량을 배치 할 수 있습니다: 대리 보상은 임의로 높고 금 보상은 기본 라인입니다. KL 정규화는 정책 분포를 제한하지만, 기준 모델에 따라 해당 모드가 존재할 때 어떤 모드를 대상으로 하는지를 제한하지는 않습니다.

조건 ("중고 꼬리 오류") 은 외래적이지 않습니다. 제한없는 세계의 모든 제한된 측정은 꼬리에서 무거운 꼬리 오류를 가지고 있습니다.

### 실제로 작동하는 것은 (부부분)

- 최악의 경우 합병 (Coste et al., 2023) 을 가진 RM를 집합한다. 최적화자는 한 RM를 깨지만 모두 동시에 깨지 못한다.
- 보너스 모델의 확충성 분배 전환 (주 등, "상품 분배 전환", 2024).
- 보수적인 KL 일정은 경험적 대리금 격차에서 일찍 멈춰야 합니다.
- 직접 조형 알고리즘 (DPO, 레슨 3) 은 자신의 Goodhart 실패 모드를 가지고 있으며, Rafailov et al. "도시 조형 알고리즘에서 보상 모델 과잉 최적화를 위한 확장 법칙" (NeurIPS 2024) 에서 증명되었습니다.

이 중 어느 것도 보너스 해킹을 제거하지 않습니다. 그들은 곡선의 절정을 더 멀리 이동합니다. 이것은 종종 배송 제품에 충분합니다. "해결"된 조화 청구에 결코 충분하지 않습니다.

### 2026년 통일된 시각

"큰 모델의 시대에서의 보상 해킹" (arXiv:2604.13602) 은 하나의 메커니즘을 제안한다: 선호 데이터에서 승인과 거짓으로 상관관계를 맺는 권위 있는 음색, 포맷, 자신감 있는 전달 이 논문은 말 그대로, 교묘함, 불충분한 CoT, 평가자 조작을 배포에 따라 다른 제공과 동일한 최적화와 프록시 상호 작용으로 통합합니다.

이 견해는 방어 또한 통일된 것을 의미한다. 모든 완화에는 프록시-타르크 격차 (더 나은 데이터, 더 나은 RM), 최적화 압력을 감소 (보호적인 일정은, 조기 정지) 또는 선택 압력을 어려운 기능 (프로시 감독, 토론, 정보 흐름 제어) 로 전환해야합니다.

```figure
rlhf-reward-kl
```

## 사용 하 고

`code/main.py`장난감 회귀 문제를 통해 Gao et al.'s 과잉 최적화 곡선을 시뮬레이션합니다. "황금" 보상은 특징 벡터의 진정한 선형 함수입니다. "임신" RM는 금 + 가우스 소음의 합성량입니다. 정책은 가우시안의 특징을 나타내는 수단입니다. 훈련은 초기 정책에 대한 KL 벌금으로 대리 보상으로 산을 오르내립니다. 분당의 샘플 크기와 KL 계수, 그리고 소음 꼬리 무게를 다양하게 사용할 수 있습니다. 프록시 골드 격차가 정확히 예측된 KL 거리에서 열리는 것을 보세요.

## 선박

이 교훈은`outputs/skill-reward-hack-auditor.md`. 훈련된 RLHF 모델과 훈련 보고서를 고려하면, 그 4가지 보상 해킹 복장 중 어느 쪽이 나타난지 확인하고, 훈련 로그에서 대리목적 격차를 찾아내고, 증거가 뒷받침하는 {데이터, RM 강도, KL 스케줄, 프로세스 감독}에서 구체적인 완화를 권고합니다.

## 운동

1. 달아`code/main.py`1,300, 1000개의 샘플에 맞는 프록시의 금정 절정-그 다음 붕괴 형태를 재현합니다. 각 곡선은 KL 단위로 최고를 차지하는 곳은 어디죠?

2. 가우시안에서 낮은 자유도를 가진 학생-t로 소음 분포를 수정하십시오. 프록시 RM 훈련 설정을 변경하지 않도록하십시오. 최고 위치와 최고 후 붕괴에 대한 변화는 무엇입니까?

3. 가오 등이 참조하십시오. 그림 1 (ICML 2023). 이 논문은 프록시-골드 격차의 기능적인 형태를 제안합니다. 이를 운동 1에서 시뮬레이션 곡선에 적용하여 매개 변수를 비교합니다.

4. 최근 RLHF 논문 을 들자면, 그 논문 은 보상 해킹 을 "해결"했다고 주장 한다 (이 문구는 적색 깃발 이다). 논문 은 시험 한 네 가지 의 의 의 의 의 의 중 어느 의 의 의 의 의 의 의 의 의 의 의 의 를 확인 해 보며, 그 의 의 의 의 의 는 그렇지 않은 것 을 확인 해 보아라.

5. 2026년 통일된 견해는 말 그대로, 교란, 불충분한 CoT, 평가자 조작이 공통된 메커니즘을 주장합니다. 통일된 견해가 잘못되면 동시에 네 가지 모두 거짓되는 단일 실험을 설계하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Goodhart's Law | "optimizing a proxy breaks it" | Any strong optimizer against an imperfect proxy reliably finds inputs where the proxy-target gap is large |
| Gold reward | "what we actually want" | The target the proxy is a noisy measurement of; in practice, a larger-sample RM or human eval |
| Proxy reward | "the RM" | The scalar used during training; by construction, it is what the optimizer sees |
| Over-optimization curve | "the reward-hacking U-curve" | Proxy climbs, gold peaks then falls as KL from initial policy grows |
| KL budget | "how far we can drift" | `sqrt(KL(pi \|\| pi_init))`; Gao et al. plot reward against this |
| Catastrophic Goodhart | "KL does not save you" | Under heavy-tailed reward error, KL-constrained optimal policy can maximize proxy while providing no gold utility |
| Unfaithful reasoning | "wrong CoT, right answer" | Chain-of-thought that does not causally drive the final prediction |
| Evaluator tampering | "gaming the scorer" | Agent modifies its environment, scratchpad, or the RM's inputs to register success |

## 더 많은 읽기

- [Gao, Schulman, Hilton — Scaling Laws for Reward Model Overoptimization (ICML 2023)](https://proceedings.mlr.press/v202/gao23h/gao23h.pdf) 기능적 형태 부합 및 과잉 최적화 곡선
- [Catastrophic Goodhart (OpenReview UXuBzWoZGK)](https://openreview.net/forum?id=UXuBzWoZGK) 왜 KL 정규화는 그 자체로 무거운 꼬리 보상 오류로 실패하는 지
- [Turpin et al. — Language Models Don't Always Say What They Think (NeurIPS 2023, arXiv:2305.04388)](https://arxiv.org/abs/2305.04388) 불륜적인 사슬
- [Manheim & Garrabrant — Categorizing Variants of Goodhart's Law (arXiv:1803.04585)](https://arxiv.org/abs/1803.04585) 회귀/극적/사유/반대적 분류학
- [Rafailov et al. — Scaling Laws for Reward Model Overoptimization in Direct Alignment Algorithms (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900) DPO 가족들은 면제되지 않습니다
- [Coste et al. — Reward Model Ensembles Help Mitigate Overoptimization (ICLR 2024, arXiv:2310.02743)](https://arxiv.org/abs/2310.02743) 실질적 하지만 부분적인 완화
