# Qwen-VL 가족 및 동적-FPS 비디오

> Qwen-VL 가족  Qwen-VL (2023), Qwen2-VL (2024), Qwen2.5-VL (2025), Qwen3-VL (2025) 은 2026년 가장 영향력 있는 오픈 비전 언어 모델 라인이다. 각 세대는 열두 달 이내에 다른 오픈 생태계에서 복사된 하나의 결정적인 건축적 베팅을 했습니다. M-RoPE를 통해 네이티브 동적 해상도, 절대 시간 정렬을 가진 동적-FPS 샘플링, ViT에서 창 주의, 구조화된 에이전트 출력 형식. Qwen3-VL에 의해, 레시피는 안정화되었습니다: 2D-RoPE-ViT 코더와 네이티브 측면 비율 입력, 큰 Qwen3 언어 기반에 MLP 프로젝터, 그리고 OCR, 지형 및 에이전트 행동을 일급 목표물로 강조하는 훈련 단계. 이 수업은 가족들을 시간 순서대로 읽어서 모든 버튼이 왜 있는지는 이해하게 됩니다.

**Type:** Learn
**Languages:** Python (stdlib, M-RoPE encoder + dynamic-FPS sampler)
**Prerequisites:** Phase 12 · 06 (patch-n'-pack)
**Time:** ~120 minutes

## 학습 목표

- M-RoPE의 세 축 회전 (시간, 높, 너비) 을 계산하고 세 가지 모두 필요한 이유를 설명하십시오.
- 비디오에 대한 동적 FPS 샘플링 전략을 선택하고, 주초당 토큰과 이벤트 탐지 정확성에 대해 논리하십시오.
- Qwen-VL 세대의 4가지 업그레이드를 순서대로 나열하고 각각의 업그레이드가 어떤 기능을 했는지 알려주세요.
- Qwen2.5-VL 스타일의 JSON 에이전트 출력 형식을 전송하고 VLM 응답에서 구조화된 도구 호출을 분석합니다.

## 문제

Qwen-VL는 LLaVA-1.5 및 BLIP-2에 직접적으로 대응하여 2023년 8월에 발송되었다. Qwen 팀의 목표 격차는 해상도, 비디오 및 구조화된 출력으로 세 배였다.

해상도: LLaVA-1.5는 336x336로 실행되었다. 사진에는 적합하지만 중국어 인 Faktura 또는 밀집한 스프레드시트 스크린샷에는 쓸모가 없습니다. Qwen-VL의 첫 번째 혁신은 448x448이며 지형 경계 상자 출력으로 모델이 물건을 가리키는 것을 허용합니다.

비디오: 비디오-LLaMA는 프레임별 인코더를 쌓아내고 LLM에 공급했습니다. 짧은 클립을 위해 작동했습니다. 시간축이 신호가 되는 다분짜리 비디오는 아닙니다. Qwen 팀은 시간을 이해하는 단일 인코더를 원했습니다.

구조화된 출력: LLaVA는 자유형 텍스트를 발송한다. 에이전트가 JSON를 필요로 한다. Qwen-VL는 텍스트로 경계 상자 좌표를 포함한 명시적인 JSON 출력 형식에 훈련된다.

Qwen-VL 세대가 각각 이 세 축 중 하나를 확장합니다.

## 개념

### Qwen-VL (2023년 8월)

첫 번째 세대는: OpenCLIP ViT-bigG/14 인코더 (2.5B 파라마), LLama 호환 Q-Former (1 단계 256 쿼리), Qwen-7B 기반. 기여:

- 448x448 해상도 (이 때 오픈 VLM를 위한 SOTA)
- 지형: 명시적 좌표 표기 출력으로 이미지- 텍스트 쌍을 훈련합니다. "고양이 <box>112, 204), (280, 344)</box>".
- 초반부터 중국어 + 영어 다국어 교육

당시 기준: 영어에서 GPT-4V와 경쟁하고 중국어에서 지배적이었다.

### Qwen2-VL (2024년 9월)  M-RoPE 및 원산화 해상

Qwen2-VL는 고정 해상 + Q-Former 스택을 원산적 동적 해상 ViT 코더로 대체했다. 주요 변경 사항은:

- 네이티브 동적 해상도. ViT는 28으로 나눌 수 있는 HxW를 받아들인다 (패치 14 2x 공간 융합). 1120x672 (40x24 융합 패치) 의 이미지는 960 개의 시각 토큰을 생성합니다. 크기가 크거나 타일링이 없거나 미니얼이 없습니다.
- M-RoPE (다형 RoPE). 각 토큰은 1D 대신 3D 위치 (t, h, w) 를 가지고 있다. 이미지 t=0, 비디오 t= 프레임_인덱스. RoPE는 각 축에 따른 주파수로 질서/키 벡터를 회전한다. 위치 임베딩 테이블은 없다.
- MLP 프로젝터, Q-Former를 내려놓고, 합병된 패치 토큰에 2층 MLP를 사용하세요.
- 동적 FPS의 비디오. 기본적으로 1-2 FPS의 비디오 샘플을 받아 들인다. 하지만 모델은 임의의 프레임 카운트를 받아들인다.

결과: Qwen2-VL-7B는 여러 멀티모달 벤치마크에서 GPT-4o와 일치하고 DocVQA (94.5 vs 88.4) 에서 이겼습니다.

### Qwen2.5-VL (2025년 2월)  동적 FPS + 절대 시간

Qwen2.5VL의 큰 변화는 비디오였습니다. 동적 FPS는 "필요한 경우 더 많은 프레임을 샘플링"하는 것만은 아닙니다.

- 절대 시간 표기. 위치 지표 대신 (프레임 0, 1, 2...) 실제 시간표를 사용하십시오. "0:04에 고양이가 뛰어납니다". 모델은 볼 수 있습니다.`<time>0.04</time>`프레임 토큰과 얽힌 토큰
- 동적 FPS. 느린 영상에서 1 FPS, 동작을 위해 4+ FPS에 샘플링. 사용자 또는 트레이너가 선택합니다. M-RoPE는 적응합니다.
- ViT에서 창문 주의 공간적 주의는 출력 (블록 내에서 지역적) 으로 창문화되어 있습니다.
- JSON 출력 형식: 도구 호출 데이터에 훈련: "{\"툴\": \"클릭\", \"코드\": [380, 220]}".
- MRoPE-v2 스케일링. 위치 스케일 최대 입력 크기로 10분짜리 비디오가 주파수 범위를 채우지 않도록

벤치마크: Qwen2.5-VL-72B는 대부분의 비디오 벤치마크에서 GPT-4o를 제치고, 문서에서 Gemini 2.0와 일치하며, GUI 지형화를 위해 오픈 모델 SOTA를 설정합니다 (스크린스팟: 84% 정확성 vs GPT-4o의 38% 정확성).

### Qwen3-VL (2025년 11월)

Qwen3-VL는 재발견보다는 통합되는 점진적인 업그레이드입니다. 더 큰 LLM 척추 (Qwen3-72B), 확장 된 교육 데이터, 향상된 OCR, Qwen3 "생각 모드"를 통해 더 강한 추론.

선조의 결과: 2025년까지 Qwen-VL 아키텍처가 안정화되었다. 추가 세대는 원시적인 것이 아니라 계산과 데이터를 확장했습니다.

### 수학적으로 M-RoPE

클래식 로페는 질서를 회전합니다`q`크기의`d`위치별로`m`쌍 좌표를 사용하여:

```math
\begin{aligned}
q_{\text{rot}}[2i] &= q[2i] \cos(m \theta_i) - q[2i+1] \sin(m \theta_i) \\
q_{\text{rot}}[2i+1] &= q[2i] \sin(m \theta_i) + q[2i+1] \cos(m \theta_i) \\
\theta_i &= 10000^{-2i/d}
\end{aligned}
```

M-ROPE는 숨겨진 을 3단으로 나눈다`d = 96`. 32개의 이 시간적, 32개의 높이가 높고 32개의 너비로 지정한다. 각 밴드는 각 축의 위치로 회전한다. (t=5, h=10, w=20) 의 패치가 회전한다.`R_t(5)``R_h(10)``R_w(20)`그 3개의 반에 적용됩니다.

텍스트 토큰 사용 `t = text_index, h = 0, w = 0`(또는 표준화된 선택) 호환성을 유지하기 위해`t = frame_time, h = row, w = col`. 단일 이미지 사용 `t = 0`- 그래

이점: 한 위치 코딩은 분할 코드 또는 다른 위치 테이블 없이 텍스트, 이미지 및 비디오를 처리합니다.

### 동적-FPS 샘플링 논리

영상 기간을 고려하면`T`초과 및 목표 토큰 예산`B`이 부분의 본문은

1. 최대 FPS를 계산해 보세요.`fps_max = B / (T * tokens_per_frame)`- 그래
2.  목표 FPS를 선택하세요`{1, 2, 4, 8}`만족스러운`fps <= fps_max`- 그래
3. 운동이 높으면 (광 흐름 유러스틱 또는 명시적인 사용자 요청) FPS를 더 높게 선택하십시오. 운동이 낮으면 낮게 선택하십시오.
4. 선택된 FPS에서 일률적으로 샘플을 삽입`<time>t</time>`프레임들 사이의 토큰

Qwen2.5-VL는 이 논리를 암시적으로 훈련시킵니다.`fps`매개 변수: 60초의 액션 시퀀스 4 FPS, 프레임당 81 토큰 = 19440 토큰, 32k 컨텍스트에서 관리 가능합니다.

### 구조화된 대원 출력

Qwen2.5VL의 에이전트 트레이닝은 구체적으로 구조화된 도구 호출을 목표로 합니다.

```
{
  "tool": "mouse_click",
  "coords": [1024, 512],
  "button": "left",
  "modifier": null
}
```

파싱은 결정적 이다: JSON.parse는 모델의 출력. 레전스 및 모호함 처리가 필요한 자유형 "클릭 (1024, 512) "와 비교하십시오. 이 변화는 Qwen2.5-VL의 스크린스팟 점수가 Qwen2-VL의 55%에서 84%로 급등한 이유입니다.

```figure
mm-mrope-axes
```

## 사용 하 고

`code/main.py`이 도구는

- M-RoPE 위치 계산은 포장된 염기서기 텍스트, 이미지 패치 및 비디오 프레임을 혼합합니다.
- 동적 FPS 샘플링: 주어진 (기간, 예산, 운동_ 레벨), FPS를 선택하고 프레임 시간표를 발사한다.
- 도구 호출 응답을 좌표 필드와 처리하는 장난감 Qwen2.5-VL JSON 출력 파서.

5분짜리 비디오에서 고정-FPS를 동적-FPS로 교환하면 그 차이를 느낄 수 있습니다.

## 선박

이 교훈은`outputs/skill-qwen-vl-pipeline-designer.md`. 비디오 작업 (감시, 에이전트, 행동 인식, 접근성) 을 고려하면 Qwen2.5VL 구성 (프레임 예산, FPS 전략, 창 주의 플래그, 에이전트 출력 모드) 및 지연 추정치를 발급합니다. 비디오 제품에 Qwen-VL 가족 모델을 배포할 때마다 이것을 사용하십시오.

## 운동

1. (t=3, h=5, w=7) 에서 숨겨진 48 (16단당, 기본 텐타 10000) 를 가진 패치의 M-RoPE 회전을 계산한다. 각 밴드의 첫 3 쌍의 회전 각도를 표시한다.

2. 10분 동안 1 FPS로 카메라가 촬영하면 얼마나 많은 프레임을 생성할 수 있을까요? 3x 풀로 384 해상도에서, 총 몇 개의 토큰이 있습니까? Qwen2.5-VL의 기본 32k 컨텍스트가 처리합니까?

3. 30초짜리 테니스 릴리에서 30초짜리 레시피 데모와 30초짜리 UI 에이전트 녹음에서 FPS를 선택하고, 각각의 역동적인 FPS 논리를 정의하세요.

4. Qwen2.5VL는 Q-Former를 완전히 떨어뜨립니다. 간단한 MLP는 왜 2025년에 작동하지만 2023년에 작동하지 않는가?

5. 3 Qwen2.5-VL JSON 도구 호출 출력을 파이썬 디킷으로 파스하십시오. 잘못된 JSON에 무엇이 실패하고 Qwen 요리책에서 어떤 복구 전략이 권장합니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| M-RoPE | "Multimodal RoPE" | 3D rotary position embedding with temporal, height, and width bands in the hidden dim |
| Dynamic FPS | "Smart sampling" | Frame sampling rate chosen per video based on motion, duration, and token budget |
| Absolute time token | "Timestamp token" | `<time>t</time>` interleaved in the sequence so the model sees actual seconds not frame index |
| Window attention | "Local attention" | Spatial self-attention restricted to small windows for speed; global attention added periodically |
| Structured agent output | "JSON mode" | Training data supervision teaching the VLM to emit parseable JSON with coords and tool names |
| min_pixels / max_pixels | "Resolution bounds" | Per-request Qwen2.5-VL controls bounding total pixel count and therefore token count |
| Grounding | "Point-at-it" | Outputting bounding-box coordinates as text tokens; used since Qwen-VL v1 |

## 더 많은 읽기

- [Bai et al. — Qwen-VL (arXiv:2308.12966)](https://arxiv.org/abs/2308.12966)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Qwen Team — Qwen3-VL (arXiv:2511.21631)](https://arxiv.org/abs/2511.21631)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
