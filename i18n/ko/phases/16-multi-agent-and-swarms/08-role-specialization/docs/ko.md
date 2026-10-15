# 역할 전문성  계획자, 비평가, 집행자, 검증자

> 2026년 가장 흔한 멀티 에이전트 분해: 한 에이전트 계획, 한 에이전트 실행, 한 에이전트 비판 또는 확인. MetaGPT (arXiv:2308.00352) 는 이것을 SOP로 공식화하여 역할 명령어로 코딩합니다.`Code = SOP(Team)`- 그래 채트데이브 (arXiv:2307.07924) 는 "커뮤니케이션 디알루시네이션" (사무원들이 명시적으로 실종된 세부 사항을 요청) 을 통해 "채트 체인"을 통해 디자이너, 프로그래머, 리뷰어, 테스터를 연쇄합니다. 검증기는 부담을 견디는 것: Cemri et al. (MAST, arXiv:2503.13657) 모든 다중 에이전트 실패는 실종 또는 깨진 검증으로 추적될 수 있습니다. PwC는 CrewAI의 구조화된 검증 루프에서 7x 정확성 향상을 (10% → 70%) 보고했다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model), Phase 16 · 05 (Supervisor)
**Time:** ~60 minutes

## 문제

일반 다중 에이전트 시스템은 일반 출력을 생성합니다. 그룹 채팅에서 세 명의 코더가 같은 중간 코드의 세 가지 맛을 작성합니다. 더 많은 에이전트를 추가하고 더 많은 라운드를 추가 할 수 있습니다. 그럼에도 불구하고 품질 문턱을 넘지 않습니다.

수정은 더 많은 에이전트 이 아니라 * 다른 * 에이전트입니다. 다른 역할을 할당하십시오. 계획자가없는 비판적 도구를 제공하십시오. 검증자에게 객관적인 테스트 스위트를 제공하십시오. 이제 시스템은 평행 추측뿐만 아니라 지형 수정과 내부 불일치가 있습니다.

## 개념

### 4가지 가톨릭 역할

**Planner.**목표 를 읽고 단계 목록 또는 스펙 을 생성 합니다. 도구: 지식 검색, 문서. 출력: 구조 된 계획.

**Executor.**한 단계씩 계획을 읽고, 유물을 생성합니다. 도구: 실제 작업 도구 (코드 컴파일러, 셸, API 클라이언트). 출력: 유물을 생성합니다.

**Critic.**설계자의 의도와 달리 실행자의 출력을 읽습니다. 도구: 유물에 독서만 액세스, 정적 분석. 출력: 이유와 함께 받아들이/ 거부.

**Verifier.**유물을 읽고 결정적인 검사를 실행합니다. 도구: 테스트 런어, 타입 검증기, 스케마 검증기. 출력: 증거와 합격/실패.

비평가들은 주관적이고, 의견을 가진, 종종 LLM 기반의 사람들입니다. 검증자는 객관적이고, 결정적이고, 종종 코드 기반의 사람들입니다. 그들은 같은 역할을하지 않습니다.

### 메타그PT의 SOP 패턴

메타GPT (arXiv:2308.00352) 는 소프트웨어 엔지니어링 SOP를 역할 요청으로 코딩합니다.

- **Product Manager**PRD가 쓴 글
- **Architect**시스템 설계를 만들어냅니다.
- **Project Manager**과제를 나눈다.
- **Engineer**도구
- **QA Engineer**테스트를 진행합니다.

각 역할은 엄격한 입력/출력 스케마를 가지고 있습니다. 역할 프롬프트는 역할이 무엇인지 그리고 무엇을 만들어야 하는지 알려줍니다.`Code = SOP(Team)` 결정적인 SOP는 LLM의 팀을 예측 가능한 파이프라인으로 만듭니다.

### 채트 데이브의 커뮤니케이션 해몽

채트 데브는 핵심적인 움직임을 추가합니다. 실행자가 계획에 포함되지 않은 특정 세부 사항이 필요할 때, 그것은 계속하기 전에 설계자에게 명시적으로 요청합니다. 이것은 세부 사항을 믿을 수 있게 발명하는 전통적인 LLM 실패를 방지합니다.

구현: 역할 명령어는 "당신이 제공되지 않은 특정 정보가 필요할 때, 출력을 생성하기 전에 관련 역할의 이름을 물어보십시오".

### 왜 검증자가 가장 중요합니까

Cemri et al. (MAST) 는 1642개의 멀티 에이전트 실행 실패를 추적했다. 21.3%는 검증 빈틈이 있었다.

PwC는 (CrewAI 배포, 2025) 구조화된 검증 루프를 추가하면 정확도가 10%에서 70%로 이동했다고 보고했습니다.

### 비평가와 검증자

- 비평가란 예술품을 품질에 대해 검토하는 LLM입니다. 주관적.
- 검증자는 유물에서 실행되는 결정적 프로그램입니다. 객관적. 증거와 합격/실패를 제공합니다.

두 가지 모두 사용하세요. 비평가들은 검증자가 표현할 수 없는 맛 문제를 파악합니다. 검증자는 비평가들이 볼 수 없는 버그들을 잡습니다. 왜냐하면 그것들은 실행 시간에만 나타난다.

### 반 패턴

시스템 내 모든 역할은 LLM이고 모든 역할의 출력은 "나에게는 잘 보인다". 클래식 MAST 실패 모드입니다. 적어도 한 가지 검증기를 추가하십시오. 그 승승/실패는 LLM가 아닌 코드에 의해 결정됩니다.

### 프레임 맵핑

- **CrewAI**`Agent(role, goal, backstory)`교과서 전문지표면입니다.
- **LangGraph** 노드는 전문적인 명령어를 가질 수 있으며 가장자리는 파이프라인을 강화합니다.
- **AutoGen** 그룹 채팅에서 한 단어의 이름을 가진 역할 특수한 대화형 에이전트.
- **OpenAI Agents SDK** 역할 전문 요원들 사이의 교류 도구.

```figure
swarm-roles
```

## 건설 해

`code/main.py`간단한 파이썬 함수를 구축하는 4 역할 파이프라인을 구현합니다.

- **Planner**스펙을 생산합니다.
- **Executor**코드 문자열을 생성합니다.
- **Critic**(LLM 시뮬레이션) 명백한 문제점을 표시합니다.
- **Verifier**생성된 코드를 모래 상자에 실행합니다 (`exec`) 시험 사례에 대하여

데모는 두 번 실행됩니다. 한번 실행자가 올바른 코드를 생성 (비평 + 검증자 둘 다 통과), 한번 실행자가 비특정 코드를 생성 (비평자는 오류가 유연하다고 보이기 때문에 오류를 놓치고, 검증자는 테스트가 실패하기 때문에 그것을 잡습니다).

실행:

```
python3 code/main.py
```

## 사용 하 고

`outputs/skill-role-designer.md`작업에 참여하고 역할 목록 (3-5 역할), 각 역할에 대한 입력/출력 스케마 및 검증자 검증을 생성합니다.

## 선박

체크리스트:

- **At least one deterministic verifier.**절대 절대 절대
- **Explicit I/O schema per role.**계획자는 프로라가 아닌 스펙을 반환합니다. 실행자는 그 스케마를 읽습니다.
- **Communicative dehallucination.**집행자는 계획자에게 정보가 부족할 때 물어봐야 합니다. 결코 그것을 발명하지 마십시오.
- **Critic/verifier ordering.**먼저 비평자를 실행하세요 (싼, 디자인 문제를 잡습니다), 두 번째로 검증자를 실행하세요 ( 느린, 버그를 잡습니다).
- **Loop budget.**인간으로 올라갈 때까지 2회 중위-경제자 개정 경기가

## 운동

1. 달아`code/main.py`그리고 검증자가 비평가에서 놓친 버그를 어떻게 발견하는지 관찰합니다.`return`) 를 추가 검증자로 사용 합니다. 실행 시간 테스트에서 놓친 것을 발견하는 것은 무엇입니까?
2. 5번째 역할: "소유 분석가"로 사용자 의사를 계획자 준비된 스펙으로 번역합니다. 어떤 커뮤니케이션 탈허시네이션 요청이 그 수치를 따라올 수 있을까요?
3. MetaGPT 섹션 3 ("원들") 를 읽어 보세요. MetaGPT의 5개의 역할 중 하나하나의 입력/출력 스케마를 나열하세요.
4. 채트 데브의 채트 체인 다이어그램을 읽어보십시오 (arXiv:2307.07924 그림 3). 커뮤니케이션 탈허리цина션이 무한한 루프를 깨는 곳을 확인합니다.
5. PwC의 7x 정확성 향상은 검증 루프에서 비롯되었다. 검증기를 추가하는 것이 도움이 되지 않는 세 가지 작업을 가설하면  정확성의 결정적 검증이 불가능하거나 금기적으로 비싸다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Role specialization | "Different agents, different jobs" | Distinct system prompts tuned for planner/executor/critic/verifier roles. |
| SOP pattern | "Encoded standard operating procedure" | MetaGPT's framing: strict I/O schemas per role turn a team into a pipeline. |
| Communicative dehallucination | "Ask before inventing" | ChatDev pattern: executor asks planner when a detail is missing rather than making one up. |
| Critic | "LLM reviewer" | Subjective, opinionated reviewer. Catches taste issues. Can be fooled by plausible prose. |
| Verifier | "Deterministic check" | Code-based pass/fail. Test runner, type checker, schema validator. Cannot be fooled. |
| Verification gap | "No one checked" | 21.3% of MAST failures. Answer shipped without a check that would have caught the bug. |
| Revision loop | "Critic sends it back" | Critic rejection triggers executor re-run with feedback. Needs a budget. |
| All-LLM anti-pattern | "Looks good to me" | Every role is an LLM, no deterministic check. Classic MAST failure. |

## 더 많은 읽기

- [Hong et al. — MetaGPT: Meta Programming for Multi-Agent Collaboration](https://arxiv.org/abs/2308.00352) 역할상 SOP 간신히 참조 문서
- [Qian et al. — Communicative Agents for Software Development (ChatDev)](https://arxiv.org/abs/2307.07924) 채팅 체인 + 커뮤니케이션 탈허시네이션
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST 분류학; 검증 격차는 실패의 21.3%를 차지한다
- [CrewAI docs — Agent roles](https://docs.crewai.com/en/introduction) 생산 역할 특성 표면
