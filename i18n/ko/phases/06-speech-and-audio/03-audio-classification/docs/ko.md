# 오디오 분류  MFCC에서 k-NN에서 AST 및 BEAT까지

> "개 발음과 소란"에서 "이것이 어떤 언어인가"까지 모든 것은 오디오 분류입니다. 특징은 미러입니다. 건축은 10 년마다 움직입니다. 평가는 AUC, F1 및 클래스별 리콜이 유지됩니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 3 · 06 (CNNs), Phase 5 · 08 (CNNs & RNNs for Text)
**Time:** ~75 minutes

## 문제

10초짜리 클립을 얻습니다. "그게 뭐죠?"라고 알고 싶으세요. 도시 소리 (시렌, 드릴, 개), 음성 명령 (예/아니/정지), 언어 ID (en/es/ar), 스피커 감정 (분노/중립), 또는 환경 소리 (내/외, ) 이 있습니다. 이 모든 것은 * 오디오 분류*이며, 2026년에는 기본 구조가 성숙합니다. 로그메일 → CNN 또는 트랜스포머 → 소프트맥스.

핵심 문제는 네트워크가 아닙니다. 데이터입니다. 오디오 데이터 세트는 잔인한 클래스 불균형, 강력한 도메인 전환 (정화 vs 잡음) 및 레이블 노이즈 (누가 "도시의 거북이"와 " 레스토랑 노이즈"를 결정했습니까). 80%의 문제는 CNN를 트랜스포머로 교환하지 않고, 큐레이션, 증강 및 평가입니다.

## 개념

![Audio classification ladder: k-NN on MFCCs to AST to BEATs](../assets/audio-classification.svg)

**k-NN on MFCCs (the 1990s baseline).**클립에 대한 평면 MFCC, 레이블된 은행과 코시네 유사성을 계산, 상위 K의 과반수의 투표를 반환합니다. 깨끗하고 작은 데이터 세트 (스피치 명령어, ESC-50) 에서 놀랍도록 강력합니다. GPU 없이 실행됩니다.

**2D CNN on log-mels (2015-2019).**치료`(T, n_mels)`로그메일 (log-mail) 을 이미지로 적용하세요. ResNet-18 또는 VGG 스타일로 적용하세요. 글로벌 평균 시간축을 풀하세요. 클래스 중 소프트맥스. 여전히 2026 카글 대회에서 기본 라인입니다.

**Audio Spectrogram Transformer, AST (2021-2024).**로그메일을 (예를 들어 16×16 패치) 꽂아, 위치 임베디션을 추가하고 ViT에 입력합니다. 감독된 학습을 위해 AudioSet의 최신 상태 (mAP 0.485)

**BEATs and WavLM-base (2024-2026).**수백만 시간 동안 자율 감독 사전 훈련. 당신이 필요로 할 수 있는 감독 데이터의 1-10%를 사용하여 작업을 정밀하게 조정하십시오. 2026 년에는 비 음성 오디오의 기본 시작점입니다. BEATs-iter3는 계산을 1/4을 사용하여 오디오세트에 AST를 1-2 mAP로 이긴다.

**Whisper-encoder as a frozen backbone (2024).**Whisper의 코더를 가져와 디코더를 내려놓고 선형 분류기를 붙여 language ID에 SOTA를 가까이서 붙여서

### 계급 불균형은 진짜 도전입니다

ESC-50: 50 클래스, 각 40 클립  균형 잡힌, 쉬운. UrbanSound8K: 10 클래스, 불균형 10:1. AudioSet: 632 클래스, 100,000:1 긴 꼬리. 작동하는 기술:

- 훈련 중에 균형 잡힌 샘플링 (평가 중 아닌)
- 혼합: 두 개의 클립 (그리고 그 레이블) 을 연장로 선형적으로 중점화한다.
- 스펙Augment: 무작위 시간 및 주파수 대면을 마스크. 간단하고, 중요.

### 평가

- 멀티 클래스 독점 (스피치 명령): 1위 정확성, 5위 정확성.
- 멀티 클래스 멀티 레이블 (AudioSet, UrbanSound-style): 평균 정확성 (mAP).
- 중증 불균형: 클래스별 리콜 + 매크로 F1

2026번 번호를 알아야 합니다.

| Benchmark | Baseline | SOTA 2026 | Source |
|-----------|----------|-----------|--------|
| ESC-50 | 82% (AST) | 97.0% (BEATs-iter3) | BEATs paper (2024) |
| AudioSet mAP | 0.485 (AST) | 0.548 (BEATs-iter3) | HEAR leaderboard 2026 |
| Speech Commands v2 | 98% (CNN) | 99.0% (Audio-MAE) | HEAR v2 results |

```figure
mfcc-pipeline
```

## 건설 해

### 단계 1: 큐브

```python
def featurize_mfcc(signal, sr, n_mfcc=13, n_mels=40, frame_len=400, hop=160):
    mag = stft_magnitude(signal, frame_len, hop)
    fb = mel_filterbank(n_mels, frame_len, sr)
    mels = apply_filterbank(mag, fb)
    log = log_transform(mels)
    return [dct_ii(frame, n_mfcc) for frame in log]
```

### 단계 2: 고정 길이의 요약

```python
def summarize(mfcc_frames):
    n = len(mfcc_frames[0])
    mean = [sum(f[i] for f in mfcc_frames) / len(mfcc_frames) for i in range(n)]
    var = [
        sum((f[i] - mean[i]) ** 2 for f in mfcc_frames) / len(mfcc_frames) for i in range(n)
    ]
    return mean + var
```

단순하지만 강력: 시간 간 평균 + 변이는 13 코프 MFCC에 26 차원 고정 임베디션을 제공합니다. 즉시 실행됩니다. ESC-50에서 최신 NN 기본선을 2017 년까지 비트합니다.

### 단계 3: k-NN

```python
def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1e-12
    nb = math.sqrt(sum(x * x for x in b)) or 1e-12
    return dot / (na * nb)

def knn_classify(q, bank, labels, k=5):
    sims = sorted(range(len(bank)), key=lambda i: -cosine(q, bank[i]))[:k]
    votes = Counter(labels[i] for i in sims)
    return votes.most_common(1)[0][0]
```

### 단계 4: 로그멜에서 CNN에 업그레이드

파이토르치:

```python
import torch.nn as nn

class AudioCNN(nn.Module):
    def __init__(self, n_mels=80, n_classes=50):
        super().__init__()
        self.body = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(),
            nn.AdaptiveAvgPool2d(1),
        )
        self.head = nn.Linear(128, n_classes)

    def forward(self, x):  # x: (B, 1, T, n_mels)
        return self.head(self.body(x).flatten(1))
```

3M 매개 변수. ESC-50에서 10분 안에 열차가 됩니다.

### 단계 5: 미리 훈련된 오디오 트랜스포머 (AST 표시) 를 정밀 조정

```python
from transformers import ASTFeatureExtractor, ASTForAudioClassification

ext = ASTFeatureExtractor.from_pretrained("MIT/ast-finetuned-audioset-10-10-0.4593")
model = ASTForAudioClassification.from_pretrained(
    "MIT/ast-finetuned-audioset-10-10-0.4593",
    num_labels=50,
    ignore_mismatched_sizes=True,
)

inputs = ext(audio, sampling_rate=16000, return_tensors="pt")
logits = model(**inputs).logits
```

예를 들어, Hub에서 AST를 정렬합니다. 2026 기본 버전인 BEATs는 Hugging Face Hub에 없습니다.[BEATs release in microsoft/unilm](https://github.com/microsoft/unilm/tree/master/beats)그리고 그 리포를 로드해`BEATs`그리고`BEATsConfig`클래스; 미세 조율 루프는 같은 모양을 유지합니다.

## 사용 하 고

2026년 스택:

| Situation | Start with |
|-----------|-----------|
| Tiny dataset (<1000 clips) | k-NN on MFCC means (your baseline) + audio augmentation |
| Medium dataset (1K–100K) | BEATs or AST fine-tune |
| Large dataset (>100K) | Train from scratch or fine-tune Whisper-encoder |
| Real-time, edge | 40-MFCC CNN, quantized to int8 (KWS-style) |
| Multi-label (AudioSet) | BEATs-iter3 with BCE loss + mixup + SpecAugment |
| Language ID | MMS-LID, SpeechBrain VoxLingua107 baseline |

결정 규칙: **start with a frozen backbone, not a fresh model**BEAT의 머리에 정렬하면 몇 주가 아닌 몇 시간 안에 95%의 SOTA를 얻을 수 있습니다.

## 선박

`outputs/skill-classifier-designer.md`. 특정 오디오 분류 작업에 대한 건축물, 증강, 클래스 균형 전략 및 평가 메트릭을 선택하십시오.

## 운동

1. **Easy.**달아`code/main.py`. 4급 합성 데이터 세트에 k-NN MFCC 기본 라인을 훈련시킵니다. (다양한 음향에서 순수한 음향).
2. **Medium.**대체`summarize`4순간 융합은 같은 합성 데이터 세트에 있는 mean+var을 이길 수 있을까요?
3. **Hard.**사용 `torchaudio`ESC-50 팩 1 에 2D CNN 를 훈련 시키십시오. 5 배의 십자정확도를 보고하세요. 스펙 아그먼트를 추가하세요 (시간 마스크 = 20, 주파수 마스크 = 10) 그리고 델타를 보고하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| AudioSet | The ImageNet of audio | Google's 2M-clip, 632-class weakly-labeled YouTube dataset. |
| ESC-50 | Small classification benchmark | 50 classes × 40 clips of environmental sounds. |
| AST | Audio Spectrogram Transformer | ViT on log-mel patches; 2021 SOTA. |
| BEATs | Self-supervised audio | Microsoft model, iter3 leads AudioSet as of 2026. |
| Mixup | Pair augmentation | `x = λ·x1 + (1-λ)·x2; y = λ·y1 + (1-λ)·y2`. |
| SpecAugment | Mask-based augmentation | Zero-out random time and frequency bands of the spectrogram. |
| mAP | Main multi-label metric | Mean average precision across classes and thresholds. |

## 더 많은 읽기

- [Gong, Chung, Glass (2021). AST: Audio Spectrogram Transformer](https://arxiv.org/abs/2104.01778) 2021년~2024년까지 기록된 건축물
- [Chen et al. (2022, rev. 2024). BEATs: Audio Pre-Training with Acoustic Tokenizers](https://arxiv.org/abs/2212.09058) 2024+ 기본값
- [Park et al. (2019). SpecAugment](https://arxiv.org/abs/1904.08779) 주류적인 오디오 증강
- [Piczak (2015). ESC-50 dataset](https://github.com/karolpiczak/ESC-50)50급 기준으로 살아가죠.
- [Gemmeke et al. (2017). AudioSet](https://research.google.com/audioset/)632급 유튜브 분류학; 여전히 금 표준.
