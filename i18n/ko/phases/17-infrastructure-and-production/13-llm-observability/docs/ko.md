# LLM 관찰성 스택 선택

> 2026년 관찰가능성 시장은 두 가지로 나뉘어 있습니다. 개발 플랫폼 (LangSmith, Langfuse, Comet Opik) 은 평가, 신속 관리, 세션 재생으로 모니터링을 묶습니다. 게이트웨이/인스트루먼트 도구 (헬리콘, 시그노즈, 오픈LL메트리, 피닉스) 는 텔레메트리에 초점을 맞추고 있다. 랭푸즈는 MIT 라이선스 코어이며, 강력한 OSS 균형 (50K 이벤트/달 무료 클라우드) 을 가지고 있습니다. 피닉스는 유연 라이선스 2.0  아래 OpenTelemetry-이 내재되어 있으며, 드립/RAG 시각화에는 탁월하다. 지속적인 생산 백엔드가 아닙니다. 아리즈 AX는 아이즈베르크/파켓 통합을 사용하며, 모놀리틱 관찰 가능성에 비해 100배 더 저렴하다고 주장합니다. 랭스미스는 랭체인/랑그래프에서 선두를 맡고 있습니다. 39달러/모로, 엔터프라이즈에서만 자체 호스트입니다. 헬리콘은 15-30분 설정으로 프록시 기반이고, 100K의 리크/모가 무료이지만, 에이전트 추적에 더 적은 깊이입니다. 일반적인 생산 패턴: 게이트웨이 (헬리콘/포트키) + eval 플랫폼 (피닉스/트루렌스)

**Type:** Learn
**Languages:** Python (stdlib, toy trace-sampling simulator)
**Prerequisites:** Phase 17 · 08 (Inference Metrics), Phase 14 (Agent Engineering)
**Time:** ~60 minutes

## 학습 목표

- 개발 플랫폼 (그룹: evals + prompt + sessions) 을 gateway/telemetry 도구 (터스 + 메트릭스만) 에서 구분한다.
- 6개의 주요 도구를 (Langfuse, LangSmith, Phoenix, Arize AX, Helicone, Opik) 라이선스, 가격 및 달콤한 장소 사용 사례에 지도하십시오.
- 게이트웨이 도구를 별도의 평가 플랫폼과 결합할 수 있는 OpenTelemetry-글러 패턴을 설명하십시오.
- 2026년 비용 차이점을 명명하고 (Arize AX의 제로 복제 접근 방식과 단일 섭취) 대략 100x 곱수를 적어 주십시오.

## 문제

LLM 기능이 전송되었습니다. 그것은 작동합니다. 당신은 신속한 실패, 도구 루프, 지연률 회귀, 비용 스파이크, 또는 신속한 캐시 샷 비율에 대한 가시성을 없습니다. 당신은 구글 "LLM 관찰성"을 얻을 수 있습니다. 모두 같은 문제를 세 가지 다른 가격 포인트에서 해결한다고 주장하는 8 가지 도구를 얻을 수 있습니다.

그들은 같은 문제를 해결하지 않습니다. 랭그스미스는 "왜 랭그라프 실행이 실패했습니까?"라고 답합니다. 피닉스는 "내 RAG 파이프라인이 유동하고 있습니까?"라고 답합니다. 헬리콘은 "어떤 앱이 토큰을 태우고 있습니까?"라고 답합니다. 랭그스미스는 "나는 모든 것을 자체적으로 호스팅 할 수 있습니까?"라고 답합니다. 다양한 도구, 다른 관객.

선택은 네 가지 축을 포함합니다. 스택 (롱 체인? 원자 SDK? 멀티 벤더?), 라이센스 용납 (MIT만? 유연적 OK? 상업적 벌금?), 예산 (자료 계층? $100/mo? $1000/월?), 그리고 자기 호스트 (무엇을 해야?

## 개념

### 두 가지 분류

**Development platforms**랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩탑, 랩

**Gateway/telemetry tools**기기 추론 호출  프롬프트, 응답, 토큰, 지연기, 모델, 비용. 헬리콘, SigNoz, OpenLLMetry, 피닉스. 최소주의. OpenTelemetry를 통해 별도의 평가 도구와 결합 할 수 있습니다.

###       

- 코어 아파치 / MIT 라이선스; Docker를 통해 자체 호스트.
- 클라우드 무료 레벨: 5만 이벤트/달. 팀당 29달러/월.
- Evals, prompt 관리, 추적, 데이터 세트 네 가지 개발 플랫폼 기능의 합리적인 커버링
- 달콤한 점: LangSmith 클래스 기능을 원하지만 자스 숙주 또는 OSS 라이선스에 남아 있어야 합니다.

### 피닉스 (아리즈)  텔레메트리-첫, 오픈텔레메트리-네이티브

- 탄력 라이선스 2.0 자전 호스트 비범한
- RAG와 드래프트 시각화에서 탁월한 랩터
- 지속 가능한 생산 백엔드로 설계되지 않은  주로 개발 시간 관찰 가능함
- 좋은 점: RAG 파이프 라인 개발, 드리프 디버깅, 생산에 별도의 게이트웨이와 커플

### 아리즈 AX  스케일 플레이

- 상업용으로, 아이스베르크/파켓을 통해 데이터 호수 통합을 할 수 있습니다.
- 이 기하자는 S3에 있는 자신의 파켓에 흔적을 저장하고, Arize는 직접 읽습니다.
- 달콤한 점: 하루에 10M 이상의 추적, 기존 데이터 호수, 데이터도그 가격 없이 LLM 특수한 대시보드를 원합니다.

### 랭스미스  랭체인/랑그라프 먼저

- 상업용, 39달러/월, 엔터프라이즈에서만 자체 호스팅
- 랭체인, 랭그래프 스택에서 가장 좋은 것인데, 둘 중 하나에 참여하지 않으면 덜 매력적입니다.
- 단위: 랭체인 팀, 돈을 지불할 준비가 되어 있습니다.

### 헬리콘  프록시 기반의 최소 실행 가능

- 15-30분 설정으로 `OPENAI_API_BASE`헬리콘 대리국으로
- MIT 라이선스, 월 1만원 무료, 월 20달러 +
-  밸런오버, 캐시, 비율 제한이 포함됩니다.
- 대리인/다단계 추적에 더 적은 깊이.
- Sweet spot: 빠른 시작, 단일 스택 앱, 게이트웨이 + 하나의 관찰 가능성이 필요합니다.

### 오피크 (코메트)  OSS 개발 플랫폼

- 아파치 2.0 완전 OSS
- 혜성 유산을 가진 랭푸즈와 비슷한 특징이 있습니다.
- 코메트에서 이미 ML 팀들이 같은 패널에서 LLM 관찰성을 원합니다.

### SigNoz  오픈텔레미트리-첫 번째 전체 APM

- Apache 2.0: 오픈텔레메트리 (OpenTelemetry) 를 통해 일반 APM+LLM를 처리합니다.
- 달콤한 점: 서비스와 LLM 호출들 간의 통일된 관찰성.

### 접착제: OpenTelemetry + GenAI 의미 협약

OpenTelemetry는 2025년 말 GenAI의 의미 협정을 발표했다 (`gen_ai.system``gen_ai.request.model``gen_ai.usage.input_tokens`) OTel를 소비하는 도구들은 상호 작용할 수 있습니다.

1. 모든 LLM 통화에서 GenAI 컨벤션으로 OTel를 발송하십시오.
2. 매일 통행로 (헬리콘/포트키)
3. 회귀를 위한 평가 플랫폼 (Phoenix/Langfuse) 에 대한 이중 배
4. Arize AX 또는 DuckDB를 통해 장기 분석을 위해 데이터 호수 (Iceberg) 에 보관함

### 함정: 잘못된 층에 악기를 사용

에이전트 프레임워크 내부에서 도구 (예를 들어, 랭스미스 트레이스 추가) 를 사용하여 그 프레임워크에 연결합니다. HTTP/OpenAI-SDK 계층에서 도구 (OpenLLMetry 또는 게이트웨이를 통해) 휴대 할 수 있습니다.

### 샘플링은 모든 것을 유지할 수 없습니다

1만 건 이상의 요청/일에서, 전체 추적 유지 비용은 LLM 호출보다 더 많은 것입니다. 규칙에 따라 샘플: 100% 오류, 100% 높은 비용, 5% 성공. 항상 집합물을 유지하십시오. 긴 꼬리를 위해 원료 유지하십시오.

### 기억해야 할 숫자

- 랭푸스 무료 클라우드: 월 50만 이벤트
- 랭스미스: 39달러/월
- 헬리콥터 무료: 1만 원/월
- 아리즈 AX 주장: 모노리틱 규모보다 ~ 100배 더 저렴합니다.
- 오픈텔레미트리 제너아이 협약: 2025 해운, 2026

```figure
i4-otel-glue
```

## 사용 하 고

`code/main.py`유지 전략 (100% 섭취, 샘플링, 샘플링 + 오류) 에서 1M 추적 하루를 시뮬레이션합니다. 저장 비용 및 각각의 손실을 보고합니다.

## 선박

이 교훈은`outputs/skill-observability-stack.md`. 스택, 규모, 예산, 라이선스 자세를 고려하면 도구를 선택합니다.

## 운동

1. LangChain의 팀들은 OSS에서 직접 관측이 가능하고 Langfuse나 Opik을 선택해서 정당화해야 합니다.
2. 5M 트레이스/일에서 Datadog는 월 15만 달러에 이치, Arize AX에 대한 계산 밸런스.
3. OpenTelemetry GenAI 속성을 설계하여 조직의 지침을 설정하여 LLM 호출마다 의무화해야 합니다.
4. 피닉스만 생산하기에 충분하냐는 논쟁을 해보세요. 언제 충분하지 않을까요?
5. 헬리콘은 20ms 프록시 오버헤드입니다. P99 TTFT 300ms에서, 그것은 허용되는가요? SLA는 100ms?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OpenLLMetry | "OTel for LLMs" | Open-source OpenTelemetry instrumentation for LLMs |
| GenAI conventions | "OTel attributes" | Standard OTel attribute names for LLM calls |
| LangSmith | "LangChain observability" | Commercial platform bundled with LangChain ecosystem |
| Langfuse | "OSS LangSmith" | MIT OSS with similar feature set |
| Phoenix | "Arize dev tool" | OpenTelemetry-native dev/eval platform |
| Arize AX | "scale observability" | Commercial zero-copy Iceberg/Parquet observability |
| Helicone | "proxy observability" | HTTP proxy collecting LLM telemetry + gateway features |
| Opik | "Comet LLM" | Apache 2.0 OSS dev platform from Comet |
| Session replay | "trace rerun" | Replay a full agent session with tool calls |
| Eval | "offline test" | Running candidate model/prompt over labeled dataset |

## 더 많은 읽기

- [SigNoz — Top LLM Observability Tools 2026](https://signoz.io/comparisons/llm-observability-tools/)
- [Langfuse — Arize AX Alternative analysis](https://langfuse.com/faq/all/best-phoenix-arize-alternatives)
- [PremAI — Setting Up Langfuse, LangSmith, Helicone, Phoenix](https://blog.premai.io/llm-observability-setting-up-langfuse-langsmith-helicone-phoenix/)
- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Arize Phoenix docs](https://docs.arize.com/phoenix)
- [Helicone docs](https://docs.helicone.ai/)
