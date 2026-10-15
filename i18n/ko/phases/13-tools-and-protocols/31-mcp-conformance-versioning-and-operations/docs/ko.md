# MCP 컴퍼런스 엔지니어링: 버전, 증거 및 운영

> 서버는 하나의 SDK를 통해 작동하는 행복한 경로가 일치하지 않기 때문에 일치하지 않습니다. 일치는 와이어, 버전 경계에, 중개자, 그리고 롤백 중에 발생합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 17 (gateways), Phase 13 · 30 (registry admission)
**Time:** ~100 minutes

## 학습 목표

- 규범적인 MCP 규칙을 황금 및 음의 전자기본으로 변환합니다.
- 엄격하게 유지하세요`2026-07-28`제한된 유산의 낙후로부터 분리된 행동입니다.
- 부합성 알려지지 않은 필드를 무효 알려지지 않은 필드에서 구별합니다 `resultType`- 그래
- 원본 JSON-RPC 증거와 SDK 정상화된 시각을 비교하십시오.
- 진짜 프록시 경계를 통해 헤더와 몸의 무결성을 증명해
- 문 출력, 건강 및 복귀 증거가 편집된

## 문제

고객님이 전화하셨어요`tools/list`SDK를 통해 도구를 얻습니다. 통합 테스트를 통과합니다.

그 결과 중요한 질문들이 답되지 않습니다.

- 요청에 따라 최신 프로토콜 메타데이터가 포함되어 있었나요?
- 그랬어요`MCP-Protocol-Version``Mcp-Method`그리고`Mcp-Name`JSON-RPC 체계를 일치시키죠?
- 응답에는 유효한 내용이 포함되어 있습니까?`resultType`또는 SDK가 합성했나요?
- 고객이 미래 첨가장장을 보존할 수 있을까요?
- 현대인의 실수로 인해 우연히 손떨림이 일어나게 되는 걸까요?
- 프록시에서 원본 상태와 JSON-RPC 오류가 보존되었습니까?
- 알림 시리에라이저는 금지된 응답을 내놓았나요?
- 비밀이 보관되지 않고 왜 풀려나거나 되돌려놓았는지 증명할 수 있을까요?

컴포넌스는 관찰 가능한 비변수들의 집합입니다. 생산 트래픽이 발견하기 전에 그 비변수를 포착하는 배지를 구축하세요.

```figure
mcp-conformance-operations
```

## 버전 에라즈 로 시작 하십시오

MCP `2026-07-28`요청에 따라 자립된 메타데이터를 사용합니다. 현대적인 요청은`params._meta.io.modelcontextprotocol/protocolVersion`그리고`params._meta.io.modelcontextprotocol/clientCapabilities`. 정확한 이름 간격 키는 중요해요.`protocolVersion`또는`clientCapabilities`이 경우, HTTP 경계에서 거울로 된 라우팅 헤더가 존재할 때, 그 값은 JSON-RPC 몸과 일치해야 합니다. 현대적인 성공적인 결과는 `resultType`- 그래

                                            `2025-11-25`이전 초기화 시대를 사용하세요.`resultType`클라이언트가 그 이전 시대를 선택한 후에만 완성된 것으로 해석된다.

두 형태를 동시에 받아들이는 하나의 허용 인증자를 만들지 마십시오. 두 가지 가지를 사용하십시오:

| Branch | Entry evidence | Missing `resultType` | Initialization |
|---|---|---|---|
| Modern | Successful `server/discover` or recognized modern response | Invalid | Not the default path |
| Legacy | Configured allowlist plus a valid legacy `initialize` result after an inconclusive modern probe | Interpreted as complete | Required by that era |

이 분리은 잘못된 현대 동료가 더 약한 검증으로 보상되지 않도록합니다.

### 엄격한 모드

엄격한 모드는 현대적인 행동의 증명이 필요합니다.`server/discover`현대적인 지부를 증명합니다. 인식되는 현대적인 JSON-RPC 오류도 그것을 증명합니다. 요청을 수정하거나 중지하십시오. 서버가 돌아왔기 때문에 결코 다운그레이드하지 마십시오.`-32020``-32021`또는`-32022`- 그래

### 역전 모드

Fallback 모드는 한 개의 제한된 현대 탐사선을 수행합니다. 타임아웃, 빈 응답, 폐쇄 연결 또는 인식되지 않은 응답은 결정적이지 않습니다. 이 방법은 동료가 유래가 있음을 증명하지 않습니다. 호환성 위해 명시적으로 구성되거나 허용된 최종 포인트만이 제한된 유래 탐사를 받을 수 있으며 클라이언트는 해당 탐사선의 유래를 검증한 후에만 유래 지부를 선택합니다.`initialize`결과 및 협상 된 상속 수정

오류가 발생하면 Try legacy가 발생하지 않습니다.  인식된 현대 오류는 유용한 수정 정보를 포함합니다. 그 후에 다운그레이드하면 헤더 부합, 실종 기능 선언 또는 지원되지 않은 버전을 숨길 수 있습니다.

이 방법은 공격자, 파업 또는 필터링 프록시가 현대적인 응답을 떨어뜨리면서 다운레이드를 강요하는 것을 방지합니다. 엔드포인트 정책, 무결한 현대 관찰, 정확한 긍정적 인 유산 증거 및 선택된 시대를 함께 기록합니다.

각 기록 에 따라 선택 된 시대 를 기록 하십시오. 그 사실 이 없으면, 실종 된 필드는 한 시험 에 수용 할 수 있고 다른 시험 에 유효 하지 않을 수 있습니다.

## 번역본 을 작성

이 기록장치는 SDK 호출뿐만 아니라 경계를 넘어간 것을 기록합니다.

```json
{
  "name": "golden-modern-list",
  "era": "modern",
  "headers": {
    "MCP-Protocol-Version": "2026-07-28",
    "Mcp-Method": "tools/list"
  },
  "request": {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {
      "_meta": {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {}
      }
    }
  },
  "responseStatus": 200,
  "responseBody": {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "resultType": "complete",
      "tools": []
    }
  }
}
```

두 개의 장비를 보관하세요.

### 금색 표본

금색 표본은 받아들여진 행동을 증명합니다.

- 메타데이터와 헤더와 일치하는 현대 발견 또는 방법 요청
- 필요한 필드와 함께 완전한 결과
- `input_required`이 방법은 더 많은 입력을 요청할 수 있는 결과
- 확장 결과는 해당 기능이 광고된 후에야
- `resultType`, 하지만 선택된 유산을 시대에서만
- JSON-RPC 응답 없이 알림 처리

금색 표본은 정확하고 크지 않습니다. 변동적인 ID와 시간표는 결정적 또는 비교 전에 정상화하십시오.

### 음성 표본

부정적인 변수는 거부 행동을 증명합니다.

- 헤더와 몸의 부합성
- 요청에 따른 기능이 부족
- 지원되지 않은 일치된 프로토콜 버전
- 현대적인 것`resultType`
- 알려지지 않은 또는 광고되지 않은`resultType`
- 응답`jsonrpc` 이외`2.0`또는 값이나 JSON 타입에 차이가 있는 ID
- 두 가지 모두 포함된 응답`result`그리고`error`, 또는 둘 중 어느 것도
- 정수 없이 오류`code`그리고 줄`message`
- 잘못된 HTTP 상태에 매핑된 알려진 프로토콜 오류
- 통지 신청에 대한 응답
- 잘못된 JSON-RPC 봉투
- 프로토콜 오류의 프록시 붕괴

각 부정적 경우 거부 경계 및 안정적인 오류 코드를 확인합니다.  호출 실패 너무 약한. 프록시 생성된 500 및 원본 `-32020`두 가지 모두 실패로 보일 수 있지만, 다른 이야기도 모두 전달할 수 있습니다.

헤더 오작동 장치에는 해당 요청 ID와 오류 코드가 포함된 서버의 실제 HTTP 400 JSON-RPC 응답이 포함되어야 합니다 `-32020`. 로컬 검증자가 관찰할 때마다 자동으로 적용합니다`HeaderMismatch`; 응답 검증을 선택적 고정 플래그로 만들지 마십시오. HTTP 500과 함께 있는 경우, 로컬 거부 코드가 올바르게 작동해도 실패합니다. 자체 요청 검증기가 던졌을 때 멈추는 배너스는 서버의 와이어 행동을 테스트하지 않고 자체를 테스트합니다.

공식 MCP 컴포넌스 프로젝트는 외부 스위트 및 버전 참조로 유용합니다. 로컬 트랜스크립트를 또한 보관합니다. 그들은 일반 스위트가 알 수 없는 프록시, SDK, 인증, 확장 및 출시 경로를 캡처합니다.

## 헤더 값은 RPC 체제에 일치해야 합니다

현대 스트리메블 HTTP에서 중개인은 거울 헤더를 사용하여 정책을 라우팅하거나 시행할 수 있습니다. JSON-RPC 몸은 진실의 프로토콜 소스로 남아 있습니다. 부합은 한 값을 선택하는 지적이 아니라 완전성 실패입니다.

이 순서로 유효합니다:

1. JSON-RPC 봉투 및 메타데이터 유형을 분석하고 검증합니다.
2. 비교해 보세요`MCP-Protocol-Version``params._meta.io.modelcontextprotocol/protocolVersion`- 그래
3. 비교해 보세요`Mcp-Method``method`- 그래
4. 방법에는 라우팅 이름이 있는 경우 비교 `Mcp-Name`해당 체값을 가지고
5. 평등이 확립된 후, 일치된 버전과 기능 집합이 지원되는지 결정한다.

이 순서로 부합이 구별됩니다`-32020`지원되지 않은 버전에서`-32022`. 또한 출처가 다른 몸 이름을 실행하는 동안 헤더 이름을 승인하는 게이트웨이를 막습니다.

HTTP 필드 이름은 케이스에 민감하지 않지만, 그 값은 케이스에 민감하다. 검색 전에 헤더 이름을 정상화하고 충돌하는 복제물을 거부하십시오. 안전하지 않은, ASCII가 아닌 또는 선두 또는 추적하는 백색 공간에`Mcp-Name`, 정확한 암호를 해독`=?base64?{Base64EncodedValue}?=`UTF-8 센티널을 신체와 비교하기 전에. 불완전한 센티널, 무효 Base64, 무효 UTF-8 또는 무효 무효 값을 `-32020`. 원료 주변 백공간은 배가 동일한 문자를 포함해도 무효가 됩니다. 왜냐하면 그 값은 운송 전에 sentinel 코딩이 필요하기 때문입니다.

중개인은 요청이 MCP 서버에 도달하기 전에 잘못된 HTTP를 거부할 수 있으므로 실패는 JSON-RPC 없이 HTTP 오류가 될 수 있습니다. 거부가 중개자 또는 기원에 의해 왔는지 캡처하십시오. 원래 MCP 서버는 유효한 JSON-RPC 요청을 처리할 때 프로토콜 오류 계약을 사용해야합니다.

## 알려지지 않은 들 은 알려지지 않은 결과 이 아닙니다

앞으로의 호환성은 두 가지 다른 규칙을 요구합니다.

### 부수 알 수 없는 필드

결과물 및`_meta`지도는 필드를 얻을 수 있습니다. 검증자는 필드가 예약된 계약을 위반하지 않는 한, 그 역할에 따라 추가 필드를 보존하거나 무시해야 합니다. 샘플은 전체 원본 결과를 증거로 보관하고 받아들이는 것입니다.`futureHint`알려진 결과와 더불어

투명 프록시인 경우, 알려지지 않은 필드를 보존하는 것은 일반적으로 제거하는 것보다 더 안전합니다. 응용 프로그램 클라이언트인 경우, 이를 무시하는 것은 유효할 수 있습니다.

### 알 수 없는`resultType`

`resultType`이 연구결과들은`complete`또는`input_required`. 확장 프로그램은 기능이 광고된 경우에만 다른 값을 추가할 수 있습니다. 예를 들어 Tasks 확장 프로그램은 추가할 수 있습니다.`task`협상된 능력의 맥락에서

알려지지 않은 또는 광고되지 않은 차별주의자 는 안전 히 완전 한 것 으로 취급 될 수 없습니다. 고객은 그 의 생활 순환 을 알지 못합니다. 그것을 거부 하십시오.

따라서 동일한 원자 반응은 허용되지 않는 알려지지 않은 필드와 허용되지 않는 알려지지 않은 결과 유형을 포함할 수 있습니다. 두 경우 모두 테스트하십시오.

차별기는 단지 첫 번째 층입니다. 그 다음에는 방법 특유의 유용 한 부하를 검증합니다.`tools/list`결과는`tools`설명자가 고유한 비공개 이름, 유용한 설명 및 객체 뿌리를 가진 배열`inputSchema`가치.`task`그 결과 는 지원자 에만 유효 합니다 `tools/call`과제 능력과 요구`taskId`, 알려진 상태, 생성 및 업데이트 시간표, 그리고 `ttlMs`, 더하여 유효한 선택적 투표 간격.`completion/complete`그 결과로`completion`100개의 문자열 값이 아닌 객체, 선택적으로 부정적 인 정수`total`반환된 값보다 작지 않은 경우 선택적 볼리안 `hasMore`잘 글쓰는`resultType`잘못된 용량 화물을 만들 수 없습니다.

## 통지 변수가

JSON-RPC 알림에는 `id`수신기는 JSON-RPC의 성공 또는 오류 응답을 전송해서는 안 됩니다.

승인된 HTTP 알림 형태에 대해서는, 배너스는 HTTP를 기대합니다 `202`빈 몸으로`2026-07-28`스트리메이블 HTTP에 대한 핵심 클라이언트에서 서버에 대한 통지 정의를 하지 않습니다. 샘플은 한방향 시리얼라이저 비변수를 테스트하기 위해 이름 공간 코스 확장 통지만을 사용합니다. 새로운 핵심 방법으로 제시하지 마십시오.

리얼레이저를 테스트해봐, 리얼레이저만 테스트하지 마`None`중소 소프트웨어는 JSON 성공 객체로 포장합니다. 마지막 출력 바이트를 캡처합니다.

## SDK 차이점을 추가

SDK는 종종 문자 유물을 편리한 언어 유형으로 변환합니다. 이것은 유용하지만 정상화된 객체는 수신된 것을 증명할 수 없습니다.

위험성이 높은 모든 장치에 대해, 캡처:

1. SDK 디코딩 전에 원료 상태, 헤더 및 응답 체
2. SDK 정상화된 반환 값 또는 예외
3. 선택된 시대를 위한 예상되는 의미적 투명
4. SDK에 의해 들어올린, 합성, 벗겨진 또는 변경된 필드

샘플은 SDK에서만 알려진 현금 회계처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리처리`resultType``_meta``ttlMs`그리고`cacheScope`응용 프로그램 사용량 비교를 하는 동안`futureHint`왜냐하면 그 알려지지 않은 의미적 분야가 사라졌기 때문입니다.

모든 차이점은 SDK 버그라고 가정하지 마십시오. 중요한 것은 변환을 가시적으로 만드는 것입니다. 응용 프로그램 엔드포인트인지 결정하십시오. 이 부분은 추가 필드를 무시할 수 있습니다. 또는 투명한 중개인이 그것을 보존해야 합니다.

전송되는 모든 SDK 및 버전에 대한 차이는 실행하십시오. 두 SDK가 동일한 표본을 다르게 정상화하면, 출시 정책은 사실 이후 가장 편리한 출력을 선택하는 것보다 어떤 행동이 허용되는지 알려야합니다.

## 대리자 증거 를 잡

대부분의 생산 MCP 실패는 한 가지 이상의 프로세스에서 발생합니다. 세 가지 조사를 기록하십시오.

| View | Minimum evidence |
|---|---|
| Ingress | request headers, JSON-RPC body, content type, authenticated route, receive time |
| Origin | forwarded headers and body digest, origin status, response headers and body |
| Egress | client-visible status, headers, body, and send time |

샘플은 두 가지 일반적인 변형을 감지합니다.

- 출처 HTTP 400 또는 404 JSON-RPC 오류가 일반 프록시 500이 됩니다
- 출력 JSON-RPC 몸체는 원본 몸과 다르다

콘텐츠 유형에 대한 배포에 대한 특정 주장을 추가합니다.`Accept`TLS 종료 양쪽을 캡처합니다. 정책이 허용하는 경우 절대 인증서를 기록하지 마십시오.

## 증거가 기억 을 떠나기 전 에 다시 작성

리디케이션은 컴포넌스 작업의 일부이고 나중에 청소하는 작업이 아닙니다. 일련화, 해시, 로그, 테스트 유물 또는 실패 업로드 전에 적용하십시오.

샘플 케이스는 키 이름을 접어내고, 일치하기 전에 분리기를 제거하고, 다음으로 `Authorization``Cookie``Set-Cookie``X-Api-Key``accessToken``clientSecret``registrationAccessToken``token``password``secret`그리고`api_key`. 카논리화와 데닐리스트는 같은 형태를 사용해야 함을 따라서 camelCase, 하이프네이트, 하이라이트, 점포 된 변형은 서로의 정책을 우회할 수 없습니다. 생산 수집가 는 방법 특화된 논증 정책을 추가해야 합니다.`query`여전히 개인 또는 규제된 데이터를 포함할 수 있습니다.

편집된 증거 뭉치를 어 놓아 놓습니다. 특정 조사에 필요한 경우에 승인된 단기 체제에서만 원료 캡처를 보관합니다. 소화 된 뭉치가 결정을 주도한 것을 증명합니다. 제거 된 값을 밝히지 않습니다.

## 건강 과 반전 을 게이트 의 일부분 으로 만들

프로토콜 준수는 필요하지만 방출에 충분하지 않습니다. 준형 후보자는 여전히 시간 종료, 메모리 누출 또는 의존성을 과부하 할 수 있습니다.

발급 전에 건강 창을 정의하십시오:

- 최소 샘플 수
- 최대 오류율
- 최대 지연률
- 포화량 또는 자원 제한
- 관찰 기간
- 허용된 기준과 비교

또한 발사 전에 반발 증거를 정의하십시오.

- 정확한 이전 버전
- 입학 증거 소화
- SHA-256 유물 및 설명기 핀
- 현재 등록국 상태
- 현재 건강 결과
- 경로 복원 절차
- 신뢰받는 방출 제어자 신분으로부터 해당 정확한 필드에 대한 인증

지원자가 실패한 후에만 아니라 승진 전에 해당 롤백 목표가 검증되고 건강하게 요구됩니다. 사용 가능한 복구 경로가 없는 성공적인 출시는 생산 준비가 되지 않습니다.

만약 후보자가 실패하고, 그 증거가 없는 경우, 추측하는 대신 트래픽을 멈추게 하십시오.

비공개 버전과 같은 진실성 검사에 대한 준비도를 줄이지 마십시오. `healthy: "yes"`, 또는 임의의 증거 문자열. 샘플은 정확한 타입, 활성 상태, 세 개의 SHA-256 소화, 신뢰할 수 있는 서명자 및 전체 롤백 유용량에 대한 유효한 HMAC-SHA-256 인증서를 필요로 합니다. 결정적인 데모 키는 비비밀 장치입니다. 생산의 출시 경계에 보호 키, KMS 확인 결과 또는 공개 키 인증 검증기를 주입합니다.

또한, 공개 게이트는 빈 트랜스스크립트, SDK 디페리셔널 또는 프록시 증거도 거부합니다. 각 소스는 유효한 증거 소화물을 가져야합니다. 녹색 건강 창은 결코 관찰되지 않은 경계를 채울 수 없습니다.

## 건설 해

표준 도서관 띠를 실행:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
```

데모는 유효하고 잘못된 완성 결과를 포함한 정확히 15개의 금색 및 부정적인 기록을 실행하고, 원본 결과를 SDK 뷰와 비교하고, 출처 오류가 붕괴된 프록시를 검사하고, 건강 상태를 평가하고, 롤백 증거를 인증하고, 그 목표를 선택합니다.

예상형:

```json
{
  "transcriptsPassed": 15,
  "transcriptsTotal": 15,
  "sdkDroppedFields": ["futureHint"],
  "proxyIssues": [
    "proxy collapsed a protocol error into HTTP 500",
    "proxy changed the origin JSON-RPC body"
  ],
  "releaseAction": "rollback",
  "evidenceDigest": "..."
}
```

읽으세요`code/main.py`이 순서로:

1. `validate_request()`시대별 요구와 헤더 규칙을 집행합니다.
2. `validate_result()`사라진 유래 차별자, 유효한 현대 가치, 확장자, 그리고 알려지지 않은 가치들을 분리합니다.
3. `select_era()`엄격하고 제한된 반발 정책을 시행합니다.
4. `run_transcript()`금색과 음색의 고리를 평가합니다.
5. `compare_sdk_view()`정상화 차이점을 드러냅니다.
6. `inspect_proxy()`출입, 출입, 출입 증거들을 비교합니다.
7. `redact()`증거가 해시되기 전에 명백한 비밀을 제거합니다.
8. `rollback_evidence_ready()`정확한 핀 필드와 신뢰할 수 있는 석방 인증서를 검증합니다.
9. `ReleaseGate.evaluate()`비공허적 준용, SDK, 프록시, 건강 및 롤백 증거에 합류합니다.

## 사용 하 고

4개의 지점에서 띠를 실행하세요:

1. 임플로먼트 변경마다 프로세스 테스트 어댑터로
2. 실제 운송에 대한 구축된 클라이언트와 서버 바이너리에 대항합니다.
3. 배치된 프록시 또는 게이트웨이에서
4. 캐나다의 발사 중 생체 건강과 반발 증거

같은 안정적인 사례 이름을 여러 층으로 유지하십시오.`negative-header-body-mismatch`단위, 엔드-투-엔드, 프록시, 카나리 보고서의 동일한 변수라는 것을 의미해야 합니다. 증거 소화는 경계가 변경되었기 때문에 다를 것입니다. 요구 사항은 그렇지 않습니다.

버전 제어에서 고정된 스키마를 저장하고, 편집된 실행 증거를 출시 시스템에서 저장하고, 짧은 기간의 원료 캡처를 incidente 액세스 제어에서만 저장합니다.

## 인터랙티브 연구소

### 연구소 A: 시대적 경계를 증명

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/code
python3 -q
```

실행:

```python
from main import *
validate_result({"tools": []}, "legacy")
validate_result({"tools": []}, "modern")
```

기존의 전화는 끝납니다`complete`현대적인 목소리가 높아지고 있습니다`ProtocolViolation`이제 다시 한번 시험해보겠습니다.

```python
select_era({"kind": "timeout"}, "fallback")
select_era(
    {"kind": "timeout"},
    "fallback",
    legacy_allowed=True,
    legacy_evidence={"kind": "initialize_success", "protocolVersion": LEGACY_VERSION},
)
select_era({"kind": "jsonrpc_error", "code": -32021}, "fallback")
```

첫 번째 타임아웃은 침묵이 유래 증거가 아니기 때문에 닫히지 않습니다. 두 번째 호출은 구성이 허용하고 유효한 유래 초기화 결과가 관찰되었기 때문에 유래를 선택합니다. 인식 된 실종 능력 오류는 현대 분사를 증명합니다.

### 연구소 B: 첨가 필드 대 차별자

```python
validate_result({"resultType": "complete", "tools": [], "futureHint": True}, "modern")
validate_result({"resultType": "future_mode", "tools": []}, "modern")
```

첫 번째 결과는 보존합니다`futureHint`두 번째 것은 생명주기 차별자가 알려지지 않았기 때문에 거절당합니다.

### 연구소 C: SDK 변환을 검사

```python
compare_sdk_view(
    {"resultType": "complete", "tools": [], "futureHint": {"mode": "new"}},
    {"tools": []},
)
```

구성 요소가 무시할 수 있는지 여부를 결정하십시오.`futureHint`그 선택은 방출 정책에 적어 놓아주세요. 차묵히 이차수를 지우지 마세요.

### 연구소 D: 대리원 수리

데모 교환을 수정하여 출력으로 출력 상태와 몸체를 보존합니다. 실행 `python3 main.py`다시 한번. 프록시 문제들은 사라질 것 같지만 SDK 차이는 여전히 프로모션을 차단합니다.`futureHint`SDK 뷰에서 행동 변경을 관찰합니다`promote`모든 증거가 지나가면

## 연습 실험실

요청에 따라 스코프된 SSE 표본을 배너스에 추가하십시오.

요구 사항:

- 응답 상태, 콘텐츠 유형, 명령어 SSE 이벤트 및 스트림 종료를 캡처합니다.
- 각 JSON-RPC 이벤트에 유효한 시대별 결과 또는 오류가 있는 것을 증명한다.
- 전송하기 전에 전체 스트림을 버핑하는 프록시에 부정적인 경우를 추가합니다.
- 요청과 JSON-RPC ID가 다른 SSE 이벤트에 대해 부정적인 경우를 추가합니다.
- 증거 작성 전에 사건 데이터를 다시 작성하십시오.
- 스트림 기간, 첫 번째 이벤트 지연 및 이벤트 수를 건강 창에 포함하십시오.
- 방출 게이트가 스트림이 실패할 때 입증된 롤백 목표만을 선택하도록 한다.

성공이란 같은 사건이 직접적으로 그 대리인을 통해 실행된다는 것을 의미합니다. 그 보고서는 행동 변화를 일으킨 정확한 경계를 식별합니다.

## 배송된 유물

이 수업은 니다`outputs/skill-mcp-conformance-release-gate.md`. 서버, 클라이언트, 게이트웨이 또는 SDK 변경을 버전화된 컴포넌스 매트릭스 및 출시 결정으로 변환하는 데 사용하십시오. 이 유물은 원전 유선 증거, 부정적인 사례, 명시적인 시대 선택, SDK 차원, 프록시 증명, 편집, 건강 문턱 및 롤백 증거가 필요합니다.

## 확인 해 보

데모와 결정적 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

검증은 다음과 같은 사실을 증명해야 합니다.

- 포함된 모든 금색과 음의 기록은 예상된 결과를 얻습니다.
- 현대적인 요청은 정확한 이름 공간 메타데이터 키를 필요로 합니다
- HTTP 헤더 이름은 케이스에 민감하지 않고 코딩됩니다 `Mcp-Name`값은 정확히 해독됩니다
- 헤더와 몸의 부합이 현대 부합 코드를 반환
- 응답 버전, ID, 결과 또는 오류 전용성, 오류 형태 및 HTTP 지도가 검증됩니다.
- 방법별 도구 목록, 작업 및 완료용 부하 요구 사항이 시행됩니다.
- 모든 관찰`HeaderMismatch`실제 HTTP 400 JSON-RPC를 필요로 합니다 `-32020`반응
- 원료`Mcp-Name`백공간은 정밀 센티널 코딩된 백공간으로 돌아가는 동안 거부됩니다
- 실종된`resultType`선택된 유산을 받은 기간에만 유효하다
- 첨가 필드는 원료 검증을 살아남을 수 있지만, 알려지지 않은 결과 유형은 실패합니다.
- 확장 결과 유형은 광고된 기능을 요구합니다
- 현대 오류가 인정되는 것은 결코 유래의 역전환을 일으키지 않습니다.
- 알림은 JSON-RPC 응답을 생성하지 않습니다
- SDK 회계 제거와 의미적 필드 손실을 구분한다
- 프록시 오류 붕괴가 감지되고 인증서들은 camelCase 및 분리 변종에서 반복적으로 편집됩니다
- 홍보에 비공개 성과, SDK, 프록시 및 건전한 운영 증거가 필요합니다.
- 승진과 반귀는 모두 인증된, 고정된, 활성하고 건강한 반귀 목표가 필요합니다.

## 생산 실패 모드

| Failure | What the weak test reports | What the harness must prove |
|---|---|---|
| SDK synthesizes a missing discriminator | “tools/list passed” | Raw modern result lacked `resultType` and is invalid |
| Client downgrades after `-32021` | “legacy retry worked” | Recognized modern error forbids fallback |
| Unknown result type treated as complete | “response parsed” | Unadvertised lifecycle discriminator is rejected |
| Proxy authorizes one tool and origin executes another | “request reached server” | `Mcp-Name` equals the body routing name at every hop |
| Harness throws before reading the server response | “header mismatch test passed” | HTTP 400 and JSON-RPC `-32020` response are captured and validated |
| Proxy turns origin 400 into generic 500 | “upstream error” | Origin and egress statuses and JSON-RPC bodies are preserved |
| Notification middleware emits `{result: null}` | “handler returned none” | Final egress body is empty and no JSON-RPC response exists |
| SDK strips an additive field | “typed objects match” | Raw and normalized views show the exact dropped field |
| Failure artifact leaks a bearer token | “debug bundle uploaded” | Redaction occurred before hashing, logging, or upload |
| Credential key style bypasses redaction | “denylist contains api_key” | CamelCase and separator variants share one canonical denylist form |
| Canary has no samples but appears healthy | “zero errors” | Minimum sample count is enforced |
| Rollback selects an unknown build | “previous deployment restored” | Target version, admission digest, pins, status, and health are present |

## 운영 규칙

전송된 바이트, 모든 중개인 포워드 바이트, 각 SDK가 노출하는 의미론, 그리고 압력으로 사용되는 증거 작업들을 테스트하십시오. 호환성은 명시적인 분야입니다. 롤백은 증거에 근거한 발매 행동입니다. 둘 다 허용 분석기의 우연한 부작용이 될 수 없습니다.

## 더 많은 읽기

- [MCP 2026-07-28 base protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP version negotiation](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [Official MCP conformance project](https://github.com/modelcontextprotocol/conformance)
