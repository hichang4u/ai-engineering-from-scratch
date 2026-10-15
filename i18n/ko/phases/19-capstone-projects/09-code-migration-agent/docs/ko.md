# 캡스톤 09  코드 마이그레이션 에이전트 (Repo 레벨 언어 / 런타임 업그레이드)

> 아마존의 마이그레이션 벤치 (Java 8~17) 와 구글의 앱 엔진 Py2-to-Py3 마이그레이터는 2026 바를 설정합니다. 모더너의 오픈레라이트는 결정적인 AST를 스케일로 다시 작성합니다. 그릿은 코드모드 스타일의 DSL와 같은 문제를 목표로합니다. 생산 패턴은 두 가지 모두 결합합니다. 안전한 재쓰기 위해 결정적인 기판과 모호한 경우에 대한 에이전트 레이어, 각 분포에 대한 모래 상자, PR가 열리기 전에 녹색으로 돌아가는 테스트 리네스. 최종 목표는 50개의 실제 리포를 마이그레이션하고 실패 분류율을 가진 합격률을 발표하는 것입니다.

**Type:** Capstone
**Languages:** Python (agent), Java / Python (targets), TypeScript (dashboard)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P5 · P7 · P11 · P13 · P14 · P15 · P17
**Time:** 30 hours

## 문제

대규모 코드 마이그레이션은 2026 코딩 에이전트의 가장 깨끗한 생산 응용 중 하나입니다. 기본 진실은 명백하다 (이번 마이그레이션 이후 테스트 스위트가 통과합니까?), 보상은 실제 (Java-8 함대 마이그레이션은 인력 규모 프로젝트) 이며 벤치마크는 공개 (MigrationBench 50-repo 하위 집합). 모더너의 오픈레라이트는 결정적인 측면을 다루고 있습니다. 에이전트 레이어는 OpenRewrite 레시피가 할 수 없는 모든 것을 처리합니다. 모호한 리워트, 빌드 시스템 드레프트, 긴 꼬리 문법, 과도한 의존성 분해.

자바 8 레포 (또는 파이썬 2 레포) 를 취하고 녹색 CI 마이그레이션 분사를 생성하는 에이전트를 만들 것입니다. 당신은 통과율, 테스트 커버리지 보존, 레포에 대한 비용, 실패 분류학을 측정합니다. 결정적 기준에 대한 옆으로 에이전트의 가치가 실제로 어디에 살고 있는지 알려줍니다.

## 개념

파이프라인에는 두 층이 있습니다.**deterministic substrate**(Java용 OpenRewrite, Python용 libcst) 는 기계적 리워이트의 대부분을 안전하게 실행합니다. 수입, 방법 서명, 무효 보안 편집, 리소스를 시도, 쓸모없는 API 교체. 그것은 빠르고 감사 가능한 차이를 생성합니다.**agent layer**(OpenAI Agents SDK 또는 LangGraph over Claude Opus 4.7 및 GPT-5.4-Codex) 는 레시피가 할 수 없는 경우를 처리합니다.

각 레포는 목표 실행 시간을 미리 설치한 데이토나 샌드박스를 얻습니다. 에이전트는 반복합니다. 실행 빌드, 오류를 분류, 수정 적용, 반복 실행. 하드 제한: 레포당 30 분, 레포당 8 달러, 에이전트 회전 20. 모든 테스트가 통과되고 커버리지 델타가 부정적이 아니라면 지부는 PR를 열습니다. 그렇지 않으면 레포는 증거와 함께 실패 클래스 아래서 제출됩니다.

실패 분류학은 전달가능한 것입니다. 50개의 리포에서, 무엇이 깨졌습니까? 전환적 디포? 사용자 지정 해설? 도구 버전을 구축하세요? 마이그레이션과 관련이 없는 테스트 플래크를 테스트하세요? 각 클래스는 계산과 모범적 차이를 얻을 수 있습니다. 미래의 레시피 작가들은 상위 세 개를 목표로 할 수 있습니다.

## 건축

```
target repo
      |
      v
OpenRewrite / libcst deterministic recipes
   (safe, fast, auditable, ~70-80% of fixes)
      |
      v
Daytona sandbox per branch
      |
      v
agent loop (Claude Opus 4.7 / GPT-5.4-Codex):
   - run build -> capture failures
   - classify failures (build, test, lint)
   - apply fix (patch or retry recipe)
   - rerun
   - budget: 30 min, $8, 20 turns
      |
      v
test + coverage delta gate
      |
      v (passed)
open PR
      |
      v (failed)
file under failure class + attach repro
```

## 

- 결정론적 기하급수: OpenRewrite (Java) 또는 libcst (Python)
- 에이전트: OpenAI 에이전트 SDK 또는 LangGraph를 클로드 오퍼스 4.7 + GPT-5.4-코덱스
- 샌드박스: 지분별 데이토나 개발 컨테이너, 미리 설치된 목표 실행 시간 (Java 17 / Python 3.12)
- 시스템 구축: 마벤, 그래들, uv (파이톤)
- 벤치마크: 아마존 마이그레이션 벤치 50 리포 하위 집합 (Java 8 ~ 17), 구글 앱 엔진 Py2-to-Py3 리포
- 테스트 하네스: 병렬 러너, Jacoco (Java) 또는 coverage.py (Python) 를 통해 커버링
- 관찰 가능: 각 디프렉션 조각을 가진 레포에 대한 랭푸스 + 트레이스 팩
- 패시보드: 클래스별 수와 예형 차이로 오류 분류 패시보드

```figure
ce-migration-funnel
```

## 건설 해

1. **Recipe pass.**먼저 OpenRewrite (Java) 또는 libcst (Python) 레시피를 실행하세요. 기계적 마이그레이션의 70-80%를 잡으세요. "레시피" 레시피로 약속하세요.

2. **Build trial.**데이토나 샌드박스: 목표 달성을 설치하고, 빌드 실행. 녹색이면 테스트를 넘기십시오. 빨간색이라면, 에이전트에 넘겨주십시오.

3. **Agent loop.**도구로 랭그라프:`run_build``read_file``edit_file``run_test``git_diff`. 에이전트는 오류를 분류하고 (심장, 문법, 테스트, 구축 도구) 그리고 목표된 수정법을 적용합니다.

4. **Budget caps.**30분 월 클럭 매 레포, 8달러, 20명의 에이전트 회전.

5. **Test + coverage gate.**빌드 가 녹색으로 바뀌면 테스트 스위트를 실행하세요. 커버리지는 기본 레포와 비교하세요. 커버리지는 2% 이상 떨어지면 " 커버리지_ 레그리션"에 파일을 입력하세요.

6. **PR open.**성공에 따라, 분사를 밀어, 다른 레시피와 요약으로 PR를 열고 어떤 레시피가 적용되고 어떤 요약이 작가를 의무화합니다.

7. **Failure taxonomy.**실패한 리포를 위해 클래스를 태그:`dep_upgrade_required``build_tool_drift``custom_annotation``test_flake``syntax_edge_case``budget_exhausted`- 다시보드를 만들죠

8. **50-repo run.**MigrationBench 하위 집합에서 실행합니다. 클래스별 합격률, 리포에 대한 비용, 커버리지- 보존 및 비교와 결정론적 기준만을 보고합니다.

## 사용 하 고

```
$ migrate legacy-java-service --target java17
[recipe]   27 rewrites applied (JUnit 4->5, HashMap initializer, try-with-resources)
[build]    FAIL: cannot find symbol sun.misc.BASE64Encoder
[agent]    turn 1 classify: removed_jdk_api
[agent]    turn 2 apply: sun.misc.BASE64Encoder -> java.util.Base64
[build]    OK
[tests]    412/412 passing; coverage 84.1% -> 84.3%
[pr]       opened #1841  cost=$3.20  turns=4
```

## 선박

`outputs/skill-migration-agent.md`레포를 사용하면 결정적인 레시피를 실행하고, πράκτο어 루프를 통해 녹색 마이그레이션 분사를 생성하거나 분류학 클래스 아래 레포를 파일에 올립니다.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | MigrationBench pass rate | 50-repo subset pass@1 |
| 20 | Test-coverage preservation | Mean coverage delta vs base |
| 20 | Cost per migrated repo | $/repo on passing runs |
| 20 | Agent / deterministic-tool integration | Fraction of fixes that OpenRewrite handled vs agent authored |
| 15 | Failure analysis write-up | Taxonomy completeness with exemplars |
| **100** | | |

## 운동

1. 마이그레이트 파이프라인을 오프너라이트 (아지언 없이) 로만 실행하세요. 전체 파이프라인과 통과율을 비교하세요. 에이전트가 차이점일 경우를 확인하세요.

2. " lint-clean" 체크를 실시: 마이그레이션 후 스타일 리너 (Java에 대한 스펙트럼없는, 파이썬에 대한 럭) 를 실행하십시오. 새로운 lint 오류가 나타나면 PR를 실패하십시오. 커버리지-보유-하지만 스타일-재귀율을 측정하십시오.

3. "최소 차이" 최적화 장치를 추가: 에이전트의 지부가 테스트를 통과한 후, 불필요한 변경 사항을 두 번째 통과로 단축하십시오.

4. 제3번 마이그레이션으로 확장: 노드 18에서 노드 22. 샌드박스 포장지를 재사용하고, 레시피 레이어를 사용자 지정 코드모드로 교환한다.

5. UX 메트릭으로 1st-green-build (TTFGB) 를 측정합니다. 목표: p50 10분 이하

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Deterministic substrate | "Recipe engine" | OpenRewrite / libcst: declarative AST rewrites with safety guarantees |
| Codemod | "Code-modifying program" | A rewrite rule that changes source code mechanically |
| Build drift | "Tool version skew" | Subtle Maven / Gradle / uv behavior changes between major versions |
| Failure class | "Taxonomy bucket" | A labeled reason a repo did not migrate: dep, syntax, test, build-tool, budget |
| Coverage delta | "Coverage preservation" | Change in test coverage % from base to migrated branch |
| Agent turn | "Tool-call round" | One plan -> act -> observe cycle in the agent loop |
| Budget exhaustion | "Hit the ceiling" | The repo consumed its 30-min / $8 / 20-turn limit without passing |

## 더 많은 읽기

- [Amazon MigrationBench](https://aws.amazon.com/blogs/devops/amazon-introduces-two-benchmark-datasets-for-evaluating-ai-agents-ability-on-code-migration/) 2026년 규격적 기준
- [Moderne.io OpenRewrite platform](https://www.moderne.io) 결정적 지층 참조
- [OpenRewrite documentation](https://docs.openrewrite.org) 요리법 작성
- [Grit.io](https://www.grit.io) 대체 코드 모드 DSL
- [OpenAI sandboxed migration cookbook](https://developers.openai.com/cookbook/examples/agents_sdk/sandboxed-code-migration/sandboxed_code_migration_agent) 에이전트 SDK 참조
- [Google App Engine Py2 to Py3 migrator](https://cloud.google.com/appengine) 대안 이주 기준
- [libcst](https://github.com/Instagram/LibCST) 파이썬 결정적 기판
- [Daytona sandboxes](https://daytona.io) 각 지점별 참조 모래 상자
