# LLM 라우팅 레이어  LiteLLM, OpenRouter, Portkey

> 공급자 잠금가 비싸죠 다른 도구 호출 작업 부하는 다른 모델에 적합합니다. 로팅 게이트웨이는 하나의 API 표면, 재시험, 실패, 비용 추적 및 경비선을 제공합니다. 2026년에 세 가지 아케티프는 지배한다: LiteLLM (오픈소스 셀프 호스팅), OpenRouter (관리된 SaaS), Portkey (생산급, 2026년 3월에 오픈소스). 이 수업은 결정 기준을 지정하고 STDlib 라우팅 게이트웨이를 진행합니다.

**Type:** Learn
**Languages:** Python (stdlib, routing + failover + cost tracker)
**Prerequisites:** Phase 13 · 02 (function calling), Phase 13 · 17 (gateways)
**Time:** ~45 minutes

## 학습 목표

- 자율 호스팅, 관리 및 생산급 라우팅 옵션을 구별하십시오.
- 제공자의 실패를 다시 정의된 우선 순위로 시도하는 역전망을 구현합니다.
- 제공자 간 요청에 따른 비용 및 토큰 사용량을 추적합니다.
- 주어진 생산 제한을 위해 LiteLLM, OpenRouter, Portkey 사이에서 결정하십시오.

## 문제

제공자의 라우팅이 중요시되는 시나리오:

1. **Cost.**클로드 소넷은 하이쿠의 3배가 됩니다. 배열 작업에 하이쿠는 충분하고 합성 작업에 소넷은 가치가 있습니다. 요청에 따라 노선

2. **Failover.**오프엔아이엔 나쁜 시간이야 모든 요청이 실패하고

3. **Latency.**실시간 채팅 UI는 빠른 시간부터 첫 번째 토큰이 필요합니다.

4. **Compliance.**EU 이용자들은 EU 지역에서 머물야 합니다.

5. **Experimentation.**A/B 같은 작업량 2개 모델, 시험 빗에 따라

이 모든 것을 통합에 따라 핸드 코딩은 반복적입니다. 라우팅 게이트웨이는 하나의 OpenAI 호환 API를 제공하고 나머지는 처리합니다.

## 개념

### OpenAI 호환형 프록시 형태

모든 사람이 오픈AI 형식으로 말하고, 라우팅 게이트웨이는 노출됩니다.`/v1/chat/completions`, OpenAI 스키마를 받아들이고, 내부적으로 Anthropic / Gemini / Cohere / Ollama / 무엇이든 프록시합니다. 클라이언트는 신경 쓰지 않습니다.

### 모델 별명

스냅샷 아이디가 붙어있는 대신, 코드에는`our_smart_model`게이트웨이 지도는 실제 모델의 별명입니다. 공급자가 새로운 세대를 전송하면 별명 서버 측을 변경합니다.

### 후퇴 체인

```
primary: openai/gpt-4o
on 5xx: anthropic/claude-3-5-sonnet
on 5xx: google/gemini-1.5-pro
on 5xx: refuse
```

게이트웨이스는 이것을 구성으로 정의합니다. 재시험은 예산에 맞게 계산됩니다. 그래서 재발 캐스케이드는 비용이 폭발하지 않습니다.

### 의미 캐싱

동일하거나 거의 동일한 명령어는 제공자 대신 캐시를 입력합니다. 반복된 에이전트 루프에 대한 절약은 30~60%에 달할 수 있습니다. 키는 임베디션 기반입니다. 거의 동일한 명령어는 캐시 슬롯을 공유합니다.

### 경비선

게이트웨이 레벨:

- **PII redaction.**레전스 또는 ML 기반의 패스
- **Policy violations.**금지된 내용의 명령어들을 거부하십시오.
- **Output filters.**유출을 위한 완성도를 스프러브하십시오.

포트키와 콩은 모두 래프리 래프를 가지고 있습니다.

### 키당 요금 제한

한 API 키 = 한 팀. 각 키 예산은 하나의 팀이 공유된 비중을 소비하는 것을 막습니다. 대부분의 게이트웨이는 이것을 지원합니다.

### 자행 및 관리된 타협

| Factor | LiteLLM (self-hosted) | OpenRouter (managed) | Portkey (production) |
|--------|----------------------|----------------------|----------------------|
| Code | Open source, Python | Managed SaaS | Open source (Mar 2026) + managed |
| Setup | Deploy a proxy | Sign up | Either |
| Providers | 100+ | 300+ | 100+ |
| Billing | Your own keys | OpenRouter credits | Your own keys |
| Observability | OpenTelemetry | Dashboard | Full OTel + PII redaction |
| Best for | Teams that want full control | Rapid prototyping | Production with compliance |

리틀LM은 SRE 팀과 데이터 주권을 원하는 경우 승리합니다. 오픈루터는 단일 구독을 원하는 경우 승리합니다. 인프라가 없습니다. 포트키는 보호 및 준수가 필요한 경우 승리합니다.

### 비용 추적

모든 요청에는`provider``model``input_tokens``output_tokens`. 모델당 토큰 가격 (게이트웨이에서 관리되는 가격표에서 추출) 을 곱한다. 사용자당 / 팀당 / 프로젝트당 집합.

### MCP+ 라우팅

게이트웨이는 LLM 호출과 MCP 샘플링 요청 모두를 로우팅할 수 있습니다. 샘플링 요청의 모델이 특정 모델을 선호할 때, 게이트웨이는 오른쪽 백엔드로 번역됩니다. 여기서 단계 13 · 17 (MCP 게이트웨이) 와 이 수업의 라우팅 게이트웨이는 때때로 하나의 서비스에 통합됩니다.

### 라우팅 전략

- **Static priority.**목록에서 첫 번째, 오류를 다시 습니다.
- **Load balancing.**롤라빈 또는 중량
- **Cost-aware.**가장 저렴한 모델을 선택하여 지연성 / 품질을 충족합니다.
- **Latency-aware.**지난 10분 동안 가장 빠른 모델을 선택해
- **Task-aware.**빠른 분류자 라이트 한 모델로 코딩, 다른 모델로 요약

```figure
tp-router-failover
```

## 사용 하 고

`code/main.py`150 라인 로팅 게이트웨이를 구현: OpenAI 모양의 요청을 받아들이고, 제공자별로 줄거리를 번역하고, 우선순위 하락 연쇄를 실행하고, 요청에 따른 비용을 추적하고, 입력에 PII 편집 패스를 적용합니다. 일반 요청, 주요 제공자 중 끊기는 하락을 유발하고, 편집으로 발견되는 PII 유출을 적용합니다.

무엇을 살펴볼 수 있을까요?

- `ROUTES`dict: alias -> 우선 순위 순위 있는 구체적인 공급자 목록
- 5xx에서 다시 시도해 보세요.
- 비용 추적기는 토큰 사용량을 모델별 비율로 곱합니다.
- PII 편집기는 전송 전에 SSN 모양의 패턴을 스크러브합니다.

## 선박

이 교훈은`outputs/skill-routing-config-designer.md`작업량 프로파일 (연체, 비용, 준수) 을 고려하면, 스킬은 LiteLLM / OpenRouter / Portkey를 선택하고 라우팅 구성을 생성합니다.

## 운동

1. 달아`code/main.py`. 중단 시나리오를 촉발하고, 두 번째 공급자에 대한 역전 현상이 확인하고 비용의 정확도가 확인됩니다.

2. 의미 캐싱을 추가: 프롬프트의 SHA256는 검색 키입니다. 캐시 클릭은 즉시 반환됩니다. 반복된 호출에 대한 비용 절감량을 측정합니다.

3. 정보에 유리한 별명으로 "코드"...를 로팅하고 속도에 유리한 별명으로 "자료화"...를 로팅하는 임플릿 분류자를 추가합니다.

4. 팀당 예산 설계: 각 팀마다 월간 지출 제한이 있습니다. 게이트웨이는 제한 제한이 도달되면 요청을 거부합니다. 집행 미분성을 선택하십시오 (소원당 또는 윈도우).

5. 리틀LM, 오프너루터, 포트키 문서를 옆으로 읽어 보세요. 다른 두 배는 그렇지 않은 한 가지 기능을 명명하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Routing gateway | "LLM proxy" | One-API-surface layer in front of many providers |
| OpenAI-compatible | "Speaks the OpenAI schema" | Accepts `/v1/chat/completions` shape, translates to any backend |
| Model alias | "our_smart_model" | Name in your code that the gateway maps to a concrete model |
| Fallback chain | "Retry list" | Ordered list of providers attempted on failure |
| Semantic caching | "Prompt-embedding cache" | Key is embedding of the prompt; near-duplicates share a cache hit |
| Guardrails | "Input/output filters" | Redact PII, reject policy violations |
| Per-key rate limit | "Team budget" | Quota scoped to an API key |
| Cost tracking | "Per-request spend" | Aggregate token usage x price per model |
| LiteLLM | "The open proxy" | Self-hostable OSS routing gateway |
| OpenRouter | "The managed SaaS" | Hosted gateway with credit-based billing |
| Portkey | "The production option" | Open-source + managed with guardrails built in |

## 더 많은 읽기

- [LiteLLM — docs](https://docs.litellm.ai/) 자율 주최 로우팅 게이트웨이
- [OpenRouter — quickstart](https://openrouter.ai/docs/quickstart) 관리된 SaaS 라우팅
- [Portkey — docs](https://portkey.ai/docs) 경비로 생산 라우팅
- [TrueFoundry — LiteLLM vs OpenRouter](https://www.truefoundry.com/blog/litellm-vs-openrouter) 결정 안내서
- [Relayplane — LLM gateway comparison 2026](https://relayplane.com/blog/llm-gateway-comparison-2026) 판매자 조사
