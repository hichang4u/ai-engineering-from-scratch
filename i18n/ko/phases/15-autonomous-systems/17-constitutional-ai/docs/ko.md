# 헌법적 인공지능과 규칙이 타당합니다

> 2026년 1월 22일, 앤트로피크의 클로드 헌법은 79 페이지이며 CC0입니다. 규칙에 기반한 조율에서 합리적인 조율으로 이동하고 네 단계의 우선 순위를 설정합니다: (1) 안전과 인간의 감독을 지원하는, (2) 윤리, (3) 인류적 지침, (4) 도움이 되는. 행동들은 하드코딩된 금지 (바이오무기 증진, CSAM) 로 나뉘어 운영자와 사용자는 타당하지 못하며, 운영자가 정의한 한계에 따라 조정할 수 있는 소프트코딩 된 기본 설정이다. 2022년 본 (Bai et al.) 은 헌법에 대한 자기 비판과 RLAIF를 통해 무해함을 훈련시켰다. 정직한 경고: 이성 기반의 조정은 예상치 못한 상황에 대한 원칙을 일반화하는 모델에 의존합니다. 애너트로피의 2023년 참여 실험은 공공 원천과 기업 원칙 사이의 ~50%의 차이를 보여주었습니다. 2026년 버전은 그 결과를 포함하지 않았습니다.

**Type:** Learn
**Languages:** Python (stdlib, four-tier priority resolver)
**Prerequisites:** Phase 15 · 06 (Automated alignment research), Phase 15 · 10 (Permission modes)
**Time:** ~60 minutes

## 문제

필드 에 있는 에이전트는 설계자 들 이 본 적 없는 입력 자료 를 볼 수 있다. 규칙 목록 은 그 들 을 다루기 위해 충분히 길다. 규칙 목록 은 계산 압력 아래 빠르게 적용 하기 위해 충분히 짧다. 실용적인 질문 은: 에이전트를 장기적인 사례와 빠른 추론 이 모두 살아남는 원칙 에 어떻게 맞추는가?

규칙 기반 조정은 (RBA): 허용되지 않는 모든 것을 목록으로 나열합니다. 확인하기 쉽고 감사하기 쉽습니다. 최신 상태를 유지하는 것은 불가능하며, 예상하지 못한 가까운 유사종을 과도하게 거부합니다. 이유 기반 조정은 (Cloade 헌법 2026): 원칙을 암호화하십시오. 모델을 합리화하십시오. 보이지 않는 사례를 통해 스케일, 감사하기 어렵습니다. 실패 모드는 원칙의 부당 적용이 규칙을 놓치지 않는 것보다입니다.

2026년 헌법은 명시적으로 중간에 위치하고 있습니다. 하드코드 금지  그 잘못은 맥락에 의존하지 않는 것들 (바이오 무기 승강, CSAM)  RBA: 결코, 운영자 또는 사용자 지침과 상관없이. 다른 모든 것은 네 단계의 계층 hierarchy 내에서 합리적인 기반을 가지고 있습니다. 안전과 인간의 감독을 지원하는 것 우선, 윤리 제2위, 인류가 선언한 지침 제3위, 도움이 마지막. 운영자는 소프트코딩 구역 내에서 기본 설정을 조정할 수 있지만 하드코딩 금지 사항에 영향을 줄 수 없습니다.

## 개념

### 4단계 우선 순위

1. **Safety and supporting human oversight.**가장 높은. 모델은 인간과 인류가 인공지능을 감독하고 수정할 수 있는 능력을 저해하지 않는 것을 우선시한다. 이것은 "주의하라"는 것이 아니라, 구체적으로 "인간 감독을 더 어렵게 만드는 방식으로 행동하지 않는다".
2. **Ethics.**정직, 타인에게 해를 끼치지 않는 것, 속이는 것, 조작하지 않는 것, 갈등이 있을 때 인тропо크의 지침을 넘어서버리는 것.
3. **Anthropic guidelines.**운영 규범 인트로피는 제품 범위, 상호 작용 패턴, 언제 어떤 도구를 사용할 것인지 결정했습니다.
4. **Helpfulness.**가장 낮은 수준, 높은 우선 순위 내에서 가능한 한 유용하게 활용하세요.

레벨 충돌이 발생하면 더 높은 승률이 나타납니다. 이것은 유닉스 우선 순위 또는 네트워크 QoS와 동일한 형태입니다. 프레임링은 예측 가능한 해상도를 생성하기 위해 고안되어 있으며, 단 하나의 축에 대한 최상의 행동이 필요하지 않습니다.

### 하드코드 금지와 소프트코드 기본 설정

**Hardcoded:**
- 바이오무기 / CBRN 증강
- CSAM
- 중요한 인프라에 대한 공격
- 직접적으로 질문된 모델의 신분에 대해 사용자들의 속임수

운영자는 이를 과제할 수 없습니다. 사용자는 이를 과제할 수 없습니다. 가능한 경우 모델 무게 수준 (RLHF / 헌법 AI 훈련) 에서 시행되며, 그렇지 않은 경우 추론 계층에서 시행됩니다.

**Soft-coded defaults (operator-adjustable):**
- 응답 길이가 기본 설정
- 현역 범위 (모델은 사업자의 배포 이외의 주제를 거부할 수 있습니다)
- 스타일 (공식적과 비공식적)
- 도구 사용 패턴

운영자 조정은 선언된 경계 내에서 이루어집니다. 운영자는 하드코딩된 금지 사항을 변경하여 제거할 수 없습니다.

### 2022 CAI 교육

원래의 헌법 AI (Bai et al., 2022) 는 무해성을 훈련시켰습니다.

1. 일련의 명령에 응답을 생성합니다.
2. 모델이 헌법에 반대하는 모든 반응을 비판하도록 요청하십시오 (표시 원칙).
3. 비판에 근거하여 답변을 검토하십시오.
4. 개정된 쌍에 대한 RLAIF (AI 피드백에서 강화 학습)

결과: 원칙적인 설명으로 해로운 요청을 거부하는 모델, 전체적인 거부는 아닙니다. 2026 헌법은 이러한 훈련의 후손을 추가로 추가적으로 추가적으로 추가적으로 훈련하는 단계 계층에 대해 사용합니다.

### 어떤 합리적인 조율이 잡히고 놓칠 수 있는 것

**Catches:**
- 원칙이 명확하게 적용되는 허용된 원시의 예상치 못한 조합
- 금지된 것과 비슷한 소설 요청입니다.
- "X가 금지된다고 말하지 않았어"라는 사회적 공학 공격에 의존합니다.

**Misses:**
- 이 공격은 원칙의 모호함을 이용한다 ("이용자가 이렇게 요청한 것은 도움이 될 수 있는 것"이라고 대답한다).
- 두 가지 원칙이 예상치 못한 방식으로 충돌하고 계층 순서가 모호한 시나리오
- 교육 주기에 대한 원칙적 해석 (재해석)

### 2023년 참여 실험

애너트로피는 2023년 기업에서 작성한 헌법을 공개 입력을 통해 생성된 헌법 (~1,000명의 미국 응답자) 과 비교한 실험을 실시했다. 두 버전은 ~ 50%의 원칙에 동의했습니다. 그들이 분할된 곳에서는 공공 출처 버전은 일부 문제에 대해 (정치적 콘텐츠 처리) 보다 제한적이면서 다른 부분에 대해서는 덜 제한적이었습니다 (AI 정체성의 자발적인 공개). 2026년 헌법은 공공 자료를 통해 얻은 연구결과를 포함하지 않았다. 이 접근 방식은 기록된 긴장입니다.

### 왜 하드코드 금지 가 필요 합니까?

이성 기반의 조정은 그 자체로 꼬리를 닫을 수 없다. 모델이 전제를 받아들일 수 있는 공격자는 (예를 들어 "우리는 라이선스 된 바이오 무기 연구 연구실이다") 종종 사건의 추론에 의존하는 원리를 이야기 할 수 있다. 하드코드 금지제는 전제 프레임에 굴복하지 않는다. 그들은 조립 계층에서 레슨 14 "고른 헌법 한계"입니다.

### 헌법이 에 앉아 있는 곳

헌법은 14강의 살인 스위치가 아닙니다. 모델 계층에서 살고 있습니다. 모델의 무게가 무엇을 선호하도록 훈련받습니다.  시치와 카나리 토큰은  타임 레이어에서 생중계됩니다. 둘 다 필요합니다. 모델 무게가 허용되기 때문에 모든 잘못된 행동을 일으키는 런타임은 런타임 문제입니다. 실행시간이 너무 제한적이기 때문에 모든 올바른 행동을 거부하는 모델은 실행시간 문제입니다. 계층은 다른 클래스를 습니다.

```figure
mx-priority-tiers
```

## 사용 하 고

`code/main.py`최소 4 단계의 우선 순위 해결기를 구현합니다. 해결자는 제안된 행동과 일련의 원칙 평가 (안전, 윤리, 지침, 유용성) 을 수행하고 행동, 거부 또는 수정된 행동을 반환합니다. 드라이버는 작은 케이스 세트를 실행합니다. 명확한 허용, 명확한 거부, 하드코딩 된 금지, 여러 계층 간 모호한 경우.

## 선박

`outputs/skill-constitution-review.md`배포의 헌법적 계층을 감사합니다. 하드코딩된 것이 무엇인지, 소프트코딩된 것이 무엇인지, 운영자가 조정할 수 있는 곳, 그리고 네 계층 계층이 실제로 해상 순서가 있는지.

## 운동

1. 달아`code/main.py`.호호로 코드화된 금지 방출을 확인해 주세요. 도움의도가 높을 때에도요. 해결기 를 수정하여 윤리보다 도움의도가 높을 수 있도록 하십시오. 실패 모드를 관찰하세요.

2. 클로드 헌법 (공중, 79 페이지, CC0) 을 읽어 보십시오. 당신이 미분별하다고 생각하는 원칙을 식별 하십시오. 구체적인 모호함을 설명하고 더 엄격한 표현을 제안하는 두 문장을 작성하세요.

3. 고객 지원 에이전트 를 위한 소프트 코드 기본 설정 을 설계 하십시오. 운영자 는 무엇 을 조정 합니까? 운영자 는 무엇 을 만지지 않을 수 있습니까? 각 한계를 정당화 하십시오.

4. 2022 CAI 논문을 읽어 보세요. 헌법 AI의 비판 및 수정 루프가 전체 규칙보다 더 나쁜 결과를 가져올 경우 한 사례를 설명하세요. 클래스를 식별하세요.

5. 2023년 애너트로피의 참여 실험은 공공과 기업 원칙의 ~50%의 차이를 발견했습니다. 생산 배포에 중요한 한 범주를 선택하십시오. (예를 들어, 정치적 중립성). 하드코드 금지 사항이 그대로 남아있는 동안 사업자가 자신의 가치를 표현할 수 있는 디자인을 제안하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Constitutional AI | "Anthropic's alignment method" | Self-critique + RLAIF against a written constitution |
| Reason-based alignment | "Principles, not rules" | Model reasons over principles to handle unseen cases |
| Hardcoded prohibition | "Never do X" | Rule-based prohibition no operator or user can override |
| Soft-coded default | "Operator-adjustable" | Behaviour within a declared bound, operator controls |
| Four-tier hierarchy | "Priority order" | safety > ethics > guidelines > helpfulness |
| RLAIF | "AI feedback RL" | RL where the reward comes from model-generated critiques |
| Participatory constitution | "Public-sourced principles" | 2023 Anthropic experiment; ~50% divergence from corporate |
| Principle drift | "Interpretation slip" | Slow change in how the model reads a fixed principle text |

## 더 많은 읽기

- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 79 페이지의 CC0 문서.
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback)2022년 오리지널
- [Anthropic — Collective Constitutional AI (2023)](https://www.anthropic.com/research/collective-constitutional-ai-aligning-a-language-model-with-public-input) 참여 실험
- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) 헌법이 RSP 스택에 위치하고 있는 곳.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 장기적 배치에 헌법의 역할
