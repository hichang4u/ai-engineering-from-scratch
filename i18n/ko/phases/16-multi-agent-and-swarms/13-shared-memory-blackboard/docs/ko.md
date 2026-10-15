# 공유된 기억과 블랙보드 패턴

> 2026년 다중 에이전트 시스템에는 두 가지 접근법이 공존한다.**message pool**(모든 사람이 모든 사람의 메시지를 볼 수 있습니다.**blackboard with subscription**(전체들은 컨텍스트 인식 MCP 또는 매트릭스 프레임워크와 같은 관련 이벤트에 가입한다). 둘 다 다 다중 에이전트 시스템의 유일한 상태 부분입니다.**memory poisoning**: 한 에이전트가 "사실을 환각시키지만" 다른 에이전트는 그것을 확인된 것으로 취급하고 정확도는 즉각적인 충돌보다 훨씬 더 어렵게 디버깅되는 방식으로 점차적으로 쇠퇴합니다. 이 수업은 두 구조를 모두 stdlib에서 구축하고 독성 공격을 주입하고 실제로 생산에서 작동하는 세 가지 완화 방법을 보여줍니다.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`)
**Prerequisites:** Phase 16 · 04 (Primitive Model), Phase 16 · 09 (Parallel Swarm Networks)
**Time:** ~75 minutes

## 문제

다중 에이전트 시스템은 에이전트들이 사실을 공유할 수 있는 장소를 필요로 한다. 문자적 옵션은 "모든 것을 메시지에서 전달한다"는 것이지만, 추가 복사로 공유 상태를 재발견한다. 다른 하나는 "모든 사람에게 글로벌 로그를 제공한다"는 하지만, 글로벌 로그는 무한하게 성장하고 쉽게 독이 된다. 세 번째는 " 에이전트당 1개의 시공을 프로젝트 한다"는 것입니다.

한 대원 중 한 명이 환각을 하고 공유된 상태로 환각을 기록하면, 그 상태를 읽는 모든 하류 대원들은 환각을 사실로 받아들이고 있습니다. 인간들이 알아차릴 때, 사유 사슬은 5 단계 깊고 근본 원인은 사유가 된 세 번째 메시지입니다. 다중 대원 정확성 붕괴를 디버깅하는 것보다 더 어렵습니다.

이것은 메모리 중독입니다. MAST 분류학에서 두 번째로 많이 기록된 실패 가족입니다 (Cemri et al., arXiv:2503.13657) 그리고 구조적입니다. 기원을 가지고 있지 않은 공유 메모리 설계와 쓸 수 없는 검증기는 결국 그것을 표시합니다.

## 개념

### 두 가지 주요 토폴로지

**Full message pool.**모든 에이전트는 모든 메시지를 읽습니다. AutoGen GroupChat 및 MetaGPT는 이것을 사용합니다. 간단하고 투명하고 검사 할 수 있지만, 각 에이전트의 맥락이 다른 에이전트의 작업으로 가득하기 때문에 ~10 에이전트를 넘지 않습니다.

```
agent-A ──write──▶ ┌────────────────┐ ◀──read── agent-D
                   │ message pool   │
agent-B ──write──▶ │                │ ◀──read── agent-E
                   │ (global log)   │
agent-C ──write──▶ └────────────────┘ ◀──read── agent-F
```

**Blackboard with subscription.**에이전트는 주제에 대한 관심을 선언하고, 서브스트레이트는 관련 메시지를만 전달한다. CA-MCP (arXiv:2601.11595) 와 매트릭스 분산 프레임워크 (arXiv:2511.21686) 는 이것을 사용합니다. 더 확장하지만 구독을 의미있게 만들기 위해 초기 스케마 디자인이 필요합니다.

```
                   ┌─ topic: prices ──┐
agent-A ──pub────▶ │                  │ ──▶ agent-D (subscribed)
                   ├─ topic: orders ──┤
agent-B ──pub────▶ │                  │ ──▶ agent-E (subscribed)
                   ├─ topic: alerts ──┤
agent-C ──pub────▶ │                  │ ──▶ agent-F (subscribed)
                   └──────────────────┘
```

### 이기는 순간

- **Full pool**에이전트들이 거의 (< 10) 이거나, 이질적인 경우, 대화는 짧습니다. 모든 사람이 모든 것을 볼 때 누가 무엇을 말했다는 것에 대해 논리하는 것은 소소한 것입니다.
- **Blackboard**로팅은 많은 에이전트들이 있는데, 역할은 균일하지만, 인스턴스 (swarms) 에서도 많고 대화는 오래 걸립니다. 로팅은 표기적인 비용과 컨텍스트 오염을 절약합니다.

생산 시스템은 종종 혼합됩니다. 상단에 작은 풀 풀 풀 (계획층), 아래에서 블랙보드 (노동자층).

### 한 시나리오에서 기억 중독

세 명의 에이전트가 연구 작업을 하고 있습니다. 에이전트 A는 검색 에이전트 B는 요약자 C는 분석가입니다.

1. A는 페이지를 가져와서 공유된 상태로 메시지를 작성합니다. "연구는 42%의 정확성 향상을 보고합니다".
2. 실제로 가져온 페이지에는 "4.2%의 개선"이 있었다
3. B는 공유 상태를 읽고 "대부분의 42%의 정확성 증가가 보고되었다 (원자: A). "
4. C, 공유 상태를 읽고, "고용을 권장합니다  42% 상승은 변혁적입니다".
5. 최종 보고서에서는 결코 존재하지 않았던 42%의 숫자를 언급했습니다.

어떤 요원이 충돌하지 않았거나 테스트가 실패하지 않았거나, 시스템이 "작업했다"

### 왜 이것이 구조적인

공유 상태가 없으면 A 요인의 환각은 A의 맥락에서 유지됩니다. 하류 요인들은 다시 검색하거나 다시 도출하여 오류를 발견 할 수 있습니다. 순진한 공유 상태와 함께 A의 맥락은 모든 사람들의 맥락이 되고 환각은 사실로 씻겨집니다.

문제는 공유 국가 자체는 아닙니다.**without provenance and without an independent verifier**. 세 가지 완화책은 다음과 같습니다:

1. **Attribute provenance on every write.**공유된 국가 기록에 있는 모든 항목은 누가 작성했는지, 언제, 어떤 시사사항에 따라, 그리고 (응용되는 경우) 어떤 소스를 요약한지에 대한 것입니다. 하류 요원들은 출처에 대한 회의주의로 읽습니다.
2. **Version writes; treat them as append-only.**수정이란 오래된 항목을 대체하는 새로운 항목이고, 현장 업데이트가 아닙니다. 감사 트레일은 보존됩니다.
3. **Keep at least one agent that cannot write to shared state.**읽기 전용 검증기 (Verifier) 는 입력 자료를 샘플링하고, 출처를 다시 찾아내고, 모순을 표시합니다.

### 블랙보드 선례 (하이스-로스, 1985)

블랙보드 패턴은 LLM 에이전트보다 40년 전에 나온 것입니다. 헤이스-로스 (1985, "통제 위한 블랙보드 아키텍처") 는 글로벌 블랙보드를 관찰하고 부분적인 솔루션을 기여하고 다른 소스를 유발하는 전문 지식 소스를 기술했습니다. 2026 블랙보드 (CA-MCP, 매트릭스) 는 지식원과 부분 솔루션으로 JSON 블럽을 사용하는 LLM 에이전트와 동일한 패턴입니다. 오래된 문학은 논쟁, 기회주의적 통제, 그리고 현대 시스템이 재발견하는 일관성을 기록한 해결책입니다.

### 투영 대 전체 시야

순수한 블랙보드 는 모든 가입자에게 동일한 투영을 (주적 범위) 제공합니다. 더 공격적인 디자인은 **per-agent projection**각 에이전트는 자신의 역할에 맞춘 시각을 얻습니다. 랭그그래프의 상태 감소자는 2026 년 정통 구현입니다.

대리인 투영은 더 확장되지만 스케마가 필요합니다.

### 글자 내용 패턴

여러 에이전트가 동시에 글을 쓰는 것은 단순히 LLM 문제가 아니라 동시성 문제입니다. 세 가지 패턴이 작동합니다.

- **Sequential writer (single producer).**모든 글은 하나의 좌표 에이전트를 통해 진행됩니다. 단순하지만 병목이 있습니다.
- **Optimistic concurrency with versioning.**각 항목은 버전이 있습니다. 작가는 버전 부합과 다시 시도하지 않습니다. 고전 데이터베이스 기술.
- **Topic partitioning.**다른 에이전트가 다른 주제를 가지고 있습니다. 교차 주제를 논쟁은 없습니다. 설계된 파티션 경계를 필요로 합니다.

대부분의 2026 프레임워크는 연속적인 작가를 기본으로 설정합니다. LLM 호출은 너무 느려서 논쟁이 드물고 병목은 아프지 않습니다.

### 비쓰기 검증기

가장 부담을 덜어주는 방법은 읽기 전용 검증기입니다.

- 검증자는 팀과 상태를 공유한다 (블랙보드 또는 풀을 읽는다).
- 검증기는 별도의 검증 채널에서만 공유된 상태 에 쓰기 핸들을 가지고 있지 않습니다.
- 검증자는 독립적으로 문서에 인용된 자료를 수집합니다.
- 검증자의 자력 출력은 인간이나 별도의 결정 에이전트로 전달되며,

이러한 분리 없이는 검증자의 출력은 수영장에 새로운 입력을 갖게 되는데, 이는 독이 있는 수영장이 검증자를 독해버리는 것을 의미하며, 이는 검증자의 검증을 독해버리는 것을 의미합니다.

```figure
swarm-blackboard
```

## 건설 해

`code/main.py`스틸리브 파이썬에서 두 가지 토폴로지를 구현하고 장난감 중독 공격과 세 가지 완화 작업을 수행합니다.

- `MessagePool` 전체 읽기 전용 로그
- `Blackboard` 주제를 중심으로 한 술집/잠재점, 각 에이전트 가입자
- `ProvenanceEntry` 각 기록 (작가, 시간표, prompt_hash, source_uri) 를 작성합니다.
- `PoisoningScenario` 3 대원 연구 작업을 수행합니다. A 대원 은 십자수를 환각시킵니다. 최종 보고서를 인쇄합니다.
- `Verifier` 읽기 전용 에이전트, 출처를 다시 찾아서 불합리한 점을 표시합니다. 검증자가 존재할 때 동일한 시나리오를 실행합니다.

실행:

```
python3 code/main.py
```

예상 출력:
- 1번 실행 (확인자가 없습니다): 환각된 42%는 최종 보고서로 번성합니다.
- 실행 2 (확인자): 검증자는 불합성을 표시하고, 풀은 "표지"로 표시되며, 최종 보고서는 회수사항을 포함합니다.

## 사용 하 고

`outputs/skill-memory-auditor.md`이것은 어떤 멀티 에이전트 시스템의 공유 메모리 디자인을 오브렌스, 버전 제작 및 검증자 분리에 대한 감사하는 기술입니다. 생산 전에 새로운 멀티 에이전트 아키텍처에 실행하십시오.

## 선박

공유 메모리 설계:

- 각 글에 출처 기록: `(writer, timestamp, prompt_hash, tool_calls_cited, source_uri)`- 그래
- 로그를 추가만 해야 합니다. 수정은 대체된 항목을 참조하는 새로운 항목입니다.
- 독립적인 소스 액세스 기능을 가진 읽기 전용 검증기 대리인을 적어도 1개씩 배치하십시오.
- 루트 확인기 출력으로 분리된 채널로, 공유 풀로 돌아가지 않는다.
- 록의 비율은 초반적 인 글이  증가하는 비율은 환각 패턴의 초기 증거입니다.

## 운동

1. 달아`code/main.py`1번의 발작은 환각을 퍼뜨리고 2번의 발작은 환각을 잡는다
2. 두 번째 환각을 추가하십시오. B 요원은 데이터 세트의 크기를 발명합니다. 검증자는 둘 다 수색하지 않고도 두 가지로 수동 조정해야합니다.
3. 전체 풀을 주제 파티션이 있는 블랙보드로 전환 (`prices``summaries``analyses`) 주제 분할이 어떤 독성 시나리오를 더 어렵게 만들며, 어떤 시나리오에서 도움이 되지 않는가?
4. 헤이스-로스 (1985, "통제 위한 블랙보드 아키텍처") 를 읽어 보십시오. 이 강의에서 논의되지 않은 논문에서 2026 년 시스템 이 혜택을 받을 수 있는 두 가지 제어 패턴을 식별 하십시오.
5. CA-MCP (arXiv:2601.11595) 를 읽어 보세요.`code/main.py`CA-MCP가 어떤 원시파를 추가하는가?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Message pool | "Shared chat history" | Append-only log that every agent reads. Full transparency, poor scaling. |
| Blackboard | "Shared workspace" | Topic-keyed pub/sub. Agents subscribe to relevant topics. Scales farther. |
| Provenance | "Who wrote what" | Metadata on each write: writer, timestamp, prompt, sources. |
| Memory poisoning | "Hallucinations spreading" | One agent's error enters shared state, downstream agents adopt it as fact. |
| Append-only | "No in-place updates" | Corrections are new entries that supersede. Preserves audit trail. |
| Unwritable verifier | "Independent auditor" | Read-only agent that re-fetches sources and flags inconsistencies. |
| Projection | "Scoped view" | Per-agent view computed from global state. LangGraph reducers are the canonical case. |
| Knowledge Source | "Specialist agent" | Hayes-Roth's 1985 term for a blackboard participant. |

## 더 많은 읽기

- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST 분류학; 기억 중독은 조정 실패 하위 가족입니다
- [CA-MCP — Context-Aware Multi-Server MCP](https://arxiv.org/abs/2601.11595) 조정된 MCP 서버에 대한 공유 컨텍스트 스토어
- [Matrix — decentralized multi-agent framework](https://arxiv.org/abs/2511.21686) 중앙 오케스트레이터 없이 메시지 큐 기반의 블랙보드
- [LangGraph state and reducers](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 생산에서 대원당 투영 패턴
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) 생산 배치에서 출처 및 검증 메모
