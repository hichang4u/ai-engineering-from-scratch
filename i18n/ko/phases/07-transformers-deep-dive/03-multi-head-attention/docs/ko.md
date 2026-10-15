# 여러 머리 에 대한 관심

> 한 명씩 주의를 기울이는 머리는 한 관계로 배웁니다. 8 명씩 배웁니다. 8 명씩 자유롭게 배웁니다. 더 많은 것을 가져보세요.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention from Scratch)
**Time:** ~75 minutes

## 문제

하나의 자기주의 머리는 하나의 주의 매트릭스를 계산합니다. 그 매트릭스는 하나의 종류의 관계를 캡처합니다. 일반적으로 훈련 신호가 무엇이든 손실을 최소화하는 것입니다. 데이터에는 주체-사절 합의, 공동 참조, 장거리 담론 및 문법 쪼개기가 모두 얽혀있는 경우, 하나의 머리는 그것들을 하나의 부드러운 최대 분포로 매우며 신호의 절반을 잃습니다.

2017년 바스바니 논문에서 나온 수정: 각자의 Q, K, V 투명과 함께 여러 개의 주의 기능을 병렬적으로 실행하고 출력들을 연결합니다. 각 헤드는 더 작은 차원의 하위 공간에서 작동합니다.$d_{\text{model}} / n_{\text{heads}}$전체 매개 변수는 동일합니다.

멀티 헤드 관심은 2026년 선박의 모든 트랜스포머의 기본이다. 유일한 논쟁은 * 얼마나 많은 헤드 그리고 키와 값이 예측을 공유하는지 (그룹화 질의 관심, 멀티 질의 관심, 멀티 헤드 잠자리 관심) 에 관한 것입니다.

## 개념

![Multi-head attention splits, attends, concatenates](../assets/multi-head-attention.svg)

**Split.**이봐`X`모양의`(N, d_model)`. Q, K, V에 대한 프로젝트 각 모양`(N, d_model)`- `(N, n_heads, d_head)`어디$d_{\text{head}} = d_{\text{model}} / n_{\text{heads}}$- 이식`(n_heads, N, d_head)`- 그래

**Attend in parallel.**각 머릿속의 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점`(N, d_head)`머리는 임베디션의 다른 하위 공간에서 작동하고 주의 계산 자체를 통해 절대 말하지 않습니다.

**Concatenate and project.**이 다시 으로 돌아갑니다`(N, d_model)`그리고 학습된 출력 매트릭스에 곱합니다 `W_o`모양의`(d_model, d_model)`-`W_o`머리가 섞이는 곳이죠.

**Why it works.**각 머리들은 대표적인 예산에 대해 다른 사람과 경쟁하지 않고 전문성을 가질 수 있다. 2019~2024년대의 탐사 연구는 위치적인 머리, 이전 토큰을 보시는 머리, 복사 머리, 이름의 단체가 있는 머리, 인덕션 머리 (이 컨텍스트 학습에 기반하는) 를 나타내는 서로 다른 머리 역할들을 보여줍니다.

**The 2026 lineage of variations:**

| Variant | Q heads | K/V heads | Used by |
|---------|---------|-----------|---------|
| Multi-head (MHA) | N | N | GPT-2, BERT, T5 |
| Multi-query (MQA) | N | 1 | PaLM, Falcon |
| Grouped-query (GQA) | N | G (e.g. N/8) | Llama 2 70B, Llama 3+, Qwen 2+, Mistral |
| Multi-head latent (MLA) | N | compressed to low-rank | DeepSeek-V2, V3 |

GQA는 KV 캐시 메모리를 $N/G$MLA는 K/V를 잠그어진 공간으로 압축하고, 계산 시간에 다시 프로젝하는 것을 통해 더 많은 메모리를 절약합니다.

```figure
multihead-split
```

## 건설 해

### 1단계: 이미 가지고 있는 단독 관심에서 머리를 분리

 `SelfAttention`2번 수업에서 2번 수업에서 2번 수업에서 2번 수업에서 2번 수업을`code/main.py`이 없는 구현을 위한 논리:

```python
def split_heads(X, n_heads):
    n, d = X.shape
    d_head = d // n_heads
    return X.reshape(n, n_heads, d_head).transpose(1, 0, 2)  # (heads, n, d_head)

def combine_heads(H):
    h, n, d_head = H.shape
    return H.transpose(1, 0, 2).reshape(n, h * d_head)
```

한 번 재구성하고 한 번 옮기죠. 루프가 없습니다. 바로 PyTorch이 하는 일이죠.`nn.MultiheadAttention`- 그래

### 단계 2: 각 사람당 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점

각 머리는 Q, K, V의 조각을 얻습니다. 주의는 뭉쳐있는 매뮬이 됩니다.

```python
def mha_forward(X, W_q, W_k, W_v, W_o, n_heads):
    Q = X @ W_q
    K = X @ W_k
    V = X @ W_v
    Qh = split_heads(Q, n_heads)         # (heads, n, d_head)
    Kh = split_heads(K, n_heads)
    Vh = split_heads(V, n_heads)
    scores = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(Qh.shape[-1])
    weights = softmax(scores, axis=-1)
    out = weights @ Vh                    # (heads, n, d_head)
    concat = combine_heads(out)
    return concat @ W_o, weights
```

진짜 하드웨어`Qh @ Kh.transpose(...)`한 개`bmm`GPU는 하나의 배팅 매뮬러를 볼 수 있습니다`(heads, N, d_head) × (heads, d_head, N) -> (heads, N, N)`- 헤드 추가는 무료입니다.

### 단계 3: 그룹-쿼리 주의 변종

키와 값 예측만 변화합니다. Q는 `n_heads`그룹: K 및 V`n_kv_heads < n_heads`그룹으로 반복하여 일치합니다.

```python
def gqa_project(X, W, n_kv_heads, n_heads):
    kv = split_heads(X @ W, n_kv_heads)       # (kv_heads, n, d_head)
    repeat = n_heads // n_kv_heads
    return np.repeat(kv, repeat, axis=0)      # (n_heads, n, d_head)
```

결론적으로 이것은 기억을 절약합니다. 왜냐하면`n_kv_heads`KV 캐시에 있는 복사본은`n_heads`Llama 3 70B는 64개의 쿼리 헤드와 8개의 KV 헤드와 8배의 캐시 을 사용합니다.

### 4단계: 각 머리마다 배운 것을 조사

4개의 머리 (head) 을 가진 짧은 문장을 MHA로 실행하세요. 각 머리 (head) 에 대해`(N, N)`주의 행렬. 여러분은 다른 헤드를 볼 수 있습니다. 무작위로 시작해서도 다른 구조를 선택합니다. 부분적으로 신호, 부분적으로 주전적 대칭입니다.

## 사용 하 고

PyTorch에서, 한 줄 버전:

```python
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=512, num_heads=8, batch_first=True)
```

PyTorch 2.5+의 GQA:

```python
from torch.nn.functional import scaled_dot_product_attention

# scaled_dot_product_attention auto-dispatches Flash Attention on CUDA.
# For GQA, pass Q of shape (B, n_heads, N, d_head) and K,V of shape
# (B, n_kv_heads, N, d_head). PyTorch handles the repeat.
out = scaled_dot_product_attention(q, k, v, is_causal=True, enable_gqa=True)
```

**How many heads?**2026년 생산 모델의 엄지 손가락 규칙:

| Model size | d_model | n_heads | d_head |
|------------|---------|---------|--------|
| Small (~125M) | 768 | 12 | 64 |
| Base (~350M) | 1024 | 16 | 64 |
| Large (~1B) | 2048 | 16 | 128 |
| Frontier (~70B) | 8192 | 64 | 128 |

`d_head`거의 항상 64 또는 128에 착륙합니다. 이것은 한 머리가 얼마나 "보실 수" 있는지의 단위입니다. 32 아래로 떨어지면 머리는 확장 요소를 싸우는 것을 시작합니다.$\sqrt{d_{\text{head}}}$256개 이상의 경우 "많은 작은 전문인" 혜택을 잃게 됩니다.

## 선박

보시다시피`outputs/skill-mha-configurator.md`. 기술은 매개체 개량, kv-head 개량 및 새로운 트랜스포머에 대한 투사 전략을 권장합니다. 매개체 예산, 염기 길이 및 배포 목표에 따라.

## 운동

1. **Easy.**MHA를 가져가라`code/main.py`그리고 변화`n_heads`1~16까지`d_model=64`인공 복사 작업에 작은 단층 모델의 손실을 계획하세요. 더 많은 머리가 도움이 되거나, 고층이 되거나, 상처를 입나요?
2. **Medium.**MQA (모든 쿼리 헤드에서 공유되는 한 KV 헤드) 를 구현하십시오. 매개 변수 수치가 얼마나 떨어지는지 vs. 전체 MHA를 측정하십시오. N=2048의 추론에서 KV 캐시 크기가 얼마나 줄어든가를 계산하십시오.
3. **Hard.**멀티 헤드 라텐트 주의의 작은 버전을 구현합니다. K,V를 랭크로 압축합니다.`r`잠잠한 상태에서 KV 캐시에 저장하고, 주의 시간에 압축을 해제합니다.`r`캐시 메모리는 전체 MHA의 1/8 이하로 넘어가고 품질은 검증 시 1 비트 이내에 유지되는가?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Head | "A single attention circuit" | One Q/K/V projection of dimension $d_{\text{head}} = d_{\text{model}} / n_{\text{heads}}$ with its own attention matrix. |
| d_head | "Head dimension" | Per-head hidden width; almost always 64 or 128 in production. |
| Split / combine | "Reshape tricks" | `(N, d_model) ↔ (n_heads, N, d_head)` reshape+transpose around attention. |
| W_o | "Output projection" | `(d_model, d_model)` matrix applied after concatenating heads; where heads mix. |
| MQA | "One KV head" | Multi-Query Attention: single shared K/V projection. Smallest KV cache, some quality loss. |
| GQA | "The default since Llama 2" | Grouped-Query Attention with `n_kv_heads < n_heads`; repeats to match Q. |
| MLA | "DeepSeek's trick" | Multi-head Latent Attention: K,V compressed to low-rank latent, decompressed at attend time. |
| Induction head | "The circuit behind in-context learning" | A pair of heads that detect previous occurrences and copy what followed them. |

## 더 많은 읽기

- [Vaswani et al. (2017). Attention Is All You Need §3.2.2](https://arxiv.org/abs/1706.03762) 원래의 다발면 스펙
- [Shazeer (2019). Fast Transformer Decoding: One Write-Head is All You Need](https://arxiv.org/abs/1911.02150) MQA 논문
- [Ainslie et al. (2023). GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245) 훈련 후 MHA를 GQA로 변환하는 방법
- [DeepSeek-AI (2024). DeepSeek-V2 Technical Report](https://arxiv.org/abs/2405.04434) MLA와 왜 캐시 메모리에 MHA/GQA를 이길 수 있는지
- [Olsson et al. (2022). In-context Learning and Induction Heads](https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html) 머리가 실제로 하는 것을 기계적으로 살펴보세요.
