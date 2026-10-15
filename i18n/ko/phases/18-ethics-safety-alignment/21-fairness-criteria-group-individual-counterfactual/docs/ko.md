# 공정성 기준  그룹, 개인, 반사

> 3개 가족은 공정성 문학을 구성합니다. 집단 공정성: 인구 통계적 평등, 동등한 확률, 조건적 사용 정확성 평등 개인 공정성 (Dwork et al. 2012): 비슷한 개인이 비슷한 결정을 받습니다. 결정 지도에 리프스키츠 조건. 사실상의 공평성 (Kusner et al. 2017): 민감한 속성이 반사적으로 변경될 때 결정이 개인에게 공정하다면 2024 이론적 결과 (NeurIPS 2024): CF와 정확성 사이의 본질적인 타협이 있습니다. 모델-아고스틱 방법은 최적하지만 불공평한 예측자를 제한된 정확성 손실로 CF로 변환합니다. 백트랙링 반사 (arXiv:2401.13935, 2024년 1월): 법적 보호 속성에 대한 개입이 필요하지 않는 새로운 패러다임. 철학적 화해 (ICLR Blogposts 2024): 인과 그래프로, 특정 집단 공정성 조치는 반사적인 공정성을 초래합니다.

**Type:** Learn
**Languages:** Python (stdlib, three-criteria comparison)
**Prerequisites:** Phase 18 · 20 (bias), Phase 02 (classical ML)
**Time:** ~60 minutes

## 학습 목표

- 그룹 공정성 기준 (민주적 평형, 동등한 확률, 조건적 사용 정확성 평등) 세 가지와 불가능성 결과 하나를 설명하십시오.
- Dwork et al. 2012 Lipschitz 공식을 통해 개인 공정성을 설명하십시오.
- 사실적 공평성과 그 원리 그래프 의존성을 설명해 주십시오.
- 후퇴적 역설과 왜 그들은 보호 속성 개입 문제를 회피하는지를 설명하십시오.

## 문제

20학습은 편향을 측정하는 것에 관한 것이었다. 21학습은 측정이 봉사해야 할 공정성 표준을 정의하는 것에 관한 것이었다. 세 가지 가족은 구조적으로 다른 표준을 제공합니다. 모델은 그룹 공정과 개인 불공정, 반사적 공정 및 그룹 불공정일 수 있습니다. 표준을 선택하는 것은 정책 결정입니다. 어떤 표준도 보편적으로 최적의 것은 없습니다.

## 개념

### 집단 공평성

- **Demographic parity.**P  = 1  A = a = P  = 1  A = a' 모든 그룹에 대해
- **Equalized odds.**P  Y=1  Y=y, A=a = P  Y=1  Y*y=y, A=a') 그룹마다 TPR와 FPR가 같죠.
- **Conditional use accuracy equality.**P (Y*y=y, A=a) = P (Y*y, Y=y, A=a) ' 그룹마다 동일한 예측 값입니다.

불가능 (Chouldechova, Kleinberg-Mullainathan-Raghavan 2017): 이 세 가지 기준률이 불평등한 경우에 동시에 만족할 수 없습니다.

### 개인적 공정성

Dwork et al. 2012. 결정 지도 f는 작업 특정 유사성 메트릭 d에 대해 개별적으로 공정합니다. 만약 f(x) - f(x') <= L * d(x, x') 일부 리프시츠 상수 L. 유사한 개인은 유사한 결정을합니다.

정의가 필요 d. 통계적인 것이 아니라 정책적인 질문입니다.

### 사실상의 공평성

Kusner et al. 2017. i의 민감한 속성이 반사적으로 변경될 때, 인구의 인과적 모델에 따라 결정은 변하지 않는 경우 결정은 개인에게 반사적으로 공정합니다.

사유적 DAG가 필요합니다. DAG는 모델링 선택입니다. 반사적 공정성은 DAG만큼만 정당합니다.

### CF와 정확성 대의 거래소

NeurIPS 2024 이론: 반사 사실적 공정성과 예측 정확성 사이에 본질적인 타협이 있습니다. 모델-아고스틱 방법은 최적의 하지만 불공정한 예측자를 제한된 정확성 비용으로 CF로 변환 할 수 있습니다. 정확성 비용은 최적의 불공정한 예측자의 민감성 속성 계수의 크기에 달려 있습니다.

### 반사적 인 반사적 인

arXiv:2401.13935 (2024년 1월). 전통적인 반사물들은 민감한 속성에 대한 개입을 요구합니다.

반사적 인 결과들은 그 속성에 개입하는 대신, 그 개인의 실제 특징의 조합이 반사적 인 결과를 가져온다고 물어보십시오. 이것은 법적 반발을 회피합니다.

### 철학적 화해

ICLR 블로그 포스트 2024. 인과적 그래프를 손에 들고, 특정 집단 공정성 조치가 만족시키는 것은 반사적 공정성을 초래합니다. 세 가지 가족은 정형이 아닙니다. 그들은 동일한 근본적인 인과적 구조의 다른 측면입니다.

이것은 불가능성 이론을 해결하지는 않습니다 (불균형 기본 비율은 여전히 동시 집단 공정성을 방해합니다). 그러나 "그룹"과 "개인 / 반사적" 사이의 명백한 반대가 원인 모델에 대해 명시적이지 않은 부분의 유물입니다.

### 이 부분은 18단계에 맞게

20강은 편견 측정이다. 21강은 공정성 정의이다. 22강은 사생활 보호 (차별적 사생활 보호) 이다. 23강은 워터마크이다. 이 것은 배정과 인접한 교훈이 있으며 속임수와 인접한 교훈 7-11을 보완한다.

```figure
an-fairness-trilemma
```

## 사용 하 고

`code/main.py`민감한 속성과 불평등한 기본률을 가진 장난감 바이너리 분류 데이터 세트를 구축합니다. 간단한 분류기에서 인구 통계 평정, 동등한 확률 및 조건적 사용 정확성 평정 등을 계산합니다. 세 가지 매트릭이 일치하지 않는 것을 관찰합니다. 인구 통계 평정에 대한 재중치를 적용하고 다른 두 가지에 대한 비용을 관찰합니다.

## 선박

이 교훈은`outputs/skill-fairness-criterion.md`. 공정성 주장이나 정책에 따라, 어떤 기준이 주장되고 있는지, 모델이 주장되는 불평등 기본률에 따라 나머지 기준을 충족시킬 수 있는지, 그리고 주장이 어떤 원인 DAG에 의존하는지 확인합니다.

## 운동

1. 달아`code/main.py`. 기본 데이터에 대한 세 가지 그룹 매트릭을 보고하고, 인구평등을 대상으로 한 재중심 및 재보고를 적용한다.

2. 비 민감한 특징에 대해 L2를 사용하여 Dwork et al. 2012 개인 공정성 측정치를 구현하십시오. ثابت L=1로 얼마나 많은 쌍이 리프스키츠를 위반하는지 보고하십시오.

3. 2017 년 Kusner et al.를 읽어보십시오. 재개점 점수를 위해 간단한 두 가지 특징의 인과 DAG를 구축하고, 그것은 의미하는 반사적 공정성 조건을 식별하십시오.

4. 2024년 후퇴적 역설 논문에서는 보호된 속성에 대한 개입을 피하고 있습니다. 법적 준수에 있어서 중요한 시나리오를 설명합니다.

5. ICLR 2024 조화 는 집단 및 반사적 공정성 이 같은 구조의 측면이라고 주장 한다.`code/main.py`그리고 그 둘을 동등하게 만드는 인과적 가정을 명시합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Demographic parity | "equal rates" | P(Y=1 | A=a) equal across groups |
| Equalized odds | "equal TPR/FPR" | Equal true-positive and false-positive rates across groups |
| Conditional use accuracy | "equal PPV/NPV" | Equal predictive values across groups |
| Individual fairness | "Lipschitz condition" | Similar individuals get similar decisions |
| Counterfactual fairness | "causal alteration invariance" | Decision unchanged under counterfactual attribute alteration |
| Backtracking counterfactual | "explain via actuals" | Counterfactual reasoned backward from outcome, not forward from attribute |
| Impossibility theorem | "the three conflict" | Chouldechova / KMR 2017: group criteria mutually exclusive under unequal base rates |

## 더 많은 읽기

- [Dwork et al. — Fairness through Awareness (arXiv:1104.3913)](https://arxiv.org/abs/1104.3913) 개인적 공정성
- [Kusner, Loftus, Russell, Silva — Counterfactual Fairness (arXiv:1703.06856)](https://arxiv.org/abs/1703.06856) 사실상의 공평성
- [Chouldechova — Fair prediction with disparate impact (arXiv:1703.00056)](https://arxiv.org/abs/1703.00056)불가능한 일
- [Backtracking Counterfactuals (arXiv:2401.13935)](https://arxiv.org/abs/2401.13935) 보호 속성 개입의 새로운 패러다임
