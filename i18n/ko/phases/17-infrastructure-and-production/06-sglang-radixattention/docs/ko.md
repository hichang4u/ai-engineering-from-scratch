# 사전-카시 서비스  라디엑스 주의 및 KV 재사용

> KV 캐시를 라디크스 트리에 저장된 1급, 재사용 가능한 자원으로 취급하고, 그와 함께 스케줄 변경: FCFS (첫 번째 온, 첫 번째 서비스) 대신 vLLM 스케줄으로, 캐시 인식 스케줄러는 더 긴 공유 프리픽스를 가진 요청에 우선 순위를 부여합니다. SGLang은 이 아이디어를 기반으로 만든 엔진입니다. ShareGPT와 같은 1K 명령어를 가진 Llama 3.1 8B에서, SGLang은 ~16,200 tok/s를 vLLM의 ~12,500에 도달합니다. 초등기 중고 RAG 작업량에서 이점은 6.4x에 도달합니다. 음성 복제형 작업량에 캐시 접속률은 86%가 감소했습니다. 2026년에 400,000+ GPU에 배포될 xAI, LinkedIn, Cursor, Oracle, GCP, Azure, AWS. 6.4x 숫자는 선문 명령이 불합동할 때 증발한다는 것이 문제입니다

**Type:** Learn
**Languages:** Python (stdlib, toy radix-tree cache + cache-aware scheduler)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 14 (Agentic RAG)
**Time:** ~75 minutes

## 학습 목표

- 다이어그램 래디크스 주의: 래디크스 트리에 사전값이 저장되는 방법과 같은 가지에서 뿌리를 둔 염기서열에 KV 블록이 공유되는 방법.
- 캐시 인식의 스케줄링과 FCFS가 왜 초음식 트래픽에 잘못되었는지 설명하십시오.
- 사전 캐시 히트 속도와 신속한 길이가 분포된 작업 부하에 대한 예상 가속을 계산한다.
- 6.4x 숫자가 실재하고 손실된 우스바이스가 되는 프롬프트 오더링 규율을 명명하세요.

## 문제

클래식 서비스에서는 각 요청의 프롬프트를 불투명한 것으로 취급합니다. 5,000개의 RAG 요청이 모두 같은 2,000 토큰 시스템 프롬프트를 시작하여 동일한 검색 프리럼블을 추가하면, vLLM는 2,000 토큰 프리픽스를 5,000번으로 채우게 됩니다. GPU는 같은 작업을 반복합니다.

관찰: 에이전시 및 RAG 작업 부하의 명령어는 거의 항상 긴 사전을 공유합니다. 시스템 명령어, 도구 스케마, 몇 번의 예제, 검색 헤더, 대화 역사  모든 요청 중 반복됩니다. 그 사전을 위해 KV 캐시를 한 번 저장하고 다시 사용했다면, 다시 미리 작성하지 않을 것입니다.

라디엑스 애테넌스는 정확히 이렇게 합니다. 토큰은 라디엑스 트리에 지표가 되어 있습니다. 각 노드는 루트에서 트로켓 순서에 대한 KV 블록을 소유하고 있습니다. 새로운 요청은 트리를 걷습니다. 토큰이 일치하는 모든 노드는 그 노드의 KV 블록을 재사용합니다. 사전 작성 비용은 전체 프롬프트가 아닌 "새로운" 후자리에 비례적으로됩니다.

2개의 요청이 2000개의 토큰의 표본을 공유하고 3번째가 같은 표본의 200개의 표본을 공유한다면, 두 개의 긴 공유 요청을 함께 서비스하고, 긴 표본이 HBM에 남아있도록 합니다. FCFS는 반대합니다.

## 개념

### KV 지표로 래딕스 트리

라디엑스 트리 (공포트 트리) 는 토큰 순서를 저장합니다. 각 노드는 토큰 범위와 KV 블록이 해당 범위에 계산됩니다. 아이들은 순서를 하나 또는 더 많은 토큰으로 확장합니다.

```
root
 |- "You are a helpful assistant..."  (2,000 tokens, 124 KV blocks)
      |- "Context: <doc A>..."        (500 tokens, 31 blocks)
           |- "Question: Alice..."    (80 tokens, 5 blocks)
           |- "Question: Bob..."      (95 tokens, 6 blocks)
      |- "Context: <doc B>..."        (520 tokens, 33 blocks)
```

새로운 요청은 시스템 프롬프트 + "콘텍스트: <doc A>" + "문제: 캐롤"로 제공됩니다. 스케줄러는 시스템 프리픽스 일치 (124 블록 재사용), doc-A 분기 일치 (31 블록 재사용), 다음 "문제: 캐롤" (4 블록) 에 대한 신선한 블록을 할당합니다. 사전 작성 비용은: 4 블록 새로운 토큰. 나무 없이: 160 블록. ~ 40x 사전 작성에 대한 저축.

### 캐시 인식 스케줄링

라디엑스 트리 지원된 재사용은 캐시가 작동하면 의미가 없습니다. 두 가지 주요 정책:

1. **Depth-first dispatch**.열에서 다음 요청을 선택할 때, 현재 실행 세트와 같은 분과에서 뿌리를 둔 요청을 선호합니다. 이것은 뜨거운 분자를 고정합니다.
2. **LRU at branch level, not block level**. 개별 블록보다는 전체 가지 (최소 사용 된 잎을 시작으로) 를 제거하여 캐시 모양이 라디크스 모양과 일치하도록 한다.

FCFS는 둘 다 위반합니다. 2,000개의 토큰을 공유하는 요청은 50개의 토큰을 공유하는 요청에 뒤쳐집니다.

### 기억해야 하는 벤치마크 번호

- Llama 3.1 8B, H100, ShareGPT 1K 명령어: SGLang ~ 16,200 tok/s vs vLLM ~ 12,500 (~ 29% 가장자리).
- 사전 중성 RAG ( 같은 시스템 + 동일한 문서, 다른 질문): SGLang에서 최대 6.4x.
- 음성 복제 작업량: 86.4%의 사전 캐시 잇률
- SGLang 고객들 중 생산률: 신속한 규율에 따라 50-99%.
- 2026년에 400,000+ GPU에 배치됩니다.

### 주문은 받아줬어

6.4x 숫자는 일관된 프롬프트 템플릿 주문에 의존합니다.`[system, tools, context, history, question]`일부 요청에 따라`[system, context, tools, history, question]`다른 경우 나무는 공유 된 사전을 찾을 수 없습니다. 인간에 공유된 사전처럼 보이는 것은 두 개의 서로 다른 행렬입니다.

엔지니어의 레버: 당신의 프롬프트 템플릿은 캐시 키입니다. 순서를 수정하십시오. 변함없는 모든 것을 먼저 넣으십시오 (시스템, 도구, 계획). 다음으로 검색 컨텍스트를 넣으십시오. 마지막에 사용자 질문을 넣으십시오. 동적 콘텐츠를 사전으로 얽매이지 마십시오.

연구에서 실제 사례: 캐시 가능한 사전에서 동적 콘텐츠를 이동하는 것은 한 변경에서 7%에서 74%의 캐시 샷률으로 한 배포를 가져왔다.

### 라디엑스 아테넌스가 승리하고 패배하는 곳

승자:
- RAG ( 같은 검색 선두, 다른 질문)
- 에이전트 ( 동일한 도구 스케마, 다른 질의).
- 긴 시스템 초청으로 채팅하세요.
- 반복된 선문으로 음성/비전 작업량

손실 (vLLM 수준의 처리량을 반환):
- 고유의 명령어 (코드 완료, 시스템 명령어 없이 오픈된 채팅) 를 가진 단일샷 생성
- 동적 명령어, 각 요청이 고유한 내용을 사전으로 엮어 놓는

### 왜 이것은 단지 커널 문제일 뿐 아니라 스케줄러 문제일까요?

KV 재사용을 커널 트릭으로 구현할 수 있다. SGLang의 통찰은 재사용이 커널 트릭을 하에만 스케줄러가 핫 브랜치 레지던트를 유지한다면 지불된다는 것이다. 순진한 "재사용 가능하다면" 정책은 혼합 부하에 캐시를 을 것이다. 라디엑스 트리 인덱스 스케줄러는 커널 트릭을 29% 생산 우위를 만드는 것입니다.

### vLLM와의 상호작용

두 시스템은 엄격한 경쟁자 아닙니다. 2026 년 에 vLLM 는 사전 캐시 (`--enable-prefix-caching` SGLang의 전체 스택은 라디크스-첫이며, vLLM가 이식했습니다. 사전 재사용으로 지배되는 작업 부하에 대해서는 SGLang은 기본으로 남아 있습니다. 강력한 사전 패턴이 없는 일반 목적 서비스에서는 vLLM는 동일하거나 더 좋습니다.

```figure
roofline
```

## 사용 하 고

`code/main.py`장난감 라디엑스 트리 KV 캐시를 추가하여 두 가지 정책으로 스케줄러를 구현합니다. FCFS 및 캐시 인식. 둘 모두에서 동일한 작업량을 실행하고, 프리픽스 캐시 히트 속도 및 처리량 델타를보고합니다. 6.4x 붕괴를 표시하기 위해 "스크램블 주문" 작업량을 실행합니다.

## 선박

이 교훈은`outputs/skill-radix-scheduler-advisor.md`. 작업량 설명 (프라임트 템플릿 모양, 검색 패턴, 동시 임대인 수) 을 고려하면, SGLang 채택에 대한 프라임트 주문 처방과 가/지 않는 처방서를 생성합니다.

## 운동

1. 달아`code/main.py`. 같은 작업량에서 FCFS와 캐시 인식을 비교하십시오.  사전 채용 저장, 디코드 저장, 또는 줄을 늦추는 데льта는 어디에서 왔습니까?
2. 작업량을 수정하여 무작위로 이동하도록 요청합니다`[system, tools, context]`다시 실행해봐요, 이 어떻게 되죠?
3. Llama 3.1 8B에 2,000 토큰 시스템 프롬프트 레지던트를 하나의 라디크스 분과로 유지하는 HBM 비용을 계산하십시오. 사전 재사용 없이 16 염기차 배트의 비용과 비교하십시오.
4. SGLang RadixAttention 논문을 읽어 보세요. 3 문장으로 설명해 주세요. 나무 모양의 LRU 배척이 앞음속 무거운 부하에서 블록 모양의 LRU를 왜 이길 수 있는지요.
5. 고객들은 8%의 캐시 샷률을 보고합니다. 3가지 가능한 원인과 각각의 진단에 대해

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| RadixAttention | "the SGLang thing" | KV cache indexed as a radix tree so shared prefixes reuse blocks |
| Radix tree | "compact trie" | Tree where each node owns a token range and its KV blocks |
| Cache-aware scheduler | "hot-branch-first" | Scheduler that prefers requests sharing the resident branch |
| Prefix-cache hit rate | "how much of your prompt was free" | Fraction of prompt tokens served from reused KV blocks |
| FCFS | "first-come first-served" | Default scheduling that breaks prefix locality |
| Branch-level LRU | "evict the leaf" | Eviction policy matched to radix shape |
| Prompt template ordering | "the cache key" | The prompt's component order determines what the tree can share |
| System prompt pinning | "resident prefix" | Keep the immutable system portion pinned to avoid eviction thrash |

## 더 많은 읽기

- [SGLang GitHub](https://github.com/sgl-project/sglang) 출처 및 문서
- [SGLang documentation](https://sgl-project.github.io/) 라디엑스 주의와 일정에 대한 세부 사항
- [SGLang paper — Efficiently Programming Large Language Models (arXiv:2312.07104)](https://arxiv.org/abs/2312.07104) 설계 참조
- [LMSYS blog — SGLang with RadixAttention](https://www.lmsys.org/blog/2024-01-17-sglang/) 기준 수치와 스케줄러의 논리
- [vLLM — Prefix Caching](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/) vLLM의 자체 로디크스형 구현, 비교하기 위해서.
