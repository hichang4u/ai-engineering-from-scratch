# 벡터, 매트릭스 & 운영

> 모든 신경망은 추가 단계와 함께 매트릭스 곱셈입니다.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 1, Lesson 01 (Linear Algebra Intuition)
**Time:** ~60 minutes

## 학습 목표

- 요소 지혜의 연산, 매트릭스 곱셈, 트랜스포스, 결정자, 역으로 매트릭스 클래스를 구축
- 요소별 곱셈과 매트릭스 곱셈을 구분하고 각각의 적용 시점을 설명한다.
- 하나의 밀집 신경망 층을 구현 (`relu(W @ x + b)`) 오직 처음부터 매트릭스 클래스를 이용해서
- 방송 규칙과 신경 네트워크 프레임워크에서 편향 부합이 어떻게 작동하는지 설명하십시오.

## 문제

신경망을 만들고 싶다면 코드를 읽고 이렇게 보죠.

```
output = activation(weights @ input + bias)
```

그`@`이 값은`weights`이 행렬은`input`이 직선은 마법입니다. 만약 여러분이 이 직선은 3개의 직선으로 한 층의 전면 통과입니다.

모델이 처리하는 모든 이미지는 픽셀 값의 매트릭스입니다. 임베디션 된 모든 단어는 벡터입니다. 모든 신경 네트워크의 모든 층은 매트릭스 변환입니다. 매트릭스 작업을 원활하게 수행하지 않고 AI 시스템을 만들 수 없습니다. 변수를 이해하지 않고 코드를 쓸 수 없는 것처럼.

이 교훈은 처음부터 유창성을 키워줍니다.

## 개념

### 벡터: 순서로 된 숫자 목록

벡터는 방향과 크기를 가진 숫자의 목록입니다. AI에서 벡터는 데이터 포인트, 특징 또는 매개 변수를 나타냅니다.

```
v = [3, 4]        -- a 2D vector
w = [1, 0, -2]    -- a 3D vector
```

2차원 벡터`[3, 4]`평면의 좌표 (3, 4) 를 가리키는 것 이다. 그 길이는 (대도) 는 5 (3-4-5 삼각형) 이다.

### 매트릭스: 숫자 그리드

매트릭스는 2차원 그리드입니다. 줄과 열.$m \times n$매트릭스는$m$라인 및$n$기둥

```math
A = \begin{bmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \end{bmatrix} \quad \text{2x3 matrix (2 rows, 3 columns)}
```

신경 네트워크에서 중량 매트릭스는 입력 벡터를 출력 벡터로 변환합니다. 784 입력과 128 출력으로 이루어진 층은 128x784 중량 매트릭스를 사용합니다.

### 왜 모양이 중요할까요?

매트릭스 곱셈은 엄격한 규칙이 있습니다.`(m x n) @ (n x p) = (m x p)`내부 차원은 일치해야 합니다.

```
(128 x 784) @ (784 x 1) = (128 x 1)
  weights       input       output

Inner dimensions: 784 = 784  -- valid
```

PyTorch에서 모양의 부합 오류가 발생하면, 이것이 바로 그 이유입니다.

### 운영 지도

| Operation | What it does | Neural network use |
|-----------|-------------|-------------------|
| Addition | Element-wise combine | Adding bias to output |
| Scalar multiply | Scale every element | Learning rate * gradients |
| Matrix multiply | Transform vectors | Layer forward pass |
| Transpose | Flip rows and columns | Backpropagation |
| Determinant | Single number summary | Checking invertibility |
| Inverse | Undo a transformation | Solving linear systems |
| Identity | Do-nothing matrix | Initialization, residual connections |

### 요소-지식 vs 매트릭스 곱셈

이 차이점은 초보자를 끊임없이 상대로 합니다.

요소에 따라: 일치하는 위치를 곱합니다. 두 매트릭스는 같은 모양이어야 합니다.

```math
\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix} * \begin{bmatrix} 5 & 6 \\ 7 & 8 \end{bmatrix} = \begin{bmatrix} 5 & 12 \\ 21 & 32 \end{bmatrix}
```

매트릭스 곱셈: 줄과 열의 점수 곱셈. 내부 차원은 일치해야 합니다.

```math
\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix} @ \begin{bmatrix} 5 & 6 \\ 7 & 8 \end{bmatrix} = \begin{bmatrix} 1 \cdot 5 + 2 \cdot 7 & 1 \cdot 6 + 2 \cdot 8 \\ 3 \cdot 5 + 4 \cdot 7 & 3 \cdot 6 + 4 \cdot 8 \end{bmatrix} = \begin{bmatrix} 19 & 22 \\ 43 & 50 \end{bmatrix}
```

다른 작업, 다른 결과, 다른 규칙.

### 방송

출력 행렬에 편향 벡터를 추가하면 모양이 일치하지 않습니다. 방송은 더 작은 배열을 뻗어 놓습니다.

```
| 1  2  3 |   +   [10, 20, 30]
| 4  5  6 |

Broadcasting stretches the vector across rows:

| 1  2  3 |   | 10  20  30 |   | 11  22  33 |
| 4  5  6 | + | 10  20  30 | = | 14  25  36 |
```

모든 현대 프레임워크는 자동으로 이 작업을 수행합니다. 형태가 잘못 보이지만 코드가 실행되는 경우 혼란을 방지합니다.

```figure
vector-projection
```

## 건설 해

### 단계 1: 벡터 클래스

```python
class Vector:
    def __init__(self, data):
        self.data = list(data)
        self.size = len(self.data)

    def __repr__(self):
        return f"Vector({self.data})"

    def __add__(self, other):
        return Vector([a + b for a, b in zip(self.data, other.data)])

    def __sub__(self, other):
        return Vector([a - b for a, b in zip(self.data, other.data)])

    def __mul__(self, scalar):
        return Vector([x * scalar for x in self.data])

    def dot(self, other):
        return sum(a * b for a, b in zip(self.data, other.data))

    def magnitude(self):
        return sum(x ** 2 for x in self.data) ** 0.5
```

### 단계 2: 핵심 동작을 가진 매트릭스 클래스

```python
class Matrix:
    def __init__(self, data):
        self.data = [list(row) for row in data]
        self.rows = len(self.data)
        self.cols = len(self.data[0])
        self.shape = (self.rows, self.cols)

    def __repr__(self):
        rows_str = "\n  ".join(str(row) for row in self.data)
        return f"Matrix({self.shape}):\n  {rows_str}"

    def __add__(self, other):
        return Matrix([
            [self.data[i][j] + other.data[i][j] for j in range(self.cols)]
            for i in range(self.rows)
        ])

    def __sub__(self, other):
        return Matrix([
            [self.data[i][j] - other.data[i][j] for j in range(self.cols)]
            for i in range(self.rows)
        ])

    def scalar_multiply(self, scalar):
        return Matrix([
            [self.data[i][j] * scalar for j in range(self.cols)]
            for i in range(self.rows)
        ])

    def element_wise_multiply(self, other):
        return Matrix([
            [self.data[i][j] * other.data[i][j] for j in range(self.cols)]
            for i in range(self.rows)
        ])

    def matmul(self, other):
        return Matrix([
            [
                sum(self.data[i][k] * other.data[k][j] for k in range(self.cols))
                for j in range(other.cols)
            ]
            for i in range(self.rows)
        ])

    def transpose(self):
        return Matrix([
            [self.data[j][i] for j in range(self.rows)]
            for i in range(self.cols)
        ])

    def determinant(self):
        if self.shape == (1, 1):
            return self.data[0][0]
        if self.shape == (2, 2):
            return self.data[0][0] * self.data[1][1] - self.data[0][1] * self.data[1][0]
        det = 0
        for j in range(self.cols):
            minor = Matrix([
                [self.data[i][k] for k in range(self.cols) if k != j]
                for i in range(1, self.rows)
            ])
            det += ((-1) ** j) * self.data[0][j] * minor.determinant()
        return det

    def inverse_2x2(self):
        det = self.determinant()
        if det == 0:
            raise ValueError("Matrix is singular, no inverse exists")
        return Matrix([
            [self.data[1][1] / det, -self.data[0][1] / det],
            [-self.data[1][0] / det, self.data[0][0] / det]
        ])

    @staticmethod
    def identity(n):
        return Matrix([
            [1 if i == j else 0 for j in range(n)]
            for i in range(n)
        ])
```

### 3단계: 작동하도록

```python
A = Matrix([[1, 2], [3, 4]])
B = Matrix([[5, 6], [7, 8]])

print("A + B =", (A + B).data)
print("A @ B =", A.matmul(B).data)
print("A^T =", A.transpose().data)
print("det(A) =", A.determinant())
print("A^-1 =", A.inverse_2x2().data)

I = Matrix.identity(2)
print("A @ A^-1 =", A.matmul(A.inverse_2x2()).data)
```

### 4단계: 신경망에 연결

```python
import random

inputs = Matrix([[0.5], [0.8], [0.2]])
weights = Matrix([
    [random.uniform(-1, 1) for _ in range(3)]
    for _ in range(2)
])
bias = Matrix([[0.1], [0.1]])

def relu_matrix(m):
    return Matrix([[max(0, val) for val in row] for row in m.data])

pre_activation = weights.matmul(inputs) + bias
output = relu_matrix(pre_activation)

print(f"Input shape: {inputs.shape}")
print(f"Weight shape: {weights.shape}")
print(f"Output shape: {output.shape}")
print(f"Output: {output.data}")
```

이것은 단일 밀도가 높은 층입니다.`output = relu(W @ x + b)`모든 신경망의 밀도가 있는 층들은 정확히 이렇게 합니다.

## 사용 하 고

NumPy는 더 적은 줄과 규모 순서로 모든 것을 더 빨리 처리합니다.

```python
import numpy as np

A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

print("A + B =\n", A + B)
print("A * B (element-wise) =\n", A * B)
print("A @ B (matrix multiply) =\n", A @ B)
print("A^T =\n", A.T)
print("det(A) =", np.linalg.det(A))
print("A^-1 =\n", np.linalg.inv(A))
print("I =\n", np.eye(2))

inputs = np.random.randn(3, 1)
weights = np.random.randn(2, 3)
bias = np.array([[0.1], [0.1]])
output = np.maximum(0, weights @ inputs + bias)

print(f"\nNeural network layer: {weights.shape} @ {inputs.shape} = {output.shape}")
print(f"Output:\n{output}")
```

`@`파이썬 호출에서 운영체제`__matmul__`NumPy는 C와 Fortran으로 작성된 최적화된 BLAS 루틴으로 구현합니다. 같은 수학, 100배 더 빠른

NumPy에서 방송:

```python
matrix = np.array([[1, 2, 3], [4, 5, 6]])
bias = np.array([10, 20, 30])
print(matrix + bias)
```

NumPy는 자동으로 두 줄에서 1D 편향을 전송합니다. 이것이 모든 신경 네트워크 프레임워크에서 편향 부합이 작동하는 방법입니다.

## 선박

이 수업은 기하학적 직관으로 매트릭스 동작을 가르치는 시키는 방법을 제공합니다.`outputs/prompt-matrix-operations.md`- 그래

여기서 만들어진 매트릭스 클래스는 3단계 10강에서 구축한 미니 신경망 프레임워크의 기초입니다.

## 운동

1. **Verify the inverse.**곱하기`A @ A.inverse_2x2()`2x2 매트릭스 3개로 테스트해 보세요. 결정값이 0이 되면 어떻게 될까요?

2. **Implement 3x3 inverse.**3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3 매트릭스 3x3`np.linalg.inv`- 그래

3. **Build a two-layer network.**오직 매트릭스 클래스를 이용해서 (NumPy가 없습니다) 2층 신경 네트워크를 생성하세요: 입력 (3) -> 숨겨진 (4) -> 출력 (2). 무작위 무게를 초기화하고, 앞으로 통과를 실행하고, 모든 모양이 올바르게 확인합니다.

### 암시

**Exercise 1.**곱하기`A @ A.inverse_2x2()`3개의 매트릭스를 위해 각각의 세포를`1e-9`. 0의 결정자를 가진 매트릭스, 예를 들어 [[1, 2], [2, 4]], `inverse_2x2``ValueError`, 그리고 이것은 예상되는 결과입니다.

**Exercise 2.**3x3 코팩터 행렬을 계산하고, 합성자를 얻기 위해 변환하고, 각 세포를`determinant()`- 확인해`A @ A_inv`각각의 세포가 일치하는 정체성을 제공합니다`np.linalg.inv(A)`내`1e-9`- 그래

**Exercise 3.**곱하기 전에 각 행렬의 모양을 적어라: `W1`4x3이고`W2`2x4입니다`demo_neural_network_layer`3x1 입력은 4x1 숨겨진 벡터와 2x1 출력을 가져야 합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Vector | "An arrow" | An ordered list of numbers. In AI: a point in high-dimensional space. |
| Matrix | "A table of numbers" | A linear transformation. It maps vectors from one space to another. |
| Matrix multiply | "Just multiply the numbers" | Dot products between every row of the first matrix and every column of the second. Order matters. |
| Transpose | "Flip it" | Swap rows and columns. Turns an $m \times n$ matrix into $n \times m$. Critical in backpropagation. |
| Determinant | "Some number from the matrix" | Measures how much the matrix scales area (2D) or volume (3D). Zero means the transformation crushes a dimension. |
| Inverse | "Undo the matrix" | The matrix that reverses the transformation. Only exists when the determinant is not zero. |
| Identity matrix | "The boring matrix" | The matrix equivalent of multiplying by 1. Used in residual connections (ResNets). |
| Broadcasting | "Magic shape fixing" | Stretching a smaller array to match a larger one by repeating along missing dimensions. |
| Element-wise | "Regular multiplication" | Multiply matching positions. Both arrays must have the same shape (or be broadcastable). |

## 더 많은 읽기

- [3Blue1Brown: Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra)- 여기 다루는 모든 작업에 대한 시각적 직관
- [NumPy documentation on broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)- NumPy가 따르는 정확한 규칙
- [Stanford CS229 Linear Algebra Review](http://cs229.stanford.edu/section/cs229-linalg.pdf)- ML 특화된 선형 대수학의 간결한 참조
