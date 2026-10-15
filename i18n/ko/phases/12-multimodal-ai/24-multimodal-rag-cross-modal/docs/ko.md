# 멀티모달 RAG 및 크로스모달 검색

> 시각이 원산지인 RAG 문서는 한 조각입니다. 생산 멀티모달 RAG는 여행 계획 ("자연광과 함께 조용한 채식 브런치를 찾으십시오"), 의료 triage ("이 사진과 이 메모에 어떤 부상이 일치하는지"), e-commerce ("이 셀프와 비슷한 옷, 내 크기에") 및 현장 서비스 ("이 엔진 소리와 부문의 사진을 진단하십시오"). 2025년 3개 조사  Abootorabi et al., Mei et al., Zhao et al.                                                                                                                                                                                                                                                                이 수업은 조사들을 읽고 생산 파이프라인을 설계합니다.

**Type:** Build
**Languages:** Python (stdlib, cross-modal retriever with fusion + grounded generator)
**Prerequisites:** Phase 12 · 23 (ColPali), Phase 11 (RAG basics)
**Time:** ~180 minutes

## 학습 목표

- 디자인 크로스 모달 검색: 텍스트 → 이미지, 이미지 → 텍스트, 오디오 → 비디오, 기타
- 세 가지 핵융합 전략을 비교해보세요: 점수 핵융합, 집중 기반 핵융합, MoE 핵융합.
- 세대 지형을 설명하세요: 원천이 모형이 될 때 "원천을 인용하라"는 어떤 모습일까요?
- 2025년 3개의 가공적인 다중 모형 RAG 조사와 그 부분 문제 분류를 명명하십시오.

## 문제

단일 모달리티 RAG는 해결된 패턴입니다. 임베드 쿼리, 임베드 덩어리, 검색, LLM에 사물. 다 모달 RAG는 다음과 같은 것을 요구합니다.

1. 여러 검색 헤드 (모든 모다리티는 호환 가능한 공간에 임베디드되어야 한다).
2. 모다다리들 간의 검색 결과의 합병
3. 모다다리들 간의 소스를 인용하는
4. 크로스 모달 신호를 다루는 평가 매트릭

2025년 조사들은 모두 같은 분류에 도달합니다.

## 개념

### 크로스 모달 검색

모달리 B의 문서를 모달리 A의 질의를 받아 검색한다. 세 가지 패턴:

1. 공유된 임베디션 공간. CLIP 및 CLAP는 공유된 공간에서 텍스트 + 이미지 / 텍스트 + 오디오 임베디션을 생성합니다. 모다리티 간 코시네 유사성은 직접 작동합니다. CLIP 훈련된 쌍에 제한됩니다.

2. 퍼 모다리티 앵코더 + 번역. 텍스트 앵코더 + 이미지 앵코더 + 공간 사이의 작은 번역기 모듈 지도. 겐2센 (Sen2Sen) 가 갱타 등과 다른 2024 디자인. 유연하지만 복잡성을 추가합니다.

3. VLM는 코더로 VLM의 숨겨진 상태를 검색 표현으로 사용한다. VLM가 지원하는 모든 방식이 작동합니다. 더 높은 품질, 더 비싸다.

선택: 텍스트+진상, 텍스트+음성 CLAP, 국경 품질의 크로스 모달을 위한 VLM-숨은 상태

### 합병 전략

5개의 이미지, 3개의 텍스트 패스, 2개의 오디오 클립을 검색했습니다. 어떻게 합쳐야 할까요?

점수 합성 (가장 저렴) 각 모달이 자신의 리트리버를 가지고 있으며 각 모달이 점수를 반환합니다. 모달이 내에서 점수를 정상화하고 합시다. 간단하고 종종 작동합니다.

집중력 융합, 모든 검색된 아이템을 연결해 작은 집중력 네트워크가 무게를 가도록 한다. 훈련이 필요하다.

MoE 융합. 모다리티 특수한 전문가로 네트워크 경로를 연결합니다. 다른 질의 유형은 다르게 경로를  시각적인 질의 질량은 이미지보다 높습니다.

프로덕션 기본: 조회 수색의 지배적인 모다리티에 대한 약간의 편향을 가진 점수 합성. A / B가 귀하의 도메인에 명확한 승부를 표시하면 MoE로 업그레이드하십시오.

### 세대 지형

LLM는 각 청구에 동기를 부여한 복수된 항목을 인용해야 합니다.

- 텍스트 출처: 표준 인용문 `[1]`- 그래
- 이미지 출처: `[img 3]`짧은 글씨로
- 음향: `[audio 2 at 0:34]`- 그래

교육 대상에서 주장하는 모든 주장은 소스 지표로 표시됩니다. 결론적으로 모델은 자연스럽게 인용을 발송합니다.

### 2025년 조사

아보토라비 등 (arXiv:2502.08826, "어떤 모달리티에서도 물어보세요"): 다형 RAG의 분류학. 추출, 융합, 생성을 포함한다. 가장 광범위한 포괄.

메이 등 (arXiv:2504.08748, "Multimodal RAG의 조사"): 하위 작업 기준 및 실패 모드에 초점을 맞추고 평가 설계에 유용합니다.

조 등 (arXiv:2503.18016): 비전 중심 조사. 콜파리 가족 일

세 가지 모두 읽으면 2025년 봄에 최신 기술을 얻을 수 있습니다. 대부분의 부문문제는 여전히 열려 있습니다.

### MuRAG  기초 논문

MuRAG (Chen et al., 2022) 는 최초의 멀티모달 RAG이다. 멀티모달 KB에서 이미지 + 텍스트를 검색하여 답변을 생성했다. VLM 파동 이전에는 실현 가능성을 보여주었다. 현대 시스템 (REACT, VisRAG, M3DocRAG) 은 이를 기반으로 한다.

### 생산 여행 계획자 예제

질문: "자연적인 빛으로 조용한 채식 브런치를 찾아라".

파이프라인:

1. 질의를 분해하십시오. "Quiet" → 오디오/평론 키워드; "vegan brunch" → 메뉴 항목; "자연 빛" → 이미지 기능.
2. 모달별로 검색:
   - 리뷰에 대한 텍스트 검색: "비건 브런치, 조용한 분위기".
   - 레스토랑 사진에서 사진 검색: "자연적인 빛, 공중".
   - 환경음속 클립에서 오디오 검색: "비소 데시벨, 음악이 없다".
3. 모든 레스토랑은 복합 점수를 가지고 있습니다.
4. 모든 증거와 함께 VLM 생성기 → 인용문과 함께 답변

이것은 텍스트-RAG를 훨씬 넘어갑니다. 각 모달은 텍스트만 놓친 신호를 추가합니다.

### 대원형 멀티모달 RAG

멀티 홉: 첫 번째 검색에서 높은 신뢰성 있는 답변이 반환되지 않으면 LLM는 다시 재설정하고 검색합니다.

- 초기 TOP-10를 검색해내세요 → LLM는 "너무 소란하고, <40 dB"를 필터로 검색해내세요 → 다시 검색해내세요.
- 이미지 → LLM를 보면 메뉴가 있습니다 → 메뉴 텍스트 → 답변을 검색합니다.

복잡성을 더하지만 단편 검색이 할 수 없는 질의를 처리합니다.

### 평가

크로스모달 평가는 아직 미성숙하다.

- 모달별로 리콜@k.
- 융합된 최고 정확성
- 인간에 의해 판단되는 종말에서 종말까지 만족.
- 업무별 (예약 완료, 구매)

표준 기준은 모든 모다리들을 포함하지 않습니다. 대부분의 논문은 영역에 대한 특정 작업에 대해 평가합니다.

```figure
contrastive-matrix
```

## 사용 하 고

`code/main.py`이 부분의 본문은

- 3개의 가짜 리트리버 ( 텍스트, 이미지, 오디오) 는 공동 레스토랑의 코퍼스에서 작동합니다.
- 모다리티 점수를 구성 가능한 무게와 결합하는 점수 합성
- 인용문으로 최종 답을 내리는 생성자 줄기
- 신뢰도가 낮다면 질의를 다시 공식화하는 간단한 요원 루프

## 선박

이 교훈은`outputs/skill-multimodal-rag-designer.md`. 멀티모달 질의 흐름이 있는 제품 사양을 고려하여, 검색기, 융합기, 생성기 및 평가 기획

## 운동

1. 의료-트라이어지 다형 RAG: 질의 = 부상 사진 + 텍스트 증상. 어떤 모다리에서 KB를 검색합니까?

2. 점수 합병은 간단한 중량 합입니다. MoE 합병을 피하는 실패 모드가 무엇입니까?

3. Abootorabi et al.'의 분류학 (부 3) 을 읽어 보십시오. 세 가지 가톨릭 과제 는 무엇 이며, 그 들 은 어떻게 선택 된 제품 에 맞춰져 있습니까?

4. 트립 플래너 멀티모달 RAG에 대한 평가 스펙을 설계하십시오. 어떤 측정값은 이미지 회수, 오디오 회수 및 복합 정확성을 포함합니까?

5. 에이전틱 멀티 홉 RAG는 반방송에 대해 지연 세금을 내는데, 정확한 점수가 지연을 정당화하는 질의 어려움은 무엇입니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Cross-modal retrieval | "Query one modality, retrieve another" | Text query retrieves images; image query retrieves text; requires a shared space or translator |
| Score fusion | "Combine scores" | Weighted sum of per-modality retrieval scores; simplest fusion |
| MoE fusion | "Modality-routed experts" | Gating network picks which modality's scores to trust per query |
| Grounded generation | "Cite your sources" | Each claim in the answer tagged with the source index |
| MuRAG | "First multimodal RAG" | 2022 paper that established the multimodal RAG pattern |
| Agentic multi-hop | "Reformulate and retry" | LLM re-queries retrievers when first-pass confidence is low |

## 더 많은 읽기

- [Abootorabi et al. — Ask in Any Modality (arXiv:2502.08826)](https://arxiv.org/abs/2502.08826)
- [Mei et al. — A Survey of Multimodal RAG (arXiv:2504.08748)](https://arxiv.org/abs/2504.08748)
- [Zhao et al. — Vision RAG Survey (arXiv:2503.18016)](https://arxiv.org/abs/2503.18016)
- [Chen et al. — MuRAG (arXiv:2210.02928)](https://arxiv.org/abs/2210.02928)
- [Liu et al. — REACT (arXiv:2301.10382)](https://arxiv.org/abs/2301.10382)
