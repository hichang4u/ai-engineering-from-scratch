# 위치 코딩  시누사이드, 로페, 알이비

> 주의는 변동-변동이 없습니다. "고양이 매트에 앉았다"와 "메트 온 세트 고양이"는 위치 신호 없이 동일한 출력을 생성합니다. 세 개의 알고리즘은 각각 " 위치"의 의미에 대한 다른 베팅으로 그것을 수정합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention)
**Time:** ~45 minutes

## 문제

점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점 점`softmax(Q K^T / √d) V`이 식은 쌍방향 유사성에서 계산됩니다.`X`이 모든 점들은 모두 같은 방식으로 움직여서

이것은 단어의 가방 모델의 오류가 아닙니다. 언어, 코드, 오디오, 비디오에 있어서

3개의 해답의 시대는 다음과 같습니다.

1. **Absolute sinusoidal**(바스바니 2017) 에 추가 `sin/cos`단순하고 학습할 수 없는, 훈련된 길이를 넘어서는
2. **RoPE — Rotary Position Embeddings**Q와 K 벡터를 위치와 비례한 각으로 회전한다. 점수산물에 직접 * 상대적* 위치를 암호화한다. 2026년에 지배적이다.
3. **ALiBi — Attention with Linear Biases**(Press 2022). 임베디션을 완전히 건너뛰어; 거리에 따라 주의 점수를 기준으로 한 헤드 선형 페널티 추가합니다.

2026년 현재, 기본적으로 모든 국경 개방형 모델은 RoPE를 사용합니다: Llama 2/3/4, Qwen 2/3, Mistral, Mixtral, DeepSeek-V3, Kimi. 몇 개의 긴 맥락 모델은 ALiBi 또는 현대 변종을 사용합니다. 절대적 시누사이드는 역사적입니다.

## 개념

![Sinusoidal absolute vs RoPE rotations vs ALiBi distance bias](../assets/positional-encoding.svg)

### 절대적 시누스오이드

고정 매트릭스를 미리 계산합니다`PE`모양의`(max_len, d_model)`이 부분의 본문은

```math
\begin{aligned}
PE_{(pos, 2i)} &= \sin\left(pos / 10000^{2i / d_{\text{model}}}\right) \\
PE_{(pos, 2i+1)} &= \cos\left(pos / 10000^{2i / d_{\text{model}}}\right)
\end{aligned}
```

그럼`X' = X + PE[:N]`각 차원은 다른 주파수에서 시노소이드입니다. 모델은 단계 패턴에서 위치를 읽을 수 있습니다.`max_len`: 모델은 02047 위치만 보았을 때 2048 위치에서 무슨 일이 일어나는지 아무 것도 말하지 않았습니다.

### 로페

Q와 K 벡터를 회전합니다.$(2i, 2i+1)$이 부분의 본문은

```math
\begin{bmatrix} q'_{2i} \\ q'_{2i+1} \end{bmatrix} = \begin{bmatrix} \cos(pos \cdot \theta_i) & -\sin(pos \cdot \theta_i) \\ \sin(pos \cdot \theta_i) & \cos(pos \cdot \theta_i) \end{bmatrix} \begin{bmatrix} q_{2i} \\ q_{2i+1} \end{bmatrix}
\qquad \theta_i = \text{base}^{-2i / d_{\text{head}}}, \quad \text{base} = 10000 \text{ by default}
```

위치와 함께 있는 키에 동일한 회전력을 적용합니다 `pos_k`. 점수 제품$q'_m \cdot k'_n$$(m - n)$혼자, 즉:**the attention score depends only on the relative distance**하지만 순환은 절대적인 위치에서 차단되어 있었습니다.

RoPE의 연장: `base`Llama 3는 8K에서 128K 컨텍스트로 확장되었습니다.

### 알리비

융합 트릭을 건너뛰면 주의율이 바로

```math
\text{attn\_score}[i, j] = \frac{q_i \cdot k_j}{\sqrt{d}} - m_h \cdot |i - j|
```

어디$m_h$머리별로 특정 기울기 (예를 들어 $1 / 2^{8h/H}$) 더 가까운 토큰은 강화되고, 먼 토큰은 처벌됩니다. 훈련 시간 비용은 없습니다. 논문에서는 길이가 추출되는 것을 시누스형으로 비치고 원래 훈련된 길이에 로페와 일치합니다.

### 2026년에 무엇을 선택해야 하는가

| Variant | Extrapolation | Training cost | Used by |
|---------|---------------|---------------|---------|
| Absolute sinusoidal | poor | free | original transformer, early BERT |
| Learned absolute | none | tiny | GPT-2, GPT-3 |
| RoPE | good with scaling | free | Llama 2/3/4, Qwen 2/3, Mistral, DeepSeek-V3, Kimi |
| RoPE + YaRN | excellent | fine-tune stage | Qwen2-1M, Llama 3.1 128K |
| ALiBi | excellent | free | BLOOM, MPT, Baichuan |

로페는 건축을 바꾸지 않고 주목을 끌고 상대적인 위치를 암호화하고`base`하이퍼파라미터는 긴 맥락을 정밀하게 조정할 수 있는 깨끗한 버튼을 제공합니다.

```figure
rope-explorer
```

## 건설 해

### 단계 1: 시누스오이드 코딩

보시다시피`code/main.py`4선 계산:

```python
def sinusoidal(N, d):
    pe = [[0.0] * d for _ in range(N)]
    for pos in range(N):
        for i in range(d // 2):
            theta = pos / (10000 ** (2 * i / d))
            pe[pos][2 * i]     = math.sin(theta)
            pe[pos][2 * i + 1] = math.cos(theta)
    return pe
```

첫 번째 주의층 전에 임베디션 매트릭스에 추가하십시오.

### 단계 2: Q, K에 적용된 RoPE

RoPE는 Q 및 K에서 현장에서 작동합니다. 각 이미스 쌍에 대해:

```python
def apply_rope(x, pos, base=10000):
    d = len(x)
    out = list(x)
    for i in range(d // 2):
        theta = pos / (base ** (2 * i / d))
        c, s = math.cos(theta), math.sin(theta)
        a, b = x[2 * i], x[2 * i + 1]
        out[2 * i]     = a * c - b * s
        out[2 * i + 1] = a * s + b * c
    return out
```

결정적: 같은 함수를 Q에 위치에서 적용합니다 $m$그리고 K가 위치에서$n$그들의 점 제품들은 $\cos((m-n) \cdot \theta_i)$각 좌표쌍에 있는 요소. 주의는 상대적인 위치를 무료로 학습합니다.

### 단계 3: ALiBi 기울기와 편향

```python
def alibi_bias(n_heads, seq_len):
    # slope_h = 2 ** (-8 * h / n_heads) for h = 1..n_heads
    slopes = [2 ** (-8 * (h + 1) / n_heads) for h in range(n_heads)]
    bias = []
    for m in slopes:
        row = [[-m * abs(i - j) for j in range(seq_len)] for i in range(seq_len)]
        bias.append(row)
    return bias  # add to attention scores before softmax
```

추가`bias[h]``(seq_len, seq_len)`주의점 득점 매트릭스`h`, 그리고 소프트맥스

### 단계 4: 로페의 상대적인 거리의 성질을 확인

두 개의 벡터를 선택하세요`a, b` `(pos_a, pos_b)`- 그럼`(pos_a + k, pos_b + k)`. 두 점 제품 모두 부동점 오류 내에서 일치해야 합니다. 이 속성은 RoPE의 전체 점입니다.

## 사용 하 고

파이토치 2.5+는 RoPE 유틸리티를`torch.nn.functional`대부분의 생산 코드 사용`flash_attn`또는`xformers`RoPE가 주의 커널 내부에 적용되는 경우

```python
from transformers import AutoModel
model = AutoModel.from_pretrained("meta-llama/Llama-3.2-3B")
# model.config.rope_scaling → {"type": "yarn", "factor": 32.0, "original_max_position_embeddings": 8192}
```

**Long-context tricks in 2026:**

- **NTK-aware interpolation.**재배량`base` `base * (scale_factor)^(d/(d-2))`4K에서 16K+까지 확장할 때
- **YaRN.**더 똑똑한 인터폴레이션으로 긴 맥락에서 주의를 보존할 수 있습니다. Llama 3.1 128K는 그것을 사용합니다.
- **LongRoPE.**마이크로소프트의 2024 메소드, 진화 검색을 사용하여 각 차원 규모의 요소를 선택합니다. Phi-3-Long는 그것을 사용합니다.
- **Position interpolation + fine-tuning.**포지션을 확장 요소로 줄이고 15B 토큰을 위해 정렬해 보세요. 놀랍도록 효과적입니다.

## 선박

보시다시피`outputs/skill-positional-encoding-picker.md`. 기술은 목표 맥락 길이가, 추출 필요성 및 교육 예산에 따라 새로운 모델에 대한 코딩 전략을 선택합니다.

## 운동

1. **Easy.**시노수이드 `PE` 열 지도로 매트릭스`max_len=512, d=128`"차원 지표가 커질수록 줄기 넓어진다"라는 패턴을 확인해 보세요.
2. **Medium.**NTK에 대한 인식이 있는 RoPE 스케일링을 구현하고, 길이 256의 연속에 작은 LM를 훈련시키고, 길이 1024에 스케일링과 없이 테스트하고, 복잡성을 측정합니다.
3. **Hard.**ALiBi와 RoPE를 같은 주의 모듈에 구현합니다. 4 층 트랜스포머를 길이가 512의 염기서열으로 복사 작업에 훈련하십시오. 테스트 시 2048에 추출하십시오. 퇴화 비교합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Positional encoding | "Tells attention about order" | Any signal added to embeddings or attention that encodes position. |
| Sinusoidal | "The original one" | `sin/cos` at geometric frequencies added to embeddings; doesn't extrapolate. |
| RoPE | "Rotary embeddings" | Rotate Q, K by position-dependent angle; dot product encodes relative distance. |
| ALiBi | "Linear bias trick" | Add $-m \cdot \lvert i-j \rvert$ to attention scores; no embedding needed, great extrapolation. |
| base | "RoPE's knob" | The frequency scaler in RoPE; increase to extend context at inference. |
| NTK-aware | "A RoPE scaling trick" | Rescale `base` so high-frequency dims aren't squeezed when context expands. |
| YaRN | "The fancy one" | Per-dimension interpolation+extrapolation that preserves attention entropy. |
| Extrapolation | "Works beyond trained length" | Can the position scheme serve correct output past `max_len` seen in training? |

## 더 많은 읽기

- [Vaswani et al. (2017). Attention Is All You Need §3.5](https://arxiv.org/abs/1706.03762) 원래의 시누사이드
- [Su et al. (2021). RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864) RoPE 종이
- [Press, Smith, Lewis (2021). Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409) ALiBi
- [Peng et al. (2023). YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071) 최첨단 로페 스케일링
- [Chen et al. (2023). Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595) 메타의 람마 2 장 контекст 논문
- [Ding et al. (2024). LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens](https://arxiv.org/abs/2402.13753) Phi-3-Long이 사용하는 마이크로소프트 방법, 그리고 사용 이 섹션에서 인용.
- [HuggingFace Transformers — `modeling_rope_utils.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/modeling_rope_utils.py) 모든 RoPE 스케일링 스키마 (전립, 선형, 역동, YaRN, LongRoPE, Llama-3) 의 생산급 구현
