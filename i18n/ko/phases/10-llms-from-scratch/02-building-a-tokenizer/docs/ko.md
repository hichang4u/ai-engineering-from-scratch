# 처음부터 토큰 제작

> 1번 수업은 장난감과 1번 수업은 무기를 주죠

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 10, Lesson 01 (Tokenizers: BPE, WordPiece, SentencePiece)
**Time:** ~90 minutes

## 학습 목표

- 유니코드, 백공간 정상화 및 특수 토큰을 처리하는 생산급 BPE 토큰을 구축하십시오
- 바이트 레벨의 재발을 구현하여 토큰이 알려지지 않은 토큰 없이 모든 입력 (에모지, CJK, 코드 등) 를 암호화할 수 있습니다
- BPE 융합을 적용하기 전에 단어 경계에서 텍스트를 분할하는 사전 토큰화 regex 패턴을 추가
- 커포스에 사용자 지정 토큰라이저를 훈련시키고 다국어 텍스트의 틱토큰에 대한 압축 비율을 평가합니다

## 문제

수업 01에서 BPE 토큰이 영어 텍스트로 작동합니다. 이제 일본어 텍스트를 던져보세요. 또는 에모지. 또는 파이썬 코드와 탭과 공간을 혼합합니다.

니다

BPE가 잘못되었기 때문이 아니라 구현이 불완전하기 때문입니다. 생산 토큰화는 모든 코딩의 원본 바이트를 처리하고, 분할하기 전에 유니코드를 정상화하고, 통합되지 않는 특수 토큰을 관리하고, 서브워드 분할과 함께 사슬 사전 토큰화하고, 그리고 이 모든 것을 충분히 빠르게 수행하여 훈련 파이프라인을 15조 토큰을 처리하지 않습니다.

GPT-2의 토큰은 50,257개의 토큰이 있습니다. 라마 3는 128,256명입니다. GPT-4는 약 100,000개 정도가 있습니다. 장난감 번호가 아닙니다. 이 어휘의 배열 테이블은 수백 가가바이트의 텍스트에 의해 훈련되었습니다. 그리고 주변 기계들 -- 정상화, 사전 토큰화, 특수 토큰 주입, 채팅 템플릿 포맷 --

당신은 그 기계를 만들 것입니다.

## 개념

### 전체 파이프라인

생산 토큰화는 하나의 알고리즘이 아니라 5단계로 이루어진 파이프라인입니다. 각각의 단계들은 다른 문제를 해결합니다.

```mermaid
graph LR
    A[Raw Text] --> B[Normalize]
    B --> C[Pre-Tokenize]
    C --> D[BPE Merge]
    D --> E[Special Tokens]
    E --> F[Token IDs]

    style A fill:#1a1a2e,stroke:#e94560,color:#fff
    style B fill:#1a1a2e,stroke:#e94560,color:#fff
    style C fill:#1a1a2e,stroke:#e94560,color:#fff
    style D fill:#1a1a2e,stroke:#e94560,color:#fff
    style E fill:#1a1a2e,stroke:#e94560,color:#fff
    style F fill:#1a1a2e,stroke:#e94560,color:#fff
```

각 단계에는 특정한 임무가 있습니다.

| Stage | What It Does | Why It Matters |
|-------|-------------|----------------|
| Normalize | NFKC Unicode, lowercase optional, strip accents optional | "fi" ligature (U+FB01) becomes "fi" (two chars). Without this, same word gets different tokens. |
| Pre-Tokenize | Split text into chunks before BPE | Prevents BPE from merging across word boundaries. "the cat" should never produce a token "e c". |
| BPE Merge | Apply learned merge rules to byte sequences | The core compression. Turns raw bytes into subword tokens. |
| Special Tokens | Inject [BOS], [EOS], [PAD], chat template markers | These tokens have fixed IDs. They never participate in BPE merges. The model needs them for structure. |
| ID Mapping | Convert token strings to integer IDs | The model sees integers, not strings. |

### 바이트 레벨 BPE

1학습의 토큰화는 UTF-8 바이트에서 작동했습니다. 그것은 올바른 호출이었습니다. 하지만 우리는 중요한 것을 놓쳤습니다.

바이트 레벨 BPE는 가능한 모든 바이트 값 (0-255) 을 유효한 토큰으로 취급함으로써 문제를 해결합니다. 기본 어휘는 정확히 256 항목입니다. 텍스트, 바이너리, 손상된 모든 파일은 알려지지 않은 토큰을 생성하지 않고 토큰화 될 수 있습니다.

GPT-2는 트릭을 추가했습니다. 각 바이트를 인쇄 가능한 유니코드 문자로 매핑하여 어휘는 인간에게 읽을 수 있도록 유지합니다. 바이트 0x20 (공간) 는 그들의 지도에서 "G" 문자로됩니다. 이것은 순전히 화장품입니다. 알고리즘은 신경 쓰지 않습니다.

실제 힘은: 바이트 레벨 BPE는 지구상의 모든 언어를 처리합니다. 중국 문자는 3 UTF-8 바이트 각각입니다. 일본어는 3-4 바이트일 수 있습니다. 아랍어, 데바나가리, 에모지 - 모두 바이트 순서입니다. BPE 알고리즘은 이러한 바이트 순서에서 패턴을 정확히 같은 방식으로 찾습니다. 영어 ASCII 바이트에서 패턴을 찾습니다.

### 전 토큰화

BPE가 텍스트를 만지기 전에, 당신은 그것을 조각으로 나누어야 합니다. 이것은 융합 알고리즘이 단어 경계를 횡단하는 토큰을 생성하는 것을 방지합니다.

GPT-2는 레전스 패턴을 사용하여 텍스트를 나눌 수 있습니다.

```
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

이 패턴은 단축 (Don't'가 "don" + "'t'가 된다) 로 나뉘어, 선택적 앞면, 숫자, 점점, 백면이 있는 단어입니다. 앞면은 단어에 붙어있어서 "cat"가 ["the", "cat"이 된다), ["the", " ", "cat"이 아니다".

Llama는 SentencePiece를 사용하며 regex를 완전히 건너뛰고, 원본 바이트 스트림을 하나의 긴 순서로 취급하고, BPE 알고리즘이 경계를 파악할 수 있게 한다. 이것은 더 간단하지만 BPE에게 십자 단어 토큰을 만드는 데 더 많은 자유를 제공합니다.

선택은 중요합니다. GPT-2의 regex는 토큰이 하나의 단어의 끝에서 "the"와 다음 단어의 시작에서 "the"가 합쳐야한다는 것을 배우는 것을 방지합니다. SentencePiece는 이를 허용합니다. 이는 때로는 더 효율적인 압축을 생성하지만 덜 해석 가능한 토큰을 생성합니다.

### 특별 표지판

모든 생산 토큰이 구조적 표시기 위해 토큰 ID를 보유합니다.

| Token | Purpose | Used By |
|-------|---------|---------|
| `[BOS]` / `<s>` | Beginning of sequence | Llama 3, GPT |
| `[EOS]` / `</s>` | End of sequence | All models |
| `[PAD]` | Padding for batch alignment | BERT, T5 |
| `[UNK]` | Unknown token (byte-level BPE eliminates this) | BERT, WordPiece |
| `<\|im_start\|>` | Chat message boundary start | ChatGPT, Qwen |
| `<\|im_end\|>` | Chat message boundary end | ChatGPT, Qwen |
| `<\|user\|>` | User turn marker | Llama 3 |
| `<\|assistant\|>` | Assistant turn marker | Llama 3 |

특수 토큰은 결코 BPE에 의해 분할되지 않습니다. 그들은 합병 알고리즘이 실행되기 전에 정확히 일치하고, 고정된 ID로 대체되며, 주변 텍스트는 정상적으로 토큰화됩니다.

### 채팅 템플릿

대부분의 사람들이 혼란스럽고 대부분의 구현이 깨지는 곳입니다.

채팅 모델에 메시지를 전송할 때 API는 메시지 목록을 받아들이습니다.

```
[
  {"role": "system", "content": "You are helpful."},
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi there!"}
]
```

모델은 JSON를 볼 수 없습니다. 그것은 평평한 토큰 순서를 볼 수 있습니다. 채팅 템플릿은 특별한 토큰을 사용하여 메시지를 그 평평한 순서에 변환합니다. 각 모델은 다르게합니다.

```
Llama 3:
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are helpful.<|eot_id|><|start_header_id|>user<|end_header_id|>

Hello<|eot_id|><|start_header_id|>assistant<|end_header_id|>

Hi there!<|eot_id|>

ChatGPT:
<|im_start|>system
You are helpful.<|im_end|>
<|im_start|>user
Hello<|im_end|>
<|im_start|>assistant
Hi there!<|im_end|>
```

템플릿을 잘못 만들면 모델은 쓰레기를 생산합니다. 그것은 정확히 한 형식으로 훈련되었습니다. 모든 deviation - 결실된 newline, 교환된 토큰, 추가 공간 - 입력된 것을 훈련 배포 밖으로 배치합니다.

### 속도

파이썬은 생산 토큰화를 위해 너무 느려집니다.

tiktoken (OpenAI) 는 파이썬 결합을 가진 Rust으로 작성됩니다. HuggingFace 토큰화도 Rust입니다. SentencePiece는 C++. 이들은 순수한 파이썬보다 10-100x 가량의 속도를 달성합니다.

시각적으로: Llama 3의 15조 토큰을 초당 1백만 토큰으로 (Fast Python) 미리 훈련시키는 데 174일이 걸리겠지만 초당 100백만 토큰 (Rust) 에 1.7일이 걸린다.

당신은 알고리즘을 이해하기 위해 파이썬으로 구축하고 있습니다. 생산에서, 당신은 컴파일된 구현을 사용하여 파이썬 팩을 만져

```figure
weight-tying
```

## 건설 해

### 단계 1: 바이트 레벨 코딩

기본: 어떤 문자열을 바이트의 순서로 변환하고, 각 바이트를 표시하기 위해 인쇄 가능한 문자로 매핑하고, 프로세스를 역전합니다.

```python
def bytes_to_tokens(text):
    return list(text.encode("utf-8"))

def tokens_to_text(token_bytes):
    return bytes(token_bytes).decode("utf-8", errors="replace")
```

다국어 텍스트에 대한 테스트에서 바이트의 수를 확인합니다.

```python
texts = [
    ("English", "hello"),
    ("Chinese", "你好"),
    ("Emoji", "🔥"),
    ("Mixed", "hello你好🔥"),
]

for label, text in texts:
    b = bytes_to_tokens(text)
    print(f"{label}: {len(text)} chars -> {len(b)} bytes -> {b}")
```

"hello"는 5 바이트. "你好"는 6 바이트 (자리당 3 개). "fire emoji"는 4 바이트. 바이트 레벨 토큰화는 어떤 언어인지 상관하지 않습니다. 바이트는 바이트입니다.

### 단계 2: 레지렉스로 사전 토케니제

GPT-2 레전스 패턴을 사용하여 텍스트를 조각으로 나눕니다. 각 조각은 BPE에 의해 독립적으로 표기됩니다.

```python
import re

try:
    import regex
    GPT2_PATTERN = regex.compile(
        r"""'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+"""
    )
except ImportError:
    GPT2_PATTERN = re.compile(
        r"""'(?:[sdmt]|ll|ve|re)| ?[a-zA-Z]+| ?[0-9]+| ?[^\s\w]+|\s+(?!\S)|\s+"""
    )

def pre_tokenize(text):
    return [match.group() for match in GPT2_PATTERN.finditer(text)]
```

`regex`모듈은 유니코드 속성 탈출을 지원합니다 (`\p{L}`편지용으로`\p{N}`숫자를 위한 표준 도서관`re`모듈이 그렇지 않으므로 ASCII 문자 클래스로 돌아가게 됩니다. 생산 다국어 토큰화를 위해, 설치 `regex`- 그래

시도해 보세요.

```python
print(pre_tokenize("Hello, world! Don't stop."))
# [' Hello', ',', ' world', '!', " Don", "'t", ' stop', '.']
```

앞부분은 단어에 붙어있으며, 마약은 aposostrophe에서 분해된다. 점수성은 자신의 조각이 된다. BPE는 이러한 경계를 넘어서 결코 토큰을 합쳐놓지 않는다.

### 단계 3: 바이트 순서에서 BPE

코어 알고리즘은 레슨 01, 하지만 이제 미리 토큰화된 덩어리에서 독립적으로 작동합니다.

```python
from collections import Counter

def get_byte_pairs(chunks):
    pairs = Counter()
    for chunk in chunks:
        byte_seq = list(chunk.encode("utf-8"))
        for i in range(len(byte_seq) - 1):
            pairs[(byte_seq[i], byte_seq[i + 1])] += 1
    return pairs

def apply_merge(byte_seq, pair, new_id):
    merged = []
    i = 0
    while i < len(byte_seq):
        if i < len(byte_seq) - 1 and byte_seq[i] == pair[0] and byte_seq[i + 1] == pair[1]:
            merged.append(new_id)
            i += 2
        else:
            merged.append(byte_seq[i])
            i += 1
    return merged
```

### 4단계: 특별 표지판 처리

특별한 토큰은 정확한 일치와 고정된 아이디가 필요합니다. 그들은 BPE를 완전히 회피합니다.

```python
class SpecialTokenHandler:
    def __init__(self):
        self.special_tokens = {}
        self.pattern = None

    def add_token(self, token_str, token_id):
        self.special_tokens[token_str] = token_id
        escaped = [re.escape(t) for t in sorted(self.special_tokens.keys(), key=len, reverse=True)]
        self.pattern = re.compile("|".join(escaped))

    def split_with_specials(self, text):
        if not self.pattern:
            return [(text, False)]
        parts = []
        last_end = 0
        for match in self.pattern.finditer(text):
            if match.start() > last_end:
                parts.append((text[last_end:match.start()], False))
            parts.append((match.group(), True))
            last_end = match.end()
        if last_end < len(text):
            parts.append((text[last_end:], False))
        return parts
```

### 단계 5: 전체 토큰화 클래스

모든 것을 묶어: 정상화, 특별 토큰으로 나뉘어, 사전 토큰화, BPE 통합, 지도로 ID로

```python
import unicodedata

class ProductionTokenizer:
    def __init__(self):
        self.merges = {}
        self.vocab = {i: bytes([i]) for i in range(256)}
        self.special_handler = SpecialTokenHandler()
        self.next_id = 256

    def normalize(self, text):
        return unicodedata.normalize("NFKC", text)

    def train(self, text, num_merges):
        text = self.normalize(text)
        chunks = pre_tokenize(text)
        chunk_bytes = [list(chunk.encode("utf-8")) for chunk in chunks]

        for i in range(num_merges):
            pairs = Counter()
            for seq in chunk_bytes:
                for j in range(len(seq) - 1):
                    pairs[(seq[j], seq[j + 1])] += 1
            if not pairs:
                break
            best = max(pairs, key=pairs.get)
            new_id = self.next_id
            self.next_id += 1
            self.merges[best] = new_id
            self.vocab[new_id] = self.vocab[best[0]] + self.vocab[best[1]]
            chunk_bytes = [apply_merge(seq, best, new_id) for seq in chunk_bytes]

    def add_special_token(self, token_str):
        token_id = self.next_id
        self.next_id += 1
        self.special_handler.add_token(token_str, token_id)
        self.vocab[token_id] = token_str.encode("utf-8")
        return token_id

    def encode(self, text):
        text = self.normalize(text)
        parts = self.special_handler.split_with_specials(text)
        all_ids = []
        for part_text, is_special in parts:
            if is_special:
                all_ids.append(self.special_handler.special_tokens[part_text])
            else:
                for chunk in pre_tokenize(part_text):
                    byte_seq = list(chunk.encode("utf-8"))
                    for pair, new_id in self.merges.items():
                        byte_seq = apply_merge(byte_seq, pair, new_id)
                    all_ids.extend(byte_seq)
        return all_ids

    def decode(self, ids):
        byte_parts = []
        for token_id in ids:
            if token_id in self.vocab:
                byte_parts.append(self.vocab[token_id])
        return b"".join(byte_parts).decode("utf-8", errors="replace")

    def vocab_size(self):
        return len(self.vocab)
```

### 6단계: 다국어 시험

진짜 테스트는 영어, 중국어, 에모지, 코드 등이

```python
corpus = (
    "The quick brown fox jumps over the lazy dog. "
    "The quick brown fox runs through the forest. "
    "Machine learning models process natural language. "
    "Deep learning transforms how we build software. "
    "def train(model, data): return model.fit(data) "
    "def predict(model, x): return model(x) "
)

tok = ProductionTokenizer()
tok.train(corpus, num_merges=50)

bos = tok.add_special_token("<|begin|>")
eos = tok.add_special_token("<|end|>")

test_texts = [
    "The quick brown fox.",
    "你好世界",
    "Hello 🌍 World",
    "def foo(x): return x + 1",
    f"<|begin|>Hello<|end|>",
]

for text in test_texts:
    ids = tok.encode(text)
    decoded = tok.decode(ids)
    print(f"Input:   {text}")
    print(f"Tokens:  {len(ids)} ids")
    print(f"Decoded: {decoded}")
    print()
```

중국 문자는 각각 3 바이트를 생성합니다. 이모지는 4 바이트를 생성합니다. 이 중 어느 것도 토큰을 충돌하지 않습니다. 아무도 알려지지 않은 토큰을 생성하지 않습니다. 이것은 바이트 레벨 BPE의 힘입니다.

## 사용 하 고

### 실제 토큰 제작자들에 대한 비교

Llama 3, GPT-4 및 Mistral의 실제 토큰을 로드하고, 각 개개방이 동일한 다국어 문장을 어떻게 처리하는지 보세요.

```python
import tiktoken

gpt4_enc = tiktoken.get_encoding("cl100k_base")

test_paragraph = "Machine learning is powerful. 机器学习很强大。 L'apprentissage automatique est puissant. 🤖💪"

tokens = gpt4_enc.encode(test_paragraph)
pieces = [gpt4_enc.decode([t]) for t in tokens]
print(f"GPT-4 ({len(tokens)} tokens): {pieces}")
```

```python
from transformers import AutoTokenizer

llama_tok = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3-8B")
mistral_tok = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.1")

for name, tok in [("Llama 3", llama_tok), ("Mistral", mistral_tok)]:
    tokens = tok.encode(test_paragraph)
    pieces = tok.convert_ids_to_tokens(tokens)
    print(f"{name} ({len(tokens)} tokens): {pieces[:20]}...")
```

같은 텍스트에 대한 다른 토큰 수를 볼 수 있습니다. 128K 어휘를 가진 Llama 3는 일반적인 패턴을 합치는데 더 공격적입니다. 100K의 GPT-4는 중간에 위치하고 있습니다. 32K의 미스트랄은 더 많은 토큰을 생성하지만 더 작은 임베딩 레이어를 가지고 있습니다.

타협은 항상 동일합니다. 더 큰 어휘는 더 짧은 순서들을 의미하지만 더 많은 매개 변수를 의미합니다.

## 선박

이 수업은 생산 토큰을 구축하고 디버깅하는 데 필요한 시사기를 생성합니다.`outputs/prompt-tokenizer-builder.md`- 그래

## 운동

1. **Easy:**`get_token_bytes(id)`토큰 ID의 원본 바이트를 표시하는 방법.
2. **Medium:**백공간과 숫자에 분할되는 라마 스타일의 사전 토케니저를 구현하지만 앞장서지는 공간을 유지하십시오. 같은 코퍼스에서 GPT-2 레전스 접근과 단어자료를 비교하십시오.
3. **Hard:**  목록을 포함하는 채팅 템플릿 방법을 추가합니다`{"role": ..., "content": ...}`Llama 3 채팅 형식의 올바른 토큰 순서를 생성합니다. HuggingFace 구현에 대한 테스트를 수행합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Byte-level BPE | "Tokenizer that works on bytes" | BPE with a base vocabulary of 256 byte values -- handles any input without unknown tokens |
| Pre-tokenization | "Splitting before BPE" | Regex or rule-based splitting that prevents BPE from merging across word boundaries |
| NFKC normalization | "Unicode cleanup" | Canonical decomposition followed by compatibility composition -- "fi" ligature becomes "fi", fullwidth "A" becomes "A" |
| Chat template | "How messages become tokens" | The exact format for converting a list of role/content messages into a flat token sequence -- model-specific and must match training format |
| Special tokens | "Control tokens" | Reserved token IDs that bypass BPE -- [BOS], [EOS], [PAD], chat markers -- matched exactly before merge |
| Fertility | "Tokens per word" | Ratio of output tokens to input words -- 1.3 for English in GPT-4, 2-3 for Korean, higher means wasted context |
| tiktoken | "OpenAI tokenizer" | Rust BPE implementation with Python bindings -- 10-100x faster than pure Python |
| Merge table | "The vocabulary" | Ordered list of byte-pair merges learned during training -- this IS the tokenizer's learned knowledge |

## 더 많은 읽기

- [OpenAI tiktoken source](https://github.com/openai/tiktoken)-- GPT-3.5/4에서 사용되는  BPE 구현
- [HuggingFace tokenizers](https://github.com/huggingface/tokenizers)-- BPE, WordPiece, Unigram를 지원하는 Rust Tokenizer 라이브러리
- [Llama 3 paper (Meta, 2024)](https://arxiv.org/abs/2407.21783)-- 128K 어휘 및 토큰화 훈련에 대한 세부 사항
- [SentencePiece (Kudo & Richardson, 2018)](https://arxiv.org/abs/1808.06226)-- 언어-지식적 표기
- [GPT-2 tokenizer source](https://github.com/openai/gpt-2/blob/master/src/encoder.py)-- 원래의 바이트에서 유니코드 매핑
