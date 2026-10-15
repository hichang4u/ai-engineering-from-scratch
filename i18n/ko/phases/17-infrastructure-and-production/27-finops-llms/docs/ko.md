# LLM의 FINOps  단위 경제 및 다중 임차자 배정

> 전통적인 핀오프스는 LLM 지출에 대한 휴식입니다. 비용은 토큰 거래이며 리소스 업타임이 아닙니다. 태그는 지도를 표시하지 않습니다. API 호출은 거래이며 자산이 아닙니다. 엔지니어링 결정 (프롬프트 디자인, 컨텍스트 창, 출력 길이는) 은 금융 결정입니다. 2026 플레이북은 첫 날부터 도구에 대한 배정 차원을 세 가지 있습니다. 사용자당 (`user_id`) 의석 가격 및 확장, 일 작업 (`task_id`+ `route`1) 제품 표면 비용 및 우선 순위, 임차 (`tenant_id`) 단위 경제 및 재생에 관한 4개의 토큰 레이어  프롬프트, 도구, 메모리, 응답 다채로운 임차용 제품들에 대한 집행 계단은: 임차인당 요금 제한 (2-3x 예상 최고, 429 + 재실험 후) ؛ 일간 지출 제한 (1,5-3x 계약한 천장; 속도 강화 + 경고를 유발); 지출 z 점수 > 4 (자동적인 일시 중지 + 페이지 호출) 를 종료하는 스위치입니다. 배정 패턴: 태그 및 집합, 텔레메트리 결합 (트레이스-ID → 청구; 가장 높은 정확성), 샘플링 및 추출, 모델 기반 할당, 이벤트 소스, 실시간 스트리밍. 단위 측정: 해결된 질의당 비용, 생성된 유물당 비용  $/M 토큰이 아닙니다. 역동적 태그링은 항상 빠집니다. 요청에 따라 생성하는 도구.

**Type:** Learn
**Languages:** Python (stdlib, toy cost-attribution simulator with kill switch)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 14 (Caching)
**Time:** ~60 minutes

## 학습 목표

- 전통적인 FinOps (टै그 + 계층) 가 LLM 지출에 왜 끊어지는지 설명하고 새로운 배정 차원의 세 가지 이름을 지정하십시오.
- 4개의 토큰 계층 (프롬프트, 툴, 메모리, 응답) 을 나열하고, 단일 버킷 청구서는 비용을 왜 숨기는지를 설명합니다.
- 여러 임차용 제품 (rate → spend cap → kill switch) 에 대한 강제 계단을 설계하십시오.
- $/M 토큰 대신 단위 메트릭 (해결된 질의/예물당 비용) 을 선택하십시오.

## 문제

네 청구서는 4만달러라고
- 어떤 임차가 썼는지
- 어떤 제품 기능이 이 제품을 이끌었는지
- 어떤 개인 사용자가 학대했는지
- 즉흥적인 부풀림, 도구 호출, 또는 메모리 증폭이 그 죄인이었다.

클라우드 리소스 (EC2, S3) 에서 태그와 집합이 작동합니다. 태그가 라인 항목으로 퍼지는 경우 LLM API 호출은 자동 태그를 표시하지 않습니다.

## 개념

### 3개의 배정 차원

**Per-user**(`user_id`): 누가 무엇을 지불하고 있는지, 좌석 가격, 확장 대화, 전력 사용자를 식별하는

**Per-task**(`task_id`+ `route`): 어떤 제품 표면이 얼마나 비싸지. 드라이브는 우선 순위를 설정하고,

**Per-tenant**(`tenant_id`): 어떤 고객이 수익성 있는지. 단위 경제, 재생 가격, 계층 열을 가동한다.

3개 모두 전화 현장에서 첫 날부터

### 4개의 표기 계층

| Layer | Example | Typical % of total |
|-------|---------|---------------------|
| Prompt | system + user input | 40-60% |
| Tool | tool-call results fed back | 20-40% (agent workloads) |
| Memory | prior conversation / retrieved docs | 10-30% |
| Response | model output | 10-30% |

네 가지 모두 함께 묶으면 최적화가 맹인화됩니다.

### 집행 계단

1. **Rate limit**임대주당 2~3배가 예상된 최고 수준으로`Retry-After`임차가 마찰을 보며 놀라울 수 없는 법안이

2. **Daily spend cap**임차주당 1.5-3x 계약한 천장. 트리거: 꽉 차기 제한 + 경고 고객 성공.

3. **Kill switch**임차원 기본 라인 대비 지출 z 점수 > 4 에 대해 자동 중단 임차원; 호출 페이지; ops + CS로 상승

### 배정 패턴

- **Tag-and-aggregate**: 메타데이터 헤더, 나중에 집계. 간단, 대략
- **Telemetry joiner**: 추적 ID를 통해 추적을 결제하는 데 연결합니다. 가장 높은 정확성. 성숙한 팀이 하는 것.
- **Sampling + extrapolation**: 샘플 5~10% 곱하기, 부진한 지출에 비용 효율적, 꼬리를 놓치고
- **Model-based allocation**: 비용 드라이버를 추론하기 위한 회귀.
- **Event-sourced**: 스트림 (Kafka/Kinesis) 에서 이벤트로 비용.
- **Real-time streaming**: 래시보드 업데이트 sub-초

### X당 비용은 단위 측정값입니다

$/M 토큰은 공급자 이야기입니다. 제품 매트릭스:

- 해결된 지원 티켓에 대한 비용은
- 생산된 물품당 비용은
- 성공한 에이전트 임무에 대한 비용
- 사용자 세션 분당 비용은

제품 결과에 비용을 연결하면 최적화가 무관합니다.

### 비용 배정 추적 형태

```
trace_id: abc123
  user_id: u_42
  tenant_id: t_7
  task_id: task_classify_doc
  route: model_haiku
  layers:
    prompt_tokens: 1800
    tool_tokens: 600
    memory_tokens: 400
    response_tokens: 150
  cost_usd: 0.0135
  cached_input: true
  batch: false
```

모든 호출에 전송합니다. 데이터 호수에서 저장합니다. 각 차원별 합쳐집니다. 17 · 13 단계 관찰성 스택이 이 곳에 살고 있습니다.

### 합성 저축 스택

스택: 캐시 + 배치 + 라이트 + 게이트웨이. 네 가지 모두:
- 캐시 L2 (단계 17 · 14): ~ 10배 더 저렴한 입력
- 배트 (단계 17 · 15): 50% 할인
- 저렴한 모델로 가는 길 (단계 17 · 16): 60%의 비용 절감.
- 게이트웨이 효율성 (단계 17·19): 과잉+ 재실험.

가장 좋은 경우: 순수한 기본 기준의 ~5~10%입니다. 대부분의 팀들은 2-3개의 레버를 사용하지만, 거의 모든 4개의 레버를 사용하지는 않습니다.

### 기억해야 할 숫자

- 배정 차원은 사용자, 작업, 임차자
- 4개의 지표층: 프롬프트, 툴, 메모리, 응답
-  스위치: z 점수를 4 이상으로 사용한다.
- 단위 측정: $/M 토큰이 아닌 해결된 질의당 비용
- 겹겹의 최적화: ~ 5~10%의 기본 기준이 가능

```figure
i4-spend-ladder
```

## 사용 하 고

`code/main.py`3단계 강제 계단으로 여러 임차인 LLM 서비스를 시뮬레이션합니다. 학대적인 임차인을 주입하고,

## 선박

이 교훈은`outputs/skill-finops-plan.md`. 제품과 규모를 고려하여, 배정 스케마와 집행 계단을 설계합니다.

## 운동

1. 달아`code/main.py`스 스위치가 어떤 점수를 쏘는 거죠?
2. 임대주당 비용의 대시보드를 설계하세요. 먼저 5개의 관점을 만들어 보세요.
3. 가장 큰 임차는 경제적으로 부정적이고 고객 영향에 따라 세 가지 개입을 제안하세요
4. 지원 제품에서 해결된 티켓에 대한 비용 계산: 3M 토큰/티켓, ~800 티켓/일, GPT-5 캐시 비율.
5. 반동력 탭링이 효과가 있을 것인지를 논리 해 보십시오. 언제 받아들여질까요?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Per-user attribution | "user-level cost" | `user_id` stamped on every call |
| Per-task attribution | "feature cost" | `task_id` + `route` identify product surface |
| Per-tenant attribution | "customer cost" | `tenant_id`; drives unit economics |
| Four token layers | "cost layers" | prompt + tool + memory + response |
| Rate limit | "429 guard" | Per-tenant ceiling enforced at gateway |
| Daily spend cap | "daily ceiling" | Tenant-scoped budget with alert |
| Kill switch | "auto-pause" | Spend z-score > 4 triggers auto-suspension |
| Cost per resolved | "product unit metric" | Cost tied to product outcome, not tokens |
| Telemetry joiner | "trace-to-billing" | Highest-accuracy attribution pattern |
| Stacked optimization | "cache+batch+route+gateway" | Compounding savings to ~5-10% baseline |

## 더 많은 읽기

- [FinOps Foundation — FinOps for AI Overview](https://www.finops.org/wg/finops-for-ai-overview/)
- [FinOps School — Cost per Unit 2026 Guide](https://finopsschool.com/blog/cost-per-unit/)
- [Digital Applied — LLM Agent Cost Attribution 2026](https://www.digitalapplied.com/blog/llm-agent-cost-attribution-guide-production-2026)
- [PointFive — Managed LLMs in Azure OpenAI](https://www.pointfive.co/blog/finops-for-ai-economics-of-managed-llms-in-azure-open-ai)
