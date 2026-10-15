# 기술 발견 및 점진적 인 공개

> 기술 은 그 몸 을 로드 하기 전 에 유용 하게 된다. 그 이름 과 설명 은 카탈로그 에 자리 잡을 수 있으며, 그 보다 깊은 파일 은 그 작업 이 그 들 에게 도달 할 때 에만 맥락 을 얻을 수 있다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22 (Agent Skills: Portable Contract and Runtime Boundary)
**Time:** ~105 minutes

## 학습 목표

- 범위, 검증, 충돌 정책 및 카탈로그 출판을 분리하는 파일 시스템 발견 파이프라인을 구축하십시오.
- 공개 단계 세 가지에 대해 설명해 주십시오. 카탈로그 메타데이터, 활성 지침 및 작업에 대한 특정 자원이 있습니다.
- 설계 참조를 통해 요원이 필요한 세부 사항을 직접 채우지 않고도 전체 패키지를 채우 수 있습니다.
- 예산 카탈로그 공간은 활동적 기술 맥락에 따라 독립적으로 이루어집니다.
- 경로를 통과하고, 스킬이 자신의 자원을 읽으면, 시뮬링크 탈출을 거부합니다.

## 문제

당신의 에이전트는 200개의 기술력을 갖추고 있습니다`SKILL.md`, 참조 파일, 스크립트, 템플릿은 세션 시작 시 현재 작업을 관련없는 절차에 묻습니다. 아무것도 로드 하는 것은 사용자가 정확한 파일 시스템 경로를 기억하도록 강요합니다.

보통의 타협은 카탈로그입니다. 모델에 각 자격을 갖춘 기술에 대한 컴팩트 된 정체성과 라우팅 설명을 보여주며, 선택 후만 전체 부품을 로드합니다. 이것은 새로운 두 가지 엔지니어링 문제를 만듭니다.

첫째, 발견은 단순히 재발적 파일 검색이 아닙니다. 프로젝트, 사용자, 관리자, 플러그인 또는 내장된 범위에서 기술이 존재할 수 있습니다. 두 패키지는 이름을 공유 할 수 있습니다. 증상 링크는 신뢰할 수있는 뿌리 바깥을 가리킬 수 있습니다. 잘못된 패키지는 카탈로그 공간을 소비하거나 호출할 수 없습니다.

둘째, 점진적인 공개는 점진적인 혼란으로 변할 수 있습니다.`SKILL.md`" 관련 가이드 를 읽어 보십시오"라고 되어 있고 패키지는 12 개의 가이드 를 포함하고 있습니다. 모델은 추측해야 합니다. 각 가이드 가 3 개의 파일을 더 가리키는 경우, 로딩은 무한한 그래프 걸음으로 변합니다.

좋은 실행 시간은 발견을 결정적이고 공개를 의도적으로 만듭니다.

## 개념

### 디스커버리는 컴파일러 파이프라인입니다

파일 시스템을 소스 입력으로 취급하고 원자 경로를 직접 모델에 게시하지 마십시오.

```figure
skill-discovery-pipeline
```

각 단계마다 구조화된 데이터와 구조화된 오류가 발생해야 합니다. 발견 로그는 다음과 같은 답을 해야 합니다.

- 어떤 뿌리를 조사했나요?
- 어떤 후보가 발견되었나요?
- 어떤 후보가 거절당 했으며, 왜?
- 어떤 패키지가 충돌을 당했나요?
- 예산 문제로 어떤 카탈로그 항목이 짧아졌거나 생략되었습니까?

그 증거가 없으면 "모델은 내 기술을 사용하지 않았다"는 진단이 거의 불가능합니다.

### 범위는 실행 시간 정책입니다

휴대용 사양은 기술 패키지를 정의하고, 하나의 보편적인 설치 경로나 우선 순위를 정의하지 않습니다. 호스트는 검색하는 곳을 결정합니다.

일반 실행 시간은 다음과 같은 범위를 사용할 수 있습니다:

| Scope | Example root | Intended ownership |
|---|---|---|
| Workspace | `<repo>/.agents/skills/` | Project maintainers |
| User | `<user-data>/skills/` | One developer |
| Administrator | `<system>/skills/` | Machine or organization policy |
| Plugin | A signed plugin bundle | Plugin publisher and installer |
| Built-in | Runtime package | Runtime vendor |

2026년 8월부터 코덱스는 프로젝트 발견을 문서화합니다`$CWD/.agents/skills`유저, 관리자 및 내장된 위치까지의 저장소 뿌리까지의 조상 디렉토리를 통해. 그것은 연계된 기술 디렉토리를 지원합니다. 복제 이름은 모두 합병하는 대신 나타날 수 있습니다. 이것들은 코덱스 행동이며, 요구 사항이 아닙니다.`SKILL.md`; 현재를 확인합니다 [Codex skill documentation](https://learn.chatgpt.com/docs/build-skills)어댑터를 작성할 때

디렉토리 이름에서 우선 순위를 발명하지 마십시오. 정책을 선언하고 테스트하십시오. 수업 연구소는 각각의 정해진 정수 순위를 사용합니다.`Scope`그래서 같은 후보 세트가 항상 같은 방식으로 해결됩니다.

### 충돌은 정체성을 넘어서는 것이 필요합니다.`name`

두 개의 패키지 이름`release-readiness`일쪽은 작업 공간의 오버라이드, 다른 하나는 사용자 기본이 될 수 있습니다. 따라서 카탈로그 항목은 적어도:

```json
{
  "name": "release-readiness",
  "description": "Inspect a release candidate for this repository.",
  "scope": "workspace",
  "source": "/repo/.agents/skills/release-readiness",
  "selected": true
}
```

일반적인 충돌 정책은 다음과 같습니다.

| Policy | Benefit | Risk |
|---|---|---|
| Keep every candidate | Nothing is hidden | The model sees ambiguous names |
| Highest-precedence scope wins | Simple invocation | A local package can shadow a trusted one |
| Reject duplicates | No silent shadowing | Legitimate overrides stop working |
| Qualify names by source | Explicit identity | User-facing names become longer |

호스트에 대한 한 가지 정책을 선택하십시오. 모형 카탈로그에서 없는 경우에도 거부되거나 암흑된 후보자를 진단에서 보존하십시오.

### 3개 공개 수준

에이전트 스킬 스펙은 단계적인 로딩을 설명합니다.

```figure
skill-disclosure-levels
```

#### 레벨 1: 카탈로그 메타데이터

모델은 이웃과 기술을 구별하기 위해 충분한 정보가 필요합니다. 사양은 카탈로그 항목에 약 100 개의 토큰을 추정하지만 실제 일련화와 토큰화는 호스트에 속합니다.

유용한 설명은 두 개의 조항을 포함합니다.

```yaml
description: Validate a release candidate and produce a readiness report. Use when the user asks whether a version, tag, or package is ready to publish.
```

첫 번째 조항은 능력, 두 번째 조항은 트리거 경계, 25강에서는 긍정적인 과목과 거의 놓친 과목으로 이 경계를 평가한다.

#### 레벨 2: 활성 지침

활성화 후, 신체는 지도와 절차로 기능해야 합니다.`SKILL.md`500 줄 아래로 표시된 것입니다.

신체는 다음을 포함해야 합니다.

- 작업 경계가
- 기본 작업 흐름
- 지부 조건
- 더 깊은 파일에 대한 직접적인 참조
- 도구 및 스크립트 계약
- 실패와 중단 행동
- 예상 출력 및 그 검증

입력 파일의 짧은 시간만을 위해 중앙 작업 흐름을 참조로 옮기지 마십시오. 활성화는 모델에 올바른 시작을 위해 충분한 맥락을 제공해야합니다.

#### 3단계: 지원자원

참고 자료는 시사나 자료를 제공하며, 스크립트는 결정적인 계산을 제공합니다. 자산은 명령어로 취급하는 것이 아니라 복사, 채우거나 결과물로 변환됩니다.

| Directory | Model reads it? | Model executes it? | Typical content |
|---|:---:|:---:|---|
| `references/` | Yes, when needed | No | schemas, policies, domain guides |
| `scripts/` | May inspect it | Through a permitted tool | validators, converters, collectors |
| `assets/` | Only if useful | No | templates, fixtures, images, starter files |

이 이름은 마법의 기능이 아니라 컨벤션입니다. 호스트는 여전히 파일 접근과 실행 도구가 필요합니다.

### 분야별 참조는 주제 덤프를 능가한다

입력 파일은 결정 지도로 작성하십시오.

```markdown
## Choose the path

- For a Python package, read `references/python-release.md`.
- For a container image, read `references/container-release.md`.
- For a documentation-only release, read `references/docs-release.md`.
- If the release combines artifact types, read only the guides for those artifacts.
```

이것은 모든 참조에 관찰 가능한 로드 조건을 제공합니다. "읽기 `references/`더 많은 것"은 아닙니다.

참고 그래프가 어있도록 하십시오. 공식 지침은`SKILL.md`한 번 뛰는 것은 접근성을 테스트할 수 있게 하고 필요한 제한이 결코 맥락에 들어가지 못할 가능성을 줄여줍니다.

```figure
skill-reference-map
```

### 카탈로그 예산과 활동적인 맥락은 서로 다른 예산입니다

-    `c_i`       `i``B_c`카탈로그 예산, `b_j`활동적인 신체 비용, 그리고`r_k`실제로 로드된 자원을

```text
catalog_cost = sum(c_i for every published skill)
active_cost = sum(b_j for every activated skill) + sum(r_k for every disclosed resource)
```

한 가지 예산을 줄이는 것은 자동으로 다른 예산을 줄이는 것은 아닙니다. 짧은 설명은 카탈로그 공간을 절약 할 수 있지만, 활성화된 900 라인 인체는 여전히 작업을 압도합니다. 인체를 참조로 나눌 때 실행 시간과 지침이 실제로 무관한 분자를 부하하는 것을 피하면만 활성 비용을 줄일 수 있습니다.

코덱스는 현재 초기 기술 목록의 2퍼센트의 문맥에 대해 예산으로
8천개의 문자가
그 크기가 알려지지 않은 경우에만 낙하; 그것은 두 번째 캡이 아니라
2%의 규칙. 카탈로그가 적용되는 예산을 초과하면
설명은 짧아질 수도 있고, 생략될 수도 있습니다.
코덱스 정책은 에이전트 스킬 표준의 소유물이 아닙니다.

### 자원 경로는 신뢰의 한계입니다

기술자는 패키지의 내부의 파일을만 읽어야 합니다. 문자 문자열-전문표시 검사는 충분하지 않습니다.

```text
references/../../../../.ssh/config
references/external-link -> /private/company-secrets
```

파일 시스템 의미와 함께 패키지 루트 및 후보를 해결하고 절대 입력 사항을 거부하고 해결된 후보가 해결된 루트 아래에 있는지 확인합니다. 발견 전에 심링크가 허용되는지 결정합니다. 허용되면 해결된 목표를 항상 확인하십시오.

```figure
skill-resource-containment
```

경로 제한은 내용 신뢰를 확립하지 않습니다. 유효한 패키지 참조는 여전히 악성 명령어를 포함 할 수 있습니다. 레슨 26는 그 위협을 처리합니다.

### 로딩은 관찰가능해야 합니다

비밀 기록 없이 공개 이벤트를 기록합니다.

```json
{
  "event": "skill.resource.loaded",
  "skill": "release-readiness",
  "resource": "references/python-release.md",
  "reason": "candidate contains pyproject.toml",
  "bytes": 2840
}
```

그 이유는 컨텍스트 선택이 검토 가능한 증거로 변모하고 또한 에이전트가 모든 파일을 "예발" 로드하도록 하는 지침을 식별하는 데 도움이 됩니다.

## 건설 해

`code/main.py`결정적인 발견과 공개 엔진을 구축합니다.

발견 표면은 다음과 같습니다.

- `Scope`출처 및 우선순위 메타데이터
- `SkillCandidate`유효성 없는 파일 시스템 후보자에 대해서는
- `discover_scope(scope)`즉각적인 기술 디렉토리를 나열하는 것
- `resolve_collisions(candidates, precedence)`선언된 정책 하나를 적용하는 것
- `CatalogEntry`그리고`build_catalog(...)`제한된 메타데이터를 공개하는 것
- `CatalogBudget`문자만 연상하지 않고 일련화된 항목을 설명하는 것은 보편적 토큰입니다.

공개 표면은 다음과 같습니다.

- `load_skill_body(entry, ...)`레벨 2 활성화를 위해
- `validate_reference(skill_dir, reference)`경로 수축을 위한
- `load_reference(...)`3급의 제한된 독서

실험실 운영:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

이 블록은 로컬 클론을 필요로 하며 저장소 루트를
그 클론 내부의 작업 디렉토리

데모는 임시 프로젝트와 사용자 범위를 생성하고 충돌을 삽입하고 의도적으로 적은 예산으로 카탈로그를 구축하고 한 기술을 활성화하고 유효한 참조 읽기 및 통과 탈출을 시도합니다. 영구 파일은 설치되지 않습니다.

### 왜 발견이 어지는지

`discover_scope`  직후 아동 디렉토리를 확인합니다`SKILL.md`- 모든 둥지를 틀어 놓은 사람을 치료하지 않습니다`SKILL.md`이것은 패키지 경계를 보존하고 설치된 기술 안에 우연히 예제나 장비를 게시하는 것을 피한다.

### 왜 실험실이 임의 YAML를 분석하지 않는지

연구소는 카탈로그에 필요한 스칼라 프론터머리를 지원합니다. 생산 실행 시에는 명시적인 스케마, 크기의 제한 및 사용자 지정 객체 구축을 비활성화한 안전한 YAML 파서를 사용해야 합니다. "Stdlib-only"는 부분 YAML 방언을 조용히 발명할 권한이 아니라 교육 제한입니다.

## 사용 하 고

이 체크리스트를 모든 디스커버리 어댑터에 적용하세요:

1. 구성된 루트와 누가 쓸 수 있는지 목록을 작성하십시오.
2. 연계된 패키지가 허용되는지 명시한다.
3. 패키지 이름, 디렉토리 이름, 필요한 메타데이터 및 입력체 크기를 확인합니다.
4. 내부 정체성에서 원천과 범위를 보존합니다.
5. 복제 이름 행동을 선언하고 테스트합니다.
6. 모델에 전송된 정확한 일련 카탈로그를 측정합니다.
7. 신체나 자원들이 왜 부하되었는지 기록하세요.
8. 해결된 패키지 루트 안에 리소스 읽기 유지하십시오.
9. 참조 파일이 없어지면 명확하게 실패합니다.
10. 설비나 정책이 변경될 때 카탈로그를 재건합니다.

## 선박

이 교훈은`skill-catalog-builder`팩: 명시적으로 순서대로 된 뿌리를 스캔하고, 연계된 입력 파일 및 이름 디렉토리 부합을 거부하고, 범위를 가로질러 충돌을 해결하고, 동등한 우선순위 중복을 거부하고, 지정된 입력, 설명 및 일련 문자 예산에 선택된 메타 데이터를 맞게합니다.

JSON 보고서는 선택된 항목, 그림자 후보, 생략된 항목, 유효성 오류, 우선순위 및 예산 사용이 포함되어 있습니다. 몸과 참조 로딩은 별도의 실행 시간 작업이므로 카탈로그 제작자는 스크립트를 실행하거나 전체 패키지를 맥락으로 허용하지 않습니다.

## 운동

1. 플러그인 범위를 추가하고 사용자와 내장 된 우선순위 사이에 배치합니다. 충돌 결과를 테스트로 증명합니다.
2. 충돌 정책이 우선 순위에서 자격을 갖춘 명칭으로 변경하고 카탈로그에 두 항목을 모두 보존합니다.
3. 에 바이트 크기의 한계를 추가`load_reference`한계선에 있는 파일과 그 한 바이트 이상의 파일의 테스트를 해보세요.
4. 거의 동일하게 들리는 두 개의 설명을 만들어서, 트리거 경계가 겹치지 않도록 다시 작성하세요.
5. 각 참조 및 스크립트에 해시 함수를 포함하는 매니페스트를 추가하고, 로드하기 전에 수정된 리소스를 탐지합니다.
6. 레벨 1, 레벨 2 및 레벨 3 바이트 계산을 개별적으로 보고하는 데 데 데모를 사용하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Skill discovery | "Find every SKILL.md" | Search configured scopes, validate packages, attach provenance, and apply policy |
| Skill catalog | "The list of installed skills" | Compact model-visible routing metadata for eligible packages |
| Collision policy | "Which duplicate wins" | A declared rule for same-name candidates from different sources |
| Progressive disclosure | "Lazy loading" | Staged context admission from catalog to body to branch-specific resources |
| Reference graph | "Files linked by the skill" | The reachable resource structure and its load conditions |
| Path containment | "Stay in the folder" | Verify resolved resource targets remain inside the resolved package root |

## 더 많은 읽기

- [Agent Skills specification](https://agentskills.io/specification)패키지 모양과 점진적인 공개 수준에 대해
- [Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions)카탈로그 라우팅 메타데이터
- [Agent Skills best practices](https://agentskills.io/skill-creation/best-practices)직접 참조 및 입력 파일 크기에 대해
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)현재 코덱스 발견 범위와 카탈로그 제한에 대해
