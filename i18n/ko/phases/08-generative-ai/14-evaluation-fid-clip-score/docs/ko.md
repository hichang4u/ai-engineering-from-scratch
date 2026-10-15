# 평가  FID, CLIP 점수, 인간 선호

> 모든 생성 모델 순위표는 FID, CLIP 점수, 그리고 인간 선호도 아레나에서 승률을 나타냅니다. 각 숫자는 결정된 연구자가 플레이 할 수있는 실패 모드를 가지고 있습니다. 실패 모드를 알지 못하면 게임 실행에서 실제 개선을 알 수 없습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 01 (Taxonomy), Phase 2 · 04 (Evaluation Metrics)
**Time:** ~45 minutes

## 문제

생성 모델은 * 샘플 품질* 및 * 조건화 준수*에 따라 평가됩니다. 둘 다 폐쇄형 측정이 없습니다. 모델은 10,000 개의 이미지를 렌더링해야합니다. 무언가가 숫자를 지정해야합니다. 모델 가족, 해상도, 건축물 전반에 걸쳐 숫자를 신뢰해야합니다. 2014-2026 롤렛에서 살아남은 세 가지 측정 사항은:

- **FID (Fréchet Inception Distance).**2개의 배포  실제와 생성  사이의 거리는 Inception 네트워크의 기능 공간에서 더 낮게 나선다.
- **CLIP score.**생성된 이미지의 CLIP 이미지 임베디션과 프롬프트의 CLIP 텍스트 임베디션 사이의 유사성. 더 높으면 더 좋습니다. 측정 prompt 준수.
- **Human preference.**두 모델이 같은 프롬프트에 맞붙고, 인간 (또는 GPT-4 클래스 모델) 이 더 나은 모델을 선택하여 Elo 점수를 합시다.

또한: IS (인시점, 대부분 은퇴), KID, CMMD, 이미지 리워드, 픽스코어, HPSv2, MJHQ-30k. 각각 이전 실패의 한 번의 수정입니다.

## 개념

![FID, CLIP, and preference: three axes, different failure modes](../assets/evaluation.svg)

### FID  샘플 품질

Heusel et al. (2017). 단계:

1. N 실제 이미지 및 N 생성된 이미지들을 위해 Inception-v3 (2048-D) 기능을 추출한다.
2. 각 풀에 가우시안을 넣고 평균을 계산합니다$\mu_r, \mu_g$그리고 동률$\Sigma_r, \Sigma_g$- 그래
3. $\text{FID} = \lVert \mu_r - \mu_g \rVert^2 + \mathop{\mathrm{Tr}}\left(\Sigma_r + \Sigma_g - 2 \cdot (\Sigma_r \cdot \Sigma_g)^{0.5}\right)$- 그래

해석: 특징 공간에서 두 가지 다변형 가우시안 사이의 프레체 거리는. 낮은 = 더 유사한 분포.

실패 모드:
- **Biased on small N.**FID는 특징 분포에 대한 평균 제곱입니다.$N \ge 10{,}000$- 그래
- **Inception-dependent.**이니세이션-v3는 이미지네트에서 훈련되었다. 이미지네트 (면, 예술, 텍스트 이미지) 에서 멀리 떨어진 도메인은 무의미한 FID를 생성합니다. 도메인 특정 기능 추출자를 사용합니다.
- **Gaming.**초기 초기에 너무 잘 맞게 적용하면 시각적 품질 향상 없이 FID가 낮아집니다.

### CLIP 점수  신속한 준수

Radford et al. (2021). 생성된 이미지 + 프롬프트:

```
clip_score = cos_sim( CLIP_image(x_gen), CLIP_text(prompt) )
```

30k에서 생성된 이미지들의 평균은 모델들 간의 비교 가능한 스케라를 나타냅니다.

실패 모드:
- **CLIP's own blind spots.**CLIP는 작성을 약하게 추론한다 ("নী란색 구석에 빨간 큐브"는 종종 실패한다). 모델들은 복잡한 명령어를 제대로 따르지 않고 CLIP 점수에 좋은 순위를 가질 수 있다.
- **Short prompt bias.**짧은 명령은 더 많은 CLIP 이미지 일치를 야생에서 가지고 있습니다. 더 긴 명령은 기계적으로 낮은 CLIP 점수를 가지고 있습니다.
- **Prompt gaming.**"고품질, 4k, 걸작"을 포함하면, 이미지- 텍스트 결합을 개선하지 않고 CLIP 점수를 부풀이합니다.

CMMD (Jayasumana et al., 2024) 는 이 중 일부를 수정합니다. 초기 대신 CLIP 기능을 사용하며, 프레체 대신 최대 평균 불일치성을 사용합니다. 미묘한 품질 차이를 감지하는 데 더 좋습니다.

### 인간의 선호도

A 모델과 B 모델로 생성하여 인간에게 (또는 강력한 LLM 판사) 에 쌍을 보여주십시오. 합 합 합 합하여 Elo 또는 브래들리-테리 점수를 얻습니다. 벤치마크:

- **PartiPrompts (Google)**: 1600개의 다양한 요청, 12개의 카테고리
- **HPSv2**: 10만 개의 인간 해설, 자동 대리로서 널리 사용된다.
- **ImageReward**: 137k 프롬프트 이미지 선호도 쌍 MIT 라이선스
- **PickScore**: 피크-아-픽 2.6M 선호도에 훈련받았습니다.
- **Chatbot-Arena-style image arenas**이 책:https://imagearena.ai/그리고 다른 사람들.

실패 모드:
- **Judge variance.**전문가 아닌 사람들은 전문가와 다른 선호를 가지고 있습니다. 둘 다 사용하세요.
- **Prompt distribution.**한 가족에게 좋은 지시를 내놓은 건 다 문서화해
- **LLM-judge reward hacking.**GPT-4 판사는 착한 결과로 속이는데

## 함께 사용

생산 평가 보고서에는 다음이 포함되어야 합니다.

1. 10~30k 샘플에 대한 FID ( 샘플 품질)
2. 같은 샘플에 대한 CLIP 점수/CMMD와 그 표본의 표본 (결합)
3. 맹인 경기장에서 전 모델에 비해 승률 (전반 선호)
4. 실패 모드 분석: 50개의 무작위로 샘플링된 출력, 알려진 문제점 (손 해부학, 텍스트 렌더링, 일관된 객체 수) 에 표시됩니다.

모든 단 하나의 측정값은 거짓말입니다. 세 가지 확인값 + 질적 검토는 주장입니다.

```figure
gx-fid-distributions
```

## 건설 해

`code/main.py`FID, CLIP 스코어와 Elo 집합을 합성 "특수 벡터"에 구현합니다. (우리는 4D 벡터를 시작 기능의 대충으로 사용합니다).

- 작은 N과 큰 N 에 대한 FID 계산 bias.
- "CLIP 점수"는 특징 풀 사이의 코시노 유사성입니다.
- 합성 선호도 스트림에서 Elo 업데이트 규칙

### 단계 1: 4 줄에 FID

```python
def fid(real_features, gen_features):
    mu_r, cov_r = mean_and_cov(real_features)
    mu_g, cov_g = mean_and_cov(gen_features)
    mean_diff = sum((a - b) ** 2 for a, b in zip(mu_r, mu_g))
    trace_term = trace(cov_r) + trace(cov_g) - 2 * sqrt_cov_product(cov_r, cov_g)
    return mean_diff + trace_term
```

### 단계 2: CLIP형 코시네 유사성

```python
def clip_like(image_feat, text_feat):
    dot = sum(a * b for a, b in zip(image_feat, text_feat))
    norm = math.sqrt(dot_self(image_feat) * dot_self(text_feat))
    return dot / max(norm, 1e-8)
```

### 단계 3: 에로 집합

```python
def elo_update(r_a, r_b, winner, k=32):
    expected_a = 1 / (1 + 10 ** ((r_b - r_a) / 400))
    actual_a = 1.0 if winner == "a" else 0.0
    r_a_new = r_a + k * (actual_a - expected_a)
    r_b_new = r_b - k * (actual_a - expected_a)
    return r_a_new, r_b_new
```

## 함정

- **FID at N=1000.**N=10k에서 유리스틱은 신뢰할 수 없습니다. N-FID가 낮은 논문들은 게임입니다.
- **Comparing FID across resolutions.**이니세이션의 299×299 크기는 기능 배포를 변경합니다.
- **Reporting one seed.**최소 3개의 씨앗을 고,
- **CLIP score inflation via negative prompts.**일부 파이프라인은 클립을 너무 많이 부착해서 증폭시켜야 합니다. 시각적 포화 여부를 확인하세요.
- **Elo bias from prompt overlap.**양 모델 모두 훈련 중에 벤치마크 을 본다면 Elo는 의미가 없습니다.
- **Human eval paid-crowd skew.**생산적인 MTurk 해설가들은 젊은 / 기술 친화적인 편입니다. 모집된 예술 / 디자인 전문가들과 섞어 보세요.

## 사용 하 고

2026년 생산 평가 프로토콜:

| Pillar | Minimum | Recommended |
|--------|---------|-------------|
| Sample quality | FID on 10k vs held-out real | + CMMD on 5k + FID on subset per category |
| Prompt adherence | CLIP score on 30k | + HPSv2 + ImageReward + VQA-style question answering |
| Preference | 200 blinded pairs vs baseline | + 2000 paired human + LLM-judge + Chatbot Arena |
| Failure analysis | 50 hand-flagged | 500 hand-flagged + automated safety classifier |

한 보고서의 네 가지 기둥 모두 = 주장. 한 가지만 = 마케팅.

## 선박

저장`outputs/skill-eval-report.md`. 스킬은 새로운 모델 체크포인트+기본선을 취하고 전체 평가 계획을 내놓습니다. 샘플 크기와 측정값, 실패 모드 탐사선, 서명 기준.

## 운동

1. **Easy.**달아`code/main.py`. 같은 합성 분포에서 N=100와 N=1000의 FID를 비교해 보세요.
2. **Medium.**합성 CLIP 스타일의 기능에서 CMMD를 구현하십시오 (프럼ୁଲ을 위해 Jayasumana et al., 2024 참조) 품질 차이와 FID에 대한 민감성을 비교하십시오.
3. **Hard.**HPSv2 설정을 복제: Pick-a-Pic의 하위 집합에서 1000 개의 이미지-프롬트 쌍을 가져가, 선호도에 따라 작은 CLIP 기반 점수를 세정하고, 유지된 집합과 일치하는 것을 측정합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| FID | "Fréchet Inception Distance" | Fréchet distance of Gaussian fits to real vs gen Inception features. |
| CLIP score | "Text-image similarity" | Cosine similarity between CLIP image and text embeddings. |
| CMMD | "FID's replacement" | CLIP-feature MMD; less biased, no Gaussian assumption. |
| IS | "Inception score" | Exp KL(p(y|x) || p(y)); correlates poorly on modern models, retired. |
| HPSv2 / ImageReward / PickScore | "Learned preference proxies" | Small models trained on human preferences; used as automatic judges. |
| Elo | "Chess rating" | Bradley-Terry aggregation of pairwise wins. |
| PartiPrompts | "The benchmark prompt set" | 1,600 Google-curated prompts across 12 categories. |
| FD-DINO | "Self-sup replacement" | FD using DINOv2 features; better for out-of-ImageNet domains. |

## 제작 메모: 평가도 추론 작업량입니다

10k 샘플에서 FID를 실행하는 것은 10k 이미지를 생성하는 것을 의미합니다. 단일 L4에서 50 단계 SDXL 기반에서 10242에서, 즉 ~ 11 시간 단번에 요청 추론입니다. 평가 예산은 실제이며 프레임은 정확히 오프라인 추론 시나리오입니다 (성량을 극대화하고 TTFT를 무시하십시오):

- **Batch hard, forget latency.**오프라인 eval = 메모리 안에 들어갈 수 있는 최대 크기의 정적 배팅. `pipe(...).images``num_images_per_prompt=8`80GB H100는 단일 요청보다 4~6배 더 빠른 벽 시계입니다.
- **Cache the real features.**실제 참조 집합에 대한 초기 (FID) 또는 CLIP (CLIP-score, CMMD) 기능 추출은 *once*로 실행되며,`.npz`- 평가에 따라 재회계하지 마십시오.

CI / 회귀 게이트: PR (~ 30 분) 에 500 샘플의 하위 집합에서 FID + CLIP 점수를 실행하십시오.

## 더 많은 읽기

- [Heusel et al. (2017). GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium (FID)](https://arxiv.org/abs/1706.08500) FID 종이
- [Jayasumana et al. (2024). Rethinking FID: Towards a Better Evaluation Metric for Image Generation (CMMD)](https://arxiv.org/abs/2401.09603) CMMD
- [Radford et al. (2021). Learning Transferable Visual Models from Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020) CLIP.
- [Wu et al. (2023). HPSv2: A Comprehensive Human Preference Score](https://arxiv.org/abs/2306.09341) HPSv2
- [Xu et al. (2023). ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation](https://arxiv.org/abs/2304.05977) 이미지 리워드
- [Yu et al. (2023). Scaling Autoregressive Models for Content-Rich Text-to-Image Generation (Parti + PartiPrompts)](https://arxiv.org/abs/2206.10789) 파티프롬프트
- [Stein et al. (2023). Exposing flaws of generative model evaluation metrics](https://arxiv.org/abs/2306.04675) 실패 모드 조사
