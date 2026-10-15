# 체형 VLA: RT-2, OpenVLA, π0, GR00T

> 모델이 웹 사이트에서 레시피를 읽고 부엌 로봇에서 실행한 것은 RT-2 (Google DeepMind, 2023년 7월) 이다. RT-2는 텍스트 토큰으로 동작을 배제하고 웹 데이터와 로봇 동작 데이터에 VLM를 공동 조정하고 웹 규모의 시각 언어 지식이 로봇 제어로 전달된다는 것을 증명했습니다. 오픈VLA (2024년 6월) 는 오픈 7B 참조를 배포했다. 물리 지능의 π0 시리즈 (2024~2025) 는 흐름 일치 행동 전문가들을 추가했다. NVIDIA의 GR00T N1 (2025년 3월) 은 대규모 인형 로봇을 위한 이중 시스템 (시스템 1 / 시스템 2) 제어 기능을 제공하였다. VLA 원시적인  시각 언어 행동, 보는, 읽는, 행동하는 단일 모델은 이 단계의 이해 모델과 15 단계의 자율 시스템 사이의 다리입니다.

**Type:** Learn
**Languages:** Python (stdlib, action tokenizer + VLA inference skeleton)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 15 (Autonomous Systems, referenced)
**Time:** ~180 minutes

## 학습 목표

- 액션 토큰화 (Action Token): 디스크릿 빈 코딩 (RT-2), FAST 효율적인 액션 토큰, 연속적인 흐름 일치 액션 (π0).
- 웹 + 로봇 데이터에 대한 공동 정렬이 왜 새로운 작업에 대한 일반적인 지식 전송을 보존하는지 설명하십시오.
- 동일한 로봇 작업에 OpenVLA (오픈 7B Llama+VLM), π0 (흐름 일치) 및 GR00T N1 (다중 시스템) 를 비교하십시오.
- 오픈 X-Embodiment 데이터 세트와 RT-X 훈련 코퍼스의 역할에 대해 설명하십시오.

## 문제

자연어 명령어에서 작업을 수행하는 로봇은 1970년대부터 연구 대상이다. 2020 년대 답은: 시각 언어 행동 (VLA) 모델. VQA에 사용되는 동일한 VLM 아키텍처, 그러나 출력은 텍스트 대신 액션 (공동 토크, 최종 효과자 포즈, 단독 명령) 이다.

VLA에 대한 특수한 도전:

1. 동작 공간은 연속 (관각, 힘) 이며, 높은 차원 (7-DOF 팔 + 3-DOF 지갑 = 30 Hz에서 10 dims) 이다.
2. 로봇 특수한 훈련 데이터는 희소하다. 오픈 X-Embodiment은 ~ 1M 궤도를 가지고 있으며 웹 텍스트 이미지는 5B +입니다.
3. 제어 주파수 문제입니다. 30 Hz 제어 루프는 한 동작에 33ms 예산입니다.
4. 안전. 잘못된 행위는 하드웨어, 사람, 재산에 손상을 입는다.

## 개념

### 행동 토큰화 (RT-2)

RT-2의 트릭: 각 공동 목표물을 양자화된 텍스트 토큰으로 표현한다. 정상화된 [-1, 1] 범위를 256 개의 칸으로 구분하고, 각 칸을 어휘 ID로 매핑한다. 10 DOF 액션은 각 제어 단계에 10 개의 토큰으로 된다.

PaLM-X VLM를 혼합물에 조화시켜:

- 웹 이미지- 텍스트 쌍 (사본, VQA).
- 로봇 시범, 토큰으로 행동

모델은 "붉은 큐브를 " (언어) → 이미지 (비전) → 10 토큰 액션 시퀀스 (비밀화된 공동 목표) 를 볼 수 있다. 웹 사전 훈련은 일반적인 지식 전송을 보존한다. RT-2는 "고속으로 움직이는 물체로 이동"을 따라 갈 수 있습니다. 비록 "고속으로 움직이는"는 훈련 데이터에 있지 않습니다.

RT-2 종이에서 3-5 Hz의 인퍼런스, VLM 자율 퇴행식 코드로 제한됩니다.

### OpenVLA  오픈 7B 참조

OpenVLA (Kim et al., 2024년 6월) 는 오픈 웨이트 RT-2 부대입니다. 7B 라마 척추, DINOv2 + SigLIP 이중 시각 코더, 256 개의 칸에 걸쳐 액션 토큰화.

오픈 X-Embodiment (970k 궤도 22 개의 로봇) 에 훈련 받았습니다. 새로운 로봇에 적응하기 위해 LoRA 미세 조정 지원을 가진 배.

인퍼런스: A100에서 4~5 Hz, 양자화로.

### FAST 토큰화  더 빠른 액션 디코딩

페르츠 등 (2024) 는 디스크릿-빈 토큰화가 비효율적이라는 것을 보여주었다.

30 단계의 행동 궤도는 300 개의 디스크릿-빈 토큰 대신 ~ 10 FAST 토큰으로 변한다. 질 손실 없이 인퍼런스는 3-5배 가속화된다.

### π0 및 흐름 일치하는 동작

물리 지능 π0 (Black et al., 2024년 10월) 은 디스크릿 액션 토큰을 흐름 일치하는 액션 전문가로 대체합니다.

- 작은 액션 트랜스포머는 VLM의 숨겨진 상태를 읽고 수정된 흐름으로 연속적인 50 단계의 액션 시퀀스를 내보내줍니다.
- 액션 헤드 트레인은 흐름 일치 손실로 VLM 사전 훈련은 변하지 않습니다.
- 인퍼런스: ~5개의 디노이징 단계로 방출된 전체 액션 시퀀스, 효과적으로 50 Hz 제어.

π0의 주장: 다양한 조작 작업에서 OpenVLA와 Octo를 제치고 있습니다. 연속 작용의 공식은 분별성이 파괴하는 부드러움을 보존합니다.

π0.5 및 π0-FAST은 점진적인 업그레이드입니다. π0-FAST은 FAST 토큰화를 흐름 일치와 결합합니다.

### GR00T N1  인간형 쌍체 시스템

NVIDIA의 GR00T N1 (2025년 3월) 은 인형 로봇 (>30 DOF, 전체 몸):

- 시스템 2: 큰 VLM 읽기 장면 + 명령, ~ 1 Hz에서 높은 수준의 하위 목표를 생성.
- 시스템 1: 하위 목표에 맞춰 낮은 수준의 50-100 Hz 공동 명령어를 생산하는 작은 액션 헤드 트랜스포머.

카네마의 빠르고 느린 사고로 나뉘는 지도: 시스템 2의 계획, 시스템 1의 행동. 이점: 느린 VLM 크기의 계획은 빠른 제어를 차단하지 않습니다. 시스템 1은 지연으로 인해 작습니다.

GR00T N1.7 (2025년 말) 은 데이터 스케일링을 향상시킵니다.

### 열린 X-체체

훈련 데이터: RT-X (2023년 10월) 는 22개의 로봇을 대상으로 1M 궤도를 다루는 22개의 데이터 세트를 집계했다. 오픈 X-엠보디먼트는 모든 사람들이 사용하는 코퍼시스입니다.

- ALOHA / 브릿지 V2 / 드로이드 / RT-2 부엌 / 언어 테이블.
- 각각의 샘플: (로봇 상태, 카메라 조회, 명령, 액션 시퀀스)
- 훈련 위생: 행동 공간을 통합하고, 관절 범위를 정상화하고, 카메라의 크기를 변경합니다.

OpenVLA와 π0는 Open X-Embodiment에서 열립니다. 특정 로봇에 대한 도메인 격차는 100-1000 작업 특정 데모에서 LoRA 미세 조정으로 닫힌다.

### 코-파이닝 vs 로봇만

공동 정렬은 웹 VQA 데이터를 로봇 궤도와 혼합합니다. 비율은 중요합니다. 너무 많은 VQA와 모델은 행동을 잊습니다. 너무 많은 로봇 데이터는 모델이 일반적인 지식을 잃습니다.

RT-2의 비율: ~1:1. OpenVLA: ~0.5:1 웹에서 로봇에. π0: 유사. 정확한 비율은 데이터 세트 크기에 맞춰 조정하는 하이퍼파라미터입니다.

로봇만 훈련하면 배포되지 않은 명령에 실패하는 작업 특수한 모델을 생성합니다. 공동 정렬은 "붉은 큐브를 (디모) "와 "왼쪽에서 세 번째로 큰 객체를 (신작 문장) " 사이의 차이입니다.

### 안전 및 행동 제한

생산 VLA 배마다:

- 단단한 관절 제한 (토크가 스펙을 넘지 못한다).
- 속도 제한 (soft clipping)
- 작업 공간의 제한 (말효율자는 테이블을 떠날 수 없습니다).
- 새로운 작업에 대한 인체 공인 승인을

VLA의 출력은 명령이 아니라 제안입니다.

```figure
mm-action-tokens
```

## 사용 하 고

`code/main.py`이 부분의 본문은

- 256-bin 액션 토큰화 및 디토큰화 구현
- DCT+ 양자화 기반의 FAST 토큰라이저를 스케치합니다.
- 시그니 수를 한 단계로 비교한다 (비밀-빈, FAST, 연속 흐름).
- RT-2 → OpenVLA → π0 → GR00T의 선조 요약을 인쇄합니다.

## 선박

이 교훈은`outputs/skill-vla-action-format-picker.md`. 로봇 작업 (물리 조작, 탐색, 인간형 전체체) 을 고려하면, 디스크릿-빈 + RT-2, FAST + OpenVLA, 흐름 일치 + π0, 또는 이중 시스템 + GR00T 사이에서 선택한다.

## 운동

1. 10DOF 팔이 30Hz 제어 속도에서 256통의 디스크릿빈 토큰화로 초당 얼마나 많은 토큰을 발사할 수 있습니까? 7B VLM는 따라잡을 수 있습니까?

2. FAST 토큰화는 30단계 궤도를 ~10개의 토큰으로 압축한다. 궤도가 높은 주파수 운동 (예를 들어, 드럼) 을 가지고 있다면 사용자가 무엇을 잃게 된다?

3. π0의 흐름 일치 헤드 는 ~ 5 단계 로 니다.

4. GR00T의 시스템 1 / 시스템 2는 카네만에게 지도를 나눈다. 두발 걷기에 도움이 될 다른 분할을 제안한다.

5. 데이터 세트 큐레이션에 관한 오픈 X-엠보디먼트 섹션 4을 읽어 보세요. 도메인 누출을 방지하는 세 가지 큐레이션 규칙을 명명하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| VLA | "Vision-language-action" | Model that takes image + instruction and outputs action commands |
| Action tokenization | "Discrete bins" | Quantize continuous joint targets into 256 bins per dim, each a vocab ID |
| FAST tokenizer | "Frequency action tokens" | DCT + quantize to compress 30-step trajectories to ~10 tokens |
| Co-fine-tune | "Mix web + robot" | Train on web VQA data alongside robot demos to preserve general knowledge |
| Flow-matching action head | "π0 continuous output" | Small transformer that outputs a 50-step action sequence via rectified flow |
| System 1 / System 2 | "Dual-system control" | Large VLM plans slowly, small action head acts quickly; GR00T pattern |
| Open X-Embodiment | "RT-X dataset" | 1M-trajectory cross-robot dataset; the training corpus |

## 더 많은 읽기

- [Brohan et al. — RT-2 (arXiv:2307.15818)](https://arxiv.org/abs/2307.15818)
- [Kim et al. — OpenVLA (arXiv:2406.09246)](https://arxiv.org/abs/2406.09246)
- [Black et al. — π0 (arXiv:2410.24164)](https://arxiv.org/abs/2410.24164)
- [NVIDIA — GR00T N1 (arXiv:2503.14734)](https://arxiv.org/abs/2503.14734)
- [Open X-Embodiment Collab — RT-X (arXiv:2310.08864)](https://arxiv.org/abs/2310.08864)
