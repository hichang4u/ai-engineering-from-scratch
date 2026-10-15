# 애너트로피크의 작업 흐름 패턴: 단순하고 복잡함

> 슐런츠와 장 (Anthropic, Dec 2024) 은 작업 흐름 (예정된 경로) 을 에이전트 (동적 도구 사용) 에서 구별한다. 다섯 개의 작업 흐름 패턴은 대부분의 경우를 포함한다. 직접 API 호출을 시작하십시오. 단계를 예측할 수 없을 때 에이전트를 추가하십시오.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop)
**Time:** ~60 minutes

## 학습 목표

- 앤트로피크의 다섯 가지 작업 흐름 패턴을 명명하세요: 프롬프트 체인, 라우팅, 병렬화, 오케스트레이터-워크, 평가자-오프티마저.
- 에이전트와 작업 흐름의 차이와 각 엔지니어링 비용에 대해 설명해 주세요.
- 에이전트를 대신하여 작업 흐름을 선택할 때 (그리고 반대로) 를 식별하십시오.
- 스크립트 된 LLM에 대해 STDlib에서 다섯 가지 패턴을 구현하십시오.

## 문제

팀들은 단일 함수 호출을 필요로 하는 문제들을 위해 다중 에이전트 프레임워크를 찾습니다. 비용은 현실입니다. 프레임워크는 명령어를 어둡게 하는 계층을 추가하고 제어 흐름을 숨기고 조기 복잡성을 초대합니다. 슈런츠와 장의 2024년 12월 게시물은 가장 많이 인용된 산업 역설입니다. 간단하게 시작하면 비용을 지불할 때만 복잡성을 추가합니다.

## 개념

### 업무 흐름과 에이전트

- **Workflow.**LLM와 도구들은 미리 정의된 코드 경로를 통해 구성되어 있습니다. 엔지니어들은 그래프를 소유하고 있습니다.
- **Agent.**LLM는 자신의 도구를 동적으로 지시하고 자신의 단계를 수행합니다. 모델은 그래프를 소유하고 있습니다.

두 가지 모두 그 자리에서 이루어집니다. 작업 흐름은 저렴하고, 더 빠르고, 디버깅이 더 쉬워집니다. 에이전트들은 무한한 문제를 풀지만 실패 모드를 더 어렵게 합니다.

### 증강된 LLM

다섯 가지 패턴의 기초: 한 LLM, 3 가지 기능이  검색 (복수), 도구 (행동), 메모리 (연구) 에 연결되어 있습니다. 모든 API 호출이 이 기능을 사용할 수 있습니다.

### 다섯 가지 패턴

1. **Prompt chaining.**호출 1의 출력은 호출 2에 입력됩니다. 작업이 선형 분해를 가지고있는 경우 사용하십시오. 단계 사이의 선택적 프로그램 게이트.

2. **Routing.**분류자 LLM는 하류 LLM 또는 도구를 호출하는 것을 선택합니다. 범주적으로 다른 입력가 다른 처리가 필요할 때 사용하십시오 (단계 1 지원 vs 환불 vs 버그 vs 판매).

3. **Parallelization.**N LLM 호출을 동시에 실행, 합산 결과. 두 가지 형태: 섹션 (다양한 조각) 및 투표 ( 같은 프롬프트, N 실행, 다수/합성).

4. **Orchestrator-workers.**오케스트레이터 LLM는 어떤 노동자 (또한 LLM) 를 실행해야 하는지 역동적으로 결정하고 그 출력을 합성한다. 에이전트 루프와 비슷하지만 오케스트레이터는 무한히 루프하지 않는다.

5. **Evaluator-optimizer.**한 LLM는 답을 제안하고 다른 LLM는 그것을 평가합니다. 평가자가 통과할 때까지 반복합니다. 이것은 자기 정제 (강좌 05) 일반화입니다.

### 업무 흐름이 에이전트를 이길 때

- **Predictable tasks.**그 단계를 세울 수 있다면, 해야 합니다.
- **Cost-bound tasks.**작업 흐름은 제한된 단계 수를 가지고 있습니다. 에이전트는 나선 수 있습니다.
- **Compliance-bound tasks.**감사들은 그래프를 읽고, 궤도를 추론하는 것이 아니라

### 에이전트가 업무 흐름을 이겨내는 곳

- **Open-ended research.**다음 단계의 시작은 마지막 단계가 돌아온 것에 달려 있습니다.
- **Variable-length tasks.**단계 계산이 알려지지 않은 시간으로 일하는 시간
- **Novel domains.**아직 올바른 워크플로우를 모르는 경우 먼저 탐구, 나중에 코딩하세요.

### 컨텍스트 엔지니어링 동반자

"AI 에이전트들을 위한 효과적인 컨텍스트 엔지니어링" (Anthropic 2025) 은 인접한 학문을 공식화합니다. 200k 창은 컨테이너가 아니라 예산입니다. 무엇을 포함해야 하며, 언제 컴팩트해야 하며, 언제 컨텍스트를 성장시킬 수 있도록 해야 합니다.

```figure
workflow-chain
```

## 건설 해

`code/main.py`              `ScriptedLLM`이 부분의 본문은

- `prompt_chain(input, steps)` 순서적
- `route(input, classifier, handlers)` 분류 + 배송
- `parallel_vote(prompt, n, aggregator)` N 경주, 합계
- `orchestrator_workers(task, workers)` 오케스트레이터가 노동자를 선택합니다.
- `evaluator_optimizer(task, proposer, evaluator, max_iter)` 통과할 때까지 ループ

실행하세요:

```
python3 code/main.py
```

각 패턴은 그 흔적을 인쇄합니다. 패턴에 대한 코드 라인 전체는 ~10-15; 프레임워크의 비용은 수천으로 측정됩니다.

## 사용 하 고

- 직접 API는 대부분의 작업을 요구합니다.
- 프레임워크는 패턴이 실제로 내구성 상태 (LangGraph), 배우 모델 동시 (AutoGen v0.4) 또는 역할 템플러링 (CrewAI) 를 필요로 할 경우에만 가능합니다.
- 클로드 코드 모양을 다시 만들지 않고도 클로드 코드 모양을 원하는 경우 클로드 에이전트 SDK를 찾아보세요.

## 선박

`outputs/skill-workflow-picker.md`주어진 작업 설명에 적합한 패턴을 선택하고, 결정의 합리화와 작업 흐름이 부족하면 대리인을 위한 리팩터 경로를 포함합니다.

## 운동

1. 신뢰도 임대점으로 로팅을 구현하세요. 임대점 아래 -> 인간으로 격화하세요. 1급 지원 사용 사례의 임대점은 어디 있습니까?
2. 시간 정지 추가`parallel_vote`한 번의 전화가 걸리면 어떻게 결석 투표를 합치죠?
3. 돌봐`evaluator_optimizer`반란자가 되려면 반복 중 상위 2개의 출력을 유지해야 합니다. 그래서 늦은 좋은 결과가 늦은 나쁜 결과로 덮어지지 않습니다.
4. 프롬프트 체인링과 라우팅을 결합: 라우터는 세 개의 체인 중 하나를 선택합니다. 토큰 비용을 측정하고 단일 큰 프롬프트 대안을 측정합니다.
5. 제작 기능 중 하나를 선택하고 작업 흐름을 그리고 단계를 계산해 보세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Workflow | "Predefined flow" | Engineer-owned graph of LLM and tool calls |
| Agent | "Autonomous AI" | Model-owned graph; dynamic tool direction |
| Augmented LLM | "LLM with tools" | LLM + search + tools + memory; the atomic unit |
| Prompt chaining | "Sequential calls" | Output of call N is input to call N+1 |
| Routing | "Classifier dispatch" | Pick which chain/model handles the input |
| Parallelization | "Fan out" | N concurrent calls; aggregate by sectioning or voting |
| Orchestrator-workers | "Dispatcher agent" | Orchestrator LLM picks specialist LLMs dynamically |
| Evaluator-optimizer | "Proposer + judge" | Iterate until evaluator passes; Self-Refine generalized |

## 더 많은 읽기

- [Anthropic, Building Effective Agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) 다섯 가지 작업 흐름 패턴
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 동반자 징계
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) 상태 그래프가 비용을 벌일 때
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 오케스트레이터-노동자 패턴, 생산
