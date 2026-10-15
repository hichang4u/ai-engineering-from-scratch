# 텍스트 처리  토큰화, 줄거리, 레마티케이션

> 언어는 연속적이고 모델은 분리적이며 사전 처리도 다리입니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## 문제

모델은 "고양이 달리고 있었다"는 것을 읽을 수 없습니다.

모든 NLP 시스템은 같은 세 가지 질문으로 시작합니다. 단어의 시작은 어디서 시작되는가? 단어의 뿌리 는 무엇입니까? "런", "런", "런"은 도움이 될 때 같은 것으로 어떻게 취급하고, 그렇지 않은 경우 다른 것으로 어떻게 취급합니까?

토큰화 잘못되면 모델은 쓰레기로부터 배웁니다.`don't`하지만`do n't`두 가지로, 훈련 분포는 갈라진다.`organization`그리고`organ`만약 당신의 렘티저는 언어의 일부 맥락을 필요로 하지만 그것을 통과하지 않는다면, 동사는 명명으로 취급됩니다.

이 수업은 처음부터 세 가지 사전 처리 단계를 구축하고, NLTK와 spaCy가 같은 작업을 어떻게 수행하는지 보여줍니다.

## 개념

세 가지 작업이 있고, 각각의 작업은 실패 모드입니다.

**Tokenization**토큰은 의도적으로 모호하기 때문에 올바른 미분성도 작업에 달려 있습니다. 클래식 NLP의 단어 수준. 트랜스포머의 하위 단어. 백공간이 없는 언어의 문자.

**Stemming**규칙이 있는 후자수를 잘라내죠.`running -> run`-`organization -> organ`두번째는 실패 모드입니다.

**Lemmatization**언어적 지식을 이용해서 단어의 사전적 형태를 줄이는 것. 느리고 정확하기 위해서는 검색 테이블이나 형식 분석기가 필요합니다. `ran -> run`(런은 "런"의 과거 시간입니다.)`better -> good`( 비교 형태를 알아야 한다).

엄지손가락 규칙: 속도와 관련된 경우 소리를 지르며 소음을 용납할 수 있습니다 (찾기  индекса링, 대략적인 분류). 의미의 문제가 있을 때 렘마티지 (문제 답변, 의미 검색, 사용자가 읽을 모든 것).

```figure
edit-distance
```

## 건설 해

### 단계 1: 레전스 단어 토케니저

가장 간단한 유용한 토큰이 알파넘메릭 문자 없이 나뉘어 지표를 자체 로 유지 합니다. 완벽하지도 않고 최종하지도 않지만 한 줄에 달립니다.

```python
import re

def tokenize(text):
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+|[^\sA-Za-z0-9]", text)
```

우선 순위 에 따라 세 가지 패턴. 선택적 인 내적 aposostrophe (`don't``it's`) 순수 숫자: 독립적 인 표기 (점점) 으로 단일 비 백공간 비 알파넘버적 문자

```python
>>> tokenize("The cats weren't running at 3pm.")
['The', 'cats', "weren't", 'running', 'at', '3', 'pm', '.']
```

오류 모드 확인`3pm`으로 나뉘어`['3', 'pm']`왜냐하면 우리는 문자와 숫자의 행렬을 번갈아 놓았기 때문입니다. 대부분의 작업에 충분합니다. URL, 이메일, 해시태그 모두 깨집니다. 생산을 위해 일반적인 패턴보다 먼저 패턴을 추가하십시오.

### 단계 2: 포터 stemmer (단계 1A)

포터 알고리즘은 다섯 단계의 규칙이 있습니다. 1A 단계만으로는 가장 빈번한 영어 자사자를 다루고 패턴을 가르칩니다.

```python
def stem_step_1a(word):
    if word.endswith("sses"):
        return word[:-2]
    if word.endswith("ies"):
        return word[:-2]
    if word.endswith("ss"):
        return word
    if word.endswith("s") and len(word) > 1:
        return word[:-1]
    return word
```

```python
>>> [stem_step_1a(w) for w in ["caresses", "ponies", "caress", "cats"]]
['caress', 'poni', 'caress', 'cat']
```

규칙은 꼭대기부터 내려다보세요.`ies -> i`규칙은 왜`ponies -> poni`아니`pony`진짜 포터는 1B 단계로 문제를 해결해 줄 수 있습니다 규칙은 경쟁하고 이전 규칙이 승리하고 순서가 다른 규칙보다 더 중요합니다

### 단계 3: 검색 기반의 레마티저

레마티케이션은 형식을 필요로 합니다. 다룰 수 있는 교육 버전은 작은 레마 테이블과 패널을 사용합니다.

```python
LEMMA_TABLE = {
    ("running", "VERB"): "run",
    ("ran", "VERB"): "run",
    ("runs", "VERB"): "run",
    ("better", "ADJ"): "good",
    ("best", "ADJ"): "good",
    ("cats", "NOUN"): "cat",
    ("cat", "NOUN"): "cat",
    ("were", "VERB"): "be",
    ("was", "VERB"): "be",
    ("is", "VERB"): "be",
}

def lemmatize(word, pos):
    key = (word.lower(), pos)
    if key in LEMMA_TABLE:
        return LEMMA_TABLE[key]
    if pos == "VERB" and word.endswith("ing"):
        return word[:-3]
    if pos == "NOUN" and word.endswith("s"):
        return word[:-1]
    return word.lower()
```

```python
>>> lemmatize("running", "VERB")
'run'
>>> lemmatize("cats", "NOUN")
'cat'
>>> lemmatize("better", "ADJ")
'good'
>>> lemmatize("watched", "VERB")
'watched'
```

마지막 사례는 중요한 교육 순간입니다.`watched`우리 테이블에 있지 않아서 우리 배복은 그냥 처리해`ing`. 진짜 렘마티케이션이 적용됩니다`ed`, 불규칙적 동사, 비교적 인 명사, 음향의 변화와 함께 다수 (`children -> child`) 그래서 생산 시스템은 wordnet, spaCy의 형상 분석기 또는 완전한 형상 분석기를 사용합니다.

### 4단계: 연결시켜

```python
def preprocess(text, pos_tagger=None):
    tokens = tokenize(text)
    stems = [stem_step_1a(t.lower()) for t in tokens]
    tags = pos_tagger(tokens) if pos_tagger else [(t, "NOUN") for t in tokens]
    lemmas = [lemmatize(word, pos) for word, pos in tags]
    return {"tokens": tokens, "stems": stems, "lemmas": lemmas}
```

미흡한 조각은 POS 태그저입니다. 5 · 07 단계 (POS 태그링) 는 하나를 만듭니다. 현재, 모든 것을 기본으로 `NOUN`그리고 그 한계를 인정하라.

## 사용 하 고

NLTK와 spaCy는 생산판을 배포합니다.

### NLTK

```python
import nltk
nltk.download("punkt_tab")
nltk.download("wordnet")
nltk.download("averaged_perceptron_tagger_eng")

from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk import pos_tag

text = "The cats were running."
tokens = word_tokenize(text)
stems = [PorterStemmer().stem(t) for t in tokens]
lemmatizer = WordNetLemmatizer()
tagged = pos_tag(tokens)


def nltk_pos_to_wordnet(tag):
    if tag.startswith("V"):
        return "v"
    if tag.startswith("J"):
        return "a"
    if tag.startswith("R"):
        return "r"
    return "n"


lemmas = [lemmatizer.lemmatize(t, nltk_pos_to_wordnet(tag)) for t, tag in tagged]
```

`word_tokenize`수축, 유니코드, 엣지 케이스, 레지엑스가 놓친 경우`PorterStemmer`5단계 모두 실행됩니다.`WordNetLemmatizer`NLTK의 Penn Treebank 스키마에서 WordNet의 약자 세트로 번역된 POS 태그가 필요합니다. 위의 번역 케이블은 대부분의 튜토리얼에서 생략되는 비트입니다.

### 이식

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("The cats were running.")

for token in doc:
    print(token.text, token.lemma_, token.pos_)
```

```
The      the     DET
cats     cat     NOUN
were     be      AUX
running  run     VERB
.        .       PUNCT
```

스파사이는 전체 파이프라인을 뒤덮고 있습니다`nlp(text)`토큰화, POS 태그화, 레마티케이션 모두 실행됩니다. NLTK보다 규모가 빨라집니다. 상자 밖으로 더 정확합니다. 타협은 개별 구성 요소를 쉽게 교환할 수 없다는 것입니다.

### 언제 선택해야 하는 것

| Situation | Pick |
|-----------|------|
| Teaching, research, swapping components | NLTK |
| Production, multi-language, speed matters | spaCy |
| Transformer pipeline (you'll tokenize with the model's tokenizer anyway) | Use `tokenizers` / `transformers` and skip classical preprocessing |

### 두 가지 실패 모드 아무도 경고하지 않습니다

대부분의 튜토리얼은 알고리즘을 가르치고 멈추게 합니다. 두 가지 요소는 실제 사전 처리 파이프라인을 뜯어먹을 것이고, 거의 절대 다루지 않습니다.

**Reproducibility drift.**NLTK와 spaCy는 버전들 사이의 토큰화와 레마티저 행동을 변경합니다.`['do', "n't"]`spaCy 2.x에서 생산할 수 있습니다`["don't"]`3.x에서 모델은 한 배포에서 훈련되었습니다. 인퍼런스는 이제 다른 배포에서 실행됩니다. 정확도는 조용히 저하되고 아무도 이유를 모릅니다.`requirements.txt`20개의 샘플 문장의 예상 표기화를 얼어붙이는 사전 처리 회귀 테스트를 작성하고, 모든 업그레이드에서 실행하세요.

**Training / inference mismatch.**공격적인 사전 처리를 (하위자, 스톱워드 제거, 스팅) 를 사용하여 훈련하십시오. 원자 사용자 입력, 시계 성능 크레이터에 배치하십시오. 이것은 가장 일반적인 생산 NLP 실패입니다. 훈련 중에 사전 처리를 하면 추론 중에 동일한 기능을 실행해야합니다. 모델 패키지 내부의 기능으로 사전 처리를 배포하십시오. 노트북 셀로서서서링 팀은 다시 작성합니다.

## 선박

3개의 교과서를 읽지 않고도 엔지니어들이 미리 처리 전략을 선택하도록 도와주는 재사용 가능한 명령어

`outputs/prompt-preprocessing-advisor.md`이 부분의 본문은

```markdown
---
name: preprocessing-advisor
description: Recommends a tokenization, stemming, and lemmatization setup for an NLP task.
phase: 5
lesson: 01
---

You advise on classical NLP preprocessing. Given a task description, you output:

1. Tokenization choice (regex, NLTK word_tokenize, spaCy, or transformer tokenizer). Explain why.
2. Whether to stem, lemmatize, both, or neither. Explain why.
3. Specific library calls. Name the functions. Quote the POS-tag translation if NLTK is involved.
4. One failure mode the user should test for.

Refuse to recommend stemming for user-visible text. Refuse to recommend lemmatization without POS tags. Flag non-English input as needing a different pipeline.
```

## 운동

1. **Easy.**확장`tokenize`URL를 단일 토큰으로 저장하기 위해 테스트: `tokenize("Visit https://example.com today.")`한 개의 URL 토큰을 생성해야 합니다.
2. **Medium.**Porter 단계 1b를 실행하세요. 단어에 자사자가 있고 끝나는 경우`ed`또는`ing`두 개의 음음 법칙을 다루세요`hopping -> hop`아니`hopp`)
3. **Hard.**WordNet을 검색 테이블로 사용하는 lemmatizer을 만들지만 WordNet이 입력되지 않을 때 Porter stemmer에 다시 떨어집니다. 타그된 corpus에 대한 정확성을 일반 WordNet과 일반 Porter에 비교하여 측정합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Token | A word | Whatever unit the model consumes. Can be word, subword, character, or byte. |
| Stem | Root of a word | Result of rule-based suffix stripping. Not always a real word. |
| Lemma | Dictionary form | The form you'd look up. Requires grammatical context to compute correctly. |
| POS tag | Part of speech | Category like NOUN, VERB, ADJ. Needed to lemmatize accurately. |
| Morphology | Word shape rules | How a word changes form based on tense, number, case. Lemmatization depends on it. |

## 더 많은 읽기

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) 원래의 논문, 5 페이지, 여전히 가장 명확한 설명입니다.
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features) 실제 파이프라인이 어떻게 전선으로 연결되는지
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html) 아직 생각해보지 못한 토큰화 우회 사례
