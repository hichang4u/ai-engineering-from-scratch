# 행동 예산, 반복 제한 및 비용 관리

> 중소 전자상거래 에이전트의 월간 LLM 비용은$1,200 to $4,800 후에 그의 팀은 "질서를 추적하는" 기술을 활성화했습니다. 이것은 가격 오류가 아닙니다. 그것은 새로운 루프를 발견하고 그 안에 지출을 유지한 에이전트입니다. 마이크로소프트의 에이전트 지배 도구 (2006년 4월 2일) 은 이 클래스에 대한 방어를 코디화합니다.`max_tokens`, 작업 당 토큰 및 달러 예산, 일당/달 제한, 반복 제한, 계층형 모델 라우팅, 프롬프트 캐시링, 컨텍스트 윈도, 비싼 액션에 대한 HITL 체크포인트, 예산 위반에 대한 Kill 스위치. 앤트로피크의 클로드 코드 에이전트 SDK는 다른 이름으로 동일한 원시물을 배포합니다. 금융 속도 제한  예를 들어 10 분 동안 액세스 권한을> $ 50로 줄입니다  월간 제한보다 더 빨리          

**Type:** Learn
**Languages:** Python (stdlib, layered cost-governor simulator)
**Prerequisites:** Phase 15 · 10 (Permission modes), Phase 15 · 12 (Durable execution)
**Time:** ~60 minutes

## 문제

자율주행 에이전트는 모든 차례에 걸쳐 실제 돈을 지출합니다. 채팅봇의 나쁜 출력은 나쁜 답변입니다. 에이전트의 나쁜 루프는 청구입니다. 업계에서 실패 모드를 위한 문서화된 용어는 "화폐 거부"입니다.

수치는 한 숫자 아니라, 각 시간 스케일과 미분성 (per request, per task, per hour, per day, per month) 에 따라 한계들의 집합이다. 잘 설계된 집합은 몇 분 안에 달리는 루프를 잡으며, 몇 시간 안에 느린 누출이 발생하고, 하루 안에 나쁜 방출이 발생한다. 같은 집합은 에이전트가 긴 지평선과 자율성을 가지고 있을 때 예산을 유지한다.

이것은 공학 수업입니다. 수학은 소소한데, 학문은 팀들이 실패하는 곳입니다. 아래의 한계 목록은 모두 마이크로소프트 에이전트 지배 도구 키트 또는 인트로피 클로드 코드 에이전트 SDK 문서에서 명명됩니다.

## 개념

### 비용-구독자 스택

1. **`max_tokens` per request.**간단한 것인데, 한 통로 통화를 한 번 끝낼 수 없죠.
2. **Per-task token budget.**전체 실행에 N 토큰을 넘지 마십시오.
3. **Per-task dollar budget.**토큰과 같지만 화폐로`max_budget_usd`클로드 코드에서
4. **Per-tool call cap.**N  이상`WebFetch`전화, N`shell_exec`전화, 그리고
5. **Iteration cap (`max_turns`).**전체 에이전트 루프 반복; 무한한 추론 루프를 방지합니다.
6. **Per-minute / per-hour / per-day / per-month cap.**롤링 창문, 다른 시간 스케일에서 누출을 잡습니다.
7. **Financial velocity limit.**예를 들어, "만약 10분 안에 50달러를 넘으면, 접근을 줄여라".
8. **Tiered model routing.**작은 모델에 기본값; 분류자가 작업이 그것을 정당화한다고 판단했을 때만 큰 모델로 확장합니다.
9. **Prompt caching.**시스템 신속하고 안정적인 컨텍스트가 제공자의 캐시에 저장되어 있으며, 다시 전송하는 토큰 비용은 거의 0입니다.
10. **Context windowing.**활성 컨텍스트를 열기 이하로 유지하기 위한 컴팩션/조약; 직접적인 토큰 비용 절감.
11. **HITL checkpoints on expensive actions.**비용이 많이 드는 것으로 알려진 행동 (장기 호출, 큰 다운로드, 비싼 모델 업그레이드) 이전에, 인간 탭이 필요합니다.
12. **Kill switch on budget breach.**세션이 종료되면 캡이 불립니다. 캡이 기록됩니다. 별도의 재활성화 경로가 필요합니다.

### 왜 한 뚜도 안 어요

한 달 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 한 해제 시기를 요구 합니다.

- **Runaway loop**(원수 5초 재실험에 갇혀): 속도 제한에 의해 잡혔습니다.
- **Slow leak**(공무원 한 임무에 ~ 2x 예상 작업): 일일 최대 함락에 의해 잡힌.
- **Bad release**(새 버전은 5x 토큰을 사용한다): 주간 / 월간 cap에 의해 잡힌.
- **Legitimate surge**(실제 수요, 버그가 아닌): 명확한 로그로 시간/일 제한으로 잡혔습니다.

### 배너스 예산 표면

클로드 코드 에이전트 SDK는 공개 문서들을 공개합니다.

- `max_turns` 반복 캡
- `max_budget_usd` 달러 cap; 갱신에 대한 세션 낙태
- `allowed_tools`- `disallowed_tools` 도구 용품 및 델리리스트
- 사용자 지정 비용 회계를 위해 도구를 사용하기 전에 점

허가 모드 계단 (강좌 10) 에 결합합니다.`autoMode``max_budget_usd`인트로피는 자동 모드를 예산 통제가 필요하다고 명시적으로 프레임하고, 분류기는 비용과 정렬합니다.

### EU AI 법, OWASP 에이전틱 10위

마이크로소프트의 에이전트 지배 도구 킷은 OWASP 에이전트 톱 10 및 EU AI 법 제 14조 (인간의 감독) 의 요구 사항을 포함합니다. EU 내 생산에 있어서, 나무를 채굴하고 제한을 준수하는 것은 선택 사항이 아닙니다.

### 관찰된 것$1,200 → $4,800건의 사건

마이크로소프트 문서의 실제 사례: 새로운 도구가 추가된 후 월간 비용이 3배 증가한 전자 상거래 에이전트 이 도구는 매 세션에 걸쳐 주문 상태를 조사할 수 있도록 했습니다. 루프 감지도 안 돼 도구에 대한 모자가 없습니다. 일주일간 성장에 대한 경고가 없습니다. 매장기 1개에 대한 뚜이 추가로 매일 성장률을 알린다고 합니다. 이것은 템플릿입니다. 모든 새로운 도구 표면은 새로운 잠재적인 루프입니다. 모든 새로운 도구는 자신의 캡과 자신의 경고가 필요합니다.

```figure
cost-governor-stack
```

## 사용 하 고

`code/main.py`시뮬레이션 에이전트는 여러 차례에 걸쳐 투표 ループ에 몰려들며, 레이어 스테이크는 속도 창 안에 잡을 수 있고, 한 달의 캡이 며칠 후까지 발사되지 않는다.

## 선박

`outputs/skill-agent-budget-audit.md`제안된 대리인의 배치 비용 관리자 스택을 감사하고 부족한 층을 표시합니다.

## 운동

1. 달아`code/main.py`링 루프 궤도에 반복 뚜이 나오기 전에 속도 제한 발사 확인합니다. 이제 속도 제한을 비활성화하고 반복 뚜이 잡기 전에 에이전트가 얼마나 많은 돈을 "비용"하는지 측정합니다.

2. 브라우저 에이전트 (목 11) 에 대해 도구 하나 에 대한 캡 세트를 설계 하십시오. 어떤 도구 는 가장 긴밀한 캡 을 필요로 합니까? 어떤 도구 는 위험 없이 무한 히 실행 될 수 있습니까?

3. 마이크로소프트 에이전트 통치 도구 키트 문서를 읽어보십시오. 모든 캡 타입의 도구 키트 이름을 나열하십시오. 각 도구 키트 이름을 하나에 표시하십시오.

4. 현실적인 작업에 대해 하루 종일 무관한 실행 (예를 들어, "레포에서 50개의 에미션을 중시") 를 설정합니다.`max_budget_usd`2x에 대한 점수를 정의합니다

5. 클로드 코드의`max_budget_usd`세션 합계 비용에 대한 화재. 외부에서 적용할 수 있는 보조 속도 제한을 설계하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Denial of Wallet | "Runaway bill" | Agent loop generating spend with no cap to stop it |
| max_tokens | "Per-request cap" | Ceiling on a single completion's size |
| max_turns | "Iteration cap" | Ceiling on agent loop iterations in a session |
| max_budget_usd | "Dollar kill switch" | Session cost cap; aborts on breach |
| Velocity limit | "Rate cap" | Limit on spend per short window (e.g., $50 / 10 min) |
| Tiered routing | "Small model first" | Cheap model default; escalate only when classifier warrants |
| Prompt caching | "Cached system prompt" | Provider-side cache reduces re-send token cost to near zero |
| HITL checkpoint | "Human approval gate" | Human tap required before expensive action |

## 더 많은 읽기

- [Anthropic Claude Code Agent SDK — agent loop and budgets](https://code.claude.com/docs/en/agent-sdk/agent-loop)`max_turns``max_budget_usd`, 도구 사용자
- [Microsoft Agent Framework — human-in-the-loop and governance](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) 비용 관리자 점검점
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) 공급자 측 비용 통제
- [Anthropic — Prompt caching (Claude API docs)](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) 캐시 메커니즘
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 장기간 대리자들에 대한 비용 프로파일
