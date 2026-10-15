# 비디오 생성

> 이미지는 2D 텐서이다. 비디오는 3D 텐서이다. 이론은 동일하다. 계산은 10-100배 더 어렵습니다. 오픈아이의 소라 (Feb 2024) 은 가능하다는 것을 증명했다. 2026 년까지 Veo 2, Kling 1.5, Runway Gen-3, Pika 2.0, 및 WAN 2.2 선박 생산 비디오는 1080p 에서 텍스트에서 나와 있으며 오픈 웨이트 스택 (CogVideoX, HunyuanVideo, Mochi-1, WAN 2.2) 은 12 개월 뒤입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 7 · 09 (ViT), Phase 8 · 06 (DDPM)
**Time:** ~45 minutes

## 문제

10초의 1080p 비디오는 24fps로 240 프레임의 1920×1080×3 픽셀입니다. 이것은 클립에 대한 원료 데이터의 약 1.5 GB입니다. 픽셀 공간 전파는 불가능합니다. 당신은:

1. **Spatiotemporal compression.**프레임이 아닌 동영상을 공간-시간 패치의 연속으로 암호화하는 VAE
2. **Temporal coherence.**프레임은 내용과 조명, 그리고 물체의 정체성을 초 동안 공유해야 합니다.
3. **Compute budget.**비디오 훈련은 같은 모델 크기의 이미지보다 10-100배 더 비싸다.
4. **Conditioning.**텍스트, 이미지 (첫 번째 프레임), 오디오, 또는 다른 비디오. 대부분의 제작 모델은 네 가지 모두 수용합니다.

이 문제를 해결한 건축은**Diffusion Transformer (DiT)**공간 시간 패치에 적용된, 거대한 데이터 세트 (프롬프트, 캡션, 비디오) 에 훈련된.

## 개념

![Video diffusion: patchify, DiT, decode](../assets/video-generation.svg)

### 기

3D VAE (학습된 공간 시간 압축) 로 비디오를 암호화합니다.`[T_latent, H_latent, W_latent, C_latent]`크기의 조각으로 갈라진다`[t_p, h_p, w_p]`. 소라 스타일의 모델들을 위해서,`t_p = 1`(프레임에 대한 패치) 또는 `t_p = 2`10초의 1080p 비디오는 약 20,000~100,000 패치로 압축됩니다.

### 공간 시간적 DT

트랜스포머는 패치의 평면 순서를 처리한다. 각 패치에는 3D 위치 임베디션 (시간 + y + x) 이 있다. 주의는 일반적으로 요인으로 분류된다:

- **Spatial attention**각 프레임의 패치 안에
- **Temporal attention**같은 공간의 위치에서 프레임들을 가로지르는
- **Full 3D attention**16-100배 더 비싸고, 낮은 해상도 또는 연구용으로만 사용된다.

### 텍스트 컨디션

큰 텍스트 코더 (Sora에 T5-XXL, CogVideoX-5B에 T5-XXL) 를 사용하여 크로스 주의를 기울입니다. 긴 명령어 문제는  소라의 훈련 세트는 GPT 생성된 밀집한 재본을 가지고 있으며 클립당 평균 200 토큰이 있습니다.

### 교육

공간 시간적 잠자리에 대한 표준 전파 손실 (ε 또는 v 예측) 데이터: 웹 비디오 + ~ 100M 큐레이션 클립 + 합성 텍스트 캡션. 계산: 작은 연구 실행에 10만+ GPU 시간; 소라 스케일 100,000+

## 2026년 생산 경상

| Model | Date | Max duration | Max res | Open weights? | Notable |
|-------|------|--------------|---------|---------------|---------|
| Sora (OpenAI) | 2024-02 | 60s | 1080p | No | First model to show world simulator properties at scale |
| Sora Turbo | 2024-12 | 20s | 1080p | No | Production Sora at 5x faster inference |
| Veo 2 (Google) | 2024-12 | 8s | 4K | No | Highest quality + physics in 2025 |
| Veo 3 | 2025 Q3 | 15s | 4K | No | Native audio and stronger camera control |
| Kling 1.5 / 2.1 (Kuaishou) | 2024-2025 | 10s | 1080p | No | Best human motion in 2025 Q1 |
| Runway Gen-3 Alpha | 2024-06 | 10s | 768p | No | Professional video tools on top |
| Pika 2.0 | 2024-10 | 5s | 1080p | No | Strongest character consistency |
| CogVideoX (THUDM) | 2024 | 10s | 720p | Yes (2B, 5B) | First open 5B-scale video |
| HunyuanVideo (Tencent) | 2024-12 | 5s | 720p | Yes (13B) | Open SOTA late 2024 |
| Mochi-1 (Genmo) | 2024-10 | 5.4s | 480p | Yes (10B) | Most permissively licensed |
| WAN 2.2 (Alibaba) | 2025-07 | 5s | 720p | Yes | Strongest open model mid-2025 |

오픈 웨이트는 이미지 공간보다 더 빠르게 격차를 습니다. HunyuanVideo + WAN 2.2 LoRA는 이미 2026년 중반까지 대부분의 오픈소스 작업 흐름을 지원합니다.

```figure
video-diffusion-denoise
```

## 건설 해

`code/main.py`작은 합성 비디오를 패치화하고, 패치마다 위치 임베디션을 추가하고, 패치에 대한 트랜스포머 스타일의 관심으로 전체 순서를 소멸시킵니다. numpy가 없습니다. 순수한 파이썬. 우리는 1D에서도 시간적 일관성이 나타난다는 것을 보여줍니다. 인접 프레임 패치들이 소멸을 공유하고 위치 임베디션을 공유하면

### 단계 1: 합성 1D "비디오"를 꽂아

```python
def make_video(T_frames=8, rng=None):
    # a "video" is a sequence of 1-D values following a smooth trajectory
    base = rng.gauss(0, 1)
    return [base + 0.3 * t + rng.gauss(0, 0.1) for t in range(T_frames)]
```

### 단계 2: 프레임에 대한 위치 임베디션

```python
def pos_embed(t, dim):
    return sinusoidal(t, dim)
```

### 단계 3: 디노이저는 전체 순서를 볼 수 있습니다

각각의 프레임을 독립적으로 단호하기 보다는, 우리의 작은 네트워크는 모든 프레임 값 + 위치 임베디션을 연결하고 모든 프레임에 대한 소음을 예측합니다.

### 단계 4: 시간적 일관성 테스트

훈련 후, 비디오 샘플을 가져가라. 프레임에서 프레임에 대한 델타를 측정한다. 모델이 시간 구조를 배웠다면, 델타는 각각의 프레임을 독립적으로 샘플링하는 것보다 작습니다.

## 함정

- **Independent per-frame sampling = flicker.**각 프레임에 개별적으로 이미지 전파를 실행하면 각각의 프레임의 소음이 독립적이기 때문에 출력 윙크가 됩니다. 비디오 전파는 관심이나 공유 소음을 통해 프레임들을 결합시켜 이것을 수정합니다.
- **Naive 3D attention = OOM.**10초의 1080p 잠복형 3D 집중력은 수십억개의 작업입니다. 공간 + 시간으로 분산합니다.
- **Data captioning matters more than size.**이전 작업에 비해 소라의 주요 업그레이드는 ~ 10x 더 자세한 캡션 (GPT-4 리베이크 된 클립) 에 대한 훈련이었습니다.
- **First-frame conditioning.**대부분의 생산 모델은 또한 첫 번째 프레임으로 이미지를 받아들이고 있습니다. 이것은 " 이미지- 비디오" 모드입니다. 훈련은이 변형을 포함합니다.
- **Physics drift.**긴 클립 (> 10s) 은 미묘한 불일치를 축적 합니다. 슬라이딩 창 생성 + 키프레임 앵커링은 도움이 됩니다.

## 사용 하 고

| Use case | 2026 pick |
|----------|-----------|
| Highest-quality text-to-video, hosted | Veo 3 or Sora |
| Camera-controlled cinematic | Runway Gen-3 with motion brushes |
| Character consistency across clips | Pika 2.0 or Kling 2.1 |
| Open weights, fast fine-tune | WAN 2.2 + LoRA |
| Image-to-video | WAN 2.2-I2V, Kling 2.1 I2V, or Runway |
| Audio-to-video lip sync | Veo 3 (native audio) or a dedicated lip-sync model |
| Video editing | Runway Act-Two, Kling Motion Brush, Flux-Kontext (still-frame) |

비디오의 품질 평준의 초당 비용은 2024년부터 2026년까지 20배 감소했습니다.

## 선박

저장`outputs/skill-video-brief.md`. 스킬은 비디오 브리프 (시간, 화면 비율, 스타일, 카메라 플랜, 주체 일관성, 오디오) 및 출력: 모델 + 호스팅, 신속한 스카프폴딩 (카메라 언어, 주체 설명, 움직임 설명), 씨드 + 재생 가능성 프로토콜 및 프레임 레벨 QA 체크리스트를 취합니다.

## 운동

1. **Easy.**내`code/main.py`(a) 독립적인 프레임 단위 샘플링, (b) 공동 순서 샘플링을 위해 프레임에서 프레임에 대한 델타를 비교합니다.
2. **Medium.**첫 프레임 조건: 핀 프레임 0을 주어진 값에 추가하고 나머지 샘플을 측정합니다. 핀 값이 어떻게 번식하는지 측정합니다.
3. **Hard.**로컬 GPU에서 CogVideoX-2B를 실행하기 위해 HuggingFace 디스퍼를 사용하세요. 시간 20 추론은 6초짜리 클립을 위해 720p로 단계가 됩니다. 병목을 식별하기 위해 공간-시간 주의를 프로파일하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Video VAE | "3-D VAE" | Encoder that compresses `(T, H, W, C)` → spatiotemporal latent. |
| Patches | "The tokens" | Fixed-size 3-D blocks of the latent; input to the DiT. |
| Factorized attention | "Spatial + temporal" | Run attention over space, then over time; skip full 3-D attention. |
| Image-to-video (I2V) | "Animate this photo" | Model takes an image + text, outputs a video that starts from it. |
| Keyframe conditioning | "Anchor frames" | Pin specific frames to control the video's arc. |
| Motion brush | "Directional hint" | UI input where the user paints motion vectors onto the image. |
| Re-captioning | "Dense captions" | Using an LLM to re-label training clips with detailed prompts. |
| Flicker | "Temporal artifact" | Frame-to-frame inconsistency; fixed with coupled denoising. |

## 제작 메모: 비디오 잠복은 메모리 대역폭 문제입니다

10초의 1080p 클립은 24fps로 240 프레임 × 1920 × 1080 × 3 ≈ 1.5 GB 원본 픽셀입니다. 4× 비디오 VAE 압축 후 (`2 × spatial × 2 × temporal`(주) 래텐트는 요청당 ~100 MB입니다. 이 작업을 방전 1에서 30 단계 동안 공간 시간 DiT를 통해 실행하면 HBM  메모리 대역폭을 통해 ~3 GB/단계를 이동하고 있습니다. FLOPs가 아니라, 병목입니다.

3개의 생산 버튼, 모두 생산-분명 문학 추론 섹션에서 바로 나온다:

- **TP across the DiT.**텍스트에서 비디오 모델은 일상적으로 ≥10B 파라미입니다. 4 H100에서 TP=4는 표준입니다. 405B 클래스 모델에서는 PP=2 × TP=2입니다. 단계별 지연량은 TP가 모든 절감 벽까지 대략 선형적으로 떨어집니다.
- **Frame batching = continuous batching.**생성 시, 비디오는 개념적으로 관심으로 연결된 프레임의 무늬입니다. 연속적인 배팅 (비행 스케줄링) 은 적용됩니다: 렌더링 프레임 시작 `t+1`프레임 중`t-1`모델 아키텍처가 슬라이딩 윈도우 생성을 허용하는 경우 반환됩니다.
- **Clip-level prefill cache.**이미지-비디오에서, 첫 프레임 컨디션은 LLM의 프롬프트 프리필과 유사합니다. 한 번 계산하고, 시간 디코더 패스를 통해 재사용합니다. 이것은 비디오에 대한 KV 캐시입니다.

## 더 많은 읽기

- [Brooks et al. (2024). Video generation models as world simulators](https://openai.com/index/video-generation-models-as-world-simulators/) 소라 기술 보고서
- [Yang et al. (2024). CogVideoX: Text-to-Video Diffusion Models with An Expert Transformer](https://arxiv.org/abs/2408.06072) CogVideoX
- [Kong et al. (2024). HunyuanVideo: A Systematic Framework for Large Video Generative Models](https://arxiv.org/abs/2412.03603)          
- [Genmo (2024). Mochi 1 preview model card](https://huggingface.co/genmo/mochi-1-preview) 모치-1
- [Alibaba (2025). WAN 2.2](https://wanvideo.io/) 2025년 중반에 SOTA를 개설
- [Ho, Salimans, Gritsenko et al. (2022). Video Diffusion Models](https://arxiv.org/abs/2204.03458) 본격적인 비디오 전파 종이
- [Blattmann et al. (2023). Align your Latents (Video LDM)](https://arxiv.org/abs/2304.08818) 안정적인 비디오 전파의 조상.
