# 생산 에이전트 실행 시간  빠른 인스턴스 및 타입 작업 흐름

> 프로덕션 에이전트 런타임은 프로토타입 프레임워크가 무시하는 것을 최적화합니다. 인스턴시션 비용, 타이핑 된 워크플로우 표면 및 서비스 준비 된 백엔드. 2026 페어링: 아그노 (파이톤) 은 마이크로초 대리인 인스턴시션 및 상태없는 패스트API 백엔드를 목표로합니다. 마스트라는 Vercel AI SDK 서브래트에 에이전트, 도구, 작업 흐름, 통일된 모델 라우팅 및 복합 저장소를 배포합니다.

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 13 (LangGraph)
**Time:** ~45 minutes

## 학습 목표

- 아고의 성능 목표와 언제 중요한지 알아내세요.
- 마스트라의 3가지 원시적인 이름  에이전트, 도구, 작업 흐름  및 지원되는 서버 어댑터
- 무국립 세션 스코드 FastAPI 백엔드가 왜 Agno 생산 경로가 권장되는지 설명하십시오.
- 주어진 스택 (파이톤-첫 번째 vs 타이프스크립트-첫 번째) 에 대해 Agno vs Mastra를 선택하십시오.

## 문제

랭그라프, 오토제인, 크루아이 (CrewAI) 는 프레임워크 중력이 있다. "이런 룰에서 에이전트 루프만 빨리 실행해야 한다"는 팀들은 아그노 (파이톤) 또는 마스트라 (타이프스크립트) 를 이용할 수 있다. 둘 다 프레임워크 소유의 원시물 중 일부를 원시 속도와 주변 스택에 더 잘 맞게 교환한다.

## 개념

### 아노

- 파이썬 실행시간, 이전 Phi-data
- "그래프, 체인, 또는 복잡한 패턴이 없습니다. 순수한 파이톤".
- 그들의 문서에서 성능 목표: ~ 2μs 에이전트 인스턴시, ~ 3.75 KiB 에이전트당 메모리, ~ 23 모델 공급자.
- 생산 경로: 상태 없는 세션 스코프 FastAPI 백엔드. 각 요청은 새로운 에이전트를 시작, 세션 상태는 DB에서 살고 있습니다.
- 네이티브 멀티모달 ( 텍스트, 이미지, 오디오, 비디오, 파일) 및 에이전시 RAG

초당 수천 명의 단기적인 에이전트가 있을 때 (방향 팬, 평가 파이프라인) 속도 목표가 중요하지만, 10분 동안 한 에이전트가 달리는 경우 덜 중요합니다.

### 마스트라

- 타입스크립트, 버셀 AI SDK에 기반한
- 3가지 원시적인 것:**Agents****Tools**(조드 타입)**Workflows**- 그래
- 통일형 라우터 (Unified Model Router)  94개의 공급업체에서 3,300+ 모델 (2026년 3월).
- 복합 저장: 메모리, 작업 흐름, 다양한 백그랜드에 관측 가능; 크릭하우스는 규모에서 관측 가능하도록 권장됩니다.
- Apache 2.0 와 함께`ee/`소스 사용 가능한 기업 라이선스 아래의 디렉토리
- 익스프레스, 호노, 패스티파이, 코아, 1급 Next.js 및 아스트로 통합용 서버 어댑터
- 디버깅을 위해 Mastra Studio (localhost:4111) 를 배포합니다.
- 22k+ GitHub 별, 300k+ 주간 npm 다운로드 1.0 (Jan 2026).

### 위치

랭그그래프가 되려고 하는 것도 아닙니다.

- **Language fit.**파이썬 첫 팀에 아노, 타이프스크립트 첫 팀에 마스트라
- **Runtime ergonomics.**아노 = 거의 0 대용량; 마스트라 = 베르셀 생태계와 통합된
- **Observability.**둘 다 랭푸스/피닉스/오피크 (강좌 24) 에 통합되지만 마스트라 스튜디오는 퍼스트파티입니다.

### 언제 각각을 선택해야지

- **Agno**파이썬 백엔드, 짧은 기간의 에이전트, 강력한 퍼프 요구 사항, FastAPI 가게.
- **Mastra** 타입스크립트 백엔드, 다음.js / 베르셀 배포, 통일된 멀티 공급자 모델 라우팅, Zod-typed 도구.
- **LangGraph**(강좌 13)  내구성 상태와 명시적인 그래프 추론이 원자속보다 더 중요할 때
- **OpenAI / Claude Agent SDK** 공급자의 생산형태를 원하는 경우 (강좌 1617).

### 이 패턴이 잘못되는 곳

- **Perf-for-perf's-sake.**2μs는 작업량이 요청에 따라 1번 느린 요원 호출이 될 때 좋은 소리입니다.
- **Ecosystem lock-in.**마스트라의 베르셀 맛의 통합은 베르셀에 더하기, 다른 곳에서는 미이너스입니다.
- **Enterprise license confusion.**마스트라의`ee/`이 디렉토리는 Apache 2.0가 아닌 소스 사용 가능입니다.

```figure
wb-runtime-spawn
```

## 건설 해

이 교훈은 주로 비교적  단일 코드 유물은 두 프레임워크에 정의를 주지 않을 것입니다.`code/main.py`옆 장난감: 최소 "원인을 실행, 출력을 스트리밍, 세션을 지속" 흐름이 두 번 구현됩니다 (한 번 Agno 모양, 한 번 Mastra 모양).

실행하세요:

```
python3 code/main.py
```

구조적으로 다르지만 기능적으로 동등한 두 개의 흔적이 있습니다.

## 사용 하 고

- **Agno** 파이썬 백엔드 속도와 FastAPI 모양이 필요합니다.
- **Mastra** 많은 공급자와 작업 흐름 원시와 함께 타이프스크립트 백엔드.
- 두 배 모두 Langfuse와 통합된

## 선박

`outputs/skill-runtime-picker.md`스택, 지연 예산 및 운영 형태를 기반으로 Agno, Mastra, LangGraph 또는 제공자의 SDK를 선택합니다.

## 운동

1. 아그노의 문서를 읽어보고, 아그노에 STDlib ReAct 루프를 가져가라.
2. 마스트라의 문서들을 읽어 보세요. 같은 루프를 마스트라로 포트하세요. 도구 타이핑에 어떤 변화가 있었나요?
3. 벤치마크: 스택에 있는 에이전트 인스턴시레이션 지연을 측정하세요. 아그노의 2μs는 작업량에 상관이 있나요?
4. 마이그레이션을 설계하세요. 파이썬에서 CrewAI를 실행했다면 아그노로 이동하면 어떤 장애가 있을까요?
5. 마스트라의 책을 읽어보세요`ee/`오픈소스 포크에 어떤 제한이 영향을 미치나요?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agno | "Fast Python agents" | Stateless session-scoped agent runtime |
| Mastra | "TypeScript agents on Vercel AI SDK" | Agents + Tools + Workflows + Model Router |
| Unified Model Router | "Multi-provider access" | Single client for 3,300+ models across 94 providers |
| Composite storage | "Multiple backends" | Memory/workflows/observability each to a different store |
| Mastra Studio | "Local debugger" | localhost:4111 UI for introspecting agents |
| Source-available | "Not OSS" | License permits source reading but restricts commercial use |

## 더 많은 읽기

- [Agno Agent Framework docs](https://www.agno.com/agent-framework) 성능 목표, FastAPI 통합
- [Mastra docs](https://mastra.ai/docs) 원시, 서버 어댑터, 모델 라우터
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) 국가형 그래프 대안
- [Comet Opik](https://www.comet.com/site/products/opik/) 마스트라 통합에서 인용된 관찰성 비교
