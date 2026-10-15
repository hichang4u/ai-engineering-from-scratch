# 확장 가능한 감독 및 약대에서 강대 한 일반화

> 버너스 등 (OpenAI 슈퍼 라인먼트, "약성에서 강성 일반화", 2023) 는 초월 라인먼트 문제에 대한 대리안을 제안했습니다. 약성 모델에서 생산된 레이블을 사용하여 강한 모델을 미세하게 조정합니다. 강력한 모델이 불완전한 약한 감독에서 올바르게 일반화되면 현재의 인간 규모의 조율 방법은 초인체계까지 확장될 수 있습니다. 확장 가능한 감독과 W2SG는 상호 보완된다. 확장 가능한 감독 (논론, 재발상 보상 모델링, 작업 분해) 은 감독자의 효율적 능력을 증가시켜 감독의 모델과 함께 유지할 수 있습니다. W2SG는 강렬한 모델이 감독자가 제공하는 불완전한 감독에서 올바르게 일반화되는 것을 보장합니다. 토론 도움 W2SG (arXiv:2501.13124, 2025년 1월) 는 이들을 결합한다.

**Type:** Learn
**Languages:** Python (stdlib, W2SG gap simulator)
**Prerequisites:** Phase 18 · 01 (instruction-following), Phase 18 · 10 (AI Control), Phase 09 (RL foundations)
**Time:** ~60 minutes

## 학습 목표

- 확장 가능한 감독과 약한 대 강한 일반화를 정의하고 그들이 어떻게 보완되는지를 설명합니다.
- Burns et al. 2023 실험 설정을 설명하십시오: GPT-2의 라벨을 사용하여 GPT-4를 미세하게 조정하십시오.
- 회복된 성능 격차 (PGR) 측정값과 그 측정값을 설명해 주십시오.
- 세 가지 주요 확장 가능한 감독 메커니즘 (논론, 재발상 보상 모델링, 작업 분해) 과 각 강점의 한 가지를 설명하십시오.

## 문제

18 단계 에 이르기까지 모든 조화 기술 은 감독자 가 모델 의 행동 을 평가 할 수 있다고 가정 한다. 모델 이 초인적 인 경우 감독자 는 약한 연결고리 이다. 초인조화 의 질문 은: 더 약한 감독자 는 더 강한, 더 안정적 으로 조화 된 모델 을 생산 할 수 있습니까?

버너스 등은 이것을 운영된 경험적 설정으로 줄여서: 강한 모델의 능력의 양을 약한 모델의 능력에서 얼마나 살아남는지 측정합니다. 이것은 초대 조율의 해결책이 아닙니다.

## 개념

### W2SG: Burns et al. 설정

- 약한 모델: GPT-2급
- 강력한 모델: GPT-4급
- 목표: 과제에서 강력한 GPT-4 천장

절차:
1. 약한 모델의 예측을 얻으세요
2. 약한 레이블 데이터에 강한 모델을 정렬합니다.
3. 세련된 모델의 정확성을 측정합니다.

기본 기준: 약한 모델의 자신의 정확성, 강한 모델의 금 라벨에 대한 감독한 천장.

격차 측정: 성능 격차 복구 (PGR) = (미화 - 약) / (대장 - 약). 1.0의 PGR는 약한 감독이 격차를 완전히 닫는 것을 의미합니다. 0의 PGR는 약한 감독이 도움이되지 않았다는 것을 의미합니다.

### 버너스 등 실증적 연구결과

NLP, 체스 퍼즐, 보너스 모델링 작업에서 PGR는 지속적으로 긍정적이었다: 강한 모델은 약한 감독자의 실수 이상으로 일반화되었다. 작업에 대한 특정 PGR는 ~20%에서 ~80%까지 다양했다. 강한 모델은 이전에 훈련받은 전자를 채우며 불완전한 레이블에서 의도된 작업을 " 이해"합니다.

제한 Burns et al. 참고:
- 약한 모델은 일치합니다. 진정한 초인형 모델은 인간에게 일치할 수 있지만 훨씬 더 큰 능력 격차가 있습니다.
- 강력한 모델의 일반화는 기초적인 진실의 의도를 회복하는 것보다 더 많은 작업 전과에 관한 것일 수 있습니다.
- 강력한 모델의 잠잠한 지식을 이끌어내는 것이 실제 문제입니다. PGR는 특정 운영성을 측정합니다.

### 확장 가능한 감독: 세 가지 메커니즘

- **Debate (Irving et al. 2018).**U의 두 가지 사례는 반대편의 논쟁을 하고 있다. 약한 판사는 결정한다. 설득력 있는 진실한 답을 찾는 것이 설득력 있는 잘못된 답을 찾는 것보다 더 쉽다는 가정이다. 최근 2024-2025 연구 (칸 등, 마이클 등) 는 토론이 때로는 도움이 되고 때로는 그렇지 않다는 것을 보여줍니다. 그리고 그것이 도움이 되는 것은 작업 구조에 달려 있습니다.
- **Recursive Reward Modeling (Leike et al. 2018).**U 는 U+1 에 대한 보상 모델 을 훈련 시키는데 도움 이 된다. 감독자 의 효과적 능력 은 모델 이 가진 능력 과 함께 증가 한다.
- **Task Decomposition (Christiano, Shlegeris, Amodei 2018).**어려운 작업을 인간들이 반복적으로 검사할 수 있는 부분으로 분해해해 놓습니다. 분해성을 가정합니다.

각각의 메커니즘은 작업의 구조 또는 중간 구성 요소의 조화를 something's 가정합니다.

### 확장 가능한 감독과 W2SG가 상호 보완되는 이유

확장 가능한 감독은 감독자의 효과적인 신호 품질을 높여줍니다.
W2SG는 감독자가 제공할 수 있는 불완전한 신호의 격차를 해소합니다.

 토론이 약한 것에서 강한 것까지 일반화하는데 도움을 줍니다 (arXiv:2501.13124) 는 이 두 가지의 결합을 합니다. 토론 프로토콜은 더 나은 약한 라벨을 제공하며, 강한 모델은 그 라벨에 의해 훈련됩니다.

### 조직적 드라마

오픈아이의 슈퍼 라인먼트 팀은 장 레이크가 인문학으로 떠난 후 2024년 5월에 해체되었다. 안서피크와 학술 연구소에서 (스케랄 가능한 감독, W2SG, 자동화된 조선 연구) 의 의정도는 계속되었다.

### 이 부분은 18단계에 맞게

6~10강은 U가 신뢰할 수 없는 가정 아래의 위협과 방어적 패러다임을 설명합니다. 11강은 공격적 패러다임입니다. 감독자를 U의 조화를 확인하기에 충분히 강하게 만듭니다. 12~16강은 적대적 평가의 실질적인 도구로 전환합니다.

```figure
scalable-oversight
```

## 사용 하 고

`code/main.py`W2SG 미세조정을 합성 작업에 시뮬레이션합니다. 약한 레이블러는 구조적 오류로 70%의 정확성을 가지고 있습니다. 강한 모델은 금 레이블에 95%의 천장을 가지고 있습니다. 약한 레이블에 강한 모델을 미세조하고 PGR를 측정하고 강-금과 약한 것만으로 비교합니다.

## 선박

이 교훈은`outputs/skill-w2sg-pgr.md`. 감독 설정 설명이 주어지면, 약한 감독자, 강한 모델, 감독 품질을 식별하고 PGR를 계산 (또는 요청) 합니다. 그것은 주장이 "약은 강한 감독을 할 수 있다" 또는 "약하고 + 감독 메커니즘이 강한 감독을 할 수 있다"를 표시합니다.

## 운동

1. 달아`code/main.py`. 약점 정확성 = 0.60, 0.70, 0.80에 대한 PGR를 보고하십시오. PGR 곡선의 모양을 설명하십시오.

2. 약한 레이블을 수정하여 구조 오류가 (예를 들어 특정 입력 클래스에서 항상 잘못) 가 되도록 변경하십시오. PGR는 증가하거나 감소하거나 동일하게 유지합니까? 설명하십시오.

3. 2023부 4.3 (NLP 작업) Burns et al.을 읽어보세요. "신뢰 보조 손실" 직관을 재현하세요. 강한 모델이 약한 레이블보다 자신감이 더 강한 경우 누가 승리할까요?

4. 소프트웨어 엔지니어링 작업에 대한 토론과 작업 분해를 결합하는 확장 가능한 감독 프로토콜을 설계하십시오. 각 구성 요소의 하나 이상의 실패 모드를 지정하고 조합이 각각을 해결하거나 해결하지 못하는 방법을 설명하십시오.

5. "약대에서 강대까지의 일반화는 초대적 조율에 대한 실행 가능한 길"이라는 주장을 왜곡할 수 있는 내용을 말해주십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Scalable oversight | "making the overseer stronger" | Mechanisms that increase an overseer's ability to evaluate a more-capable model |
| W2SG | "weak supervises strong" | Fine-tuning a strong model on weak labels and measuring the capability recovered |
| PGR | "performance gap recovered" | (fine-tuned - weak) / (ceiling - weak); 1.0 = fully closed, 0 = no help |
| Debate | "two U instances argue" | Scalable oversight mechanism where a weak judge picks between two U defenders |
| RRM | "recursive reward modeling" | U helps train the reward model for U+1; overseer capability tracks U |
| Task decomposition | "sub-tasks the human checks" | Break a hard task into sub-tasks the human can verify, recursively |
| Superalignment | "aligning superhuman AI" | The research agenda concerned with aligning models the human cannot directly evaluate |

## 더 많은 읽기

- [Burns et al. — Weak-to-Strong Generalization (OpenAI 2023)](https://openai.com/index/weak-to-strong-generalization/) W2SG 종이에
- [Irving, Christiano, Amodei — AI safety via debate (arXiv:1805.00899)](https://arxiv.org/abs/1805.00899) 토론 메커니즘
- [Leike et al. — Scalable agent alignment via reward modeling (arXiv:1811.07871)](https://arxiv.org/abs/1811.07871) 재발상 보상 모델링
- [Khan et al. — Debating with More Persuasive LLMs Leads to More Truthful Answers (arXiv:2402.06782)](https://arxiv.org/abs/2402.06782) 2024 더 강한 토론자들과 토론을 경험적으로 연구
- [Lang et al. — Debate Helps Weak-to-Strong Generalization (arXiv:2501.13124)](https://arxiv.org/abs/2501.13124) 2025 토론 조합 + W2SG
