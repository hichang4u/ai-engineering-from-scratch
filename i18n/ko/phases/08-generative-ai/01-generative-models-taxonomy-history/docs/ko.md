# 생성 모델  분류학 & 역사

> 모든 이미지 모델, 텍스트 모델, 비디오 모델, 3D 모델은 다섯 개의 桶 중 하나에 들어갑니다. 잘못된 桶을 선택하면 몇 주 동안 수학을 싸울 것입니다. 올바른 템을 선택하면 그 분야의 마지막 12 년의 발전이 머릿속에 깔끔하게 쌓이게됩니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 2 (ML Fundamentals), Phase 3 (Deep Learning Core), Phase 7 · 14 (Transformers)
**Time:** ~45 minutes

## 문제

생성 모델은 하나의 일을 합니다.$p_{\text{data}}(x)$얼굴, 문장, MIDI 파일, 단백질 구조, 모두 같은 문제입니다.

은 건$p_{\text{data}}$수백만 개의 차원의 공간에 살고 있습니다 (512x512 RGB 이미지는 ~786k 차원입니다), 샘플은 그 공간 내부의 얇은 다중 위에 앉아 있으며, 당신은 단지 10M 예를 가지고 있습니다.

지난 12 년 동안 5 가구가 살아남았습니다. 각 가구가 어떤 타협을 하는지를 아는 것 은 어떤 과제 에서 승리 하고 다른 과제 에서 붕괴 되는 이유 를 알려 줍니다.

## 개념

![Five families of generative models — taxonomy by what they model](../assets/taxonomy.svg)

**1. Explicit density, tractable.**글쓰기$\log p(x)$실제로 평가할 수 있는 수 있는 수요로 Autoregressive 모델 (PixelCNN, WaveNet, GPT) 가$p(x) = \prod_i p(x_i \mid x_{<i})$. 정상화 흐름 (RealNVP, Glow) 구축$p(x)$간단한 기초의 역전환으로. 프로: 정확한 확률, 깨끗한 훈련 손실. 컨: 자율 퇴행 추론은 순서 (장 긴 순서에서 느린), 흐름은 역전환 구조가 필요합니다 (건축적으로 제한적).

**2. Explicit density, approximate.**  묶여$\log p(x)$아래에서 (ELBO) 를 사용하여 경계선을 최적화합니다. VAE (Kingma 2013) 는 변수 후추를 가진 엔코더-독호를 사용합니다. 디푸지언 모델 (DDPM, Ho 2020) 는 가중 ELBO를 간결적으로 최적화하는 디노이저를 훈련합니다. 디푸지언은 2026 년 지배적인 이미지, 비디오 및 3D 척추입니다.

**3. Implicit density.**밀도를 완전히 건너뛰고, 발전기를 배우십시오.$G(z)$샘플을 생산하고 차별을 하는$D(x)$GAN (Goodfellow 2014). 추론에 빠르다 (앞으로 한 패스) 하지만 훈련 중에 불균형하다. StyleGAN 1/2/3는 2026 년에도 고정 도메인 사진현실 (면, 침실) 에 최첨단 상태로 남아 있습니다.

**4. Score-based / continuous-time.**로그밀도의 기하급수를 알아보세요$\nabla_x \log p(x)$(점수) 직접. Song & Ermon (2019) 은 점수 일치가 SDE에 전파를 일반화한다는 것을 보여주었습니다. 흐름 일치 (Lipman 2023) 는 2024-2026의 열성입니다. 시뮬레이션 무료 훈련, 직선 경로, DDPM보다 4-10배 더 빠른 샘플링. 안정적인 디푸지션 3, 플럭스, 오디오크래프트 2 모두 흐름 일치를 사용합니다.

**5. Token-based autoregressive over discrete codes.**VQ-VAE 또는 잔여 양자화기로 고-디밍 데이터를 단기 단위 토큰 순서로 압축하고, 트랜스포머를 사용하여 토큰 순서를 모델링합니다. Parti, MuseNet, AudioLM, VALL-E, Sora의 패치 토큰이저는 모두 이것을 사용합니다. 이것은 버킷 1 + 학습된 토큰이입니다.

## 짧은 역사

| Year | Model | Why it mattered |
|------|-------|-----------------|
| 2013 | VAE (Kingma) | First deep generative model with a usable training loss. |
| 2014 | GAN (Goodfellow) | Implicit density, no likelihood — shockingly sharp samples. |
| 2015 | DRAW, PixelCNN | Sequential image generation. |
| 2017 | Glow, RealNVP | Invertible flows; exact likelihood with depth. |
| 2017 | Progressive GAN | First megapixel faces. |
| 2019 | StyleGAN / StyleGAN2 | Photorealistic faces still hard to beat for that one domain. |
| 2020 | DDPM (Ho) | Diffusion becomes practical. |
| 2021 | CLIP, DALL-E 1, VQGAN | Text-to-image goes mainstream. |
| 2022 | Imagen, Stable Diffusion 1, DALL-E 2 | Latent diffusion + text conditioning = commodity. |
| 2022 | ControlNet, LoRA | Fine control over pretrained diffusion. |
| 2023 | SDXL, Midjourney v5, Flow matching | Scale + better training dynamics. |
| 2024 | Sora, Stable Diffusion 3, Flux.1 | Video diffusion; flow matching wins. |
| 2025 | Veo 2, Kling 1.5, Runway Gen-3, Nano Banana | Production-grade video. |
| 2026 | Consistency + Rectified Flow | One-step sampling from diffusion backbones. |

## 5가지 질문의 분류

새로운 생성 모델 논문이 떨어지면 방법 섹션을 읽기 전에 이 다섯 가지 질문에 대답하십시오.

1. **What is being modeled?**픽셀, 잠잠자, 단독 토큰, 3D 가우시안, 망자, 파형?
2. **Is the density explicit or implicit?**저들이 적어주나요?$\log p(x)$- 그래요
3. **Sampling: one-shot or iterative?**반복적은 추론이 느려지는 것을 의미하며, 단 shot은 일반적으로 적대적 또는 정제된 것을 의미합니다.
4. **Conditioning: unconditional, class, text, image, pose?**이것은 손실과 건축 기판을 결정합니다.
5. **Evaluation: FID, CLIP score, IS, human preference, task accuracy?**각각의 실패 방식은 알려져 있다 (강습 14 참조).

이 단계의 모든 수업에 5가지의 답을 다시 해봅시다. 결국에는 반사일 것입니다.

```figure
autoencoder-bottleneck
```

## 건설 해

이 수업의 코드는 가벼운 시각화입니다. 3가지 장난감 접근법을 사용하여 샘플에서 1D 가우시안 혼합물을 적용합니다. (핵 밀도, 디스크릿 히스토그램, 그리고 가장 가까운 샘플 "GAN-ish" 생성기) 그래서 한 화면에 인쇄할 수 있는 문제에서 명시적 대 암시적 밀도 사이의 차이를 볼 수 있습니다.

달아`code/main.py`이중 모드 가우스 혼합물에서 2000개의 샘플을 가져다가 다음을 인쇄합니다.

```
explicit density (histogram): p(x in [-0.5, 0.5]) ≈ 0.38
approximate density (KDE):     p(x in [-0.5, 0.5]) ≈ 0.41
implicit (nearest-sample gen): 20 new samples printed, no p(x)
```

첫 번째 두 가지 질문에는 "이 점이 얼마나 가능할까요?"라는 질문이 있습니다. 세 번째는 "이 점이 얼마나 가능할까요?"라고 질문합니다. 이것은 미래의 모든 수업에 중요한 *표시적 또는 암시적* 구별입니다.

## 사용 하 고

2026년에 어떤 가족, 어떤 임무가?

| Task | Best family | Why |
|------|-------------|-----|
| Photoreal faces, narrow domain | StyleGAN 2/3 | Still sharpest, fastest inference. |
| General text-to-image | Latent diffusion + flow matching | SD3, Flux.1, DALL-E 3. |
| Fast text-to-image | Rectified flow + distillation | SDXL-Turbo, SD3-Turbo, LCM. |
| Text-to-video | Diffusion Transformer + flow matching | Sora, Veo 2, Kling. |
| Speech + music | Token-based AR (AudioLM, VALL-E, MusicGen) or flow matching (AudioCraft 2) | Discrete tokens scale cheaply. |
| 3D scenes | Gaussian Splatting fit, diffusion prior | 3D-GS for reconstruction, diffusion for novel-view. |
| Density estimation (no sampling) | Flows | Only family with exact $\log p(x)$. |
| Simulation / physics | Flow matching, score SDE | Straight-line paths, smooth vector fields. |

## 선박

`outputs/skill-model-chooser.md`- 그래

이 기술에는 작업 설명과 출력이 필요 합니다. (1) 어떤 가족으로 사용해야 하는지, (2) 세 가지 오픈 옵션과 세 가지 호스팅 옵션의 순위 목록, (3) 당신이 지켜봐야 할 확률적 실패 모드, 그리고 (4) 계산/시간 예산.

## 운동

1. **Easy.**이 다섯 가지 제품마다 가족 및 척추를 식별하십시오: ChatGPT 이미지, Midjourney v7, Sora, Runway Gen-3, ElevenLabs. 증거는 공공 기술 보고서에서 있어야합니다.
2. **Medium.**내일 읽어보실 논문은 분포보다 100배 더 빠른 샘플링을 주장합니다.
3. **Hard.**당신이 관심 있는 한 영역 (예: 단백질 구조, CAD, 분자, 궤도) 을 선택하고 그 영역의 현재 SOTA 모델에 대한 다섯 가지 질문 세분 해법을 답하고 더 나은 모델이 무엇을 변화시킬지 스케치하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Generative model | "It makes new stuff" | Learns a sampler for $p_{\text{data}}(x)$, optionally exposes $\log p(x)$. |
| Explicit density | "You can evaluate it" | Model provides a closed-form or tractable $\log p(x)$. |
| Implicit density | "GAN-style" | Only a sampler — no way to evaluate $p(x)$ of a given point. |
| ELBO | "Evidence lower bound" | A tractable lower bound on $\log p(x)$; VAEs and diffusion optimize it. |
| Score | "Gradient of log-density" | $\nabla_x \log p(x)$; diffusion and SDE models learn this field. |
| Manifold hypothesis | "Data lives on a surface" | High-dim data concentrates on a low-dim manifold; why dimensionality reduction works. |
| Autoregressive | "Predict the next piece" | Factorize joint as product of conditionals. |
| Latent | "Compressed code" | Low-dim representation from which a decoder can reconstruct the input. |

## 생산 메모: 5개의 가족, 5개의 추론 형태

각 가족들은 다른 추론-서버 비용 곡선을 지도합니다. 생산- 추론 문학은 LLM 추론을 사전填写 + 디코드로 프레임합니다. 여기서 동일한 분해가 적용됩니다:

- **Autoregressive (bucket 1 and 5).**순서적 디코딩은 지연성을 지배하고 KV 캐시, 연속 배팅, 그리고 추측적 디코딩은 모두 직접 적용됩니다.
- **VAE / diffusion / flow-matching (buckets 2 and 4).**LLM의 의미에서 해독법은 없습니다.`num_steps × step_cost`, 그리고`step_cost`전체 잠잠 해상도로 변환기 또는 U-Net 앞으로. 생산 버튼은 단계 수 (DDIM / DPM-Solver / 정유), 대량 크기 및 정확성 (bf16 / fp8 / int4).
- **GAN (bucket 3).**1번 앞면, 스케줄이 없고 KV 캐시도 없고 TTFT ≈ 전체 지연도 없고, 그래서 스틸건은 여전히 좁은 도메인 UX에서 승리합니다.

논문 추석에서 "방포보다 더 빠른 것"을 볼 때 "단계 몇 단계 × 같은 단계 비용" 또는 " 같은 단계 × 저렴한 단계 비용"로 번역하십시오. 나머지는 마케팅입니다.

## 더 많은 읽기

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) GAN 종이
- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) VAE 논문
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) DDPM 논문
- [Song et al. (2021). Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456) SDE로서의 전파
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) 흐름에 맞는 종이
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) 안정적인 분포 3.
