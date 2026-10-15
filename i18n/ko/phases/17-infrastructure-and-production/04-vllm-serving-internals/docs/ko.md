# 엔진 내부를 서비스 하는  페이지 주의, 지속적인 배팅, 쪼개진 사전 채팅

> 현대 서비스 엔진의 출력은 단 하나의 트릭이 아니라 세 가지 기본 결제에 기반합니다. 페이지드아트너션은 항상 켜져 있습니다. 연속 배팅은 디코드 반복 사이에 새로운 요청을 활성 배트에 주입합니다. 쪼개진 선충 조각은 긴 명령어입니다. 그래서 암호를 해독하는 토큰은 절대 굶지 않습니다. 세 가지를 모두 켜고 한 H100 SXM5에 있는 Llama 3.3 70B FP8는 128개의 동시 에서 2,200-2,400 토크/s를 밀어내면 vLLM의 기본보다 약 25% 높고, 순진한 PyTorch 루프의 3-4배를 넘습니다. 이 수업은 세 가지 기술에 대한 참조 엔진인 vLLM의 스케줄러와 주의 커널을  다이어그램을 할 수 있는 수준에서 읽고,`code/main.py`vLLM의 방식대로 스케줄을 미리 채워서 해독합니다.

**Type:** Learn
**Languages:** Python (stdlib, toy continuous batching scheduler)
**Prerequisites:** Phase 17 · 01 (Model Serving), Phase 11 (LLM Engineering)
**Time:** ~75 minutes

## 학습 목표

- KV 캐시 할당자로서 PagedAttention를 설명하십시오: 블록, 블록 테이블, 그리고 왜 분해량은 생산 부하에서 4% 미만 유지되는지 설명합니다.
- 반복 수준에서 연속적인 배치를 도표: 완성된 순서가 배치를 떠나 새로운 순서가 배치를 마감하지 않고 어떻게 결합되는지
- 한 문장에 쪼개진 사전 채우기를 설명하고 어떤 지연성 매트릭을 보호하는지 명명하십시오 (상보: 그것은 TTFT 꼬리이고 매출을 의미하지는 않습니다).
- 모든 최적화를 동시에 활성화하기 전에 버전의 호환성 매트릭스에 대한 vLLM 기능 조합을 확인하십시오.

## 문제

순수한 PyTorch 서비스 루프는 한 번에 하나의 요청을 실행합니다. 토큰화, 사전충전, EOS까지 해독, 반환. 한 사용자에게는 효과가 있습니다. 100명이면 참을성 있는 사람들이 줄을 서고 있습니다. 명백한 수정  정적 배팅 은 모든 요청을 창에서 가장 긴 명령어로 패드하고, 모든 디코드를 가장 긴 예상 출력으로 패드하고, 모든 배치를 가장 느린 순서로 막습니다. 절대 사용하지 않는 포장재에 돈을 지불하고, 빠른 요청은 느린 요청에 기다리고 있습니다.

vLLM는 3가지 문제를 동시에 해결합니다. PagedAttention는 KV 캐시 분분화를 막을 수 있습니다. 고전적인 직렬 분배 방식과 같이 GPU 메모리의 60-80%를 소비합니다. 연속적인 배팅은 요청이 배치를 디코드 반복 중 하나로 합쳐서 방치하도록 합니다. 따라서 배치는 항상 실제 작업으로 가득합니다. 쪼개진 사전충전으로 32k 토큰 명령어를 512 토큰 슬라이드로 나눌 수 있어 긴 명령어는 GPU의 모든 디코드 토큰을 얼리게 하지 않습니다.

2026년 생산 기본은 모두 작동합니다. 각각의 동작은 모두 모델이 아닌 스케줄러에 있기 때문에 이해해야 합니다.

## 개념

### 페이지드 애트런션 가상 메모리 시스템

KV 캐시`num_layers × 2 × num_heads × head_dim × seq_len × bytes_per_element`Llama 3.3 70B에 대해 8192 토큰, 즉 BF16에서 대략 1.25 GB의 순서로. 모든 요청에 대해 8192 슬롯을 미리 예약하지만 평균 요청은 1500 토큰만 사용한다면, 예약한 HBM의 약 82%를 낭비합니다. 클래식 배팅은 이 낭비를 지불합니다.

페이지드 애트런션은 OS 가상 메모리에서 아이디어를 빌려서 KV 캐시는 순서별로 인접하지 않습니다. 고정 크기의 블록 (전설 16 토큰) 로 할당됩니다. 각 순서에는 물리적 블록 ID에 논리적 토큰 위치를 지도하는 블록 테이블이 있습니다. 순서대가 할당된 블록을 넘어 성장하면 한 블록 더 추가됩니다. 완료되면 블록이 풀로 돌아옵니다.

분분율은 60-80% (고전) 에서 4% 이하로 떨어집니다. 깃발을 가진 PagedAttention를 활성화 할 수 없습니다.`--gpu-memory-utilization`(전립 0.9), vLLM에 KV 블록에 대한 HBM의 부가량과 활성화를 알려줍니다.

### 반복 수준에서 연속적인 배팅

오래된 "동적 배팅"은 배치를 채우기 위해 창을 기다렸으며, 각 순서들이 끝날 때까지 미리 채워 + 디코드 + 디코드 + 디코드를 실행했습니다. 빠른 순서들은 일찍 떠나 GPU가 느린 순서들을 완성하는 동안 무작위로 앉아있었습니다.

각각의 디코딩 단계 사이에 연속적인 배팅이 작동합니다. 실행 순서들의 집합을 `RUNNING`목록. 각 반복에서:

1. `RUNNING`EOS를 누르면 max_tokens가 삭제됩니다.
2. 스케줄러는 대기열을 보고, 무료 KV 블록이 있는 경우 새로운 순서를 허용합니다 (예충 또는 재개).
3. 앞선 패스는 지금 어떤 것이든`RUNNING`, 순서마다 새로운 토큰을 발급합니다.

배트 크기는 결코 고정된 숫자로  수 없습니다. 출력에서 다른 위치에서 순서들은 1을 융합하여 앞을 나눕니다. 2026 vLLM에서 이것을 `V1 scheduler`. 키 인바리어: 스케줄러는 디코드 반복에 따라 한 번 실행되며 요청에 따라 한 번 실행되지 않습니다.

### 쪼개진 전필은 TTFT 꼬리를 보호합니다

Prefill은 계산에 제한되어 있습니다. Llama 3.3 70B에 있는 32k 토큰 프로포트는 한 H100에 ~800 ms의 순수한 프리필을 필요로 합니다. Prefill 실행되는 동안, 패치 대기 중 다른 모든 순서에 대한 토큰을 디코드합니다. 서비스 루프에서, 한 긴 프로포트의 첫 번째 토큰 지연 (TTFT) 은 수십 명의 다른 사용자에게는 인터 토큰 지연 (ITL) 블랩이 됩니다.

스프링 프리필은 고정 크기의 스 (전설 512 토큰) 로 스프링을 나누고 각 스를 단위로 스케줄링합니다. 스 사이에는 스케줄러가 스프링 스프링을 하나의 토큰으로 진행할 수 있습니다. 스프링 프리필 레이텐시 히트를 (각 스당 몇 ms) 로 훨씬 낮은 스프링 스프링으로 교환합니다. 스프링 로드 하에서는 ~50 ms에서 ~15 ms로 떨어집니다.

### 3개의 기본 설정이 상호 작용합니다

세 가지 기능 모두 서로 가담한다. PagedAttention는 스케줄러에게 거래할 수 있는 미세한 KV 리소스를 제공합니다. 지속적인 배팅은 미세한 리소스를 필요로하므로 새로운 순서를 허용하는 것은 글로벌 리조프를 강요하지 않습니다. 쪼개진 사전 채우는 것은 스케줄러가 같은 결정입니다.`RUNNING`목록은 다른 시스템이 아니라 하나의 스케줄러 정책입니다.

모든 깃발을 알아야 할 필요는 없습니다. 스케줄러가 최적화하는 것을 알아야 합니다. KV 블록 예산에 따라 잘 공급되는,

### 호환성 매트릭스를 확인

모든 기능 조합을 vLLM 버전에 대한 호환성 매트릭스에 대한 확인을 한 번 모두 활성화하기 전에, 왜냐하면 구성 요소는 출시 간 변경되기 때문입니다. v0.18.0에서 기능 매트릭스는 퓨플리 풀 및 프리픽스 캐싱과 호환되는 것으로 추측 해독을 표시하고, 추측 해독 페이지에는 v0.15.0를 통해 파이프라인 병렬성, v0.10.0를 통해 초안 모델 추측이 알려진 두 가지 불합병성을 나열합니다. 초안 방법 자체에 대해서는 2026년 기본값은 종종 EAGLE-3 (`"method": "eagle3"`), 17 · 05 단계에 포함된

### 기억해야 할 숫자

- Llama 3.3 70B FP8, H100 SXM5, 128 동시, 모두 3개: 2,200-2,400 토크/초.
- 동일한 모델, 기본 vLLM (부품 사전 채우기) ~1,800 tok/s.
- 같은 모델, 순진한 PyTorch 앞 루프: ~600 토크/초.
- KV 분해 폐기물: 생산 부하: < 4%.
- 혼합 부하의 P99 ITL: ~15 ms, 쪼개진 사전 부하와 ~50 ms,

### 스케줄러가 어떻게 생겼는지

```
while True:
    finished = [s for s in RUNNING if s.is_done()]
    for s in finished: release_blocks(s); RUNNING.remove(s)

    while WAITING and have_free_blocks_for(WAITING[0]):
        s = WAITING.pop(0)
        allocate_initial_blocks(s)
        RUNNING.append(s)

    # schedule prefill chunks + decode in one batch
    batch = []
    for s in RUNNING:
        if s.in_prefill:
            batch.append(next_prefill_chunk(s))   # e.g. 512 tokens
        else:
            batch.append(decode_one_token(s))     # 1 token

    run_forward(batch)                            # one fused GPU call
```

`code/main.py`Stdlib Python에서 가짜 토큰 카운트와 가짜 앞뒤 지연이 있는 이 루프입니다. 실행하면 쪼개진 사전 채워가 긴 사전 채워가면서 어떻게 디코딩 순서들을 생생하게 유지하는지 보여줍니다.

```figure
tensor-parallel
```

## 사용 하 고

`code/main.py`블 가능한 기능들을 가진 vLLM 스타일의 스케줄러를 시뮬레이션합니다.

- `NAIVE`모드: 한 번에 한 요청, 배팅이 없습니다.
- `STATIC`모드: 패드 앤 워크, 클래식 배팅
- `CONTINUOUS`모드: 반복 레벨의 입수 및 방출
- `CONTINUOUS + CHUNKED`모드: 디코드로 접목된 선충 슬라이드

출력은 전체 처리량 (비추얼초당 토큰), TTFT 평균 및 P99 ITL를 보여줍니다.`CONTINUOUS + CHUNKED`라인은 혼합 교통을 지배해야 합니다.

## 선박

이 교훈은`outputs/skill-vllm-scheduler-reader.md`. 분기 구성 (배치 크기와 KV 메모리 사용량, 쪼개진 사전 채용 크기와 추측 구성) 을 고려하면 세 가지 기본 설정 중 어떤 것이 병목 장애이고 어떤 것을 조정해야 하는지를 나타내는 스케줄러 진단을 생성합니다.

## 운동

1. 달아`code/main.py`비교해 보세요`STATIC` `CONTINUOUS` 사전 채용 효율, 디코드 효율 또는 꼬리 지연성에서 출력 격차가 나오는 이유는 무엇입니까?
2. 장난감 스케줄을 변경하여 추가합니다`--max-num-batched-tokens`. Llama 3.3 70B FP8를 실행하는 H100에 대한 올바른 값은 무엇입니까? (상보: 그것은 KV 블록 크기와 자유 블록 수의 함수이며 원료 HBM가 아닙니다.)
3. vLLM v0.18.0 발매 메모를 다시 읽어보세요. 어떤 깃발 조합이 상호 배제적입니까?
4. 평균 1,500개의 출력 토큰, std 600개의 토큰, a) 8192개의 최대 요청당 연속 분배, b) 16개의 토큰 블록을 가진 PagedAttention의 1천개의 요청의 추적에 대한 KV 캐시 분분화 폐기물을 계산한다.
5. 한 문장에서 왜 쪼개진 사전 채우는 것이 P99 ITL에 도움이 되지만 단독적으로 처리량을 제공하지 않는지를 설명해 보십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| PagedAttention | "the KV trick" | Fixed-size block allocator for KV cache; fragmentation <4% |
| Block table | "the page table" | Per-sequence map from logical token position to physical KV block |
| Continuous batching | "dynamic batching, but right" | Admit/release decisions made every decode iteration |
| Chunked prefill | "prefill splitting" | Break long prefill into 512-token slices interleaved with decode |
| TTFT | "first token time" | Prefill + queue + network; dominated by prefill at long prompts |
| ITL | "inter-token latency" | Time between consecutive decode tokens; dominated by batch size |
| Goodput | "throughput that meets SLO" | Tokens/sec where every request still hit TTFT and ITL targets |
| V1 scheduler | "the new scheduler" | vLLM's 2026 scheduler; runs continuous batching with chunked prefill |
| `--gpu-memory-utilization` | "the memory knob" | Fraction of HBM reserved for KV blocks after weights and activations |

## 더 많은 읽기

- [vLLM documentation — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode/)                                                                                                                                                                                                                                                              
- [vLLM Release Notes (NVIDIA)](https://docs.nvidia.com/deeplearning/frameworks/vllm-release-notes/index.html) 2026 출시 순서 및 버전별 행동.
- [vLLM Blog — PagedAttention](https://blog.vllm.ai/2023/06/20/vllm.html) 원래의 글은 여전히 분배자에 대해 어떻게 생각해야 하는지 정의합니다.
- [PagedAttention paper (arXiv:2309.06180)](https://arxiv.org/abs/2309.06180) 분자 분석 및 스케줄러 설계
- [Aleksa Gordic — Inside vLLM](https://www.aleksagordic.com/blog/vllm) 플라임 그래프로 상세한 V1 스케줄러 걸음걸음
