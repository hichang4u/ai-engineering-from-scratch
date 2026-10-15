# 스피커 인식 및 검증

> ASR는 "그들은 무엇을 말했어요?"라고 묻습니다. 스피커 인식은 "누가 말했습니까?"라고 묻습니다. 수학은 동일한  임베디딩과 코시네이 보이지만 모든 생산 결정은 단일 EER 번호에 달려 있습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 22 (Embedding Models)
**Time:** ~45 minutes

## 문제

사용자 가 암호 문장을 말합니다. 당신은 알고 싶어 합니다: 이 사람이 자신이 있다고 주장하는 사람입니까 (* 확인*, 1:1), 아니면 등록 은행의 첫 사람입니까 (* 식별*, 1:N)? 또는 이 둘 다  이 는 알려지지 않은 스피커입니까 (* 오픈-셋*)?

2018년 전: GMM-UBM + i-벡터. 합리적인 EER이지만 채널 전환 (전화와 노트북) 및 감정에 취약하다. 20182022: x-벡터 (각적 지점으로 훈련된 TDNN 척추). 2022+: ECAPA-TDNN 및 WavLM-큰 임베디드. 2026년까지 분야는 세 모델과 한 메트릭이 지배한다.

메트릭은**EER** 동일한 오류율. 의사 결정 임대값을 설정하여 거짓 수용률 = 거짓 거부율. 크로스오버는 EER입니다. 모든 논문, 모든 랭킹 게시판, 모든 구매 호출에서 사용됩니다.

## 개념

![Enrollment + verification pipeline with embedding + cosine + EER](../assets/speaker-verification.svg)

**The pipeline.**등록: 목표 스피커의 530초를 기록하고, 고정 차원의 임베디션을 계산 (192-d ECAPA-TDNN, 256-d WavLM-large) 하는 경우 검증: 테스트 진술 임베디션을 얻으며, 코시노 유사성을 계산하고, 임계값에 비교한다.

**ECAPA-TDNN (2020, still dominant 2026).**중시된 채널 주의, 전파 및 집합 - 시간 지연 신경 네트워크. 1D conv 블록은 압축 흥분, 다 헤드 주의 합동, 그 다음에는 192-d까지 선형 층이 있습니다. VoxCeleb 1+2 (2,700 스피커, 1.1M 발음) 과 훈련된 추가 각기 마진 손실 (AAM-softmax).

**WavLM-SV (2022+).**AAM 손실과 함께 미리 훈련된 WavLM 크기의 SSL 척추를 정렬하십시오. 더 높은 품질이지만 느린  300+ MB vs 15 MB.

**x-vector (baseline).**TDNN + 통계에 대한 통계는. 클래식; 여전히 CPU / edge에 유용합니다.

**AAM-softmax.**추가 지표가 있는 표준 소프트맥스 `m`각 공간에서: `cos(θ + m)`정답 클래스. 클래스 간 각별 세력. 전형적인`m=0.2`, 규모`s=30`- 그래

### 점수를

- **Cosine**등록과 시험 임베디션 사이의 결정.
- **PLDA (Probabilistic LDA).**프로젝트 임베디션은 동일한 스피커와 다른 스피커가 닫힌 형태 확률 비율을 갖는 잠그어진 공간에 있습니다. +1020% EER 감소를 위해 코시네 위에 추가됩니다. 2020 년 이전 표준; 현재는 닫힌 세트 설정에서만 사용됩니다.
- **Score normalization.** `S-norm`또는`AS-norm`: 거짓 수단과 같은 집단에 대한 각 점수를 정상화합니다.

### 당신이 알아야 할 숫자 (2026)

| Model | VoxCeleb1-O EER | Params | Throughput (A100) |
|-------|-----------------|--------|-------------------|
| x-vector (classic) | 3.10% | 5 M | 400× RT |
| ECAPA-TDNN | 0.87% | 15 M | 200× RT |
| WavLM-SV large | 0.42% | 316 M | 20× RT |
| Pyannote 3.1 segmentation + embedding | 0.65% | 6 M | 100× RT |
| ReDimNet (2024) | 0.39% | 24 M | 100× RT |

### 수염증

"누가 언제 이야기 했는가"는 다중 스피커 클립에서. 파이프라인: VAD → 세그먼트 → 각 세그먼트를 임베디드 → 클러스터 (집합적 또는 스펙트럼) → 부드러운 경계를. 현대 스택: `pyannote.audio`3.1, 이는 스피커 세그먼트 + 임베디션 + 클러스터링을 하나의 호출 뒤에 묶어줍니다. 2026 AMI에 SOTA DER는 ~ 15% (2022 년 23%에서 감소합니다).

```figure
sp-eer-crossover
```

## 건설 해

### 단계 1: MFCC 통계에 의한 장난감 임베디션

```python
def embed_mfcc_stats(signal, sr):
    frames = featurize_mfcc(signal, sr, n_mfcc=13)
    mean = [sum(f[i] for f in frames) / len(frames) for i in range(13)]
    std = [
        math.sqrt(sum((f[i] - mean[i]) ** 2 for f in frames) / len(frames))
        for i in range(13)
    ]
    return mean + std  # 26-d
```

 교직을 위해만 `code/main.py`이 기술을 합성 스피커 데이터에 대한 개념 증명으로 사용합니다.

### 단계 2: 코시노 유사성 + 임계

```python
def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0

def verify(enroll, test, threshold=0.75):
    return cosine(enroll, test) >= threshold
```

### 단계 3: 유사성 쌍의 EER

```python
def eer(same_scores, diff_scores):
    thresholds = sorted(set(same_scores + diff_scores))
    best = (1.0, 1.0, 0.0)  # (fa, fr, threshold)
    for t in thresholds:
        fr = sum(1 for s in same_scores if s < t) / len(same_scores)
        fa = sum(1 for s in diff_scores if s >= t) / len(diff_scores)
        if abs(fa - fr) < abs(best[0] - best[1]):
            best = (fa, fr, t)
    return (best[0] + best[1]) / 2, best[2]
```

반환 (eer, threshold_at_eer). 둘 다 보고.

### 단계 4: 스피치브레인으로 제작

```python
from speechbrain.pretrained import EncoderClassifier

clf = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")

# enroll: average the embeddings of 3-5 clean samples
enroll = torch.stack([clf.encode_batch(load(x)) for x in enrollment_clips]).mean(0)
# verify
score = clf.similarity(enroll, clf.encode_batch(load("test.wav"))).item()
verdict = score > 0.25   # ECAPA typical threshold; tune on your data
```

### 단계 5: 피아노 노트를 사용하여 일간지화

```python
from pyannote.audio import Pipeline

pipe = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
diarization = pipe("meeting.wav", num_speakers=None)
for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{turn.start:.1f}–{turn.end:.1f}  {speaker}")
```

## 사용 하 고

2026년 스택:

| Situation | Pick |
|-----------|------|
| Closed-set 1:1 verification, edge | ECAPA-TDNN + cosine threshold |
| Open-set verification, cloud | WavLM-SV + AS-norm |
| Diarization (meetings, podcasts) | `pyannote/speaker-diarization-3.1` |
| Anti-spoofing (replay / deepfake detection) | AASIST or RawNet2 |
| Tiny embedded (KWS + enrollment) | Titanet-Small (NeMo) |

## 함정

- **Channel mismatch.**VoxCeleb (웹 비디오) ≠ 전화 통화 오디오. 항상 목표 채널에서 평가합니다.
- **Short utterances.**EER는 시험 오디오의 3초 이하로 급격히 떨어진다.
- **Enrollment with noise.**한 번씩 험난한 입찰이 앵커를 독해줍니다.
- **Fixed threshold across conditions.**항상 목표 영역에서 걸린 개발 세트에 임계값을 조정하십시오.
- **Cosine on non-normalized embeddings.**L2를 먼저 정상화시키면 그 이상 크기가 지배한다.

## 선박

`outputs/skill-speaker-verifier.md`모형 선택, 등록 프로토콜, 임계 조정 계획, 사기 방지

## 운동

1. **Easy.**달아`code/main.py`. 합성 "스피커" (다양한 음향 프로파일) 를 만들고, 100쌍의 시험 목록에 EER를 등록하고 계산한다.
2. **Medium.**30개의 VoxCeleb1 발언에 SpeechBrain ECAPA를 사용 (개 5개의 스피커 × 6개) 하여 EER를 cosine와 PLDA를 사용하여 계산한다.
3. **Hard.**전체 등록을 작성하고, 일간지화하고, 파이프라인 확인을 통해`pyannote.audio`AMI 개발 시트에서 DER를 평가합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| EER | The headline metric | Threshold where False Accept = False Reject. |
| Verification | 1:1 | "Is this Alice?" |
| Identification | 1:N | "Who is speaking?" |
| Open-set | Unknown possible | Test set can contain unenrolled speakers. |
| Enrollment | Registering | Computing a speaker's reference embedding. |
| AAM-softmax | The loss | Softmax with additive angular margin; forces cluster separation. |
| PLDA | Classic scoring | Probabilistic LDA; likelihood-ratio scoring on top of embeddings. |
| DER | Diarization metric | Diarization Error Rate — miss + false alarm + confusion. |

## 더 많은 읽기

- [Snyder et al. (2018). X-Vectors: Robust DNN Embeddings for Speaker Recognition](https://www.danielpovey.com/files/2018_icassp_xvectors.pdf) 고전적인 심층 융합 종이
- [Desplanques et al. (2020). ECAPA-TDNN](https://arxiv.org/abs/2005.07143)2020~2026년 지배적인 건축물
- [Chen et al. (2022). WavLM: Large-Scale Self-Supervised Pre-Training for Full Stack Speech Processing](https://arxiv.org/abs/2110.13900) SV 및 일기화 위한 SSL 척추
- [Bredin et al. (2023). pyannote.audio 3.1](https://github.com/pyannote/pyannote-audio) 생산 일기화 + 임베디션 스택
- [VoxCeleb leaderboard (updated 2026)](https://www.robots.ox.ac.uk/~vgg/data/voxceleb/) 모델들 중 현재 EER 순위
