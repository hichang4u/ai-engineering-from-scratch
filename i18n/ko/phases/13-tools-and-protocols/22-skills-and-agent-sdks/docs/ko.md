# 에이전트 기술: 휴대용 계약 및 실행 시간 제한

> 기술이란 더 나은 파일 이름과 함께 긴 프롬프트가 아니라, 실행 시 계약으로 에이전트의 맥락에 들어가는 지침, 자원 및 실행 가능한 보조자들로 이루어진 발견 가능한 패키지입니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 01 (The Tool Interface), Phase 13 · 05 (Tool Schema Design)
**Time:** ~90 minutes

## 학습 목표

- 프롬프트, 저장소 명령어, 도구, 할크, 서바게인트, 플러그인과 혼동하지 않고 에이전트 기술을 정의하십시오.
- 휴대용을 읽어보세요`SKILL.md`계약과 실행시간 특유의 연장과 분리
- 발견, 선택, 활성화, 자원 부하, 도구 사용 및 검증을 생활 순환 단계로 설명합니다.
- 랜타임이 에이전트의 카탈로그에 넣기 전에 스킬 패키지를 검증하세요.
- 특정 작업에 대한 기술, MCP 도구, 해크, 서바겐트 또는 일반 코드 중에서 선택하십시오.

## 10분 첫 성공

긴 설명 전에 이렇게하십시오. 당신은 작은 기술을 만들 것입니다, 설치
전체 리뷰어 팩트를 실제 에이전트 호스트로, 그것을 호출,
이 결과로, 생기는 생기는 과정을 관찰할 수 있는 결과로 증명합니다.

### 실제 호스트 실험실로 가는 전편

실제 호스트 체크포인트에는 Node.js가 필요합니다.`npx`, 파이썬 3 , 1번 선택
기술능력 있는 호스트, 그리고 당신이 선택한 프로젝트 또는 사용자 범위에 액세스하는
먼저 로컬 명령어를 확인하세요:

```bash
node --version
npx --version
python3 --version
```

설치 전에 어떤 호스트와 범위를 사용할지 결정하십시오.
요구 사항이 없습니다, 이 강의를 웹 사이트에서 읽거나 계속
아래의 수동 패키지 연습입니다. 그 후반은 계약을 가르칩니다, 하지만
호스트 발견, 호출, 뭉치 스크립트 실행을 증명하지 않습니다. 또는
이 관찰을 대기중으로 표시하고

### 1. 빈 작업 디렉토리에서 시작

학습 작업을 계속하는 부모 디렉토리에서 다음 명령을 실행하십시오:

```bash
mkdir -p agent-skills-first-run
cd agent-skills-first-run
TARGET_ROOT="$(pwd -P)"
printf 'TARGET_ROOT=%s\n' "$TARGET_ROOT"
ls -A
```

마지막 명령은 아무것도 인쇄하지 않아야 합니다.
빈 디렉토리, 그래서 리뷰는 명확한 경계를 가지고 있습니다.

첫 번째 기술을 위한 디렉토리를 만들세요:

```bash
mkdir -p my-first-skill
```

창조`my-first-skill/SKILL.md`이 내용으로:

```markdown
---
name: my-first-skill
description: Turn rough meeting notes into a compact decision record when the user asks to capture a technical decision.
---

# Decision record

Extract the decision, context, alternatives, owner, and next review date.
If the notes do not contain a decision, ask one clarifying question instead
of inventing one.
```

원하는 디렉토리에서 파일을 생성했는지 확인합니다.

```bash
test -f my-first-skill/SKILL.md
```

출력 및 출력 코드 0이 없는 것은 파일의 존재라는 것을 의미합니다.

### 2. 전체 리뷰어 패키지를 설치

안 돼`agent-skills-first-run`그리고 실행:

```bash
npx skills add rohitg00/ai-engineering-from-scratch --skill skill-contract-reviewer --full-depth
```

사용 중인 에이전트 호스트 및 범위를 선택하십시오. 설치자는 목록
`skill-contract-reviewer`그리고 그 목적지가 기록되어 있습니다.`--full-depth`이
이 수업의 능력은 참조와 함께 한 둥지를 틀어 놓은
시나리오와 자산

세트 `SKILL_ROOT`설치업자가 보고한 절대 디렉터리
설치된 `SKILL.md`, 수업의 출처가 아닙니다
현재 작업 공간이 아닌 디렉토리:

```bash
# Replace the placeholder with the destination printed by the installer.
SKILL_ROOT="$(cd "/absolute/path/to/skill-contract-reviewer" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\n' "$SKILL_ROOT"
```

만약 에이전트 세션이 이미 열려있다면 새로운 세션을 시작하거나 호스트의
모든 호스트가 카탈로그를 핫 로드한다고 가정하지 마세요.

### 3. 그것을 명시적으로 부른다면

설치된 에이전트에서`agent-skills-first-run`일하는
디렉토리, 해당 호스트가 지원하는 문법을 사용:

| Host | Explicit invocation |
|---|---|
| Codex | `skill-contract-reviewer`, or choose it from `/skills`, then provide the review request |
| Claude Code | `/skill-contract-reviewer` followed by the review request |
| Portable fallback | `Use skill-contract-reviewer to review the target package.` |

`SKILL_ROOT`그리고`TARGET_ROOT`이
실행하기 전에 호스트가 확장하도록 요구하고 정확한
해결된 명령어, 프로세스 작업 디렉토리에 의존하는 명령어가 아닙니다:

```text
Use skill-contract-reviewer to review <TARGET_ROOT>/my-first-skill. The installed bundle root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/check_skill.py <TARGET_ROOT>/my-first-skill. Before running it, show the fully resolved argv. Return the validation report, selected primitives, and one sentence for each selection. Include the resolved script path, resolved target path, cwd, argv, and exit code as execution evidence.
```

해산된 명령어는 다음과 같은 모양으로 되어 있고, 그 자리에 있는 자리가 남아 있지 않아야 합니다.

```bash
python3 "/absolute/install/path/skill-contract-reviewer/scripts/check_skill.py" \
  "/absolute/workspace/path/agent-skills-first-run/my-first-skill"
```

성공적인 결과는 세 가지 특성을 모두 가지고 있습니다.

1. 호스트가 찾습니다`skill-contract-reviewer`이름으로
2. 검토자는 패키지 계약서를 읽고 그 복합 검증기를 실행한다.
3. 응답은 구조적 오류가 없는 검증 보고서를 포함하고 있습니다.
   샘플, 그리고 합리적인 원시 선택.

실행 증거는 또한 스크립트 경로, 목표 경로, cwd, 정확한
이 분야가 없는 유동적인 보고서는
설치된 동반자 스크립트가 실행되었음을 증명합니다.

호스트가 스킬이 사용할 수 없다고 보고하면, 설치 확인
목적지, 다시 스캔 또는 다시 시작 한 번, 그리고 다시 명시적인 요청 시도
설치 오류를 숨기기 위해 기술 설명서를 다시 작성합니다.

### 4. 탐사선 암시 선택

새로운 에이전트 턴을 시작해서 기술을 명명하지 않고 동일한 작업을 입력합니다.

```text
Review <TARGET_ROOT>/my-first-skill as a reusable agent package and tell me whether its package contract is valid.
```

호스트가 선택된 기술을 노출한다면, 선택했는지 여부를 기록하십시오
`skill-contract-reviewer`호스트가 라우팅을 노출하지 않는 경우, 암시 표시
선택은 확인되지 않은 것으로 명시적으로 호출하는 것은 휴대용 fallback입니다.

### 5. 청소해

설치된 리뷰어 패키지를 제거합니다.

```bash
npx skills remove skill-contract-reviewer
```

설치 중에 사용된 호스트와 범위를 선택합니다. 다시 스캔 한 후 또는 새로운
회의,  명시적인 요청`skill-contract-reviewer`보고해야 합니다.
가동이 불가능합니다`my-first-skill`나중에 수업을 듣거나
트랙을 마친 후에 연구소 디렉토리를

## 문제

팀원들은 신뢰할 수 있는 리लीज 워크플로우를 가지고 있다고 가정해보세요. 이 워크플로우는 통합된 변경사항을 찾아, 마이그레이션 메모를 확인하고, 셔닝 로그를 업데이트하고, 패키지 명령어를 실행하고, 검토 체크리스트를 생성합니다.

이 작업 흐름을 하나의 명령어에 넣는 것은 붙이기 쉽고 작동하기 어렵게 합니다. 명령어는 안정적인 아이덴티티, 발견 규칙, 리소스 제한, 테스트 할 수 있는 패키지 모양이 없으며 기본적인 질문에 대한 답변이 없습니다. 누가 호출할 수 있습니까? 모델은 언제 선택해야합니까? 어떤 스크립트를 실행할 수 있습니까? 어떤 파일들이 신뢰할 수 있습니까? 맥락이 압축되면 살아남는 것은 무엇입니까?

반대의 실수 는 재사용 가능한 모든 명령 을 기술 으로 간주 하는 것 이다. 저장소 협약, 결정적 자동화, 외부 도구, 이벤트 해킹 및 위임 대리자 는 다양한 문제 를 해결 합니다.`SKILL.md`한 호스트의 문서화되지 않은 행동에 따라 휴대할 수 있는 디렉토리를 생성합니다.

첫 번째 엔지니어링 작업은 분류입니다. 어떻게 포장할지 결정하기 전에 유물이 무엇인지 결정합니다.

## 개념

### 기술: 절차적 지식을 코딩하는 기술

에이전트 스킬은 입력 지점이 있는 디렉토리입니다`SKILL.md`. 입력 파일에는 YAML 전면물, 그 다음 Markdown 명령어가 포함되어 있습니다. 디렉토리는 또한 참조, 스크립트 및 자산이 포함될 수 있습니다.

```figure
skill-package-anatomy
```

디렉토리, 마크다운 파일만 아닌, 배포 가능한 단위입니다.`SKILL.md`참고 자료가 부족한 패키지는 전면 물질이 파스되더라도 깨진 패키지입니다.

### 이웃 추상

| Artifact | Primary job | Loaded or run when | What it should not impersonate |
|---|---|---|---|
| Prompt | Shape one model interaction | Included by an application or user | A versioned package with resources |
| Repository instructions | Explain one codebase's standing rules | A coding runtime enters that scope | A reusable task workflow |
| Agent skill | Supply reusable procedural knowledge | Explicit or implicit activation | A hard authorization boundary |
| MCP tool | Expose a typed remote capability | The model or application calls it | A detailed operating procedure |
| Hook | Run deterministic logic on an event | The declared event occurs | Probabilistic model routing |
| Subagent | Delegate work with separate context and state | An orchestrator creates or calls it | A static instruction bundle |
| Plugin | Distribute a larger runtime extension | The host installs or enables it | The portable skill contract itself |
| Learned skill library | Store behavior discovered through experience | A policy retrieves a prior program or trajectory | A standards-based `SKILL.md` package |

발매 능력은 에이전트에 발매물을 검사하는 방법을 알려줄 수 있습니다. MCP 서버는 발매 레지스트리를 노출시킬 수 있습니다. 할크는 직접적인 밀어붙이는 것을 금지할 수 있습니다. 서바겐트는 독립적으로 후보자를 감사 할 수 있습니다. 이 조각은 서로 다른 책임을 가지고 있기 때문에 구성됩니다.

### "능력"이라는 단어는 두 가지 다른 아이디어를 지칭합니다

연구 시스템은 때때로 학습된 프로그램, 성공적인 궤도 또는 환경 특화된 정책 조각을 기술이라고 부른다. 에이전트는 탐구 중에 이러한 유물을 만들 수 있으며, 작업 유사성으로 검색하고, 실행하고, 피드백에서 도서관을 수정할 수 있습니다. 14 · 10 단계는 그러한 평생 학습 도서관을 구축합니다.

이 미니 트랙의 에이전트 스킬은 다르다. 그것은 선언된 파일 시스템 계약, 카탈로그 메타데이터, 프로그레시브 공개, 런타임 중재된 호출 및 호스트 제어 된 도구가 있는 저작자 패키지입니다. 그것은 에이전트가 생성하거나 개선할 수 있지만 형식에 대한 학습이 필요하지 않습니다.

| Dimension | Agent Skill package | Learned skill library |
|---|---|---|
| Primary unit | `SKILL.md` directory | Program, policy, trajectory, or memory record |
| Creation | Authored, generated, or curated | Usually discovered from environment experience |
| Selection | Catalog description plus runtime policy | Retrieval or policy over task state |
| Execution | Model follows instructions and calls host tools | Environment runs a stored behavior or code artifact |
| Portability | Package contract can cross compatible hosts | Often tied to one environment and action space |
| Evaluation | Routing, artifact, safety, and host compatibility | Reward, success rate, transfer, and library growth |

두 가지 아이디어는 재사용 가능한 역량을 포괄합니다. 그들은 단지 같은 이름을 가지고 있기 때문에 실행 주장을 공유해서는 안 됩니다.

### 휴대용 코어

에이전트 스킬 스펙은 2개의 전면 필드를 요구합니다

```yaml
---
name: release-readiness
description: Inspect a release candidate when the user asks whether a version is ready to publish.
---
```

`name`안정적인 식별자입니다. 그것은 사양의 이름 규칙에 만족하고 모자 디렉토리에 일치해야 합니다. `description`기술력이 무엇을 하고 언제 적용되는지 알려야 합니다.

휴대용 선택적 필드는:

| Field | Purpose | Portability note |
|---|---|---|
| `license` | State the terms for the package | Core specification |
| `compatibility` | State environmental requirements | Core specification |
| `metadata` | Carry string-valued extension data | Core specification |
| `allowed-tools` | Suggest pre-approved tools | Experimental; host support varies |

마크다운 기관은 운영 지침을 보유하고 있습니다. 작업 흐름, 의사 결정 포인트, 실패 행동 및 지원 자원에 대한 직접적인 경로를 정의해야합니다.

```markdown
# Release readiness

Use this workflow for a release candidate, not for ordinary development builds.

1. Read `references/release-policy.md`.
2. Run `python3 scripts/inspect_release.py --format json`.
3. Stop if the report contains a blocking failure.
4. Produce the checklist from `assets/release-checklist.md`.
5. Ask for approval before any publish or tag action.
```

### 실행시간 확장자는 두 번째 층입니다

일부 호스트는 추가적인 프론터 또는 동반자 구성을 허용합니다. 이러한 필드는 유용하지만 자동으로 휴대할 수 없습니다.

| Behavior | Example host extension | Portable core? |
|---|---|:---:|
| Hide a skill from model routing while keeping direct user invocation | `disable-model-invocation` | No |
| Hide a skill from the user's command menu while allowing model routing | `user-invocable` | No |
| Show argument help in a command menu | `argument-hint` | No |
| Run the skill in delegated context | `context`, `agent` | No |
| Pin model or reasoning settings | `model`, `effort` | No |
| Register lifecycle automation | `hooks` | No |
| Disable implicit invocation in Codex | `agents/openai.yaml` policy | No |

각 확장 프로그램을 어댑터로 취급하십시오. 핵심 작업 흐름을 그 없이 유효하게 유지하여, 실패를 기록하고, 그것을 소비하는 호스트를 테스트하십시오. 실행 시간은 알려지지 않은 필드를 무시하거나, 행동을 구현하지 않고 그것을 거부하거나 보존할 수 있습니다.

### 전면물질은 실행 가능한 메타데이터

메타데이터는 기술체에 대한 읽기 전에 시스템 행동을 변화시킵니다.

- 고장애인`name`발견이 실패할 수 있습니다.
- 미묘한`description`잘못된 요청을 전달할 수 있습니다.
- 인간만 사용하는 깃발은 모델의 카탈로그에서 기술을 제거할 수 있습니다.
- 도구 용량은 호스트가 허락을 요청하는지 여부를 변경할 수 있습니다.
- 컨텍스트 설정은 실행을 별도의 에이전트 세션으로 옮길 수 있습니다.

구성 코드와 같은 전면 물질을 검토하고, 이를 검증하고, 버전으로 수정하고, 그 행동을 평가에 포함합니다.

### 기술 생활 순환

```figure
skill-runtime-lifecycle
```

각각의 화살표는 각각의 실패 모드가 있는 한계입니다.

1. **Discovery**구성된 위치에서 가능한 패키지를 찾습니다.
2. **Validation**카탈로그 출판 전에 잘못된 형태 또는 안전하지 않은 패키지를 거부합니다.
3. **Cataloging**  `name`그리고`description`전체 패키지 아닌
4. **Selection**능력의 중요성을 결정합니다.
5. **Activation**모델에 보이는 컨텍스트에 몸을 로드합니다.
6. **Disclosure**지사가 요구할 때만 참조나 자산을 읽는다.
7. **Execution**호스트의 허가 및 격리 규칙에 따라 호스트 도구를 사용합니다.
8. **Verification**생산된 유물을 모델의 주장에 상관없이 검사합니다.

이 단계 가 붕괴 되는 것 은 나쁜 정신 모델 이 된다. 발견 된 기술 은 활동 하지 않는다. 활동 한 기술 은 그 기술 은 묘사 한 모든 것 을 할 권한 이 없다. 허용 된 도구 호출 은 결과 가 정확 한 것 을 증명 하는 것 이 아니다.

### 기술과 도구는 정렬

MCP는 "이 응용 프로그램에서 어떤 기능이 요구될 수 있으며 그 스키마는 무엇입니까?"라고 대답합니다.

```figure
skill-tool-orthogonality
```

기술은 도구를 이름 지킬 수 있지만 호스트는 실제 기능 레지스트리를 소유하고 있습니다. 도구가 없는 경우 기술은 실패 또는 실패를 분명히 명시해야합니다. 그것은 결코 기능을 이름 지는 것을 의미해서는 안됩니다.

### 기술과 저장장치 지침은 다른 범위입니다

저장소 명령어는 이미 있는 환경 (커맨드, 컨벤션, 생성된 파일, 경계) 을 설명합니다. 기술 은 여러 저장소에서 발생할 수 있는 작업에 대해 재사용 가능한 절차를 제공합니다.

두 가지 모두 적용될 경우, 활성 사용자 요청과 저장소 규칙은 기술을 제한합니다. 일반적인 재조정 기술은 생성된 파일을 편집하는 것을 금지하는 저장소 규칙을 초과해서는 안됩니다.

### 기술들은 서로 수입하지 않습니다.

한 기술은 에이전트를 다른 기술을 호출하도록 지시할 수 있지만 이것은 언어 수준의 수입이 아닙니다. 두 번째 기술은 여전히 실행 시간 발견, 자격, 활성화, 권한 및 컨텍스트 처리 과정을 거친다.

기술 간 의존성을 관찰 가능한 작업 흐름 가장자리로 작성하십시오.

```markdown
After producing the candidate changelog, invoke the `release-risk-review` skill.
Pass the candidate path and require a blocking or non-blocking verdict.
If that skill is unavailable, stop and report the missing dependency.
```

이것은 의존성을 테스트할 수 있게 하고 호스트에게 정책을 집행할 기회를 제공합니다.

## 건설 해

`code/main.py`작은 표준 중심의 검증기와 유물 선택자를 구현합니다. 그것은 stdlib-만 유지됩니다. 그래서 모든 규칙이 눈에 띄는 것입니다.

검증자는 다음과 같은 사실을 밝힌다.

- `parse_frontmatter(text)`메타데이터를 몸에서 분리하기 위해서입니다.
- `validate_skill_text(text, directory_name, allowed_runtime_extensions=())`필요한 필드, 이름, 알려지지 않은 확장, 신체 존재 및 휴대 가능한 제한을 확인합니다.
- `ValidationIssue`그리고`SkillReport`불투명한 boolean 대신 구조화된 증거를 반환합니다.
- `FrontmatterSyntaxError`안전하게 해석할 수 없는 입력에 대해

선택자는 노출합니다`TaskShape`그리고`select_primitives(task)`. 그것은 일반적인 코드, 저장소 명령어, 기술, 할크, subagent, 또는 MCP 도구에 작업의 필요를 지도합니다.

실험실 운영:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/22-skills-and-agent-sdks
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

이 명령 블록은 로컬 클론을 필요로 하며 내부에서 시작해야 합니다
그 클론은 그렇죠`git rev-parse --show-toplevel`저장소 루트를 해결할 수 있습니다.

데모는 유효한 휴대용 기술, 한 호스트 확장 기술, 한 무효 패키지 및 여러 작업 형태 결정에 대해 JSON를 인쇄합니다. 문제 코드를 검사하십시오. 패키지 검증자는 작가의 이름으로 추측하지 않고 유물을 수정하는 방법을 설명해야합니다.

### 유효성령의 문제

더 깊은 내용 규칙 전에 저렴한 구조적인 사실을 확인합니다.

```figure
skill-validation-order
```

이 순서는 제2 오류가 첫 번째 깨진 변수를 가려하지 않도록 방지합니다.

## 사용 하 고

기술 기술 작성하기 전에 다음 결정 카드를 작성하세요:

| Question | If yes | Likely primitive |
|---|---|---|
| Does this need reusable model judgment across several steps? | The procedure is stable but decisions vary | Skill |
| Must this happen every time an event fires? | Missing one execution is unacceptable | Hook or application code |
| Does the model need an external capability with typed inputs? | The operation lives outside model context | Tool or MCP server |
| Does the work need isolated context, state, or ownership? | A separate worker returns a bounded result | Subagent |
| Is this guidance specific to one repository? | It describes local commands and constraints | Repository instructions |
| Is one interaction enough? | No package lifecycle is needed | Prompt |

많은 생산 작업 흐름은 한 줄 이상의 것을 사용한다. 카드는 하나의 유물들이 모든 속성을 제공한다고 하는 것을 방지합니다.

## 선박

이 교훈은`skill-contract-reviewer`아래 `outputs/`. 이 함수는:

- 휴대용`SKILL.md`제안된 기술 패키지를 검토하는 것
- 휴대용 계약 및 원시 선택에 대한 참조 체크리스트
- 결정적 검증 스크립트
- 명령어, 기술, 도구, 해킹, 일반 코드 및 서바게ଣ୍ଟ을 포함하는 작업 모양의 장치

단지 입력 파일 뿐만 아니라 전체 패키지를 설치합니다.

```bash
cd "$(git rev-parse --show-toplevel)"
python3 scripts/install_skills.py /tmp/aiefs-skills --phase 13 --type skill
```

과정 설치자는 복사된 단계 13 기술에 대해 보고하고
`/tmp/aiefs-skills/manifest.json`. 이 깨끗한 목적지는 패키지의 형태를 확인합니다.
위의 첫 번째 성공 루프는 실제 호스트에서 발견과 호출을 검사합니다.

다음 수업은 각 생명체계 단계를 심화시킵니다. 24강은 발견과 점진적인 공개를 구축합니다. 25강은 호출 정책과 라우팅을 구축합니다. 26강은 샌드박싱에서 권한을 분리합니다. 27강은 전체 패키지를 평가 된 출시 유물으로 만듭니다.

## 운동

1.                                                    `TaskShape`원시적인 경우를 다 선택해
2. 500자격의`compatibility`값이 지나고 501자격 값이 실패하는 것은 사양 오류로
3. 허용 목록에 한 번의 실행 시간 확장 프로그램을 추가하십시오. 동일한 파일이 휴대용 기술에서 여전히 구별되는 것을 증명하는 테스트를 작성하십시오.
4. 400 줄의 명령어를 나눌 수 있습니다`SKILL.md`한 개의 레퍼런스, 한 개의 스크립트 계약, 한 개의 출력 템플릿. 모든 파일을 한 종류의 정보에 대한 책임으로 유지하십시오.
5. 사용가능하지 않은 MCP 도구에 참조하는 기술에 대한 실패 응답을 설계하십시오. 도구를 더 넓은 권한으로 조용히 대체하지 마십시오.
6. 기존의 기술들을 검토하고 각 문장을 라우팅, 절차, 정책, 참조 포인터, 출력 계약으로 표시하고, 부재하지 않는 모든 것을 이동하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Agent skill | "A saved prompt" | A discoverable directory of procedural instructions and optional resources |
| Portable core | "Fields every runtime shares" | The contract defined by the Agent Skills specification |
| Runtime extension | "Extra frontmatter" | Host-specific configuration whose behavior requires a compatible adapter |
| Activation | "The skill ran" | The skill body entered model-visible context; execution may come later |
| Skill dependency | "Import another skill" | A runtime-mediated invocation edge with availability and policy checks |
| Tool contract | "A function schema" | Inputs, outputs, permissions, side effects, errors, and evidence for a capability |

## 더 많은 읽기

- [Agent Skills specification](https://agentskills.io/specification)휴대용 디렉토리와 프론터 계약에 대해
- [Agent Skills best practices](https://agentskills.io/skill-creation/best-practices)범위, 지침 및 자원 조직에 대한
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)현재 코덱스 발견 및 호출 행동
- [Claude Code skills](https://code.claude.com/docs/en/skills)하나의 실행 시간 호출, 논쟁, 도구 및 위임된 맥락 확장
