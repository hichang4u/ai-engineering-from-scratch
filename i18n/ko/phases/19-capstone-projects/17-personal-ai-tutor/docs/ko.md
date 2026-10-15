# 캡스톤 17  개인 인공지능 튜터 ( 적응력, 멀티모달, 메모리)

> 칸미고 (칸 아카데미), 듀오링고 맥스, 교육용 구글 러닝LM/지민리, 퀴즈렛 Q- 채트, 합성 튜터 모두 2026년에 확장형 적응형 멀티모달 튜터링을 배포했습니다. 일반적인 형태는 소크라테스 정책 (따라서 답을 던지지 말고), 모든 상호 작용 후에 업데이트되는 학습자 모델 (바이시아 지식 추적 스타일), 음성 + 텍스트 + 사진 수학 입력, 교육과정 그래프 검색, 간격 반복 스케줄링 및 나이에 적합한 콘텐츠를 위한 하드 안전 필터입니다. 최종 목표는 주제별 교양자를 (K-12 대수학 또는 인트로 파이썬) 보내 10 명의 학습자와 2주간의 효과 연구와 콘텐츠 안전 감사를 통과하는 것입니다.

**Type:** Capstone
**Languages:** Python (backend, learner model), TypeScript (web app), SQL (curriculum graph via Postgres + Neo4j)
**Prerequisites:** Phase 5 (NLP), Phase 6 (speech), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 14 (agents), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P5 · P6 · P11 · P12 · P14 · P17 · P18
**Time:** 30 hours

## 문제

적응형 교육은 전술 연구 분야였습니다. 2026년까지 소비자 제품으로 변할 것입니다. 칸미고는 대부분의 미국 학교 구역에 배치되어 있습니다. 듀오링고 맥스는 수천만 마이너스 매출을 기록했습니다. 구글의 교육용 LearnLM/Gemini는 구글 클래스룸에서 튜터링을 가능하게 합니다. 퀴즈렛 Q-Chat은 플래시카드 옆에 앉아 있습니다. 교양 교양은 호기심 어린이를 위한 교양과 함께 바이러스성으로 성장했습니다. 공통 요소는: 다중형 입력 (형, 말하기, 사진 방정식), 소크라테스 교육학 (첫 질문, 나중에 설명), 각 상호 작용 후 업데이트되는 학습자 모델 및 엄격한 나이 적절한 안전.

이러한 경우, 특정 집단에 대한 한 가지의 구조를 만들 수 있습니다. 측정 바는 실제 효과 연구입니다. 10 명의 학습자들로 2 주 동안 시험 전과 시험 후 점수를 얻습니다. 음성 루프는 자연스러운 느낌 (캡스톤 03 하위 스택) 을 가져야 합니다. 메모리는 개인 정보 보호에 대한 존중을 가져야 합니다. 안전 필터는 COPPA를 인식하는 빨간 팀에서 통과해야합니다.

## 개념

네 가지 요소**Tutor policy**그것은 소크라테스 루프입니다: 학습자가 답을 묻는다면, 정책은 주요 질문을 던집니다; 그들이 그것을 올바르게 할 때, 그것은 다음 개념으로 이동합니다; 그들이 갇혀있을 때, 그것은 기판을 제공합니다. **Learner model**이것은 각 상호작용 후에 교육과정 노드별로 마스터링 확률을 업데이트하는 베이시어 지식 추적 (또는 간단한 변종) 이다. **Curriculum graph**선제적인 가장자리를 가진 개념의 Neo4j입니다. 정책은 다음 개념을 선택하기 위해 그래프를 걸어갑니다. **Memory**에피소디컬 + 의미 저장소 (agentmemory-style) 는 과거의 상호 작용, 오류 및 선호도를 저장합니다.

UX는 다형형이다. 입력된 답변을 위한 텍스트 입력. LiveKit + Whisper를 통해 음성 입력 (재용 톱스톤 03). dots.ocr 또는 PaliGemma를 통해 수학 문제들을 위한 사진 입력 2. 카르테시아 소닉 2를 통해 음성 출력. 안전은 Llama Guard 4를 연령에 맞는 필터 (성년자 콘텐츠, 폭력, 자기 피해를 차단) 및 COPPA에 알맞은 메모리 보유 정책을 사용합니다.

효과 연구 는 결과물 이다. 10 명의 학습자, 시험 전 및 시험 후, 2 주. 학습 델타 및 신뢰 간격 보고. 적응적이지 않은 기본 기준 (교사 정책 없이 선형적으로 제공되는 동일한 콘텐츠) 와 비교하십시오.

## 건축

```
learner device
  |
  +-- text         -> web app
  +-- voice        -> LiveKit Agents (ASR + TTS)
  +-- photo math   -> dots.ocr / PaliGemma 2
       |
       v
  tutor policy (LangGraph)
       - Socratic decision head
       - next-concept chooser (curriculum graph walk)
       - hint scaffolder
       - mastery update
       |
       v
  learner model (BKT / item-response theory)
       - per-concept mastery probability
       - spaced-repetition scheduler (SM-2 or FSRS)
       |
       v
  memory (agentmemory-style)
       - episodic: every interaction
       - semantic: learned mistakes, preferences
       - retention policy: COPPA / GDPR aware
       |
       v
  curriculum graph (Neo4j)
       - prerequisite edges
       - OER content attached
       |
       v
  safety:
    Llama Guard 4 + age-appropriate filter
    memory access guarded by learner ID scope
```

## 

- 주제 선택: K-12 대수학 또는 Python의 소개 (깊음에 대해 하나를 선택)
- 튜터 정책: LangGraph over Claude Sonnet 4.7 (빠른 캐시로)
- 학습자 모델: 베이시언 지식 추적 (클래시크) 또는 FSRS
- 교육과정 그래프: 개념의 Neo4j + 필수적인 가장자리 + OER 내용
- 메모리: 에이전트 메모리 스타일의 지속적 벡터 + 에피소디컬 + 의미 저장
- 음성: 라이브킷 에이전트 1.0 + 카르테시아 소닉-2 (재사용 톱스톤 03 하위 스택)
- 사진 수학: dots.ocr 또는 PaliGemma 2 방정식을 인식하기 위해
- 안전: 라마 가드 4 + 맞춤형 연령에 맞는 필터
- Eval: Bloom 레벨 질문 생성, 시험 전/후 사용, 효능 연구 도구

```figure
cf-tutor-loop
```

## 건설 해

1. **Curriculum graph.**필요조건의 가장자리 (前条件) 를 가진 50-150 개념 노드 (예를 들어, K-12 정수 "수선"에서 "분자 공식") 의 Neo4j를 구축하십시오. 노드당 OER 콘텐츠를 첨부하십시오 (오픈 렉스북, 오픈스택스).

2. **Learner model.**예전에 대한 베이시언 지식 추적을 시작하십시오: 추측, 슬라이드, 학습 속도. 모든 상호 작용 후에 개념별 마스터링을 업데이트하십시오. 학습자마다 지속됩니다.

3. **Tutor policy.**노드 있는 랭그그래프: `read_signal`(학습자의 답이 정확했습니까?`select_concept`(최고 우선순위 개념을 선택하는 걸음 교육과정 그래프),`scaffold`(소크라테스적 인 촉구),`update_mastery`- 그래

4. **Memory.**모든 상호 작용은 에피소디컬 스토어에 기록됩니다. 오류와 선호도는 의미적 기억에 촉진됩니다. COPPA에 대한 인식 보존 정책: 1 년 후에 자동 삭제, 부모 액세스 할 수 있습니다.

5. **Voice path.**라이브킷 에이전트 직원은 튜터 정책에 부착되어 있습니다. ASR를 통해 Whisper-v3-turbo. TTS를 통해 카르테시아 소닉-2.

6. **Photo-math path.**이미지를 업로드하거나 캡처하고, dots.ocr 또는 PaliGemma 2를 실행하여 방정식을 인식하고, 구조화된 입력으로 튜터에게 입력합니다.

7. **Safety.**각 모델 출력에는 나이에 맞는 필터 (자신해, 성인 콘텐츠, 폭력) 를 통과합니다. 학습자 ID에 의해 스코프된 메모리 액세스; 삭제 할 수 있는 부모 액세스 표면.

8. **Efficacy study.**10명의 학습자, 사전 테스트 (표준화된 30가지 질문 기준), 2주간의 교양자 상호작용 (3회/주), 후 시험. 같은 내용에 대한 10명의 학습자, 적응하지 못한 기본 코호르트와 비교해 보세요.

9. **Weekly progress reports.**학습자마다 탐구된 주제, 숙달 경로, 다음 단계에 대한 PDF 요약을 자동으로 생성하십시오.

## 사용 하 고

```
learner: "I don't understand why 3x + 6 = 12 means x = 2"
[signal]   stuck
[concept]  'isolating variables' (prerequisite: addition-subtraction-equality)
[scaffold] "what number would you subtract from both sides to start?"
learner: "6"
[signal]   correct
[mastery]  addition-subtraction-equality: 0.62 -> 0.77
[concept]  continue 'isolating variables'
[scaffold] "great. now what is 3x / 3 equal to?"
```

## 선박

`outputs/skill-ai-tutor.md`학습자 모델, 메모리, 안전 및 측정된 효과에 대한 다중모달 입력과 함께 주제별 적응형 튜터.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Learning gain delta | Pre/post-test delta in a 10-learner two-week study |
| 20 | Socratic fidelity | Rubric score on transcript samples |
| 20 | Multimodal UX | Voice + photo + text coherence end to end |
| 20 | Safety + privacy posture | Llama Guard 4 pass rate + COPPA-aware retention |
| 15 | Curriculum breadth and graph quality | Concept coverage + prerequisite graph consistency |
| **100** | | |

## 운동

1. 적응 학습자 모델 (random concept order) 를 가지고 또는 사용하지 않고 효과 연구 를 수행 합니다.

2. 멀티모달 수사 를 추가 하십시오. 텍스트, 음성, 사진 으로 전달 된 동일한 개념 질문. 학습자 들 이 선호 하는 모달과 더 빨리 합병하는지 측정 하십시오.

3. 부모 패시보드를 구축: 연습된 주제, 숙달 경로, 다가올 개념, 안전 이벤트 (보호 릴 히트) COPPA에 맞추어.

4. 언어 전환 모드를 추가: 교사는 스페인어 입력을 받아 스페인어로 가르칩니다. X-Guard 보급을 측정합니다.

5. 메모리 프라이버시를 강조: 학습자 A가 음성 클립 공격으로도 학습자 B의 데이터를 볼 수 없다는 것을 확인합니다. 액세스 시도를 기록하고 알림을 확인하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Socratic policy | "Ask, do not dump" | Tutor asks a leading question rather than giving the answer |
| Bayesian knowledge tracing | "BKT" | Classic learner-model equations for mastery probability per concept |
| FSRS | "Free Spaced Repetition Scheduler" | 2024 spaced-repetition scheduler, better than SM-2 |
| Curriculum graph | "Concept DAG" | Neo4j of concepts with prerequisite edges |
| Episodic memory | "Per-interaction log" | Every interaction stored for later retrieval |
| Semantic memory | "Learned pattern store" | Compacted mistakes and preferences promoted from episodic |
| COPPA | "Kids privacy law" | US law restricting data collection from children under 13 |

## 더 많은 읽기

- [Khanmigo (Khan Academy)](https://www.khanmigo.ai) K-12 교육자
- [Duolingo Max](https://blog.duolingo.com/duolingo-max/) 언어 학습의 참고 교양
- [Google LearnLM / Gemini for Education](https://blog.google/products-and-platforms/products/education/google-learnlm-gemini-generative-ai/) 호스트 참조 모델
- [Quizlet Q-Chat](https://quizlet.com) 대체 참조
- [Synthesis Tutor](https://www.synthesis.com) 시작 참조
- [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki) 간격 반복 스케줄링
- [Bayesian Knowledge Tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing) 학습자 모델 클래식
- [LiveKit Agents](https://github.com/livekit/agents) 음성 스택
