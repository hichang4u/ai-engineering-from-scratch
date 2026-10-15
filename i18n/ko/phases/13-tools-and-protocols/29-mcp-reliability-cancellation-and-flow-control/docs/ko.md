# MCP 신뢰성, 취소 및 흐름 제어

> 요청 ID는 메시지를 연관시킵니다. 부작용을 안전하게 만들거나 근로자를 막거나 느린 소비자로부터 스트림을 보호하지는 않습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 09 and 13
**Time:** ~120 minutes

## 학습 목표

- stdio 및 Streamable HTTP에 대한 올바른 취소 신호를 구현하십시오.
- 취소 후 메시지를 보내지 않고 완료 및 취소 경주를 해결하십시오.
- 지속가능한 요청의 취소`tasks/cancel`의미론을
- 부작용과 명백한 무력성 키를 바탕으로 재시험 결정을 내립니다.
- 최종 응답을 보존하면서 진행 줄을 묶어 놓습니다.
- 다시 연결, 재전환, 그리고 긴장된 백코프로 스트림을 복구하십시오.

## 문제

행복한 길은 가장 비싼 분산 시스템 버그를 숨기고 있습니다.

클라이언트는 도구를 호출합니다. 서버가 작업을 시작합니다. 진행이 도착합니다. 프록시가 스트림을 버버합니다. 클라이언트는 시간 종료에 도달하고 연결을 끊습니다. 서버는 밀리초 1 후에 완료됩니다. 클라이언트는 새로운 JSON-RPC 아이디로 다시 시도합니다. 돌연변이가 두 번 실행됩니다.

모든 구성 요소는 지역적으로 행동했고, 시스템은 전 세계적으로 실패했습니다.

MCP는 메시지 및 전송 행동을 정의하지만 응용 프로그램은 여전히:

- 시간 예산
- 사업의 무력성
- 경계선열
- 재실험 분류
- 지속 가능한 작업 상태
- 다시 연결하고 정책의 개편을

이 수업은 결정들을 결정적인 시뮬레이터로 만들어 냅니다.
잠자리, 소켓, 또는 무작위 오류가 없습니다. 당신은 취소 이벤트 순서를 제어
한 개의 동기화된 스레드 테스트는 두 개의 리저 클라이언트를 경쟁하도록 강요합니다
같은 무력성 키를 위해

## 취소 요청은 교통에 관한 것입니다

모든 운송에 대한 의도는 동일합니다. 클라이언트는 더 이상 비행 결과가 필요하지 않습니다.

### 스튜디오

stdio는 공유된 쌍방향 채널을 사용합니다. 클라이언트는 알림을 전송합니다:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/cancelled",
  "params": {
    "requestId": 41,
    "reason": "User closed the operation"
  }
}
```

알림은 방출 및 잊기입니다. 서버는 JSON-RPC 응답을 발송하지 않습니다.

서버는 작업을 중단하고, 자원을 자유롭게 하고, 취소된 요청에 대한 응답을 보내지 않도록 해야 합니다. 요청이 알려지지 않은 경우, 이미 완료되거나 안전하게 중지할 수 없을 때 취소를 무시할 수 있습니다.

잘못된, 알려지지 않은, 이미 완료된 취소 통지들은 무시됩니다. 이러한 경주를 새로운 오류로 바꾸는 것은 더 많은 경주를 만들 것입니다.

### 스트리밍 가능한 HTTP

현대 스트리메이블 HTTP는 각 요청에 고유의 HTTP 응답 또는 SSE 응답 스트림을 제공합니다. 클라이언트는 요청의 응답 스트림을 닫음으로써 취소합니다.

포스트 하지 마세요`notifications/cancelled`일반 HTTP 요청에 대한 신호는

서버가 연결 해체를 관찰하면 작동을 중단하고 그 요청에 대한 더 많은 메시지를 전송해서는 안 됩니다.

### 서버 전송 취소는 좁습니다

서버가 사용하지 않습니다`notifications/cancelled`스튜디오에서 서버 전송 취소는`subscriptions/listen`요청은 일반 클라이언트 요청 취소와는 분리되어 있어야 합니다.

## 취소 는 인종 이

두 개의 이벤트 명령이 모두 유효합니다.

### 취소 승소

```text
request starts
client sends cancellation signal
server marks request cancelled
worker reaches completion
server suppresses the response
```

### 완공 승자

```text
request starts
worker commits the result
server sends the response
cancellation arrives late
server ignores the late notification
```

클라이언트는 이미 포기한 요청에 대한 늦은 응답을 무시해야 합니다. 네트워크 지연은 어느 쪽이 다른 쪽이 먼저 관찰한 이벤트를 증명할 수 없다는 것을 의미합니다.

```figure
mcp-reliability-race
```

교훈은`RequestCoordinator`한 개의 터미널 상태를 저장합니다.`complete()`취소 후 응답이 없습니다. 늦은 취소는 완료된 기록을 변경할 수 없습니다.

## 시간제 는 두 개의 시계 를 필요로 한다

단 한 번의 비활성 타이머는 충분하지 않습니다.

두 가지 제한을 사용하세요:

1. **Idle timeout.**요청이 얼마나 오랫동안 유용한 활동이 되지 않을 수 있는지
2. **Maximum timeout.**요청 시작부터 절대적인 벽 시계 예산입니다.

진보는 비활성 시계를 다시 설정할 수 있습니다. 절대 최대 임기를 제거해서는 안 됩니다.

```text
start: 0 ms
progress: 400 ms
progress: 800 ms
progress: 1200 ms
idle timeout: 500 ms
maximum timeout: 2000 ms
```

1500 ms에, 요청은 아직 활성화되어 있습니다. 최신의 진전이 300 ms에 불과하기 때문에. 2000 ms에, 최대 임기는 1999 ms에 다른 진전이 발생했을 때에도 이를 취소합니다.

진행은 선택적입니다. 서버는 진행 토큰을 받아서 업데이트를 할 수 없습니다. 토큰의 존재를 무한한 시간으로 바꾸지 마십시오.

MCP의 진출 값은 증가해야 합니다. 통지 완료 또는 취소 후 중단됩니다. 급격한 노동자가 운송을 홍수할 수 없도록 비율 제한 진출.

## 취소 요청은 불가능합니다`tasks/cancel`

이 메커니즘은 다양한 삶을 해결합니다.

| Mechanism | Target | Signal | What success means |
|-----------|--------|--------|--------------------|
| Request cancellation on stdio | One in-flight RPC | `notifications/cancelled` | Client abandoned the request; server should stop if practical |
| Request cancellation on HTTP | One in-flight response stream | Close the stream | Client abandoned the request; server should stop if practical |
| `tasks/cancel` | One durable Task | Ordinary MCP request | Server acknowledged cancellation intent |

성공한 사람`tasks/cancel`그 결과로 근로자가 멈춰있음을 증명하지 않습니다.`working`근로자 점검소가 깃발을 관찰할 때까지 작업은 그 점검점 이전에 완료될 수 있습니다.

HTTP 연결이 종료되면 내구성 작업 상태를 삭제하지 마십시오. 작업을 만드는 이유는 작업의 라이프사이클이 한 요청과 한 연결을 넘어서기 때문입니다.

## 새로운 JSON-RPC ID는 무력화 되지 않습니다

JSON-RPC ID는 요청과 응답을 상관관계합니다. 비즈니스 운영을 식별하지 않습니다.

만약 고객이 ID를 가지고 기금을 제출한다면`41`, 응답을 잃어, 다시 ID를 시도합니다`42`서버는 두 개의 다른 메시지를 볼 수 있습니다. 응용 키가 없으면, 그들은 하나의 체크 아웃을 나타냅니다.

이도펜서 키는 비즈니스 의도를 식별합니다.

```json
{
  "name": "charge_account",
  "arguments": {
    "account": "acct-7",
    "cents": 1200,
    "idempotencyKey": "checkout-7"
  }
}
```

서버 저장:

- 열쇠
- 동작 주장의 지문
- 약속된 결과

동일한 키와 동일한 주장은 저장된 결과를 반환합니다. 다른 주장을 가진 동일한 키는 거부됩니다. 이것은 다른 비즈니스 운영을 변형시키는 우연한 키 재사용을 방지합니다.

### 이 책록의 경계선은 원자력적이고 내구성이 있어야 합니다

이 순서로는 안전하지 않습니다.

```text
check key
run mutation
store result
```

두 명의 노동자는 모두 잃어버린 열쇠를 관찰하고 돌연변이를 실행할 수 있습니다.
그 후에도 효과가 있지만 매장이 재시험에 동일한 모호함을 만들어내기 전에

수업은 파일로 지원된 SQLite 리더를 사용합니다.`BEGIN IMMEDIATE`일련화
키 체크, 시뮬레이션 비즈니스 효과, 실행 카운터, 그리고 저장된 결과
한 거래, 두 개의 독립적인 리저 연결이 같은 키를 가지고 경쟁하고 있습니다
따라서 하나의 약속된 결과와 하나의 실행을 관찰합니다.
이 기록은 그 기록에 있습니다.

모든 반환 값은 저장된 JSON에서 재구성됩니다. 호출자는 결코 수신하지 않습니다
이 책에서 보관된 변수 객체, 따라서 반환된 사전을 변경할 수 없습니다
더 이상 손상된 재생 결과를

시뮬레이터의 비즈니스 효과는
실제 지불, 배포 또는 외부 API 호출은
지역 테이블을 작성하는 것만으로도 원자력을 만들 수 없습니다. 생산은 내구성이 필요합니다
공유 데이터베이스 트랜잭션, 트랜잭션 아웃박스 또는 업스트림 제공자
이 모든 요소들은
복제 또는 재발전에서 살아남기

### 재시행 행렬

실행하기 전에 재조직 시도를 할 수 있습니다.

| Class | Example | Retry rule |
|------|---------|------------|
| Safe | Deterministic read with no side effect | Retry with a new JSON-RPC id after the failure boundary is understood |
| Conditional | Mutation with a durable idempotency key | Retry with the same key and identical arguments |
| Unsafe | Mutation without business deduplication | Do not retry automatically; reconcile first |

도구에 대한 해석은`readOnlyHint`그리고`idempotentHint`애플리케이션 계약과 서버 구현은 안전성을 다시 시도하는 것을 결정합니다.

## 역압 은 옳음 의 일부분 이다

SSE 생산자는 클라이언트, 프록시 또는 네트워크가 소비할 수 있는 것보다 더 빠르게 발전을 생성할 수 있습니다. 무제한 줄을 따라 느린 것을 메모리 마비로 변환합니다.

한계된 줄을 사용해서 무엇이 손실될 수 있는지 정의하십시오.

진행은 대체할 수 있다. 후속 진행 값은 같은 토큰으로 이전 값을 대체한다. 최종 JSON-RPC 응답은 대체할 수 없다.

수업 버퍼는 이 정책을 적용합니다.

1. 같은 의미에서 인접한 발전을 조성합니다.
2. 역량이 되면 가장 오래된 발전을 포기하세요.
3. 강이 정통이 필요하다는 것을 표시하세요.
4. 최종 반응을 유지하세요.
5. 최종 반응을 보존하기 위해서는 또 다른 최종 반응을 떨어뜨리는 상태를 거부합니다.

이것은 명백한 회복과 함께 한정된 손실입니다. 침묵한 손실은 전략이 아닙니다.

### 대리 부퍼링

서버는 역임 대리인이 버퍼에서 이벤트를 저장하는 동안 올바르게 스트리밍 할 수 있습니다.

SSE 응답을 위해 다음을 보내십시오.

```http
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no
```

2026 스트리메이블 HTTP 스펙은 추천합니다 `X-Accel-Buffering: no`따라서 호환 가능한 프록시들은 즉시 이벤트를 전달합니다.

조용한 오래 지속되는 스트림에 대해 주기적으로 SSE 댓글을 발송하십시오.

```text
:
```

클라이언트는 댓글 라인을 무시하고 중개인은 트래픽을 보고 비활성 연결을 닫는 확률이 낮습니다.

Keepalive는 진보가 아닙니다. 운송 댓글이 도착했기 때문에 작업의 의미적 비활성 시간 시간을 재설정하지 마십시오.

## 다시 연결하는 것 은 다시 연결 하는 것 이

현대 스트리메이블 HTTP는 SSE를 다시 실행할 수 있는 `Last-Event-ID`- 그래

1년 후`subscriptions/listen`하류의 떨어지는:

1. 새로운 JSON-RPC 아이디로 새로운 청취 요청을 열십시오.
2. 원하는 구독 필터를 복원합니다.
3. 영향력 있는 방법에서 영향을 받은 도구, 자원, 명령어 또는 작업을 다시 가져오십시오.
4. 안정적인 식별자에 의해 응용 상태를 배제합니다.
5. 위험성 없는 돌연변이를 반응이 없어졌기 때문에 반복하지 마십시오.

샘플 복구 계획에는 명시적으로 명시되어 있습니다 `sendLastEventId`거짓으로 표시하고 재원을 다시 수정하도록 목록에 넣습니다.

### 다시 연결되는 무리들을 막기

만약 10,000명의 클라이언트가 정확히 1초에 다시 연결된다면 복구 서버가 다시 실패합니다.

기하급수적 배코프를 jitter와 a 캡으로 사용한다. 수업은 클라이언트 ID와 시도 번호에서 결정적인 jitter를 계산하여 테스트가 재생가능합니다.

```text
attempt 0: up to 250 ms
attempt 1: up to 500 ms
attempt 2: up to 1000 ms
...
cap: 8000 ms
```

생산은 암호적으로 안전한 또는 실행 시간 무작위로 사용할 수 있습니다. 변수가 분포가 아니라 특정 공식입니다.

## 건설 해

`code/main.py`5개의 작은 신뢰성 구성 요소를 구축합니다.

### `RequestCoordinator`

- 비활성 및 최대 기간으로 비행 중에 요청을 시작합니다.
- 일조적인 진전 통보를 발급합니다.
- 올바른 stdio 또는 HTTP 취소 신호를 생성합니다.
- 무효 취소 통지들을 무시합니다.
- 취소 및 종료 종목을 명시적으로 명시하고 있습니다.
- 스튜디오 구독을 위해 서버에서 전송된 취소권을 보유합니다.

### `MutationLedger`

- 2개의 JSON-RPC ID가 비즈니스 키 없이 두 번 실행되는 것을 증명한다.
- 키 체크, 시뮬레이션 효과에 파일 뒷받침 SQLite 트랜잭션을 사용합니다.
  실행 카운터 및 결과 약속
- 독립된
  리저 연결
- 다른 주장으로 재사용된 하나의 키를 거부한다.
- 방어 복사본을 반환하고 재개회에 대한 적당한 기록을 보존합니다.

### `DurableTaskService`

- 취소 요청을 인정합니다.
- 그 일을 계속 해`working`근로자 검찰소까지
- 인정이 최종적 상태가 아닌 이유를 보여준다.

### `BoundedSseBuffer`

- 압력 아래의 진전을 융합하거나 떨어뜨리는
- 권위 있는 재검토가 필요하다는 기록
- 절대 최종 반응을 떨어뜨리지 않습니다.

### 회복 보조

- 프록시 안전 SSE 헤더 및 유지보수 의견을 반환
- 재결합 및 재결합 계획을 수립하고,
- 확산 재시험은 결정적 기하급수적 백코프와 스

## 사용 하 고

저장소 뿌리에서:

```bash
cd phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/code
python3 main.py
python3 -m unittest discover tests -v
```

이 데모는 중앙 경기의 양쪽을 실행하고, 거래 방식으로 실행합니다.
파일로 뒷받침된 임시 리저에 있는 분화된 돌연변이가
진행 버퍼, 그리고 승인된 취소에서 이동하는 영구적인 작업을 보여줍니다
노동자가 관찰한 취소

## 인터랙티브 연구소

잠자리를 추가하지 않고 네 번의 이벤트 순서를 실행하십시오.

1. 시작 요청`A`취소하고 전화해`complete()`- 그래
2. 시작 요청`B`, 완료하고 취소를 전달합니다.
3. 시작 요청`C`, 모든 비활성 기간 전에 진전을 발송하고, 최대 기간을 넘어서
4. 시작 요청`D`스트리메이블 HTTP를 통해 응답 스트림을 닫습니다.

각 시나리오에 대한 기록:

- 터미널 요청 상태
- 최종 대응이 있는지 여부는
- 전선에 배치된 취소 신호
- 어떤 사건으로 클라이언트가 무시해야 하는지

그럼 변해`D`이 작업은 동일하지만 취소 신호는 변경되어야 합니다.

## 연습 실험실

`reserve_inventory``MutationLedger`- 그래

요구 사항:

1. 키는 SKU, 양, 임차자, 운영 이름에 연결됩니다.
2. 동일한 키와 동일한 논증으로 다시 시도하면 첫 번째 예약이 반환됩니다.
3. 변경된 양으로 다시 시도하는 것은 또 다른 예약을 하지 않고 실패합니다.
4. 사형 집행이 이루어졌지만 그 대응을 잃은 것은 열쇠로 조화될 수 있습니다.
5. 그 결과 비밀이나 결제 데이터가 기록되지 않습니다.
6. 자동 재실험은 클라이언트가 열쇠를 제공하지 않은 경우 비활성화됩니다.
7. 본인 가입을 시뮬레이션하여 추가하고 다음으로 무엇을 해야 할지 결정하기 전에 재고 기록을 다시 작성하십시오.
8. 한 장벽에서 두 개의 리저 연결을 시작하여 동일한 키를 제출하십시오
   동시에 한 가지 예약이 이루어졌다고 주장합니다.
9. 첫 번째 반환된 예약 객체를 돌파하고 키를 다시 재생하고
   저장된 결과물은 변경되지 않았습니다.
10. 리저 파일을 닫고 다시 열고, 다음 키로 예약을 조정하십시오.

연구소를 정직하게 유지하세요: 재고가 다른 서비스에서 살고 있다면,
해당 서비스는 동일한 무제한 키를 받아들이거나 거래 우트박스
다리, 지역은 원격 효과에 대한 약속을 합니다.

## 배송된 유물

`outputs/skill-mcp-reliability-reviewer.md`MCP 운영, 운송, 타임아웃 정책, 재실습 행동, 줄을 정책 및 복구 계획을 제공합니다. 그것은 경주 테이블, 재실습 분류, 무력 제한, 흐름 제어 검사 및 실패 고정관념을 반환합니다.

## 확인 해 보

이 말 이 사실 이면 교훈 이 완성 됩니다.

- 스튜디오 취소 전송 `notifications/cancelled`그리고 아무런 응답도 받지 않습니다.
- 스트리밍 가능한 HTTP 취소는 요청 스트림을 닫고 취소 POST를 전송하지 않습니다.
- 완료 전에 취소하는 것은 최종 반응을 억제합니다.
- 취소 전 완전함은 응답을 보존하고 늦은 취소를 무시합니다.
- 진전이 비활성 시간제 재설정할 수 있지만 절대 최대 시간제
- 새로운 JSON-RPC ID만 있으면 다시 돌연변이를 실행합니다.
- 하나의 무력 키와 동일한 주장이 동시
  두 개의 연결 경주
- 약속된 기록은 다시 열려서 살아남고, 재연수는 방어적인 복사본을 반환합니다.
- 반환된 결과 하나를 돌파하는 것은 저장된 결과를 바꿀 수 없습니다.
- 제한된 버퍼는 용량 내에서 유지되며 최종 반응을 유지합니다.
- 리커넥트는 새로운 요청을 사용하며 전송하지 않습니다.`Last-Event-ID`, 그리고 영향을 받은 상태를 재검토합니다.
- `tasks/cancel`인정을 받는 것은 근로자가 그것을 준수할 때까지 종사자가 끝없는 일을 남겨두고 있습니다.

## 생산 실패 모드

| Failure | Observable symptom | Correct response |
|---------|--------------------|------------------|
| HTTP client POSTs cancellation notification | Server and client disagree about request lifetime | Close the request's SSE response stream |
| Server responds after accepted cancellation | Client receives an unusable late result | Stop work and suppress further messages when cancellation wins |
| Progress resets every deadline | Hung work survives forever | Keep a separate absolute maximum timeout |
| New RPC id treated as deduplication | Charge, deployment, or deletion runs twice | Add a durable application idempotency key |
| Key check and effect are separate | Concurrent workers both observe a missing key | Commit key claim, effect record, and result atomically |
| In-memory ledger used across replicas | Restart or another worker forgets prior commits | Use shared durable storage or upstream idempotency |
| Stored mutable result returned directly | Caller mutation corrupts later replays | Serialize committed results and return defensive copies |
| Key reused with changed arguments | One key aliases two business intents | Store and compare an argument fingerprint |
| Unbounded progress queue | Memory rises with a slow consumer | Coalesce and drop replaceable progress within a bound |
| Final response dropped under pressure | Client cannot know the request outcome | Reserve capacity or evict progress, never the final response |
| Proxy buffers SSE | Progress arrives in bursts or after timeout | Disable buffering and configure compatible proxy timeouts |
| `Last-Event-ID` assumed | Client resumes from state the server does not support | Reconnect with a new request and refetch |
| Every client reconnects immediately | Recovery creates another outage | Use capped exponential backoff with jitter |
| Task ack treated as final cancellation | Worker keeps running after UI says stopped | Poll the Task until a terminal status |

## 캡스톤 연결

도구 생태계 종결석은 신뢰성을 건축 다이어그램의 문항이 아닌 실행 가능한 증거로 간주해야 합니다.

이 유물을 요구합니다.

- 각 운송에 대한 취소 경주 기록 한 개
- 노출된 모든 돌연변이에 대한 재실험 테이블
- 이데모테니 키 기록 및 부합성 장치
- 동시 동일한 키의 변본, 재개 검사 및 돌연변이 표기 검사
- 제한된 버퍼 과부하 결과
- 역임성 SSE 헤더 및 비활성 정책
- 권위 있는 재결합 방법을 지정하는 재결합 계획
- 타스크를 사용하는 경우 영구적인 타스크 취소 추적

지역 과정에서의 녹색 요청은 행복한 길만을 증명합니다. 응답이 손실되고, 늦은 취소, 소비가 느리고, 떼가 다시 연결되면 결정적인 결과가 발생하면 최종 돌은 생산 준비가 됩니다.

## 주요 용어

| Term | Meaning |
|------|---------|
| Request cancellation | Abandonment of one in-flight MCP request |
| Cancellation race | Competition between terminal completion and cancellation events |
| Idle timeout | Limit since the last useful request activity |
| Maximum timeout | Absolute limit from request start, unaffected by progress |
| Idempotency key | Application identifier that deduplicates one business intent |
| Atomic ledger | Durable boundary that commits the key claim, effect record, and result as one unit |
| Backpressure | Control applied when producers outpace consumers |
| Progress coalescing | Replacing older progress with a newer authoritative value |
| Refetch | Reading current state again after a stream gap |
| Jitter | Deliberate variation that spreads retries across time |

## 더 많은 읽기

- [MCP Cancellation](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation)
- [MCP Progress](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/progress)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Tasks Extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
