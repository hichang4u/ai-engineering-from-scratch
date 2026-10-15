# 자기 정비 및 비판: 반복적인 출력 개선

> 셀프 리핀 (Madaan et al., 2023) 은 3개의 역할에서 한 LLM를 사용합니다.  생성, 피드백, 리핀  루프. 평균 이득: 7개의 작업에 대해 +20 절대. CRITIC (Gou et al., 2023) 는 외부 도구를 통해 로팅 검증을 통해 피드백 단계를 강화합니다. 2026 년 이 패턴은 모든 프레임워크에서 "평가자 최적화" (Anthropic) 또는 경비 루프 (OpenAI 에이전트 SDK) 로 배포됩니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 03 (Reflexion)
**Time:** ~60 minutes

## 학습 목표

- 국가 자기 정제 (Self-Refine) 의 세 가지 명령 (제출, 피드백, 정제) 과 왜 역사가 정제 명령에 중요하는지 설명합니다.
- 크리티크의 비판적 통찰력을 설명하십시오. 외부 근거 없이 자기 검증에서 LLM는 신뢰할 수 없습니다.
- 역사와 선택적 외부 검증기를 가진 stdlib 자정 루프를 구현하십시오.
- 이 패턴을 Anthropic의 "평가자-최고화" 작업 흐름과 OpenAI 에이전트 SDK의 출력 보호구역에 지도하십시오.

## 문제

에이전트가 거의 올바른 답을 만들어냅니다. 아마도 코드 라인이 문법 오류를 가지고 있을지도 모릅니다. 요약이 너무 길지도 모릅니다. 어쩌면 계획이 가장자리 케이스를 놓칠지도 모릅니다. 당신이 원하는 것은 에이전트가 자신의 출력을 비판하고 수정하는 것입니다.

자제정 (Self-Refine) 은 단일 모델, 훈련 데이터, RL 없이 작동하는 것을 보여줍니다. 하지만 한 가지 단점이 있습니다. LLM는 하드 사실에 대한 자제 확인에 좋지 않습니다. CRITIC는 수정 을 external tools (검색, 코드 인터프리터, 계산기, 테스트 런어) 를 통해 확인 단계를 라우팅합니다.

이 두 논문은 함께 반복적 개선에 대한 2026 기본을 정의합니다: 생성, 검증 (가능하면 외부로), 정비, 검증기가 통과하면 중지합니다.

## 개념

### 자제정 (Madaan et al., NeurIPS 2023)

한 장, 세 장

```
generate(task)            -> output_0
feedback(task, output_0)  -> critique_0
refine(task, output_0, critique_0, history) -> output_1
feedback(task, output_1)  -> critique_1
refine(task, output_1, critique_1, history) -> output_2
...
stop when feedback says "no issues" or budget exhausted.
```

주요 세부 사항:`refine`본서는 전체 역사  이전 모든 결과와 비판을  보고 오류를 반복하지 않습니다. 논문은 이것을 삭제합니다.

제목: GPT-4를 포함한 7개의 작업 (수학, 코드, 약자, 대화) 에서 평균 +20의 절대적인 향상. 훈련, 외부 도구, 단일 모델이 없습니다.

### 비평 (Gou et al., arXiv:2305.11738, v4 Feb 2024)

자기 정제 의 약점: 피드백 단계 는 LLM 점수 자체 이다. 사실적 주장 에 대해서는 이것은 신뢰할 수 없다 (알루시네이션 은 종종 그것을 생성 한 모델 에게 설득력 있는 것 이다). CRITIC 는 대체 한다 `feedback(task, output)``verify(task, output, tools)`어디`tools`다음을 포함합니다.

- 사실적인 주장을 찾는 검색 엔진
- 코드 정확성을 위한 코드 인터프리터
- 계산기
- 도메인별 검증기 (단체 테스트, 타입 검증기, 리너)

검증자는 도구 결과에 기초한 구조화된 비판을 생성하고, 정제자는 이 비판에 대한 조건들을 만들어냅니다.

제목: CRITIC는 사실적인 작업에서 자율 정비보다 우수한 성적을 거두는데, 비판은 기초적이기 때문입니다. 외부 검증기 (창작적 글쓰기, 형식화) 없는 작업에서는 CRITIC는 자율 정비로 줄인다.

### 정지 상태

두 가지 일반적인 형태:

1. **Verifier passes.**외부 테스트는 성공적 결과를 가져옵니다. 사용 가능할 때 선호합니다 (단체 테스트, 타입 검사, 보호레일 확인).
2. **No feedback issued.**모델은 "출력도 괜찮아요". 저렴하지만 신뢰할 수 없습니다. 최대 반복 뚜과 결합합니다.

2026 기본: 결합. "확인자가 OR 모델을 통과하면 중지합니다. 그리고 반복 >= 2 OR 반복 >= max_iterations".

### 평가자-최고화 (Anthropic, 2024)

인트로피의 2024년 12월 게시물은 이것을 5가지 작업 흐름 패턴 중 하나로 지정합니다. 두 가지 역할:

- 평가자: 출력을 점수하고 비판을 생성한다.
- 최적화: 비판을 고려하여 출력을 수정합니다.

평가자가 통과할 때까지 ループ을 가십시오. 이것은 인트로피크의 프레임에서 자정화/CRITIC입니다. 인트로피크는 중요한 엔지니어링 세부 사항을 추가합니다. 평가자와 최적화 시키는 것은 크게 다를 수 있으므로 모델은 고무 스탬프를 찍지 않습니다.

### OpenAI 에이전트 SDK 출력 경비

OpenAI 에이전트 SDK는 이러한 패턴을 "출력 보호 선"으로 배포합니다.`OutputGuardrailTripwireTriggered`), 출력 기기가 거부되고 대리인은 다시 시도할 수 있습니다. 가드레일들은 도구 (CRITIC 스타일) 또는 순수 함수 (Self-Refine 스타일) 를 호출할 수 있습니다.

### 2026년 에 걸린 함정이

- **Rubber-stamp loops.**같은 패러다임으로 제작하고 비판하는 모델은 "나에게는 잘 보인다"에 합쳐집니다. 구조적으로 다른 패러다임을 사용하거나, 작은 값싼 모델을 비판으로 사용하십시오.
- **Over-refinement.**각 정제 패스는 지연과 토큰을 추가합니다. 예산 1-3 패스는; 그 후에, 인간 검토로 증가합니다.
- **CRITIC on trivial tasks.**외부 검증기가 없다면 CRITIC는 자정화로 퇴행합니다.

```figure
self-refine
```

## 건설 해

`code/main.py`장난감 작업에 자기 정제 및 CRITIC을 구현합니다. 주제를 부여한 짧은 총알 목록을 생성합니다. 검증기는 형식을 확인합니다. 총알은 3 개, 각각 60 차 이하입니다. CRITIC는 알려진 환상을 처벌하는 외부 "사실 검증기"를 추가합니다.

구성 요소:

- `generate` 시나리오 제작자
- `feedback` LLM 스타일의 자기 비판
- `verify_external` CRITIC 스타일의 토지 검증기
- `refine`는 주어진 출력 역사를 다시 작성합니다.
- 정지 조건  검증기 통과 또는 최대 4 번 반복

실행하세요:

```
python3 code/main.py
```

자제정화와 CRITIC의 비교를 해 보십시오. CRITIC는 사실상의 오류를 발견합니다. 자제정화 놓친 것은 외부 검증자가 자제정사를 지탱하지 않기 때문입니다.

## 사용 하 고

앤트로피크의 평가자 최적화는 클로드 친화적인 언어로 이 패턴을 사용합니다. OpenAI 에이전트 SDK의 출력 경비선은 CRITIC 모양입니다 (경비선은 도구를 호출할 수 있습니다). LangGraph는 셀프 리핀과 같은 반사 노드를 배포합니다. 구글의 Gemini 2.5 컴퓨터 사용은 CRITIC 변종인 단계별 안전 평가기를 추가합니다. 모든 행동이 컴백하기 전에 검증됩니다.

## 선박

`outputs/skill-refine-loop.md`작업 형태, 검증기 사용 가능성과 반복 예산을 고려하여 평가자-최시자 루프를 구성합니다. 생성자, 평가자/검증기, 최적화기, 그리고 중지 정책에 대한 요청을 발급합니다.

## 운동

1. 크리틱은 여전히 도움이 되나요?
2. 외부 검증기를 험난한 것으로 교체하십시오 (사실 긍정적 인 무작위 30%). 루프는 무엇을합니까? 이것은 대부분의 경비 스택의 2026 현실입니다.
3. "다른 모델에 대한 생성자 비판" 버전을 구현합니다. 큰 모델 생성, 작은 모델 비판. 같은 모델보다 더 나은가요?
4. 3부 (arXiv:2305.11738 v4) 를 읽어 보십시오. 세 가지 검증 도구 범주를 명명하고 각각의 예를 들어 보십시오.
5. 맵 오픈아이 에이전트 SDK`output_guardrails`CRITIC의 검증기 역할에 대해 생각해보세요. SDK가 잘못됐다면, 무엇이 옳은가?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Self-Refine | "LLM that fixes itself" | Generate -> feedback -> refine loop in one model, with history |
| CRITIC | "Tool-grounded verification" | Replace feedback with an external verifier (search, code, calc, tests) |
| Evaluator-Optimizer | "Anthropic workflow pattern" | Two roles — evaluator scores, optimizer revises — looped to convergence |
| Output guardrail | "Post-hoc check" | OpenAI Agents SDK validator that runs after an agent produces output |
| Verify step | "Critique phase" | The load-bearing decision: grounded or self-rated |
| Refine history | "What the model already tried" | Prior outputs + critiques prepended to refine prompt; drop and quality collapses |
| Rubber-stamp loop | "Self-agreement failure" | Same-prompt critique returns "looks good"; fix with structurally different prompts |
| Stop condition | "Convergence test" | Verifier passes OR no feedback AND iteration cap; never single-condition |

## 더 많은 읽기

- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) 신성문
- [Gou et al., CRITIC (arXiv:2305.11738)](https://arxiv.org/abs/2305.11738) 도구 기반 검증
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 평가자-최고화 작업 흐름 패턴
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 크리티크 모양의 검증기로서 출력 경비선
