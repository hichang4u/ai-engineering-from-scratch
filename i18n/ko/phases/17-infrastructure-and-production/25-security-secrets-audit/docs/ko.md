# 보안  비밀, API 키 회전, 감사 로그, 경호

> 중앙 집중식 밸브 (HashiCorp Vault, AWS 비밀 관리자, Azure Key Vault) 를 통해 비밀 퍼포먼스를 제거하십시오. VCS에 있는 env 파일, 스프레드시트 등에 jamais 저장할 수 있는 정적 키에 IAM 역할을 사용; CI/CD에 OIDC를 사용한다. 인공지능 게이트웨이 패턴은 2026 솔루션입니다. 앱 → 게이트웨이 → 모델 공급자, 게이트웨이 실행 시점에 밸브에서 인증서를 끌어들이는 것이 있습니다.                                                                                                                                                                                                                                                                로테이션 정책 ≤90일; 트루플호그/기트 가디언/기트리크스로 각 컴백에 스캔 무신뢰: MFA, SSO, RBAC/ABAC, 단기기 토큰, 장치 자세 PII 스크러핑은 PHI/PII를 전송하기 전에 엔터티 인식을 사용하여 매스킹합니다. 일관된 토큰화 (Mesh 접근) 는 안정적인 위치 보유자에게 민감한 값을 지도하여 LLM는 코드/관계 의미학을 보존합니다. 네트워크 출력: 전용 VPC/VNet 하위 네트워크 백신 목록에서만 LLM 서비스 `api.openai.com``api.anthropic.com`2026 사건 운전자: 위배된 CI/CD 인증서들을 통해 공급망 공격으로 수천 개의 고객 배포를 통해 환경이 분출되었습니다.

**Type:** Learn
**Languages:** Python (stdlib, toy PII-scrubber + audit-log writer)
**Prerequisites:** Phase 17 · 19 (AI Gateways), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## 학습 목표

- 비밀 관리에 대한 네 가지 반 패턴 (VCS에서 구성 파일, 하드코드 된 env, 스프레드시트, 정적 키) 을 나열하고 그 대체의 이름을 지정하십시오.
- 인공지능 게이트웨이 트에서 트 패턴을 2026 생산 표준으로 설명합니다.
- PII 스크러버를 일관된 토큰화 ( 같은 값 → 같은 위치지) 로 구현하여 의미론이 살아남을 수 있습니다.
- 2026년 베르셀 공급망 사건과 CI/CD 자격정지 위생에 대해 무엇을 가르쳐 준다고 명명하세요.

## 문제

인턴이 약속합니다`.env`API 키와 함께. 그들은 그것을 빨리 삭제합니다. 키는 이미 git 역사에 있습니다. GitGuardian 스캔은 그것을 잡습니다. 로테이션 프로세스는 "팀을 느려, 40 개의 구성 파일을 업데이트, 모든 서비스를 재배포합니다". 8 시간 후에, 서비스의 절반이 실시간이고 절반은 창을 배포하는 것을 기다리고 있습니다.

별도로 사용자 명령어에는 "내 SSN는 123-45-6789입니다". 명령어는 OpenAI에 간다. 당신은 BAA를 가지고 있지만 내부 정책은 전송 전에 PII를 마스크하는 것입니다. 당신은하지 않았습니다.

별도로, EKS 클러스터의 LLM 포드는 인터넷 호스트를 찾아낼 수 있습니다. 누군가가 DNS 검색을 통해 데이터를 공격자가 통제하는 도메인으로 전송합니다. 아무것도 그것을 차단하지 않습니다.

보안은 세 가지 요소를 모두 다루어야 합니다. 유물쇠 지원 인증서, PII 스크러핑, 네트워크 출력 필터링, 감사 로그

## 개념

### 중앙 집중된 밸브 + IAM 역할 인력

**Vault**: 하시코어프 밸브, AWS 비밀 관리자, 아저루 키 밸브, GCP 비밀 관리자.

**IAM role**: 앱/게이트웨이는 정적 키가 아닌 IAM 아이덴티티를 통해 인증합니다. Vault은 토큰의 수명 동안 비밀을 반환합니다.

**The AI-gateway pattern**: 게이트웨이 `OPENAI_API_KEY`요청 시점에 엽서에서 회전합니다. 엽서에서 회전합니다. 다음 요청은 새로운 키를 얻습니다. 재배포는 없습니다.

### 회전 정책 90일 ≤

모든 API 키, 밸브 루트 토큰, CI/CD 인증서, 가능한 자동 회전, 수동 회전 기록 및 추적

### 비밀 스캔

- **TruffleHog**                  
- **GitGuardian** 상업적, 높은 정확성.
- **Gitleaks** OSS, CI에서 실행됩니다.

모든 매개체에 가서 새로운 비밀이 발견되면 PR를 차단해

### 무력력 자세

- 모든 계좌에서 MFA가 요구됩니다.
- SSO를 SAML/OIDC를 통해
- 미세 곡물 접근용 RBAC (role-based) 또는 ABAC (attribute-based)
- 단기 토큰 (시간이 아니라 일)
- 장치 자세  디스크 암호화 기능을 가진 corp 장치만

### PII/PHI 스크러핑

이 신호가 당신의 인프라를 떠나기 전에

1. 법인 인정을 (spaCy NER, Presidio, 상업)
2. 마스크와 일치하는 단체는: `"My SSN is 123-45-6789"`→`"My SSN is [SSN_TOKEN_A3F]"`- 그래
3. 일관된 토큰화 (Mesh 접근): 동일한 위치 보유자에게 동일한 가치 지도를 작성하여 LLM는 관계를 유지합니다.
4. LLM 응답을 위한 선택적 역전형 지도

정적 레전스 필터는 기본 패턴을 감지하고 NER는 더 많은 패턴을 감지합니다. 둘 다 사용하세요.

### 입력 + 출력 경비

입력: 알려진 jailbreaks, 금지된 주제, 사용자 당 비율 제한을 차단합니다.

출력: 누출된 비밀 (API 키 패턴, 거부 맥락에서 이메일 패턴), 정책 위반 분류자.

### 네트워크 출력 백명 목록

전용 하위 네트워크에서 LLM 서비스:
- 백색 목록:`api.openai.com``api.anthropic.com`, 벡터 DB 최종점, 밸브 최종점
- 다른 모든 것: 떨어뜨리
- DNS를 허용자 목록에서만 해결하는 (DNS 터널을 제거하는 것을 피하십시오).

### 감사 기록

LLM 통화마다 변경되지 않는 기록:
- 시간표
- 사용자/임대자
- 프롬프트 해시 (자생활 보호에 대한 원료 프롬프트)
- 모델 + 버전
- 토큰이 니다
- 비용
- 반응 해시
- 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비 경비

규제 요구 사항에 따라 유지 (SOC 2 1 년, HIPAA 6 년)

### 2026년 베르셀 사건

공급망 공격: 손상된 CI/CD 인증서들은 수천 개의 고객 배포에서 환경을 배열했습니다. 교훈: CI/CD 인증서들은 프로드-비정형입니다. 밸브에 저장합니다. 범위가 좁습니다. 공격적으로 회전합니다.

### 기억해야 할 숫자

- 회전 정책: ≤ 90일
- 모든 컴백을 스캔하세요: 트루플호그 / 기타가디언 / 기타릭스
- 2026년: CI/CD 신용이 손상된
- 감사 기록 보관: SOC 2 = 1년, HIPAA = 6년.

```figure
i4-vault-rotation
```

## 사용 하 고

`code/main.py`일관된 토큰화와 첨부물만을 위한 감사 로그를 갖춘 장난감 PII 스크러버를 구현합니다.

## 선박

이 교훈은`outputs/skill-llm-security-plan.md`규제 범위와 현 상태를 고려하면, 유물고기 이동, 스크러버, 출구, 감사 로그를 계획합니다.

## 운동

1. 달아`code/main.py`같은 SSN를 참조하는 두 개의 명령어를 보내서 두 개의 위치번호를 확인해 주세요
2. OpenAI + Anthropic + Weaviate라는 vLLM-on-EKS 배포에 대한 네트워크 출력 정책을 설계하십시오.
3. 키를 발견하면 2살이 되는 키가 있습니다. 올바른 답은 무엇일까요? 키를 돌거나, 스크러브한 역사를 구부러거나, 둘 다? 정당화하세요.
4. 감사 기록은 하루에 10GB가 증가합니다. 디자인 유지 수준 (열 30d, 따뜻한 12mo, 차가운 6year).
5. 역전화 토큰화 (실적 값을 다시 LLM 응답으로 대체) 는 위치 보유자를 가시적으로 유지하는 것과 비교하여 복잡성에 가치가 있는지 여부를 주장합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Vault | "secrets store" | Centralized credential management service |
| IAM role | "identity-based auth" | Role assumed by app; returns short-lived creds |
| OIDC for CI/CD | "cloud-issued tokens" | No static keys in CI — identity via OIDC |
| TruffleHog / GitGuardian / Gitleaks | "secret scanners" | Commit-time secret detection |
| RBAC / ABAC | "access control" | Role-based vs attribute-based |
| PII scrubbing | "data masking" | Remove or tokenize sensitive entities |
| Consistent tokenization | "stable placeholders" | Same value → same token each time |
| Mesh approach | "Mesh tokenization" | Semantic-preserving tokenization pattern |
| Egress whitelist | "outbound allowlist" | Only permitted domains reachable |
| Audit log | "immutable history" | Append-only record for compliance |

## 더 많은 읽기

- [Doppler — Advanced LLM Security](https://www.doppler.com/blog/advanced-llm-security)
- [Portkey — Manage LLM API keys with secret references](https://portkey.ai/blog/secret-references-ai-api-key-management/)
- [Datadog — LLM Guardrails Best Practices](https://www.datadoghq.com/blog/llm-guardrails-best-practices/)
- [JumpServer — Secrets Management Best Practices 2026](https://www.jumpserver.com/blog/secret-management-best-practices-2026)
- [Microsoft Presidio](https://github.com/microsoft/presidio) PII 검출 및 익명화
- [HashiCorp Vault docs](https://developer.hashicorp.com/vault/docs)
