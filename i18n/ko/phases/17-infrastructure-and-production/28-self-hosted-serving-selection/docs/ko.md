# 자율 주행 서비스 선택  하드웨어 및 규모에 맞는 엔진

> 엔진 선택은 하드웨어, 규모, 생태계의 기능입니다.  리더보드 읽은 것이 아닙니다. 2026년에 네 개의 엔진이 자기 주최 추론을 지배합니다. llama.cpp, Ollama, vLLM, SGLang, TGI는 유지보수 모드에서 뒤쳐집니다. **llama.cpp**CPU에서 가장 빠른  가장 넓은 모델 지원, 양량화 및 스레딩에 대한 완전한 통제. **Ollama**이 랩톱 컴퓨터는 1 명령 설치, llama.cpp (Go + CGo + HTTP 시리에라이징) 보다 ~15-30% 느리며, 프로드 같은 로드 아래 3x 처리량 격차를 가지고 있습니다. **TGI entered maintenance mode December 11, 2025** 버그 수정만, vLLM보다 ~10% 느린 원자력 처리량, 그러나 역사적으로 최고 관찰 가능성과 HF 생태계 통합이 있습니다. 이러한 유지보수 상태는 위험을 감수하는 장기 베팅으로 만듭니다.**vLLM**일반용 생산 기본  v0.15.1 (2026년 2월) 는 PyTorch 2.10, RTX Blackwell SM120, H200 최적화를 추가합니다. **SGLang** 400,000+ GPU 생산 중인 에이전틱 멀티 턴 / 프리픽스 중공자 (xAI, LinkedIn, 커서, 오라클, GCP, 아주어, AWS). 하드웨어 제한: CPU-first → llama.cpp. AMD/non-NVIDIA → vLLM는 가장 강력한 지원 경로 (TRT-LLM는 NVIDIA로 잠겨있다). 2026 파이프라인 패턴: dev = Ollama, 스테이지 = llama.cpp, prod = vLLM 또는 SGLang. 엔진은 다른 무게 형식을  llama.cpp 가족에 대한 GGUF, GPU 엔진에 대한 HF 안전 센서  따라서 형식의 변환이 단계 사이에있을 수 있습니다.

**Type:** Learn
**Languages:** Python (stdlib, engine-decision tree walker)
**Prerequisites:** All Phase 17 lessons covering engines (04, 06, 07, 09, 18)
**Time:** ~45 minutes

## 학습 목표

- 주어진 하드웨어 (CPU / AMD / NVIDIA Hopper / Blackwell), 규모 (1 사용자 / 100 / 10,000) 및 작업 부하 (전반 채팅 / 에이전트 / 장 контекст) 를 선택하십시오.
- 2026년 TGI 유지보수 모드 상태 (2025년 12월 11일) 를 명명하고, 왜 새로운 프로젝트를 vLLM 또는 SGLang에 편향하는지를 설명하십시오.
- 단계들 사이에 GGUF에서 안전 센서로 변환되는 곳을 포함하여 개발/단계/생산 파이프라인을 설명한다.
- "CPU-first"가 llama.cpp에 지점을 표시하고 "AMD"가 TRT-LLM를 배제하는 이유를 설명하십시오.

## 문제

팀의 새로운 LLM 프로젝트를 시작합니다. 한 엔지니어는 Ollama, 다른 엔지니어는 vLLM, 세 번째는 "TGI는 틀에서 작동하지 않습니까?"

2026년 선택 트리는 중요합니다. 하드웨어 1위, 규모 2위, 작업 부하 3위. 그리고 2025년 특정 이벤트  TGI가 유지보수 모드로 12월 11일에 들어가면 새로운 프로젝트의 기본 변경이 됩니다.

## 개념

### 5개의 엔진

| Engine | Best for | Notes |
|--------|----------|-------|
| **llama.cpp** | CPU / edge / minimal deps / widest model support | Fastest on CPU, full control |
| **Ollama** | Dev laptops, single user, one-command install | 15-30% slower than llama.cpp; 3x prod throughput gap |
| **TGI** | HF ecosystem, regulated industries | **Maintenance mode Dec 11, 2025** |
| **vLLM** | General-purpose production, 100+ users | Broad production default; v0.15.1 Feb 2026 |
| **SGLang** | Agentic multi-turn, prefix-heavy workloads | 400,000+ GPUs in production |

### 하드웨어-첫 번째 결정

**CPU-first**Ollama도 작동하지만 느려집니다. 다른 엔진은 CPU에 경쟁력이 없습니다.

**AMD GPU**→ vLLM는 가장 강력한 지원 경로 (AMD ROCm 지원). SGLang도 작동합니다. TRT-LLM는 NVIDIA가 잠겼기 때문에 꺼졌습니다.

**NVIDIA Hopper (H100 / H200)**VLLM 또는 SGLang 또는 TRT-LLM. 세 가지 모두 최고 수준입니다.

**NVIDIA Blackwell (B200 / GB200)**→ TRT-LLM는 처리량 선두주자 (단계 17 · 07). vLLM와 SGLang은 가까이서 따라가게 됩니다.

**Apple Silicon (M-series)**램마.cpp (금속) Ollama는 이것을 포장합니다.

### 2차 규모의 결정

**1 user / local dev**1개의 명령, 초 안에 첫 번째 로큰

**10-100 users / small team**→ vLLM 단일 GPU

**100-10k users / production**→ vLLM 생산 계층 (단계 17 · 18) 또는 SGLang.

**10k+ users / enterprise**→ vLLM 생산배치 + 분산 (단계 17 · 17) + LMCache (단계 17 · 18).

### 업무 부담 제3 결정

**General chat / Q&A**→ vLLM는 광범위한 기본으로 승리합니다.

**Agentic multi-turn (tools, planning, memory)**→ SGLang의 RadixAtention (단계 17 · 06) 이 지배적이다.

**RAG with heavy prefix reuse**→ SGLang.

**Code generation**→ vLLM 괜찮아, SGLang는 캐시에서 약간 더 좋아

**Long context (128K+)**→ vLLM + 조각 된 전충; SGLang + 계층 KV.

### TGI 유지 관리 함정이

Hugging Face TGI는 2025년 12월 11일 유지보수 모드로 진입했다. 역사적으로: 최고 수준의 관찰 가능, 최고 수준의 HF 생태계 통합 (모델 카드, 안전 도구), 원소 처리량에서 vLLM보다 약간 뒤떨어져있다.

2026 년 에 새로운 프로젝트 를 위해: TGI 에서 기본 설정 을 벗어 둡니다. 기존 TGI 배포 는 계속 될 수 있지만 결국 이주를 해야 합니다. SGLang 및 vLLM 는 더 안전한 기본 설정 이다.

### 파이프라인 패턴

Dev (Ollama) → 스테이지 (llama.cpp) → 프로드 (vLLM). 엔진은 다른 무게 형식을 취합니다.  llama.cpp 가족에 대한 GGUF, GPU 엔진에 대한 HF 안전 센서  그래서 형식의 변환이 단계 사이에있을 수 있습니다. 엔지니어들은 노트북에서 빠르게 반복합니다. 스테이지 거울은 생산 양식을 나타냅니다. 프로드 는 서비스 대상입니다.

### 올라마 경고

Ollama는 dev에 적합합니다. 공유 생산에 적합하지 않습니다. Go HTTP 시리에라이징은 오버헤드를 추가합니다. 동시 관리는 vLLM보다 간단합니다. OpenTelemetry 지원 지연이 있습니다. Ollama를 사용하여  하나의 사용자, 하나의 명령어 을 빛나게합니다. 공유를 위해 vLLM로 전환합니다.

### 자영용 vs 관리형은 별도의 결정입니다

17 · 01 단계 (관리된 하이퍼스칼러), · 02 (인퍼렌스 플랫폼) 커버 관리. 이 수업은 이미 자기 호스팅을 결정했다고 가정합니다. 자기 호스팅의 이유는: 데이터 레지던스, 사용자 지정 미세조, 규모의 전체 비용 소유, 호스팅에서 사용할 수 없는 도메인 모델입니다.

### 기억해야 할 숫자

- TGI 유지보수 모드: 2025년 12월 11일
- vLLM v0.15.1: 2026년 2월; PyTorch 2.10; 블랙웰 SM120 지원
- SGLang 생산 발자국: 400,000+ GPU
- Ollama 출력 격차와 llama.cpp: 15-30% 느려지, 3x 프로드 로드 아래

```figure
data-parallel
```

## 사용 하 고

`code/main.py`결정 트리 워커입니다. 하드웨어 + 규모 + 작업 부하를 고려하면 엔진을 선택하고 이유를 설명합니다.

## 선박

이 교훈은`outputs/skill-engine-picker.md`제한을 감안하면 엔진을 선택하고 마이그레이션 계획을 작성합니다.

## 운동

1. 달아`code/main.py`하드웨어/스케일/워크로드에 따라 출력이 직관과 일치하는가?
2. 인프라 12H100와 8MI300X AMD입니다. 어떤 엔진? 왜 TRT-LLM가 테이블에서 사라졌습니까?
3. 2026년 TGI를 사용하려는 팀의 경우 "우리가 아는 것"이 있습니다.
4. Ollama dev to vLLM prod: 양자화, 구성 및 관찰성에서 어떤 변화가 있습니까?
5. P99 프리픽스 길이가 8K, 임차원 중 재사용이 높은 RAG 제품. 엔진을 선택하고 17 · 11 + 18 단계로 쌓아 올립니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| llama.cpp | "the CPU one" | Widest model support, fastest on CPU |
| Ollama | "the laptop one" | One-command install, dev-grade throughput |
| TGI | "HF's serving" | Maintenance mode since Dec 2025 |
| vLLM | "the default" | Broad production baseline 2026 |
| SGLang | "the agentic one" | Prefix-heavy, RadixAttention |
| TRT-LLM | "NVIDIA-locked" | Blackwell throughput leader, NVIDIA only |
| GGUF | "llama.cpp format" | Bundled K-quant variants |
| Production-stack | "vLLM K8s" | Phase 17 · 18 reference deployment |
| Pipeline pattern | "dev→stage→prod" | Ollama → llama.cpp → vLLM; weight formats differ per engine |

## 더 많은 읽기

- [AI Made Tools — vLLM vs Ollama vs llama.cpp vs TGI 2026](https://www.aimadetools.com/blog/vllm-vs-ollama-vs-llamacpp-vs-tgi/)
- [Morph — llama.cpp vs Ollama 2026](https://www.morphllm.com/comparisons/llama-cpp-vs-ollama)
- [n1n.ai — Comprehensive LLM Inference Engine Comparison](https://explore.n1n.ai/blog/llm-inference-engine-comparison-vllm-tgi-tensorrt-sglang-2026-03-13)
- [PremAI — 10 Best vLLM Alternatives 2026](https://blog.premai.io/10-best-vllm-alternatives-for-llm-inference-in-production-2026/)
- [TGI maintenance announcement](https://github.com/huggingface/text-generation-inference) 발표 메모
- [vLLM v0.15.1 release notes](https://github.com/vllm-project/vllm/releases)
