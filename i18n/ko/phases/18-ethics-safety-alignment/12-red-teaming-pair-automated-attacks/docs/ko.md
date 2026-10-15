# 레드 팀: PAIR 및 자동 공격

> 차오, 로베이, 도브리반, 하산이, 파파스, 웅 (NeurIPS 2023, arXiv:2310.08419). PAIR  Prompt Automatic Iterative Refinement 은 정통 자동화된 블랙박스 제일브레이크입니다. 적색 팀 시스템 인턴을 가진 공격자 LLM는 목표 LLM에 대한 Jailbreaks를 반복적으로 제안하여 자신의 채팅 역사에서 컨텍스트 피드백으로 시도와 응답을 축적합니다. PAIR는 일반적으로 20 개의 질서 내에서 성공합니다. GCG보다 더 효율적인 대량 순서 (Zou et al.'s 토큰 수준의 기하급수 검색) 이며 백 상자 액세스이 필요하지 않습니다. PAIR는 이제 JailbreakBench (arXiv:2404.01318) 및 HarmBench에서 GCG, AutoDAN, TAP 및 설득적 적대적 명령과 함께 표준 기본이다.

**Type:** Build
**Languages:** Python (stdlib, mock PAIR loop against a toy target)
**Prerequisites:** Phase 18 · 01 (instruction-following), Phase 14 (agent engineering)
**Time:** ~75 minutes

## 학습 목표

- PAIR 알고리즘을 설명해 주세요: 공격자 시스템 초급, 반복적인 정비, 맥락 내 피드백.
- 왜 PAIR가 검정박스 대상인 경우 GCG보다 엄격히 효율적이는지 설명해 주십시오.
- 다른 4개의 자동 공격 기저 라인 (GCG, AutoDAN, TAP, PAP) 를 명명하고 각각의 특징을 지정하십시오.
- JailbreakBench 및 HarmBench 평가 프로토콜과 각각의 " 공격 성공률"이 무엇을 의미하는지 설명하십시오.

## 문제

레드 팀링은 수동적인 활동이었다. 일부 전문가 테스트자들은 적대적 인 명령어를 구축하고 어떤 것이 효과가 있는지 추적했다. 이것은 확장되지 않습니다. 공격 성공률은 통계적인 샘플이 필요하며, 목표물은 모델 발매마다 움직이는 목표입니다. PAIR는 블랙박스 목표물로 레드 팀링을 최적화 문제로 운영합니다.

## 개념

### PAIR 알고리즘

입력:
- 타겟 LLM T (우리가 공격하는 모델)
- 재판관 LLM J (응답이 jailbreak인지 여부를 점수한다).
- 공격자 LLM A (붉은 팀 최적화).
- 목표 줄 G: " [해로운 명령]으로 응답하라".
- 예산 K (일반적으로 20개의 질문)

루프, k의 1..K:
1. A는 목표 G와 지금까지 (실동, 응답) 쌍의 역사를 통해 촉구됩니다.
2. A는 새로운 신호를 발송합니다$p_k$- 그래
3. 제출$p_k$T에 응답을 받습니다$r_k$- 그래
4. J 점수는$(p_k, r_k)$골에
5. 점수가 >= 문턱이라면,  Jailbreak 발견을 중지하십시오.
6. 다른 것, 추가$(p_k, r_k)$A의 역사에 대해 계속해 보세요.

경험적 결과 (NeurIPS 2023): GPT-3.5-turbo, Llama-2-7B-chat에 대한 공격 성공률은 > 50%; 10-20 범위에서 성공하는 평균 질의.

### 왜 PAIR이 효율적 인 이유

GCG (Zou et al. 2023) 는 적대적 토큰 자수들을 그라디언트로 검색한다. 백 상자 모델 접근을 요구하고 읽지 않는 자수들을 생성한다. PAIR는 블랙 상자이며 모델들 사이에 전송되는 자연어 공격을 생성한다. PAIR의 맥락 내 피드백은 공격자가 각 거부로부터 배울 수 있게 해준다. GCG는 동등한 것을 가지고 있지 않다 (모든 새로운 토큰 업데이트는 이전 진전을 재발견해야 한다).

### 관련 자동 공격

- **GCG (Zou et al. 2023, arXiv:2307.15043).**토큰 레벨의 기하급수 검색은 적대적 인 후자를 찾습니다. 화이트 박스는 전송 가능하며, 읽지 않는 문자열을 생성합니다.
- **AutoDAN (Liu et al. 2023).**계층적 목표에 의해 인도되는 명령에 대한 진화적 검색
- **TAP (Mehrotra et al. 2024).** 가지의 절단과 함께 여러 개의 PAIR 스타일의 롤러를 공격하는 나무.
- **PAP (Zeng et al. 2024).**설득력 있는 적대적 명령어 는 인적 설득 기술을 신속한 템플릿으로 암호화합니다.

### Jailbreak 벤치와 해름 벤치

두 가지 모두 (2024) 표준 평가:

- JailbreakBench (arXiv:2404.01318). 10개의 OpenAI 정책 범주에서 100개의 유해한 행동. 공격 성공률 (ASR) 은 주요 메트릭으로. 판사가 필요합니다.
- 하름벤치 (마제카 et al. 2024). 510 가지 범주에서의 행동, 의미적 및 기능적 해의 테스트. 33 가지 모델에 대한 18 가지 공격과 비교.

ASR는 보통 고정된 질의 예산으로 보고된다. 공격을 비교하는 것은 부지대와 일치하는 것을 필요로 한다. 200 개의 질의에서 90%의 ASR는 20%의 ASR와 비교될 수 없다.

### 2026년 배치에 있어서 중요한 이유

모든 국경 연구소들은 현재 출시 전에 생산 모델에 대한 PAIR와 TAP를 실행합니다. ASR 궤도는 모델 카드 (강좌 26) 및 안전 케이스 첨부판 (강좌 18) 에 나타납니다. 공격은 외상적이지 않습니다.

### 이 부분은 18단계에 맞게

12강은 자동 공격 기반이다. 13강 (Many-Shot Jailbreaking) 은 보충 장점-사용이다. 14강 (ASCII Art / Visual) 은 코딩 공격이다. 15강 (Indirect Prompt Injection) 은 2026 생산 공격 표면이다. 16강은 방어 도구 대동체 (Llama Guard, Garak, PyRIT) 를 다루고 있다.

```figure
al-pair-loop
```

## 사용 하 고

`code/main.py`장난감 PAIR 루프를 구축합니다. 목표물은 "시설적인" 해로운 명령어를 거부하는 가짜 분류자 (키워드 필터) 이다. 공격자는 규칙 기반의 정제자이며, 변구, 역할 플레이 프레임링 및 코딩을 시도합니다. 판사는 반응을 점수합니다. 당신은 공격자가 키워드 필터에 대한 ~5-15 반복에서 성공하고 의미 필터에 대한 실패를 관찰합니다.

## 선박

이 교훈은`outputs/skill-attack-audit.md`. 적색 팀 평가 보고서를 통해, 그것은 어떤 공격이 실행되었는지 (PAIR, GCG, TAP, AutoDAN, PAP), 각 공격은 어떤 예산으로, 어떤 판사가 어떤 해로운 행동을 세웠는지 (JailbreakBench, HarmBench, 내부) 를 감사합니다.

## 운동

1. 달아`code/main.py`. 3개의 내장된 공격 전략에 대한 평균 수요를 측정하고 각각의 공격 공격 전략의 목표 방어 가설을 설명합니다.

2. 네 번째 공격자 전략을 실행 (예를 들어, 다른 언어로 번역, base64 코딩)

3. Chao et al. 2023 그림 5 (PAIR vs GCG 비교) 를 읽어 보세요. PAIR의 효율적 이점에도 불구하고 GCG가 선호되는 두 가지 시나리오를 설명하세요.

4. JailbreakBench는 고정된 목표 세트에 대한 ASR를 보고합니다. 공격 다양성을 측정하는 추가 메트릭을 설계하십시오. (성공한 명령의 변동) 왜 다양성이 방어 평가에 중요하는지 설명하십시오.

5. TAP (Mehrotra 2024) 는 PAIR를 분할 + 절단으로 확장합니다. TAP 스타일의 확장 를 스케치하여 `code/main.py`그리고 계산 비용과 성공률의 타협을 설명합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| PAIR | "automated jailbreak" | Prompt Automatic Iterative Refinement; attacker-LLM + judge-LLM loop |
| GCG | "gradient jailbreak" | White-box token-level gradient search for adversarial suffixes |
| Attack success rate (ASR) | "% jailbreaks at k queries" | Primary metric; must be reported with query budget and judge identity |
| Judge LLM | "the scorer" | LLM that grades whether a response satisfies the harmful goal |
| JailbreakBench | "the evaluation" | Standardized harmful-behaviour set with tagged categories |
| HarmBench | "the broader bench" | 510 behaviours, functional + semantic harm tests |
| TAP | "tree of attacks" | PAIR with branching + pruning; better ASR at higher compute |

## 더 많은 읽기

- [Chao et al. — Jailbreaking Black Box LLMs in Twenty Queries (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419)                                                                                                                                                                                                                                                              
- [Zou et al. — Universal and Transferable Adversarial Attacks on Aligned LLMs (arXiv:2307.15043)](https://arxiv.org/abs/2307.15043) GCG 종이
- [Chao et al. — JailbreakBench (arXiv:2404.01318)](https://arxiv.org/abs/2404.01318) 표준화된 평가
- [Mazeika et al. — HarmBench (ICML 2024)](https://arxiv.org/abs/2402.04249) 더 넓은 평가
