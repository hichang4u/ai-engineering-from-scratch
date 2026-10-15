# 자기 개선 의 제한적 설계

> 연구들은 자기개선 루프를 경계하기 위한 네 가지 원시적인 방법들을 모색했습니다. 모든 편집에서 유지해야 하는 공식적 변수 수정할 수 없는 조율 안크 다목적적 제약은 모든 차원 (안전, 공정성, 탄력성) 이 있어야 하며, 단순히 성능만이 아닙니다. 역전성 검출은 역사적인 측정값이 능력 손실을 암시하는 경우 루프를 중단합니다. 이들 중 어느 것도 안전성 증명이 아닙니다. 정보 이론적 결과 (콜모고로프 복잡성, 로브 정리) 는 어떤 시스템이 자신의 후계자에 대해 증명할 수 있는 것을 묶습니다. 그들은 침묵의 실패의 비용을 증가시키는 완화제입니다.

**Type:** Learn
**Languages:** Python (stdlib, bounded-loop with invariant check)
**Prerequisites:** Phase 15 · 07 (RSI), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## 문제

7학습의 레이스 시뮬레이터는 작은 속도 차이들이 큰 격차로 합쳐지는 것을 보여주었다. 4학습의 DGM 사례 연구는 루프들이 자신의 평가자를 적극적으로 플레이 할 수 있음을 보여주었다. 두 결과는 동일한 엔지니어링 질문에 대한 지점을 나타냅니다.

ICLR 2026 RSI 워크샵 요약 (openreview.net/pdf?id=OsPQ6zTQXV) 은 이러한 원시적 인 네 가지를 식별합니다. 인тропо스의 RSP v3.0 (강좌 19) 및 DeepMind의 FSF v3 (강좌 20) 은 모두 능력 문턱에 참조합니다. 메타 하이퍼 에이전트 작업 및 SAHOO (마ർച്ച 2026) 같은 커뮤니티 프레임워크는 생산에 서브셋을 구현합니다.

정직한 프레임링: 이것들은 완화입니다. 정보 이론적 결과는 어떤 시스템도 그 후계자에 대해 증명할 수 있는 것을 묶고 있으며, 현재 어떤 설계도 문제를 공식적으로 닫지 않습니다. 잘 제한된 루프는 제한되지 않은 것보다 더 안전합니다. 절대적으로 안전하지 않습니다.

## 개념

### 원시 1: 공식적 변수

변함없는 것은 모든 자기 수정 전에 그리고 후에 유지되어야 하는 속성이다. 예:

- 출력 분포는 고정된 구성 헤더 (강좌 17) 에 따라 조건화됩니다.
- 도구 호출은 허가되지 않은 엔드포인트로 이동하지 않습니다.
- 기억이 기록된 경로를 지나가죠.
- 평가자의 모듈 해시가 승인된 버전과 일치합니다.

인버리안은 외부 코드로 확인됩니다. 루프는 편집할 수 없습니다. 제안된 수정이 인버리안을 위반하면 거절됩니다. 이것은 DGM 스타일의 평가자 조작 모드를 잡습니다 (강사 4).

어려운 부분은 안전에 필요한 변수들을 선택하고 합리적인 시간에 계산할 수 있습니다. 과다 정해 놓은 점포는 발전하고, 과다 정해 놓은 점포는 중요한 특성을 지나치게 할 수 있습니다.

### 원시 2: 조선 안크

조율 앵커는 루프의 핵심 목표의 변함없는 표현이며 루프의 편집 표면 밖에서 고정되어 있습니다. 예:

- 헌법 텍스트 (강좌 17) 는 모든 명명에서 읽기 전용 장소에서 로드됩니다.
- 독립적인 접근 통제를 가진 별도의 저장소에서 평가자
- 인간에 의해 서명된 도구 허가 선언문, 각 주기를 다시 확인합니다.

앵커의 역할은 객관적 유도 방지입니다. 루프는 목표를 추구하는 방법을 향상시킬 수 있지만, 목표는 무엇인지 편집할 수 없습니다.

미묘한 실패 모드: 앵커 루프에서 편집할 수 없는 앵커는 여전히 앵커를 읽는 방식으로 변동하는 루프에 의해 재해석될 수 있습니다. 헌법 AI (강좌 17) 는 새로운 상황을 처리하기 위해 명시적으로 사유 기반을 두고 있습니다. 그 사유 계층은 해석 변동이 살고 있습니다. 앵커는 필요하지만 충분하지 않습니다.

### 3 원시: 다목적 제약

단일 스칼라 점수를 최적화하는 루프는 단축키를 찾을 수 있습니다. 여러 가지 하드 제약을 동시에 만족해야 하는 루프는 단축키가 더 적은 편이다. 전형적인 축:

- 성능 (사업 수준 기준)
- 안전 (붉은 팀 평가, 알려진 나쁜 경우 거부율)
- 공정성 (민성 하위 그룹에 대한 분별적인 영향 제한)
- 견고함 (OOD 테스트 세트, 적대적 입력 처리)

수정은 모든 제약이 유효하다면만 받아들여진다. 13강의 비용 관장은 이를 재정적 제약으로 쌓아놓는다. 18강의 라마 경호는 안전축으로 연결된다.

### 원시 4: 회귀 검출

각 주기의 점수는 역사적 분포에 비해 비교된다. 구성 용납 범위를 넘어 떨어지는 경우 루프가 일시 중지된다. 이것은 루프가 그것을 "향상"함에 따라 실행 평균에 흡수되는 침묵한 능력 손실을 잡습니다.

실제 구현: 마지막 N 주기의 일 작업 점수를 저장합니다. 각 새로운 주기는 일 작업 델타를 계산합니다. 어떤 델타가 열계 이하로 떨어지면, 주기는 거부되고 인간 검토가됩니다.

### 정보 이론의 한계

콜모고로프 복잡성과 로브 정리는 시스템이 자신에 대해 증명할 수 있는 것에 대한 상위 한계를 설정합니다. 슈미더허버의 공식적인 고델 기계 (강좌 4) 는 그러한 가장 높은 한계를 목표로합니다. 아무도 비 비관적인 증거를 완료하지 않았습니다. 로브의 결과는 "내가 증명하면 X를 할 것입니다. 내가 증명하면 X를 할 것입니다".라고 믿는다면, 그것은 증명하지 않고 X를 할 것입니다.

우리의 원시적인 사람들에게는 안전 문제를 해결할 수 없습니다. 그들은 침묵 실패가 더 비싸게 만듭니다. 실종된 체크를 조용히 우회하는 악성 또는 유동 루프는 이제 더 감지 가능한 서명인 명시적인 체크를 적극적으로 약화해야합니다.

### 일용 사례

에이전트가 편집을 제안한다고 가정해보자

1. 변함없는 검증: 모듈 해시, 도구 허가 선언, 헌법 헤더.
2. 항성 검증: 객관적 문서는 승인된 버전과 일치합니다 (바이트 또는 의미적으로).
3. 다목적 평가: 성능, 안전, 공정성, 탄력성
4. 회귀 감지: 용납보다 더 많은 축이 떨어지지 않습니다.

4개 모두 수정이 착륙하기 전에 통과해야 합니다.

```figure
bounded-gates
```

## 사용 하 고

`code/main.py`레슨 4에서 DGM 스타일의 장난감에 제한된 자기 개선 루프를 실행하지만 위에 네 개의 원시자가 층화되어 있습니다. 각 원시자는 개별적으로 활성화 또는 비활성화 될 수 있습니다. 시범은 각각의 원시자가 특정 실패 클래스를 잡는 것이며, 그 중 하나를 제거하면 그 실패 클래스가 통과 할 수 있습니다.

## 선박

`outputs/skill-bounded-loop-review.md`제안된 제한된 루프를 감사하고 실제로 실행하고 주장하는 네 가지 원시 중 어느 것을 점수합니다.

## 운동

1. 달아`code/main.py`모든 원시적인 기능을 활성화하면, 해킹이 승리하지 않고도 원시 매개 변수가 여전히 개선되는 것을 확인합니다.

2. 회귀 탐지 기능을 비활성화합니다. 이것은 침묵 능력 손실을 허용하는 입력을 구축합니다.

3. 다목적 제약을 비활성화하십시오. 안전축이 떨어지는 동안 루프가 성능 축에 공감하는 것을 표시하십시오.

4. 코딩 에이전트에 대한 조율 앵커를 설계하세요. 어떤 텍스트가 어디에 저장되어 있는지, 어떻게 확인되었는지요?

5. ICLR 2026 RSI 워크샵의 요약을 읽어 보세요. 네 가지 원시 중 하나를 선택하고 현대의 기술 발전에 대한 구체적인 개선안을 제안하세요.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Invariant | "Always-true property" | A property checked by external code before and after every edit |
| Alignment anchor | "Pinned objective" | Immutable core-goal representation outside the loop's edit surface |
| Multi-objective constraint | "All axes must hold" | Performance, safety, fairness, robustness — all required |
| Regression detection | "Pause on drop" | Pause the loop when historical metric deltas suggest capability loss |
| Kolmogorov bound | "Information-theoretic limit" | Limits what a system can prove about its own successor |
| Lob's theorem | "Self-reference trap" | System can act on "I should" without proving it should |
| Gate stack | "Layered check" | Multiple primitives combined; any failure rejects the edit |
| Bounded improvement | "Mitigation, not proof" | Raises silent-failure cost; does not close the safety problem |

## 더 많은 읽기

- [ICLR 2026 RSI Workshop summary (OpenReview)](https://openreview.net/pdf?id=OsPQ6zTQXV)4 원시적 인 인 인접합성
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) 다목적 능력의 임대
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) 변함없는 원시물로서의 속임수 조율 모니터링
- [Schmidhuber (2003). Godel Machines](https://people.idsia.ch/~juergen/goedelmachine.html) 이러한 원시들의 형식적 증거의 조상.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 이유 기반 조율 
