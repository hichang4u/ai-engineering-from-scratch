# 파이프라인 병렬 및 거품 분석

> 수 평행성은 매트릭스를 배열에 걸쳐 곱합니다. 파이프라인 평행성은 모델을 순위마다 1 단계로 나눕니다. 마이크로 배치가 파이프라인을 통해 흐릅니다. 시작과 끝의 빈 시간은 거품입니다. 그것을 최소화하는 것은 전체 공입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 Track C lessons 42-49
**Time:** ~90 min

## 학습 목표

- 순서형 모델을 N 단계로 나뉘어 N 순서로 전향 파이프라인을 시뮬레이션하십시오.
- 시그먼트 M 마이크로바쉬를 GPipe 시그먼트를 사용하여 파이프라인 (전향만 채우고 후향) 를 통해 계산하고 거품 분자를 계산한다.
- 메가트론-LM와 파이프드림에서 사용되는 1F1B 스케줄과 거품을 비교하십시오.
- 단계 할당을 방어: 단계별로 동등한 계산은 단계별로 동등한 매개 변수 수보다 더 중요합니다.

## 문제

fp16의 70B 파라미터 모델은 140GB의 파라미터만 필요로 한다. 소비자 GPU는 그것을 보유하지 않는다. ZeRO-3는 계열에 걸쳐 파라미터들을 쪼개지만 여전히 모든 계층이 필요하며 각 단계에 전체 계층을 모두 모으는 데, 지불합니다.$\log(N)$1층의 앞면은 0층에 끝내고 1층은 1층으로 작동 텐서를 전달합니다. 1층은 2층으로 실행되며 2층으로 전달됩니다. 그리고는 그 반대로 흐릅니다. 각층은 1단계만 포함되기 때문에 메모리는 선형적으로 떨어집니다. 계산은 순차적이므로 거품 문제입니다.

거품은 파이프 라인의 시작 (첫 번째 마이크로바흐가 마지막 단계에 도달하기까지 기다리는) 와 마지막 (최후의 마이크로바흐가 다시 흘러가는 것을 기다리는) 시기의 비활성 시간입니다. M 마이크로 바치와 N 단계의 경우 각 단계에 대한 거품 분수는 (N-1) /(M+N-1) 이다. M=8에서 N=4은 27%입니다. M=64에서 N=4은 4.5%입니다. 미크로배치의 크기는 작은 크기입니다. 미크로배치 설계에 영향을 미치는 한 가지 제약입니다.

## 개념

```mermaid
flowchart LR
  R0[rank 0: stage 0 / layer 0] --> R1[rank 1: stage 1 / layer 1]
  R1 --> R2[rank 2: stage 2 / layer 2]
  R2 --> R3[rank 3: stage 3 / loss]
  R3 -.backward.-> R2
  R2 -.backward.-> R1
  R1 -.backward.-> R0
```

### GPipe 일정은

파이프 라인을 뒤로 시작하기 전에 모든 M 마이크로 바치로 앞으로 채워주세요. 그리고 뒤로 하차하십시오. 각 마이크로박스의 활성화는 뒤로 미끄러져 있어야 합니다. 그래서 메모리는 M와 선형적으로 성장합니다. 앞으로는 M+N-1 순환을 하고, 뒤로는 또 다른 M+N-1 순환을 합니다. 각 단계에 유용한 작업은 2M 주기가 있고, 각 단계에 있는 거품은 2 ((N-1) 주기가 된다. 거품 분수는 (N-1) /(M+N-1) 이므로 앞으로와 뒤로 각각 1개의 시간 단위를 필요로 한다. N보다 M가 더 크다고 하면 거품이 숨어 있습니다.

### 1F1B 일정은

간격: 마이크로바치의 앞선가 마지막 단계에 도달하자마자 뒤로 시작하여 다시 흐르게 한다. 일정은 각 단계에 한 번씩 앞뒤로 나뉘어 있습니다. 거품은 여전히 N-1이지만 활성화 메모리는 파이프라인 깊이에 의해 제한되어 있습니다 생산 파이프라인은 1F1B (Megatron, PipeDream) 를 사용한다. 수업은 GPipe를 먼저 실행합니다. 왜냐하면 그것은 더 간단하기 때문입니다. 그리고 1F1B는 연습으로 사용됩니다.

### 왜 같은 단계에 대한 계산이 중요한가

만약 단계 0가 50 ms, 단계 1가 100 ms를 걸리면, 모든 순환이 단계 1에 게이트된다. 다른 단계들은 단계 1이 출시될 때까지 순환에 50 ms의 비활성성을 유지한다. 같은 매개 변수 수치는 잘못된 축이다. 트랜스포머의 계산은 각 계층에 대한 관심과 MLP가 지배되며, 임베딩 계층은 많은 매개 변수를 가지고 있지만 계산은 거의 없다. 단계 할당은 각 단계 FLOP를 동등하게 해야 한다.

### 미크로배치 대 배치

파이프라인에서는 각각 크기의 B의 M 마이크로바치가 실행된다. 효과적인 배치 크기는 M*B이다. 파이프라인 단계의 끝에서 있는 기하이는 결합된 M*B 예제에서 있는 기하이다. 거품 분자는 M에 달려 있다. 최적화자는 M*B를 본다. M를 조정하는 것은 거품 (하단 M) 을 매개 미크로바치 메모리 (GPipe에 대한 높은 M) 에 대조하는 거품 (하단 M) 을 거래하는 것을 의미합니다.

```figure
cd-pipeline-bubble
```

## 건설 해

`code/main.py`이 도구는

- `PipelineStage`: 작은 `nn.Module`한 단계의 매개 변수를 가지고 있고 노출을 합니다`forward(activation)`- 그래
- `Pipeline(stages, num_microbatches)`: 각 단계별로 시뮬레이션 된 벽 시계 를 사용하여 시뮬레이션 된 단계 에 걸쳐 GPipe 일정을 조정 합니다.
- `bubble_fraction(num_stages, num_microbatches)`: 폐쇄형 (N-1) / M+N-1
- 4단계 디모가 마이크로배치별 추적과 측정된 거품 분자를 인쇄합니다.

실행하세요:

```bash
python3 code/main.py
```

출력: 단계별 미크로배치 간트 차트 및 닫힌 형태 예측에 대한 거품 비율

## 야생에서의 생산 패턴

3개의 패턴이 파이프라인을 가혹하게 해 배가 될 만큼 평행하게 만들어줍니다.

**Activation checkpointing pairs with pipeline.**GPipe에서 비행 중인 M 마이크로바치와 함께, 활성화 메모리는 M 곱하기 1 마이크로바치입니다. 활성화 체크포인팅은 앞을 뒤로 계산하고, 메모리를 거래합니다. 조합은 파이프라인을 긴 순서로 처리 할 수 있게 만듭니다.

**Stage balance is measured, not assumed.**제작팀은 목표 하드웨어에 대한 실제 계층 계산 (FLOP 및 벽 시계) 을 측정하는 프로필 패스를 실행하고, 그 측정에 따라 파티션을 수행합니다.`--num-layers-per-stage`플래그는 각 층에 따른 비용의 차이가 있을 때 비평한 계층 수를 허용하는 목록을 받아들이고 있습니다.

**Send-recv schedule must avoid deadlock.**모든 단계가 전송되기 전에 무선에 정점을 수신하는 파이프라인. 표준 수정은 간섭하는 것입니다. 평정 단계가 먼저 전송하고 다시, 홀수 단계가 먼저 전송합니다. 수업 스케줄은 명시적으로 순위를 지정하여 패턴이 눈에 띄습니다.

## 사용 하 고

생산 패턴:

- **Megatron-LM.**파이프라인 평행성 기준은 1F1B를 사용하며 텐서 + 파이프라인 + 데이터 평행성을 조합하여 지원합니다.
- **DeepSpeed Pipeline.**ZeRO와 통합; ZeRO-1+ 파이프라인은 가장 큰 오픈 모델에 대한 일반적인 조합입니다.
- **PyTorch Pipe.**PyTorch 고유의 파이프라인 팩,`torch.distributed.pipeline.sync.Pipe`- 그래

## 선박

80강은 분단된 체크포인트에서 각 단계 매개 변수 단면을 저장합니다. 81강은 DDP + ZeRO + 파이프라인을 엔드-투-엔드 데모에 구성합니다.

## 운동

1. 1F1B를 실행하고, 거품 분자가 GPipe와 일치하는지 확인하지만, 활성화 메모리는 제한되어 있습니다.
2. 더 깊은 모델에서 실제 단계 시간 프로파일 및 측정 된 벽 시계로 단계의 재균형을 설정합니다.
3. 파이프라인 마이크로바치에서 gradient 축적을 추가하고 gradient가 전차의 전차의 gradient와 같다는 것을 확인합니다.
4. 파이프라인을 활성화 체크포인팅과 결합하여 메모리 하락과 계산 비용의 측정
5. 파이프라인과 DDP (모든 파이프라인 순위가 데이터 병렬 그룹에서 복제됩니다) 를 결합하고 2D 스케줄을 통해 논리합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Pipeline | "Model parallel along depth" | One stage per rank, activations flow stage to stage |
| Bubble | "Pipeline idle time" | (N-1) steps at start + end where some stages have no work |
| Microbatch | "Slice of the batch" | One forward/backward unit; bubble shrinks as M grows |
| GPipe | "Fill then drain" | All M forwards before any backward; high activation memory |
| 1F1B | "Interleaved schedule" | One forward one backward per stage; bounded activation memory |

## 더 많은 읽기

- [Huang et al, GPipe: Efficient Training of Giant Neural Networks](https://arxiv.org/abs/1811.06965)
- [Narayanan et al, PipeDream: Generalized Pipeline Parallelism for DNN Training](https://arxiv.org/abs/1806.03377)
- [Megatron-LM pipeline parallel docs](https://github.com/NVIDIA/Megatron-LM)
- 19단계 76강습 - 스케줄에서 사용되는 SEND/recv 원리
- 19단계 78강 - ZeRO는 파이프라인과 정통이고 종종 결합됩니다
