# JAX에 대한 소개

> 파이토르치는 텐서들을 돌연변이시킵니다. 텐서플로우는 그래프를 만듭니다. JAX는 순수 함수를 컴파일합니다. 마지막은 딥러닝에 대한 생각을 변화시킵니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 03 Lessons 01-10, basic NumPy
**Time:** ~90 minutes

## 학습 목표

- JAX의 기능 API (jax.numpy, jax.grad, jax.jit, jax.vmap) 를 사용하여 순수 기능 신경 네트워크 코드를 작성하십시오.
- PyTorch의 열망한 돌연변성과 JAX의 기능적 컴파일 모델 사이의 주요 설계 차이를 설명하십시오.
- 순수 Python에 비해 훈련 루프를 가속화하기 위해 jit 컴파일과 vmap 벡터화를 적용합니다
- JAX에서 간단한 네트워크를 훈련시키고 명시적인 상태 관리와 PyTorch의 객체 지향적 접근 방식을 비교하십시오

## 문제

파이토르치에서 신경망을 만드는 법을 알고 있어`nn.Module`, 전화`.backward()`최적화 기능을 눌러서 작동합니다. 수백만 명이 사용합니다.

하지만 PyTorch은 DNA에 한 가지 제약을 가지고 있습니다. 파이썬에서 한 번에 한 번에 작업을 열망있게 추적합니다.`tensor + tensor`각각의 훈련 단계마다 동일한 파이썬 코드를 재해석합니다. 이것은 540억 파리미터 모델을 2,048 TPU를 통해 훈련해야 할 때까지 잘 작동합니다.

구글 딥마인드는 JAX에서 쌍둥이를 훈련시킵니다. 앤트로피크는 클로드에게 JAX를 훈련시킵니다. 이것들은 작은 작업이 아닙니다. 이것은 지구상에서 가장 큰 신경 네트워크 훈련입니다. JAX는 훈련 루프를 파이썬 호출의 순서가 아닌 컴파일 가능한 프로그램으로 취급하기 때문에 선택했습니다.

JAX는 3개의 슈퍼 파워를 가진 NumPy입니다. 자동 차별화, JIT 컴파일링에서 XLA, 자동 벡터화. 당신은 하나의 예를 처리하는 함수를 작성합니다. JAX는 대량 처리, gradients를 계산, 기계 코드로 컴파일하고 여러 장치에서 실행하는 함수를 제공합니다. 모든 것은 원래 함수를 변경하지 않고.

## 개념

### JAX 철학

JAX는 기능적인 프레임워크입니다. 클래스도 없고, 변수 상태도 없습니다.`.backward()`대신:

| PyTorch | JAX |
|---------|-----|
| `nn.Module` class with state | Pure function: `f(params, x) -> y` |
| `loss.backward()` | `jax.grad(loss_fn)(params, x, y)` |
| Eager execution | JIT compilation via XLA |
| `for x in batch:` manual loop | `jax.vmap(f)` auto-vectorization |
| `DataParallel` / `FSDP` | `jax.pmap(f)` auto-parallelism |
| Mutable `model.parameters()` | Immutable pytree of arrays |

이것은 스타일 선호가 아닙니다. 그것은 컴파일러 제한입니다. JIT 컴파일에는 순수 기능이 필요합니다. 같은 입력값은 항상 동일한 출력을 생성합니다. 부작용은 없습니다. 그 제한은 100배 가속도를 가능하게 합니다.

### jax.numpy: 친숙한 표면

JAX는 가속기에 NumPy API를 재시설합니다.

```python
import jax.numpy as jnp

a = jnp.array([1.0, 2.0, 3.0])
b = jnp.array([4.0, 5.0, 6.0])
c = jnp.dot(a, b)
```

동일한 기능 이름, 동일한 방송 규칙, 동일한 조각 의미, 하지만 배열은 GPU/TPU에서 작동하고, 모든 작업은 컴파일러에 의해 추적됩니다.

중요한 차이점은 JAX 배열이 변하지 않는 것입니다.`a[0] = 5`대신:`a = a.at[0].set(5)`이것은 일주일 동안 불편한 느낌입니다. 그리고 그것은 클릭합니다. 변함없는 것은 변화를 만드는 것입니다.`grad``jit`그리고`vmap` 수 있는

### jax.grad: 기능성 자동화

파이토르크는 소에 gradients를 붙여줍니다 (`.grad`JAX는 함수들에 gradients를 붙여줍니다.

```python
import jax

def f(x):
    return x ** 2

df = jax.grad(f)
df(3.0)
```

`jax.grad`함수를 취하고 gradient를 계산하는 새로운 함수를 반환합니다.`.backward()`텐서에 저장된 계산 그래프가 없습니다. 그라디언트는 호출, 작곡, 또는 JIT- 컴파일 할 수있는 또 다른 함수입니다.

이것은 임의로 구성됩니다:

```python
d2f = jax.grad(jax.grad(f))
d2f(3.0)
```

두 번째 파생물, 세 번째 파생물, 자코비언, 헤센스, 모두 합성`grad`PyTorch도 할 수 있습니다`torch.autograd.functional.hessian`), 하지만 그것은 에 니다. JAX에서는, 그것은 기초입니다.

제한:`grad`순수 함수에서만 작동합니다. 내부에 인쇄 문서는 없습니다 (추적 중 실행되지 않습니다). 외부 상태의 돌연변이가 없습니다. 명시적인 키 관리 없이 무작위 숫자 생성.

### jit: XLA로 컴파일

```python
@jax.jit
def train_step(params, x, y):
    loss = loss_fn(params, x, y)
    return loss

fast_step = jax.jit(train_step)
```

JAX는 첫 번째 호출에서 함수를 추적합니다. 어떤 동작이 실행되지 않고 어떤 동작이 일어나는지 기록합니다. 그 다음, 그 추적을 Google의 TPU와 GPU 컴파일러인 XLA (고속선수자리수술) 에 전달합니다. XLA는 동작을 통합하고, 불필요한 메모리 복사본을 제거하고, 최적화된 기계 코드를 생성합니다.

이후의 호출은 파이썬을 완전히 건너뛰고 컴파일된 코드는 C++ 속도에서 가속기에서 실행됩니다.

JIT이 도움이 되는 경우:
- 훈련 단계 ( 같은 계산은 수천 번 반복된다)
- 인퍼런스 ( 동일한 모델, 다른 입력)
- 비슷한 모양의 입력으로 한 번 이상 호출된 함수

JIT가 아프면:
- 값에 의존하는 파이썬 제어 흐름의 함수 (`if x > 0`x가 추적된 배열이 있는 곳)
- 단 샷 계산 (집합 오버하스트는 실행 시간을 초과한다)
- 디버깅 ( 추적은 실제 실행을 숨깁니다)

제어 흐름 제한은 실제입니다.`jax.lax.cond`대체`if/else`-`jax.lax.scan`대체`for`루프입니다. 이건 선택적이지 않습니다. 컴파일 가격입니다.

### vmap: 자동 벡터화

하나의 예를 처리하는 함수를 작성합니다.

```python
def predict(params, x):
    return jnp.dot(params['w'], x) + params['b']
```

`vmap`배치를 처리하기 위해 들어 올립니다.

```python
batch_predict = jax.vmap(predict, in_axes=(None, 0))
```

`in_axes=(None, 0)`수단을: 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로 대량으로`params`(공유)  0의 축을 가로지르는 `x`- 설명서가 없지`for`루프, 리포트, 배트 차원 스레드, JAX는 배트 차원을 파악하고 전체 계산을 벡터화합니다.

이건 합성 설탕이 아닙니다.`vmap`파이썬 루프보다 10-100배 더 빠른 벡터화된 코드를 생성합니다.`jit`그리고`grad`이 부분의 본문은

```python
per_example_grads = jax.vmap(jax.grad(loss_fn), in_axes=(None, 0, 0))
```

예를 들어 한 줄이 있는 매개 변수, 해킹 없이 PyTorch에서 불가능한 일

### pmap: 장치 간 데이터 병렬성

```python
parallel_step = jax.pmap(train_step, axis_name='devices')
```

`pmap`모든 사용 가능한 장치 (GPU/TPU) 에 걸쳐 기능을 복제하고 배치를 나눕니다. 함수 내부에서,`jax.lax.pmean`그리고`jax.lax.psum`기기들 간의 기하급수들을 동기화합니다.

구글은 트윈을 수천 개의 TPU v5e 칩으로 훈련시킵니다`pmap`(그리고 그 후계자)`shard_map`). 프로그래밍 모델: 단일 장치 버전을 작성하고, `pmap`다 됐어

### 피트리스: 보편적인 데이터 구조

JAX는 "피트 트리"를 이용합니다. 리스트, 튜플, 디킷, 그리고 배열의 결합이 모여 있습니다.

```python
params = {
    'layer1': {'w': jnp.zeros((784, 256)), 'b': jnp.zeros(256)},
    'layer2': {'w': jnp.zeros((256, 128)), 'b': jnp.zeros(128)},
    'layer3': {'w': jnp.zeros((128, 10)),  'b': jnp.zeros(10)},
}
```

JAX의 모든 변형은`grad``jit``vmap`- 피트레스를 넘어서야 할 줄 알아요`jax.tree.map(f, tree)`적용됩니다`f`이렇게 최적화 장치가 모든 매개 변수를 동시에 업데이트합니다.

```python
params = jax.tree.map(lambda p, g: p - lr * g, params, grads)
```

아니`.parameters()`기호 등록이 없습니다. 나무 구조는 모델입니다.

### 기능적 대 객체 지향적

PyTorch 매장에서는 물체의 내부에 다음과 같은 내용이 있습니다.

```python
class Model(nn.Module):
    def __init__(self):
        self.linear = nn.Linear(784, 10)

    def forward(self, x):
        return self.linear(x)
```

JAX는 정해진 상태의 순수 함수를 사용합니다:

```python
def predict(params, x):
    return jnp.dot(x, params['w']) + params['b']
```

파람은 입력됩니다. 아무것도 저장되지 않습니다. 아무것도 돌연변이되지 않습니다. 이것은 모든 기능을 테스트, 컴파일, 컴파일 할 수 있게 만듭니다. 또한 당신은 직접 파람을 관리합니다. 또는 플래크스 또는 이키노엑스 같은 라이브러리를 사용합니다.

### JAX 생태계

JAX는 원시적인 것을 제공합니다. 도서관은 에르고노믹스를 제공합니다.

| Library | Role | Style |
|---------|------|-------|
| **Flax** (Google) | Neural network layers | `nn.Module` with explicit state |
| **Equinox** (Patrick Kidger) | Neural network layers | Pytree-based, Pythonic |
| **Optax** (DeepMind) | Optimizers + LR schedules | Composable gradient transforms |
| **Orbax** (Google) | Checkpointing | Save/restore pytrees |
| **CLU** (Google) | Metrics + logging | Training loop utilities |

오프택스 (Optax) 는 표준 최적화 라이브러리이다. 그레이디언트 변환 (아담, SGD, 클리핑) 을 파라미터 업데이트에서 분리하여 작곡하는 것이 비약적입니다.

```python
optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adam(learning_rate=1e-3),
)
```

### JAX 와 PyTorch 을 언제 사용 해야 합니까?

| Factor | JAX | PyTorch |
|--------|-----|---------|
| TPU support | First-class (Google built both) | Community-maintained (torch_xla) |
| GPU support | Good (CUDA via XLA) | Best-in-class (native CUDA) |
| Debugging | Hard (tracing + compilation) | Easy (eager, line-by-line) |
| Ecosystem | Research-focused (Flax, Equinox) | Massive (HuggingFace, torchvision, etc.) |
| Hiring | Niche (Google/DeepMind/Anthropic) | Mainstream (everywhere) |
| Large-scale training | Superior (XLA, pmap, mesh) | Good (FSDP, DeepSpeed) |
| Prototyping speed | Slower (functional overhead) | Faster (mutate and go) |
| Production inference | TensorFlow Serving, Vertex AI | TorchServe, Triton, ONNX |
| Who uses it | DeepMind (Gemini), Anthropic (Claude) | Meta (Llama), OpenAI (GPT), Stability AI |

솔직한 대답은 PyTorch를 사용하세요 JAX를 사용하는 특별한 이유가 없다면요. 그 이유는 TPU 접근, 예를 들어 매개 변수 필요성, 대규모 멀티 디바이스 훈련, 또는 구글/딥마인드/안드로픽에서 일하는 것입니다.

### JAX에서 무작위 숫자

JAX는 글로벌 무작위 상태가 없습니다. 모든 무작위 작업은 명시적인 PRNG 키를 필요로 합니다.

```python
key = jax.random.PRNGKey(42)
key1, key2 = jax.random.split(key)
w = jax.random.normal(key1, shape=(784, 256))
```

처음에는 짜증나게 들지만, 그것은 장치와 컴파일에서 재생가능성을 보장합니다. PyTorch의`torch.manual_seed`멀티GPU 설정에서 보증할 수 없습니다.

```figure
batchnorm-effect
```

## 건설 해

### 단계 1: 설정 및 데이터

JAX와 Optax를 사용하여 MNIST에서 3층 MLP를 훈련합니다. 784개의 입력, 256개의 뉴런과 128개의 숨겨진 두층, 10개의 출력 클래스.

```python
import jax
import jax.numpy as jnp
from jax import random
import optax

def get_mnist_data():
    from sklearn.datasets import fetch_openml
    mnist = fetch_openml('mnist_784', version=1, as_frame=False, parser='auto')
    X = mnist.data.astype('float32') / 255.0
    y = mnist.target.astype('int')
    X_train, X_test = X[:60000], X[60000:]
    y_train, y_test = y[:60000], y[60000:]
    return X_train, y_train, X_test, y_test
```

### 단계 2: 매개 변수를 초기화

클래스 없습니다. 그냥 피트리를 반환하는 함수입니다.

```python
def init_params(key):
    k1, k2, k3 = random.split(key, 3)
    scale1 = jnp.sqrt(2.0 / 784)
    scale2 = jnp.sqrt(2.0 / 256)
    scale3 = jnp.sqrt(2.0 / 128)
    params = {
        'layer1': {
            'w': scale1 * random.normal(k1, (784, 256)),
            'b': jnp.zeros(256),
        },
        'layer2': {
            'w': scale2 * random.normal(k2, (256, 128)),
            'b': jnp.zeros(128),
        },
        'layer3': {
            'w': scale3 * random.normal(k3, (128, 10)),
            'b': jnp.zeros(10),
        },
    }
    return params
```

3개의 PRNG 키가 한 씨앗에서 분리되어 있고, 모든 무게는 둥지를 틀어 놓은 명령어에서 변하지 않는 배열입니다.

### 3단계: 앞면

```python
def forward(params, x):
    x = jnp.dot(x, params['layer1']['w']) + params['layer1']['b']
    x = jax.nn.relu(x)
    x = jnp.dot(x, params['layer2']['w']) + params['layer2']['b']
    x = jax.nn.relu(x)
    x = jnp.dot(x, params['layer3']['w']) + params['layer3']['b']
    return x

def loss_fn(params, x, y):
    logits = forward(params, x)
    one_hot = jax.nn.one_hot(y, 10)
    return -jnp.mean(jnp.sum(jax.nn.log_softmax(logits) * one_hot, axis=-1))
```

순수 기능, 파라마스, 예측`self`, 저장 상태가 없습니다.`loss_fn`초점부터 횡성 엔트로피를 계산합니다. 소프트맥스, 로그, 마이너스 평균

### 단계 4: JIT 에 의해 작성 된 훈련 단계

```python
@jax.jit
def train_step(params, opt_state, x, y):
    loss, grads = jax.value_and_grad(loss_fn)(params, x, y)
    updates, opt_state = optimizer.update(grads, opt_state, params)
    params = optax.apply_updates(params, updates)
    return params, opt_state, loss

@jax.jit
def accuracy(params, x, y):
    logits = forward(params, x)
    preds = jnp.argmax(logits, axis=-1)
    return jnp.mean(preds == y)
```

`jax.value_and_grad`손실 값과 그라디엔트를 한 번으로 반환합니다.`@jax.jit`디코레이터는 두 함수를 모두 XLA로 컴파일합니다. 첫 번째 호출 후, 각 훈련 단계는 파이썬을 만지지 않고 실행됩니다.

### 5단계: 훈련 로프

```python
optimizer = optax.adam(learning_rate=1e-3)

X_train, y_train, X_test, y_test = get_mnist_data()
X_train, X_test = jnp.array(X_train), jnp.array(X_test)
y_train, y_test = jnp.array(y_train), jnp.array(y_test)

key = random.PRNGKey(0)
params = init_params(key)
opt_state = optimizer.init(params)

batch_size = 128
n_epochs = 10

for epoch in range(n_epochs):
    key, subkey = random.split(key)
    perm = random.permutation(subkey, len(X_train))
    X_shuffled = X_train[perm]
    y_shuffled = y_train[perm]

    epoch_loss = 0.0
    n_batches = len(X_train) // batch_size
    for i in range(n_batches):
        start = i * batch_size
        xb = X_shuffled[start:start + batch_size]
        yb = y_shuffled[start:start + batch_size]
        params, opt_state, loss = train_step(params, opt_state, xb, yb)
        epoch_loss += loss

    train_acc = accuracy(params, X_train[:5000], y_train[:5000])
    test_acc = accuracy(params, X_test, y_test)
    print(f"Epoch {epoch + 1:2d} | Loss: {epoch_loss / n_batches:.4f} | "
          f"Train Acc: {train_acc:.4f} | Test Acc: {test_acc:.4f}")
```

10 시대~97%의 시험 정확성. 첫 번째 시대는 느리죠 (JIT 컴파일). 2~10 시대는 빠르다.

무엇이 빠진지 알아보세요:`.zero_grad()`아니`.backward()`아니`.step()`모든 업데이트는 하나의 복합 함수 호출입니다. 그라디엔트는 계산되고, 아담이 변환하고, 매개 변수에 적용됩니다.`train_step`- 그래

## 사용 하 고

### : 구글 표준

플래크스는 JAX 신경 네트워크 라이브러리 중 가장 일반적인 것입니다.`nn.Module`다시, 하지만 명시적인 국가 관리:

```python
import flax.linen as nn

class MLP(nn.Module):
    @nn.compact
    def __call__(self, x):
        x = nn.Dense(256)(x)
        x = nn.relu(x)
        x = nn.Dense(128)(x)
        x = nn.relu(x)
        x = nn.Dense(10)(x)
        return x

model = MLP()
params = model.init(jax.random.PRNGKey(0), jnp.ones((1, 784)))
logits = model.apply(params, x_batch)
```

파이토르치와 같은 구조이지만`params`모델과 분리되어 있습니다. `model.init()`파람을 만들어냅니다.`model.apply(params, x)`앞을 통과합니다. 모델 객체는 상태가 없습니다.

### 평창: 파이톤 대안

이키노크스 (패트릭 키더) 는 피트 트레로서의 모델을 나타냅니다.

```python
import equinox as eqx

model = eqx.nn.MLP(
    in_size=784, out_size=10, width_size=256, depth=2,
    activation=jax.nn.relu, key=jax.random.PRNGKey(0)
)
logits = model(x)
```

모델 자체는 피트리입니다.`.apply()`매개 변수는 모델의 잎입니다. 이것은 JAX의 생각과 더 가깝습니다.

### 오프택스: 컴포지블 오프티마저

오프택스 (Optax) 는 업데이트에서 gradient 변환을 분리합니다.

```python
schedule = optax.warmup_cosine_decay_schedule(
    init_value=0.0, peak_value=1e-3,
    warmup_steps=1000, decay_steps=50000
)

optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adamw(learning_rate=schedule, weight_decay=0.01),
)
```

gradient clipping, 학습 속도 온화, 체중 감소 - 모든 것은 변화의 순서로 구성됩니다. 각 변환은 gradients를 보고, 수정하고 다음으로 전달합니다.

## 선박

**Installation:**

```bash
pip install jax jaxlib optax flax
```

GPU 지원:

```bash
pip install jax[cuda12]
```

TPU (Google 클라우드) 에 대한:

```bash
pip install jax[tpu] -f https://storage.googleapis.com/jax-releases/libtpu_releases.html
```

**Performance gotchas:**

- 첫 번째 JIT 호출은 느리죠. 벤치마킹 전에 따뜻해 보세요.
- JIT 내부 JAX 배열에 파이썬 루프를 피하십시오.`jax.lax.scan`또는`jax.lax.fori_loop`- 그래
- `jax.debug.print()`JIT 내부에서 작동합니다.`print()`그렇지 않습니다.
- `jax.profiler`XLA 컴파일링은 병목을 숨길 수 있습니다.
- JAX는 기본적으로 GPU 메모리의 75%를 미리 할당합니다.`XLA_PYTHON_CLIENT_PREALLOCATE=false`비활성화하기 위해서

**Checkpointing:**

```python
import orbax.checkpoint as ocp
checkpointer = ocp.PyTreeCheckpointer()
checkpointer.save('/tmp/model', params)
restored = checkpointer.restore('/tmp/model')
```

**This lesson produces:**
- `outputs/prompt-jax-optimizer.md`-- JAX 최적화 구성을 선택하는 명령어
- `outputs/skill-jax-patterns.md`-- JAX에서 기능적인 패턴을 다루는 기술

## 운동

1. MLP에 dropout을 추가합니다. JAX에서 dropout은 PRNG 키를 필요로 합니다. 앞면으로 키를 고 dropout 계층에 따라 나눌 수 있습니다. 테스트 정확도를 비교하고

2. 사용`jax.vmap`32개의 MNIST 이미지들을 위한 각 예제별 기하급수 계산을 하기 위해서. 각 예제별 기하급수 규범을 계산하기 위해서. 어떤 예제들이 가장 큰 기하급수들을 가지고 있으며, 왜?

3. 수동으로 앞뒤 기능을 일반으로 교체합니다 `mlp_forward(params, x)`여러 층을 사용할 수 있습니다.`jax.tree.leaves`깊이를 자동으로 결정하기 위해서

4. 훈련 단계와 훈련 단계 없이 `@jax.jit`100단계씩씩 해봅시다. 하드웨어의 가속도는 얼마나 큰가요?

5.    작곡을 통해 gradient 절단`optax.chain(optax.clip_by_global_norm(1.0), optax.adam(1e-3))`- 썰매와 없이 훈련하고, 그레이딩 규범을 훈련에 따라 그려서 효과를 볼 수 있습니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| XLA | "The thing that makes JAX fast" | Accelerated Linear Algebra -- a compiler that fuses operations and generates optimized GPU/TPU kernels from a computation graph |
| JIT | "Just-in-time compilation" | JAX traces the function on first call, compiles to XLA, then runs the compiled version on subsequent calls |
| Pure function | "No side effects" | A function where the output depends only on inputs -- no global state, no mutation, no randomness without explicit keys |
| vmap | "Auto-batching" | Transforms a function that processes one example into one that processes a batch, without rewriting |
| pmap | "Auto-parallelism" | Replicates a function across multiple devices and splits the input batch |
| Pytree | "Nested dict of arrays" | Any nested structure of lists, tuples, dicts, and arrays that JAX can traverse and transform |
| Tracing | "Recording the computation" | JAX executes the function with abstract values to build a computation graph, without computing real results |
| Functional autodiff | "grad of a function" | Computing derivatives by transforming functions, not by attaching gradient storage to tensors |
| Optax | "JAX's optimizer library" | A composable library of gradient transformations -- Adam, SGD, clipping, scheduling -- that chain together |
| Flax | "JAX's nn.Module" | Google's neural network library for JAX, adding layer abstractions while keeping state explicit |

## 더 많은 읽기

- JAX 문서: https://jax.readthedocs.io/-- 공식적인 문서, 그래드, 지트, 그리고 vmap에 대한 훌륭한 교과서
- "JAX: Python+NumPy 프로그램의 구성 가능한 변환" (브래드베리 등, 2018) - 디자인 철학을 설명하는 원본 논문
-   https://flax.readthedocs.io/-- JAX를 위한 구글의 신경망 라이브러리
- 패트릭 키더, "평균: JAX의 신경 네트워크 (Callble PyTrees and Filtered Transformations) " (2021) - 라인스 대안의 파이썬
- DeepMind, "Optax: Composable gradient transformation and optimization" -- 표준 최적화 라이브러리
- "You Don't Know JAX" (콜린 라펠, 2020) - T5 작가 중 한 명으로부터 JAX의 갓차와 패턴에 대한 실용적인 가이드
