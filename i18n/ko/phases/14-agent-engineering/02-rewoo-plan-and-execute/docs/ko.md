# 리우오와 계획 및 실행: 분리된 계획

> ReAct은 생각과 행동을 하나의 스트림으로 엮어 놓습니다. ReWOO는 그것들을 분리합니다. 한 큰 계획이 전면으로, 그리고 실행합니다. 5배 더 적은 토큰, +4%의 정확성 HotpotQA, 그리고 당신은 계획자를 7B 모델로 정제할 수 있습니다. 계획- 및 실행은 일반화; 계획- 및 실행은 웹 탐색으로 확장되었습니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop)
**Time:** ~60 minutes

## 학습 목표

- ReWOO의 계획자/노동자/해결자 분할이 토큰을 절약하고 ReAct의 융합 루프에 대한 강도를 향상시키는 이유를 설명하십시오.
- 계획 DAG, 의존 명령 실행자, 그리고 작업자 출력을 구성하는 솔루터를 구현합니다.
- 2026년 "제 다섯 가지 작업 흐름 패턴" 프레임링을 사용하여 계획-이후 실행 대 상호작용 ReAct으로 작업이 실행되어야 할 때를 결정하십시오 (인тропо)
- 장기적인 웹 또는 모바일 작업에 대해 플랜 앤 액트의 합성 계획 데이터가 필요할 때 인식하십시오.

## 문제

ReAct의 상호작용하는 생각-행동-관측 루프는 간단하고 유연하지만, 모든 도구 호출은 이전 모든 생각을 포함하여 전적 컨텍스트를 모두 가져야합니다. 토큰 사용은 깊이와 함께 사각형적으로 증가합니다. 더 나쁜 것은 도구가 중순에서 실패하면 모델은 오류 관측에서 전체 계획을 다시 추출해야합니다.

ReWOO (Xu et al., arXiv:2305.18323, 2023년 5월) 는 이것을 알아보고 베팅을 했습니다. 전면으로 모든 것을 계획하고, 병렬로 증거를 가져오며, 끝에 답을 작성합니다. 한 LLM 호출은 계획, N 도구는 증거를 요구합니다 (동렬이 될 수 있습니다), 한 LLM 호출은 해결합니다. 거래는 훨씬 더 나은 토큰 효율성과 명확한 실패 모드를 위해 덜 유연합니다.

## 개념

### 세 가지 역할

```
Planner:  user_question -> [plan_dag]
Workers:  [plan_dag]     -> [evidence]        (tool calls, possibly parallel)
Solver:   user_question, plan_dag, evidence -> final_answer
```

계획자는 DAG를 생성합니다. 각 노드는 도구, 그 주장 및 이전 노드들에 따라 달라집니다 (예:`#E1``#E2`3) 근로자들은 노드를 토폴로직 순서로 실행하고, 해상자는 모든 것을 꿰매고

### 왜 5배 더 적은 토큰이

ReAct은 단계 수와 함께 직선적으로 속속 길이를 증가시킵니다. 10 단계에서는 생각 1 더하기 행동 1 더하기 관찰 1 더하기 생각 2 더하기 행동 2 더하기 관찰 2 등을 포함합니다. 각 중간 단계에는 원래의 속속도 포함됩니다.

ReWOO는 한 개의 계획자 명령 (큰), N 개의 작은 작업자 명령 (모든 것은 도구 호출, 체인) 과 한 개의 해결자 명령 (솔버) 을 지불합니다. HotpotQA에서는 종이 5x 더 적은 토큰을 측정하고 +4 절대 정확성을 점수합니다.

### 왜 더 견고하게 지는지

ReAct에서 작업자 3이 실패하면 루프는 오류 중부에서 논의를 해야 합니다. ReWOO에서 작업자 3은 오류 문자열을 반환합니다. 해결기는 원래 계획과 맥락에서 그것을 볼 수 있으며 우아하게 degrad 할 수 있습니다. 실패 로컬화는 각 노드, 단계가 아닙니다.

### 플래너 디스틸레이션

논문의 두 번째 결과는: 계획자가 관찰을 보지 않기 때문에, 175B 교사로부터 계획자 출력에 대한 7B 모델을 미세하게 조정할 수 있습니다. 작은 모델은 계획 작업을 처리합니다. 추론에서 큰 모델이 필요하지 않습니다. 이것은 이제 표준입니다. 2026 년 많은 생산 에이전트가 작은 계획자와 큰 실행자를 사용하거나 반대로.

### 계획 및 실행 (2023)

랭체인 팀의 2023년 8월 게시물은 ReWOO를 패턴 이름: 계획 및 실행으로 일반화했습니다. 앞 기획자는 단계 목록을 발행하고, 실행자는 각 단계를 실행하며, 선택적 재계획자는 결과를 관찰한 후에 수정할 수 있습니다. 이것은 ReAct보다 더 가깝습니다.

### 계획 및 법률 (Erdogan et al., arXiv:2503.09572, ICML 2025)

플랜 앤 액트는 긴 지평선 웹 및 모바일 에이전트로 패턴을 확장합니다. 주요 기여는 합성 계획 데이터입니다. 라벨화된 궤도 생성기는 계획이 명시되어있는 훈련 데이터를 생성합니다. 단일 ReAct 궤도가 일관성을 잃는 웹 아레나와 같은 작업에서 3050 단계를 거쳐 계속 작동하는 계획 모델을 정렬하는 데 사용됩니다.

### 언제 선택해야 하는 것

| Pattern | When |
|---------|------|
| ReAct | Short tasks, unknown environment, need reactive exception handling |
| ReWOO | Structured tasks with known tools, token-sensitive, parallelizable evidence |
| Plan-and-Execute | Like ReWOO but with replanning after partial execution |
| Plan-and-Act | Long-horizon (>30 steps), web/mobile/computer-use |
| Tree of Thoughts | Search is worth paying for (Lesson 04) |

인트로피의 2024년 12월 지침: 가장 간단한 것부터 시작하세요. 작업이 하나의 도구 호출과 요약이 있다면 ReWOO를 만들지 마십시오. 작업이 40단계 연구 임무라면 ReAct을 혼자 하지 마십시오.

```figure
rewoo-plan
```

## 건설 해

`code/main.py`ReWOO 장난감을 구현합니다:

- `Planner` 스냅에서 계획 DAG를 발송하는 스크립트 정책
- `Worker` 각 노드의 도구 호출을 레지스트리를 통해 전송합니다.
- `Solver` 증거들을 읽고 최종 답을 내는 스크립트 구성
- 의존성 결의 `#E1`이전 노동자 생산량으로 대체됩니다.

데모는 "프랑스 수도의 인구는 몇 백만명으로 이루어져 있습니까?"라는 질문에 2단계 계획을 사용하여 대답합니다. (1) 수도를 찾아보고 (2) 인구를 찾아보고 해결합니다.

실행하세요:

```
python3 code/main.py
```

트레이스는 먼저 전체 계획을, 그리고 작업자 결과를, 그리고 용법 구성을 보여줍니다. 토큰 수를 비교하십시오 (우리는 대략적인 문자 수를 인쇄합니다) ReAct 스타일의 융합 실행에  ReWOO이 이러한 구조화된 작업에서 승리합니다.

## 사용 하 고

랭그라프는 레시피로 계획 및 실행 (`create_react_agent`ReAct에서는 계획 실행을 위한 사용자 지정 그래프를 사용합니다. CrewAI의 흐름은 패턴을 직접 암호화합니다. 당신은 작업을 전면으로 정의하고 Flow DAG가 실행합니다.

## 선박

`outputs/skill-rewoo-planner.md`도구 카탈로그를 제공하여 사용자 요청에서 ReWOO 계획 DAG를 생성합니다. 실행자에게 전달하기 전에 계획을 검증합니다.

## 운동

1. 독립적인 계획 노드에서 노동자를 실행하는 것을 병렬화하세요. 2개의 병렬 그룹이 있는 6 노드 DAG에서 무엇을 얻나요?
2. 어떤 작업자가 오류를 반환하면 실행되는 재계획 노드를 추가하십시오. ReWOO에 가장 작은 변경 사항은 무엇입니까?
3. 대체`Planner`작은 모델 (7B급) 과`Solver`한계 모델에 있어서. 종말에서 종말까지의 품질을 비교해 보세요.
4. 계획자 정유에 관한 ReWOO 논문의 4부 를 읽어 보십시오. 175B -> 7B 결과를 개념적으로 재현하세요.
5. 장난감을 계획과 행동의 궤도 모양으로 옮기십시오. 계획은 순서입니다. DAG가 아닙니다. 어떤 타협이 변화합니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ReWOO | "Reasoning without observations" | Plan, then fetch evidence in parallel, then solve — no observations in the planning prompt |
| Plan-and-Execute | "LangChain's plan-execute pattern" | ReWOO with an optional replanner node after execution |
| Plan-and-Act | "Scaled plan-execute" | Explicit planner/executor split with synthetic plan training data for long-horizon tasks |
| Evidence reference | "#E1, #E2, ..." | Plan-node placeholder substituted with prior worker output at dispatch time |
| Planner distillation | "Small planner, big executor" | Fine-tune a small model on planner traces from a large teacher |
| Token efficiency | "Fewer round trips" | 5x fewer tokens on HotpotQA vs ReAct in the paper |
| DAG executor | "Topological dispatcher" | Runs plan nodes in dependency order; parallel at each level |

## 더 많은 읽기

- [Xu et al., ReWOO: Decoupling Reasoning from Observations (arXiv:2305.18323)](https://arxiv.org/abs/2305.18323) 신성문
- [Erdogan et al., Plan-and-Act (arXiv:2503.09572)](https://arxiv.org/abs/2503.09572) 합성 계획과 함께 확장된 계획-집행자
- [LangGraph Plan-and-Execute tutorial](https://docs.langchain.com/oss/python/langgraph/overview) 기본 레시피
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 가장 간단한 패턴을 선택하여 작동합니다
