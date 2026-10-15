# 처음부터 트랜스포머를 만들  캡스톤

> 13개의 강좌, 1개의 모델, 단축도 없습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 01 through 13. Don't skip.
**Time:** ~120 minutes

## 문제

모든 논문을 읽었습니다. 여러분은 주의를 구현했습니다. 다중 헤드 스플리트, 위치 코딩, 코더와 디코더 블록, BERT 및 GPT 손실, MoE, KV 캐시. 이제 실제 작업에 함께 작동하도록 하세요.

돌: 작은 디코더만 사용하는 트랜스퍼머를 캐릭터 레벨 언어 모델링 작업에 종단에서 종단으로 훈련시켜줍니다. 그것은 셰익스피어를 읽습니다. 새로운 셰익스피어를 생성합니다. 10분 이내에 노트북에서 훈련 할 만큼 작습니다. 더 큰 데이터 세트를 교환하고 더 긴 훈련이 진정한 LM를 얻는 것이 충분히 정확합니다.

이것은 코스의 "나노GPT"입니다. 그것은 원래가 아닙니다.  카르파티의 2023 나노GPT 튜토리얼은 모든 학생들이 적어도 한 번 쓰는 참조 구현입니다. 우리는 그 모양을 들어 올리고 우리가 다루었던 것을 다시 정리합니다.

## 개념

![Transformer-from-scratch block diagram](../assets/capstone.svg)

건축물, 해설:

```
input tokens (B, N)
   │
   ▼
token embedding + positional embedding  ◀── Lesson 04 (RoPE option)
   │
   ▼
┌──── block × L ────────────────────┐
│  RMSNorm                          │  ◀── Lesson 05
│  MultiHeadAttention (causal)      │  ◀── Lesson 03 + 07 (causal mask)
│  residual                         │
│  RMSNorm                          │
│  SwiGLU FFN                       │  ◀── Lesson 05
│  residual                         │
└────────────────────────────────── ┘
   │
   ▼
final RMSNorm
   │
   ▼
lm_head (tied to token embedding)
   │
   ▼
logits (B, N, V)
   │
   ▼
shift-by-one cross-entropy            ◀── Lesson 07
```

### 우리가 배송하는

- `GPTConfig` 모든 하이퍼파레머를 구성하는 한 장소
- `MultiHeadAttention` 인과적, 배팅, 선택적 플래시 스타일 경로 (PyTorch's `scaled_dot_product_attention`)
- `SwiGLUFFN` 현대 FFN
- `Block` 전 표준, 잔재 포장 관심 + FFN.
- `GPT` 임베디드, 스테이크 블록, LM 헤드, 생성 ()
- AdamW, cosine LR, gradient clipping와 함께 훈련 루프
- 셰익스피어 텍스트에 대한 차 레벨 토큰화

### 우리가 보내지 않는

- RoPE 는 강좌 04에서 개념적으로 구현되었습니다. 여기서 우리는 단순하기 위해 학습된 위치 임베디션을 사용합니다. 연습은 RoPE를 교환하도록 요청합니다.
- KV 캐시 생성 중  각 세대 단계에서는 전체 사전에서 주의를 다시 계산합니다. 느리지만 더 간단합니다. 연습은 KV 캐시를 추가하도록 요청합니다.
- 플래시 주의  PyTorch 2.0+ 자동 디스패치 입력이 일치하면, 우리는 사용 `F.scaled_dot_product_attention`- 그래
- 모에이  블록당 한 FFN. 당신은 모에이 11 수업에서 보았다.

### 목표 측정

맥 M2 노트북에서 4층, 4머리, d_model=128 GPT는 2,000단계까지 훈련되어 있습니다`tinyshakespeare.txt`이 부분의 본문은

- 훈련 손실은 약 6분 동안 ~4.2 (자발) 에서 ~1.5으로 konverges.
- 샘플링된 결과물은 셰익스피어 모양으로 보입니다. 고구려적인 단어, 선의 휴식, "ROMEO:"와 같은 고유명사가 등장합니다.
- Val 손실 (문서 마지막 10%) 은 훈련 손실을 밀접하게 추적합니다. 이 크기와 예산에 부합하지 않습니다.

```figure
n5-block-stack
```

## 건설 해

이 수업은 PyTorch를 사용합니다. 설치`torch`(CPU 구축은 괜찮습니다)`code/main.py`- 스크립트에서

- 다운로드 `tinyshakespeare.txt`실종된 경우 (또는 지역 복사본을 읽거나)
- 바이트 레벨 카트 토큰화
- 열차와 전차의 분할률은 90/10입니다.
- 지원된 하드웨어에서 bf16 자동 캐스트를 가진 훈련 루프
- 훈련 후 샘플링이 완료됩니다.

### 단계 1: 데이터

```python
text = open("tinyshakespeare.txt").read()
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
itos = {i: c for c, i in stoi.items()}
encode = lambda s: [stoi[c] for c in s]
decode = lambda xs: "".join(itos[x] for x in xs)
```

65개의 독특한 문자, 작은 어휘, 4바이트의 어휘 크기에 적합합니다. BPE, 토케니저 드라마가 없습니다.

### 단계 2: 모델

보시다시피`code/main.py`. 블록은 레슨 05  사전 표준, RMSNorm, SwiGLU, 인과성 MHA의 교과서입니다. 4/4/128의 파라미터 수: ~800K.

### 단계 3: 훈련 루프

길이-256의 도큰 창을 무작위로 어, 앞면, 한 번씩 횡단 엔트로피를 어, 뒤로, 아담W 단계, 로그, 반복

```python
for step in range(max_steps):
    x, y = get_batch("train")
    logits = model(x)
    loss = F.cross_entropy(logits.view(-1, vocab_size), y.view(-1))
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step()
    opt.zero_grad()
```

### 4단계: 샘플

요청이 주어지면, 반복적으로 앞뒤로, 상위 p 로그티에서 샘플을 가져가, 추가하고 계속하십시오. 500 토큰 후에 중지하십시오.

### 5단계: 출력서를 읽어보세요

2000발의 걸음마:

```
ROMEO:
Away and mild will not thy friend, that thou shalt wit:
The chief that well shame and hath been his friends,
...
```

셰익스피어가 아니라 셰익스피어 모양으로 은 승률은 800만원, 노트북에서 6분

## 사용 하 고

이 윗돌은 참고 건축물입니다. 실제적인 곳으로 전송하기 위해 세 가지 확장자:

1. **Swap the tokenizer.**BPE를 사용하십시오 (예를 들어`tiktoken.get_encoding("cl100k_base")` 카브 크기는 65에서 ~ 50,000까지 급등합니다.
2. **Train on a bigger corpus.**사용`OpenWebText`또는`fineweb-edu`A100에 10B 토큰이 있으면 125M의 GPT를 얻기 위해 24시간 정도 걸립니다.
3. **Add RoPE + KV cache + Flash Attention.**아래의 연습은 각각을 통해 안내합니다.

이것은 125M 파라미터의 GPT로 끝납니다. 유창한 영어를 생성합니다. 국경 모델이 아닙니다. 하지만 동일한 코드 경로는  더 커집니다.  카르파티, 엘레우터AI, 앨런 연구소는 2026년에 연구 체크포인트를 훈련시키는 데 사용합니다.

## 선박

보시다시피`outputs/skill-transformer-review.md`. 기술은 이전 13개의 수업에서 정확성을 확인하기 위해 처음부터 변환기 구현을 검토합니다.

## 운동

1. **Easy.**달아`code/main.py`훈련된 모델의 최종 단계의 유효성 손실이 2.0 이하인 것을 확인하세요`max_steps`2,000에서 5,000 까지의 발 손실이 계속 개선되는가?
2. **Medium.**학습된 위치 임베디션을 RoPE로 교체하고, Q와 K에 로테이션을 적용합니다.`MultiHeadAttention`열차 및 검증 val 손실은 적어도 그렇게 낮습니다.
3. **Medium.**샘플링 루프에 KV 캐시를 구현하여 500 개의 토큰을 캐시와 없이 생성합니다. 랩톱에서 벽 시계 520x로 향상되어야합니다.
4. **Hard.**다음 플러스 1 토큰을 예측하는 모델에 두 번째 헤드를 추가하십시오.
5. **Hard.**블록당 단일 FFN를 4 전문가 MoE로 교체하십시오. 라우터 + 톱-2 라우팅. 일치하는 활성 매개 변수에서 val 손실이 어떻게 변화하는지 확인하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| nanoGPT | "Karpathy's tutorial repo" | Minimal decoder-only transformer training code, ~300 LOC; the canonical reference. |
| tinyshakespeare | "The standard toy corpus" | ~1.1 MB of text; every character-LM tutorial since 2015 uses it. |
| Tied embeddings | "Share input/output matrix" | LM head weight = transpose of token embedding matrix; saves parameters, improves quality. |
| bf16 autocast | "Training precision trick" | Run forward/back in bf16, keep optimizer state in fp32; standard since 2021. |
| Gradient clipping | "Stops spikes" | Cap global grad norm at 1.0; prevents training blowups. |
| Cosine LR schedule | "The 2020+ default" | LR ramps up linearly (warmup) then decays cosine-shaped to 10% of peak. |
| MFU | "Model FLOP Utilization" | Achieved FLOPs / theoretical peak; 40% dense, 30% MoE is strong in 2026. |
| Val loss | "Held-out loss" | Cross-entropy on data the model never saw; overfit detector. |

## 더 많은 읽기

- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/) 고전적인 표기된 구현
