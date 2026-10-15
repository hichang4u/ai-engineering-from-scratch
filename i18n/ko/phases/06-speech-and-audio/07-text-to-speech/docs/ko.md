# 문자-언어 (TTS)  타코트로에서 F5 및 코코로

> ASR는 음성으로 텍스트를 변환하고, TTS는 텍스트로 음성으로 텍스트를 변환한다. 2026 스택은 세 부분으로 구성되어 있다. 텍스트 → 토큰, 토큰 → mel, mel → 파형 형태. 각 부분은 노트북에 맞게 기본 모델이 있다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 09 (Seq2Seq), Phase 7 · 05 (Full Transformer)
**Time:** ~75 minutes

## 문제

당신은 문자열을 가지고 있습니다: "마침 6시에 식물을 물을 내도록 상기시켜 주십시오". 당신은 자연스러운 소리, 올바른 프로소디 (파우즈, 스트레스) 를 가진 3초짜리 오디오 클립이 필요합니다. 올바른 음성으로 "식물"을 발음하고, 라이브 음성 보조기 CPU에서 300 ms 이하에서 실행됩니다. 또한 목소리를 교환하고 코드 스위치 입력 ("마침 6시에 기억하십시오, daijoubu?") 를 처리하고 이름을 부끄러워하지 않습니다.

현대 TTS 파이프 라인은 다음과 같습니다.

1. **Text frontend.**텍스트 (데이터, 숫자, 이메일) 를 정상화하고, 음명이나 하위 단어 토큰으로 변환하고, 프로소디 기능을 예측합니다.
2. **Acoustic model.**텍스트 → 멜 스펙트로그램. 타코트로 2 (2017), 패스트스피치 2 (2020), VITS (2021), F5-TTS (2024), 코코로 (2024).
3. **Vocoder.**Mel → 파형. WaveNet (2016), WaveRNN, HiFi-GAN (2020), BigVGAN (2022), 2024+에 신경 코덱 보코더

2026년, 음향 + 보코더는 끝에서 끝까지 퍼져나가는 모델과 흐름에 맞는 모델로 분해됩니다. 하지만 세 부분의 정신적 모델은 여전히 디버깅을 할 수 있습니다.

## 개념

![Tacotron, FastSpeech, VITS, F5/Kokoro side-by-side](../assets/tts.svg)

**Tacotron 2 (2017).**Seq2seq: char-embedding → BiLSTM encoder → 위치 감성적 관심 → autoregressive LSTM 디코더는 mel 프레임을 발산한다. 느린 (AR), 긴 텍스트에서 흔들리는. 여전히 기본 라인으로 인용된다.

**FastSpeech 2 (2020).**자율적 인격차가 없습니다. 시간 예측기는 각 음향이 얻는 mel 프레임의 출력을 나타냅니다. 1 패스, 타코트로보다 10x 더 빠르다. 약간의 자연성을 잃습니다 (모노톤적 조율) 하지만 모든 곳에 배가됩니다.

**VITS (2021).**합작으로 코더 + 흐름 기반 수명 + 하이파이-GAN 보코더를 변동 추론으로 끝에서 끝으로 훈련합니다. 고품질, 단일 모델. 주류 오픈소스 TTS 20222024. 변종: YourTTS (다 화자 제로샷), XTTS v2 (2024, Coqui).

**F5-TTS (2024).**흐름 일치에 대한 디스푸시온 트랜스포머 자연 프로소디, 0 샷 음성 클론링 5 초 참조 오디오. 2026 오픈 소스 TTS 순위표 상위. 335M 파라마.

**Kokoro (2024).**작은 (82M), CPU 실행, 실시간 사용을위한 최고의 영어 TTS. 폐쇄적 어휘 영어만, apache-2.0.

**OpenAI TTS-1-HD, ElevenLabs v2.5, Google Chirp-3.**상업적 최신 기술. ElevenLabs v2.5 감정 태그 ("[시끄러졌다]", "[웃음]") 및 캐릭터 목소리는 2026년 오디오북 제작에 지배적이다.

### Vocoder 진화

| Era | Vocoder | Latency | Quality |
|-----|---------|---------|---------|
| 2016 | WaveNet | offline only | SOTA at release |
| 2018 | WaveRNN | ~realtime | good |
| 2020 | HiFi-GAN | 100× realtime | near-human |
| 2022 | BigVGAN | 50× realtime | generalizes across speakers/langs |
| 2024 | SNAC, DAC (neural codecs) | integrated with AR models | discrete tokens, bit-efficient |

2026년까지 대부분의 "TTS" 모델은 텍스트에서 파형으로 끝으로 끝으로 진행됩니다. mel 스펙트럼은 내부 표현입니다.

### 평가

- **MOS (Mean Opinion Score).**1~5의 규모, 크라우드 소스. 여전히 금 표준, 고통스럽게 느린.
- **CMOS (Comparative MOS).**A와 B의 선호도, 각 해석에 대한 신뢰 간격이 더 좁습니다.
- **UTMOS, DNSMOS.**레퍼런스 없는 신경성 MOS 예측기, 순위표에 사용된다.
- **CER (Character Error Rate) via ASR.**Whisper를 통해 TTS 출력을 실행하고 입력 텍스트에 대한 CER를 계산하고 이해력을 위한 프록시
- **SECS (Speaker Embedding Cosine Similarity).**음성 복제 품질

2026번의 LibriTTS 테스트 클린 번호:

| Model | UTMOS | CER (via Whisper) | Size |
|-------|-------|-------------------|------|
| Ground truth | 4.08 | 1.2% | — |
| F5-TTS | 3.95 | 2.1% | 335M |
| XTTS v2 | 3.81 | 3.5% | 470M |
| VITS | 3.62 | 3.1% | 25M |
| Kokoro v0.19 | 3.87 | 1.8% | 82M |
| Parler-TTS Large | 3.76 | 2.8% | 2.3B |

```figure
sp-tts-stack
```

## 건설 해

### 단계 1: 입력 음향을

```python
from phonemizer import phonemize
ph = phonemize("Hello world", language="en-us", backend="espeak")
# 'həloʊ wɜːld'
```

Phonemes는 보편적인 다리입니다. VITS 수준 수준 이하의 어떤 것에나 원본 텍스트를 공급하지 마십시오.

### 단계 2: Kokoro (2026 CPU 기본) 를 실행

```python
from kokoro import KPipeline
tts = KPipeline(lang_code="a")  # "a" = American English
audio, sr = tts("Please remind me to water the plants at 6 pm.", voice="af_bella")
# audio: float32 tensor, sr=24000
```

오프라인에서 실행되고, 단일 파일, 82M 파램

### 단계 3: 음성 복제로 F5-TTS를 실행

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="my_voice_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please remind me to water the plants.",
)
```

5초짜리 참조 클립 + 그 표본을 보내 F5는 프로소디와 템브를 복제합니다.

### 단계 4: 처음부터 HiFi-GAN 보코더

커서 스크립트에 들어갈 수 없을 정도로 크지만, 모양은

```python
class HiFiGAN(nn.Module):
    def __init__(self, mel_channels=80, upsample_rates=[8, 8, 2, 2]):
        super().__init__()
        # 4 upsample blocks, total 256x to go from mel-rate to audio-rate
        ...
    def forward(self, mel):
        return self.blocks(mel)  # -> waveform
```

훈련: 적대적 (단 창의 차별) + mel 스펙트럼 재구성 손실 + 기능 일치 손실. 상품화  예전에 훈련된 체크포인트 사용 `hifi-gan`repo 또는 nvidia-neMo

### 단계 5: 전체 파이프라인 (신명 코드)

```python
text = "Please remind me at 6 pm."
phones = phonemize(text)
mel = acoustic_model(phones, speaker=alice)      # [T, 80]
wav = vocoder(mel)                                # [T * 256]
soundfile.write("out.wav", wav, 24000)
```

## 사용 하 고

2026년 스택:

| Situation | Pick |
|-----------|------|
| Real-time English voice assistant | Kokoro (CPU) or XTTS v2 (GPU) |
| Voice cloning from 5 s reference | F5-TTS |
| Commercial character voices | ElevenLabs v2.5 |
| Audiobook narration | ElevenLabs v2.5 or XTTS v2 + fine-tune |
| Low-resource language | Train VITS on 5–20 h target-lang data |
| Expressive / emotion tags | ElevenLabs v2.5 or StyleTTS 2 fine-tune |

2026년 오픈소스 리더: **F5-TTS for quality, Kokoro for efficiency**역사학자인 이상 타코트로너를 찾아서는 안 돼

## 함정

- **No text normalizer.**"드록 스미스"는 "닥터" 또는 "드라이브"라고 읽습니다? "2026"는 "이십십십 여섯" 또는 "두 무제 두 여섯"라고 읽습니다?
- **OOV proper nouns.**"Ghumare" → "ghyu-mair"? 알려지지 않은 토큰을 위한 회전 그래프메트-포네마 모델을 보내십시오.
- **Clipping.**보코더 출력은 거의 클립이 되지 않지만, 추론에서 미일 스케일 부합은 ±1.0을 초과할 수 있습니다. 항상 `np.clip(wav, -1, 1)`- 그래
- **Sample-rate mismatch.**코코로 출력은 24kHz이고 하류 파이프라인은 16kHz → 재 샘플을 예상하거나 별명을 얻습니다.

## 선박

`outputs/skill-tts-designer.md`. 특정 음성, 지연 및 언어 목표에 대한 TTS 파이프라인을 설계하십시오.

## 운동

1. **Easy.**달아`code/main.py`장난감 사사에서 음음 사전을 만들고 음음마다의 기간을 추정하고 가짜 "메일" 스케줄을 인쇄합니다.
2. **Medium.**코코로를 설치하고 같은 문장을 음성으로 합성하세요`af_bella`그리고`am_adam`- 음향의 기간과 주관적 질을 비교해 보세요.
3. **Hard.**5초짜리 참조 클립을 녹음하고 F5-TTS를 사용하여 복제합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Phoneme | Sound unit | Abstract sound class; 39 in English (ARPABet). |
| Duration predictor | How long each phoneme lasts | Non-AR model output; integer frames per phoneme. |
| Vocoder | Mel → waveform | Neural net mapping mel-spec to raw samples. |
| HiFi-GAN | Standard vocoder | GAN-based; dominant 2020–2024. |
| MOS | Subjective quality | 1–5 mean opinion score from human raters. |
| SECS | Voice-clone metric | Cosine similarity between target and output speaker embedding. |
| F5-TTS | 2024 open-source SOTA | Flow-matching diffusion; zero-shot cloning. |
| Kokoro | CPU English leader | 82M-param model, Apache 2.0. |

## 더 많은 읽기

- [Shen et al. (2017). Tacotron 2](https://arxiv.org/abs/1712.05884) seq2seq의 기본 라인
- [Kim, Kong, Son (2021). VITS](https://arxiv.org/abs/2106.06103) 끝에서 끝으로 흐르는
- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) 현재 오픈소스 SOTA
- [Kong, Kim, Bae (2020). HiFi-GAN](https://arxiv.org/abs/2010.05646)2026년에 여전히 발송되는 보코더
- [Kokoro-82M on HuggingFace](https://huggingface.co/hexgrad/Kokoro-82M) 2024 CPU 친화적인 영어 TTS.
