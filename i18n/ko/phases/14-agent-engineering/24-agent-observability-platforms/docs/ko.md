# 감시 대리인: 랭푸스, 피닉스, 오픽

> 2026년 3개의 오픈소스 에이전트 관측 플랫폼이 지배한다. 랑푸스 (MIT) 6M+ 설치/달, 추적+순급 관리+평가+시션 재생. 아리즈 피닉스 (Elastic 2.0)  심층 에이전트 특정 평가, RAG 관련성, 오픈 인퍼런스 자동 기기. 코메트 오픽 (Apache 2.0)  자동순급 최적화, 경비선, LLM 판사 환각 탐지.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 23 (OTel GenAI)
**Time:** ~45 minutes

## 학습 목표

- 3개의 오픈소스 에이전트 관찰 플랫폼과 라이선스를 명명하세요.
- 각자의 가장 강한 특징을 구분하십시오. 랑프푸스 (프라스트 mgmt + 세션), 피닉스 (RAG + 자동 도구), 오피크 (오프티마이션 + 경비).
- 왜 89%의 조직들이 2026년까지 에이전트 관찰이 가능하다고 보고하는지 설명해 주세요.
- LLM 판사 평가와 함께 스들리브 트레이스-투-다시보드 파이프라인을 구현한다.

## 문제

OTel GenAI (강좌 23) 는 스케마를 알려 줍니다. 당신은 여전히 랜드를 섭취하고 평가들을 실행하고, 리포트 버전을 저장하고, 회귀를 표면에 내세우는 플랫폼이 필요합니다. 세 가지 경쟁자는 각각 삶의 순환의 다른 부분을 강조합니다.

## 개념

### 랭푸스 (MIT)

- 6M+ SDK 설치/달, 19k+ GitHub 별
- 특징: 추적, 버전 제작 + 놀이터와 함께 신속 관리, 평가 (LLM-as-judge, 사용자 피드백, 사용자 정의), 세션 재생.
- 2025년 6월: MIT에서 오픈소스로 제공된 기존 상업용 모듈 (LLM-as-a-judge, 해설 줄을, 신속한 실험, 플레이그라운드)
- 가장 강력한: 단면으로 관찰 가능, 긴밀한 프롬프트 관리 루프

### 아리즈 피닉스 (Elastic License 2.0)

- 보다 심층적인 요인별 평가: 추적 집합, 기상실 검증, RAG에 대한 검색 관련성.
- 네이티브 오픈 인퍼런스 자동 기기
- 생산용으로 관리된 Arize AX를 사용한다.
-  더 넓은 플랫폼과 함께 유도/행동 회귀 도구로 배치된 신속한 버전이 없습니다.
- RAG 관련성, 행동 유동, 기상성 탐지

### 오피크 혜성 (아파치 2.0)

- A/B 실험을 통해 자동화된 신속한 최적화
- 보호장 (PII 편집, 현역적 제약)
- LLM 판사 환각 검출
- 코메트의 자체 측정에서 벤치마크: 23.44s에서 Opik 로그 + 평가와 Langfuse 327.15s (~ 14x 격차)  공급자의 벤치마크를 방향적으로 받아들이십시오.
- 최적화 루프, 자동 실험, 경비 철도

### 산업 데이터

매시민 (2026 현장 분석): 조직의 89%는 에이전트 관찰력을 갖추고 있으며 품질 문제는 생산의 가장 큰 장벽입니다 (32%는 응답자를 인용합니다).

### 한 가지 선택

| Need | Pick |
|------|------|
| All-in-one with prompt management | Langfuse |
| Deep RAG evaluation + drift | Phoenix |
| Automated optimization + guardrails | Opik |
| Open licensing, no ELv2 | Langfuse (MIT) or Opik (Apache 2.0) |
| Datadog / New Relic integration | Any — they all export OTel |

### 이 패턴이 잘못되는 곳

- **No eval strategy.**평가 없이 추적하는 것은 단지 비싼 사물입니다.
- **Self-rolled LLM-judge without grounding.**비판적인 패턴 (강좌 05) 은 적용됩니다.
- **Prompt versions not tied to traces.**프로덕이 퇴행하면, 그 원인이 된 신호를 분리할 수 없습니다.

```figure
wb-trace-ingest
```

## 건설 해

`code/main.py`STDlib 추적 수집자 + LLM 판사 평가자를 구현합니다:

- GenAI 모양의 팽창을 섭취하세요.
- 세션별 그룹, 태그 실패 실행 (보호 여행, 낮은 신뢰 평가)
- 스나이즈 된 LLM 판사는 주석에 대한 에이전트 응답을 점수를합니다.
- 패시보드처럼 요약: 실패율, 주요 실패 이유, 평가 점수 분포.

실행하세요:

```
python3 code/main.py
```

출력: 세션당 평가 점수와 Langfuse/Phoenix/Opik에서 보여지는 것과 일치하는 실패 분류.

## 사용 하 고

- **Langfuse**자영 호스팅 또는 클라우드; OTel 또는 SDK를 통해 전송
- **Arize Phoenix**자율주행; 자동 도구 OpenInference.
- **Comet Opik**자영 또는 클라우드; 자동 최적화 루프
- **Datadog LLM Observability**이미 Datadog를 운영하고 있는 혼합 ops+ML 팀들을 위해서

## 선박

`outputs/skill-obs-platform-wiring.md`플랫폼을 선택하고 기존 에이전트에 추적 + 평가 + 간략한 버전을 전송합니다.

## 운동

1. OTel의 흔적을 Langfuse 클라우드에 수출합니다. 어떤 세션이 실패했나요? 왜요?
2. 본 영역에 대한 LLM 판사 라브리를 작성하세요 (사실 정확성, 음색, 범위를 준수) 50개의 흔적을 테스트하세요.
3. 랭푸스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스 스
4. 오피크의 경비 문서를 읽어봐, 피고 정보 편집 경비 문서를 네 에이전트 중 한 명에게 보내
5. 세 가지의 기준을 확인하고 판매자 발표한 숫자를 무시하고 자신의 숫자를 측정하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Tracing | "Spans collector" | Ingest OTel / SDK spans; index by session |
| Prompt management | "Prompt CMS" | Versioned prompts tied to traces |
| LLM-as-judge | "Automated eval" | Separate LLM scores agent output against a rubric |
| Session replay | "Trace playback" | Step through past runs for debugging |
| RAG relevancy | "Retrieval quality" | Does the retrieved context match the query |
| Trace clustering | "Behavioral grouping" | Cluster similar runs for drift detection |
| Guardrail enforcement | "Policy at log time" | PII/toxicity/scope checks on logged content |

## 더 많은 읽기

- [Langfuse docs](https://langfuse.com/) 추적, 평가, 신속한 mgmt
- [Arize Phoenix docs](https://docs.arize.com/phoenix) 자동 기기, 유도
- [Comet Opik](https://www.comet.com/site/products/opik/) 최적화 + 경비
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 세 가지 스케마 모두 소비
