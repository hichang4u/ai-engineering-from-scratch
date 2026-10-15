# 신속한 캐시 및 컨텍스트 캐시

> 시스템 프롬프트는 4,000 토큰입니다. RAG 컨텍스트는 20,000 토큰입니다. 모든 요청과 함께 둘 다 전송합니다. 또한 두 가지 모두 위해 매번 지불합니다. 프롬프트 캐싱은 공급자가 그 프리픽스를 자신의 편에서 따뜻하게 유지하도록 해줍니다. 그리고 재사용에 대한 정상적인 비율의 10%를 청구합니다. 올바르게 사용하면 추론 비용을 50%~90% 및 첫 번째 토큰 지연 시간을 40%~85%로 줄입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 01 (Prompt Engineering), Phase 11 · 05 (Context Engineering), Phase 11 · 11 (Caching and Cost)
**Time:** ~60 minutes

## 문제

코딩 에이전트는 대화의 모든 회전에서 클로드에게 동일한 15,000 토큰 시스템 인턴을 보내죠.$3/M input tokens is $사용자 실제 메시지 전만인 입력 비용의 0.90 . 매일 10,000개의 대화로 곱하면 변하지 않는 텍스트에 대한 청구서는 하루에 9,000달러에 달한다.

품질을 손상시키지 않고 프롬프트를 줄일 수 없습니다. 당신은 그것을 보내지 않을 수 없습니다. 모델은 그것을 모든 차례에 필요로 합니다. 유일한 움직임은 공급자가 이미 본 사전값을 지불하는 것을 중단하는 것입니다.

이 움직임은 신속한 캐시입니다. 앤트로픽은 2024년 8월에 (2025년 1시간 연장된 TTL 변종으로) 출시했으며, OpenAI는 그 해 후 자동화했으며, 구글은 트메니 1.5와 함께 명시적인 컨텍스트 캐시링을 출시했으며, 세 가지 모두 현재 그들의 경계 모델에서 1급 기능으로 제공합니다.

## 개념

![Prompt caching: write once, read cheap](../assets/prompt-caching.svg)

**The mechanic.**요청의 사전이 최근 요청과 일치하면 제공자는 전 실행에서 KV 캐시를 다시 암호화하는 대신 제공합니다. 당신은 처음 작게 쓰기 프리미엄을 지불하고 다음 번에 큰 읽기 할인 혜택을 지불합니다.

**Three provider flavors in 2026.**

| Provider | API style | Hit discount | Write premium | Default TTL | Min cacheable |
|---------|-----------|--------------|---------------|-------------|---------------|
| Anthropic | Explicit `cache_control` markers on content blocks | 90% off input | 25% surcharge | 5 min (extendable to 1 hour) | 1,024 tokens (Sonnet/Opus), 2,048 (Haiku) |
| OpenAI | Automatic prefix detection | 50% off input | none | Up to 1 hour (best-effort) | 1,024 tokens |
| Google (Gemini) | Explicit `CachedContent` API | Storage-billed; read at ~25% of normal | Storage fee per token·hour | User-set (default 1 hour) | 4,096 tokens (Flash), 32,768 (Pro) |

**The invariant.**이 세 가지 캐시 사전값은 모두 있습니다. 요청들 사이에 어떤 토큰이 다르다면, 첫 번째 다른 토큰 이후 모든 것은 미스입니다. 상단에 * 안정적인 * 부분을, 아래쪽에 * 변수 * 부분을 넣으십시오.

### 캐시 친화적인 레이아웃

```
[system prompt]          <-- cache this
[tool definitions]       <-- cache this
[few-shot examples]      <-- cache this
[retrieved documents]    <-- cache if reused, else don't
[conversation history]   <-- cache up to last turn
[current user message]   <-- never cache (different every time)
```

명령어를 위반  사용자 메시지를 시스템 명령어 위에 올려, 몇 번의 샷  및 캐시의 충돌 사이에 역동적인 검색을 중단하십시오.

### 빗대어 계산

애너트로피크의 25% 쓰기 프리미엄은 금전적 비용을 절약하기 위해 캐시 블록이 적어도 두 번 읽어야한다는 것을 의미합니다. 1 write + 1 read은 요청 당 평균 0.675x 비용 (예산 32%); 1 write + 10 read은 평균 0.205x (예산 80%) 이다. 엄지손가락 규칙: TTL 내에서 최소 3 번 재사용할 것으로 예상되는 모든 것을 캐시하십시오.

```figure
prompt-cache-hit
```

## 건설 해

### 단계 1: 명시적인 표시가 있는 인트로피 prompt 캐시

```python
import anthropic

client = anthropic.Anthropic()

SYSTEM = [
    {
        "type": "text",
        "text": "You are a senior Python reviewer. Follow the rubric exactly.\n\n" + RUBRIC_15K_TOKENS,
        "cache_control": {"type": "ephemeral"},
    }
]

def review(code: str):
    return client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        system=SYSTEM,
        messages=[{"role": "user", "content": code}],
    )
```

`cache_control`마커는 5분 동안 블록을 저장하도록 Anthropic에 말합니다. 그 창 안에 다시 사용 하 고, 종료 후 다시 사용 하 고 다시 작성 합니다.

**Response usage fields:**

```python
response = review(code_a)
response.usage
# InputTokensUsage(
#     input_tokens=120,
#     cache_creation_input_tokens=15023,   # paid at 1.25x
#     cache_read_input_tokens=0,
#     output_tokens=340,
# )

response_b = review(code_b)
response_b.usage
# cache_creation_input_tokens=0
# cache_read_input_tokens=15023           # paid at 0.1x
```

CI 에서 두 필드를 모두 확인해 보세요`cache_read_input_tokens`요청에 따라 0으로 유지되며 캐시 키가 이동합니다.

### 단계 2: 1시간의 TTL 연장

장기적인 배트 작업에 있어서, 5분 간 정해진 기간은 작업 중 종료됩니다.`ttl`이 부분의 본문은

```python
{"type": "text", "text": RUBRIC, "cache_control": {"type": "ephemeral", "ttl": "1h"}}
```

1시간 TTL는 기기금액의 2배가 됩니다. 기기금액의 50%를 25퍼센트 대신 지불하지만, 5배 이상 사전을 재사용하는 모든 배트에서 빠르게 보상됩니다.

### 단계 3: OpenAI 자동 캐시

OpenAI는 구성할 수 있는 아무것도 주지 않습니다. 최근 요청에 해당하는 1,024개의 토큰 이상의 사전은 자동으로 50% 할인 혜택을 받게 됩니다.

```python
from openai import OpenAI
client = OpenAI()

resp = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},   # long and stable
        {"role": "user", "content": user_msg},
    ],
)
resp.usage.prompt_tokens_details.cached_tokens  # the discounted portion
```

캐시 친화적인 레이아웃 규칙이 적용됩니다. 두 가지 요소가 OpenAI의 캐시를 죽이고 Anthropic를 죽이지 않습니다.`user`필드 (캐시 키 컴포넌트로 사용된다) 및 재편 도구

### 단계 4: 쌍둥이 정면 컨텍스트 캐싱

트윈이는 캐시를 1급의 객체로 취급합니다.

```python
from google import genai
from google.genai import types

client = genai.Client()

cache = client.caches.create(
    model="gemini-3.8-flash",
    config=types.CreateCachedContentConfig(
        display_name="rubric-v3",
        system_instruction=RUBRIC,
        contents=[FEW_SHOT_EXAMPLES],
        ttl="3600s",
    ),
)

resp = client.models.generate_content(
    model="gemini-3.8-flash",
    contents=["Review this code:\n" + code],
    config=types.GenerateContentConfig(cached_content=cache.name),
)
```

트윈이는 캐시 사용 기간 동안 토큰·시간당 저장 비용을 지불하고, 정상적인 입력 속도 ~25%로 읽습니다. 이것은 며칠 동안 여러 세션에서 동일한 거대한 명령어를 재사용 할 때 올바른 모양입니다.

### 단계 5: 생산에서 타격률을 측정하는

보시다시피`code/main.py`1K 요청에 대한 작전/읽기/실점 계산을 추적하고 혼합 비용을 계산하는 시뮬레이션된 3 공급자 회계사. 게이트 배포는 목표 타격률을  대부분의 생산 인트로피 설정은 온화 후> 80% 읽기 분자를 볼 수 있습니다.

## 2026 년에도 여전히 선박되는 함정이

- **Dynamic timestamps at the top.** `"Current time: 2026-04-22 15:30:02"`시스템 명령어의 상단에 모든 요청이 실패합니다. 캐시 해체 지점 아래로 시간표를 이동합니다.
- **Tool reordering.**안정적인 순서로 도구를 Serialize  배포 사이의 명령적 리조프트는 모든 히트를 깨고.
- **Free-text near-duplicates.**"당신은 도움이 됩니다". vs "당신은 도움이 되는 보조입니다".
- **Too-small blocks.**애너트로피는 1,024 토큰의 바닥 (2,048개의 하이쿠) 를 강요합니다. 작은 블록은 침묵으로 캐쉬되지 않습니다.
- **Blind cost dashboards.**"인पुट 토큰"을 캐시와 캐시 없는 것으로 나눌 수 있습니다. 그렇지 않으면 트래픽의 하락은 캐시 승리와 같습니다.

## 사용 하 고

2026 캐시 스택:

| Situation | Pick |
|-----------|------|
| Agent with stable 10k+ system prompt, many turns | Anthropic `cache_control` with 5-min TTL |
| Batch job reusing a prefix for 30+ minutes | Anthropic with `ttl: "1h"` |
| Serverless endpoints on GPT-5, no custom infra | OpenAI automatic (just make your prefix stable and long) |
| Multi-day reuse of a giant code/doc corpus | Gemini explicit `CachedContent` |
| Cross-provider fallback | Keep the cacheable prefix layout identical across providers so any hit works |

사용자 메시지 계층에 대한 의미 캐싱 (Phase 11 · 11) 과 결합: prompt 캐싱 핸들 *token-identical* 재사용, 의미 캐싱 핸들 *meaning-identical* 재사용.

## 선박

저장`outputs/skill-prompt-caching-planner.md`이 부분의 본문은

```markdown
---
name: prompt-caching-planner
description: Design a cache-friendly prompt layout and pick the right provider caching mode.
version: 1.0.0
phase: 11
lesson: 15
tags: [llm-engineering, caching, cost]
---

Given a prompt (system + tools + few-shot + retrieval + history + user) and a usage profile (requests per hour, TTL needed, provider), output:

1. Layout. Reordered sections with a single cache breakpoint marked; explain which sections are stable, which are volatile.
2. Provider mode. Anthropic cache_control, OpenAI automatic, or Gemini CachedContent. Justify from TTL and reuse pattern.
3. Break-even. Expected reads per write within TTL; net cost vs no-cache with math.
4. Verification plan. CI assertion that cache_read_input_tokens > 0 on the second identical request; dashboard split by cached vs uncached tokens.
5. Failure modes. List the three most likely reasons the cache will miss in this setup (dynamic timestamp, tool reorder, near-duplicate text) and how you will prevent each.

Refuse to ship a cache plan that places a dynamic field above the breakpoint. Refuse to enable 1h TTL without a reuse count that makes the 2x write premium pay back.
```

## 운동

1. **Easy.**클로드에 대한 5,000 토큰 시스템 요청과 10회 대화를 해`cache_control`각 입력 토큰의 청구서를 보고하세요
2. **Medium.**신속한 템플릿과 요청 로그를 제공하여 제공자당 예상된 히트율과 달러 절약을 계산하는 테스트 리듬을 작성하십시오 (Anthropic 5m, Anthropic 1h, OpenAI 자동, Gemini 명시).
3. **Hard.**레이아웃 최적화 장치를 생성: 프롬프트와 표시된 필드의 목록을 제공합니다 `stable=True/False`, 메이저를 다시 작성하여 메이저가 가능한 최대 메이저가 가능한 위치에 놓습니다. 정보를 잃지 않고. 실제 인트로피크 엔드포인트에서 확인합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Prompt caching | "Makes long prompts cheap" | Reusing a provider-side KV-cache for matching prefixes; 50-90% discount on repeated input tokens. |
| `cache_control` | "The Anthropic marker" | Content-block attribute that declares "everything up to here is cacheable"; `{"type": "ephemeral"}`. |
| Cache write | "Paying the premium" | The first request that populates the cache; billed at ~1.25x input rate on Anthropic, free on OpenAI. |
| Cache read | "The discount" | Subsequent requests matching the prefix; billed at 10% (Anthropic), 50% (OpenAI), ~25% (Gemini). |
| TTL | "How long it lives" | Seconds the cache stays warm; Anthropic 5m default (extendable 1h), OpenAI best-effort up to 1h, Gemini user-set. |
| Extended TTL | "1-hour Anthropic cache" | `{"type": "ephemeral", "ttl": "1h"}`; 2x write premium but worth it for batch reuse. |
| Prefix match | "Why my cache missed" | Caches only hit when every token from the start up to the breakpoint is byte-identical. |
| Context caching (Gemini) | "The explicit one" | Google's named, storage-billed cache object; best for multi-day reuse of large corpora. |

## 더 많은 읽기

- [Anthropic — Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)`cache_control`1시간 TTL, 평정 테이블을 깨고
- [OpenAI — Prompt caching](https://platform.openai.com/docs/guides/prompt-caching) 자동 사전 일치
- [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching)`CachedContent`API 및 저장 가격
- [Anthropic engineering — Prompt caching for long-context workloads](https://www.anthropic.com/news/prompt-caching) 지연수 번호를 가진 원래 발사 포스트.
- 단계 11 · 05 (콘텍스트 엔지니어링)  캐시가 착륙할 수 있도록 프롬프트를 잘라내는 곳.
- 11 · 11 단계 (Caching and Cost)  사용자 메시지에서 의미적인 캐시로 패어 prompt 캐시
- [Pope et al., "Efficiently Scaling Transformer Inference" (2022)](https://arxiv.org/abs/2211.05102) 캐시 저장을 촉구하는 KV 캐시 메모리 모델은 사용자에게 노출됩니다. 캐시 된 사전값이 다시 읽기보다 ~ 10x 더 저렴하다는 이유를 설명합니다.
- [Agrawal et al., "SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills" (2023)](https://arxiv.org/abs/2308.16369) prefill은 단계적 인 간첩 캐시 단축키입니다. 이 논문에서는 TTFT가 TPOT에 영향을 받지 않는 동안 캐시에 영향을 미치지 않는 이유를 설명합니다.
- [Leviathan et al., "Fast Inference from Transformers via Speculative Decoding" (2023)](https://arxiv.org/abs/2211.17192) 프롬프트 캐싱은 추측적인 디코딩, 플래시 주의, MQA/GQA와 함께 추론 비용 곡선을 휘두르는 레버로 자리 잡고 있습니다. 다른 세 가지에 대해 읽어보십시오.
