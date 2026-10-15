# 합의와 비잔틴의 행위자 결함 용납

> 클래식 분산 시스템 BFT는 스토카스틱 LLM를 충족합니다. 2025~2026 년 동안 세 가지 연구 방향이 등장했습니다.**CP-WBFT**(arXiv:2511.10400) 의 신뢰 조사에 의해 각 투표를 중계합니다.**DecentLLMs**(arXiv:2507.14928) 은 병렬 노동자 제안과 기하학적-중반 집합으로 리더가 없습니다.**WBFT**(arXiv:2505.05103) 는 중량 투표와 계층 구조 집합을 결합하여 코어와 엣지 노드를 나눕니다. "AI 에이전트들이 동의할 수 있을까?" (arXiv:2603.01213) 의 정직한 경험적 결과는 오늘날 스칼라 합의도 취약하다는 것입니다. BFT는 필요하지만 충분하지 않습니다. 이 수업은 최소한의 BFT 프로토콜을 구축하고, 세 가지 요인 특정 공격을 주입합니다 (비잔틴 거짓말, 사이코판틱 컴포넌스, 상관 오류 모노컬처), 그리고 각 합의 변종이 어떻게 대처하는지 측정합니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 07 (Society of Mind and Debate), Phase 16 · 13 (Shared Memory)
**Time:** ~75 minutes

## 문제

N LLM 에이전트가 각각 답을 만들어냅니다. 그들은 동의하지 않습니다. 대다수 투표는 두 에이전트가 상관관계가 있기 때문에 잘못된 하나를 선택합니다 ( 같은 기본 모델, 동일한 훈련 데이터, 동일한 실패 모드). 세 번째 에이전트는 새로운 방식으로 잘못됩니다. 그래서 대다수는 거짓 대다수입니다.

이제 속임수 요인을 추가해 보세요. 그것은 의도적으로 거짓말을 합니다. 또는 사이코판틱 요인은: 마지막 말을 한 사람과 동의합니다. 고전 BFT에서, 비잔틴 노드가 분자라는 가정입니다.`f < n/3`2026년 현실은 LLM 노드가 정직하더라도, 모형들 사이에 상관관계가 있고, 서로의 결과로부터 영향을 받는다는 것입니다.

고전 BFT (PBFT, 1999) 는 잘못되지 않습니다. 그것은 불완전합니다. 그것은 임의의 비트 플립을 처리합니다. 그것은 "이런 정직한 세 명의 에이전트가 훈련 데이터를 공유하기 때문에 환각을 공유합니다". "이 교훈은 PBFT의 기초와 세 개의 2025-2026 적응에 대한 계층을 기반으로합니다.

## 개념

### 클래식 BFT가 주는 것은

실제 비잔틴 결단 용납 (카스트로 & 리스코프, OSDI 1999)`f < n/3`비잔틴 노드: 프로토콜은 3 단계 (예조, 준비, 약속) 과 2 단계 (서명한 메시지, 쿼럼 인증서) 를 포함한다.`n >= 3f + 1`정직하거나 악성 노드

보증은 강하지만 다음과 같은 것을 가정합니다.

1. **Independent faults.**비잔틴은 협조하지 않습니다.
2. **Honest nodes are truly honest.**정직한 결과의 정확성은 문제가 아닙니다. 프로토콜은 의견이 분분하는 것을 조정합니다.
3. **The question has a ground-truth answer.**잘못된 사실에 대한 합의는 여전히 합의입니다.

LLM 에이전트는 세 가지 모두 위반합니다. 같은 기본 모델을 실행하는 두 에이전트는 결함을 공유합니다. "공정한" LLM는 여전히 환각합니다. 그리고 모호한 질문에 대해 "진리는" 에이전트가 결정하는 것입니다. 외부 오라클이 없습니다.

### 3개의 LLM 특수한 공격

**Byzantine lie.**한 대사는 의도적으로 잘못된 답을 내놓습니다.`f < n/3`- 그래

**Sycophantic conformity.**한 에이전트는 투표 전에 다른 사람들의 답변을 읽고 마지막으로 말한 사람과 일치합니다. 악성적이지는 않지만 가장 큰 목소리와 상관관계가 있습니다.

**Correlated-error monoculture.**세 명의 에이전트가 기본 모델을 공유하고, 똑같은 잘못된 답을 환각시키고, 대다수가 틀리고, 클래식 BFT는 도움이 되지 않습니다. 왜냐하면 세 사람이 모두 "공정한" 동의하기 때문입니다.

### 2025~2026년 응답

**CP-WBFT**(arXiv:2511.10400)  신뢰성 검증 중량 BFT. 각 유권자는 자신의 답변에 신뢰성 탐사를 붙인다 (자신보고된 확률 또는 별도의 캘리브레이션 모델의 예측). 투표 무게는 자신있게 스케일합니다. 완전한 그래프에서 +85.71%의 BFT 향상이 보고되었습니다. 완화: 사이코판틱 컴포넌스 (응하는 에이전트들은 자원봉사자 지위에 낮은 신뢰를 가지 tend).

**DecentLLMs**(arXiv:2507.14928)  리더리스. 노동자 에이전트는 병렬로 제안하고, 평가자 에이전트는 제안점을 점수하고, 최종 대답은 점수 된 위치의 기하학적 중반입니다.`f < n/2`. 완화: 비잔틴 거짓말 및 상관 오류 (수형 중위치는 비정상적 수준에 견고하고 밀집한 집합으로 끌어당기는 것이 아니라 모델 편향 평균)

**WBFT**(arXiv:2505.05103)  계층 구조 클러스터링을 가진 중량 BFT. 투표 무게는 응답 품질과 역사에서 배운 신뢰 점수를 기준으로 할당됩니다. 클러스터 에이전트들은 코어와 엣지로 구성됩니다. 코어 에이전트들은 먼저 합의에 도달해야 하며, 엣지 에이전트들은 다음으로 수행됩니다. 완화: 확장성 (코어 합의는 작고 빠르다) 그리고 부분적으로 단일 문화 (코어 다양성 때문에 선택 될 수 있습니다).

### 경험적: "AI 요원들이 동의할 수 있습니까?" (arXiv:2603.01213)

종이 는 여러 국경 모델 에서 스칼라 협정을 측정 한다 (LLM 에이전트 들 은 단일 수학적 값 을 합의 한다).

- 적대자 없이도 LLM 에이전트는 많은 기준에 따라 30% 이상의 비율로 스케일어 질문들에 대해 동의하지 않습니다.
- 사기적인 인격을 채택한 단일 에이전트는 정직한 기준에서 40+ 퍼센트 이상의 에이전트 혼합 합의점을 끌어낼 수 있습니다.
- 모형 다양성에 상관관계가 있는 분의 비율은  이질적인 집합은 균일한 집합보다 더 많은 분의 의견이 다르지만 (좋은: 상관관계가 없는 오류) 또한 느리게 이동한다 (악: 더 긴 합의 시간).

이 점: BFT는 출력들을 조정할 수 있는 기계를 제공하지만, 정렬된 출력들이 옳지 않은지 알려주지 않는다. 검증 (단계 16 · 08 역할 전문화), 다양성 (단계 16 · 15 토론 변종) 및 평가자 요인 (단계 16 · 24 벤치마크) 과 결합한다.

### 핵심 프로토콜, 벗겨

LLM 에이전트에게는 최소한의 BFT 라운드:

```
1. task arrives; each agent i produces answer a_i
2. each agent attaches confidence probe c_i in [0, 1]
3. aggregator collects (a_i, c_i) from all n agents
4. aggregator groups by semantic cluster (equivalent answers)
5. aggregator computes weight for each cluster C:
     w(C) = sum_{i in C} c_i
6. winner = cluster with max weight, if max > threshold * sum(c_i)
   else: retry or escalate
7. minority clusters logged with provenance for post-hoc audit
```

의미적 집합 단계 는 LLM 특수한 전환 이다. 두 가지 대답 "연구 보고 4.2%"와 "4.2% 개선"은 동일한 집합 이다. 순진한 문자열 평등 검사는 이것을 놓칠 것이다. 생산에서, 저렴한 임베디션 모델을 사용하거나 명시적 카논리화.

### 임계율 조정

`threshold`이 기호는 언제 받아들이고 언제 다시 시도해야 하는지 결정합니다. 너무 낮습니다. 당신은 약한 다수를 받아들이고 있습니다. 너무 높습니다. 당신은 아무것도 받아들이지 않습니다. 경험적 범위: 0.5-0.67`n=5-7`대리인, 더 큰 대리인`n`문턱 아래로, 인간이나 다른 요원 집단으로 격상하라.

### 합의가 도움이 되지 않는 곳

- **Ambiguous questions.**만약 그 질문에 근거가 없는 진실이 없다면, 합의는 의견입니다.
- **Compound questions.**"코드를 써 설명해 주세요"  두 가지 대답. 각각에 대해 독립적으로 투표하세요.
- **Adversarial multi-round.**만약 에이전트가 이전 라운드들을 관찰하고 모방할 수 있다면 (Du 2023 토론) 그들은 진실과 상관없이 서로 동의하기 시작합니다. 라운드들을 제한합니다 (2-3 일반적으로).

```figure
swarm-consensus-wave
```

## 건설 해

`code/main.py`이 도구는

- `AgentVoter` (응답, 신뢰) 에 대한 각본 정책
- `MajorityVote` 고전적 다수성
- `CPWBFT` 신뢰중심 투표와 의미적 집합
- `DecentLLMs` 점수를 받은 제안에 대한 기하학적 중간 집합.
- `Scenario` 각 집합기를 3개의 공격 패턴으로 실행합니다.

공격 패턴이 구현되었습니다:

1. `byzantine`한 대리인은 자신감으로 거짓말을 합니다.
2. `sycophancy`: 한 대사는 첫 번째 답을 복사하고, 자신감과 일치합니다.
3. `monoculture`: 세 명의 대리인은 적당한 신뢰를 가지고 잘못된 답변 (관계 오류) 을 공유합니다.

실행:

```
python3 code/main.py
```

예상 출력: ( 공격, 집합자) -> 최종 답, 올바른 답이 강조된다. 다수성은 단일농산물의 경우 실패한다. CPWBFT의 신뢰중중심은 사이코판스를 완화한다. 단일농산물이 인구의 절반 미만일 때, decentLLMs의 기하학적 중산은 정직한 클러스터로 끌어당긴다.

## 사용 하 고

`outputs/skill-consensus-designer.md`다중 요원 집합에 대한 합의 프로토콜을 설계합니다: 클러스터링 방법, 중량, 임계량 및 미계량 라운드에 대한 격화 정책.

## 선박

컨센서스 메커니즘을 배포하기 전에:

- **Attack-test with at least the three patterns**네 프로토콜은 예측할 수 있는 방법으로 실패해야지
- **Log every minority cluster**소수 집단은 상관 오류를 위한 초기 경고 시스템입니다.
- **Enforce bounded rounds.**"협정까지 계속 논쟁"은 하지 않습니다.
- **Separate agreement from correctness.**합의 출력은 검증자에게 전달되며 검증자는 집합으로부터 독립합니다.
- **Monitor the agreement rate.**급격한 상승은 적합성 편향을 의미하며 급격한 하락은 모델 파동을 의미합니다.

## 운동

1. 달아`code/main.py`. 다수성을 확인하는 것은 단일농축 공격이 실패하지만, 단일농축 신뢰도가 0.7 이하인 경우 CPWBFT는 부분적으로 완화합니다.
2. 네 번째 공격 패턴을 추가합니다.**silent abstention** 한 대리인이 대답하기를 거부 ("나는 모른다"). 각 집합자 는 어떻게 자제 를 처리 해야 합니까?
3. 문자열 가노니화에서 임베디션-비슷성 (오픈소스 임베디션 모델을 사용) 으로 의미 집합을 전환하십시오.
4. CP-WBFT (arXiv:2511.10400) 를 읽어보십시오. 신뢰성 탐사 등급 단계를 실행하십시오 (분별한 등급 모델은 각 요인의 자신 보고를 확인합니다). 단일농산 시나리오에서 정확성 향상을 측정하십시오.
5. "AI 에이전트들이 동의할 수 있는가?" (arXiv:2603.01213) 를 읽어 보세요. 단순화된 스칼라 합의 실험을 재현하세요. 세 에이전트, 하나의 스칼라 질문, 속임수 인격의 요청. CPWBFT 또는 DecentLLMs가 그것을 잡는가?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| BFT | "Byzantine fault tolerance" | Castro-Liskov 1999 protocol for consensus with `f < n/3` arbitrary faults. |
| Byzantine | "Any bad behavior" | A node that can lie, drop messages, fail silently — anything but crash safely. |
| Confidence probe | "How sure are you?" | Self-reported or calibrator-predicted probability attached to a vote. |
| Semantic clustering | "Same answer, different words" | Grouping equivalent answers before counting votes. |
| Geometric median | "Robust center" | The point minimizing sum of distances to sample points. Robust to outliers, unlike the mean. |
| Monoculture | "Same model, same failures" | Correlated errors when agents share training data or base model. |
| Sycophantic conformity | "Agreeing with the loud voice" | An agent's vote biases toward whoever spoke first/loudest. |
| Core/Edge | "Hierarchical BFT" | WBFT split: small Core consensus first, Edge nodes follow. Bounds latency. |

## 더 많은 읽기

- [Castro & Liskov — Practical Byzantine Fault Tolerance (OSDI 1999)](https://www.usenix.org/conference/osdi-99/practical-byzantine-fault-tolerance) 재단
- [CP-WBFT — Confidence-Probe Weighted BFT](https://arxiv.org/abs/2511.10400) 신뢰에 의한 투표중중감
- [DecentLLMs — leaderless multi-agent consensus](https://arxiv.org/abs/2507.14928) 기하학적 중산 집합
- [WBFT — Weighted BFT with Hierarchical Structure Clustering](https://arxiv.org/abs/2505.05103) 제한된 지연시간을 위해 코어/엣지 분할
- [Can AI Agents Agree?](https://arxiv.org/abs/2603.01213) 규모 협정 취약성 및 사기적인 개인 공격
