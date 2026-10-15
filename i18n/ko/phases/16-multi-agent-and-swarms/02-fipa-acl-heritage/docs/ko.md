# FIPA-ACL의 유산 및 연설법

> MCP, A2A 이전에는 FIPA-ACL가 있었습니다. 2000년 IEEE 지능형 물리 에이전트 재단은 20개의 퍼포먼티브, 두 가지 콘텐츠 언어와 일련의 상호작용 프로토콜을 가진 에이전트 통신 언어를 승인했습니다. 웹에 대한 온톨로지 오버헤드가 너무 무거운 것이었기 때문에 산업에서 사라졌습니다. 하지만 다중 에이전트 시스템의 LLM의 부활은 공식적인 의미론 없이 조용히 동일한 아이디어를 재시행하고 있습니다. JSON 계약은 퍼포먼티브를 대신하고 자연어는 온톨로지들을 대신합니다. 이 수업은 FIPA-ACL를 진지하게 읽습니다. 그래서 2026 프로토콜 결정이 어떤 것이 재발견되고, 어떤 것이 새로운 것인지, 그리고 현재의 파도가 이미 2000년대 해결된 문제를 다시 발견할 것인지 볼 수 있습니다.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

## 문제

2026 년 에 대리인-프로토콜 환경 은 바쁘다. 도구 를 위한 MCP, 대리인 을 위한 A2A, 기업 감사 를 위한 ACP, 분산적 신뢰 를 위한 ANP, 자연어 콘텐츠 를 위한 NLIP, CA-MCP 및 2 십 개 연구 제안 을 위한. 각 스펙 은 기초적 으로 선언 합니다.

솔직하게 보면, 그들 대부분은 20년 전의 결정의 나무를 다시 발견하고 있습니다. 오스틴 (1962) 과 세어 (1969) 의 연설 행동 이론은 "언론은 행동이다". KQML (1993) 는 이를 문자 프로토콜로 바꾸었다. FIPA-ACL (정확 2000) 는 20개의 퍼펙티브, 콘텐츠 언어 SL0/SL1, 계약 네트워크 및 가입-신고의 상호작용 프로토콜을 기준 표준화했다. JADE와 JACK는 자바 참조 플랫폼이었다. 2010년 무렵에 온토로지 오버헤드가 너무 무겁고 웹이 승리했기 때문에 노력은 사라졌습니다.

MCP를 보면`tools/call`A2A의 작업 라이프 사이클 또는 CA-MCP의 공유 컨텍스트 스토어에서는 FIPA 의사결정의 부드럽고 JSON 내셔널 재검토를 보고 있습니다.

## 개념

### 연설의 한 문항으로

오스틴은 어떤 문장이 세상을 설명하지 않는다는 것을 알아차렸다. "나는 약속한다". "나는 요청한다". "나는 선언한다". 그는 이 공연적인 발언이라고 불렀습니다. 세어리는 5가지 유형을 공식화했습니다. KQML (Finin et al., 1993) 는 소프트웨어 에이전트들을 위해 이것을 실행적으로 만들었습니다: 메시지는 수행 (행동) 과 콘텐츠 (행동이 무엇인지) 이다. FIPA-ACL는 KQML의 격차를 정리하고 20개의 퍼포먼티를 표준화했습니다.

### FIPA의 20개의 수행자 (부문 목록)

| Performative | Intent |
|---|---|
| `inform` | "I tell you P is true" |
| `request` | "I ask you to do X" |
| `query-if` | "Is P true?" |
| `query-ref` | "What is the value of X?" |
| `propose` | "I propose we do X" |
| `accept-proposal` | "I accept the proposal" |
| `reject-proposal` | "I reject the proposal" |
| `agree` | "I agree to do X" |
| `refuse` | "I refuse to do X" |
| `confirm` | "I confirm P is true" |
| `disconfirm` | "I deny P" |
| `not-understood` | "Your message did not parse" |
| `cfp` | "Call for proposals on X" |
| `subscribe` | "Notify me when X changes" |
| `cancel` | "Cancel the ongoing X" |
| `failure` | "I tried X and failed" |

전체 목록은 `fipa00037.pdf`(FIPA ACL 메시지 구조) 이 점은 그것을 기억하는 것이 아닙니다.

### 캐논िकल FIPA-ACL 메시지

```
(inform
  :sender       agent1@platform
  :receiver     agent2@platform
  :content      "((price IBM 83))"
  :language     SL0
  :ontology     finance
  :protocol     fipa-request
  :conversation-id   conv-42
  :reply-with   msg-17
)
```

7개의 필드는 프로토콜 봉투를 가지고 있으며, 1개의 필드는 (`content`다른 필드는 JSON 프로토콜에 재시험, 스레딩, 온톨로지 등을 넣을 때마다 바로 재발견되는 것입니다.

### 두 개의 기존 플랫폼

**JADE**(Java Agent DEvelopment framework, 1999~2020s) 는 가장 많이 사용된 FIPA 준용 시간이다. 에이전트는 기본 클래스를 확장하고 ACL 메시지를 교환하고 컨테이너 내부에서 실행하고 "행동"을 사용하여 조정했습니다.

**JACK**(Agent Oriented Software, Commercial) 는 FIPA 메시지 위에 BDI (Belief-Desire-Intent) 의 추론을 강조했습니다.

두 가지 모두 웹 스택이 멀티 에이전트 사용 사례를 먹었을 때 감소했습니다. MCP와 A2A는 2026 년 실행 시간 "컨테이너"입니다.

### FIPA가 왜 사라졌는지

- **Ontology overhead.**FIPA는 분석을 위해 공유된 온톨로지를 요구했습니다 `content`온톨로지에 대한 합의는 몇 년 동안 지속된 표준 과정입니다. 웹은 HTTP + JSON를 사용했습니다.
- **Formal semantics nobody used.**SL (사유어) 는 엄격한 진실 조건을 제공했지만 대부분의 생산 시스템은 자유 형태의 콘텐츠를 사용했으며 형식을 무시했습니다.
- **Tooling lock-in.**자바에서만 사용되었는데, 자크는 상업적이었는데, 다국어 팀들은 둘 다를 돌아다니며
- **The internet won the stack.**REST, JSON-RPC, gRPC가 ACL의 운송을 대체했습니다.

### LLM의 부활은 FIPA-lite입니다

FIPA를 비교하세요`request`MCP에`tools/call`이 부분의 본문은

```
(request                                {
  :sender  agent1                         "jsonrpc": "2.0",
  :receiver tool-server                   "method":  "tools/call",
  :content "(lookup stock IBM)"           "params":  {"name":"lookup_stock",
  :ontology finance                                   "arguments":{"symbol":"IBM"}},
  :conversation-id c42                    "id": 42
)                                        }
```

같은 봉투, 다른 문법. 둘 다: 누가, 누가, 의정, 유용, 상관관계 ID를 가지고 있습니다. 둘 다 다른 혁명입니다.

2025년 리우等人 ("A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP", arXiv:2505.02279) 의 조사에서는 이러한 선통이 명확하게 밝혀졌다. MCP는 도구 사용 음성 행위, A2A는 에이전트-피어 음성 행위, ACP는 감사 트레일 음성 행위, ANP는 분산 정체성 확장 프로그램이다. 새로운 사양은 JSON 문법과 느슨한 의미와 함께 ACL의 후손이다.

### 타협은 분명하게 명시되어

**What FIPA gave you and modern specs drop:**

- 공식적인 의미론을 증명할 수 있습니다`inform`발송자가 내용을 믿는다는 것을 의미합니다.
-                                                                                                                                                                                                                                                               `cancel`"
- 수십 년 동안 상호 작용 프로토콜 패턴  계약 네트워크, 가입-신고, 제안-स्वीकार  알려진 정확성 특성을 가진.

**What modern specs give you and FIPA did not:**

- JSON- 네이티브의 유용 로드, 모든 현대 도구와 호환됩니다.
- LLM가 손으로 코딩된 온톨로지 없이 해석할 수 있는 자연어 콘텐츠.
- 웹 스택 전송 (HTTP, SSE, WebSocket).
- 실시간 MCP를 통해 능력 발견`server/discover`A2A 에이전트 카드도

보다 쉬운 구현을 위해 용이한 의미론을 사용해야 합니다.

### 포팅할 가치가 있는 상호작용 프로토콜

FIPA는 ~15개의 상호작용 프로토콜을 배포했다. LLM의 멀티 에이전트 시스템으로 3개의 프로토콜을 전개할 가치가 있습니다.

1. **Contract Net Protocol (CNP).**관리자 문제`cfp`(제청 제안)`propose`; 관리자 수용/ 거부. 이것은 상용적 작업 시장 패턴입니다 (협상 16 · 16 단계).
2. **Subscribe/Notify.**가입자가 보내주기`subscribe`; 출판사에서 보내 `inform`이 책은 2026년 모든 이벤트 버스를 소개합니다.
3. **Request-When.**"X가 Y 조건에서 유지될 때 X를 수행한다". 사전 조건과 함께 지연된 동작. 2026 아날로그는 내구성 작업 흐름 엔진에서 지연된 작업 (단계 16 · 22 생산 스케일링) 이다.

각 지도는 현대 메시지 줄을, HTTP+ 여론조사, 또는 SSE 스트리밍에 깔끔하게 표시됩니다.

### 오토로지를 떨어뜨리면 무엇이 깨지는가?

공유된 온톨로지 없이, 에이전트는 자연어 콘텐츠에서 의미를 추론한다. 문서화된 2026 실패 모드는**semantic drift**: 두 대리인은 같은 단어를 사용합니다 (`"customer"`) 가 미묘하게 다른 개념에 대해 수신자의 에이전트가 잘못된 해석에 따라 행동하고, 어떤 스키마 검증자가도 그것을 잡지 않습니다. FIPA의 온톨로지 요구 사항은 분석 시간에 메시지를 거부했을 것입니다.

온톨로지 전용 없이 완화:

- JSON 스케마 `content` 케이블의 구조적 오류를 거부합니다.
- 타입 된 유물 (A2A) 은 잘못된 모달을 거부합니다.
-  봉투의 명시적인 수행법은 내용이 자연어일지라도 의도가 명확하게 이루어집니다.

### 2026년 스펙, 연설 행위 유산에 매핑

| Modern spec | FIPA analog | What it keeps | What it drops |
|---|---|---|---|
| MCP `tools/call` | `request` | explicit intent, correlation id | formal semantics, ontology |
| MCP `resources/read` | `query-ref` | explicit intent, correlation id | formal semantics |
| A2A Task lifecycle | contract-net + request-when | async lifecycle, state transitions | formal completeness guarantees |
| A2A streaming events | subscribe/notify | async push | typed-predicate subscription |
| CA-MCP shared context | blackboard (Hayes-Roth 1985) | multi-writer shared memory | logical consistency model |
| NLIP | natural-language content | LLM-native | schema |

표를 위에서 아래로 읽으면서 패턴은 다음과 같습니다. 구조적인 원시적인 것을 유지하고, 형식주의를 버리고, LLM가 모호함을 넘어서도록 하자.

```figure
sw-contract-net
```

## 건설 해

`code/main.py`순수한 stdlib FIPA-ACL 번역기를 구현합니다. 그것은 가전적인 ACL 봉투를 암호화하고 해독하고 모든 MCP / A2A 메시지 모양이 동일한 7 개의 필드로 줄이는 방법을 보여줍니다.

- 5개의 MCP 스타일과 A2A 스타일의 메시지를 FIPA-ACL로 암호화합니다.
- FIPA-ACL를 현대적 대칭으로 복원합니다.
- 장난감 계약 연결 협상 1 관리자와 3 명의 입찰자를 사용하여`cfp``propose``accept-proposal``reject-proposal`- 그래

실행:

```
python3 code/main.py
```

출력은 2026 JSON 형태와 FIPA-ACL 형태에서 각 현대 메시지를 보여주는 옆으로 표시되는 결과물이며, 다음에는 계약 네트워크 시상식의 반여행이다. 동일한 프로토콜 원시들은 반여행에서 살아남는다. 문법만 다르다.

## 사용 하 고

`outputs/skill-fipa-mapper.md`이 기술 은 어떤 에이전트-프로토콜 스펙 을 읽고 FIPA-ACL 지도 를 생성 하는 기술 이다. 새로운 프로토콜 을 채택 하기 전 에 이를 사용 하여 "이 는 정말 새로운 것 인가, 아니면`inform`JSON 문법과 함께?"

## 선박

FIPA-ACL를 가져오지 말고 체크리스트를 가져오세요

- 각 메시지의 원시적 의도는 무엇입니까?
- 요청 응답 및 취소에 대한 상관관계 아이디가 있습니까?
- 명시적인 내용 언어 (JSON-RPC, 평정 텍스트, 구조화된 타이핑 된 유물) 가 있습니까?
- 상호작용 프로토콜은 최고급인가요? 아니면 계약망을 처음부터 다시 구현하고 있나요?
- 두 대리인이 내용의 의미 (성어동동) 에 대해 동의하지 않을 때 어떻게 될까요?

새로운 프로토콜에 대해 5가지 질문을 문서화해 생산에 발송하기 전에

## 운동

1. 달아`code/main.py`. 회로 코딩을 관찰합니다. FIPA 수행성값이 어떤 것을 나타냅니다.`tools/call``resources/read`, 그리고 A2A 작업 제작.
2. 계약 네트워크 디모를 확장하여 `cancel`임무를 중시 시상식에서 취소할 수 있도록 하는 수행성`cancel`그 문제를 해결해내기 위해 노력하지 않나요?
3. FIPA ACL 메시지 구조를 읽어보십시오 (http://www.fipa.org/specs/fipa00037/) 섹션 4.14.3 이 수업에서 다루지 않은 수행법을 선택하고 현대적인 JSON-RPC 아날로그를 설명하십시오.
4. Liu et al., arXiv:2505.02279. MCP, A2A, ACP, ANP 각에 대해 FIPA 수행 가족들을 목록으로 나열하고,
5.   최소 JSON- 스케마를 설계`content`a의 필드`request`이 스키마는 자연어라는 것을 제공하지 않고, 그 비용이 얼마일까요?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Speech act | "An utterance that does something" | Austin/Searle: utterances as actions. The theoretical parent of ACL. |
| FIPA | "That old XML thing" | IEEE Foundation for Intelligent Physical Agents. Standardized ACL in 2000. |
| ACL | "Agent Communication Language" | FIPA's envelope format: performative + content + metadata. |
| Performative | "The verb" | The intent class of a message: `inform`, `request`, `propose`, `cfp`, etc. |
| KQML | "FIPA's predecessor" | Knowledge Query and Manipulation Language (1993). Simpler, narrower. |
| Ontology | "Shared vocabulary" | A formal definition of the concepts the content language talks about. |
| SL0 / SL1 | "FIPA content languages" | Semantic Language levels 0 and 1 — the formal content language family. |
| Contract Net | "Task market" | Manager issues cfp; bidders propose; manager accepts. The canonical interaction protocol. |
| Interaction protocol | "Pattern of messages" | A sequence of performatives with known correctness: request-when, subscribe-notify, etc. |

## 더 많은 읽기

- [Liu et al. — A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP](https://arxiv.org/html/2505.02279v1) 현대 사양을 FIPA 유산과 연결하는 2025년 규격 조사
- [FIPA ACL Message Structure Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) 2000년 양반 형식
- [FIPA Communicative Act Library Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) 전체 공연 카탈로그
- [MCP specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) 현재 국가 없는 도구 사용 동원`request`- 그래`query-ref`
- [A2A specification](https://a2a-protocol.org/latest/specification/) 현대적 계약망 및 가입자-신고의 대리자-평등 동등
