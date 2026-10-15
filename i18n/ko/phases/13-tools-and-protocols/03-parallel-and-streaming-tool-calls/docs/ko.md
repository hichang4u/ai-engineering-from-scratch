# 병렬 도구 호출 및 도구와 스트리밍

> 3개의 독립적인 날씨 검색이 세 가지 라운드 트리프로 나뉘어 있습니다. 이들을 병행으로 실행하고 전체 시간은 가장 느린 단일 호출으로 붕괴됩니다. 모든 국경 제공자는 이제 하나의 차례에 걸쳐 여러 도구 호출을 발송합니다. 보상은 실제입니다. 수도원 관료는 미묘합니다. 이 교훈은 두 가지 반을 걸립니다. 병행 팬 아웃과 스트리밍 논쟁 재조합, ID 상관관계 함정에 중점을 둔다.

**Type:** Build
**Languages:** Python (stdlib, thread pool + streaming harness)
**Prerequisites:** Phase 13 · 02 (function calling deep dive)
**Time:** ~75 minutes

## 학습 목표

- 왜 그런지 설명 해 주십시오`parallel_tool_calls: true`존재하고 언제 비활성화해야 하는지
- 동행 팬아웃 중에 스트리밍 된 논쟁 조각을 오른쪽 도구 호출 아이디에 상관관계하십시오.
- 부분으로 재조합`arguments`초기 분석 없이 전체 JSON에 문자열을 입력합니다.
- 세 도시의 날씨 기준을 실행하여 순서적 대 병렬 지연을 보여줍니다.

## 문제

병렬 전화 없이 "벤갈루, 도쿄, 취리히의 날씨가 어떠냐"는 질문에 답하는 에이전트는 이렇게 합니다.

```
user -> LLM
LLM -> call get_weather(Bengaluru)
host -> run executor, reply with result
LLM -> call get_weather(Tokyo)
host -> run executor, reply with result
LLM -> call get_weather(Zurich)
host -> run executor, reply with result
LLM -> final text answer
```

3개의 LLM 회전 여행이 있는데, 각각의 경우도 실행자의 지연시간을 지불합니다.

병렬 호출:

```
user -> LLM
LLM -> call get_weather(Bengaluru); call get_weather(Tokyo); call get_weather(Zurich)
host -> run all three executors concurrently, reply with three results
LLM -> final text answer
```

한 번의 LLM 회전 여행. 집행 시간은 세 가지의 최대이며 합이 아닙니다. OpenAI, Anthropic, Gemini의 생산 기준은 팬 아웃 작업 부하에서 60~70%의 벽 시계 감소를 보여줍니다.

가격은 상관관계 복잡성입니다. 세 개의 호출이 완료되면 순서가 없어지면 결과는 일치해야 합니다.`tool_call_id`그래서 모델은 그들을 순차적으로 배치 할 수 있습니다. 결과 스트림에, 당신은 실행하기 전에 전체 JSON에 부분적인 논증 조각을 집합해야합니다. Gemini 3는 같은 도구에 대한 두 개의 병렬 호출이 구별되지 않는 실제 세계의 문제를 해결하기 위해 부분적으로 고유 ID를 추가했습니다.

## 개념

### 병렬을 가능하게 하는

- **OpenAI.** `parallel_tool_calls: true`기본적으로  설정`false`세리얼을 강제하기 위해서요
- **Anthropic.**`disable_parallel_tool_use: false`(클로드 3.5 이상에서 기본 설정)`true`연쇄용으로
- **Gemini.**항상 평행가능합니다.`tool_config.function_calling_config.mode = "AUTO"`모델이 결정하도록 하죠.

도구가 순서 의존성을 갖는 경우 평행성을 비활성화 (`create_file`그럼`write_file`), 한 호출의 출력으로 다른 입력에 대해 알리는 경우 또는 속도 제한기가 팬 아웃을 처리할 수 없을 때.

### ID 상관관계

모델이 발송하는 모든 통화에는`id`호스트가 반환하는 모든 결과에는 동일한 아이디가 포함되어야 합니다. 이 없으면 결과는 모호합니다.

- **OpenAI.** `tool_call_id`도구 역할 메시지마다
- **Anthropic.** `tool_use_id`각`tool_result`블록
- **Gemini.** `id`각`functionResponse`(Temini 3 이상; Gemini 2는 동일한 이름의 병렬 호출을 위해 깨진 이름에 일치합니다).

### 동시에 통화

호스트는 각 호출의 실행자를 자신의 스레드, 코로틴 또는 원격 작업자에서 실행합니다. 가장 간단한 배너스는 스레드 풀을 사용합니다. 생산은 asyncio와`asyncio.gather`또는 구조화된 동시성. 완료 순서는 예측할 수 없습니다

일반적인 오류 중 하나는 완료 순서가 아닌 호출 목록 순서로 응답하는 것입니다. 이것은 일반적으로 모델이 관심있는 것 만이기 때문에 작동합니다.`tool_call_id`, 하지만 결과가 떨어지거나 복제되면, 오프 오더 제출은 디버깅을 더 어렵게 만듭니다.

### 스트리밍 도구 호출

모델이 스트리밍되면`arguments`3개의 별도의 부하의 세 개의 병렬 호출이 케이블에 연결됩니다.

공급자별 형태:

- **OpenAI.**모든 조각은`choices[0].delta.tool_calls[i].function.arguments`(부부 줄) 덩어리 `index`(콜 리스트에 위치)`id`처음 표시되면 JSON를 분석합니다`finish_reason = "tool_calls"`- 그래
- **Anthropic.**스트림 이벤트`message_start`그리고 한 번`content_block_start`타입을 가진 블록당`tool_use`(ID, 이름, 빈 입력)`content_block_delta`사건은`input_json_delta`덩어리`content_block_stop`모든 블록을 닫습니다.
- **Gemini.** `streamFunctionCallArguments`(비둥이 3개 이상) `functionCallId`트메니 3 이전에는 스트리밍이 한 번에 한 번의 완전한 전화를 반환했습니다.

### 부분 JSON 및 분석 초기 함정

당신은 분석할 수 없습니다`arguments`이 작업은 완료될 때까지 진행됩니다.`{"city": "Beng`유효하지 않으며 상승할 것입니다. 올바른 게이트는 제공자의 통화 종료 신호입니다.`finish_reason = "tool_calls"`, 앤트로피크`content_block_stop`아니면 쌍둥이의 스트림 엔드 이벤트`json.loads`. 보다 강력한 접근법은 구조가 완료되면 이벤트를 생성하는 점진적인 JSON 파서를 사용합니다. OpenAI의 스트리밍 가이드는 실시간 "생각" 지표를 보여주는 UX에 이것을 권장합니다. Brace 카운팅은 완전성 테스트로서 신뢰할 수 없습니다 ( 인용 문자열 내의 braces 또는 탈출 된 콘텐츠가 잘못된 긍정적 인 결과를 초래합니다) 그리고 비공식적 디버그 유리스틱으로만 사용해야합니다.

### 주문이 없는 완공

```
call_A: fast API, returns first
call_B: slow API, returns second
call_C: median API, returns third
```

호스트 응답은 여전히 다음과 같은 아이디를 인용해야 합니다.

```
[{role: "tool", tool_call_id: "call_A", content: ...},
 {role: "tool", tool_call_id: "call_B", content: ...},
 {role: "tool", tool_call_id: "call_C", content: ...}]
```

답변의 질서는 OpenAI 또는 Anthropic에서 정확성에는 중요하지 않습니다. ID가 일치하는 한 쌍둥이는 모든 질서를 받아들이습니다.

### 기준: 순서적 대 병렬

에 있는 `code/main.py`400, 600, 800 ms의 지연을 가진 세 개의 실행자를 시뮬레이션합니다. 순차적으로 1800 ms의 총에서 실행합니다. 평행적으로 최대 400, 600, 800) = 800 ms에서 실행합니다. 차이가 일정하지 않으며 비례적입니다. 따라서 도구 수와 함께 저축이 증가합니다.

실제 세계 경고: 평행 호출은 하류 API를 압박합니다. 10 가지 방식의 빈터링이 제한된 서비스에 실패합니다. 13 · 17 단계는 게이트웨이 수준의 압력을 포함합니다. 향후 단계에 다시 의미론을 시도할 계획입니다.

### 스트리밍 팬-아웃 벽 시계

모델 자체 스트리밍이 있다면, 모든 호출이 완료되는 것을 기다리지 않고 하나의 호출의 주장이 완료되면 실행을 시작할 수 있습니다. 이것은 최적화 OpenAI 문서이지만 모든 SDK가 노출되지 않습니다. 이 수업의 활용은 그것을합니다. 시뮬레이션 스트림이 완전한 주장 객체를 생성하면 호스트는 호출을 시작합니다.

```figure
tp-parallel-fanout
```

## 사용 하 고

`code/main.py`첫 번째는 3개의 시뮬레이션된 날씨 호출을 순차적으로 그리고 병렬적으로 실행합니다.`concurrent.futures.ThreadPoolExecutor`그리고 벽 시계 시간을 인쇄합니다. 두 번째 반은 가짜 스트리밍 응답을 재생합니다.`arguments`한 스트림에서 에 이 연결된 3개의 병렬 호출을 위해`StreamAccumulator`LLM도 없고 네트워크도 없고, 재조립 논리만

무엇을 살펴볼 수 있을까요?

- 순서 타이머는 1.8초, 병렬 타이머는 0.8초 같은 가짜 지연률을 나타냅니다.
- 축적기는 각 호출의 JSON가 완료되면만 ID를 버핑하고 분석함으로써 순서로부터 오는 덩어리를 처리합니다.
- 실행자는 ID의 주장이 마무리되면 시작됩니다. 모든 스트림이 끝나지 않은 후에 시작됩니다.

## 선박

이 교훈은`outputs/skill-parallel-call-safety-check.md`. 도구 레지스트리를 고려하면, 어떤 도구가 평행성이 안전하며, 주문 의존성을 가지고 있으며, 하류 요금 제한을 압도할 수 있는 기술 감사`parallel_safe`깃발

## 운동

1. 달아`code/main.py`그리고 시뮬레이션 지연을 변화시킵니다.`max/sum`(실제 실행은 스레드 스케줄링, 시리에리얼링, 그리고 리너스 오버헤드 때문에 이상적인 것에서 약간 벗어납니다.)

2. "통신 중 취소"의 경우 "부퍼를 떨어뜨리고 을 방출함으로써 을 처리하도록 축적 장치를 확장합니다.`cancelled`어떤 공급자가 이 사건을 명시적으로 문서화하고 있습니까?`content_block_stop`의미학과 OpenAI의`finish_reason: "length"`행동.

3.  로 로드 풀을 교체`asyncio.gather`. 둘 다 벤치마킹하세요. 아싱크에서 작은 승을 볼 수 있습니다. 컨텍스트 스위치 비용이 낮기 때문에, 하지만 실행자가 실제 I/O를 하면만.

4. 2개의 도구를 선택하여 평행하지 말아야 합니다 (예를 들어`create_file`그럼`write_file`  `ordering_dependency`그 그래프에 있는 평행 팬-아웃을 레지스트로 입력하고 문으로 입력합니다. 이것은 의존성 의식의 스케줄링의 최소한의 기계입니다.

5. OpenAI의 병렬 기능 호출 섹션과 Anthropic의 문서를 읽어보세요 `disable_parallel_tool_use`문서: 안드로픽이 병렬성을 비활성화 할 것을 권장하는 실제 도구 유형을 식별하십시오. (상술: 동일한 리소스에 따른 돌연변이).

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Parallel tool calls | "Fan-out in one turn" | Model emits multiple tool calls in a single assistant message |
| `parallel_tool_calls` | "OpenAI's flag" | Enable or disable multi-call emission |
| `disable_parallel_tool_use` | "Anthropic's inverse" | Opt-out flag; default is parallel enabled |
| Tool call id | "Correlation handle" | Per-call identifier the result message must echo |
| Accumulator | "Stream buffer" | Per-id string buffer for partial `arguments` chunks |
| Out-of-order completion | "Fastest first" | Parallel calls finish in unpredictable order; ids are the glue |
| Dependency graph | "Ordering constraints" | Tools whose outputs feed into inputs of other tools; cannot parallelize |
| Parse-early trap | "JSON.parse exploded" | Attempting to parse an incomplete `arguments` string |
| `streamFunctionCallArguments` | "Gemini 3 feature" | Streamed argument chunks with unique id per call |
| Completion-order reply | "Don't wait for all" | Reply with results as they arrive, keyed by id |

## 더 많은 읽기

- [OpenAI — Parallel function calling](https://platform.openai.com/docs/guides/function-calling#parallel-function-calling) 기본 동작 및 거부 표시
- [Anthropic — Parallel tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use)`disable_parallel_tool_use`그리고 결과 배팅
- [Google — Gemini function calling parallel section](https://ai.google.dev/gemini-api/docs/function-calling) ID와 관련된 동행 호출
- [OpenAI — Streaming responses with tools](https://platform.openai.com/docs/api-reference/responses-streaming) OpenAI 스트림에 대한 조각된 논증 재조합
- [Anthropic — Streaming messages](https://docs.anthropic.com/en/api/messages-streaming)`content_block_delta``input_json_delta`
