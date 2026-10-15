# 에이전트 경제, 토큰 인센티브, 명예

> 장기적인 자율적인 에이전트 (METR의 1시간에서 8시간 작업 곡선) 은 경제적인 에이전트가 필요합니다.**5-layer stack**이 함수는: **DePIN**(물리적인 계산) → **Identity**(W3C DID + 명예 자본) → **Cognition**(RAG + MCP) → **Settlement**(회계 추석) → **Governance**생산원 인센티브 네트워크는**Bittensor**(TAO 하위 네트워크는 작업에 대한 특정 모델을 보상합니다)**Fetch.ai / ASI Alliance**(ASI-1 미니 LLM + FET 토큰)**Gonka**(변화기 기반 PoW, 생산적인 AI 작업에 컴퓨팅을 재배포하는) 학술적 작업: AAMAS 2025의 분산 된 LaMAS 사용 **Shapley-value credit attribution**공헌하는 에이전트를 공평하게 보상하기 위해 구글 리서치 (Google Research) 는 "큰 언어 모델에 대한 메커니즘 설계"을 제안합니다.**token auctions**이 수업은 최소 에이전트 시장을 구축하고, 다중 에이전트 파이프라인에 샤플리 가치 신용 배정을 적용하고, 게임 이론 기계가 구체적으로 착륙하기 위해 2 대 대 대장 토큰을 실행합니다.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 16 (Negotiation and Bargaining), Phase 16 · 09 (Parallel Swarm Networks)
**Time:** ~75 minutes

## 문제

다중 에이전트 시스템은 에이전트가 공동으로 가치를 생산하면서 복잡해집니다. 하지만 개별적으로 보상을 받아야 합니다. 클래식 메커니즘은  동등한 분할, 마지막 기여자-모든 것을  불공정 또는 게임 가능한 것입니다. 샤플리 가치들을 통해 연합에 기반한 보상은 건설적으로 공정하지만 계산에 비용이 많이 든다. 2025~2026 문학은 유용한 추대조사를 추진합니다. 샤플리 샘플링, 단조로운 집합 경매, 확인된 기여로 얻은 체인 명예.

신용 배정 이외에도, 현장은 실제 경제 요원들로 돌아왔다. Bittensor TAO는 하위 네트워크 특정 모델을 정비하기 위해 광산 컴퓨팅을 보상하고, Fetch.ai/ASI는 FET 토큰으로 ASI-1 미니 LLM 사용을 보상하고, Gonka는 생산적인 AI 작업에 대한 트랜스퍼머 증명 작업을 재배포하고 있습니다. 자율적으로 거래하는 요인은 오늘날 존재합니다. 문제는 인센티브를 어떻게 조정하는지에 관한 것입니다.

이 수업은 에이전트 경제를 특정 문제 가족으로 다루고 있습니다. 신용 배정, 메커니즘 설계 및 명성을 그리고 각각의 아이디어가 붙어있는 최소한의 수학을 통해 구성됩니다.

## 개념

### 5층 에이전트-경제 스택

1. **DePIN (physical compute).**분산된 인프라가 GPU, 저장장치, 대역폭을 빌려주는 Bittensor 하위 네트워크, Render 네트워크, Akash. 에이전트 특이 아닌 에이전트들이 사용합니다.
2. **Identity.**W3C 분산 식별자 (DID) 는 각 에이전트에 어떤 플랫폼과 독립적으로 내구성 있는 ID를 제공합니다. 명성은 DID에 쌓인다. 에이전트 네트워크 프로토콜 (ANP) 은 DID를 발견 계층으로 사용합니다.
3. **Cognition.**에이전트의 논리 루프: LLM + RAG + MCP. 다른 단계들이 만들어내는 것입니다.
4. **Settlement.**계좌 추출 (ERC-4337) 은 에이전트가 ETH를 보유하지 않고 자신의 잔액에서 가스를 지불 할 수 있습니다. 에이전트는 서비스, 서로 또는 계산에 대해 지불 할 수 있습니다.
5. **Governance.**에이전틱 DAO: 인간과 에이전트가 프로토콜 변경에 투표하는 통치 구조, 투표 권한은 명성에 연결되어 있습니다.

모든 생산 시스템은 모두 5가지를 사용하지 않습니다. 비트센서는 1, 2, 부분적으로 3, 부분적으로 4, 5개 중 하나도 사용하지 않습니다. 오픈AI 에이전트는 3개를 제외하고는 사용하지 않습니다. 스택은 참조 지도입니다. 요구 사항이 아닙니다.

### 빗센서, 핏치.아이, 곤카 

**Bittensor (TAO).**하위 네트워크는 전문적인 작업 (언어 모델링, 이미지 생성, 예측) 이다. 광산업자들은 모델 출력을 제출한다. 검증자는 그들을 순위; 점유율 중량 점수를 TAO 보상을 배포한다. 각 하위 네트워크는 자신의 평가. 경제 교훈: 작업에 대한 특정 출력 품질을 지불, 계산이 사용되지 않습니다.

**Fetch.ai / ASI Alliance.**ASI-1 미니 LLM는 Fetch.ai 네트워크에서 실행되며, 사용자는 추론을 위해 FET 토큰을 지불합니다. 여기서 에이전트-아스-피어스 내레이티브는 더 강합니다.

**Gonka.**트랜스포머 작업 증명: " 작업 "은 트랜스포머의 앞면 패스이다. 광업자들은 올바른 출력을 알고 있는 추론 작업을 실행함으로써 수익을 얻는다.

이 세 가지 모두 2026년 4월 기준으로 생산급이다. 결제 분포는 다르다. 비트센서 보상은 하위 네트워크 검증자에 비해 품질을 높이고; 결제 사용자들에 의해 측정된 Fetch 보상은 유용하다. Gonka 보상은 검증 가능한 추론 작업이다.

### 샤플리 가치 신용 배당

3명의 에이전트가 공동 작업을 하고 있습니다. 출력 점수는 0.8입니다. 누가 무엇을 기여했나요?

샤플리 값: 4 가지 독자적인 신용 할당 (효율, 대칭, 선형성, 무상) 을 만족하는 크레딧 할당.`i`이 부분의 본문은

```
shapley(i) = (1/N!) * sum over all orderings O of (v(S_i_O ∪ {i}) - v(S_i_O))
```

어디`S_i_O` 이전 에 있는 에이전트들의 집합`i`순서대로`O`. 실제: 모든 변수를 나열하고, 각 변수에 각 대사의 소재적 기여를 기록하고, 평균을 기록한다.

N=3 대리자에서는 6개의 변수가 있습니다. N=10에 대해 3.6M , 그래서 실제로는 나열보다는 표본 순서를 사용합니다.

### 합병에 대한 2차 가격 경매

구글 리서치 ("큰 언어 모델에 대한 메커니즘 설계") 는 LLM 출력을 합쳐내기 위해 두 번째 가격 토큰 경매를 제안합니다. 설정: N 에이전트들은 각각 완료를 제안하고, 각각의 선택에 대한 고유한 값이 있습니다. 경매주는 가장 높은 가치를 가진 제안을 선택하고 *제2위 높은* 가치를 지불한다. 단조로운 집합 (가치는 어떤 제안이 선택되었는지에 달려 있으며, 얼마나 많은 제안이 되었는지에 달려 있지 않습니다) 에서, 이것은 진실입니다

LLM 시스템에서 왜 이것이 중요합니까: 당신은 다른 가격으로 여러 에이전트에 완료 작업을 외부에 할 수 있습니다. 경매는 가장 좋은 것을 선택합니다 + 공정하게 지불합니다. 에이전트는 잘못된 보고를 할 수 없습니다.

### 명예 자본

DID에 묶인 평판 점수는 확인된 기여로부터 축적됩니다. 간단한 업데이트 규칙:

```math
\text{rep}(i, t+1) = \alpha \cdot \text{rep}(i, t) + (1 - \alpha) \cdot \text{contribution\_quality}(i, t)
```

붕괴 요소를 가진`alpha`1에 가까운 명성이

- 로우팅 결정에 대해 읽을 수 있는 값이 저렴합니다 ("고급급 에이전트에 어려운 작업을 보내십시오").
- 가사화 비용이 많이 들다 (시간이 지나면서 축적되며, DID에 묶여 있다).
- 줄일 수 있습니다: 검증 실패한 기여를 추론

### AAMAS 2025 분산 라마스

라마스 제안 (AAMAS 2025) 은 DID 정체성, 샤플리 가치 신용 배정 및 간단한 경매 메커니즘을 결합합니다. 주요 주장은 신용 배정 단계를 분산시키는 것이 시스템을 감사 할 수 있고 단일 포인트 조작에 면역시킵니다.

### 경제가 무너지는 곳

- **Price oracle manipulation.**신용 함수가 게임될 수 있다면, 에이전트가 게임할 겁니다. 모든 메커니즘은 적대적 테스트가 필요합니다.
- **Sybil attacks.**한 사업자 는 N 가짜 에이전트를 고 자신 의 기여 를 부풀려 합니다. DID는 느려지만 이를 막지는 않습니다. 명예 를 는 비용 은 그 감축입니다.
- **Verification cost.**신용 배정은 검증자와 마찬가지로 공정합니다. 검증이 저렴하다면 (작은 LLM) 그것은 게임 할 수 있습니다.
- **Regulatory overhang.**에이전트 경제는 금융 규제와 교차하고 있습니다. 비트센서, 페치, 곤카는 모두 2026 년부터 일부 관할권에서 법적 회색 영역에서 운영됩니다.

### 에이전트 경제가 합리적인 경우

- **Open networks with heterogeneous operators.**어떤 팀도 모든 에이전트를 통제하지 못합니다.
- **Verifiable outputs.**검증 없이 신용등급은 추측일 뿐이죠.
- **Long-horizon workflows.**단편적인 작업은 명성을 쌓는 것에서 이익을 얻지 못합니다.
- **Tokenized payments are legally viable**본인의 관할 구역에 있습니다.

폐쇄된 기업 시스템에서 경제학은 더 간단한 할당 (경영자는 작업을 할당하고, 측정은 내부) 에 자리를 내주며 경제학 문학은 주로 개방된 네트워크에 적용된다.

```figure
swarm-auction
```

## 건설 해

`code/main.py`이 도구는

- `shapley(value_fn, agents)` 작은 N에 대한 수치를 통해 정확한 Shapley 계산
- `second_price_auction(bids)` 진실한 메커니즘; 승자는 두 번째로 높은 돈을 지불합니다.
- `Reputation` DID에 묶인 명성이 기하급수적 붕괴와 절단으로
- 데모 1: 세 명의 에이전트가 협업하고, 샤플리의 신용등급이 정확히 나타났습니다.
- 데모 2: 5명의 에이전트가 작업 슬롯을 제안하고, 2등급 경매에서 승자가 + 지불을 선택합니다.
- 데모 3: 100 라운드에 걸쳐서 heterogeneous rep를 가진 에이전트에게 임무 할당; rep 중량 로우팅은 무작위로 타는.

실행:

```
python3 code/main.py
```

예상 출력: 각 에이전트에게 샤플리 값; 경매 결과는 진실한 입찰 균형을 보여주는; 반복 중량 라우팅은 온화 후 무작위로 10-20% 품질 향상을 보여주는.

## 사용 하 고

`outputs/skill-economy-designer.md`최소한의 에이전트 경제를 설계합니다. 정체성 계층 선택, 신용 배정 메커니즘, 결제 메커니즘, 명예 규칙.

## 선박

2026년 에이전트 경제를 운영하는 것

- **Start with reputation, not tokens.**명성은 실행에 옮기는 데 저렴하고 가치 있는 것인데, 토큰은 법적, 경제적 복잡성을 더해줍니다.
- **Verify before you reward.**독립적인 검증 단계 없이 신용을 분배하지 마십시오. 자부지품은 시빌 게임으로 증가합니다.
- **Shapley-sample, not Shapley-exact.**표본 100~1000개의 순서; 정확한 수치는 스케일되지 않습니다.
- **Cap decay factor and floor reputation.**제한이 없는 부패는 합법적인 기여자를 지워버립니다. 너무 느린 부패는 고질성 물질을 보상합니다.
- **Audit mechanisms adversarially.**네트워크를 열기 전에 적색 팀 시나리오를 실행하세요. 모든 메커니즘은 게임 이론을 가지고 있습니다. 공격자를 찾는 것이 아니라 구멍을 찾는 것이 좋습니다.

## 운동

1. 달아`code/main.py`. 샤플리 값의 합을 전체 값으로 확인합니다 (효율성 추론). 값 함수를 변경하십시오. 샤플리 할당은 예상 방향에 변경합니까?
2. Shapley * 샘플링* (Monte Carlo 상 K 순서) 을 구현하십시오. K는 근접 정확성에 어떻게 영향을 미칩니다? N=4에 대해 정확성을 비교하십시오.
3. 경매 전에 연합조합 조립 단계를 시행: 에이전트는 팀으로 통합하여 단위로 입찰할 수 있습니다. 어떤 연합조합이 형성됩니다? 개인 입찰보다 파레토 결과가 더 좋습니까?
4. 구글 리서치 메커니즘 디자인 포스트를 읽어 보세요. 만약 위반되면 진실성을 깨는 가설을 확인하세요. LLM 설정에서 실패 모드는 어떻게 생겼을까요?
5. AAMAS 2025 분산 라마스 논문을 읽어보세요. 합성 작업에 10개 이상의 스패플리 단계를 구현하세요. 정확한 계산은 얼마나 걸립니다? 100개의 추첨으로 샘플링이 얼마나 가까워집니다?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| DePIN | "Decentralized physical infrastructure" | Token-incentivized compute/storage/bandwidth. Bittensor, Akash, Render. |
| DID | "Decentralized identifier" | W3C spec for portable IDs. Agent reputation binds to DID, not to a platform. |
| ERC-4337 | "Account abstraction" | Contract accounts that can sponsor gas, enabling agent payments. |
| Shapley value | "Fair credit attribution" | Unique allocation satisfying efficiency, symmetry, linearity, null. |
| Second-price auction | "Vickrey auction" | Truthful mechanism: winner pays second-highest bid. Monotone aggregation compatible. |
| Reputation capital | "Accumulated quality score" | DID-bound score from confirmed contributions; decays over time. |
| Agentic DAO | "Agents + humans govern" | DAO with agent voters as first-class, voting power tied to reputation. |
| TAO / FET / GPU credits | "Token denominations" | Bittensor TAO, Fetch.ai FET, various DePIN tokens. |

## 더 많은 읽기

- [The Agent Economy](https://arxiv.org/abs/2602.14219) 5층 에이전트-경제 스택의 2026 조사
- [Google Research — Mechanism design for large language models](https://research.google/blog/mechanism-design-for-large-language-models/) 단조적 합병을 가진 기호 경매
- [AAMAS 2025 — decentralized LaMAS](https://www.ifaamas.org/Proceedings/aamas2025/pdfs/p2896.pdf) 샤플리 가치 신용 배당
- [Bittensor TAO documentation](https://docs.bittensor.com/) 하위 네트워크 구조 및 보상 분배
- [Fetch.ai / ASI Alliance](https://fetch.ai/) ASI-1 미니 LLM 및 FET 토큰
- [W3C Decentralized Identifiers (DIDs) spec](https://www.w3.org/TR/did-core/) 정체성 기반
