# 에이글-3 생산에서 추측적 디코딩

> 추측적인 디코딩은 빠른 드래프트 모델과 목표 모델의 결합을 합니다. 이 조안은 K 토큰을 제안하고, 목표가 단일 포워드로 확인되고, 받아들여진 토큰은 무료입니다. 2026년, EAGLE-3는 생산급 변종으로                                                                                                                                                                                                                                                         올바른 질문은 "프로그램이 얼마나 빨리 진행되고 있는가"가 아니라 "내 트래픽에 알파가 얼마나 많은가?"라고 하는 것이 아닙니다. 알파가 0.55 이하로 떨어지면, 추측적 디코딩은 높은 동시율에서 순 음이 됩니다. 왜냐하면 거절된 모든 드래프트가 두 번째 목표 전진을 지불하기 때문입니다. 이 수업은 먼저 알파를 측정하고, 두번째로 깃발을 반향시키는 법을 가르쳐줍니다.

**Type:** Learn
**Languages:** Python (stdlib, toy acceptance-rate simulator)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 10 · 18 (Multi-Token Prediction)
**Time:** ~60 minutes

## 학습 목표

- 3세대 가상의 해독을 명명하고 EAGLE-3가 EAGLE-2와 고전적인 드래프트 모델에서 어떤 변화를 가져왔는지 설명하십시오.
- 수용률 알파를 정의하고, 알파와 K (프로젝트 길이가) 에서 예상되는 가속도를 계산하고, 목표 동시점의 브레이크-이브 알파를 식별하십시오.
- vLLM 2026에서 추측적 디코딩이 선택 (전설이 아닌) 인 이유를 설명하고 알파 측정 없이 그것을 활성화하는 것은 생산 반 패턴이 되는 이유를 설명하십시오.
- 측정 계획을 작성하십시오. 어떤 기준, 어떤 분포를 촉구, 어떤 동시점, 어떤 매트릭을 입력해야 합니다.

## 문제

디코드는 메모리 제한적입니다. Llama 3.3 70B FP8를 실행하는 H100에서, 디코딩된 토큰은 각각 무게의 ~140 GB/s를 읽고 하나의 토큰을 발산합니다. 디코딩 중에 GPU 계산은 거의 비동적입니다.

추측적 디코딩은 격차를 이용한다. 저렴한 드래프트 모델로 K 후보 토큰을 생성하고, 다음 표본 모델이 하나의 포워드 패스에서 모든 K를 확인하도록 요청한다. 확인된 토큰은 사실상 무료 ( 표본은 어쨌든 해야 할 K 포워드로 무상화된다).

클래식 드래프트 모델 접근법은 같은 가족의 작은 모델을 사용한다 (Llama 3.2 1B 드래프트 Llama 3.3 70B). 효과가 있지만 수용률은 중간  작은 모델 분포는 목표에서 벗어납니다. 이글, 그리고 이글-2, 그리고 이글-3은 표본의 내부 상태에 직접 가벼운 초축 머리를 훈련시켜서, 그래서 알파는 드래프트 모델에서 0.4에서 EAGLE-3에서 0.6-0.8으로 올라갑니다.

포획: EAGLE-3는 vLLM 2026에 참여하는 것을 선택합니다.`speculative_config`알파를 측정하지 않고 켜는 팀은 종종 꼬리 지연이 더 악화되는 것을 보게 됩니다.

## 개념

### 실제로 추측적인 디코딩이 무엇을 구매하는지

스펙 디코드가 없으면, 토큰 당 비용은 1개의 목표 전향입니다. 드래프트 길이가 K와 수용 알파에 있는 스펙 디코드가 있으면, 목표 전향 당 예상 토큰은 `1 + K * alpha`- 가속화가`(1 + K * alpha) / (1 + epsilon)`epsilon는 draft+verify 상용 비용입니다. K=5에 대해, alpha=0.7:`(1 + 5*0.7) / (1 + 0.1) = 4.5 / 1.1 = 4.1x`실제 세계 숫자는 2-3x 정도 모여 있습니다. 왜냐하면 알파는 생산 트래픽에서 거의 높지 않기 때문에, 에프실론은 높은 배트 크기로 성장합니다.

### 왜 알파가 중요한 유일한 메트릭인지

거부된 토큰은 사라지지 않습니다  그들은 첫 번째 거부된 토큰을 위해 두 번째 목표를 밀어 넣습니다. 알파가 0.4로 떨어지는 작업 부하에서, 당신은 초안 과장과 검증과 재부름을 지불합니다. 높은 동시 (예컨대 256 동시) 에서, 디코드 배치는 이미 메모리-밴드위드 격차가 "목적만"과 "확인하는 목표" 사이의 크기가 줄어들도록 충분히 크다. 2026 하드웨어의 대부분에서 알파 0.55 이하의 경우, 스펙 디코드는 음수입니다.

알파는 작업량에 따라 달라진다. ShareGPT 스타일의 일반 채팅에서, ShareGPT에서 훈련된 EAGLE-3는 0.6-0.8을 달성합니다. 도메인 특정 트래픽 (코드, 의료, 법적) 에서 일반 데이터에 대한 훈련 된 드래프트 헤드 0.4-0.6로 떨어집니다. 도메인 특정 드래프트 헤드 훈련은 목표 미세 조정과 비교하여 가볍고 빠른 훈련 작업입니다.

### 이글 세대 는 한 눈에

- **Classic draft model**: 같은 가족 중 작은 모델. 알파 0.3-0.5. 인프라 단순  두 모델 로드, 드래프트 는 K를 앞으로로 전진한다.
- **EAGLE-1 (2024)**: 목표물 숨겨진 상태 (최후층) 에 훈련된 단일 드래프트 헤드.
- **EAGLE-2 (2025)**: 적응형 드래프트 길이가 나무 기반 드래프트 (하나의 목표 패스에서 여러 가지 가지 가지를 확인)
- **EAGLE-3 (2025-2026)**: 다중 목표층 (최후의 것뿐만 아니라) 에 훈련된 드래프트 헤드, 더 나은 조율.

### 2026년 생산 레시피

1. 선박 목표 모델은 단순합니다. 기본 TTFT, ITL, 목표 동시력에서 처리량을 측정합니다.
2. vLLM를 통해 EAGLE-3 드래프트를 활성화합니다 `speculative_config`- 다시 기준을 실행해
3. 로그 수용률 알파. vLLM V1은 이 사실을`spec_decode_metrics.accepted_tokens_per_request`- 요청된 드래프트 길이를 나눈다면 알파가 나올 겁니다
4. 생산 트래픽 분포에 대해 alfa < 0.55가 있는 경우, 스펙을 해독하거나 영역별로 EAGLE-3 드래프트를 훈련하십시오.
5. 생산 시동에 다시 실행하세요 P99 ITL가 악화되지 않았다는 것을 확인합니다.

### 생산 함경기: P99 꼬리

평균 ITL는 스펙 디코딩으로 떨어집니다. P99는 조율하지 않으면 악화 될 수 있습니다. 거부된 드래프트는 두 개의 패스 순서를 유발합니다. 전체 배트 하에서, 그 두 패스는 연속화됩니다. P99 ITL를 보세요, P50가 아닙니다.

### 이미 EAGLE-3를 배치한 경우

구글은 2025년 AI 개요에 가설적인 디코딩을 배포했습니다 ( 같은 품질, 더 빠른 반응). vLLM V1 선박 `speculative_config`문서화된 인터페이스로서, 그 특징 매트릭스는 추측적 디코딩을 쪼개진 사전 채용과 호환되는 것으로 표시합니다. SGLang은 예가 3을 예가 무거운 작업 부하에 권장되는 초안 경로로 지원합니다.

### 한 줄에 수학을 해체하는

예상속속도는: `S(alpha, K) = (1 + K*alpha) / (1 + verify_overhead)`설정`S = 1`알파에 대한 해답: `alpha_breakeven = verify_overhead / K`. 전형적인 verify_overhead ~0.15 및 K=5에 대해: `alpha_breakeven = 0.03`하지만 그것은 원자력 디코딩 수학입니다. 높은 동시 시공간으로 확인 오버헤드가 증가하고 디코딩 배치는 이미 염기서열을 통해 메모리를 읽습니다. 그래서 효과적인 알파_브레이크웨인은 실제로 0.45-0.55로 상승합니다.

### 가설적 디코딩을 사용하지 않는 경우

- 랩-1 오프라인 생성, 지연이 중요하지 않은 상태에서
- 매우 짧은 출력 (50 토큰 이하) 에 대한 초안 과장 비용 및 확인 비용
- 전문적인 도메인, 도메인 훈련된 드래프트 헤드 없이
- 각 기능 쌍이 구성된 것으로 가정합니다. vLLM 호환성 매트릭스를 확인합니다. v0.18.0는 쪼개진 사전 채용과 호환되는 추측적 디코딩을 표시합니다.

```figure
mx-speculative-tree
```

## 사용 하 고

`code/main.py`알파 값과 드래프트 길이를 K.의 범위에서 추측적 디코딩 없이 디코딩 루프를 시뮬레이션합니다. 그것은 브레이크-이브 알파, 측정된 스피드업, 꼬리 행동을 인쇄합니다.

## 선박

이 교훈은`outputs/skill-eagle3-rollout.md`. 목표 모델, 교통 분포 설명 및 동시 목표에 감안하여 단계적 EAGLE-3 발급 계획  기준 기준 기준을 생성하고, 구성, 측정 알파, 게이트를 알파 >= 0.55, P99 ITL를 활성화합니다.

## 운동

1. 달아`code/main.py`K=5에서 2x 가속화나 3x 가속화나하기 위해 어떤 알파가 필요할까요?
2. 생산 트래픽이 70%의 일반 채팅, 30%의 코드와 나누어져 있다고 상상해보세요. 일반 채팅은 0.7을 알파 0.7에 도달합니다.
3. VLLM를 읽어보세요`speculative_config`문서: 3가지 모드를 (프로그램 모델, EAGLE, N-그램) 지정하고 vLLM 버전에서 각각의 기능이 무엇인지 확인하세요.
4. 이글-3를 활성화한 후 평균 ITL가 25% 감소했으나 P99 ITL가 15% 증가했습니다. 진단하고 완화 제안을 해보세요.
5. Llama 3.3 70B에 대한 EAGLE-3 드래프트 헤드의 메모리 비용을 계산하세요.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Speculative decoding | "draft plus verify" | Propose K tokens with a cheap model, verify all K in one target forward |
| Acceptance rate alpha | "spec accept rate" | Fraction of draft tokens accepted by the target; the only metric that matters |
| Draft length K | "spec k" | How many tokens the draft proposes per target forward; typical 4-8 |
| Verify overhead epsilon | "spec overhead" | Extra cost to verify-and-reroll vs a plain target forward; grows with batch |
| EAGLE-3 | "latest EAGLE" | 2025-2026 variant; trains draft head on multiple target layers; alpha 0.6-0.8 on general chat |
| `speculative_config` | "vLLM spec config" | The explicit opt-in in vLLM V1; no default means no acceleration |
| N-gram spec decode | "N-gram draft" | GPU-side draft using N-gram lookups in the prompt; chunked-prefill-compatible |
| Break-even alpha | "no-op alpha" | Alpha at which spec decode gives zero speedup; watch this at production concurrency |
| Rejected-draft two-pass | "reroll cost" | Two target forwards when drafts reject; drives P99 tail |

## 더 많은 읽기

- [vLLM — Speculative Decoding docs](https://docs.vllm.ai/en/latest/features/spec_decode/) 권위 있는 자료`speculative_config`V1에서 쪼개서 채워서 호환성이 있습니다.
- [vLLM Speculative Config API](https://docs.vllm.ai/en/latest/api/vllm/config/speculative/) 정확한 필드 집합
- [EAGLE paper (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) 원본 에이글 드래프트 헤드 공식
- [EAGLE-2 paper (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) 적응형 드래프트 및 나무
- [UC Berkeley EECS-2025-224](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2025/EECS-2025-224.html) 투기적인 디코딩을 하는 효율적인 LLM 시스템.
- [BentoML — Speculative Decoding](https://bentoml.com/llm/inference-optimization/speculative-decoding) 생산 출범 체크리스트
