# MCP 서버 구축: 무국립 파이썬 및 타입스크립트

> 현대 MCP 서버는 손떨림을 기억하지 않습니다. 모든 요청에 대한 메타 데이터를 검증하고 한 핸들러를 실행하고 입력된 결과를 반환합니다.

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 13, Lesson 06
**Time:** ~85 minutes

## 학습 목표

- 의무적인 시행`server/discover`MCP에 대하여`2026-07-28`- 그래
- 모든 요청에 따라 프로토콜 버전과 클라이언트 기능을 검증합니다.
- 결정적인 목록 순서로 도구, 자원 및 명령어를 노출하십시오.
- 돌아와`resultType`, 서버 아이덴티티, 그리고 정확한 결과의 캐시
- 파이썬과 타이프스크립트에서 새로운 라인 제한된 스튜디오에 동일한 국가 없는 계약을 서비스하십시오.

## 문제

첫 번째 메시지의 후 클라이언트 기능을 저장하는 서버는 구축하기 쉽고 작동하기 어렵기 때문입니다. 동일한 프로세스는 순차적인 클라이언트를 서비스 할 수 있습니다. 원격 요청은 다른 작업자에게 착륙 할 수 있습니다. 오래된 기능 선언은 권한 경계를 넘어 행동을 누출 할 수 있습니다.

MCP `2026-07-28`모든 요청이 자기 설명이 되어서 프로토콜의 문제를 해결합니다. 응용 프로그램은 여전히 내구성 메모, 작업 또는 명시적인 상태 핸들을 유지할 수 있습니다.

이 수업은 메모 서버를 두 번 구축합니다. 파이썬과 타이프스크립트 버전은 프로토콜 코어에 대한 표준 라이브러리를 사용합니다. 둘 다 동일한 방법을 노출하고 동일한 와이어 계약을 시행합니다.

## 개념

### 현대적인 배송 루프

```text
read one JSON-RPC line
parse the envelope
if it is a notification, do not respond
validate params._meta for this request
route by method
wrap success with resultType and serverInfo
write one JSON-RPC response line
forget request-scoped metadata
```

3개의 스튜디오 규칙이 여전히 중요해요

- Stdout에 JSON-RPC 메시지를 작성하고 stderr에 진단을 보내십시오.
- 뉴 라인으로 메시지를 정의하고 각각의 응답을 스프링하세요.
- 스틴이 EOF에 도착하면 즉시 출동하세요.

프로세스 수명은 운송 수명입니다. 현대적인 MCP 세션이 아닙니다.

### 요청의 검증

모든 요청은 다음을 포함해야 합니다.

```json
{
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "notes-client",
        "version": "1.0.0"
      }
    }
  }
}
```

첫 두 개의 필드는 필요합니다.`clientInfo`현재 정체성 형태를 확인하지만 인증으로 취급하지 마십시오.

버전이 지원되지 않은 경우 복원 코드를 `-32022``requested`그리고`supported`. 요청 메타데이터가 없어지는 것은 유효하지 않은 파라마스, 코드 `-32602`이전 전화에서 놓친 필드를 절대 채우지 마세요.

### 의무적 발견

현대 서버는 구현해야 합니다`server/discover`. 완전한 발견 결과에는 지원되는 현대 버전, 기능, 선택 사항 지침, 캐시 팁 및 결과 서버 아이덴티티가 포함되어 있습니다 `_meta`이 부분의 본문은

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": false},
    "resources": {"listChanged": false, "subscribe": false},
    "prompts": {"listChanged": false}
  },
  "ttlMs": 3600000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

디스커버리는 서버를 잠금하지 않습니다. 클라이언트가 전화를 걸 수 있습니다.`tools/list`발견이라고 부르지 않고`tools/list`이미 동일한 요청 메타데이터를 가지고 있습니다.

### 도구

`tools/list`도구 설명자들의 결정적인 목록을 반환합니다. 안정적인 순서로 응답 캐싱을 향상시키고 모델 컨텍스트를 안정적으로 유지합니다. 또한 결과가 필요합니다`ttlMs`그리고`cacheScope`- 그래

`tools/call`내용 블록을 반환하고`isError`. 프로토콜 봉투 또는 방법 매개 변수가 무효인 경우 JSON-RPC 오류를 사용한다. 사용 `isError: true`유효한 도구 호출이 실행되고 도구 자체가 실패할 때

도구 해석은 암시품이 되고, 집행품이 아니다:

- `readOnlyHint`
- `destructiveHint`
- `idempotentHint`
- `openWorldHint`

호스트는 확인 및 프레젠테이션을 위해 사용해야 합니다. 서버는 여전히 실제 권한을 적용해야합니다.

### 자원

`resources/list`안정적인 URI 설명자를 반환합니다. `resources/read`입력된 내용을 반환합니다. 둘 다 캐시 가능합니다`2026-07-28`, 그래서 둘 다 포함됩니다`ttlMs`그리고`cacheScope`- 그래

사용`cacheScope: "private"`사용자 특화된 메모 데이터에 대해 공유 캐시는 권한 컨텍스트에서 개인 응답을 재사용해서는 안 됩니다.

현대적인 변화 전달은 사용하지 않습니다 `resources/subscribe`- 클라이언트가 열고`subscriptions/listen`그리고 요청`resourceSubscriptions`10강은 그 흐름을 구축합니다.

### 명령

`prompts/list`미세하고 결정적인 것입니다.`prompts/get`렌더링 된 프롬프트 결과는 완료되었지만, 캐시 입력이 필요한 캐시 목록 또는 읽기 결과 중 하나가 아닙니다.

### 모든 성공적 결과는 입력됩니다

예를 들어, 성공에 한 개의 팩을 사용합니다.

```python
def complete(payload):
    return {
        "resultType": "complete",
        **payload,
        "_meta": {SERVER_INFO_KEY: SERVER_INFO},
    }
```

목록, 읽기, 발견 관리자 추가 `ttlMs`더하기`cacheScope`이 팩을 중앙집중화하면 한 핸들러가 현대적인 결과 필드를 침묵으로 생략하는 것을 방지합니다.

### 서버에서 시작된 요청이 없습니다

현대 서버는 클라이언트 요청과 관련된 알림을 보내거나 클라이언트 오픈된 알림을 보낼 수 있습니다 `subscriptions/listen`스트림. 그것은 자신의 JSON-RPC 요청을 보내서는 안 됩니다.

처리자가 샘플링, 발굴 또는 루트 입력이 필요할 때, 그것은 `input_required`결과. 클라이언트는 임베디드 입력 요청들을 충족시키고 새로운 요청 ID로 원래 방법을 다시 시도합니다. 레슨 11은 멀티 라운드 트립 요청 패턴을 다루고 있습니다.

### 명시적인 유래 호환성

이중 시대 서버는 또한 `2025-11-25`손잡이와 함께, 명확하게 분리된 유래 지문을 눌러서,`_meta`필드는 수신할 때 현존하고 상속된 동작을 합니다 `initialize`- 그래

        `2026-07-28`기존의 손잡이 경로를 통해 요청합니다.`resultType`이 수업의 코드는 의도적으로 현대적이기 때문에 그 변수가 눈에 띄게 남아 있습니다.

```figure
t3-dispatch-loop
```

## 사용 하 고

파이썬 서버의 최종 디모와 테스트를 실행하세요:

```bash
cd code
python3 main.py --demo
python3 -m unittest discover tests -v
```

타입스크립트 실행기 (TypeScript Runner) 로 타입스크립트 포트를 실행하세요:

```bash
npx tsx main.ts --demo
```

데모가 보내주죠`server/discover`, 각 원시적 요소를 나열하고 도구를 호출하고 지원되지 않은 버전 오류를 보여줍니다. 모든 현대 요청은 메타 데이터를 반복합니다. 모든 성공은 서버 아이덴티티를 포함합니다.

## 선박

이 수업은 니다`outputs/skill-mcp-server-scaffolder.md`. 그것은 발견 계약, 요청에 따른 검증, 결정적 캐시 가능한 목록 및 선택적으로 고립된 레거시 어댑터를 가진 현대적인 서버 계획을 생성합니다.

## 운동

1. 한 요청에서 기능을 제거하고 서버가 이전 요청의 선언을 재사용하지 않는 것을 증명합니다.
2.  역전`TOOLS``PROMPTS`, 그리고 메모 삽입 순서 확인 모든 목록 결과 안정적으로 유지됩니다.
3. 파괴적인 것을 추가합니다`notes_delete`도구 및 실행자 내부의 권한 확인을 요구합니다.`destructiveHint`단지 UX의 단추로
4. 추가`resources/templates/list``ttlMs``cacheScope`, 그리고 결정적인 순서
5. `2025-11-25`- 현대적인 요청이 들어가지 않는다는 것을 증명하는 테스트를 추가합니다.

## 주요 용어

| Term | Meaning |
|------|---------|
| Stateless server | Handles each request from its own metadata without protocol-session memory |
| `server/discover` | Mandatory modern method that advertises versions and capabilities |
| Complete result | Successful modern result with `resultType: "complete"` |
| Cacheable result | Discovery, list, or resource-read result with `ttlMs` and `cacheScope` |
| Deterministic list | Same logical registry produces the same item order |
| Server identity | Recommended `io.modelcontextprotocol/serverInfo` in result `_meta` |
| Tool error | Valid tool call that returns content with `isError: true` |
| Protocol error | Invalid JSON-RPC or MCP request returned through `error` |

## 더 많은 읽기

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
