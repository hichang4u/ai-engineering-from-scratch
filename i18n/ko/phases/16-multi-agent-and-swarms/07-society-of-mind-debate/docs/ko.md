# 정신 사회와 다중 요원 토론

> 미ンス키의 1986년 전제  지능은 전문가들의 사회 가 10년마다 재발견된다. 2023년 Du et al.는 이를 구체적인 알고리즘으로 바꾸어 놓았다. 여러 LLM 사례는 답을 제안하고, 서로의 답변을 읽고, 비판하고 업데이트한다. N 라운드 동안 그들은 0 샷 CoT를 제치고 6 가지 추론과 사실성 작업에 대한 반성을 가진 합의에 모인다. 두 가지 연구 결과는 중요합니다.**multiple agents**그리고**multiple rounds**독립적으로 기여합니다. 사회는 단일 요원 단독을 이길 수 있습니다. 다차적 교환은 단 샷 투표를 이길 수 있습니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## 문제

자기결합성  한 모델을 여러 번 샘플링하고 대다수의 답을 은 당신이 볼 수있는 가장 저렴한 추론 개선입니다. 그것은 작동하지만 그것은 빠르게 포화됩니다. 당신은 당신의 샘플을 두 배로 볼 수 있습니다 의미있는 또 다른 도약을 보지 않습니다.

논쟁은 포화점을 깨고 있습니다. 한 모델에서 N 독립된 샘플 대신, N 에이전트는 서로의 추론을 읽고 수정합니다. 샘플 사이의 상관관계는 떨어집니다 (그들은 더 이상 i.i.d.) 그리고 i.i.d 투표가 확신이있는 잘못된 경우 컨버전스 포인트는 종종 올바릅니다.

## 개념

### 2023년 듀 및 동료 알고리즘

아크시브:2305.14325 (ICML 2024) 에서:

1. N 에이전트들 각각은 질문에 대한 첫 번째 답을 제공합니다.
2. 라운드 r = 2..R: 각 에이전트는 다른 에이전트의 라운드 r-1 답변을 보여 "이것들을 고려하여 업데이트 된 답변을 주세요".
3. R 라운드 후, 최종 답변을 과반수 투표로 결정한다.

MMLU, GSM8K, 생체, MATH, 사실성 기준에 대한 논문 테스트. 논쟁은 CoT와 자기 반사에서 지속적으로 승리합니다.

### 독립된 두 개의 버튼

같은 논문에서 나온 글:

- **Agent count alone**(주) 1회, N의 과반수의 찬성) 대부분의 과제에서 단일 요인을 이길 수 있지만 평야.
- **Round count alone**(개인 1개는 자신의 사전 추론을 보고) 거의 의 알려진 약점을 도와주지 않습니다.
- **Both together**여러 에이전트들 사이의 다차적 교환이 이득을 이끌어냅니다.

### 왜 효과가 있는지

두 가지 메커니즘:

1. **Exposure to disagreement.**어떤 에이전트가 다른 에이전트의 추론 체인을 다른 결론으로 볼 때, 그것은 정당화하거나 업데이트해야합니다. 어느 쪽이든, 라운드 r+1의 맥락은 라운드 r보다 풍부합니다.
2. **Correlated error reduction.**자기 일치성에서 모든 샘플은 같은 모델에서 나온다, 따라서 오류는  평균으로 연결되어 자신있게 잘못된 답변으로 연결됩니다. 다른 모델 또는 다른 씨앗은 디코레레이션됩니다. 다른 * 논쟁의 여지가있는 견해 *는 더 이상 디코레레이션됩니다.

### 이질적인 논쟁

A-HMAD 및 관련 후속은 서로 다른 대기에 대해 * 다른 기본 모델을* 사용합니다. Llama + Claude + GPT 토론은 단일농장의 붕괴를 줄이죠 (강제 26) 왜냐하면 한 모델 가족의 상관 오류가 다른 모델들이 공유하지 않기 때문입니다.

단점: 토론에 참여하는 약한 모델은 합의를 잘못된 답변으로 끌어당길 수 있습니다 (보기를 "우리는 미쳐야 하는가?"

### NLSOM  129-원장

주게 등 ("자연 언어 기반의 정신 사회의 정신 폭풍", arXiv:2305.17066) 은 이 아이디어를 129 명의 사회로 확장했습니다. 결과는: 전문성과 자기 조직이 규모와 함께 등장하고, 시스템은 시각적 질문 답변과 같은 작업에서 단일 요인을 능가합니다.

### 실패 모드

- **Sycophancy cascade.**모든 에이전트는 어느 에이전트가 가장 자신있게 들리는 것인지를 연기한다. 논쟁은 가장 큰 목소리로 붕괴된다. 적대적 역할에 대한 권유 ("한 에이전트는 반대 입장을 주장해야 한다") 는 도움이 된다.
- **Topic drift.**여러 차례의 토론은 원래 질문에서 유도됩니다. 완화: 모든 라운드에 질문을 다시 주입합니다.
- **Compute blowup.**N 에이전트 × R 라운드 = N·R LLM 호출, 각 경우 커지는 맥락을 가지고 있습니다. 5 에이전트, 5 라운드 토론은 커지는 맥락에서 25 번의 호출입니다. 질문 당 비용은 10x 한 번의 CoT 호출을 초과 할 수 있습니다.

```figure
multi-agent-debate
```

## 건설 해

`code/main.py`3 에이전트 × 3 라운드 토론을 진행하여 각 에이전트가 다른 (일수도 잘못된) 답변으로 시작하는 수학 질문에 대해 진행합니다. 에이전트는 각 " 업데이트"에 대해 스크립트 신뢰에 의해 중화 된 이웃의 답변을 평균하여 스크립트 해답을 작성합니다. 회전 로그에서 konvergence가 눈에 띄습니다.

데모는 두 가지 주요 효과를 보여줍니다.

- 한 번의 교환은 에이전트를 올바른 답에 더 가까이 데려다줍니다.
- 2라운드 이후 추가 라운드에서는 수익률이 감소하는 것을 나타냅니다 (두 등과 같은 평판과 일치합니다).

실행:

```
python3 code/main.py
```

## 사용 하 고

`outputs/skill-debate-configurator.md`새로운 작업에 대한 토론을 구성합니다. 에이전트 수, 라운드 수, 이질성 ( 같은 모델과 혼합), 역할 할당 (대립적과 대립적). 또한 실행 전에 토큰 비용을 추정합니다.

## 선박

만약 당신이 토론을 해주는 경우:

- **Cap rounds at 3.**두와 동료들은 3차전으로 수익을 차지하는 것을 보여주었습니다. 더 많은 것은 품질이 아니라 비용입니다.
- **Cap agents at 5.**5보다 더 많은 경우, 컨텍스트 부풀림과 비용의 지배가 있습니다.
- **Heterogeneous by default.**적어도 2개의 다른 기본 모델이 수영장에서 있습니다.
- **Adversarial slot.**한 대리인이 반대했지
- **Log every round.**중간 라운드들을 숨기는 토론 시스템은 디버깅이나 감사가 불가능합니다.

## 운동

1. 달아`code/main.py`, 그리고 5으로 라운드를 세우고 감소하는 수익을 관찰합니다. 추가적인 회전이 어느 라운드에서 멈춘다?
2. 네 번째 대리인을 추가하여 적대적 역할을 한다. 항상 현재의 과반수와 동의하지 않는다.
3. 라운드당 합의 점수를 (대부분의 답변에 대한 에이전트 분량) 그려내십시오.
4. 이 코드에서 "원만"과 "순환만"의 결과와 "두 가지"의 결과를 복제합니다.
5. "우리는 미쳤을 것인가?" (arXiv:2311.17371) 를 읽고, 론드-로빈 () 를 넘어 두 가지 토론 변형을 나열하십시오. 예를 들어, 판사가 주도하고, 논쟁의 체인, 적대적.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Society of Mind | "Minsky's idea" | Intelligence as interacting specialists; 1986 framing now operationalized via LLM debate. |
| Multi-agent debate | "Agents argue" | N agents propose, critique each other, revise over R rounds, majority-vote. |
| Consensus | "They agree" | Not epistemic truth — just fraction-on-majority-answer. Can be confidently wrong. |
| Rounds | "Exchange steps" | One round = each agent reads the others and updates once. |
| Heterogeneous debate | "Mix model families" | Using different base models to decorrelate errors. |
| Sycophancy cascade | "Everyone agrees with the loud one" | Debate failure where agents defer to the most confident agent regardless of correctness. |
| NLSOM | "129-agent society" | Natural-language society of mind; Zhuge et al.'s scaled version. |
| Correlated error | "Same model, same bug" | Why self-consistency saturates; debate across different views decorrelates. |

## 더 많은 읽기

- [Du et al. — Improving Factuality and Reasoning in Language Models through Multiagent Debate](https://arxiv.org/abs/2305.14325) 참고문헌 ICML 2024
- [Zhuge et al. — Mindstorms in Natural Language-Based Societies of Mind](https://arxiv.org/abs/2305.17066) 129-원 NLSOM
- [Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs](https://arxiv.org/abs/2311.17371) 기준 토론 변수
- [Debate project page](https://composable-models.github.io/llm_debate/) Du et al.의 코드, 데모 및 압축 세부 사항
