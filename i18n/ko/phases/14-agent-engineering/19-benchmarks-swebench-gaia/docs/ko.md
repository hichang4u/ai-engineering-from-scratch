# 기준: SWE 벤치, GAIA, 에이전트 벤치

> 2026년 3가지 벤치 마크 앵커 에이전트 평가. SWE 벤치 테스트 코드 패싱. GAIA 테스트 일반적 도구 사용. AgentBench 테스트 다환경 추론. 그들의 구성, 오염 스토리, 그리고 그들은 측정하지 않는 것을 알고.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 06 (Tool Use)
**Time:** ~60 minutes

## 학습 목표

- SWE 벤치의 테스트 리너스 (FAIL_TO_PASS) 를 명명하고, 왜 단위 테스트에 출입하는지 설명하십시오.
- SWE 벤치 검증 (OpenAI, 500 작업) 이 존재하는 이유와 그 결과물이 무엇인지 설명하십시오.
- GAIA의 디자인을 설명하세요: 인간에게 간단하고 인공지능에게는 어렵고, 세 가지 난이도 수준입니다.
- 에이전트 벤치의 8개의 환경과 오픈소스 LLM의 주요 차단기를 명명하세요.
- SWE 벤치+ 오염 발견과 그 영향에 대해 요약하자.

## 문제

랭킹보드는 어떤 모델이 하나의 기준에서 승리하는지 알려줍니다.

- 벤치마커가 오염되었는지 (훈련 데이터의 솔루션, 테스트 누출)
- 벤치마크가 당신이 관심 있는 것을 측정하는지 (코드 vs. 브라우징 vs. 일반주의).
- 평가자가 견고하고 있는지 (AST 일치, 국가 검증, 인간 검토)

숫자를 인용하기 전에 3개의 앵커링 기준과 실패 모드를 알고 있습니다.

## 개념

### SWE 벤치 (Jimenez et al., ICLR 2024 oral)

- 12개의 인기 있는 파이썬 리포에서 2,294개의 실제 GitHub 문제점을
- 에이전트: 사전 수정 컴비팅 + 자연어 문제 설명의 코드베이스
- 에이전트가 만든 패치
- 평가자: 패치를 적용하여 리포의 테스트 스위트를 실행합니다. 패치는 FAIL_TO_PASS 테스트를 깨지 않고 (전에는 실패했지만 지금은 통과) 돌봐야 합니다.

SWE-agent (Yang et al., 2024) 는 에이전트-컴퓨터 인터페이스 (파일 편집기 명령어, 모형이 이해하는 검색 문법) 를 강조함으로써 출시 시 12.5%를 달성했습니다.

### SWE 벤치 확인

OpenAI, Aug 2024. 인간 관리가 된 500개의 작업 하위 집합. 모호한 문제, 신뢰할 수 없는 테스트 및 수정이 불분명한 작업을 제거합니다. "당신의 에이전트가 실제 패치를 전송합니까?"의 주요 기준입니다.

### 오염

- SWE 벤치 문제 중 94% 이상이 대부분의 모델 정지 이전입니다.
- **SWE-bench+**32.67%의 성공적인 패치들은 문제 텍스트에서 해법들을 누출한 것으로 나타났습니다 (모델은 설명에서 수정된 것을 보았으며) 그리고 31.08%는 테스트 커버리지가 약한 이유로 의심스러운 것으로 나타났습니다.
- 검증된 것은 더 깨끗하지만 오염이 없는 것은 아닙니다.

실용적 의미: SWE 벤치에서 50% 점수를 받은 모델은 SWE 벤치에서 35% 점수를 받을 수 있다.

### GAIA (Mialon et al., Nov 2023)

- 466개의 질문; huggingface.co/gaia-benchmark에서 개인 순위표에 300개의 질문들이 남아 있습니다.
- 디자인 철학: "인간에게 개념적으로 간단하다 (92%), 하지만 인공지능에 대해서는 어렵다 (플러그인들과 함께 GPT-4: 15%). "
- 추론, 다모다리티, 웹, 도구 사용 테스트
- 세 가지 난이도 수준; 3 차원은 다양한 방법들을 통해 긴 도구 연쇄가 필요합니다.

GAIA는 "전반적 능력"을 측정하기 위해 실행되는 것입니다. 코드 특정 기준과 혼동하지 마십시오.

### 벤치 대리원 (Liu et al., ICLR 2024)

- 코드 (Bash, DB, KG), 게임 (Alfworld, LTP), 웹 (WebShop, Mind2Web) 및 오픈 엔딩 세대에서 8 개의 환경.
- 다중회복, 분할당 4k-13k 회전
- 주요 발견: 장기적인 추론, 의사 결정 및 지침은 OSS LLM의 상업적 인 추종을 차단합니다.

### 이 값이 측정하지 않는 것은

- 실제 세계 운영 비용 (토큰, 벽 시계)
- 적대적인 조건에서 안전행동
- 자신의 도메인에서의 성능 (자신의 평가, 수업 30을 사용하십시오).
- 꼬리 실패 (표준 평균; 생산 사업자들은 최악의 1%에 대해 신경쓰고 있다).

### 벤치마킹이 잘못되는 곳

- **Single-number fixation.**SWE 벤치 50%는 P50/P75/P95 비용 + 단계 분포보다 적게 알려줍니다.
- **Contaminated claims.**검증된 또는 SWE-bench+를 언급하지 않고 SWE-bench을 보고하는 것은 오해의 소지가 된다.
- **Benchmark-as-development-target.**기준 기준에 대한 최적화는 생산 유용성에 차이가 있다.

```figure
ae-swebench-gate
```

## 건설 해

`code/main.py`장난감 SWE 벤치 모양의 배너를 설치합니다.

- 합성 버그 수정 작업 (3 작업)
- 스크립트 된 "아젠트"가 패치를 제안합니다.
- FAIL_TO_PASS (bug now fixed) 와 PASS_TO_PASS (무엇이 깨지지 않은) 를 확인하는 테스트 런어.
- GAIA 스타일의 문제 분해 깊이를 기반으로 하는 난이도 분류기

실행하세요:

```
python3 code/main.py
```

출력은 작업에 대한 해상율 + 어려움에 대한 해상율을 나타내고 평가자의 규칙을 구체화합니다.

## 사용 하 고

- **SWE-bench Verified**코드 에이전트들한테는 항상 확인된 점수를 보고해
- **GAIA**일반적 요원들을 위해 개인 순위표 분리를 사용하세요.
- **AgentBench**다환경 비교
- **Custom evals**(강좌 30) 제품의 실제 모양을 위해서

## 선박

`outputs/skill-benchmark-harness.md`FAIL_TO_PASS / PASS_TO_PASS 게팅을 가진 모든 코드베이스 작업 쌍에 SWE 벤치 스타일의 배너스를 구축합니다.

## 운동

1. 장난감 배너스를 실제 레포에 실행하도록 포트하십시오.
2. 단계수치를 추가해 보세요. 3개의 작업에서 해상도에 따라 몇 개의 요원 단계가 있습니까?
3. SWE- 벤치+ 논문을 읽어 보세요. 솔루션 누출 검사를 실시하세요 (패턴을 문제 텍스트와 디프에이션에 맞추어)
4. 공중분단에서 GAIA 질문 다운로드 받아 GPT-4급의 요원이 뭘 할 수 있는지 추적해 보세요.
5. 에이전트 벤치의 환경별 분해를 읽어보세요. 어떤 환경이 제품 표면을 반영하고 있습니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| SWE-bench | "Code agent benchmark" | 2,294 GitHub issues; patch must flip FAIL_TO_PASS tests |
| SWE-bench Verified | "Clean SWE-bench" | 500 human-curated tasks, OpenAI |
| FAIL_TO_PASS | "Fix gate" | Tests previously failing that must pass after the patch |
| PASS_TO_PASS | "No-regression gate" | Tests that were passing and must still pass |
| GAIA | "Generalist benchmark" | 466 human-easy / AI-hard multi-tool questions |
| AgentBench | "Multi-env benchmark" | 8 environments; long-horizon multi-turn |
| Contamination | "Training-set leak" | Benchmark tasks present in model training |
| SWE-bench+ | "Contamination audit" | 32.67% solution leakage found in successful SWE-bench patches |

## 더 많은 읽기

- [Jimenez et al., SWE-bench (arXiv:2310.06770)](https://arxiv.org/abs/2310.06770) 원래 기준
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 큐레이션 하위 집합
- [Mialon et al., GAIA (arXiv:2311.12983)](https://arxiv.org/abs/2311.12983) 일반적 기준
- [Liu et al., AgentBench (arXiv:2308.03688)](https://arxiv.org/abs/2308.03688) 다중 환경 제품군
