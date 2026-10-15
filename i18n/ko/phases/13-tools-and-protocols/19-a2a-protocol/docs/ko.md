# A2A  대리인 간 프로토콜

> MCP는 에이전트에서 도구로 A2A (Agent2Agent) 는 서로 다른 프레임워크에 구축된 불투명한 에이전트를 협업하도록 하는 개방형 프로토콜이다. 구글이 2025년 4월에 출시한 후 2025년 6월에 리눅스 재단에 기부한 후 2026년 4월에 150개 이상의 지원자가 있는 v1.0를 달성하여 AWS, Cisco, Microsoft, Salesforce, SAP, ServiceNow를 포함하고 있습니다. IBM의 ACP를 흡수하고 AP2 결제 연장도 추가했습니다. 이 수업은 에이전트 카드, 작업 라이프 사이클, 그리고 A2A 1.0.1 와이어 이름을 사용하여 세 프로토콜 결합을 진행합니다.

**Type:** Build
**Languages:** Python (stdlib, Agent Card + Task harness)
**Prerequisites:** Phase 13 · 06 (MCP fundamentals), Phase 13 · 08 (MCP client)
**Time:** ~75 minutes

## 학습 목표

- 에이전트에서 도구 (MCP) 를 에이전트에서 에이전트 (A2A) 의 사용 사례에서 구별한다.
- `/.well-known/agent-card.json`기술과`supportedInterfaces`메타데이터
- 작업의 생명주기를 따라가십시오: `TASK_STATE_SUBMITTED``TASK_STATE_WORKING``TASK_STATE_INPUT_REQUIRED`, 그리고 터미널 상태`TASK_STATE_COMPLETED``TASK_STATE_FAILED``TASK_STATE_CANCELED``TASK_STATE_REJECTED`- 그래
- 각각의 부분들이 1개의 메시지를 포함하고 있는 메시지들을 사용하세요`text``raw``url`또는`data`, 그리고 발출물

## 문제

고객 서비스 에이전트는 전문 기자 에이전트에 보고서 작성 권한을 위임해야 합니다. A2A 이전 옵션은:

- 맞춤형 REST API가 작동하지만 모든 조화가 단번에 가능합니다.
- 공유 코드베이스, 두 에이전트가 같은 프레임워크를 실행해야 합니다.
- MCP는 전화 도구에 적합하지 않습니다. 두 명의 에이전트가 서로 협력하면서 각각의 에이전트의 불투명한 내부 추론을 보존하는 것이 아닙니다.

A2A는 공백을 채우며, 하나의 에이전트가 타사킹을 다른 에이전트에 보내는 상호작용을 모델링하며, 라이프 사이클, 메시지 및 유물들을 제공합니다. 호출된 에이전트의 내부 상태는 불투명하다.

A2A는 "프레임워크 간 에이전트가 서로 대화하도록 한다" 프로토콜이다. MCP를 대체하지 않는다. 두 가지는 보완적이다.

## 개념

### 에이전트 카드

A2A에 따라 모든 에이전트는`/.well-known/agent-card.json`이 부분의 본문은

```json
{
  "name": "research-agent",
  "description": "Summarizes academic papers and drafts citations.",
  "version": "1.2.0",
  "supportedInterfaces": [
    {
      "url": "https://research.example.com/a2a",
      "protocolBinding": "JSONRPC",
      "protocolVersion": "1.0"
    }
  ],
  "capabilities": {"streaming": true, "pushNotifications": true},
  "securitySchemes": {
    "bearer": {"httpAuthSecurityScheme": {"scheme": "Bearer"}}
  },
  "securityRequirements": [{"schemes": {"bearer": {"list": []}}}],
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/markdown"],
  "skills": [
    {
      "id": "summarize_paper",
      "name": "Summarize a paper",
      "description": "Read a paper PDF and produce a 3-paragraph summary.",
      "tags": ["research", "summarization"],
      "inputModes": ["text/plain", "application/pdf"],
      "outputModes": ["text/markdown"]
    }
  ]
}
```

발견은 URL에 기반합니다. 카드를 가져와 먼저 선택하세요.`supportedInterfaces`이 항목은`protocolBinding`클라이언트가 말하고, 기술들을 수록하고, 입력 및 출력 모드는 미디어 타입입니다.

### 서명된 에이전트 카드

카드에는 `signatures`매 항목은 카드의 RFC 8785 가상의 JSON를 통해 계산된 JWS (RFC 7515) 이다.`signatures`카드가 동일한 방식으로 카노닉화되고 검증됩니다.

### 작업 생활주태

```text
TASK_STATE_SUBMITTED
  -> TASK_STATE_WORKING
  -> TASK_STATE_COMPLETED | TASK_STATE_FAILED | TASK_STATE_CANCELED | TASK_STATE_REJECTED

TASK_STATE_WORKING
  -> TASK_STATE_INPUT_REQUIRED
  -> TASK_STATE_WORKING (the client sends a message with the same taskId)
```

고객들은 `SendMessage`, 그리고 서버가 작업을 만듭니다. 호출된 에이전트는 주들을 통해 전환합니다.`GetTask`또는 SSE를 통해 `SendStreamingMessage`그리고`SubscribeToTask`류가 다`statusUpdate`그리고`artifactUpdate`이 작업은 종착 상태에 도달하면 종료됩니다.`final`깃발

### 메시지 와 부분

메시지는`messageId`, a `role`(`ROLE_USER`또는`ROLE_AGENT`), 그리고 하나 이상의 부분. 각 부분에는 정확히 하나의 내용 필드가 있고, 그 필드 이름은 타입입니다.`kind`현장

- `text`: 순수한 내용
- `raw`: 파일 바이트, JSON에서 64 베이스, 일반적으로 `filename`그리고`mediaType`- 그래
- `url`: 파일 내용에 대한 링크
- `data`: 구조화된 JSON 유용량 ( 호출된 에이전트의 구조화된 입력).

예를 들어:

```json
{
  "messageId": "msg-001",
  "role": "ROLE_USER",
  "parts": [
    {"text": "Summarize this paper."},
    {"raw": "...", "filename": "paper.pdf", "mediaType": "application/pdf"},
    {"data": {"targetLength": "3 paragraphs"}, "mediaType": "application/json"}
  ]
}
```

### 유물

출력은 원본 문자열이 아니라, 유물입니다. 유물이란 이름 붙여서 입력된 출력입니다.

```json
{
  "artifactId": "art-001",
  "name": "summary",
  "parts": [{"text": "...", "mediaType": "text/markdown"}]
}
```

유물은 조각으로 스트리밍될 수 있습니다.`artifactUpdate`이 사건은 유물을 더하고 있습니다`append`그리고`lastChunk`전화가 쌓여

### 3개의 프로토콜 결합

1. **JSON-RPC 2.0 over HTTP**(`JSONRPC`) 요청에 대한 POST, 스트리밍에 대한 SSE. 방법들은 PascalCase:`SendMessage``SendStreamingMessage``GetTask``ListTasks``CancelTask``SubscribeToTask``CreateTaskPushNotificationConfig``GetTaskPushNotificationConfig``ListTaskPushNotificationConfigs``DeleteTaskPushNotificationConfig`그리고`GetExtendedAgentCard`- 그래
2. **gRPC**(`GRPC`) gRPC가 본래 사용된 기업 환경에서는 동일한 방법 이름
3. **HTTP+JSON/REST**(`HTTP+JSON`). `POST /message:send`그리고`GET /tasks/{id}`- 그래

세 가지 결합 모두 동일한 데이터 모델을 가지고 있습니다.`supportedInterfaces`입력 이름 한 채용 및 그 `protocolVersion`고객들이 헤더를 보내`A2A-Version: 1.0`모든 요청에 대해 서버가 요청이 없는 것을 버전 0.3로 읽기 때문에

```http
POST /a2a HTTP/1.1
Host: research.example.com
Content-Type: application/json
A2A-Version: 1.0

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "msg-001",
      "role": "ROLE_USER",
      "parts": [{"text": "Summarize this paper."}]
    }
  }
}
```

### 비공개성 보존

핵심 설계 원칙: 호출된 에이전트의 내부 상태는 불투명하다. 호출자는 작업 상태와 유물을 본다. 호출된 에이전트의 사슬, 도구 호출, 하위 에이전트 위임  모두 보이지 않습니다. 이것은 도구 호출이 투명하는 MCP와 다릅니다.

합리화: A2A는 내부를 공개하지 않고 경쟁자들이 협업할 수 있게 한다. A2A는 호출자가 그 에이전트가 서비스를 어떻게 구현하는지 배우지 않고 "이 고객 서비스 에이전트를 호출하라"라고 할 수 있다.

### 시간 순서

- **2025-04-09.**구글은 A2A를 발표합니다.
- **2025-06-23.**리눅스 재단에 기부된 것
- **2025-08.**IBM의 ACP를 흡수합니다.
- **2025-09.**AP2 확장 (사기 지불) 배
- **2026-04.**150+ 지원 조직과 함께 발매된 v1.0

### MCP와의 관계는

| Dimension | MCP | A2A |
|-----------|-----|-----|
| Use case | Agent-to-tool | Agent-to-agent |
| Opacity | Transparent tool calls | Opaque inner reasoning |
| Typical caller | Agent runtime | Another agent |
| State | Tool-call result | Task with lifecycle |
| Authorization | OAuth 2.1 (Phase 13 · 16) | Agent Card `securitySchemes` + `securityRequirements` |
| Transport | Stdio / Streamable HTTP | JSON-RPC / gRPC / HTTP+JSON |

특정 도구를 호출하고자 할 때 MCP를 사용하십시오. 다른 에이전트에 전체 작업을 위임하고자 할 때 A2A를 사용하십시오. 많은 생산 시스템은 둘 다 사용합니다. 에이전트는 도구 계층을 위해 MCP를 사용하고 협업 계층을 위해 A2A를 사용합니다.

```figure
a2a-task-lifecycle
```

## 사용 하 고

`code/main.py`A2A 가 최소 한 가지 을 구현 합니다. 작사 에이전트는 카드를 공개하고 연구 에이전트는`SendMessage`PDF 부분과 텍스트 명령어를 사용하여 요청하고 작업이 진행됩니다.`TASK_STATE_WORKING`→`TASK_STATE_INPUT_REQUIRED`→`TASK_STATE_WORKING`→`TASK_STATE_COMPLETED`모든 stdlib; 메모리에 있는 전송을 사용하여 메시지 모양에 초점을 맞추고 있습니다.

무엇을 살펴볼 수 있을까요?

- 에이전트 카드 JSON 모양
- 서버 측 작업 ID 할당 및 상태 전환
- 내용 필드가 존재하는 부분으로 입력된 부분
- `TASK_STATE_INPUT_REQUIRED`분부 중 작업.
- 완성되면 유물이 돌아옵니다.

## 선박

이 교훈은`outputs/skill-a2a-agent-spec.md`다른 에이전트가 호출할 수 있는 새로운 에이전트를 제공하면, 스킬은 에이전트 카드 JSON, 스킬 스키마, 엔드포인트 플루프립트를 생성합니다.

## 운동

1. 달아`code/main.py`  `TASK_STATE_INPUT_REQUIRED`전화한 에이전트가 명확히 해달라고 요청하는 곳에서 멈춰요.

2. 서명된 에이전트 카드 추가하고, JWS 항목을 입력하세요`signatures``alg` 설정`HS256`, 카드의 정통 JSON를 서명하지 않고`signatures`필드에서 확인을 작성하고 돌연변이된 카드에서 실패한 것을 확인합니다.

3.   으로 작업 스트리밍을 실행`SendStreamingMessage`: 작사 대리인은 `task`3`artifactUpdate``statusUpdate``TASK_STATE_COMPLETED`그 후 스트림을 닫고, 전화자는 조각을 축적합니다.

4. MCP 서버를 엮는 A2A 에이전트를 설계하고, 각 MCP 도구를 A2A 기술로 매핑합니다. 교류를 참고하세요.

5. A2A v1.0 발표를 읽어보고, 2026년 4월 현재 어떤 프레임워크에서도 아직 구현되지 않은 한 가지 기능을 확인하십시오. (힌트: 그것은 멀티-홉 작업 위임과 관련이 있습니다.)

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| A2A | "Agent-to-Agent protocol" | Open protocol for opaque agent collaboration |
| Agent Card | "`/.well-known/agent-card.json`" | Published metadata describing an agent's skills and `supportedInterfaces` |
| Skill | "A callable unit" | A named operation the agent supports (analog to MCP tool) |
| Task | "Unit of delegation" | A work item with a lifecycle and final artifact |
| Message | "Task input" | Carries Parts (`text`, `raw`, `url`, `data`) |
| Part | "Typed chunk" | Exactly one of `text` / `raw` / `url` / `data`, plus optional `mediaType`; no `kind` field |
| Artifact | "Task output" | Named, typed output returned on completion |
| AP2 | "Agent Payments Protocol" | Payments extension built on A2A; card signing is core A2A (`signatures`) |
| Opacity | "Black-box collaboration" | Called agent's internals are hidden from caller |
| `TASK_STATE_INPUT_REQUIRED` | "Task pause" | Interrupted state when the agent needs more info |

## 더 많은 읽기

- [a2a-protocol.org](https://a2a-protocol.org/latest/) 가톨릭 A2A 사양
- [a2aproject/A2A — GitHub](https://github.com/a2aproject/A2A) 참조 구현 및 SDK
- [A2A v1.0.1 release](https://github.com/a2aproject/A2A/tree/v1.0.1): 표기 `docs/specification.md`그리고 규범`specification/a2a.proto`이 교훈은
- [Linux Foundation — A2A launch press release](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents) 2025년 6월 지배구조 이전
- [Google Cloud — A2A protocol upgrade](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade) 로드맵과 파트너의 추진력
- [Google Dev — A2A 1.0 milestone](https://discuss.google.dev/t/the-a2a-1-0-milestone-ensuring-and-testing-backward-compatibility/352258) v1.0 발매 메모 및 후퇴형 컴팩트 지침
