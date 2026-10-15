# 캡스톤 16  GitHub 에스유-투-PR 자율주행자

> 문제점을 표시하고 PR를 얻으십시오. 자율적인 코딩 에이전트용 2026 제품 모양: 클라우드 샌드박스에 에이전트를 실행하고 테스트 통과를 확인하고 논리적인 검토 준비 PR를 게시하십시오. AWS 원격 SWE 에이전트, 커서 배경 에이전트, OpenAI 코덱스 클라우드, 구글 줄스 모두 그것을 배송합니다. 어려운 부분은 repo의 구축 환경을 자동으로 재생하고, 자격증 누출을 방지하고, repo 예산을 강제적으로 밀어 넣지 않도록 하는 것입니다. 이 톱스톤은 자체 호스팅 버전을 구축하고 호스팅 대안과 비용과 통과율을 비교합니다.

**Type:** Capstone
**Languages:** Python (agent), TypeScript (GitHub App), YAML (Actions)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P17
**Time:** 30 hours

## 문제

아싱크 클라우드 코딩 에이전트는 인터랙티브 코딩 에이전트 (Capstone 01) 에서 분리된 제품 카테고리입니다. UX는 GitHub 레이블입니다.`@agent fix this`, 직원은 클라우드 샌드박스에 스핀을 들고 레포를 복제하고 테스트를 실행하고 파일을 편집하고, 확인하고, 에이전트의 논리적인 인식을 가지고 PR를 열고 있습니다. 인터랙티브 루프, 터미널이 없습니다. AWS 원격 SWE 에이전트, 커서 백그라운드 에이전트, OpenAI 코덱스 클라우드, 구글 줄스, 그리고 공장 드로이드 모두 이 부분에 합쳐집니다.

엔지니어링 과제는 구체적 이다: 환경 재생 ( 에이전트는 캐시 된 개발 이미지 없이 처음부터 리포를 구축해야합니다),  flaky 테스트 (다시 실행 또는 격리해야합니다), 자격 범위 (최소의 미세한 권한으로 된 GitHub 앱), 하루 리포에 대한 예산 집행 및 강제 추진 정책.

## 개념

트리거는 GitHub 웹  (문제 레이블 또는 PR 댓글) 이다. 디스페이처는 ECS Fargate 또는 Lambda에 작업을 적재한다. 작업자는 레포 (Repo) 에서 추론된 일반 Docker파일 (언어, 프레임워크) 을 사용하여 Daytona 또는 E2B 샌드박스에 레포를 끌어당긴다. 에이전트는 클로드 Opus 4.7 또는 GPT-5.4 코덱스에 대한 미니 스웨 에이전트 또는 SWE 에이전트 v2 루프를 실행합니다. 그것은 반복합니다: 코드를 읽으십시오, 수정 제안, 패치 적용, 테스트를 실행하십시오.

검증은 게팅 단계입니다. PR가 열리기 전에 전체 CI가 모래 상자에 통과해야합니다. 커버리지 델타는 계산됩니다.`needs-review`. 에이전트는 논리적인 이유를 PR 설명과 함께 `@agent`평론가들은 추적을 요청할 수 있습니다.

안전은 두 개의 다른 GitHub 표면을 통해 측정됩니다. 앱은 짧은 시간 동안 설치 토큰을 제공합니다.`workflows: read`그리고 좁은 레포 콘텐츠/PR 범위; 지점 보호 (앱 권한이 아닌) 는 "직접 문자 없습니다.`main`"와 "강력추진이 없습니다"  앱은 결코 우회 목록에 추가되지 않습니다. 경로 스캔 된 읽기 전용 액세스`.github/workflows`실제 GitHub 앱 원시형이 아니므로, 파일 편집에 대한 에이전트의 허용 목록은 작업자에게 적용해야 합니다. 매일 리포당 예산 제한은 디스페이처에서 시행됩니다 (예를 들어, 하루에 리포당 최대 5 PR, 매일 PR당 $ 20).

## 건축

```
GitHub issue labeled `@agent fix` or PR comment
            |
            v
    GitHub App webhook -> AWS Lambda dispatcher
            |
            v
    ECS Fargate task (or GitHub Actions self-hosted runner)
       - pull repo
       - infer Dockerfile (language, package manager)
       - Daytona / E2B sandbox with target runtime
       - clone -> git worktree -> agent branch
            |
            v
    mini-swe-agent / SWE-agent v2 loop
       Claude Opus 4.7 or GPT-5.4-Codex
       tools: ripgrep, tree-sitter, read/edit, run_tests, git
            |
            v
    verify CI passes in-sandbox + coverage delta check
            |
            v (verified)
    git push + open PR via GitHub App
       PR body = rationale + diff summary + trace URL
       label: needs-review
            |
            v
    operator reviews; can @-mention agent for follow-ups
```

## 

- 트리거: 미세한 곡물 토큰을 가진 GitHub 앱; Lambda 또는 Fly.io를 통해 웹허크 수신기
- 작업자: ECS Fargate 작업 (또는 GitHub Actions 자체 호스팅 실행자)
- 샌드박스: 데이토나 개발 컨테이너 또는 E2B 샌드박스
- 에이전트 루프: 미니 스웨 에이전트 기본 라인 또는 클로드 오퍼스 4.7 / GPT-5.4 코덱스 상의 SWE 에이전트 v2
- 검색: 나무 위원 리포 지도 + 칩그립
- 검증: 전체 CI 캔버스 + 커버링 델타 게이트
- 관찰 가능: PR 기관에서 연결된 PR 단위 추적 기록과 함께 Langfuse
- 예산: 일당 repo 일당 달러 최고

```figure
cf-issue-to-pr
```

## 건설 해

1. **GitHub App.**정밀화 된 설치 토큰: 읽기+쓰기, pull_requests 쓰기, 콘텐츠 읽기+쓰기, 작업 흐름 읽기 문제.`main`"와 "무엇을 강요하지 마십시오". 앱은 우회 목록에 없습니다. 노동자는 "무엇을 강요하지 않습니다".`.github/workflows`" GitHub 앱 권한이 경로 범위가 아니기 때문에 제안된 차이에 대한 허용 목록 확인

2. **Webhook receiver.**Lambda 함수는 문제 표기 / PR 댓글 웹 록을 받아 들인다. 표기별 필터 `@agent fix this`SQS에 수열

3. **Dispatcher.**SQS에서 작업을 실행합니다. 일당 예산에 따라 Repo를 실행합니다. repo URL, 발행 부지 및 신선한 Daytona 샌드박스와 함께 ECS Fargate 작업을 스핀합니다.

4. **Environment inference.**언어 (Python, Node, Go, Rust) 및 패키지 관리자 (uv, pnpm, go mod, cargo) 를 탐지합니다.

5. **Agent loop.**클로드 오퍼스 4.7와 함께 mini-swe-agent 또는 SWE-agent v2. 도구: ripgrep, tree-sitter repo-map, read_file, edit_file, run_tests, git. 하드 제한: $ 20 비용, 30 분 벽 시계, 30 대리원 회전.

6. **Verification.**루프 종료 후 전체 테스트 스위트를 샌드박스에서 실행하십시오. jacoco / coverage.py를 통해 커버리지 델타를 계산하십시오. CI 빨간색: 중지하면 PR를 열지 마십시오. 커버리지가 2% 이상 떨어지면: PR를 열기 `needs-review`라벨

7. **PR posting.**에이전트 분사를 밀어넣어 GitHub API를 통해 PR를 열 수 있습니다: 제목, 논리, 다른 요약, 추적 URL, 비용, 회전.

8. **Credential hygiene.**워커는 짧은 기간 동안 GitHub 앱 설치 토큰을 실행합니다. 로그는 기록 전에 비밀에 대해 스크래프됩니다.

9. **Eval.**30개의 내부 문제들이 다양하게 심어졌습니다. 합격률, PR 품질 (차별 크기와 스타일, 커버리), 비용, 지연시간을 측정합니다. 동일한 문제들에 대해 커서 배경 에이전트 및 AWS 원격 SWE 에이전트와 비교하십시오.

## 사용 하 고

```
# on github.com
  - user labels issue #842 with `@agent fix this`
  - PR #1903 appears 14 minutes later
  - body:
    > Fixed NPE in widget.dedupe() caused by null comparator entry.
    > Added regression test widget_test.go::TestDedupeNullComparator.
    > Coverage delta: +0.12%
    > Turns: 7  Cost: $1.80  Trace: langfuse:...
    > Label: needs-review
```

## 선박

`outputs/skill-issue-to-pr.md`GitHub 앱 + 어시크 클라우드 작업자가 라벨된 문제를 제한된 비용과 범위의 자격증을 가진 검토 준비 PR로 전환합니다.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Pass rate on 30 issues | End-to-end success (CI green + coverage OK) |
| 20 | PR quality | Diff size, coverage delta, style conformance |
| 20 | Cost and latency per resolved issue | $ and wall-clock per PR |
| 20 | Safety | Scoped token, per-repo budget, no force-push, credential hygiene |
| 15 | Operator UX | Rationale comments, retry affordance, @-mention follow-up |
| **100** | | |

## 운동

1. "정확한  모양의 테스트" 모드를 추가: 라벨 `@agent stabilize-flake TestX`테스트를 샌드박스에서 50번 실행하고 최소의 변화를 제안하여 안정시킵니다.

2. 3가지 공통적인 문제들에 대해 비용과 커서 배경 에이전트를 비교하고 어떤 도구가 어디서 승리하는지 보고하십시오.

3. 예산 패시보드를 구현해 보세요. 일당 비용, 사용자당 비용.

4. CI를 실행하지 않고 PR 초안을 열 수 있는 "dry-run" 모드를 구축하여 검토자가 계획을 저렴하게 검토할 수 있습니다.

5. 유지 정책을 추가: 통합되지 않은 7 일 이상 PR 지부는 자동으로 삭제됩니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GitHub App | "Scoped bot identity" | App with fine-grained permissions + short-lived installation token |
| Async cloud agent | "Background agent" | Non-interactive worker that runs in a cloud sandbox, not a terminal |
| Environment inference | "Dockerfile synthesis" | Detect language + package manager, generate a Dockerfile if absent |
| Verification | "CI-in-sandbox" | Run the full test suite inside the worker before opening a PR |
| Coverage delta | "Coverage preservation" | Change in test coverage % from base to agent branch |
| Per-repo budget | "Daily ceiling" | Dollar and PR-count cap enforced at the dispatcher |
| Rationale | "PR body explanation" | Agent's summary of what changed and why; required in the PR body |

## 더 많은 읽기

- [AWS Remote SWE Agents](https://github.com/aws-samples/remote-swe-agents) 가논적 아싱크 클라우드 에이전트 참조
- [SWE-agent](https://github.com/SWE-agent/SWE-agent) CLI 참조
- [Cursor Background Agents](https://docs.cursor.com/background-agent) 상업적 대안
- [OpenAI Codex (cloud)](https://openai.com/codex) 개최된 경쟁자
- [Google Jules](https://jules.google) 구글의 호스팅 버전
- [Factory Droids](https://www.factory.ai) 대체 상용 참조
- [GitHub App documentation](https://docs.github.com/en/apps) 범위를 가진 로봇의 정체성
- [Daytona cloud sandboxes](https://daytona.io) 참조 모래 상자
