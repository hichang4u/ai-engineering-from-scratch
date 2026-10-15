# 기억력 차단 및 수면 시간 계산

> 모형이 직접 편집할 수 있는 기능적 메모리 블록과, 주요 에이전트가 비동기 상태에서 무작위로 메모리를 통합하는 수면 시간 에이전트입니다. 이 두 아이디어는 하나의 대화를 넘어 메모리를 확장하는 방법입니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT)
**Time:** ~75 minutes

## 학습 목표

- 레타가 사용하는 세 개의 메모리 계층 (핵, 회수, 기록) 과 각의 역할의 이름을 지정하십시오.
- 메모리 블록 패턴을 설명하십시오. 인간 블록, 인격 블록 및 사용자 정의 블록은 1급 타이핑 객체로 설명합니다.
- 잠 시간 계산은 무엇이며, 왜 중요한 경로에서 떨어져 있고, 왜 원동력보다 더 강력한 모델을 실행할 수 있는지 설명하십시오.
- 스크립트 된 두 대원 루프를 구현하여 주요 대원이 응답을 제공하며 잠 시간 대원이 회전 사이에 블록을 통합합니다.

## 문제

MemGPT (강좌 07) 은 가상 메모리 제어 흐름을 해결했습니다. 세 가지 생산 문제들이 나타났습니다.

1. **Latency.**모든 메모리 작업은 중요한 경로에 위치하고 있습니다. 만약 에이전트가 사용자가 기다리는 동안 정렬, 요약 또는 조화를 해야 한다면, 꼬리 지연은 폭발합니다.
2. **Memory rot.**글은 쌓이고, 모순된 사실은 남아있지만, 검색은 쓸모없는 내용으로 빠져나갑니다.
3. **Structure loss.**평면 아카이브 스토어는 "인류 블록은 항상 프롬프트에 있고, 퍼스나 블록은 항상 프롬프트에 있고, 작업 블록은 세션마다 교환된다"라고 표현할 수 없습니다.

렛타 (letta.com) 는 2024년에 채택된 원래 MemGPT 프로젝트의 플랫폼 이름이다.  논문의 패턴은 MemGPT 이름을 유지하며 2026년 렛타 V1의 재편은 나중에 별도의 단계이다. 메모리 블록은 구조를 명시적으로 만듭니다. 잠 시간 계산은 통합을 중요한 경로에서 이동시킵니다.

## 개념

### 3층

| Tier | Scope | Where it lives | Written by |
|------|-------|----------------|------------|
| Core | Always visible | Inside the main prompt | Agent tool call + sleep-time rewrites |
| Recall | Conversation history | Retrievable | Automatic turn logging |
| Archival | Arbitrary facts | Vector + KV + graph | Agent tool call + sleep-time ingest |

핵심은 MemGPT 핵심입니다. 회상자는 퇴출된 꼬리와 대화 버퍼입니다. 기록은 외부 저장소입니다. 분할은 MemGPT의 두 계층 과부하를 깨끗하게합니다.

### 메모리 블록

블록은 핵심 계층의 입력, 지속, 편집 가능한 섹션입니다. 원래 MemGPT 문서에서는 두 가지를 정의했습니다.

- **Human block** 사용자에 대한 사실 (명, 역할, 선호, 목표)
- **Persona block** 에이전트의 자기 개념 (인격, 음색, 제약)

Letta는 임의 사용자 정의 블록으로 일반화합니다: a `Task`현재 목표에 대한 블록,`Project`코드 기반의 사실들을 위한 블록,`Safety`블록은 단단한 제한을 위해 있습니다.`id``label``value``limit`(자호자 모금)`description`(모델은 언제 편집해야 하는지 알 수 있도록)

블록은 도구 표면으로 편집 할 수 있습니다:

- `block_append(label, text)`
- `block_replace(label, old, new)`
- `block_read(label)`
- `block_summarize(label)` 그 한계에 가까운 블록을 응축한다.

### 잠 시간 계산

2025 렛타 추가: 중요한 경로를 벗어나 배경에서 두 번째 에이전트를 실행하십시오. 잠 시간 에이전트는 대화 표본과 코드베이스 맥락을 처리하고, 작성합니다.`learned_context`공유 블록으로 구성하고, 아카이브 기록을 통합하거나 무효화합니다.

떨어지는 성질:

- **No latency cost.**기본 응답은 메모리 작전을 기다리지 않습니다.
- **Stronger model allowed.**수면시간 에이전트는 더 비싸고 느린 모델이 될 수 있습니다. 왜냐하면 그것은 지연 제한이 없기 때문입니다.
- **Natural consolidation window.**사용자가 기다리지 않을 때 모순된 사실을 정리하고, 요약하고, 무효화합니다.

형태는 인간들이 어떻게 작동하는지 일치합니다. 당신은 작업을 수행하고, 그 작업을 수행하고, 그 작업을 수행하고, 장기 기억은 하루아침에 정착합니다.

### 본래의 추론

레타 V1 (`letta_v1_agent`, 2026년) 을 비정부화 합니다.`send_message`/심박수와 직렬`Thought:`토큰은 네이티브 추론을 선호합니다. 응답 API (OpenAI) 와 확장된 사고 (Anthropic) 를 가진 메시지 API는 별도의 채널에서 추론을 발송하고, 차례로 통과합니다. 제어 루프는 여전히 ReAct입니다. 생각 흔적이 구조적이지만, 프롬프트 모양이 아닙니다.

### 이 패턴이 잘못되는 곳

- **Block bloat.**무한한`block_append`한계를 빠르게 통과합니다. 이 문장 위에 있는 글자 서술자
- **Silent drift.**잠 시간 에이전트는 블록을 다시 작성하고, 원본 에이전트는 결코 알아차리지 않습니다. 버전 블록과 표면 경각심을 추적합니다.
- **Poisoned consolidation.**잠 시간 에이전트는 공격자가 접근할 수 있는 내용을 핵심으로 처리합니다. 27장 교훈은 잠 시간 표면에도 적용됩니다.

```figure
memory-blocks
```

## 건설 해

`code/main.py`이 도구는

- `Block` ID, 라벨, 값, 제한, 설명
- `BlockStore` CRUD + `near_limit(label)`도와주는 사람
- 두 명의 스나이프 에이전트`PrimaryAgent`이 이`SleepTimeAgent`턴 사이가 통합됩니다.
- 블록과 3회 대화가 된 흔적이 적혀 있고, 그리고 블록을 요약하고 오래된 사실을 무효로 하는 잠 시간 패스

실행하세요:

```
python3 code/main.py
```

이 기록은 분할을 보여줍니다. 주요 회전들은 빠르게 되어 원자력으로 쓰이고, 수면 통과는 콤팩트되어 깨끗해집니다.

## 사용 하 고

- **Letta**(letta.com) 참조 구현. 자전 호스트 또는 관리 클라우드.
- **Claude Agent SDK skills**블록 모양의 지식으로  기술이란 에이전트가 요구에 따라 로드하는 이름, 버전, 검색 가능한 명령 블록입니다.
- **Custom builds**저장 백엔드를 제어하고 싶은 팀들을 위해 Letta API 계약을 사용해서 나중에 마이그레이션할 수 있습니다.

## 선박

`outputs/skill-memory-blocks.md`안전 규칙과 인용 전선을 포함한 모든 실행 시간 동안 잠 시간 해킹을 가진 Letta 모양의 블록 시스템을 생성합니다.

## 운동

1. `block_summarize`블록 값을 모델에 의해 생성된 요약으로 대체하는 도구`near_limit`어떤 트리거 열이 요약 호출과 블록 과잉을 최소화합니까?
2. 기록물 위에 잠 시간 추출을 구현: 텍스트가 90% 이상의 표기적 초복이 있는 두 기록이 하나로 붕괴. 잠 시간 통과에서만 수행하고, 절대 중요한 경로에서 하지 마십시오.
3. 버전 블록. 각 기록에 새 값과 다른 값을 적어`block_history(label)`그래서 운영자는 "왜 에이전트가 X를 잊었는지"를 디버깅 할 수 있습니다.
4. 잠실시간 요원들을 신뢰할 수 없는 작가로 취급하세요. Persona 또는 Safety 블록을 만지면,
5. Letta API를 사용하려면 예제를 포트 (`letta_v1_agent`ブロックスケー마에 어떤 변화가 있으며, 원천적 추론은 흔적 모양을 어떻게 변화시킨다?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Memory block | "Editable prompt section" | Typed, persistent, LLM-editable segment of core memory |
| Human block | "User memory" | Facts about the user, pinned in core |
| Persona block | "Agent identity" | Self-concept, tone, constraints, pinned in core |
| Sleep-time compute | "Async memory work" | Second agent doing consolidation off the critical path |
| Core / Recall / Archival | "Tiers" | Three-layer memory split: always-visible / conversation / external |
| Block limit | "Cap" | Character limit per block; forces summarization |
| Native reasoning | "Thinking channel" | Provider-level reasoning output, not prompt-level `Thought:` |
| Learned context | "Sleep output" | Facts the sleep-time agent writes into shared blocks |

## 더 많은 읽기

- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) 블록 패턴
- [Letta, Sleep-time Compute blog](https://www.letta.com/blog/sleep-time-compute) 비시크화 통합
- [Letta, Rearchitecting the Agent Loop](https://www.letta.com/blog/letta-v1-agent) 원산지 논리 재쓰기
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) 기원
