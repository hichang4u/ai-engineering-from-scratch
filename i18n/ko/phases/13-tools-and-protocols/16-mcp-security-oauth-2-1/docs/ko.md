# MCP 허가: CIMD, 발행자 구속, PKCE, Step-Up

> 원격 MCP 요청은 무국가이지만, 그 권한은 익명적이지 않습니다. 모든 인증서를 생성한 발행자에게, 모든 토큰을 수신하는 자원과 연결합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 15 (security)
**Time:** ~90 minutes

## 학습 목표

- 보호된 리소스 메타데이터를 통해 권한 서버를 발견하십시오.
- 기존의 동적 클라이언트 등록에 비해 클라이언트 ID 메타데이터 문서를 선호합니다.
- 올바른 것을 선언하라`application_type`DCR 호환성 경로가 불가피할 경우
- 승인 응답을 확인합니다 `iss`그리고 발행자별로 인증서들을 분리합니다.
- PKCE, 자원 지표, 시청자 검증 및 증가 범위를 사용하십시오.
- 프로토콜 세션 없이 승인된 MCP 2026-07-28 요청을 보내십시오.

## 문제

원격 MCP 서버는 개인 기록을 읽을 수 있고 외부 시스템을 작성하거나 비용이 많이 드는 작업을 유발할 수 있습니다. 인증은 신분증을 제시한 사람을 알려줍니다. 권한은 또한 답변해야합니다.

- 어떤 권한 서버가 자격증을 발급했나요?
- 어떤 MCP 리소스가 토큰이니까?
- 어떤 클라이언트와 리디렉션 URI가 흐름을 완료했습니까?
- 사용자가 승인한 작업은 무엇입니까?
- 이 요청은 여전히 그 승인에 적합합니까?

2026-07-28 승인 프로파일은 클라이언트 등록과 발행자의 처리 방식을 강화합니다.`application_type`DCR에 대한 RFC 9207 발행자의 응답을 검증하고, 발행자 간 인증서 재사용을 금지합니다.

이 규칙들은 국가 없는 핵을 보충하고`Mcp-Session-Id`- 그래

## 개념

### 세 가지 역할을 알아

- **MCP client:**자원 소유자의 이름으로 요청을 보내게 됩니다.
- **MCP resource server:**액세스 토큰을 받아서 MCP 최종 지점을 서비스합니다.
- **Authorization server:**자원을 소유한 자원을 인증하고 동의를 수집하고 토큰을 발행합니다.

리소스 서버와 권한 서버는 함께 작동할 수 있지만 식별자와 검증 책임은 분리되어 있습니다.

### HTTP에 권한이 적용됩니다

MCP 권한 사양은 HTTP 기반 전송에 적용됩니다. 로컬 스튜디오 서버는 프로세스 및 운영 체제 신뢰 경계 아래 실행됩니다. 단순히 대칭을 위해 스튜디오에 가짜 브라우저 OAuth 흐름을 추가하지 마십시오.

원격 스트리메이블 HTTP에 대해, 에 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터 로 벡터`Authorization`모든 요청에 헤더를 넣지 마세요.

### 보호된 자원 메타데이터로 시작하세요

리소스 서버는 RFC 9728 메타데이터를 공개합니다.

```json
{
  "resource": "https://notes.example.com/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["notes:delete", "notes:read", "notes:write"]
}
```

클라이언트는 MCP 리소스 URL에서 시작하여 이 문서를 가져오며 광고 된 권한 서버를 선택하고 그 서버의 OAuth 또는 OpenID Connect 메타데이터를 가져옵니다.

RFC 9728의 잘 알려진 URL를 구축할 때 리소스 경로를 보존합니다. 리소스를 위해 `https://notes.example.com/mcp`이 강의에서`https://notes.example.com/.well-known/oauth-protected-resource/mcp`- 을 떨어뜨리는 것`/mcp`후자는 동일한 기원에 있는 다른 보호 리소스에 대한 메타데이터를 선택할 수 있습니다.

호스트 이름에서 권한 서버를 추측하지 마십시오. 검증되지 않은 오류 몸에서 발견 된 발행자를 따르지 마십시오. 고객이 신뢰할 수있는 발행자를위한 정책을 유지하십시오.

### 권한 서버 메타 데이터를 확인

메타데이터는 엔드포인트 및 지원된 제어 기능을 노출해야 합니다.

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "code_challenge_methods_supported": ["S256"],
  "authorization_response_iss_parameter_supported": true,
  "client_id_metadata_document_supported": true
}
```

PKCE에 S256를 요구합니다. 정확한 발행자 문자열을 기록합니다. 그 정확한 값은 등록 및 토큰 저장의 열쇠가됩니다.

### 등록 우선 순위를 따르십시오

사전 등록된 클라이언트 정보를 사용하려면 클라이언트가 이미 선택한 발행자와 명시적인 관계를 가지고 있을 때 사용한다. 그렇지 않으면 권한 서버가 지원을 광고할 때 클라이언트 ID 메타데이터 문서를 선호한다. DCR를 만 구약된 호환성 백업으로 사용하다. 다음이 메커니즘 중 어느 것도 사용할 수 없다면 클라이언트 정보를 요청한다.

### 클라이언트 ID 메타데이터 문서를 선호

클라이언트 ID 메타데이터 문서는 권한 서버에 HTTPS URL를 제공합니다. 이는 클라이언트 식별자와 메타데이터의 위치 모두입니다.

```json
{
  "client_id": "https://client.example.com/oauth/metadata.json",
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

권한 서버는 문서를 가져와 검증합니다.`client_id`도로를 가진 HTTPS URL가어야 하며 문서 내부의 값은 URL에 정확히 해당해야 합니다. 필요한 문서 필드는`client_id``client_name`그리고`redirect_uris`-`application_type`이 예제에서 나타난 것은 CIMD 요구 사항이 아닙니다. 새로운 의무적인 사용은 구체적으로 DCR 경로입니다.

문서의 검색을 SSRF 민감한 작업으로 처리하십시오. 목적지를 해결하고 검증하고, 루프백, 개인, 링크 로컬 및 다른 방법으로 허용되지 않은 주소를 거부하고, 리더렉트 및 DNS 변경 후 다시 확인하고, 리더렉트, 바이트 및 시간을 제한하고, JSON를 필요로하며, 검증된 HTTP 캐시 제어에 따라만 검증합니다.`client_name`그리고 신뢰할 수 없는 텍스트로 표시되는 다른 필드

CIMD는 첫 번째 접촉에 대해 새로운 동적 식별자를 만들어야 할 필요성을 제거합니다. URI 검증, 발행자 정책 또는 사용자 동의를 리디렉션하지 않습니다.

### DCR는 호환성 경로

동적 클라이언트 등록은 오래된 권한 서버에 사용할 수 있지만 새로운 MCP 구현에 대해서는 비효율적입니다.

DCR를 사용할 때, 선언합니다 `application_type`이 부분의 본문은

```json
{
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

- 데스크톱, 모바일, 명령 줄 및 루프백 클라이언트 사용 `native`- 그래
- 원격으로 호스팅된 브라우저 응용 프로그램을 사용 `web`그리고 원격 HTTPS 리더렉션

필드를 제외하면 기본적으로 `web`OpenID Connect 등록 구현에서 합법적인 루프백 리디렉션 실패를

DCR 코드를 명시적인 반발 결정 뒤에 보관하세요. 임의의 CIMD 검증 실패 후 조용히 뒤로 물러나지 마십시오. 이는 보안 실패를 더 약한 등록 경로로 전환시킬 수 있습니다.

### 발행자에게 인증서들을 묶어주는

발행자가 주입한 등록 자료를 정확한 발행자의 이름으로 저장:

```text
issuer_credentials[issuer] = pre_registered_or_dcr_client
tokens[(issuer, resource)] = access_token
```

보호된 자원 발견이 변경되는 경우`https://auth-one.example` `https://auth-two.example`, 신뢰를 재평가 합니다. 첫 번째 발행자의 클라이언트 비밀, DCR 클라이언트 아이디, 등록 액세스 토큰, 리프레쉬 토큰 또는 액세스 토큰을 두 번째에 보내지 마십시오. 사전 등록 및 DCR 클라이언트는 새로운 발행자에 대한 인증서를 사용해야합니다.

CIMD 클라이언트 아이디는 자스피스 호스팅된 HTTPS URL이기 때문에 다르며, 권한 서버가 만든 인증서가 아니기 때문입니다. 동일한 CIMD URL는 휴대성입니다. 새로운 신뢰할 수 있는 발행자가 DCR 재등록 없이 문서를 가져와 검증합니다. 권한 응답과 토큰은 여전히 새로운 발행자 아래 검증되고 저장됩니다.

### PKCE와 함께 허가 코드

상호 작용 흐름은:

1. 높은 엔트로피를 생성합니다`code_verifier`- 그래
2. S256를 추출해`code_challenge`- 그래
3. 허가 요청을 정확히 보내십시오`client_id``redirect_uri``scope``code_challenge`그리고`resource`- 그래
4. `code`그리고 제공될 경우,`iss`- 그래
5. 유효성`iss`응답 필드를 사용하기 전에 정확한 기록된 발행자에 대해
6. 코드 교환`code_verifier`, 같은 URI를 리디렉트하고, 같은 `resource`- 그래
7. 결과 로켓을 아래로 저장합니다`(issuer, resource)`- 그래

`resource`RFC 8707에서 파라미터는 권한 및 토큰 요청 모두에서 나타납니다. 그것은 가전적인 MCP 서버 URI를 식별합니다.

### 유효성`iss`정확히

RFC 9207은 한 발행자의 허가 응답이 다른 발행자의 응답과 혼동되는 것을 방지합니다.

언제`iss`이 코드가 존재할 경우, 케이스 폴딩, 래일링 슬래스 변경, 기본 포트 제거 또는 % 코딩 정상화 없이 기록된 발행자와 비교하십시오. 부합에 대해서는 해당 응답에서 코드에 대해 행동하거나 공격자가 제어하는 오류 세부 사항을 표시하지 마십시오.

권한 서버가 포함됩니다`iss`광고`authorization_response_iss_parameter_supported: true`현재 고객들은 여전히 선물을 확인합니다`iss`심지어 그 광고가 없어진 경우에도 말이죠.

### MCP 서버에서 시청자를 확인

리소스 서버는 자체적으로 발행된 토큰만을 받아들인다:

```text
token.issuer == configured_authorization_server
token.audience == canonical_mcp_resource
```

유효하지 않은, 만료된, 잘못된 발행자 또는 잘못된 관객 토큰은 401을 수신합니다. MCP 서버는 다른 서비스에 대한 토큰을 받아들이거나 전송해서는 안됩니다.

### 가장 작은 전류 범위를 요청

이제 필요한 범위에서 시작하십시오. 나중에 추가 도구가 필요하다면 서버는 권위 있는 범위 도전으로 403을 반환합니다.

```text
WWW-Authenticate: Bearer error="insufficient_scope",
  scope="notes:delete",
  resource_metadata="https://notes.example.com/.well-known/oauth-protected-resource/mcp"
```

클라이언트는 새로운 권한을 설명하고 동의를 얻으며, 결합 범위 집합으로 새로운 권한 흐름을 수행하고, 새로운 JSON-RPC ID로 MCP 요청을 다시 시도합니다.

도전된 범위가 의 하위 집합이라고 가정하지 마십시오.`scopes_supported`. 이 도전은 현재 운영에 대한 권위 있는 도전입니다.

### 허가 및 무국민 MCP 와이어

승인된 도구 호출은 여전히 전체 현재 요청 봉투를 가지고 있습니다:

```text
POST /mcp
Authorization: Bearer <access-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.delete
```

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "tools/call",
  "params": {
    "name": "notes.delete",
    "arguments": {"id": "note-7"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "oauth-lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

토큰은 원자를 승인하고 요청 메타 데이터는 프로토콜 행동을 협상합니다. 둘 중 어느 것도 다른 것을 대체하지 않습니다.

고정 순서로 와이어를 검증: JSON-RPC 및 메타데이터 타입, 헤더 및 체육 평등, 그리고 프로토콜 지원. 라우팅 또는 버전 헤더 불합이 HTTP 400을 `-32020`. 헤더와 인체가 지원되지 않는 버전을 동의하면 HTTP 400을 `-32022`그리고`data`정확히`{"supported":["2026-07-28"],"requested":"<actual>"}`. 알려지지 않은 방법은 HTTP 404을 반환합니다`-32601`- 그래

401 무효 토큰과 403 부적합 범위를 포함한 모든 요청 오류는 원래 요청과 함께 JSON-RPC 오류 봉투입니다 `id`구조화된 복구 정보는 선택적 오류에 속합니다`data``WWW-Authenticate`HTTP 응답 헤더가 됩니다.`id`, 그래서 JSON-RPC 인체를 수신하지 않습니다. 받아들여진 HTTP 알림은 빈 인체로 202을 반환합니다.

서버에서 구현`server/discover`그리고 도구들을 광고하고, 그래서 의무적인`tools/list`방법. 도구 설명서는 안정적인 이름, 설명 및 객체 뿌리를 가지고 있습니다.`inputSchema`값. 목록은 결정적이고 반환합니다 `resultType`, 서버 아이덴티티 메타데이터, 한정된`ttlMs`그리고`cacheScope`. Discovery 및 사용자 독립적인 도구 목록은 허가 전에 사용할 수 있습니다. 일반 정책과 개인 캐싱을 적용합니다.

### 통행표가 없습니다

MCP 서버는 클라이언트의 MCP 액세스 토큰을 하류 API로 전송해서는 안 됩니다. 적절한 청중과 함께 별도의 하류 토큰을 얻거나 명시적인 토큰 교환 디자인을 사용하십시오. 서비스들이 다른 사람을 위해 만든 토큰을 거부할 때만 청중 검증이 작동합니다.

### 리프레저 토큰

리프레쉬 토큰은 선택적입니다. 발행되면 비밀로 저장하고 발행자와 리소스에 따라 키하십시오. 존재한다고 가정하지 마십시오. 권한 서버가 회전을 지원할 때 회전하고 비효율 된 값을 재사용하는 것을 감지하십시오.

```figure
t3-scope-stepup
```

## 건설 해

`code/main.py`프로세스 내 프로토콜 및 권한 시뮬레이터입니다. 보호된 리소스 발견, 권한 서버 메타데이터, CIMD 등록, 버전 게이트 된 DCR 백업, 응용 프로그램 유형 확인, PKCE, 발행자 검증, 리소스 제한 토큰, 범위 증강,`server/discover``tools/list`, 그리고 무국민 도구 요청

모델은 파서된 요청체와 라우팅 헤더를 수신합니다. 그것은 완전한 HTTP 어댑터가 아니며 파서하지 않습니다.`Content-Type`또는`Accept`. 레슨 09의 스트리메이블 HTTP 어댑터에 연결하여,`Content-Type: application/json`그리고`Accept`두 가지 모두 포함된 값`application/json`그리고`text/event-stream`- 그래

실행하세요:

```bash
cd phases/13-tools-and-protocols/16-mcp-security-oauth-2-1
python3 code/main.py
python3 -m unittest discover code/tests -v
```

출력 결과에는 먼저 발견, CIMD 등록, 일반 읽기, 두 개의 별도의 범위 단계 및 발행자 키의 인증서 저장이 표시됩니다.

## 사용 하 고

시뮬레이터 객체를 생산 구성 요소에 지도:

- `ResourceServer.protected_resource_metadata`RFC 9728의 최종점으로 변한다.
- `AuthorizationServer.metadata`RFC 8414 또는 OpenID Connect 발견이 됩니다.
- `Client.enroll`CIMD 해상도와 명시적인 DCR 호환성 분할이 됩니다.
- 발행자로부터 발행된 고객 신분증 및`tokens_by_issuer_resource`CIMD URL는 허가 결과물이 발행자에게 구속되는 동안 휴대할 수 있습니다.
- `ResourceServer.handle`전송 전에 현재 MCP 헤더, 토큰 및 도구 범위를 검증하는 미들웨어가 되면서 모든 요청 오류를 일치하는 JSON-RPC 봉투에 저장합니다.

## 선박

이 수업은 니다`outputs/skill-oauth-scope-planner.md`현재 등록 우선 순위, 발행자 제한 인증서 저장, 응용 프로그램 유형, PKCE, 자원 지표, 범위 도전 및 현재 무국가 요청 경계를 설계합니다.

## 운동

1. 리프레쉬 토큰 회전을 추가하고 이전 리프레쉬 토큰의 재사용을 거부합니다.
2. 발행자 허가 목록을 추가 합니다. 발행자 변경 시 휴대용 CIMD URL만 재사용하고, 이전 발행자 주머니에 넣은 모든 인증서 및 토큰을 거부합니다.
3. 허가 코드에 만료기를 추가하고 늦은 교환이 실패한 것을 확인합니다.
4. 원격 HTTPS 리디렉션으로 웹 클라이언트 변형을 구축하고 DCR 메타데이터를 네이티브 클라이언트와 비교하십시오.
5. 같은 발행자 아래 두 번째 리소스를 추가하고, 첫 번째 리소스에서 액세스 토큰이 사용할 수 없음을 확인합니다.

## 주요 용어

| Term | Meaning |
|------|---------|
| Protected-resource metadata | RFC 9728 document that identifies the resource and authorization servers |
| CIMD | HTTPS metadata document whose URL is the OAuth client identifier |
| DCR | Deprecated dynamic client enrollment retained for compatibility |
| `application_type` | `native` or `web`, used to validate redirect URI rules |
| PKCE | Verifier and S256 challenge that protect an intercepted authorization code |
| `iss` | RFC 9207 authorization response issuer identifier |
| Resource indicator | RFC 8707 parameter that binds a token request to an MCP resource |
| Audience | Resource for which a token is valid |
| Step-up | New consent and token issuance for an additional current-operation scope |
| Issuer-bound credentials | Registration and token records isolated by exact authorization server issuer |

## 더 많은 읽기

- [MCP 2026-07-28 authorization specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- [RFC 9728: OAuth 2.0 Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728)
- [RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707)
- [RFC 9207: OAuth 2.0 Authorization Server Issuer Identification](https://www.rfc-editor.org/rfc/rfc9207)
- [OAuth Client ID Metadata Document draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/)
