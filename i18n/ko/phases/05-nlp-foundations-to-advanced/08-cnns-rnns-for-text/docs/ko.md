# 문자용 CNN 및 RNN

> 돌은 n-그램을 배우며 반복은 기억합니다. 둘 다 주의가 대체됩니다. 둘 다 여전히 제한된 하드웨어에서 중요합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 11 (PyTorch Intro), Phase 5 · 03 (Word Embeddings), Phase 4 · 02 (Convolutions from Scratch)
**Time:** ~75 minutes

## 문제

TF-IDF와 Word2Vec은 단어 순서를 무시하는 평면 벡터를 생성했습니다.`dog bites man``man bites dog`단어 순서가 신호를 전달하는 경우가 있습니다.

이 격차를 채웠던 건축물 두 가문이 트랜스포머가 도착하기 전에

**Convolutional nets for text (TextCNN).**단어 임베디션의 순서 위에 1D 회전들을 적용한다. 너비 3의 필터는 학습 가능한 트리그램 탐지기가 된다. 그것은 세 단어에 걸쳐 점수를 내포한다. 다중 스케일 패턴을 감지하기 위해 다른 너비 (2, 3, 4, 5) 를 쌓아 올린다. 고정 크기의 표현에 최대 풀. 평평, 병렬, 빠른.

**Recurrent nets (RNN, LSTM, GRU).**프로세스 토큰은 한 번에 하나씩 처리하여 정보를 전달하는 숨겨진 상태를 유지합니다. 순서적, 메모리 소지, 유연한 입력 길이는. 2014년부터 2017년까지 주류 순서 모델링이 진행되었습니다.

이 교훈은 둘 다 구축하고, 그 다음에는 관심을 동원한 실패를 명명합니다.

## 개념

**TextCNN**(김, 2014년) 토큰이 삽입됩니다.`k`1D 은 필터를 연속으로 슬라이드합니다 `k`-그램의 임베디션, 특징 지도를 생성. 그 지도를 통해 글로벌 최대 pooling 가장 강력한 활성화를 선택. 여러 필터 너비에서 최대 pooled 출력을 연결. 분류자 헤드로 공급.

왜 작동하는지. 필터는 학습 가능한 n-그램입니다. 최대 펄링은 위치 변동이므로 리뷰 시작 또는 중간에서 "좋은 것은 아닙니다" 같은 기능을 발사합니다. 각 100 개의 필터로 된 세 개의 필터 너비는 300 개의 학습된 n-그램 탐지기를 제공합니다. 훈련은 병렬입니다. 순차적인 의존도 없습니다.

**RNN.**모든 걸음마다`t`, 숨겨진 상태`h_t = f(W * x_t + U * h_{t-1} + b)`공유`W``U``b`시간으로, 시간으로 숨겨진 상태`T`전체 사전의 요약입니다. 분류를 위해,   `h_1 ... h_T`(최고, 평균 또는 마지막)

순수한 RNNs는 사라지는 gradients를 겪습니다.**LSTM**                                                                                                                                                                                                                                                              **GRU**LSTM를 두 게이트로 단순화하고, 더 적은 매개 변수와 비슷한 성능을 발휘한다.

**Bidirectional RNNs**RNN를 앞뒤로, 다른 것을 뒤로로 실행하여 숨겨진 상태를 연결합니다. 모든 토큰의 표현은 왼쪽과 오른쪽 맥락을 모두 볼 수 있습니다. 태그 작업에 필수적입니다.

```figure
rnn-unroll
```

## 건설 해

### 단계 1: 파이토르치에서 텍스트CNN

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class TextCNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, n_classes, filter_widths=(2, 3, 4), n_filters=64, dropout=0.3):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.convs = nn.ModuleList([
            nn.Conv1d(embed_dim, n_filters, kernel_size=k)
            for k in filter_widths
        ])
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(n_filters * len(filter_widths), n_classes)

    def forward(self, token_ids):
        x = self.embed(token_ids).transpose(1, 2)
        pooled = []
        for conv in self.convs:
            c = F.relu(conv(x))
            p = F.max_pool1d(c, c.size(2)).squeeze(2)
            pooled.append(p)
        h = torch.cat(pooled, dim=1)
        return self.fc(self.dropout(h))
```

`transpose(1, 2)`재구성`[batch, seq_len, embed_dim]` `[batch, embed_dim, seq_len]`왜냐하면`nn.Conv1d`중축축을 채널로 취급합니다. 합동 출력은 입력 길이가 무엇이든 고정된 크기로 됩니다.

### 단계 2: LSTM 분류기

```python
class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_classes, bidirectional=True, dropout=0.3):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=bidirectional)
        factor = 2 if bidirectional else 1
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim * factor, n_classes)

    def forward(self, token_ids):
        x = self.embed(token_ids)
        out, _ = self.lstm(x)
        pooled = out.max(dim=1).values
        return self.fc(self.dropout(pooled))
```

분류에 있어서, 최대 집합은 보통 마지막 숨겨진 상태를 가져가는 것을 능가한다. 왜냐하면 긴 일련의 끝에서 정보가 마지막 상태를 지배하는 경향이 있기 때문입니다.

### 단계 3: 사라지는 기하급수 디모 (인투이션)

게팅 없이 간단한 RNN는 장거리 의존성을 배울 수 없습니다. 장난감 작업을 고려해보세요.`A`그 다음의 몇 가지 예로`A`1 위치에서 1이고 순서는 100 토큰의 길이를 가지고 있습니다. 손실의 기하량은 반복 중의 99 곱으로 다시 흐르게 됩니다. 무게가 1보다 작으면 기하성은 사라집니다. 1보다 많으면 폭발합니다.

```python
def vanishing_gradient_sim(seq_len, recurrent_weight=0.9):
    import math
    return math.pow(recurrent_weight, seq_len)


# At weight=0.9 over 100 steps:
#   0.9 ^ 100 ≈ 2.7e-5
# The gradient from step 100 to step 1 is effectively zero.
```

LSTM는 이것을 **cell state**그루는 단지 추가적인 상호작용으로 네트워크를 통과합니다 (잊기 게이트는 그것을 곱하기적으로 확장하지만 그라디언트는 여전히 "고속도로"를 따라 흐른다).

### 4단계: 왜 아직 충분하지 않은가

LSTM에도 3가지 문제가 계속되었다.

1. **Sequential bottleneck.**길이가 1000의 연속에서 RNN를 훈련시키는 것은 1000개의 일련의 앞/뒤 단계를 필요로 합니다. 시간 간 평행이 불가능합니다.
2. **Fixed-size context vector in encoder-decoder setups.**디코더는 엔코더의 마지막 숨겨진 상태를 만 볼 수 있습니다. 전체 입력에 압축되어 있습니다. 긴 입력은 세부 사항을 잃습니다. 09 교훈은 이것을 직접적으로 다루고 있습니다.
3. **Distant-dependency accuracy ceiling.**LSTM는 일반 RNNs보다 더 좋은 성능을 발휘하지만 여전히 200+ 단계에 걸쳐 특정 정보를 전파하는데 어려움을 겪고 있습니다.

주의가 세 가지를 모두 해결했습니다. 트랜스포머는 반복을 완전히 떨어뜨렸습니다. 10번째 교훈은 중추입니다.

## 사용 하 고

피토르치의`nn.LSTM``nn.GRU`그리고`nn.Conv1d`생산 준비되어 있습니다. 훈련 코드는 표준입니다.

포옹 얼굴 선박은 미리 훈련된 임베디드 당신은 입력 계층으로 연결:

```python
from transformers import AutoModel

encoder = AutoModel.from_pretrained("bert-base-uncased")
for param in encoder.parameters():
    param.requires_grad = False


class BertCNN(nn.Module):
    def __init__(self, n_classes, filter_widths=(2, 3, 4), n_filters=64):
        super().__init__()
        self.encoder = encoder
        self.convs = nn.ModuleList([nn.Conv1d(768, n_filters, kernel_size=k) for k in filter_widths])
        self.fc = nn.Linear(n_filters * len(filter_widths), n_classes)

    def forward(self, input_ids, attention_mask):
        with torch.no_grad():
            out = self.encoder(input_ids=input_ids, attention_mask=attention_mask).last_hidden_state
        x = out.transpose(1, 2)
        pooled = [F.max_pool1d(F.relu(conv(x)), kernel_size=conv(x).size(2)).squeeze(2) for conv in self.convs]
        return self.fc(torch.cat(pooled, dim=1))
```

제한된 사용 시 적용 체크리스트

- **Edge / on-device inference.**글로베 임베디션이 있는 텍스트CNN는 트랜스포머보다 10-100배 작습니다.
- **Streaming / online classification.**RNN는 한 번에 하나의 토큰을 처리하고, 트랜스포머는 전체 순서를 필요로 한다. 실시간 입력 텍스트에 대해서는 LSTM는 여전히 승리한다.
- **Tiny models for baselines.**새로운 작업에 빠른 반복. 5분 안에 CPU에 텍스트CNN를 훈련시켜
- **Sequence labeling with limited data.**BiLSTM-CRF (강좌 06) 은 여전히 1k-10k 라벨 문장을 위한 생산급 NER 아키텍처입니다.

나머지는 변조기로 처리됩니다.

## 선박

`outputs/prompt-text-encoder-picker.md`이 부분의 본문은

```markdown
---
name: text-encoder-picker
description: Pick a text encoder architecture for a given constraint set.
phase: 5
lesson: 08
---

Given constraints (task, data volume, latency budget, deploy target, compute budget), output:

1. Encoder architecture: TextCNN, BiLSTM, BiLSTM-CRF, transformer fine-tune, or "use a pretrained transformer as a frozen encoder + small head".
2. Embedding input: random init, GloVe / fastText frozen, or contextualized transformer embeddings.
3. Training recipe in 5 lines: optimizer, learning rate, batch size, epochs, regularization.
4. One monitoring signal. For RNN/CNN models: attention mechanism absence means they miss long-range deps; check per-length accuracy. For transformers: fine-tuning collapse if LR too high; check train loss.

Refuse to recommend fine-tuning a transformer when data is under ~500 labeled examples without showing that a TextCNN / BiLSTM baseline has plateaued. Flag edge deployment as needing architecture-before-everything.
```

## 운동

1. **Easy.**3급 장난감 데이터 세트에 대한 TextCNN를 훈련하십시오 (데이터를 발명합니다). 필터 너비 (2, 3, 4) 는 평균 F1에서 단일 너비 (3) 를 능가하는지 확인합니다.
2. **Medium.**LSTM 분류기 위해 최대 풀, 평균 풀, 마지막 상태 펀딩을 구현하십시오. 작은 데이터 세트에 비교하여 펀딩이 승리하는 문서를 작성하고 이유를 가설하십시오.
3. **Hard.**BiLSTM-CRF NER 태거를 구축하세요 (강좌 06 과 이 강좌를 결합하세요). CoNLL-2003에서 훈련하세요. 강좌 06에서 CRF-일본 라인과 BERT 정렬을 비교하세요. 훈련 시간, 메모리, F1을 보고하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| TextCNN | CNN for text | Stack of 1D convolutions over word embeddings with global max-pool. Kim (2014). |
| RNN | Recurrent net | Hidden state updated at each time step: `h_t = f(W x_t + U h_{t-1})`. |
| LSTM | Gated RNN | Adds input / forget / output gates + a cell state. Trains stably through long sequences. |
| GRU | Simpler LSTM | Two gates instead of three. Similar accuracy, fewer parameters. |
| Bidirectional | Both directions | Forward + backward RNN concatenated. Every token sees both sides of its context. |
| Vanishing gradient | Training signal dies | Repeated multiplication by <1 weights in plain RNNs makes early-step gradients effectively zero. |

## 더 많은 읽기

- [Kim, Y. (2014). Convolutional Neural Networks for Sentence Classification](https://arxiv.org/abs/1408.5882) 텍스트CNN 신문 8페이지, 읽을 수 있습니다
- [Hochreiter, S. and Schmidhuber, J. (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) LSTM 논문, 예상치 못한 명료함
- [Olah, C. (2015). Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) LSTM를 모든 사람에게 접근할 수 있게 해주는 다이어그램
