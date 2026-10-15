# LLaVA 및 시각 명령 조율

> LLaVA (2023년 4월) 는 지구상에서 가장 많이 복사된 멀티모달 건축물입니다. BLIP-2의 Q-Former를 2층 MLP로 대체하고, 플라밍고의 게이트된 크로스-아테테네이션을 순진한 토큰 협연으로 대체하고, GPT-4에서 생성된 158k 시각적 명령 회전에서 텍스트만 캡션에서 훈련했습니다. 2023년과 2026년 사이에 VLM를 만든 모든 실무자는 LLaVA의 어떤 변종을 만들었습니다. LLaVA-1.5은 AnyRes를 추가했습니다. LLaVA-NEXT 해상도가 높았습니다. LLaVA-OneVision 통합 이미지, 멀티 이미지, 비디오 이 수업은 레시피를 읽고, 프로젝터를 실행하고, "소impleer가 승리한 이유"를 설명합니다.

**Type:** Build
**Languages:** Python (stdlib, projector + instruction-template builder)
**Prerequisites:** Phase 12 · 02 (CLIP), Phase 11 (LLM Engineering — instruction tuning)
**Time:** ~180 minutes

## 학습 목표

- 2층 MLP 프로젝터를 구축하여 ViT 패치 임베디션을 (dim 1024) LLM의 임베디션 dim (dim 4096) 로 지도합니다.
- LLaVA의 2단계 레시피를 따라가십시오: (1) 558k 캡션 쌍에서 프로젝터 정렬, (2) 158k GPT-4 생성 턴에서 시각 명령 조율.
- 이미지 토큰 위치지, 시스템 프롬프트, 사용자/어시스턴트 회전으로 LLaVA 형식의 프롬프트를 구성합니다.
- Q-Former의 토큰 예산 승리에 불구하고 커뮤니티가 Q-Former에서 MLP로 이동하는 이유를 설명하십시오.

## 문제

BLIP-2의 Q-Former (강좌 12.03) 은 32개의 토큰으로 이미지를 압축합니다. 깨끗하고 효율적이며 벤치마크에 적합합니다. 하지만 두 가지 문제가 있습니다.

Q-Former는 훈련 가능하지만 손실은 최종 작업이 아닙니다. 1단계는 ITC+ITM+ITG를 훈련시킵니다. 2단계는 LM 손실을 훈련시킵니다. 질의들은 LLM가 다음으로 해독해야 하는 중간 표현을 학습합니다.

둘째, Q-Former는 188M파램을 차지하고 있고, LLaVA의 2023 스케일에서는 목표를 위한 LLM와 공동으로 설계해야 했습니다. LLM를 변경하고 Q-Former를 재교육합니다. 비전 코더를 변경하고 재교육합니다. 모든 조합은 별도의 R&D 프로젝트였습니다.

LLaVA의 대답은 단순함 때문에 부끄러운 것이었습니다. ViT의 576개의 패치 토큰을 가지고`1024 → 4096 → 4096`576개 모두 LLM의 입력 순서로 던지세요. 병목이 없습니다. 이상적인 목표에 대한 1단계 사전 훈련이 없습니다.

데이터 는 어디서 나오는 것 입니까? LLaVA 의 두 번째 통찰력: 명령 데이터 를 생성 하기 위해 GPT-4 ( 텍스트 만) 를 사용 하십시오. 그림 을 위해 COCO 캡션 및 경계 상자 데이터를 GPT-4 에 공급 하십시오. 대화, 설명 및 복잡한 추론 의 질문을 생성 하라고 요청 하십시오. 명령- 응답 158k는 무료로 회전 합니다. 인간 해설도 없습니다.

그 결과: 8개의 A100에 하루 동안 운행한 VLM가 MMMU에서 플라밍고를 제치고, 커뮤니티가 확장할 수 있는 개방된 체크포인트를 선보였다. 2023년 말까지 50개 이상의 포크를 낳았다.

## 개념

### 건축

LLaVA-1.5 13B:
- 시력 코더: CLIP ViT-L/14 @ 336 (단계 1에서 얼어붙은, 선택적으로 2단계에서 얼어붙지 않은)
- 프로젝터: GELU 활성화를 위한 2층 MLP, `1024 → 4096 → 4096`- 그래
- LLM: 비쿠나-13B (이후 라마-3.1-8B).

이미지 + 텍스트 명령어를 앞으로 전송:

```
img -> ViT -> 576 patches of dim 1024
patches -> MLP -> 576 tokens of dim 4096
prompt: system + "<image>" placeholder + user question
replace <image> token with the 576 projected tokens
feed the full sequence to the LLM
decode response
```

이 이미지는 LLM 컨텍스트의 576 개의 토큰을 차지합니다. 2048 컨텍스트에서는 텍스트에 대한 1472 개의 토큰이 남아 있습니다. 32k 컨텍스트에서는 라운딩 오류입니다.

### 단계 1: 프로젝터 조율

Freeze ViT. Freeze LLM. 2층 MLP만 훈련하십시오. 데이터셋: 558k 이미지 캡션 커플 (LAION-CC-SBU). 손실: 캡션에 대한 언어 모델링, 투영된 이미지 토큰에 따라 조건.

128 배트에서 한 시대 동안 이것은 몇 시간 안에 이루어집니다. 프로젝터는 ViT 공간을 LLM 공간으로 지도하는 것을 배우습니다. 작업에 대한 특정 감독이 없습니다.

### 단계 2: 시각적 명령어 조율

프로젝터를 해제 (아직도 훈련 가능) LLM를 해제 (일반적으로 완전, 때로는 LoRA) 를 15만 개의 시각적 교육 회전에서 훈련하십시오.

명령 데이터가 속임수입니다.
1. 코코의 사진을 찍어보세요.
2. 텍스트 설명 (5인본 + 경계 상자 목록) 을 추출하십시오.
3. 3개의 예제와 함께 GPT-4에 보내십시오.
   - 대화: "이 사진에 대해 사용자와 보조가 앞뒤로 대화를 만들어보세요".
   - 상세한 설명: "그 사진에 대한 풍부한 상세한 설명을 주세요".
   - 복잡한 사유: "그 사진 에 대해 사유 를 제시 해야 할 질문 을 해 보고 대답 해 주십시오".
4. GPT-4의 출력을 (지침, 응답) 쌍으로 분석한다.

이 모든 것은 이미지에 직접적으로 영향을 미치지 않습니다. 텍스트 설명만 합니다. GPT-4는 유연한 이미지 내용을 환각시킵니다. 약간의 소음, 하지만 효과가있었습니다. 대화 잠금을 풀기 위해 158k 회전이 충분했습니다.

### 왜 커뮤니티가 이것을 복사했는가

- 1단계별 손실은 없습니다.
- 프로젝터는 몇 시간 안에 열차가 됩니다. 며칠이 아니라
- LLM는 단지 프로젝터를 재교육함으로써 교환될 수 있습니다 (LLaVA-Llama2, LLaVA-Mistral, LLaVA-Llama3).
- 시각적 명령 데이터 파이프라인은 GPT-4를 사용하며 새로운 도메인을 위해 재생하는 데 저렴합니다.

### LLaVA-1.5 및 LLaVA- NEXT

LLaVA-1.5 (2023년 10월) 는 다음과 같이 추가되었습니다.
- 학업 과제 데이터 (VQA, OKVQA, RefCOCO) 를 교육 조정에 혼합합니다.
- 더 나은 시스템 시급
- 2048 → 32k 컨텍스트

LLaVA-NeXT (2024년 1월) 는 다음과 같이 추가하였다.
- AnyRes: 336x336 작물의 2x2 또는 1x3 그리드로 고해상도 이미지를 나눌 수 있습니다. 그리고 하나의 글로벌 저해상도 소형화입니다. 각각의 작물은 576 개의 토큰으로 변합니다. 전체적으로 한 이미지에 약 2880 개의 시각 토큰이 있습니다. OCR 및 차트 작업이 뛰어납니다.
- 더 나은 명령 데이터 혼합과 ShareGPT4V (고품질 GPT-4V 캡션)
- 더 강한 기반 LLM (Mistral-7B, Yi-34B).

### LLaVA-OneVision

12.08 수업은 OneVision를 깊이 다루고 있습니다. 단편 버전: 동일한 프로젝터, 그러나 단일 이미지, 멀티 이미지 및 비디오를 공유한 시각 토큰 예산으로 한 모델에서 다루는 교육과정을 통해 훈련되었습니다.

### Q-Former과 비교

| | Q-Former (BLIP-2) | MLP (LLaVA) |
|---|---|---|
| Visual tokens per image | 32 | 576 (base) or 2880 (AnyRes) |
| Trainable params | 188M + LM | 40M + LM |
| Stage 1 loss | ITC+ITM+ITG | LM only |
| LLM drop-in | Requires retrain | Swap with minimal retrain |
| Multi-image | Awkward | Natural (concat) |
| Video | Awkward | Natural (per-frame concat) |
| Token budget | Small | Large |

MLP는 단순성과 토큰 유연성에 승리합니다. Q-Former는 토큰 예산에 승리합니다. 2023 년 말까지 토큰 예산은 더 이상 구속력 있는 제약이 없었습니다 (LLM 컨텍스트는 32k-128k+로 성장했습니다) 그리고 단순성이 지배했습니다.

### 간략한 형식

```
A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions. USER: <image> Describe this image in detail. ASSISTANT: The image shows ...
```

`<image>`토큰은 위치지식 토큰이다. 토큰화 이전에는 576개의 시각 토큰 (또는 AnyRes로 2880개의 시각 토큰) 로 대체된다. 토큰화자는 훈련된 것보다 약간 더 긴 염열을 볼 수 있지만, LLM는 단계 1이 학습했기 때문에 새로운 입력을 처리한다.

### 파라미터 경제

LLaVA-1.5-7B 분해:
- CLIP ViT-L/14 @ 336: 303M (냉장 단계 1, 종종 비냉장 단계 2)
- 프로젝터 (2x 선형): ~ 22M 트레이닝 가능
- 라마7B: 7B
- 전체: 7.3B 파라마스. 스테이지 2: 전체 7B + 22M 프로젝터 동안 훈련 할 수 있습니다.

2단계 훈련 비용은: 8xA100에서 ~20시간입니다. 이것은 1일, 1 노드, 재생 가능한 키 숫자입니다. 그래서 LLaVA가 퍼졌습니다.

```figure
mm-llava-projector
```

## 사용 하 고

`code/main.py`이 도구는

1. 순수한 파이썬에서 2층 MLP 프로젝터 (놀이용 규모로 16 → 32 → 32)
2. 시동 구축 파이프라인: 시스템 시동 + `<image>`N 투크로된 토큰 + 사용자 회전 + 보조 생성 장소holder로 대체됩니다.
3. LLM 컨텍스트에서 576 토큰 시각 블록이 어떻게 보이는지 (사용된 2k / 32k / 128k 컨텍스트의 비율) 를 위한 시각화

## 선박

이 교훈은`outputs/skill-llava-vibes-eval.md`.LLaVA 가족 체크포인트 를 고려 한 이 경우, 10 개의 프롬프트 비브 에eval 스위트를 실행 합니다. (3 캡션, 3 VQA, 2 논리, 2 거부) 그리고 인간 가 읽을 수 있는 점수 카드를 보고 합니다. 벤치마크는 아닙니다. 프로젝터와 LLM가 잘 연결되고 있음을 확인하기 위한 흡연 테스트입니다.

## 운동

1. 2층 MLP 프로젝터에서 트레이닝 가능한 파라미터 수를 계산합니다`1024 → 4096 → 4096`GELU와 편향으로, LLaVA-13B의 어떤 분자를 나타냅니다?

2. " 거절" 사건에 대한 LLaVA 요청을 작성합니다. 이 이미지는 개인을 포함합니다. 예상되는 보조 응답을 작성하십시오. LLaVA는 왜 이 제로 샷을 거부해야 하며 거절을 강화하기 위해 어떤 훈련 데이터가 필요할까요?

3. LLaVA-NeXT 블로그의 AnyRes 섹션을 읽어보십시오. AnyRes에서 1344x672 이미지에서 시각 토큰 수를 계산하십시오. 336x336에서 576 토큰을 기본으로 비교하십시오.

4. LLaVA 스테이지-1 프로젝터는 캡션에 LM 손실을 훈련합니다. 스테이지 1을 건너뛰고 스테이지 2 (비जु얼 명령 조율) 로 가면 어떻게 될까요?

5. LLaVA-Instruct-150k는 명령어를 생성하기 위해 GPT-4을 COCO 캡션으로 사용합니다. 새로운 영역 (의료 X선, 위성 이미지) 에 대해, 도메인 명령어를 생성하기 위해 네 단계 데이터 파이프라인을 설명하십시오. 각 단계에서 무엇이 잘못될 수 있습니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Projector | "MLP bridge" | 2-layer MLP with GELU mapping ViT dim to LLM dim |
| Image token | "<image> placeholder" | Prompt marker replaced by N projected visual tokens before inference |
| Visual instruction tuning | "LLaVA stage 2" | Training on GPT-4-generated (image, instruction, response) triplets |
| Stage 1 alignment | "Projector pretraining" | Freeze ViT and LLM, train projector with LM loss on captions |
| AnyRes | "Multi-crop tiling" | Split high-res image into a tile grid and concatenate each tile's visual tokens |
| LLaVA-Instruct | "GPT-4-generated" | 158k instruction-response pairs synthesized from COCO captions + GPT-4 |
| Vision encoder freeze | "Backbone locked" | CLIP weights do not update in stage 1, sometimes not in stage 2 either |
| ShareGPT4V | "Better captions" | 1M dense captions generated by GPT-4V, used for higher-quality alignment |
| VQA | "Visual question answering" | Task of answering a free-form question about an image |
| Prismatic VLMs | "Design-space paper" | Karamcheti 2024 ablation systematically testing projector and data choices |

## 더 많은 읽기

- [Liu et al. — Visual Instruction Tuning (arXiv:2304.08485)](https://arxiv.org/abs/2304.08485) LLaVA 논문
- [Liu et al. — Improved Baselines with Visual Instruction Tuning (arXiv:2310.03744)](https://arxiv.org/abs/2310.03744) LLaVA-1.5.
- [Chen et al. — ShareGPT4V (arXiv:2311.12793)](https://arxiv.org/abs/2311.12793)         
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865) 디자인 공간의 압축.
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326) 단일 이미지, 멀티 이미지, 비디오
