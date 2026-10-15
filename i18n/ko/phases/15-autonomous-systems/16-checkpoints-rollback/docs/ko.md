# 체크포인트 및 롤백

> 그래프 상태의 모든 전환은 계속됩니다. 만약 노동자가 사고를 당하면 임대 계약이 만료되고 다른 노동자가 최후의 체크포인트에서 데려다줍니다. 클라우드플레어 내구성 객체는 몇 시간 또는 몇 주 동안 상태를 유지합니다. 제안하고 나서 약속 (강좌 15) 은 각 행동별로 역전 계획을 정의합니다. 행동 후 검증은 순환을 닫습니다. EU AI 법 제14조는 높은 위험 시스템에서 효과적인 인적 감독을 의무화합니다. 급성 실패 모드: 무력성 키와 전제 확인 없이, 일시적인 실패 후 재시험은 이미 승인된 동작을 두 번 실행할 수 있습니다. 그 결과, 그 결과로 확인이 이루어집니다.

**Type:** Learn
**Languages:** Python (stdlib, checkpoint and rollback state machine)
**Prerequisites:** Phase 15 · 12 (Durable execution), Phase 15 · 15 (Propose-then-commit)
**Time:** ~60 minutes

## 문제

지속가능한 실행 (강좌 12) 은 충돌된 에이전트를 재개할 수 있게 한다. 제안-그 다음-결정 (강좌 15) 은 승인된 액션을 감사할 수 있게 한다. 이 교훈은 이들에 합류한다. 승인된 액션이 부분적으로 실행되고, 충돌하고 재개될 때 무슨 일이 일어날 것인가? 언제 역전환이 실행되며 어떤 상태에 대항하는가?

실제 시스템은 이것을 다르게 전달합니다.

- **LangGraph**체크포인트에서 PostgreSQL에 대한 그래프 상태 전환을 모두 합니다. 작업자 충돌 시, 임대 계약이 풀리고 다른 작업자가 최신 체크포인트에서 재개합니다. 작업 흐름은 중지됩니다.`interrupt()`, 그 자체로 지속됩니다.
- **Cloudflare Durable Objects**몇 시간 또는 몇 주 동안 키 상태를 유지하여 승인된 동작을 위한 저장소와 계산을 공동으로 배치합니다.
- **Microsoft Agent Framework**노출`Checkpoint`작업 흐름 API에서 원시적인 요소; 재생과 무력함 은 재시험을 포함합니다.

모든 경우에 실제로 작동하는 조합은: 무력성 키 (중행 실행을 방지) + 전제 확인 (국가는 여전히 우리가 승인한 것이) + 후행성 검증 (사실 부작용이 발생) + 검증-실패를 되돌리는 것입니다.

## 개념

### 모든 전환은 계속됩니다

그래프 상태 전환은 일명 상태에서 다른 상태로 작업 흐름을 이동하는 모든 단계입니다. 순진한 구현은 특정 컴밋 포인트에서만 지속됩니다. 생산 구현은 모든 전환에 지속됩니다. 비용 (몇 명의 추가 작가는) 신뢰성 증가에 비해 작습니다 (재중 재생은 어디에서나 도착하고 임대 복구도 정확합니다).

### 임대상 재구성

작업자 한 명이 충돌하면 작업 흐름이 사라지지 않습니다. 임대 계약 (이 작업자가 이 실행을 수행한다는 단기적인 주장) 은 단순히 만료됩니다. 다른 작업자는 최신 점검 지점을 가져와 재개합니다. 임대 메커니즘은 생산 시스템들이 비행 작업에서 손실없이 롤링 배치에서 살아남을 수 있도록합니다.

### 무능력증과 전제 조건

이도전능력만으로는 충분하지 않습니다.$100 from A to B when balance > $1000". 작업 흐름은 수행되고, 실행 중간에 충돌하고, 재개됩니다. 만약 idempotency 키만 확인하고, 실행이 재개되면, 전송이 한 번 실행됩니다. 하지만 충돌과 재개 사이의 A의 균형이 다른 작업 흐름을 통해 $500로 떨어지는 것을 고려하십시오. idempotency 체크는 여전히 통과합니다. 전제 조건은 그렇지 않습니다. 전제 조건 검사 없이는, 우리는 오버드래프트를 전송합니다.

모든 결과적 행동에는 다음과 같은 것들이 모두 필요합니다.

- **Idempotency key**: 이중 실행을 방지합니다.
- **Precondition check**: 국가는 여전히 승인된 내용에 따라 일치한다는 것을 확인합니다.

### 행동 후 검증

"공기 반환 200"는 검증이 아닙니다. 실제 검증은 목표 상태를 다시 읽고 부작용이 실제로 발생했다고 확인합니다. 패턴:

- 데이터베이스 업데이트: `UPDATE ... RETURNING *`다시 반환된 라인 일치의 의도된 상태를 주장합니다.
- 이메일 전송: 전송 후 메시지 ID를 전송 폴더를 확인합니다.
- 파일 작성: 파일을 다시 읽고 해시하십시오.
- API 호출: 후속`GET`목표 자원에 대한

확인 실패하면 작업 흐름이 알려진 상태가 좋지 않습니다.

### 롤백 계획

제안 후 의무를 수행하는 모든 결과적 행동 (강좌 15) 은 반발 계획을 가지고 있다.

- **In-band rollback**: 부작용을 직접적으로 역전시키 (`DELETE`그 후`INSERT``Send-correction-email`발송 후)
- **Compensating transaction**: 원본을 중화시키는 새로운 행동 (표준 SAGA 패턴).
- **Out-of-band rollback**: 사람을 경각시키고, 작업 흐름을 중단하고, 나쁜 상태를 조사에 남겨두고

이 제안에 No-Oper rollback ("우리는 이것을 되돌릴 수 없다") 를 명명해야 한다. rollback 없이 하는 활동은 약속 시점에 HITL를 강화해야 한다 (강좌 15 도전과 응답).

### EU AI 법 제14조 운영적 독서

제 14조는 고위험 시스템들에 대한 "효율적 인 감독"을 요구한다. 운영적 측면에서 실행자들은 이를 다음과 같이 읽는다.

- 체크포인트는 감사의 검찰에 의해 검증될 수 있습니다.
- 롤백은 연습된다 (최소한 한 번 끝에서 끝으로 테스트된다).
- 감사 트레일은 배포를 살아남는다 (체크포인트 백엔드는 일시적이지 않습니다).
- 실패한 검증은 경고를 받으며 침묵으로 기록되지 않습니다.

검증+돌아가는 경로를 하지 않고 채용 중 충돌하고 부작용을 재개하고 완료하는 작업 흐름은 제14조 테스트를 통과하지 못한다.

### 급성 장애 모드: 두 번 실행

이 공간에서 가장 흔한 생산 사건:

1. 승인된 조치, 무력성 키 k.
2. 커밋 시작, 실행, 반환 200.
3. "공약" 상태가 지속되기 전에 작업 흐름이 충돌합니다.
4. 작업 흐름이 재개된다. " 승인되었지만 약속되지 않는다"를 볼 수 있습니다.
5. 부작용이 두 번 발사합니다.

완화: 실행 전에 "비행" 의도를 유지하고, idempotency 키로 실행하고, 그 다음 "공인"을 표시하면, 행동 후 확인이 성공하면 된다. 행동 발사 및 상태 작성 실패하면, 확인하고 (필요한 경우) 다시 발사하는 것을 알고 있다. 상태 작성 성공하고 동작이 실패하면, 복구 경로를 통해 확인하고 정확히 한번 발사한다.

```figure
checkpoint-replay
```

## 사용 하 고

`code/main.py`이 이 네 가지 시나리오를 시뮬레이션 합니다. 청정 실행, 충돌 후 재시험 (이 ??  ) , 전제 실패 (사격 없이 작업 흐름의 낙태), 실패 확인 (rollback 화재).

## 선박

`outputs/skill-rollback-rehearsal.md`제안된 작업 흐름에 대한 반향 시험 테스트를 설계하고 감사 추적 지속성을 위해 체크포인트 백엔드를 감사합니다.

## 운동

1. 달아`code/main.py`4가지 시나리오를 확인해 보세요. 사고 중의 사건에 대해 다시 한번 발사한 사건은 확인해 보세요.

2. "처음으로 표시하고, 다음으로 수행" 패턴을 수정하여 상태가 동작 후 화재를 작성합니다. 충돌 시나리오를 다시 실행합니다. 몇 개의 복제 동작이 발생하는지 측정합니다.

3. 특정 생산 활동 (예를 들어, "Slack 채널에 게시") 에 대한 반발 계획을 설계하십시오.

4. 알고 있는 하나의 작업 흐름을 선택하세요. 모든 상태 전환을 식별하세요. 각각의 지속성 요구사항을 표시하세요. 현재 지속되지 않는 작업을 계산하세요.

5. 반복적 인 롤백 테스트: 실제 작업 흐름을 실행하고 충돌하고 롤백 경로의 화재를 확인하는 종합 테스트를 설계하십시오. 테스트는 무엇을 주장합니까?

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Checkpoint | "Save point" | Every graph-state transition persists to a durable store |
| Lease | "Worker claim" | Short-lived claim that a worker is executing a run; expires on crash |
| Precondition | "State gate" | Assertion that the state is still consistent with the approved action |
| Post-action verify | "Re-read check" | Confirm the side effect actually happened in the target system |
| In-band rollback | "Direct undo" | Reverse the side effect with the inverse operation |
| Compensating transaction | "SAGA undo" | A new action that neutralizes the original |
| Mark-as-done-first | "Status write order" | Persist the committed status before returning from commit |
| Article 14 | "EU AI Act human oversight" | Operational: queryable checkpoints, rehearsed rollbacks, auditable trail |

## 더 많은 읽기

- [Microsoft Agent Framework — Checkpointing and HITL](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) 체크포인트 원시 및 임대 재구성
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) 상태 서브스트레이트로 지속 가능한 객체
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) 규제 기준
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 장기적인 작업 흐름에 대한 신뢰성 프레임
- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) 클로드 코드 루틴의 작업 흐름 형태.
