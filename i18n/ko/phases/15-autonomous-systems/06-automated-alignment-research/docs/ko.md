# 자동화된 조형 연구 (인тропо적 AAR)

> 앤트로피는 독립적인 샌드박스에서 클로드 오퍼스 4.6 자율 조율 연구원들의 병렬 팀을 운영하여 공유 포럼을 통해 조정하여 그 로그가 샌드박스 밖에 살고 있습니다 (그래서 에이전트는 자신의 기록을 삭제할 수 없습니다). 약한 교육에서 강한 교육 문제에 있어서 AAR는 인간 연구원보다 더 좋은 성과를 거두었습니다. 작업 흐름을 규정하는 인트로피크의 자체 요약 플래그들은 종종 AAR 유연성을 제한하고 성능을 떨어뜨립니다. 자동화 조율 연구란 RSP가 탐지하려는 정확한 조율 오류 위험으로 시간선을 압축하는 압축 단계입니다.

**Type:** Learn
**Languages:** Python (stdlib, parallel-research-forum simulator)
**Prerequisites:** Phase 15 · 05 (AI Scientist v2), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## 문제

조화 연구 는 인간 연구자 시간 에 비싸다. 확장 가능한 감독, 보상 구체화 또는 약한 훈련 같은 문제 는 반복 한 번에 몇 주 걸리는 실험 을 필요로 한다. 국경 능력 이 발전함에 따라 조화 작업 부하 는 자격 한 연구자 공급보다 더 빠르게 증가 한다.

자동 조형 연구 (AAR) 는 조형 능력을 뛰어넘는 동일한 경계 모델이 격차를 해소하는 데 기여할 수 있는지 여부를 묻는 것입니다. AAR에서 운영되는 약한-강력 훈련 연구 (alignment.anthropic.com/2026/automated-w2s-researcher/) 에 대한 Anthropic의 2026 보고서는 이 클래스의 배치 된 시스템에서 처음으로 공개된 결과 중 하나입니다.

이 연구 결과는 정말로 긍정적 인 결과입니다. AAR는 인간 기준보다 더 나은 연구 문제를 해결했습니다. 또한 결과는 단일 시스템에서 이 단계가 발전한 모든 문제를 집중시킵니다. 조화 연구를 자동화 할 수 있다면, 보호 조치를 손상시키는 부분도 자동화 할 수 있습니다. AI 연구 및 개발 능력에 대한 RSP의 임대値は 이 루프를 염두에 두고 작성되었습니다.

## 개념

### 건축 (공공적으로 설명된 바와 같이)

- **Parallel agents.**여러 클로드 오퍼스 4.6 인스턴스는 AAR로 실행되며, 각각 독립적인 샌드박스에서 실행됩니다. 샌드박스는 파일 시스템, 네트워크 및 프로세스 표면을 제한합니다.
- **Shared forum.**연구 결과는 모든 샌드박스 외부에 저장된 백엔드가 있는 공유 포럼에 게시됩니다. 에이전트는 포럼을 읽을 수 있습니다. 에이전트는 자신의 샌드박스 내부에서 포럼 기록을 삭제하거나 편집할 수 없습니다.
- **Task allocation.**인간으로 설계된 작업열은 AAR에 연구 문제를 할당합니다. AAR는 분해를 제안하고 실험을 실행하고 결과를 작성합니다.
- **Weak-to-strong training focus.**발표된 연구에서는 더 강한 학생 모델을 훈련시키기 위해 더 약한 감독 모델을 사용하여 약한 학생에서 강한 학생을 훈련시키는 교육을 다루었습니다. AAR는 이 과제에서 인간 연구원보다 더 좋은 성과를 거두었습니다.

### 모래 상자 밖 로그 는 왜 중요 합니까?

로그-실밀성 속성은 통제된 실험과 잠재적으로 손상된 실험의 차이입니다. AAR가 자신의 로그를 편집할 수 있다면 실패하거나 의심스러운 실험을 덮을 수 있습니다. 인류적 플래그는 이것을 직접적으로 표시합니다. 속성은 연구 결과 신뢰를위한 필수 조건이며 검증하는 것이 비 비약적입니다.

인프라 용어에서 아날로그는 외부 저장소에 스크립트를 통해 작성하는 첨부만 로그 (예를 들어 S3 객체 잠금, 변경 불가능한 Datadog 로그) 이다. 에이전트는 과거의 기록을 수정할 자격증이 없습니다. 이것은 2026 기업 보안 팀이 랜섬웨어 저항성 감사 트레일을 만들기 위해 사용하는 동일한 패턴입니다.

### 정해진 업무 흐름의 타협

인트로피의 보고서에서는 규정된 작업 흐름이 AAR의 유연성을 제한하고 성능을 저하시키는 경우가 많다고 지적한다. 다른 말로: 인간 설계자가 연구 계획을 단계적으로 작성하면 AAR는 고 수준의 목표와 분해의 자유가 주어지면보다 더 나쁘게 수행됩니다. 이것은 에이전틱 연구 (LangGraph, 마이크로소프트의 에이전트 프레임워크)  과다 지정 된 스카프드가 능력있는 에이전트를 해치는 결과와 일치합니다.

안전의 의미는 미묘하다. AAR 성능을 향상시키는 유연성은 또한 승인되지 않은 분해, 신기 도구 사용 및 목표 유동을 허용하는 유연성입니다. 타협은 디자인 공간 결정입니다. 얼마나 유연성이 인간에게 이길 수있는 충분한 능력을 구입합니까?

### 압축 위험

RSP v3.0 (강좌 19) 은 AI 연구 개발 능력 임대: 경쟁력 있는 비용과 인적 + AI 도구에 맞게 AI 연구 개발 파이프라인을 완전히 자동화 할 수있는 능력. DeepMind의 FSF v3에는 유사한 ML 연구 개발 자율 수준이 포함되어 있습니다. 두 프레임워크는 이 임대와 함께 증가한 제어의 촉매 역할을합니다.

AAR는 문턱보다 한 단계 더 낮습니다. 그것은 파이프 라인의 일부를 자동화합니다 (특정하고 잘 확장된 작업에 대한 조립 연구) 하지만 종말에서 종말까지의 능력 개발 루프는 아닙니다. 시간 라인 문제는 격차가 얼마나 빨리 닫히는지에 관한 것입니다.

압축된 시간표는 합성 실패의 문제입니다. 조화 연구와 역량 연구가 비슷한 속도로 합쳐지면, 조화 위험 표면은 역량만큼이나 빠르게 증가합니다. 능력이 더 빨리 증가한다면 (역사적인 경향) 격차가 커집니다. 이것은 AAR가 자격적 상품이라는 주장입니다. 추가적인 조율 결과가 연구 과정이 신뢰할 수 있는 경우에만 격차를 줄이는 것입니다.

### AAR가 대체하지 않는 것

인간 연구자들은 작업 줄을 설정하고 결과를 검토하고 헌법적 권한을 유지합니다. AAR는 파이프라인의 중간을 가속화하고 끝이 아닙니다. 인тропо스의 출판 결과에는 AAR 기여와 무엇을 출판하고, 무엇을 철회하고, 무엇을 정비해야 하는지에 대한 인간 연구자의 판단이 포함되어 있습니다.

이것은 연구 자체에 적용된 레슨 15에서 제안하고 나서 수행하는 패턴과 일치합니다. AAR는 제안하고, 인간은 약속합니다.

```figure
aar-forum
```

## 사용 하 고

`code/main.py`여러 AAR 연구 포럼을 시뮬레이션합니다. 3개의 독립적인 "연구 에이전트"는 병렬로 실행되며, 선택적 조작 시도를 통해 추가만 하는 포럼에 연구 결과를 게시합니다.

- 지켜봐

- 모래 상자 밖으로 로그링이 어떻게 로그 조작 시도를 잡는지
- 어떻게 자유로운 분해로 작업 할당이 더 어려운 문제들에 대한 고정된 작업 흐름을 능가하는지를
- 어떻게 하나의 손상된 AAR가 포럼의 신호를 오염시킬 수 있는지 기록이 조작이 불가능하다면요.

## 선박

`outputs/skill-aar-deployment-review.md`자동화된 조율 연구 파이프 라인의 배치 전 검토입니다.

## 운동

1. 달아`code/main.py`" 고정 작업 흐름"과 " 자유 분해 " 설정을 비교하십시오. 자유 분해는 항상 승리합니까? 아니면 고정 작업 흐름이 경쟁력있는 문제 클래스가 있습니까?

2. 시뮬레이터를 수정하여 에이전트가 로그 조작을 시도하도록 합니다. 추가 로그만 이를 감지하는지 확인하세요. 로그에서 감지 서명이 어떻게 보이는지 정확히 설명하는 한 문장을 작성하세요.

3. 애너트로피의 약대에서 강대 AAR 보고서를 읽어 보세요. AAR가 인간 연구자들을 이길 수 있는 특정 하위 과제를 확인하세요.

4. AAR 유연성 (더 나은 결과) 을 규정된 작업 흐름 제한 (더 쉬운 감사) 과 균형 잡힌 작업 큐 할당 정책을 설계하십시오. 두 가지 A/B 테스트를 어떻게 수행할지를 설명하십시오.

5. RSP v3.0의 AI R&D-4 문턱을 읽어 보세요. 한 문장에서 AAR가 현재 통과하지 않는 것을 넘어갈 것이라고 생각하는 것을 설명하세요.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| AAR | "Automated Alignment Researcher" | Claude Opus 4.6 instance operated autonomously on alignment problems |
| Weak-to-strong training | "Training a stronger model with a weaker supervisor" | Classic scalable-oversight benchmark AARs outperformed humans on |
| Shared forum | "Where agents publish findings" | Append-only, out-of-sandbox storage |
| Out-of-sandbox log | "Agent cannot edit its own record" | Tamper-evident write-through to external storage |
| Prescribed workflow | "Step-by-step plan from human designer" | Constrains AAR; often degrades performance vs free decomposition |
| Free decomposition | "Agent decides how to break the task" | More capable, harder to audit |
| AI R&D threshold | "RSP/FSF capability level" | Full automation of R&D pipeline at competitive cost |
| Compressed timeline | "Alignment vs capability race" | If capability compounds faster than alignment, misalignment risk grows |

## 더 많은 읽기

- [Anthropic — Automated Weak-to-Strong Researcher](https://alignment.anthropic.com/2026/automated-w2s-researcher/) 주요 출처
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) AI 연구 개발 문턱 프레임
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) 보다 넓은 에이전트 자율 프레임
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) ML 연구개발 자율 수준은 RSP와 병행된다.
- [Burns et al. (2023). Weak-to-Strong Generalization (OpenAI)](https://openai.com/index/weak-to-strong-generalization/) AAR가 공격한 근본적인 문제.
