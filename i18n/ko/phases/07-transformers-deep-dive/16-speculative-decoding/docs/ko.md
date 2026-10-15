# 추측적 디코딩  설계, 확인, 반복

> 오토레그레시브 디코딩은 일련의 것입니다. 각 토큰은 이전 하나를 기다리고 있습니다. 추측 디코딩은 연쇄를 깨고 있습니다. 저렴한 모델은 N 토큰을 드래프트, 비싼 모델은 모든 N를 한 번으로 확인합니다. 드래프트가 올바르면 N 세대를 위해 큰 돈을 지불했습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 07 (GPT Causal LM), Phase 7 · 12 (KV Cache & Flash Attention)
**Time:** ~60 minutes

## 문제

70B LLM 샘플링 한 토큰은 H100에서 ~30 ms, 3B 드래프트 모델은 ~3 ms, 3B 드래프트 5 토큰을 앞당겨주면, 모든 5개를 확인하기 위해 70B * 한번*를 실행하면 총은 $5 \times 3 + 30 = 45$ms 최대 5개의 승인된 토큰에`5×30 = 150 ms`바로선 생성에 대한 모든 추측적 디코딩 피치입니다. 작은 양의 추가 GPU 메모리를 24x 더 낮은 디코딩 지연으로 교환합니다.

이 트릭은 분포를 보존해야 합니다. 레비아탄 등이 (2023) 와 첸 등이 동시에 도입한 추측 샘플링은 출력 순서가 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 **identically distributed**큰 모델이 스스로 만들어 낼 수 있는 것보다 더 빨리

4개의 드래프트-베리퍼 쌍이 2026 추론을 지배한다.

1. **Vanilla speculative (Leviathan 2023).**별도의 초안 모델 (예를 들어, Llama 3 1B) + 검증기 (예를 들어, Llama 3 70B).
2. **Medusa (Cai 2024).**검증기 상의 여러 디코딩 헤드들이 예측 위치를 `t+1..t+k`병렬로, 별도의 모형이 없습니다.
3. **EAGLE family (Li 2024, 2025).**검증자의 숨겨진 상태를 재사용하는 가벼운 드래프트; 바닐라보다 더 가까운 수용률; 34× 전형적인.
4. **Lookahead decoding (Fu 2024).**자코비 반복, 전혀 초안 모델이 필요없습니다. 자설, 니치, 하지만 의존도 없습니다.

2026년 모든 생산 추론 스택은 기본적으로 추측 해독을 배포합니다. vLLM, TensorRT-LLM, SGLang, 그리고 llama.cpp 모두 적어도 바닐라 + EAGLE-2를 지원합니다.

## 개념

### 핵심 알고리즘

검증자를 $M_q$그리고 더 저렴한 드래프트$M_p$이 부분의 본문은

1. -    $x_1 \ldots x_k$이미 디코딩된 사전이어야 합니다.
2. **Draft**: 사용 $M_p$자율적으로 제안하는 것$d_{k+1}, d_{k+2}, \ldots, d_{k+N}$초안 확률이 있는$p_1 \ldots p_N$- 그래
3. **Verify in parallel**: 실행$M_q$한 번 더$x_1 \ldots x_k, d_{k+1}, \ldots, d_{k+N}$, 검증자 확률을 얻는$q_1 \ldots q_{N+1}$포지션에 대해$k+1 \ldots k+N+1$- 그래
4. **Accept/reject each draft token left to right**: 각 $i$, 확률로 받아들이$\min(1, q_i(d_i) / p_i(d_i))$- 그래
5. 첫 번째 거부에 대해$j$: 샘플$t_j$"부체" 분배에서$(q_j - p_j)_+$모든 초안은 정상화되었습니다$j$폐기됩니다.
6. 모든 것을 받아들이는 것에 대해$N$: 샘플 1개의 추가 토큰$t_{N+1}$$q_{N+1}$(영화 보너스 토큰)

잔재 분포 트릭은 정렬하게 분포된 출력을 유지하는 수학적인 통찰력입니다$M_q$초점부터 샘플을 가져왔어요

### 가속화 를 결정 하는 것

-    $\alpha$= 도래 도표 당 예상 수용률$c$= 초안에서 검증자 사이의 비용 비율.

- 순진한 세대는 토큰당 1개의 큰 모델 호출을 합니다.
- 투구자는 1 대 모델에 대해$(1 - \alpha^{N+1}) / (1 - \alpha) \approx 1/(1-\alpha)$시호가 언제$\alpha$고장입니다.

일반적인 엄지손가락 규칙$\alpha = 0.75$그리고$N = 5$: 3배 더 적은 대형 모델 통화. 드래프트 비용은 5배 더 저렴합니다. 전체 벽 시계 2.5배 정도 떨어집니다.

**$\alpha$ depends on:**

- 그 초안이 검증자를 얼마나 잘 추대하는지 같은 가족 / 같은 교육 자료가 증가합니다$\alpha$그 이유는
- 탐욕적인 검증자와 탐욕적인 설계: 높은 $\alpha$. 온도 샘플링: 더 잘 맞출 수 없고 수용률이 떨어집니다.
- 작업 유형: 코드 및 구조화된 출력은 더 많은 것을 (예측할 수 있는) 받아들이고, 자유형의 창조적 글은 덜 받아들이고 있습니다.

### 메두사  초안 모델이 없는 초안

메두사 (Medusa) 는 설계 모델을 검증기 위에 추가 출력 헤드 (output heads) 로 대체합니다.`t`이 부분의 본문은

```
shared trunk → hidden h_t
    ├── head_0: predict token at t+1  (standard LM head)
    ├── head_1: predict token at t+2
    ├── head_2: predict token at t+3
    ├── head_3: predict token at t+4
```

각 헤드마다 자신의 로그티를 내보내기 위해 각 헤드에서 샘플을 가져다가 후보의 연속을 얻습니다. 그리고 모든 후보의 연속을 한 번에 고려하는 트리 주의 스키마를 사용하여 한 번 앞을 통과하여 확인합니다.

장점: 두 번째 모델이 없습니다. 단점: 훈련 가능한 매개 변수를 추가합니다. 감독된 정렬 단계 (~ 1B 토큰) 이 필요합니다. 좋은 드래프트와 함께 바닐라 투기보다 수용률은 약간 낮습니다.

### 이글  숨겨진 상태를 재사용함으로써 더 나은 드래프트

EAGLE-1/2/3 (Li et al., 20242025) 는 초안 모델을 검증자의 마지막 층 숨겨진 상태를 흡수하는 작은 변조체 (일반적으로 1 층) 로 만듭니다. 초안은 검증자의 특징 표현을 볼 수 있기 때문에, 그것의 예측은 검증자의 출력 분포와 강하게 상관관한다. 수용률은 ~0.6 (반닐라) 에서 0.85+로 상승합니다.

vLLM 및 SGLang 선박은 Llama 3/4 및 Qwen 3의 기본 스펙 경로로로 EAGLE-2/3을 추가했습니다.

### KV 캐시 댄스

검증 피드$N$한 번 앞을 지나서 검증기 로 로켓 도표를 작성하여 검증자의 KV 캐시를$N$일부 드래프트가 거부되면 캐시를 받아 들인 사전값으로 되돌려야 합니다.

생산 구현 (vLLMs `--speculative-config`소RT-LLM의 LookaheadDecoder) 이 스크래치 KV 버퍼를 사용하여 처리합니다. 먼저 작성하고, 수용에 약속합니다. 개념적으로 어렵지 않지만, 그것은 피드리입니다.

```figure
draft-verify-tokens
```

## 건설 해

보시다시피`code/main.py`. 우리는 다음과 같이 핵심 유적 샘플링 알고리즘 (거림 단계 + 잔여 분포) 을 구현합니다:

- "큰 모델"은 손으로 코딩된 배포에 대한 결정적-softmax입니다 (그래서 우리는 분석적으로 수용 수학을 확인할 수 있습니다).
- "프로젝트 모델"은 큰 모델의 혼란입니다.
- 직접 샘플링과 동일한 소재 분포를 생성하는 수용/ 거부 루프.

### 단계 1: 거절 단계

```python
def accept_or_reject(q_prob, p_prob, draft_token, u):
    ratio = q_prob / p_prob if p_prob > 0 else float("inf")
    return u < min(1.0, ratio)
```

`u`이 숫자는`q_prob`작성된 토큰에 대한 검증자의 확률입니다. `p_prob`레비아탄 정리는 이 베르누리 결정이 거부에 대한 잔액에서 샘플링을 따라 검증자의 분포를 정확하게 보존한다는 것입니다.

### 단계 2: 잔재 분포

```python
def residual_dist(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    return [r / s for r in raw]
```

추출`p``q`이 요소에 따라, 음값을 0으로 압축하고, 다시 정상화합니다.

### 3단계: 한 가지 추측적인 단계

```python
def spec_step(prefix, q_model, p_model, N, rng):
    drafts = []
    p_probs = []
    ctx = list(prefix)
    for _ in range(N):
        p_dist = p_model(ctx)
        d = sample(p_dist, rng)
        drafts.append(d)
        p_probs.append(p_dist[d])
        ctx.append(d)

    q_dists = [q_model(prefix + drafts[:i]) for i in range(N + 1)]

    for i, d in enumerate(drafts):
        u = rng.random()
        q_prob = q_dists[i][d]
        p_prob = p_probs[i]
        if u < min(1.0, q_prob / p_prob if p_prob > 0 else float("inf")):
            prefix = prefix + [d]
        else:
            res = residual_dist(q_dists[i], p_model(prefix))
            prefix = prefix + [sample(res, rng)]
            return prefix
    prefix = prefix + [sample(q_dists[N], rng)]
    return prefix
```

5개의 보너스 1개 → 6개의 토큰이 1개의 확인 패스로 생성됩니다.

### 단계 4: 수용률을 측정

각종 드래프트 품질 수준에서 10,000개의 추측 단계를 실행하세요. 드래프트와 검증자 분포 사이의 도표 수용률과 KL 분차율을 비교해 보세요.

### 5단계: 분배 비대칭을 확인

경험적으로: 추측 루프에서 생성된 토큰의 히스토그램은 검증자로부터 직접 샘플링을 통해 생성된 히스토그램과 일치해야 한다. 이것은 실제 레비아탄 정리이다. 치 제곱 테스트는 샘플링 오류 내에서 확인한다.

## 사용 하 고

생산:

```bash
# vLLM with EAGLE
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-config '{"method": "eagle", "model": "/models/llama-3.1-eagle-70b", "draft_tensor_parallel_size": 1, "num_speculative_tokens": 5}'

# vLLM with vanilla draft model
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-config '{"method": "draft_model", "model": "meta-llama/Llama-3.2-1B-Instruct", "num_speculative_tokens": 5}'
```

소르RT-LLM은 2026년 중순으로 가장 빠른 메두사 경로를 가지고 있습니다.`faster-whisper`작은 드래프트로 Whisper-large의 추측적 디코딩을 엮습니다.

**Picking a draft:**

| Strategy | When to pick | Speedup |
|----------|--------------|---------|
| Vanilla draft (1B/3B Llama family) | Fast prototype, no training | 1.8–2.3× |
| Medusa heads | You can fine-tune the verifier | 2–3× |
| EAGLE-2 / 3 | Production, max speed | 3–4× |
| Lookahead | No draft, no training, no extra params | 1.3–1.6× |

**When NOT to spec-decode:**

- 15 토큰의 단일 순서 생성. 오버헤드 주위입니다.
- 매우 창의적인 / 높은 온도 샘플링 ($\alpha$분포한다.
- 메모리 제한된 배포 (예안 모델은 VRAM를 추가한다).

## 선박

보시다시피`outputs/skill-spec-decode-picker.md`. 기술 은 새로운 추론 작업 부하 를 위해 가상의 해독 전략 (반일라 / 메두사 / 이글 / 룩헤드) 과 조정 매개 변수 (N, 초안 온도) 를 선택 한다.

## 운동

1. **Easy.**달아`code/main.py`. 시제품 토큰 유통이 시제품 시제품 직접 유통과 일치하는 것을 확인합니다.
2. **Medium.** 함수로서               $N$$\alpha = 0.5, 0.7, 0.85$최적의 방법을 찾아내기$N$각$\alpha$. (힌트: 확인 호출당 예상 토큰 = $(1 - \alpha^{N+1}) / (1 - \alpha)$.)
3. **Hard.**작은 메두사 (Medusa) 를 구현: 레슨 14에서 캡스톤 GPT를 가져와서, t+2, t+3, t+4 위치를 예측하는 3개의 추가 LM 헤드를 추가하십시오.
4. **Hard.**역전: 10 토큰의 전두환 KV 캐시로 시작하여 5 도래상 토큰을 입력하여 3 위치에서 거부를 시뮬레이션하십시오. 다음 반복에서 캐시 읽기 "전두환 + 첫 2 개의 승인된 도래상"과 일치하는지 확인합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Draft model | "The cheap one" | A smaller model that proposes candidate tokens; usually 10–50× cheaper than the verifier. |
| Verifier | "The big one" | The target model whose distribution we preserve; runs once per speculative step. |
| Acceptance rate ($\alpha$) | "How often the draft is right" | Per-token probability that the verifier accepts the draft. 0.7–0.9 typical. |
| Residual distribution | "The rejection fallback" | `(q - p)_+` normalized; sampling from this on rejection preserves the verifier's distribution. |
| Bonus token | "The free one" | When all N drafts accepted, sample one more from the verifier's next-step distribution. |
| Medusa | "Draft-less speculative" | Multiple LM heads on the verifier predict positions t+1..t+k in parallel. |
| EAGLE | "Hidden-state draft" | Tiny transformer draft conditioned on the verifier's last-layer hidden states. |
| Lookahead decoding | "Jacobi iteration" | Self-speculation using a fixed-point iteration; no draft model. |
| Tree attention | "Verify many candidates at once" | Branching verification that considers several draft continuations simultaneously. |
| KV rollback | "Undo rejected drafts" | Scratch KV buffer; commit on acceptance, discard on reject. |

## 더 많은 읽기

- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) 핵심 알고리즘과 동등성 정리
- [Chen et al. (2023). Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) 동시 도입; 깨끗한 베르누리 거부 증거.
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) 메두사 종이; 나무 주의 검증
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) EAGLE-1; 숨겨진 국가 조건으로 설계
- [Li et al. (2024). EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees](https://arxiv.org/abs/2406.16858) 이글-2; 동적 나무 깊이.
- [Li et al. (2025). EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test](https://arxiv.org/abs/2503.01840) 이글-3
- [Fu et al. (2024). Break the Sequential Dependency of LLM Inference Using Lookahead Decoding](https://arxiv.org/abs/2402.02057) 경보, 초안이 없는 접근
- [vLLM docs — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode.html) 모든 4 가지 전략이 연결된 가공적 참조
- [SafeAILab / EAGLE reference implementation](https://github.com/SafeAILab/EAGLE) EAGLE-1/2/3의 참조 코드
