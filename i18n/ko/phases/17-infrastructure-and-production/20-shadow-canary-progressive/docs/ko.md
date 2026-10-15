# 쉐이도 트래픽, 카나리 발급 및 LLM의 점진적 배포

> LLM의 배포는 소프트웨어 배포의 가장 어려운 부분을 결합합니다. 단위 테스트가 없습니다. 순서는 (1) 그림자 모드  후보 모델에 복제된 프로드 요청, 로그, 사용자 영향 0과 비교; 명백한 분배 문제를 잡지만 품질 보증이 아닙니다; (2) 카나리  프로그레시브 트래픽 전환 10% → 25% → 50% → 75% → 100% 각 단계에 게이트와 함께; 추적 지연률 percentiles, 비용 / 요청, 오류 / 거부율, 출력 길이의 분배, 사용자 피드백 비율; (3) 안정성이 확인 된 후 다른 대안을 A / B 테스트. 비결론은 GPU FP 비협동성 및 대량 크기의 변동으로 인해 동일한 입력으로 실행되는 라인에 대한 정확성 변수가 15%까지 감소할 수 없습니다. 비용은 변수이고, 일정하지 않습니다. 20% 더 좋은 모델은 전화당 3배 더 비싸다. 롤백 속도는 결정적입니다. 롤백이 재배치를 필요로 한다면 너무 느립니다. 정책은 구성/발표에 살고 있습니다. 모델은 등록에 붙여진 소화로 살고 있습니다. 롤백 = 핑 정책 + 리버트 임대 + 핑 오래된 모델은 초 안에 있습니다.

**Type:** Learn
**Languages:** Python (stdlib, toy canary-progression simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 21 (A/B Testing)
**Time:** ~60 minutes

## 학습 목표

- 그림자 모드 (허로 충격 비교), 카나리 (직동 교통의 진행) 및 A/B (안정 확정된 비교) 를 구분한다.
- LLM에 특화된 다섯 가지 카나리 메트릭을 나열하십시오 (연연, 비용/ 요청, 오류/ 거부, 출력 길이의 분포, 사용자 피드백).
- LLM의 결정적이지 않은 ( 최대 15%) 는 어떤 롤러웃에서 "స్థిరంగా"라는 것을 왜 변화시키는지를 설명하십시오.
- 몇 초 (정책 전환) 를 필요로 하는 역전 경로를 설계하고 몇 시간 (재배) 를 하지 않는다.

## 문제

새로운 모델을 배포하고 오프라인 평가에서 3%의 정확도가 증가하고, 생산에 다시 돌려놓습니다. 24시간 이내에 비용은 40% 증가하고, 사용자들의 엄지손가락이 8% 증가하고, 세 개의 고객 티켓은 "이상한 답변"을 보고합니다. 당신은 돌아갑니다. 재배치는 3시간 걸립니다. 주말은 망가졌습니다.

그 모든 부분은 피할 수 있었다. 그림자 모드는 어떤 사용자가 그것을 보지 전에 40%의 비용 절감을 잡았을 것입니다. 리 손가락이 내려가면 10%에 멈췄을 것입니다. 정책 플래그 롤백은 30 초를 걸렸습니다. 학문은 "오프라인 평가가 잘 보입니다"와 "실제 사용자는 행복합니다" 사이의 격차를 채우고 있습니다.

## 개념

### 그림자 모드

지원자는 생산과 동일한 요청을 받습니다. 출력들은 로그되어 사용자에게 반환되지 않습니다. 사용자 영향은 없습니다. 로그:

- 생산량 (생산에 대한 차이가)
- 토큰 수 (비용 델타)
- 지연성
- 거절과 오류

캡처: 비용의 부풀이, 길이 회귀, 명백한 거부 변경, 어려운 오류. 캡처: 품질의 델타 사용자는 인식 할 것입니다. 그림자는 질 테스트가 아니라 흡연 테스트입니다.

### 카나리 발급

통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로 이동하는 통로 이동하는 통로 이동은 통로 이동하는 통로 이동이 통로 이동하는 통로 이동하는 통로 이동이 통로 이동하는 통로 이동하는 통로로 이동하는 통로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로 이동하는 통로로로 이동하는 통로로 이동하는 통로로로 이동하는 통로로로 이동하는 통로로로 이동하는 통로로로 이동하는 통로로 이동하는 통로로로로 이동하는 통로로로로 이동하는 통로로로로 이동하는 통로 이동하는 통로로 이동하는 통로로로로 이동하는 통로로 이동하는 통로로 이동하는 통로로로 이동하는 통로로로로 이동하는 통로 이동하는 통로로 이동로 이동하는 통로로 이동

1. **Latency percentiles** P50, P95, P99. 침해: 카나리에는 P99> 1.5x의 기본 기준이 있습니다.
2. **Cost per request** 혼합된 $. 위반: 기본 기준보다 20% 이상.
3. **Error / refusal rate**5xx + 명시적 거부
4. **Output length distribution** 평균 + P99 위반: 분배 변화
5. **User-feedback rate**                                                                                                                                                                                                                                                              

### 비결론은 새로운 변동입니다

동일 입력값은 동일하지 않은 출력을 생성합니다.

- GPU FP 비협동성 (변동점 감소 순서는 배트마다 달라진다).
- 배트 크기의 변동 (배트 128 대 배트 16의 동일한 요청)
- 샘플링 (온도 > 0).

측정: 동일한 평가 세트에서 실행 중인 정확성 변수가 최대 15%입니다. 롤라웃에서 "స్థిరంగా"는 측정값이 예상되는 변수 내에서 있으며 기본 라인과 동일하지 않다는 것을 의미합니다. 잡음 바닥 위에 게이트를 설정하십시오.

### 비용은 변수입니다

20% 더 나은 모델은 전화당 3배 더 비싸다. 비용/ 요청은 다섯 개의 게이트 중 하나입니다. 단위 경제를 깨는 "더 나은" 모델을 배송하는 것은 반전 사례입니다.

### 롤백은 무기입니다

- 정책 플래그 (특수 플래그 시스템): 구성에서 반향 비율; 초.
- 모델 핑 (레지스트리 소화): 핑 모델은 자동으로 업그레이드되지 않습니다.
- 롤백 = 반전 플래그 + 이전으로 고정된 소화 설정.

만약 당신의 스택이 다시 롤백으로 배치되어야 한다면, 롤링 전에 그것을 수정하십시오.

### 도구

**Argo Rollouts**- **Flagger** Kubernetes 프로그레시브 배달 컨트롤러. 이스티오/링커드 중량 라우팅과 통합

**Istio weighted routing** 서비스 매시 차원의 교통 분할

**KServe / Seldon Core** 내장된 카나리 소재로 제공되는 모델

**Feature flags** 론칭더클리, 플래그스미스, 론칭 정책 수준 , 재배포가 없습니다.

### 매트릭스 순서

카나리 게이트는 교통량에 따라 5~15분마다 확인합니다. 10 req/min의 1%의 트래픽은 매 창당 50~150 데이터 포인트를 제공합니다.

### A/B 단계는 선택 사항입니다

새로운 모델이 분명하게 다른 경우 (다른 행동, 다른 비용 곡선, 다른 음색), A / B 테스트는 카나리 게이트가 지나면 50%에.

### 기억해야 할 숫자

- 카나리아의 진행률: 1% → 10% → 25% → 50% → 75% → 100%.
- 결정론적 제도가 없는 한계: 동일한 입력값에 대한 15%까지의 실행중 차이는
- 5가지 캐나리 메트릭: 지연, 비용, 오류/ 거부, 출력 길, 사용자 피드백.
- 비용 관문: 기본 기준보다 20% 이상은 침해입니다.
- 몇 시간보다는 초입니다.

```figure
i4-canary-ramp
```

## 사용 하 고

`code/main.py`롤러우트 중개는 롤러우트 중개를 시뮬레이션합니다.

## 선박

이 교훈은`outputs/skill-rollout-runbook.md`. 후보 모델, 기본 기준 및 위험 용납을 고려하면 shadow→canary→100% 계획을 설계합니다.

## 운동

1. 달아`code/main.py`25%의 비용 회귀를 주입해 보세요.
2. 새로운 모델은 오프라인에서 3%의 정확성 향상을 가지고 있지만 비용/ 요청은 +18%입니다.
3. 60 초 이내 의 롤백 을 설계 하고 필요한 인프라 를 나열 하십시오.
4. 비결론은 평가에서 ±7%를 나타냅니다. 캐나리 게이트를 설정해 놓습니다.
5. 그림자 모드는 카나리보다 40% 더 높은 비용으로 쏠 수 있습니다. 그림자에서 발사하는 경고 규칙을 적어 주세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Shadow mode | "duplicate to new" | Zero-impact send-to-candidate for logging |
| Canary | "progressive traffic" | Gradual user-exposed rollout with gates |
| Gates | "rollout checks" | Metric thresholds that block progression |
| Non-determinism | "LLM variance" | Irreducible run-to-run differences |
| Policy flag | "flag flip rollback" | Config-level rollback, seconds not hours |
| Model pin | "registry digest" | Immutable reference to a model version |
| Argo Rollouts | "K8s progressive" | Kubernetes-native canary/rollback controller |
| KServe | "inference K8s" | Model serving with canary primitives |
| Istio weighted | "mesh split" | Service-mesh traffic splitter |

## 더 많은 읽기

- [TianPan — Releasing AI Features Without Breaking Production](https://tianpan.co/blog/2026-04-09-llm-gradual-rollout-shadow-canary-ab-testing)
- [MarkTechPost — Safely Deploying ML Models](https://www.marktechpost.com/2026/03/21/safely-deploying-ml-models-to-production-four-controlled-strategies-a-b-canary-interleaved-shadow-testing/)
- [APXML — Advanced LLM Deployment Patterns](https://apxml.com/courses/mlops-for-large-models-llmops/chapter-4-llm-deployment-serving-optimization/advanced-llm-deployment-patterns)
- [Argo Rollouts docs](https://argo-rollouts.readthedocs.io/)
- [Flagger docs](https://docs.flagger.app/)
