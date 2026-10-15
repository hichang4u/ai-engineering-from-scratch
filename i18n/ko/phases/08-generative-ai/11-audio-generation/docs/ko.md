# 오디오 세대

> 오디오는 16-48 kHz의 1D 신호입니다. 5초의 클립은 80-240k 샘플입니다. 트랜스포머가 그 순서로 직접적으로 관람하지 않습니다. 2026 년 모든 생산 오디오 모델의 솔루션은 동일합니다. 신경 코덱 (Encodec, SoundStream, DAC) 은 오디오를 50-75 Hz에서 분리된 토큰으로 압축하고 트랜스포머 또는 전파 모델은 토큰을 생성합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Audio Features), Phase 6 · 04 (ASR), Phase 8 · 06 (DDPM)
**Time:** ~45 minutes

## 문제

오디오 생성 작업 3가지:

1. **Text-to-speech.**텍스트를 제공하면 음성을 생성하십시오. 청정 음성은 좁은 대역이며 강력한 음향 구조를 가지고 있습니다. 트랜스포머-오버 토큰으로 잘 해결됩니다. VALL-E (마이크로소프트), NaturalSpeech 3, ElevenLabs, OpenAI TTS.
2. **Music generation.**시동 ( 텍스트, 멜로디, 음향 진행, 장르) 를 제공하면 음악을 제작합니다. 훨씬 더 광범위한 배포. MusicGen (메타), 안정적인 오디오 2.5, Suno v4, Udio, 리푸지언.
3. **Audio effects / sound design.**요청 시, 환경 소리 또는 Foley를 생성합니다.

세 가지 모두 같은 기판에서 실행됩니다. 신경 음향 코덱 + 토큰-AR 또는 전파 생성기.

## 개념

![Audio generation: codec tokens + transformer or diffusion](../assets/audio-generation.svg)

### 신경음속 코덱

엔코덱 (메타, 2022), 사운드스트림 (Google, 2021), 디스크립트 오디오 코덱 (DAC, 2023): convolutional encoder는 파형 형태를 시간단계 벡터로 압축하고; 잔해 벡터 양자화 (RVQ) 는 각 벡터를 K 코드북 인덱스 카스카드로 변환합니다. 디코더는 그것을 역전시킵니다. 24 kHz 오디오는 2 kbps에서 8 RVQ 코드북을 사용하여 75 Hz = 600 토큰 / 초에서 사용합니다.

```
waveform (16000 samples/sec)
    └─ encoder conv ─┐
                     ├─ RVQ layer 1 → indices at 75 Hz
                     ├─ RVQ layer 2 → indices at 75 Hz
                     ├─ ...
                     └─ RVQ layer 8
```

### 두 가지 생성적 패러다임이

**Token-autoregressive.**순서로 평면 RVQ 토큰을 실행하고 디코더만 변환기를 실행합니다. MusicGen은 K 코드북 스트림을 스트림 오프셋과 병렬적으로 방출하기 위해 "연연 평행"을 사용합니다. VALL-E는 텍스트 프롬프트 + 3초 음성 샘플에서 음성 토큰을 생성합니다.

**Latent diffusion.**코덱 토큰을 연속적인 잠잠자료로 포장하거나 카테고리 디스포지션으로 모델링하십시오. 안정적인 오디오 2.5는 연속적인 오디오 잠잠자료에서 흐름 일치를 사용합니다. AudioLDM 2는 텍스트-메일-오디오 디스포지션을 사용합니다.

2024~2026의 트렌드: 흐름 일치는 음악 (더 빠른 추론, 더 깨끗한 샘플) 에서 승리하고 있지만, 토큰-AR는 자연적으로 인과적이며 잘 스트리밍되기 때문에 여전히 연설을 지배하고 있습니다.

## 생산 풍경

| System | Task | Backbone | Latency |
|--------|------|----------|---------|
| ElevenLabs V3 | TTS | Token-AR + neural vocoder | ~300ms first token |
| OpenAI GPT-4o audio | Full-duplex speech | End-to-end multimodal AR | ~200ms |
| NaturalSpeech 3 | TTS | Latent flow matching | Non-streaming |
| Stable Audio 2.5 | Music / SFX | DiT + flow matching on audio latents | ~10s for 1-minute clip |
| Suno v4 | Full songs | Undisclosed; token-AR suspected | ~30s per song |
| Udio v1.5 | Full songs | Undisclosed | ~30s per song |
| MusicGen 3.3B | Music | Token-AR on Encodec 32kHz | Real-time |
| AudioCraft 2 | Music + SFX | Flow matching | ~5s for 5s clip |
| Riffusion v2 | Music | Spectrogram diffusion | ~10s |

```figure
score-matching
```

## 건설 해

`code/main.py`핵심 아이디어: 두 가지 다른 "스타일"에서 생성된 합성 "오디오 토큰" 순서 (스타일 A에 대한 낮은 토큰과 높은 토큰을 대조하고, 스타일 B에 대한 단조적인 램프) 에 따라 작은 다음 토큰 트랜스포머를 훈련합니다. 스타일과 샘플에 대한 조건.

### 단계 1: 합성 오디오 토큰

```python
def make_tokens(style, length, vocab_size, rng):
    if style == 0:  # "speech-like": alternating
        return [i % vocab_size for i in range(length)]
    # "music-like": ramp
    return [(i * 3) % vocab_size for i in range(length)]
```

### 단계 2: 작은 토큰 예측자를 훈련하십시오

스타일에 따라 조건화된 빅램 스타일 예측기. 핵심은 패턴입니다. 코덱 토큰 → 크로스 엔트로피 훈련 → 오토레그레시브 샘플링.

### 3단계: 조건부 샘플

스타일 토큰과 시작 토큰을 고려하면 예측된 배포에서 다음 토큰을 샘플링하십시오. 20-40 토큰을 계속하십시오.

## 함정

- **Codec quality caps output quality.**코덱이 صدا를 충실히 표현할 수 없다면, 생성자 품질의 양이 도움이 되지 않습니다. DAC는 현재 오픈 최고의 것입니다.
- **RVQ error accumulation.**각 RVQ 계층은 이전 계층의 잔해를 모델링합니다. 계층 1의 오류는 번식합니다. 더 높은 계층에서 온도가 0인 샘플링이 도움이 됩니다.
- **Musical structure.**30초의 토큰은 75Hz에서 20k+ 토큰입니다. 트랜스포머에 어렵습니다. MusicGen은 슬라이딩 윈도우 + 프롬프트 계속을 사용합니다.
- **Artifacts at boundaries.**생성된 클립들 사이의 크로스파딩은 신중한 초복이 필요합니다.
- **Clean-data appetite.**음악 생성기는 수만 시간의 라이선스 된 음악이 필요합니다. Suno / Udio RIAA 소송 (2024) 은 이것을 표면에 내세웠다.
- **Voice cloning ethics.**3초짜리 샘플과 텍스트 펌트는 VALL-E/XTTS/ElevenLabs의 음성 클론을 위해 충분합니다. 모든 생산 모델에는 남용 탐지 + 거부 목록이 필요합니다.

## 사용 하 고

| Task | 2026 stack |
|------|------------|
| Commercial TTS | ElevenLabs, OpenAI TTS, or Azure Neural |
| Voice cloning (consent-verified) | XTTS v2 (open) or ElevenLabs Pro |
| Background music, fast | Stable Audio 2.5 API, Suno, or Udio |
| Music with lyrics | Suno v4 or Udio v1.5 |
| Sound effects / Foley | AudioCraft 2, ElevenLabs SFX, or Stable Audio Open |
| Real-time voice agent | GPT-4o realtime or Gemini Live |
| Open-weights music research | MusicGen 3.3B, Stable Audio Open 1.0, AudioLDM 2 |
| Dubbing / translation | HeyGen, ElevenLabs Dubbing |

## 선박

저장`outputs/skill-audio-brief.md`. 스킬은 오디오 브리프 (task, duration, style, voice, license) 를 취하고 출력: 모델 + 호스팅, 프롬프트 포맷 (genre tags, style descriptors, structural markers), 코덱 + 생성자 + vocoder 체인, 씨드 프로토콜, eval 플랜 (MOS / CLAP 점수 / TTS / 사용자 A/B의 CER) 를 취한다.

## 운동

1. **Easy.**달아`code/main.py`그리고 스타일의 패턴과 일치하는 일련의 생성된 것을 확인합니다.
2. **Medium.**늦은 병렬 디코딩을 추가: 1 단계로 상쇄되어야 하는 2 개의 토큰 스트림을 시뮬레이션하십시오. 공동 예측자를 훈련하십시오.
3. **Hard.**HuggingFace 트랜스퍼를 사용하여 MusicGen-small을 로컬로 실행하세요. 세 가지 다른 명령어로 10초짜리 클립을 생성하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Codec | "Neural compression" | Encoder / decoder for audio; typical output is 50-75 Hz tokens. |
| RVQ | "Residual VQ" | Cascade of K quantizers; each models the residual of the previous. |
| Token | "One codec symbol" | Discrete index into a codebook; 1024 or 2048 typical. |
| Delayed parallel | "Offset codebooks" | Emit K token streams with staggered offsets to reduce sequence length. |
| Flow matching | "The 2024 win for audio" | Straighter-path alternative to diffusion; faster sampling. |
| Voice prompt | "3-second sample" | Speaker embedding or token prefix that steers the cloned voice. |
| Mel spectrogram | "The visual" | Log-magnitude perceptual spectrogram; used by many TTS systems. |
| Vocoder | "Mel to wave" | Neural component that converts mel spectrograms back to audio. |

## 제작 메모: 오디오는 스트리밍 문제입니다

오디오는 사용자가 생성되는 대로 *오디오가 나올 것으로 예상하는 유일한 출력 방식이며, 모든 것을 한 번에 발생하지 않습니다. 생산 용어에서는 이는 사용자의 듣기 속도가 목표 출력 이 아닌 읽기 속도가므로 TPOT (Time Per Output Token) 의 중요성을 의미합니다. ~ 75 토큰/초 (Encodec) 로 토큰화된 16kHz 오디오에서는 서버가 재생을 원활하게 유지하기 위해 사용자당 ≥75 토큰/초를 생성해야합니다.

두 가지 건축적 결과:

- **Flow-matching audio models cannot stream trivially.**스테이블 오디오 2.5와 오디오크래프트 2는 한 패스에서 고정된 클립 길이를 렌더링합니다. 스트리밍하려면 클립과 초복한 경계를  슬라이딩 창 전파를 생각하세요  코덱 AR 모델에 비해 100-300ms의 지연 윗값을 추가합니다.

만약 제품이 "생명 음성 채팅" 또는 "실제 음악 연속"이라면 코덱 AR 경로를 선택하세요. 만약 그것이 "submit에 30초의 클립을 렌더링"이라면, 흐름 일치하는 것이 품질과 전체 지연에 승리합니다.

## 더 많은 읽기

- [Défossez et al. (2022). Encodec: High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) 코덱 표준
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) 최초의 널리 사용되는 신경 음향 코덱
- [Kumar et al. (2023). High-Fidelity Audio Compression with Improved RVQGAN (DAC)](https://arxiv.org/abs/2306.06546) DAC
- [Wang et al. (2023). Neural Codec Language Models are Zero-Shot Text to Speech Synthesizers (VALL-E)](https://arxiv.org/abs/2301.02111) 발레
- [Copet et al. (2023). Simple and Controllable Music Generation (MusicGen)](https://arxiv.org/abs/2306.05284) 음악Gen.
- [Liu et al. (2023). AudioLDM 2: Learning Holistic Audio Generation with Self-supervised Pretraining](https://arxiv.org/abs/2308.05734) 오디오LDM 2.
- [Stability AI (2025). Stable Audio 2.5](https://stability.ai/news-updates/stability-ai-introduces-stable-audio-25-the-first-audio-model-built-for-enterprise-sound-production-at-scale) 2025 류 조화를 통해 텍스트와 음악
