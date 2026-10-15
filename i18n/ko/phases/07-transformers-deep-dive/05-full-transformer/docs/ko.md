# 전체 트랜스포머      

> 주의는 별입니다. 다른 모든 것  잔재, 정상화, 전력, 간접주의는

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention), Phase 7 · 04 (Positional Encoding)
**Time:** ~75 minutes

## 문제

하나의 관심층은 특징 추출기, 모델이 아닙니다. 한 층에 한 매트무일은 언어 용량에 충분하지 않습니다. 올바른 파이프링 없이 깊이  및 깊이 파업이 필요합니다.

2017년 바스바니 논문에서는 하나의 주의층을 겹치기 가능한 블록으로 바꾸는 6가지 디자인 결정을 포장했다.  앵코더-일 (BERT), 디코더-일 (GPT), 앵코더-디코더 (T5)  이후 모든 트랜스포머는 동일한 골격을 물려받는다. 2026년에는 블록이 정비되었다 (RMSNorm, SwiGLU, 프리-노르름, RoPE) 하지만 골격은 동일하다.

이 수업은 골격입니다. 다음 수업은  06을 코더, 07을 디코더, 08을 코더-디코더로 전문화합니다.

## 개념

![Encoder and decoder block internals, wired](../assets/full-transformer.svg)

### 6개의 조각

1. **Embedding + positional signal.**로페 (현대) 또는 시노스오이드 (고전) 를 통해 주입된 위치.
2. **Self-attention.**각 위치가 다른 위치로 연결돼 있습니다.
3. **Feed-forward network (FFN).**위치적으로 두층 MLP: `W_2 · activation(W_1 · x)`. 전작으로 확장 비율은 4x
4. **Residual connection.** `x + sublayer(x)`이 없이 gradients는 6층이 지나서 사라집니다.
5. **Layer normalization.** `LayerNorm`또는`RMSNorm`(현대) 잔류 흐름을 안정시킵니다.
6. **Cross-attention (decoder only).**쿼리는 디코더, 키 및 쿼리 값에서 나온다.

한 블록을 통해 벡터 흐름을 관찰하십시오. 주의는 위치들을 섞어, 잔류는 그것을 앞으로 옮기고, FFN는 그것을 변환하고, 정상은 흐름을 안정적으로 유지합니다.

```figure
transformer-block
```

### 코더 블록 (BERT, T5 코더에서 사용된다)

```
x → LN → MHA(self) → + → LN → FFN → + → out
                     ^              ^
                     |              |
                     └── residual ──┘
```

코딩은 양방향이고 마스크가 없습니다. 모든 위치에서 모든 위치를 볼 수 있습니다.

### 디코더 블록 (GPT, T5 디코더에서 사용된다)

```
x → LN → MHA(masked self) → + → LN → MHA(cross to encoder) → + → LN → FFN → + → out
```

디코더는 블록당 세 개의 하층을 가지고 있습니다. 중간  횡단주의 는 정보가 코더에서 디코더로 흐르는 유일한 장소입니다. 순수한 디코더-일 뿐 아키텍처 (GPT) 에서, 크로스주의는 생략되며 당신은 단지 마스크된 자기주의 + FFN를 가지고 있습니다.

### 전규상과 후규상

원본 종이:`x + sublayer(LN(x))`vs `LN(x + sublayer(x))`. 2019년 이후의 비정상적 인 호응은 더 어려워서 신중한 온화 없이는 깊이 훈련하기 어렵다.`LN`*이전* 하위층) 은 2026년 기본입니다. Llama, Qwen, GPT-3+, Mistral 모두 사용한다.

### 2026년 현대화 된 블록

바스바니 2017는 레이어노르m + ReLU를 출시했습니다. 현대 스택은 둘 다 대체했습니다.

| Component | 2017 | 2026 |
|-----------|------|------|
| Normalization | LayerNorm | RMSNorm |
| FFN activation | ReLU | SwiGLU |
| FFN expansion | 4× | 2.6× (SwiGLU uses three matrices, total params match) |
| Position | Sinusoidal absolute | RoPE |
| Attention | Full MHA | GQA (or MLA) |
| Bias terms | Yes | No |

RMSNorm 은 LayerNorm 의 평균 중앙을 떨어뜨립니다 (수분 한 개 더 적게), 이는 계산을 절약하고 경험적으로 적어도 안정적입니다.`Swish(W1 x) ⊙ W3 x`) 는 라마, 팔렘 및  웬 논문에서 ReLU/GELU FFN보다 0.5점 정도 더 높은 성과를 거두었다.

### 매개 변수 수

한 블록 동안`d_model = d`그리고 FFN의 확장`r`이 부분의 본문은

- MHA:`4 · d²`(Q, K, V, O 투구)
- FFN (SwiGLU): `3 · d · (r · d)`≈ ≈`3rd²`
- 표준: 무시할 수 없는

`d = 4096, r = 2.6, layers = 32`(약 3 8B) 총: `32 · (4·4096² + 3·2.6·4096²) ≈ 32 · (16 + 32) M = ~1.5B parameters per layer × 32 ≈ 7B`(안부와 머리) 출간된 일치는 계산됩니다.

## 건설 해

### 단계 1: 건축 블록

작은 것을 이용해서`Matrix`수업 03에서 수업을 한 번 (자유를 위해 이 파일에 복사):

- `layer_norm(x, eps=1e-5)` 평균을 빼고 std로 나눌 수 있습니다.
- `rms_norm(x, eps=1e-6)` RMS로 나눌 수 있습니다. 평균 추출이 없습니다.
- `gelu(x)`그리고`silu(x) * W3 x`(SwiGLU)
- `ffn_swiglu(x, W1, W2, W3)`- 그래
- `encoder_block(x, params)`그리고`decoder_block(x, enc_out, params)`- 그래

보시다시피`code/main.py`전용 전선으로

### 단계 2: 2층 코더와 2층 디코더를 연결

을 쌓아, 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 

```python
def encode(tokens, params):
    x = embed(tokens, params.emb) + sinusoidal(len(tokens), params.d)
    for block in params.encoder_blocks:
        x = encoder_block(x, block)
    return x

def decode(target_tokens, encoder_out, params):
    x = embed(target_tokens, params.emb) + sinusoidal(len(target_tokens), params.d)
    for block in params.decoder_blocks:
        x = decoder_block(x, encoder_out, block)
    return x
```

### 단계 3: 장난감 예시를 통해 앞으로 실행

6 토큰의 소스와 5 토큰의 타겟을 입력하여 출력 형태가 확인합니다`(5, vocab)`훈련이 없어요 이 수업은 건축에 관한 것이지, 손실에 관한 것이 아닙니다.

### 단계 4: RMSNorm + SwiGLU에서 교환

레이어노름과 리루-FFN을 RMSNorm과 SwiGLU로 교체하십시오. 모양이 여전히 일치하는지 확인합니다. 이것은 하나의 함수 교체로 2026 현대화입니다.

## 사용 하 고

PyTorch/TF 참조 구현: `nn.TransformerEncoderLayer``nn.TransformerDecoderLayer`하지만 2026년 생산 코드 대부분은

- 플래시 주의는 내부의 주의를 불러옵니다.`nn.MultiheadAttention`- 그래
- GQA/MLA는 STDlib 참조에 포함되지 않습니다.
- RoPE, RMSNorm, SwiGLU는 PyTorch의 기본이 아닙니다.

HF `transformers`다음을 읽어볼 수 있는 깨끗한 참조 블록이 있습니다: `modeling_llama.py`2026년 전용 디코더 블록입니다. 500 줄이고 한번 걸어서 보아야 합니다.

**Encoder vs decoder vs encoder-decoder — when to pick:**

| Need | Pick | Example |
|------|------|---------|
| Classification, embeddings, QA over text | Encoder-only | BERT, DeBERTa, ModernBERT |
| Text generation, chat, code, reasoning | Decoder-only | GPT, Llama, Claude, Qwen |
| Structured input → structured output (translation, summarization) | Encoder-decoder | T5, BART, Whisper |

디코더만 사용해서 언어는 가장 깨끗하고 이해와 생성 모두 처리하기 때문에 승리했습니다. 입력값이 명확한 "소스 시퀀스" 아이덴티티 (번역, 음성 인식, 구조화된 작업) 를 가지고 있을 때도 엔코더 디코더는 여전히 가장 좋습니다.

## 선박

보시다시피`outputs/skill-transformer-block-reviewer.md`. 기술 은 2026 년 기본 설정 에 대한 새로운 트랜스포머 블록 구현 을 검토 하고, 부족한 조각 을 표시 합니다 (전 표준, RoPE, RMSNorm, GQA, FFN 확장 비율).

## 운동

1. **Easy.**에서 encoder_block의 매개 변수를 계산`d_model=512, n_heads=8, ffn_expansion=4, swiglu=True`. 블록을 구현하여 확인하고`sum(p.numel() for p in block.parameters())`- 그래
2. **Medium.**비정상 이후부터 비정상 이전으로 전환합니다. 둘 다 초기화하고 12 개의 겹겹의 입에 따라 활성화 규범을 측정합니다. 비정상 이후의 활성화는 폭발해야 합니다. 비정상 이전은 제한되어 있어야 합니다.
3. **Hard.**장난감 복사 작업에 4층의 코더- 디코더를 구현 (복사 `x`100단계 트레이닝. 손실 보고. RMSNorm + SwiGLU + RoPE 에서 교환 손실이 감소합니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Block | "One transformer layer" | Stack of norm + attention + norm + FFN, wrapped in residual connections. |
| Residual | "Skip connection" | `x + f(x)` output; enables gradient flow through deep stacks. |
| Pre-norm | "Normalize before, not after" | Modern: `x + sublayer(LN(x))`. Trains deeper without warmup gymnastics. |
| RMSNorm | "LayerNorm without the mean" | Divide by RMS; one less op, same empirical stability. |
| SwiGLU | "The FFN everyone switched to" | `Swish(W1 x) ⊙ W3 x → W2`. Beats ReLU/GELU on LM ppl. |
| Cross-attention | "How the decoder sees the encoder" | MHA with Q from decoder, K/V from encoder outputs. |
| FFN expansion | "How wide the middle MLP is" | Ratio of hidden-size to d_model, usually 4 (LayerNorm) or 2.6 (SwiGLU). |
| Bias-free | "Drop the +b terms" | Modern stacks omit biases in linear layers; slight ppl improvement, smaller model. |

## 더 많은 읽기

- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) 원본 블록 사양
- [Xiong et al. (2020). On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745) 왜 전정상가 정상후를 크게 제치고 있는 걸까요?
- [Zhang, Sennrich (2019). Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467) RMSNorm
- [Shazeer (2020). GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202) SWIGLU 논문
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) 2026 칸니컬 디코더 블록만
