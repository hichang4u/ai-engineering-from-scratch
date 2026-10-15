# 그림, 그림, 그림 편집

> 텍스트에서 이미지가 새로운 것을 만들어 냅니다. 페인팅은 오래된 것을 수정합니다. 생산에서, 청구 가능한 이미지 작업의 70%는 편집입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 8 · 08 (ControlNet & LoRA)
**Time:** ~75 minutes

## 문제

클라이언트는 배경에 방해 표시가 있는 완벽한 제품 사진을 전송합니다. 당신은 표시를 지우고 다른 모든 것을 픽셀 동일하게 남겨두고 싶습니다. 당신은 처음부터 텍스트에서 이미지를 실행할 수 없습니다. 결과는 다른 색, 다른 조명, 다른 제품 각을 가질 것입니다. 당신은 *만 * 마스크 영역을 재생하고, 재생을 주변 맥락을 존중하고 싶어합니다.

그건 페인트링이야

- **Inpainting.**마스크 안에서 재생하고, 피클스 밖에서 유지하세요.
- **Outpainting.**마스크 바깥에서 재생 (또는 캔버스 너머) 를 유지, 내부에 유지.
- **Image editing.**전체 이미지를 재생하지만 원래에 대한 의미적 또는 구조적 충실성을 유지합니다 (SDEdit, InstructPix2Pix).

2026년 모든 디프루전 파이프라인에는 인 페인트 모드가 있습니다. 플루크스.1-필, 안정적인 디프루전 인 페인트, SDXL- 인 페인트, DALL-E 3 편집. 그들은 같은 원칙에 따라 작동합니다.

## 개념

![Inpainting: mask-aware denoising with context-preserving reinjection](../assets/inpainting.svg)

### 순진한 접근 방식 (그리고 왜 잘못된 것)

마스크를 사용하여 표준 텍스트-이미지 실행하세요. 샘플링 단계마다, 험난한 잠자의 비대면 영역을 앞으로 퍼진 깨끗한 이미지로 교체하세요. 그것은 작동합니다. 나쁘다. 경계 유물은 피가 흐릅니다. 모델은 마스크된 영역에 있는 것에 대한 정보를 가지고 있지 않기 때문에.

### 적절한 인 페인트 모델

4개 대신 9개의 입력 채널을 사용하는 수정된 U-네트를 트레이닝하세요.

```
input = concat([ noisy_latent (4ch), encoded_image (4ch), mask (1ch) ], dim=channel)
```

추가 채널은 VAE 코딩된 소스 이미지 및 단일 채널 마스크의 복사입니다. 훈련 시, 당신은 무작위로 이미지 영역을 마스크하고 모델은 마스크된 영역만을 표시하도록 훈련합니다. 마스크되지 않은 영역은 깨끗한 컨디션 신호로 제공됩니다. 추론에서 모델은 마스크된 영역을 둘러싸고있는 것을 "보며" 일관된 완성도를 생성합니다.

SD-Inpaint, SDXL-Inpaint, Flux-Fill 모두 이 9 채널 (또는 아날로그) 입력을 사용합니다.`StableDiffusionInpaintPipeline``FluxFillPipeline`- 그래

### SDEdit (Meng et al., 2022)  무료 편집

소음으로 인해 소음의 원본이 니다.`t`, 그리고   에서 역부슬을 실행`t`새로운 요청으로 0으로 내려가야 합니다. 재교육이 없습니다. 시작의 선택`t`창조적 자유를 위해 충성심을 거래합니다.

- `t/T = 0.3`→ 근원과 거의 동일하고 작은 스타일의 변화
- `t/T = 0.6`→ 중소적인 편집, 거친 구조를 유지
- `t/T = 0.9`→ 거의 소음으로 생성된 소음, 최소한의 소음

### 인스트럭트픽스2픽스 (브룩스 등, 2023)

 디프루지션 모델을 정밀 조정`(input_image, instruction, output_image)`3번. 추론 시 입력 이미지와 텍스트 명령 모두 조건 ("태양 서식" "드래곤을 추가") 두 개의 CFG 스케일: 이미지 스케일과 텍스트 스케일.

### 재발색 (Lugmayr et al., 2022)

표준 조건 없는 전파 모델을 유지하십시오. 각 역 단계에 다시 샘플을  때때로 더 험난한 상태로 다시 뛰어 재생하십시오. 경계 유물을 피하십시오. 훈련 된 인 페인트 모델이 없을 때 사용됩니다.

```figure
inpaint-mask-reinject
```

## 건설 해

`code/main.py`5차원 데이터에 대한 장난감 1D 인 페인팅 스키마를 구현합니다. 우리는 5차원 혼합 데이터에 대한 DDPM를 훈련합니다. 각각의 샘플은 두 클러스터 중 한 개에서 5 개의 부동의 것입니다. 추론에서 우리는 5 차원 중 2 개를 "마스크"하고, 모든 단계에서 비대면 3의 험난한 앞면 버전을 주입하고, 마스크 된 차원을 재생합니다.

### 단계 1: 5D DDPM 데이터

```python
def sample_data(rng):
    cluster = rng.choice([0, 1])
    center = [-1.0] * 5 if cluster == 0 else [1.0] * 5
    return [c + rng.gauss(0, 0.2) for c in center], cluster
```

### 단계 2: 모든 5개의 을 가로지르는 열차 단호기

표준 DDPM. 네트워크 출력 5D 소음 입력의 5D 소음 예측

### 3단계: 추론, 마스크 인식 역

```python
def inpaint_step(x_t, mask, clean_image, alpha_bars, t, rng):
    # replace unmasked dims with a freshly noised version of the clean source
    a_bar = alpha_bars[t]
    for i in range(len(x_t)):
        if not mask[i]:
            x_t[i] = math.sqrt(a_bar) * clean_image[i] + math.sqrt(1 - a_bar) * rng.gauss(0, 1)
    # ...then run the normal reverse step on x_t
```

이것은 순수적인 접근 방식이고 장난감 1D 데이터에 작동합니다. 실제 이미지 인 페인팅은 9 채널 입력 방식을 사용합니다. 왜냐하면 텍스처의 일관성이 더 중요하기 때문입니다.

### 4단계: 외색

캔버스 칠은 마스크를 뒤집어 칠하는 것입니다. 새로운 (전에는 존재하지 않았던) 캔버스를 마스크하고 나머지는 원래로 채우십시오. 동일한 훈련 목표.

## 함정

- **Seams.**이 순진한 접근법은 가시적인 경계를 남겨두고 있습니다. 그라디언트 정보가 마스크를 통과하지 않기 때문입니다. 수정: 마스크를 8-16 픽셀로 확장하거나 적절한 인 페인팅 모델을 사용하십시오.
- **Mask leakage.**컨디션 이미지 비대면 영역이 품질이 낮거나 소음이 많으면 마스크 내부의 세대를 오염시킵니다.
- **CFG interacts with mask size.**작은 마스크에 CFG가 높으면 = 포화 패치. 작은 편집에 CFG를 줄여라.
- **SDEdit fidelity cliff.**`t/T = 0.5` `t/T = 0.6`피험자의 신원을 잃을 수 있습니다.
- **Prompt mismatch.**이 명령어는 새 내용만을 말해서 전체 이미지를 설명해야 합니다. "석에 앉아 있는 고양이"는 "고양이"는 아닙니다.

## 사용 하 고

| Task | Pipeline |
|------|----------|
| Remove object, small mask | SD-Inpaint or Flux-Fill, standard prompt |
| Replace sky | SD-Inpaint + "blue sky at sunset" |
| Extend canvas | SDXL outpaint mode (8px feather) or Flux-Fill with outpaint mask |
| Regenerate hand / face | SD-Inpaint with prompt re-describing the subject + ControlNet-Openpose |
| Change style of one region | SDEdit at `t/T=0.5` on masked region |
| "Make it sunset" | InstructPix2Pix or Flux-Kontext |
| Background replacement | SAM mask → SD-Inpaint |
| Ultra-high-fidelity | Flux-Fill or GPT-Image (hosted) for hardest cases |

SAM (Meta's Segment Anything, 2023) + 디스푸전스 인 페인트 (diffusion inpaint) 는 2026년 배경 제거 파이프라인이다. SAM 2 (2024) 는 비디오에서 작동한다.

## 선박

저장`outputs/skill-editing-pipeline.md`. 스킬은 원본 이미지 + 편집 설명 + 선택적 마스크 (또는 SAM 프롬프트) 를 취하고 출력: 마스크 생성 접근법, 기본 모델, CFG 스케일 ( 이미지 + 텍스트), SDEdit-t 또는 인 페인팅 모드 및 QA 체크리스트.

## 운동

1. **Easy.**내`code/main.py`, 은폐된 차원의 분수는 0.2에서 0.8까지 다양합니다.
2. **Medium.**RePaint을 구현: 10번째 반향 단계마다 5 단계 뒤로 뛰어 (음음소 추가) 하고 다시 비춰라. 마스크 가장자리에 있는 경계 잔류를 줄이는지를 측정한다.
3. **Hard.**포옹 얼굴 디프저를 사용하여 비교: SD 1.5 인 페인트 + 컨트롤넷-오픈포스 vs 플루크스.1- 얼굴 재생 작업 20개에 채워주십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Inpainting | "Fill the hole" | Regenerate inside a mask; keep outside pixels. |
| Outpainting | "Extend the canvas" | Regenerate outside the canvas; keep inside. |
| 9-channel U-Net | "Proper inpainting model" | U-Net with `noisy \| encoded-source \| mask` as input. |
| SDEdit | "Img2img with noise level" | Noise to time `t`, denoise with new prompt. |
| InstructPix2Pix | "Text-only edits" | Fine-tuned diffusion on (image, instruction, output) triples. |
| RePaint | "No retraining" | Re-noise periodically during reverse to reduce seams. |
| SAM | "Segment Anything" | Mask generator by clicks or boxes; pairs with inpaint. |
| Flux-Kontext | "Edit with context" | Flux variant that accepts a reference image + instruction for edits. |

## 제작 메모: 편집 파이프라인은 지연에 민감합니다

이미지 편집 사용자는 5초 이하의 회전 여행을 기대한다. 10242에서 30단계 SDXL-Inpaint은 L4에서 3-4초, SAM 마스크 생성 (~ 200 ms) 및 VAE 코드/독호 (~ 500 ms 합쳐) 를 더한다. 생산 프레임링에서는, 이것은 처리량 제한이 아닌 TTFT-bound입니다.

- **SAM-H is the slow one.**SAM-H 10242 시점에서는 ~200 ms, SAM-ViT-B 시점에서는 ~40 ms, 품질 손실은 작다. SAM 2 (비디오) 는 시간적 오버헤드를 추가합니다. 단일 이미지 편집에 사용하지 마십시오.
- **Skip the encode when possible.** `pipe.image_processor.preprocess(img)`만약 이전 세대 (이터티브 편집 UI에서 전형적인) 의 잠잠자를 가지고 있다면,`latents=...`VAE 코드를 넘기기 위해서
- **Mask dilation matters for throughput too.**작은 마스크는 U-Net의 대부분의 전면 패스가 낭비된다는 것을 의미합니다 (모스크가 없는 픽셀은 어쨌든 꽉 잡혀 있습니다). `diffusers`"`StableDiffusionInpaintPipeline`U-Net 전체를 무관하게 실행합니다. 9 채널의 적절한 인 페인트 버전에만 마스크된 컴퓨팅이 사용됩니다.
- **Flux-Kontext is the 2025 answer.**한발 앞을 지나가`(source_image, instruction)` 별도의 마스크가 없고, SDEdit 소음 스파이도 없습니다. H100에서는 1.5s에 편집을 전송합니다. 건축 수업은: 단계를 붕괴합니다.

## 더 많은 읽기

- [Lugmayr et al. (2022). RePaint: Inpainting using Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2201.09865) 교육 없이 인 페인트
- [Meng et al. (2022). SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations](https://arxiv.org/abs/2108.01073) SDEdit
- [Brooks, Holynski, Efros (2023). InstructPix2Pix](https://arxiv.org/abs/2211.09800) 텍스트 명령어 편집
- [Kirillov et al. (2023). Segment Anything](https://arxiv.org/abs/2304.02643) SAM, 마스크 소스
- [Ravi et al. (2024). SAM 2: Segment Anything in Images and Videos](https://arxiv.org/abs/2408.00714) 비디오 SAM.
- [Hertz et al. (2022). Prompt-to-Prompt Image Editing with Cross-Attention Control](https://arxiv.org/abs/2208.01626) 주의력 수준의 편집
- [Black Forest Labs (2024). Flux.1-Fill and Flux.1-Kontext](https://blackforestlabs.ai/flux-1-tools/)2024 도구
