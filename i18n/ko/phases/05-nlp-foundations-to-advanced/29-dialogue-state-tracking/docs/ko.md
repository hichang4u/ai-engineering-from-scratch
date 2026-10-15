# 대화 상태 추적

> "북쪽에서 저렴한 레스토랑을 원해요. 사실, 중간 정도가 되세요. 이탈리아어를 추가하세요". 3회, 3회 업데이트.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 20 (Structured Outputs)
**Time:** ~75 minutes

## 문제

작업 지향 대화 시스템에서 사용자의 목표는 슬롯-값 쌍의 집합으로 암호화됩니다: `{cuisine: italian, area: north, price: moderate}`. 각 사용자 회전에서 슬롯을 추가, 변경 또는 제거할 수 있습니다. 시스템은 전체 대화를 읽고 현재 상태를 올바르게 출력해야합니다.

한 슬롯을 잘못하면 시스템이 잘못된 레스토랑을 예약하거나 잘못된 비행을 계획하거나 잘못된 카드를 청구합니다. DST는 사용자가 말한 것과 백엔드가 실행하는 사이의 입니다.

2026년에도 불구하고 여전히 중요한 이유는 LLM:

- 준수에 민감한 영역 (은행, 의료, 항공 항공 예약) 은 자유형 생성이 아닌 결정적인 슬롯 값이 필요합니다.
- 도구 사용 에이전트는 여전히 API를 호출하기 전에 슬롯 해상도가 필요합니다.
- 복수 회전 교정은 겉보기보다 더 어렵죠. "실제로, 아니, 목요일로 만들어야 한다".

현대 파이프라인: 고전적인 DST 개념 + LLM 추출기 + 구조화된 출력 경비선

## 개념

![DST: dialog history → slot-value state](../assets/dst.svg)

**Task structure.**스케마는 도메인 (음식장, 호텔, 택시) 과 그 슬롯 (음식장, 지역, 가격, 사람) 을 정의한다. 각 슬롯은 빈 상태가 될 수 있으며, 닫힌 집합에서 값으로 채워질 수 있다 (값: { 저렴, 중소, 비싸다}), 또는 자유 형태의 값 (명: "메인 켈트 ").

**Two DST formulations.**

- **Classification.**각 (slot, candidate_value) 쌍에 대해 예/아니오를 예측합니다. 닫힌 음자 슬롯에 작동합니다. 2020 년 전 표준
- **Generation.**대화값을 보면 자유 텍스트로 슬롯 값을 생성합니다.

**Metric.**공동 목표 정확성 (JGA) * 각 슬롯이 올바른 턴의 분자. 모든 것 또는 아무것도. 2026년에 멀티WOZ 2.4 순위표는 83% 정도를 차지한다.

**Architectures.**

1. **Rule-based (slot regex + keyword).**좁은 도메인에서 강력한 기준이 있습니다
2. **TripPy / BERT-DST.**BERT 코딩으로 복사 기반 생성, pre-LLM 표준
3. **LDST (LLaMA + LoRA).**명령어 조정 된 LLM 도메인 슬롯 요청. MultiWOZ 2.4에서 ChatGPT 수준의 품질을 달성합니다.
4. **Ontology-free (2024–26).**스키마를 건너뛰고 슬롯 이름과 값을 직접 생성하고 오픈 도메인을 처리합니다.
5. **Prompt + structured output (2024–26).**피단틱 스키마 + 제한된 디코딩, 5 라인 코드, 생산 준비

### 고전적인 실패 모드

- **Co-reference across turns.**"첫 번째 옵션으로 계속 가자".
- **Over-write vs append.**사용자 "이탈리아어 추가"라고 말합니다. 당신은 요리를 대체합니까?
- **Implicit confirmations.**"좋아요, 괜찮아요"  제안된 예약은 받아들여졌나요?
- **Correction.**"정말 오후 7시까지 올릴 것"은 다른 슬롯을 정리하지 않고 시간을 업데이트해야 합니다.
- **Coreference to previous system utterance.**"네, 그쪽이야".

```figure
n5-slot-tracker
```

## 건설 해

### 단계 1: 규칙 기반 슬롯 추출기

보시다시피`code/main.py`. 레전스 + 동의어 사전은 좁은 영역에서 70%의 가공적인 표현을 다루고 있습니다.

```python
CUISINE_SYNONYMS = {
    "italian": ["italian", "pasta", "pizza", "italy"],
    "chinese": ["chinese", "chow mein", "noodles"],
}


def extract_cuisine(utterance):
    for canonical, synonyms in CUISINE_SYNONYMS.items():
        if any(syn in utterance.lower() for syn in synonyms):
            return canonical
    return None
```

가전적 어휘에서 벗어난 것인데 결정적 슬롯 확정에서 작동합니다

### 단계 2: 상태 업데이트 루프

```python
def update_state(state, utterance):
    new_state = dict(state)
    for slot, extractor in SLOT_EXTRACTORS.items():
        value = extractor(utterance)
        if value is not None:
            new_state[slot] = value
    for slot in NEGATION_CLEARS:
        if is_negated(utterance, slot):
            new_state[slot] = None
    return new_state
```

3가지 변수:

- 사용자가 만지지 않은 슬롯을 다시 설정하지 마십시오.
- 명백한 부정 ("음식에 신경 쓰지 마라") 는 분명해야 합니다.
- 사용자 수정 ("실제로...") 는 첨부가 아니라 과장되어야 합니다.

### 단계 3: 구조화된 출력으로 LLM를 주도하는 DST

```python
from pydantic import BaseModel
from typing import Literal, Optional
import instructor

class RestaurantState(BaseModel):
    cuisine: Optional[Literal["italian", "chinese", "indian", "thai", "any"]] = None
    area: Optional[Literal["north", "south", "east", "west", "center"]] = None
    price: Optional[Literal["cheap", "moderate", "expensive"]] = None
    people: Optional[int] = None
    day: Optional[str] = None


def llm_dst(history, llm):
    prompt = f"""You track the slot values of a restaurant booking across turns.
Dialogue so far:
{render(history)}

Update the state based on the latest user turn. Output only the JSON state."""
    return llm(prompt, response_model=RestaurantState)
```

인스트럭터 + 피단틱은 유효 상태 객체를 보장합니다. 레전스, 스케마 불합동, 환각 슬롯이 없습니다.

### 단계 4: JGA 평가

```python
def joint_goal_accuracy(predicted_states, gold_states):
    correct = sum(1 for p, g in zip(predicted_states, gold_states) if p == g)
    return correct / len(predicted_states)
```

캘리브레이트: 시스템에서 어떤 분량의 턴이 모든 슬롯을 올바르게 얻는가? MultiWOZ 2.4에서, 2026 시스템에서 가장 높은: 80-83%.

### 단계 5: 조작 수정

```python
CORRECTION_CUES = {"actually", "no wait", "on second thought", "change that to"}


def is_correction(utterance):
    return any(cue in utterance.lower() for cue in CORRECTION_CUES)
```

발견된 수정에서, 마지막으로 업데이트 된 슬롯을 추가하는 대신 덮어쓰십시오. LLM 도움 없이는 올바르게 만드는 것이 어렵습니다. 현대 패턴: LLM가 점진적으로 업데이트하는 대신 항상 전체 상태를 역사에서 재생하도록하십시오. 이것은 자연스럽게 수정 사항을 처리합니다.

## 함정

- **Full-history regeneration cost.**LLM가 각 차례에 걸쳐 재건되는 것을 허용하는 비용$O(n^2)$전체 토큰, 캡 역사 또는 오래된 회전을 요약
- **Schema drift.**새로운 슬롯을 추가하면 오래된 훈련 데이터를 깨뜨리죠
- **Case sensitivity.**"이탈리아인" vs. "이탈리아인" vs. "이탈리아인"
- **Implicit inheritance.**사용자가 이전에 "4명"을 지정했다면, 다른 시간으로 새로운 요청은 사람을 삭제하지 않아야합니다. 항상 전체 역사를 전달하십시오.
- **Free-form vs closed-set.**이름, 시간, 주소 는 자유형 슬롯 이 필요 하며, 부엌 과 지역 은 닫혀 있다. 두 가지 를 계획 에 섞어 놓으십시오.

## 사용 하 고

2026년 스택:

| Situation | Approach |
|-----------|----------|
| Narrow domain (one or two intents) | Rule-based + regex |
| Broad domain, labeled data available | LDST (LLaMA + LoRA on MultiWOZ-style data) |
| Broad domain, no labels, prod-ready | LLM + Instructor + Pydantic schema |
| Spoken / voice | ASR + normalizer + LLM-DST |
| Multi-domain booking flow | Schema-guided LLM with per-domain Pydantic models |
| Compliance-sensitive | Rule-based primary, LLM fallback with confirmation flow |

## 선박

`outputs/skill-dst-designer.md`이 부분의 본문은

```markdown
---
name: dst-designer
description: Design a dialogue state tracker — schema, extractor, update policy, evaluation.
version: 1.0.0
phase: 5
lesson: 29
tags: [nlp, dialogue, task-oriented]
---

Given a use case (domain, languages, vocab openness, compliance needs), output:

1. Schema. Domain list, slots per domain, open vs closed vocabulary per slot.
2. Extractor. Rule-based / seq2seq / LLM-with-Pydantic. Reason.
3. Update policy. Regenerate-whole-state / incremental; correction handling; negation handling.
4. Evaluation. Joint Goal Accuracy on a held-out dialogue set, slot-level precision/recall, confusion on the hardest slot.
5. Confirmation flow. When to explicitly ask the user to confirm (destructive actions, low-confidence extractions).

Refuse LLM-only DST for compliance-sensitive slots without a rule-based secondary check. Refuse any DST that cannot roll back a slot on user correction. Flag schemas without version tags.
```

## 운동

1. **Easy.**규칙 기반의 국가 추적기를 구축합니다`code/main.py`3개의 슬롯 (음식, 부지, 가격) 에 대한 테스트. 10개의 손으로 만든 대화서에서 테스트. JGA를 측정합니다.
2. **Medium.**인스트루터 + 피단틱 + 작은 LLM와 같은 데이터 세트. JGA를 비교하십시오. 가장 어려운 회전을 검사하십시오.
3. **Hard.**규칙 기반의 기본, 규칙 기반의 규칙 기반의 슬롯 <2을 신뢰로 배출할 때 LLM 역전.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| DST | Dialogue state tracking | Maintain the slot-value dict across dialogue turns. |
| Slot | Unit of user intent | Named parameter the backend needs (cuisine, date). |
| Domain | The task area | Restaurant, hotel, taxi — sets of slots. |
| JGA | Joint Goal Accuracy | Fraction of turns where every slot is correct. All-or-nothing. |
| MultiWOZ | The benchmark | Multi-domain WOZ dataset; standard DST evaluation. |
| Ontology-free DST | No schema | Generate slot names and values directly, no fixed list. |
| Correction | "Actually..." | Turn that overwrites a previously-filled slot. |

## 더 많은 읽기

- [Budzianowski et al. (2018). MultiWOZ — A Large-Scale Multi-Domain Wizard-of-Oz](https://arxiv.org/abs/1810.00278) 가톨릭 기준
- [Feng et al. (2023). Towards LLM-driven Dialogue State Tracking (LDST)](https://arxiv.org/abs/2310.14970) DST에 대한 LLaMA + LoRA 명령어 조율
- [Heck et al. (2020). TripPy — A Triple Copy Strategy for Value Independent Neural Dialog State Tracking](https://arxiv.org/abs/2005.02877) 복사 기반 DST 작업마마.
- [King, Flanigan (2024). Unsupervised End-to-End Task-Oriented Dialogue with LLMs](https://arxiv.org/abs/2404.10753) EM 기반의 감독되지 않은 TOD.
- [MultiWOZ leaderboard](https://github.com/budzianowski/multiwoz) 가톨릭 DST 결과
