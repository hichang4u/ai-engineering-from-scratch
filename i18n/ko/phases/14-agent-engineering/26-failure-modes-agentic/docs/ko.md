# 실패 모드: 왜 에이전트들이 파업 하는가

> MASFT (버클리, 2025) 는 3가지로 14개의 멀티 에이전트 실패 모드를 카탈로그화한다. 마이크로소프트의 분류학은 기존 인공지능 실패가 에이전트 설정에서 어떻게 증폭되는지를 기록한다. 산업 현장 데이터는 환각된 동작, 범위 경색, 캐스케이드 오류, 맥락 손실, 도구 남용 등 5가지 반복적인 모드에 konverges.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 05 (Self-Refine and CRITIC), Phase 14 · 24 (Observability)
**Time:** ~60 minutes

## 학습 목표

- MASFT의 세 가지 실패 범주와 각각의 적어도 네 가지 특정 모드를 지정하십시오.
- 왜 요원적 실패가 기존 인공지능 실패 모드를 증폭시키는지를 설명하십시오 ( 편견, 환각).
- 산업에서 반복되는 다섯 가지 방법과 그 완화 방법을 설명해 주십시오.
- 기 모드 레이블로 태그 에이전트를 추적하는 stdlib 탐지기를 구현하십시오.

## 문제

팀들은 90%의 흔적을 처리하는 에이전트를 배포합니다. 10%의 오류는 무작위적인 소음이 아닙니다. 그들은 소수의 반복적인 범주로 분류됩니다. 일단 이름을 지정하면 그들을 모니터링하고 수정할 수 있습니다.

## 개념

### MASFT (버클리, arXiv:2503.13657)

다중 에이전트 시스템 실패 분류학. 14 가지 실패 모드는 3 가지로 나뉘어 있습니다. 코헨의 인터-노터터 카파 0.88  카테고리들은 신뢰할 수 있습니다.

핵심 주장: 실패는 다중 에이전트 시스템에서 기본 설계 결함이며, 더 나은 기본 모델로 해결해야 할 LLM 제한이 아닙니다.

### 에이전틱 AI 시스템에서 실패 모드의 마이크로소프트 분류학

- 기존 인공지능 실패 ( 편견, 환각, 데이터 누출) 는 에이전시 설정에서 증폭됩니다.
- 자율성에서 새로운 실패가 나타납니다. 대규모의 의도하지 않은 행동, 도구의 부적절한 사용, 임무 파동.
- 백과서는 에이전틱 제품에 대한 위험 레지스터입니다.

### 에이전틱 AI의 오류를 특징으로 하는 것 (arXiv:2603.06847)

- 실패는 오케스트라, 내부 상태의 진화, 환경 상호작용으로 인해 발생합니다.
- "나쁜 코드" 또는 "나쁜 모델 출력"뿐만 아니라

### LLM 에이전트 환각 조사 (arXiv:2509.18970)

두 가지 주요 현상:

1. **Instruction-following Deviation** 에이전트는 시스템 명령에 따르지 않습니다.
2. **Long-range Contextual Misuse** 에이전트는 이전 회전에서 상황을 잊어버리거나 잘못 적용합니다.

미적의 오류: 방치 (실종 단계), 과잉 (복회 단계), 혼란 (질서 없는 단계).

### 5가지 산업적으로 반복되는 방식

아리즈, 갈릴레오, 닌블브레인 2024-2026 현장 분석은 다음과 같은 분야에 공감한다.

1. **Hallucinated actions.**에이전트가 존재하지 않는 도구를 불러내거나 주장을 만들어내죠.
2. **Scope creep.**에이전트는 사용자의 요청 이상의 작업을 확장합니다 (더 많은 PR를 만들고, 더 많은 이메일을 보내줍니다).
3. **Cascading errors.**한 번의 잘못된 호출은 하스트스트림 효과를 유발합니다. 유령 SKU 환각은 4개의 API 호출을 유발합니다.
4. **Context loss.**긴 장면을 취하는 작업들은 일찍 전환하는 제약들을 잊습니다.
5. **Tool misuse.**잘못된 주장을 가진 올바른 도구를 호출하거나 완전히 잘못된 도구를 호출합니다.

캐스케딩은 살인자입니다. 에이전트는 "나는 실패했다"와 "사업은 불가능하다"를 구별할 수 없으며 종종 400개의 오류에 대한 성공 메시지를 환각시켜서 루프를 닫습니다.

### 완화: 모든 단계에 게이트

논리 체인의 모든 단계에 자동화된 검증 게이트, 환경 상태에 대한 사실적 근거를 확인합니다. 구체적으로:

- 단계별 안전 분류 (학습 21)
- 도구 호출 논증 검증 (강좌 06).
- 알려진 사실에 대한 검색된 내용을 반검 (강좌 05, 비판).
- 재검토 상태 (파일 실제로 생성되었습니까?) 를 통해 성공 환각을 감지합니다.

### 실패 모니터링이 잘못되는 곳

- **Tagging only crashes.**대부분의 에이전트 실패는 유효한 출력을 만들어내야 합니다.
- **No baseline.**유동 탐지에는 마지막 알려진 것이 필요합니다. 그 없이는 "이것이 점점 더 악화되고 있습니다".라고 말할 수 없습니다.
- **Over-alerting.**모든 실패는 페이지, 클러스터, 속도 제한을 만들어냅니다.

```figure
failure-cascade
```

## 건설 해

`code/main.py`stdlib 실패 모드 태그를 구현합니다:

- 5가지 모드를 포함하는 합성 추적 데이터 세트
- 모드별 탐지기 기능 (툴 호출, 출력, 반복 동작의 서명 패턴)
- 각각의 흔적을 표시하고 모드 배포를 보고하는 태거

실행하세요:

```
python3 code/main.py
```

출력: 추적 표지 + 합계 배포, 피닉스의 추적 집합 표면의 값싼 재생

## 사용 하 고

- **Phoenix**생산 유동 집합 (강좌 24)
- **Langfuse**세션 재연기 + 해설
- **Custom**도메인 특정 서명에 대한 관찰성 플랫폼이 감지할 수 없습니다.

## 선박

`outputs/skill-failure-detector.md`여러분의 도메인에 맞게 제작된 장애 모드 탐지기를 생성하고, 추적 저장소에 연결합니다.

## 운동

1. "성공한 환각"을 위한 탐지기를 추가합니다. 에이전트는 성공을 반환하지만 목표 상태는 변하지 않습니다.
2. 당신이 만든 제품에서 100개의 실제 흔적을 표시하세요. 어떤 모드가 지배하고 있나요?
3. "캐스케이드 반경" 메트릭을 구현: 단계 N에서 실패를 감안하면, 몇 단계 하류에 영향을 미쳤습니까?
4. MASFT의 14가지 오류 모드를 읽어 보세요. 제품에 적용되는 3가지를 선택하세요. 탐지기를 적어 주세요.
5. CI 작업에 하나의 탐지기를 연결: 모드를 태그하는 흔적의 >=5%가 발생하면 빌드 실패.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MASFT | "Multi-agent failure taxonomy" | Berkeley 14-mode categorization |
| Cascading error | "Ripple failure" | One early mistake propagates through N steps |
| Context loss | "Forgot the constraint" | Long-horizon turn drops early-turn facts |
| Tool misuse | "Wrong tool / wrong args" | Valid call, wrong invocation |
| Success hallucination | "Faked completion" | Agent claims success on a 400; state unchanged |
| Scope creep | "Overreach" | Agent does more than asked |
| Instruction-following deviation | "Disobedience" | Ignores system prompt or user constraint |
| Sub-intention errors | "Plan bugs" | Omission, redundancy, disorder in plan execution |

## 더 많은 읽기

- [Cemri et al., MASFT (arXiv:2503.13657)](https://arxiv.org/abs/2503.13657) 14개의 실패 모드, 3개의 카테고리
- [Microsoft, Taxonomy of Failure Mode in Agentic AI Systems](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/final/en-us/microsoft-brand/documents/Taxonomy-of-Failure-Mode-in-Agentic-AI-Systems-Whitepaper.pdf) 위험 레지스터
- [Arize Phoenix](https://docs.arize.com/phoenix) 실무에서 파동 집합
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 더 간단한 패턴이 모드를 완전히 피하는 경우
