# 쿠버네티스에서 GPU 자동 스케일링  카펜터, KAI 스케줄러, 갱 스케줄링

> 세층, 한층이 아니라 카펜터 프로비저닝 노드는 동적으로 (클러스터 오토스칼러보다 40% 더 빠른 1분 이하) KAI 스케줄러는 갱 스케줄링, 토폴로지 인식, 그리고 계층열을 처리합니다. 이 방법은 7개 중 8개 부분 할당 함정을 방지합니다. 응용 프로그램 수준의 오토스칼러 (NVIDIA Dynamo Planner, llm-d Workload Variant Autoscaler) 는 추론 특정 신호에 따라 스케일합니다. 고전적인 HPA 함정이 바로`DCGM_FI_DEV_GPU_UTIL`vLLM는 KV 캐시 메모리를 미리 할당하므로 메모리는 결코 확장하진 않습니다. 이 수업은 세 층을 구성하고 기본 카르펜터를 피하는 것을 가르칩니다.`WhenEmptyOrUnderutilized`GPU 작업 중간에 실행을 종료하는 정책입니다.

**Type:** Learn
**Languages:** Python (stdlib, toy queue-depth autoscaler simulator)
**Prerequisites:** Phase 17 · 02 (Inference Platform Economics), Phase 17 · 04 (Serving Engine Internals)
**Time:** ~75 minutes

## 학습 목표

- 자동 확장 계층 (노드 공급, 갱 스케줄링, 응용 레벨) 을 도표하고 각 계층에서 사용되는 도구를 이름 붙여라.
- 왜 그런지 설명 해 주십시오`DCGM_FI_DEV_GPU_UTIL`vLLM에 대한 HPA 신호가 잘못되어서 두 개의 대체 (열 깊이, KV 캐시 사용) 를 지정하십시오.
- 갱 스케줄링과 KAI 스케줄러가 방지하는 부분 분배 실패 모드를 설명하십시오 (8 GPU 중 7개)
- 카르펜터 통합 정책 (`WhenEmptyOrUnderutilized`) 를 종료하고 2026 년 에 안전한 대안을 제시 합니다.

## 문제

당신의 팀은 쿠버네티스에서 LLM 서비스를 제공하고 있습니다.`DCGM_FI_DEV_GPU_UTIL`시그널로 표시됩니다. 서비스 핀은 100% 사용시간에 있습니다. HPA는 절대 확장되지 않습니다. 이미 가득하다고 생각합니다. 수동으로 복사본을 추가합니다. TTFT는 떨어집니다. HPA는 여전히 확장되지 않습니다. 신호는 당신에게 거짓말을합니다.

별도로, 당신은 노드들을 위해 클러스터 오토스칼러를 사용합니다. 1M 토큰 요청은 새벽 2시에 도착합니다. 클러스터는 노드를 제공하는데 3 분을 소비하고 요청 시간이 종료됩니다.

또 다른 경우, 70B 모델을 배포하여 2 노드에 걸쳐 8 GPU가 필요합니다. 클러스터에는 7 GPU가 무료이고 1개가 3 노드에 걸쳐 퍼져 있습니다. 클러스터 오토스칼러 1개의 부족한 GPU를 위한 노드를 제공합니다. 7개의 노드는 돈을 태우는 동안 4 분 동안 기다립니다. 쿠버네티스는 마지막 GPU를 얻습니다.

3층, 3개의 다른 오류 모드. 2026년 GPU 인식 자동 확장은 "HPA를 켜지 않는다".

## 개념

### 계층 1  노드 프로비저닝 (카르펜터)

카펜터는 대기 중인 포드 및 프로비저닝 노드를 ~ 45-60 초 이내에 시킨다 (클러스터 오토스칼러는 일반적으로 GPU 노드에서 90-120 초를 소요합니다).`NodePool`제한  만약 당신의 포드가 8개의 H100가 필요하고 클러스터가 일치하는 노드가 없다면, 카펜터가 기존 그룹을 확장하는 대신 직접적으로 1개를 제공한다.

**The consolidation trap**: 카펜터의 결제`consolidationPolicy: WhenEmptyOrUnderutilized`GPU 풀에 위험합니다. 실행 중인 GPU 노드를 종료하여 더 저렴한 적절한 규모의 인스턴스로 포드를 마이그레이션합니다. 실행 요청들을 배제하고 새로운 노드에 70B 모델을 재충전시키는 것을 의미합니다. 손실은 분량의 용량과 요청 실패입니다.

GPU 풀에 대한 안전 설정:

```yaml
disruption:
  consolidationPolicy: WhenEmpty
  consolidateAfter: 1h
```

카펜터가 1시간 후에 진짜 빈 노드를 통합할 수 있지만, 실행 중인 일을 해내지 못하도록 해

### 계층 2  갱도 스케줄링 (KAI 스케줄러)

KAI 스케줄러 (이후 "Karp" 프로젝트로 명명) 는 기본 kube- 스케줄러가 하지 않는 것을 처리합니다.

**Gang scheduling**모든 또는 아무것도 할 수 있는 스케줄을 설정합니다. 분산 추론 포드가 8개의 GPU를 필요로 합니다. 모두 8개의 GPU가 함께 시작하거나, 모두 작동하지 않습니다. 이것 없이는 부분적으로 할당되는 함정이 있습니다. 8개의 포드 중 7개가 시작되고, 무한히 기다립니다. 돈을 태워요.

**Topology awareness** 같은 래크에 앉아 있는 NVLink을 공유하는 GPU를 알고, 그 사이에 InfiniBand를 가지고 있다. 이에 따라 pods를 배치한다. DeepSeek-V3 67B 텐서 평행 작업량은 NVLink 도메인에 남아 있어야 한다. KAI 스케줄러는 이를 존중한다.

**Hierarchical queues** 여러 팀이 동일한 GPU 풀에 대해 우선순위와 비중을 가지고 경쟁합니다. A 팀의 생산 은 B 팀의 훈련 작업에 의해 우선순위 규칙이 허용하는 경우에만 우선순위가 우선됩니다.

KAI는 kube-scheduler와 함께 부차적 스케줄러로 배치되며, 사용하려면 작업 부하를 해독합니다. Ray와 vLLM 생산 스택은 모두 통합됩니다.

### 계층 3  응용 레벨 신호

**The HPA trap**이 책:`DCGM_FI_DEV_GPU_UTIL`는 GPU가 샘플링 간격마다 작업을 수행하는지 여부를 측정합니다. 100% 활용은 10 개의 동시 요청 또는 100을 의미 할 수 있습니다. GPU는 양쪽에도 바쁘습니다. 듀티 사이클에 대한 스케일링은 맹목적으로 스케일합니다.

더 나쁜 것은 vLLM 및 유사한 엔진이 KV 캐시 메모리를 미리 할당하는 것입니다 ( 최대 `--gpu-memory-utilization`한 번만 하면 기억 사용량은 90% 가까이 유지 됩니다. 기억 기반 HPA는 결코 줄어들지 않습니다.

**2026 replacement signals**이 부분의 본문은

- 줄을 깊이 (예료를 기다리는 요청 수)
- KV 캐시 사용 (동동 순서로 할당된 블록의 분수는 얼마)
- 반사 P99 TTFT (SLA 신호)
- 좋은 출력 (초당 모든 SLO를 충족시키는 요청)

NVIDIA 다이노모 플래너와 llm-d 워크로드 변형 오토스칼러는 이러한 신호와 스케일 복제를 소비합니다. 그들은 LLM 서비스에서 HPA를 완전히 대체합니다.

### 언제 어떤 것을 사용해야 하는가

| Scale decision | Tool |
|----------------|------|
| Add/remove nodes | Karpenter |
| Schedule multi-GPU jobs | KAI Scheduler |
| Add/remove replicas | Dynamo Planner / llm-d WVA (or custom HPA on queue depth) |
| Choose GPU type | Karpenter NodePool |
| Preempt low-priority | KAI Scheduler queues |

### 분산된 사전 채우기/독독은 모든 것을 복잡하게 만듭니다.

분산된 사전충전/독독 (Phase 17 · 17) 을 실행하면, 각기 다른 확장 트리거를 가진 두 개의 pods 클래스 (pod class) 를 사용한다.`Services`HPA를 두 가지로 구분하여 두 가지 HPA를 두 가지로 구분하지 마십시오.

### 여기도 냉동 시작이 중요해요

냉동 시작 완화 (단계 17 · 10) 는 노드 구비 시간이 사용자에게 가시화되는 단계입니다. 카펜터의 45-60 초 더 이상 20GB 모델 로드 더 엔진 init 즉 0에서 요청은 2-5 분 동안 걸립니다. 따뜻한 풀을 유지하십시오 (`min_workers=1`) SLO-기술적 경로 또는 모달 방식의 체크포인팅을 응용 계층에서 사용한다.

### 기억해야 할 숫자

- 카펜터 노드 프로비저닝: ~ 45-60s vs 클러스터 오토스칼러 ~ 90-120s (GPU 노드).
- KAI 스케줄러는 부분 분배 폐기물 7/8 함정을 방지합니다.
- `DCGM_FI_DEV_GPU_UTIL`HPA 신호로: 깨진; 줄을 깊이 또는 KV 사용 사용
- 카펜터`WhenEmptyOrUnderutilized`: GPU 작업 실행을 종료합니다. 사용 `WhenEmpty + consolidateAfter: 1h`결론을 내리기 위해서

```figure
autoscaling
```

## 사용 하 고

`code/main.py`3층의 자동 스케일러를 터진 GPU 작업 부하에 시뮬레이션합니다. 순수 HPA (도무 주식), 줄을 깊이 HPA, KAI-단계 스케일링을 비교합니다. 응답되지 않은 요청, 비동기 GPU 분자 및 복합 점수를 보고합니다.

## 선박

이 교훈은`outputs/skill-gpu-autoscaler-plan.md`클러스터 토폴로지, 작업 부하 모양, SLO를 고려하면 3층 자동 확장 계획을 설계합니다.

## 운동

1. 달아`code/main.py`급격한 작업하에 순진한 직무주 HPA가 얼마나 많은 요청으로 줄을 뚫고 HPA를 잡을 수 있을까요?
2. H100 SXM5에서 Llama 3.3 70B FP8를 서비스하는 클러스터에 대한 카펜터 노드풀을 설계하십시오. 지정합니다 `capacity-type``disruption.consolidationPolicy``consolidateAfter`, 그리고 GPU가 아닌 작업량을 이 노드에서 멀리하는
3. 당신의 팀은 "GPU가 사용 가능하지만 포드가 일정을 하지 않는다" 때문에 배포가 대기 중이라고 보고합니다. 진단  이 카펜터, kube-예정기, 또는 KAI 스케줄기인가요? 어떤 측정값이 확인합니까?
4. 자율식 분산 전전 포드 신호를 선택하고 다른 신호를 디코드 포드 신호를 선택하고 둘 다 정당화하세요
5. `WhenEmptyOrUnderutilized`24×7 생산 서비스에서 통합 함정이 P99 TTFT> 10s에서 평균 60개의 요청 drop 이벤트를 / 일.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Karpenter | "the node provisioner" | Kubernetes node autoscaler; sub-minute provisioning |
| Cluster Autoscaler | "the old scaler" | Kubernetes node autoscaler predecessor; slower, group-based |
| KAI Scheduler | "the GPU scheduler" | Secondary scheduler for gang + topology + queues |
| Gang scheduling | "all or nothing" | Schedule N pods atomically or defer all of them |
| Topology awareness | "rack-aware" | Place pods based on NVLink/IB/rack placement |
| `DCGM_FI_DEV_GPU_UTIL` | "GPU utilization" | Duty-cycle metric; NOT a scaling signal for LLMs |
| Queue depth | "waiting requests" | Correct HPA signal for prefill-bound scaling |
| KV cache utilization | "memory pressure" | Correct HPA signal for decode-bound scaling |
| Consolidation | "Karpenter consolidation" | Node termination to cheaper instance type |
| `WhenEmpty + 1h` | "safe consolidation" | Policy that doesn't evict running GPU jobs |

## 더 많은 읽기

- [KAI Scheduler GitHub](https://github.com/kai-scheduler/KAI-Scheduler) 설계 문서 및 구성 예제
- [Karpenter Disruption Controls](https://karpenter.sh/docs/concepts/disruption/) 통합 정책의 의미와 GPU 안전 기본 설정
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) 다이노마 플래너 확장 신호
- [Ray docs — KAI Scheduler for RayClusters](https://docs.ray.io/en/latest/cluster/kubernetes/k8s-ecosystem/kai-scheduler.html) 레이 통합 패턴
- [AWS EKS Compute and Autoscaling Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/aiml-compute.html) 관리-Kubernetes에 대한 지침
- [llm-d GitHub](https://github.com/llm-d/llm-d) 작업 부하 변형 오토스칼러 설계
