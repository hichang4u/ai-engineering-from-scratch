# '인' - '인' - '자신'

> HITL에 대한 2026년 합의는 구체적입니다. " 에이전트가 요청하는 것이 아니라 사용자가 승인하는 것을 클릭합니다. " 그것은 제안-이후-예약입니다: 제안된 행동은 idempotency 키로 내구성 스토어에 계속됩니다. 의도, 데이터 라인업, 터치 된 권한, 폭발 반경 및 롤백 계획을 가진 리뷰어에게 나타납니다. 긍정적 인 인정을 받은 후에만 수행됩니다. 부작용이 실제로 발생했는지 확인하기 위해 실행 후 확인됩니다. 랭그그래프의`interrupt()`+ PostgreSQL 체크포인팅, 마이크로소프트 에이전트 프레임워크의 `RequestInfoEvent`, 그리고 클라우드플레어의`waitForApproval()`모든 경우 동일한 형태를 구현합니다. 정통적 실패 모드는 고무표 승인을합니다. " 승인하세요?"는 검토 없이 클릭됩니다. 문서화된 완화는 명시적인 체크리스트로 도전과 응답입니다.

**Type:** Learn
**Languages:** Python (stdlib, propose-then-commit state machine with idempotency)
**Prerequisites:** Phase 15 · 12 (Durable execution), Phase 15 · 14 (Tripwires)
**Time:** ~60 minutes

## 문제

에이전트가 행동을 취한다. 사용자는 승인 여부를 결정해야 한다. 결정이 즉각적이라면, 그것은 아마도 검토가 아닐 것이다. 결정이 구조화된다면, 그것은 느린 것이지만 신뢰할 수 있는 것이다. 엔지니어링 문제는 구조화된 검토를 어떻게 최소 저항의 경로로 만들 것인가에 관한 것입니다.

2023년 HITL 패턴은 동기화된 요청이었습니다. " 에이전트가 Y  인증을 가진 X에 이메일을 보내기를 원합니까?" 사용자는 승인 클릭합니다. 모든 사람들은 시스템이 안전하다고 생각합니다. 실제 이 표면은 고무로 많이 표기됩니다. 사용자는 빠르게 승인하고, 승인이 예측하는 것은 거의 없습니다. 에이전트가 잘못되면 감사 트레일은 사용자가 회수할 수 없는 긴 승인 역사를 보여줍니다.

2026 패턴은 HITL를 내구성 서브스트레이트에 이동시키고 구조화된 메타데이터를 붙이고 긍정적인 컴백을 요구합니다. 관리된 모든 에이전트 SDK는 버전: LangGraph를 배포합니다.`interrupt()`, 마이크로소프트 에이전트 프레임워크`RequestInfoEvent`, 클라우드플레어`waitForApproval()`API 이름은 다르지만 형태는 다르지 않습니다.

## 개념

### 제안하고 나서 공약하는 국가 기계

1. **Propose.**에이전트는 제안된 동작을 생성합니다. 내구성 저장소 (PostgreSQL, Redis, 내구성 객체) 에 계속됩니다. 다음을 포함합니다.
   - 의도는 (왜 에이전트가 이렇게 하는 건지)
   - 데이터 혈통 (이 제안에 어떤 원천이 동원했는가)
   - 사용 권한 (어떤 범위 / 파일 / 엔드포인트)
   - 폭발 반경 (최고의 경우)
   - 반전 계획 (행위된 경우 어떻게 해제할 수 있는지)
   - 무효 키 (예약마다 고유한 경우, 재 제출은 동일한 기록을 반환합니다)
2. **Surface.**리뷰어는 모든 메타데이터로 제안서를 보고 있습니다. 리뷰어는 개인입니다 (개인을 검토하는 에이전트가 아닙니다).
3. **Commit.**긍정적으로 확인, 실행
4. **Verify.**실행 후 부작용이 다시 읽혀 확인됩니다. 확인 단계가 실패하면 시스템이 알려진 나쁜 상태가 되어 경고가 활성화됩니다.

### 무력성 키

이동성 키가 없으면 일시적 실패 후 재시행은 승인된 동작을 두 번 실행할 수 있다. 구체적인 예: 사용자가 "A에서 B로 $100를 전송한다"는 네트워크 블립을 승인한다. 작업 흐름 재시행. 사용자가 한 번 승인했지만 전송은 두 번 실행된다. 이동성 키는 승인과 단일, 고유한 부작용을 연결하고, 두 번째 실행은 노-오프이다.

이것은 Stripe 및 AWS API가 사용하는 동일한 무력성 패턴입니다. 에이전트 승인에 재사용하는 것은 마이크로소프트 에이전트 프레임워크 문서에서 명시되어 있습니다.

### 내구성: 승인 과정이 왜 오래 걸리는지

승인 대기실은 에이전트가 소유하지 않는 상태의 조각입니다. 작업 흐름은 일시 중지됩니다 (학습 12). 승인 도착하면 작업 흐름은 정확히 그 시점에서 재개됩니다. 이것이 LangGraph 짝짓기 이유입니다.`interrupt()`PostgreSQL 체크포인팅과 함께, 단지 메모리 상태가 아닌 2일 후 승인으로 작업 흐름이 여전히 손상되지 않습니다.

### 고무표 승인을 하고 도전과 대응 완화

HITL의 기본 UI (" 승인 / 거부 " 버튼) 은 진정한 검토 없이 빠른 승인을 생성합니다. 문서화 완화: 승인 버튼이 활성화되기 전에 특정 질문에 긍정적 답변을 요구하는 도전 및 응답 체크리스트. 구체적 모양:

- "이것이 어떤 자원에 영향을 미치는지 아시나요?"
- "폭탄 반경이 허용되는지 확인했나요?"
- "이번 일이 실패하면 다시 돌아가는 계획이 있나요?"

관료주의가 아니라 그 자체로  강제 기능. 상자를 틱할 수 없는 리뷰어는 명확화를 요청한다 (스케랄) 또는 거절한다 (안전 기본).

### 그 결과로 무엇이 중요할까요?

모든 행동에는 제안-그 다음의 약속이 필요하지는 않습니다. 2026의 지침:

- **Consequential actions**(항상 HITL): 돌이킬 수 없는 기록, 금융 거래, 출력 통신, 생산 데이터베이스 변경, 파괴적인 파일 시스템 운영.
- **Reversible actions**(때문으로는 HITL): 로컬 파일의 편집, 스테이지-엔브 변경, 명확한 롤백으로 되돌릴 수 있는 글쓰기.
- **Reads and inspections**(never HITL): 파일을 읽고, 리소스를 나열하고, 읽기 전용 API를 호출합니다.

### 행동 후 검증

"commit ran"는 "사용 효과가 발생했다"와 동일하지 않습니다. 네트워크 파티션 및 레이스 조건은 백엔드가 지속되지 않은 동안 성공했다고 생각하는 작업 흐름을 생성 할 수 있습니다. 확인 단계에서는 확인을 위해 약속한 후 목표 자원을 다시 읽습니다. 이것은 데이터베이스 거래와 동일한 패턴입니다.`RETURNING`조항 또는 AWS`GetObject`그 후`PutObject`- 그래

### EU AI 법 제14조

제14조는 EU 내 고위험 인공지능 시스템들에 대한 효과적인 인간 감독을 의무화하고 있다. "효율적"은 장식적인 것이 아니다. 규제 언어는 특별히 고무표 패턴을 배제한다. 도전과 응답으로 제안-그 다음-실제하는 것은 마이크로소프트 에이전트 지배 도구 킷의 준수 문서에서 제14조 심사를 살아남은 형태이다.

```figure
mx-propose-then-commit
```

## 사용 하 고

`code/main.py`stdlib Python에서 제안-이-실제 상태 기계를 구현합니다. 내구 저장소는 JSON 파일입니다. Idempotency 키는 (thread_id, action_signature) 의 해시입니다. 드라이버는 세 가지 경우를 시뮬레이션합니다. 청정 승인 흐름, 일시적인 실패 후 재 시도 (이 두 번 실행해서는 안되며), 그리고 고무 스탬프 기본 설정과 도전 및 응답 흐름.

## 선박

`outputs/skill-hitl-design.md`제안하고 나서 실행하는 형태를 위한 제안된 HITL 작업 흐름을 검토하고, 미흡한 메타데이터, 무력성, 검증 또는 도전 및 응답 계층을 표시합니다.

## 운동

1. 달아`code/main.py`. 승인된 제안의 재 시도는 지속 가능한 기록을 사용하고 재 실행되지 않는다는 것을 확인합니다. 이제 시간표를 포함하도록 무력성 키를 변경하고 재 시도의 두 번 실행을 표시합니다.

2. 제안서 기록을 확장하여`rollback`시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션 시뮬레이션

3. 마이크로소프트 에이전트 프레임워크를 읽어보세요 `RequestInfoEvent`도큐스. 한 메타데이터 필드를 식별하여 API는 장난감 엔진이 빠진 것을 포함합니다. 그것을 추가하고 보호되는 것을 설명합니다.

4. 특정 행동 (예를 들어, "공공적인 트위터 계정에 게시") 에 대한 도전과 응답 체크리스트를 설계하십시오. 리뷰어는 어떤 세 가지 질문에 대답해야 합니까? 왜 세 가지에 대해?

5. " 승인"라는 동기화 된 명령이 충분 한 경우 한 가지 를 선택 하십시오. (성장 한 저장소 가 필요 하지 않습니다). 그 이유 를 설명 하고, 당신이 받아들이는 위험 범위를 명명 하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Propose-then-commit | "Two-phase approval" | Persisted proposal + positive commit + verify |
| Idempotency key | "Retry-safe token" | Unique per proposal; second execution no-ops |
| Data lineage | "Where it came from" | The specific source content that led to the proposal |
| Blast radius | "Worst case" | Scope of effect if the action goes wrong |
| Rubber-stamp | "Fast approval" | "Approve" clicked without genuine review |
| Challenge-and-response | "Forcing checklist" | Reviewer must positively acknowledge specific questions |
| RequestInfoEvent | "MS Agent Framework primitive" | Durable HITL request with structured metadata |
| `interrupt()` / `waitForApproval()` | "Framework primitives" | LangGraph / Cloudflare equivalents of the same shape |

## 더 많은 읽기

- [Microsoft Agent Framework — Human in the loop](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop)`RequestInfoEvent`, 내구성 인정을
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/)`waitForApproval()`그리고 내구성 물체
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) HITL는 장기적인 위험의 완화제로서
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) 고위험 시스템에서의 규제 기준
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 감독을 둘러싼 헌법적 틀
