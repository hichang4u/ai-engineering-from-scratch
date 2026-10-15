# 생산량  AWQ, GPTQ, GGUF K-쿼트, FP8, MXFP4/NVFP4

> 양자 형식은 보편적인 선택이 아닙니다. 그것은 하드웨어, 서비스 엔진 및 작업 부하의 기능입니다. GGUF Q4_K_M 또는 Q5_K_M는 llama.cpp 및 Ollama를 통해 제공되는 CPU와 edge를 소유하고 있습니다. GPTQ는 vLLM 내부에서 승리합니다. 같은 기지에 멀티-LoRA가 필요할 때. Marlin-AWQ 커널을 가진 AWQ는 7B 클래스 모델에서 가장 좋은 Pass@1를 INT4 에서 제공하며 2026년 데이터센터 생산에 대한 기본값입니다. FP8는 Hopper, Ada, 그리고 Blackwell에서 거의 손실이 없으며 널리 지원됩니다. NVFP4 및 MXFP4 (블랙웰 미세 스케일링) 은 공격적이며 블록별 검증을 필요로 한다. 두 개의 함정 잇 팀: 캘리브레이션 데이터 세트는 배포 도메인에 일치해야하며 KV 캐시는 무게 양자화와 분리됩니다. AWQ 수업 "내 모델은 이제 4 GB"는 생산 배트 크기에서 10-30 GB KV 캐시를 잊습니다.

**Type:** Learn
**Languages:** Python (stdlib, toy memory and throughput comparison across formats)
**Prerequisites:** Phase 10 · 13 (Quantization foundations), Phase 17 · 04 (Serving Engine Internals)
**Time:** ~75 minutes

## 학습 목표

- 2026년에 생산량화 형식 6개와 그 달콤한 점들을 명명하라
- 하드웨어 (CPU vs GPU, Hopper vs Blackwell), 엔진 (vLLM, TRT-LLM, llama.cpp) 및 작업 부하 (정규 채팅, 추론, 멀티-LoRA) 를 선택하십시오.
- 저장된 무게 메모리를 계산하고 KV 캐시를 선택된 형식으로 그대로 남겨두십시오.
- 도메인 트래픽에 대한 양자화된 모델을 떨어뜨리는 캘리브레이션 데이터 세트 함정이 무엇인지 알려주세요.

## 문제

양자화 는 메모리 및 HBM 대역폭을 줄이는데, 이는 정확히 해독이 필요한 것입니다. FP16 70B 모델은 140 GB의 무게를 가지고 있습니다. INT4 (AWQ 또는 GPTQ) 로 양자 무게를 가지고 있으며, 모델은 35 GB 입니다. KV 캐시 공간과 함께 한 H100에 적합합니다. 이는 2k 컨텍스트와 함께 128 개의 동시 순서에서 KV 캐시만 20-30 GB이기 때문에 중요합니다.

하지만 양자화는 무료가 아닙니다. 공격적인 양자화는 품질을 저하시킨다. 특히 추론이 무거운 작업에서. 다양한 형식은 다른 엔진과 작동합니다. 다른 하드웨어는 다른 정확성을 원천적으로 지원합니다. 2026 형식의 동물원은 실제이며 다른 사람의 선택을 복사 할 수 없습니다.

## 개념

### 6가지 형식

| Format | Bits | Sweet spot | Engines |
|--------|------|-----------|---------|
| GGUF Q4_K_M / Q5_K_M | 4-5 | CPU, edge, laptops | llama.cpp, Ollama |
| GPTQ | 4-8 | Multi-LoRA on vLLM | vLLM, TGI |
| AWQ | 4 | Datacenter GPU production | vLLM (Marlin-AWQ), TGI |
| FP8 | 8 | Hopper/Ada/Blackwell datacenter | vLLM, TRT-LLM, SGLang |
| MXFP4 | 4 | Blackwell multi-user | TRT-LLM |
| NVFP4 | 4 | Blackwell multi-user | TRT-LLM |

### GGUF  CPU/edge 기본

GGUF는 파일 형식이며, 자체적으로 양자화 계획이 아닙니다. K- 양자 변종 (Q2_K, Q3_K_M, Q4_K_M, Q5_K_M, Q6_K, Q8_0) 을 하나의 컨테이너에 묶어 놓습니다. Q4_K_M 및 Q5_K_M는 생산 기본  BF16 품질에 가까운 4-5 비트입니다. CPU 또는 가장자리 서비스을위한 가장 좋은 선택입니다. llama.cpp는 가장 빠른 CPU 추론 엔진이기 때문에.

vLLM에서 처리량 처벌: ~93 tok/s 7B  형식은 GPU 커널에 최적화되지 않습니다. 배포 목표가 CPU/edge일 때 GGUF를 사용하십시오. 그렇지 않습니다.

### GPTQ  vLLM에서 멀티 로라

GPTQ는 캘리브레이션 패스를 가진 훈련 후 양자화 알고리즘이다. 마린 커널은 GPU (2.6x 가속화 vs. 마린 GPTQ) 에서 빠르게합니다. ~ 712 tok/s 7B에서.

독특한 승점: GPTQ-Int4는 vLLM에서 LoRA 어댑터를 지원합니다. 기본 모델과 10-50 미세 조율 버전을 제공한다면 (LoRA로서 각) GPTQ는 귀하의 길입니다. NVFP4는 2026 년 초부터 아직 LoRA를 지원하지 않습니다.

### AWQ  데이터센터 GPU 기본

액티비케이션 의식 중량량화. 양량화 과정에서 가장 뛰어난 중량을 ~1% 보호합니다. 마린-AWQ 커널: 10.9x 속도 vs 순진. ~ 7B에서 741 tok/s, INT4 형식 중 가장 좋은 Pass@1

새로운 GPU 서비스에서 AWQ를 선택하세요. 만약 당신이 멀티-LoRA (GPTQ) 또는 공격적인 Blackwell FP4 (NVFP4) 를 필요로하지 않는다면.

### FP8  신뢰성 있는 중부

8비트 부동소수점. 거의 손실이 없습니다. 널리 지원됩니다. 호퍼 텐서 코어는 FP8를 원산적으로 가속화합니다. 블랙웰은 상속합니다. 품질이 협상되지 않을 때 FP8는 안전한 2026 기본입니다. 메모리 절약은 INT4의 절반이지만 품질 위험은 훨씬 낮습니다.

### MXFP4 / NVFP4  블랙웰 공격

마이크로스칼링 FP4. 각 무게 블록은 자신의 규모 요소를 가지고 있습니다. 공격적이지만 블랙웰 텐서 코어에서 하드웨어 가속화. FP8에 비해 토큰 당 바이트를 절반으로 줄여라.

동굴:
- 아직 (2026년 초) 로라 지원은 없습니다.
- 논리적인 작업량에서 품질 감소가 눈에 띄게 됩니다.
- 모델별 평가 세트를 확인해 보세요.

### 기량 적립 함정이

AWQ와 GPTQ는 일반적으로 C4 또는 WikiText의 캘리브레이션 데이터 세트를 필요로 한다. 도메인 모델 (코드, 의료, 법률) 에 대해서는 일반 웹 텍스트에 캘리브레이션을 통해 알고리즘이 어떤 무게를 보호해야 하는지에 대해 잘못된 결정을 내릴 수 있습니다. HumanEval에서 Pass@1는 여러 포인트를 떨어뜨릴 수 있습니다.

고치는: 도메인 내 데이터에 대한 캘리버링. 도메인 샘플 수백은 일반적으로 충분합니다. 배포 전에 eval 세트를 테스트.

### KV 캐시 함정

AWQ는 무게를 4 비트로 줄인다. KV 캐시는 분리되어 FP16/FP8에 유지됩니다. AWQ를 가진 70B 모델에서는:

- 무게: ~ 35 GB (INT4 140 GB에서).
- KV 캐시 128 동시 × 2k 컨텍스트: ~20 GB.
- 활성화: ~ 5 GB
- 총: ~ 60 GB  H100 80 GB에 적합합니다.

순진하게 "내 모델을 4GB로 양자화했다"는 나머지 30-50GB를 잊어 버립니다.

별도로, KV 캐시 양자화 (FP8 KV 또는 INT8 KV) 는 자신의 타협을 가진 다른 선택입니다.

### AWQ INT4는 추론을 위해 위험하다

사상 연쇄, 수학, 긴 맥락의 코드-제인  이들은 공격적인 양자화로 인해 눈에 띄게 고통 받고 있습니다. AWQ INT4는 MATH에서 ~ 3-5 점을 잃습니다. 추론-중고 작업 부하에 대해 FP8 또는 BF16을 배포하십시오. 메모리 비용을 받아보십시오.

### 2026 선택 안내서

- CPU/edge 서비스: GGUF Q4_K_M 완료
- GPU 서비스, 루틴 채팅, 로라가 없습니다.
- GPU 서비스, 멀티-LoRA: GPTQ와 Marlin.
- 논리 작업량: FP8.
- 블랙웰 데이터센터, 검증된 품질: NVFP4 + FP8 KV.
- 모호한: 각 후보 형식에 1000개의 샘플을 평가합니다.

```figure
gpu-memory-breakdown
```

## 사용 하 고

`code/main.py`다양한 모델 사이즈에 대한 메모리 발자국 (중량 + KV + 활성화) 및 상대성 처리량을 계산합니다. KV 캐시가 지배하는 곳, 무게 압축이 지불하는 곳, 그리고 FP8가 안전한 선택지입니다.

## 선박

이 교훈은`outputs/skill-quantization-picker.md`. 하드웨어, 모델 크기와 작업 부하 유형, 품질 용납량 등을 고려하여 형식을 선택하고 캘리브레이션/확인 계획을 수립합니다.

## 운동

1. 달아`code/main.py`. 70B 모델의 경우 128k 컨텍스트와 동시에, 각 포맷의 HBM를 계산하십시오. 어떤 포맷은 H100 80GB에 맞게 허용합니까?
2. 7B 코딩 모델이 있습니다. 형식을 선택하고 정당화하세요. 품질 용납성에 대해 잘못 알고 있다면 회복 경로는 무엇입니까?
3. 의료 영역 모델에 AWQ를 캘리버링하는데 필요한 캘리버레이션 데이터 세트 크기를 계산하십시오. 왜 더 많은 데이터가 항상 더 좋지 않은가?
4. Marlin-AWQ 커널 페이퍼 또는 출시 메모를 읽어 보세요. AWQ가 7B에서 741 토크/초를 기록하고 원료 GPTQ가 712을 기록하는 이유를 세 문장으로 설명하세요.
5. FP8 KV 캐시와 KV를 BF16에서 유지하는 것과 AWQ 무게를 결합하는 것은 언제 의미가 있습니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GGUF | "llama.cpp format" | File format bundling K-quant variants; CPU/edge default |
| Q4_K_M | "Q4 K M" | 4-bit K-quant medium; the production GGUF default |
| GPTQ | "gee pee tee q" | Post-train INT4 with calibration; supports LoRA in vLLM |
| AWQ | "a w q" | Activation-aware INT4; Marlin kernels; best Pass@1 at INT4 |
| Marlin kernels | "fast INT4 kernels" | Custom CUDA kernels for INT4 on Hopper; 10x speedup |
| FP8 | "eight-bit float" | Safe precision default on Hopper/Ada/Blackwell |
| MXFP4 / NVFP4 | "microscaling four" | Blackwell 4-bit FP with per-block scale factors |
| Calibration dataset | "cal data" | Input text used to pick quantization parameters; must match domain |
| KV cache quantization | "KV INT8" | Separate choice from weights; affects attention accuracy |

## 더 많은 읽기

- [VRLA Tech — LLM Quantization 2026](https://vrlatech.com/llm-quantization-explained-int4-int8-fp8-awq-and-gptq-in-2026/) 비교 기준
- [Jarvis Labs — vLLM Quantization Complete Guide](https://jarvislabs.ai/blog/vllm-quantization-complete-guide-benchmarks) 형식별로 출력 번호
- [PremAI — GGUF vs AWQ vs GPTQ vs bitsandbytes 2026](https://blog.premai.io/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/) 형식별 선택
- [vLLM docs — Quantization](https://docs.vllm.ai/en/latest/features/quantization/index.html) 지원되는 형식 및 깃발
- [AWQ paper (arXiv:2306.00978)](https://arxiv.org/abs/2306.00978) AWQ의 원래의 공식
- [GPTQ paper (arXiv:2210.17323)](https://arxiv.org/abs/2210.17323) 원래의 GPTQ 공식
