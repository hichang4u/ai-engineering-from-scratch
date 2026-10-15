# 서버 없는 LLM에 대한 냉동 시작 완화

> 20 GB 모델 이미지는 냉각에서 서비스까지 5-10분 (7B) ~ 20+분 (70B) 이 걸립니다. 진정한 서버 없는 세상에서, 그건 온화가 아니라, 정전입니다. 완화 작업은 다섯 개의 계층에서 작동합니다: 사전 심은 노드 이미지 (AWS에서 Bottlerocket, 두 배량 아크), 모델 스트리밍 (NVIDIA Run:ai Model Streamer, vLLM에서 원산), GPU 메모리 스냅샷 (모달 체크포인트, 최대 10x 더 빠른 재 시작), 따뜻한 풀 (`min_workers=1`), 계층 로딩 (ServerlessLLM의 NVMe→DRAM→HBM 파이프라인, 10-200x 지연 감소), 그리고 KV 캐시 (GB) 대신 입력 토큰 (KB) 을 이동시키는 라이브 마이그레이션. 모달은 바닥으로 2-4s 냉동 시작을 게시하고, 베세텐 5-10s 기본, 사전 온난화와 초초. 이 수업은 다섯 층을 측정하고, 예산하고, 쌓아 올리는 것을 가르칩니다.

**Type:** Learn
**Languages:** Python (stdlib, toy cold-start path simulator)
**Prerequisites:** Phase 17 · 02 (Inference Platform Economics), Phase 17 · 03 (GPU Autoscaling)
**Time:** ~60 minutes

## 학습 목표

- 냉동 시작 완화의 다섯 층을 나열하고 각 층에 하나의 도구나 패턴을 지정하십시오.
- 70B 모델의 전체 냉동 시작 시간을 (노드 공급) + (중중 다운로드) + (중중중 HBM에 로드) + (엔진 init) 의 합으로 계산한다.
- 라이브 마이그레이션이 KV 캐시 (GB) 를 아닌 입력 토큰 (KB) 을 전송하는 이유를 설명하고, 그 벌금 (재정) 는 무엇인지를 설명하십시오.
- 온수 풀 트레이드 오프 (무사 GPU를 지불하거나 냉동 시작 꼬리를 받아) 및 SLA 임대값을 지정하십시오.`min_workers > 0`의무적으로 적용됩니다.

## 문제

서버 없는 LLM 최종점 규모는 하루아침에 0으로 증가합니다. 오전 8시에 교통량이 급증합니다. 첫 번째 요청은

1. 카펜터 4-56s GPU 노드를 공급합니다
2. 컨테이너는 무게가 120~300GB의 30GB의 이미지를 가져옵니다.
3. 엔진은 HBM에 무게를 로드한다: 모델 크기와 저장 속도에 따라 45-120s.
4. vLLM 또는 TRT-LLM는 CUDA 그래프, KV 캐시 풀, 토큰라이저: 10-30s를 초기화합니다.

전체: 220-510s (약 3~8분) 한 토큰이 돌아오는 전에. SLA는 2s입니다. 당신은 온수 풀 (Warm-pool)`min_workers=1`(이하, 4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x4x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x6x

냉동 시작 완화는 항상 작동하는 지연 시간을 대략적으로 추론하면서 서버 없는 경제를 유지하는 방법입니다.

## 개념

### 계층 1  미리 심어진 노드 이미지 (Bottlerocket)

AWS에서, Bottlerocket의 두 개의 볼륨 구조는 OS와 데이터를 분리합니다. 컨테이너 이미지가 미리 당겨있는 데이터 볼륨을 스냅샷으로 촬영합니다.`EC2NodeClass`. 새로운 노드는 이미 로컬 NVMe에 무게를 가지고 시작됩니다.  단계 2 및 3의 일부가 사라집니다. 카펜터와 네이티브로 작동합니다. 일반적인 절약: 대형 모델에서는 냉동 시작당 2-4 분.

GCP에서: 미리 구운 컨테이너 계층을 가진 사용자 지정 VM 이미지. Azure에서: 동일한 패턴을 가진 관리된 디스크 스냅샷.

### 계층 2  모델 스트리밍 (Run:ai 모델 스트리머)

첫 번째 요청에 응답하기 전에 전체 파일을 로드하는 대신 GPU 메모리 계층별로 무게를 스트리밍하고 첫 번째 트랜스포머 블록이 거주하는 즉시 처리 시작하십시오. NVIDIA Run:ai Model Streamer는 vLLM 2026에서 원산적으로 배포됩니다. S3, GCS 및 로컬 NVMe와 작동합니다.

### 계층 3  GPU 메모리 스냅샷 (모달)

모달은 첫 번째 로드 후 GPU 상태 (중량, CUDA 그래프, KV 캐시 지역) 의 체크포인트를 취합니다. 이후 재시작보다 10x 더 빨리 HBM에 직접 탈퇴합니다. 이것은 "온 GPU를 2 초 안에 시작"하는 가장 가까운 것입니다.

### 계층 4  따뜻한 수영장 (min_workers=1)

가장 간단한 완화: 항상 한 복사본을 준비하십시오. 비용은 GPU의 시간당 속도 24x7입니다. 작은 모델에서 수산학은 잔인합니다 (당신은 지불합니다)$0.85-$30s의 냉동 시작을 피하기 위해 1.50/h) 그리고 큰 것을 친절하게 (5분의 냉동 시작을 피하기 위해 4 $ /h) SLA 임대: 일반적으로 70B+ 모델에서 TTFT P99 < 60s.

### 5층  계층 로딩 (ServerlessLLM)

서버리스LLM은 저장소를 계층으로 취급합니다. NVMe (빠른하지만 큰), DRAM (중소하지만 계층), HBM (작은하지만 즉각적인). 무게는 DRAM에 미리 로드됩니다. 수요에 로드-온-디맨드 HBM로 로드됩니다. 종이에서는 냉동 로드에서 순진 디스크-to-HBM에 대한 지연률 10-200x 감소를 보고합니다. 생산 채택은 초기이지만 vLLM와 통합이 있습니다.

### 계층 6  생중계 마이그레이션 (보너스 패턴)

노드가 사용할 수 없게 되면 (점 배척, 노드 배척), 전통적인 패턴은 다른 복사본을 냉동 시작하여 배척 요청 줄을 말한다. 라이브 마이그레이션은 입력 토큰 (킬로바이트) 을 모델이 로드된 목적지로 이동하고 목적지에 KV 캐시를 재 계산합니다. KV 캐시를 네트워크로 전송하는 것보다 재 계산은 저렴합니다. 분산 배포에 적용됩니다.

### 온수수수 수학

2s의 P99 TTFT SLA를 가진 서비스에서, 질문은 "온수 수영장 예/아니오"가 아니라 "무엇이 따뜻한 복사본, 그리고 어떤 경로는 그것을 얻을 수 있습니다".

- 고부가가치 인터랙티브 경로 (살아있는 채팅, 음성 에이전트): `min_workers=1-2`- 그래
- 배경 배트 경로 (밤별 분류): 스케일에서 0까지 허용되며 5-10 분 냉동 시작이 용납됩니다.
- 프리미엄 계층: `min_workers`전용 용량을 가진 임차주당

### 최적화 전에 측정

신선한 노드에서 70B 모델의 냉동 시작 해부학 (사유):

| Phase | Time | Mitigation |
|-------|------|-----------|
| Node provision | 50s | Bottlerocket + pre-seeded image, warm pool |
| Image pull | 180s | Pre-seeded data volume (eliminate) |
| Weights to HBM | 75s | Model streamer (halve); GPU snapshot (eliminate) |
| Engine init | 20s | Persistent CUDA graph cache |
| First forward | 3s | Min inherent latency |
| **Total cold** | **328s** | |
| **Total with mitigations** | **~15s** | 22x reduction |

### 기억해야 할 숫자

- 모달 냉동 시작: 2-4s (GPU 스냅샷)
- 베세텐 기본 냉동 시작: 5-10s; 사전 온화 하에서 초초
- 초자연 70B 냉동 시작: 3-8 분
- :ai 모델 스트리머: ~ 2x 무게 로드 가속화
- 서버리스LLM 계층 로딩: 10-200x 지연 감소 (문서 번호).

```figure
cold-start-pipeline
```

## 사용 하 고

`code/main.py`각 완화와 함께 냉동 시작 경로를 모델링합니다. 냉동 시작 시간, 온수 수영장 비용 및 온수 수영장이 스스로 지불하는 해체 요구 비율을 보고합니다.

## 선박

이 교훈은`outputs/skill-cold-start-planner.md`SLA, 모델 크기와 교통 형태를 고려하면, 어떤 완화제를 쌓아야 하는지 선택합니다.

## 운동

1. 달아`code/main.py`SLO에서 추가 요청 하락을 통해 냉동 시작 세금을 지불하는 것보다 더 저렴한 따뜻한 복사본이 더 높은 분쇄 요구 비율을 계산합니다.
2. 3s의 P99 TTFT SLA를 가진 13B 모델을 배치하고 최소 완화 스택을 선택하세요
3.  샷 전시 시는 이미지 유력을 제거하지만 무게는 여전히 스냅샷에서 HBM로 로드됩니다. 스냅샷 뒷받침 NVMe가 7 GB/s에서 읽으면 70B 모델의 벽 시계 계산하십시오.
4. 서버 없는 공급자는 GPU 스냅샷을 제공하지만, 팀은 "스냅샷이 PII를 누출한다"는 이유로 거절합니다. 양측이 논쟁합니다.
5. 차원별 온도수 분기 정책을 설계하세요. 유료 사용자, 시험 사용자, 그리고 일차 작업량에 대해 몇 개의 온도 복사본을 작성하세요? 수학을 보여주세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cold start | "the big pause" | Time from request to first token on a fresh replica |
| Warm pool | "always-on minimum" | `min_workers >= 1` to keep at least one replica ready |
| Pre-seeded image | "baked AMI" | Node image with container weights pre-resident |
| Bottlerocket | "AWS node OS" | AWS container-optimized OS with dual-volume snapshot support |
| Model streamer | "streaming load" | Overlap weights I/O with compute setup |
| GPU snapshot | "checkpoint to HBM" | Serialize post-load GPU state; deserialize on restart |
| Tiered loading | "NVMe + DRAM + HBM" | Hierarchy of storage tiers; load on demand |
| Live migration | "move tokens" | Transfer input (KB), recompute KV on destination |
| `min_workers` | "warm replicas" | Serverless minimum keep-alive count |
| Scale-to-zero | "full serverless" | No cost when idle; accept full cold-start tax |

## 더 많은 읽기

- [Modal — Cold start performance](https://modal.com/docs/guide/cold-start) 모달의 공개된 기준과 체크포인트 구조.
- [AWS Bottlerocket](https://github.com/bottlerocket-os/bottlerocket) 사전 심어진 데이터 볼륨 스냅샷 패턴
- [NVIDIA Run:ai Model Streamer](https://github.com/run-ai/runai-model-streamer)  계산 설정으로 겹치는 무게 부하
- [Baseten — Cold starts](https://docs.baseten.co/deployment/autoscaling/cold-starts) 전 온난화 게임
- [ServerlessLLM paper (USENIX OSDI'24)](https://www.usenix.org/conference/osdi24/presentation/fu) 계층형 로딩 설계
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) 분산 배치에 대한 생중계 마이그레이션
