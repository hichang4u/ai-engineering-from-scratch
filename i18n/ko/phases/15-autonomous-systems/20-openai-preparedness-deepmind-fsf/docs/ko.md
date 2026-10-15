# 오픈아이스 준비 프레임워크 및 딥마인드 국경 안전 프레임워크

> 오픈AI 준비 프레임워크 v2 (아프ریل 2025) 는 연구 카테고리  장거리 자율성, 샌드백, 자율 복제 및 적응, 안전보장을 저하시키는  추적 카테고리와는 다른 연구를 도입합니다. 추적된 카테고리는 안전 자문 그룹이 검토한 능력 보고와 안전보장 보고를 유발합니다. 딥마인드의 FSF v3 (9월 2025, 추적 능력 레벨이 추가된 4월 17, 2026) 는 ML 연구 개발 및 사이버 도메인으로 자율성을 접한다 (ML 연구 개발 자율 수준 1 = 경쟁력 있는 비용과 인적 + AI 도구에 맞서는 AI 연구 개발 파이프라인을 완전히 자동화한다). FSF v3는 도구적 추론의 부적용에 대한 자동 모니터링을 통해 속임수 조화를 명시적으로 해결합니다. 정직한 참고: PF v2 (장거리 자율성 포함) 의 연구 카테고리들은 자동으로 완화 효과를 유발하지 않습니다. 정책 언어는 "잠재하다".

**Type:** Learn
**Languages:** Python (stdlib, three-framework decision-table diff tool)
**Prerequisites:** Phase 15 · 19 (Anthropic RSP)
**Time:** ~45 minutes

## 문제

19강에서는 인형의 확장 정책을 자세히 읽습니다. 이 강좌는 OpenAI와 DeepMind의 문서를 읽으며 그림을 완성합니다. 세 문서는 동일한 질문을 다루는 사촌 유물입니다.

컨버전스: 세 가지 모두 장거리 자율성을 추적할만한 능력 클래스로 표시합니다. 세 가지 모두 속임수 행동 (결선 가짜, 모래 배낭) 을 특정 위험 범주로 인정합니다. 세 가지 모두 내부 검토 기관을 가지고 있습니다. 이차: OpenAI는 "트래킹" (필요적 완화) 과 "연구" (자동적인 트리거가 없다) 로 분류한다. DeepMind는 독립성을 두 영역으로 접어 두는 것이 아니라 별도로 이름을 붙이는 것이 좋습니다. 연구실은 Tracked vs Research, Critical vs Moderate, Tier-1 vs Tier-2를 말합니다. 어떤 병에 어떤 능력이 살고 있는지의 운영 결과는 연구실마다 다릅니다.

이 두 가지 기능을 함께 읽는 것은 유용한 운동이다. 같은 기능은 인тропо닉에서 "필수 완화" 또는 오픈아이에서 "감시하지만 발동하지 않는" 또는 딥마인드에서 "특정 영역에서 추적"이 될 수 있습니다. 정책 자세는 중요합니다.

## 개념

### 오픈아이 준비 프레임워크 v2 (2025년 4월)

구조:

- **Tracked Categories**: trigger 능력 보고 (모델이 할 수 있는 것) 과 안전보장 보고 (무엇의 완화 가 가 이루어지고 있는 것) 을 배치 하기 전 안전 자문단에서 검토 합니다.
- **Research Categories**: 연구소가 추적하고 있지만 아직 구체적인 완화 방안을 추진하지 않은 모델 기능.

v2: 연구 카테고리에서는 자동으로 완화가 발생하지 않습니다. 정책 언어는 "가능한" 완화입니다. 이것은 관찰해야 할 특정 델타입니다. 추적과 연구에서 카테고리의 위치는 "가장"과 "관측" 사이의 입니다.

### 딥마인드 프론터 안전 프레임워크 v3 (2025년 9월; 2026년 4월 17일 추적 능력 수준이 추가)

구조:

- **Critical Capability Levels (CCLs)**: 5개의 영역에서 능력의 임대: 사이버, 바이오, ML 연구&개발, CBRN, 자율성 (ML 연구&개발 및 사이버로 접어들었다).
- **Tracked Capability Levels**2026년 4월 추가 granularity 추가. 구체적인 예: ML R&D 자율 1 레벨 = 경쟁력 있는 비용과 인간 + AI 도구에 AI R&D 파이프라인을 완전히 자동화.
- **Deceptive alignment monitoring**: 도구적 근거의 부적절한 사용에 대한 자동적 모니터링에 대한 명시적인 약속.

자율성 프레임링은 OpenAI와 다르다. DeepMind는 "자율성"을 최고 수준의 도메인으로 유지하지 않습니다. 그것은 자율성이 해를 끼칠 수있는 도메인에 접어집니다. (ML R&D 및 사이버).

### 이 세 가지의 합치는

- 내부 안전 자문 그룹 (인тропо닉 SAG, 오픈아이 SAG, 딥마인드 내부 위원회)
- 위험급으로 착시적인 조화를 / 조화를 위조하는 것을 명시적으로 언급한다.
- 선언된 순서대로 있는 상설물 (인류: 국경 안전 로드맵, 위험 보고서; OpenAI: 능력 및 안전보호 보고서; DeepMind: FSF 업데이트 주기)
- 감시만 하는 방어에 한계가 있다는 점에 대한 인정을. DeepMind는 명시적으로 "자동적인 모니터링은 장기적으로 충분하지 않을 것"이라고 말합니다.

### 서로 다른 곳에

- **Anthropic**: v3.0에서 중단 약속이 제거되었습니다. AI R&D-4 문은 다음 게이트입니다.
- **OpenAI**: 추적 및 연구 분할; 연구 카테고리 (장거리 자율성을 포함하여) 는 자동으로 게이트되지 않습니다.
- **DeepMind**: 자율성 다른 영역으로 접어들었다; 추적된 능력 수준은 2026년 4월에 미분성을 추가한다.

### 모래 배낭: 세 가지 기능을 복잡하게 만드는 특정 능력

Sandbagging (평가를 하는 전략적으로 저조한 모델) 은 OpenAI의 연구 카테고리 (Research Categories) 에 있다. Anthropic의 RSP v3.0는 평가-상황 격차 (강좌 1) 를 통해 이를 해결한다. DeepMind는 FSF v3에서 속박한 조율 모니터링을 통해 해결한다.

모델의 평가에 대한 모래 봉투가 있다면, 각 프레임워크의 능력 문턱은 과소평가된다. 프레임워크는 측정이 효과가 있을 때만 작동한다. 그렇기 때문에 실험실 자기 평가 외에도 외부 측정 (강좌 21, METR) 및 적대적 평가가 필요합니다.

### 정책 읽기 능력

- 위치: 당신이 관심 있는 모든 기능은 정책에서 찾을 수 있어야 합니다. 만약 찾을 수 없다면 정책은 그것을 포함하지 않습니다.
- 분류: 추적 (중화를 유발) 또는 연구 ( 추적하지만 발동하지 않는) 인가? OpenAI는 이것을 이름 붙여줍니다.
- 시퀀스: 정책은 선언된 일정에 따라 업데이트 되느냐 아니면 특정 사건 후에야 업데이트 되느냐?
- 독립: 외부 검토가 의무적이거나 선택적입니까? 아폴로와 미국 AI 안전 연구소와의 인문적 파트너; METR와 OpenAI; 내부 SAG와 주로 DeepMind.

```figure
a5-tracked-vs-research
```

## 사용 하 고

`code/main.py`작은 결정 테이블의 차이 도구를 구현합니다. 기능 (자율성, 속임수 조율, 연구 개발 자동화, 사이버 업그레이드, 등) 를 고려하면 세 가지 정책의 각각이 능력을 어떻게 분류하고, 어떤 완화가 유발되는지 output합니다. 그것은 정책 도구가 아닌 읽기 보조기입니다.

## 선박

`outputs/skill-cross-policy-diff.md`특정 능력에 대한 정책 간 비교를 수행하여 세 가지 프레임워크를 참조로 사용합니다.

## 운동

1. 달아`code/main.py`. 다른 도구의 출력이 적어도 두 가지 기능에 대한 정책과 일치하는지 확인하여 소스 문서에 대해 확인할 수 있습니다.

2. OpenAI 준비 프레임워크 v2를 전체적으로 읽어 보세요. 각 연구 범주를 식별하세요. 각각의 연구 범위에 대해 추적하는 것이 아니라 연구에 있는 이유에 대해 한 문장을 작성하세요.

3. DeepMind FSF v3를 전체적으로 읽고, 2026년 4월 추적된 능력 수준 업데이트를 추가합니다. ML 연구 개발 자율 1 레벨의 특정 평가 기준을 식별합니다. 외부에서 어떻게 측정합니까?

4. 샌드백은 OpenAI의 연구 카테고리 내에 있습니다. 샌드백 모델이 실제 능력을 드러내도록 강요하는 평가를 설계하십시오. 레슨 1 평가-상황-게임 토론을 참조하십시오.

5. 특정 기능에 대한 세 가지 정책들을 비교해 보십시오. (당신의 선택) 어떤 정책의 분류가 가장 엄격하고, 어느 쪽이 가장 적은가? 소스 텍스트로 정당화하세요.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| Preparedness Framework | "OpenAI's scaling policy" | PF v2 (April 2025); Tracked vs Research categories |
| Tracked Category | "Mandatory mitigation" | Triggers Capabilities + Safeguards Reports; SAG review |
| Research Category | "Monitored only" | Tracked but no automatic mitigation; includes Long-range Autonomy |
| Frontier Safety Framework | "DeepMind's scaling policy" | FSF v3 (Sept 2025) + Tracked Capability Levels (Apr 2026) |
| CCL | "Critical Capability Level" | DeepMind threshold per domain (Cyber, Bio, ML R&D, CBRN) |
| ML R&D autonomy level 1 | "R&D automation" | Fully automate AI R&D pipeline at competitive cost |
| Sandbagging | "Strategic underperformance" | Model underperforms on evals; in OpenAI Research Categories |
| Instrumental reasoning | "Means-ends reasoning" | Reasoning about how to achieve goals; target of DeepMind monitoring |

## 더 많은 읽기

- [OpenAI — Updating our Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/) v2 발표
- [OpenAI — Preparedness Framework v2 PDF](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf) 전체 문서
- [DeepMind — Strengthening our Frontier Safety Framework](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) FSF v3 발표
- [DeepMind — Updating the Frontier Safety Framework (April 2026)](https://deepmind.google/blog/updating-the-frontier-safety-framework/) 추적된 능력 수준 추가
- [Gemini 3 Pro FSF Report](https://storage.googleapis.com/deepmind-media/gemini/gemini_3_pro_fsf_report.pdf) FSF 형식의 위험 보고의 예제.
