# 스위치, 회로 단절자, 카나리 토큰 을 제거

> 킬 스위치는 에이전트의 편집 표면에서 외부에 보관되는 boolean입니다. Redis 키, 기능 플래그, 서명된 구성 , 이는 에이전트를 완전히 비활성화합니다. 회로 차단기는 더 세밀한 것입니다. 특정 패턴에 걸려 넘어갑니다. (열에 동일한 도구의 다섯 번의 호출), 침해하는 경로를 멈추고, 인간으로 격상됩니다. 카나리 토큰은 고전적인 속임수로부터 물려받습니다. 가짜 신분증이나 기기록은 에이전트가 만질 수 있는 정당한 이유가 없으며, eBPF 기반 데이터 패스 (예를 들어 Cilium) 는 격리된 포드의 출구를 커널 레이어에서 법정 수련 으로 다시 쓸 수 있습니다. 발표된 Cilium 벤치마크는 부밀리초 P99 데이터 패스 지연을 로드 하에 보고합니다 (당신의 전파 예산은 정책 업데이트가 노드에 어떻게 도달하는지에 달려 있습니다. 데이터 패스 자체는 아닙니다). 움직이는 기본선에 적응하는 통계 탐지기 (EWMA, CUSUM) 는 조용히 이동을 받아들일 것입니다

**Type:** Learn
**Languages:** Python (stdlib, three-detector simulator: kill switch, circuit breaker, canary)
**Prerequisites:** Phase 15 · 13 (Cost governors), Phase 15 · 10 (Permission modes)
**Time:** ~60 minutes

## 문제

비용 관리자 (강좌 13) 는 에이전트가 지출 할 수 있는 금액을 제한한다. 그들은 에이전트가 예산 내에서 할 수 있는 일을 제한하지 않는다. $ 50 속도 제한을 가진 에이전트는 여전히 비밀을 파헤쳐, 잘못된 게시물을 게시하거나 리소스를 삭제할 수 있습니다.

이 수업은 비용 계층 옆에 있는 세 가지 탐지기를 다루고 있습니다.

1. **Kill switch**: 부올성 오프 버튼은 에이전트의 접근 범위에서 벗어나
2. **Circuit breaker**: 특정 경로를 멈추는 행동 패턴 탐지기
3. **Canary token**만지는 이유가 없는 에이전트가 만지는 것으로 드러나는 먹잇감입니다.

세 가지 모두 LLM 전 공학입니다. 고전적 속임수, 속도 제한 차단기, 기능 플래그 살인자는 이전 자율적인 에이전트를 죽입니다. 새로운 것은 공격 표면입니다. 에이전트는 신뢰할 수 없는 콘텐츠를 읽습니다 (강좌 11), 자신의 메모리를 편집하고 안전하지 않은 것으로 보이는 많은 행동을 구성 할 수 있습니다. 여기에 언급된 탐지기는 에이전트의 자보고를 신뢰하지 않기 때문에 작동합니다.

## 개념

###  스위치

kill 스위치는 에이전트가 읽을 수 있지만 쓸 수 없는 boolean이다. 구현 선택:

- **Feature flag in a managed service.**론칭더클리, 스타시그, 론칭 업데이트는 초 안에 퍼집니다.
- **Redis key the agent polls.**간단합니다. 에이전트 프로세스가 모든 회전에서 확인해야 합니다.
- **Signed config in object storage.**에이전트는 출동장판에 서명을 확인하고 서명되지 않은 상태를 거부합니다.
- **OS-level signal or container-lifecycle kill.**도커`kill`, 쿠버네티스`kubectl delete pod`, 시스템 정지

올바른 kill 스위치가 가진 특성:

- 에이전트가 설정할 수 없습니다`off`(전체에서 살아서 에이전트의 자격증은 기록되지 않는다.)
- 이 방법은 시작 시만 아니라 모든 결과적 행동에서 확인됩니다.
- 이 장치가 꺼지면, 에이전트가 외부에서 관찰할 수 있는 어떤 것도 하지 않습니다. 에이전트가 도달할 수 있는 시스템에 로그를 포함합니다.
- 다시 활성화하는 것은 명백한 인간의 행동이고 자동적인 시간제작이 아닙니다.

### 회로 단절기

회로 차단기는 전체 요인을 아닌 특정 패턴을 중단합니다. 고전적인 모양 (2007년 니가드 책에서, 여전히 현재):

- **Closed**: 행동 할 수 있습니다.
- **Open**: 액션이 차단되었습니다.
- **Half-open**: 냉각 후 13 탐사 시도가 허용된다 (전립 1); 성공으로 브레이커가 닫히고, 남은 실패는 다시 열린다.

요원 관련 트리거:

- 5개의 동일한 도구 호출이 연속 (복귀 루프)
- 동일한 도구에 5번 연속으로 오작동이 발생하고, 입력값이 다르다는 것을 (시스템 오작동)
- 도구 호출의 비율은 한 문턱을 초과한다 (학습 13 속도).
- 사용된 특정 도구 (예를 들어,`file.delete`) 를 신뢰하지 않는 내용으로 읽은 후 (강좌 11)

### 카나리 토큰

카나리 토큰 (Honey Token) 은 에이전트가 절대 만지지 않아야 하는 입력입니다. 접근은 경보입니다.

에이전트들에 대한 예제:

- 가짜`AWS_SECRET_ACCESS_KEY`실제 특권을 가진 환경에서는 발굴 시도는 즉시 적용될 수 있습니다.
- 알려진 센티널 값으로 표시된 가짜 데이터베이스 기록이 있습니다. 이 기록의 모든 읽기 또는 업데이트는 알림을 발사합니다.
- 작업 공간에 가짜 파일이 있습니다. 이 파일의 읽기 또는 편집은 의심스럽습니다.
- 세션 시작 시 주입된 가짜 메모리 입력. 나중에 출력에서 나타나면 메모리가 파출되었습니다.

카나리 디자인은 작업 흐름에 특이합니다. 대리인이 만지는 합법적인 이유는 소음입니다.

### 왜 통계적 계층과 하드 한계

통계 탐지기 (EWMA, CUSUM, 도구 호출률의 z 점수) 는 움직이는 기본 라인 에 적응 한다. 이것은 합법적 이동의 특징이며 적대적 이동의 버그 이다. 환자 공격자는 알람 발화 없이 충분히 천천히 기본 라인을 이동 할 수 있다.

엄격한 헌법적 한계가 (강좌 17) 굽히지 않는다. "아무래도 이메일을 보내지 마라.`secrets@`"헌법적 규칙으로서 더 간단하고, 검증 가능하며, 느린 추락으로 게임을 할 수 없습니다. 계층 패턴: 통계 탐지기는 대부분의 소음을 잡습니다.

### eBPF 데이터파스 리더렉트를 통해 격리

Cilium의 eBPF 기반 네트워크 정책은 격리된 포드의 출입을 커널 레이어에서 법의학적인 미세포로 다시 쓸 수 있습니다. Cilium의 공공 벤치마크는 TCP_RR에 미리초속 P99 데이터파스 지연을 보고하고 있습니다. 클러스터의 격리 (quarantine) 를 *triggering* 하는 데 필요한 벽 시계 예산은 제어 플레인에서 노드로 정책 업데이트가 어떻게 전파되는지에 의해 지배됩니다. 이것은 두 가지 것을 알려줍니다. 에이전트는 실제적인 것을 배제하지 않으며, 미세먼지의 행동은 미세먼지 안에 완전히 관찰됩니다. 카나리 표본과 같은 패턴, 다른 층: 요인은 포함된 상태에서 시도하는 것으로 의도를 드러냅니다.

### 어떤 탐지기가 잡지 못하는 것은

- **Semantic attacks that compose from allowed primitives.**모든 개별 동작은 모든 탐지기를 통과합니다. 구성은 문제입니다. 이것은 10 수업에서 자동 모드 복합 실패입니다.
- **Attacks that include the detector as part of the payload.**만약 에이전트가 "행동을 하기 전에 카나리어를 비활성화하라"라는 페이지를 읽고 그 에이전트가 그 기능을 가지고 있다면, 탐지기는 손상된다. 카나리 토큰은 에이전트가 수정할 수 없는 시스템 안에 있어야 합니다.

```figure
circuit-breaker
```

## 사용 하 고

`code/main.py`3개의 탐지기를 통해 짧은 요원 궤도를 시뮬레이션합니다. 외부 디렉터에서 유지되는 킬 스위치; 동일한 도구 호출 5번에 걸리는 회로 차단기; 읽기가 알림을 유발하는 카나리 파일. 합성 궤도를 공급합니다. 합법적인 행동, 반복 루프, 카나리 탐사선 및 요인의 행동이 중단되는 킬 스위치 트리거드 시나리오.

## 선박

`outputs/skill-tripwire-design.md`에이전트 배치에 대한 제안된 탐지 스택을 검토하고 빈틈을 표시합니다 (실종 킬 스위치, 실종 카나리, 회로 차단기 임계량이 너무 느슨합니다).

## 운동

1. 달아`code/main.py`. 5번 턴 (제5번 동일 호출) 에서 회로 차단기 소화와 9번 턴 (거짓 키 읽기) 에서 카나리 소화 확인

2. 통계 탐지기를 추가: EWMA z-score (기기 호출 속도) 를 입력합니다. 천천히 움직인 궤도를 입력하여 탐지기가 결코 불지 않는 것을 보여줍니다. 이제 하드 제한을 추가합니다. (기기 호출 10 분 이내에 50 개 이상) 그리고 동일한 궤도에 하드 제한 화재를 표시합니다.

3. 브라우저 에이전트 (목 11) 에 대한 카나리 토큰 을 설계 하십시오. 적어도 3개의 카나리 토큰 을 나열 하여 각각의 토큰 이 무엇 을 감지 할 것 입니까?

4. 실리움 네트워크 정책 문서 를 읽어 보십시오. 출구-전도 격리 흐름 을 구체적으로 설명 하십시오. 어떤 정책 선택자, 어떤 포드, 어떤 출구 재쓰기, 어떤 알림. '집단 하위'에서 '첫 번째 환도 패키지'까지 벽 시계 지연을 어떻게 조절 합니까?

5. 다시 활성화할 수 있는 절차를 정의해 주세요. 누가 다시 활성화할 수 있을까요?

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Kill switch | "Off button" | Boolean outside the agent's edit surface; checked on every consequential action |
| Circuit breaker | "Pattern pause" | Action-specific trip on repetition, failure rate, or rate-limit |
| Canary token | "Honeytoken" | Bait the agent has no legitimate reason to touch; access fires an alert |
| Honeypot | "Forensic sandbox" | Redirected traffic / workspace where a quarantined agent is observed |
| EWMA | "Moving average" | Exponentially weighted; adapts to drift (feature + bug) |
| CUSUM | "Cumulative sum" | Detects sustained shift from baseline |
| Hard limit | "Constitutional rule" | Does not adapt; constant regardless of history |
| Constitutional limit | "Always-true rule" | Tied to Lesson 17's constitution; cannot be edited by the agent |

## 더 많은 읽기

- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 자율주행자용 킬 스위치 및 회로 차단기 프레임
- [Microsoft Agent Framework — HITL and oversight](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop)생산 지배 패턴
- [OWASP LLM / Agentic Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) 탐지 및 반응 요구 사항
- [Cilium — Network policy and eBPF](https://docs.cilium.io/en/stable/security/network/)                                                                                                                                                                                                                                                              
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) "헌법적 한계"로 하드코딩된 금지
