# 흐름 일치 및 수정된 흐름

> 디프루전 모델은 소음에서 데이터로 가는 곡선 경로를 걷기 때문에 20-50 샘플링 단계를 취한다. 흐름 일치 (Lipman et al., 2023) 와 정정 흐름 (Liu et al., 2022) 는 직선 경로를 훈련한다. 직선 경로는 더 적은 단계가 더 빠른 추론을 의미합니다. 안정적인 디프루전 3, 플루크스.1, 오디오크래프트 2 모두 2024 년에 흐름 일치로 전환되었습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 06 (DDPM), Phase 1 · Calculus
**Time:** ~45 minutes

## 문제

DDPM의 역 과정은 1000 단계의 스토카스틱 걸음입니다$\mathcal{N}(0, I)$데이터 배포로 돌아가서. DDIM는 20-50 결정적 단계로 붕괴했습니다. 더 적은 단계가 필요합니다. 이상적으로는 하나.

만약 당신이 노이즈에서 데이터로 가는 길이가 * 직선*인 방식으로 모델을 훈련시킬 수 있다면,$t=1$ $t=0$이 과정을 직접적으로 구성합니다. 직선 중계기를 정의합니다.$x_1 \sim \mathcal{N}(0, I)$ $x_0 \sim \text{data}$, 벡터 필드를 훈련시키$v_\theta(x, t)$시간 파생값과 일치하기 위해 추론에서 통합합니다.

수정된 흐름 (Liu 2022) 은 더 나아가: 반복적으로 리플로우 절차로 경로를 정렬하여 점진적으로 리플로우로 가까워지는 ODE를 생성합니다. 두 번의 리플로우 반복 후에 2 단계 샘플러는 50 단계 DDPM 품질과 일치합니다.

## 개념

![Flow matching: straight-line interpolation between noise and data](../assets/flow-matching.svg)

### 직선 흐름

정의:

```math
x_t = t \cdot x_1 + (1 - t) \cdot x_0, \quad t \in [0, 1]
```

어디$x_0 \sim \text{data}$그리고$x_1 \sim \mathcal{N}(0, I)$이 직선에서 시간 파생수는 일정합니다

```math
\frac{dx_t}{dt} = x_1 - x_0
```

신경 벡터 필드를 정의합니다$v_\theta(x_t, t)$그리고 이 파생 원자와 일치하도록 훈련합니다.

```math
L = \mathbb{E}_{x_0, x_1, t} \left\lVert v_\theta(x_t, t) - (x_1 - x_0) \right\rVert^2
```

이쪽은**conditional flow matching**리프만 2023: 훈련은 시뮬레이션 무료입니다. ODE를 절대 풀지 않습니다.$(x_0, x_1, t)$그리고 퇴행성.

### 샘플링

추론에서, 학습된 벡터 필드를 시간으로 * 뒤로* 통합합니다.

```math
x_{t-\Delta t} = x_t - \Delta t \cdot v_\theta(x_t, t)
```

시작해$x_1 \sim \mathcal{N}(0, I)$, 에울러 단계 아래로$t=0$- 그래

### 수정된 흐름 (Liu 2022)

직선 흐름은 작동하지만 학습된 경로는 실제로 직선하지 않습니다$x_0$'s 같은 지도를 할 수 있습니다$x_1$. 수정된 흐름의 재류 단계:

1. 열차 흐름 모델$v_1$무작위 조화를 통해
2. 샘플 N 쌍 $(x_1, x_0)$통합함으로써$v_1$$x_1$착륙까지$x_0$- 그래
3. 열차$v_2$이 쌍들은 이제 "ODE-동렬"이기 때문에, 그 사이의 직선 간섭 요소는 더 평평합니다.
4. 다시 말해

실제 2개의 리플로우 반복은 거의 선형으로 이루어져 2-4 단계 추론을 가능하게 합니다. SDXL-터보, SD3-터보, LCM는 모두 흐름과 일치하는 모델입니다.

### 왜 이 작품이 2024년 사진에서 승리했는가?

세 가지 이유:

1. **Simulation-free training** 교육 중에 ODE가 없는데 실행에 옮기는 것은 비범한 일입니다.
2. **Better loss geometry** 직선 경로는 신호-음악의 일관성을 가지고 있지만, DDPM ε-손실은 스케줄의 가장자리에 나쁜 SNR를 가지고 있습니다.
3. **Faster inference** SDXL-터보 품질 4~8 단계; 일관성 디스틸레이션 1 단계.

## 흐름 일치와 DDPM  정확한 연결

가우스 조건 경로와 흐름 일치는 특정 잡음 스케줄을 가진 전파입니다.$x_t = \alpha(t) x_0 + \sigma(t) x_1$시간과 흐름의 일치로 스트래톤비치 변형 분포를 회복합니다$v = \alpha' \cdot x_0 - \sigma' \cdot x_1$이 둘은 가우스 경로에 대수학적으로 동등합니다.

흐름 일치가 추가된 것은 목표의 *명명성* (평등 속도), 더 깨끗한 손실, 그리고 비가우스 반발자 실험의 허가입니다.

```figure
normalizing-flow
```

## 건설 해

`code/main.py`2 모드 가우스 미세에 1D 흐름 일치 구현.$v_\theta(x, t)$직선 목표에 훈련된 작은 MLP입니다. 추론을 하면 1, 2, 4 및 20개의 Euler 단계를 통합하고 샘플 품질을 비교합니다.

### 단계 1: 훈련 손실

```python
def train_step(x0, net, rng, lr):
    x1 = rng.gauss(0, 1)
    t = rng.random()
    x_t = t * x1 + (1 - t) * x0
    target = x1 - x0
    pred = net_forward(x_t, t)
    loss = (pred - target) ** 2
    # backprop + update
```

### 단계 2: 다단계 추론

```python
def sample(net, num_steps):
    x = rng.gauss(0, 1)
    for i in range(num_steps):
        t = 1.0 - i / num_steps
        dt = 1.0 / num_steps
        x -= dt * net_forward(x, t)
    return x
```

### 단계 3: 단계 수를 비교

4단계 샘플링이 이미 20단계 품질과 일치할 것으로 예상합니다

## 함정

- **Time parameterization.**흐름 일치 용도로$t \in [0, 1]$$t=0$데이터에$t=1$DDPM 사용$t \in [0, T]$$t=0$데이터에$t=T$같은 방향, 다른 규모, 신문들은 항상 잘못 알고 있습니다.
- **Schedule choice.**수정된 흐름의 직선은 "흐름 일치 스케줄"이지만, 더 나은 규모의 커버리를 위해 코시노 또는 로지트-정상 t 샘플링을 사용할 수 있습니다.
- **Reflow cost.**재동류를 위한 복합 데이터 세트를 생성하는 것은 샘플에 대한 완전한 추론 통과입니다. 실제로 1-2 단계 추론이 필요할 때만 재동류를 합니다.
- **Classifier-free guidance still applies.**그냥 교환해$\epsilon$$v$선형 조합: $v_{\text{cfg}} = (1+w) v_{\text{cond}} - w v_{\text{uncond}}$- 그래

## 사용 하 고

| Use case | 2026 stack |
|----------|-----------|
| Text-to-image, best quality | Flow matching: SD3, Flux.1-dev |
| Text-to-image, 1-4 steps | Distilled flow matching: Flux.1-schnell, SD3-Turbo, SDXL-Turbo |
| Real-time inference | Consistency distillation from a flow-matched base (LCM, PCM) |
| Audio generation | Flow matching: Stable Audio 2.5, AudioCraft 2 |
| Video generation | Flow matching mixed with diffusion (Sora, Veo, Stable Video) |
| Science / physics (particle trajectories, molecules) | Flow matching + equivariant vector field |

논문에서 2025~2026년에 "방산보다 더 빠른 것"이라고 할 때, 거의 항상 흐름과 일치하는 + 디스틸레이션입니다.

## 선박

저장`outputs/skill-fm-tuner.md`. 스킬은 디푸지션 스타일 모델 스펙을 가지고 흐름을 일치시키는 훈련 구성으로 변환합니다. 스케줄 선택, 시간 샘플링 분포 (일본 / 로지트-정상), 최적화, 리플로우 계획, 목표 단계 수, 평가 프로토콜.

## 운동

1. **Easy.**달아`code/main.py`그리고 1단계와 20단계 MSE를 실제 데이터 분포와 비교합니다.
2. **Medium.**유니폼에서 전환$t$샘플링은 로지트-노멀 (t 중간에 샘플링을 집중) 으로 이루어집니다. 모델 품질이 향상되는가?
3. **Hard.**1개의 리플로우 반복을 실행: 짝을 생성$(x_0, x_1)$첫 번째 모델을 통합하여, 두 번째 모델을 쌍으로 훈련시키고 1 단계 샘플 품질을 비교합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Flow matching | "Straight-line diffusion" | Train $v_\theta(x, t)$ to match $x_1 - x_0$ along an interpolant. |
| Rectified flow | "Reflow" | Iterative procedure that straightens learned flows. |
| Velocity field | "v_θ" | Output of the model — the direction to move $x_t$. |
| Straight-line interpolant | "The path" | $x_t = (1-t) \cdot x_0 + t \cdot x_1$; trivial target derivative. |
| Euler sampler | "1st order ODE solver" | Simplest integrator; works well when paths are straight. |
| Logit-normal t | "SD3 sampling" | Concentrate $t$ sampling toward mid-values where gradients are strongest. |
| Consistency distillation | "1-step sampler" | Train a student to map any $x_t$ directly to $x_0$. |
| CFG with velocity | "v-CFG" | $v_{\text{cfg}} = (1+w) v_{\text{cond}} - w v_{\text{uncond}}$; same trick, new variable. |

## 생산 메모: 플루크스.1-슈넬은 가장 빠른 흐름에 일치합니다

플루크스 1 - 1  플루크스 데브급 품질을 유지하면서 1-4 추론 단계로 소화 된 플루크스 1 - 1   플루크스                                                                                                                                                                                                                                         

| Variant | Steps | Latency at 1024² on L4 | Total FLOPs (relative) |
|---------|-------|------------------------|------------------------|
| Flux.1-dev (raw) | 50 | ~15 s | 1.0× |
| Flux.1-schnell | 4 | ~1.2 s | 0.08× (12× faster) |
| SDXL-base | 30 | ~4 s | 0.25× |
| SDXL-Lightning 2-step | 2 | ~0.3 s | 0.03× |

생산 규칙: **flow-matched base + distillation = the 2026 default for fast text-to-image.**모든 주요 공급업체들은 이 조합을 배포한다: SD3-Turbo (SD3 + 흐름 + 디스틸레이션), Flux-schnell (Flux-dev + 수정- 흐름 직선화), CogView-4-Flash. 순수한 전파 기반은 기존 체크포인트에서만 존재한다.

## 더 많은 읽기

- [Liu, Gong, Liu (2022). Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow](https://arxiv.org/abs/2209.03003) 정정된 흐름
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) 흐름 일치
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, 스케일로 정비된 흐름
- [Albergo, Vanden-Eijnden (2023). Stochastic Interpolants](https://arxiv.org/abs/2303.08797)FM+ 전파를 다루는 일반적인 프레임워크
- [Song et al. (2023). Consistency Models](https://arxiv.org/abs/2303.01469) 1단계 디스틸링
- [Sauer et al. (2023). Adversarial Diffusion Distillation (SDXL-Turbo)](https://arxiv.org/abs/2311.17042) 터보 변종
- [Black Forest Labs (2024). Flux.1 models](https://blackforestlabs.ai/announcing-black-forest-labs/) 생산에서 흐름의 일치
