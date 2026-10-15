# 다중 대리자 토론 및 협업

> Du et al. (ICML 2024, "마음의 사회") 는 독립적으로 답을 제안하고, R 라운드에서 서로 반복적으로 비판하는 N 모델 인스턴스를 실행합니다. 사실성, 규칙 따름, 추론을 향상시킵니다. 스파스 토폴로지는 토큰 비용에 대한 완전한 매시를 때립니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12 (Workflow Patterns), Phase 14 · 05 (Self-Refine and CRITIC)
**Time:** ~60 minutes

## 학습 목표

- 토론 프로토콜을 설명하라: N 제안자, R 라운드, 공유된 답변에 합쳐진다.
- 논쟁 이 사실 을 더 잘 알려주고 규칙 을 따르고 논의를 더 잘 하는 이유 는 무엇 입니까?
- 희귀한 토폴로지를 설명해 주세요. 모든 토론자가 서로를 볼 필요가 없습니다.
- 전체 매시 및 희귀 변종을 가진 스크립트 된 LLM에 대한 STDlib 논쟁을 구현하십시오; 토큰 비용과 정확성을 측정하십시오.

## 문제

자기 정제 (Lesson 05) 는 자신을 비판하는 한 모델이다.  위험 집단 사고. CRITIC (Lesson 05) 는 외부 도구에서 비판을 근거로 한다.

## 개념

### 정신의 사회 (Du et al., ICML 2024)

- N 모델 인스턴스는 독립적으로 동일한 질문에 대한 답을 제안합니다.
- R 라운드에서, 각 모델은 다른 모델의 제안을 읽고 비판합니다.
- 모델들은 비판에 따라 답변을 업데이트합니다.
- R 라운드 후, 합동 답을 반환하십시오.

원래 실험은 비용으로 N=3, R=2를 사용하였다. 더 많은 에이전트와 더 많은 라운드 (MMLU, GSM8K, 체스 이동 유효성, 생리 생성) 에 대한 정확도가 향상됩니다.

크로스 모델 조합은 단일 모델 토론을 이길 수 있습니다.

### 스파스 토폴로지

"Sparse 커뮤니케이션 토폴로지와 함께 다중 에이전트 토론을 개선하는 것" (arXiv:2406.11776, 2024-2025) 은 풀메시 토론이 항상 최적의 것은 아니라는 것을 보여주었습니다. 스파스 토폴로지 (별, 반지, 허브 및 스팟) 는 낮은 토큰 비용으로 정확성을 일치시킬 수 있습니다. 모든 토론자는 동료의 하위 집합만을 볼 수 있습니다.

그 영향은

- 전체 매시 N=5, R=3 = 5 × 3 = 15개의 제안, 각 4개의 동료 = 60개의 비판적 작전.
- 별 N=5, R=3 (하나의 허브 + 4 스팟) = 15개의 제안, 스팟은 허브만 읽는다 = 12개의 비판 작전.

### 토론이 도움이 되는 경우

- **Factuality.**독립적인 제안에 따라, 횡단검사는 환각을 줄입니다.
- **Rule-following.**체스 움직임 유효성 1 모델이 규칙을 놓치고 다른 모델이 그것을 잡습니다.
- **Open-ended reasoning.**여러 프레임이 올바른 답을 좁히고 있습니다.

### 논쟁이 고통스러워할 때

- **Latency-sensitive UX.**N × R 순차차 로운드는 당신이 가질 수 없는 지연입니다.
- **Cost-sensitive scale.**질문마다 N × R 토큰
- **Simple factual lookups.**한 번 검색하면 5번 토론보다 저렴합니다.

### 2026 실무적 인 사례

- **Anthropic orchestrator-workers**(강좌 12)  합성 단계로 토론의 한 가지 변형.
- **LangGraph supervisor**(강좌 13)  중앙 라우터 + 전문 에이전트는 논의를 노드로 구현할 수 있습니다.
- **OpenAI Agents SDK**(강좌 16)  요원들은 반복적인 비판을 위해 앞으로 돌아다니다.
- **Multi-agent evals** 쌍 토론 + 평가 신호에 대한 평가자 최적화

### 이 패턴이 잘못되는 곳

- **Convergence collapse.**모든 요원들은 첫 번째 잘못된 답변에 합쳐야 합니다.
- **Hub failure.**별 대상학에서 나쁜 허브는 모든 사람을 손상시킵니다
- **Prompt homogenization.**모든 에이전트는 동일한 명령어를 사용하며 동일한 답변을 제공합니다. 다양한 명령어 및/또는 모델을 사용합니다.

```figure
debate-converge
```

## 건설 해

`code/main.py`STDlib 토론을 실시합니다.

- `Debater`클래스 (매 토론자 의견 유도와 함께 스크립트 된 LLM).
- `FullMeshDebate`그리고`SparseDebate`달리는 사람들
- 세 가지 질문: 사실적인 질문, 규칙에 근거한 질문, 논리적인 질문
- 측정: 합동 응답, 합동으로 순환, 전체 비판 작전

실행하세요:

```
python3 code/main.py
```

출력: 프로토콜별 정확성과 비용; 적은 비용으로 2/3 질문에 대한 완전한 매치.

## 사용 하 고

- **Anthropic orchestrator-workers**간단한 2-3명의 노동자 토론을 위해
- **LangGraph**검찰을 통해 국가적인 다차례 토론을 위해
- **Custom**연구나 전문적인 정확성 보증에 관한

## 선박

`outputs/skill-debate.md`N, R, 그리고 컨버전스 규칙으로 구성 가능한 토폴로지와 함께 다중 에이전트 토론을 구성합니다.

## 운동

1. "강제적 의견 충돌" 규칙을 시행: 1차에서는 모든 토론자가 개별적인 제안을 제시해야 합니다.
2. 신뢰에 의해 중량된 집합을 추가하십시오: 토론자들은 반환 (응답, 신뢰); 집합자 무게는 신뢰에 의해.
3. 다른 의견과 다른 스크립트 된 LLM에 한 "대리인"을 교환하십시오. 이질성은 정확성을 향상합니까?
4. 전체 매시와 희소성 대의 토큰 비용을 3가지 질문에서 측정하세요.
5. Society of Minds의 논문을 읽어보세요. 장난감을 N=5, R=3로 옮기세요. 무엇이 깨고, 무엇이 더 좋아질까요?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Debate | "Multi-agent critique" | N proposers, R rounds of cross-critique, converge |
| Full mesh | "Everyone reads everyone" | Every debater reads every peer each round |
| Sparse topology | "Limited peer view" | Debaters read only a subset of peers |
| Hub-and-spoke | "Star topology" | One central debater, N-1 spokes read only the hub |
| Convergence | "Agreement" | Debaters converge on a shared answer |
| Society of Minds | "Du et al. debate paper" | ICML 2024 multi-agent debate method |

## 더 많은 읽기

- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) 복합 요원 토론
- [Sparse Communication Topology (arXiv:2406.11776)](https://arxiv.org/abs/2406.11776) 희귀한 토폴로지 결과
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 토론의 변종으로서 오케스트레이터-노동자
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) 단일 모델 자평적 대조
