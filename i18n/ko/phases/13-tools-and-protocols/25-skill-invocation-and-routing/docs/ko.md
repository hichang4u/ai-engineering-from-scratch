# 기술 인명 및 로팅

> 인용은 당국의 결정이 관련 결정이 이어지는 것입니다. 좋은 설명은 모델을 선택하는데 도움을 줍니다. 좋은 정책은 그러한 선택이 허용되는지 결정합니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 24 (Skill Discovery and Progressive Disclosure)
**Time:** ~105 minutes

## 학습 목표

- 명시적인 사용자 호출, 암시적인 모델 호출, 응용 프로그램 호출, 기술-to-skill 호출을 구분한다.
- 인간 비시얼리티와 지원성 모델은 독립적인 정책 차원으로
- 긍정적 인 트리거와 거의 미스 경계를 가진 라우팅 설명서를 작성하십시오.
- 별도의 자격, 선택, 활성화, 논증 결합, 추적 및 테스트에서 실행.
- 실행 시간 특화된 호출 필드를 휴대용 전면물질으로 제시하지 않고 조정합니다.

## 문제

당신은 `database-migration`기술: 사용자가 이름을 따 실행할 수 있지만, 모델은 그 설명도 보고 일반 데이터베이스 질문을 할 때 선택합니다. 기술은 설명이 필요한 작업에 대한 스케마 변경을 제안합니다.

당신은 추가합니다`user-invocable: false`다른 실행 시간에서는 해당 필드가 무시됩니다.`disable-model-invocation: true`이 기술을 완전히 사라질 것으로 예상하고, 그것을 이해하는 실행 시간 동안, 사용자는 여전히 그것을 명시적으로 호출할 수 있습니다.

필드 이름에는 아무런 문제가 없습니다. 모델은 잘못되었습니다. "이용자가 볼 수 있습니다", "모델은 선택할 수 있습니다", " 응용 프로그램은 미리 로드 할 수 있습니다", "그리고 "이 안에 있는 도구는 실행할 수 있습니다"는 별도의 사실입니다.`invocable`표현할 수 없습니다.

라우팅은 두 번째 실패 모드를 가지고 있습니다. 설명이 모호하다면 여러 기술이 믿을 수 있습니다. 설명이 키워드로 가득 차면, 관련없는 작업이 그들을 유발합니다. 카탈로그는 확률적 인터페이스입니다. 적합하기에 충분히 콤팩트하고 라우팅하기에 충분히 구체적입니다.

## 개념

### 5개의 채널이 라이프 사이클을 시작할 수 있습니다

| Actor | Invocation shape | Typical use | Main risk |
|---|---|---|---|
| Human user | Names a skill in the UI or prompt | Deliberate workflow selection | User expects availability or authority the host does not grant |
| Model or autonomous agent | Selects a catalog entry from task context | Automatic expert procedure | False-positive routing |
| Application | Activates or preloads a skill through runtime code | Fixed product workflow | Hidden coupling to one host |
| Another skill or subagent | Requests an exact skill as a workflow dependency | Composition | Cycles, missing dependency, or context bleed |
| Evaluation harness | Activates an exact skill under a fixed scenario | Repeatable measurement | Tests the skill while accidentally bypassing the production policy under study |

휴대용 에이전트 스킬스 사양은 패키지를 정의합니다. 그것은 하나의 보편적인 슬래시 명령 UI, 암시 로팅 플래그, 응용 API 또는 서바겐트 라이프사이클을 표준화하지 않습니다.

### 5가지 호출 단계

```figure
skill-invocation-stages
```

다음 단어를 정확하게 사용하세요:

- **Eligible**정책이 이 배우에게 기술을 요구할 수 있게 해주는 것을 의미합니다.
- **Selected**사용자가 이름을 붙인 경우 또는 라우터가 관련하다고 판단한 경우
- **Activated**그 지침은 업무상 맥락에 들어간다는 뜻입니다.
- **Executing**그 지침에 따라 에이전트가 모델 또는 도구 작업을 시작했다고 의미합니다.
- **Completed**출력자가 독립적인 성공 검사를 받았다는 것을 의미합니다.

기록만 하는 흔적이`skill_used=true`실패가 일어난 경계를 숨기죠.

### 인간과 모델 호출은 2x2 매트릭스를 형성합니다

| Human can invoke | Model can invoke | Mode | Suitable examples |
|:---:|:---:|---|---|
| Yes | Yes | Shared | Code explanation, test planning, documentation review |
| Yes | No | Human-only | Publish preparation, billing export, destructive cleanup plan |
| No | Yes | Model-only | Internal style guide, domain reference, automatic support procedure |
| No | No | Disabled or application-only | Staged rollout, deprecated package, programmatic preload |

매트릭스는 정책 모델이고 표준 YAML가 아닙니다.

현재 호스트 1개 사용함`disable-model-invocation: true`인간만 있는 라인`user-invocable: false`모델만 있는 라인에서 기본값은 둘 다입니다. 다른 호스트는`agents/openai.yaml``allow_implicit_invocation: false`암시적인 선택을 비활성화하면서 명시적인 호출을 유지하기 위해.

혼란스러운 세부 사항은 중요합니다.`user-invocable: false`"모델이 이것을 사용할 수 없습니다".`disable-model-invocation: true`"능력이 비활성화 된 것"을 의미하지 않습니다.

### 명시적인 호출은 정체성 우선입니다

명시적인 호출은 직접적으로 정체성을 제공합니다:

```text
/release-readiness v2.4.0
```

또는

```text
release-readiness check v2.4.0 without publishing
```

현재 코덱스 인터페이스 문서 `/skills`                                                                                                                                                                                                                                                              `/skill-name`호스트에 대한 특정 논증 확장. 정확한 문법, 메뉴 가시성, 인용 규칙 및 변수 확장

명시적인 요청은 여전히 정책을 통과합니다. 기술 이름을 지정하는 것은 부족한 권한, 작업 공간 제한, 승인 게이트 또는 실행 시간 격리 등을 우회해서는 안됩니다.

### 간접적인 호출은 설명-첫 번째

암묵적인 라우팅을 위해, 모델은 처음에는 전체 신체보다는 카탈로그 메타데이터를 볼 수 있습니다. 따라서 설명은 기술의 라우팅 인터페이스입니다.

약자:

```yaml
description: Helps with releases.
```

너무 넓어:

```yaml
description: Use for release, version, package, build, deploy, publish, tag, changelog, GitHub, CI, or software tasks.
```

제한:

```yaml
description: Inspect an already prepared release candidate and produce a readiness report. Use when the user asks whether a version, tag, package, or image is ready to publish; do not use for ordinary build failures or feature development.
```

제한된 버전은 다음과 같습니다.

1. **Capability:**준비된 후보자를 검사합니다.
2. **Output:**준비 보고서
3. **Positive boundary:**발사 유물이 준비되어 있는지 묻습니다.
4. **Negative boundary:**일반적인 건설과 개발은 범위를 벗어났습니다.

부정적인 경계는 두 가지 인근 기술들이 공통된 어휘를 공유할 때 유용합니다. 그들은 거의 미스 평가의 대상이 아닙니다.

### 라우팅은 '자제' 옵션으로 분류

실력을 위해`s`그리고 요청`x`라우터 점수를 상상해보세요.

```text
score(s, x) = capability_match + trigger_match + context_match - exclusion_match - ambiguity_penalty
```

정확한 점수는 수학적 결정보다는 LLM 결정일 수 있습니다. 엔지니어링 원칙은 여전히 유효합니다. 선택은 문턱과 경쟁력보다 더 높아야 합니다. 증거가 약한 경우, 자제합니다.

```figure
skill-routing-abstention
```

고 영향력 있는 기술에 있어서, 암시적인 라우팅은 강력한 설명도 없이 적절하지 않을 수 있습니다. 거짓 긍정의 비용은 자동 선택의 편의를 초과할 때 인간만을 위한 정책을 사용하십시오.

### 자격은 순위 이전에 있어야 합니다

발견 된 모든 기술 을 점수 하지 말고 가장 강한 경기 를 선택 하고 그 다음 에 그 기술 의 정책 을 확인 하십시오. 차단 된 최고 경기 는 적당한 점수 를 가진 후보 가 고려 되지 않도록 잘못 방지 할 것 이다.

암시 로팅을 위해 이 순서를 사용하세요:

1. 필터는 요청하는 배우와 활성 호스트 어댑터에서 기술을 발견했습니다.
2. 자격을 갖춘 후보만 점수하십시오.
3. 가장 강력한 지원 가능한 경기력을 선택하면 문턱과 모호함 규칙을 제거합니다.
4. 지원자가 자격이 없는 경우 또는 충분한 자격이 있는 점수가 없는 경우 기권한다.

가정해 봅시다`incident-triage`점수를 얻습니다`0.80`하지만 호스트 확장 프로그램은 모델 호출을 비활성화합니다. `incident-review`점수를 얻습니다`0.55`로우터는 평가해야 합니다`incident-review`가장 좋은 지원자라고 할 수 있습니다.`incident-triage`부인하고 그만둬

이 순서는 또한 정책 변경이 관련성 점수의 의미를 변경하지 않도록합니다. 자격은 선택 집합을 정의합니다. 관련성은 그 집합을 순위합니다.

### 로팅 평가에는 거의 실패가 필요합니다

긍정적인 사례는 회수증명입니다.

```json
{"prompt":"Is version 2.4.0 ready to publish?","expected":"release-readiness"}
```

명백한 부정적은 기본적인 정확성을 증명합니다.

```json
{"prompt":"Explain rotary position embeddings.","expected":null}
```

거의 놓친 것은 경계를 드러내는 품질입니다.

```json
{"prompt":"Why did today's package build fail?","expected":"build-diagnostics"}
```

거의 미스 주식`package`그리고`build`하지만 다른 곳에 속하는 것 처럼, 명백한 긍정적인 부분과 연관되지 않은 부정적인 부분만 구성된 라우팅 세트는 품질을 과장할 것입니다.

### 주장은 세 가지 표현을 가지고 있습니다

호출 주장은 여러 경계를 넘는다:

```figure
skill-argument-boundaries
```

각 경계에서 텍스트를 코드처럼 취급하지 않고 의도한 것을 보존하십시오.

- 호스트 파서가 명령어 문법과 인용을 결정합니다.
- 숙련은 호스트 규칙에 따라 결합된 텍스트 또는 변수를 수신합니다.
- 명령어는 필요한 값과 기본값을 확인합니다.
- 도구 호출은 입력된 스케마로 값을 변환하고 재확인합니다.

원소 주장을 셸 명령어로 중계하지 마십시오. 논쟁 벡터 또는 입력된 MCP 도구로 호출되는 스크립트를 선호하십시오.

### 애플리케이션 호출은 명시적인 오케스트라

제품 은 기술 을 활성화 할 수 있는 이유 는 그 작업 흐름 이 이미 작업 유형 을 알고 있기 때문 이다. 예를 들어, pull-request 검토 서비스 는 미리 로드 할 수 있다 `pull-request-risk-review`사용자가 검토를 누르면

이 방법은 라우팅 불확실성을 제거하지만 실행 시간 API에 의존성을 만듭니다. 이 어댑터를 휴대용 몸 밖으로 유지하십시오.

```figure
skill-host-adapter
```

다른 컴플라이언트에서 열면 그 기술은 이해될 수 있어야 합니다.

### 기술에 대한 호출은 도구와 같은 가장자리입니다

가정해 봅시다`release-readiness`요청합니다`security-change-review`의존 파일 변경

전화하는 사람은 다음을 제공해야 합니다.

- 목표 기술 정체성
- 제한된 작업 및 유물 경로
- 예상된 대응 계약
- 청구의 이유
- 가용이 없는 경우,
- 최대 깊이 또는 주행 규칙

```json
{
  "target_skill": "security-change-review",
  "task": "Review dependency changes in the candidate diff",
  "inputs": ["artifacts/release.diff"],
  "expected": "risk-report.json",
  "max_depth": 2
}
```

두 번째 능력은 첫 번째 기술에 맹목적으로 붙이지 않습니다. 호스트는 그것을 어떻게 활성화하는지 결정하고 맥락을 공유하는지, 가려움으로 실행하는지 또는 도구 결과를 통해 반환하는지 결정합니다.

### 컨텍스트 라이프 사이클은 호스트에 따라 특정

활성화 후, 기술 인체는 대화에 남아있을 수 있으며, 컴팩션 중에 요약되거나 위임된 맥락에서 실행될 수 있습니다. 도구 허용은 한 차례 지속될 수 있으며 지침은 더 오래 지속될 수 있습니다. 부자겐트는 부모의 전체 역사 없이 기술을받을 수 있습니다.

보이지 않는 평생 가설에 의존하는 기술 을 작성 하지 마십시오. 파일 이나 입력 상태 에 내구성 있는 출력 을 넣고, 다시 입력 하는 것 을 안전 하게 하여, 중단 후 다시 로드 해야 할 것 을 명시 하십시오.

```markdown
On resume, read `artifacts/release-readiness.json` if it exists.
Revalidate the candidate commit before continuing.
Do not repeat an external write whose idempotency key is already recorded.
```

## 건설 해

`code/main.py`정책과 라우팅을 별도의 어댑터로 구현합니다.

모델은 다음과 같다.

- `Actor`인간, 모델, 자율주행자, 응용, 기술 및 배너스 호출자
- `SkillMetadata`라우팅 아이덴티티를 위한
- `InvocationPolicy`인간/모델 매트릭스
- `InvocationRequest`그리고`InvocationDecision`추적 가능한 입력 및 결과물에 대해
- `CorePolicyAdapter`호스트 확장 프로그램 없이 휴대용 동작을 위한
- `ExtensionPolicyAdapter`인정된 실행시간 필드
- `build_invocation_matrix(policy)`2x2 뷰에 대한
- `route_request(skills, request, adapter)`유의성 필터링을 위해 관련 순위, 선택 및 거부 전에

실행하세요:

```bash
cd phases/13-tools-and-protocols/25-skill-invocation-and-routing
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

데모는 명시적인 인간, 암시적인 모델, 자율주행자, 응용 프로그램, 기술 구성 및 활용 채널을 위한 하나의 매트릭스와 의사결정을 인쇄합니다. 확장 어댑터 결과에는 유효한 대안이 순위화되기 전에 차단된 상위 레크시컬 일치가 제거되는 것을 보여줍니다. 또한 정확한 이름의 명단을 포함합니다. 모델 API가 필요하지 않습니다. 결정적 라우터는 정책 경계를 검사할 수 있도록 하기 위해 존재하며, 레크시컬 일치가 생산 모델 라우팅을 재생한다고 주장하지 않습니다.

### 왜 코어 어댑터와 확장 어댑터가 분리되어 있는 걸까요?

한 분석기 (parser) 가 관찰된 모든 전원물질 필드에 의미를 부여하면, 그것은 조용히 실행 시간 컨벤션을 가짜 표준으로 촉진합니다. 별도의 어댑터는 호출자에게 호스트 의미론이 활성화되는 이름을 지정하도록 강요합니다.

`CorePolicyAdapter`지원에 따라 제공되는 정책만 사용 합니다.`ExtensionPolicyAdapter`결정에 변경된 필드인 호스트 필드와 기록의 명시적 집합을 인식합니다.

## 사용 하 고

기술 발표 전에 초청 계약을 작성하세요:

```yaml
actors:
  human: allow
  model: deny
  application: allow
  skill: deny
explicit_name: release-readiness
arguments:
  candidate: required
  publish: fixed_false
ambiguity: ask_user
missing_dependency: stop
context:
  durable_state: artifacts/release-readiness.json
  max_composition_depth: 2
```

이 계약은 어댑터 및 테스트의 설계 문서입니다. 휴대용이 아닙니다.`SKILL.md`표준이 명시적으로 채택하지 않는 한

## 선박

이 교훈은`skill-invocation-router`팩: 호출 모델 참조, 호스트 정책 예제 및 실행되지 않는 CLI를 포함하고 있으며, 한 인간, 모델, 자율주행자, 응용 프로그램, 기술 구성 또는 활용 요청을 평가하고 채널, 어댑터, 점수 및 이유를 사용하여 JSON 결정을 반환합니다.

한 요청 CLI는 전체 트리거 평가가 아닌 정책 조사입니다. 혼란 수, 정확성, 회수 및 반복 실행 안정성을 계산하기 위해 레슨 27에서 표시된 긍정적 및 거의 미스 디자인을 사용하십시오.

## 운동

1. 인간/모델 매트릭스의 네 줄을 모두 작성하고 각 항목에 대해 합법적인 사용 사례를 작성하십시오.
2.  응용 프로그램만 활성화 추가`CorePolicyAdapter`인간과 모델 호출자가 여전히 부정된다는 것을 증명합니다.
3. 임시 기술에 대한 10가지 거의 미사일을 작성하세요. 각 명령어는 다른 작업 흐름에 속하는 동안 기술과 어휘를 공유해야 합니다.
4. 두 개의 상위 로우팅 점수 사이에 모호함 지위를 추가합니다. 반환 `ask`그 지점은 너무 작을 때
5. 기술-기능 요청에 최대 구성 깊이를 추가하고 두 기술 순환을 감지합니다.
6. 코어와 확장 어댑터를 통해 동일한 레이블 세트를 실행하고 변경된 모든 결정을 설명하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Explicit invocation | "Slash command" | An actor supplies skill identity directly, subject to policy |
| Implicit invocation | "The model chooses" | A router selects from eligible catalog metadata based on task context |
| User-invocable | "Humans can use it" | A host-specific menu or direct-invocation property, not a core field |
| Model-invocable | "The agent can use it" | Eligibility for implicit model selection under host policy |
| Invocation adapter | "Frontmatter parser" | Code that maps a host's fields and APIs into a declared policy model |
| Near miss | "Hard negative" | A non-triggering request that resembles a skill's intended inputs |
| Abstention | "No skill selected" | A deliberate routing result when evidence is absent or ambiguous |

## 더 많은 읽기

- [Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions)긍정적인 트리거, 특수성, 평가
- [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills)트리거 및 출력 eval 설계
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)현재 코덱스 명시적이고 간결한 호출 통제에 대해
- [Claude Code skills](https://code.claude.com/docs/en/skills)한 호스트의 경우`user-invocable``disable-model-invocation`, 주장, 그리고 위임된 맥락.
