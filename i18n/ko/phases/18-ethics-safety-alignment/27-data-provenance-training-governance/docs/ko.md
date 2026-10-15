# 데이터 출처 및 교육 데이터 관리

> EU AI 법은 2025년 8월까지 GPAI에 대해 기계독성 오프타이드 표준을 요구합니다 (EU 저작권 지침 TDM 예외를 통해). 캘리포니아 AB 2013 (기록된 2024)  인공지능 교육-데이터 투명성 창업자는 12개의 의무적인 분야를 포함하는 데이터 집합의 요약을 발표해야 합니다. 2025 DPA의 정당한 관심에 대한 조정은: 아일랜드 DPC (21 May 2025) 는 EDPB의 의견에 따라 보호 사항이 있는 메타의 첫 번째 당사자 공개 EU/EEA 성인 콘텐츠에 대한 LLM 교육을 받아들이고; 콜른 고등 지역 법원은 (23 May 2025) 는 처분을 거부하고; 함부르크 DPA는 긴급성을 떨어뜨리고; 영국 ICO (23 September 2025) 는 링크드인의 인공지능 훈련 보호 사항 (투명성, 단순화된 거부, 확장된 반대 여정은) 에 대해 긍정적 인 규제 대응을 발표하고, 계속 모니터링합니다. 공식적인 승인이 아닙니다. 브라질 ANPD (2024년 7월 2일) 는 정보 투명성이 부족하기 때문에 메타의 처리 작업을 중단했으며, 메타가 컴플라이언스 계획을 제출한 후 2024년 8월 30일에 예방 조치가 취소되었다. 주요 돌이킬 수 없는 문제: 쿠키 동의 프레임워크는 실시간, 돌이킬 수 있는 추적을 위해 설계되었습니다. 데이터 모델 중량으로되면 수술적 삭제는 불가능합니다. 훈련된 신경 네트워크에 대한 GDPR의 실질적인 삭제 권한은 없습니다. 수령시에는 수령시입니다. 데이터 프로벤انس 이니셔티브 (dataprovenance.org, Longpre, Mahari, Lee et al., "위기에서의 동의", 2024년 7월): 출판사들이 robots.txt 제한을 추가함에 따라 대규모 감사는 AI 데이터 코먼스의 급속한 감소를 보여줍니다.

**Type:** Learn
**Languages:** Python (stdlib, 12-field California AB 2013 scaffolding generator)
**Prerequisites:** Phase 18 · 24 (regulatory), Phase 18 · 26 (cards)
**Time:** ~60 minutes

## 학습 목표

- CA 2013의 12개의 의무 분야를 설명하여 생성 AI 훈련 데이터 투명성을 설명합니다.
- 합법적인 관심 있는 LLM 교육에 대한 2025 DPA의 입장을 설명하십시오 (아일랜드 DPC, 영국 ICO, 함부르크, 콜론).
- 돌이킬 수 없는 문제를 설명해 보십시오. 왜 GDPR의 삭제권은 훈련된 신경망에 실질적인 대등이 없는지 설명해 주십시오.
- 데이터 프로벤스 이니셔티브의 "위기에서의 동의"의 결과를 설명하십시오.

## 문제

교육 데이터 지배는 모든 모델 카드 (강좌 26) 과 규제 의무 (강좌 24) 의 전류입니다. 2024~2025년, 규제 환경은 3가지 원칙에 의해 통합되었습니다. 선택 인프라, 데이터 세트 공개 및 공개 가능한 데이터에 대한 합법적 이익 조정은. 수집 시 준수하지 않는 제공자는 하류에 대한 보완을 할 수 없습니다.

## 개념

### 캘리포니아 AB 2013

2026년 1월 1일 또는 그 이후에 출시된 시스템들에 대한 문서들은 2026년 1월 1일 또는 그 이전에 게시되어야 합니다. 3111 (a) 섹션에서는 개발자가 12개의 법규 항목으로 훈련에 사용되는 데이터 세트의 수준 높은 요약을 발표하도록 요구합니다.
1. 데이터 집합의 출처 또는 소유자
2. 데이터 세트가 인공지능 시스템의 의도된 목적을 어떻게 이룰 수 있는지에 대한 설명
3. 데이터 집합에 있는 데이터 포인트의 수 (일반 범위는 허용되며, 동적 데이터 집합에 대한 추정치)
4. 데이터 포인트의 종류에 대한 설명 (표가 표시된 데이터 집합에 대한 레이블 유형, 표가 표시되지 않은 데이터에 대한 일반적인 특징)
5. 데이터 세트에는 저작권, 상표 또는 특허로 보호되는 데이터가 있는지 또는 전적으로 공공 영역에 있는지 여부는
6. 데이터 세트가 구매되었는지 또는 허가되었는지
7. 데이터 세트에는 개인 정보가 포함되어 있는지 (Civ. Code §1798.140 (v))
8. 데이터 세트에는 소비자 정보의 합적 내용이 포함되어 있는지 (Civ Code §1798.140 (b) 에 따라)
9. 개발자가 의도한 목적으로 청소, 가공 또는 다른 변경
10. 자료를 수집한 기간, 수집이 계속되는 경우 통지
11. 데이터 세트가 개발 중에 처음 사용된 날짜
12. 시스템이 합성 데이터 생성을 사용하거나 지속적으로 사용하는지 여부는

제12조 (합성 데이터) 는 2018년 데이터 시트에 비해 새로운 것입니다. 제7조 (개인정보) 는 개인정보 보호권법 (CPRA) 의 의무가 발생한다. 법령은 보안/종합성, 항공기 운영 및 연방에서만 국가 보안 시스템을 면제한다 (부문 3111 (b)).

### EU AI 법 (강좌 24) 및 TDM 거부

EU 저작권 지침의 텍스트 및 데이터 채굴 예외는 저작권자의 선택이 없는 한 공개적으로 이용 가능한 콘텐츠에 대한 교육을 허용합니다. EU AI 법 GPAI 실습 코드 저작권 장은 GPAI 제공자가 기계로 읽을 수 있는 거부 신호를 존중하도록 요구합니다 (robots.txt, C2PA "AI 훈련 없음" 주장, 등).

### 2025 DPA의 합병성

아일랜드 DPC (2025년 5월 21일): 메타의 첫 번째 당사자 공개 EU/EEA 성인 사용자 콘텐츠에 대한 교육 계획 콜론 고등 지역 법원은 (2025년 5월 23일) 메타에 대한 징계 처분을 배제합니다. 함부르크 DPA는 EU 전체의 일관성을 위한 긴급 절차를 중단합니다. 영국 ICO (영국 ICO) 는 2025년 9월 23일, 비슷한 방안과 지속적인 모니터링을 통해 링크드인의 인공지능 교육을 재개하는 것에 대해 공식적인 허가를 받지 않고 긍정적인 규제 대응을 발표했다.

컨버전트 원칙: 합법적인 관심은 공개적으로 이용 가능한 퍼스트파티 콘텐츠에 대한 교육을 거부할 수 있습니다. 동의가 필요하지 않습니다.

### 브라질 ANPD (2024년 6월)

미타의 브라질 사용자 데이터 처리 및 인공지능 훈련에 대한 정보 투명성이 부족하다는 이유로 중단되었습니다. EU DPA와 다른 결과  ANPD는 합법적 이익의 허용보다 투명성을 우선시했습니다.

### 돌이킬 수 없는 문제

쿠키 동의는 실시간, 역전성 추적을 위해 설계되었습니다. 훈련 데이터는 다릅니다. 데이터가 모델 무게에 들어간 후에는 수술적 지워지는 것이 불가능합니다. 처음부터 다시 훈련하는 것은 유일한 완전한 치료법이며, 그것은 막대한 비용이 든다.

부분적인 치료법:
- **Unlearning.**대략적인 제거; MIA로 측정된다 (학습 22).
- **Influence function-based localization.**데이터에 가장 영향을 받은 무게를 식별하고 선택적으로 업데이트한다.
- **Fine-tune-suppression.**모델이 데이터에서 얻은 출력을 거부하도록 훈련하십시오.

이 문제는 완전히 해결되지 않았습니다.

### 데이터 출처 협동

데이터프로브렌انس.org 롱프레, 마하리, 리 등 "위기에서의 동의" (2024년 7월): 인공지능 훈련 데이터 공유의 대규모 감사 발견: 출판사들은 robots.txt 제한을 가속화하고 있습니다. 공개적으로 훈련 가능한 상용품은 빠르게 줄어들고 있습니다. 2023~2024년에는 25% 정도의 교육자료가 일부 제한을 추가했습니다. 관련: 미래의 교육 데이터 가용성은 새로운 인수 패러다임 (허가를, 합성 생성, 인센티브 참여) 에 달려 있습니다.

### 이 부분은 18단계에 맞게

26강은 모델 수준의 문서입니다. 27강은 데이터 세트 수준의 지배입니다. 함께 투명성 계층을 정의합니다. 28강은 이러한 문제에 대한 연구 생태계를 지도합니다.

```figure
an-provenance-oneway
```

## 사용 하 고

`code/main.py`장난감 데이터 세트에 대한 캘리포니아 AB 2013 컴플라이언스 12 필드 데이터 세트 요약 스카프를 생성합니다. 당신은 필드를 채우고 어떤 필드가 개인 정보 보호 또는 저작권 후속 의무가 발생하는지 관찰 할 수 있습니다.

## 선박

이 교훈은`outputs/skill-provenance-check.md`. 교육에 사용되는 데이터 세트를 고려하면 AB 2013 12 분야 포괄, 오프트 아웃 인프라 준수, DPA 조율 및 돌이킬 수 없는 위험 평가에 대한 검사를 한다.

## 운동

1. 달아`code/main.py`장난감 데이터 세트에 대한 12개의 필드 요약을 작성하고, 어느 필드가 미흡한지를 확인한다.

2. EU 저작권 지침 TDM 오프타웃은 기계독성입니다. 오프타웃 신호에 대한 표준 형식을 제안하고 robots.txt 및 C2PA "AI 훈련이 없습니다".

3. 데이터 프로벤스 이니셔티브의 "위기에서의 동의" (2024년 7월) 를 읽어 보세요. 가장 빠르게 제한되는 콘텐츠 카테고리 3가지에 대해 설명하고 하나의 경제적 결과를 주장하세요.

4. 2025년 DPA 조정은 공공 콘텐츠 교육에 대한 정당한 관심을 받아들이고 정당한 이해가 충분하지 않은 시나리오를 구축하고 대신 제공자가 필요로 하는 법적 근거를 확인합니다.

5. 각 데이터 세트에 대한 AB 2013 필드와 C2PA 서명된 출산 체인을 포함하는 훈련 데이터 출산 매니페스트를 스케치하고 한 가지 기술적 및 한 가지 법적 장벽을 식별하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| AB 2013 | "the California law" | Generative AI training-data transparency; 12 mandated fields |
| TDM exception | "text-and-data-mining" | EU Copyright Directive training-data exception with opt-out |
| Legitimate interest | "the EU basis" | GDPR Article 6 basis that may justify training on public content |
| Opt-out signal | "machine-readable no-train" | robots.txt, C2PA "No AI Training," TDM.Reservation |
| Irreversibility | "cannot un-train" | Data in model weights is not surgically removable |
| Unlearning | "approximate removal" | Post-training interventions to reduce model dependence on specific data |
| Consent in Crisis | "the DPI audit" | July 2024 finding of accelerating robots.txt restrictions |

## 더 많은 읽기

- [California AB 2013](https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2013) 인공지능 교육-데이터 투명성 법
- [EU AI Act + GPAI Code of Practice (Lesson 24)](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) 저작권 장
- [Longpre, Mahari, Lee et al. — Consent in Crisis (dataprovenance.org, July 2024)](https://www.dataprovenance.org/consent-in-crisis-paper) DPI 감사
- [IAPP — EU Digital Omnibus GDPR amendments (2025)](https://iapp.org/news/a/eu-digital-omnibus-amendments-to-gdpr-to-facilitate-ai-training-miss-the-mark) 규제 환경
