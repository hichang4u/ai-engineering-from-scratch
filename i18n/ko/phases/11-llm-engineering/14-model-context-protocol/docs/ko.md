# 모델 컨텍스트 프로토콜 (MCP)

> MCP는 AI 호스트에 도구, 자원 및 명령어를 발견하고 호출하는 프로토콜을 제공합니다. 2026-07-28 개정에서는 그 프로토콜이 무국립화됩니다. 기능과 버전 컨텍스트는 모든 요청과 함께 이동합니다. 연결이 묶인 손떨림이 아닙니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 03 (Structured Outputs)
**Time:** ~75 minutes

## 학습 목표

- MCP 호스트, 클라이언트, 서버, 운송 및 서버 원시의 구별
- MCP 2026-07-28에 의해 요구되는 메타데이터로 JSON-RPC 요청을 작성합니다.
- 사용`server/discover`버전, 정체성 및 기능을 검사하기 위해서
- 도구, 자원 및 명령어에서 입력 및 캐시 인식 결과를 반환합니다.
- 현대 무국민 MCP가 손부름 시대 서버와 어떻게 상호 작용하는지 설명해 주십시오.
- 서버에 대한 안전 상태, 운송 및 승인 경계를 선택하십시오.

## 문제

애플리케이션은 데이터베이스 쿼리, 캘린더 운영, 파일 리더가 필요합니다. 공유 프로토콜이 없으면 모든 AI 호스트는 동일한 기능에 맞춤식 발견, 호출, 오류, 운송 및 권한 접착제가 필요합니다.

MCP는 그 통합 매트릭스를 줄이고 서버는 표준 JSON-RPC 표면을 게시합니다. 컴플라이언트는 서버 특수한 어댑터 없이 표면을 발견하고 모델이나 사용자에게 제시하고, 호출하고 결과를 해석할 수 있습니다.

중요한 경계는 간편하게 놓칠 수 있습니다. MCP는 통신을 표준화합니다. 모델이 어떤 도구를 호출해야 하는지, 신뢰할 수 없는 콘텐츠를 안전하게 만들거나 무국부 요청을 내구성 애플리케이션 상태로 전환하는 것을 결정하지 않습니다. 호스트와 서버는 여전히 그러한 결정을 소유합니다.

## 개념

![MCP host, stateless request, and server primitives](../assets/mcp-architecture.svg)

### 세 개의 서버 원시

1. **Tools**각 도구는 이름, 설명, JSON 스키마 입력 및 핸들러를 가지고 있습니다.
2. **Resources**위탁자가 읽을 수 있는 URI에 의해 주소된 콘텐츠를
3. **Prompts**호스트가 사용자에게 노출시킬 수 있는 재사용 가능한 템플릿입니다.

호스트는 AI 응용 프로그램입니다. 그 호스트 내부의 MCP 클라이언트는 하나의 서버에 대화합니다. 운송은 JSON-RPC 메시지를 그 사이에 운반합니다.

### 국적을 상실한 신청은 손부름을 대체한다

MCP 2026-07-28 삭제`initialize`그리고`notifications/initialized`또한 프로토콜 수준의 세션들을 제거합니다. 모든 요청은 그 내용을 해석하기 위해 필요한 맥락을 가지고 있습니다.`params._meta`이 부분의 본문은

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

프로토콜 버전과 클라이언트 기능이 필요합니다. 클라이언트 아이덴티티는 권장됩니다.`_meta`, 부실된 요구되는 필드 또는 잘못된 타입의 요구되는 필드가 잘못 형성되어 유효하지 않은 파라마를 반환합니다 (`-32602`). 서버가 지원하지 않는 잘 형성된 버전 문자열을 반환합니다 `UnsupportedProtocolVersionError`(`-32022`). 서버는 이전에 협상 기록을 복구하지 않고 유효한 요청을 처리할 수 있습니다.

국정 없는 것은 응용 프로그램이 절대 상태를 유지할 수 없다는 것을 의미하지는 않습니다. 그것은 MCP 연결 뒤에 상태가 숨겨지지 않았다는 것을 의미합니다.`Mcp-Session-Id`. 작업 흐름이 연속성을 필요로 하는 경우, 서버는 불투명한 핸들을 만들어서 클라이언트는 나중에 호출하는 데에 일반적인 도구 аргумент으로 그 핸들을 통과합니다.

### 발견 및 버전 선택

모든 현대 서버 구현`server/discover`. 결과는 지원된 버전, 기능 및 서버 아이덴티티를 광고합니다:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "complete",
    "supportedVersions": ["2026-07-28"],
    "capabilities": {
      "tools": {},
      "resources": {},
      "prompts": {}
    },
    "ttlMs": 3600000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "demo-server",
        "version": "1.0.0"
      }
    }
  }
}
```

클라이언트는 다른 메소드를 직접 호출하여 버전 오류를 처리할 수 있지만, 발견은 기능 표시와 버전 선택을 명시적으로 만듭니다. 지원되지 않은 버전이 반환됩니다.`UnsupportedProtocolVersionError`코드와 함께`-32022`. 그 자료는`supported`, 서버 리비전들의 배열, 그리고`requested`, 거절된 수정

스튜디오에서, 두 개의 시대 클라이언트가`server/discover`발견 결과 또는 현대에 인정된 오류`UnsupportedProtocolVersionError`현대적인 서버를 식별합니다. 현대적인 서버로 인식되지 않는 오류 또는 타임아웃은 2025-11-25로 되돌아가도록 허용합니다.`initialize`유래한 행동은 호환성 코드입니다. 현대의 기본 방식은 아닙니다.

### 결과는 명백합니다

2026-07-28의 모든 핵심 결과는`resultType`이 부분의 본문은

- `complete`작전이 끝났다는 뜻이죠.
- `input_required`즉 서버가 멀티 라운드 트립 요청 패턴을 통해 다시 돌아가는 것이 필요합니다. 핵심 서버는`tools/call``resources/read`또는`prompts/get`- 그래

고객은 기존의 결과를 생략하는 결과를 처리해야 합니다`resultType`완전하게

서버는 포함되어야 합니다`io.modelcontextprotocol/serverInfo`모든 결과에서`_meta`이 아이덴티티는 자기보고되어서 보안 결정에 필요한 것이 아니라 표시, 로그링 및 디버깅을 위한 것입니다.

목록 및 읽기 결과 또한 `ttlMs`그리고`cacheScope`- 결정론`tools/list`순서와 신선함 단서가 고객들에게 발견을 안전하게 캐쉬하고 프롬프트 캐쉬 안정성을 향상시킵니다. `cacheScope: public`공유 캐시 사용 권한`private`다시 사용은 호출의 맥락에 제한됩니다.

### 케이블 형식 및 운송

MCP는 stdio 또는 Streamable HTTP를 통해 JSON-RPC 2.0를 사용합니다.

- 요청은`jsonrpc``id``method`그리고`params`- 그래
- 응답은 일치합니다`id`그리고`result`또는`error`- 그래
- 통지에는 없습니다`id`그리고 아무런 응답을 기대하지 않습니다.

현대 스트리메이블 HTTP는 POST을 받아들이는 한 엔드포인트를 노출합니다. 각 JSON-RPC 메시지는 자체 POST을 얻습니다. 요청 POST은 하나의 JSON 객체 또는 최종 응답으로 끝나는 요청 스코프 된 서버-송 이벤트 스트림을 수신합니다. 승인된 알림 POST은 응답 체질이없는 HTTP 202을 수신합니다. 이 핵심 수정에서는 스트리메이블 HTTP에 대한 클라이언트-서버 알림을 정의하지 않습니다.

독립된 MCP GET 스트림, DELETE 세션 엔드포인트가 없습니다.`Mcp-Session-Id`또는`Last-Event-ID`2026-07-28에 재발전합니다.`subscriptions/listen`POST의 응답은 SSE 스트림으로 열려 있습니다.

### 서버가 시작한 요청 없이 클라이언트 입력

이전 버전에서는 서버가 `sampling/createMessage``roots/list`또는`elicitation/create`현재 프로토콜은 여러 차례의 회전 요청을 사용합니다. 자격을 갖춘 도구 호출, 리소스 읽기 또는 응답을 요청합니다.`resultType: input_required`적어도 1개`inputRequests`또는`requestState`. 클라이언트는 요청된 입력 정보를 수집하고, 새로운 JSON-RPC ID와 그에 따른 `inputResponses`, 그리고 정확히 `requestState`만약 그렇지 않다면`inputRequests`이 실험은 다시 시도하지 않습니다`inputResponses`- 그래

루트, 샘플링, 로그닝은 기능적이지만 쓸모가 없어서 새로운 구현은 이를 채택해서는 안 됩니다. 기존 루트 또는 샘플링 요청은 MRTR 내부에 이동합니다 `inputRequests`, 독립적인 서버에서 클라이언트 JSON-RPC 요청으로 결코. 명시적인 파일 또는 디렉토리 매개 변수, 리소스 URI, 서버 구성 및 직접 모델 제공자 통합을 선호합니다. 스튜디오 진단에 stderr 및 생산 텔레메트리에서 OpenTelemetry를 사용하십시오.

```figure
mcp-nxm-collapse
```

## 건설 해

### 단계 1: 서버 표면을 등록

신청 계약이 변경되었음에도 불구하고 등록은 단순하다:

```python
server = MCPServer("demo-server")

@server.tool(
    "add",
    "Add two integers.",
    {
        "type": "object",
        "properties": {
            "a": {"type": "integer"},
            "b": {"type": "integer"}
        },
        "required": ["a", "b"]
    }
)
def add(a: int, b: int) -> dict:
    return {"sum": a + b}
```

`code/main.py`또한 리소스를 등록하고 니다. SDK에 프로토콜을 위임하기보다는 각각의 봉투를 볼 수 있도록 표준 라이브러리를 의도적으로 사용합니다.

### 단계 2: 모든 요청에 메타 데이터를 첨부

```python
def request(method, params=None):
    body_params = dict(params or {})
    body_params["_meta"] = {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {},
        "io.modelcontextprotocol/clientInfo": {
            "name": "demo-client",
            "version": "1.0.0"
        }
    }
    return {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": body_params
    }
```

이 메타데이터를 연결 객체에서만 캐시하지 마십시오. 서버는 모든 요청에 이를 검증합니다.

### 단계 3: 선택적으로 목록에 올리기 전에 발견

전화`server/discover`지원되는 버전을 선택하고, 전화하십시오.`tools/list`- 직접적인`tools/list`버전이 이미 알고 있고 처리할 수 있다면 유효합니다.`-32022`- 그래

데모는 이름 순서로 도구 목록을 반환하고 첨부합니다 `ttlMs``cacheScope``resultType`도구 호출은 전체, 캐시되지 않는 결과를 반환합니다. 왜냐하면 그 출력은 현재 상태에 따라 달라질 수 있기 때문입니다.

### 단계 4: 동일한 요청을 HTTP로 표시

원격`tools/call`POST에는 JSON-RPC 인체를 반영하는 헤더가 포함되어 있습니다.

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

`MCP-Protocol-Version`헤더는 `_meta`-`Mcp-Method`모든 JSON-RPC 요청에 필요한데 일치해야 합니다`method`-`Mcp-Name``tools/call``resources/read`그리고`prompts/get`, 도구 이름, 리소스 URI 또는 프롬프트 이름과 일치해야 합니다.`HeaderMismatch`코드`-32020`- 그래

### 단계 5: 프로토콜 상태 밖의 안전을 강화

- 모든 HTTP 요청에 대한 권한과 관객을 확인합니다.
- 로컬 서버를 로컬 호스트에 연결하고 검증합니다`Origin`스트리메이블 HTTP에
-                                       `destructiveHint: true`그리고 호스트의 승인을 요구합니다.
- 노후화된 루트에 의존하는 대신 디렉토리와 파일 범위를 명시적으로 통과하십시오.
- 자원과 도구 출력 자료를 신뢰할 수 없는 데이터로 취급한다.
- stdio 아래에서 JSON-RPC에 대한 stdout를 예약하고 stderr에 진단서를 작성하십시오.

## 사용 하 고

이 책에서 교훈을 실행하세요:

```bash
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

첫 번째 줄은 발견된 것을 보고해야 합니다`demo-server`프로토콜에`2026-07-28`- 그럼 검사해`MCPClient.request`: 재건합니다`_meta`한 요청에서 메타 데이터를 제거하고 서버가 거부하는 것을 관찰하십시오.

## 선박

`outputs/skill-mcp-server-designer.md`도메인을 상태 없는 MCP 디자인으로 변환합니다. 그 수용 게이트는 발견 결과, 요청에 따른 메타데이터 정책, 결정적인 캐시 인식 목록, 명시적인 상태 핸들, 운송 헤더, 권한 및 승인 규칙이 필요합니다.

## MCP 심층 다이빙을 계속하십시오

이 수업은 프로토콜 모델을 제공합니다. 13단계에서는 생산의 4가지 경계를

1. [MCP Tool Contracts and Content](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md)폐쇄된 입력 스키마, 구조화된 콘텐츠, 라우팅 메타데이터, 불투명한 페이지링, 완료 권한 및 프로토콜 및 도구 도메인 오류 사이의 차이점을 다루고 있습니다.
2. [MCP Reliability, Cancellation, and Flow Control](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md)요청 취소, 지속 가능한 작업 취소, 임대, 무력, 역압, 프록시 버퍼링 및 재 연결 행동 등을 포함합니다.
3. [MCP Registry Supply Chain, Admission, Drift, and Rollback](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md)이름 공간 증명, 유물 출처, 변함없는 핀, 라이브 드리프, 레지스트리 상태, 입학 증거 및 롤백을 포함한다.
4. [MCP Conformance Engineering](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md)금색 및 부정적인 문자 표본, 엄격한 버전 시대, SDK 차원, 프록시 증거, 편집, 건강 게이트 및 출시 롤백을 포함합니다.

서버가 팀이나 신뢰 경계를 넘을 때 순서대로 따라가십시오. 함께 그들은 방법 작동하는에서  계약은 배치로 안전하고 진단될 수 있습니다.

## 운동

1. `subtract`도구 및 확인`tools/list`알파벳 순서로 되어 있습니다.
2. 프로토콜 버전 키를 제거하고 유효하지 않은 파라마를 확인 (`-32602`) 잘 만들어진 하지만 지원되지 않은 버전을 보내십시오`2025-11-25`, 확인`-32022`확인해`requested`이 개정에서 호응을 얻고 선택하세요`supported`- 그래
3. 서버에 멘트된 `draftId`이 작업은, 실행을 생성하기 위해, 이를 업데이트 할 수 있는 주장으로 요구합니다.
4. 돌아와`input_required`사용자 확인을 필요로 하는 도구에서 다시 원래 통화 ID를 사용하여 다시 시도합니다.`inputResponses`입문, 그리고 정확한 `requestState`서버에서 클라이언트까지의 JSON-RPC 요청을 발명하기 보다는
5. 두 시대적인 스튜디오 클라이언트를 스케치하고, 결과 또는 현대 오류를 현대화로 인식하고, 재발을 허용합니다.`initialize`인정되지 않은 오류 또는 시간제만

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| MCP | "Tool protocol for LLMs" | JSON-RPC protocol for server discovery, tools, resources, prompts, and extensions |
| Host | "The AI app" | Owns the model and UI and mounts one or more MCP clients |
| Client | "The connector" | Speaks MCP to one server on behalf of a host |
| Stateless MCP | "No session" | Every request carries version and capabilities; no protocol state is keyed by a connection |
| `server/discover` | "Capability probe" | Required server method advertising versions, capabilities, and identity |
| `resultType` | "Result state" | Marks a result as `complete` or `input_required` |
| State handle | "Workflow id" | Server-minted application identifier passed as an ordinary argument |
| Streamable HTTP | "Remote transport" | One POST endpoint with JSON or request-scoped SSE responses |
| MRTR | "Ask and retry" | Input request embedded in a result, followed by a retry of the original operation |

## 더 많은 읽기

- [MCP 2026-07-28 key changes](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP deprecated features](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
