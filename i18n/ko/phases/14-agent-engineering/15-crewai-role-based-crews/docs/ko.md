# 역할 기반 요원 팀  역할, 임무, 프로세스

> 4개의 원시형태: 에이전트, 작업, 승무원, 프로세스. 두 가지 최고 수준의 형태: 승무원 (자율적이고 역할 기반의 협업) 및 흐름 (사례 중심, 결정적). CrewAI는 2026년 참조 구현이며, 문서들은 둔합니다. "모든 생산 준비가 된 응용 프로그램에 대해, 흐름으로 시작하십시오".

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12 (Workflow Patterns), Phase 14 · 14 (Actor Model)
**Time:** ~75 minutes

## 학습 목표

- 크루아이의 네 원시 (원, 임무, 승무원, 프로세스) 과 각자의 소유물을 명명하십시오.
- 순서적, 계층적, 계획된 합의 프로세스를 구분하고, 작업량별로 하나를 선택하십시오.
- 크루 (자동적인 역할 기반) 과 플로우 (사례 중심의 결정론) 를 구분하고, 의사들의 생산 권고 사항을 설명한다.
- `@tool`장식업자 및`BaseTool`하위 클래스; 구조화된 출력과 자유 텍스트에 대한 이유
- 네 가지 CrewAI 메모리 유형과 각각의 결제 기간을 명명하세요.
- 브리프를 제작하는 세 명의 스트들리브 (연구자, 작가, 편집자) 의 승무원을 구현하십시오.
- 세 가지 CrewAI 실패 모드를 찾아보세요. 급부상한 부풀림, 관리자-LLM 세금, 부서지기 쉬운 손잡이.

## 문제

다중 에이전트 프레임워크를 채택하는 팀은 같은 벽에 도달합니다. "자율적인 협업"은 데모에서 훌륭합니다. 그러면 고객은 버그를 파일하고 결정적인 재생이 필요합니다. 또는 금융은 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주 경주

자유형 LLM 로이트 승무원들은 그 어느 하나에 대해서도 순수한 답변을 하지 않습니다. 순수한 DAG는 모든 질문에 답하지만

크루아이의 분단은 무역에 대해 정직합니다. 역할 기반의 협력적이고 탐구적인 작업에 대한 팀. 이벤트 기반, 코드 소유, 감사 가능한 생산을 위한 흐름. 동일한 프레임워크, 두 가지 모양, 표면별 선택.

## 개념

### 4개의 원시

크루아이 표면은 작고, 이 부분을 기억하면 나머지는 구성됩니다.

- **Agent.** `role + goal + backstory + tools + (optional) llm`. 배경 스토리는 부담을 내세우고 있습니다. 에이전트가 멈출 때 음향, 판단을 형성합니다. 도구는 에이전트가 호출 할 수있는 기능입니다 (이하에 더 자세히 설명합니다).
- **Task.** `description + expected_output + agent + (optional) context + (optional) output_pydantic`. 재사용 가능한 작업 단위`expected_output`계약이 되는 거죠.`context`출력으로 전달되는 업무를 상류로 나열합니다. `output_pydantic`구조화된 형태를 만들어 냅니다.
- **Crew.**컨테이너, 목록의 소유자`agents`, 목록`tasks`, `process`, 그리고 선택적으로`memory`+ `verbose`+ `manager_llm`설정
- **Process.**실행 전략: 순서적, 계층적, 합의 (계획)

요원들은 직접적으로 서로를 보지 않습니다. 임무는 참조 요원입니다. 승무원들은 작업을 순차적으로 수행합니다. 프로세스는 다음 작업을 누가 선택하는지 결정합니다. 그것이 전체 정신 모델입니다.

> **Validated against**CrewAI 0.86 (2026-05). 더 새로운 버전은 프로세스 유형을 변경하거나 통합할 수 있습니다.[CrewAI Processes docs](https://docs.crewai.com/concepts/processes)특정 모양에 의존하기 전에

### 순서적 대 지질적 대 합의

- **Sequential.**과제는 선언 순서로 실행된다. 과제 N의 출력은`context`N+1 과제를 수행하기 위해 가장 낮은 비용, 가장 예측 가능한 비용, 주문이 정해진 경우에 사용하십시오.
- **Hierarchical.**관리자 에이전트 (분별 LLM 호출) 전문인력 간 경로를. CrewAI는 관리자를 당신의`manager_llm`구성 또는 기본 설정. 관리자는 매 라운드마다 다음 작업을 선택하고 거부하거나 다시 라우트를 할 수 있습니다. 네 명의 전문가가있을 때 사용하십시오. 주문은 실제로 이전 출력을 기반으로합니다.
- **Consensus.**현재 공개 API에 구현되지 않은 계획입니다. 문서들은 미래의 투표 기반 프로세스라는 이름을 예약합니다. 오늘 그것을 의존하지 마십시오.

계층적은 각 전문 전화 위에 라운드 LLM 호출 (관리자) 를 추가합니다. 5 단계 실행에 토큰 비용은 3 배로 증가할 수 있습니다. 로우팅이 필요할 때만 지불하십시오.

### 승무원 vs 유동

이것이 2026년에 박사들이 제시하는 틀입니다.

- **Crew.**LLM에 의해 주도된 자율성. 프레임워크는 실행 시간에 모양을 선택합니다. 연구, 브레인스토밍, 첫 번째 초안, 경로가 답의 일부입니다. 재생하기 어렵습니다. 테스트하기 어렵습니다. 프로토타입에 저렴합니다.
- **Flow.**이벤트 기반 그래프가 당신 소유입니다.`@start`입문 표시.`@listen(topic)`다른 단계가 해당 주제를 발사할 때 발사되는 단계를 표시합니다. 각 단계는 단순한 파이썬입니다.

2026년 제작 추천: 플로우로 시작하세요.`Crew.kickoff()`플로우가 자율성을 위해 비용을 지불할 때, 플로우가 감사 경로를 제공하고, 승무원이 탐구 경로를 제공합니다.

### 도구 통합

에이전트에게 도구를 줄 수 있는 세 가지 방법

1. **`@tool` decorator.**순수 함수는 도구가 됩니다. 서명은 스케마입니다. docstring는 LLM가 보는 설명입니다. 단번에 도움을 주는 사람들에게 가장 좋습니다.

   ```python
   from crewai.tools import tool

   @tool("Search the web")
   def search(query: str) -> str:
       """Return top results for the query."""
       return run_search(query)
   ```

2. **`BaseTool` subclass.**클래스 기반 도구, 명시적인 args 스키마, 아싱크 지원, 재실험. 도구가 상태 (클라이언트, 캐시) 또는 구조화된 args가 필요할 때 사용하십시오.

   ```python
   from crewai.tools import BaseTool
   from pydantic import BaseModel

   class SearchArgs(BaseModel):
       query: str
       limit: int = 10

   class SearchTool(BaseTool):
       name = "web_search"
       description = "Search the web and return top results."
       args_schema = SearchArgs

       def _run(self, query: str, limit: int = 10) -> str:
           return self.client.search(query, limit=limit)
   ```

3. **Built-in toolkits.**크루아이이 선박에 첫 번째 당사자 어댑터를 공급합니다: `SerperDevTool``FileReadTool``DirectoryReadTool``CodeInterpreterTool``RagTool``WebsiteSearchTool`- 한 개의 수입으로 연결된

구조화된 출력으로 Pydantic를 사용한다.`output_pydantic=MyModel`에 대한 작업. CrewAI는 모델에 대한 LLM 응답을 검증하고 강제하거나 다시 시도합니다.`expected_output`문자열. 자유 텍스트 출력은 드래프트에 적합합니다. 구조화된 출력은 하류 흐름이 소비 할 수 있습니다.

### 메모리 할크

CrewAI는 4개의 메모리 타입을 상자 밖으로 내보내죠.

> **Validated against**최근 출시된 버전은 모든 것을 통일된 `Memory`아래의 개념 모델은 여전히 유효하지만 공중 계급 표면은 하나의`Memory`최신 버전의 입점점; 체크 [CrewAI memory docs](https://docs.crewai.com/concepts/memory)현재 API에 대해

- **Short-term.**대화 버퍼는 한 번으로 끝으로 지워버립니다.
- **Long-term.**실행 중 지속. 벡터 DB에 저장되어 있습니다. 현재 작업과 유사하여 검색됩니다.
- **Entity.**"X 고객은 기업 계획에 있습니다". 엔터테인먼트에서 결정된 것, 유사성에서 아닙니다.
- **Contextual.**엑스레이션 시간 검색, 에이전트가 필요한 순간에 관련 메모리를 끌어내죠, 미리 로드되지 않습니다.

  함대에 `memory=True`또는 타입별 구성. 당신이 구성하는 임베디션 제공자에서 지원합니다 (오픈아이 기본 설정, 로컬로 교환 가능합니다). 메모리 는 크루아이이 더 얇은 프레임워크에 대한 지지를 얻는 곳 중 하나입니다. 순수한 랭그그래프 는 당신이 직접 이 모든 것을 전선화 할 필요가 있습니다.

### 역할 기반 팀들이 잘 어울리는 경우

- 3~6명의 에이전트들이 이름을 붙이고 협력적인 업무로 구성하고 검토하고 계획하고 브레인스토밍하고
- 다음 단계에 대한 LLM의 판단이 가치의 일부인 로팅 (위계)
- 팀의 어느 곳이라도 더 행복한 독서`role + goal + backstory`그래프 정의를 읽는 것보다

### 그들이 그렇지 않을 때

- 엄격한 순서로 결정적인 DAG. 랭그그래프 (강좌 13) 를 사용하십시오. 그래프 모양은 올바른 추상화입니다. CrewAI의 역할 프레임은 마찰입니다.
- 초초연속 예산. 계층적은 회전과 회전을 추가합니다. 심지어 순차적은 배경 이야기와 이전 출력을 포함하는 명령어를 연속화합니다.
- 단일 에이전트 루프. 프레임워크를 건너뛰어; 에이전트 루프 (강좌 1) 과 도구 레지스트리 더 짧습니다.

17 (원자 프레임워크 트레이드오프) 강의는 이것을 매트릭스에서 설명합니다. 짧은 버전: CrewAI는 "협동 역할 기반" 코너에 앉아 있습니다.

### 의존성 형태

랭체인 독립성 Python 3.10에서 3.13. 사용 `uv`별수: 보시다시피[crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)(2026-05년 간략) AWS Bedrock 통합은 문서화되어 있습니다. 공급자 기준은 QA 작업 부하에 상당한 속도와 LangGraph를 보고하지만 방법론 (데이터셋, 하드웨어, 평가 메트릭) 은 공개되지 않습니다. 따라서 프레임워크- 공급자 숫자를 방향적으로만 취급합니다.

### 이 패턴이 잘못되는 곳

- **Prompt-bloat from backstories.**2000 단어의 백스토리, 에이전트 1명과 5명 구성된 팀마다 첫 번째 도구 호출 전에 컨텍스트 예산을 태워버립니다. 백스토리를 200 단어 이하로 유지하십시오. 에이전트 간 문구를 재사용하십시오. 집 스타일을 5 번 반복하지 마십시오.
- **Manager-LLM token tax.**계층적 프로세스는 모든 전문 전화 전에 관리자 LLM 호출을 추가합니다. 다섯 개의 작업이있는 승무원에서는 다섯 대신 여섯 개의 LLM 호출이 있으며 관리자 호출은 전 작업 목록과 이전 출력을 가지고 있습니다. 출력을 따라하는 것이 아니라면 순서로 전환합니다.
- **Brittle handoffs.**N의 임무`expected_output`N+1 작업은`context`3개의 부문을 분석하려고 합니다. LLM는 4개의 부문을 생산했습니다.`output_pydantic`작업 N에 작업 N+1은 입력된 객체를 읽으며, 자유 텍스트가 아닙니다.
- **Crew-as-prod.**자유형 승무원 생산에 유통되지 않은 Flow 팩터. 출력 변동성이 높다; 재 재생은 불가능하다; 호출에 좋은 것 과 나쁜 경주를 구별 할 수 없습니다. Flow 로 팩터.

```figure
ae-crew-vs-flow
```

## 건설 해

`code/main.py`두 형태의 STDlib 버전과 3명의 대리인 승무원을 구현합니다.

형태:

- `Agent``Task`CrewAI의 표면에 맞는 데이터 클래스
- `SequentialCrew.kickoff(inputs)`선언 순서로 작업을 실행하고, 출력 배열을 `context`- 그래
- `HierarchicalCrew.kickoff(topic)`관리자가 추가합니다. 에이전트가 다음 전문가를 선택하고, "완전"에 멈춰요.
- `Flow``@start`그리고`@listen(topic)`장식, 작은 이벤트 루프, 그리고 흔적이.
- `tool(name)`       `@tool`형태
- `Memory``short_term``long_term``entity`매장들, 조롱한 유사성은 이용됩니다.
- 가짜 LLM 응답은 하드코딩된 문자열입니다. 역할과 입력 프리픽스를 키로 차단합니다. 네트워크 없습니다. 결정적입니다.

콘크리트 데모: 연구자, 작가, 편집자 팀 "원자 공학 2026"에 대한 브리프 제작. 연구자 (모욕) 원을 끌어당깁니다. 작가 초안. 편집자 꽉 차 있습니다. 동일한 팀은 결정적인 모양을 보여주기 위해 흐름을 통해 실행합니다.

실행하세요:

```bash
python3 code/main.py
```

추적 커버: 순서적 승무원 배열 출력 `context`, 관리자 선택 (연구자, 작가, 편집자, "결국"), 순차적으로 동일한 세 단계를 실행하고 명시적인 주제를 (`researched``drafted``edited`), 도구 호출을 통한 `@tool`두 번의 발자국 끝에 살아남은 장기 기억

승무원 추적은 유동성이고, 관리자는 원칙적으로 재질할 수 있습니다.

## 사용 하 고

- **CrewAI Flow**생산을 위해. 심지어 흐름은 하나의 단계라고 부르고`Crew.kickoff()`- 흐름은 감사의 경계를 알려줍니다.
- **CrewAI Crew (Sequential)**명확한 협업 작업, 특히 첫 번째 초안 및 검토 루프에 대한
- **CrewAI Crew (Hierarchical)**로우팅이 출력에 달려 있고, 4명 이상의 전문가가 있습니다.
- **LangGraph**(강좌 13) 정면 상태 기계, 내구성 재개정, 엄격한 순서.
- **AutoGen v0.4**(강좌 14) 배우 모델 동시성과 오류 고립에 대한
- **OpenAI Agents SDK**(강좌 16) 칸과 칸을 가진 오픈AI-제1제품에 대해
- **Claude Agent SDK**(강좌 17) 클로드-프라이스트 제품과 주전체 및 세션 스토어

## 선박

`outputs/skill-crew-or-flow.md`작업에 대한 Crew vs Flow를 선택하고 최소한의 구현을 기획합니다. 배경을없는 Crew, 명시적인 주제없는 Flow, 3명 이하의 전문가를 가진 계층적 주제에 대한 하드 거부.

## 함정

- **Backstory as flavor.**출력을 형성합니다. 에이전트당 3가지 변수를 테스트합니다. 변수는 실제입니다. 하나를 선택하고, 얼어붙입니다.
- **Skipping `expected_output`.**임무를 하나씩 계약하지 않으면, 하류 작업은 LLM가 생산한 것을 모두 차지합니다. 승무원은 실행하고 감사는 실패합니다.
- **Memory always-on.**장기적인 것은 모든 실행을 기록합니다. 벡터 DB는 증가합니다. 검색은 합니다. 범위는 사실이 지속되는 작업에 기록합니다.
- **Manager prompt drift.**지형 관리자 요청은 암시합니다. 로우팅이 이상해지면, 구사 모드로 던지고 읽어보세요.
- **Tool side effects in Crews.**승무원은 예상보다 더 많은 시간을 도구로 호출할 수 있습니다.

## 운동

1. 순서속 승무원을 흐름으로 변환해 달라 변동성이 떨어지는 터치포인트를 계산해 봐 가독성이 떨어지는 곳을 알아보자
2. 승무원에게 엔티티 메모리를 추가: 고객에 대한 사실들은 틱오프에도 지속됩니다. 검색이 올바른 엔티티를 끌어당기는 것을 확인합니다.
3. 관리자가 편집자의 출력에서 적어도 3개의 문장을 가질 때까지 편집자에게 로우팅을 거부하는 계층적 프로세스를 구현하십시오. 다시 시도를 추적하십시오.
4.  와이어 a`BaseTool`(모욕) 웹 검색의 하위 클래스.`@tool`장식용 버전
5. 추가`output_pydantic=Brief`편집자의 임무에,`Brief``title``summary``sections`. 작사 작업 출력 오류 JSON 한 번; 추적 CrewAI의 재 시도 행동을 확인.
6. 크루아이의 문서 소개를 읽어보세요.`crewai`API, STDlib 버전은 어떤 보증이 넘겼나요?
7. 에이전트 오프스나 랭푸스 (강좌 24) 를 실제 실행에 옮기십시오. STDlib 버전에서 어떤 흔적을 놓쳤습니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | "Persona" | Role + goal + backstory + tools |
| Task | "Unit of work" | Description + expected output + assignee + optional structured output |
| Crew | "Agent team" | Container for Agents + Tasks + Process |
| Process | "Execution strategy" | Sequential / Hierarchical / Consensus (planned) |
| Flow | "Deterministic workflow" | Event-driven, code-owned, testable |
| Backstory | "Persona prompt" | Tone and judgment shaper for the Agent |
| `@tool` | "Function tool" | Decorator that turns a function into a tool the Agent can call |
| `BaseTool` | "Class tool" | Class-based tool with args schema, retries, async support |
| Entity memory | "Per-entity facts" | Memory scoped to a customer / account / issue |
| Long-term memory | "Cross-run memory" | Vector-backed memory that survives between kickoffs |
| Contextual memory | "Just-in-time retrieval" | Memory pulled at the moment the Agent needs it |
| Manager LLM | "Router agent" | Extra LLM in Hierarchical process that picks the next task |
| `expected_output` | "Task contract" | String that tells the Agent (and audit) what shape to return |

## 더 많은 읽기

- [CrewAI docs introduction](https://docs.crewai.com/en/introduction): 개념과 권장 생산 경로
- [CrewAI Flows guide](https://docs.crewai.com/en/concepts/flows): 이벤트 중심의 모양, `@start``@listen`
- [CrewAI tools reference](https://docs.crewai.com/en/concepts/tools)이 책:`@tool``BaseTool`, 내장 도구 키트
- [CrewAI memory](https://docs.crewai.com/en/concepts/memory): 단기, 장기, 단위, 맥락
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents): 다중 요원 도움 이 되는 경우와 그렇지 않은 경우
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview): 국가 기계 대안
