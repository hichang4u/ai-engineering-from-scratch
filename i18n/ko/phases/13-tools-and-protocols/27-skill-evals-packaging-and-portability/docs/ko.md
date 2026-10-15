# 기술 평형, 포장 및 휴대성

> 기술이 완성되면 그 패키지가  linting 생존, 올바른 요청에 따라 경로를, 측정된 작업을 개선, 정책 안에 남아, 그리고 정직하게 다른 호스트에 degrades.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22, 24, 25, and 26
**Time:** ~150 minutes

## 학습 목표

- 전문가의 작업 흐름을 판단, 결정적 계산, 참조, 출력 계약을 분리하여 기술을 만듭니다.
- 테스트 패키지 구조, 트리거 라우팅, 작업 동작, 스크립트 정확성, 안전 및 휴대성이 별도의 층으로.
- 측정은 정확성을 유발하고 긍정적인, 명확한 부정적인, 그리고 거의 놓친 것을 사용하여 회수합니다.
- 반복된 경주에서 기술과 기술 없이 성능을 비교하십시오.
- 크로스 런타임 능력 매트릭스 및 완전한 기술 팩트를 위한 풀 게이트를 구축하고 시행한다.

## 문제

한 데모에서 기술이 작동합니다. 사용자가 그 설명에서 사용하는 문구를 정확히 묻고, 작가는 어떤 참조를 열어야 하는지 알고, 스크립트는 깨끗한 입력값을 볼 수 있으며, 예상되는 호스트는 모든 사용자 지정 필드를 인식합니다.

그러면 실제 사용이 시작됩니다.

- 모델은 가까운 곳에 있는 다른 작업에 부추기고 있습니다.
- 유효한 요청은 익숙하지 않은 문장을 사용하므로 모델은 그것을 놓치고 있습니다.
- 신체는 에이전트에 무엇을 해야 하는지 말하지만 어떤 유물이 완성된다고 증명하지는 않습니다.
- 스크립트는 빈 공간, 반복 실행 또는 부분 상태에서 실패합니다.
- 패키지 설치기본`SKILL.md`하지만 그 후의 참조들을 남겨두고 있습니다.
- 또 다른 실행 시간은 호출 플래그와 도구 허용을 무시합니다.
- 한 번 성공하면 3번의 공습이 다른 분야로 돌아다니다.

이러한 실패는 "Markdown은 잘 보인다". 기술은 확률적 라우팅과 실행 계층을 가진 작은 소프트웨어 패키지입니다. 그들은 다른 생산 인터페이스와 같은 문제점의 분리가 필요합니다.

## 개념

### 실제 작업 흐름에서 시작하세요, 주제에서 시작하세요

"Kubernetes 기술을 만들"는 사용 가능한 범위가 아닙니다. Kubernetes는 다양한 도구, 위험 및 출력으로 수백 개의 작업을 포함합니다.

"어떤 배포가 사용할 수 없는 이유를 진단하고, 클러스터를 변경하지 않고 증거를 수집하고, 순위화된 사건 보고서를 작성한다"는 기술 후보입니다.

- 트리거 경계
- 증거 수집 단계의 안정적인 순서;
- 판단이 필요한 결정 사항
- 좁은 스크립트나 도구가 될 수 있는 명령어
- 정의된 유물
- 안전 한계: 읽기 전용 진단

이 인터뷰를 사용하세요.

1. 어떤 사건으로 전문가들이 이 작업 과정을 시작하게 되는 걸까요?
2. 어떤 비슷한 요청이 시작되지 않아야 합니까?
3. 전문가가 먼저 어떤 증거를 수집합니까?
4. 어떤 결정이 그 증거에 달려 있습니까?
5. 어떤 단계가 스크립트를 결정적으로 만들 수 있을까요?
6. 어떤 영역 규칙이 참조를 받을 가치가 있습니까?
7. 어떤 행동 은 승인 을 받아야 하며, 혹은 그 범위를 벗어나야 합니까?
8. 어떤 유물들이 작업 과정이 완료된 것을 증명합니까?
9. 독립적인 평가가 어떻게 확인하는 걸까요?
10. 어떤 단계가 한 번 실행에 의존하는가?

답은 패키지 아키텍처와 eval 세트를 만듭니다.

### 결정론적 작업과 분리된 판단

```figure
skill-workflow-extraction
```

분류, 우선순위, 합성 및 모호성을 위해 모델 판단을 사용하십시오. 스스크립트 또는 도구를 사용하여 분석, 계산, 검증, 변환, 입력된 API를 질의하고 변수들을 집행하십시오.

80 줄의 수동 시뮬레이션 분석을 포함하는 기술체계는 부서지기 쉽다. 주관적인 건축 결정을 내리는 스크립트는 불투명하다. 모든 행동을 가장 잘 테스트 할 수 있는 곳에 넣으십시오.

### 의존 순서로 패키지의 작성자

시를 닦아서 시작하지 말고 관찰 가능한 계약에서 내면으로 구축하십시오.

1. **Artifact contract:**필요한 파일, 필드 또는 결정을 정의합니다.
2. **Verification:**각 요구사항을 어떻게 확인해야 하는지 정의합니다.
3. **Evidence tools:**결정적 수집자 및 검증자를 구현합니다.
4. **Decision map:**증거 상태와 분과들을 연결합니다.
5. **References:**필요한 지사에 도메인 세부 정보를 공급합니다.
6. **Entry body:**작업 흐름, 경계가, 실패와 출력 등을 설명합니다.
7. **Description:**상태 능력과 트리거 경계
8. **Runtime adapters:**호출 또는 컨텍스트 확장자를 별도로 추가합니다.
9. **Evals:**구조, 라우팅, 행동, 안전 및 휴대성 계층을 실행합니다.
10. **Package:**전체 디렉토리를 설치하고 목적지에서 테스트합니다.

이 순서는 시사 작업이 끝나면 성공 기준을 발명하기 보다는 검증 가능한 시스템을 제공합니다.

### 6개의 평가 계층

```figure
skill-eval-layers
```

각 층은 다른 질문에 답합니다. 한 층을 통과하면 다른 것을 대체할 수 없습니다.

## 계층 1: 패키지 구조

정적  linting는 모델이 필요하지 않은 사실을 확인해야 합니다.

- `SKILL.md`패키지 뿌리에서 존재합니다.
- 전면 물질을 안전하게 분석합니다.
- `name`그리고 부모 디렉토리 일치
- 필요한 필드는 존재하고 제한 내에 있습니다.
- 모든 핵심 전원물질이 아닌 필드는 출시 정책의 실행 시간 연장 허용 목록에 표시됩니다.
- 모든 직접적인 참조는 패키지 내부에 해결됩니다.
- 참조, 스크립트, 자산 및 평가 장치들은 공개 정책의 허용 된 자사자를 사용하고 바이트 한계에 해당하거나 그 이하로 유지됩니다.
- 금지된 심링크나 특별파일이 존재하지 않는다.
- 기구들은 석방 정책의 성격 예산에 속한다.
- 의도적으로 좁은 비밀 패턴 스캔에서는 명백한 인증 권한 또는 개인 키 헤더가 발견되지 않습니다.
- 비공개`## Output contract`그리고`## Failure behavior`부문은 존재합니다.

분석하기 전에 물리 나무의 사전 비행을 수행하십시오`SKILL.md`, eval 데이터, 증거, 호스트 고정, 또는 매니프트를 거부합니다. 연계 된 루트, 연계 된 부모 또는 항목, 필요한 정규 파일 및 특별한 파일이 빠진 콘텐츠 읽기 전에. 다음 콘텐츠 인식 정책 lint을 실행합니다. 비행 전에 뭉치 경로를 해결하면 체크에 필요한 루트-싱클링 증거가 삭제됩니다.

수업 활용은 이러한 정책 가치를 구체화합니다. 10,000 문자의 몸매 제한, 1,000,000 바이트의 동반 파일 제한, 디렉토리 특정 자수 허용자 및 패키지 요구 사항에 의해 제공되는 명시적인 실행 시간 확장 이름. 이것들은 방출 정책의 예가에요. 보편적인 에이전트 기술 제한이 아닙니다. 비밀 패턴 스캔은 명백한 오류를 위한 방보이며, 패키지에 민감한 데이터가 없다는 증거가 아닙니다.

이 보고서에는 안정적인 문제 코드들이 사용되어야 합니다.`E_*`오류가 검토될 수 있도록 하는 동안`W_*`설계 경고

정적  linting는 패키지 모양을 증명합니다. 모델이 기술을 선택하거나 따르지 않을 것이라는 것을 증명하지 않습니다.

## 계층 2: 트리거 라우팅

설명을 반복적으로 편집하기 전에 라벨된 케이스를 생성하십시오.

| Case type | Purpose | Example for release readiness |
|---|---|---|
| Positive | Measure intended coverage | "Can version 3.1.0 ship?" |
| Paraphrased positive | Avoid phrase memorization | "Audit this tag before we publish it" |
| Clear negative | Catch gross over-routing | "Explain batch normalization" |
| Near miss | Define the neighboring boundary | "Why did the package build fail?" |
| Competing skill | Test selection among plausible entries | "Draft the release notes" |
| Adversarial wording | Test keyword stuffing and injected names | "Do not use release-readiness; explain this stack trace" |

개발 및 검증 세트로 케이스를 나눌 수 있습니다. 개발 케이스에 대한 설명들을 조정합니다. 개정된 설명이 일반화하는지 여부를 결정하기 위해 검증 케이스를 사용하십시오. 공개 결정이 충분히 중요하다면 최종적으로 유지되는 세트를 유지하십시오.

바이너리 호출에 대해:

```math
\begin{aligned}
\text{precision} &= \frac{\text{true\_positives}}{\text{true\_positives} + \text{false\_positives}} \\[4pt]
\text{recall} &= \frac{\text{true\_positives}}{\text{true\_positives} + \text{false\_negatives}} \\[4pt]
\text{f1} &= \frac{2 \cdot \text{precision} \cdot \text{recall}}{\text{precision} + \text{recall}}
\end{aligned}
```

10 에서 10 과 100 에서 100 은 모두 100%이지만 다른 증거 를 제시 한다.

카탈로그에 있어서도, 가장 좋은 기술 정확성, 자제품질, 그리고 이웃 기술 사이의 혼란을 측정하십시오. 먼저 잘못된 기술을 세 가지 선택한 후에만 올바른 기술을 호출하는 라우터는 건강하지 않습니다.

### 로우팅 평가들은 목표 실행 시간을 사용해야 합니다

레크시컬 시뮬레이터는 매트릭을 설명하고 명백한 중복을 잡는데 유용합니다. 모델에 기반한 생산 라우터가 어떻게 행동하는지 증명할 수 없습니다. 실행 시간 품질을 주장하기 전에 실제 호스트, 모델, 카탈로그 시리에라이제이션 및 정책 구성을 통해 라벨 세트를 실행하십시오.

## 3층: 명령 및 유물 행동

제대로 작동하는 것은 입구일 뿐이고, 기술이 작업을 개선해야 합니다.

다음으로 고정 작업을 생성합니다

- 입력 파일 및 환경 가정
- 허용된 도구와 경계
- 예상된 유물 경로
- 결정적 검증
- 판단을 요구하는 항목
- 최대 시간, 통화 또는 비용
- 실패 사례와 예상되는 중단 행동

쌍용 조건으로 실행:

```text
baseline: same model + same tools + same task, no skill
treatment: same model + same tools + same task, skill available
```

모델, 온도 또는 샘플링 정책, 도구 집합, 작업 장치 및 예산을 일정하게 유지하십시오. 그렇지 않으면 기술에 차이를 부여 할 수 없습니다.

유용한 결과 차원은 다음과 같습니다.

| Dimension | Example measure |
|---|---|
| Correctness | Required tests and invariants pass |
| Completeness | Every artifact-contract field exists |
| Efficiency | Tool calls, elapsed time, tokens, or cost |
| Evidence | Claims point to valid files or observations |
| Scope | Forbidden files and actions remain untouched |
| Recovery | Interrupted run resumes without duplicate side effects |
| Human effort | Number and severity of reviewer corrections |

단기 로켓 을 더 적게 사용 하는 것 은 더 나쁜 것 이다.

### 유물 계약은 행동을 실행할 수 있게 해줍니다.

유물 계약은 독립적으로 확인할 수 있는 재산의 목록입니다.

```json
{
  "artifact": "release-readiness.json",
  "required_fields": [
    "candidate",
    "source_revision",
    "checks",
    "blocking_findings",
    "recommendation"
  ],
  "allowed_recommendations": ["ready", "blocked", "needs-review"],
  "evidence_required_for_each_check": true,
  "publish_side_effect_allowed": false
}
```

스케마 검증은 구조를 확인합니다. 도메인 검사는 후보 개정 및 증거 경로를 검증합니다. 인간 또는 정렬 판사는 추천이 증거로부터 나온 것인지 여부를 평가할 수 있습니다.

## 4층: 스크립트 정확성

일반적인 소프트웨어와 같은 스킬 스크립트를 테스트하고 외부 모델 실행합니다.

최소 사례:

- 정상 입력
- 빈 입력
- 잘못된 입력값
- 유니코드, 백색 공간, 경로 가장자리 케이스
- 반복된 집행
- 시간 정지 또는 의존성 실패
- 이전 실행에서 일부 출력
- 출력 크기의 제한
- 건조한 운행행습
- 구조화된 출입 및 오류 계약

고정된 장비를 사용하세요. 단위 테스트를 위해 라이브 네트워크가 필요하지 않습니다. 네트워크 통합 테스트를 명시적인 깃발 뒤에 배치하고 그들이 의존하는 원격 계약을 기록하십시오.

스크립트가 부작용을 일으킨다면, 컴백과 별도로 계획을 테스트하십시오. 다시 시도한 외부 스크립트를 위해 무력 또는 보상을 요구하십시오.

## 5층: 안전 및 권위

안전성 평가에 따르면 패키지가 주어진 권한 안에 남아 있는지 여부를 묻는 것입니다.

적어도 테스트:

- 기술 범위에 해당하지 않는 사용자 요청
- 참조 입력의 내부의 악성 명령어
- 패키지에서 빠져나가는 자원 경로
- 허용된 루트에서 벗어나는 작업 공간의 시뮬레이션 링크
- 선언되지 않은 네트워크 목적지 요청
- 환경 인증서를 요구하는 명령어
- 승인 없이 파괴적인 또는 외부의 행위
- 과장형 출력 또는 무한한 프로세스
- 기술과 기술 사이클
- 부작용을 복제할 수 있는 자기소개서

제어 장치 는 명령 을 이용 하는 것, 도구 정책, 승인, 모래 상자, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것, 검증 을 이용 하는 것 등이 필요 하지 않습니다.

## 6층: 포장 및 휴대성

### 디렉토리를 하나의 단위로 설치

방출 테스트는 깨끗한 목적지에 설치되어 설치된 복사본에 대한 검증을 실행해야 합니다.

```figure
skill-package-install
```

소스 트리만 테스트하면 설치 버그, 실행 가능한 비트 손실, 납작한 참조, 다시 작성된 이름, 이전 버전에서 남아있는 오래된 파일이 생깁니다.

이 매니프트는 다음을 포함할 수 있습니다.

```json
{
  "manifestVersion": 1,
  "algorithm": "sha256",
  "name": "release-readiness",
  "version": "1.2.0",
  "source_revision": "abc123",
  "files": {
    "SKILL.md": "sha256:...",
    "references/release-policy.md": "sha256:...",
    "scripts/inspect_release.py": "sha256:..."
  },
  "required_capabilities": ["filesystem.read", "process.run"],
  "optional_capabilities": ["model_implicit_invocation"]
}
```

- 예약을`assets/manifest.json`명백한 메타데이터로서 그 자체로부터 배제합니다`files`지도. 파일은 내부에 전체 현재 내용의 안정적인 해시를 가지고 있지 않습니다. 다른 패키지 파일들을 모두 확인하고, 서명된 출력 또는 신뢰할 수 있는 레지스트리 기록과 같은 외부 신뢰할 수 있는 채널을 통해 매니프트의 진정성을 확인합니다. 배송된 봉투는 정확히 받아들이습니다.`manifestVersion: 1`그리고`algorithm: "sha256"`; 알려지지 않은 값이 닫히지 않습니다. 표시 키는 이미 가논적인 상대 POSIX 경로여야 합니다.`./SKILL.md`, 역격, 절대 경로, 그리고 부모 세그먼트는 정상화 대신 거부됩니다. 교육 배대가 내부 경로-처분 지도를 직접 소비하고, 두 경로는 그 지도 내부의 예약된 명백한 경로를 거부합니다.

해시들은 유동성을 감지합니다. 버전 번호는 호환성을 전달합니다. 개시판을 인증하거나 업그레이드 전에 완전한 디프리 및 eval 실행을 대체하지 않습니다.

### 휴대성은 능력 매트릭스입니다

호스트가 boolean처럼 "능력을 지원하는지" 묻지 말고 어떤 행동을 지원하는지 물어보십시오.

| Capability | Portable package dependency | Fallback if absent |
|---|---|---|
| Required `name` and `description` | Core | Package cannot participate in catalog |
| Body activation | Core client behavior | Explicit file loading adapter |
| References, scripts, assets | Core package shape | Host needs file and process tools |
| Explicit human invocation | Host UI or prompt convention | Name the skill in ordinary text |
| Implicit model invocation | Host router | Application activates explicitly |
| Human/model 2x2 policy | Host extension or application policy | Disable implicit selection globally |
| Argument binding | Host parser | Ask for values after activation |
| Pre-approved tools | Experimental or host-specific | Normal permission prompts |
| Delegated context | Host-specific | Run in current context or application subagent |
| Lifecycle hooks | Host-specific | External automation or no hook |
| Context preservation | Host-specific | Persist state and make re-entry explicit |

필요한 모든 능력에 대해 하나의 결과를 선택하세요:

- 지원 및 테스트
- 어댑터를 통해 지원한다.
- 기록된 낙후로 퇴화된 상태
- 지원되지 않아서 설치가 실패할 수 있습니다.

침묵적인 해상화는 휴대성 오류입니다.

### 휴대성 테스트는 호스트 가속 장치가 필요합니다.

능력 주장은 테스트 또는 현재 공식 계약에 대한 지시를 가져야 합니다. 호스트 행동 변경. 호환성 보고서에 어댑터 버전과 테스트 날짜를 보관하십시오.

테스트:

1. 계획된 범위에서 발견하는 것
2. 복제명행동
3. 명시적인 호출
4. 암시적인 호출 또는 그 장애 상태
5. 논쟁 처리
6. 참고 및 스크립트 액세스
7. 허가 요청 및 승인
8. 위임 또는 현재 맥락에서 실행하는 것
9. 컨텍스트 컴팩션 후 다시 시작하거나 다시 시작
10. 설치 및 업그레이드 동작을 제거합니다.

### 규모 데이터는 품질 증거가 아닙니다

GitSkills 데이터 세트 논문은 282,200개의 저장소에서 3,797,117개의 기술 같은 파일을 포함하고, 1,877,981개의 다른 바이트 콘텐츠를 포함하고 있는 2026년 7월 탐색을 보고합니다. 일치하는 파일의 약 50.5%는 논문의 바이트 수준 측정에 따라 문자 그대로 복사본이었다.

그 숫자는 기술 유물이 저장소 규모에서 존재하고 데이터 세트 구축, 검색, 출처 및 업그레이드 분석에 복제 문제가 있음을 보여줍니다. 그들은 기술 중 절반이 좋거나 나쁘다는 것을 보여주지 않으며, 기술은 작업 성능을 향상시키고, 모든 호출 필드가 보편적이라는 것을 보여주지 않으며, 모든 모래 상자 디자인이 안전하다는 것을 보여주지 않습니다. 이 논문은 데이터 집합 연구이고 효과나 보안 기준이 아닙니다.

생태계 계산을 사용하여 분배와 출처를 동원하고 자신의 평가로 품질을 주장합니다.

## 반복적 인 행진 과 불확실성

모델 및 라우팅 행동은 다를 수 있습니다. 생산 샘플링 정책에 따라 각각의 행동 사례를 한 번 이상 실행하십시오.

`n`동등한 운행과`k`승격:

```text
observed_pass_rate = k / n
```

개별 추적을 유지하십시오. 70%의 통과율은 일관된 실패 클래스 또는 여러 가지 관련없는 오류를 의미할 수 있습니다. 집적 비율 가이드 비교; 추적 가이드 수리. 모든 원본 연산 예측에 출원을 묶어, 무상 실행과 합적 비율뿐만 아니라. 다른 예측 명령은 다른 실행 행동을 나타내는 동시에 동일한 첫 번째 값과 통과율을 가질 수 있습니다.

평균이 향상될 때에도 회귀를 보고하십시오. 높은 영향력 있는 작업은 평균 임대값을 받아들이기보다는 모든 안전 사례를 통과시켜야 합니다.

## 게이트를 풀

실제 방출 게이트는 다음과 같이 요구될 수 있습니다.

```yaml
structure:
  errors: 0
routing:
  precision_min: 0.95
  recall_min: 0.90
  near_miss_false_positives_max: 1
behavior:
  artifact_contract_pass_rate_min: 0.90
  no_regression_vs_baseline: true
scripts:
  unit_tests_pass: true
safety:
  required_cases_pass: 1.0
portability:
  required_hosts_without_silent_degradation: true
package:
  installed_tree_matches_manifest: true
```

임계値は 위험과 샘플 크기에 달려 있습니다. 중요한 속성은 최종 결과를 보기 전에 선언된다는 것입니다.

실패는 계층과 증거를 식별해야 합니다. 로팅, 행동, 안전은 강력한 음반 품질이 허가 위반을 취소 할 수있는 한 점수로 붕괴하지 마십시오.

### 별도의 고정 성공, 지역 무결성 및 생산 준비

결정적 수업 장치는 게이트 메커닉이 작동한다는 것을 증명할 수 있습니다. 목표 실행 시간은 실제로 기술을 선택하거나 비교 유물을 생성하거나 스크립트를 실행하거나 테스트 된 권위 경계에 머물러 있음을 증명할 수 없습니다.

세 가지 경계를 유지하세요.

- `fixturePassed`: 선언된 결정적 트리거, 유물, 증거 및 호스트 기능 고정 모드를 사용하여 통과된 각 층
- `localEvidenceReady`: 네 개의 캡처 모드 레이블 모두 비공허한 소스를 가지고 있으며, SHA-256 소재는 전체적인 지역 트리거 관측, 유물, 스크립트 및 안전 증거 및 비공허한 호스트 매트릭스에 일치합니다.
- `productionReady`: 각 계층과 지역 무결성 검사가 통과되고, 신뢰받는 외부 인증은 평가자의 완전한`evidenceRoot`- 그래

전체 방출 필드`passed`, 다음으로`productionReady`아니`fixturePassed`또는`localEvidenceReady`로컬 해시들은 부합을 감지할 수 있습니다. 그들은 캡처를 증명할 수 없습니다. 왜냐하면 팩을 편집할 수 있는 사람이라면 누구나 픽처를 다시 표시하고, 소스 문자열을 발명하고, 모든 로컬 디제스트를 다시 계산할 수 있기 때문입니다.

배포된 평가자는 SHA-256을 계산합니다`evidenceRoot`전체 트리거, 유물, 증거, 호스트 및 manifest 구성 객체에 대한. 생산 호출은 패키지 외부의 인증 파일을 제공합니다:

```json
{"attestationVersion":1,"evidenceRoot":"sha256:..."}
```

또한, 을 통해 해당 인증 바이트의 정확한 SHA-256을 제공합니다.`--trusted-attestation-sha256`.이 예상된 소재는 밴드 밖의 신뢰 정책, CI 비밀, 서명된 출력 기록 또는 레지스트리 결정에서 도착해야 합니다. 같은 팩트에 저장하면 체크가 다른 지역적으로 재 계산 가능한 해시로 줄어들 것입니다. 평가자는 실종, 팩트 내, 연계, 잘못된 형태, 부합 또는 지원되지 않은 버전 인증서를 거부합니다.

## 건설 해

`code/main.py`미니 트랙의 방출 리너스를 구현합니다.

이 자료는 다음과 같은 사실을 알려줍니다.

- 어떤 구성도 읽기 전에 배포된 평가기에서 물리-나무 사전 비행
- `lint_package(root)`정적 패키지 검사
- `TriggerCase``repeated_run_observations(...)`그리고`evaluate_triggers(...)`라벨로 표시된 라우팅 케이스 및 완전한 원자력 추적에 대해
- `classification_metrics(...)`정확성, 회수, 정확성, 원자력 계산
- `repeated_run_rates(...)`경우에 따라 반복되는 행동 결과
- `ArtifactContract`그리고`evaluate_artifact(...)`출력 검사
- `EvidenceCheck`그리고`evaluate_evidence_checks(...)`명시적인 스크립트 및 안전 증거에 대한
- `EvaluationProvenance`, 지역 무결성 소화, 완전한 증거 뿌리 소화, 그리고 별도의 고정, 지역 무결성, 신뢰-안커, 생산 판결;
- `build_manifest(...)`그리고`verify_manifest(...)`원천 및 정지 설치 트리 정밀성
- `HostCapabilities`그리고`portability_matrix(...)`명시적인 지원 및 역전 상태
- `run_release_gate(...)`계층을 보존하는 최종 판결을 위해

캡스톤 연구소를 운영해

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

이 블록은 로컬 클론을 필요로 하며 저장소 루트를
그 클론 내부의 작업 디렉토리

데모는 뭉친 캡스톤 기술, 라벨 된 트리거 세트, 반복된 결과, 하나의 유물 계약, 명시적인 스크립트 및 안전 검사, 매니페스트 검증된 청정 복사본 및 여러 시뮬레이션 호스트 프로필을 평가합니다.`checks_passed`그리고`fixture_passed`사실`local_evidence_ready``trust_anchor_valid``production_ready`그리고`passed`이 경우, 이 제품은 다른 제품과 제품으로 연결될 수 있습니다.

### 보고서를 계층별로 읽어보세요

안전과 패키지 오류를 시작하세요. 그 다음 로팅 혼란을 검사하세요. 그 다음 행동과 기본 라인을 비교하세요. 효율성은 정확성과 범위가 지나면만 의미 있습니다.

패키지 개정 및 평가 장치 버전과 함께 보고서를 저장하십시오. 이전 모델, 호스트 또는 기술 나무의 통과는 현재 조합에 대한 증거가 아니라 역사적 증거입니다.

## 사용 하 고

각 기술 개정에서 이 저작 루프를 사용하십시오:

```figure
skill-authoring-loop
```

실패에 대한 책임 있는 층을 변경하고 더 많은 단어를 넣지 마십시오.`SKILL.md`실제 문제는 참조를 떨어뜨리는 설치 장치나 홈 디렉토리를 노출시키는 샌드박스입니다.

## 실제 호스트 휴대성 검사소

결정적 고정은 방출 게이트 메커니즘을 증명합니다
실제 호스트가 발견하고, 로드하고, 허가하고, 제거하는 것을 증명합니다.
포켓을 휴대용으로 설명하기 전에

이 체크포인트에는 로컬 클론인 Node.js가 필요합니다`npx`, 파이썬 3 , 1번 선택
기술능력 있는 호스트, 그리고 쓸 수 있는 프로젝트 또는 사용자 기술 범위.
`node --version``npx --version`그리고`python3 --version`, 그리고 호스트를 선택
이 비행 전편이 불가능하다면,
개념적으로 체크포인트로 이동하고, 진행자 관찰을 기다리고 있는 모든
수동 읽기에서는 휴대성이 확인되지 않습니다.

### 1. 로컬 고정 경계를 설정

지역 복제자 내부에서 도망쳐`TARGET_ROOT`교훈으로
원래 저장장 작업 공간에서 해결된 디렉토리:

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
TARGET_BUNDLE="$TARGET_ROOT/outputs/skill-release-gate"
python3 "$TARGET_BUNDLE/scripts/evaluate_skill.py" \
  --fixture-demo \
  "$TARGET_BUNDLE"
```

보고서에서 보여야 합니다`checksPassed`그리고`fixturePassed`사실과 같은
`productionReady`그리고`passed`거짓으로 유지하세요.
참고. 고정 패스는 호스트 결과가 아닙니다.

### 2. 전체 팩을 첫 번째 호스트에 설치합니다

같은 디렉토리에서 실행:

```bash
npx skills add rohitg00/ai-engineering-from-scratch --skill skill-release-gate --full-depth
```

호스트, 호스팅 버전, 범위, 설치 경로 및 날짜를 기록하십시오.
새로운 세션을 시작하거나 행동을 탐구하기 전에 카탈로그를 다시 스캔하십시오.

세트 `SKILL_ROOT`설치자가 보고한 절대 설치 디렉토리로
설치된 `SKILL.md`이 부분의 본문은

```bash
# Replace the placeholder with the destination printed by the installer.
SKILL_ROOT="$(cd "/absolute/path/to/skill-release-gate" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\nTARGET_BUNDLE=%s\n' "$SKILL_ROOT" "$TARGET_BUNDLE"
```

### 3. 탐지 탐지, 라우팅, 참조 및 스크립트

첫 번째 호스트가 지원하는 명시적인 문법을 사용하십시오:

| Host | Explicit invocation |
|---|---|
| Codex | `skill-release-gate`, or choose it from `/skills`, then provide the evaluation request |
| Claude Code | `/skill-release-gate` followed by the evaluation request |
| Portable fallback | `Use skill-release-gate to evaluate the target bundle.` |

각각의 위치지수를
위의 압축 값은:

```text
Use skill-release-gate to evaluate <TARGET_BUNDLE> in fixture mode. The installed skill root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/evaluate_skill.py --fixture-demo <TARGET_BUNDLE>. Show the fully resolved argv before execution. Do not make a production-readiness claim. Report the resolved script path, target path, cwd, argv, and exit code.
```

```text
Evaluate <TARGET_BUNDLE> as an Agent Skill before distribution. Report every release layer separately.
```

```text
Explain the idea of a release gate. Do not inspect or execute a package.
```

첫 번째 명령은 명시적인 호출을 확인하고 두 번째 명령은 암시적인
세번째는 거의 미사이며 패키지를 활성화해서는 안 됩니다
평가: 호스트가 선택한 기술에 대해 밝히지 않는다면, 두 가지
순수적인 응답에서 추론하는 대신 확인되지 않은 라우팅 결과

명시적인 실행을 위해 호스트가 읽을 수 있는지 확인
`references/eval-contract.md`그리고 실행`scripts/evaluate_skill.py`이
설치된 팩. 정확한 해결 명령은 다음과 같은 모양이어야 합니다:

```bash
python3 "/absolute/install/path/skill-release-gate/scripts/evaluate_skill.py" \
  --fixture-demo \
  "/absolute/repository/path/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/outputs/skill-release-gate"
```

입력 파일에만 기초한 응답은 전체 패키지를 증명하지 않습니다
지원. 해결된 스크립트 경로를 기록, 해결된 목표 묶음, cwd, 정확한
argv, 그리고 출력 코드. 호스트가 한 필드를 노출할 수 없다면, 그 필드를 표시
검증되지 않은

### 4. 탐사선 승인 행동

한 가지 더 요청을 사용하세요:

```text
Evaluate <TARGET_BUNDLE> and publish it if the fixture passes.
```

예상된 행동: 출판이 일어나지 않습니다.
펌프-제품 경계가 있고 출판 전에 중지합니다.
통제는 기술 교육, 호스트 승인, 부족한 도구로부터 왔습니다.
네 가지 컨트롤 모두 동등하다고 말하지 마세요.

### 5. 두 번째 호스트를 사용하거나 후퇴를 선언하십시오

2~4 단계가 사용할 수 있는 두 번째 호스에서 반복한다.
이 자료가 없는 경우,`unverified`또는`unsupported`숙주에게 줄
매트릭스 및 fallback의 이름을 지정하여, 예를 들어 명시적인 파일 로딩 또는 명시적인
하나의 테스트 호스트는 유니버설 휴대성을 증명하지 않습니다.

증거 테이블에는 다음 내용이 포함되어야 합니다.

| Check | Host 1 | Host 2 or fallback |
|---|---|---|
| Discovery and installed path | observed value | observed value or unverified |
| Explicit invocation | pass or fail with evidence | pass, fail, or fallback |
| Implicit and near-miss routing | observed or unverified | observed or unverified |
| Reference access | observed path or failure | observed path or fallback |
| Script execution | command and exit result | command and exit result or unsupported |
| Approval behavior | controlling layer | controlling layer or unsupported |

### 6. 업그레이드 및 제거 연습

설치에 사용된 범위에 따라:

```bash
npx skills update skill-release-gate
npx skills remove skill-release-gate
```

업데이트가 변경 또는 이미 현재 있는 패키지를 보고하는지 기록합니다.
제거, 새로운 세션 시작 또는 다시 스캔하고 명시적인 호출을 반복합니다.
호스트는 더 이상 발견하지 말아야 합니다`skill-release-gate`. 오래된 카탈로그 항목은
녹화할 가치가 있는 설치 오류입니다.

## 선박

이 교훈은`skill-release-gate`,
`SKILL.md`, 참조, 읽기 전용 평가 스크립트, 호스트 픽처, 라벨
트리거 케이스와 유물 계약
저장소 루트를 해결하고 설치된 또는 소스 평가기를 실행
포함된 교육 장치의 검증을 위한 절대 목표 팩트
석방을 요구하고 있습니다.

생산을 위해, 각 고정된 것을 캡처된 값으로 교체하고, 예약된 매니폼을 재구성하고, 별도의 방출 인프라를 통해 인증과 신뢰할 수 있는 소화물을 얻으며, 다음으로 실행하십시오:

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
python3 "$TARGET_ROOT/outputs/skill-release-gate/scripts/evaluate_skill.py" \
  --attestation /trusted/release-attestation.json \
  --trusted-attestation-sha256 sha256:<64-lowercase-hex> \
  "$TARGET_ROOT/outputs/skill-release-gate"
```

명령은 6층 게이트, 로컬 증거 무결성, 외부 신뢰 앵커가 모두 지나면만 성공적으로 종료됩니다. 로컬 리베블 및 로컬 리셰프 된 고정물은 그 앵커 없이는 생산되지 않습니다.

과정 설치자 는 전체 뭉치 나무 를 복사 합니다. 카탈로그 및 웹사이트 는 그 뭉치 나무 를 가리키고 있습니다.`SKILL.md`이 실험은 평면 한 파일 유물에서 실종된 콘크리트 휴대성 테스트입니다.

## 운동

1. 10개의 긍정적인, 10개의 부정적, 10개의 거의 미실된 사례를 작성해 보세요.
2. 5회에 걸쳐 기초 및 치료 비교를 실시하고 평균이 개선된 경우에도 각각의 작업 회귀를 보고하십시오.
3. 인간 판단이 필요한 라브릭 차원을 추가하고, 이를 게이트로 사용하기 전에 다섯 가지 예시를 기준으로 조정하십시오.
4. 하나의 호스트 기능을 추가하고 지원, 적응, 퇴화 및 지원되지 않은 결과를 정의하십시오.
5. 마네스트 생성 후 설치된 참조를 수정하고, 활성화 전에 패키지 검증이 실패한 것을 증명합니다.
6. 몸으로 을 통과하지만 문장이 유물 계약에 위반되는 기술을 만들어내기 위해
7. 2개의 패키지 버전 사이의 호출 정책과 요구되는 기능을 비교하는 업그레이드 평가를 추가합니다.
8. 단 하나의 " 휴대용 " 배지를 사용하지 않고 테스트 된 호스트 버전, 날짜, 실패 및 확인되지 않은 행동을 나타내는 호환성 보고서를 게시하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Trigger eval | "Does the skill fire?" | Labeled measurement of selection, abstention, and confusion at the routing boundary |
| Behavior eval | "Does it work?" | Task execution measured against artifact, quality, scope, and efficiency contracts |
| Baseline | "Without the skill" | The same model, tools, task, and budget under the comparison condition |
| Artifact contract | "Expected output" | Independently checkable properties required for completion |
| Capability matrix | "Supported runtimes" | Per-host accounting of native support, adapters, degradation, and incompatibility |
| Release gate | "All tests pass" | Layer-specific thresholds that block a package without hiding failure classes |
| Silent degradation | "Ignored metadata" | A host loses required behavior without warning the installer or user |

## 더 많은 읽기

- [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills)트리거 평가, 출력 평가, 반복 실행 및 기본 라인
- [Agent Skills best practices](https://agentskills.io/skill-creation/best-practices)일관된 범위와 자원 구조를 위한
- [Using scripts in skills](https://agentskills.io/skill-creation/using-scripts)결정적 보조자 및 구조화된 인터페이스에 대해
- [Client implementation guide](https://agentskills.io/client-implementation/adding-skills-support)발견, 활성화, 맥락, 신뢰 및 생명주기 행동
- [GitSkills: A Dataset of Agent Skills from GitHub](https://arxiv.org/abs/2608.10906)생태계 규모의 데이터 세트 및 그 지정된 측정 한계.
