# GloVe, FastText, 그리고 서브워드 임베디션

> Word2Vec는 단어당 한 개의 임베디션을 훈련시켰습니다. GloVe는 공동 발생 매트릭스를 가중화했습니다. FastText은 조각들을 임베디했습니다. BPE는 트랜스포머에 연결되었습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec from Scratch)
**Time:** ~45 minutes

## 문제

Word2Vec는 두 가지 질문을 남겼다.

첫째, 온라인 스프프그램 업데이트를 하기보다는 공동 발생 매트릭스를 직접 (LSA, HAL) 가 가공하는 병렬 연구 라인이 있었다. Word2Vec의 반복적 접근 방식은 근본적으로 더 좋았습니까? 아니면 두 가지 방법을 다루는 방법에 대한 차이점이 계산되는 것이었습니까?**GloVe**그 답은: 신중하게 선택된 손실과 일치하거나 Word2Vec를 제치고, 훈련 비용이 덜 들며

둘째, 그 방법들은 그 전에 본 적이 없는 단어들을 위한 이야기를 가지고 있지 않았습니다.`Zoomer-approved``dogecoin`, 지난주 발명한 모든 고유 명칭, 희귀 뿌리의 모든 휘어지는 형태**FastText**n-그램을 함축하여 이것을 수정합니다. 단어는 모프메스를 포함한 부분의 합입니다. 그래서 단어들은

셋째, 트랜스포머가 도착하자, 질문은 다시 바뀌었습니다. 단어 수준의 어휘는 약 백만 개의 항목을 꽉 차 있습니다. 실제 언어는 그보다 더 개방적입니다. **Byte-pair encoding (BPE)**그리고 그 친척들은 모든 것을 포함하는 빈번한 서브워드 단위의 어휘를 학습함으로써 이것을 해결했습니다. 모든 현대 LLM의 모든 토큰이 서브워드 토큰입니다.

이 교훈은 세 가지 모두 설명하고, 어느 쪽을 언제까지 도달해야 하는지 설명합니다.

## 개념

**GloVe (Global Vectors).**단어-말 공동 발생 행렬을 구축합니다`X`어디`X[i][j]`얼마나 자주 단어 `j`단어의 맥락에서 나타납니다`i`. 열차 벡터`v_i · v_j + b_i + b_j ≈ log(X[i][j])`무게는 너무 자주 빠지는 커플이 지배하지 않습니다.

**FastText.**단어란 문자 n-그램을 합쳐 단어 자체입니다.`where``<wh, whe, her, ere, re>, <where>`. 단어 벡터는 그 구성 요소 벡터의 합입니다.`whereupon`) 는 알려진 n-그램으로 구성된다.

**BPE (Byte-Pair Encoding).**개개 바이트 (또는 문자) 의 어휘를 시작하여, 코퍼스의 각 인접 쌍을 셀 수 있습니다. 가장 빈번한 쌍을 새로운 토큰으로 합쳐주세요.`k`반복. 결과: `k + 256`주파수 (`ing``tion``the`) 는 단 하나의 표징이고 희귀한 단어들은 익숙한 조각으로 분해된다.

```figure
n5-subword-merge
```

## 건설 해

### GloVe: 동행성 행렬을 가공화

```python
import numpy as np
from collections import Counter


def build_cooccurrence(docs, window=5):
    pair_counts = Counter()
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    for doc in docs:
        indexed = [vocab[t] for t in doc]
        for i, center in enumerate(indexed):
            for j in range(max(0, i - window), min(len(indexed), i + window + 1)):
                if i != j:
                    distance = abs(i - j)
                    pair_counts[(center, indexed[j])] += 1.0 / distance
    return vocab, pair_counts


def glove_train(vocab, pair_counts, dim=16, epochs=100, lr=0.05, x_max=100, alpha=0.75, seed=0):
    n = len(vocab)
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(n, dim))
    W_tilde = rng.normal(0, 0.1, size=(n, dim))
    b = np.zeros(n)
    b_tilde = np.zeros(n)

    for epoch in range(epochs):
        for (i, j), x_ij in pair_counts.items():
            weight = (x_ij / x_max) ** alpha if x_ij < x_max else 1.0
            diff = W[i] @ W_tilde[j] + b[i] + b_tilde[j] - np.log(x_ij)
            coef = weight * diff

            grad_W_i = coef * W_tilde[j]
            grad_W_tilde_j = coef * W[i]
            W[i] -= lr * grad_W_i
            W_tilde[j] -= lr * grad_W_tilde_j
            b[i] -= lr * coef
            b_tilde[j] -= lr * coef

    return W + W_tilde
```

두 개의 움직이는 조각을 명명할 가치가 있습니다. 중량 기능`f(x) = (x/x_max)^alpha`하위 무게 매우 빈번한 쌍 (예:`(the, and)`) 즉, 손실을 지배하지 않습니다. 최종 임베디션은 `W`(중) 그리고`W_tilde`(사태) 테이블. 두 가지를 합치는 것은 하나의 트릭을 더 잘하는

### FastText: 하위 단어에 대한 인식 임베디션

```python
def char_ngrams(word, n_min=3, n_max=6):
    wrapped = f"<{word}>"
    grams = {wrapped}
    for n in range(n_min, n_max + 1):
        for i in range(len(wrapped) - n + 1):
            grams.add(wrapped[i:i + n])
    return grams
```

```python
>>> char_ngrams("where")
{'<where>', '<wh', 'whe', 'her', 'ere', 're>', '<whe', 'wher', 'here', 'ere>', '<wher', 'where', 'here>'}
```

각 단어는 n-그램의 집합으로 나타난다 (일반적으로 3~6 문자로). 단어 임베딩은 n-그램 임베딩의 합입니다. 스kip-그램 훈련에 있어서 Word2Vec가 단일 벡터를 사용한 경우 이것을 플러그.

```python
def fasttext_vector(word, ngram_table):
    grams = char_ngrams(word)
    vecs = [ngram_table[g] for g in grams if g in ngram_table]
    if not vecs:
        return None
    return np.sum(vecs, axis=0)
```

보이지 않는 단어에 대해서는 n-그램이 알려진 한, 여전히 벡터를 얻을 수 있습니다.`whereupon`주식`<wh``her``ere`그리고`<where``where`그래서 둘은 서로 가까이에 도착합니다.

### BPE: 학습된 하위 단어 어휘

```python
def learn_bpe(corpus, k_merges):
    vocab = Counter()
    for word, freq in corpus.items():
        tokens = tuple(word) + ("</w>",)
        vocab[tokens] = freq

    merges = []
    for _ in range(k_merges):
        pair_freq = Counter()
        for tokens, freq in vocab.items():
            for a, b in zip(tokens, tokens[1:]):
                pair_freq[(a, b)] += freq
        if not pair_freq:
            break
        best = pair_freq.most_common(1)[0][0]
        merges.append(best)

        new_vocab = Counter()
        for tokens, freq in vocab.items():
            new_tokens = []
            i = 0
            while i < len(tokens):
                if i + 1 < len(tokens) and (tokens[i], tokens[i + 1]) == best:
                    new_tokens.append(tokens[i] + tokens[i + 1])
                    i += 2
                else:
                    new_tokens.append(tokens[i])
                    i += 1
            new_vocab[tuple(new_tokens)] = freq
        vocab = new_vocab
    return merges


def apply_bpe(word, merges):
    tokens = list(word) + ["</w>"]
    for a, b in merges:
        new_tokens = []
        i = 0
        while i < len(tokens):
            if i + 1 < len(tokens) and tokens[i] == a and tokens[i + 1] == b:
                new_tokens.append(a + b)
                i += 2
            else:
                new_tokens.append(tokens[i])
                i += 1
        tokens = new_tokens
    return tokens
```

```python
>>> corpus = Counter({"low": 5, "lower": 2, "newest": 6, "widest": 3})
>>> merges = learn_bpe(corpus, k_merges=10)
>>> apply_bpe("lowest", merges)
['low', 'est</w>']
```

첫 번째 반복은 가장 일반적인 인접 쌍을 합쳐줍니다. 충분한 반복 후에, 빈번한 하위 문자열 (`low``est``tion`) 는 단일 토큰이 되고 희귀한 단어들은 깨끗하게 깨진다.

실제 GPT/BERT/T5 토큰화는 30k-100k 융합을 학습합니다. 결과는: 모든 텍스트가 알려진 ID의 제한된 길이 순서로 토큰화됩니다. OOV는 없습니다.

## 사용 하 고

실제로는 이런 것들을 직접 훈련시키는 일은 거의 없습니다. 미리 훈련된 체크포인트들을 채우죠.

```python
import fasttext.util
fasttext.util.download_model("en", if_exists="ignore")
ft = fasttext.load_model("cc.en.300.bin")
print(ft.get_word_vector("whereupon").shape)
print(ft.get_word_vector("zoomerapproved").shape)
```

트랜스포머 시대 BPE 스타일의 서브워드 토큰화:

```python
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("gpt2")
print(tok.tokenize("unbelievably tokenized"))
```

```
['un', 'bel', 'iev', 'ably', 'Ġtoken', 'ized']
```

`Ġ`사전은 단어 경계를 표시합니다 (GPT-2 협약). 모든 현대 토큰화는 BPE 변종, WordPiece (BERT) 또는 SentencePiece (T5, LLaMA) 이다.

### 언제 선택해야 하는 것

| Situation | Pick |
|-----------|------|
| Pretrained general-purpose word vectors, no OOV tolerance needed | GloVe 300d |
| Pretrained general-purpose word vectors, must handle misspellings / neologisms / morphologically rich languages | FastText |
| Anything going into a transformer (training or inference) | Whatever tokenizer the model shipped with. Never swap. |
| Training your own language model from scratch | Train a BPE or SentencePiece tokenizer on your corpus first |
| Production text classification with a linear model | Still TF-IDF. Lesson 02. |

## 선박

`outputs/skill-embeddings-picker.md`이 부분의 본문은

```markdown
---
name: tokenizer-picker
description: Pick a tokenization approach for a new language model or text pipeline.
version: 1.0.0
phase: 5
lesson: 04
tags: [nlp, tokenization, embeddings]
---

Given a task and dataset description, you output:

1. Tokenization strategy (word-level, BPE, WordPiece, SentencePiece, byte-level). One-sentence reason.
2. Vocabulary size target (e.g., 32k for an English-only LM, 64k-100k for multilingual).
3. Library call with the exact training command. Name the library. Quote the arguments.
4. One reproducibility pitfall. Tokenizer-model mismatch is the single most common silent production bug; call out which pair must be used together.

Refuse to recommend training a custom tokenizer when the user is fine-tuning a pretrained LLM. Refuse to recommend word-level tokenization for any model targeting production inference. Flag non-English / multi-script corpora as needing SentencePiece with byte fallback.
```

## 운동

1. **Easy.**달아`char_ngrams("playing")`그리고`char_ngrams("played")`n-그램 집합의 자커드 초복을 계산해 보세요.`pla``lay``play`), 그래서 FastText은 형상학적 변종들을 잘 전달합니다.
2. **Medium.**확장`learn_bpe`용어 배포의 성장을 추적하기 위해. 융합 수의 함수로 토큰-당-체자-자본을 그려보세요. 처음에는 빠른 압축을 보실 수 있습니다. 토큰당 약 2-3 개의 기호를 씁니다.
3. **Hard.**셰익스피어의 작품에 대한 1k 합성 BPE를 훈련시켜 보시다. 일반적인 단어와 희귀 고유 명목의 표기법을 비교해 보세요. 단어당 평균 표기점을 측정해 보세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Co-occurrence matrix | Word-word frequency table | `X[i][j]` = how often word `j` appears in a window around word `i`. |
| Subword | Piece of a word | A character n-gram (FastText) or learned token (BPE/WordPiece/SentencePiece). |
| BPE | Byte-pair encoding | Iterative merging of most-frequent adjacent pairs until vocabulary hits target size. |
| OOV | Out of vocabulary | Word the model has never seen. Word2Vec/GloVe fail. FastText and BPE handle it. |
| Byte-level BPE | BPE on raw bytes | GPT-2's scheme. Vocabulary starts with 256 bytes, so nothing is ever OOV. |

## 더 많은 읽기

- [Pennington, Socher, Manning (2014). GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/pubs/glove.pdf)7페이지의 글로브 논문으로 여전히 손실의 가장 좋은 추출입니다.
- [Bojanowski et al. (2017). Enriching Word Vectors with Subword Information](https://arxiv.org/abs/1607.04606) 패스트텍스트
- [Sennrich, Haddow, Birch (2016). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) BPE를 현대 NLP에 도입한 논문
- [Hugging Face tokenizer summary](https://huggingface.co/docs/transformers/tokenizer_summary) 실제 BPE, WordPiece, SentencePiece의 차이점은
