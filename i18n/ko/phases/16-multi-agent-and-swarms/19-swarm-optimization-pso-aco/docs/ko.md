# LLM에 대한 스 swarm 최적화 (PSO, ACO)

> 생물학적으로 영감을 받은 최적화는 LLM의 복귀를 만들어내고 있습니다.**LMPSO**(arXiv:2504.09247) 는 각 입자의 속도가 초동이고 LLM는 다음 후보를 생성하는 PSO를 사용합니다. 구조화된 염기 출력 (수학적 표현, 프로그램) 에서 잘 작동합니다. **Model Swarms**(arXiv:2410.11163) 는 LLM 전문가 각자를 모델중량 다중분자에서 PSO 입자처럼 취급하고 보고합니다 **13.3% average gain**단지 200개의 사례를 가진 9개의 데이터 세트에 12개의 기본 라인 이상입니다. **SwarmPrompt**(ICAART 2025) 은 신속한 최적화를 위해 PSO + Grey Wolf을 하이브리드 합니다. **AMRO-S**(arXiv:2603.12933) 는 ACO에서 영감을 받은 다중 에이전트 LLM 라우팅의 페로몬 전문가가**4.7x speedup**이 수업은 신속한 매개 변수 공간에 대한 PSO와 에이전트 라우팅에 대한 ACO를 구현하고, 이러한 고전적 알고리즘이 LLM 시대에 적합하지 않은 이유를 측정합니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 09 (Parallel Swarm Networks), Phase 16 · 14 (Consensus and BFT)
**Time:** ~75 minutes

## 문제

작업 평가에서 62% 점수를 얻는 명령어가 있습니다. 당신은 그것을 개선하고 싶습니다. 순진적인 움직임은 gradient-free 수동 조정입니다. 이것은 나쁘게 확장됩니다. 강화 학습은 보상 신호와 훈련하기에 충분한 배포가 필요합니다. 명령어를 통해 백프롭은 실제로 불가능합니다.

고전적인 바이오 영감을 받은 최적화  지속적인 검색 공간에 대한 PSO, 경로 선택에 대한 ACO 은 정확히 이 정제에 맞게 설계되었습니다. gradient-free, 인구 기반, 평가 દીઠ 저렴합니다. gradient-free 검색 단계에 대한 LLM와 결합하면 놀랍도록 실용적인 최적화가 가능합니다.

같은 패턴은 다중 에이전트 시스템에서 에이전트 * 라우팅*에 적용됩니다. ACO 스타일의 페로몬 트레일 기록 어떤 에이전트가 어떤 작업 유형에서 가장 잘 작동하는지, 라우터가 트레일을 이용하도록 허용하고 페로몬을 붕괴시켜 라우트를 다시 발견할 수 있습니다.

## 개념

### PSO 리프레셔 (Kennedy & Eberhart 1995)

입자  Optimization: 연속적인 검색 공간에서 입자 인구.`x_i`그리고 속도`v_i`. 각 반복:

```
v_i <- w * v_i + c1 * r1 * (p_best_i - x_i) + c2 * r2 * (g_best - x_i)
x_i <- x_i + v_i
evaluate fitness(x_i)
update p_best_i if improved
update g_best if global best
```

어디`p_best`입자의 최고 수준입니다`g_best`의 최고가 되죠`w, c1, c2`인지력 + 인지 + 사회적 무게,`r1, r2`무작위적인 요인입니다.

### LLM 출력에 대한 PSO

arXiv:2504.09247은 LLM에서 생성된 구조화된 출력 (수학적 표현, 프로그램) 을 위해 PSO를 조정합니다. 각 입자는 후보 출력입니다. 속도 (Velocity) 는 개인/세계적 최고의 방향으로 현재의 출력을 수정하는 방법을 설명하는 *prompt*입니다. LLM는 속도 프롬프트에서 새로운 출력을 생성합니다. 속도 "인터시아"는 "작은 인크레멘탈 변경을하십시오"와 같은 프롬프트입니다.

이 방법은 다음과 같이 잘 작동합니다.
- 출력은 구조화되어 있습니다 (분석가능, 평가가능).
- 체력 (테스트 러닝, 수학적 평가) 는 자동입니다.
- 인구는 작다 (~ 10-30개의 입자) 그래서 LLM 통용은 관리 가능해집니다.

신체적 건강이 인간적인 검토를 필요로 하는 경우 잘 작동하지 않습니다.

### 모델 스파임

arXiv:2410.11163는 PSO를 출력 계층에서 * 모델* 계층으로 가져갑니다. 각 "입자"는 전문가 LLM (변수) 이다. 무더기는 gradient-free 업데이트를 통해 집단 최고의 방향으로 매개 변수를 이동합니다. 보고: 9 데이터 세트에서 12 개 기본 라인에서 13.3% 평균 이득, 반복당 200 개 인스턴스.

핵심 통찰은 LLM 전문가 모델이 이미 공유된 파라미터 다양체 (adaptor weights, LoRA deltas) 에 가깝다는 것입니다. 이 낮은 차원의 하위 공간에 PSO는 저렴하고 효과적입니다.

### ACO 리프레저 (Dorigo 1992)

개미 식민지 최적화: 개미는 그래프를 가로지르며, 각 경로는 페로몬 흔적이 있다. 개미는 페로몬 강도에 따라 확률 무게를 움직인다. 작업을 완료하는 개미는 용액 품질에 비례하여 페로몬을 저장한다. 시간이 지남에 따라 페로몬이 붕괴된다.

### AMRO-S  에이전트 라우팅 ACO

arXiv:2603.12933은 ACO를 다중 에이전트 로우팅에 사용합니다. 각 작업 유형은 "지향"이며, 각 에이전트는 가능한 라이트입니다. 페로몬은 좋은 결과물을 생산하는 라이트를 강화합니다. 주요 기여:

- **Interpretable routing evidence.**페로몬 강도는 인간에게 읽을 수 있는 신호입니다.
- **Quality-gated asynchronous update.**페로몬은 품질 검사가 통과된 후에야 업데이트되며, 학습에서 추론을 분리합니다.
- **4.7x speedup**다중 에이전트 로우팅 기준에 대한

품질 게이트는 중요하죠. 그 없이는 빠르고 잘못된 요인이 페로몬을 축적하고 시스템이 나쁜 경로를 차단합니다.

### LLM에 PSO/ACO를 언제 사용할 것인가

**Use PSO when:**
- 검색 공간은 연속 또는 연속 매프 (프롬프트 임베디션, LoRA 중량, 수치 생성 매프) 이다.
- 피트니스는 저렴하고 자동입니다.
- 인구는 작아질 수 있다 (10-30).

**Use ACO when:**
- 로우팅이나 경로 선택 문제가 있습니다.
- 결정은 시간이 지남에 따라 강화됩니다 ( 같은 작업 유형이 반복됩니다).
- 로우팅 결정에 해석 가능한 증거가 필요합니다.

**Do not use either when:**
- 체력이 필요한 것은 인간의 검토 (이터레이션당 너무 비싸다)
- 검색 공간은 PSO가 다루지 않는 방식으로 분리되고 조합적입니다 (이 대신 유전 알고리즘을 사용하십시오).
- 실시간 결정은 엄격한 지연이 필요합니다 (PSO/ACO는 단일 패스 유리스틱에 비해 천천히 공렴합니다).

### 왜 바이오 영감을 받은 사람이 여전히 승리하는 걸까요?

그라디언트 기반의 방법들은 차별화 가능한 신호가 필요합니다. LLM의 출력 및 라우팅 결정은 소소한 차별화되지 않습니다. 사이두 그라디언트 방법 (강력 학습 라우터, DPO 스타일의 프롬프트 튜너) 는 효과가 있지만 비용이 많이 드는 훈련이 필요합니다.

PSO와 ACO는 *평가자* 기능만 필요로 합니다. 후보 출력이나 라우팅 결정에 점수를 얻을 수 있다면, 공간을 최적화 할 수 있습니다. 이는 적용 가능성의 배를 훨씬 낮게 만듭니다.

### 실용적인 한계

- **Population budget.**N 입자 × T 반복 × 에볼 비용. LLM 평가 ~$0.02 / call, a 20-particle PSO running 50 iterations costs ~$20. 그에 따라 계획 하십시오.
- **Exploration vs exploitation.**페로몬 붕괴율과 PSO 관동성 교류; 너무 빠른 붕괴 → 솔루션을 잊어 버리는; 너무 느린 → 초기 로컬 최적에 붙어 버린.
- **Catastrophic drift.**두 알고리즘은 피트니스 풍경의 변화 (새로운 데이터 배포) 에 따라 합쳐서 분할될 수 있습니다.

```figure
swarm-stigmergy
```

## 건설 해

`code/main.py`이 도구는

- `LMPSO` PSO는 수치적 프롬프트 매개 변수 (온, 톱_k 중) 에 대한 것입니다. 각 입자의 "LLM 세대"는 스크립트 된 피트니스 함수로 시뮬레이션됩니다. 알고리즘을 30 번 반복하여 g_best 컨버전스를 보여줍니다.
- `AMRO_S`ACO 스타일의 라우팅. 3 에이전트, 4 작업 유형, 페로몬 매트릭스, 100 개의 라우팅 작업. 트레일 형성을 표시하기 위해 시간 배포 (task_type → agent options)
- 비교: 동일한 작업 스트림에서 무작위 로우팅과 ACO 로우팅. 품질과 지연을 측정합니다.

실행:

```
python3 code/main.py
```

예상 출력:
- LMPSO: g_best 피트니스는 30번 이상 무작위로 최적화됩니다.
- AMRO-S: 페로몬 테이블은 작업 유형에 따라 올바른 에이전트에 안정화됩니다. ACO 라우팅은 품질에 대해 무작위로 ~ 30-40%를 때리고 또한 지연을 감소시킵니다 (다시 시도하는 적은 수).

## 사용 하 고

`outputs/skill-swarm-optimizer.md`이 방법은 PSO, ACO, 유전 알고리즘, 그리고 LLM/ 에이전트 최적화 문제에 대한 gradient 기반 최적화 중 하나를 선택할 수 있도록 도와줍니다.

## 선박

- **Start small.**10~20개의 입자, 20~50개의 반복이 있습니다.
- **Log pheromones or g_best per iteration.**흔적이 없는  swarm optimizers를 해제하는 것은 고통스럽습니다.
- **Quality-gate updates.**특히 ACO 라우팅: 빠르고 잘못된 요인은 페로몬을 축적해서는 안 됩니다.
- **Reset decay on distribution shift.**평가 분포가 바뀌면 노후 페로몬이 고갈되고, 재설정하거나 일시적으로 붕괴율을 두 배로 늘립니다.
- **Cap the per-iteration cost.**반복당 500달러에 달하는 PSO가 0.5%의 수익을 올리는 것은 배송이 불가능합니다.

## 운동

1. 달아`code/main.py`LMPSO의 공렴을 관찰해 보세요. 5, 10, 20, 50의 인구 크기가 달라집니다.
2. "재해적 유동" 실험을 실행: 반복 30 후, 체력 기능을 변경합니다. PSO가 얼마나 빨리 적응합니까?`p_best`도와줄 수 있어?
3. AMRO-S에 품질 게이트를 추가: 에볼 점수가 0.7 이상인 런에서만 페로몬 보증. 이 경우 비 게이트 버전과 컨버전스가 어떻게 변화하는가?
4. LMPSO (arXiv:2504.09247) 를 읽어 보십시오. 논문의 "속도는 명령"으로 다시 숫자 속도에 다시 지도를 작성하세요. 시뮬레이션에서 무엇이 사라지고 무엇이 보존되는가?
5. AMRO-S (arXiv:2603.12933) 를 읽어 보십시오. 아싱크론 페로몬 업데이트와 함께 분리된 "인퍼렌스 패스트-패스"를 구현하세요. 이것은 지속적인 로드 아래 시스템 지연을 어떻게 변화시킵니다?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| PSO | "Particle Swarm Optimization" | Kennedy-Eberhart 1995. Population-based gradient-free optimizer. |
| ACO | "Ant Colony Optimization" | Dorigo 1992. Path/route optimization via pheromone trails. |
| LMPSO | "PSO with LLM generation" | arXiv:2504.09247. Velocity is a prompt; LLM produces candidates. |
| Model Swarms | "PSO on expert weights" | arXiv:2410.11163. Gradient-free update on model parameter subspace. |
| AMRO-S | "ACO for agent routing" | arXiv:2603.12933. Pheromone matrix over task-type × agent. |
| p_best / g_best | "Personal / global best" | Per-particle and swarm-wide best solutions found so far. |
| Pheromone | "Routing memory" | Strength on an edge; decays over time; deposits on quality. |
| Quality-gated update | "Only learn from good runs" | Pheromone deposit conditioned on quality check. |
| Catastrophic drift | "Distribution shift" | Fitness landscape changes; old p_best and pheromones become stale. |

## 더 많은 읽기

- [Kennedy & Eberhart — Particle Swarm Optimization](https://ieeexplore.ieee.org/document/488968) 1995년 PSO 논문
- [Dorigo — Ant Colony Optimization](https://www.aco-metaheuristic.org/about.html) 1992 ACO 재단
- [LMPSO — Language Model Particle Swarm Optimization](https://arxiv.org/abs/2504.09247) 구조화된 LLM 출력에 대한 PSO
- [Model Swarms — gradient-free LLM expert optimization](https://arxiv.org/abs/2410.11163) 모델 중량 하위 공간에 대한 PSO
- [AMRO-S — ant-colony multi-agent routing](https://arxiv.org/abs/2603.12933) 품질 게이트를 가진 페로몬으로 움직이는 라우팅
