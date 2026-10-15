# 함수 심층 다이빙 호출  OpenAI, 인류, 쌍둥이

> 2024년 3개 국경 제공업체들은 같은 도구 호출 루프에 합쳐서 다른 모든 것에 대해 분할했습니다.`tools`그리고`tool_calls`. 인류적 용도로 사용`tool_use`그리고`tool_result`쌍둥이들이 사용하는`functionDeclarations`이 수업은 3개의 코드를 서로 구분하여 한 공급자에 전송되는 코드를 포트할 때 깨지 않도록 합니다.

**Type:** Build
**Languages:** Python (stdlib, schema translators)
**Prerequisites:** Phase 13 · 01 (the tool interface)
**Time:** ~75 minutes

## 학습 목표

- OpenAI, Anthropic, Gemini 함수를 호출하는 유용하산 (선언, 호출, 결과) 사이의 세 가지 모양 차이점을 설명하십시오.
- 세 가지 공급자 형식 모두에 대한 하나의 도구 선언을 번역하고 엄격한 모드 제한이 다른 곳을 예측하십시오.
- 사용`tool_choice`각각의 공급업체는 강제, 금지 또는 자동 도구 선택 호출을
- 공급자마다 하드 제한 (툴 수, 스키마 깊이, 논증 길이가) 와 제한이 위반될 때 각자가 발사하는 오류 서명을 알고 있습니다.

## 문제

기능 호출 요청의 형태는 공급자마다 다릅니다. 2026 생산 스테이크에서 세 가지 구체적인 예는 다음과 같습니다.

**OpenAI Chat Completions / Responses API.**넌 통과해`tools: [{type: "function", function: {name, description, parameters, strict}}]`모델의 반응은 포함됩니다`choices[0].message.tool_calls: [{id, type: "function", function: {name, arguments}}]`어디`arguments`JSON 문자열을 분석해야 합니다. 엄격한 모드 (`strict: true`) 는 제한된 디코딩을 통해 스키마 준수에 부응하도록 합니다.

**Anthropic Messages API.**넌 통과해`tools: [{name, description, input_schema}]`그 답은`content: [{type: "text"}, {type: "tool_use", id, name, input}]`-`input`이미 분석되었습니다 (물질이 아닌 문자열이 아닙니다).`user``{type: "tool_result", tool_use_id, content}`블록

**Google Gemini API.**넌 통과해`tools: [{functionDeclarations: [{name, description, parameters}]}]`(기둥 아래)`functionDeclarations`) 의 답은`candidates[0].content.parts: [{functionCall: {name, args, id}}]`어디`id`쌍둥이 3에서 이상으로 평행 호출 상관관계를 위해 독특합니다.`{functionResponse: {name, id, response}}`- 그래

같은 루프, 다른 필드 이름, 다른 둥지를 틀, 다른 문자열 대 객체 협약, 다른 상관관계 메커니즘. OpenAI에 기상 에이전트를 작성하는 팀은 인트로피크에 2일간 포트를 지불하고, 또 다른 날에는 쌍둥이를 납품하기 위해 지불합니다.

이 수업은 세 가지 형식을 하나의 가톨릭 도구 선언과 가장자리에 있는 경로를 통합하는 번역기를 구축합니다. 13 · 17 단계는 동일한 패턴을 LLM 게이트웨이로 일반화합니다.

## 개념

### 공동 구조

모든 공급자는 다섯 가지 요건이 필요합니다.

1. **Tool list.**도구별 이름, 설명 및 입력 스케마
2. **Tool choice.**특정 도구를 강요하거나 도구를 금지하거나 모델이 결정하도록하십시오.
3. **Call emission.**구조화된 출력 도구와 논증의 이름
4. **Call id.**올바른 호출에 대한 응답을 상관관계하십시오 (동렬의 문제).
5. **Result injection.**결과와 통화에 연결되는 메시지 또는 블록

### 형태의 차이가, 필드별로

| Aspect | OpenAI | Anthropic | Gemini |
|--------|--------|-----------|--------|
| Declaration envelope | `{type: "function", function: {...}}` | `{name, description, input_schema}` | `{functionDeclarations: [{...}]}` |
| Schema field | `parameters` | `input_schema` | `parameters` |
| Response container | `tool_calls[]` on assistant message | `content[]` of type `tool_use` | `parts[]` of type `functionCall` |
| Arguments type | stringified JSON | parsed object | parsed object |
| Id format | `call_...` (OpenAI generates) | `toolu_...` (Anthropic) | UUID (Gemini 3+) |
| Result block | role `tool`, `tool_call_id` | `user` with `tool_result`, `tool_use_id` | `functionResponse` with matching `id` |
| Force-a-tool | `tool_choice: {type: "function", function: {name}}` | `tool_choice: {type: "tool", name}` | `tool_config: {function_calling_config: {mode: "ANY"}}` |
| Forbid tools | `tool_choice: "none"` | `tool_choice: {type: "none"}` | `mode: "NONE"` |
| Strict schema | `strict: true` | schema-is-schema (always enforced) | `responseSchema` at request level |

### 실제로 도달할 수 있는 한계

- **OpenAI.**요청에 따라 128개의 도구. 스케마 깊이 5. 논증 문자열 <= 8192 바이트. 엄격한 모드는 필요 없습니다 `$ref`아니`oneOf`- 그래`anyOf`- 그래`allOf`              `required`- 그래
- **Anthropic.**요청에 따라 64개의 도구. 스케마 깊이는 사실상 제한적이지만 실용적인 한계 10. 엄격한 모드 플래그가 없습니다. 스케마는 계약이며 모델은 준수하는 경향이 있습니다.
- **Gemini.**요청에 따라 64개의 함수. 스케마 유형은 OpenAPI 3.0 하위 집합 (JSON 스케마 2020-12) 이다. 동래 호출은 Gemini 3 이후 고유-ID이다.

### `tool_choice`행동

모두가 지원하는 3가지 모드, 다른 이름으로

- **Auto.**모델은 도구나 텍스트를 선택합니다
- **Required / Any.**모델은 적어도 하나의 도구를 호출해야 합니다.
- **None.**모델은 도구라고 부르지 않아

그리고 각 공급자에게 고유한 모드:

- **OpenAI.**이름에 따라 특정 도구를 강요하십시오.
- **Anthropic.**이름에 따라 특정 도구를 강요합니다.`disable_parallel_tool_use`플래그는 단일과 다중을 구분합니다.
- **Gemini.** `mode: "VALIDATED"`모델 의도를 고려하지 않고 모든 응답을 스키마 검증기를 통해 로팅합니다.

### 병렬 호출

오픈아이의`parallel_tool_calls: true`(전설) 한 보조 메시지에서 여러 개의 호출을 전송합니다. 당신은 모든 메시지를 실행하고`tool_call_id`. 인류학은 역사적으로 단편적 호출을 했습니다.`disable_parallel_tool_use: false`(Cloed 3.5) 에서 기본으로 멀티를 가능하게 한다. Gemini 2는 병렬 호출을 허용했지만 안정적인 ID를 제공하지 않았다. Gemini 3는 UUID를 추가하여 오프 오더 응답이 깨끗하게 상관관계를 맺는다.

### 스트리밍

세 가지 지원 스트리밍 도구 호출. 와이어 형식은 다릅니다:

- **OpenAI.**델타 덩어리`tool_calls[i].function.arguments`점진적으로 도착합니다.`finish_reason: "tool_calls"`- 그래
- **Anthropic.**블록 시작 / 블록 델타 / 블록 중지 이벤트. `input_json_delta`덩어리들은 부분적인 주장을 가지고 있습니다.
- **Gemini.** `streamFunctionCallArguments`(제3호의 신작) 은 `functionCallId`그래서 여러 개의 병렬 호출이 서로 연결될 수 있습니다.

13 · 03 단계 는 평행 + 스트리밍 재결합에 깊이 있게 들어가 있다. 이 수업은 선언 및 단일 호출 모양에 초점을 맞추고 있다.

### 오류 및 수리

무효 논증 오류도 다른 모습입니다.

- **OpenAI (non-strict).**모델 반환 `arguments: "{bad json}"`JSON 분석이 실패하면 오류 메시지가 주입되고 다시 호출합니다.
- **OpenAI (strict).**검증은 디코딩 중에 발생합니다. 유효하지 않은 JSON는 불가능하지만 `refusal`나타낼 수 있습니다.
- **Anthropic.** `input`예상치 못한 필드를 포함할 수 있습니다. 스케마는 자문입니다. 서버 측을 확인합니다.
- **Gemini.**OpenAPI 3.0 특이한 점:`enum`객체 필드에서 침묵으로 무시하고, 자신을 확인하십시오.

### 번역자 패턴

코드에서 카논िकल 도구 선언은 다음과 같습니다 (형태를 선택하세요):

```python
Tool(
    name="get_weather",
    description="Use when ...",
    input_schema={"type": "object", "properties": {...}, "required": [...]},
    strict=True,
)
```

3개의 작은 기능이 그것을 3개의 공급자 모양으로 번역합니다.`code/main.py`이 수업은 HTTP가 아닌 형태를 가르칩니다.

제작팀은 이 번역자를 `AbstractToolset`(피던틱 인공지능)`UniversalToolNode`(랑그라프) 또는`BaseTool`(LlamaIndex) 13 · 17 단계는 3가지 중 어느 하나 앞에서 OpenAI 모양의 API를 노출시키는 게이트웨이를 배포합니다.

```figure
function-call-args
```

## 사용 하 고

`code/main.py`한 가지 가톨릭을 정의합니다`Tool`데이터 클래스 및 OpenAI, Anthropic 및 Gemini 선언 JSON를 발송하는 세 개의 번역기. 그것은 다음 각 모양의 손으로 만든 제공자의 응답을 동일한 카논िकल 호출 객체로 분석하여 의미의 피부 아래 동일하다는 것을 보여줍니다. 실행하고 세 개의 선언을 옆으로 구별하십시오.

무엇을 살펴볼 수 있을까요?

- 세 개의 선언 블록은 단지 봉투와 필드 이름에 따라 다릅니다.
- 3개의 응답 블록은 호출이 어디에 위치하는지 (최고 레벨) 에 따라 다릅니다.`tool_calls``content[]`블록,`parts[]`출입)
- 한 명`canonical_call()`기능 추출`{id, name, args}`이 세 가지 반응 형태에서

## 선박

이 교훈은`outputs/skill-provider-portability-audit.md`. 기능 호출을 한 제공자에 대한 통합을 고려하면, 기술은 휴대성 감사를 생성합니다. 어느 제공자가 의존하는 제한, 어떤 필드가 이름을 변경해야 하며, 다른 제공자에게 포트 할 때 무엇이 끊어지는가.

## 운동

1. 달아`code/main.py`그리고 세 개의 제공자 선언 JSON가 모두 동일한 기본 내용을 연속화하는지 확인합니다`Tool`객체. 대법적 도구를 수정하여 enum 매개 변수를 추가하고 OpenAPI 기법을 처리하기 위해 Gemini 번역가만 필요한 것을 확인합니다.

2. `ListToolsResponse`                             `list_tools`OpenAI는 네이티브로 하나도 가지고 있지 않습니다. 이 비대칭을 참고하세요.

3. 시행`tool_choice`변환: 카논िकल 지도`ToolChoice(mode="force", tool_name="x")`3개의 공급자 모양으로`mode="any"`그리고`mode="none"`수업의 차이 표를 확인해 보세요.

4. 3개의 제공자 중 하나를 선택하고 그 함수 호출 가이드를 끝까지 읽어보십시오. 다른 두 가지 지원하지 않는 스키마 스펙에서 한 필드를 찾아보십시오.`strict`, 인류학`disable_parallel_tool_use`, 쌍둥이`function_calling_config.allowed_function_names`- 그래

5. 테스트 벡터를 작성: 선언된 스키마를 위반하는 도구 호출. 각 공급자의 검증기를 통해 실행 (강좌 01의 stdlib는 프록시 역할을 할 것입니다) 그리고 오류가 발생하는 것을 기록하십시오. 엄격성을 위해 어떤 공급자를 사용하는지 문서.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Function calling | "Tool use" | Provider-level API for structured tool-call emission |
| Tool declaration | "Tool spec" | Name + description + JSON Schema input payload |
| `tool_choice` | "Force / forbid" | Auto / required / none / specific-name modes |
| Strict mode | "Schema enforcement" | OpenAI flag that constrains decoding to match schema |
| `tool_use` block | "Anthropic's call shape" | Inline content block with id, name, input |
| `functionCall` part | "Gemini's call shape" | A `parts[]` entry containing name, args, and id |
| Arguments-as-string | "Stringified JSON" | OpenAI returns args as a JSON string, not an object |
| Parallel tool calls | "Fan-out in one turn" | Multiple tool calls in one assistant message |
| Refusal | "Model declines" | Strict-mode-only refusal block instead of a call |
| OpenAPI 3.0 subset | "Gemini schema quirk" | Gemini uses a JSON-Schema-like dialect with minor differences |

## 더 많은 읽기

- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) 엄격한 모드와 병렬 호출을 포함한 가공적 참조
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)`tool_use`그리고`tool_result`블록 의미론
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) 병렬 호출, 고유 ID 및 OpenAPI 하위 집합
- [Vertex AI — Function calling reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling) 쌍둥이의 기업 표면
- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) 엄격한 모드 스케마 집행 세부 사항
