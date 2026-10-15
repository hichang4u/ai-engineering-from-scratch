# 전문가들의 혼합 (MoE)

> 밀집 70B 트랜스포머는 모든 토큰의 모든 매개 변수를 활성화합니다. 671B MoE는 토큰당 37B만 활성화하고 모든 벤치마크에서 이길 수 있습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 07 (GPT)
**Time:** ~45 minutes

## 문제

밀집 트랜스포머의 FLOPs는 그 매개 변수 수와 같을 수 있습니다. 밀집 트랜스포머의 FLOPs는 그 매개 변수 수와 같을 수 있습니다. 밀집 트랜스포머의 FLOPs는 2배로 전진 합격합니다. 밀집 모델의 규모를 확장하여 모든 토큰이 전체 청구서를 지불합니다. 2024 년까지 국경은 컴퓨팅 벽에 타격했습니다. 의미있는 스마트하기 위해, 토큰 당 기하급수적으로 더 많은 FLOPs가 필요합니다.

전문가들의 혼합은 이 연결을 깨고 각 FFN를$E$독립적인 전문가 + 선택하는 라우터 $k$토큰별 전문가.$E \times \text{FFN size}$. 토큰당 활성 매개 변수 = $k \times \text{FFN size}$. 전형적인 2026 구성: $E=256$$k=8$ $E$, 계산 스케일 $k$- 그래

2026년 국경은 거의 전적으로 MoE: 딥시크-V3 (671B 총 / 37B 활성), 믹스트랄 8×22B, Qwen2.5-MoE, 라마 4, 키미 K2, gpt-oss이다. 인공 분석의 독립적인 리더보드에서, 10대 오픈 소스 모델은 모두 MoE이다.

## 개념

![MoE layer: router selects k of E experts per token](../assets/moe.svg)

### FFN 교환

밀집 변압기 블록:

```
h = x + attn(norm(x))
h = h + FFN(norm(h))
```

MOE 블록:

```
h = x + attn(norm(x))
scores = router(norm(h))              # (N_tokens, E)
top_k = argmax_k(scores)              # pick k of E per token
h = h + sum_{e in top_k}(
        gate(scores[e]) * Expert_e(norm(h))
    )
```

각 전문가는 독립적인 FFN (일반적으로 SwiGLU) 이다. 라우터는 단일 선형 층이다. 각 토큰은 자신의 선택 `k`전문가들이 그들의 출력들을  수 있는

### 로드 배정 문제

로우터가 90%의 토큰을 전문가 3를 통해 내면 다른 전문가들은 굶어죽는다.

1. **Auxiliary load-balancing loss**(Switch Transformer, Mixtral) 전문가 사용의 변동에 비례한 벌금을 추가합니다. 작동하지만 하이퍼 파라미터와 두 번째 기하 신호를 추가합니다.
2. **Expert capacity + token dropping**(초기 스위치) 전문가들 중 한 명이 가장$C \times N/E$토큰, 과잉 토큰은 계층을 넘지 않습니다. 품질을 손상시킵니다.
3. **Auxiliary-loss-free balancing**(DeepSeek-V3) 로우터의 상위 k 선택을 변경하는 학습된 전문가별 편향을 추가합니다. 편향은 훈련 손실 이외에 업데이트됩니다. 주요 목표에 대한 벌금이 없습니다. 2024 년 큰 잠금입니다.

딥시크-V3의 접근 방식: 각 훈련 단계 후, 각 전문가에게, 사용량이 목표보다 높거나 낮는지 확인합니다.`±γ`선택 용어`scores + bias`. 게팅에 사용되는 전문가 확률은 원료입니다`scores`변하지 않고, 표현에서 분리된 라우팅

### 공유 전문가

DeepSeek-V2/V3는 또한 전문가들을 *공유* 및 *로우드*로 나눈다. 모든 토큰은 모든 공유 전문가들을 통해 통과한다. 로우드 전문가들은 상위 k를 통해 선택된다. 공유 전문가들은 일반적인 지식을 포착하고, 라우드 전문가들은 전문성을 갖는다. V3는 1 공유 전문가와 256 로우드 중 상위 8명을 실행한다.

### 미세한 곡물 전문가

클래식 MoE (GShard, Switch): 각 전문가의 폭은 전체 FFN만큼입니다. `E`작은 (864), `k`작은 (12) 이다.

현대 미세 곡물 MoE (DeepSeek-V3, Qwen-MoE): 각 전문가의 크기는 좁습니다 (1/8 FFN 크기가). $E$크다 (256+), $k$더 큰 (8+) 은 동일한 전체 매개 변수이지만 조합은 훨씬 더 빨리 확장됩니다. $\binom{256}{8} \approx 400$토큰당 1조원 정도의 전문가들이 존재할 수 있습니다. 품질이 높아지고, 지연은 일정합니다.

### 비용 프로파일

토큰, 계층:

| Config | Active params / token | Total params |
|--------|-----------------------|--------------|
| Mixtral 8×22B | ~39B | 141B |
| Llama 3 70B (dense) | 70B | 70B |
| DeepSeek-V3 | 37B | 671B |
| Kimi K2 (MoE) | ~32B | 1T |

딥시크-V3는 거의 모든 기준에서 Llama 3 70B를 제치고 있습니다.**fewer active FLOPs per token**더 많은 매개 변수 = 더 많은 지식 더 많은 활동적인 FLOP = 더 많은 토큰 계산. MoE는 그것들을 분리합니다.

### 기억력

모든 전문가들은 어떤 GPU를 사용하든 상관없이 GPU에 사용한다. 671B 모델은 fp16 무게에 ~ 1.3 TB의 VRAM가 필요합니다. 국경 MoE 배포는 전문가 평행성을 필요로 합니다.

```figure
expert-routing
```

## 건설 해

보시다시피`code/main.py`. 순수한 Stdlib에 있는 콤팩트 MoE 층

- `n_experts=8`SWIGLU 전문가 (선형별로 하나씩, 예로)
- 상위 k=2 라우팅
- 소프트맥스 정상화된 게팅 무게
- 전문가별 편향을 통해 보조 손실 없는 균형

### 단계 1: 라우터

```python
def route(hidden, W_router, top_k, bias):
    scores = [sum(h * w for h, w in zip(hidden, W_router[e])) for e in range(len(W_router))]
    biased = [s + b for s, b in zip(scores, bias)]
    top_idx = sorted(range(len(biased)), key=lambda i: -biased[i])[:top_k]
    # softmax over ORIGINAL scores of the chosen experts
    chosen = [scores[i] for i in top_idx]
    m = max(chosen)
    exps = [math.exp(c - m) for c in chosen]
    s = sum(exps)
    gates = [e / s for e in exps]
    return top_idx, gates
```

편향은 선택에 영향을 미치지만 게이트 중력에 영향을 미치지 않습니다. 이것은 DeepSeek-V3 트릭입니다.

### 단계 2: 라우터를 통해 100 개의 토큰을 실행하십시오

어떤 전문가들이 얼마나 자주 발사하는지 추적합니다. 편향 없이 사용은 편향됩니다. 편향 업데이트 루프 (`-γ`과잉 사용된 전문가들`+γ`사용은 몇 번의 반복에 걸쳐 균일한 분포로 konverges.

### 단계 3: 파라마  카운트 비교

MoE 구성의 "거밀한 동등"을 인쇄하십시오. DeepSeek-V3 모양: 256 로우팅 + 1 공유, 8 활성, d_model = 7168. 전체 매개 변수 수는 눈길을 끄는 것입니다. 활성 수는 밀집한 Llama 3 70B의 일곱 번째입니다.

## 사용 하 고

HuggingFace 로딩:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("mistralai/Mixtral-8x22B-v0.1")
```

2026 생산 추론: vLLM는 MoE 라우팅을 네이티브로 지원합니다. SGLang은 가장 빠른 전문가-상동 경로를 가지고 있습니다. 두 가지 모두 자동으로 TOP-k 선택과 전문가 병동성을 처리합니다.

**When to pick MoE:**
- 당신은 토큰 당 낮은 추론 비용으로 한계 품질을 원합니다.
- 여러분은 VRAM/전문자 평행 인프라를 가지고 있습니다.
- 작업량은 토큰 (토큰, 코드) 과 관련 (장 긴 문서) 과 관련되지 않습니다.

**When NOT to pick MoE:**
- 가장자리 배포  어떤 활동적인 FLOP에 대한 전체 저장 비용을 지불합니다.
-  전문가 라우팅을 서비스하는 단 사용자 중 Latency-critical 오버헤드를 추가합니다.
- 작은 모델 (<7B)  MoE의 품질 우상은 계산 문턱 (~6B 활성 파라미) 이상으로만 나타난다.

## 선박

보시다시피`outputs/skill-moe-configurator.md`. 기술 은 새로운 미에 기원 예산, 훈련 토큰 및 배포 목표 를 위해 E, k, 공유 전문가 레이아웃 을 선택 합니다.

## 운동

1. **Easy.**달아`code/main.py`보조 손실 없는 편향 업데이트는 50번 이상 전문가 사용량을 조정하는 방법을 보세요.
2. **Medium.**학습된 라우터를 해시 기반 라우터 (결정적, 학습이 없다) 로 대체하십시오. 품질과 균형을 비교하십시오. 학습된 라우터는 왜 더 나은가?
3. **Hard.**GRPO 방식의 "롤러웃-마칭 라우팅" (DeepSeek-V3.2 트릭) 을 구현: 추론 과정에서 전문가들이 발사하는 로그, 그라디언트 계산 중에 동일한 라우팅을 강요. 장난감 정책-그라디언트 설정에 미치는 영향을 측정한다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Expert | "One FFN among many" | An independent feed-forward network; parameters dedicated to a sparse slice of the FFN computation. |
| Router | "The gate" | A tiny linear layer that scores each token against each expert; top-k selection. |
| Top-k routing | "k active experts per token" | Each token's FFN computation goes through exactly k experts, weighted by gate. |
| Auxiliary loss | "Load-balance penalty" | Extra loss term that penalizes skewed expert usage. |
| Auxiliary-loss-free | "DeepSeek-V3's trick" | Balance via per-expert bias on the router's selection only; no extra gradient. |
| Shared expert | "Always on" | Extra expert through which every token passes; captures common knowledge. |
| Expert parallelism | "Shard by expert" | Distribute different experts to different GPUs; route tokens across the network. |
| Sparsity | "Active params < total params" | The ratio $k \times \text{expert size} / (E \times \text{expert size})$; 37/671 ≈ 5.5% for DeepSeek-V3. |

## 더 많은 읽기

- [Shazeer et al. (2017). Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer](https://arxiv.org/abs/1701.06538) 아이디어
- [Fedus, Zoph, Shazeer (2022). Switch Transformer: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://arxiv.org/abs/2101.03961) 스위치, 클래식 MoE
- [Jiang et al. (2024). Mixtral of Experts](https://arxiv.org/abs/2401.04088)            
- [DeepSeek-AI (2024). DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) MLA + 보조 손실 없는 MoE + MTP.
- [Wang et al. (2024). Auxiliary-Loss-Free Load Balancing Strategy for Mixture-of-Experts](https://arxiv.org/abs/2408.15664) 편향 기반 균형 종이
- [Dai et al. (2024). DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://arxiv.org/abs/2401.06066) 이 강의 라우터 사용은 미세한 곡물 + 공유 전문가 분할.
- [Kim et al. (2022). DeepSpeed-MoE: Advancing Mixture-of-Experts Inference and Training](https://arxiv.org/abs/2201.05596) 본래 공유된 전문가 논문
