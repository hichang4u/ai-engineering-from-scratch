# 관리 된 LLM 플랫폼  Bedrock, Vertex AI, Azure OpenAI

> 3개의 하이퍼스칼러, 3개의 전략 AWS Bedrock은 하나의 API 뒤에 있는 모델 시장입니다. Azure OpenAI는 전용 용량을 위한 비주소 OpenAI 파트너십과 제공된 투로푸트 유닛 (PTU) 이다. 베르텍스 인공지능은 가장 좋은 장편적, 다형적 스토리를 가진 쌍둥이입니다. 2026년 인공 분석은 아저우르 오픈아이를 ~50 ms의 평균에서 측정하고, 베드로크는 ~75 ms의 Llama 3.1 405B 부등급에서 측정합니다. 결정 규칙은 "어떤 모델 카탈로그와 핀오프스 표면이 내 제품과 일치하는 것"이 아니라 "어떤 모델 카탈로그와 핀오프스 표면이 내 제품과 일치하는 것"입니다. 이 교훈은 당신에게 비브가 아닌 적혀있는 타협을 선택하도록 가르칩니다.

**Type:** Learn
**Languages:** Python (stdlib, toy cost-and-latency comparator)
**Prerequisites:** Phase 11 (LLM Engineering), Phase 13 (Tools & Protocols)
**Time:** ~60 minutes

## 학습 목표

- 세 가지 플랫폼 전략을 (시장과 독점, 쌍둥이) 명명하고 각각의 제품 사용 사례와 일치하십시오.
- Azure OpenAI에서 제공된 투로푸트 유닛 (PTU) 가 무엇을 구매하는지 설명하고, 요구에 따른 Bedrock이 405B 스케일에서 일반적으로 ~ 25 ms 느리게 읽게 되는 이유를 설명하십시오.
- 각 플랫폼에 대한 FinOps 속성 표면을 다이어그램 (Bedrock Application Inference Profiles vs Vertex project-per-team vs Azure scopes + PTU 예약)
- "두 공급자 최소" 정책을 작성하고, 한 공급자 잠금가 2026년에 비싼 실수라는 이유를 설명하십시오.

## 문제

당신은 당신의 제품에 대해 클로드 3.7 소넷을 선택했습니다. 이제 그것을 서비스해야합니다. 당신은 직접 인트로피 API를 호출할 수 있습니다, 또는 AWS Bedrock을 통해 호출할 수 있습니다, 또는 게이트웨이를 통해 이동할 수 있습니다. 직접 API는 가장 간단합니다. Bedrock은 BAAs, VPC 최종 포인트, IAM, 클라우드워치 배정 추가합니다. 게이트웨이는 공급자 간 결제오프, 통일 청구, 및 비율 제한을 추가합니다.

더 깊은 질문은 카탈로그입니다. 같은 제품에서 클로드, 라마, 트메니를 필요로 한다면, 그 장소는 동시에 베드록 + 베르텍스 + 아저 오프앤아이 인 경우를 제외하고는 모두 한 곳에서 구입할 수 없습니다. 하이퍼스컬러는 교환이 없습니다. 그들은 각각 모델 레이어를 소유하는 사람에 대해 다른 베팅을했습니다.

이 수업은 세 가지 베팅을 지도화합니다. 지연 격차, 핀오프스 격차, 그리고 잠금 위험요소.

## 개념

### 세 가지 전략

**AWS Bedrock** 시장. 클로드 (안트로피크), 라마 (메타), 타이탄 (AWS 일방), 안정 (이미지), 코헤어 (이미지), 미스트랄, 더 이미지 및 임베디션 하위 카탈로그. 한 API, 한 IAM 표면, 한 클라우드워치 수출. 베드록의 베팅은 고객이 단일 모델을 원하는 것보다 더 옵션성을 원한다는 것입니다.

**Azure OpenAI** 독점적 파트너십. 당신은 Azure 데이터 센터에서 GPT-4/4o/5o/o 시리즈, DALL·E, Whisper, 그리고 OpenAI 모델의 정교 조정을 얻을 수 있습니다. "Azure OpenAI 서비스" 카탈로그에서 OpenAI 이외의 모델은 없습니다.

**Vertex AI** 쌍둥이 먼저, 다른 모든 것이 두 번째. 쌍둥이 1.5 / 2.0 / 2.5 플래시 및 프로, 더 이상 모델 정원 (제3자). 베르텍스의 베팅은 멀티모달 긴 맥락  1M 토큰 쌍둥이 맥락이 차별화입니다.

### 스케일에서의 지연 격차

인공 분석은 지속적인 기준을 실행합니다. 동등한 Llama 3.1 405B 배포 (소상 공유) 에서, Azure OpenAI의 중간 첫 토큰 지연 시간은 약 50 ms; Bedrock은 약 75 ms이다. 격차는 AWS의 실패가 아닙니다. 그것은 용량 모델의 차이입니다. 아저우는 PTU (Provisioned Throughput Units) 를 판매하고, 이는 임대인에게 GPU 용량을 예약합니다. 베드록의 동등한 (Provisioned Throughput) 가 존재하지만, 단위당 21달러/시간 정도가 시작되며 대부분의 고객은 요구에 따라 공유됩니다.

주문형 공유 용량은 다른 모든 고객의 트래픽과 경쟁합니다. 전용 용량은 그렇지 않습니다. P99에서 TTFT < 100 ms의 제품 SLA가 있다면, 당신은 Azure에서 PTU를 구입하거나 Bedrock Provisioned Throughput을 구입하거나 기본 변수를 받아들일 수 있습니다.

### 제공된 처리량 경제학

Azure PTU: 추론 계산의 예약된 블록. 예측 가능한 작업 부하에 대한 ~70%까지의 절약과 요구에 대한 비용. 트래픽에 관계없이 시간당 고정된 비용.

침대에 공급된 출력: $21-$모델과 지역에 따라 시간당 50달러. 비슷한 수학  브레이크-이브는 절반 정도가 됩니다. 월간 약속이 필요합니다.

베르텍스 공급 용량은 Gemini SKU에 따라 판매되며, 가격은 모델과 지역에 따라 달라지며 공개적으로 광고가 덜됩니다.

### FINOPS 표면  실제 분화기

**Bedrock Application Inference Profiles**시장에서 가장 깨끗한 속성입니다.`team``product``feature`; 모든 모델 호출을 통해 라우드워치; 클라우드워치는 후처리 없이 프로필당 비용을 분할합니다. 2025 년 추가, 여전히 가장 미세한 하이퍼스칼러 원산지입니다.

**Vertex**배정은 팀당 프로젝트 + 레이블 - 모든 곳에서입니다. 당신은 GCP 프로젝트로 각 팀을 모델링하고 모든 리소스에 레이블을 넣고, 롤업에 빅쿼리 빌링 수출 + 데이터 스튜디오를 사용합니다. 더 많은 작업, 하지만 빅쿼리는 비용 데이터에 임의 SQL를 제공합니다.

**Azure**Tags는 리소스 그룹에서 상속되어 있으며 요청이 아닙니다. 따라서 요청별 배정에는 애플리케이션 인사이트 사용자 지정 매트릭 또는 헤더를 표기하는 게이트웨이가 필요합니다.

패턴: 베드록은 가장 깨끗한 네이티브, 버텍스는 빅쿼리를 통해 가장 유연하고, 아저우는 가장 불투명한 것입니다.

### 2026년 위험은 잠금

한 모델이 지배적이었던 때 단일 하이퍼스칼러의 약속은 괜찮았습니다. 2026년에는 한 달마다  클로드 3.7를 이동합니다.

패턴 작업 팀은: 제품 비중이 높은 LLM 호출에 대해 두 공급자 최소. 베드록 더 아저 오픈AI는 하나의 공통 쌍입니다. 클로드, 다른 GPT, 그들 사이의 결함이, 동일한 게이트웨이. 게이트웨이 노선이 최적이기 때문에 비용 상승은 무시할 수 없습니다. 중단 중에 사용 가능성은 상승합니다.

### 데이터 레지던스, BAA 및 규제 산업

베드록: 대부분의 지역에서 BAA, VPC 최종점, 방위선. 일반적인 핀테크 기본 설정.
Azure OpenAI: HIPAA, SOC 2, ISO 27001; EU 데이터 레지던스; 기업 규제 기본
Vertex: HIPAA, GDPR, 지역별 데이터 거주; 구글 클라우드 컴플라이언스 스택.

세 가지 모두 기본 체크 박스를 충족합니다. 차이점은 데이터 저장 정책, 로그 처리 방식, 그리고 남용 모니터링이 트래픽을 읽는지 (전반 선택 사항은 대부분; 엔터프라이즈에서 선택 사항은 사용할 수 있습니다).

### 기억해야 할 숫자

- Azure OpenAI의 중간 TTFT는 Llama 3.1 405B 동등: ~50 ms (PTU와 함께).
- 수요에 따라 베드록 중반 TTFT: ~75 ms.
- 침대에 공급된 출력: $21-$50/시간당
- Azure PTU 밸런스: ~ 40%~60% 지속가능한 사용량
- 높은 사용량에서 PTU의 저축과 수요: 최대 70%

```figure
i4-platform-lanes
```

## 사용 하 고

`code/main.py`합성 작업 부하에서 세 플랫폼을 비교합니다. 그것은 요구에 대한 경제학과 PTU, TTFT 변동 및 비용 배정 충실성을 모델합니다. PTU가 어디에서 보급되는지, 시장의 모델 너비가 TTFT 격차를 중화시키는지를 보기 위해 실행합니다.

## 선박

이 교훈은`outputs/skill-managed-platform-picker.md`. 작업량 프로파일을 고려하여 (모델이 필요, TTFT SLA, 일일 수량, 준수 요구 사항) 주요 플랫폼, 하락 및 FinOps 기기 계획을 추천합니다.

## 운동

1. 달아`code/main.py`Azure PTU는 70B 클래스 모델에 대한 요구에 비해 어떤 지속가능한 사용량을 더 많이 차지할 수 있을까요?
2. 당신의 제품은 클로드 3.7 소넷과 GPT-4o를 필요로 합니다. 두 공급자 배포를 설계합니다.  어떤 하이퍼스컬러로 이동하고, 어떤 게이트웨이 앞에 위치하고, 실패 정책은 무엇입니까?
3. 규제된 의료 고객에게는 BAA, US-East 데이터 레지던스, 그리고 sub-100ms P99 TTFT가 필요합니다. 플랫폼을 선택하고 세 가지 특정 기능을 사용하여 정당화하십시오.
4. 이달에 네 배로크 요금이 증가하고 교통이 변하지 않았다는 걸 알게 됐어요.
5. Azure OpenAI 및 Bedrock 가격 페이지를 읽어보십시오. 월 100M 토큰 클로드 작업 부하에 대해, 더 저렴합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Bedrock | "AWS LLM service" | Model marketplace across Claude, Llama, Titan, Mistral, Cohere |
| Azure OpenAI | "Azure's ChatGPT" | Exclusive OpenAI models in Azure datacenters with enterprise controls |
| Vertex AI | "Google's LLM" | Gemini-first platform with Model Garden for third-party models |
| PTU | "dedicated capacity" | Provisioned Throughput Unit — reserved inference GPUs, priced per hour |
| Application Inference Profile | "Bedrock tagging" | Per-product cost/usage profile with tags, CloudWatch-native |
| Model Garden | "Vertex catalog" | Vertex AI's third-party model section, separate from Gemini |
| Two-provider minimum | "LLM redundancy" | Policy of running every critical LLM path across ≥2 hyperscalers |
| BAA | "HIPAA paperwork" | Business Associate Agreement; required for PHI; provided by all three |
| Abuse monitoring | "the log watcher" | Provider-side safety scan on prompts/outputs; opt-out in enterprise |

## 더 많은 읽기

- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/) 권위 있는 요금 카드 및 제공된 처리량 가격
- [Azure OpenAI Service Pricing](https://azure.microsoft.com/en-us/pricing/details/azure-openai/)PTU 경제학과 금리 카드
- [Vertex AI Generative AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) 쌍둥이 계층과 모델 정원 과금
- [Artificial Analysis LLM Leaderboard](https://artificialanalysis.ai/) 공급자 간 지속적인 지연 및 처리량 기준
- [The AI Journal — AWS Bedrock vs Azure OpenAI CTO Guide 2026](https://theaijournal.co/2026/03/aws-bedrock-vs-azure-openai/) 기업 결정의 틀
- [Finout — Bedrock vs Vertex vs Azure FinOps](https://www.finout.io/blog/bedrock-vs.-vertex-vs.-azure-cognitive-a-finops-comparison-for-ai-spend) 배정 메커니즘이 옆으로 나니다.
