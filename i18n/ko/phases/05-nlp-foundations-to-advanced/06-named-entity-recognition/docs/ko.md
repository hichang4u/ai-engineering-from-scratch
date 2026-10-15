# 이름 지인된 엔티티 인식

> 이름들을 꺼내라. 다투어한 경계와 둥지를 틀어 놓은 존재, 그리고 도메인 용어와 싸워야 할 때 까지는 쉬워요.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word Embeddings)
**Time:** ~75 minutes

## 문제

"애플은 구글을 미국에서의 아이폰 검색 협정에 대해 소송했다". 5개 법인: 애플 (ORG), 구글 (ORG), 아이폰 (PRODUCT), 검색 협정 (이건 가능할 것), 미국 (GPE) 은 좋은 NER 시스템이 모든 것을 올바른 타입으로 추출한다. 나쁜 하나는 아이폰을 놓치고, 애플과 애플을 혼동하고, "미국"을 PERSON로 표시한다.

NER는 모든 구조화된 추출 파이프라인의 밑에 있는 작업마입니다. 재개정 분석, 컴플라이언스 로그 스캔, 의료 기록 익명화, 검색 질의 이해, 채팅봇 응답의 지형, 법적 계약 추출. 당신은 결코 그것을 완전히 볼 수 없습니다. 당신은 항상 그것에 의존합니다.

이 수업은 고전적인 경로를 (규칙 기반, HMM, CRF) modern (BiLSTM-CRF, 그리고 변환기) 로 진행한다. 각 단계는 그 이전의 한 가지의 특정 한계를 해결한다. 패턴은 교훈이다.

## 개념

**BIO tagging**(또는 BILOU) 는 엔티티 추출을 순서 표시 문제로 만듭니다.`B-TYPE`(단체의 시작)`I-TYPE`(내 기관) 또는`O`(어떤 단체를 제외한 경우)

```
Apple    B-ORG
sued     O
Google   B-ORG
over     O
its      O
iPhone   B-PRODUCT
search   O
deal     O
in       O
the      O
US       B-GPE
.        O
```

다 토큰 엔티티 체인: `New B-GPE``York I-GPE``City I-GPE`생물학적 구조를 이해하는 모델은 임의의 스포를 추출할 수 있습니다.

건축의 발전:

- **Rule-based.**레전스 + 게지터 검색, 알려진 엔티티에 대한 높은 정확성, 새로운 엔티티에 대한 커버리지는 전혀 없습니다.
- **HMM.**숨겨진 마코프 모델, 주어진 토큰의 배출 확률, 태그-투-태그의 전환 확률, 비터비 디코딩, 레이블된 데이터에 훈련된
- **CRF.**조건적 무작위 필드. HMM와 비슷하지만 차별적이므로 임의의 특징 (말 모양, 자사자, 이웃 단어) 을 혼합 할 수 있습니다. 여전히 2026 년에는 저자원 배포를위한 고전적인 생산 작업마마자입니다.
- **BiLSTM-CRF.**수동으로 만든 것이 아니라 신경적인 특징입니다. LSTM는 문장을 두 방향으로 읽으며, CRF 계층은 상단에 일관된 태그 순서를 강요합니다.
- **Transformer-based.**토큰 분류 헤드로 정렬된 BERT, 가장 정확하고 가장 계산이 잘 됩니다.

```figure
ner-bio-tagging
```

## 건설 해

### 단계 1: 바이오 태그링 보조

```python
def spans_to_bio(tokens, spans):
    labels = ["O"] * len(tokens)
    for start, end, label in spans:
        labels[start] = f"B-{label}"
        for i in range(start + 1, end):
            labels[i] = f"I-{label}"
    return labels


def bio_to_spans(tokens, labels):
    spans = []
    current = None
    for i, label in enumerate(labels):
        if label.startswith("B-"):
            if current:
                spans.append(current)
            current = (i, i + 1, label[2:])
        elif label.startswith("I-") and current and current[2] == label[2:]:
            current = (current[0], i + 1, current[2])
        else:
            if current:
                spans.append(current)
                current = None
    if current:
        spans.append(current)
    return spans
```

```python
>>> tokens = ["Apple", "sued", "Google", "over", "iPhone", "sales", "."]
>>> labels = ["B-ORG", "O", "B-ORG", "O", "B-PRODUCT", "O", "O"]
>>> bio_to_spans(tokens, labels)
[(0, 1, 'ORG'), (2, 3, 'ORG'), (4, 5, 'PRODUCT')]
```

### 단계 2: 손으로 만든 특징

클래식 (신경적이지 않은) NER에 있어서, 특징은 게임입니다. 유용한 것들은:

```python
def token_features(token, prev_token, next_token):
    return {
        "lower": token.lower(),
        "is_upper": token.isupper(),
        "is_title": token.istitle(),
        "has_digit": any(c.isdigit() for c in token),
        "suffix_3": token[-3:].lower(),
        "shape": word_shape(token),
        "prev_lower": prev_token.lower() if prev_token else "<BOS>",
        "next_lower": next_token.lower() if next_token else "<EOS>",
    }


def word_shape(word):
    out = []
    for c in word:
        if c.isupper():
            out.append("X")
        elif c.islower():
            out.append("x")
        elif c.isdigit():
            out.append("d")
        else:
            out.append(c)
    return "".join(out)
```

`word_shape("iPhone")`수익금`xXxxxx`-`word_shape("USA-2024")`수익금`XXX-dddd`.자본형은 정당한 명사들을 위한 높은 신호입니다.

### 단계 3: 간단한 규칙 기반 + 사전 기본 라인

```python
ORG_GAZETTEER = {"Apple", "Google", "Microsoft", "OpenAI", "Meta", "Amazon", "Netflix"}
GPE_GAZETTEER = {"US", "USA", "UK", "India", "Germany", "France"}
PRODUCT_GAZETTEER = {"iPhone", "Android", "Windows", "ChatGPT", "Claude"}


def rule_based_ner(tokens):
    labels = []
    for token in tokens:
        if token in ORG_GAZETTEER:
            labels.append("B-ORG")
        elif token in GPE_GAZETTEER:
            labels.append("B-GPE")
        elif token in PRODUCT_GAZETTEER:
            labels.append("B-PRODUCT")
        else:
            labels.append("O")
    return labels
```

제작 기지에는 위키백과와 DBpedia에서 수백만 개의 항목이 새겨져 있습니다.`Apple`(사업과 과일) 은 끔찍합니다. 그래서 통계 모델이 승리했습니다.

### 단계 4: CRF 단계 ( 스케치, 전체 임플라트)

0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0`sklearn-crfsuite`대신:

```python
import sklearn_crfsuite

def to_features(tokens):
    out = []
    for i, tok in enumerate(tokens):
        prev = tokens[i - 1] if i > 0 else ""
        nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
        out.append({
            "word.lower()": tok.lower(),
            "word.isupper()": tok.isupper(),
            "word.istitle()": tok.istitle(),
            "word.isdigit()": tok.isdigit(),
            "word.suffix3": tok[-3:].lower(),
            "word.shape": word_shape(tok),
            "prev.word.lower()": prev.lower(),
            "next.word.lower()": nxt.lower(),
            "BOS": i == 0,
            "EOS": i == len(tokens) - 1,
        })
    return out


crf = sklearn_crfsuite.CRF(algorithm="lbfgs", c1=0.1, c2=0.1, max_iterations=100, all_possible_transitions=True)
X_train = [to_features(s) for s in sentences_tokenized]
crf.fit(X_train, bio_labels_train)
```

`c1`그리고`c2`L1 및 L2 정규화입니다.`all_possible_transitions=True`모델이 불법적인 염기서열을 학습할 수 있게 합니다 (예를 들어,`I-ORG`그 후`O`) 는 불가능하며, 이것이 CRF가 당신이 제약을 작성하지 않고도 BIO 일관성을 강요하는 방법입니다.

### 단계 5: BiLSTM-CRF가 추가하는 것

기능이 학습됩니다. 입력: 토큰 임베디드 (GloVe 또는 fastText). LSTM는 왼쪽에서 오른쪽으로, 오른쪽에서 왼쪽으로 읽습니다. 연결된 숨겨진 상태는 CRF 출력 계층을 통과합니다. CRF는 여전히 태그-열의 일관성을 강제합니다. LSTM는 손으로 만든 기능을 학습된 것으로 대체합니다.

```python
import torch
import torch.nn as nn


class BiLSTM_CRF_Head(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_labels):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(hidden_dim * 2, n_labels)

    def forward(self, token_ids):
        e = self.embed(token_ids)
        h, _ = self.lstm(e)
        emissions = self.fc(h)
        return emissions
```

CRF 계층에 대해서는 사용 `torchcrf.CRF`수동으로 만든 CRF에 대한 이득은 측정할 수 있지만, 수만 개의 문장을 표시하지 않으면 예상보다 작습니다.

## 사용 하 고

spaCy는 생산급 NER를 상자 밖으로 내보내야 합니다.

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Apple sued Google over its iPhone search deal in the US.")
for ent in doc.ents:
    print(f"{ent.text:20s} {ent.label_}")
```

```
Apple                ORG
Google               ORG
iPhone               ORG
US                   GPE
```

참고`iPhone`표기된`ORG`그보다는`PRODUCT` spaCy의 작은 모델은 제품 단체의 커버링이 약한`en_core_web_lg`(전환자 모델)`en_core_web_trf`) 보다 더 잘 해줍니다.

BERT 기반 NER에 대한 포옹 얼굴:

```python
from transformers import pipeline

ner = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
print(ner("Apple sued Google over its iPhone in the US."))
```

```
[{'entity_group': 'ORG', 'word': 'Apple', ...},
 {'entity_group': 'ORG', 'word': 'Google', ...},
 {'entity_group': 'MISC', 'word': 'iPhone', ...},
 {'entity_group': 'LOC', 'word': 'US', ...}]
```

`aggregation_strategy="simple"`B-X, I-X 토큰을 융합하여 랜으로 만들면,

### LLM 기반 NER (2026 옵션)

제로 샷과 몇 샷 LLM NER는 현재 많은 영역에서 정교한 모델과 경쟁력을 갖추고 있으며, 레이블 된 데이터가 희소할 때 훨씬 더 좋습니다.

- **Zero-shot prompting.**LLM에 엔티티 타입과 예제 스케마의 목록을 제공하십시오. JSON 출력을 요청하십시오. 상자 밖으로 작동합니다. 새로운 도메인에서 정확도는 중소적입니다.
- **ZeroTuneBio-style prompting.**과제를 후보 추출 → 의미 설명 → 판단 → 재검정으로 분해하십시오. 다단계 초청 (하나의 발사) 은 생물 의학 NER에 대한 정확성을 크게 높여줍니다. 동일한 패턴은 법적, 재정 및 과학 분야에 사용됩니다.
- **Dynamic prompting with RAG.**각 추론 호출에 대한 작은 표기된 씨앗 집합에서 가장 유사한 표기된 예제를 검색하고, 몇 번의 샷 펌프를 비행에 구축하십시오. 2026 벤치마크에서는 GPT-4 생리 의학 NER F1를 정적 펌핑보다 11-12% 증가시킵니다.
- **Per-entity-type decomposition.**긴 문서에서는 모든 엔티티 타입을 한 번에 추출하는 단일 호출이 길이가 커지면서 추출을 잃습니다. 엔티티 타입에 한 개의 추출 패스를 실행하십시오. 추론 비용이 높고 정확도가 상당히 높습니다. 이것은 임상 메모 및 법적 계약에 대한 표준 패턴입니다.

2026 년 부터 생산 추천: 훈련 데이터를 수집 하기 전에 LLM의 0 샷 기본 라인스를 시작하십시오. 종종 F1는 충분히 훌륭하여 결코 정교 할 필요가 없습니다.

### 고전적 NER가 여전히 승리하는 곳

LLM가 가능하더라도, 클래식 NER는 이기는 경우:

- 지연 예산은 50ms 미만입니다.
- 수천 개의 표기된 예가 있고 98%+F1가 필요합니다.
- 도메인은 안정적인 온톨로지로, 미리 훈련된 CRF 또는 BiLSTM이 잘 전송된다.
- 규제적 제약은 현장에서의 비생성 모델이 필요합니다.

### 그 곳에는

- **Domain shift.**법정 계약에 대한 NER를 훈련시킨 NER는 기지사보다 더 나쁘죠
- **Nested entities.**"뱅크 오브 아메리카 타워"는 동시에 ORG와 FASILITY이다. 표준 BIO는 겹치는 팽창을 나타낼 수 없습니다. 당신은 둥지를 틀어있는 NER (다번 통과 또는 팽창 기반 모델) 를 필요로 합니다.
- **Long entities.**"미국 연방 예금 보험회사"라는 토큰 수준 모델은 때때로 이것을 나눕니다. 사용 `aggregation_strategy`또는 후 과정.
- **Sparse types.**의료 NER 라벨은 DRUG_BRAND, ADVERSE_EVENT, DOSE. 일반용 모델은 전혀 알지 못합니다. Scispacy와 BioBERT는 그 출발점입니다.

## 선박

`outputs/skill-ner-picker.md`이 부분의 본문은

```markdown
---
name: ner-picker
description: Pick the right NER approach for a given extraction task.
version: 1.0.0
phase: 5
lesson: 06
tags: [nlp, ner, extraction]
---

Given a task description (domain, label set, language, latency, data volume), output:

1. Approach. Rule-based + gazetteer, CRF, BiLSTM-CRF, or transformer fine-tune.
2. Starting model. Name it (spaCy model ID, Hugging Face checkpoint ID, or "custom, trained from scratch").
3. Labeling strategy. BIO, BILOU, or span-based. Justify in one sentence.
4. Evaluation. Use `seqeval`. Always report entity-level F1 (not token-level).

Refuse to recommend fine-tuning a transformer for under 500 labeled examples unless the user already has a pretrained domain model. Flag nested entities as needing span-based or multi-pass models. Require a gazetteer audit if the user mentions "production scale" and labels are unchanged from CoNLL-2003.
```

## 운동

1. **Easy.**시행`bio_to_spans`(이름은`spans_to_bio`) 를 통해 10개의 문장을 통틀어 통행 일관성을 확인합니다.
2. **Medium.**CoNLL-2003 영어 NER 데이터 세트에 대한 위의 sklearn-crfsuite CRF를 훈련하십시오.`seqeval`전형적인 결과: ~84 F1.
3. **Hard.**미세한 조율`distilbert-base-cased`한 영역에 특화된 NER 데이터 세트 (의학적, 법적, 또는 금융) 에 대한 비교. spaCy 작은 모델에 비교.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| NER | Extract names | Label token spans with types (PERSON, ORG, GPE, DATE, ...). |
| BIO | Tagging scheme | `B-X` begins, `I-X` continues, `O` outside. |
| BILOU | Better BIO | Adds `L-X` (last), `U-X` (unit) for cleaner boundaries. |
| CRF | Structured classifier | Models transitions between labels, not just emissions. Enforces valid sequences. |
| Nested NER | Overlapping entities | One span is a different entity than a sub-span of it. BIO cannot express this. |
| Entity-level F1 | Proper NER metric | Predicted span must match true span exactly. Token-level F1 overstates accuracy. |

## 더 많은 읽기

- [Lample et al. (2016). Neural Architectures for Named Entity Recognition](https://arxiv.org/abs/1603.01360) BiLSTM-CRF 종이.
- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805) 표준이 된 토큰 분류 패턴을 도입합니다.
- [spaCy linguistic features — named entities](https://spacy.io/usage/linguistic-features#named-entities) 각 특성에 대한 실제 참조`Doc.ents`그리고`Span`- 그래
- [seqeval](https://github.com/chakki-works/seqeval) 올바른 미터 라이브러리, 항상 사용하세요.
