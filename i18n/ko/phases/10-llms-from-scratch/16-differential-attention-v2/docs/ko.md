# 차별적 관심 (V2)

> 소프트맥스 주의는 일치하지 않는 모든 토큰에 작은 확률을 퍼뜨립니다. 100만 건 이상의 토큰이 소음으로 신호를 익사합니다. 디퍼셔널 트랜스포머 (Ye et al., ICLR 2025) 는 공유 노이즈 바닥을 빼어 두 소프트맥스의 차이로 주의를 계산함으로써 그것을 수정합니다. DIFF V2 (마이크로소프트, 2026년 1월) 는 생산 스택 재편성: 기본 트랜스포머와 디코드 지연이 일치하는, 사용자 지정 커널이 없으며, 플래시 애트런션 호환성이다. 이 수업은 V1에서 V2까지 끝에서 끝으로, Stdlib Python에서 실행할 수 있는 차이 동작의 작업 장난감 구현을 통해 진행됩니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 02 (self-attention), Phase 7 · 15 (attention variants), Phase 10 · 14 (architecture walkthrough)
**Time:** ~60 minutes

## 학습 목표

- 왜 softmax 주의가 소음 바닥을 가지고 있는지 그리고 왜 맥락 길이를 따라 성장하는지 정확하게 설명하십시오.
- 차분주의 주의 공식을 추출하고, 왜 추출이 신호를 보존하면서 공유 잡음 구성 요소를 취소하는지 설명하십시오.
- V1에서 V2의 차이를 보아라: 무엇이 더 빨라지고 무엇이 더 단순해지고 무엇이 더 안정되고 무엇이 더 안정되고 무엇이 생산 전 훈련에 필요한지
- 순수한 파이썬에서 초점부터 차별화된 주의를 구현하고 합성 신호 + 소음 질의에서 노이즈- 취소 속성을 경험적으로 확인합니다.

## 문제

표준 소프트맥스 주의는 수학적인 특성을 가지고 있습니다.`q`, 주의력중도는`softmax(qK^T / sqrt(d))`. 소프트맥스는 절대 정확한 제로를 생성할 수 없습니다. 모든 비 일치하는 토큰은 어떤 긍정적 질량을 얻습니다. 그 잔여 질량은 소음이며, 맥락 길이를 따라 확장됩니다. 128k 토큰에서는, 각각의 비 일치하는 토큰이 확률의 0.001%를 얻더라도, 127,999개의 토큰이 합쳐 전체의 12%를 차지합니다. 모델은 맥락과 함께 성장하는 소음 바닥을 돌아가는 방법을 배워야합니다.

경험적으로 이것은 주의력 헤드 간섭으로 나타납니다. 긴 맥락 RAG에서 환각된 인용, 100k 토큰 검색 작업에서 중간에서 손실되는 실패, 그리고 32k 이상의 나늘-이-haystack 기준에서 미묘한 정확성 저하. 이차 변환기 논문 (arXiv:2410.05258, ICLR 2025) 은 격차를 측정했다: DIFF 변환기는 더 낮은 혼란, 더 높은 긴 맥락 정확성, 같은 크기의 기본선보다 더 적은 환각을 나타냈다.

DIFF V1는 3가지 문제로 국경을 접하는 전력 훈련 파이프라인을 벗어나게 되었습니다. 그 값 캐시는 디코드 단계마다 두 번 로드되어야 했고, 플래시 애트런션 호환성을 깨는 사용자 지정 CUDA 커널이 필요했고, 그 తల당 RMSNorm은 70B- 이상의 스케일에서 장기 훈련을 불안정하게 만들었습니다. DIFF V2 (Microsoft unilm 블로그, 20 월 2026) 는 세 가지 모두 수정했습니다. 이 수업은 두 버전을 모두 실행하고, 차이 연산자를 구축하고, 장난감 질의에서 노이즈 취소 기준을 제공합니다.

## 개념

### 소프트맥스의 노이즈 바닥

질문으로`q`그리고 열쇠`K = [k_1, ..., k_N]`, 주의력 무게는:

```math
w_i = \frac{\exp(q \cdot k_i / \sqrt{d})}{\sum_j \exp(q \cdot k_j / \sqrt{d})}
```

아니`w_i`0은 절대 없습니다.`k_i`전혀 관련이 없습니다`q`, 점수를`q . k_i`0이 아니죠. 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데, 0이 아닌데,`||q||^2 / d`Softmax 정상화 후, 각각의 관련 없는 토큰은 여전히 기여합니다.`O(1/N)`중계된 금액에 대한.`O((N-1)/N) = O(1)` 작은 양이 아닙니다.

모델은 하드 톱-k와 비슷한 것을 원합니다. 일치하는 토큰에 높은 무게, 다른 곳에서는 거의 0의 무게입니다. 소프트맥스는 직접적으로 할 수 없습니다.

### 이차적 아이디어

각 머리 Q와 K 프로젝션을 두 가지로 나눌 수 있습니다:$Q = (Q_1, Q_2)$그리고$K = (K_1, K_2)$두 개의 관심 지도를 계산하세요:

```math
\begin{aligned}
A_1 &= \mathop{\mathrm{softmax}}(Q_1 K_1^T / \sqrt{d}) \\
A_2 &= \mathop{\mathrm{softmax}}(Q_2 K_2^T / \sqrt{d})
\end{aligned}
```

출력:

```math
\mathop{\mathrm{DiffAttn}} = (A_1 - \lambda \cdot A_2) V
```

이 추수는 두 지도가 공유하는 모든 잡음 분포를 취소합니다. 두 지도가 127k 관련없는 토큰에 대략 동일한 무게를 가지고 있다면 (이들은 무작위로 초기화되면) 그 신호는 취소합니다. 신호는 실제로 관련된 몇 개의 토큰에서 최고 무게를  두 지도에서 동일한 크기로 표시되면 취소됩니다. 모델이 열차하면 취소되지 않습니다.

`lambda`1개인당 학습 가능한 스칼라를 나타냅니다.`lambda = exp(lambda_q1 dot lambda_k1) - exp(lambda_q2 dot lambda_k2) + lambda_init`- 음의일 수도 있어요`lambda_init`0.8과 같은 작은 긍정적인 숫자로 기본 설정합니다.

### 왜 이 일치하는 방향의 소음 취소

두 개의 험난한 마이크가 같은 목소리를 녹음하는 것을 생각해 보십시오. 둘 다 스피커와 연관된 배경 소음을 들어갑니다. 하나를 다른 것에서 빼면 공유된 소음이 떨어집니다. 두 신호가 완전히 취소되는 것을 막기 위해 충분한 단계 또는 광폭으로 다르기 때문에 목소리는 생존합니다.`lambda`이 균형을 정확히 배운다.

### V1 vs V2: 차이

V1는 기본 라인 트랜스포머와 동일한 파라미터 카운트를 유지했다. 두 개의 쿼리를 당 헤드에서 얻으려면 헤드 크기를 절반으로 줄였습니다. 이는 헤드 표현성을 비용으로  더 고통스럽게  당 헤드 값 캐시를 절반으로 줄였습니다. 디코드는 단계당 두 번 (softmax 분기당 한 번) 값 캐시를 로드해야했습니다. 결과: 일치하는 파라미터 카운트를 제외하고 기본 라인보다 느리게 디코드합니다.

V2는 질의 헤드 수를 두 배로 늘리고 KV 헤드 수를 동일하게 유지한다 (향향 투명에서 매개 변수를 빌려). 헤드 크기는 기본 라인과 동일하게 유지된다. 추출 후, 추가 차원은 기본 라인 트랜스포머와 일치하도록 다시 아래로 투영된다.$O_W$3가지가 동시에 일어나는 겁니다.

1. 디코딩 속도는 기본 라인 (KV 캐시가 한 번 로드됩니다).
2. FlashAttention는 변경되지 않고 실행됩니다 (작정 커널이 없습니다).
3. 해독 시 수학적 강도는 증가합니다 (HBM에서 로드된 바이트당 더 많은 계산).

V2는 또한 V1가 추출을 안정시키기 위해 사용한 1인당 RMSNorm를 제거합니다. 70B급 사전 훈련 스케일에서, RMSNorm는 늦은 훈련을 불안정시킵니다. V2는 추가 모듈이 없으면 훈련을 안정적으로 유지하는 더 간단한 초기화 계획으로 대체합니다.

### 언제 그 를 찾아낼 수 있습니까?

| Workload | Benefit |
|----------|---------|
| Long-context RAG (64k+) | Cleaner attention maps, fewer hallucinated citations |
| Needle-in-haystack benchmarks | Substantial accuracy lift past 32k |
| Multi-document QA | Less cross-document interference |
| Code completion at 8k | Marginal, not worth the architecture change |
| Short chat (< 4k) | Essentially indistinguishable from baseline |

4k 토큰에서는 노이즈 바닥이 충분히 작아서 표준주의는 괜찮습니다. 128k에서는 당신을 해치고 있습니다.

### 다른 2026 과 어떻게 겹치는지

| Feature | Compatible with DIFF V2? |
|---------|------------------------|
| GQA | Yes (V2 increases Q heads, not KV heads) |
| MLA (DeepSeek) | Yes in principle, no published paper combining them |
| MoE | Yes (attention is independent of MLP block) |
| RoPE | Yes (unchanged) |
| YaRN / long-context scaling | Yes (exactly where DIFF helps most) |
| FlashAttention | Yes in V2 (was no in V1) |
| Speculative decoding | Yes (attention change is invisible to the spec-decode loop) |

```figure
differential-attention
```

## 건설 해

`code/main.py`순수한 파이썬에서 차별적 주의를 구현합니다. 알려진 신호 + 소음 구조를 가진 장난감 쿼리는 소음- 취소 비율을 직접 측정할 수 있습니다.

### 단계 1: 표준 소프트맥스 주의

Stdlib 매트릭스 작전: 목록 목록, 수동 매트뮬, 수학적 안정성 최대 추수와 함께 소프트맥스.

```python
def softmax(row):
    m = max(row)
    exps = [math.exp(x - m) for x in row]
    s = sum(exps)
    return [e / s for e in exps]
```

### 단계 2: Q, K를 두 가지로 나눌 수 있습니다

V1 스타일: 머리 크기를 반으로 줄여주십시오. V2 스타일: 머리 크기를 유지하고 머리 수를 두 배로 늘려주십시오. 장난감 구현은 V1를 사용하여 교육적 명확성을 제공합니다.

### 단계 3: 두 개의 소프트맥스 분자 + 추수

```python
A1 = [softmax([dot(q1, k) / scale for k in K1]) for q1 in Q1]
A2 = [softmax([dot(q2, k) / scale for k in K2]) for q2 in Q2]
diff_weights = [[a1 - lam * a2 for a1, a2 in zip(r1, r2)] for r1, r2 in zip(A1, A2)]
out = [[sum(w * v[j] for w, v in zip(row, V)) for j in range(d_v)] for row in diff_weights]
```

참고: 출력중도는 음적일 수 있습니다. 괜찮습니다.  값 캐시는 여전히 서명된 기여를 처리합니다. 다음 V 투영은 신호를 흡수합니다.

### 단계 4: 잡음 취소 측정

길이 1024의 합성 염기서열을 만들죠. 신호 기호를 알려진 위치에 배치하고 나머지는 소리로 채워라 신호 위치에서 표준 소프트맥스 주의력 무게와 (b) 차분주의 주의력 무게를 계산한다. 각각의 신호-음악 비율을 측정한다. DIFF 주의는 두 가지 가지 가지의 차이에 따라 3x-10x의 인수를 더 높은 신호-음악 비율을 안정적으로 생성합니다.

### 단계 5: V1 vs V2 매개 변수 회계

구성 (숨겨진=4096, 헤드=32, d_head=128) 를 보면, 다음을 인쇄합니다.

- 기본 변환기: Q, K, V 각 크기가 `hidden * hidden`4*에서 숨은 MLP
- DIFF V1: 각 크기의 Q, K`hidden * hidden`, V 크기가`hidden * hidden`(변화되지 않은), 머리 은 내부로 반으로 줄여서`lambda`매개 변수$(O(\text{heads} \cdot d_{\text{head}}))$- 그래
- DIFF V2: Q 크기가 `2 * hidden * hidden`, K 크기가`hidden * hidden`, V 크기가`hidden * hidden`- 은 은 은 은 은 은$O_W$- 같은 것을 더합니다`lambda`매개 변수

장난감은 V2에 대한 추가 매개 변수 비용을 측정합니다 (약`hidden * hidden`각 주의 블록에 추가) 를 인쇄합니다.

## 사용 하 고

DIFF V2는 2026년 4월 현재 모든 생산 추론 서버에 아직 배포되지 않았지만 vLLM와 SGLang에서 통합이 진행되고 있습니다. 한편, 패턴은 다음과 같습니다:

- 마이크로소프트의 내부 장 контекст 생산 모델
- 여러 오픈 모델 교육에서 256k 이상의 컨텍스트를 대상으로 한 연구 복제.
- DIFF 주의와 대안층의 슬라이딩 창 주의를 결합하는 하이브리드 아키텍처

2026년에 이 목표를 달성할 때

- 64k+의 효과적인 맥락을 목표로 새로운 모델을 처음부터 훈련합니다. 초기부터 차별적 관심을 추가하십시오. 나중에 재교육은 비용이 많이 들습니다.
- 중간에 놓인 오류가 당신의 평가에 지배하는 긴 맥락 모델을 정렬합니다. Q 예측에 대한 LoRA는 DIFF 구조에 가깝습니다.

당신이 하지 않을 때

- 여러분은 선실 훈련된 밀도가 높은 모델과 안정적인 장기적인 성능을 제공해 줍니다. 재 훈련 비용은 기존 무게에 거의 보답하지 않습니다.
- 네 맥락은 항상 16K 이하이고, 노이즈 바닥은 무시할 수 없다.

## 선박

이 교훈은`outputs/skill-diff-attention-integrator.md`. 모델 아키텍처, 목표 컨텍스트 길, 환각 프로필 및 훈련 예산을 고려하면 새로운 사전 훈련 경기에 또는 LoRA 정교화에 차별화된 관심을 추가하기 위한 통합 계획을 생성합니다.

## 운동

1. 달아`code/main.py`.차별 주의를 위해 보고된 신호-음악 비율이 합성 질의 표준 소프트맥스 주의보다 높다는 것을 확인합니다.

2. 7B급 모델 (숨은=4096, 헤드=32, d_head=128, 32 레이어) 에서 기하급수에서 DIFF V1 및 기하급수에서 DIFF V2까지의 매개 변수 셀 delta를 계산한다. 어떤 구성 요소가 매개 변수를 얻었고, 어떤 구성 요소가 동일하게 유지되었는지 표시한다.

3. DIFF V1 논문 (arXiv:2410.05258) 의 3부와 DIFF V2 Hugging Face 블로그의 2부 를 읽어 보십시오. 두 문장으로 V1 인 머릿속 RMSNorm이 왜 필요했는지, V2가 훈련의 차이는 발생하지 않고 제거할 수 있었던 이유를 설명하세요.

4. 압축을 구현: `lambda = 0`(순한 첫 번째 부드러운 최대)`lambda = 1`합성 질의에서 신호에서 소음의 변화의 변화를 측정합니다.`lambda`신호에서 소음을 극대화합니다.

5. 장난감을 GQA + DIFF V2로 확장하십시오. 8 KV 헤드 및 32 Q 헤드 선택하십시오. KV 캐시 크기가 동일한 (8, 32) 구성의 기본 GQA 모델과 일치하는지 표시하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Differential attention | "Two softmaxes minus each other" | Split Q, K into two halves, compute two softmax maps, subtract the second (scaled by $\lambda$) from the first, then multiply by V |
| Noise floor | "The non-zero tail of softmax" | The $O(1/N)$ weight softmax puts on every unrelated token, which sums to $O(1)$ across long contexts |
| lambda | "The subtraction scale" | Per-head learnable scalar parameterized as `exp(lq1.lk1) - exp(lq2.lk2) + lambda_init`; can be negative |
| DIFF V1 | "The ICLR 2025 version" | Original Differential Transformer; halves head dim to preserve parameter count, needs custom kernel, slower decode |
| DIFF V2 | "The January 2026 fix" | Doubles Q heads keeping KV heads; matches baseline decode speed and works with FlashAttention |
| Per-head RMSNorm | "The V1 stabilizer" | Extra norm V1 applied after the difference; V2 removed it to prevent late-training instability |
| Signal-to-noise ratio | "How much attention is wasted" | Ratio of weight on the true signal position to average weight on unrelated positions |
| Lost in the middle | "Long-context failure mode" | Empirical phenomenon where retrieval accuracy dips for documents in the middle of a long context — DIFF attention reduces this |
| Arithmetic intensity | "FLOPs per byte loaded" | Ratio V2 increased at decode by doubling queries per KV load; important for memory-bound decode |

## 더 많은 읽기

- [Ye et al. — Differential Transformer (arXiv:2410.05258, ICLR 2025)](https://arxiv.org/abs/2410.05258) 노이즈 취소 이론과 긴 맥락의 압축을 가진 원본 논문
- [Microsoft unilm — Differential Transformer V2 (Hugging Face blog, January 2026)](https://huggingface.co/blog/microsoft/diff-attn-v2) 생산 스택 재쓰기, 기본 라인 디코딩과 일치, FlashAttention 호환성
- [Understanding Differential Transformer Unchains Pretrained Self-Attentions (arXiv:2505.16333)](https://arxiv.org/abs/2505.16333) 추출이 미리 훈련된 주의 구조를 회복하는 이유에 대한 이론적 분석
- [Shared DIFF Transformer (arXiv:2501.17900)](https://arxiv.org/html/2501.17900) 파라미터 공유 변수
- [Vaswani et al. — Attention Is All You Need (arXiv:1706.03762)](https://arxiv.org/abs/1706.03762) 기본선 변압기 DIFF는
- [Liu et al. — Lost in the Middle (arXiv:2307.03172)](https://arxiv.org/abs/2307.03172) 장기적 기준 DIFF의 관심 목표
