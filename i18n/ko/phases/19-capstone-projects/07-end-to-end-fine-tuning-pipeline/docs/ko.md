# Capstone 07  끝에서 끝까지의 정교조 파이프라인 (SFT에서 DPO로 제공되는 데이터)

> 8B 모델은 여러분의 데이터에 의해 훈련되고, DPO가 여러분의 선호도에 따라 조정되고, 양자화되고, 추측적으로 해독되고, 2026 오픈 스택은 Axolotl v0.8, TRL 0.15, 반복용 Unsloth, 양분화용 GPTQ/AWQ/GGUF, 서비스용 EAGLE-3와 vLLM 0.7이다. 최종 목표는 전체 파이프라인을 재생 가능한  YAML에 실행하고,      端点出, 그리고 2026 모델 오픈스 프레임워크에 따라 모델 카드를 발표하는 것입니다.

**Type:** Capstone
**Languages:** Python (pipeline), YAML (configs), Bash (scripts)
**Prerequisites:** Phase 2 (ML), Phase 3 (DL), Phase 7 (transformers), Phase 10 (LLMs from scratch), Phase 11 (LLM engineering), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P2 · P3 · P7 · P10 · P11 · P17 · P18
**Time:** 35 hours

## 문제

2026년 모든 진지한 인공지능 팀은 정비 파이프라인을 계속 유지합니다. 그들은 국경 기본 모델을 배포하기 때문이 아니라,  도메인 SFT, DPO에 대한 라벨화된 선호도, 유적 디코딩을 위한 정제된 드래프트, EAGLE-3 을 제공하여 측정 가능한 승리가 생기는 곳이기 때문입니다. Axolotl v0.8는 여러 GPU SFT 구성을 처리합니다. TRL 0.15는 DPO와 GRPO를 처리합니다. 언슬롯은 빠른 단일 GPU 반복을 제공합니다. vLLM 0.7은 EAGLE-3로 품질 손실 없이 2-3x의 디코딩 처리량을 밀어냅니다. 도구는 작동하고, 공예는 YAML, 데이터 위생, 평가 규율에 있습니다.

당신은 작업에 대한 데이터에 대한 8B 기반 (Llama 3.3, Qwen3 또는 Gemma 3) 을 SFT를 통해 DPO를 실행하고, 서비스하기 위해 양자화하고, lm 평가-가용, RewardBench-2, MT-Bench-v2 및 MMLU-Pro에 대한 이익을 측정합니다. 당신은 2026 모델 개방 프레임워크에 따라 모델 카드를 생성합니다. 점은 재생 가능성입니다.

## 개념

파이프라인에는 5단계가 있습니다.**Data**: dedup (MinHash / Datatrove), 품질 필터 (Nemotron-CC 스타일 분류자), PII 스크러브, 공공 기준 오염에 대한 분산 위생 검사. **SFT**: Axolotl YAML, ZeRO-3 8xH100, 코시네 스케줄, 포장된 순서, 2-3 시대. **DPO or GRPO**: TRL 구성, 1 시대, 인간 표기 또는 모델에 의해 평가되는 선호도 쌍, 베타 조정. **Quantize**: GPTQ + AWQ + GGUF의 배치 유연성. **Serve**: vLLM 0.7 EAGLE-3 가설적인 헤드 (또는 SpecForge 와 SGLang), K8s 배포, HPA 대기 대기

배포는: SFT-only vs SFT+DPO vs SFT+GRPO 세 작업 특정 벤치마크에 따라 제공됩니다. 서비스 매트릭스: 토큰 /s 1 / 8 / 32 배트, EAGLE-3 수용률, $/1M 토큰. 안전 평가: Llama Guard 4 통과율. 모델 카드: 편향 평가, 재생 가능성 씨앗, 데이터 라이선스.

## 건축

```
raw data (HF datasets + internal)
    |
    v
Datatrove dedup + Nemotron-CC quality filter + PII scrub
    |
    v
split hygiene (MMLU-Pro contamination check)
    |
    v
Axolotl SFT config (YAML)  ---> 8xH100, ZeRO-3
    |
    v
TRL DPO / GRPO config       ---> 4xH100, 1 epoch
    |
    v
GPTQ + AWQ + GGUF quantize
    |
    v
vLLM 0.7 + EAGLE-3 speculative decoding
    |
    v
K8s deployment, HPA on queue-wait
    |
    v
lm-eval-harness + RewardBench-2 + MT-Bench-v2 + MMLU-Pro
    |
    v
model card (2026 MOF) + safety eval (Llama Guard 4)
```

## 

- 데이터: 추출을 위한 데이터 트로브, 품질을 위한 네모트론-CC 분류기, PII를 위한 프레시디오
- 기본: Llama 3.3 8B, Qwen3 14B, 또는 Gemma 3 12B
- SFT: ZeRO-3, 플래시 주의 3, 포장된 순서
- 선호도 조정: DPO 또는 GRPO에 대한 TRL 0.15; 단일 GPU 반복에 대한 Unsloth
- 양자: GPTQ (Marlin), AWQ, GGUF (Lamma.cpp) 를 통해
- 서비스: vLLM 0.7 EAGLE-3 가설적 디코딩 (또는 SGLang 0.4 + SpecForge)
- Eval: lm 평가용, RewardBench-2, MT-Bench-v2, MMLU-Pro
- 안전 평가: 라마 가드 4, 쉴드게마-2
- 인프라: Kubernetes + NVIDIA 장치 플러그인, HPA 대기 대기 메트릭
- 관찰 가능: 훈련용 W&B, 추론용 Langfuse

```figure
ce-finetune-stages
```

## 건설 해

1. **Data pipeline.**원료 코퍼스에 데이터 트로브 분배를 실행하고 네모트론 CC 스타일의 품질 분류기를 적용하고 프레시디오 스크러브 PII를 작성하고 정해진 씨앗으로 열/발 분배를 작성합니다.

2. **Contamination check.**각 검증 분할에 대해, MMLU-Pro, MT-Bench-v2, RewardBench-2 테스트 세트를 통해 MinHash를 계산하고, 모든 겹치는 것을 거부합니다.

3. **Axolotl SFT.**ZeRO-3, FA3, 순서 포장, 8xH100에서 2~3시대 로그인

4. **TRL DPO / GRPO.**SFT 체크포인트를 가져가, 선호도 쌍 (또는 수학/코드에서 검증 가능한 보상으로 GRPO) 에 한 시대 DPO를 실행하십시오.

5. **Quantize.**llama.cpp에 대한 GPTQ-INT4-Marlin, AWQ-INT4, GGUF-Q4_K_M의 3개의 퀀트를 생성합니다. 기록 크기와 명칭 처리량.

6. **Serve with speculative decoding.**vLLM 0.7는 Red Hat 스펙룰러를 통해 훈련된 EAGLE-3 드래프트 헤드와 구성됩니다. 배트 1 / 8 / 32에서 수용률과 꼬리 지연을 측정합니다. 같은 평가에서 $/1M 토큰과 인트로픽 / 오픈AI를보고합니다.

7. **Eval matrix.**리워드 벤치 2, MT 벤치 v2, MMLU-Pro를 기본으로 실행하고, SFT+DPO, SFT+GRPO를 실행하고, 테이블을 생성합니다.

8. **Safety eval.**라마 경비 4번 통과율 디바이스 세트 쉴드게마-2 출력 필터

9. **Model card.**MOF 2026 템플릿: 데이터, 훈련, 평가, 안전, 라이선스, YAML와 컴티드 SHAs의 재생 가능성 섹션

## 사용 하 고

```
$ ./pipeline.sh config/llama3.3-8b-domainX.yaml
[data]    300k deduped, 12k filtered, 280k accepted (seed=7)
[SFT]     3 epochs, 8xH100, 6h12m, val loss 1.42 -> 1.03
[DPO]     1 epoch, beta=0.08, 4xH100, 1h40m
[quant]   GPTQ-INT4 4.6 GB, AWQ-INT4 4.8 GB, GGUF-Q4_K_M 5.1 GB
[serve]   vLLM 0.7, EAGLE-3 acceptance 0.74, p99 126ms @ bs=8
[eval]    MMLU-Pro +3.2, MT-Bench-v2 +0.41, RewardBench-2 +0.08
[card]    model-card.md generated under 2026 MOF
```

## 선박

`outputs/skill-finetuning-pipeline.md`전달 가능한 것을 설명합니다. 하나의 명령은 SFT를 통해 DPO를 통해 quant을 통해 eval을 통해 서비스하는 데이터를 실행하고, 모델 카드 + 서비스된 엔드포인트를 발급합니다.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Eval delta vs base | Measured gain on target tasks (MMLU-Pro, MT-Bench-v2, task-specific) |
| 20 | Pipeline reproducibility | One command reruns end to end with identical seeds |
| 20 | Data hygiene | Dedup rate, PII scrub coverage, contamination check green |
| 20 | Serving efficiency | tokens/s at bs=1/8/32, EAGLE-3 acceptance rate, $/1M tokens |
| 15 | Model card + safety eval | 2026 MOF completeness + Llama Guard 4 pass rate |
| **100** | | |

## 운동

1. 동일한 작업별 기준에서 SFT+DPO와 SFT+GRPO를 실행하십시오. 어떤 선호 방법이 얼마나 많은 것으로 승리하는지 보고하십시오.

2. Llama 3.3 8B를 Qwen3 14B로 교환해 1M달러의 토큰을 동일 품질로 측정해

3. 도메인 데이터와 일반 ShareGPT에 대한 EAGLE-3 수용률을 측정합니다.

4. 오염의 1%를 주입하고, 다시 평가를 실행하고, MMLU-Pro의 정확성을 비현실적으로 점프하는 것을 관찰하고, 이것을 잡는 오염 검사 CI 게이트를 구축합니다.

5. 전체 미세조정에 대안으로 LoRA SFT를 추가합니다. 10x 낮은 메모리에서 품질 격차를 측정합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Axolotl | "SFT trainer" | Unified YAML-driven trainer for SFT, DPO, and distillation |
| TRL | "Preference tuner" | Hugging Face library for DPO, GRPO, PPO on LLMs |
| GRPO | "Group-relative policy optimization" | DeepSeek R1's RL recipe with verifiable rewards |
| EAGLE-3 | "Speculative decoding draft" | Draft heads that predict N tokens ahead; vLLM verifies with target model |
| MOF | "Model Openness Framework" | 2026 standard for grading model releases on data, code, license |
| Contamination check | "Split hygiene" | MinHash-based detection of test-set leakage into training |
| Acceptance rate | "EAGLE / MTP metric" | Fraction of drafted tokens the target model accepts |

## 더 많은 읽기

- [Axolotl documentation](https://axolotl-ai-cloud.github.io/axolotl/) 참조 SFT / DPO 트레이너
- [TRL documentation](https://huggingface.co/docs/trl) DPO 및 GRPO 참조 구현
- [Unsloth](https://github.com/unslothai/unsloth) 단일 GPU 반복 참조
- [DeepSeek R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) GRPO 방법론
- [vLLM + EAGLE-3 documentation](https://docs.vllm.ai) 참조 서비스 스택
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) 대체 투기 해독 트레이너
- [Model Openness Framework 2026](https://isocpp.org/) 공개 출력 등급 표준
- [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) 가톨릭 평가 실행자
