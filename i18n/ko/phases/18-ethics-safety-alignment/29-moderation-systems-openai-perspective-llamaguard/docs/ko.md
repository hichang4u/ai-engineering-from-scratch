# 중화 시스템  OpenAI, 전망, 라마 경호

> 생산 조절 시스템은 12-16 수업에서 정의된 안전 정책을 실행합니다.`omni-moderation-latest`(2024) 는 GPT-4o에 기반하여 텍스트 + 이미지를 한 통화에서 분류합니다. 이전 버전보다 다국어 테스트 세트에서 42% 더 나은 응답 스키마는 13 카테고리 부올어  괴롭힘, 괴롭힘/ 위협, 증오, 증오/ 위협, 불법, 불법/ 폭력, 자해, 자해/ 의도, 자해/ 지시, 성적, 성적/ 미성년자, 폭력, 폭력/ 그래픽; 대부분의 개발자에게 무료. 계층 패턴: 입력 모더레이션 (전 세대), 출력 모더레이션 (후 세대), 사용자 지정 모더레이션 (분야 규칙). 아싱크 병렬 호출은 지연을 숨기며 플래그에 위치지휘자 응답을 합니다. 라마 경비 3/4 (강좌 16): 14 MLCommons 위험, 코드 해석자 남용, 8 언어 (v3), 멀티 이미지 (v4). 전망 API (Google Jigsaw): 중개자로서 LLM의 파동 이전 유독성 점수; 주로 중독성/공손성/성어류의 한 차원 유독성; 내용중중개 연구의 기본 기준. 퇴치: Azure 콘텐츠 모더터는 2024년 2월 폐지되었으며, 2027년 2월 퇴임되었으며, Azure AI 콘텐츠 안전에 의해 대체되었습니다.

**Type:** Build
**Languages:** Python (stdlib, three-layer moderation harness)
**Prerequisites:** Phase 18 · 16 (Llama Guard / Garak / PyRIT)
**Time:** ~60 minutes

## 학습 목표

- OpenAI Moderation API의 범주 분류학과 Llama Guard 3의 MLCommons 집합과 어떻게 차이가 있는지 설명하십시오.
- 세 가지 중화 계층 패턴 (입입, 출력, 사용자 지정) 을 설명하고 각각의 실패 모드 하나를 명명하십시오.
- 전 LLM 시대 기준으로 Perspective API의 위치를 설명하고 왜 연구에서 계속 사용되고 있는지 설명하십시오.
- Azure의 미흡기 시간표를 표시하십시오.

## 문제

12-16 수업은 공격 및 방어 도구에 대해 설명합니다. 29 수업은 사용자가 제품을 만지는 표면에서의 방어 기능을 작동시키는 배치 된 조절 시스템을 다루고 있습니다. 세 층 패턴은 2026 기본 구성입니다.

## 개념

### OpenAI 중화 API

`omni-moderation-latest`(2024). GPT-4o에 기반한. 한 통화에서 텍스트 + 이미지를 분류합니다. 대부분의 개발자에게 무료입니다.

카테고리 (13 부올 스키마에서 응답):
- 괴롭힘, 괴롭힘/위험
- 증오, 증오/위험
- 자사 피해, 자사 피해/자신의 의도, 자사 피해/자신의 지시
- 성별, 성별/성년자
- 폭력, 폭력/그래픽
- 불법, 불법/폭력

다중형 지원은 `violence``self-harm`그리고`sexual`하지만 그렇지 않습니다`sexual/minors`나머지 내용은 문자만 사용된다.

코드 배너스`code/main.py`우리는 붕괴 `/threatening``/intent``/instructions`그리고`/graphic`교육적 단순성을 위해 학위급 부모로 하위급을 입력합니다. 생산 코드는 전체 13급 스키마를 사용해야 합니다.

다국어 시험 집합에서 42% 더 나은 전 세대 중화 최종점.

### 라마 경비 3/4

레슨 16에 포함된 14 MLCommons 위험 카테고리 (OpenAI의 13 응답 스키마 부울어와 다르게 조직되어 있습니다). 8 언어를 지원합니다. Llama Guard 4 (2025년 4월) 은 원래 멀티모달, 12B입니다.

오픈AI와 라마 경비 분류는 겹치지만 차이가 있다. 오픈AI는 "불법"이라는 범위를 넓게 분류하고, 라마 경비에는 "폭력 범죄"와 "폭력 범죄"이 따로 있다. 배치들은 정책-택시노미에 맞는 방식으로 선택된다.

### 퍼스펙티브 API (Google Jigsaw)

유독성 점수 시스템 (LLM-as-moderator wave) (2020년 이전) 에 앞서. 카테고리: 유독성, 심각성_중독성, 부상을, 경멸성, 위협성, 정체성_ 공격. 하위 차원 변종을 가진 단일 차원 원점 점수 (TOXICITY).

콘텐츠 중화 연구 기준으로 널리 사용되는데, API는 안정적이고 문서화되어 있으며 수년간의 캘리브레이션 데이터를 가지고 있기 때문입니다. 현대 LLM 인접한 사용 사례에 대해서는 Llama Guard 또는 OpenAI Moderation는 일반적으로 더 적합합니다.

### 3층 패턴

1. **Input moderation.**생성 전에 사용자의 프롬프트를 분류합니다. 표시된 경우 거부합니다. 지연: 한 분류자 호출.
2. **Output moderation.**모델의 출력을 배달 전에 분류하십시오. 표시가 표시되면 거절으로 교체하십시오. 지연: 세분기자 호출 후 한 번
3. **Custom moderation.**도메인별 규칙 (레게스, 허용 목록, 비즈니스 정책)

세 층은 설계에 따라 순서적으로 이루어집니다. 입력 온도화는 생성 전에 완료되어야 하며 출력 온도화는 생성 후 실행됩니다. 평행성은 여러 분류자를 실행하는 계층 내에서 적용됩니다 (예를 들어, OpenAI Moderation + Llama Guard + Perspective) 같은 텍스트에서 동시에 분류자에 대한 지연을 숨깁니다. 선택적 최적화로서, 입력 모더레이션이 완료되고 토큰-1 스트리밍이 연기되는 동안 위치지수 응답 ("하나의 순간, 확인...") 이 표시될 수 있습니다. 깃발의 행동은 구성될 수 있습니다: 거부, 해제, 인간 검토로 확대됩니다.

### 실패 모드

- **Input only.**출력 환각을 잡지 않습니다 (학습 12-14 코딩 공격은 입력 분류자를 우회합니다).
- **Output only.**어떤 입력도 모델에 도달할 수 있게 해줍니다. 비용도 증가시킵니다. 공격자에게 내부적인 추론을 표면시킵니다.
- **Custom only.**범주별로 견고하지 않습니다. 레지스는 부서지기 쉽습니다.

레이어형은 기본입니다.

### 아저루의 미하

Azure 콘텐츠 모데레이터: 2024년 2월 폐지, 2027년 2월 은퇴. LLM 기반의 Azure AI 콘텐츠 안전으로 대체되어 Azure OpenAI와 통합됩니다. 마이그레이션은 2024-2027년 Azure 배포를 위한 현장 수준의 프로젝트입니다.

### 이 부분은 18단계에 맞게

레슨 16 은 레드 팀 맥락에서 모더레이션 도구 를 다루고 있습니다. 레슨 29 은 배포 된 모더레이션을 다루고 있습니다. 레슨 30 는 현재 두 가지 사용 능력 증거로 종료됩니다.

```figure
an-moderation-layers
```

## 사용 하 고

`code/main.py`3층의 모더레이션 하네스를 구축합니다. 입력 모더레이터 (키워드 + 카테고리 스코어), 출력 모더레이터 (출력에서 동일한 분류자), 사용자 지정 모더레이터 (ドメイン 규칙). 입력값을 실행하고 어떤 레이어를 잡는지 관찰할 수 있습니다.

## 선박

이 교훈은`outputs/skill-moderation-stack.md`. 배포를 고려하면, 어느 분류자가 입력, 어떤가 출력, 어떤 사용자 정의 규칙, 어떤 판별자가 가장자리 경우에 대한 조정 스택 구성을 권장합니다.

## 운동

1. 달아`code/main.py`세 층 모두에서 양성, 경계선, 그리고 유해한 입력을 실행하고 각 층에 대해 어느 층이 불타는지 보고하십시오.

2. 특정 카테고리에 대해 Perspective API 스타일의 독성 점수를 사용하여 배지를 확장하고 그 열점 동작을 카테고리 점수에 비교하십시오.

3. OpenAI Moderation API 문서를 읽고 Llama Guard 3 카테고리 목록을 읽어보십시오. 각 OpenAI 카테고리를 가장 가까운 Llama Guard 카테고리로 지도하십시오. 깨끗하게 지도되지 않는 세 가지 카테고리를 식별하십시오.

4. 코드 보조 설치 (예를 들어, GitHub Copilot) 에 대한 모дера션 스택을 설계하십시오. 가장 중요하고 덜 중요 한 범주를 식별하고 사용자 지정 규칙을 제안하십시오.

5. Azure Content Moderator는 2027년 2월 퇴임합니다. Azure AI 콘텐츠 안전으로 마이그레이션을 계획합니다. 마이그레이션의 가장 위험 요소를 식별하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| OpenAI Moderation | "omni-moderation-latest" | GPT-4o-based 13-category (text) classifier with partial multimodal support |
| Perspective API | "Google Jigsaw toxicity" | Pre-LLM-era toxicity scoring baseline |
| Llama Guard | "MLCommons 14-category" | Meta's hazard classifier (v3: 8B text, 8 langs; v4: 12B multimodal) |
| Input moderation | "pre-generation filter" | Classifier on user prompt before model call |
| Output moderation | "post-generation filter" | Classifier on model output before delivery |
| Custom moderation | "domain rules" | Deployment-specific rules (regex, allowlist, policy) |
| Layered moderation | "all three layers" | Standard production deployment pattern |

## 더 많은 읽기

- [OpenAI Moderation API docs](https://platform.openai.com/docs/api-reference/moderations) 오니중중화 최종점
- [Meta PurpleLlama + Llama Guard](https://github.com/meta-llama/PurpleLlama) 라마 경비대
- [Google Jigsaw Perspective API](https://perspectiveapi.com/) 독성 점수를
- [Azure AI Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/) Azure 대체
