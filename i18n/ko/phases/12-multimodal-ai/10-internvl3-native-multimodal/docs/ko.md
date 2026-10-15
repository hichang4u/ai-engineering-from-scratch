# InternVL3: 네이티브 멀티모달 프리트레이닝

> InternVL3 이전 모든 오픈 VLM는 동일한 세 단계의 레시피를 따랐습니다. 텍스트 토큰의 트리లియన్에 의해 훈련된 텍스트 LLM를 가져가서 비전 코더를 고, 을 세밀하게 조정합니다. 이 방법은 효과가 있지만, 조화를 빚  텍스트 LLM는 순수한 텍스트에 전 전 교육 예산을 지출하고 시각적 토큰을 원천적으로 이해하지 못합니다. 비전 후 후 후를 추가할 때, LLM는 텍스트를 잊지 않고 시각적 입력을 텍스트 추론과 어떻게 연관시킬지 다시 배워야 합니다. InternVL3 (Zhu et al., 2025년 4월) 는 포스트호크 접근 방식을 거부한다. 결과는 MMMU-Pro에서 Gemini 2.5 Pro와 78B 파램 오픈에 일치합니다. 이 교훈은 네이티브 사전 훈련의 사례와 당신이 그것을 할 때 어떤 변화가 있는지 알려줍니다.

**Type:** Learn
**Languages:** Python (stdlib, training-corpus mixer)
**Prerequisites:** Phase 12 · 05, Phase 12 · 07 (recipes)
**Time:** ~120 minutes

## 학습 목표

- 포스트하크 VLM 훈련이 왜 조화 빚을 축적하는지 설명하고 세 가지 측정 가능한 증상을 인용하십시오 (재해적 잊기, 응답 추동, 시각 텍스트 불합동성).
- InternVL3의 본래의 훈련 전용 코퍼스 믹스를 설명하고, 텍스트의 비율이 왜 중요하는지 설명해 주세요.
- Qwen2-VL의 M-RoPE (변수 시각 위치 코딩) 과 비교하십시오.
- 시각적 해상도 라우터 (ViR) 및 디커플드 비전 언어 (DvD) 배포 최적화 이름을 지정하십시오.

## 문제

후임 VLM 훈련은 기본입니다. LLaVA, BLIP-2, Qwen-VL, Idefics  모두 이미 사전 훈련 된 LLM (Llama, Vicuna, Qwen, Mistral) 를 취하고 시력을 추가합니다. 훈련 단계는 일반적으로 다음과 같습니다:

1. 얼음 LLM + 얼음 비전 코더 + 트레이닝 가능한 프로젝터, 임베디션을 정렬하기 위해 캡션 쌍에 훈련되었습니다.
2. LLM를 해제하고, 교육 데이터를 훈련 (LLaVA-Instruct, ShareGPT4V).
3. 선택적 작업에 대한 정밀 조정

3가지 증상이 나타납니다.

- 망각하는 일이죠. 포스트하크 VLM는 텍스트만 사용하는 기술을 잊고 있습니다. GSM8K 점수는 5-10점 감소합니다. 헬라스웨그 점수는 감소합니다. 순수한 텍스트 에이전트들은 퇴행합니다.
- 답 드리프. 같은 시각 질문의 작은 문장들은 다른 답을 얻습니다. 시각 코더는 LLM의 자신의 토큰보다 약한 결합으로 LLM에 연결됩니다.
- 시각적 텍스트 불합동성. VLM는 이미지를 올바르게 묘사하고 그 다음 자신의 설명에 반하는 질문에 대답할 수 있습니다. 시각적 토큰은 텍스트와 같은 LLM의 내부 일관성 검사에 참여하지 않습니다.

이 증상은 잘 기록되어 있습니다. MM1.5 섹션 4은 그들을 수치화합니다. LLaVA-OneVision의 추종은 그들을 암시합니다. 네이티브 사전 훈련은 답입니다.

## 개념

### 모태형 멀티모달 사전 훈련

InternVL3는 처음부터 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형 모형

- 40%의 텍스트 데이터 (FineWeb, Proof-Pile-2, 등)
- 35%의 간접 이미지 텍스트 데이터 (OBELICS, MMC4 스타일)
- 20% 쌍용 이미지 캡션 데이터
- 5% 비디오 텍스트 데이터

시력 토큰, 텍스트 토큰, 크로스 모달 상호작용은 모두 첫 번째 기하급수 단계부터 같은 손실에 참여합니다. 조렬 전 훈련, 프로젝터 얼어붙는 단계, 재난의 회복을 잊는 단계가 없습니다.

교육은 기본 모델에 대한 단일 단계입니다. 교육 조정이 이어집니다. 그러나 기본 모델은 이미 1급 시민으로서 시각적 토큰을 이해합니다.

### V2PE (변수 시각 위치 코딩)

Qwen2-VL는 고정 축 분배를 가진 M-RoPE를 사용합니다. InternVL3는 V2PE를 도입합니다. 위치 코딩은 학습 가능한 확장으로 모달리티 유형 ( 텍스트, 이미지, 비디오) 에 따라 다릅니다. 실제:

- 텍스트 토큰은 1D 위치 ( 텍스트 인덱스) 를 얻습니다.
- 이미지 패치는 2D 위치 (열, col) 를 얻을 수 있습니다.
- 비디오 프레임은 3D 위치 (시간, 줄, col) 를 얻을 수 있습니다.

이 세 가지 모두 같은 RoPE 주파수 기반을 공유하지만, 각 밴드마다 숨겨진  분배는 고정 분할이 아닌 학습된 매개 변수입니다. 훈련 전 동안 시간적 대 공간적 주파수 해상도를 교환 할 자유.

V2PE의 압축 주장: 같은 계산에서 M-RoPE보다 비디오 기준에 1-2 점. 혁명이 아니라 더 깨끗합니다.

### 시각적 해상도 라우터 (ViR)

배포 최적화. 모든 이미지는 풀레솔루션 코딩이 필요하지 않습니다. 낮은 세부 사항에 있는 한 객체가 있는 사진은 1280px 네이티브로 코딩되면 토큰을 낭비합니다. ViR는 질문에 답하기 위해 필요한 최소한의 해상도를 예측하는 작은 분류기입니다.

라우팅은 세 단계로 나뉘어 있습니다. 저 해상 (256 토큰), 중소 (576), 높은 (2048+). 생산 트래픽의 60%의 질의 경우, 낮은 또는 중소가 충분합니다. 순 효과: 동일한 품질에서 2-3x 처리량.

### 비전 언어 (DvD) 분해 배포

큰 VLM를 서비스할 때, 비전 엔코더는 한 이미지에 한 번 실행되지만 LLM는 모든 출력 토큰에 대해 자동으로 실행됩니다. 두 구성 요소는 서로 다른 병목을 가지고 있습니다.

8B + 400M 코더 모델에서 DvD는 노드 당 출력량과 공동 위치량에 약 두 배가 된다.

### 단일 단계와 다 단계 품질

InternVL3의 주요 벤치마크 주장: 78B 파라마에서 Gemini 2.5 Pro의 MMMU-Pro와 일치합니다. 38B에서 GPT-4o와 일치합니다. 8B에서 오픈-8B 리더보드를 이끌고 있습니다. 모든 것은 단일 단계 사전 훈련 + 지침 조율 레시피에 있습니다.

조화-부채 가설은 측정가능하다: InternVL3-8B는 시력-부ेंच마크 이득 단위당 Qwen2.5-VL-7B보다 텍스트 벤치마크 포인트 (MMLU, GSM8K) 를 덜 잃는다. 모델은 훈련이 두 개가 아니라 하나의 조각이었기 때문에 더 일반적입니다.

### InternVL3.5 및 InternVL-U

InternVL3.5 (2025년 8월) 은 레시피를 확장합니다. 동일한 네이티브 프리트레인 접근 방식, 더 많은 데이터, 더 많은 패럼. MMMU 개선은 점진적입니다.

InternVL-U (2026) 는 동일한 척추 위에 MMDiT 헤드를 통해 통일된 세대  이미지 출력을 추가합니다. "U"는 "U+ 세대"를 의미합니다.

### 본인 사전 훈련의 타협

모국인 사전 훈련은 무료가 아닙니다.

- 계산. 새로운 VLM를 처음부터 훈련하는 것은 텍스트 LLM를 훈련시키는 것과 동일한 비용입니다.
- 데이터. 스케일에서 간접화된 이미지- 텍스트 코퍼는 드물다. OBELICS는 141M 문서; MMC4는 571M. 텍스트만으로는 15T 토큰으로 전송됩니다. 멀티모달 사전 훈련 데이터 부족은 어려운 제약입니다.
- 기본 LLM 재사용. 네이티브 사전 훈련은 나중에 새로운 LLM를 내놓는 옵션을 포기합니다. 포스트하크는 어댑터만 재교육함으로써 Llama-3.1를 Llama-4로 교환 할 수 있습니다.

InternVL3의 베팅은: 리조닝 빚은 재사용 손실보다 더 나쁘다. 기준은 주장을 뒷받침합니다. 생산 비용은 미래의 실험실을 저렴하게 복제하는 것을 막습니다. 포스트호크 VLM는 대부분의 프로젝트에 더 저렴하기 때문에 계속 존재합니다.

```figure
l5-native-pretrain
```

## 사용 하 고

`code/main.py`훈련-체육 믹서와 ViR 라우터 시뮬레이터입니다.

- 목표형 코퍼스 혼합 (% 텍스트, % 간편, % 캡션, % 비디오) 를 취하고 모달에 따라 예상되는 단계를 계산합니다.
- 조회에 대한 ViR 라우팅을 시뮬레이션합니다 (분배: 50% 낮은 세부 사항, 30% 중형, 20% 높은 세부 사항) 그리고 평균 토큰 수를보고합니다.
- 코더와 LLM FLOPs에 대한 DvD 처리량 추정치를 보고합니다.
- 패럼, 컴퓨팅, 데이터 및 예상된 조화-채무 증상에서 포스트호크 vs 네이티브 사전 훈련의 부위를 인쇄합니다.

## 선박

이 교훈은`outputs/skill-native-vs-posthoc-auditor.md`. 제안된 VLM 교육 계획에 따르면, VLM 교육은 본래 또는 후계 교육이 필요한지 여부를 감사하고, 조화와 부채 위험을 표시하고, 코퍼시스 혼합을 추천합니다.

## 운동

1. InternVL3-8B (국민 전차) 와 LLaVA-OneVision-7B (후하크) 사이의 계산 델타를 추정하십시오. GPU 시간 비율이 대략적으로요. 그 격차는 무엇에 의해 설명됩니다?

2. InternVL3는 40% 텍스트 / 35% 간접화 / 20% 캡션 / 5% 비디오를 보고합니다. 목표 작업이 비디오가 무거운 경우 새로운 비율을 제안하고 기본 모델이 여전히 상당한 텍스트 및 캡션 데이터가 필요한 이유를 주장하십시오.

3. MM1.5 섹션 4 을 읽어 보세요. 잊기 에 관한 것. 포스트하크 훈련 에서 가장 큰 회귀 를 나타낸 정확한 기준 을 명명 하십시오. 회귀 비용은 얼마입니까?

4. ViR는 60%의 트래픽을 저 해상도 코딩으로 전달합니다. 어떤 종류의 쿼리를 잘못 전달합니다. (고 해상도의 필요성이 있을 때 저 해상도로 전송합니다.)

5. DvD는 비전과 LLM를 분리하여 GPU로 나뉘어 있습니다. 어떤 교통 패턴에 따라 DvD는 도움이 아닌 처리량을 손상시킵니다?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Native multimodal pretraining | "From scratch together" | Text + image + video tokens participate in the loss from step 1, not bolted on later |
| Alignment debt | "Post-hoc penalty" | Measurable regression in text skills and answer consistency that comes from bolting vision onto a frozen LLM |
| V2PE | "Variable visual pos encoding" | Per-modality learnable position encoding allocation; InternVL3's M-RoPE successor |
| ViR | "Resolution router" | Small classifier that picks minimum resolution needed per query before encoding, saving inference tokens |
| DvD | "Decoupled deployment" | Vision encoder on one GPU, LLM on another, with stream handoff; doubles throughput for large VLMs |
| InternVL-U | "Unified understanding + generation" | 2026 follow-up that adds image-generation heads to the native-pretrain backbone |
| Interleaved corpus | "OBELICS / MMC4" | Documents with text and images in natural reading order; the raw material for native pretraining |

## 더 많은 읽기

- [Chen et al. — InternVL 1 (arXiv:2312.14238)](https://arxiv.org/abs/2312.14238)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
- [InternVL3.5 (arXiv:2508.18265)](https://arxiv.org/abs/2508.18265)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Zhang et al. — MM1.5 (arXiv:2409.20566)](https://arxiv.org/abs/2409.20566)
