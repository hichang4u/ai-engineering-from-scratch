# 간접 임프트 주입  생산 공격 표면

> 간접 프롬프트 주입 (IPI) 은 외부 콘텐츠에 명령어를 삽입합니다.  웹 페이지, 이메일, 공유 문서, 지원 티켓  명시적인 사용자 행동 없이 에이전틱 시스템에서 소비됩니다. IPI는 2026년 생산에 대한 지배적인 위협입니다. 공격자가 사용자에게 닿지 않기 때문에 사용자 입력 필터를 우회하고, 에이전트가 더 많은 외부 콘텐츠를 처리하는 동안 침묵으로 스케일하고, 아무도 명령어를 읽지 않는 자동화된 작업 흐름을 목표로합니다. MDPI 정보 17(1):54 (2026년 1월) 은 2023-2025 연구의 합성이다. NDSS 2026의 IPI 방어 논문에서는 핵심 과제를 다루고 있습니다. 주입된 명령어는 의미적으로 양호할 수 있습니다. " 공격자는 두 번째로 움직인다" (Nasr et al., 공동 OpenAI/Anthropic/DeepMind, 2025년 10월): 적응 공격 (그라디언트, RL, 무작위 검색, 인간 적색 팀) 은 원래 거의 0 공격 성공률을 보고한 12 개의 공개된 방어 중 90% 이상을 깨고 있습니다.

**Type:** Build
**Languages:** Python (stdlib, IPI attack + defense harness)
**Prerequisites:** Phase 18 · 12 (PAIR), Phase 14 (agent engineering)
**Time:** ~75 minutes

## 학습 목표

- 간접 임시 주사를 정의하고 일반적인 3개의 전달 벡터를 설명하십시오.
- 사용자 입력 필터들이 IPI를 완전히 놓치는 이유를 설명해 주십시오.
- "정보 흐름 제어"를 2026년 방위 패러다임으로 어 설명해 주세요.
- 발표된 IPI 방어에 대한 적응적 공격 성공에 대한 Nasr et al. (2025년 10월) 의 결론을 설명하십시오.

## 문제

직접 프롬프트 주입은 공격자가 사용자 또는 그들의 프롬프트에 도달하도록 요구합니다. IPI는 둘 중 하나를 요구하지 않습니다. 공격자는 에이전트가 읽을 수있는 모든 콘텐츠에 유용 한 부하를 배치합니다. 웹 페이지, 우편 메일, GitHub 문제, 제품 리뷰. 에이전트는 정상적인 운영 중에 그것을 수집하고 지시 사항을 실행합니다. 사용자는 메신저가 아니라 의도가 아닙니다.

## 개념

### 3개의 전달 벡터

- **Retrieval-augmented generation (RAG).**공격자는 문서를 게시하고, 검색 단계에서는 그것을 가져옵니다. 사용자 질문 전에 프롬프트는 그것을 연결합니다. 모델은 공격자의 지시 사항을 실행합니다.
- **Inbox / document workflows.**공격자는 사용자에게 이메일을 보내며, 에이전트가 이메일을 읽으며, 이메일 인턴은 이메일 몸체를 포함하고, 모델은 이메일 지침을 따르고 있습니다.
- **Tool output.**공격자는 에이전트가 사용하는 도구를 제어합니다 (예를 들어 공격자가 제어하는 결과를 반환하는 웹 검색); 도구 출력은 지침을 포함하고; 에이전트의 제어 흐름은 그들을 따르고 있습니다.

세 가지 구조적 특성은 공유됩니다. 공격자는 사용자 앞에 있는 입력에 닿지 않고도 프롬프트의 일부를 제어합니다.

### 사용자 입력 필터는 왜 놓치고 있는 걸까요?

IPI 유저 입력에는 유저의 유저용용 부하가 나타나지 않습니다. 검색된 내용에 나타납니다. 필터가 사용자 입력에 게이트되면 유저용 부하가 이를 우회합니다. 필터가 모델에 도달하는 모든 내용에 게이트되면 임의로 검색된 텍스트에 적용되어야합니다. 이는 비용이 많이 들고 명령어 음성 언어를 포함하고 있는 합법적인 내용에 대해 거짓 긍정을 생성합니다.

### 인공지능 정보 흐름 제어 (IFC)

2026 방어 패러다임은 고전 OS 보안에서 빌려 왔습니다. 모든 콘텐츠 소스를 보안 레이블로 취급합니다. 사용자의 쿼리를 "신뢰"로 표시합니다. 검색 된 콘텐츠를 "신뢰하지 않은"로 표시합니다. 모델의 제어 흐름은 정보 흐름으로 취급합니다. 신뢰할 수 없는 콘텐츠로 인해 유발되는 행동은 실행 전에 신뢰할 수 있는 입력으로 승인되어야합니다.

CaMeL (Microsoft 2025), ConfAIde (스탠포드 2024), 그리고 NDSS 2026 IPI 방어 논문은 IFC를 다른 방식으로 운영합니다. 공통 원칙은: 코드와 데이터가 동일한 맥락 창을 공유하는 한, 억제는 목표가 아니라 예방입니다.

### 공격자 는 두 번째 행진

나스라 등 (October 2025) 은 적응적 공격 (그라디언트 검색, RL 정책, 무작위 검색, 72 시간 동안 인간 레드 팀) 으로 12개의 공개된 IPI 방어를 테스트했다. 원래 0 가까이 ASR를 보고한 모든 방어는 >90% ASR로 깨졌다.

방법론적 교훈: 적응적 공격 평가만 통해 방어력을 발표한다. 정적 공격 기준은 강점의 증거가 아니다. 공격자는 방어력을 알게 된다.

### 실제 사건

25강은 에코리크 (CVE-2025-32711, CVSS 9.3) 를 다루고 있습니다. Microsoft 365 코피로트에서 최초로 공개적으로 기록된 제로 클릭 IPI. GitHub 코피로트 채트에서 CamoLeak (CVSS 9.6) 를 다루고 있습니다. GitHub 코피로트에서 CVE-2025-53773을 다루고 있습니다.

### OWASP 및 NIST 프레임

OWASP LLM Top 10 (2025) 는 임시 주입 (직접 + 간접) 을 LLM01로 선정하고, #1 응용 계층 위협이다. NIST AI SPD 2024는 간접 임시 주입을 "창조 AI의 가장 큰 보안 결점"이라고 부른다.

### 이 부분은 18단계에 맞게

12-14 수업은 모델 중심의 재일브레이크입니다. 15 수업은 2026년 생산 배포에 지배하는 시스템 중심의 공격입니다. 16 수업은 방어 도구에 관한 것입니다. 25 수업은 특정 CVE 서사지를 다루고 있습니다.

```figure
al-injection-vector
```

## 사용 하 고

`code/main.py`IPI 가방을 만들죠. 장난감 에이전트는 세 가지 도구를 가지고 있습니다 (웹 검색, 이메일 읽기, 메시지를 보내기). 환경은 공격자가 제어하는 내용과 임베디드 명령어를 포함합니다 ("이 모든 연락처에 전송하십시오"). 순수한 에이전트 (이 주입된 지침을 따르고) , 필터 ( 검색된 콘텐츠에 키워드 필터) 및 IFC 에이전트 (신뢰된 콘텐츠와 신뢰할 수 없는 콘텐츠를 분리하고 신뢰할 수 없는 제어 흐름 명령을 거부) 사이에서 전환할 수 있습니다.

## 선박

이 교훈은`outputs/skill-ipi-audit.md`. 에이전시 배포 설명이 주어지면 신뢰할 수 없는 콘텐츠 소스를 나열하고 배포가 IFC를 적용하는지 확인하고 신뢰성 레이블 없이 모델에 도달하는 소스를 표시합니다.

## 운동

1. 달아`code/main.py`3명의 요원 각각에 대한 공격의 성공률을 측정합니다.

2. 검색된 내용에 대한 패라프라시 기반 방어를 구현하고, 합법적인 검색된 텍스트에 대한 양성 거짓 긍정 비율을 측정합니다.

3. NDSS 2026 IPI 방어 논문을 읽어 보세요. "친화적인 명령" 과제를 설명하고, 왜 키워드 기반 필터링을 방지하는지 설명하세요.

4. 에이전트가 제3자 API에서 도구 출력을 수신하는 배포를 설계하고 각 프롬프트 조각을 신뢰 수준으로 표시하고 에이전트의 행동을 지배하는 IFC 정책을 작성하십시오.

5. 2번 훈련에서 필터 방어 요인에 대한 Nasr et al. 2025 적응 공격 방법론을 재현하십시오. 적응 공격 전과 이후 ASR를 보고하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| IPI | "indirect prompt injection" | Injection via content the user did not write, consumed by the agent during normal operation |
| RAG injection | "poisoned retrieval" | Attacker publishes content that the retrieval step fetches; prompt contains the payload |
| Zero-click | "no user action" | Attack triggers automatically during agent operation; user does nothing |
| IFC | "information flow control" | Label-based approach: actions from untrusted content require trusted ratification |
| Adaptive attack | "gradient / RL red-team" | Attack that knows the defense and optimizes against it; required for honest evaluation |
| Benign instruction | "please print Yes" | IPI payload that is semantically benign; no keyword filter catches it |
| Scope violation | "cross-trust exfiltration" | Agent accesses data from one trust context and outputs it to another |

## 더 많은 읽기

- [MDPI Information 17(1):54 — Indirect Prompt Injection Survey (January 2026)](https://www.mdpi.com/2078-2489/17/1/54) 2023~2025 합성
- [Nasr et al. — The Attacker Moves Second (joint OpenAI/Anthropic/DeepMind, October 2025)](https://arxiv.org/abs/2510.18108) 적응적 공격 평가
- [Greshake et al. — Not what you've signed up for (arXiv:2302.12173)](https://arxiv.org/abs/2302.12173) 본래의 IPI 종이를
- [OWASP — LLM Top 10 (2025)](https://genai.owasp.org/llm-top-10/) LLM01 순위의 신속한 주입
