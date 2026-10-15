# Emu3: 이미지 및 비디오 생성에 대한 다음 도크 예측

> BAAI의 Emu3 (Wang et al., 2024년 9월) 는 2024년 결과를 통해 전파와 자율적 침체 논쟁을 끝낼 수 있었다. 다음 토큰 예측 목표에만 훈련된 단일 라마 스타일의 디코더 전용 트랜스퍼머, 텍스트 + VQ 이미지 토큰 + 3D VQ 비디오 토큰의 통일된 어휘를 통해, 이미지 생성에서 SDXL와 인식에서 LLaVA-1.6를 이긴다. CLIP 손실이 없습니다. 방출 시간표가 없습니다. 분류자 없는 가이드라인은 품질을 추론하는 데 사용됩니다. 그러나 핵심 교육 목표는 교사 강제로 다음 토큰 예측입니다. 네이처지에 출판되었습니다. 이 수업은 Emu3 논문을 읽습니다. 왜 더 나은 토케니저 + 스케일이 필요한지

**Type:** Learn
**Languages:** Python (stdlib, 3D video tokenizer math + autoregressive sampler skeleton)
**Prerequisites:** Phase 12 · 11 (Chameleon)
**Time:** ~120 minutes

## 학습 목표

- 왜 Emu3의 단일 손실 다음 토큰 목표가 이미지의 품질을 위해 전파가 필요하다는 오래전 가정에도 불구하고 작동하는지 설명하십시오.
- 3D 비디오 토케니저: 공간 시간 VQ 코드북이 어떻게 생겼는지, 패치가 왜 시간적 기간을 지탱하는지 설명하십시오.
- Emu3와 Stable Diffusion XL를 비교해 보세요 (훈련 계산, 추론 비용, 품질 천장).
- 동일한 Emu3 모델이 수행하는 세 개의 역할을 명명하십시오: Emu3-Gen ( 이미지 gen), Emu3-Chat (감각), Emu3-Stage2 (비디오 gen).

## 문제

2024년까지의 일반적인 지혜: 이미지 생성은 전파가 필요합니다. 주장: 디스크릿 이미지 토큰은 세부 사항을 재구성하기 위해 너무 많은 정보를 잃게 되고, 자동 퇴행 샘플링은 수천 개의 토큰에서 오류를 축적합니다. 안정화 디프루전, DALL- E 3, Imagen, Midjourney 모두 어떤 형태의 디프루션을 사용합니다. 샤멜레온 (강좌 12.11) 은 소규모에서 이 사실을 부분적으로 부인했지만 품질에 대해서는 SDXL와 일치하지 않았다.

Emu3는 이 논의를 직접 공격했습니다. 주장: 더 나은 시각적 토케니저 + 충분한 규모 + 다음 토큰 손실 = 인식도하는 동일한 모델에서 전파-비팅 이미지 생성.

이 베팅은 발표 당시 논란이 많았다. 두 년 후, 오픈소스 통일 세대 가족 (Emu3, Show-o, Janus-Pro, Transfusion) 은 연구의 기본 경로입니다. 생산 경계 모델은 어떤 변형을 사용하는 것으로 보입니다.

## 개념

### Emu3 토케니저

주요 성분은 시각적 토큰이 됩니다. Emu3는 토큰당 8x8 해상도 감소로 사용자 지정 IBQ 클래스 토큰 (Inverse Bottleneck Quantizer, SBER-MoVQGAN 가족) 을 훈련시킵니다. 512x512 이미지는 32768 코드북 크기의 64x64 = 4096 토큰으로 됩니다.

이것은 512x512에 대한 샤멜레온의 1024 토큰보다 크지만, 토큰당 가격이 저렴하다 (코드북 검색이 작고, 코덱이 단순하다).

비디오: 3D VQ 토큰화는 공간 시간 패치를 (4x4x4 피클) 한 정수로 암호화한다. 8 FPS의 4s 클립은 32 프레임이 있다. 4x 공간 및 4x 시간적 감소로 256x256에서 토큰 수는 (256/4) * (256/4) * (32/4) = 64 * 64 * 8 = 32,768 토큰이다.

토큰화질은 천장입니다. Emu3의 기여는 부분적으로 "우리는 매우 좋은 토큰화질을 훈련 시켰습니다".

### 단독 손실 훈련

Emu3는 하나의 목표를 사용한다. 다음 토큰 예측은 텍스트 토큰, 2D 이미지 토큰, 3D 비디오 토큰에서 공유된 어휘에 대한 것입니다. 훈련 중에 무게는 양성 특수한 요인에 의해 배배됩니다. 그러나 손실 기능은 동일합니다.

다음의 혼합물들을 이용한 열차:
- 이미지 주체: `<text caption> <image> image_tokens </image>`
- 이미지 인식: `<image> image_tokens </image> <question> text_tokens`
- 비디오 젠: `<text caption> <video> video_tokens </video>`
- 비디오 인식: 유사
- 텍스트만: 표준 NTP

모델은 데이터 배포에서 이미지 토큰과 텍스트 토큰을 언제 발사해야 하는지 학습합니다.`<image>`태그

### 분류자 없는 가이드 및 온도

오토레그레시브 이미지 생성은 추론에서 분류자 없는 가이드 (CFG) 를 사용하면 훨씬 더 좋습니다. Emu3는 그것을 사용합니다: 두 번 생성, 한 번 전체 캡션, 한 번 빈 캡션, 로지트를 가이드 웨이트 (정상적인 3.0-7.0) 로 혼합합니다. 이것은 오토레그레시브 설정에서 빌려온 CFG 트릭 디프루지션 사용과 동일합니다.

온도는 중요해요. 너무 높고, 유물, 너무 낮고, 모드 붕괴. Emu3의 권장 온도는 1.0입니다.

### 3개의 역할, 1개의 모델

Emu3 선박은 기능적으로 다른 3개의 API이지만 기본 중량 집합으로:

- Emu3gen 이미지 생성 입력 텍스트, 출력 이미지 토큰
- Emu3-Chat, VQA 및 캡션, 입력 이미지 (토큰), 출력 텍스트
- Emu3- 스테이지2. 비디오 생성 및 비디오 VQA. 입력 텍스트 또는 비디오, 출력 텍스트 또는 비디오.

작업별 헤드 없이 다른 템플릿, 같은 체크포인트

### 기준

Emu3 논문 (2024년 9월) 에서:

- 이미지 생성: MJHQ-30K FID (5.4 vs 5.6) 에 SDXL를 제치고, 전체적으로 GenEval (0.54 vs 0.55  통계적 밸류에이브) 와 Deep-Eval의 복합적 평형에 능가한다.
- 이미지 인식: VQAv2 (75.1 vs 72.4) 에서 LLaVA-1.6를 제치고 MMMU에서 대략 일치합니다.
- 비디오 생성: 4초의 클립 품질, 경쟁력 있는 FVD와 Sora 시대의 공개 벤치마크 모델.

숫자는 항상 승리하지 않습니다  Emu3는 여기서 포인트를 그 곳에서  하지만 "다음 토큰 예측은 당신이 필요로하는 모든 것"이라는 주장은 모다리들 모두에서 방어됩니다.

### 계산 비용

Emu3는 7B 파라미터 모델로 약 300억 개의 멀티모달 토큰에서 훈련되었다. GPU 시간들은 Llama-2-7B 사전 훈련 (2k-4k GPU 년 A100급 실리콘) 과 비교된다.

추론에서, Emu3는 이미지당 SDXL보다 느리므로: 30 tok/s에서 4096 이미지 토큰은 512x512 이미지당 ~2분, SDXL에 2-5초입니다. 추측적 디코딩과 KV 캐시 최적화는 격차를 좁히지만 닫지 않습니다. Autoregressive image gen는 계산이 무거운 것입니다. 이것은 상임 트레이드 오프입니다.

### 왜 중요 합니까?

Emu3의 깊은 기여는 개념적입니다. 다음 토큰 예측 스칼이 이미지 생성에서 전파와 일치한다면, 통일 모델 경로가 (하나의 손실, 한 척추, 어떤 모달리티) 가 실행 가능합니다. 미래의 모델에는 별도의 텍스트 코더, 별도의 전파 스케줄러, 별도의 VAEs가 필요하지 않습니다. 한 트랜스포머, 한 모달리티, 규모에 대한 토큰이زر.

쇼오, 자누스 프로, 인테르블리-유 등이 모두 이 논문을 기반으로 하고 도전한다. 중국 연구소 (BAAI, 딥시크) 는 2025년까지 미국 연구소보다 이 방향으로 더 적극적으로 발표한다.

```figure
l5-emu3-next-token
```

## 사용 하 고

`code/main.py`두 개의 장난감 조각을 만듭니다:

- 2D vs 3D VQ 토큰 계산기: 주어진 (상화, 패치, 클립_장, FPS), 이미지 vs 비디오의 계산 토큰 계산.
- 온도에서 분류자 없는 자동 퇴행성 이미지 토큰 샘플러

CFG 구현은 Emu3의 레시피와 일치합니다  조건부 및 무조건적인 로지트를 가이드 웨이트로 혼합합니다.

## 선박

이 교훈은`outputs/skill-token-gen-cost-analyzer.md`. 생성 제품 스펙 ( 이미지 또는 비디오, 목표 해상도, 품질 계층, 지연 예산) 을 고려하면 토큰 수, 추론 비용 및 Emu3 가족 vs 전파를 선택합니다.

## 운동

1. Emu3는 512x512 이미지당 8x8 감소로 4096 토큰을 생성합니다. 1024x1024 및 2048x2048에 대한 동등한 계산을합니다. 추론 지연은 어떻게 될까요?

2. 비디오 토케니저에 있는 Emu3 3.3 섹션을 읽어 보세요. 3D VQ 패치 모양을 설명하고 왜 8x8x1가 아닌 4x4x4가 되는지를 설명하세요.

3. 분류자 없는 가이드 웨이트 5.0 vs 3.0: 어떤 시각 효과?`code/main.py`- 그래

4. Emu3-7B에 대한 FLOP를 계산하여 300B 토큰에 비교하고 안정적인 디프루션 3에 비교하십시오.

5. Emu3는 FID에 SDXL를 제치고 VQAv2에 비해 전문적인 VLM에 비해 그렇지 않습니다. 왜 통합 손실 접근 방식이 다른 기준에 비해 전문가들의 강점을 다른 것으로 나타낸지를 설명하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Next-token prediction | "NTP" | Standard autoregressive loss: predict token[i+1] given token[0..i]; works for every modality when tokenized |
| IBQ tokenizer | "Inverse bottleneck quantizer" | A class of VQ-VAE with larger codebooks (32768+) and better reconstruction than Chameleon's |
| 3D VQ | "Spatiotemporal quantizer" | Codebook indexed by (time, row, col); one token covers a 4x4x4 pixel cube |
| Classifier-free guidance | "CFG" | Mix conditional and unconditional logits with weight gamma; boosts image quality at inference |
| Unified vocabulary | "Shared tokens" | Text + image + video all draw from the same integer space; model predicts whichever modality comes next |
| MJHQ-30K | "Image gen benchmark" | Midjourney-quality benchmark with 30k prompts; Emu3 reports FID here |

## 더 많은 읽기

- [Wang et al. — Emu3: Next-Token Prediction is All You Need (arXiv:2409.18869)](https://arxiv.org/abs/2409.18869)
- [Sun et al. — Emu: Generative Pretraining in Multimodality (arXiv:2307.05222)](https://arxiv.org/abs/2307.05222)
- [Liu et al. — LWM (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Yu et al. — MAGVIT-v2 (arXiv:2310.05737)](https://arxiv.org/abs/2310.05737)
- [Tian et al. — VAR (arXiv:2404.02905)](https://arxiv.org/abs/2404.02905)
