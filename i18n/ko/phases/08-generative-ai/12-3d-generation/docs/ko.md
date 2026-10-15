# 3D 세대

> 3D는 2D에서 3D의 레버리가 가장 강한 모달리티입니다. 2023 년 돌파구는 3D 가우스 스플래팅이었습니다. 2024-2026 년 생산적인 푸시 레이어 멀티 뷰 디프러시온 + 3D 재구성 상단에 단일 펌프 또는 사진에서 객체 및 장면을 생성합니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 4 (Vision), Phase 8 · 07 (Latent Diffusion)
**Time:** ~45 minutes

## 문제

3D 컨텐츠는 고통스럽습니다.

- **Representation.**메시, 포인트 클라우드, 보셀 네트워크, 서명된 거리 필드 (SDF), 신경 광경 필드 (NeRF), 3D 가우시안. 각각 타협이 있습니다.
- **Data scarcity.**이미지넷은 14M의 이미지를 보유하고 있습니다. 가장 큰 깨끗한 3D 데이터 세트 (Objaverse-XL, 2023) 는 ~ 10M의 객체를 가지고 있습니다.
- **Memory.**5123 화소 그리드는 128M 화소; 유용한 장면은 1M 샘플/선에 필요합니다. 생성은 재건보다 어렵습니다.
- **Supervision.**2D 이미지에 픽셀이 있습니다. 3D에서는 보통 몇 개의 2D 뷰가 있습니다.

2026 스택은 두 가지 문제를 분리합니다. 첫째, 전파 모델로 * 2D 멀티뷰 이미지를 생성하십시오. 둘째, 그 이미지들에 * 3D 표현 * (일반적으로 가우스 스플래팅) 을 맞게하십시오.

## 개념

![3D generation: multi-view diffusion + 3D reconstruction](../assets/3d-generation.svg)

### 표현: 3D 가우스 스플래팅 (Kerbl et al., 2023)

1M 3D 가우시안의 구름으로 한 장면을 표현한다. 각은 59개의 매개 변수를 가지고 있다. 위치 (3), 코바리안스 (6, 또는 쿼터니온 4 + 스케일 3), 불투명성 (1), 구형-하모닉스 색상 (48도 3, 0도 3).

렌더링 = 투영 + 알파 작곡. 빠른 (~4090에서 1080p에서 100fps). 차별화 할 수 있습니다. 지형 진실 사진에 대한 경진 하락으로 적합합니다. 소비자 GPU에서 5-30 분 동안 장면이 적합합니다.

2023~2024년 2가지 혁신:
- **Generative Gaussian splats.**LGM, LRM, InstantMesh 같은 모델들은 한 개 또는 몇 개의 이미지에서 직접 가우스 구름을 예측합니다.
- **4D Gaussian Splatting.**역동적인 장면들을 위한 프레임 개량으로 가우시안

### 멀티뷰 디스포전

텍스트 프롬프트 또는 단일 이미지에서 동일한 객체의 여러 가지 일관된 조사를 생성하기 위해 미리 훈련된 이미지 전파 모델을 정렬하십시오. Zero123 (Liu et al., 2023), MVDream (Shi et al., 2023), SV3D (안정성, 2024), CAT3D (Google, 2024). 일반적으로 객체의 주위를 4-16 조사를 생성하여 가우스 스플래팅 또는 NeRF를 통해 3D로 끌어올립니다.

### 텍스트에서 3D 파이프라인

| Model | Input | Output | Time |
|-------|-------|--------|------|
| DreamFusion (2022) | text | NeRF via SDS | ~1 hour per asset |
| Magic3D | text | mesh + texture | ~40 min |
| Shap-E (OpenAI, 2023) | text | implicit 3D | ~1 min |
| SJC / ProlificDreamer | text | NeRF / mesh | ~30 min |
| LRM (Meta, 2023) | image | triplane | ~5 s |
| InstantMesh (2024) | image | mesh | ~10 s |
| SV3D (Stability, 2024) | image | novel views | ~2 min |
| CAT3D (Google, 2024) | 1-64 images | 3D NeRF | ~1 min |
| TripoSR (2024) | image | mesh | ~1 s |
| Meshy 4 (2025) | text + image | PBR mesh | ~30 s |
| Rodin Gen-1.5 (2025) | text + image | PBR mesh | ~60 s |
| Tencent Hunyuan3D 2.0 (2025) | image | mesh | ~30 s |

2025~2026 방향: 게임 엔진에 적합한 PBR 재료로 직전 텍스트-망 모형. 멀티뷰 디스푸전 중간 단계는 여전히 일반적인 물체에 대한 가장 좋은 성능의 요리법입니다.

### NeRF (상황에 대한)

신경성 광경 현장 (Mildenhall et al., 2020).`(x, y, z, view direction)`그리고 출력`(color, density)`.선과 함께 통합하여 렌더링. 질적으로 매시 기반의 신상관 합성을 이겨내지만 렌더링은 100-1000배 느려. 대부분의 실시간 사용에 있어서 가우스 스플래팅이 대체되었지만 여전히 연구에서 지배적이다.

```figure
v4-3d-multiview
```

## 건설 해

`code/main.py`2D 가우스 스플래팅 (Gaussian splating) 을 구현하여 2D 가우스 스플래팅의 합으로 합성 대상 이미지를 표현합니다. 2D 가우스 스플래팅을 통해 위치, 색상 및 코버리언스를 최적화합니다. 목표와 일치하도록 그레디언트 하락으로 조정합니다. 두 개의 핵심 작업을 볼 수 있습니다. 앞 렌더링 (스플래트 + 알파 복합) 및 그레디언트 하락으로 조정합니다.

### 단계 1: 2D 가우스 스플랫

```python
def gaussian_at(x, y, gaussian):
    px, py = gaussian["pos"]
    sigma = gaussian["sigma"]
    d2 = (x - px) ** 2 + (y - py) ** 2
    return math.exp(-d2 / (2 * sigma * sigma))
```

### 단계 2: 스플릿을 합하여 렌더링

```python
def render(image_size, gaussians):
    img = [[0.0] * image_size for _ in range(image_size)]
    for g in gaussians:
        for y in range(image_size):
            for x in range(image_size):
                img[y][x] += g["color"] * gaussian_at(x, y, g)
    return img
```

진짜 3D 가우시안 스플래팅은 깊이와 알파 복합물 순서에 따라 가우시안들을 분류합니다.

### 단계 3: 경각층 하락에 따라 적합

```python
for step in range(steps):
    pred = render(size, gaussians)
    loss = mse(pred, target)
    gradients = compute_grads(pred, target, gaussians)
    update(gaussians, gradients, lr)
```

## 함정

- **View inconsistency.**만약 4개의 조사를 독립적으로 생성하고 객체 구조에 대해 의견이 일치하지 않는다면 3D 융합이 흐려집니다.
- **Back-side hallucination.**단일 이미지 → 3D는 보이지 않는 측면을 발명해야 합니다. 품질은 매우 다양합니다.
- **Gaussian splat explosion.**무제한 훈련은 10M 스플릿과 과장으로 성장합니다. 밀집 + 절단 유리스틱 (원본 3D-GS 종이에 의해) 는 필수적입니다.
- **Topology issues.**암시적인 필드 (SDF) 의 메쉬는 종종 구멍이나 자격 교차를 가지고 있습니다. 배송 전에 리메셔 (예를 들어 블렌더의 보셀 리메쉬) 를 실행하십시오.
- **License of training data.**오브자버스는 혼합 라이선스를 가지고 있으며, 상업적 사용은 모델마다 다릅니다.

## 사용 하 고

| Task | 2026 pick |
|------|-----------|
| Scene reconstruction from photos | Gaussian splatting (3DGS, Gsplat, Scaniverse) |
| Text-to-3D object for games | Meshy 4 or Rodin Gen-1.5 (PBR output) |
| Image-to-3D | Hunyuan3D 2.0, TripoSR, InstantMesh |
| Novel-view synthesis from few images | CAT3D, SV3D |
| Dynamic scene reconstruction | 4D Gaussian Splatting |
| Avatar / clothed human | Gaussian Avatar, HUGS |
| Research / SOTA | Whatever dropped last week |

게임 또는 전자 상거래 파이프라인에서 3D 제작 배포를 위해: 메시 4 또는 로딘 Gen-1.5 출력 PBR 매시, 바로 유니티 / 언리얼으로 이동합니다.

## 선박

저장`outputs/skill-3d-pipeline.md`. 스킬은 3D 브리프 (인포트: 텍스트 / 한 이미지 / 몇 가지 이미지; 출력: 매시 / 스플랫 / 네RF; 사용: 렌더 / 게임 / VR) 및 출력: 파이프라인 (다중 시청방송 전파 + 적합성 또는 직선 모델), 기본 모델, 반복 예산, 토폴로지 후 처리, 필요한 재료 채널을 사용합니다.

## 운동

1. **Easy.**달아`code/main.py`4, 16, 64개의 가우시안으로 최종 MSE와 목표에 대한 보고서를 작성합니다.
2. **Medium.**색상 가우시안 (RGB) 으로 확장하여, 재조직이 목표 색상 패턴과 일치하는지 확인합니다.
3. **Hard.**gsplat 또는 Nerfstudio를 사용하여 50 사진 촬영에서 실제 객체를 재구성하여, 유지된 뷰에 대한 적합 시간 및 최종 SSIM를 보고하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| 3D Gaussian Splatting | "3DGS" | Scene as a cloud of 3D Gaussians; differentiable alpha-composite render. |
| NeRF | "Neural radiance field" | MLP that outputs color + density at a 3D point; render by ray integration. |
| Triplane | "Three 2-D planes" | Factor 3D into three 2-D axis-aligned feature grids; cheaper than volumetric. |
| SDS | "Score distillation sampling" | Train 3D model by using 2D-diffusion score as pseudo-gradient. |
| Multi-view diffusion | "Many views at once" | Diffusion model that outputs a batch of consistent camera views. |
| PBR | "Physically-based rendering" | Material with albedo, roughness, metallic, normal channels. |
| Densification | "Grow splats" | 3DGS training heuristic: split / clone splats in high-gradient regions. |

## 제작 메모: 3D에는 아직 공유된 서브스트레이트가 없습니다

이미지 (라텐트 디프루션 + 디티) 및 비디오 (스페시오타임포럴 디티) 와 달리, 3D는 2026년에 단일 지배적인 실행 시간을 가지고 있지 않습니다. 생산 결정 나무는 표현에 대해 니다:

- **NeRF / triplane.**인퍼런스 는 샘플 당 레이 마싱 + MLP 포워드 입니다. 5122 렌더링은 수백만 MLP 포워드 를 필요로 합니다. 레이 샘플을 공격적으로 배팅 합니다. SDPA/xformers는 적용됩니다.
- **Multi-view diffusion + LRM reconstruction.**2단계 파이프라인. 1단계 (다중 시청 DiT) 는 배움 07과 마찬가지로 전파 서버이다. 2단계 (LRM 트랜스포머) 는 각 조회에 대한 한 번의 앞선 경로를 말한다. 전체 지연성 프로파일은 "방급 + 한 번의 촬영"입니다.
- **SDS / DreamFusion.**자산별 최적화, 추론이 아니라 일자리 창출, 관리자를 요청하는 것이 아닙니다.

대부분의 2026 제품에서는 올바른 대답은 "청구에 따라 멀티뷰 디스포시온 모델을 실행하고, 3DGS에 비동이적으로 재구성하고, 실시간 시청을 위해 3DGS를 서비스한다". 이것은 GPU 인퍼런스 서버 (빠른) 와 오프라인 최적화 ( 느린) 사이에 작업량을 깨끗하게 나눕니다.

## 더 많은 읽기

- [Mildenhall et al. (2020). NeRF: Representing Scenes as Neural Radiance Fields](https://arxiv.org/abs/2003.08934) NRF
- [Kerbl et al. (2023). 3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://arxiv.org/abs/2308.04079)3DGS
- [Poole et al. (2022). DreamFusion: Text-to-3D using 2D Diffusion](https://arxiv.org/abs/2209.14988) SDS
- [Liu et al. (2023). Zero-1-to-3: Zero-shot One Image to 3D Object](https://arxiv.org/abs/2303.11328) 제로123
- [Shi et al. (2023). MVDream](https://arxiv.org/abs/2308.16512) 다중 시각 전파
- [Hong et al. (2023). LRM: Large Reconstruction Model for Single Image to 3D](https://arxiv.org/abs/2311.04400) LRM
- [Gao et al. (2024). CAT3D: Create Anything in 3D with Multi-View Diffusion Models](https://arxiv.org/abs/2405.10314)CAT3D
- [Stability AI (2024). Stable Video 3D (SV3D)](https://stability.ai/research/sv3d-novel-multi-view-synthesis-and-3d-generation-from-a-single-image-using-latent-video-diffusion) SV3D
