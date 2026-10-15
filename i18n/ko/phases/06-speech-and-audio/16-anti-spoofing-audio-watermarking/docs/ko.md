# 음성 반신매 및 오디오 워터마크  ASVspoof 5, 오디오시얼, 웨이브베리파이

> 음성 복제 시스템은 방어보다 더 빠르게 배포됩니다. 2026 생산 음성 시스템은 두 가지 요소가 필요합니다. 실제와 가짜 연설을 분류하는 탐지기 (AASIST, RawNet2) 와 압축 및 편집을 생존하는 워터마크 (AudioSeal). 음성 복제를 배포하거나 배포하지 않습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 08 (Voice Cloning)
**Time:** ~75 minutes

## 문제

관련 3가지 방어책:

1. **Anti-spoofing / deepfake detection.**오디오 클립을 고려하면 합성 또는 실제입니까? ASVspoof 벤치마크 (ASVspoof 2019 → 2021 → 5) 는 금 표준입니다.
2. **Audio watermarking.**감지기가 나중에 추출할 수 있는 감지 불가능한 신호를 생성된 오디오에 삽입합니다. 오디오시얼 (메타) 및 웨브마크는 개방된 옵션입니다.
3. **Authenticated provenance.**오디오 파일 + 메타데이터의 암호 서명. C2PA / 콘텐츠 인증 협동

탐지 작업은 협력하지 않는 적들을 처리합니다. 워터마크는 컴플라이언스를 처리합니다. 인공지능으로 생성된 오디오는 그러한 것으로 식별되어야 합니다. 두 가지 모두 2026 년에 요구됩니다.

## 개념

![Anti-spoofing vs watermarking vs provenance — three defense layers](../assets/spoofing-watermark.svg)

### ASVspoof 5  2024~2025 기준

이전 에디션과 가장 큰 변화는

- **Crowdsourced data**(스튜디오 청소가 아닙니다)  현실적인 조건.
- **~2000 speakers**(전 ~ 100년 전)
- **32 attack algorithms.**TTS+ 음성 변환+ 적대적 혼란
- **Two tracks.**반사 조치 (CM) 독립 검출; 생체계 시스템에서 스푸핑 견고한 ASV (SASV)

ASVspoof 5: ~ 7.23% EER. 이전 ASVspoof 2019 LA: 0.42% EER. 실제 세계 배포: 야생 클립에서 5-10% EER를 기대하십시오.

### AASIST 및 RawNet2  탐지 모델 가족

**AASIST**(2021, 2026년까지 업데이트) 스펙트럼적 특징에 대한 그래프 주의. ASVspoof 5 대책 작업에 대한 현재 SOTA.

**RawNet2.**원형 파형 + TDNN 척추에 대한 전면 전면 이 니다. 단순한 기본 라인; 여전히 정교한 조율로 경쟁력 있습니다.

**NeXt-TDNN + SSL features.**2025 버전트: ECAPA 스타일 + WavLM 기능 + 광소 손실. ASVspoof 2019 LA에서 0.42% EER를 달성합니다.

### 오디오시얼  2024 워터마크 기본

메타**AudioSeal**(Jan 2024, v0.2 Dec 2024) 주요 설계:

- **Localized.**16 kHz 샘플 해상도 (1/16000 s) 에서 프레임 당 워터마크를 감지합니다.
- **Generator + detector jointly trained.**생성기는 비청각 신호를 배포하는 법을 배우며 탐지기는 증강을 통해 그것을 찾습니다.
- **Robust.**MP3 / AAC 압축, EQ, 속도 변화 ± 10%, 소음 혼합 + 10 dB SNR를 생존합니다.
- **Fast.**탐지기는 485x 실시간으로 작동합니다. WavMark보다 1000x 더 빠르죠.
- **Capacity.**16비트 유용로드 (모델 ID, 생성 시간표, 사용자 ID를 암호화할 수 있습니다) 각 발음에 임베디드 할 수 있습니다.

### 웨이브마크

오디오세일 전 오픈 기본 라인, 역전성 신경망, 32비트/초

- 시크로나시션 부력은 느려집니다.
- 가우스 소음이나 MP3 압축으로 제거할 수 있습니다.
- 실시간으로 친근하지 않아요

### 웨이브베리파이 (2025년 7월)

오디오셀의 약점을 해결합니다. 특히 시간적 조작 (반전, 속도) 을 사용합니다. FiLM 기반의 생성기 + 전문가 혼합 탐지기를 사용합니다. 표준 공격에서 오디오셀과 경쟁합니다. 시간적 편집을 처리합니다.

### 적들이 이 격차를 이용하는

AudioMarkBench에서 "피치 전환 아래 모든 워터마크는 비트 복구 정확도가 0.6 이하로 표시되며 거의 완전한 제거를 나타냅니다". **Pitch-shift is the universal attack.**2026 워터마크는 공격적인 음향 수정에 완전히 견고합니다. 그래서 워터마크와 함께 탐지 (AASIST) 를 필요로 합니다.

### C2PA / 콘텐츠 진실성 제책

ML 기술  명백한 형식. 오디오 파일은 생성 도구, 저자, 날짜에 대한 암호화된 서명 된 메타 데이터를 가지고 있습니다. Audobox / Seamless 사용. 출처에 좋습니다. 나쁜 배우가 메타 데이터를 다시 암호화하고 스트립하면 아무것도하지 않습니다.

```figure
v4-audio-watermark
```

## 건설 해

### 단계 1: 간단한 스펙트럼 특징 탐지기 (놀이)

```python
def spectral_rolloff(spec, percentile=0.85):
    cum = 0
    total = sum(spec)
    if total == 0:
        return 0
    threshold = total * percentile
    for k, v in enumerate(spec):
        cum += v
        if cum >= threshold:
            return k
    return len(spec) - 1

def is_suspicious(audio):
    spec = magnitude_spectrum(audio)
    rolloff = spectral_rolloff(spec)
    return rolloff / len(spec) > 0.92
```

합성 음성에는 종종 비정상적으로 평평한 높은 주파수 에너지가 있습니다. 생산 탐지기는 AASIST를 사용합니다. 하지만 직관은 그대로 있습니다.

### 단계 2: AudioSeal 임베드 + 감지

```python
from audioseal import AudioSeal
import torch

generator = AudioSeal.load_generator("audioseal_wm_16bits")
detector = AudioSeal.load_detector("audioseal_detector_16bits")

audio = load_wav("generated.wav", sr=16000)[None, None, :]
payload = torch.tensor([[1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0]])
watermark = generator.get_watermark(audio, sample_rate=16000, message=payload)
watermarked = audio + watermark

result, decoded_payload = detector.detect_watermark(watermarked, sample_rate=16000)
# result: float in [0, 1] — probability of watermark presence
# decoded_payload: 16 bits; match against embedded payload
```

### 3단계: 평가  EER

```python
def eer(real_scores, fake_scores):
    thresholds = sorted(set(real_scores + fake_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in fake_scores if s >= t) / len(fake_scores)
        frr = sum(1 for s in real_scores if s < t) / len(real_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

### 4단계: 생산 통합

```python
def safe_tts(text, voice, clone_reference=None):
    if clone_reference is not None:
        verify_consent(user_id, clone_reference)
    audio = tts_model.synthesize(text, voice)
    audio_with_wm = audioseal_embed(audio, payload=build_payload(user_id, model_id))
    manifest = c2pa_sign(audio_with_wm, user_id, timestamp=now())
    return audio_with_wm, manifest
```

모든 세대의 배: (1) 물표, (2) 서명된 명문, (3) 보존 정책에 따라 감사 기록

## 사용 하 고

| Use case | Defense |
|----------|---------|
| Shipping TTS / voice cloning | AudioSeal embed on every output (non-negotiable) |
| Biometric voice unlock | AASIST + ECAPA ensemble; liveness challenge |
| Call-center fraud detection | AASIST on 20% sample of incoming calls |
| Podcast authenticity | C2PA signing on upload, AudioSeal if AI-generated |
| Research / training detectors | ASVspoof 5 train/dev/eval sets |

## 함정

- **Watermark without detector ever running.**기기 탐지기를 내보내
- **Detection without calibration.**AASIST은 LA의 ASVspoof 오피트, 실제 세계 정확성 감소에 훈련되어
- **Pitch-shift gap.**공격적인 음향 전환은 대부분의 워터마크를 제거합니다
- **Metadata strip-and-rehost.**C2PA는 재코딩으로 비례적으로 회피할 수 있습니다. 항상 암호 + 인식 (물표) 방어 기능을 함께 추가합니다.
- **Liveness as detection.**사용자가 무작위로 표현하도록 요청하면 재생 공격이 방지되지만 실시간 클로닝이 아닙니다.

## 선박

`outputs/skill-spoof-defender.md`음성-gen 배포를 위한 탐지 모델, 워터마크, 출산 명문, 운영 플레이북을 선택합니다.

## 운동

1. **Easy.**달아`code/main.py`. 장난감 감지기 + 장난감 워터마크 합성 오디오에 삽입/탐지
2. **Medium.**설치`audioseal`TTS 출력으로 16비트 사용량을 삽입하고 재독호하고 소음으로 오디오를 손상시키고 비트 복구 정확도를 측정합니다.
3. **Hard.**ASVspoof 2019 LA에서 RawNet2 또는 AASIST를 정렬하십시오. EER를 측정하십시오. F5-TTS 생성 된 클립의 수직 세트에서 테스트하십시오. OOD 검출이 어떻게 악화되는지 확인하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| ASVspoof | The benchmark | Biennial challenge; 2024 = ASVspoof 5. |
| CM (countermeasure) | Detector | Classifier: real speech vs synthetic / converted. |
| SASV | Speaker verif + CM | Integrated biometric + spoof detection. |
| AudioSeal | Meta watermark | Localized, 16-bit payload, 485× faster than WavMark. |
| Bit Recovery Accuracy | Watermark survival | Fraction of payload bits recovered after attack. |
| C2PA | Provenance manifest | Cryptographic metadata about creation / authorship. |
| AASIST | Detector family | Graph-attention-based anti-spoofing SOTA. |

## 더 많은 읽기

- [Todisco et al. (2024). ASVspoof 5](https://dl.acm.org/doi/10.1016/j.csl.2025.101825) 현재 기준
- [Defossez et al. (2024). AudioSeal](https://arxiv.org/abs/2401.17264) 워터마크 기본
- [Chen et al. (2025). WaveVerify](https://arxiv.org/abs/2507.21150) 시간적 공격에 대한 MoE 탐지기
- [Jung et al. (2022). AASIST](https://arxiv.org/abs/2110.01200) SOTA 탐지 척추
- [AudioMarkBench (2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/5d9b7775296a641a1913ab6b4425d5e8-Paper-Datasets_and_Benchmarks_Track.pdf) 강도 평가
- [C2PA specification](https://spec.c2pa.org/specifications/specifications/2.4/index.html) 출산 선언 형식
