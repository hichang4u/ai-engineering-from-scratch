# LLM의 편견과 대표적 피해

> 갈레고스, 로시, 바로, 탄지, 김, 데르논코르트, 유, 장, 아흐메드 (컴퓨터 언어학 2024, arXiv:2309.00770). 기초 2024 조사에서 표현적 해를 (유형, 삭제) 를 배분적 해 (부정적 자원 분포) 에서 구별하고 평가 매트릭을 임베디션 기반, 확률 기반 또는 생성 텍스트 기반으로 분류합니다. 2024~2025 경험적: An et al. (PNAS 넥서스, 2025년 3월) GPT-3.5 터보, GPT-4o, Gemini 1.5 플래시, 클로드 3.5 소넷, Llama 3-70B에서 자동화된 취업수준 20개 직업의 레지뷰 평가에 걸쳐 성 x 인종 편향을 측정합니다. 와인아이덴티티 (COLM 2025, arXiv:2508.07111) 는 부지런성 기반의 공정성 평가에 대해 교차 정체성을 도입한다. Yu & Ananiadou 2025은 MLP 계층에서 성신경을 식별합니다. Ahsan & Wallace 2025는 임상 인종 편향을 드러내기 위해 SAEs를 사용합니다. 2024 (UniBias) 는 주의력 헤드를 조작하여 디비아징을 합니다. 메타 비평 (arXiv:2508.11067): 10년 동안의 문학은 비례적으로 양성 편향에 초점을 맞추고 있습니다.

**Type:** Build
**Languages:** Python (stdlib, toy embedding-based bias probe)
**Prerequisites:** Phase 05 (word embeddings), Phase 18 · 01 (instruction following)
**Time:** ~60 minutes

## 학습 목표

- 대표적 대 할당적 피해를 정의하고 LLM 배포에서 각각의 한 예를 제시하십시오.
- 2024 년 갤레고스 및 동료에서 평가-메트릭 세 가지 범주를 명명하고 각 범주의 한 메트릭을 설명하십시오.
- 인터섹션성 및 왜 WinoIdentity의 불확실성 기반의 공정성 측정이 단일축 편향 평가의 격차를 해결하는지 설명하십시오.
- 편향에 대한 두 가지 기계적 해석성 접근방식을 설명하십시오 (성신경, SAE 특징, 주의력 머리의 조작).

## 문제

이전 수업은 의도적인 피해 (Jailbreaks, Scheming) 와 안전 관리에 관한 내용을 다루었다. 편견은 의도 없이 데이터 배포 훈련, 신속한 프레임링, 축적된 디자인 선택에서 발생하는 피해이다. 이를 측정하고 줄이는 것은 적대적 강도와 구별되는 방법론적 과제이다.

## 개념

### 대표적 대 할당적

- **Representational harm.**고정관념, 삭제, 굴욕적인 묘사. 간호사를 여성으로만 묘사하는 LLM는 대표적인 피해를 야기합니다.
- **Allocational harm.**불균형적인 결과물. 흑인 지원자의 서사진을 체계적으로 낮은 점수를 받는 LLM는 할당적 피해를 초래합니다.

이 모델은 동일하지 않습니다. 모델은 "대표적 편향" (다양한 묘사들을 생산) 을 할 수 있지만 "분배적 편향" (불평등적인 추천을 만들 수 있습니다). 평가들은 둘 다 측정해야합니다.

### 평가-메트릭 세 가지 분류 (Gallegos et al. 2024)

- **Embedding-based.**WEAT 스타일의 테스트: RLHF 이전 임베디션에 대한 테스트. 정체성 용어와 속성 용어 사이의 통계적 연관성을 측정합니다. 제한: 행동보다는 표현을 측정합니다.
- **Probability-based.**고정관념을 확인하는 성형과 고정관념을 위반하는 성형의 로그 확률. 디코더 측 측량. 행동 편향을 포착합니다.
- **Generated-text-based.**생성된 텍스트에 대한 하류 작업 측정. 자기소개서 점수, 추천 작성, 대화. 가장 생태적으로 유효한; 복제하기 어려운.

### 횡단성

"성"에 대한 편견 평가는 (성, 인종) 쌍에만 불타는 편견을 놓치고 있습니다. 2025년 연구결과에 따르면 GPT-4o는 흑인 여성에게 흑인 남성과 백인 여성보다 더 많은 점수를 얻는 재개정에서 처벌을 가집니다. 단일축 평가에서는 이것을 포착할 수 없습니다.

와인 아이덴티티 (COLM 2025) 는 불확실성 기반의 교차 공정성을 도입한다. 교차 정체성 들 사이에서 결과에 대한 모델의 불확실성이 다르는지 측정한다. 점 예측뿐만 아니라. 이것은 모델이 그룹 간 동일하게 잘못된 경우를 잡지만 일부에게는 더 불확실한 경우를 파악합니다. 이는 하류 배분 행동을 생성합니다.

### 기계적 접근법

2024~2025년 해석가능성 작업은 기계적 개입에 편향을 열어줍니다.

- **Gender neurons (Yu & Ananiadou 2025).**특정 MLP 신경 세포는 성별별별 행동과 상관관계를 맺고 있습니다. 이러한 신경 세포를 제거하면 성별 격차 측정값이 제한된 능력 비용으로 줄어들게 됩니다.
- **Clinical racial bias via SAEs (Ahsan & Wallace 2025).**스파스 오토코더 기능은 내부 표현을 해석 가능한 차원으로 분해합니다. 인종 관련 특징을 식별하고 억제 할 수 있습니다.
- **UniBias (Zhou et al. 2024).**초점 디비아징을 위한 주의력 헤드 조작. 특정 헤드들은 정체성 클래스의 감수성을 증폭시키며, 이러한 헤드들을 초점화하거나 재중화하면 정렬 없이 편향을 줄인다.

### 메타 비평

10 년 간 문학 검토 (arXiv:2508.11067, 2025) 는 이 분야가 양성 편향에 비례적으로 초점을 맞추고 있다고 발견합니다. 다른 축은 장애, 종교, 이주 상태, 다국어 정체성  훨씬 덜 관심을 받고 있습니다. 메타 비평은 소외계층을 무시함으로써 좁은 집중이 해칠 수 있다고 주장합니다.

### 이 부분은 18단계에 맞게

20-21 과목은 편견과 공정성을 공식적으로 다루고 있습니다. 22 과목은 개인 정보 보호에 관한 것입니다. 23 과목은 워터마크를 다루고 있습니다. 이것은 이전 사기/안전 계층을 보완하는 사용자-손해 계층입니다.

```figure
an-bias-two-harms
```

## 사용 하 고

`code/main.py`장난감 임베디션 기반 편향 탐사기를 구축합니다. 간단한 동시 임베디션에서 정체성 용어와 속성 용어의 사이의 WEAT 스타일의 거리를 측정합니다. 편향을 주입하여 메트릭 화재를 관찰 할 수 있습니다. 간단한 디비아징 작업을 적용하여 부분 복구 관측 할 수 있습니다.

## 선박

이 교훈은`outputs/skill-bias-eval.md`. 모델 카드나 공정성 주장을 고려하면, 세 가지 측정 범주 (인베딩, 확률, 생성된 텍스트), 인터섹션성 커버리지 및 모든 디비시징 개입의 메커니즘을 통한 평가에 감사한다.

## 운동

1. 달아`code/main.py`.WET 방식의 편향 점수를 디비아징 단계 전과 이후에 보고하고 메트릭이 0으로 떨어지지 않는 이유를 설명합니다.

2. 검사를 교차 테스트로 확장: (성, 인종) x (직업, 가족)

3. An et al. 2025 (PNAS Nexus) 를 읽어 보세요. 단일축 성평가가 놓칠 것이라고 보고된 두 개의 교차 효과를 확인하세요.

4. Yu & Ananiadou 2025년 성신경을 식별합니다. "이 신경 세포가 성 편향을 일으킨다"와 "이 신경 세포가 성 편향과 상관관계를 맺고 있다"는 것을 구별하는 거짓 실험을 스케치합니다.

5. 메타 비평은 이 분야가 바이너리 성에 너무 좁게 초점을 맞추고 있다고 주장합니다. 미흡한 축을 선택하고 그 대상에 대한 표현적 피해 측정 프로토콜을 설명합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Representational harm | "stereotypes / erasure" | Biased portrayal of a group |
| Allocational harm | "unequal decisions" | Biased material outcome for a group |
| WEAT | "the embedding test" | Word Embedding Association Test; co-occurrence-based bias probe |
| Intersectionality | "combined identity effects" | Bias that emerges at the intersection of multiple identity axes |
| Gender neurons | "MLP bias neurons" | Specific neurons whose activations correlate with gender-specific behaviour |
| SAE feature | "interpretable dimension" | Sparse-autoencoder-identified feature; useful for mechanistic bias analysis |
| UniBias | "attention-head debiasing" | Zero-shot debiasing by reweighting attention heads |

## 더 많은 읽기

- [Gallegos et al. — Bias and Fairness in LLMs: A Survey (arXiv:2309.00770, Computational Linguistics 2024)](https://arxiv.org/abs/2309.00770) 성서적 조사
- [An et al. — Intersectional resume-evaluation bias (PNAS Nexus, March 2025)](https://academic.oup.com/pnasnexus/article/4/3/pgaf089/8111343) 5가지 모델의 교차 연구
- [WinoIdentity — uncertainty-based intersectional fairness (arXiv:2508.07111, COLM 2025)](https://arxiv.org/abs/2508.07111) 새로운 기준
- [UniBias — attention-head manipulation (Zhou et al. 2024, ACL)](https://arxiv.org/abs/2405.20612) 0 발작 빗발
