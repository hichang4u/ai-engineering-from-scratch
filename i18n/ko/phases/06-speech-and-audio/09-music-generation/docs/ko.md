# 음악 세대  음악 세대, 안정적인 오디오, 수노, 라이센스 지진

> 2026년 음악 세대는: Suno v5와 Udio v4가 상업적으로 지배하고 있다. MusicGen, Stable Audio Open, ACE-Step는 오픈소스를 주도한다. 기술 문제는 대부분 해결되었다. 법적 문제는 (Warner Music 500M 달러 합의, UMG 합의) 는 2025-2026년에 분야를 재정의했다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 4 · 10 (Diffusion Models)
**Time:** ~75 minutes

## 문제

텍스트 → 30초~4분 간 음악 클립, 가사와 보컬, 구조. 세 가지 부분 문제:

1. **Instrumental generation.**"온한 키와 로피 힙합 드럼" 같은 텍스트 → 오디오. MusicGen, 안정적인 오디오, AudioLDM.
2. **Song generation (with vocals + lyrics).**"테크사스 강수 밤에 대한 컨트리 노래" → 전체 노래.
3. **Conditional / controllable.**기존 클립을 확장하거나 브리지, 스와프 장르, 줄기 분리 또는 인 페인트를 재생합니다. Udio의 인 페인트 + 줄기 분리은 2026 기능이 일치합니다.

## 개념

![Music generation: token-LM vs diffusion, the 2026 model map](../assets/music-generation.svg)

### 신경 코덱 토큰에 대한 토큰 LM

메타**MusicGen**(2023, MIT) 와 많은 파생물: 텍스트/음악 임베디션의 조건, 자동 퇴행성 예측 EnCodec 토큰 (32 kHz, 4 코드북), EnCodec와 디코딩. 300M - 3.3B 파라미어. 강력한 기본 라인; 30 초를 넘어서 투쟁.

**ACE-Step**(오픈소스, 4B XL, 2026년 4월 발매) 는 이를 전체 노래 리릭 컨디션 세대를 위해 확장합니다. 오픈 커뮤니티는 Suno와 가장 가까운 것입니다.

### 녹음 또는 잠잠한 상태에서 퍼지는

**Stable Audio (2023)**그리고**Stable Audio Open (2024)**압축된 오디오에서 잠잠하게 퍼지는 것. ループ, 사운드 디자인, 환경 텍스처에 탁월하다. 구조화된 전체 곡에는 훌륭하지 않습니다.

**AudioLDM / AudioLDM2**T2I 스타일의 잠잠한 전파를 통해 텍스트에서 오디오로, 음악, 사운드 효과, 연설에 일반화됩니다.

### 하이브리드 (제작)  수노, 유디오, 리리아

닫힌 무게. 아마도 AR 코덱 LM + 전파 기반 보코더와 전문적인 음성 / 드럼 / 멜로디 헤드. Suno v5 (2026) 는 ELO 1293 품질 리더입니다. Udio v4는 인 페인팅 + 줄기 분리 (bass, 드럼, 보컬 분리 다운로드) 를 추가합니다.

### 평가

- **FAD (Fréchet Audio Distance).**VGGish 또는 PANNs 기능을 사용하여 생성된 오디오 배포와 실제 오디오 배포 사이의 임베디션 수준의 거리. 낮은 것이 좋습니다. MusicGen 작습니다: MusicCaps에서 4.5 FAD; SOTA ~3.0.
- **Musicality (subjective).**인간의 선호. Suno v5 ELO 1293 선도.
- **Text-audio alignment.**CLAP 점수는 프롬프트와 출력 사이에 있습니다.
- **Musicality artifacts.**비작정 전환, 음향의 파동, 30초 후 구조 손실

## 2026년 모델 지도

| Model | Params | Length | Vocals | License |
|-------|--------|--------|--------|---------|
| MusicGen-large | 3.3B | 30 s | no | MIT |
| Stable Audio Open | 1.2B | 47 s | no | Stability non-commercial |
| ACE-Step XL (Apr 2026) | 4B | &gt; 2 min | yes | Apache-2.0 |
| YuE | 7B | &gt; 2 min | yes, multilingual | Apache-2.0 |
| Suno v5 (closed) | ? | 4 min | yes, ELO 1293 | commercial |
| Udio v4 (closed) | ? | 4 min | yes + stems | commercial |
| Google Lyria 3 (closed) | ? | real-time | yes | commercial |
| MiniMax Music 2.5 | ? | 4 min | yes | commercial API |

## 법적 환경 (2025~2026)

- **Warner Music vs Suno settlement.**500억 달러. WMG는 이제 Suno에서 AI 유사성, 음악 권리, 사용자 생성 트랙을 감독합니다.
- **EU AI Act**+ **California SB 942**: 인공지능으로 생성된 음악은 공개되어야 합니다.
- **Riffusion / MusicGen**MIT에 따라 컴플라이언스 배거지가 없지만 상업적인 보컬도 없습니다.

안전함 패턴:

1. 악기용만 생성 (MusicGen, Stable Audio Open, MIT/CC0 출력)
2. 상용 API (Suno, Udio, ElevenLabs Music) 를 세대별 라이선스로 사용하십시오.
3. 소유 또는 라이선스 된 카탈로그를 열 (대부분의 기업은 여기에 끝납니다).
4. 워터마크 + 메타데이터로 세대를 태그합니다.

```figure
sp-codec-tokens
```

## 건설 해

### 단계 1: MusicGen으로 생성

```python
from audiocraft.models import MusicGen
import torchaudio

model = MusicGen.get_pretrained("facebook/musicgen-small")
model.set_generation_params(duration=10)
wav = model.generate(["upbeat synthwave with driving drums, 128 BPM"])
torchaudio.save("out.wav", wav[0].cpu(), 32000)
```

세 가지 크기가 있습니다.`small`(속도로 300M)`medium`(1.5B)`large`(3.3B) "이념이 착륙 할 때"에 작은 것 은 충분 하다.

### 단계 2: 멜로디 컨디션

```python
melody, sr = torchaudio.load("humming.wav")
wav = model.generate_with_chroma(
    ["jazz piano cover"],
    melody.squeeze(),
    sr,
)
```

음악Gen-메로디는 염색체를 가지고 음향을 교환하는 동안 보존합니다. "이 음향을 줄기 쿼트로 내주십시오".

### 단계 3: FAD 평가

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()

fad.get_fad_score("generated_folder/", "reference_folder/")
```

VGGish 임베디션 거리를 계산합니다. 장르 수준의 회귀 테스트에 유용합니다. 인간 청취자를 대체하지 않습니다.

### 단계 4: LLM 음악 작업 흐름에 추가

7~8강의 아이디어와 결합해 보세요.

```python
prompt = "Write a 30-second jazz loop. Describe the drums, bass, and piano voicing."
description = llm.complete(prompt)
music = musicgen.generate([description], duration=30)
```

## 사용 하 고

| Goal | Stack |
|------|-------|
| Instrumental sound design | Stable Audio Open |
| Game / adaptive music | Google Lyria RealTime (closed) |
| Full songs with vocals (commercial) | Suno v5 or Udio v4 with explicit license |
| Full songs with vocals (open) | ACE-Step XL or YuE |
| Short ad jingle | MusicGen melody-conditioned on a hummed reference |
| Music-video background | MusicGen + Stable Video Diffusion |

## 2026 년에도 여전히 선박되는 함정이

- **Copyright-laundering prompts.**"Taylor Swift 스타일의 노래"  상업적인 Suno/Udio 필터
- **Repetition / drift past 30 s.**AR 모델 루프. 여러 세대를 횡단하거나 구조적 일관성을 위해 ACE-Step을 사용하십시오.
- **Tempo drift.**모델은 BPM에서 벗어나서 BPM 태그를 사용하세요.`beat_track`- 그래
- **Vocal intelligibility.**수노는 훌륭 합니다. 오픈 모델은 종종 단어에 대해 무관심합니다. 가사가 중요하다면 상업적인 API 또는 정렬을 사용하세요.
- **Mono output.**개방형 모델은 모노 또는 가짜 스테레오를 생성합니다. 적절한 스테레오 재구성 (예: 카르테시아의 스테레오 전파) 으로 업그레이드합니다.

## 선박

`outputs/skill-music-designer.md`. 음악-세대 배포를 위한 모델, 라이선스 전략, 길이가 / 구조 계획 및 공개 메타데이터 선택.

## 운동

1. **Easy.**달아`code/main.py`. 그것은 ASCII 상징으로 "창조" 음향 진행 + 드럼 패턴을 생성합니다. 음악-세대 만화. 원하는 경우 어떤 MIDI 렌더러를 통해 재생합니다.
2. **Medium.**설치`audiocraft`, 10초짜리 클립을 생성하고 4개의 장르 프로모션을 MusicGen-small로 측정하고,
3. **Hard.**ACE-Step (또는 MusicGen-melody) 를 사용하여 다른 템브레 명령어와 같은 음의 세 가지 변형을 생성하십시오. 조화를 확인하기 위해 명령어와 CLAP 유사성을 계산하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| FAD | Audio FID | Fréchet distance between embedding distributions of real vs generated. |
| Chromagram | Melody as pitches | 12-dim per-frame vector; input to melody conditioning. |
| Stems | Instrument tracks | Separated bass / drums / vocals / melody as WAV. |
| Inpainting | Regen a section | Mask a time window; model regenerates just that. |
| CLAP | Text-audio CLIP | Contrastive audio-text embedding; eval text-audio alignment. |
| EnCodec | Music codec | Meta's neural codec used by MusicGen; 32 kHz, 4 codebooks. |

## 더 많은 읽기

- [Copet et al. (2023). MusicGen](https://arxiv.org/abs/2306.05284) 개방형 오토레그레시브 벤치마킹
- [Evans et al. (2024). Stable Audio Open](https://arxiv.org/abs/2407.14358) 음향 설계 기본 설정
- [ACE-Step](https://github.com/ace-step/ACE-Step) 개장 4B 전곡 발전기, 2026년 4월
- [Suno v5 platform docs](https://suno.com) 상업적 품질의 리더
- [AudioLDM2](https://arxiv.org/abs/2308.05734) 음악 + 사운드 효과에 대한 잠잠한 전파.
- [WMG-Suno settlement coverage](https://www.musicbusinessworldwide.com/warner-music-group-settles-with-suno-strikes-first-of-its-kind-deal-with-ai-song-generator/) 2025년 11월 전례
