# A/B 테스트 LLM 특징  성장책, Statsig, 그리고 Vibes 문제

> 전통적인 A/B 테스트는 결정적이지 않은 LLM에 대한 것이 아닙니다. 중요한 차이점은: 평가들은 "모델이 그 일을 할 수 있을까?" A/B 테스트는 "이용자가 신경쓰는가?" 2026년에 무엇을 테스트해야 하는가: 신속한 엔지니어링 (문화), 모델 선택 (GPT-4 vs GPT-3.5 vs OSS; 정확성 vs 비용 vs 지연성), 생성 매개 변수 (온, 상위-p). 실제 사례: 채팅봇 보상 모델 변종은 +70% 대화 길이를 제공했고 +30% 보유량을 제공했다. 다음door AI 주체 라인 실험은 보상 기능 정비 후 +1% CTR를 제공했다. 칸 아카데미 칸미고는 지연성 대 수학 정확성 축에 반복했다. 플랫폼 분할: **Statsig**(OpenAI가 2025년 9월 11억 달러에 인수)  순차적인 테스트, CUPED, 모든 것. **GrowthBook** 오픈소스, 웨어하우스 네이티브, 베이시안 + 프리쿼티스트 + 시퀀셜 엔진, CUPED, SRM 체크, 벤자민리-호치베르크 + 보네퍼로니 수정. 웨어하우스-SQL 선호도에 따라 선택하고 "오프앤아이에서 인수"가 조직에 중요합니까.

**Type:** Learn
**Languages:** Python (stdlib, toy sequential test simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 20 (Progressive Deployment)
**Time:** ~60 minutes

## 학습 목표

- 평가 ("모델이 그 일을 할 수 있는가") 를 A/B 테스트 ("이용자가 신경쓰는 것은 아닌가요") 에서 구별한다.
- 테스트 가능한 세 개의 축 (프롬프트, 모델, 매개 변수) 를 나열하고 각 개에 대한 메트릭을 선택하십시오.
- CUPED, 순서 테스트, 그리고 벤자민-호치버그 복수 비교 수정 사항을 설명하십시오.
- 스토어스퀘어-SQL 자세와 기업 인수 입장을 기반으로 Statsig 또는 GrowthBook를 선택하십시오.

## 문제

시스템 초청을 손으로 조정했습니다. 더 좋아 보입니다. 전송합니다. 환승 변경은 소음으로 인해됩니다. 측정값을 비난합니다. 또는 새로운 모델을 전송했습니다. 변환이 움직이지 않았습니다.

이발스는 모델이 라벨된 집합에서 작업을 수행할 수 있는지 여부에 대해 대답합니다. 사용자가 출력을 선호하는지 여부에 대해서는 대답하지 않습니다. 제어 된 온라인 실험만이 응답합니다. 실험이 충분한 힘을 가지고 있다면만, 비결적주의를 제어하고 여러 비교를 수정합니다.

## 개념

### Evals vs A/B 테스트

**Evals** 오프라인, 라벨 세트, 판사 (주식 또는 판사로서의 LLM 또는 인간) 답변: "이 고정된 배포에서 출력량은 정확/ 유용/ 안전합니까?"

**A/B test** 온라인, 실시간 사용자, 무작위로 분류. 답: "새번 변종은 중요한 사용자 수준의 메트릭을 이동합니까?"

이 둘 다 요구됩니다. 에볼은 노출 이전으로 회귀를 잡습니다. A/B는 제품 영향이 확인됩니다.

### 어떤 것을 테스트해야 하는가

1. **Prompt engineering** 문법, 시스템 프롬프트 구조, 예제. 메트릭: 작업 성공, 사용자 보유, 비용/ 요청.
2. **Model selection** GPT-4 대 GPT-3.5-Turbo 대 Llama-OSS. 측정: 정확성 (task) + 비용/ 요청 + 지연성 P99. 다목적.
3. **Generation parameters** 온도, 상위 p, max_tokens. 메트릭: 작업 특수한 (출력 다양성 vs 결정성)

### CUPED  변동 감소

실험 전 데이터를 이용한 통제된 실험. 기간 전 변수를 비교하기 전에 반정기를 제거한다. 전형적인 변수를 감소시키는 방법: 30-70%. 효과적인 샘플 크기는 무료로 증가한다.

구현: Statsig과 GrowthBook 모두 구현.

### 순서 테스트

클래식 A/B는 고정된 샘플 크기를 가정합니다. 순서 테스트 ("점점-결") 는 반복적인 뷰에서 거짓 긍정적 인 비율을 제어합니다. 항상 유효한 순서 절차 (mSPRT, 하워드의 신뢰 순서) 는 명확한 승자를 일찍 멈추게 할 수 있습니다.

### 여러 비교 수정

95%의 신뢰성으로 20 A/B 테스트를 실행하면 우연히 1개의 거짓 dương tính가 발생한다. 보네퍼로니 수정은 테스트당 α를 강화하고, 벤자민리-호치베르크는 거짓 발견률을 조절한다.

### SRM  샘플 비율 불합동

할당 해시는 사용자들을 변종으로 무작위로 분류합니다. 50/50 분할이 47/53을 전달하면, 뭔가 깨집니다.

### Statsig vs 성장책

**Statsig**이 부분의 본문은
- 오픈AI가 11억 달러 (9월 2025) 에 인수했다.
- 순서적 테스트, CUPED, 견딜 수 있는 인구
- 모든 것: 특징 플래그 + 실험 + 관찰 가능
- 가장 잘 어울리는 것은 팀들이 이미 포괄된 제품을 원하고, OpenAI 소유권을 신경쓰지 않는다는 것입니다.

**GrowthBook**이 부분의 본문은
- 오픈소스 (MIT); 웨어하우스 네이티브 (스노프플렉/빅쿼리/레드시프트에서 직접 읽는다).
- 여러 엔진: 베이시안, 주파수, 순차
- CUPED, SRM, Bonferroni, BH 수정
- 자영 호스트 또는 관리 클라우드
- 가장 잘 맞는 것: 웨어하우스-SQL 가게, 데이터 팀은 메트릭 레이어를 제어하고, OSS를 원합니다.

### 비결론은 권력을 복잡하게 만듭니다

같은 프롬프트는 다양한 출력을 생성한다. 전통적인 전력 계산은 IID 관측을 가정한다. LLM 비결정주의와 함께, 효과적인 샘플 크기는 명칭보다 낮다. 안전 지점으로 요구되는 샘플 크기를 ~1.3-1.5x로 곱한다.

### 실제 사례 결과

- 채봇 보상 모델 변종: +70% 대화 길이가, +30% 보유량.
- 다음 문의 주제가: 보상 기능 정비 후 +1% CTR
- 칸 아카데미 칸미고: 반복적 지연성 대 수학 정확성 거래

### 반 패턴: 진동에 의해 배송

모든 선임 엔지니어들은 A/B 없이 "더 좋아졌어요"라는 이유로 배포된 기능을 이름을 붙일 수 있습니다. 대부분의 제품 메트릭은 몇 달 동안 팀에 주목되지 않았습니다. A/B는 강제 기능입니다.

### 기억해야 할 숫자

- 오픈아이가 인수한 스타트지그: 2025년 9월 11억 달러
- 성장북: 오픈소스 MIT; 베이시안 + 주파수 + 순서.
- CUPED 변동 감소: 30-70%
- LLM 비결정주의 → +30-50% 샘플 크기의 버퍼

```figure
mx-sequential-test
```

## 사용 하 고

`code/main.py`고정된 경계와 순서적인 경계와 함께 순서적인 A/B 테스트를 시뮬레이션합니다. 순서적인 것이 얼마나 빨리 멈출 수 있는지 보여줍니다.

## 선박

이 교훈은`outputs/skill-ab-plan.md`기능 변경, 작업량, 기본 라인, 플랫폼 선택, 게이트, 샘플 크기를 고려하면

## 운동

1. 달아`code/main.py`. 기본 기준 3%의 전환으로 예상되는 5%의 승강에 대해 80%의 전력까지 어떤 샘플 크기가 있습니까?
2. 건강 관리 규제 대상 현장 고객으로 Statsig 또는 GrowthBook를 선택하세요.
3. A/B를 설계해 GPT-4와 GPT-3.5를 테스트해 보세요.
4. 카나리 이 통과하지만 A/B는 -1.2%의 전환을 나타냅니다.
5. CUPED를 전기간에 60%의 변동으로 적용하여 실제 샘플 크기의 증가를 계산한다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Eval | "offline test" | Labeled-set evaluation of model capability |
| A/B test | "experiment" | Live randomized comparison on users |
| CUPED | "variance reduction" | Pre-period regression to reduce variance |
| Sequential test | "peek-ok test" | Always-valid procedure allowing early stop |
| Multiple comparison | "the family error" | Running many tests inflates false positives |
| Bonferroni | "tight correction" | Divide α by number of tests |
| Benjamini-Hochberg | "BH FDR" | False-discovery-rate control, less conservative |
| SRM | "bad split" | Sample ratio mismatch; assignment bug |
| Statsig | "OpenAI owned" | Commercial all-in-one, acquired 2025 |
| GrowthBook | "the OSS one" | MIT warehouse-native platform |
| mSPRT | "sequential probability ratio test" | Classical sequential procedure |

## 더 많은 읽기

- [GrowthBook — How to A/B Test AI](https://blog.growthbook.io/how-to-a-b-test-ai-a-practical-guide/)
- [Statsig — Beyond Prompts: Data-Driven LLM Optimization](https://www.statsig.com/blog/llm-optimization-online-experimentation)
- [Statsig vs GrowthBook comparison](https://www.statsig.com/perspectives/ab-testing-feature-flags-comparison-tools)
- [Deng et al. — CUPED](https://www.exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf)
- [Howard — Confidence Sequences](https://arxiv.org/abs/1810.08240)
