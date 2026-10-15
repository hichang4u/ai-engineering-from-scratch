# 구조화된 출력 및 제한된 디코딩

> JSON를 위한 LLM를 요청하세요. 대부분의 경우 JSON를 얻으세요. 생산에서 "대부분"는 문제입니다. 제한된 디코딩은 샘플링 전에 로그티트를 편집함으로써 "대부분"을 "항상"로 변환합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 문제

분류자는 LLM를 요청합니다. " {긍정적, 부정적, 중립적}의 하나를 반환합니다". 모델은 "감각은 긍정적입니다. 이 리뷰는 고객이 명시적으로 그들이 ... "라고 명시하기 때문에 압도적으로 유리한 것입니다. 당신의 분석기는 충돌합니다. 당신의 분류자의 F1는 0.0입니다.

자유형 생산은 계약이 아니라 제안입니다. 생산 시스템은 계약이 필요합니다.

2026년에 세 층이 존재합니다.

1. **Prompting.**예쁜 질문을 해 보세요. "JSON 객체를만 반환하세요".
2. **Native structured output APIs.**오픈AI`response_format`, 인류 도구 사용, 쌍둥이 JSON 모드 지원된 스키마에 신뢰할 수 있습니다. 공급자 잠금.
3. **Constrained decoding.**로그티를 생성 단계마다 수정하여 모델은 유효하지 않은 토큰을 발사 할 수 없습니다. 100% 건설적으로 유효합니다. 모든 로컬 모델에서 작동합니다.

이 교훈은 세 가지에 대한 직관과 어느 쪽에 도달해야 할 때를 알려줍니다.

## 개념

![Constrained decoding masking invalid tokens at each step](../assets/constrained-decoding.svg)

**How constrained decoding works.**각 세대 단계에 LLM는 전체 어휘 (~ 100k 토큰) 에 대한 논리 벡터를 생성합니다. *logit 프로세서는 모델과 샘플링 장치 사이에 위치한다. 목표 문법에서 현재 위치를 고려하여 어떤 토큰이 유효한지 계산하고, 레전스, 컨텍스트 무료 문법에서 모든 무효 토큰의 로그티를 음부 무한으로 설정합니다. 나머지 로그이트에 대한 소프트맥스는 유효한 연속에만 확률 질량을 넣습니다.

2026년 실시:

- **Outlines.**JSON 스키마 또는 Regex를 한계 상태 기계로 컴파일합니다. 모든 토큰은 $O(1)$FSM 기반의 재발전제도는 평평화되어야 합니다.
- **XGrammar / llguidance.**컨텍스트 무료 문법 엔진. 재발성 JSON 스키마를 처리. 거의 0 꼴의 디코딩 오버하드. OpenAI는 2025 년 구조화된 출력 구현에 대한 지침을 부여했습니다.
- **vLLM guided decoding.**내장된`guided_json``guided_regex``guided_choice``guided_grammar`라인, XGrammar, 또는 lm 형식 강제 백그랜드를 통해
- **Instructor.**Pydantic 기반 팩어 모든 LLM. 검증 실패에 대해 다시 시도합니다. 크로스 공급업체는 로그트를 수정하지 않습니다.

### 직관적 반대 결과

제한된 디코딩은 제한없는 생성보다 * 빠르다. 두 가지 이유. 첫째, 다음 토큰 검색 공간을 줄입니다. 둘째, 똑똑한 구현은 강제 토큰 (예: 스카프폴딩) 을 위해 토큰 생성을 완전히 건너뛰습니다.`{"name": "` 모든 바이트가 결정된다).

### 당신을 희생하는 함정이

현장 질서가 중요합니다.`answer`이전`reasoning`JSON는 유효합니다. 답은 틀렸습니다. 검증은 그것을 잡지 않습니다.

```json
// BAD
{"answer": "yes", "reasoning": "because ..."}

// GOOD
{"reasoning": "... therefore ...", "answer": "yes"}
```

스케마 필드 순서는 포맷이 아닌 논리입니다.

```figure
constrained-decoder
```

## 건설 해

### 단계 1: 처음부터 regex 제한된 세대

보시다시피`code/main.py`FSM의 독립적인 구현을 위한 핵심 아이디어는 30 라인입니다.

```python
def mask_logits(logits, valid_token_ids):
    mask = [float("-inf")] * len(logits)
    for tid in valid_token_ids:
        mask[tid] = logits[tid]
    return mask


def generate_constrained(model, tokenizer, prompt, fsm):
    ids = tokenizer.encode(prompt)
    state = fsm.initial_state
    while not fsm.is_accept(state):
        logits = model.next_token_logits(ids)
        valid = fsm.valid_tokens(state, tokenizer)
        logits = mask_logits(logits, valid)
        tok = sample(logits)
        ids.append(tok)
        state = fsm.transition(state, tok)
    return tokenizer.decode(ids)
```

FSM는 지금까지 우리가 만족한 문법의 어떤 부분을 추적합니다.`valid_tokens(state, tokenizer)`어떤 어휘 토큰이 FSM를 수용하는 길을 떠나지 않고 발전시킬 수 있는지 계산합니다.

### 단계 2: JSON 스케마의 스케일

```python
from pydantic import BaseModel
from typing import Literal
import outlines


class Review(BaseModel):
    sentiment: Literal["positive", "negative", "neutral"]
    confidence: float
    evidence_span: str


model = outlines.models.transformers("meta-llama/Llama-3.2-3B-Instruct")
generator = outlines.generate.json(model, Review)

result = generator("Classify: 'The wait staff was attentive and the food arrived hot.'")
print(result)
# Review(sentiment='positive', confidence=0.93, evidence_span='attentive ... hot')
```

검증 오류는 절대 없죠 FSM는 유효하지 않은 출력을 접근할 수 없게 합니다

### 단계 3: 제공자 아고스틱의 Pydantic의 교육자

```python
import instructor
from anthropic import Anthropic
from pydantic import BaseModel, Field


class Invoice(BaseModel):
    vendor: str
    total_usd: float = Field(ge=0)
    line_items: list[str]


client = instructor.from_anthropic(Anthropic())
invoice = client.messages.create(
    model="claude-opus-4-7",
    max_tokens=1024,
    response_model=Invoice,
    messages=[{"role": "user", "content": "Extract from: 'Acme Corp $420. Widget, Gizmo.'"}],
)
```

다른 메커니즘. 인스트럭터 로그티스를 만지지 않습니다. 스키마를 프롬프트에 포맷하고 출력을 파서하고 검증 실패를 다시 시도합니다. 기본 3 번. 모든 공급자와 함께 작동합니다. 다시 시도는 지연과 비용을 추가합니다. 크로스 공급자 휴대성은 판매 포인트입니다.

### 단계 4: 네이티브 공급자 API

```python
from openai import OpenAI

client = OpenAI()
response = client.responses.create(
    model="gpt-5",
    input=[{"role": "user", "content": "Classify: 'The food was cold.'"}],
    text={"format": {"type": "json_schema", "name": "sentiment",
          "schema": {"type": "object", "required": ["sentiment"],
                     "properties": {"sentiment": {"type": "string",
                                                  "enum": ["positive", "negative", "neutral"]}}}}},
)
print(response.output_parsed)
```

서버 측의 제한적인 디코딩, 지원된 스키마의 스케일라인과 신뢰성 평정, 로컬 모델 관리가 없습니다. 공급자에게 잠겨 있습니다.

## 함정

- **Recursive schemas.**정해진 깊이로 회귀를 평평하게 하는 라인 (output) 은 나무 구조로 구성된 결과 (nested comments, AST) 에 XGrammar 또는 llguidance (CFG 기반) 가 필요합니다.
- **Huge enums.**10,000 옵션 엔럼은 천천히 컴파일하거나 시간으로 종료됩니다. 리트리버로 전환: 우선 최고 후보자를 예측하고, 그 후보로 제한합니다.
- **Grammar too strict.**힘`date: "YYYY-MM-DD"`regex 및 모델은 출력할 수 없습니다`"unknown"`모형은 날짜를 발명함으로써 보상합니다.`null`또는 경호가
- **Premature commitment.**위에서 현장 순서적 함정이 보이세요. 항상 사유를 먼저 생각하세요.
- **Vendor JSON mode without schema.**순수한 JSON 모드는 유효한 JSON만을 보장하고, 유효하지 않습니다 * 귀하의 사용 사례에 대한 *. 항상 완전한 스케마를 제공하십시오.

## 사용 하 고

2026년 스택:

| Situation | Pick |
|-----------|------|
| OpenAI/Anthropic/Google model, simple schema | Native vendor structured output |
| Any provider, Pydantic workflow, can tolerate retries | Instructor |
| Local model, need 100% validity, flat schema | Outlines (FSM) |
| Local model, recursive schema | XGrammar or llguidance |
| Self-hosted inference server | vLLM guided decoding |
| Batch processing with retries acceptable | Instructor + cheapest model |

## 선박

`outputs/skill-structured-output-picker.md`이 부분의 본문은

```markdown
---
name: structured-output-picker
description: Choose a structured output approach, schema design, and validation plan.
version: 1.0.0
phase: 5
lesson: 20
tags: [nlp, llm, structured-output]
---

Given a use case (provider, latency budget, schema complexity, failure tolerance), output:

1. Mechanism. Native vendor structured output, Instructor retries, Outlines FSM, or XGrammar CFG. One-sentence reason.
2. Schema design. Field order (reasoning first, answer last), nullable fields for "unknown", enum vs regex, required fields.
3. Failure strategy. Max retries, fallback model, graceful `null` handling, out-of-distribution refusal.
4. Validation plan. Schema compliance rate (target 100%), semantic validity (LLM-judge), field-coverage rate, latency p50/p99.

Refuse any design that puts `answer` or `decision` before reasoning fields. Refuse to use bare JSON mode without a schema. Flag recursive schemas behind an FSM-only library.
```

## 운동

1. **Easy.** 제한된 디코딩 없이 작은 열린 무게 모델 (예를 들어, Llama-3.2-3B) 을 작성합니다.`Review(sentiment, confidence, evidence_span)`100개의 리뷰에서 유효한 JSON로 분석되는 분자를 측정합니다.
2. **Medium.**JSON 모드로 동일한 코퍼스. 컴플라이언스 속도, 지연 및 의미 정확성을 비교하십시오.
3. **Hard.**전화 번호에 Regex 제한 디코더를 처음부터 구현 (`\d{3}-\d{3}-\d{4}`) 1000개의 샘플에서 무효 출력 0개를 확인한다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Constrained decoding | Force valid output | Mask invalid-token logits at every generation step. |
| Logit processor | The thing that constrains | Function: `(logits, state) -> masked_logits`. |
| FSM | Finite-state machine | Compiled grammar representation; $O(1)$ valid-next-token lookup. |
| CFG | Context-free grammar | Grammar that handles recursion; slower but more expressive than FSM. |
| Schema field order | Does it matter? | Yes — first field commits; always put reasoning before answer. |
| Guided decoding | vLLM's name for it | Same concept, integrated into the inference server. |
| JSON mode | OpenAI's early version | Guarantees JSON syntax; does NOT guarantee schema match. |

## 더 많은 읽기

- [Willard, Louf (2023). Efficient Guided Generation for LLMs](https://arxiv.org/abs/2307.09702) 아웃라인스 논문
- [XGrammar paper (2024)](https://arxiv.org/abs/2411.15100) CFG 기반의 빠른 제한적 디코딩.
- [vLLM — Structured Outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html) 추론 서버 통합
- [OpenAI — Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) API 참조 + 고차
- [Instructor library](https://python.useinstructor.com/) Pydantic+는 공급자 간 재시험을 합니다.
- [JSONSchemaBench (2025)](https://arxiv.org/abs/2501.10868) 벤치마킹 6 제한된 디코딩 프레임워크
