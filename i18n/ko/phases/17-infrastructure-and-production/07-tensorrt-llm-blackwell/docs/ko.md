# 하드웨어 전문 인퍼런스 컴파일링  블랙웰에 FP8 및 NVFP4

> 하드웨어 전문 추론 컴파일링은 처리량에 대한 휴대성을 거래하고 있으며, Blackwell에 조정된 TensorRT-LLM  NVIDIA-만 은 무역의 가장 명확한 예입니다.$0.012 per million tokens on a 120B model in Q1-Q2 2026, against $H100 + vLLM 에서 0.09/M 7배의 경제적 격차 스택은 세 개의 부동소수점 정체로 구성되어 있습니다. FP8는 KV 캐시 및 주의 커널에 필요한 동적 범위를 가지고 있기 때문에 중요하게 유지됩니다. NVFP4 (4 비트 미세 스케일링) 는 무게와 활성화를 처리합니다. 멀티 토큰 예측 (MTP) 및 분산 된 사전填充/독호는 위에 또 다른 2-3x를 추가합니다. Day-0 모델 지원은 FP4 무게를 직접 훈련 후 변환 없이 부하합니다. 2026년 엔지니어링 팀의 포획: TRT-LLM는 오픈소스이지만 NVIDIA에 특화된 CUDA와 블랙웰에 특화된 콤비에 들어가기 전에 모델과 하드웨어의 혼합을 계산해 보세요.

**Type:** Learn
**Languages:** Python (stdlib, toy FP8/NVFP4 memory and cost calculator)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 10 · 13 (Quantization)
**Time:** ~75 minutes

## 학습 목표

- 왜 FP8가 NVFP4에 무게가 있을 때에도 KV 캐시와 주의를 위해 중요한지 설명하십시오.
- BF16, FP8 및 NVFP4에 따라 경계 모델의 HBM 발자국을 계산하고 저축이 어디에서 왔는지 설명합니다.
- 블랙웰 특유의 기능 TRT-LLM 악용을 명명하십시오 (일-0 FP4, MTP, 분산된 서비스, 모든 것에서 모든 것을 원시).
- TRT-LLM의 NVIDIA-lock이 7x가량의 비용 격차와 Hopper의 vLLM의 차이를 결정합니다.

## 문제

2026년 추론 경제학의 경계선은 "달러당 얼마나 많은 토큰이 있는가"이다. 답은 네 가지 선택에 달려 있다. 하드웨어 생성 (Hopper H100/H200 vs. Blackwell B200/GB200), 정확성 (BF16 → FP8 → NVFP4), 서비스 엔진 (vLLM vs. SGLang vs. TRT-LLM), 오케스트레이션 (평평형 vs. 분산 vs. 다이노모).

VLLM의 호퍼에서 120B MoE가 ~$0.09 per million tokens. On Blackwell with TRT-LLM + Dynamo, the same model runs at ~$0.012  7x 더 저렴. 그 격차 중 일부는 하드웨어 (블랙웰은 GPU LLM 출력당 11-15x vs 호퍼) 이다. 일부는 스택입니다: FP4 무게, MTP 드래프트, 분산 된 사전填充/독호, 그리고 NVLink 5 모든 모든 MoE 전문가 통신.

NVIDIA의 스택 이외에 이것을 복제할 수 없습니다. 이것이 경제에 대한 타협입니다. 어떤 스택 선택이 어떤 격차의 비중을 줄 수 있는지 이해하는 것이 이 교훈의 핵심입니다.

## 개념

### 왜 FP8는 여전히 KV 캐시의 바닥이

2026년 일반적인 오류: NVFP4가 모든 곳에 적용된다는 가정. 그렇지 않습니다. KV 캐시는 FP8 (8 비트 부동의 포인트) 를 필요로 합니다. 이는 광범위한 동적 범위를 뻗어있는 관심 키와 값을 저장하기 때문입니다. KV를 FP4로 양자화하는 것은 재앙적인 정확성 손실을 초래합니다.

NVFP4 (2025-2026) 는 무게와 활성화에 적용된다. 미크로스컬링: 무게의 각 블록은 자신의 규모 인수를 가지고 있으므로 작은 블록은 각 텐서 규모 손실 없이 다양한 동적 범위를 범할 수 있습니다. 활성화를 위해, FP4는 활성화가 층 내에서 작은 범위이기 때문에 유지됩니다.

전형적인 블랙웰 구성:

- 무게: NVFP4 (4비트 미세 스케일링).
- 활성화: NVFP4.
- KV 캐시: FP8.
- 주의 축적 장치: FP32 (softmax 안정성).

### 블랙웰 특유의 원시물 TRT-LLM이 사용하는

- **Day-0 FP4 weights**: 모델 제공업체들은 FP4 무게를 직접 배송하고, TRT-LLM 로드는 훈련 후 변환 없이 전송한다. FP4에 대해 AWQ/GPTQ 단계가 없다.
- **Multi-token prediction (MTP)**: EAGLE (단계 17 · 05) 과 같은 아이디어이지만 TRT-LLM 빌드에 통합되었습니다.
- **Disaggregated serving**: 각기 다른 GPU 풀에 미리 작성하고 디코드하여 KV 캐시를 NVLink 또는 InfiniBand로 전송합니다.
- **All-to-all communication primitives**NVLink 5은 MoE 전문가 통신 지연을 3x로 Hopper에 비해 줄입니다. TRT-LLM의 MoE 커널은 이를 위해 조정되었습니다.
- **NVFP4 + MXFP8 microscaling**: 블랙웰 텐서 코어에서 하드웨어 가속화 규모 요인 처리

### 기억해야 할 숫자는

- HGX B200은 TRT-LLM를 통해 GPT-OSS-120B에 있는 $0.022/M 토큰에 있습니다.
- GB200 NVL72은 $0.012/M 토큰을 통해 다이노스 (TRT-LLM 오케스트레이팅) 를 통해 판매한다.
- H100 + vLLM ≈ $0.099/M 토큰
- TRT-LLM 업데이트 (2026) 이후 3개월 동안 2.8배의 처리량 증가
- 1~15배의 GPU LLM 매출량, 블랙웰 vs 호퍼
- MLPerf 인퍼런스 v6.0 (2026년 4월): 블랙웰은 제출된 모든 작업을 지배한다.

### FP4의 질적 비용은 실제로

NVFP4는 공격적입니다. 추론 중이 많은 작업 부하 (생각 체인, 수학, 긴 맥락의 코드-제인) 에서 FP4 무게는 눈에 띄게 저하됩니다. 블록당 캘리브레이션은 완화하지만 제거하지 않습니다. 팀 운송 추론 모델은 종종 타협으로 FP8 무게 + FP4 활성화를 사용합니다. 또는 전체 FP8와 H200에 붙습니다.

규칙: NVFP4 무게에 대한 약속을 하기 전에 항상 평가 세트에 작업 품질을 확인하십시오.

### 왜 이것이 NVIDIA의 잠금 결정인지

TRT-LLM는 C++ + CUDA + 폐쇄적 원자원 커널입니다. 모델은 특정 GPU SKU를 위해 컴파일되어야 합니다. AMD, Intel, ARM가 없습니다. 인프라 전략이 멀티 벤더라면 TRT-LLM는 TRT-LLM 서비스 된 계층에 비스타터입니다.

### 2026 실용적인 요리법

1억 달러 이상의 연간 추론 청구서를 위해, 호퍼 + vLLM에서 실행하면 테이블에서 7-10배를 남겨두고 있습니다. 비용 지배적인 작업량을 블랙웰 + TRT-LLM + 다이나모로 마이그레이션하십시오. 모델 반복 속도를 위해 H100 + vLLM에 대한 실험 수준을 유지하십시오. 생산 전에 각 NVFP4 변환 된 모델에 대한 품질을 검증하십시오.

### 분산 보너스

TRT-LLM의 분산된 분산 (분립 사전 채우고 분산 풀) 은 17 · 20 단계에서 깊이로 다루어집니다. 블랙웰에서는 곱셈 스택: FP4 무게 × MTP 가속화 × 분산된 배치 × 캐시 인식하는 라우팅. 7x 숫자는 이 전체 스택을 가정합니다.

```figure
pipeline-parallel
```

## 사용 하 고

`code/main.py`HBM 발자국, 디코드 처리량 (메모리 묶인 정제), 그리고 H100 + BF16 + vLLM, H100 + FP8 + vLLM, B200 + NVFP4/FP8 + TRT-LLM의 세 개의 스택을 통해 모델의 $/M 토큰을 계산합니다.

## 선박

이 교훈은`outputs/skill-trtllm-blackwell-advisor.md`. 작업량, 모델 크기와 연간 토큰 수량을 고려하면 블랙웰+TRT-LLM 스택이 NVIDIA-블록에 가치가 있는지 여부를 결정합니다.

## 운동

1. 달아`code/main.py`30% 활성 매개 변수를 가진 120B MoE에서 H100 BF16, H100 FP8 및 B200 NVFP4/FP8에서 메모리 대역폭 제한 디코드 처리량을 계산하십시오. 가장 큰 도약이 어디에서 왔습니까?
2. 고객들은 H100+ vLLM에 연간 2백만 달러를 지출합니다. 7배의 경제 격차를 감안하면 12개월 안에 TRT-LLM로 마이그레이션을 amortize하기 위해 구입해야 할 블랙웰 GPU의 분쇄량수는 얼마일까요?
3. NVFP4 중량 변환 후 MATH에서 정확도가 3 점 감소하는 것을 볼 수 있습니다. 두 가지 복구 경로를 명명하십시오. 하나는 품질 우선 (FP8 중량을 유지), 하나는 비용 우선 (분야 데이터와 캘리버링).
4. MLPerf v6.0 추론 결과를 읽어보세요. 어떤 작업이 가장 작은 블랙웰 오버홉퍼 격차를 가지고 있으며, 왜요?
5. NVFP4 무게에서 405B 모델에 필요한 HBM를 계산하고 128k 컨텍스트에서 FP8 KV 캐시를 계산합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| FP8 | "eight-bit float" | 8-bit floating point; used for KV cache and attention due to dynamic range |
| NVFP4 | "four-bit micro" | NVIDIA's 4-bit microscaling FP format; weights and activations on Blackwell |
| MXFP8 | "MX eight" | Microscaling FP8 variant; hardware-accelerated on Blackwell Tensor Cores |
| Day-0 FP4 | "ship FP4 weights" | Model providers release weights already in FP4; no post-train conversion step |
| MTP | "multi-token prediction" | TRT-LLM's integrated speculative-decoding draft (Phase 17 · 05) |
| Disaggregated serving | "split prefill/decode" | Prefill and decode on separate GPU pools; KV transferred over NVLink/IB |
| All-to-all | "MoE expert comm" | Communication pattern routing tokens to expert GPUs; NVLink 5 cuts 3x |
| InferenceX | "SemiAnalysis inference bench" | The 2026 industry-accepted cost-per-token benchmark |

## 더 많은 읽기

- [NVIDIA — Blackwell Ultra MLPerf Inference v6.0](https://developer.nvidia.com/blog/nvidia-blackwell-ultra-sets-new-inference-records-in-mlperf-debut/)2026년 4월 MLPerf 결과
- [NVIDIA — MoE Inference on Blackwell](https://developer.nvidia.com/blog/delivering-massive-performance-leaps-for-mixture-of-experts-inference-on-nvidia-blackwell/)NVLink 5 전용 및 MoE 커널
- [TensorRT-LLM Overview](https://nvidia.github.io/TensorRT-LLM/overview.html) 공식 엔진 문서
- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/) TRT-LLM 위에 분산된 오케스트라
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) 블랙웰 숫자를 출판하는 벤치마크 스위트
