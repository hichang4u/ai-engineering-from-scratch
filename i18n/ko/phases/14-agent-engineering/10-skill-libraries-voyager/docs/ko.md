# 기술 도서관 및 평생교육 (Voyager)

> 보이저 (Wang et al., TMLR 2024) 는 실행 가능한 코드를 기술로 취급합니다. 기술들은 환경 피드백에 의해 이름, 검색, 구성 및 정비됩니다. 이것은 클로드 에이전트 SDK 기술, 기술 키트 및 2026 기술 도서관 패턴의 참조 건축입니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**Time:** ~75 minutes

## 학습 목표

- 보이저의 세 가지 구성 요소를 명명하라. 자동 교육과정, 기술 라이브러리, 반복적 촉구, 그리고 각자의 역할.
- 왜 보이저가 원시 명령이 아닌 행동 공간 코드를 만드는지 설명해줘
- 등록, 검색, 구성 및 실패로 인한 정비로 stdlib 기술 라이브러리를 구현하십시오.
- 2026년 클로드 에이전트 SDK 기술과 스킬킷 생태계에 대한 보이저 패턴을 지도로 그려보세요.

## 문제

모든 세션에서 모든 능력을 처음부터 재구성하는 에이전트는 세 가지 잘못을 합니다.

1. **Waste tokens.**모든 작업은 같은 논의를 다시 불러일으키죠.
2. **Lose progress.**세션 A에서 배운 수정은 세션 B로 옮겨지지 않습니다.
3. **Fail on long-horizon composition.**복잡한 작업은 능력 계층이 필요합니다. 단 한 번의 명령은 그것을 표현할 수 없습니다.

보이저의 대답은: 재사용 가능한 모든 기능을 도서관에서 저장된 이름의 코드 조각으로 취급하고, 유사성으로 검색할 수 있고, 다른 기술과 결합할 수 있고, 실행 피드백으로 정교하게 처리합니다.

## 개념

### 3가지 요소

보이저 (arXiv:2305.16291) 는 다음과 같은 요인을 구성합니다.

1. **Automatic curriculum.**호기심에 힘입어 제안하는 사람은 현재의 기술과 환경 상태에 따라 다음 작업을 선택합니다. 탐사는 아래에서 위로입니다.
2. **Skill library.**각 기술은 실행 가능한 코드입니다. 작업이 성공하면 새로운 기술들이 추가됩니다. 기술들은 질의와 설명의 유사성으로 검색됩니다.
3. **Iterative prompting mechanism.**실패로 인해 에이전트는 실행 오류, 환경 피드백 및 자기 검증 출력을 받고, 기술을 정비합니다.

마인크래프트 평가 (Wang et al., 2024): 3.3x 더 독특한 아이템, 8.5x 더 빠른 돌 도구, 6.4x 더 빠른 철 도구, 2.3x 더 긴 지도 통과 대 기본 라인. 숫자는 Minecraft-특별하지만 패턴이 전송.

### 행동 공간 = 코드

대부분의 에이전트는 원시적인 명령을 내리는데, 보이저는 자바스크립트 기능을 내리는데,

```
async function craftIronPickaxe(bot) {
  await mineIron(bot, 3);
  await mineStick(bot, 2);
  await placeCraftingTable(bot);
  await craft(bot, 'iron_pickaxe');
}
```

하위 기술로 구성되어 설명과 임베디션에 키가 저장되어 프로그램으로 검색됩니다

이것은 2026 클로드 에이전트 SDK 기술입니다. 이름 붙여진, 검색 가능한 코드 조각과 명령어, 에이전트가 요구에 따라 로드합니다.

### 기술 수확

새로운 임무는 다이아몬드 픽사 만드는 것

1. 작업 설명에 삽입합니다.
2. 상위 K와 비슷한 기술을 위한 기술 도서관에서 질문합니다.
3. 검색`craftIronPickaxe``mineDiamond``placeCraftingTable`그리고
4. 새로운 기술을 검색한 원시물 + 새로운 논리에서 구성합니다.

이것은 MCP 자원 (단계 13) 및 에이전트 SDK 기술 구현 패턴입니다. 현재 작업에 대한 범위로 지식/코드 표면을 검색합니다.

### 반복적인 정제

보이저의 피드백 루프:

1. 에이전트가 기술력을 써서
2. 기술은 환경에 대항합니다.
3. 3개의 신호 중 하나가 돌아옵니다.`success``error`(더더미 흔적이 있는)`self-verification failure`- 그래
4. 에이전트는 신호를 컨텍스트로 사용하여 기술을 다시 작성합니다.
5. 성공이나 최대 공을 내기까지 ループ

이것은 환경 기반 검증으로 코드 생성에 적용되는 자기 정제 (Lesson 05) 이다. CRITIC (Lesson 05) 는 검증자와 같은 외부 도구와 동일한 패턴이다.

### 교육과정 및 탐구

보이저의 교육과정 모듈은 에이전트가 무엇을 하고 있는지 아직 하지 않은 것에 따라 "호수 근처에 피난처를 건설하라"와 같은 작업을 제안한다. 제안자는 환경 상태 + 기술 인벤토리를 사용하여 현재 능력보다 조금 높은 작업을 선택합니다.

생산 에이전트들에 대해서는 "무엇이 빠지고 있는가"의 운영자로 번역됩니다. 현재 기술 도서관과 영역을 고려하면, 우리는 아직 어떤 기술을 다루지 못하고 있습니까? 팀들은 일반적으로 교육과정을 검토하는 방법으로 수동적으로 구현합니다.

### 이 패턴이 잘못되는 곳

- **Skill library rot.**같은 기술은 약간 다른 설명으로 10번 추가됩니다. 글쓰기에 분배를 추가합니다. 검색은 한 번만 반환합니다.
- **Composed-skill drift.**부모의 능력은 정교한 아이에게 달려 있습니다. 버전 능력은 v1에 고정된 부모의 마법으로 v3를 모을 수 없습니다.
- **Retrieval quality.**기술 설명에 대한 벡터 검색은 몇 백 개 이상의 라이브러리를 증가함에 따라 저하됩니다. 태그 필터와 하드 제한 ("만 기술과`category=tooling`"

```figure
voyager-skills
```

## 건설 해

`code/main.py`STDlib 기술 라이브러리를 구현합니다:

- `Skill` 이름, 설명, 코드 (줄으로), 버전, 태그, 의존성
- `SkillLibrary` 등록, 검색 (토큰 초복), 작곡 (토폴로지 유형의 deps), 그리고 정비 (정부 업데이트에 대한 버전 bump).
- 스크립트된 에이전트가 3가지 원시적인 기술을 등록하고 4번째를 작곡하고 실패를 당하고 정비합니다.

실행하세요:

```
python3 code/main.py
```

추적은 라이브러리 작성, 검색, 작곡, 실패한 실행, 그리고 v2 정비  보저의 루프 끝으로 끝.

## 사용 하 고

- **Claude Agent SDK skills**(인тропо) 2026 참조: 각 기술에는 설명, 코드, 지침이 있습니다. 에이전트 세션에서 요구에 따라 로드됩니다.
- **skillkit**(npm: 스킬킷)  32+ AI 코딩 에이전트들을 위한 대 대 에이전트 간 스킬 관리.
- **Custom skill libraries** 도메인 특수한 (데이터 에이전트들에 대한 SQL 기술, 인프라 에이전트들에 대한 테라폼 기술) 로 보이저 패턴은 축소된다.
- **OpenAI Agents SDK `tools`** 낮은 끝에서; 각 도구는 가벼운 기술입니다.

## 선박

`outputs/skill-skill-library.md`로저 모양의 기술 라이브러리를 생성합니다. 등록, 검색, 버전 제작 및 정비와 함께 모든 목표 실행 시간으로 연결됩니다.

## 운동

1. 의존성 주기의 탐지기를 추가합니다`compose()`A가 A에 의존하는 A가 A에 의존하는 A가 A가 실수와 경고를 하면 어떻게 될까요?
2. 기술별 버전 을 구현합니다. 부모의 기술로 아이가 구성되면`crafting@1`, 정제`crafting@2`부모를 조용히 업그레이드 할 수 없습니다.
3. 토큰 오버래프 검색을 문장 변환기 임베디션 (또는 BM25 stdlib impl) 으로 대체하십시오. 50 기술 장난감 라이브러리에서 검색@5을 측정하십시오.
4. "과정" 에이전트를 추가: 현재 도서관과 도메인 설명을 고려하면 5가지 부족한 기술을 제안하고 매주 호출하십시오.
5. 앤트로피스의 클로드 에이전트 SDK 기술 문서들을 읽어보세요. 장난감 라이브러리를 SDK의 기술 스케마로 옮기세요. 발견 가능성에 어떤 변화가 있을까요?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Skill | "Reusable capability" | Named chunk of code + description, retrievable by similarity |
| Skill library | "Agent memory of how-to" | Persistent store of skills, searchable and composable |
| Curriculum | "Task proposer" | Bottom-up goal generator driven by current capability gap |
| Composition | "Skill DAG" | Skills invoking skills; topologically sorted on execution |
| Iterative refinement | "Self-correcting loop" | Env feedback + errors + self-verification fold back into the next version |
| Action-space-as-code | "Programmatic actions" | Emit functions, not primitive commands, for temporally extended behavior |
| Dedup on write | "Skill collapse" | Near-duplicate descriptions collapse to one canonical skill |

## 더 많은 읽기

- [Wang et al., Voyager (arXiv:2305.16291)](https://arxiv.org/abs/2305.16291) 본래의 기술 도서관 논문
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)2026년 생산성
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) 실무에서의 기술과 부자재
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) 보이저 아래의 정제 루프
