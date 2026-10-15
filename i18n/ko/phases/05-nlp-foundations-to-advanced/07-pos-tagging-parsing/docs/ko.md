# POS 태그링 및 합성 분석

> 문법은 잠시 동안 비모던지였죠. 그 후 LLM 파이프라인마다 구조화된 추출을 검증해야 했습니다. 그리고 다시 돌아왔습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## 문제

1학습은 레마티케이션이 언어의 일부에 대한 태그가 필요하다는 것을 약속했습니다.`running`은 동사이고, 은 을 줄일 수 없습니다.`run`- 알 수 없이`better`이 자명 은`good`- 그래

이 약속은 전체 하위 분야를 숨기었습니다. 연설의 일부 태그링은 문법적 범주를 부여합니다. 문법 분석은 문장의 나무 구조를 회복합니다. 어떤 단어가 어느 단어를 수정하고 어떤 동사는 어떤 주장을 지배합니다. 고전적 NLP는 두 가지를 모두 정비하는 데 20 년을 보냈습니다. 이후 깊은 학습은 미리 훈련된 트랜스포머 위에 토큰 분류 작업으로 붕괴되었습니다. 연구 커뮤니티는 계속되었습니다.

응용 커뮤니티는 아닙니다. 모든 구조화된 추출 파이프라인에서는 여전히 커프 아래의 POS 및 의존성 나무를 사용합니다. LLM 생성 된 JSON는 문법적 제약에 대해 검증됩니다. 질문- 답변 시스템은 의존성 파스를 사용하여 질서를 분해합니다. 기계 번역 품질 평가자는 파스 나무의 조화를 확인합니다.

이 수업은 태그셋, 기본 라인, 그리고 처음부터 구현을 멈추고 spaCy라고 부르는 지점을 소개합니다.

## 개념

**POS tagging**각 토큰을 문법적 범주로 표시합니다.**Penn Treebank (PTB)**태그셋은 영어 기본입니다. 36개의 태그와 구별은 일반 독자가 바쁘게 생각합니다:`NN`단위 명자,`NNS`복수 명명, `NNP`고유 명자 단자,`VBD`  `VBZ`3자 단위자 현존하는 동사, 그리고 그 밖의.**Universal Dependencies (UD)**태그셋은 더  (약 17 태그) 이며 언어-불설이; 그것은 언어 간 작업의 기본이되었습니다.

```
The/DET cats/NOUN were/AUX running/VERB at/ADP 3pm/NOUN ./PUNCT
```

**Syntactic parsing**나무를 생산합니다. 두 가지 주요 스타일은

- **Constituency parsing.**명목 문장, 동사 문장, 전사 문장들은 서로 둥지를 틀고 있다. 출력 (output) 은 나뭇잎으로 단어들을 가진 비단말적 범주 (NP, VP, PP) 의 나무이다.
- **Dependency parsing.**각 단어에는 문법적 관계로 표시된 하나의 머리 단어가 있습니다. 출력 (output) 은 모든 가장자리가 (머리, 의존, 관계) 삼각형이있는 나무입니다.

의존성 분석은 2010년대에 승리했습니다. 왜냐하면 언어들, 특히 자유 단어 순서로 사용하는 언어들 사이에서 깨끗하게 일반화되기 때문입니다.

```
running is ROOT
cats is nsubj of running
were is aux of running
at is prep of running
3pm is pobj of at
```

```figure
pos-tagger
```

```figure
dependency-arcs
```

## 건설 해

### 단계 1: 가장 자주 표시되는 기본 라인

가장 멍청한 POS 태그가 작동합니다. 각 단어에 대해 훈련에서 가장 자주 사용한 태그를 예측하세요.

```python
from collections import Counter, defaultdict


def train_mft(train_examples):
    word_tag_counts = defaultdict(Counter)
    all_tags = Counter()
    for tokens, tags in train_examples:
        for token, tag in zip(tokens, tags):
            word_tag_counts[token.lower()][tag] += 1
            all_tags[tag] += 1
    word_best = {w: c.most_common(1)[0][0] for w, c in word_tag_counts.items()}
    default_tag = all_tags.most_common(1)[0][0]
    return word_best, default_tag


def predict_mft(tokens, word_best, default_tag):
    return [word_best.get(t.lower(), default_tag) for t in tokens]
```

브라운 코퍼스에서 이 기준은 85% 정도 정확합니다. 좋은 것은 아니지만, 심각한 모델이 떨어지지 않는 바닥입니다.

### 단계 2: 빅램 HMM 태그

염기서열의 합동 확률을 모델링합니다:

```math
P(\text{tags}, \text{words}) = \prod_i P(\text{tag}_i \mid \text{tag}_{i-1}) \cdot P(\text{word}_i \mid \text{tag}_i)
```

두 개의 테이블: 전환 확률 (이전 태그를 표시한 태그), 배출 확률 (어 단어 표시한 태그) 라플라스 평행으로 두 가지 계산을 추정합니다. Viterbi (टै그 격자 위에 역동적인 프로그래밍) 를 디코드하십시오.

```python
import math


def train_hmm(train_examples, alpha=0.01):
    transitions = defaultdict(Counter)
    emissions = defaultdict(Counter)
    tags = set()
    vocab = set()

    for tokens, ts in train_examples:
        prev = "<BOS>"
        for token, tag in zip(tokens, ts):
            transitions[prev][tag] += 1
            emissions[tag][token.lower()] += 1
            tags.add(tag)
            vocab.add(token.lower())
            prev = tag
        transitions[prev]["<EOS>"] += 1

    return transitions, emissions, tags, vocab


def log_prob(table, given, key, smooth_denom, alpha):
    return math.log((table[given].get(key, 0) + alpha) / smooth_denom)


def viterbi(tokens, transitions, emissions, tags, vocab, alpha=0.01):
    tags_list = list(tags)
    n = len(tokens)
    V = [[0.0] * len(tags_list) for _ in range(n)]
    back = [[0] * len(tags_list) for _ in range(n)]

    for j, tag in enumerate(tags_list):
        em_denom = sum(emissions[tag].values()) + alpha * (len(vocab) + 1)
        tr_denom = sum(transitions["<BOS>"].values()) + alpha * (len(tags_list) + 1)
        tr = log_prob(transitions, "<BOS>", tag, tr_denom, alpha)
        em = log_prob(emissions, tag, tokens[0].lower(), em_denom, alpha)
        V[0][j] = tr + em
        back[0][j] = 0

    for i in range(1, n):
        for j, tag in enumerate(tags_list):
            em_denom = sum(emissions[tag].values()) + alpha * (len(vocab) + 1)
            em = log_prob(emissions, tag, tokens[i].lower(), em_denom, alpha)
            best_prev = 0
            best_score = -1e30
            for k, prev_tag in enumerate(tags_list):
                tr_denom = sum(transitions[prev_tag].values()) + alpha * (len(tags_list) + 1)
                tr = log_prob(transitions, prev_tag, tag, tr_denom, alpha)
                score = V[i - 1][k] + tr + em
                if score > best_score:
                    best_score = score
                    best_prev = k
            V[i][j] = best_score
            back[i][j] = best_prev

    last_best = max(range(len(tags_list)), key=lambda j: V[n - 1][j])
    path = [last_best]
    for i in range(n - 1, 0, -1):
        path.append(back[i][path[-1]])
    return [tags_list[j] for j in reversed(path)]
```

브라운에 있는 빅램 HMM는 93퍼센트의 정확성을 얻습니다. 85%에서 93%까지의 점프는 대부분 전환 확률입니다.`DET NOUN`흔한 것 입니다`NOUN DET`드물게

### 3단계: 왜 현대 태그가 이보다 더 잘하는 걸까요?

전환 + 배출 확률은 지역입니다.`saw`"나는 사기를 샀다"에서 명자이지만 "영화를 봤다"에서 동사이다. 임의의 특징 (자수, 단어 모양, 단어 전과 후에, 단어 자체) 을 가진 CRF는 ~ 97%를 차지한다. BiLSTM-CRF 또는 트랜스포머는 ~98%+를 차지한다.

이 작업의 천장은 해설자 의견 차이로 설정됩니다. 인간 해설자는 펜 트리뱅크에서 97% 정도 동의합니다. 98% 이상의 모델은 테스트 세트를 과잉 적합합니다.

### 단계 4: 의존성 분석 스케치

완전히 의존성 분석은 처음부터 범위를 벗어납니다. 가톨릭 교과서 치료는 쥬라프스키와 마틴에서 있습니다.

- **Transition-based**파서 (arc-eager, arc-standard) 는 시위 감소 파서처럼 작용한다: 토큰을 읽고 스택에 옮기고, 아크를 만드는 작업을 줄이고 적용한다. 탐욕적 디코딩은 빠르다. 클래식 구현은 몰트파서이다. 현대 신경 버전: 첸과 마닝의 전환 기반 파서.
- **Graph-based**파서 (Eisner's algorithm, Dozat-Manning biaffine) 는 가능한 모든 머리 의존적인 가장자리를 점수를 받고 최대 범위의 나무를 선택합니다. 느리지만 더 정확합니다.

대부분의 응용 작업에 대해 spaCy에 전화하십시오:

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("The cats were running at 3pm.")
for token in doc:
    print(f"{token.text:10s} tag={token.tag_:5s} pos={token.pos_:6s} dep={token.dep_:10s} head={token.head.text}")
```

```
The        tag=DT    pos=DET    dep=det        head=cats
cats       tag=NNS   pos=NOUN   dep=nsubj      head=running
were       tag=VBD   pos=AUX    dep=aux        head=running
running    tag=VBG   pos=VERB   dep=ROOT       head=running
at         tag=IN    pos=ADP    dep=prep       head=running
3pm        tag=NN    pos=NOUN   dep=pobj       head=at
.          tag=.     pos=PUNCT  dep=punct      head=running
```

이 문서를 읽어보세요`dep`아래쪽에서 위로로 줄이 올라와 문장의 문법 구조가 떨어집니다.

## 사용 하 고

모든 생산 NLP 라이브러리는 표준 파이프라인의 일부로 POS 및 의존성 파서를 배포합니다.

- **spaCy**(`en_core_web_sm`- `md`- `lg`- `trf` 신속하고 정확하며, 토큰화 + NER + 레마티케이션과 통합됩니다. `token.tag_`(펜),`token.pos_`(UD), `token.dep_`(중립 관계)
- **Stanford NLP (stanza)**스탠퍼드의 후계자인 코어NLP 60개 이상의 언어로 최신 기술
- **trankit**트랜스포머 기반, 좋은 UD 정확성.
- **NLTK**-`pos_tag`사용 가능하고 느리고 나이가 많고, 가르치는 데 적합합니다.

### 2026년에도 여전히 중요한

- **Lemmatization.**수업1은 POS가 제대로 렘마티징을 해야 합니다.
- **Structured extraction from LLM outputs.**생성된 문장이 문법적 제약을 준수하는지 확인합니다 (예: 주체-행동 합의, 필요한 수정자).
- **Aspect-based sentiment.**의존성 분석은 어떤 명목이 어떤 명목을 수정하는지 알려줍니다.
- **Query understanding.**"우스 앤더슨 감독의 영화, 빌 머레이 주연"는 분석을 통해 구조화된 제약으로 분해됩니다.
- **Cross-lingual transfer.**UD 태그와 의존성 관계는 언어에 대한 비대론적이며 새로운 언어의 구조적 분석을 무사히 가능하게 한다.
- **Low-compute pipelines.**트랜스포머를 보낼 수 없다면 POS+ 의존성 분석+ 게지터가 놀라울 정도로 멀리 갈 수 있습니다.

## 선박

`outputs/skill-grammar-pipeline.md`이 부분의 본문은

```markdown
---
name: grammar-pipeline
description: Design a classical POS + dependency pipeline for a downstream NLP task.
version: 1.0.0
phase: 5
lesson: 07
tags: [nlp, pos, parsing]
---

Given a downstream task (information extraction, rewrite validation, query decomposition, lemmatization), you output:

1. Tagset to use. Penn Treebank for English-only legacy pipelines, Universal Dependencies for multilingual or cross-lingual.
2. Library. spaCy for most production, stanza for academic-grade multilingual, trankit for highest UD accuracy. Name the specific model ID.
3. Integration pattern. Show the 3-5 lines that call the library and consume the needed attributes (`.pos_`, `.dep_`, `.head`).
4. Failure mode to test. Noun-verb ambiguity (`saw`, `book`, `can`) and PP-attachment ambiguity are the classical traps. Sample 20 outputs and eyeball.

Refuse to recommend rolling your own parser. Building parsers from scratch is a research project, not an application task. Flag any pipeline that consumes POS tags without handling lowercase/uppercase variants as fragile.
```

## 운동

1. **Easy.**작은 태그 된 코퍼스에서 가장 자주 표시되는 기본 라인을 사용하여 (예를 들어, NLTK의 브라운 하위 집합) 유지된 문장에서 정확성을 측정하십시오. ~ 85% 결과를 확인하십시오.
2. **Medium.**위 위의 빅램 HMM를 훈련시켜 각 태그 정확성/부턴을 보고하세요. HMM가 가장 혼란스럽게 하는 태그는 무엇입니까?
3. **Hard.**spaCy의 의존성 분석을 사용하여 1000 문장 샘플에서 주체-행동-물질 트리플을 추출합니다. 50 개의 수동으로 표시된 트리플을 평가합니다. 추출이 실패하는 문서 (일반적으로 소극적, 좌표 및 소극적인 주체).

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| POS tag | Word's type | Grammatical category. PTB has 36; UD has 17. |
| Penn Treebank | Standard tagset | English-specific. Fine-grained verb tenses and noun number. |
| Universal Dependencies | Multilingual tagset | Coarser than PTB; language-neutral; defaults for cross-lingual work. |
| Dependency parse | Sentence tree | Each word has one head, each edge has a grammatical relation. |
| Viterbi | Dynamic programming | Finds the highest-probability tag sequence given emissions and transitions. |

## 더 많은 읽기

- [Jurafsky and Martin — Speech and Language Processing, chapters 8 and 18](https://web.stanford.edu/~jurafsky/slp3/) POS 및 분석의 가공적 교과서 처리가
- [Universal Dependencies project](https://universaldependencies.org/) 다국어 분석기마다 사용되는 다국어 태그셋과 트리뱅크 컬렉션
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features) 에서 노출된 모든 속성에 대한 실제 참조`Token`- 그래
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf)신경 파서들을 주류로 끌어들인 논문입니다.
