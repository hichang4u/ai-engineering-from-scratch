# 시력 변환기 (ViT)

> 이미지는 패치의 그리드이고 문장은 토큰의 그리드입니다. 같은 트랜스포머는 둘 다 먹습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 4 · 03 (CNNs), Phase 4 · 14 (Vision Transformers intro)
**Time:** ~45 minutes

## 문제

2020 년 이전에는 컴퓨터 비전은 변동을 의미했습니다. 이미지네트, COCO, 탐지 기준의 모든 SOTA는 CNN 척추를 사용했습니다. 트랜스포머는 언어였습니다.

도소비츠키 등 (2020)  "An Image is Worth 16x16 Words" 는 회전들을 완전히 떨어뜨릴 수 있음을 보여주었다. 이미지를 고정 크기의 패치로 갈라, 각 패치를 임베디드에 선형적으로 프로젝하고, 연속을 바닐라 트랜스포머 코더로 공급한다. 충분한 규모 (ImageNet-21k 사전 훈련 또는 더 큰) 에서, ViT는 ResNet 기반 모델과 일치하거나 이기는 것이다.

ViT는 2026년에 더 넓은 패턴의 시작이었습니다. 하나의 건축물, 많은 모다리얼. 휘스퍼는 오디오를 토큰화합니다. ViT는 이미지를 토큰화합니다. 로봇을위한 액션 토큰. 비디오에 대한 픽셀 토큰. 트랜스포머는 신경 쓰지 않습니다.

2026년까지, ViT와 그 후계자 (DeiT, Swin, DINOv2, ViT-22B, SAM 3) 는 대부분의 비전을 소유하고 있습니다. CNN는 여전히 가장자리 장치와 지연 민감한 작업에 승리합니다. 다른 모든 것은 스택에서 어딘가에 ViT를 가지고 있습니다.

## 개념

![Image → patches → tokens → transformer](../assets/vit.svg)

### 단계 1    

나뉘어`H × W × C``N × (P·P·C)`평면 패치의 순서. 전형적인 설정: `224 × 224`이미지`16 × 16`패치 → 196 패치, 각각 768 값.

```
image (224, 224, 3) → 14 × 14 grid of 16x16x3 patches → 196 vectors of length 768
```

패치 크기는 레버입니다. 작은 패치 = 더 많은 토큰, 더 좋은 해상도, 사각형 주의 비용. 큰 패치 = 더 , 더 저렴합니다.

### 단계 2  선형 임베디션

학습된 하나의 매트릭스는 각각의 평평한 패치를`d_model`. 커널 크기의 convolution와 동등합니다`P`그리고 발걸음`P`피토르치에서는 말 그대로`nn.Conv2d(C, d_model, kernel_size=P, stride=P)` 2 줄의 실행

### 3단계  준비 `[CLS]`토큰, 위치 임베디션을 추가

- 학습할 수 있는 것을 준비하라`[CLS]`마지막 숨겨진 상태는 분류에 사용되는 이미지 표현입니다.
- 학습 가능한 위치 임베디션 (ViT-원래) 또는 시누사이드 2D (이후 변종) 을 추가한다.
- 2024+ RoPE는 위치로 2D로 확장되었으며 때로는 명시적인 임베디션이 없습니다.

### 단계 4  표준 트랜스포머 코더

   블록의 L  블록`LayerNorm → Self-Attention → + → LayerNorm → MLP → +`- BERT와 동일합니다. 비전 특수한 계층이 없습니다. 이것은 논문의 교육적 인 점입니다.

### 5단계  머리

분류: `[CLS]`숨겨진 상태 → 선형 → 부드러운 최대. DINOv2 또는 SAM에 대해서는 폐기 `[CLS]`, 패치 임베디션을 직접 사용하세요.

### 중요했던 변형

| Model | Year | Change |
|-------|------|--------|
| ViT | 2020 | The original. Fixed patch size, full global attention. |
| DeiT | 2021 | Distillation; trainable on ImageNet-1k only. |
| Swin | 2021 | Hierarchical with shifted windows. Fixed sub-quadratic cost. |
| DINOv2 | 2023 | Self-supervised (no labels). Best general vision features. |
| ViT-22B | 2023 | 22B params; scaling laws apply. |
| SigLIP | 2023 | ViT + language pair, sigmoid contrastive loss. |
| SAM 3 | 2025 | Segment anything; ViT-Large + promptable mask decoder. |

### 왜 시간이 걸렸는지

ViT는 CNN에 대응하기 위해 *많은* 데이터를 필요로 한다. 왜냐하면 CNN의 인덕티브 편향 (번역 변함, 지역) 이 없기 때문이다. 100M 이상의 라벨 이미지와 강력한 자기 감독 사전 훈련이 없으면, CNN는 여전히 일치하는 계산에서 승리한다. DeiT는 2021년에 디스틸레이션 트릭으로 이것을 수정했으며, DINOv2는 2023년에 자기 감독으로 영구적으로 수정했다.

```figure
n5-patch-stream
```

## 건설 해

보시다시피`code/main.py`. 순수한 STDlib 패치 + 선형 임베디션 + 정신 건강 검진. 훈련  현실적인 규모의 ViT는 PyTorch와 GPU 시간

### 단계 1: 가짜 이미지

24 × 24 RGB 이미지가 `(R, G, B)`6×6 패치를 16 패치를 사용해서 108-D 벡터를 각각 삽입합니다.

### 단계 2: 

```python
def patchify(image, P):
    H = len(image)
    W = len(image[0])
    patches = []
    for i in range(0, H, P):
        for j in range(0, W, P):
            patch = []
            for di in range(P):
                for dj in range(P):
                    patch.extend(image[i + di][j + dj])
            patches.append(patch)
    return patches
```

라스터 순서: 그릴 가로지르는 큰 줄. 모든 ViT는 이 순서를 사용합니다.

### 단계 3: 선형 임베디드

각각의 평면 패치를 무작위로 곱합니다`(patch_flat_size, d_model)`매트릭스 출력 형태가 확인`(N_patches + 1, d_model)`  `[CLS]`- 그래

### 단계 4: 현실적인 ViT의 매개 변수를 계산

ViT-Base의 파라마 카운트를 인쇄: 12 층, 12 헤드, d=768, 패치=16. ResNet-50 (~25M) 를 비교하십시오. ViT-Base는 ~86M에 도착합니다. ViT-Large ~307M. ViT-Huge ~632M.

## 사용 하 고

```python
from transformers import ViTImageProcessor, ViTModel
import torch
from PIL import Image

processor = ViTImageProcessor.from_pretrained("google/vit-base-patch16-224-in21k")
model = ViTModel.from_pretrained("google/vit-base-patch16-224-in21k")

img = Image.open("cat.jpg")
inputs = processor(img, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, 197, 768): [CLS] + 196 patches
cls_emb = out[:, 0]                       # image representation
```

**DINOv2 embeddings are the 2026 default for image features.**척추를 얼어넣고 작은 머리를 훈련시켜서 분류, 검색, 탐지, 캡션에 효과가 있습니다. 메타의 DINOv2 체크포인트는 텍스트가 아닌 모든 비전능 작업에서 CLIP를 능가합니다.

**Patch-size picking.**작은 모델은 16×16 (ViT-B/16) 를 사용한다. 밀도 예측 (분열) 은 8×8 또는 14×14 (SAM, DINOv2) 를 사용한다. 매우 큰 모델은 14×14을 사용한다.

## 선박

보시다시피`outputs/skill-vit-configurator.md`. 기술은 데이터 세트 크기와 해상도, 계산 예산을 고려하여 새로운 비전 작업에 ViT 변종과 패치 크기를 선택합니다.

## 운동

1. **Easy.**달아`code/main.py`. 패치의 수를 확인해 보세요`(H/P) * (W/P)`그리고 평면 패치 크기는 같죠`P*P*C`- 그래
2. **Medium.**2D 시노수다형 위치 임베디션을 구현  두 개의 독립된 시노수다형 코드`row`그리고`col`각 패치의 콤카테네드, 작은 PyTorch ViT에 넣고 CIFAR-10에 있는 정확한 위치 임베디션과 학습 가능한 임베디션을 비교합니다.
3. **Hard.**3층 ViT (PyTorch) 를 구축하고, 4×4 패치로 1,000개의 MNIST 이미지를 훈련시켜 테스트 정확도를 측정합니다. 이제 동일한 1,000개의 이미지에 DINOv2 사전 훈련을 추가합니다. (단순하게 설명하자면, 코더를 훈련시켜 마스크된 패치에서 패치 임베디션을 예측하는 것) 정확도가 향상되나요?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Patch | "The vision-transformer token" | Flat vector of pixel values for a `P × P × C` region of the image. |
| Patchify | "Chop + flatten" | Slice image into non-overlapping patches, flatten each to a vector. |
| `[CLS]` token | "The image summary" | Prepended learnable token; its final embedding is the image representation. |
| Inductive bias | "What the model assumes" | ViT has fewer priors than CNNs; needs more data to make up the gap. |
| DINOv2 | "Self-supervised ViT" | Trained without labels using image augmentation + momentum teacher. Best general image features in 2026. |
| SigLIP | "CLIP's successor" | ViT + text encoder trained with sigmoid contrastive loss; better than CLIP on matched compute. |
| Swin | "Windowed ViT" | Hierarchical ViT with local attention + shifted windows; sub-quadratic. |
| Register tokens | "2023 trick" | A few extra learnable tokens that soak up attention sinks; improves DINOv2 features. |

## 더 많은 읽기

- [Dosovitskiy et al. (2020). An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929) 비트 논문
- [Touvron et al. (2021). Training data-efficient image transformers & distillation through attention](https://arxiv.org/abs/2012.12877) 
- [Liu et al. (2021). Swin Transformer: Hierarchical Vision Transformer using Shifted Windows](https://arxiv.org/abs/2103.14030) 스윙
- [Oquab et al. (2023). DINOv2: Learning Robust Visual Features without Supervision](https://arxiv.org/abs/2304.07193) DINOv2
- [Darcet et al. (2023). Vision Transformers Need Registers](https://arxiv.org/abs/2309.16588) DINOv2의 등록 표지판 수정
