# GPT  인과 언어 모델링

> BERT은 양쪽을 모두 볼 수 있습니다. GPT는 과거만 볼 수 있습니다. 삼각형 마스크는 현대 인공지능에서 가장 중요한 단일 코드 라인입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 05 (Full Transformer), Phase 7 · 06 (BERT)
**Time:** ~75 minutes

## 문제

언어 모델은 하나의 질문에 답합니다.`t-1`토큰, 토큰에 대한 확률 분포는 무엇입니까?`t`이 신호를 훈련시켜서 다음 토큰 예측을 하면 동시에 임의의 텍스트를 생성할 수 있는 모델을 얻을 수 있습니다.

모든 위치의 예측이 이전 위치에만 의존하는 것이 필요합니다. 그렇지 않으면 모델은 답을 보면서 사소한 속임수를 합니다.

이 원인은 이 기능을 합니다.`-inf`Softmax 이전에 주의 점수를 추가한 값입니다. softmax 이후, 그 위치가 0이 됩니다. 각 위치가 자기 자신과 이전 위치만 관람할 수 있습니다. 그리고 전체 순서에 한 번 적용하기 때문에, 당신은 한 번 앞으로 전달 N 평행 다음 토큰 예측을 얻을 수 있습니다.

GPT-1 (2018), GPT-2 (2019), GPT-3 (2020), GPT-4 (2023), GPT-5 (2025), 클로드, 라마, Qwen, 미스트랄, 딥시크, 키미  모두 동일한 핵심 루프의 디코더 전원 변조제입니다. 이들을 구분하는 것은 데이터 품질, 규모 및 건축 정비, 그리고 포스트 트레이닝 (SFT, RLHF, DPO 및 그 후계자) 이다.

## 개념

![Causal mask creates a triangular attention matrix](../assets/causal-attention.svg)

### 마스크

길이가 순서대로$N$, 건설$N \times N$매트릭스:

```math
M_{ij} = \begin{cases} 0 & \text{if } j \le i \\ -\infty & \text{if } j > i \end{cases}
```

추가`M`Softmax 이전에 무질서한 주의점 점수를$\exp(-\infty) = 0$, 그래서 마스크된 위치들은 0 무게를 기여합니다. 주의 행렬의 각 줄은 이전 위치들에 대한 확률 분포입니다.

시행비: 1 `torch.tril()`전화, 계산 시간: 나노초, 현장 영향: 모든 것

### 삼각형이 나오는 곳

마스크는 보통 주의에 힌 패치로 제시된다. 다른 방향으로 추출을 실행하면 신비롭지 않게 된다. 주의는 사전 평균의 세 번째 정밀화이고 삼각형은 매트릭스로 쓰인 그 평균의 루프 경계이다.

**Stage 1 — prefix average.**순서에서 가장 멍청한 인과적 요약: 위치$i$위치의 평균이 됩니다$0 \ldots i$. 순환으로, 그건`out[i] = X[:i+1].mean(0)`같은 계산은 1개의 매트릭스를 곱합니다. 1개의 낮은 삼각형 매트릭스를 가지고, 각 줄을 그 숫자에 나눈 다음 곱합니다.

```python
import numpy as np

A = np.tril(np.ones((n, n)))
A = A / A.sum(axis=1, keepdims=True)
out = A @ X
```

 라인$i$$A$ $[1/(i+1), \ldots, 1/(i+1), 0, \ldots, 0]$이 지각 위에 있는 제로들은 인과관계를 나타냅니다. 미래에 대한 어떤 것도 은폐되지 않았습니다. 미래는 결코 합에 포함되지 않았습니다.

**Stage 2 — learned weights.**일률적인 평균은 과거의 모든 토큰을 동등하게 중요하게 취급합니다. 학습된 점수 매트릭스로 대체합니다.`S`이제 줄은 더 이상 구성으로 1으로 합치지 않으므로, 횟수에 나눌 대신 매듭을 소프트맥스 (softmax) 로 정상화하십시오. 소프트맥스는 절대 정확한 0을 내보내지 않습니다. 이는 인과관계를 깨고 있습니다.`-inf`왜냐하면`exp(-inf) = 0`이 부분의 본문은

```python
def softmax(x, axis):
    e = np.exp(x - np.max(x, axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

S = S + np.triu(np.full((n, n), -np.inf), k=1)
A = softmax(S, axis=1)
out = A @ X
```

같은 삼각형, 같은 줄-스토카스틱 매트릭스, 같은 매트뮬`-inf`마스크는 새로운 기계가 아닙니다. 그것은 1단계 0 항목입니다.

**Stage 3 — content-dependent weights.**2단계`S`훈련 후 고정됩니다. 7위는 항상 3위는 동일합니다. 토큰이 무슨 말을 했든 상관없이. 점수는 토큰 자체에 달려 있습니다. `S = Q @ K.T / sqrt(d_k)`마스크, 소프트맥스, 매트무일 같은 것

3단계, 1변화: 아래 삼각형 줄-스토카스틱 매트릭스 곱하기 순서. 균일 평균, 학습된 정적 중, 내용에 의존하는 중. 마스크는 결코 주의에 추가되지 않았습니다. 그것은 평균에서 살아남았습니다.

```figure
mask-derivation
```

### 병행 훈련, 일련의 추론

교육: 전면 전달`(N, d_model)`순서 1 번, N 크로스 엔트로피 손실을 계산 (지 위치 한 개), 합, 백프록. 순서 따라 평행. 이 때문에 GPT 훈련 스케일  당신은 GPU 패스 한 번에 1M 토큰을 처리합니다.

추론: 당신은 토큰을 토큰으로 생성합니다.`[t1, t2, t3]`- 그래`t4`- 먹이`[t1, t2, t3, t4]`- 그래`t5`- 먹이`[t1, t2, t3, t4, t5]`- 그래`t6`KV 캐시 (강좌 12) 는 `t1…tn`그래서 모든 단계를 다시 계산하지 않습니다. 하지만 추론의 일련 깊이는 = 출력 길이가. 이것이 자율적 세입니다. 그리고 왜 해독은 모든 LLM의 지연량 병목입니다.

### 손실은 1개씩

토큰을 제공함`[t1, t2, t3, t4]`이 부분의 본문은

- 입력:`[t1, t2, t3]`
- 목표:`[t2, t3, t4]`

모든 위치에`i`, 계산`-log P(target_i | inputs[:i+1])`전체 순서의 크로스 엔트로피입니다.

이 손실에 대한 모든 트랜스포머 LM를 들었을 겁니다. 사전 훈련, 정렬, SFT 같은 손실, 다른 데이터.

### 디코딩 전략

훈련 후 샘플링 선택은 사람들이 생각하는 것보다 더 중요합니다.

| Method | What it does | When to use |
|--------|--------------|-------------|
| Greedy | Argmax every step | Deterministic tasks, code completion |
| Temperature | Divide logits by T, sample | Creative tasks, higher T = more diversity |
| Top-k | Sample from top-k tokens only | Kills low-probability tails |
| Top-p (nucleus) | Sample from smallest set with cumulative prob ≥ p | 2020+ default; adapts to distribution shape |
| Min-p | Keep tokens with `p > min_p * max_p` | 2024+; better at rejecting long tails than top-p |
| Speculative decoding | Draft model proposes N tokens, big model verifies | 2–3× latency reduction at same quality |

2026년, min-p + 온도는 0.7이 열린 무게 모델에 합리적인 기본값이다. 추측적 디코딩은 모든 생산 추론 스택에 대한 테이블 스테이크입니다.

### "GPT 레시피"가 어떻게 작동 했습니까?

1. **Decoder-only.**코더가 없는데 1개의 중점과 FFN가 있습니다
2. **Scaling.**124M → 1.5B → 175B → 트리లియన్. 칠라 스케일링 법칙 (강좌 13) 은 계산을 어떻게 할 것인지 알려줍니다.
3. **In-context learning.**6B13B에 등장했다. 모델은 정교하지 않고 몇 번의 예시를 따라갈 수 있습니다.
4. **RLHF.**인간의 선호도에 대한 후교육은 초자료 사전 훈련된 텍스트를 채팅 보조로 변환했습니다.
5. **Pre-norm + RoPE + SwiGLU.**규모로 안정적인 훈련

GPT-2 이후 핵심 아키텍처는 크게 변하지 않았습니다. 데이터, 규모, 그리고 교육 후에도 흥미로운 일이 일어났습니다.

```figure
causal-mask
```

## 건설 해

### 단계 1: 인과적 마스크

보시다시피`code/main.py`- 한 라인:

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

부드러운 최대보다 먼저 주의점으로 추가해 보세요.

### 단계 2: 2층 GPT형 모델

두 개의 디코더 블록을 쌓아두십시오 (마스크된 자기주의 + FFN, 간접주의는 없습니다). 토큰 임베디션, 위치 코딩 및 비 임베디션 (토큰 임베디션 매트릭스에 묶여있는 GPT-2 이후 표준 트릭) 을 추가하십시오.

### 단계 3: 다음 토큰 예측, 끝에서 끝

20 토큰 장난감 어휘에서 모든 위치에서 로그티를 생성하십시오. 1개로 이동하는 목표에 대한 크로스 엔트로피 손실을 계산하십시오. gradient 없습니다.

### 4단계: 샘플링

탐욕, 온도, 상위 k, 상위 p, min-p를 구현합니다. 각각 고정된 프롬프트에서 실행하고 출력을 비교합니다. 샘플링 기능은 10 라인입니다.

## 사용 하 고

파이토치, 2026 발음:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")
tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")

prompt = "Attention is all you need because"
inputs = tok(prompt, return_tensors="pt")
out = model.generate(
    **inputs,
    max_new_tokens=64,
    temperature=0.7,
    top_p=0.9,
    do_sample=True,
)
print(tok.decode(out[0]))
```

뚜 아래`generate()`앞으로의 패스를 실행하고 최종 위치 로그티스를 당기고 다음 토큰을 샘플링하고 추가하고 반복합니다. 모든 생산 LLM 추론 스택 (vLLM, TensorRT-LLM, llama.cpp, Ollama, MLX) 은 무거운 최적화와 같은 루프를 구현합니다.

**GPT vs BERT, one line each:**GPT 예측$P(x_t \mid x_{<t})$- BERT가 예측한 것$P(x_{\text{masked}} \mid x_{\text{unmasked}})$. 손실은 모델이 생성할 수 있는지 여부를 결정합니다.

## 선박

보시다시피`outputs/skill-sampling-tuner.md`. 기술은 새로운 세대 작업에 대한 샘플링 매개 변수를 선택하고 결정적인 디코딩이 필요할 때 표시합니다.

## 운동

1. **Easy.**달아`code/main.py`그리고 사유주의 매트릭스가 소프트맥스 이후에 아래 삼각형이 있는지 확인합니다. 점스 체크: 줄 3는 열 03에서만 무게가 있어야 합니다.
2. **Medium.**4 빔 4 와 탐욕적 인 빔 4 의 복잡성을 10 가지 짧은 명령어에서 비교하십시오. 빔은 항상 승리합니까? (상술: 일반적으로 번역, 오픈 엔드 채팅은 아닙니다.)
3. **Hard.**추측적 디코딩을 구현: 초안으로 작은 2층 모델과 검증기로서 6층 모델을 사용하십시오. 길이 64의 100 개 완공에 벽 시계 가속을 측정하십시오. 확인 출력은 검증기의 탐욕과 일치합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Causal mask | "The triangle" | Upper-triangular `-inf` matrix added to attention scores so position `i` only sees positions `≤ i`. |
| Next-token prediction | "The loss" | Cross-entropy of the model's distribution against the true next token at every position. |
| Autoregressive | "Generate one at a time" | Feed output back as input; parallelism only during training, not during generation. |
| Logits | "Pre-softmax scores" | Raw output of the LM head before softmax; sampling happens on these. |
| Temperature | "Creativity knob" | Divide logits by $T$; $T \to 0$ = greedy, $T \to \infty$ = uniform. |
| Top-p | "Nucleus sampling" | Truncate distribution to smallest set summing to $\ge p$; sample from what remains. |
| Min-p | "Better than top-p" | Keep tokens where `p ≥ min_p × max_p`; adapts cutoff to sharpness of distribution. |
| Speculative decoding | "Draft + verify" | Cheap model proposes N tokens; big model verifies in parallel. |
| Teacher forcing | "Training trick" | During training, feed the true previous token, not the model's prediction. Standard for every seq2seq LM. |

## 더 많은 읽기

- [Radford et al. (2018). Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf) GPT-1.
- [Radford et al. (2019). Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) GPT-2.
- [Brown et al. (2020). Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) GPT-3 및 맥락 내 학습
- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) 스펙 디코딩 종이
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) 가톨릭 사유성-LM 참조 코드
