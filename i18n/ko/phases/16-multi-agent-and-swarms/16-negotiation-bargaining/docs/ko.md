# 협상 및 협상

> 에이전트는 자원, 가격, 작업 할당 및 조건에 협상한다. 2026 벤치마크 세트는 명확하다: 협상 아레나 (arXiv:2402.05863) 는 LLM가 인격 조작 ("절망"을 통해 20%까지 수익을 향상시킬 수 있음을 보여줍니다. "협상 능력 측정" (arXiv:2402.15813) 는 구매자가 판매자보다 어렵고 규모는 도움이 되지 않습니다.**OG-Narrator**(결정적 제안 생성자 + LLM narrator) 거래율은 26.67%에서 88.88%로 밀어붙였습니다. 대규모 자율 협상 경쟁 (arXiv:2503.06416) 은 약 180,000 협상을 진행했으며**chain-of-thought-concealing**대리인은 상대방으로부터 사유를 숨기고 승리한다. 바타차리아 등은 2025년 하버드 협상 프로젝트 매트릭스에 Llama-3를 가장 효과적, 클로드-3을 공격적, GPT-4를 가장 공정하게 순위했다. 이 수업은 계약 네트워크 프로토콜을 구현한다 (FIPA의 조상, 수업 02), LLM 스타일의 구매자/판매자를 전线, OG-Narrator 스타일의 분해를 실행하고, 각 구조적 선택과 함께 거래율이 어떻게 변화하는지 측정합니다.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 02 (FIPA-ACL Heritage), Phase 16 · 09 (Parallel Swarm Networks)
**Time:** ~75 minutes

## 문제

두 대리인은 가격에 합의해야 한다. 순수한 언어의 구동으로 스스로 남겨진 2024-2026 LLM는 놀랍도록 낮은 비율로 거래를 종료한다 (arXiv:2402.15813에서 엄격하게 매개된 거래에 ~ 27%). 규모는 그것을 수정하지 않습니다: GPT-4는 구조적으로 GPT-3.5보다 협상하는 데 더 낫지 않습니다.

근본적인 문제는 LLM가 두 개의 직업을  제안에 결정하고 제안에 서술하는 것을 혼합한다는 것입니다. OG-Narrator는 이것을 분리했습니다. 결정적인 제안 생성기는 수치 움직임을 계산합니다. LLM는 단지 서술합니다. 거래 비율은 ~89%로 뛰어납니다.

이것은 고전적인 다중 에이전트 발견을 반영합니다. 통신 계층에서 메커니즘을 분리하는 것이 승리합니다. 계약 네트워크 프로토콜 (FIPA, 1996; 스미스, 1980) 은 참조 작업 시장 메커니즘입니다. 서술 슬롯에 LLM를 연결하면 현대 LLM 기반 작업 시장을 얻을 수 있습니다.

## 개념

### 계약망, 한 문항

스미스의 1980 계약 네트워크 프로토콜: a **manager**방송 **call for proposals (cfp)****bidders****propose**그들의 제안을 포함하는 메시지; 관리자는 우승자를 선택하고 보내 **accept-proposal**우승자에게**reject-proposal**승자는 업무를 수행합니다. 선택적 메시지:**refuse**(상품주 는 제안 을 거부 한다) FIPA 는 이 법 을`fipa-contract-net`상호작용 프로토콜

### 왜 오그-내레이터가 승리했지

"언어 모델의 협상 능력을 측정하는 것" (arXiv:2402.15813) 은 다음과 같이 지적하였다.

- LLM는 종종 협상 규칙을 위반합니다 (무정상한 가격에 제안, 상대방의 ZOPA를 무시합니다).
- 그들은 잘 안겨지지 않습니다 (최초의 나쁜 제안을 받아들이고, 전략적 금액보다는 상징적인 금액으로 반 제안을 한다).
- 규모만으로는 이러한 문제를 해결할 수 없습니다. 더 큰 모델은 비슷한 전략적 오류로 더 유연한 언어를 만듭니다.

OG-Narrator 분해:

```
           ┌──────────────────┐        ┌──────────────────┐
  state  → │ offer generator  │ price → │  LLM narrator    │ → message
           │  (deterministic) │        │  (writes the     │
           │                  │        │   human-style    │
           └──────────────────┘        │   accompaniment) │
                                       └──────────────────┘
```

제안 생성자는 고전적인 협상 전략입니다. 루빈슈타인 협상 모델, 제우텐 전략 또는 가격에 대한 간단한 틱-트랙. LLM는 이야기합니다. 메시지는 결정적 가격과 자연어 프레임링을 포함합니다.

거래율이 급등하는 이유는
- 가격은 협상 구역에 머물러 있습니다.
- 항은은 전략적이고 감정적인 것이 아닙니다.
- LLM는 잘하는 일을 합니다. 글쓰기입니다.

### 협상

arXiv:2402.05863은 가톨릭 기준을 제시합니다.

- LLM는 인물을 채택함으로써 수익을 20% 향상시킬 수 있습니다 ("나는 금요일까지 이것을 팔려고 절실히 노력하고 있습니다")
- 공정한/협력적인 요원들은 적대적인 요인에 의해 이용된다. 방어는 명시적인 반발을 요구한다.
- 대칭적 쌍집은 기준 시나리오의 약 40%에서 불균형적인 결과로 회합한다.

이것은 "LLM는 나쁜 협상자"가 아닙니다. 그것은 "LLM는 착취 가능한 부분을 포함하여 인간처럼 협상합니다".

### 사상의 연쇄의 감추는 것

대규모 자율주행 협상 경쟁 (arXiv:2503.06416) 은 많은 LLM 전략에서 약 180,000 협상을 진행했습니다. 수상자들은 상대방으로부터 자신의 추론을 숨겼다:

- 만약 에이전트가 "나는 그냥 갈거야"라고$75; my reservation price is $70"에 있는 스크래치패드에서 적은 그것을 읽는다.
- 승자는 전략을 개인적으로 계산하고 출력 채널은 제안과 최소한의 필요한 서술만을 포함합니다.

이것은 2026년 고전적인 게임 이론의 반향입니다. (Aumann 1976년 합리성과 정보에 관한) 은 개인 평가 비용의 보상과 관련된 내용을 공개합니다. LLM는 이것을 직관적으로 인식하지 못하고 반대의 사람들에게 눈에 띄는 추론적 흔적을 통해 그들의 예약을 입력합니다.

엔지니어링 벡웨이: 개인 스크래치패드 컨텍스트와 공개 메시지 컨텍스트를 분리합니다. 선택 사항이 아닙니다.

### 바타차리아 등 2025  모델 순위

하버드 협상 프로젝트의 기준 (원칙 협상, BATNA 존중, 이익 상호성):

- **Llama-3**거래율 + 지불금 (deal rate + payoff) 을 가장 효과적이었다.
- **Claude-3**가장 공격적인 협상자 (고등한 수고, 늦은 양보)
- **GPT-4**가장 공정한 (쌍화를 통해 가장 작은 보상 차이)

이 사진은 2025년 스냅샷입니다. 문제는 2026년 4월에 어떤 모델이 승리할 것인가가 아닙니다. 다른 기본 모델들은 지속적인 협상 스타일을 가지고 있습니다. 이질적인 집합 (강좌 15) 은 다양성의 원천으로 이것을 포함합니다.

### 계약 Net + LLM를 통해 업무 분배

현대적으로 LLM 멀티 에이전트에서 계약 네트워크의 재사용:

1. 관리자 에이전트는 작업을 단위로 분해합니다.
2. 방송 `cfp`노동자 대리인에게 임무 설명과 함께
3. 각 노동자는 제안서를 반환합니다.`(price, eta, confidence)`가격은 토큰이나 컴퓨터 단위, 또는 달러일 수 있습니다.
4. 관리자는 수상자를 선택합니다 (일개 또는 여러 개의 작업에 따라) 및 상을 선택합니다.
5. 거절당한 노동자들은 다른 업무에 대한 공모를 자유롭게 할 수 있습니다.

이 규모는 100명의 직원을 훨씬 넘어서는데, 이는 조정이 시크로노 채팅이 아닌 방송과 응답이 되기 때문입니다. 제작에 사용된다. 마이크로소프트 에이전트 프레임워크의 오케스트레이션 패턴, 일부 랭그라프 구현.

### LLM 이해관계자 상호 협상

뉴리프스 2024 (https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) 는 **secret scores**그리고**minimum-acceptance thresholds**. 각 이해관계자 가 민간 공용사 를 가지고 있으며, LLM 는 그 들 을 메시지 로부터 추론 해야 한다. 이것은 N-당 연합 결성 에 대한 양당 협상 의 일반화 이다. 이질적인 노동자 능력 을 가진 생산 과제 시장 에 관련 된.

### 내레이션과 메커니즘 규칙

2024~2026 협상 기준 모두에서 일관된 엔지니어링 규칙은 다음과 같습니다.

> LLM가 설명하도록 해 주세요.

제안이 숫자가 될 필요가 있다면 (가격, ETA, 양) 협상 상태에서 결정적으로 생성하고 LLM가 프레임을 생성하도록하십시오. 제안이 제안 구조가 될 필요가 있다면 (사업 분해, 역할 할당) LLM가 작성하도록 허용하지만 전송 전에 스케마와 제약 검증을 통해 검증하십시오.

```figure
a5-og-narrator
```

## 건설 해

`code/main.py`이 도구는

- `ContractNetManager``ContractNetTask``Bid` 관리자 + 입찰자, 방송 Cfp, 제안 수집, 시상식
- `og_narrator_bargain(state, rng)` OG-Narrator 구매자: 중점으로 결정적인 Zeuthen 스타일의 양보.
- `seller_response(state, rng)` 결정적인 판매자 대상 제안 정책 (두 스타일의 구조적 기본 진실).
- `naive_llm_bargain(state, rng)` 모든 LLM 협상자를 시뮬레이션합니다. 높은 변동으로 가격을 선택합니다.
- 측정: 1000개의 시험에 대한 거래율, 시험에 대한 샘플링한 신선한 예약 가격

실행:

```
python3 code/main.py
```

예상 출력: 순진-LLM 거래율 ~65-75%; OG-Narrator 거래율 ~85-95%; 15-25 점 격차는 서술에서 제안-세대를 분해하는 구조적 장점입니다.

## 사용 하 고

`outputs/skill-bargainer-designer.md`협상 프로토콜을 설계: 누가 제안서를 생성하는지 (결정적 또는 LLM), 누가 이야기를 하는지, 개인 스크래치패드가 공공 메시지에서 어떻게 분리되는지, 그리고 거래율이 어떻게 모니터링되는지.

## 선박

생산 협상 체크리스트:

- **Separate scratchpad.**개인 국가는 상대방의 맥락에 도달하지 못합니다. 이것은 협상할 수 없습니다.
- **Deterministic offer generation.**가격, 양, ETA: 계산, 요청하지 마십시오.
- **Validate all incoming offers**프로토콜 경계에서 ZOPA를 제외한 제안을 거부합니다.
- **Bound rounds.**최대 3~5회, 막상 중개로 격상한다.
- **Measure deal rate and payoff variance**거래율이 떨어지는 것은 증상입니다. 종종 급격한 추락이나 상대방의 공격입니다.
- **Log all rejected proposals**계약망 관리자에게는, 패배하는 입찰자는 그 이유를 이해해야 합니다.

## 운동

1. 달아`code/main.py`오그 내레이터가 영리대보다 더 나은 거래율을 얻었는지 확인해
2. 시행**persona-based payoff improvement**구매자는 "이주 구매할 수 없을 것"이라는 인격을 내레이션에서만 채택하고, 변함없는 생성기를 제공합니다. 거래율이나 지불금은 변경되는가?
3. 사고 체인을 구현**concealment**: 사설 스크래치패드 문자열을 유지하여 상대방에게 전달되지 않습니다. 만약 실수로 유출되면 어떻게 될까요?
4. 계약 당액은 N-상품인 경매에 예비값을 추가합니다. 모든 입찰이 예비값을 초과하면 관리자가 가장 낮은 가격과 최고 품질을 어떻게 결정합니까? 어떤 상금 규칙을 선택합니까? 왜?
5. 바타차리아 등 2025년 하버드 협상 프로젝트 메트릭스에 대해 읽어보십시오. 서로 다른 스타일 ( 공격적 vs 공정) 을 가진 두 개의 협상자를 구현하십시오. 대칭 및 비대칭 조화를 통해 지불의 차이를 측정하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Contract Net | "Task market" | Smith 1980, FIPA 1996. cfp + propose + accept/reject. The canonical task-market. |
| ZOPA | "Zone of possible agreement" | Overlap between buyer's max and seller's min. Offers outside it cannot close. |
| BATNA | "Best alternative to a negotiated agreement" | Your fallback if this deal fails. Sets your reservation price. |
| OG-Narrator | "Offer generator + narrator" | Decomposition: deterministic offer, LLM narration. |
| Zeuthen strategy | "Risk-minimizing concession" | Classical offer-generator that concedes based on risk limits. |
| Rubinstein bargaining | "Alternating-offer equilibrium" | Game-theoretic model for infinite-horizon bargaining with discounting. |
| CoT concealment | "Hide your reasoning" | Winners in arXiv:2503.06416 kept private scratchpads; public channel shows offer only. |
| Persona manipulation | "Emotional posturing" | arXiv:2402.05863: ~20% payoff gain from desperation/urgency personas. |

## 더 많은 읽기

- [NegotiationArena](https://arxiv.org/abs/2402.05863) 기준표; 인격 조작 및 착취 연구결과
- [Measuring Bargaining Abilities of Language Models](https://arxiv.org/abs/2402.15813) OG-Narrator와 구매자보다 더 힘든 결과
- [Large-Scale Autonomous Negotiation Competition](https://arxiv.org/abs/2503.06416) ~ 180k 협상; 사상 연쇄 감추는 승리
- [LLM-Stakeholders Interactive Negotiation (NeurIPS 2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf)비밀 공용품으로 멀티 파티 점수를 받을 수 있는 게임
- [Smith 1980 — The Contract Net Protocol](https://ieeexplore.ieee.org/document/1675516) 고전적 메커니즘, 컴퓨터에 대한 IEEE 거래
