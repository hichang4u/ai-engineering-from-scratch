# 도구 인터페이스  왜 에이전트가 구조화된 I/O가 필요한가

> 언어 모델은 토큰을 생성합니다. 프로그램에서는 동작을 수행합니다. 이 둘 사이의 격차는 도구 인터페이스입니다. 모델이 동작을 요청하고 호스트가 실행하도록 허용하는 계약입니다. 2026 년마다  함수는 OpenAI, Anthropic, Gemini에 호출합니다.`tools/call`; A2A의 작업 부분 은 동일한 4 단계 루프의 다른 코딩입니다. 이 수업은 루프에 이름을 붙이고 실행하는 최소한의 기계를 보여줍니다.

**Type:** Learn
**Languages:** Python (stdlib, no LLM)
**Prerequisites:** Phase 11 (LLM completion APIs)
**Time:** ~45 minutes

## 학습 목표

- 텍스트만 생성할 수 있는 LLM가 실제 세계에 대한 조치를 취할 수 없는 이유를 설명해 주십시오.
- 4 단계 도구 호출 루프를 그려 (describe → decide → execute → observe) 그리고 각 단계의 소유자를 지정하십시오.
- 도구 설명은 세 부분으로 작성하십시오. 이름, JSON 스키마 입력, 그리고 결정적 실행기 기능.
- 순수 도구와 부작용을 하는 도구들을 구별하고 왜 분할이 안전에 있어서 중요한지 설명한다.

## 문제

LLM는 다음 토큰에 대한 확률 분포를 발송합니다. 그것은 전체 출력 표면입니다. 채팅 모델에게 "지금의 베갈루루의 날씨는 무엇입니까?"라고 묻는다면, 그것은 믿을 수 있는 문장을 쓸 수 있지만, 그것은 날씨 API에 다이얼 할 수 없습니다. 문장은 우연히 옳을 수도 있습니다. 또는 세 일 구석.

그 격차를 좁히는 것은 도구 인터페이스의 목적입니다. 호스트 프로그램  당신의 에이전트 런타임, 클로드 데스크톱, 채팅GPT, 커서, 또는 사용자 지정 스크립트  모델에 호출 가능한 도구 목록을 광고합니다. 모델은 행동이 필요하다고 판단할 때 도구와 그 주장을 이름 붙인 구조화된 유용 부하를 발송합니다. 호스트는 이 페이로드를 분석하고, 도구를 실제로 실행하고, 결과를 다시 공급합니다. 모델이 더 이상 통화할 필요가 없다고 결정할 때까지 루프는 계속됩니다.

이 계약의 첫 번째 버전은 2023년 6월에 OpenAI의 "기능" 매개 변수로 발급되었다.`tool_use`클로드 2.1.의 블록`functionDeclarations`몇 달 후. 모든 공급자는 이제 동일한 형태를 노출합니다. JSON-Schema-typed 도구 목록, JSON-payload 도구 호출. 모델 컨텍스트 프로토콜 (2024년 11월) 은 계약을 일반화하여 하나의 도구 레지스트리가 모든 모델을 서비스합니다. A2A (2026년 4월, v1.0) 는 에이전트-대- 에이전트 위임에 동일한 원시적 레이어를 레이어했습니다.

4단계 루프는 이 모든 것의 밑에 있는 변수입니다. 13단계의 다른 모든 것은 정교한 것입니다.

## 개념

### 첫 번째 단계: 설명

호스트는 3개의 필드로 각 도구를 선언합니다.

- **Name.**안정적이고 기계적으로 읽을 수 있는 식별자`get_weather`날씨가 아닌
- **Description.**한 문항 의 자연어 간략 한 문장. "이용자 가 특정 도시 에 대한 현재 조건 에 대해 질문 할 때 사용 하십시오. 역사 자료 를 사용 하지 마십시오".
- **Input schema.**도구의 주장을 설명하는 JSON Schema 객체 (예안 2020-12)

모델은 목록을 수신합니다. 현대 공급자는 이러한 선언을 공급자 특정 템플릿을 사용하여 시스템 프롬프트에 일련적으로 배치합니다. 따라서 호출자는 구조화된 양식을만 처리합니다.

### 2단계: 결정

사용자의 메시지와 사용 가능한 도구들을 고려하면 모델은 세 가지 행동 중 하나를 선택합니다.

1. **Answer directly**문자 메시지, 도구 호출이 없습니다.
2. **Call one or more tools.**구조화된 호출 객체를 발송합니다.`parallel_tool_calls: true`(OpenAI와 Gemini에서 기본 설정, Anthropic에서 선택) 모델은 한 번 여러 번의 호출을 발송할 수 있습니다.
3. **Refuse.**엄격한 모드 구조화된 출력은 입력된 `refusal`전화가 아닌 블록

도구 호출의 유용 부하는 3개의 안정적인 필드를 가지고 있습니다: 호출`id`, 도구`name`, 그리고 JSON`arguments`아이디는 존재하기 때문에 호스트는 나중에 나오는 결과를 특정 호출과 상관관계를 맺을 수 있습니다.

### 3단계: 실행

호스트는 호출을 수신하고 선언된 스케마에 대한 주장을 검증하고 실행자를 실행합니다. 무효 주장은 모델이 필드를 망각하거나 잘못된 타입을 사용했다는 것을 의미합니다. 생산 호스트는 유효하지 않은 논증에 대해 세 가지 중 하나를 수행합니다. 빠르게 실패하고 모델을 오류로 표면합니다. 제한된 파서로 JSON를 수정하거나 프롬프트에 포함된 검증 오류로 모델을 다시 시도합니다.

실행자는 일반 코드입니다. 파이썬, 타입스크립트, 셸 명령어, 데이터베이스 쿼리. 그것은 일반적으로 문자열이지만 어떤 JSON 값이나 구조화된 콘텐츠 블록 (MCP에서 텍스트, 이미지 또는 리소스 참조) 이 될 수 있는 결과를 생성합니다. 결과는 일련화되어야 합니다.

### 4단계: 관찰

호스트는 대화에 도구 결과를 추가합니다 (예:`tool`   `id`) 를 다시 호출 합니다. 모델은 이제 도구 출력을 맥락에 가지고 있으며 최종 답변을 생성하거나 더 많은 호출을 요청할 수 있습니다. 모델이 호출을 발송하지 않거나 호스트가 반복 수를 위한 안전 한계를 달성하기 전까지 계속됩니다.

### 신뢰가 분해

도구는 안전에 중요한 두 가지 맛으로 제공됩니다.

- **Pure.**독서만, 결정적, 부작용이 없습니다.`get_weather``search_docs``get_current_time`- 추측적으로 전화할 수 있어요
- **Consequential.**변종 상태, 돈을 쓰고 사용자 데이터를 만집니다.`send_email``delete_file``execute_trade`- 게이트가 안 돼

메타의 2026 에 따르면 에이전트 보안에 대한 "두 가지 규칙"은 단일 턴이 최대 두 가지의 결합을 할 수 있다고 말합니다: 신뢰할 수 없는 입력, 민감한 데이터, 결과적 행동. 도구 인터페이스는 호출을 거부하거나 사용자 확인을 요구하거나 범위를 확장함으로써 해당 규칙을 시행하는 곳입니다. 전체 보안 장과 에이전트 수준의 권한 정책에 대한 단계 13 · 15을 참조하십시오.

### 루프가 사는 곳

| Context | Who describes | Who decides | Who executes |
|---------|---------------|-------------|--------------|
| Single-turn function calling (OpenAI/Anthropic/Gemini) | App developer | LLM | App developer |
| MCP | MCP server | LLM via MCP client | MCP server |
| A2A | Agent Card publisher | Calling agent | Called agent |
| Web browser (function-calling agent) | Browser extension / WebMCP | LLM | Browser runtime |

모든 곳에 같은 네 단계, 열 이름도 변하지만 구조는 변하지 않습니다.

### 왜 모델이 JSON를 발송하도록 하지 않는가?

"모델에 JSON에서 응답하도록 요청하십시오"는 사전 기능 호출 패턴이었습니다. 그것은 경계 모델에서 ~5에서 15%의 경우 실패하고 작은 모델에서는 훨씬 더 많은 경우입니다. 실패 모드는 결실된 브레이크, 후속 komma, 환각된 필드 및 잘못된 유형을 포함합니다. 그러면 JSON 수리 패스, 재 시도 또는 제한된 디코더가 필요합니다.

네이티브 함수 호출은 세 가지 이유로 더 좋습니다. 먼저, 공급자는 정확한 호출 모양에 따라 모델을 끝에서 끝으로 훈련합니다. 따라서 유효 JSON 비율은 엄격한 모드로 98~99%까지 올라갑니다. 둘째, 호출의 유용 부하는 자유 텍스트  내부에 있는 것이 아니라 자체 프로토콜 슬롯에 위치해 있기 때문에 도구 호출은 사용자 눈에 보이는 응답에 결코 누출되지 않습니다. 셋째, 공급자는 제한된 디코딩 (OpenAI의 엄격한 모드, Anthropic의 `tool_use`, 쌍둥이`responseSchema`) 출력으로 검증이 보장됩니다.

13 · 02 단계에서는 3개의 공급자 API가 나란히 진행되고, 13 · 04 단계에서는 구조화된 출력으로 깊이 들어가고 있습니다.

### 회로 단절기

이 루프는 모델이 호출을 종료하거나 호스트가 최대 회전 수를 달성하면 종료됩니다. 생산 호스트는 이것을 5에서 20 회전 사이에 설정합니다. 그 외에도, 당신은 거의 확실하게 모델이 나올 수 없는 루프에 있습니다. 클로드 코드는 기본적으로 20으로 설정됩니다. OpenAI 보조자 10; 커서의 에이전트 모드 25

대안  무제한 루프 은 "agent spent $400 in API calls overnight" 포스트모르테임으로 6개월마다 나타납니다.

14 · 12 단계는 오류 복구 및 자기 치유를 깊이 포함하고, 17 단계는 생산 속도 제한을 포함합니다.

### 여기서부터 13단계가

- 02~05 수업은 공급자 수준의 도구 호출 표면을 닦습니다.
- 6~14강은 MCP로 루프를 일반화합니다.
- 15~18강은 적대적인 서버, 적대적인 사용자, 인증되지 않은 원격 auth 표면으로부터 루프를 방어합니다.
- 19~22강좌는 요원 간 협업, 관찰 가능, 라우팅, 패키징까지 패턴을 확장합니다.
- 23강좌는 모든 원시물을 이용한 완전한 생태계를 배양합니다.

남은 모든 교훈은 이 4단계 루프의 정리한 과정입니다.

```figure
tp-tool-loop
```

## 사용 하 고

`code/main.py`LLM 없이 4 단계 루프를 실행합니다. 가짜 "결정자" 기능은 사용자 메시지에 패턴을 맞추어 모델을 시뮬레이션합니다. 실행자, 스케마 검증자 및 관찰 단계 가시가 실제입니다. 인쇄 가능한 중간 상태의 완전한 요청/ 응답 조레오그래피를 보기 위해 실행하고, 나중에 수업에서 가짜 결정자를 실제 제공자로 교체하십시오.

무엇을 살펴볼 수 있을까요?

- 도구 레지스트리는 도구마다 세 개의 필드를 보유하고 있습니다. 이름, 설명, 스케마 및 실행자 참조.
- 검증기는 stdlib에서만 작성된 최소 JSON 스키마 하위 집합 ( 타입, 요구, enum, min/max) 이다. 단계 13 · 04는 더 완전한 것을 배포한다.
- 루프의 반복수는 5으로 제한됩니다. 생산 에이전트는 이런 종류의 단속기가 필요합니다.

## 선박

이 교훈은`outputs/skill-tool-interface-reviewer.md`. 도구 정의 (명 + 설명 + 스키마 + 실행자 스케인) 의 초안을 고려하면, 기술은 루프 적합성을 위해 그것을 감사합니다. 이름 기계 안정적이며, 설명은 완전한 사용 브리프, 스키마는 JSON 스키마 2020-12을 올바르게 사용하고 있으며, 순수 대 결과 분류는 명시적입니다.

## 운동

1. 4번째 도구를 추가합니다`code/main.py`전화`get_stock_price(ticker)`. 그 설명은 "이용자가 지표로 현재 주식 가격을 요청할 때 사용한다. 역사적 가격이나 시장 요약에 사용하지 않는다".라고 적어 놓습니다.

2. 스키마 검증기를 깨고`arguments`객체는 필요한 필드를 놓치고 있으며, 실행 전에 호스트가 거부하는 것을 확인합니다. 다음에는 추가로 알려지지 않은 필드를 통해 전화를 걸어 결정합니다. 호스트가 거부하거나 무시해야합니까?

3. 배너스의 각 도구는 순수 또는 결과적으로 분류한다.`consequential: true`레지스트리 항목에 표시하여 필요한 경우, 다음 항목을 표시하고, 다음 항목을 변경하여, "이러한 도구가 선택될 때마다 사용자와 확인 할 것" 라인을 인쇄합니다. 이것은 모든 생산 호스트가 필요로 하는 확인 게이트의 모양입니다.

4. 네 단계 로 이루어진 루프를 종이 위에 그려서, 좋아하는 클라이언트 (클로드 데스크톱, 커서, 채팅GPT 또는 사용자 지정 스택) 에 대해 위쪽에 있는 공급자 기둥 테이블을 작성하여 MCP 특유의 변종과 비교하여 Fase 13 · 06에서 참조하십시오.

5. OpenAI의 함수 호출 안내서를 위부터 아래까지 읽어 보세요. 요청에 포함된 한 개의 필드를 식별하세요. 하지만 여기 제시된 네 단계 루프에 포함되지 않습니다. 추가된 내용을 설명하고 왜 필수적인 것이 아니라 편리하다는 것을 설명하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Tool | "A thing the model can call" | A triple of name + JSON-Schema-typed input + executor function |
| Function calling | "Native tool use" | Provider-level API support for emitting structured tool calls instead of prose |
| Tool call | "The model's request to act" | A JSON payload with `id`, `name`, `arguments` emitted by the model |
| Tool result | "What the tool returned" | The executor's output, wrapped in a `tool` role message with matching id |
| Parallel tool calls | "Many calls at once" | Multiple call objects in one model turn, independent and orderable by id |
| Strict mode | "Guaranteed JSON" | Constrained decoding that forces the model's output to validate against the declared schema |
| Pure tool | "Read-only tool" | No side effects; safe to re-run |
| Consequential tool | "Action tool" | Mutates external state; requires gate, audit, or user confirmation |
| Four-step loop | "The tool-call cycle" | describe → decide → execute → observe |
| Host | "Agent runtime" | The program that holds the tool registry, calls the model, and runs the executor |

## 더 많은 읽기

- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) OpenAI 스타일의 도구 선언 및 호출 형태에 대한 가공적 참조
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) 클로드의`tool_use`- `tool_result`블록 형식
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling)`functionDeclarations`그리고 쌍둥이에서 평행 호출의 의미론
- [Model Context Protocol — Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) 현재 무국립, 제공자-지배적인 도구 인터페이스의 일반화
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) 모든 현대 도구 API가 말하는 스키마 방언
