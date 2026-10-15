# 생성물질과 신흥 시뮬레이션

> 박 등 2023 (UIST '23, arXiv:2304.03442) 인구**Smallville**, 25명의 에이전트들로 구성된 모래 상자, 3부 구조:**memory stream**(자연어 로그)**reflection**(중소 물질이 생성하는 자신의 흐름에 대한 더 높은 수준의 합성)**plan**(일간 수준의 행동, 그리고 하위 계획) 그 랜드마크의 결과는 발렌타인 데이 파티의 등장이었습니다. 한 에이전트는 더 이상의 스크립팅 없이 " 발렌타인 데이 파티를 던지고 싶어한다"는 것을 심어, 인구에 퍼져있는 초대장을 생산하고, 연계된 날짜를 만들어, 파티는 24 명의 에이전트로부터 시작되었습니다. Ablations는 세 가지 구성 요소 모두 신뢰성 위해 필요하다는 것을 보여줍니다. 기록된 오류는 공간 규범 오류 ( 폐쇄된 가게에 들어가고, 개인 화장실을 공유하는 것) 이다. 이것은 2026년에 에이전트 시뮬레이션과 멀티 에이전트 사회적 평가에 대한 참조 구조입니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model), Phase 16 · 13 (Shared Memory)
**Time:** ~75 minutes

## 문제

대부분의 멀티 에이전트 시스템은 긴밀하게 스크립트된 팀입니다. 계획자 계획, 코더 코드, 리뷰어 리뷰. 그것은 잘 정의된 작업에 효과가 있습니다. 그것은 에이전트들이 메모리와 우선 순위와 개방된 세계를 가지고 있을 때 발생하는 새로운, 스크립트되지 않은 행동을 캡처하지 않습니다. 연구, 사회 시뮬레이션, 그리고 점점 더 게임 AI는 이 두 번째 유형이 필요합니다.

스몰빌 아키텍처는 그 기준입니다. 2023년 박까지, 가장 좋은 에이전트 시뮬레이션은 한 스크립트-파를 사용했고, 그 이후에는 패턴은 오픈 월드에서 생성 에이전트들의 기본이다. 2026년에 에이전트 시뮬레이션을 만들면 스몰빌의 세 가지 구성 요소를 사용하거나 왜 그렇지 않은지 명시적으로 정당화하고 있습니다.

## 개념

### 세 가지 구성요소

**Memory stream.**관찰, 행동, 반사 및 계획의 추가 로그. 각 항목에는 시간표, 유형, 설명 (자연 언어) 및 파생 메타데이터:**recency****importance**(중개인이 자기 평가를 1-10으로 내놓은)**relevance**(현재 질의와 유사함)

```
[2026-02-14 09:12:03] observation: Isabella Rodriguez asked me if I like jazz
[2026-02-14 09:14:22] reflection:   I enjoy long conversations about music
[2026-02-14 10:05:00] plan:         Attend Isabella's Valentine's Day party tonight
```

메모리 검색은 세 점수를 결합합니다:`score = w_recency * e^(-decay * age) + w_importance * importance + w_relevance * cos_sim`. 상위 K 항목은 현재 명령어에 입력합니다.

**Reflection.**주기적으로 (N 기억마다 또는 중요한 사건에서) 에이전트는 최근의 기억에서 더 높은 순서 합성을 생성합니다. 반사 항목은 스트림으로 돌아가 다른 기억과 마찬가지로 검색됩니다. 이렇게 에이전트는 " 이해"를 구축합니다.

**Plan.**위 아래로 분해. 먼저 일급 계획 ("직장에 가서 클라우스와 저녁 식사를 한다") 를 크게 정리한다. 그 다음 시간급 계획이다. 그 다음 행동급 계획이다. 계획은 수정될 수 있다. 관찰이 계획에 반하는 경우, 요원은 영향을 받은 부분을 재계획한다.

### 왜 세 가지 모두 중요 한 이유 (제단)

박 박 등은 관찰, 반성, 계획의 각 부분을 떨어뜨리는 추락을 실행했습니다.

-     없이**observation**요원은 맥락을 놓치고 오래된 신념에 따라 행동합니다.
-     없이**reflection**대리인은 더 높은 순위에서의 믿음을 형성할 수 없습니다. 상호작용은 습니다.
-     없이**plan**행동은 반응적인 소리로 변하고 목표가 사라집니다.

인간 평가자로부터의 신뢰성 점수는 세 가지에서 가장 높습니다. 어느 하나 떨어지면 측정 가능한 회귀를 생성합니다.

### 발렌타인 데이의 발현

이자벨라 로드리게스라는 에이전트 중 한 명은 "February 14일 오후 5시에 Hobbs 카페에서 발렌타인 데이 파티를 열고 싶어한다"라는 목표를 가지고 있다. 다른 24명의 에이전트는 그런 씨앗을 받지 않는다.

1. 이자벨라의 계획은 사람들을 초대하는 것
2. 초청은 이웃의 기억의 흐름에 있는 관찰이 됩니다.
3. 이웃의 생각으로 "이사벨라가 파티를 하고 있다"는 생각을 하게 됩니다.
4. 이웃의 계획은 "2월 14일에 파티에 참석하는 것"을 포함합니다.
5. 이웃들은 다른 이웃들에게 말해주고 초청은 중앙의 조율 없이 퍼져나간다.
6. 2월 14일 오후 5시에 몇 명의 에이전트가 호브스 카페에서 모였습니다.

이것은 기술적인 의미에서 등장하는 것입니다. 시스템 수준에서의 행동 (당) 은 중앙 오케스트레이터 없이 지역 상호 작용 (중립 초청 + 개별 계획) 에서 발생했습니다.

### 문서화된 실패 모드

파크 등은 명시적으로 문서:

- **Spatial norm errors.**에이전트들은 닫힌 가게에 들어가고, 에이전트들은 같은 개인 화장실을 사용하려고 한다. 에이전트들은 식사할 목적으로 하지 않은 방에서 식사를 한다. 모델은 환경에서만 사회-물리적 규범을 추론하지 않는다.
- **Memory overflow.**심도 있는 시뮬레이션 실행은 메모리 복구 비용의 증가에 원인이 됩니다. 실용적인 치료법: 주기적인 메모리 압축 (결과 및 절제) 및 낮은 중요성 항목에 대한 붕괴.
- **Reflection hallucination.**반사들은 메모리 스트림에서 존재하지 않는 관계를 발명할 수 있습니다. 완화: 반사 명령어에 소스 메모리 ID를 포함하고 검색 시점에 확인합니다.

이것은 생산에 관련된 실패 모드입니다. 2026 에이전트 시뮬레이션은 그것들을 상속합니다.

### 3가지 요소의 시행규칙

1. **Memory is append-only.**기억 항목을 변동시키지 마세요. 수정은 새로운 항목입니다.
2. **Importance scores are cheap.**LLM에 전화해서 1-10의 중요성을 기록하고 점수를 캐시로 저장해 두세요.
3. **Retrieval is ranked, not filtered.**조합 점수를 기준으로 1k; 하드 필터를 사용하지 마십시오 (콘텍스트를 잃습니다).
4. **Reflection runs periodically.**트리거가 처리되지 않은 기억의 중요성의 합이 임계점을 초과할 때 (예를 들어 150).
5. **Plans are revisable.**새로운 관찰이 계획에 반하는 경우 전체 계획이 아닌 영향을 받은 부분만 재생하십시오.

### 스몰빌 너머의 생성물

2024~2026년 후속 문학은 건축을 확장합니다.

- **Multi-agent social simulation for policy / market research.**스몰빌과 같은 인구는 기능에 반응하여 사용자 행동을 시뮬레이션합니다. A/B 테스트보다 더 빠른; 정확성은 논란이 됩니다.
- **NPC AI for games.**스몰빌 에이전트들과의 RPG는 스크립트 로켓 대신 등장 스토리 라인을 만들어냅니다.
- **Generative-agent evaluation benchmarks.**작업 정확성보다는 메트릭은 오랜 시간 동안 행동의 신뢰성 + 일관성이됩니다.

확장자는 스와프 컴포넌트를 (메모리, 검색 증대 반사, 신경 상징적 계획) 하지만 세 부분 구조를 유지한다.

### 왜 이것이 다중 에이전트 엔지니어링에 중요한지

스몰빌은 복합 에이전트 출현이 올바른 구성 요소가 있을 때 저렴하다는 개념의 증거입니다. 건축은 이제 오픈 소스 모델에 복제되었습니다 (소형 LLM는 화려하게 신뢰성을 잃지 않습니다).**emergent social behavior**이 모양을 사용해서**tight task execution**이 단계에서 이전부터의 감독 / 역할 / 원시 패턴을 사용합니다.

```figure
a5-memory-reflection
```

## 건설 해

`code/main.py`스드블립 파이썬에서 스크립트 된 에이전트 정책 (실제 LLM) 을 적용하는 세 가지 구성 요소를 구현합니다.

- `MemoryStream` 최근/ 중요성/ 관련성 검색을 하는 추가만 로그
- `reflect(stream)` 최근 중요한 기억에 대한 스크립트 반영.
- `plan(agent_state)` 현재 신념에 기초한 일일 및 시간적 계획
- 시나리오: 5명의 에이전트, 에이전트 1은 "오후 5시에 투기 파티"를 시작합니다. 시뮬레이션 할 때, 초대장이 퍼지고 에이전트들이 합쳐집니다.

실행:

```
python3 code/main.py
```

예상 출력: 틱-틱 추적. 마지막 틱에 5명의 에이전트 중 적어도 3명은 파티를 계획에 표시하고 파티 장소에서 합당한다. 단일 씨앗은 어떤 오케스트레이터도 없이 조정된 도착을 만들어냈다.

## 사용 하 고

`outputs/skill-simulation-designer.md`생성물인 시뮬레이션을 설계합니다. 에이전트 수, 메모리 스케마, 반사 순서, 계획 지평 및 평가 메트릭.

## 선박

생산 시뮬레이션 규칙:

- **Memory is the database.**실제 매장을 선택하세요. 내기억 STDlib는 프로토타입입니다.
- **Log the retrieval trace.**모든 액션에 대해, 그것을 운전한 상위 K 기억을 기록하세요.
- **Budget per-agent tokens.**각 에이전트의 리트리브+레플렉트+플랜은$O(k)$LLM 전화, N 에이전트 × T 틱 × 틱당 전화는 예산이 더 크다.
- **Compact memory periodically.**소소한 항목을 요약하고 단축합니다. 보존 정책은 디자인 결정이고 세부 사항이 아닙니다.
- **Detect spatial / social norm violations**건축은 그것들을 배우지 않습니다.

## 운동

1. 달아`code/main.py`3+대원이 파티에 모인다고 확인해 10대까지 늘려요
2. 반사 단계를 제거하세요. 행동은 어떻게 생겼을까요?
3. 경쟁 하는 목표 를 소개 하십시오 ("클라우스 는 오후 5시에 연구 강연 을 하고 싶어 한다"). 에이전트 들 이 분열 하거나 한 목표 가 지배 하는 것 인가? 그 목표 를 결정 하는 것 은 무엇 입니까?
4. 공간적 제약 을 추가: 호브스 카페 는 최대 4 명의 에이전트를 수용 할 수 있다. 시뮬레이션 핸드는 우아하게 넘나들거나, "독인 욕실"의 실패 패턴을 맞습니까?
5. 박 등 (arXiv:2304.03442) 6부 (흥행동 실험) 을 읽어 보세요. 미니어처에서 재생할 수 없는 행동을 식별하세요. 건축물의 어떤 구성 요소를 개선해야 할까요?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Memory stream | "The agent's diary" | Append-only log of observations, actions, reflections, plans. |
| Recency | "How new is the memory" | Exponential-decay score by age. |
| Importance | "How much does the agent care" | Self-rated 1-10 at write time. Cached. |
| Relevance | "How related to the current query" | Cosine similarity (embedding-based). |
| Reflection | "Higher-order belief" | Synthesis generated from recent memories, re-ingested as a new memory. |
| Plan | "Day/hour/action decomposition" | Top-down plan tree. Revisable when observations contradict. |
| Smallville | "Park 2023's sandbox" | 25-agent simulation that produced the Valentine's Day emergence. |
| Believability | "The quality metric" | Human-rater score for whether behavior seems like a plausible agent. |

## 더 많은 읽기

- [Park et al. — Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) 참조 건축물
- [UIST '23 paper page](https://dl.acm.org/doi/10.1145/3586183.3606763) 출판 장소
- [Smallville code release](https://github.com/joonspk-research/generative_agents) 참고 파이썬 구현
- [Hayes-Roth 1985 — A Blackboard Architecture for Control](https://www.sciencedirect.com/science/article/abs/pii/0004370285900639) 구조화된 기억 요인을 위한 사전 예술
