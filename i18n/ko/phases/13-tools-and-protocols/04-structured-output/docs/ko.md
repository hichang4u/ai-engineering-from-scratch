# 구조화된 출력  JSON 스키마, 피단틱, Zod, 제한된 디코딩

> "모델에 JSON를 귀찮게 반환하도록 요청하십시오"는 경우 5~15%까지 실패합니다. 심지어 국경 모델에서도. 구조화된 출력은 제한된 디코딩으로 그 격차를 완화합니다. 모델은 문자 그대로 스키마를 위반하는 토큰을 발송하는 것을 방지합니다. OpenAI의 엄격한 모드, Anthropic의 스키마 타입 도구 사용, Gemini의 `responseSchema`, 피단틱 인공지능`output_type`, 그리고 조드`.parse`이 수업은 스키마 검증기를 구축하고 엄격한 모드 계약 학습자가 모든 생산 추출 파이프라인에 사용할 것입니다.

**Type:** Build
**Languages:** Python (stdlib, JSON Schema 2020-12 subset)
**Prerequisites:** Phase 13 · 02 (function calling deep dive)
**Time:** ~75 minutes

## 학습 목표

- 올바른 제한을 사용하여 추출 목표 (enum, min/max, 요구 사항, 패턴) 에 대한 JSON 스키마 2020-12을 작성하십시오.
- 엄격한 모드와 제한된 디코딩이 "세대 후 유효성"에서 다른 보증을 제공하는 이유를 설명해 주십시오.
- 세 가지 실패 모드를 구분한다: 분석 오류, 스케마 위반, 모델 거부.
- 기기 수리 및 기기 거부 처리와 함께 추출 파이프라인을 배포하십시오.

## 문제

구매 주문 이메일을 읽는 에이전트는 무료 텍스트를 `{customer, line_items, total_usd}`세 가지 접근법

**Approach one: prompt for JSON.**"JSON에서 클라이언트 필드, 라인_아이템, 토트_유스드와 응답하십시오".는 프론터 모델에서 85% ~ 95% 정도 작동합니다. 6가지 방법으로 실패합니다.

**Approach two: validate after generation.**자유롭게 생성, 분석, 스케마에 대한 검증, 실패에 다시 시도. 신뢰할 수 있지만 비싼  당신은 다시 시도에 대해 지불, 그리고 단절 버그가 발생 한 추가 회전 비용.

**Approach three: constrained decoding.**제공자는 스키마를 디코드 시킬 때 실행한다. 유효하지 않은 토큰은 샘플링 배포에서 숨기며 출력이 분석되고 검증될 수 있는 보증이 있다. 실패는 하나의 모드로 붕괴된다: 거부 (모델은 입력이 스키마에 맞지 않는다고 결정한다).

2026년 모든 국경 공급업체는 3번 접근 방식을 도입합니다.

- **OpenAI.** `response_format: {type: "json_schema", strict: true}`더하기`refusal`모델이 떨어지면 응답에
- **Anthropic.**계획 집행`tool_use`입력값`stop_reason: "refusal"`그건 아무 것도 아니지만`end_turn`도구 없이 신호를 불러야 합니다.
- **Gemini.** `responseSchema`요청 수준에서; 2026년, Gemini는 선택된 타입에 대한 토큰 수준의 문법적 제약을 배포한다.
- **Pydantic AI.** `output_type=InvoiceModel`구조화된 `RunResult``InvoiceModel`- 그래
- **Zod (TypeScript).**Zod 스키마에 대한 공급자의 출력을 검증하는 실행 시간 파서; OpenAI의 `beta.chat.completions.parse`- 그래

공통의 끈은: 한 번 스케마를 선언하고 끝까지 실행합니다.

## 개념

### JSON 스키마 2020-12  언어 프랑카

모든 공급자는 JSON Schema 2020-12을 수용합니다. 가장 많이 사용하는 구성은:

- `type`: 중 한 명`object``array``string``number``integer``boolean``null`- 그래
- `properties`: 부제표에 대한 필드 이름 지도
- `required`: 표시되어야 하는 필드 이름 목록
- `enum`: 허용된 값의 닫힌 집합
- `minimum`- `maximum`(수수),`minLength`- `maxLength`- `pattern`(줄)
- `items`: 각 배열 요소에 적용되는 하위계획
- `additionalProperties`이 책:`false`추가 필드를 금지합니다 (전설은 모드에 따라 달라집니다).

OpenAI 엄격한 모드는 세 가지 요구 사항을 추가합니다. 모든 부동산은 `required``additionalProperties: false`모든 곳에 있고, 해결되지 않은 것은 없습니다.`$ref`만약 이 부분을 깨면 API가 요청 시 400을 반환합니다.

### 파이썬틱, 파이썬 결합

Pydantic v2는 데이터 클래스 모양의 모델에서 JSON 스키마를 생성합니다.`model_json_schema()`피단틱 인공지능은 이렇게 적어줍니다.

```python
class Invoice(BaseModel):
    customer: str
    line_items: list[LineItem]
    total_usd: Decimal
```

그리고 에이전트 프레임워크는 스케마를 OpenAI 엄격한 모드로 번역합니다.`input_schema`, 또는 쌍둥이`responseSchema`가장자리에 있는 모델의 출력은`Invoice`확인 오류가 증가합니다`ValidationError`입력 오류 경로를 가진

### Zod, 타입스크립트 결합

(중국어)`z.object({customer: z.string(), ...})`) 는 TS 부대입니다. OpenAI의 Node SDK는 노출합니다 `zodResponseFormat(Invoice)`API의 JSON 스키마의 유용 로드로 번역됩니다.

### 거절

엄격한 모드는 모델을 응답하도록 강요할 수 없습니다. 입력값이 스케마에 맞지 못한다면 ("메일은 시였지만 청구서가 아니었습니다"), 모델은 `refusal`이유 를 포함 하는 필드. 코드는 실패가 아니라 일등의 결과로 처리해야 합니다. 거절은 안전 신호로도 유용 합니다. 보호 된 내용의 이메일에서 신용 카드 번호를 추출하도록 요청 한 모델은 안전 이유와 함께 거절을 반환합니다.

### 개방형에서 제한된 디코딩

오픈 웨이트 구현은 세 가지 기술을 사용합니다.

1. **Grammar-based decoding**(`outlines``guidance``lm-format-enforcer`): 스케마에서 결정적 한정 자동기를 구축하고, 모든 단계에 FSM를 위반하는 토큰의 로그티를 마스크하십시오.
2. **Logit masking with a JSON parser**: 모델과 함께 스트리밍 JSON 파서를 잠금 단계로 실행하고, 모든 단계에 유효- 다음 토큰 세트를 계산합니다.
3. **Speculative decoding with a verifier**: 저렴한 드래프트 모델은 토큰을 제안하고, 검증자는 스키마를 시행합니다.

상업적 공급업체는 이러한 제품들을 뒤에서 선택합니다. 2026년 최신 기술은 짧은 구조화된 생산량보다 일반 생산량보다 더 빨라지고, 긴 생산량도 거의 같은 속도로 진행됩니다.

### 3가지 실패 모드

1. **Parse error.**출력은 유효 JSON가 아닙니다. 엄격한 모드에서는 발생할 수 없습니다. 여전히 엄격하지 않은 공급업체의 경우 발생할 수 있습니다.
2. **Schema violation.**출력 분석은 스키마를 위반하지만 엄격한 모드에서는 불가능합니다
3. **Refusal.**모델이 떨어지고, 타이핑 결과로 처리해야 합니다.

### 재시험 전략

엄격한 모드 (인тропо적 도구 사용, 비 엄격한 OpenAI, 오래된 트윈) 에서 벗어날 때, 복구 패턴은 다음과 같습니다.

```
generate -> parse -> validate -> if fail, inject error and retry, max 3x
```

한 번 재시험은 보통 충분합니다. 세 번 재시험은 약한 모델 플래크를 잡습니다. 세 번은 나쁜 스케마의 징후입니다. 모델은 일부 입력에 만족할 수 없으며, 프롬프트 또는 스케마가 수정되어야합니다.

### 작은 모델 지원

제한된 디코딩은 작은 모델에서 작동합니다. 문법 강제성을 가진 3B 파라미터 개방형 모델은 구조화된 작업에 원료 인턴링을 가진 70B 파라미터 모델보다 더 나은 성능을 발휘합니다. 이것은 구조화된 출력 생산에 중요한 주요 이유입니다. 그것은 모델 크기와 신뢰성을 분리합니다.

```figure
constrained-decoding
```

## 사용 하 고

`code/main.py`stdlib ( 타입, 요구, enum, min/max, 패턴, 항목, 추가 속성) 에 최소 JSON Schema 2020-12 검증기를 전송합니다.`Invoice`스키마 및 검증기를 통해 가짜 LLM 출력을 실행하여 분석 오류, 스키마 위반 및 거부 경로를 보여줍니다. 생산에서 제공자의 실제 응답에 대한 가짜 출력을 교환합니다.

무엇을 살펴볼 수 있을까요?

- 검증기는 입력된 `[ValidationError]`경로와 메시지가 표시된 목록입니다. 다시 시도하는 명령어에서 표시되는 형태입니다.
- 거부 지부는 다시 시도하지 않습니다. 입력된 거부를 기록하고 반환합니다. 14 · 09 단계에서는 거부를 안전 신호로 사용합니다.
- `additionalProperties: false`적대적 테스트 입력에 대한 화재 검사를 통해 엄격한 모드가 환각된 필드에 문을 닫는 이유를 보여준다.

## 선박

이 교훈은`outputs/skill-structured-output-designer.md`자유 텍스트 추출 목표 ( Faktura, 지원 티켓, 서사시, 등) 를 고려하면, 기술은 엄격한 모드 호환 JSON Schema 2020-12 및 그것을 반영하는 Pydantic 모델을 생성합니다.

## 운동

1. 달아`code/main.py`4번째 테스트 케이스를 추가해 주세요`total_usd`검증자가 거부하는 것을 확인합니다`minimum`제한 경로

2. 확정기를 지원하도록 확장합니다 `oneOf`차별을 하는 사람.`line_item`란 상품이나 서비스로 표시된`kind`엄격한 모드는 여기서 미묘한 규칙을 가지고 있습니다. OpenAI의 구조화된 출력 가이드 참조하십시오.

3. Pydantic BaseModel와 같은 청구서 스케마를 작성하고 비교`model_json_schema()`수동으로 롤링된 버전에서 생략되는 1 필드 피단틱 세트를 기본으로 식별하십시오.

4. 거부율을 측정하십시오. 추출이 불가능한 10개의 입력 자료를 구성하십시오. (곡 가사, 수학 증명, 빈 이메일) 그리고 엄격한 모드로 실제 제공자를 통해 실행하십시오. 거부와 환각된 출력들을 계산하십시오. 이것은 거부에 대한 인식의 재 시도에 대한 기본 진실입니다.

5. OpenAI의 구조화된 출력 가이드 를 꼭대기부터 아래로 읽어 보세요. 일반 JSON 스키마가 허용하는 엄격한 모드로 명시적으로 금지하는 구조물을 식별하세요. 다음에는 금지된 구조물을 본질적으로 사용하지 않는 구조를 설계하고 엄격하게 호환되도록 재조정합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| JSON Schema 2020-12 | "The schema spec" | IETF-draft schema dialect every modern provider speaks |
| Strict mode | "Guaranteed schema" | OpenAI flag that enforces schema via constrained decoding |
| Constrained decoding | "Logit masking" | Decode-time enforcement that masks invalid next-tokens |
| Refusal | "Model declines" | Typed outcome when input cannot fit the schema |
| Parse error | "Invalid JSON" | Output did not parse as JSON; impossible under strict |
| Schema violation | "Wrong shape" | Parsed but violated types / required / enum / range |
| `additionalProperties: false` | "No extras allowed" | Forbids unknown fields; required in OpenAI strict |
| Pydantic BaseModel | "Typed output" | Python class that emits and validates JSON Schema |
| Zod schema | "TypeScript output type" | TS runtime schema for provider output validation |
| Grammar enforcement | "Open-weights constrained decode" | FSM-based logit masking, as in outlines / guidance |

## 더 많은 읽기

- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) 엄격한 모드, 거부 및 스케마 요구 사항
- [OpenAI — Introducing structured outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) 2024년 8월 출범 후 디코딩 보증 설명
- [Pydantic AI — Output](https://ai.pydantic.dev/output/) 각 공급자에게 일련화된 output_type 결합을 입력
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) 가톨릭 규격
- [Microsoft — Structured outputs in Azure OpenAI](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs) 기업용 배치 노트 및 엄격한 모드 경고
