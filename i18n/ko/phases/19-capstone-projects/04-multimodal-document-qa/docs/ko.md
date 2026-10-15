# 캡스톤 04  다중모델 문서 QA (Vision-First PDF, 테이블, 차트)

> 2026년 문서-QA 경계는 OCR-then-text에서 벗어나 시각-first 늦은 상호작용으로 이동했습니다. ColPali, ColQwen2.5 및 ColQwen3-omni은 각 PDF 페이지를 이미지로 취급하고, 멀티 벡터 늦은 상호 작용으로 임베디드하고, 문의가 직접 패치에 참여하도록 합니다. 금융 10K, 과학 논문, 그리고 손으로 쓴 노트에서 이 패턴은 OCR를 먼저 큰 차이로 이겨냅니다. 10만 페이지에 파이프라인 끝을 끝으로 만들고 OCR-then-text에 맞게 옆으로 출판합니다.

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (viewer UI)
**Prerequisites:** Phase 4 (computer vision), Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P5 · P7 · P11 · P12 · P17
**Time:** 30 hours

## 문제

기업들은 OCR 파이프라인을 망칠 PDF에 앉아 있습니다. 회전 테이블로 스캔된 10K, 방정식들로 밀집된 과학 논문, 이미지로서만 의미가 있는 차트, 손으로 쓴 해설 이 신호를 먼저 문자하는 것으로 간주하면 신호의 절반을 잃게 됩니다. 2026년 답은 순위 페이지 이미지에서 늦은 상호작용 멀티 벡터 검색입니다. 콜파리 (일루인 테크) 가 도입했으며, 콜쿼인2.5-v0.2와 콜쿼인3-omni은 정확성을 높였다. ViDoRe v3에서는 시각-첫 검색은 의미있는 소재로 OCR-이후 텍스트보다 높은 점수를 얻으며 차트, 테이블 및 필기에서 격차가 넓어집니다.

콤프로는 저장 및 지연입니다. ColQwen 임베디드는 페이지 દીઠ ~2048 패치 벡터, 단 1 개 1024 덩치 벡터가 아닙니다. 원료 저장 풍선은. DocPruner (2026) 는 측정 가능한 정확성 손실 없이 50% 절단 기능을 제공합니다. 10k 페이지를 인덱스하고, ViDoRe v3 nDCG@5을 측정하고, 2 초 이하의 답변을 제공하며, OCR-이후 텍스트 기본 라인에 직접 비교합니다.

## 개념

늦은 상호 작용은 모든 쿼리 토큰이 모든 패치 토큰에 대해 점수를 얻는 것을 의미합니다. 쿼리 토큰에 대한 최대 점수는 합당됩니다. 단일 벡터 합병이 필요하지 않고도 미세한 곡물 조화를 얻습니다. 멀티 벡터 지표 (Vespa, Qdrant 멀티 벡터 또는 AstraDB) 는 패치에 대한 임베딩을 저장하고 검색 시 MaxSim를 실행합니다.

응답기는 화면과 상위 k 검색된 페이지를 이미지로 받아들이고 증거 영역 (부문 상자 또는 페이지 참조) 을 사용하여 답변을 작성하는 시각 언어 모델입니다. Qwen3-VL-30B, Gemini 2.5 Pro, InternVL3는 2026 년 국경 선택입니다. 방정식 및 과학적 표기기 위해 OCR fallback (Nougat, dots.ocr) 은 선택적 텍스트 채널로 접목됩니다.

평가 는 2 차원 매트릭스 이다. 한 축: 내용 유형 (평편 텍스트 문장, 밀집 테이블, 바/라인 차트, 손으로 작성 된 메모, 방정식). 다른 축: 검색 접근 방식 (비전-첫 늦은 상호 작용 vs OCR-이후 텍스트 vs 하이브리드). 각 세포는 nDCG@5 및 답변 정확성을 얻습니다. 보고서는 전달됩니다.

## 건축

```
PDFs -> page renderer (PyMuPDF, 180 DPI)
           |
           v
  ColQwen2.5-v0.2 embed (multi-vector per page, ~2048 patches)
           |
           +------> DocPruner 50% compression
           |
           v
   multi-vector index (Vespa or Qdrant multi-vector)
           |
query ----+----> retrieve top-k pages (MaxSim)
           |
           v
  VLM answerer: Qwen3-VL-30B | Gemini 2.5 Pro | InternVL3
    inputs: query + top-k page images + optional OCR text
           |
           v
  answer with cited page numbers + evidence regions
           |
           v
  Streamlit / Next.js viewer: highlighted boxes on source page
```

## 

- 페이지 렌더링: PyMuPDF (fitz) 180 DPI, 초상화 정상화
- 늦은 상호 작용 모델: ColQwen2.5-v0.2 또는 ColQwen3-omni (Hugging Face의 비도어 팀)
- 지표: 다중벡터 필드 (Vespa) 또는 Qdrant 다중벡터 (Qdrant multi-vector) 또는 MaxSim (MaxSim) 를 가진 AstraDB
- 절단: DocPruner 2026 정책 (고차차량 패치를 유지, 50% 압축이 < 0.5% 정확성 손실)
- OCR fallback (평정/밀도 테이블): dots.ocr 또는 Nougat
- VLM 응답기: Qwen3-VL-30B 자전 호스팅 또는 Gemini 2.5 Pro 호스팅; InternVL3 역전용
- 평가: ViDoRe v3 기준, M3DocVQA
- 시청자 UI: Next.js 15 증거 영역에 대한 캔버스 덮개

```figure
ce-late-interaction
```

## 건설 해

1. **Ingest.**10K의 PDF 페이지, 과학 논문 및 스캔 된 문서들을 10K에 걸쳐서 보냅니다. 각 페이지를 1536x2048 PNG로 반환합니다. 계속 `{doc_id, page_num, image_path}`- 그래

2. **Embed.**각 페이지 이미지에서 ColQwen2.5-v0.2를 실행하세요. 출력 모양 ~2048 패치 임베디션이 dim 128입니다. 가장 높은 신호 반을 유지하기 위해 DocPruner를 적용하세요. Vespa 멀티 벡터 필드 또는 Qdrant 멀티 벡터로 작성하세요.

3. **Query.**각 입력된 질의에 대해 질의 탑 (토큰 레벨 임베디션) 에 임베디드하십시오. 매스시민을 지표에 맞게 실행하세요. 각 질의 토큰에 대해, 페이지 패치 임베디션에 대한 최대 점-프로덕트를 합시다. 상위 k 페이지를 반환하십시오.

4. **Synthesize.**질문과 상위 5 페이지 이미지들을 함께 Qwen3-VL-30B에 호출하십시오. 프롬프트: "만 제공 된 페이지를 사용하여 답변하십시오. 각 주장을 (doc_id, 페이지) 로 인용하고 영역 (그림, 테이블, 문장) 을 이름 붙여 주십시오".

5. **Evidence regions.**인용된 영역을 추출하기 위한 답변을 후처리합니다. VLM가 경계 상자를 방출하면 (Qwen3-VL가합니다), 시청자에서 상복으로 표시하십시오.

6. **OCR fallback.**방정식 밀도가 높은 페이지 (사진 변수에 대한 유리스틱) 를 위해 Nougat 또는 dots.ocr를 실행하고 OCR 텍스트를 이미지 옆에 추가 채널로 전달하십시오.

7. **Eval.**ViDoRe v3 (복수 nDCG@5) 및 M3DocVQA (다 페이지 QA 정확성) 를 실행하십시오. 또한 동일한 합성기를 사용하여 동일한 코퍼스에서 OCR-then-text 파이프라인을 실행하십시오. 콘텐츠 타입 × 접근 매트릭스를 생성하십시오.

8. **UI.**스트림 라이트 프로토타입 먼저; 페이지-페이지 증거-지역 초록을 가진 Next.js 15 생산 시청자.

## 사용 하 고

```
$ doc-qa ask "what was the 2024 operating margin change for segment EMEA?"
[retrieve]   top-5 pages in 320ms (ColQwen2.5, MaxSim, Vespa)
[synth]      qwen3-vl-30b, 1.4s, cited (form-10k-2024, p. 88) + (..., p. 92)
answer:
  EMEA operating margin moved from 18.2% to 16.8%, a 140bp decline.
  cited: 10-K-2024.pdf p.88 (Table 4, Segment Operating Margin)
         10-K-2024.pdf p.92 (MD&A, Operating Performance)
[viewer]     open with highlighted bounding boxes overlaid on p.88 Table 4
```

## 선박

`outputs/skill-doc-qa.md`전달되는 것을 설명합니다: 특정 코퍼스에 조정된 시각-처음 멀티모달 문서 QA 시스템 및 ViDoRe v3에 대한 OCR-then-text 기본 기준에 의해 평가됩니다.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | ViDoRe v3 / M3DocVQA accuracy | Benchmark numbers vs OCR-text baseline and published leaderboard |
| 20 | Evidence-region grounding | Fraction of cited regions that actually contain the answer span |
| 20 | Storage and latency engineering | DocPruner compression ratio, index p95, answer p95 |
| 20 | Multi-page reasoning | Accuracy on a hand-labeled 100-question multi-page set |
| 15 | Source-inspection UX | Viewer clarity, overlay fidelity, side-by-side comparison tools |
| **100** | | |

## 운동

1. 같은 코퍼스에서 ColQwen2.5-v0.2와 ColQwen3-omni을 측정하세요. 어느 페이지가 옳고 다른 페이지가 틀렸습니까?

2. 포착을 공격적으로 (75%, 90%) 깎아내기. 압축 절벽을 찾아: ViDoRe nDCG@5가 OCR 기본값 아래로 떨어지는 지점.

3. 하이브리드를 만들면 OCR-then-text과 ColQwen를 병렬로 실행하고 RRF와 융합하고 크로스코더로 순위를 바꾸죠. 하이브리드는 혼자 두 가지를 모두 이길 수 있을까요?

4. Qwen3.VL-30B를 작은 VLM (Qwen2.5-VL-7B) 로 교환하여 정확성-당 달러 곡선을 측정합니다.

5. 손글씨 메모를 지원하고, 손글씨의 몸집을 렌더링하고, ColQwen에 삽입하여, 측정 검색을 수행하고, 손글씨 OCR 파이프라인과 비교합니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Late interaction | "ColPali-style retrieval" | Query tokens score against page patches independently; MaxSim aggregates |
| Multi-vector | "Per-patch embedding" | Each document has many vectors, not one pooled vector |
| MaxSim | "Late-interaction scoring" | For every query token, take max similarity over document vectors; sum |
| DocPruner | "Patch compression" | 2026 pruning that keeps 50% of patches with negligible accuracy loss |
| ViDoRe v3 | "Document-retrieval benchmark" | The 2026 standard for measuring visual-document retrieval |
| Evidence region | "Cited bounding box" | A bbox on the source page that localizes the answer span |
| OCR fallback | "Equation channel" | Text pipeline used alongside vision for equation- or table-heavy pages |

## 더 많은 읽기

- [ColPali (Illuin Tech) repository](https://github.com/illuin-tech/colpali) 참고 후반 상호작용 문서 검색
- [ColPali paper (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449) 기초 방법 논문
- [ColQwen family on Hugging Face](https://huggingface.co/vidore)생산 준비된 체크포인트
- [M3DocRAG (Adobe)](https://arxiv.org/abs/2411.04952) 다면 다형 RAG 기본 라인
- [Vespa multi-vector tutorial](https://docs.vespa.ai/en/colpali.html) 참조 서비스 스택
- [Qdrant multi-vector support](https://qdrant.tech/documentation/concepts/vectors/#multivectors) 대안 지표
- [AstraDB multi-vector](https://docs.datastax.com/en/astra-db-serverless/databases/vector-search.html) 대체 관리된 지수
- [Nougat OCR](https://github.com/facebookresearch/nougat) 방정식 가능한 OCR 역전
