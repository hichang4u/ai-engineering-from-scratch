# AI 게이트웨이  LiteLLM, 포트키, 콩 AI 게이트웨이, 바이프로스트

> 앱과 모델 공급업체 사이에 게이트웨이가 있습니다. 핵심 기능은 공급자 라우팅, 백, 재시험, 속도 제한, 비밀 참조, 관찰 가능, 경비 라일입니다. 2026 년 시장 분할: **LiteLLM**100개 이상의 제공업체와 함께 MIT OSS이며, OpenAI와 호환되지만 ~2000 RPS (8GB 메모리, 출판 벤치마크의 캐스크레이드 오류) 를 분해합니다. Python에 가장 좋습니다. <500 RPS, dev/prototyping. **Portkey**제어 평면 위치 (보호, PII 편집, jailbreak 탐지, 감사 트레일) 로 이동 Apache 2.0 오픈 소스 2026 년 3 월, 20-40 ms 지연 윗값,$49/mo production tier. **Kong AI Gateway** built on Kong Gateway — Kong's own benchmark on same 12 CPUs: 228% faster than Portkey, 859% faster than LiteLLM; $100/모델/달 가격 (플러스 레벨에서 최대 5), 이미 Kong에 사용한다면 기업용으로 적합합니다. **Bifrost**(마xima AI)  자동으로 설정 가능한 백코프로 다시 시도, OpenAI 429에서 인트로피로 다시 시도. **Cloudflare / Vercel AI Gateways** 관리, 제로 작전, 기본 재시험. 데이터 레지던스 (Data Residency) 는 자기 호스트 결정을 주도합니다. 포트키와 콩은 OSS + 선택적 관리로 중간에 앉아 있습니다.

**Type:** Learn
**Languages:** Python (stdlib, toy gateway-routing simulator)
**Prerequisites:** Phase 17 · 01 (Managed LLM Platforms), Phase 17 · 16 (Model Routing)
**Time:** ~60 minutes

## 학습 목표

- 6가지 핵심 게이트웨이 특징을 (로팅, 역전, 재실험, 속도 제한, 비밀, 관찰 가능, 경비) 를 나열한다.
- 천장 및 사용 사례를 확장하기 위해 2026 년 4 개의 게이트웨이 (LiteLLM, Portkey, Kong AI, Bifrost) 를 지도하십시오.
- 콩 기준 (228% vs 포트키, 859% vs 리트LLM) 을 인용하고, 500 RPS 이상에 대해 왜 중요하는지 설명하십시오.
- 데이터 거주 및 운영 예산을 고려하여 자영 vs 관리 선택

## 문제

귀하의 제품은 OpenAI, Anthropic, 그리고 자체 호스팅 된 Llama를 호출합니다. 각 공급자는 다른 SDK, 오류 모델, 요금 제한 및 auth 스키마를 가지고 있습니다. 당신은 실패 (OpenAI 429s 경우, Anthropic를 시도하십시오), 단일 인증 저장, 통일된 관찰 가능, 임대인에게 요금 제한을 원합니다.

앱 레이어에서 이것을 재발견하면 모든 서비스와 모든 공급자에게 결합됩니다. 게이트웨이 레이어는 공급자에게 팬을 제공하는 하나의 API (일반적으로 OpenAI 호환) 를 통해 하나의 프로세스로 통합합니다.

## 개념

### 6가지 핵심 특징

1. **Provider routing** 오픈AI, 앤트로픽, 트윈리, 셀프 호스팅 등이 하나의 API 뒤에 있습니다.
2. **Fallback**429, 5xx 또는 품질 실패로 다른 곳에서 다시 시도하십시오.
3. **Retries** 기하급수적 배코프, 제한된 시도
4. **Rate limits** 임차자, 키, 모델
5. **Secret references** 실행 시점에 (앱에서 절대) 엽서서에서 인증서를 꺼내야 합니다.
6. **Observability** OTel + GenAI 속성 (단계 17 · 13) + 비용 속성
7. **Guardrails** PII 편집, jailbreak 탐지, 허용된 주제 필터

### 리틀LM  MIT OSS, 파이썬

- 100+ 공급자, OpenAI 호환성, 라우터 구성, 역전환, 기본적인 관찰성.
- 콩의 기준으로 2000 RPS 정도가 분해되고, 8GB의 메모리 발자국, 지속적인 로드 아래의 캐스크레이드 오류가 있습니다.
- 가장 잘 맞는: 파이썬 앱, <500 RPS, 개발/단계 게이트웨이, 실험 라우팅.
- 비용: OSS에 $0; 클라우드 무료 레벨이 있습니다.

### 포트키  제어 비행기의 위치

- 2026년 3월부터 Apache 2.0 OSS. 경비선, PII 편집, jailbreak 탐지, 감사 트레일
- 요청 당 20~40 ms의 지연비용
- 49달러/월 생산 계층에 대한 유지보수+SLA
- 가장 잘 어울리는: 보호막이 필요한 규제 산업 + 관찰가능성이 묶여있는 산업

###        

- Kong Gateway (성숙한 API 게이트웨이 제품, lua+OpenResty) 에 기반을 둔다.
- 12개의 CPU 대등에 대한 Kong의 기준: Portkey보다 228% 더 빠르고 LiteLLM보다 859% 더 빠르다.
- 가격: 모델 1개월 100달러, 플러스 레벨에서 최대 5달러.
- 가장 잘 어울리는: 이미 Kong에;> 1000 RPS; 라이선스를 사용할 준비가 되어 있습니다.

### 바이프로스트 (마xima AI)

- 자동으로 설정 가능한 백코프로 다시 시도합니다.
- OpenAI 429에서 인тропо틱으로 돌아가는 것은 정통적인 요리법입니다.
- 신입생, 광고

### 클라우드플레어 AI 게이트웨이 / 베르셀 AI 게이트웨이

- 관리, 순수 작전, 재시험, 관찰 가능성
- 가장 잘 맞는: 클라우드플레어/버셀에서 가장자리를 제공하는 자바스크립트 앱.
- 경비선 및 속도 제한에 대한 Kong/Portkey에 비해 제한적입니다.

### 자영 호스팅 vs 관리

데이터 레지던스는 강제 기능이다. 건강 관리 및 금융 기본 자체 호스트 (LiteLLM 또는 Portkey OSS 또는 Kong). 소비자 제품 기본 관리 (Cloudflare AI 게이트웨이) 또는 중급 (Portkey 관리). 하이브리드: 규제 된 임대인에게 자체 호스트, 다른 사람들을 위해 관리.

### 지연 예산

- 리틀림: 5~15 ms의 오버헤드
- 20~40초가 넘습니다.
- 3~8 ms의 대장비.
- 클라우드플레어/버셀: 1-3 ms 오버헤드 (엣지 우수)

게이트웨이 지연은 TTFT에 직접 추가됩니다. TTFT P99 < 100 ms SLA, Kong 또는 Cloudflare.

### 비율 제한 의미론의 문제

간단한 토큰 버킷은 중소 규모까지 작동합니다. 다채로운 임차는 슬라이딩 창 + 폭발 허용 + 임차당 타이링이 필요합니다. LiteLLM는 토큰 버킷을 배포하고, Kong는 슬라이딩 창을 배포하고, Portkey는 계층으로 배포됩니다.

### 게이트웨이 + 관찰성 + 라우팅 구성

17 · 13 단계 (시경성) + 16 (모델 라우팅) + 19 (게이트웨이) 는 생산의 동일한 층이다. 세 가지 모두 포함되는 도구를 선택하거나 신중하게 연결하십시오. 2026 배포의 대부분은 헬리콘 (시경성) 또는 포트키 (보호) 를 콩 (스케일) 과 결합하여 분할 역할을합니다.

### 기억해야 할 숫자

- 리틀림: 2000 RPS, 8 GB 메모리에 파열됩니다.
- 포트키: 20-40 ms 오버헤드; 2026년 3월부터 아파치 2.0
- 콩: 포트키보다 228% 더 빠르고, 리트LLM보다 859% 더 빠르다.
- 콩 가격: 100달러/모델/달, 플러스 레벨에서 최대 5달러.
- 클라우드플레어/버셀: 가장자리에 1-3 ms 오버헤드

```figure
mx-gateway-fallback
```

## 사용 하 고

`code/main.py`429/5xx 주입 아래 3개의 공급업체에서 패럴백으로 게이트웨이 라우팅을 시뮬레이션합니다.

## 선박

이 교훈은`outputs/skill-gateway-picker.md`규모, 운영 자세, 준수, 지연 예산에 따라, 게이트웨이 선택합니다.

## 운동

1. 달아`code/main.py`. OpenAI→Anthropic→자동 호스팅에서 재설정. 5% 공급자의 오류율에서 예상되는 타격률은 무엇입니까?
2. SLA는 TTFT P99 < 200 ms입니다. 300 ms의 기본 라인에서. 어떤 게이트웨이는 예산 내에서 유지됩니다?
3. 의료 고객에게는 자기 주최+ 개인 정보 편집+감독이 필요합니다. 포트키 OSS 또는 KONG를 선택하세요.
4. 리틀LM와 콩을 비교해보세요: 어떤 RPS 천장에는 팀이 이동해야 할까요?
5. 여러 임차 SaaS에 대한 요금 제한 정책을 설계: 무료 계층, 시험 계층, 유료 계층. 토큰 버킷 또는 슬라이딩 윈도?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Gateway | "API broker" | Process sitting between apps and providers |
| LiteLLM | "the MIT one" | Python OSS, 100+ providers, breaks at 2K RPS |
| Portkey | "guardrails gateway" | Control plane + observability, Apache 2.0 |
| Kong AI Gateway | "the scale one" | Built on Kong Gateway, benchmark leader |
| Bifrost | "Maxim's gateway" | Retries + Anthropic fallback recipe |
| Cloudflare AI Gateway | "edge managed" | Edge-deployed managed gateway, zero-ops |
| PII redaction | "data scrub" | Regex + NER mask before sending to model |
| Jailbreak detection | "prompt injection guard" | Classifier on user input |
| Audit trail | "regulated log" | Immutable record of every LLM call |
| Token-bucket | "simple rate limit" | Refill-based rate limiter |
| Sliding-window | "precise rate limit" | Time-windowed rate limiter; better fairness |

## 더 많은 읽기

- [Kong AI Gateway Benchmark](https://konghq.com/blog/engineering/ai-gateway-benchmark-kong-ai-gateway-portkey-litellm)
- [TrueFoundry — AI Gateways 2026 Comparison](https://www.truefoundry.com/blog/a-definitive-guide-to-ai-gateways-in-2026-competitive-landscape-comparison)
- [Techsy — Top LLM Gateway Tools 2026](https://techsy.io/en/blog/best-llm-gateway-tools)
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [Portkey GitHub](https://github.com/Portkey-AI/gateway)
- [Kong AI Gateway docs](https://docs.konghq.com/gateway/latest/ai-gateway/)
