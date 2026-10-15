# 스타르, V-STAR, 조용한 스타르  자기 가르침 의 논리

> 가능한 가장 작은 자기개선 루프는 논리적인 내용 안에 있습니다. 모델은 사고의 순서를 만들어내고 올바른 답을 찾아내는 것을 유지하며, 그 답을 정밀하게 조정합니다. 그건 스터입니다. V-STaR는 검증기를 추가하므로 추론 시간 선택은 더 좋습니다. 시어트-스타는 모든 요인을 모두 설명합니다. 세 가지 모두 작동합니다. 그 중 어느 것도 마법이 아닙니다. 루프는 올바른 답을 얻기 위해 어떤 단축도 보존합니다.

**Type:** Learn
**Languages:** Python (stdlib, bootstrap-loop simulator)
**Prerequisites:** Phase 13 · 01-03 (Reasoning and CoT), Phase 15 · 01 (long-horizon framing)
**Time:** ~60 minutes

## 문제

예 를 들어, 이성적 인 사고 를 가르치는 가장 쉬운 방법 은 인간 으로서 작성 된 사유 를 수집 하는 것 이다. 그것 은 비싸고 느리고, 인간 으로서 고품질의 사유 를 작성 할 수 있는 것 은 얼마만큼 제한적 이다.

STaR (Self-Teught Reasoner, Zelikman et al., 2022) 는 질문: 모델이 자신의 합리성을 작성하고 알려진 답변에 따라 평가한다면 어떨까요?

1. 논리 추적과 답변을 샘플링하세요.
2. 최종 답이 맞다면 추적해 보세요.
3. 잘 잡힌 흔적들을 잘 정렬해
4. 다시 말해

GSM8K와 CommonsenseQA 모두 새로운 인간 해설 없이 개선되었습니다. 그러나 루프는 내장된 편향을 가지고 있습니다. 올바른 답을 생산한 모든 논리들은 논리 자체가 건전한 것인지 여부에 관계없이 유지됩니다. V-STaR (Hosseini et al., 2024) 는 학습된 검증자와 이것을 수정합니다. Quiet-STaR (Zelikman et al., 2024) 는 아이디어를 내적 합리적인 토큰으로 일반화합니다.

## 개념

### STaR: 작동하는 것을 시작으로

기본 모델에서 시작하여 약간의 약한 추론 능력을 갖는다. 각 훈련 문제에 대해 논리적인 문제와 더한 답을 샘플링하십시오. 만약 답이 라벨에 일치한다면, (문제, 논리적 문제, 답) 을 세 배로 유지하십시오. 유지된 세트에서 모델을 정렬하십시오. 반복하십시오.

한 번만 하면 문제가 되는데, 모델이 문제를 제대로 풀 수 없다면, 루프는 그 문제에서 배울 수 없다.**rationalization**: 모델이 실패하는 문제에 대해, 올바른 답을 암시로 주입하고, 모델이 다시 이를 이끌어가는 논리적인 근거를 만들어내도록 촉구합니다.

본 논문 결과 (Zelikman et al., 2022): GSM8K에서 반복된 STaR 라운드에서 5.8%에서 10.7%로 개선된 GPT-J 기본 모델은  5 퍼센트 절대 점수를 차지했다. CommonsenseQA에서, STaR 훈련된 GPT-J 6B는 72.5%에 달했다. 이는 정교한 GPT-3 175B (~73%) 와 비교된다.

### V-STaR: DPO와 검증자를 훈련시키

STaR는 잘못된 합리성을 버립니다. 호세이니等人 (2024) 는 이것도 데이터라고 관찰했습니다. 각 쌍 (rationale, "이 맞습니까") 는 검증자를 훈련시킬 수 있습니다. 그들은 순위를 만드는 데 올바른 및 잘못된 솔루션 모두에 대한 직접 선호도 최적화를 사용합니다. 추론 시 N 합리성을 샘플링하고 검증자의 최고의 선택을 선택하십시오.

보고된 델타: GSM8K 및 MATH에서 이전 자기개선 기준에 비해 +4~+17 퍼센트 포인트, 대부분의 이득은 추가 생성기 정렬을 위해 아닌 추론 시간 선택을 위해 검증기를 사용하는 것으로서 나온다.

### 시티-스타: 토큰 당 내부 합리화

Zelikman et al. (2024) 는 질문하였다: 모델은 문제와 답 사이에만 있는 것이 아니라 모든 토큰 위치에서 짧은 내부적 합리성을 생성하는 것을 배우면 어떻게 될까요? Quiet-STaR는 모델에 대해 예측된 토큰 전에 숨겨진 "이념"을 발산하도록 훈련시켜, 학습된 무게를 통해 생각의 예측과 기본 선 예측을 혼합합니다.

결과: 미스트랄 7B는 GSM8K에서 5.9%에서 10.9%까지 절대적 제로샷 개선과 작업 특정 미세조절 없이 CommonsenseQA에서 36.3%에서 47.2%까지 향상되었습니다. 모델은 "언제 생각해야 한다"를 배웠습니다.

### 왜 세 사람 모두 안전에 대해 걱정하는 걸까요?

세 가지 방법 모두 최종 답을 기하급수 신호로 사용합니다. 잘못된 추론을 통해 올바른 답을 얻는 논리적 근거는  단축키를 이용하거나 추측하거나 일반화되지 않는 패턴을 사용함으로써 긍정적으로 강화됩니다. 분포 문제에서 단축키가 작동합니다. 분포 문제에서는 침묵으로 깨집니다.

V-STaR의 검증기는 합리적인 순위를 배우는 것으로 완화하지만, 검증기는 동일한 라벨 세트에 훈련되어 있습니다. 정직한 불확실성에 비해 잘 포맷 된 잘못된 추론을 선호하는 것을 배울 수 있습니다. 더 안전한 디자인은 (a) 프로세스 감독 된 보상 모델 (상수 중간 단계를 보상하는 것, 단순히 답변이 아닙니다) 와 (b) 간단한 단축키를 깨는 유지된 OOD 평가와 STaR 스타일의 데이터를 결합하는 것입니다.

### 비교

| Method | Training signal | Inference cost | Data waste | Known failure mode |
|---|---|---|---|---|
| STaR | keep (rationale, answer) if correct | 1x | discards all incorrect rationales | shortcut rationales |
| STaR + rationalization | above + correct-answer hinted retries | 1x | less | rationalized rationales may be implausible |
| V-STaR | STaR + DPO verifier from both classes | Nx (best-of-N) | minimal | verifier can reinforce confident wrongness |
| Quiet-STaR | per-token rationale + mixing weight | 1.5-3x | minimal | still answer-conditioned gradient |

### 이 2026 스택에 자리 잡고 있는

스타는 늙은 거야 하지만 2025~2026년에도 이런 패턴이 곳곳에 나타나고 있습니다. 검증 가능한 수학 문제 (DeepSeek-R1, Kimi-k1.5, o1) 에 대한 RL는 STaR의 응답 조건화된 기하 신호입니다. 프로세스 보너스 모델 (Lightman et al., 2023; OpenAI의 " 단계별로 확인해 보자") 는 프로세스 감독의 대안이다. AlphaEvolve (강좌 3) 는 코드 STaR입니다. 레이블 대신 프로그램 평가자가 있습니다. 다윈 고델 머신 (강좌 4) 은 에이전트 스카프도딩 자체를 위한 STaR입니다.

STaR를 이해하면 이 모든 클릭이 이루어집니다. 그것은 최소한의 실행 가능한 자기 개선 루프입니다.

```figure
reflection-loop
```

## 사용 하 고

`code/main.py`장난감 수학적 작업에서 시뮬레이션된 STaR 루프를 실행합니다.

- 얼마나 정확도가 발사 을 넘어서는지
- 단축키가 어떻게 속삭이는지: 시뮬레이터에는 "무슨한" 논리 클래스가 포함되어 있습니다. 40%의 경우 올바른 답을 얻지만 잘못 일반화합니다. STaR이 그것들을 유지하는지 확인하십시오.
- 검증기 (V-STaR 스타일) 는 추론에 어떻게 도움을 주지만 훈련 중에 도입된 단축키를 완전히 절단할 수 없는가.

## 선박

`outputs/skill-star-loop-reviewer.md`훈련하기 전에 자기 학습 논리 파이프라인을 감사하는 데 도움이 됩니다.

## 운동

1. 시뮬레이터를 실행하세요. 단축차 주파수를 0으로 설정하고 0.4로 설정하세요. 두 번의 실행 중 최종 정확도는 얼마나 차이가 있지만, 둘 다 훈련 분포에서 90% 이상으로 떨어지는 경우에도 불구하고?

2. 시뮬레이터에 걸친 OOD 테스트를 추가하고 다른 배포에서 문제를 그려서 배포 및 OOD 세트 모두에서 부트스트래프 된 모델을 평가하고 격차를 정량화하십시오.

3. 시어트-스타 (arXiv:2403.09629) 문서를 읽어 보십시오. 3부. "생각의 끝"표와 혼합중력 머리 를 각각 3 문장으로 설명 하십시오.

4. STaR의 유지-만약-정확 필터를 프로세스 감독의 대안과 비교하여 각 합리적인 단계를 독립적으로 보상합니다. 라벨링 비용 차이와 유연한 품질 차이점을 식별하십시오.

5. 배포된 모델에서 단축키의 합리성을 잡을 수 있는 한 평가 설계. 그것은 완벽하지 않아도 됩니다.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| STaR | "Self-Taught Reasoner" | Fine-tune on model-generated rationales that land correct answers; repeat |
| Rationalization | "Hinted retry" | Inject the correct answer and re-prompt for a rationale on problems the base model fails |
| V-STaR | "Verifier STaR" | DPO-train a verifier on both correct and incorrect rationales, use it for inference-time selection |
| Quiet-STaR | "Per-token rationales" | Generate hidden thoughts at every token position; mix with baseline prediction |
| Answer-conditioned gradient | "Outcome-based signal" | The training loop rewards final answers, not reasoning steps |
| Process reward model | "Step-level verifier" | Reward model trained on per-step correctness, not outcome — contrasts with STaR |
| Shortcut rationale | "Right answer, wrong reasoning" | A rationale that reaches the label via a non-generalizing pattern; STaR keeps these |

## 더 많은 읽기

- [Zelikman et al. (2022). STaR: Bootstrapping Reasoning With Reasoning](https://arxiv.org/abs/2203.14465) 원본 논문
- [Hosseini et al. (2024). V-STaR: Training Verifiers for Self-Taught Reasoners](https://arxiv.org/abs/2402.06457) 추론 시간 선택을 위해 DPO 검증기를 추가합니다.
- [Zelikman et al. (2024). Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking](https://arxiv.org/abs/2403.09629) 토큰 당 내부 합리화
- [Lightman et al. (2023). Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) 프로세스 보상 모델, 대체 기하급수 신호.
- [DeepSeek-R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) 검증 가능한 과제들에 대한 RL, STaR는 경선 교육까지 확장되었습니다.
