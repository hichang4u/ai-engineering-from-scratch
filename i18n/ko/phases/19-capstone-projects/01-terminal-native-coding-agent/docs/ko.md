# 캡스톤 01  터미널 네이티브 코딩 에이전트

> 2026년까지 코딩 에이전트의 형태가 정해져 있습니다. TUI , 상태적인 계획, 모래 상자 도구 표면, 계획, 행동, 관찰, 회복하는 루프. 클로드 코드, 커서 3, 오프노드 모두 50피트에서 똑같습니다. 이 끝돌은 당신이 끝에서 끝을  CLI를 만들도록 요청합니다, 요청을 로 끌어내고 SWE 벤치 프로에서 미니-Swe-agent과 Live-SWE-agent에 비교하여 측정합니다. 왜 어려운 부분은 모델 호출이 아니라 도구 루프, 샌드박스, 그리고 50회 회전에서 비용의 천장이 아니라는 것을 알게 될 것입니다.

**Type:** Capstone
**Languages:** TypeScript / Bun (harness), Python (eval scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools and protocols), Phase 14 (agents), Phase 15 (autonomous systems), Phase 17 (infrastructure)
**Phases exercised:**P0 · P5 · P7 · P10 · P11 · P13 · P14 · P15 · P17 · P18
**Time:** 35 hours

## 문제

코딩 에이전트는 2026년에 AI 응용 분야의 지배적인 범주로 자리 잡았다. 클로드 코드 (안트로피크), 커서 3와 컴포저 2 및 에이전트 탭 (커서), AMP (소스그라프), 오픈코드 (112k 별), 공장 드로이드, 구글 줄스 같은 건축물의 모든 배트 변종: 터미널 배너스, 허가 된 도구 표면, 모래 상자, 그리고 국경 모델을 중심으로 구축 된 계획-행동 관찰 루프. 경계는 좁습니다. SWE 벤치에서 79.2%까지 도달했습니다. Opus 4.5 로 확인되었지만 엔지니어링 공기는 넓습니다. 대부분의 실패 모드는 모델 오류가 아닙니다. 도구 루프 불안정성, 맥락 중독, 도킹 비용의 탈락, 파괴적인 파일 시스템 운영입니다.

외부에서 이런 요인을 논할 수 없습니다. 당신은 하나를 만들고, 리프그랩이 8MB의 경기력을 반환할 때 47번 턴에서 루프 충돌을 지켜보고,

## 개념

배너스는 네 개의 표면을 가지고 있습니다.**Plan**TodoWrite 스타일의 상태 객체를 유지하여 모델이 각 회전을 다시 작성합니다. **Act**도구 호출을 전송 (읽기, 편집, 실행, 검색, git). **Observe**stdout/stderr/출장 코드를 캡처하고, 줄여서, 요약을 다시 입력합니다. **Recover**2026 모양은 또 다른 것을 추가합니다.**hooks**-`PreToolUse``PostToolUse``SessionStart``SessionEnd``UserPromptSubmit``Notification``Stop`그리고`PreCompact` 운영자가 정책, 텔레메트리 및 경비선을 주입하는 구성 가능한 확장 지점

모래 상자는 E2B 또는 Daytona입니다. 각 작업은 git 워크 트리에 설치된 읽기-쓰기와 함께 신선한 dev 컨테이너에서 실행됩니다. 이 배너스는 호스트 파일 시스템을 만지지 않습니다. 성공이나 실패에 따라 나무가 무너집니다. 비용 통제는 세 층으로 시행됩니다. 회전당 토큰 천장, 회전당 달러 예산, 그리고 하드 회전 제한 (일반적으로 50). 관측가능성 계층은 GenAI의 의미적 협약으로 OpenTelemetry 영역을 뻗어 있으며, 자체 주최된 Langfuse로 전송됩니다.

## 건축

```
  user CLI  ->  harness (Bun + Ink TUI)
                  |
                  v
           plan / act / observe loop  <--->  Claude Sonnet 4.7 / GPT-5.4-Codex / Gemini 3 Pro
                  |                          (via OpenRouter, model-agnostic)
                  v
           tool dispatcher (MCP StreamableHTTP client)
                  |
     +------------+------------+----------+
     v            v            v          v
  read/edit    ripgrep     tree-sitter   git/run
     |            |            |          |
     +------------+------------+----------+
                  |
                  v
           E2B / Daytona sandbox  (worktree isolated)
                  |
                  v
           hooks: Pre/Post, Session, Prompt, Compact
                  |
                  v
           OpenTelemetry -> Langfuse (spans, tokens, $)
                  |
                  v
           PR via GitHub app
```

## 

- 배너스 실행시간: Bun 1.2 + 잉크 5 (터미널에서 반응)
- 모델 액세스: 클로드 소넷 4.7, GPT-5.4-코덱스, 트메니 3 프로, 오푸스 4.5 (가장 어려운 작업)
- 도구 운송: 모델 컨텍스트 프로토콜 스트리메블HTTP (MCP 2026 개정)
- 모래 상자: E2B 모래 상자 (JS SDK) 또는 데이토나 개발 컨테이너
- 코드 검색: 17개 언어에 대한 ripgrep 하위 프로세스, 트리 시터 파서 (전 작성)
- 격리:`git worktree add`작업에 따라 성공/실패에 대한 정리
- Eval 배너스: SWE 벤치 Pro (확인 하위 집합) + 터미널 벤치 2.0 + 자신의 30 작업 홀도아웃
- 관찰 가능: OpenTelemetry SDK `gen_ai.*`semconv → 자영용 랭푸스
- PR 게시: 미세한 토큰을 가진 GitHub 앱, 대상 레포에 제한된 범위

```figure
ce-agent-loop
```

## 건설 해

1. **TUI and command loop.**잉크로 을 `agent run <repo> "<task>"`. 플랜 패널 (상), 도구 호출 스트림 (중), 토큰 예산 (하) 을 인쇄합니다. 발사하는 Ctrl-C에 취소 추가합니다 `SessionEnd`출구 전에 을 

2. **Plan state.**입력된 TodoWrite 스키마를 정의하십시오 (pending / in_progress / done items with notes). 모델은 모든 차례에 걸쳐 전체 상태를 도구 호출으로 다시 작성합니다.`.agent/state.json`사고가 재개될 수 있도록

3. **Tool surface.**6가지 도구를 정의하세요: `read_file``edit_file`(다른 사전 예시와 함께)`ripgrep``tree_sitter_symbols``run_shell`(시간이 제한된)`git`MCP 스트리메블HTTP를 통해 노출하여 배너스는 운송 비관성입니다. 모든 도구는 단축된 출력을 반환합니다.

4. **Sandbox wrapping.**각 작업은 E2B 샌드박스를 낳습니다.`git worktree add -b agent/$TASK_ID`새로운 분자, 모든 도구 호출은 모래 상자 안에 실행됩니다. 호스트 파일 시스템은 접근할 수 없습니다.

5. **Hooks.**2026년 모두 8가지 형을 구현한다. 사용자에 의해 작성된 적어도 4개의 을 가집니다. (a) `PreToolUse`파괴적인 지휘 보좌가 차단합니다`rm -rf`작업나무 밖에,`PostToolUse`표기적 회계, (c) `SessionStart`예산 초기화, (d) `Stop`마지막 흔적을 기록합니다.

6. **Eval loop.**SWE-bench Pro Python의 30개의 과목의 하위 집합을 복제합니다. 각에 대한 리네스를 실행합니다. pass@1, turns-per-task, and $-per-task에서 mini-swe-agent (최저 기본 라인) 에 비교합니다. 결과를`eval/results.jsonl`- 그래

7. **Cost control.**어려운 제한: 50회, 200만회, 5달러 일당.`PreCompact`크는 150k의 지점에 있는 이전 상태 블록으로 구슬을 정리해 새로운 관측을 할 수 있는 공간을 확보하고 계획도 잃지 않고 있습니다.

8. **PR posting.**성공에 대한 마지막 단계는`git push`+ GitHub API 호출으로 계획과 다른 요약이 있는 PR를 열 수 있습니다.

## 사용 하 고

```
$ agent run ./my-repo "Fix the race condition in worker.rs"
[plan]  1 locate worker.rs and enumerate mutex uses
        2 identify shared state under contention
        3 propose fix, verify tests
[tool]  ripgrep mutex.*lock -t rust           (44 matches, truncated)
[tool]  read_file src/worker.rs 120..180
[tool]  edit_file src/worker.rs (+8 -3)
[tool]  run_shell cargo test worker::          (passed)
[plan]  1 done · 2 done · 3 done
[done]  PR opened: #482   turns=9   tokens=38k   cost=$0.41
```

## 선박

이 능력은`outputs/skill-terminal-coding-agent.md`. 레포 경로와 작업 설명을 고려하면, 전체 계획-행동-관측 루프를 모래 상자에서 실행하고 PR URL 및 추적 팩트를 반환합니다. 이 끝돌의 라브릭은:

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 vs baseline | Your harness vs mini-swe-agent on 30 matched Python tasks |
| 20 | Architecture clarity | Plan/act/observe separation, hook surface, tool schema — reviewed against Live-SWE-agent layout |
| 20 | Safety | Sandbox escape tests, permission prompts, destructive-command guard passes red-team |
| 20 | Observability | Trace completeness (100% of tool calls spanned), token accounting per turn |
| 15 | Developer UX | Cold-start < 2s, crash recovery resumes plan, Ctrl-C cancels mid-tool cleanly |
| **100** | | |

## 운동

1. 클로드 소넷 4.7에서 vLLM에서 제공되는 Qwen3-코더-30B로 뒷받침 모델을 변경하십시오. pass@1와 $-per-task을 비교하십시오. 오픈 모델이 저조한 성능을 보이는 것을 보고하십시오.

2. `reviewer`PR 게시 전에 이 차이를 읽고 수정 루프를 요청할 수 있는 하위 에이전트. 거짓 긍정적 인 리뷰가 SWE 벤치 통과율을 단일 에이전트 기본 기준보다 낮게 떨어뜨리는지 측정하십시오 (힌트: 일반적으로 예).

3.  Sandbox:      `curl`외부 URL와 작업 트리 밖에서 작성되는 작업. PreToolUse 해킹으로 차단된 것을 확인합니다. 시도를 기록하십시오.

4. 시행`PreCompact`더 작은 모델 (하이쿠 4.5) 를 통해 요약한다.

5. MCP 스트리메블HTTP 전송을 스튜디오에 교환하여 냉동 시작 및 통화 지연을 기준으로 설정하여 로컬 사용만을 위한 승자를 선택합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Harness | "The agent loop" | The code surrounding the model that dispatches tools, maintains plan state, and enforces budgets |
| Hook | "Agent event listener" | A user-authored script run on one of eight lifecycle events by the harness |
| Worktree | "Git sandbox" | A linked git checkout at a separate path; disposable without touching the main clone |
| TodoWrite | "Plan state" | A typed list of pending/in-progress/done items the model rewrites each turn |
| StreamableHTTP | "MCP transport" | 2026 MCP revision: long-lived HTTP connection with bidirectional streaming; replaces SSE |
| Token ceiling | "Context budget" | Per-turn or per-session cap on input+output tokens; triggers compaction or termination |
| pass@1 | "Single-attempt pass rate" | Fraction of SWE-bench tasks solved on the first run without retry or test-set peeking |

## 더 많은 읽기

- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) Anthropic의 참조 배너스
- [Cursor 3 changelog](https://cursor.com/changelog) 에이전트 탭 및 컴포지터 2 제품 노트
- [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) SWE 벤치 리너스 비교의 최소 기준
- [Live-SWE-agent](https://github.com/OpenAutoCoder/live-swe-agent) 79.2% SWE 벤치 Opus 4.5로 확인
- [OpenCode](https://opencode.ai) 열린 반지, 112k 별
- [SWE-bench Pro leaderboard](https://www.swebench.com) 이 최종 목표의 평가
- [Model Context Protocol 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) 스트리메이블HTTP, 기능 메타데이터
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 도구 호출 및 토큰 사용을위한 스팸 스키마
