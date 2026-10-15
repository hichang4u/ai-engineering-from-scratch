# 분산된 사전 작성/독호  NVIDIA 다이노스와 llm-d

> 사전 작성은 컴퓨터로 연결되며 디코딩은 메모리로 연결됩니다. 두 가지를 같은 GPU로 실행하면 하나의 자원을 낭비합니다. 분산은 그들을 분리된 풀로 나뉘어 NIXL (RDMA/InfiniBand 또는 TCP fallback) 를 통해 KV 캐시를 전송합니다. NVIDIA 다이노 (GTC 2025 발표, 1.0 GA) 는 Planner Profiler + SLA Planner 자동 비율-경합 사전충분:SLO를 충족시키기 위해 vLLM/SGLang/TRT-LLM 보다 높습니다. NVIDIA는 이 볼파크에서 매출 증가를 발표합니다  developer.nvidia.com (2025-06) 은 GB200 NVL72 + Dynamo에서 DeepSeek-R1 MoE의 ~6x 향상을 보여줍니다. 그리고 Dynamo 제품 페이지 (developer.nvidia.com, 날짜가 정해지지 않은) 는 GB300 NVL72 + Dynamo vs Hopper에서 최대 50x MoE 매출을 광고합니다. "30x" 숫자는 전체 스택 블랙웰 + 다이노고 + 딥시크-R1 보고서의 커뮤니티 집합입니다. 우리는 정확히 30x를 나타내는 단일 주요 소스를 찾지 못했습니다. 그래서 방향적 주장으로 간주하십시오. llm-d (Red Hat + AWS) 는 Kubernetes-이족: 독립된 서비스로서 각 역할 HPA를 위한 사전填充/독독 / 라우터. llm-d 0.5는 계층적 KV 하하우드, 캐시 인식 LoRA 라우팅, UCCL 네트워크, 스케일에서 0을 추가합니다. 경제: 여러 고객 공개의 내부 롤업은 30~40%의 절감을 제안합니다$2M-class inference spend (i.e., $600-800K/년) 은 일정한 SLA에서 Dynamo와 분할된 복역에서 전환할 때,$2M→$600-800K 수치는 내부 복합적이며, 한 개의 출판된 사례 연구도 아닙니다.

**Type:** Learn
**Languages:** Python (stdlib, toy disaggregated-vs-colocated simulator)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 17 · 08 (Inference Metrics)
**Time:** ~75 minutes

## 학습 목표

- 전충 및 디코딩이 왜 다른 최적의 GPU 분배를 가지고 있는지 설명하고 콜로케이션 하에서 폐기물을 수치화하십시오.
- 분산된 구조를 도표: 사전 채우기 풀, 디코드 풀, NIXL를 통해 KV 전송, 라우터.
- 분산이 결실을 맺지 않는 상태 (단순한 명령, 단순한 출력) 를 명명하라.
- NVIDIA 다이노 (더음) 과 llm-d (Kubernetes-native) 를 구분하고 각각의 운영 맥락에 맞추어

## 문제

8 H100에서 Llama 3.3 70B를 실행합니다. 혼합 작업 부하 (장전 명령어 + 짧은 출력) 에서 GPU는 디코딩 중에 비동기합니다. 왜냐하면 계산의 대부분은 사전 작성에 사용되었기 때문입니다. 다른 작업 부하 (단전 명령어 + 긴 출력) 에서 반대가 발생합니다. 배치 된 사전 작성 + 디코딩은 두 가지 모두 과잉 공급을 의미합니다.

예산 영향: GPU 시간의 20~40%가 잘못된 자원으로 낭비됩니다. 메모리 연결 디코드를 실행하기 위해 H100 계산기를 구입하거나 H100 HBM 대역폭을 구입하여 컴퓨터 연결 사전 충전을 실행합니다. 둘 다 비용이 많이 든 낭비입니다.

분산은 각 병목에 맞게 크기의 개별 풀에 미리 채워지고 디코딩을 나누고 KV 캐시는 높은 대역폭 상호 연결을 통해 프리필 풀에서 풀을 디코딩합니다.

## 개념

### 왜 bottlenecks가 다르는지

**Prefill** 전력 입력 시키는 모든 입력 시키는 것을 실행합니다. 매트릭스 곱셈이 지배하고, 계산에 제한됩니다. H100 FP8는 ~2000 TFLOPS의 유용한 처리량을 제공합니다.

**Decode** 한 번에 하나의 토큰을 생성하여 모든 반복에서 전체 무게를 읽습니다. 메모리-밴드위드 제한. HBM3는 ~3 TB/s를 제공합니다. 대량 효율은 높은 동시에서만 좋습니다.

두 가지 모두에 최적화된 GPU를 구입합니다. H100는 둘 다 좋지만 양쪽 모두에 동일한 비용이 들습니다. 규모에서, H100 / 컴퓨팅 중량에 대한 사전 채워 풀, H200 / 메모리 중량에 대한 디코드 풀 또는 공격적인 양자화와 함께 필요합니다.

### 건축

```
            ┌──────────────┐
  Request → │    Router    │ ───────────────────────┐
            └──────┬───────┘                        │
                   │                                │
                   ▼ (prompt only)                  │
            ┌──────────────┐    KV cache    ┌───────▼──────┐
            │ Prefill pool │ ─── NIXL ────► │ Decode pool  │
            │  (compute)   │                │  (memory)    │
            └──────────────┘                └──────┬───────┘
                                                   │ tokens
                                                   ▼
                                                 Client
```

NIXL는 NVIDIA의 노드 간 전송이다. 사용 가능한 경우 RDMA/InfiniBand를 사용하지만, 그렇지 않으면 TCP 하락을 한다. 전송 지연은 실제입니다. 일반적으로 70B FP8에서 4K 토큰 프롬프트의 KV 캐시에서 20-80 ms입니다. 이 때문에 짧은 프롬프트는 분할을 정당화하지 않습니다. 전송 세금은 저축을 초과합니다.

### 다이노마 vs 엠-디

**NVIDIA Dynamo**(GTC 2025 발표, 1.0 GA):
- VLLM, SGLang, TRT-LLM 위에 오케스트레이터로 앉아 있습니다.
- 플래너 프로파일러는 작업량 측정, SLA 플래너는 자동으로 prefill:decode ratios를 구성합니다.
-  코어, 파이썬 확장성
- 투입량 증가: NVIDIA는 GB200 NVL72 + Dynamo에서 DeepSeek-R1 MoE를 6x로 보고하고 중순 체제 (developer.nvidia.com, 2025-06); 전체 블랙웰 + 다이노고 + DeepSeek-R1 스택에 대한 커뮤니티 보고서 " 최대 30x"가 단일 주요 소스가 부족하므로 방향성으로 취급되어야합니다.
- GB300 NVL72 + Dynamo: Dynamo 제품 페이지 (developer.nvidia.com, undated) 에 따라 MoE 처리량과 Hopper의 최대 50배

**llm-d**(Red Hat + AWS, Kubernetes-이스):
- 독립적인 Kubernetes 서비스로 미리 작성/독호화/ 라우터
- 줄 깊이 (프리플) / KV 활용 (독호) 신호를 가진 역할당 HPA.
- `topologyConstraint packDomain: rack`패크는 높은 대역폭 KV 전송을 위해 동일한 래크에 미리 채워+독호 클릭을 합니다.
- llm-d 0.5 (2026): 계층 KV 탈하드, 캐시 인식 LoRA 라우팅, UCCL 네트워크, 스케일에서 0

관리되는 스택 위에 오케스트레이터를 원한다면 다이노스를 사용하세요. 쿠버네티스 원시민들이 CNCF 생태계에 헌신하고 싶다면 llm-d를 사용하세요.

### 경제

내부 복합 (언도 발표된 사례 연구  대도 순서 안크):

- 일년에 2백만 달러의 추론 지출은 콜로케이트 서비스로 이루어집니다.
- 다이노스와 함께 분산된 것으로 전환
- 동일한 요청량, 동일한 P99 지연 SLA.
- 보고된 저축: $600K–$800K/년 (3040% 감소)
- 새로운 하드웨어도 없지

우리는 이 수를 단일 인용 가능한 사례 연구보다는 여러 고객 공개에서 합성합니다. 가장 가까운 발표된 데이터 포인트는 Baseten의 2x 더 빠른 TTFT / Dynamo KV 라우팅 (baseten.co, 2025-10) 과 61% 더 높은 처리량입니다. 그리고 VAST + CoreWeave의 예측은 4060% KV 히트률 (vastdata.com, 2025-12) 에서 60130% 더 많은 토큰 / $입니다. 저축은 각 수영장을 적절한 크기로 만드는 것에서 비롯됩니다. 전충중고 작업 (RAG 8K+ 전두환) 은 균형 잡힌 작업보다 더 많은 혜택을 누립니다.

### 나열을 하지 않는 경우

- 예제 < 512 토큰 및 출력 < 200 토큰: 이적 세금이 이익에 지배한다.
- 작은 클러스터 (< 4 GPU): 충분한 풀 다양성이 없습니다.
- 팀은 각 역할에 따라 확장된 두 개의 GPU 풀을 운영할 수 없습니다. 다이노가 도움이 되지만 소소한 것은 아닙니다.
- RDMA의 실재가 없습니다. TCP 전송 세금은 더 무거운 것입니다.

### 라우터는 17 · 11 단계와 통합됩니다.

분산 라우터는 KV 캐시 인식 (Phase 17 · 11) 이다. 요청은 전함 을 보유한 디코드 풀에 착륙합니다. 일치하지 않으면 전함 → 디코드 흐른다. 히트 속도 및 분산 화합  캐시 인식 라우터는 새로운 전함이 필요 여부를 결정합니다.

### 블랙웰의 MOE는 실제 숫자가 있는 곳입니다

GB300 NVL72 + Dynamo는 Hopper 기본 라인보다 MoE 처리량을 50x씩 보여줍니다. MoE 전문가 라우팅은 사전 채용에 계산이 무겁지만 디코드 (전문 캐시) 에 메모리가 무겁기 때문에 분해는 두 배의 승리로 간주됩니다. 2026 국경 모델은 MoE 주류 (DeepSeek-V3, 미래의 GPT-5 변종) 이다.

### 기억해야 할 숫자

벤치마크 숫자는 추론  NVIDIA 및 추론 스택은 분기마다 업데이트 된 결과를 게시합니다. 인용 전에 다시 확인합니다.

- GB200 NVL72 + Dynamo에 대한 DeepSeek-R1: ~6x 매출량 vs 중간 지연 체제 (developer.nvidia.com, 2025-06); 전체 블랙웰 + 다이노스 스택에 대한 커뮤니티 " 최대 30x" 주장은 단일 주요 소스를 사용하지 않는 방향적 집합물입니다.
- GB300 NVL72 + 다이노: MoE 처리량 50x까지 Hopper (developer.nvidia.com, undated)
- 저축  (내용 복합, 단 한 사례 연구)$600-800K/year off a $2M의 연간 지출은 일정 SLA로
- 분할률: 명령표 > 512 토큰 + 출력표 > 200 토큰
- NIXL를 통해 KV 전송: 70B FP8에서 4K 프롬프트 KV에 대해 20-80 ms

```figure
prefill-decode-split
```

## 사용 하 고

`code/main.py`콤록된 서비스와 분산된 서비스의 시뮬레이션을 합니다.

## 선박

이 교훈은`outputs/skill-disaggregation-decider.md`. 작업 과 과중과 클러스터를 고려하면 분할 여부를 결정합니다.

## 운동

1. 달아`code/main.py`분해가 콜로케이션을 이겨내는 속도?
2. P99 프리픽스 길이가 8K, 출력 300을 가진 RAG 서비스의 사전충전 풀 및 디코드 풀을 설계하십시오.
3. 다이노스와 llm-d: 파이썬 실행 시간 선호도 없이 순수한 쿠버네티스 가게를 선택하세요.
4. KV 전송 비용을 계산: 70B FP8에서 4K 사전 채우기 = ~500 MB KV. RDMA에서 100 GB/s, 전송 = 5 ms. TCP에서 10 GB/s = 50 ms. SLA에 무엇이 중요한가?
5. MoE 전문가 라우팅은 KV 액세스 패턴을 변경합니다. 토큰에 따라 다른 전문가들을 활성화하는 MoE와 함께 분분화가 어떻게 행동합니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Disaggregated serving | "split prefill/decode" | Separate GPU pools for each phase |
| NIXL | "NVIDIA transport" | Dynamo's inter-node KV transfer (RDMA/TCP) |
| NVIDIA Dynamo | "the orchestrator" | Stack-above coordinator for vLLM/SGLang/TRT-LLM |
| llm-d | "Kubernetes native" | Red Hat + AWS K8s disaggregated stack |
| Planner Profiler | "Dynamo auto-config" | Measures workload, configures pool ratios |
| SLA Planner | "Dynamo policy" | Auto-rate-matches prefill:decode to meet SLOs |
| `packDomain: rack` | "llm-d topology" | Pack prefill+decode on same rack for fast KV |
| UCCL | "unified collective" | llm-d 0.5 networking layer for scale-to-zero |
| MoE expert routing | "expert per token" | DeepSeek-V3 pattern; disaggregation helps |

## 더 많은 읽기

- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/)
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/)
- [TensorRT-LLM Disaggregated Serving blog](https://nvidia.github.io/TensorRT-LLM/blogs/tech_blog/blog5_Disaggregated_Serving_in_TensorRT-LLM.html)
- [llm-d GitHub](https://github.com/llm-d/llm-d)
- [llm-d 0.5 release notes](https://github.com/llm-d/llm-d/releases)
