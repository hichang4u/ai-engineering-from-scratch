# MCP 과제 확장: 국적 없는 핵심에 대한 지속적인 작업

> 국정 없는 MCP는 모든 작업이 하나의 요청으로 완료되어야 한다는 것을 의미하지는 않습니다. 공식적인 작업 확장 프로그램은 장기적인 작업에 명시적으로 내구성 있는 핸들을 제공합니다. 서버는 그 핸들을`tools/call`, 모든 사례가 대답할 수 있습니다`tasks/get`, 그리고 고객 입력이 `tasks/update`프로토콜 세션들을 다시 활성화하지 않고

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 11 (stateless MRTR), Phase 13 · 12 (elicitation)
**Time:** ~90 minutes

## 학습 목표

- 국가 없는 프로토콜 운송을 내구성 응용 작업 상태에서 구별한다.
- 협상`io.modelcontextprotocol/tasks`요청에 따른 능력의 확장 및`server/discover`- 그래
- 서버를 중심으로 하는 복귀`CreateTaskResult``resultType: "task"`그러나 하나님은 만물을 창조한 후만
- `tasks/get`, 작업 입력을 수행합니다 `tasks/update`, 그리고 협동조합 취소 요청`tasks/cancel`- 그래
- 노인을 제거해`tasks/status``tasks/result`그리고`tasks/list`가정
-  에서 선택적 작업 알림에 가입하십시오`subscriptions/listen`POST 응답 SSE 스트림에서
- 모델 작업의 만료, 재부팅 복구, 입력 키의 배제 및 실행 오류가 올바르게 수행됩니다.

## 임무 는 왜 확장 이 됩니까?

과제는 2025-11-25년에 처음 실험적인 핵심 기능으로 등장했습니다. 2026년 7월 재설계로 정식으로 옮겨졌습니다.`io.modelcontextprotocol/tasks`클라이언트와 서버가 모든 사람들을 위한 핵심 프로토콜을 확장하지 않고 추가 라이프 사이클에 참여할 수 있도록 확장

확장자 지정은 현재 작업의 공식 홈이지만, 여전히 초안 표면으로 남아 있습니다. SDK에서 지원되는 확장자 버전을 꽂아, 적합성 시나리오를 실행하고, 작업자 및 저장 도메인에서 케이블 어댑터를 격리하십시오.

이 작업이 하나 이상의 성질을 갖는 경우 작업을 사용한다.

- 보통 요청 시간차를 넘어서게 될 수도 있습니다.
- 노동자 줄을 서거나 외부 일자리 시스템이 이미 실행을 소유하고 있습니다.
- 클라이언트는 자신의 재발전 후 회복해야 합니다.
- 실행 중 사용자 또는 모델 입력에 대한 작업은 중단됩니다.
- 취소 및 지속 가능한 결과 검색은 제품 요구 사항입니다.

값싼 결정적 검색을 위한 과제를 만들지 마십시오. 손잡기, 끈기, 투표, 만료 및 취소는 실제 복잡함입니다.

## 국적 없는 핵심, 국적 적용

MCP 2026-07-28 삭제`initialize``notifications/initialized`, 프로토콜 세션, 그리고`Mcp-Session-Id`- 그건 국정상품을 금지하지 않습니다.

작업 ID는 명시적인 응용 상태입니다.

- 서버는 반환하기 전에 계속 유지합니다.
- 클라이언트는 다시 시작하면 저장하고 다시 조사를 할 수 있습니다.
- 아이디는 동일한 유연한 매장에서 뒷받침되는 모든 복사본으로 연결될 수 있습니다.
- 모든 작업 방법에서 권한은 확인됩니다.
- 만료 및 삭제는 운송 기간이 아닌 작업 필드들에 의해 정의됩니다.

이것은 연결에 연결된 숨겨진 상태와 운영적으로 다릅니다.

네 생애를 분리시켜라

| State | Lifetime | Where it belongs |
|---|---|---|
| Protocol metadata | One request | `params._meta`, validated again on every call |
| Transport work | One stdio request or HTTP response | In-flight coordinator with a bounded deadline |
| MRTR continuation | One retry sequence | Integrity-protected `requestState`, plus replay controls when needed |
| Durable task | Across requests, replicas, restarts, and reconnects | Shared application store keyed by an authorized `taskId` |

작업 기록을 프로세스 메모리에 이동하면 MCP가 상태가 되지 않습니다. 그것은 응용 프로그램을 신뢰할 수 없게 만듭니다. 프로토콜은 상태가 없습니다. 그러나 나중에 `tasks/get`다른 복사본으로 로우트하면 기록이 복구될 수 없습니다. 핸들을 반환하기 전에 계속 유지하세요.

## 능력 협상

고객은 지원이 가능한 모든 요청에 대해 광고합니다.

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "extensions": {
        "io.modelcontextprotocol/tasks": {}
      }
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "lesson-client",
      "version": "1.0.0"
    }
  }
}
```

서버가 정확한 결과를 반환합니다`supportedVersions`, 능력,`ttlMs`그리고`cacheScope``server/discover`, 같은 확장 기능. 그것은 도구를 광고 하기 때문에, 그것은 또한 의무적인 구현`tools/list`그 결과 결정적인 결과를 가져옵니다`generate_report`설명자, 유효한 객체 `inputSchema``resultType: "complete"`, 서버 아이덴티티 메타데이터, 공개 캐시 힌트

확장 반환을 선언하지 않은 클라이언트의 작업 방법 `-32021`, 필요한 고객 능력이 없어진 상태`data.requiredCapabilities` 설정`{"extensions":{"io.modelcontextprotocol/tasks":{}}}`. 지원되지 않은 프로토콜 문자열을 반환합니다`-32022`정확히`supported`그리고`requested`데이터; 실종 또는 문자열 없는 버전이 반환됩니다 `-32602`- 그래

JSON-RPC 없이 한 봉투`id`수신기는 처리할 수 있지만, JSON-RPC 결과나 오류를 발생시키지 않습니다. 스트리메이블 HTTP 어댑터가 반환합니다.`202 Accepted`승인된 통보를 위한 기관이 없는 상태입니다.

현재는`tools/call`작업 증강 실행을 지원합니다. 미래의 요청 유형이 저장 저장소를 다시 작성하지 않아도 될 내부 추상화를 설계하십시오.

## 서버에 의해 작업이 생성됩니다

오래된 고객 깃발`params._meta.task.required`클라이언트가 확장 지원을 선언하고 서버가 특정 `tools/call`과제가 되는 것입니다.

요청:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_report",
    "arguments": {"size": "large"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

응답:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "task",
    "taskId": "tsk_786512e29e0d",
    "status": "working",
    "statusMessage": "Preparing report outline.",
    "createdAt": "2026-08-21T10:30:00Z",
    "lastUpdatedAt": "2026-08-21T10:30:00Z",
    "ttlMs": 900000,
    "pollIntervalMs": 1000
  }
}
```

서버는 이 손잡이를`tasks/get`결국 일관된 저장소에서는 응답하기 전에 읽기 가시성을 기다립니다. 그렇지 않으면 클라이언트는 유효한 ID를 수신하고 즉시 "찾지 않습니다".

작업 응답은 클라이언트가 작업 모드를 요청하지 않는다는 의미에서 요청되지 않습니다. 그것은 협상되지 않습니다. 현재 요청은 여전히 확장 프로그램을 광고해야합니다.

## 임무 형태

모든 임무는 다음과 같습니다.

- `taskId`: 안정적인 서버 생성 식별자
- `status`이 책:`working``input_required``completed``cancelled`또는`failed`
- `createdAt`그리고`lastUpdatedAt`: ISO 8601 시간표
- `ttlMs`: 창작 이후의 만료 기간 또는 `null`광고된 제한 없이
- 선택적`pollIntervalMs`: 서버의 현재 제안된 최소 투표 순서;
- 선택적`statusMessage`: 사용자 또는 모델에 맞춘 맥락.

상태별 필드는 관련 있는 경우에만 표시됩니다.

- `input_required`포함됩니다`inputRequests`- 그래
- `completed`본 요청의 내용을 포함합니다 `result`형태
- `failed`JSON-RPC를 포함합니다 `error`객체

고객님께 감사드리겠습니다`pollIntervalMs`서버는 더 공격적인 설문조사를 제한할 수 있고 작업 기간 동안 간격을 변경할 수 있습니다.

## `tasks/get`

클라이언트는 현재 스냅샷을 요청합니다.

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/get
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tasks/get",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

`tasks/get`그 결과 항상 `resultType: "complete"`- 둥지를 틀어 놓은 임무는 여전히 있을 수 있습니다`status: "working"`또는`status: "input_required"`- 그래

이 구별은 일반적인 파서 버그를 방지합니다:

```text
result.resultType = complete    means the tasks/get RPC finished
result.status = working        means the represented job is still running
```

- 아니`tasks/result`작업이 완료되면 다음 작업이 완료됩니다.`tasks/get`답은 원래의 내용에 맞게 `CallToolResult`아래`result`이 부분의 본문은

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "completed",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:34:12Z",
  "ttlMs": 900000,
  "result": {
    "resultType": "complete",
    "content": [
      {"type": "text", "text": "Generated large report with approved outline."}
    ],
    "structuredContent": {"size": "large", "approved": true},
    "isError": false,
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "tasks-demo",
        "version": "1.0.0"
      }
    }
  },
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "tasks-demo",
      "version": "1.0.0"
    }
  }
}
```

외부`resultType``tasks/get`RPC 완료. 둥지를 틀어`result.resultType`원래 도구 호출이 완료되었다고 합니다. 그 둥근 차별수가 필요합니다.`CallToolResult`또한 자신의 `io.modelcontextprotocol/serverInfo`이 교훈은 그 종류가 없는 유용한 짐을 저장하는 대신 포함됩니다.

- 아니`tasks/list`. 세션 없는 서버는 연결 스코드 목록에 어떤 작업이 속하는지 안전하게 추론할 수 없습니다. 역사가 필요한 응용 프로그램은 명시적인 필터 및 소유권 규칙을 가진 승인된 도메인 도구를 노출해야합니다.

## 작업 수행 도중 입력

작업 입력과 핵심 MRTR는 비슷하지만 다른 연속을 사용합니다.

### 작업 생성 전에 필요한 입력

복귀핵`resultType: "input_required"`원본에서`tools/call`클라이언트는 그 작업을 수행하고 원래 호출을 다시 시도합니다. 시크로노 MRTR 라운드 종료 후만 작업을 생성합니다.

### 작업 생성 후 필요한 입력

과제를 설정하세요`input_required`-`tasks/get``inputRequests`, 그리고 클라이언트는 응답을 보내 `tasks/update`. 클라이언트는 원래의 것을 다시 시도하지 않습니다.`tools/call`- 그래

단숨:

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "input_required",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:31:00Z",
  "ttlMs": 900000,
  "inputRequests": {
    "approve_outline": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Approve the generated report outline?",
        "requestedSchema": {
          "type": "object",
          "properties": {"approved": {"type": "boolean"}},
          "required": ["approved"]
        }
      }
    }
  }
}
```

업데이트:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/update
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tasks/update",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "inputResponses": {
      "approve_outline": {
        "action": "accept",
        "content": {"approved": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

성공적 반응은 빈 인정을 더합니다`resultType: "complete"`.국가 변화는 결국 일관되게 될 수 있기 때문에 클라이언트는 계속 투표를 하거나 듣게 될 것입니다.

각각`inputRequests`키는 전체 작업 기간 동안 고유해야 합니다. 반복합니다 `tasks/get`스냅샷은 동일한 외형 키를 표시할 수 있습니다. 클라이언트는 UI를 복제하고 서버는 알려지지 않은, 대체 된 또는 이미 완료 된 키에 대한 응답을 무시합니다. 부분 업데이트는 작업을 `input_required`필요한 모든 열쇠가 답이 될 때까지

## 취소 는 협조

`tasks/cancel`의도를 표시하고 빈 완전한 확인을 반환합니다. 그 확인은 근로자가 중단 된 것을 보장하지 않습니다. 작업은 먼저 완료 될 수 있습니다, 취소 또는 전환을 나중에 무시합니다.

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/cancel
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tasks/cancel",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

세 가지 작업 방법 모두에 대해`Mcp-Name`거울`params.taskId`. JSON-RPC 방법 이름을 반복하지 않습니다. `code/main.py`이 규칙은 중앙집권화됩니다`make_http_request`- 그래

수업 작업자는 취소를 즉시 존중하고 반복적인 전화를 무력하게 합니다. 제작 클라이언트는 여전히 취소를 협동적인 것으로 간주해야 합니다.

사용하지 마십시오`notifications/cancelled`그 통보는 영구적인 작업이 아닌 취소 요청을 포함합니다.

라우팅 경계에서 구별이 중요합니다. 요청 취소는 비행 중 한 번의 JSON-RPC 동작 또는 요청에 따라 확장 된 HTTP 응답을 목표로합니다.`tools/call`이미 돌아왔어`resultType: "task"`이 요청은 완료되어 그 운송을 종료하는 것은 지속 가능한 직장을 명명하거나 중단할 수 없습니다. `tasks/cancel`새로운 승인된 RPC입니다.`params.taskId`, 이 아이디를 반사합니다`Mcp-Name`, 작업의 소유자 백엔드를 해결하고 협동조합 취소 의도를 기록하고 근로자가 중단했다고 주장하지 않고 인증을 반환합니다.

따라서 게이트웨이는 요청 조정자와 작업 경로를 서로 다른 테이블에 보관해야 합니다. 응답이 완료되면 요청 테이블이 사라질 수 있습니다. 작업 경로는 터미널 상태와 저장 기간이 만료될 때까지 유지되어야 합니다. [Lesson 29: MCP Reliability, Cancellation, and Flow Control](../../29-mcp-reliability-cancellation-and-flow-control/docs/en.md)경주, 시간제, 무력, 압력, 그리고 두 경로의 규칙을 다시 시도합니다.

## 선택 사항의 통지

투표는 기본입니다. 포시 업데이트를 원하는 고객은 보내줍니다.`subscriptions/listen`작업 아이디를 가진 작업. 스트리메이블 HTTP에 대해서는 POST입니다. 응답은 요청 스코프 된 SSE 스트림입니다. 독립적인 GET 이벤트 스트림과 생동감 유지하기위한 프로토콜 세션이 없습니다.

서버는 승인된 ID를 확인합니다.`notifications/subscriptions/acknowledged`그리고 전체 스냅샷을 보낼 수 있습니다`notifications/tasks`. 확인 및 모든 작업 알림은`io.modelcontextprotocol/subscriptionId``_meta`, 이 `subscriptions/listen`요청 id. 각 작업 알림은 다른 방법으로`tasks/get`그 순간 다시 돌아올 것입니다.

클라이언트는 여전히 Tasks 확장자를 선언해야 합니다. 그들은 이벤트 재생 또는 `Last-Event-ID`- 그래

## 실패 의미론

두 개의 오류 계층을 올바르게 사용하십시오.

### 프로토콜 오류

유효하지 않은 방법 매개 변수 또는 알려지지 않은 작업 아이디는 일반적으로 JSON-RPC 오류를 반환합니다.`-32602`. 연장 지원 보고서는 실종`-32021`필요한 능력 객체와 함께

### 작업 수행 결과

- `isError: true`여전히 `completed`작업은 도구 호출이 정의된 결과를 생성했기 때문입니다.
- 연기된 실행 중 JSON-RPC 오류가 발생하여 작업이 완료됩니다 `failed`그리고 JSON-RPC 오류를 저장합니다`error`- 그래
- 사용자 거부는 생성할 수 있습니다 `cancelled`, 완료된 거부 결과 또는 다른 도메인 특정 안전한 결과. 선택에 대해 문서화하십시오.

## 지속 가능, 만료 및 소유

적어도 작업 ID, 상태, 시간표, ttl, 설문 간격, 원래 운영 소유, 결과 또는 오류, 미제품 입력 요청 및 발행된 모든 입력 키가 유지됩니다.

저장 키는 권위 있는 임차자와 원주인을 포함하거나 해결해야 합니다. 작업 아이디를 아는 것은 접근을 허용하지 않습니다. 모든 `tasks/get``tasks/update``tasks/cancel`, 그리고 가입

`ttlMs`생성 시 측정되며 변경될 수 있습니다. 클라이언트는 작업이 관찰 가능한 업데이트를 생성하지 못하게 되면 백스톱으로 취급할 수 있습니다. 서버가 실패하고 나중에 만료된 작업을 삭제할 수 있습니다. 완료 후 많은 밀리초 동안 완료 된 결과를 유지할 약속으로 설명하지 마십시오.

원자력 작성 또는 거래를 사용하십시오. 수업은 일시적인 파일을 작성하고 원자력으로 이름을 변경합니다. 복합 복제 서비스는 공유 내구성 스토어와 근로자 임대 또는 동등한 동시 제어 기능을 사용해야합니다.

```figure
tp-task-lifecycle
```

## 건설 해

`code/main.py`결정적인 작업 서비스를 구현합니다.

- `server/discover`수익금`supportedVersions`, 캐시 힌트, 그리고 작업 확장
- `tools/list`결정적, 캐시 가능한 `generate_report`유효한 입력 스키마를 가진 설명자
- `tools/call`다시 돌아가기 전에 작업을 생성하고 지속합니다 `resultType: "task"`- 그래
- 새로운 서비스 인스턴스는 동일한 작업을 다시 로드하여 재부팅 복구를 보여줍니다.
- `tasks/get`전체 작업 스냅샷을 반환합니다.
- 노동자는 `working` `input_required`- 그래
- `tasks/update`양식을 받아서 공허한 완전한 확인을 반환합니다.
- 노동자는 둥지를 틀고 있는 `CallToolResult`자기만의`resultType`그리고 서버 아이덴티티, 그리고`completed`- 그래
- `tasks/cancel`이 실행에 무력하다.
- HTTP 빌더 세트`Mcp-Name` `params.taskId``tasks/get``tasks/update`그리고`tasks/cancel`- 그래
- 통지 보조기 사용 `notifications/subscriptions/acknowledged`그리고`notifications/tasks`, 두 가지 모두 청취 요청 ID로 표시되었습니다.
- ID-less 알림은 JSON-RPC 응답을 생성하지 않습니다.

근로자는 배경 스레드에서 잠을 자지 않고 명시적으로 진행합니다. 이것은 모든 상태 전환을 결정적으로 만들고 프로토콜 예제를 줄을 기계와 분리합니다.

## 사용 하 고

저장소 뿌리에서:

```bash
cd phases/13-tools-and-protocols/13-mcp-async-tasks/code
python3 main.py
python3 -m unittest discover tests -v
```

예상 결과 순서:

```text
id=0 resultType=complete status=ack
id=1 resultType=task status=working
id=2 resultType=complete status=working
id=3 resultType=complete status=input_required
id=4 resultType=complete status=ack
id=5 resultType=complete status=completed
```

또한 확인해 보세요`tasks/status``tasks/result`그리고`tasks/list`현대 서비스에서 발견되지 않은 반환 방법
확인해봐`tools/list`결정적인 방법이며 현재 HTTP 작업 방법은 작업 ID를 반영합니다`Mcp-Name`- 그래

## 선박

`outputs/skill-task-store-designer.md`이제 확장에 대한 인식 디자인을 생산합니다: 능력 협상, 내구성-예정-회복 창조, 현재 방법, 입력 업데이트 흐름, 소유, 만료, 취소, 가입, 그리고 제거된 실험 방법에서 마이그레이션.

## 운동

1. 두 번째 출입 키를 추가하고 부분 `tasks/update`그리고 그 임무가 남아있다는 것을 증명합니다`input_required`두 키가 모두 열리지 않는 한
2. 가게에 임차 소유권을 추가하고 잘못된 인증된 원주인이 제시한 유효한 작업 아이디를 거부합니다.
3. 임대인 임대 계약 을 추가 하여 두 개의 서비스 인스턴스가 동시에 같은 작업을 수행 할 수 없다는 것을 증명한다.
4. POST 응답 SSE 어댑터를 구현하여 `subscriptions/listen`GET를 추가하지 마십시오.`Last-Event-ID`, 또는 세션 헤더
5. 유효기간 정리를 추가합니다. 임차가 아닌 임차의 존재가 유출되지 않고 유효기간 정해진 작업과 잘못된 작업 아이디를 구별합니다.

## 주요 용어

| Term | Meaning in the current extension |
|------|----------------------------------|
| Tasks extension | Optional `io.modelcontextprotocol/tasks` capability for durable async work |
| `CreateTaskResult` | Server-directed `resultType: "task"` response to an eligible request |
| `tasks/get` | Poll a full current task snapshot, including terminal result or pending input |
| `tasks/update` | Submit responses to a task's outstanding `inputRequests` |
| `tasks/cancel` | Acknowledge cooperative cancellation intent |
| `input_required` | Task status indicating client input is outstanding |
| `pollIntervalMs` | Server-suggested minimum delay before another poll |
| `ttlMs` | Expiry duration measured from task creation |
| Durable-before-return | Rule that the task id must resolve before its handle is sent |
| `notifications/tasks` | Optional full task snapshot delivered on a subscribed SSE response |

## 유산을 합성

2025-11-25 실험 표면은 클라이언트가 요청한 작업 증강을 사용했습니다.`tasks/status``tasks/result`, 그리고 선택적으로`tasks/list`.이 이름을 고정된 레거시 어댑터 안에만 보관하세요. 현재 클라이언트는 확장 기능을 사용하고, 서버에 의해 지향된 손잡이를 받아 들이고, 여론조사를`tasks/get`, 공급 입력 `tasks/update`, 그리고 작업 스냅샷에서 최종 결과를 읽습니다.

## 더 많은 읽기

- [Official MCP Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
