# 캡스톤 06  쿠버네티스 DevOps 문제 해결 에이전트

> AWS의 DevOps 에이전트는 GA가 되었고, Resolve AI는 K8s 플레이북을 발표했고, NeuBird는 의미적 모니터링을 시범적으로 실시했고, Metoro는 AI SRE를 서비스 દીઠ SLOs에 연결했습니다. 생산 형태는 정해져 있습니다. 경고 웹 이 발사하고, 에이전트가 텔레메트리를 읽고, K8s 객체의 그래프를 걸어, 근본 원인 가설을 순위화하고, 승인 버튼을 가진 Slack 브리프를 게시합니다. 기본적으로 읽기 전용 인간에 의해 보호된 모든 치료제 이 돌은 20개의 합성 사건에 의해 평가된 그 에이전트입니다. 그리고 3개의 공유된 사건에 대해 AWS의 에이전트와 비교했습니다.

**Type:** Capstone
**Languages:** Python (agent), TypeScript (Slack integration)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools and MCP), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P11 · P13 · P14 · P15 · P17 · P18
**Time:** 30 hours

## 문제

2025~2026 SRE 서사지는 "AI 에이전트들은 사고를 배열하고, 인간은 치료법을 승인한다". AWS DevOps 에이전트, Resolve AI, NeuBird, Metoro, PagerDuty AIOps 모두 이 모양을 생산에 내놓는다. 에이전트는 프로메테우스 매트릭, 로키 로그, 템포 추적, kube-state-메트릭, 그리고 K8의 객체의 지식 그래프를 읽습니다. 5분 이내에 텔레메트리 인용으로 ρίζ의 원인 가설을 순위적으로 생성합니다. 스랙을 통해 인간의 명시적인 승인 없이 파괴적인 명령을 실행하지 않습니다.

대부분의 작업은 스코핑과 안전에 관한 것입니다. 논리하는 것이 아닙니다. 에이전트는 기본으로 읽기 전용 RBAC 표면, 단단한 MCP 도구 서버 및 실행되는 모든 명령에 대한 감사 로그가 필요합니다. 그것은 깊이와 격화에서 벗어나는 것을 알아야합니다. 그리고 OOM-kill 캐스케이드가 5k 에이전트 청구서를 생성하지 않을 정도로 저렴하게 실행해야합니다.

## 개념

에이전트는 지식 그래프에 따라 작동한다. 노드는 K8s 객체 (Pod, 배포, 서비스, 노드, HPA, PVC) 과 텔레메트리 소스 (프로메테우스 시리즈, 로키 스트림, 템포 추적) 이다. 가장자리는 소유권을 (Pod -> ReplicaSet -> 배포), 스케줄링 (Pod -> 노드) 및 관찰 (Pod -> Prometheus 시리즈) 를 코딩한다. 그래프는 kube-state-metrics 동기화로 신선하게 유지되며 각 알림에 다시 샘플링됩니다.

알림이 발사되면, 에이전트는 영향을 받은 객체에서 뿌리를 내리게 됩니다. 그것은 가장자리를 걷고, 관련 텔레메트리 슬라이드를 끌어내고 (최후 15 분) 가설을 작성합니다. 가설은 증거에 의해 순위됩니다. 얼마나 많은 텔레메트리 인용이 그것을 지원하는지, 얼마나 최근의지, 얼마나 구체적지. 3개의 가설은 그래프 경로 시각화와 복구 작업에 대한 승인 버튼으로 Slack에 간다.

수정은 게이트됩니다. 허용 된 기본 동작은 읽기 전용입니다. 파괴적인 동작 (저용, 다시 굴러, 팟을 삭제) 은 Slack 승인이 필요합니다. ArgoCD 롤백 은 에이전트가 절대 보유하지 않는 auth 토큰이 필요합니다. 감사 로그는 에이전트가 * 고려 * 를 실행하는 모든 명령을 기록합니다. 따라서 검토 프로세스는 거의 놓친 것을 잡습니다.

## 건축

```
PagerDuty / Alertmanager webhook
           |
           v
     FastAPI receiver
           |
           v
   LangGraph root-cause agent
           |
           +---- read-only MCP tools ----+
           |                             |
           v                             v
   K8s knowledge graph              telemetry slices
     (Neo4j / kuzu)              Prometheus, Loki, Tempo
   ownership + scheduling          last 15m, scoped
           |
           v
   hypothesis ranking (evidence weight)
           |
           v
   Slack brief + approval buttons
           |
           v (approved)
   ArgoCD rollback hook / PagerDuty escalate
           |
           v
   audit log: considered vs executed, every command
```

## 

- 관찰 가능성 원천: 프로메테우스, 로키, 템포, kube-state-metrics
- 지식 그래프: K8s 객체의 Neo4j (관리) 또는 kuzu (베드) + 텔레메트리 가장자리
- 대리자: 랭그라프, 도구별 허용 목록, 기본적으로 읽기 전용
- 도구 운송: 스트리메블HTTP를 통해 FastMCP; 승인 게이트 뒤에 파괴적인 도구에 대한 별도의 서버
- 모델: 클로드 소넷 4.7 로트 원인에 대한 추론, 트메니 2.5 플래시 로그 요약
- 수리: ArgoCD 롤백 웹 , PagerDuty 에스컬레이션, Slack 승인 카드
- 감사: 추가로 구성된 기록 (검정, 실행, 승인, 결과)
- 배포: K8s 배포, 자체 좁은 RBAC 역할; 별도의 이름 공간

```figure
ce-rootcause-walk
```

## 건설 해

1. **Graph ingestion.**30 년마다 Neo4j/kuzu에 kube-state-metrics를 동기화하십시오. 노드: Pod, Deployment, Node, Service, PVC, HPA. 가장자리: OWNED_BY, SCHEDULED_ON, EXPOSES, MOUNTS, SCALES. 텔레메트리 덮개 가장자리: OBSERVED_BY (pod는 Prometheus 시리즈로 관찰됩니다).

2. **Alert receiver.**PagerDuty 또는 Alertmanager 웹 을 수용하는 FastAPI 엔드포인트. 영향을 받은 객체 (s) 과 SLO 위반을 추출합니다.

3. **Read-only tool surface.**Wrap kubectl, Prometheus query, Loki logql, Tempo traceql를 FastMCP를 통해 사용한다. 모든 도구는 좁은 RBAC 동사 ("Get", "list", "describe") 를 가지고 있다. 기본 서버에서 "delete", "exec", "scale"는 없습니다.

4. **Root-cause agent.**3개의 노드로 랜그그래프`sample`지난 15분 동안의 텔레메트리 조각을 끌어내죠.`walk`이웃 물체를 위한 그래프를 검색합니다.`hypothesize`원인을 가진 후보자를 예시로 분류한 초안

5. **Evidence scoring.**각 가설은 점수를 = 최근성 * 특수성 * 그래프 경로 길이가 역대 * 인용수수를 가지고 있습니다. 상위 3을 반환합니다.

6. **Slack brief.**가설, 그래프 경로 시각화 (서버 측으로 렌더링된 서브 그래프 이미지) 및 최소 한 번의 복구 작업에 대한 승인 버튼을 첨부하십시오.

7. **Remediation gate.**파괴적인 도구 (중소화, 반부름, 삭제) 는 승인 토큰 뒤에 있는 두 번째 MCP 서버에서 사용된다. 에이전트는 스랙 카드가 인간으로부터 승인된 후에야 호출할 수 있다.

8. **Audit log.**추가만 JSONL: 각 지원 명령에 대해, 그것이 고려되었는지, 실행되었는지, 누가 승인했는지 기록하십시오. 매일 S3에 전송하십시오.

9. **Synthetic incident suite.**20가지 시나리오를 구성하세요: OOMKill 캐스카드, DNS 플랩, HPA 스러시, PVC 필, 노이즈 이웃, 결함형 사이드카, 잘못된 ConfigMap 롤러웃, 인증서 회전, 이미지  백코프 등. 근본 원인에 대한 정확성과 시점-기설에 대한 에이전트를 점수하세요.

## 사용 하 고

```
webhook: alert.pagerduty.com -> checkout-api SLO breach, error rate 14%
[graph]   affected: Deployment checkout-api (3 Pods, Node ip-10-2-3-4)
[walk]    neighbors: ReplicaSet checkout-api-abc, Service checkout-api,
           recent rollout 14m ago
[sample]  prometheus error_rate 14%, up-trend; loki 500s on /api/v2/pay
[hypo]    #1 bad rollout: latest image checkout-api:v2.41 fails /healthz
          citations: deploy.yaml (rev 42), prometheus errorRate, loki 500 stack
[slack]   [ROLL BACK to v2.40]  [ESCALATE]  [IGNORE]
          (approval required; agent does not roll back unilaterally)
```

## 선박

`outputs/skill-devops-agent.md`K8s 클러스터와 경고 소스를 고려하면, 에이전트는 순위화된 근본 원인 가설과 Slack-gated 복구 흐름을 생성합니다.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | RCA accuracy on scenario suite | ≥80% correct root cause across 20 synthetic incidents |
| 20 | Safety | Destructive-action guard never fires without Slack approval in the audit log |
| 20 | Time-to-hypothesis | p50 under 5 minutes from alert to Slack brief |
| 20 | Explainability | Every hypothesis has graph paths and telemetry citations |
| 15 | Integration completeness | PagerDuty, Slack, ArgoCD, Prometheus end-to-end working |
| **100** | | |

## 운동

1. 네 에이전트를 같은 3번의 사건에 따라 실행해 주자 AWS의 DevOps 에이전트가 데모를 하고 있는 것

2. 에이전트가 승인 없이 파괴적이라고 생각했던 모든 명령을 표시하는 "가루가 빠질 것" 감사를 추가하십시오.

3. 클로드 소넷 4.7에서 자체 주최된 Llama 3.3 70B로 가설 모델을 교환합니다.

4. 원인 필터를 구축: 상관관계된 텔레메트리 스파이크를 실제 원인으로부터 구별하고 20 시나리오 라벨에 작은 분류자를 훈련시킵니다.

5. 드라이런으로 롤백을 추가: 동일한 매니프트를 가진 스테이지링 클러스터에 대한 ArgoCD 롤백. Slack 승인 버튼을 눌러 실시간 클러스터에서 롤백 계획을 확인하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| K8s knowledge graph | "Cluster graph" | Nodes = K8s objects + telemetry series; edges = ownership, scheduling, observation |
| Read-only-by-default | "Scoped RBAC" | Agent's service account has only get/list/describe verbs; destructive verbs live in a separate server behind approval |
| Audit log | "Considered vs executed" | Append-only record of every candidate command, whether it ran, who approved |
| Hypothesis ranking | "Evidence score" | Recency × specificity × graph-path length inverse × citation count |
| Slack approval card | "HITL gate" | Interactive Slack message with remediation buttons; agent cannot proceed until a human clicks |
| Telemetry citation | "Evidence pointer" | A Prometheus query, Loki selector, or Tempo trace URL that supports a claim |
| MTTR | "Time to resolution" | Wall-clock from alert fire to SLO recovery |

## 더 많은 읽기

- [AWS DevOps Agent GA](https://aws.amazon.com/blogs/aws/aws-devops-agent-helps-you-accelerate-incident-response-and-improve-system-reliability-preview/) 2026년 신성 참조
- [Resolve AI K8s troubleshooting](https://resolve.ai/blog/kubernetes-troubleshooting-in-resolve-ai) 경쟁자 참조
- [NeuBird semantic monitoring](https://www.neubird.ai) 의미 그래프 접근법
- [Metoro AI SRE](https://metoro.io) SLO-첫 생산 프레임
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) 클러스터 상태 출처
- [LangGraph](https://langchain-ai.github.io/langgraph/) 참조 대리인 오케스트레이터
- [FastMCP](https://github.com/jlowin/fastmcp) 파이썬 MCP 서버 프레임워크
- [ArgoCD rollback](https://argo-cd.readthedocs.io/en/stable/user-guide/commands/argocd_app_rollback/) 폐쇄된 복원 목표
