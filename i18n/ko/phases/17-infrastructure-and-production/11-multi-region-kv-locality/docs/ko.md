# 다지역 LLM 서비스 및 KV 캐시 로컬리티

> 라운드 로빈 로드 배정은 캐시된 LLM 추론에 적극적으로 해롭습니다. 그 사전을 보유한 노드에 착륙하지 않는 요청은 캐시 히트와 비교하여 긴 프롬프트에서 약 800 ms의 전충 비용을 지불합니다. 2026년 생산 패턴은 KV 캐시 이벤트와 루트를 사전-하시 일치에 소비하는 캐시 인식 라우터 (vLLM 라우터 인 러스트, llm-d 라우터) 이다. 최근 연구 (GORGO) 는 로우팅 목표에 있어서 지역 간 네트워크 지연을 명시적인 용어로 규정하고 있다. 상업적 "지역 간 추론" (Bedrock 지역 간 추론, GKE 다중 클러스터 게이트웨이) 제공은 추론을 불투명한 것으로 취급합니다 JPMorgan과 Mayo Clinic은 2024년 11월 22분쯤 동부-1의 실패를 했습니다. DR 실정: LLM DR 실패의 32%는 팀들이 무게를 백업했지만 토큰 파일이나 양자 설정을 잊었기 때문입니다.

**Type:** Learn
**Languages:** Python (stdlib, toy prefix-cache-aware router simulator)
**Prerequisites:** Phase 17 · 04 (vLLM Serving), Phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 minutes

## 학습 목표

- 왜 라운드 로빈 로드 밸런싱 브레이크가 캐시 추론을 해냈는지 설명하고 TTFT 벌금을 수치화하십시오.
- 캐시 인식 라우터를 다이어그램: 입력 (KV-캐시 이벤트), 알고리즘 (전자-하시 일치), 타이-브레이커 (GPU 활용).
- LLM (실종 토케니저 파일/량화 구성) 에 대한 32% DR 실패 드라이버를 지정하고 3 파일 DR 체크리스트를 지정하십시오.
- 지역 간 상업적 제공 (Bedrock CRI, GKE 멀티 클러스터 게이트웨이) 를 KV 인식하는 라우팅과 구별한다.

## 문제

이스트 1, 서 2, 서 1에서 서비스를 운영합니다. 당신은 라운드-로빈으로 ALB를 앞으로 넣습니다. 생산의 사전 캐시 타격률은 8%로 떨어집니다. TTFT P50를 세 배로 증가시킵니다. vLLM 로그는 모든 요청이 전면 전면 충전 비용을 지불하고 있음을 보여줍니다.

라운드 로빈은 국가 없는 서비스에서 최적입니다. LLM 추론은 설계에 의해 상태가 있습니다. KV 캐시는 모델이 본 모든 것을 암호화합니다. 라우팅 블라인드는 잘못된 캐시로 라우팅합니다.

별도로, 당신의 팀은 DR 계획을 가지고 있습니다. S3 크로스-지역으로 모델 무게를 백업합니다. 지역 중단이 발생합니다. 당신은 실패를 시도합니다. 복사본이 시작하기를 거부합니다. 당신은 tokenizer.json, 양량 설정, 그리고 RoPE 확장 설정이 동기화되지 않은 별도의 버킷에있었습니다.

다지역 LLM 서비스는 캐시 문제, 라우팅 문제, 그리고 DR 위생 문제  로드 균형 문제 아닙니다.

## 개념

### 캐시 인식하는 라우팅

요청은 프롬프트와 함께 도착합니다. 라우터는 프리픽스를 해시합니다 (예컨대 첫 512 토큰); 각 복제본에게 "이 프리픽스를 캐시하고 있습니까?"라고 묻습니다. 리픽스는 블록을 할당하고 배제하는 동안 팝/サブ 채널에서 KV 캐시 이벤트를 게시합니다. 라우터는 해당 복제본을 선택하고, 아무도 그렇지 않으면 GPU 유틸 기반 타이브 브레이커로 넘어갑니다.

**vLLM Router**(Rust, 2026 생산배): 가입자`kv.cache.block_added`이벤트, 사전-하시 → 복제 지수를 유지, $O(1)$경기가 없을 때 가장 낮은 질서 깊이를 통과합니다.

**llm-d router**: 같은 패턴, Kubernetes-이스민. ControlPlane API를 통해 이벤트를 게시합니다.

**SGLang RadixAttention**(단계 17 · 06) 은 내형형 동원형이다.

### 숫자

2K 토큰의 요청에 TTFT P50, Llama 3.3 70B FP8, H100:
- 캐시 출력 (함께 복사본, 사전 주거): ~80 ms.
- 캐시 미스 (냉면 사전 채우기): ~ 800 ms.

10x 격차. 만약 라우터가 60~80%의 전자 캐시를 초음으로 하면, N-중음 용량에서 단일 초음 성능을 대략적으로 나타냅니다. 만약 10%를 초음하면, 순진한 스케일링을 대략적으로 나타냅니다.

### 크로스-지역은 새로운 제약을  네트워크 지연

지역 간 RTT:
- US-East-1  US-West-2: ~65 ms
- 미국 동-1  유럽 서-1: ~75 ms.
- US-East-1  ap-southeast-1: ~ 220 ms.

로우팅이 us-east-1에서 ap-southeast-1에서 뜨거운 사전으로 요청하는 경우 저장된 사전 채용 (800 → 80 ms) 은 440 ms 반여행으로 미미화됩니다. GORGO (2026 연구) 는 이것을 명시적으로  최소화합니다.`prefill_time + network_latency`종종 그 답은, 사전 채워가 지배하는 대규모의 다MB 전두환을 제외하고는 지역 로우팅을 계속하는 것입니다.

### 상업적 "지역 간 추론"은 여기서 도움이 되지 않습니다

AWS Bedrock 크로스-지역 추론은 용량 압력 중에 다른 지역으로 요청을 자동으로 로우트합니다. 그것은 TTFT가 아닌 가용성을 최적화하고 추론을 불투명한 것으로 취급합니다. GKE 멀티 클러스터 게이트웨이는 동일한  서비스 수준의 결함이, KV 캐시의 인식이 없습니다.

이 앱을 사용할 때에도 앱 레이어 캐시 인식 라우터가 필요합니다. 그들은 "우스-이스트-1가 불타고 있다"라는 케이스를 처리합니다. 캐시 인식 라우팅은 TTFT 케이스를 처리합니다.

### DR 위생  32%의 파일 실종 문제

널리 인용된 2026 통계: LLM DR 실패의 32%는 팀이 무게를 백업했지만 잊었기 때문에 발생합니다.

- `tokenizer.json`또는`tokenizer.model`
- 양자 설정 (`quantize_config.json`, AWQ 스케일, GPTQ 0점)
- 모델에 대한 구성 (RoPE 스케일링, 주의 마스크, 채팅 템플릿)
- 엔진 구성 (`vllm_config.yaml`, 샘플링 기본 설정, LoRA 어댑터 매니페스트)

수정은 3 파일 최소 DR 매니스트입니다:

1. HF 모델 레포 (중중량 + 구성 + 토큰라이저) 에 있는 모든 파일
2. 엔진 특수한 서비스 구성
3. 배포 선언 (K8s YAML, Dockerfile, 의존성 잠금)

그리고, 3분기마다 DR 연습을 해 주죠. JPMorgan US-East-1 훈련은 2024년 11월 22분 동안 회복을 이루었습니다.

### 데이터 레지던스는 정렬

EU 고객 PHI는 EU를 떠날 수 없습니다. 캐시 인식 라우터가 US-East-1에 Paris에서 기원된 사전 일치 요청을 보내면, TTFT 이득에 관계없이 GDPR를 위반했습니다. 캐시 최적화 전에 거주 경계에 따라 라우터를 파티션하십시오.

### 기억해야 할 숫자

- 캐시 히트 vs 미스 TTFT 격차: ~ 10x (2K 프롬프트에서 80 ms vs 800 ms).
- 지역 간 RTT 미국-EU: ~75 ms.
- DR 실패: 32%는 토큰화/ 양자 구성을 놓치고 있습니다.
- JPMorgan US-East-1 실패기 2024년 11월: 22분 (30분 SLA)

```figure
cache-aware-router
```

## 사용 하 고

`code/main.py`다지역 작업량에서 세 가지 라우팅 전략을 시뮬레이션합니다 (라운드 로빈, 캐시 인식 지역, 캐시 인식 글로벌). 캐시 히트률, TTFT P50/P99 및 크로스-지역 청구서를 보고합니다.

## 선박

이 교훈은`outputs/skill-multi-region-router.md`지역, 거주 제한 및 SLA를 고려하여, 로우팅 계획을 수립합니다.

## 운동

1. 달아`code/main.py`75 ms RTT를 고려하면 지역 간 라우팅은 지역에서만 라우팅을 이기는 속도 길이가 얼마나 될까요?
2. 캐시에 대한 공격률이 70%에서 12%로 떨어집니다. 가능한 3가지 원인과 각각의 확인을 위한 관찰 가능한 원인을 진단하세요.
3. vLLM에서 제공되는 70B AWQ 양자 모델에 5개의 LoRA 어댑터를 가진 DR 매니스트를 설계하고 모든 파일과 구성을 나열합니다.
4. 엄격한 TTFT SLOs를 가진 Fintech에 대해 Bedrock 지역 간 추론이 "충분하다"는지를 주장합니다. 특정 행동을 인용하십시오.
5. 파리 출처 요청은 동부 1에서 표와 일치합니다

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cache-aware routing | "smart LB" | Route on prefix-hash match to KV-cache-holding replica |
| KV-cache events | "cache pub-sub" | Replicas publish block add/evict; router indexes |
| Prefix hash | "cache key" | Hash of first N tokens used as router lookup |
| GORGO | "cross-region routing research" | arXiv 2602.11688; network latency as explicit term |
| Cross-region inference | "Bedrock CRI" | AWS product; availability failover, not TTFT awareness |
| DR manifest | "the backup list" | Every file needed to restore — not just weights |
| Data residency | "GDPR boundary" | Legal constraint on which region sees user data |
| RTT | "round-trip time" | Network latency; 75 ms US-EU, 220 ms US-APAC |
| LLM-aware LB | "cache-hit LB" | Cache-aware router as a product category |

## 더 많은 읽기

- [BentoML — Multi-cloud and cross-region inference](https://bentoml.com/llm/infrastructure-and-operations/multi-cloud-and-cross-region-inference)
- [arXiv — GORGO (2602.11688)](https://arxiv.org/html/2602.11688v1) 네트워크 지연 기간을 가진 지역 간 KV 캐시 재사용
- [TianPan — Multi-Region LLM Serving Cache Locality](https://tianpan.co/blog/2026-04-17-multi-region-llm-serving-data-residency-routing)
- [AWS Bedrock Cross-Region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html) 가용성 결제 문서
- [vLLM Production Stack Router](https://github.com/vllm-project/production-stack) 캐시 인식 라우터 소스
