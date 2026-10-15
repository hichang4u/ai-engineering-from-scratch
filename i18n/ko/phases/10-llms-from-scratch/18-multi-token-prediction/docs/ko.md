# 멀티 토큰 예측 (MTP)

> GPT-2에서 Llama 3까지의 모든 autoregressive LLM는 포지션당 1 손실을 습니다. 다음 토큰을 예측하세요. DeepSeek-V3는 두 번째 손실을 추가했습니다. 그 다음 토큰을 예측합니다. 추가적인 14B 파라미터 (671B 모델) 는 gradient flow를 통해 메인 모델로 다시 소각되었고, 훈련된 MTP 헤드는 80%+ 수용률을 가진 추측적 디코딩 드래프트로 추론에 재용되었다. 1.8x 세대 출력은 무료였습니다. 이 수업은 DeepSeek 기술 보고서에서 순차적인 MTP 모듈을 구축하고 손실과 공유 헤드 매개 변수 레이아웃을 계산하고, MTP가 원시 연쇄를 유지하는 이유를 설명하고, Gloeckle et al.'의 원래 병렬 MTP가 그것을 깨는 동안.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 10 · 04 (pre-training a mini GPT), Phase 10 · 15 (speculative decoding)
**Time:** ~60 minutes

## 학습 목표

- MTP 훈련 목표를 명시하고 예측 깊이에서 공동 손실을 도출하십시오.
- 글로클 등의 병렬 MTP 헤드 (2024) 와 DeepSeek-V3의 순차적인 MTP 모듈의 차이와 순차적인 설계가 인과 연쇄를 보존하는 이유를 설명하십시오.
- 훈련 전 경기에 MTP 모듈을 추가하는 매개 변수와 메모리 오버헤드를 계산한다.
- 처음부터 하나의 MTP 모듈을 구현: 공유 임베디션, 깊이 변환기 블록, 투영 및 공유 출력 헤드.

## 문제

다음 토큰 예측은 표준 LLM 교육 목표입니다. 모든 숨겨진 상태는 정확히 한 가지 예측을 위해 감시됩니다. 바로 다음의 토큰입니다. 놀랍게도 약한 신호입니다. 일련의 대부분의 정보는 하나의 토큰  구조, 일관성, 사실성, 수학적 흐름 이상의 영역을 확장합니다. 모델은 1조의 토큰에 걸쳐 많은 1조의 신호를 축적함으로써 그 신호를 학습해야 합니다.

MTP는 질문합니다. 모든 숨겨진 상태가 동시에 여러 미래의 토큰을 예측하기 위해 감독된다면 어떨까요? 글로클 등 (메타, 2024) 이 도움이 된다는 것을 보여주었습니다. 그들의 구현은 척추 위에 여러 독립적인 출력 헤드를 배치하여 각자가 다른 오프셋을 예측합니다. 병렬, 간단하지만 헤드는 hierarchical refinement 없이 동일한 숨겨진 상태를 보았고 예측은 인과적으로 연쇄되지 않았기 때문에 추측 해독에 사용할 수 없었습니다.

딥시크-V3 (2024년 12월) 은 MTP를 각각의 예측 깊이에서 원천적 연쇄를 유지하는 순차적 모듈로 재설계했습니다. 모델은 예측합니다.`t+1``h_i^(0)`, 그리고 예측합니다`t+2`새로운 숨겨진 상태에서`h_i^(1)`합쳐진`h_i^(0)``E(t+1)`임베디션, 그리고는. 각 깊이는 자신의 작은 트랜스포머 블록입니다. 공유 임베디션 및 공유 출력 헤드 파라미터 오버헤드 온화 유지. DeepSeek-V3의 규모에서, 671B 주요 모델 무게 위에 MTP 모듈에서 14B 추가 파라미터. 그 2% 오버헤드 인수 더 밀집한 훈련 신호 및 결론에 대한 준비 된 추측 디코딩 초안

이 수업은 MTP 모듈을 하나 만들어 D 깊이 손실을 처음부터 합니다. 수학은 깔끔합니다. 구현은 150 라인입니다.

## 개념

### 순서 MTP 레시피

딥시크-V3가 추가합니다`D`메인 모델 위에 MTP 모듈이 있습니다. 각 모듈은`k`(`k = 1..D`) 로 로켓의 깊이를 예측합니다`k` 즉,`t_{i+k}`위치로 앞음표를 붙여 `i`- 그래

모듈`k`구성된:

- 트랜스포머 블록`T_k`자신의 관심과 MLP를 가지고 있습니다.
- 투사 매트릭스`M_k`그 이전 깊은 숨겨진 상태와 다음 깊은 기초 진실의 토큰의 삽입을 결합합니다.
- 공유된 임베디션`E`(주 모델과 동일합니다).
- 공유 출력 헤드 `Out`(주 모델과 동일합니다).

훈련 중에, 직위에서 직위까지`i`, 깊이 숨겨진 상태는:

```math
\begin{aligned}
h_i^{(0)} &= \text{main model backbone at position } i \\
h_i^{(k)} &= T_k\Big( M_k \cdot \mathop{\mathrm{concat}}\big(\mathop{\mathrm{RMSNorm}}(h_i^{(k-1)}), \mathop{\mathrm{RMSNorm}}(E(t_{i+k}))\big) \Big) \quad \text{for } k \ge 1
\end{aligned}
```

심도별 예측은 다음과 같습니다.

```math
\text{logits}_{i+k} = \mathop{\mathrm{Out}}(h_i^{(k-1)}) \quad \text{for } k = 1, \ldots, D
```

깊이 손실은 근본적인 진실과 교차적인 엔트로피입니다`t_{i+k}`이 부분의 본문은

```math
L_k = \mathop{\mathrm{CE}}(\text{logits}_{i+k}, t_{i+k})
```

깊이에서 관절 손실:

```math
L_{\text{MTP}} = \frac{\lambda}{D} \sum_{k=1}^{D} L_k
```

`lambda` DeepSeek-V3는 훈련의 첫 10% 동안 0.3을 사용하며 그 후 0.1을 사용한다.`L_main + L_MTP`- 그래

### 왜 순차적으로, 병렬이 아닌

글로클의 원래의 병렬 MTP는 D 출력 헤드를 가지고 있었고, 각각이 직접 적용되었습니다`h_i^(0)`각 머리도 예측합니다`t_{i+k}`이 기둥은 모두 같은 척추 숨겨진 상태에서 나옵니다.`head_1`' '의 출력으로 도와줍니다`head_2` 머리  병렬

딥시크-V3의 순차적인 설계는`h_i^(k)``h_i^(k-1)`그리고 실제 다음 토큰 임베디션`E(t_{i+k})`. 그 결과 인과관계를 유지합니다. 예측하기 위해서`t_{i+k+1}`, 심도 모듈`k+1`무슨 일이 있었는지 알 수 있습니다`t_{i+k}`. 이것은 구조적으로 자동 퇴행 디코더가 자신의 출력을 소비하는 것과 동일합니다.

추론: 먹이`h_i^(k-1)`그리고 그 책`t_{i+k}`모듈로`k+1`, 예측을 얻으세요`t_{i+k+1}`. 반복합니다. 그것은 정확히 EAGLE 스타일의 드래프트입니다. 훈련된 MTP 모듈을 드래프트 네트워크로 사용합니다. DeepSeek-V3는 첫 번째 MTP 모듈에서 80%+ 수용률을보고하고 1.8x 가속화입니다.

### 매개 변수 회계

숨겨진 모델`h`그리고 어휘`V`이 부분의 본문은

- 주요 모델: 수십억개의 매개 변수, 더하여 1개의 출력 크기의 헤드`V * h`- 그래
- 공유 출력 헤드: 메인 모델의 헤드를 재사용한다. 추가 패럼이 없습니다.
- 공유 임베디션: 메인 모델의 임베디션을 재사용합니다. 추가적인 패러마가 없습니다.
- 매-MTP 모듈:
  - 투영`M_k`이 책:`(2h) * h = 2h^2`- 그래
  - 트랜스포머 블록`T_k`: 주의 (`4h^2`MHA) 과 MLP (일반적으로`8h^2`8/3 비율의 SwiGLU에 대해`12h^2`블록당

모듈당 추가적인 총: `~14h^2`딥시크-V3를 위해`h = 7168`, D = 1 모듈: `~14 * 7168^2 = ~720M`DeepSeek-V3는 14B 를 보고합니다.

### 투기적인 해독 보상

사전 훈련 중에, MTP 모듈은 훈련 속도를 약 10% (더 ileri 계산, 추가 손실) 느리게 합니다.

1. 텐서 훈련 신호. 각 숨겨진 상태에서 D+1 감시 목표물을 볼 수 있습니다. MMLU, GSM8K, MATH, HumanEval에 측정된 효과: 딥시크-V3의 압축에 몇 퍼센트 포인트의 일관된 개선.

2. 추론 시 무료 가설적 디코딩 초안. MTP 모듈은 이미 다음 몇 개의 토큰을 예측하도록 훈련되어 있습니다. 초안 네트워크로 재기용되어 80%+의 수용률을 제공합니다. 그 수준에서 N=3 또는 N=5 스펙 디코딩은 1.8x 처리량을 제공합니다. 10%의 훈련 시간 비용은 추론을 실행하는 첫 번째 때 보상됩니다.

### 이글과의 관계

이글은 사전 훈련 후 작은 드래프트 모델을 별도로 훈련합니다. MTP는 사전 훈련에 드래프트를 굽습니다. 두 가지 접근법은 비슷한 수용률을 통해 서로 다른 파이프라인으로 합쳐집니다.

| Dimension | EAGLE-3 | MTP (DeepSeek-V3) |
|-----------|---------|------------------|
| When trained | Post-pre-training | During pre-training |
| Backward-compatible with existing weights | Yes | No (need to re-train) |
| Draft params | 1-2 transformer layers | 1 transformer block + projection |
| Acceptance rate | 0.88-0.92 | 0.80+ at depth 1 |
| Benefit beyond speedup | Speculative decoding only | Denser training signal + speedup |

```figure
multi-token-predict
```

## 건설 해

`code/main.py`MTP 모듈을 끝에서 끝으로 구축합니다. 공유 임베디션, 투영, 트랜스포머 블록, 공유 출력 헤드. 그것은 짧은 합성 순서에서 깊이 간 엔트로피 손실을 계산하고 구성 요소에 따라 매개 변수 수를 인쇄합니다. 32 토큰의 장난감 어휘는 숫자를 읽을 수있게합니다.

### 단계 1: 공유 임베디션 테이블

단독`vocab_size x hidden`테이블은 각 깊이에서 MTP 모듈에서 사용되고 있습니다. 두 번째 복사본은 말 그대로 같은 텐서입니다.

### 단계 2: 깊이별 조합

```python
def combine(prev_hidden, next_token_embed, M_k):
    # concat along feature dim, then project down to hidden
    concat = rms_norm(prev_hidden) + rms_norm(next_token_embed)  # vector addition stand-in
    projected = matvec(M_k, concat)
    return projected
```

실제 딥시크-V3는 RMSNormed 벡터 두 개를 잇고`[2h]`그리고 `h x 2h`매트릭스. 장난감은 STDlib 단축을 위해 벡터 덧셈을 사용합니다.

### 단계 3: k 깊이에서 트랜스포머 블록

자기주의 + MLP. 장난감에서, 일층 선형주의 블록과 SwiGLU MLP는 구조를 이 없이 볼 수 있도록 한다.

### 단계 4: 공유 출력 헤드

메인 모델의 출력 프로젝션을 재사용해

### 단계 5: 깊이 손실

 (softmax) 로그티의 크로스 엔트로피가 지위 진실 표본에 비해`k`. 과 함께 깊이에서 합쳐`lambda / D`확장 요소

### 단계 6: 매개 변수 회계

전체 매개 변수 수, 공유 (이부드, 헤드) 수, 그리고 모듈별 추가 수를 인쇄합니다. MTP 추가의 비율을 메인 모델 크기로 표시합니다.

## 사용 하 고

MTP는 딥시크-V3 (2024년 12월) 및 딥시크-R1 시리즈에 통합되어 있습니다. 결론은 다음과 같습니다:

- 딥시크의 서비스 스택은 MTP 모듈을 상자 밖으로 추측적인 디코더로 소비합니다.
- vLLM와 SGLang은 2026년 4월부터 딥시크-V3 MTP를 통합하는 경로를 갖추고 있습니다.
- AMD의 ROCm SGLang 튜토리얼은 V3 체크포인트에서 1.8x 가속화 측정된 특정 MTP 가설적 디코딩 구성을 보여줍니다.

새로운 사전 훈련에서 MTP를 사용할 때:

- 당신은 전차 훈련 전선을 통제하고 더 밀집한 훈련 신호를 뱅크하고 싶어합니다.
- 여러분은 모델의 규모를 다룰 것이고, 무료의 추측 해독을 원할 것입니다.
- 네 숨겨진 크기는 최소 4096입니다 1B 스케일에서 상공이 이익보다 더 아프습니다

언제 하지 않는지

- 기존의 사전 훈련된 밀도가 높은 모델을 정렬합니다. MTP 모듈은 훈련되지 않습니다.
- MTP는 구조를 바꾸고,

## 선박

이 교훈은`outputs/skill-mtp-planner.md`. 훈련 전 실행 사양 (모델 크기와 데이터, 계산) 을 고려하면 MTP를 통합하는 계획을 반환합니다: 깊이의 수 D,`lambda`시간표, 메모리 오버헤드, 그리고 추론 시간 가설적 디코딩 전선

## 운동

1. 달아`code/main.py`. 합성 신호가 강화됨에 따라 깊이 손실이 단조적으로 감소하는 것을 보여주십시오. 고정된 패턴을 사용하여 합성 신호를 수정하고 깊이-1 및 깊이-2 손실이 공감되는 것을 확인합니다.

2. D=1 MTP 모듈의 밀집 70B 모델 (8192, 80 층) 의 매개 변수 오버헤드를 계산하십시오. DeepSeek-V3의 보고된 14B 오버헤드와 비교하십시오. DeepSeek의 숫자가 왜 더 높는지 설명하십시오. MTP 트랜스포머 블록은 동일한 MoE 구조를 물려받으며, 매개 변수 수를 부풀이합니다.

3. 장난감에 D=2를 구현: 2번째 MTP 모듈을 추가하여 $h^{(1)}$그리고 예측합니다`t_{i+2}`합동 손실과 매개 변수 회계도 DeepSeek 논문의 19-21 방정식에 일치하도록 확인합니다.

4. 장난감을 병렬 MTP (글로클 스타일) 로 전환하십시오. 주요 숨겨진 상태 위에 D 출력 헤드를 추가하여 각이 다른 오프셋을 예측합니다. 깊이별 손실이 동일한 합성 신호의 순차 버전과 비교되는 방법을 측정합니다. 순차 버전은 k > 1에 대한 더 낮은 깊이-k 손실을 가져야합니다. 왜냐하면 중간 예측에 조건이 있기 때문입니다.

5. 훈련된 MTP 모듈을 EAGLE 스타일의 드래프트로 사용: 제안하기 위해 k 모듈을 호출합니다 `t_{i+k}`이 도표의 수용률을 유지된 순서에서 주요 모델의 예측에 따라 측정합니다. 장난감에 50%+를 치면 경험적 MTP-as-draft 속성을 복제했습니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MTP module | "Extra loss block" | A small transformer block plus projection that predicts a token `k` positions ahead of the main model |
| Prediction depth | "Which offset" | The integer `k` such that module `k` predicts `t_{i+k}` from prefix through position `i` |
| Parallel MTP | "Gloeckle-style" | D independent heads on the same backbone hidden state, no conditional chain |
| Sequential MTP | "DeepSeek-V3 style" | Each module conditions on the previous depth's hidden state plus the next token's embedding; preserves causal chain |
| Shared output head | "Reuse the main head" | The MTP modules call the main model's LM head, not a separate output projection |
| Shared embedding | "Reuse the main table" | Same vocabulary embedding table is used everywhere; no duplicate parameters |
| Projection matrix $M_k$ | "Combine hidden + next-token" | An `h x 2h` linear layer that folds the previous hidden state and the target-token embedding into the next depth's input |
| Joint loss $L_{\text{MTP}}$ | "Averaged extra losses" | Arithmetic mean of per-depth cross-entropy losses, scaled by `lambda` |
| Acceptance rate at depth 1 | "How often MTP draft is right" | The rate at which the D=1 MTP module's top-1 prediction equals the main model's top-1 prediction; 80%+ on DeepSeek-V3 |
| Lambda weighting | "Extra-loss importance" | Per-depth scaling factor; 0.3 at start of training, 0.1 later on DeepSeek-V3 |

## 더 많은 읽기

- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) 합동 손실 방정식과 추론 시 1.8x 가속화 를 포함하여 전체 순서적 MTP 설명 (부 2.2)
- [Gloeckle et al. — Better & Faster Large Language Models via Multi-token Prediction (arXiv:2404.19737)](https://arxiv.org/abs/2404.19737) 평행 MTP 기본 라인 DeepSeek의 설계가
- [DeepSeek-V3 model card on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V3) 총 685B (671B 주요 + 14B MTP), 배치 메모
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) 투기적 디코딩 프레임워크 MTP는
- [Li et al. — EAGLE-3 (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) EAGLE의 2025년 설계 구조,
