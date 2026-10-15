# 도서관 으로 된 장갑  수바겐트 및 세션 스토어

> 수입할 수 있는 배너스: 내장 도구, 컨텍스트 격리용 하부겐트, 해크, W3C 추적 전파, 세션 지속성. 클로드 에이전트 SDK는 참고 예제입니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 10 (Skill Libraries)
**Time:** ~75 minutes

## 학습 목표

- 인트로피 클라이언트 SDK (raw API) 와 클로드 에이전트 SDK (harness shape) 사이의 차이를 설명하십시오.
- 부자체  병렬화 및 맥락 격리  그리고 언제 그들을 찾아야 하는지 설명하십시오.
- Python SDK의 세션 저장 표면을 지정 (`append``load``list_sessions``delete``list_subkeys`) 및 `--session-mirror`- 그래
- 내장된 도구와 함께 stdlib 배너스를 구현하고, 격리된 맥락으로 수바겐트 배너, 라이프 사이클 해킹 및 세션 스토어를 구현합니다.

## 문제

원료 LLM API는 한 번 돌아가는 것을 제공합니다. 생산 에이전트는 도구 실행, MCP 서버, 라이프사이클 해킹, 서바겐트 자생, 세션 지속성, 흔적 증식. 클로드 에이전트 SDK는 이 모양을 라이브러리로 배포합니다.

## 개념

### 클라이언트 SDK vs 에이전트 SDK

- **Client SDK (`anthropic`).**무선 메시지 API, 루프, 도구, 국가
- **Agent SDK (`claude-agent-sdk`).**내장된 도구 실행, MCP 연결, 해킹, 주체 자생, 세션 스토어 클로드 코드 루프 라이브러리

### 내장된 도구

SDK는 10개 이상의 도구를 상자 밖으로 내보내는데: 파일 읽기/쓰기, 셸, grep, glob, 웹 검색 등. 사용자 지정 도구는 표준 도구-프로그램 인터페이스를 통해 등록합니다.

### 부하자

앤트로피크가 기록한 두 가지 목적:

1. **Parallelization.**독립적인 작업을 동시에 수행합니다. "이 20개의 모듈들 중 하나하나의 테스트 파일을 찾아라"는 20개의 병렬 하위 작업입니다.
2. **Context isolation.**수바겐트는 자신의 컨텍스트 창을 사용하지만, 그 결과만 오케스트레이터에게 돌아옵니다. 오케스트레이터의 예산은 보존됩니다.

파이썬 SDK 최근 추가: `list_subagents()``get_subagent_messages()`소바겐트 표본을 읽는 데

### 세션 스토어

타입스크립트와 프로토콜 평형성:

- `append(session_id, message)`     
- `load(session_id)`대화를 회복시켜
- `list_sessions()` 나열
- `delete(session_id)` 수바겐트 세션으로
- `list_subkeys(session_id)` 부하 키를 나열하세요.

`--session-mirror`(CLI 플래그) 에 의해 디버깅을 위해 외부 파일로 전송되는

### 

등록할 수 있는 라이프사이클 해킹:

- `PreToolUse``PostToolUse` 게이트 또는 감사 도구 호출
- `SessionStart``SessionEnd` 설치하고 무너뜨리는 것
- `UserPromptSubmit` 모델이 보고 있기 전에 사용자 입력에 따라 행동합니다.
- `PreCompact` 컨텍스트 컴팩션 전에 실행합니다.
- `Stop` 대리원 출구에서 청소
- `Notification` 부근 채널 알림

은 프로워크플로우 (단계 14 교육과정 참조) 및 유사한 시스템들이 어떻게 교차적 행동을 추가하는지입니다.

### W3C 추적 컨텍스트

호출자에서 활동하는 OTel 범위는 W3C 추적 컨텍스트 헤더를 통해 CLI 하위 프로세스에 퍼집니다. 전체 다 프로세스 추적은 백엔드에서 하나의 추적으로 표시됩니다.

### 클로드 는 에이전트 를 관리 하였다

호스트 대안 (베타 헤더)`managed-agents-2026-04-01`) 장기간 진행되는 아싱크 작업, 내장된 신속한 캐시, 내장된 압축, 관리된 인프라의 무역 제어

### 이 패턴이 잘못되는 곳

- **Subagent over-spawn.**100개의 작은 작업에 100개의 소바겐트를 다. 대부산이 지배한다. 대량 대신.
- **Hook creep.**팀마다 을 추가하고, 시작 시간 풍선을 추가하고, 을 4분기로 검토합니다.
- **Session bloat.**세션이 축적되고 크기가 커집니다. 사용 `list_sessions`+ 만료 정책

```figure
ae-subagent-isolation
```

## 건설 해

`code/main.py`stdlib에서 SDK 형태를 구현합니다:

- `Tool``ToolRegistry`내장된`read_file``write_file``list_dir`- 그래
- `Subagent` 개인 컨텍스트, 고립 실행, 결과 반환.
- `SessionStore` 부가, 로드, 리스트, 삭제, list_subkeys.
- `Hooks``pre_tool_use``post_tool_use``session_start``session_end`- 그래
- 데모: 메인 에이전트는 3개의 서바게ଣ୍ଟ을 병렬 (각 하나는 분리되어) 로 생성하고, 결과들을 집합하여, 세션이 지속된다.

실행하세요:

```
python3 code/main.py
```

추적은 주체적인 컨텍스트 격리 (오케스트레이터 컨텍스트 크기는 제한되어 있습니다),  실행 및 세션 지속성을 보여줍니다.

## 사용 하 고

- **Claude Agent SDK**클로드 코드 가맹이 모양을 원하는 클로드-프라이스트 제품
- **Claude Managed Agents**장기간 진행되는 호스팅된 아싱크 작업에 대해
- **OpenAI Agents SDK**(강좌 16) OpenAI-제1대 상대방에 대하여
- **LangGraph + custom tools**그래프 모양의 상태 기계를 원하면

## 선박

`outputs/skill-claude-agent-scaffold.md`클로드 에이전트 SDK 앱을 스카프로 설정하고 있으며, 서바겐트, 해킹, 세션 스토어, MCP 서버 첨부 및 W3C 추적 전파를 제공합니다.

## 운동

1. 20개의 작업을 5개의 병렬 하위 요소의 그룹으로 배열하는 하위 요소 자동기를 추가하십시오. 오케스트레이터 컨텍스트 크기를 대 한 하나에 대 한 작업에 측정하십시오.
2. `PreToolUse`이 비율 제한을 `write_file`전화 (5 분당 한 세션) 행동 추적
3. 전선`list_subkeys`둥지를 틀는 것은 어떤 모습일까요?
4. 장난감을 진짜로 가져가라`claude-agent-sdk`파이썬 패키지 도구 등록에 대한 변화는 무엇입니까?
5. 클로드 매니지드 에이전트 문서들을 읽어보세요. 언제부터 자영에서 관리로 전환하겠죠?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent SDK | "Claude Code as a library" | Harness shape: tools, MCP, hooks, subagents, session store |
| Subagent | "Child agent" | Separate context, own budget; results bubble up |
| Session store | "Conversation DB" | Persist, load, list, delete turns with subagent cascade |
| Hook | "Lifecycle callback" | Pre/post tool, session, prompt submit, compact, stop |
| W3C trace context | "Cross-process trace" | Parent span propagates into CLI subprocess |
| Managed Agents | "Hosted harness" | Anthropic-hosted long-running async work |
| `--session-mirror` | "Transcript mirror" | Writes session turns to an external file as they stream |
| MCP server | "Tool surface" | External tool/resource source attached to the agent |

## 더 많은 읽기

- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) 클로드 코드 도서관 형태
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) 생산 패턴
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) 호스트 대안
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 대조
