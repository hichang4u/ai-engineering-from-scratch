# 오픈아이 에이전트 SDK: 수송, 경비, 추적

> OpenAI 에이전트 SDK는 응답 API에 기반한 가벼운 멀티 에이전트 프레임워크입니다. 에이전트, 핸도프, 가드레일, 세션, 추적 다섯 원시: 핸도프는 도구입니다.`transfer_to_<agent>`- 경비선들은 입력이나 출력으로 이동합니다. 추적은 기본적으로 작동합니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## 학습 목표

- OpenAI 에이전트 SDK의 다섯 가지 원시적인 이름을 명명하십시오.
- 손잡이를 설명하십시오. 왜 도구로 모델링되는지, 모델이 어떤 이름 모양을 보는지, 그리고 맥락이 어떻게 전달되는지 설명하십시오.
- 입력 보호, 출력 보호, 도구 보호 구분; 설명 `run_in_parallel`차단 모드
- 손잡이 + 경비 + 스탠 스타일 추적을 통해 stdlib 실행 시간을 구현하십시오.

## 문제

순수하게 위임할 수 없는 에이전트는 모든 것을 하나의 프롬프트에 넣을 수 있습니다. 방위 없이 있는 에이전트는 PII를 전송하거나 정책 위반 출력 또는 영원히 루프를 전송합니다. OpenAI의 SDK는 멀티 에이전트의 작업을 처리할 수 있도록 하는 세 가지 원시적인 것을 코딩합니다.

## 개념

### 5개의 원시

1. **Agent.**LLM + 지침 + 도구 + 수여
2. **Handoff.**다른 에이전트에 위임. 모델에 의해 이름의 도구로 표현됩니다 `transfer_to_<agent_name>`- 그래
3. **Guardrail.**입력 (첫 번째 에이전트만), 출력 (최후 에이전트만) 또는 도구 호출 (함수 도구당) 에 대한 검증.
4. **Session.**자동 대화 역사
5. **Tracing.**LLM 세대들을 위한 내장된 스캔, 도구 호출, 전달, 보호막.

### 도구로 전달

모델이 보고 있어요`transfer_to_billing_agent`도구 목록에 표시된 것인데,

1. 대화 컨텍스트를 복사하거나 `nest_handoff_history`베타)
2. 목표물 요원을 지시사항으로 초기화해
3. 목표 대리인과 계속 달아나봐

이것은 감독 패턴 (강좌 13 / 강좌 28) 입니다.

### 경비선

세 가지 맛:

- **Input guardrails.**첫 번째 에이전트의 입력에 따라 실행하세요. 안전하지 않은 또는 범위를 벗어난 요청을 거부합니다. LLM 호출 전에.
- **Output guardrails.**마지막 에이전트의 출력을 실행해, PII 누출, 정책 위반, 잘못된 응답을 잡아라.
- **Tool guardrails.**기능별 도구를 실행하세요. 논증들을 검증하고, 권한들을 확인하고, 감사 실행을 합니다.

모드:

- **Parallel**(전립) Guardrail LLM는 메인 LLM와 함께 실행됩니다. 낮은 꼬리 지연.
- **Blocking**(`run_in_parallel=False`가드레일 LLM가 먼저 실행됩니다. 만약 걸림돌을 당하면, 메인 통화에서 토큰이 낭비되지 않습니다.

삼각선 `InputGuardrailTripwireTriggered`- `OutputGuardrailTripwireTriggered`- 그래

### 추적

모든 LLM 세대, 도구 호출, 전달, 보호레일`OPENAI_AGENTS_DISABLE_TRACING=1`선택합니다.`add_trace_processor(processor)`팬들은 OpenAI와 함께 여러분의 자원을 확장합니다.

### 세션

`Session`백엔드 (SQLite, Redis, 사용자 정의) 에서 대화 역사를 저장합니다. `Runner.run(agent, input, session=session)`자동 로드 및 부착

### 이 패턴이 잘못되는 곳

- **Handoff drift.**에이전트 A가 B에게 넘겨주면 A에게 돌려주면
- **Guardrail bypass.**도구 보호막은 기능 도구에만 불립니다. 내장된 도구 (파일 리더, 웹 검색) 는 별도의 정책이 필요합니다.
- **Over-tracing.**민감한 콘텐츠를 랜즈에 결합하여 OTel GenAI 콘텐츠 캡처 규칙 (강좌 23)  외부 저장, ID에 의해 참조.

```figure
ae-agent-handoff
```

## 건설 해

`code/main.py`stdlib에서 SDK 형태를 구현합니다:

- `Agent``FunctionTool``Handoff`(전환 의미론을 가진 함수 도구로)
- `Runner`입력/출력/기구 보호장, 출력 배송장, 홉 카운터
- 흔적을 보여주는 간단한 스탠 에미터
- 사용자의 요청에 따라 청구 또는 지원에 대한 배열 대리인이; 한 입력으로 경비선 여행.

실행하세요:

```
python3 code/main.py
```

이 흔적이 두 번의 성공적인 전달, 하나의 입력 경비선 여행, 그리고 실제 SDK의 방출을 반영하는 스펜 트리를 보여줍니다.

## 사용 하 고

- **OpenAI Agents SDK**오픈AI-첫 제품
- **Claude Agent SDK**(강좌 17) 클로드-프라이스트 제품
- **LangGraph**(강좌 13) 정해진 상태와 지속 가능한 재개정
- **Custom**정확한 제어 (소음, 다중 공급자, 연방 배치) 를 필요로 할 때

## 선박

`outputs/skill-agents-sdk-scaffold.md`세트레이지 에이전트, 핸드오프, 입력/출력/기구 보호장, 세션 저장장치 및 추적 프로세서를 가진 Agents SDK 앱을 스탠포드합니다.

## 운동

1. 프 카운터를 추가해: N 전송 후 거부, 행동을 추적해 보세요.
2. 시행`nest_handoff_history`선택의 여건으로  이전 메시지를 전송하기 전에 하나의 요약으로 쪼개라
3. 차단 출력 경비선을 작성하고, 이를 방해하는 명령어들의 지연률을 지나가는 명령어들과 비교해 보세요.
4. 전선`add_trace_processor`JSON 로거에 어떤 모양을 니다?
5. SDK 문서들을 읽어보고, STDlib 장난감을`openai-agents-python`무슨 모델이 잘못됐어요?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | "LLM + instructions" | Agent type in the SDK; owns tools and handoffs |
| Handoff | "Transfer" | Tool the model calls to delegate to another agent |
| Guardrail | "Policy check" | Validation on input / output / tool invocation |
| Tripwire | "Guardrail trip" | Exception raised when guardrail rejects |
| Session | "History store" | Conversation memory persisted between runs |
| Tracing | "Spans" | Built-in observability over LLM + tool + handoff + guardrail |
| Blocking guardrail | "Sequential check" | Guardrail runs first; no token waste on trip |
| Parallel guardrail | "Concurrent check" | Guardrail runs alongside; lower latency, wastes tokens on trip |

## 더 많은 읽기

- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 원시물, 송신물, 경비물, 추적물
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) 클로드 맛의 반품
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 언제부터 횡포를 받을 수 있을까요?
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 표준 에이전트 SDK는
