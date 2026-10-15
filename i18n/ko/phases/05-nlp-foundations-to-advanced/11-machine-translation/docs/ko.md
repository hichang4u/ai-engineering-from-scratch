# 기계 번역

> 번역은 NLP 연구에 30년간 비용을 지불한 작업이고 지금도 계속 지불하고 있습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 10 (Attention Mechanism), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 minutes

## 문제

모델은 한 언어로 문장을 읽고 다른 언어로 문장을 생성합니다. 길이는 달라집니다. 단어 순서는 달라집니다. 일부 소스 단어들은 여러 표적 단어로 지도를 만듭니다. 그리고 반대로. 어휘는 하나-하나 지도를 거부합니다. 프랑스어로 "I miss you"는 "tu me manques"입니다. 문자 그대로 "당신은 나에게 부족합니다". 단어 수준 조정은 그 이상으로 살아남지 않습니다.

기계 번역은 NLP가 코더-독호기, 관심, 변환기, 그리고 결국 LLM 패러다임 전체를 발명하도록 강요한 작업입니다. 모든 단계가 진행되었습니다. 번역 품질은 측정 가능하고 인간과 기계 사이의 격차는 거친 것이기 때문입니다.

이 수업은 역사 수업을 건너뛰고 2026년의 작업 파이프라인을 가르칩니다. 사전 훈련된 다국어 앵코더-독호더 (NLLB-200 또는 mBART), 하위 단어 토큰화, 빔 검색, BLEU 및 chrF 평가, 그리고 아직까지 생산에 전달되지 않은 몇 가지 실패 모드.

## 개념

![MT pipeline: tokenize → encode → decode with attention → detokenize](../assets/mt-pipeline.svg)

현대 MT는 병렬 텍스트에 훈련된 트랜스포머 코더-독호기입니다. 코더는 언어의 토큰화에서 소스를 읽습니다. 디코더는 한 번에 하나의 하위 단어를 사용하여 코더의 출력을 통해 크로스 주의를 통해 생성합니다. (10 수업). 디코딩은 탐욕적인 디코딩 함정을 피하기 위해 빔 검색을 사용합니다. 출력은 디토케니화되고, 파괴되고, 참조에 대한 점수를 얻습니다.

3가지 운영 선택은 실제 세계 MT 품질을 촉진합니다.

- **Tokenizer.**SentencePiece BPE는 혼합 언어 코퍼스에서 훈련되었습니다. 언어 간 공유 된 어휘는 NLLB에서 제로 샷 쌍을 가능하게합니다.
- **Model size.**NLLB-200 디스틸 600M는 노트북에 적합합니다. NLLB-200 3.3B는 출판 된 생산 기본입니다. 54.5B는 연구 천장입니다.
- **Decoding.**일반 콘텐츠에선선 4~5선 빔 너비, 너무 짧은 출력을 피하기 위해 길이를 처벌, 용어 일관성이 필요할 때 제한된 디코딩

```figure
seq2seq-alignment
```

## 건설 해

### 단계 1: 미리 훈련된 MT 호출

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_id = "facebook/nllb-200-distilled-600M"
tok = AutoTokenizer.from_pretrained(model_id, src_lang="eng_Latn")
model = AutoModelForSeq2SeqLM.from_pretrained(model_id)

src = "The cats are running."
inputs = tok(src, return_tensors="pt")

out = model.generate(
    **inputs,
    forced_bos_token_id=tok.convert_tokens_to_ids("fra_Latn"),
    num_beams=5,
    length_penalty=1.0,
    max_new_tokens=64,
)
print(tok.batch_decode(out, skip_special_tokens=True)[0])
```

```text
Les chats courent.
```

여기서 중요한 것은 세 가지가 있습니다.`src_lang`토큰라이저에 어떤 스크립트와 세그먼트를 적용해야 하는지 알려줍니다. `forced_bos_token_id`두 가지 모두 NLLB 특수한 트릭입니다. mBART와 M2M-100는 자체 컨벤션을 사용하고 교환이 불가능합니다.

### 단계 2: BLEU 및 chrF

BLEU는 출력과 참조 사이의 n-그램 초복을 측정한다. 네 개의 참조 n-그램 크기가 (1-4), 정확성의 기하학적 평균, 너무 짧은 출력에 대한 단축 형벌. 점수는 [0, 100]이다. 일반적으로 사용된다. 해석에 좌절하다: 30 BLEU는 "이용가능"; 40는 "좋은"; 50는 "특수한"; 1 BLEU 이하의 차이점은 잡음이다.

chrF는 문자 수준 F 점수를 측정합니다. BLEU 미흡수와 일치하는 형상학적으로 풍부한 언어에 더 민감합니다. 종종 BLEU와 함께 보고됩니다.

```python
import sacrebleu

hypotheses = ["Les chats courent."]
references = [["Les chats courent."]]

bleu = sacrebleu.corpus_bleu(hypotheses, references)
chrf = sacrebleu.corpus_chrf(hypotheses, references)
print(f"BLEU: {bleu.score:.1f}  chrF: {chrf.score:.1f}")
```

항상 사용하세요`sacrebleu`그것은 토큰화를 정상화하여 논문마다 점수가 비교될 수 있습니다. 자신의 BLEU 계산을 롤하는 것은 잘못된 기준이 일어나는 방법입니다.

### 3단계 평가 계층 (2026)

현대 MT 평가에서는 세 개의 상호 보완적인 메트릭 가족들을 사용한다. 적어도 두 개의 배가 있습니다.

- **Heuristic**(BLEU, chrF) 빠른, 참조 기반, 해석 가능, 패라프라스에 민감하지 않습니다.
- **Learned**(COMET, BLEURT, BERTScore) 인간 판단에 의해 훈련된 신경 모델; 출처와 참조에 대한 번역의 의미적 유사성을 비교한다. COMET는 2023 년 이후 MT 연구와 가장 높은 연관성을 가지고 있으며 품질이 중요시되는 2026 년 생산 기본입니다.
- **LLM-as-judge**( 참조 없이) 번역의 유창성, 적정성, 음색, 문화적 적합성 등에 대한 점수를 얻기 위한 대규모 모델을 촉진합니다. GPT-4-as-judge는 Rubric이 잘 설계된 경우 ~ 80%의 인간 동의에 해당합니다. 참조가 없는 오픈 엔딩 콘텐츠를 위해 사용하십시오.

실질적인 2026 스택:`sacrebleu`BLEU와 chrF에 대해`unbabel-comet`COMET에 대한, 그리고 최종 인체 표면 신호를 위한 촉구 LLM. 생산 데이터에 의존하기 전에 인간 표기된 50-100 예제에 대한 모든 매트릭을 캘리버링.

참조 없는 측정 (COMET-QE, BLEURT-QE, LLM-as-judge) 은 참조 없이 번역을 평가할 수 있게 해줍니다.

### 3단계: 생산에서 장애가 있는 것

위의 작업 파이프라인은 80%의 경우 순수하게 번역하고 나머지 20%는 침묵으로 실패합니다.

- **Hallucination.**모델은 소재에 없는 콘텐츠를 발명한다. 익숙하지 않은 도메인 어휘에서 흔히 볼 수 있다. 증상: 출력은 유창하지만 소스가 밝히지 않은 사실을 주장한다. 완화: 도메인 용어에 대한 제한적 디코딩, 규제된 콘텐츠에 대한 인간 검토, 출력을 입력보다 훨씬 더 긴 모니터링.
- **Off-target generation.**모델은 잘못된 언어로 번역됩니다. NLLB는 드문 언어 쌍에서 놀랍도록 유해합니다. 완화: 확인 `forced_bos_token_id`항상 출력 시어 ID 모델 체크로 디코딩합니다.
- **Terminology drift.**"Sign up"는 doc 1에서 "s'inscribe"와 doc 2에서 "creer un compte"로 바뀌게 됩니다. UI 텍스트와 사용자 대 한 문자열에 있어서, 순환성은 원료 품질보다 중요합니다. 완화: 글자리 제한된 디코딩 또는 편집 후 사전.
- **Formality mismatch.**프랑스어 "tu"와 "vous", 일본어 예의 수준. 모델은 훈련에서 더 일반적인 형태를 선택합니다. 고객-전면 콘텐츠에 대해서는 일반적으로 잘못된 것입니다. 완화: 모델이 지원하는 경우 형식성 토큰과 함께 미리 표시하거나, 공식적인 코퍼스에서 작은 모델을 미세하게 조정합니다.
- **Length explosion on short input.**매우 짧은 입력 문장은 종종 길이가 길어지는 번역을 만들어냅니다. 길이가 길이가 5개의 소스 토큰 이하의 절벽에서 떨어지기 때문에. 완화: 원천 길이에 비례하는 하드 최대 길이의 캡.

### 단계 4: 도메인에 대한 정렬

사전 훈련 받은 모델들은 일반주의자입니다. 법률, 의학 또는 게임 대화 번역은 도메인 병렬 데이터에 미세한 조정을 통해 측정 가능한 이익을 얻습니다.

```python
from transformers import Trainer, TrainingArguments
from datasets import Dataset

pairs = [
    {"src": "The defendant pleaded guilty.", "tgt": "L'accusé a plaidé coupable."},
]

ds = Dataset.from_list(pairs)


def preprocess(ex):
    return tok(
        ex["src"],
        text_target=ex["tgt"],
        truncation=True,
        max_length=128,
        padding="max_length",
    )


ds = ds.map(preprocess, remove_columns=["src", "tgt"])

args = TrainingArguments(output_dir="out", per_device_train_batch_size=4, num_train_epochs=3, learning_rate=3e-5)
Trainer(model=model, args=args, train_dataset=ds).train()
```

몇 천 개의 수준 높은 병렬 예제들은 몇 백 천 개의 험난한 웹 스크래프 예제를 능가한다. 훈련 데이터의 질은 단일 생산의 가장 큰 레버이다.

## 사용 하 고

MT의 2026 생산 스택:

| Use case | Recommended starting point |
|---------|---------------------------|
| Any-to-any, 200 languages | `facebook/nllb-200-distilled-600M` (laptop) or `nllb-200-3.3B` (production) |
| English-centric, high quality, 50 languages | `facebook/mbart-large-50-many-to-many-mmt` |
| Short runs, cheap inference, English-French/German/Spanish | Helsinki-NLP / Marian models |
| Latency-critical browser-side | ONNX-quantized Marian (~50 MB) |
| Maximum quality, willing to pay | GPT-4 / Claude / Gemini with translation prompts |

2026년부터는 여러 언어 쌍에서 전문 MT 모델을 능가하고 있습니다. 특히 어휘적 내용과 긴 맥락에서. 타협은 토큰 비용과 지연입니다. 맥락 길이가, 스타일리틱 일관성 또는 도메인 적응을 통해 처리량보다 더 많은 사항을 촉구하는 경우 LLM를 선택하십시오.

## 선박

`outputs/skill-mt-evaluator.md`이 부분의 본문은

```markdown
---
name: mt-evaluator
description: Evaluate a machine translation output for shipping.
version: 1.0.0
phase: 5
lesson: 11
tags: [nlp, translation, evaluation]
---

Given a source text and a candidate translation, output:

1. Automatic score estimate. BLEU and chrF ranges you would expect. State whether a reference is available.
2. Five-point human-verifiable check list: (a) content preservation (no hallucinations), (b) correct language, (c) register / formality match, (d) terminology consistency with glossary if provided, (e) no truncation or length explosion.
3. One domain-specific issue to probe. E.g., for legal: named entities and statute citations. For medical: drug names and dosages. For UI: placeholder variables `{name}`.
4. Confidence flag. "Ship" / "Ship with review" / "Do not ship". Tie to the severity of issues found in step 2.

Refuse to ship a translation without a language-ID check on output. Refuse to evaluate without a reference unless the user explicitly opts in to reference-free scoring (COMET-QE, BLEURT-QE). Flag any content over 1000 tokens as likely needing chunked translation.
```

## 운동

1. **Easy.**5 문장 영어 문장을 프랑스어로 번역하고 다시 영어로 번역하여 `nllb-200-distilled-600M`다시 돌아가는 여행이 원본에 얼마나 가깝는지 측정해 보세요. 단어 선택의 추동으로 의미 보존을 볼 수 있습니다.
2. **Medium.**번역 출력에서 언어 아이디 확인을 실시하여 `fasttext lid.176`또는`langdetect`MT 호출에 통합하여 타겟 밖의 세대가 돌아오는 전에 잡히게 됩니다.
3. **Hard.**미세한 조율`nllb-200-distilled-600M`5000 쌍의 도메인 코퍼스에서 선택하세요. 미세조정 전과 후에 수직된 세트에서 BLEU를 측정하세요. 어떤 문장의 종류가 개선되고 어떤 문장이 퇴행했는지 보고하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BLEU | Translation score | N-gram precision with brevity penalty. [0, 100]. |
| chrF | Character F-score | Character-level F-score. More sensitive for morphologically rich languages. |
| NMT | Neural MT | Transformer encoder-decoder trained on parallel text. The 2017+ default. |
| NLLB | No Language Left Behind | Meta's 200-language MT model family. |
| Constrained decoding | Controlled output | Force specific tokens or n-grams to appear / not appear in the output. |
| Hallucination | Invented content | Model output that is not supported by the source. |

## 더 많은 읽기

- [Costa-jussà et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation](https://arxiv.org/abs/2207.04672) NLLB 논문
- [Post (2018). A Call for Clarity in Reporting BLEU Scores](https://aclanthology.org/W18-6319/)왜?`sacrebleu`BLEU를 보고하는 유일한 올바른 방법입니다.
- [Popović (2015). chrF: character n-gram F-score for automatic MT evaluation](https://aclanthology.org/W15-3049/) chrF 종이
- [Hugging Face MT guide](https://huggingface.co/docs/transformers/tasks/translation) 실제적인 미세조절 통행
