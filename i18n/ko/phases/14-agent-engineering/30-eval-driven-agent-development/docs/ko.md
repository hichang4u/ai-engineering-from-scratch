# 에발-디프린 에이전트 개발

> 인트로피크의 지침: "단순한 명령어들로 시작하여 종합적인 평가로 최적화하고 필요한 경우에만 다단계 요원 시스템을 추가하십시오". 평가는 마지막 단계가 아닙니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** All of Phase 14.
**Time:** ~60 minutes

## 학습 목표

- 3가지 평가 계층을 명명하라  정적 기준, 커스터마이즈 오프라인, 온라인 생산  그리고 각 계층의 목적
- 평가자-최시자 긴밀한 루프를 설명해 주세요.
- 2026년 최고의 실천을 설명하라: 평가들은 코드 옆에 생중계되고, CI에서 실행되고, 게이트 PR가 있습니다.
- 모든 단계 14 수업을 생성된 평가 사건으로 연결해 주세요.

## 문제

에이전트는 디모를 통과합니다. 그들은 디모가 예측할 수 없는 방식으로 생산에 실패합니다. 벤치마크는 "이 모델은 광범위하게 가능합니까?"에 대한 답변이 아니라 "이 에이전트는 내 제품에 대한 올바른 패치를 배송합니까?"에 대한 답변은: 모든 경비와 학습된 규칙이 평가 케이스에 매핑되어 연속적으로 실행되는 세 층에서 평가합니다.

## 개념

### 3가지 평가 계층

1. **Static benchmarks** SWE 벤치 코드 (강사 19), 웹 아레나/OSWorld 브라우징/ 데스크톱 (강사 20), GAIA 일반 (강사 19), BFCL V4 도구 사용 (강사 06) 을 위해 확인. 크로스 모델 비교 및 회귀 게팅을 위해 사용. 오염은 실제입니다: SWE 벤치+는 32.67% 솔루션 누출을 발견했습니다. 항상 확인 / + 감사 점수를 보고합니다.

2. **Custom offline evals** 제품의 모양:
   - 법무장관 (Langfuse, Phoenix, Opik  24강)
   - 실행 기반 (패치 실행, 검사 테스트)
   - 궤도 기반 (황금에 대한 액션 시퀀스를 비교하십시오; OSWorld-Human는 금보다 1.4-2.7x 높은 에이전트를 보여줍니다).

3. **Online evals**생산:
   - 세션 재연 (Langfuse)
   - 경비선에서 발동된 경고 (목록 16, 21)
   - 단계별 비용/연연기 추적 (학습 23 OTel 범위).

### 평가자-최시 (인тропо)

긴밀한 루프:

1. 제안자는 출력을 생성합니다.
2. 평가자 판사
3. 평가자가 통과할 때까지 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀히 정밀

이것은 자기 정제 (강좌 05) 일반화입니다. 당신이 관심있는 모든 에이전트 흐름은 신뢰성을 위해 평가자 최적화로 포장 할 수 있습니다.

### 2026 최선 실습

- 에발은 코드의 옆에 살고 있습니다.
- 모든 PR에 정보주사를 맡아
- 평가 점수에 대한 게이트 융합 (예를 들어 "5% 대 메인>의 회귀가 없다").
- 모든 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비
- 학습된 규칙 (반응, 작업 흐름에 대한 학습 규칙) 은 실패 사례를 지도합니다.

### 14단계 결합

14단계에서의 모든 수업은

| Lesson | Eval case it generates |
|--------|------------------------|
| 01 Agent Loop | Budget-exhausted, infinite-loop guard |
| 02 ReWOO | Planner replans correctly when a tool fails |
| 03 Reflexion | Learned reflections apply on retry |
| 05 Self-Refine/CRITIC | Judge passes refined output |
| 06 Tool Use | Argument coercion works; unknown tools rejected |
| 07-10 Memory | Retrieval citations match sources; stale facts invalidate |
| 12 Workflow Patterns | Each pattern produces correct output |
| 13 LangGraph | Resume reproduces state exactly |
| 14 AutoGen Actors | DLQ catches crashed handlers |
| 16 OpenAI Agents SDK | Guardrail trips on the right inputs |
| 17 Claude Agent SDK | Subagent results return to orchestrator |
| 19-20 Benchmarks | SWE-bench Verified score, WebArena success rate, OSWorld efficiency |
| 21 Computer Use | Per-step safety catches injected DOM |
| 23 OTel | Spans emit required attributes |
| 26 Failure Modes | Detectors tag known failures |
| 27 Prompt Injection | PVE refuses poisoned retrievals |
| 28 Orchestration | Supervisor routes to the right specialist |
| 29 Runtime Shapes | DLQ handles N% failure |

만약 여러분의 평가 부트에서 각각의 사례가 있다면, 여러분은 14단계를 다루었습니다.

### 평가 중심의 개발이 실패하는 경우

- **No baseline.**마지막 알려진 것이 없는 이발은 읽을 수 없습니다.
- **LLM-judge without grounding.**판사들도 환각을 합니다. 비판적 패턴 (강좌 05)
- **Over-fitting to evals.**평가에 최적화하는 것은 생산 유용성에 차이가 있습니다.
- **Flaky evals.**비결론적 사례는 가짜 알람을 일으킨다

```figure
ae-eval-three-layers
```

## 건설 해

`code/main.py`stdlib eval 띠입니다:

- 범주 (표준표, 사용자 지정, 온라인) 로 분류된 사례 등록
- 시나리오를 작성한 에이전트 시험 중
- 평가자-최고화 루프: 제안, 판단, 통과 또는 최대 라운드까지 정비.
- CI 게이트: 합계 합격률 + 기본 기준에 대한 회귀

실행하세요:

```
python3 code/main.py
```

출력: 각 사례 합격/실패, 회귀 표지판, CI 게이트 판례.

## 사용 하 고

- 에이전트 코드와 같은 레포에 eval 케이스를 작성하세요.
- 정보통신사에서 모든 PR를 조사해봐
- 회귀에 대한 구축 실패.
- 시간이 지남에 따라 통과율을 추적합니다.
- 모든 생산 실패를 새로운 케이스에 연결시켜라

## 선박

`outputs/skill-eval-suite.md`CI 게이트와 회귀 추적을 가진 에이전트 제품에 대한 3층 평가 스위트를 구축합니다.

## 운동

1. 제작 실패 중 하나를 받아서 재현하는 평가 사례를 작성해 보세요.
2. 3차원 (실적, 음향, 범위) 을 가진 영역에 대한 LLM 판사 라부리크를 구축하세요. 50 세션의 점수를 얻으십시오.
3. 평가 부트를 CI로 연결하여, >=5% 회귀에 대한 빌드 실패
4. 궤도 효율성 측정값을 추가해 보세요. 에이전트가 얼마나 많은 걸음으로 금 궤도를 밟았을까요?
5. 네 번째 단계 수업을 네 스위트에서 평가 사건으로 매핑해

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Static benchmark | "Off-the-shelf eval" | SWE-bench, GAIA, AgentBench, WebArena, OSWorld |
| Custom offline eval | "Domain eval" | LLM-as-judge / exec / trajectory on your product shape |
| Online eval | "Production eval" | Session replay, guardrail alerts, cost/latency tracking |
| Evaluator-optimizer | "Propose-judge-refine" | Iterate until judge passes |
| CI gate | "Merge blocker" | Fail the build on eval regression |
| Baseline | "Last-known-good" | Reference score to detect regression |
| Trajectory efficiency | "Steps over gold" | Agent step count divided by human expert minimum |

## 더 많은 읽기

- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) "단순하게 시작해, 평가로 최적화해"
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 큐레이션 기준
- [Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) 도구 사용 기준
- [Langfuse docs](https://langfuse.com/) 평가 + 실제 세션 재생
