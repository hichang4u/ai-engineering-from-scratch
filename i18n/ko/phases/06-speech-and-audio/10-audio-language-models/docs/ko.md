# 오디오 언어 모델  Qwen2.5-Omni, 오디오 플라밍고, GPT-4o 오디오

> 2026 오디오 언어 모델은 음성 + 환경 소리 + 음악에 대해 논의를 한다. Qwen2.5-Omni-7B는 MMAU-Pro에서 GPT-4o 오디오와 일치한다. 오디오 플라밍고 다음은 롱아디오 벤치에서 Gemini 2.5 Pro를 제치고 있다. 오픈과 폐쇄 사이의 격차는 기본적으로 닫힌다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 12 · 03 (Vision-Language Models), Phase 7 · 10 (Audio Transformers)
**Time:** ~45 minutes

## 문제

5초의 오디오가 있습니다. 개가 비웃고, 누군가가 "정!"라고 외치는 후 침묵합니다. 유용한 질문은 여러 축을 뻗어 있습니다.

- **Transcription.**"무슨 말을 했습니까?"
- **Semantic reasoning.**"사람은 위험에 처해 있는가?"는 은 발음 + 외치 + 침묵을 공동으로 이해해야 합니다.
- **Music reasoning.**"어떤 악기들이 멜로디를 연주하는가?"
- **Long-audio retrieval.**"이 90분 강의에서 강사가 그라디언 하락을 설명한 곳은 어디?"

이 모든 질문에 하나의 요청으로 답하는 하나의 모델은**audio-language model**순수한 ASR에서 분리된: LALM는 단순히 기록이 아니라 자유형의 자연어 답변을 생산합니다.

## 개념

![Audio-language model: audio encoder + projector + LLM decoder](../assets/alm-architecture.svg)

### 3부 요소의 템플릿

2026년 LALM의 모든 경우 같은 골격이 있습니다.

1. **Audio encoder.**휘스퍼 코더 · BEATs · CLAP · WavLM · 또는 모델별 맞춤 코더
2. **Projector.**선형 또는 MLP 브리지링 오디오-코더 기능 LLM의 토큰 임베디션 공간에.
3. **LLM.**Llama / Qwen / Gemma 기반 디코더. 겹쳐진 텍스트 + 오디오 토큰을 가져옵니다. 텍스트를 생성합니다.

교육:

- **Stage 1.**냉장 코더 + LLM; ASR / 캡션 데이터에 대한 기차 프로젝터만.
- **Stage 2.**명령에 따라 오디오 작업 (QA, 추론, 음악 이해) 에 대한 완전한 / LoRA 미세 조정.
- **Stage 3 (optional).**음성 입력/ 음성 출력으로 음성 디코더를 추가합니다. Qwen2.5 Omni와 AF3 채팅은 이렇게 합니다.

### 2026년 모델 지도

| Model | Backbone | Audio encoder | Output modality | Access |
|-------|----------|---------------|-----------------|--------|
| Qwen2.5-Omni-7B | Qwen2.5-7B | Custom + Whisper | text + speech | Apache-2.0 |
| Qwen3-Omni | Qwen3 | Custom | text + speech | Apache-2.0 |
| Audio Flamingo 3 | Qwen2 | AF-CLAP | text | NVIDIA non-commercial |
| Audio Flamingo Next | Qwen2 | AF-CLAP v2 | text | NVIDIA non-commercial |
| SALMONN | Vicuna | Whisper + BEATs | text | Apache-2.0 |
| LTU / LTU-AS | Llama | CAV-MAE | text | Apache-2.0 |
| GAMA | Llama | AST + Q-Former | text | Apache-2.0 |
| Gemini 2.5 Flash/Pro (closed) | Gemini | proprietary | text + speech | API |
| GPT-4o Audio (closed) | GPT-4o | proprietary | text + speech | API |

### 벤치마크 실체 확인 (2026)

**MMAU-Pro.**1800 QA 쌍, 음성/음성/음악/믹스. 다중 오디오 하위 집합 포함.

| Model | Overall | Speech | Sound | Music | Multi-audio |
|-------|---------|--------|-------|-------|-------------|
| Gemini 2.5 Pro | ~60% | 73.4% | 51.9% | 64.9% | ~22% |
| Gemini 2.5 Flash | ~57% | 73.4% | 50.5% | 64.9% | 21.2% |
| GPT-4o Audio | 52.5% | — | — | — | 26.5% |
| Qwen2.5-Omni-7B | 52.2% | 57.4% | 47.6% | 61.5% | ~20% |
| Audio Flamingo 3 | ~54% | — | — | — | — |
| Audio Flamingo Next | SOTA on LongAudioBench | — | — | — | — |

**multi-audio column is damning for everyone.**4 옵션 복수 선택의 무작위 확률 = 25%; 대부분의 모델은 그 주위에 점수를 얻습니다. LALMs는 여전히 두 클립을 비교하기 위해 어려움을 겪고 있습니다.

### 2026년에 LALM가 유용할 때

- **Compliance audit of call-center recordings.**"대리인은 필요한 공개를 언급했나요?"
- **Accessibility.**청각 장애인 사용자 (번역만 하는 것이 아니라) 에게 음향 현상을 설명해 주십시오.
- **Content moderation.**폭력적인 언어 + 위협적인 음향 + 배경 맥락을 감지합니다.
- **Podcast / meeting chaptering.**의미적 요약, 단순히 스피커 회전이 아닙니다.
- **Music catalog analysis.**"B-부문 키 변경으로 모든 트랙을 찾아라".

### (아직) 유용하지 않은 곳

- 미세한 음악 이론 (합음 수준 아래)
- 긴 대화 (10분 후의 수치가) 에 대해 연설자에서 설명하는 추론
- 복수 오디오 비교 (22-26%) 는 무작위로 거의 올라가지 않는다.
- 실시간 스트리밍 추론 (대부분은 오프라인 배트 추론)

```figure
v4-alm-tokens
```

## 건설 해

### 단계 1: Qwen2.5-Omni를 검색

```python
from transformers import AutoModelForCausalLM, AutoProcessor

processor = AutoProcessor.from_pretrained("Qwen/Qwen2.5-Omni-7B")
model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-Omni-7B", torch_dtype="auto")

audio, sr = load_wav("clip.wav", sr=16000)
messages = [{
    "role": "user",
    "content": [
        {"type": "audio", "audio": audio},
        {"type": "text", "text": "What sounds do you hear, and what's happening?"},
    ],
}]
inputs = processor.apply_chat_template(messages, tokenize=True, return_tensors="pt")
output = model.generate(**inputs, max_new_tokens=200)
print(processor.decode(output[0], skip_special_tokens=True))
```

### 단계 2: 프로젝터 패턴

```python
import torch.nn as nn

class AudioProjector(nn.Module):
    def __init__(self, audio_dim=1280, llm_dim=4096):
        super().__init__()
        self.down = nn.Linear(audio_dim, llm_dim)
        self.act = nn.GELU()
        self.up = nn.Linear(llm_dim, llm_dim)

    def forward(self, audio_features):
        return self.up(self.act(self.down(audio_features)))
```

프로젝터는 보통 1-3개의 선형 층으로 구성되어 있습니다. ASR 쌍 (audio → transcript) 에 훈련시키는 것은 스테이지-1의 변명 작업입니다.

### 단계 3: MMAU / LongAudioBench의 벤치마킹

```python
from datasets import load_dataset
mmau = load_dataset("gamma-lab-umd/MMAU-Pro", split="test")
mcq = mmau.filter(lambda item: len(item["choices"] or []) > 1)

correct = 0
for item in mcq:
    answer = call_model(item["audio_path"], item["question"], item["choices"])
    if answer == item["answer"]:
        correct += 1
print(f"Accuracy: {correct / len(mcq):.3f}")
```

`audio_path`데이터 세트 repo의 포인트를 `data.zip`(약 47GB) 를 다운로드하고 칩을 해제하기 전에 이 정확한 일치 루프는 기준점수표가 아니라 정신의 검증입니다. 따라서 그 숫자는 발표된 MMAU-Pro 결과와 비교할 수 없습니다. 공식 평가자는 유사성을 함축하여 여러 선택의 답변을 일치시킵니다 (NV-Embed-v2), LLM 판사와 함께 개방된 답변을 평가하고, 명령에 따라 응답을 regex 규칙으로 확인합니다.`model_output`열 및 실행`evaluate_mmau_pro_comprehensive.py`[MMAU-Pro repo](https://github.com/sonalkum/MMAUPro)각자의 보고서를`category`(소리, 소리, 음악, 멀티, 그리고 그 외) 별도로. 집합적인 숫자는 모델이 실패하는 곳을 숨기죠.

## 사용 하 고

| Task | 2026 pick |
|------|-----------|
| Free-form audio QA (open) | Qwen2.5-Omni-7B |
| Best open on long audio | Audio Flamingo Next |
| Best closed | Gemini 2.5 Pro |
| Voice-in / voice-out agent | Qwen2.5-Omni or GPT-4o Audio |
| Music reasoning | Audio Flamingo 3 or 2 (music-specialized AF-CLAP) |
| Call-center audit | Gemini 2.5 Pro via API, with RAG over your policy docs |

## 함정

- **Over-trust on multi-audio.**만약 당신의 작업이 "어떤 클립이 X를 가지고 있는지"를 필요로 한다면,
- **Long-audio degradation.**10분 후 대부분의 모델의 스피커 속성은 끊어집니다. 먼저 다이어리 (강좌 6) 를 작성하고, 그 다음 요약합니다.
- **Hallucinations on silence.**Whisper 에너소리 어코더를 사용하는 LALM에서 물려받은 Whisper 스타일의 문제입니다.
- **Benchmark cherry-picking.**판매자 블로그 게시물은 최고의 사례를 강조합니다. MMAU-Pro 멀티 오디오 서브셋을 직접 실행하십시오.

## 선박

`outputs/skill-alm-picker.md`. 주어진 오디오 이해 작업에 LALM+ 벤치마킹 하위 집합+ 출력 모다리티 ( 텍스트와 음성) 를 선택하십시오.

## 운동

1. **Easy.**달아`code/main.py`장난감 프로젝터 패턴 + 가짜 LALM 라우팅 (음성 삽입, 텍스트 토큰) → 출력 토큰을 보기
2. **Medium.**100개의 MMAU-Pro 연설 항목에 Qwen2.5 오мни-7B를 점수하고, 논문의 보고된 숫자와 비교해 보세요.
3. **Hard.**최소의 오디오 캡션 기반을 구축하십시오: BEATs 코더 + 2층 프로젝터 + 얼린 Llama-3.2-1B. 오디오캡스에서 프로젝터를만 정렬하십시오. 클로토-AQA에서 SALMONN과 비교하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| LALM | Audio ChatGPT | Audio encoder + projector + LLM decoder. |
| Projector | Adapter | Small MLP mapping audio features into LLM embedding space. |
| MMAU | The benchmark | 10k audio-QA pairs across speech, sound, music. |
| MMAU-Pro | Harder MMAU | 1800 multi-audio / reasoning-heavy questions. |
| LongAudioBench | Long-form eval | Multi-minute clips with semantic queries. |
| Voice-in / voice-out | Speech-native | Model ingests speech and emits speech without text detour. |

## 더 많은 읽기

- [Chu et al. (2024). Qwen2-Audio](https://arxiv.org/abs/2407.10759) 참조 건축물
- [Alibaba (2025). Qwen2.5-Omni](https://huggingface.co/Qwen/Qwen2.5-Omni-7B) 연설-연언-연언-연언
- [NVIDIA (2025). Audio Flamingo 3](https://arxiv.org/abs/2507.08128) 오픈 장 음향 리더
- [NVIDIA (2026). Audio Flamingo Next](https://arxiv.org/abs/2604.10905) 롱아디오 벤치 SOTA
- [Tang et al. (2023). SALMONN](https://arxiv.org/abs/2310.13289) 이중 앵코더 선구자
- [MMAU-Pro leaderboard](https://sonalkum.github.io/mmau-pro/) 2026년 라이브 순위
