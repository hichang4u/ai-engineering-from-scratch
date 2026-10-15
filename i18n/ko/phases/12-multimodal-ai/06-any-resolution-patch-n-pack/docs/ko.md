# 어떤 해상도도 비전: 패치 n' 팩 및 NaFlex

> 실제 사진은 224x224 제곱이 아닙니다. 영수증은 9:16, 차트도 16:9, 의료 스캔도 4096x4096, 모바일 스크린샷도 9:19.5. 2024년 이전 VLM 답변은 모든 것을 고정된 광장으로 크기를 변경하여 OCR, 문서 이해 및 고해상도 장면 분석 작업을 수행하는 신호를 버렸습니다. NaViT (Google, 2023) 는 블록 지각 마스크를 사용하여 변수 해상도의 패치를 하나의 트랜스포머 배트에 포장할 수 있음을 보여주었습니다. Qwen2-VL의 M-RoPE (2024) 는 절대 위치 테이블을 완전히 떨어뜨렸다. LLaVA-NeXT의 AnyRes는 고해상도 이미지를 기본 + 하위 이미지로 습니다. SigLIP 2의 NaFlex 변종 (2025) 은 이제 모든 측면 비율을 서비스하는 단일 체크포인트가 필요한 오픈 VLM의 기본 코더입니다. 이 수업은 끝에서 끝까지 패치-n'-팩을 구현합니다.

**Type:** Build
**Languages:** Python (stdlib, patch packer + block-diagonal mask)
**Prerequisites:** Phase 12 · 01 (ViT patches), Phase 12 · 05 (LLaVA)
**Time:** ~120 minutes

## 학습 목표

- 변함적 해상도의 이미지들의 패치를 하나의 순서로 묶어 블록 지각주의 마스크를 만들어 보세요.
- 주어진 작업에 대해 AnyRes 타일링 (LLaVA-NeXT), NaFlex (SigLIP 2) 및 M-RoPE (Qwen2-VL) 사이에서 선택하십시오.
- OCR, 차트 및 사진에 대한 토큰 예산을 변경하지 않고 계산하십시오.
- 사각형 크기의 실패 모드 3가지의 이름을 명명하세요: 쪼개진 텍스트, 깎아진 내용, 에 낭비된 토큰

## 문제

트랜스포머는 순서대로 예상합니다. 배트는 같은 길이의 순서들로 이루어진 무늬입니다. 만약 여러분의 이미지가 224x224이라면, 여러분은 196개의 패치 토큰을 매번 얻습니다.

세계 는 협조 하지 않는다. 문서 는 초상화 (8.5x11 인치, 2:3-아래) 이다. 차트 스크린샷 은 풍경 (16:9). 영수권 은 높고 얇은 (1:3). 의료 영상 보트 는 2048x2048 또는 더 큰. 모바일 장치 스크린샷 은 1170x2532 (0.46:1).

2024년 이전 3가지 옵션과 각각의 실패는

1. 정해진 사각형 (224x224 또는 336x336) 으로 재차 크기를 조정한다. 스쿼시 는 텍스트와 표면을 왜곡한다. 다운스케일 은 차트 레이블과 OCR 콘텐츠를 파괴한다. LLaVA-1.5까지 표준 연습.
2. 정해진 면모 비율로 작물을 작아서 대부분의 이미지를 버립니다. 그리고 작물의 위치를 선택하는 것은 자신의 시각 문제입니다.
3. 가장 긴 편에 패드를 넣고 왜곡을 고쳐도 포트레이트 이미지 포팅에 50% 이상의 토큰을 낭비합니다.

2024~2025년 해답은 트랜스포머가 이미지의 고유 해상도에 있는 패치를 먹게 하고, 계산이 낭비되지 않고 한 염기서열에 이질적인 패치를 어떻게 포장할 수 있는지 알아내도록 해주는 것입니다.

## 개념

### NaViT와 패치-n'-팩

NaViT (Dehghani et al., 2023) 는 이 작업이 규모로 이루어지는 것을 보여주는 논문입니다. 이 아이디어는 기계적입니다.

1. 패치의 각 이미지에 대해, 선택한 패치 크기의 네이티브 패치 그리드를 계산하십시오 (예컨대 14).
2. 각각의 이미지 패치를 변수 길이의 순서로 평평하게 만듭니다.
3. 모든 이미지 패치를 한 긴 순서로 묶어
4. 블록 지각주의 마스크를 만들어서 A 이미지의 패치가 A 이미지의 내부에만 있습니다.
5. 패치별 위치 정보를 가져가야 한다 (2D RoPE 또는 분자 위치 임베디션).

336x336 (576 토큰), 224x224 (256 토큰), 448x336 (768 토큰) 에 있는 세 개의 이미지의 무대는 1600x1600 블록 지각 마스크로 1600 토큰 순서로 되어 있다. 이 없습니다. 낭비된 계산도 없다. 트랜스포머는 임의적인 측면 비율을 처리한다.

NaViT는 훈련 중에 분자 패치 떨어뜨리는 것을 도입했습니다.  배치를 통해 50%의 패치들이 무작위로 떨어집니다.

### 어떤 레스 (LLaVA- NEXT)

LLaVA-NeXT의 AnyRes는 실용적인 대안이다. 고해상도 이미지 및 고정된 코더 (CLIP 또는 SigLIP 336) 를 고려하면,

1. 미리 정의된 집합  (1x1), (1x2), (2x1), (1x3), (3x1), (2x2), 등에서 그림의 측면 비율에 가장 잘 맞는 그리드 레이아웃을 선택하십시오.
2. 전체 이미지를 그리드에 접어들게 하고 각 타일은 336x336의 작물이 됩니다.
3. 또한 미니얼을 생성합니다. 전체 이미지는 글로벌 컨텍스트 토큰으로 336x336로 크기를 변경합니다.
4. 모든 타일들을 얼어붙은 336 에코더를 통해 암호화해 놓아 타일 토큰과 줄여진 토큰을 연결해 놓아

2x2 그리드 + 미니얼의 672x672 이미지: 4 * 576 + 576 = 2880 시각 토큰. 값 비싼하지만 효과적인 LLM는 지역 세부 사항과 글로벌 맥락을 모두 볼 수 있습니다.

AnyRes는 코더가 얼어붙어 한 해상도를 지원할 때 선택의 길입니다. 큰 이미지의 토큰 수를 폭발적으로 증가시킵니다. (4x4 그리드에서 1344x1344 이미지는 9216 + 576 ≈ 9800 토큰입니다. 8k LLM 컨텍스트의 대부분을 채우게 됩니다).

### M-RoPE (Qwen2-VL)

Qwen2-VL는 멀티모달 로터리 포지션 임베딩을 도입했다. NaViT의 분자 위치 또는 AnyRes의 타일 및 니얼 대신, 각 패치는 3D 위치를 (시간, 높, 너비) 가지고 있다. 질의/키 회전들은 임의 H, W, 시간 길이를 처리한다.

M-RoPE는 재교육 없이 네이티브 동적 해상도를 전송한다. HxW 이미지를 입력하면 패치 임베더는 H/14 x W/14 토큰을 생성하고, 각 토큰은 (t=0, r=row, c=col) 위치를 얻으며, RoPE는 올바른 주파수로 주의를 돌립니다. Qwen2.5-VL 및 Qwen3-VL는 이것을 계속합니다. InternVL3의 V2PE는 모달성별 변수 코딩과 같은 아이디어입니다.

AnyRes와 달리 M-RoPE는$O(H \times W / P^2)$네이티브 해상도  곱셈 타일 오버하스트가 없습니다. NaViT와 달리, 여전히 전진당 단일 이미지를 기대합니다. 해상도 간 배팅은 여전히 팩-n'-팩이 꼭대기에 필요합니다.

### NaFlex (SigLIP 2)

NaFlex은 SigLIP 2 체크포인트의 네이티브 플렉스 모드입니다. 단일 모델은 추론에서 여러 염기 길이 (256, 729, 1024 토큰) 를 제공합니다. 내부적으로는 훈련과 패치 당 절대 분자 위치 동안 NaViT 스타일의 패치-n'-팩을 사용합니다. 판매 포인트: 하나의 체크포인트, 작업에 따라 추론에서 토큰 예산을 선택하십시오.

의미 작업 (분류, 검색) 에 256 토큰 OCR 또는 차트 이해에 1024 토큰

### 포장 마스크

블록 다이아곤 마스크는 대부분의 구현이 넘어지는 곳입니다.`N_total`사진들을 담고 있는`i=0..B-1`길이가 `n_i`, 마스크`M`모양의`(N_total, N_total)`이 두 지수는 같은 이미지 블록에 들어간다면 1이고, 그렇지 않으면 0입니다.

```
offsets = [0, n_0, n_0+n_1, ..., N_total]
M[i, j] = 1 iff there exists b where offsets[b] <= i < offsets[b+1] and offsets[b] <= j < offsets[b+1]
```

이것은 PyTorch의 한 줄입니다`torch.block_diag`FlashAttention의 변수 길이 경로 (`cu_seqlens`) 은 마스크를 완전히 건너뛰고, 누적 길이의 텐서를 직접적으로  ~ 10x 더 빨리 사용하여 전형적인 배트에서 밀집 마스크보다 순서간에 참여합니다.

### 토큰 예산

임무에 따라 전략을 선택하세요:

- OCR / 문서: 1024-4096 토큰. SigLIP 2 NaFlex 1024 또는 AnyRes 3x3 + 줄여보기.
- 차트 및 UI: 토큰 729-1024 384-448 네이티브. Qwen2.5VL 역동적 해상도 최대 픽셀 캡
- 자연 사진: 256-576 토큰은 괜찮습니다. 하류 LLM는 충분히 볼 수 있습니다. 콘텐츠 밀도가 높은 토큰을 지불하십시오.
- 비디오: 공간적 분할 후 64-128개의 토큰, 2-8 FPS. 12.17 수업은 이것을 다루고 있습니다.

2026년 생산 규칙: 작업당 최대 픽셀 캡을 선택하고, 네이티브 화면 비율로 캡에까지 코딩하고, 배치를 포장하고, 을 건너뛰십시오.`min_pixels`그리고`max_pixels`이 버튼을 맞게

```figure
mm-patch-n-pack
```

## 사용 하 고

`code/main.py`전체 픽셀 좌표를 가진 이 heterogeneous batch of images의 patch-n'-pack을 구현합니다.

- (H, W) 이미지 크기의 목록을 가져옵니다.
- 각 이미지의 패치 순서 길이를 패치 크기로 계산합니다.
- 전체 길이의 하나의 순서로 포장합니다`sum(n_i)`- 그래
- 블록 다이아곤 주의 마스크 (명확함) 를 만듭니다.
- 포장된 비용과 사각형 크기와 AnyRes 타일링을 비교합니다.
- 혼합 패치 (수표, 차트, 스크린샷, 사진) 에 대한 토큰 예산 테이블을 인쇄합니다.

2026년 VLM가 개장한 모든 경우 패치나 패크가 나오는 이유는

## 선박

이 교훈은`outputs/skill-resolution-budget-planner.md`. 혼합적인 측면 비율 작업량 (OCR, 차트, 사진, 비디오 프레임) 과 전체 토큰 예산을 고려하면 올바른 전략을 선택 (NaFlex, AnyRes, M-RoPE, 또는 고정된 광) 과 요청에 따라 구성을 발송합니다. 제품 을 위해 VLM 크기를 조정할 때 이 기술을 사용하여 지연 예산을 죽이는 침묵 10x 토큰 폭발을 방지합니다.

## 운동

1. 리시트는 600x1500 (1:2.5) 입니다. 패치 크기가 14인 경우 네이티브 해상도의 토큰은 몇 개일까요? 336으로 사각형 크기를 더 적어 놓은 후 몇 개일까요?

2. 블록 다이아곤 마스크를 만들어서 4개의 이미지 팩을 만들어서 256, 576, 729, 1024의 길이를 확인해 보세요`256^2 + 576^2 + 729^2 + 1024^2`0이 아닌 항목

3. 패치 14의 1792x896 이미지에서는: (a) 336으로 사각형 크기를 표시하고, (b) AnyRes 2x1 + 미니얼, (c) M-RoPE를 비교해보세요.

4. 분자 패치 떨어뜨리는 것을 구현하십시오: 포장된 순서를 고려하면, 도큰의 50%를 무작위로 균일하게 떨어뜨리고, 이에 따라 블록 지각 마스크를 업데이트하십시오. 마스크의 희소성 변화를 측정하십시오.

5. Qwen2-VL 논문의 3.2 섹션 (arXiv:2409.12191) 을 읽어 보세요.`min_pixels`그리고`max_pixels`통제와 두 가지 국경이 중요한 이유

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Patch-n'-pack | "NaViT-style packing" | Concatenate variable-length patch sequences from different images into one batch dimension |
| Block-diagonal mask | "Packing mask" | Attention mask that confines each image's patches to attend only to themselves, not neighbors in the pack |
| AnyRes | "LLaVA-NeXT tiling" | Split a high-res image into a grid of fixed-size tiles plus a global thumbnail; encode every tile with a fixed encoder |
| NaFlex | "SigLIP 2 native-flex" | Single SigLIP 2 checkpoint that serves 256/729/1024-token budgets at inference without retraining |
| M-RoPE | "Multimodal RoPE" | 3D rotary position encoding (time, row, column) that handles arbitrary H, W, T without position tables |
| cu_seqlens | "FlashAttention packing" | Cumulative-length tensor the FlashAttention varlen path uses instead of a dense block-diagonal mask |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL per-request knobs capping token count on very small or very large inputs |
| Visual token budget | "How many tokens per image" | Rough count of patch tokens emitted per image; sets the LLM's prompt budget and attention cost |

## 더 많은 읽기

- [Dehghani et al. — Patch n' Pack: NaViT (arXiv:2307.06304)](https://arxiv.org/abs/2307.06304)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Laurençon et al. — What matters when building vision-language models? (Idefics2, arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
