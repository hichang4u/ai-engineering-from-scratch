# 추측적 디코딩과 EAGLE-3

> 7단계 · 레슨 16은 수학을 증명했습니다. 레비아탄 거부 규칙은 검증자의 분포를 정확하게 보존합니다. 이 교훈은 2026년 생산에 대한 추측적 디코딩의 훈련-배치 관점입니다. EAGLE-3는 드래프트 모델을 저렴한 추대에서 검증자의 자신의 숨겨진 상태에 훈련된 목적으로 만들어진 작은 네트워크로 바꾸었고, 그 다음 트레이닝 시간 테스트 루프를 추가하여 열차와 추론 분포를 조정했습니다. 결과: 3x에서 6.5x까지의 엔드-투-엔드 스피드업, 채팅에서 0.9 이상의 토큰 수율을 받아 들였습니다. 2026년 생산 추론 스택은 기본적으로 배포됩니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 16 (speculative decoding math), Phase 10 · 12 (inference optimization)
**Time:** ~75 minutes

## 학습 목표

- 레비아탄 정리를 한 문장으로 표현하고 추측 루프는 검증자에게 동일하게 분산된 샘플을 생성한다는 것을 증명하십시오.
- 바닐라 스펙 디코딩 (Leviathan 2023) 에서 EAGLE, EAGLE-2, EAGLE-3까지 2년 진행 과정을 거쳐 각 단계별로 정확한 제한을 지정하십시오.
- 수용률에서 예상되는 가속도를 계산합니다 `α`그리고 설계와 검사 비용 비율`c`, 그리고 최적의 드래프트 길이를 선택합니다 `N`각 정권에 대해
- 처음부터 전체 추측 루프를 구현: 잔액에서 드래프트, 확인, 거부- 샘플, 거부에 KV 캐시를 다시 롤, 완전한 수용에 보너스 토큰을 발급.

## 문제

70B 모델의 오토레그레시브 디코딩은 H100에서 초당 35 토큰으로 실행된다. GPU는 거의 포화되지 않는다. 메모리 대역폭은 천장이다. 모든 토큰은 HBM에서 무게 70B를 로드하고, 한 단계의 수학적 작업을 수행하고, 한 번 떠다니는 것을 생성한다. 계산 단위는 대부분 비동하다.

하지만, 이 문제는 실제로 해결할 수 있는 문제로 변합니다.`N`토큰`N`작은 앞면 패스. 검증기는 전두엽에 한 번 더하기`N`초안: 검증자의 위치 분포가`i`미세먼지 분포에서 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 수정된 내용`N+1`1개 대신 토큰을 받아 들였습니다.

중요한 이론은 레비아탄, 칼만, 마티아스 (ICML 2023) 이다: 출력 분포는 검증기에서 직접 샘플링을 생산한 것과 동일합니다. 대략적으로 아닙니다. 동일합니다. 이것은 모든 이유에서다 가설적 디코딩은 생산에서 받아 들여집니다. 그것은 품질 타협 없이 순수한 지연 최적화입니다.

7단계 · 16강습에서 얻은 것은 수학이다. 이 수업에서 얻은 것은 훈련 스택이다. 좋은 드래프트는 저렴한 드래프트보다 2배 더 빠른 스피드업 가치가 있다. EAGLE, EAGLE-2, EAGLE-3 (Li et al., 20242025) 은 "드래프트 = 동일한 모델의 작은 버전"을 정확한 엔지니어링 학문으로 바꾸었다. 2026 생산 추론 서버는 EAGLE-3에 기본으로 변경되었습니다.

## 개념

### 변함없는 물질: 레비아탄 거부 샘플링

-    `p(t)`다음 표기에는 어떤 표기판을 붙여서,`q(t)`검증자의 표본이 되죠`d ~ p`확률로 받아들여`min(1, q(d) / p(d))`. 거절 시 잔류 분포에서 샘플을`(q - p)_+ / ||(q - p)_+||_1`. 결과 샘플은`q`- 얼마나 나쁜지 상관없이`p`더 나쁜 것은 더 자주 거부하는 것입니다. 하지만 결과는 정확합니다.

`N`이 호출의 한 확인자를 사용하여 다시 다시 호출`prefix + d_1 + ... + d_N`검증자가 반환합니다`q_1, q_2, ..., q_{N+1}`동시에 왼쪽에서 오른쪽으로 걸어`j`, 샘플`residual(q_j, p_j)`완전 받아 들인 후, 1개의 보너스 토큰을 샘플링하세요`q_{N+1}`- 그래

### 가속화 를 결정 하는 것

-    `α`초안된 토큰에 대한 예상되는 수용률이 됩니다.`c = cost(draft) / cost(verifier)`비용 비율이 됩니다. 전격 검증자에 따라 승인된 토큰의 예상 수는:

```math
\mathbb{E}[\text{accepted}] = \frac{1 - \alpha^{N+1}}{1 - \alpha}
```

승인된 토큰에 대한 예상되는 전체 벽 시간`(N * c + 1) / E[accepted]`- `N`그리고 당신은 달콤한 점을 얻을 수 있습니다.`α = 0.8, c = 0.05`: 최적의 `N`57 정도가 되고, 가속도 3.2x 정도가 됩니다.`α = 0.95, c = 0.02`: 최적의 `N`8x10 정도가 되는데, 가속도 5x까지 밀려나갑니다.

가장 큰 레버는`α`- `α = 0.6`(반닐라 드래프트)`α = 0.9`(EGLE-3) 고정된`N = 5`2.2, 같은 검증기에서 2x 더 많은 처리량을 얻을 수 있습니다.

### 2년 동안 진행된

**Vanilla speculative (Leviathan, 2023).**드래프트 모델은 독립적으로 훈련된 작은 LLM입니다. 같은 가족에서.`α ≈ 0.6`최고로 2배 가속화

**EAGLE-1 (Li et al., 2024).**드래프트는 작은 트랜스포머입니다. 일반적으로 1~2층으로  검증자의 마지막 층 숨겨진 상태를 입력으로 받아 다음 토큰을 직접 예측합니다. 드래프트는 검증자의 특징 표현을 볼 수 있기 때문에 그 분포는 검증자에 훨씬 가깝습니다. `α`0.70.8로 올라갑니다.

**EAGLE-2 (Li et al., 2024).**동적 드래프트 트리를 추가합니다: `N`토큰, 후보자의 작은 나무를 제안하고, 한 번 앞으로 통과 (나무 주의) 에 검증자와 함께 각 점수를 얻으며, 가장 높은 확률 경로를 걷습니다.`α`허용된 경로 로켓의 경우 0.85 이상의 상승률을 나타냅니다.

**EAGLE-3 (Li et al., 2025, NeurIPS).**두 가지 더 변경 먼저, 기능 예측 손실을 완전히 제거합니다.  EAGLE-1/2는 검증자의 숨겨진 상태를 일치하도록 설계를 훈련시켰습니다. 이는 얼마나 많은 데이터가 도움이되는지 제한합니다. 이글-3는 토큰 예측을 통해 직접 훈련합니다. 둘째, 훈련 시간 테스트 (TTT): 초안 훈련 중에, 초안의 자신의 이전 예측을 여러 단계에 대한 입력으로 배제하는 것과 같은 방식으로 추론에 작동합니다. 이것은 열차와 시험 분포를 조율하고 오류 축적을 막습니다. 측정된 속도: 채팅에서 최대 6.5x, H100에서 SGLang에서 64 배트에서 38%의 처리량 향상.

### KV 캐시 역전환

검증은 검증자의 KV 캐시를 `N`1번의 출입을 하면,`j`, 캐시 컨텐츠 이전 위치`j-1`현재 두 가지 일반적인 구현은: 스크래치 버퍼에 작성하고 수용 (vLLM, TensorRT-LLM) 에 약속하거나 물리적 KV 캐시를 추가하여 논리적 길이와 거부에 줄여서 보관합니다. 어느 쪽이든, 롤백 비용은 각 층에 대한 바이트입니다.

EAGLE-2 나무 검색을 위해 검증기는 나무 토폴로지를 존중하는 비사유 마스크로 주의를 실행합니다. 엔지니어링은 무겁지만 계산은 사용자 지정 마스크로 표준 플래시 주의 호출입니다.

### 2026년 건축안

| Strategy | Draft type | `α` | Speedup | Training cost |
|----------|-----------|-----|---------|---------------|
| Vanilla | Separate small LLM | 0.55-0.70 | 1.8-2.3× | None (reuse existing small model) |
| Medusa | Extra LM heads on verifier | 0.65-0.75 | 2-3× | ~1B SFT tokens |
| EAGLE-1 | 1-layer transformer on hidden states | 0.70-0.80 | 2.5-3× | ~60B tokens |
| EAGLE-2 | EAGLE-1 + dynamic draft tree | 0.80-0.88 | 3-4× | ~60B tokens |
| EAGLE-3 | Multi-layer feature fusion + TTT | 0.88-0.92 | 3.5-6.5× | ~60-200B tokens |
| Lookahead | No draft (Jacobi iteration) | N/A | 1.3-1.6× | None |

2026년 생산: vLLM 및 SGLang는 사용 가능한 경우 EAGLE-3로 기본 설정되어 있고, 그렇지 않으면 EAGLE-2로 설정되어 있습니다. TensorRT-LLM는 메타 및 NVIDIA 퍼블릭 모델에 가장 빠른 메두사 경로를 가지고 있습니다. llama.cpp는 CPU 배포를 위해 바닐라 드래프트를 배포합니다.

```figure
l5-spec-decode-eagle
```

## 건설 해

보시다시피`code/main.py`. 이것은 모든 조각을 가진 Leviathan의 완전한 추측 루프입니다: N의 드래프트, 검증자 평행 패스, 위치별 거부, 잔여 샘플링, 보너스 토큰, KV 롤백, 그리고 출력 분포가 직접 샘플링과 일치하는지 경험적 검증`q`- 그래

### 단계 1: 거부 규칙

```python
def accept(q_prob, p_prob, u):
    if p_prob <= 0:
        return True
    return u < min(1.0, q_prob / p_prob)
```

### 단계 2: 잔재 분포

```python
def residual(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    if s == 0:
        return list(q)
    return [r / s for r in raw]
```

### 3단계: 완전한 추측 단계

`spec_step`함수 초안`N``p`, 그리고 모든 것을 하나의 병렬에서 확인합니다`q`평가: 각 작성된 토큰에 대해 거부 규칙을 적용하고, 첫 번째 거부에서 잔존에서 수정 샘플을 취합니다. 모든 것이 받아들인다면, 그것은 `q_{N+1}`- 그래

### 단계 4: KV 롤백 회계

시뮬레이터는 논리적인 것을 추적합니다`kv_length`일인당.`k`초안`kv_length += k`. 지위에 대한 거부에 대해`j`, 캐시가 이미 기록되어 있습니다`j`, 하지만 논리적 길이는 `prefix_length + j + 1` 수정 표본을 지나서 다음으로 논리적인 길이로 줄여서 읽는다.

### 5단계: 레비아탄 체크

50,000개의 추측 단계를 실행하고, 받아들여진 토큰의 경험적 분포를 계산하고,`q`치 제곱의 통계학은 비평값보다 훨씬 낮아야 합니다. 이 정리는 실제에서 통과합니다.

### 단계 6: 가속화 대 α

     `p`멀리서`q`각기 다른 진폭에서 측정합니다`α`, 다음으로 확인자 호출에 따라 예상된 토큰을  함수로 표시합니다.`α`그리고`N`. 코드는 EAGLE-3급 드래프트 품질을 나타내는 표를 인쇄합니다 (`α ≈ 0.9`) 는 확인자 호출당 45개의 토큰을 열고 있습니다.

## 사용 하 고

생산 수준 `vllm serve`이글-3:

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --speculative-config '{
    "model": "yuhuili/EAGLE3-LLaMA3.3-Instruct-70B",
    "num_speculative_tokens": 5,
    "method": "eagle3"
  }'
```

H100에서 64 배트에서 EAGLE-3를 사용하는 SGLang: EAGLE-3 논문에 따르면 배트-64 바닐라 디코딩보다 대략 1.38x 더 많은 처리량.

추측적인 디코딩을 언제 찾아야지:

- P50 지연이 최고 처리량보다 더 중요한 대화 대화 작업량이 있습니다.
- 코드 생성 및 구조화된 출력 (JSON, SQL). `α`0.9보다 높습니다. 왜냐하면 목표 분포가 매우 예측 가능하기 때문입니다.
- 긴 형태의 생성 (천여 개의 토큰)

언제 하지 않는지

- 아주 작은 모델 (< 3B) 이. 초안은 검증기보다 훨씬 저렴하지 않습니다.
- 작은 패치-1 CPU 배포. 드래프트 모델의 메모리 오버헤드는 가치가 없을 수도 있습니다.
- 매우 높은 온도에서 창조적인 샘플링`α`붕괴합니다.

## 선박

이 교훈은`outputs/skill-eagle3-tuner.md`. 추론 작업량 (모델, 배치 크기, 목표 지연시간, 작업 프로필) 을 고려하면, 추측적 디코딩 전략과 조정 매개 변수 (프로젝트 가족, `N`, 나무 깊이, 온도 인식 전환).

## 운동

1. 달아`code/main.py`레비아탄 분포 검진에 대한 치-스퀘어 통계는 50,000개의 샘플에서 95% 이하의 중요한 값에 머물렀다는 것을 확인합니다.

2.  扫`N`1~10까지`α`0.9로 유지되고`c`확인자 호출에 따라 예상 토큰과 토큰에 대한 실제 벽 시간`N`벽 시간을 최소화해 주면 곡선의 모양을 설명해 주세요.

3. 코드를 수정하여 EAGLE-2 나무 검색을 시뮬레이션합니다. 각 단계에 초안은 모양의 나무를 제안합니다 `[2, 2, 2]`(8개의 후보 경로) 검증자는 한 번 실행되며, 가장 높은 확률로 받아들여진 경로는 승리합니다. 계산 `α`확인자 호출에 대한 모든 도큰과 한 잎에 대한 모든 도큰.

4. 2개의 동시 순서로 배팅된 KV 롤백 시뮬레이터를 구현하십시오. 순서 A는 모든 드래프트가 받아들여지고 순서 B는 2번 위치에서 거부합니다.`kv_length`순서대로 업데이트되고 어떤 작업도 낭비되지 않는다는 것을 의미합니다.

5. EAGLE-3 논문 4부 (훈련 시간 테스트) 를 읽어 보십시오. TTT 없이 순진한 초안 교육이 노출 편향에 걸린 이유, 그리고 훈련 중에 자신의 예측을 제공함으로써 왜 그것을 수정하는지 두 문장으로 설명하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Leviathan rule | "min(1, q over p)" | Bernoulli accept/reject with probability `min(1, q(d)/p(d))`, preserves the verifier distribution exactly when you sample from the residual on rejection |
| Residual distribution | "(q minus p) plus, normalized" | `(q - p)_+` clamped at zero and renormalized — the correct distribution to sample from on rejection |
| Acceptance rate α | "how often the draft is right" | Expected per-token Bernoulli-success probability under the rejection rule; governs all speedup math |
| EAGLE-1 | "hidden-state draft" | Tiny transformer draft conditioned on the verifier's last-layer hidden state (Li et al., 2024) |
| EAGLE-2 | "dynamic draft tree" | EAGLE-1 plus a tree of candidate continuations scored with tree attention in one verifier pass |
| EAGLE-3 | "training-time test" | Drops the feature-prediction loss, trains on direct token prediction with the draft fed its own outputs during training |
| Training-time test (TTT) | "exposure bias fix" | Run the draft autoregressively during training so train and test input distributions match — the direct analog of scheduled sampling |
| KV rollback | "undo rejected drafts" | Bookkeeping that resets the verifier's KV cache to the accepted-prefix length after a rejection |
| Bonus token | "the free one" | When all `N` drafts accept, sample one extra from `q_{N+1}` at no additional verifier cost |
| Tree attention | "verify many candidates at once" | Attention with a non-causal mask that respects the topology of a draft tree; computes `q_i` for every node in the tree in one forward pass |

## 더 많은 읽기

- [Leviathan, Kalman, Matias — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192, ICML 2023)](https://arxiv.org/abs/2211.17192) 기초 논문과 동등성 정리
- [Chen et al. — Accelerating Large Language Model Decoding with Speculative Sampling (arXiv:2302.01318)](https://arxiv.org/abs/2302.01318)  맑은 증거와 함께 독립적인 도입
- [Li et al. — EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) EAGLE-1, 숨겨진 국가 조건의 드래프트
- [Li et al. — EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) 동적 나무 검색
- [Li et al. — EAGLE-3: Scaling up Inference Acceleration via Training-Time Test (arXiv:2503.01840, NeurIPS 2025)](https://arxiv.org/abs/2503.01840) 2026년 생산 결제
- [Cai et al. — Medusa: Multiple Decoding Heads (arXiv:2401.10774)](https://arxiv.org/abs/2401.10774) 대안적 드래프트 무료 접근법
- [vLLM Speculative Decoding documentation](https://docs.vllm.ai/en/latest/features/spec_decode.html) 모든 전략이 연결된 가공의 가공적 참조
