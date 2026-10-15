# 오픈텔레미트리 GenAI 의미 협약

> 오픈텔레미트리의 GenAI SIG (개발된 2024년 4월) 는 에이전트 텔레미트리의 표준 스키마를 정의합니다. 스팸 이름, 속성 및 콘텐츠 캡처 규칙은 공급업체들 간에 합쳐져 있으므로 에이전트 추적은 Datadog, Grafana, Jaeger 및 Honeycomb에서 같은 것을 의미합니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 24 (Observability Platforms)
**Time:** ~60 minutes

## 학습 목표

- GenAI 범위를 범주별로 지정하십시오: 모델/클라이언트, 에이전트, 도구.
- 구별하라`invoke_agent`클라이언트 vs 내부 기간과 각각의 적용 시점
- 최고 수준의 GenAI 속성을 나열하십시오: 공급자 이름, 요청 모델, 데이터 소스 ID.
- 콘텐츠 캡처 계약에 대해 설명: 선택,`OTEL_SEMCONV_STABILITY_OPT_IN`, 외부 참조 권고

## 문제

모든 공급자는 자신의 스펜 이름을 발명합니다. 운영 팀은 프레임워크에 따라 패시보드를 만듭니다. 오픈텔레미트리의 GenAI SIG는 전체 생태계 목표의 한 표준을 정의함으로써 이것을 수정합니다.

## 개념

### 범주 분류

1. **Model / client spans.**원소 LLM 호출을 커버. 제공자 SDK (Anthropic, OpenAI, Bedrock) 및 프레임워크 모델 어댑터에서 발행됩니다.
2. **Agent spans.** `create_agent`(대리인이 만들어질 때) 그리고 `invoke_agent`(이런 식으로 실행될 때)
3. **Tool spans.**도구 호출에 대한 하나; 부모-아동 관계로 에이전트 스포드에 연결됩니다.

### 에이전트 스펜 이름

- 스페인어 이름: `invoke_agent {gen_ai.agent.name}`이름만 붙이면 `invoke_agent`- 그래
- 스탠형:
  - **CLIENT** 원격 에이전트 서비스 (OpenAI 보조 API, Bedrock 에이전트)
  - **INTERNAL** 프로세스 중인 에이전트 프레임워크 (LangChain, CrewAI, 로컬 ReAct)

### 주요 속성

- `gen_ai.provider.name``anthropic``openai``aws.bedrock``google.vertex`- 그래
- `gen_ai.request.model` 모델 ID
- `gen_ai.response.model` 해결된 모델 (로팅으로 인해 요청과 다를 수 있습니다).
- `gen_ai.agent.name` 대리인의 신분증
- `gen_ai.operation.name``chat``completion``invoke_agent``tool_call`- 그래
- `gen_ai.data_source.id` RAG: 어떤 소재 또는 매장에 대한 상담이 이루어졌는가.

기술에 대한 구체적인 협약은 인тропо틱, 아저 AI 인퍼런스, AWS 베드록, 오픈AI에 대한 것입니다.

### 내용 캡처

기본 규칙: 기기들은 기본으로 입력/출력들을 캡처하지 않아야 합니다. 캡처는 다음을 통해 선택됩니다:

- `gen_ai.system_instructions`
- `gen_ai.input.messages`
- `gen_ai.output.messages`

권장 생산 패턴: 외부에서 콘텐츠를 저장 (S3, 로그 저장), 에 참조를 기록 (포인터 ID, 시사하지 않습니다). 이것은 관찰 가능하도록 연결된 레슨 27 콘텐츠 중독 방어입니다.

### 안정성

대부분의 컨벤션은 2026년 3월부터 실험적인 프로그램입니다.

```
OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental
```

데이터도그 v1.37+ 지도 GenAI는 LLM 관찰성 스케마에 네이티브로 속성을 부여합니다. 다른 백엔드 (Grafana, Honeycomb, Jaeger) 는 원료 속성을 지원합니다.

### 이 패턴이 잘못되는 곳

- **Capturing full prompts in spans.**정보, 비밀, 고객 데이터, ops가 읽을 수 있는 추적 자료
- **No `gen_ai.provider.name`.**여러 공급자 패시보드는 속성이 없어지면 깨집니다.
- **Spans without parent links.**고아 도구는 항상 맥락을 퍼뜨립니다.
- **Not setting stability opt-in.**여러분의 속성은 백엔드 업그레이드 시 이름이 변경될 수 있습니다.

```figure
ae-genai-span-tree
```

## 건설 해

`code/main.py`GenAI 협약에 해당하는 stdlib span emitter를 구현합니다.

- `Span`GenAI 속성 스케마를 사용함
- `Tracer``start_span`, 둥지를 틀어 놓은
- 스크립트된 에이전트가 발사합니다:`create_agent``invoke_agent`(내용), 도구에 대한 팽창,`chat`LLM 초청 기간
- 외부에서 명령어를 저장하고 랜에 ID를 기록하는 콘텐츠 캡처 모드

실행하세요:

```
python3 code/main.py
```

출력: 필요한 모든 GenAI 속성을 가진 스팸 트리, 그리고 선택 내용 참조를 보여주는 "외부 스토어".

## 사용 하 고

- **Datadog LLM Observability**(v1.37+) 지도 속성은 원산적으로
- **Langfuse / Phoenix / Opik**(강좌 24)  생태계를 자동으로 도구로 만드는 것.
- **Jaeger / Honeycomb / Grafana Tempo** 원료 OTel 추적; GenAI 속성에서 패시보드를 구축
- **Self-hosted** GenAI 프로세서로 OTel 컬렉터를 실행하세요.

## 선박

`outputs/skill-otel-genai.md`OTel GenAI의 전선은 기존의 에이전트로 확장되어 콘텐츠 캡처 기본 설정 및 외부 참조 저장 장치가 있습니다.

## 운동

1. 1번 수업을 재현하는 `invoke_agent`(내용) + 도구당 스펜스. Jaeger 인스턴스로 전송합니다.
2. " 참조만 " 모드에서 콘텐츠 캡처를 추가합니다. SQLite에 대한 요청, 스파인 속성은 라인 ID만 포함합니다.
3. 스펙을 읽어보세요`gen_ai.data_source.id`- 수업 09기록 검색에 연결해 주세요
4. 세트 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`그리고 당신의 속성이 수집가에게 이름이 바뀌지 않았는지 확인해 보세요.
5. 단 하나의 GenAI 속성에서 "어떤 도구 오류가 어떤 모델과 상관관계를 맺고 있다"는 데시보드를 구축한다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GenAI SIG | "OpenTelemetry GenAI group" | OTel working group defining the schema |
| invoke_agent | "Agent span" | Name of the span representing an agent run |
| CLIENT span | "Remote call" | Span for a call to a remote agent service |
| INTERNAL span | "In-process" | Span for an in-process agent run |
| gen_ai.provider.name | "Provider" | anthropic / openai / aws.bedrock / google.vertex |
| gen_ai.data_source.id | "RAG source" | Which corpus/store a retrieval hit |
| Content capture | "Prompt logging" | Opt-in capture of messages; store externally in prod |
| Stability opt-in | "Preview mode" | Env var to pin experimental conventions |

## 더 많은 읽기

- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 사양
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 기본으로 GenAI 범위를
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) OTel 랜드는 내장되어 있습니다
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) W3C 추적 컨텍스트 퍼포먼스
