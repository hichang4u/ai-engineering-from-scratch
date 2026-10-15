# MCP 모델 입력: 샘플링 마이그레이션 및 무국민 MRTR

> MCP 2026-07-28은 새로운 디자인에 대한 샘플링을 비효율화하고 서버에서 클라이언트 요청 채널을 제거합니다. 기존 작업 흐름에 여전히 클라이언트의 모델이 필요한 경우 서버는 `input_required`이 경우, 클라이언트가 원본 요청을 모델 출력으로 다시 시도합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources and prompts)
**Time:** ~75 minutes

## 학습 목표

- MCP 2026-07-28에서 샘플링이 왜 비효율적인지 설명하고 새로운 서버에 대한 직접 모델 통합 기본 선택
- `sampling/createMessage`여러 차례 돌아가는 여행 요청 (MRTR) 을 통해
- 모든 요청에 프로토콜 개정 및 클라이언트 기능을 넣습니다 `_meta`객체
- 돌아와`resultType: "input_required"`그리고 새로운 JSON-RPC ID를 사용하여 원래 방법을 다시 시도합니다.
- 충성을 보호`requestState`그리고 원본, 방법, 주장, 만료에 묶어
- 형 모델 지원 루프, 능력 검사, 승인을, 응답 검증 및 라운드 한계

## 프로토콜 이전 의 결정

`summarize_repo`두 가지 종류의 작업이 필요합니다.

1. 결정론적 작업: 파일 목록을 작성, 허용된 파일을 읽어, 경로를 확인하고 내용을 집계합니다.
2. 모델 작업: 대표적인 파일을 선택하고 요약을 합성합니다.

이제 두 가지 유효한 구조가 있습니다.

### 새로운 서버: 모델 제공자와 직접 통합

현재 기본 설정입니다. 서버는 모델 선택, 자격증, 예산, 재실험 및 관찰력을 보유하고 있습니다.`tools/call`MCP 클라이언트에 대한 결과

서버가 이미 호스팅된 서비스일 때 또는 예측 가능한 모델 행동이 호스팅 모델을 사용하는 것보다 더 중요할 때 이것을 선택하십시오.

### 기존 샘플링 작업 흐름: MRTR로 마이그레이션

샘플링은 여전히 그 미완성 창 동안 존재합니다. 2026-07-28을 목표로 하는 서버는 실시간 전송을 할 수 없습니다.`sampling/createMessage`클라이언트에게 요청을 돌려주기 위해`InputRequiredResult`- 그래

이 호환성 경로를 클라이언트의 모델을 사용할 때만 선택하고 자격증은 실제 제품 요구 사항입니다. 새로운 구현이 구시된 샘플링을 채택하지 않아 제거 계획을 기록하십시오.

## 국적 없는 계약

2026년 7월의 프로토콜은`initialize`교환, 아니`notifications/initialized`, 그리고 아니`Mcp-Session-Id`모든 요청에는 그 때 손잡이에 있던 정보가 담겨 있습니다.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

서버는 모든 요청에 대한 수정 사항을 확인합니다. 실종되거나 문자열이 없는 버전은 유효하지 않은 파라미입니다.`-32602`. 지원되지 않은 문자열이 반환됩니다`-32022`정확한 자료를 가지고`{"supported":["2026-07-28"],"requested":"<client version>"}`. 샘플링 기능이 없어진 상태가 돌아옵니다`-32021``data.requiredCapabilities` 설정`{"sampling":{}}`- 그래

JSON-RPC 없이 한 봉투`id`수신기는 처리할 수 있지만, 성공 반응이나 오류 응답을 emit 하지 않습니다. Streamable HTTP 어댑터가 반환합니다.`202 Accepted`승인된 통보를 위한 기관이 없는 상태입니다.

서버 또한 구현합니다 `server/discover`정확히`supportedVersions`핵심, 능력,`ttlMs`그리고`cacheScope`클라이언트가 도구에 전화를 걸기 전에 서버 계약을 학습하고 캐쉬 할 수 있습니다. 왜냐하면 발견은 광고를`tools`, 서버 또한 의무적인`tools/list`- 결정적인`summarize_repo`설명기에는 유효한 객체가 포함됩니다 `inputSchema``resultType: "complete"`, 서버 아이덴티티 메타데이터, 공개 캐시 힌트

모든 성공적인 현대적인 결과는 차별성을 가지고 있습니다.

- `resultType: "complete"`작전이 끝났다는 뜻이죠.
- `resultType: "input_required"`즉 클라이언트가 임베디드 요청을 이행하고 다시 시도해야 합니다.
- 확장자는 추가 결과 유형을 정의할 수 있습니다. 작업 확장자는 추가합니다 `"task"`13강에서

## 한 번 MRTR 라운드

서버는 요청을 처리하는 동안 클라이언트를 호출할 수 없습니다. 대신 이 결과를 반환합니다:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "pick_files": {
        "method": "sampling/createMessage",
        "params": {
          "messages": [
            {
              "role": "user",
              "content": {
                "type": "text",
                "text": "Choose three representative files and return a JSON array."
              }
            }
          ],
          "systemPrompt": "Return only the requested value.",
          "modelPreferences": {
            "costPriority": 0.8,
            "intelligencePriority": 0.2
          },
          "maxTokens": 400
        }
      }
    },
    "requestState": "opaque-integrity-protected-value"
  }
}
```

클라이언트는 샘플링을 지원하고 승인 및 모델 정책을 적용하고 모델 응답을 얻으며 다른 JSON-RPC 아이디로 새로운 요청을 전송합니다.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "inputResponses": {
      "pick_files": {
        "role": "assistant",
        "content": {
          "type": "text",
          "text": "[\"README.md\", \"server.py\", \"docs/intro.md\"]"
        },
        "model": "host-model",
        "stopReason": "endTurn"
      }
    },
    "requestState": "opaque-integrity-protected-value",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}}
    }
  }
}
```

재시험은 프로토콜 세션의 연속이 아니라 원래의 방법과 주장을 반복하는 새로운 요청입니다.`inputResponses`, 그리고 에코`requestState`바이트에 바이트

MRTR는 오직 `tools/call``prompts/get`그리고`resources/read`서버는 돌아오지 않아야 합니다`input_required`관련 없는 방법에서

## 다순환 상태

이 수업은 두 가지 모델이 필요합니다.

1. `pick_files`JSON 배열을 반환합니다.
2. `summary`마지막 시장을 반환합니다.

각 재실험은 그 라운드에 대한 응답만을 포함합니다. 따라서 서버는 단계와 검증된 중간 데이터를 다음 라운드에 넣습니다.`requestState`- 그래

공격자가 통제하는 값으로 취급합니다. 원시 단계 이름을 서명하는 것만으로는 충분하지 않습니다. 상태를

- 자신고하지 않은 인증된 원자 `clientInfo`
- 기기 방법
- 본론의 주장의 소재
- 짧은 만료일 경우
- 현재 단계와 검증된 중간 값

HMAC를 사용 하 고 비밀 보호가 필요하지 않을 때 사용 하 고. 클라이언트가 상태를 읽지 않을 때 인증 암호를 사용 하 고. 잘못된 서명, 만료 된 값, 변경 된 원본 또는 변경 된 주장을 거부 하 고 `-32602`- 그래

고객은 분석하거나 수정할 수 없습니다`requestState`- 그 유일한 임무는 다시 시도할 때 정확한 줄을 반사하는 것입니다.

## 모델 선호 는 암시

`costPriority``speedPriority`그리고`intelligencePriority`즉, 고객들은 독립적인 선호도입니다. 그들은 확률 분포가 아니며 하나의 분포가 필요하지 않습니다. 고객들은 모델 정책을 소유하기 때문에 그들을 무시할 수 있습니다.

계속`includeContext``"none"`기존 샘플링 흐름을 유지한다면. 다른 컨텍스트 모드는 누출 위험성을 증가시키고 그 자체는 비효율적입니다. 요청에 최소한의 명시적인 컨텍스트를 통과하십시오.

## 안전성 변수

임베디드 샘플링 요청에 대한 신뢰 경계는 클라이언트입니다.

- 정책이 승인되어야 할 경우 서버가 모델을 요청하는 것을 사용자에게 보여주십시오.
- MRTR 라운드를 제한해 해로운 서버는 다른 방법으로 모델 지출 루프를 만들 수 있습니다.
- 파일 이름, URL 또는 도구 입력으로 사용하기 전에 샘플링 응답을 모두 검증하십시오.
- 라운드당 바이트와 토큰을 제한합니다.
- 현재 클라이언트 기능에 선언되지 않은 입력 요청을 거부합니다.
- 모델 출력을 허가 결정에서 제외하십시오.
- 유래 메소드 및 입력 요청 키를 민감한 프롬프트 콘텐츠를 기록하지 않고 기록하십시오.

`clientInfo`그리고`serverInfo`디스플레이 및 진단 메타데이터입니다. 어느 것도 인증된 아이덴티티로 사용하지 마십시오.

```figure
t3-sampling-flip
```

## 건설 해

`code/main.py`제3자 패키지 없이 전체 두회 흐름을 구현합니다.

- `server/discover`수익금`supportedVersions`, 도구 지원을 광고하고 캐시 팁을 반환합니다.
- `tools/list`결정적, 캐시 가능한 `summarize_repo`객체 입력 스케마를 가진 설명자
- `tools/call`요청에 따라 메타데이터를 검증합니다.
- 첫 번째 결과는 `sampling/createMessage`파일 선택에 대한
- 첫 번째 재실험은 모델 결과를 검증하고 두 번째 요청을 포함합니다.
- HMAC 보호 `requestState`독립적인 요청들 사이의 단계를 수행합니다.
- 최종 결과는 `resultType: "complete"`- 그래

가짜 호스트 모델은 예를 결정적으로 만듭니다.`fake_host_model`실제 호스트를 연결할 때 서버 측 상태 기계는 결정적이고 테스트 가능한 상태로 유지되어야 합니다.

## 사용 하 고

저장소 뿌리에서:

```bash
cd phases/13-tools-and-protocols/11-mcp-sampling/code
python3 main.py
python3 -m unittest discover tests -v
```

예상된 체크포인트:

- 디스커버리는 `ttlMs`그리고`cacheScope`- 그래
- 도구 발견은 와 같은 분류된 설명서를 반환합니다`resultType`서버 아이덴티티와 캐시 힌트를
- 실종 기능 및 지원되지 않은 버전은 정확한 사용 `-32021`그리고`-32022`오류 데이터
- ID 없는 알림은 JSON-RPC 응답을 생성하지 않습니다.
- 요청 신분번호는`[1, 2, 3]`, 각 MRTR 라운드가 독립적이라는 것을 증명합니다.
- 첫 두 가지 결과는`input_required`- 그래
- 최종 결과는`complete`선택된 파일과 요약이 포함되어 있습니다.
- 재시험에서 원래의 주장을 변경하면 요청 상태 검증이 실패합니다.

## 선박

`outputs/skill-sampling-loop-designer.md`현재 마이그레이션 계획자입니다. 먼저 샘플링이 직접 모델 통합을 위해 제거되어야하는지 여부를 결정합니다. 호환성이 필요한 경우 MRTR 라운드, 상태 결합, 능력 게이트, 예산, 검증 및 제거 계획을 생성합니다.

## 운동

1. 파일 선택 응답을 무효 JSON로 변경합니다. 서버가 반환되는 것을 확인합니다 `-32602`모델 출력을 신뢰하는 대신
2. 변화`audience`첫 번째 호출과 재 시도 사이의 기간 동안, 왜 봉쇄 상태가 반복 요청을 차단하는지 설명하십시오.
3. 세 번째 라운드를 추가하여 호스트가 요약에 비판을 요청합니다. 이전 요약을 서명 상태 안에 가져와 전체 흐름을 세 라운드로 제한합니다.
4. 가짜 호스트 호출을 서버 소유 모델 어댑터로 교체하여 샘플링을 제거하십시오. 승인, 청구 및 관찰 책임이 서버로 이동되는 사항을 목록에 나열하십시오.
5. 정해진 기간이 1초가 지나간 상태 값을 사용하여 유효기간 테스트를 추가합니다.

## 주요 용어

| Term | Meaning in 2026-07-28 |
|------|------------------------|
| Sampling | Deprecated feature that asks the client's model for a completion |
| MRTR | Stateless retry pattern for client input required during a request |
| `InputRequiredResult` | Result with `resultType: "input_required"` |
| `inputRequests` | Server-assigned map of embedded elicitation, sampling, or roots requests |
| `inputResponses` | Current round's client results keyed like `inputRequests` |
| `requestState` | Opaque server state echoed exactly by the client and verified by the server |
| `resultType` | Required discriminator for modern MCP results |
| Direct model integration | Recommended replacement for new servers that need model inference |
| Capability gate | Rule that prevents sending an embedded request the client did not advertise |
| Loop budget | Maximum rounds, tokens, bytes, time, and spend allowed for the operation |

## 유산을 합성

2025-11-25에 고정된 클라이언트는 여전히 이전 서버가 시작된`sampling/createMessage`라이브 연결을 통해 흐르게 합니다. 그 행동을 버전 특정 어댑터에서만 유지하세요. 세션 전체 경로를 2026-07-28 서버의 아키텍처로 만들지 마십시오.

공식 SDK는 현대적인 번역을 할 수 있습니다 `input_required`이 샴은 새로운 세션 의존적 논리를 추가할 수 있는 권한이 아니라 호환성의 한계입니다.

## 더 많은 읽기

- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP Sampling deprecation](https://modelcontextprotocol.io/seps/2577-deprecate-roots-sampling-and-logging)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
