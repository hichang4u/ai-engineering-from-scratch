# 자동코더 및 변형 자동코더 (VAE)

> 간단한 자동코더는 압축하고 다시 구성합니다. 그것은 기억합니다. 그것은 생성하지 않습니다. 하나의 트릭을 추가합니다.$z = \mu + \sigma \cdot \epsilon$2026년에 사용되는 모든 잠복한 전파 및 흐름 일치 이미지 모델에는

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 07 (CNNs), Phase 8 · 01 (Taxonomy)
**Time:** ~75 minutes

## 문제

784 피클스 MNIST 숫자를 16자리 코드로 압축하고 다시 구성합니다. 일반 자동 앵커는 MSE 재구성 앵커를 만들지만 코드 공간은 덩어리 엉망입니다. 코드 공간에서 무작위 지점을 선택하고 해독하면 소음이 발생합니다. 샘플러가 없습니다. 그것은 앵커를 입고있는 압축 모델입니다.

실제로 원하는 것은: (a) 코드 공간은 깨끗하고 부드러운 분포입니다.$\mathcal{N}(0, I)$(b) 어떤 샘플을 디코딩하면 믿을 수 있는 숫자를 생성하고 (c) 코더와 디코더는 여전히 잘 압축됩니다. 세 가지 목표, 하나의 건축, 하나의 손실.

2013년 킹마 VAE는 코더를 훈련시켜 *유통*을 출력하도록 해줍니다.$q(z \mid x) = \mathcal{N}(\mu(x), \sigma(x)^2)$, 그 분포를 전직으로 끌어당겨$\mathcal{N}(0, I)$KL 벌금으로, 그리고 샘플링$z$$q(z \mid x)$해독 전에, 추론 시, 코더를 내려 놓아 샘플$z \sim \mathcal{N}(0, I)$KL 벌금으로 코드 공간의 구조가 이루어질 수 있습니다.

2026년 VAE는 거의 독립적으로 배포되지 않습니다.  원료 이미지 품질에 있어서 분포로 우위를 점했습니다.  그러나 그들은 모든 잠복 분포 모델 (SD 1/2/XL/3, 플럭스, 오디오크래프트) 의 선택의 코더입니다. VAE를 배우면 사용하는 모든 이미지 파이프라인의 보이지 않는 첫 번째 층을 배울 수 있습니다.

## 개념

![Autoencoder vs VAE: the reparameterization trick](../assets/vae.svg)

**Autoencoder.** $z = \text{encoder}(x)$$\hat{x} = \text{decoder}(z)$, 손실 = $\lVert x - \hat{x} \rVert^2$코드 공간은 구조화되지 않았습니다.

**VAE encoder.**출력 2개의 벡터를:$\mu(x)$그리고$\log \sigma^2(x)$- 이 글은$q(z \mid x) = \mathcal{N}(\mu, \mathop{\mathrm{diag}}(\sigma^2))$- 그래

**Reparameterization trick.**$q(z \mid x)$분화할 수 없습니다. 샘플을 다시 작성하세요$z = \mu + \sigma \cdot \epsilon$어디$\epsilon \sim \mathcal{N}(0, I)$- 이제$z$의 결정적 함수입니다$(\mu, \sigma)$더 이상 변수 없는 소음  기하급수 흐르는 `μ`그리고$\sigma$- 그래

**Loss.**증거 하위 띠 (ELBO), 두 가지 용어:

```math
\begin{aligned}
\text{loss} &= \text{reconstruction} + \beta \cdot \mathrm{KL}[q(z \mid x) \,\Vert\, \mathcal{N}(0, I)] \\
&= \lVert x - \hat{x} \rVert^2 + \beta \cdot \sum_i \frac{\sigma_i^2 + \mu_i^2 - \log \sigma_i^2 - 1}{2}
\end{aligned}
```

재건이 추진됩니다$\hat{x}$ $x$KL가 밀어붙이고$q(z \mid x)$전신으로 향하고, 그들은 교환합니다.$\beta$($<1$) = 더 날카로운 샘플, 코드 공간은 가우스 미소$\beta$($>1$) = 더 깨끗한 코드 공간, 더 흐릿한 샘플. β-VAE (히그인스 2017) 는 이 버튼을 유명하게 만들고 분해 연구로 시작되었습니다.

**Sampling.**추론: 추론$z \sim \mathcal{N}(0, I)$1번 앞을 통과하면  디스포전과 같은 반복적인 샘플링이 없습니다.

```figure
vae-latent-grid
```

## 건설 해

`code/main.py`피나 타르치 없이 작은 VAE를 구현합니다. 입력은 8D의 2 구성 요소 가우스 혼합에서 얻은 8 차원 합성 데이터입니다. 피와 디코더는 단일 숨겨진 계층 MLP입니다. 우리는 이 활성화, 앞 패스, 손실, 그리고 손으로 작성 된 후 패스를 구현합니다. 생산  교육은 아닙니다.

### 단계 1: 코더를 앞으로

```python
def encode(x, enc):
    h = tanh(add(matmul(enc["W1"], x), enc["b1"]))
    mu = add(matmul(enc["W_mu"], h), enc["b_mu"])
    log_sigma2 = add(matmul(enc["W_sig"], h), enc["b_sig"])
    return mu, log_sigma2
```

$\log \sigma^2$대신$\sigma$그래서 네트워크 출력은 제한되지 않습니다 (softplus of σ는 함정입니다  gradients die at $\sigma \approx 0$)

### 단계 2: 재개정 및 디코딩

```python
def reparameterize(mu, log_sigma2, rng):
    eps = [rng.gauss(0, 1) for _ in mu]
    sigma = [math.exp(0.5 * lv) for lv in log_sigma2]
    return [m + s * e for m, s, e in zip(mu, sigma, eps)]

def decode(z, dec):
    h = tanh(add(matmul(dec["W1"], z), dec["b1"]))
    return add(matmul(dec["W_out"], h), dec["b_out"])
```

### 단계 3: ELBO

```python
def elbo(x, x_hat, mu, log_sigma2, beta=1.0):
    recon = sum((a - b) ** 2 for a, b in zip(x, x_hat))
    kl = 0.5 * sum(math.exp(lv) + m * m - lv - 1 for m, lv in zip(mu, log_sigma2))
    return recon + beta * kl, recon, kl
```

정확한 폐쇄형 KL, 왜냐하면 두 분포는 가우스어이기 때문입니다. 수치적으로 통합하지 않습니다. 사람들은 여전히 2026 년 몬테 카를로 KL 추정으로 코드를 전송합니다. 그것은 이유없이 3x 느리죠.

### 단계 4: 생성

```python
def sample(dec, z_dim, rng):
    z = [rng.gauss(0, 1) for _ in range(z_dim)]
    return decode(z, dec)
```

이것은 생성 모델입니다. 5 줄입니다.

## 함정

- **Posterior collapse.**KL 단기 드라이브$q(z \mid x) \to \mathcal{N}(0, I)$너무 공격적으로$z$$x$. 수정: β- 해제 (start $\beta=0$, 램프 1), 무료 비트, 또는 비활성 차원에서 KL를 건너뛰기.
- **Blurry samples.**가우스 디코더 확률은 MSE 재조성을 의미하며, 이는 L2 (평균) 에 대해 Bayes-최적입니다.
- **β too large, too early.**후속 붕괴를 보시면 시작하세요$\beta \approx 0.01$그리고 램프
- **Latent dim too small.**16D는 MNIST, 256-D는 ImageNet 2562, 2048-D는 ImageNet 10242에 작동한다.

## 사용 하 고

2026 VAE 스택:

| Situation | Pick |
|-----------|------|
| Image-latent encoder for diffusion | Stable Diffusion VAE (`sd-vae-ft-ema`) or Flux VAE |
| Audio-latent encoder | Encodec (Meta), SoundStream, or DAC (Descript) |
| Video latents | Sora's spatiotemporal patches, Latte VAE, WAN VAE |
| Disentangled representation learning | β-VAE, FactorVAE, TCVAE |
| Discrete latents (for transformer modelling) | VQ-VAE, RVQ (ResidualVQ) |
| Continuous latents for generation | Plain VAE, then condition a flow/diffusion model in that latent space |

잠잠하게 전파되는 모델은 VAE이며, VAE는 코더와 디코더 사이에 존재하는 전파 모델이다. VAE는 대략적인 압축을 수행하고, 디포지션 모델은 무거운 업무를 수행한다. 비디오 (VAE + 비디오-디포지션 DiT) 및 오디오 (Encodec + MusicGen 트랜스포머) 에 대한 동일한 패턴이다.

## 선박

저장`outputs/skill-vae-trainer.md`- 그래

기술 수요: 데이터 세트 프로파일 + 잠잠한 디밍 목표 + 하류 사용 (재건, 샘플링 또는 잠잠한 디스포지션 입력) 및 출력: 건축 선택 (평평/β/VQ/RVQ), β 스케줄, 잠잠한 디밍, 디코더 확률 (가우스 vs 카테고리컬), 평가 계획 (Recon MSE, KL per dim, Fréchet  사이의 거리)$q(z \mid x)$그리고$\mathcal{N}(0, I))$- 그래

## 운동

1. **Easy.**변화$\beta$`code/main.py` `0.01``0.1``1.0``5.0`. 최종 재건 MSE와 KL를 기록합니다.$\beta$파레토가 합성 데이터에 가장 적합할까요?
2. **Medium.**가우스 디코더 확률을 베르누리 확률 (횡성 엔트로피 손실) 로 대체하고 동일한 합성 데이터의 바이너리 버전에서 샘플 품질을 비교하십시오.
3. **Hard.**확장`code/main.py`미니 VQ-VAE로: 연속 $z$K=32 항목의 코드북에서 가장 가까운 이웃 검색을 통해 재구성 MSE를 비교하고 코드북 항목이 얼마나 많이 사용되었는지 보고하십시오 (코드북 붕괴는 실제입니다).

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Autoencoder | Encode-decode network | $x \to z \to \hat{x}$, learn MSE. Not generative. |
| VAE | AE with a sampler | Encoder outputs a distribution, KL penalty shapes code space. |
| ELBO | Evidence lower bound | $\log p(x) \ge \text{recon} - \mathrm{KL}[q(z \mid x) \Vert p(z)]$; tight when $q = p(z \mid x)$. |
| Reparameterization | $z = \mu + \sigma \cdot \epsilon$ | Rewrites stochastic node as deterministic + pure noise. Enables backprop through sampling. |
| Prior | $p(z)$ | Target distribution for the latent, typically $\mathcal{N}(0, I)$. |
| Posterior collapse | "KL term wins" | Encoder ignores $x$, outputs the prior; decoder must hallucinate. |
| β-VAE | Tunable KL weight | $\text{loss} = \text{recon} + \beta \cdot \mathrm{KL}$. Higher $\beta$ = more disentangled but blurrier. |
| VQ-VAE | Discrete latent | Replace continuous $z$ with nearest codebook vector; enables transformer modelling. |

## 생산 메모: VAE는 디프루전 서버에서 가장 뜨거운 경로입니다

안정적인 디프루전/플루스/SD3 파이프라인에서 VAE는 요청에 따라 두 번 호출됩니다. 한 번 암호화 (img2img / 인 페인팅을 수행하는 경우) 한 번 암호화. 10242에서 디코더 패스는 종종 전체 파이프라인에서 가장 큰 단일 활성화 메모리 피크입니다. 왜냐하면 그것은  템플러 `128×128×16`  `1024×1024×3`. 두 가지 실질적인 결과:

- **Slice or tile the decode.** `diffusers`노출`pipe.vae.enable_slicing()`그리고`pipe.vae.enable_tiling()`. 은 작은 수직 유물을 거래합니다$O(\text{tile}^2)$기억 대신$O(H \cdot W)$. 소비자 GPU에 10242+에 필수적입니다.
- **bf16 decoder, fp32 numerics for the final resize.**SD 1.x VAE는 fp32에서 출시되었으며 10242+에서 fp16로 투입되면 * 조용히 NaNs*을 생성합니다.`madebyollin/sdxl-vae-fp16-fix` 항상 fp16 고정 변형을 선호하거나 bf16을 사용하십시오.

## 더 많은 읽기

- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) VAE 논문
- [Higgins et al. (2017). β-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework](https://openreview.net/forum?id=Sy2fzU9gl) 분해된 β-VAE
- [van den Oord et al. (2017). Neural Discrete Representation Learning](https://arxiv.org/abs/1711.00937) VQ-VAE
- [Vahdat & Kautz (2021). NVAE: A Deep Hierarchical Variational Autoencoder](https://arxiv.org/abs/2007.03898) 최첨단 이미지 VAE
- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) 안정적인 디프루션; VAE는 코딩 기능이다.
- [Défossez et al. (2022). High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) ENCODEC, 오디오 VAE 표준
