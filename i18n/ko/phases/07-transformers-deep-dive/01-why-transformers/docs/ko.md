# 왜 트랜스포머가 RNN 문제

> RNNs는 하나의 토큰을 처리합니다. 트랜스포머는 모든 토큰을 동시에 처리합니다. 그 단일 건축 베팅은 2017 년 이후 딥 러닝의 모든 확장 곡선을 변경했습니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 3 (Deep Learning Core), Phase 5 · 09 (Sequence-to-Sequence), Phase 5 · 10 (Attention Mechanism)
**Time:** ~45 minutes

## 문제

2017년 이전에는 지구상의 모든 최첨단 순서 모델  언어, 번역, 말하기 은 반복적인 신경 네트워크였습니다. LSTM와 GRU는 이미지넷과 동등한 번역 기준을 반 십 년 동안 획득했습니다. 그들은 모든 사람이 가진 유일한 도구였습니다.

세 가지 치명적인 약점이 있었습니다. 순서적 계산은 시간축을 따라 평행성을 할 수 없다는 것을 의미했습니다.`t+1`도켓에서 숨겨진 상태가 필요합니다`t`1,024 토큰의 순서란 GPU에서 1,024 일련의 단계를 의미하며, 순서 દીઠ 1,000,000 개의 부동소수점 작전을 수행 할 수 있습니다.

사라지는 기하급수적 요소는 50개의 토큰의 정보를 이미 50개의 비선형성으로 압축시켰다는 것을 의미했습니다. 가이트된 재발 단위 (LSTM, GRU) 는 압축을 완화했지만 결코 제거하지 않았습니다. 장거리 의존성  "나는 지난 여름 교토로 비행기에서 읽은 책..." 는 일상적으로 실패했습니다.

고정 너비 숨겨진 상태는 엔코더가 디코더가 아무것도 보지 못하기 전에 전체 소스 순서를 하나의 벡터로 압축한다는 것을 의미합니다. 소스는 5 토큰 또는 500 개인지 중요하지 않습니다. 병목은 같은 모양입니다.

2017년 발표된 "주의는 당신이 필요로 하는 전부다"라는 논문에서는 급진적인 것을 제안하였다. 반복을 완전히 없애라. 모든 위치가 다른 위치에 병렬로 주의를 기울일 수 있도록 한다. 1,024개의 순서대로 하는 대신 하나의 큰 매트릭스 곱셈을 연습하라.

이 결과는 2026년까지 모든 모다얼리티에 지배를 가한다. 언어 (GPT-5, 클로드 4, 라마 4), 시각 (ViT, DINOv2, SAM 3), 오디오 (시퍼), 생물학 (알파 폴드 3), 로봇 (RT-2). 동일한 블록, 다른 입력.

## 개념

![RNN sequential compute vs Transformer parallel attention](../assets/rnn-vs-transformer.svg)

**Recurrence as a bottleneck.**RNN가 계산합니다$h_t = f(h_{t-1}, x_t)$모든 단계가 이전 단계에 달려 있습니다. 계산할 수 없습니다.$h_5$이전$h_4$10,000개 이상의 병렬 코어를 가진 현대 GPU에서 이것은 긴 순서로 실리콘의 99%를 낭비합니다.

**Attention as a broadcast.**자기주의 계산기`output_i = sum_j(a_ij * v_j)`각 쌍에$(i, j)$동시에 N×N 주의 매트릭스가 한 배트 매트럼을 채우며

**The speedup is not a constant.**이 차이점은$O(N)$일련의 깊이를$O(1)$일련의 깊이. 실제에서 트랜스포머들은 N=512에서 일치하는 하드웨어에서 510x 더 빨리 훈련합니다.$O(N^2)$주의의 메모리 벽 (이 플래시 주의가 나중에 수정한 것)

**What transformers cost.**주의 기억 스캔$O(N^2)$2K 컨텍스트에서는 괜찮습니다. 128K 컨텍스트에서는 슬라이딩 창, RoPE 추출, 플래시 주의 타일, 또는 선형 주의 변종이 필요합니다. 반복은$O(N)$시간과 기억을 모두 바꾸고, 시간적 평행성을 통해 시간을 되찾습니다.

**The inductive bias shift.**RNNs는 지역성과 신기능을 가정한다. 트랜스포머는 아무것도 가정하지 않는다. 각 쌍은 관심 후보이다. 트랜스포머는 잘 훈련하기 위해 더 많은 데이터가 필요하지만 그것을 가지고 나면 더 확장해야 한다. 칠라 (2022) 는 이것을 공식화했다: 충분한 토큰을 주어지면 트랜스포머는 항상 동일한 매개 변수 수를 가진 RNN를 이긴다.

```figure
rnn-vs-parallel
```

## 건설 해

신경망이 없습니다. 우리는 핵 병목을 수적으로 시뮬레이션합니다. 그래서 노트북에서 격차를 느낄 수 있습니다.

### 단계 1: 일련의 깊이 측정

보시다시피`code/main.py`우리는 두 개의 함수를 만듭니다. 하나는 순서열을 덧셈의 연쇄로 암호화합니다 (열렬, RNN처럼). 하나는 병렬 줄여서 (방송, 관심과 같은) 암호화합니다. 같은 수학, 다른 의존 그래프.

```python
def rnn_style(xs):
    h = 0.0
    for x in xs:
        h = 0.9 * h + x   # can't parallelize: h depends on previous h
    return h

def attention_style(xs):
    return sum(xs) / len(xs)  # every x is independent
```

RNN 버전은 RNN 버전입니다.$O(N)$순수한 파이썬에서도, 주의 방식의 감소는 파이썬의 길이가 1000 이상으로 미치지 않습니다.`sum()`C에서 구현되어 있으며 단계별로 인터프리터 오버하드를 사용하지 않고 반복합니다.

### 단계 2: 이론적 연산을 계산

두 알고리즘 모두 N을 추가합니다. 차이점은 * 의존성 깊이*입니다. 다음 작업이 시작되기 전에 몇 개의 작업이 순차적으로 일어나야 하는지. RNN 깊이 = N. 주의 깊이는 = log(N) 를 나무 감소 또는 1을 병렬 스캔으로 한다. 깊이, 작업 수치는 GPU 시간을 결정한다.

### 단계 3: 긴 염기서에서의 경험적 확장

우리는 $O(N)$2026 Mac 노트북에서 1,000개의 요소 아래의 염기들은 측정하기에는 너무 빠르다. 100,000개의 염기들은 깨끗한 선형 스캔을 보여줍니다. 12층 LSTM 동등한 16,384개의 토큰 트랜스포머로 측정하면, 2016년에 훈련 벽 시계가 왜 차단적이었는지 알 수 있습니다.

## 사용 하 고

2026년에 RNN를 선택할 때:

| Situation | Pick |
|-----------|------|
| Streaming inference, one token at a time, constant memory | RNN or state-space model (Mamba, RWKV) |
| Very long sequences (>1M tokens) where attention memory explodes | Linear attention, Mamba 2, Hyena |
| Edge device with no matmul accelerator | Depthwise-separable RNN still wins on FLOPs/watt |
| Anything else (training, batched inference, context up to 128K) | Transformer |

Mamba와 같은 국가 공간 모델 (SSM) 은 기본적으로 RNN이며, 구조화된 매개 변수를 통해 두 가지의 최고의 기능을 제공합니다.$O(N)$스캔 메모리, 선택 스캔을 통해 병렬 훈련. 그들은 더 나은 장기 맥락 확장으로 변환기 품질의 90%를 복구합니다. 2026 년 대부분의 국경 연구소에서는 하이브리드 SSM+ 변환기 모델을 훈련합니다.

## 선박

보시다시피`outputs/skill-architecture-picker.md`. 기술 은 길, 출력 및 훈련 예산 제한 을 감안 하여 새로운 순서 문제 를 위한 아키텍처 를 선택 한다. 1B 토큰 이상 에 있는 훈련 도중 에 대해 순수 RNN 를 추천 하는 것을 항상 거부 해야 한다.

## 운동

1. **Easy.**이봐`rnn_style``code/main.py`스칼라적 숨겨진 상태를 숨겨진 상태의 길이-64 벡터로 대체합니다. 다시 측정합니다.
2. **Medium.**순수한 파이썬에서 병렬 프리픽스-수액 (힐리스-스틸 스캔) 을 구현하십시오. 길이 1024에 일련 스캔과 동일한 숫자 출력을 생성하는지 확인합니다. 깊이를 계산하십시오.
3. **Hard.**GPU에 PyTorch에 주의 방식의 줄여서 64에서 65,536까지 순서 길이를 닦을 때 시간을 가집니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Recurrence | "RNNs are sequential" | Computation where step `t` depends on step `t-1`, forcing serial execution along the time axis. |
| Serial depth | "How deep the graph is" | Longest chain of dependent ops; bounds wall-clock even on infinite hardware. |
| Attention | "Let tokens look at each other" | Weighted sum $\sum_j a_{ij} v_j$ where $a_{ij}$ comes from a similarity score between positions $i$ and $j$. |
| Context window | "How much the model sees" | Number of positions an attention layer can take as input; quadratic memory cost scales here. |
| Inductive bias | "Assumptions baked into the architecture" | Prior about what the data looks like; CNNs assume translation invariance, RNNs assume recency. |
| State-space model | "RNN with algebra behind it" | Recurrence parameterized for parallel training via structured state-space matrices. |
| Quadratic bottleneck | "Why context costs so much" | Attention memory = $O(N^2)$ in sequence length; Flash Attention hides the constants, not the scaling. |

## 더 많은 읽기

- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) 주요 NLP에서 재발을 죽인 논문
- [Bahdanau, Cho, Bengio (2014). Neural MT by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) 관심의 탄생이 된 곳, RNN에 연결되었습니다.
- [Hochreiter, Schmidhuber (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) 본래의 LSTM 종이를 기록하기 위해서.
- [Gu, Dao (2023). Mamba: Linear-Time Sequence Modeling with Selective State Spaces](https://arxiv.org/abs/2312.00752) 트랜스포머에 대한 현대적인 반복적인 답
