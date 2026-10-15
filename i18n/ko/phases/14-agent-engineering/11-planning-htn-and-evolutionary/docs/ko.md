# HTN 및 진화적 검색을 이용한 계획

> 상징적 계획은 계획이 입증 가능한 올바른 경우를 처리합니다. 진화 코드 검색은 체력 기능이 기계적으로 확인할 수 있는 경우를 처리합니다. ChatHTN (2025) 및 AlphaEvolve (2025) 는 LLM와 결합하면 각각이 잠금을 풀 수있는 것을 보여줍니다.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 02 (ReWOO and Plan-and-Execute)
**Time:** ~75 minutes

## 학습 목표

- 계층적 작업 네트워크: 작업, 방법, 운영자, 전제 조건, 효과
- LLM fallback 분해와 함께 ChatHTN의 하이브리드 루프  상징적 검색을 설명하십시오.
- 알파 에볼브의 진화 루프를 설명하고 왜 프로그램 평가자만 사용하는지 설명해 주세요.
- 장난감 HTN 계획기+STLB에서 장난감 진화 검색을 구현하세요.

## 문제

ReWOO (강좌 02), 계획 및 실행, 그리고 ReAct은 대부분의 에이전트 계획에 관한 것입니다. 두 가지 사례는 잘 다루지 않습니다:

1. **Plans with provable correctness.**일정을 계획, 비행 경로, 준수 작업 흐름  계획은 건설적으로 건전해야 합니다. 때로는 단계를 환각시키는 유창한 LLM 계획은 용납할 수 없습니다.
2. **Optimizations with a machine-checkable fitness function.**매트릭스 곱셈, 스케줄링 유리스틱, 컴파일러 패스  목표는 "정확한 계획"이 아니라 "최고의 계획"입니다.

HTN 계획과 AlphaEvolve는 두 가지 다른 문제를 해결합니다. 둘 다 LLM를 증폭기, 대체기로 사용합니다.

## 개념

### 계층적 작업 네트워크

HTN는:

- **Tasks** 화합 (분해될) 과 원시 (직접 실행될)
- **Methods** 사전 조건으로 복합 과제를 하위 과제로 분해하는 방법
- **Operators** 사전 조건과 효과와 함께 원시적 행동.
- **State** 사실 집합

계획: 목표 과제와 초기 상태를 고려하면, 선시 조건이 순서대로 충족되는 원시적인 사업자로 분해를 찾아내야 한다.

HTN는 LLM보다 오래되고 여전히 증명할 수 있는 올바른 계획을 위한 참조입니다.

### ChatHTN (Gopalakrishnan et al., 2025)

ChatHTN (arXiv:2505.11814) 은 상징적인 HTN와 LLM 질문들을 융합합니다.

1. 기존의 방법과 함께 현재의 복합 작업을 분해하려고 노력하십시오.
2. 만약 어떤 방법도 적용되지 않는다면 LLM에게 "어떻게 분해할 것인가?`task`주에서`s`"라고
3. LLM 응답을 후보 부 과로 번역하십시오.
4. 운영체 스키마에 대한 검증; 무효 분해를 거부합니다.
5. 다시 가

논문의 핵심 주장: 제작된 모든 계획은 입증 가능한 건전하다, 왜냐하면 LLM 제안은 직접적인 계획 편집으로 들어가지 않고, 후보 분해로만 들어갑니다. 상징적 계층은 정확성을 가지고 있습니다. LLM는 방법 라이브러리를 확장합니다.

온라인 방법 학습 (OpenReview `gwYEDY9j2x`, 2025 후속) 는 LLM에서 생산된 분해를 회귀로 일반화하는 학습자를 추가합니다

### 알파 에볼브 (Novikov et al., 2025)

알파 에볼브 (arXiv:2506.13131, DeepMind, 2025년 6월) 는 다른 짐승이다.

루프:

1. 시드 프로그램 + 프로그램 평가자 (건강점수를 반환합니다).
2. LLM의 집합은 돌연변이를 제안합니다.
3. 돌연변이를 평가자를 통해 실행하세요.
4. 최고의 걸 보관하고 다시 돌연변이를 해

발표된 승자:

- 56년만에 4x4 복합 매트릭스 곱셈에 대한 스트래센보다 첫 번째 개선 (48개의 스칼라 곱셈)
- 0.7%는 보그 스케줄링 유리스틱을 통해 구글 컴퓨팅을 복구했습니다.
- 32%의 플래시 주의가 국경 작업량에서 빨라집니다.

어려운 제약: 체력 기능은 기계적으로 확인할 수 있어야 합니다.

### 언제 사용해야 하는 것

| Problem class | Use | Why |
|---------------|-----|-----|
| Scheduling with hard constraints | HTN + ChatHTN | Provable soundness |
| Compiler optimization | AlphaEvolve | Machine-checkable fitness |
| Multi-step task execution | ReAct / ReWOO | LLM in the loop, no formal guarantees |
| Code improvement with tests | AlphaEvolve | Tests are the evaluator |
| Policy-bound automation | HTN | Preconditions encode policy |

### 이 패턴이 잘못되는 곳

- **HTN without operators.**사전 조건/효과 스케마가 없으면 건전성 주장이 붕괴됩니다. ChatHTN의 "LLM는 분해를 제안합니다".는 무효 동작을 거부하는 스케마를 요구합니다.
- **AlphaEvolve without a real evaluator.**"법률이 더 좋은지 LLM에게 물어봐라"는 피트니스 기능이 아닙니다. 평가자는 결정적이고 빠르어야 합니다.
- **Over-engineering.**대부분의 에이전트 작업도 필요없어 ReAct이나 ReWOO를 먼저 찾아

```figure
htn-tree-expand
```

## 건설 해

`code/main.py`두 개의 장난감을 구현합니다:

- 운영체제, 방법, 전제 조건, 효과 및`LLMFallback`이 방법은 복합 작업에 해당하는 방법이 없을 때 실행됩니다. "LLM"는 스크립트 된 분해기기입니다. 그래서 계획자는 오프라인에서 실행됩니다.
- 수학적 프로그램들에 대한 진화적 검색: 생산량을 최소화하는 표현을 키우기`|f(x) - target|`테스트 세트를 통해 측정하는 것이 결정적입니다.

실행하세요:

```
python3 code/main.py
```

추적은 HTN 계획자가 복합 작업을 분해하는 것을 보여줍니다 (중계 계획 LLM fallback) 그리고 진화 루프가 목표 표현에 konverging.

## 사용 하 고

- **HTN planners**`pyhop``SHOP3`또는 영역별 정책 집행을 위해 자신만의 시스템을 구축하세요.
- **ChatHTN** 연구 코드; 패턴 (시적 + LLM 후퇴) 는 모든 HTN 계획자에게 깨끗하게 포트합니다.
- **AlphaEvolve** DeepMind 문서; 패턴 (ensemble + evaluator) 은 재생 가능하다. OpenEvolve 및 유사한 오픈 소스 포크가 등장하고 있습니다.
- **Agent frameworks**1급 HTN나 AlphaEvolve를 아직 배신하지 않고, 소급 또는 배후 노동자로 제작하세요.

## 선박

`outputs/skill-hybrid-planner.md`LLM 역할이 명시적으로 설정된 하이브리드 계획자 스카프도 (HTN 또는 진화적) 를 생성합니다.

## 운동

1. 후속으로 HTN 계획기를 확장: 운용 시 운용 상태가 실패하면 후속으로 돌아와 다음 방법을 시도하십시오.
2. ChatHTN에 LLM 방법 캐시를 추가: LLM가 작업을 분해할 때 `T`상태 패턴`P`다음 전화에서 방법 라이브러리를 다시 확인하세요
3. 진화적 검색 평가기를 실제 테스트 스위트로 전환하고, 20개의 테스트 사례를 통과하는 분류 기능을 개발하고, 세대를 컨버전스로 보고합니다.
4. AlphaEvolve의 평가자 설계 메모를 읽어 보세요. 관심있는 도메인 (SQL 질의 최적화, 테스트suite 최소화, 배포 YAML) 에 대한 평가자를 설계하세요.
5. 결합: HTN를 사용하여 복합 작업을 하위 작업으로 분해하고, 각 하위 작업의 원시 운영자에 대한 진화 검색을 사용하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| HTN | "Hierarchical planner" | Task decomposition with operators, preconditions, effects |
| Method | "Decomposition rule" | Way to break a compound task into subtasks |
| Operator | "Primitive action" | Concrete step with precondition and effect |
| ChatHTN | "LLM + HTN" | Symbolic planner asks LLM when no method matches |
| AlphaEvolve | "Evolutionary code search" | Ensemble LLMs mutate code; deterministic evaluator selects |
| Fitness function | "Evaluator" | Deterministic, machine-checkable score over outputs |
| Online method learning | "Cached LLM decomposition" | Store + generalize LLM plans to cut query cost |

## 더 많은 읽기

- [Gopalakrishnan et al., ChatHTN (arXiv:2505.11814)](https://arxiv.org/abs/2505.11814) 상징적 + LLM 하이브리드 계획자
- [Novikov et al., AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) LLM 돌연변이를 가진 진화적인 코드 검색
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 계획자와 간단한 루프를 언제 찾아야 할까요?
