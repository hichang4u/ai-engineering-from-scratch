# 규범과 거리는

> 거리의 함수는 "동적"의 의미를 정의합니다. 잘못된 선택은 하류로 모든 것이 끊어집니다.

**Type:** Build
**Language:**파이썬
**Prerequisites:** Phase 1, Lessons 01 (Linear Algebra Intuition), 02 (Vectors, Matrices & Operations)
**Time:** ~90 minutes

## 학습 목표

- L1, L2, cosine, Mahalanobis, Jaccard을 구현하고 거리 함수를 처음부터 편집
- 주어진 ML 작업에 적합한 거리 측정값을 선택하고 대체 방법이 실패하는 이유를 설명합니다.
- L1 및 L2 규범을 LASSO 및 Ridge 정규화 및 그 기하학적 제한 영역에 연결합니다
- 동일한 데이터 세트가 서로 다른 측정값에 따라 서로 다른 가까운 이웃을 생성하는 방법을 증명합니다.

## 문제

두 개의 벡터가 있습니다. 아마도 단어 임베디션일 수도 있고, 사용자 프로필일 수도 있고, 픽셀 배열일 수도 있습니다.

답은 어떤 거리 함수를 선택하느냐에 전적으로 달려 있습니다. 두 데이터 포인트는 한 메트릭 아래 가장 가까운 이웃이고 다른 메트릭 아래는 멀리 떨어져 있을 수 있습니다. KNN 분류기, 추천 엔진, 벡터 데이터베이스, 클러스터링 알고리즘, 손실 함수 - 모두 이 선택에 달려 있습니다. 잘못하면 모델이 잘못된 것을 최적화합니다.

우주 최선 거리는 없습니다. L2는 공간 데이터에 대해 작동합니다. 코시네 유사성은 NLP를 지배합니다. 자커드는 집합을 처리합니다. 거리를 편집하는 것은 문자열을 처리합니다. 마하랄로비스는 상관관계를 계산합니다. 와스스스테인은 확률 질량을 움직입니다. 각각은 "동생"의 의미에 대한 다른 가정을 암호화합니다.

이 수업은 모든 주요 거리 함수를 처음부터 구축하고, 각각의 도구가 올바른 도구가 될 때 보여줍니다. 그리고 어떤 메트릭을 사용하느냐에 따라 동일한 데이터가 완전히 다른 가까운 이웃을 생성하는 방법을 보여줍니다.

## 개념

### 표준: 벡터 크기를 측정하는

표준은 벡터의 " 사이즈를 " 측정합니다. 두 벡터 사이의 모든 거리 함수는 그들의 차이의 표준으로 작성될 수 있습니다.$d(a, b) = \lVert a - b \rVert$규범을 이해하는 것은 거리를 이해하는 것입니다.

### L1 Norm (만해튼 거리는)

L1 표준은 모든 구성 요소의 절대 값을 합한다.

```math
\lVert x \rVert_1 = |x_1| + |x_2| + \cdots + |x_n|
```

맨해튼 거리는 도시 그리드에서 얼마나 멀리 걸을 수 있는지 측정하기 때문에

```
Point A = (1, 1)
Point B = (4, 5)

L1 distance = |4-1| + |5-1| = 3 + 4 = 7

On a grid, you walk 3 blocks east and 4 blocks north.
```

L1을 언제 사용해야 하는지:
- 고차원 희소 데이터 ( 텍스트 기능, 일-열한 코딩)
- 비정상적일 수 있는 강도를 원할 때 (한 가지 큰 차이가 지배하지 않습니다)
- 특징 선택 문제 (L1 정규화는 희미성을 촉진한다)

L1 정규화 (Lasso) 에 연결: 추가 $\lVert w \rVert_1$이 경우, 작은 무게가 정확히 0으로 밀려지며 자동적인 기능 선택을 수행합니다. L1 페널티는 무게 공간에서 다이아몬드 모양의 제약 영역을 생성하고 다이아몬드의 각은 일부 무게가 0이있는 축에 있습니다.

손실 함수와의 연결: 평균 절대 오류 (MAE) 는 예측과 목표 사이의 평균 L1 거리를 의미합니다. 모든 오류를 선형적으로 처벌하여 MSE와 비교하여 비정상적 수준에 견고하게 만듭니다.

### L2 표준 (유클리드 거리)

L2 표준은 직선 거리에 있습니다. 제곱근은 제곱 구성 요소의 합입니다.

```math
\lVert x \rVert_2 = \sqrt{x_1^2 + x_2^2 + \cdots + x_n^2}
```

이 거리는 기하학 수업에서 배운 거리가에요.$n$크기가

```
Point A = (1, 1)
Point B = (4, 5)

L2 distance = sqrt((4-1)^2 + (5-1)^2) = sqrt(9 + 16) = sqrt(25) = 5.0

The straight line, cutting diagonally through the grid.
```

L2를 언제 사용해야 하는지:
- 낮은 차원에서 중 차원 연속 데이터
- 특징의 척도가 비교될 때
- 물리적 거리 (공간 데이터, 센서 가수)
- 픽셀 수준에서의 이미지 유사성

L2 정규화 연결 (Ridge): 추가 $\lVert w \rVert_2^2$L1과 달리 무게를 0으로 밀어내지는 않습니다. 모든 무게를 0으로 비축합니다. L2 페널티는 원형 제한 영역을 만듭니다. 그래서 축에 각이 없습니다. 무게는 작지만 거의 거의 0이 아닙니다.

손실 함수와의 연결: 평균 제곱 오류 (MSE) 는 L2 거리의 제곱 평균이다. 제곱은 작은 실수보다 큰 오류를 더 심각하게 처벌합니다.

```math
\begin{aligned}
\text{MAE (L1 loss):} \quad & |y - \hat{y}| && \text{Linear penalty. Robust to outliers.} \\
\text{MSE (L2 loss):} \quad & (y - \hat{y})^2 && \text{Quadratic penalty. Sensitive to outliers.}
\end{aligned}
```

### Lp 규범: 일반 가족

L1 및 L2는 Lp 규범의 특별한 경우입니다.

```math
\lVert x \rVert_p = (|x_1|^p + |x_2|^p + \cdots + |x_n|^p)^{1/p}
```

의 다른 값$p$다른 모양의 "단체 공"을 생산한다 (원으로부터 1의 거리에 있는 모든 점들의 집합):

```
p=1:    Diamond shape      (corners on axes)
p=2:    Circle/sphere      (the usual round ball)
p=3:    Superellipse       (rounded square)
p=inf:  Square/hypercube   (flat sides along axes)
```

### L 무한도 표준 (체비셰프 거)

- 아$p$무한도를 접근하면 Lp 규범이 최대 절대 구성 요소로 회전합니다.

```math
\lVert x \rVert_\infty = \max(|x_1|, |x_2|, \ldots, |x_n|)
```

두 점 사이의 거리는 가장 많이 다른 단위 차원에서 결정됩니다. 다른 모든 차원은 무시됩니다.

```math
\begin{aligned}
\text{Point } A &= (1, 1) \\
\text{Point } B &= (4, 5) \\[6pt]
L_\infty \text{ distance} &= \max(|4-1|, |5-1|) = \max(3, 4) = 4
\end{aligned}
```

L- 인피니티를 사용할 때:
- 어떤 차원의 가장 최악의 경우도 중요한 경우
- 게임 보드 (축구에서 왕은 L-무궁무진한 움직임을: 어느 방향으로 한 단계가 1 대의 비용)
- 제조 용인 (모든 크기는 사양 내에서 있어야 한다)

### 코시네 유사성 및 코시네 거리가

코시네 유사성은 두 개의 벡터 사이의 각을 측정하고 그 크기를 무시합니다.

```math
\text{cos\_sim}(a, b) = \frac{a \cdot b}{\lVert a \rVert_2 \, \lVert b \rVert_2}
```

-1 (반대의 방향) 에서 +1 ( 같은 방향) 까지 다양하다. 수직 벡터는 0의 코시노 유사성을 가지고 있다.

코시네 거리 는 거리로 변환된다: 코시네 거리 = 1 - 코시네 유사성. 이것은 0 (동방향) 에서 2 (반방향) 까지 다양하다.

```math
\begin{aligned}
& a = (1, 0) \qquad b = (1, 1) \\[6pt]
& \text{cos\_sim} = \frac{1 \cdot 1 + 0 \cdot 1}{1 \cdot \sqrt{2}} = \frac{1}{\sqrt{2}} = 0.707 \\
& \text{cos\_dist} = 1 - 0.707 = 0.293
\end{aligned}
```

왜 코시네가 NLP와 임베디션을 지배하는 지: 텍스트에서 문서 길이는 유사성에 영향을 미치지 않아야합니다. 고양이에 대한 문서가 고양이에 대한 다른 문서보다 두 배 더 길어야만 여전히 "동적"해야 합니다. 코시네 유사성은 거대 (장) 를 무시하고 방향에만 신경쓰습니다. 같은 단어 분포를 가진 두 문서가 같은 방향으로 지점을 둔 다른 길이가 있고, 코시노스 유사성 1.0을 얻습니다.

코시네 유사성을 사용할 때:
- 텍스트 유사성 (TF-IDF 벡터, 단어 임베디션, 문장 임베디션)
- 규모가 소음이고 방향이 신호가 되는 영역
- 추천 시스템 (사용자 선호도 벡터)
- 임베디드 검색 (벡터 데이터베이스에서는 거의 항상 코시네스 또는 점수 곱을 사용합니다)

### 점 제품 유사성 vs 코시네 유사성

두 개의 벡터의 점 곱은

```math
\begin{aligned}
a \cdot b &= a_1 b_1 + a_2 b_2 + \cdots + a_n b_n \\
&= \lVert a \rVert \, \lVert b \rVert \cos(\text{angle})
\end{aligned}
```

코시네스 유사성은 두 대량으로 정상화 된 점수 산물이다. 두 가수 모두 이미 단위 정상화 된 경우 (대량 = 1), 점수 산물 및 코시네스 유사성은 동일합니다.

```math
\text{If } \lVert a \rVert = 1 \text{ and } \lVert b \rVert = 1: \quad a \cdot b = \cos(\text{angle between } a \text{ and } b)
```

이 점들은 서로 다른 경우: 점수산물은 규모 정보를 포함합니다. 더 큰 크기의 벡터는 더 높은 점수산점을 얻습니다. " 인기 " 항목이 더 높은 순위를 차지하기를 원하는 일부 검색 시스템에서 이것은 중요합니다. 크기는 함부로 품질 또는 중요성의 신호로 작용합니다.

```
a = (3, 0)    b = (1, 0)    c = (0, 1)

dot(a, b) = 3     dot(a, c) = 0
cos(a, b) = 1.0   cos(a, c) = 0.0

Both agree on direction, but dot product also reflects magnitude.
```

실제:
- 순수 방향적 유사성을 원하는 경우 코시네 유사성을 사용하십시오
- 대량으로 의미 있는 정보를 전달할 때 점수 곱을 사용한다
- 많은 벡터 데이터베이스 (Pinecone, Weaviate, Qdrant) 는
- 만약 여러분의 임베디션이 L2 정상화되면 선택은 중요하지 않습니다.

### 마하랄로비스 거리

유클리드 거리에서는 모든 차원이 동일하게 다루지만, 만약 당신의 특징이 상관관계가 있거나 다른 스케일이 있다면, L2는 잘못된 결과를 제공합니다.

마하랄로비스 거리는 데이터의 코바리안스 구조를 설명합니다.

```math
d_M(x, y) = \sqrt{(x - y)^T S^{-1} (x - y)}
```

어디$S$데이터의 코버라이안스 매트릭스입니다.

직관적으로: 마하랄로비스 거리는 먼저 데이터를 비관화하고 정상화합니다 (백화화), 그리고 그 변환된 공간에서 L2 거리를 계산합니다.$S$정체성 행렬 (부연, 단위 변함 특징) 이므로 마하랄로비스 거리는 유클리드 거리로 줄어들게 된다.

```
Example: height and weight are correlated.
Someone 6'2" and 180 lbs is not unusual.
Someone 5'0" and 180 lbs is unusual.

Euclidean distance might say they are equally far from the mean.
Mahalanobis distance correctly identifies the second as an outlier
because it accounts for the height-weight correlation.
```

마하랄로비스 거리를 언제 사용해야 하는지:
- 외상 탐지 (중계로부터 큰 마하랄로비스 거리가 있는 지점은 외상)
- 특징이 다른 규모와 상관관계를 갖는 경우 분류
- 신뢰할 수 있는 코버라이언스 매트릭스를 추정하기 위해 충분한 데이터가 있을 때
- 제조업의 품질 통제 (다차례적인 프로세스 모니터링)

### 자카드 유사성 (세트)

자카드 유사성 측정은 두 집합 사이에 겹쳐 있다.

```math
J(A, B) = \frac{|A \cap B|}{|A \cup B|}
```

0 (복복이 없다) 에서 1 (동일한 집합) 까지의 범위. 자커드 거리 = 1 - 자커드 유사성.

```
A = {cat, dog, fish}
B = {cat, bird, fish, snake}

Intersection = {cat, fish}         size = 2
Union = {cat, dog, fish, bird, snake}  size = 5

Jaccard similarity = 2/5 = 0.4
Jaccard distance = 0.6
```

Jaccard을 언제 사용할 것인가:
- 태그, 카테고리 또는 특징의 집합을 비교하는 것
- 단어 존재에 기초한 문서 유사성 (주파수가 아닌)
- 거의 복제된 검출 (Jaccard의 MinHash 근접)
- 바이너리 특징 벡터를 비교하는 것 (재존/실종 데이터)
- 평가 세그먼트 모델 (연합의 교차 = 자카드)

### 수정 거리 (레벤슈타인 거리)

편집 거리는 하나의 문자열을 다른 문자열로 변환하는 데 필요한 단일 문자 동작의 최소수를 계산합니다. 동작은: 삽입, 삭제 또는 대체입니다.

```
"kitten" -> "sitting"

kitten -> sitten  (substitute k -> s)
sitten -> sittin  (substitute e -> i)
sittin -> sitting (insert g)

Edit distance = 3
```

동적 프로그래밍을 사용하여 계산되었습니다. 입력하는 매트릭스를 채우십시오$(i, j)$이 값은$i$문자열 A와 첫 번째$j$문자열 B의 문자는

```
        ""  s  i  t  t  i  n  g
    ""   0  1  2  3  4  5  6  7
    k    1  1  2  3  4  5  6  7
    i    2  2  1  2  3  4  5  6
    t    3  3  2  1  2  3  4  5
    t    4  4  3  2  1  2  3  4
    e    5  5  4  3  2  2  3  4
    n    6  6  5  4  3  3  2  3
```

편집 거리를 사용할 때:
- 주문 확인 및 수정
- DNA 염기서열 조율 (중중중화 작업)
- 퓨지 문자열 일치
- 엉뚱한 텍스트 데이터의 분배

### KL 분화 (거리가 아니라 하나의 거리로 사용된다)

KL 분배는 어떤 확률 분포가 다른 분포에서 어떻게 다르는지 측정합니다. 레슨 09에서 다루지만, 사람들이 "거리가" 아니더라도 "거리가"로 사용하기 때문에 이 토론에 속합니다.

```math
D_{KL}(P \,\|\, Q) = \sum_x p(x) \log\frac{p(x)}{q(x)}
```

중요한 성질: KL 분차는 대칭이 아니다.

```math
D_{KL}(P \,\|\, Q) \ne D_{KL}(Q \,\|\, P)
```

이것은 거리의 메트릭의 기본 요구 사항을 충족시키지 못한다는 것을 의미합니다. 또한 삼각형 불평등을 충족시키지 못합니다. 그것은 거리가 아니라 분차입니다.

KL를 앞두고$(D_{KL}(P \Vert Q))$"말의 의미"입니다.$Q$모든 방법들을 다루려고 합니다.$P$- 그래
KL를 역으로 돌려$(D_{KL}(Q \Vert P))$"모드 검색"입니다: $Q$하나의 방식에 초점을 맞추고 있습니다$P$- 그래

KL의 분리를 보면
- VAEs (ELBO에서 KL 용어는 잠정 분포를 전향으로 밀어냅니다)
- 지식 유출 (학생은 교사의 분포와 일치하려고 노력한다)
- RLHF (KL 벌금으로 정교한 모델은 기본 모델과 가까운 상태로 유지됩니다)
- 정책 기하 방법 (정책 업데이트를 제한)

### 와스스텐 거리 (Earth Mover's Distance)

와스스테인 거리는 한 확률 분포를 다른 것으로 변환하기 위해 필요한 최소한의 "작업을" 측정합니다. 이것을 이렇게 생각하세요: 한 분포가 흙의 집합이고 다른 분포는 구멍이라면, 얼마나 많은 흙을 이동해야 하며 얼마나 멀리 가야 할까요?

```math
W(P, Q) = \inf_{\gamma} \mathbb{E}[d(x, y)] \quad \text{(over all transport plans } \gamma\text{)}
```

1D 분포에 대해서는 누적 분포 함수의 절대 차이의 통합으로 단순화합니다.

```math
W_1(P, Q) = \int |\text{CDF}_P(x) - \text{CDF}_Q(x)| \, dx
```

왜 와스스텐이 중요한지
- 그것은 진정한 미트릭 (시메트릭, 삼각형 불평등을 만족)
- 분포가 겹치지 않는 경우에도 gradients를 제공합니다 (KL 분차는 무한으로 간다)
- 이 특성으로 인해 원시 GAN의 훈련 불안정을 해결한 Wasserstein GAN (WGAN) 의 중심이 되었다.

```
Distributions with no overlap:

P: [1, 0, 0, 0, 0]    Q: [0, 0, 0, 0, 1]

KL divergence: infinity (log of zero)
Wasserstein: 4 (move all mass 4 bins)

Wasserstein gives a meaningful gradient. KL does not.
```

와스스텐을 사용할 때:
- GAN 교육 (WGAN, WGAN-GP)
- 겹치지 않을 수 있는 분포를 비교하는 방법
- 최적의 교통 문제
- 이미지 검색 (색 히스토그램을 비교)

### 왜 다른 임무 는 다른 거리를 필요로 하는가

| Task | Best distance | Why |
|------|--------------|-----|
| Text similarity | Cosine | Magnitude is noise, direction is meaning |
| Image pixel comparison | L2 | Spatial relationships matter, features are comparable scale |
| Sparse high-dim features | L1 | Robust, does not amplify rare large differences |
| Set overlap (tags, categories) | Jaccard | Data is naturally set-valued, not vectorial |
| String matching | Edit distance | Operations map to human editing intuition |
| Outlier detection | Mahalanobis | Accounts for feature correlations and scales |
| Comparing distributions | KL divergence | Measures information lost by using $Q$ instead of $P$ |
| GAN training | Wasserstein | Provides gradients even when distributions do not overlap |
| Embeddings (vector DB) | Cosine or dot product | Embeddings are trained to encode meaning in direction |
| Recommendation | Dot product | Magnitude can encode popularity or confidence |
| DNA sequences | Weighted edit distance | Substitution costs vary by nucleotide pair |
| Manufacturing QC | L-infinity | Worst-case deviation in any dimension matters |

### 손실 기능과의 연결

손실 함수는 예측과 목표에 적용되는 거리 함수입니다.

```
Loss function       Distance it uses       Behavior
MSE                 L2 squared             Penalizes large errors heavily
MAE                 L1                     Penalizes all errors equally
Huber loss          L1 for large errors,   Best of both: robust to outliers,
                    L2 for small errors    smooth gradient near zero
Cross-entropy       KL divergence          Measures distribution mismatch
Hinge loss          max(0, margin - d)     Only penalizes below margin
Triplet loss        L2 (typically)         Pulls positives close, pushes
                                           negatives away
Contrastive loss    L2                     Similar pairs close, dissimilar
                                           pairs beyond margin
```

### 규제와 연결

규칙화는 손실 함수에 무게에 대한 표준 징계를 추가합니다.

```
L1 regularization (Lasso):   loss + lambda * ||w||_1
  -> Sparse weights. Some weights become exactly zero.
  -> Automatic feature selection.
  -> Solution has corners (non-differentiable at zero).

L2 regularization (Ridge):   loss + lambda * ||w||_2^2
  -> Small weights. All weights shrink toward zero.
  -> No feature selection (nothing goes to exactly zero).
  -> Smooth solution everywhere.

Elastic Net:                  loss + lambda_1 * ||w||_1 + lambda_2 * ||w||_2^2
  -> Combines sparsity of L1 with stability of L2.
  -> Groups of correlated features are kept or dropped together.
```

왜 L1가 희미성을 생성하지만 L2가 그렇지 않은 이유는: 2D 무게 공간에서 제한 영역을 그려보세요. L1는 다이아몬드, L2는 원형입니다. 손실 함수의 kontur (ellipses) 는 가장 가능성이 높습니다. 한 무게가 0이있는 코너에서 다이아몬드를 만지는 경우. 둘 다 무게가 0이 아닌 부드러운 지점에서 원형을 만지는 경우.

### 가장 가까운 이웃 을 찾아

각 거리 함수는 가장 가까운 이웃 검색 문제를 암시합니다. 질의 포인트를 주어지면 데이터 세트에 가장 가까운 포인트를 찾아보십시오.

가장 가까운 이웃을 찾는 것이 바로$O(n \cdot d)$ 데이터 세트에 있는$n$$d$대용량 데이터 집합을 위해, 이것은 너무 느리죠.

대략적인 근접 이웃 (ANN) 알고리즘은 엄청난 속도 향상을 위해 약간의 정확성을 거래합니다.

```
Algorithm         Approach                      Used by
KD-trees          Axis-aligned space partition   scikit-learn (low-dim)
Ball trees        Nested hyperspheres            scikit-learn (medium-dim)
LSH               Random hash projections        Near-duplicate detection
HNSW              Hierarchical navigable         FAISS, Qdrant, Weaviate
                  small-world graph
IVF               Inverted file index with       FAISS (billion-scale)
                  cluster-based search
Product quant.    Compress vectors, search       FAISS (memory-constrained)
                  in compressed space
```

HNSW (하이러시컬 네비게블 스몰 월드) 는 현대 벡터 데이터베이스에서 지배적인 알고리즘이다. 각 노드가 대략적인 가장 가까운 이웃과 연결되는 다층 그래프를 구축합니다. 검색은 상위 계층 (스파스, 장 점스) 에서 시작되며 하위 계층 (밀고, 단뛰기) 으로 내려간다.

```figure
norm-unit-balls
```

## 건설 해

### 단계 1: 모든 표준 및 거리 함수

보시다시피`code/distances.py`모든 함수는 파이썬 기초 수학을 사용하여 처음부터 만들어집니다.

### 단계 2: 동일한 데이터, 다른 거리와 다른 이웃

데모가 `distances.py`데이터 세트를 생성하고, 질의 포인트를 선택하고, 가장 가까운 이웃이 거리 측정량에 따라 어떻게 변화하는지 보여줍니다. L1 아래에서 "최근"의 포인트는 L2 또는 코시네스 아래에서 가장 가까운 것이 아닐 수 있습니다.

### 단계 3: 유사성 검색을 삽입

코드는 모호한 임베디션 유사성 검색을 포함하고 있으며, 코시네 유사성과 L2 거리를 사용하여 질의에 가장 유사한 "문서를" 찾으며 순위가 다를 수 있음을 보여줍니다.

## 사용 하 고

가장 일반적인 실용적 사용: 벡터 데이터베이스에서 유사한 항목을 찾는

```python
import numpy as np

def cosine_similarity_matrix(X):
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    X_normalized = X / norms
    return X_normalized @ X_normalized.T

embeddings = np.random.randn(1000, 768)

sim_matrix = cosine_similarity_matrix(embeddings)

query_idx = 0
similarities = sim_matrix[query_idx]
top_k = np.argsort(similarities)[::-1][1:6]
print(f"Top 5 most similar to item 0: {top_k}")
print(f"Similarities: {similarities[top_k]}")
```

전화할 때`model.encode(text)`그리고 벡터 데이터베이스에서 검색하면, 이 뚜 아래에서 일어나는 일입니다. 임베디션 모델은 벡터로 텍스트를 지도합니다. 벡터 데이터베이스에서는 모든 벡터와 저장된 모든 벡터 사이의 코시노 유사성을 계산합니다.

## 운동

1. (1, 2, 3) 와 (4, 0, 6) 사이의 L1, L2 및 L- 무한 거리를 계산하십시오.$L_\infty \le L_2 \le L_1$항상 어떤 포인트를든 받을 수 있습니다. 이 순서가 보장되는 이유를 증명하세요.

2. 코시노 유사성이 높은 (> 0.9) 하지만 L2 거리가 큰 (> 10) 두 개의 벡터를 생성하여, 어떤 일이 일어나고 있는지 기하학적으로 설명합니다.

3. 데이터 세트와 쿼리 포인트를 가져다가 L1, L2, 코시네, 마하랄로비스 거리 아래 가장 가까운 이웃을 반환하는 함수를 구현하십시오. 네 가지 모두 가장 가까운 지점에 대해 동의하지 않는 데이터 세트를 찾으십시오.

4. CDF 방법을 사용하여 [0.5, 0.5, 0.5, 0.0] 와 [0, 0, 0.5, 0.5] 사이의 와스스텐 거리를 수동으로 계산하고, [0.25, 0.25, 0.25, 0.25] 와 [0, 0, 0.5, 0.5] 사이에 계산한다.

5. 대략적인 자카드 유사성을 위해 미인하쉬를 구현하십시오. 100 개의 무작위 집합을 생성하고 모든 쌍에 대한 정확한 자카드를 계산하고 50, 100, 200 해시 함수를 사용하여 미인하쉬 근접과 비교하십시오. 근접 오류를 일괄적으로 표시하십시오.

### 암시

**Exercise 1.**차이 벡터는 (-3, 2, -3) 이므로 그 벡터의 3개의 규범을 계산해 봅시다`l1_norm``l2_norm`그리고`linf_norm`증명에 있어서 가장 큰 것을 비교해 보세요$\lvert d_i \rvert$그리고 제곱의 합과 절대 값의 합의 제곱을 비교합니다.

**Exercise 2.**코시네 유사성은 길이를 무시하므로 거의 같은 방향으로 지향하는 두 개의 벡터를 시작하여 둘 중 하나를 훨씬 더 길게 만듭니다. 두 번째 경우, 원천 근처에서 서로 다른 방향으로 지향하는 두 개의 짧은 벡터를 사용하여 두 조건을 확인합니다.`cosine_similarity`그리고`l2_distance`- 그래

**Exercise 3.**전화`find_nearest_neighbor(query, dataset, distance_fn)`한 번씩`l1_distance``l2_distance``cosine_distance`그리고`mahalanobis_distance`-`demo_different_neighbors`매트릭이 일치하지 않는 데이터 세트를 보여 줍니다. 먼저 읽어보고 네 가지 답이 서로 다른 때까지 포인트를 변경하세요.

**Exercise 4.**각 분포의 누적 합을 적어 두 누적 합의 절대적 차이를 더해 두 손의 결과를 `wasserstein_1d(p, q)`, 그리고 확률 질량이 얼마나 멀리 이동해야 하는지 더 큰 값을 설명합니다.

**Exercise 5.**각 해시 함수에서, 집합의 MinHash 서명은 그 요소에 대한 최소 해시 값이며 두 집합이 동일한 최소 추정치를 얻는 해시 함수의 분수는 자커드 유사성을 추정합니다. 각 추정치를 비교하여 `jaccard_similarity`; 오류는 대략적으로 $1/\sqrt{k}$$k$해시 함수

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Norm | "Size of a vector" | A function that maps a vector to a non-negative scalar, satisfying triangle inequality, absolute homogeneity, and zero only for the zero vector |
| L1 norm | "Manhattan distance" | Sum of absolute component values. Produces sparsity in optimization. Robust to outliers |
| L2 norm | "Euclidean distance" | Square root of sum of squared components. The straight-line distance in Euclidean space |
| Lp norm | "Generalized norm" | The $p$-th root of the sum of $p$-th powers of absolute components. L1 and L2 are special cases |
| L-infinity norm | "Max norm" or "Chebyshev distance" | The maximum absolute component value. The limit of Lp as $p$ approaches infinity |
| Cosine similarity | "Angle between vectors" | Dot product normalized by both magnitudes. Ranges from -1 to +1. Ignores vector length |
| Cosine distance | "1 minus cosine similarity" | Converts cosine similarity to a distance. Ranges from 0 to 2 |
| Dot product | "Unnormalized cosine" | Sum of component-wise products. Equals cosine similarity times both magnitudes |
| Mahalanobis distance | "Correlation-aware distance" | L2 distance in a space that has been whitened (decorrelated and normalized) using the data covariance matrix |
| Jaccard similarity | "Set overlap" | Size of intersection divided by size of union. For sets, not vectors |
| Edit distance | "Levenshtein distance" | Minimum insertions, deletions, and substitutions to transform one string into another |
| KL divergence | "Distance between distributions" | Not a true distance (not symmetric). Measures extra bits from using $Q$ to encode $P$ |
| Wasserstein distance | "Earth mover's distance" | Minimum work to transport mass from one distribution to another. A true metric |
| Approximate nearest neighbor | "ANN search" | Algorithms (HNSW, LSH, IVF) that find approximately closest points much faster than exact search |
| HNSW | "The vector DB algorithm" | Hierarchical Navigable Small World graph. Multi-layer graph for fast approximate nearest neighbor search |
| L1 regularization | "Lasso" | Adding the L1 norm of weights to the loss. Drives weights to zero (sparsity) |
| L2 regularization | "Ridge" or "weight decay" | Adding the squared L2 norm of weights to the loss. Shrinks weights toward zero without sparsity |
| Elastic Net | "L1 + L2" | Combines L1 and L2 regularization. Handles correlated feature groups better than either alone |

## 더 많은 읽기

- [FAISS: A Library for Efficient Similarity Search](https://github.com/facebookresearch/faiss)- 메타의 라이브러리
- [Wasserstein GAN (Arjovsky et al., 2017)](https://arxiv.org/abs/1701.07875)- 지구 이동자 거리를 GAN에 소개한 논문
- [Locality-Sensitive Hashing (Indyk & Motwani, 1998)](https://dl.acm.org/doi/10.1145/276698.276876)- 기초적인 ANN 알고리즘
- [Efficient Estimation of Word Representations (Mikolov et al., 2013)](https://arxiv.org/abs/1301.3781)- Word2Vec, 코시노 유사성이 임베디션의 기본이 된
- [sklearn.neighbors documentation](https://scikit-learn.org/stable/modules/neighbors.html)- 스키트-러닝에서 거리 측정 및 이웃 알고리즘에 대한 실용적인 가이드
