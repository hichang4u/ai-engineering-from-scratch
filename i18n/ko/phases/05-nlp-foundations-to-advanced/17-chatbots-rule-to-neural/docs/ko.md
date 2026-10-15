# 채팅봇  규칙 기반에서 신경에서 LLM 에이전트

> ELIZA는 패턴 일치로 응답했습니다. DialogFlow는 의도를 지도했습니다. GPT는 무게에서 응답했습니다. 클로드는 도구를 실행하고 확인합니다. 각 시대는 이전의 최악의 실패를 해결했습니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 13 (Question Answering), Phase 5 · 14 (Information Retrieval)
**Time:** ~75 minutes

## 문제

사용자가 "내 비행기를 변경하고 싶다"고 말합니다. 시스템은 그들이 원하는 것, 부족한 정보가, 그것을 얻는 방법, 그리고 작업을 완료하는 방법을 알아내야 합니다. 그러면 사용자는 "잠깐, 대신 취소하면 어떨까요?"라고 말합니다. 그리고 시스템은 맥락을 기억하고, 작업을 변경하고 상태를 보존해야 합니다.

대화는 ML 시스템에서 어렵기 때문입니다. 입력은 개방적입니다. 출력은 여러 차례에 걸쳐 일관되게 있어야합니다. 시스템은 세계에 작용해야합니다. (비행을 변경하고 카드를 충전하십시오). 모든 잘못된 단계는 사용자에게 눈에 띄습니다.

채봇 아키텍처는 4가지 패러다임을 통해 순환해 왔으며, 각각이 도입된 이유는 이전이 너무 눈에 띄게 실패했기 때문입니다. 이 교훈은 그들을 순서대로 진행합니다. 2026년 생산 풍경은 마지막 두 가지의 하이브리드입니다.

## 개념

![Chatbot evolution: rule-based → retrieval → neural → agent](../assets/chatbot.svg)

### 1950~2001년, 각본의 반세기

첫 번째 패러다임은 5년 동안 지속되지 않았습니다. 50년 동안 지속되었습니다. 그 아크를 아는 것은 모든 시스템이 같은 기계이기 때문에 중요합니다.

**1950.**투링은 "기계들이 생각할 수 있을까?"를 회피하여, 운영적 대체제를 제안한다. 질문자가 텔레타이프를 통해 기계와 사람을 구분할 수 없다면, 철학적 질문은 논쟁이 된다. 대화는 분야가 이름을 가질 때까지 해당 분야의 기준이 된다.

**1956.**이 이름은 다트머스에서 열리는 여름 워크숍에서 "인공 지능"이라는 동전을 내놓으며, 지능의 모든 특징은 "원칙적으로 기계가 그것을 시뮬레이션할 수 있을 정도로 정확하게 묘사될 수 있다는 추측을 내놓았다. " 제안은 상당한 발전을 위해 2개월의 예산을 내놓는다.

**1966.**ELIZA는 1단계에서 구축하는 반사 트릭을 배포합니다. 분해 규칙은 입력에서 조각을 끌어내고, 재조립 규칙은 질문을 되풀이합니다. 전체 200개의 패턴, 제로 상태, 제로 이해  그리고 사용자는 어쨌든 그것에 신뢰했습니다. 웨이젠바움은 얼마나 적은 기계가 필요하다는 것에 대해 불안감을 느끼며 남은 경력을 보냈다.

**1972.**스탠퍼드에서 파리라는 사람이 패러노이아를 모델로 삼고, ELIZA가 부족한 부분을 추가합니다. 두려움, 분노, 불신을 나타내는 수치 변수는 각 회전과 문에서 업데이트됩니다. 스크립트가 다음으로 발사되는 경우, 따라서 동일한 입력은 지금까지의 대화에 따라 다른 반응을 생성합니다. 시각화된 표본 테스트에서 정신과 의사들은 PARRY를 우연히 인간 환자들로부터 구별했습니다. 그것은 개인 조건의 직접적인 조상입니다. 같은 해, 두 로봇은 ARPANET를 통해 서로 겨냥했습니다. 정신분열 상태 기계를 인터뷰하는 치료사 스크립트, 네트워크에서 처음으로 로봇과 로봇의 대화를 나누는 것입니다.

**1995.**AIML (XML 방언) 를 통해 ELIZA 레시피를 확장합니다. 약 40,000개의 손으로 작성된 카테고리, 세 번의 로브너 상 수상. 규칙 기반 시스템의 확장 법칙을 증명했습니다. 더 많은 규칙은 커버리를 구입합니다, 결코 일반적입니다. 모든 규칙은 누군가가 유지해야 할 책임입니다.

**2001.**스마터칠드는 30백만 명의 인스턴트 메신저 사용자 앞에 레시피를 올려놓고  날씨, 주식, 영화 시간 을 템플릿으로 엮어 넣습니다. 스쿼트와 2001 의 의상을 입고 전화하는 도구입니다. 의도를 분석하고 서비스를 호출하고 결과를 응답에 전달합니다.

50년, 하나의 메커니즘, 증가하는 규칙이 중요해요. 패러다임은 아무도 그것을 부정했기 때문에 끝나는 것이 아니라 손으로 작성된 상태 기계의 유지보수 비용이 커지는 것이 커지고 있습니다.

```figure
chatbot-lineage
```

**Rule-based (ELIZA, AIML, DialogFlow).**손으로 작성된 패턴은 사용자 입력과 일치하여 응답을 생성합니다. 의도 분류기는 미리 정의된 흐름으로 이동합니다. 슬롯을 채우는 상태 기계는 필요한 정보를 수집합니다. 설계된 좁은 범위 내에서 훌륭하게 작동합니다. 바로 그 외부에서 실패합니다. 여전히 환각을 용납하지 않는 안전 비중있는 영역 (은행 인증, 항공 예약) 에 배포됩니다.

**Retrieval-based.**FAQ 방식의 시스템. 각 쌍의 (언어, 응답) 을 암호화하십시오. 실행 시, 사용자의 메시지를 암호화하고 가장 가까운 저장된 응답을 검색하십시오. Zendesk의 고전적인 "동종 기사" 기능을 생각해보십시오. 규칙보다 더 나은 문구를 처리합니다. 세대도 없습니다. 그래서 환각도 없습니다.

**Neural (seq2seq).**대화 로그에서 훈련된 엔코더 디코더. 처음부터 응답을 생성합니다. 유창하지만 일반 출력 ("나는 모른다") 및 사실 유동에 유력합니다. 주제에 대한 신뢰도가 없습니다. 구글, 페이스북, 마이크로소프트 모두 2016-2019 년에 실망스러운 채팅봇을 가지고 있었던 이유입니다.

**LLM agents.**언어 모델은 계획, 도구 호출, 결과를 확인하는 루프에 포장되어 있습니다. 긴 프롬프트를 가진 채팅 로봇이 아닙니다. 에이전트 루프: 계획 → 호출 도구 → 결과를 관찰합니다. 다음 단계를 결정합니다. 검색-첫 지형 (RAG) 은 환각을 막습니다. 도구 호출은 실제로 일을 할 수 있습니다. 이것은 2026 건축입니다.

4개의 패러다임은 순차적인 대체가 아닙니다. 2026년 생산 채팅봇은 네 가지 방법을 통해 진행합니다. 인증 및 파괴적인 행동을 위한 규칙 기반, FAQ에 대한 검색, 자연적인 문장화를 위한 신경 생성, 모호한 오픈 엔드 쿼리들을 위한 LLM 에이전트.

## 건설 해

### 단계 1: 규칙에 근거한 패턴 일치

```python
import re


class RulePattern:
    def __init__(self, pattern, response_template):
        self.regex = re.compile(pattern, re.IGNORECASE)
        self.template = response_template


PATTERNS = [
    RulePattern(r"my name is (\w+)", "Nice to meet you, {0}."),
    RulePattern(r"i (need|want) (.+)", "Why do you {0} {1}?"),
    RulePattern(r"i feel (.+)", "Why do you feel {0}?"),
    RulePattern(r"(.*)", "Tell me more about that."),
]


def rule_based_respond(user_input):
    for pattern in PATTERNS:
        m = pattern.regex.match(user_input.strip())
        if m:
            return pattern.template.format(*m.groups())
    return "I don't understand."
```

20 줄에 있는 ELIZA. 반사 트릭 ("나는 슬프다" → "왜 슬프다") 는 1966년 웨이젠바움에서 나온 정통 심리 치료사 데모이다. 여전히 교훈적이다.

### 단계 2: 검색 기반 (FAQ)

이 예시적인 단편은`pip install sentence-transformers`(불을 끄는)  실행 가능한`code/main.py`이 수업에서는 Stdlib Jaccard 유사성을 사용하므로 수업은 외부 의존 없이 실행됩니다.

```python
from sentence_transformers import SentenceTransformer
import numpy as np


FAQ = [
    ("how do i reset my password", "Go to Settings > Security > Reset Password."),
    ("how do i cancel my order", "Go to Orders, find the order, click Cancel."),
    ("what is your return policy", "30-day returns on unused items, original packaging."),
]


encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
faq_questions = [q for q, _ in FAQ]
faq_embeddings = encoder.encode(faq_questions, normalize_embeddings=True)


def faq_respond(user_input, threshold=0.5):
    q_emb = encoder.encode([user_input], normalize_embeddings=True)[0]
    sims = faq_embeddings @ q_emb
    best = int(np.argmax(sims))
    if sims[best] < threshold:
        return None
    return FAQ[best][1]
```

최선의 일치가 충분히 가까이 있지 않으면 반환 `None`그리고 시스템이 격화될 수 있도록

### 단계 3: 신경 생성 (기본)

작은 명령어 조율된 엔코더-독호더 (FLAN-T5) 또는 정밀화된 대화 모델을 사용하십시오. 2026년에 자체적으로 사용이 불가능한 생산 (충돌, 주제 외의 추동, 사실적인 노 nonsense), 하지만 자연적인 표현을 위한 하이브리드 시스템 안에 배. DialoGPT 스타일의 디코더만 사용하는 모델들은 일관된 답변을 생성하기 위해 명시적인 턴 분리기와 EOS 핸들링이 필요합니다.

```python
from transformers import pipeline

chatbot = pipeline("text2text-generation", model="google/flan-t5-small")

response = chatbot("Respond politely to: Hi there!", max_new_tokens=40)
print(response[0]["generated_text"])
```

### 단계 4: LLM 에이전트 루프

2026년 생산 형태:

```python
def agent_loop(user_message, tools, llm, max_steps=5):
    history = [{"role": "user", "content": user_message}]
    for _ in range(max_steps):
        response = llm(history, tools=tools)
        tool_call = response.get("tool_call")
        if tool_call:
            tool_name = tool_call.get("name")
            args = tool_call.get("arguments")
            if not isinstance(tool_name, str) or tool_name not in tools:
                history.append({"role": "assistant", "tool_call": tool_call})
                history.append({"role": "tool", "name": str(tool_name), "content": f"error: unknown tool {tool_name!r}"})
                continue
            if not isinstance(args, dict):
                history.append({"role": "assistant", "tool_call": tool_call})
                history.append({"role": "tool", "name": tool_name, "content": f"error: arguments must be a dict, got {type(args).__name__}"})
                continue
            fn = tools[tool_name]
            result = fn(**args)
            history.append({"role": "assistant", "tool_call": tool_call})
            history.append({"role": "tool", "name": tool_name, "content": result})
        else:
            return response["content"]
    return "I could not complete the task in the step budget."
```

3가지 명칭을 붙여볼게요. 도구는 LLM가 호출할 수 있는 기능입니다. LLM가 도구 호출 대신 최종 답변을 반환하면 루프가 종료됩니다. 단계 예산은 모호한 작업에 무한한 루프를 방지합니다.

실제 생산은: 검색-첫 지형 (LLM 호출 전 관련 문서의 주입), 경비 (확인없이 파괴적인 행동을 거부), 관찰성 (모든 단계를 기록), 그리고 평가 (원 행동의 특성에 유지되는 자동 검증) 를 추가합니다.

### 단계 5: 하이브리드 라우팅

```python
def hybrid_chat(user_input):
    if is_destructive_action(user_input):
        return structured_flow(user_input)

    faq_answer = faq_respond(user_input, threshold=0.6)
    if faq_answer:
        return faq_answer

    return agent_loop(user_input, tools, llm)


def is_destructive_action(text):
    danger_words = ["delete", "cancel", "charge", "refund", "transfer"]
    return any(w in text.lower() for w in danger_words)
```

패턴은 파괴적인 모든 것에 대한 결정적 규칙, 수박 FAQ에 대한 검색, 다른 모든 것에 대한 LLM 에이전트입니다. 2026년 고객 지원 시스템에서 발송되는 것입니다.

## 사용 하 고

2026년 스택:

| Use case | Architecture |
|---------|---------------|
| Booking, payment, authentication | Rule-based state machines + slot filling |
| Customer support FAQs | Retrieval over curated answers |
| Open-ended help chat | LLM agent with RAG + tool calls |
| Internal tools / IDE assistants | LLM agent with tool calls (search, read, write) |
| Companion / character chatbots | Tuned LLM with persona system prompt, retrieval on knowledge |

항상 생산에서 하이브리드 라우팅을 사용하십시오. 단일 아키텍처는 모든 요청을 잘 처리하지 않습니다. 라우팅 레이어는 일반적으로 작은 의도 분류자입니다.

## 여전히 배포되는 실패 모드

- **Confident fabrication.**LLM 에이전트는 하지 않은 행동을 완료했다고 주장합니다. 완화: 결과를 확인, 도구 호출 로그, 도구 반환이 성공하지 않은 채 LLM가 무언가를 수행했다고 주장하지 못하게하십시오.
- **Prompt injection.**사용자 는 시스템 프롬프트 를 우월 하는 텍스트 를 삽입 합니다. OWASP LLM 애플리케이션 2025 년 10위 로 LLM01 순위 를 차지 합니다. 두 가지 맛: 직접 주입 (방담회에 붙여진) 및 간접 주입 (기록, 이메일 또는 도구 출력에서 숨겨진) 에이전트가 읽는다.

  공격률은 각 시나리오에 따라 다릅니다. 측정된 성공률은 일반 도구 사용 및 코딩 기준에 따라 한계 모델마다 ~0.5-8.5% 정도입니다. 특정 고위험 설정 (AI 코딩 에이전트에 대한 적응 공격, 취약한 오케스트레이션) 은 ~ 84%에 달했습니다. 생산 CVEs에는 EchoLeak (CVE-2025-32711, CVSS 9.3) 가 포함됩니다. Microsoft 365 Copilot에서 공격자가 제어하는 이메일로 인해 발생하는 제로 클릭 데이터 해출 오류.

  완화: 사용자 입력을 루프 전체에 신뢰할 수 없는 것으로 간주하십시오. 도구 호출 전에 정제하십시오. 주요 명령에서 도구 출력을 격리하십시오. 에이전트가 먼저 계획을 계획하고 실행하기 전에 그 계획에 대한 모든 행동을 확인하는 플랜-확인-실행 (PVE) 패턴을 사용하십시오. (이것이 새로운 계획되지 않은 작업을 주입하는 도구 결과를 막습니다); 파괴적인 행동에 대한 사용자 확인을 요구합니다. 도구 범위에 최소한의 특권을 적용하십시오.

  이 위험을 완전히 제거하는 신속한 엔지니어링은 없습니다. 외부 실행 시간 방어 계층 (LLM 경비, 허용자 검증, 의미적 기호 탐지) 은 필요합니다.
- **Scope creep.**에이전트는 도구 호출이 대수관련 정보를 반환했기 때문에 작업을 종료합니다. 완화: 좁은 도구 계약; 시스템을 즉시 집중하십시오; 작업 속도에 대한 평가 추가.
- **Infinite loops.**에이전트가 같은 도구를 계속 호출합니다. 완화: 단계 예산, 도구 호출 배제, LLM 판사는 "우리는 진보하고 있습니까".
- **Context window exhaustion.**긴 대화는 가장 오래된 회전을 맥락에서 밀어냅니다. 완화: 오래된 회전을 요약하거나 유사성으로 관련 된 과거 회전을 검색하거나 긴 맥락 모델을 사용합니다.

## 선박

`outputs/skill-chatbot-architect.md`이 부분의 본문은

```markdown
---
name: chatbot-architect
description: Design a chatbot stack for a given use case.
version: 1.0.0
phase: 5
lesson: 17
tags: [nlp, agents, chatbot]
---

Given a product context (user need, compliance constraints, available tools, data volume), output:

1. Architecture. Rule-based, retrieval, neural, LLM agent, or hybrid (specify which paths go where).
2. LLM choice if applicable. Name the model family (Claude, GPT-4, Llama-3.1, Mixtral). Match to tool-use quality and cost.
3. Grounding strategy. RAG sources, retrieval method (see lesson 14), tool contracts.
4. Evaluation plan. Task success rate, tool-call correctness, off-task rate, hallucination rate on held-out dialogs.

Refuse to recommend a pure-LLM agent for any destructive action (payments, account deletion, data modification) without a structured confirmation flow. Refuse to skip the prompt-injection audit if the agent has write access to anything.
```

## 운동

1. **Easy.**커피숍 주문 로봇에 대한 10 개의 패턴으로 위의 규칙 기반 응답을 구현하십시오. 테스트 가장자리 경우: 이중 주문, 수정, 취소, 명확하지 않은 의도.
2. **Medium.**하이브리드 FAQ + LLM fallback을 구축합니다. SaaS 제품 50 개의 접시에 있는 FAQ 항목, DOC 사이트에서 검색을 통해 LLM fallback. 100 개의 실제 지원 질문에 대한 거부율과 정확성을 측정합니다.
3. **Hard.**위의 에이전트 루프를 세 가지 도구 (찾기, 읽기 사용자 데이터, 이메일 전송) 로 구현하십시오. 신속한 주입 시도를 포함한 50 가지 테스트 시나리오를 사용하여 평가 실행하십시오. 작업 종료율, 작업 실패율 및 임의의 주입 성공률을 보고하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Intent | What the user wants | Categorical label (book_flight, reset_password). Routed to a handler. |
| Slot | A piece of info | Parameter the bot needs (date, destination). Slot filling is the sequence of asks. |
| RAG | Retrieval plus generation | Retrieve relevant docs, then ground the LLM's response. |
| Tool call | Function invocation | LLM emits a structured call with name + args. Runtime executes, returns result. |
| Agent loop | Plan, act, verify | Controller that runs LLM calls interleaved with tool calls until task complete. |
| Prompt injection | User attacks prompt | Malicious input that tries to override the system prompt. |

## 더 많은 읽기

- [Turing (1950). Computing Machinery and Intelligence](https://academic.oup.com/mind/article/LIX/236/433/986238) 대화가 이 분야의 기준이 된 논문.
- [Weizenbaum (1966). ELIZA — A Computer Program For the Study of Natural Language Communication](https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf) 규칙 기반의 원본 채팅봇 문서
- [Colby, Weber, Hilf (1971). Artificial Paranoia](https://doi.org/10.1016/0004-3702(71)90002-6)  PARRY의 영향변형 아키텍처, 최초의 상태가 풍부한 채팅봇
- [Thoppilan et al. (2022). LaMDA: Language Models for Dialog Applications](https://arxiv.org/abs/2201.08239) 구글의 신경 채팅 로봇 논문, LLM 에이전트가 취임하기 직전
- [Yao et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) 에이전트 루프 패턴을 지은 논문
- [Anthropic's guide on building effective agents](https://www.anthropic.com/research/building-effective-agents) 2024년 생산 예측은 2026년에도 유효합니다.
- [Greshake et al. (2023). Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) 신속한 주입 서류
- [OWASP Top 10 for LLM Applications 2025 — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) 신속한 주사를 최우선 보안 문제로 만든 순위
- [AWS — Securing Amazon Bedrock Agents against Indirect Prompt Injections](https://aws.amazon.com/blogs/machine-learning/securing-amazon-bedrock-agents-a-guide-to-safeguarding-against-indirect-prompt-injections/) 계획-확인-실행 및 사용자-확인 흐름을 포함한 실용적인 오케스트레이션 계층 방어
- [EchoLeak (CVE-2025-32711)](https://www.vectra.ai/topics/prompt-injection) 간접 프롬프트 주입에서 비정상적 제로 클릭 데이터 해제 CVE. 기록 액세스 에이전트가 런타임 방어에 필요한 이유에 대한 참조 사례.
