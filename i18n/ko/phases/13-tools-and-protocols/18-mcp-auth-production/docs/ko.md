# 생산 중 MCP 저작자: 발행자 유통 등록 및 토큰

> 레슨 16은 OAuth 2.1 상태 기계를 구축했습니다. 이 레슨은 MCP 2026-07-28의 생산 경계를 강화합니다. 클라이언트 ID 메타데이터 문서 먼저, 호환성만을 위해 비효율적인 동적 등록, 권한-응답 발행자 검증, 발행자 키 클라이언트 인증서, JWKS 업데이트 및 모든 상태없는 요청에 관객이 꽂은 토큰.
>
> **Spec note (2026-07-28):**동적 클라이언트 등록은 클라이언트 ID 메타데이터 문서의 이익을 위해 비효율적입니다. DCR는 호환성 메커니즘으로 남아 있습니다. 사용되면 클라이언트는 올바른 `application_type`. 클라이언트는 현재 RFC 9207을 유효성표`iss`인증서 발행자 간 인증서들을 가치있게 사용하고 재사용하지 않습니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 16 (OAuth 2.1 state machine), Phase 13 · 17 (gateways)
**Time:** ~90 minutes

## 학습 목표

- RFC 8414 메타데이터를 통해 권한 서버를 발견하고 계약을 확인합니다.
- 클라이언트 ID 메타데이터 문서를 통해 등록하고, 비정형 DCR를 역전으로 분리하십시오.
- RFC 9207을 유효성 확인`iss`, 허가 서버 발행자들에 의한 주요 등록 및 발행자 더한 자원에 의한 주요 자원 제한 토큰.
- JWKS 키를 일정으로 캐시하고 업데이트하여 서명 검증이 키를 롤 오버하는 것을 생존합니다.
- RFC 8707 리소스 지표를 사용하여 하나의 MCP 리소스에 로큰을 핑하고 혼란스러운 부처 재사용을 거부합니다.
- JWT 검증 또는 토큰 내보를 선택하고, 취소 신선도를 정의하고, 정체성 의존성이 사용할 수 없을 때 안전하게 실패합니다.
- 권한 서버, 리소스 서버, 클라이언트를 분리하여 각각의 검사를 수행합니다.
- 사용 권한 서버를 배포 체크리스트에 대한 감사 및 안전하지 않은 등록 또는 토큰 재사용을 거부합니다.

## 문제

레슨 16 시뮬레이터는 OAuth 2.1를 메모리에 실행합니다. 생산은 메모리 전용 시뮬레이터에서 볼 수 없는 세 가지 운영 격차를 가지고 있습니다.

첫 번째 격차는 등록 및 자격정지 격리입니다. 실제 조직은 수백 개의 MCP 서버와 수천 개의 MCP 클라이언트를 실행할 수 있습니다. 2026-07-28 개정에서는 **Client ID Metadata Document**: 클라이언트는 HTTPS URL를 사용하여 식별자로 제어하는 경로를 사용하며 권한 서버는 메타 데이터를 끌어냅니다. RFC 7591 동적 등록은 비현실화된 호환성 경로로로만 남아 있습니다. DCR가 불가피할 경우 요청은 올바른 것을 선언합니다`application_type`. 클라이언트는 허가 서버 발행자에서 등록을 저장하고 ,`(issuer, resource)`파어: 변경된 발행자는 새로운 등록을 의미하며 다른 자원은

두 번째 격차는 키 회전입니다. JWT 검증은 JSON 웹 키 세트 (JWKS) 로 출판된 권한 서버의 서명 키에 달려 있습니다. 권한 서버는 일정에 따라 이러한 것을 회전합니다 (일반은 시간당, 때로는 사고 반응에서 더 빨리). 시작 시 한 번 JWKS를 가져오는 MCP 서버는 로테이션 창까지 유효합니다 제작 케이블은 JWKS를 캐시 값으로 이전 키가 만료되기 전에 캐시를 덮어쓰는 업데이트 작업과 함께 캐시 미스에서 캐시보다 새로운 키가 서명 한 토큰이 도착하는 경우 캐시 미스를 다시 가져옵니다.

세 번째 격차는 청중 구속력입니다. 레슨 16 은 RFC 8707 자원 지표를 도입했습니다. 생산에서, 그 지표는 모든 요청에 대한 엄격한 청구 검사로 변합니다. MCP 서버는 비교합니다.`token.aud`자신의 정통적 리소스 URL에 대해 설명하고 HTTP 401과 부합을 거부합니다. 이것은 상류 MCP 서버 (또는 하나의 서버에 대한 토큰을 보유한 악성 클라이언트) 이 동일한 신뢰 매체에서 다른 서버에 대한 토큰을 재생하는 유일한 방어입니다.

이 교훈은 각 격차를 콘크리트 표면으로 표시합니다. 메타데이터 문서는 HTTP 엔드포인트입니다. JWKS 캐시 업데이트는 일정 작업과 키 값 캐시입니다. JWT 검증은 어떤 도구를 전송하기 전에 리소스 서버가 실행하는 일상적인 방법입니다. 세 개의 역할을 분리하여 각각이 소유한 체크만을 시행합니다. 권한 서버가 키를 발행하고 회전하고, 리소스 서버가 캐시하고 검증하고, 클라이언트가 발견하고 등록합니다.

## 범주: 수업 16 이후 생산 집행

[Lesson 16: MCP Security with OAuth 2.1](../../16-mcp-security-oauth-2-1/docs/en.md)권한 코드 상태 기계, PKCE, 보호 자원 발견, 자원 지표 및 범위 결정이 소유합니다. 이 수업은 두 번째 OAuth 흐름을 정의하지 않습니다. 이 계약이 존재하면 시작되며 배치 된 자원 서버가 키 로테이션, 불투명한 토큰 검증, 취소, 의존성 실패, 배포 및 사고 응답 동안 어떻게 계속 시행하는지 묻습니다.

생산 경계는 좁고 더 운영적입니다.

- JWT 경로는 고정된 발행자, 알고리즘, 서명 키, 시청자, 시간 요구 및 모든 요청에 대한 범위를 확인하고 JWKS를 안전하게 업데이트합니다.
- 비명성 토큰 경로는 발행자의 인증된 내관성 최종점을 호출하고 반환된 활성 상태, 관객 또는 자원, 만료, 주체 및 범위를 검증합니다.
- 취소 정책은 인증서가 얼마나 빨리 작동하지 않으면 안되는지 정의하고 어떤 캐시가 그 사실을 지연시킬 수 있는지 정의합니다.
- 실패 정책은 발견, JWKS, 내관 또는 취소 인프라가 사용할 수 없을 때 무슨 일이 일어나는지 결정합니다.
- 발행자 메타데이터, 키 세트 또는 내성검사 응답, 토큰 청구, 정책 버전 및 거부 이유를 토큰을 저장하지 않고 결과를 주도한 증거 기록.

이 구별은 교훈을 구성할 수 있도록 합니다. 레슨 16 은 흐름을 증명합니다. 레슨 18 은 토큰이 실제 MCP 요청 경로를 달성한 후 신뢰성이 남아 있거나 거부된다는 것을 증명합니다.

## 개념

### RFC 8414  OAuth 권한 서버 메타데이터

`/.well-known/oauth-authorization-server`클라이언트가 필요로 하는 모든 것을 설명합니다.

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "client_id_metadata_document_supported": true,
  "registration_endpoint": "https://auth.example.com/register",
  "authorization_response_iss_parameter_supported": true,
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "scopes_supported": ["mcp:tools.read", "mcp:tools.invoke"],
  "token_endpoint_auth_methods_supported": ["none", "private_key_jwt"]
}
```

MCP 리소스 URL 체인 발견을 받은 클라이언트: `oauth-protected-resource`RFC 9728 (자원 서버 문서) 에서 발행자의 이름을 지정하고,`oauth-authorization-server`클라이언트는 권한 URL를 하드코드하지 않습니다.

경로와 함께 있는 리소스 식별자를 위해 그 경로 전에 잘 알려진 세그먼트를 삽입하십시오. 예를 들어, `https://mcp.example.com/team/server`보호된 자원 메타데이터를 `https://mcp.example.com/.well-known/oauth-protected-resource/team/server`- 부착`/.well-known/...`리소스 경로가 잘못 된 후에

MCP의 IDP를 신뢰하기 전에 확인하는 계약:

- `code_challenge_methods_supported`포함됩니다`S256`(RFC 7636에 따른 PKCE) 이 명시적: 이 필드는**absent**, 권한 서버는 PKCE 및 클라이언트를 지원하지 않습니다 **MUST**계속하지 않겠습니다.
- `grant_types_supported`포함됩니다`authorization_code`그리고 거절합니다`password`그리고`implicit`- 그래
- 적어도 한 개 등록 경로가 있습니다.`client_id_metadata_document_supported: true`(CIMD, 우선) 사전 등록된 클라이언트 또는`registration_endpoint`(RFC 7591의 호환성이 떨어지는)
- 만약`authorization_response_iss_parameter_supported`사실, 클라이언트는 반환된 RFC 9207을 요구합니다`iss`그리고 이 지표는 이 지표가 전환되기 전에 기록된 발행자와 정확히 비교한다.
- `response_types_supported`정확히`["code"]`OAuth 2.1에 대해

만약`S256`이 IDP에 대한 배포를 거부하는 MCP 서버가 없어진 경우 PKCE에 대한 degraded mode가 없습니다.`client_id`, 당신은 또한 등록할 수 없습니다; 배포 선언문 잘못, 코드는 아닙니다.

### RFC 9728 (재정)  보호된 자원 메타데이터

레슨 16 은 RFC 9728 를 다루었다. 생산의 델타: 이 문서 는 클라이언트가 *이* MCP 서버가 신뢰하는 권한 서버를 찾는 유일한 장소 이다. 단일 MCP 서버는 여러 IdP (인력, 파트너) 로부터 토큰을 받아들일 수 있다. RFC 9728 는 그 집합을 선언하고 RFC 8414 는 각 IdP가 지원하는 것을 문서화 한다.

```json
{
  "resource": "https://notes.example.com",
  "authorization_servers": ["https://auth.example.com", "https://partners.example.com"],
  "scopes_supported": ["mcp:tools.invoke"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://notes.example.com/docs"
}
```

### 클라이언트 ID 메타데이터 문서 (상담 기본)

CIMD는 등록을 * 푸시*에서 * プル*로 변환합니다.`client_id`, 클라이언트는 HTTPS URL를 사용합니다**as**이 `client_id`. URL는 JSON 메타데이터 문서로 해결됩니다. 권한 서버는 OAuth 흐름 중에 요청에 따라 검색합니다. 신뢰는 DNS에 뿌리 내립니다. 서버 운영자가 신뢰하는 경우 `app.example.com`, 고객에게 신뢰를 주는`https://app.example.com/client.json`- 등록도 없고, 통행도 없습니다`client_id`나메스 스페이스에서 배기가스, 서버별 상태가 없습니다.

클라이언트가 호스트하는 메타데이터 문서:

```json
{
  "client_id": "https://app.example.com/oauth/client.json",
  "client_name": "Example MCP Client",
  "client_uri": "https://app.example.com",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:7333/callback", "http://localhost:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

`client_id`문서의 가치**MUST**해당 URL와 같을 때 (허가 서버가 이를 확인하고, 부합이 거부된다).허가 서버는 `client_id_metadata_document_supported: true`RFC 8414 메타데이터에

현재 CIMD 계약에 대해서는`client_id``client_name`, 그리고 비공개`redirect_uris`클라이언트 식별자는 경로와 함께 절대적인 HTTPS URL입니다. `application_type`CIMD 필드 에 포함될 수 있지만 의무적인 CIMD 필드 는 아닙니다.`application_type`CIMD의 선호하는 경로로

두 가지 보안 사실에 대해 설명은 순결합니다.

- **SSRF.**권한 서버는 공격자가 제공한 URL를 가져옵니다. 그것은 서버 측 요청 위조 (내용/관리자 최종점으로 가져가지 않습니다) 에 대해 방어해야합니다.
- **localhost impersonation.**CIMD만으로는 로컬 공격자가 합법적인 클라이언트의 메타데이터 URL를 주장하고`localhost`리디렉션 권한 서버**MUST**동의 시 URI 호스트 이름을 명확하게 표시하고**SHOULD**경고`localhost`-만 리더렉트

CIMD는 서버 측 상태가 필요 없기 때문에 DCR가 요구하는 방식으로 서있는 등록자가 없습니다. 클라이언트 측은 읽기 전용입니다. 정적 HTTPS 엔드포인트에서 메타데이터 문서를 제공하여 권한 서버가 그것을 끌어당기도록하십시오.

허가 서버 운영자가 이미 클라이언트 식별자를 제공한 경우 자동 등록을 시도하기 전에 발행자 스코프 등록을 사용하십시오. 그렇지 않으면 CIMD를 선호합니다. 발행자가 사전 등록 또는 CIMD를 사용할 수 없는 경우에만 구약된 DCR를 사용하십시오.

### RFC 7591: 비효율적 호환성 등록

DCR는 2026-07-28 개정에서 비효율적입니다. CIMD를 소비할 수 없는 권한 서버에서만 보관하고 사전 등록이 실용적이지 않은 경우. 호환성 클라이언트는:

```json
POST /register
Content-Type: application/json

{
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",
  "scope": "mcp:tools.invoke",
  "client_name": "Cursor",
  "software_id": "com.cursor.cursor",
  "software_version": "0.42.0"
}
```

서버는 `client_id`그리고`registration_access_token`나중에 업데이트를 위해:

```json
{
  "client_id": "c_3e7f1a",
  "client_id_issued_at": 1769472000,
  "redirect_uris": ["http://127.0.0.1:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "registration_access_token": "regt_b2...",
  "registration_client_uri": "https://auth.example.com/register/c_3e7f1a"
}
```

`application_type`장식적인 것이 아닙니다. ループ백 데스크톱 클라이언트는 선언합니다.`native`; 서버에서 호스팅된 클라이언트가 선언합니다 `web`HTTPS 리디렉션 URI를 사용합니다. `token_endpoint_auth_method: none`공중 네이티브 클라이언트에서 정해진 기본값입니다.`client_id`PKCE가 소유 증명서를 제공하면만

생산에 대한 3가지 함정이 있습니다.

- 등록 최종점은 출처 IP에 의해 제한된 비율을 가져야 합니다. 그 없이는 적대적인 행위자는 수백만 개의 가짜 등록을 스크립트하고`client_id`등록자가 요청을 처리하기 전에 요금 제한 확인을 실행하세요.
- `software_statement`(클라이언트에게 서명된 JWT 보증) 는 일부 기업 IDP에 의해 요구됩니다. 수업의 모크는 그것을 건너뛰고, 생산은 로컬호스트 리디렉트 URIs 이외의 다른 모든 것에서 서명되지 않은 등록을 거부하는 검증 단계를 사용합니다.
- `registration_access_token`이 토큰이 도난되면 공격자가 클라이언트의 URI를 다시 쓸 수 있습니다.

### RFC 8707 (재정)  자원 지표

16강습은 형태를 설정합니다. 생산 규칙: 모든 토큰 요청은 포함됩니다`resource=<canonical-mcp-url>`, 그리고 MCP 서버가 확인합니다`token.aud`각 호출에 고유 리소스 URL를 일치시킵니다. 가노닉 URI는 서버의 * 가장 구체적인* 식별자입니다.**not**규칙에 의해 벗겨진  스펙은 개별 MCP 서버를 식별하는 데 필요한 경우 보관합니다. `https://mcp.example.com``https://mcp.example.com/mcp``https://mcp.example.com:8443`그리고`https://mcp.example.com/server/mcp`모든 유효한 가전적 URI입니다. 서버마다 하나를 선택하고`aud`(이 수업의 모크는 맨체스터 관객들을 이용합니다.`https://notes.example.com`단기적으로 설명하자면, 하나의 기원에 따라 여러 MCP 서버를 공동으로 주최하는 배포가 경로로 구분한다.)

### RFC 7636 (재정)  PKCE

PKCE는 OAuth 2.1에서 의무적입니다. 수업의 허가 코드 흐름은 항상 `code_challenge`그리고`code_verifier`. 서버는 검증기 없이 또는 저장된 도전에 해시하지 않는 검증기와 함께 모든 토큰 요청을 거부합니다.

### MCP 2026-07-28 허가 프로필

현재 MCP 개정으로 OAuth 리소스-서버 경계가 유지되고 MCP 운송을 무정부화하고 있습니다. 정체성 결정을 캐쉬할 프로토콜 세션이 없습니다. 따라서 권한 계층은 각각의 요청을 독립적으로 검증합니다.

- 보호된 자원 메타데이터 RFC 9728을 구현하고,`WWW-Authenticate: Bearer resource_metadata="..."`401의 헤더**or**잘 알려진 URI`/.well-known/oauth-protected-resource`(SEP-985는 잘 알려진 하프백으로 헤더를 선택적으로 만들었습니다.)`authorization_servers`필드**MUST**적어도 하나의 서버를 명명하세요.
- 토큰을 `Authorization: Bearer ...` **every**요청  질의 문자열에서 절대, 세션 시작에서만 유효하지 않습니다.
- 유효성`aud``iss``exp`, 그리고 요청에 따라 필요한 범위.**MUST**토큰이 특별히 그 (관객) 에 맞게 발행되었음을 확인합니다.`aud`거절당하고, 와일드카드처럼 취급되지 않습니다.
- 401/403로 돌아와`WWW-Authenticate: Bearer`운반`error=...`, `resource_metadata="<PRM-URL>"`매개 변수 (메타데이터 문서의 URL, *공체 리소스*가 아닌)`scope="..."` `insufficient_scope`(403) 참고: 매개 변수는 `resource_metadata`, 발견 지표 `resource`도전의 매개 변수
- 권한 서버 발견은 받아 들인다**either**RFC 8414 OAuth 메타데이터 **or**OpenID Connect Discovery 1.0; 클라이언트는 두 개의 잘 알려진 후자수를 우선 순위로 시도해야 합니다.
- 클라이언트 (서버가 아닌) 는 **mix-up attacks**: 예상되는 것을 기록합니다`issuer`이 `iss`PKCE 자체는 혼동을 멈추지 않습니다. 클라이언트가`code_verifier`그것이 어떤 지표적 지점에 향하든
- 클라이언트 인증서는 한 개의 허가 서버 발행자에게 있습니다. 발견이 다른 발행자에게 해결되면 고객은 이전 갱신 대신 다시 등록합니다.`client_id`등록 토큰이나 액세스 토큰
- CIMD는 선호되는 등록 메커니즘입니다. DCR는 비효율적입니다. 호환성 DCR 요청은 여전히 올바른 것을 선언합니다 `application_type`- 그래

OAuth 2.1 초안은 기판입니다. RFC 8414/7591/8707/9728/9207 + RFC 7636 + CIMD는 표면입니다. MCP 스펙은 프로필입니다.

### 배치 능력 체크리스트

판매자 기능 테이블은 빠르게 구시됩니다. 대신 실제로 배포할 권한 서버에서 반환 된 메타 데이터를 검사하십시오. 게이트는 기계적입니다:

| Check | Required decision |
|---|---|
| Discovered issuer | Exact HTTPS issuer expected by policy |
| PKCE | `S256` advertised; otherwise stop |
| Enrollment | CIMD preferred, pre-registration accepted, DCR only as deprecated compatibility |
| Authorization response | Validate RFC 9207 `iss` when present or advertised |
| Resource binding | Token request carries `resource`; resource server requires the matching `aud` |
| Credential storage | Key client IDs and registration credentials by issuer; key access tokens by issuer plus resource |
| DCR compatibility | Declare `native` or `web`; reject redirect URIs that do not fit the declared application type |

제품 이름이나 가격 계층에서 지원을 추론하지 마십시오. 배포 증거에서 발견된 문서를 캡처하고 의무 필드가 없는 경우 닫지 마십시오.

### JWKS 리프레쉬 패턴 (AS에서 회전, 리소스 서버에서 리프레쉬)

두 가지 동사를 분리해서 두 가지 동사를 섞는 것은 실제 생산 오류이기 때문입니다.

- **Rotate***허가 서버*가 하는 일은: 새 서명 키를 발음하고 JWKS에 게시하고, 오래된 키를 나중에 철회합니다. 리소스 서버는 여기에 참여하지 않으며 할 수 없습니다.
- **Refresh**이 '자원 서버'가 하는 일은:`GET`자원의 서버가 수행하는 유일한 JWKS 액션입니다.

생산 실패 모드는 구시된 캐시입니다. 일정한 업데이트 작업과 키 값 캐시로 해결하십시오. 리소스 서버는 작업 (cron, 타이머, 실행 시간 제공되는 것은 무엇이든) 을 실행합니다.`<issuer>/.well-known/jwks.json`그리고 덮어쓰는`cache[issuer] = {keys, fetched_at}`검증기는 캐시에서 읽습니다`kid`캐시 트리거에서 실종되었습니다**one**시크로노스 리프레쉬는 후속으로 다시 확인됩니다. 이것은 두 가지 경우를 동시에 처리합니다. 예정된 리프레쉬와 다음 예정된 리프레쉬 전에 새 키가 서명 한 토큰이 도착하는 키 오버레이프 윈도우.

돌기**must be a re-fetch, never a rotate**. 캐시 미스 경로를 회전- 및 멘트로 연결하면 두 가지가 깨집니다. (1) 신선한 키를 멘트하면 `kid`*아직도* 토큰과 일치하지 않으므로 검색은 어쨌든 실패하고 (2) 무작위로 토큰을 뿌리는 공격자가`kid`가치관들은 무한한 일련의 핵심 창조를 강요합니다.`kid`가장 많이 낭비된 수송을 합니다.

캐시 모양:

```json
{
  "https://auth.example.com": {
    "keys": [
      {"kid": "k_2026_03", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"},
      {"kid": "k_2026_04", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"}
    ],
    "fetched_at": 1772668800
  }
}
```

두 개의 키가 동시에 고정 상태입니다. 권한 서버는 다음 키를 입력하여 회전합니다 (`k_2026_04`) 이전 (`k_2026_03`), 따라서 오래된 키에 의해 발행된 토큰은 만료될 때까지 유효하다. 캐시에는 조합이 포함되어 있으며 검증기는 `kid`- 그래

### 검증 절차

MCP 서버는 어떤 도구를 전송하기 전에 검증을 실행합니다.`code/main.py`사용:

```python
result = server.validate(bearer_token, required_scope="mcp:tools.invoke")
if not result["valid"]:
    return {"status": result["status"], "WWW-Authenticate": result["www_authenticate"]}
```

`validate`JWT를 해독하고, JWKS 캐시에서 서명 키를 해결합니다 (실점으로 한 번 새로워집니다), 서명 확인하고, 확인합니다 `iss`허용 목록에 반해서,`aud`이 서버의 정통적 자료에`exp`, 그리고 필요한 범위  반환 `WWW-Authenticate`첫 번째 실패에 대한 도전. 리소스 서버에서 하나의 루틴을 유지하는 것은 모든 입구 포인트 (모든 도구 호출, 모든 운송) 이 동일한 검사를 통과한다는 것을 의미합니다.

### 불투명한 토큰은 추측이 아닌 내관적인 관측을 사용합니다.

모든 액세스 토큰은 JWT가 아닙니다. 발행자가 불투명한 토큰을 문서화하면 리소스 서버는 신뢰할 수있는 주장으로 암호를 해독 할 수 없습니다. 그것은 인증 된 백채널을 통해 발행자의 RFC 7662 내성 탐구 최종점으로 토큰을 전송하고 요구합니다.`active: true`, 예상된 발행자 맥락, 정확한 MCP 관중 또는 자원, 만료되지 않은 시간 청구 및 구체적인 도구가 요구하는 범위.

발행자로부터 캐시 내찰, 일방식 토큰 소화 및 MCP 자원 절대 명확한 토큰을 로그나 캐시 레이블로 사용하지 마십시오. 토큰의 유효기간이 가장 이른 시점에, 발행자 캐시 지침과 배포의 취소 신선함 목표에 의해 긍정적 인 캐시 입력을 묶습니다. 새로운 발행된 토큰이 거짓으로 비활성되지 않도록 부정적인 캐싱을 충분히 짧게 유지하십시오. 하나의 리소스에 대한 결과는 불투명한 토큰 문자열이 동일시되더라도 다른 리소스를 승인할 수 없습니다.

공격자 통제된 토큰 콘텐츠에서 검증 모드를 선택하지 마십시오. 검증된 발행자 메타 데이터 및 배포 구성에 대한 내찰 행동과 JWT를 핀하십시오. JWT 경로에서는, 인정을 받아서 신뢰할 수 있는 알고리즘을 핀합니다.`jwks_uri`; 단 한 번도 토큰 헤더가 선택한 키 URL 또는 알고리즘을 따르지 마십시오.

### 취소는 신선한 계약입니다

RFC 7009는 클라이언트가 권한 서버에게 토큰을 취소하도록 요청할 수 있습니다. 그 요청은 모든 리소스 서버에서 이미 캐쉬된 복사본을 지우지 않습니다. 최대 허용 가능한 취소 지연을 정의하고 모든 캐시가 그것을 존중하도록합니다.

비명성 토큰 배포는 각 위험 호출을 내보내는 것 또는 짧은 긍정적 캐시를 사용하여 더 엄격한 취소 효과를 얻을 수 있습니다. 자율 JWT 배포는 일반적으로 짧은 액세스 토큰 라이프타임과 리프레쉬 토큰 취소, 발행자 전체 사건의 키 퇴출, 긴급 지역 거부에 대한 선택 사항 주체, 세션 또는 토큰 아이디 단록 목록을 결합합니다. 서명된 JWT는 자원 서버가 현재 외부 취소 증거를 가지고 있지 않은 한 유효기간이 끝날 때까지 암호적으로 유효하다.

로그오웃, 계정 비활성화, 동의 철회, 사고 반응은 서로 다른 트리거이지만 측정 가능한 한 입장에 합쳐야 합니다. 가장 많이 선언된 철회 창 이후, 모든 복사본은 인증서를 거부합니다.

### 의존성 실패는 선언된 결정이 필요합니다

예외 처리 장치 내부에서 사용가능성 정책을 결코 즉흥적으로 만들지 마십시오.

| Failure | Safe production behavior |
|---|---|
| Scheduled JWKS refresh fails, known `kid` remains in a still-valid bounded cache | Continue only within the declared stale-on-error window and emit degraded health evidence |
| Token has an unknown `kid` and the one allowed refresh fails | Reject; never accept an unverifiable signature |
| Introspection is unavailable | Fail closed for protected calls; do not convert network failure into `active: true` |
| Protected-resource or issuer metadata changes unexpectedly | Stop new enrollment and token acquisition; keep only explicitly pinned, unexpired configuration under a bounded incident policy |
| Revocation endpoint is unavailable | Report logout or revocation as incomplete, retain the credential locally as unusable when possible, and do not claim global revocation succeeded |
| Clock source or claim type is invalid | Reject rather than widening skew until the token passes |

유효하지 않은 인증서와 별도로 오류를 분류하십시오. 의존성 중단은 건강 및 재시험 정책의 운영 오류입니다. 잘못된 서명, 발행자, 관객, 만료 또는 범위는 허가 거부입니다. 도구 핸들러에 도달하지 않으며, 도켓 콘텐츠를 감사 증거로 유출해서는 안됩니다.

### 시청자 재생 통행 ( 액세스 토큰 권한 제한)

서버 A (`notes.example.com`) 및 서버 B (`tasks.example.com`) 둘 다 동일한 권한 서버에 등록됩니다. 서버 A는 손상됩니다. 공격자는 사용자의 메모 토큰을 가져다가 서버 B에 다시 재생합니다.

서버 B의 검증기:

1. JWT를 해독하고 JWKS를 가져오세요`kid`, 서명 확인
2. 체크`iss`보호된 자원 메타데이터에 대한`authorization_servers`(이번 IDP를 통과합니다.)
3. 체크`aud == "https://tasks.example.com"`(실패  토큰 `aud` `https://notes.example.com`.)
4. 401을 반환합니다`WWW-Authenticate: Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="https://tasks.example.com/.well-known/oauth-protected-resource"`- 그래

청중 주장은 프로토콜 계층에서 이러한 공격에 대한 유일한 방어 수단입니다. 성능에 대한 점프는 가장 일반적인 생산 오류입니다. 검증기는 세션 시작에서뿐만 아니라 모든 요청에 실행되어야합니다.**access-token privilege restriction**: MCP 서버 `MUST`관객들 사이에서 이름을 밝히지 않는 모든 토큰을 거부합니다.

> **Naming note.**스펙은 관련하지만 명확한 문제로 " 혼란스러운 부처"라는 용어를 보유합니다.**proxy**타사 API에, 정적 클라이언트 ID를 사용하여, 클라이언트 사용자 동의를 얻지 않고 토큰을 전송합니다. 시청자 결합은 위의 재생을 수정합니다. 혼란스러운 부처 수정은 클라이언트 동의입니다.**plus**입력된 토큰을 상류 API (MCP 서버) 에 전달하지 않는 경우`MUST`자신의 별도의 상류 토큰을 얻습니다.)

### 혼합 공격 (서버가 제공하지 못하는 클라이언트 측면 방어)

클라이언트는 평생 동안 많은 권한 서버와 대화합니다. 악성 AS는 클라이언트가 공격자의 토큰 엔드포인트에서 정직한 AS의 권한 코드를 환원하도록 시도할 수 있습니다. 시청자 결합은 여기에 도움이되지 않습니다.

1. 환승하기 전에, 클라이언트는 예상되는 것을 기록합니다.`issuer`검증된 AS 메타데이터로부터
2. 허가 응답에서 클라이언트는 반환된 응답을 비교합니다 `iss`기록된 발행자에 대한 매개 변수 (단순한 문자열 비교, 정상화 없음)
3. 부합 (또는 `iss`AS가 광고를 할 때`authorization_response_iss_parameter_supported`) → 거부하고, 심지어 `error`필드

PKCE만으로는 혼동을 멈추지 않습니다. 왜냐하면 클라이언트가`code_verifier`이 때문에, 스펙은 PKCE 검증자와 함께 발매자를 요청에 따라 기록하고 있습니다.`state`- 그래

### 실패 모드

- **Stale JWKS.**검증기는 AS가 키를 회전한 후 유효한 토큰을 거부합니다. 수정 방법은 위의 cron-refresh + cache-miss-refetch 패턴입니다. 업데이트 작업 없이 JWKS를 캐시하지 마십시오.
- **Rotate-as-fall-back.**다시 가져오기 대신 캐시 미스 경로를 회전- 및 멘트로 연결하는 것은 진짜 버그입니다.`kid`, 그리고 공격자가 통제하는`kid`키 크리에이션 DoS에 값이 들어가야 합니다.`refresh-jwks`- 그래
- **Missing `aud` claim.**일부 IDP는 기본적으로 삭제합니다`aud`다만`resource`토큰 요청에 존재합니다. 검증자는 결여된 토큰을 거부해야 합니다.`aud`, 부재를 와일드카드처럼 취급하지 않습니다.
- **Mix-up via missing `iss` check.**RFC 9207을 검증하지 않는 클라이언트`iss`리디렉션 전에 기록한 발행자에 대한 권한-응답 매개 변수는 공격자의 토큰 엔드포인트에서 정직한 AS 코드를 환원하도록 지시될 수 있습니다. 이것은 클라이언트 측의 오류입니다. 리소스 서버는 이를 보완할 수 없습니다.
- **Scope upgrade race.**동일한 사용자에 대한 두 개의 동시 단계 상승 흐름은 모두 성공하고 다른 범위의 두 개의 액세스 토큰을 생성 할 수 있습니다. 검증자는 요청에 제시된 토큰을 사용해야 하며, TOCTOU 창을 생성하는 "이용자의 현재 범위"를 검색하지 않습니다.
- **Registration token theft.**누출된`registration_access_token`공격자가 URI를 다시 작성할 수 있게 해줍니다. 휴식시 해시, 클라이언트가 모든 업데이트에 클리어 텍스트를 제시하도록 요구하고 의심의 여지를 따라 회전합니다.
- **`iss` not pinned.**어떤 것을 받아들이는 검증자`iss`공격자가 자신의 권한 서버를 설치하고, 대상 관객을 위한 클라이언트를 등록하고, 토큰을 발행할 수 있게 합니다.`authorization_servers`목록은 허용 목록입니다. 그것을 시행하십시오.
- **Credential or token cache collision.**리소스에서만 등록 키를 사용하는 클라이언트는 한 권한 서버의 아이덴티티를 다른 클라이언트에 제시할 수 있습니다. 발행자에서만 접속 토큰을 키를 사용하는 클라이언트는 잘못된 관객에게 토큰을 재생할 수 있습니다. 검증된 발행자에서 주요 등록, 발행자로부터 액세스 토큰을 재생할 수 있습니다.`(issuer, resource)`, 그리고 발행자가 변경될 때마다 다시 등록한다.

```figure
t3-jwks-rotate
```

## 사용 하 고

`code/main.py`stdlib 파이썬과 3개의 역할로 전체 생산 흐름을 걷습니다: `AuthorizationServer``ResourceServer`그리고`Client`- 흐름:

저장소 루트에서 실행:

```bash
cd phases/13-tools-and-protocols/18-mcp-auth-production
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

첫 번째 명령은 발행자 유한 등록 및 토큰 유효성 확인을 인쇄합니다
2번은 18번의 체크를 보고합니다.
네트워크 청취자 또는 자격증을 작성하는 사람

1. 권한 서버는 RFC 8414 메타데이터를 `/.well-known/oauth-authorization-server`- 그래
2. MCP 클라이언트는 메타데이터 엔드포인트에 전화를 걸어 등록 옵션을 확인합니다 (`client_id_metadata_document_supported`CIMD에 대해`registration_endpoint`DCR) 및`S256`PKCE 지원
3. 클라이언트는 발행자 기준으로 사전 등록을 확인하거나 HTTPS 클라이언트 ID 메타데이터 문서로 등록합니다.
4. 클라이언트는 검증된 발행자를 기록하고, S256 도전을 작성하고, 일회용 허가 코드를 더 받습니다.`iss`, 반환된 발행자를 검증하고, 원래 검증자와 RFC 8707 를 사용하여 코드를 환불합니다.`resource`지표
5. MCP 클라이언트는 MCP 서버에 있는 도구를 호출합니다.`Authorization: Bearer ...`- 그래
6. MCP 서버가 실행됩니다`validate`, JWKS 캐시에서 서명 키를 해결합니다.
7. IDP는 키를 회전하고, 예정된 리프레쉬는 JWKS를 캐시로 다시 끌어들이고 있습니다.
8. 다음 호출은 재부팅 없이 업데이트된 키에 대해 유효하며 이전 토큰은 여전히 겹치기 창 동안 유효합니다.
9. 다른 MCP 리소스에 대한 청중 재연 시도는 401을 얻습니다`audience mismatch`그리고`resource_metadata`시사자

JWT는 공유 비밀로 HS256을 사용합니다 (이 때문에 수업은 stdlib에서만 실행됩니다). 생산은 위의 JWKS 패턴으로 RS256 또는 EdDSA를 사용합니다. 검증 논리는 다른 방식으로 동일합니다. IdP와 리소스 서버가 하나의 프로세스에서 살고 있기 때문에,`refresh_jwks`권한 서버의 키 리스트를 직접 읽습니다. 와이어를 통해 HTTP `GET` `jwks_uri`- 그래

## 선박

이 교훈은`outputs/skill-mcp-auth.md`. MCP 서버 구성 및 IdP 기능 세트를 고려하면, 기술은 보호된 리소스 메타데이터, 사용 할 등록 경로 (CIMD, 사전 등록 또는 DCR fallback), JWKS 업데이트 일정은, 범위 지도 및 IdP가 전체 RFC 프로파일을 지원하지 않을 때 적용되는 거부 규칙을 발산합니다.

## 운동

1. 달아`code/main.py`. 흐름을 추적하세요. IDP가 6 단계에서 키를 어떻게 회전하는지 알아보세요.`refresh_jwks`출판된 집합을 다시 끌어당기고, 오래된 토큰 (복복창) 과 새로운 토큰 모두 다시 시작하지 않고 유효합니다.

2. 보호된 자원 메타 데이터에 새로운 IDP를 추가합니다 `authorization_servers`목록. 새로운 IDP가 서명한 토큰을 발행하고 검증자가 그것을 받아들이는 것을 확인합니다. 목록에 포함되지 않은 IDP가 서명한 토큰을 발행하고 검증자가 거부하는 것을 확인합니다.`WWW-Authenticate: Bearer error="invalid_token", error_description="iss not allowed"`- 그래

3. 에 금전 제한 체크를 추가`register_client`등록자가 요청을 받아들이기 전에 실행되는. IP가 키로 된 작은 디렉트에서 보관된 소스 IP 당 토큰 버킷을 사용하십시오.

4. RFC 7591을 읽어내서 수업의 두 가지 분야를 확인하세요.`/register`처리자가 확인하지 않습니다. 확인을 추가합니다.`software_statement`그리고`redirect_uris`URI제도는)

5. 두 번째 권한 서버를 추가하십시오. 클라이언트가 발행자의 키에 의해 별도의 등록을 저장하고 첫 번째 발행자의 토큰을 재사용하기를 거부하는 것을 확인합니다.`client_id`- 그래

6. DoS 수정 증명해 보아라`kid`확인하고`refresh_jwks`최대 한 번 실행하면 권한 서버의 키 횟수가 증가하지 않습니다. 그리고 의도적으로 회전-와-mint로 다시 회전하고 가짜 토큰에 따라 키 횟수가 상승하는 것을 지켜보십시오.

7. 두 가지 모두에서 DCR를 사용하지 않는 운동`native`그리고`web`HTTP 리디렉션 URI를 가진 웹 클라이언트 확인하고 정확한 루프백 리디렉션 없이 네이티브 클라이언트 거부됩니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ASM | "OAuth metadata document" | RFC 8414 `/.well-known/oauth-authorization-server` JSON |
| CIMD | "Client metadata URL" | Client ID Metadata Document: an HTTPS URL used as the `client_id`; the AS pulls the JSON. Preferred enrollment in MCP 2026-07-28 |
| DCR | "Self-service client registration" | RFC 7591 `POST /register`; deprecated for current MCP and retained only for compatibility |
| JWKS | "Public keys for JWT validation" | JSON Web Key Set, fetched from `jwks_uri`, indexed by `kid` |
| Rotate vs refresh | "Updating the keys" | *Rotate* = AS mints/retires signing keys; *refresh* = resource server re-fetches the published set. Resource servers only ever refresh |
| Resource indicator | "Audience parameter" | RFC 8707 `resource` parameter pinning the token to one server |
| `aud` claim | "Audience" | JWT claim the validator compares against the canonical resource URL |
| Audience replay | "Token replay" | Token issued for Server A presented to Server B; defended by audience validation (spec: access-token privilege restriction) |
| Confused deputy | "Proxy token misuse" | An MCP proxy with a static client ID forwarding a token without per-client consent; distinct from audience replay |
| Mix-up attack | "Wrong token endpoint" | Client steered to redeem an honest AS's code at an attacker's endpoint; defended client-side via RFC 9207 `iss` |
| `iss` allow-list | "Trusted authorization servers" | The set named in protected-resource metadata's `authorization_servers` |
| `resource_metadata` | "Where to find the PRM doc" | `WWW-Authenticate` parameter naming the RFC 9728 metadata URL on a 401/403 |
| Public client | "Native or browser client" | OAuth client with no `client_secret`; PKCE compensates |
| `WWW-Authenticate` | "401/403 response header" | Carries `Bearer error=...` directives that drive client recovery |

## 더 많은 읽기

- [MCP authorization specification (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)- 현재 MCP 허가 프로파일
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)- CIMD, 발행자 검증, DCR 회전 및 발행자 키의 인증 변경
- [OAuth Client ID Metadata Document (draft-ietf-oauth-client-id-metadata-document-00)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00) CIMD
- [RFC 8414 — OAuth 2.0 Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414) 발견 계약
- [RFC 7591 — OAuth 2.0 Dynamic Client Registration Protocol](https://datatracker.ietf.org/doc/html/rfc7591) DCR (복귀 경로)
- [RFC 7636 — Proof Key for Code Exchange (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636) 공공 클라이언트 소유권 증명
- [RFC 8707 — Resource Indicators for OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc8707) 관객들의 핑
- [RFC 9728 — OAuth 2.0 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728) 리소스 서버 발견
- [RFC 9207 — OAuth 2.0 Authorization Server Issuer Identification](https://datatracker.ietf.org/doc/html/rfc9207) `iss`혼동 공격에 대한 방어 기호
- [RFC 7662: OAuth 2.0 Token Introspection](https://datatracker.ietf.org/doc/html/rfc7662)
- [RFC 7009: OAuth 2.0 Token Revocation](https://datatracker.ietf.org/doc/html/rfc7009)
