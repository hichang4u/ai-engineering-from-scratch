# 환혈: Autoregressive 텍스트 + Diffusion Image in One Transformer

> 멜레온과 Emu3은 모든 것을 단독 토큰에 내기 위해 내걸었다 그들은 작동하지만 양자화 병목은 연속 공간 전파 모델 아래의 이미지 품질 평판이 눈에 띄습니다. 이식 (Meta, Zhou et al., 2024년 8월) 은 반대로 베팅합니다. 이미지를 연속적으로 유지하고 VQ-VAE를 완전히 떨어뜨리고 두 손실로 하나의 트랜스포머를 훈련시킵니다. 텍스트 토큰은 다음 토큰 예측을 얻습니다. 이미지 패치는 흐름 일치/ 확산 손실을 얻습니다. 두 가지 목표 모두 같은 무게를 최적화합니다. 안정적인 디프루전 3 (MMDiT) 의 기반 건축은 가까운 사촌이다. 이 수업은 '번스푸지언' 논문을 읽고, 장난감 두 손실 트레이너를 만들고, 하나의 트랜스포머가 두 가지 일을 모두 할 수 있도록 하는 주의 마스크를 추적합니다.

**Type:** Build
**Languages:** Python (stdlib, two-loss trainer on MNIST-scale toy)
**Prerequisites:** Phase 12 · 11 (Chameleon), Phase 8 (Generative AI)
**Time:** ~180 minutes

## 학습 목표

- 하나의 척추에 두 개의 손실을 실행하는 트랜스포머를 ( 텍스트 토큰에 NTP, 이미지 패치에 전파 MSE) 로 연결하십시오.
- 왜 이미지 패치들 사이의 쌍방향주의와 텍스트 토큰에 대한 인과적주의가 올바른 마스크 선택인지 설명하세요.
- 계산, 품질, 코드 복잡성에 있어서 트랜스푸지션 스타일 ( 연속적인 이미지, 전파 손실) 과 샤멜레온 스타일 (비분별 이미지, NTP) 을 비교하십시오.
- MMDiT의 기여를 명명하라: 각 블록에 있는 모달리티 특수한 무게, 잔류 흐름에 대한 공동의 관심.

## 문제

디스크릿 대 연속 이미지 토큰 논쟁은 LLM보다 오래되었다. 연속 표현 (原像素, VAE 잠자리) 은 세부 사항을 보존합니다. 디스크릿 토큰 (VQ 지표) 은 트랜스포머의 고유 단어에 적합하지만 양량 단계에 세부 사항을 잃습니다.

멜레온/EMU3는 단독으로 진행되었습니다. 한 손실, 한 건축물, 하지만 이미지 충실성은 토케니저 품질에 의해 제한되었습니다.

디스푸전스 모델은 연속적으로 진행되었습니다. 예외적인 이미지 품질, 그러나 LLM에서 분리된 모델, 복잡한 노이즈 스케줄 엔지니어링, 텍스트 생성과 깨끗한 통합이 없었습니다.

이식과 같은 질문: 둘 다 가능할까요? 영상을 연속적으로 유지해서, 한 모델을 계속 훈련시켜, 한 기하급수 단계로 두 개의 손실을 꿰매서 사용하세요.

## 개념

### 두 번의 손실 구조

단 하나의 디코더만 변환기가 다음을 포함하는 염기서열을 처리합니다.

- 텍스트 토큰 (비관성, BPE 음성에서)
- 이미지 패치 ( 연속적인 16x16 픽셀 블록이 라인적 임베디션을 통해 숨겨진 미미로 투영됩니다. ViT 코더의 입력과 동일합니다).
- `<image>`그리고`</image>`연속 패치가 사는 곳을 표시하는 태그

포워드 패스는 1회 실행됩니다. 손실은 토큰당 두 개의 헤드를 선택합니다.

- 텍스트 토큰에 대해서는: 음성 로직 머리에 표준 크로스 엔트로피
- 이미지 패치: 연속 패치에서 전파 손실은  각 패치에 추가된 소음을 예측합니다.

그라디엔트는 공유 트랜스포머 몸으로 흐르고 두 손실도 동시에 공유 무게를 향상시킵니다.

### 주의 마스크: 원시 텍스트 + 쌍방향 이미지

텍스트 토큰은 인과적일 수 있습니다. 텍스트 토큰은 미래의 텍스트에 응시하거나 교사로 휴식을 강요 할 수 없습니다. 이미지 패치는 단 한 스냅샷을 나타냅니다. 그들은 같은 이미지 블록 내에서 서로 쌍방향으로 응시해야합니다.

마스크:

```
M[i, j] = 1 if:
  (i is text and j is text and j <= i)   # causal for text
  OR (i is image and j is image and same_image_block(i, j))   # bidirectional within image
  OR (i is text and j is image and j < i_image_end)   # text attends to previous images
  OR (i is image and j is text and j < i_image_start)   # image attends to preceding text
```

훈련과 추론에서 블록 삼각형 마스크로 구현됩니다.

### 변압기 내부의 방전 손실

확산 손실은 표준입니다. 이미지 패치에 소음을 추가하고, 모델을 소음을 예측하도록 요청합니다.

훈련 중에:
1. 각 이미지 패치에 대해$x_0$, 무작위 시간 단계 샘플$t$- 그래
2. 샘플 잡음$\epsilon$, 계산$x_t = (1-t) \cdot x_0 + t \cdot \epsilon$(흐름 일치하기 위한 선형 인터폴레이션)
3. 트랜스포머가 예측한다$v_\theta(x_t, t)$$\text{loss} = \mathop{\mathrm{MSE}}(v_\theta(x_t, t), \epsilon - x_0)$- 그래
4. 텍스트와 함께 같은 순서에서 NTP 손실을 니다.

결론적으로, 세대란
- 텍스트 토큰: 표준 자동 퇴행 샘플링
- 이미지 패치: 이전 텍스트 토큰에 조건화된 디푸전 샘플링 루프 (10-30 단계 전형적인).

### MMDiT: 안정적인 디프루전 3의 변종

안정 디프루전 3 (Esser et al., 2024년 3월) 은 트랜스푸전과 비슷한 시기에 MMDiT (다형 디프루전 트랜스포머) 를 배포했다.

MMDiT의 주요 차이점:

- 블록별 모달리티 특수한 무게. 각 트랜스포머 블록은 텍스트 토큰과 이미지 패치에 대한 Q, K, V, MLP 무게를 별도로 가지고 있습니다. 주의는 공동 (횡단 모달리티); 다른 모든 것은 모달리티 특적입니다.
- 수정된 흐름 훈련. DDPM보다 더 간단한 수학과 알려진 샘플링을 가진 특정 흐름 일치 변형.
- 규모. MMDiT는 SD3 (2B 및 8B 파라마 변종) 의 척추입니다.

둘 다 같은 핵심 아이디어에 합쳐집니다. 하나의 트랜스포머는 텍스트에 NTP를 실행하고 연속적인 이미지 표현에 전파합니다.

### 왜 이 멜레온 스타일보다 더 좋은가?

이미지 생성에서 연속 방출과 디스크릿 NTP 사이의 품질 격차는 측정할 수 있다.

- 7B 파램에서는 같은 크기의 샤멜레온 스타일 모델이 FID에서 3-5점으로 뛰어나다.
- 토케니저 훈련이 필요하지 않습니다.  이미지 코더는 더 간단합니다. (비트의 입력 계층과 동일한 숨겨진 직선 투영).
- 인퍼런스는 자동 퇴행성 이미지 토큰과 달리 이미지 패치 디노이징을 병렬화 할 수 있습니다.

단점: 환조는 두 가지 손실 모델로 훈련 역학이 더 복잡해집니다. 손실 무게는 조정되어야 합니다. NTP와 전파 사이의 일정에 부합하는 것은 한 머리가 지배 할 수 있습니다.

### 하류에 있는

Janus-Pro (강좌 12.15) 는 트랜스푸지언의 아이디어를 정밀화하여, 트랜스푸지언의 몸을 공유하면서 한쪽의 시그립 (SigLIP) 를 분리하여, 다른 쪽의 VQ를 분리하여, 이해와 생성을 위한 비전 코더를 분리하여 트랜스푸지언의 시그립 (SIGLIP) 를 정밀화시킨다. 쇼오 (강좌 12.14) 는 디스크릿 디스푸지언 (마스크 예측) 로 디스푸지언을 교환한다.

2026년 생산 VLM는 이미지들을 발사한다.  Gemini 3 Pro, GPT-5, 클로드 오퍼스 4.7의 이미지 생성 경로.

```figure
cfg-guidance-scale
```

## 사용 하 고

`code/main.py`작은 MNIST 같은 문제에 대한 장난감 환혈을 구축합니다.

- 텍스트 캡션은 숫자를 설명하는 짧은 정수 순서입니다 (0-9).
- 이미지는 4x4 바이트의 그리드입니다.
- 공유중도의 선형 투사쌍은 트랜스포머의 대대 역할을 한다. 텍스트에 NTP 손실, 잡음있는 패치에 MSE 손실.
- 훈련 루프는 두 손실을 번갈아냅니다. 주의 마스크는 명시적입니다.
- 세대라는 것은 한 번 앞을 지나서 텍스트 캡션과 4x4 이미지를 생성합니다.

트랜스포머는 장난감입니다. 2손실 인수관, 주의 마스크 건설, 추론 루프는 진짜 유물입니다.

## 선박

이 교훈은`outputs/skill-two-loss-trainer-designer.md`새로운 멀티모달 훈련 작업 ( 텍스트 + 이미지, 텍스트 + 오디오, 텍스트 + 비디오) 를 고려하여, 두 손실 스케줄 (하산 무게, 마스크 모양, 공유와 모달리티 특정 블록) 을 설계하고 구현 위험을 표시합니다.

## 운동

1. 이식형 모델은 70% 텍스트 토큰과 30% 이미지 패치를 훈련시킵니다. 이미지 전파 손실은 텍스트 NTP 손실의 크기의 ~ 10배입니다. 손실 중량은 어떤 균형을 잡는가?

2. 블록 삼각형 마스크를 실행하여 순서: `[T, T, <image>, P, P, P, P, </image>, T]`각 항목을 0 또는 1으로 표시합니다.

3. MMDiT는 모달리티 특화된 QKV 무게를 가지고 있습니다. 이 변수 수치는 Transfusion의 완전 공유 트랜스포머와 비교해 어떤 변수를 추가합니까? 7B 변수에서, 가치가 있습니까?

4. 생성: 텍스트 프롬프트를 제공하면 모델은 50 개의 토큰에 대한 NTP를 실행하고, 다음으로 `<image>`, 그리고 256개의 패치에서 20개의 디노이스 단계에 걸쳐 퍼포먼스를 실행합니다.

5. SD3 논문을 읽어 보세요. 3부. 수정된 흐름과 왜 DDPM보다 적은 추론 단계로 공감되는지를 설명하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Two-loss training | "NTP + diffusion" | A single transformer optimizes both cross-entropy on text tokens and MSE on continuous image patches in the same gradient step |
| Flow matching | "Rectified flow" | Diffusion variant that predicts a velocity field from noise to clean data; simpler math than DDPM |
| MMDiT | "Multimodal DiT" | Stable Diffusion 3's architecture: joint attention, modality-specific MLPs and norms |
| Block-triangular mask | "Causal text + bidirectional image" | Attention mask that is causal across text but bidirectional within image regions |
| Continuous image representation | "No VQ" | Image patches as real-valued vectors, not integer codebook indices |
| Velocity prediction | "v-parameterization" | Network output is the velocity field between noise and data, not the noise itself |

## 더 많은 읽기

- [Zhou et al. — Transfusion (arXiv:2408.11039)](https://arxiv.org/abs/2408.11039)
- [Esser et al. — Stable Diffusion 3 / MMDiT (arXiv:2403.03206)](https://arxiv.org/abs/2403.03206)
- [Peebles & Xie — DiT (arXiv:2212.09748)](https://arxiv.org/abs/2212.09748)
- [Zhao et al. — MonoFormer (arXiv:2409.16280)](https://arxiv.org/abs/2409.16280)
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
