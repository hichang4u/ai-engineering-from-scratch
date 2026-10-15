# 캡스톤 10  다중 에이전트 소프트웨어 엔지니어링 팀

> 2026년, 다중 에이전트 엔지니어링 팀의 형태가 모조리화되었습니다. 건축가 계획이, N 코더가 평행 작업 트리에서 작동하고, 리뷰어 게이트, 테스터가 확인합니다. SWE-AF의 공장 건축, MetaGPT의 역할 기반의 촉구, AutoGen 0.4의 타이핑 배우 그래프, Cognition의 Devin, 그리고 Factory의 Droid 모두 독립적으로 착륙했습니다. 평행 작업나무는 벽 시계들을 출력으로 변환합니다. 공유 상태와 전달 프로토콜은 실패 표면으로 변합니다. 팀 구성, SWE 벤치 프로에 대한 평가, 그리고 어떤 랜더프가 깨지고 얼마나 자주 일어나는지 보고하는 것이 목표입니다.

**Type:** Capstone
**Languages:** Python / TypeScript (agents), Shell (worktree scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P16 · P17
**Time:** 40 hours

## 문제

단일 에이전트 코딩 선은 큰 작업에 천장을 맞습니다. 어떤 개별 에이전트가 약하기 때문이 아니라 200k 토큰 컨텍스트가 아키텍처 플러스 4개의 병렬 코드베이스 슬라이즈와 리뷰어 댓글과 테스트 출력을 유지할 수 없기 때문입니다. 다중 에이전트 공장들은 문제를 나눕니다. 건축가가 계획을 소유하고 있고, 코더들은 병렬 작업 트리에서 구현을 소유하고 있고, 검토자는 게이트를 하고, 테스트자는 검증합니다. SWE-AF의 "팩토리" 아키텍처, MetaGPT의 역할, AutoGen의 타이핑 배우 그래프

실패 표면은 전달입니다. 건축가는 코더들이 구현할 수 없는 것을 계획합니다. 코더들은 충돌하는 차이를 생성합니다. 리뷰어는 환각된 수정 사항을 승인합니다. 테스트자는 여전히 작성하는 코더를 경쟁합니다. 당신은 이러한 팀 중 하나를 구축하고 50 개의 SWE 벤치 프로 에스포트에 실행하고 모든 전달을 추적하고 포스트모르템을 게시합니다.

## 개념

역할은 입력된 에이전트입니다.**Architect**(Claude Opus 4.7) 는 문제를 읽고 계획을 작성하고 명시적인 인터페이스로 하위 작업으로 나눕니다. **Coders**(Claude Sonnet 4.7, N 병렬 인스턴스, 각`git worktree`+ Daytona sandbox) 과제들을 독립적으로 구현합니다. **Reviewer**(GPT-5.4) 는 합병된 차이점을 읽고, 특정 변경 사항을 승인하거나 요청합니다. **Tester**(Gemini 2.5 Pro) 는 테스트 스위트를 격리적으로 실행하고 유물과 함께 통과/실패를 보고합니다.

통신은 공유 작업 게시판 (파일 백업 또는 Redis) 을 통해 이루어집니다. 각 역할은 수행할 수 있는 임무를 다합니다. 전달은 A2A 프로토콜 타입의 메시지입니다. 조정 문제: 합병-충돌 해결 (조정 역할 또는 자동 삼방 합병), 공유 상태 동기화 (계획은 코더가 시작되면 동결됩니다; 재계획은 별도의 이벤트입니다), 및 검토자 게이트 (심사자는 자신의 변경 사항 또는 제안된 변경 사항을 승인할 수 없습니다).

토큰 증폭은 숨겨진 비용입니다. 각 역할 경계는 요약 명령어와 전달 컨텍스트를 추가합니다. 40 회 단행동 실행은 4 개의 역할에서 총 160 회로됩니다. 주제는 특정적으로 토큰 효율성을 단일 에이전트 기본 라인에 비해 무게를 두고 있습니다. 문제는 "다 에이전트 작업이 있습니까?"가 아니라 "달러당 승리합니까?"입니다.

## 건축

```
GitHub issue URL
      |
      v
Architect (Opus 4.7)
   reads issue, produces plan with subtasks + interfaces
      |
      v
Task board (file / Redis)
      |
   +-- subtask 1 ---+-- subtask 2 ---+-- subtask 3 ---+-- subtask 4 ---+
   v                v                v                v                v
Coder A          Coder B          Coder C          Coder D          (4 parallel)
 (Sonnet)         (Sonnet)         (Sonnet)         (Sonnet)
 worktree A       worktree B       worktree C       worktree D
 Daytona          Daytona          Daytona          Daytona
      |                |                |                |
      +--------+-------+-------+--------+
               v
           merge coordinator  (three-way merge + conflict resolution)
               |
               v
           Reviewer (GPT-5.4)
               |
               v
           Tester  (Gemini 2.5 Pro)  -> passes? -> open PR
                                     -> fails?  -> route back to coder
```

## 

- 오케스트레이션: 공유 상태 + 각 에이전트 하위 그래프로 랭그그래프
- 메시지: A2A 프로토콜 (Google 2025)
- 모델: Opus 4.7 (건축가), Sonnet 4.7 (코더), GPT-5.4 (평론가), Gemini 2.5 Pro (테스터)
- 작업나무 격리: `git worktree add`코더 + 데이토나 샌드박스
- 합병 조정자: 사용자 지정 삼방 합병 + LLM 중재 분쟁 해결
- Eval: SWE 벤치 프로 (50 에피소스), SWE-AF 시나리오, 단위 테스트에 대한 HumanEval++
- 관찰 가능: 롤 태그 스포인, 에이전트 당 토큰 회계
- 배포: K8s 각 역할은 별도의 배포 + HPA

```figure
ce-team-handoff
```

## 건설 해

1. **Task board.**입력된 메시지로 파일 지원 JSONL: `plan_request``subtask``diff_ready``review_needed``test_needed``approved``rejected``replan_needed`- 에이전트들은 태그를 가입합니다.

2. **Architect.**GitHub 에스포스를 읽고, 명시적인 하위 작업 인터페이스 (처음된 파일, 공개 기능, 테스트 효과) 를 요구하는 계획 템플릿으로 Opus 4.7을 실행합니다.`plan_request`일일이 되는 부분 작업이 있습니다.

3. **Coders.**N 병렬 노동자들은 각자가 보드로부터 한 가지 하위 작업을 요구하고, 각자는 새로운 작업을 낳습니다.`git worktree add`지점과 데이토나 샌드박스`diff_ready`패치 + 테스트 델타와 함께

4. **Merge coordinator.**모든 코더가 완료되면, 삼방법은 N 지부를 단계화 지수로 통합합니다. 파일 레벨 중복이 존재하는 경우에만 LLM 중재 분쟁 해결.

5. **Reviewer.**GPT-5.4는 합병된 차이점을 읽습니다. 작성된 차이점을 승인할 수 없습니다. 발급합니다.`approved`(no-op) 또는`review_feedback`특정 변경 요청이 해당 코더로 다시 전달됩니다.

6. **Tester.**제미니 2.5 프로는 깨끗한 모래 상자 안에 테스트 스위트를 운영하고`test_passed`또는`test_failed`실패한 테스트는 실패한 하위 작업의 소유자인 코더로 돌아갑니다.

7. **Handoff accounting.**역할 경계를 넘는 모든 메시지는 랑프우즈에서 사용된 용량 크기와 모델에 따라 스랜을 얻습니다. 하위 작업에 대한 토큰 증폭을 계산하십시오 (코더_토큰 + 리뷰어_토큰 + 테스터_토큰 + 아키텍트_셰어 / 코더_토큰).

8. **Eval.**50개의 SWE 벤치 프로 에스문과 실행하세요. 하나의 에이전트 기본 라인 ( 단일 워크 트리에서 하나의 소넷 4.7) 에 대해 pass@1와 $-per-solved-issue를 비교하세요.

9. **Post-mortem.**각 실패한 에스프레임에 대해, 깨진 전달을 확인하십시오 (계획이 너무 모호, 융합 충돌, 리뷰어 거짓 승인, 테스트 flake).

## 사용 하 고

```
$ team run --issue https://github.com/acme/widget/issues/842
[architect] plan: 4 subtasks (parser, cache, api, migration)
[board]     dispatched to 4 coders in parallel worktrees
[coder-A]   subtask parser  -> 42 lines, tests pass locally
[coder-B]   subtask cache   -> 88 lines, tests pass locally
[coder-C]   subtask api     -> 31 lines, tests pass locally
[coder-D]   subtask migration -> 19 lines, tests pass locally
[merge]     3-way merge: 0 conflicts
[reviewer]  comments on cache (thread pool sizing); routed to coder-B
[coder-B]   revision: 92 lines; submits
[reviewer]  approved
[tester]    all 412 tests pass
[pr]        opened #3382   4 coders, 1 revision, $4.90, 18m
```

## 선박

`outputs/skill-multi-agent-team.md`문제 URL 및 병렬성 수준을 고려하면 팀은 역할별 토큰 회계와 함께 통합 준비 PR를 생성합니다.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | Matched 50-issue subset, pass@1 |
| 20 | Parallel speedup | Wall-clock vs single-agent baseline |
| 20 | Review quality | False-approval rate on injected-bug probe |
| 20 | Token efficiency | Total tokens per solved issue vs single-agent |
| 15 | Coordination engineering | Merge-conflict resolution, handoff-failure histogram |
| **100** | | |

## 운동

1. 명백한 버그를 중기 (extra) 에 주입한다.`return None`본 기관에 앞서) 검사의 거짓 승인 비율을 측정하고 검사의 거짓 승인 5% 미만 될 때까지 검사를 조정합니다.

2. 2개의 코더로 줄여서 (건축가 + 코더 + 리뷰어 + 테스터, 코더는 2개의 하위 작업을 순차적으로 실행한다). 벽 시계와 통과율을 비교하십시오.

3. 융합 조정자를 단일 작성자 제한으로 교체하십시오 (부 작업은 분리된 파일 세트를 만집니다). 건축자에 대한 계획 부담을 측정하십시오.

4. GPT-5.4에서 Claude Opus 4.7까지의 교환 검토자. 거짓 승인율과 토큰 비용 델타를 측정한다.

5. 다섯 번째 역할: 문서 작성자 (하이쿠 4.5) 를 추가하여 검토 후 변경록 항목을 생성합니다. 문서 품질이 추가 토큰 지출을 정당화하는지 측정합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Parallel worktree | "Isolated branch" | `git worktree add` producing a fresh working tree per coder |
| Task board | "Shared message bus" | File or Redis store of typed messages agents subscribe to |
| Handoff | "Role boundary" | Any message crossing from one role's context to another's |
| Token amplification | "Multi-agent overhead" | Total tokens across roles / single-agent tokens for the same task |
| A2A protocol | "Agent-to-agent" | Google's 2025 spec for typed inter-agent messages |
| Merge coordinator | "Integrator" | Component that runs three-way merge and mediates conflicts |
| False approval | "Reviewer hallucination" | Reviewer approves a diff with known bugs |

## 더 많은 읽기

- [SWE-AF factory architecture](https://github.com/Agent-Field/SWE-AF) 2026년 기준 다중 대리인 공장
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT) 역할 기반의 다중 에이전트 프레임워크
- [AutoGen v0.4](https://github.com/microsoft/autogen) 마이크로소프트의 타이핑 주역 프레임워크
- [Cognition AI (Devin)](https://cognition.ai) 참고 제품
- [Factory Droids](https://www.factory.ai) 대체 기준제품
- [Google A2A protocol](https://a2a-protocol.org/latest/) 대리자 간 메시지 스펙
- [git worktree documentation](https://git-scm.com/docs/git-worktree) 격리 자판
- [SWE-bench Pro](https://www.swebench.com) 평가 목표
