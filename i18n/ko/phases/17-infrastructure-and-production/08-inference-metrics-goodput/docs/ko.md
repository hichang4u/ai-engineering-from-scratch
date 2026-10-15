# 추론 측정  TTFT, TPOT, ITL, Goodput, P99

> 네 가지 측정값이 추론 배포가 작동하는지 여부를 결정합니다. TTFT는 사전 채용과 줄을 더하는 네트워크입니다. TPOT (대칭 ITL) 는 메모리 제한된 디코딩 비용입니다. 엔드-투-엔드 레이턴시는 TTFT + TPOT 곱하기 출력 길이가 됩니다. 매출량은 주당 토큰입니다. 하지만 제품에 중요한 것은 모든 SLO를 동시에 충족시킨 요청의 분자입니다. 낮은 부드파트에서 높은 처리량은 사용자가 시간에 도달하지 못하는 토큰을 처리한다는 것을 의미합니다. 2026년 Llama-3.1-8B-Instruct on TRT-LLM의 참조 번호: 평균 TTFT 162 ms, 평균 TPOT 7.33 ms, 평균 E2E 1,093 ms. 항상 P50를 보고, P90를 보고, P99를 보고, 절대 그냥 을 보고하지 말아요. 측정 함정을 주의하세요: GenAI-Perf은 ITL 계산에서 TTFT를 제외하고 LLMPerf은 포함하고 있습니다. 같은 실행에 대해 TPOT에 대해 두 가지 도구가 동의하지 않습니다.

**Type:** Learn
**Languages:** Python (stdlib, toy percentile calculator and goodput reporter)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals)
**Time:** ~60 minutes

## 학습 목표

- TTFT, TPOT, ITL, E2E, 처리량, 그리고 Goodput을 정확하게 정의하고 각 측정 요소를 명명하십시오.
- LLM 봉사에 대한 평균이 왜 잘못된 통계인지 설명하고 P50/P90/P99를 어떻게 읽어야 하는지 설명하십시오.
- SLO 멀티 제한 (예를 들어 TTFT<500 ms 및 TPOT<15 ms 및 E2E<2 s) 를 구축하고 그에 대한 굿put을 계산한다.
- 같은 연장에 대해 TPOT에 대해 동의하지 않는 두 가지 기준 도구의 이름을 적어 그 이유를 설명하십시오.

## 문제

"우리의 처리량은 초당 15,000 토큰입니다". 그럼 어떻게 될까요? 요청의 40%가 2초를 넘어서면 사용자가 세션을 포기합니다. 처리량만으로도 제품이 작동하는지 여부를 알려주지 않습니다.

인퍼런스는 여러 지연축을 가지고 있고 각각의 지연축은 다르게 실패합니다. 사전 채우는 것은 계산에 의해 제한되어 있으며, 빠른 길이로 스케일합니다. 디코드는 메모리와 연결되어 있고, 배치 크기와 함께 확장됩니다. 대기 지연은 운영적인 문제입니다. 네트워크는 물리적인 거리의 문제입니다. 각각의 메트릭은 각각 다른데, 그리고 percentiles가 필요하고, "이용자가 기대했던 것을 얻었는가?"라는 단 하나의 복합이 필요하죠.

## 개념

### TTFT  첫 번째 토큰에 대한 시간

`TTFT = queue_time + network_request + prefill_time`

예고사항이 길었을 때 미리 채워주는 것이 지배적이다. H100의 Llama-3.3-70B FP8에서 32k 예고사항은 순수한 미리 채워지는 데 ~800 ms의 시간이 소요된다. 줄을 시간은 로드 아래의 스케줄러 행동이다. 네트워크 요청은 TLS를 포함한 와이어 시간이다. TTFT는 사용자가 어떤 것을 스트리밍하기 전에 보는 지연입니다.

### TPOT / ITL  토큰 간 지연

한 대의 많은 이름입니다.`TPOT`(출력 토큰당 시간)`ITL`(토큰 간 지연)`decode latency per token` 모든 동일. 그것은 첫 번째 이후 연속 스트리밍 토큰 사이의 시간입니다.

`TPOT = (decode_forward_time + scheduler_overhead) / tokens_produced`

어 된 전충을 가진 동일한 Llama-3.3-70B H100 스택에서, TPOT는 ~ 7 ms. 어 된 전충이 없으면, 이웃 순서에서 긴 전충을 할 때, TPOT는 50 ms까지 증가 할 수 있습니다. P99를 관찰하십시오.

### E2E 지연

`E2E = TTFT + TPOT * output_tokens + network_response`

긴 출력 (>500 토큰) 에 대해서는 E2E가 TPOT 주류가 있다. 긴 명령어 있는 짧은 출력에 대해서는 E2E가 TTFT 주류가 있다. 출력 길이가 조건화된 E2E를 보고한다.

### 통출력

`throughput = total_output_tokens / elapsed_time`

집계 매트릭은 함대 효율을 알려줍니다. 개인 요청의 건강은 알려주지 않습니다.

###  당신이 실제로 관심을 갖는 메트릭

`goodput = fraction of requests meeting (TTFT <= a) AND (TPOT <= b) AND (E2E <= c)`

SLO는 다중제한이다. 모든 제약이 충족될 경우에만 요청이 "좋은다". Goodput은 비중이다. 60%의 Goodput은 실패이다. 99%의 Goodput은 낮은 처리량이다.

2026년, goodput은 MLPerf 인퍼런스 v6.0 제출 및 AI 플랫폼 제공업체에서 내부 SLA 추적에서 사용되는 메트릭입니다.

### 왜 나쁜 통계는 잘못된 통계가

LLM 지연 분포는 오른쪽 편입니다. 한 긴 사전 부시 이웃을 가진 디코드 배트는 TPOT ~ 7 ms와 TPOT ~ 60 ms의 20 토큰으로 500 토큰을 전송할 수 있습니다. 평균 TPOT는 9 ms입니다. P99 TPOT는 65 ms입니다. 사용자는 P99를 정기적으로 을 타기 때문에 떠납니다.

항상 트리플 (P50, P90, P99) 를 보고하십시오. 사용자 경험에 대해, P99는 최적화 된 것입니다.

### 참고 번호  Llama-3.1-8B-TRT-LLM에 대한 설명, 2026

- 평균 TTFT: 162 ms
- 평균 TPOT: 7.33 ms
- 평균 E2E: 1,093 ms
- P99 TPOT: 쪼개진 전품 구성에 따라 10-25 ms에 달한다.

이것은 NVIDIA의 발표된 참조 포인트입니다. 모델 크기와 (70B는 3-5x) 하드웨어 (H100 vs B200 ~ 3x) 로 변경됩니다.

### 측정 함정이

가장 많이 사용되는 2026 벤치마킹 도구 중 두 가지는 같은 연장에 대해 TPOT에 대해 동의하지 않습니다:

- **NVIDIA GenAI-Perf**ITL 계산에서 TTFT를 제외합니다. ITL는 토큰 2에서 시작됩니다.
- **LLMPerf**ITL는 토큰 1에서 시작됩니다.

TTFT 500 ms 및 700 ms 전체 디코드에 있는 100 출력 토큰을 가진 요청에 대해서는 GenAI-Perf 보고서 `ITL = 700/99 = 7.07 ms`, LLMPerf 보고서`ITL = 1200/100 = 12.00 ms`도구 선택은 번호를 변경합니다.

항상 어떤 도구인지 알려주고 정의를 공개해 주세요.

### SLO를 만드는 방법

2026년 70B 채팅 모델에 대해 소비자를 대상으로 하는 합리적인 SLO:

- TTFT P99 <= 800 ms
- TPOT P99 <= 25 ms.
- E2E P99 <= 300 토큰 출력 < 3 s
- 좋은 출력 목표 >= 99%

엔터프라이즈 SLO는 TTFT (200-400 ms) 를 강화하고 E2E를 느슨하게 합니다.

### 측정 방법

- 실제 트래픽 또는 현실적인 합성 (LLMPerf`--mean-input-tokens 800 --stddev-input-tokens 300 --mean-output-tokens 150`)
- 기준 기준 실행에 2x 최고 동시화 목표
- 30~50번 반복해서 합친 샘플의 분수를 가져보세요.
- 도구 이름, 도구 버전, 모델, 하드웨어, 동시, 신속한 배포와 함께 게시합니다.

```figure
throughput-latency
```

## 사용 하 고

`code/main.py`장난감 굿푸트 계산기입니다. 합성 지연 분포를 생성하고 SLO를 적용하고 굿푸트를 계산합니다. 또한 같은 추적에서 GenAI-Perf vs LLMPerf TPOT 차이를 보여줍니다.

## 선박

이 교훈은`outputs/skill-slo-goodput-gate.md`. 작업량과 SLO를 고려하면 CI/CD 준비된 벤치마크 레시피를 생산하고 gate는 출력보다는 goodput에 배치합니다.

## 운동

1. 달아`code/main.py`1%의 꼬리 스피크로 분포를 생성합니다. P99 TPOT를 30 ms에서 15 ms로 꽉 차면 굿푸트가 어떻게 변합니까?
2. 판매자는 "Llama 3.3 70B H100에 15,000 톤/초"를 인용합니다. 신뢰하기 전에 세 가지 질문을 적어주세요.
3. 왜 쪼개진 전차가 P99 TPOT을 보호하지만 TPOT을 의미하지 않는가?
4. 음성 보조기 (소음기) 를 위한 소비자 SLO를 구성 (첫 번째 토큰은 읽히지 않고 듣는다). 어떤 메트릭은 사용자에게 가장 가시적입니까?
5. LLMPerf README 및 GenAI-Perf 문서를 읽어 보세요. 도구가 일치하지 않는 다른 세 가지 측정값을 식별하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| TTFT | "time to first token" | Queue + network + prefill; dominated by prefill at long prompts |
| TPOT | "time per output token" | Memory-bound decode cost per token after first |
| ITL | "inter-token latency" | Same as TPOT in most tools (not all — see GenAI-Perf) |
| E2E | "end to end" | TTFT + TPOT * output_len; response-side network on top |
| Throughput | "tok/s" | Fleet efficiency; useless without latency percentiles |
| Goodput | "SLO-met rate" | Fraction of requests meeting every SLO constraint simultaneously |
| P99 | "tail" | 1-in-100 worst-case latency; the user experience metric |
| SLO multi-constraint | "the joint" | AND of all three latency bounds; a request fails if any one is violated |
| GenAI-Perf vs LLMPerf | "the tool trap" | Tools disagree on whether ITL includes TTFT |

## 더 많은 읽기

- [NVIDIA NIM — LLM Benchmarking Metrics](https://docs.nvidia.com/nim/benchmarking/llm/latest/metrics.html) TTFT, ITL, TPOT의 가톨릭 정의
- [Anyscale — LLM Serving Benchmarking Metrics](https://docs.anyscale.com/llm/serving/benchmarking/metrics) 대체 정의와 측정 요리법
- [BentoML — LLM Inference Metrics](https://bentoml.com/llm/inference-optimization/llm-inference-metrics) 실제 배치에 적용된 측정
- [LLMPerf](https://github.com/ray-project/llmperf) 레이 기반 오픈소스 벤치마크
- [GenAI-Perf](https://github.com/triton-inference-server/perf_analyzer/blob/main/genai-perf/README.md) NVIDIA의 기준 도구.
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) 산업에서 인정된 좋은 생산량 기반 기준.
