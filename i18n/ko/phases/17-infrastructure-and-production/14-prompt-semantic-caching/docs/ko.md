# 신속한 캐싱 및 의미적 캐싱 경제

> **Pricing snapshot dated 2026-04.**아래의 수학적 주장은 이 강의 출판 당시 캡처된 공급자 요금 카드를 반영합니다. 아래의 문서에 대한 확인을 하려면 아래로 인용하십시오.

> 캐싱은 두 층에서 이루어집니다. L2 (프로바이더 레벨) 프롬프트/프레픽스 캐싱은 반복된 프롬프트 캐싱을 위해 KV를 재사용합니다.$0.30/M vs $5.00/M 신선한 5분 TTL와 1시간 TTL 옵션에 대해 2배의 쓰기 수수료 (docs.anthropic.com, 2026-04). OpenAI 프롬프트 캐싱은 자동으로 프롬프트 ≥1024 토큰과 가격에 캐싱 입력에 약 90% 할인 대 신선한 (platform.openai.com, 2026-04) 로 적용됩니다. L1 (앱 레벨) 의미 캐싱은 LLM를 완전히 흡사성 히트를 함축하는 데 뛰어넘습니다. 판매자 "95% 정확성"는 일치 정확성, 타격률을 의미하며,  보고된 생산 타격률은 10% (오픈 채팅) 에서 70% (구성된 FAQ) 까지입니다. 생산 함정이: 병렬화는 캐싱을 죽인다 (첫 번째 캐시 작성 전에 발급된 N 병렬 요청은 지출을 몇 배로 부풀릴 수 있습니다), 그리고 사전 내부의 동적 콘텐츠는 캐시 충돌을 완전히 방지합니다. 프로젝트디스커버리는 캐시 가능한 사전에서 동적 텍스트를 이동함으로써 7%에서 74%의 히트률 (2025-11) 으로 이동했다고 보고했습니다.

**Type:** Learn
**Languages:** Python (stdlib, toy two-layer cache simulator)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 minutes

## 학습 목표

- L2 프롬프트/프레픽스 캐싱 (프로버에서 KV 재사용) 과 L1 세맨틱 캐싱 ( 유사한 프롬프트에서 LLM 우회) 을 구별한다.
- 인트로피크의 설명`cache_control`명시적인 표시와 두 가지 TTL 옵션 (5분과 1시간)
- 히트율, 프롬프트/레스프레스 믹스, 토큰 가격에 따라 예상되는 월간 저축을 계산한다.
- 부가 5~10배로 부풀리는 동행성 반 패턴과 부가율을 떨어뜨리는 동적 내용 반 패턴을 명명하세요.

## 문제

RAG 서비스에 프롬프트 캐싱을 추가합니다. 청구서는 평평합니다. 당신은 히트률을 측정합니다. 그것은 7%. 당신의 프롬프트는 정적하지만 그렇지 않습니다. 시스템 프롬프트는 현재 날짜와 분으로 포맷 된 날짜, 요청 ID, 다양성을 위해 무작위로 된 예제 재편을 포함합니다. 모든 요청은 새로운 캐시 항목을 작성하고 0을 읽습니다.

개별적으로, 당신의 에이전트는 사용자 질문당 10개의 병렬 도구 호출을 실행합니다. 모든 10개가 첫 번째 캐시 작성 완료 전에 공급자에게 도착합니다. 10개가 작성하고, 0이 읽습니다. 당신의 청구서는 "캐시링"에 드는 비용의 5-10배입니다.

캐싱은 프로토콜이지 깃발이 아니라 2층, 2개의 다른 실패 모드입니다.

## 개념

### L2  공급자 프롬프트/프레픽스 캐시

제공자는 캐시 가능한 사전값을 위해 주의 KV를 저장하고 다음 요청에 재사용합니다. 사전값과 일치합니다. 한 번 쓰기 비용을 지불하면 거의 무료로 읽을 수 있습니다.

**Anthropic (Claude 3.5 / 3.7 / 4 series)**: 명시적`cache_control`요청에 표시. 당신은 캐시 가능한 블록을 표시합니다. TTL: 5 분 (쓰기 비용은 1.25x 기본) 또는 1 시간 (쓰기 비용은 2x 기본) 캐시는 이렇게 읽습니다: $0.30/M on Claude 3.5 Sonnet vs $3.00/M 신선  10배 더 저렴 (docs.anthropic.com, 2026-04) 모델마다 가격이 달라집니다 (Opus/Haiku는 별도로 게시됩니다); 항상 라이브 가격 페이지를 횡단 확인하십시오.

**OpenAI**: 자동 캐시: 프롬프트 ≥1024 토큰 (platform.openai.com, 2026-04). 명시적인 플래그가 없습니다. 캐시 입력은 현재 gpt-4o/gpt-5 속도 카드에 대한 신선한 것보다 약 10배 더 저렴합니다. 문서나 발매 메모는 공식적인 히트 비율 기준을 발표하지 않습니다. 커뮤니티 보고서들은 신중한 프롬프트 디자인으로 30~60% 정도를 집합합니다. 모니터링 `usage.cached_tokens`자신의 것을 측정하기 위해서요.

**Google (Gemini)**: 명시적인 API를 통해 컨텍스트 캐싱; 1M 토큰 컨텍스트는 캐싱이 더 많은 비용을 지불한다는 것을 의미합니다.

**Self-hosted (vLLM, SGLang)**: 17 · 06 단계 는 RadixAtention  자신의 계산에서 동일한 패턴을 포함합니다.

### L1  앱 레벨의 의미 캐싱

LLM에 전화를 걸기 전에, 프롬프트를 해시하고 삽입하고 비슷한 캐시 요청을 검색하십시오 (목적보다 높은 동생 유사성, 일반적으로 0.95+). 히트하면 캐시 된 응답을 반환하십시오. 미스하면 LLM에 전화를 걸어 결과를 캐시하십시오.

오픈소스: 레디스 벡터 유사성, GPTCache, Qdrant. 상업적: 포트키 캐시, 헬리콘 캐시.

공급자의 정확성 주장은 반환된 캐시 응답이 얼마나 자주 의미적으로 적절했는지에 관한 것입니다.

- 개방형 채팅: 10-15%.
- 구조화된 FAQ/ 지원: 40-70%
- 코드 질문: 20-30% (작은 변종은 히트를 죽인다).
- 음성 에이전트 반복 명령: 50-80% (소음 정상화 고정 집합)

### 병렬화 반 패턴

에이전트는 10개의 툴 호출을 병렬적으로 합니다. 10개의 툴 모두 동일한 4K 토큰 시스템 프롬프트를 가지고 있습니다. 인트로피컬 캐시 작성은 요청에 따라 수행됩니다. 첫 번째 캐시 작성은 제공자가 프롬프트를 보인 후 약 300 ms를 완료합니다. 요청 2~10개의 요청은 같은 밀리초 주머니에 도착하고 각 캐시 오류가 발생합니다. 당신은 10개의 쓰기 보험료를 지불하고, 0개의 읽기 할인 혜택을 지불합니다.

수정: 순서적-첫 를 가진 배트 1만 요청하고, 1의 캐시가 채워지면 2-10을 실행합니다. 첫 번째 도구 호출에 300 ms를 추가합니다. 청구서를 5-10x로 저장합니다.

### 동적 내용 반 패턴

시스템 명령어는 다음과 같습니다

```
You are a helpful assistant. The current time is 14:32:17.
User ID: abc123. Today is Tuesday...
```

모든 요청은 독특합니다. 모든 요청은 작지만,

수정: 실제로 정적된 모든 것을 캐시 가능한 사전으로 이동하고, 캐시 경계 이후 동적 콘텐츠를 추가합니다.

```
[cacheable]
You are a helpful assistant. [rules, examples, instructions]
[/cacheable]
[dynamic, not cached]
Current time: 14:32:17. User: abc123.
```

프로젝트디스커버리는 7%에서 74%까지 이 방식으로 캐시 샷률을 옮겨서 해부학적 결과를 발표했습니다.

### 밤새 작업 할 수 있는 스택 배트 + 캐시

배치 API (단계 17 · 15) 는 24 시간 회전 시 50% 할인 할 수 있습니다. 상단에 캐시 입력하면 그 위에 ~ 10 배가 됩니다. 한밤에 분류, 레이블링 및 보고서 생성 작업량은 겹치면서 동기부여-불체된 비용의 ~ 10%까지 떨어질 수 있습니다.

### 기억해야 할 숫자

가격 포인트는 2026-04 연결된 공급자 문서에서 캡처되고 몇 개월마다 이동합니다.

- 인류 캐시 읽기: 클로드 3.5 소넷에서 $0.30/M, 신선한 입력보다 약 10배 더 저렴합니다 (docs.anthropic.com).
- 인тропо적 캐시 작성 프리미엄: 1.25x (5-분 TTL) 또는 2x (1시간 TTL).
- OpenAI 자동 캐시: 프롬프트 ≥1024 토큰에 적용됩니다. 현재 요금 카드의 신선한 입력의 약 10%에 가격으로 캐시 입력 (platform.openai.com)
- 의미 캐시 잇률 (공동체 보고): ~10% 오픈 채팅; ~70% 구조화된 FAQ까지. 공급자 문서화된 기본 기준이 아닙니다.
- 프로젝트 디스커버리: 7% → 74%의 히트률 (프로젝트 블로그, 2025-11)
- 병렬화 반 패턴: N 병렬 요청이 첫 번째 캐시 작성을 놓친 경우 510x 청구권 인플레이션의 전형적인 보고가 있습니다.

```figure
semantic-cache-hit
```

## 사용 하 고

`code/main.py`혼합 작업량에서 L1 + L2 캐싱을 시뮬레이션합니다. 보고서는 비율, 청구서, 그리고 병렬화 벌금을 보여줍니다.

## 선박

이 교훈은`outputs/skill-cache-auditor.md`. 신속한 템플릿과 트래픽을 고려하여, 캐시 가능성을 감사하고 구조조정을 권고합니다.

## 운동

1. 달아`code/main.py`- 병렬 깃발을 돌봐요.
2. 시스템 요청은 날짜가 있습니다. 이동합니다. 클릭 속도 수학을 표시하기 전에 / 후에
3. 요청 도착률을 고려하여 1 시간 TTL (2x 작성) 와 5 분 TTL (1.25x 작성) 를 위한 브레이크-바이트를 계산하십시오.
4. 0.95의 임계로 20%를 차지합니다. 0.85에서 50%를 차지합니다. 하지만 잘못된 캐시 응답을 볼 수 있습니다. 올바른 임계로 선택하고 정당화하십시오.
5. 사용자 질문당 10개의 병렬 하위 질문들을 배팅하고, 끝에서 끝까지의 지연을 추가하지 않고 캐시 편의성을 위해 다시 작성합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| L2 prompt cache | "prefix cache" | Provider stores KV for repeated prefix |
| `cache_control` | "Anthropic cache marker" | Explicit attribute marking cacheable blocks |
| Cache write premium | "write tax" | Extra cost for first miss-to-cache (1.25x or 2x) |
| L1 semantic cache | "embedding cache" | App-level hash-and-embed before calling LLM |
| GPTCache | "LLM caching lib" | Popular OSS L1 cache library |
| Cache hit rate | "hits / total" | Fraction of requests served from cache |
| Parallelization anti-pattern | "the N-write trap" | N parallel requests miss cache N times |
| Dynamic content trap | "the time-in-prompt trap" | Dynamic bytes in prefix kill hit rate |
| RadixAttention | "intra-replica cache" | SGLang's prefix-cache implementation |

## 더 많은 읽기

- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) 공식 `cache_control`의미와 TTL
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) 자동 캐시 동작 및 자격
- [TianPan — Semantic Caching for LLMs Production](https://tianpan.co/blog/2026-04-10-semantic-caching-llm-production)
- [ProjectDiscovery — Cut LLM Costs 59% With Prompt Caching](https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching)
- [DigitalOcean / Anthropic — Prompt Caching](https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean)
