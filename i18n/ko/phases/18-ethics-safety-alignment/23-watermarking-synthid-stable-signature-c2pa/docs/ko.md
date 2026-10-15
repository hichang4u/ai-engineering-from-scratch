# 워터마크  SynthID, 안정된 서명, C2PA

> 세 가지 기술 구조 2026 인공지능 생성 콘텐츠 출처. SynthID (Google DeepMind)  이미지 워터마크가 2023년 8월 출시되었으며, 텍스트+비디오 2024년 5월 (Gemini + Veo), 텍스트 오픈소스 2024년 10월 책임자 GenAI 툴킷을 통해 공개되었습니다. 텍스트 워터마크는 다음 토큰 샘플링 확률을 눈에 띄지 않게 조정합니다. 이미지/비디오 워터마크는 압축, 절단, 필터, 프레임 속도 변경을 생존합니다. 안정된 서명 (Fernandez et al., ICCV 2023, arXiv:2303.15435)  잠정 디스푸시온 디코더를 미세하게 조정하여 모든 출력에는 고정된 메시지가 포함되어 있습니다. 후속 "స్థిరమైన 서명은 불안정하다" (arXiv:2405.07145, 2024년 5월)  정교 조정은 품질을 유지하면서 워터마크를 제거합니다. C2PA  암호로 서명된, 조작이 가능한 메타데이터 표준 (C2PA 2.2 설명서 2025). 워터마크와 C2PA는 상호 보완된다. 메타데이터를 제거할 수 있지만 더 풍부한 출처를 가지고 있다. 워터마크는 트랜스코딩을 통해 유지되지만 적은 정보를 가지고 있다.

**Type:** Build
**Languages:** Python (stdlib, token-watermark embed + detect)
**Prerequisites:** Phase 10 · 04 (sampling), Phase 01 · 09 (information theory)
**Time:** ~75 minutes

## 학습 목표

- 토큰 레벨 워터마크 (SynthID 텍스트 스타일) 및 이를 감지할 수 있는 메커니즘을 설명하십시오.
- 안정된 서명과 2024년 제거 공격이 파괴된 것을 설명해
- 국가 C2PA의 역할과 왜 물표가 보완되는지에 대한 이유
- 주요 한계사항을 설명하라: 모델 특수한 신호, 패러프레이즈 하에 강박성, 의미 보존 공격 (arXiv:2508.20228).

## 문제

2023-2024 년에는 딥팩과 인공지능 생성 콘텐츠가 정치 및 소비자 맥락에 대규모로 진입하는 것을 보았습니다. 워터마크는 제안된 기술적 기원 신호입니다. 생성 시 세대 표시, 나중에 탐지합니다. 2025 증거: 어떤 워터마크도 무조건 강하지만 C2PA 메타 데이터와 레이어링 된 조합은 사용할 수있는 기원 이야기를 제공합니다.

## 개념

### 텍스트 워터마크 (SynthID-text 스타일)

구글이 제작한 키르첸바워 등 2023 메커니즘:

1. 각 디코딩 단계에서는 이전 K 토큰을 해시하여 "녹색"과 "붉은" 세트의 어휘의 사이드랜덤 파티션을 생성합니다.
2. 녹색 로그티에 δ를 추가함으로써 녹색 집합에 대한 편견 샘플링.
3. 이 세대는 우연이 만들어내는 것보다 더 많은 녹색 토큰을 포함합니다.

탐지: 각 사전을 다시 짚고, 세기에 녹색 토큰을 계산하고 z 점수를 계산합니다. z 점수는 워터마크 텍스트에 대해 >0이고 인간 텍스트에 대해서는 ~0입니다.

특성은:
- 독자들에게 감지할 수 없는 (δ는 품질 손실이 작을 정도로 작다).
- 어휘부문 파티션 기능에 액세스하여 탐지 할 수 있습니다.
-  텍스트를 다시 쓰는 것은 신호를 파괴합니다.

SynthID-text은 구글의 책임 GenAI 도구 킷을 통해 2024년 10월 오픈소스입니다.

### 안정된 서명 (사진)

페르난데스 및 동료 ICCV 2023. 모든 생성된 이미지는 잠잠한 표현에 내장된 고정된 바이너리 메시지를 포함하도록 잠잠한 전파 디코더를 정밀 조정하십시오. 탐지 는 신경 디코더로 잠잠한 상태에서 잠잠한 상태에서 디코드됩니다. 절단된 (콘텐츠의 10%까지) 이미지는 FPR<1e-6에서 90% 이상 감지됩니다.

2024년 5월 "స్థిరమైన 서명이 불안정" (arXiv:2405.07145): 디코더의 정렬은 화상 품질을 유지하면서 워터마크를 제거합니다. 반대의 포스트-제너레이션 정렬은 저렴합니다. 워터마크의 반대의 견고성은 제한적입니다.

### 신스아이디 통일 탐지기 (2025년 11월)

Gemini 3 Pro와 함께: 하나의 API에서 텍스트, 이미지, 오디오 및 비디오에서 SynthID 신호를 읽는 멀티미디어 탐지기가. 구글 출산 스택을 통일합니다.

### C2PA

컨텐츠 출처 및 인증 협동조합. 암호적으로 서명된 조작 가능한 메타 데이터 표준. C2PA 2.2 설명자 (2025). C2PA 매니페스트는 출처 주장을 기록합니다 (누가 만들었고, 언제, 어떤 변환을) 창조자의 키가 서명했습니다.

물 표시를 보완하는:
- 메타데이터를 제거할 수 있지만 워터마크는 (단순하게) 제거할 수 없습니다.
- 메타 데이터는 풍부하다 (완전한 출처 연쇄); 워터마크는 비트들을 가지고 있다.
- C2PA는 플랫폼 채택에 달려 있습니다. 워터마크는 자동으로 임베디드됩니다.

구글은 검색, 광고, 그리고 "이 이미지에 대해"에 모두 통합합니다.

### 제한

- **Model-specific.**SynthID가 지원된 모델에서 생성된 SynthID 워터마크. SynthID가 없는 모델에서 생성된 세대에는 워터마크가 없으므로 "SynthID 신호가 없다"는 인증 증명이 아니다.
- **Paraphrase.**텍스트 워터마크는 의미를 보존하는 패라프라지스를 살아남지 못합니다.
- **Transformation attacks.**arXiv:2508.20228 (2025) 는 텍스트 워터마크와 많은 이미지 워터마크를 파괴하는 의미 보존 공격을 보여줍니다.
- **Fine-tune removal.**"స్థిరమైన 서명이 불안정하다"에 따라, 후 세대 정렬은 임베디드 워터마크를 제거합니다.

### EU AI 법 50조

인공지능으로 생성된 콘텐츠 표기법 (첫 번째草案2025년 12월, 두 번째草案2026년 3월, 최종 예정인 2026년 6월)[European Commission status page](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content)) 코드는 2026년 4월부터 작성되어 있으며, 시간표는 변경될 수 있습니다. 기술 계층을 필요로 하는 규제 계층. 딥팩은 라벨을 붙여야 합니다.

### 이 부분은 18단계에 맞게

22~23강좌는 모델이 방출하는 내용 (개인 데이터, 출처 신호) 에 관한 것입니다. 27강좌는 교육 데이터 지배를 다루고 있습니다. 24강좌는 이러한 기술적 조치를 요구하는 규제 프레임워크입니다.

```figure
an-watermark-greenlist
```

## 사용 하 고

`code/main.py`장난감 텍스트 워터마크를 구축합니다. 토큰은 정수 0..N-1입니다. 해시 정의 된 녹색 집합에 대한 물 표기 샘플링 편향입니다. 탐지기는 녹색 토큰 z 점수를 계산합니다. 1000 토큰 세대에 탐지 관찰, 신호를 파괴하는 패러프레이스를 관찰하고 인간 텍스트에서 거짓 긍정적 인 비율을 측정 할 수 있습니다.

## 선박

이 교훈은`outputs/skill-provenance-audit.md`. 출처 주장을 가진 콘텐츠 배포를 고려하면, 그것은: 워터마크 메커니즘 (만약이 존재할 경우), C2PA 서명 체인 (만약이 존재할 경우), 각자의 역동성 및 모다리티별 커버리지를 감사합니다.

## 운동

1. 달아`code/main.py`. 물표 1000 토큰 생성 및 인간 작성 텍스트에 대한 z 점수를 보고. 95% 신뢰도 임대에서 거짓 긍정률을 확인한다.

2. 30%의 토큰을 동호어로 대체하는 패러프레이스 공격을 실행하세요. z 점수를 재 측정하세요.

3. 키르첸바우어 등 2023 섹션 6에 대한 강도. 왜 텍스트 워터마크는 낙역 하에서 실패하지만 이미지 워터마크는 절단 하에서 살아남는?

4. SynthID-text + C2PA 메타데이터를 이용한 배포를 설계하십시오. 소비자가 보는 출처 체인을 설명하십시오. 각 구성 요소의 하나의 실패 모드를 식별하십시오.

5. 2024 "స్థిరమైన 서명이 불안정" 결과는 미세 조정이 이미지의 워터마크를 제거하는 것을 보여줍니다. 예를 들어, 이 공격을 제한하는 배포 제어 장치를 설계하면 미세 조정이 된 체크포인트의 서명된 출시를 필요로합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| SynthID | "Google's watermark" | Cross-modal provenance signal; text, image, audio, video |
| Token watermark | "Kirchenbauer-style" | Biased-sampling text watermark detectable via green-token z-score |
| Stable Signature | "image watermark" | Fine-tuned-decoder watermark; ICCV 2023 |
| C2PA | "the metadata standard" | Cryptographically signed tamper-evident provenance metadata |
| Paraphrase robustness | "does rewording break it" | Text watermark property; currently limited |
| Fine-tune removal | "adversarial unwatermark" | Attack that removes image watermark via decoder fine-tuning |
| Cross-modal detector | "unified SynthID" | November 2025 unified API across modalities |

## 더 많은 읽기

- [Kirchenbauer et al. — A Watermark for Large Language Models (ICML 2023, arXiv:2301.10226)](https://arxiv.org/abs/2301.10226) 토큰 워터마크 메커니즘
- [Fernandez et al. — Stable Signature (ICCV 2023, arXiv:2303.15435)](https://arxiv.org/abs/2303.15435) 이미지 워터마크 종이
- ["Stable Signature is Unstable" (arXiv:2405.07145)](https://arxiv.org/abs/2405.07145) 제거 공격
- [Google DeepMind — SynthID](https://deepmind.google/models/synthid/) 크로스 모달 수표
- [C2PA 2.2 Explainer (2025)](https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) 메타데이터 표준
