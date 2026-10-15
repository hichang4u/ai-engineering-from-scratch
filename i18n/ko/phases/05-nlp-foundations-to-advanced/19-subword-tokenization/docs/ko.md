# 서브워드 토큰화  BPE, 워드피스, 유니그램, 문장피스

> 단어 토큰화는 보이지 않는 단어에 질식합니다. 문자 토큰들은 순서 길이를 팽창시킵니다. 하위 단어 토큰들은 차이를 분할합니다. 모든 현대 LLM는 하나에 배포됩니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 5 · 04 (GloVe / FastText / Subword)
**Time:** ~60 minutes

## 문제

여러분의 어휘는 50,000개의 단어로 되어 있습니다. 사용자가 "토케니제이션 불가능"이라고 입력합니다.`[UNK]`더 나쁜 것은, 여러분의 90퍼센트의 문서에는 40개의 희귀한 단어들이 있습니다. 즉, 문서마다 40개의 정보가 떨어지는 것을 의미합니다.

자사 단어 표기화로 해결됩니다. 일반적인 단어들은 단일 표기물로 남아 있습니다. 희귀 단어들은 의미있는 조각으로 분해됩니다.`untokenizable`→`un``token``izable`훈련 데이터는 모든 것을 포함합니다. 왜냐하면 어떤 문자열도 결국 바이트의 순서이기 때문입니다.

2026년 모든 국경 LLM는 3개의 알고리즘 중 하나 (BPE, Unigram, WordPiece) 를 통해 3개의 라이브러리 중 하나 (tiktoken, SentencePiece, HF Tokenizers) 에 포장됩니다.

## 개념

![BPE vs Unigram vs WordPiece, character-by-character](../assets/subword-tokenization.svg)

**BPE (Byte-Pair Encoding).**문자 수준의 어휘를 시작하여, 각 인접한 쌍을 셀 수 있습니다. 가장 빈번한 쌍을 새로운 토큰으로 통합합니다. 목표 어휘 크기를 달성하기까지 반복합니다. 지배적 알고리즘: GPT-2/3/4, Llama, Gemma, Qwen2, Mistral.

**Byte-level BPE.**동일한 알고리즘이지만 유니코드 문자 대신 원형 바이트 (256 베이스 토큰) 를 사용한다.`[UNK]`토큰  모든 바이트 순서 코딩. GPT-2는 50,257 토큰 (256 바이트 + 50,000 융합 + 1 특수) 을 사용합니다.

**Unigram.**거대한 어휘를 시작하십시오. 각 토큰에 unigram 확률을 부여하십시오. 제거가 코퍼스 로그 확률을 최소로 증가시키는 토큰을 반복적으로 절단하십시오. 추론에서 확률: 표본 토큰화를 (잠자 단어 정규화를 통해 데이터 증강에 유용합니다). T5, mBART, ALBERT, XLNet, Gemma에서 사용됩니다.

**WordPiece.**무선 주파수보다는 훈련의 가능성을 극대화하는 융합쌍.

**SentencePiece vs tiktoken.**SentencePiece는 원본 유니코드 텍스트에 직접 어휘 (BPE 또는 Unigram) 를 훈련시키는 라이브러리이며, 백공간을 `▁`. tiktoken은 OpenAI의 사전 구축된 어휘에 대한 빠른 *코더입니다.

엄지손가락 규칙:

- **Training a new vocabulary:**SentencePiece (다국어, 사전 토큰화 없음) 또는 HF 토큰화
- **Fast inference against GPT vocab:**tiktoken (cl100k_base, o200k_base)
- **Both:**HF 토케니저스  하나의 도서관, 훈련 + 서비스

```figure
bpe-merge
```

## 건설 해

### 단계 1: 처음부터 BPE

보시다시피`code/main.py`- 루프:

```python
def train_bpe(corpus, num_merges):
    vocab = {tuple(word) + ("</w>",): count for word, count in corpus.items()}
    merges = []
    for _ in range(num_merges):
        pairs = Counter()
        for symbols, freq in vocab.items():
            for a, b in zip(symbols, symbols[1:]):
                pairs[(a, b)] += freq
        if not pairs:
            break
        best = pairs.most_common(1)[0][0]
        merges.append(best)
        vocab = apply_merge(vocab, best)
    return merges
```

알고리즘이 암호화하는 세 가지 사실입니다.`</w>`단어 끝을 표시하여 "하" (자유) 과 "하" (자유) 은 구별되지 않습니다. 주파수 중량으로 인해 높은 주파수 쌍이 일찍 승리합니다. 융합 목록은 순서대로  추론은 훈련 순서로 융합을 적용합니다.

### 단계 2: 학습된 합병을 코딩

```python
def encode_bpe(word, merges):
    symbols = list(word) + ["</w>"]
    for a, b in merges:
        i = 0
        while i < len(symbols) - 1:
            if symbols[i] == a and symbols[i + 1] == b:
                symbols = symbols[:i] + [a + b] + symbols[i + 2:]
            else:
                i += 1
    return symbols
```

순진한 사람$O(n \cdot \lvert \text{merges} \rvert)$. 생산 구현 (tiktoken, HF Tokenizers) 은 우선 순위 줄을 따라 융합 순위 검색을 이용하고 거의 선형 시간으로 실행된다.

### 3단계: 문장

```python
import sentencepiece as spm

spm.SentencePieceTrainer.train(
    input="corpus.txt",
    model_prefix="my_tokenizer",
    vocab_size=8000,
    model_type="bpe",          # or "unigram"
    character_coverage=0.9995, # lower for CJK (e.g. 0.9995 for English, 0.995 for Japanese)
    normalization_rule_name="nmt_nfkc",
)

sp = spm.SentencePieceProcessor(model_file="my_tokenizer.model")
print(sp.encode("untokenizable", out_type=str))
# ['▁un', 'token', 'izable']
```

참고: 사전 토큰화가 필요하지 않습니다.`▁``character_coverage`공격적으로 희귀한 문자들이 보존되고 지도가 되어 있는 것을 제어합니다.`<unk>`- 그래

### 단계 4: OpenAI 호환성 단어가 있는 틱토큰

```python
import tiktoken
enc = tiktoken.get_encoding("o200k_base")
print(enc.encode("untokenizable"))        # [127340, 101028]
print(len(enc.encode("Hello, world!")))   # 4
```

코딩만, 빠른 (Rust backend) 바이트 카운팅, 비용 추정, 컨텍스트 윈도우 예산화용 GPT-4/5 토큰화와 정확히 일치합니다.

## 2026 년에도 여전히 선박되는 함정이

- **Tokenizer drift.**A 음반에 대한 훈련, B 음반에 대한 배포. 토큰 ID는 다릅니다. 모델 출력 쓰레기. 확인 `tokenizer.json`CI에 해시스
- **Whitespace ambiguity.**BPE "hello"와 "hello"는 서로 다른 토큰을 생성합니다. 항상 지정합니다.`add_special_tokens`그리고`add_prefix_space`분명히
- **Multilingual undertraining.**영어중력한 코로파는 라틴어 아닌 글자를 5-10배 더 많은 토큰으로 나눈 어휘를 생산합니다. 같은 프롬프트는 GPT-3.5에서 일본어/아랍어에서 5-10배 더 많은 비용이 발생합니다. o200k_base는 부분적으로 이것을 수정했습니다.
- **Emoji splits.**하나의 에모지에는 5개의 토큰이 있을 수 있습니다.

## 사용 하 고

2026년 스택:

| Situation | Pick |
|-----------|------|
| Training a monolingual model from scratch | HF Tokenizers (BPE) |
| Training a multilingual model | SentencePiece (Unigram, `character_coverage=0.9995`) |
| Serving an OpenAI-compatible API | tiktoken (`o200k_base` for GPT-4+) |
| Domain-specific vocab (code, math, protein) | Train custom BPE on domain corpus, merge with base vocab |
| Edge inference, small model | Unigram (smaller vocabularies work better) |

어휘의 크기는 확장 결정이 아니라 일정이다. 대략적인 유리스틱: <1B 파라미드에서 32k, 1-10B에서 50-100k, 다국어/대국어에서 200k+

## 선박

`outputs/skill-bpe-vs-wordpiece.md`이 부분의 본문은

```markdown
---
name: tokenizer-picker
description: Pick tokenizer algorithm, vocab size, library for a given corpus and deployment target.
version: 1.0.0
phase: 5
lesson: 19
tags: [nlp, tokenization]
---

Given a corpus (size, languages, domain) and deployment target (training from scratch / fine-tuning / API-compatible inference), output:

1. Algorithm. BPE, Unigram, or WordPiece. One-sentence reason.
2. Library. SentencePiece, HF Tokenizers, or tiktoken. Reason.
3. Vocab size. Rounded to nearest 1k. Reason tied to model size and language coverage.
4. Coverage settings. `character_coverage`, `byte_fallback`, special-token list.
5. Validation plan. Average tokens-per-word on held-out set, OOV rate, compression ratio, round-trip decode equality.

Refuse to train a character-coverage <0.995 tokenizer on corpora with rare-script content. Refuse to ship a vocab without a frozen `tokenizer.json` hash check in CI. Flag any monolingual tokenizer under 16k vocab as likely under-spec.
```

## 운동

1. **Easy.**500개의 융합 BPE를 `code/main.py`작은 코퍼스입니다. 3개의 긴 단어들을 암호화합니다. 정확히 1개의 토큰과 1개의 토큰을 생성한 숫자는 몇개일까요?
2. **Medium.**영어 위키백과 문장 100개에서 토큰 수를 비교합니다.`cl100k_base``o200k_base`, 그리고 문장과 함께 훈련하는 SentencePiece BPE는 32k입니다. 각의 압축 비율을 보고하세요.
3. **Hard.**BPE, Unigram, WordPiece 를 사용하여 동일한 코퍼스를 훈련 하십시오. 작은 감정 분류기 를 사용 할 때 각각을 하류 정확성 을 측정 하십시오. 선택 은 바늘 을 1 포인트 F1 이상 움직여 있습니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BPE | Byte-Pair Encoding | Greedy merge of most-frequent character pairs until target vocab size hit. |
| Byte-level BPE | No unknown tokens ever | BPE over raw 256 bytes; GPT-2 / Llama use this. |
| Unigram | Probabilistic tokenizer | Prunes from a large candidate set using log-likelihood; used by T5, Gemma. |
| SentencePiece | The whitespace one | Library that trains BPE/Unigram on raw text; space encoded as `▁`. |
| tiktoken | The fast one | OpenAI's Rust-backed BPE encoder for pre-built vocabs. No training. |
| Merge list | The magic numbers | Ordered list of `(a, b) → ab` merges; inference applies in order. |
| Character coverage | How rare is too rare? | Fraction of characters in training corpus the tokenizer must cover; ~0.9995 typical. |

## 더 많은 읽기

- [Sennrich, Haddow, Birch (2015). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909)BPE 종이
- [Kudo (2018). Subword Regularization with Unigram Language Model](https://arxiv.org/abs/1804.10959) 유니그램 논문
- [Kudo, Richardson (2018). SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226)도서관
- [Hugging Face — Summary of the tokenizers](https://huggingface.co/docs/transformers/tokenizer_summary) 간결한 참조
- [OpenAI tiktoken repo](https://github.com/openai/tiktoken) 요리책 + 코딩 목록
