# 캡스톤 14  투구-독호 인퍼런스 서버

> 추측적인 디코딩  값싼 드래프트는 토큰을 제안하고, 목표 모델은 하나의 패스에서 확인합니다  지금은 생산 준비가 된 최적화이며, 연구 트릭이 아닙니다. vLLM 0.7에 있는 EAGLE-3는 실제 트래픽에서 2.5-3x 출력을 가지고 있습니다. P-EAGLE (AWS 2026) 은 평행 추측을 더욱 추진했습니다. SGLang의 SpecForge는 대량 훈련장들을 훈련시켰습니다. 레드햇의 스펙룰러스 허브는 일반적인 오픈 모델에 대한 일조된 초안을 발표했습니다. 테న్సర్RT-LLM는 NVIDIA에서 1급의 추측 해독을 했습니다. 2026 생산 서비스 스택은 vLLM 또는 SGLang이며 EAGLE 가족 드래프트, FP8 또는 INT4 양자화 및 HPA가 줄을 기다리는 것입니다. 이 톱톤은 전체 꼬리 지연 보고를 가진 2.5x+ 기본 선출량으로 두 개의 개방형 모델을 서비스한다.

**Type:** Capstone
**Languages:** Python (serving), C++ / CUDA (kernel inspection), YAML (configs)
**Prerequisites:** Phase 3 (deep learning), Phase 7 (transformers), Phase 10 (LLMs from scratch), Phase 17 (infrastructure)
**Phases exercised:**P3 · P7 · P10 · P17
**Time:** 30 hours

## 문제

2026년, 가설적인 디코딩은 상품이 되었습니다. EAGLE-3 드래프트 헤드는 목표 모델의 숨겨진 상태를 훈련시키고 앞으로 N 토큰을 예측합니다. 목표 모델은 단일 패스로 확인됩니다. 60-80%의 수용률은 2-3x의 엔드-투-엔드 처리량을 의미합니다. vLLM 0.7는 이것을 네이티브로 통합합니다. SGLang + SpecForge는 훈련 파이프라인을 제공합니다. 레드햇의 스펙룰러스는 Llama 3.3 70B, Qwen3-코더-30B MoE, GPT-OSS-120B에 대한 연계된 초안을 발표합니다.

이 기기는 서비스 운영에 참여하고 있으며 모델이 아닙니다. 트래픽 분포와 함께 수용률이 변동합니다. 거부 상태의 꼬리 지연은 추측 없이보다 더 나쁘다.

## 개념

추측적 해독은 두 층을 가지고 있습니다.**draft**모델 (EGLE-3 헤드, ngram, 또는 더 작은 목표-동렬 모델) 는 각 단계에 k 후보 토큰을 제안합니다.**target**모델은 하나의 패스에서 모든 k를 확인하고, 어떤 사전이 받아들여지는 경우도 탐욕적인 경로를 대체합니다. 수용률은 드래프트-타겟 조화를 비롯한 입력 분포에 달려 있습니다.

에이글-3는 대부분의 트래픽에서 ngram 드래프트를 제치고 있다. P-EAGLE는 더 깊은 드래프트 트리들을 위해 병렬적으로 추측을 한다. 타협: 거부에 대한 P99 지연은 더 높다. 확인 패스가 더 크기 때문에. 서비스 구성은 이 문제를 해결하기 위해 배치 크기의 버킷 지연을 보고해야 한다.

배포는 Kubernetes입니다. vLLM 0.7는 GPU 또는 텐서 병렬 셔드당 한 복사본을 실행합니다. CPU 대신 줄을 기다리는 HPA 오토스케일. FP8 (Marlin) 및 INT4 (AWQ) 쿼트는 H100 / H200 봉투 안에 GPU 메모리를 유지합니다. 엔드-투-엔드 보고서는 처리량, 수용률, p50/p99를 배트 1/8/32에서, 그리고 $/1M 토큰입니다.

## 건축

```
request ingress
    |
    v
vLLM server (0.7) or SGLang (0.4)
    |
    +-- draft: EAGLE-3 heads | P-EAGLE parallel | ngram fallback
    +-- target: Llama 3.3 70B | Qwen3-Coder-30B | GPT-OSS-120B
    |     quantized FP8-Marlin or INT4-AWQ
    |
    v
verify pass: batch k draft tokens through target
    |
    v (accept prefix; resample for rejected suffix)
    v
token stream back to client
    |
    v
Prometheus metrics: throughput, acceptance rate, queue wait, latency p50/p99
    |
    v
HPA on queue-wait metric
```

## 

- 서비스: vLLM 0.7 또는 SGLang 0.4
- 투기 방법: EAGLE-3 도약 머리, P-EAGLE 병렬 투기, ngram fallback
- 교육안: 스펙포지 (SGLang) 또는 레드햇 스펙룰러
- 타겟 모델: Llama 3.3 70B, Qwen3-Coder-30B MoE, GPT-OSS-120B
- 양자: FP8 (마린), INT4 AWQ
- 배포: Kubernetes + NVIDIA 장치 플러그인; HPA 대기열 메트릭
- Eval: ShareGPT, MT-Bench-v2, GSM8K, HumanEval
- 참고: 공급자 기준에 대한 TensorRT-LLM 가상의 해독

```figure
cf-spec-decode
```

## 건설 해

1. **Target model prep.**Llama 3.3 70B를 선택하여 Marlin를 통해 FP8로 양자화하여 1xH100 (또는 2x 텐서 평행) 에서 vLLM 0.7 아래 배치합니다.

2. **Draft source.**Red Hat Speculators에서 정렬된 EAGLE-3 드래프트 헤드를 (또는 SpecForge를 통해 훈련) 로 로드하여 vLLM의 스펙ulat티브 디코딩 구성에 로드하십시오.

3. **Baseline numbers.**투기하기 전에: 토큰/s, 패치 1/8/32, p50/p99 지연, GPU 활용.

4. **Enable EAGLE-3.**기 설정, 동일한 기준을 다시 실행, 보고 속도, 수용률, p99 꼬리 지연 델타

5. **P-EAGLE.**병렬 추측을 가능하게 합니다. 심층적인 드래프트 트리와 일련의 EAGLE-3를 측정합니다. P-EAGLE가 도움이 되는 것과 상처를 주는 부전을 보고합니다.

6. **Domain traffic.**같은 서버를 통해 ShareGPT와 HumanEval와 도메인 특정 트래픽을 실행하세요. 분포당 수용률을 측정하세요. 드래프트가 유동되는 시점을 확인하세요.

7. **Second target model.**Qwen3-Coder-30B MoE에서 같은 파이프라인을 실행하세요.

8. **K8s HPA.**HPA 추적을 통해 K8에 배치합니다 `queue_wait_ms`- 짐이 3배나 되면 확장량을 보여줘야 합니다.

9. **Cost comparison.**1백만 달러의 토큰을 Antropic Claude Sonnet 4.7와 OpenAI GPT-5.4에 비교해 보세요.

## 사용 하 고

```
$ curl https://infer.example.com/v1/chat/completions -d '{"messages":[...]}'
[serve]     vLLM 0.7, Llama 3.3 70B FP8, EAGLE-3 active
[decode]    bs=8, accepted_tokens_per_step=3.2, acceptance_rate=0.76
[latency]   first-token 42ms, full-response 980ms (620 tokens)
[cost]      $0.34 per 1M output tokens at sustained throughput
```

## 선박

`outputs/skill-inference-server.md`가상의 해독과 완전한 기준 보고 및 K8s 배포를 가진 측정된 서비스 스택.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Measured speedup vs baseline | 2.5x+ throughput at matched quality on two models |
| 20 | Acceptance rate on realistic traffic | Per-distribution acceptance-rate report |
| 20 | P99 tail-latency discipline | p99 at batch 1/8/32 with and without speculation |
| 20 | Ops | K8s deploy, HPA on queue-wait, rollout smooth |
| 15 | Write-up and methodology | Clear explanation of what changed and why |
| **100** | | |

## 운동

1. 미세한 표기판이 목표보다 한 버전 뒤떨어졌을 때 수용률 저하를 측정한다 (예를 들어, Llama 3.3 -> 3.4 파동). 모니터링 경고를 구축한다.

2. ngram-fallback: EAGLE-3 수용률이 한계 이하로 떨어지면 ngram 드래프트로 전환하고 신뢰성 향상 보고를 한다.

3. 제어된 MoE 실험을 실행: 같은 Qwen3-Coder-30B와 투입된 라우팅 소음과 외부.

4. H200 (141 GB) 까지 확장하여, 모형 크기가 प्रतिकृति당의 헤드룸을 얻었으며, 양도되지 않은 Llama 3.3 70B를 서비스할 수 있는지 보고하십시오.

5. 벤치마크 TensorRT-LLM 같은 H100 하드웨어에서 추측 해독.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Draft model | "Speculator" | Small model that proposes N tokens for the target to verify |
| EAGLE-3 | "2026 draft architecture" | Draft head trained on target hidden states; ~75% acceptance |
| P-EAGLE | "Parallel speculation" | Tree of draft branches verified in one target pass |
| Acceptance rate | "Hit rate" | Fraction of drafted tokens accepted without resampling |
| Quantization | "FP8 / INT4" | Lower-precision weights to fit more model in GPU memory |
| Queue wait | "HPA metric" | Time a request waits in the pending queue before inference starts |
| Speculators hub | "Aligned drafts" | Red Hat Neural Magic hub of EAGLE drafts for common open models |

## 더 많은 읽기

- [vLLM EAGLE and P-EAGLE documentation](https://docs.vllm.ai) 참조 서비스 스택
- [P-EAGLE (AWS 2026)](https://aws.amazon.com/blogs/machine-learning/p-eagle-faster-llm-inference-with-parallel-speculative-decoding-in-vllm/) 평행상식 디코딩 종이 + 통합
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) 초안장 훈련 파이프라인
- [Red Hat Speculators](https://github.com/neuralmagic/speculators) 직렬된 초안 허브
- [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/) 판매자 대안
- [Fireworks.ai serving architecture](https://fireworks.ai/blog) 상업적 참조
- [EAGLE-3 paper (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) 방법 문서
- [vLLM repository](https://github.com/vllm-project/vllm) 코드 및 기준
