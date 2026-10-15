# 시각적 오토레그레시브 모델링 (VAR): 다음 규모 예측

> 확산 모델은 시간에 따라 반복적으로 샘플을 샘플링합니다. VAR 샘플은 스케일에서 반복적으로 1x1 토큰, 2x2, 4x4 토큰을 예측합니다. 각 스케일 조건은 이전에 따라 최종 해상까지합니다. 2024 논문에서는 VAR가 이미지 생성을위한 GPT 스타일의 확장 법칙과 일치하고 같은 컴퓨팅 예산에서 DiT를 제치고 있음을 보여주었습니다. 이 수업은 핵심 메커니즘을 구축합니다.

**Type:** Build
**Languages:** Python (with PyTorch)
**Prerequisites:** Phase 7 Lesson 03 (Multi-Head Attention), Phase 8 Lesson 06 (DDPM)
**Time:** ~90 minutes

## 문제

오토레그레시브 세대 (autoregressive generation) 는 예측 가능한 스케일링으로 언어 모델링을 지배했다: 더 많은 컴퓨팅, 더 많은 매개 변수, 더 낮은 혼란, 더 나은 출력. 이미지 생성은 2024 년 이전에 두 가지 주요 AR 시도를했습니다. PixelRNN/PixelCNN (피클스-비-피클스) 및 DALL-E 1 / Parti / MuseGAN (VQ-VAE 코드에서 토큰-비-토큰).

두 개의 픽셀은 2D 그리드에서 배치되어 있지만 AR 모델은 1D 라스터 순서로 방문해야 합니다. 초기 코너 픽셀은 결국 이미지가 어떤 모습으로 변하는지 전혀 알지 못합니다.

VAR는 생성되는 것을 변경함으로써 생성 순서 문제를 해결합니다. VAR는 공간에서 이미지 토큰을 하나씩 예측하는 대신, 해상도를 증가시키는 전체 이미지를 예측합니다. 단계 1: 1x1 토큰을 예측합니다. 단계 2: 토큰의 2x2 그리드를 예측합니다. 단계 3: 4x4 그리드를 예측합니다. 단계 K: 최종 (H/8) x (W/8) 그리드를 예측합니다.

각 스케일은 이전 모든 스케일을 (사유적으로 " 스케일 순서") 그리고 자체 스케일의 안에서의 평행성을 돌보며, 순서 문제는 사라집니다. 스케일 k의 전체 이미지는 하나의 트랜스포머 패스에서 생성됩니다.

## 개념

### VQ-VAE 다중 규모 토큰화

VAR는 **multi-scale discrete tokenizer**- 사진으로$x$, 그것은 점차적으로 더 높은 해상도의 토큰 그리드들의 순서를 생성합니다:

```
x -> encoder -> latent f
f -> tokenize at 1x1: token grid z_1 of shape (1, 1)
f -> tokenize at 2x2: token grid z_2 of shape (2, 2)
...
f -> tokenize at (H/p)x(W/p): token grid z_K of shape (H/p, W/p)
```

각각$z_k$같은 코드북 (정상적 크기는 4096-16384) 을 사용 합니다. 각 스케일의 토큰화는 독립적이지 않습니다.$f$이 부분의 본문은

```math
f \approx \mathop{\mathrm{upsample}}(\mathop{\mathrm{embed}}(z_1), \text{target\_size}) + \cdots + \mathop{\mathrm{upsample}}(\mathop{\mathrm{embed}}(z_K), \text{target\_size})
```

이건 **residual VQ**변종.$k$어떤 척도를 잡는지$1 \ldots k-1$디코더는 모든 스케일 임베디션의 합을 가지고 이미지를 생성합니다.

다중 규모의 VQ 토케니저는 한 번 훈련 (VQGAN와 같은) 을 받고, 그 다음 얼어붙습니다. 모든 생성 작업은 위에 있는 오토레그레시브 모델에 의해 수행됩니다.

### 다음 규모 의 예측

생성 모델은 전의 모든 스케일에서 토큰을 볼 수 있는 트랜스포머이며 다음 스케일에서 토큰을 예측합니다.

입력 순서 구조:
```
[START, z_1 tokens, z_2 tokens, z_3 tokens, ..., z_K tokens]
```

위치 임베디션은 스케일 인덱스와 스케일 내 공간적 위치를 모두 암호화합니다. 주의는 스케일 순서로 인과적입니다.$k$, 위치$(i, j)$모든 토큰을 스케일에서 볼 수 있습니다$1 \ldots k$그리고 규모의 토큰에$k$그 자체는 어떤 규모 내 순서로 사용되더라도 이전으로 나타납니다 (VAR는 규모 내의 인과관계를 갖지 않고 고정된 위치 주의를 사용합니다.

훈련 손실: 각 규모$k$, 토큰을 예측$z_k$전격 VQ 코드에서 크로스 엔트로피 손실. "열"을 제외한 GPT와 동일한 구조는 이제 규모 구조입니다.

### 세대

결론은
```
generate z_1 = sample from p(z_1)                    # 1 token
generate z_2 = sample from p(z_2 | z_1)              # 4 tokens in parallel
generate z_3 = sample from p(z_3 | z_1, z_2)         # 16 tokens in parallel
...
decode: f = sum of embed-and-upsample scales 1..K
image = VAE_decoder(f)
```

$K = 10$스케일, 생성은 10 개의 트랜스포머 앞 패스입니다. 각 패스는 전체 스케일을 병렬로 생성합니다. 스케일 내에서 단표 자동 퇴행이 없습니다. 256x256 이미지에서는 대략 10 개의 패스와 DiT의 28-50입니다.

### 다음 규모 는 다음 규모 를 상대로 승리 하는 이유

세 가지 구조적인 승리가 있습니다.
1. **Coarse-to-fine aligns with natural image statistics.**인간의 시각적 인식과 이미지 데이터 세트는 모두 규모에 의존하는 규칙성을 나타냅니다. 낮은 주파수 구조는 안정적이고 예측 가능하며, 높은 주파수 세부 사항은 낮은 주파수 내용에 의존합니다. 다음 규모 예측은 이것을 활용합니다.
2. **Parallel generation within scale.**GPT형 토큰 AR와 달리 VAR는 하나의 단계에서 모든 토큰을 스케일에서 생성합니다. 효과적인 생성 길이는 선형이 아닌 로그 스케일입니다.
3. **No generation order bias.**k 규모의 토큰은 모든 규모 k-1를 볼 수 있습니다. 늦은 맥락이 사용되기 전에 초기 토큰이 약속하도록 강요하는 "왼쪽" 또는 " 위에" 편향이 없습니다.

### 스케일링 법칙

천 등 VAR가 미미네트에서 FID를 위한 권력법 확장 곡선을 따라가며, GPT가 미미네트에서 미미네트 (GPT) 를 따라가기 때문에 파라미터 또는 계산을 두 배로 하면 오류가 절반으로 줄어들 수 있습니다. 이것은 언어 모델만큼이나 깔끔하게 이런 스케일링 행동을 보여주는 최초의 이미지 생성 모델이었습니다. 그 결과 VAR 스케일 예측은 각 건축물에 대한 경험적 추측이 아닌 계산에서 예측이 가능해집니다.

### 전파 와의 관계

VAR와 디스푸전은 동일한 데이터 압축 스토리를 공유합니다. 둘 다 생성 문제를 더 쉬운 하위 문제로 나눕니다.

- 퍼지는 것: 점진적으로 소리를 추가하고 한 걸음을 취소하는 법을 배우십시오.
- VAR: 점진적으로 해상도를 추가하고 다음 규모를 예측하는 법을 배우십시오.

이 두 가지 문제들은 서로 다른 축이다. 둘 다 처리 가능한 조건부 분포를 제공합니다. 경험적으로 VAR는 추론에서 더 빠르다 (더 적은 통과, 모든 것은 스케일의 내로 병렬) 그리고 클래스 조건형 이미지넷에서 DiT와 일치하거나 제치고 있습니다. 텍스트 조건형 VAR (VARclip, HART) 는 활발한 연구 방향입니다.

```figure
gx-var-next-scale
```

## 건설 해

내`code/main.py`당신은:
1. 작은 건물을 만들게**multi-scale VQ tokenizer**합성 "상상" 데이터 (2D 가우스 반지)
2. A를 열고**VAR-style transformer**다음 규모의 토큰을 예측하기 위해서입니다.
3. 변환기를 4번 (4 스케일) 호출하고 암호를 해독하여 샘플을 가져오십시오.
4. 규모에 따라 순서대로 훈련이 규모 내에서 동행되는 생산을 가능하게 하는 것을 확인한다.

이것은 장난감 구현입니다. 문제는 규모로 구성된 주의 마스크와 평행성 규모 내 세대가 실제로 작동하는 것을 보는 것입니다.

## 선박

이 교훈은`outputs/skill-var-tokenizer-designer.md` 다중 규모의 토케니저를 설계하는 기술: 스케일의 수, 스케일 비율, 코드북 크기와 잔여 공유, 디코더 아키텍처.

## 운동

1. **Scale count ablation.**4, 6, 8, 10 척도로 VAR를 훈련하십시오. 재건 품질을 자율 퇴행 패스 수와 측정합니다. 더 많은 척도 = 더 미세한 잔재 = 더 좋은 품질이지만 더 많은 패스.

2. **Codebook size.**코드북 크기가 512, 4096, 16384에 달하는 토큰을 배열합니다. 더 큰 코드북은 더 나은 재구성이지만 더 어려운 예측을 제공합니다. 무릎을 찾아보세요.

3. **Parallel-within-scale check.**훈련된 VAR에 대해 주의 패턴을 명시적으로 측정하십시오. k 척도 내에서 모델은 크로스 스케일 포지션을 수행하지만 내 스케일 포지션을 수행하지 않습니까? 마스크 구현을 확인하십시오.

4. **VAR vs DiT scaling.**동일한 이미지넷 클래스 조건 작업에 대해, 동일한 파라마 예산 (예를 들어, 33M, 130M, 458M) 에 VAR와 DiT를 훈련하십시오. 플롯 FID vs 계산. VAR는 각 크기의 DiT보다 앞서야합니다.

5. **Text conditioning.**VAR를 확장하여 adaLN를 통해 추가 컨디션 입력으로 텍스트 임베디션을 (CLIP pooled) 취합니다. 이것은 HART 레시피입니다. FID는 텍스트 조선 샘플링에 얼마나 향상합니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| VAR | "Visual AutoRegressive" | Image generation by next-scale prediction over a pyramid of VQ token grids |
| Next-scale prediction | "Predict coarser, then finer" | The model predicts tokens at increasing resolution scales, conditioning on all previous scales |
| Multi-scale VQ tokenizer | "Residual VQ" | VQ-VAE that produces K token grids of increasing resolution, with decoder summing all scales |
| Scale k | "Pyramid level k" | One of K resolution levels, from 1x1 at k=1 up to (H/p)x(W/p) at k=K |
| Parallel-within-scale | "One forward per scale" | All tokens at scale k are predicted in one transformer pass, not autoregressively |
| Causal-across-scales | "Scale-ordered attention" | Token at scale $k$ can attend to all of scales $1 \ldots k$ but not scales $k+1 \ldots K$ |
| Residual VQ | "Additive tokenization" | Each scale's tokens encode the residual left by lower scales; decoder sums all scale embeddings |
| VAR scaling law | "Image GPT scaling" | FID follows a predictable power law in compute, like language models' perplexity |
| HART | "Hybrid VAR + text" | Text-conditional VAR variant combining MaskGIT-style iterative decoding with VAR's scale structure |
| Scale position embedding | "(scale, row, col) triple" | Positional encoding carries both the scale index and spatial coordinates within the scale |

## 더 많은 읽기

- [Tian et al., 2024 — "Visual Autoregressive Modeling: Scalable Image Generation via Next-Scale Prediction"](https://arxiv.org/abs/2404.02905) VAR 문서, 가톨릭 참조
- [Peebles and Xie, 2022 — "Scalable Diffusion Models with Transformers"](https://arxiv.org/abs/2212.09748) DiT, 디푸지온 비교 기준
- [Esser et al., 2021 — "Taming Transformers for High-Resolution Image Synthesis"](https://arxiv.org/abs/2012.09841) VQGAN, 토케니저 가족 VAR의 다중 규모의 토케니저가 확장됩니다
- [van den Oord et al., 2017 — "Neural Discrete Representation Learning"](https://arxiv.org/abs/1711.00937) VQ-VAE, 디스크리트 이미지 토큰화의 기초
- [Tang et al., 2024 — "HART: Efficient Visual Generation with Hybrid Autoregressive Transformer"](https://arxiv.org/abs/2410.10812) 텍스트 조건 VAR
