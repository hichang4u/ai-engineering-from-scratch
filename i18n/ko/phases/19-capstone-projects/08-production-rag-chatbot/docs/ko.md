# 캡스톤 08  규제 수직을 위한 생산 RAG 채팅봇

> 하비, 글리언, 멘데블, 램마클라우드는 모두 2026년에 같은 생산 형태를 달린다. 시각적인 용도로 docling 또는 Unstructured 및 ColPali를 섭취한다. 하이브리드 검색 Bge-Renanker-v2-gemma로 순위를 바꾸어 클로드 소넷 4.7로 합성하여 60~80%의 샷률을 사용하여 즉시 캐시링을 합니다. 라마 가드 4와 네모 가드레일 랭푸스와 피닉스를 지켜봐 200개의 질문으로 로그스에서 수평을 얻었습니다. 규제된 영역 (법률, 임상, 보험) 에 하나를 만들면, 끝돌은 황금 세트, 빨간 팀, 그리고 드래프트 다시보드를 통과합니다.

**Type:** Capstone
**Languages:** Python (pipeline + API), TypeScript (chat UI)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P5 · P7 · P11 · P12 · P17 · P18
**Time:** 30 hours

## 문제

규제 영역 RAG (법적 계약, 임상 시험 프로토콜, 보험 정책) 는 2026 년 가장 많이 배송 된 생산 형태입니다. ROI는 명백하고 이 점에는 구체적인 문제점이 있기 때문입니다. 하비 (Allen & Overy) 는 합법적으로 만들었어요. 만한 배는 개발자 문서의 맛을 낸다. 글랜은 기업 검색을 다루고 있습니다. 패턴은: 고충성 섭취, 리랜크와 하이브리드를 검색, 인용 집행과 신속한 캐시링으로 합성, 여러 안전 계층으로 보호, 그리고 지속적으로 유도 모니터링.

어려운 부분은 모델이 아닙니다. 이들은 관할지식 준수 (HIPAA, GDPR, SOC2), 인용 수준 감사성, 비용 통제 (이드률이 높을 때 신속한 캐싱은 60-90% 할인), RAGAS 충실성을 통해 환각 검출 및 원본 문서가 인덱스를 따라잡지 않고 업데이트 될 때 유동 검출입니다. 이 석탑은 200개의 질문으로 이루어진 금색 세트에 모든 것을 배포하도록 요청합니다.

## 개념

파이프라인에는 두 가지 측면이 있습니다.**Ingestion**: docling 또는 Unstructured 구조화된 문서를 분석합니다. ColPali는 시각적으로 풍부한 문서를 처리합니다. 덩어리는 요약, 태그 및 역할 기반 액세스 레이블을 얻습니다. 벡터는 pgvector + pgvector scale (50M 벡터 이하) 또는 Qdrant Cloud로 이동합니다. 희소 BM25는 옆으로 실행됩니다. **Conversation**: LangGraph는 메모리와 멀티턴을 처리하고, 각 쿼리는 하이브리드 검색을 실행하고, bge-reranker-v2-gemma-2b로 순위를 유지하며, 클로드 소넷 4.7 (프롬프트 캐시드) 로 합성하며, Llama Guard 4 및 NeMo Guardrails를 통해 출력을 전달하고, 인용을 ancored 응답을 발송합니다.

평가 스택은 네 층으로 되어 있습니다.**Golden set**정확성 (Correctness) 을 위해 200개의 인용문과 Q/A가 표시되어 있습니다. **Red team**(Jailbreaks, PII 추출 시도, 영역 밖의 질문) 안전성.**RAGAS**신뢰성 / 응답의 관련성 / 맥락 정확성**Drift dashboard**(아리즈 피닉스) 매주 검색 품질과 환각 점수를 보고 있습니다.

프롬프트 캐싱은 비용의 레버이다. 클로드 4.5+와 GPT-5+는 캐싱 시스템 프롬프트 + 검색 컨텍스트를 지원합니다. 60-80%의 잇률에서, 쿼리 당 비용은 3-5배 감소합니다. 파이프라인은 높은 캐시 잇률을 달성하기 위해 안정적인 프리픽스를 위해 설계되어야합니다.

## 건축

```
documents (contracts, protocols, policies)
      |
      v
docling / Unstructured parse + ColPali for visuals
      |
      v
chunks + summaries + role-labels + jurisdiction tags
      |
      v
pgvector + pgvectorscale  +  BM25 (Tantivy)
      |
query + role + jurisdiction
      |
      v
LangGraph conversational agent
   +--- retrieve (hybrid)
   +--- filter by role + jurisdiction
   +--- rerank (bge-reranker-v2-gemma-2b or Voyage rerank-2)
   +--- synthesize (Claude Sonnet 4.7, prompt cached)
   +--- guard (Llama Guard 4 + NeMo Guardrails + Presidio output PII scrub)
   +--- cite + return
      |
      v
eval:
  RAGAS faithfulness / answer_relevance / context_precision (online)
  Langfuse annotation queue (sampled)
  Arize Phoenix drift (weekly)
  red team suite (pre-release)
```

## 

- 섭취: Unstructured.io 또는 구조화된 문서에 대한 docling; 시각적으로 풍부한 PDF에 대한 ColPali
- 벡터 DB: pgvector + pgvectorscale 50M 벡터 이하; Qdrant Cloud 그렇지 않으면
- 스파스: 텐티비 BM25
- 오케스트레이션: LlamaIndex 작업 흐름 (이용) + 랭그그래프 (회담)
- 재등급: bge-reranker-v2-gemma-2b 자율 주최 또는 Voyage 재등급-2 주관
- LLM: 클로드 소넷 4.7 신속한 캐시; 후퇴 Llama 3.3 70B 자율 주최
- 에발: RAGAS 0.2 온라인, 딥 에발 환각 및 제일브레이크 스위트
- 관찰 가능: 랭푸즈 자체 호스팅 및 해설열; Arize Phoenix 유도용
- 가드레일: 라마 가드 4 입력/출력 분류기, 네모 가드레일 v0.12 정책, 프레시디오 PII 스크럽
- 준수: 덩어리들에 대한 역할 기반 접근 레이블; GDPR/HIPAA의 관할권 표지

```figure
canary-rollout
```

## 건설 해

1. **Ingestion.**구조화되지 않은 문서 또는 문서화 (중심한 문서) 를 사용하여 코퍼스 (1000~10000 문서) 를 분석하십시오. 스캔 / 시각적 무거운 페이지에 대해서는 ColPali를 통해 로우트하십시오. 요약, 역할 레이블, 관할 태그를 가진 조각을 생성하십시오.

2. **Index.**벡터 + pgvector 스케일 (Voyage-3 또는 Nomic-embed-v2) 에 밀집한 임베디션.

3. **Hybrid retrieve.**역할+지법분야를 먼저 필터링하고, 병렬 밀도가 + BM25로 합쳐서, 상호 순위 합병으로 합쳐지고, 20위에서 재등급자, 5위에서 합성한다.

4. **Synthesize with prompt caching.**캐시 헤더에서 시스템 프롬프트 + 정적 정책; 캐시 확장으로 컨텍스트를 다시 순위화; 캐시되지 않은 후자로서 사용자 질문. 고정 상태에서 60-80%의 캐시 타격률을 목표로합니다.

5. **Guardrails.**Llama Guard 4 입력에; NeMo Guardrails 레일은 도메인 밖의 질문이나 정책 금지된 주제를 차단합니다. Presidio는 출력에서 우연한 PII를 스크러브합니다. 인용 집행 후 필터.

6. **Golden set.**200 질문/ 답변 쌍 (사답, 인용) 로 영역 전문가에 의해 표시된. 정확한 인용 일치, 답 정확성, 충실성 (RAGAS) 에 대한 점수 대리자.

7. **Red team.**50개의 적대적 인 요청: jailbreaks (PAIR, TAP), PII 발굴 시도, 범주 밖, 관할 간 누출.

8. **Drift dashboard.**아리즈 피닉스는 수 주간 검색 품질을 추적합니다. 5% 감소에 대한 경고.

9. **Cost report.**랭푸스: 프롬프트 캐싱 히트률, 조회당 토큰, $/조회 단계별 분단.

## 사용 하 고

```
$ chat --role=analyst --jurisdiction=GDPR
> what is the data-retention obligation for EU user profiles under our contract?
[retrieve]  hybrid top-20 filtered to GDPR + analyst-role
[rerank]    top-5 kept
[synth]     claude-sonnet-4.7, cache hit 74%, 0.8s
answer:
  The contract (Section 12.4, Master Services Agreement dated 2024-03-11)
  obligates EU user profile deletion within 30 days of termination per GDPR
  Article 17. The DPA amendment (DPA-v2.1, Section 5) extends this to 14 days
  for "restricted" category data.
  citations: [MSA-2024-03-11 s12.4, DPA-v2.1 s5]
```

## 선박

`outputs/skill-production-rag.md`제공되는 것을 설명합니다. 규제된 도메인 채팅봇은 컴플라이언스 레이블을 배치하고, 라벨을 통과하고, 실시간 유동 모니터링으로 관찰됩니다.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | RAGAS faithfulness + answer relevance | Online scores on the golden set (200 Q/A) |
| 20 | Citation correctness | Fraction of answers with verifiable source anchors |
| 20 | Guardrail coverage | Llama Guard 4 pass rate + jailbreak suite results |
| 20 | Cost / latency engineering | Prompt-cache hit rate, p95 latency, $/query |
| 15 | Drift monitoring dashboard | Phoenix live dashboard with weekly retrieval-quality trend |
| **100** | | |

## 운동

1. 다른 관할권 (예: GDPR와 HIPAA) 에 따라 두 번째 코퍼스 슬라이스를 구축하십시오. 20 질문의 관할권 간 조사에서 교차 누출을 방지하는 역할+법령 필터링을 입증하십시오.

2. 생산 트래픽의 한 주 동안 프롬프트 캐시 샷률을 측정하고, 캐시 프리픽스를 깨는 쿼리를 식별하고, 구조를 변경합니다.

3. 10k 토큰의 서약 버퍼를 사용하여 멀티 턴 메모리를 추가합니다. 대화가 증가함에 따라 충성도가 떨어지는지를 측정합니다.

4. 클로드 소넷 4.7을 라마 3.3 70B로 교환해

5. "불확정" 모드를 추가 합니다. 만약 가장 높은 재평가 점수가 열계 이하인 경우, 에이전트는 대답 대신 "신뢰적 인 인용 사항은 없다"고 말합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Prompt caching | "Cached system + context" | Claude/OpenAI feature: cached prefix tokens discounted 60-90% on hit |
| RAGAS | "RAG evaluator" | Automated scoring of faithfulness, answer relevance, context precision |
| Golden set | "Labeled eval" | 200+ expert-labeled Q/A with citations; the ground truth |
| Jurisdiction tag | "Compliance label" | GDPR/HIPAA/SOC2 scope attached to chunks; enforced by retrieval filter |
| Citation faithfulness | "Grounded answer rate" | Fraction of claims backed by retrievable source spans |
| Drift | "Retrieval quality decay" | Weekly change in nDCG or citation score; alert threshold 5% |
| Red team | "Adversarial eval" | Pre-release jailbreak, PII extraction, off-domain probes |

## 더 많은 읽기

- [Harvey AI](https://www.harvey.ai) 참조 법적 생산 스택
- [Glean enterprise search](https://www.glean.com) 기업 규모의 참조 RAG
- [Mendable documentation](https://mendable.ai) 개발자 문서 RAG 참조
- [LlamaCloud Parse + Index](https://docs.cloud.llamaindex.ai/llamaparse/getting_started) 관리된 섭취
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) 비용 유도 기준
- [RAGAS 0.2 documentation](https://docs.ragas.io/) 가톨릭 RAG 평가 프레임워크
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) 참조 유동 관측 가능
- [Llama Guard 4](https://www.llama.com/docs/model-cards-and-prompt-formats/llama-guard-4/) 2026 안전 분류
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) 정책 철도
