# KV 캐시, 플래시 주의 & 인퍼런스 최적화

> 훈련은 병렬이고 FLOP에 묶여 있습니다. 추론은 연속적이고 메모리에는 묶여 있습니다. 다른 병목, 다른 트릭.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 05 (Full Transformer), Phase 7 · 07 (GPT)
**Time:** ~75 minutes

## 문제

순수한 자율 퇴행 디코더가 해줍니다$O(N^2)$생산하기 위한 작업$N$토큰: 각 단계에서는 전체 전두환에 대한 주의를 재 계산합니다. 16M 주의 작업인 4K 토큰 응답에서, 대부분은 과잉입니다. 전두환 토큰의 모든 숨겨진 상태는 계산되면 결정적입니다.

이 외에도, 관심은 자체적으로 많은 데이터를 이동합니다. 표준 관심은 N×N 점수 매트릭스, N×d 소프트맥스 출력, N×d 최종 출력 를 HBM에 너무 많이 읽고 쓰는 것을 구현합니다. N≥2K에 대해서는 관심은 FLOP-bound이 되기 전에 메모리에 묶여집니다. 클래식 관심 커널은 410x에 의해 현대 GPU를 미흡하게 사용합니다.

두 가지 최적화, 다오 등에서 모두, 국경 추론을 "연소"에서 "빠르게"로 밀어 넣었습니다:

1. **KV cache.**각 전자 토큰의 K 및 V 벡터를 저장합니다. 각 새로운 토큰의 관심은 캐시 키에 대한 한 질문입니다.$O(N^2)$ $O(N)$세대를 위한 단계
2. **Flash Attention.**전체 N×N 매트릭스가 HBM를 결코 타지 않도록 주의 계산을 타일하십시오. 모든 소프트맥스 + 매트무일은 SRAM에서 발생합니다. A100에서 24× 벽 시계 가속화; FP8로 H100에서 510×

2026년까지 둘 다 보편화됩니다. 모든 생산 추론 스택 (vLLM, TensorRT-LLM, SGLang, llama.cpp) 는 그것들을 가정합니다. 모든 국경 모델 선박은 플래시 주의를 활성화합니다.

## 개념

![KV cache growth and Flash Attention tiling](../assets/kv-cache-flash-attn.svg)

### KV 캐시 수학

디코더 레이어, 토큰, 헤드

```
bytes_per_token_per_layer = 2 * d_head * dtype_size
                          ^
                          K and V
```

7B 모델에 대해 32층, 32개의 헤드, d_head=128, fp16:

```
per token per layer = 2 * 128 * 2 = 512 bytes
per token (32 layers) = 16 KB
per 32K context = 512 MB
```

Llama 3 70B (80층, d_head=128, GQA 8 KV 헤드):

```
per token per layer = 2 * 8 * 128 * 2 = 4096 bytes (4 KB)
per 32K context = 10.4 GB
```

10GB의 경우 128K 컨텍스트에서 Llama 3 70B가 40GB A100의 대부분을 필요로 합니다.

**GQA is the KV-cache win.**64개의 헤드만 있으면 32GB가 됩니다.

크기를 끌고 캐시 크기가 움직임을 관찰하십시오. 순서 길이를 밀어내거나 배치를 올려서 GPU를 얼마나 빨리 지나가는지 확인하십시오.

```figure
kv-cache-sizer
```

### 플래시 주의  타일링 트릭

표준 주의:

```
S = Q @ K^T          (HBM read, N×N, HBM write)
P = softmax(S)       (HBM read, HBM write)
O = P @ V            (HBM read, HBM write)
```

HBM의 반도 3 TB/s, SRAM의 30 TB/s. HBM의 각 여행은 10분의 1의 느려진 속도와 모든 것을 칩에 유지하는 것과 비교해

플래시 주의:

```
for each block of Q (tile size ~128 × 128):
    load Q_tile into SRAM
    for each block of K, V:
        load K_tile, V_tile into SRAM
        compute S_tile = Q_tile @ K_tile^T     (SRAM)
        running softmax aggregation             (SRAM)
        accumulate into O_tile                  (SRAM)
    write O_tile to HBM
```

한 타일당 한 HBM 여행. 전체 메모리 발자국량은$O(N^2)$ $O(N)$. 후진 패스는 앞진 패스에서 저장되는 대신 일부 값을 다시 계산합니다.

**Numerical trick.**                                                                       `(max, sum)`플래시 주의는 표준 주의 (modulo fp16 비협동성) 에 비트 동일 출력을 계산합니다.

**Version evolution:**

| Version | Year | Key change | Speedup on reference hardware |
|---------|------|-----------|-------------------------------|
| Flash 1 | 2022 | Tiled SRAM kernel | 2× on A100 |
| Flash 2 | 2023 | Better parallelism, causal-first ordering | 3× on A100 |
| Flash 3 | 2024 | Hopper asynchrony, FP8 | 1.5–2× on H100 (~740 TFLOPs FP16) |
| Flash 4 | 2026 | Blackwell 5-stage pipeline, software exp2 | Inference-first (forward only initially) |

플래시 4는 발사 시만 진행된다. 훈련은 여전히 플래시 3를 사용합니다. GQA 및 varlen 지원은 플래시 4를 기다리고 있습니다 (2026 년 중).

### 추측적 디코딩  다른 지연성 승

저렴한 모델은 N 토큰을 제안합니다. 큰 모델은 모든 N를 병렬로 확인합니다. 검증이 k 토큰을 받아들이면, k 세대에 대한 1 대 모델 전격 패스를 지불했습니다. 전형적인 k = 35는 코드와 시사에서 발생합니다.

2026 결제:
- **EAGLE 2 / Medusa.**검증자의 숨겨진 상태를 공유하는 통합 드래프트 헤드. 품질 손실 없이 23x 가속화.
- **Speculative decoding with draft model.**소비자 하드웨어에 2~4배 가속화
- **Lookahead decoding.**자코비 반복, 드래프트 모델이 필요없습니다.

### 연속적인 배팅

클래식 배트 추론: 가장 느린 순서가 끝나기를 기다리고 새로운 배트를 시작하십시오. 짧은 응답이 일찍 끝나면 GPU를 낭비합니다.

연속 배팅 (첫째는 오르카에서, 지금은 vLLM, TensorRT-LLM, SGLang에서 배팅): 오래된 배팅이 끝나자마자 새로운 요청을 배팅에 교환합니다. 일반적인 채팅 작업 부하에 510x 처리량 증가.

### 페이지드아테네이션 KV 캐시

vLLM의 주요 기능. KV 캐시는 16 토큰 블록으로 할당되며, 페이지 테이블은 물리적 블록에 대한 논리적 위치를 지도합니다. KV를 병렬 샘플 (빔 검색, 병렬 샘플링), 신속한 캐시링을위한 핫 스wap 사전 및 디frag먼트 메모리를 통해 공유 할 수 있습니다. 순수한 직접 할당보다 4x 처리량 향상.

```figure
flash-attention-memory
```

## 건설 해

보시다시피`code/main.py`. 우리는:

1. 순진한 사람이야$O(N^2)$이성 디코더
2. A$O(N)$KV 캐시 디코더
3. 플래시 애트런션의 실행 최대 알고리즘을 시뮬레이션하는 타일 소프트맥스

### 단계 1: KV 캐시

```python
class KVCache:
    def __init__(self, n_layers, n_heads, d_head):
        self.K = [[[] for _ in range(n_heads)] for _ in range(n_layers)]
        self.V = [[[] for _ in range(n_heads)] for _ in range(n_layers)]

    def append(self, layer, head, k, v):
        self.K[layer][head].append(k)
        self.V[layer][head].append(v)

    def read(self, layer, head):
        return self.K[layer][head], self.V[layer][head]
```

간단합니다. 각 코너 K, V 벡터들을 계층별, 각 헤드 리스트에 계속 늘려나갈 수 있습니다.

### 단계 2: 타일 softmax

```python
def tiled_softmax_dot(q, K, V, tile=4):
    """Flash-attention-style softmax(qK^T)V with running max/sum."""
    m = float("-inf")
    s = 0.0
    out = [0.0] * len(V[0])
    for start in range(0, len(K), tile):
        k_block = K[start:start + tile]
        v_block = V[start:start + tile]
        scores = [sum(qi * ki for qi, ki in zip(q, k)) for k in k_block]
        new_m = max(m, *scores)
        exp_old = math.exp(m - new_m) if m != float("-inf") else 0.0
        exp_new = [math.exp(sc - new_m) for sc in scores]
        s = s * exp_old + sum(exp_new)
        for j in range(len(out)):
            out[j] = out[j] * exp_old + sum(e * v[j] for e, v in zip(exp_new, v_block))
        m = new_m
    return [o / s for o in out]
```

비트 동일 출력 `softmax(qK) V`한 번의 촬영에서, 하지만 언제든지 작업 세트`tile × d_head`블록이 아니라 전체`N × d_head`- 그래

### 단계 3: 100 토큰 생성에서 순진한 것과 캐시 된 디코딩을 비교하십시오

주의를 계산해 보세요$O(N^2)$= 5050: 캐시:$O(N)$코드는 둘 다 인쇄합니다.

## 사용 하 고

```python
# HuggingFace transformers auto-enables KV cache on decoder-only generate().
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.2-3B",
    attn_implementation="flash_attention_2",  # use FA3 if Hopper
    torch_dtype="bfloat16",
)
# generate() uses KV cache automatically
```

vLLM 생산:

```bash
pip install vllm
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --tensor-parallel-size 4 \
    --max-model-len 32768 \
    --enable-prefix-caching \
    --kv-cache-dtype fp8
```

요청들 중 사전 예시 저장은 큰 2026 승입니다. 동일한 시스템 프롬프트, 몇 번의 예제 또는 긴 맥락 문서가 호출들 중 KV를 재사용합니다. 반복된 도구 요청이있는 에이전트 작업 부하에서 사전 예시 저장은 일상적으로 5 × 처리량 증가입니다.

## 선박

보시다시피`outputs/skill-inference-optimizer.md`. 기술은 새로운 추론 배포를 위해 주의 구현, KV 캐시 전략, 양자화, 그리고 추측적 디코딩을 선택합니다.

## 운동

1. **Easy.**달아`code/main.py`. 순수하고 캐시된 디코더가 동일한 출력을 생성하는지 확인하고, 오프 카운트 차이점을 참고하십시오.
2. **Medium.**사전 캐싱을 구현: 프롬프트 P와 여러 완료를 주어, KV 캐시를 채우기 위해 P에 한 번 앞을 통과하여, 완료마다 분할하십시오. 각 개에 대한 속도와 P 재코딩을 측정하십시오.
3. **Hard.**장난감 페이지 주의: KV 캐시를 고정된 16 토큰 블록과 무료 목록에 구현하십시오. 순서가 완료되면 블록을 풀에 반환하십시오. 다양한 길이의 1,000 개의 채팅 완료를 시뮬레이션하십시오. 메모리 분자와 인접 할당을 비교하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| KV cache | "The trick that makes decoding fast" | Stored K and V from every prefix token; new queries attend to them instead of recomputing. |
| HBM | "GPU main memory" | High Bandwidth Memory; 80 GB on H100, 192 GB on B200. ~3 TB/s bandwidth. |
| SRAM | "On-chip memory" | Per-SM fast memory, ~256 KB per SM on H100. ~30 TB/s bandwidth. |
| Flash Attention | "Tiled attention kernel" | Computes attention without materializing N×N in HBM. |
| Continuous batching | "No-wait batching" | Swap finished sequences out, new ones in, without draining the batch. |
| PagedAttention | "vLLM's headline" | KV cache allocated in fixed blocks with a page table; eliminates fragmentation. |
| Prefix caching | "Reuse long prompts" | Cache KV for a shared prefix across requests; major cost cut for agents. |
| Speculative decoding | "Draft + verify" | Cheap draft model proposes tokens; big model verifies k in one pass. |

## 더 많은 읽기

- [Dao et al. (2022). FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135) 플래시 1
- [Dao (2023). FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691) 플래시 2
- [Shah et al. (2024). FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision](https://arxiv.org/abs/2407.08608) 플래시 3
- [FlashAttention-4 release notes (Dao-AILab, 2026)](https://github.com/Dao-AILab/flash-attention) 블랙웰 5단계 파이프라인과 소프트웨어-exp2 트릭; 이 수업에서 언급된 앞선 발사 경고를 위해 repo README를 읽어보십시오.
- [Kwon et al. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) VLLM 종이
- [Leviathan et al. (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) 스펙 디코딩
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) 이 강의에서 인용되는 통합 초안 접근법에 대한 EAGLE-1/2 논문.
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) 메두사 접근법과 함께 언급된 이글.
- [vLLM docs — PagedAttention](https://docs.vllm.ai/en/latest/design/kernel/paged_attention.html) 16 토큰 블록과 페이지 테이블 디자인에 대한 가전적인 깊이 다이빙.
