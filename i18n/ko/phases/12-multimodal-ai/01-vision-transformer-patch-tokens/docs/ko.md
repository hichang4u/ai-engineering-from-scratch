# 시력 변환기 와 패치 토큰 원시

> 멀티모달적인 것은 이미지가 트랜스포머가 먹을 수 있는 토큰의 연속으로 바뀌어야 합니다. 2020년 ViT 논문은 16x16 픽셀 패치, 선형 투명 및 위치 임베디션으로 이에 답했습니다. 5년 후 모든 2026 국경 모델 (Claude Opus 4.7 2576px 네이티브, Gemini 3.1 Pro, Qwen3.5-Omni) 은 여전히 이렇게 시작됩니다. 이 수업은 패치 토큰 파이프라인을 끝에서 끝으로 읽고 Stdlib 파이썬에서 구축합니다. 그래서 12단계의 나머지 부분은 "비जु얼 토큰"에 대한 구체적인 정신적 모델을 가지고 있습니다.

**Type:** Learn
**Languages:** Python (stdlib, patch tokenizer + geometry calculator)
**Prerequisites:** Phase 7 (Transformers), Phase 4 (Computer Vision)
**Time:** ~120 minutes

## 학습 목표

- HxWx3 이미지를 올바른 위치 코딩으로 패치 토큰의 연속으로 변환합니다.
- 주어진 ViT (패치 크기와 해상도, 숨겨진 희미성, 깊이) 의 계열 길, 매개 변수 수와 FLOP를 계산한다.
- 2020 연구에서 2026 생산까지 ViT를 가져온 세 가지 업그레이드를 명명하십시오: 자율 감독 사전 훈련 (DINO / MAE), 등록 토큰 및 네이티브 해상도의 패키징.
- CLS 펀딩, 평균 펀딩, 그리고 하류 작업에 대한 토큰 등록을 선택하십시오.

## 문제

트랜스포머는 벡터들의 순서대로 작동한다. 텍스트는 이미 순서 (바이트 또는 토큰) 이다. 이미지는 3 가지 색채 채널이 있는 2D 픽셀 그리드이다.

2020년 이전 접근 방식은 CNN 기능 추출기를 앞면으로 어 넣었습니다. ResNet는 2048-dim 벡터의 7x7 기능 지도를 생성하고, 그 49 개의 토큰을 트랜스포머에 공급합니다. 이것은 작동하지만 CNN의 편향 (번역 적분, 지역 수용 필드) 을 상속하고 트랜스포머의 규모에 대한 식욕을 잃습니다.

도소비츠키 등 (2020) 은 명백한 질문을 던졌습니다. CNN를 건너뛰면 어떨까요? 이미지를 고정 크기의 패치로 나눌 수 있습니다 (예컨대 16x16 픽셀) 각 패치를 선형적으로 벡터로 프로젝하고 위치 임베디션을 추가하고 밸닐 트랜스포머에 순서를 공급합니다. 당시 이것은 이단적이었죠. 충분한 데이터 (JFT-300M, LAION) 를 가지고, 그것은 이미지넷에서 레스넷을 제치고 계속 개선했습니다.

2026년까지 ViT 원시형은 의심의 여지가 없는 기초입니다. 모든 오픈 웨이트 VLM의 시력탑은 어떤 후손 (DINOv2, SigLIP 2, CLIP, EVA, InternViT) 이다. 문제는 더 이상 "우리는 패치를 사용해야 하는가?"가 아니라 "어떤 패치 크기와 어떤 해상도 스케줄, 어떤 사전 훈련 목표, 어떤 위치 코딩"입니다.

## 개념

### 패치 (Patch) 는 토큰으로

이미지가 주어져`x`모양의`(H, W, 3)`그리고 패치 크기가`P`, 당신은 그 이미지를 그릴 수 있습니다`(H/P) x (W/P)`겹치지 않는 패치.`P x P x 3`픽셀의 큐브. 각 큐브를 1으로 평평하게`3 P^2`벡터. 공유 선형 투구를 적용합니다 `W_E`모양의`(3 P^2, D)`각 패치를 모델의 숨겨진 차원에 지도화하기 위해`D`- 그래

ViT-B/16 가공성 구성에 대해서는:
- 결제 224, 패치 크기가 16 → 그리드 14x14 → 196 패치 토큰.
- 각 패치는`16 x 16 x 3 = 768``D = 768`- 그래
- 학습 가능한 것을 추가합니다`[CLS]`토큰 → 순서 길이는 197.

패치 투영은 2D 커널 크기의 convolution와 수학적으로 동일합니다`P`, 발걸음`P`그리고`D`출력 채널. 이것이 실제로 생산 코드에서 구현되는 방법입니다`nn.Conv2d(3, D, kernel_size=P, stride=P)`"선형 투사" 프레임링은 개념적이며, 커널 프레임링은 효율적이다.

### 위치 임베디션

패치들은 본질적인 순서가 없습니다. 변압기는 그것들을 가방으로 본다. 초기 ViTs는 학습 가능한 1D 위치 임베디션을 추가했습니다. 위치마다 768-dim 벡터, 197 개). 작동하지만 모델을 훈련 해상도에 연결합니다. 결론적으로 그릴 변경하면 위치 테이블을 중점해야합니다.

현대 시각 척추는 2D-RoPE (Qwen2-VL의 M-RoPE, SigLIP 2의 기본) 또는 2D 위치를 가중화합니다. 2D-RoPE는 패치의 (열, 열) 지표를 기반으로 질의와 키 벡터를 회전합니다. 따라서 모델은 회전 각에서 상대적인 2D 위치를 추론합니다. 위치 테이블은 없습니다. 모델은 추론에서 임의의 그리드 크기를 처리합니다.

### CLS 토큰, 합동 출력 및 레지스터 토큰

이미지 수준에서의 표현은 무엇일까요? 3가지 선택이 공존합니다.

1. `[CLS]`토큰. 패치 순서로 학습 가능한 벡터를 준비하십시오. 모든 트랜스포머 블록 후에, CLS 토큰의 숨겨진 상태는 이미지 표현입니다. BERT에서 상속되었습니다. 원래 ViT, CLIP에서 사용되었습니다.
2. 평균 풀, 패치 토큰의 출력 평균 숨겨진 상태, SigLIP, DINOv2에서 사용되고, 대부분의 현대 VLM에서 사용되고 있습니다.
3. 레지스터 토큰. Darcet et al. (2023) 는 명시적 싱크 토큰 없이 훈련된 ViTs가 자기주의를 납치하는 고 표준 "예물" 패치를 개발한다는 것을 관찰했다. 416 학습 가능한 레지스터 토큰을 추가하면 이 부하를 흡수하고 밀도 예측 품질 (분열, 깊이) 을 향상시킵니다. DINOv2와 SigLIP 2 모두 레지스터를 탑재합니다.

선택은 하류 작업에 중요합니다. CLS는 분류에 적합합니다. LLM에 패치 토큰을 공급하는 VLM에 대해, 당신은 완전히  모든 패치가 LLM 입력 토큰이됩니다. 레지스터는 전달 전에 폐기됩니다 (그들은 스캐플라딩, 콘텐츠가 아닙니다).

### 사전 훈련: 감독, 반조, 마스크, 자발적으로 디스틸

2020년 ViT는 JFT-300M에 대한 감독 분류로 미리 훈련되었다.

- CLIP (2021): 400M 쌍에 대한 대조적인 이미지 텍스트.
- MAE (2021, He et al.): 75%의 패치를 마스크하고, 픽셀을 재구성한다. 자율 감독, 순수한 이미지에 작동한다.
- DINO (2021) / DINOv2 (2023): 학생과 교사와 함께 자독, 라벨도 없고 캡션도 없습니다. 2023 DINOv2 ViT-g/14는 가장 강력한 순전히 시각적 척추이며 "밀착 특징"의 사용 사례에 기본입니다.
- SigLIP / SigLIP 2 (2023, 2025): 시그모이드 손실과 네이티브 화면 비율을 위한 CLIP 및 NaFlex. 2026 년 열중 VLM (Qwen, Idefics2, LLaVA-OneVision) 에서 지배적인 시력 탑.

사전 훈련의 선택은 척추가 어떤 데 적합하는지 결정합니다. 문자와 의미적 일치를 위해 CLIP/SigLIP, 팽창한 시각적 특징을 위해 DINOv2, 하류 미세 조정의 출발점으로 MAE.

### 스케일링 법칙

ViT 스칼링 (Zhai et al. 2022) 은 ViT의 품질이 모델 크기, 데이터 크기 및 계산에 대한 예측 가능한 법칙을 준수한다는 것을 확인했습니다. 고정 계산에서는:
- 더 큰 모델 + 더 많은 데이터 → 더 좋은 품질.
- 패치 크기는 염기 길이와 충실성에 대한 레버입니다. 패치 14 (DINOv2/SigLIP SO400m에 전형적인) 는 패치 16보다 더 많은 토큰을 이미지 당 제공합니다. OCR 및 밀집한 작업에 더 좋으며 속도에도 더 나쁘습니다.
- 해상도는 다른 큰 레버입니다. 224에서 384에서 512까지 가는 것은 거의 항상 도움이 됩니다. FLOP에서 사각형 비용으로.

ViT-g/14 (1B 패스 14, 해상도 224 → 256 토큰) 과 SigLIP SO400m/14 (400M 패스 14) 는 2026 개장 VLM에 대한 두 개의 작업마리의 코더입니다.

### ViT의 매개 변수 수

전체 계산은`code/main.py`- ViT-B/16 224번

```
patch_embed = 3 * 16 * 16 * 768 + 768  =  591k
cls + pos    = 768 + 197 * 768          =  152k
block        = 4 * 768^2 (QKVO) + 2 * 4 * 768^2 (MLP) + 2 * 2*768 (LN)
             = 12 * 768^2 + 3k          =  7.1M
12 blocks    = 85M
final LN    = 1.5k
total       ≈ 86M
```

체크포인트를 로드하기 전에 모든 VT를 이렇게 정합하세요. 척추 크기는 하류 VLM에서 VRAM 바닥을 설정합니다.

### 2026 생산 구성

2026년에 가장 개방된 VLM의 코더는 SigLIP 2 SO400m/14 (내용 해상도 NaFlex) 이다.
- 400m 매개 변수
- 패치 크기는 14, 기본 해상도는 384 → 729 패치 토큰입니다.
- 이미지 레벨 작업에 대한 평균 풀; VQA의 LLM에 모든 729 패치가 흐른다.
- 4개의 등록 토큰이 LLM를 넘겨주기 전에 폐기되었습니다.
- 2D-RoPE, 네이티브 화면 비율을 위한 이미지 레벨 스케일링

그 모든 결정은 당신이 읽을 수 있는 논문에 대한 것입니다.

```figure
image-patch-tokens
```

## 사용 하 고

`code/main.py`패치 토케니저와 기하학 계산기를 가지고 있습니다. (상 H, W, 패치 P, 숨겨진 D, 깊이 L) 그리고 보고합니다:

- 패치 후 그리드 모양과 염기 길이
- 합성 8x8 픽셀 장난감 이미지의 토큰 순서 (평평 + 프로젝트 경로를 통해 걸어)
- 패치 임베드, 위치 임베드, 트랜스포머 블록, 헤드로 나뉘어 있는 파라미터 카운트
- 목표 해상도에 대한 전진 패스당 FLOP
- ViT-B/16 @ 224, ViT-L/14 @ 336, DINOv2 ViT-g/14 @ 224, SigLIP SO400m/14 @ 384의 비교 테이블

실행하세요. 기호의 숫자를 출판된 숫자와 일치시켜 보인 값과 해상도를 측정해 보인 값을 감지하세요.

## 선박

이 교훈은`outputs/skill-patch-geometry-reader.md`. ViT 구성 (패치 크기와 해상도, 숨겨진 희미성, 깊이) 을 고려하면, 토큰 수, 매개 변수 수, 그리고 VRAM 추정치를 정당화 할 수 있습니다. VLM를 위해 비전 척추를 선택할 때마다 이 기술을 사용하십시오.

## 운동

1. 패치 토큰 순서 길이를 계산하여 Qwen2.5-VL를 네이티브 1280x720 입력으로 패치 크기로 14. CLS에서만 표시되는 것과 비교되는 방법은 무엇입니까?

2. 패치 14의 1080p 프레임 (1920x1080) 은 얼마나 많은 토큰을 생산합니까? 5 분짜리 비디오에서 30 FPS로, 전체 시각 토큰은 얼마나 많은가? 어떤 비용은 가장 많이 절약합니까?

3. 순수한 파이썬에서 패치 토큰에 대한 평균 펀딩을 구현하십시오. DINOv2 출력에서 196 개 이상의 평균 토큰이 모델의 평균 토큰과 일치하는지 확인합니다.`forward`복합 임베디션을 요청할 때 반환합니다.

4. "비전 변환기 는 레지스터 를 필요로 한다" (arXiv:2309.16588) 의 3부 를 읽어 보십시오. 레지스터 가 어떤 유물 을 흡수 하는 지, 그리고 하류 밀도가 높은 예측 에 있어서 왜 중요 한 지 두 문장 로 설명 하십시오.

5. 수정`code/main.py`패치-n'-팩을 지원하기 위해: 각 분해의 이미지 목록을 제공하면 단일 패키 된 순서와 블록 다이아곤 주의 마스크를 생성하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Patch | "16x16 pixel square" | A fixed-size non-overlapping region of the input image; becomes one token |
| Patch embedding | "Linear projection" | A shared learned matrix (or Conv2d with stride=P) mapping flattened patch pixels to D-dim vectors |
| CLS token | "Class token" | Prepended learnable vector whose final hidden state represents the whole image; optional in 2026 |
| Register token | "Sink token" | Extra learnable tokens that absorb the high-norm attention artifacts ViTs develop during pretraining |
| Position embedding | "Positional info" | Per-position vector or rotation making the sequence-order-aware; 2D-RoPE is the modern default |
| Grid | "Patch grid" | The (H/P) x (W/P) 2D array of patches for a given resolution and patch size |
| NaFlex | "Native flexible resolution" | SigLIP 2 feature: single model serves multiple aspect ratios and resolutions without retraining |
| Backbone | "Vision tower" | The pretrained image encoder whose patch-token outputs feed the LLM in a VLM |
| Pooling | "Image-level summary" | Strategy to turn patch tokens into one vector: CLS, mean, attention pool, or register-based |
| Patch 14 vs 16 | "Finer vs coarser grid" | Patch 14 produces more tokens per image, better fidelity for OCR, slower; patch 16 is the classic default |

## 더 많은 읽기

- [Dosovitskiy et al. — An Image is Worth 16x16 Words (arXiv:2010.11929)](https://arxiv.org/abs/2010.11929) 원래의 ViT
- [He et al. — Masked Autoencoders Are Scalable Vision Learners (arXiv:2111.06377)](https://arxiv.org/abs/2111.06377) MAE, 자율 감독 사전 훈련.
- [Oquab et al. — DINOv2 (arXiv:2304.07193)](https://arxiv.org/abs/2304.07193) 자발적으로 비료가 필요하며, 표지가 없습니다.
- [Darcet et al. — Vision Transformers Need Registers (arXiv:2309.16588)](https://arxiv.org/abs/2309.16588) 로큰 등록 및 유물 분석
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786)2026년 기본 시각탑
- [Zhai et al. — Scaling Vision Transformers (arXiv:2106.04560)](https://arxiv.org/abs/2106.04560) 경험적 확장 법칙
