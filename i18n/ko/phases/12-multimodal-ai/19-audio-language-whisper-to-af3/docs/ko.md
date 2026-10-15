# 오디오 언어 모델: 오디오 플라밍고 3 아크에 속삭이는 것

> 휘스퍼 (래드퍼트 등, 2022년 12월) 는 음성 인식 (소음 인식) 을 해결했습니다. 약 680k 시간 동안 감독이 잘 되지 않는 다국어 연설, 간단한 앵코더-독호 변환기, 모든 후속 ASR 릴리지가 인용하는 기준이 되었습니다. 하지만 인정은 논리적인 것은 아닙니다. "이 녹음 에 무슨 악기 들 이 있다?" 또는 "이번 강연자 는 어떤 감정 을 표현 하고 있다?" 또는 "제3분 에 무슨 일 이 있었습니까?" 라는 질문 을 하는 데는 음향 이해가 필요 하며, 그 내용 을 기록 하는 것 이 아니다. Qwen-Audio, SALMONN, LTU, 그리고 NVIDIA의 Audio Flamingo 3 (AF3, 2025년 7월) 는 점진적으로 그 스택을 구축했습니다. Whisper 클래스 코더를 유지, Q-포머를 , 오디오 텍스트 명령 데이터에 대한 훈련, 사슬의 추론을 추가합니다. 이 교훈은 활을 걷고 있습니다.

**Type:** Build
**Languages:** Python (stdlib, log-Mel spectrogram + audio Q-former skeleton)
**Prerequisites:** Phase 6 (Speech and Audio), Phase 12 · 03 (Q-Former)
**Time:** ~180 minutes

## 학습 목표

- 물결 모양에서 로그-멜 스펙트럼을 계산한다: 창, FFT, 필터 은행, 로그 변환.
- 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙크 윙 윙크 윙크 윙크 윙크 윙 윙크 윙 윙 윙크 윙크 윙 윙 윙 윙 윙 윙 윙
- 오디오 Q-former: N 학습 가능한 쿼리를 제작하여 스펙트럼 패치에 대응합니다.
- 캐스케이드 (Whisper-then-LLM) 와 엔드-투-엔드 오디오-LLM 훈련이 왜 엔드-투-엔드 스케일이 논리적으로 더 좋는지 설명하십시오.

## 문제

음성 인식은 휘스퍼에 의해 해결되었습니다. 오디오의 OCR는 상품입니다. 그러나 " 상품"은 전개시에 멈춰집니다. 모델이 들은 것에 대해 논의를 할 수 없다면  시간, 스피커, 감정, 음악 구조, 환경 사운드  전개만으로 제품 특징을 주도할 수 없습니다.

3가지 확실한 경로:

1. 캐스케이드: 휘스퍼의 기록, LLM의 기록에 대한 설명. 순수한 언어 시나리오에 대한 작업. 음악, 환경 오디오, 멀티 스피커 오버라프, 감정에 대한 실패.

2. 엔드-투-엔드 오디오-LLM: 오디오 코더는 오디오 토큰을 LLM에 직접 입력하여, 전개를 건너뛰는다. 음향 정보를 (감각, 스피커, 환경) 보존한다. 새로운 훈련 데이터를 필요로 한다.

3. 하이브리드: 오디오 코더 + 텍스트 디코더, 이 방법은 번역과 추론을 할 수 있습니다. Qwen-Audio와 Audio Flamingo는 이 방법을 선택합니다.

## 개념

### 로그-멜 스펙트로그램: 입력 기능

모든 오디오 코더는 같은 기능으로 시작됩니다. 로그-멜 스펙트럼입니다.

1. 16kHz로 다시 샘플링
2. 25ms 창, 10ms 도약
3. FFT 결과의 크기를 생각해 봅시다.
4. Mel 필터 뱅크 (일반적으로 0-8000 Hz 로그-스페이스 80 필터) 를 인식 주파수에 왜곡하도록 적용한다.
5. 로그 압축$(\log(1 + x))$역동적인 범위

결과: T는 시간 프레임의 수 (T, 80) 이 있는 2D 모양의 배열. 100 Hz 프레임 속도에서 30초 클립: (3000, 80).

### 휘스퍼의 코더

휘스퍼의 코더는 12층 ViT 스타일의 트랜스포머로 로그-멜 스펙트럼을 시간 프레임의 순서로 처리합니다. 출력: 시간 프레임에 한 개의 숨겨진 상태 벡터.

ASR에 있어서, Whisper의 디코더는 코드 출력에서 조건화된 텍스트 토큰을 생성하는 크로스-아트런션 트랜스포머입니다. 표준 코드-디코더.

ALM (audio-LLM) 에 대해, 다른 LLM에 입력되는 엔코더 출력을 원하는 패턴은: Whisper encoder frozen, Q-former trainable, LLM frozen 또는 tuned입니다.

### BEAT 및 오디오 특화된 코더

Whisper는 음성에서 지배적인 데이터를 기반으로 훈련되었습니다. 음악과 환경 오디오에 더 약한 것입니다.

BEATs (Chen et al., 2022) 는 AudioSet에서 훈련된 자율 감독 트랜스포머입니다. 같은 매개 변수 수를 통해 Whisper보다 더 나은 음악과 환경 소리를 캡처합니다.

AF-Whisper (Audio Flamingo 3의 하이브리드): 컨카트 Whisper + BEAT는 오디오 입력으로 기능합니다. Whisper는 언어적 신호를, BEAT는 음향 신호를 운반합니다.

### 오디오 Q-former

BLIP-2의 시각 Q-former과 동일한 패턴. 학습 가능한 질의 일정한 수 (32 또는 64개) 는 오디오 코더의 출력 프레임에 걸쳐서 교차합니다. 질의들은 LLM에서 소비되는 오디오 토큰이됩니다.

교육 조율 단계: Q-former 혼자, 오디오 텍스트 쌍 (AudioCaps, Clotho) 에 대한 대조적 + 캡션 손실. 교육 단계: 끝에서 끝, LLM를 해제, 교육 데이터에 대한 훈련.

###  SALMONN, Qwen-Audio, AF3

SALMONN (Tang et al., 2023): Whisper + BEATs + Q-former + LLaMA. 진지한 추론 능력을 가진 최초의 오픈 오디오-LLM. MMAU의 벤치마크는 ~0.55 복합을 보여줍니다.

Qwen-Audio (Chu et al., 2023): 비슷한 구조, 풍부한 데이터 세트에 훈련, 다중 회전 대화에 맞춰져 있습니다. MMAU ~ 0.60.

LTU  듣기, 생각, 이해 (Gong et al., 2023): 명시적인 추론 데이터, 오디오 클립에 대한 사상의 연쇄에 초점을 맞추기. 작지만 더 집중.

오디오 플라밍고 3 (고엘 및 동료, 2025년 7월): 현재 오픈 SOTA. 8B LLM 척추 (Qwen2 7B), 휘스퍼-큰 엔코더 컨카트 BEATs, 64 질의 Q-former, 1M+ 오디오 텍스트 명령어 쌍에 대한 훈련. MMAU 0.72, 일부 하위 작업에 대한 독자적인 국경에 일치합니다.

AF3는 또한 오디오에 대한 주문형 사상의 연쇄를 도입합니다. 모델은 최종 답변 전에 선택적으로 사고 토큰을 발사 할 수 있습니다 ("제기들을 먼저 확인해 보자: ..."). 복잡한 추론 작업에 대한 정확도는 사고가 활성화되면 3-5 점으로 상승합니다.

### 캐스케이드 vs 엔드-투-엔드

물결된 파이프라인:

1. 휘스퍼는 오디오 → 텍스트를 번역한다.
2. 문자보다는 LLM의 이유를 설명합니다.

"이 포드캐스트를 요약해라"는 완벽하게 작동합니다.
- "이 노래의 분위기는 어떠세요?"  분위기는 소리에서요, 단어에서 아닙니다.
- "누가 말하는데, 앨리스 아니면 밥?" 는 스피커를 식별하는 것을 요구합니다.
- "폭발이 일어나는 시간은 몇 분?"
- "이건 진짜나 생성된 오디오인가?"  딥팩 탐지에는 음향 기능이 필요합니다.

퀸 오디오와 AF3는 음악, 환경, 감정 등을 원천적으로 처리합니다.

### 2026 생산 레시피

새로운 오디오 이해 제품:

- 만약: 음반이 목표가 된다면 음악이 없고 감정이 없는 결과입니다.
- AF3 / Qwen-Audio-가족: 음악, 감정, 멀티 스피커, 또는 복잡한 오디오 추론

캐스케이드로는 더 저렴하고 간단합니다. 엔드-투-엔드로는 더 잘 작동합니다.

### MMAU  오디오 추론 기준

MMAU (Massive Multimodal Audio Understanding) 는 2024-2025 오디오 추론 기준입니다.

- 10,000개의 오디오 텍스트 QA 짝이 음성, 음악, 환경 소리들
- 분류, 시간적 추론, 인과적 추론, 개방형 QA를 포함한다.
- 유통된 파이프라인이 체계적으로 놓친 것을 테스트합니다.

오픈 SOTA (AF3) 0.72; 독자적인 경계 ~0.78 (Gemini 2.5 Pro, Claude Opus 4.7). 이 격차는 VideoMME의 오픈-버스-클로즈된 델타보다 작아, 오디오-LLM가 성숙하고 있음을 나타냅니다.

```figure
audio-text-ctc
```

## 사용 하 고

`code/main.py`이 부분의 본문은

- stdlib에서 로그-멜 스펙트로그램 계산을 구현: 윈도, 순진 DFT, Mel 필터-뱅크.
- 오디오 Q-전대의 골격: 주어진 엔코더 출력 프레임, Q, K, V, 주의를 계산하고 N 토큰을 발사합니다.
- 장난감 작업에 대한 종말대상 비교

## 선박

이 교훈은`outputs/skill-audio-llm-pipeline-picker.md`. 오디오 작업 (번역, 음악 태그, 감정 추론, 다중 스피커 기기화, 환경 분류) 을 고려하면, 그것은 캐스케이드, 엔드-투-엔드 AF3 또는 하이브리드를 선택합니다.

## 운동

1. 16kHz, 25ms 창, 10ms hop, 80 Mel 칸의 30초 클립의 스펙트럼 크기를 계산하세요. 48kHz에서 어떻게 변할까요?

2. 왜 Whisper가 음악에 미치지 못하는가요?

3. 64개의 질의와 32개의 질의와 함께 하는 오디오 Q-former: 어떤 작업 복잡성에 64가 보답을 주는가?

4. AF3 섹션 4 을 읽어 보십시오. 요구 를 따라 생각하는 것. 사상 연쇄가 가장 많은 도움을 주는 세 가지 오디오 작업 을 제안 하십시오.

5. AF3의 출력을 사용하여 최소적인 기하급수화 파이프라인을 구현하십시오. 스피커 변경을 어떻게 신호합니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Log-Mel spectrogram | "Mel features" | 2D (time, frequency) array of log-magnitude values after Mel filter banks |
| Audio Q-former | "Audio Perceiver" | Cross-attention bottleneck from audio encoder output to fixed-length queries feeding the LLM |
| Cascaded | "ASR-then-LLM" | Pipeline where Whisper transcribes and a text LLM reasons; loses acoustic information |
| End-to-end | "Audio-LLM" | Audio features enter the LLM directly via Q-former; preserves acoustic signal |
| BEATs | "Audio AudioSet encoder" | SSL transformer trained on AudioSet; strong on music + environmental sounds |
| MMAU | "Audio reasoning bench" | 10k QA pairs across speech, music, environment; 2024 eval standard |
| On-demand thinking | "Audio CoT" | Model can optionally emit reasoning tokens before final answer, lifts accuracy 3-5 pts |

## 더 많은 읽기

- [Radford et al. — Whisper (arXiv:2212.04356)](https://arxiv.org/abs/2212.04356)
- [Chu et al. — Qwen-Audio (arXiv:2311.07919)](https://arxiv.org/abs/2311.07919)
- [Goel et al. — Audio Flamingo 3 (arXiv:2507.08128)](https://arxiv.org/abs/2507.08128)
- [Tang et al. — SALMONN (arXiv:2310.13289)](https://arxiv.org/abs/2310.13289)
- [Gong et al. — LTU (arXiv:2305.10790)](https://arxiv.org/abs/2305.10790)
