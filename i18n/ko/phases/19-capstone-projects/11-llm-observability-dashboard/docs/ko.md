# 캡스톤 11  LLM 관찰성 & Eval 다시보드

> 랭푸스는 오픈코어로 바뀌었습니다. 아리즈 피닉스는 2026년 제나이 세미콘 매핑을 발표했습니다. 헬리콘과 브레인트러스트는 사용자당 비용 배정율을 두 배로 늘렸습니다. 트래셀로프의 OpenLLMetry는 사실상 SDK 도구가 되었다. 생산 형태는 흔적에 대한 ClickHouse, 메타 데이터에 대한 Postgres, UI에 대한 Next.js, 그리고 샘플 흔적에 대한 작은 평가 작업 군 (DeepEval, RAGAS, LLM-재판자) 이다. 자영용 한 개를 만들고, 적어도 네 개의 SDK 가족에서 섭취하고, 5분 이내에 주입된 회귀를 잡는 것을 입증하십시오.

**Type:** Capstone
**Languages:** TypeScript (UI), Python / TypeScript (ingest + evals), SQL (ClickHouse)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P11 · P13 · P17 · P18
**Time:** 25 hours

## 문제

2026년 생산 트래픽을 운영하는 모든 AI 팀은 모델 옆에 관찰성 평면을 유지합니다. 비용 배정 환각 감지 유동 감시 - 잭스 브레이크 신호 SLO 패시보드 PII 누출 알림 오픈소스 참조  랭푸스, 피닉스, 오픈LL메트리 는 흡수 스케마로서 오픈텔레메트리 GenAI 의미 협약에 합쳐졌다. 이제 하나의 SDK와 호환 가능한 스펜을 전송하여 OpenAI, Anthropic, Google, LangChain, LlamaIndex, vLLM을 사용할 수 있습니다.

최소 4개의 SDK 가족에서 섭취하는 자율 주행 대시보드를 구축하고, 샘플링된 흔적을 통해 작은 일련의 평가 작업을 실행하고, 유도 및 알림을 감지합니다. 측정 바: 의도적으로 주입된 회귀 (PII를 생성하기 시작하는 명령어) 를 제공하면, 대시보드는 그것을 포착하고 5분 이내에 알림을 발사합니다.

## 개념

잉게스트는 OTLP HTTP입니다. SDK는 GenAI-semconv 스펜을 생성합니다: `gen_ai.system``gen_ai.request.model``gen_ai.usage.input_tokens``gen_ai.response.id``llm.prompts``llm.completions`. 컬럼널 분석을 위해 ClickHouse에 착륙하고, 메타데이터 (이용자, 세션, 앱) 는 Postgres에 착륙합니다.

Evals는 샘플링된 흔적에 대한 배트 작업으로 실행됩니다. DeepEval는 충실성, 독성 및 응답 관련성을 점수합니다. RAGAS는 흔적이 검색 맥락을 가지고있을 때 검색 메트릭을 점수합니다. 사용자 정의 LLM 판사는 도메인 특정 검사를 실행합니다.

파동 탐지 시계는 시간 (순식 임베디션에 대한 PSI 또는 KL 분차) 와 함께 평가 점수 트렌드를 관찰합니다. 알레르트는 Prometheus AlertManager, 그리고 Slack / PagerDuty를 먹이합니다. UI는 Recharts와 함께 Next.js 15입니다.

## 건축

```
production apps:
  OpenAI SDK  +  Anthropic SDK  +  Google GenAI SDK
  LangChain + LlamaIndex + vLLM
       |
       v
  OpenTelemetry SDK with GenAI semconv
       |
       v  OTLP HTTP
  collector (ingest, sample, fan-out)
       |
       +-------------+-----------+
       v             v           v
   ClickHouse    Postgres    S3 archive
   (spans)       (metadata)  (raw events)
       |
       +---> eval jobs (DeepEval, RAGAS, LLM-judge)
       |     sampled or all-trace
       |     write eval spans back
       |
       +---> drift detector (PSI / KL on prompt embeddings)
       |
       +---> Prometheus metrics -> Alertmanager -> Slack / PagerDuty
       |
       v
   Next.js 15 dashboard (Recharts)
```

## 

- 섭취: OpenTelemetry SDK + GenAI 의미 협약; OTLP HTTP 전송
- 수집기: 큐브 샘플링 프로세서를 가진 OpenTelemetry 수집기 (비용 통제)
- 저장: 스랜을 위한 클릭하우스, 메타데이터에 대한 포스트그레스, 원시 이벤트 아카이브를 위한 S3
- Evals: DeepEval, RAGAS 0.2, Arize Phoenix 평가자 패키지, 사용자 지정 LLM 판사
- 파생: PSI / KL 주간 pooled prompt embeddings (사진 변환기)
- 경고: Prometheus AlertManager -> Slack / PagerDuty
- UI: Next.js 15 앱 라우터 + 리차트 + 서버 액션
- 박스 밖으로 지원되는 SDK: OpenAI, Anthropic, Google GenAI, LangChain, LlamaIndex, vLLM

```figure
ce-otel-drift
```

## 건설 해

1. **Collector config.**OTLP HTTP 수신기와 함께 OpenTelemetry 수집기, 100%의 오류 추적 및 10%의 성공을 유지하는 꼬리 샘플러 및 ClickHouse 및 S3에 수출기

2. **ClickHouse schema.**테이블`spans`GenAI semconv를 반영하는 기둥이 있는: `gen_ai_system``gen_ai_request_model``input_tokens``output_tokens``latency_ms``prompt_hash``trace_id``parent_span_id`, JSON 가방을 더하여 긴 유용 로드. 사용자_id 및 app_id에 의해 부차적 인 인덱스를 추가합니다.

3. **SDK coverage test.**각 SDK (OpenAI, Anthropic, Google, LangChain, LlamaIndex, vLLM) 를 사용하여 OpenLLMetry 자동 악기를 사용하여 작은 클라이언트 앱을 작성하십시오. 각 것이 ClickHouse에 착륙하는 가공적인 GenAI 범위를 생성하는지 확인하십시오.

4. **Eval jobs.**일정한 작업은 지난 15분 샘플 추적을 읽고 DeepEval 충실성, 독성 및 응답 관련성을 실행합니다. 출력은 부모 추적과 연결된 평가 기간입니다.

5. **Custom LLM-judge.**PII 누출 판사는: 응답을 받았을 때, 경비 LLM를 호출하여 PII 누출 확률을 점수를 얻습니다. 높은 점수를 얻은 응답은 triage queue에 도착합니다.

6. **Drift detection.**주간 작업은 이번 주 포괄적 인 임브레이드와 4 주 기본 연계 사이의 PSI를 계산합니다.

7. **Dashboard.**다음.js 15 페이지: 개요 (스랜스/초, 비용/이용자, p95 지연시간), 추적 (찾기 + 폭포), 평가 (신실성 트렌드, 독성), 유도 (시간과 함께 PSI), 경고.

8. **Alerting chain.**프로메테우스 수출자는 eval 점수 집합과 지연률을 읽는다. Alertmanager는 경고를 위해 Slack, 그리고 중요한 침해를 위해 PagerDuty로 이동한다.

9. **Regression probe.**버그를 주입: 평가된 채팅봇은 1%의 경우 가짜 SSN를 누출하기 시작합니다. MTTR를 측정하십시오: 배포된 버그에서 Slack 알림으로.

## 사용 하 고

```
$ curl -X POST https://my-otel-collector/v1/traces -d @trace.json
[collector]  accepted 1 trace, 3 spans
[clickhouse] inserted 3 spans (app=chat, user=u_42)
[eval]       DeepEval faithfulness 0.82, toxicity 0.03
[drift]      weekly PSI 0.08 (below 0.2 threshold)
[ui]         live at https://obs.example.com
```

## 선박

`outputs/skill-llm-observability.md`LLM 응용 프로그램을 사용하면, 패시보드는 그 흔적을 흡수하고, evals, drift 알림을 실행하고, Next.js에서 비용/ 사용자 분리를 표면합니다.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Trace-schema coverage | Number of SDK families producing canonical GenAI spans (target: 6+) |
| 20 | Eval correctness | DeepEval / RAGAS scores vs hand-labeled set |
| 20 | Dashboard UX | MTTR on injected regression (under 5 minutes target) |
| 20 | Cost / scale | Sustained ingest at 1k spans/sec without backlog |
| 15 | Alerting + drift detection | Prometheus/Alertmanager chain exercised end to end |
| **100** | | |

## 운동

1. Haystack 프레임워크에 사용자 지정 기기 추가. Faithful와 함께 ClickHouse에 상륙한 가공적 범위를 확인합니다`gen_ai.*`속성

2. 같은 추적에 있는 피닉스 평가자를 위해 딥 에발을 교환해 두 평가 엔진 사이의 점수를 측정한다.

3. 드립 디테커를 날카롭게 해 보세요. 앱 ID에 따라 PSI를 계산해 보세요.

4. "사용자 영향" 페이지를 추가: 사용자당 비용 및 스파크 라인으로 사용자당 실패율.

5. 독성성 > 0.5 + 나머지 10%의 분층 샘플을 100%를 보관하는 꼬리 샘플링 정책을 구축하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GenAI semconv | "OTel LLM attributes" | 2025 OpenTelemetry spec for LLM span attributes (system, model, tokens) |
| Tail sampling | "Post-trace sample" | Collector decides to keep or drop a trace after it completes (can peek errors) |
| PSI | "Population stability index" | Drift metric comparing two distributions; > 0.2 typically signals meaningful drift |
| LLM-judge | "Eval as model" | An LLM scoring another LLM's output on a rubric (faithfulness, toxicity, PII) |
| Tail-sampling policy | "Keep-rule" | Rule that decides which traces to persist vs drop; errored + sample-rate |
| Eval span | "Linked eval trace" | Child span carrying an eval score linked to the original LLM call span |
| Cost per user | "Unit economics" | Dollar cost attributed to a user_id over a window; key product metric |

## 더 많은 읽기

- [Langfuse](https://github.com/langfuse/langfuse) 오픈코어 관측성 기준 플랫폼
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) 강한 파 drift 지원으로 대안 참조
- [OpenLLMetry (Traceloop)](https://github.com/traceloop/openllmetry) 자동 기기 SDK 가족
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 섭취 계획
- [Helicone](https://www.helicone.ai) 대체 호스트 관찰 가능성
- [Braintrust](https://www.braintrust.dev) 대안적 평가-첫 번째 플랫폼
- [ClickHouse documentation](https://clickhouse.com/docs) 기둥 스탠 매장
- [DeepEval](https://github.com/confident-ai/deepeval) 평가자 도서관
