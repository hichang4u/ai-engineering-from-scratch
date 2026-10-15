# MCP 보안: 유독된 메타데이터, 라우팅 및 MRTR 상태

> 국적 없는 것은 신뢰를 잃는 것을 의미하지는 않습니다. 그것은 모든 요청이 서버와 게이트웨이가 독립적으로 호출을 검증하는 데 필요한 증거를 노출시키는 것을 의미합니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~60 minutes

## 학습 목표

- 도구 설명, 해설, 클라이언트 정보 및 서버 정보에 대한 신뢰도가 없는 데이터로 취급하십시오.
- 메타데이터 중독, 디스크립터 변경 및 크로스 서버 이름 충돌을 감지합니다.
- 2026-07-28 요청 메타데이터 및 스트리메이블 HTTP 라우팅 헤더를 검증합니다.
- MRTR를 보호하라`requestState`조작과 확증을 정확한 주장에 묶는 것을 방지합니다.
- 허가 및 비율 제한을 원주인에게 적용하고, 제거된 프로토콜 세션이 아닙니다.

## 문제

모델은 어떤 도구에 대해 설명해 어떤 것을 호출해야 하는지 결정하기 위해 도구 설명을 읽습니다. 라우터는 어떤 요청을 보내야 하는지 결정하기 위해 도구 이름을 읽습니다. 사용자가 어떤 것을 승인해야 하는지 결정하기 위해 레이블을 읽습니다. 한 악성 설명기는 세 가지 모두를 대상으로 할 수 있습니다.

공식 MCP 보안 지침은 직접적입니다. 설명 및 해석은 신뢰할 수있는 서버에서 왔을 경우를 제외하고 신뢰할 수 없는 것으로 간주해야합니다. 그런 경우에도 배포 신뢰는 변경 될 수 있습니다. 서버 업데이트, 손상된 패키지, 레지스트리 오류 또는 게이트웨이 통합은 모델이 보는 것을 변경 할 수 있습니다.

현재 프로토콜은 보안 경계를 변경합니다. 2026-07-28에는 핵심 손잡이 및 운송 세션이 없습니다. 승인, 요금 제한 또는 감사 역사를 확인하는 보안 설계는`Mcp-Session-Id`현재 디자인이 아닙니다.

## 개념

### 7개의 공격 표면이 확인할 가치가 있습니다.

조심하기 위해 모호한 지침 대신 구체적인 목록을 사용하십시오.

1. **Metadata poisoning.**설명은 선언된 도구 행동과 관련이 없는 지침을 포함합니다.
2. **Descriptor rug pull.**이전에 승인된 이름, 설명, 스케마 또는 해설 변경
3. **Cross-server shadowing.**두 개의 백엔드는 동일한 자격 없는 도구 이름을 노출하고 라우팅은 침묵으로 하나를 선택합니다.
4. **Header and body confusion.** `Mcp-Method`또는`Mcp-Name`JSON-RPC 요청에 동의하지 않습니다.
5. **Capability escalation.**피어 (peer) 는 확장자 또는 클라이언트 기능을 주장하고 서버는 해당 선언을 허가를 위해 잘못합니다.
6. **MRTR state tampering.**클라이언트가 바뀌는 것`requestState`다른 질문에 답하거나 다른 주장으로 확인을 재사용합니다.
7. **Supply-chain identity confusion.**익숙한 디스플레이 이름은 출판사 또는 서버의 정체성을 증명하는 것으로 취급됩니다.

이 표면은 겹치다. 해시 핀링은 설명자 변경에 도움이 되지만 첫 번째 설명자가 안전하다는 것을 증명하지는 않습니다. 정적 스캔은 명백한 문장을 잡지만 미묘한 지침을 잡지 않습니다. 이름 공간은 충돌 클래스를 방지하지만 악성 이름 공간 서버는 아닙니다. 제어 장치를 쌓아두십시오.

### 현재 요청 봉투는 증거가 아니라 신분입니다

2026-07-28의 모든 요청에는 다음과 같은 내용이 포함되어 있습니다.

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "elicitation": {"form": {}}
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "security-lab",
      "version": "1.0.0"
    }
  }
}
```

각 요청에 대한 버전 및 기능 형태를 확인하세요. 호환 가능한 응답 형태를 선택할 수 있는 기능을 사용하세요. 사용하지 마십시오 `clientInfo`인증된 원주인으로서 자신고합니다.

같은 경고는 `io.modelcontextprotocol/serverInfo`이 자료는 로그 및 디버깅에 유용합니다. 그것은 인증서, 레지스트리 증명서 또는 허가 결정이 아닙니다.

### 정책 이전에 라우팅을 유효화

`tools/call`, 스트리밍 HTTP에는 다음과 같은 내용이 포함됩니다.

```text
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.export
```

헤더 메소드는 카디스 메소드와 같아야 합니다. 헤더 이름은 같아야 합니다.`params.name`- 동의하지 않는 것을 거부합니다`-32020`백엔드를 선택하거나 RBAC를 적용하거나 금리 제한 토큰을 소비하기 전에

이 순서는 일반적인 모호함을 닫습니다. 한 구성 요소는 신체를 승인하고 다른 구성 요소는 헤더로 이동합니다.

와이어 검증은 정확한 순서대로 수행됩니다. JSON-RPC 및 메타데이터 유형을 검증하고 헤더 값을 몸과 비교하고, 일치하는 버전이 지원되는지 확인하십시오. 일치하지 않는 헤더는 HTTP 400을 반환합니다.`-32020`. 헤더와 인체가 지원되지 않는 버전을 동의하면 HTTP 400을 `-32022`그리고`data`정확히`{"supported":["2026-07-28"],"requested":"<actual>"}`. 알려지지 않은 방법은 HTTP 404을 반환합니다`-32601`- 그래

모든 오류 객체는 선택적 `data`계약에 구조화된 복구 정보가 필요한 경우`id`, 그래서 JSON-RPC 성공 또는 오류 응답을 결코 수신하지 않습니다. 받아들여진 HTTP 알림은 빈 몸으로 202을 반환합니다.

### 전체 디스크립터를 꽂아

설명 해시만으로는 스케마 및 해석 변경이 생략됩니다. 사용자가 승인한 설명자 필드를 카노니컬화하고 해시합니다.

```python
normalized = json.dumps(tool, sort_keys=True, separators=(",", ":"))
digest = hashlib.sha256(normalized.encode()).hexdigest()
```

소화기 를 기 있는 열쇠 아래 보관`notes.export`, 출판사 증거와 승인 시간을 함께 이 장난감 예제 밖

모든 리프레쉬에

- 알려지지 않은 열쇠: 검열까지 격리
- 같은 키, 다른 소화: 재 승인까지 카펫 으로 격리
- 복제된 자격 없는 이름: 결정적인 이름 공간을 요구합니다.
- 스캐너 타격: 전체 디스크립터를 차단하고 검토하십시오.

해시 평등은 안정성을 증명하고 안전성을 증명하지 않습니다. 독성 설명기는 완벽하게 고정되면 독이 남아 있습니다.

### 정적 스캔은 트립 와이어입니다

간단한 패턴은 역할 태그, 명령어 오버라이드, 기밀 접근, 비밀 네트워크 목적지 등등을 표시할 수 있습니다. 설치 시간 및 CI에 대해 충분히 저렴합니다.

그들은 의미적 증거가 아닙니다. 안전한 설명은 합법적인 경고에 표시된 문장을 포함할 수 있습니다. 악성적인 설명은 모든 문장을 피할 수 있습니다. 스캐너 출력을 검토 증거로 간주하십시오. 자동 무죄 점수가 아닙니다.

### 합병 전에 이름 공간

두 개의 서버가 모두 노출된다고 가정해보자`search`절대 발견 명령이 누가 승리하는지 결정하지 말아요

```text
notes.search
issues.search
```

자격적 이름은 공개 게이트웨이 이름입니다. 백엔드 지도를 별도로 기록합니다. 안정적인 이름은 승인, 감사, 해시 핀, 그리고`Mcp-Name`라우팅은 동일한 객체를 가리킨다.

### 능력은 호환성 선언입니다

요청에 따라`clientCapabilities`서버에 클라이언트가 처리할 수 있는 프로토콜 기능들을 알려줍니다.

승인은 여전히 인증된 원자 및 자원 정책에서 나온다.

1. 운송 자격증을 확인합니다.
2. 버전, 헤더 및 요청 형태를 확인합니다.
3. 기능 호환성을 확인해
4. 원본, 도구, 자원 및 주장을 승인하십시오.
5. 사용자 입력을 실행하거나 요청합니다.

### 국가 없는 MRTR 확인을 보호

결과적으로 발생하는 도구는 사용자 확인이 필요할 수 있습니다. 현재 MCP는 서버에서 클라이언트로 다시 호출하는 대신 다중 순환 요청을 사용합니다.

첫 번째 반응:

```json
{
  "resultType": "input_required",
  "inputRequests": {
    "confirm": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Export notes to archive?",
        "requestedSchema": {
          "type": "object",
          "properties": {
            "confirm": {"type": "boolean"}
          },
          "required": ["confirm"]
        }
      }
    }
  },
  "requestState": "opaque-integrity-protected-value"
}
```

클라이언트는 입력 정보를 얻고 새로운 JSON-RPC ID로 원래 방법을 다시 시도합니다.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes.export",
    "arguments": {"query": "private", "destination": "archive"},
    "requestState": "opaque-integrity-protected-value",
    "inputResponses": {
      "confirm": {
        "action": "accept",
        "content": {"confirm": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

각각`inputRequests`값은 `method`그리고`params`. 그 키는 해당 항목에 해당하는`inputResponses`. 양식 발현은 객체 뿌리를 사용합니다`requestedSchema`, 그리고 클라이언트는 서버가 요청하기 전에 양식 발굴 기능을 선언해야 합니다.

현재 용량은 유효한 양식 선언 2개 있습니다. `{"elicitation":{}}`함부로 형태의 발원을 지원하고,`{"elicitation":{"form":{}}}`URL만 표시하는 선언문`{"elicitation":{"url":{}}}`양식 요청을 지원하지 않습니다. 서버는 HTTP 400을 `-32021`그리고`data.requiredCapabilities``{"elicitation":{"form":{}}}`- 그래

치료`requestState`적대적 입력으로 서명하거나 암호화하여 확인하고, 방법, 도구, 정확한 주장, 목적, 만료, 원본 및 재연하는 경우에 한 번의 비언에 묶어줍니다. 수업 코드는 HMAC와 정확한 주장 일치를 사용하여 경계를 가시하게합니다.

비전성 대책서는 하나의 게이트웨이 객체 안에 살 수 없습니다. 실행 가능한 모델은 여러 게이트웨이 인스턴스에 의해 공유될 수 있는 제한된, TTL- 절단된 재생 저장소를 주입합니다. 이 원자 주장은 실행 경계가 있습니다. 유효한 수용 또는 명시적인 터미널 감소만이 상태를 소비합니다. 잘못된 반응 또는 `cancel`생산 함대에는 공유된 내구성 저장소에 동일한 조건적 요구 사항이 필요합니다.

프로토콜 세션에서 숨겨진 확인 컨텍스트를 저장하지 마십시오. 모든 서버 인스턴스는 재시험을 검증할 수 있어야 합니다.

### 위험 높은 통화에 대한 두 번째 규칙

3개의 축을 따라 호출을 분류한다.

- 신뢰하지 않는 입력들을 소비합니다.
- 민감한 데이터에 접근할 수 있습니다.
- 그 결과 외부의 작용이 발생한다.

하나의 자동 단계는 세 가지를 모두 결합해서는 안 됩니다. 분할하거나 특권을 줄이거나 MRTR를 통해 명시적인 사용자 입력 요청합니다. 이것은 프로토콜 기능이 아닌 디자인 유리스틱입니다.

### 집행 전에 권한을 줄이는 것

국적 없는 상태는 안전성만이 아닙니다. 숨겨진 프로토콜 역사를 제거하지만, 자립적인 요청은 여전히 압도적인 처리자에게 데이터를 유출하거나 돌이킬 수 없는 변화를 요청할 수 있습니다. 안전은 각 경계에 대한 권한을 줄이는 것입니다.

1. **Typed verb.**한 가지 제한된 동작을 표시합니다.`archive_note`일반제 아니죠`run`또는`request`무관한 권한을 표현할 수 있는 도구입니다.
2. **Validated arguments.**실무적인 폐쇄적인 스케마를 사용하여, 알려지지 않은 필드를 거부하고, 식별자를 한 번 정상화하고, 캡 크기를 확인하고, 정책 평가 전에 목적지, 임차자 및 자원 소유권을 확인합니다.
3. **Current authorization.**인증된 원본을 정확한 동사, 자원, 환경 및 정상화 된 주장에 연결하십시오. 도구 해설 및 클라이언트 기능이 이러한 권한을 부여하지 않습니다.
4. **Action-bound approval.**결과적 호출을 위해 입력된 동사 및 정상화 된 주장, 그리고 원본, 만료 및 일회정책의 소재에 승인을 묶어주세요. 변경된 필드는 새로운 결정을 필요로 합니다.
5. **First-class refusal.**모델 거부, 만료된 승인, 사용자 감소, 안전하지 않은 목적지 등은 아무런 부작용도 없는 일반적인 결과로 간주됩니다. 거부를 더 약한 탈퇴 도구로 변환하지 마십시오.
6. **Redacted audit evidence.**누가 물어봤는지, 어떤 설명서와 정책 버전이 사용되었는지, 어떤 정상화된 목표가 승인되었는지, 결정이 왜 허용되었는지 거부되었는지, 실행이 시작되었는지 기록하십시오. 비밀 대신 소화 또는 편집 된 값을 저장하십시오.

각 단계는 다음 구성 요소가 할 수 있는 작업을 좁혀줍니다. 최종 핸들러는 이미 유효한 도메인 명령어를 수신해야 하며, 원본 모델 텍스트와 광범위한 인증서가 아닙니다. MRTR 재실험, 작업 업데이트 또는 게이트웨이 전송 호출에서 전체 연쇄를 반복하십시오. 이전 승인은 나중에 요청이 신뢰할 수있는 세션 트래픽으로 전환되지 않습니다.

### 현재와 기존의 상호작용 경로

루트, 샘플링, 로깅은 새로운 2026-07-28 구현에 비용된다. 게이트웨이는 버전 게이트 호환성 경로로서만 오래된 요청 채널 코드를 유지할 수 있습니다.

세션 당 샘플링 제한기를 중심으로 새로운 방어 장치를 구축하지 마십시오. 인증 된 원자, 발행자, 자원, 도구 및 시간 창에 비중을 적용하십시오. 현재 상호 작용 작업에 대해 MRTR 입력 요청 및 응답을 검사하십시오.

### 국적 없는 교통 검사

- 단일 POST 엔드포인트에서 현대 MCP 메시지를 받아보세요.
- 405를 현대적인 GET와 DELETE로 돌려보냅니다.
- 을 만들거나 의존하지 마십시오`Mcp-Session-Id`- 그래
- 기존 세션을 무시하고 권한 입력으로 헤더를 재생하십시오.
- 해당 POST에 대한 JSON 또는 요청 스코프 된 SSE를 반환하십시오.
- 사용`subscriptions/listen`오직 선택된 장기적인 변경 알림에 대해서만.

```figure
tp-tool-poisoning
```

## 건설 해

`code/main.py`프로세스 내 작은 보안 게이트웨이 모델을 구현합니다. 그것은 전체 도구 설명서를 카노니화하고 핀, 메타 데이터 중독과 그림자를 보고, 현대 요청 봉투 및 라우팅 값을 검증하고, 서명된 2 라운드 확인된 수출을 수행합니다 `requestState`그리고 주입된 공유 재생 스토어

모델은 HTTP 어댑터가 JSON 몸체와 라우팅 헤더를 분석한 후 시작됩니다.`Content-Type`또는`Accept`. 같은 디스퍼를 레슨 09의 전체 스트리메이블 HTTP 어댑터에 연결하여,`Content-Type: application/json`그리고`Accept`두 가지 모두 포함된 값`application/json`그리고`text/event-stream`- 그래

실행하세요:

```bash
cd phases/13-tools-and-protocols/15-mcp-security-tool-poisoning
python3 code/main.py
python3 -m unittest discover code/tests -v
```

샘플은 의도적으로 디스크리퍼를 돌연변이시킵니다. 스캐너와 소화 비교는 독립적인 결과를 만들어냅니다.`input_required`국가 없는 응답과 재시행

## 사용 하 고

대체`SAFE_TOOLS`본인이 승인한 서버에서 정상화된 스냅샷을 가지고 있습니다. 스냅샷에서 인증서와 비밀을 유지하세요. 디저트를 업데이트하기 전에 새로운 또는 변경된 디스크립터를 모두 검토하세요.

게이트웨이에서는 발견과 배포 전에 동일한 검사를 실행하십시오. 캐시는 발견 작업을 줄일 수 있지만 캐시 승인은 디스커퍼 변경되면 만료되거나 무효화되어야 합니다.

## 선박

이 수업은 니다`outputs/skill-mcp-threat-model.md`. 메타데이터, 라우팅, 용량, 권한, MRTR, 캐싱, 레지스트리 및 호환성 경계를 가로지르는 현재 프로토콜 위협 모델을 생성합니다.

## 운동

1. 인증된 원자 및 현재 허가 결정을 봉인된 MRTR 국가에 묶어 다른 원자 아래 재시험을 거부합니다.
2. 내 메모리의 재생 저장소를 영구적인 조건부 삽입으로 교체하고 두 프로세스가 둘 다 하나의 비소스를 주장할 수 없다는 것을 증명하십시오.
3. 재중화 청구 후 실패를 주입하지만 시뮬레이션 수출 전에 복구 안전성을 보장하는 거래 또는 무력 규칙을 정의하고 테스트하십시오.
4. 도구 를 바꾸십시오`inputSchema`설명이 바뀌지 않고 전체 설명기 꽂아주는 것이 잡힌다는 것을 확인해 주세요.
5. 공개 캐싱을 거부하는 정책을 추가합니다`tools/list`원장마다 차이가 있습니다.
6. 게이트웨이 뒤에 오래된 서버를 모델링하고 모든 손잡이와 세션 행동을 명시적인`2025-11-25`호환성 분야

## 주요 용어

| Term | Meaning |
|------|---------|
| Metadata poisoning | Instructions or deceptive claims embedded in a tool descriptor |
| Rug pull | Change to a previously approved descriptor |
| Tool shadowing | Ambiguous routing caused by duplicate unqualified names |
| Header mismatch | Routing header and JSON-RPC body disagreement, error `-32020` |
| Hash pin | Digest of the complete approved descriptor |
| MRTR | Stateless response and retry pattern for server-requested input |
| `requestState` | Opaque round-trip value that must be treated as untrusted input |
| Capability declaration | Statement of protocol compatibility, not authorization |
| Implicit form support | An empty `elicitation` capability object, equivalent to form support |
| Qualified tool name | Stable gateway name such as `notes.search` |

## 더 많은 읽기

- [MCP security and trust guidance](https://modelcontextprotocol.io/specification/2026-07-28#security-and-trust--safety)
- [Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [Deprecated features](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
