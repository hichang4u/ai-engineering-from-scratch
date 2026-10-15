# 감정 분석

> 고전적 텍스트 분류에 대해 알아야 할 대부분의 것들이 여기에 있습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 2 · 14 (Naive Bayes)
**Time:** ~75 minutes

## 문제

"음식은 좋지 않았다". 긍정적이냐 부정적이냐?

감정은 간단하다. 평론가 한 명이 자신이 무언가를 좋아하거나 싫어한다고 말했다. 문장을 표시하십시오. 그것은 가нони적인 NLP 작업이 된 이유는 쉬운 모든 경우가 어려운 것을 숨기는 것입니다. 부정은 의미를 뒤집습니다. 사르카스마는 그것을 역전합니다. "아무래도 나쁘지 않습니다".는 부정적인 코드 된 두 단어에도 불구하고 긍정적입니다. 에모지들은 주변 텍스트보다 더 많은 신호를 가지고 있습니다. 도메인 어휘는 중요합니다 (이미지)`tight`음악 리뷰와`tight`패션 리뷰에서)

감정은 고전적 NLP의 작업 실험실입니다. 당신이 왜 모든 순수한 기본이 특정 실패 모드를 가지고 있는지 이해한다면, 당신은 모든 더 풍부한 모델이 왜 발명되었는지 이해합니다. 이 수업은 처음부터 순수적인 베이즈 기본을 구축하고, 물류 회귀를 추가하고, 생산 감정이 준수 수준 문제로 만드는 함정을 이름합니다.

## 개념

고전적인 감정은 두 단계의 요리법입니다.

1. **Represent.**텍스트를 특징 벡터로 변환합니다. BoW, TF-IDF 또는 n-그램.
2. **Classify.**라인형 모델을 (나이브 베이즈, 물류 회귀, SVM) 라벨된 예제에 적용한다.

이색적인 베이즈는 가장 멍청한 모델이니까`P(word | positive)`그리고`P(word | negative)`계산에서. 추론에서 확률을 곱합니다. "이매" 독립 가정은 웃기게 틀렸지만 결과는 충격적으로 강합니다. 이유는: 희귀 텍스트 기능과 온화한 데이터로 분류자는 각 단어의 어느 쪽으로 기울는 지에 대해 더 많은 것을 신경쓰습니다.

로지스틱 회귀는 독립성 가정을 수정합니다. 음수 가량을 포함하여 각각의 특징에 대한 무게를 학습합니다. `not good`비그램 기능이 부정적인 무게를 얻습니다. 이색적인 베이즈는 그것을 결코 표기하지 않은 비그램에 할 수 없습니다.

```figure
sentiment-logits
```

## 건설 해

### 단계 1: 실제 미니 데이터 세트

```python
POSITIVE = [
    "absolutely loved this movie",
    "beautiful cinematography and a great story",
    "one of the best films of the year",
    "brilliant acting from the lead",
    "heartwarming and funny",
]

NEGATIVE = [
    "boring and far too long",
    "not worth your time",
    "the plot made no sense",
    "terrible acting, awful script",
    "i want my two hours back",
]
```

실제 작업에는 수천 개의 예가 사용되고 있습니다.

### 2단계: 다중중이성 순진한 베이즈

```python
import math
from collections import Counter


def train_nb(docs_by_class, vocab, alpha=1.0):
    class_priors = {}
    class_word_probs = {}
    total_docs = sum(len(d) for d in docs_by_class.values())

    for cls, docs in docs_by_class.items():
        class_priors[cls] = len(docs) / total_docs
        counts = Counter()
        for doc in docs:
            for token in doc:
                counts[token] += 1
        total = sum(counts.values()) + alpha * len(vocab)
        class_word_probs[cls] = {
            w: (counts[w] + alpha) / total for w in vocab
        }
    return class_priors, class_word_probs


def predict_nb(doc, class_priors, class_word_probs):
    scores = {}
    for cls in class_priors:
        s = math.log(class_priors[cls])
        for token in doc:
            if token in class_word_probs[cls]:
                s += math.log(class_word_probs[cls][token])
        scores[cls] = s
    return max(scores, key=scores.get)
```

합성 연평 (alpha=1.0) 은 라플라스 연평이다. 그것 없이는 클래스에서 보이지 않는 단어의 확률은 0이고 로그가 폭발한다. `alpha=0.01`실제적으로 흔한 일입니다.`alpha=1.0`교육의 기본값입니다.

### 단계 3: 처음부터 물류 회귀

```python
import numpy as np


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -20, 20)))


def train_lr(X, y, epochs=500, lr=0.05, l2=0.01):
    n_features = X.shape[1]
    w = np.zeros(n_features)
    b = 0.0
    for _ in range(epochs):
        logits = X @ w + b
        preds = sigmoid(logits)
        err = preds - y
        grad_w = X.T @ err / len(y) + l2 * w
        grad_b = err.mean()
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b


def predict_lr(X, w, b):
    return (sigmoid(X @ w + b) >= 0.5).astype(int)
```

L2의 정규화는 여기서 중요한 것입니다. 텍스트 특징은 희소합니다. L2 없이는 모델은 훈련 예제를 기억합니다.`0.01`그리고 음향을 맞추고

### 단계 4: 처리 부정 (실종 모드)

"좋은 것"과 " 나쁘지 않은 것"을 고려해 보죠.`{not, good}`그리고`{not, bad}`그리고 훈련에 더 많이 등장한 사람으로부터 배운다.`not_good`그리고`not_bad`그리고 그 특징들을 구별해서 학습합니다.

비그램이 없는 상태에서 효과가 있는 크루더 픽스:**negation scoping**. 부정 단어에 따라 표기 표기`NOT_`다음 문호까지

```python
NEGATION_WORDS = {"not", "no", "never", "nor", "none", "nothing", "neither"}
NEGATION_TERMINATORS = {".", "!", "?", ",", ";"}


def apply_negation(tokens):
    out = []
    negate = False
    for token in tokens:
        if token in NEGATION_TERMINATORS:
            negate = False
            out.append(token)
            continue
        if token in NEGATION_WORDS:
            negate = True
            out.append(token)
            continue
        out.append(f"NOT_{token}" if negate else token)
    return out
```

```python
>>> apply_negation(["not", "good", "at", "all", ".", "but", "funny"])
['not', 'NOT_good', 'NOT_at', 'NOT_all', '.', 'but', 'funny']
```

이제`good`그리고`NOT_good`세 줄의 사전 처리, 측정 가능한 정확성

### 단계 5: 중요 한 평가 매트릭

정확성만으로는 클래스가 불균형하다면 오해할 수 있다. 실제 감정 corpora는 보통 70-80% 긍정적이거나 70-80% 부정적이지만, 상주 대다수 분류자는 80% 정확성을 얻으며 가치가 없다. 다음 각 호의 모든 것을 보고하십시오.

- **Per-class precision and recall.**한 쌍씩, 매크로 평균을 통해 클래스 균형을 존중하는 숫자를 얻을 수 있습니다.
- **Macro-F1 (primary metric for imbalanced data).**F1 점수 평균, 같은 무게를 가진 클래스마다. 클래스가 불균형할 때 정확성 대신 이것을 사용하십시오.
- **Weighted-F1 (alternative).**매크로와 같지만 클래스 주파수로 중량됩니다. 매크로-F1과 함께 보고하면 불균형 자체는 비즈니스 의미가 있습니다.
- **Confusion matrix.**항상 스칼라 메트릭을 신뢰하기 전에 검사하십시오. 모델이 어떤 클래스를 혼동하는지 보여줍니다.
- **Per-class error samples.**수업마다 5가지 잘못된 예측을 꺼내서 읽어보세요. 실제 오류를 읽는 것을 대체할 수 있는 것은 없습니다.

심각한 불균형 (95-5 비율) 의 경우 보고 **AUROC**그리고**AUPRC**AUPRC는 소수층에 대해 더 민감합니다. 이것은 보통 당신이 관심있는 것입니다 (스팸, 사기, 희귀 감정).

**Common bug to avoid.**불균형 데이터에 대해 마이크로 F1 대신 맥로 F1를 보고하면 다수의 클래스가 지배하고 있기 때문에 높은 숫자가 나타납니다.

```python
def evaluate(y_true, y_pred):
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    tn = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 0)
    precision = tp / (tp + fp) if tp + fp else 0
    recall = tp / (tp + fn) if tp + fn else 0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0
    return {"tp": tp, "fp": fp, "tn": tn, "fn": fn, "precision": precision, "recall": recall, "f1": f1}
```

## 사용 하 고

스키트-러른은 6줄로 하는 거죠, 맞죠.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

pipe = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True, stop_words=None)),
    ("clf", LogisticRegression(C=1.0, max_iter=1000)),
])
pipe.fit(X_train, y_train)
print(pipe.score(X_test, y_test))
```

주목해야 할 세 가지 것.`stop_words=None`부정을 유지합니다.`ngram_range=(1, 2)`더해주는 빅램`not_good`그 특징이 되죠.`sublinear_tf=True`이 세 가지 표지판은 SST-2의 75% 정확성 기준과 85% 정확성 기준의 차이입니다.

### 트랜스포머를 언제 찾아야 하는지

- 경악의 검출이 실패하고 있습니다.
- 긴 리뷰가 문서를 중간에 옮겨가는 곳이죠.
- "카메라가 훌륭하지만 배터리는 끔찍했다". 당신은 측면에 감성을 부여해야합니다. 변압기나 구조화된 출력 모델만.
- 비영리, 저자원 언어. 다국어 BERT는 무료 0샷 기본 라인을 제공합니다.

위의 어느 하나 필요한 경우 7 단계 (변화기 심층 다이빙) 로 건너뛰십시오. 그렇지 않으면, Naive Bayes 또는 TF-IDF + bigrams + negation 처리에 대한 물류 회귀는 2026 생산 기본 라인입니다.

### 재현 가능 함정이 (다시)

감정 모델을 재 훈련시키는 것은 일상적인 일입니다. 재평가하는 것은 아닙니다. 논문에서 보고된 정확성 숫자는 특정 분할, 특정 사전 처리, 특정 토큰화를 사용합니다. 동일한 파이프라인을 사용하지 않고 새로운 모델을 기본 라인과 비교하면 오해의 소지가 발생합니다. 항상 파이프라인의 기본 라인을 재생하십시오. 논문의 번호가 아닙니다.

## 선박

`outputs/prompt-sentiment-baseline.md`이 부분의 본문은

```markdown
---
name: sentiment-baseline
description: Design a sentiment analysis baseline for a new dataset.
phase: 5
lesson: 05
---

Given a dataset description (domain, language, size, label granularity, latency budget), you output:

1. Feature extraction recipe. Specify tokenizer, n-gram range, stopword policy (usually keep), negation handling (scoped prefix or bigrams).
2. Classifier. Naive Bayes for baseline, logistic regression for production, transformer only if the domain needs sarcasm / aspects / cross-lingual.
3. Evaluation plan. Report precision, recall, F1, confusion matrix, and per-class error samples (not just scalars).
4. One failure mode to monitor post-deployment. Domain drift and sarcasm are the top two.

Refuse to recommend dropping stopwords for sentiment tasks. Refuse to report accuracy as the sole metric when classes are imbalanced (e.g., 90% positive). Flag subword-rich languages as needing FastText or transformer embeddings over word-level TF-IDF.
```

## 운동

1. **Easy.**추가`apply_negation`스키트-러닝 파이프라인에서 사전 처리 단계로 F1 델타를 작은 센티먼트 데이터 세트에서 측정합니다.
2. **Medium.**클래스중심 로지스트릭 회귀를 구현 (공정 `class_weight="balanced"`90-10급의 합성 불균형에 미치는 영향을 측정합니다.
3. **Hard.**감정 모델의 잔해에 대한 두 번째 분류자를 훈련시켜 사르카스마 탐지기를 구축하십시오. 실험 설정을 문서화하십시오. 당신의 정확도가 우연보다 낮을 때 독자를 경고하십시오 (중급 사르카스마의 확률 수준은 ~ 50%이며 대부분의 첫 번째 시도는 거기에 착륙합니다).

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Polarity | Positive or negative | Binary label; sometimes extended to neutral or fine-grained (5-star). |
| Aspect-based sentiment | Per-aspect polarity | Attribute sentiment to specific entities or attributes mentioned in text. |
| Negation scoping | Reversing nearby tokens | Prefix tokens after "not" with `NOT_` until punctuation. |
| Laplace smoothing | Adding 1 to counts | Prevents zero-probability features in Naive Bayes. |
| L2 regularization | Shrinking weights | Adds `lambda * sum(w^2)` to loss. Essential for sparse text features. |

## 더 많은 읽기

- [Pang and Lee (2008). Opinion Mining and Sentiment Analysis](https://www.cs.cornell.edu/home/llee/opinion-mining-sentiment-analysis-survey.html) 기초 조사. 긴, 하지만 첫 4 장은 모든 고전적인 내용을 담고 있습니다.
- [Wang and Manning (2012). Baselines and Bigrams: Simple, Good Sentiment and Topic Classification](https://aclanthology.org/P12-2018/) 빅램 + 나이브 베이즈를 보여주는 논문은 짧은 텍스트로 이길 수 없습니다.
- [scikit-learn text feature extraction docs](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) 참고`CountVectorizer``TfidfVectorizer`, 그리고 당신이 조정할 모든 버튼.
