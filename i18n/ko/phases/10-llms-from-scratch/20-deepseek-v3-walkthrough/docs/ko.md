# 딥시크 V3 아키텍처 워커스투스

> 10단계 · 수업 14은 개방형 모델이 회전하는 6개의 건축 을 이름 붙였습니다. 딥시크-V3 (2024년 12월, 671B 매개 변수 총, 37B 활성) 는 여섯 개 모두를 돌리고 4개를 추가합니다. 멀티 헤드 라텐트 주의, 보조 손실없는 로드 배정, 멀티 토큰 예측, 두 개의 파이프 훈련. 이 수업은 DeepSeek-V3의 아키텍처를 위에서 아래로 읽고 출판된 구성에서 모든 매개 변수를 추출합니다. 마지막에 671B/37B 비율이 왜 올바른 대상이 되었는지 설명할 수 있고, MLA + MoE가 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한자 한

**Type:** Learn
**Languages:** Python (stdlib, parameter calculator)
**Prerequisites:** Phase 10 · 14 (open-model walkthroughs), Phase 10 · 17 (NSA), Phase 10 · 18 (MTP), Phase 10 · 19 (DualPipe)
**Time:** ~75 minutes

## 학습 목표

- DeepSeek-V3 구성 위부터 아래까지를 읽어보고 각 필드를 GPT-2 버튼 6개와 4개의 DeepSeek 특화된 추가로 설명합니다.
- 전체 매개 변수 (671B), 활성 매개 변수 (37B) 및 각각의 구성 요소를 추출한다.
- 128k 컨텍스트에서 MLA의 KV 캐시 발자국을 계산하고 GQA와 동일한 활성-파람 밀집 모델이 지불하는 것과 비교하십시오.
- 네 가지 DeepSeek 특수한 혁신 (MLA, MTP, 보조 손실 없는 라우팅, DualPipe) 을 적어서 각 구조/훈련 스택의 어떤 부분을 목표로 하는지를 적어 주십시오.

## 문제

딥시크-V3는 라마 가족과 크게 다른 건축물인 최초의 국경 개방형 모델입니다. Llama 3 405B는 "GPT-2 6개의 버튼이 돌고 있다". DeepSeek-V3는 GPT-2입니다. 6개의 버튼이 더 4개로 들어있습니다. Llama 3 구성을 읽는 것은 DeepSeek 구성을 읽는 데 따뜻하게 해줍니다. 하지만 깊은 구조  주의 블록의 모양, 라우팅 논리, 훈련 시간 목표 은 별도의 걸음걸이 필요하기만큼 다릅니다.

학습의 보상은: DeepSeek-V3의 오픈 웨이트 출시는 오픈 모델에서 "프로미터 능력"이라는 의미를 바꾸었습니다. 건축은 많은 2026 교육 경기가 복사하고 있는 청사진입니다. 이를 이해하는 것은 국경 LLM 교육이나 추론에 관한 모든 역할에 대한 테이블 스테이크입니다.

## 개념

### 변함없는 핵, 다시

DeepSeek-V3는 여전히 자동 퇴행성입니다. 여전히 디코더 블록을 쌓습니다. 각 블록은 여전히 관심과 MLP와 두 개의 RMSNorms를 가지고 있습니다. MLP에서 여전히 SwiGLU를 사용합니다. 여전히 RoPE를 사용합니다. 사전 표준. 무게 묶인 임베디션. 모든 Llama 또는 Mistral와 동일한 기본 라인입니다.

### : GQA 대신 MLA

10 · 14 단계부터는 GQA가 KV 캐시를 Q 헤드 그룹에 K와 V를 공유함으로써 줄이는 것을 알고 있습니다.`kv_lora_rank`KV 캐시는 일반적으로 1 층당 512 개의 플롯을 저장하고, 8 x 128 = 1024 개의 플롯을 저장하지 않습니다.

128k 컨텍스트에서, MLA (공유된 잠자리) 와 함께 DeepSeek-V3`c^{KV}`각 계층에 대한 토큰; K와 V는 모두 다음 매뮬에 흡수될 수 있는 상승 투구를 통해 이 잠복된에서 유래된다):

```
kv_cache = num_layers * kv_lora_rank * max_seq_len * bytes_per_element
         = 61 * 512 * 131072 * 2
         = 7.6 GB
```

가상의 GQA 기본 라인 (Llama 3 70B 모양, 8 KV 헤드, 머신  128) 은 다음과 같이 지불 할 것입니다.

```
kv_cache = 2 * 61 * 8 * 128 * 131072 * 2
         = 30.5 GB
```

MLA는 Llama-3-70B형 GQA 캐시보다 4배 작습니다. 128k 컨텍스트에서.

타협: MLA는 각 주의 계산에 대한 압축 단계 (개인당) 를 추가합니다. 저장된 대역폭에 비해 추가 계산은 작습니다. 긴 맥락 추론에 대한 순 승률.

### 라우팅: 보조 손실 없는 로드 배산

MoE 라우터는 각 토큰을 처리하는 최고-k 전문가들을 결정한다. 순수한 라우터는 몇 명의 전문가에게 너무 많은 작업을 집중시키고 다른 사람들을 비활성하게 만듭니다. 표준 수정: 부하 불균형을 처벌하는 보조 손실 용어를 추가합니다. 이것은 효과가 있지만 주요 작업 성능을 약간 저하시킨다.

딥시크-V3는 보조 손실 없는 시스템을 도입합니다. 전문가별 편향 용어는 라우터 로그티에 추가되며, 간단한 규칙으로 훈련 중에 조정됩니다.`e`과부하, 감소`bias_e`과잉하급이 있는 경우 더 늘려라. 추가 손실 기간은 없습니다. 훈련은 깨끗해 유지됩니다. 전문가의 부담은 균형 잡힌 유지됩니다.

주요 손실에 미치는 영향: 측정할 수 없는 것. MoE 아키텍처에 미치는 영향: 더 깨끗하고, 보조 손실 하이퍼파라미터가 tune 되지 않습니다.

### MTP: 더 밀집한 훈련 + 무료 드래프트

10 · 18 단계에서 DeepSeek-V3는 도큰의 두 위치를 예측하는 D=1 MTP 모듈을 추가하고 있음을 알 수 있습니다. 추론에서 훈련된 모듈은 80%+ 수용으로 추측적 디코딩 드래프트로 재기용됩니다. 훈련에서, 숨겨진 각 상태는 D+1 = 2 목표에서 감독되며, 더 밀도가 높은 신호를 제공합니다.

매개 변수는: 671B 주류 위에 14B, 전체 비용은 2.1%

### 훈련: 듀얼파이프

2차 단계에서 DualPipe는 앞과 뒤로 겹치는 쌍방향 파이프라인으로, 횡단 노드 전개 통신이 이루어져 있습니다. DeepSeek-V3의 2,048-H800 규모에서, 1F1B가 파이프라인 거품으로 잃어버린 약 245k GPU 시간을 복구합니다.

### 필드별로 구성

여기 DeepSeek-V3 구성 (편화):

```
hidden_size: 7168
intermediate_size: 18432   (dense MLP hidden size, used on first few layers)
moe_intermediate_size: 2048 (expert MLP hidden size)
num_hidden_layers: 61
first_k_dense_layers: 3    (first 3 layers use dense MLP)
num_attention_heads: 128
num_key_value_heads: 128   (formally equal to num_heads under MLA, but
                           the real compression is in kv_lora_rank)
kv_lora_rank: 512          (MLA latent dimension)
num_experts: 256            (MoE expert count per block)
num_experts_per_tok: 8      (top-8 routing)
shared_experts: 1           (always-on shared expert per block)
max_position_embeddings: 163840
rope_theta: 10000.0
vocab_size: 129280
mtp_module: 1               (1 MTP module at depth 1)
```

분석해봐

- `hidden_size=7168`: 임베디션 크기가
- `num_hidden_layers=61`: 전체 블록 깊이
- `first_k_dense_layers=3`첫 3 블록은 18432 크기의 밀집 MLP를 사용한다. 나머지 58 블록은 MoE를 사용한다.
- `num_attention_heads=128`: 128개의 질문 표
- `kv_lora_rank=512`: K와 V는 이 잠복한 차원으로 압축되고 각 머리에 압축된다.
- `num_experts=256, num_experts_per_tok=8`: 각 MOE 블록에는 256명의 전문가들이 있으며,
- `shared_experts=1`256명의 전문가들 외에도 항상 있는 전문가 1명이 모든 토큰에 기여합니다.
- `moe_intermediate_size=2048`각 전문가의 MLP 은밀한 크기는 밀집 MLP보다 작습니다. 왜냐하면 256개의 MLP가 있기 때문입니다.

### 매개 변수 회계

전체 계산은`code/main.py`제목:

- 삽입: `vocab * hidden = 129280 * 7168 = ~0.93B`- 그래
- 첫 번째 3 개의 밀집 블록: MLA (~144M 한 블록) + 밀집 MLP (~260M 한 블록) + 표준의 관심. 약 1.2B 총.
- 58개의 MOE 블록: MLA (~144M) + 256명의 전문가들 각각 (30M) + 1명의 공유 전문가 (30M) + 표준. 전체적으로 모든 전문가들을 포함한 블록당 ~7.95B. 58개의 MOE 블록에 대한 총 461B.
- MTP 모듈: 14B

총: ~476B의 핵심 아키텍처 + 14B의 MTP + 명확하게 발표된 671B의 숫자는 추가 구조적 매개 변수를 (bias tensors, 전문가 특수한 구성 요소, 공유 전문가 스케일링, 등) 포함합니다. 계산기에서 재생하는 숫자는 발표된 의 3-5% 내에 있습니다.

전향에 대한 활성 매개 변수:

- 주의: 각 층*61 = 8.8B (모든 층의 불) 에 대해 144M
- MLP 활성: 첫 3층 밀도가 (3 * 260M = 780M), 58 MoE 계층 각각 활성: 8개의 라우팅 + 1개의 공유 + 라우팅 오버헤드. 각 계층 활성 MLP: ~260M. 총: 3 * 260M + 58 * 260M = ~15.9B.
- 임베디션 + 표준: 1.2B.
- 전체 활동: 대략 26B 코어 + 14B MTP (훈련된 하지만 항상 추론에서 실행되지 않는) ≈ 37B.

### 671B / 37B 비율

18x 소소한 비율 (활성 파라미는 전체의 5.5%입니다). DeepSeek-V3는 개방형 중량을 배포한 가장 소소한 국경 MoE 모델입니다. 13/47 (28%) 비율로 혼합 8x7B는 훨씬 밀도가 높습니다. 17B/400B (4.25%) 비율로 Llama 4 Maverick는 비교할 수 있습니다. DeepSeek 베팅: 국경 규모에서, 더 낮은 활성화 비율을 가진 전문가들은 활성-FLOP당 더 나은 품질을 생산합니다.

### 딥시크-V3가 앉아 있는 곳

| Model | Total | Active | Ratio | Attention | Novel ideas |
|-------|------|-------|-------|-----------|-------------|
| Llama 3 70B | 70B | 70B | 100% | GQA 64/8 | — |
| Llama 4 Maverick | 400B | 17B | 4.25% | GQA | — |
| Mixtral 8x22B | 141B | 39B | 27% | GQA | — |
| DeepSeek V3 | 671B | 37B | 5.5% | MLA 512 | MLA + MTP + aux-free + DualPipe |
| Qwen 2.5 72B | 72B | 72B | 100% | GQA 64/8 | YaRN extension |

### 후속: R1, V4

딥시크-R1 (2025) 는 V3 척추에 대한 추론 훈련 실행이다. R1는 동일한 아키텍처를 사용합니다. 변경된 것은 훈련 후의 레시피 (확인 가능한 작업에 대한 대규모 RL) 이며, 훈련 이전의 아키텍처가 아닙니다.

딥시크-V4 (내용이 가능하다면) 는 MLA + MoE + MTP를 유지하고 NSA의 후계자인 DSA (DeepSeek Sparse Attention) 를 추가할 것으로 예상된다.

```figure
moe-routing
```

## 사용 하 고

`code/main.py`DeepSeek-V3의 모양에 특화된 매개 변수 계산기입니다. 실행하여 출력을 논문의 숫자와 비교하고 가상의 변종에 사용하십시오 (256 전문가 vs. 512, 톱-8 vs. 톱-16, MLA 순위 512 vs. 1024).

무엇을 살펴볼 수 있을까요?

- 전체 매개 변수 수 vs 발표 671B.
- 활성 파라미터 수를 발표한 37B에 반한다.
- KV 캐시 128k 컨텍스트  MLA와 GQA 비교
- 매층별 분해로 매개 변수 예산이 실제로 어디로 가는지 확인합니다.

## 선박

이 교훈은`outputs/skill-deepseek-v3-reader.md`. DeepSeek 가족 모델 (V3, R1 또는 미래의 변종) 을 고려하면 구성 요소에 따라 구성 요소의 각 분야를 이름 붙이고 구성 요소에 따라 매개 변수 수를 추출하고 모델이 사용하는 네 가지 DeepSeek 특정 혁신 중 어느 것을 식별하는 구성 요소별 아키텍처 판정을 생성합니다.

## 운동

1. 달아`code/main.py`계산기의 전체 매개 변수 추정치를 발표된 671B와 비교하고 델타의 기원을 확인합니다. 종이의 2부에서는 전체적인 세부사항이 있습니다.

2. MLA 순위 256 를 사용 하 고 구성 변경 512. 결과 KV 캐시 크기를 128k 맥락에서 계산. 그것은 어떤 비율 감소를 구입, 그리고 어떤 비용으로 헤드 표현력?

3. DeepSeek-V3 (256명의 전문가, 8위) 의 로팅을 가설적 (512명의 전문가, 8위) 버라이어트에 비교해 보십시오. 전체 매개 변수는 증가하고, 활성 매개 변수는 동일하다. 이론적으로 추가 전문가 능력은 무엇을 구입하고, 추론에 얼마나 비용이 든다?

4. MLA에 대한 DeepSeek-V3 기술 보고서 (arXiv:2412.19437) 의 2.1 섹션을 읽어보십시오. K 및 V 압축 매트릭스를 추론 시간 효율을 위해 다음 매트뮬에 "흡입" 할 수있는 이유를 세 문장으로 설명하십시오.

5. 딥시크 V3는 대부분의 작업에 FP8 훈련을 사용합니다. 671B 무게를 저장하기 위해 FP8와 BF16의 메모리 절약을 계산합니다. 이것은 14.8T 토큰 훈련 예산과 어떻게 교차합니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MLA | "Multi-Head Latent Attention" | Compress K and V into a shared low-rank latent (kv_lora_rank, typically 512), decompress per head on-the-fly; KV cache stores only the latent |
| kv_lora_rank | "MLA compression dim" | The size of the shared latent for K and V; DeepSeek-V3 uses 512 |
| First k dense layers | "Early layers stay dense" | The first few MoE-model layers skip the MoE router and run a dense MLP for stability |
| num_experts_per_tok | "Top-k routing" | How many routed experts fire per token; DeepSeek-V3 uses 8 |
| Shared experts | "Always-on experts" | Experts that process every token regardless of routing; DeepSeek-V3 uses 1 |
| Auxiliary-loss-free routing | "Bias-adjusted load balance" | Per-expert bias terms adjusted during training to keep expert load balanced without adding a loss term |
| MTP module | "Extra prediction head" | Transformer block predicting $t+2$ from $h^{(1)}$ and $E(t+1)$; denser training, free speculative-decoding draft |
| DualPipe | "Bidirectional pipeline" | Training schedule that overlaps forward/backward compute with cross-node all-to-all |
| Active parameter ratio | "Sparsity" | active_params / total_params; DeepSeek-V3 hits 5.5% |
| FP8 training | "8-bit training" | Training storage and many compute ops in FP8; roughly halves memory vs BF16 at a small quality cost |

## 더 많은 읽기

- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) 전체 건축, 교육 및 결과 문서
- [DeepSeek-V3 model card on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V3) 구성 파일 및 배포 메모
- [DeepSeek-V2 paper (arXiv:2405.04434)](https://arxiv.org/abs/2405.04434) MLA를 도입한 전신
- [DeepSeek-R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) V3의 건축에 대한 추론 훈련의 후계자
- [Native Sparse Attention (arXiv:2502.11089)](https://arxiv.org/abs/2502.11089) 딥시크 가족들의 관심의 미래 방향
- [DualPipe repository](https://github.com/deepseek-ai/DualPipe) 교육 일정에 대한 참조
