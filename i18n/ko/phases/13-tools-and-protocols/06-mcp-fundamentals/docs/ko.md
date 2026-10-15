# MCP 기본 사항: 국적 없는 요청 및 JSON-RPC

> 현대 MCP는 손잡이와 프로토콜 세션이 없습니다. 각 요청은 자체적으로 이해, 승인, 라우팅 및 재시험 할 수있는 충분한 메타 데이터를 가져야합니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 01 through 05
**Time:** ~55 minutes

## 학습 목표

- MCP의 서버 원시물들을 클라이언트 측면 기능에서 구별한다.
- MCP에 대한 유효한 JSON-RPC 2.0 요청 및 응답을 작성합니다 `2026-07-28`- 그래
- 모든 요청에 프로토콜 버전, 클라이언트 기능 및 클라이언트 아이덴티티를 첨부하십시오.
- 사용`server/discover`그리고 처리`UnsupportedProtocolVersionError`손잡이 없이
- 검증에서 독립된 한 요청을 완전한 결과로 추적합니다.

## 문제

MCP 서버는 동일한 프로세스 또는 HTTP 작업자에서 서로 다른 클라이언트로부터 두 개의 연속 요청을 수신할 수 있습니다. 서버가 이전 요청이 선언한 것을 기억하면 잘못된 권한을 적용하거나 잘못된 문자 모양을 반환 할 수 있습니다.

MCP `2026-07-28`이 두 가지 명확성을 제거합니다. 프로토콜 코어는 상태가 없습니다. 서버는 연결 역사에서 아닌 현재 요청에서 현재 요청을 처리하는 방법을 결정해야합니다.

이것은 정신 모델을 변화시킵니다. 오래된 순서는 연결이 먼저, 손떨림이 두번째, 작업이 세 번째입니다. 현대 순서는 더 간단합니다.

1. 클라이언트는 자기 설명 요청을 보내죠.
2. 서버는 그 요청의 버전과 기능을 확인합니다.
3. 서버가 메소드를 처리합니다.
4. 서버는 입력된 결과 또는 JSON-RPC 오류를 반환합니다.

다음 요청은 처음부터 같은 과정을 반복합니다.

## 개념

### 서버 원시

MCP 서버는 3가지 기본 원시성을 노출합니다.

1. **Tools**모델 제어된 행동으로 발견됩니다.`tools/list`그리고 `tools/call`- 그래
2. **Resources**URI에 의해 발견된 데이터입니다.`resources/list`그리고 `resources/read`- 그래
3. **Prompts** `prompts/list`그리고 `prompts/get`- 그래

뿌리, 샘플링, 그리고 나무를 채굴하는 것은`2026-07-28`호환성 스케마, 하지만 그들은 비효율적입니다. 새로운 구현은 뿌리 (roots) 의 명시적인 도구 또는 자원 입력, 샘플링을 위한 직접 모델 제공자 API, 그리고 로그링을 위한 stderr 또는 OpenTelemetry를 사용해야 한다. 여러 차례의 순환 요청으로 유출이 가능해집니다. 서버가 입력 요청을 반환하고 클라이언트는 원래 동작을 다시 시도합니다. 현대 서버는 독립적인 JSON-RPC 요청을 시작하지 않습니다.

### JSON-RPC 봉투

MCP는 JSON-RPC 2.0을 사용합니다:

- 요청:`{jsonrpc, id, method, params}`
- 답변:`{jsonrpc, id, result}`또는`{jsonrpc, id, error}`
- 통지: `{jsonrpc, method, params}``id`

요청`id`하나의 응답을 상관관계가 있습니다. 프로토콜 세션을 생성하지 않습니다.

### 요구되는 요청 메타데이터

모든 현대적인 요청은`_meta`내부의 물체`params`이 부분의 본문은

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/list",
  "params": {
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

프로토콜 버전과 클라이언트 기능이 필요합니다. 클라이언트 아이덴티티는 권장됩니다. 그것은 자체 보고된 디스플레이 및 디버깅 데이터입니다. 보안 인증서가 아닙니다.

서버는 이전 요청, stdio 프로세스, HTTP 연결 또는 운송 헤더에서만 이러한 값 중 하나를 추론해서는 안 됩니다.

### 전체 결과 및 서버 아이덴티티

모든 성공적인 현대적인 결과는`resultType`. 정상적인 최종 결과 사용`"complete"`. 서버는 또한 결과 메타데이터에서 자신을 식별해야 합니다:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "resultType": "complete",
    "tools": [],
    "ttlMs": 30000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "notes-server",
        "version": "1.0.0"
      }
    }
  }
}
```

`tools/list``resources/list``prompts/list``resources/templates/list``resources/read`그리고`server/discover`캐시 가능한 결과입니다.`ttlMs`그리고`cacheScope`. 안전성 결제`ttlMs: 0`그리고`cacheScope: "private"`목록 항목은 결정적인 순서를 가지고 있어야 함으로써 동등한 응답은 안정적인 캐시 키와 안정적인 모델 맥락을 생성합니다.

### 손잡이가 없는 발견

모든 현대 서버가 구현해야 합니다`server/discover`. 클라이언트는 다른 방법으로 검색하기 전에 호출할 수 있습니다:

- `supportedVersions`
- 서버`capabilities`
- 선택적 사용`instructions`
- 결과 서버 정체성 `_meta`
- 캐시 힌트

발견은 유용하지만 게이트는 아닙니다. 클라이언트가 보낼 수 있습니다.`tools/list`첫째, 그 요청은 이미 프로토콜 버전과 기능을 가지고 있기 때문입니다.

요청된 버전이 지원되지 않으면 서버는 JSON-RPC 코드를 반환합니다 `-32022`이 기호는

```json
{
  "requested": "2027-01-01",
  "supported": ["2026-07-28"]
}
```

클라이언트는 상호 지원되는 현대 버전을 선택하고 새로운 JSON-RPC 요청 ID를 다시 시도합니다.

### 한 요청 수명주기

현대적인 요청에 대한 추적은 다음과 같습니다.

1. JSON-RPC 봉투 1개를 분석해 보세요.
2. 확인`jsonrpc` `"2.0"`,`id`존재합니다.`method`이 선은`params`물체입니다.
3. 버전 문자열 및 기능 객체를 에서 요구합니다`params._meta`; 잘못된 형식 또는 실종된 메타데이터`-32602`- 그래
4. HTTP 경계에서 버전, 방법 및 적용 가능한 이름 헤더를 몸과 비교하십시오.`-32020`두 버전 값 중 하나가 지원되지 않는 경우에도
5. 평등이 확립된 후, 일치하지만 지원되지 않는 버전을 거부합니다`-32022`- 그래
6. 필요한 역량을 확인하고, `method`그리고 방법별 논증을 검증합니다.
7. 콘크리트 조작이 실행되기 전에 인증하고 승인하십시오.
8. 서버 아이덴티티와 함께 완전한 결과를 반환합니다.
9. 요청에 따른 프로토콜 메타데이터를 잊어버리세요.

이 명령은 두 개의 구성 요소가 서로 다른 호출을 해석하는 것을 막아줍니다.`Mcp-Name: notes.read`출처가 실행되는 동안`params.name: notes.delete`. 또한 잘못된 입력, 헤더 혼란, 버전 협상, 기능 장애, 권한 및 핸들러 실패를 명확한 증거로 유지합니다.

stdin 또는 HTTP 응답을 종료하면 운송 활동이 종료됩니다. 현대 MCP는 프로토콜 세션이 없기 때문에 프로토콜 세션을 종료하지 않습니다.

### 명시적인 유래 호환성

                                            `2025-11-25`사용`initialize``notifications/initialized`연결 스캔 기능, 이전 스트리메블 HTTP에서 선택적 프로토콜 세션. 이 행동은 여전히 오래된 서버와 대화하는 두 개의 시대 클라이언트에서 관련 있습니다.

에어들을 분리하여 보관하십시오. 현대 요청은 요청마다 필요한 메타 데이터로 식별됩니다. 레거시 연결은 문서화된 후퇴 경로를 통해만 선택됩니다. 전송하지 마십시오`initialize``2026-07-28`서버

따라서, 국적 없는 사람은 시대별 의미로`2026-07-28`, 그것은 프로토콜 변동성이: 모든 일반적인 요청은 독립적으로 해석될 수 있으며 MCP 세션이 존재하지 않습니다.`2025-11-25`, 초기화 및 협상 기능은 연결에 속하므로 호환성 어댑터는 기존 연결 상태를 유지할 수 있습니다. 이중 시대 구현은 허용 상태의 기계가 아닙니다. 그것은 분리 된 기존 어댑터 옆에 있는 상태없는 현대 핵입니다. 파서 중 어느 하나 실행되기 전에 명시적인 선택 결정이 있습니다.

두 가지 의미 모두 내구적인 응용 상태를 금지하지 않습니다. 작업 흐름, 작업 또는 드래프트는 공유 스토어에서 불투명한 핸들 뒤에 살 수 있습니다. 클라이언트는 그 핸드를 일반적인 입력으로 전송하고, 모든 복제본은 사용 권한을 인증합니다. 프로토콜 컨텍스트는 제거 세션의 대가로 저장소에 누출되지 않습니다.

```figure
mcp-tool-call
```

## 사용 하 고

`code/main.py`프레임워크 없이 현대 MCP 메시지를 생성, 검증, 추적, 전송합니다. 실행:

```bash
python3 code/main.py
python3 -m unittest discover code/tests -v
```

출력에서 3가지 변수를 찾아보세요.

- 모든 요청은 자신의`_meta`필드
- 모든 성공적 결과는`resultType: "complete"`서버 아이덴티티를 포함합니다.
- 목록 결과는 결정적으로 순서로 되어 있으며 명시적인 캐시 지시를 가지고 있습니다.

## 선박

이 수업은 니다`outputs/skill-mcp-handshake-tracer.md`. 역사적인 파일 이름은 안정적이지만, 이 유물은 현재 무국부 요청 추적기입니다. 그것은 각각의 메시지를 독립적으로 감사하고, 실제 존재할 때만 기존의 손부름 트래픽을 표시합니다.

## 운동

1. 한 요청의 프로토콜 버전을 로 변경합니다`2027-01-01`오류 코드가 확인해 주세요`-32022`그리고 데이터가 지원된 버전을 광고합니다.
2. 제거`io.modelcontextprotocol/clientCapabilities`두 번째 요청에서 서버가 첫 번째 요청에서 재사용하지 않는 것을 확인합니다.
3. 메모리 도구 레지스트리를 역전합니다. 확인 `tools/list`여전히 동일한 결정적 순서를 반환합니다.
4. 변화`cacheScope``public` `private`각 경우에 응답을 재사용할 수 있는 허가 맥락을 설명한다.
5. 선택 사항 추가`clientInfo`방치 테스트. 요청은 유효하게 남아 있어야 합니다. 왜냐하면 클라이언트의 신원은 권장되는 것이 아니라 요구되는 것이 아니기 때문입니다.

## 주요 용어

| Term | Meaning |
|------|---------|
| Stateless protocol | Every request supplies the metadata needed to interpret it |
| Request metadata | Version, client capabilities, and recommended client identity in `params._meta` |
| `server/discover` | Mandatory server method for versions, capabilities, instructions, and identity |
| `resultType` | Discriminator on every successful modern result |
| Cacheable result | Result that includes required `ttlMs` and `cacheScope` hints |
| Protocol era | Modern per-request metadata or legacy connection-scoped initialization |
| Transport lifetime | Process, connection, or response-stream lifetime, not protocol session state |
| `-32022` | Unsupported protocol version error with requested and supported versions |

## 더 많은 읽기

- [MCP Architecture](https://modelcontextprotocol.io/specification/2026-07-28/architecture)
- [MCP Base Protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP 2026-07-28 Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
