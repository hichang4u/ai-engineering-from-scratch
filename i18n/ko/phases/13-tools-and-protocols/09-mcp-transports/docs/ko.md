# MCP 운송: stdio 및 stateless 스트리밍 HTTP

> 교통은 MCP 메시지를 전송합니다.`2026-07-28`, 로컬 스튜디오 및 원격 스트리메이블 HTTP 모두 자기 설명 요청을 가지고 있습니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 07 and 08
**Time:** ~65 minutes

## 학습 목표

- 로컬 아이 프로세스 위한 스튜디오와 네트워크 서비스 위한 스트리메이블 HTTP를 선택하세요.
- 현대적인 단일 엔드포인트, POST만 스트리메이블 HTTP 계약을 구현합니다.
- JSON-RPC 기체에 대한 MCP 버전, 방법 및 이름 헤더를 반영하고 검증합니다.
- 요청에 따라 적용된 SSE 및 오래 지속되는`subscriptions/listen`정답으로 흐르죠.
- 기존의 동작을 현대화하지 않고 세션 기반 및 기존의 HTTP+SSE 배포를 마이그레이션하십시오.

## 문제

이전 스트리메이블 HTTP 버전은 연결 및 세션 행동과 프로토콜 협상을 결합했습니다. 서버는 을 만들 수 있습니다.`Mcp-Session-Id`, 독립적인 GET 스트림을 노출하고, 세션 종료에 DELETE를 받아서, SSE를 다시 시작하여 `Last-Event-ID`- 그래

MCP `2026-07-28`모든 요청은 어떤 건강한 작업자에게도 도착할 수 있습니다. 왜냐하면 프로토콜 버전과 클라이언트 기능이 요청 몸 안에서 이동하기 때문입니다. HTTP 헤더는 라우팅 및 정책에 대한 선택된 필드를 반영하지만 서버는 실행 전에 해당 헤더를 신체에 대해 검증합니다.

이 결과는 확장하기 쉽고 논하기 쉽다. 또한 2025 운송을 현재로 가르치는 서버가 잘못된 오류와 보안 모델을 가르치고 있다는 것을 의미합니다.

## 개념

### 스튜디오

스튜디오 결합은 클라이언트에서 시작되는 하위 프로세스입니다.

- 클라이언트는 stdin에 한 라인당 UTF-8 JSON-RPC 메시지를 작성합니다.
- 서버는 Stdout에 한 라인당 하나의 UTF-8 JSON-RPC 메시지를 작성합니다.
- 서버가 STDNR에 진단서를 작성합니다.
- 서버는 Stdin EOF에서 즉시 종료됩니다.
- 모든 현대적인 요청은 버전과 클라이언트 기능을 `params._meta`- 그래

이 프로세스는 많은 호출에 대해 작동할 수 있지만, 이것은 현대적인 프로토콜 세션이 아닙니다. 예상치 못한 상태에서 종료되면 비행 속 요청이 손실됩니다. 프로세스를 다시 시작하여 다시 발견하고, 재열, 구독을 다시 열고, 새로운 요청 아이디로 안전한 작업을 다시 시도하십시오.

### 2026-07-28에 스트리밍 가능한 HTTP

현대 서버는 MCP 엔드포인트 하나를 노출시킵니다.`/mcp`, 포스트를 받아들이는

모든 JSON-RPC 요청이나 알림은 새로운 HTTP POST입니다. 신체는 하나의 JSON-RPC 메시지를 포함합니다. 클라이언트는 서버에 JSON-RPC 응답을 보내지 않습니다.

요청에 대해 서버는:

- `Content-Type: application/json`한 번의 JSON-RPC 응답으로, 또는
- `Content-Type: text/event-stream`그 요청과 관련된 통지, 그 다음에는 최종 JSON-RPC 응답이 있습니다.

승인된 통지에 대해 서버가 반환합니다.`202 Accepted`시체가 없는

고객들은 두 가지 응답 유형을 광고합니다.

```http
Accept: application/json, text/event-stream
```

### POST만란 POST만란 뜻입니다

현대 스트리메이블 HTTP는 독립적인 GET 스트림과 DELETE 세션 엔드포인트이 없습니다.

- `GET /mcp`수익금`405 Method Not Allowed`- 그래
- `DELETE /mcp`수익금`405 Method Not Allowed`- 그래
- `Mcp-Session-Id`무시되고, 결코 발음되거나 반사되지 않습니다.
- `Last-Event-ID`현대적인 흐름이 다시 시작되지 않기 때문에 무시됩니다.

요청 스코프 스트림이 최종 응답 전에 끊어지면 클라이언트는 그 비행 속 요청을 잃었다. 다시 시도가 안전할 때 새로운 JSON-RPC 아이디로 새로운 요청을 발행 할 수 있습니다. 스트림을 재개 시도해서는 안됩니다.

### 출처 확인

서버가 확인합니다`Origin`DNS 재결합을 방지하기 위해 입력된 연결에 대한`403 Forbidden`. 브라우저 아닌 클라이언트는 생략할 수 있습니다`Origin`, 공식 교통 규정에 의해 허용됩니다.

로컬 서버는 `127.0.0.1`네트워크 서비스는 여전히 모든 요청에 인증과 권한이 필요합니다.

정통적 구성 후 정확한 기원 일치를 사용하십시오.`origin.startswith("https://trusted.example")`공격자가 통제하는 자사자를 받아들일 수 있기 때문에 안전하지 않습니다.

### HTTP 메타데이터 헤더가 필요

모든 현대 POST 요청에는 다음과 같은 것들이 포함됩니다.

```http
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes_search
```

헤더 규칙:

- `MCP-Protocol-Version`요구되고 동등해야 합니다`params._meta.io.modelcontextprotocol/protocolVersion`- 그래
- `Mcp-Method`요구되는 경우 JSON-RPC와 같아야 합니다 `method`- 그래
- `Mcp-Name``tools/call``resources/read`그리고`prompts/get`- 그래
- `Mcp-Name`=`params.name`또는`params.uri``resources/read`- 그래
- 헤더 값은 케이스에 민감하지만 헤더 이름은 케이스에 민감하지 않습니다.

안전하지 않거나 ASCII가 아닌`Mcp-Name`값은 정확한 UTF-8 Base64 센티널을 사용합니다:

```text
=?base64?{Base64EncodedValue}?=
```

서버는 그 값을 몸과 비교하기 전에 해독합니다.

실종, 잘못된 형태 또는 일치하지 않는 거울 헤더가 HTTP를 반환합니다`400`JSON-RPC 코드와 함께`-32020`. 헤더와 인체가 서버가 지원하지 않는 버전에 동의하면 HTTP를 반환합니다 `400``-32022`그리고 정확한 오류 데이터`{"supported":["2026-07-28"],"requested":"2027-01-01"}`- 그래

알려지지 않은 현대적인 방법은 HTTP를 반환합니다 `404`JSON-RPC`-32601`. JSON-RPC 인체는 두 개의 시대 클라이언트가 현대 오류와 기존의 엔드포인트 오류를 구별하기 위해 사용하기 때문에 중요합니다.

### 요청에 따라 적용된 SSE

서버는 한 가지 장기적인 요청에 SSE를 선택할 수 있습니다.

```text
POST tools/call id=41
  <- notifications/progress related to id=41
  <- notifications/progress related to id=41
  <- JSON-RPC response id=41
stream closes
```

서버는 이 스트림에서 독립적인 JSON-RPC 요청을 보내서는 안 됩니다. 샘플링, 발원 및 루트 상호 작용은 멀티 라운드 트립 요청 결과를 사용합니다. 응답 스트림을 닫는 것은 그 요청을 취소합니다.

재연용을 위해 SSE 이벤트 ID를 추가하지 마십시오. `Last-Event-ID`재개는 현대적인 개정의 일부 아닙니다.

### 장기적인 변경은 구독/청음

변경 알림은 클라이언트가 열고 있는 요청이 아니라 독립된 GET를 사용한다.

```json
{
  "jsonrpc": "2.0",
  "id": "listen-1",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true,
      "resourceSubscriptions": ["notes://note-1"]
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    }
  }
}
```

POST 응답은 오래 지속된 SSE 스트림입니다. 첫 번째 프로토콜 메시지는`notifications/subscriptions/acknowledged`. 확인, 모든 변경 알림 및 최종 결과`io.modelcontextprotocol/subscriptionId``_meta`,는 청취 요청 ID와 같습니다. 서버는 SSE 댓글을 유지보수자로 발송할 수 있습니다. 스트림이 떨어지면 클라이언트가 다시 발송합니다 `subscriptions/listen`새로운 요청 아이디와 영향을 받은 데이터를 다시 수정합니다.

`resources/subscribe`그리고`resources/unsubscribe`유서 깊은 시대에 속해있죠. 현대적인 연결에 사용하지 마세요.

### 명시적인 신청 상태

프로토콜 세션 제거는 상태의 작업 흐름을 금지하지 않습니다. 서버는 불투명한 상태 핸들을 만들어 정상 도구 결과로 반환할 수 있습니다. 클라이언트는 나중에 호출하는 경우 명시적인 논증으로 해당 핸들을 통과합니다.

인증된 원본에 손잡이를 묶어, 검증할 수 없게 하고, 만료되고, 모든 사용에 권한을 부여합니다. 이것은 운송 친화성에서 숨기기 보다는 응용 계층에서 상태를 가시하게합니다.

숨겨진 복제 상태로 인한 실패는 기계적입니다.

1. 요청 A는 복제 1에 도달하고 그 프로세스의 메모리에 드래프트를 만듭니다.
2. 응답은 드래프트 핸들을 반환하지 않습니다. 왜냐하면 구현은 연결이 드래프트를 식별한다고 가정하기 때문입니다.
3. 요청 B는 신선한 POST이며, 복제 2에 도달합니다.
4. 리플리카 2에는 유효한 프로토콜 메타데이터가 있지만 드래프트의 이름이나 로드를 할 방법이 없습니다. 따라서 작업 흐름은 실패하거나 잘못된 로컬 객체를 읽습니다.
5. 끈적진 라우팅은 증상을 수정하는 것으로 보입니다. 다시 시작하거나, 다시 시작하거나, 다시 일정을 변경하거나, 다음 요청을 옮기기 전까지.

올바른 경계는 두 부분으로 이루어져 있습니다. 각 요청에 프로토콜의 맥락이 남아 있습니다. 내구성 애플리케이션 상태는 클라이언트에 반환된 서버에 의해 멘트된 핸들 아래 공유 스토어에서 살고 있습니다. 다음 호출은 처리하는 물품을 공급하고, 모든 복사본은 동일한 기록을 로드하고, 권한은 인증 된 원주인과 임대인에게 기록을 묶습니다. 복제 메모리는 기록을 캐시할 수 있지만 정확성을 위해 필요한 유일한 복사본은 될 수 없습니다.

상태 메커니즘을 평생에 따라 선택하십시오. 요청 로컬 변수는 한 번의 호출을 수행 할 수 있습니다. 짧은 MRTR 연속은 무결성 보호를 사용할 수 있습니다 `requestState`. 초안 또는 지속 가능한 작업은 명시적인 핸들, 공유된 지속성, 만료성, 동시 제어 및 무력성 등을 필요로 합니다. 이들 객체는 MCP 프로토콜 세션이 아닙니다.

### HTTP 두 시대 호환성

현대 및 레거시 서버를 지원하는 클라이언트는 먼저 현대 POST을 시도합니다. HTTP를 수신하면`400``404`또는`405`, 시체를 검사합니다.

- 인식된 현대적인 JSON-RPC 오류가 서버가 현대적이라는 것을 증명합니다. 요청을 수정하거나 광고된 버전을 다시 시도하십시오. 하등급을 하지 마십시오.
- 빈 몸 또는 인식되지 않은 응답은 기존 HTTP+SSE 서버를 나타낼 수 있습니다. 그 다음만 오래된 GET 엔드포인트를 시도하고 그 유산을 기대합니다.`endpoint`이벤트

서버는 현대 메타데이터를 현대 POST 구현으로 라우팅하여 이전 클라이언트에서 분리된 레거시 엔드포인트를 유지함으로써 마이그레이션 중 두 시대를 지원할 수 있습니다.`2026-07-28`- 그래

```figure
tp-transport-handshake
```

## 사용 하 고

`code/main.py`파이썬 표준 라이브러리와 함께 한정된, 현대적인 스트리메이블 HTTP 서버를 구현합니다. 원본과 거울 헤더를 검증하고, 제거된 세션 헤더를 무시하고, 정상적인 호출에 JSON를 반환하고, 한정된 `subscriptions/listen`SSE 스트림

```bash
cd code
python3 main.py --probe
python3 -m unittest discover tests -v
```

탐사선 검사:

- 무효의 기원은 거부됩니다.
- 세션 아이디 없이 발견이 성공한다
- `Mcp-Session-Id`그리고`Last-Event-ID`무시당하는 경우
- 헤더 부합이 돌아옵니다`-32020`
- 지원되지 않은 버전이 반환됩니다 `-32022`정확히`supported`그리고`requested`데이터
- 승인된 ID 없는 알림은 HTTP를 반환합니다 `202`무장
-  및 삭제 반환`405`
- `subscriptions/listen`인증을, 통지 및 최종 결과를 통해 가입 아이디를 포함하는 POST 응답 스트림입니다.

## 선박

이 수업은 니다`outputs/skill-mcp-transport-migrator.md`. 현대 프로토콜 세션들을 제거하고 헤더-체 검증을 추가하고, 독립적인 GET를 대신하여 `subscriptions/listen`, 그리고 모든 유래의 다리를 눈에 띄게 분리합니다.

## 운동

1. 제거`Mcp-Method`POST에서 확인합니다. HTTP`400`그리고 오류`-32020`- 그래
2. 해당 헤더와 카디 버전을 보내십시오`2027-01-01`HTTP를 확인`400`, 오류`-32022`, 그리고 정확한 자료`{"supported":["2026-07-28"],"requested":"2027-01-01"}`- 그래
3. 베이스64 경비자를 보내`Mcp-Name`ASCII가 아닌 리소스 URI에 대한 확인`params.uri`- 그래
4. 최종 응답 전에 끝없는 청취 스트림을 끊고 새로운 JSON-RPC 아이디와 재출판 도구를 사용하여 재출판하십시오.
5. 핑 도구에 명시적인 작업 흐름 핸들을 추가하고 연결 친밀성을 사용하지 않고 권한 주체에 연결합니다.

## 주요 용어

| Term | Meaning |
|------|---------|
| stdio | Newline-delimited JSON-RPC over a client-launched subprocess |
| Streamable HTTP | Single endpoint where each modern message is a new POST |
| Request-scoped SSE | POST response stream containing related notifications and final response |
| `subscriptions/listen` | Long-lived POST request for opted-in change notifications |
| Header mismatch | HTTP `400` and JSON-RPC `-32020` when mirrored headers disagree with body |
| Origin validation | DNS-rebinding defense for incoming connections, not authentication |
| Explicit state handle | Application token passed as an ordinary argument instead of hidden session state |
| Legacy bridge | Separate earlier-era behavior kept only for compatibility |

## 더 많은 읽기

- [MCP Transport Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
