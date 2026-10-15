# 장기적 평가  NIAH, RULER, LongBench, MRCR

> 트메니 3 프로는 10M 컨텍스트 토큰을 광고합니다. 1M 토큰에서는 8 바늘 MRCR가 26.3%로 떨어집니다. 광고 ≠ 사용가능합니다. 장 컨텍스트 평가는 당신이 배포하는 모델의 실제 용량을 알려줍니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 13 (Question Answering), Phase 5 · 23 (Chunking Strategies)
**Time:** ~60 minutes

## 문제

200 페이지의 계약이 있습니다. 모델은 1M 토큰 컨텍스트를 주장합니다. 당신은 계약을 붙여서 " 종료 조항은 무엇입니까?"라고 묻습니다. 모델은 을 답하지만 표면 페이지에서 답변합니다. 왜냐하면 종료 조항은 모델이 실제로 참석하는 곳에서 120k 토큰 깊이에 위치하고 있기 때문입니다.

2026년 컨텍스트-역량 격차입니다. 스펙시트는 1M 또는 10M라고 말합니다. 현실은 60-70%가 사용가능하다고 말합니다. "사용가능"는 작업에 달려 있습니다.

- **Retrieval (single needle in haystack):**거의 완벽한 제품으로,
- **Multi-hop / aggregation:**대부분의 모델에서 약 128k를 돌파한다.
- **Reasoning over dispersed facts:**첫 번째 실패 임무입니다.

장 контекст 평가는 이러한 축을 측정합니다. 이 수업은 기준표, 각각의 실제 측정 사항과

## 개념

![NIAH baseline, RULER multi-task, LongBench holistic](../assets/long-context-eval.svg)

**Needle-in-a-Haystack (NIAH, 2023).**한 장의 맥락에서 통제된 깊이에 사실 ("마법 단어 인애널") 을 배치하십시오. 모델을 검색하도록 요청하십시오. 깊이 × 길이를 스캔하십시오. 원래의 긴 맥락 기준. 경계 모델은 이제 이것을 포화합니다. 그것은 필요하지만 충분하지 않은 기본 라인입니다.

**RULER (Nvidia, 2024).**4 가지 범주에서 13 가지 작업 유형: 검색 ( 단일 / 멀티 키 / 멀티 값), 멀티 홉 추적 (변수 추적), 집합 (공동 단어 주파수), QA. 구성 가능한 컨텍스트 길이는 (4k에서 128k+). NIAH를 포화하지만 멀티 홉에 실패하는 모델을 공개합니다. 2024 년 출시에서 32k+ 컨텍스트를 주장하는 17 가지 모델 중 절반만이 32k+ 품질을 유지했습니다.

**LongBench v2 (2024).**503개의 다중 선택 질문, 8k-2M 단어 맥락, 여섯 가지 작업 카테고리: 단일 문서 QA, 다 문서 QA, 장기간 맥락 학습, 긴 대화, 코드 레포, 긴 구조화된 데이터. 실제 장기간 맥락 행동의 생산 기준.

**MRCR (Multi-Round Coreference Resolution).**8개 바늘, 24개 바늘, 100개 바늘의 변종으로 모델이 얼마나 많은 사실을 돌릴 수 있는지 알려줍니다.

**NoLiMa.**"언어학적인 바늘" 이 바늘과 질의는 문자적으로 겹치지 않습니다. 검색은 한 단계의 의미적 추론을 필요로 합니다. NIAH보다 더 어렵습니다.

**HELMET.**많은 서류를 연결하고, 모든 사람에게 질문을 던지고, 선택적인 관심을 테스트합니다.

**BABILong.**비관적인 잔디줄기 안에 논리 체인을 심사하고, 단지 검색을 하는 것이 아니라

### 실제로 보고해야 할 사항

- **Advertised context window.**스펙 시트 번호
- **Effective retrieval length.**NIAH가 어느 한 문턱에서 통과한다 (예를 들어 90%).
- **Effective reasoning length.**그 문턱에서 멀티-홉 또는 집합 통과.
- **Degradation curve.**정확성 vs 컨텍스트 길이는 작업 유형에 따라 표시됩니다.

두 개의 숫자가 있습니다. 검색 효과와 논리 효과. 일반적으로 논리 효과는 광고 창의 25-50%입니다.

```figure
gx-niah-decay
```

## 건설 해

### 단계 1: 사용자 지정 도메인 NIAH

보시다시피`code/main.py`골격:

```python
def build_haystack(filler_text, needle, depth_ratio, total_tokens):
    if not (0.0 <= depth_ratio <= 1.0):
        raise ValueError(f"depth_ratio must be in [0, 1], got {depth_ratio}")
    if total_tokens <= 0:
        raise ValueError(f"total_tokens must be positive, got {total_tokens}")

    filler_tokens = tokenize(filler_text)
    needle_tokens = tokenize(needle)
    if not filler_tokens:
        raise ValueError("filler_text produced no tokens")

    # Repeat filler until long enough to fill the haystack body.
    body_len = max(total_tokens - len(needle_tokens), 0)
    while len(filler_tokens) < body_len:
        filler_tokens = filler_tokens + filler_tokens
    filler_tokens = filler_tokens[:body_len]

    insert_at = min(int(body_len * depth_ratio), body_len)
    haystack = filler_tokens[:insert_at] + needle_tokens + filler_tokens[insert_at:]
    return " ".join(haystack)


def score_niah(model, haystack, question, expected):
    answer = model.complete(f"Context: {haystack}\nQ: {question}\nA:", max_tokens=50)
    return 1 if expected.lower() in answer.lower() else 0
```

 扫`depth_ratio`∈ {0, 0.25, 0.5, 0.75, 1.0} × `total_tokens`∈ {1k, 4k, 16k, 64k}. 열지도를 그려보세요. 이것은 목표 모델의 NIAH 카드입니다.

### 단계 2: 다선 바늘 변종

```python
def build_multi_needle(filler, needles, total_tokens):
    depths = [0.1, 0.4, 0.7]
    chunks = [filler[:int(total_tokens * 0.1)]]
    for depth, needle in zip(depths, needles):
        chunks.append(needle)
        next_chunk = filler[int(total_tokens * depth): int(total_tokens * (depth + 0.3))]
        chunks.append(next_chunk)
    return " ".join(chunks)
```

"세 가지 마법 단어 는 무엇 입니까?" 같은 질문 들 은 모두 를 검색 하는 것 이 필요합니다. 단일 바늘 의 성공 은 여러 바늘 의 성공 을 예측 하는 것 이 아닙니다.

### 단계 3: 멀티-홉 변수 추적 (RULER 스타일)

```python
haystack = """X1 = 42. ... (filler) ... X2 = X1 + 10. ... (filler) ... X3 = X2 * 2."""
question = "What is X3?"
```

답은 세 가지 작업을 묶어야 합니다. 128k의 프론티어 모델은 종종 50-70%의 정확성을 떨어뜨립니다.

### 단계 4: 롱벤치 v2

```python
from datasets import load_dataset
longbench = load_dataset("THUDM/LongBench-v2")

def eval_model_on_longbench(model, subset="single-doc-qa"):
    tasks = [x for x in longbench["test"] if x["task"] == subset]
    correct = 0
    for x in tasks:
        answer = model.complete(x["context"] + "\n\nQ: " + x["question"], max_tokens=20)
        if normalize(answer) == normalize(x["answer"]):
            correct += 1
    return correct / len(tasks)
```

범주별 정확성을 보고합니다. 합계 점수는 작업 수준에 큰 차이를 숨깁니다.

## 함정

- **NIAH-only evaluation.**1M 토큰으로 NIAH를 통과하면 멀티 홉에 대해 아무 말도 안 됩니다. 항상 RULER 또는 사용자 지정 멀티 홉 테스트를 실행하세요.
- **Uniform depth sampling.**많은 구현은 테스트 깊이 = 0.5만 테스트 깊이 = 0, 0.25, 0.5, 0.75, 1.0  "중간에 잃어버린" 효과는 실제입니다.
- **Lexical overlap with filler.**바늘이 필러와 키워드를 공유한다면 검색은 비약적입니다. NoLiMa 스타일의 비겹치는 바늘을 사용하십시오.
- **Ignoring latency.**1M 토큰의 요청은 30~120초가 걸립니다. 정확성과 함께 시간부터 첫 번째 토큰을 측정합니다.
- **Vendor-self-reported numbers.**오픈AI, 구글, 앤트로피크 모두 자신의 점수를 발표합니다. 항상 사용 사례에 따라 독립적으로 다시 실행합니다.

## 사용 하 고

2026년 스택:

| Situation | Benchmark |
|-----------|-----------|
| Quick sanity check | Custom NIAH at 3 depths × 3 lengths |
| Model selection for production | RULER (13 tasks) at your target length |
| Real-world QA quality | LongBench v2 single-doc-QA subset |
| Multi-hop reasoning | BABILong or custom variable-tracing |
| Conversational / dialogue | MRCR 8-needle at your target length |
| Model upgrade regression | Fixed in-house NIAH + RULER harness, run on every new model |

생산에 대한 엄지손가락 규칙: 당신이 의도된 길이에 NIAH + 1 논리 작업을 할 때까지 컨텍스트 창을 신뢰하지 마십시오.

## 선박

`outputs/skill-long-context-eval.md`이 부분의 본문은

```markdown
---
name: long-context-eval
description: Design a long-context evaluation battery for a given model and use case.
version: 1.0.0
phase: 5
lesson: 28
tags: [nlp, long-context, evaluation]
---

Given a target model, target context length, and use case, output:

1. Tests. NIAH depth × length grid; RULER multi-hop; custom domain task.
2. Sampling. Depths 0, 0.25, 0.5, 0.75, 1.0 at each length.
3. Metrics. Retrieval pass rate; reasoning pass rate; time-to-first-token; cost-per-query.
4. Cutoff. Effective retrieval length (90% pass) and effective reasoning length (70% pass). Report both.
5. Regression. Fixed harness, rerun on every model upgrade, surface deltas.

Refuse to trust a context window from the model card alone. Refuse NIAH-only evaluation for any multi-hop workload. Refuse vendor self-reported long-context scores as independent evidence.
```

## 운동

1. **Easy.**3 깊이 (0.25, 0.5, 0.75) × 3 길이 (1k, 4k, 16k) 를 가진 NIAH를 구축하십시오. 어떤 모델에서도 실행하십시오. 3x3 열지도로 플롯 통과 속도.
2. **Medium.**3개의 바늘 변종을 추가하고, 각 길이의 3개 모두 검색을 측정하고, 같은 길이의 단일 바늘 통과율을 비교합니다.
3. **Hard.**64k 필러에 내장된 변수 추적 작업을 (X1 → X2 → X3, 3 홉) 구축합니다. 3 개의 경계 모델에서 정확성을 측정합니다. 모델마다 효과적인 추론 길이를 보고합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| NIAH | Needle in haystack | Plant a fact in filler, ask the model to retrieve it. |
| RULER | NIAH on steroids | 13 task types across retrieval / multi-hop / aggregation / QA. |
| Effective context | The real capacity | Length at which accuracy still holds above threshold. |
| Lost in the middle | Depth bias | Models under-attend to content in the middle of long inputs. |
| Multi-needle | Many facts at once | Multiple plants; tests attention juggling, not retrieval alone. |
| MRCR | Multi-round coref | 8, 24, or 100-needle coreference; exposes attention saturation. |
| NoLiMa | Non-lexical needle | Needle and query share no literal tokens; requires reasoning. |

## 더 많은 읽기

- [Kamradt (2023). Needle in a Haystack analysis](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) 원래 NIAH 레포
- [Hsieh et al. (2024). RULER: What's the Real Context Size of Your Long-Context LMs?](https://arxiv.org/abs/2404.06654) 다중 작업 기준
- [Bai et al. (2024). LongBench v2](https://arxiv.org/abs/2412.15204) 실제 세계 장기적 평상
- [Modarressi et al. (2024). NoLiMa: Non-lexical needles](https://arxiv.org/abs/2404.06666) 더 단단한 바늘
- [Kuratov et al. (2024). BABILong](https://arxiv.org/abs/2406.10149)            
- [Liu et al. (2024). Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) 깊이 편견 논문
