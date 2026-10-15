# 워드 임베디션  Word2Vec

> 단어란 그 아이디어에 대해 한 네트워크를 훈련시켜서 기하학이 떨어집니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 3 · 03 (Backpropagation from Scratch)
**Time:** ~75 minutes

## 문제

TF-IDF가 알고 있습니다`dog`그리고`puppy`다른 단어들이죠. 거의 같은 것을 의미한다는 것을 알지 못합니다.`dog``puppy`이 내용을 공평한 단어로 나열하면 되지만, 드문 용어, 도메인 용어, 그리고 예상하지 못한 모든 언어에 대해서는 실패합니다.

당신은 어떤 곳에서 대표를 원해요`dog`그리고`puppy`우주에서 서로 가까이 착륙합니다.`king - man + woman`근처에 있는 땅`queen`. 모델이 훈련한 곳`dog`신호를 전송합니다`puppy`무료입니다.

Word2Vec는 우리에게 그 공간을 주었습니다. 2층 신경망, 트리లియన్ 토큰 훈련 실행, 2013년에 출판되었습니다. 건축은 거의 부끄러운 간단합니다. 결과는 10년간 NLP를 재구성했습니다.

## 개념

**Distributional hypothesis**"그 단어 는 그 들 이 함께 하는 사람 들 에게 알려지게 된다". (첫 번째, 1957): "그 단어 는 두 단어 가 비슷한 맥락 에서 나타났다면, 그 단어 들 은 비슷한 의미 를 가질 것 이다.

Word2Vec는 두 가지 맛으로 제공됩니다. 두 가지 모두 그 아이디어를 이용합니다.

- **Skip-gram.**중심 단어로 인해 주변 단어들을 예측해 보세요.`cat -> (the, sat, on)`창 크기가 2이
- **CBOW (continuous bag of words).**주변 단어들을 보면, 중심부를 예측해 보세요.`(the, sat, on) -> cat`- 그래

스키프그램은 훈련에 더 느려지만 희귀한 단어를 잘 처리합니다.

네트워크는 비선형성을 가진 숨겨진 층을 가지고 있습니다. 입력은 어휘에 대한 한 핫 벡터입니다. 출력은 어휘에 대한 부드러운 최대입니다. 훈련 후, 출력 층을 던져 버립니다. 숨겨진 층 무게는 임베디션입니다.

```
one-hot(center) ── W ──▶ hidden (d-dim) ── W' ──▶ softmax(vocab)
                          ^
                          this is the embedding
```

트릭은 100만 단어 이상의 소프트맥스가 너무 비싸다는 겁니다.**negative sampling**이중 분류 작업으로 변환하기 위해. "이 컨텍스트 단어가 이 중추 단어 근처에 나타났는지, 예 또는 아니"를 예측합니다. 훈련 쌍당 몇 개의 부정적인 (동행되지 않는) 단어를 샘플링하십시오.

```figure
word-vector-arithmetic
```

## 건설 해

### 단계 1: 코퍼스에서 훈련 커플

```python
def skipgram_pairs(docs, window=2):
    pairs = []
    for doc in docs:
        for i, center in enumerate(doc):
            for j in range(max(0, i - window), min(len(doc), i + window + 1)):
                if i == j:
                    continue
                pairs.append((center, doc[j]))
    return pairs
```

```python
>>> skipgram_pairs([["the", "cat", "sat", "on", "mat"]], window=2)
[('the', 'cat'), ('the', 'sat'),
 ('cat', 'the'), ('cat', 'sat'), ('cat', 'on'),
 ('sat', 'the'), ('sat', 'cat'), ('sat', 'on'), ('sat', 'mat'),
 ...]
```

창의 모든 (중심, 맥락) 쌍은 긍정적 인 훈련 예입니다.

### 단계 2: 테이블을 삽입

두 개의 매트릭스`W`중추 단어 임베디션 테이블 (당신이 보관하는 테이블) 이다.`W'`문맥 단어 테이블 (일반적으로 폐기되고, 때로는 평균적으로 `W`)

```python
import numpy as np


def init_embeddings(vocab_size, dim, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(vocab_size, dim))
    W_prime = rng.normal(0, 0.1, size=(vocab_size, dim))
    return W, W_prime
```

작은 무작위 init. 10k와 dim 100의 음자 크기는 현실적입니다. 교수용으로 50개의 음자 x 16개의 음자 크기는 기하학을 볼 수 있을 정도로 충분합니다.

### 단계 3: 부정적 샘플링 목표

양성쌍마다`(center, context)`, 샘플`k`음의 경우, 모형을 훈련시켜 점수 곱하기`W[center] · W'[context]`긍정적인 부분에서 높고 부정적인 부분에서는 낮습니다.

```python
def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -20, 20)))


def train_pair(W, W_prime, center_idx, context_idx, negative_indices, lr):
    v_c = W[center_idx]
    u_pos = W_prime[context_idx]
    u_negs = W_prime[negative_indices]

    pos_score = sigmoid(v_c @ u_pos)
    neg_scores = sigmoid(u_negs @ v_c)

    grad_center = (pos_score - 1) * u_pos
    for i, u in enumerate(u_negs):
        grad_center += neg_scores[i] * u

    W[context_idx] = W[context_idx]
    W_prime[context_idx] -= lr * (pos_score - 1) * v_c
    for i, neg_idx in enumerate(negative_indices):
        W_prime[neg_idx] -= lr * neg_scores[i] * v_c
    W[center_idx] -= lr * grad_center
```

마법의 공식: 양쌍에서 물적 손실 (시그모이드 1 근처에 원하는) + 음쌍에서 물적 손실 (시그모이드 0 근처에 원하는) 은. 양쪽 테이블로 gradients가 흐른다. 전체 추리법은 원래 종이에 있습니다.

### 4단계: 장난감 코퍼스에 훈련

```python
def train(docs, dim=16, window=2, k_neg=5, epochs=100, lr=0.05, seed=0):
    vocab = build_vocab(docs)
    vocab_size = len(vocab)
    rng = np.random.default_rng(seed)
    W, W_prime = init_embeddings(vocab_size, dim, seed=seed)
    pairs = skipgram_pairs(docs, window=window)

    for epoch in range(epochs):
        rng.shuffle(pairs)
        for center, context in pairs:
            c_idx = vocab[center]
            ctx_idx = vocab[context]
            negs = rng.integers(0, vocab_size, size=k_neg)
            negs = [n for n in negs if n != ctx_idx and n != c_idx]
            train_pair(W, W_prime, c_idx, ctx_idx, negs, lr)
    return vocab, W
```

큰 코퍼스에서 충분한 시대를 지나면, 맥락을 공유하는 단어들은 비슷한 중심에 자리잡고 있습니다. 장난감 코퍼스에서, 당신은 그 효과를 희미하게 볼 수 있습니다. 수십억 개의 토큰에서는, 당신은 그것을 극적으로 볼 수 있습니다.

### 5단계: 비유 트릭

```python
def nearest(vocab, W, target_vec, topk=5, exclude=None):
    exclude = exclude or set()
    inv_vocab = {i: w for w, i in vocab.items()}
    norms = np.linalg.norm(W, axis=1, keepdims=True) + 1e-9
    W_norm = W / norms
    target = target_vec / (np.linalg.norm(target_vec) + 1e-9)
    sims = W_norm @ target
    order = np.argsort(-sims)
    out = []
    for i in order:
        if i in exclude:
            continue
        out.append((inv_vocab[i], float(sims[i])))
        if len(out) == topk:
            break
    return out


def analogy(vocab, W, a, b, c, topk=5):
    v = W[vocab[b]] - W[vocab[a]] + W[vocab[c]]
    return nearest(vocab, W, v, topk=topk, exclude={vocab[a], vocab[b], vocab[c]})
```

사전 훈련된 300d 구글 뉴스 벡터:

```python
>>> analogy(vocab, W, "man", "king", "woman")
[('queen', 0.71), ('monarch', 0.62), ('princess', 0.59), ...]
```

`king - man + woman = queen`모델이 왕실의 의미를 알고 있기 때문이 아니라`(king - man)`"왕국"과 같은 것을 포착하고,`woman`왕자여성지역 근처에 있는 땅

## 사용 하 고

Word2Vec를 처음부터 작성하는 것은 교육입니다.`gensim`- 그래

```python
from gensim.models import Word2Vec

sentences = [
    ["the", "cat", "sat", "on", "the", "mat"],
    ["the", "dog", "ran", "across", "the", "room"],
]

model = Word2Vec(
    sentences,
    vector_size=100,
    window=5,
    min_count=1,
    sg=1,
    negative=5,
    workers=4,
    epochs=30,
)

print(model.wv["cat"])
print(model.wv.most_similar("cat", topn=3))
```

실제 작업에서는 거의 Word2Vec를 직접 훈련하지 않습니다. 미리 훈련된 벡터를 다운로드합니다.

- **GloVe** 스탠퍼드 공동 발생 매트릭스 인자분배 접근법 50d, 100d, 200d, 300d 체크포인트. 좋은 일반적인 커버리지. 수업 04은 구체적으로 GloVe를 다루고 있습니다.
- **fastText** 문자 n-그램을 내장하는 페이스북의 Word2Vec 확장 프로그램. 하위 단어를 작성함으로써 어휘권 밖의 단어를 처리합니다. 수업 04.
- **Pretrained Word2Vec on Google News** 300d, 3M 단어 어휘, 2013년 출판. 여전히 매일 다운로드.

### 2026년에도 워드2벡이 승리할 때

- 1시간 안에 의료 추석을 연습해 노트북으로 전문적인 벡터를 얻으세요
- 비유형 기능 공학`gender_vector = mean(man - woman pairs)`다른 단어에서 빼면 성중립축을 얻을 수 있습니다. 여전히 공정성 연구에서 사용됩니다.
- 해석가능성. 100d는 PCA 또는 t-SNE를 통해 그래프를 그리기 위해 충분히 작습니다.
- 모든 곳에서 추론은 GPU 없이 장치에서 실행되어야 합니다. Word2Vec 검색은 한 줄의 검색입니다.

### Word2Vec가 실패할 경우

다중화 벽`bank`1개의 벡터를 가지고 있습니다.`river bank`그리고`financial bank`공유해`table`(프레드시트 vs. 가구) 이 공유합니다. 하류 분류자는 감각과 벡터를 구별할 수 없습니다.

컨텍스트 임베디션 (ELMo, BERT, 그 이후 모든 트랜스포머) 은 주변 컨텍스트에 따라 단어의 각 발생에 대한 다른 벡터를 생성함으로써 문제를 해결했습니다. 즉 Word2Vec에서 BERT로: 정적에서 컨텍스트로 뛰어드는 것입니다. 7 단계는 트랜스포머 반을 포함합니다.

어휘의 문제점은 다른 실패입니다. Word2Vec는`Zoomer-approved`만약 훈련 데이터에 있지 않다면. 후퇴가 없습니다. fastText은 이 문제를 하위 단어 구성으로 수정합니다 (강습 04).

## 선박

`outputs/skill-embedding-probe.md`이 부분의 본문은

```markdown
---
name: embedding-probe
description: Inspect a word2vec model. Run analogies, find neighbors, diagnose quality.
version: 1.0.0
phase: 5
lesson: 03
tags: [nlp, embeddings, debugging]
---

You probe trained word embeddings to verify they are working. Given a `gensim.models.KeyedVectors` object and a vocabulary, you run:

1. Three canonical analogy tests. `king : man :: queen : woman`. `paris : france :: tokyo : japan`. `walking : walked :: swimming : ?`. Report the top-1 result and its cosine.
2. Five nearest-neighbor tests on domain-specific words the user supplies. Print top-5 neighbors with cosines.
3. One symmetry check. `similarity(a, b) == similarity(b, a)` to within float precision.
4. One degenerate check. If any embedding has a norm below 0.01 or above 100, the model has a training bug. Flag it.

Refuse to declare a model good on analogy accuracy alone. Analogy benchmarks are gameable and do not transfer to downstream tasks. Recommend intrinsic + downstream evaluation together.
```

## 운동

1. **Easy.**작은 코퍼스에서 훈련 루프를 실행하세요. 고양이와 개에 대한 20 문장. 200 시대 후에 확인하세요.`nearest(vocab, W, W[vocab["cat"]])`수익금`dog`만약 그렇지 않다면, 시대나 어휘를 늘려라.
2. **Medium.**빈번한 단어의 하위 샘플을 추가합니다.`10^-5`이 두 가지의 경우, 두 개의 단어의 공통성 (Rare-word similarity) 에 대한 영향을 측정하는 경우,
3. **Hard.**20 뉴스그룹의 코퍼스에서 모델을 훈련시켜 두 가지 편향 축을 계산하십시오.`he - she`그리고`doctor - nurse`두 축에 직업 단어들을 프로젝트. 어떤 직업이 가장 큰 편향 격차를 가지고 있는지 보고. 이것은 탐사 공정성 연구자들이 사용하는 종류의 것입니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Word embedding | Word as a vector | A dense, low-dim (typically 100-300) representation learned from context. |
| Skip-gram | Word2Vec trick | Predict context words from center word. Slower than CBOW, better for rare words. |
| Negative sampling | Training shortcut | Replace softmax over full vocab with binary classification against `k` random words. |
| Static embedding | One vector per word | Same vector regardless of context. Fails on polysemy. |
| Contextual embedding | Context-sensitive vector | Different vector for each occurrence based on surrounding words. What transformers produce. |
| OOV | Out of vocabulary | Word not seen in training. Word2Vec cannot produce a vector for these. |

## 더 많은 읽기

- [Mikolov et al. (2013). Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546) 부정 샘플링 종이를 짧고 읽을 수 있습니다.
- [Rong, X. (2014). word2vec Parameter Learning Explained](https://arxiv.org/abs/1411.2738) 가장 명확한 추리 gradients, 원래 논문의 수학이 밀도가 높은 느낌.
- [gensim Word2Vec tutorial](https://radimrehurek.com/gensim/models/word2vec.html)실제로 작동하는 생산 훈련 설정
