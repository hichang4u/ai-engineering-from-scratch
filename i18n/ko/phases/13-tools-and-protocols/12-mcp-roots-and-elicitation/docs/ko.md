# 명시적 범위 및 국적 없는 자격증

> 루트들은 MCP 2026-07-28에서 구제되어 있으며 보안 샌드박스도 되지 않았습니다. 가시적인 도구 주장이나 리소스 URI에 범위를 넣고 서버에 권한을 부여하고 도구가 사용자 입력이 진정으로 필요할 때 MRTR를 사용하십시오. 사용자가 결정을 볼 수 있고 모델은 핸들을 볼 수 있으며 서버 인스턴스는 재실험을 처리 할 수 있습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 11 (stateless MRTR)
**Time:** ~60 minutes

## 학습 목표

- 구약된 Roots를 명시적인 작업 공간 매개 변수, 리소스 URI 또는 서버 구성으로 교체하십시오.
- 허가, 경로 억제, 운영체제 샌드박스에서 다른 범위 지적이 있습니다.
- 양식 전달 방식`elicitation/create`MRTR를 통해`input_required`그 결과
- 요청에 따라 클라이언트 기능에 유추 지원을 광고하고 지원되지 않은 모드를 거부합니다.
- 유효성`accept``decline`그리고`cancel`그 결과로
- 파괴적인 확인을 인증된 원자, 원자 주장, 후보 세트, 만료에 연결합니다.

## 비슷한 두 가지 문제

메모 도구는 다음과 같은 요청을 받습니다. "옛 TPS 보고서를 삭제하십시오".

서버는 두 가지 질문에 답해야 합니다.

1. 이 작업은 어떤 작업 공간을 만질 수 있을까요?
2. 사용자께서 말한 3개의 일치하는 노트 중 어느 쪽이?

첫 번째는 범위와 권한입니다. 두 번째는 상호작용적 불분명성입니다. 그것들을 혼합하면 위험한 디자인이 발생합니다. 예를 들어 클라이언트가 제공하는 폴더를 호출자가 그 안에 있는 모든 것을 삭제할 수 있다는 증거로 취급합니다.

## 뿌리 는 이주 의 표면 이

이전 MCP 개정에서는 클라이언트가 Roots를 광고하고 목록이 변경되면 서버에 알리는 것을 허용했습니다. Roots는 정보 지침이었습니다. 그들은 서버 프로세스가 읽을 수 있는 것을 제한하지 않았고, 호출자에게 권한을 부여하지 않았고 운영 체제 샌드박스를 만들지 않았습니다.

MCP 2026-07-28의 폐지`roots/list`그리고`notifications/roots/list_changed`새로운 디자인에 대해:

- A`workspaceUri`또는`directory`전화로 범위가 달라질 때 도구 논쟁
- 리소스를 대상으로 한 작업이 이미 진행될 때 리소스를 대상으로 한 URI
- 하나의 배포가 하나의 고정된 작업 공간을 소유할 때 서버 구성
- 프로세스 샌드박스 또는 포로 파일 시스템, 코드에서 기술적으로 탈출할 수 없는 경우

만약 기존의 2026-07-28 통합이 여전히 필요하다면`roots/list`미분방정 창의 동안 서버는 MRTR에 삽입합니다 `inputRequests`. 그것은 실시간 반전 요청을 보내지 않아야 합니다. 그것은 마이그레이션 어댑터입니다. 새로운 처리자는 그 대신 명시적인 범위를 받아들여야 합니다.

모델은 명시적인 핸들을 볼 수 있고 반복할 수 있습니다. 숨겨진 운송 세션 범위는 검사, 재생, 감사 및 경로를 더 어렵게 합니다.

### 3층 규칙

명시적인 URI는 여전히 자원을 부여하지 않습니다. 세 가지 계층을 모두 적용하십시오.

1. **Authorization:**이 인증된 원장은 이 작업 공간을 사용할 수 있나요?
2. **Containment:**정상화된 목표 URI가 승인된 작업 공간 경계 내에서 유지되는가?
3. **Sandbox:**운영체제는 손상된 서버가 탈출하는 것을 막을 수 있을까요?

실행 가능한 서버는 승인된 작업 공간 URI의 허용 목록을 유지하며, %로 암호화된 경로를 정상화하고, 실제 경로 구성 요소 경계를 확인하고, 삭제 직전 재검토를 합니다.

순진한 문자열 전자 확인은 잘못되었습니다.

```text
allowed:   file:///work/notes
attacker:  file:///work/notes-evil/secret.md
traversal: file:///work/notes/%2e%2e/private.md
```

두 가지 적대적인 경로는 오해의 끈으로 시작됩니다. 먼저 경로 구성 요소를 정상화하고 비교하십시오. 생산 파일 시스템 서버는 또한 상징적 링크 경주와 플랫폼 특정 경로 의미론에 맞서 방어해야합니다.

## 발급 의 경우 아직 존재 하지만 전달 의 경우 변경 되었습니다

유리케팅은 `tools/call``prompts/get`또는`resources/read`. 방법 이름은 남아 있습니다 `elicitation/create`변한 것은 전선의 흐름 방향입니다.

2026-07-28 서버는 역 JSON-RPC 요청을 보내지 않습니다.`InputRequiredResult`이 부분의 본문은

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "delete_choice": {
        "method": "elicitation/create",
        "params": {
          "mode": "form",
          "message": "Choose one matching note and confirm deletion.",
          "requestedSchema": {
            "type": "object",
            "properties": {
              "note_id": {
                "type": "string",
                "enum": ["note-3", "note-7", "note-14"]
              },
              "confirm": {"type": "boolean"}
            },
            "required": ["note_id", "confirm"]
          }
        }
      }
    },
    "requestState": "integrity-protected-delete-state"
  }
}
```

호스트는 양식을 렌더링합니다. 사용자는 이를 받아들이거나 명시적으로 거부하거나 거부할 수 있습니다. 클라이언트는 원래 양식을 다시 시도합니다.`tools/call`신기한 신기록증:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes_delete",
    "arguments": {
      "workspaceUri": "file:///Users/alice/Documents/Notes",
      "title": "TPS report"
    },
    "inputResponses": {
      "delete_choice": {
        "action": "accept",
        "content": {"note_id": "note-14", "confirm": true}
      }
    },
    "requestState": "integrity-protected-delete-state",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

두 호출 사이에 프로토콜 세션이 없습니다. 서버는 반사 상태를 확인하고, 예상된 스케마에 대한 응답을 검증하고, 선택한 메모가 서명된 후보 세트에 있는지 확인하고, 작업 공간을 다시 승인하고, 재검토 함유 사항을 확인하고, 삭제합니다.

## 능력 협상 은 요청 에 따라

양식 모드 발굴을 지원하는 클라이언트는 다음과 같이 선언합니다.

```json
{
  "io.modelcontextprotocol/clientCapabilities": {
    "elicitation": {"form": {}}
  }
}
```

빈 발현 능력`"elicitation": {}`,는 형태만 통일성 지원과 동등하다.`"elicitation": {"form": {}}`또한 양식 모드를 지원합니다. URL만 표시하는 선언,`"elicitation": {"url": {}}`서버는 기존 요청에서 광고를 한 경우에도, 현재 요청의 기능에 없는 모드를 임베디드해서는 안 됩니다.

모든 요청에는 또한 `io.modelcontextprotocol/protocolVersion`. 실종되거나 문자열이 없는 버전이 반환됩니다 `-32602`. 지원되지 않은 문자열이 반환됩니다`-32022`정확히`supported`그리고`requested`데이터: 실종 또는 URL만으로 검색 지원이 반환됩니다 `-32021``data.requiredCapabilities` 설정`{"elicitation":{"form":{}}}`- 그래

JSON-RPC 없이 한 봉투`id`스트리메이블 HTTP에서는 승인된 알림이 수신됩니다.`202 Accepted`시체가 없는

`clientInfo`진단에 포함되어야 하지만 자기보고되어 사용자를 식별할 수 없습니다.

서버에서 구현`server/discover`그리고 수익`supportedVersions`, 능력,`ttlMs`그리고`cacheScope``resultType: "complete"`.이 현대 디자인에 대한 뿌리를 광고하지 않습니다. 도구들을 광고하기 때문에 의무적인 것을 구현합니다.`tools/list`그 결과 결정적인 결과를 반환합니다`notes_delete`설명기, 유효한 객체`inputSchema`, 서버 아이덴티티 메타데이터, 공개 캐시 힌트

## 양식 모드

양식 모드는 사용 가능한 대화 대화에 설계된 제한된 JSON 스키마를 사용합니다. 루트는 객체이며 그 속성은 평면 원시 필드 또는 지원되는 enum 배열입니다. 깊이 둥지를 틀어 놓은 객체 및 일반 용도의 문서 스키마는 확인 대화에 속하지 않습니다.

양식 모드를 사용:

- 여러 후보 중 하나를 선택하고,
- 파괴적인 작전을 확인하는 것
- 민감하지 않은 선호도를 수집하는 것
- 작은 수의 값을 수집하는 것은 모델이 아닌 사용자가 결정해야 합니다.

비밀번호, API 키, 액세스 토큰 또는 지불 자격증에 대해 양식 모드를 사용하지 마십시오. 이러한 비밀은 MCP 클라이언트를 통해 전달되며 로그 또는 모델 컨텍스트에 도달 할 수 있습니다.

서버는 반환된 콘텐츠를 다시 확인합니다. 클라이언트 측 양식 검증은 UX를 향상시키지만 신뢰를 창출하지는 않습니다.

## URL 모드

URL 모드는 외부 대역 상호 작용을 위해 안전한 웹 URL를 전송합니다.

```json
{
  "method": "elicitation/create",
  "params": {
    "mode": "url",
    "message": "Connect the report service to continue.",
    "url": "https://mcp.example.com/connect/report-service"
  }
}
```

서버 제어 된 웹 흐름, 예를 들어 제3자 권한으로 민감한 정보가 직접 이동해야 할 경우 사용하십시오. 클라이언트는 전체 목적지를 표시하고 열기 전에 동의를 얻습니다. URL를 미리 가져오지 않습니다.

 `accept`응답은 사용자가 URL를 열기로 동의한 것을 의미합니다. 외부 흐름이 완료된 것을 증명하지 않습니다. 다시 시도하면 서버가 자신의 상태를 확인하고 다른 URL를 완료하거나 반환합니다.`input_required`그 결과

URL 발음 (URL elicitation) 은 MCP 클라이언트와 MCP 서버 사이의 권한의 대상이 아닙니다. MCP 서버가 사용자의 이름으로 수행해야 하는 외부 상호 작용을 위해입니다. 서버는 MCP 동작을 시작한 동일한 인증된 원본으로 브라우저 사용자에게 연결해야합니다.

## 응답 분파

행동들을 제품 결정으로 취급하고, 별명으로 하지 않는다.

| Action | Meaning | Safe server behavior |
|--------|---------|----------------------|
| `accept` | User submitted the interaction | Validate content and continue |
| `decline` | User explicitly refused | Return a complete, non-error refusal outcome |
| `cancel` | User dismissed or could not finish | Stop safely and allow a later retry |

절대 결여된 내용을 동의로 해석하지 말며, 절대 거절을 반복되는 순환으로 변환하지 말아라.

## 파괴적인 MRTR 상태를 보호하는 것

후보 목록은 프롬프트 또는 서명되지 않은 Base64 값에서만 존재할 수 없습니다. 클라이언트는 전송하는 모든 것을 제어합니다.

수업은 다음과 같은 국가용용 부하를 서명합니다.

- 인증된 원자재
- 출산 방법
- 소화`workspaceUri`그리고`title`
- 양식에 표시된 허용된 노트 아이디;
- 운용 단계
- 짧은 기간 만료

돌연변이 전에 서버는 라이브 메모 기록을 확인합니다. 이것은 삭제 경주와 양식이 표시된 후 작업 공간 밖으로 이동한 목표를 잡습니다.

단번에 한 번이나 돌이킬 수 없는 금융 행위에 대해서는 HMAC만으로는 유효 상태가 만료되는 기간 내에 재현되는 것을 막지 않습니다. 모든 처리 인스턴스가 공유하는 재생 저장소에서 정확히 한 번 저장하고 소비하십시오. 수업은 TTL로 절단된 제한된 저장소를 주입하고 메모리 삭제 작업을 수행하는 동안 원자 claim을 유지합니다. 생산 데이터베이스에서는 비상소유소와 돌연변이를 한 거래 또는 동등한 조건으로 작성한 경계로 결합해야 합니다.

                     `cancel`변이가 발생하지 않고, 연장까지 재발전 가능한 상태를 남겨두고 있습니다.`decline`이 강의는 아무것도 삭제하지 않고도

```figure
t3-roots-boundary
```

## 건설 해

`code/main.py`현대적인`notes_delete`도구:

- `tools/list`필요한 작업 공간과 제목 스키마를 가진 결정적이고 캐시 가능한 설명서를 반환합니다.
- 범위는 명시적입니다`workspaceUri`논쟁
- 서버 구성은 수업 원장에게 해당 작업 공간을 허용합니다.
- URI 정상화는 사전 혼란과 암호화된 통로를 거부합니다.
- 파괴적인 삭제마다 형태 모드 발현이 필요합니다.
- 발동은 내부로 이동합니다`resultType: "input_required"`- 그래
- 서명`requestState`정확한 후보자 목록과 원본 주장을 묶습니다.
- 주입된 재생 저장소는 서버 인스턴스에서 동일한 수용 또는 거부된 상태를 거부합니다.
- 다시 시도하면 새로운 요청 ID를 사용하여 반환합니다 `resultType: "complete"`- 그래

데이터 저장소는 메모리에 위치해 있어 프로토콜 동작을 쉽게 검사할 수 있습니다. 데이터베이스의 보안 규칙은 동일합니다.

## 사용 하 고

저장소 뿌리에서:

```bash
cd phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/code
python3 main.py
python3 -m unittest discover tests -v
```

예상된 체크포인트:

- 디스커버리는 뿌리 없는 도구를 광고합니다.
- 도구 발견이 반환됩니다 `notes_delete``resultType`서버 아이덴티티와 캐시 힌트를
- 요청 ID`1``inputRequests.delete_choice`- 그래
- 요청 ID`2`서명된 상태를 반사하고 삭제를 완료합니다.
- 사전 경로와 암호화된 경로 모두 수호가 실패합니다.
- 변경된 제목은 원래 확인 상태를 재사용할 수 없습니다.
- 하락은 메모를 변하지 않습니다.
- 메모와 재생 상태를 공유하는 두 서버 객체는 둘 다 하나의 확인을 실행할 수 없습니다.
- 빈 및 명시적인 양식 선언이 작동하지만 URL만 지원하면 정확한 결과를 반환합니다 `-32021`양식 요구사항
- 지원되지 않은 버전 오류는 정확한 `-32022`데이터 형태
- ID 없는 알림은 JSON-RPC 응답을 생성하지 않습니다.

## 선박

`outputs/skill-elicitation-form-designer.md`명시적인 범위, 권한 확인, MRTR 양식, 응답 분자 및 상태 결합을 설계합니다. 구약 된 뿌리를 모래 상자처럼 취급하거나 양식 모드를 통해 비밀을 수집하는 것을 거부합니다.

## 운동

1. 내 메모리의 재생 저장소를 SQLite로 교체하십시오. 한 트랜잭션을 사용하여 nonce를 주장하고 메모를 삭제하고 두 프로세스가 둘 다 공약할 수 없다는 것을 증명하십시오.
2. 추가`url`능력 협상 및 대역 밖 설정 흐름.`inputResponses`- 그래
3. 메모리 메모 지도를 일시적인 SQLite 데이터베이스로 교체하고, 돌연변이 거래 내부의 권한과 감지를 다시 확인합니다.
4. 실제 파일 시스템 구현을 위해 상징적 링크 정책을 추가하십시오. URI 레크ಸಿಕಲ್ 컨테인먼트만으로도 증상 링크 탈출을 막을 수 없는 이유를 설명하십시오.
5. 2025-11-25 에 있는 애댑터를 설계하여 현대 MRTR 핸들러 출력을 기존 서버에서 시작된 발음으로 매핑하여 현재 핸들러로부터 분리하여 보관합니다.

## 주요 용어

| Term | Meaning in 2026-07-28 |
|------|------------------------|
| Roots | Deprecated informational workspace hints, not authorization or sandboxing |
| Explicit scope | Workspace, directory, or resource handle visible in request arguments |
| Containment | Normalized path-component check that keeps a target inside a boundary |
| Elicitation | Client feature for obtaining user input during an MCP operation |
| Form mode | In-band structured user input using a restricted flat schema |
| URL mode | Out-of-band interaction for sensitive or external workflows |
| MRTR | Stateless input-required result followed by a fresh retry |
| `requestState` | Opaque state echoed exactly and integrity-checked by the server |
| Decline | Explicit user refusal |
| Cancel | Dismissal or incomplete interaction without approval |

## 유산을 합성

2025-11-25에 고정된 동료를 위해`roots/list``notifications/roots/list_changed`, 그리고 라이브 서버에서 시작`elicitation/create`아직 존재할 수 있습니다. 어댑터 레거시를 표시하십시오. 기존 루트 리스트가 서버 권한을 우회하지 않도록 허용하지 마십시오. 그리고 프로토콜 세션 가정들을 현대적인 핸들러에 가져가지 마십시오.

## 더 많은 읽기

- [MCP 2026-07-28 Elicitation](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Roots deprecation](https://modelcontextprotocol.io/specification/2026-07-28/client/roots)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
