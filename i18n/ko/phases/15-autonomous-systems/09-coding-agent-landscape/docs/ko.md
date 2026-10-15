# 자율 코드 에이전트 풍경 (2026)

> SWE 벤치 검증은 3년도 안 되는 기간에 4%에서 80.9%로 증가했습니다. 같은 클로드 소넷 4.5는 SWE-agent v1에서 43.2% 점수를 받았으며 클라인 자율주행에서 59.8% 점수를 얻었습니다 오픈핸즈 (옛날 오픈디빈) 는 MIT 라이선스 기반의 가장 활발한 플랫폼이며, CodeAct 루프는 JSON 도구 호출 대신 샌드박스에서 직접 파이썬 동작을 실행합니다. 제목 번호는 방법론적인 문제를 숨기는데: 500개의 SWE 벤치 검증된 작업 중 161개는 12 라인 변경이 필요하며, SWE 벤치 Pro (10+ 라인 작업) 는 동일한 경계 모델에 대해 2359%에 해당한다.

**Type:** Learn
**Languages:** Python (stdlib, CodeAct vs JSON tool-call comparison)
**Prerequisites:** Phase 14 · 07 (Tool use), Phase 15 · 01 (Long-horizon agents)
**Time:** ~45 minutes

## 문제

"어떤 코딩 에이전트가 가장 좋습니까?"라는 것은 잘못된 질문입니다. 올바른 질문은 다음과 같습니다. 제 작업과 일치하는 작업 분포에서, 생산에서 실행할 수 있는 스카프롤링으로, 저는 어떤 종말에서 종말까지 신뢰성을 얻습니다?

2022년과 2026년 사이에, 필드는 스카프롤딩이  검색 계층, 계획자, 모래 상자, 편집-확인 루프, 피드백 형식 가 부담을 안겨주는 것을 배웠습니다. 클로드 소넷 4.5 SWE-agent v1에서 SWE-bench Verified에서 43.2% 점수를 얻었고, 클라인의 자율적인 스카프올드 내부의 동일한 모델은 59.8% 점수를 얻었다. 16.6 절대적인 차이점, 동일한 무게 기본 모델은 구성 요소이고 루프는 제품입니다.

동반 문제 는 벤치마크 포화 는 회귀 를 숨기기 때문 이다. SWE 벤치 검증 은 포화 에 가까우며, 쉬운 작업 꼬리 (161 과 500 과제 중 ≤ 2 라인을 필요로 하는) 는 최고 점수를 끌어 올린다. 실제 세계 품질은 SWE 벤치 프로 (10+ 라인 변경) 와 같은 분포에서 더 잘 측정된다. 같은 리더는 여전히 2359%에 앉아 있다.

## 개념

### SWE 벤치, 1항

SWE-bench (Jimenez et al.) 는 기본 진실 패치와 실제 GitHub 문제를 가지고 테스트 스위트를 통과시키는 패치를 생성하도록 에이전트를 요청합니다. SWE-bench Verified (OpenAI, 2024) 는 인간으로 구성된 500 개의 작업 하위 집합으로 모호하고 깨진 작업이 제거됩니다. SWE-bench Pro는 10 + 라인 변경을 필요로하는 작업의 더 어려운 후계자입니다. 현재 국경 에이전트가 2359%에 앉아있는

### 2022 → 2026 곡선은 실제로 무엇을 보여줍니다

- **2022**: 원료 SWE 벤치에서 ~4%의 연구 모델
- **2024**: GPT-4 + Devin 스타일의 발판 ~ 14%; SWE 대원 ~ 12%
- **2025**: 클로드 3.5/3.7 Aider 내 소넷과 SWE 대리인이 40~55% 범위로 밀어 넣습니다.
- **2026**: 클로드 소넷 4.5 및 국경 경쟁자 70~80%+ SWE 벤치 검증. Epoch AI의 리더보드 이 실시간으로 추적합니다.

기울기는 세 가지 복합적 원천에서 왔습니다. 더 나은 기본 모델, 더 나은 스카프다링 (CodeAct, 반사, 검증 루프) 및 더 나은 벤치마크 (확인된 소음 제거).

### CodeAct vs JSON 도구 호출

오픈핸즈 (All-Hands-AI, arXiv:2407.16741, 이전 오픈디빈) 는 특정 건축적 베팅을 했다: 호스트가 디코드하고 실행하는 JSON 도구 호출을 발행하는 모델 대신, 모델은 파이썬 코드를 발행하고 Jupyter 스타일의 커널이 모래 상자에 실행합니다. 에이전트는 파일, 체인 도구 등을 룰러하고 하나의 액션 내에서 자신의 예외를 잡을 수 있습니다.

거래소:

- **JSON tool calls**: 모든 동작은 한 번으로 이루어집니다. 감사하기 쉽다. 구성성이 제한되어 있습니다.
- **CodeAct**: 하나의 동작은 전체 프로그램일 수 있습니다; 구성; 단단한 샌드박스를 필요로 합니다 (OpenHands는 Docker 격리를 사용합니다); 실패 모드는 샌드박스 실행 시간이 허용하는 모든 것을 포함합니다.

두 아키텍처 모두 생산 중입니다. CodeAct은 오픈 플랫폼 (OpenHands, smolagents) 에서 지배적이다. JSON 도구 호출은 실행자를 제어하는 제공자가 관리되는 서비스 (인тропо 관리 에이전트, OpenAI 보조) 에서 지배적이다.

### 2026년 풍경에 있는 스카프들

| Scaffold | License | Execution model | Notable property |
|---|---|---|---|
| OpenHands (OpenDevin) | MIT | CodeAct in Docker | Most active open platform; event-stream replayable |
| SWE-agent | MIT | Agent-Computer Interface (ACI) | First end-to-end SWE-bench scaffold |
| Aider | Apache-2 | edit-via-diff in local repo | Minimal scaffold, strong regression stability |
| Cline | Apache-2 | VS Code agent with tool policy | Highest-scoring open scaffold on Sonnet 4.5 |
| Devin (Cognition) | Proprietary | Managed VM + planner | First "AI software engineer" product category |
| Claude Code | Proprietary | Permission modes + routines | Lesson 10 covers the agent loop in detail |

### 왜 기판이 지배적 인 이유

코딩 경로는 긴 지평선 궤적 (강좌 1) 이다. 단계 간 신뢰성 화합물. 스카프올딩이 포인트를 구매하는 세 곳:

1. **Retrieval**SWE 에이전트의 ACI, OpenHands의 파일 인덱스, 그리고 Aider의 repo-맵은 모두 이것을 공격합니다.
2. **Verifier loop**: 테스트를 실행하고, 스택 흔적을 읽고, 다시 시도하는 것은 SWE 벤치에서 10+ 포인트 델타입니다.
3. **Failure containment**오류를 저지하여 회전하는 모래 상자는 복합적 손상을 방지합니다. 검증자 루프와 없는 동일한 모델은 두 가지 다른 제품처럼 보입니다.

### 벤치마크 포화와 실제 분포

오픈핸즈 저자와 Epoch AI 모두 SWE 벤치 Verified이 쉬운 꼬리를 가지고 있다고 표시합니다. 500 작업 중 161개 작업은 12 라인 변경이 필요합니다. 높은 점수는 부분적으로 이 꼬리로 인해 움직입니다. SWE 벤치 Pro는 10개 이상의 라인 변경에 제한하고 경계 시스템에서도 2359% 범위에서 점수를 반환합니다. 생산 분포는 거의 확실히 Verified보다 Pro에 가깝습니다.

에이전트를 선택하는 데의 함수: 자신의 버그 백록의 Pro 같은 하위 집합을 실행하십시오. 중요한 점수는 당신이 전송하는 작업에 대한 점수입니다.

```figure
a5-scaffold-delta
```

## 사용 하 고

`code/main.py`고정된 미니 작업 배포에 있는 두 개의 장난감 에이전트 스카프들을 비교합니다.

1. A**JSON tool-call**한 번씩 움직일 수 있는 발판
2. A**CodeAct**작은 파이썬 스니펫을 발사할 수 있는 스카프롤

두 가지 모두 줄기 "모델" (분명주의 규칙) 을 사용하므로 비교는 스카프롤을 모델 품질에서 분리합니다. 출력은 CodeAct 스카프롤이 더 큰 각 행동 폭발 반경의 비용으로 더 적은 차례에 더 많은 작업을 해결하는 것을 보여줍니다.

## 선박

`outputs/skill-scaffold-audit.md`채택 전에 제안된 코딩 에이전트 스카프롤드를 감사하는 데 도움이 됩니다. 검색 품질, 검증기 존재, 샌드박스 격리 및 벤치마크-분배 적합성.

## 운동

1. 달아`code/main.py`각 스카팔드가 같은 작업 세트를 수행하는 데 몇 번 돌고 있습니까?

2. OpenHands 논문을 읽어보십시오 (arXiv:2407.16741). 논문은 복잡한 작업에 대한 JSON 도구 호출을 제치고 CodeAct이 주장합니다. 논문이 인정하는 하나의 실패 모드를 식별하고 그 모드가 생산에서 지배할 때 한 문장을 작성하십시오.

3. 버그 백록에서 2개의 파일에서 10+ 라인 이상의 변경이 필요한 작업을 선택하세요. (a) JSON 도구 호출 및 (b) CodeAct 아래 국경 모델의 엔드-투-엔드 성공 확률을 추정하세요. 격차를 정당화하세요.

4. SWE 벤치 검증된에는 161개의 단일 파일, 12 라인 작업이 있습니다. 그것들을 배제하는 점수를 구성하십시오.

5. "SWE 벤치 검증 된 도입" (OpenAI) 을 읽어 보십시오. 모호한 작업을 제거하는 데 사용되는 구체적인 방법론을 설명하고, 관료가 놓칠 한 범주를 명명하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| SWE-bench | "Coding benchmark" | Real GitHub issues with ground-truth patches and test suites |
| SWE-bench Verified | "Cleaned subset" | 500 human-curated tasks, easier-tail present |
| SWE-bench Pro | "Harder subset" | 10+ line changes; frontier sits at 23–59% |
| CodeAct | "Code-as-action" | Agent emits Python; Jupyter-style kernel executes in sandbox |
| JSON tool call | "Function calling" | Each action is a structured JSON payload validated before execution |
| Scaffold | "Agent framework" | Retrieval + planner + executor + verifier loop around the base model |
| ACI (Agent-Computer Interface) | "SWE-agent's format" | Command set designed for LLM ergonomics, not human shells |
| Verifier loop | "Test-and-retry" | Run tests, read output, revise patch; biggest non-model reliability gain |

## 더 많은 읽기

- [Jimenez et al. — SWE-bench](https://www.swebench.com/) 원래 기준표와 방법론.
- [OpenAI — Introducing SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 큐레이션 하위 집합이 어떻게 만들어졌는지
- [Wang et al. — OpenHands: An Open Platform for AI Software Developers](https://arxiv.org/abs/2407.16741) CodeAct 아키텍처 및 이벤트 스트림 디자인.
- [Epoch AI — SWE-bench leaderboard](https://epoch.ai/benchmarks) 라이브 트랙 스코어
- [Anthropic — Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) 긴 지평 코딩 에이전트 신뢰성 프레임
