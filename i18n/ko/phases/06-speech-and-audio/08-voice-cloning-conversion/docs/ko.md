# 음성 복제 및 음성 변환

> 음성 복제 작업은 다른 사람의 목소리로 텍스트를 읽습니다. 음성 변환은 당신이 말한 것을 보존하면서 다른 사람의 목소리로 당신의 목소리를 다시 작성합니다. 둘 다 같은 분해에 달려 있습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 07 (TTS)
**Time:** ~75 minutes

## 문제

2026년, 5초짜리 오디오 클립은 소비자 GPU를 사용하여 누구의 목소리도 고품질의 복제하는 데 충분합니다. ElevenLabs, F5-TTS, OpenVoice v2, VoiceBox 모두 무사하거나 몇 번의 복제 작업을 수행합니다. 이 기술은 축복 ( 접근성 TTS, 도빙, 보조 음성) 과 무기 (스캐임 통화, 정치적 딥팩, IP 도둑질).

두 가지 긴밀하게 연관된 임무:

- **Voice cloning (TTS-side):**텍스트 + 5초의 참조 음성 → 그 음성에서 오디오.
- **Voice conversion (speech-side):**소스 오디오 (인 A가 X를 말하는) + B가 X를 말하는 사람의 참조 음향 → B가 X를 말하는 오디오.

둘 다 파형 형태를 (콘텐츠, 스피커, 프로소디) 로 요원하고 한 소스에서 스피커와 다른 소스에서 재조합합니다.

2026년에 여러분이 지금 선박하는 핵심적인 제약:**watermarking and consent gates are legally required in the EU (AI Act, enforceable August 2026) and in California (AB 2905, effective 2025)**파이프라인은 불명확한 물표가 배출되고 동의하지 않은 복제물을 거부해야 합니다.

## 개념

![Voice cloning vs conversion: factorize, swap speaker, recombine](../assets/voice-cloning.svg)

**Zero-shot cloning.**수천 개의 스피커에서 훈련된 모델에 5초짜리 클립을 전달하십시오. 스피커 코더는 클립을 스피커 임베디션에 지도합니다. TTS 디코더는 그 임베디션과 텍스트에 조건을 설정합니다.

F5-TTS (2024), YourTTS (2022), XTTS v2 (2024), OpenVoice v2 (2024) 에서 사용된다.

**Few-shot fine-tuning.**5~30분 동안 표적 음성 녹음. LoRA는 1시간 동안 기본 모델을 정렬합니다. 품질은 "좋아요"에서 "분별할 수 없습니다". Coqui와 ElevenLabs은 이 패턴을 모두 지원합니다. 커뮤니티는 F5-TTS와 함께 사용합니다.

**Voice conversion (VC).**두 가족:

- **Recognition-synthesis.**ASR형 모델을 실행하여 콘텐츠 표현을 추출 (예를 들어 부드러운 음향 후면, PPG) 하고, 목표 스피커 임베디션으로 재합성합니다. 언어와 억양에 견고합니다. KNN-VC (2023), Diff-HierVC (2023) 에서 사용됩니다.
- **Disentanglement.**함축에서 함유된 공간에서 콘텐츠, 스피커, 프로소디를 분리하는 자동코더를 훈련하십시오. 추론에서 스프레이 스피커 임베디션을 수행합니다. 품질이 낮지만 더 빠르다. AutoVC (2019) 에서 사용되며, VITS-VC 변종입니다.

**Neural codec-based cloning (2024+).**VALL-E, VALL-E 2, NaturalSpeech 3, VoiceBox 는 사운드스트림/엔코덱의 단독 토큰으로 오디오를 취급하고, 코덱 토큰에 대한 큰 오토레그레시브 또는 흐름 일치 모델을 훈련합니다. 짧은 명령어에서 ElevenLabs와 비교할 수있는 품질.

### 윤리적인 부분, 이 아닌

**Watermarking.**PerTh (퍼스) 와 SilentCipher (2024) 은 오디오에 ~16-32 비트 ID를 눈에 띄지 않게 삽입합니다. 재코딩, 스트리밍 및 일반적인 편집을 생존합니다. 생산 준비가 된 오픈 소스.

**Consent gates.**복제된 출력 모두 검증 가능한 동의 기록과 결합해야 합니다. "나는 로히트, 2026-04-22에 이 음성으로 X 목적을 위해 권한을 부여합니다".

**Detection.**AASIST, RawNet2, Wav2Vec2-AASIST는 탐지기를 사용한다. ASVspoof 2025 도전은 ElevenLabs, VALL-E 2, 그리고 Bark 출력에 대한 최첨단 탐지기들에 대한 0.82.3%의 EER를 발표했다.

### 숫자 (2026)

| Model | Zero-shot? | SECS (target sim) | WER (intel.) | Params |
|-------|-----------|--------------------|--------------|--------|
| F5-TTS | Yes | 0.72 | 2.1% | 335M |
| XTTS v2 | Yes | 0.65 | 3.5% | 470M |
| OpenVoice v2 | Yes | 0.70 | 2.8% | 220M |
| VALL-E 2 | Yes | 0.77 | 2.4% | 370M |
| VoiceBox | Yes | 0.78 | 2.1% | 330M |

SECS > 0.70는 대부분 청취자에게는 대상에서 구별할 수 없습니다.

```figure
sp-voice-factorize
```

## 건설 해

### 단계 1: 인식-합성에 의해 분해 (main.py에서 코드만 데모)

```python
def clone_pipeline(ref_audio, text, target_embedder, tts_model):
    speaker_emb = target_embedder.encode(ref_audio)
    mel = tts_model(text, speaker=speaker_emb)
    return vocoder(mel)
```

개념적으로 간단하고, 구현량은`tts_model`스피커 코더

### 단계 2: F5-TTS로 무사한 클론

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="rohit_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please add milk and bread to my list.",
)
```

참조 표본은 오디오와 정확히 일치해야 합니다. 일치하지 않는 것은 조화를 끊습니다.

### 단계 3: KNN-VC로 음성 변환

```python
import torch
from knnvc import KNNVC  # 2023 model, https://github.com/bshall/knn-vc
vc = KNNVC.load("wavlm-base-plus")
out_wav = vc.convert(source="my_voice.wav", target_pool=["alice_1.wav", "alice_2.wav"])
```

KNN-VC는 원천 및 목표 풀의 프레임 임베디션을 추출하기 위해 WavLM를 실행하고, 그 다음 각 원천 프레임을 수영장의 가장 가까운 이웃으로 대체합니다.

### 4단계: 워터마크를 삽입

```python
from silentcipher import SilentCipher
sc = SilentCipher(model="2024-06-01")
payload = b"consent_id:abc123;ts:1745353200"
watermarked = sc.embed(wav, sr=24000, message=payload)
detected = sc.detect(watermarked, sr=24000)   # returns payload bytes
```

~32 비트의 유용 부하, MP3 재코딩과 가벼운 소음으로 감지됩니다.

### 단계 5: 동의 게이트

```python
def cloned_inference(text, ref_audio, consent_record):
    assert verify_signature(consent_record), "Signed consent required"
    assert consent_record["speaker_id"] == hash_speaker(ref_audio)
    wav = tts.infer(ref_file=ref_audio, gen_text=text)
    wav = watermark(wav, payload=consent_record["id"])
    return wav
```

## 사용 하 고

2026년 스택:

| Situation | Pick |
|-----------|------|
| 5-sec zero-shot clone, open-source | F5-TTS or OpenVoice v2 |
| Commercial production cloning | ElevenLabs Instant Voice Clone v2.5 |
| Voice conversion (rewriting) | KNN-VC or Diff-HierVC |
| Many-speaker fine-tune | StyleTTS 2 + speaker adapter |
| Cross-lingual cloning | XTTS v2 or VALL-E X |
| Deepfake detection | Wav2Vec2-AASIST |

## 함정

- **Misaligned reference transcript.**F5-TTS 및 유사한 것은 참조 텍스트가 참조 오디오와 정확히 일치하도록 요구합니다.
- **Reverberant reference.**에코가 클론을 죽이고 건조한 녹음
- **Emotional mismatch.**훈련 참조 "즐겁다"는 모든 것을 즐거운 복제 생산합니다. 목표 사용에 참조 감정에 일치합니다.
- **Language leakage.**영어 말하기자를 복제하고 모델에게 프랑스어를 말하기 요청하는 것은 종종 억양을 가지고 있습니다.
- **No watermark.**2026년 8월부터 EU에서 합법적으로 배송할 수 없습니다.

## 선박

`outputs/skill-voice-cloner.md`. 동의 게이트 + 워터마크 + 품질 목표가 있는 복제 또는 변환 파이프라인을 설계한다.

## 운동

1. **Easy.**달아`code/main.py`. 스피커 내장 교환을 2개의 "스피커"의 전과 후 교환 사이의 코시노를 계산함으로써 보여줍니다.
2. **Medium.**OpenVoice v2를 사용하여 자신의 목소리를 복제합니다. 참조와 복제 사이의 SECS를 측정합니다. Whisper를 통해 CER를 측정합니다.
3. **Hard.**SilentCipher 워터마크를 20개의 클론에 적용하고 128 kbps MP3 코딩+독호를 통해 실행하여 유용 부하를 감지하고 비트 정확도를 보고합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Zero-shot clone | 5 seconds is enough | Pretrained model + speaker embedding; no training. |
| PPG | Phonetic posteriorgram | Per-frame ASR posteriors used as language-agnostic content rep. |
| KNN-VC | Nearest-neighbor conversion | Replace each source frame with nearest target-pool frame. |
| Neural codec TTS | VALL-E style | AR model over EnCodec/SoundStream tokens. |
| Watermark | Inaudible signature | Bits embedded in audio, survive re-encode. |
| SECS | Cloning fidelity | Cosine between target and clone speaker embeddings. |
| AASIST | Deepfake detector | Anti-spoof model; detects synthesized speech. |

## 더 많은 읽기

- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) 오픈소스 SOTA 제로샷 클론링
- [Baevski et al. / Microsoft (2023). VALL-E](https://arxiv.org/abs/2301.02111)그리고[VALL-E 2 (2024)](https://arxiv.org/abs/2406.05370) 신경 코덱 TTS
- [Qian et al. (2019). AutoVC](https://arxiv.org/abs/1905.05879) 분해 기반의 음성 변환
- [Baas, Waubert de Puiseau, Kamper (2023). KNN-VC](https://arxiv.org/abs/2305.18975) 검색 기반의 VC
- [SilentCipher (2024) — Audio Watermarking](https://github.com/sony/silentcipher) 생산 준비 된 32 비트 오디오 워터마크
- [ASVspoof 2025 results](https://www.asvspoof.org/) 검출기와 합성기 무기 경주, 2026년 업데이트
