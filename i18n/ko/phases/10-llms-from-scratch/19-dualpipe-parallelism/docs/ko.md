# 듀얼파이프 평행성

> 딥시크-V3는 2,048개의 H800 GPU에 훈련되어 노드들을 통해 분포된 MoE 전문가들을 대상으로 모든 노드 간 통신 전문가의 모든 노드 간 통신 비용은 1 GPU 시간 통신에 대한 1 GPU 시간 계산에 GPU는 절반 정도 지 않았습니다. 듀얼파이프 (DeepSeek, Dec 2024) 는 전향 및 후향 계산과 그들이 촉발하는 전향 통신과 겹치는 쌍방향 파이프라인입니다. 거품의 하락, 출력 상승, 그리고 두 개의 모델 파라미터 복사본 (이명과 관련된 "다중") 을 유지하는 것은 Expert Parallelism이 이미 전문가들을 순위별로 퍼뜨리고 있기 때문에 저렴합니다. 이 수업은 듀얼파이프가 실제로 하는 일을 학습하는 방식으로 설명하고 Sea AI Lab의 듀얼파이프V 정비로 인해 2배의 매개 변수 비용이 약간 더 좁은 거품의 비용으로 떨어지는 이유입니다.

**Type:** Learn
**Languages:** Python (stdlib, schedule simulator)
**Prerequisites:** Phase 10 · 05 (distributed training, FSDP, DeepSpeed), Phase 10 · 14 (open-model architectures and MoE)
**Time:** ~60 minutes

## 학습 목표

- 듀얼파이프 앞뒤로 움직이는 4가지 요소를 명명하고 각각의 점들이 왜 서로 겹치는 지를 설명해 주세요.
- 파이프라인 거품 문제와 실제와 마케팅에서 " 거품 없는"이란 무엇을 의미하는지 설명하십시오.
- 8개의 PP 순위와 16개의 마이크로 배치를 위해 듀얼파이프 스케줄을 손으로 추적하고 앞으로의 흐름과 역류가 서로의 비활성된 슬롯을 채우도록 확인합니다.
- 듀얼파이프V (Sea AI Lab, 2025) 가 하는 타협은: 전문가 평행성이 비활성일 때 약간 더 큰 거품의 비용으로 2x 매개 변수를 떨어뜨립니다.

## 문제

2k H800 GPU에 671B MoE 모델을 훈련시키는 것은 3가지 복합 병목에 빠집니다.

1. **Memory pressure.**GPU는 모델의 한 조각을 가지고 있습니다. 128개의 헤드에서 61개의 레이어를 통해 8k 순서로 활성화 메모리는 엄청납니다.
2. **Pipeline bubbles.**전통적인 파이프라인 병렬 (GPipe, 1F1B) 은 GPU가 단계의 입력 또는 경각심을 기다리는 동안 비동기를 남겨두고 있습니다. 8 단계에서는 1F1B 스케줄링에도 GPU 시간의 약 12%가 거품이 될 수 있습니다.
3. **Cross-node all-to-all.**전문가 병렬성으로 MoE는 노드 간 전문가들을 흩어지게 한다. 모든 전진 패스는 전문가들에게 토큰을 보내기 위해 모든 것을 촉발하고, 다른 하나는 결합한다. 2k GPU에서 이것은 쉽게 1:1 계산-커미션 비율이 된다.

각각의 솔루션은 별도의 솔루션입니다. 메모리, 파이프라인 버블의 Zero Bubble (Sea AI Lab, 2023) 및 모든 모든 전문가 paralel 통신 커널을 위한 그라디언트 체크포인팅. 듀얼파이프가 하는 일은 그들이 함께 연주하도록 하는 것입니다. 스케줄은 하나의 앞뒤로 이동하는 부분에서 컴퓨팅과 통신을 초월하고 파이프라인의 양쪽 끝에서 동시에 마이크로 배치를 주입하고, 결과 스케줄을 사용하여 컴퓨팅 창 내부에서 모든 것을 숨기게합니다.

보고된 결과: 파이프라인 거품의 거의 제거, DeepSeek-V3의 14.8T 토큰 훈련에서 95% 이상의 GPU 사용.

## 개념

### 파이프라인 병렬성 개정

P 장치에 N 층 모델을 나눌 수 있습니다. 장치 `i`층을 지탱합니다`i * N/P .. (i+1) * N/P - 1`. 미세 배치가 장치 0에서 P-1까지 앞으로 흐르고, P-1에서 0까지 뒤로 흐른다. 각 장치는 전 장치가 출력을 보내면만 앞으로의 단계를 시작할 수 있고 하류 장치가 하류 기하급수를 보내면만 뒤로 시작할 수 있다.

GPipe (Huang et al., 2019) 는 한 번에 하나의 마이크로 패치를 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일이 일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일일 1F1B (Narayanan et al., 2021) 는 여러 마이크로 배치를 위한 앞과 뒤로의 패스를 잇는 것이다. 제로 버블 (Qi et al., 2023) 은 후퇴 통로를 2 부분으로 나 ??  후퇴-입입입 (B) 및 후퇴-중중중 (W) 으로 나누고 버블을 채우기 위해 일정을 정한다. 제로 버블 이후 파이프라인은 거의 좁아졌습니다.

더블파이프는 다음 단계입니다. 이 방법은 두 가지 아이디어를 추가합니다.

### 아이디어 1: 조각 분해

앞부분은 4가지로 나뉘어 있습니다.

- **Attention.**Q/K/V 투명, 관심, 출력 투명
- **All-to-all dispatch.**코스 넘치는 통신이 전문가들에게 토큰을 보내는 거죠.
- **MLP.**MoE 전문가 계산
- **All-to-all combine.**전문가들의 출력을 가져오는 교류 노드

후진 조각은 이 각각의 곡선의 기하급수 버전들을 추가합니다. 두발파이프는 이 모든 것을 다음 조각의 주의 계산과 병행하게 처리하고 다음 조각의 MLP 계산과 병행하게 결합합니다.

### 아이디어 2: 쌍방향 스케줄링

대부분의 파이프라인 스케줄은 0 단계에서 마이크로 패치를 주입하고 P-1 단계로 흐른다. DualPipe는 두 끝에서 마이크로 패치를 주입한다. 0 단계에서는 거기서 기출되는 앞 마이크로 패치를 볼 수 있으며, P-1 단계에서는 거기서 기출되는 앞 마이크로 패치를 볼 수 있다. 두 흐름은 중간에서 만나는 것이다.

이 장치가 작동하려면`i`초기 파이프라인 층을 모두 유지해야 합니다.`i`그리고 후기 파이프라인 층`P - 1 - i`이 두 개의 장치는 두 개의 모델 레이어를 보관합니다. 이 부분은 두 개의 장치입니다. 두 개의 장치에는 두 개의 모델 레이어가 있습니다.

중요한 것은 한 방향으로 앞으로 흐르는 흐름과 다른 방향으로 후로 흐르는 흐름이 거품들이 한 방향으로 흐르는 시간표에 있는 곳에 정확히 겹치는 것입니다. 거품들은 사라집니다.

### 손으로 추적된 일정은

P = 4 행, 8 마이크로 패치, 4 앞 / 4 역으로 나뉘는 P = 4 행을 고려하십시오. 시간은 왼쪽에서 오른쪽으로 이동합니다. 행은 장치 행입니다.

```
           Time →
rank 0:  F1 F2 F3 F4  F5R F6R F7R F8R  B1 B2 B3 B4  ...
rank 1:     F1 F2 F3  F4/F5R F6R F7R   B1 B2 ...
rank 2:        F1 F2  F3/F5R F4/F6R    B1 ...
rank 3:           F1  F2/F5R F3/F6R    ...
```

"F4/F5R" 표기판을 읽으면서: 1위는 마이크로 패치 4 ( 파이프라인에서 왼쪽에서 오른쪽으로) 그리고 마이크로 패치 5 (왼쪽으로 오른쪽으로) 를 앞으로 같은 시간 단위로 달리고 있습니다.

순위 2에서는 교차 흐름이 더 빨리 초복되고, 순위 0에서 P-1에서는 가장 늦게 초복된다. 일정의 안정적인 중간 단계에서 모든 순위가 X 방향의 앞쪽으로 Y 방향의 뒤쪽으로 초복되어 실행된다. 계산은 바쁘다. 전면 통과의 모든 디스페이스는 전면 계산 안에 숨어있다. 전면 계산 안에 숨겨져있다. 거품은 압축됩니다.

### 거품 회계

표준 1F1B 파이프라인 거품 (급별로 낭비된 시간):

```
bubble_1F1B = (P - 1) * forward_chunk_time
```

듀얼파이프 (DualPipe) 는 안정적인 단계에서는 마이크로 패치 수치가 파이프라인 깊이의 2배로 나눌 수 있는 경우 0 개의 거품이 있습니다. 안정적인 단계 (온화 및 냉각) 외부에서는 약간의 거품이 있지만 마이크로 패치 수와 함께 성장하지 않습니다.

마케팅 용어: "공구 없는 것". 기술 용어: 미세 배트 수록으로 거품이 성장하지 않는다. 시 AI 연구소의 후속 분석 (DualPipeV / Cut-in-half) 은 전문가 평행성이 bottleneck이 아닌 경우에만 완전한 제로 거품을 보여줍니다. EP 가 주도하는 모든 모든 것, 일정화 타협은 항상 존재합니다.

###      

Sea AI Lab (2025) 는 EP 통신 초복이 문제가 되지 않을 때 2x 매개 변수 복제가 낭비적이라는 것을 관찰했습니다. 그들의 DualPipeV 스케줄은 2방향 주사를 하나의 매개 변수 복사본으로 실행되는 "V 모양" 스케줄으로 접합니다. 거품은 듀얼파이프보다 약간 커지만 메모리의 절약은 상당히 크죠 딥시크는 오픈소스 듀얼파이프 구현에서 듀얼파이프V를 EP-오프 모드로 채택했다.

타협은

| Feature | DualPipe | DualPipeV | 1F1B | Zero Bubble |
|---------|---------|-----------|------|------------|
| Param copies per device | 2 | 1 | 1 | 1 |
| Bubble vs micro-batches | constant | small growth | grows | grows |
| Compute-comm overlap | full | partial | minimal | partial |
| Use when | EP-heavy MoE | dense or EP-light | baseline | any pipeline |

### 14.8T 토큰 실행에 대한 의미

딥시크-V3의 사전 훈련은 약 2.8M GPU 시간 동안 2,048 H800 GPU에 14.8T 토큰을 소비했습니다. 순수한 1F1B를 사용하면 전체 70B 모델을 훈련시킬 만큼의  340-420K GPU 시간으로 파이프라인 거품으로 12~15%를 잃었을 것입니다. 듀얼파이프는 대부분 복구했습니다. 내부 로그 없이 직접적인 기여를 수치화하는 것은 어렵지만 논문에서 주장하는 것은 훈련 전반에 걸쳐 평균적으로 95% 이상의 GPU 사용량입니다.

더 작은 실행 (GPU 1k 이하) 에 대해, DualPipe는 과잉  파이프라인 거품이 전체 비용에 비해 작으며, 밀집 모델 훈련은 거의 모든 것을 포착 할 수 없습니다. 다천 GPU 규모의 국경 MoE 훈련에서는 효과적으로 필요합니다.

### 그 덩어리 안에 있는

- **FSDP**(단계 10 · 05) FSDP는 모델 매개 변수를 순위 간으로 나뉘어 두 개의 파이프가 순위 간 계산을 스케줄링합니다.
- **ZeRO-3**2번 복제한 기록은 ZeRO의 쪼개진 gradients와 협력해야 합니다.
- 요구사항**custom all-to-all kernels**특정 클러스터 토폴로지에 맞춰 조정되었습니다. DeepSeek의 오픈소스 커널은 참조 구현입니다.

```figure
expert-capacity
```

## 사용 하 고

`code/main.py`파이프라인 스케줄 시뮬레이터입니다.`(P, n_micro_batches, schedule)`1F1B, Zero Bubble, DualPipe, DualPipeV의 각각에 대한 안정적인 단계 활용을 인쇄합니다.

시뮬레이터의 값: 다른 P와 마이크로 배트 수를 실행하고 1F1B에 대해 거품 분자가 어떻게 성장하는지 관찰하지만 DualPipe는 아닙니다.

실제 교육 과정에 대한 통합 고려 사항:

- 파이프라인 평행 깊이를 선택하여 미세 배트 수를 세게 나눌 수 있습니다.
- 전문가 평행망이 2방향으로 모든 것을 지원하는지 확인하세요.
- 첫 번째 시간에는 일정을 디버깅하는 시간을 일주일 정도 소비할 것으로 예상하세요.
- GPU 사용량을 순위별로 모니터링하고, 집합적으로만 하는 것이 아니라

## 선박

이 교훈은`outputs/skill-dualpipe-planner.md`. 훈련 클러스터의 사양을 고려하여 (GPU 수, 토폴로지, 상호 연결, 모델 모양) 파이프라인 병렬화 전략, 일정을 계획하는 알고리즘 및 목표 규모에서 예상되는 거품 분자를 권장합니다.

## 운동

1. 달아`code/main.py` `(P=8, micro_batches=16, schedule=dualpipe)`그리고`(P=8, micro_batches=16, schedule=1f1b)`GPU 사용량 차이를 계산하고 훈련의 백만 토큰에 걸친 복구된 GPU 시간으로 표현합니다.

2.  스케줄 테이블을 스케치`(P=4, micro_batches=8, schedule=dualpipe)`각 시간 구간을 마이크로 배트 ID와 방향으로 표시하고, 거품이 없는 첫 시간 구간을 식별합니다.

3. DeepSeek-V3 기술 보고서 (arXiv:2412.19437) 의 그림 5을 읽어 보세요. 듀얼파이프 앞부분 내부의 모든 것까지 전송을 위한 초복 창을 식별하고 계산 스케줄이 어떻게 그것을 숨기는지를 설명합니다.

4. P=8 파이프라인 단계와 671B 파이프라인 단계와 함께 70B 밀도가 높은 모델과 P=16 파이프라인 단계의 DualPipe의 2x 파라미터 오버헤드를 계산하십시오. 왜 MoE 케이스의 오버헤드가 비례적으로 작는지 보여 주십시오. (대부분의 파라미터들은 전문가이며, 큰 EP 그룹에 걸쳐 분해되어 있습니다).

5. 듀얼파이프와 킴라 (2021년부터 경쟁하는 쌍방향 스케줄러) 를 비교하십시오. 킴라가 가지고 있지 않은 두 가지 특성을 식별하여 킴라의 참조로 문장의 3.4 섹션을 사용하여 킴라가 추가했습니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Pipeline bubble | "Idle time per rank" | GPU cycles wasted because a pipeline stage is waiting for its input or gradient |
| 1F1B | "Default pipeline schedule" | One forward / one backward interleaved scheduling; the baseline DualPipe beats |
| Zero Bubble | "Sea AI Lab 2023" | Splits backward into B (input gradient) and W (weight gradient); almost fully tightens the pipeline |
| DualPipe | "DeepSeek-V3 schedule" | Bidirectional pipeline + compute-comm overlap; bubbles do not grow with micro-batch count |
| DualPipeV | "Cut-in-half" | V-shape refinement that drops the 2x parameter replication at the cost of slightly larger bubbles |
| Chunk | "Unit of pipeline work" | A forward or backward pass of one micro-batch through one pipeline stage |
| All-to-all dispatch | "Send tokens to experts" | Cross-node comm that routes tokens to their assigned MoE experts |
| All-to-all combine | "Bring expert outputs back" | Cross-node comm that gathers expert outputs after the MLP |
| Expert Parallelism (EP) | "Experts across GPUs" | Shards MoE experts across ranks so different GPUs hold different experts |
| Pipeline Parallelism (PP) | "Layers across GPUs" | Shards model layers across ranks; the dimension DualPipe schedules |
| Bubble fraction | "Wasted GPU time" | (bubble_time / total_time); the fraction DualPipe drives toward zero |

## 더 많은 읽기

- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437), Section 3.3.2 and Figure 5](https://arxiv.org/abs/2412.19437) 주요 두 개의 파이프 참조
- [DeepSeek — DualPipe GitHub repository](https://github.com/deepseek-ai/DualPipe) 듀얼파이프V (중으로 절단) 모드를 포함한 오픈소스 참조 구현
- [Qi et al. — Zero Bubble Pipeline Parallelism (arXiv:2401.10241, Sea AI Lab 2023)](https://arxiv.org/abs/2401.10241) 제로 거품 전신
- [Sea AI Lab — DualPipe could be better without the Dual](https://sail.sea.com/blog/articles/63) DeepSeek의 EP-off 모드를 알린 DualPipeV 분석
- [Narayanan et al. — PipeDream / 1F1B (arXiv:1806.03377, 2018-2021)](https://arxiv.org/abs/1806.03377) 1F1B 일정은 듀얼파이프와 비교
- [Huang et al. — GPipe (arXiv:1811.06965, 2018)](https://arxiv.org/abs/1811.06965) 본래 파이프라인 병렬성 종이와 거품 문제
