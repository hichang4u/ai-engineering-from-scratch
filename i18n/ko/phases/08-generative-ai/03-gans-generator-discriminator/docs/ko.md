# GANs  생성기 vs 차별기

> 2014년 굿펠로우의 트릭은 밀도를 완전히 건너뛰는 것이었습니다. 두 개의 네트워크. 하나는 가짜를 만듭니다. 하나는 잡습니다. 가짜가 실제와 구별되지 않는 한 싸웁니다. 그것은 작동하지 않아야합니다. 종종 작동하지 않습니다. 그것이 할 때, 샘플은 여전히 좁은 영역에 대한 문학에서 가장 날카로운 것입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 08 (Optimizers), Phase 8 · 02 (VAE)
**Time:** ~75 minutes

## 문제

VAEs는 미미한 샘플을 생성하는데, MSE 디코더 손실은 *평균* 이미지 에 대해 Bayes 최적이며, 많은 유연한 숫자의 평균은 미미한 숫자이기 때문에. 당신은 어떤 목표에 대한 피클스별 인접하지 않은 * 유연성을 보상하는 손실을 원하지만, 유연성을 위한 폐쇄적인 형태는 없습니다. 당신은 그것을 배워야 합니다.

굿펠로우의 아이디어: 분류자를 훈련시켜라$D(x)$실제 사진과 가짜 사진을 구분할 수 있도록$G(z)$바보로$D$. 손실 신호$G$뭐든$D$현재 어떤 것을 실제처럼 보이게 하는 것 같네요. 이 신호는$G$이동하는 목표물을 쫓는 것이 더 낫습니다. 두 네트워크가 합쳐지면$G$데이터 배포를 배우면서도 기록하지 않았습니다.`log p(x)`- 그래

이건 역대 훈련이고 수학은 최소의 게임입니다.

```math
\min_G \max_D \; \mathbb{E}_{\text{real}}[\log D(x)] + \mathbb{E}_{\text{fake}}[\log(1 - D(G(z)))]
```

2026년 GAN는 더 이상 SOTA 생성기가 되지 않습니다 (방포와 흐름 일치는 그 왕관을 먹었습니다). 그러나 StyleGAN 2/3는 지금까지 배포된 가장 날카로운 얼굴 모델이 남아 있습니다. GAN 차별기는 방포 훈련에서 * 인식 손실 *로 사용됩니다. 그리고 적대 훈련은 실시간 방포를 배포 할 수있는 빠른 1 단계 디스틸레이션 (SDXL-Turbo, SD3-Turbo, LCM) 를 작동시킵니다.

## 개념

![GAN training: generator and discriminator in minimax](../assets/gan.svg)

**Generator $G(z)$.**잡음 벡터를 지도$z \sim \mathcal{N}(0, I)$샘플에$\hat{x}$. 디코더 모양의 네트워크 (밀도 또는 변환된 conv).

**Discriminator $D(x)$.**샘플을 스칼라 확률 (또는 점수) 로 지도합니다.

**Loss.**2개의 순차적인 업데이트:

- **Train $D$:** $\text{loss}_D = -[ \log D(x) + \log(1 - D(G(z))) ]$. 2진짜=1의 쌍성 횡성 엔트로피, 가짜=0
- **Train $G$:** $\text{loss}_G = -\log D(G(z))$이것은 Goodfellow가 사용한 * 비충분한 * 형태입니다 (원래)$\log(1 - D(G(z)))$이 이 이 이 이 이$D$자신감이 있는 사람)

**Training loop.**한 단계의$D$, 한 단계의$G$반복해

**Why it works.**만약$G$완벽히 맞습니다$p_{\text{data}}$그럼$D$우연보다 더 좋은 결과를 낼 수 없고 모든 곳에서 0.5을 내놓을 수 있습니다.$G$더 이상 gradient가 없습니다.

**Why it breaks.**모드 붕괴 ($G$한 가지 모드를 찾습니다$D$분류할 수 없고 영원히 을 만들 수 없습니다.$D$너무 빨리 배우고$\log D$포화), 교육 불안정성 (학습률, 배치 크기와 다른 모든 것)

## GAN을 작동시키는 변형

| Year | Innovation | Fix |
|------|------------|-----|
| 2015 | DCGAN | Conv/deconv, batch norm, LeakyReLU — the first stable architecture. |
| 2017 | WGAN, WGAN-GP | Replace BCE with Wasserstein distance + gradient penalty. Fixes vanishing gradient. |
| 2017 | Spectral normalization | Lipschitz-bound the discriminator. Still used in 2026 discriminators. |
| 2018 | Progressive GAN | Train low-res first, add layers. First megapixel results. |
| 2019 | StyleGAN / StyleGAN2 | Mapping network + adaptive instance norm. State of the art for fixed-domain photorealism. |
| 2021 | StyleGAN3 | Alias-free, translation-equivariant — still the face gold standard in 2026. |
| 2022 | StyleGAN-XL | Conditional, class-aware, larger scale. |
| 2024 | R3GAN | Rebrands with stronger regularization; works on 1024² without tricks. |

```figure
gan-minimax
```

## 건설 해

`code/main.py`1D 데이터에 작은 GAN를 훈련시킵니다: 두 개의 가우시안의 혼합입니다. 생성기와 차별기는 단일 숨겨진 층 MLP입니다. 우리는 앞으로, 뒤로, 그리고 minimax 루프를 손으로 구현합니다. 목표는 두 가지 주요 실패 모드를 (모드 붕괴 + 사라지는 기하급수) 발생시 보는 것입니다.

### 단계 1: 포화되지 않는 손실

바닐라 굿펠로우의 손실$\log(1 - D(G(z)))$D가 G의 가짜를 가짜로 분류하면 0으로 이동합니다. 그 시점에서 G의 경각도는 기본적으로 0입니다.$-\log D(G(z))$D가 자신감을 가지고 있을 때 폭발합니다.

```python
def g_loss(d_fake):
    # maximize log D(G(z))  <=>  minimize -log D(G(z))
    return -sum(math.log(max(p, 1e-8)) for p in d_fake) / len(d_fake)
```

### 단계 2: 생성 단계마다 한 가지 차별 단계

```python
for step in range(steps):
    # train D
    real_batch = sample_real(batch_size)
    fake_batch = [G(z) for z in sample_noise(batch_size)]
    update_D(real_batch, fake_batch)

    # train G
    fake_batch = [G(z) for z in sample_noise(batch_size)]  # fresh fakes
    update_G(fake_batch)
```

G에 대한 가짜가 새로 나왔어 그렇지 않으면 그라디엔트가 노후해

### 단계 3: 모드 붕괴를 감시하십시오

```python
if step % 200 == 0:
    samples = [G(z) for z in sample_noise(500)]
    mode_a = sum(1 for s in samples if s < 0)
    mode_b = 500 - mode_a
    if min(mode_a, mode_b) < 50:
        print("  [!] mode collapse: one mode is starved")
```

정통적인 증상은 두 가지 실제 모드 중 하나가 생성되는 것을 멈추고 차별자는 그것을 수정하는 것을 멈추고 있습니다. 왜냐하면 그것은 결코 가짜로 간주되지 않기 때문입니다.

## 함정

- **Discriminator too strong.**D의 학습 속도를 2-5x로 줄여주거나, 인스턴스/라이트 소음을 추가하십시오. D가 95% 이상의 정확성을 달성하면 G가 죽습니다.
- **Generator memorizes a mode.**D 입력에 소음을 추가하거나 미니배치 차별 계층을 사용하거나 WGAN-GP로 전환하십시오.
- **Batch norm leaking statistics.**실제 배트 + 같은 BN 계층을 통해 흐르는 가짜 배트 같은 통계들을 혼합합니다. 대신 인스턴스 표준 또는 스펙트럼 표준을 사용하세요.
- **Inception-score gaming.**FID와 IS는 낮은 샘플 수를 통해 소음입니다. eval에서 ≥10k 샘플을 사용하십시오.
- **One-shot sampling is a lie for conditional tasks.**CFG 스케일, 줄기 트릭, 그리고 다시 샘플링이 필요해

## 사용 하 고

2026년 GAN 스택:

| Situation | Pick |
|-----------|------|
| Photoreal human faces, fixed pose | StyleGAN3 (sharpest, smallest) |
| Anime / stylized faces | StyleGAN-XL or Stable Diffusion LoRA |
| Image-to-image translation | Pix2Pix / CycleGAN (Phase 8 · 04) or ControlNet (Phase 8 · 08) |
| Fast 1-step text-to-image | Adversarial distillation of diffusion (SDXL-Turbo, SD3-Turbo) |
| Perceptual loss inside a diffusion trainer | Small GAN discriminator on image crops |
| Anything multi-modal, open-ended | Don't — use diffusion or flow matching |

GAN는 날카로운 하지만 좁습니다. 일단 도메인이  사진, 임의 텍스트 요청, 비디오  전파로 전환하면, 적대적인 트릭은 독립적인 생성기보다는 구성 요소 (감각 손실, 정유) 로 계속됩니다.

## 선박

저장`outputs/skill-gan-debugger.md`. 스킬은 실패한 GAN 실행 (손실 곡선, 샘플 그리드, 데이터 세트 크) 을 취하고 가능한 원인, 일 줄 수정 및 재 실행 프로토콜의 순위 목록을 출력합니다.

## 운동

1. **Easy.**달아`code/main.py`주식 설정과 함께 설정`D_LR = 5 * G_LR`G의 손실이 얼마나 빨리 상수로 붕괴되는가?
2. **Medium.**Goodfellow BCE 손실을 WGAN 손실로 대체: $\text{loss}_D = \mathbb{E}[D(\text{fake})] - \mathbb{E}[D(\text{real})]$$\text{loss}_G = -\mathbb{E}[D(\text{fake})]$, 그리고 D의 무게를 `[-0.01, 0.01]`훈련이 더 안정적이냐?
3. **Hard.**1D 예제를 2D 데이터로 확장하십시오. 반지에 8개의 가우시안의 혼합물. 생성기가 1k, 5k, 10k 단계에서 얼마나 많은 8개의 모드를 캡처하는지 추적하십시오. 미니배치 차별화를 실행하고 재 측정하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Generator | "G" | Noise-to-sample network, `G: z → x̂`. |
| Discriminator | "D" | Classifier `D: x → [0, 1]`, real vs fake. |
| Minimax | "The game" | $\min_G \max_D$ of a joint objective. |
| Non-saturating loss | "The fix" | Use $-\log D(G(z))$ for G instead of $\log(1 - D(G(z)))$. |
| Mode collapse | "G memorized one thing" | Generator produces few distinct outputs despite diverse data. |
| WGAN | "Wasserstein" | Replace BCE with Earth-Mover distance + gradient penalty; smoother gradient. |
| Spectral norm | "Lipschitz trick" | Constrain D's weight norms to bound its slope; stabilizes training. |
| StyleGAN | "The one that works" | Mapping network + AdaIN; best-in-class for faces, still in 2026. |

## 생산 메모: 단점 추론은 GAN의 지속적인 장점입니다

GAN는 오픈 도메인 생성에서 샘플 품질을 더 이상 이기지 않지만 추론 비용에서 여전히 승리합니다. 생산- 추론 문학 어휘에서 GAN는 다음과 같습니다:

- **No prefill, no decode stages.**단독$G(z)$전진 패스, TTFT ≈ 전체 지연시간
- **No KV-cache pressure.**유일한 상태는 무게입니다. 배트 크기는 캐시가 아닌 활성화 메모리로 제한됩니다.
- **Trivial continuous batching.**모든 요청은 동일한 고정된 FLOPs를 취하기 때문에 서버의 목표 점유율에 있는 정적 패치가 보통 최적입니다. 비행 중에 스케줄러가 필요하지 않습니다.

이 때문에 GAN 디스틸레이션 (SDXL-Turbo, SD3-Turbo, ADD, LCM) 은 2026년 빠른 텍스트-이미지 (Fast Text-to-Image) 를 위한 지배적인 기술이다. 그것은 느린 발전기를 빠른 발전기로 전환하기 위한 훈련 시간 단추로 살아남는 적대적 손실이 남아 있다.

## 더 많은 읽기

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) 원래의 GAN 종이
- [Radford et al. (2015). Unsupervised Representation Learning with DCGAN](https://arxiv.org/abs/1511.06434) 최초의 안정적인 건축물
- [Arjovsky, Chintala, Bottou (2017). Wasserstein GAN](https://arxiv.org/abs/1701.07875) WGAN
- [Miyato et al. (2018). Spectral Normalization for GANs](https://arxiv.org/abs/1802.05957) SN
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) 스타일건2.
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) 스타일건3.
- [Sauer et al. (2023). Adversarial Diffusion Distillation](https://arxiv.org/abs/2311.17042) SDXL-터보
