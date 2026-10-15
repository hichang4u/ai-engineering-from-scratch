# 신경 오디오 코덱  엔코덱, SNAC, 미미, DAC 및 의미-음파 분할

> 2026 오디오 생성은 거의 모든 토큰입니다. 엔코덱, SNAC, 미미, DAC는 연속적인 파형 형태를 트랜스포머가 예측할 수 있는 분해 순서로 변환합니다. 의미적 대 음향 토큰 분할  첫 번째 코드북은 의미적, 휴식  음향으로 음향으로 은 트랜스포머 이후 가장 중요한 건축적 변화입니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 10 · 11 (Quantization), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 문제

언어 모델은 디스크릿 토큰에서 작동합니다. 오디오는 연속적입니다. 연설 / 음악에 대한 LLM 스타일 모델이 원한다면 MusicGen, Moshi, Sesame CSM, VibeVoice, Orpheus**neural audio codec**: 소음들을 작은 토큰 단어들로 분별하는 학습된 코더와 파동 형태를 재구성하는 일치하는 디코더

두 가족이 생겨났습니다.

1. **Reconstruction-first codecs** 엔코덱, DAC. 인식적인 오디오 품질을 최적화합니다. 토큰은 "음파"입니다. 스피커 정체성, 템브러, 배경 소음 등 모든 것을 캡처합니다.
2. **Semantic-first codecs** 미미 (큐타이), 스피치토케니저. 언어/음악 콘텐츠를 코딩하는 첫 번째 코드북을 강요합니다.

2024~2026 시점에서의 통찰력:**a pure reconstruction codec gives you blurry speech when you try to generate from text.**코덱 토큰을 통해 LLM는 동일한 코드북에서 언어 구조와 음향 구조를 모두 배워야 합니다. 이는 확장되지 않습니다. 그들을 분리하는  의미 코드북 0, 음향 코드북 1-N 는 모시와 세사임 CSM를 작동시키는 것입니다.

## 개념

![Four codec landscape: EnCodec, DAC, SNAC (multi-scale), Mimi (semantic+acoustic)](../assets/codec-comparison.svg)

### 핵심 트릭: 잔재 벡터 양분화 (RVQ)

하나의 큰 코드북 (좋은 품질을 위해 수백만 개의 코드를 필요로 할 것) 대신, 모든 현대 오디오 코덱은 사용합니다.**RVQ**: 작은 코드북의 카스카드. 첫 번째 코드북은 코드더 출력을 양자화하고, 두 번째는 잔류를 양자화한다.$1024^8 = 10^{24}$- 그래

추론 시, 디코더는 재구성하기 위해 프레임에 따라 선택한 모든 코드를 합합니다.

### 2026년에 중요한 4개의 코덱

**EnCodec (Meta, 2022).**기본 라인. 파형에 대한 엔코더-독호, RVQ 병목. 24 kHz, 32 코드북이 가능, 기본 4 코드북 @ 1.5 kbps. 사용 `1D conv + transformer + 1D conv`건축물, 뮤직겐에서 사용되었습니다.

**DAC (Descript, 2023).**L2 표준화된 코드북, 주기적인 활성화 기능, 향상된 손실. 어떤 오픈 코덱의 가장 높은 재구성 충실성  12 개의 코드북과 함께 원래 언어에서 구별되지 않는 경우. 44.1 kHz 풀밴드.

**SNAC (Hubert Siuzdak, 2024).**다중 규모 RVQ                                                                                                                                                                                                                                                             

**Mimi (Kyutai, 2024).**2026 게임 변경기 12.5 Hz 프레임 속도 (외래 낮은), 8 코드북 @ 4.4 kbps. 코드북 0**distilled from WavLM** WavLM의 음성 내용 특징을 예측하는 훈련을 받았습니다. 코드북 1~7은 음향 잔재입니다. 이 분단은 모시 (강좌 15) 와 세사임 CSM를 작동시킵니다.

### 프레임 속도 언어 모델링에 중요한 요소

낮은 프레임 속도는 = 짧은 순서 = 더 빠른 LM.

| Codec | Frame rate | 1 s = N frames | Good for |
|-------|-----------|----------------|---------|
| EnCodec-24k | 75 Hz | 75 | music, general audio |
| DAC-44.1k | 86 Hz | 86 | high-fidelity music |
| SNAC-24k (coarse) | ~12 Hz | 12 | AR-LM efficient |
| Mimi | 12.5 Hz | 12.5 | streaming speech |

12.5 Hz에서 10초의 발음은 125개의 코덱 프레임에 불과합니다.

### 의미와 음향의 토큰

```
frame_t → [semantic_token_t, acoustic_token_0_t, acoustic_token_1_t, ..., acoustic_token_6_t]
```

- **Semantic token (codebook 0 in Mimi).** 음음, 단어, 내용, 보전 예측 손실을 통해 WavLM에서 유출된
- **Acoustic tokens (codebooks 1-7).**어 어, 스피커 아이덴티티, 프로소디, 배경 소음, 세밀한 세부사항

AR LM는 먼저 의미 토큰을 예측한다 ( 텍스트에 조건), 그리고 음향 토큰을 예측한다 (성어 + 스피커 참조에 조건). 이러한 요소분열은 현대 TTS가 음향을 클론할 수 있는 이유입니다.

### 2026 재건 품질 (비트당 시, 낮은 비트 속도 더 좋습니다)

| Codec | Bitrate | PESQ | ViSQOL |
|-------|---------|------|--------|
| Opus-20kbps | 20 kbps | 4.0 | 4.3 |
| EnCodec-6kbps | 6 kbps | 3.2 | 3.8 |
| DAC-6kbps | 6 kbps | 3.5 | 4.0 |
| SNAC-3kbps | 3 kbps | 3.3 | 3.8 |
| Mimi-4.4kbps | 4.4 kbps | 3.1 | 3.7 |

Opus 같은 전통적인 코덱은 여전히 인식 품질에 대해 비트 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 신경 코덱은 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당 당**discrete tokens**(오퍼스가 생산하지 않는)**generative-model quality**(LM가 그 토큰을 어떻게 할 수 있는지)

```figure
rvq-codec-cascade
```

## 건설 해

### 단계 1: EnCodec로 코딩

```python
from encodec import EncodecModel
import torch

model = EncodecModel.encodec_model_24khz()
model.set_target_bandwidth(6.0)  # kbps

wav = torch.randn(1, 1, 24000)
with torch.no_grad():
    encoded = model.encode(wav)
codes, scale = encoded[0]
# codes: (1, n_codebooks, n_frames), dtype=int64
```

`n_codebooks=8`6 kbps에, 각 코드도 0-1023 (10비트) 입니다.

### 단계 2: 재구성 해독 및 측정

```python
with torch.no_grad():
    wav_recon = model.decode([(codes, scale)])

from torchaudio.functional import compute_deltas
import torch.nn.functional as F

mse = F.mse_loss(wav_recon[:, :, :wav.shape[-1]], wav).item()
```

### 단계 3: 의미-음파 분화 (미미 스타일)

```python
from moshi.models import loaders
mimi = loaders.get_mimi()

with torch.no_grad():
    codes = mimi.encode(wav)  # shape (1, 8, frames@12.5Hz)

semantic = codes[:, 0]
acoustic = codes[:, 1:]
```

의미 코드북 0은 WavLM에 맞춘다. 문자-유어 변환기를 훈련시킬 수 있습니다. 직-음향으로 가는 것보다 훨씬 작은 어휘를 훈련시킬 수 있습니다.

### 단계 4: 코덱 토큰에 대한 AR LM가 작동하는 이유

미미의 12.5 Hz × 8 코드북에서 10 초의 음성 클립을 위해:

```math
N_{\text{tokens}} = 10 \times 12.5 \times 8 = 1000 \text{ tokens}
```

1000 토큰은 트랜스포머의 비약적인 맥락이다. 256M 파라미터 트랜스포머는 현대 GPU에서 밀리초에 10초의 연설을 생성할 수 있다.

## 사용 하 고

지도 문제 → 코덱:

| Task | Codec |
|------|-------|
| General music generation | EnCodec-24k |
| Highest-fidelity reconstruction | DAC-44.1k |
| AR LM over speech (TTS) | SNAC or Mimi |
| Streaming full-duplex speech | Mimi (12.5 Hz) |
| Sound-effect library with text | EnCodec + T5 condition |
| Fine-grained audio editing | DAC + inpainting |

엄지손가락 규칙:**if you're building a generative model, start with Mimi or SNAC. If you're building a compression pipeline, use Opus.**

## 함정

- **Too many codebooks.**코드북을 추가하면 선형적으로 충실성을 높이는 것 같지만 LM 순서 길이도 선형적으로 증가합니다. 8-12에서 멈춰요.
- **Frame-rate mismatch.**12.5Hz의 LM 훈련 미미가 50Hz의 EnCodec에 미미조정을 하면 침묵으로 실패합니다.
- **Assuming all codebooks equal.**미미의 코드북 0은 내용물을 가지고 있지만, 그것을 잃는 것은 이해력을 파괴합니다. 코드북 7을 잃는 것은 거의 눈에 띄지 않습니다.
- **Using reconstruction quality as the only metric.**코덱은 훌륭한 재구성을 가질 수 있지만 의미 구조가 좋지 않으면 LM 기반의 세대에게는 쓸모가 없습니다.

## 선박

`outputs/skill-codec-picker.md`특정 생성 또는 압축 작업에 대한 코덱을 선택하십시오.

## 운동

1. **Easy.**달아`code/main.py`. 장난감 스칼라 + 잔여 양자계를 구현하고 코드북을 추가할 때 재구성 오류를 측정합니다.
2. **Medium.**설치`encodec`그리고 1, 4, 8, 32개의 코드북을 긴 연설 클립에 비교해 보세요. PESQ 또는 MSE와 비트레이트를 그려보세요.
3. **Hard.**미미를 로드하세요. 클립을 암호화하세요. 코드북 0을 무작위 정수들로 교체하세요. 디코드하세요. 다음 코드북 7을 비슷한 방식으로 교체하세요. 두 가지 부패를 비교하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| RVQ | Residual quantization | Cascade of small codebooks; each quantizes the previous residual. |
| Frame rate | Codec speed | How many token-frames per second. Lower = faster LM. |
| Semantic codebook | Codebook 0 (Mimi) | Codebook distilled from SSL features; encodes content. |
| Acoustic codebooks | Everything else | Timbre, prosody, noise, fine detail. |
| PESQ / ViSQOL | Perceptual quality | Objective metrics correlating with MOS. |
| EnCodec | Meta codec | The RVQ baseline; used by MusicGen. |
| Mimi | Kyutai codec | 12.5 Hz frame rate; semantic-acoustic split; powers Moshi. |

## 더 많은 읽기

- [Défossez et al. (2023). EnCodec](https://arxiv.org/abs/2210.13438) RVQ의 기본 기준
- [Kumar et al. (2023). Descript Audio Codec (DAC)](https://arxiv.org/abs/2306.06546) 최고 충성도가 열려 있습니다.
- [Siuzdak (2024). SNAC](https://arxiv.org/abs/2410.14411) 다중 규모 RVQ
- [Kyutai (2024). Mimi codec](https://kyutai.org/codec-explainer) 의미-음파 분화, 웨블LM 정유
- [Borsos et al. (2023). AudioLM](https://arxiv.org/abs/2209.03143) 두 단계의 의미/음악 패러다임
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) 원래 스트리밍 가능한 RVQ 코덱.
