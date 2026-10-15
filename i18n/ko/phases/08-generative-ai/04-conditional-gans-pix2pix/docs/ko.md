# 조건형 GAN & Pix2Pix

> 2014-2017년 첫 번째 큰 잠금제는 GAN의 생성량을 제어하는 것이었습니다. 레이블이나 이미지 또는 문장을 첨부하십시오. Pix2Pix는 이미지 버전을 만들었습니다. 그리고 여전히 좁은 이미지-이메이크 작업에서 모든 일반 텍스트-이메이크 모델을 이길 수 있습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 03 (GANs), Phase 4 · 06 (U-Net), Phase 3 · 07 (CNNs)
**Time:** ~75 minutes

## 문제

조건 없는 GAN는 임의의 얼굴 샘플을 합니다. 데모에 유용하지만 생산에 유용합니다. 당신은: * 사진으로 스케치를 지도하고,* 항공 사진으로 지도하고*, 낮에서 밤으로 장면을 지도하고,* 회색 화면을 색칠하고.* 이 모든 것에서 입력 이미지가 제공됩니다.$x$그리고 출력해야 합니다$y$어떤 의미적 대응과 함께.$y$이쪽은$x$평균 과잉은 미쉬로 불어넣고 적대적인 패배는 그렇지 않습니다.

조건형 GAN (Mirza & Osindero, 2014) 는 조건이 추가됩니다 $c$두 가지의 입력으로$G$그리고$D$. Pix2Pix (Isola et al., 2017) 는 이것을 전문적으로 설명했습니다. 조건은 전체 입력 이미지, 생성기는 U-Net, 차별기는 * 패치 기반* 분류자 (PatchGAN), 손실은 적대적 + L1. 이 레시피는 2026 년에도 좁은 이미지- 이미지 도메인에서 초음 텍스트- 이미지 모델보다 우수한 성능을 발휘합니다. 왜냐하면 그것은 * 쌍 데이터*에 훈련되어 있기 때문에

## 개념

![Pix2Pix: U-Net generator, PatchGAN discriminator](../assets/pix2pix.svg)

**Conditional G.** $G(x, z) \to y$. 픽스2픽스에서$z$G 내부에서 dropout (입입음음  고립된 명시적인 소음은 무시되었습니다)

**Conditional D.** $D(x, y) \to [0, 1]$. 입력은 *쌍* (조건, 출력) 이다. 이것은 주요 차이점입니다.$y$$x$, 단지$y$진짜로 보여요

**U-Net generator.**목을 가로지르는 점프 연결을 가진 앵코더-독호기. 입력 및 출력 구조가 낮은 수준 (엣지, 실루엣) 을 공유하는 작업에 중요합니다. 점프 없이, 높은 주파수 세부 사항은 사라집니다.

**PatchGAN discriminator.**D는 하나의 실제/거짓 점수를 출력하기 보다는 $N \times N$각 세포가 70x70 픽셀의 수용적 필드를 판단하는 그리드. 평균. 이것은 마르코프의 무작위 필드 가설입니다. 현실주의는 로컬입니다. 훈련이 훨씬 더 빠르며, 매개 변수도 적어지고, 더 날카로운 출력도 있습니다.

**Loss.**

```math
\begin{aligned}
\text{loss}_G &= -\log D(x, G(x)) + \lambda \cdot \lVert y - G(x) \rVert_1 \\
\text{loss}_D &= -\log D(x, y) - \log(1 - D(x, G(x)))
\end{aligned}
```

L1 용어는 훈련을 안정시키고 알려진 목표 방향으로 G를 밀어 넣습니다. L1는 L2보다 날카로운 가장자리를 제공합니다 (중간, 중간이 아닙니다).$\lambda = 100$이 방법은 Pix2Pix의 기본 방식이었습니다.

## 사이클가 쌍이 없는 경우

픽스2픽스 짝이 필요$(x, y)$데이터. 사이클가안 (Zhu et al., 2017) 은 이 요구 사항을 추가 손실의 비용으로 떨어뜨립니다. * 사이클 일관성 손실. 두 개의 생성기 $G: X \to Y$그리고$F: Y \to X$- 훈련시켜$F(G(x)) \approx x$그리고$G(F(y)) \approx y$이것은 당신이 말을 제브라로, 여름을 겨울으로 변환 할 수 있도록 합니다.

2026년, 부쌍화되지 않은 이미지-이메이크는 CycleGAN보다는 전파 (ControlNet, IP-Adapter) 를 통해 이루어집니다. 하지만, 주행-관성 아이디어는 거의 모든 부쌍화되지 않은 도메인 적응 논문에서 살아남습니다.

```figure
gx-patchgan
```

## 건설 해

`code/main.py`1D 데이터에 작은 조건적인 GAN를 구현합니다.$c$클래스 레이블 (0 또는 1) 과제는: 주어진 클래스에 대한 조건부 분포에서 샘플을 생성합니다.

### 단계 1: G 및 D 입력 모두에 조건을 추가

```python
def G(z, c, params):
    return mlp(concat([z, one_hot(c)]), params)

def D(x, c, params):
    return mlp(concat([x, one_hot(c)]), params)
```

일방향 코딩은 가장 간단한 방법입니다. 더 큰 모델은 학습된 임베디션, FiLM 모듈링 또는 크로스-아테네이션을 사용합니다.

### 단계 2: 조건부 열차

```python
for step in range(steps):
    x, c = sample_real_conditional()
    noise = sample_noise()
    update_D(x_real=x, x_fake=G(noise, c), c=c)
    update_G(noise, c)
```

생성기는 주어진 조건에 대한 실제 분포 *와 일치해야 하며, 소위 분포가 아닌

### 단계 3: 클래스별 출력을 확인

```python
for c in [0, 1]:
    samples = [G(noise, c) for noise in batch]
    mean_c = mean(samples)
    assert_near(mean_c, real_mean_for_class_c)
```

## 함정

- **Condition ignored.**G는 소외되는 것을 배우지만, D는 조건 신호가 약한 것이기 때문에 결코 처벌하지 않습니다. 수정: 조건 D는 더 공격적으로 (초층, 늦은 것뿐만 아니라) 투명 차별기를 사용하십시오 (Miyato & Koyama 2018).
- **L1 weight too low.**G는 임의의 실제 출력으로 변동하고, 충실한 출력으로 변동하지 않습니다. 시작 $\lambda \approx 100$Pix2Pix 방식의 작업에
- **L1 weight too high.**G는 L1가 여전히 $L_p$훈련이 안정되면 안날을 내려놓습니다.
- **Ground-truth leakage in D.**콘카테네이트$(x, y)$D 입력으로, 뿐만 아니라$y$이 D가 없으면 일관성을 확인할 수 없습니다.
- **Mode collapse per class.**각 클래스는 독립적으로 붕괴될 수 있습니다. 클래스 조건의 다양성 검사를 실행하십시오.

## 사용 하 고

2026 이미지-상태 작업 상태:

| Task | Best approach |
|------|---------------|
| Sketch → photo, same domain, paired data | Pix2Pix / Pix2PixHD (still fast, still sharp) |
| Sketch → photo, unpaired | ControlNet with a Scribble conditioning model |
| Semantic seg → photo | SPADE / GauGAN2 or SD + ControlNet-Seg |
| Style transfer | Diffusion with IP-Adapter or LoRA; GAN methods are legacy |
| Depth → photo | ControlNet-Depth over Stable Diffusion |
| Super-resolution | Real-ESRGAN (GAN), ESRGAN-Plus, or SD-Upscale (diffusion) |
| Colorization | ColTran, diffusion-based colorizers, or Pix2Pix-color |
| Daytime → nighttime, seasons, weather | CycleGAN or ControlNet-based |

Pix2Pix는 (a) 수천 개의 쌍용 사례가 있을 때, (b) 작업이 좁고 반복 가능하며, (c) 빠른 추론이 필요할 때 올바른 도구로 남아 있습니다. 일반 오픈 도메인 작업에서는 확산이 승리합니다.

## 선박

저장`outputs/skill-img2img-chooser.md`. 스킬은 작업 설명, 데이터 사용 가능성 (쌍형과 부쌍형, N 샘플) 및 지연/품질 예산을 취하고, 다음으로 출력: 접근 방식 (Pix2Pix, CycleGAN, ControlNet 변종, SDXL + IP-Adapter), 훈련 데이터 요구 사항, 추론 비용 및 평가 프로토콜 (LPIPS, FID, 작업별).

## 운동

1. **Easy.**수정`code/main.py`G가 각 클래스의 소음을 올바른 모드로 매핑하는 것을 확인합니다.
2. **Medium.**L1를 1D 설정에서 인식형 손실로 대체하십시오 (예를 들어, 특징 추출자로 작용하는 작은 얼린 D). 조건부 분포의 날카롭게 변경합니까?
3. **Hard.**1D 설정에서 CycleGAN을 스케치하십시오: 두 분포, 두 생성기, 주행 손실.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Conditional GAN | "GAN with labels" | G(z, c), D(x, c). Both networks see the condition. |
| Pix2Pix | "Image-to-image GAN" | Paired cGAN with U-Net G and PatchGAN D + L1 loss. |
| U-Net | "Encoder-decoder with skips" | Symmetric conv network; skips preserve high-freq. |
| PatchGAN | "Local-realism classifier" | D outputs per-patch score instead of global score. |
| CycleGAN | "Unpaired image translation" | Two G's + cycle-consistency loss; no paired data. |
| SPADE | "GauGAN" | Normalizes intermediate activations with the semantic map; segmentation-to-image. |
| FiLM | "Feature-wise linear modulation" | Per-feature affine transform from the condition; cheap conditioning. |

## 제작 메모: 지연 제한 기준으로 Pix2Pix

데이터와 좁은 작업 (sketch → render, semantic map → photo, day → night) 을 결합하면, Pix2Pix의 한 샷 추론은 지연도에 대한 광량 순서로 전파를 이겨내게 된다. 생산 비교는 일반적으로:

| Path | Steps | Typical latency at 512² on a single L4 |
|------|-------|----------------------------------------|
| Pix2Pix (U-Net forward) | 1 | ~30 ms |
| SD-Inpaint or SD-Img2Img | 20 | ~1.2 s |
| SDXL-Turbo Img2Img | 1-4 | ~0.15-0.35 s |
| ControlNet + SDXL base | 20-30 | ~3-5 s |

Pix2Pix는 정적 패치에서 처리량을 이기며 (모든 요청은 동일한 FLOPs입니다). 디스포이션은 품질과 일반화에 승리합니다. 현대 플레이는 좁은 작업에 대해 Pix2Pix 스타일의 정제 모델을 배포하고 꼬리 입력에 대한 디스포이션 하락을 배포하는 것입니다.

## 더 많은 읽기

- [Mirza & Osindero (2014). Conditional Generative Adversarial Nets](https://arxiv.org/abs/1411.1784) cGAN 서류
- [Isola et al. (2017). Image-to-Image Translation with Conditional Adversarial Networks](https://arxiv.org/abs/1611.07004) 픽스2픽스
- [Zhu et al. (2017). Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks](https://arxiv.org/abs/1703.10593) 사이클리건
- [Wang et al. (2018). High-Resolution Image Synthesis with Conditional GANs](https://arxiv.org/abs/1711.11585)   
- [Park et al. (2019). Semantic Image Synthesis with Spatially-Adaptive Normalization](https://arxiv.org/abs/1903.07291) SPADE / GauGAN
- [Miyato & Koyama (2018). cGANs with Projection Discriminator](https://arxiv.org/abs/1802.05637) 투사 D
