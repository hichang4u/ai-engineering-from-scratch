# 국적을 갖지 않는 프로토콜에 관한 MCP 앱

> 상호작용적인 결과물은 여전히 MCP 도구와 자원 교환입니다. 2026-07-28 코어는 그 교환을 자립하게 만들며, 앱 확장 프로그램은 샌드박스 브라우저 표면을 추가합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources)
**Time:** ~75 minutes

## 학습 목표

-                                                           `server/discover`그리고 요청에 따라 확장 기능.
- `ui://`도구가 호출되기 전에 도구에 있는 자원을
- 2026-07-28 무국속전선에서 전체 도구와 리소스 결과를 반환합니다.
- 앱을 분리 합니다 `ui/initialize`제거된 MCP 코어에서 브릿지 메시지가
- 출처 확인, 샌드박스, CSP 및 최소한의 권한 권한을 적용하십시오.

## 문제

텍스트 결과 는 시간 라인을 설명 할 수 있습니다. 사용자가 필터링 할 수, 검사 할 수 또는 행동 할 수 있는 시간 라인을 제공 할 수 없습니다.

MCP Apps는 선택적 확장 프로그램을 통해 프레젠테이션 문제를 해결합니다. 도구 정의는 `ui://`리소스: 호스트는 도구가 실행되기 전에 리소스를 가져와 검토하고, 샌드박스 iframe에 렌더링하고, JSON-RPC 브리지를 통해 모든 앱 동작을 중재할 수 있습니다.

2026-07-28에 핵심 프로토콜이 변경되었습니다. 이전 연결 라이프사이클에 앱을 포장하지 마십시오.

- 핵은 없습니다`initialize`요청 또는`notifications/initialized`통지
- - 아니`Mcp-Session-Id`헤더
- 모든 요청에는 프로토콜 버전과 클라이언트 기능이 포함되어 있습니다.`params._meta`- 그래
- 서버 구현`server/discover`그래서 클라이언트는 버전, 핵심 기능, 확장 프로그램을 확인할 수 있습니다.
- 모든 성공적 결과는`resultType`차별적인 행위
- 스트리메이블 HTTP는 요청에 한 개의 POST를 사용합니다. 현대 GET 및 DELETE 입점으로 405을 반환합니다.

앱 브릿지는 여전히 `ui/initialize`iframe 메세지 방언에 속해있지만 MCP 세션의 핵심을 재창조하지 않습니다.

## 개념

### 두 개의 프로토콜, 하나의 기능

층을 명확하게 유지하십시오:

1. MCP 코어는 `server/discover``tools/list``tools/call``resources/list`그리고`resources/read`- 그래
2. MCP 앱 확장 프로그램은 UI를 선언하고 iframe-to-host 브리지를 정의합니다.
3. 브라우저 샌드박스 규칙은 UI가 도달할 수 있는 것을 제한합니다.

확장 식별자는`io.modelcontextprotocol/ui`. 두 동료 모두 선택합니다. 클라이언트는 각 요청에 대해 기능 객체 내부에서 확장 지원을 전송합니다:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "server/discover",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/ui": {}
        }
      },
      "io.modelcontextprotocol/clientInfo": {
        "name": "timeline-host",
        "version": "1.0.0"
      }
    }
  }
}
```

`clientInfo`진단에 권장됩니다. 이것은 자부지된 데이터이고 허가 신분증이 아닙니다.

### 렌더링 전에 발견

서버의 발견 결과에서 확장 프로그램이 광고됩니다.

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {},
    "resources": {},
    "extensions": {
      "io.modelcontextprotocol/ui": {}
    }
  },
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "timeline-app-server",
      "version": "2.0.0"
    }
  }
}
```

서버는 발견을 지원해야 합니다. 클라이언트는 모든 동작 전에 발견을 호출할 필요가 없습니다. 왜냐하면 모든 동작은 자신의 기능을 가지고 있기 때문입니다.

### 도구 정의에 UI를 표시

현대 앱 계약은 UI를 도구에 묶습니다 `tools/list`이 부분의 본문은

```json
{
  "name": "notes_timeline",
  "description": "Render a timeline of notes.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "_meta": {
    "ui": {
      "resourceUri": "ui://notes/timeline.html"
    }
  }
}
```

이것은 의도적으로 호출 전 메타데이터입니다. 호스트는 결과가 표시를 요청하기 전에 HTML를 미리 로드, 캐시 및 보안 검토 할 수 있습니다. 이전 평면 메타데이터 키는 호환성 코드에서 받아들일 수 있지만 새로운 서버는 둥지를 틀어 놓은 데이터를 배포해야합니다.`_meta.ui.resourceUri`형태

`tools/list`현재 코어에서 캐시할 수 있습니다. 결정적 순서를 포함합니다.`ttlMs`그리고`cacheScope`사용하세요`private`가시적인 도구가 사용자나 토큰에 따라 다르면

### 데이터를 반환하고 호스트가 보기 연결하도록

도구 호출은 일반적인 내용과 구조화된 데이터를 반환합니다.

```json
{
  "resultType": "complete",
  "content": [
    {"type": "text", "text": "Timeline ready."}
  ],
  "structuredContent": {
    "notes": [
      {"id": "note-1", "title": "Discover", "created": "2026-07-28"}
    ]
  },
  "isError": false
}
```

호스트는 이미 도구에 속하는 뷰를 알고 있습니다. URI를 반복하기 위해 새로운 콘텐츠 블록을 발명하지 마십시오.

### 앱을 리소스로 사용

서버는 광고를 합니다`resources`또한 의무적인`resources/list`운용. 그 결정적 목록 항목은 가전적 URI, 안정적인 이름, 설명 및 MIME 유형을 포함한다. 목록 결과에는 `resultType`, 서버 아이덴티티 메타데이터,`ttlMs`그리고`cacheScope`결정적 도구 목록과 마찬가지로

호스트가 보내주죠`resources/read`. 스트리메이블 HTTP에서 요청은 다음과 같습니다.

```text
POST /mcp
MCP-Protocol-Version: 2026-07-28
Mcp-Method: resources/read
Mcp-Name: ui://notes/timeline.html
```

헤더 값과 JSON-RPC 몸값이 일치해야 합니다. 일치하지 않는 것은 프로토콜 오류입니다.`-32020`- 그래

결과에는 HTML 리소스와 캐시 팁이 포함되어 있습니다.

```json
{
  "resultType": "complete",
  "contents": [
    {
      "uri": "ui://notes/timeline.html",
      "mimeType": "text/html;profile=mcp-app",
      "text": "<!doctype html>...",
      "_meta": {
        "ui": {
          "csp": {
            "connectDomains": [],
            "resourceDomains": [],
            "frameDomains": [],
            "baseUriDomains": []
          },
          "permissions": {}
        }
      }
    }
  ],
  "ttlMs": 60000,
  "cacheScope": "public"
}
```

### 실행 가능한 콘텐츠로 UI 리소스를 캐시

앱 리소스는 일반 프로사와 교환이 불가능하다. 캐시 입력은 브리지 코드 실행, 도구 데이터를 렌더링, 호스트 중재 된 작업을 요청할 수 있습니다.`ui://`URI, 승인된 서버 아이덴티티 및 버전, 리소스 콘텐츠 소화 및 권한 컨텍스트`cacheScope`프라이빗. 프라이빗 앱 리소스를 프라이빗 어플리케이션에서 재사용하지 마십시오. 왜냐하면 HTML 또는 정책 메타데이터는 URI가 동일하더라도 다를 수 있기 때문입니다.

입력된 항목을 비효율로 정하면`ttlMs`만료되면 도구가 `_meta.ui.resourceUri`결합 변경, 서버 버전 또는 허용된 설명자 핀 변경, 또는 승인된 리소스 변경 가입이 URI를 이름 붙여줍니다. 재설계하기 전에 CSP 및 권한 검토를 다시 적용하고 적용하십시오. 오래된 iframe는 새로운 리소스 버전이 아직 로드되지 않았기 때문에 더 넓은 권한을 유지할 수 없습니다.

### 기능 정책 전에 유선 모호함을 거부합니다

검증은 의도적인 순서를 가지고 있습니다. 먼저 JSON-RPC 모양을 검증하고 문자열 프로토콜 메타데이터와 객체 클라이언트 능력 지도가 필요합니다. 다음으로 라우팅 헤더를 몸과 비교하십시오. 일치하는 프로토콜 버전이 지원되는지 결정하기 위해서는 다음으로 결정합니다. 이 순서는 프록시와 서버가 다른 요청을 해석하는 것을 막습니다.

| Condition | HTTP | JSON-RPC error |
|-----------|------|----------------|
| Header and body version, method, or name disagree | 400 | `-32020` |
| Header and body agree on an unsupported version | 400 | `-32022`, with `data` exactly `{"supported":["2026-07-28"],"requested":"<actual>"}` |
| `resources/read` lacks the Apps extension capability | 400 | `-32021`, with `data.requiredCapabilities.extensions.io.modelcontextprotocol/ui` |
| Method is unknown | 404 | `-32601` |

JSON-RPC 알림에는 `id`, 그래서 서버는 결코 JSON-RPC 응답을 발송하지 않습니다. 승인된 HTTP 알림은 202을 빈 몸으로 반환합니다. 오류는 HTTP 상태를 변경할 수 있지만 알림에 대한 JSON-RPC 오류 몸체를 만들 수는 없습니다.

### 모래 상자는 경계가 아니라 신뢰 판결입니다

호스트는 iframe를 제어합니다. 앱은 호스트 쿠키, 로컬 스토리지 또는 페이지 DOM를 직접 읽을 수 없습니다. 모든 특권 작업은 다리를 건너야합니다.

이 기본값을 사용하세요:

- CSP 도메인 목록은 모두 빈 상태로 남겨두고 앱이 필요로 하는 원본만 추가하십시오. 사용 `connectDomains`, XHR, 그리고 WebSocket에 사용함`resourceDomains`스크립트, 스타일, 이미지 및 폰트
- 실용적인 경우 코드와 데이터를 묶어주세요.
- 카메라, 마이크, 또는 위치 허가를 요청하지 않는 한 눈에 보이는 기능이 필요하지 않습니다.
- `postMessage`정확한 동급 기원에 대한
- 도구 논쟁, 도구 결과, 자원 텍스트 및 브릿지 메시지는 신뢰할 수 없는 입력으로 취급하십시오.
- 호스트에서 사용자 동의를 유지합니다. iframe는 자체적인 결과적 행동을 승인할 수 없습니다.

고정된 것을 복사하지 마십시오`sandbox`모든 호스트에 튜토리얼에서 속성을 입력합니다. 호스트는 앱의 기원 모델과 자체 고립 디자인을 기반으로 깃발을 선택해야합니다.

허용된 영역은 여전히 발광 경로입니다.`connectDomains: ["https://api.example.com"]`앱 내부에서 실행되는 모든 스크립트가 허용된 데이터를 전송할 수 있다는 것을 의미합니다. 정확한 출처 일치는 목적지 혼란을 방지하지만, 이 부하가 적절할지 여부를 결정하지는 않습니다. 기본으로 연결 접속을 빈 상태로 유지하고, iframe에 지표를 배치하지 않도록 하고, 실행할 때 호스트를 통해 프록시 좁은 동작을 수행하고, 응답과 요청 크기를 제한하고, 각 출력 요청에 어떤 사용자 행동이 원인이 되었는지 감사하십시오. 치료`resourceDomains``connectDomains`; 글꼴이나 스크립트를 로드 할 권한은 임의의 데이터 업로드를 허용해서는 안 됩니다.

### 앱 브릿지는 자체적인 라이프 사이클을 가지고 있습니다.

앱 브릿지는 JSON-RPC 방언으로`postMessage`교환할 수 있습니다`ui/initialize`그리고`ui/*`알림 및 대리원본으로 보이는 방법`tools/call`- 그래

시야가 보내주죠`ui/initialize``appInfo`그리고`appCapabilities`객체. 호스트는 기능과 호스트 컨텍스트를 반환합니다. 그 응답이 끝나면만 뷰가 전송합니다`ui/notifications/initialized`호스트는 이 앱 알림을 기다려야 하며, 이 앱을 통해 메시지를 볼 수 있습니다.

이 로컬 핸드셰이프는 하나의 iframe와 하나의 호스트 프레임 사이의 다리를 만듭니다. MCP 프로토콜 버전을 협상하거나 서버 상태를 생성하거나 전송 세션을 만들지 않습니다. 정확한 사전을 참고하십시오.`notifications/initialized`앱은 삭제되었습니다.`ui/notifications/initialized`브릿지 도구 호출으로 생성되는 핵심 요청은 새로운 JSON-RPC 아이디와 전체 요청 메타데이터로 새로운 독립된 요청입니다.

### 호스트 컨텍스트, 액션 및 취소

호스트는 브리지 초기화 후 권한으로 남아 있습니다. 뷰는 호스트가 광고한 기능을 통해 도구 동작, 탐색, 클립보드 사용 또는 다른 특권 효과를 요청할 수 있습니다. 호스트는 입력된 요청, 현재 사용자, 목표 및 주장을 검증하고 승인 정책을 적용하고 이를 거부할 수 있습니다. 버튼 클릭과 유효한 브리지 메시지가 의도를 표현합니다. 어느 것도 권한을 부여하지 않습니다.

한 번 출력 입력보다는 주제를, 크기와 접근성을 호스트 컨텍스트의 변화로 취급하십시오.

- 호스트가 제공하는 색상 및 타이포그래피 토큰을 적용하고 테마 또는 콘트라스트 선호도가 변경되면 반응합니다.
- 뷰가 원하는 크기를 보고하도록 하지만 호스트가 캡을 하고 iframe 크기를 적용하도록 하여 콘텐츠가 레이아웃을 벗어나거나 속임수적인 오버레이를 만들 수 없습니다.
- 키보드 순서, 가시적인 중점, 접근 가능한 이름, 화면 리더 상태, 충분한 대조, 확대 및 iframe 내부의 운동 감소 행동을 보존합니다.
- 크기를 변경하고 재전환한 후 호스트 컨트롤과 View 컨트롤 사이의 집중 전송을 다시 테스트하십시오.

앱이 열려있는 동안 사용자가 계정을 변경하거나 정책 변경, 서버가 격리되거나 호스트가 동의를 제한하기 때문에 기능을 취소할 수 있습니다.`ui/initialize`. 취소 시, 대기중의 특권 호출을 거부하고, 정책에 더 이상 부합하지 않는 네트워크 활동을 중지하고, 민감한 렌더 상태를 클리어하고, UI 리소스가 더 이상 허용되지 않을 때 텍스트로 재부착하거나 다시 넘어갑니다.

### 재발은 계약의 일부입니다

앱에 대한 인식이 있는 서버는 여전히 UI 확장 프로그램을 광고하지 않는 호스트를 서비스할 수 있습니다.

-  없이 동일한 도구를 반환`_meta.ui``tools/list`- 그래
- 유용한 텍스트 결과를 저장합니다`tools/call`- 그래
- 거절`resources/read`실종 기능 오류가 있는 UI에 대해
- 도구가 완료되었는지 여부를 결정하는 데는 iframe가 존재한다고 결코 가정하지 마십시오.

```figure
t3-ui-sandbox
```

## 건설 해

`code/main.py`SDK 없이 작은 프로세스 프로토콜 모델을 구축합니다. 현재 요청 봉투와 스트리메이블 HTTP 라우팅 값을 검증하고, 앱을 통해 광고합니다.`server/discover`, 도구와 자원을 목록, 도구를 실행, 그리고 독립적인 HTML 자원을 제공합니다.

모델은 이미 분석된 몸체와 라우팅 헤더를 수신합니다. 그것은 완전한 HTTP 어댑터가 아니며 분석하지 않습니다.`Content-Type`또는`Accept`. 필요한 전체 스트리메이블 HTTP 어댑터에서 레슨 09을 사용하세요 `Content-Type: application/json`그리고`Accept`두 가지 모두 포함된 값`application/json`그리고`text/event-stream`- 그래

실행하세요:

```bash
cd phases/13-tools-and-protocols/14-mcp-apps
python3 code/main.py
python3 -m unittest discover code/tests -v
```

출력에서 네 가지를 확인하세요:

1. 모든 전화는 독립적입니다.
2. 모든 요청은`_meta`능력
3. `resources/list`어떤 리소스 읽기 전에 안정적인 디스크리퍼를 반환합니다.
4. 모든 결과가`resultType`그리고 서버 아이덴티티 메타데이터
5. 핵심 세션 식별자가 나타나지 않습니다.

## 사용 하 고

시작해`server/discover`확인해`io.modelcontextprotocol/ui`서버 확장 지도에 표시됩니다.`tools/list`두 번, 앱 기능과 동시에, 앱 기능 없이도, 첫 번째 응답은 리소스를 선언합니다. 두 번째는 텍스트만 사용할 수 있는 도구입니다.

읽으세요`ui://notes/timeline.html`HTML를 검색해 보세요`hostOrigin`그리고`event.origin`이 두 줄은 다리가 와일드카드 타겟을 사용하지 않는다는 최소한의 가시적인 증거입니다.

## 선박

이 수업은 니다`outputs/skill-mcp-apps-spec.md`프레임워크 코드를 작성하기 전에 앱 계약을 검토하는 데 사용하십시오. 작성자는 현재 핵심 봉투, 확장 협상, 후퇴, UI 리소스, 캐시 정책, CSP, 권한, 브리지 방법 및 동의 경계를 명시하도록 강요합니다.

## 운동

1. 클라이언트 기능을 빈 확장 지도로 변경합니다. 확인 `tools/list`도구를 유지하지만 UI의 결합을 제거합니다.
2. 보내`Mcp-Name: ui://notes/other.html`시간선을 읽는 몸으로 오류를 확인합니다`-32020`- 그래
3. 리소스를 로 변경`cacheScope: private`. 이를 정당화하는 사용자 특수한 조건을 설명합니다.
4. 스크립트를 로 옮기`https://static.example.com/app.js`그 기원을 추가합니다`resourceDomains`그리고 새로운 공급망 위험성을 설명합니다.
5.  추가`notes_open`도구와 로우팅 버튼을 클릭하여 호스트를 통해 이동합니다. 호스트에서 사용자 승인을 유지하십시오.

## 주요 용어

| Term | Meaning |
|------|---------|
| MCP Apps | Optional extension for interactive HTML rendered by an MCP host |
| `io.modelcontextprotocol/ui` | Extension identifier advertised by both peers |
| `ui://` | Resource scheme for an App's UI template |
| `text/html;profile=mcp-app` | MIME type for MCP App HTML |
| `server/discover` | Current RPC for protocol and capability discovery |
| `resources/list` | Mandatory resource listing method when the server advertises resources |
| `resultType` | Required discriminator for modern successful results |
| `ui/initialize` | First Apps bridge request, separate from removed core initialization |
| `ui/notifications/initialized` | Apps View readiness notification sent after the host responds |
| CSP | Browser policy that restricts scripts, styles, images, and network origins |
| Text fallback | Tool behavior retained for a host without Apps support |

## 더 많은 읽기

- [MCP 2026-07-28 base protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Apps overview](https://modelcontextprotocol.io/extensions/apps/overview)
- [MCP Apps build guide](https://modelcontextprotocol.io/extensions/apps/build)
- [Official extension support matrix](https://modelcontextprotocol.io/extensions/client-matrix)
