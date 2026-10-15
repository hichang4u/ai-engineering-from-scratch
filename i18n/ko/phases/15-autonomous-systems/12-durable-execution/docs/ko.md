# 장기간 실행되는 배경 요원: 지속가능한 집행

> 생산 장거리 요원은 실행되지 않습니다 `while True`. LLM 호출은 체크포인트, 재시험 및 재연으로 활동이 됩니다. 템포럴의 OpenAI 에이전트 SDK 통합은 2026년 3월 GA가 되었습니다. 클로드 코드 루틴 (안트로피크) 는 지속적인 로컬 프로세스 없이 일정한 클로드 코드 인보를 실행합니다. 세션은 인력 입력에 일시 중지하고, 배포를 생존하고, 최신 체크포인트에서 다시 시작됩니다.`thread_id`새로운 에르고노미는 새로운 입력으로 오래된 패턴을  작업 흐름의 오케스트레이션 에 : LLM는 회복에 결정적으로 재생되어야 할 비 결정적인 활동으로 호출합니다.

**Type:** Learn
**Languages:** Python (stdlib, minimal durable-execution state machine)
**Prerequisites:** Phase 15 · 10 (Permission modes), Phase 15 · 01 (Long-horizon agents)
**Time:** ~60 minutes

## 문제

4시간 동안 실행되는 에이전트를 생각해 보세요. 3개의 도구를 호출하고, 2번 사용자에게 요청하고, 40번의 LLM 전화를 합니다. 반쯤이면 호스트가 다시 시작됩니다. 어떻게 될까요?

- 순진한 사람`while True`루프: 모든 것이 손실됩니다. 실행은 처음부터 다시 시작합니다. 세 가지 도구 호출 (실제 부작용) 은 다시 실행됩니다. 사용자가 이미 승인한 것들을 다시 요청합니다. 40 개의 LLM 호출은 다시 청구됩니다.
- 지속가능한 실행: 실행은 가장 최근의 체크포인트에서 재개됩니다. 이미 완료된 활동은 다시 실행되지 않습니다. 그 결과는 지속가능한 로그에서 다시 재생됩니다. 사용자는 이미 승인한 것을 다시 승인하지 않습니다. 이미 수행 된 LLM 호출은 다시 청구되지 않습니다.

이것은 10년 동안 작업 흐름 엔진이 선보인 동일한 패턴입니다. (템포럴, 캐덴스, 우버의 체라미) 새로운 것은 LLM 호출이 이제 일종의 활동이 되었으며, 결정적이지 않고, 비용이 많이 들며, 부작용이 있습니다. 그리고 그들은 이 패턴에 깔끔하게 적합합니다.

수업의 주제는: 장기적 신뢰성 붕괴 (METR는 "35분 저하"를 관찰합니다.  성공률은 지평선과 함께 대략 사각형적으로 떨어집니다.)

## 개념

### 활동, 작업 흐름 및 재생

- **Workflow**: 결정적 오케스트레이션 코드. 활동, 가지, 대기 순서를 정의합니다.
- **Activity**: 비 결정적, 잠재적으로 실패하는 작업 단위. LLM 호출, 도구 호출, 파일 작성, HTTP 요청. 각 활동은 입력과 (완전 한 번) 출력으로 기록됩니다.
- **Event log**: 내구성 백업 스토어 모든 활동 시작, 완료, 실패, 재시험, 그리고 모든 작업 흐름 결정이 기록됩니다.
- **Replay**: 복구 시, 작업 흐름 코드는 시작부터 다시 실행됩니다. 이미 완료된 모든 활동은 다시 실행하지 않고 기록된 결과를 반환합니다. 실제로 완료되지 않은 활동만 실행됩니다.

이것은 React이 가상 DOM에 대해 재전생하는 것과 같은 형태입니다. 또는 Git이 컴티트에서 작동하는 나무를 재건하는 것과 같습니다. 오케스트레이터에서의 결정주의는 내구성을 저렴하게 만듭니다.

### LLM 호출이 패턴에 맞게 된 이유

LLM 호출은:
- 결정적이지 않은 (온도는 > 0; 심지어는 0 온도는 모델 버전에서 변한다).
- 비용이 많이 들어요 (돈과 지연)
- 잠재적으로 실패 (금속 제한, 시간제)
- 부작용 (용품을 호출하면)

이것은 바로 활동 프로필입니다. LLM 호출을 하나의 활동으로 종합하면 기하급수적인 백코프로 다시 시도하고, 다시 시작을 확인하고 디버깅을 위한 재생 가능한 추적을 제공합니다.

###                                        `thread_id`

랭그라프, 마이크로소프트 에이전트 프레임워크, 클라우드플레어 내구성 객체, 클로드 코드 루틴 모두 같은 API 모양에 합쳐졌습니다.`thread_id`(또는 동등한) 는 세션을 식별합니다. 각 상태 전환은 백엔드로 계속됩니다. (PostgreSQL 기본, dev의 SQLite, 캐시의 Redis); 재개는 최신 체크포인트를 읽습니다.

백엔드 선택은 중요합니다.

- **PostgreSQL**: 내구성, 검색 가능, 배포를 생존합니다.
- **SQLite**: 로컬-dev만; 호스트에서 데이터를 잃습니다.
- **Redis**: AOF/스냅샷을 구성하지 않는 한 빠른 하지만 일시적인
- **Cloudflare Durable Objects**: 투명하게 분포되고, 고유한 키로 범위를 넓혀서, 몇 시간 또는 몇 주 동안 생존한다.

### 인간 입출은 1급 국가로서

제안 후 의뢰 (강좌 15) 은 지속 가능한 "인간의 대기" 상태를 요구합니다. 작업 흐름은 일시 중지하고, 외부 계열은 대기 중인 요청을 유지하며, 승인은 정확히 그 시점에서 재개됩니다. 지속성이 없으면 이것은 최선의 노력입니다.

### 35분 동안의 해상

METR는 측정된 모든 에이전트 클래스는 지속적인 작동의 ~35분 이상 신뢰성 붕괴를 나타낸다고 관찰했다. 작업 기간을 두 배로 하면 실패율이 4배 정도 됩니다. 내구성 실행은 이것을 해결하지 않습니다. 신뢰성 프로파일에서 지원하는 것보다 더 오래 실행할 수 있습니다. 안전 패턴은 재입시에 신선한 HITL가 필요한 체크포인트와 내구성 (비용) 를 결합하고, 벽 시계 시간에도 불구하고 전체 계산을 제한하는 예산 소멸 스위치 (강좌 13) 과 결합하는 것입니다.

### 만약 지속가능한 실행이 잘못된 답이 될 때

- 인간 출입 없이 몇 분 이상 짧은 운행.
- 독서만 가능한 정보 검색
- 정확성이 필요한 작업은 하나의 컨텍스트 창 내에서 엔드-투-엔드 (일부 추론 작업, 일회성 생성) 이다.

```figure
memory-consolidation
```

## 사용 하 고

`code/main.py`stdlib 파이썬에서 최소 내구성 실행 엔진을 구현합니다.

- `@activity`JSON 이벤트 로그에 입력 및 출력을 기록하는 디코레이터
- 작업 흐름을 순서로 하는 작업 흐름 기능
- A`run_or_replay(workflow, event_log)`완료된 작업을 다시 실행하지 않고 재현하는 기능

드라이버는 3가지 활동의 작업 흐름을 시뮬레이션하고, 절반 정도가 떨어져서 (a) 모든 것을 다시 실행하는 순진한 시도를 보여 주며 (b) 부족한 활동만을 실행하는 재연전입니다.

## 선박

`outputs/skill-durable-execution-review.md`올바른 지속가능한 실행 형태를 위해 제안된 장기적인 에이전트 배포를 검토합니다.

## 운동

1. 달아`code/main.py`. 순수한 재시험과 재시험 사이의 활동-실행 수수의 차이를 관찰하고 충돌 지점을 변경하고 그에 따라 재시행 수치가 변경되는 것을 표시합니다.

2. 장난감 엔진을 사용하도록 변환합니다`thread_id`두 개의 동시 세션이 엔진을 공유하는 것을 시뮬레이션하고 이벤트 로그가 충돌하지 않는다는 것을 확인합니다.

3. 장난감 엔진의 한 가지 활동을 예로 들 수 있다. 결정된 작업 흐름 내부에 비결제 (벽 시계 시간표) 를 도입한다. 반복에서 차이를 보여준다. 실제 엔진이 이것을 어떻게 처리하는지 설명한다.`Workflow.now()`API)

4. 랭체인 "생산 깊음 요원 뒤에 실행 시간" 게시물을 읽어 보세요. 실행 시간이 지속되는 모든 상태를 나열하고 각각의 실패 모드가 어떤 상태를 포함하는지 지정하십시오.

5. 6시간 동안 자율적인 코딩 작업을 위해 체크포인트 정책을 설계하세요. 어디 체크포인트가 있나요? 재개-중 충돌이 어떻게 생겼나요? 새로운 HITL가 필요한 것은 무엇입니까?

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Workflow | "Agent's script" | Deterministic orchestration code; replayable from event log |
| Activity | "A step" | Non-deterministic unit (LLM call, tool call); logged before and after |
| Event log | "The backing store" | Durable record of every state transition |
| Replay | "Resume" | Re-run workflow; completed activities return logged results without re-execution |
| Checkpoint | "Save point" | Persisted state keyed by thread_id; latest-wins on resume |
| thread_id | "Session key" | Identifier that scopes durable state |
| 35-minute degradation | "Reliability decay" | METR: success rate drops ~quadratically with horizon |
| Non-determinism | "Drift on replay" | Wall clock, random, LLM output; must be registered as side effect |

## 더 많은 읽기

- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) 예산, 회전, 그리고 재개 의미론
- [Microsoft — Agent Framework: human-in-the-loop and checkpointing](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) 요청정보 이벤트 형태
- [LangChain — The Runtime Behind Production Deep Agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) 구체적인 실행 시간 요구 사항
- [OpenAI Agents SDK + Temporal integration (Trigger.dev announcement)](https://trigger.dev) LLM 초청의 활동 형태
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 35분 정도의 퇴화 기준
