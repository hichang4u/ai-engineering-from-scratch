# WMDP 및 이중 사용 능력 평가

> 리 등, "WMDP 벤치마크: 비학습으로 악의적 사용을 측정하고 감소시키는 것" (ICML 2024, arXiv:2403.03218). 생물 안전 (1,520) , 사이버 보안 (2,225), 화학 (412) 에 관한 4157개의 다중 선택 질문 질문들은 "유랑 영역"에서 작동합니다  가까운 지식의 능력, 다 전문가 검토와 ITAR/EAR 법적 준수에 의해 필터링됩니다. 두 가지 목적: 두 가지 사용 능력의 대리평가 및 학습을 중단하는 기준 (행동 RMU 방법은 WMDP 성능을 감소시키면서 일반적인 능력을 유지한다). 2024-2025 현장 내레이션: 초기 오픈AI/안트로피크 2024 평가에서 인터넷 검색에 대한 "미조한 승격"이 보고되었다. 2025년 4월까지, 오픈AI의 준비 프레임워크 v2는 모델들이 "새로운 생물학적 위협을 창조하는 데 의미있는 도움을 줄 수 있는 위안"이라고 말했다.

**Type:** Learn
**Languages:** Python (stdlib, WMDP-shaped uplift evaluation harness)
**Prerequisites:** Phase 18 · 16 (red-team tooling), Phase 14 (agent engineering)
**Time:** ~60 minutes

## 학습 목표

- WMDP의 세 개의 도메인, 질문 수와 "유랑 구역" 필터 기준을 설명하십시오.
- RMU와 WMDP가 평가와 비학습 기준이 되는 이유를 설명해 주십시오.
- 2024~2025년 상승 내레이션을 설명하자: "미연 상승" -> "가장 앞선" -> "ASL-3를 배제할 수 없을 만큼"
- 초보자 상대적인 승격과 전문가 절대적 능력의 차이를 구분한다.

## 문제

이중 사용 능력은 모든 실험실의 국경 안전 프레임워크 (강좌 18) 의 측정 문제입니다. 질문: 모델 X는 생물학, 화학, 사이버학술에 대량 피해를 줄 수 있는 초보자의 능력을 실질적으로 향상시키는가? 직접 측정 (모델을 실제로 피해를 발생하도록 요청) 은 불법적이고 윤리적이지 않습니다. 프록시 측정은 모델이 거부할 수 없는 기준 (공정한 능력 수치를 생성) 을 필요로 하지만 그 질문들은 스스로 해로운 출판물이 아니다.

## 개념

### "유랑 구역"

직접 합성 처방이 되지 않고도 해로운 과정에 대한 지식이 필요한 질문. "어떤 반응 물질이 [출간된 경로]의 4 단계를 촉발하는 것?"가 아니라 "어떻게 [위험한 화합물을] 만들 수 있을까?"는 질문. 각 질문들은 여러 분야 전문가들에 의해 검토되었으며, ITAR/EAR 수출 통제 준수에 대한 필터링이 되었습니다.

총 4,157개의 질문:
- 생물 안전성: 1,520
- 사이버 보안: 2,225
- 화학: 412

다중 선택 형식: 모델은 아무 도움도 받지 않고 응답하고, 해로운 행동을 일으키지 않고도 능력을 측정할 수 있습니다.

### RMU  비학습에 대한 대표적 잘못된 방향

동반 학습 해독 방법: LLaMa-2-7B에 적용된 WMDP 점수를 거의 무작위로 줄이고 MMLU 및 기타 일반 능력 기준을 몇 점 이내에 유지합니다. 출판된 방법은 다음 모든 바이오케미컬 사이버 학습 해독 논문에서 배움의 기본 라인입니다.

### 2024~2025년의 신나는 이야기

세 단계:

1. **2024 "mild uplift."**초기 OpenAI 및 인류 준비/RSP 평가에서는 바이오 인접 작업에 시도하는 초보자들에 대한 인터넷 검색에 비해 작은 장점을보고했습니다. 공공 프레임링: 국경 모델은 도움이되지만 구글보다 크게 더 없습니다.

2. **April 2025 "on the cusp."**OpenAI의 준비 프레임워크 v2는 모델들을 "새로운 사람들이 알려진 생물학적 위협을 창조하는 데 의미있는 도움을 주려고 한다"라고 보고했습니다.

3. **Anthropic's 2025 bioweapon-acquisition trial.**초보 참가자 들 이 참여 한 통제 된 연구, 인수 단계 과제 에서 상대적 성공 을 측정 한 것. 2.53x 상승 을 보고 한 것. ASL-3 (강습 18) 을 배제 하기 위해 충분하지 않습니다.

### 초보자 상대와 전문가 절대자

중요한 차이점은

- **Novice-relative uplift.**이 모델 은 비 전문가 에게 얼마나 많은 도움 이 됩니까? 곱셈. 처음 이기는 사람 들 이 거의 모르는 것 이 많기 때문 에 상대적 이점 은 높습니다.
- **Expert-absolute capability.**이 모델은 최대한의 노력으로 얼마나 많은 정보를 생산할 수 있을까요? 전문가들은 초보자보다 더 많은 정보를 추출할 수 있습니다. 절대적인 천장은 높습니다.

안전 사례 (강좌 18) 는 두 가지 모두에 초점을 맞추고 있습니다. "모델은 초보자에게 실행할 만큼의 승강력을 줄 수 없습니다".

### 측정 함정이

WMDP는 배포 측정이 아닌 능력 대리입니다. WMDP에서 높은 점수를 얻은 모델은 다음에 따라 실무에서 초보자가 활용할 수 있거나 사용할 수 없을 수도 있습니다.
- 발현 저항 (안전 필터를 떨어뜨리지 않고 기능을 꺼내는 것이 얼마나 어려운가)
- 잠잠한 지식 (물 실험실 기술력이 필요한 능력, 정보가 아닌)
- 실행 장벽 (수매, 장비)

앤트로피의 2025 바이오무기 인수 시험은 WMDP 스타일의 기능 위에 초보 발동 계층을 추가합니다: 실제 작업 성공을 측정합니다. 다중 선택 능력은 아닙니다.

### 이 부분은 18단계에 맞게

12-16 수업은 모델 출력에서 공격 및 방어 도구입니다. 17 수업은 이중 사용 능력 계층입니다. 국경 안전 프레임워크 (18 수업) 에서 평가하는 측정입니다. 30 수업은 현재 2026 사이버 / 바이오 / 화학 / 핵 승강 증거로 활을 닫습니다.

```figure
al-wmdp-yellow-zone
```

## 사용 하 고

`code/main.py`WMDP 모양의 평가용 장치를 구축합니다. 카테고리 내장된 질문에서 모형 모델을 테스트합니다. 각 도메인당 점수가 보고됩니다. 간단한 학습하지 않는 개입 (토메인 특정 표현) 은 점수를 줄이는데, 일반적인 능력에 대한 타협을 측정 할 수 있습니다.

## 선박

이 교훈은`outputs/skill-wmdp-eval.md`이중 사용능력 주장 ("우리 모델은 생물무기에 의미 있는 도움을 주지 않는다") 를 고려하면, 어떤 기준이 실행되었는지, 어떤 거부 경로가 평가에 사용되었는지 (자료 완성과 정책 목표) 그리고 초보자 발굴 연구들이 다중 선택 결과를 보완하는지 여부를 감사합니다.

## 운동

1. 달아`code/main.py`. 장난감 배움 단계 전과 후 각 영역에 대한 정확성을 보고하고, 일반 능력의 타협을 설명한다.

2. 장난감 WMDP를 네 번째 영역 (예를 들어 방사선학) 으로 확대하십시오. 노란색 영역에서 두 가지 일러스트적인 질문 유형을 지정하십시오. 그러한 질문을 만드는 것이 MMLU 모양의 질문을 추가하는 것보다 왜 더 어려운지 설명하십시오.

3. WMDP 2024 섹션 5 (RMU 방법론) 을 읽어 보세요. 보다 간단한 학습 해독 접근법을 스케치하세요 (예를 들어, 도메인 콘텐츠를 위한 상위 k 신경 세포를 억제하세요) 그리고 예상되는 일반 능력 비용에 대해 설명하세요.

4. 애너트로피 2025의 바이오무기 인수 시험은 2.53배 상승률을 보고합니다. 이 숫자가 상승 (신생 샘플 크기와 작업 충실성) 과 하락 (발동 천장, 모델 안전 게팅) 으로 편향될 수있는 두 가지 방법을 설명하십시오.

5. WMDP 탈 학습을 통과하는 것 이상으로 ASL-3의 안전 사례가 요구되는 것을 설명하고 적어도 두 가지 보완적 발원 연구의 이름을 지정하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| WMDP | "the dual-use benchmark" | 4,157 MCQ questions across bio/cyber/chem in the yellow zone |
| Yellow zone | "enabling but not synthesis" | Proximate knowledge adjacent to harmful capability without being a synthesis recipe |
| RMU | "the unlearning baseline" | Representation Misdirection for Unlearning; reduces WMDP scores, preserves general capability |
| Novice-relative uplift | "how much it helps non-experts" | Multiplicative advantage over status-quo internet search for a novice |
| Expert-absolute capability | "ceiling for experts" | Maximum information extractable from the model by a motivated expert |
| Acquisition-phase task | "steps before synthesis" | Procurement, equipment, permits — the earliest parts of a harm pathway |
| ITAR/EAR | "export-control compliance" | Legal frameworks that constrain publishing certain enabling knowledge |

## 더 많은 읽기

- [Li et al. — The WMDP Benchmark (arXiv:2403.03218, ICML 2024)](https://arxiv.org/abs/2403.03218) 기준표 및 RMU 종이에
- [OpenAI — Preparedness Framework v2 (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) "바닥에서"
- [Anthropic — Responsible Scaling Policy v3.0 (February 2026)](https://www.anthropic.com/responsible-scaling-policy) ASL-3 생물계약 및 인수 실험 결과
- [DeepMind — Frontier Safety Framework v3.0 (September 2025)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) 생체 승강 CCL
