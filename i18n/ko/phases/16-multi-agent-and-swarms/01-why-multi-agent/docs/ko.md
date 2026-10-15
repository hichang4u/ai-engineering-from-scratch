# 왜 다중 요원?

> 한 대리인이 벽에 타격을 당하는 것은 더 큰 대리인이 아니라 더 많은 대리인이 되는 것입니다.

**Type:** Learn
**Languages:** TypeScript
**Prerequisites:** Phase 14 (Agent Engineering)
**Time:** ~60 minutes

## 학습 목표

- 단일 요인 천장을 확인하고 (사태적 과잉, 혼합 전문 지식, 순차적 병목) 여러 요인에 분할이 올바른 움직임이 될 때 설명
- 오케스트레이션 패턴 (파이프라인, 병렬 팬아웃, 감독, 계층) 을 비교하고 주어진 작업 구조에 적합한 것을 선택하십시오
- 명확한 역할 경계를 가진 멀티 에이전트 시스템을 설계하고 공유 상태와 통신 계약
- 멀티 에이전트 복잡성의 타협을 분석 (연연, 비용, 디버깅 어려움) 와 단일 에이전트 단순성

## 문제

14단계에서는 하나의 에이전트를 만들었습니다. 그것은 작동합니다. 파일을 읽고 명령어를 실행하고 API를 호출하고 결과를 논할 수 있습니다. 그러면 실제 코드베이스에 지향합니다. 200개의 파일, 세 가지 언어, 인프라에 의존하는 테스트, 코드를 작성하기 전에 외부 API를 조사해야 할 요구 사항입니다.

에이전트는 질식한다. LLM가 멍청하기 때문이 아니라, 하나의 에이전트 루프가 처리할 수 있는 것을 넘어서기 때문에. 맥락 창은 파일 내용으로 가득 차 있다. 에이전트는 40번 전에 읽은 것을 잊고 있습니다. 연구자, 코더, 리뷰어 같은 시간에 되고, 세 가지를 모두 잘하지 않습니다.

이건 단일 요원 천장입니다. 어떤 작업이 필요할 때마다

- **More context than fits in one window**- 50개의 파일을 읽고 200만개의 토큰을 넘어서게 됩니다
- **Different expertise at different stages**- 연구에는 코드 생성과 다른 동기 부여가 필요합니다
- **Work that can happen in parallel**- 왜 3개의 파일을 연속적으로 읽을 수 있는 거죠?

## 개념

### 단 한 대리자 천장

하나의 에이전트는 하나의 루프, 하나의 컨텍스트 윈도우, 하나의 시스템 명령어입니다.

```
┌─────────────────────────────────────────┐
│            SINGLE AGENT                 │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         Context Window            │  │
│  │                                   │  │
│  │  research notes                   │  │
│  │  + code files                     │  │
│  │  + test output                    │  │
│  │  + review feedback                │  │
│  │  + API docs                       │  │
│  │  + ...                            │  │
│  │                                   │  │
│  │  ██████████████████████ FULL ███  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  One system prompt tries to cover       │
│  research + coding + review + testing   │
│                                         │
│  Result: mediocre at everything         │
└─────────────────────────────────────────┘
```

세 가지가 깨지는 것

1. **Context saturation**30회에 이르면 에이전트가 150만 개의 파일 내용, 명령 출력 및 사전 추론을 소비했습니다. 5회에 대한 중요한 세부 사항은 사라집니다.

2. **Role confusion**"당신은 연구자, 코더, 리뷰어, 테스트자"라고 하는 시스템 명령어에서 반 연구, 반 코드, 그리고 결코 검토를 끝내는 에이전트가 생성됩니다.

3. **Sequential bottleneck**에이전트가 파일 A, 파일 B, 파일 C를 읽습니다. 세 번의 LLM 전화, 세 번의 도구 실행,

### 다중 요원 해결책

각 에이전트에 하나의 작업, 하나의 컨텍스트 윈도우, 그리고 그 작업에 맞춰진 하나의 시스템 명령어

```
┌──────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                          │
│                                                          │
│  "Build a REST API for user management"                  │
│                                                          │
│         ┌──────────┬──────────┬──────────┐               │
│         │          │          │          │               │
│         ▼          ▼          ▼          ▼               │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│   │RESEARCHER│ │  CODER   │ │ REVIEWER │ │  TESTER  │  │
│   │          │ │          │ │          │ │          │  │
│   │ Reads    │ │ Writes   │ │ Checks   │ │ Runs     │  │
│   │ docs,    │ │ code     │ │ code     │ │ tests,   │  │
│   │ finds    │ │ based on │ │ quality, │ │ reports  │  │
│   │ patterns │ │ research │ │ finds    │ │ results  │  │
│   │          │ │ + spec   │ │ bugs     │ │          │  │
│   └─────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│         │           │            │             │         │
│         └───────────┴────────────┴─────────────┘         │
│                          │                               │
│                     Merge results                        │
└──────────────────────────────────────────────────────────┘
```

각 에이전트는
- 집중 시스템 명령어 ("당신은 코드 검토자입니다. 유일한 작업은 버그를 찾는 것입니다. ")
- 자신의 컨텍스트 창 (다른 요인의 작업으로 오염되지 않은)
- 명확한 입력/출력 계약 (연구 메모, 출력 코드 수신)

### 이 일을 하는 실제 시스템

**Claude Code subagents**- 클로드 코드가 을 낳을 때`Task`부모는 그 내용을 깨끗하게 유지합니다. 아이는 집중적인 작업을 하고 요약을 반환합니다.

**Devin**- 계획자 에이전트, 코더 에이전트, 브라우저 에이전트를 실행합니다. 계획자는 작업을 단계로 나눕니다. 코더는 코드를 작성합니다. 브라우저는 문서를 조사합니다. 각각은 개별적인 맥락을 가지고 있습니다.

**Multi-agent coding teams (SWE-bench)**- SWE 벤치에서 가장 높은 성능을 가진 시스템은 코드베이스를 읽는 연구자, 수정 작업을 설계하는 계획자, 그리고 그것을 구현하는 코더를 사용합니다.

**ChatGPT Deep Research**- 여러 검색 에이전트를 병렬적으로 생성하고 각자가 다른 각도를 탐구하고 결과를 합성합니다.

### 스펙트럼

다중 에이전트는 바이너리가 아니라 스펙트럼입니다.

```
SIMPLE ──────────────────────────────────────────── COMPLEX

 Single        Sub-         Pipeline      Team         Swarm
 Agent         agents

 ┌───┐       ┌───┐        ┌───┐───┐    ┌───┐───┐    ┌─┐┌─┐┌─┐
 │ A │       │ A │        │ A │ B │    │ A │ B │    │ ││ ││ │
 └───┘       └─┬─┘        └───┘─┬─┘    └─┬─┘─┬─┘    └┬┘└┬┘└┬┘
               │                │        │   │       ┌┴──┴──┴┐
             ┌─┴─┐          ┌───┘───┐    │   │       │shared │
             │ a │          │ C │ D │  ┌─┴───┴─┐    │ state │
             └───┘          └───┘───┘  │  msg   │    └───────┘
                                       │  bus   │
 1 loop      Parent +      Stage by    │       │    N peers,
 1 context   child tasks   stage       └───────┘    emergent
                                       Explicit      behavior
                                       roles
```

**Single agent**- 한 루프, 한 , 간단한 작업에 적합합니다.

**Subagents**부모는 집중된 과제를 위해 아이를 낳고 부모는 계획을 유지합니다. 아이들은 보고합니다. 클로드 코드가 하는 일이죠.

**Pipeline**- 에이전트들이 순서대로 실행됩니다. 에이전트 A의 출력은 에이전트 B의 입력으로 변합니다. 단계적인 작업 흐름에 적합합니다.

**Team**- 에이전트들은 공유 메시지 버스와 병행으로 운영됩니다. 각각의 역할은 있습니다. 오케스트레이터 코디네이트.

**Swarm**- 같은 상태의 대리인이 많고 거의 같은 상태의 대리인이 많고 고정된 오케스트레이터도 없고, 대리인이 줄을 서서 일을 처리하는 것이 좋습니다.

### 여러 요원 을 가진 네 가지 패턴

#### 패턴 1: 파이프라인

```
Input ──▶ Agent A ──▶ Agent B ──▶ Agent C ──▶ Output
          (research)  (code)      (review)
```

각각의 요원은 데이터를 변환하고 전달합니다. 논리적으로 간단합니다. 한 단계의 실패는 나머지 부분을 차단합니다.

#### 패턴 2: 아웃 / 아입

```
                ┌──▶ Agent A ──┐
                │              │
Input ──▶ Split ├──▶ Agent B ──├──▶ Merge ──▶ Output
                │              │
                └──▶ Agent C ──┘
```

평행 에이전트를 통해 작업을 나누고 결과를 합쳐라

#### 패턴 3: 오케스트레이터-노동자

```
                    ┌──────────┐
                    │  Orch.   │
                    └──┬───┬───┘
                  task │   │ task
                 ┌─────┘   └─────┐
                 ▼               ▼
           ┌──────────┐   ┌──────────┐
           │ Worker A │   │ Worker B │
           └──────────┘   └──────────┘
```

똑똑한 오케스트레이터 는 어떤 일을 해야 할지 결정 하고, 노동자들에게 위임 하고, 결과를 합성 합니다. 오케스트레이터 는 자신 은 노동자 를 낳기 위한 도구 를 가진 에이전트 입니다.

#### 4번째 패턴: 동학자 집단

```
         ┌───┐ ◄──── msg ────▶ ┌───┐
         │ A │                  │ B │
         └─┬─┘                  └─┬─┘
           │                      │
      msg  │    ┌───────────┐     │ msg
           └───▶│  Shared   │◄────┘
                │  State    │
           ┌───▶│  / Queue  │◄────┐
           │    └───────────┘     │
      msg  │                      │ msg
         ┌─┴─┐                  ┌─┴─┐
         │ C │ ◄──── msg ────▶ │ D │
         └───┘                  └───┘
```

중앙 오케스트레이터도 없고, 에이전트가 피어-투-피어로 소통하고, 의사결정이 상호작용으로 나오고, 디버깅이 어렵지만, 많은 에이전트에게 확장됩니다.

### 다중 요원 을 사용 하지 않는 시점

멀티 에이전트 (Multi-agent) 는 복잡성을 더합니다. 에이전트들 사이의 모든 메시지는 잠재적인 실패점입니다. 디버깅은 "하나의 대화를 읽으십시오"에서 "5명의 에이전트들 사이의 메시지를 추적하십시오".

**Stay single-agent when:**
- 작업은 하나의 컨텍스트 창에 적합합니다 (~ 100k 작업 데이터 토큰 이하)
- 다른 단계에 대해 다른 시스템 명령이 필요하지 않습니다.
- 순서적 실행은 충분히 빠르다
- 이 작업은 너무 간단해서 분할하면 가치보다 더 많은 비용이 추가됩니다.

**The complexity cost:**
- 모든 에이전트 경계는 손실적 압축 단계입니다. 에이전트 A의 전체 맥락은 에이전트 B의 메시지로 요약됩니다.
- 조정 논리 (누가 무엇을, 언제, 어떤 순서로 하는) 는 자신의 버그의 원천입니다
- 지연률이 증가: N 에이전트란 N 일련 LLM 호출이 최소, 앞으로 거꾸로 이야기 할 필요가 있는 경우 더
- 비용 곱셈: 각 에이전트는 토큰을 독립적으로 태우습니다

엄지손가락 규칙: 작업이 20개 이상의 도구 호출을 필요로 하고 100k 토큰에 맞게 되면, 단일 에이전트를 유지하세요.

```figure
swarm-messages
```

## 건설 해

### 단계 1: 과장된 단독 요원

여기 하나의 에이전트가 모든 것을 하려고 합니다. 그것은 하나의 거대한 시스템 프롬프트와 하나의 컨텍스트 창을 가지고 있습니다. 연구, 코드, 리뷰를 저장합니다.

```typescript
type AgentResult = {
  content: string;
  tokensUsed: number;
  toolCalls: number;
};

async function singleAgentApproach(task: string): Promise<AgentResult> {
  const systemPrompt = `You are a full-stack developer. You must:
1. Research the requirements
2. Write the code
3. Review the code for bugs
4. Write tests
Do ALL of these in a single conversation.`;

  const contextWindow: string[] = [];
  let totalTokens = 0;
  let totalToolCalls = 0;

  const research = await fakeLLMCall(systemPrompt, `Research: ${task}`);
  contextWindow.push(research.output);
  totalTokens += research.tokens;
  totalToolCalls += research.calls;

  const code = await fakeLLMCall(
    systemPrompt,
    `Given this research:\n${contextWindow.join("\n")}\n\nNow write code for: ${task}`
  );
  contextWindow.push(code.output);
  totalTokens += code.tokens;
  totalToolCalls += code.calls;

  const review = await fakeLLMCall(
    systemPrompt,
    `Given all previous context:\n${contextWindow.join("\n")}\n\nReview the code.`
  );
  contextWindow.push(review.output);
  totalTokens += review.tokens;
  totalToolCalls += review.calls;

  return {
    content: contextWindow.join("\n---\n"),
    tokensUsed: totalTokens,
    toolCalls: totalToolCalls,
  };
}
```

이 접근 방식의 문제점:
- 컨텍스트 창은 각 단계에 따라 커집니다. 검토 단계에 의해, 그것은 연구 노트를 포함하고 코드 및 이전 추론을 포함합니다.
- 시스템 명령어는 일반적입니다. 각 단계에 맞춰서 조정할 수 없습니다.
- 아무 것도 병렬히 진행되지 않습니다.

### 2단계: 전문 요원

이제 분할해 주면 각 에이전트가 한 가지 일을 할 수 있어요

```typescript
type SpecialistAgent = {
  name: string;
  systemPrompt: string;
  run: (input: string) => Promise<AgentResult>;
};

function createSpecialist(name: string, systemPrompt: string): SpecialistAgent {
  return {
    name,
    systemPrompt,
    run: async (input: string) => {
      const result = await fakeLLMCall(systemPrompt, input);
      return {
        content: result.output,
        tokensUsed: result.tokens,
        toolCalls: result.calls,
      };
    },
  };
}

const researcher = createSpecialist(
  "researcher",
  "You are a technical researcher. Read documentation, find patterns, and summarize findings. Output only the facts needed for implementation."
);

const coder = createSpecialist(
  "coder",
  "You are a senior TypeScript developer. Given requirements and research notes, write clean, tested code. Nothing else."
);

const reviewer = createSpecialist(
  "reviewer",
  "You are a code reviewer. Find bugs, security issues, and logic errors. Be specific. Cite line numbers."
);
```

각 전문가는 집중된 명령어를 가지고 있습니다. 각자는 필요한 입력만 있는 깨끗한 컨텍스트 창을 얻습니다.

### 3단계: 메시지 를 통해 조정

전문가를 연결해 뚜렷한 메시지를 전달합니다.

```typescript
type AgentMessage = {
  from: string;
  to: string;
  content: string;
  timestamp: number;
};

async function multiAgentApproach(task: string): Promise<AgentResult> {
  const messages: AgentMessage[] = [];
  let totalTokens = 0;
  let totalToolCalls = 0;

  const researchResult = await researcher.run(task);
  messages.push({
    from: "researcher",
    to: "coder",
    content: researchResult.content,
    timestamp: Date.now(),
  });
  totalTokens += researchResult.tokensUsed;
  totalToolCalls += researchResult.toolCalls;

  const coderInput = messages
    .filter((m) => m.to === "coder")
    .map((m) => `[From ${m.from}]: ${m.content}`)
    .join("\n");

  const codeResult = await coder.run(coderInput);
  messages.push({
    from: "coder",
    to: "reviewer",
    content: codeResult.content,
    timestamp: Date.now(),
  });
  totalTokens += codeResult.tokensUsed;
  totalToolCalls += codeResult.toolCalls;

  const reviewerInput = messages
    .filter((m) => m.to === "reviewer")
    .map((m) => `[From ${m.from}]: ${m.content}`)
    .join("\n");

  const reviewResult = await reviewer.run(reviewerInput);
  messages.push({
    from: "reviewer",
    to: "orchestrator",
    content: reviewResult.content,
    timestamp: Date.now(),
  });
  totalTokens += reviewResult.tokensUsed;
  totalToolCalls += reviewResult.toolCalls;

  return {
    content: messages.map((m) => `[${m.from} -> ${m.to}]: ${m.content}`).join("\n\n"),
    tokensUsed: totalTokens,
    toolCalls: totalToolCalls,
  };
}
```

각 에이전트는 자신에게 보낸 메시지만 수신합니다. 컨텍스트 오염은 없습니다. 연구자의 50만 개의 문서 읽기 토큰은 리뷰어의 맥락에 들어가지 않습니다.

### 4단계: 비교

```typescript
async function compare() {
  const task = "Build a rate limiter middleware for an Express.js API";

  console.log("=== Single Agent ===");
  const single = await singleAgentApproach(task);
  console.log(`Tokens: ${single.tokensUsed}`);
  console.log(`Tool calls: ${single.toolCalls}`);

  console.log("\n=== Multi-Agent ===");
  const multi = await multiAgentApproach(task);
  console.log(`Tokens: ${multi.tokensUsed}`);
  console.log(`Tool calls: ${multi.toolCalls}`);
}
```

멀티 에이전트 버전은 더 많은 토큰을 사용합니다 (삼 에이전트, 세 개의 별도의 LLM 호출) 하지만 각 에이전트의 맥락은 깨끗합니다. 시스템 프롬프트가 전문화되어 있기 때문에 각 단계의 품질이 향상됩니다.

## 사용 하 고

이 수업은 언제 멀티 에이전트로 가야 할지 결정하는 데 다시 사용할 수 있는 명령어를 만들어 줍니다.`outputs/prompt-multi-agent-decision.md`- 그래

## 운동

1. 네 번째 전문가를 추가합니다. "테스터" 에이전트가 코더로부터 코드를 받고 리뷰어로부터 피드백을 검토하고 테스트를 작성합니다.
2. 리뷰어가 리뷰 루프 (최고 2 라운드) 를 위해 코더에게 피드백을 보낼 수 있도록 파이프라인을 수정하십시오.
3. 순서적 파이프라인을 펀 아웃으로 변환: 연구자와 "필요 분석기" 에이전트를 병렬으로 실행하고, 코더로 전환하기 전에 출력을 합쳐

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Swarm | "A hive mind of AI agents" | A set of peer agents with shared state and no fixed leader. Behavior emerges from local interactions. |
| Orchestrator | "The boss agent" | An agent whose tools include spawning and managing other agents. It plans and delegates but may not do the actual work. |
| Coordinator | "The traffic cop" | A non-agent component (often just code, not an LLM) that routes messages between agents based on rules. |
| Consensus | "The agents agree" | A protocol where multiple agents must reach agreement before proceeding. Used when conflicting outputs need resolution. |
| Emergent behavior | "The agents figured it out themselves" | System-level patterns that arise from agent interactions but were not explicitly programmed. Can be useful or harmful. |
| Fan-out / fan-in | "Map-reduce for agents" | Splitting a task across parallel agents (fan-out), then combining their results (fan-in). |
| Message passing | "Agents talk to each other" | The communication mechanism between agents: structured data sent from one agent to another, replacing shared context windows. |

## 더 많은 읽기

- [The Landscape of Emerging AI Agent Architectures](https://arxiv.org/abs/2409.02977)- 다중 요원 패턴의 조사
- [AutoGen: Enabling Next-Gen LLM Applications](https://arxiv.org/abs/2308.08155)- 마이크로소프트의 멀티 에이전트 대화 프레임워크
- [Claude Code subagents documentation](https://docs.anthropic.com/en/docs/claude-code)- 클로드 코드가 어떻게 탭과 함께
- [CrewAI documentation](https://docs.crewai.com/)- 역할 기반의 다중 에이전트 프레임워크
