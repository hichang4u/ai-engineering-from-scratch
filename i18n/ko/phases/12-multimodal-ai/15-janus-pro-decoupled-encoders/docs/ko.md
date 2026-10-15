# 자누스 프로: 통합 멀티모델용 단속코더

> 통일형 멀티모달 모델은 피할 수 없는 긴장감을 가지고 있습니다. 이해는 개념 수준 정보에 풍부한 SigLIP 또는 DINOv2 출력 벡터를 의미적 특징으로 필요로 합니다. 세대들은 재건 친화적인 코드를 원하고 있습니다. 두 가지 목표는 하나의 코더로 호환되지 않습니다. 자누스 (DeepSeek, 2024년 10월) 와 자누스-프로 (DeepSeek, 2025년 1월) 는 두 코더를 분리시키는 것을 멈추는 것이 해결방법이라고 주장한다. 작업들 사이에 변환기 몸을 공유하지만 SigLIP를 통해 로트 이해와 VQ 토케니저를 통해 생성 7B에서, Janus-Pro는 DALL-E 3를 제네발에서 제치고 MMMU에서 LLaVA와 일치합니다. 이 교훈은 왜 두 개의 코더가 실패하는 것이 작동하는지 설명합니다.

**Type:** Build
**Languages:** Python (stdlib, dual-encoder routing + shared-body signal)
**Prerequisites:** Phase 12 · 13 (Transfusion), Phase 12 · 14 (Show-o)
**Time:** ~120 minutes

## 학습 목표

- 공유된 하나의 코더가 이해나 생성 품질을 손상시키는 이유를 설명해 주십시오.
- Janus-Pro의 라우팅을 설명하십시오: 입력 측면에 입력 및 생성에 대한 VQ 토큰의 SigLIP 기능
- 자누스 프로가 성공할 수 있는 데이터 믹스 스칼링을 추적해 보세요.
- 분리된 (Janus-Pro), 결합된 연속 (Transfusion) 및 결합된 디스크리트 (Show-o) 아키텍처를 비교하십시오.

## 문제

통일된 모델은 이해와 생성 전반에 걸쳐 트랜스포머 몸체를 공유합니다. 이전 시도 (Chameleon, Show-o, Transfusion) 모두 두 방향으로 하나의 시각적 토케니저를 사용합니다. 토케니저는 타협입니다:

- 재구성 (세대) 에 최적화: VQ-VAE는 미세한 픽셀 세부 사항을 캡처하지만 약한 의미적 일관성을 가진 토큰을 생성합니다.
- 의미론을 위해 최적화 (포지): SigLIP 임베디션은 "cat" 토큰 근처의 "cat" 이미지를 그룹하지만 좋은 재구성 허용하지 않습니다.

쇼오와 트랜스푸지언은 한 방향에 가시적인 품질 세금으로 이를 지불합니다. Janus-Pro는 질문합니다.

## 개념

### 분리된 시각 코딩

자누스 프로의 아키텍처는 두 개의 코더를 분리합니다.

- 경로를 이해합니다. 입력 이미지 → SigLIP-SO400m → 2층 MLP → 변환기 몸.
- 생성 경로. 입력 이미지 (현재 이미지에 조건화 된 경우) → VQ 토큰화 → 토큰 IDs → 트랜스포머 몸체.
- 출력 생성. 트랜스포머 → VQ 디코더 → 픽셀에 의해 예측된 이미지 토큰.

트랜스포머 몸체는 공유되고 몸의 하류와 상류에 있는 모든 것이 작업에 특화된 것입니다.

입력값은 prompt 형식으로 해명된다: a `<understand>`SigLIP를 통한 노선을 표시합니다. `<generate>`VQ를 통해 이동하는 방식이 아니죠. 아니면 작업에서 직관적으로 이동하는 방식이 아니죠.

### 왜 이 방법이 효과가 있는 걸까요?

손실을 이해하는 것은 CLIP 스타일의 사전 훈련이 의미적 유사성을 위해 조정한 SigLIP 기능을 얻습니다. 모델의 인식 기준은 작업에 대한 입력 기능이 더 나은 것이기 때문에 쇼-오 / 환혈보다 향상됩니다.

생성 손실은 VQ 토큰을 얻는데, 토큰이 재구성하기 위해 조정했습니다. VQ 코드는 픽셀로 깨끗하게 컴포인하기 때문에 쇼오보다 이미지 품질이 향상됩니다.

공유 트랜스포머 인체는 두 개의 입력 배포를 (SigLIP 및 VQ) 보고 둘 다 작동하는 것을 배우며: 충분한 데이터 + 충분한 매개 변수, 인체는 스위치를 흡수합니다.

### 데이터 스케일링  Janus vs Janus-Pro

자누스 (원본, arXiv 2410.13848) 는 단속을 도입했지만 작은 규모 (1.3B 파라마, 제한된 데이터) 로:

- 7B 파라마스 (비 1.3B)
- 단계 1 (배열) 에서 72M까지 90M 이미지- 텍스트 쌍
- 72M가 2단계 (통일) 에서 26M까지
- 3단계에 200만개의 이미지-제인 명령 샘플이 추가되었습니다.

결과: Janus-Pro-7B는 MMMU (60.3 vs ~58) 에서 LLaVA와 일치하고 GenEval (0.80 vs 0.67) 에서 DALL-E 3를 제치고 있습니다.

### JanusFlow  수정된 흐름 변종

JanusFlow (arXiv 2411.07975) 는 VQ 생성 경로를 수정된 흐름 생성 경로 ( 연속) 로 교환한다. 분할은 이해 + 수정된 흐름 생성 경로로로 바뀌는다. 품질 천장은 더 높아진다. 건축은 분리된 엔코더-공유체로 남아 있다.

### 공동체의 작업

트랜스포머 몸체는 통일된 순서 과정을 처리하지만 두 개의 입력 분포로 처리합니다.

- 이해하기 위해: SigLIP 기능을 소비 + 텍스트 토큰 → 자동으로 텍스트를 발송합니다.
- 생성: 텍스트 토큰 + (선택형 이미지 VQ 토큰) → 자동으로 이미지 VQ 토큰을 발사합니다.

이 몸에는 블록별로 특정 무게가 없습니다. 이것은 Qwen 또는 Llama 내부에서 찾을 수 있는 텍스트 스타일의 변수입니다.

흥미롭게도, 이것은 Janus-Pro의 신체가 미리 훈련된 LLM에서 초기화 될 수 있음을 의미합니다. Janus-Pro는 DeepSeek-MoE-7B에서 초기화됩니다. 그 선택은 중요합니다. LLM는 순수한 처음부터 통합된 모델이 도달하기 위해 노력하는 추론 능력을 기여합니다.

### 인턴VL-U와 비교

InternVL-U (학습 12.10) 는 2026년 후속 과정입니다.

- 모형 다중 훈련 전 (InternVL3 척추)
- 분리된 엔코더 라우팅 (SigLIP 입력, VQ + 디스포션 종료)
- 통일된 이해 + 생성 + 편집

InternVL-U는 Janus-Pro의 건축 선택을 더 큰 프레임워크로 통합합니다. 분리된 엔코더 아이디어는 이제 규모의 통일된 모델의 기본입니다.

### 제한

분리된 코더는 건축적인 복잡성을 추가합니다. 훈련하기 위한 두 개의 토큰, 유지하기 위한 두 개의 입력 경로, 실패 모드 세트. 생성이 필요하지 않은 제품에서는 Janus-Pro가 과도하게 설계되었습니다.

이해가 필요하지 않은 제품에서는 Janus- Pro가 과다 자격을 갖는다

양쪽 모두 필요한 제품에서는 이제 Janus-Pro가 오픈 아키텍처의 기준이 되었습니다.

```figure
l5-janus-decouple
```

## 사용 하 고

`code/main.py`Janus-Pro 라우팅을 시뮬레이션합니다.

- 두 개의 모호한 코더: SigLIP (256-차원 의미 벡터를 생성) 와 VQ (전수 코드를 생성)
- 작업 태그를 기반으로 인코더를 선택하는 프롬프트 라우터
- 토큰 순서를 처리하는 공유 체 (stand-in) 는 어떤 코더가 생성했음에도 불구하고
- 단계 1 (배열) 에서 단계 3 (명령음악) 로의 중량 샘플 스케줄 전환

3가지 예제로 로우팅 된 경로를 인쇄: 이미지 QA, T2I, 이미지 편집.

## 선박

이 교훈은`outputs/skill-decoupled-encoder-picker.md`. 한화화된 발전과 수준 높은 이해가 필요한 제품을 고려하면, 구체적인 데이터 스케일 추천을 통해 Janus-Pro, JanusFlow, InternVL-U를 선택합니다.

## 운동

1. Janus-Pro-7B는 GenEval에서 DALL-E 3를 제치고 있습니다. 7B 오픈 모델은 왜 세대에서 프랜티어 독자적인 모델과 일치할 수 있지만 이해에서 일치하지 않는지를 설명하십시오.

2. 라우터 기능을 구현: 입력된 텍스트를 제공하여 `understand`또는`generate`"설명하고 그 다음 스케치를 그리" 같은 모호한 명령에 어떻게 대처할 수 있을까요?

3. JanusFlow는 VQ 경로를 수정된 흐름으로 대체합니다. 트랜스포머 몸체는 이제 무엇을 생산하고 손실에 어떤 변화가 있습니까?

4. 제4차 작업은 더 많은 단절된 코더로 처리할 수 있는 Janus-Pro 아키텍처를 제안합니다. 예를 들어: 이미지 세그먼트 (DINO 스타일), 깊이 (MiDaS 스타일).

5. 데이터 스케일링에 관한 Janus-Pro 섹션 4.2을 읽어보세요. T2I 품질 향상에 가장 많은 기여를 하는 데이터 단계는 무엇입니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Decoupled encoding | "Two visual encoders" | Separate tokenizer or encoder per direction: semantic for understanding, reconstruction for generation |
| Shared body | "One transformer" | Single transformer processes either encoder's output; no modality-specific weights |
| SigLIP for understanding | "Semantic features" | CLIP-family vision tower providing rich conceptual features but poor reconstruction |
| VQ for generation | "Reconstruction codes" | Vector-quantized tokens that decode cleanly back to pixels |
| JanusFlow | "Rectified-flow variant" | Janus-Pro with a continuous flow-matching generation head instead of VQ |
| Routing tag | "Task tag" | Prompt marker (`<understand>` / `<generate>`) that picks the input encoder |

## 더 많은 읽기

- [Wu et al. — Janus (arXiv:2410.13848)](https://arxiv.org/abs/2410.13848)
- [Chen et al. — Janus-Pro (arXiv:2501.17811)](https://arxiv.org/abs/2501.17811)
- [Ma et al. — JanusFlow (arXiv:2411.07975)](https://arxiv.org/abs/2411.07975)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Dong et al. — DreamLLM (arXiv:2309.11499)](https://arxiv.org/abs/2309.11499)
