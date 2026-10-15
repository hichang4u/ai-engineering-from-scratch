# CAPSTONE 02  RAG  코드베이스 (Cross-Repo Semantic Search)

> 2026년 모든 심각한 엔지니어링 기관은 단지 문자열이 아닌 의미를 이해하는 내부 코드 검색을 합니다. 소스 그래프 Amp, 커서의 코드베이스 답변, 오그먼트의 엔터프라이즈 그래프, 아이더의 리포머, Pinterest의 내부 MCP  같은 모양. 많은 리포를 섭취하고, 트리 시터와 분석하고, 함수와 클래스 수준의 덩어리를 임베드하고, 하이브리드 검색, 재 순위를 매기고, 인용문으로 답변합니다. 이 톱스톤은 10개의 리포를 통해 2M 라인 코드를 처리하고 git push마다 점진적인 재인덱싱을 생존하는 것을 요청합니다.

**Type:** Capstone
**Languages:** Python (ingestion), TypeScript (API + UI)
**Prerequisites:** Phase 5 (NLP foundations), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure)
**Phases exercised:**P5 · P7 · P11 · P13 · P17
**Time:** 30 hours

## 문제

2026년까지 모든 국경 코딩 에이전트는 코드베이스 검색 레이어를 가지고 있습니다. 왜냐하면 컨텍스트 윈도우만으로는 크로스-레포 질문을 해결하지 않기 때문입니다. 클로드의 1M 토큰 맥락은 도움이 되지만 순위 검색의 필요성을 제거하지는 않습니다. 독자적인 원자물 조각에 대한 순진한 코시네 검색은 생성된 코드, monorepo 복제, 그리고 거의 수입되지 않는 상징의 긴 꼬리에 결과를 낳습니다. 생산 답은 AST 인식된 조각을 위한 하이브리드 (밀고 + BM25) 검색으로, 상징 참조의 그래프로 뒷받침되는 재등급자입니다.

이것은 실제 파트  한 개의 튜토리얼 레포 를 지표하여 MRR@10, 인용 신뢰성 및 증가 신선도를 측정함으로써 학습됩니다. 실패 모드는 인프라적입니다. 100k 파일 모노레포, 파일의 절반을 리터우하는 푸시, 올바른 답변을 위해 네 개의 레포를 넘어야하는 쿼리.

## 개념

AST에 대한 인식이 있는 흡수 파이프라인은 트리 시터와 함께 각 파일을 분석하고, 함수와 클래스 노드를 추출하고, 고정된 토큰 창보다는 노드 경계에서 덩어리를 분석합니다. 각 조각은 세 가지 표현을 얻습니다. 밀집한 임베딩 (Voyage-code-3 또는 명목-임베드-코드), 희귀한 BM25 용어, 그리고 짧은 자연어 요약. 요약은 세 번째 검색 가능한 모달을 추가합니다.  사용자는 "X는 어떻게 허가되는지"를 묻고 요약에는 "authz"가 언급되어 있습니다.`check_permission`- 그래

복원하는 것은 하이브리드입니다. 질의는 밀집 및 BM25 검색을 모두 발사하고, 톱-k를 통합하고, 조합을 크로스 앵코더 재랭킹 (Cohere rerank-3 또는 bge-reranker-v2-gemma-2b) 에 넘겨줍니다. 재등급 목록은 파일 및 라인 범위에 따라 모든 주장을 인용하는 지침을 가진 긴 맥락 합성기를 (클로드 소넷 4.7 즉 프롬프트 캐시링, 또는 Llama 3.3 70B 자체 호스팅) 에 간다. 인용 없이 답변은 포스트 필터로 거부됩니다.

인크레멘탈 신선도는 인프라 문제입니다. Git 푸시는 변경된 파일, 변경된 상징의 차이를 유발합니다. 영향을 받은 조각만 다시 삽입합니다. 영향을 받은 크로스 파일 상징 가장자리 (입입입, 방법 호출) 는 다시 계산됩니다. 2M 라인을 다시 처리하지 않고 지수는 일관합니다.

## 건축

```
git push --> webhook --> ingest worker (LlamaIndex Workflow)
                           |
                           v
             tree-sitter parse + AST chunk
                           |
            +--------------+----------------+
            v              v                v
          dense        BM25 index       summary (LLM)
        (Voyage / bge)  (Tantivy)        (Haiku 4.5)
            |              |                |
            +------> Qdrant / pgvector <----+
                            |
                            v
                      symbol graph (Neo4j / kuzu)
                            |
  query --> LangGraph agent (retrieve -> rerank -> synth)
                            |
                            v
                 Claude Sonnet 4.7 1M context
                            |
                            v
                 answer + file:line citations
```

## 

- 파싱: 17개의 언어 문법 (파이톤, TS, 러스트, 고, 자바, C++, 등) 을 가진 나무 관리자
- 밀집한 임베디션: Voyage-code-3 (호스팅) 또는 nomic-embed-code-v1.5 (self-host), bge-code-v1 fallback
- 스파스 인덱스: BM25F의 탄티비 (Rust) , 상징 이름과 몸매에 대한 필드 중량
- 벡터 DB: Qdrant 1.12 하이브리드 검색 또는 50M 벡터 이하의 팀에 pgvector + pgvector 스케일
- 조각 요약 모델: 클로드 하이쿠 4.5 또는 트메니 2.5 플래시, 신속한 캐시
- 재등급: 코헤어 재등급-3 또는 bge-reanker-v2-gemma-2b 자체 주최
- 오케스트레이션: LlamaIndex 취하는 작업 흐름, 랭그라프의 질의 요인
- 합성기: 클로드 소넷 4.7 (1M 컨텍스트)
- 기호 그래프: 수입 및 호출 가장자리 Neo4j (관리) 또는 kuzu (베드)
- 관찰 가능: 검색 + 합성 단계에 따라 랭푸스 팽창

```figure
ce-hybrid-retrieval
```

## 건설 해

1. **Ingestion walker.**각 에 git 역사를 반복합니다. 변경된 파일을 수집합니다. 각 파일, 나무-sitter, 추출 함수 및 클래스 노드와 함께 전체 소스 랜드를 분석합니다. 쪼개서 기록을 발행합니다.`{repo, path, start_line, end_line, symbol, body}`- 그래

2. **Chunk summarizer.**패치 덩어리 하이쿠 4.5 호출에 시스템 프리럼버스에 즉시 캐시. 패치: "이 기능을 하나의 문장으로 요약하고 공개 계약과 부작용을 명명하십시오". 덩어리 옆에 요약을 저장하십시오.

3. **Embedding pool.**두 개의 병렬 줄을: 밀집 (여행 코드-3 배트 128) 및 요약 (모델이 동일하지만 요약 문자열에 있습니다).`{repo, path, start_line, end_line, symbol, kind}`- 그래

4. **BM25 index.**필드 중량 Tantivy 지수: 상징 이름 무게 4, 상징 몸무게 1, 요약 무게 2. "X라는 함수를 찾아라"라는 질의와 함께 "X를 하는 함수를 찾아라"를 가능하게 합니다.

5. **Symbol graph.**각 조각에 대한 기록 가장자리: 수입 (이 파일은 repo Z에서 Y 기호를 사용합니다), 호출 (이 함수는 C 클래스에서 M 방법을 호출합니다), 상속. kuzu에서 저장합니다.

6. **Query agent.**3개의 노드로 랭그그래프`retrieve`                      `rerank`크로스코더를 상위 50에 실행하고 상위 10을 유지합니다.`synth`클로드 소넷 4.7을 리랭크된 덩어리들로 연결하고 시스템 프롬프트를 캐시하고 파일: 라인 인용이 필요합니다.

7. **Citation enforcement.**모델 출력을 분석하고,`(repo/path:start-end)`아커는 다시 요청하거나 떨어뜨리는 것을 표시합니다. 사용자에게 인용된 답변을 반환합니다.

8. **Incremental re-index.**각 웹 에서, 상징 수준 차이를 계산하십시오. 텍스트가 변경된 단락만을 다시 삽입하십시오. 수입이 변경된 단락에 대한 상징 가장자리를 다시 계산하십시오. 측정: 2M-LOC 함대에서 60 초 이내에 50 파일이 다시 지표됩니다.

9. **Eval.**금 파일: 라인 답변을 가진 100개의 교차적 질문의 표기. MRR@10, nDCG@10, 인용 신뢰성 (확인 가능한 앵커를 가진 주장의 분량) 및 p50/p99 지연을 측정하십시오.

## 사용 하 고

```
$ code-rag ask "how is S3 multipart abort wired into our retry budget?"
[retrieve]  12 chunks dense + 7 chunks bm25, 16 unique after dedup
[rerank]    top-5 kept (cohere rerank-3)
[synth]     claude-sonnet-4.7, cache hit rate 68%, 2.1s
answer:
  Multipart aborts are triggered by `AbortMultipartOnFail` in
  services/uploader/retry.go:122-148, which decrements the per-bucket
  retry budget defined in config/budgets.yaml:34-51 ...
  citations: [services/uploader/retry.go:122-148, config/budgets.yaml:34-51,
              libs/s3client/multipart.ts:44-61]
```

## 선박

전달 가능한 기술`outputs/skill-codebase-rag.md`. 회고 자료의 한 장을 보면, 그것은 섭취 파이프라인, 하이브리드 지표, 질의 대리인을 나타내고, 모든 회고 질문에 인용된 답을 반환합니다.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Retrieval quality | MRR@10 and nDCG@10 on a 100-question held-out set |
| 20 | Citation faithfulness | Fraction of answer claims with verifiable file:line anchors |
| 20 | Latency and scale | p95 query latency at 10k QPS on the indexed corpus size |
| 20 | Incremental indexing correctness | Time from git push to searchable on a 50-file commit |
| 15 | UX and answer formatting | Citation clickability, snippet previews, follow-up affordance |
| **100** | | |

## 운동

1. 나미크 임베드 코드 자체 호스팅으로 Voyage-code-3를 교환합니다. MRR@10 델타를 측정합니다. 재등급이 활성화되면 격차가 닫혀 있는지 보고합니다.

2. 20% 생성된 코드를 (LLM 생산된 보일러 플레이트) 로 코퍼스에 주입하고 재평가. 검색 중독을 관찰. 유용 로드에 " 생성 된 " 깃발을 추가하고 그 타격을 적분합니다.

3. 벤치마킹 Qdrant 하이브리드 검색 vs pgvector + pgvectorskale

4. 샘플링 기반의 유동 검사를 추가: 매주 100 질문 평가를 반복합니다. MRR@10의 알림은 5% 이상 떨어집니다.

5. 언어 간 상징 해상도에 확장: gRPC를 통해 Go 서비스를 호출하는 파이썬 함수.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| AST-aware chunking | "Function-level splits" | Cutting code at tree-sitter node boundaries instead of fixed token windows |
| Hybrid search | "Dense + sparse" | Run BM25 and vector search in parallel, merge top-k, rerank |
| Cross-encoder rerank | "Second-stage rank" | Model that scores each (query, candidate) pair together, more accurate than cosine |
| Prompt caching | "Cached system prompt" | 2026 Claude / OpenAI feature that discounts repeat prefix tokens up to 90% |
| Symbol graph | "Code graph" | Edges for imports, calls, inheritance across files and repos |
| Citation faithfulness | "Grounded answer rate" | Fraction of claims a user can verify by clicking the anchor and reading the referenced span |
| Incremental re-index | "Push-to-search time" | Wall-clock from git push to the changed symbols being queryable |

## 더 많은 읽기

- [Sourcegraph Amp](https://ampcode.com) 생산 횡단 랩 코드 정보
- [Sourcegraph Cody RAG architecture](https://sourcegraph.com/blog/how-cody-understands-your-codebase) 이 돌의 참조 깊은 다이빙
- [Aider repo-map](https://aider.chat/docs/repomap.html) 나무 위장 순위 repo 보기
- [Augment Code enterprise graph](https://www.augmentcode.com) 상업적 상징-그래프 RAG
- [Qdrant hybrid search docs](https://qdrant.tech/documentation/concepts/hybrid-queries/) 참조 실행
- [Voyage AI code embeddings](https://docs.voyageai.com/docs/embeddings) 여행 코드-3 세부사항
- [Cohere rerank-3](https://docs.cohere.com/reference/rerank) 크로스 코더 참조
- [Pinterest MCP internal search](https://medium.com/pinterest-engineering) 내부 플랫폼 참조
