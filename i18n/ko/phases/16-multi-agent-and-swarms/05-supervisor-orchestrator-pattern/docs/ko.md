# 감독자/조연자-노동자 패턴

> 1개의 주요 에이전트들은 계획과 대리인을 담당하고, 전문적인 노동자들은 병렬적인 맥락에서 실행하고 보고합니다. 이것은 인트로피크의 연구 시스템 (클로드 오퍼스 4의 납, 소넷 4의 하위 물질) 의 패턴입니다. 내부 연구 평가에서 단일 요인 오퍼스 4보다 +90.2%로 측정되었습니다. 앤트로피크의 엔지니어링 포스트는 브라우즈컴의 80%의 변동이 토큰 사용만으로 설명된다는 것을 보고합니다. 이 수업은 원시에서 감독 패턴을 구축하고 생산 배포에서 2026 엔지니어링 수업을 다루고 있습니다.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

## 문제

연구란 단일 에이전트 시스템에서 실패하는 프로토타입 작업입니다. "2023년부터 2026년까지 다 에이전트 시스템에서 무엇이 바뀌었는가?"라고 묻는다면, 단일 에이전트는 5개의 논문을 순차적으로 읽고, 그 내용을 절반으로 채우고, 그 모든 내용을 함께 논해야 합니다. 다섯 번째에 도달할 때 첫 번째 논문을 잊습니다. 그것은 병렬화 할 수 없습니다.

감독 패턴은 이것을 수정합니다. 한 리드 에이전트가 검색을 계획하고, 각 하부 질문을 근로자에게 위임하고 합성합니다. 각 근로자는 좁은 질문에 대한 자신의 200k 토큰 창을 얻습니다. 리드는 결코 원자 논문을 보지 않습니다.

인트로피의 생산 연구 시스템은 내부 연구 평가와 단일 Opus 4에 대해 +90.2%를 보고합니다. 같은 게시물에서는 80%의 BrowseComp 변이가 *토큰 사용만'에 의해 설명된다는 것을 지적합니다.

## 개념

### 패턴

```
                 ┌──────────────┐
                 │   Lead       │  plans, decomposes,
                 │  (Opus 4)    │  synthesizes
                 └──┬────┬───┬──┘
                    │    │   │
            ┌───────┘    │   └───────┐
            ▼            ▼           ▼
      ┌─────────┐  ┌─────────┐  ┌─────────┐
      │ Worker1 │  │ Worker2 │  │ Worker3 │
      │(Sonnet) │  │(Sonnet) │  │(Sonnet) │
      └─────────┘  └─────────┘  └─────────┘
         fresh       fresh        fresh
         context     context      context
```

납은 원료를 읽지 않고, 납이 합성되기 전까지는 노동자들은 서로의 작품을 보지 못한다. 각각의 화살표는 좁은 유물이 있는 팔다리이다.

### 왜 이기는 건지

세 가지 메커니즘:

1. **Fresh context per subagent.**"FIPA-ACL 유산"을 탐구하는 노동자는 계획에 사용된 40만 개의 토큰을 가지고 있지 않습니다. 한 질문에 대한 200만 개의 창을 얻습니다.
2. **Specialization via prompt.**이 리드 의 명령 은 "분해 하고 합성"이 아니라 "연구". 모든 작업자 의 명령 은 좁습니다. "X 에서 무슨 변화 를 발견 해 주"는 것 이다. 집중 된 명령 은 집중 된 결과 를 낳는다.
3. **Parallelism.**노동자들은 동시에 달리고 있습니다. 벽 시계 시간은 대략`max(worker_times) + plan + synthesis`아니`sum(worker_times)`- 그래

### 공학 수업 (인тропо스 2025)

인тропо틱 포스트는 2026년에도 여전히 관련 있는 여러 제작 수업을 나열합니다.

- **Scale effort to query complexity.**간단한 질문: 한 대리인이 3~10개의 도구 호출을 합니다. 복잡한 질문: 10대 대리인이요. 수사는 전화를 걸는 사람이 아니라 이를 추정해야 합니다.
- **Broad then narrow.**먼저 넓은 부분문제로 분해하고, 그 다음, 답을 깊이 있게 요구한다면, 각각의 부분문제로 더 많은 노동자를 낳습니다.
- **Rainbow deployments.**에이전트는 오래 지속되고 정교합니다. 전통적인 파란색 녹색은 작동하지 않습니다. 인류는 무지개를 사용합니다. 오래된 버전이 소실되는 동안 새로운 버전의 점진적인 출범입니다.
- **Token usage dominates.**멀티 에이전트 = 1 대의 토큰의 15x. 작업 값이 비용을 정당화 할 때만 실행하십시오.

### 그래프-네이티브 턴

랭그라프는 원래 `langgraph-supervisor`높은 수준의 도서관`create_supervisor`보조자. 2025 년 에 LangChain 은 도구 호출 을 통해 직접 감독자 패턴 을 구현 하는 권고 를 옮겼습니다. 왜냐하면 도구 호출 은 감독자 가 보는 것 에 대해 더 많은 통제 를 부여 하기 때문 이다. (콘텍스트 엔지니어링) 도서관은 여전히 작동 하고 있으며, 문서 는 이제 도구 호출 형태 를 추천 한다.

### 실패 모드

- **Lead hallucinates the plan.**만약 납이 실제 질문을 해체하지 않는 부분문제를 생성한다면, 노동자들은 잘못된 목표에 대해 정확한 연구를 한다.
- **Workers over-explore.**명시적인 범위 제한이 없으면 노동자들은 주어진 부분 질문보다 벗어나 합성 단계를 오염시킵니다.
- **Synthesis conflicts.**두 명의 노동자가 모순적인 사실을 반환합니다. 리더는 다시 질문 (라운드 추가) 또는 명시적으로 의견이 분분한 점을 언급해야합니다. 한쪽의 침묵적 선택은 최악의 실패입니다. 사용자가 의견이 분분한 것을 결코 알지 못합니다.

### 감독이 잘못 했을 때

- **Sequential tasks.**단계 2가 실제로 단계 1의 출력이 필요하다면, 평행성은 아무것도 구입하지 않습니다. 파이프라인 (CrewAI 순서, LangGraph 선형 그래프) 을 사용하십시오.
- **Simple queries.**단일 에이전트가 더 빠르고 저렴하게 처리합니다. 노동자를 낳기 전에 납의 "기능력" 검사를 사용하세요.
- **Strict determinism.**감독자는 LLM에서 선택된 위임자를 사용합니다. 수감/재중 재생이 적응력보다 중요할 때 정적 그래프는 더 좋습니다.

```figure
supervisor-hierarchy
```

## 건설 해

`code/main.py`3명의 병렬 노동자를 고용한 감독자를 실시합니다.`threading`. 납은 질의를 하위 질문으로 분해하고, 노동자들은 각 하위 질문에서 동시에 실행하고, 납은 합성한다. 실제 LLM는 없습니다.

주요 구조:

- `Lead.plan(query)`질문들을 3개의 부분문제로 나눈다.
- `Worker.run(sub_q)`가짜 요약을 반환합니다 (제작 중 어떤 도구 사용 요인이 될 수 있습니다).
- `Lead.run(query)`노선을 고, 융합하고, 합성합니다.

실행:

```
python3 code/main.py
```

출력으로 계획, 시작/말 시간표와 최종 합성으로 병렬 작업자의 추적이 표시됩니다. 벽 시계 승부를 볼 수 있습니다. 0.3초의 세 명의 노동자가 0.9 초가 아닌 0.35 초에 달립니다.

## 사용 하 고

`outputs/skill-supervisor-designer.md`사용자 질의를 취하고 감독 패턴 디자인을 생성합니다. 리드 시스템 프롬프트, 작업자 역할, 하위 질문 분해 규칙 및 합성 템플릿. 새로운 연구 스타일의 에이전트 시스템을 구축하기 전에 이것을 사용하십시오.

## 선박

감독 패턴을 배치하기 전에 체크리스트:

- **Model pairing.**추론 단계 모델 (Opus 클래스, `o3`더 빠르고 저렴한 모델 (소넷, )`o4-mini`)
- **Worker timeout.**평균 실행시간 2배를 초과하는 노동자는 사망한다. 납은 좁은 범위로 재발생하거나 그렇지 않으면 계속된다.
- **Token cap per worker.**가혹한 한계 (예컨대 10x 예상 합성 입력) 는 도망친 노동자가 예산을 부풀어 놓지 못하게 합니다.
- **Observability.**리드 계획, 각 직원의 도구 호출, 합성 추적. 이것은 모든 포스트-하크 디버깅의 기초입니다.
- **Rainbow rollout.**장기적인 주식 에이전트는 차행적인 버전 전환이 필요하고, 뜨거운 교환이 필요하지 않습니다.

## 운동

1. 달아`code/main.py`3 대신 5 명의 노동자를 낳도록 리드를 수정하십시오. 벽 시계 효과를 관찰하십시오. 이 데모에서 어떤 노동자 수를 통해 이 상공 비용을 초과합니까?
2. 노동자의 타임아웃을 시행: 0.5초 이상 실행하는 모든 노동자를 죽이고, 납이 나머지 결과를 합성하도록 한다. 노동자가 삭감되었음을 알기 위해 어떤 관찰성이 필요합니다?
3. 리드 합성에 갈등 탐지 단계를 추가하십시오. 두 명의 노동자가 모순적인 답변을 반환하면 리드는 하나를 선택하지 않고 의견이 분분하는 것을 알아냅니다. LLM를 호출하지 않고 모순을 어떻게 탐지합니까?
4. 인트로피크의 연구 시스템 엔지니어링 포스트를 읽어 보세요. 이 장난감 시범이 생산에 실행되기 위해 채택해야 할 세 가지 관행을 나열하세요.
5. 랭그그래프 의 경우 를 비교 해 보십시오`create_supervisor`(유산) vs 새로운 도구 호출 추천. 감독자가 보는 것에 대해 더 나은 통제를 주는 것은 무엇입니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor | "Lead agent" | An orchestrator agent that plans, delegates, and synthesizes. Does not do the work itself. |
| Worker | "Subagent" | A focused agent invoked by the supervisor with narrow scope and its own context window. |
| Orchestrator-worker | "Supervisor pattern" | Same thing, different name. The 2026 literature uses both. |
| Fresh context | "Clean window" | A worker's context starts from its system prompt and assigned question, not the lead's history. |
| Rainbow deployment | "Gradual rollout" | Long-running stateful agents need versioned drain-and-replace, not blue-green. |
| Token dominance | "Context is the variable" | 80% of research-eval variance comes from total tokens used, not model choice, per Anthropic. |
| Scale effort | "Match agent count to complexity" | Lead estimates query difficulty, spawns 1 vs 10+ workers accordingly. |
| Synthesis conflict | "Workers disagree" | Two workers return contradictory facts; the lead must surface disagreement, not silently pick one. |

## 더 많은 읽기

- [Anthropic engineering — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) 감독 패턴의 생산 참조
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 도구 호출 감독은 이제 권장 된 형태입니다
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) 2026년 생산에 여전히 사용되고 있는 유래 보조기
- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents)  랜덤 기반 감독자
