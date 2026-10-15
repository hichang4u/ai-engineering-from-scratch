# 도구 사용 및 기능 호출

> 툴포머 (Schick et al., 2023) 는 자율 감독 도구 해설을 시작했습니다. 버클리 함수 호출 레더보드 V4 (Patil et al., 2025) 는 2026 바를 설정합니다. 40% 요원, 30% 다중 회전, 10% 라이브, 10% 비 라이브, 10% 환각. 단일 회전 해결됩니다. 메모리, 역동적 의사 결정 및 긴 지평선 도구 연쇄는 아닙니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 13 · 01 (Function Calling Deep Dive)
**Time:** ~60 minutes

## 학습 목표

- Toolformer의 자율 감독 훈련 신호를 설명하십시오. 실행이 다음 토큰 손실을 줄일 때만 도구 해설을 유지하십시오.
- BFCL V4의 다섯 가지 평가 범주와 각 범주의 측정 사항을 명명하십시오.
- 스키마 검증, 주장 강제 및 실행 샌드박스링으로 stdlib 도구 레지스트리를 구현하십시오.
- 2026년 3가지 개방된 문제를 진단하세요. 장기적인 도구 연쇄, 동적 의사결정 및 메모리.

## 문제

초기 도구 사용은 질문: 모델은 올바른 함수 호출을 예측할 수 있습니까? 현대 도구 사용은 질문: 모델 체인 도구는 40 단계, 메모리와 함께 부분적인 관찰 가능, 도구 실패에서 복구 할 수 있습니까?

툴퍼머는 기본 라인을 설정했습니다. 모델들은 자율 감독으로 도구를 호출할 때 배울 수 있습니다. BFCL V4는 2026 평가 목표를 정의합니다.

## 개념

### 도구판 (Schick et al., NeurIPS 2023)

아이디어: 모델이 후보 API 호출과 함께 자신의 사전 훈련 코퍼스를 해설하도록 한다. 각 후보에 대해 실행하십시오. 도구 결과를 포함하면 다음 토큰의 손실을 줄일 수 있을 경우에만 해설을 유지하십시오. 필터링 된 코퍼스에 정렬하십시오.

포함된 도구: 계산기, QA 시스템, 검색 엔진, 번역기, 달력. 자율 감독 신호는 도구가 텍스트를 예측하는 데 도움이되는지에 대한 것입니다.

규모 결과: 도구 사용은 규모로 나타납니다. 도구 해설로 인해 작은 모델이 손상되고, 큰 모델이 증가합니다. 이 때문에 2026 국경 모델은 강력한 도구 사용이 구워있는 반면 7B 모델 대부분은 신뢰할 수 있도록 명시적인 도구 사용 미세 조정이 필요합니다.

### 버클리 함수 호출 레더보드 V4 (파틸 등, ICML 2025)

BFCL는 2026년 실질적인 평가입니다. V4 구성:

- **Agentic (40%)** 전체 요원 궤도: 메모리, 다중 회전, 역동적 결정.
- **Multi-Turn (30%)** 도구 체인과의 대화
- **Live (10%)** 사용자로부터 제출된 실제 명령어 (더 어려운 배포)
- **Non-Live (10%)** 합성 시험 케이스
- **Hallucination (10%)** 어떤 도구도 호출해서는 안 되는 것을 감지합니다.

V3는 상태 기반 평가 (state-based evaluation) 를 도입하였다. 도구 순서 후, 도구 호출의 AST에 해당하는 대신 API의 실제 상태를 확인하십시오. V4는 웹 검색, 메모리 및 형식 민감성 범주를 추가했습니다.

2026년 핵심 연구결과: 단일 회전 함수 호출은 거의 해결되었습니다. 실패는 메모리에 집중됩니다 (회전 간 맥락을 가져가는), 동적 의사결정 (사진 결과를 기반으로 도구를 선택), 긴 지평 연쇄 (20+ 단계 후 유동), 그리고 환각 탐지 (툴이 적합하지 않을 때 호출하는 것을 거부합니다).

### 도구 스케마

모든 공급자는 스키마를 가지고 있습니다. 그들은 세부 사항에 차이가 있지만 같은 형태를 공유합니다.

```
name: string
description: string (what it does, when to use it)
input_schema: JSON Schema (properties, required, types, enums)
```

인류적 사용법`input_schema`직접적으로 사용 합니다.`function.parameters`. 둘 다 JSON 스키마를 받아들이고 있습니다. 설명은 부담을  모델은 올바른 도구를 선택하기 위해 읽습니다. 나쁜 도구 설명은 잘못된 도구를 선택 실패의 # 1 근본 원인입니다.

### 논증 검증

도구 호출을 신뢰하지 마십시오. 유효성:

1. **Type coercion.**모델은 스키마가 int라고 하는 문자열 "5"을 반환할 수 있습니다. 명확하지 않은 경우 강제; 그렇지 않은 경우 거부합니다.
2. **Enum validation.**만약 스케마에`status in {"open", "closed"}`그리고 모델 방출`"in_progress"`, 설명 오류로 거절합니다.
3. **Required fields.**missing required field -> 즉각적인 오류 관찰 모델로 돌아, 충돌이 아닙니다.
4. **Format validation.**날짜, 이메일, URL는  콘크리트 파서로 검증되며, 레전스 (regex) 로 검증되지 않습니다.

검증 실패마다 모델이 올바른 모양으로 다시 시도할 수 있도록 구조화된 관찰을 반환해야 합니다.

### 병렬 도구 호출

현대 공급자는 보조자 회전에서 병렬 도구 호출을 지원합니다.

1. 모델은 3개의 뚜렷한 툴 호출을 전송합니다.`tool_use_id`S.
2. 실행시간은 실행한다 (독립된 경우 평행).
3. 각각의 결과는`tool_result``tool_use_id`- 그래

공학 규칙: 상관관계 ID를 부담으로 취급하고 교환하면 잘못된 도구에서 잘못된 결과로 라우팅을 얻을 수 있습니다.

### 샌드박스

도구 실행은 모래 상자 경계입니다. 자세한 내용은 레슨 09 참조하십시오. 짧은 버전: 모든 도구는 읽기/쓰기 표면, 네트워크 액세스, 시간 종료, 메모리 캡을 지정해야합니다. 일반 `run_shell(cmd)`적색 깃발이 있습니다.`git_status()`더 안전합니다.

```figure
tool-routing
```

## 건설 해

`code/main.py`생산형 도구 레지스트리를 시행합니다.

- JSON Schema 하위 집합 검증기 (stdlib만)
- 설명, 입력 스케마, 타임아웃 및 실행자를 가진 도구 등록
- 주장의 강제와 ENUM 검증
- 상관관계 인증을 가진 병렬 도구 배포
- 구조화된 문자열으로 오류 관측

실행하세요:

```
python3 code/main.py
```

추적은 미니 에이전트가 한 차례에 3 개의 도구를 호출하고, 의도적으로 잘못된 호출을 통해 모델이 행동 할 수있는 설명 오류로 거절되는 것을 보여줍니다.

## 사용 하 고

모든 공급업체는 자체 도구 스케마를 가지고 있습니다. Anthropic, OpenAI, Gemini, Bedrock. 멀티 공급업체가 필요한 경우 번역 계층 (OpenAI 에이전트 SDK, Vercel AI SDK, LangChain 도구 어댑터) 을 사용하십시오. BFCL는 참조 기준입니다.

## 선박

`outputs/skill-tool-registry.md`주어진 작업 도메인에 대한 도구 카탈로그, 스케마 및 레지스트리를 생성합니다. 설명 품질 검사를 포함합니다 (모든 도구의 설명은 모델을 언제 사용할지 알려줍니다?).

## 운동

1. 모델이 다른 도구를 사용하기를 명시적으로 거부할 수 있는 "no-op" 도구를 추가하십시오. BFCL와 같은 환각 테스트에서 측정하십시오.
2. 인트-아스트링과 플롯-아스트링의 주장 강제 적용. 강제에서 진짜 버그를 숨기기게 되는 것은 어디서 시작되는 걸까요?
3. 도구마다 타임아웃과 회로 차단기를 추가하십시오. ( 3 번 연속 실패 후 60 년 동안 도구를 거부하십시오). 모델이 회복하는 방법에 대해 무엇이 달라집니다?
4. BFCL V4 설명을 읽어 보세요. 한 범주를 선택하세요 (예를 들어 "다회전") 그리고 에이전트를 통해 10개의 예제 요청을 실행하세요. 합격률을 보고하세요.
5. Pydantic 또는 Zod에 STDlib 검증기를 가져가세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Function calling | "Tool use" | Structured-output tool invocation with validated schema |
| Toolformer | "Self-supervised tool annotation" | Schick 2023 — keep tool calls whose results reduce next-token loss |
| BFCL | "Berkeley Function Calling Leaderboard" | 2026 benchmark: 40% agentic, 30% multi-turn, 10% live, 10% non-live, 10% hallucination |
| Tool schema | "Function signature for the model" | name, description, JSON Schema of arguments |
| tool_use_id | "Correlation ID" | Ties a tool call to its result; essential for parallel dispatch |
| Hallucination detection | "Know when not to call" | V4 category: refuse to call when no tool fits |
| Argument coercion | "String-to-int repair" | Narrow fixes for predictable schema-mismatch; reject if ambiguous |
| Sandboxing | "Tool execution boundary" | Per-tool read/write surface, network, timeout, memory cap |

## 더 많은 읽기

- [Schick et al., Toolformer (arXiv:2302.04761)](https://arxiv.org/abs/2302.04761) 자율 감독 도구 해설
- [Berkeley Function Calling Leaderboard (V4)](https://gorilla.cs.berkeley.edu/leaderboard.html) 2026 평가 기준
- [Anthropic, Tool use documentation](https://platform.claude.com/docs/en/agent-sdk/overview) 클로드 에이전트 SDK에서 생산 도구 스케마
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 기능 도구 유형 및 Guardrails
