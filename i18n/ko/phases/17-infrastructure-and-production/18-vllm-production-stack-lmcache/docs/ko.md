# 생산 서비스 스택  KV 탈하드 및 캐시 인식 라우팅

>  큐버네티스 배포 1개에 스택 와이어 라우터, 엔진 및 관찰성을 서비스하는 생산 및 GPU를 떠날 수있는 자원으로 KV 캐시를 취급합니다. KV 아웃로드는 GPU 메모리에서 KV 캐시를 추출하고 쿼리 및 엔진 (CPU DRAM, 다음 디스크/Ceph) 에서 재사용합니다. vLLM의 생산-배는 참조 배포; LMCache는 배포 계층입니다. vLLM 0.11.0 KV 오프로드 커넥터 (2026년 1월) 는 커넥터 API (v0.9.0+) 를 통해 비동기적이고 플러그 할 수 있게 한다. 오프로드 경로는 일반적으로 요청 경로에서 숨겨져 있지만 캐시 오류와 프로모션은 엔드-투-엔드 지연을 추가 할 수 있습니다. LMCache는 공유 된 사전값이 없어도 가치가 있습니다. GPU가 KV 슬롯이 부족하면, 사전 요청은 CPU에서 재회정하는 대신 복원 할 수 있습니다. 4 a3-highgpu-4g에서 16x H100 (80GB HBM) 를 통해 공개된 벤치마크: KV 캐시가 HBM를 초과하면, 네이티브 CPU 오프로드와 LMCache 모두 처리량을 크게 향상시킵니다. 낮은 KV 발자국에서는 모든 구성은 작은 오버헤드와 기본 라인을 일치합니다.

**Type:** Learn
**Languages:** Python (stdlib, toy KV-spill simulator)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 17 · 06 (SGLang/RadixAttention)
**Time:** ~60 minutes

## 학습 목표

- vLLM 생산 스택 계층의 다이어그램: 라우터, 엔진, KV 오프로드, 관찰 가능
- KV 오프로드 커넥터 API (v0.9.0+) 를 설명하고 0.11.0 비동기 경로가 오프로드 지연을 어떻게 숨기는지를 설명합니다.
- LMCache CPU-DRAM가 도움이 되는 경우 (KV > HBM) vs 추가적인 비용 (KV가 HBM에 적합할 만큼 작다) 를 정량화하십시오.
- 배포 제한을 고려하여 vLLM CPU의 네이티브 오프로드와 LMCache 커넥터 사이에서 선택하십시오.

## 문제

vLLM 서버는 GPU를 100% HBM에서 표시하고 동시값이 상승할 때마다 사전 이벤트를 제공합니다. 요청은 배제되고, 리큐가 됩니다. 그리고 같은 2K 토큰 요청을 1 분당 4 번 다시 미리 작성합니다. GPU 계산은 과잉 사전 채용에 사용됩니다.

더 많은 GPU를 추가하는 것은 선형적으로 비용이 들지 않습니다. 더 많은 HBM를 추가하는 것은 불가능합니다. 그러나 CPU DRAM는 저렴합니다. 1 소켓은 HBM보다 더 나쁜 지연 순서로 512 GB+를 가지고 있지만 "임시적으로 따뜻" KV 캐시에는 좋습니다.

LMCache는 KV 캐시를 CPU DRAM에 추출하여 사전 요청이 신속하게 복구되며 엔진을 통해 반복되는 사전들은 각 엔진을 다시 채우지 않고 캐시를 공유합니다.

## 개념

### vLLM 생산 패크

`github.com/vllm-project/production-stack`참고 Kubernetes 배포:

- **Router** 캐시 인식 (단계 17 · 11) KV 이벤트를 소비합니다.
- **Engines** vLLM 노동자: GPU 또는 TP/PP 그룹에 한 명
- **KV cache offload** LMCache 배포 또는 네이티브 커넥터
- **Observability** 프로메테우스 스크래프, 그래파나 패시보드, OTel 추적
- **Control plane** 서비스 발견, 구성, 롤링 업데이트.

헬프 차트 + 운영자로 배송되었습니다.

### KV 탈하 연결기 API (v0.9.0+)

vLLM 0.9.0는 플러그 할 수 있는 KV 캐시 백엔드를 위한 커넥터 API를 도입했습니다. 엔진은 커넥터에 블록을 다운로드 합니다. 커넥터는 그것들을 저장합니다. (RAM, 디스크, 객체 저장장치, LMCache). 요청은 블록이 필요합니다. 커넥터는 다시 로드합니다.

vLLM 0.11.0 (2026년 1월) 는 비동기적인 탈하하 경로를 추가합니다. 엔드-투-엔드 지연 및 처리량은 여전히 작업 부하 모양, KV 캐시 타격 속도 및 시스템 압력에 달려 있습니다. vLLM의 자체 메모는 사용자 지정 커널 해하산이 낮은 타격 속도에 처리량을 저하시킬 수 있으며 아싱크 스케줄링은 추측적 디코딩과 상호 작용 문제를 알고 있습니다.

### 네이티브 CPU 오프로드 vs LMCache

**Native vLLM CPU offload**: 엔진 로컬. 호스트 RAM에 KV 블록을 저장합니다. 구현 속도가 빠르다, 네트워크 점프가 제로입니다. 엔진을 넘지 않습니다.

**LMCache connector**: 클러스터 규모. 공유된 LMCache 서버 (CPU DRAM + Ceph/S3 레벨) 에서 블록을 저장합니다. 블록은 모든 엔진에 액세스 할 수 있습니다. 16x H100 벤치마크가 공개되었습니다.

단일 엔진이 HBM 압력을 가지고 있을 때 네이티브를 선택하십시오. 여러 엔진이 프리픽스를 공유할 때 LMCache를 선택하십시오 (공동 시스템 명령어와 함께 RAG, 공유 템플릿과 함께 멀티 임차).

### 벤치마크 행동

16x H100 (80 GB HBM) 는 4 a3-highgpu-4g 테스트에 걸쳐 퍼져 있습니다.

- 낮은 KV 발자국 (단순의 명령어, 낮은 동시): 모든 구성은 기본 라인에 일치하며 LMCache는 ~ 3-5%의 오버헤드를 추가합니다.
- 중소적인 발자국: LMCache는 엔진에서 사전 재사용에 도움이 됩니다.
- KV는 HBM를 초월합니다. 네이티브 CPU 오프로드와 LMCache 모두 처리량을 크게 향상시킵니다.

### LMCache가 결정적인 경우

- 여러 임차가 있는 서비스, 시스템 명령이 임차가 공유되는 서비스
- RAG는 문서 조각들이 질의에서 반복되는 곳입니다.
- 기본 모델 KV 재사용이 과잉 작업을 줄이는 동일한 기반에 있는 미세조형 변종 (LoRA)
- 사전 과잉 작업: 재충전보다 CPU에서 복구하는 것이 더 저렴합니다.

### 언제 NOT를 활성화할 수 있는 경우

- 작은 HBM 압력  당신은 혜택을 받지 않고 대비를 지불합니다.
- 짧은 맥락 (<1K 토큰)  전송 시간 > 재전시
- 단 임차인 단 임차 작업량  재사용이 없으므로 캡처할 수 없습니다.

### 분산된 서비스와 통합

17단계 · 17 분산된 서비스 + LMCache 화합물: KV가 LMCache의 사전填充 풀에서 사용하지 않는 경우 풀 땅에 복제합니다. 이후의 쿼리는 LMCache에서 철수합니다. 17단계 · 11 캐시 인식 라우터는 로이팅을 통해 로이팅을 수행 할 수 있습니다.

### 기억해야 할 숫자

- vLLM 0.9.0: 연결기 API가 출력되었습니다.
- vLLM 0.11.0 (2026년 1월): 비동기적인 비하하하하 경로; 엔드-투-엔드 지연성 영향은 작업량, KV 히트 속도 및 시스템 압력에 달려 있습니다 ( 절대적인 보증은 아닙니다).
- 16x H100 기준: KV 발자국 HBM를 초과할 때 LMCache는 도움이 된다.
- 작은 HBM 압력: 3~5%의 상부 비용, 이득이 없습니다.

```figure
zero-sharding
```

## 사용 하 고

`code/main.py`LMCache와 없이 전제중고 작업량을 시뮬레이션 합니다.

## 선박

이 교훈은`outputs/skill-vllm-stack-decider.md`. 작업 부하 형태와 vLLM 배포를 고려하면 네이티브 vs LMCache vs 둘 다 결정됩니다.

## 운동

1. 달아`code/main.py`LMCache는 어떤 HBM 사용으로 돈을 지불하게 되죠?
2. 임차자는 6K 토큰 시스템 스프릿을 200 개의 조회/시간에 공유합니다. 임차당 예상 LMCache 저축을 계산합니다.
3. LMCache 서버는 단 하나의 실패점입니다. HA 전략을 설계하십시오.
4. LMCache는 회전 디스크에 Ceph에 저장합니다. 70B FP8 (500 MB) 의 4K 토큰 KV에 대해, 읽기 시간은 다시 채워주면 얼마일까요?
5. vLLM 0.11.0 비동기 경로가 "자유"인지 여부를 주장합니다

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Production-stack | "the reference deployment" | vLLM's Kubernetes Helm chart + operator |
| Connector API | "KV backend interface" | vLLM 0.9.0+ pluggable KV store interface |
| Native CPU offload | "engine-local spill" | Store KV in host RAM of same engine |
| LMCache | "cluster KV cache" | Cross-engine KV cache server on CPU DRAM + disk |
| 0.11.0 async | "non-blocking offload" | Offload hidden behind engine stream |
| Preemption | "evict to make room" | KV cache shuffle when HBM full |
| Prefix reuse | "same system prompt" | Multiple queries share beginning; cache hit |
| Ceph tier | "disk tier" | Durable storage below DRAM in the cache hierarchy |

## 더 많은 읽기

- [vLLM Blog — KV Offloading Connector (Jan 2026)](https://blog.vllm.ai/2026/01/08/kv-offloading-connector.html)
- [vLLM Production Stack GitHub](https://github.com/vllm-project/production-stack) 헬프 차트 + 운영자
- [LMCache for Enterprise-Scale LLM Inference (arXiv:2510.09665)](https://arxiv.org/html/2510.09665v2)
- [LMCache GitHub](https://github.com/LMCache/LMCache) 연결기 구현
- [vLLM 0.11.0 release notes](https://github.com/vllm-project/vllm/releases) 비동기 경로 세부사항
