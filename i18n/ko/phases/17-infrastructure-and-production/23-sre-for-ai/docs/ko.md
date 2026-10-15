# 인공지능에 대한 SRE  다중 에이전트 사건 대응, 런북, 예측 탐지

> AI SRE는 RAG를 통해 인프라 데이터 (록, 런북, 서비스 토폴로지) 에 기반한 LLM를 사용하여 조사, 문서화 및 조정 단계를 자동화합니다. 2026 건축 패턴은 다중 에이전트 오케스트레이션입니다. 관리자가 조정하는 전문 에이전트 (록, 메트릭스, 런북) 이 있습니다. AI는 가설과 질문을 제안하고, 인간은 판단 호출을 승인합니다. Datadog Bits AI와 Azure SRE Agent이 관리되는 제품으로 이 제품을 배포합니다. 런북은 진화하고 있다: 뉴비드 호케이는 적대적 평가 (두 모델은 같은 사건을 분석한다; 합의 = 신뢰, 불일치 = 불확실성); 팀 변경에도 운영 메모리는 지속된다. 자율적인 치료는 조심스럽게 유지됩니다. 인공지능은 제안하고, 인간은 승인합니다. 완전히 자율적인 동작은 좁습니다 (부턴 시작 모터, 롤백 특정 배포)  꽉 꽉 찼다  판매하는 모든 사람이 "서팅하고 잊어라"는 과장 판매입니다. 신흥 국경: 사고 전 예측 MIT 연구 보고서는 역사 로그 + GPU 시간 + API 오류 패턴에 훈련된 LLM가 오프닝의 89%를 10-15분 전에 예측했습니다. 예측: 기업 LLM의 95%는 2026년 말까지 자동화 된 결실을 맺을 수 있습니다.

**Type:** Learn
**Languages:** Python (stdlib, toy multi-agent incident triage simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 24 (Chaos Engineering)
**Time:** ~60 minutes

## 학습 목표

- 다중 에이전트 AI SRE 아키텍처를 다이어그램으로 그려보세요: 감독자 + 전문 에이전트 (록, 메트릭스, 런북) + 인적 승인 게이트.
- 자동적 보완이 왜 좁은지 (부동기, 재발동기) 보다 넓은지 (재건 서비스) 을 설명해 주십시오.
- 적대적 평가 패턴을 명명하라 (뉴버드 호크 아이): 두 모델은 동의 = 신뢰; 동의하지 = 격화.
- MIT 89% 초기 탐지 결과와 운영적 제약을 인용하십시오: 작동하지 않은 예측은 단지 패시보드입니다.

## 문제

전화기 엔지니어는 새벽 3시에 "표시에서 높은 오류율"에 대해 호출합니다. 그들은 Datadog, Loki, 세 개의 런북, 배포 로그를 확인합니다. 30분 후에 그들은 KV 캐시 스피크에서 vLLM OOM가 근본 원인을 발견합니다. 그들은 포드를 다시 시작합니다. 오류가 클리어됩니다.

2026년, 그 조사의 첫 20 분기는 자동화된다. 최근 배치와 상관관계를 맺고, 런북에 맞게 조화를 이루는 로그를 그룹화합니다. 모두 RAG + 도구 사용입니다. 감독된 에이전트는 사람이 Datadog를 열기 전에 첫 번째 통과 triage를 수행하고 가설을 제시할 수 있습니다.

완전히 자율적인 복구는 다른 문제입니다. 포드: 안전. 확장 GPU 풀: 안전. 정책이 허용하면. 서비스를 재구성: 절대적으로 아닙니다. 규율은 좁은 경계를 그리고 있습니다.

## 개념

### 다중 에이전트 아키텍처

```
          Incident
             │
             ▼
        Supervisor
        /    |    \
       ▼     ▼     ▼
  Log agent  Metric agent  Runbook agent
       │     │     │
       └─────┴─────┘
             │
             ▼
        Hypothesis + evidence
             │
             ▼
        Human approval
             │
             ▼
        Action (narrow set)
```

감독자는 사건을 하위 질문으로 나눕니다. 전문적인 에이전트는 도구 접근 (토그 검색, PromQL, 문서 검색) 을 가지고 있습니다. 감독자는 합성, 인상에 가설 + 증거를 제시합니다. 인물은 승인 또는 리디렉트를합니다.

### 자동적 보완의 범위

**Safe (narrow)**: 재발전 팟, 특정 배포를 되돌려, 사전 승인된 한계 내에서 규모 풀, 사전 승인된 기능 플래그를 활성화하십시오.

**Not safe (broad)**: 서비스 토폴로지를 변경, 자원 제한을 변경, 새로운 코드를 배포, IAM를 변경, 데이터베이스를 변경.

"세트 앤  forgot"를 팔는 사람은 과장 판매를 하고 있습니다. AI SRE가 성숙함에 따라 안전 세트가 성장하지만 경계는 현실입니다.

### 반대의 평가 (NewBird Hawkeye)

두 모델은 독립적으로 같은 사건을 분석합니다. 근본 원인에 대해 동의하면 신뢰도가 높습니다. 동의하지 않으면 두 가설 모두 가시적으로 인간으로 격화됩니다. 간단한 패턴, 환각의 근본 원인에 대한 효과적인 필터.

### 운영 메모리

팀 오버는 전통적인 SRE  부족 지식의 잎을 침묵으로 죽이는 것입니다. AI SRE는 벡터 DB에서 런북 + 포스트모르템을 저장합니다. 에이전트는 모든 새로운 사건을 검색합니다. 새로운 엔지니어가 합류하면 AI는 완전한 역사를 가지고 있습니다.

### 사고 전 예측

MIT 2025 연구: 역사 로그, GPU 온도, API 오류 패턴에 훈련된 LLM는 테스트 세트에서 발생하는 10-15분 전에 89%의 정전이 발생할 것이라고 예측했습니다.

현실 검증: 작동하지 않은 예측은 패시보드입니다. 운영 문제는 "우리가 예측할 때, 우리는 무엇을합니까?" 예방적 배기가? 페이지? 자동 확장? 대답은 정책에 대한 것입니다.

### 2026년 제품

- **Datadog Bits AI** Datadog 내부에서 SRE 부사 조종사를 관리했습니다.
- **Azure SRE Agent** 아저우르 원산지
- **NeuBird Hawkeye** 역동적 평가 + 운영 기억
- **PagerDuty AIOps** 배열+ 배제
- **Incident.io Autopilot** 사건 지휘관 + 조정

### 코드로서의 실행책

런북은 컨플루언스 페이지에서 구조화된 섹션 (증명, 가설, 확인, 행동) 을 가진 버전 마크다운으로 진화합니다. 구조화된 런북은 더 나은 RAG 검색을 공급합니다. 구조화되지 않은 런북을 구조화하여 AI-SRE 임의의 배포를 시작하십시오.

### 기억해야 할 숫자

- MIT 초기 검출: 89%의 정전, 10-15분 리드 타임.
- 다중 에이전트 분류: 감독자 + (토그, 매트릭, 런북) + 인간
- 안전 자동 보완 세트: 포드 다시 시작, 다시 배치, 한계 내에서 확장.
- 반대의 평가: 독립된 두 모델; 합의 = 신뢰.

```figure
i4-incident-agents
```

## 사용 하 고

`code/main.py`복합 에이전트 배열을 시뮬레이션합니다. 로그 에이전트는 오류를 발견하고, 메트릭 에이전트는 CPU 스피크를 발견하고, 런북 에이전트는 알려진 문제와 일치합니다.

## 선박

이 교훈은`outputs/skill-ai-sre-plan.md`현재 통화, 사고 규모, 팀 성숙성 등을 고려하면 AI SRE를 배포할 수 있습니다.

## 운동

1. 달아`code/main.py`만약 기록과 측정 요원이 동의하지 않는다면 어떻게 해소할 수 있을까요?
2. 여러분의 서비스에 대한 3가지 "안전" 자동 보완 조치를 정의하고, 각각의 이유를 설명하세요.
3. 구조화된 런북 템플릿을 작성: 섹션, 필요한 필드, 확인 명령어.
4. 12분 전력으로 발사할 수 있는 예측 감지 장치가 있어요
5. 3인 팀으로 2026년 AI SRE를 도입해야 하는지 아니면 기다려야 하는지 논쟁하세요. 성숙성, 규모, 위험성을 고려하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| AI SRE | "agent for on-call" | LLM-backed incident investigation + coordination |
| Supervisor agent | "the orchestrator" | Top-level agent breaking incidents into sub-queries |
| Specialized agent | "domain agent" | Sub-agent with tool access (logs, metrics, runbooks) |
| Auto-remediation | "AI fixes it" | Narrow pre-approved action; NOT broad re-architecture |
| Operational memory | "vector runbooks" | Post-mortems + runbooks in vector DB for RAG |
| Adversarial eval | "two-model check" | Independent analyses; agreement = confidence |
| NeuBird Hawkeye | "the adversarial one" | Product with adversarial-eval + memory pattern |
| Bits AI | "Datadog's SRE agent" | Datadog-managed AI SRE |
| Pre-incident prediction | "early detection" | 10-15 min lead time on outage prediction |

## 더 많은 읽기

- [incident.io — AI SRE Complete Guide 2026](https://incident.io/blog/what-is-ai-sre-complete-guide-2026)
- [InfoQ — Human-Centred AI for SRE](https://www.infoq.com/news/2026/01/opsworker-ai-sre/)
- [DZone — AI in SRE 2026](https://dzone.com/articles/ai-in-sre-whats-actually-coming-in-2026)
- [Datadog Bits AI](https://www.datadoghq.com/product/bits-ai/)
- [NeuBird Hawkeye](https://www.neubird.ai/)
- [awesome-ai-sre](https://github.com/agamm/awesome-ai-sre)
