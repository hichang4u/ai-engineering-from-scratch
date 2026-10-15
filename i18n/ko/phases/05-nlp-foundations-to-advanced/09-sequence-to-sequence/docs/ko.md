# 순서대로 모형

> RNN가 번역가로 변신한 두 명, 그들이 부딪힌 병목은 관심의 원인이죠.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 08 (CNNs + RNNs for Text), Phase 3 · 11 (PyTorch Intro)
**Time:** ~75 minutes

## 문제

분류는 하나의 레이블에 변수 길이의 순서를 지도합니다. 번역은 다른 변수 길이의 순서를 지도합니다. 입력과 출력은 길이가 동등하다는 보장 없이 다른 어휘, 아마도 다른 언어로 살고 있습니다.

seq2seq 아키텍처 (Sutskever, Vinyals, Le, 2014) 는 의도적으로 간단한 레시피로 이것을 해킹했습니다. 두 개의 RNN. 하나는 소스 문장을 읽고 고정 크기의 컨텍스트 벡터를 생성합니다. 다른 하나는 그 벡터를 읽고 표적 문장을 토큰으로 생성합니다. 레슨 08에 대해 작성한 코드와 같습니다. 서로 다른 방식으로 붙여졌습니다.

이 연구에는 두 가지 이유에서 가치가 있습니다. 첫째, 컨텍스트-벡터 병목은 NLP에서 가장 교육적으로 유용한 실패입니다. 그것은 관심과 변환기가 잘하는 모든 것을 동원합니다. 둘째, 교육 레시피 (교사 강제, 일정한 샘플링, 추론에 대한 반지 검색) 는 LLM를 포함한 모든 현대 세대 시스템에 여전히 적용됩니다.

## 개념

**Encoder.**RNN는 원본 문장을 읽습니다. 마지막 숨겨진 상태는**context vector** 전체 입력의 고정 크기의 요약. 소스를 제외하고는 아무것도 잃지 않습니다.

**Decoder.**다른 RNN는 컨텍스트 벡터에서 초기화됩니다. 각 단계에서는 이전에 생성된 토큰을 입력으로 받아 목표 어휘에 대한 배포를 생성합니다. 다음 토큰을 선택하기 위해 샘플 또는 argmax을 사용합니다. 다시 입력합니다.`<EOS>`토큰이 생성되거나 최대 길이가 타격됩니다.

**Training:**디코더 단계마다 횡단 엔트로피 손실이 발생하고, 순서로 합쳐집니다.

**Teacher forcing.**훈련 중에 디코더의 입력 단계 `t`위치에서 있는 *ground-truth* 기호입니다`t-1`, 디코더의 자신의 이전 예측이 아닙니다. 이것은 훈련을 안정시킵니다. 그 없이는 초기 오류가 커스케이드되고 모델은 결코 배우지 않습니다. 추론에서, 당신은 모델의 자신의 예측을 사용해야합니다. 그래서 항상 열차 / 추론 분포 격차가 있습니다. 그 격차는 **exposure bias**- 그래

**The bottleneck.**코드 작성자가 원천에 대해 배운 모든 것은 그 하나의 컨텍스트 벡터에 압축되어야 합니다. 긴 문장은 세부 사항을 잃습니다. 희귀한 단어는 흐려집니다. 재질 (채트 노어와 블랙 고양이) 는 계산이 아니라 기억해야합니다.

주의 (강습 10) 는 디코더가 마지막이 아닌 *모든* 코더의 숨겨진 상태를 확인하도록 함으로써 이것을 수정합니다.

```figure
lstm-gates
```

## 건설 해

### 단계 1: 코더

```python
import torch
import torch.nn as nn


class Encoder(nn.Module):
    def __init__(self, src_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(src_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)

    def forward(self, src):
        e = self.embed(src)
        outputs, hidden = self.gru(e)
        return outputs, hidden
```

`outputs`모양이 있습니다`[batch, seq_len, hidden_dim]` 입력 위치마다 한 개의 숨겨진 상태. `hidden`모양이 있습니다`[1, batch, hidden_dim]` 마지막 단계. 수업 08 은 "분류를 위한 출력들을 모아 놓"라고 했습니다. 여기서 우리는 마지막 숨겨진 상태를 컨텍스트 벡터로 유지하고, 각 단계 출력들을 무시합니다.

### 단계 2: 디코더

```python
class Decoder(nn.Module):
    def __init__(self, tgt_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(tgt_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, tgt_vocab_size)

    def forward(self, token, hidden):
        e = self.embed(token)
        out, hidden = self.gru(e, hidden)
        logits = self.fc(out)
        return logits, hidden
```

디코더는 한 번에 한 단계로 호출됩니다. 입력: 단일 토큰의 무대 및 현재 숨겨진 상태. 출력: 다음 토큰과 업데이트 된 숨겨진 상태의 어휘 로그티.

### 단계 3: 교사 강제로 훈련 루프

```python
def train_batch(encoder, decoder, src, tgt, bos_id, optimizer, teacher_forcing_ratio=0.9):
    optimizer.zero_grad()
    _, hidden = encoder(src)
    batch_size, tgt_len = tgt.shape
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    loss = 0.0
    loss_fn = nn.CrossEntropyLoss(ignore_index=0)

    for t in range(tgt_len):
        logits, hidden = decoder(input_token, hidden)
        step_loss = loss_fn(logits.squeeze(1), tgt[:, t])
        loss += step_loss
        use_teacher = torch.rand(1).item() < teacher_forcing_ratio
        if use_teacher:
            input_token = tgt[:, t].unsqueeze(1)
        else:
            input_token = logits.argmax(dim=-1)

    loss.backward()
    optimizer.step()
    return loss.item() / tgt_len
```

두 개의 이 이름 붙여진 가치가 있습니다.`ignore_index=0`팅 토큰에 손실을 미치지 않습니다.`teacher_forcing_ratio`각 단계에 실제 토큰을 모델의 예측에 비해 사용하는 확률입니다. 1.0 (전체 교사 강제) 에서 시작하여 노출 편견 격차를 닫기 위해 훈련에 대한 ~0.5까지 줄일 수 있습니다.

### 4단계: 추론 루프 (만욕적인)

```python
@torch.no_grad()
def greedy_decode(encoder, decoder, src, bos_id, eos_id, max_len=50):
    _, hidden = encoder(src)
    batch_size = src.shape[0]
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    output_ids = []
    for _ in range(max_len):
        logits, hidden = decoder(input_token, hidden)
        next_token = logits.argmax(dim=-1)
        output_ids.append(next_token)
        input_token = next_token
        if (next_token == eos_id).all():
            break
    return torch.cat(output_ids, dim=1)
```

탐욕적인 디코딩은 모든 단계에서 가장 높은 확률의 토큰을 선택합니다. 그것은 방황할 수 있습니다. 일단 당신이 토큰에 의약하면, 당신은 그것을 취소 할 수 없습니다.**Beam search**- 윗부분을 유지해...`k`부분 순서들이 생기고 가장 높은 점수를 받는 완전한 순서들을 최종적으로 선택합니다.

### 단계 5: 병목, 증명

모델에 장난감 복사 작업을 훈련: 출처 `[a, b, c, d, e]`, 목표`[a, b, c, d, e]`- 순서 길이를 높이고 정확성을 관찰합니다.

```
seq_len=5   copy accuracy: 98%
seq_len=10  copy accuracy: 91%
seq_len=20  copy accuracy: 62%
seq_len=40  copy accuracy: 23%
```

하나의 GRU 숨겨진 상태는 40 토큰 입력을 손실없이 기억할 수 없습니다. 정보는 각 코더 단계에 있습니다. 하지만 디코더는 마지막 상태를만 볼 수 있습니다. 주의는 이것을 직접 수정합니다.

## 사용 하 고

피토르크가 `nn.Transformer`그리고`nn.LSTM`- 그링 페이스의 그링 페이스`transformers`라이브러리 배는 수십억 개의 토큰에 훈련된 완전한 코더-독독 모델 (BART, T5, mBART, NLLB)

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

tok = AutoTokenizer.from_pretrained("facebook/bart-base")
model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-base")

src = tok("Translate this to French: Hello, how are you?", return_tensors="pt")
out = model.generate(**src, max_new_tokens=50, num_beams=4)
print(tok.decode(out[0], skip_special_tokens=True))
```

현대 엔코더 디코더들은 트랜스포머에 RNNs를 떨어뜨렸다. 고급 모양 (엔코더, 디코더, 토큰-당-토큰을 생성) 은 2014 seq2seq 종이와 동일하다. 각 블록 내부의 메커니즘은 다르다.

### RNN 기반의 seq2seq에 도달할 때

거의 절대, 새로운 프로젝트에서

- 스트리밍 번역, 한 번에 하나의 토큰을 입력하여 제한된 메모리를 사용합니다.
- 트랜스포머 메모리 비용이 막대한 장치 내 텍스트 생성
- 교육학. 암호화-독독물물 병목을 이해하는 것은 왜 트랜스포머가 승리했는지 이해하는 가장 빠른 길입니다.

### 노출 편향 및 그 완화

- **Scheduled sampling.**교육 중에 강제적인 교사의 비율이 필요하므로 모델은 자신의 실수로부터 회복을 배우게 됩니다.
- **Minimum risk training.**토큰 레벨의 크로스 엔트로피가 아닌 문장 레벨의 BLEU 점수를 훈련시켜요.
- **Reinforcement learning fine-tuning.**현대 LLM RLHF에서 사용되는 메트릭으로 순서 생성기를 보상하십시오.

이 세 가지 모두 트랜스포머 기반 발전에 여전히 적용됩니다.

## 선박

`outputs/prompt-seq2seq-design.md`이 부분의 본문은

```markdown
---
name: seq2seq-design
description: Design a sequence-to-sequence pipeline for a given task.
phase: 5
lesson: 09
---

Given a task (translation, summarization, paraphrase, question rewrite), output:

1. Architecture. Pretrained transformer encoder-decoder (BART, T5, mBART, NLLB) is the default. RNN-based seq2seq only for specific constraints.
2. Starting checkpoint. Name it (`facebook/bart-base`, `google/flan-t5-base`, `facebook/nllb-200-distilled-600M`). Match the checkpoint to task and language coverage.
3. Decoding strategy. Greedy for deterministic output, beam search (width 4-5) for quality, sampling with temperature for diversity. One sentence justification.
4. One failure mode to verify before shipping. Exposure bias manifests as generation drift on longer outputs; sample 20 outputs at the 90th-percentile length and eyeball.

Refuse to recommend training a seq2seq from scratch for under a million parallel examples. Flag any pipeline that uses greedy decoding for user-facing content as fragile (greedy repeats and loops).
```

## 운동

1. **Easy.**장난감 복사 작업을 수행하십시오. 입력-출력 쌍에 GRU seq2seq를 훈련하십시오. 목표가 소스와 같습니다. 길이를 5, 10, 20에서 정확성을 측정하십시오. 병목을 재생하십시오.
2. **Medium.**3 빔 너비로 빔 검색 디코딩을 추가 합니다. 빔 검색이 승리하는 문서 (일반적으로 마지막 토큰) 과 상관없이 작은 병렬 코퍼스에서 BLEU를 측정합니다.
3. **Hard.**미세한 조율`facebook/bart-base`10k 쌍의 패러프라시 데이터 세트에 대한 설명. 미세하게 조정된 모델의beam-4 출력을 기본 모델의 유지된 입력 출력과 비교하십시오. BLEU를 보고하고 10 가지 질적 예제를 선택하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder | Input RNN | Reads source. Produces per-step hidden states and a final context vector. |
| Decoder | Output RNN | Initialized from context vector. Generates target tokens one at a time. |
| Context vector | The summary | Final encoder hidden state. Fixed size. The bottleneck attention solves. |
| Teacher forcing | Use true tokens | Feed the ground-truth previous token at training time. Stabilizes learning. |
| Exposure bias | Train/test gap | Model trained on true tokens never practiced recovering from its own mistakes. |
| Beam search | Better decoding | Keep top-k partial sequences alive at each step instead of committing greedily. |

## 더 많은 읽기

- [Sutskever, Vinyals, Le (2014). Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215) 원래의 큐2세크 종이. 4 페이지.
- [Cho et al. (2014). Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation](https://arxiv.org/abs/1406.1078) GRU와 엔코더-디코더 프레임링을 도입했습니다.
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)이 수업 후 즉시 읽어보세요.
- [PyTorch NLP from Scratch tutorial](https://pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html) 제작 가능한 seq2seq + 주의 코드
