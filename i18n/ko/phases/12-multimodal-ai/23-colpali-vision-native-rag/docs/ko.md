# 콜파리 및 비전 네이티브 문서 RAG

> 전통적인 RAG는 PDF를 텍스트로 분석하고, 조각으로 나눕니다. 모든 단계에서는 신호를 잃습니다. OCR는 차트 데이터를 떨어뜨리고, 쪼개는 테이블 줄을 깨고, 텍스트 임베디드는 숫자를 무시합니다. 콜파리 (Faysse et al., 2024년 7월) 는 더 간단한 질문을 던졌습니다. 페이지를 PaliGemma를 통해 직접 삽입하고, 검색을 위해 ColBERT 스타일의 늦은 상호 작용을 사용하여 문서가 가지고 있는 모든 레이아웃, 인수, 글꼴 및 형식 신호를 유지하십시오. 출판된 기준: 시각적으로 풍부한 문서에 있는 텍스트-RAG보다 20-40% 더 나은 엔드-투-엔드 정확성. ColQwen2, ColSmol, VisRAG은 패턴을 확장했습니다. 이 수업은 시각이 내재된 RAG 논문을 읽고 작은 ColPali 같은 지표를 만듭니다.

**Type:** Build
**Languages:** Python (stdlib, multi-vector indexer + MaxSim scorer)
**Prerequisites:** Phase 11 (LLM Engineering — RAG basics), Phase 12 · 05 (LLaVA)
**Time:** ~180 minutes

## 학습 목표

- 이중 앵코더 검색 (문서당 한 벡터) 과 늦은 상호작용 검색 (문서당 많은 벡터) 사이의 차이를 설명하십시오.
- 콜베르트의 맥시프 동작과 콜파리가 텍스트 토큰에서 이미지 패치까지 일반화하는 방법을 설명하십시오.
- ColPali와 같은 작은 지표를 구축하십시오: 페이지 → 패치 임베디션 → 쿼리 용어 임베디션 → 톱-k 페이지에 대한 MaxSim.
- 청구서/금융보고서 사용 사례에 ColPali + Qwen2.5VL 발전기와 텍스트-RAG + GPT-4를 비교하십시오.

## 문제

PDF에 있는 텍스트-RAG는 대부분의 문서를 버립니다. 금융 보고서의 3분기 매출 성장은 일반적으로 차트에 있습니다. 의료 보고서의 결과는 해석된 이미지에 있습니다. 법적 계약의 서명 블록은 텍스트 사실이 아닙니다.

텍스트-RAG 파이프라인:

1. OCR / pdftotext을 통해 PDF → 텍스트
2. 텍스트 → 300-500개의 토큰 조각.
3.  → 바이코더 임베디션 (하나의 벡터)
4. 사용자 질서 → 임베딩 → 코시네 유사성 → 톱-k 덩어리
5. 크스 + 쿼리 → LLM

5개의 손실 단계, 차트들이 캡처되지 않았어, 테이블들이 조각으로 나뉘어 있고, 여러 열의 레이아웃이 평평해지고, 그림 해석은 사라집니다.

ColPali의 수정: OCR를 건너뛰고 페이지 이미지를 직접 삽입합니다. 검색을 위해 ColBERT 스타일의 늦은 상호 작용을 사용하여 모델은 질의 시간에 미세한 곡물 패치를 처리 할 수 있습니다.

## 개념

### 콜베르트 (2020)

콜베르트 (Khattab & Zaharia, arXiv:2004.12832) 는 텍스트 검색 방법이다. 문서당 한 벡터 대신 토큰당 한 벡터를 생성한다.

- 쿼리 토큰은 자체 임베디션을 얻습니다 ($N_q$(중개체)
- 문서 토큰은 임베디드 ($N_d$일반적으로 캐시된 벡터)
- 점수 = 코시노 유사성 문서 토큰에 대한 최대 질의 토큰의 합: $\sum_i \max_j \cos(q_i, d_j)$- 그래

이것은 MaxSim 작업입니다. 각각의 쿼리 토큰은 가장 적합한 문서 토큰을 "선택합니다". 최종 점수는 합입니다.

장점: 강한 기억력, 용어 수준의 의미학을 처리합니다. 단점:$N_d$문서당 벡터, 저장 비용이 많이 든다.

### 콜파리

콜파리 (Faysse et al., arXiv:2407.01449) 는 ColBERT 패턴을 이미지에 적용합니다.

- 각 페이지는 PaliGemma (ViT + 언어) 로 패치 임베디션으로 암호화됩니다. $N_p$페이지당 벡터
- 각 사용자 쿼리 ( 텍스트) 는 쿼리 토큰 임베디션으로 암호화됩니다: $N_q$벡터
- 점수 = $\sum_i \max_j \cos(q_i, p_j)$즉, 질의 텍스트 토큰과 페이지 이미지 패치에 대한 MaxSim.
- 전체 점수를 기준으로 1K 페이지를 검색해 보세요.

문서 입력 시: 모든 페이지를 PaliGemma로 임베디드하여 모든 패치 임베디드를 저장합니다. 질의 시: 질의 토큰을 임베디드하여 MaxSim를 저장된 페이지 임베디션에 대한 계산, 상위 k 페이지를 반환합니다.

장점: 시각적으로 풍부한 문서에서 엑스-RAG는 20-40% 이상으로 겹쳐집니다. 각 패치 벡터는 로컬 레이아웃과 콘텐츠를 캡처합니다.

단점:$N_p$패치 × 4바이트의 플롯 × $D$- 페이지 દીઠ 벡터  = 저장량은 빠르게 증가합니다. PQ/OPQ 양량화로 완화됩니다.

### 콜큐벤2 및 콜스모

ColQwen2 (일루인 기술, 2024-2025) 는 PaliGemma를 Qwen2-VL로 교환한다. 더 나은 기본 코더, 더 나은 검색.

ColSmol은 로컬/엣지 사용용으로 사용되는 작은 규모의 변종이다. ~ 1B 파라미드의 ColSmol 리트리버는 소비자 GPU에서 실행됩니다.

### 비스라그

VisRAG (Yu et al., arXiv:2410.10594) 은 다른 변형입니다. 패치에 있는 MaxSim 대신, 각 페이지를 VLM로 단일 벡터로 묶어 두 개의 벡터를 검색합니다. 더 빠른  индекса링 + 더 작은 저장, 더 약한 회수.

품질과 비용의 대립: 품질에 대한 콜파리, 규모에 대한 비스라그.

### M3DocRAG

M3DocRAG (Cho et al., arXiv:2411.04952) 는 다면 다면 다면 다면 문서 추론으로 멀티모달 검색을 확장합니다. 문서의 여러 페이지에서 페이지를 검색하고 VLM에 대한 다면 컨텍스트를 구성합니다.

### 비도레  기준

콜파리의 동반 기준: 시각 문서 검색 평가. 업무에는 금융 보고서, 과학 논문, 행정 문서, 의료 기록, 설명서 등이 있습니다. 측정: nDCG@5.

ColPali-v1는 ViDoRe에서 ~ 80% nDCG@5을 점수하고, 동일한 문서에서 텍스트-RAG는 ~ 50-60%를 점수한다.

### 종말부터 종말까지의 RAG 파이프라인

시각이 있는 RAG:

1. 입력: PDF → 페이지 이미지 → PaliGemma 코딩 → 모든 패치 임베디션을 저장합니다.
2. 쿼리: 사용자 텍스트 → 쿼리 토큰 임베디션 → 모든 지표 페이지에 대한 MaxSim → 톱-k 페이지.
3. 생성: 상위 k 페이지 이미지 + 질의 → VLM (Qwen2.5-VL 또는 클로드) → 답변.

OCR가 없습니다. 그림, 차트, 글꼴, 레이아웃은 모두 답으로 흘러갑니다.

### 저장 수학

50 페이지의 재무 보고서는 페이지당 729개의 패치와 128개 덩어리 임베디션으로

- ColPali: 50 * 729 * 128 * 4 바이트 = ~18 MB 원료, ~4 MB PQ 이후.
- 텍스트-RAG: 50 조각 * 768-dim * 4 바이트 = ~ 150 kB.

ColPali는 문서당 ~ 30x 더 많은 저장량을 가지고 있습니다. 규모에서 OPQ / PQ는 일반적으로 용납 가능한 ~ 5-10x로 줄입니다.

### 문자-RAG가 여전히 승리할 때

- 레이아웃 신호가 없는 순수한 텍스트 문서 (위키 기사, 채팅 로그). 텍스트-RAG는 더 간단하고 저장 비용이 저렴합니다.
- 수백만 페이지의 기록물들이 저장비가 주를 이루고 있습니다.
- 엄격한 규제 요구 사항은 검색과 함께 추출 가능한 OCR 텍스트를 요구합니다.

2026년 모든 다른 것에 대해  금융 보고서, 과학 논문, 법률 계약, 의료 기록, UX 문서  비전 네이티브 RAG는 승리합니다.

```figure
mm-maxsim
```

## 사용 하 고

`code/main.py`이 부분의 본문은

- 장난감 패치 코더: 패치 임베디션의 배열에 "페이지" (특성 벡터의 작은 그리드) 를 지도합니다.
- 맥시엠 점수자: 질의 토큰 임베디션 세트와 페이지 패치 세트 사이에 콜베르트 스타일 점수를 계산합니다.
- 5개의 장난감 페이지를 지표하고 3개의 질문을 실행하고, 점수를 가진 상위 K를 반환합니다.

## 선박

이 교훈은`outputs/skill-vision-rag-designer.md`. 문서-RAG 프로젝트를 고려하면 ColPali / ColQwen2 / VisRAG / 텍스트-RAG를 선택하고 저장량을 크게 합니다.

## 운동

1. 200 페이지의 연간 보고서는 페이지당 729개의 패치, 128차원 임브, 4바이트의 플롯. 원료 저장소와 PQ 압축된 저장소를 계산한다.

2. 맥시미는$\sum_i \max_j \cos(q_i, p_j)$이 합은 어떤 것을 포착하고 있지요?

3. ColPali는 페이지를 패치 세트로 지표합니다. 우리가 대신 단어 수준에서 지표를 하면 어떤 변화가 있을까요?

4. 1M 페이지의 코퍼스를 위한 엔드-투-엔드 파이프라인을 설계하여 질의당 500ms의 지연 예산으로 선택하고 ColQwen2 / VisRAG를 선택하여 정당화하십시오.

5. M3DocRAG (arXiv:2411.04952) 를 읽어 보십시오. 여러 페이지의 관심 패턴과 단일 페이지의 ColPali 검색과 어떻게 차이가 있는지 설명하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Late interaction | "ColBERT-style" | Retrieval using per-token or per-patch embeddings + MaxSim, not a single doc vector |
| MaxSim | "Max-over-patches" | For each query token, pick the highest-similarity document token; sum across query |
| Bi-encoder | "Single-vector" | One vector per document; faster but loses granularity |
| Multi-vector | "Many-vectors-per-doc" | Store $N_p$ vectors per document / page; storage cost grows but recall improves |
| Patch embedding | "Page feature" | One vector per image patch from a VLM encoder, cached per page |
| ViDoRe | "Vision doc bench" | ColPali's benchmark suite for visual document retrieval |
| PQ quantization | "Product quantization" | Compression that maintains vector similarity while shrinking storage ~8x |

## 더 많은 읽기

- [Faysse et al. — ColPali (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449)
- [Khattab & Zaharia — ColBERT (arXiv:2004.12832)](https://arxiv.org/abs/2004.12832)
- [Yu et al. — VisRAG (arXiv:2410.10594)](https://arxiv.org/abs/2410.10594)
- [Cho et al. — M3DocRAG (arXiv:2411.04952)](https://arxiv.org/abs/2411.04952)
- [illuin-tech/colpali GitHub](https://github.com/illuin-tech/colpali)
