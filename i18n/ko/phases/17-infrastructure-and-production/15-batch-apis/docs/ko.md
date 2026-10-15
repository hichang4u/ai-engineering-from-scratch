# 배트 API  산업 표준으로 50% 할인

> 모든 주요 공급자는 50% 할인 및 ~ 24 시간 회전으로 아싱크 패치 API를 배포합니다. OpenAI, 인тропо직, 구글, 그리고 대부분의 추론 플랫폼 (Fireworks 배트 계층, Together 배트) 은 동일한 패턴을 구현합니다. 빠른 캐시링과 하루가 지나면 파이프라인이 발생하는 스택 배트는 시크로노스-나카치 비용의 10%까지 떨어집니다. 규칙은 매우 간단합니다. 상호작용적이지 않으면 대량으로 이루어집니다. 콘텐츠 생성 파이프라인, 문서 분류, 데이터 추출, 보고서 생성, 대량 표기, 카탈로그 태그링 24시간 지연을 용납하는 모든 것은 배치를 할 때까지 테이블에 남아있는 돈입니다. 2026년 생산 패턴은 새로운 LLM 작업 부하를 3개의 라인으로 분류하는 것입니다. 인터랙티브 (캐시링과 동기화), 반 인터랙티브 (fallback과 아싱크 큐), 배트 (오버 나이트, 캐시된 입력 팩). 상호작용적인 것처럼 보이지만 지연시간을 지내는 작업량은 대부분 낭비됩니다.

**Type:** Learn
**Languages:** Python (stdlib, toy batch-vs-sync cost simulator)
**Prerequisites:** Phase 17 · 14 (Prompt & Semantic Caching)
**Time:** ~45 minutes

## 학습 목표

- 3개의 공급자 배트 API (OpenAI, Anthropic, Google) 과 공통 50% 할인 + 24시간 회전 보증의 이름을 적어 주십시오.
- 하루가 지나간 분류 작업량에서 패치 + 캐시 입력의 스파킹 비용을 계산하고 동기부여-불체코드 기준에 비교한다.
- 작업 부하를 인터랙티브/ 반 인터랙티브/ 배트로 세분화하고 라인을 정당화하십시오.
- 두 함정: 부분 상호작용 (이용자가 24h보다 빨리 예상) 과 출력 스케마 유동 (프로그램 파일 형식은 공급자에 따라 다릅니다)

## 문제

여러분의 팀은 매일 매일 보고서를 생성하는 파이프라인을 보내죠. 50,000개의 문서, 각각의 내용을 요약하고, 요약들을 묶어, 경영자 서명을 작성합니다. 시크로노스 실행은 4시간 동안 $2,000/밤에 걸립니다.

이 배트는 50% 할인됩니다. 또한 시스템 프롬프트 (모든 50k 통화에서 공유) 에 프롬프트 캐시 기능을 제공합니다. 팩하면 청구서는 기본 라인의 ~ ~9%로 떨어집니다. 동일한 파이프라인, 세 가지 구성 변경 사항.

배치는 LLM 비용 도구에서 아무도 끌어들이지 않는 가장 저렴한 레버입니다. 이유는 대부분 조직적입니다. 팀들은 "실제 시간"을 생각하지만 SLA는 실제로 "어침에"입니다. 이 교훈은 90%의 청구서를 테이블에 남기지 않는다는 것입니다.

## 개념

### 3차 대량 API

**OpenAI Batch API**: 요청 목록이 있는 JSONL 파일 업로드. 24 시간 회전 약속 (실제로 보통 ~ 2-8 시간). 입력 및 출력 토큰에 50% 할인. `/v1/batches`캐시 지원된 입력도 캐시 입력 가격에 추가됩니다.

**Anthropic Message Batches**JSONL 업로드 24시간 회전 50% 할인 지원`cache_control` 캐시 글은 명시적이지만, 배트 내에서 자동으로 읽습니다.

**Google Vertex AI Batch Prediction**: BigQuery 또는 GCS 입력. 쌍둥이를 위해 50% 할인. Vertex 파이프라인과 통합.

### 의미: 비동기, 느리지는 않습니다

패치는 "24시간 이내에 돌아올 것을 약속한다"  "이 24시간이 걸릴 것이다". 전형적인 P50는 2-6시간이다. GPU 재고가 미흡하게 사용되면 공급자는 정중한 창 중에 패치를 일정이 된다.

### 캐시링으로 쌓여

같은 4K 토큰 시스템 림과 함께 50k 문서의 요약:

- 시크로노 캐시 없는: 50000 × ($input × 4000 + $출력 × 200) 전체 속도
- 동기부여 캐시: 시스템 명령어 첫 번째 작성 후 캐시; 나머지 49999는 10x 더 저렴한 입력을 얻습니다.
- 캐시된 배트: 위의 모든 것 과 읽기 및 쓰기 모두에 50% 할인

스택: 배치 + 캐시 = 시크로네이션 캐시 없는 청구서의 ~ 10%. 밤새 실행되는 모든 작업 부하와 공유 시스템 프롬프트가 있어야 합니다.

### 작업량 분류

**Interactive** 사용자 응답을 기다리고 있습니다. TTFT가 중요합니다. 시크로노 통화와 신속한 캐시. 대량 할 수 없습니다.

**Semi-interactive** 사용자가 작업을 제출하고 몇 분 후에 다시 확인합니다. 배트가 사용할 수 없는 경우 동기화 할 수있는 fallback과 아싱크 줄을 . 중량 RAG 인덱싱을 생각해보십시오.

**Batch** 사용자는 "어침" 또는 "다음 시간"에 결과물을 기대합니다.

일반적인 오류: 모든 것을 상호 작용으로 분류합니다. 파이프라인은 생산입니다. 생산은 지연성 사양이 아닙니다.

### 부분 상호작용 함정이

일부 기능들은 상호작용적이지만 5-10분 정도 용납된다. 예: "신생" 버튼을 가진 밤마다 고객 건강 보고. 사용자가 클릭하면 "신생"을 클릭하면 10분 정도 기다립니다. 팀은 동기화로 전송합니다. 50개의 동시적인 업데이트는 대량 및 이메일로 전달되는 것보다 10배가량으로 비용이 들습니다.

"24시간은 이 사용자 에게 무슨 의미?"라는 질문 을 묻는 것 은, "그 들 이 알아차리지 않을 것"이라고 대답 한다면,

### 출력 스케마 함정이

배트 파일 형식은 공급자마다 다릅니다.

- JSONL, 한 라인당 한 요청
- 인문: JSONL, 한 라인당 하나의 메시지; 응답 형식이 임베디드.
- Vertex: BigQuery 테이블 또는 TFRecord를 가진 GCS 사전

공급자마다 "하나의 패치 클라이언트"를 작성하는 것은 공급자마다 어댑터 코드를 의미합니다. 다중 공급자 패치를 광고하는 게이트웨이 (Portkey, LiteLLM 일부 계층) 는 여전히 원료 형식을 얇게 포장합니다.

### 기억해야 할 숫자

- 공급자 간 배트 할인: 50%의 입출력
- 회전 SLA: 24시간 보장, 2-6시간 전형적인 P50.
- 팩 패치 + 캐시 입력: 시그네이션 캐시되지 않은 비용의 ~ 10%.
- 작업량 배열 규칙: 24시간 지연이 허용되는 경우 항상 배치를 해야 합니다.

```figure
batch-lane-triage
```

## 사용 하 고

`code/main.py`50k 문서 작업량에 대한 동기화, 동기화+캐시, 배트 및 배트+캐시의 비용을 계산합니다.

## 선박

이 교훈은`outputs/skill-batch-triager.md`. 작업량 특성을 고려하면 인터랙티브/반/배치로 분류하고, 절약을 추정한다.

## 운동

1. 달아`code/main.py`3K 토큰 시스템 프롬프트와 500 토큰 출력으로 100k 문서 파이프라인에서 전체 스택 (배치 + 캐시) 와 동기화 기본 라인스의 저축을 계산하십시오.
2. 실제 제품에서 3가지 특징을 선택하고, 각각의 특징을 인터랙티브/반/배치로 배열합니다.
3. 한 사용자가 3시간 동안 보고를 받았다고 불평합니다.
4. 패치 API 반환 SLA는 24h이지만 P99는 20시간입니다. 이것을 사용자에게 어떻게 전달합니까?
5. 계산 밸런스: 공유 프리픽스 길이는 어느 정도에 따라 패치 + 캐시가 자신의 예약된 GPU에서 하루아침에 실행하는 것보다 저렴해질 수 있습니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Batch API | "async discount" | 50% off with 24h turnaround |
| JSONL | "batch format" | One JSON request per line; OpenAI/Anthropic standard |
| Message Batches | "Anthropic batch" | Anthropic's batch API product name |
| Batch prediction | "Vertex batch" | Vertex AI's batch API product |
| Turnaround SLA | "24h promise" | Guarantee, not typical; typical is 2-6h |
| Workload triage | "interactivity decision" | Interactive / semi / batch routing decision |
| Output schema | "response format" | Per-provider JSONL layout; not portable |
| Stacked discount | "batch + cache" | ~10% of uncached sync bill when both apply |

## 더 많은 읽기

- [OpenAI Batch API](https://platform.openai.com/docs/guides/batch) JSONL 형식 및 `/v1/batches`의미론을
- [Anthropic Message Batches](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing) 배트 형식 및 `cache_control`상호작용
- [Vertex AI Batch Prediction](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/batch-prediction-gemini) 쌍둥이 배트 의미론
- [Finout — OpenAI vs Anthropic API Pricing 2026](https://www.finout.io/blog/openai-vs-anthropic-api-pricing-comparison)
- [Zen Van Riel — LLM API Cost Comparison 2026](https://zenvanriel.com/ai-engineer-blog/llm-api-cost-comparison-2026/)
