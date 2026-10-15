# 주의 메커니즘  돌파구

> 디코더는 압축된 요약에 눈을 감고 모든 소스를 보고 시작합니다. 이 후의 모든 것은 관심과 엔지니어링입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 09 (Sequence-to-Sequence Models)
**Time:** ~45 minutes

## 문제

레슨 09은 측정된 실패로 끝났다. 장난감 복사 작업에 훈련된 GRU 코더 디코더는 길이 5에서 89% 정확성에서 거의 우연의 길이가 80까지 증가합니다. 이유는 구조적인 것이 아니라 훈련 오류입니다. 코더가 수집한 모든 정보가 한 고정 크기의 숨겨진 상태로 들어야합니다. 디코더는 다른 것을 보지 않습니다.

바하다누, 쇼, 벤지오는 2014년에 3 줄의 수정법을 발표했다. 디코더에 최종 디코더 상태를만 부여하는 대신 모든 디코더 상태를 유지하십시오. 디코더 단계마다, 무게가 "디코더 위치에 얼마나 많은 디코더가 살펴봐야 하는가"를 말하는 인코더 상태의 중계량을 계산하십시오.`i`지금 당장?" 이 중량 평균은 맥락입니다. 그리고 모든 디코더 단계를 바꾸죠.

이것이 전체 아이디어입니다. 트랜스포머가 그것을 확장했습니다. 자기주의는 그것을 하나의 순서로 적용했습니다. 다중머리주의는 그것을 병렬로 실행했습니다. 하지만 2014 버전은 이미 병목을 깨고, 일단 당신이 그것을 가지고 나면, 트랜스포머의 중심은 개념적인 것이 아니라 엔지니어링입니다.

## 개념

![Bahdanau attention: decoder queries all encoder states](../assets/attention.svg)

디코더 단계마다`t`이 부분의 본문은

1. 이전 디코더를 숨겨진 상태로 사용하세요`s_{t-1}`**query**- 그래
2. 모든 코더에 대한 점수를 둡니다`h_1, ..., h_T`- 코더 위치마다 1 스칼라
3.        `α_{t,1}, ..., α_{t,T}`그 수치는 1입니다.
4. 컨텍스트 벡터`c_t = Σ α_{t,i} * h_i`- 고도화 상태의 중형 평균
5. 디코더가 필요해요`c_t`+ 이전 출력 토큰을 더하면 다음 토큰을 생성합니다.

중형 평균은 포인트입니다. 디코더가 "Je"를 "I"로 번역해야 할 때, 그것은 "Je"를 높게, 다른 것을 낮게 무게를 가집니다. "아니"가 필요할 때, 그것은 "pas"를 높게 무게를 가집니다. 컨텍스트 벡터는 각 단계를 재구성합니다.

## 형태 (모든 사람을 물리는 것)

여기 모든 관심 구현이 처음 잘못되는 곳입니다. 천천히 읽으십시오.

| Thing | Shape | Notes |
|-------|-------|-------|
| Encoder hidden states `H` | `(T_enc, d_h)` | If BiLSTM, `d_h = 2 * d_hidden` |
| Decoder hidden state `s_{t-1}` | `(d_s,)` | One vector |
| Attention score `e_{t,i}` | scalar | One per encoder position |
| Attention weight `α_{t,i}` | scalar | After softmax over all `i` |
| Context vector `c_t` | `(d_h,)` | Same shape as an encoder state |

**Bahdanau (additive) score.** `e_{t,i} = v_α^T * tanh(W_a * s_{t-1} + U_a * h_i)`- 그래

- `s_{t-1}`모양이 있습니다`(d_s,)``h_i`모양이 있습니다`(d_h,)`- 그래
- `W_a`모양이 있습니다`(d_attn, d_s)`-`U_a`모양이 있습니다`(d_attn, d_h)`- 그래
- 그 양은  안에 있는 양입니다`(d_attn,)`- 그래
- `v_α`모양이 있습니다`(d_attn,)`. 내적인 제품`v_α`이 이 이 이**This is what `v_α` does.**그것은 마법이 아닙니다. 그것은 주의-무조한 벡터를 스칼라 스코어로 바꾸는 투영입니다.

**Luong (multiplicative) score.**3가지의 변종:

- `dot`이 책:`e_{t,i} = s_t^T * h_i`- 필요해요`d_s == d_h`- 고한 제한이 있어요. 코더가 양방향이라면 건너뛰세요.
- `general`이 책:`e_{t,i} = s_t^T * W * h_i``W`형태`(d_s, d_h)`- 같은 밝기의 제한을 제거합니다.
- `concat`이 두 가지 형태는 더 저렴하기 때문에 거의 사용되지 않습니다.

**One Bahdanau / Luong gotcha worth naming.**바흐다누는 사용한다`s_{t-1}`(이번 단어를 생성하기 전에 디코더 상태)`s_t`(후 상태 **) 를 섞으면 미묘하게 잘못된 gradients를 생성합니다.

```figure
attention-heatmap
```

## 건설 해

### 단계 1: 첨가물 (Bahdanau) 관심

```python
import numpy as np


def additive_attention(decoder_state, encoder_states, W_a, U_a, v_a):
    projected_dec = W_a @ decoder_state
    projected_enc = encoder_states @ U_a.T
    combined = np.tanh(projected_enc + projected_dec)
    scores = combined @ v_a
    weights = softmax(scores)
    context = weights @ encoder_states
    return context, weights


def softmax(x):
    x = x - np.max(x)
    e = np.exp(x)
    return e / e.sum()
```

위 표에 대한 모양을 확인해 보세요.`encoder_states`모양이 있습니다`(T_enc, d_h)`-`projected_enc`모양이 있습니다`(T_enc, d_attn)`-`projected_dec`모양이 있습니다`(d_attn,)`그리고 방송.`combined`모양이 있습니다`(T_enc, d_attn)`-`scores`모양이 있습니다`(T_enc,)`-`weights`모양이 있습니다`(T_enc,)`-`context`모양이 있습니다`(d_h,)`- 보내줘

### 단계 2: 루롱 닷 및 일반

```python
def dot_attention(decoder_state, encoder_states):
    scores = encoder_states @ decoder_state
    weights = softmax(scores)
    return weights @ encoder_states, weights


def general_attention(decoder_state, encoder_states, W):
    projected = W.T @ decoder_state
    scores = encoder_states @ projected
    weights = softmax(scores)
    return weights @ encoder_states, weights
```

3줄이 각각, 그래서 루온의 논문이 착륙했습니다. 대부분의 작업에 동일한 정확성, 훨씬 적은 코드입니다.

### 단계 3: 작업된 숫자 예제

세 개의 코더 상태 (대부분 "cat", "sat", "mat") 와 첫 번째와 가장 일치하는 디코더 상태를 고려하면, 주의 분포는 0 위치로 집중됩니다. 디코더 상태가 마지막에 일치하도록 이동하면 주의가 2 위치로 이동합니다. 컨텍스트 벡터 트랙.

```python
H = np.array([
    [1.0, 0.0, 0.2],
    [0.5, 0.5, 0.1],
    [0.1, 0.9, 0.3],
])

s_close_to_cat = np.array([0.9, 0.1, 0.2])
ctx, w = dot_attention(s_close_to_cat, H)
print("weights:", w.round(3))
```

```
weights: [0.464 0.305 0.231]
```

첫 번째 줄이 승리합니다. 다음으로 디코더 상태를 세 번째 코더 상태에 더 가까이 이동하고 무게의 변화를 관찰합니다.

### 4단계: 왜 이 다리는 트랜스포머로 가는 지

위의 언어를 Q/K/V로 번역하라:

- **Query**= 디코더 상태`s_{t-1}`
- **Key**= 코더 상태 (우리가 점수를 얻는)
- **Value**= 코더 상태 (우리가 무게와 합)

클래식주의에서 키와 값은 동일합니다. 자기주의는 그들을 분리합니다. 당신은 K와 V에 대한 다른 학습된 투구와 함께 순서대로 질문 할 수 있습니다. 다중머리주의는 다른 학습된 투구와 병렬로 실행됩니다. 트랜스포머는 전체 단계를 여러 번 쌓아내고 RNN를 떨어뜨립니다.

수학은 똑같습니다. 형태는 똑같습니다. 바하다누 관심에서 점 점 제품 관심으로의 교육적 도피는 대부분 표기입니다.

## 사용 하 고

파이토치와 텐서플로우가 직접적으로 주의를 기울이고 있습니다.

```python
import torch
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=128, num_heads=8, batch_first=True)
query = torch.randn(2, 5, 128)
key = torch.randn(2, 10, 128)
value = torch.randn(2, 10, 128)

output, weights = mha(query, key, value)
print(output.shape, weights.shape)
```

```
torch.Size([2, 5, 128]) torch.Size([2, 5, 10])
```

트랜스포머 주의층입니다. 5개의 위치, 10개의 위치, 128-차원, 8개의 헤드`output`새로운 컨텍스트 증강 질문입니다. `weights`5x10의 배열 행렬입니다

### 고전적인 관심은 여전히 중요할 때

- 교육학. 단일 머리, 단일 층, RNN 기반 버전은 모든 개념을 가시하게 합니다.
- 변압기가 맞지 않는 장치 속 순서 작업
- 2014~2017년 간 모든 논문들은 바하다누의 협약에 대해 알지 못해 잘못 읽힐 겁니다.
- MT에서 정밀한 조율 분석. 원료 주의 무게는 트랜스포머 모델에서도 해석 가능한 도구이며, 그것들을 읽는 것은 그들이 무엇인지 아는 것이 필요합니다.

### 주의력중심에 대한 설명 함정이

주의력 무게는 해석가능한 것 같습니다. 그것은 위치 를 가로질러 한 가지로 합쳐지는 무게입니다. 당신은 그 무게를 그려낼 수 있습니다. 높이는 "이것 을 보고 있다". 평론가 들 은 그 무게 를 사랑 합니다.

그들은 겉으로 보이는 것처럼 해석이 불가능하다. 제인과 월레스 (2019) 는 주의 분포는 일부 작업에 대한 모델 예측을 변경하지 않고 임의의 대안으로 변경되고 대체 될 수 있음을 보여주었습니다. 압축 또는 반사적 검증이 없으면 주의 무게를 논리 증거로 결코 보고하지 마십시오.

## 선박

`outputs/prompt-attention-shapes.md`이 부분의 본문은

```markdown
---
name: attention-shapes
description: Debug shape bugs in attention implementations.
phase: 5
lesson: 10
---

Given a broken attention implementation, you identify the shape mismatch. Output:

1. Which matrix has the wrong shape. Name the tensor.
2. What its shape should be, derived from (d_s, d_h, d_attn, T_enc, T_dec, batch_size).
3. One-line fix. Transpose, reshape, or project.
4. A test to catch regressions. Typically: assert `output.shape == (batch, T_dec, d_h)` and `weights.shape == (batch, T_dec, T_enc)` and `weights.sum(dim=-1) close to 1`.

Refuse to recommend fixes that silently broadcast. Broadcast-hiding bugs surface later as silent accuracy degradation, the worst kind of attention bug.

For Bahdanau confusion, insist the decoder input is `s_{t-1}` (pre-step state). For Luong, `s_t` (post-step state). For dot-product, flag dimension mismatch between query and key as the most common first-time error.
```

## 운동

1. **Easy.**시행`softmax`코더에 있는 포딩 토큰이 주의 무게를 0으로 얻도록 마스크링
2. **Medium.**루롱에 다중머리 주의를 기울여`general`형태, 분할`d_h``n_heads`단두대 사건의 적용이 일치하는지 확인하세요.
3. **Hard.**9. 수업에서 장난감 복사 작업에 대한 바하다누 주의를 사용하여 GRU 코더-독호기를 훈련하십시오. 음반 정확성과 순서 길이를 비교하십시오. 주의가 없는 기본 라인에 비교하십시오. 길이 증가함에 따라 격차가 넓어지는 것을 보실 수 있습니다. 주의가 병목을 들어올리는 것을 확인합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Attention | Looking at things | Weighted average of a value sequence, weights computed from a query-key similarity. |
| Query, Key, Value | QKV | Three projections: Q asks, K is what to match, V is what to return. |
| Additive attention | Bahdanau | Feed-forward score: `v^T tanh(W q + U k)`. |
| Multiplicative attention | Luong dot / general | Score is `q^T k` or `q^T W k`. Cheaper, same accuracy on most tasks. |
| Alignment matrix | The pretty picture | Attention weights as a `(T_dec, T_enc)` grid. Read it to see what the model attended to. |

## 더 많은 읽기

- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)- 신문
- [Luong, Pham, Manning (2015). Effective Approaches to Attention-based Neural Machine Translation](https://arxiv.org/abs/1508.04025) 세 가지 점수 변수 및 비교
- [Jain and Wallace (2019). Attention is not Explanation](https://arxiv.org/abs/1902.10186) 해석가능성 경고
- [Dive into Deep Learning — Bahdanau Attention](https://d2l.ai/chapter_attention-mechanisms-and-transformers/bahdanau-attention.html) PyTorch로 실행 가능한 보행
