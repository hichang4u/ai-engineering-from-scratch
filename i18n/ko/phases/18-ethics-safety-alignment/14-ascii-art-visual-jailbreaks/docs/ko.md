# ASCII 예술 및 시각적인 포일 브레이크

> , , , 시앙, 라마수브라마니안, 리, 푸벤드란, "아트프롬트: ASCII 아트 기반의 Jailbreak 공격" (ACL 2024, arXiv:2402.11753). 안전 관련 토큰을 해로운 요청에 숨기고, 같은 글자의 ASCII 예술 렌더링으로 교체하고, 은폐된 요청을 보내십시오. GPT-3.5, GPT-4, Gemini, Claude, Llama-2 모두 ASCII-아트 토큰을 잘 인식하지 못합니다. 공격은 PPL (분명성 필터), 파라프라즈 방어, 그리고 리토케니제이션을 우회합니다. 관련: ViTC 벤치마크는 비시맨틱 시각적 명령어의 인식을 측정합니다. StructuralSleight는 코드 공격의 한 가족으로서 비공개 텍스트-코딩 된 구조 (나무, 그래프, 둥근 JSON) 로 일반화합니다.

**Type:** Build
**Languages:** Python (stdlib, ArtPrompt token-masking harness)
**Prerequisites:** Phase 18 · 12 (PAIR), Phase 18 · 13 (MSJ)
**Time:** ~60 minutes

## 학습 목표

- ArtPrompt 공격에 대해 설명하십시오. 단어 식별 단계, ASCII-아트 대체, 최종 기호 명령.
- 표준 방어 (PPL, 패라프라지, 리토케니제이션) 이 ArtPrompt에서 실패하는 이유를 설명하십시오.
- ViTC를 정의하고 측정하는 것을 설명하십시오.
- StructuralSleight를 임의의 비공개 텍스트-코딩 구조에 대한 일반화로 설명하십시오.

## 문제

패러프라지 및 롤 플레이 (강좌 12) 를 통해 공격 및 긴 맥락 (강좌 13) 을 통해 텍스트 수준의 패턴을 작동합니다. ArtPrompt은 인식 수준에서 작동합니다. 모델은 금지된 토큰을 분석하지 않습니다. 그것은 문자로 렌더링된 이미지를 분석합니다. 안전 필터는 무해한 점수법을 보여줍니다. 모델은 단어를 봅니다.

## 개념

### 아트프롬프트, 2단계

단계 1. 단어 식별. 해로운 요청이 주어지면 공격자는 안전 관련 단어 (예를 들어 "폭탄을 만드는 방법"에서 "폭탄") 를 식별하기 위해 LLM를 사용합니다. 

단계 2. 은폐된 프롬프트 생성. 각 식별된 단어를 ASCII-아트 렌더링으로 대체 (자문 모양을 형성하는 7x5 또는 7x7 문자 블록) 이 됩니다. 모델은 충분한 능력을 가진 모델이 단어로 인식할 수 있는 점수와 공간을 그리드 (grid) 를 받습니다. 안전 필터는 그릴만 볼 수 있습니다.

결과는: GPT-4, Gemini, Claude, Llama-2, GPT-3.5 모두 실패. 그들의 벤치마크 하위 집합에서 75% 이상의 공격 성공률.

### 왜 표준 방어 장치가 실패하는가

- **PPL (perplexity filter).**ASCII 예술은 높은 혼란을  하지만 모든 새로운 입력도 마찬가지입니다. ArtPrompt을 차단하는 임계 선택은 합법적인 구조화된 입력도 차단합니다.
- **Paraphrase.**프라임프트를 패러프레이즈하는 것은 ASCII 예술을 파괴합니다. 실제로, 패러프레이즈 LLM는 종종 예술을 보존하거나 재구성합니다.
- **Retokenization.**다른 방식으로 토큰을 나눌 때 모델의 시선이 문자 모양을 인식한다는 것은 변하지 않습니다.

근본적인 문제는 안전 필터들이 토큰 또는 의미적 수준이며, ArtPrompt은 시각적 인식 수준에서 작동합니다.

### ViTC 기준

비시민적 시각적 명령어를 인식합니다. 모델의 ASCII-아트, 윙딩 및 다른 비 텍스트-시민적 시각적 콘텐츠를 읽을 수있는 능력을 측정합니다. ArtPrompt의 효과는 ViTC 정확성과 상관관계가 있습니다. 모델이 시각적 텍스트를 더 잘 읽으면 ArtPrompt이 더 잘 작동합니다. 이것은 능력-안전 거래입니다.

### 구조적

ArtPrompt: 비공개 텍스트 복제 구조 (UTES) 를 일반화합니다. 나무, 그래프, 둥지를 틀어 놓은 JSON, CSV-in-JSON, 다른 스타일의 코드 블록. 구조가 안전 데이터를 훈련하는 데 희귀하지만 모델에 의해 분석될 수 있다면 유해한 콘텐츠를 숨길 수 있습니다.

방어의 의미는: 안전은 모델이 분석할 수 있는 구조화된 표현을 통틀어 일반화해야 합니다.

### 이미지 모다리티 아날로그

시각 LLM (GPT-5.2, Gemini 3 Pro, Claude Opus 4.5, Grok 4.1) 는 공격 표면을 확장합니다. 실제 이미지를 가진 ArtPrompt 스타일의 공격은 ASCII-아트 유사보다 강합니다. 이미지 코더가 더 풍부한 신호를 생성하기 때문입니다.

### 이 부분은 18단계에 맞게

12-14 과목은 반복적 정제 (PAIR), 맥락 길이가 (MSJ), 코딩 (ArtPrompt/StructuralSleight) 등 3개의 정형 공격 벡터를 기술한다. 15 과목은 모델 중심의 공격에서 시스템 경계 공격으로 전환된다. 16 과목은 방어 도구 반응을 기술한다.

```figure
al-ascii-cloak
```

## 사용 하 고

`code/main.py`아스키아 미술 글립으로 해로운 질의에 있는 특정 단어를 숨길 수 있고, 숨은 문자열이 키워드 필터를 통과하는지 확인하고, 간단한 인식기를 사용하여 (선택적으로) 숨은 문자열을 다시 복호화 할 수 있습니다.

## 선박

이 교훈은`outputs/skill-encoding-audit.md`. Jailbreak 방어 보고서를 보면, 해당 공격 가족 (ASCII 예술, base64, 리트 스피크, UTF-8 호모글리프, UTES) 과 각 공격에 해당하는 방어 계층을 나열한다.

## 운동

1. 달아`code/main.py`. 가래 문자열이 간단한 키워드 필터를 통과하는지 확인합니다.

2. 두 번째 코딩을 구현: 동일한 목표 단어의 base64. ArtPrompt와 필터 회전 속도와 복구 난이도를 비교하십시오.

3. 2024 장 4.3 (제5 모델 결과) 을 읽어 보십시오. 같은 기준에 클로드의 ArtPrompt 저항이 쌍둥이보다 높은 이유를 제안하십시오.

4. ASCII-아트 모양의 지역을 프롬프트에서 감지하는 사전 세대 방어 장치를 설계하십시오. 합법적인 코드, 테이블 및 수학 표기에서 거짓 긍정률을 측정하십시오.

5. StructuralSleight는 10개의 코딩 구조를 나열하고, 10개의 구조를 모두 처리하는 일반화된 방어 구조를 스케치하고, 방어된 프롬프트에 대한 계산 비용을 추정한다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| ArtPrompt | "the ASCII-art attack" | Two-step jailbreak that masks safety words with ASCII-art renderings |
| Cloaking | "hide the word" | Replace a forbidden token with a visual representation the model reads but the filter does not |
| UTES | "uncommon structure" | Uncommon Text-Encoded Structure — tree, graph, nested JSON, etc. used to smuggle content |
| ViTC | "visual-text capability" | Benchmark for model's ability to read non-semantic visual encoding |
| Perplexity filter | "PPL defense" | Reject prompts with high perplexity; fails because legitimate structured input also scores high |
| Retokenization | "tokenizer shift defense" | Pre-process the prompt with a different tokenizer; fails because recognition is visual |
| Homoglyph | "lookalike characters" | Unicode characters that look identical to Latin letters; bypass substring checks |

## 더 많은 읽기

- [Jiang et al. — ArtPrompt (ACL 2024, arXiv:2402.11753)](https://arxiv.org/abs/2402.11753) ASCII-아트 jailbreak 종이
- [Li et al. — StructuralSleight (arXiv:2406.08754)](https://arxiv.org/abs/2406.08754) UTES 일반화
- [Chao et al. — PAIR (Lesson 12, arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) 상호 연쇄 공격
- [Anil et al. — Many-shot Jailbreaking (Lesson 13)](https://www.anthropic.com/research/many-shot-jailbreaking) 추가 길이 공격
