# Jamba  하이브리드 SSM 트랜스포머

> 국가 우주 모델 (SSM) 와 트랜스포머들은 다른 것을 원합니다. 트랜스포머는 관심을 통해 질을 사각형 비용으로 구매합니다. SSM는 반복하지만 질의 지연을 통해 선형 시간 추론과 상정한 메모리를 구입합니다. AI21의 Jamba (2024년 3월) 과 Jamba 1.5 (2024년 8월) 은 동일한 모델로 배치합니다. 매 7개의 Mamba 계층에 1개의 트랜스포머 레이어, 다른 모든 블록에 MoE, 그리고 하나의 80GB GPU에 맞는 256k 컨텍스트 윈도우. Mamba-3 (ICLR 2026) 는 복잡한 값 상태 공간과 MIMO 예측으로 SSM 측면을 강화합니다. 이 수업은 두 건축물 모두 끝에서 끝으로 읽으며 하이브리드 레시피가 순수한 SSM와 순수한 트랜스포머의 긴 맥락 시도가 그렇지 않은 3 년의 확장 과정을 살아남은 이유를 설명합니다.

**Type:** Learn
**Languages:** Python (stdlib, layer-mix calculator)
**Prerequisites:** Phase 10 · 14 (open-model architectures), Phase 10 · 17 (native sparse attention)
**Time:** ~60 minutes

## 학습 목표

- Jamba 블록에서 3가지 원시적인 것을 설명해 주세요.
- 높은 수준에서 SSM의 재발이 어떻게 보이는지 그리고 왜 지속적인 기억 추론을 가능하게 하는지를 설명한다.
- Jamba 모델의 KV 캐시 발자국을 256k 컨텍스트에서 계산하고 순수 트랜스포머 모델이 필요로 하는 것과 비교하십시오.
- 3개의 Mamba-3 혁신 (전대적-트라페소이드 분해, 복합 평가 상태 업데이트, MIMO) 과 각자의 목표 문제들을 명명하라.

## 문제

주의는 순서 길이에 따라 사각형이다. 상태 공간 모델은 선형이다. 그 차이점은 화합물입니다. 256k 토큰에서 트랜스포머 주의 지도는 머리 başına 65B 항목입니다. SSM의 반복 상태는 순서 길이와 상관없이 고정 크기가 있습니다.

순수SSM 모델 (Mamba, Mamba-2) 은 작은 규모에서 트랜스포머 복잡성과 일치하지만 상태 추적 작업에 지연하고 맥락 내 검색의 일부 범주에서 실패합니다. 직관: SSM는 역사를 고정된 상태로 압축하고 역사가 길으면 정보가 누출됩니다. 주의는 모든 것을 정확하게 기억하지만 사각형 비용을 지불합니다.

두 가지를 모두 사용해야 합니다. 정확한 회수하는 데 중요한 트랜스포머 층을 넣으십시오. 다른 곳에 SSM 계층을 사용하세요. 비율을 조정해 Jamba는 이 하이브리드 레시피를 규모로 배포한 최초의 생산급 모델이다 (52B 총, 12B 활성, 256k 컨텍스트, 단일 80GB GPU). Jamba 1.5는 398B 전체 / 94B 활성 가족으로 확장합니다. Mamba-3 (ICLR 2026) 는 하이브리드를 재건할 수 있는 현재 최고의 순수 SSM 기본이다.

이 수업은 세 개의 논문을 모두 읽고 "옳은 비율을 선택"하는 정신 모델을 만들어냅니다.

## 개념

### 한 페이지에 있는 SSM

상태 공간 모델은 순서를 처리합니다`x_1, ..., x_N`고정된 크기의 상태를 통해`h`이 부분의 본문은

```math
\begin{aligned}
h_t &= A h_{t-1} + B x_t \\
y_t &= C h_t
\end{aligned}
```

각 단계에 걸쳐 국가는 선형적 역학으로 진화합니다`A`, 입력값을 `B x_t`, 그리고 출력을 배출합니다`C h_t`-`A, B, C`중요한 특성을 알아봅시다.`y_t`필요만`h_{t-1}`그리고`x_t`그 전에 아니었어요`x`기억은 일정합니다.$O(1)$토큰에 따라

모델링 품질의 트릭은 구조입니다`A`. S4 (Gu 2021) 는 훈련 중에 긴 구전으로 효율적으로 평가될 수 있는 고구성 매트릭스를 사용하였다.`A, B, C`데이터 의존성 (선택성) 과 함께. Mamba-2 (2024) 는 구조를 더욱 단순화 시켰습니다. Mamba-3 (2026) 는 특정 장소에서 복잡성을 추가합니다.

핵심 속성은: 디코더 LLM에 있어서, SSM 계층은 증가하는 KV 캐시 대신 고정 크기의 계층 상태가 있는 주의 계층의 덤불 대체이다.

### 자ମ୍ବା 블록

자ମ୍ବା 블록은 두 개의 숫자에 따라 층을 잇는 것입니다.

- `l`바 는 바 를 사용 합니다.`l = 8`, 즉 매 7개의 Mamba 계층 (7개의 Mamba + 1개의 주의 = 8개의 Mamba 계층) 에 대해 1개의 트랜스포머 계층을 의미합니다.
- `e`Jamba는 사용 합니다`e = 2`다른 모든 층이 MoE를 적용한다는 뜻입니다.

블록 내의 계층 순서:

```
M  M  M  M  M  M  M  A    (7 Mamba + 1 Attention)
|  M  |  M  |  M  |  M    (where | marks MoE applied)
```

매 바 블록은 8층입니다. 4 블록 깊이 (32층 전체) 에서 28개의 바와 4개의 주의층을 얻을 수 있습니다. 그 중 16개의 바는 MoE를 사용합니다.

### 왜 1:7 비율이

AI21은 추축을 실행했습니다. 관심과 바의 비율은 어떤 것이 그들의 긴 맥락 평가에서 가장 좋은 매개 변수와 맥락 내 회상력을 제공합니다?

- 너무 많은 관심 (1:1): 품질이 높아지는 반면 기억력과 속도는 떨어집니다.
- 너무 적은 관심 (1:15): 기억력이 좋지만 맥락에서 검색하는 것은 실패합니다.
- 1~7~8점

직관: 트랜스포머 층은 정확한 회수와 상태 추적을 처리합니다.

### 위치 코딩

바 계층은 스스로 위치 인식 (재귀를 통해) 이다. 원래의 바 기반 하이브리드에서의 주의 계층은 RoPE를 사용하지 않았다. SSM 계층은 위치 정보를 제공했다. Jamba 1.5는 더 긴 맥락 일반화를 위해 RoPE를 주의 계층에 추가합니다.

### 메모리 예산

Jamba-1 모양 (32층: 28 Mamba + 4 주의, 숨겨진 4096, 32 주의 머리):

- KV 캐시 (주의 계층만): `2 * 4 * 32 * 128 * 256k * 2 = 8.4 GB`256k BF16에서 4개의 주의층만이 기여합니다.
- SSM 상태: `28 * hidden * state_size`토큰 프리픽스, 하지만 이것은 계층별 고정 크기가 있으며, 염기 길이로 확장되지 않습니다. 전형적인 Mamba 상태는 16 개 특징, 숨겨진 4096:`28 * 4096 * 16 * 2 = 3.7 MB`전체적으로요

순수한 트랜스포머와 비교해 보자면 32층, 같은 숨겨진, 32개의 머리`2 * 32 * 32 * 128 * 256k * 2 = 128 GB`256k BF16에서 KV 캐시의 8배 감소. GQA (GQA) (8) 기준에 비해 2024 모델의 대부분은 사용 (`2 * 32 * 8 * 128 * 256k * 2 = 32 GB`), 16GB의 Jamba의 1:7 하이브리드는 여전히 2배 작습니다.

AI21는 "80GB GPU의 256k 컨텍스트"로 의미하는 바와 같습니다. "전체 MHA 순수한 트랜스포머의 KV 캐시에는 적합하지 않습니다. GQA 기본 라인조차도 무게와 활성화를위한 공간이 없습니다. Jamba의 경우 그렇습니다.

### Mamba-3: 2026년 순수 SSM 기준

Mamba-3 (ICLR 2026, arXiv:2603.15569) 는 순수한 SSM 측면에 대해 세 가지 혁신을 소개합니다.

1. **Exponential-trapezoidal discretization.**Mamba-2에서 Euler 방법의 분해를 더 표현적인 재발로 대체합니다. 핵 재발의 내부의 상태 입력에 적용되는 구전형 작업은 외부 구전으로 아니라 `x_t`- 그래

2. **Complex-valued state update.**이전 Mamba는 복잡한 (S4) 에서 실제 디아곤 (Mamba) 으로 확장된 정체성 (Mamba-2) 으로 상태 행렬을 줄였습니다. Mamba-3는 복잡한 값을 에 해당하는 데이터 의존적 로터리 임베디션에 해당하는 값을 추가합니다. 이것은 이전 실제 값 간소화 비용이 드는 상태 추적 기능을 복원합니다.

3. **Multi-input multi-output (MIMO) projections.**특징별 스칼라 프로젝션 대신 매트릭스 값 프로젝션을 사용하십시오. 디코딩 지연을 증가시키지 않고 모델링 능력과 추론 시간 하드웨어 활용도를 향상시킵니다.

1.5B 매개 변수에서, Mamba-3는 게이트 델타네트보다 평균 하류 정확도를 0.6 점으로 향상시킵니다. MIMO 변종은 총 1.8 점의 이득을 위해 1.2 점 더 추가합니다. 같은 상태 크기에, Mamba-3는 Mamba-2와 절반의 상태를 일치합니다.

Mamba-3는 아직 규모의 생산 하이브리드에서 운송되지 않지만 다음 Jamba 클래스 모델의 SSM 측면에 대한 명백한 후보입니다.

### 하이브리드 를 언제 찾아야 합니까?

하이브리드는 이기는 경우

- 컨텍스트는 순수한 트랜스포머 KV 캐시가 고통스럽게 될 만큼 길다 (64k+).
- 작업은 단거리 구조 (SSM에 적합하다) 와 장거리 회수 (Transformer이 필요) 를 혼합합니다.
- 트랜스포머 KV 캐시만 들어가지 않는 단일 GPU 메모리 예산에 배포하고 싶군요.

하이브리드는 다음 경우 손실을 입습니다.

- 컨텍스트는 짧다 (16k 이하) SSM 오버헤드 낭비가 됩니다. 순수한 트랜스포머는 괜찮습니다.
- 과제는 모든 곳에서 관심 (깊은 논리, 다문서 간반 참조) 을 필요로 한다.
- 여러분은 트리లియన్ 매개 변수 경계 모델로 확장하고 있습니다. 순수 트랜스포머 + MLA + MoE (딥시크-V3 스타일) 는 현재 능력 경주를 이기고 있습니다.

### 경쟁 환경

| Model | Family | Scale | Unique claim |
|-------|--------|------|-------------|
| Mamba-2 | pure SSM | 3B | linear time, constant memory |
| Jamba | hybrid | 52B/12B | 256k on 80GB |
| Jamba 1.5 Large | hybrid | 398B/94B | enterprise-grade long-context |
| Mamba-3 | pure SSM | 1.5B (paper) | state-tracking restored |
| DeepSeek-V3 | pure Transformer + MoE | 671B/37B | frontier capability |

2026년 풍경: 순수 트랜스포머 MoE가 국경을 지배하지만 하이브리드는 256k+ 컨텍스트 틈새를 소유하고 있습니다. Mamba-3의 상태 추적 승리는 다음 세대에 하이브리드 비율을 낮게 (더 SSM, 덜 관심) 밀어낼 수 있습니다.

```figure
swiglu-ffn
```

## 사용 하 고

`code/main.py`하이브리드 아키텍처의 메모리 계산기입니다. SSM-트랜스포머 비율과 숨겨진 크기와 계층 수정을 고려하면 다음과 같이 계산합니다.

- KV 캐시 대상 맥락에서
- SSM 상태 메모리
- 모델 모양의 범위에서 컨텍스트 N에서 전체 메모리

계산기는 다음과 같은 기능을 지원합니다.

- 순수 트랜스포머 기본 라인 (KV 캐시는 N로 증가한다).
- 자ମ୍ବା 스타일의 1~7 하이브리드
- 순수SSM (KV 캐시도 없습니다).

숫자는 출판된 모양의 Jamba-1 및 Jamba-1.5 논문에서 직접적으로 나와 있으며 가상의 변형을 추출합니다.

실제 배치에 대한 통합 고려 사항:

- 대부분의 생산 추론 서버 (vLLM, SGLang) 는 Jamba와 Mamba를 지원합니다. 특정 버전을 확인하십시오.
- 256k 컨텍스트에서 Jamba의 메모리 장점은 동시 요청 처리량에서 나타납니다. 같은 VRAM에 트랜스포머 염기보다 더 많은 Jamba 염기들을 배치합니다.
- Mamba-3는 독립 모델로 아직 생산  연구 전면 1.5B에 배송되지 않습니다.

## 선박

이 교훈은`outputs/skill-hybrid-picker.md`. 작업량 사양 (콘텍스트 길이가 프로파일, 작업 혼합, 메모리 예산) 을 고려하면 순수한 트랜스포머, Jamba 스타일의 하이브리드, 순수한 SSM 사이에 정해져 있는 메모리와 품질의 타협에 대해 명시적으로 논의를 할 수 있도록 권고합니다.

## 운동

1. 달아`code/main.py`KV 캐시를 256k 컨텍스트에서 계산하기 위해 32층 순수한 트랜스포머 (숨긴 4096, 32 헤드) 및 같은 모양의 Jamba-1 하이브리드. AI21 종이 주장하는 ~ 8x 메모리 감소를 확인합니다.

2. 계산기를 수정하여 1:3 하이브리드 (4 Mamba: 1 Attention) 와 1:15 하이브리드 (14 Mamba: 1 Attention) 모델로 설정합니다. KV 캐시와 비율을 표시합니다. KV 캐시는 SSM 상태 메모리에 어떤 비율로 해당합니까?

3. 자ମ୍ବା 논문의 3부 (arXiv:2403.19887) 를 읽어 보십시오. 자ମ୍ବା-2가 더 빠른 반면, AI21는 왜 자ମ୍ବା-2보다 자ମ୍ବା-1를 사용하는지 설명하세요.

4. Jamba 1.5 Large에서 MoE-every-other-layer의 매개 변수를 계산하십시오. (총 398B, 94B 활성). DeepSeek-V3 (37B/671B) 과 활성 비율을 비교하고, Jamba의 아키텍처가 활성 비율을 더 높게 밀어내는 이유를 설명하십시오.

5. Mamba-3 논문의 3부 (arXiv:2603.15569) 를 읽어 보십시오. 복잡한 값 상태 업데이트가 데이터 의존적 로터리 임베디션과 동등한 이유를 세 문장으로 설명하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| State space model (SSM) | "Recurrence with a fixed state" | A layer with a learned recurrence `h_t = A h_{t-1} + B x_t`; constant memory per token |
| Selective SSM | "Mamba's trick" | Data-dependent A, B, C parameters that give the model gating-like selectivity at linear time |
| Attention-to-Mamba ratio | "How many attention layers" | In Jamba, `l = 8` means 1 attention layer per 7 Mamba layers |
| Jamba block | "The 8-layer group" | One attention + seven Mamba + MoE on alternate positions |
| SSM state | "The hidden buffer" | Fixed-size per-layer state that replaces the KV cache for Mamba layers |
| 256k context | "Jamba's flagship number" | The sequence length Jamba-1 fits on a single 80GB GPU; pure Transformer cannot at that size |
| Mamba-3 | "2026 pure SSM" | Current-best pure-SSM architecture with complex state + MIMO; the baseline hybrids rebuild around |
| MIMO | "Multi-input multi-output" | Mamba-3 innovation using matrix-valued projections instead of scalar per-feature |
| Exponential-trapezoidal discretization | "Mamba-3's recurrence" | More expressive recurrence that subsumes Mamba-2's Euler-method discretization |
| Hybrid architecture | "Mix attention and SSM" | Any model that interleaves Transformer and SSM layers; Jamba is the production archetype |

## 더 많은 읽기

- [Lieber et al. — Jamba: A Hybrid Transformer-Mamba Language Model (arXiv:2403.19887)](https://arxiv.org/abs/2403.19887) 원래의 자ମ୍ବା 종이, 비율 추락, 256k 컨텍스트 주장
- [AI21 — Jamba 1.5: Hybrid Transformer-Mamba at Scale (arXiv:2408.12570)](https://arxiv.org/abs/2408.12570) 확장된 가족, 398B/94B 및 12B/52B 공개
- [Gu, Dao — Mamba: Linear-Time Sequence Modeling with Selective State Spaces (arXiv:2312.00752)](https://arxiv.org/abs/2312.00752) 선택적 SSM 종이 Jamba를 기반으로
- [Dao, Gu — Mamba-2 (arXiv:2405.21060)](https://arxiv.org/abs/2405.21060) 단순화된 구조화된 국가 공간 후속
- [Lahoti et al. — Mamba-3 (arXiv:2603.15569, ICLR 2026)](https://arxiv.org/abs/2603.15569) 복잡한 가치 상태, MIMO, 2026 순수 SSM 국경
- [Gu et al. — Efficiently Modeling Long Sequences with Structured State Spaces (arXiv:2111.00396)](https://arxiv.org/abs/2111.00396) S4 논문, LLM의 SSM 가문의 출발점
