# 실패 모드  MAST, 그룹 사고, 단일 문화, 캐스케이드 오류

> 2026년 기준 분류학은**MAST**(Cemri et al., NeurIPS 2025, arXiv:2503.13657), 7개의 최신 오픈소스 MAS에서 1642개의 실행 흔적을 통해 도출된**41–86.7% failure rate**. 세 가지 근본적인 범주: **Specification Problems**(41.77%)  역할의 모호함, 명확하지 않은 작업 정의**Coordination Failures**(36.94%)  통신 장애, 상태 비동동성**Verification Gaps**(21.30%)  검증이 부족하고 품질 검사가 부족하다.**Groupthink**가족 (arXiv:2508.05687) 는 다음을 추가한다: 단일 문화 붕괴 ( 같은 기본 모델 → 상관성 실패), 적합성 편향 (대리자는 서로의 실수를 강화), 미미한 정신 이론, 혼합 동원 역학, 캐스카드 신뢰성 실패. 캐스케이드 예: 지불 실패로 인해 주문 재실험이 발생하여 재실험이 발생하여 재실험이 발생하여 재실 서비스 (10배 로드 2초에  회로 단속기가 필요) 를 압도합니다. 기억중독: 한 요인의 환각은 공유된 기억에 들어가, 하류 요인은 그것을 사실로 취급합니다. 정확성은 점차 쇠퇴하고, 근본 원인을 진단하는 것이 고통스럽습니다.**STRATUS**(NeurIPS 2025) 는 전문 검출/감사/확인 요인을 통해 완화-성공의 1.5배 향상을 보고합니다. 이 수업은 실패 모드를 1급 엔지니어링 목표로 다루고 있습니다.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 13 (Shared Memory), Phase 16 · 14 (Consensus and BFT), Phase 16 · 15 (Voting and Debate Topology)
**Time:** ~75 minutes

## 문제

멀티 에이전트 시스템은 실제 작업에서 41-86.7%의 시간을 실패합니다 (Cemri et al. 2025는 7개의 오픈소스 MAS에서 측정했습니다). "더 많은 에이전트를 추가하십시오"로 오류를 해제할 수 없습니다. 실패는 구조적인 원인이 있습니다. MAST 분류학은 카테고리를 제공합니다. 이 수업은 각각의 카테고리를 구체적인 검출, 진단 및 완화 패턴으로 지도합니다. 따라서 숫자는 임의로 보이지 않습니다.

2026 생산 연습은 실패 모드를 설계 입력으로 취급하는 것입니다. 각 MAST 범주를 지적하고 배치 된 완화 사항을 지정할 때까지 귀하의 아키텍처는 "충분하게 좋지 않습니다".

## 개념

### MAST 분류

**Specification Problems (41.77% of failures).**에이전트의 임무는 충분히 정밀하게 정의되지 않았습니다. 예를 들어:

- 역할의 모호함: 두 명의 에이전트는 모두 자신이 평론가라고 생각합니다.
- 작업은 "이것을 요약하십시오"라고 하찮은 것으로 나타났습니다. 사용자가 특정 각을 원했을 때.
- 성공 기준은 암시적으로: 에이전트가 성공했는지 알 수 없습니다.

완화:
- 각 에이전트의 명령어에서 자신이 하는 일과 하지 않는 일들이 명시되어 있습니다.
- 작업에 대한 수용 테스트. 대리인이 시작하기 전에 " 완료 된 것은 X와 같습니다"를 정의하십시오.
- 비행 전 특유 확인: 별도의 요원은 발송 전에 작업 정의를 검토합니다.

**Coordination Failures (36.94%).**통신이나 상태의 장애

예를 들어:
- 2명의 에이전트가 동기화 없이 공유 상태를 업데이트합니다.
- 에이전트들 사이에 잃어버린 메시지 (열 실패, 타임아웃)
- 상태 유동: 에이전트 A는 작업이 완료되었다고 생각하지만, 에이전트 B는 여전히 실행 중입니다.

완화:
- 낙관적인 동시성으로 버전 공유 상태
- 비판적 메시지들에 대한 명시적인 인정을 (acked까지 다시 시도하십시오).
- 주기적으로 국가 동기화 점검 지점; 조기에 유동을 감지합니다.

**Verification Gaps (21.30%).**출력에 대한 독립적인 검사가 없습니다.

예를 들어:
- 한 명의 에이전트가 성공했다고 주장하지만 아무도 확인하지 않습니다.
- 각 에이전트들의 체인은 전사의 출력을 신뢰합니다.
- 새로운 구성된 행동에 대한 테스트 커버리가 부족합니다.

완화:
- 독립적인 검증기 (강좌 13) 읽기 전용, 독립된 출처 접근
- 명시적인 전달 계약: "A의 출력은 B가 시작되기 전에 C 검사를 통과해야 한다".
- 포스트호크 분석을 위한 결과 기록

### 그룹 생각 가족 (arXiv:2508.05687)

에이전트가 서로 동원하거나 모방하는 5가지 관련 실패:

**Monoculture collapse.**같은 기본 모델 또는 훈련 데이터 → 상관 오류. 세 명의 에이전트가 LLM를 공유하면 그 환각을 공유합니다.

**Conformity bias.**에이전트들은 가장 큰 소음이나 가장 자신감을 가진 동료에게 적응합니다.

**Deficient ToM.**에이전트들은 서로의 신념을 모형화하지 못하고, 조정이 무너지고 있다 (강좌 18).

**Mixed-motive dynamics.**부분적으로 일치하는 인센티브를 가진 에이전트는 타협 중간에 이동합니다.

**Cascading reliability failures.**하나의 구성요소의 오류 패턴은 의존적인 구성요소에서 오류 패턴을 유발합니다.

### 캐스케이드 예제  재발

2026년 고전적인 사건 패턴:

```
payment service fails 10% of requests
   ↓
order agent retries payment (exponential backoff but naive)
   ↓
each retry is a new order-inventory check
   ↓
inventory service sees 2x normal load
   ↓
inventory service starts timing out
   ↓
every order retries inventory check
   ↓
inventory service sees 10x normal load
   ↓
cluster goes down
```

고전적인 방법:**circuit breakers**. 하류 오류율이 열을 초과할 경우, 캐시 또는 기본 결과로 단장회로, 그리고 요청에 따라 제한된 재실험 예산.

회로 단절기는 여러 대리인 오류 완화 장치 중 하나인데, 직접적으로 분산된 시스템에서 수정 없이 빌려서

### 기억 중독 (재검)

수업 13에서 한 요인의 환각은 공유 메모리 사실로 변하고, 하류 요인들은 독성 사실에 대해 논의를 한다. MAST 용어로는 공유 메모리 계층에서 검증 격차가 된다.

점진적 정확성 붕괴는 증상 입니다. 당신은 충돌을 하지 않습니다. 당신은 천천히 움직이게 됩니다. 그 원인을 뿌리 내리기 어렵다.

완화: 추가 로그, 출처, 비쓰기 검증기. 이미 수업 13에 다루어졌습니다.

### STRATUS  장애 탐지용 전문성 요인

STRATUS (NeurIPS 2025) 는 다음과 같은 경우 완화 성공의 1.5배 향상된다고 보고합니다.

- **Detection agent.**증상 패턴을 관찰하는 것 (고등 불일치, 재시험 스피크, 정확성 추동)
- **Diagnosis agent.**증상들을 고려하면 MAST 분류학에서 근본 원인을 추론한다.
- **Validation agent.**완화제를 적용한 후 증상이 명확하다는 것을 확인합니다.

이것은 SRE 스타일의 사고 대응입니다. 에이전트 시스템에 적용됩니다. 세 역할 모두 전문적인 명령으로 LLM 에이전트일 수 있습니다.

### 실패 모드 감사

2026년 최고의 실습은 매년 (또는 주요 출시) 실패 모드 감사입니다.

1. **Trace sample.**1000개의 실제 실행 흔적을 수집해 보세요.
2. **Categorize.**각 추적의 실패에 대해 MAST+Groupthink 카테고리로 지도를 작성하십시오.
3. **Compute failure-by-category rate.**어떤 부류가 여러분의 체계를 지배하고 있습니까?
4. **Rank mitigations.**어떤 해결책이 가장 많은 실패를 제거할 수 있을까요?
5. **Pick 2-3 mitigations.**시행, 다음 분기 재조정

특정 선택보다 규율이 더 중요해요. 감사가 없으면 실패는 소리로 섞여서 체계적으로 해결되지 않습니다.

### 시스템들이 침묵으로 실패할 때

가장 위험한 오류 카테고리는 침묵의 정확성 오류입니다. 고소로 실패하는 시스템 ( 충돌, 예외, 경고) 을 모니터링 할 수 있습니다. 유연하지만 잘못된 출력을 생성하는 시스템을 예외 로그에 의해 감지 할 수 없습니다. 그렇기 때문에 검증 격차는 계산에 따라 21.30% 만이지만 실패 당 가장 비싼 카테고리입니다.

투자:
- 샘플 기반의 인간 검토
- 골든 데이터 세트 역전 테스트
- 중요한 출력들을 검증하는 중개 요원들

### 실패와 느린 실패

일부 실패는 즉각적 인 경우도 있고, 일부는 느리기도 합니다. 즉각적인 실패 (타임오드, 스케마 불합동, 저작 오류) 는 검출하기 저렴합니다. 느린 실패 (기억 중독, 단일 문화 유동, 역할 모호함) 는 검출 및 예방하기 비용이 많이 들습니다.

2026 엔지니어링 움직임: 장치 속속 실패 프록시, 즉 눈에 보이는 오류가 되기 전에 파동을 잡을 수 있습니다. 합의 속도, 재실험 속도, 출력 길이가 분산 및 연속적인 에이전트 버전 사이의 편집 거리는 모두 유용한 프록시입니다.

```figure
a5-retry-cascade
```

## 건설 해

`code/main.py`이 도구는

- `FailureTaxonomy` 모형 사건들을 MAST+ 그룹 생각 범주에 분류한다.
- `CircuitBreaker` 클래식 패턴; 오류율이 문턱을 초과할 때 열립니다.
- `RetryStormSimulator` 시중 장애를 나타냅니다. 회로 차단기를 켜/ 끄는 것을
- `DetectionAgent` 스크립트 된 STRATUS 스타일의 증상 일치

실행:

```
python3 code/main.py
```

예상 출력:
- 회로 차단기 없이 재시험 폭풍: 재시장 오류가 폭발 (시뮬레이션)
- 회로 차단기: 문턱에 뚜이 있고, 퇴화 모드 응답이 제공된다.
- 검출기료는 패턴을 표시하고 MAST 범위를 지정합니다.

## 사용 하 고

`outputs/skill-mast-auditor.md`여러 에이전트 시스템에서 MAST 스타일의 실패 모드 감사를 수행합니다.

## 선박

생산에서 실패 모드 징계:

- **MAST audit per quarter.**연간이 아니라 시스템 성장에 따라 카테고리가 바뀌죠
- **Circuit breakers everywhere.**모든 종속 서비스의 출력 호출. 기본 열 열 열 5-10% 오류율.
- **Golden datasets.**작고 고품질의 수동검사를 하고 매주 반향 검사를 합니다.
- **STRATUS trio.**검출+감사+확인 요인 생산을 모니터링 합니다. 검출 요인만 사용하세요. 증상이 을 때 진단을 추가하세요.
- **Failure budget.**부실률을 범주별로 명시한 SLO. 예산이 초과되면 배송 중단 대화가 시작됩니다.

## 운동

1. 달아`code/main.py`- 회로 차단기 이 다시 시도되고 실패 문턱을 변경하고 타협을 관찰하십시오.
2. **slow-failure proxy**3개의 병렬 요인 간 협조율. 급격히 떨어지면 경고를 불러 일으키십시오. 요인 출력을 점진적으로 상관관계를 통해 단일농산물 파동을 시뮬레이션하십시오.
3. Cemri et al. (arXiv:2503.13657) 를 읽어 보십시오. 그들의 7개의 MAS 시스템 중 하나를 선택하고 그 3가지 주요 실패 범주를 지도로 그려보세요. MAST의 예측과 비교하면 어떻게 될까요?
4. 그룹 핑크 논문을 읽어 보세요 (arXiv:2508.05687). 생산에서 가장 어렵게 감지되는 다섯 가지 패턴 중 어느 것을 식별하세요.
5. 여러분이 알고 있는 특정 멀티 에이전트 시스템에서 STRATUS 스타일의 검출-진단을-확인 트리오를 설계하세요. 검출은 어떤 증상을 감시합니다? 진단은 어떤 완화 방법을 권장합니다? 검증은 어떻게 효과가 있는지 확인합니다?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MAST | "The 2026 taxonomy" | Cemri 2025; 3 root categories + 14 sub-types of failures. |
| Specification Problem | "Role ambiguity" | Task or role under-defined; agents do not know what to do. |
| Coordination Failure | "State drift" | Communication or sync breakdown between agents. |
| Verification Gap | "No one checked" | Outputs accepted without independent validation. |
| Groupthink family | "Homogeneity failures" | Monoculture, conformity, deficient ToM, mixed-motive, cascading. |
| Monoculture collapse | "Same model, same hallucinations" | Correlated errors from shared base model or training data. |
| Retry storm | "Cascading error amplification" | One failure triggers retries which amplify load downstream. |
| Circuit breaker | "Fail fast on error rate" | Open when error rate exceeds threshold; short-circuit with default. |
| STRATUS | "Incident response trio" | Detection + diagnosis + validation agents. 1.5x mitigation success. |
| Memory poisoning | "Hallucinations propagate" | Shared-memory fact tainted; downstream agents reason on poison. |

## 더 많은 읽기

- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST 분류학, NeurIPS 2025
- [Groupthink failures in multi-agent LLMs](https://arxiv.org/abs/2508.05687) 단일농업, 적합성 및 5개 가족 분류
- [STRATUS — specialized agents for MAS incident response](https://neurips.cc/) NeurIPS 2025 절차에 입문 (탐지 + 진단 + 검증)
- [Release It! — stability patterns (Nygard)](https://pragprog.com/titles/mnee2/release-it-second-edition/) 가톨릭 회로 차단기 참조
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) 생산 실패 모드 노트
