# 단계적 점검 및 활성화 재회계

> 백프롭은 모든 중간 활성화를 유지합니다. 70B 매개 변수와 128K 컨텍스트에서 순위당 3 TB의 활성화를 제공합니다. 체크포인트 트레이드 FLOPs: 저장 대신 다시 계산합니다. 문제는 어떤 세그먼트를 떨어뜨리는지, 답은 "모든 것"이 아닙니다.

**Type:** Build
**Languages:** Python (with numpy, optional torch)
**Prerequisites:** Phase 10 Lesson 04 (Pre-Training Mini-GPT), Phase 10 Lesson 05 (Scaling & Distributed)
**Time:** ~70 minutes

## 문제

트랜스포머 훈련은 각 계층에 대해 후진적으로 차별화된 모든 작업에 대한 입력값을 저장합니다. 주의 입력값, Q/K/V 투사, 소프트맥스 출력, FFN 입력값, 표준 출력 및 잔류 스트림. 숨겨진 크기의 계층에 대해`d`, 순서 길이가`L`, 배트`B`, 이것은 명령에 의해`12 * B * L * d`층별로 떠다니는

`d=8192, L=8192, B=1`, 즉 BF16에서 800 MB/층입니다. 64층 모델은 51 GB의 활성화를  그리고 이것은 당신이 미크로배치 크기로 곱하기 전에, 당신이 주의-softmax 중간을 추가하기 전에`L^2`1개) 를 더하기 전에

2면적 청구: BF16 무게와 최적화 상태는 80GB에 적합하지만 활성화는 당신을 밀어 넣을 수 있습니다. 단계적 체크포인팅 (동동 재회정) 은 표준 수정입니다. 대부분의 활성화를 떨어 뜨리고, 뒤로 이동하는 동안 다시 앞을 돌려 돌려 돌려받습니다. 비용: 추가 FLOPs. 이점: 메모리 점 점유율의 비율로 메모리 점유율이 감소합니다.

순진하게 수행된 체크포인팅은 단계마다 약 33% 더 많은 포워드 패스 FLOP가 소요됩니다. 잘 수행된  코르티칸티 등의 "스마트 선택"에 따라 선택적 체크포인팅은 5x 메모리를 5% 이하의 FLOP 오버헤드로 저장합니다. 그리고 FP8 매트무얼, FSDP 오프로드, 전문가 평행 MOE와 함께 이것은 정말로 중요합니다. 당신은 메모리 또는 낭비된 계산을 감당할 수 없습니다.

## 개념

### 과거 에 있는 사람 들 이 실제로 필요로 하는 것

`output = layer(input)`- 후진의 욕구`grad_input`그리고`grad_params`계산하기 위해서는

- `input`(분산하기 위해)`grad_params = input.T @ grad_output`선형층에 대한)
- 일부 활성화 파생 중개 (ReLU/GELU/softmax의 파생은 활성화 값에 따라 달라진다)

앞 패스는 자동으로 오토그라드 그래프에 저장합니다.`tensor.retain_grad()`그리고 모든 입력이 필요한 작업은 참조를 유지합니다.

### 순진한 완전한 체크포인트

네트워크를 나눌 수 있습니다`N`앞부분. 앞부분 동안 각 부분의 *인पुट*만을 저장합니다. 후진이 중간값을 필요로 할 때, segment의 앞부분을 다시 실행하여 그것을 구현하고, 그 다음 차별화합니다.

예를 들어: 32층 트랜스포머는 각각 1층의 32개의 세그먼트로 나뉘어 있습니다.

- 메모리: 32층 입력 (소형) vs 32 * (층당 활성화량) (거대).
- 추가 계산: 각 세그먼트에 1개의 추가적인 앞으로의 FLOP, 즉, 전체적으로 앞으로의 FLOP가 ~33% 더 증가합니다 (뒤로 가는 단계가 2x 앞으로이기 때문에 전체 단계는 1 + 1 + 2 = 4개의 단위로 1 + 2 = 3 대신됩니다).

이것은 2016년 Chen et al.의 원본 레시피입니다.`sqrt(L)`기억과 계산을 균형 잡힌 계층을 만드는 것입니다.$L=64$8개의 체크포인트입니다.

### 선택적 체크포인트 (코르티칸티 2022)

모든 활성화는 동일한 비용이 들지 않습니다.`B*L*L*heads`그리고 순서 길이를 따라 *제곱적으로* 증가합니다.`B*L*4d`긴 염기서열에서 소프트맥스가 지배한다.

선택적 체크포인팅은 저렴한 저장장치 활성화를 유지합니다 (선형 예측, 잔류) 그리고 비싼 것만을 재 계산합니다 (주의).$O(L^2)$기억력

메가트론 코어는 이것을 "선택" 활성화 재회계로 구현합니다. 대부분의 2024+ 국경 훈련 경기에 사용됩니다.

### 배포

재컴퓨터 대안: 앞뒤로 CPU RAM에 대한 선전 활성화를 요구합니다. PCIe 대역폭이 필요합니다. 비활성 대역폭이 재물질화 비용을 초과할 때 유용합니다. 혼합 전략은 일반적입니다.

FSDP2는 1급 옵션으로 탈하를 선보인다. GPU가 메모리에 병목이 닿을 때 탈하는 빛입니다. 하지만 CPU-GPU 전송은 헤드룸이 있습니다.

### 재회용 비용 모델

순진적인 체크포인팅을 통해`k``L`이 부분의 본문은

```
flops_fwd_normal = L * f_layer
flops_bwd_normal = 2 * L * f_layer
flops_total_normal = 3 * L * f_layer

flops_fwd_ckpt = L * f_layer
flops_recompute = L * f_layer  # one extra forward per layer in the segment
flops_bwd_ckpt = 2 * L * f_layer
flops_total_ckpt = 4 * L * f_layer
overhead = 4 / 3 - 1 = 0.33 = 33%
```

선택적 체크포인팅을 통해 전체 계층이 아닌 관심 커널만 재계산합니다.

```
flops_recompute_selective = L * f_attention ~= L * f_layer * 0.15
overhead_selective = (3 + 0.15) / 3 - 1 = 0.05 = 5%
```

### 메모리 저장 모델

계층별 활성화량: `A`- `L`계층, 전체 활성 메모리: `L * A`- 그래

전체 체크포인트 (분야 크기 1): 저장만 `L * input_volume`(~`L * 1/10 A`표준 트랜스포머에 대한 경우)`9 * L * A * 1/10`- 그래

체크포인트마다`k`층: 저장 `L/k * A`더하기`k-1`활성 세그먼트 내에서 계층의 가치

`k = sqrt(L)`, 메모리 및 재컴퓨터 비용 양 규모와`sqrt(L)` 일정한 비용 계층에 대한 최적의 타협.

### 체크포인트 에 가지 않는 시점

- 파이프라인 단계의 가장 깊은 층은 이미 비행 중입니다. 어쨌든 완성해야 합니다.
- 스테이지의 계산에 지배를 가하는 첫 번째와 마지막 층 (변경기에서는 드물다).
- 이미 플래시 주의를 사용하는 주의 커널들  플래시가 이미 소프트맥스를 빠르게 재 계산하므로 추가적인 레이어 레벨 체크포인팅은 위에 거의 추가되지 않습니다.

### 실행 패턴

1. **Function wrapper:**          `torch.utils.checkpoint.checkpoint(fn, input)`- 파이토치 매장만`input`, 모든 것을 다시 계산합니다.

2. **Decorator-based:**체크포인트로 표시되는 레이어; 트레이너는 구성 시점에 어떤 세그먼트가 포장되는지 결정합니다.

3. **Manual explicit recompute:**스스로 뒤로 돌고, 관습이라고 부르세요`recompute_forward`저장된 입력과 앞을 복제하는

세 가지 모두 동일한 기능적인 결과를 제공합니다. 랩퍼는 표준 언어입니다.

### TP/ PP/ FP8과의 상호작용

- **Tensor parallel:**체크포인트 입력값은 재컴퓨터에서 수집되거나 재분배되어야 하며 통신 비용을 처리해야 한다.
- **Pipeline parallel:**전형적인 패턴은 각 파이프라인 단계의 전진을 확인하는 것입니다. 그래서 역순위 마이크로 바치들은 활성화 메모리를 재사용할 수 있습니다.
- **FP8 recompute:**재회정 중에 업데이트 된 amax 역사 는 원래의 전향 또는 FP8 규모 파동과 일치해야 합니다. 대부분의 프레임워크는 스케일을 스냅샷으로 찍습니다.

```figure
activation-recompute
```

## 건설 해

### 단계 1: 세그먼트 가 있는 장난감 모델

```python
import numpy as np


def linear_forward(x, w, b):
    return x @ w + b


def relu(x):
    return np.maximum(x, 0)


def layer_forward(x, w1, b1, w2, b2):
    h = relu(linear_forward(x, w1, b1))
    return linear_forward(h, w2, b2)


def model_forward(x, params):
    activations = [x]
    h = x
    for w1, b1, w2, b2 in params:
        h = layer_forward(h, w1, b1, w2, b2)
        activations.append(h)
    return h, activations
```

### 2단계: 모든 활동이 필요한 선반적 인 후진

```python
def model_backward(grad_output, activations, params):
    grads = [None] * len(params)
    g = grad_output
    for i in range(len(params) - 1, -1, -1):
        w1, b1, w2, b2 = params[i]
        x_in = activations[i]
        h_pre = linear_forward(x_in, w1, b1)
        h = relu(h_pre)
        gh = g @ w2.T
        gw2 = h.T @ g
        gb2 = g.sum(axis=0)
        g_pre = gh * (h_pre > 0)
        gx = g_pre @ w1.T
        gw1 = x_in.T @ g_pre
        gb1 = g_pre.sum(axis=0)
        grads[i] = (gw1, gb1, gw2, gb2)
        g = gx
    return g, grads
```

### 단계 3: 체크포인트-모든-k 기억

```python
def model_forward_checkpointed(x, params, k=4):
    saved_inputs = [x]
    h = x
    for i, (w1, b1, w2, b2) in enumerate(params):
        h = layer_forward(h, w1, b1, w2, b2)
        if (i + 1) % k == 0:
            saved_inputs.append(h)
    return h, saved_inputs


def model_backward_checkpointed(grad_output, saved_inputs, params, k=4):
    grads = [None] * len(params)
    g = grad_output
    segments = [(j * k, min((j + 1) * k, len(params))) for j in range(len(saved_inputs))]
    for seg_idx in range(len(saved_inputs) - 1, -1, -1):
        start, end = segments[seg_idx]
        if start >= end:
            continue
        x_in = saved_inputs[seg_idx]
        _, seg_acts = model_forward(x_in, params[start:end])
        g, seg_grads = model_backward(g, seg_acts, params[start:end])
        for j, gr in enumerate(seg_grads):
            grads[start + j] = gr
    return g, grads
```

### 4단계: 비용 모델

```python
def checkpoint_cost(n_layers, segment_size, flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }


def selective_checkpoint_cost(n_layers, attention_fraction=0.15,
                              flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * attention_fraction * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }
```

### 5단계: 메모리 추정기

```python
def activation_memory_mb(n_layers, hidden=8192, seq=8192,
                        batch=1, bytes_per_value=2):
    per_layer = 12 * batch * seq * hidden * bytes_per_value
    return n_layers * per_layer / 1e6


def memory_after_checkpoint(n_layers, segment_size, hidden=8192,
                           seq=8192, batch=1, bytes_per_value=2):
    n_seg = max(1, n_layers // segment_size)
    saved = (n_seg + segment_size) * 1 * batch * seq * hidden * bytes_per_value
    return saved / 1e6
```

### 단계 6: 최적의 세그먼트 크기가

```python
def optimal_segment(n_layers):
    return int(round(np.sqrt(n_layers)))
```

### 7단계: 선택적 점검점 결정

```python
def should_recompute(layer_type, activation_bytes, recompute_flops_ratio):
    if layer_type == "attention" and activation_bytes > 100 * 1e6:
        return True
    if layer_type == "ffn" and activation_bytes > 500 * 1e6:
        return recompute_flops_ratio < 0.1
    return False
```

## 사용 하 고

- **torch.utils.checkpoint**이 책:`from torch.utils.checkpoint import checkpoint` PyTorch의 가전적 팩터. 함수를 니다. 입력만 저장하고, 뒤로 재 계산합니다.
- **Megatron-Core activation recomputation**: 지원합니다`selective``full`그리고`block`2024+ 국경 훈련 표준
- **FSDP2 offload**이 책:`module.to_empty(device="cpu")``offload_policy`FSDP2에서 재회정 대신 CPU에 활성화되는
- **DeepSpeed ZeRO-Offload**: 최적화 상태 및 활성화에 대한 CPU의 하하하, 체크포인팅을 보완합니다.

## 선박

이 교훈은`outputs/prompt-activation-recompute-policy.md` 모델 구성 (층, 숨겨진, seq, 패치) 및 사용 가능한 GPU 메모리를 가져가는 프롬프트 및 각층 재회정 정책을 발행 (아무 / 선택적 / 완전 / 아웃로드)

## 운동

1. 정확성을 확인해`model_forward`+ `model_backward`(완전 활성화)`model_forward_checkpointed`+ `model_backward_checkpointed`매개 변수 가등은 기계의 정확성과 동일해야 합니다.

2.  扫 segment 크기가`k`1부터`L`- 이 있는 줄기, 기억, 곡선의 무릎을 찾아

3. 선택적 체크포인팅을 구현: 주의 모듈 입력을 저장하지만 중간값을 저장하지 않습니다. 32층 모델의 FLOP 오버헤드와 풀 레이어 체크포인팅을 seq=8192에서 측정합니다.

4. 오프로드 추가. 시뮬레이션된 "CPU 버퍼" ( 별도의 목록) 에 segment 입력을 저장합니다. 바이트/시간으로 "PCIe 대역폭"을 측정하고 오프로드와 재회정 사이의 분해점을 찾아보십시오.

5. 실제 PyTorch 트랜스포머를  벤치마크`torch.utils.checkpoint`. 기억을 측정 (via `torch.cuda.max_memory_allocated`) 그리고 단계 시간.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Gradient checkpointing | "Save memory by redoing forward" | Store segment inputs only; recompute intermediates during backward to get gradient-support tensors |
| Activation recomputation | "Same as checkpointing" | The HPC-flavored name for the same technique |
| Segment size (k) | "How many layers per checkpoint" | Number of layers whose intermediates are dropped and rematerialized together |
| Selective checkpointing | "Korthikanti's trick" | Recompute only expensive-to-store activations (attention softmax); keep cheap ones |
| Full checkpointing | "The naive version" | Recompute every layer's intermediates in every segment |
| Block checkpointing | "Coarse-grained" | Checkpoint whole transformer blocks; largest granularity |
| FLOP overhead | "The compute tax" | Extra FLOPs per step = (recompute FLOPs) / (fwd + bwd FLOPs); 33% naive, 5% selective |
| Activation offload | "Ship to CPU" | Move activations to CPU RAM across forward->backward; alternative to recompute |
| sqrt-L rule | "The classical optimum" | For uniform-cost layers, optimal checkpoint spacing is $\sqrt{L}$ layers |
| Attention-softmax volume | "The O(L^2) problem" | $L^2 \cdot \text{heads} \cdot \text{batch}$ floats; dominates activation memory at long contexts |

## 더 많은 읽기

- [Chen et al., 2016 -- "Training Deep Nets with Sublinear Memory Cost"](https://arxiv.org/abs/1604.06174)-- 그래디언 체크포인트를 공식화한 원본 문서
- [Korthikanti et al., 2022 -- "Reducing Activation Recomputation in Large Transformer Models"](https://arxiv.org/abs/2205.05198)-- 선택적 활성화 재회정 및 공식적인 비용 분석
- [Pudipeddi et al., 2020 -- "Training Large Neural Networks with Constant Memory using a New Execution Algorithm"](https://arxiv.org/abs/2002.05645)-- 역 모드 리메터리얼화 를 통해 대체적인 상수 기억 접근법
- [Ren et al., 2021 -- "ZeRO-Offload: Democratizing Billion-Scale Model Training"](https://arxiv.org/abs/2101.06840)-- 규모로 활성화 해체
- [PyTorch torch.utils.checkpoint docs](https://pytorch.org/docs/stable/checkpoint.html)-- 표준 API
- [Megatron Bridge activation recomputation documentation](https://docs.nvidia.com/nemo/megatron-bridge/latest/training/activation-recomputation.html)-- 선택적, 완전, 블록 모드
