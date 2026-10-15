# 스펙트로그램, 멜 스케일 & 오디오 기능

> 신경망은 원조파를 잘 섭취하지 않습니다. 그들은 스펙트로그램을 소비합니다. 그들은 멜 스펙트로그램을 더 잘 소비합니다. 2026 년 모든 ASR, TTS 및 오디오 분류자는 이 단일 사전 처리 선택으로 인해 살거나 죽습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 01 (Audio Fundamentals)
**Time:** ~45 minutes

## 문제

10초 16kHz 클립을 찍으세요. 16만개의 플롯이 있습니다.`[-1, 1]`, 거의 완벽하게 "개 발음" 또는 " 고양이 단어"라는 표지와 상관하지 않습니다. 원형 파형은 정보를 가지고 있지만 모델이 쉽게 추출 할 수 없는 형태로 있습니다. 100 ms의 거리에서 말하는 두 개의 동일한 음색은 완전히 다른 원형 샘플을 가지고 있습니다.

스펙트로그램은 이것을 수정합니다. 인간의 인식이 무시하는 시간적 세부 사항을 붕괴시킵니다 (마이크로초 주저) 그리고 인식이 참석하는 구조를 보존합니다 (얼거리는 ~ 1025 ms의 시간 창에 걸쳐 에너지적입니다).

멜 스펙트로그램은 더 나아가도록 밀어붙인다. 인간은 음향을 로가리থম적으로 인식한다: 100 Hz vs 200 Hz는 1000 Hz vs 2000 Hz와 같은 거리에 "거리가 떨어져" 소리를 내는 것이다. 멜 스칼은 주파수 축을 맞추기 위해 왜곡한다. 멜 스칼레드 스펙트로그램은 2010년부터 2026년까지 언어 ML에서 가장 중요한 특징이다.

## 개념

![Waveform to STFT to mel spectrogram to MFCC ladder](../assets/mel-features.svg)

**STFT (Short-Time Fourier Transform).**파동 형태를 초복된 프레임으로 갈라 (정상적으로: 25 ms 창, 10 ms hop = 400 샘플 / 16 kHz에서 160 샘플). 각 프레임을 창 함수로 곱하십시오 (한은 기본입니다; 약간 다른 트레이드 오프 Hamming). FFT 각 프레임. 크기의 스펙트럼을 모양의 매트릭스로 쌓아두십시오.`(n_frames, n_freq_bins)`- 네 스펙트럼이야

**Log-magnitude.**크기가 5~6배 정도입니다.`log(|X| + 1e-6)`또는`20 * log10(|X|)`모든 생산 파이프라인에서 원자 크기가 아니라 로그 크기가 사용된다.

**Mel scale.**빈도는`f`Hz 지도에서 mel `m`$m = 2595 \cdot \log_{10}(1 + f / 700)$. 지도는 대략 1kHz 이하의 선형이고, 대략 상위에는 로가리듬이다. 08kHz를 포함하는 80mBIN는 표준 ASR 입력이다.

**Mel filterbank.**mel 스케일에서 동등하게 거리를 둔 삼각형 필터들의 집합. 각 필터는 인접 FFT 칸의 중량 합입니다. 필터뱅크 매트릭스에 STFT 크기를 곱하면 한 매트울에서 mel 스펙트럼을 제공합니다.

**Log-mel spectrogram.** `log(mel_spec + 1e-10)`윙어 입력, 패라키트 입력, 시어리스M4T 입력, 보편적인 2026 오디오 프론트엔드

**MFCCs.**로그멜 스펙트로그램을 사용해서 DCT ( 타입 II) 를 적용하고, 첫 13 개의 계수를 유지한다. 특징을 디코레레이트하고 더 압축한다. 2015년경까지 CNN/트랜스포머가 원료 로그멜에 의해 잡혔을 때까지 지배적인 특징이다. 여전히 스피커 인식 (x 벡터, ECAPA) 에서 사용된다.

**Resolution trade.**더 큰 FFT = 더 나은 주파수 해상도, 그러나 더 나쁜 시간 해상도. 25 ms / 10 ms는 오디오-ML 기본입니다. 음악에 50 ms / 12.5 ms; 일시적 검출에 5 ms / 2 ms (드럼 히트, 플로시브).

```figure
spectrogram-window
```

## 건설 해

### 단계 1: 파형을 틀어

```python
def frame(signal, frame_len, hop):
    n = 1 + (len(signal) - frame_len) // hop
    return [signal[i * hop : i * hop + frame_len] for i in range(n)]
```

10초 16kHz 클립`frame_len=400, hop=160`998개의 프레임을 내놓습니다.

### 단계 2: 한 창

```python
import math

def hann(N):
    return [0.5 * (1 - math.cos(2 * math.pi * n / (N - 1))) for n in range(N)]
```

FFT 전에 요소를 곱하여 0이 아닌 엔드포인트에서 줄이는 것으로 인한 스펙트럼 누출을 제거합니다.

### 단계 3: STFT 크기가

```python
def stft_magnitude(signal, frame_len=400, hop=160):
    win = hann(frame_len)
    frames = frame(signal, frame_len, hop)
    return [magnitudes(dft([w * s for w, s in zip(win, f)])) for f in frames]
```

생산 용도는`torch.stft`또는`librosa.stft`(FFT 지원, 벡터화된) 이 루프는 교육적이며,`code/main.py`- 그래

### 단계 4: mel filterbank

```python
def hz_to_mel(f):
    return 2595.0 * math.log10(1.0 + f / 700.0)

def mel_to_hz(m):
    return 700.0 * (10 ** (m / 2595.0) - 1)

def mel_filterbank(n_mels, n_fft, sr, fmin=0, fmax=None):
    fmax = fmax or sr / 2
    mels = [hz_to_mel(fmin) + (hz_to_mel(fmax) - hz_to_mel(fmin)) * i / (n_mels + 1)
            for i in range(n_mels + 2)]
    hzs = [mel_to_hz(m) for m in mels]
    bins = [int(h * n_fft / sr) for h in hzs]
    fb = [[0.0] * (n_fft // 2 + 1) for _ in range(n_mels)]
    for m in range(n_mels):
        for k in range(bins[m], bins[m + 1]):
            fb[m][k] = (k - bins[m]) / max(1, bins[m + 1] - bins[m])
        for k in range(bins[m + 1], bins[m + 2]):
            fb[m][k] = (bins[m + 2] - k) / max(1, bins[m + 2] - bins[m + 1])
    return fb
```

80mels, 08kHz를 `n_fft=400``(80, 201)`매트릭스`(n_frames, 201)`STFT 크기는 횡포로 얻으려면`(n_frames, 80)`멜 스펙트럼

### 단계 5: 로그 메일

```python
def log_mel(mel_spec, eps=1e-10):
    return [[math.log(max(v, eps)) for v in frame] for frame in mel_spec]
```

일반적인 대안: `librosa.power_to_db`(표준상규화된 dB)`10 * log10(power + eps)`.Whisper는 더 많은 클립을 사용하며 + 일상적인 것을 정상화합니다 (Whisper's  참조)`log_mel_spectrogram`)

### 단계 6: MFCC

```python
def dct_ii(x, n_coeffs):
    N = len(x)
    return [
        sum(x[n] * math.cos(math.pi * k * (2 * n + 1) / (2 * N)) for n in range(N))
        for k in range(n_coeffs)
    ]
```

각 로그멜 프레임에 DCT를 적용하고 첫 13 개의 계수를 유지하십시오. 이것은 MFCC 매트릭스입니다. 첫 번째 계수는 일반적으로 떨어집니다 (전반 에너지를 암호화합니다).

## 사용 하 고

2026년 스택:

| Task | Features |
|------|----------|
| ASR (Whisper, Parakeet, SeamlessM4T) | 80 log-mels, 10 ms hop, 25 ms window |
| TTS acoustic model (VITS, F5-TTS, Kokoro) | 80 mels, 5–12 ms hop for fine temporal control |
| Audio classification (AST, PANNs, BEATs) | 128 log-mels, 10 ms hop |
| Speaker embedding (ECAPA-TDNN, WavLM) | 80 log-mels or raw-waveform SSL |
| Music (MusicGen, Stable Audio 2) | EnCodec discrete tokens (not mels) |
| Keyword spotting | 40 MFCCs for tiny devices |

엄지손가락 규칙:**if you are not working on music, start with 80 log-mels.**증거의 부담은 모든 경각심을 짊어지고 있습니다.

## 2026 년에도 여전히 선박되는 함정이

- **Mel count mismatch.**80mels의 훈련, 128mels의 추론, 침묵의 실패, 두 끝의 특징 모양을 기록
- **Sample-rate mismatch upstream.**22.05 kHz에서 계산된 Mels는 16 kHz에서 다르게 보입니다.
- **dB vs log.**Whisper는 DB-mel가 아닌 로그메일을 예상합니다. HF 파이프라인은 자동으로 감지합니다. 사용자 지정 코드는 그렇지 않습니다.
- **Normalization drift.**훈련 중에 외출률 정상화, 추론 과정에서 글로벌 정상화. WER를 두 배로 하는 생산 오류.
- **Leakage from padding.**클립의 끝을 무상 은 후속 프레임에 평평한 스펙트럼을 생성합니다. 은 대칭적이거나 복제합니다.

## 선박

`outputs/skill-feature-extractor.md`. 기술은 특정 모델 목표에 대한 기능 유형, 멜 카운트, 프레임/홉 및 정상화를 선택합니다.

## 운동

1. **Easy.**달아`code/main.py`. 그것은  (주파수 스캔 200 → 4000 Hz) 를 합성하고 프레임 당 argmax mel bin을 인쇄합니다.
2. **Medium.**다시 `n_mels``{40, 80, 128}`그리고`frame_len``{200, 400, 800}`시간축을 가로지르는 날카로운 최고역폭을 측정하세요.
3. **Hard.**시행`power_to_db`그리고 AudioMNIST에서 작은 CNN 분류기의 ASR 정확도를 비교하여 (a) 원료 로그멜, (b) dB멜을 사용하여`ref=max`, (c) MFCC-13 + 델타 + 델타-델타.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Frame | A slice | 25 ms chunk of waveform fed to one FFT. |
| Hop | Stride | Samples between consecutive frames; 10 ms is ASR default. |
| Window | Hann/Hamming thing | Point-wise multiplier that tapers the frame edges to zero. |
| STFT | Spectrogram generator | Framed + windowed FFT; yields time × frequency matrix. |
| Mel | Warped frequency | Log-perception scale; `m = 2595·log10(1 + f/700)`. |
| Filterbank | The matrix | Triangular filters that project STFT onto mel bins. |
| Log-mel | Whisper's input | `log(mel_spec + eps)`; standardized in 2026. |
| MFCC | Old-school feature | DCT of log-mel; 13 coeffs, decorrelated. |

## 더 많은 읽기

- [Davis, Mermelstein (1980). Comparison of parametric representations for monosyllabic word recognition](https://ieeexplore.ieee.org/document/1163420) MFCC 논문
- [Stevens, Volkmann, Newman (1937). A Scale for the Measurement of the Psychological Magnitude Pitch](https://pubs.aip.org/asa/jasa/article-abstract/8/3/185/735757/) 원래의 멜 스칼라
- [OpenAI — Whisper source, log_mel_spectrogram](https://github.com/openai/whisper/blob/main/whisper/audio.py) 참조 실시를 읽어보세요.
- [librosa feature extraction docs](https://librosa.org/doc/latest/api/feature.html) 참고`mfcc``melspectrogram`, 그리고 홉/윈더
- [NVIDIA NeMo — audio preprocessing](https://docs.nvidia.com/deeplearning/nemo/user-guide/docs/en/main/asr/asr_all.html#featurizers) 파라키트+캐나리 모델의 생산 규모 파이프라인
