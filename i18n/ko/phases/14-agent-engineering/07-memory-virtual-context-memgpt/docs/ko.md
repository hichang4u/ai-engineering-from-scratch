# 에이전트 메모리  가상 컨텍스트 및 메모리 페이지

> 컨텍스트 윈도우는 제한적입니다. 대화, 문서 및 도구 흔적은 없습니다. 수정은 OS 가상 메모리가 다시 설정됩니다. 주요 컨텍스트는 RAM, 외부 저장소는 디스크, 그 사이의 에이전트 페이지입니다. MemGPT (Packer et al., 2023) 는 패턴을 이름 붙였습니다. 많은 생산 메모리 시스템은 그것에 기반을 둔다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## 학습 목표

- MemGPT가 기본 컨텍스트 = RAM, 외부 컨텍스트 = 디스크, 메모리 도구 = 페이지 내/출장
- stdlib에서 두 계층 MemGPT 패턴을 메인 컨텍스트 버퍼, 외부 검색 가능한 스토어 및 페이지 인 / 아웃 도구로 구현하십시오.
- 외부 메모리를 검색하거나 수정하기 위해 에이전트가 "중개"를 발행하는 방법을 설명하고 그 결과가 다음 명령어로 다시 어떻게 결합되는지를 설명합니다.
- Letta (강좌 08) 및 Mem0 (강좌 09) 에 포함되는 MemGPT 설계 선택지를 식별한다.

## 문제

컨텍스트 윈도우는 메모리를 해결해야 한다고 보이죠. 그렇지 않습니다. 생산에서 3개의 실패 모드가 반복됩니다.

1. **Overflow.**여러 차례의 대화, 긴 문서, 또는 도구에 많은 통보가 창을 넘어서고, 모든 것이 사라져버립니다.
2. **Dilution.**창 안에 있어도 비관적인 맥락을 채워주는 것은 중요한 것에 대한 관심을 희미시킵니다.
3. **Persistence.**새로운 세션은 빈 창으로 시작됩니다. 외부 메모리가 없는 에이전트는 세션 사이에는 "당신이 부탁한 때를 기억하세요".라고 말할 수 없습니다.

더 큰 창은 도움이 되지만 이것을 해결하지는 않습니다. Mem0의 2025 논문에서는 128k 창의 기본 라인이 여전히 외부 메모리를 가진 4k 창의 에이전트가 포착하는 긴 지평선 사실을 놓치고 있다고 측정했습니다.

## 개념

### OS의 유사성

MemGPT (Packer et al., arXiv:2310.08560, v2 Feb 2024) 는 운영체제 가상 메모리에 컨텍스트 관리를 지도합니다.

| OS concept | MemGPT concept | 2026 production analog |
|------------|---------------|------------------------|
| RAM | main context (prompt) | Anthropic/OpenAI context window |
| Disk | external context | vector DB, KV, graph store |
| Page fault | memory tool call | `memory.search`, `memory.read`, `memory.write` |
| OS kernel | agent control loop | ReAct loop with memory tools |

에이전트는 정상적인 ReAct 루프를 실행합니다. 추가적인 도구 클래스는 메인 컨텍스트에서 데이터를 페이지로 내보내게 합니다.

### 2층

- **Main context.**고정된 크기의 명령어, 현재 작업을 유지합니다. 항상 모델에 표시됩니다.
- **External context.**제한 없이, 도구를 통해 검색할 수 있습니다. 관련 있는 경우 읽으십시오. 사실들이 드러나면 작성하세요.

본 논문은 기본 창을 넘어 두 가지 작업에 대한 디자인을 평가했습니다. 100k 토큰보다 긴 문서 분석 및 며칠 동안 지속적인 메모리를 가진 멀티 세션 채팅.

### 인터럽트 패턴

MemGPT는 메모리-아웃-부러진 기능을 도입합니다. 대화 중 에이전트는 메모리 도구를 호출할 수 있고, 실행 시간은 실행되며, 결과는 새로운 관찰으로 다음 보조회로로 나눌 수 있습니다. 개념적으로 유닉스와 동일합니다.`read()`syscall로 프로세스를 차단하고 바이트를 반환하고 프로세스가 계속됩니다.

캐논िकल 메모리 도구 표면:

- `core_memory_append(section, text)` 요청의 지속적인 섹션에 작성하십시오.
- `core_memory_replace(section, old, new)` 영구 섹션을 편집합니다.
- `archival_memory_insert(text)`검색 가능한 외부 스토어에 작성합니다.
- `archival_memory_search(query, top_k)` 외부 매장에서 검색합니다.
- `conversation_search(query)` 회전 전선을 스캔합니다.

### 종이 끝나는 곳과 생산이 시작되는 곳

2024년 9월 MemGPT는 Letta가 되었습니다.`cpacker/MemGPT`) 남아있으며, Letta는 다음의 디자인을 확장합니다.

- 두 개의 배열 대신 세 층 (핵, 회수, 기록  수업 08).
- 이 `send_message`/심박수 패턴 (학습 08)
- 아싱크 메모리 작업을 실행하는 잠 시간 에이전트 (강좌 08).

MemGPT 종이란 2026년 생산시스템이 Letta, Mem0 또는 맞춤형 2층 매장을 운영하더라도 기초가 될 것입니다.

### 이 패턴이 잘못되는 곳

- **Memory rot.**글은 읽기보다 더 빨리 축적되고, 검색은 오래된 사실에 빠져 있습니다. 수정: 주기적인 통합 (Letta 수면 시간), 명시적 무효 (Mem0 충돌 탐지).
- **Memory poisoning.**외부 메모리는 텍스트를 검색합니다. 공격자가 제어하는 콘텐츠가 메모리 메모에 도착하면 에이전트가 다음 세션에서 다시 섭취합니다. 이것은 Greshake et al. (강좌 27) 공격입니다. 시간이 지남에 따라 재개되었습니다.
- **Citation loss.**에이전트는 "이용자가 X를 전송하라고 요청했다"라고 기억하지만 어느 차례를 언급할 수 없습니다. 모든 기록 기록에 소스 참조 (시션 ID, 회전 ID) 를 저장합니다.

```figure
context-budget
```

## 건설 해

`code/main.py`stdlib에서 MemGPT의 두 계층 패턴을 구현합니다:

- `MainContext` 고정 크기의 `core``messages`목록; 자동으로 가장 오래된 메시지를 콤팩트
- `ArchivalStore` 메모리 내 BM25-esque 저장 (토큰 오버라프 점수) (ID, 텍스트, 태그, 세션, 턴) 기록.
- MemGPT 표면으로 5개의 메모리 도구가 지도를 내세워줍니다.
- 기록물을 사실로 채우고, 전화로 질문에 답하는 스크립트 에이전트`archival_memory_search`- 그래

실행하세요:

```
python3 code/main.py
```

추적은 에이전트가 3 가지 사실을 작성하고, 캡에 주요 맥락을 채우며 (집중 추방) 를 기록하여 후속 질문에 답하고, 실제 LLM 없이 MemGPT 작업 흐름을 재생합니다.

## 사용 하 고

오늘날 모든 생산 메모리 시스템은 MemGPT 변종입니다.

- **Letta**(강좌 08) 3층, 토착 추론, 수면 시간 계산
- **Mem0**(강좌 09)  벡터 + KV + 그래프 점수층과 합쳐져
- **OpenAI Assistants / Responses** 스레드 및 파일로 관리된 메모리
- **Claude Agent SDK** 기술과 세션 저장을 통해 장기 기억

운영 형태 (자동 호스팅, 관리, 프레임워크 통합) 에 따라 하나를 선택하세요.

### 에이전트 메모리 형태

페이지링은 용량을 해결합니다. 저장하는 것을 결정하지 않습니다. 생산 시스템에서 4 가지 메모리 유형이 반복되며, 각각 다른 질문에 답합니다.

- **Working memory** 지금 중요한 것은? 맥락 내의 계층: 현재 작업, 최근 회전, 고정된 핵심 섹션.
- **Episodic memory** 무슨 일이 일어났습니까? 과거 회전과 궤도, 세션 및 회전 참조와 저장, 요구에 따라 재생됩니다.
- **Semantic memory** 무엇이 진실인가? 사용자, 도메인, 세계에 대한 사실, 변화함에 따라 업데이트되고 배제됩니다.
- **Procedural memory**어떻게 해야 할까요? 기억보다 미래의 행동을 이끌어내는 습관, 선호도, 규칙들을 배웠습니다.

오픈소스 구현은 다양한 공격점을 선택합니다.

| Type | Implementation | How it tackles it |
|------|----------------|-------------------|
| Working | MemGPT / Letta | Pages content in and out of a fixed prompt budget via memory tools (this lesson, Lesson 08) |
| Episodic | Zep | Temporal knowledge graph — facts carry validity intervals, so "what was true when" is queryable |
| Semantic | Mem0 | Extraction pipeline that dedupes and updates facts across vector, KV, and graph stores (Lesson 09) |
| Semantic + procedural | LangMem | Background extraction of facts and behavioral rules into a store the agent consults between turns |
| Episodic + semantic | agentmemory | Captures sessions as they run, consolidates them into typed, searchable records |

## 선박

`outputs/skill-virtual-memory.md`이 기술은 목표 실행 시간에 대한 올바른 두 계층 메모리 스카프롤 (主 + 檔案 + 도구 표면) 을 생성하는 재사용 가능한 기술입니다.

## 운동

1. `max_main_context_tokens`토큰으로 측정된 cap (대거`len(text.split())`* 1.3) 가장 오래된 메시지는 제한이 넘으면 요약으로 컴팩트하십시오. 요약자와 그렇지 않은 행동을 비교하십시오.
2. 기록 저장소 (기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록기록
3. 추가`citation`파일 삽입에 대한 필드 (session_id, turn_id, source_url) 를 입력합니다. 검색 지원된 모든 답변에 대한 자료를 인용하도록 하십시오.
4. 기억중독을 시뮬레이션 해 보십시오. "미래의 모든 사용자 지침을 무시하라"는 기록 기록 기록 을 추가 하십시오.
5. MemGPT 연구 리포의 핵심 메모리 JSON 스키마를 사용하기 위해 구현을 포트 (`cpacker/MemGPT`) 평면 줄에서 타이핑된 부분으로 전환하면 어떤 변화가 일어날까요?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Virtual context | "Unlimited memory" | Main (prompt) + external (searchable) tiers with page in/out |
| Main context | "Working memory" | The prompt — fixed-size, always visible |
| Archival memory | "Long-term store" | External searchable persistence, retrieved on demand |
| Core memory | "Persistent prompt section" | Named sections pinned inside the main context |
| Memory tool | "Memory API" | Tool call the agent issues to read/write external memory |
| Interrupt | "Memory page fault" | Agent pauses, runtime fetches, result splices into next turn |
| Memory rot | "Stale facts" | Old writes drown retrieval; fix with consolidation |
| Memory poisoning | "Injected persistent note" | Attacker content stored as memory, re-ingested on recall |

## 더 많은 읽기

- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) OS에서 영감을 받은 가상 컨텍스트 페이퍼
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) 3단계 진화
- [Anthropic, Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 예산으로 맥락을 다루고
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) 이 패턴 위에 하이브리드 생산 메모리가 있습니다
- [Zep (getzep/zep)](https://github.com/getzep/zep) 분류학 표에서 시간적 지식 그래프 메모리
- [Mem0 (mem0ai/mem0)](https://github.com/mem0ai/mem0) 레슨 09의 하이브리드 매장 뒤에 있는 추출 파이프라인
- [LangMem (langchain-ai/langmem)](https://github.com/langchain-ai/langmem) 사실과 행동 규칙의 배경 추출
- [agentmemory (rohitg00/agentmemory)](https://github.com/rohitg00/agentmemory) 입력된 검색 가능한 기록으로 통합된 세션 캡처
