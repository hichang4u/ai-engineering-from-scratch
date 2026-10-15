# 주의 변형  슬라이딩 창, Sparse, Diferential

> 모든 관심은 원입니다. 모든 토큰은 모든 토큰을 보고, 메모리는 그 가격을 지불합니다. 네 가지 변이는 원의 모양을 구부러서 절반의 비용을 회복합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head), Phase 7 · 12 (KV Cache / Flash Attention)
**Time:** ~60 minutes

## 문제

전체 주의 비용$O(N^2)$기억력 및$O(N^2)$128K 컨텍스트의 Llama 3 70B에 대해, 이것은 각 층에 16억 개의 관심 항목을 곱하기 80 층입니다. 플래시 관심 (강좌 12) 은 을 숨깁니다.$O(N^2)$활성화 메모리는 계산 비용을 변경하지 않습니다. 모든 토큰은 여전히 다른 토큰에 참여합니다.

변수들의 세 가지 클래스는 관심 매트릭스의 토폴로지 자체를 변화시킵니다.

1. **Sliding window attention (SWA).**각각의 토큰은 이웃의 고정된 창에 의해 표시됩니다. 전체 사전이 아닙니다. 메모리 및 계산은$O(N \cdot W)$어디$W$제마 2/3, 미스트랄 7B의 첫 층, Phi-3-Long
2. **Sparse / block attention.**선택된 쌍만`(i, j)`롱포머, 빅비드, 오픈AI 희소 트랜스포머
3. **Differential attention.**Q/K 프로젝션으로 두 개의 주의 지도를 계산하고, 하나를 다른 것에서 빼내십시오. 첫 몇 개의 토큰에 무게를 흘리는 "주의 시크"를 죽입니다. 마이크로소프트의 DIFF 트랜스포머 (2024).

이 두 가지 요소는 공존한다. 2026 국경 모델은 종종 그것들을 혼합한다. 대부분의 층은 SWA-1024, 5분의 1은 글로벌 전면 관심, 그리고 몇 가지는 검색을 청소하는 차분 머리입니다. Gemma 3의 5:1 SWA-글로벌 비율은 현재 교과서 기본입니다.

## 개념

### 슬라이딩 창 주의 (SWA)

위치에서 각 질의$i$$[i - W, i]$(사유적 SWA) 또는 $[i - W/2, i + W/2]$(비디렉션) 창 밖의 토큰은$-\infty$스코어 매트릭스에서

```
full causal:           sliding window (W=4):
positions 0-7          positions 0-7, W=4
    0 1 2 3 4 5 6 7        0 1 2 3 4 5 6 7
0 | x                0 |  x
1 | x x              1 |  x x
2 | x x x            2 |  x x x
3 | x x x x          3 |  x x x x
4 | x x x x x        4 |    x x x x
5 | x x x x x x      5 |      x x x x
6 | x x x x x x x    6 |        x x x x
7 | x x x x x x x x  7 |          x x x x
```

$N = 8192$그리고$W = 1024$, 점수 행렬은 예상에서 0이 아닌 1024 × 8192 줄이 있습니다  8 × 감소.

**KV cache shrinks with SWA.**마지막이$W$K 및 V의 토큰은 각 레이어에 따라 유지되어야 합니다. Gemma-3-ish 구성 (1024 창, 128K 컨텍스트) 에 대해, KV 캐시는 128x로 떨어집니다.

**Quality cost.**SWA 전 변환기는 장거리 검색에 어려움을 겪습니다. 해결 방법은 SWA 계층을 전체 주의 계층으로 쪼개는 것입니다. Gemma 3는 5:1 SWA:global을 사용합니다. 미스트랄 7B는 사유적 SWA 스택을 사용했습니다. 정보가 겹치는 창을 통해 "앞으로 흐른다"$W$그리고 그 후`L`모델이 참여할 수 있는 계층`L × W`토큰을 돌려보냅니다.

### 소박 / 차단 주의

선택해`N × N`시간보다 앞선 소소한 패턴입니다.

- **Local + strided (OpenAI sparse transformer).**마지막까지 지켜봐$W$토큰 + 모든 `stride`- 그 이전의 토큰.$O(N \cdot \sqrt{N})$계산
- **Longformer / BigBird.**로컬 윈도우 + 작은 글로벌 토큰 집합 (예를 들어 `[CLS]`) 를 모두 참여하고 모든 사람들이 참여하고 있습니다.
- **Native Sparse Attention (DeepSeek, 2025).**어떤 블록을 알아보세요`(Q, K)`핵 수준에서 0 블록을 건너뛰는 것

Sparse Attention는 커널 엔지니어링의 이야기입니다. 수학은 간단합니다 (점 매트릭스를 마스크하십시오); 승리는 SRAM에 절대 0 항목을 로드하지 않는 것입니다. 플래시 애트런션-3 및 2026 플렉스 애트런션 API는 PyTorch에서 커스터마이즈 스파르 패턴을 일급으로 만듭니다.

### 차별주의 (DIFF 트랜스포머, 2024)

규칙적인 관심은 "주의를 닦는" 문제를 가지고 있습니다. 소프트맥스는 모든 줄이 1으로 합당하도록 강요합니다. 따라서 특정 것을 보려고 하지 않는 토큰은 첫 번째 토큰 (또는 첫 몇 개의 토큰) 에서 무게를 덤프합니다. 이것은 실제 내용으로 가야 할 용량을 훔친다.

이 문제를 계산으로 해결합니다**two**주의 지도와 추수:

```math
\begin{aligned}
A_1 &= \mathop{\mathrm{softmax}}(Q_1 K_1^T / \sqrt{d}) \\
A_2 &= \mathop{\mathrm{softmax}}(Q_2 K_2^T / \sqrt{d}) \\
\text{DiffAttn} &= (A_1 - \lambda \cdot A_2) V
\end{aligned}
```

어디$\lambda$A1는 실제 내용 중량을 캡처하고 A2는 싱크를 캡처하고 있습니다. 추출은 싱크를 취소하고 무게를 관련 토큰으로 재배포합니다.

보고된 결과 (마이크로소프트 2024): 510% 더 낮은 혼란, 같은 훈련된 길이를 가진 1.52x 더 긴 효과적인 컨텍스트, 더 날카로운 바늘-이-하이 스택 검색.

### 다른 비교

| Variant | Compute | KV cache | Quality vs full | Production use |
|---------|---------|----------|-----------------|----------------|
| Full attention | $O(N^2)$ | $O(N)$ per layer | baseline | every model's default layer |
| SWA (window 1024) | $O(N \cdot W)$ | $O(W)$ per layer | -0.1 ppl, good with global layers | Gemma 2/3, Phi-3-Long |
| Local + strided sparse | $O(N \cdot \sqrt{N})$ | mixed | similar to SWA | OpenAI sparse transformer, Longformer |
| BigBird (local + global + random) | $O(N)$ approx | mixed | matches full at 2× context | early long-context BERT |
| Native Sparse (DeepSeek-V3.2) | $O(N \cdot \text{active fraction})$ | $O(N)$ | within 0.05 ppl | DeepSeek-V3.2, 2025 |
| Differential | $O(2 \cdot N^2)$ | $O(2N)$ | -5 to -10% ppl | DIFF Transformer, early 2026 models |

```figure
gqa-kv-sharing
```

## 건설 해

보시다시피`code/main.py`우리는 장난감 순서에서 전체, SWA, 로컬+스트레이드, 그리고 차분주의 주의를 옆으로 보여주는 인과적 마스크 비교기를 구현합니다.

### 단계 1: 완전한 인과성 마스크 (기본선)

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

7학습에서 출발한 기본 라인: 아래 삼각형; 지각 위에 무게는 0입니다.

### 단계 2: 슬라이딩 창의 인과 마스크

```python
def swa_mask(n, window):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
    return M
```

한 매개 변수`window`- `window >= n`이 모든 것은,`window = 1`, 각 토큰은 오직 자기 자신을 돌보아

### 단계 3: 로컬 + 스테디드 스파스 마스크

```python
def strided_mask(n, window, stride):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
        for j in range(0, i + 1, stride):
            M[i][j] = 0.0
    return M
```

밀집한 지역 창과 모든 `stride`-th 토큰은 순서 시작으로, 수신 필드는 추가 계층으로 로그 단계로 성장합니다.

### 단계 4: 차별적 관심

```python
def diff_attention(Q1, K1, Q2, K2, V, lam):
    A1 = softmax_causal(Q1 @ K1.T / sqrt_d)
    A2 = softmax_causal(Q2 @ K2.T / sqrt_d)
    return (A1 - lam * A2) @ V
```

두 개의 주의가 지나가면, 학습된 혼합 계수를 빼고, 코드에 집중-저하 열 지도를 비교하고, 싱글 vs 디페리셔널의 집중-저하 열 지도를 비교하고, 세탁기의 붕괴를 관찰합니다.

### 단계 5: KV 캐시 크기가

각 계층에 대한 캐시 크기를 에서 인쇄합니다$N = 131072$각 변종에 대해 SWA와 희귀 변종은 10~100x로 감소합니다.

## 사용 하 고

2026년 생산 패턴:

```python
from transformers import AutoModelForCausalLM
# Gemma 3 mixes SWA (window=1024) and global layers at 5:1.
model = AutoModelForCausalLM.from_pretrained("google/gemma-3-27b-it")
# print(model.config.sliding_window, model.config.layer_types)
```

FlexAttention PyTorch 2.5+에서는 마스크 기능이 적용됩니다.

```python
from torch.nn.attention.flex_attention import flex_attention, create_block_mask

def swa_pattern(b, h, q_idx, kv_idx):
    return (q_idx - kv_idx < 1024) & (q_idx >= kv_idx)

mask = create_block_mask(swa_pattern, B=batch, H=heads, Q_LEN=n, KV_LEN=n)
out = flex_attention(q, k, v, block_mask=mask)
```

이것은 사용자 지정 트리톤 커널로 컴파일됩니다. 일반적인 패턴에 대한 FlashAttention-3 속도 10% 이내에, 마스크 기능은 파이썬 호출이 가능합니다.

**When to pick each:**

- **Pure full attention** 각 계층에서 ~ 16K 컨텍스트까지, 또는 검색 품질이 가장 중요시될 때.
- **SWA + global mix** 긴 맥락 (>32K), 훈련 및 추론 메모리 제한. 2026 년 기본 32K 이상.
- **Sparse block attention** 사용자 지정 커널, 사용자 지정 패턴. 전문적인 작업 부하 (복원, 오디오) 에 예약되어 있습니다.
- **Differential attention** 주의를 하는 오염이 아프게 되는 모든 작업 부하 (장기 맥락 RAG,           

## 선박

보시다시피`outputs/skill-attention-variant-picker.md`. 이 기술은 목표 맥락 길이가, 검색 요구 사항 및 훈련/분명 계산 프로필을 고려하여 새로운 모델에 대한 관심 토폴로지를 선택합니다.

## 운동

1. **Easy.**달아`code/main.py`SWA를 확인하세요`window=4`마지막 4개의 토큰을 제외한 모든 것을 제로로 합니다. 확인하세요.`window=n`전체의 인과적 관심을 비트-동동적으로 재생합니다.
2. **Medium.**`window=1024`스케이퍼에서 1,000발을 훈련시켜요.
3. **Hard.**마-3형 5:1층 혼합 (5 SWA, 1 글로벌) 을 톱스톤 모델에 구현하십시오. 순수한 SWA와 순수한 글로벌 기본 라인에 비해 손실, 메모리 및 생성 품질을 일치하는 매개 변수와 비교하십시오.
4. **Hard.**학습자와 차별적 관심을 실천하라$\lambda$1인당. 합성 검색 작업 (일개의 바늘, 2,000 개의 방해 장치) 을 훈련하십시오. 일치하는 매개 변수에서 검색 정확성을 단일 주의 기본 라인과 측정하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Sliding window attention (SWA) | "Local attention" | Each query attends to its last $W$ tokens; KV cache shrinks to $O(W)$. |
| Effective receptive field | "How far back the model sees" | In an $L$-layer SWA stack with window $W$, up to $L \times W$ tokens. |
| Longformer / BigBird | "Local + global + random" | Sparse patterns with a few always-attending global tokens; early long-context approach. |
| Native Sparse Attention | "DeepSeek's kernel trick" | Learn block-level sparsity; skip zero blocks at the kernel level while keeping quality. |
| Differential attention | "Two maps, one subtracts" | DIFF Transformer: subtract a learned $\lambda$ times a second attention map from the first to cancel attention sinks. |
| Attention sink | "Weight bleeds to token 0" | Softmax normalization forces rows to sum to 1; uninformative queries dump weight on position 0. |
| FlexAttention | "Mask-as-Python" | PyTorch 2.5+ API that compiles arbitrary mask functions into FlashAttention-shape kernels. |
| Layer type mix | "5:1 SWA-to-global" | Interleave sparse and full attention layers in a stack to keep quality at lower memory. |

## 더 많은 읽기

- [Beltagy, Peters, Cohan (2020). Longformer: The Long-Document Transformer](https://arxiv.org/abs/2004.05150) 가톨릭 슬라이딩 윈도우 + 글로벌 토큰 종이
- [Zaheer et al. (2020). Big Bird: Transformers for Longer Sequences](https://arxiv.org/abs/2007.14062) 지역 + 글로벌 + 무작위
- [Child et al. (2019). Generating Long Sequences with Sparse Transformers](https://arxiv.org/abs/1904.10509) OpenAI의 로컬+스트레이드 패턴
- [Gemma Team (2024). Gemma 2: Improving Open Language Models at a Practical Size](https://arxiv.org/abs/2408.00118) 1:1 SWA: 글로벌 혼합
- [Gemma Team (2025). Gemma 3 technical report](https://arxiv.org/abs/2503.19786) 5:1 믹스와 윈도우=1024 이 이제 교과서 기본입니다.
- [Ye et al. (2024). Differential Transformer](https://arxiv.org/abs/2410.05258) DIFF 트랜스포머 종이
- [Yuan et al. (2025). Native Sparse Attention](https://arxiv.org/abs/2502.11089) DeepSeek-V3.2의 학습된 소박성 주의력
- [PyTorch — FlexAttention blog and docs](https://pytorch.org/blog/flexattention/) 사용 이 가능한 마스크 패턴에 대한 API 참조.
