# 캡스톤 12  비디오 이해 파이프라인 (무상, QA, 검색)

> 12개의 연구소에서 마렌고+페가수스를 생산했습니다. 비디오DB는 CRUD-for-video API를 배포했습니다. AI2의 molmo2는 VLM 체크포인트가 공개되었습니다. 쌍둥이들은 오랜 맥락으로 몇 시간 동안 영상을 원산적으로 처리합니다. 타임렌스-100K는 시간적 지형을 확장했습니다. 2026 파이프라인은 해결되었습니다: 장면 세그먼트, 각 장면 캡션 + 임베디션, 트랜스크립트 조렬, 다중 벡터 지표, 그리고 (시작, 종료) 타임 스탬프와 프레임 미리보기로 응답하는 질의. 이 톱톤은 100시간 동안 소비하고, 공공 기준을 달성하고, 계산과 행동 문제에 대한 환각을 측정하고 있습니다.

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (UI)
**Prerequisites:** Phase 4 (CV), Phase 6 (speech), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P6 · P7 · P11 · P12 · P17
**Time:** 30 hours

## 문제

장형 비디오 QA는 2026 스케일에서 가장 대역폭에 굶주린 멀티모달 문제입니다. 제미니 2.5 프로는 2시간짜리 비디오를 원본적으로 읽을 수 있지만, 100시간의 비디오를 검색 가능한 코퍼스에 흡수하려면 여전히 장면 수준의 지수가 필요합니다. 제작 형태는 장면 세그먼트를 (TransNetV2 또는 PySceneDetect) 결합하고, 각 장면 캡션과 VLM (Gemini 2.5, Qwen3-VL-Max, 또는 Molmo 2), 변본 조렬 (Whisper-v3-turbo와 단어 타임스테이블) 과 함께 캡션, 프레임 임베디션 및 변본을 저장하는 멀티 벡터 인덱스를 결합합니다. 질의 파이프라인에는 (시작, 종료) 시간표와 프레임 미리보기로 답변이 있습니다.

벤치마크는 공개 (ActivityNet-QA, NeXT-GQA) 과 자신의 100 개의 쿼리 사용자 정의 집합입니다. 계산 및 행동 유형의 질문들에 대한 환각은 알려진 하드 실패 클래스입니다.

## 개념

3개의 파이프라인은 흡수에서 병렬로 운행합니다.**Scene segmentation**비디오가 장면으로 잘라집니다.**VLM captioning**각 장면에 대한 캡션과 키프레임에서 삽입된 프레임을 생성합니다. **ASR alignment**문장 수준의 시간표를 생성합니다. 세 스트림은 (scene_id, 시간 범위) 로 결합됩니다. 각 장면은 멀티 벡터 인덱스 (Qdrant) 에서 세 가지 벡터 유형을 얻습니다. 캡션 임베딩, 키프레임 임베딩, 트랜스크립트 임베딩.

질의 시간에 자연어 질문은 세 가지 벡터 모두에 대해 불립니다. 결과는 RRF와 결합됩니다. 시간 지형 어댑터 (TimeLens 스타일) 는 상위 장면 내의 (시작, 끝) 창을 정비합니다. VLM 합성기는 (Gemini 2.5 Pro 또는 Qwen3-VL-Max) 는 인용된 시간표와 프레임 미리보기로 질의 + 상위 장면 + 절단 프레임과 답변을 취합니다.

환각 측정 은 중요 하다. 계산 ("실 에 얼마나 많은 사람 들 이 들어온다?") 과 행동 유형 ("급 요리사 는 기 전 에 붓는 것 인가?") 의 질문 은 불균형적 으로 신뢰성 이 없다. 정확성 을 설명적 질문 과 분리 하여 보고 한다.

## 건축

```
video file / URL
      |
      v
PySceneDetect / TransNetV2  (scene segmentation)
      |
      +--- per-scene keyframe --- VLM caption + frame embedding
      |                            (Gemini 2.5 Pro / Qwen3-VL-Max / Molmo 2)
      |
      +--- audio channel --- Whisper-v3-turbo ASR + word timestamps
      |
      v
multi-vector Qdrant: {caption_emb, keyframe_emb, transcript_emb}
      |
query:
  dense queries against all three -> RRF merge -> top-k scenes
      |
      v
TimeLens / VideoITG temporal grounding (refine start/end within scene)
      |
      v
VLM synth: query + top scenes + frame previews
      |
      v
answer + (start, end) timestamps + frame thumbs + citations
```

## 

- 장면 세그먼트: TransNetV2 (최첨단 2024-26) 또는 PySceneDetect
- ASR: Whisper-v3-turbo, 단어 시간표로 빠른 비스퍼
- VLM 캐피션 + 응답기: Gemini 2.5 Pro 또는 Qwen3-VL-Max 또는 Molmo 2
- 시간적 지형: TimeLens-100K 훈련형 어댑터 또는 VideoITG
- 지표: 다중 벡터 지원 (자본 / 프레임 / 변본)
- 사용자 인터페이스: HTML5 비디오 플레이어 및 장면 줄여서 Next.js 15
- Eval: ActivityNet-QA, NeXT-GQA, 사용자 지정 100 질문 수동으로 표시된 세트
- 환각 기준: 수량 및 행동 유형과 함께 손 표기

```figure
cf-scene-index
```

## 건설 해

1. **Ingest walker.**유튜브 URL 또는 로컬 MP4를 받아보세요. 필요하다면 720p까지 다운스케일하세요. 계속하세요`{video_id, file_path}`- 그래

2. **Scene segmentation.**TransNetV2 또는 PySceneDetect을 실행하여 생성합니다`[{scene_id, start_ms, end_ms, keyframe_path}]`목표 100시간: 6K-8K 장면

3. **ASR pass.**오디오에서 Whisper-v3 터보를 실행하고, 워드 레벨 타임스테이프를 수출하고, 각 장면 각본 슬라이드에 나눌 수 있습니다.

4. **VLM captioning.**각 장면에 따라 키프레임과 짧은 캡션 템플릿을 사용하여 Gemini 2.5 Pro (또는 Qwen3-VL-Max) 를 호출하십시오. 캡션 + 프레임 임베디션을 생성하십시오.

5. **Multi-vector index.**3개의 이름 붙인 벡터로 Qdrant 수집`{video_id, scene_id, start_ms, end_ms, keyframe_url}`- 그래

6. **Query.**자연어 질문에는 세 개의 덩치가 높은 질문들이 열립니다. 상호 순위 합병과 결합합니다.

7. **Temporal grounding.**상위 장면에서 TimeLens 스타일의 어댑터를 실행하여 장면 내의 (start, end) 창을 정비합니다.

8. **VLM synth.**쿼리 + 상위 3개의 장면 클립 (사진이나 단편 클립) + 기록으로 기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기`(video_id, start_ms, end_ms)`인용문

9. **Eval.**ActivityNet-QA 및 NeXT-GQA를 실행하세요. 100 개의 쿼리 사용자 지정 세트를 구축하세요. 전체 정확성 + 클래스별 분할을 보고하세요 (수정, 행동, 설명).

## 사용 하 고

```
$ video-qa ask --url=https://youtube.com/watch?v=X "how many cars pass the intersection in the first minute?"
[scene]    23 scenes detected
[asr]      transcript complete, 4m12s
[index]    69 vectors written (23 scenes x 3)
[query]    top scene: scene 3 [01:32-01:54], confidence 0.84
[ground]   refined window: [00:12-00:58]
[synth]    gemini 2.5 pro, 1.4s
answer:    5 cars pass the intersection between 00:12 and 00:58.
citations: [scene 3: 00:12-00:58]
          [frame preview at 00:14, 00:27, 00:44, 00:51, 00:57]
```

## 선박

`outputs/skill-video-qa.md`유튜브 URL 또는 업로드 된 비디오를 제공하면 파이프라인에서 장면들을 지표하고 시간표 인용으로 질문에 답합니다.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Temporal grounding IoU | Intersection-over-union on held-out grounding set |
| 20 | QA accuracy | NeXT-GQA and custom 100-query |
| 20 | Ingest throughput | Hours of video per dollar spent |
| 20 | UI and citation UX | Timestamp links, thumbnail strip, jump-to-frame |
| 15 | Hallucination rate | Counting and action-type accuracy separately |
| **100** | | |

## 운동

1. 글씨가 붙여진 표지판에서 Gemini 2.5 Pro를 Qwen3-VL-Max로 교환해 보세요. 인간으로 평가된 50 장의 샘플에서 글씨 품질 델타를 보고하세요.

2. 각 장면 프레임 임베디션을 멀티 벡터 대신 하나의 벡터로 줄이고 검색 회귀를 측정합니다.

3. "회수 엄격한" 모드를 구축: 합성기는 계산된 모든 인스턴스를 시간표로 추출하고 사용자가 확인하기 위해 클릭합니다. 사용자 확인이 환각을 줄이는지를 측정합니다.

4. 기준 섭취 비용: 3개의 VLM 옵션에서 1달러당 시간 비디오

5. 스피커 다이어리즈 된 전록을 추가: 오디오에 pyannote 스피커 다이어리징을 실행하고 스피커마다 전록을 삽입하십시오. "Alice는 X에 대해 무엇을 말했다?"라는 질문을 표시하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Scene segmentation | "Shot detection" | Cutting video into scenes at shot boundaries |
| Multi-vector index | "Caption + frame + transcript" | Qdrant collection with named vectors per representation |
| Temporal grounding | "When exactly did it happen" | Refining the (start, end) window for a query answer |
| Frame embedding | "Visual representation" | A vector embedding of a keyframe; used for scene-visual similarity |
| RRF fusion | "Reciprocal rank fusion" | Merge strategy across multiple ranked lists; a classic hybrid-retrieval trick |
| Counting hallucination | "Miscount" | Known failure mode of VLMs on "how many X" questions |
| ActivityNet-QA | "Video-QA benchmark" | Long-form video QA accuracy benchmark |

## 더 많은 읽기

- [AI2 Molmo 2](https://allenai.org/blog/molmo2) VLM 체크포인트 개통
- [TimeLens (CVPR 2026)](https://github.com/TencentARC/TimeLens) 시간적 규모의 지형
- [Gemini Video long-context](https://deepmind.google/technologies/gemini) 호스트 참조
- [VideoDB](https://videodb.io) CRUD-for-video API 참조
- [Twelve Labs Marengo + Pegasus](https://www.twelvelabs.io) 상업적 참조
- [TransNetV2](https://github.com/soCzech/TransNetV2) 장면 세그먼트 모델
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) 클래식 오픈 얼터너티브
- [ActivityNet-QA](https://arxiv.org/abs/1906.02467) 참조 평가 기준
