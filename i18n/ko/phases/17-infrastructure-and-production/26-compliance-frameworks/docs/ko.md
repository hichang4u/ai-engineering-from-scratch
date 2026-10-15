# 준수  SOC 2, HIPAA, GDPR, PCI-DSS, EU AI 법, ISO 42001

> 다방면 포괄은 2026 년 기업 거래에 대한 테이블 스테이크입니다. **EU AI Act**이 법은 2026년 8월 2일부터 시행되고 있습니다. 고위험 시스템 의무에 대해 15억 유로 또는 3%의 전 세계 연간 매출액까지 벌금 (조 99  4); 금지된 인공지능 행위에 대해 35억 유로 또는 7%까지 (조 99  3)).**Colorado AI Act**: 2026년 6월 30일부터 시행 (2026년 2월부터 SB25B-004에 의해 연기)**SOC 2 Type II**: 사실 B2B AI 요구 (Fintech에 대한 II 유형이 아니라 I 유형이 아닙니다). **GDPR**: 가장 큰 문서화된 AI 특정 벌금은 클리어뷰 AI에 대한 €30.5M (네덜란드 DPA, 2024년 9월) 이다. 이탈리아의 가란테는 2024년 12월 OpenAI에 대한 €15M (이후 2026년 3월 항소심에서 취소) 를 발행했다. 추론에 따라 실시간 PII 편집은 방어 가능한 표준입니다.**HIPAA**: 의료부문  BAA 없이 외부 AI 서비스에 PHI를 보낼 수 없습니다. **PCI-DSS**: 인공지능 상호작용 계층의 커버링은 자동적이지 않고 구성 + 계약 협정을 필요로 합니다. **ISO 42001**: 신흥 AI 지배 표준, ISO 27001와 함께 구매 요구 사항이 증가하고 있습니다. 참고 프로필: OpenAI는 SOC 2 타입 2, ISO/IEC 27001:2022, ISO/IEC 27701:2019, GDPR/CCPA/HIPAA (BAA) / FERPA, ChatGPT 결제 구성 요소에 대한 PCI-DSS를 유지합니다. 크로스 프레임워크 지도는 감사 피로를 감소시킵니다.

**Type:** Learn
**Languages:** (Python optional — compliance is policy + process, not code)
**Prerequisites:** Phase 17 · 25 (Security), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## 학습 목표

- LLM 제품들에 관한 7개의 2026 프레임워크를 나열하고 각 분야와 고객분야에 일치한다.
- EU AI 법 시행 시계를 인용하십시오 (2024년 8월, 2026년 8월, 고위험 집행) 그리고 두 단계의 벌금 제한 (고위험 의무에 대한 €15M / 3%, 금지 행위에 대한 €35M / 7%).
- 왜 PII 처리 후 청소가 GDPR에 충분하지 않은지 설명하고 실시간 추론 계층 편집을 방어 가능한 표준으로 지정하십시오.
- 크로스 프레임워크 제어 지도를 설명하십시오 (예를 들어, ISO 27001 A.5.15-5.18 + GDPR Art. 32 + HIPAA §164.312 ((a)) 에 대한 액세스 제어 지도).

## 문제

기업 고객 구매는 SOC 2 타입 II, GDPR, HIPAA BAA, ISO 27001 및 "EU AI 법 준수 선언"을 요구합니다.

다중 프레임워크 커버리는 LLM 문제가 아닙니다. 그것은 LLM 특정 초복으로 기업-SaaS 문제입니다. 2026 년 인수 팀은 PDF가 아닌 프레임워크에 대한 행렬과 제어에 대한 열이있는 매트릭스를 원합니다.

## 개념

### 7개의 틀

| Framework | Scope | LLM-specific requirement |
|-----------|-------|--------------------------|
| SOC 2 Type II | B2B SaaS baseline | Process controls audited over 6-12 months |
| HIPAA | US healthcare | BAA required; PHI cannot leave infrastructure without signed agreement |
| GDPR | EU users | Real-time PII redaction; data subject rights; Article 30 records |
| PCI-DSS | Payment data | Configuration + contracts for AI touching payment |
| EU AI Act | Serving EU users | Risk tier classification; high-risk systems: conformity assessment, documentation, logging |
| Colorado AI Act | Serving CO residents | Impact assessments; right to appeal |
| ISO 42001 | AI governance | Emerging; pairs with ISO 27001 |

### EU AI 법의 시간표

- 2024년 8월 1일: 효력이 있습니다.
- 2025년 2월 2일: AI의 금지된 관행이 시행된다.
- 2026년 8월 2일: 고위험 시스템 시행 (일반성 평가, 문서화, 기록)
- 2027년 8월: 조화된 법령에 따라 제품 내의 고위험 시스템

위험 계층: 허용되지 않는 (금지), 높은 위험 (일치성 + 기록), 제한된 위험 (투명성), 최소 위험 (제약 없음). 대부분의 B2B LLM SaaS는 제한된 위험; 고용, 신용, 교육, 법 집행, 이주, 필수 서비스에서 높은 위험의 발발.

벌금 (제99): 고위험 시스템 의 의무 위반 에 대해 최대 €15M 또는 3%의 전 세계 연간 매출 (제99조 4); 금지 된 AI 행태 에 대해 최대 €35M 또는 7% (제99조 3)); 어느 정도 더 높게 적용되는지.

### GDPR  실시간 편집은 표준입니다

처리 후 청소 (LLM가 보고 나서 PII를 수정) 는 방어할 수 있는 자세가 아닙니다. 모델은 이미 데이터를 보았습니다. 실시간 추론 계층 편집은 2026 표준입니다:

- LLM 초청 전에 법인 인정을
- 일관된 토큰화 (메쉬 접근법) 는 의미론을 보존합니다.
- 편집된 명령어만 저장하고 + 동의한 오프타인 크라우드

최근 시행: 클리어뷰 AI에 대한 30.5M 유로 (네덜란드 DPA, 2024년 9월) 는 지금까지 가장 큰 문서화된 AI-특정 GDPR 벌금이며, 오픈AI에 대한 15M 유로 (이탈리아의 Garante, 2024년 12월) 는 LLM-특정 벌금이지만, 2026년 3월 항소심에서 취소되었으며, 판결은 추가 검토 중입니다.

### HIPAA  BAA는 선택 사항이 아닙니다

서명된 비즈니스 협회자 협약 없이는 외부 AI 서비스에 PHI를 보낼 수 없습니다. 세 개의 하이퍼스칼러 LLM 플랫폼 (베드록, 아조어 오픈AI, 베르텍스) 모두 BAA를 제공합니다. 오픈AI 직접 API는 BAA를 제공합니다. 인류 직접 API는 BAA를 제공합니다. PHI를 전송하기 전에 확인합니다.

### SOC 2 II 유형

타입 I: 설계 및 문서화 된 제어 장치
유형 II: 6-12개월 동안 제어 장치가 효과적으로 작동합니다.

2026년 B2B 조달은 II형에 부합합니다. I형은 시팅터이고 II형은 게이트입니다.

일반적인 감사 드라이버: 액세스 로그 (누가 무엇을 보았는가), 변화 관리 (어떻게 도입되었는가), 위험 평가 (분기별), 사고 반응 (실험)? 17 · 25 단계의 감사 로그는 직접적으로 재사용 가능합니다.

### 크로스 프레임워크 지도

하나의 접근 통제 정책은 여러 프레임워크 통제를 만족시킵니다.

| Control | Frameworks |
|---------|-----------|
| Access logging | ISO 27001 A.5.15-5.18, GDPR Art. 32, HIPAA §164.312(a) |
| Change management | ISO 27001 A.8.32, PCI DSS Req. 6, HIPAA breach-notification scope |
| Encryption in transit | ISO 27001 A.8.24, GDPR Art. 32, HIPAA §164.312(e) |
| Secrets management | ISO 27001 A.8.19, PCI DSS Req. 8, SOC 2 CC6.1 |

컴플라이언스 도구 (Drata, Vanta, Secureframe) 는 이 지도를 자동화합니다. 규모의 비용에 가치가 있습니다.

### ISO 42001  신흥

2023년 말 발표. 인문인능 관리, 데이터 품질, 투명성, 인적 감독을 포함한 인공지능 지배의 틀.

### OpenAI의 참조 프로파일

오픈아이는 SOC 2 타입 2, ISO/IEC 27001:2022, ISO/IEC 27701:2019, GDPR/CCPA/HIPAA (BAA) /FERPA, PCI-DSS를 ChatGPT 결제 구성 요소에 유지한다. 이는 대략 2026년 기업 테이블의 지분이다.

### 기억해야 할 숫자

- EU AI 법의 벌금: 최대 €15M / 3% (고위험 의무, Art. 99(4); 최대 €35M / 7% (금지된 행위, Art. 99(3)).
- EU AI 법 고 위험 집행: 2026년 8월 2일.
- 가장 큰 문서화된 AI-특정 GDPR 벌금: €30.5M, 클리어뷰 AI (네덜란드 DPA, 24 9 월).
- LLM에 대한 GDPR의 최대 벌금: 15M €, OpenAI (이탈리아의 Garante, Dec 2024; 2026년 3월 항소심에서 취소)
- SOC 2 II 타입 창: 6~12개월의 운영 제어
- 콜로라도 인공지능 법 시행 날짜: 2026년 6월 30일 (SB25B-004에 의해 2026년 2월부터 연기)

```figure
i4-control-matrix
```

## 사용 하 고

`code/main.py`파이썬에서 의 컴포넌스 매핑 스프레드시트입니다.

## 선박

이 교훈은`outputs/skill-compliance-matrix.md`. 고객 세그먼트 및 지리 등을 고려하여 필요한 프레임워크와 제어 장치를 지정합니다.

## 운동

1. 첫 번째 기업 고객에게는 SOC 2 타입 II, HIPAA BAA, EU AI 법의 선언이 필요합니다. 거래를 이길 수 있는 최소한의 실행 가능한 컴플라이언스 포지션은 무엇입니까?
2. EU AI 법에 따라 3가지 가상의 LLM 제품을 위험 계층으로 분류합니다.
3. BAA 없이 PHI를 제공자에게 보내셨죠
4. 중부 시장 AI 공급업체에 대해 ISO 42001이 "2026년에 필요" 여부를 주장합니다.
5. LLM 감사 로그 필드 (단계 17 · 25) 를 최소 3개의 프레임워크 컨트롤로 지도하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| SOC 2 Type II | "audited controls" | Controls operating over 6-12 months, independently attested |
| HIPAA BAA | "healthcare contract" | Business Associate Agreement; required for PHI |
| GDPR | "EU privacy" | Real-time PII redaction is the defensible 2026 standard |
| EU AI Act | "EU AI rules" | High-risk enforcement August 2026; €15M / 3% (high-risk obligations) — €35M / 7% (prohibited practices) |
| Colorado AI Act | "US AI state law" | June 30, 2026 effective (delayed by SB25B-004); impact assessments |
| ISO 42001 | "AI governance" | Emerging framework for AI risk + transparency |
| ISO 27001 | "security ISMS" | Information Security Management System baseline |
| Conformity assessment | "EU AI doc package" | High-risk requirement: docs, testing, logging |
| Cross-framework mapping | "one control, many frames" | Single policy satisfies multiple framework controls |

## 더 많은 읽기

- [OpenAI Security and Privacy](https://openai.com/security-and-privacy/) 참고 준수 프로파일
- [GuardionAI — LLM Compliance 2026: ISO 42001, EU AI Act, SOC 2, GDPR](https://guardion.ai/blog/llm-compliance-guide-iso-42001-eu-ai-act-soc2-gdpr-2026)
- [Dsalta — SOC 2 Type 2 Audit Guide 2026: 10 AI Controls](https://www.dsalta.com/resources/ai-compliance/soc-2-type-2-audit-guide-2026-10-ai-powered-controls-every-saas-team-needs)
- [EU AI Act official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) 주요 출처
- [Colorado AI Act](https://leg.colorado.gov/bills/sb24-205) 주요 출처
- [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html) 인공지능 관리 시스템 표준
