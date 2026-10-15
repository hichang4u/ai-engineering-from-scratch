# 단어, TF-IDF, 텍스트 표현

> 먼저 계산해 보세요. TF-IDF는 2026년에도 명확한 과제를 잘 정해 놓은 채로

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 2 · 02 (Linear Regression from Scratch)
**Time:** ~75 minutes

## 문제

모델은 숫자를 필요로 합니다.

모든 NLP 파이프라인에서 같은 질문에 답해야 합니다. 어떻게 변수 길이의 토큰 스트림을 분류자가 소비할 수 있는 고정 크기의 벡터로 변환할 수 있을까요?

그 벡터는 어떤 임베디션 모델보다 더 많은 생산 NLP를 가져왔습니다. 스팸 필터, 주제 분류자, 로그 기상실 탐지, 검색 순위 (BM25 이전), 감정 분석의 첫 번째 파동, 학술적 NLP 벤치마크의 첫 번째 십 년대. 2026년, 전문가는 여전히 좁은 분류 작업에서 먼저 그것을 달성합니다. 그것은 빠르고 해석 가능하며, 종종 중요한 것은 단어의 존재가 중요한 작업에 400M 매개 변수 임베디션 모델과 구별되지 않습니다.

이 수업은 단어의 팩을 만들고, TF-IDF를 처음부터 만들고, 다음에는 3 줄에서 같은 것을 하는 스키트-러닝을 보여준다. 그리고 임베디션을 찾아내는 실패 모드를 이름 붙인다.

## 개념

**Bag of Words (BoW)**문장마다 단어의 크기가 벡터 길이가 문장 크기를 나타냅니다. 위치 `i`단어의 수입니다`i`- 그래

**TF-IDF**모든 문서에 나타나는 단어는 비정보적이기 때문에 줄일 수 있습니다. 전체에서 희귀하지만 단일 문서에서 자주 사용되는 단어는 신호입니다. 그래서 확장하십시오.

```math
\begin{aligned}
\text{TF-IDF}(w, d) &= \text{TF}(w, d) \cdot \text{IDF}(w) \\
&= \frac{\mathop{\mathrm{count}}(w \text{ in } d)}{|d|} \cdot \log\frac{N}{\mathop{\mathrm{df}}(w)}
\end{aligned}
```

어디`TF`문서에 있는 용어 빈도는,`df`문서 주파수 (이 단어를 포함하는 문서의 수)`N`전체 문서입니다.`log`모든 곳에 존재하는 단어들을 제한합니다.

핵심 속성은: 둘 다 해석 가능한 축을 가진 희귀한 벡터를 생성합니다. 훈련된 분류자의 무게를 살펴보고 문서를 각 클래스에 doğru 밀어넣는 단어를 읽을 수 있습니다. 768 차원 BERT 임베디팅으로 이것을 할 수 없습니다.

```figure
bow-tfidf
```

## 건설 해

### 단계 1: 어휘를 구성

```python
def build_vocab(docs):
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    return vocab
```

입력: 토큰화된 문서 목록 (모든 단어 수준의 토큰화가 할 수 있습니다; `code/main.py`이 수업에서는 단순화된 작문 변형을 사용 합니다. 출력: `{word: index}`정형 삽입 순서란 단어 인덱스 0 는 첫 문서 에서 볼 수 있는 첫 번째 단어 입니다. 협약은 다양 합니다.

### 2단계: 단어 팩

```python
def bag_of_words(docs, vocab):
    matrix = [[0] * len(vocab) for _ in docs]
    for i, doc in enumerate(docs):
        for token in doc:
            if token in vocab:
                matrix[i][vocab[token]] += 1
    return matrix
```

```python
>>> docs = [["cat", "sat", "on", "mat"], ["cat", "cat", "ran"]]
>>> vocab = build_vocab(docs)
>>> bag_of_words(docs, vocab)
[[1, 1, 1, 1, 0], [2, 0, 0, 0, 1]]
```

줄은 문서이고, 기둥은 어휘 지표입니다.`[i][j]`"언제나"라는 단어`j`문서에 나타납니다`i`"도크 1은`cat`두 번이나 그랬어요`ran`그렇지 않았기 때문에 0번이나

### 단계 3: 용어 주파수 및 문서 주파수

```python
import math


def term_frequency(doc_bow, doc_length):
    return [c / doc_length if doc_length else 0 for c in doc_bow]


def document_frequency(bow_matrix):
    df = [0] * len(bow_matrix[0])
    for row in bow_matrix:
        for j, count in enumerate(row):
            if count > 0:
                df[j] += 1
    return df


def inverse_document_frequency(df, n_docs):
    return [math.log((n_docs + 1) / (d + 1)) + 1 for d in df]
```

두 가지 명칭이 가치가 있는 부드러운 트릭`(n+1)/(d+1)`피합니다`log(x/0)`- `+1`모든 문서의 단어에 IDF 1 (0이 아닌) 를 여전히 포함하고 있음을 보장합니다.`log(N/df)`둘 다 작동하지만, 부드러운 버전은 더 친절합니다.

### 단계 4: TF-IDF

```python
def tfidf(bow_matrix):
    n_docs = len(bow_matrix)
    df = document_frequency(bow_matrix)
    idf = inverse_document_frequency(df, n_docs)
    out = []
    for row in bow_matrix:
        length = sum(row)
        tf = term_frequency(row, length)
        out.append([tf_j * idf_j for tf_j, idf_j in zip(tf, idf)])
    return out
```

```python
>>> docs = [
...     ["the", "cat", "sat"],
...     ["the", "dog", "sat"],
...     ["the", "cat", "ran"],
... ]
>>> vocab = build_vocab(docs)
>>> bow = bag_of_words(docs, vocab)
>>> tfidf(bow)
```

3개의 문서, 5개의 단어 (`the``cat``sat``dog``ran` ).`the`3개 모두에 나타난다고 해서 IDF가 낮습니다.`dog`1개에 나타난 것은 IDF가 높기 때문입니다. 벡터는 희소하고 (대부분의 항목은 작습니다.)

### 단계 5: L2를 정상화

```python
def l2_normalize(matrix):
    out = []
    for row in matrix:
        norm = math.sqrt(sum(x * x for x in row))
        out.append([x / norm if norm else 0 for x in row])
    return out
```

정상화 없이는 더 긴 문서는 더 큰 벡터를 얻으며 유사점 점수를 지배합니다. L2 정상화는 모든 문서를 단위 하이퍼스피에 넣습니다. 행 사이의 코시네 유사성은 이제 단지 점수 산물입니다.

## 사용 하 고

스키트-러닝은 제작판을 배포한다.

```python
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

docs = ["the cat sat on the mat", "the dog sat on the mat", "the cat ran"]

bow_vectorizer = CountVectorizer()
bow = bow_vectorizer.fit_transform(docs)
print(bow_vectorizer.get_feature_names_out())
print(bow.toarray())

tfidf_vectorizer = TfidfVectorizer()
tfidf = tfidf_vectorizer.fit_transform(docs)
print(tfidf.toarray().round(3))
```

`CountVectorizer`하나의 통화로 토큰화, 어휘, BoW를 합니다.`TfidfVectorizer`IDF 중량 및 L2 정상화를 추가합니다. 둘 다 희소 매트릭스를 반환합니다. 100k 문서에 대해, 밀집 버전은 메모리에 적합하지 않습니다. 분류자가 밀집 요구할 때까지 희소합니다.

모든 것을 변화시키는 노트:

| Arg | Effect |
|-----|--------|
| `ngram_range=(1, 2)` | Include bigrams. Usually boosts classification. |
| `min_df=2` | Drop words in fewer than 2 docs. Trims vocabulary on noisy data. |
| `max_df=0.95` | Drop words in more than 95% of docs. Approximates stopword removal without a hardcoded list. |
| `stop_words="english"` | scikit-learn's builtin stopword list. Task-dependent — sentiment analysis should *not* drop negations. |
| `sublinear_tf=True` | Use `1 + log(tf)` instead of raw `tf`. Helps when a term repeats many times in one doc. |

### TF-IDF가 여전히 승리할 때 (2026년 기준)

- 스팸 탐지, 주제 표기, 로그 기호가 표시되는 경우 단어의 존재가 중요하지만 의미적인 뉘앙스는 중요하지 않습니다.
- 낮은 데이터 정제 (백 개의 표기된 예제) TF-IDF + 물적 회귀는 훈련 전 비용이 없습니다.
- 언제든 지연이 중요해 TF-IDF+선형 모델은 마이크로초에 응답합니다. 트랜스포머를 통해 문서를 삽입하는 데는 10-100ms가 걸립니다.
- 예측을 설명해야 하는 시스템, 분류자의 계수를 검사해야 하는 시스템, 가장 긍정적인 단어들이 그 이유입니다.

### TF-IDF가 실패할 때

의미의 맹성이 실패하는 것은 다음과 같은 두 문서입니다.

- "영화도 전혀 좋지 않았다".
- "영화는 훌륭했다".

하나는 부정적인 평입니다. 하나는 긍정적입니다. 그들의 TF-IDF의 겹치는 것은 정확히`{the, movie, was}`단어의 가방 분류자는 그 단어를 기억해야 합니다`not`근처에`good`이 방법은 충분한 데이터로 학습할 수 있지만 문법을 이해하는 모델만큼은 우아하지는 않습니다.

다른 실패는 추론에서 어휘권 밖으로 나오는 단어입니다. IMDb 리뷰에 훈련된 BoW 모델은 무엇을 할 지 모릅니다.`Zoomer-approved`만약 그 토큰이 훈련에서 나타나지 않았다면.

### 하이브리드: TF-IDF 중량 임베디드

2026년 중소 데이터 분류에 대한 실용적 기본: TF-IDF 중량을 단어 임베디션에 대한 관심으로 사용한다.

```python
def tfidf_weighted_embedding(doc, tfidf_scores, embedding_table, dim):
    vec = [0.0] * dim
    total_weight = 0.0
    for token in doc:
        if token not in embedding_table or token not in tfidf_scores:
            continue
        weight = tfidf_scores[token]
        emb = embedding_table[token]
        for i in range(dim):
            vec[i] += weight * emb[i]
        total_weight += weight
    if total_weight == 0:
        return vec
    return [v / total_weight for v in vec]
```

함축에서 의미적 용량을 얻으며, TF-IDF에서 희귀 단어 중점을 얻습니다. 분류자는 합성 벡터에 열차합니다. 이것은 감정, 주제 및 의도 분류에 대해 자체적으로 50k 라벨 된 예제보다 우월합니다.

## 선박

`outputs/prompt-vectorization-picker.md`이 부분의 본문은

```markdown
---
name: vectorization-picker
description: Given a text-classification task, recommend BoW, TF-IDF, embeddings, or a hybrid.
phase: 5
lesson: 02
---

You recommend a text-vectorization strategy. Given a task description, output:

1. Representation (BoW, TF-IDF, transformer embeddings, or a hybrid). Explain why in one sentence.
2. Specific vectorizer configuration. Name the library. Quote the arguments (`ngram_range`, `min_df`, `max_df`, `sublinear_tf`, `stop_words`).
3. One failure mode to test before shipping.

Refuse to recommend embeddings when the user has under 500 labeled examples unless they show evidence of semantic failure in a TF-IDF baseline. Refuse to remove stopwords for sentiment analysis (negations carry signal). Flag class imbalance as needing more than a vectorizer change.

Example input: "Classifying 30k customer support tickets into 12 categories. Most tickets are 2-3 sentences. English only. Need explainability for audit logs."

Example output:

- Representation: TF-IDF. 30k examples is not small; explainability requirement rules out dense embeddings.
- Config: `TfidfVectorizer(ngram_range=(1, 2), min_df=3, max_df=0.95, sublinear_tf=True, stop_words=None)`. Keep stopwords because category keywords sometimes are stopwords ("not working" vs "working").
- Failure to test: verify `min_df=3` does not drop rare category keywords. Run `get_feature_names_out` filtered by class and eyeball.
```

## 운동

1. **Easy.**시행`cosine_similarity(doc_vec_a, doc_vec_b)`L2 표준화된 TF-IDF 출력에서 동일 문서의 점수 1.0 점수를 확인하고, 단절 단어자료 문서의 점수를 0.0 점수를 확인합니다.
2. **Medium.**추가`n-gram`지원`bag_of_words`. 파라미터`n`수를 더 많이 생산합니다`n`- 그래마, 테스트해`n=2` `["the", "cat", "sat"]`    `["the cat", "cat sat"]`- 그래
3. **Hard.**GloVe 100d 벡터를 사용하여 TF-IDF 중량 임베디드 하이브리드를 위에서 구축하십시오. 20 뉴스그룹 데이터 세트에 일반 TF-IDF 및 일반 평균 융합 임베디드와 분류 정확도를 비교하십시오. 어느 쪽이 승리하는지 보고하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BoW | Word frequency vector | Counts of vocabulary words in one document. Throws away order. |
| TF | Term frequency | Count of a word in a document, optionally normalized by document length. |
| DF | Document frequency | Count of documents containing the word at least once. |
| IDF | Inverse document frequency | `log(N / df)` smoothed. Downweights words that appear everywhere. |
| Sparse vector | Mostly zeros | Vocabulary is typically 10k-100k words; most are absent from any given document. |
| Cosine similarity | Vector angle | Dot product of L2-normalized vectors. 1 is identical, 0 is orthogonal. |

## 더 많은 읽기

- [scikit-learn — feature extraction from text](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) 가톨릭 API 참조, 각 버튼에 메모.
- [Salton, G., & Buckley, C. (1988). Term-weighting approaches in automatic text retrieval](https://www.sciencedirect.com/science/article/pii/0306457388900210) TF-IDF를 10년 동안 기본으로 만든 논문
- ["Why TF-IDF Still Beats Embeddings" — Ashfaque Thonikkadavan (Medium)](https://medium.com/@cmtwskb/why-tf-idf-still-beats-embeddings-ad85c123e1b2)2026년, 언제 옛 방법들이 승리할 것인가, 왜 그럴 것인가?
