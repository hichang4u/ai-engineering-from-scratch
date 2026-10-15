# 브라우저 에이전트 및 장기적인 웹 작업

> 채트GPT 에이전트는 (2025년 7월) 운영자와 심도있는 연구를 하나의 브라우저/터미널 에이전트로 통합하여 브라우즈컴 SOTA를 68.9%로 설정했습니다. 오픈AI는 2025년 8월 31일, 제품 계층에서 통합을 종료했다. 앤트로피크의 베르셉트 인수로 클로드 소넷은 OSWorld에서 15% 이하에서 72.5%로 이동했다. 웹아레나 검증 (서비스노우, ICLR 2026) 은 원래 웹아레나에서 11.3 퍼센트 점의 거짓 음수 비율을 고정하고 258 작업 하드 하브셋을 배포했습니다. 숫자는 진짜죠 공격 표면도 마찬가지입니다. OpenAI의 준비 책임자는 브라우저 에이전트에 간접 인스턴트 주사를 "완전히 수정할 수 있는 버그가 아니다"라고 공개적으로 선언했습니다. 문서화 된 20252026 공격: 오염된 기억 (Atlas CSRF), HashJack (Cato Networks), 그리고 Perplexity Comet에서 한 번의 클릭으로 납치.

**Type:** Learn
**Languages:** Python (stdlib, indirect prompt-injection attack surface model)
**Prerequisites:** Phase 15 · 10 (Permission modes), Phase 15 · 01 (Long-horizon agents)
**Time:** ~45 minutes

## 문제

브라우저 에이전트는 신뢰할 수 없는 콘텐츠를 읽고 그에 따른 행동을 하는 장거리 에이전트입니다. 에이전트가 방문하는 모든 페이지는 사용자가 작성하지 않은 입력입니다. 모든 페이지의 모든 양식은 잠재적인 명령 채널입니다. 20252026 공격 코퍼스는 이것이 가설적이지 않다는 것을 보여줍니다. 오염된 기억은 공격자가 악성 명령어를 제작된 페이지를 통해 에이전트의 메모리에 연결하도록 허용합니다. HashJack는 에이전트가 방문하는 URL 조각에 명령을 숨깁니다.

방어적인 그림은 불편하다. OpenAI의 준비 책임자는 조용한 부분은 크게 말했다: 간접적 인 초급 주입은 "완전히 수정할 수 있는 버그가 아닙니다". 이것은 공격이 에이전트의 읽기-행동 경계에 있기 때문입니다. 이는 건축적으로 미묘합니다. 모델이 읽는 모든 토큰은 원칙적으로 명령으로 읽을 수 있습니다.

이 수업은 공격 표면을 이름, 벤치마크 풍경을 이름 (BrowseComp, OSWorld, WebArena-Verified), 그리고 최소한의 간접적 인 즉시 주입 시나리오를 모델링하여 레슨 14 및 18에서 실제 방어에 대해 논의를 할 수 있습니다.

## 개념

### 2026년 풍경, 각 시스템마다 한 문장

**ChatGPT agent (OpenAI).**2025년 7월 출시. 운영자 (브라우징) 과 심도 연구 (다시간 연구) 를 통일한다. 독립 운영자 (Standalone Operator) 를 2025년 8월 31일 종료한다.

**Claude Sonnet + Vercept (Anthropic).**앤트로피크의 베르셉트 인수업은 컴퓨터 사용 기능에 초점을 맞추었다. 클로드 소넷은 OSWorld에서 <15%에서 72.5%로 이동했다. 클로드 컴퓨터 사용은 도구 API로 배입니다.

**Gemini 3 Pro with Browser Use (DeepMind).**브라우저 사용 통합은 컴퓨터 사용 제어 장치를 제공합니다. FSF v3 (2026년 4월, 강좌 20) 는 ML 연구 개발 영역에서 자율성을 추적합니다.

**WebArena-Verified (ServiceNow, ICLR 2026).**잘 기록된 문제를 해결합니다. 원래의 WebArena는 ~11.3%의 거짓 부정적 비율을 가지고 있습니다. (실제로 해결 된 표시 된 작업이 실패했습니다). 검증된 버전은 인간 정리한 성공 기준으로 재등급하고 258- 작업 하드 서브셋을 추가합니다.

### BrowseComp vs OSWorld vs WebArena

| Benchmark | What it measures | Horizon |
|---|---|---|
| BrowseComp | Finding specific facts on the open web under time pressure | minutes |
| OSWorld | Agent operating a full desktop (mouse, keyboard, shell) | tens of minutes |
| WebArena-Verified | Transactional web tasks in simulated sites | minutes |
| Hard subset | WebArena-Verified tasks with multi-page state transitions | tens of minutes |

다른 축. 높은 BrowseComp 점수는 에이전트가 사실을 발견한다고 말하지만, 에이전트가 비행기를 예약할 수 있다고 말하지는 않습니다. OSWorld 점수는 "내 데스크톱에서 작동합니까?"에 가깝습니다. WebArena-Verified는 "흐름을 완료 할 수 있습니까?"에 가깝습니다. 모든 생산 결정은 작업 분포에 맞는 기준이 필요합니다.

### 공격 표면, 이름

1. **Indirect prompt injection.**신뢰할 수 없는 페이지 내용은 지침을 포함합니다. 에이전트는 그것들을 읽습니다. 에이전트는 실행합니다. 공개 예: 2024 카이 그레시케 등, 2025 오염된 기억 문서, 2026 해시 잭 (카토네트워크).
2. **URL fragment / query injection.**`#fragment`또는 검색 URL의 쿼리 문자열은 명령어를 포함합니다. 눈에 띄게 렌더링되지 않습니다. 여전히 에이전트의 맥락에 있습니다.
3. **Memory-binding attacks.**페이지는 에이전트에 영구 메모리를 작성하도록 지시합니다. (학습 12 은 내구성 상태를 포함합니다). 다음 세션에서는 메모리가 가시적인 트리거가 없어도 유용 한 로드를 발사합니다.
4. **CSRF-shaped attacks on authenticated sessions.**오염된 메모리 클래스: 에이전트가 어딘가에 로그인되어 있습니다. 공격자의 페이지에서 에이전트가 사용자의 쿠키로 실행하는 상태 변경 요청을 발행합니다.
5. **One-click hijack.**시각적으로 무해한 버튼이 대리인이 따라가는 펄로로 이동합니다.
6. **Content-Security-Policy holes in the agent's host surface.**렌더링 및 도구 계층은 공격 벡터일 수 있으며, 브라우저-인-브라우저- 에이전트 스택은 넓습니다.

### 왜 "완전히 패치할 수 없는 것"이라고

공격은 에이전트의 능력에 동형적입니다. 에이전트는 그 일을 하기 위해 신뢰할 수 없는 내용을 읽어야 합니다. 에이전트가 읽은 모든 내용에는 명령이 포함될 수 있습니다. 에이전트가 따르는 모든 명령은 사용자의 실제 요청과 잘못 일치할 수 있습니다. 방어 (신뢰 경계, 분류자, 도구 허용자, 후속 행동에 대한 HITL) 는 공격의 비용을 증가시키고 폭발 반경을 줄인다. 수업은 닫지 않아요

이것은 로브의 정리와 같은 추론 패턴입니다 (강좌 8): 에이전트는 다음 토큰이 안전하다는 것을 증명할 수 없습니다. 그것은 안전하지 않은 토큰이 더 감지 가능한 시스템을 설정할 수 있습니다.

### 실제로 선박을 방어 자세

- **Read / write boundary.**읽기란 결코 결과적일 수 없습니다. 글쓰기 (포럼을 제출하거나, 콘텐츠를 게시하거나, 부작용을 가진 도구를 호출하는 것) 은 신뢰의 경계를 벗어나 기획된 콘텐츠가 왔다면 새로운 인적 승인을 필요로 합니다.
- **Tool allowlist per task.**에이전트는 브라우징 할 수 있지만, 이 도구가 해당 작업에 명시적으로 활성화되지 않은 한 송금 시키는 것은 불가능합니다.
- **Session isolation.**브라우저 에이전트 세션은 범위를 제한한 인증서만 사용되며 제작 저작자, 개인 이메일도 없습니다. 감사에 대한 모든 HTTP 요청의 로그가 유지됩니다.
- **Content sanitizer.**가져온 HTML는 모델 컨텍스트에 연결되기 전에 알려진 나쁜 패턴을 제거합니다. (단순한 공격을 줄이고, 복잡한 유용성을 멈추지 않습니다.)
- **HITL on consequential actions.**제안하고 나서 의뢰하는 패턴 (강좌 15).
- **Canary tokens on memory.**메모리 입력이 열리면 사용자는 그것을 볼 수 있습니다 (강좌 14).

```figure
injection-boundary
```

## 사용 하 고

`code/main.py`작은 브라우저 에이전트가 합성 페이지 세 페이지에 달하는 것을 모델로 합니다. 한 페이지가 양성이며, 하나는 눈에 보이는 텍스트에서 직접적인 프롬프트 주입 블럽을 가지고 있고, 하나는 URL 조각 주입을 가지고 있습니다 ( 눈에 보이지 않지만 에이전트의 맥락 내에서). 스크립트는 (a) 순진한 에이전트가 무엇을 할 것인지, (b) 읽기/쓰기 경계가 어떤 것을 잡는지, (c) 세니티저가 어떤 것을 잡는지, (d) 어느 것도 잡지 않는 것을 보여줍니다.

## 선박

`outputs/skill-browser-agent-trust-boundary.md`제안된 브라우저 에이전트 배포의 범위: 어떤 신뢰 영역을 만지고, 무엇을 작성할 수 있는 권한이 있으며, 첫 번째 실행 전에 어떤 방어 장치가 설치되어야 하는지.

## 운동

1. 달아`code/main.py`. 세제제품이 어떤 공격이 잡을지, 하지만 읽기/쓰기 경계선이 잡지 않고, 누가 읽기/쓰기 경계 catch만을 공격하는지 확인한다.

2. 해시 잭 스타일의 URL 조각 주사를 감지하기 위해 세제제를 확장합니다. 합법적인 조각을 가진 양성 URL에서 거짓 긍정적 인 비율을 측정합니다.

3. 당신이 알고 있는 실제 브라우저 에이전트 작업 흐름을 선택하세요 (예를 들어 "비행 예약") 모든 읽기 및 쓰기를 나열하세요. 어떤 글이 HITL와 이유를 필요로 하는 것을 표시합니다.

4. 웹 아레나 검증 ICLR 2026 논문을 읽어 보세요. 원래 웹 아레나의 점수가 신뢰할 수 없는 한 범주를 식별하고 검증된 하위 집합이 어떻게 해결하는지 설명합니다.

5. 브라우저 에겐트 설정 을 위한 메모리 카나리 를 설계 하십시오. 어떤 것 을 저장 하고, 어디 에 저장 하고, 어떤 것 이 경보 를 유발 합니까?

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Indirect prompt injection | "Bad page text" | Untrusted content in a page the agent reads contains instructions the agent executes |
| Tainted Memories | "Memory attack" | Agent writes an attacker-supplied instruction to durable memory; triggered next session |
| HashJack | "URL fragment attack" | Payload hidden in URL fragment / query string is in the agent's context but not visibly rendered |
| One-click hijack | "Bad button" | Visible affordance rides a follow-on payload the agent executes |
| BrowseComp | "Web search benchmark" | Finding specific facts on the open web; minute-scale horizon |
| OSWorld | "Desktop benchmark" | Full OS control; multi-step GUI tasks |
| WebArena-Verified | "Fixed web-task benchmark" | ServiceNow's regraded WebArena with Hard subset |
| Read/write boundary | "Side-effect gate" | Reading never consequential; writing requires fresh approval if content is out-of-trust |

## 더 많은 읽기

- [OpenAI — Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/) 운영자 및 심도 연구의 통합; BrowseComp SOTA.
- [OpenAI — Computer-Using Agent](https://openai.com/index/computer-using-agent/) ChatGPT 에이전트가 된 운영자 가계와 건축물.
- [Zhou et al. — WebArena](https://webarena.dev/) 원래 기준
- [WebArena-Verified (OpenReview)](https://openreview.net/forum?id=94tlGxmqkN) ICLR 2026 고정 하위 집합 종이
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 컴퓨터 사용 에이전트들을 위한 공격 표면 논의가 포함됩니다.
