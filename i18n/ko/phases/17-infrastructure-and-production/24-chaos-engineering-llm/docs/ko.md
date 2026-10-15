# LLM 생산에 대한 혼란 공학

> LLM에 대한 혼란 공학은 2026년에 자체 학문입니다. 생산 실험을 실행하기 전의 전제 조건: 정의된 SLI/SLO, 추적+메트릭+록 관찰 가능성, 자동으로 돌아가는 것, 런북, 호출. 건축은 4 개의 평면을 가지고 있습니다. 제어 (실험 스케줄러), 목표 (서비스, 인프라, 데이터 저장소), 안전 (보호 + 중단 + 교통 필터), 관찰성 (미트릭스 + 추적 + 로그), 피드백 (SLO 조정). 보호선들은 필수적입니다. 매일 오류 예산 화상을 예상하는 경우 화상률 알림은 실험을 중단합니다. : 주간 작은 카나리 + SLO 검토; 월간 게임 날 + 사후 검사; 분기간 팀 간 탄력감사 + 의존성 지도 LLM에 대한 실험: 메모리 과부하, 네트워크 장애, 공급자 정업, 잘못된 명령, KV 캐시 배제 폭풍 도구: 하네스 카오스 엔지니어링 (LLM에서 파생된 권고, 폭발 반경 축소, MCP 도구 통합); 리트무스 카오스 (CNCF); 카오스 메시 (CNCF 쿠버네티스 원산자).

**Type:** Learn
**Languages:** Python (stdlib, toy chaos experiment runner)
**Prerequisites:** Phase 17 · 23 (SRE for AI), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## 학습 목표

- 5가지 혼란 공학 전제 조건 (SLI/SLO, 관찰 가능성, 반전, 런북, 호출) 을 명명하고, 어떤 것을 건너뛰는 것이 왜 이 관행을 깨는지를 설명하십시오.
- 4개의 평면 (통제, 목표, 안전, 관찰 가능) 과 피드백 루프를 SLO로 그려보세요.
- LLM에 대한 다섯 가지 실험을 나열하십시오 (메모리 과부하, 네트워크 실패, 공급자 중단, 잘못된 명령, KV 퇴출 폭풍).
- 도구를 선택하세요  배너스, 리트무스Chaos, 카오스 메시

## 문제

전통적인 스택에서 혼돈 테스트가 설정됩니다. LLM 스택은 새로운 실패 모드를 추가합니다. 독자적인 문자와 함께 4K 토큰 명령이 토큰을 12 초 동안 정지합니다. 상류 공급업체는 429s; 게이트웨이 재시행; 서비스 OOMs 재시행 증강 동시행성. 폭발 부하 아래 KV 캐시 배척 폭풍은 컴퓨팅을 포화시키는 재시행 캐스케드를 유발합니다.

이 모든 것들은 단위 테스트에서 나타나지 않습니다. 카오스 엔지니어링은 사용자가 발견하기 전에 발견하는 방법입니다.

## 개념

### 전제 조건

생산에서 혼란을 일으키지 말고

1. **SLI/SLO** 서비스 수준 지표와 목표가 정의되었습니다.
2. **Observability** 추적, 측정, 로그, 패시보드에 연결
3. **Automated rollback** 17단계 · 20 정책 플래그 역전
4. **Runbooks** 구조화, 17 · 23 단계
5. **On-call** 응답할 사람이

어떤 수단도 없어서 혼란은 실제 사건으로 변합니다.

### 4개의 비행 + 피드백

**Control plane** 실험 스케줄러 (리트머스 워크플로우, 카오스 메쉬 스케줄, 하네스 UI).

**Target plane** 서비스, 포드, 노드, 로드 밸런서, 데이터 저장소

**Safety plane**                             

**Observability plane** 정상적인 측정값 + 추적-ID 상관관계를 통해 자연적인 실패와 혼란을 구별할 수 있습니다.

**Feedback loop** 성과들은 SLO 조정, 런북 업데이트, 코드 수정 등에 반영된다.

### 경비선도 의무

- **Burn-rate alert**: 하루 오류 예산 연료를 예상 2배 이상으로 하면 중단 실험
- **Suppression windows**: 실험 중 폭발 반경에서 실험하지 않은 경고를 침묵합니다.
- **Trace-ID correlation**: 모든 실험으로 인한 오류는 호출에 따라 추론할 수 있도록 태그를 가지고 있습니다.

### LLM에 대한 5가지 실험

1. **Memory overload** 높은 동시성으로 긴 맥락 요청을 전송함으로써 KV 캐시 선제 폭풍을 강요합니다.

2. **Network failure** 추론 게이트웨이와 공급자 사이의 연결을 끊는다. 관찰: SLA 내에서 재발이 시작되는가? (단계 17 · 19)

3. **Provider outage simulation** OpenAI에서 100% 429을 얻었습니다. 참고: 로우팅이 Anthropic로 오버되는가? (단계 17 · 16, 19)

4. **Malformed prompt** 토케니저 설치용 부하를 주입 (예를 들어, 깊이 둥지를 틀어 놓은 유니코드, 거대한 UTF-8 코드 포인트)

5. **KV eviction storm** vLLM 블록 예산을 포화함으로써 강제 추방. 관찰: LMCache 회복 또는 서비스 악화?

### 

- **Weekly** 작은 카나리 실험, 5%의 프로드
- **Monthly** 특정 시나리오에서 예정된 경기 날; 팀 간 출석; 사후
- **Quarterly** 팀 간 탄력감사; 의존성 지도 업데이트.

### 도구

- **Harness Chaos Engineering** 상업적; 인공지능에서 파생된 실험 권고; 폭발 반지속 축소; MCP 도구 통합.
- **LitmusChaos** CNCF 졸업; Kubernetes 작업 흐름 기반.
- **Chaos Mesh** CNCF 모래 상자; 쿠버네티스 고유의 CRD 스타일.
- **Gremlin** 상업적 지원
- **AWS FIS**- **Azure Chaos Studio** 관리된 클라우드 제공

### 작은 것부터 시작

첫 번째 실험: 안정적인 트래픽에서 한 개의 디코드 복사본을 팟으로 죽이고, 리버팅과 복구 작업을 관찰합니다. 이것이 효과가 있고 안전하다고 보인다면 네트워크 혼란으로 이어집니다.

첫 번째 LLM 실험: 1명의 공급자에게 5분 동안 429개를 주입해 후퇴를 관찰해 보세요. 대부분의 팀은 후퇴의 테스트가 완전히 이루어지지 않았다는 것을 발견합니다.

### 기억해야 할 숫자

- 4개의 비행기: 제어, 목표, 안전, 관찰 가능
- 연소율 휴식: 예상되는 매일 예산 연소 2배
- 수월적인 카나리, 월간 게임 날, 분기적인 감사
- 다섯 개의 LLM 실험: 메모리, 네트워크, 공급자, 잘못된 명령, KV 폭풍.

```figure
i4-chaos-guard
```

## 사용 하 고

`code/main.py`안전선비 게이트를 이용한 3개의 혼돈 실험을 시뮬레이션합니다.

## 선박

이 교훈은`outputs/skill-chaos-plan.md`- 덩어리와 성숙성을 고려하면 첫 3개의 실험과 도구들을 선택합니다.

## 운동

1. 달아`code/main.py`어떤 실험이 화상속도 게이트를 타버리고 왜?
2. vLLM 기반 RAG 서비스의 첫 5 가지 혼란 실험을 설계하고 성공 기준을 포함하십시오.
3. 화상률 경보가 실험을 중단시켰습니다. 원인을 어떻게 결정할까요?
4. 생산에서 혼란이 일어나야 하는지 아니면 단지 무대에 올리는 것인지 논쟁하세요. 생산은 언제 올바른 답일까요?
5. 일반 네트워크 혼란이 재현할 수 없는 LLM 특수한 실패 모드 3개를 명명하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| SLI / SLO | "service targets" | Indicator + objective; required prerequisite |
| Blast radius | "scope" | Set of services / users affected by experiment |
| Burn-rate alert | "budget gate" | Fires when error-budget burn rate > 2x expected |
| Game day | "monthly drill" | Scheduled cross-team chaos exercise |
| LitmusChaos | "CNCF workflow" | Graduated CNCF Kubernetes chaos tool |
| Chaos Mesh | "CNCF CRD" | CNCF sandbox Kubernetes-native chaos |
| Harness CE | "commercial AI-assisted" | Harness chaos with AI recommendations |
| Malformed prompt | "tokenizer bomb" | Input that stalls tokenization |
| KV eviction storm | "preemption cascade" | Mass eviction triggering re-prefills |

## 더 많은 읽기

- [DevSecOps School — Chaos Engineering 2026 Guide](https://devsecopsschool.com/blog/chaos-engineering/)
- [Ankush Sharma — Observability for Large Language Models (Apress, 2026)](https://link.springer.com/book/10.1007/979-8-8688-2827-0)
- [LitmusChaos (CNCF)](https://litmuschaos.io/)
- [Chaos Mesh (CNCF)](https://chaos-mesh.org/)
- [Harness Chaos Engineering](https://www.harness.io/products/chaos-engineering)
- [AWS FIS](https://aws.amazon.com/fis/)
