# CLIP 및 비전적 시각 언어 사전 훈련

> OpenAI의 CLIP (2021) 은 다음 5년간 발전할 만큼 큰 하나의 아이디어를 증명했습니다. 화면 공간에 이미지 코더와 텍스트 코더를 배치하여 험난한 웹 이미지 캡션 커플을 사용하여 대조적인 손실을 가져옵니다. 감시된 표지판은 없습니다. 400만 쌍 결과물 임베디션 공간은 제로샷 분류, 이미지 텍스트 검색, 그리고 2026 VLM를 모든 비전 탑으로 연결합니다. SigLIP 2 (2025) 는 softmax을 sigmoid로 대체하고, 저렴한 비용으로 CLIP를 넘어 확장되었다. 이 수업은 InfoNCE에서 sigmoid 쌍방향 손실까지 수학을 진행하고 stdlib 파이썬에서 훈련 단계를 구축합니다.

**Type:** Build
**Languages:** Python (stdlib, InfoNCE + sigmoid loss implementations)
**Prerequisites:** Phase 12 · 01 (ViT patches), Phase 7 (Transformers)
**Time:** ~180 minutes

## 학습 목표

- 상호 정보로부터 InfoNCE 손실을 도출하고 수치적으로 안정된 벡터화된 버전을 구현한다.
- 왜 sigmoid pairwise loss (SigLIP) 가 전체적으로 모인 표면 온드맥스 요구 없이 32768+ 배트까지 확장되는지를 설명하십시오.
- 텍스트 템플릿을 구성하여 0 샷 이미지넷 분류를 실행 (`a photo of a {class}`) 과 argmax 을 코시네 유사성 보다 더 많이 복용한다.
- CLIP/SigLIP 사전 훈련에서 얻을 수 있는 네 가지 레버를 명명하라: 대량 크기, 온도, 프롬프트 템플릿, 데이터 품질.

## 문제

CLIP 이전 비전은 감독되었다. 라벨된 데이터 세트를 수집 (이메이지네트: 1.2M 이미지, 1000 클래스), CNN를 훈련시키고 배송합니다. 라벨은 비싸고, 라벨은 레이블 업체가 합의할 수 있는 것에 편향되며, 라벨은 정밀한 조정 없이 새로운 작업에 전송되지 않습니다.

이미지 캡션 웹은 100억 개 이상의 느슨하게 표시된 쌍을 무료로 제공합니다. "공원에서 내 개 맥스"라는 다른 텍스트를 가진 황금 리트리버의 사진에는 감독 신호가 있습니다. 텍스트는 이미지를 설명합니다.

CLIP의 대답은: 이미지 캡션 쌍을 일치하는 작업으로 간주하십시오. N 이미지 및 N 캡션의 무리를 고려하면, N-1 분광기들에 대한 각각의 이미지를 자신의 캡션과 일치시키는 것을 배우십시오. 감독은 "이 두 가지가 함께 속하지만, 이 N-1는 그렇지 않습니다". 클래스 레이블이 없습니다. 인간 해설이 없습니다. 단지 대조적 손실입니다.

이 결과물 임베디션 공간은 CLIP가 훈련받은 것보다 더 많은 것을 수행합니다. 이미지넷은 0 촬영이 작동합니다. 왜냐하면 "고양이의 사진"이 고양이의 사진 근처에 임베디션되기 때문입니다. 고양이가 명시적으로 표시되지 않은 고양이입니다. 이것은 2026 VLM를 낳은 베팅입니다.

## 개념

### 이중 코딩

CLIP에는 두 개의 탑이 있습니다.

- 이미지 코더`f`: ViT 또는 ResNet, 각 이미지에 D-dim 벡터를 출력합니다.
- 텍스트 코더`g`: 작은 트랜스포머, 각 캡션에 D-dim 벡터를 내보내죠.

두 탑 모두 출력을 단위 길이로 정상화합니다.`cos(f(x), g(y)) = f(x)^T g(y)`둘 다 단위 규범이기 때문에

$N$(사진, 캡션) 쌍, 유사성 행렬을 구축합니다`S`모양의`(N, N)`이 부분의 본문은

```math
S[i, j] = \cos(f(x_i), g(y_j)) / \tau
```

어디`tau`학습된 온도 (CLIP는 0.07로 초기화된다; 로그 공간에서 학습된다).

### 인포NCE 손실

CLIP는 행과 열에 대한 대칭적 십계 엔트로피를 사용합니다.

```
loss_i2t = CE(S, labels=identity)     # each image's positive is its own caption
loss_t2i = CE(S^T, labels=identity)   # each caption's positive is its own image
loss = (loss_i2t + loss_t2i) / 2
```

이 는 InfoNCE 입니다. CE 의 소프트맥스는 각 이미지가 배트의 다른 모든 캡션보다 더 많은 캡션과 일치하도록 강요합니다. "네기티브"는 다른 배트의 항목입니다. 더 큰 배트 = 더 많은 부정적인 = 더 강한 신호. CLIP는 배트 32k에서 훈련되어 있습니다. 규모는 중요합니다.

### 온도

`tau`부드러운 최대의 날카롭게 조절합니다.$\tau$→ 급격한 분포, 강렬한 부정적인 광산 효과.$\tau$→ 부드러운, 모든 샘플이 기여합니다. CLIP는 배운다 $\log(1/\tau)$, 붕괴를 방지하기 위해 절단. SigLIP 2 초기 수정$\tau$그리고 배워진 편견을 사용합니다.

### 왜 시그모이드 척도가 더 잘 나가는가 (SigLIP)

소프트맥스는 전체 유사성 매트릭스를 동기화시켜야 합니다. 분산 훈련에서는 모든 임베디션을 모든 복제에 모두 모아야 합니다.

SigLIP는 softmax를 요소별로 시그모이드로 대체합니다: 각 쌍에 대해 `(i, j)`, 손실은 "이것들이 일치하는 쌍입니까?"의 바이너리 분류입니다. 긍정적 클래스 레이블은 디아그널이고, 다른 모든 것은 부정적입니다. 손실은:

```math
L = -\frac{1}{N} \sum_{(i, j)} \Big[ y_{ij} \log \mathop{\mathrm{sigmoid}}(S[i,j]) + (1-y_{ij}) \log \mathop{\mathrm{sigmoid}}(-S[i,j]) \Big]
```

`y_ij = 1`만약`i == j`각 쌍의 손실은 독립적입니다. 모든 집합이 필요하지 않습니다. 각 GPU는 지역 블록과 수를 계산합니다. SigLIP 2는 32k-512k 배치를 저렴하게 확장합니다. CLIP는 비례적으로 더 많은 통신이 필요합니다.

### 0샷 분류

N 클래스 이름을 부여하면 각 클래스에 텍스트 템플릿을 생성합니다.

```
"a photo of a {class}"
```

각 템플릿을 텍스트 코더로 삽입하세요. 이미지를 이미지 코더로 삽입하세요. Argmax cosine 유사성 = 예측 클래스. 대상 클래스에 대한 훈련이 없습니다.

임플릿 템플릿은 중요하다. CLIP의 원래 논문은 한 클래스에 80 템플릿 (평평, 예술, 사진, 그림, 등) 을 사용했으며 임베디션을 평균했다. +3 이미지넷 포인트. 현대 사용은 일반적으로 한 또는 두 템플릿을 선택합니다.

### 선형 탐사선과 정렬

제로샷은 기본이다. 선형 탐사선 (목적 클래스용 냉동 CLIP 기능 위에 한 선형 층을 훈련) 은 도메인 내 작업에 제로샷을 이겨줍니다. 완전한 미세 조정은 도메인 내 선형 탐사선보다 더 낫지만, 제로샷 전송에 영향을 줄 수 있습니다. 세 개의 타협이있는 세 가지 정제.

### SigLIP 2: NaFlex 및 밀집한 특징

SigLIP 2 (2025) 는 다음과 같이 추가합니다.
- NaFlex: 단일 모델은 변하는 측면 비율과 해상도를 처리합니다.
- 더 좋은 밀도가 높은 특징은 세그먼트 및 깊이 추정, VLM에서 얼어붙은 척추로 사용하는 것을 목표로합니다.
- 다국어: CLIP가 영어만 사용된 100개 이상의 언어로 교육을 받았습니다.
- 1B 파라마 스칼라, CLIP가 400m에서 최고를 차지했습니다.

2026 년 오픈 VLM 에서 SigLIP 2 SO400m/14 는 기본 시각 탑입니다. 특정 LAION-2B 훈련 배포가 귀하의 쿼리 패턴과 일치하는 순수한 이미지 텍스트 검색의 기본 설정으로 CLIP는 남아 있습니다.

### ALIGN, BASIC, OpenCLIP, EVA-CLIP

ALIGN (Google, 2021): CLIP와 동일한 아이디어, 1.8B 쌍용 스케일, 90% 노이즈. 입증 된 노이즈 데이터 스케일. OpenCLIP (LAION): LAION-400M / 2B에 CLIP의 개방형 재생, 여러 스케일, 개시 체크포인트. EVA-CLIP: 마스크된 이미지 모델링에서 초기화; VLM에 대한 강력한 척추. BASIC: 구글의 CLIP+ALIGN 하이브리드. 모든 것은 동일한 가족, 다른 데이터 및 조율.

### 0 발작 천장

CLIP 클래스 모델은 76%에 달하는 이미지넷 제로샷 (CLIP-G, OpenCLIP-G) 을 제한한다. 그 밖에는 훨씬 더 큰 데이터 (SigLIP 2는 80%+를 얻는다) 또는 아키텍처 변경 (감독된 헤드, 더 많은 매개 변수) 이 필요합니다. 기준은 포화적입니다. 실제 가치는 하류 VLM가 소비하는 임베딩 공간입니다.

```figure
multimodal-fusion
```

## 사용 하 고

`code/main.py`이 도구는

1. 장난감 이중 앵코더 (해시 기반 이미지 기능, 텍스트 차 기능) 를 사용하여 numpy 없이 InfoNCE 모양을 볼 수 있습니다.
2. 순수한 파이썬에서 InfoNCE 손실 (log-sum-exp을 통해 수학적 안정성).
3. 비교하기 위해 Sigmoid 쌍별 손실
4. 0 샷 분류 루틴: 텍스트 명령어 집합에 대한 코시네 유사성을 계산, 예측을 위해 argmax.

절대 숫자는 장난감이고, 모양은 실제 CLIP 트레이너의 발광과 일치합니다.

## 선박

이 교훈은`outputs/skill-clip-zero-shot.md`. 이미지 집합 (길로) 및 목표 클래스 목록을 고려하면 CLIP 템플릿으로 텍스트 명령어를 생성하고, 두 측면을 명시된 체크포인트로 임베디드합니다 (예를 들어, `openai/clip-vit-large-patch14`), 그리고 유사점 점수를 가진 상위-1 / 상위-5 예측을 반환합니다. 기술은 요청 목록에 포함되지 않은 클래스에 대한 주장을 거부합니다.

## 운동

1. 4쌍의 배치를 위해 InfoNCE를 손으로 구현하십시오. 4x4 유사성 행렬을 구성하고 softmax를 실행하고, 디아그널을 선택하고, 크로스 엔트로피를 계산합니다. 이 수동 계산에 따라 파이썬 구현을 확인합니다.

2. SigLIP는 편향 매개 변수를 사용합니다 `b`온도를 추가로: `S'[i,j] = S[i,j]/tau + b`어떤 역할이 있을까요?`b`배트가 큰 클래스 불균형을 가지고 있는 경우 (열당 양점보다 훨씬 더 많은 음점) 플레이하십시오. SigLIP 섹션 3 (arXiv:2303.15343) 을 참조하십시오.

3. 고양이와 개에 대한 0샷 분류기를 만들십시오. 두 개의 빠른 템플릿을 시도하십시오.`a photo of a {class}`그리고`a picture of a {class}`100개의 테스트 이미지에 대한 정확도를 측정하세요.

4. 512GPU 실행에 대해 2 쌍으로 Softmax InfoNCE와 sigmoid의 통신 비용을 계산합니다.$O(N)$, 즉$O(N^2)$SigLIP 섹션 4을 인용하세요.

5. OpenCLIP 스칼링 법칙 논문을 읽어보십시오 (arXiv:2212.07143, Cherti et al.). 데이터 스칼링에 대한 결론을 수치에서 재현하십시오. 고정된 모델 크기에서, ImageNet의 제로샷 정확성과 훈련 데이터 크기의 로그 라인 관계는 무엇입니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| InfoNCE | "Contrastive loss" | Cross-entropy over a batch's similarity matrix; each item's positive is its paired item, negatives are everything else |
| Sigmoid loss | "SigLIP loss" | Per-pair binary cross-entropy; no softmax, no all-gather, scales cheaply in distributed training |
| Temperature | "tau" | Scalar that scales logits before softmax/sigmoid; controls sharpness of the distribution |
| Zero-shot | "no-finetune classification" | Use text prompts to construct class embeddings and classify by cosine similarity; no training on target classes |
| Prompt template | "a photo of a ..." | Text scaffold around a class name; affects zero-shot accuracy by 1-5 points |
| Dual encoder | "Two-tower" | One image encoder + one text encoder, outputs in shared D-dim space |
| Hard negative | "Tough distractor" | A negative similar enough to the positive that the model has to work to separate them |
| Linear probe | "Frozen + one layer" | Train only a linear classifier on top of frozen features; measures feature quality |
| NaFlex | "Native flexible resolution" | SigLIP 2 capability to ingest images at any aspect ratio and resolution without resizing |
| Temperature scaling | "log-parametrized tau" | CLIP parametrizes `log(1/tau)` so gradients behave; clips to prevent collapse to near-zero tau |

## 더 많은 읽기

- [Radford et al. — Learning Transferable Visual Models From Natural Language Supervision (arXiv:2103.00020)](https://arxiv.org/abs/2103.00020) CLIP 논문
- [Zhai et al. — Sigmoid Loss for Language Image Pre-Training (arXiv:2303.15343)](https://arxiv.org/abs/2303.15343) SigLIP
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) 다국어 + NaFlex
- [Jia et al. — ALIGN (arXiv:2102.05918)](https://arxiv.org/abs/2102.05918)  음성 웹 데이터로 확장
- [Cherti et al. — Reproducible scaling laws for contrastive language-image learning (arXiv:2212.07143)](https://arxiv.org/abs/2212.07143) OpenCLIP 확장법
