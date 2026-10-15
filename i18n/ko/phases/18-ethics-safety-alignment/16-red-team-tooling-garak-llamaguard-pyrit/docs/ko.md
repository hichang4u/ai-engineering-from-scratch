# 레드 팀 도구  가라크, 라마 경비, 파이리트

> 2026년 레드팀 스택을 구성하는 3개의 생산 도구가 있습니다. 라마 경비 (Meta)  라마-3.1-8B 분류기 14개의 MLCommons 위험 범위에 정렬되어 있습니다. 2025 라마 경비기 4는 라마 4 스카우트에서 정렬된 12B 고유 다중형 분류기입니다. 가라크 (NVIDIA)  유령증, 데이터 유출, 신속한 주입, 독성 및 jailbreaks를 위한 정적, 역동적, 적응성 탐사기 PyRIT (마이크로소프트)  크레센도, TAP, 그리고 깊이 있는 착취를 위한 사용자 정의 변환기 체인을 가진 다중 회전 적색 팀 캠페인. 라마 경비 3는 메타의 "라마 3 팩 오브 모델" (arXiv:2407.21783); 라마 경비 3-1B-INT4에서 arXiv:2411.17713; github.com/NVIDIA/garak에서 가라크의 탐사 구조에 기록되어 있습니다. 이 도구들은 2026년 레드 팀 연구 (강좌 12~15) 와 배포 (강좌 17+) 사이의 생산 인터페이스입니다.

**Type:** Build
**Languages:** Python (stdlib, tool-architecture simulator and Llama Guard-style classifier mock)
**Prerequisites:** Phase 18 · 12-15 (jailbreaks and IPI)
**Time:** ~75 minutes

## 학습 목표

- 안전 스택에서 Llama Guard 3/4의 위치를 설명하십시오: 입력 분류자, 출력 분류자 또는 둘 다.
- MLCommons의 위험 범주 14개에 대해 명명하고 명백하지 않은 범주를 지정하십시오 (코드 해석자 남용).
- 가라크의 탐사 구조를 설명해 주세요. 탐사, 탐지, 배너스.
- PyRIT의 다중회전 캠페인 구조와 그 구조가 어떻게 가라크 탐사선과 구성되는지를 설명해 주십시오.

## 문제

12~15강은 공격 표면을 제시한다. 생산 배포는 반복적이고 확장 가능한 평가가 필요합니다. 2026년에 세 가지 도구가 지배한다. 라마 가드 (방위 분류자), 가라크 (스캐너), 파이어리트 (캠페인 오케스트레이터). 각각은 레드 팀 라이프 사이클의 다른 층을 목표로 한다.

## 개념

### 라마 경비 (메타)

라마 가드 3는 MLCommons AILuminate 14 범주에서 입력/출력 분류를 위해 정비된 라마-3.1-8B 모델입니다.
- 폭력 범죄, 비폭력 범죄, 성관계 범죄, CSAM, 명예훼손
- 전문적인 조언, 개인 정보 보호, IP, 무차별 무기, 증오
- 자살/자신해, 성적 내용, 선거, 코드 인터프리터 남용

8개의 언어를 지원합니다. 사용: LLM (인입중치를), LLM (출력중치를) 다음 또는 둘 다. 두 가지 사용은 서로 다른 훈련 배포를 생성합니다.

라마 가드 3-1B-INT4 (arXiv:2411.17713, 440MB, 모바일 CPU에서 ~30 토큰/s) 는 양자화된 가장자리 변종이다.

라마 가드 4 (아프ریل 2025) 는 12B, 자국적으로 멀티모달, 라마 4 스카우트에서 절단되었습니다. 8B 텍스트와 11B 비전 전작 모두 텍스트 + 이미지를 흡수하는 한 분류기로 대체합니다.

### 가라크 (NVIDIA)

오픈소스 취약성 스캐너
- **Probes.**환각, 데이터 유출, 임프트 주입, 독성, 재일브레이크를 위한 공격 생성기.
- **Detectors.**예상되는 실패 모드에 대한 점수 출력  독성, 유출, jailbreak.
- **Harnesses.**탐지 탐지선 쌍을 관리하고 캠페인을 실행하고 보고서를 생성합니다.

TrustyAI는 Garak을 Llama-Stack 방패 (Prompt-Guard-86M 입력 분류, Llama-Guard-3-8B 출력 분류) 로 통합하여 종전적 방패 대상 평가를 수행합니다. 계층 기반 점수 (TBSA) 는 바이너리 패스/패스를 대체합니다.

### PyRIT (마이크로소프트)

파이썬 위험 식별 도구 킷, 다중 회전 적색 팀 캠페인
- **Converters.**시드  패라프라지, 코딩, 번역, 롤플레이를 변환하십시오.
- **Orchestrators.**캠페인을 실행하세요: Crescendo (스케랄), TAP (분열), RedTeaming (작정 루프).
- **Scoring.**법정법인 판사 또는 판사로서의 분류자

파이리트는 가라크의 무거운 사촌이다. 가라크는 수천 개의 단일 회전 탐사선을 실행하고, 파이리트는 특정 실패 모드를 깨기 위해 설계된 깊은 다회전 캠페인을 실행합니다.

### 

모델의 양쪽에 Llama Guard을 설치하고, 회귀를 위해 밤마다 Garak을 실행하세요. 출시 전 캠페인에서 PyRIT을 실행하세요. 이것은 대부분의 생산 배포에 대한 2026 기본 구성입니다.

### 평가 함정이

- **Judge identity.**세 가지 도구 모두 LLM 판사를 사용할 수 있습니다. 판사 캘리브레이션 드라이브는 ASR를 보고합니다 (강좌 12). 도구와 함께 판사를 지정하십시오.
- **Probe staleness.**가라크 탐사선은 모델에 맞게 패치되어 시대로 니다. 적응 탐사선은 정적 탐사선보다 느리게 시대로 니다.
- **Llama Guard FPR on benign content.**초기 라마 경비 버전은 정치 및 LGBTQ+ 콘텐츠를 과장했습니다. 라마 경비 3/4 캘리브레이션은 개선되었지만 배치당 캘리브레이션되지 않았습니다.

### 이 부분은 18단계에 맞게

12~15강은 공격 가족입니다. 16강은 생산 도구입니다. 17강 (WMDP) 은 이중 사용 능력 평가입니다. 18강은 정책 구조에 이러한 도구를 포장한 국경 안전 프레임워크입니다.

```figure
al-guard-stack
```

## 사용 하 고

`code/main.py`장난감 Llama Guard 스타일의 분류기를 (키워드 + 14 가지 이상의 의미적 기능), 장난감 Garak 리너스 (조사 탐지 루프) 및 PyRIT 스타일의 멀티 턴 변환 체인을 구축합니다. 당신은 모형 목표에 세 도구를 실행하고 다른 커버리지 서명을 관찰 할 수 있습니다.

## 선박

이 교훈은`outputs/skill-red-team-stack.md`- 배포 설명에 따르면, 세 가지 도구 중 어느 것이 적절하고, 각각의 도구에서 어떤 것을 구성해야 하는지, 그리고 어떤 회귀 순서로 실행해야 하는지 알려줍니다.

## 운동

1. 달아`code/main.py`람마-가드 스타일의 분류기의 단회전과 다회전 공격의 탐지율을 비교해 보세요.

2. 새로운 가라크 탐사선을 구현해 보세요. base64 암호화된 해독 요청입니다. Llama-Guard 스타일의 분류기로 탐지량을 측정하세요.

3. PyRIT 스타일의 변환기 연쇄를 "프랑스어 번역, 그리고 문장" 변환기로 확장합니다. 공격 성공을 재 측정합니다.

4. Llama Guard 3의 위험 카테고리 목록을 읽어 보세요. 훈련 데이터가 합법적인 개발자 콘텐츠에 대해 현실적으로 높은 거짓 긍정적 인 비율을 생성할 수있는 두 가지 범주를 식별하십시오.

5. 가라크와 파이리트의 디자인 원칙을 비교해 보세요. 각각이 올바른 도구가 되는 배포를 주장하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Llama Guard | "the classifier" | Fine-tuned Llama-3.1-8B/4-12B safety classifier with 14 hazard categories |
| Garak | "the scanner" | NVIDIA open-source vulnerability scanner; probes, detectors, harnesses |
| PyRIT | "the campaign tool" | Microsoft multi-turn red-team orchestrator; converters, orchestrators, scoring |
| Prompt-Guard | "the small classifier" | Meta's 86M prompt-injection classifier, paired with Llama Guard |
| TBSA | "tier-based scoring" | Garak's tier-based pass/fail replacing binary outcomes |
| Converter chain | "paraphrase + encode + ..." | PyRIT composition primitive for building multi-step attacks |
| MLCommons hazard categories | "the 14 taxonomies" | Industry-standard taxonomy Llama Guard targets |

## 더 많은 읽기

- [Meta — Llama Guard 3 (in Llama 3 Herd paper, arXiv:2407.21783)](https://arxiv.org/abs/2407.21783) 8B 분류
- [Meta — Llama Guard 3-1B-INT4 (arXiv:2411.17713)](https://arxiv.org/abs/2411.17713) 양자화된 이동통신 분류기
- [NVIDIA Garak — GitHub](https://github.com/NVIDIA/garak) 스캐너 레포 및 문서
- [Microsoft PyRIT — GitHub](https://github.com/Azure/PyRIT) 캠페인 도구 킷
