# 오디오 기본  파동 형태, 샘플링, 푸리에 변환

> 파동 형태는 원시 신호입니다. 스펙트로그램은 표현입니다. Mel 특징은 ML 친화적인 형태입니다. 모든 현대 ASR 및 TTS 파이프라인이 이 계단을 걷고, 첫 번째 단계는 샘플링과 푸리에어를 이해하는 것입니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Vectors & Matrices), Phase 1 · 14 (Probability Distributions)
**Time:** ~45 minutes

## 문제

마이크 는 압력 대 시간 신호 를 생성 한다. 신경망 은 텐서 를 소비 한다. 그 사이 에는 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음 음

음성 시스템의 모든 버그는 세 가지 질문 중 하나에 대한 것입니다.

1. 샘플 데이터는 어떤 비율로 기록되었는데, 모델은 무엇을 기대합니까?
2. 신호가 익명으로 알려졌나요?
3. 원본이나 주파수 표현을 이용해서 작동하시나요?

이 부분을 제대로 해내면 나머지 6단계도 잘 처리할 수 있습니다.

## 개념

![Waveform, sampling, DFT, and frequency bins visualized](../assets/audio-fundamentals.svg)

**Waveform.**1차원형 플롯 배열`[-1.0, 1.0]`. 샘플 번호에 의해 지표. 초로 변환하려면 샘플 속도로 나눌 수 있습니다: `t = n / sr`16kHz의 10초 클립은 16만개의 플롯이 있습니다.

**Sampling rate (sr).**시속 샘플의 수. 2026년 일반적인 비율:

| Rate | Use |
|------|-----|
| 8 kHz | Telephony, legacy VOIP. Nyquist at 4 kHz kills consonants. Avoid for ASR. |
| 16 kHz | ASR standard. Whisper, Parakeet, SeamlessM4T v2 all consume 16 kHz. |
| 22.05 kHz | TTS vocoder training for older models. |
| 24 kHz | Modern TTS (Kokoro, F5-TTS, xTTS v2). |
| 44.1 kHz | CD audio, music. |
| 48 kHz | Film, pro audio, high-fidelity TTS (VALL-E 2, NaturalSpeech 3). |

**Nyquist-Shannon.**`sr`까지의 주파수를 명확하게 나타낼 수 있습니다`sr/2`- `sr/2`경계 는 * Nyquist 주파수 이다. Nyquist 위 에너지는 * aliased *  하위 주파수 로 접어  신호 를 손상 시키게 된다.

**Bit depth.**16 비트 PCM (인터넷 16번, 범위 ±32,767) 는 보편적 교환 형식이다. 음악에 24 비트, 내부 DSP에 32 비트 부동. 라이브러리`soundfile`int16를 읽으세요 하지만 float32 배열을 `[-1, 1]`- 그래

**Fourier Transform.**모든 유한 신호는 서로 다른 주파수에서 시노소이드의 합입니다.`N`샘플`N`복잡한 계수  주파수 칸당 1개. `bin k`주파수 지도`k · sr / N`Hz. 거리는 그 주파수에서 진도이고 각은 단계입니다.

**FFT.**빠른 푸리에 변환: a `O(N log N)`DFT의 알고리즘은`N`모든 오디오 라이브러리는 16 kHz의 1024 샘플 FFT는 15.6 Hz 해상도의 08 kHz를 아우르는 512 개의 사용 가능한 주파수 버그를 제공합니다.

**Framing + window.**우리는 전체 클립을 FFT하지 않습니다. 우리는 그것을 초복된 *프레임으로* (일반적으로 25 ms와 10 ms 도약) 나눌 수 있습니다. 각 프레임을 창 기능 (한, 해밍) 로 곱하여 가장자리 불순속성을 제거하고, 다음 각 프레임을 FFT 합니다. 이것은 짧은 시간 푸리에 변환 (STFT) 이다. 수업 02은 여기에서 시작됩니다.

```figure
mel-scale
```

## 건설 해

### 단계 1: 클립을 읽고 파형을 그려보세요

`code/main.py`STDlib만 사용 합니다`wave`시범적인 의존도 없이 유지하기 위한 모듈입니다.`soundfile`또는`torchaudio.load`(두 가지 모두 반환 `(waveform, sr)`두 개의

```python
import soundfile as sf
waveform, sr = sf.read("clip.wav", dtype="float32")  # shape (T,), sr=int
```

### 단계 2: 첫 번째 원칙에서 시노파를 합성한다

```python
import math

def sine(freq_hz, sr, seconds, amp=0.5):
    n = int(sr * seconds)
    return [amp * math.sin(2 * math.pi * freq_hz * i / sr) for i in range(n)]
```

440 Hz 시노스 (콘서트 A) 16 kHz에서 1초 동안 16,000 파운드를 기록합니다.`wave.open(..., "wb")`16비트 PCM 코딩을 사용해서

### 단계 3: DFT를 손으로 계산한다

```python
def dft(x):
    N = len(x)
    out = []
    for k in range(N):
        re = sum(x[n] * math.cos(-2 * math.pi * k * n / N) for n in range(N))
        im = sum(x[n] * math.sin(-2 * math.pi * k * n / N) for n in range(N))
        out.append((re, im))
    return out
```

`O(N²)` 벌금`N=256`정확한 내용을 확인하기 위해 실제 오디오에 쓸모가 없습니다. 실제 코드 호출`numpy.fft.rfft`또는`torch.fft.rfft`- 그래

### 4단계: 지배적 주파수를 찾아

대도 최고 지표`k_star`주파수 지도`k_star * sr / N`440 Hz 시노스에서 실행하면 에서 최고를 반환해야 합니다`440 * N / sr`- 그래

### 5단계: 위명 표시

7 kHz 시노스 샘플 10 kHz (Nyquist = 5 kHz) 에 7 kHz 음색이 Nyquist 위와 `10 − 7 = 3 kHz`FFT 최고가 3kHz에서 나타납니다. 이것은 고전적인 별명 디모이고 모든 DAC/ADC가 벽돌 벽으로 낮은 통과 필터를 사용하는 이유입니다.

## 사용 하 고

2026년에 실제로 배송할 수 있는 스택:

| Task | Library | Why |
|------|---------|-----|
| Read/write WAV/FLAC/OGG | `soundfile` (libsndfile wrapper) | Fastest, stable, returns float32. |
| Resample | `torchaudio.transforms.Resample` or `librosa.resample` | Correct anti-aliasing built in. |
| STFT / Mel | `torchaudio` or `librosa` | GPU-friendly; PyTorch ecosystem. |
| Real-time streaming | `sounddevice` or `pyaudio` | Cross-platform PortAudio bindings. |
| Inspect a file | `ffprobe` or `soxi` | CLI, fast, reports sr/channels/codec. |

결정 규칙: **match sample rate before you match anything else**16kHz 모노 플로트32를 예상하고 44.1kHz 스테레오를 전달하면 모델 버그처럼 보이는 쓰레기가 나올 겁니다

## 선박

`outputs/skill-audio-loader.md`이 기술은 오디오 입력이 하류 모델의 기대에 부합하는지 확인하고 그렇지 않은 경우에도 올바르게 샘플링하는 데 도움이됩니다.

## 운동

1. **Easy.**1초 동안 220 Hz + 440 Hz + 880 Hz의 혼합을 16 kHz에서 합성합니다. DFT를 실행합니다. 예상되는 버섯에서 세 개의 피크를 확인합니다.
2. **Medium.**3초 WAV의 음성 48kHz를 기록하고 16kHz로 샘플을 내려받아`torchaudio.transforms.Resample`(반지식) 로, 다음으로 16kHz에 순진한 십분화 (제3 샘플마다) 를 사용하여 FFT 둘 다.
3. **Hard.**STFT를 처음부터만 사용해서 만들 수 있습니다`math`그리고 단계 3에서 DFT를  크기가 400, hop 160, Hann 창.`matplotlib.pyplot.imshow`이 사진은 레슨 02의 스펙트럼입니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Sample rate | How many samples per second | Frequency in Hz at which the ADC measures the signal. |
| Nyquist | The max frequency you can represent | `sr/2`; energy above it aliases back down. |
| Bit depth | Resolution of each sample | `int16` = 65,536 levels; `float32` = 24-bit precision in `[-1, 1]`. |
| DFT | The Fourier transform for sequences | `N` samples → `N` complex frequency coefficients. |
| FFT | The fast DFT | `O(N log N)` algorithm requiring `N` = power of 2. |
| Bin | Frequency column | `k · sr / N` Hz; resolution = `sr / N`. |
| STFT | Spectrogram under the hood | Framed + windowed FFT over time. |
| Aliasing | Weird frequency ghosts | Energy above Nyquist mirroring down to lower bins. |

## 더 많은 읽기

- [Shannon (1949). Communication in the Presence of Noise](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf) 샘플링 정리를 뒷받침하는 논문
- [Smith — The Scientist and Engineer's Guide to Digital Signal Processing](https://www.dspguide.com/ch8.htm) 무료, 정통적인 DSP 교과서
- [librosa docs — audio primer](https://librosa.org/doc/latest/auto_tutorials/index.html) 코드와 함께 실행 가능한
- [Heinrich Kuttruff — Room Acoustics (6th ed.)](https://www.taylorfrancis.com/books/mono/10.1201/9781315372150/room-acoustics-heinrich-kuttruff) 실제 세계 오디오가 깨끗한 시노세이드가 아닌 이유를 설명합니다.
- [Steve Eddins — FFT Interpretation notebook](https://blogs.mathworks.com/steve/2020/03/30/fft-spectrum-and-spectral-densities/) 10분 만에 빈도관 인투이션이 정리되었습니다.
