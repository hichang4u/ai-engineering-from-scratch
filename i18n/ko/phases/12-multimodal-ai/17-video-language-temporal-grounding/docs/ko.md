# 비디오 언어 모델: 일시적 표징 및 지형

> 비디오는 사진의 집합이 아닙니다. 5초짜리 클립은 사유 순서, 행동 동사, 그리고 이미지 모델이 표현할 수 없는 이벤트 타이밍을 가지고 있습니다. 비디오-LLaMA (Zhang et al., 2023년 6월) 는 오디오-비주얼 지형으로 최초의 오픈 비디오-LLM를 배포했다. 비디오 채팅과 비디오-LLaVA는 패턴을 확장했습니다. 2025년까지 Qwen2.5-VL의 TMRoPE는 국경 특유 모델과 격차를 완화시켰다. 각 시스템은 시간적 토큰을 다르게 해결했습니다. 클립당 Q-former, 프레임당 concat-pool, 토큰당 TMRoPE. 이 수업은 패턴을 읽고, 일률적 대 역동적 프레임 샘플러를 만들고, 시간적 지형 작업을 평가합니다.

**Type:** Build
**Languages:** Python (stdlib, frame sampler + temporal-grounding evaluator)
**Prerequisites:** Phase 12 · 08 (LLaVA-OneVision)
**Time:** ~180 minutes

## 학습 목표

- 시간적 위치 코딩이 비전 코딩에 관계없이 비디오 VLM 성능을 변경하는 이유를 설명하십시오.
- 토큰당초와 지형 정확성에서 일률적이고 역동적인 FPS 및 이벤트 기반 프레임 샘플링을 비교하십시오.
- Q-former-per-clip (Video-LLaMA) vs pooled-per-frame (Video-LLaVA) vs M-RoPE-per-token (Qwen2.5-VL) 디자인을 설명합니다.
- 비디오MME, 템프컴퍼스, 에고시메라, 비디오-MMMU의 네 가지 비디오 벤치마크를 명명하십시오.

## 문제

30 FPS의 1 분기의 비디오는 1800 프레임입니다. 프레임 당 196 개의 시각 토큰 (ViT-B는 224) 에서, 즉 2024 시대의 LLM 컨텍스트보다 352k 토큰입니다.

세 가지 감축 전략이 있습니다.

1. 하위 샘플 프레임 (1-8 FPS 내용에 따라)
2. 각 프레임의 패치 토큰을 공격적으로 (3x3 또는 4x4 억 선형 풀)
3. 16프레임 클립을 찍고 64개의 토큰을 내보내기 위한 Q-former를 통해 압축합니다.

각각의 트레이드 오브는 다릅니다. 하위 샘플링은 시간적 세부 사항을 잃습니다. 퓨링은 공간적 세부 사항을 잃습니다. Q-프레임은 약간의 손실을 입지만 토큰을 절약합니다.

시간적 위치 코딩은 다른 축입니다: 모델은 프레임 5이 프레임 6보다 먼저 왔다는 것을 어떻게 알고 있습니까? 옵션은 간단한 1D 시간적 RoPE (Video-LLaMA), 학습 시간적 임베디션 (Video-LLaVA) 및 TMRoPE (Qwen2.5-VL, 전체 3D) 를 포함한다.

## 개념

### 비디오-LLaMA: 클립에 대한 Q-former + 오디오 분자

비디오-LLaMA (2023) 는 최초의 오픈 비디오-LLM입니다.

- 16프레임 클립 2FPS (이하 8초)
- 프레임별 ViT 기능 -> 16 프레임 전체에 걸쳐 교차하는 비디오 Q-former -> 32 개의 학습된 질문 -> LLM.
- 병렬 오디오 분기: 파형 -> 이미지빈드 오디오 엔코더 -> 오디오 Q-former -> 32 질의 -> LLM.

강점: 오디오-비주얼 합동 추론력. 약점: 고정된 클립 길이, 임의 시간 지형이 없습니다.

### 비디오 채팅 및 비디오-LLAVA

비디오 채트는 비디오-LLaMA 아이디어를 유지했지만 오디오와 단순화를 포기했다. 비디오-LLaVA (Lin et al., 2023) 는 이미지와 비디오 프레임 모두에서 단일 시각 엔코더를 훈련 시켰습니다 ("프로젝션 이전 조율"), 통일된 표현을 제공합니다. 둘 다 얼어붙은 CLIP- 엔코더 + MLP + LLM입니다.

둘 다 8-16 프레임 시스템입니다.

### Qwen2.5-VL 및 TMRoPE

Qwen2.5-VL는 TMRoPE  시간형 모다리티 로터리 포지션 임베딩을 도입했다. 각 패치 토큰은 t가 실제 시간표 (프레임 인덱스) 이 되는 (t, h, w) 위치를 가지고 있다.

간단한 시간적 임베디션의 주요 차이점은

- 절대 시간, 지표가 아니라 모델은 "4.2초"를 보고 "프레임 15"를 보지 않습니다.
- 각 토큰의 회전, 클립이 아닌 각각의 시각 토큰은 시간표에 따라 독립적으로 회전합니다.
- 동적 FPS와 호환됩니다. 여기 2 FPS와 여기 4 FPS에서 샘플을 하면, TMRoPE는 불균형적인 거리감을 원산적으로 처리합니다.

TMRoPE는 "고양이 어떤 순간에 뛰어든다?"라는 질문을 가능하게 합니다. 모델은 "4.2초에"를 출력할 수 있습니다. 비디오-LLaMA는 "클립에 초기에"라고만 말할 수 있습니다.

### 프레임 샘플링 전략

일률: 샘플 N 프레임은 기간 동안 균일하게 됩니다. 단순, 운동 피크를 잃습니다.

동적 FPS: 운동 강도에 따라 샘플을 적응적으로 선택한다. 광학 흐름 또는 프레임 차별화는 더 밀집한 샘플링을 위해 고 운동 세그먼트를 선택한다. Qwen2.5-VL 열이 이 위에 작동한다.

이벤트 중심: 가벼운 탐지기를 실행하고, 액션이 일어나는 장소에서 샘플을 더 많이 가져가십시오.

키프레임 + 컨텍스트: 촬영 경계에서 샘플 + 몇 개의 인접 프레임. 영화 콘텐츠에 사용됩니다.

### 프레임에 따라 집합

1 FPS와 576개의 이므로 5분짜리 클립은 172,800개의 이 됩니다. Qwen2.5-VL-72B의 128k 컨텍스트를 사용할 수 있지만 비싸죠.

3x3의 2차선 풀은 프레임당 64개의 토큰으로 줄여서 5분 동안 19,200개의 토큰으로 됩니다. 대부분의 작업에 좋은 장소입니다.

공간적 세부 사항이 덜 중요하게 작용하는 에이전트 작업 흐름에 대해 더 공격적으로 (6x6 -> 16 토큰 한 프레임) 를 분비하십시오.

### 4개의 비디오 기준

- 비디오MME: 포괄적인 비디오 이해, 짧은 + 중형 + 긴.
- 템프컴퍼스: 정밀한 시간적 추론, "전" / "후" 질문.
- 에고시마: 장거리 1인칭 비디오
- 비디오-MMMU: 다중형 다분야 비디오 질문

비디오-VLM 전체 평가는 네 가지에 모두 영향을 미칩니다. 그들은 다른 축을 강조합니다. TempCompass는 주문에 관한 것입니다. EgoSchema는 3+ 분 이상의 추론입니다. VideoMME는 기간을 아우르는 것입니다.

### 지형 출력 형식

시간 지형에 대한 출력 형식:

- 무료 텍스트: "고양이 4초의 점수를 뛰어넘는다". 분석하기 쉽지만 정확하지 않습니다.
- 구조화된 JSON: `{"event": "jump", "start": 4.1, "end": 4.3}`Qwen2.5VL가 이 엔진을 작동시킵니다.
- 토큰 기반: 특별`<time>4.1</time>`Qwen2.5VL의 내부 형식입니다.

토큰 기반은 하류 사용에 가장 정확합니다. Qwen2.5-VL의 JSON 출력 형식은 직접 분석됩니다.

### 2026 최선 실습

2026년에 비디오 VLM를 위한:

- 코딩: SigLIP 2 M-RoPE 또는 TMRoPE (Qwen2.5-VL) 로
- 프레임 샘플링: 최대 프레임 캡으로 동적인 FPS (1-4 운동에 따라)
- 프레임별 분모: 3x3비리니어
- 출력: 시간 + 이벤트 필드로 구성된 JSON.
- 벤치마크: 일반에 대한 비디오MME + 템프컴패스; 장거리에 대한 에고시메라

```figure
video-temporal-patches
```

## 사용 하 고

`code/main.py`다음을 포함합니다.

- 일률적이고 역동적인 FPS 프레임 샘플러
- 장난감 시간적 지형 평가자: 시간 T에 "지속 진실" 이벤트를 주어 모델 출력, 관용과 정확성을 점수한다.
- 비디오-LLaMA (16 프레임, Q-former), 비디오-LLaVA (8 프레임, MLP), Qwen2.5-VL (동동적인 FPS + TMRoPE) 를 비교합니다.

## 선박

이 교훈은`outputs/skill-video-vlm-frame-planner.md`. 비디오 작업 (감시, 동작 인식, 시간 지형, 요약) 을 고려하면 프레임 샘플러, 퓨리징 요소, 출력 형식 및 예상 정확성 레벨을 선택합니다.

## 운동

1. 3분짜리 요리 데모를 위해 유니폼과 역동적인 FPS를 선택하고 토큰 수를 통해 정당화하십시오.

2. TMRoPE는 간단한 시간적 임베디션 테이블이 할 수 없는 구체적으로 무엇을 추가합니다?

3. VLM가 발송하는 것을 배울 수 있는 시간 지형화를 위한 JSON 스케마를 작성하세요. 오류 사례를 포함하세요.

4. 비디오-LLaVA의 "프로젝션 전에 조율"에 관한 3부 를 읽어 보십시오.

5. 비디오MME 순위표를 감안하면 2026년 최고 오픈 모델과 최고 독점 모델 사이의 격차는 무엇입니까? 그 격차의 어느 정도가 시간적 코딩과 기본 LLM 규모에 기인되는가?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Temporal grounding | "Time-localized answers" | VLM outputs a specific timestamp range for when an event happens |
| TMRoPE | "Time-Multimodal RoPE" | 3D rotary position with absolute timestamps, used by Qwen2.5-VL |
| Dynamic FPS | "Motion-aware sampling" | Sample more frames in high-motion segments, fewer in static ones |
| Frame pooling | "Spatial compress per frame" | Reduce patches per frame with bilinear interpolation before the LLM |
| Video Q-former | "Clip compressor" | Cross-attention bottleneck mapping N frames to K learned queries |
| VideoMME | "Video bench" | Comprehensive short/medium/long video benchmark, 2500+ samples |

## 더 많은 읽기

- [Zhang et al. — Video-LLaMA (arXiv:2306.02858)](https://arxiv.org/abs/2306.02858)
- [Li et al. — VideoChat (arXiv:2305.06355)](https://arxiv.org/abs/2305.06355)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Qwen Team — Qwen2.5-VL (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Lin et al. — VILA-1.5 (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
