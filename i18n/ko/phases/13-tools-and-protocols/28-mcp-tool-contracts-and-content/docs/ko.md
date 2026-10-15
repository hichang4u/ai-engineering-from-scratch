# MCP 도구 계약 및 내용

> 도구는 발견, 논쟁, 결과, 페이지화 및 운송 메타데이터가 한 계약에 동의할 때만 자동화 할 수 있습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 07, 09, and 10
**Time:** ~120 minutes

## 학습 목표

- JSON 스키마 2020-12로 도구 입력 및 출력을 정의하십시오.
- 구조화된 결과를 JSON 객체라고 가정하지 않고 검증합니다.
- 텍스트, 이미지, 오디오, 리소스 링크 및 임베디드 리소스 중 하나를 선택하십시오.
- 안전하지 않은 것을 거부합니다`x-mcp-header`도구가 모델에 도달하기 전에 정의를 내립니다.
- 매개 변수-머리 값을 암호화하고, 정확한 머리와 몸의 평형을 확인한다.
- 커서 값을 해석하지 않고 커서 페이지를 가로지르는 것.
- 구속하고 승인`completion/complete`제안

## 문제

파이썬 함수를 호출하는 것은 간단합니다. 인공지능 호스트를 통해 원격 기능을 호출하는 것은 계약 문제입니다.

서버는 설명서를 게시합니다. 클라이언트는 그 설명서를 모델 컨텍스트와 사용자 인터페이스로 변환합니다. 모델은 논쟁을 만듭니다. 게이트웨이는 거울 헤더에서 요청을 라우팅 할 수 있습니다. 서버는 도구를 실행합니다. 클라이언트는 그 결과물이 모델로 돌아갈 수 있을 만큼 안전하고 유효 여부를 결정합니다.

한 가지 약한 경계가 전체 연쇄를 손상시킵니다.

다섯 가지 실패를 살펴보자.

- 설명기는 결과물이 객체라고 하지만 서버는 배열을 반환합니다.
- 클라이언트는 페이지가 `nextCursor`빈 끈입니다.
- 토큰 매개 변수는 HTTP 헤더에 반영되어 중개자에게 가시됩니다.
- 유니코드 라우팅 값은 원본으로 전송되며, 게이트웨이와 원본은 다른 바이트를 해석합니다.
- 완료 최종점은 접속이 불가능한 호출자에게 생산 환경을 제안합니다.

이러한 오류는 더 나은 촉구로 해결되지 않습니다. 그들은 명시적인 프로토콜 및 응용 계약이 필요합니다.

## 계약 파이프라인

도구 호출을 다섯 개의 게이트로 취급하십시오.

1. **Discover.**결정적이고 페이지화된 도구 목록을 읽어보세요.
2. **Admit.**각 설명서를 확인하고 지역 보안 정책을 적용하십시오.
3. **Invoke.**논증을 검증하고 운송 메타 데이터를 구축합니다.
4. **Execute.**핸들러를 실행하고 오류를 올바르게 분류하십시오.
5. **Consume.**모델 사용 전에 내용 블록과 구조화된 출력을 검증합니다.

```figure
mcp-contract-pipeline
```

호스트는 입수 및 소비 게이트를 소유하고 있습니다. 서버는 클라이언트가 그 해설, 스케마 또는 출력을 신뢰하도록 강요할 수 없습니다.

## JSON 스키마는 실행 시간 제한입니다

MCP에서`2026-07-28``inputSchema`그리고`outputSchema`JSON 스키마를 사용하세요.`$schema`없는 경우 기본 방언은 2020-12입니다.

입력 스키마는 스키마 객체일 수 있습니다. 논쟁이 없는 도구는 여전히 정확히 받아들이는 것을 말해야 합니다:

```json
{
  "type": "object",
  "additionalProperties": false
}
```

이건 더 엄격한 것 같아요`{ "type": "object" }`, 즉 임의의 성질을 받아들이는

출력 스케마는 선택적입니다. 서버가 한 개 게시하면 모든 완전한 도구는
결과 는 순환을 반환 하는 데 의무를 `structuredContent`, 결과를 포함
`isError: true`. 오류 플래그는 실행 결과로 분류된다.
공개된 출력 계약을 포기하는 경우, 고객은 그 대신 결과를 확인해야 합니다.
설명자에 대한 신뢰를

### 구조화된 내용은 JSON 값입니다

하드코드를 하지 마세요`structuredContent`사전으로 쓰여진 단어로

- 물체
- 배열
- 줄이
- 번호
- 부올리언
- `null`- 그래

이 도구는 배열을 반환합니다:

```json
{
  "name": "tag_catalog",
  "inputSchema": {
    "type": "object",
    "additionalProperties": false
  },
  "outputSchema": {
    "type": "array",
    "items": {"type": "string"}
  }
}
```

그 성공적 결과는 유효합니다.

```json
{
  "resultType": "complete",
  "content": [
    {
      "type": "text",
      "text": "[\"contracts\", \"mcp\", \"stateless\"]"
    }
  ],
  "structuredContent": ["contracts", "mcp", "stateless"],
  "isError": false
}
```

호환성 위해 구조화된 결과들은 텍스트 블록에 일련화된 JSON도 포함해야 합니다. 텍스트는 검증 소스가 아닙니다. `structuredContent`- 그래요

### 작은 검증자는 여전히 경계를 가르칩니다

수업은 의도적으로 JSON Schema 하위 집합을 사용하므로 파이썬 표준 라이브러리에 남아 있습니다. 샘플 도구에서 사용되는 메커니즘을 확인합니다.

- 객체, 배열, 문자열, 정수, 숫자, 볼리언, 그리고 무상 유형
- 요구되는 성질
- `additionalProperties: false`
- 배열 항목
- enum 값;
- 최소 문자열 길이가

이것은 완전한 생산 검증기 대신하는 것이 아닙니다. 재사용 가능한 교훈은 검증이 일어나는 곳입니다. 설명기들을 발견한 후, 주장을 실행하기 전에, 구조화된 결과를 위해 소비하기 전에.

## 내용 블록 은 다른 비용 을 부담 합니다

`content`배열은 여러 종류의 콘텐츠를 결합할 수 있습니다.

| Type | Use it for | Main boundary |
|------|------------|---------------|
| `text` | Human and model-readable summaries | Treat text as untrusted output |
| `image` | Visual evidence encoded as base64 | Validate media type and size |
| `audio` | Spoken or recorded output encoded as base64 | Validate media type and duration limits |
| `resource_link` | A URI the client may fetch later | Reauthorize the later resource read |
| `resource` | Data embedded directly in the result | Enforce payload and content limits now |

리소스 링크는 리소스가 `resources/list`이 도구 호출에 의해 반환된 참조입니다. 클라이언트는 URI를 따르는 동안 여전히 자원의 정책을 적용합니다.

임베디드 리소스는 또 다른 회전 여행을 피하지만 현재 응답 크기를 증가시킵니다. 큰 또는 독립적으로 변화하는 유물들을 위한 링크를 사용하십시오.

교훈은`evidence_bundle`이 결과에는 5가지 유형이 모두 포함됩니다. 클라이언트는 결과를 받아들이기 전에 각 블록을 검증합니다.

## `x-mcp-header`메타데이터를 로팅하는 것

내부에 있는 부동산`inputSchema`선언할 수 있습니다`x-mcp-header`. 스트리메이블 HTTP에서 클라이언트는 그 주장을 반영합니다.`Mcp-Param-{name}`- 그래

```json
{
  "region": {
    "type": "string",
    "x-mcp-header": "Region"
  }
}
```

`region: "eu-west"`, 운송은 다음과 같은 방출을 할 수 있습니다:

```http
Mcp-Param-Region: eu-west
```

이 해석은 JSON 몸체를 분석하지 않고 로드 밸런서, 게이트웨이 또는 정책 엔진이 라우팅 할 수 있도록 존재합니다.

이 프로토콜은 이 해설을 제한합니다.

- 헤더 이름은 비공개이며 HTTP 필드 이름 토큰 문법을 따르고 있습니다.
- 헤더 이름은 경우에 관계없이 독특합니다.
- 속성 유형은 문자열, 정수 또는 볼리언이다.
- `number`허용되지 않습니다.
- 이 해석은 `inputSchema.properties`
- 정수 값은 `-9007199254740991` `9007199254740991`- 그래

위치 규칙은 문법적이고 실패로 닫혀 있습니다. 전체 스케마 트리를 걸어,
검증자가 이해하는 특성에 대해서만
 둥지를 틀어 놓은 물체의 아래의 해석은`properties`, a `oneOf`분부`items`, a
`$ref`, 또는 어떤 출력 스케마. 참조를 해결하는 것은
참조된 노드를 직접적인 최고 수준의 속성으로 바꾸지 않습니다.

이 수업은 배포 정책을 추가합니다.`password``secret``token``api_key`또는`authorization`. 공식적인 사양은 서버 작성자에게 민감한 매개 변수를 반영하지 말라고 조언합니다. 클라이언트는 그 조언을 엄격한 입시 규칙으로 바꿀 수 있습니다.

헤더 이름, 그 값이 아닌 표본 코드를 기록하세요`Mcp-Param-Region``eu-west`감사 사건에서 벗어나는 것

### HTTP 헤더를 생성하기 전에 에코딩 값

매개 변수 값은 비공개 문자열이 아닌 경우에만 평정 텍스트로 이동할 수 있습니다.
에서 보이는 ASCII 문자`!` `~`그리고
다른 모든 것들은 다음과 같은 형태를 사용합니다.

```text
=?base64?{Base64UTF8}?=
```

`Base64UTF8`UTF-8 바이트에 대한 표준 Base64입니다.
유니코드 에코드, 빈 문자열, 공간,
탭, 제어 문자, CR 또는 LF, 앞 또는 뒤의 백색 공간, 그리고
`=?base64?`다시 sentinel처럼 보이는 값을 암호화하는 것은
수신자가 문자 그대로의 원본 텍스트를 복원할 수 있는 방법은
이 문장은 교통 문법입니다.

어자 (Boleans) 는 작은 글자로 표현됩니다`true`또는`false`. 10의 기본에 있는 정수
자바스크립트 보안 정수 범위 내에서 유지되어야 합니다. 그 범위 밖의 값
중개인이 반하는 대신 거절당합니다.

### 서버는 거울 복사본을 확인합니다

헤더 생성은 클라이언트의 절반에 불과합니다. 스트리메이블 HTTP 경계에서,
서버는:

1. 인정받았어요`Mcp-Param-*`헤더-네임의 경우를 고려하지 않고 이름
2. 발현될 때 정확한 base64 sentinel 형태를 해독
3. 디코딩된 텍스트와 해당 JSON 체조 정수를 정확하게 비교한다.
4. 실종, 복제, 예상치 못한, 잘못된 형태 또는 부합된 것을 거부합니다.
   발송 전에 인식된 헤더

거부는 HTTP입니다`400`JSON-RPC 오류 코드와 함께`-32020`- 그나마
본체 값이나 그 코딩 된 헤더 형태는 감사 기록에 포함되지 않습니다.
인정된 헤더 이름과 거부 카테고리만

`code/main.py`이 경계를 직접적으로 모델링합니다.[Lesson 09](../../09-mcp-transports/)
메소드 및
프로토콜 버전 평형

## 페이지 가 가  는 불명확 이다

MCP 목록 작업은 커서 페이지화를 사용합니다. 서버는 페이지 크기와 커서 형식을 선택합니다. 클라이언트는 한 가지 결정을합니다.

```python
if result.get("nextCursor") is None:
    break
cursor = result["nextCursor"]
```

이렇게 쓰지 마

```python
if not result.get("nextCursor"):
    break
```

빈 문자열은 유효한 커서입니다. 진실은 너무 일찍 멈출 것입니다.

클라이언트는 커서를 해독하거나 인크렌트하거나, 주문을 위해 이전 커서와 비교하거나 페이지 번호를 추론해서는 안 됩니다. 서버는 커서를 서명하거나 카탈로그 버전으로 묶거나, 프라이빗 상태로 지도를 지정할 수 있습니다. 이것이 서버의 구현 세부 사항입니다.

샘플 서버는 의도적으로 반환합니다`""`첫 페이지 후 클라이언트는 두 번째 요청에 해당 값을 보내야 합니다.

```text
<first request with no cursor>
<second request with cursor "">
```

유효하지 않은 커서들은 JSON-RPC 유효하지 않은 파라마를 생성합니다.`-32602`- 그래

## 완공 은 허가 표면 이 된다

`completion/complete`즉흥적인 주장과 자원 템플릿 주장을 위한 제안서를 제공합니다. 상호작용형태에 유용하지만 일반적인 목록 방법들이 보호하는 이름을 누출할 수 있습니다.

완료 요청에 참조와 완료된 주장의 이름이 붙여집니다.

```json
{
  "method": "completion/complete",
  "params": {
    "ref": {
      "type": "ref/prompt",
      "name": "deployment_review"
    },
    "argument": {
      "name": "environment",
      "value": "st"
    }
  }
}
```

결과는 최대 100개의 값을 반환하고 보고할 수 있습니다 `total`더하기`hasMore`- 그래

참조된 프롬프트 또는 리소스에 사용된 동일한 권한 제한을 적용합니다. 샘플의 분석가`development`그리고`staging`오직 사업자가만 수신할 수 있습니다`production`- 그래

생산 완료 또한 다음과 같은 것이 필요합니다.

- 입력 인증
- 전화기 인식 필터링
- 클라이언트에서 비출을 요청하는 것
- 서버에서 속도 제한
- 제한된 결과수표
- 민감한 제안 값을 노출하지 않는 로그

완공은 도움의 일이고, 발견의 우회행이 아닙니다.

## 두 개의 오류 층

프로토콜 오류를 도구 실행 오류와 분리하십시오.

MCP 요청이 올바르게 전송될 수 없는 경우 JSON-RPC 오류를 사용:

- 알려지지 않은 도구 이름
- 잘못된 요청 형태
- 요청 메타데이터가 없어지는 경우
- 유효하지 않은 커서

`isError: true`호출이 도구에 도달하고 도구가 실행 가능한 오류를 보고하면:

- 보고서는 제공되지 않습니다.
- 날짜는 지원 범위 밖의 날짜입니다.
- 사업 규칙은 요청된 작전을 거부합니다.

모델은 종종 도구 실행 오류를 수리할 수 있습니다. 그들은 자신의 출력 스케마를 위반한 서버를 수리할 수 없습니다.

도구가 출력 스케마를 선언하면, 그 내부에서 실행 가능한 오류를 모델링합니다
스케마, 샘플`route_report`실패는 요청된 지역을 반환합니다
`accepted: false`, 인간으로 읽을 수 있는 오류 텍스트와 함께`isError: true`- 그래

## 건설 해

`code/main.py`파이썬 표준 라이브러리와 함께 경계 양쪽을 만듭니다.

서버에서 구현:

- 요청에 따라 MCP 메타데이터 검증
- `server/discover`도구와 완성 기능이 있는
- 결정적인`tools/list`페이지화
- 거부해야 할 하나의 도구 설명서를 포함하여 네 가지;
- 배열 구조 출력
- 현재 도구 내용 블록 유형
- 인식된 매개 변수 헤더와
  HTTP를 반환합니다`400`JSON-RPC를 더함께`-32020`부합에 관한 경우
- 허가된 및 제한된 임상 완료

클라이언트는 다음과 같이 실행합니다.

- 설명자 입용
- 나무`x-mcp-header`배치 검증 및 민감한 분야 정책
- 정확한 명백하게 보이는 ASCII 또는 base64 UTF-8 값 코딩
- 비명한 문자열을 따르는 비명한 커서 루프
- 논증 및 결과 검증
- 콘텐츠 블록 검증
- 제목에 이름을 포함하지만 값이 아닌 감사 이벤트를.

의도적으로 안전하지 않은 설명자는 학습 데이터를 보여줍니다. 그것은 거부된 도구가 유효한 도구가 로드되는 것을 막지는 않는다는 것을 증명합니다.

## 사용 하 고

저장소 뿌리에서:

```bash
cd phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/code
python3 main.py
python3 -m unittest discover tests -v
```

데모 프린트 허용 도구, 거부 설명서, 두 페이지
요청, 구조화된 배열 내용, 내용 블록 유형, 거울 헤더
이름, 필요한 값 인코딩, HTTP 평행 상태, 그리고
호출자 필터링 완료 값

## 인터랙티브 연구소

열리세요`code/main.py`그리고 위치를 찾아`TOOLS`- 그래

1. 변화`tag_catalog.outputSchema.type``array` `object`- 그래
2. 데모를 실행하면 클라이언트가 반환된 배열을 거부해야 합니다.
3. 스케마를 복원해
4. 첫 페이지의 내용을 보관하세요`nextCursor``""`, 그리고 마지막 페이지를 반환
   `nextCursor: None`필드를 빼기 보다는
5. 테스트를 해보고 커서 추적을 비교해 보세요.
6. 추가`x-mcp-header: "Authorization"`끈의 속성을
7. 확인 설명서 입장은 호출 전에 거절합니다.
8. 시도해봐`region`유니코드, 신 라인, 주변 공간을 포함하는 값, 그리고
   문자 그대로의 문장`=?base64?SGVsbG8=?=`. 발매된 각 헤더를 해독하고 증명
   원래 값이 정확히 남아 있습니다.
9. 이 문서를 아래로 이동`oneOf``items`, 또는`$ref`정의 확인
   각각의 설명서는 그 분자가 데모에서 결코 사용되지 않더라도 거부됩니다.
10. 인식 된 헤더를 제거하거나 디코딩 된 값을 변경하십시오. HTTP를 확인합니다
    경계 반환 상태 `400`그리고 JSON-RPC 코드`-32020`- 그래

중요한 것은 JSON 형태를 기억하는 것이 아니라 각각의 게이트가 그 문의 경계에서 실패하는 것을 보는 것입니다.

## 연습 실험실

계약 실험실을 확장하여`search_evidence`도구

요구 사항:

1. 입력 스키마는 `query``limit`, 그리고 안전보장이`region`로우팅 필드
2. 출력 스케마는 `uri``title`그리고`score`- 그래
3. 그 결과에는 호환성 텍스트와 각 항목에 대한 리소스 링크가 포함됩니다.
4. 주장은 알려지지 않은 성질을 거부합니다.
5. `limit`신청의 유효성으로 제한됩니다.
6. 하나의 URI에 액세스하지 않는 호출자는 완료 또는 도구 출력으로 URI를 결코 보지 않습니다.
7. 테스트에는 불합리한 점수, 유효하지 않은 헤더 해설 및 2 페이지 목록이 포함됩니다.
8. 헤더 값 테스트는 눈에 보이는 ASCII, 유니코드, 제어 문자,
   백색 공간, 센티널 모양의 텍스트, 그리고 모두 자바스크립트 보안 정수 경계가 있습니다.
9. HTTP 고정은 케이스에 민감하지 않은 헤더 이름을 받아들이지만 실종되는 것을 거부합니다
   또는 정황과 일치하지 않는 인정된 값`400`그리고 코드`-32020`- 그래

## 배송된 유물

`outputs/skill-mcp-contract-reviewer.md`평면, 재사용 가능한 검토 기술입니다. 도구 설명서, 샘플 결과, 페이지화 행동 및 완료 정책을 제공합니다. 그것은 입시 결정, 결과 유효성화 계획, 헤더 정책 및 구체적인 실패 테스트를 반환합니다.

## 확인 해 보

이 말 이 사실 이면 교훈 이 완성 됩니다.

- `tools/list`반복된 호출에 동일한 논리적 순서를 반환합니다.
- 클라이언트는 두 번째 요청을 수행합니다`nextCursor` `""`- 그래
- 안전하지 않은 민감한 헤더 설명기는 제외되어 다른 도구가 사용가능하다.
- 배열은 배열 출력 스케마를 통과합니다.
- 객체는 동일한 배열 스키마를 실패합니다.
- 오류 결과들은 출판된 출력 스케마를 생략하거나 위반할 수 없습니다.
- 텍스트, 이미지, 오디오, 리소스 링크 및 임베디드 리소스 블록이 유효합니다.
- 헤더 감사 이벤트에는 이름과 값이 없습니다.
- 단순 보이는 ASCII는 단순하다; 유니코드, 제어, , 빈, 그리고
  sentinel처럼 보이는 값은 정확한 base64 UTF-8 코딩을 통해 돌아가는 값입니다.
- 자바스크립트 안전 범위 밖의 거울 정수들은 거부됩니다.
- 아래의 표기`oneOf``items`, 둥지를 틀어 놓은 물건`$ref`정의 또는
  출력제도는 입학 중에 거절된다.
- 케이스에 민감하지 않은 인식 된 헤더 이름들은 디코딩 된 값이 지나면만
  정확히 몸과 일치합니다. 누락되거나 일치하지 않은 복사본은 HTTP를 생성합니다 `400`
  그리고 JSON-RPC `-32020`- 그래
- 분석가 완료는 돌아오지 않습니다`production`- 그래
- 도구 실패는 사용 `isError: true`; 잘못된 프로토콜 호출은 JSON-RPC를 사용합니다 `error`- 그래

## 생산 실패 모드

| Failure | What the learner sees | Correct response |
|---------|-----------------------|------------------|
| Client assumes object output | Valid arrays fail or are silently wrapped | Validate against the published schema without object-only types |
| Empty cursor treated as false | Final pages disappear | Continue whenever `nextCursor` is present and non-null |
| Sensitive value mirrored | Secret appears in proxy, WAF, or trace data | Reject the descriptor and keep secrets in protected request data |
| Raw Unicode or whitespace mirrored | Gateway and origin disagree or the value is normalized | Use exact base64 UTF-8 sentinel encoding and compare after decoding |
| Annotation hidden in a schema branch | A client misses routing metadata during admission | Traverse the entire schema tree and allow only direct top-level properties |
| Large integer mirrored | JavaScript intermediary rounds the routing value | Reject values outside the JavaScript safe integer range |
| Header and body disagree | Gateway routes one target while the origin executes another | Reject before dispatch with HTTP `400` and JSON-RPC `-32020` |
| Output schema ignored | Downstream code consumes corrupt structure | Validate before model or application use |
| Resource link trusted automatically | Caller follows an unauthorized URI | Reauthorize every resource read |
| Completion shares global suggestions | Hidden tenant names leak | Filter by caller, reference, and authorization |
| Tool annotations treated as policy | Destructive operation bypasses confirmation | Enforce authorization and approval outside annotations |
| One malformed tool breaks discovery | Entire server becomes unavailable | Reject the bad descriptor and admit valid tools independently |

## 캡스톤 연결

13단계 종말에는 여러 서버에서 도구를 통합할 수 있는 게이트웨이가 필요합니다. 이 수업은 입학 핵심을 제공합니다.

이 유물을 사용하여 4개의 석탄 증거를 분류합니다.

- 결정적이고 완전한 페이지화된 발견
- 모델 노출 이전에 설명자 검증
- 검증된 구조화된 출력과 제한된 내용 블록
- 권한 제한을 유지하는 메타데이터를 완료하고 라우팅합니다.

성공적인 게이트웨이 호환성을 주장하지 마십시오`tools/call`설명서, 페이지 추적, 허용된 도구 집합, 거부된 도구 집합 및 하나 확인된 결과를 캡처합니다.

## 주요 용어

| Term | Meaning |
|------|---------|
| `inputSchema` | JSON Schema object defining accepted tool arguments |
| `outputSchema` | Optional JSON Schema defining `structuredContent` |
| `structuredContent` | Any JSON value produced by a tool result |
| Content block | Typed text, image, audio, resource link, or embedded resource |
| `x-mcp-header` | Schema annotation that mirrors a primitive argument into Streamable HTTP metadata |
| Opaque cursor | Server-issued pagination token whose value the client does not interpret |
| Completion reference | Prompt name or resource URI/template whose argument is being completed |
| Admission | Client decision to expose or reject a discovered descriptor |

## 더 많은 읽기

- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Completion](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/completion)
- [MCP Pagination](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/pagination)
- [MCP Streamable HTTP Parameter Headers](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#custom-headers-from-tool-parameters)
