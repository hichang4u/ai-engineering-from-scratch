# 캡스톤 15  헌법 안전 장갑 + 레드 팀 범위

> 애너트로피의 헌법 분류자, 메타의 라마 경비자 4, 구글의 쉴드게마 2, NVIDIA의 네모트론 3 콘텐츠 안전, 다국어 커버리지를 위한 X- 경비자 등이 2026년 안전 분류자 스택을 정의했다. 가락, 파이리트, NVIDIA Aegis, 그리고 promptfoo는 표준 적대 평가 도구가되었습니다. 네모 가드레일스 v0.12는 그들을 생산 파이프라인으로 연결합니다. 이 톱스톤은 모든 것을 하나로 연결합니다. 목표 앱을 둘러싼 층층 안전 배너스, 6개 이상의 공격 가족을 운영하는 자율적 적색 팀 에이전트, 그리고 측정 가능한 무해함 델타를 생성하는 헌법적 자기 비판 실행.

**Type:** Capstone
**Languages:** Python (safety pipeline, red team), YAML (policy configs)
**Prerequisites:** Phase 10 (LLMs from scratch), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 18 (ethics, safety, alignment)
**Phases exercised:**P10 · P11 · P13 · P14 · P18
**Time:** 25 hours

## 문제

2026년 LLM 안전의 한계는 분류기가 작동하는지 아닌 (대부분적으로 작동하는 것) 에 달려있지 않고, 너무 거부하거나 명백한 구멍을 남기지 않고 생산 앱을 중심으로 올바르게 구성하는 방법에 달려 있습니다. 라마 경비 4호는 영국 정책 위반을 처리합니다. X-Guard (132 언어) 는 다국어 jailbreak을 처리합니다. ShieldGemma-2는 이미지 기반의 임플릿 주사를 잡는다. NVIDIA 네모트론 3 콘텐츠 안전은 기업 범위를 포함한다. 안드로피크의 헌법 분류자는 봉사하는 대신 훈련 중에 사용되는 별도의 접근법입니다.

공격 진화도 중요합니다. PAIR와 TAP는 JAILBREAK 발견을 자동화합니다. GCG는 gradient 기반의 자사적 공격을 실행합니다. 멀티 턴 및 코드 스위치 공격은 에이전트 메모리를 악용합니다. 임의의 배포 된 LLM는 적색 팀 범위가 필요합니다.

목표 응용 프로그램을 강화 (무엇이든 명령어 조정된 8B 모델 또는 다른 캡스톤의 RAG 채팅봇 중 하나), 6+ 공격 가족들을 그것에 대항하여 실행하고, 그리고 Before/after 무해성 측정을 생성합니다.

## 개념

안전 파이프라인은 5층입니다.**Input sanitize**: 0 너비의 자그마한 자그마한을 구부리고, base64/rot13를 해독하고, 유니코드를 정상화합니다. **Policy layer**: NeMo Guardrails v0.12 레일 (분야 밖, 독성, PII 추출) **Classifier gate**: Llama Guard 4 입력, X-Guard 비영리 입력, ShieldGemma-2 이미지 입력. **Model**: 대상 LLM. **Output filter**: Llama Guard 4 출력, Presidio PII 스크러브, 해당 경우 인용 집행. **HITL tier**: 높은 위험성을 표시한 출력들은 Slack 줄을 잇습니다.

레드 팀 범위는 스케줄러에서 실행됩니다. PAIR와 TAP는 자율적으로 jailbreaks를 발견합니다. GCG는 gradient 기반의 자수 공격을 실행합니다. ASCII / base64 / rot13 코딩 공격. 다중 회전 공격 (인격 채택, 메모리 착취). 코드 스위치 공격 (스와힐리 또는 태국어와 영어 혼합). 각 실행은 CVSS 점수 및 공개 시간 라인을 가진 구조화된 발견 파일을 생성합니다.

헌법-자신평론 실행은 훈련 시간 개입입니다. 1k의 해로운 시도의 요청을 받아, 모델에 응답을 작성하고, 작성된 헌법에 (해하지 않는 규칙) 반하여 비판을 반복하고, 비판 루프에서 재훈련하십시오.

## 건축

```
request (text / image / multilingual)
      |
      v
input sanitize (strip zero-width, decode, normalize)
      |
      v
NeMo Guardrails v0.12 rails (off-domain, policy)
      |
      v
classifier gate:
  Llama Guard 4 (English)
  X-Guard (multilingual, 132 langs)
  ShieldGemma-2 (image prompts)
  Nemotron 3 Content Safety (enterprise)
      |
      v (allowed)
target LLM
      |
      v
output filter: Llama Guard 4 + Presidio PII + citation check
      |
      v
HITL tier for flagged outputs

parallel:
  red-team scheduler
    -> garak (classic attacks)
    -> PyRIT (orchestrated red team)
    -> autonomous jailbreak agent (PAIR + TAP)
    -> GCG suffix attacks
    -> multilingual / code-switch
    -> multi-turn persona adoption

output: CVSS-scored findings + disclosure timeline + before/after harmlessness delta
```

## 

- 안전 분류자: 라마 가드 4, 쉴드게마 2, NVIDIA 네모트론 3 콘텐츠 안전, X-가드
- 가드레일 프레임워크: 네모 가드레일스 v0.12 + OPA
- 레드 팀 드라이버: garak (NVIDIA), PyRIT (Microsoft Azure), NVIDIA Aegis, promptfoo
- 포유 탈출 요인: PAIR (Chao et al., 2023), Tree-of-Attacks (TAP), GCG 자사
- 헌법 교육: 인류학적인 스타일의 자기 비판 루프 + 비판에 대한 SFT
- PII 스크럽: 프레시디오
- 목표: 명령에 맞춰진 8B 모델 또는 다른 캡스톤의 RAG 채팅봇

```figure
cf-safety-stack
```

## 건설 해

1. **Target setup.**vLLM에 8B 명령어 조율 모델을 설치 (또는 다른 capstone에서 RAG 채팅봇을 재사용)

2. **Safety pipeline wrap.**목표물을 둘러싼 5층 파이프 라인을 연결하여 각 층이 개별적으로 관찰 가능한지 확인합니다.

3. **Classifier coverage.**라마 경비 4, X- 경비 (다국어), 쉴드게마-2 (사진) 를 로드하세요. 기호선을 설정하기 위해 작은 라벨 세트에 각각 실행하세요.

4. **Red-team scheduler.**일정을 정해라크, 파이리트, PAIR 에이전트, TAP 에이전트, GCG 러너, 멀티 턴 공격자, 코드 스위치 공격자 각각은 별도의 줄을 달린다.

5. **Attack suite.**6개의 공격 가족: (1) PAIR 자동 제일브레이크, (2) TAP 트리 오브 공격, (3) GCG 그라디언트 자사자, (4) ASCII/base64/rot13 코딩, (5) 멀티 턴 페르소나, (6) 다국어 코드 스위치. 가족별 성공률을 보고하십시오.

6. **Constitutional self-critique.**1k 해로운 시도의 명령들을 관리하십시오. 각 하나에 대해, 목표가 응답을 작성합니다. 비판 LLM는 작성된 헌법에 대해 점수를 얻습니다 ("해하지 마십시오", "증거를 인용하십시오", "불법한 요청을 거부하십시오"). 비판적 객체가 다시 작성되는 명령들; 비판 개선된 쌍에 대한 목표의 미세조각. 수행된 평가에서 무해성을 측정하기 전에 / 후에.

7. **Over-refusal measurement.**양성형 응답자 (예: XSTest) 에 대한 거짓 양성률을 추적하십시오.

8. **CVSS scoring.**성공적인 Jailbreak에 대해 CVSS 4.0 ( 공격 벡터, 복잡성, 영향) 에 점수를 얻으십시오. 공개 시간표 및 완화 계획을 생성하십시오.

9. **Range automation.**위의 모든 것은 크론으로 실행됩니다. 발견은 줄을 쓰며, 과도한 거부 회귀는 Slack에 화재 알림을 제공합니다.

## 사용 하 고

```
$ safety probe --model=target --family=PAIR --budget=50
[attacker]   PAIR agent running on target
[attack]     attempt 1/50: disguise query as academic research ... blocked
[attack]     attempt 2/50: appeal to roleplay ... blocked
[attack]     attempt 3/50: chain-of-thought coax ... SUCCEEDED
[finding]    CVSS 4.8 medium: roleplay bypass on target
[range]      7 successes out of 50 (14% success rate)
```

## 선박

`outputs/skill-safety-harness.md`생산급의 층층 안전 파이프라인과 재생 가능한 적색 팀 범위, 그리고 그 전/후 무해함 델타

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Attack-surface coverage | 6+ attack families exercised, 2+ languages |
| 20 | True-positive / false-positive trade-off | Attack block rate vs XSTest benign pass rate |
| 20 | Self-critique delta | Before/after harmlessness on held-out eval |
| 20 | Documentation and disclosure | CVSS-scored findings with timeline |
| 15 | Automation and repeatability | Everything runs on cron with alerts |
| **100** | | |

## 운동

1. RAG 채팅봇에 간격 주입을 위한 가락 플러그인을 실행하고 출력 필터 레이어와 그렇지 않은 공격 성공률을 비교하십시오.

2. 7번째 공격 가족: 간접적 인 즉시 주사를 검색한 문서로 추가하여 추가 방어량을 측정합니다.

3. "지원함 으로 거절" 모드를 구현: 보호 릴이 차단되면 목표물이 평면적 거부 대신 더 안전한 관련 답변을 제공합니다. XSTest 델타를 측정합니다.

4. 다국어 커버리지 격차: X-Guard이 저질렀던 언어를 찾아라. 이를 대상으로 한 세밀한 데이터 세트를 제안한다.

5. 30B 모델에서 헌법적 자기평론을 실행하고 델타 스케일인지 측정합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Layered safety | "Defense in depth" | Multiple guardrails at input, gate, output, HITL |
| Llama Guard 4 | "Meta's safety classifier" | The 2026 reference input/output content classifier |
| PAIR | "Jailbreak agent" | Paper (Chao et al.) on LLM-driven jailbreak discovery |
| TAP | "Tree-of-Attacks" | Tree-search variant of PAIR |
| GCG | "Greedy coordinate gradient" | Gradient-based adversarial suffix attack |
| Constitutional self-critique | "Anthropic-style training" | Target drafts -> critic scores -> rewrite -> retrain |
| XSTest | "Benign probe set" | Benchmark for over-refusal regression |
| CVSS 4.0 | "Severity score" | Standard vulnerability scoring for safety findings |

## 더 많은 읽기

- [Anthropic Constitutional Classifiers](https://www.anthropic.com/research/constitutional-classifiers) 교육 시간 참조
- [Meta Llama Guard 4](https://www.llama.com/docs/model-cards-and-prompt-formats/llama-guard-4/) 2026의 입력/출력 분류기
- [Google ShieldGemma-2](https://huggingface.co/google/shieldgemma-2b) 이미지 + 멀티모달 안전
- [NVIDIA Nemotron 3 Content Safety](https://developer.nvidia.com/blog/building-nvidia-nemotron-3-agents-for-reasoning-multimodal-rag-voice-and-safety/) 기업 참조
- [X-Guard (arXiv:2504.08848)](https://arxiv.org/abs/2504.08848) 132개의 언어의 다국어 안전
- [garak](https://github.com/NVIDIA/garak) NVIDIA 레드 팀 도구 킷
- [PyRIT](https://github.com/Azure/PyRIT) 마이크로소프트의 레드 팀 프레임워크
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) 철도 체제
- [PAIR (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) 제일브레이크 에이전트 종이
