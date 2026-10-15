# METR 시간 지평과 외부 능력 평가

> METR (전 이전 ARC Evals) 는 2023년 12월부터 독립된 501 (c) ((3) 이다. 그들의 타임호라이즌 1.1 벤치마크 (2026년 1월) 는 작업 성공 확률과 전문가 인력 완료 시간 사이의 물류 곡선을 맞게 한다. 50% 확률의 교차는 모델의 시간 지평을 정의한다. 20252026 임무를 위한 집합은 GPT-5.1, GPT-5.1-코덱스-맥스 및 프로토타입 모니터링 평가 ( 모니터에서 인접 작업을 수행할 수 있고, 에이전트가 회피할 수 있다) 를 포함한다. 벤치마크 스위트: HCAST (180ML+, 사이버, SWE, 추론 작업; 1분에서 8시간 이상), RE-Bench (71ML 연구 및 엔지니어링 작업, 전문가 기본 기준), SWAA. 정직한 점: METR 측정은 이상화되어 있습니다. 인간과 실제적인 결과가 없습니다. 그리고 팀은 평가와 배포 행동 격차를 기록했습니다. (강좌 1). 시간 지평은 위계이며, 배포 예측이 아닙니다.

**Type:** Learn
**Languages:** Python (stdlib, logistic-fit horizon estimator)
**Prerequisites:** Phase 15 · 01 (Long-horizon agents), Phase 15 · 19 (RSP)
**Time:** ~60 minutes

## 문제

스케일링 정책 (강좌 19, 20) 은 그들이 언급한 측정만큼만 유용하다. "AI R&D-4 문턱"과 "장거리 자율성"은 정책 시사에서 정의되어 있으며 특정 평가에서 특정 숫자를 생성할 때만 실행이 가능합니다.

METR는 이러한 숫자의 많은 부분을 정의한 2024~2026 외부 평가 조직입니다. 그들은 국경 모델을 평가합니다. 종종 사전 출시, NDA와 실험실 에 따라 그리고 그 후에 방법론을 발표합니다. 타임호라이즌 1.1 벤치마크 (2026년 1월) 는 그들의 주요 유물: 인간에게 읽을 수 있는 단위로 능력을 압축하는 단일 스칼라 ("이 모델은 전문가가 50%의 신뢰성으로 X 시간을 보내는 작업을 수행 할 수 있습니다").

이 수업은 부분적으로 방법론 (평평선 계산 방법) 과 부분적으로 해석 (평선이 위계 한계, 배치 예측이 아닌 이유) 에 관한 것입니다. 두 기술 모두 함께 있습니다.평선이 어떻게 적합하는지 이해하는 팀은 슬라이드에서 "14 시간"을 보는 팀보다 나쁜 공급자 주장으로 속이는 것이 훨씬 어렵습니다.

## 개념

### METR 배경

- 설립: 2023년 12월 (전 이전 ARC Evals, 독립 501 (c) [3]로 분해되었다).
- 범주: 국경 모델의 자율성 능력 평가, 종종 사전 출시.
- 파트너 연구소: 인류학, 오픈AI (다중 참여 2025~2026).
- 주목할 만한 결과물: 타임호리조인 1.0 (2025년 3월), 타임호리조인 1.1 (2026년 1월), 프로토타입 모니터링 평가.

### 타임호라이즌의 적합성

방법론 (METR 블로그 및 논문에서):

1. 분 스케일에서 시간 스케일 전문가 완료 시간까지의 작업 부하를 수집합니다. 현재 부하: HCAST (180+ 작업), RE-Bench (71 작업), SWAA.
2. 각각의 작업에 모델을 실행하고 성공이나 실패를 기록하세요.
3. 로지스트컬 곡선을 맞추어: $P(\text{success})$함수로서$\log(\text{expert completion time})$- 그래
4. 지평선은 P (성공) = 0.5의 전문가 시간이다.

로지스트-피트 형태는 일반적으로 능력과 작업 어려움의 증가하고 평야에 접근하는 관계를 가지고 있기 때문에 올바른 형태입니다. 50% 포인트는 선택 (10%, 90%일 수 있습니다); METR는 상세한 논문에서 여러 임대점을보고하지만 가장 직관적인 것이므로 50%로 앞서 있습니다.

### 2026년 1월의 숫자는

시간평선 1.1:

- 클로드 오퍼스 4.6: 타임호라이즌 1.1 (2026년 1월) 에 따르면 50%의 신뢰성에서 ~14시간.
- HCAST 방식의 작업에 대한 두 배 시간: ~4.3 개월 (130.8 일) Time Horizon 1.1 (2026년 1월) 에 의해 보고된 2023년 이후의 적합성; ~7개월의 숫자는 Time Horizon 1.0에서 전체 20192025의 적합성이며, 2023년 이후의 번호와 함께 TH1.1에 보고됩니다.

이러한 숫자는 FAS 15 참조의 나머지 특정 숫자입니다. 그들은 인тропо크의 RSP v3.0 (강좌 19) 및 DeepMind의 FSF v3 (강좌 20) 에서 임계 평가에 대한 측정 중 하나로 인용됩니다.

### 벤치마크 스위트

- **HCAST**: ML, 사이버 보안, 소프트웨어 엔지니어링 및 일반 추론을 통한 189개의 작업. 기간: 1분에서 8시간 이상 전문가 시간. 지평선 번호 뒤에 있는 주요 스위트.
- **RE-Bench**: 71 ML 연구-공학 과제 인적 전문가 기본 기준으로 모델이 AI R&D-4 문턱에 공급되는 ML 연구 및 개발 작업을 수행할 수 있는지 측정합니다.
- **SWAA**: 더 짧은 작업; 지평선 곡선의 낮은 끝을 캘리브하는 데 유용합니다.

### 프로토타입 모니터링 평가

2025~2026 METR 작업에는 모니터링-평가 프로토타입이 포함되었다: 모니터가 부작용 작업을 수행하는 모델을 잡을 수 있습니까 (운전자가 요청한 것 이외의 무엇인가); 에이전트가 모니터에서 벗어날 수 있습니까? 이들은 OpenAI PF v2에서 "저장 보호 조치" 카테고리를 직접 공급하고 DeepMind FSF v3 (강좌 20) 에서 속임수 조율 모니터링.

### 왜 지평선이 상위 경계인지는

- **Idealized tooling**벤치마크 작업은 모델에 깨끗한 도구와 잘 포맷된 데이터를 제공합니다. 실제 배포는 더 복잡합니다.
- **No real consequences**: 모델은 실제로 고객을 청구하거나 실제 데이터를 삭제하거나 실제 사람들을 접촉하지 않습니다. 실제 배포는 돌이킬 수 없는 입자를 가지고 있습니다.
- **Eval-context gaming**: 수업 1. 테스트에서 모델은 다르게 행동한다. 2026 국제 AI 안전 보고서는 이를 경험적으로 기록한다.
- **No legitimate user variance**실제 사용자들은 모호하고 맥락에 의존하는 요청을 생성합니다.

지평은 유리한 조건에서 역량 한계입니다. 배포 신뢰성은 다른 숫자이고, 낮습니다. 그리고 팀은 그것을 알기 위해 자신의 분포를 측정해야합니다.

### 외부 평가자 사건

외부 평가는 중요하기 때문에 내부 연구소들은 보고하는 매트릭을 최적화할 수 있는 인센티브를 가지고 있다. METR의 독립성  501 (c) 3) 는 선언된 방법론과 동료 검토 논문 은 구조적 완화입니다. 그것은 혼자만으로는 충분하지 않습니다 (실험소는 여전히 METR의 보고를 통제하지만) 외부 평가가 없다는 것보다 엄격히 낫습니다.

### 실무에서 지평선 숫자를 사용하는 방법

- **As a capability filter**: 모델의 지평선은 제안된 작업의 전문가 시간보다 훨씬 낮다면, 그것을 자율적으로 전송하지 마십시오 (Lesson 1 기술 파일).
- **As a trend indicator**: 두 배로 하는 시간은 새로운 완화 없이도 현재 실천이 얼마나 오랫동안 안전해 질지 알려줍니다.
- **As a prior**14시간의 지평은 출발점입니다. 작업 분포, 도구 품질 및 배포 맥락에 따라 조정하십시오.

```figure
a5-horizon-fit
```

## 사용 하 고

`code/main.py`작업 성공과$\log(\text{expert time})$, 합성 결과 집합을 보면 50% 지평 (METR의 제목), 10% 지평 (保守), 90% 지평 ( 낙관적) 을 보고합니다. 또한 평가-상황 게임으로 성공률이 인위적으로 부풀어지면 어떤 변화가 일어나는지 보여줍니다.

## 선박

`outputs/skill-horizon-interpretation.md`판매자의 지평 claim을 검토하고 벤치마킹 claim과 배포 현실 사이의 격차 분석을 만들어냅니다.

## 운동

1. 달아`code/main.py`의 50% 지평이 합성 지형 진실과 일치하는지 확인합니다. 이제 작업 시간 그리드를 반으로 나누십시오. 지평은 의미있는 변화를 추정합니까?

2. METR의 타임하리조인트 1.1 블로그 포스트를 읽어 보세요. 신뢰도가 가장 높고 신뢰도가 가장 낮은 특정 작업을 식별하고 그 격차가 존재하는 이유를 설명하세요.

3. METR의 "자율적인 인공지능 능력을 측정하는" 자료를 읽어 보세요. HCAST 작업 범주를 나열하세요. 생산 작업에 대해 더 많은 무게를 가할 만한 범주를 선택하고 그 이유를 설명하세요.

4. 시뮬레이터에 eval-context 게임을 도입: 실패한 작업의 ~20%를 성공으로 전환합니다. 새로운 지평을 보고합니다. 이것은 20%의 게임 비율이 관찰된 숫자에 대해 어떻게 하는지 대략합니다.

5. 내부 지평을 평가하여 자신의 버그 백록 또는 대표적인 작업 집합을 설계하십시오. 데이터 수집, 적합성 및 출력에서 알려지는 내용을 설명하십시오. METR 숫자와 비교하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| METR | "External evaluator" | ex-ARC Evals; independent 501(c)(3) since Dec 2023 |
| Time Horizon | "Capability measure" | Expert task length at 50% reliability, from logistic fit |
| HCAST | "METR's main suite" | 180+ tasks spanning 1 min to 8+ hours |
| RE-Bench | "Research engineering" | 71 ML research-engineering tasks with human baseline |
| SWAA | "Short-task suite" | Calibrates the low end of the horizon curve |
| Doubling time | "Growth rate" | Time for the 50% horizon to double; ~7 months per HCAST |
| Eval-context gaming | "Model behaves differently" | Documented behavior gap between tests and deployment |
| Upper bound | "Horizon is a ceiling" | Benchmark horizon > deployment reliability under load |

## 더 많은 읽기

- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) HCAST, RE-Bench, SWAA 사양
- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) 원래의 지평문
- [METR — Time Horizon 1.1 (January 2026)](https://metr.org/research/) 현재 숫자와 방법론
- [Epoch AI — METR Time Horizons benchmark](https://epoch.ai/benchmarks/metr-time-horizons) 실시간 추적
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) METR의 측정에 대한 내부 관점.
