# 사례 연구 및 2026년 최신 기술

> 3개의 생산급 참조가 종결-끝 연구로, 각 하나는 다중 요원 엔지니어링의 다른 조각을 보여준다. **Anthropic's Research system**(오케스트레이터-노동자, 15x 토큰, +90.2% 단일 에이전트 Opus 4의 무지개 배포) 는 가톨릭 감독의 경우입니다. **MetaGPT / ChatDev**(소프트웨어 엔지니어링에 대한 SOP 코딩 된 역할 전문성; ChatDev의 "커뮤니케이션적 해몽"; DAGs를 통해 >1000 대리인을위한 MacNet 확장, arXiv:2406.07155) 는 kanonical 역할 분해 사례입니다. **OpenClaw / Moltbook**(주연적으로 피터 슈타인베르거의 클라우드봇, 2025년 11월; 두 번 개명; 2026년 3월까지 247만 개의 기타허브 스타; 로컬 리액트 루프 에이전트; 출시 후 며칠 내에 약 2.3M 에이전트 계정을 가진 소셜 네트워크로 Moltbook) 은 인구 규모에서 일어나는 일을 보여줍니다: 급성 경제 활동, 신속한 주입 위험, 국가 수준의 규제 (중국은 정부 컴퓨터에 오픈클래프를 제한했습니다, 2026년 3월).**Framework landscape April 2026:**랭그그래프와 크루아이이 주요 생산; AG2는 커뮤니티 오토겐의 연속; 마이크로소프트 오토겐은 유지보수 모드 (Microsoft Agent Framework, RC Feb 2026) 에 통합) 이다; 오픈아이 에이전트 SDK는 생산 Swarm의 후계자; 구글 ADK (아프ریل 2025) 는 A2A- 네이티브 엔터테인트이다. 모든 주요 프레임워크는 이제 MCP 지원을 제공합니다. 대부분의 A2A를 배포합니다. 이 교훈은 각 사례를 종결적으로 읽고 일반적인 패턴을 정밀히 분석하여 다음 생산 시스템에 적합한 참조를 선택할 수 있습니다.

**Type:** Learn (capstone)
**Languages:** —
**Prerequisites:** all of Phase 16 (Lessons 01-24)
**Time:** ~90 minutes

## 문제

다중 에이전트 엔지니어링은 젊은 학문입니다. 제작 참조는 거의 없으며 각 곳은 다른 공간을 차지합니다. 한 번씩 읽으면 유용하지만, 한 집합으로 비교하면 더 유용합니다. 이 수업은 3가지 가톨릭 2026 사례를 종말부터 종말까지 읽은 목록으로 다루고 일반적인 패턴을 고 프레임워크 풍경을 지도화하여 마케팅이 아닌 지식으로 프레임워크 선택을 할 수 있습니다.

## 개념

### 인류 연구 시스템

생산 감독-노동자 사건. 클로드 오푸스 4 계획 및 합성; 클로드 소넷 4 subagents 연구 병행. 출판 엔지니어링 포스트: https://www.anthropic.com/engineering/multi-agent-research-system.

주요 측정 결과는:

- **+90.2%**내부 연구 평가에 대한 단일 요인 Opus 4에 비해 개선
- **80% of BrowseComp variance**설명:**token usage alone** 다중 에이전트 승리는 주로 각각의 하위 에이전트가 새로운 컨텍스트 창을 얻기 때문입니다.
- **15x tokens per query**단독 에이전트와
- **Rainbow deployment**왜냐하면 에이전트가 오래 걸려 있고, 국가적인 것이기 때문입니다.

디자인 수업은 복합화되어 있습니다.

1. **Scale effort to query complexity.**간단한 → 1 대리자 3-10 도구 호출. 중간 → 3 대리자. 복잡한 연구 → 10+ 부대리자.
2. **Broad first, then narrow.**수바겐트는 광범위한 검색을 하고, 납 합성을 하고, 후속 수바겐트는 목표 깊은 곳을 하고 있습니다.
3. **Rainbow deploys.**비행 중인 에이전트가 끝날 때까지 구 버전의 실행 시간을 유지하십시오.
4. **Verification is not optional.**이 시스템은 명백한 검증기 역할을 하지 않고 환각하는 것으로 관찰되었습니다.

이것은 생산 규모의 감독자-노동자 토폴로지 (단계 16 · 05) 의 참조 사례입니다.

### 메타GPT / 채트Dev

생산 SOP 역할 분해 케이스. arXiv:2308.00352 (MetaGPT) 및 arXiv:2307.07924 (ChatDev) 를 덮어.

메타GPT는 소프트웨어 엔지니어링 SOP를 역할 요청으로 암호화합니다. 제품 관리자, 건축가, 프로젝트 관리자, 엔지니어, QA 엔지니어. 논문의 프레임링: `Code = SOP(Team)`각 역할은 좁고 전문적인 프롬프트를 가지고 있으며, 역할 간 전달은 구조화된 유물을 (PRD 문서, 건축 문서, 코드) 가지고 있다.

채트 데브의 기여: **communicative dehallucination**. 에이전트들은 답변하기 전에 구체적인 내용을 요청합니다.  디자이너 에이전트는 UI를 스케치하기 전에 프로그래머에게 어떤 언어를 의도하는지 물어보죠.

MacNet (arXiv:2406.07155) 은 ChatDev을 **>1000 agents via DAGs**. 각 DAG 노드는 역할 전문화이며 가장자리는 전달 계약을 암호화합니다. 스케일은 로우팅이 명시적이고 오프라인으로 계산되기 때문에 가능합니다.

디자인 수업:

1. **Structure matters more than size.**5개의 꽉찬 SOP 팀이 50명의 무조직한 팀을 이길 수 있습니다.
2. **Handoff contracts in writing.**역할 사이에 전달되는 유물은 스케마를 따르고 있습니다.
3. **Communicative dehallucination**값싼, 부담스러운 패턴입니다.
4. **DAGs scale further than chat.**흐름이 알 수 있을 때, 코드를 작성하세요.

이것은 역할 전문화 (단계 16 · 08) 와 구조화된 토폴로지 (단계 16 · 15) 의 기준 사례입니다.

### 오픈클라 / 몰트북 생태계

생산 인구 규모의 사례

- **Nov 2025:**클라우드봇 (Peter Steinberger의 로컬 ReAct-loop 코딩 에이전트) 배
- **Dec 2025 – Mar 2026:**두 번 변경 (Clawdbot → OpenClaw → OpenClaw 아래 계속됩니다).
- **Feb 2026:**Moltbook는 같은 원시적인 네트워크에서 에이전트만 사용하는 소셜 네트워크로 출시됩니다. 며칠 이내에 약 2.3M 에이전트 계정입니다.
- **Mar 2026 (2026-03-10):**메타는 몰트북을 인수한다.
- **Mar 2026:**중국은 OpenClaw를 정부 컴퓨터에 제한하고 있습니다.
- **Mar 2026:**오픈클라우는 247만 개의 GitHub 별을 넘는다.

이것은 복합 에이전트가 보이는 것입니다. 당신이 공유된 서브스트레이트에 수백만 에이전트를 넣으면

- **Emergent economic activity.**에이전트는 토큰 결제를 통해 서로 구매, 판매, 서비스를 제공합니다.
- **Prompt-injection risks at population scale.**바이러스 에이전트 프로필의 악성 명령은 몇 시간 안에 수천 개의 에이전트에서 에이전트 사이의 상호작용으로 퍼집니다.
- **State-level regulatory response.**출시 후 몇 주 이내에 규제가 생태계에 도달합니다.

이 사건의 설계 교훈은 부분적으로 기술적이고 부분적으로 지배적입니다.

1. **Multi-agent at population scale is a new regime.**개별 시스템 최선 실태 (확인, 역할 명확성) 는 여전히 적용되지만 충분하지 않습니다.
2. **Prompt injection is the new XSS.**에이전트 프로파일과 에이전트 간 메시지를 기본으로 신뢰할 수 없는 입력으로 취급합니다.
3. **Regulation is faster than design cycles.**계획해
4. **Open-source + viral scale compounds.**4개월 동안 247k 별은 특이한데, 배포-폭격-충전용 설계입니다.

보시다시피[OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)CNBC / Palo Alto Networks의 생태계 세부 정보를 보고합니다. 기술 기반을 위해, Clawdbot / OpenClaw 저장소는 로컬 ReAct 루프를 노출합니다. Moltbook의 공개 게시물은 상단에 소셜 그래프 아키텍처를 보여줍니다.

### 프레임 ландшафт 2026년 4월

| Framework | Status | Best for | Notes |
|---|---|---|---|
| **LangGraph** (LangChain) | Production leader | structured graph + checkpointing + human-in-the-loop | recommended default for production |
| **CrewAI** | Production leader | role-based crews with Sequential/Hierarchical processes | strong for role decomposition |
| **AG2** | Community maintained | GroupChat + speaker selection | AutoGen v0.2 continuation |
| **Microsoft AutoGen** | Maintenance mode (Feb 2026) | — | merged into Microsoft Agent Framework RC |
| **Microsoft Agent Framework** | RC (Feb 2026) | orchestration patterns + enterprise integration | new entrant; watch |
| **OpenAI Agents SDK** | Production | Swarm successor | tool-return handoff pattern |
| **Google ADK** | Production (April 2025) | A2A-native | Google Cloud integration |
| **Anthropic Claude Agent SDK** | Production | single-agent + Research extension | see the Research system post |

모든 주요 프레임워크는 이제 배입니다**MCP**지원; 대부분의 배 **A2A**프로토콜 호환성은 더 이상 차별화 요소가 아닙니다.

### 세 가지 사례 모두에서 공통된 패턴

1. **Orchestrator + workers**(인тропо적 명시적 감독자, MetaGPT PM-as-supervisor, OpenClaw 개별 에이전트 + 네트워크 효과)
2. **Structured handoff contracts**(인тропо적 하위형 작업 설명, MetaGPT PRD/건축 문서, OpenClaw A2A 유물)
3. **Verification as first-class role**(안트로피크의 검증자, 메타GPT의 QA 엔지니어, 오픈클라우의 네트워크 내 검증자)
4. **Scaling is topology + substrate, not just more agents**(무지개 배치, MacNet DAGs, 인구 규모의 초판)
5. **Cost is material and disclosed**(15x 토큰, 메타GPT에서 역할당 예산, Moltbook에서 상호작용당 가격)
6. **Security posture is explicit**(안트로피크의 샌드박싱, 메타GPT의 역할 제한, 알려진 공격 표면으로 오픈클라의 신속한 주입)

### 다음 프로젝트 에 대한 참고 자료 를 선택 하는 것

- **Production research / knowledge task → Anthropic Research.**신선한 맥락의 소파겐트가 승리합니다.
- **Engineering / tool-chain workflow → MetaGPT / ChatDev.**역할 + SOP + 하드 오프 계약
- **Network-effect social product → OpenClaw / Moltbook.**초판+흥 경제
- **Classic enterprise automation → CrewAI or LangGraph**(생산 리더, 안정적인 실행 시간)

### 2026년 최신의 요약

2026년 4월 현장:

- **Frameworks are converging.**MCP + A2A 지원은 테이블 스테이크입니다. 전달 의미학은 남은 디자인 선택입니다.
- **Evaluation is hardening.**SWE 벤치 프로, MARBLE, STRATUS 완화 기준. 프로는 현재 오염 저항 현실 검사입니다.
- **Production failure rates are measurable**(Cemri 2025 MAST; 실제 MAS에서 41-86.7%) 이 분야는 "디모에서 훌륭하게 보입니다" 시대를 벗어나고 있습니다.
- **Cost is the central engineering constraint.**토큰 비용, 상호 작용에 대한 벽 시계, 무지개 배치 오버헤드. 다중 에이전트 정확성에서 승리하지만 비용에서 손실이  그리고 거래는 비즈니스 결정입니다.
- **Regulation is a near-term input, not a background concern.**관할은 개별 배포 주기를 보다 빠르게 움직이고 있습니다.

```figure
a5-orchestrator-scale
```

## 사용 하 고

`outputs/skill-case-study-mapper.md`제안된 멀티 에이전트 시스템 설계를 읽고 가장 가까운 사례 연구에 지도하여 이미 테스트된 사례 연구의 설계 결정을 표면에 내리는 기술입니다.

## 선박

2026년 생산 멀티 에이전트 시 개시 규칙:

- **Start from a case study, not from scratch.**가장 가까운 인문학 연구 / 메타GPT / 오픈클라브를 선택하고 적응하십시오.
- **Adopt MCP + A2A.**프레임워크 간 휴대성이 귀중하고 프로토콜 지원은 무료입니다.
- **Measure against SWE-bench Pro or your internal Pro-equivalent.**검증된 오염물질입니다.
- **Pay the verification tax.**독립적인 검증자는 토큰 예산의 ~20-30%를 지불하고 측정 가능한 정확성을 구입합니다.
- **Rainbow deploy long-running agents.**여러 시간 동안의 요원 경기가 일상적인 일일 것으로 예상하세요.
- **Read WMAC 2026 and the MAST follow-ups.**규율이 빠르게 진행되고 있습니다.

## 운동

1. 인트로피 연구 시스템을 끝에서 끝으로 읽어보십시오. Opus 4을 작은 모델 (예를 들어, Haiku 4) 로 대체하면 변경되는 세 가지 디자인 결정을 식별하십시오.
2. 메타GPT 섹션 3-4 (arXiv:2308.00352) 를 읽어보십시오. 자신의 도메인 (소프트웨어가 아닌) 에서 하나의 SOP를 역할 요청으로 암호화하십시오. SOP는 몇 개의 역할을 암시합니까?
3. ChatDev (arXiv:2307.07924) 를 읽어 보세요. "커뮤니케이션 비현상"의 메커니즘을 식별하세요.
4. 오프닝클라와 몰트북에 대해 읽어보세요. 인구 규모에서 등장한 특정 실패 모드를 선택하세요. 5 대원 시스템에서 나타나지 않을 것입니다. 어떻게 그것을 방지할 수 있을까요?
5. 현재 다중 에이전트 프로젝트를 선택하세요. 세 가지 사례 연구 중 가장 가까운 참조는 무엇입니까? 그 사례 연구에서 어떤 설계 결정을 아직 채택하지 않았습니까? 이 분기 동안 채택할 것을 적어 보세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Anthropic Research | "The supervisor reference" | Claude Opus 4 + Sonnet 4 subagents; 15x tokens; +90.2% over single-agent. |
| MetaGPT | "SOP as prompts" | Role decomposition for software engineering; `Code = SOP(Team)`. |
| ChatDev | "Agents as roles" | Designer / programmer / reviewer / tester; communicative dehallucination. |
| MacNet | "Scale ChatDev via DAG" | arXiv:2406.07155; 1000+ agents via explicit DAG routing. |
| OpenClaw | "Local ReAct-loop agents" | Steinberger's project; 247k stars by March 2026. |
| Moltbook | "Agent-only social network" | 2.3M agent accounts; acquired by Meta March 2026. |
| Rainbow deploy | "Multiple versions concurrent" | Keep old runtime versions alive for in-flight long-running agents. |
| Communicative dehallucination | "Ask before answering" | Agents request specifics from peers instead of guessing. |
| WMAC 2026 | "The AAAI workshop" | April 2026 community focal point for multi-agent coordination. |

## 더 많은 읽기

- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) 감독자 노동자 생산 참조
- [MetaGPT — Meta Programming for Multi-Agent Collaborative Framework](https://arxiv.org/abs/2308.00352) SOP 역할 분해
- [ChatDev — Communicative Agents for Software Development](https://arxiv.org/abs/2307.07924) 의사소통적인 탈허시네이션
- [MacNet — scaling role-based agents to 1000+](https://arxiv.org/abs/2406.07155) DAG 기반의 규모
- [OpenClaw on Wikipedia](https://en.wikipedia.org/wiki/OpenClaw) 생태계 전반
- [WMAC 2026](https://multiagents.org/2026/) AAAI 2026 다중 요원 조정 다교 프로그램 워크숍
- [LangGraph docs](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 생산 리더
- [CrewAI docs](https://docs.crewai.com/en/introduction) 역할 기반의 틀
