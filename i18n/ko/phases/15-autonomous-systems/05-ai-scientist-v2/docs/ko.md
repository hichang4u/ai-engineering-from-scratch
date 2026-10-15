# 인공지능 과학자 v2  워크샵 레벨 자율 연구

> 사카나의 AI 과학자 v2 (야마다 등, arXiv:2504.08066) 는 전체 연구 루프를 실행합니다: 가설, 코드, 실험, 숫자, 글쓰기, 제출. 이 시스템은 ICLR 2025 워크숍에서 갱신된 논문 합격 심사를 실시하는 최초의 시스템입니다. 독립적인 평가 (Beel et al.) 는 42%의 실험이 코딩 오류로 실패했으며 문학 검토는 종종 새로운 것으로 설정된 개념을 잘못 표시했습니다. 사카나의 자신의 박사들은 코드베이스가 LLM 작성된 코드를 실행한다고 경고하고 Docker 격리라는 것을 추천합니다. 그 그림의 두 반은 핵심입니다.

**Type:** Learn
**Languages:** Python (stdlib, research-loop state-machine toy)
**Prerequisites:** Phase 15 · 03 (AlphaEvolve), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## 문제

연구란 개방된 작업이다. 알파 에볼브의 알고리즘 검색이나 DGM의 벤치마크 제한된 자기 수정과는 달리 연구 결과는 기계 검증 가능한 정확성 기준을 가지고 있지 않다. 논문을 검토하는 사람들이 평가한다. 단위 테스트가 아니다. 이는 루프를 닫는 것을 더 어렵게 하고 닫으면 더 가치있게 만듭니다. 왜냐하면 연구란 합성적인 진보가 살고 있기 때문입니다.

인공지능 과학자 v1 (사카나, 2024) 는 인간으로 작성된 템플릿에서 시작하여 루프를 닫았습니다. LLM는 고정된 스카프도딩 안에서 실험을 했습니다. AI 과학자 v2 (Yamada et al., 2025) 는 시각 언어 모델 비판 루프로 에이전틱 트리 검색을 사용하여 템플릿 요구 사항을 제거합니다. 시스템은 아이디어를 생성하고 실험을 실행하고, 수치를 생성하고, 논문을 작성하고, 리뷰어 피드백을 반복합니다.

동료 평론판: v2 생성된 한 논문이 ICLR 2025 워크숍에서 받아들여졌다 (공개함). 독립적인 평가판: 시스템은 신뢰성이 높지 않다. 둘 다 사실이다.

## 개념

### 건축

1. **Idea generation.**LLM는 주제와 이전 문학에 조건화된 연구 아이디어를 제안합니다. v1는 템플릿을 사용했고 v2는 가설의 공간에 대한 요원적 검색을 사용합니다.
2. **Novelty check.**문학 검색 단계 는 아이디어가 출판되었는지 여부를 확인 합니다. 이 단계 에서 Beel et al.'의 평가 는 종종 신기술 으로 분류 되는 잘못된 표기 를 발견 한 단계 입니다.
3. **Experiment plan.**에이전트는 실험 프로토콜을 작성하고 코드를 작성합니다.
4. **Execution.**코드 는 모래 상자 에 실행 됩니다. 실패 는 재 시도 로 로프 에 다시 입력 됩니다. Beel et al. 의 측정 에 따르면, 이 단계 에 있는 실험 의 42% 는 코드 에러 로 실패 하였습니다.
5. **Figure generation.**시각 언어 모델은 생성된 인물을 읽고 명확성을 위해 다시 작성합니다. 이것은 v2의 핵심 기술 추가였습니다.
6. **Writeup.**LLM는 논문을 작성하고 내부 심사위원과 반복합니다.
7. **Optional: submission.**논문은 장소로 제출됩니다.

### 워크샵 승낙 결과의 의미

v2 생성된 한 논문은 ICLR 2025 워크숍에서 동료 검토를 통과했습니다. 저자들은 프로그램의 위원회에 논문의 기원을 공개했습니다. 수용은 데이터 포인트입니다. 시스템 "연구합니다"라고 주장하는 라이선스 아닙니다.

중요한 맥락: 워크숍 논문은 주요 컨퍼런스 논문보다 낮은 바입니다. 동료 평가는 험난합니다. 어떤 주어진 날에 작은 부분의 제출이 받아들여집니다. 하나의 성공은 개념의 증명이며 신뢰성 주장이 아닙니다. 네이처 2026 논문은 엔드-투-엔드 루프를 기록하고 인간 연구자들에 의해 공동으로 작성되었습니다. 그것은 "시스템이 네이처 논문을 작성하지 않았습니다".

### 독립적인 평가 결과

Beel et al. (arXiv:2502.14297) 는 외부 평가 를 실시 하였다.

- **Experiment failures.**42%의 실험은 코딩 오류 (실점 수입, 모양 부합, 정의되지 않은 변수) 로 실패했다.
- **Novelty mislabeling.**문학-복귀 단계에서는 기존 개념들이 신기한 것으로 표시되는 경우가 많았습니다. 이것은 환각의 연구 부위입니다.
- **Presentation-quality gap.**시각 언어 인형 비평은 출판 수준의 시각을 생산하여 근본적인 실험적 약점을 숨겼다.

이 단계에 있어서 가장 중요한 것은 마지막 발견입니다. 설득력 있는 연구를 하지 않고 설득력 있는 결과를 만들어내는 시스템은 분명히 실패하는 시스템보다 더 위험하고 안전하지 않습니다. 평가는 그 근거적인 주장에 도달해야 합니다.

### 모래 상자 탈출 문제

사카나의 리드미 저장소는 경고합니다.

> 이 소프트웨어의 특성상 LLM에서 생성된 코드를 실행할 수 있기 때문에 안전성을 보장할 수 없습니다. 위험한 패키지, 통제되지 않은 웹 액세스, 의도하지 않은 프로세스의 발생 위험이 있습니다. 자신의 위험에 사용하고 Docker 고립을 고려하십시오.

이것은 검증되지 않은 도메인에서 자율성의 운영 형태입니다. LLM는 코드를 작성하고, 코드가 실행됩니다. 코드는 프로세스가 할 수있는 모든 것을 할 수 있습니다. 파일 시스템, 네트워크 및 프로세스 작업을 엄격하게 제한하는 샌드박스 없이는, 모든 자율적으로 지시된 연구 에이전트는 데이터를 분출하거나 계산을 태우고 또는 자신을 다시 쓸 수 있습니다.

알파 에볼브의 샌드박스 스토리는 평가자가 꽉 차 있기 때문에 더 쉬워집니다. AI 과학자 v2의 루프는 오픈 엔드 코드를 오픈 엔드 목표로 실행합니다. 그렇기 때문에 더 강력한 격리 (Docker 최소; seccomp / gVisor 선호) 및 시스템에서 떠나기 전에 모든 제출의 수동 검토가 필요합니다.

### v2가 경계 스택에 위치해 있는

| System | Target | Output kind | Evaluator | Known failure |
|---|---|---|---|---|
| AlphaEvolve | algorithms | code | unit + benchmark | bounded by evaluator rigor |
| DGM | agent scaffolding | code | SWE-bench | reward hacking |
| AI Scientist v2 | research papers | text + code + figures | peer review (weak) | experiment failures, mislabeling, polish masking weakness |

v2는 세 가지 중 가장 약한 자동 평가자, 가장 넓은 출력 표면, 그리고 공공 유물까지 가장 짧은 경로를 가지고 있습니다. 운영 제어 장치 (샌드박스, 검토, 공개) 는 대부분의 안전 작업을 수행합니다.

```figure
mx-research-loop
```

## 사용 하 고

`code/main.py`v2 루프를 상태 기계로 시뮬레이션합니다: 아이디어 → 신기점 확인 → 실험 → 그림 → 작성 → 검토 → 받아들이거나 반복. 각 상태는 Beel 및 기타 연구 결과에 의해 구성 가능한 실패 확률을 가지고 있습니다. N 루프를 위해 시뮬레이터를 실행하고 계산하십시오:

- 얼마나 많은 아이디어가 복종에 도달하는지
- 얼마나 많은 제출에 실험적 결함이 있을 수 있는지?
- 재시험 예산이 품질과 생산성을 교환하는 방식

## 선박

`outputs/skill-ai-scientist-sandbox-review.md`연구 순환 에이전트가 모래 상자를 떠나기 전에 만든 모든 것을 위한 2 게이트 검토 체크리스트입니다.

## 운동

1. 달아`code/main.py`어떤 분자는 "깨끗한" 종이 생산합니다? 어떤 분자는 실험 실패 결함이 있는 종이 생산합니다?

2. 이미 기본값은 Beel et al.의 42% / 25%를 사용했습니다.`--experiment-failure 0.20 --novelty-mislabel 0.10`그리고 그 다음으로`--experiment-failure 0.60 --novelty-mislabel 0.40`양쪽의 은 부분도 어떻게 변합니다?

3. 샌드박스 요구 사항에 대한 사카나의 AI 과학자 v2 repo README를 읽어보십시오. 다일 자율주행에 적용되는 두 가지 추가 제한 (도커를 넘어) 를 명명하십시오.

4. Beel et al. 문장 4부 를 읽어 보십시오. 프레젠테이션 품질 격차 에 관한 내용. 실험적 으로 흠이 있는 색 돋보이는 논문을 잡을 수 있는 한 가지 추가 평가자 를 설계 하십시오.

5. 연구원 결과물을 연구하는 사람-검토 프로토콜을 제안하여 "박사학자가 모든 논문을 읽는다"보다 더 잘 스케일하는 것을 제안하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|---|---|---|
| AI Scientist v1 | "Sakana's templated research agent" | Filled experiments into a fixed scaffold |
| AI Scientist v2 | "Template-free research agent" | Agentic tree search with VLM figure critique |
| Agentic tree search | "Branching research agent" | Expands multiple experiment plans in parallel; prunes by internal critic |
| Vision-language critique | "VLM polish on figures" | Multimodal model reads figures and rewrites them for clarity |
| Literature retrieval | "Novelty check" | Searches prior work to confirm idea novelty — documented to mislabel |
| Polish masking | "Pretty paper, broken research" | Presentation quality exceeds experimental quality; hides weaknesses |
| Sandbox escape | "LLM code breaks out" | Agent-executed code does things the loop designer did not intend |

## 더 많은 읽기

- [Yamada et al. (2025). The AI Scientist-v2](https://arxiv.org/abs/2504.08066) 종이
- [Sakana blog on the Nature 2026 publication](https://sakana.ai/ai-scientist-nature/) 동료 검토 맥락을 가진 공급자 요약.
- [Beel et al. (2025). Independent evaluation of The AI Scientist](https://arxiv.org/abs/2502.14297) 외부 평가 번호
- [Sakana AI Scientist v1 paper](https://arxiv.org/abs/2408.06292) 템플릿 전신
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) 개방형 연구 기관의 더 넓은 틀
