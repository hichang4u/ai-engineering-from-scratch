# 캡스톤 05  자율 연구원 (AI 과학자 클래스)

> 사카나의 AI-Scientist-v2는 전체 논문을 발표했습니다. 실험실 요원이 실험을 했습니다. 앨런 AI는 흔적을 공유했습니다. 2026 형태는 실험에 대한 계획 실행 확인 트리 검색, 예산 비용, 샌드박스 코드 실행, 비전 피드백 LaTeX 작가, 그리고 자동화된 NeurIPS 스타일 리뷰어 집합입니다. 마지막 목표는 하나를 만들고, 종이에 30달러를 내면 끝으로 실행하고, 사카나가 기록한 모래 상자 탈출 적색 팀에서 살아남는 것입니다.

**Type:** Capstone
**Languages:** Python (agent + sandbox), LaTeX (output)
**Prerequisites:** Phase 2 (ML), Phase 3 (deep learning), Phase 7 (transformers), Phase 10 (LLMs from scratch), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 18 (safety)
**Phases exercised:**P0 · P2 · P3 · P7 · P10 · P14 · P15 · P16 · P18
**Time:** 40 hours

## 문제

자율적인 연구 기관은 2026년에 한계점을 넘었습니다. 사카나 AI의 AI-과학자-v2는 Nature에서 발표되었으며, 작업실 동료 검토를 승인한 논문으로 생성되었습니다. 신카에볼브 (ICLR 2026) 는 진화 가설에 대한 경계를 확장했습니다. AMD의 에이전트 연구소는 재생 가능한 흔적을 보냈습니다. 에이전트는 마법이 아닙니다. 그들은 후보 실험의 나무를 가로지르는 계획 실행 확인 루프입니다. 비용 제한, 씨앗 묶인 모래 상자 및 자동 검토. 배는 아나운서, 예산, 안전사고

좁은 영역에서 씨앗 아이디어에 대한 하나의 실행을 통해 루프를 배우게 됩니다 (예를 들어, 100M 파라미터 트랜스포머에서 주의-거미성 압축). 첫 번째 시도에서 새로운 것을 발견하는 것이 가치가 없습니다. 그 가치는 인프라에 있습니다. 나무 검색, 실험 모래 상자, 작가-평론자 루프, 적색 팀 보고서. 사카나 팀에서 샌드박스 탈출 실패가 기록됐고, 당신의 에이전트는 같은 빨간 팀과 함께 통과해야 합니다.

## 개념

에이전트는 가장 먼저 나무를 찾아가야 합니다. 노드는 실험의 사양입니다: (하이포테시스, 구성, 코드, 예상 결과). 확장 단계는 어린이를 작은 수정 (스wap 최적화, 배트 크기를 변경, 구성 요소를 압축) 으로 제안합니다. 모든 아이들은 새 모래 상자에 달려가며 결과는 노드를 순위화하는 점수 함수로 돌아갑니다 (신작 × 품질 × 남은 예산). 나무는 예산이 다치기 전까지 자라서 가장 좋은 가지가 잘라집니다.

작가는 다중형입니다. 라텍스 드래프트를 생성하고 컴파일하고, 인수를 렌더링하고, 렌더링 된 PDF를 클로드 오퍼스 4.7의 비전 모드로 제공하여 레이아웃, 인물의 읽기 능력 및 주장 증거 조화를 비판합니다. 5명의 LLM 판사들로 구성된 심사위원들은 NeurIPS 스타일의 점수를 (신기성, 엄격성, 명확성, 재생 가능성, 영향력) 내놓는다. 평균이 문턱 아래로 떨어지면 논문은 비판으로 작가에게 돌아온다.

안전은 부담이 크다. 모든 실험은 E2B 또는 데이토나 샌드박스에서 네트워크 출구, 제한된 벽 시계 및 고정된 자원 제한 없이 실행됩니다. 에이전트의 코드 생성 단계는 샌드박스에서 탈출하는 시스템 호출을 차단하는 정책 계층을 통과합니다. 적색 팀 보고서는 사카나 문서화된 공격 표면을 재생합니다.

## 건축

```
seed idea + domain
      |
      v
  literature search (Semantic Scholar + OpenAlex + FAISS cache)
      |
      v
  LangGraph plan-execute-verify tree
      |
      v
  +--- expand node ----+      per-node sandbox
  |                    |      (E2B / Daytona)
  v                    v      resource caps
  child_1           child_k   no network egress
  |                    |      deterministic seeds
  v                    v
  run experiment       run experiment
  |                    |
  v                    v
  score nodes by (novelty, quality, budget)
      |
      v
  best branch -> LaTeX writer
      |
      v
  compile + vision critique (Opus 4.7 vision)
      |
      v
  reviewer ensemble (5 LLM judges, NeurIPS rubric)
      |
      v
  paper.pdf + review.md + trace.json
```

## 

- 오케스트레이션: 체크포인팅 및 인력 승인 게이트를 가진 랭그그래프
- 나무 검색: 사용자 지정 베스트-퍼스트 실험 노드 (사카나 v2에서 AB-MCTS 스타일)
- 샌드박스: 실험당 E2B, Docker-in-Docker 역전; c그룹을 통해 자원 제한
- 문학: 의미학 학자 그래프 API + OpenAlex + 지역 FAISS 캐시 추석
- 작가는: 라테크스 템플릿 + 클로드 오퍼스 4.7 (비전 모드)
- 심사위원: 5명의 심사위원 (Opus 4.7, GPT-5.4, Gemini 3 Pro, DeepSeek R1, Qwen3-Max) 과 중량 합
- 실험 프레임워크: 물리 실험에 PyTorch 2.5, 나무를 채취하기 위한 W&B
- 관찰 가능: 에이전트 추적용 랭푸스, 종이 한 종이에 30달러의 예산

```figure
ce-experiment-tree
```

## 건설 해

1. **Seed and domain scoping.**시어 아이디어 (예를 들어, "sub-1B 트랜스포머의 관심 지도에서 소소한 패턴을 조사") 를 취해 검색 공간을 정의하십시오. 모델, 데이터 세트, 컴퓨팅 예산.

2. **Literature pass.**가장 많이 인용된 관련 논문 50개에 대한 수요 세맨틱 스콜러 + 오픈알렉스; 지역적으로 캐시 추석을; 1 페이지의 도메인 소재를 생성합니다.

3. **Tree scaffolding.**뿌리를 씨앗 가설으로 초기화하십시오. 실행`expand(node) -> children`작은 편집 제안 (아동당 한 개 구성 변경) 을 실시합니다.`score(node)`중량 신기 × 품질 × 예산 기간

4. **Sandbox wrapping.**모든 실험이 실행됩니다`docker run --network=none --memory=8g --cpus=2 --pids-limit=256 --read-only`(또는 동등한 E2B 정책) 씨앗은 모래 상자에 기록되며 출력량은 읽기 전용으로 배워집니다.

5. **Plan-execute-verify loop.** `plan`아이들을 제안합니다.`execute`모래 상자를 실행하고, 기록과 측정값을 캡처합니다.`verify`미트릭을 단위 검사 (손실 감소 했습니까? 압축이 효과를 고립 했습니까?)

6. **Writer.**예산 후 가장 좋은 분자를 선택하세요. matplotlib를 사용하여 숫자를 렌더링하세요. 맥락에서 분자 추적을 가진 클로드 오퍼스 4.7를 통해 라텍스 초안을 생성하세요. 컴파일하세요. 컴파일된 PDF를 비판을 위해 오퍼스 4.7 비전에 다시 공급하세요. 반복하세요.

7. **Reviewer ensemble.**5명의 판사는 NeurIPS 스타일의 라브리크 (신기, 엄격함, 명확함, 재생 가능성, 영향력) 를 사용하여 드래프트 점수를 얻습니다. 평균 <4.0/5, 비판으로 작성자에게 돌아갑니다. 3번의 재편 후 하드 스톱.

8. **Red team.**모래 상자를 겨냥한 적대적 작업의 집합을 구축하거나 통합하십시오. 포크 폭탄, 네트워크 해출 시도, 파일 시스템 탈출, LLM 작성 된 껍데기 메타 캐릭터. 모두 차단되었음을 확인합니다. 결과를 작성하십시오.

9. **Reproducibility.**모든 종이 배포는 나무 검색 추적 JSON, 씨앗, W&B 실행 링크, 모래 상자 구성, 그리고 끝에서 끝으로 재생 README.

## 사용 하 고

```
$ ai-scientist run --seed "attention sparsity in sub-1B transformers" --budget 30
[lit]    50 papers, digest in 12s
[tree]   expanded 8 nodes, budget 12/30
[exec]   node #3 sparsity=top-8, loss=2.83 (best so far)
[exec]   node #6 sparsity=top-4, loss=3.12 (worse)
[exec]   ...
[tree]   chose branch rooted at node #3 (novelty 0.62, quality 0.81)
[write]  LaTeX draft v1 complete
[vision] critique: figure 2 legend too small, claim-evidence ok
[write]  draft v2 after 3 edits
[review] mean 4.2/5 (novelty 3.9, rigor 4.3, clarity 4.1, repro 4.5, impact 4.2)
[done]   paper.pdf + review.md + trace.json     $28.40 spent
```

## 선박

`outputs/skill-ai-scientist.md`토양 아이디어 + 도메인 + 30달러 예산을 고려하면 전체 파이프라인을 실행하고 검토 가능한 논문을 더하여 재생가능성 팩트를 발행합니다.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Paper quality | Blind rubric review against published workshop papers |
| 20 | Experimental rigor | Baselines, seeds, ablations; every claim backed by a cell in the results table |
| 20 | Cost and compute discipline | $30/paper ceiling enforced, Langfuse-traced |
| 20 | Safety | Sandbox red team passes; network policy and kill-switch verified |
| 15 | Reproducibility | One-command rerun with identical seeds reproduces the paper |
| **100** | | |

## 운동

1. 같은 영역에 있는 세 가지 다른 씨앗 아이디어에 대한 파이프라인을 실행하세요. 나무 검색의 어떤 부분들이 겹치는지를 비교하세요. 복제된 낭비된 계산을 식별하세요.

2. 5달러 이상으로 추정되는 노드에 대해 실험 실행 전에 인체-이-loop 게이트를 추가하고 전체 비용의 감소량을 측정합니다.

3. 심사위원들을 한 판사로 바꾸고, 잘못된 수용률을 측정해

4. 네트워크 분출 적색 팀 테스트를 도입: 에이전트가 코드를 작성하여 `curl`외부 주소를 확인하세요`--network=none`정책은 차단하고, 시도를 기록해

5. 나무 검색을 평평한 무작위 기준 ( 같은 예산, 확장 전략) 과 비교해 보세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Tree search | "AB-MCTS-style expansion" | Best-first exploration over experiment nodes with a novelty×quality×budget score |
| Sandbox | "Experiment isolation" | Container with no network, bounded CPU/memory, pinned seeds, read-only inputs |
| Vision critique | "Render-then-read" | Compile the paper to PDF, feed the PDF back to a VLM for layout and claim-evidence critique |
| Reviewer ensemble | "Automated peer review" | Multiple LLM judges scoring the paper with a NeurIPS rubric; weighted aggregate gates the pipeline |
| Novelty score | "Is this new?" | Heuristic that penalizes proximity to the 50-paper literature cache |
| Cost ceiling | "$ budget" | Hard cap on total spend per paper; Langfuse counters + pre-run estimates |
| Red team | "Sandbox-escape audit" | Adversarial tasks that would escape the sandbox if the policy is wrong |

## 더 많은 읽기

- [Sakana AI-Scientist-v2 repository](https://github.com/SakanaAI/AI-Scientist-v2) 참조 생산 연구 기관
- [Sakana AI-Scientist-v1 paper (arXiv:2408.06292)](https://arxiv.org/abs/2408.06292) 원래 방법론
- [ShinkaEvolve (Sakana ICLR 2026)](https://sakana.ai) 진화적 확장
- [Agent Laboratory (AMD)](https://github.com/SamuelSchmidgall/AgentLaboratory) 다중 역할 연구 연구실의 틀
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) 참조 오케스트레이션 계층
- [Semantic Scholar Graph API](https://api.semanticscholar.org/) 문학 검색
- [E2B sandboxes](https://e2b.dev) 참조 실험 고립
- [NeurIPS reviewer guidelines](https://neurips.cc/Conferences/2026/ReviewerGuidelines) 심사위원들의 집합이 코딩하는 부문
