# MCP 클라이언트를 구축: 발견, 라우팅 및 듀얼 에라 패럴백

> 현대 MCP 클라이언트는 모든 요청에 따라 계약을 반복합니다. 가장 어려운 호환성 결정은 오래된 서버가 실제로 오래되고 현대 서버가 수정 가능한 오류를 보고하는 것을 아는 것입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lesson 07
**Time:** ~85 minutes

## 학습 목표

- 모든 MCP를 구축`2026-07-28`현재 메타데이터를 가진 요청
-   튜디오 서버를 검사`server/discover`그리고 상호 지원되는 버전을 선택하세요.
- 제한된 유서 깊은 탐사를 명시적으로 허용된 동료에게만 승인한다.
- 긍정적인 것을 확인한 후에만 유산을 받아들이세요`initialize`지원된 수정 결과를 얻습니다.
- 침묵으로 충돌을 덮지 않고 결정적인 도구 목록을 통합하십시오.
- 프로토콜 세션을 발명하지 않고 각각의 도구를 소유한 동료에게 호출하는 라이트

## 문제

에이전트 호스트는 일반적으로 한 개 이상의 MCP 서버와 대화합니다. 그것은 각 서버를 발견하고 도구 카탈로그를 통합하고, 복제 이름, 라이트 호출을 해결하고, 운송 실패에서 복구해야합니다.

`2026-07-28`수정은 매 요청이 자립하기 때문에 고정 상태가 더 간단합니다. 호환성은 시작을 더 미묘하게 만듭니다. 클라이언트는 다음과 같은 것을 만날 수 있습니다.

- 선호되는 버전을 지원하는 현대적인 서버
- 인식된 버전이나 헤더 오류를 반환하는 현대적인 서버
-     `server/discover`
- 기존 서버가 수신할 때까지 침묵합니다`initialize`- 그래

모든 탐사 오류를 유래로 취급하는 것은 위험하다. 잘못된 현대 요청, 과부하 서버, 죽은 프로세스 및 오래된 서버는 모두 동일한 시간 종료 또는 연결 종료를 일으킬 수 있습니다. 이러한 신호는 모호합니다. 클라이언트는 유래 시대를 선택하기 전에 명시적인 운영자 의도를 긍정적 인 프로토콜 증거와 결합해야합니다.

## 개념

### 동료, 프로토콜 세션이 아닙니다

각 서버 프로세스 또는 엔드포인트에 대해 하나의 전송 동료 기록을 유지하십시오.

- 운송 핸들 또는 전송 기능
- 선택된 프로토콜 시대와 버전
- 마지막으로 발견된 서버 기능
- 마지막 결정적 도구 목록
- 상관관계를 위한 요청 ID가 기다리고 있습니다.
- 교통 건강

이것은 클라이언트 회계입니다. 프로토콜 세션 상태가 아닙니다. 현대 MCP에서 서버는 여전히 모든 요청에 대한 최신 버전과 기능을 수신합니다.

### 모든 현대적인 요청을 처음부터 만들어

```python
def modern_request(request_id, method, params, version, capabilities):
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method,
        "params": {
            **params,
            "_meta": {
                "io.modelcontextprotocol/protocolVersion": version,
                "io.modelcontextprotocol/clientCapabilities": capabilities,
                "io.modelcontextprotocol/clientInfo": CLIENT_INFO,
            },
        },
    }
```

연결 객체에 메타데이터를 한 번 붙여서 케이블에 도달했다고 가정하지 마십시오. 마지막 일련 요청을 스탬프하고 검사하십시오.

### 현대적 발견

`server/discover`지원된 버전, 서버 기능, 명령어, 캐시 팁 및 권장된 서버 아이덴티티를 반환합니다. 클라이언트는 가장 높은 상호 지원되는 현대 버전을 선택합니다.

디스커버리는 최신 클라이언트에서만 선택 사항이지만, stdio에서 권장됩니다. 일부 레거시 서버는 초기화 전에 작업을 받아 들인다. 따라서 전송 `tools/list`첫 번째 것은 모호한 성공을 가져올 수 있습니다.`server/discover`깨끗한 시대를 만들어냅니다.

### 이디오 호환성 탐사

두 개의 시대 스튜디오 클라이언트가 보내`server/discover`다른 요청보다 우선적으로 선호하는 현대 메타데이터를 가지고 있습니다.

1. **DiscoverResult.**서버는 최신 상태입니다. 상호 지원되는 버전을 선택하고 요청에 따라 메타데이터를 계속하십시오.
2. **Recognized modern error.**서버는 현대적입니다`-32022`, 선택하세요`data.supported`새로운 요청 아이디를 다시 시도합니다. 헤더 또는 기능 오류를 위해 요청을 수정하십시오. 전송하지 마십시오`initialize`- 그래
3. **Ambiguous signal.**인식되지 않은 JSON-RPC 오류, 타임아웃, 연결 종료 또는 빈 응답은 시대를 식별하지 않습니다. 정확한 동료가 유래 호환성을 위해 구성되지 않는 한 종료 실패.

인식된 현대 프로토콜 오류는 다음과 같습니다.

- `-32020`헤더 부합
- `-32021`필요성 클라이언트 능력
- `-32022`지원되지 않는 프로토콜 버전

인식 된 현대 오류는 동료가 유래 허용 목록에있을 때에도 현대적입니다. 서버가 현대 오류 어휘를 이해한다는 것을 증명하면, 전송 `initialize`그 정도가 낮아질 겁니다.

치료하지 마십시오`-32601`이 규칙은 시간제, 연결 종료 또는 빈 응답에 적용됩니다.

### 허가 목록은 운영자의 의도이고 증거가 아닙니다.

레거시 호환성은 한 개의 핑 피어 구성의 명시적 속성여야 합니다:

```python
client.add_server("archive", archive_transport, allow_legacy=True)
```

선택의 선택은 구성된 명령어 또는 엔드포인트에 연결하십시오. 임의 서버가 더 약한 의미로 선택하도록 허용하는 와일드카드를 사용하지 마십시오.`allow_legacy=True`모호한 발견 결과로 실패하고 절대 받지 않습니다`initialize`- 그래

허가자 는 탐사를 할 수 있는 권한을 부여합니다. 시대를 선택하지 않습니다. 클라이언트는 하나를 보내죠.`initialize`운송에 의해 강제된 기간에 따라 다음의 모든 것을 요구합니다:

- JSON-RPC`2.0`대응 요청 ID를 입력하여 응답
- 정확히 한 명`result`그리고 아니`error`
- a`protocolVersion`클라이언트의 구성된 상속 수정 세트에서
- 객체 값`capabilities`필드
- a`serverInfo`빈 문자열이 없는 객체`name`그리고`version`필드

타임아웃, 연결 종료, 오류 응답, 잘못된 결과, 일치하지 않는 아이디 또는 지원되지 않는 수정이 종료되지 않습니다. 구조적으로 유효한 긍정적 결과만 유래시대를 선택합니다. 코드는 통과합니다`legacy_probe_timeout_ms`실제 STDIO 또는 HTTP 어댑터는 그 기간을 기록하기 보다는 반드시 시행해야 합니다.

이동동력으로 선택한 시기를 캐시로 저장하고 모든 통화 전에 다시 검색하지 마십시오.

### 레거시 는 호환성 분야

한정된 탐사선이 유효한 긍정적 인 유래 증거를 반환하면 클라이언트는 해당 수정에서 정의된 바와 정확히 선택한 유래 버전을 사용합니다:

1. 응답 봉투와 상관관계 ID를 확인한다.
2. 협상된 수정이 구성된 상속 세트 안에 있는지 확인합니다.
3. 검증된 기능과 서버 아이덴티티를 기록한다.
4. 보내`notifications/initialized`모든 체크가 통과된 후에야
5. 이 운송 기간에 기존 요청 형태를 사용하십시오.

이 분지는 알려진 동료들과 상호 운용성을 위해 존재한다. 새로운 서버나 새로운 요청에 대한 기본 설계가 아닙니다. 운송이 다시 시작되거나 최종점이 변경되면, 동료 시대의 캐시를 버리고 다시 협상하십시오.

### 발견 및 캐시 도구

활동하는 모든 동료에게 전화하십시오.`tools/list`. 현대적인 결과에는`resultType``ttlMs`그리고`cacheScope`. 정해진 허가 상황 내에서 신선함을 알려주는 것을 존중합니다. 만료 후 다시 가져오거나 가입된 목록 변경 이벤트를

고객들은 실종자를 치료해야 합니다`resultType`기존 서버에서`"complete"`. 이전 협상 시대의 응답에 대해 현대적인 캐시 필드를 요구하지 않습니다.

서버는 결정적인 순서를 반환해야 합니다. 클라이언트는 또한 통합 전에 순서를 정렬해야 합니다. 따라서 로컬 레지스트리 순서는 프로세스 시작 시점에 의존하지 않습니다.

### 충돌 안전 이름 공간 통합

두 개의 서버 모두 노출될 수 있습니다`search`. 선언된 정책을 선택:

1. **Prefix on collision.**첫 번째 정통적 이름을 유지하고 나중에 충돌을 노출합니다`<server>/<tool>`- 그래
2. **Reject on collision.**복제물을 로드하지 말고 명확한 구성 오류를 발생시키십시오.
3. **Silent overwrite.**이 모형을 사용하지 마세요. 어떤 서버가 모형으로 선택된 동작을 받는지 숨깁니다.

카논리 이름과 지역 이름 모두 저장합니다. 모델은 카논리 이름을 볼 수 있습니다.`tools/call`소유자 서버가 선언한 로컬 이름을 사용합니다.

### 전화로 이동

로우팅은 순수한 검색입니다.

```text
canonical tool name
  -> peer name + local tool name
  -> new JSON-RPC request id
  -> modern request metadata or explicit legacy shape
  -> matching response id
```

소유자 운송이 사용할 수 없는 상태에서 전화를 보내지 마십시오. 운송을 다시 연결하거나 다시 시작하여 다시 발견을 실행하고`tools/list`. 고장된 운송에 의해 손실된 현대 항공 요청은 작전 안전 정책이 허용하는 경우에 새로운 JSON-RPC ID로 다시 시도할 수 있습니다.

### 통지 및 가입

현대적인 목록 및 리소스 변경은 클라이언트 오픈에서만 발생합니다 `subscriptions/listen`클라이언트는 알림 필터를 보내서 기다립니다`notifications/subscriptions/acknowledged`, 그리고 알림 메타데이터에서 청취 요청 ID와 관련된 사건들을 상관관계합니다.

연결을 끊으면 새로운 청취 요청을 열고 관련 목록이나 리소스를 다시 연결합니다.`Last-Event-ID`- 그래

### 서버에서 시작된 요청이 없습니다

현대 서버는 샘플링, 발원 또는 루트 요청에 대해 독립적인 JSON-RPC 요청을 클라이언트에 호출하지 않습니다. 그들은 반환합니다.`input_required`, 그리고 클라이언트는 임베디드 입력 요청들을 충족한 후 원래 요청을 다시 시도합니다.

입력 입력을 수행하는 동안 동료 응답 리더를 차단하지 마십시오. 상관관계를 유지하고 다시 시도하기 위해 새로운 JSON-RPC ID를 생성하십시오.

```figure
tp-client-merge
```

## 사용 하 고

`code/main.py`프로세스 내의 피어 기능을 사용하므로 프로토콜 결정은 눈에 띄게 유지됩니다. 그것은 두 개의 현대 피어와 의도적으로 허용 된 레거시 피어와 연결하고, 그 다음 그들의 도구를 통합하고 라우팅합니다. 운송 호출자는 타임스아웃 예산을 받으므로 호환성 분사가 무제한 탐사를 숨길 수 없습니다.

```bash
cd code
python3 main.py
python3 -m unittest discover tests -v
```

테스트는 정상적인 데모가 놓친 경계를 증명합니다.

- 현대 요청은 메타데이터를 반복합니다.
- `-32022`초기화 없이 현대적인 발견을 다시 시도합니다.
- 인정된 현대 오류는 허용된 동료에게도 결코 낮춰지지 않습니다.
- 시간 종료, 연결 종료, 빈 응답 및 인식되지 않은 오류가 발생하지 않습니다 `initialize`허가자가 없는
- 등록된 동료가 유효하고 지원된 후만 유산을 받게 됩니다`initialize`결과
- 잘못된 형태와 지원되지 않은 유서적 결과는 동료가 사용할 수 없게 합니다.
- 성공적으로 선택된 시대는 운송 수명 기간에 저장됩니다.

## 선박

이 수업은 니다`outputs/skill-mcp-client-harness.md`. 그것은 현대 요청 스탬핑, 스튜디오 시대 협상, 결정적 명칭 공간 통합, 라우팅, 그리고 실패로 닫힌 유래 호환성 분자를 구축합니다.

## 운동

1. 가짜 서버를 돌려보내는 것`-32022`상호 지원되는 버전이 없습니다. 클라이언트가 전송하는 대신 실패를 확인합니다`initialize`- 그래
2. 가짜 레거시 서버를 허용하고, 제한합니다.`initialize`시간 탐사를 해내고, 동료가 남아있는 것을 증명하십시오.`unknown`그리고 가용이 없습니다.
3. 추가`cacheScope: "private"`두 개의 권한 컨텍스트에 대한 도구 목록. 클라이언트가 한 컨텍스트의 캐시 된 결과를 다른 컨텍스트와 공유하지 않는다는 것을 확인합니다.
4. 충돌 정책을 거부로 변경하고 오류에 두 개의 동급 이름을 사용하여 시작 실패를 만듭니다.
5. 한계 `subscriptions/listen`시뮬레이터. 스트림 손실에, 새로운 요청 아이디와 재개시 도구로 다시 듣습니다.

## 주요 용어

| Term | Meaning |
|------|---------|
| Peer | Client-side record for one server transport and its discovered data |
| Protocol era | Modern per-request metadata or legacy initialization semantics |
| Discovery probe | Initial `server/discover` used to identify the stdio era |
| Recognized modern error | Error that proves modern behavior and forbids legacy fallback |
| Legacy allowlist | Operator configuration permitting one bounded compatibility probe for a pinned peer |
| Positive legacy evidence | Valid, correlated `initialize` result for an explicitly supported legacy revision |
| Merged namespace | Canonical tool names across all active peers |
| Collision policy | Prefix or reject rule for duplicate tool names |
| Era cache | Selected modern or legacy behavior stored for one transport peer |
| Transport recovery | Restart or reconnect, rediscover, relist, and retry safely with a new id |

## 더 많은 읽기

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
