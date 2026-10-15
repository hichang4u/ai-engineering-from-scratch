# 국적 없는 MCP 게이트웨이 및 등록서 입학

> 게이트웨이는 모든 노선을 명시적으로 설정해야 합니다. 2026-07-28 프로토콜은 전송 세션 없이 메소드, 이름, 버전, 기능, 아이덴티티, 캐시 및 추적 경계를 제공합니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 15 (security), Phase 13 · 16 (authorization)
**Time:** ~75 minutes

## 학습 목표

- 세션 친화 없이 여러 MCP 서버를 하나의 2026-07-28 최종점 뒤에 집합한다.
- 정책이나 전송 전에 요청에 따라 메타데이터와 라우팅 헤더를 검증합니다.
- 안정적인 이름 공간, 결정적 순서, 설명자 핀, RBAC 및 개인 캐시링을 가진 도구를 통합하십시오.
- 등록 기록은 아직 입학 정책이 필요한 발견 증거로 취급합니다.
- 경로 요청에 따라 확장된 SSE,`subscriptions/listen`MRTR 재시험, 그리고 작업 확장 호출이 맞습니다.
- 기존의 손잡이와 세션 지원이 현대적인 방식에서 분리됩니다.

## 문제

하나의 클라이언트를 하나의 서버에 직접 연결하는 것은 간단합니다. 더 큰 배포는 더 어려운 질문에 일관된 답을 필요로 합니다.

- 어떤 서버가 허용되나요?
- 어떤 교장이 각 도구를 보고 호출할 수 있을까요?
- 두 개의 백엔드가 같은 이름을 공개하면 어떻게 될까요?
- 설명자 변경 사항은 어떻게 검토됩니까?
- 금전적 제한과 감사 이벤트는 어디에 적용되는가?
- 어떤 사례가 다음 요청을 처리할 수 있을까요?

게이트웨이는 클라이언트와 백엔드 MCP 서버 사이에 위치하고 있으며, 하나의 MCP 엔드포인트를 제시하고, 횡단 정책을 적용하고, 승인된 요청을 전송합니다.

오래된 게이트웨이 디자인은 종종 한 클라이언트 세션을 여러 백엔드 세션으로 복제하고 다시 작성합니다 `Mcp-Session-Id`2026-07-28 코어에는 프로토콜 세션이 없습니다.

## 개념

### 현대적인 관문 경로는

각 요청에 대하여:

1. 운송 허가로부터 원인을 확인합니다.
2. 유효성`MCP-Protocol-Version``Mcp-Method``Mcp-Name`그리고`params._meta`- 그래
3. 원본, 자원, 방법, 도구 및 주장을 승인하십시오.
4. 설명서, 레지스트리, 요금 및 데이터 정책을 적용하십시오.
5. 선택된 백엔드에 대한 새로운 독립된 요청을 생성합니다.
6. 백엔드 결과를 확인하고 게이트웨이 결과를 반환합니다.
7. 비밀 기록 없이 감사 이벤트를 기록하세요.

단계에는 숨겨진 프로토콜 세션이 필요하지 않습니다. 응용 상태는 여전히 데이터베이스, 명시적 핸들, Tasks 또는 무결성 보호 MRTR 상태에서 존재할 수 있습니다.

### 실행시간 정책은 주요 게이트웨이 결정입니다

입구는 게이트웨이에 어떤 백엔드 버전이 들어갈 수 있는지 결정합니다. 실시간 통화에 권한을 부여하지 않습니다. 모든 요청에 대해 게이트웨이는 인증 된 원자, 발행자 및 자원, 임차자, 일치하는 방법 및 이름, 정상화 된 주장, 허용 된 설명 핀, 현재 백엔드 건강, 기능 교차, 데이터 분류, 요금 상태 및 모든 행동 관련 승인에서 정책을 다시 계산합니다.

이 순서가 중요합니다. 사용자 역할이 취소되는 동안 레지스트리 기록이 활성화 될 수 있습니다. 목적지 논증이 임차자 경계를 넘을 때 설명서가 고정되어있을 수 있습니다. 사건 정책이 격리되는 동안 백엔드는 승인 될 수 있습니다. 따라서 실행 시간 정책은 기본 허용 또는 거부 결정입니다. 레지스트리 및 설명서 증거가 입력으로 사용됩니다.

연결 또는 세션 식별자를 제거한 상태에서 허용 결정을 캐쉬하지 마십시오. 정책이 사용되지 않는 경우, 운영 클래스별로 선언된 실패 정책을 따르십시오. 안전 기본은 상태 변화 및 민감한 읽기 때문에 닫히지 않는 경우이며, 명시적으로 승인된 공개 읽기 경로는 단기간의 마지막 알려진 정책을 사용할 수 있습니다. 위험 모델이 허용하는 경우에만. 정책 버전과 실패 경로가 결정을 내린 것을 기록하고, 반환하기 전에 백엔드 결과를 검증하십시오.

### 1 POST 최종점

현대 스트리메이블 HTTP는 POST를 통해 각 JSON-RPC 메시지를 전송합니다.

```text
POST /mcp
Authorization: Bearer <gateway-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.search
Accept: application/json, text/event-stream
```

게이트웨이는 해당 POST에 JSON 또는 요청 스캔 된 SSE를 반환할 수 있습니다. GET 및 DELETE는 현대 요청에 405을 반환합니다. `Mcp-Session-Id`그리고`Last-Event-ID`권위, 친밀감, 또는 반복적인 행동을 만들지 마십시오.

헤더와 몸값은 일치해야 합니다.`-32020`이 방법은 로드 배틀러, 게이트웨이, 속도 제한 장치가 전체 체계를 분석하지 않고도, 엔드-투-엔드 무결성을 유지하도록 합니다.

정확한 순서로 확인: JSON-RPC 및 메타데이터 타입, 헤더 및 몸의 평등, 그리고 일치된 버전을 지원합니다. 일치하지 않은 HTTP 400을 `-32020`. 헤더와 인체가 지원되지 않는 버전을 동의하면 HTTP 400을 `-32022`그리고`data`정확히`{"supported":["2026-07-28"],"requested":"<actual>"}`. 알려지지 않은 방법은 HTTP 404을 반환합니다`-32601`- 그래

`ProtocolError`선택적으로 운반합니다`data`, 그리고 게이트웨이는 JSON-RPC 오류 객체에 그것을 연속화합니다.`id`, 그래서 JSON-RPC 성공 또는 오류를 결코 수신하지 않습니다. 받아들여진 HTTP 알림은 빈 몸으로 202을 반환합니다.

### 모든 계층에서 발견을 구현

게이트웨이 구현`server/discover`또한 각 백엔드를 발견하여 프로토콜 버전, 기능 및 확장 프로그램을 알고 있습니다.

예제 게이트웨이 결과:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": true}
  },
  "ttlMs": 30000,
  "cacheScope": "private",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "enterprise-gateway",
      "version": "2.0.0"
    }
  }
}
```

게이트웨이에서 끝에서 끝으로 존중할 수 있는 기능 교차점만을 광고하십시오. 백엔드 기능은 자동으로 노출될 수 없습니다. 백엔드 경로가 없는 게이트웨이 기능은 광고에 유용하지 않습니다.

`serverInfo`자기보고된 디스플레이 및 진단 데이터입니다. 등록 또는 출판사 증거로 사용하지 마십시오.

### 요청에 따라 클라이언트 기능

전송된 모든 요청은 현재에 필요한 것입니다`_meta`봉투:

```json
{
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {},
  "io.modelcontextprotocol/clientInfo": {
    "name": "enterprise-gateway",
    "version": "1.0.0"
  }
}
```

외부 클라이언트 기능을 백엔드에 맹목적으로 복사하지 마십시오. 게이트웨이는 백엔드의 클라이언트입니다. 광고는 게이트웨이가 올바르게 중재 할 수있는 기능만 있습니다.

### 결정적 이름 공간

안정적인 공공명으로 백엔드 도구를 통합:

```text
notes.search
notes.create
issues.list
issues.open
```

공개 이름에서 백엔드 및 오리지널 도구 이름까지 지도를 유지하십시오. 첫 번째 또는 마지막 충돌을 선택하지 마십시오. 공개 이름은 승인 및 감사 계약의 일부입니다. 따라서 변경은 마이그레이션입니다.

`tools/list`가시성이 원본에 따라 다르면, 반환`cacheScope: private`- 한계된`ttlMs`사용자 특화된 목록이 권한 컨텍스트에서 유출되는 것을 허용하지 않고 백엔드 발견 부하를 줄입니다.

노출된 모든 도구 설명서는 안정적인 이름, 설명 및 객체 뿌리를 포함합니다 `inputSchema`. 네임스페이스링은 필요한 디스크립터 필드를 제거할 수 없습니다. 전체 목록 결과에는 또한 포함됩니다 `resultType`, 서버 아이덴티티 메타데이터, 캐시 힌트

### 핀 승인된 설명기

입학 시, 전체 설명서를 카노닉화하고 자격 있는 공공명 아래 저장하고, 목록 및 전화 시간에 라이브 설명서를 승인된 설명서와 비교하십시오.

변경될 경우:

- 에서 제거`tools/list`- 그래
- 직접 전화를 거절하세요.
- 감사 이벤트를 진행하세요.
- PIN를 업데이트하기 전에 정책 또는 인적 재 승인이 필요합니다.

게이트웨이는 유용한 중앙 집행 포인트이지만, 처음 보이는 디스크립터를 안전한 것으로 만들지는 않습니다. 초기 검토는 여전히 필요합니다.

### 등록은 결정하는 것이 아니라 발견을 돕는 것입니다.

등록기`server.json`출판 메타데이터를 제공합니다. 패키지 지원된 기록은 다음과 같습니다.

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "com.example/notes",
  "description": "Example notes MCP server.",
  "version": "1.0.0",
  "packages": [
    {
      "registryType": "npm",
      "identifier": "@example/notes-mcp",
      "version": "1.0.0",
      "transport": {"type": "stdio"}
    }
  ]
}
```

출판 메타데이터는 게이트웨이의 보안 결정에 포함되지 않습니다. 검증된 출판사와 출처 증거를 별도의 입시 상태에서 보관하십시오:

```json
{
  "registryName": "com.example/notes",
  "registryVersion": "1.0.0",
  "publisher": {"namespace": "com.example", "status": "verified"},
  "provenance": {
    "source": "registry.modelcontextprotocol.io",
    "recordId": "com.example/notes@1.0.0"
  },
  "admission": {"status": "approved", "reviewedBy": "gateway-policy"}
}
```

문으로 확인합니다`server.json`이 문은 여전히 입학 정책이 필요합니다.

허용된 각 백엔드에 대해 기록:

- 정확한 레지스트리 및 레지스트리 식별자
- 확인된 출판사 이름 공간 또는 도메인 증거
- 운송 및 최종점 허용
- 판 버전 또는 승인된 업그레이드 정책
- 유물이나 설명기 소화
- 허가 발행자 및 자원
- 심사위원, 승인 기간, 만료

서버를 받아들이지 마십시오. 그 표시 이름이 익숙한 제품과 비슷하기 때문에. 레지스트리 존재는 운영 보안 검토로 간주하지 마십시오. 공개 레지스트리에서 결코 나타나지 않더라도 동일한 증거 스키마를 통해 개인 서버를 허용할 수 있습니다.

이 수업은 게이트웨이 매듭을 구현합니다. 배그엔드가 로터블되기 전에 출판 증거들을 지역 입시에 연결합니다. [Lesson 30: MCP Registry Supply Chain, Admission, Drift, and Rollback](../../30-mcp-registry-supply-chain-and-drift/docs/en.md)정확한 이름 공간 증명, 유물 출처, 변함없는 핀, 라이브 디스크립터 파동, 레지스트리 상태 조화, 조작 가능한 입시 리더 및 증거 뒷받침 된 롤백을 위한 완전한 제어 평면을 구축합니다.

### 자격증 중개

게이트웨이는 호출자를 인증하고 백그랜드에 개별적으로 인증합니다. 백그랜드 인증서는 클라이언트에 결코 전달되지 않습니다.

다음의 의무사항을 명시적으로 유지하세요:

```text
outer principal -> gateway role and policy
backend issuer + resource -> backend registration and token
```

외부 게이트웨이 토큰을 백엔드에 넘지 마십시오. 다른 발행자나 리소스에서 백엔드 토큰을 재사용하지 마십시오. 도구가 최종 사용자의 이름으로 행동하는 경우, 공유 서비스 인증서를 가진 사용자 인상을 대신하여 설계된 교환 또는 청구 모델로 그 위임을 보존하십시오.

### 세션 없이 수급 제한

인증된 원자, 발행자, 자원, 공공 도구, 비용 클래스 및 시간 창에 따라 주요 제한. 세션 아이디는 존재하지 않으며 존재하더라도 쉽게 회전 할 수 있습니다.

값 비싼 일 을 하기 전 에 값싼 검증을 적용 하십시오. 거절 된 전화 는 악용 제한, 사업 과제 또는 둘 다에 포함 되는지 결정 하십시오.

### 의사결정 체계를 감사

전화를 재구성할 만큼 기록:

- 요청 및 추적 식별자
- 인증된 주권자 및 발행자
- 공공 도구와 백엔드 경로
- 디스크리퍼 핀 버전
- 정책 결정과 이유
- 지연성 및 결과 클래스
- 해당 경우 MRTR 라운드 또는 작업 식별자

리디렉트 지표, 허가 코드, 리프레쉬 지표, 원료 비밀, 불필요한 민감한 주장

### 요청에 따라 적용된 SSE

일반적인 POST은 요청 중 하나의 요청 중에 작업 스트림이 있을 때 요청 스코프 된 SSE를 반환할 수 있습니다. 응답 스트림을 닫는 것은 비행 중 현대 HTTP 요청을 취소합니다.

별도의 GET 스트림을 만들지 말고 Last-Event-ID를 재생할 것을 약속하지 마십시오.

### 장기적인 변경 통지

목록 및 리소스 변경 알림에 대해, 현재 클라이언트가 전송합니다 `subscriptions/listen`POST을 통해 SSE 응답을 수신합니다.`toolsListChanged``promptsListChanged``resourcesListChanged`그리고`resourceSubscriptions`이 부분의 본문은

```json
{
  "jsonrpc": "2.0",
  "id": "listen-tools",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

첫 번째 이벤트는 지원된 하위 집합을 인정합니다. 그 구독 식별자는 스트림을 열었던 요청의 JSON-RPC ID입니다:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": "listen-tools"
    },
    "notifications": {
      "toolsListChanged": true
    }
  }
}
```

그 게이트웨이는 그 후에 인정된 변경 유형만을 전송합니다. 그 스트림의 모든 알림은 동일한 것을 가지고 있습니다.`io.modelcontextprotocol/subscriptionId``params._meta`자동 재생 또는 자동 재청음이 없습니다. 재결합을 하면 클라이언트는 구독을 다시 열고 의존하는 목록을 업데이트합니다. 서버가 시작한 우아한 클로지는 동일한 구독 아이디로 태그된 최종 완전한 결과를 반환합니다.

현대적인 경로는 대체합니다`resources/subscribe``resources/unsubscribe`, 그리고 요청하지 않은 독립적인 GET 스트리밍.

### MRTR가 게이트웨이

백엔드가 돌아왔을 때`resultType: input_required`, 게이트웨이는 외부 클라이언트가 필요한 입력 요청을 지원하는 경우에만 그 결과를 전송할 수 있습니다.`requestState`게이트웨이가 의도적으로 상호작용을 종료하고 재발급하지 않는 한 바이트에 바이트

클라이언트는 새로운 JSON-RPC ID와 함께 원래 공개 도구를 다시 시도합니다.`inputResponses`. 게이트웨이는 재허가를 하고, 같은 공중 경로를 확인하고, 새로운 백엔드 요청을 전송합니다.

### 확장 라우팅 작업

임무는 공식적인 확장 프로그램으로 `io.modelcontextprotocol/tasks`- 그들은 핵심 세션의 대상이 아닙니다.

클라이언트는 클라이언트 요청에 따라 확장 기능을 내재하고, 게이트웨이는 라이프 사이클을 끝까지 보존할 수 있을 때만 발견에 광고합니다. 지원되는 `tools/call`, 백엔드만 정해 주면`resultType: task`. 작업 결과에는`taskId``status`, 시간표,`ttlMs`, 그리고 선택적`pollIntervalMs`그 결과물을 보내기 전에 작업은 이미 오래 읽을 수 있어야 합니다.

게이트웨이는 비명성 작업 식별자의 인증된 원본 및 백엔드 경로를 기록합니다.`tasks/get``tasks/update`그리고`tasks/cancel`전화 사용 `params.taskId``Mcp-Name`, 즉 중개자에게 로우팅 키를 제공합니다.`tasks/get`수익금`resultType: complete`현재 작업 상태와 함께 최종 결과 또는 프로토콜 오류를 터미널 상태에서 내장합니다. `tasks/update`키를 보내`inputResponses`미치지 않은 작업 입력과 빈 완전한 확인을 반환합니다. `tasks/cancel`공허한 완전한 인정을 가진 협력적 의도가 아니라 작업이 중단되는 보증입니다.

새로운 것을 구현하지 마십시오`tasks/list`또는`tasks/result`이 작업은 입력이 필요한 작업으로 인해 전체 임베디드 요청이 `tasks/get`; 클라이언트는 이를 통해 답변합니다 `tasks/update`, 원래 도구 호출을 다시 시도하지 않습니다. 클라이언트는 여전히 제안된 간격에서 투표합니다. 작업 생성은 서버에 의해 계속됩니다.

지속 가능한 작업 경로 상태는 작업 핸들에서 키로 된 응용 데이터이며 프로토콜 세션이 아닙니다.

### 호환성 경계는

게이트웨이가 오래된 클라이언트나 백엔드를 서비스해야 하는 경우:

- 시대를 명확하게 감지합니다.
- 초기화, 전송 세션, GET 스트림, 리소스 구독 및 오래된 작업 어휘를 기존 어댑터 내에 보관하십시오.
- 기존 세션 아이디를 현대 로우팅이나 권한으로 유출하지 마세요.
- 제한된 탐지 탐지와 명시적인 역전 정책이 침묵으로 다운그레이드하는 것보다 더 좋습니다.

```figure
t3-gateway-funnel
```

## 건설 해

`code/main.py`프로세스 내 프로토콜 게이트웨이와 2 개의 백엔드 서버를 구현합니다. 각 백엔드는 새로운 현재 프로토콜 요청을 받는다. 게이트웨이는 발견, 사용자 필터링 결정적 기능을 제공합니다.`tools/list`, 이름 간선 로우팅, 레지스트리 `server.json`외부 입시 상태, 설명 스핀, RBAC, 원자 키 비율 제한, 감사 결정, 그리고 모델링 `subscriptions/listen`SSE 인정을 받았습니다.

모델은 파서된 요청체, 라우팅 헤더 및 인증된 통신자 아이덴티티를 수신합니다. 그것은 완전한 HTTP 어댑터가 아니며 파서하지 않습니다.`Content-Type`또는 전체`Accept`계약. 레슨 09의 스트리메이블 HTTP 어댑터에 연결하여,`Content-Type: application/json`그리고`Accept`두 가지 모두 포함된 값`application/json`그리고`text/event-stream`- 그래

실행하세요:

```bash
cd phases/13-tools-and-protocols/17-mcp-gateways-and-registries
python3 code/main.py
python3 -m unittest discover code/tests -v
```

데모는 외부 요청 ID와 신선한 백엔드 요청 ID를 인쇄하여 무국립 홉이 눈에 띄습니다.

## 사용 하 고

프로세스 내 백엔드 객체를 실제 현재 프로토콜 클라이언트로 교체합니다. 동일한 톱을 유지하십시오:

- 연결 전에 입학 기록
- 역전 탐지 능력 노출 전에
- 허가 전에 정해진 공용 이름
- 리스트나 전화 전에 설명자 핀
- 전송하기 전에 요청에 따라 신선한 메타데이터
- 반환 전에 결과 검증

## 선박

이 수업은 니다`outputs/skill-gateway-bootstrap.md`. 입력, 발견, 입수, 이름 공간, 권한, 캐시, 스트리밍, 구독, MRTR, 작업, 관찰 가능 및 유래 고립을 포함하는 현대적인 게이트웨이 디자인을 생산합니다.

## 운동

1. 외부 및 전송된 요청 메타 데이터에 추적 컨텍스트를 추가하고 감사 사건에서 상관관계를 기록합니다.
2. 작업 기능이 가능한 백엔드와 라우트를 추가합니다 `tasks/get``Mcp-Name`- 그래
3. 백엔드 디스크리퍼 하나를 변경하고 발견과 직접 호출이 차단된 것을 증명하십시오.
4. 원본에 대한 서버 기능을 추가하고 발견이 사적으로 캐시되어 있어야 하는 이유를 설명합니다.
5. 기존의 어댑터 인터페이스를 작성하여 최신 버전에 기존 상태를 추가하지 않습니다.`Gateway`수업이

## 주요 용어

| Term | Meaning |
|------|---------|
| MCP gateway | Policy and routing server between clients and backend MCP servers |
| Admission record | Evidence and policy decision allowing one backend into the gateway |
| Qualified tool name | Stable public route such as `notes.search` |
| Descriptor pin | Approved digest checked during discovery and dispatch |
| Private cache scope | Cached result restricted to one authorization context |
| Request-scoped SSE | Streaming response attached to one POST request |
| `subscriptions/listen` | Client-opened SSE stream for selected long-lived change notifications |
| Task route | Application mapping from an opaque task id to its backend |
| Legacy adapter | Explicit version-gated boundary for old handshake and session behavior |

## 더 많은 읽기

- [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [Server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [Official Registry server.json requirements](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [MCP Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
