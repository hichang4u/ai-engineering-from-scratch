# 평가 및 조정 기준

> 2025~2026년 기준 5개는 다중기관 평가 공간을 대상으로 한다. **MultiAgentBench / MARBLE**(ACL 2025, arXiv:2503.01935) 은 별/사슬/나무/그래프 토폴로지를 중요한 KPI로 평가한다. **graph is best for research**, 인지 계획은 ~3%의 미적 성과를 추가합니다. **COMMA**무형 무대 정보 조정; GPT-4o를 포함한 최첨단 모델은 무작위 기본선을 이길 수 있습니다. **MedAgentBoard**(arXiv:2505.12371) 는 네 가지 의료 작업 범주를 다루고 있으며 종종 멀티 에이전트가 단일 LLM에 지배적이지 않다는 것을 발견합니다. **AgentArch**(arXiv:2509.10769) 는 도구 사용 + 메모리 + 오케스트레이션을 결합하는 기업 에이전트 아키텍처를 기준으로 한다. **SWE-bench Pro**([arXiv:2509.16941](https://arxiv.org/abs/2509.16941)(주) 래포 (주) 는 비즈니스 앱, B2B 서비스 및 개발자 도구 등 41개의 리포 (repos) 에서 1865개의 문제를 가지고 있다. 프론티어 모델은 프로에서 ~23%를 기록하고, 검증된에서 70%+를 기록한다.**64.3%**프로와 관련해서 명시적인 에이전트 팀 조정 (Anthropic 원본이 아직 공개되지 않았다)**76.1% pass@1**확인된 ([Verdent technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report) ).**AAAI 2026 Bridge Program WMAC**(https://multiagents.org/2026/이 수업은 MARBLE의 매트릭을 기반으로 토폴로지-메트릭 스웨이프를 진행하고 "SWE 벤치 검증은 일반화 증거가 아닙니다"라는 규칙을 니다.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 15 (Voting and Debate Topology), Phase 16 · 23 (Failure Modes)
**Time:** ~75 minutes

## 문제

논문에서 "우리 다중 에이전트 시스템은 더 낫다"고 주장할 때, 질문은: 무엇보다 더 낫다, 무엇에 의해 어떻게 측정됩니다? 2023-2024 년 다중 에이전트 평가 시대는 혼란이었습니다.

공유 벤치마크 없이 두 개의 멀티 에이전트 시스템을 의미있게 비교할 수 없습니다. 더 나쁜 것은, 지연 벤치마크 없이, 국경 모델이 오염될 수 있습니다. SWE 벤치 검증은 2025 년 중반에 훈련 코퍼시스에서 부분적으로 오염되었습니다. 국경 점수는 부풀어 났으며, Pro는 오염되지 않은 현실 검사를 위해 설계되었습니다.

이 교훈은 2026년 기준에 대한 다섯 가지 규범을 나열하고, 각각의 기준을 명명하고, 기준을 의심스럽게 읽도록 가르칩니다.

## 개념

### 멀티 에이전트 벤치 (MARBLE)  ACL 2025

arXiv:2503.01935. 연구, 코딩 및 계획 작업에 대한 네 개의 조정 토폴로지 (별, 체인, 트리, 그래프) 를 평가합니다. 마일스톤 기반 KPI는 최종 성공보다는 부분적인 발전을 추적합니다.

측정된 결과:

- **Graph**연구 시나리오에 가장 적합한 토폴로지; 어떤 비판도 지원합니다.
- **Chain**단계적 정제 코딩을 위해 가장 좋습니다.
- **Star**신속한 사실적 통합을 위한 가장 좋은 방법
- **Coordination tax**그래프에서 4 대의 이상으로 나타납니다.
- **Cognitive planning**토폴로지에서 3%의 랜드마크 성과를 추가합니다.

만약 당신이 조정 토폴로지를 사과에서 사과에 비교하고 싶다면 사용한다.https://github.com/ulab-uiuc/MARBLE) 는 평가자에게 제공된다.

### COMMA  다중형 비대칭 정보

 (GPT-4o) 를 포함한 국경 모델들이  (GPT-4o) 를  (GPT-4o) 를  (GPT-4o) 를  (GPT-4o) 를  (GPT-4o) 를  (GPT-4o) 를  (GPT-4o) 를  (GPT-4o) 는  (GPT-4o) 를  (GPT-4o) 를  (GPT-4o) 를  (GPT-4o) 으로  (GPT-4o) 를  (GPT-4o) 으로  (GPT-4o) 를  (GPT-4o) 으로  (GPT-4o) 를  (GPT-4o) 으로  (GPT-4o) 를  (GPT-4o) 으로  (GPT-4o) 를  (GPT-4o) 으로  (GPT-4o) 를  (GPT-4o) 으로  (GPT-4o) 를  (GPT-4o) 으로  (GPT-4o) 를  (GPT-4o)  (GPT-4o) 는  (GPT-4o) 를  (GPT) (GPT) (GPT)**random baseline**COMMA에서 에이전트- 에이전트 협력을 위한 신호는 다중 에이전트 모다리얼이 미흡한 훈련과 미흡한 평가에 있다는 것입니다

사용: 시스템에는 멀티모달 또는 비대칭 정보 조정이 있습니다. COMMA의 무효 결과는 청구하기 전에 측정해야 하는 경고입니다.

### MedAgentBoard  도메인 스트레스 테스트

arXiv:2505.12371. 진단, 치료 계획, 보고서 생성, 환자 통신. 다중 요원 vs 단일 LLM vs 전통적인 규칙 기반 시스템 비교.

발견: 다중 에이전트 (Multi-agent) 은 대부분의 범주에서 단일 LLM (Single LLM) 를 지배하지 않습니다. 다중 에이전트 (Multi-agent) 의 장점은 좁습니다.  과제 분해는 하위 과제들이 명확하게 분리될 때 도움이 됩니다 (감사 + 치료); 조정 오버하드 (coordination overhead) 는 전문성 향상을 초과할 때 고통스럽습니다 (보고 생성).

언제 사용해야 하는지: 귀하의 도메인은 명확한 단일 LLM 기본 라인을 가지고 있습니다. MedAgentBoard의 수업이 일반화되면, 많은 제안된 멀티 에이전트 시스템은 과도하게 설계됩니다.

### AgentArch  기업 건축물

arXiv:2509.10769. 도구 사용, 메모리 및 오케스트레이션이 서로 층화 된 엔터프라이즈 설정. 벤치마크는 각 레이어의 기여를 분리합니다. 도구 추가는 얼마나 도움이 될까요? 메모리를 추가합니까? 다중 에이전트 오케스트레이션을 추가합니까?

엔터프라이즈 에이전트 스택을 설계하고 각 계층을 정당화해야 할 때 사용하십시오.

### SWE 벤치 프로  실체 검진

arXiv:2509.16941. 비즈니스 앱, B2B 서비스 및 개발자 도구에 걸쳐 41개의 저장소에서 1865 문제.**uncontaminated**후속 훈련 중단으로 Frontier 모델은 Pro에서 23%를 기록하고 Verified에서 70%를 기록합니다.

2026년 4월 점수:
- 프로에 있는 클로드 오퍼스 4.7: **64.3%**(표시적 요인 팀 조정으로 보고된; 아직까지 Anthropic의 주요 자료가 발표되지 않은 상태)
- 검증된 에르덴트 (원재판)**76.1% pass@1**([technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report))
- 에이전트 스카프도 없이 프로에 대한 경계 순위 점수는 ~23-35% ([SWE-bench Pro paper](https://arxiv.org/abs/2509.16941))

"우리는 SWE 벤치 검증된 것을 이길 수 있다"는 것은 더 이상 능력의 증거가 아니다. 프로는 현재 게이팅 테스트이다. 에이전트-팀 스카프롤딩은 프로 (~30-40 포인트 델타) 에 측정 가능한 이득을 만들어냅니다. 이는 2026 년 다중 에이전트 조정에 대한 가장 강력한 경험적 주장 중 하나입니다.

### AAAI 2026 WMAC

AAAI 2026 브릿지 프로그램  다중 에이전트 조정 워크샵https://multiagents.org/2026/) 2026 년 다중 에이전트 인공지능 연구 지역 사회 중점. 승인 된 논문 및 워크샵 절차는 새로운 방법을 평가하는 가전적 장소입니다. 생산 결정에 대한 arXiv 사전 인쇄물에 대한 WMAC가 승인 한 주장에 미루어 놓습니다.

###  2026 체크리스트

누군가가 다중 에이전트 결과로 주장할 때

1. **Which benchmark, which split?**SWE 벤치에서 확인된 대 프로는 중요해요 잘못된 분할에 대한 보고는 쓸모가 없습니다
2. **Contamination check.**모델의 훈련 중단 후 기준이 공개되었나요? 그렇지 않다면 조심스럽게 처리하세요.
3. **Baseline comparison.**단일 LLM 기본, 무작위, 이전 멀티 에이전트 작업에 대한
4. **Statistical significance.**N 테스트, p 값, 신뢰 간격. 경계 모델은 높은 변동; 단일 실행은 잘못된.
5. **Task diversity.**하나의 작업이 아니면 많은 작업이? 일반화는 생산에 중요합니다.
6. **Cost disclosure.**작업당 토큰, 벽 시계 90%의 해답은 20배가 되는 비용으로 비즈니스 결정이 되고, 능력 주장이 아닙니다.

### 어떤 기준도 잘 측정하지 않는

- **Long-horizon coordination.**벽과 시계 상호작용의 일일이 지나고 현재 기준이 부족해
- **Adversarial resilience.**한 명의 에이전트가 악의적이거나 타협적이면 어떻게 될까요?
- **Drift under deployment.**벤치마크는 정적이고 생산 분포는 바뀐다.
- **Cost-normalized performance.**대부분의 기준은 원자력 정확성을 나타냅니다. 달러당 정확도가 아닙니다.

여러분이 정말로 관심 있는 축에 대한 내부 기준을 만드는 것은 종종 올바른 움직임입니다.

```figure
a5-bench-gap
```

## 건설 해

`code/main.py`상호작용적이지 않은 워크-포스:

- 장난감 작업에서 3개의 멀티 에이전트 시스템을 시뮬레이션합니다.
- 각 마블 스타일의 랜드 스톤 매트릭을 계산합니다.
- "훈련" 세트에서 작업을 기각함으로써 오염 검사를 수행합니다.
- 은 무작위 기준과 비교합니다.
- 기준상 청구 점수 카드를 인쇄합니다.

실행:

```bash
python3 code/main.py
```

예상 출력: 원시 정확성, 미주기 성취, 비용당 작업, 무작위 기본 기준 델타와 오염 검사 메모의 시스템 점수카드.

## 사용 하 고

`outputs/skill-benchmark-reader.md`여러 대리자 기준 청구서를 읽고 검사 체크리스트를 적용합니다. 출력: 평점 및 경고.

## 선박

생산 평가 규범:

- **Build an internal benchmark**공공 기준은 정보를 제공하지만 대체하지 않습니다.
- **Include a random baseline**만약 당신이 조정 작업에서 큰 차이로 무작위로 이길 수 없다면, 작업은 잘못 설정될 수 있습니다.
- **Report cost alongside accuracy.**토큰 비용과 벽 시계, 두 가지 모두 필요한데
- **Rebuild the benchmark quarterly.**생산 분포의 전환, 고전된 기준은 잘못된 것이다.
- **Avoid published-benchmark overfitting.**만약 당신의 팀이 SWE 벤치 프로 번호를 위해 특별히 최적화한다면, 당신은 생산에 회귀할 것입니다.

## 운동

1. 달아`code/main.py`세 가지 시뮬레이션 시스템 중 어느 시스템이 가장 높은 성능과 일치하는지 확인합니다.
2. 다중 에이전트 벤치 (arXiv:2503.01935) 를 읽어 보세요. 자신의 작업 영역에 대해, MARBLE가 추천하는 네 가지 토폴로지 중 어느 쪽을 결정하세요. 논문의 결과를 근거로 설명하세요.
3. SWE 벤치 프로 논문을 읽어 보세요. 구체적으로 오염에 저항하는 것이 무엇일까요? 같은 기술을 다른 기준에 적용할 수 있을까요?
4. 복합모달 조정에 관한 COMMA의 연구 결과를 읽어 보세요. 내부 벤치마크에 추가할 수 있는 간단한 복합모달 조정 작업을 설계하세요. 유용한 신호로 어떤 것이 간주될까요?
5. 최근 한 종합 에이전트 논문의 제목 결과 에 기준점 청구 점검 목록 을 적용 하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MARBLE | "MultiAgentBench" | ACL 2025; star/chain/tree/graph topologies with milestone KPIs. |
| COMMA | "Multimodal benchmark" | Multimodal asymmetric-info coordination; frontier models struggle vs random. |
| MedAgentBoard | "Domain stress test" | Four medical categories; often finds multi-agent does not dominate single-LLM. |
| AgentArch | "Enterprise benchmark" | Tools + memory + orchestration layered. |
| SWE-bench Pro | "Contamination-resistant" | 1865 problems, 41 repos; ~23% vs 70%+ on Verified (the contamination signal). |
| Milestone achievement | "Partial credit" | Benchmarks that reward progress, not only final success. |
| Contamination | "Benchmark leaked into training" | Post-release, benchmarks drift into training corpora; scores inflate. |
| WMAC | "AAAI 2026 Bridge Program" | Workshop on Multi-Agent Coordination; community focal point. |

## 더 많은 읽기

- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935)  랜드 스톤 KPIs를 가진 토폴로지 벤치마크
- [MARBLE repository](https://github.com/ulab-uiuc/MARBLE) 참조 실행
- [MedAgentBoard](https://arxiv.org/abs/2505.12371) 영역 스트레스 테스트; 다중 요인이 주위를 차지하지 않는 경우
- [AgentArch](https://arxiv.org/abs/2509.10769) 기업 에이전트 아키텍처
- [SWE-bench leaderboards](https://www.swebench.com/) 국경 모델에 대한 검증 및 프로 점수
- [AAAI 2026 WMAC](https://multiagents.org/2026/)2026년 지역사회 중심지
