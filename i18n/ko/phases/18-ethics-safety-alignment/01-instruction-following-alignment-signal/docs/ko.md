# 명령 을 따라 조화 신호 로

> RLHF에 대한 모든 후속 비판은 이 파이프라인을 반대합니다. 최적화 압력이 프록시를 왜곡하는 방법을 연구하기 전에 프록시를 봐야 합니다. 이스트럭트GPT (Ouyang et al., 2022) 는 참조 아키텍처를 정의했습니다. 명령-응답 쌍에 대한 감독된 미세 조정, 쌍별 선호도 순위에 훈련된 보상 모델, 그리고 SFT 정책에 대한 KL 벌금으로 보상 모델에 대한 PPO. 1.3B 인스트럭트GPT는 175B GPT-3에 비해 선호되었다. 이 단일 결과는 2026년 모든 국경 연구소들이 RLHF 모양의 포스트 트레이닝 파이프라인을 계속 발송하는 이유입니다.

**Type:** Learn
**Languages:** Python (stdlib, toy three-stage pipeline)
**Prerequisites:** Phase 10 · 06 (SFT), Phase 10 · 07 (RLHF), Phase 10 · 08 (DPO)
**Time:** ~45 minutes

## 학습 목표

- InstructGPT 파이프 라인의 세 단계와 각각의 손실을 명명하십시오.
- 설명해 보십시오. 왜 1.3B 명령어 조율 모델이 인간 선호도 평가에서 원료 175B GPT-3를 제치고 있는지.
- 3단계 KL 벌금이 어떤 것을 보호하고 있는지 설명하고, 그 제거가 모드 검색 행동에 붕괴되는 이유를 설명하십시오.
- 조화세와 PPO-ptx 완화 Ouyang et al.가 이에 대해 사용된 세금을 설명하십시오.

## 문제

사전 훈련된 언어 모델은 텍스트를 완성합니다. 그들은 질문에 대답하지 않습니다. GPT-3에 "사 목록을 뒤집는 파이썬 함수를 작성하십시오"라고 물어보면 종종 다른 명령어를 받게됩니다. 교육 배포의 대부분은 웹 텍스트로 계속되는 웹 텍스트입니다. 모델은 자신의 일을 수행합니다. 작업은 잘못되었습니다.

이 문제를 해결하기 위해 사용되는 모든 심각한 실험실의 대리점은 인간의 선호입니다. 두 개의 완성도는 평가를자에게 간다. 평가는 더 나은 하나를 선택합니다. 보상 모델은 평가를 배웁니다. RL 루프는 정책을 내보내기 방향으로 전환합니다. 보상 모델 점수는 높습니다. 그것은 3 문장으로 전체 인스트럭트GPT 논문입니다. 나머지 논문은 엔지니어링입니다.

## 개념

### 단계 1: 감독된 미세조정 (SFT)

좋은 의도로 인간에게 작성되는 응답이 있는 프롬프트 응답 쌍을 수집하십시오. Ouyang et al.는 레이블러와 OpenAI API에서 13k 프롬프트를 사용했습니다. 표준 크로스 엔트로피 손실로 이 데이터에 대한 기본 모델을 정렬하십시오.

SFT가 주는 것은: 모델은 이제 질문을 계속하기 보다는 대답합니다.

### 2단계: 보상 모델 (RM)

각 프롬프트에 대해 SFT 모델에서 K 완성도를 샘플링하십시오. 레이블러는 그들을 순위화합니다. 어떤 프롬프트 응답 쌍을 점수를하는 보상 모델을 훈련하십시오.`y_w``y_l`이 부분의 본문은

```math
L_{\text{RM}} = -\log \sigma\big(r(x, y_w) - r(x, y_l)\big)
```

이것은 브래들리-테리 쌍방향 선호 손실입니다. RM는 일반적으로 SFT 모델에서 시작되며 LM 머리가 스칼라 머리로 대체됩니다.

보너스 모델은 작습니다. 175B 인스트럭트GPT에 6B가 충분했습니다. 또한 취약합니다.

### 3단계: KL 페널티 ?? 으로 PPO

목표 를 정의 하십시오:

```math
J(\pi) = \mathbb{E}_{x \sim D,\, y \sim \pi(\cdot \mid x)} \big[ r(x, y) \big] - \beta \, \mathrm{KL}\big(\pi(\cdot \mid x) \,\|\, \pi_{\text{SFT}}(\cdot \mid x)\big)
```

PPO로 극대화해`pi`SFT 정책에서 멀리 떨어져서 이동하는 것. 그 없이는 최적화자는 적대적인 예를 찾습니다. RM보다 높은 점수를 얻는 문자열은 RM가 그들을 보지 않았기 때문에, 실제로 인간이 선호하기 때문에 아닙니다.

KL 계수`beta`RLHF의 가장 중요한 하이퍼파라미터입니다. 너무 낮습니다. 보상 해킹. 너무 높습니다. SFT에 비해 개선이 없습니다.

### 조화 세금

RLHF 이후, 모델은 인간에게 선호되지만 표준 벤치마크 (SQuAD, HellaSwag, DROP) 에 따라 퇴행한다. Ouyang et al. 이 경우 이를 조화 세금이라고 부르며 PPO-ptx로 수정합니다.

```math
J_{\text{ptx}}(\pi) = J(\pi) + \gamma \, \mathbb{E}_{x \sim D_{\text{pretrain}}} \big[ \log \pi(x) \big]
```

PPO-ptx는 표준이 되었습니다. 인류, 딥마인드, 메타 모두 어떤 변형을 사용합니다.

### 그 결과

1.3B 인스트럭트GPT (SFT + RM + PPO-ptx) 는 175B 기반 GPT-3에 비해 약 70%의 경우 레이블업자들이 선호한다. 생산 트래픽에서 숨겨진 테스트 요청에 대한 격차는 넓어진다. 이 숫자를 읽으려면 두 가지 사항이 있습니다.

1. 조렬은 능력과는 다른 축이다. 175B 모델은 더 많은 능력을 가지고 있었고, 1.3B 모델은 더 많은 조선을 가지고 있었고, 레이블링은 조렬된 것을 선호했다.
2. 능력은 기본 모델에 의해 설정됩니다. 당신은 기본 모델을 RLHF가 보지 못한 사실을 알 수 없습니다.

### 왜 이것이 18단계 기준점인지

후속 수업의 모든 비판  보상 해킹 (강좌 2), DPO (강좌 3), 교묘성 (강좌 4), CAI (강좌 5), 잠자리 요원 (강좌 7), 조화 위조 (강좌 9) 이 이 파이프라인의 일부에 반대합니다. 보너스 해킹 공격 단계 2 DPO는 2단계와 3단계로 붕괴됩니다. CAI는 인간 표기기를 대체합니다. 사이코판시 시카이터는 편향 신호입니다 조율 가짜는 정책이 3단계를 완전히 돌아볼 수 있다는 것을 보여줍니다. 이 비판의 어떤 것도 먼저 머릿속에 담아두지 않으면 따라가지 못하죠.

```figure
al-instruct-pipeline
```

## 사용 하 고

`code/main.py`장난감 선호도 데이터에 대한 세 단계의 시뮬레이션을 합니다. 기본 정책은 행동에 대한 편향적인 동전입니다. 단계 1 SFT는 200개의 명령에 따라 레이블링 동작을 모방합니다. 2단계는 500개의 쌍 순위에서 브래들리-테리 보상 모델을 적용합니다. 3단계에서는 SFT 정책에 대한 KL 벌금으로 PPO를 단순화하여 업데이트합니다. 보너스 상승, KL의 격차 증가, 정책의 파동을 볼 수 있습니다. 그리고 KL의 기간을 끄면 보너스 해킹이 50 단계의 업데이트에 나타나게 됩니다.

무엇을 살펴볼 수 있을까요?

- `beta = 0.1`vs `beta = 0.0`- 그래
- $\mathrm{KL}(\pi \Vert \pi_{\text{SFT}})$훈련 단계에 대한
- 최종 행동 분포는 표기자 선호에 비해

## 선박

이 교훈은`outputs/skill-instructgpt-explainer.md`. RLHF 파이프 라인 설명이나 종이에 있는 추석을 보면, 세 단계 중 어느 단계가 수정되고 있는지, 각 단계에서 어떤 손실이 사용되고 있는지, KL 페널티 또는 동등한 규제제가 있는지 확인합니다.

## 운동

1. 달아`code/main.py`- 세트`beta = 0.0`그리고 200개의 PPO 단계 후에 행동 분포를 보고하고, 모드 검색 행동을 한 문장으로 설명한다.

2. 보상 모델을 변경하여 행동 B (시뮬레이션 보상 버그) 에 대해 +0.5 편향을 갖게 됩니다.`beta = 0.1`KL 벌금은 정책이 편견을 이용하는 것을 막는 걸까요?`beta`착취가 눈에 띄는 걸까요?

3. Ouyang et al. (arXiv:2203.02155) 를 읽어 보세요. 그림 1. 1, 5, 20, 100 단계 동안 PPO를 실행하고 SFT 모델에 비해 선호도를 측정함으로써 레이블러- 선호 곡선을 재현하십시오.

4. 논문의 4.3 섹션에서는 1.3B 인스트럭트GPT가 175B GPT-3를 70% 정도 제치고 있다고 보고합니다. 왜 이 비율은 레이블링의 직접적인 명령보다 숨겨진 생산 명령에 더 높을까요?

5. 동일한 선호도 데이터에 대한 PPO 손실을 DPO (단계 10 · 08) 로 대체하십시오. 최종 정책 파동 (KL에서 SFT) 과 최종 보상 비교하십시오. 어떤 방법은 일치된 보상으로 더 파동합니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| SFT | "instruction tuning" | Stage 1: cross-entropy fine-tune on prompt-response pairs |
| Reward model | "the RM" | Scalar regressor over (prompt, response) trained with Bradley-Terry on pairwise labels |
| Bradley-Terry | "pairwise preference loss" | $-\log \sigma(r_w - r_l)$; reduces pairwise ranking to binary classification |
| KL penalty | "the regularizer" | `beta * KL(pi \|\| pi_SFT)` — keeps the RL policy near the SFT anchor |
| PPO-ptx | "PPO with pretraining mix" | Adds a fraction of pre-training log-likelihood to the PPO objective to offset the alignment tax |
| Alignment tax | "the RLHF regression" | Post-RLHF drop on standard benchmarks that RLHF did not target |
| Labeler preference | "the ground truth" | Sample of human rankings; the RM is a statistical proxy for this, not for "human values" |

## 더 많은 읽기

- [Ouyang et al. — Training language models to follow instructions with human feedback (arXiv:2203.02155)](https://arxiv.org/abs/2203.02155) 다음으로 나온 모든 RLHF 파이프라인의 기초인
- [Stiennon et al. — Learning to summarize from human feedback (arXiv:2009.01325)](https://arxiv.org/abs/2009.01325) 요약에 대한 RLHF의 전신
- [Christiano et al. — Deep reinforcement learning from human preferences (arXiv:1706.03741)](https://arxiv.org/abs/1706.03741) 원본 선호도에 기반한 RL 공식
- [Bai et al. — Training a Helpful and Harmless Assistant with RLHF (arXiv:2204.05862)](https://arxiv.org/abs/2204.05862) 인스트럭트GPT 파이프 라인의 인스트로피크 HH 확장
