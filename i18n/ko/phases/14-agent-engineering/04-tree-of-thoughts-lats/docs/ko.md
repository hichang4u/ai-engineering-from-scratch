# 생각 과 행동 의 나무: 고의적 인 검색

> 단일 사슬의 사고 궤도는 뒤로 갈 수 있는 여지가 없습니다. ToT (Yao et al., 2023) 는 각 노드에서 자평을 하는 나무로 추론을 전환합니다. LATS (Zhou et al., 2024) 는 몬테카를로 트리 검색에 따라 ToT와 ReAct 및 Reflexion를 통합합니다. 24의 게임은 4% (CoT) 에서 74% (ToT) 에 이르고 있습니다. LATS는 HumanEval에서 92.7%를 통과합니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 03 (Reflexion)
**Time:** ~75 minutes

## 학습 목표

- 프레임 추론은 검색: 노드는 "이념", 가장자리는 "확장", 가치는 "어떻게 유망하다".
- 자기 평가 점수를 가진 stdlib ToT 스타일의 BFS 트리 검색을 구현하십시오.
- 선택/확대/시뮬레이션/ 뒤로 퍼지는 장난감 LATS MCTS 루프로 확장한다.
- 검색이 토큰 곱셈을 가치있게 할 때 결정 (24의 게임, 코드 생성) 그리고 단일 궤도가 충분할 때 (단순한 질문과 답변)

## 문제

사상 연쇄는 선형적인 걸음이다. 첫 번째 단계는 잘못되면, 다음 단계마다 잘못된 전제로 작동한다. 24의 게임에서 (+ − × ÷와 4 자릿수를 사용하여 24을 만들) GPT-4 CoT는 4%의 정확성을 달성한다. 모델은 잘못된 서브 익스프레션을 일찍 선택하고 복구할 수 없습니다.

이 논리 는 여러 가지 후보 를 제안 하고 평가 하고, 유망 한 후보 를 선택 하고, 무사지 에 도달 할 때 뒤돌아가는 능력 을 필요로 한다. 그것 은 검색 이다. 생각 나무 와 LATS 는 두 가지 정통 의 공식 이다.

## 개념

### 생각의 나무 (Yao et al., NeurIPS 2023)

각 노드는 일관된 중간 단계 ("이념") 이다. 각 노드는 K 아동 생각으로 확장 할 수 있습니다. LLM는 각 노드를 점수 명령으로 자평합니다. 검색은 나무를 탐구합니다.

```
                     (root: "find 24 from 4 6 4 1")
                    /               |            \
           ("6 - 4 = 2")    ("4 + 1 = 5")    ("4 * 6 = 24")  <- Score: HIGH
              /   \              |                  |
          ...    ...          ...                finish
```

자기 평가는 부담스러운 부분입니다. 논문은 세 가지 변형을 보여줍니다:`sure / likely / impossible`분류`1..10`3개 모두 CoT를 크게 제치고 24의 경기 (4% -> 74% GPT-4)

### LATS (Zhou et al., ICML 2024)

LATS는 MCTS에 ToT, ReAct, Reflexion를 통합합니다. LLM는 세 가지 역할을 수행합니다.

- **Policy**: 후보가 다음 행동을 제안 (ReAct 스타일)
- **Value function**: 부분적인 궤도를 점수 (ToT 스타일의 자기 평가)
- **Self-reflector**: 실패에 대해 자연어 반영 (Reflexion-style) 을 작성하고 미래의 롤러를 재검토하는 데 사용하십시오.

환경 피드백 (시측) 은 값 함수에 혼합되어서 검색은 실제 도구 결과로 정보화되며, 단순히 모델 의견에 의해 이루어집니다. 논문 시간에 결과: HumanEval pass@1 92.7% GPT-4 (SOTA) 와 함께, WebShop 평균 75.9 GPT-3.5 (그라디언트 기반의 미세 조정) 와 함께.

### MCTS, 최소

반복당 4단계:

1. **Select** UCT (나무에 대한 상위 신뢰) 를 사용하여 뿌리부터 잎까지 걷는 것.
2. **Expand** 정책으로 K 자녀를 낳습니다.
3. **Simulate** 정책을 이용한 아동으로부터 발급, 값 함수 (또는 환경 보상) 로의 잎을 점수하십시오.
4. **Backpropagate** 방문의 개수 및 가치 추정치를 업데이트합니다.

UCT 공식: `Q(s, a) + c * sqrt(ln N(s) / N(s, a))`첫 번째 용어는 착취, 두 번째 용어는 탐구.`c`각 작업에 따라

### 비용 실적

검색은 토큰을 폭발시킵니다. ToT on Game of 24는 CoT의 토큰의 1001000배를 사용합니다. LATS는 비슷합니다. 이것은 무료가 아닙니다.

- 단일 궤도가 입증될 정도로 충분하지 않은 작업 (24의 게임, 복합 코드).
- 벽 시계가 정확성에 비해 덜 중요해 하는 작업입니다.
- 값 값이 저렴하고 신뢰할 수 있는 함수 (코드에 대한 단위 테스트, 수학에 대한 명시적인 목표) 를 가진 작업

만약 당신의 작업에 딱 한 가지 올바른 답과 잡음있는 평가자가 있다면 검색은 종종 상황을 더 악화시킵니다.

### 2026 위치

대부분의 생산 에이전트는 LATS를 실행하지 않습니다. 그들은 도구 기반 검증 (CRITIC, Lesson 05) 을 통해 ReAct을 실행합니다.

- 값 함수로서 테스트를 실행하는 코딩 에이전트 (HumanEval 스타일)
- 여러 검색 경로를 탐구하는 심층 연구 요원
- 랭그라프 서브그래프 내부에서 계획 중인 작업 흐름

알파 에볼브 (강좌 11) 는 2025년 극단: 코드에 대한 진화적 검색, 기계 검증 가능한 적합성, 국경적인 이득 (56년 만에 첫 4×4 매트무얼 개선)

```figure
tree-of-thoughts
```

## 건설 해

`code/main.py`이 도구는

- 소규모 TOT BFS가 스타일링된 "선택 수학적 작전" 작업에 있습니다.
- UCT 선택과 같은 작업 (Select / Expand / Simulate / Backpropagate) 에 대한 장난감 LATS MCTS 루프.
- 상징적인 점수를 더하여 자기 평정 점수를 구성하는 값 함수

실행하세요:

```
python3 code/main.py
```

추적은 ToT가 BFS와 노드당 3 개의 후보자를 확장하는 것을 보여줍니다. MCTS를 통해 가장 좋은 로롤에 LATS가 합병하는 것과 비교하면. 두 개에 대한 토큰 카운트는 인쇄됩니다.

## 사용 하 고

랭그그래프는 ToT 스타일의 탐색을 서브그래프 패턴으로 배포하고 있습니다. 랭그체인 팀의 LATS (2024년 5월) 에 대한 블로그는 참고 교과서입니다. 람마인덱스는 `TreeOfThoughts`2026년 대부분의 생산 에이전트들에서는 이 패턴이`if task_complexity > threshold: use_search()`gate  참조 평가자-최시화 패턴을 수업 05.

## 선박

`outputs/skill-search-policy.md`작업 형태, 예산 및 평가자의 충실성을 고려하여 선형 ReAct, ToT, LATS 및 진화 검색 사이에서 선택합니다.

## 운동

1. 장난감 LATS를 UCT c=0.1 vs c=2.0로 실행하세요.
2. 음향의 값 함수를 더 큰 점수로 바꾸어 놓는다. MCTS는 여전히 가장 좋은 페이지를 찾는가?
3. 빔 검색 ToT (모든 레벨에서 톱-k) 를 구현하고 BFS와 비교하십시오.
4. LATS 섹션 5.1을 읽어 보세요. HumanEval 궤도 수를 재현하세요. 보고된 pass@1에 도달하기 위해 얼마나 많은 배포가 필요합니다?
5. LATS 논문에서 "LATS이 덜 도움이 되는 때"에 대한 토론을 읽어보십시오. 검색 전략에 대한 작업 형태를 지도하는 1항 결정 규칙을 작성하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Tree of Thoughts | "Branching CoT" | Yao et al. — tree of thought nodes with self-evaluation |
| LATS | "MCTS for LLMs" | Zhou et al. — unifies ToT + ReAct + Reflexion under MCTS |
| UCT | "Upper confidence bound" | Select formula balancing exploitation (Q) and exploration (ln N / n) |
| Value function | "How good is this state" | Prompted LLM score or environment reward; feeds backprop |
| Policy | "Action proposer" | ReAct-style generator; emits candidate next thoughts/actions |
| Rollout | "Simulated trajectory" | Walk from a node to a leaf using policy, score with value |
| Backpropagate | "Update ancestors" | Push the leaf's reward up the path, updating visit counts and Q |
| Search cost | "Token explosion" | 100-1000x CoT on Game of 24; budget before you adopt |

## 더 많은 읽기

- [Yao et al., Tree of Thoughts (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601) 신성문
- [Zhou et al., LATS (arXiv:2310.04406)](https://arxiv.org/abs/2310.04406) 반사 피드백을 가진 MCTS
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) 검색을 위한 서브그래프 패턴
- [AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) 프로그램 평가자 들 이 이용 하는 진화적 검색
