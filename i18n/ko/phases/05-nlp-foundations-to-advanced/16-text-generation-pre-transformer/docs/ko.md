# 변환기 이전 텍스트 생성  N-그램 언어 모델

> 만약 단어가 놀라게 된다면 모델은 나쁘다. 혼란은 놀라게 하는 숫자를 만듭니다. 부드럽게 하면 끝을 유지합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## 문제

트랜스포머, RNN, 단어 임베디션 이전에 언어 모델은 다음 단어를 계산하여 이전 단어를 얼마나 자주 따라가는지 예측했습니다.`n-1`"고양이" → "앉은" 47번, "고양이" → "뛰는" 12번, "고양이" → "냉장고" 0번을 셀 수 있습니다. 확률 분포를 얻기 위해 정상화하십시오.

이것은 n-그램 언어 모델입니다. 1980년부터 2015년까지 모든 음성 인식기, 글씨 검사기, 문장 기반의 기계 번역 시스템을 실행했습니다. 여전히 저렴한 장치 언어 모델링이 필요할 때 실행됩니다.

흥미로운 문제는 보이지 않는 n-그램에 대해 어떻게 해야 하는지에 관한 것입니다. 원자력 계산 기반 모델은 보지 못한 모든 것에 0 확률을 부여합니다. 이는 문장이 길고 거의 모든 긴 문장이 적어도 보이지 않는 순서 하나를 포함하고 있기 때문에 재앙입니다. 50 년의 부드러운 연구로 그것을 수정했습니다.

## 개념

![N-gram model: count, smooth, generate](../assets/ngram.svg)

### 예측 게임

이 기계가 존재하기 전에 한 실험에서 언어 모델이 무엇인지 정의했습니다. 영어 문장의 다음 문자를 덮으세요. 한 번에 한 번 추측을 해보세요. 그 숫자를 적어 보세요. 몇 백 개의 문자를 반복하세요.

추측 계산은 사소한 것이 아닙니다. 그들은 텍스트의 손실없는 재코딩입니다. 계산 순서를 두 번째, 동일한 추측자에게 넘겨주면 모든 문자를 재구성할 수 있습니다. 왜냐하면 각 위치에서 어떤 추측이 먼저 올지 정확히 알고 있기 때문입니다. 더 적은 상징으로 다시 코드를 할 수있는 메시지는 하나의 상징에 대한 정보가 덜 수 있습니다. 그래서 추측 계산 통계는 영어의 엔트로피에 한계를 놓습니다.

논은 1951년에 이 문제를 해결해왔고 여전히 이 분야를 지배하는 숫자를 얻었습니다. 27개의 문자가 26개의 글자를 더하여 공간을 가지고 있을 수 있습니다.`log2(27) ≈ 4.75`문자당 비트. 인간 추측자는 100 글자 맥락을 가진 글자당 0.6에서 1.3 비트 사이에 도착했다. 영어는 약 3/4의 강제 움직임을 의미합니다. 모델이 배워야 할 구조는 어떤 모델이 배울 수 있기 전에 측정되었습니다.

그 이후로 모든 언어 모델은 이 게임의 기계적인 플레이어이며 이 수업의 모든 평가 번호는 점수를 얻은 게임입니다.

- **Cross-entropy loss**LM를 훈련시키는 것은 추측 게임에서 점수를 최소화하는 것입니다.
- **Perplexity** `2^bits`(또는`e^nats`): 추측 후에도 모델에 직면하는 분열 요소. 27 개의 상징을 통한 추측은 27 가지의 혼란입니다.
- **Context length is the player's memory.**트리그램 모델은 두 개의 메모리 토큰과 같은 게임을 합니다. 트랜스포머는 100K 토큰과 같은 게임을 합니다. 규칙은 변하지 않습니다. 플레이어는 더 나아졌습니다.

1 단위 트레이크 전환: 게임 점수는 비트 (`log2`), 아래의 n-그램 공식들은 nats (자연적 로그) 로 단어 로켓에 점수를  그리고 혼란이 있기 때문에`e^H`나트에서 동등한`2^H`비트에서, 두 관점은 다른 단위로 같은 측정입니다.

```figure
prediction-game
```

**N-gram probability:** `P(w_i | w_{i-n+1}, ..., w_{i-1})`- 고쳐`n`(일반적으로 삼각형의 경우 3개, 4개는 4개)

```math
P(w \mid \text{context}) = \frac{\mathop{\mathrm{count}}(\text{context}, w)}{\mathop{\mathrm{count}}(\text{context})}
```

**The zero-count problem.**훈련에서 볼 수 없는 n-그램은 확률이 0을 얻습니다. 2007년 브라운 코퍼스에 대한 연구는 4그램 모델조차도 훈련에서 볼 수 없는 4그램의 30%를 가지고 있다고 발견했습니다. 부드럽게 하지 않고는 어떤 실제 텍스트를 평가할 수 없습니다.

**Smoothing approaches, in order of sophistication:**

1. **Laplace (add-one).**숫자가 1개씩 더해 줄 수 있어
2. **Good-Turing.**더 높은 주파수 사건에서 보이지 않는 사건으로 확률 질량을 재배치하는 것은 주파수 주파수를 기반으로 합니다.
3. **Interpolation.**n-그램, (n-1)-그램 등을 조정 가능한 무게와 추정하는 것을 결합한다.
4. **Backoff.**n-그램이 0을 세면, (n-1) -그램으로 다시 떨어집니다.
5. **Absolute discounting.**고정 할인금을 빼면`D`모든 숫자를 통해 보이지 않는 것을 재배포합니다.
6. **Kneser-Ney.**절대적인 할인과 낮은 순위 모델에 대한 똑똑한 선택: 원시 주파수 대신 * 연속 확률* (어떤 맥락에서 단어가 나타난다) 를 사용한다.

세어네이 통찰력은 깊습니다. "샌프란시스코"는 일반적인 빅램입니다. 유니그램 "프란시스코"는 주로 "San." 이후 나타난다. 순진한 절대 할인으로 "프란시스코"는 높은 유니그램 확률을 제공합니다 (거리는 높기 때문입니다). Kneser-Ney는 "프란시스코"가 한 맥락에서만 등장한다는 점을 주목하고 이에 따라 그 연속 가능성을 낮춰준다. 결과는 "프란시스코"로 끝나는 소설의 빅램이 적절한 낮은 확률을 얻습니다.

**Evaluation: perplexity.**수직 테스트 세트에서 단어당 평균 음적 로그 확률의 기하급수. 낮은 것은 더 좋습니다. 100의 혼란은 100 단어 중에서 균일하게 선택하는 모델만큼 혼란스러워한다는 것을 의미합니다.

```math
\text{perplexity} = \exp\left(-\frac{1}{N} \sum_i \log P(w_i \mid \text{context}_i)\right)
```

```figure
ngram-backoff
```

## 건설 해

### 단계 1: 트리그램 수

```python
from collections import Counter, defaultdict


def train_ngram(corpus_tokens, n=3):
    ngrams = Counter()
    contexts = Counter()
    for sentence in corpus_tokens:
        padded = ["<s>"] * (n - 1) + sentence + ["</s>"]
        for i in range(len(padded) - n + 1):
            ctx = tuple(padded[i:i + n - 1])
            word = padded[i + n - 1]
            ngrams[ctx + (word,)] += 1
            contexts[ctx] += 1
    return ngrams, contexts


def raw_probability(ngrams, contexts, context, word):
    ctx = tuple(context)
    if contexts.get(ctx, 0) == 0:
        return 0.0
    return ngrams.get(ctx + (word,), 0) / contexts[ctx]
```

입력은 토큰화된 문장의 목록입니다. 출력은 n-그램 수와 맥락 수입니다. `<s>`그리고`</s>`문장 경계가 있습니다.

### 단계 2: 랩라이스 가벼운

```python
def laplace_probability(ngrams, contexts, vocab_size, context, word):
    ctx = tuple(context)
    numerator = ngrams.get(ctx + (word,), 0) + 1
    denominator = contexts.get(ctx, 0) + vocab_size
    return numerator / denominator
```

매번 1을 더해 보세요. 보이지 않는 사건에 질량을 분배하는 것이 부드럽지만 너무 많아서 희귀한 사건에도 영향을 줍니다.

### 단계 3: 어-네이 (비그램, 중도)

```python
def kneser_ney_bigram_model(corpus_tokens, discount=0.75):
    unigrams = Counter()
    bigrams = Counter()
    unigram_contexts = defaultdict(set)

    for sentence in corpus_tokens:
        padded = ["<s>"] + sentence + ["</s>"]
        for i, w in enumerate(padded):
            unigrams[w] += 1
            if i > 0:
                prev = padded[i - 1]
                bigrams[(prev, w)] += 1
                unigram_contexts[w].add(prev)

    total_unique_bigrams = sum(len(ctx_set) for ctx_set in unigram_contexts.values())
    continuation_prob = {
        w: len(ctx_set) / total_unique_bigrams for w, ctx_set in unigram_contexts.items()
    }

    context_totals = Counter()
    for (prev, w), count in bigrams.items():
        context_totals[prev] += count

    unique_follow = defaultdict(set)
    for (prev, w) in bigrams:
        unique_follow[prev].add(w)

    def prob(prev, w):
        count = bigrams.get((prev, w), 0)
        denom = context_totals.get(prev, 0)
        if denom == 0:
            return continuation_prob.get(w, 1e-9)
        first_term = max(count - discount, 0) / denom
        lambda_prev = discount * len(unique_follow[prev]) / denom
        return first_term + lambda_prev * continuation_prob.get(w, 1e-9)

    return prob
```

3개의 움직이는 부분입니다.`continuation_prob`"이 단어는 얼마나 많은 다른 맥락에서 나타납니다?" (Kneser-Ney 혁신)`lambda_prev`이 할인된 값은 배카프의 중량을 측정하는 데 사용되는 질량입니다. 최종 확률은 할인된 주 조건과 중계된 연속 기간입니다.

### 단계 4: 샘플링으로 텍스트를 생성

```python
import random


def generate(prob_fn, vocab, prefix, max_len=30, seed=0):
    rng = random.Random(seed)
    tokens = list(prefix)
    for _ in range(max_len):
        candidates = [(w, prob_fn(tokens[-1], w)) for w in vocab]
        total = sum(p for _, p in candidates)
        r = rng.random() * total
        acc = 0.0
        for w, p in candidates:
            acc += p
            if r <= acc:
                tokens.append(w)
                break
        if tokens[-1] == "</s>":
            break
    return tokens
```

확률에 비례한 샘플링. 항상 씨앗마다 다른 출력을 제공합니다. 빔 검색과 같은 출력을 위해, 각 단계에서 argmax를 선택하고 작은 무작위 점프를 추가하십시오 (온).

### 5단계: 혼란

```python
import math


def perplexity(prob_fn, sentences):
    total_log_prob = 0.0
    total_tokens = 0
    for sentence in sentences:
        padded = ["<s>"] + sentence + ["</s>"]
        for i in range(1, len(padded)):
            p = prob_fn(padded[i - 1], padded[i])
            total_log_prob += math.log(max(p, 1e-12))
            total_tokens += 1
    return math.exp(-total_log_prob / total_tokens)
```

더 낮은 것은 더 좋습니다. 브라운 코퍼스에서는 잘 조정된 4g KN 모델이 140에 대한 혼란을 나타냅니다. 트랜스포머 LM는 같은 테스트 세트에 15-30을 나타냅니다. 격차는 약 10x입니다. 그 격차는 필드가 계속 이동하는 이유입니다.

## 사용 하 고

- **Classical NLP teaching.**가장 명확한 노출은 부드러움, MLE, 그리고 혼란이 있습니다.
- **KenLM.**생산 n-그램 라이브러리. 낮은 지연이 중요한 음성 및 MT 시스템에서 재점기로서 사용됩니다.
- **On-device autocomplete.**키보드에서 트리그램 모델
- **Baselines.**항상 신경 LM를 좋은 것으로 선언하기 전에 n-그램 LM의 혼란을 계산하십시오. 변환기가 KN를 크게 이길 수 없다면 뭔가 잘못되었습니다.

## 선박

`outputs/prompt-lm-baseline.md`이 부분의 본문은

```markdown
---
name: lm-baseline
description: Build a reproducible n-gram language model baseline before training a neural LM.
phase: 5
lesson: 16
---

Given a corpus and target use (next-word prediction, rescoring, perplexity baseline), output:

1. N-gram order. Trigram for general English, 4-gram if corpus is large, 5-gram for speech rescoring.
2. Smoothing. Modified Kneser-Ney is the default; Laplace only for teaching.
3. Library. `kenlm` for production, `nltk.lm` for teaching, roll your own only to learn.
4. Evaluation. Held-out perplexity with consistent tokenization between train and test sets.

Refuse to report perplexity computed with different tokenization between systems being compared — perplexity numbers are comparable only under identical tokenization. Flag OOV rate in test set; KN handles OOV poorly unless you reserve a special <UNK> token during training.
```

## 운동

1. **Easy.**1,000 문장 셰익스피어 코퍼스에서 Trigram LM를 훈련시켜 20개의 문장을 생성해 보세요.
2. **Medium.**셰익스피어 분할에 KN 모델에 대한 혼란을 구현하세요. 라플라스와 비교해보세요. KN의 혼란은 30%에서 50% 정도 낮을 것입니다.
3. **Hard.**트리그램 문법 교정기를 구축: 잘못된 단어와 그 맥락을 고려하면, LM에 따라 문맥 확률에 따라 교정 및 순위를 생성하십시오. 버크벡 문법 korpusu (공공).

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| N-gram | Word sequence | Sequence of `n` consecutive tokens. |
| Smoothing | Avoiding zeros | Reallocating probability mass so unseen events get non-zero probability. |
| Perplexity | LM quality metric | `exp(-average log-prob)` on held-out data. Lower is better. |
| Backoff | Fallback to shorter context | If trigram count is zero, use bigram. Katz backoff formalizes this. |
| Kneser-Ney | Best smoothing for n-grams | Absolute discounting + continuation probability for the lower-order model. |
| Continuation probability | KN-specific | `P(w)` weighted by number of contexts `w` appears in, not by raw count. |
| Entropy of text | Information per symbol | Average bits needed to encode the next symbol given the context. Shannon's 1951 estimate for printed English with up to 100 letters of context: 0.6-1.3 bits/letter, measured before any model existed. |

## 더 많은 읽기

- [Shannon (1951). Prediction and Entropy of Printed English](https://www.princeton.edu/~wbialek/rome/refs/shannon_51.pdf) 모든 언어 모델이 여전히 최적화하는 목표물을 정의하는 추측 게임 실험
- [Jurafsky and Martin — Speech and Language Processing, Chapter 3 (2026 draft)](https://web.stanford.edu/~jurafsky/slp3/3.pdf) n-그램 LM의 가전적 처리와 부드러운
- [Chen and Goodman (1998). An Empirical Study of Smoothing Techniques for Language Modeling](https://dash.harvard.edu/handle/1/25104739)                                                                                                                                                                                                                                                              
- [Kneser and Ney (1995). Improved Backing-off for M-gram Language Modeling](https://ieeexplore.ieee.org/document/479394) 원본 KN 종이
- [KenLM](https://kheafield.com/code/kenlm/) 빠른 생산 n-그램 LM, 2026 년에도 여전히 지연 민감한 응용 프로그램에 사용됩니다.
