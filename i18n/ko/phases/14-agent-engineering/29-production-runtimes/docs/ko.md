# 생산 실행 시간: 큐, 이벤트, 크론

> 제작 에이전트는 6가지 실행형태로 실행됩니다. 요청 응답, 스트리밍, 내구성 실행, 줄을 기반한 배경, 이벤트 기반 및 스케줄링. 프레임워크를 선택하기 전에 모양을 선택하십시오. 관찰성은 모든 모양에서 부담을 내립니다.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 22 (Voice)
**Time:** ~60 minutes

## 학습 목표

- 6개의 생산 실행 시기의 형태를 명명하고 각각 프레임워크/제품 패턴에 일치한다.
- 왜 장기적인 작업에 있어서 지속가능한 실행 (LangGraph) 이 중요 한지를 설명해 주십시오.
- 이벤트 기반 실행 시기와 클로드 매니지드 에이전트가 언제 적합하는지 설명해 주십시오.
- 다단계 대기에 대한 관측가능성 로드 베어링 주장을 설명하십시오.

## 문제

제작 에이전트는 Jupyter 노트북이 표면에 나타나지 않는 방식으로 실패합니다. 단계 37에서 네트워크 타임아웃, 사용자가 음성 호출 중간에 걸립니다. 기계 재부팅에서 크론 작업이 사망합니다. 배경 작업자는 메모리가 부족합니다. 실행 시간 모양은 어떤 실패가 생존 가능한지 결정합니다.

## 개념

### 요청-응답

- 동기 HTTP, 사용자 완료를 기다리고 있습니다.
- 단기 작업 (<30s) 에만 실행가능하다.
- 스택: 아고 (파이톤 + 패스트API), 마스트라 (타이프스크립트 + 익스프레스/호노/ 패스티파이/ 코아).
- 관찰 가능: 표준 HTTP 액세스 로그 + OTel 범위.

### 스트리밍

- SSE 또는 WebSocket의 진행성 출력
- 라이브킷은 음성/비디오 (강좌 22) 을 위한 WebRTC로 확장합니다.
- 스택: 스트리밍 지원이 있는 모든 프레임워크 + SSE/WS를 처리하는 프론트엔드.
- 관찰 가능성: 단위로 시기를 맞추기, 첫 번째 토큰 지연, 꼬리 지연

### 지속가능한 실행

- 모든 단계에 대한 국가 체크포인트, 실패에 대한 자동 재개
- AutoGen v0.4 배우 모델은 하나의 에이전트에 실패를 분리합니다 (강좌 14).
- 랭그그래프의 핵심분리자 (강좌 13)
- 단계 수가 알려지지 않고 복구 비용이 높을 때 필수적입니다.

### 큐 기반 / 배경

- 직무는 줄을 서고, 노동자들은 수차를 하고, 결과는 웹 이나 술집/잠수함으로 돌아옵니다.
- 긴 지평선 에이전트 (Anthropic의 컴퓨터 사용 발표에 따라 작업당 수십~백 개의 단계) 에 필수적입니다.
- 스택: 셀러리 (파이톤), 툴MQ (노드), SQS + 램브다 (AWS), 사용자 지정.
- 관찰 가능: 줄을 깊이, 직무당 지연 분포, DLQ 크기가

### 이벤트 중심

- 에이전트들은 트리거에 가입합니다. 새로운 이메일, PR가 열렸어요.
- 클로드 매니지드 에이전트스는 이것을 틀에서 벗어난 것으로 설명합니다 (강좌 17).
- CrewAI 흐름 (강좌 15) 은 이벤트 중심의 결정적 작업 흐름을 구성합니다.
- 관찰 가능성: 트리거 소스, 이벤트부터 시작 시기의 지연, 에이전트 지연

### 일정이

- క్ర론 모양의 에이전트들이 주기적으로 실행됩니다.
- 내구성 있는 실행과 결합하여 실패한 밤마다 실행이 다음 틱에서 재개됩니다.
- 스택: Kubernetes CronJob + 내구적인 프레임워크; 호스팅 (Render cron, Vercel cron).

### 2026 배치 패턴

- **CrewAI Flows**이벤트 중심의 생산을 위해
- **Agno**Python 마이크로 서비스의 무정부 FastAPI
- **Mastra**임베디션용 서버 어댑터 (Express, Hono, Fastify, Koa)
- **Pipecat Cloud / LiveKit Cloud**관리된 음성 (강좌 22).
- **Claude Managed Agents**호스트된 장기간 진행되는 아싱크

### 관찰 가능성은 부담이

OpenTelemetry GenAI 스펜 (강좌 23) 과 Langfuse/Phoenix/Opik 백엔드 (강좌 24) 이 없으면 단계 40에서 실패한 멀티 스테이프 에이전트를 디버깅 할 수 없습니다. 이것은 생산에 선택적이지 않습니다. "우리는 빨리 디버깅합니다"와 "우리는 더 많은 로깅을 통해 처음부터 재생합니다".

### 생산 실행시간이 실패하는 경우

- **Wrong shape choice.**5분짜리 작업에 요청과 응답을 선택합니다. 사용자는 연결하고, 작업자들은 쌓이고, 재시험이 합쳐집니다.
- **No DLQ.**죽은 글자가 없는 노동자들이 줄을 서고 실패한 일자리가 사라집니다.
- **Opaque background work.**백그라운드 에이전트는 유출 흔적이 없도록 실행됩니다. 사용자가 보고할 때까지 오류는 보이지 않습니다.
- **Skipping durable state.**30초 이상 실행을 하면 재발전할 수 없는 경우 지속 가능한 실행이 필요합니다.

```figure
wb-runtime-shapes
```

## 건설 해

`code/main.py`stdlib의 다형 디모가 있습니다.

- 요청 응답 최종점 (평등 함수)
- 스트리밍 핸들러 (제너터)
- DLQ를 가진 줄을 서 있는 노동자
- 이벤트 트리거 레지스트리
- 크론 모양의 스케줄러

실행하세요:

```bash
python3 code/main.py
```

출력: 동일한 작업에 대한 각 모양의 행동을 나타내는 다섯 개의 흔적. 동일한 에이전트 논리, 다른 외부 껍질. 내구성 실행 (제6 모양) 은 랭그그래프 체크포인팅으로 레슨 13에서 의도적으로 다루어집니다.

## 사용 하 고

- **Request-response**채팅 스타일의 UX를 위해
- **Streaming**진전적인 반응에 대해
- **Durable**장기적인 임무에 대한
- **Queue**배트/ 아시크/ 장기간 사용용
- **Event**대원 반응성
- **Cron**가정을 위한 (메모리 통합, 평가, 비용 보고)

## 선박

`outputs/skill-runtime-shape.md`작업에 대한 실행 시간 모양을 선택하고 관찰가능성 요구 사항을 배열합니다.

## 운동

1. 리렉트 루프를 스택의 6가지 모양으로 옮기세요. 어떤 모양이 어떤 제품 표면에 맞나요?
2. 대기열 기반 디모에 DLQ를 추가합니다. 10% 작업 실패를 시뮬레이션합니다. DLQ 크기가 표면입니다.
3. 매일 20개의 트레이스를 어 실행하는 cron-triggered eval agent을 작성하세요.
4. 역압으로 스트리밍을 구현: 클라이언트가 느린 경우 에이전트를 일시 중지하십시오. 이것은 차례 예산과 어떻게 상호 작용합니까?
5. 클로드 매니지드 에이전트 문서들을 읽어보세요. 언제 자기 주최한 장기 에이전트를 매니지드로 옮길 수 있을까요?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Request-response | "Synchronous" | User waits; short tasks only |
| Streaming | "SSE / WS" | Progressive output; better UX; latency observable per chunk |
| Durable execution | "Resume from failure" | Checkpointed state; restart at last step |
| Queue-based | "Background jobs" | Producer / worker pool / DLQ |
| Event-driven | "Trigger-based" | Agent reacts to external events |
| DLQ | "Dead-letter queue" | Parking lot for failed jobs |
| Claude Managed Agents | "Hosted harness" | Anthropic-hosted long-running async with caching + compaction |

## 더 많은 읽기

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) 지속 가능한 실행 세부 사항
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) 장기간 진행되는 호스팅 아싱크
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) "공사당 수십~백개의 단계"
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) 배우 모델 결함 격리
