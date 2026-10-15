# LLM의 차별화된 개인 정보 보호

> DP-SGD는 표준  소음 주입 gradient 업데이트가 공식적인 (epsilon, delta) 보증을 제공합니다. 컴퓨팅, 메모리 및 유틸리티의 전반적인 비용은 상당한데, 매개 변수 효율적인 DP 정렬 (LoRA + DP-SGD) 는 일반적인 2025 구성 (ACM 2025) 이다. 두 개의 증거체체 중 긴장: 카나리 기반의 회원성 추론 (Duan et al., 2024) 은 언어 모델에 대한 제한적인 성공을보고하고; 훈련 데이터 추출 (Carlini et al., 2021; Nasr et al., 2025) 은 실질적인 말 그대로의 기억을 회복합니다. 결의 (arXiv:2503.06808, 2025년 3월): 격차는 측정된  삽입된 카나리와 "최고 추출 가능한" 데이터에 있습니다. 새로운 카나리 설계는 그림자 모델 없이 손실 기반 MIA를 가능하게 하고 현실적인 DP 보증으로 실제 데이터에 훈련된 LLM의 첫 비 비관적인 DP 감사를 제공합니다. 대안: PMixED (arXiv:2403.15638)  다음 토큰 배포에 대한 전문가들의 혼합을 통해 추론 시점에 개인 예측; DP 합성 데이터 생성 (Google Research 2024). 신흥 공격: LLM 피드백을 통해 차별화된 개인 정보 보호 반전

**Type:** Build
**Languages:** Python (stdlib, DP-SGD noise-injection and ε-δ accountant demonstration)
**Prerequisites:** Phase 01 · 09 (information theory), Phase 10 · 01 (large-model training)
**Time:** ~60 minutes

## 학습 목표

- (epsilon, delta) -차별 개인정보 보호를 정의하고 DP-SGD 레시피를 명시합니다.
- 2024~2025의 긴장감을 설명하자: 카나리 MIA와 훈련 데이터 추출은 다른 그림을 보여준다.
- PMixED를 설명하고 추론 시간 개인 예측이 DP 훈련의 대안이 되는 이유를 설명하십시오.
- LLM 피드백 공격으로 차별화된 개인 정보 보호 반전을 설명하십시오.

## 문제

LLM는 기억한다. 카를리니 등 2021 년은 생산 언어 모델이 요구에 따라 말 그대로 훈련 텍스트를 재생산하는 것을 보여주었습니다. DP는 공식적인 방어입니다: 출력이 단일 훈련 예제에 대해 무관성이있는 것으로 입증되도록 훈련합니다. 2024-2025 년의 증거는 DP-SGD가 필요하지만 배치 된 ε 값은 위협 모델과 일치하지 않을 수 있습니다.

## 개념

### (ε, δ) -차별적인 개인 정보 보호

무작위 알고리즘$M$ $(\varepsilon, \delta)$-DP는 하나의 예와 어떤 사건에서 다른 두 개의 데이터 집합에 대해$S$이 부분의 본문은

```math
P(M(D) \in S) \le e^{\varepsilon} \cdot P(M(D') \in S) + \delta.
```

해석: 출력 분포는 충분히 가깝다 ( ε로 매개 변수) 어떤 개인의 기여를 신뢰성 있게 추론할 수 없으므로, 확률 δ를 제외하고는.

### DP-SGD

2016년. Abadi et al.
1. 작은 패치를 샘플링해 보세요.
2. 예를 들어 그라디언트를 계산한다.
3. 각 예제 매개 변수를 C 문턱으로 클립합니다.
4. 절단된 기하급수들을 합쳐서 Gaussian 소음을 std로 추가합니다$\sigma \cdot C$- 그래
5. 한 금액을 사용하여 매개 변수를 업데이트하십시오.

개인정보비용은 회계사가 추적한다 (현재 회계사, 레니 DP 회계사). LLM 문헌에서 보고된 ε 값은 위협 모델, 데이터 민감성 및 유틸리티 목표에 따라 크게 다릅니다. 보편적으로 "안전" 기본 ε가 없습니다. 출판된 예제들은 LLM 교육 설정에서 대략 ε ≈ 110에 달하지만, 이것들은 예시적인 예제입니다. 낮은 ε는 일반적으로 더 많은 소음을 필요로 하며, 사용량 손실을 증가시킬 수 있습니다.

### 로라 + DP-SGD

국경 모델의 DP-SGD 전체는 금지적입니다. LoRA (Hu et al. 2022) 는 작은 어댑터에 그레디언트 업데이트를 제한하여, 예제별 그레디언트 저장량을 감소시킵니다. LoRA + DP-SGD는 일반적인 2025 구성입니다. DP 보증은 어댑터에 적용됩니다. 기본 모델은 고정되어 있습니다.

### 2024~2025년 긴장

두 가지 증거:

- **Canary MIA (Duan et al. 2024).**훈련 데이터에 고유한 카나리어를 삽입하고, 회원성 인퍼런스 공격자가 그들을 식별할 수 있는지 측정합니다. 언어 모델에 대한 성공이 제한되어 있습니다. MIA는 어렵다는 것을 제안합니다.
- **Training-data extraction (Carlini 2021, Nasr et al. 2025).**모델에 사전을 붙여서 설명하고, 훈련에서 문자 그대로 텍스트를 복구하는지 측정합니다. 상당한 메모리를 보고합니다. MIA는 관련 의미에서 간단하다고 제안합니다.

2025년 3월 결의 (arXiv:2503.06808): 두 가지 측정은 서로 다른 것입니다. MIA는 삽입 된 카나리들에 대해 "e의 예제 e가 D입니까?"라고 묻습니다. 추출은 "D에서 무엇을 복구 할 수 있습니까?"라고 묻습니다. "최고 추출 가능한" 예제는 개인 정보 보호에 중요합니다. 카나리들은 추출 가능하도록 최적화되지 않았기 때문에 이를 보고하지 않습니다.

새로운 카나리 디자인, 그림자 모델 없이 손실 기반 MIA, 현실적인 DP 보증으로 실제 데이터에 대한 LLM의 첫 비 비관적인 DP 감사.

### DP 훈련의 대안

- **PMixED (arXiv:2403.15638).**추론 시 개인 예측. 다음 토큰 분포에 대한 전문가들의 혼합; 각 전문가는 훈련 데이터의 조각을 본다. 집합은 DP에 노이즈를 추가합니다. DP 훈련은 완전히 피합니다.
- **DP synthetic data generation (Google Research 2024).**LORA-Fine-Tune DP-SGD, 샘플 합성 데이터, 합성 데이터에 대한 하류 분류자를 훈련합니다.

두 가지 모두 다른 위협 모델의 비용으로 완전한 DP 훈련의 유용성 비용을 회피합니다.

### LLM 피드백을 통해 개인 정보 보호의 차별적 반전

2025년 공격이 다가오고 있습니다. DP 훈련된 모델의 신뢰 점수를 오라클로 사용하여 개인을 다시 식별합니다. 출력들이 누출되지 않더라도 신뢰 분포가 가능합니다.

방어: 비밀의 노출을 하지 말거나 노출 전에 줄여서/분량화하지 말아라. 이것은 (ε, δ) -DP 훈련 이상의 추가 요구사항이다.

### 이 부분은 18단계에 맞게

20-21 강의는 편견/공평성입니다. 22 강의는 개인 정보 보호입니다. 23 강의는 워터마크를 통해 출처입니다. 27 강의는 규제 데이터 출처 계층을 다루고 있습니다.

```figure
an-dp-clip-noise
```

## 사용 하 고

`code/main.py`장난감 바이너리 분류 데이터 세트에 DP-SGD를 시뮬레이션 합니다. 당신은 소음 곱수 σ와 절단 규범 C를 스캔하고 (ε, δ) 예산과 정확성 비용을 추적 할 수 있습니다. "캐너 공격"은 독특한 훈련 예제를 삽입하고 로그 손실 테스트가 DP 전과 후에 그것을 감지 할 수 있는지 측정합니다.

## 선박

이 교훈은`outputs/skill-dp-audit.md`. 언어 모델 배포에 대한 DP 주장을 고려하면 (ε, δ) 값, 사용된 회계자, MIA 평가 프로토콜 및 신뢰 노출 벡터가 평가되었는지 여부를 감사합니다.

## 운동

1. 달아`code/main.py`- 扫$\sigma \in \lbrace 0.5, 1.0, 2.0 \rbrace$(ε, δ) 정확성 타협을 보고하고, 유틸리티가 붕괴되는 지점을 확인한다.

2. 카나리 삽입 및 로그 손실 테스트를 실시합니다. DP-SGD 전과 후 탐지 속도를 측정합니다.$\sigma = 1.0$- 그래

3. 교육 데이터 추출에 관한 Nasr et al. 2025을 읽어보십시오. 왜 추출 성공은 적정 ε에서 붕괴되지 않는가? 이것은 MIA-as-evaluation에 대해 무엇을 의미합니까?

4. 추론 시점에 완전히 작동하는 PMixED (arXiv:2403.15638) 를 사용하여 배포를 설계하십시오. PMixED가 DP-SGD가하지 않는 위협 모델은 무엇입니까?

5. LLM 피드백 공격을 통해 DP 반전 도표를 작성하고 신뢰 점수 유출을 제한하고 배포 비용을 추정하는 대책을 설계하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DP | "(ε, δ)-differential privacy" | Formal privacy: output distribution close under neighbouring-dataset change |
| DP-SGD | "noise-injected SGD" | Gradient clipping + Gaussian noise addition; standard DP training |
| LoRA + DP-SGD | "efficient private fine-tune" | DP-SGD on low-rank adapters; standard 2025 configuration |
| MIA | "membership inference" | Attack that determines whether an example was in training data |
| Canary | "inserted watermark example" | Unique training example used to measure DP leakage |
| PMixED | "private inference mixture" | Inference-time DP via mixture-of-experts on next-token distributions |
| DP Reversal | "confidence leakage attack" | Attack that uses a model's confidence as an oracle for re-identification |

## 더 많은 읽기

- [Abadi et al. — DP-SGD (arXiv:1607.00133)](https://arxiv.org/abs/1607.00133) 표준 DP 훈련 알고리즘
- [Carlini et al. — Extracting Training Data (arXiv:2012.07805)](https://arxiv.org/abs/2012.07805) 가톨릭 추출 서류
- [Duan et al. — Canary MIA on LLMs (arXiv:2402.07841, 2024)](https://arxiv.org/abs/2402.07841) 제한된 성공 MIA
- [Kowalczyk et al. — Auditing DP for LLMs (arXiv:2503.06808, March 2025)](https://arxiv.org/abs/2503.06808) 긴장 해소
- [PMixED (arXiv:2403.15638)](https://arxiv.org/abs/2403.15638) 추론 시간 개인 예측
