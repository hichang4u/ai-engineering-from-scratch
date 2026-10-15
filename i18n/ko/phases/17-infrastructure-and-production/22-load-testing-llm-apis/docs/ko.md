# 로드 테스트 LLM API  k6와 거북이 거짓말 하는 이유

> 전통적인 로드 테스터는 스트리밍 응답, 변수 출력 길이가, 토큰 수준 매트릭 또는 GPU 포화로 설계되지 않았습니다. 두 개의 함정이 대부분의 팀들을 습니다. GIL 함정: Locust의 토큰 레벨 측정은 Python GIL 아래 토큰화를 실행합니다. 이는 무거운 동시함의 상태에서 요청 생성과 경쟁합니다. 토큰화 백록은 보고된 토큰 간 지연을 증가시킵니다. 시동-통일성 함정: 루프에서 동일한 시동이 토큰 배포에 한 점 테스트; 실제 트래픽은 변수 길이와 다양한 사전 일치가 있습니다. LLMPerf는 이것을 해결합니다`--mean-input-tokens`+ `--stddev-input-tokens`2026 년 에 도구 지도: 토큰 수준 정확성 을 위해 LLM 전문 (GenAI-Perf, LLMPerf, LLM-Locust, guidellm)**k6 v2026.1.0**+ **k6 Operator 1.0 GA (Sept 2025)** 스트리밍 인식, TestRun/PrivateLoadZone CRD를 통해 배포된 Kubernetes-이족, CI/CD 게이트에 가장 적합하다. Vegeta for Go 상수 비율 포화; 스트리밍을 위한 LLM-Locust 확장으로만 Locust 2.43.3.3.

**Type:** Build
**Languages:** Python (stdlib, toy realistic-prompt generator + latency collector)
**Prerequisites:** Phase 17 · 08 (Inference Metrics), Phase 17 · 03 (GPU Autoscaling)
**Time:** ~75 minutes

## 학습 목표

- 일반 로드 테스터가 LLM API에 대해 거짓말을 하는 두 가지 반 패턴 (GIL 함정, 신속 일률 함정) 을 설명하십시오.
- 주어진 목적에 대한 도구를 선택하십시오: LLMPerf (표준 실행), k6 + 스트리밍 확장 (CI 게이트), guidellm (대 규모의 합성), GenAI-Perf (NVIDIA 참조).
- 4개의 로드 패턴 (స్థిరమైన, 램프, 스피크, 빗물) 을 설계하고 각각의 포획에 실패 모드를 지정하십시오.
- 고정 길이보다는 입력 토큰의 평균 + stddev을 사용하여 현실적인 프롬프트 배포를 구축하십시오.

## 문제

당신은 500명의 동시 사용자에서 LLM 최종점을 k6 테스트했습니다. 그것은 유지되었습니다. 당신은 배포했습니다. 생산에서 200명의 실제 사용자에서 서비스가 폭발했습니다.

두 가지 일이 일어났습니다. 첫째, k6는 500개의 동일한 명령어를 보냈습니다.  요청-집합 및 사전 캐싱은 실제로 하나를 처리하는 동안 500개의 동시 디코드를 처리하는 것처럼 보이게 만들었습니다. 둘째, k6는 스트리밍 응답의 트리킹 지연을 눈의 경험과 같이 추적하지 않습니다. 그것은 하나의 HTTP 연결을 볼 수 있습니다. 500개의 토큰이 서로 다른 간격으로 도착하는 것이 아닙니다.

LLM에 대한 로드 테스트는 그 자체의 학문입니다.

## 개념

### GIL 함정이 (Locust)

로커스트는 파이썬을 사용하고 GIL 아래의 토큰화 클라이언트 측을 실행합니다. 높은 동시 상태에서는 요청 생성 뒤에 토큰화 큐가 있습니다. 보고된 인터 토큰 지연은 클라이언트 측 토큰화 백록을 포함합니다. 서버가 느린 것으로 생각됩니다. 그것은 테스트 하네스입니다.

수정: LLM-Locust 확장 프로그램은 토큰화를 분리된 프로세스로 옮깁니다. 또는 컴파일된 언어 을 사용합니다 (k6, LLMPerf tokenizers.rs를 사용하여).

### 신속한 일률 함정이

모든 알려진 로드 테스터는 하나의 프롬프트를 구성할 수 있게 합니다. 10,000 회 반복의 루프 테스트에서 정확히 같은 프롬프트가 매번 전송됩니다. 서버는  프롬프트가 캐시를 치면 매번 동일한 프롬프트를 볼 수 있습니다. 100%에 접근하면 매출량이 훌륭합니다.

수정: 신속한 배포에서 샘플을 사용 합니다.`--mean-input-tokens 500 --stddev-input-tokens 150` 다양한 길이가, 다양한 내용

### 4개의 로드 패턴

1. **Steady-state** 30~60분 동안 일정 RPS. 포획: 기본 연출률 회귀
2. **Ramp** 선형적으로 RPS를 0에서 15분 이상에서 목표로 증가시키십시오.
3. **Spike**2분 동안 갑자기 3~10x RPS를 기록하고, 자동으로 엑스레이션, 큐 포화, 콜드 스타트 충격
4. **Soak**4~8시간 동안 정형 상태에서 잡습니다. 기억 유출, 연결 풀 파동, 관찰 가능성 과잉

### 2026 도구 지도

**LLMPerf**(Anyscale) Python 하지만 Rust 지원 토큰화. 중소/stddev 명령어. 스트리밍 인식. 성능 실행에 가장 좋은 기본.

**NVIDIA GenAI-Perf** NVIDIA의 참조. Triton 클라이언트를 사용한다. 포괄적인 측정 커버리지. ITL는 TTFT를 제외하고 LLMPerf는 포함한다. 두 도구는 동일한 서버에 대해 다른 TPOT를 생성한다.

**LLM-Locust**(TrueFoundry)  거북이 확장 프로그램 GIL 함정을 수정합니다.

**guidellm** 대규모 합성 벤치마킹

**k6 v2026.1.0**+ **k6 Operator 1.0 GA (Sept 2025)**이 부분의 본문은
- k6 자체 (Go, Compiled, no GIL) 는 스트리밍에 대한 인식 메트릭을 추가했습니다.
- k6 운영자는 Kubernetes-이민 분산 테스트를 위해 TestRun / PrivateLoadZone CRD를 사용합니다.
- CI/CD 게이트와 SLA 테스트에 가장 좋습니다.

**Vegeta** k6보다 간단합니다. ثابت 비율 HTTP 포화. LLM 인식이 없지만 게이트웨이 / 속도 제한 테스트에 좋습니다.

**Locust 2.43.3 stock** LLM-Locust 확장만 하면 GIL 함정이 있습니다.

### CI에서 SLA 게이트

PR에 k6를 실행하세요

- 기본 RPS에서 각각 30-50 반복
- 게이트: P50/P95 TTFT, 5xx < 5%, TPOT 열기 이하
- 침해에 대한 구조를 깨뜨리세요.

### 현실적인 신속한 분포

실제 트래픽 샘플 (당신이 가지고 있다면) 또는 출판된 배포 (예를 들어, 채팅을 위한 ShareGPT 명령어, 코드를 위한 HumanEval) 에서 구축하십시오. LLMPerf에 평균 + stddev를 공급하십시오. 모든 비용으로 루프-with-one-prompt을 피하십시오.

### 기억해야 할 숫자

- k6 운영자 1.0 GA: 2025년 9월
- k6 v2026.1.0: 스트리밍에 대한 인식 측정
- 전형적인 LLMPerf 실행: 동시 X에서 100-1000 요청
- 전형적인 CI 게이트: PR에 30~50번 반복.
- 네 가지 패턴: 안정, 램프, 스피크, 잠수.

```figure
load-pattern-waves
```

## 사용 하 고

`code/main.py`현실적인 신속한 분포로 로드 테스트를 시뮬레이션하고, 효과적인 TPOT를 측정하고, 균일한 신속 함정을 입증합니다.

## 선박

이 교훈은`outputs/skill-load-test-plan.md`작업량과 SLA를 고려하여 도구를 선택하고 네 가지 로드 패턴을 설계합니다.

## 운동

1. 달아`code/main.py`. 균일하고 현실적인 분포를 비교해 보세요.
2. CI 게이트의 k6 스크립트를 작성: TTFT P95 < 800 ms 100 동시, 실행시간 5분
3. 수습 테스트는 50 MB/시간의 메모리 증가율을 나타냅니다. 세 가지 원인과 그 중 하나를 선택해야 하는 기기를 명명하세요.
4. 스파이크 테스트는 10 RPS에서 100 RPS까지입니다. 카펜터 + vLLM 생산 스택이 설치되어 있다면 예상되는 복구 시간은 무엇입니까 (단계 17 · 03 + 18)?
5. GenAI-Perf은 TPOT=6ms, LLMPerf은 TPOT=11ms를 같은 서버에 보고한다. 설명해 주십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| LLMPerf | "the LLM harness" | Anyscale benchmark tool, streaming-aware |
| GenAI-Perf | "NVIDIA tool" | NVIDIA reference harness |
| LLM-Locust | "Locust for LLMs" | Locust extension fixing GIL trap |
| guidellm | "synthetic benchmark" | Large-scale synthetic tool |
| k6 Operator | "K8s k6" | CRD-based distributed k6 |
| GIL trap | "Python client overhead" | Tokenization backlog inflates reported latency |
| Prompt-uniformity trap | "single-prompt lie" | Loop with same prompt hits cache, inflates throughput |
| Steady-state | "constant load" | Flat RPS for N minutes |
| Ramp | "linear up" | 0 to target over duration |
| Spike | "burst test" | Sudden multiplier then revert |
| Soak | "long test" | Hours for leak detection |

## 더 많은 읽기

- [TianPan — Load Testing LLM Applications](https://tianpan.co/blog/2026-03-19-load-testing-llm-applications)
- [PremAI — Load Testing LLMs 2026](https://blog.premai.io/load-testing-llms-tools-metrics-realistic-traffic-simulation-2026/)
- [NVIDIA NIM — Introduction to LLM Inference Benchmarking](https://docs.nvidia.com/nim/large-language-models/1.0.0/benchmarking.html)
- [TrueFoundry — LLM-Locust](https://www.truefoundry.com/blog/llm-locust-a-tool-for-benchmarking-llm-performance)
- [LLMPerf](https://github.com/ray-project/llmperf)
- [k6 Operator](https://github.com/grafana/k6-operator)
