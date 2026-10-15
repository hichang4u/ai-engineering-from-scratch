# CLIP에서 BLIP-2까지

> CLIP는 이미지와 텍스트를 조율하지만 표본을 생성하거나 질문에 답하거나 대화를 할 수 없습니다. BLIP-2 (Salesforce, 2023) 는 작은 훈련 가능한 다리로 해결했습니다. 32개의 학습 가능한 질의 벡터는 얼어붙은 ViT의 특징을 가로막는 방식으로 관람하고, 얼어붙은 LLM의 입력 흐름에 직접 slot합니다. 188M의 다리 매개 변수는 11B LLM를 ViT-g/14로 연결했습니다. 2026년까지 모든 어댑터 기반 VLM는 MiniGPT-4, InstructBLIP, LLaVA의 사촌들 의 후손이다. 이 수업은 Q-Former의 아키텍처를 읽고, 두 단계의 훈련을 설명하고, 얼어붙은 텍스트 디코더에 시각적 토큰을 공급하는 장난감 버전을 만듭니다.

**Type:** Build
**Languages:** Python (stdlib, cross-attention + learnable-query demo)
**Prerequisites:** Phase 12 · 02 (CLIP), Phase 7 (Transformers)
**Time:** ~180 minutes

## 학습 목표

- 얼어붙은 비전 코더와 얼어붙은 LLM 사이의 훈련 가능한 병목이 비용과 안정성에서 끝에서 끝까지의 정돈을 이겨내는 이유를 설명하십시오.
- 학습 가능한 고정된 질의 집합이 외부 이미지 특징에 관심을 갖는 간접주의 블록을 구현합니다.
- BLIP-2의 두 단계의 사전 훈련 과정을 거쳐보세요: 표현 (ITC + ITM + ITG) 그리고 생성 ( منجمد 디코더로 LM 손실)
- Q-Former를 LLaVA에서 사용되는 간단한 MLP 프로젝터와 비교하고 각 선택이 승리할 때 논쟁하십시오.

## 문제

얼어붙은 ViT는 한 이미지에 256개의 패치 토큰을 생성하고 있습니다. 얼어붙은 7B LLM는 dim 4096의 토큰 임베디션을 기대합니다. 명백한 브릿지는 1408에서 4096까지 선형 레이어를 작동하지만, LLM의 맥락에 모든 256개의 패치 토큰을 공급하는 것은 256개의 추가 토큰을 이미지당 비용합니다. 32개의 이미지의 패치에 대해 8192개의 토큰이 시각적 모달리티만으로 소비됩니다.

BLIP-2 의 질문은: 256 토큰 이미지 표현을 훨씬 적은 토큰으로 압축할 수 있습니까? (예컨대 32) LLM가 캡션, 질문에 답하고 이미지에 대해 논할 수있는 충분한 정보를 보존하면서? 그리고 얼어붙은 척추에 닿지 않고 이 다리를 훈련시킬 수 있습니까?

답: Q-Former. 32개의 학습 가능한 "쿼리" 벡터가 ViT의 패치 토큰에 교차하여 LLM가 소비하는 32개의 토큰 시각적 요약을 생성합니다. 총 188M 매개 변수입니다. LLM에 닿기 전에 반대의견, 일치 및 생성적인 목표를 훈련합니다.

## 개념

### 배울 수 있는 질문

Q-Former의 핵심 트릭: LLM의 텍스트 토큰이 이미지 패치를 처리하는 대신 32개의 학습 가능한 쿼리 벡터의 새로운 세트를 도입하십시오.`Q`그리고 *그들*이 이미지 패치를 처리하도록 한다. 쿼리는 모델의 매개 변수입니다.  훈련 중에 배운 것이므로, 각각의 이미지에 동일한 32개의 쿼리가 사용됩니다.

간접주의 후, 각 질의는 이미지의 압축적 요약을 포함합니다 "주적 객체를 설명하십시오", " 배경을 설명하십시오", " 객체를 셀 수 있습니다" 등. 질의는 문자 그대로 의미적 레이블에 전문적이지 않습니다. 그들은 하류 손실을 떨어뜨리는 어떤 코딩이든 배우습니다.

### 건축

Q-Former는 두 개의 경로를 가진 작은 트랜스포머 (12층, ~ 100M 파램) 이다:

1. 질의 경로: 32개의 질의 벡터는 자기주의를 통해 흐른다 (자기들 사이에), 그 다음 frozen ViT의 패치 토큰을 통해 가로질러 관심을, 그리고 FFN.
2. 텍스트 경로: BERT와 유사한 텍스트 코더는 질의 경로와 자기주의와 FFN 무게를 공유합니다. 텍스트 경로에는 크로스주의가 비활성화됩니다.

훈련 시간 동안 두 길이 모두 실행됩니다. 질의와 텍스트는 공유된 자기주의를 통해 상호 작용하므로 질의가 필요한 작업 (ITM, ITG) 에 대한 텍스트에 조건이 될 수 있습니다. VLM 전달을 위한 추론 시간에는 질의가 지나고 32 개의 시각 토큰을 생성합니다.

### 두 단계 교육

BLIP-2 사전 훈련은 두 단계로 이루어집니다.

1단계: 대표적인 학습 (LLM가 없다)
- ITC ( 이미지- 텍스트 대조): Clip 방식의 대조, pooled query token과 텍스트 CLS token 사이에.
- ITM ( 이미지- 텍스트 일치): 이화 분류기  이 이미지- 텍스트 쌍이 일치합니까? 하드-네게티브-마인
- ITG (이미지 기반 텍스트 생성): 텍스트에 대한 인과적 LM 헤드, 질의에 따라 조건. 질의가 텍스트 생성 가능한 콘텐츠를 암호화하도록 강요합니다.

Q-Former 열차만, ViT가 얼어붙은 상태, LLM가 포함되지 않습니다.

단계 2: 생성 학습. 얼어붙은 LLM (OPT-2.7B 또는 Flan-T5-XL, 등) 를 첨부하십시오. 작은 선형 층을 통해 LLM의 임베디션 덤으로 32 개의 쿼리 출력을 프로젝션하십시오. 텍스트 프롬프트에 준비하십시오. 연결된 프롬프트 + 이미지 + 캡션 순서 위에 선형 프로젝션과 Q-포머만을 LM 손실에 훈련하십시오.

2단계 후, Q-Former + 투사 (Q-Former +) 는 전체 시각 어댑터입니다. 추론: 이미지 → ViT → Q-Former → 선형 프로젝트 → 텍스트에 전접 → 얼어붙은 LLM가 출력을 발산합니다.

### 파라미터 경제학

BLIP-2 와 ViT-g/14 (1.1B, 얼음) + OPT-6.7B (6.7B, 얼음) + Q-Former (188M, 훈련) = 8B 총, 188M 훈련. Q-Former 만은 전체 스택의 매개 변수의 ~ 2.4%입니다. 훈련 비용은 다음과 같습니다: 몇 개의 A100s에 며칠 대 한 몇 주.

품질: BLIP-2는 플라밍고-80B와 일치하거나 제로 샷 VQA에서 50배 작지만, 잘 작동합니다.

### 스트럭트BLIP과 스트럭션식 Q-포머

인스트럭트BLIP (2023) 는 Q-포머를 추가 입력으로 확장합니다. 명령 텍스트 자체. 간접주의 시간, 쿼리는 이제 이미지 패치와 명령에 액세스 할 수 있습니다. 쿼리는 단일 고정 요약을 배우는 대신 명령에 따라 전문화 할 수 있습니다. 벤치마크는 수행 된 작업에 증가합니다.

### 미니GPT-4 및 프로젝터만 접근

MiniGPT-4는 Q-Former를 유지했지만 다른 모든 것을 얼어붙이는 동안 출력 선형 투명을 훈련 시켰습니다. 저렴하지만 비용은 품질입니다.

### 왜 LLaVA가 더 간단해졌는지

LLaVA (2023, Lesson 12.05) 는 Q-Former를 단순 2층 MLP로 대체하여 LLM 공간에 모든 ViT 패치 토큰을 투영합니다. 24x24 그리드에서 한 이미지에 576 토큰, 모두 LLM에 공급됩니다. 더 나쁜 압축이 있지만 LLM가 원료 패치를 더 많이 볼 수 있습니다. 당시 이것은 논란이 많았으며, 2023년 말에는 시각적 명령 데이터 (LLaVA-Instruct-150k) 가 신호를 충분히 보존할 수 있도록 MLP를 훈련시킬 수 있다는 것을 증명했기 때문에 지배적이었다. 타협: LLaVA의 맥락은 더 빨리 채워집니다. 하지만 자연스레 다중 이미지 및 비디오로 확장됩니다.

2026년까지 필드 분할: Q-Former는 토큰 예산이 중요한 곳에서 살아남습니다 (장기 비디오, 많은 이미지); MLP 프로젝터는 토큰 당 원료 품질이 우선순위가있는 곳에서 지배합니다.

### 간접적인 관심: 플라밍고, 조상

플라밍고 (강좌 12.04) 는 BLIP-2 이전부터 동일한 크로스-아트런션 아이디어를 사용했지만, 모든 얼어붙은 LLM 계층에서 하나의 다리로서가 아닙니다. BLIP-2는 입력 계층으로만 압축할 수 있으며 여전히 작동 할 수 있음을 보여주었습니다. 쌍둥이와 Idefics은 둘 다 결합합니다.

### 2026년 후손

- Q-Former: BLIP-2, InstructBLIP, MiniGPT-4, 그리고 대부분의 비디오 언어 모델은 토큰 예산 이유로.
- 감지자 재 샘플링: 플라밍고의 변종 (학습 12.04); 이데피카스 가족, 이글, 오미마에.
- MLP 프로젝터: LLaVA, LLaVA-Next, LLaVA-OneVision, 캠브리안-1.
- 주의 분당: 비라, 파리게마

네 가지 모두 유효합니다. 결정적인 질문은 토큰 예산이나 품질에 제한이 있는지입니다.

```figure
modality-projection
```

## 사용 하 고

`code/main.py`stdlib Q-Former 스타일의 간접주의를 구축합니다.

1. 256개의 이미지 패치 토큰 (DIM 128) 을 시뮬레이션합니다.
2. 32개의 학습 가능한 질문들을 즉시 작성 (Dim 128)
3. 점-점-제품 간 간접주의를 실행하십시오 (쿼리에서 Q, 패치에서 K/V).
4. 선형층을 통해 LLM-dim (512) 로 프로젝트
5. 32개의 LLM 준비된 시각 토큰을 내보내세요.

모든 수학은 순수한 파이썬 (벡터 위에 둥지를 틀어 놓은 루프) 이다. 장난감이지만 정확한 모양. 주의 무게 매트릭스는 인쇄되어 있어 각 질의가 어느 패치에서 뽑혀 있는지 볼 수 있습니다.

## 선박

이 교훈은`outputs/skill-modality-bridge-picker.md`. 목표 VLM 구성 (비전 코더 토큰 수, LLM 컨텍스트 예산, 배포 제한, 품질 목표) 을 고려하면 Q-Former vs MLP vs Perceiver 재 샘플링을 각 다리별로 짧은 정당화 및 매개 변수 수 추정으로 권장합니다.

## 운동

1. PyTorch에서 가로 주의 블록을 구현하십시오. 32 개의 질의와 256 개의 키/값으로 주의 무게 행렬이 32 x 256이고 각 줄이 softmax 이후 1으로 합당하는지 확인합니다.

2. BLIP-2 단계 1에서는 Q-Former는 ITC, ITM, ITG로 3개의 손실을 동시에 실행한다. 각자의 앞 서명을 사이드코드로 작성한다. 텍스트 코더 경로가 활성화되어야 하는 것은 어느 쪽이다?

3. 파라미터 수를 비교: Q-Former (12층, 768 개의 숨겨진) 와 2층 MLP 프로젝터 (1408 → 4096, 두층)

4. Q-Former이 어떻게 초기화되는지에 대한 BLIP-2 논문의 3.2 섹션 (arXiv:2301.12597) 을 읽어보십시오. BERT 기반에서 초기화하는 것이 (자발적인 것이 아니라) 왜 회화를 가속화하는지를 설명하십시오.

5. 60 프레임으로 샘플링된 1 FPS의 10 분기의 비디오에 대해 프레임 당 토큰 비용을 계산하면 (Q-Former → 32 토큰/ 프레임) vs (MLP 프로젝터 → 576 토큰/ 프레임) 입니다. 128k 토큰 LLM 컨텍스트 윈도우에 어느 것이 적합합니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Q-Former | "Querying transformer" | Small transformer with 32 learnable query vectors that cross-attend to frozen ViT features |
| Learnable queries | "Soft prompt for vision" | A fixed set of parameters that serve as the query side of cross-attention; learned per model, shared across all inputs |
| Cross-attention | "Q from here, K/V from there" | Attention where query, key, and value come from different sources; how the queries pull from ViT patches |
| ITC | "Image-text contrastive" | CLIP-style loss applied to Q-Former pooled queries vs text CLS |
| ITM | "Image-text matching" | Binary classifier on hard-negative-mined pairs; forces the queries to discriminate fine-grained mismatches |
| ITG | "Image-grounded text generation" | Causal LM loss where text is generated conditioned on queries; forces queries to encode text-decodable content |
| Two-stage pretraining | "Representation then generative" | Stage 1 trains Q-Former alone (ITC/ITM/ITG); Stage 2 attaches frozen LLM and trains only the projection + Q-Former |
| Frozen backbone | "Do not finetune" | The vision encoder and LLM weights are fixed; only the bridge trains |
| Projection head | "Linear to LLM dim" | Final linear layer mapping Q-Former output to the LLM's embedding dimension |
| Perceiver resampler | "Flamingo's version" | Similar learnable-query cross-attention, used by Flamingo at every layer rather than as a single bridge |

## 더 많은 읽기

- [Li et al. — BLIP-2 (arXiv:2301.12597)](https://arxiv.org/abs/2301.12597) 핵심 종이를
- [Li et al. — BLIP (arXiv:2201.12086)](https://arxiv.org/abs/2201.12086) ITC/ITM/ITG 트리오의 전신
- [Li et al. — ALBEF (arXiv:2107.07651)](https://arxiv.org/abs/2107.07651) "Fuse 전에 정렬"  단계 1 훈련의 개념적 조상.
- [Dai et al. — InstructBLIP (arXiv:2305.06500)](https://arxiv.org/abs/2305.06500) 명령에 잘 맞는 Q-Former
- [Zhu et al. — MiniGPT-4 (arXiv:2304.10592)](https://arxiv.org/abs/2304.10592) 프로젝터만 이용하는 접근법
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) 학습가능한 질문 간 간접 관심의 일반적인 건축물
