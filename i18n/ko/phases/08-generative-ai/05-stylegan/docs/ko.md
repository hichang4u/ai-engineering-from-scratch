# 스타일건

> 대부분의 발전기는 움직인다$z$모든 층에 동시에 나뉘어$z$중간 $w$, 그리고 * 주입 *$w$이 단 하나의 변화는 잠그어진 공간을 해제하고 사진현실적인 얼굴들을 7년 연속 해결된 문제로 만들었습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 03 (GANs), Phase 4 · 08 (Normalization), Phase 3 · 07 (CNNs)
**Time:** ~45 minutes

## 문제

DCGAN 지도$z$이 문제를 해결하기 위해서는$z$모든 것을 제어합니다.  자세, 조명, 정체성, 배경$z$모델에 " 같은 사람, 다른 자세"를 물어볼 수는 없습니다. 왜냐하면 표현은 그런 식으로 요소를 고려하지 않기 때문입니다.

카라스等人 (2019, NVIDIA) 의 제안: 먹이를 중단하십시오 $z$바로 컨브 레이어로 들어가`4×4×512`8층 MLP를 학습하여 지도를 만듭니다$z \in Z \to w \in W$. 주입$w$* 적응 인스턴스 정상화* (AdaIN) 를 통해 각 해상도에서: 각 conv 특징 지도를 정상화하고,$w$. 스토카스틱 세부 사항 (피의 구멍, 털줄) 을 위해 각 층별로 소음을 추가한다.

그 결과:$W$"고등급 스타일" (포지, 아이덴티티) 와 "미미한 스타일" (빛, 색) 을 나타내는 대략 정렬 축을 가지고 있습니다. A 이미지를 사용하여 두 이미지 사이에 스타일을 교환할 수 있습니다.$w$저 해상도 레벨과 B 이미지 $w$이 공개된 편집, 범주 간 스타일리징, 그리고 전체 "스타일건-반전" 연구 라인

## 개념

![StyleGAN: mapping network + AdaIN + per-layer noise](../assets/stylegan.svg)

**Mapping network.** $f: Z \to W$8층 MLP$Z = \mathcal{N}(0, I)^{512}$-$W$가우스주의자가 될 수 밖에 없습니다.

**Synthesis network.**학습된 상수에서 시작됩니다`4×4×512`. 각 해상도 블록: `upsample → conv → AdaIN(w_i) → noise → conv → AdaIN(w_i) → noise`. 결의안 두 번: 4, 8, 16, 32, 64, 128, 256, 512, 1024

**AdaIN.**

```math
\mathop{\mathrm{AdaIN}}(x, y) = y_{\text{scale}} \cdot \frac{x - \mathop{\mathrm{mean}}(x)}{\mathop{\mathrm{std}}(x)} + y_{\text{bias}}
```

어디$y_{\text{scale}}$그리고$y_{\text{bias}}$$w$. 특징 지도에 따라 정상화하고 다시 스타일링합니다. "스타일"은 특징 지도의 1위와 2위 통계입니다.

**Per-layer noise.**단일 채널 가우스 잡음이 각 기능 지도에 추가되어, 학습된 채널 단위 계기로 확장됩니다. 글로벌 구조에 영향을 미치지 않고 스토카스틱 세부 사항을 제어합니다.

**Truncation trick.**결론에 따르면, 샘플$z$, 계산$w = \text{mapping}(z)$그럼$w' = \hat{w} + \psi \cdot (w - \hat{w})$어디$\hat{w}$평균입니다$w$많은 샘플을 통해$\psi < 1$거의 모든 StyleGAN 데모가 사용한다$\psi \approx 0.7$- 그래

## 스타일건 1 → 2 → 3

| Version | Year | Innovation |
|---------|------|------------|
| StyleGAN | 2019 | Mapping network + AdaIN + noise + progressive growing. |
| StyleGAN2 | 2020 | Weight demodulation replaces AdaIN (fixes droplet artifacts); skip/residual architecture; path-length regularization. |
| StyleGAN3 | 2021 | Alias-free convolution + equivariant kernels; eliminates texture sticking to pixel grid. |
| StyleGAN-XL | 2022 | Class-conditional, 1024², ImageNet. |
| R3GAN | 2024 | Rebrands with stronger reg; closes gap to diffusion on FFHQ-1024 with 20x fewer params. |

2026년 StyleGAN3은 (a) 높은 FPS에서 좁은 도메인 사진현실주의, (b) 몇 번의 도메인 적응 (100 이미지와 새로운 데이터 세트에 대한 열차, 얼어붙는 지도) (c) 역향 기반 편집 (이 을 찾아보기) 의 기본값으로 남아 있습니다.$w$실제 사진을 재조성하고 편집합니다.$w$). 오픈 도메인 텍스트-이미지에서는  전파의 도구가 아닙니다.

```figure
gx-stylegan-mapping
```

## 건설 해

`code/main.py`1D에서 장난감 "스타일-GAN 라이트"를 구현합니다: 지도 MLP, 학습된 상수 벡터를 가져다가 $w$-차원/ 편향 및 각층별의 소음$w$아핀 모뮬레이션 매치나 맥이    $z$자전기의 입력으로

### 단계 1: 지도 네트워크

```python
def mapping(z, M):
    h = z
    for i in range(num_layers):
        h = leaky_relu(add(matmul(M[f"W{i}"], h), M[f"b{i}"]))
    return h
```

### 단계 2: 적응 인스턴스 정상화

```python
def adain(x, w_scale, w_bias):
    mu = mean(x)
    sd = std(x)
    x_norm = [(xi - mu) / (sd + 1e-8) for xi in x]
    return [w_scale * xi + w_bias for xi in x_norm]
```

성능 지도 규모와 편향은 $w$선형 투명으로

### 단계 3: 각층별의 소음

```python
def add_noise(x, sigma, rng):
    return [xi + sigma * rng.gauss(0, 1) for xi in x]
```

시그마 채널은 학습가능합니다.

## 함정

- **Droplet artifacts.**스타일건 1은 아다인 (AdaIN) 가 평균을 제소했기 때문에 기능 지도에서    을 생성했습니다. 스타일건 2의 무게 비조정은 convolution 무게를 확장하여 수정합니다.
- **Texture sticking.**StyleGAN 1 및 2 텍스처는 피클스 좌표, 객체 좌표가 아닌 (중극을 할 때 가시) 를 따라가며 StyleGAN 3의 별명 없는 회전들은 윈도우화된 sinc 필터로 이것을 수정한다.
- **Mode coverage.**줄기 `ψ < 0.7`깨끗해 보이지만 좁은 코너의 샘플을 사용한다`ψ = 1.0`다양성이 필요하다면
- **Inversion is lossy.**실제 사진을 $W$일반적으로 최적화 또는 코더 (e4e, ReStyle, HyperStyle) 를 통해 수행됩니다.

## 사용 하 고

| Use case | Approach |
|----------|----------|
| Photoreal human faces (anime, product, narrow) | StyleGAN3 FFHQ / custom fine-tune |
| Face editing from a photo | e4e inversion + StyleSpace / InterFaceGAN directions |
| Face swap / reenactment | StyleGAN + encoder + blending |
| Avatar pipelines | StyleGAN3 w/ ADA for low-data fine-tune |
| Domain adaptation from a few images | Freeze mapping network, fine-tune synthesis |
| Multi-modal or text-conditioned generation | Don't — use diffusion |

"사람의 얼굴의 사진"이라는 답이 있는 제품급 디모를 위해, StyleGAN는 추론 비용 (일방향 패스, <10ms 4090) 과 같은 품질 바에 대한 날카로운 확산을 이긴다.

## 선박

저장`outputs/skill-stylegan-inversion.md`. 스킬은 실제 사진을 찍고 출력: 반전 방법 (e4e / ReStyle / HyperStyle), 예상된 잠실 손실, 편집 예산 (무엇까지 $W$유물보다 먼저 이동할 수 있습니다) 그리고 잘 알려진 편집 방향 (령, 표현, 자세)

## 운동

1. **Easy.**달아`code/main.py``adain_on=True`그리고`adain_on=False`고정된 잠자리나 혼란스러운 잠자리 사이의 출력 확산을 비교하십시오.
2. **Medium.**혼합 정규화를 실시: 훈련 배트에서 계산 $w_a$$w_b$, 그리고 적용$w_a$합성 후 1반기$w_b$디코더가 다른 스타일들을 배울 수 있을까요?
3. **Hard.**미리 훈련된 StyleGAN3 FFHQ 모델을 (ffhq-1024.pkl)$w$표기된 샘플에 SVM를 훈련시켜 "스미를" 제어하는 방향; 정체성 도류 전에 얼마나 멀리 갈 수 있는지 보고하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Mapping network | "The MLP" | $f: Z \to W$, 8 layers, decouples latent geometry from data statistics. |
| W space | "The style space" | Output of the mapping network; roughly disentangled. |
| AdaIN | "Adaptive instance norm" | Normalize feature map, then scale + shift by $w$-projection. |
| Truncation trick | "Psi" | $w = \text{mean} + \psi \cdot (w - \text{mean})$, $\psi<1$ trades diversity for quality. |
| Path-length regularization | "PL reg" | Penalizes large changes in image per unit change in $w$; makes $W$ smoother. |
| Weight demodulation | "The StyleGAN2 fix" | Normalize conv weights instead of activations; kills droplet artifacts. |
| Alias-free | "StyleGAN3's trick" | Windowed sinc filters; eliminates texture sticking to the pixel grid. |
| Inversion | "Find w for a real image" | Optimize or encode $x \to w$ so $G(w) \approx x$. |

## 제작 메모: 왜 스틸건이 2026년에 여전히 선박되는지

4090에 있는 StyleGAN3는 10 ms 未満의 시간 내에 10242 FFHQ의 얼굴을 생성합니다.`num_steps = 1`, VAE 디코딩, 크로스-아트런스 패스 없습니다. 생산 용어에서 이것은 모든 이미지 생성기의 바닥 지연입니다. 같은 해상도의 50 단계 SDXL + VAE 디코딩 파이프라인은 ~ 3 초입니다.**300× gap**, 그리고 좁은 영역의 제품 (아바타 서비스, ID 문서 파이프라인, 주식 얼굴 생성) 에 대해서는 TCO에서 승리합니다.

두 가지 운영적 결과:

- **No scheduler, no batcher.**목표 점유율에서 정적 배치는 최적입니다. 연속 배팅 (LLM 및 전파에 필수적인) 은 모든 요청이 동일한 FLOP를 취하기 때문에 아무런 이익을 제공하지 않습니다.
- **Truncation `ψ` is the safety knob.** `ψ < 0.7`지도 네트워크의 범위의 좁은 코너에서 샘플을 가져온 것은 서비스 레이어의 샘플 변이를 통해 유일한 레버입니다.`ψ`최고 로드에서 프리미엄 사용자들을 위해 높여주십시오.

## 더 많은 읽기

- [Karras et al. (2019). A Style-Based Generator Architecture for GANs](https://arxiv.org/abs/1812.04948) 스타일건
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) 스타일건2.
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) 스타일건3.
- [Tov et al. (2021). Designing an Encoder for StyleGAN Image Manipulation](https://arxiv.org/abs/2102.02766) e4e 역전
- [Sauer et al. (2022). StyleGAN-XL: Scaling StyleGAN to Large Diverse Datasets](https://arxiv.org/abs/2202.00273) 스타일건-XL
- [Huang et al. (2024). R3GAN: The GAN is dead; long live the GAN!](https://arxiv.org/abs/2501.05441) 현대적인 최소 GAN 레시피
