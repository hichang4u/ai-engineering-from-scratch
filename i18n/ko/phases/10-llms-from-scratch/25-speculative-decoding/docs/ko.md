# 추측적 디코딩과 이글

> 한 토큰을 생성하는 한계 LLM는 수십억개의 매개 변수를 완전히 통과시켜야 합니다. 이 앞 패스는 엄청나게 과다 공급됩니다. 대부분의 경우 훨씬 작은 모델은 다음 3-5 개의 토큰을 정확하게 추측할 수 있고, 큰 모델은 추측을 *확인해야 합니다. 만약 추측이 옳다면 1개의 가격에 5개의 토큰이 있습니다. 추측적 디코딩 (Leviathan et al. 2023년) 은 정확히 그렇게 했고, EAGLE-3 (2025) 는 일치하는 출력 배포에서 4-5x 가속화로 확인당 ~4.5 토큰으로 수용률을 끌어올렸다.

**Type:** Build
**Languages:** Python (with numpy)
**Prerequisites:** Phase 10 Lesson 12 (Inference Optimization), Phase 10 Lesson 04 (Pre-training Mini-GPT)
**Time:** ~75 minutes

## 문제

H100에서 70B급 모델의 디코드 처리량은 일반적으로 40~80 토큰/초입니다. 각 토큰은 HBM에서 모든 모델 무게를 읽는 완전한 전진 패스를 필요로 합니다. 출력을 변경하지 않고 모델을 작게 만들 수 없습니다. 메모리를 넘어 배치 크기를 증가시킬 수 없습니다. 전진 패스당 1 토큰 이상의 모델 출력을 허용하지 않는 한 당신은 에 갇혀 있습니다.

오토레그레시브 세대들은 본질적으로 일련의 모습으로 보입니다.`x_{t+1} = sample(p(· | x_{1:t}))`하지만 동시 가능성은 있습니다. 만약 당신이 "다음 4개의 토큰은 아마도 [a, b, c, d]"라고 말하는 값싼 예측자를 가지고 있다면, 당신은 a의 모든 5개의 위치를 확인할 수 있습니다.**single forward pass of the big model**그리고 가장 긴 일치하는 사전을 받아보세요.

레비아탄, 칼라이, 마티아스 (2023, "스펙룰레이션 디코딩을 통해 트랜스포머로부터 빠른 추론") 은 목표 모델의 샘플링 분포를 보존하는 똑똑한 수용/ 거부 규칙을 통해 정확하게 만들었습니다. 동일한 출력 분포, 2-4x 더 빠르다.

## 개념

### 두 가지 모델의 설정

- **Target model** `M_p`: 큰, 느리고, 높은 품질의 모델, 실제로 샘플을 원합니다. 배포: `p(x)`- 그래
- **Draft model** `M_q`: 작고 빠른 품질이 낮은 모델.`q(x)`5~30배 작아

단계별로:

1. 제안된 모델안 `K`자율적으로 토큰: `x_1, x_2, ..., x_K ~ q`- 그래
2. 목표 모델은 모두 1번 앞을 통과합니다`K+1`평행 위치, 생산 `p(x_k)`제안된 토큰 하나하나에 대해
3. 아래 수정된 거부 샘플링 규칙을 통해 왼쪽에서 오른쪽으로 각 토큰을 받아서 거부합니다. 가장 긴 일치하는 사전을 받아보세요.
4. 만약 어떤 토큰이 거부된다면, 수정된 배포에서 교체된 토큰을 샘플링하고 중지하십시오. 그렇지 않으면 `p(· | x_1...x_K)`- 그래

만약 초안이 목표와 완벽하게 일치한다면, 당신은 K+1 토큰을 목표-이향에 따라 얻을 수 있습니다. 초안이 위치 1에서 잘못되면, 당신은 1 토큰을 얻을 수 있습니다.

### 정확성 규칙

추측적 해독은**provably equivalent in distribution to sampling from p**거부 규칙:

```
For each drafted token x_t:
    r ~ Uniform(0, 1)
    if r < p(x_t) / q(x_t):
        accept x_t
    else:
        sample replacement from residual: (p - q)+ / ||(p - q)+||_1
        stop
```

어디`(p - q)+`점차차의 긍정적인 부분을 나타냅니다.`p ≈ q`) 수용률은 거의 1. 그들이 동의하지 않을 때, 잔류 분포는 전체 샘플이 여전히 정확하게 구성됩니다.`p`- 그래

**Greedy case.**온도=0 샘플링에 대해서는 확인해 보세요`argmax(p) == x_t`만약 그래면 받아들여, 그렇지 않다면 출력`argmax(p)`그리고 멈추세요.

### 예상되는 속도

만약 초안 모델의 토큰 수준의 수용률이 `α`, 목표 전진 패스당 생산되는 예상 토큰은

```math
\mathbb{E}[\text{tokens}] = \frac{1 - \alpha^{K+1}}{1 - \alpha} \qquad K = \text{draft length}, \ \alpha \in [0, 1]
```

`α = 0.8, K = 4`이 책:`(1 - 0.8^5)/(1 - 0.8) = 3.36`단 하나의 목표가 대략적으로 `cost_q * K + cost_p`(K 초안 단계와 하나의 목표 확인)`cost_p >> cost_q * K`가속화 비율은`3.36× / 1 = 3.36×`출력

유일한 실제 매개 변수는`α`, 이는 전적으로 미사일-목표 조화를 좌우하는 것입니다. 좋은 미사일은 모든 것입니다.

### 설계 훈련: 비료

무작위 작은 모델은 나쁜 드래프트를 만듭니다. 표준 레시피는 목표에서 비추는 것입니다.

1. 작은 건축물을 선택하십시오 (70B 목표에 ~ 1B, 7B 목표에 ~ 500M).
2. 대 텍스트 코퍼스에서 목표 모델을 실행하고 다음 토큰 배포를 저장합니다.
3. KL 분리를 통해 미세한 도표에 대한 대상을 훈련시켜야 합니다.

그 결과:`α`일반적으로 0.6-0.8의 코딩, 0.7-0.85의 자연어 채팅. 생산 속도가 2-3x 증가합니다.

### 이글: 나무 도형 + 기능 재사용

리, 웨이, 장, 장 (2024, "EIGLE: Speculative Sampling Requires Rethinking Feature Uncertainty") 는 표준 스펙룰레이티브 디코딩에서 두 가지 비효율성을 관찰했습니다:

1. 이 드래프트는 K 일련 단계를 수행합니다. 각각의 전체 스택이 있습니다. 하지만 드래프트는 가장 최근의 목표의 특징 (숨긴 상태) 을 재사용 할 수 있습니다.
2. 드래프트는 선형 연쇄를 출력한다. 드래프트는 후보의 * 트리 * (각 노드 여러 추측) 를 출력할 수 있다면, 목표의 단일 앞으로 통과는 트리 주의 마스크를 통해 여러 후보 경로를 병렬적으로 확인하고 가장 긴 수용 된 가지를 선택할 수 있다.

이글-1 변경 사항:
- 드래프트 입력 = 목표의 최종 숨겨진 상태 t 위치에서, 원본 토큰이 아닙니다.
- 설계 구조 = 1 트랜스포머 디코더 레이어 ( 별도의 작은 모델이 아닙니다).
- 출력 = K = 깊이당 4-8 후보의 나무, 깊이 4-6

에이글-2 (2024) 는 역동적인 나무 토폴로지를 추가합니다. 나무는 드래프트가 불확실한 곳에서는 더 넓어지고, 자신감이 있는 곳에서는 좁아집니다.`α_effective`확인 비용을 증가시키지 않고

이글 3 (Li et al. 2025년, "EAGLE-3: 훈련 시간 테스트를 통해 대규모 언어 모델의 인퍼런스 가속화를 확장") 는 고정된 상위 계층 기능 의존성을 제거하고 새로운 "시험 시간 시뮬레이션" 손실을 통해 초안을 훈련합니다. 수용률은 0.75 (EAGLE-2) 에서 0.82 (EAGLE-3) 으로 증가하고, 평균 토큰/확인율은 3.0에서 4.5로 증가합니다.

### 나무 주의 확인

초안이 나무를 출력할 때, 목표 모델은 **tree attention mask** 정성선보다는 나무의 토폴로지를 암호화하는 인과적 마스크. 각각의 토큰은 나무의 조상만을 돌보며. 검증 패스는 여전히 한 앞, 한 마트무일; 토폴로직 마스크는 몇 가지 추가 KV 입력만 소요된다.

```
        root
       /    \
      a      b
     / \    / \
    c  d   e   f
```

만약`a, b`1등표 후보가 경쟁하고 있습니다`c, d, e, f`두 번째 토큰 후보자, 모든 여섯 위치 모두 한 번으로 확인됩니다. 출력은 어떤 허용 경로에서 가장 긴 사전입니다.

### 승리 할 때, 실패 할 때

**Wins:**
- 예측 가능한 텍스트 (코드, 일반 영어, 구조화된 출력) 를 사용하여 채팅 / 완료합니다. `α`고장입니다.
- 디코딩 (메모리 묶인 단계) 도중 사용되지 않은 GPU 계산을 가진 설정. 트리 드래픽팅은 사용 가능한 FLOP를 사용합니다.

**Loses / no win:**
- 매우 스토카스틱한 출력 (높은 온도에서 창의적인 글쓰기)`α``1/|vocab|`- 그래
- 매우 높은 동시  배팅으로 배팅을 하는 것은 이미 FLOP를 채우고 있어 나무 검증에 대한 공간이 거의 없습니다.
- 아주 작은 표적 모델인데, 그 표적은 그리 작지 않습니다.

제작 상점은 일반적으로 채팅에서 2-3x 벽 시계 가속화, 코드 생성에서 3-5x, 그리고 창의적인 글쓰기에서 거의 0을 보고합니다.

```figure
speculative-decoding
```

## 건설 해

`code/main.py`이 부분의 본문은

- 참고문헌`speculative_decode(target, draft, prompt, K, temperature)`정확한 거부 규칙을 시행하고 검증하여 목표의 분포를 보존하는 (실험적 KL < 0.01 대 일반 목표 표본)
- 이글 스타일의 나무 수형으로, 위쪽의 p 가지로 깊은 K 나무를 만듭니다.
- 나무 주의 마스크 제작자, 검증기 위해 적절한 인과 패턴을 생성합니다.
- 작은 LM (GPT-2-미중 목표에서 GPT-2-미중을 분리) 에서 모두 실행되는 수용률 리네스.

```python
def speculative_step(p_target, q_draft, K, temperature=1.0):
    """One round of speculative decoding. Returns list of accepted tokens."""
    # 1. Draft K tokens
    draft_tokens = []
    q_probs = []
    state = draft_state_init()
    for _ in range(K):
        probs = softmax(q_draft(state) / temperature)
        t = np.random.choice(len(probs), p=probs)
        draft_tokens.append(t)
        q_probs.append(probs[t])
        state = draft_step(state, t)

    # 2. Target computes p at every drafted position + 1 extra
    p_probs_all = target_forward_batched(p_target, draft_tokens, temperature)

    # 3. Accept/reject left-to-right
    accepted = []
    for k, tok in enumerate(draft_tokens):
        r = np.random.uniform()
        if r < p_probs_all[k][tok] / q_probs[k]:
            accepted.append(tok)
        else:
            residual = np.maximum(p_probs_all[k] - q_probs[k], 0)
            residual /= residual.sum()
            accepted.append(np.random.choice(len(residual), p=residual))
            return accepted
    # 4. All K accepted → sample bonus token from target
    accepted.append(np.random.choice(len(p_probs_all[-1]), p=p_probs_all[-1]))
    return accepted
```

## 사용 하 고

- **vLLM**그리고**SGLang**VLLM에서, 통과 `--speculative-config`JSON 객체와 함께`method``model`그리고`num_speculative_tokens`; EAGLE-3는`"method": "eagle3"`- 그래
- **NVIDIA TensorRT-LLM**메두사나 이글 나무를 원산적으로 지원합니다.
- **Reference draft models**이 책:`Qwen/Qwen3-0.6B`(Qwen3-32B의 초안)`meta-llama/Llama-3.2-1B-Instruct`(Llama 3.x 70B의 초안)
- **Medusa heads**(Cai et al. 2024, "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"): 초안 모델 대신 K 평행 예측 헤드를 목표 자체에 추가하십시오. 배포가 더 간단하며 EAGLE보다 약간 낮은 수용률이 있습니다.

## 선박

이 교훈은`outputs/skill-speculative-tuning.md` 목표 모델의 작업량을 프로파일하고 다음을 선택하는 기술: 드래프트 모델, K (드래프트 길이), 트리 너비, 온도, 그리고 언제 다시 단순 디코드로 떨어질지.

## 운동

1. 정확한 거부 규칙을 적용하고 경험적으로 확인합니다.`speculative_decode`그리고 단순한 목표 샘플링을 통해 두 출력 배포 사이의 TV 거리를 계산한다. < 0.01이어야 한다.

2. 가속화 공식을 계산해 보세요.`α`그리고`K`, 목표-예향에 따라 예상 토큰을 표시합니다. 최적의$K$$\alpha \in \lbrace 0.5, 0.7, 0.9 \rbrace$- 그래

3. 작은 도표를 훈련시켜 124M의 GPT-2 목표를 가져가 100M의 토큰에 30M의 GPT-2 도표를 비추어 KL 손실을 측정합니다`α`수록된 텍스트에 대한 기대: 0.6-0.7.

4. 에이글 스타일의 트리 드래프트링을 구현하세요. 체인 대신, 드래프트 출력 각 깊이에서 상위 3 가지로 만들어 보세요. 트리 주의 마스크를 만들어 보세요. 목표가 가장 긴 올바른 가지를 받아들이는 것을 확인하세요.

5. 실패 모드를 측정합니다. 기온=1.5 (고한 스토카스틱성) 에서 추측 해독을 실행하십시오. α 붕괴를 표시하고 알고리즘은 드래프트 오버헤드 때문에 일반 해독보다 느립니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Target model | "The big model" | The slow, high-quality model you want samples from (p distribution) |
| Draft model | "The speculator" | The small, fast predictor (q distribution); 5-30x smaller |
| K / draft length | "Look-ahead" | Number of speculated tokens per verify pass |
| α / acceptance rate | "Hit rate" | Per-token probability that the draft's proposal is accepted |
| Exact rejection rule | "The accept test" | r < p/q compare that preserves target's distribution |
| Residual distribution | "Corrected p-q" | (p - q)+ / ||(p - q)+||_1, the distribution to sample from on rejection |
| Tree drafting | "Branching speculation" | Draft outputs a tree of candidates, verified in one pass with tree-structured attention mask |
| Tree attention mask | "Topological mask" | Causal mask encoding the tree topology so each node attends only to its ancestors |
| Medusa heads | "Parallel heads" | K extra prediction heads on the target itself; no separate draft model |
| EAGLE feature reuse | "Hidden-state draft" | Draft input is target's last hidden state, not raw tokens, shrinking the draft |
| Test-time simulation loss | "EAGLE-3 training" | Train draft on outputs matching target's test-time distribution, not teacher forcing |

## 더 많은 읽기

- [Leviathan, Kalai, Matias, 2023 — "Fast Inference from Transformers via Speculative Decoding"](https://arxiv.org/abs/2211.17192) 정확한 거부 규칙과 이론적 가속 분석
- [Chen, Borgeaud, Irving et al., 2023 — "Accelerating Large Language Model Decoding with Speculative Sampling"](https://arxiv.org/abs/2302.01318) DeepMind에서 시상식 샘플링 논문
- [Cai, Li, Geng, Wang, Wang, Zhu, Dao, 2024 — "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"](https://arxiv.org/abs/2401.10774) 초안 모델에 대한 대안
- [Li, Wei, Zhang, Zhang, 2024 — "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty"](https://arxiv.org/abs/2401.15077) 기능 재사용 및 나무의 설계
- [Li et al., 2024 — "EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees"](https://arxiv.org/abs/2406.16858) 동적 나무 토폴로지
- [Li et al., 2025 — "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test"](https://arxiv.org/abs/2503.01840) 기차 시간 시험 시간 일치
- [Fu, Haotian, Peng et al., 2024 — "Break the Sequential Dependency of LLM Inference Using Lookahead Decoding"](https://arxiv.org/abs/2402.02057) 자코비/루카헤드 디코딩, 투기자 없는 대안
