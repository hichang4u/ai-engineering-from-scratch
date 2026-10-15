# 제어망, 로라 및 컨디션

> 텍스트만으로도 무작위적인 제어 신호입니다. ControlNet은 미리 훈련된 전파 모델을 복제하고 깊이 지도, 골격, 스크립트 또는 가장자리 이미지로 조종할 수 있습니다. LoRA는 10 백만 개의 매개 변수를 훈련함으로써 2B 매개 변수를 세련하도록 허용합니다. 함께 그들은 장난감에서 안정적인 전파를 2026 이미지 파이프라인으로 전환했습니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 10 (LLMs from Scratch — for LoRA foundation)
**Time:** ~75 minutes

## 문제

"빨간 드레스를 입은 여성이 개를 바쁜 거리에서 걷고 있다"와 같은 명령은 모델에게 개가 어디에 있는지, 여성이 어떤 자세를 취하고 있는지, 길의 관점을 알려주는 것이 아닙니다. 텍스트는 이미지를 지정하는 데 필요한 것의 10% 정도를 줄여줍니다. 나머지는 시각적이며 말로 효율적으로 설명할 수 없습니다.

모든 신호 (포지, 깊이, , 세그먼트) 에 대해 새로운 조건형 모델을 처음부터 훈련시키는 것은 금지적입니다. 2.6B-파라임 SDXL 척추를 얼어붙이고, 조건부를 읽는 작은 부면 네트워크를 연결하고 척추의 중간 기능을 밀어 넣고 싶습니다. 그것은 ControlNet입니다.

또한, 전체 모델의 재교육 없이 모델에 새로운 개념을 (당신의 얼굴, 제품, 스타일을) 가르치고 싶으세요. 100배 더 작은 델타를 원합니다. 즉, 기존의 관심 무게에 연결되는 로라  낮은 랭크 어댑터입니다.

ControlNet + LoRA + 텍스트 = 2026 연습생의 도구 킷. 대부분의 생산 이미지 파이프라인은 2-5 LoRA, 1-3 ControlNets, 그리고 SDXL / SD3 / 플루크스 기반 위에 IP- 어댑터를 층으로 한다.

## 개념

![ControlNet clones the encoder; LoRA adds low-rank deltas](../assets/controlnet-lora.svg)

### 제어네트 (Zhang et al., 2023)

미리 훈련된 SD를 가져가십시오. * U-Net의 코더 반을 클론하세요. 원본을 얼어붙이십시오. 추가 컨디션 입력 (엣지, 깊이, 포즈) 를 받아들이도록 클론을 훈련하세요. * 0- 컨볼션* 점프 연결을 사용하여 원본의 디코더 반으로 클론을 다시 연결하십시오.

```
SD U-Net decoder:   ... ← orig_enc_features + zero_conv(controlnet_enc(condition))
```

Zero-conv init는 ControlNet이 훈련 전에도 무해인 신분으로 시작된다는 것을 의미합니다. 1M (방급, 상태, 이미지) 에 있는 열차는 표준 전파 손실과 3배로 증가합니다.

퍼 모다리티 컨트롤넷은 작은 사이드 모델로 (SDXL에서 ~ 360M, SD 1.5에서 ~ 70M) 배포됩니다.

```
features += weight_a * control_a(depth) + weight_b * control_b(pose)
```

### 로라 (Hu et al., 2021)

어떤 선형층에 대해서도$W \in \mathbb{R}^{d \times d}$모델에서, 얼어붙여$W$그리고 낮은 순위 델타를 추가합니다.

```math
W' = W + \Delta W, \quad \Delta W = B A, \quad A \in \mathbb{R}^{r \times d}, \quad B \in \mathbb{R}^{d \times r}
```

$r \ll d$. 4-16 순위는 주의를 위한 표준이며, 64-128 순위는 무거운 미세한 음향을 위한 표준이다.$2 \cdot d \cdot r$대신$d^2$. SDXL의 관심에 대해$d=640$$r=16$: 410k 대신 20k 패러마이드가 있습니다. 전체 모델에 걸쳐: LoRA는 일반적으로 20-200MB에 5GB에 비해

결론적으로 로라를 확장할 수 있습니다.$W' = W + \alpha \cdot B A$-$\alpha = 0.5\text{-}1.5$여러 로라가 추가적으로 쌓여 있다 (일반적으로 비선형적으로 상호 작용한다는 경고를 가지고 있다).

### IP 어댑터 (Ye et al., 2023)

* 이미지 * 를 조건화 ( 텍스트와 함께) 로 받아들이는 작은 어댑터. 이미지 토큰을 생성하기 위해 CLIP 이미지 코더를 사용합니다. 텍스트 토큰과 함께 크로스-아트런션으로 주입합니다. ~ 20MB 기본 모델당. 로라 없이 "이 참조 스타일의 이미지를 생성" 할 수 있습니다.

## 컴포지बिल리티 매트릭스

| Tool | What it controls | Size | When to use |
|------|------------------|------|-------------|
| ControlNet | Spatial structure (pose, depth, edges) | 70-360MB | Exact layout, composition |
| LoRA | Style, subject, concept | 20-200MB | Personalization, style |
| IP-Adapter | Style or subject from reference image | 20MB | No text can describe the look |
| Textual Inversion | Single concept as a new token | 10KB | Legacy, mostly replaced by LoRA |
| DreamBooth | Full fine-tune on a subject | 2-5GB | Strong identity, high compute |
| T2I-Adapter | Lighter ControlNet alternative | 70MB | Edge devices, inference budget |

제어망은 공간, 로라는 의미, 둘 다 사용하세요

```figure
v4-controlnet-zero
```

## 건설 해

`code/main.py`1D에서 두 메커니즘을 시뮬레이션합니다:

1. **LoRA.**선행된 선형층$W$얼어붙여, 낮은 순위인 훈련$BA$그런 것$W + BA$목표 선형 층과 일치합니다$r = 1$순위 1의 수정법을 완벽하게 배울 수 있을 만큼 충분합니다.

2. **ControlNet-lite.**"냉장고 기반" 예측기 및 추가 신호를 읽는 "면 네트워크"입니다. 옆 네트워크의 출력은 0으로 초기화 된 학습 가능한 스칼라에 의해 게이트됩니다.

### 단계 1: 로라 수학

```python
def lora(W, A, B, x, alpha=1.0):
    # W is frozen; A, B are the trainable low-rank factors.
    return [W[i][j] * x[j] for i, j in ...] + alpha * (B @ (A @ x))
```

### 단계 2: 제로인트 사이드 네트워크

```python
side_out = control_net(x, condition)
gated = gate * side_out  # gate initialized to 0
h = base(x) + gated
```

단계 0에서 출력은 기본과 동일합니다. 초기 교육 업데이트 `gate`천천히  재앙적인 파동이 없습니다.

## 함정

- **Over-scaling LoRAs.** $\alpha = 2$또는$\alpha = 3$일반적인 "더 강하게 해킹"입니다.$\alpha \le 1.5$- 그래
- **ControlNet weight conflict.**무게 1.0에 있는 포즈 컨트롤넷과 무게 1.0에 있는 깊이 컨트롤넷을 사용하는 것은 보통 과격이 됩니다. 무게의 합 ≈ 1.0은 안전한 기본입니다.
- **LoRA on the wrong base.**SDXL LoRA는 SD 1.5에 침묵으로 작동하지 않습니다. 주의 차원이 일치하지 않기 때문에. 디스퍼스는 0.30+에서 경고합니다.
- **Textual Inversion drift.**한 점에서 훈련된 토큰은 다른 점에서 잘 움직이지 않습니다.
- **LoRA weight-merging and storage.**더 빠른 추론을 위해 기본 모델 중량에 LoRA를 구울 수 있습니다 (런타임 추가가 없습니다), 하지만 확장 능력을 잃습니다$\alpha$실행시간에 두 버전을 모두 보관하세요

## 사용 하 고

| Goal | 2026 pipeline |
|------|---------------|
| Reproduce a brand's art style | LoRA trained on ~30 curated images at rank 32 |
| Put my face in a generated image | DreamBooth or LoRA + IP-Adapter-FaceID |
| Specific pose + prompt | ControlNet-Openpose + SDXL + text |
| Depth-aware composition | ControlNet-Depth + SD3 |
| Reference + prompt | IP-Adapter + text |
| Exact layout | ControlNet-Scribble or ControlNet-Canny |
| Background replace | ControlNet-Seg + Inpainting (Lesson 09) |
| Fast 1-step style | LCM-LoRA on SDXL-Turbo |

## 선박

저장`outputs/skill-sd-toolkit-composer.md`. 스킬은 작업 (인포트 자산: 프롬프트, 선택적 참조 이미지, 선택적 포즈, 선택적 깊이, 선택적 스크립트) 을 수행하고 도구 스택, 무게 및 재생 가능한 씨앗 프로토콜을 출력합니다.

## 운동

1. **Easy.**내`code/main.py`, 로라 순위를 변화시키`r`1에서 4까지의 순위에서, LORA는 2등급 목표 델타와 정확히 일치합니까?
2. **Medium.**두 개의 별도의 LoRA를 두 개의 목표 변환에 훈련시켜서 함께 로드하고 합성 상호작용을 보여주십시오. 상호작용은 언제 선형성을 깨나요?
3. **Hard.**스파일링을 위해 디푸저를 사용: SDXL-베이스 + Canny-ControlNet (중도 0.8) + 스타일 로라 ($\alpha$0.8) + IP-Adapter (중도 0.6) 스택 중량이 달라질 때 FID와 즉각적 준수 대상을 측정하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| ControlNet | "Spatial control" | Cloned encoder + zero-conv skips; reads a conditioning image. |
| Zero convolution | "Starts as identity" | 1×1 conv initialized to zero; ControlNet starts as no-op. |
| LoRA | "Low-rank adapter" | $W + BA$, $r \ll d$; 100x fewer params than a full fine-tune. |
| rank r | "The knob" | LoRA compression; 4-16 typical, 64+ for heavy personalization. |
| $\alpha$ | "LoRA strength" | Runtime scaling of the LoRA delta. |
| IP-Adapter | "Reference image" | Small image-conditioning adapter via CLIP-image tokens. |
| DreamBooth | "Full subject fine-tune" | Train the full model on ~30 images of a subject. |
| Textual Inversion | "New token" | Learn a new word embedding only; legacy, mostly replaced. |

## 생산 메모: LoRA swaps, ControlNet 라인, 다중 임차자 서비스

실제 텍스트-이메이크 SaaS는 동일한 기본 체크포인트에서 수백 개의 LoRA와 수십 개의 ControlNets를 서비스합니다. 서비스 문제는 LLM 멀티 렌터링과 많이 비슷합니다 (생산 문헌은 연속 배팅 및 LoRAX / S-LoRA 아래 LLM 케이스를 다루고 있습니다):

- **Hot-swap LoRAs, do not merge.**합병$W' = W + \alpha \cdot B \cdot A$기지에 들어가면 ~ 3-5% 더 빠른 단계 추론을 얻을 수 있지만 얼어붙습니다$\alpha$로라를 VRAM에서 랭크-r 델타로 따뜻하게 유지하십시오.`pipe.load_lora_weights()`+ `pipe.set_adapters([...], adapter_weights=[...])`요청에 따라 활성화 할 수 있습니다. 교환 비용은 `2 · d · r · num_layers`무게  MB 규모, 미세컨트리
- **ControlNet as a second attention lane.**복제된 코더는 기지와 평행으로 실행됩니다. 무게 1.0 각의 두 ControlNets = 한 단계에 추가로 2개의 앞으로 통과, 통합된 패스 없습니다. 배트 크기의 헤드룸은 사각형으로 떨어집니다. 활성 ControlNet 당 ~ 1.5 × 단계 비용 예산.
- **Quantized LoRAs too.**기본을 양자화 한 경우 (강좌07 참조, 8GB에 대한 흐름) LoRA 델타 또한 8비트 또는 4비트로 순수적으로 양자화합니다. QLoRA 스타일의 로딩은 메모리를 불어 넣지 않고 4비트 플러크스 기본 위에 5-10 LoRA를 쌓을 수 있습니다.

플루크스 특유: Niels의 플루크스-on-8GB 노트북은 4비트까지의 기지를 양자화하고,`pipe.load_lora_weights("user/style-lora")`) 이 양자 기준으로`weight_name="pytorch_lora_weights.safetensors"`2026년 대부분의 SaaS 에이전시들이 발급하는 레시피입니다.

## 더 많은 읽기

- [Zhang, Rao, Agrawala (2023). Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543) 컨트롤넷
- [Hu et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) LoRA (주래적으로 LLM를 위한 것, 전파 항구)
- [Ye et al. (2023). IP-Adapter: Text Compatible Image Prompt Adapter](https://arxiv.org/abs/2308.06721) IP 어댑터
- [Mou et al. (2023). T2I-Adapter: Learning Adapters to Dig Out More Controllable Ability](https://arxiv.org/abs/2302.08453) ControlNet에 대한 가벼운 대안.
- [Ruiz et al. (2023). DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation](https://arxiv.org/abs/2208.12242) 드림보트
- [HuggingFace Diffusers — ControlNet / LoRA / IP-Adapter docs](https://huggingface.co/docs/diffusers/training/controlnet) 참조 파이프 라인
