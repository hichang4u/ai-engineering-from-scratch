# 네이티브 스파스 주의 (DeepSeek NSA)

> 64k 토큰에서는 주의가 70~80%의 디코딩 지연을 소비합니다. 모든 오픈 모델 실험실이 그것을 고칠 계획을 가지고 있습니다. 딥시크의 NSA (ACL 2025 최고의 논문) 은 붙어있는 것: 3개의 병렬 주의 지부  압축 된 거칠고 곡선 토큰, 선택적으로 유지된 미세한 곡선 토큰, 그리고 로컬 컨텍스트를 위한 슬라이딩 창  학습된 게이트를 통해 결합. 하드웨어 (핵기 친화적) 에 맞춘, 네이티브 트레이닝 (프레트레이닝에서 작동하며 추론에서 지 않고) 이며, 64k 디코드에 있어 전체 주의 품질을 맞추거나 제치고 있는 동시에 플래시 애트런션보다 더 빠르게 실행된다. 이 교훈은 삼 가지 가지의 끝에서 끝으로 구성하고 왜 희소성이 끝에서 끝으로 구별되는지 보여줍니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 12 (KV cache, flash-attention), Phase 7 · 15 (attention variants), Phase 10 · 16 (differential attention)
**Time:** ~60 minutes

## 학습 목표

- NSA의 세 가지 주의 부문을 설명하고 각각의 점령을 설명해 주세요.
- 왜 NSA가 "자연적으로 훈련 가능한"지 설명해 주세요. 이전에는 소소한 주의가 가능한 방법은 추론만이었죠.
- 압축 블록 크기와 선택 상위-k의 함수로서 NSA의 전체 관심과 64k 맥락에서 주의 계산 절약을 계산하십시오.
- stdlib 파이썬에서 짧은 합성 순서에서 세 가지 가지 조합을 구현하고 게팅 중력의 동작을 확인합니다.

## 문제

전체 주의를 기울이는 순서 길이가 N 비용 `O(N^2)`시간과`O(N)`64k 토큰에서 계산 및 메모리 대역폭 숫자는 재앙적입니다. NSA 논문에서 측정된 이론적 추정: 관심은 64k에서 전체 디코딩 지연량의 70-80%를 차지합니다. 모든 하류  TTFT, 토큰/초, 백만 토큰 당 비용은 주의 비용에 의해 지배됩니다.

소소한 관심은 명백한 답입니다. 이전 시도는 두 개의 덩어리로 나뉘어 있습니다. 고정 패턴 소소한성 (스라이딩 창, 단계, 블록 로컬) 은 정보를 버리는 것과 장거리 회수 작업에 실패합니다. 인퍼런스 타임 스파르시티 (KV 캐시 절단, H2O, StreamingLLM) 는 밀집한 관심에 미리 훈련된 모델에 적용되며 모델은 결코 희귀 패턴을 통해 정보를 노트하도록 요청되지 않았기 때문에 잠재적 인 가속화의 일부만을 복구합니다.

네이티브 스파스 주의 (Yuan et al., DeepSeek + PKU + UW, ACL 2025 최고의 논문, arXiv:2502.11089) 는 둘 다 수행합니다. 모델은 사전 훈련 중에 배우며, 실제로 추론 시 계산 절약을 제공하는 커널-동렬 알고리즘으로 구현됩니다. 2 년 후, NSA 또는 직계 후손은 모든 국경 긴 맥락 모델에서 기본 관심입니다.

## 개념

### 3개의 병렬 지형

각 질의에 대해 NSA는 KV 캐시의 세 가지 다른 시각에 대해 세 번 주의를 기울인다.

1. **Compressed branch.**토큰은 크기의 블록으로 그룹화됩니다`l`각 블록은 작은 학습된 MLP를 통해 하나의 요약 토큰으로 압축됩니다. 질의는 이러한 압축 토큰을 통해 전체 순서의 대략적인 견해를 얻습니다.

2. **Selected branch.**압축된 분자로부터의 주의점 점수를 사용하여 현재 쿼리에 가장 관련 있는 상위 k 블록을 식별합니다. 그 블록의 미세한 곡물 (무 압축된) 토큰이 읽혀지고 쿼리는 모두에 참여합니다. 선택의 라우팅 신호로 압축된 분자 주의를 생각하십시오.

3. **Sliding-window branch.**질문에는 가장 최근의 질문들이 있습니다.`W`로컬 컨텍스트에 대한 토큰 (일반적으로 512) 이 분기에서는 다른 두 가지가 놓칠 수 있는 구조가 무거운 단거리 패턴 (합성, 로컬 코어퍼런스) 을 캡처합니다.

세 가지 가지 분포 출력은 학습된 위치별 게이트를 통해 결합됩니다.

```math
\text{out} = g_{\text{cmp}} \cdot \text{out}_{\text{cmp}} + g_{\text{sel}} \cdot \text{out}_{\text{sel}} + g_{\text{win}} \cdot \text{out}_{\text{win}}
```

`g_cmp, g_sel, g_win`질문에서 작은 MLP에서 게이트 중량을 나타냅니다. 그들은 1 로 합할 필요가 없습니다. 그들은 독립적으로 가지 중량을 할 수 있습니다.

### 왜 이것이 "자연적으로 훈련될 수 있는 것"이라고 할 수 있는 이유

선택 단계 (위-k 블록) 은 단위적입니다. 단위 작업은 경진 흐름을 깨고 있습니다. 이전 희소주의 작업은 선택 (제한 훈련) 을 통해 백프록을 건너뛰거나 추론에서 실제 희소성을 제공하지 않는 연속적인 완화 방식을 사용했습니다.

NSA는 이것을 회피합니다. 압축된 분포의 관심은 전체 염기서열에 대한 분화 가능한 거칠고 초자료의 관심입니다. 위 k 작업은 압축된 지부의 최고 주의 점수를 다시 사용하여 어떤 미세한 곡물 블록을 로드해야 하는지 선택합니다. 그라디엔트는 압축분자 점수를 통해 흐른다 (이 압축 출력과 선택 논리 모두에 영향을 미칩니다) 그리고 최종 출력에 선택된 블록의 기여도 또한 차별화됩니다. 차별화되지 않는`top_k`이 작업은 앞으로 계산 그래프에서 작동하지 않습니다. 그것은 단지 메모리에서 어떤 블록이 로드되는지를 제어합니다.

이 때문에 NSA는 사전 훈련에서 끝으로 사용될 수 있습니다. 모델은 세 가지 가지 분자를 통해 정보를 공동으로 노트하는 것을 배우며, 결론적으로 실제로 약속된 속도를 제공하는 희귀 패턴을 생성합니다.

### 하드웨어에 맞춘 커널

NSA의 커널은 현대 GPU 메모리 계층을 위해 설계되었습니다. 커널은 GQA 그룹 (외부 루프) 의 질서를 로드하고, 그룹별로 해당 희소 KV 블록을 (inner loop) 를 가져오고, SRAM에 관심을 기울인다. 각 질의 그룹은 동일한 선택된 블록을 볼 수 있기 때문에 (선택은 질의 그룹, 질의 머리) KV 로드는 그룹 전체에 amortized됩니다. 수학적 강도는 높습니다.

논문은 64k 디코드에 대해 FlashAttention보다 9배 더 빠른 Triton 커널을 실행하고, 속속화 비율이 순서 길이를 따라 증가한다고 보고합니다. 앞 및 후진 커널은 모두 제공됩니다.

### 계산 예산

-    `N`순서 길이가 되야 합니다.`l`압축 블록 크기는, `k`상위 k 선택의 수,`w`슬라이딩 창`b`선택된 블록 크기는 (일반적으로 `l`)

- 압축 된 가지: `O(N/l)`질문별 키, 그래서 `O(N * N / l)`전체적으로요
- 선택된 지분: `O(k * b)`질문별 키, 그래서 `O(N * k * b)`- 그래
- 슬라이딩 지부: `O(w)`질문별 키, 그래서 `O(N * w)`- 그래

전체:`O(N * (N/l + k*b + w))`- 그래

`N = 64k, l = 64, k = 16, b = 64, w = 512`: 질문당 비용은`1000 + 1024 + 512 = 2536 keys`- 전면 주의가 필요합니다`64000 keys`25배 계산 감소

`N = 128k, l = 64, k = 16, b = 64, w = 512`: 질문당 비용은`2000 + 1024 + 512 = 3536 keys`- 전면 주의가 필요합니다`128000 keys`36x 감소. 이득은 순서 길이를 따라 증가합니다. 이것이 전체의 핵심입니다.

### 어떻게 비교할 수 있을까요?

| Method | Differentiable | Real inference speedup | Long-range recall |
|--------|---------------|----------------------|-------------------|
| Sliding window only | yes | yes | fails |
| Strided / block-sparse | yes | yes | partial |
| KV pruning (H2O, StreamingLLM) | N/A (inference-time) | yes | partial |
| MoBA (Moonshot) | partial | yes | good |
| NSA | yes (natively) | yes (9x at 64k) | matches full attention |

MoBA (Moonshot, arXiv:2502.13189) 는 동시 발표되었으며, 관심 블록에 MoE 원리를 적용하여 3보다 더 나은 접근 방식을 취합니다. NSA와 MoBA는 2026 년 장기 컨텍스트 사전 훈련에 대해 알아야 할 두 건축물입니다.

```figure
sliding-window-attention
```

## 건설 해

`code/main.py`단편 합성 순서로 세 가지 가지를 구현하고,

- 압축 MLP (단순한 평균 풀 기본 라인은 교육적 명확성을 위해 사용됩니다; 실제 NSA는 학습된 MLP를 사용합니다).
- 압축분자 점수를 기준으로 가장 높은 k 블록 선택
- 마지막에 슬라이딩 창의 주의를 기울여`w`토큰
- - 장한 조합
- 전적 주의를 비교하는 계산 계산 인쇄물

### 단계 1: 토큰을 블록으로 압축

```python
def compress(K, l):
    n = len(K)
    n_blocks = (n + l - 1) // l
    out = []
    for b in range(n_blocks):
        start, end = b * l, min((b + 1) * l, n)
        block = K[start:end]
        summary = [sum(row[d] for row in block) / len(block) for d in range(len(K[0]))]
        out.append(summary)
    return out
```

### 단계 2: 압축분자 주의

압축된 키에 대한 쿼리의 소프트맥스 주의를 실행하십시오. 압축 된 가지 점수는 상위 k 선택의 신호로 두 배로됩니다.

### 단계 3: 상위 k 블록 선택

  의 지수를 선택`k`가장 높은 점수를 받은 압축 블록. 그 블록에서 원래의 압축되지 않은 토큰을 로드하고, 그 위에 주의를 기울여 보세요.

### 단계 4: 슬라이딩 창 주의

마지막을 가져`w`토큰을 가지고, 표준적인 주의를 기울여

### 단계 5: 게이트 + 조합

질의의 작은 MLP는 세 개의 게이트 무게를 생성합니다. 최종 출력은 세 가지 가지 분자 출력 중량 합입니다.

### 단계 6: 계산 계산

각 분과에 대한 각 검색에 참여한 키의 수와 전체를 인쇄합니다.`N`1024 톤의 합성 칩에`l = 32, k = 4, w = 128`NSA가 보고`32 + 128 + 128 = 288`전체 관심에 대한 1024에 비해  3.5배 더 적은 키가 있습니다.

## 사용 하 고

NSA는 DeepSeek의 자체 장기적인 사전 훈련 파이프라인에서 배포하고 있습니다. 2026년 4월 기준으로 공중 추론 스택에 통합 상태:

- **DeepSeek internal**: 네이티브, 출판 된 무게는 NSA 또는 그 후계자 DSA (Deepseek Sparse Attention) 를 사용합니다.
- **vLLM**: DeepSeek-V3.x 무게를 개발하는 실험 NSA 지원
- **SGLang**: NSA 기준이 발표되었으며, 생산 경로는 vLLM를 따라가게 됩니다.
- **llama.cpp / CPU**: 지원되지 않습니다. 커널 분해의 오버하드는 CPU 처리량에서 가치가 없습니다.

NSA를 언제 연락해야 할까요?

- 심각한 컴퓨팅 예산으로 64k 이상의 컨텍스트를 대상으로 사전 교육 또는 지속적인 교육 실행.
- DeepSeek의 자체 장기 시점의 추론. 무게는 NSA가 내포한 것입니다.

언제 하지 않는지

- 기존의 밀집한 주의력 전 훈련 모델에 적용해
- 16만원 이하의 상황. 3개 부문 대가로 저축이 지배적이다.
- 대전 1 대화, 지연 민감한 디코딩 혜택, 하지만 긴 맥락에서만

## 선박

이 교훈은`outputs/skill-nsa-integrator.md`. 장기간 컨텍스트 사전 훈련 실행의 사양을 고려하면 NSA 통합 계획을 생성합니다. 압축 블록 크기와 상위 k, 슬라이딩 윈도우, 게이트 MLP 너비, 커널 선택 및 구조 변경을 정당화 할 특정 장기간 컨텍스트 평가.

## 운동

1. 달아`code/main.py`1024 로켓의 합성 기기`(l, k, w)`세 개의 미리 설정 및 인쇄 계산 계산을 통해 가장 낮은 키 수를 달성하는 미리 설정을 식별하고, 바늘-이-하이 스택 테스트에서 95%의 전체 주의를 유지합니다.

2. 중간 풀 압축기를 학습된 작은 MLP (2층, 숨겨진 32) 로 교체하십시오. 신호가 블록의 평균이 되는 합성 작업에 훈련하십시오. 보관된 데이터에 대한 평균 풀 기본 라인에 대한 혼란 격차를 측정하십시오.

3. 게이트 MLP를 구현하십시오. 게이트는 입력으로 질의를 받아 세 개의 스칼러를 내보내십시오. 게이트가 합리적으로 행동한다는 것을 보여주십시오. 무작위 질의에 거의 균일한 중량, 질의가 멀리 떨어진 블록에 도달하면 선택한 지부에 무거운 중량.

4. NSA가 지원하는 70B 모델의 KV 캐시 메모리 예산을 128k 컨텍스트에서 계산하십시오. KV 헤드 는 8, 헤드 덤 128, BF16. 전체 관심과 MLA (단계 10 · 14은 MLA의 숫자를 보여주었습니다) 를 비교하십시오. NSA의 미세 곡물 분기 KV 캐시가 전체 관심과 동등한 순서 길이를 식별하십시오.

5. NSA 논문의 4부 (arXiv:2502.11089) 를 읽어보고 압축 된 지부의 주의 점수가 별도의 라우팅 점수를 계산하기보다는 상위 k 선택에 재사용되는 이유를 세 문장으로 설명하십시오. 그 답은 gradient flow에 연결합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Compressed branch | "Coarse view" | Attention over block-averaged keys that provides global context in $O(N/l)$ keys per query |
| Selected branch | "Top-k blocks" | Fine-grained attention over the `k` blocks with highest compressed-branch scores |
| Sliding window | "Local context" | Attention over the last `W` tokens for short-range patterns |
| Native trainability | "Pre-train with the sparsity on" | The sparsity pattern is learned during pre-training, not bolted on at inference |
| Compression block size l | "Group size for coarse view" | How many tokens get merged into one summary; 32-64 typical |
| Top-k | "Blocks to keep" | Number of compressed blocks whose uncompressed tokens get read; 16 typical |
| Sliding window W | "Local attention radius" | Typically 512; shorter hurts local coherence, longer wastes compute |
| Branch gate | "How to mix the three" | Per-position MLP output that weights the three branches' contributions |
| Hardware alignment | "Kernel-friendly sparsity" | Sparse pattern chosen so that the actual GPU kernel achieves the theoretical speedup |
| DSA | "NSA's successor" | Deepseek Sparse Attention, the architecture that followed NSA in DeepSeek's lineage |

## 더 많은 읽기

- [Yuan et al. — Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention (arXiv:2502.11089, ACL 2025 Best Paper)](https://arxiv.org/abs/2502.11089) 신문
- [DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) NSA의 건축 가족 목표
- [Moonshot AI — MoBA: Mixture of Block Attention for Long-Context LLMs (arXiv:2502.13189)](https://arxiv.org/abs/2502.13189) 동시 작업, 블록에 대한 MoE 스타일의 관심
- [Beltagy et al. — Longformer: The Long-Document Transformer (arXiv:2004.05150)](https://arxiv.org/abs/2004.05150) 슬라이딩 창의 기원은
- [Xiao et al. — StreamingLLM: Efficient Streaming Language Models with Attention Sinks (arXiv:2309.17453)](https://arxiv.org/abs/2309.17453) 추론 시간 간소성 기본 기준 NSA는
- [Dao et al. — FlashAttention-2 (arXiv:2307.08691)](https://arxiv.org/abs/2307.08691) 전체 주의력 기본 라인 NSA 커널은 64k에서 뛰었습니다
