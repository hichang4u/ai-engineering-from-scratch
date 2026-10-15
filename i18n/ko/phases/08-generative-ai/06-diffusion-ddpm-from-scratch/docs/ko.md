# 디프루션 모델  처음부터 DDPM

> 호, 제인, 아비엘 (2020) 은 이 분야에 포기할 수 없는 레시피를 제공했다. 1000 개의 작은 단계에 걸쳐 소음으로 데이터를 파괴하십시오. 소음을 예측하기 위해 하나의 신경망을 훈련하십시오. 추론에 따라 프로세스를 역전합니다. 오늘날 모든 주류 이미지, 비디오, 3D 및 음악 모델은 이 루프에서 실행됩니다. 아마도 흐름 일치 또는 일관성 트릭을 탑재합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 8 · 02 (VAE)
**Time:** ~75 minutes

## 문제

샘플링을 원하시나요?$p_{\text{data}}(x)$.GAN는 종종 분할되는 minimax 게임을 합니다. VAE는 가우스 디코더에서 흐릿한 샘플을 생성합니다. 실제로 원하는 것은 (a) 단일 안정적인 손실 (무엇도 세일 포인트, minimax) 이있는 훈련 목표입니다. (b) 아래쪽 경계 $\log p(x)$(그러므로 확률이 있습니다) 그리고 (c) SOTA 품질과 일치하는 샘플

Sohl-Dickstein et al. (2015) 은 이론적 답을 가지고 있었습니다.$q(x_t \mid x_{t-1})$가우스 소음을 점차적으로 추가하고, 역부전 체인을 훈련시킵니다.$p_\theta(x_{t-1} \mid x_t)$호, 제인, 아비엘 (2020) 은 손실을 한 라인으로 단순화 할 수 있음을 보여주었습니다.  잡음을 예측하고 수학을 정리했습니다. 2020 년에는 이것은 호기심이있었습니다. 2021 년에는 최첨단 샘플을 생산했습니다. 2022 년에는 안정적인 전파가되었습니다. 2026 년에는 초판입니다.

## 개념

![DDPM: forward noise, reverse denoise](../assets/ddpm.svg)

**Forward process $q$.**가우스 소음을 추가합니다$T$작은 단계. 닫힌 형태  수학이 처리 가능한 이유는  누적 단계도 가우스주의이기 때문입니다:

```math
q(x_t \mid x_0) = \mathcal{N}\left( \sqrt{\bar{\alpha}_t} \cdot x_0, (1 - \bar{\alpha}_t) \cdot I \right)
```

어디$\bar\alpha_t = \prod_{s=1}^{t} (1 - \beta_s)$$\beta_t$- 선택해$\beta_t$1e-4에서 0.02까지 선형적으로 $T=1000$단계 및$x_T$대략적으로$\mathcal{N}(0, I)$- 그래

**Reverse process $p_\theta$.**신경망을 배우세요$\epsilon_\theta(x_t, t)$추가된 소음을 예측하는 것입니다.$x_t$, 다음으로 표시한다:

```math
x_{t-1} = \frac{1}{\sqrt{\alpha_t}} \cdot \left( x_t - \frac{\beta_t}{\sqrt{1 - \bar{\alpha}_t}} \cdot \epsilon_\theta(x_t, t) \right) + \sigma_t \cdot z
```

어디$\sigma_t$$\sqrt{\beta_t}$이 표현은 못생긴데, 그냥 대수학으로 풀려나서$x_{t-1}$후면으로$q(x_{t-1} \mid x_t, x_0)$그리고 대체$x_0$소음 예측된 추정치와 함께

**Training loss.**

```math
L_{\text{simple}} = \mathbb{E}_{x_0, t, \epsilon} \left[ \left\lVert \epsilon - \epsilon_\theta\left( \sqrt{\bar{\alpha}_t} \cdot x_0 + \sqrt{1 - \bar{\alpha}_t} \cdot \epsilon, t \right) \right\rVert^2 \right]
```

샘플$x_0$데이터에서, 무작위로 선택하세요$t$, 샘플$\epsilon \sim \mathcal{N}(0, I)$, 소음의 계산$x_t$한 번 샷을 찍고 소음을 다시 다.

**Sampling.**시작해$x_T \sim \mathcal{N}(0, I)$                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             $t = T$1까지 완료

## 왜 효과가 있는지

세 가지 직관:

1. **Denoising is easy; generating is hard.**$t=T$, 데이터 는 순수한 잡음  네트워크 는 소소한 문제 를 해결 해야 합니다.$t=0$, 네트워크는 몇 개의 픽셀을 청소해야 합니다.$t$, 문제는 어렵지만 네트워크는 모든 잡음 수준에서 같은 무게를 흐르는 많은 gradients를 가지고 있습니다.

2. **Score matching in disguise.**빈센트 (2011) 는 소음을 예측하는 것은 추정하는 것과 동등하다는 것을 증명했습니다.$\nabla_x \log q(x_t \mid x_0)$, *점점*. 역 SDE는 이 점수를 사용하여 밀도 기하급수 를 따라 고 확률 지역으로 인도되는 무작위 행진을 수행합니다.

3. **The ELBO reduces to simple MSE.**전체 변동 하위 경계 는 시간 단계 에 대한 KL 용어를 가지고 있다. DDPM 의 매개 변수화 와 함께 그 KL 용어는 특정 계수 를 가진 잡음 예측 에 대한 MSE 로 단순화 된다. Ho 는 계수를 떨어뜨리고 (이 를 "단순" 손실 이라고 부른다) 품질 * 개선된다*.

```figure
diffusion-denoise
```

## 건설 해

`code/main.py`1D DDPM를 구현합니다. 데이터는 두 모드 혼합입니다. "넷"은$(x_t, t)$훈련은 일선 손실입니다. 샘플링은 역부슬을 반복합니다.

### 단계 1: 앞선 일정은 (폐폐된 양식)

```python
betas = [1e-4 + (0.02 - 1e-4) * t / (T - 1) for t in range(T)]
alphas = [1 - b for b in betas]
alpha_bars = []
cum = 1.0
for a in alphas:
    cum *= a
    alpha_bars.append(cum)
```

### 2단계: 샘플`x_t`한 발사

```python
def forward_sample(x0, t, alpha_bars, rng):
    a_bar = alpha_bars[t]
    eps = rng.gauss(0, 1)
    x_t = math.sqrt(a_bar) * x0 + math.sqrt(1 - a_bar) * eps
    return x_t, eps
```

### 단계 3: 한 단계 훈련

```python
def train_step(x0, model, alpha_bars, rng):
    t = rng.randrange(T)
    x_t, eps = forward_sample(x0, t, alpha_bars, rng)
    eps_hat = model_forward(model, x_t, t)
    loss = (eps - eps_hat) ** 2
    return loss, gradient_step(model, ...)
```

### 4단계: 반전 샘플링

```python
def sample(model, alpha_bars, T, rng):
    x = rng.gauss(0, 1)
    for t in range(T - 1, -1, -1):
        eps_hat = model_forward(model, x, t)
        beta_t = 1 - alphas[t]
        x = (x - beta_t / math.sqrt(1 - alpha_bars[t]) * eps_hat) / math.sqrt(alphas[t])
        if t > 0:
            x += math.sqrt(beta_t) * rng.gauss(0, 1)
    return x
```

40개의 시간 단계와 24개의 MLP를 가진 1D 문제에서는 200년 동안 2가지 모드 혼합물을 학습합니다.

## 시간 조절

네트워크는 어떤 시간 단계를 지칭하는지 알아야 합니다. 두 가지 표준 옵션:

- **Sinusoidal embedding.**트랜스포머 위치 코딩 같은데요$\text{embed}(t) = [\sin(t/\omega_0), \cos(t/\omega_0), \sin(t/\omega_1), \ldots]$MLP를 통해 인터넷으로 방송합니다.
- **Film / group-norm conditioning.**각 블록에서 채널별 규모/ 편향 (FiLM) 에 임베디드된 프로젝트

우리의 장난감 코드는 시누사이드 → 컨카트를 사용한다. 생산 U-네트들은 FiLM를 사용한다.

## 함정

- **Schedule matters a lot.**선형$\beta$DDPM 기본이지만 코시네 스케줄 (니콜 & 다리발, 2021) 은 동일한 계산에 대한 더 나은 FID를 제공합니다. 품질의 평평한 경우 스케줄을 전환하십시오.
- **Timestep embedding is fragile.**순수한 순환$t$플롯은 장난감 1D에 효과가 있지만 이미지에 실패합니다. 항상 적절한 임베디션을 사용하십시오.
- **V-prediction vs ε-prediction.**좁은 체제 (매우 작거나 매우 큰 t) 에 대해$\epsilon$신호-음악의 저하를 가지고 있습니다. V 예측 ($v = \alpha \cdot \epsilon - \sigma \cdot x$) 보다 안정적이면서 SDXL, SD3 및 Flux이 사용한다.
- **Classifier-free guidance.**결론을 내리는 경우 조건부와 무조건적인 계산을 합니다.$\epsilon$그럼$\epsilon_{\text{cfg}} = (1 + w) \cdot \epsilon_{\text{cond}} - w \cdot \epsilon_{\text{uncond}}$$w \approx 3\text{-}7$- 수업 8에 포함됩니다.
- **1000 steps is a lot.**생산 은 DDIM (20-50 단계), DPM-Solver (10-20 단계) 또는 디스틸레이션 (1-4 단계) 을 사용 한다.

## 사용 하 고

| Role | Typical stack in 2026 |
|------|-----------------------|
| Image pixel-space diffusion (small, toy) | DDPM + U-Net |
| Image latent diffusion | VAE encoder + U-Net or DiT (Lesson 07) |
| Video latent diffusion | Spatiotemporal DiT (Sora, Veo, WAN) |
| Audio latent diffusion | Encodec + diffusion transformer |
| Science (molecules, proteins, physics) | Equivariant diffusion (EDM, RFdiffusion, AlphaFold3) |

퍼포션은 보편적인 생성 척추입니다. 흐름 일치 (강좌 13) 은 일반적으로 동일한 품질을 위해 추론 속도에서 승리하는 2024-2026 경쟁자입니다.

## 선박

저장`outputs/skill-diffusion-trainer.md`. 스킬은 데이터 세트 + 계산 예산 및 출력을 취합니다. 스케줄 (선형/코시네/시그모이드), 예측 목표 (ε/v/x), 단계의 수, 가이드 스케일, 샘플러 가족 및 평가 프로토콜.

## 운동

1. **Easy.**T를 40에서 10으로 변경합니다`code/main.py`표본 품질 (출력 시각 히스토그램) 은 어떻게 떨어지는가? 두 모드 구조는 어느 T에서 붕괴되는가?
2. **Medium.**ε 예측에서 v 예측으로 전환하고 역행 단계를 다시 도출하고 최종 샘플 품질을 비교합니다.
3. **Hard.**분류자 없는 안내를 추가합니다. 클래스 레이블에 있는 조건$c \in \lbrace 0, 1 \rbrace$, 훈련 중에 10% 정도 떨어뜨리고 샘플링 시간에 사용 $\epsilon = (1+w) \cdot \epsilon_{\text{cond}} - w \cdot \epsilon_{\text{uncond}}$. 조건부 모드에서 타격률을 측정합니다$w = 0, 1, 3, 7$- 그래

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Forward process | "Adding noise" | Fixed Markov chain $q(x_t \mid x_{t-1})$ that destroys the data. |
| Reverse process | "Denoising" | Learned chain $p_\theta(x_{t-1} \mid x_t)$ that reconstructs the data. |
| β schedule | "The noise ladder" | Per-step variance; linear, cosine, or sigmoid. |
| α̅ | "Alpha bar" | Cumulative product $\prod (1 - \beta)$; gives closed-form $x_t$ from $x_0$. |
| Simple loss | "MSE on noise" | $\lVert \epsilon - \epsilon_\theta(x_t, t) \rVert^2$; all variational derivations collapse to this. |
| ε-prediction | "Predict noise" | Output is the noise added; standard DDPM. |
| V-prediction | "Predict velocity" | Output is $\alpha \cdot \epsilon - \sigma \cdot x$; better conditioning across t. |
| DDPM | "The paper" | Ho et al. 2020; linear β, 1000 steps, U-Net. |
| DDIM | "Deterministic sampler" | Non-Markov sampler, 20-50 steps, same training objective. |
| Classifier-free guidance | "CFG" | Mix conditional and unconditional noise predictions to amplify conditioning. |

## 생산 메모: 디푸지언 추론은 단계적 계산 문제입니다

DDPM 논문은 T=1000 역단계를 실행합니다. 생산에서 아무도 그것을 운송하지 않습니다. 모든 실제 추론 스택은 세 가지 전략 중 하나를 선택합니다. 그리고 각 지도는 "연연이 어디에서 왔는지"의 생산 프레임에 깔끔하게 나타냅니다.

1. **Faster sampler, same model.**DDIM (20-50 단계), DPM-Solver++ (10-20), UniPC (8-16).$\epsilon_\theta$무게는 손상되지 않습니다. 20-50x 지연을 절감합니다.
2. **Distillation.**학생을 더 적은 단계로 교사와 일치하도록 훈련하십시오: 진보적 비료 (2 → 1), 일관성 모델 (자발적 → 1-4), LCM, SDXL-터보, SD3-터보. 지연을 5-10x로 줄이고, 재교육이 필요합니다.
3. **Caching and compilation.** `torch.compile(unet, mode="reduce-overhead")`, TensorRT-LLM의 전파 백엔드,`xformers`/SDPA 주의, bf16 무게. 단계별 지연시간을 2x로 줄입니다. (1) 및 (2) 를 겹치며

생산 전파 서버의 예산 대화는 LLM에 대한 생산 문헌에서 설명하는 것과 같습니다: 지연은 `num_steps × step_cost + VAE_decode`, 출력량은`batch_size × (num_steps × step_cost)^-1`TTFT는 작다 (단계 하나); TPOT-에 해당하는 것은 전체 응답 시간이기 때문에 이미지 생성은 사용자의 관점에서 "모든 것"입니다.

## 더 많은 읽기

- [Sohl-Dickstein et al. (2015). Deep Unsupervised Learning using Nonequilibrium Thermodynamics](https://arxiv.org/abs/1503.03585) 전파 종이를 시간보다 앞두고
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) DDPM
- [Song, Meng, Ermon (2021). Denoising Diffusion Implicit Models](https://arxiv.org/abs/2010.02502) DDIM, 더 적은 단계
- [Nichol & Dhariwal (2021). Improved DDPM](https://arxiv.org/abs/2102.09672) 코시네 스케줄, 학습한 변동
- [Dhariwal & Nichol (2021). Diffusion Models Beat GANs on Image Synthesis](https://arxiv.org/abs/2105.05233) 분류자 지침
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) CFG
- [Karras et al. (2022). Elucidating the Design Space of Diffusion-Based Generative Models (EDM)](https://arxiv.org/abs/2206.00364) 통일된 표기, 가장 깨끗한 요리법
