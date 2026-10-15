# 플라밍고 및 게이트 크로스 주의력

> DeepMind의 플라밍고 (2022) 는 다른 사람들보다 두 가지 일을 했습니다. 하나의 모델이 임의로 서로 얽힌 이미지, 비디오 및 텍스트를 처리할 수 있음을 보여주었습니다. 그리고 VLM가 3개의 예제 (사진, 캡션) 쌍으로 몇 번의 샷을 제공하여 어떤 gradient 단계 없이 새로운 이미지를 캡션하는 것을 학습할 수 있음을 보여주었습니다. 메커니즘: 얼어붙은 LLM의 기존 계층 사이에 삽입된 게이트된 크로스-아트런션 레이어, 학습된 tanh 게이트가 0에서 시작하여 LLM의 텍스트 능력은 초기화 시 보존됩니다. 이 수업은 플라밍고의 퍼시버 리패플러와 게이트된 크로스-아트런션 아키텍처를  트메니의 융합된 입력과 Idefics2의 시각적 토큰의 조상으로 진행합니다.

**Type:** Learn
**Languages:** Python (stdlib, gated cross-attention + Perceiver resampler demo)
**Prerequisites:** Phase 12 · 03 (BLIP-2 Q-Former)
**Time:** ~120 minutes

## 학습 목표

- 게이트된 크로스 주의가 어떻게 얼어붙은 LLM의 텍스트 능력을 tanh(gate) = 0를 통해 초기화 할 수 있는지 설명하십시오.
- Perceiver 재 샘플러를 통해 이동: N 이미지 패치 → K 고정 "실적" 질의를 통해 간접 주의.
- 플라밍고가 이미지 배치에 존중을 주는 인과적 마스크를 통해 간접적으로 얽힌 이미지 텍스트 순서들을 처리하는 방법을 설명해 주십시오.
- 몇 번의 촬영을 한 멀티모달 프롬프트 구조를 재생 (사진 캡션 예제 3 개, 질의 이미지)

## 문제

BLIP-2는 32개의 시각 토큰을 얼어붙은 LLM의 입력층에 공급합니다. 각 요청에 한 이미지만 사용할 수 있습니다. 하지만 "이곳은 A 이미지, 캡션; 이곳은 B 이미지, 캡션; 이곳은 C 이미지, 캡션"과 같은 텍스트와 접목된 많은 이미지를 먹이고 싶다면? LLM의 자기주의는 하나의 스트림에서 이미지 토큰과 텍스트 토큰을 처리해야 하며, 어떤 위치에서 어떤 이미지를 볼 수 있는지에 대한 질문은 번거로움을 유발합니다.

플라밍고의 대답은 LLM의 입력 흐름을 전혀 바꾸지 마십시오. 기존 LLM 블록들 사이에 추가적인 간접 주의층을 삽입한다. 텍스트 토큰은 여전히 LLM의 사유적 자기주의를 통해 흐른다. LLM 블록 중 몇 개마다 텍스트 토큰은 새로운 게이트 레이어를 통해 이미지 기능에 상호 작용합니다. 게이트 (초기적으로 0으로) 는 0 단계에 새로운 층이 작동하지 않는 것을 의미합니다 훈련이 진행되면서 문이 열리고 시각적 정보가 흐르기 시작합니다.

두번째 질문에는 플라밍고가 대답했습니다. 프롬프트당 변수된 이미지 수가 (0, 1, 또는 많은) 를 어떻게 처리할 것인가? 퍼시버 재 샘플러 (Perceiver resampler) 는 당신이 가진 패치 수를 모두 가져다가 고정된 수의 시각적 잠잠한 토큰을 생성하는 작은 크로스-아트런스 모듈입니다. LLM 크로스-아트런스 레이어는 프롬프트에 얼마나 많은 이미지가 있는지에 관계없이 동일한 모양을 볼 수 있습니다.

## 개념

### 얼어붙은 LLM

플라밍고는 얼어붙은 칠라 70B LLM로 시작됩니다. 모든 70B 무게는 무관합니다. 기존 텍스트 자주의와 FFN는 정상적으로 작동합니다.

### 감지기 재 샘플링

이 프롬프트의 각 이미지에 대해 ViT는 생성합니다.$N$패치 토큰, 감지자 재 샘플링은$K$고정 학습 가능한 잠자리 (Flamingo 사용 $K=64$) 각 리스패틀링 블록은 두 가지 하위 단계로 구성됩니다.

1.                 $K$             $N$패치 토큰 (LATENTS에서 Q, 패치에서 K/V)
2. 자기주의 + FFN

6개의 리패플러 블록이 끝나면 출력값은 $K=64$ViT가 얼마나 많은 패치를 생성했는지 상관없이 dim 1024의 시각적 토큰. 224x224 이미지 (196 패치) 및 480x480 이미지 (900 패치) 모두 64개의 리스패블러 토큰으로 출력합니다.

비디오에 대해, 리스패블러는 시간적으로 적용됩니다. 각 프레임의 패치가 64 개의 잠복을 생성하고, 시간적 위치 코딩은 모델을 구별 할 수 있습니다.$t=0$$t=N$. 전체 비디오가$T \cdot 64$시각적 토큰

### 어있는 간접주의

모든 것 사이에$M$얼음 된 LLM의 층 (Flamingo 사용 $M=4$), 새로운 이 된 교차 주의 블록을 삽입:

```
x_after_llm_block = llm_block(x_before)
cross = cross_attn(x_after, resampler_output)
gated = tanh(alpha) * cross + x_after
x_before_next_block = gated
```

- `alpha`0으로 초기화된 학습 가능한 스칼라입니다.
- `tanh(0) = 0`, 그래서 init에 게이트 된 분자가 0을 기여합니다.
- - 아`alpha`0에서 멀어지면, 간접주의는 순조롭게 증가합니다.
- 잔여 연결은 완전히 열린 게이트가 LLM의 텍스트 표현을 덮어쓰지 않는다는 것을 의미합니다. 그것은 단지 상단에 시각적인 정보를 추가합니다.

이것은 플라밍고에서 가장 중요한 디자인 선택입니다. 시각 컨디션은 추가적이고, 게이트되어 있으며 초기화 시 0입니다. 단계 0에 있는 플라밍고는 텍스트 입력에만 완벽한 칠라 70B입니다.

### 이 이 이 이 이 이 이 이 이

"< 이미지 A> 서두문 A < 이미지 B> 서두문 B < 이미지 C> ?"와 같은 프롬프트에서, 각 텍스트 토큰은 순서에서 그 이전에 나온 이미지를만 볼 수 있습니다.`t`이미지 인덱스인 이미지 리패플러 토큰에만 적용됩니다 `i < i_t`어디`i_t`위치 이전 가장 최근의 이미지입니다`t`"최후의 이미지를만 보며" 또는 "모든 이전 이미지를 보며"는 모두 유효한 선택입니다. 플라밍고는 첫 번째를 선택했습니다.

### 맥락에서 몇 번의 학습

플라밍고의 명령은 다음과 같습니다.

```
<image1> A photo of a cat. <image2> A photo of a dog. <image3> A photo of a
```

모델은 완성 패턴을 보고 "새" (또는 어떤 이미지 3도 보여) 를 출력합니다. gradient 단계가 없습니다. 얼어붙은 LLM의 맥락 내 학습 능력은 포착된 교차주의를 통해 수행합니다.

### 교육 자료

플라밍고는 세 개의 데이터 세트에 훈련되었습니다.

1. 멀티모달 매시브웹 (M3W): 43M 웹 페이지, 서로 겹쳐진 이미지 및 텍스트로 읽기 순서를 재구성합니다.
2. 이미지- 텍스트 쌍 (ALIGN + LTIP): 4.4B 쌍.
3. 비디오 텍스트 커플 (VTP): 27M 단편 비디오 클립.

OBELICS (2023) 는 Idefics, Idefics2 및 대부분의 개방형 "플라밍고와 같은" 모델이 훈련하는 겹쳐진 웹 코퍼스의 개방형 재생입니다.

### 오프 플라밍고와 오터

오픈플라밍고 (2023) 는 오픈 재생입니다. 아키텍처는 동일 (감시자 재 샘플러 + 얼어붙은 LLaMA 또는 MPT에 게이트 된 가로 주의). 3B, 4B, 9B에서 체크포인트.

오터 (2023) 는 OpenFlamingo를 기반으로 MIMIC-IT (다형 명령어 데이터 세트) 에 대한 명령어 조정으로 구축되어 있으며, 명령어를 따르는 게이트 된 크로스-아트런션 작업도 보여줍니다.

### 후손들

- Idefics / Idefics2 / Idefics3: Hugging Face의 게이트된 크로스-아트런스 라인하이지는 점차 단순해졌다 (Idefics2는 적응형 퓨리링을 통해 직접 패치 토큰을 선호하는 재 샘플링을 포기했다).
- 플라밍고에서 샤멜레온으로의 전환: 2024년까지 많은 팀이 조기 융합 (학습 12.11) 으로 이동했습니다. 플라밍고 스타일의 게이트 크로스-아테네이션은 척추 얼음이 필요한 생산에 남아 있습니다.
- 쌍둥이의 융합된 입력: 개념적으로 플라밍고의 융합된 형식의 유연성을 물려받지만 정확한 메커니즘은 독자적인 것입니다.

### BLIP-2에 비교

| | BLIP-2 | Flamingo |
|---|---|---|
| Visual bridge | Q-Former once at input | Gated cross-attention at every M layers |
| Visual tokens | 32 per image | 64 per image per cross-attn layer |
| Frozen LLM | Yes | Yes |
| Few-shot in-context | Weak | Strong — the paper's centerpiece |
| Interleaved inputs | No native support | Yes, the design target |
| Training data | 130M pairs | 1.3B pairs + 43M interleaved pages |
| Parameter count | 188M trained | ~10B trained (cross-attn layers) |
| Compute | Days on 8 A100s | Weeks on thousands of TPUv4 |

예산에 맞는 단일 이미지 VQA를 위해 BLIP-2를 선택하세요. 간접화, 몇 장 또는 다중 이미지 추론을 위해 Flamingo/Idefics2를 선택하세요.

```figure
cross-attention-fusion
```

## 사용 하 고

`code/main.py`증명하는 것:

1. 36개의 가짜 패치 토큰에 있는 Perceiver 재 샘플링, 8개의 학습 가능한 잠자리 (순수한 파이썬 간접주의)
2.        `alpha = 0`→ 출력 = 출력 (LLM 변함없이)`alpha = 2.0`→ 시각적 기여가 혼합되어 있습니다.
3. 2D 주의 마스크를 생성하는 겹겹 마스크 제작자 "( 이미지 1) ( 텍스트 1) ( 이미지 2) ( 텍스트 2) " 순서로

## 선박

이 교훈은`outputs/skill-gated-bridge-diagnostic.md`. 오픈 VLM의 구성 (예제 Y/N, 크로스-ATN 주파수, 게이트 스키마) 를 고려하면 플라밍고 선배 요소를 식별하고 냉동 전략을 설명합니다. 왜 미세 조정이 텍스트 성능을 떨어뜨리는지를 디버깅하는 데 유용합니다 ( 답변: 게이트가 너무 넓어 너무 빨리되었습니다).

## 운동

1. 플라밍고-9B의 시각 매개 변수 수를 계산하십시오: 9B LLM + 1.4B 가이트 크로스-아트런스 레이어 + 64M 리스패블러. 전체 매개 변수 중 얼마나 많은 분자가 훈련되어 있습니까?

2.                                                                                `y = tanh(alpha) * cross + x`PyTorch에서 실험적으로 보여드리겠습니다`alpha=0``y==x`바로 초기입니다.

3. 각 명령어마다 다른 이미지 수치가 있을 때 여러 이미지를 어떻게 처리하는지에 대한 OpenFlamingo 섹션 3.2 (arXiv:2308.01390) 을 읽어보십시오.

4. 플라밍고의 간접 주의 마스크는 왜 텍스트 토큰이 이전 모든 이미지와는 달리 *최근* 이전 이미지에만 관심을 기울이는 것을 허용합니까? 플라밍고 논문의 2.4 섹션을 읽고 타협을 설명하십시오.

5. 맥락 내 몇 번의 촬영: 새로운 플라밍고 변종에 대해 "이메이크 → 메인 객체의 색상"의 4 가지 예제를 사용하여 프롬프트를 구성하십시오. 예제 수를 0에서 8까지 변화시키는 것으로 예상되는 정확성 패턴을 설명하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Perceiver resampler | "Fixed-latent cross-attention" | Module that produces K fixed tokens from a variable number of input patches |
| Gated cross-attention | "Tanh-gated bridge" | Residual layer `y = tanh(alpha)*cross + x`, learnable alpha, init 0 |
| Interleaved input | "Mixed sequence" | Prompt format with images and text mixed freely in reading order |
| Frozen LLM | "No LLM gradients" | The text LLM's weights do not update; only resampler + cross-attn layers train |
| Few-shot | "In-context examples" | Give a few (image, answer) pairs in the prompt; model generalizes without finetuning |
| OBELICS | "Interleaved web corpus" | Open dataset of 141M web pages with images and text in reading order |
| Chinchilla | "70B frozen base" | Flamingo's frozen text LLM, from DeepMind's Chinchilla paper |
| Gate schedule | "How alpha moves" | The rate at which the cross-attention gate opens during training |
| Cross-attn frequency | "Every M layers" | How often a gated cross-attention block is inserted; Flamingo uses $M=4$ |
| OpenFlamingo | "Open reproduction" | MosaicML/LAION open checkpoint at 3-9B; architecture-identical to Flamingo |

## 더 많은 읽기

- [Alayrac et al. — Flamingo (arXiv:2204.14198)](https://arxiv.org/abs/2204.14198) 원본 논문
- [Awadalla et al. — OpenFlamingo (arXiv:2308.01390)](https://arxiv.org/abs/2308.01390) 개방된 복식
- [Laurençon et al. — OBELICS (arXiv:2306.16527)](https://arxiv.org/abs/2306.16527)                                                                                                                                                                                                                                                              
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) 일반 인식자 아키텍처
- [Li et al. — Otter (arXiv:2305.03726)](https://arxiv.org/abs/2305.03726) 명령으로 조정된 플라밍고 후손
- [Laurençon et al. — Idefics2 (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246) 플라밍고 접근법의 현대적 단순화
