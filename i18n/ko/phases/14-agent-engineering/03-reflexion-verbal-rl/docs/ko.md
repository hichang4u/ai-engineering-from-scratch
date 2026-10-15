# 생각: 언어적 강화 학습

> 그라디언트 기반 RL는 실패 모드를 수정하기 위해 수천 개의 테스트와 GPU 클러스터가 필요합니다. 반사 (Shinn et al., NeurIPS 2023) 는 자연어로 그것을 수행합니다. 실패한 모든 실험 후에 에이전트는 반사를 작성하고 에피소디 memory에 저장하고 그 기억에 대한 다음 실험을 조건으로합니다. 이것은 레타의 수면시간 계산, 클로드 코드의 CLAUDE.md 학습, 그리고 프로워크플로우의 학습 규칙의 배움 패턴입니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 02 (ReWOO)
**Time:** ~60 minutes

## 학습 목표

- 반사 (Actor, Evaluator, Self-Reflector) 의 세 가지 구성 요소와 에피소디 기억의 역할에 대해 명명하십시오.
- 바이너리 평가자, 반사 버퍼 및 새로운 재 시도를 가진 stdlib 반사 루프를 구현하십시오.
- 주어진 작업에 대해 스케라, 유리스틱, 그리고 자기 평가 피드백 소스를 선택하십시오.
- 왜 구사적 강화가 그라디언트 기반 RL가 수 천 개의 실험을 해소해야 하는 오류를 발견하는지 설명해 주십시오.

## 문제

에이전트가 어떤 작업을 실패합니다. 표준 RL에서는 수천 개의 테스트를 더 실행하고, 계층을 계산하고, 업데이트 무게를 실행합니다. 비싸고 느린 생산 에이전트들은 모든 실패에 대한 훈련 예산이 없습니다.

반성 (Shinn et al., arXiv:2303.11366) 은 다른 질문을 던집니다. 만약 에이전트가 왜 실패했는지 생각해서 다시 시도한다면 어떨까요? 체중 업데이트가 없습니다. 그라디언트가 없습니다. 실험 사이에는 저장된 자연어만 사용하세요.

결과는 ALFWorld에서 ReAct 및 기타 비 미세 조정 된 기본선을 제치고 있습니다. HotpotQA에서는 ReAct보다 향상됩니다. 코드 생성 (HumanEval/MBPP) 에서 그것은 당시 최첨단 상태를 설정합니다. 모든 것은 단 한 가지 gradient 단계 없이입니다.

## 개념

### 세 가지 구성요소

```
Actor         : generates a trajectory (ReAct-style loop)
Evaluator     : scores the trajectory — binary, heuristic, or self-eval
Self-Reflector: writes a natural-language reflection on the failure
```

그리고 하나의 데이터 구조:

```
Episodic memory: list of prior reflections, prepended to the next trial's prompt
```

한 시험은 배우를 실행한다. 평가자는 그것을 점수한다. 점수가 낮다면, 셀프 리플렉터는 반사 ("나는 Y에 대해 묻는 동안 X에 대해 묻는 질문을 잘못 읽었기 때문에 잘못된 도구를 선택했다") 반사 는 에피소디 기억에 간다. 다음 시험은 신선하게 시작하지만 반사를 본다.

### 평가자 3가지 유형

1. **Scalar** 외부 바이너리 신호. ALFWorld 성공 또는 실패. 인형 테스트 통과 또는 실패. 가장 간단하고 최고 신호.
2. **Heuristic** 미리 정의된 실패 신호. "원조가 같은 동작을 2 번 연속으로 일으킨다면,  라고 표시하십시오". "자행 궤도가 50 단계 이상이면, 비효율적이라고 표시하십시오".
3. **Self-evaluated** LLM는 자체적인 궤도를 점수한다. 근거적 진실이 없는 경우에 필요하다. 약한 신호; 도구 기반 검증과 잘 어울린다 (강좌 05  CRITIC).

2026년 기본은 혼합입니다. 사용가능할 때 스칼라, 사용가능하지 않을 때 자율, 안전레일로 유리스틱.

### 왜 이것이 일반화되는지

반사 는 새로운 알고리즘이 아니라 이름 붙여진 패턴입니다. 거의 모든 생산 "자신 치유" 에이전트는 어떤 변형을 실행합니다.

- 레타의 수면 시간 계산 (강좌 08): 별도의 에이전트는 과거 대화에 대해 반사하고 메모리 블록에 글을 쓰고 있습니다.
- 클로드 코드의`CLAUDE.md`/ "보유 기억" 패턴: 학습으로 캡처된 반사, 향후 세션에 전제.
- 일 흐름에 대한`/learn-rule`명령: 명시적인 규칙으로 캡처된 수정
- 랭그라프의 반사 노드: 필요한 경우 정비하기 위해 출력 및 경로를 점수를 주는 노드.

모두 같은 통찰력에서 유래됩니다. 자연어는 "실패에서 배운 것"을 달리기 사이에 전달하는 충분한 풍부한 매체입니다.

### 효과가 있고 그렇지 않은 경우

반사하는 것은 다음과 같은 경우에 작용한다.

- 명확한 실패 신호가 있습니다 (실험 실패, 도구 오류, 잘못된 답).
- 작업 클래스는 재생가능하다 ( 같은 종류의 질문을 다시 할 수 있습니다).
- 이 반사에는 궤도를 개선할 수 있는 여지가 있다 (행동 예산은 충분하다).

다음의 경우 반성하는 것은 도움이 되지 않습니다.

- 에이전트는 이미 첫 시도에서 성공했습니다.
- 외부의 오류 (네트워크 다운, 도구 파손)  "네트워크 다운"에 대한 반사가 미래 실행에 도움이 되지 않습니다.
- 반사들은 소신으로 변합니다.

2026 함경: 기억 부패. 반사들이 축적된다. 일부는 쓸모없는 또는 잘못된 것; 반복은 에피소디컬 버퍼가 증가함에 따라 느리게 된다. 완화: 주기적인 압축 (강좌 06), 반사들에 대한 TTL 또는 별도의 수면 시간 청소 요인 (Letta).

```figure
react-trace
```

## 건설 해

`code/main.py`장난감 퍼즐에 대한 반사: 목표에 합친 3 요소 목록을 생성합니다. 배우는 후보 목록을 발급합니다. 평가자는 수치를 확인합니다. 자기 반사자는 잘못 된 것에 대한 선을 작성합니다. 반사는 다음 시험에 대한 에피소디 기억에 들어갑니다.

구성 요소:

- `Actor` 반사들을 볼 때 개선되는 스크립트 정책
- `Evaluator.binary()` 목표 금액을 통과/실패.
- `SelfReflector` 실패의 일선 진단을 생성합니다.
- `EpisodicMemory` TTL 의미론을 가진 제한된 목록.

실행하세요:

```
python3 code/main.py
```

추적은 세 가지 실험을 보여줍니다. 1번 실험이 실패하고 반사물이 저장되고, 2번 실험은 반사를 보고 개선되지만 여전히 실패하고, 3번 실험은 성공합니다. 기본 실행 (반사 없이)  실험 1번의 답변에 갇혀 있습니다.

## 사용 하 고

랭그그래프는 노드 패턴으로 반사선을 배포합니다. 클로드 코드의`/memory`명령과 프로 워크플로우`/learn-rule`에피소디컬 버퍼를 마크다운 파일로 외부로 설정합니다. 레타의 잠 시간 계산은 자동 반사기를 다운타임에 실행하므로 주요 에이전트가 지연 제한을 유지합니다. OpenAI 에이전트 SDK는 반사기를 직접 전송하지 않습니다. 스코어 및 메모리에 의해 궤도를 거부하는 사용자 지정 Guardrail로 구축합니다.`Session`이 모든 것은 경로를 가로지르는

## 선박

`outputs/skill-reflexion-buffer.md`반사 캡처, TTL, 그리고 분배를 통해 에피소디컬 버퍼를 생성하고 유지합니다. 작업 클래스 및 실패를 고려하면 실제로 다음 테스트에 도움이되는 반사를 발송합니다. (일반적인 "더 조심하십시오"가 아닙니다).

## 운동

1. 2차에서 스칼라 평가자로 전환하여 거리 측정값을 반환합니다.
2. 10 가지 시험 의 TTL 를 반사 에 추가 하십시오. 그 점 이후 에 더 오래된 반사 는 상처 를 입거나 도움 이 됩니까?
3. 유리스틱 평가자 구현: 동일한 동작이 반복되면 실험을 고정된 것으로 표시하십시오. 이것은 자기 반사자와 어떻게 상호 작용합니까?
4. 반사들을 무시하는 적대적인 배우와 함께 반사기를 실행하세요.
5. AlfWorld에 대한 반성 논문의 4부 참조. 130%의 성공률 향상을 개념적으로 재현하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Reflexion | "Self-correction" | Shinn et al. 2023 — Actor, Evaluator, Self-Reflector plus episodic memory |
| Verbal reinforcement | "Learning without gradients" | Natural-language reflection prepended to the next trial's prompt |
| Episodic memory | "Per-task reflections" | Bounded buffer of prior reflections for one task class |
| Scalar evaluator | "Binary success signal" | Pass/fail or numeric score from ground truth |
| Heuristic evaluator | "Pattern-based detector" | Predefined failure signatures (e.g. stuck-loop, too-many-steps) |
| Self-evaluator | "LLM-as-judge on own trace" | Lower-signal fallback when no ground truth — pair with tool-grounded verification |
| Memory rot | "Stale reflections" | Episodic buffer fills with obsolete entries; fix with compaction/TTL |
| Sleep-time reflection | "Async self-reflection" | Run Self-Reflector off the hot path so primary agent stays fast |

## 더 많은 읽기

- [Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning (arXiv:2303.11366)](https://arxiv.org/abs/2303.11366) 신성문
- [Letta, Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute) 생산에서 비시크성 반사
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 맥락의 일부로서 에피소디컬 버퍼를 관리
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) 반사 노드 패턴
