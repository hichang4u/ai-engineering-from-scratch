# 오픈텔레미트리 GenAI  추적 도구 종말 통화를

> 에이전트가 5개의 도구, 3개의 MCP 서버, 그리고 2개의 하위 에이전트를 호출합니다. 전부 다 다 다 뒤집어 놓아야 해 OpenTelemetry GenAI 의미 협약 (v1.37 및 이상의 안정적인 속성) 은 2026 표준이며, Datadog, Langfuse, Arize Phoenix, OpenLLMetry 및 AgentOps에서 원산적으로 지원됩니다. 이 수업은 필요한 속성을 지정하고, 스파인 계층을 (agent → LLM → tool) 살펴보고, 어떤 OTel 수출자에게도 연결할 수 있는 stdlib 스파인 에미터를 배포한다.

**Type:** Build
**Languages:** Python (stdlib, OTel span emitter)
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~75 minutes

## 학습 목표

- LLM 기간과 도구 실행 기간에 필요한 OTel GenAI 속성을 지정하십시오.
- 에이전트 루프, LLM 호출, 도구 호출, MCP 클라이언트 전송을 포함하는 추적 계층을 구축하십시오.
- 어떤 콘텐츠를 캡처 (opt-in) 와 편집 (default) 하는지를 결정합니다.
- 도구 코드를 다시 작성하지 않고 지역 수집자에게 (Jaeger, Langfuse) 랜드를 전송하십시오.

## 문제

2026년 2월부터 디버깅: 사용자 보고서는 "내 에이전트는 때때로 30초를 걸립니다. 다른 때는 3초". 흔적이 없습니다. 로그는 LLM 호출을 보여줍니다. 그러나 도구 전송은 아닙니다. MCP 서버 돌아가는 여행은 아닙니다.

끝에서 끝까지 추적이 없으면 찾을 수 없습니다. OTel GenAI는 그것을 고칠 것입니다.

이 협약은 OpenTelemetry 의미 협약 그룹에서 2025-2026년에 정착되었다. 그들은 안정적인 속성 이름을 정의하므로 Datadog, Langfuse, Phoenix, OpenLLMetry, AgentOps 모두 동일한 범위를 분석합니다.

## 개념

### Span 계층

```
agent.invoke_agent  (top, INTERNAL span)
 ├── llm.chat       (CLIENT span)
 ├── tool.execute   (INTERNAL)
 │    └── mcp.call  (CLIENT span)
 ├── llm.chat       (CLIENT span)
 └── subagent.invoke (INTERNAL)
```

모든 것은 하나의 흔적 아이디 아래 서 있습니다. 스파인 아이디는 부모와 자녀 관계를 연결합니다.

### 요구되는 속성

2025~2026 세미콘에 따르면:

- `gen_ai.operation.name``"chat"``"text_completion"``"embeddings"``"execute_tool"``"invoke_agent"`- 그래
- `gen_ai.provider.name``"openai"``"anthropic"``"google"``"azure_openai"`- 그래
- `gen_ai.request.model` 요청된 모델 문자열 (예를 들어`"gpt-4o-2024-08-06"`)
- `gen_ai.response.model` 모델이 실제로 서비스했습니다.
- `gen_ai.usage.input_tokens`- `gen_ai.usage.output_tokens`- 그래
- `gen_ai.response.id` 상관관계를 위한 공급자 응답 ID

도구 범위:

- `gen_ai.tool.name` 도구 식별자
- `gen_ai.tool.call.id` 특정 호출 ID
- `gen_ai.tool.description` 도구 설명 (선택)

에이전트 기간:

- `gen_ai.agent.name`- `gen_ai.agent.id`- `gen_ai.agent.description`- 그래

### 스파인 종류

- `SpanKind.CLIENT`프로세스 경계를 넘는 호출 (LLM 제공자, MCP 서버)
- `SpanKind.INTERNAL`에이전트의 자신의 루프 단계와 도구 실행에

### 선택된 콘텐츠 캡처

기본적으로, 스파인은 메트릭과 타이밍을  입력이나 완료를 하지 않습니다. 큰 유용 부하와 PII는 기본적으로 종료됩니다.`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`그리고 특정 콘텐츠 캡처 환경으로 콘텐츠를 포함하도록 합니다.

### 스펜에 대한 이벤트

토큰 레벨 이벤트들은 스파드 이벤트로 추가될 수 있습니다.

- `gen_ai.content.prompt` 입력 메시지
- `gen_ai.content.completion` 출력 메시지
- `gen_ai.content.tool_call` 기록된 도구 호출

자세한 재생을 위한 시간 순서 내에 이벤트를 합니다.

### 수출자

OTel의 수출은 다음으로 이루어집니다.

- **Jaeger / Tempo.**오스, 현장
- **Langfuse.**LLM- 관찰성-특별한; 토큰 사용을 시각화합니다.
- **Arize Phoenix.**Evals + 추적 합성
- **Datadog.**상업적; 본래 파스`gen_ai.*`속성
- **Honeycomb.**기둥 중심, 질문 친화적

모두 OTLP, 문자 형식으로 사용되는데, 코드가 상관없어요.

### MCP를 통해 전파

MCP 클라이언트가 서버에 전화를 걸 때, W3C 추적 부모 헤더를 요청에 주입하십시오. 스트리메이블 HTTP는 표준 헤더를 지원합니다. Stdio는 HTTP 헤더를 원산적으로 휴대하지 않습니다. 스펙의 2026 로드맵은 `_meta.traceparent`JSON-RPC 호출에 대한 필드

그 전까지 배: `_meta`서버는 추적 아이디를 기록합니다.

### 측정

스펜과 함께, GenAI semconv는 측정값을 정의합니다:

- `gen_ai.client.token.usage` 히스토그램
- `gen_ai.client.operation.duration` 히스토그램
- `gen_ai.tool.execution.duration` 히스토그램

전화 통일에 대한 세부 사항이 필요하지 않은 패시보드에서 사용하십시오.

### AgentOps 계층

AgentOps (기립 2024) 은 GenAI 관측성 분야에 특화된 기술이다. 그것은 OTel 스랜을 자동으로 방출하기 위해 인기있는 프레임워크 (LangGraph, Pydantic AI, CrewAI) 를 엮어줍니다. 스택이 지원된 프레임워크를 사용하는 경우 유용합니다. 그렇지 않으면 수동 기기를 사용하십시오.

```figure
t3-span-waterfall
```

## 사용 하 고

`code/main.py`OTLP-JSON 형식에서) 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로

무엇을 살펴볼 수 있을까요?

- 추적 ID는 모든 영역에서 공유됩니다.
- 부모-아동 연결은 `parentSpanId`- 그래
- 필요성`gen_ai.*`속성은 포괄되어 있습니다.
- 콘텐츠 캡처는 기본적으로 종료됩니다. 한 시나리오에서는 env var를 통해 활성화됩니다.

## 선박

이 교훈은`outputs/skill-otel-genai-instrumentation.md`. 에이전트 코드베이스를 고려하면, 기술은 도구 계획을 생성합니다. 어디까지 스포드를 추가하고, 어떤 인재를 대상으로 할 것인지, 어떤 수출자를 대상으로 할 것인지.

## 운동

1. 달아`code/main.py`. 랜드를 계산하고 클라이언트와 내부의 양을 확인하세요.

2. 컨텐츠 캡처를 활성화하고 확인`gen_ai.content.prompt`그리고`gen_ai.content.completion`사건들이 발생하고 PII에 대한 영향은 주의해야 합니다.

3. 도구 실행 메트릭을 추가합니다 `gen_ai.tool.execution.duration`그리고 전화로 히스토그램 샘플로 발사합니다.

4. 부모 에이전트로부터 추적 부모의 범위를 MCP 요청에 전파합니다 `_meta.traceparent`MCP 서버에서 동일한 추적 아이디를 확인할 수 있습니다.

5. OTel GenAI semconv 스펙을 읽어 보세요. 이 수업 코드가 방출하지 않는 semconv에 나열된 한 속성을 확인하세요. 추가하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OTel | "OpenTelemetry" | Open standard for traces, metrics, logs |
| GenAI semconv | "GenAI semantic conventions" | Stable attribute names for LLM / tool / agent spans |
| `gen_ai.*` | "The attribute namespace" | All GenAI attributes share this prefix |
| Span | "Timed operation" | A unit of work with a start, end, and attributes |
| Trace | "Cross-span ancestry" | Tree of spans sharing a trace id |
| SpanKind | "CLIENT / SERVER / INTERNAL" | Hints about span direction |
| OTLP | "OpenTelemetry Line Protocol" | Wire format for exporters |
| Opt-in content | "Prompt / completion capture" | Off by default; env var to enable |
| traceparent | "W3C header" | Propagates trace context across services |
| Exporter | "Backend-specific shipper" | Component that sends spans to Jaeger / Datadog / etc. |

## 더 많은 읽기

- [OpenTelemetry — GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) GenAI의 범위, 측정 및 이벤트에 대한 가톨릭 협약
- [OpenTelemetry — GenAI spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/) LLM 및 도구 실행 기간 속성 목록
- [OpenTelemetry — GenAI agent spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/) 대리자 수준`invoke_agent`수면
- [open-telemetry/semantic-conventions — GenAI spans](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/gen-ai-spans.md) GitHub에서 호스팅된 진실의 원천
- [Datadog — LLM OTel semantic convention](https://www.datadoghq.com/blog/llm-otel-semantic-convention/) 생산 통합의 통행
