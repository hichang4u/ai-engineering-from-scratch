# 오픈 웨이트 VLM 레시피: 실제로 중요한 것은 무엇 입니까?

> 2024~2026년 공개중량 VLM 문학은 압축 테이블의 숲입니다. 애플의 MM1는 이미지 코더, 커넥터, 데이터 믹스 등 13가지 조합을 테스트했습니다. 앨런 AI의 몰모는 인간 캡션이 GPT-4V 디스틸레이션을 능가하는 것을 증명했습니다. 캄브리아 1은 20개 이상의 코더 비교를 했습니다. 이데피피스2는 5축 디자인 공간을 공식화했습니다. 프리즘틱 VLM는 통제된 기준에 따라 27개의 훈련 레시피를 비교했다. 그 모든 소음에서 작은 결과들이 논문에서 모두 유효합니다. 이미지 코더는 연결기 구조보다 중요하고, 데이터 혼합은 둘보다 중요하며, 상세한 인본은 소화된 합성 데이터를 능가합니다. 이 수업은 이 표들을 읽어서 굳이 읽지 않아도 됩니다.

**Type:** Learn + lab
**Languages:** Python (stdlib, ablation table parser + recipe picker)
**Prerequisites:** Phase 12 · 05 (LLaVA baseline)
**Time:** ~180 minutes

## 학습 목표

- 5축 VLM 설계 공간의 이름을 지정하십시오: 이미지 코더, 커넥터, LLM, 데이터 믹스, 해상도 스케줄.
- MM1 / Idefics2 / Cambrian-1 압축 테이블을 읽어보고 어떤 이 특정 기준을 움직인다고 예측하십시오.
- 계산 예산과 작업 혼합을 고려하여 새로운 VLM에 대한 레시피 (코더, 커넥터, 데이터, 해상도) 를 선택하십시오.
- 왜 인간 표본이 GPT-4V 증류를 동일한 표본으로 압도하는지를 설명해 주십시오.

## 문제

수백 개의 오픈 웨이트 VLM가 있습니다. "좋은"과 "최첨단" 사이의 격차는 대부분 건축이 아닙니다. 데이터, 해상도 스케줄, 코더 선택입니다. 모델이 저질렀을 때 어떤 버튼을 먼저 돌리는지 아는 것은 5 백만GPU 시간 오류를 절약합니다.

2023 파동 (LLaVA-1.5, InstructBLIP, MiniGPT-4) 은 캡션-쌍 사전 훈련 + LLaVA-Instruct-150k에서 진행되었습니다. 좋은 기본 기준. MMMU 35%를 돌파했습니다.

2024 파동 (MM1, Idefics2, Molmo, Cambrian-1, Prismatic VLM) 은 종전적 압축을 거쳤다. 결과는 놀랍고 실용적이었다.

## 개념

### 5축 디자인 공간

이데피카스2 (Laurençon et al., 2024) 는 다음과 같은 축을 지정했다.

1. 이미지 코더. CLIP ViT-L/14, SigLIP SO400m/14, DINOv2 ViT-g/14, InternViT-6B.
2. 연결기: MLP (2-4 층), Q-Former (32 질의 + 크로스-attn), Perceiver Resampler (64 질의), C-Abstractor (전환 + 쌍선형 집합).
3. 언어 모델: Llama-3 8B / 70B, Mistral 7B, Phi-3, Gemma-2, Qwen2.5. LLM 크기는 지배적인 파라마 비용입니다.
4. 훈련 자료: 캡션 쌍 (CC3M, LAION), 상호간접 (OBELICS, MMC4), 명령 (LLaVA-Instruct, ShareGPT4V, PixMo, Kauldron).
5. 해상도 일정, 고정된 224/336/448, AnyRes, 원산지 역동성 훈련 중 램프 또는 일정

모든 생산 VLM는 각 축에 대한 선택을 합니다. MMMU 점수의 대부분의 변수는 당신이 선택한 연결기 때문에 설명되지 않습니다.

### 축 1: 코더 > 커넥터

MM1 섹션 3.2 은: CLIP ViT-L/14 에서 SigLIP SO400m/14 로 교환 함은 3+ 점 MMMU 를 추가 하였다. MLP 에서 Perceiver Resampler 로 연결을 교환 함은 1 점 미만 을 추가 하였다.

캄브리아 1의 "캄브리아 비전 엔코더 매치업" (Tong et al., 2024) 은 비전 중심 벤치마크 (CV-Bench) 에 20 이상의 엔코더를 실행했다. 리더보드의 상위에는 DINOv2와 SigLIP의 혼합이 있습니다. CLIP는 팩 중간에 있으며, 이미지빈드와 ViT-MAE는 낮습니다. CLIP ViT-L에서 DINOv2 ViT-g/14 사이의 격차는 CV-Bench에서 ~ 5-7 포인트입니다.

2026년 오픈 VLM의 기본 코더는 시맨틱 + 밀집 기능에 SigLIP 2 SO400m/14이며, 때로는 DINOv2 ViT-g/14 기능과 연쇄되어 있습니다. (Cambrian의 "Space Vision Aggregator"는 이것을 수행합니다).

### 축 2: 연결 설계는 씻기

MM1, Idefics2, Prismatic, MM-Interleaved 모두 같은 결론에 도달했습니다. 고정된 시각적 토큰 수에서, 연결기 구조는 거의 중요하지 않습니다. 평균 융합 패치에 있는 2층 MLP는 같은 토큰 예산에서 32 개의 Q-Former의 1 포인트 이내에 수행합니다.

중요한 것은 토큰 수입니다. 더 많은 시각 토큰 = 더 많은 LLM 계산 = 더 좋은 성능, 그리고 감소하는 수익률. OCR에 대한 64 토큰은 너무 적습니다. 576-1024 토큰은 대부분의 오픈 VLM의 달콤한 장소입니다. 2048+는 문서와 차트에만 도움이 됩니다.

Q-Former vs MLP는 비용 문제이며 품질 문제 아닙니다. Q-Former는 이미지 해상도에 관계없이 토큰을 32-64로 제한합니다. MLP는 모든 패치 토큰을 발사합니다. 고해상도 입력에 대해서는 Q-Former는 LLM 컨텍스트를 저장합니다.

### 3축: LLM 크기는 천장을 설정합니다

7B에서 13B로 LLM를 두 배로 하면 VLM 논문마다 MMMU에서 2-4 점으로 안정적으로 추가됩니다. 70B에서는 대부분의 기준을 포화합니다. VLM의 멀티모달 추론 천장은 LLM의 텍스트 추론 천장이입니다. 시각 엔코더는 그것을 먹일 수 있습니다. 그 이유는 아닙니다.

이 때문에 Qwen2.5VL-72B와 Claude Opus 4.7는 MMMU-Pro와 ScreenSpot-Pro를 습니다. 언어 두뇌는 엄청납니다. 7B VLM는 똑똑한 커넥터 디자인을 통해 70B VLM를 대체할 수 없습니다.

### 축 4: 데이터  인간 표본은 디스틸레이션을 능가한다

Molmo + PixMo (Deitke et al., 2024) 는 2024년 모든 사람이 읽어야 할 결과입니다. 앨런 AI는 인간 해설가들로 1-3분 팽창한 음성- 텍스트 패스에서 이미지를 기술하여 712K 팽창한 캡션된 이미지를 생성했습니다. 훈련 데이터에서 어디에도 GPT-4V 디스틸레이션이 없습니다.

모모-72B는 11가지 기준 중 11개에서 Llama-3.2-90B-Vision를 제치고 있습니다. 델타는 건축이 아닙니다.  그것은 캡션 품질입니다. 상세한 인본은 짧은 웹 캡션보다 5-10배 더 많은 정보를 한 이미지에 포함하고 있으며 GPT-4V 디스틸레이션 환각이 일어나는 사실에 근거하고 있습니다.

ShareGPT4V (Chen et al., 2023) 와 Cauldron (Idefics2) 는 인간 + GPT-4V 캡션 혼합을 통해 동일한 플레이북을 따라갔다. 트렌드는 분명합니다. 2026 국경에 대해서는 캡션 밀도 > 캡션 양 > 디스틸레이션 편리함.

### 5축: 결제 및 그 일정은

Idefics2의 압축: 384 -> 448는 1-2 점을 추가합니다. 448 -> 980는 이미지 분할 (AnyRes) 으로 OCR 벤치마크에 3-5 개 더 추가합니다. 중간 정확성에서의 평평한 해상도 훈련 평판; 해상도 램핑 (start 224, finish 448 또는 native) 열차가 더 빨리 끝납니다.

캄브리아 1은 해상도와 토큰의 상환을 실시했습니다. 고정 계산에서는 더 낮은 해상도에서 더 많은 토큰을 가질 수 있고 더 높은 해상도에서 더 적은 토큰을 가질 수 있습니다. OCR에 대한 더 높은 해상도 승률; 일반적인 장면 이해에 대한 낮은 해상도 더 많은 토큰이 승리합니다.

2026 생산 레시피: OCR가 무거운 작업에 대한 역동적 해상도 최대 1280까지의 스테이지 1의 열차 384 고정, 스테이지 2의 열차.

### 프리스마틱 제어 비교

프리스마틱 VLMs (Karamcheti et al., 2024) 는 모든 축을 제어하는 논문이다. 동일한 13B LLM, 동일한 명령 데이터, 동일한 평가  한 번에 하나의 축만 변화한다. 결과:

- 이미지당 시각적 토큰 수치는 ~60%의 변수를 설명합니다.
- 엔코더 선택은 ~20%를 설명합니다.
- 연결 구조는 5%를 설명합니다.
- 다른 모든 것 (데이터 믹스, 스케줄러, LR) 나머지 ~ 15%

이것은 대략적인 부패이지만, 문헌에서 가장 깨끗한 "내가 먼저 무엇을 제거해야 하는가"에 대한 대답입니다.

### 2026년 선발자

증거들을 감안하면 2026년 새로운 프로젝트의 기본 오픈 VLM 레시피는

- 코더: NaFlex와 내셔널 해상도로 SigLIP 2 SO400m/14, 세그먼트/지속화 필요하다면 밀집한 특징을 위해 DINOv2 ViT-g/14와 연결된다.
- 연결: 패치 토큰에 2층 MLP. 토큰 제한이 없는 한 Q-Former를 skip하십시오.
- LLM: Qwen2.5 / Llama-3.1 / Gemma 2, 비용에 7B, 품질에 70B, 목표 지연으로 선택됩니다.
- 데이터: PixMo + ShareGPT4V + 카들론, 작업에 대한 명령 데이터로 추가되었습니다.
- 해상도: 동적 (분 256, 최대 1280 피클스 1 장면)
- 일정은: 단계 1의 조율 (프로젝터만), 단계 2의 완전한 정렬, 단계 3의 작업별 정렬.

이 모든 기본 설정은 이 강의 끝에서 인용된 논문에서 측정된 압축으로 거슬러 올라갑니다.

```figure
l5-vlm-recipe-knobs
```

## 사용 하 고

`code/main.py`은 압축 테이블 분석기 및 요리법 선택기입니다. 그것은 MM1 및 Idefics2 압축 테이블을 코딩합니다 (합축) 그리고 당신은 질문 할 수 있습니다:

- "예산 X와 과제 Y를 고려하면 어떤 요리법이 승리할 수 있을까?"
- "7B 라마에서 SigLIP를 CLIP로 교환하면, 예상되는 MMMU 델타는 무엇입니까?"
- "80%의 신뢰성 답에 대해 먼저 어떤 축을 어야 할까요?"

출력서는 예상 기준 델타와 "처음으로 " 추천을 가진 순위화된 요리법 목록입니다.

## 선박

이 교훈은`outputs/skill-vlm-recipe-picker.md`. 목표 작업 혼합, 계산 예산 및 지연 목표에 따라, 그것은 모든 선택을 정당화하는 추축에 인용을 가진 완전한 레시피 (코더, 커넥터, LLM, 데이터 혼합, 해상 스케줄) 를 발급합니다. 새로운 VLM 프로젝트 시작 때마다 엔지니어들이 Idefics2 추축 테이블을 재발견하는 것을 막습니다.

## 운동

1. MM1 섹션 3.2 을 읽어 보세요. 예산 50M 이미지에서 고정된 2B LLM에 대해, 어떤 코더가 승리합니까? 13B LLM에 대한 대답은 왜?

2. 캄브리아 1 연구 결과, DINOv2 + SigLIP의 연쇄가 비전 중심의 기준에서 혼자보다 더 좋은 성과를 거두지만 MMMU에 신호를 추가하지 않습니다. 어떤 기준이 증가하고 어떤 기준이 평평하게 유지되는지 예측하십시오.

3. 2B LLM에 모바일 UI 에이전트를 습니다. 코더, 커넥터, 해상도, 데이터 믹스를 선택하세요. 각 선택은 특정 압축 테이블로 정당화하세요.

4. 모모는 4B와 72B 모델을 판매하고 있습니다. 4B는 폐쇄된 7B VLM와 경쟁력을 갖췄으며, 72B는 11/11 기준에서 Llama-3.2-90B-Vision를 제치고 있습니다.

5. 7B VLM에서 데이터 믹스 품질과 코더 품질을 분리하기 위해 압축 테이블을 설계하십시오. 최소 몇 번의 훈련 실행이 있습니까? 네 개의 축 설정을 제안하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Ablation | "Turning one knob" | Training multiple runs that differ in exactly one design-space axis, holding everything else constant |
| Connector | "Bridge" / "projector" | Trainable module that maps vision encoder output into the LLM's token space (MLP, Q-Former, Perceiver) |
| Detailed human caption | "Dense caption" | A multi-sentence human-written description (typically 80-300 tokens) richer than a web alt text |
| Distillation | "GPT-4V captions" | Training data generated by a stronger proprietary VLM; convenient but prone to inherited hallucination |
| AnyRes / dynamic res | "High-res path" | Strategy to feed images larger than the encoder's native resolution via tiling or M-RoPE |
| Resolution ramp | "Curriculum" | Training schedule that starts low-resolution and increases, speeding alignment learning |
| Vision-centric bench | "CV-Bench / BLINK" | Evaluation that stresses fine-grained visual perception rather than language-heavy reasoning |
| PixMo | "Molmo's data" | Allen AI's 712K densely-captioned image dataset; human speech transcribed into dense captions |

## 더 많은 읽기

- [McKinzie et al. — MM1 (arXiv:2403.09611)](https://arxiv.org/abs/2403.09611)
- [Laurençon et al. — Idefics2 / What matters building VLMs (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Deitke et al. — Molmo and PixMo (arXiv:2409.17146)](https://arxiv.org/abs/2409.17146)
- [Tong et al. — Cambrian-1 (arXiv:2406.16860)](https://arxiv.org/abs/2406.16860)
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865)
