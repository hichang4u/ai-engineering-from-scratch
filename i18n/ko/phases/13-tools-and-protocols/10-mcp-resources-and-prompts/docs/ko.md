# MCP 리소스와 명령어: 국적 없는 서버에 대한 주소 가능한 컨텍스트

> 도구는 작업을 수행합니다. 리소스는 주소 가능한 콘텐츠를 노출합니다. 사용자가 선택한 메시지 템플릿을 패키지하도록 요청합니다. 좋은 MCP 서버는 해당 계약들을 분리하고 예측할 수 있습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lesson 07 (Building an MCP Server), Phase 13, Lesson 09 (MCP Transports)
**Time:** ~60 minutes

## 학습 목표

- 소비자의 의도에 따라 도구, 자원, 그리고 요청 중에서 선택하십시오.
- 필수적인 자료를 통해 자원을 광고하고 즉시 표면을 `server/discover`- 그래
- 결정론을 구축하라`resources/list`그리고`prompts/list`결과
- 적용`ttlMs`그리고`cacheScope`사용자 특수한 데이터를 누출하지 않고
- JSON-RPC 오류를 반환합니다`-32602`유효하지 않은 또는 알려지지 않은 리소스 URI에 대해
-    열어`subscriptions/listen`POST 응답 스트림 및 가입 ID를 통해 모든 이벤트를 상관관계.
- 리소스 콘텐츠와 프롬프트 템플릿을 신뢰할 수 없는 서버 출력으로 취급합니다.

## 소비자 를 시작 하십시오

MCP를 악용하는 가장 쉬운 방법은 구현 코드에서 시작하는 것입니다. 데이터베이스 쿼리는 기능이 익숙하기 때문에 도구가 됩니다. 재사용 가능한 워크플로우는 파일에 저장되기 때문에 자원으로됩니다. 프롬프트는 호스트가 주입할 수 있기 때문에 숨겨진 정책이됩니다.

누가 선택하고 무엇을 기대하는지부터 시작하세요.

| Primitive | Primary intent | Selection owner | Typical result |
|---|---|---|---|
| Tool | Perform an operation | Model or application | Structured action result |
| Resource | Read content at a URI | Host, application, or user | Text or binary content |
| Prompt | Start a reusable message workflow | User through host UI | One or more prompt messages |

이 글에`notes://note-1`그것은 주소 가능한 내용이기 때문에 자원입니다. `delete_note`그것은 상태를 변화시키기 때문에 도구입니다.`review_note`사용자가 준비된 검토 작업 흐름을 선택하기 때문에

이 세 가지 작업 을 모두 완성 된 것 처럼 보이기 위해 한 가지 작업 을 노출 하지 마십시오. 추가적인 표면 이 하나하나 는 발견, 승인, 캐시, 오류 처리, 테스트 및 문서화 를 필요로 합니다.

## 2026-07-28 국적 없는 봉투

이 수업은 MCP 프로토콜 개정`2026-07-28`이 프로파일에는 초기화 손잡이나 프로토콜 세션이 없습니다. 모든 요청은 프로토콜 버전과 클라이언트 기능을 예약되어 있습니다.`_meta`열쇠

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

서버가 구현해야 합니다`server/discover`. 그 결과 광고를 지원
버전, 리소스 및 프롬프트 기능, 구현 아이덴티티, 그리고
클라이언트는 다른 메소드를 직접 호출할 수 있지만, 발견은
UI를 만들기 전에 안정적인 스냅샷을 하나 찍어보세요.

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "resources": {"listChanged": true, "subscribe": true},
    "prompts": {"listChanged": true}
  },
  "ttlMs": 3600000,
  "cacheScope": "public"
}
```

정상적인 결과가 나타납니다`"resultType": "complete"`- 그 반응`_meta`서비스 수행을 확인합니다`io.modelcontextprotocol/serverInfo`.이 정보는 진단에 유용합니다. 그것은 인증 아이덴티티가 아닙니다. 지원되지 않은 수정 내용을 담은 요청은 반환됩니다.`-32022`요청된 수정과 서버의 지원된 수정 모두

무국립 계약은 디자인 본능을 변경합니다. 목록은 한 연결에 대한 이전 호출에 의존할 수 없습니다. 권한은 표시되는 세트를 변경할 수 있습니다. 자격증은 입력 요청이므로, 연결 역사가 아닙니다.

## 자원들은 안정적인 URI 계약

리소스는 URI에 의해 식별된 내용입니다. URI를 핸들러보다 먼저 설계하십시오.

좋은 URI 성질:

- 북마크 또는 요청 사이에 전달할 수 있을 만큼 안정적입니다.
- 서버의 도메인에 이름을 간장합니다.
- 프로세스 ID 또는 연결으로부터 독립합니다.
- 저장소 접근 전에 검증
- 모든 읽기에 허가된

`notes://note-1`더 좋은 것 같아요`note-1`파일 서버가 사용할 수 있습니다`file://`URI, 하지만 여전히 구성된 디렉토리 경계를 확인해야 합니다.

`resources/list`현재 호출자에게 가시적인 리소스를 반환합니다. URI와 같은 안정적인 키에 의해 분류합니다. 결정적 순서는 잡음적인 캐시 미스, 스냅샷 변경 및 리프레쉬 사이에 뛰어드는 호스트 UI를 방지합니다.

```json
{
  "resultType": "complete",
  "resources": [
    {
      "uri": "notes://note-1",
      "name": "Architecture decision",
      "description": "Why the service uses a stateless boundary",
      "mimeType": "text/markdown"
    }
  ],
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

`resources/read`한 가지 또는 여러 가지 콘텐츠 항목을 반환합니다. 알려지지 않은 URI는 성공적인 빈 읽기 아닙니다. 현재 리소스 스펙은 JSON-RPC 무효 매개 변수, 코드 `-32602`- 그래

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32602,
    "message": "Unknown or invalid resource URI",
    "data": {
      "uri": "notes://missing"
    }
  }
}
```

이 구별은 클라이언트가 유효한 빈 문서에서 없는 것을 분리할 수 있게 해줍니다. 또한 더 넓은 검색으로 우연히 넘어지는 것을 방지합니다.

### 리소스 템플릿

리소스 템플릿은 매개 변수 URI의 가족을 설명합니다. 모든 구체적인 항목을 나열할 때 하나를 사용하십시오. 예를 들어, `notes://projects/{project}/decisions/{decision}`모든 결정을 반환하지 않고 유효한 주소를 작성하는 방법을 고객에게 알려줍니다.

템플릿은 검증을 약화시키지 않습니다. 변수를 분석하고 권한을 적용하고 길과 문자 제한을 적용하고 입력된 매개 변수를 사용하여 저장 질서를 구성하십시오. 임의 URI 꼬리를 파일 시스템 경로 또는 데이터베이스 문장에 결코 연결하지 마십시오.

### 내용은 신뢰할 수 있는 지침이 아닙니다

리소스 텍스트는 신속한 주입, 비밀, 오해의 소지가 있거나 잘못된 마크업이 포함될 수 있습니다. 호스트는 출처를 보존하고 리소스 콘텐츠를 데이터로 취급해야 합니다. 서버는 콘텐츠 크기를 제한하고 정확한 MIME 유형을 반환해야 하며, 호출자가 액세스할 수 없는 필드를 편집하고, 관련 없는 기록을 반환하는 것을 피해야 합니다.

## 명령어는 사용자 제어 템플릿입니다

MCP 명령어는 명시적인 사용자 선택을 위해 설계되었습니다. 호스트는 슬래시 명령어, 메뉴 항목 또는 작업 흐름 버튼으로 표시 할 수 있습니다. 프로토콜은 하나의 UI가 필요하지 않습니다.

`prompts/list`각 프롬프트는 안정적인 이름, 유용한 설명 및 호스트가 입력 정보를 수집할 수 있도록 하는 аргумент 선언이 필요합니다.`prompts/get`- 그래

```json
{
  "resultType": "complete",
  "prompts": [
    {
      "name": "review_note",
      "title": "Review a note",
      "description": "Review one note for a named concern",
      "arguments": [
        {
          "name": "uri",
          "description": "The note resource URI",
          "required": true
        }
      ]
    }
  ],
  "ttlMs": 600000,
  "cacheScope": "public"
}
```

`prompts/get`메시지로 논쟁을 해결합니다. 호스트의 시스템 지침을 대체하지 않습니다. 호스트는 반환된 메시지가 모델 맥락에 어떻게 들어간지 결정하고 자신만의 신뢰할 수있는 정책을 더 높은 우선 순위에 유지합니다.

서버 경계에서 프롬프트 аргумент을 검증하십시오. 프롬프트 URI는 직접 리소스 읽기와 동일한 권한 검사를 통과해야합니다. 리소스 액세스 주변에서 프롬프트를 부방 채널으로 만들지 마십시오.

## 캐시 힌트 는 정확 함 의 일부분 이다

`ttlMs`클라이언트에 결과물을 재사용할 수 있는 기간을 알려줍니다. `cacheScope`저장된 값을 공유할 수 있는 사람을 설명합니다.

| Scope | Meaning | Typical use |
|---|---|---|
| `public` | May be reused across users when authorization permits | Public prompt catalog |
| `private` | Bound to the requesting user or credential context | User-owned note content |

데이터의 변화 속도와 지연의 손해에서 TTL를 선택하십시오. 5 분 은 공개적 인 간첩 카탈로그에 적합 할 수 있습니다. 개인 메모 읽은 것은 1 분을 사용할 수 있습니다.

MCP는 오직 `public`그리고`private``cacheScope`비밀 또는 빠르게 변화하는 결과를 위해, 반환 `cacheScope: "private"``ttlMs: 0`, 그리고 호스트 캐시 정책에 더 엄격한 저장소 금지 규칙을 적용합니다.`no-store`그 자체는 MCP가 아닙니다`cacheScope`가치

캐시 힌트는 권한을 대체하지 않습니다. 캐시 키는 임차자, 사용자, 범위, 로컬 및 페이지화 커서 등 가시성을 변경하는 모든 요청 차원을 포함해야합니다. 공유 캐시에서 이러한 차원을 안전하게 표현할 수 없다면, 사용 `private`0 TTL와 호스트 레벨의 스토어 금지 정책이 있습니다.

## 구독자: 클라이언트 오픈 응답 스트림을 사용

현대 구독 패턴은 이전 방식을 대체합니다 `resources/subscribe`RPC와 오래된 HTTP GET 이벤트 엔드포인트

고객님께`subscriptions/listen`스트리메이블 HTTP에서 이것은 POST입니다. 그 응답은 SSE 스트림으로 열려 있습니다.`notifications`객체는 허용 목록입니다. 서버는 요청되지 않은 알림 유형을 제공해서는 안 됩니다.

```json
{
  "jsonrpc": "2.0",
  "id": 17,
  "method": "subscriptions/listen",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    },
    "notifications": {
      "resourcesListChanged": true,
      "promptsListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

요청 ID는 가입 ID입니다. 요청된 이벤트 전에 서버가 전송합니다 `notifications/subscriptions/acknowledged`. 그 필터는 서버가 받아들인 하위 집합만을 포함합니다.

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "notifications": {
      "resourcesListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

그 스트림의 모든 후속 사건들은 동일한 메타데이터를 가지고 있습니다.

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "uri": "notes://note-1"
  }
}
```

알림은 리소스가 변경된다고 합니다. 클라이언트는 다시 읽습니다.`resources/read`현재 허가된 경우, 이벤트에 새로운 문서가 포함되어 있다고 가정하지 않습니다.

여러 구독은 하나의 스튜디오 채널을 공유할 수 있습니다. 구독 ID는 클라이언트가 그들을 델플렉스 할 수 있습니다. HTTP를 통해 응답 스트림을 닫는 것은 구독을 취소합니다. 스트림을 끝내는 서버는 우아하게 최종을 반환합니다.`resultType: "complete"`본 요청에 대한 응답과 상관관계가 있습니다.

프로토콜 세션으로 구독 스트림을 사용하지 마십시오. 나중에 읽은 것은 여전히 건강한 서버 인스턴스에 도달 할 수있는 완전한 요청입니다.

```figure
t3-primitive-sort
```

## 인터랙티브 연구소

이 그림을 사용하여 프로젝트 추적기에서 다섯 가지 기능을 분류하십시오. 문제 세부 사항, 문제 생성, 스프린트 검토 템플릿, 프로젝트 정책 및 종료 문제. 다음, 공개적으로 캐시 할 수있는 목록, 어떤 목록이 개인적으로 유지되어야 하며, 어떤 리소스가 업데이트 알림을 받아야하는지 결정하십시오.

각 분류에 대해 선택자를 지정하십시오. 모델이 동작을 수행하면 도구를 사용하십시오. 호스트가 URI에 의해 주소된 콘텐츠를 읽으면 리소스를 사용하십시오. 사용자가 준비된 메시지 작업 흐름을 시작하면 프롬프트를 사용하십시오.

## 연습 실험실

저장소 루트에서 시뮬레이터를 실행:

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

이 순서로 이번 표본을 확인해 보세요.

1. 확인`server/discover`현재 개정과 두 가지 기능에 대한 광고를 제공합니다.
2. 목록 결과 모두 분류되고 사용된다고 확인합니다 `resultType: "complete"`- 그래
3. 목록 확인 및 읽기 결과는 의도적인 캐시 팁을 가지고 있습니다.
4. 읽기 URI를 로 변경`notes://missing`그리고 관찰합니다`-32602`- 그래
5. 리소스 이벤트 이전에 가입 확인을 확인합니다.
6. 이벤트 확인 및 우아한 종료 양쪽은 가입 ID를 가져 `5`- 그래

파이썬 모델은 실제 HTTP 연결을 열지 않습니다. SDK가 요청-스케이프 응답 스트림에 배치해야 하는 메시지를 나타냅니다. 제작에 프레임 및 운송을 위해 공식 SDK를 사용합니다.

## 배송된 유물

`outputs/skill-primitive-splitter.md`MCP 원시 선택에 대한 재사용 가능한 디자인 검토입니다. 현재 결정적 발견, 캐시 범위, 무효 URI 행동 및 현대 구독 필터를 확인합니다.

교훈은 배도 `assets/primitive-split.svg`, 오프라인 연구의 원시 및 가입 경계를 정적 버전.

## 확인 해 보

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

예상된 결과: 주요 프로그램은 JSON 표본을 인쇄하고 테스트 명령어는 적어도 12개의 합격 테스트를 보고합니다.

## 캡스톤 연결

이 계약은 캡스톤 서버가 행동 이외에 주소지 정보를 노출할 때 사용한다. 한 결정적인 카탈로그 스냅샷, 한 승인된 리소스 읽기, 한 간격 해상, 한 무효 URI 케이스, 한 구독 표본을 포함합니다.

귀하의 증거는 연결 역사에 따라 어떤 목록도 의존하지 않으며 가입 이벤트가 기본 리소스에 액세스 할 수 없다는 것을 보여주어야 합니다.

## 운동

1. `notes://projects/{project}/notes/{id}`리소스 템플릿과 양 변수를 검증합니다.
2. 페이지 표시를 추가`resources/list`결정적인 질서를 유지하면서
3. 한 리소스를 로 변경`cacheScope: "private"``ttlMs: 0`, 호스트 레벨의 스토어 금지 정책을 추가하고, 두 통제를 정당화하는 위협을 설명합니다.
4. 프롬프트 리스트 변경 가입을 추가하고 필터가 삭제되면 이벤트가 전송되지 않는 것을 증명합니다 `promptsListChanged`- 그래
5. 동시에 두 개의 구독을 생성하고 각각의 이벤트가 올바른 요청 ID를 가지고 있음을 증명합니다.
6. 읽기 핸들러에 소재 권한을 추가하고 캐시 항목이 소재들을 넘지 못할 것을 증명합니다.

## 주요 용어

- **Resource:**MCP 서버에 의해 노출된 URI에 대한 내용
- **Prompt:**사용자 제어 메시지의 템플릿은 MCP 서버에 의해 노출됩니다.
- **Deterministic list:**안정적인 회원가입과 동일한 요청 입력에 대한 주문을 가진 발견 결과.
- **`ttlMs`:**밀리초에 신선함 기간을 캐시로 저장합니다.
- **`cacheScope`:**캐시 결과의 공유 경계가
- **`subscriptions/listen`:**오랜 기간 동안 지속된 요청으로 응답 스트림은 명시적으로 필터링된 통지들을 제공합니다.
- **Subscription ID:**본래의 청취 요청 ID, 통지 메타데이터에서 반복됩니다.
- **Invalid parameters:**JSON-RPC 오류`-32602`, 무효 또는 알려지지 않은 리소스 URI에 사용된다.
- **Unsupported protocol version:**JSON-RPC 오류`-32022`,`supported`그리고`requested`개정
- **`server/discover`:**지원된 수정, 기능, 정체성 및 선택적 캐시 지시를 반환하는 의무 서버 방법.

## 더 많은 읽기

- [MCP 2026-07-28 Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP 2026-07-28 Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP 2026-07-28 Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)
