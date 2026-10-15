# 잠잠한 퍼포먼스 & 안정적인 퍼포먼스

> 512×512 이미지에서 픽셀 공간 전파는 컴퓨팅 전쟁 범죄이다. Rombach et al. (2022) 는 이미지를 생성하기 위해 모든 786k 차원이 필요하지 않다는 것을 알아냈습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 02 (VAE), Phase 8 · 06 (DDPM), Phase 7 · 09 (ViT)
**Time:** ~75 minutes

## 문제

5122에서 픽셀 공간 전파는 U-넷이 모양의 텐서에서 실행된다는 것을 의미합니다`[B, 3, 512, 512]`. 샘플링 단계마다 500M파램 U-넷에 ~100GFLOPS입니다. 50 단계는 5 TFLOPS입니다. 한 억 이미지를 열고 계산 청구서는 말도 안 됩니다.

대부분의 FLOP는 에 의해 압축될 수 있는 고 주파수 텍스처를 통해 인식적으로 중요하지 않은 세부 사항을 밀어 넣습니다. 로mbach의 아이디어는: VAE를 한 번 훈련 (제1 단계*), 그것을 얼어붙이고, 4 채널 64×64 잠자리 공간 (제2 단계*) 에서 완전히 전파를 실행합니다. 동일한 U-Net. 1/16 픽셀. ~ 비교적 품질을 위해 64x FLOP 더 적은.

이것은 안정적인 전파 레시피입니다. SD 1.x / 2.x는 860M U-Net를 사용했습니다.`64×64×4`잠복한 경우 SDXL는 2.6B U-Net를 사용했습니다`128×128×4`, SD3는 유출 변조 (DiT) 를 유출 변조 (Flux.1-dev) 로 교환했다.

## 개념

![Latent diffusion: VAE compression + diffusion in latent space](../assets/latent-diffusion.svg)

**Two stages, separately trained.**

1. **Stage 1 — VAE.**                                                $E(x) \to z$, 디코더$D(z) \to x$. 목표 압축: 각 공간 축의 아래 샘플 8 × + 채널을 조정하여 전체 잠실 크기는 픽셀 수의 1/16 째로 됩니다. 손실 = 재구성 (L1 + LPIPS 인식) + KL (소형 무게)$z$가우시안이 너무 강제로 하지 않습니다. 왜냐하면 우리는 정확한 샘플링이 필요하지 않기 때문입니다.$z$) 종종 적대적 패배로 훈련되어서

2. **Stage 2 — diffusion on $z$.**치료$z = E(x_{\text{real}})$데이터로 U-Net (또는 DiT) 를 훈련시켜$z_t$. 결론: 샘플$z_0$전파를 통해$x = D(z_0)$- 그래

**Text conditioning.**추가적인 두 구성 요소: 얼어붙은 텍스트 코더 (SD 1.x에 대한 CLIP-L, SD 2/XL에 대한 CLIP-L+OpenCLIP-G, SD3에 대한 T5-XXL 및 플루크스)`[Q = image features, K = V = text tokens]`이 지표는 텍스트가 이미지에 영향을 미치는 유일한 방법입니다.

**The loss function is identical to Lesson 06.**같은 DDPM / 흐름 소음에 MSE 일치합니다. 당신은 단지 데이터 도메인을 교환합니다.

## 건축의 변형

| Model | Year | Backbone | Latent shape | Text encoder | Params |
|-------|------|----------|--------------|--------------|--------|
| SD 1.5 | 2022 | U-Net | 64×64×4 | CLIP-L (77 tokens) | 860M |
| SD 2.1 | 2022 | U-Net | 64×64×4 | OpenCLIP-H | 865M |
| SDXL | 2023 | U-Net + refiner | 128×128×4 | CLIP-L + OpenCLIP-G | 2.6B + 6.6B |
| SDXL-Turbo | 2023 | Distilled | 128×128×4 | same | 1-4 step sampling |
| SD3 | 2024 | MMDiT (multimodal DiT) | 128×128×16 | T5-XXL + CLIP-L + CLIP-G | 2B / 8B |
| Flux.1-dev | 2024 | MMDiT | 128×128×16 | T5-XXL + CLIP-L | 12B |
| Flux.1-schnell | 2024 | MMDiT distilled | 128×128×16 | T5-XXL + CLIP-L | 12B, 1-4 step |

트렌드는 U-Net을 DiT (실동 패치의 트랜스포머) 로 대체하고, 텍스트 코더를 확장 (T5는 신속한 준수에 CLIP를 능가한다), 잠복 채널을 증가시키는 것입니다 (4 → 16는 더 많은 세부적인 헤드룸을 제공합니다).

```figure
noise-schedule
```

## 건설 해

`code/main.py`DDPM 위에 DDPM의 06-D "VAE" (인증 코더 + 디코더, 시범을 위해; 실제 VAE는 conv 네트워크) 를 쌓아, 분류자 없는 가이드와 클래스 컨디션을 추가합니다. 그것은 같은 전파 손실이 원료 1-D 값이나 코딩된 값에서 작동하는지 보여줍니다.

### 단계 1: 코더/ 디코더

```python
def encode(x):    return x * 0.5          # toy "compression" to smaller scale
def decode(z):    return z * 2.0
```

실제 VAE는 훈련된 무게를 가지고 있습니다. 교육학에 있어서, 이 선형 지도는 전파가 작동하는 것을 보여주기 위해 충분합니다.$z$원래 데이터 공간에 신경 쓰지 않고

### 2단계: `z`- 공간

06. 강의와 같은 DDPM. 인터넷에서 볼 수 있는 데이터는$z = E(x)$샘플링 후$z_0$, $D(z_0)$- 그래

### 단계 3: 분류자 없는 안내

훈련 중에 10% 의 경우 클래스 라벨을 내려 놓으십시오 (무정표로 교체하십시오). 결론을 내린 다음 두 가지를 모두 계산하십시오 $\epsilon_{\text{cond}}$그리고$\epsilon_{\text{uncond}}$, 그러면:

```python
eps_cfg = (1 + w) * eps_cond - w * eps_uncond
```

$w = 0$= 안내가 없습니다 (완전한 다양성),$w = 3$= 기본$w = 7+$= 포화/너무 날카로운

### 단계 4: 텍스트 컨디션 (콘셉, 코드 아닌)

클래스 레이블을 얼어붙은 텍스트 코더 출력으로 교체합니다. U-Net에 임베디드 된 텍스트를 가로 주의를 통해 공급합니다.

```python
h = h + CrossAttention(Q=h, K=text_embed, V=text_embed)
```

이것은 클래스 조건형 디프루전 모델과 안정적인 디프루전 사이의 유일한 실질적인 차이입니다.

## 함정

- **VAE-scale mismatch.**SD 1.x VAEs는 스케일링 일정 (`scaling_factor ≈ 0.18215`이 모든 점검점들은 하나씩을 배포합니다.
- **Text encoder silently wrong.**SD3는 T5-XXL를 필요로 합니다. T5-XXL은 128개의 토큰이 필요하고, CLIP만으로 돌아가는 것은 손실이 있습니다. 항상 확인하세요.`use_t5=True`또는 빠른 충실한 크레이터.
- **Mixing latent spaces.**SDXL, SD3, Flux 모두 다른 VAEs를 사용합니다. SDXL 잠복판에 훈련된 LoRA는 SD3에서 작동하지 않습니다. Hugging Face 디프셔 0.30+는 부합된 체크포인트를 로드하는 것을 거부합니다.
- **CFG too high.** `w > 10`포화하고 기름진 이미지를 생산하고 다양성의 비용으로 초과에 적합합니다.`w = 3-7`- 그래
- **Negative prompts leaking.**빈 음의 명령어는 무효 표본이 됩니다. 채우면 음의 명령어는 $\epsilon_{\text{uncond}}$이 파이프라인들은 동일하지 않습니다. 일부 파이프라인들은 침묵으로 null로 기본값을 설정합니다.

## 사용 하 고

2026년 생산 스테이크:

| Target | Recommended backbone |
|--------|----------------------|
| Narrow domain, paired data, training a model from scratch | SDXL fine-tune (LoRA / full) — fastest to ship |
| Open-domain text-to-image, open weights | Flux.1-dev (12B, Apache / non-commercial) or SD3.5-Large |
| Fastest inference, open weights | Flux.1-schnell (1-4 step, Apache) or SDXL-Lightning |
| Best prompt adherence, hosted | GPT-Image / DALL-E 3 (still), Midjourney v7, Imagen 4 |
| Edit workflows | Flux.1-Kontext (Dec 2024) — natively accepts image + text |
| Research, baseline | SD 1.5 — ancient but well-studied |

## 선박

저장`outputs/skill-sd-prompter.md`. 스킬은 텍스트 프롬프트 + 목표 스타일 및 출력을 가져옵니다: 모델 + 체크포인트, CFG 스케일, 샘플러, 부정적인 프롬프트, 해상도, 선택적 컨트롤넷/IP-Adapter 조합 및 단계별 QA 체크리스트.

## 운동

1. **Easy.**달아`code/main.py`안내를 받으며$w \in \lbrace 0, 1, 3, 7, 15 \rbrace$. 클래스별 평균 샘플을 기록하세요.$w$클래스 매개 변수는 실제 데이터 매개 변수를 넘어설 수 있을까요?
2. **Medium.**장난감 선형 코더를 재구성 손실로 TANH-MLP 코더/독호더 쌍으로 교환합니다. 새로운 잠복판에 전파를 다시 훈련합니다. 샘플 품질이 변합니까?
3. **Hard.**디퍼시저로 실제 안정적인 디퍼시전 추론을 설정: 로드 `sdxl-base`CFG=7로 30개의 Euler 단계를 실행해`sdxl-turbo`4 단계와 CFG=0. 같은 주제, 다른 품질  변경된 것을 설명하고 왜.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| First stage | "The VAE" | Trained encoder/decoder pair; compresses 512² to 64². |
| Second stage | "The U-Net" | Diffusion model over the latent space. |
| CFG | "Guidance scale" | $(1+w) \cdot \epsilon_{\text{cond}} - w \cdot \epsilon_{\text{uncond}}$; tunes conditioning strength. |
| Null token | "Empty prompt embed" | Unconditional embed used for $\epsilon_{\text{uncond}}$. |
| Cross-attention | "How text gets in" | Each U-Net block attends to text tokens as K and V. |
| DiT | "Diffusion Transformer" | Replace U-Net with a transformer over latent patches; scales better. |
| MMDiT | "Multi-modal DiT" | SD3's architecture: text and image streams with joint attention. |
| VAE scaling factor | "Magic number" | Divides latents by ~5.4 so diffusion operates in unit-variance space. |

## 생산 메모: 8GB 소비자 GPU에 Flux-12B를 실행

참고 플루크스 통합은 가전형 GPU를 가지고 있는데, 이것을 배송할 수 있나요?

1. **Staggered loading.**플루크스는 VRAM에서 결코 공존할 필요가 없는 세 개의 네트워크를 가지고 있습니다. T5-XXL 텍스트 코더 (fp32에서 ~ 10 GB), CLIP-L (소형), 12B MMDiT, VAE. 먼저 프롬프트를 코딩, * 삭제* 인코더를 로드, 디테오, * 삭제* 디테오, VAE를 로드, 디코딩. 소비자 8GB GPU는 한 번에 한 단계만 적합합니다.
2. **4-bit quantization via bitsandbytes.** `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)`T5 코더와 DiT 모두에서 메모리 8x를 절감하여, Aritra의 기준에 따라 텍스트에서 이미지로 품질 감소는 눈에 띄지 않습니다 (노트북에 링크되어 있습니다).
3. **CPU offload.** `pipe.enable_model_cpu_offload()`CPU와 GPU 사이의 모듈을 자동으로 교환합니다. 각각의 전진이 진행되면서 10-20%의 지연 시간을 추가하지만 파이프라인을 실행하게 합니다.

메모리 회계:`10 GB T5 / 8 = 1.25 GB`양자화`12 B params × 0.5 bytes = ~6 GB`양자화된 DiT, 더 활성화. stas00의 용어에서 이것은 TP=1 추론의 극단적인 끝입니다.  모델 병렬성이 없습니다. 최대 양자화입니다. 생산을 위해 당신은 H100에서 TP=2 또는 TP=4를 실행할 것입니다. 단일 개발 노트북에 대해, 이것은 레시피입니다.

## 더 많은 읽기

- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) 안정적인 분포
- [Podell et al. (2023). SDXL: Improving Latent Diffusion Models for High-Resolution Image Synthesis](https://arxiv.org/abs/2307.01952) SDXL
- [Peebles & Xie (2023). Scalable Diffusion Models with Transformers (DiT)](https://arxiv.org/abs/2212.09748) 
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, MMDiT
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) CFG
- [Labs (2024). Flux.1 — Black Forest Labs announcement](https://blackforestlabs.ai/announcing-black-forest-labs/) 플루크스 1 가족
- [Hugging Face Diffusers docs](https://huggingface.co/docs/diffusers/index) 위의 모든 체크포인트에 대한 참조 구현.
