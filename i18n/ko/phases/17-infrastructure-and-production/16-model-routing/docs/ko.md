# 비용 절감 원시로서 모델 라우팅

> 동적 브로커는 모든 요청 (task type, token length, embedding similarity, confidence) 을 평가하고 간단한 요청을 저렴한 모델로 전송하고 복잡한 질문을 경계 모델로 확장합니다. 모델 캐스케딩이라고도 합니다. 생산 사례 연구는 미국/영국/EU 배포에서 iso-quality에서 20%~60%의 비용 절감을 보여줍니다. 대량 SaaS에서 30%의 라우팅 효율성 향상은 6자릿수 연간 저축으로 변합니다. 2026년 맥락은 LLM 추론의 가격이 매년 ~ 10배 감소한$20/M to ~$2022년 말부터 2026년까지 0.40/M 대부분의 경우 하드웨어가 아닌 스택 (단계 17 · 04-09) 를 더 잘 서비스합니다. 라우팅은 가격 하락을 상품 회귀 없이 마진으로 변환하는 방법입니다. 실패 모드는 저렴한 모델의 추동입니다. 노선은 40%를 더 약한 모델로 밀어냅니다. 온라인 품질 측정에 의해 게이트 라이트, 오프라인 평가 세트뿐만 아니라.

**Type:** Learn
**Languages:** Python (stdlib, toy cascading router simulator)
**Prerequisites:** Phase 17 · 01 (Managed LLM Platforms), Phase 17 · 19 (AI Gateways)
**Time:** ~60 minutes

## 학습 목표

- 모델 캐스케딩을 설명하세요: 신뢰 검사를 통해 먼저 저렴하고 신뢰도가 낮으면 상승합니다.
- 네 개의 라우팅 신호를 나열하십시오 (사업 분류, 신속한 길이가, 알려진 하드 세트에 유사성을 함축하고, 첫 번째 통과로부터 자신감).
- 목표 라우팅 분할과 품질 손실 용납에서 예상된 혼합 비용을 계산한다.
- 유가형 모델의 크리프를 잡는 유동 모니터링 메트릭 (온라인 품질 게이트) 을 명명하세요.

## 문제

당신의 서비스는 GPT-5에 매달 8만 달러가 소요됩니다. 당신의 분석은 70%의 질문들이 간단합니다. "파리스에서 몇 시가 되나요?" "이 문장을 다시 표현하세요". 하이쿠 클래스 모델은 비용의 3%에 완벽하게 처리합니다. 30%는 GPT-5의 추론이 필요합니다.

70%를 저렴하고 30%를 비싼 것으로 운용하면, 같은 제품 품질에 대한 청구서는 65% 떨어집니다. 이것은 운용입니다.

## 개념

### 4개의 라우팅 신호

1. **Task classification**: 단순/복합/코데겐/수학/ 채팅. 규칙 기반 분류자, 작은 LLM (하이쿠 클래스 0.25 / M) 또는 라벨 버킷과 유사성을 내장할 수 있습니다. 출력: 라이트 = 저렴 / 균형 / 국경.

2. **Prompt length**: 4K 토큰의 명령은 종종 연동성을 위해 경계가 필요합니다. <500 토큰의 명령은 일반적으로 그렇지 않습니다.

3. **Embedding similarity to known-hard set**: 수요가 알려진 단단한 버킷에 가까운 경우 (코스인 > 0.88) 직으로 국경으로 이동합니다.

4. **Self-confidence from first-pass**: 값싸게 보내기; 모델의 로그 탐사 결과들이 신뢰도가 낮을 경우 OR 거부하거나 헤지링 언어를 출력하면, 국경에서 다시 시도합니다. P95 지연시간은 ~10%의 트래픽에 추가되지만 나머지 90%에 50%+를 절약합니다.

### 3가지 패턴

**Pre-route**(등급자 앞): ~ 5-10ms 지연이 추가되었습니다. 전체적으로 가장 빠른.

**Cascade**(저기, 낮은 신뢰성에서 상승): ~1.2x 중장연속 (저기 실행 + 확인), ~2x 상승.

**Ensemble route**(사본을 위한 값싼 과 국경의 병렬 실행, 보상 모델 선택): 최고 품질, 최고 비용; 비중적 A/B에만 사용.

### 시행

인공지능 게이트웨이 (단계 17 · 19) 는 라우팅을 노출합니다.`router`포트키는 경비 + 라우팅을 가지고 있습니다. 콩 AI 게이트웨이는 플러그인 기반 라우팅을 가지고 있습니다. 오픈루터 모델 시장은 추천 API를 노출합니다.

오픈소스: 루트LLM (LMSYS), 다이아몬드 (상용), 프롬프트 무일

### 2026년 가격 곡선

| Model class | Late 2022 | 2026 | Change |
|-------------|-----------|------|--------|
| GPT-4-level quality | ~$20/M | ~$0.40/M | 50x cheaper |
| Frontier (GPT-5, Claude 4) | — | ~$3-10/M | new tier |

대부분의 개선은 효율성을 서비스하는 것입니다. 17 단계 · 04-09에서 핵심 교훈은 공급자 측 비용 감소로 전환되었습니다. 라우팅은 모든 사용자가 저렴한 계층으로 이동하기를 기다리는 대신 앱 계층에서 이 이익을 캡처 할 수 있습니다.

### 파동은 진짜 위험입니다

로우터는 40%를 저렴한 모델로 보내죠. 6개월 동안 작업 분포가 바뀌죠 (이용자가 더 정교해지고 더 긴 질문을 합니다). 라우터는 라우터가 알아차리지 않습니다. 왜냐하면 그 분류자가 Q1 데이터에 훈련되었기 때문입니다. 품질은 조용히 떨어집니다. 아무도 충분히 고소하지 않습니다. 경쟁자 기준에서 당신이 패배했다고 알게됩니다.

온라인 품질 측정 기준으로 게이트 라이트:

- 이용자 이동통신
- 수험생의 시험에 대한 자동 LLM 판사는 (5%)
- 에스컬레이션 속도: 캐스카드가 상승하는 경우 30% 이상, 저렴한 모델은 과잉으로 이동합니다.
- 항로별 거부율

### 기억해야 할 숫자

- 2026 로팅 저축 iso-품질: 20-60% 사례 연구
- LLM 가격 하락 2022-2026: 연간 합액 ~ 10배
- GPT-4 레벨 2022년과 2026년: ~$20/M → ~$0.40/M
- 캐스카드 지연 효과: ~ 1.2x 중위, ~ 2x 상승 (~ 10% 트래픽).

```figure
model-cascade-router
```

## 사용 하 고

`code/main.py`혼합된 작업량에서 전 경로, 캐스카드 및 집합을 시뮬레이션합니다. 비용, 품질 손실 및 증가율을 혼합합니다.

## 선박

이 교훈은`outputs/skill-router-plan.md`. 작업량과 품질 예산에 감안하여, 라우팅 패턴과 신호를 선택합니다.

## 운동

1. 달아`code/main.py`어떤 정밀층에서 물결이 전선을 타는 걸까요?
2. 사용자 기반은 30% 기업 (복합 질의), 70% 무료 계층 (단순) 이다. 라우팅 분할을 설계. 온라인 메트릭은 그것을 게이트?
3. 경로 품질은 2% 감소하지만 40% 절약됩니다.
4. OpenAI/anthropic API의 로그프로브를 사용하여 신뢰성 검사를 실시하십시오.
5. 6개월 동안, 격화율은 8%에서 22%로 상승합니다. 세 가지 원인을 진단하고 각각의 치료법을 찾아보세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Model routing | "cost broker" | Dynamic choice of model per request |
| Model cascade | "cheap-first escalate" | Run cheap, fall through to frontier on low confidence |
| Pre-route | "classify first" | Classifier up front; no re-run |
| Ensemble route | "parallel pick" | Run multiple, reward-model picks best |
| Escalation rate | "uprouted %" | Fraction of cascade requests that escalated |
| RouteLLM | "LMSYS router" | OSS router library |
| Not Diamond | "commercial router" | SaaS model-routing product |
| Drift | "cheap creep" | Distribution shift without router noticing |
| Online quality gate | "live check" | Automated LLM-judge sampling live traffic |

## 더 많은 읽기

- [AbhyashSuchi — Model Routing LLM 2026 Best Practices](https://web.archive.org/web/20260413143335/https://abhyashsuchi.in/model-routing-llm-2026-best-practices/)
- [Lukas Brunner — Rise of Inference Optimization 2026](https://dev.to/lukas_brunner/the-rise-of-inference-optimization-the-real-llm-infra-trend-shaping-2026-4e4o)
- [RouteLLM paper / code](https://github.com/lm-sys/RouteLLM)
- [Not Diamond — model routing](https://www.notdiamond.ai/)
- [OpenRouter](https://openrouter.ai/) 라우팅 원시와 함께 멀티 모델 게이트웨이
