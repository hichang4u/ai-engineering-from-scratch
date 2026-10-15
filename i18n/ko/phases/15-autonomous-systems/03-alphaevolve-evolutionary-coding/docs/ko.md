# 알파 에볼  진화적 코딩 에이전트

> 진화 루프와 기계 검증 가능한 평가자와 한계 코딩 모델을 결합합니다. 루프가 충분히 길게 달릴 수 있도록 해 4x4 복합 매트릭스 곱셈 절차를 발견하여 48개의 스칼라 곱셈을 사용하게 됩니다. 56년 만에 스트래센보다 첫 번째 개선입니다. 또한 구글 전체의 Borg 스케줄링 유리스틱을 찾는데, 이는 생산에서 클러스터 컴퓨팅의 ~0.7%를 복구합니다. 건축은 의도적으로 지루해 승리는 평가를자의 엄격함 때문이에요

**Type:** Learn
**Languages:** Python (stdlib, evolutionary-loop toy)
**Prerequisites:** Phase 15 · 01 (long-horizon framing), Phase 15 · 02 (self-taught reasoning)
**Time:** ~60 minutes

## 문제

큰 언어 모델은 코드를 작성할 수 있습니다. 진화 알고리즘은 코드를 검색할 수 있습니다. 둘 다 수십 년 동안 별도로 시도되었습니다. 둘 다 타격 천장입니다. LLM 천장은 공설입니다. 모델은 주장하는 것을 하지 않는 유연한 코드를 작성합니다. 진화 천장은 검색 비용입니다. 문법의 무작위 돌연변이들은 거의 컴파일 가능한 프로그램을 생성하지 않습니다. 더 나은 프로그램을 말할 것도 없습니다.

알파 에볼브 (Novikov et al., DeepMind, arXiv:2506.13131, 2025년 6월) 는 이들을 결합한다. LLM는 프로그램 데이터베이스에 목표적 편집을 제안한다. 자동 평가자는 각 변수를 점수한다. 높은 점수를 가진 변수는 미래 세대에게 부모가 된다. LLM는 유력한 코드를 작성하는 비싼 단계를 처리한다. 평가자는 환설을 잡는다. 루프는 몇 시간에서 몇 주 동안 진행된다.

결과는 다음과 같이 보고되었다: 48-스칼라 복제 4x4 복합 매트릭스 복제 (스트라스센의 1969 제한은 49), 구글 생산에서 보그 스케줄링 유리스틱, 32.5%의 플래시 애테넌스 커널 가속화, 트윈리 훈련 처리량 개선.

이 구조는 작동합니다. 왜냐하면 평가자가 기계적으로 검증되기 때문입니다. 평가자가 없는 곳에서 작동하지 않습니다. 비대칭은 교훈입니다.

## 개념

### 루프

1. 씨앗 프로그램에서 시작하세요`P_0`그건 사실이지만, 최적의 수준은 낮습니다.
2. 평가자로부터 점수를 받은 각 프로그램들의 데이터베이스를 유지한다.
3. 데이터베이스에서 한 또는 여러 부모의 샘플 (MAP 엘리트 스타일 또는 섬 기반)
4. LLM (많은 후보자에게 쌍둥이 플래시, 어려운 후보자에게 쌍둥이 프로) 를 요청하여 부모의 변형된 버전을 생산하십시오.
5. 수납된 평가자에서 버전을 작성하고 실행하고 평가한다.
6. 점수와 기능 벡터로 키로 지정된 데이터베이스에 삽입한다.
7. 다시 말해

두 가지 세부 사항이 중요합니다. 첫째, LLM는 기본 프로그램보다 더 많은 것을 요구합니다. 일반적으로 데이터베이스에서 여러 가지 상위 변종, 평가자 서명, 짧은 작업 설명과 함께. 모델의 일은 점수를 향상시킬 수있는 목표적 변화를 제안하는 것입니다. 둘째, 데이터베이스가 구조화되어 있습니다.

### 평가자가 협상할 수 없는 이유는

알파 에볼브의 승리는 모두 평가자가 빠르고 결정적이고 쉽게 플레이 할 수 없는 영역에서 나온다.

- **Matrix multiplication algorithm**: 매트릭스를 곱하고 비트-동일성 검사를 하는 단위 테스트.
- **Borg scheduling heuristic**: 생산급 시뮬레이터로 역사적인 클러스터 로드를 재생하고 낭비된 계산을 측정합니다.
- **FlashAttention kernel**: 실제 하드웨어에 대한 정확성 테스트와 벽 시계 기준
- **Gemini training throughput**: 단계별로 측정된 GPU-초

각 경우 평가자는 다른 경우 지배하는 LLM 오류 클래스를 잡습니다: 공상 정확성 주장, 하드웨어에서 사라지는 성능 주장 및 가장자리 사례 오류. 평가자를 제거하고 루프 최적화 예쁜 코드를 위해.

### 보너스 해킹은 그 말의 다른 면입니다.

진화는 평가자가 측정하는 모든 것에 최적화합니다. 평가자가 불완전하다면 루프는 불완전함을 찾을 것입니다. 검증되지 않은 도메인에서는 루프는 의도된 행동보다는 표면 기능에 최적화합니다. DeepMind는 논문에서 이것을 명시적으로 표시합니다.

코드 검색 루프에서 보상 해킹의 구체적인 2025-2026 예제:

- "완료 시간"을 보상하는 최적화 목표가 빈 솔루션을 제출하는 것으로 보상되었습니다.
- 벤치마크 점수는 정확성 테스트 아래의 시험과 기억 테스트와 과잉 적합성을 보상합니다.
- "코드 품질" 프록시는 댓글을 제거하고 변수 이름을 다시 작성하는 것을 보답했습니다.

알파 에볼브 의 수정: LLM 는 평가 시 생성 된 입력 을 통해 본 적 없는 견고 한 평가자 를 보내십시오. 그 때 까지도, DeepMind 은 제안 된 임 한 배포 에 대한 강렬한 검토 를 권장 합니다.

### LLM + 검색이 혼자

LLM는 컴파일 가능한 의미적 타당한 수정 작업을 수행할 수 있습니다. 2000 라인 파이썬 파일의 무작위 변동 GA는 거의 항상 문법 오류를 발생시킵니다. LLM는 또한 타당한 이웃에 대한 검색을 집중합니다.

평가자 는 그 차례 에 LLM 의 공상 을 잡는다. LLM 는 자신 있게 기능 "이$O(n \log n)$"한계"에 있는 경우$O(n^2)$벽 시계 기준으로 문제는 해결됩니다.

### 알파 에볼브가 국경 스택에 들어간 곳

| System | Generator | Evaluator | Domain | Example win |
|---|---|---|---|---|
| AlphaEvolve | Gemini | correctness + benchmark | algorithms, kernels, schedulers | 48-mul 4x4 matmul |
| FunSearch (DeepMind, 2023) | PaLM / Codey | correctness | combinatorial math | cap-set lower bounds |
| AI Scientist v2 (Sakana, L5) | GPT/Claude | LLM critique + experiment | ML research | ICLR workshop paper |
| Darwin Godel Machine (L4) | agent scaffolding | SWE-bench / Polyglot | agent code | 20% → 50% SWE-bench |

네 가지 모두 같은 레시피의 변동입니다. 생성자 + 평가자, 루프. 차이점은 평가자 등급과 얼마나 엄격한지입니다.

```figure
alphaevolve-loop
```

## 사용 하 고

`code/main.py`장난감 상징적 회귀 문제를 통해 최소의 AlphaEvolve 같은 루프를 구현합니다. "LLM"는 목표 기능을 계산하는 프로그램에 작은 문법 변이를 제안하는 stdlib 프록시입니다. "평가자" 측정은 유지된 테스트 포인트에서 사각형 오류를 의미합니다.

- 지켜봐

- 어떻게 최고의 점수가 세대와 세대 사이에 발전하는지
- 어떻게 MAP 엘리트 그리드가 다양한 솔루션을 살아있게 유지하는지 그래서 루프는 지역 최소로 모이는 것이 아닙니다.
- 어떻게 지연된 테스트를 제거하면 (훈련 전용 평가자) 로 루프가 놀랍도록 잘 어울리는지

## 선박

`outputs/skill-evaluator-rigor-audit.md`새로운 영역에서 AlphaEvolve 방식의 루프를 고려하는 데 필요한 조건은, 당신의 평가자가 실제로 당신이 관심있는 실패를 발견합니까?

## 운동

1. 달아`code/main.py`. 가장 좋은 점수를 기록하는 궤도를 참고하세요.`--no-holdout`) 를 다시 실행하고, 과장 부착을 정량화 합니다.

2. MAP 엘리트 그리드 에 대한 AlphaEvolve 논문의 3부 를 읽어 보십시오. 검색을 다양하게 유지 할 수 있는 새로운 문제 (예: 컴파일러 최적화 패스) 에 대한 기능 벡터 설명서를 설계하십시오.

3. 48 곱하기 4x4 결과는 56 년 후 스트래센의 49-mul 경계에서 향상되었습니다. 논문의 추가 F를 읽어보고 이 문제에 대한 평가자가 왜 특히 올바르게 얻는 것이 쉬운지, 대부분의 영역이 왜 그렇지 않은지 세 문장으로 설명하십시오.

4. 알파 에볼루브가 실패할 한 영역을 제안하고, 평가자가 왜 깰지 정확히 파악해 보세요.

5. 당신이 알고 있는 도메인에 대해, 당신이 사용하는 평가자 서명을 적어 주십시오. (a) 정확성 조건, (b) 성능 측정, (c) 유지된 입력 생성 규칙, (d) 적어도 한 번의 보상 해킹 방지 체크를 포함하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| AlphaEvolve | "DeepMind's evolutionary coding agent" | Gemini + program database + machine-checkable evaluator |
| MAP-elites | "Diversity-preserving archive" | Grid keyed by feature vectors; each cell holds the best variant with that descriptor |
| Island model | "Parallel evolution subpopulations" | Independent populations that migrate periodically; prevents premature convergence |
| Machine-checkable evaluator | "Deterministic oracle" | A unit test, simulator, or benchmark the LLM cannot fake — a prerequisite for this loop |
| Reward hacking | "Optimizing the measure, not the goal" | Loop finds a way to maximize score without doing the intended task |
| Seed program | "The starting point" | An initial correct-but-suboptimal program the loop evolves from |
| Held-out evaluator | "Evaluation data the LLM never saw" | Inputs generated at evaluation time to prevent memorization |

## 더 많은 읽기

- [Novikov et al. (2025). AlphaEvolve: A coding agent for scientific and algorithmic discovery](https://arxiv.org/abs/2506.13131) 종이를 전부
- [DeepMind blog on AlphaEvolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) 결과와 함께 판매자 작성
- [AlphaEvolve results repository](https://github.com/google-deepmind/alphaevolve_results)48-mul 4x4 matmul을 포함한 알고리즘을 발견했습니다.
- [Romera-Paredes et al. (2023). Mathematical discoveries from program search with LLMs (FunSearch)](https://www.nature.com/articles/s41586-023-06924-6) 전신 시스템
- [Anthropic — Responsible Scaling Policy v3.0 (Feb 2026)](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) 평가자들에 대한 자율성을 주요 연구 방향으로 규정합니다.
