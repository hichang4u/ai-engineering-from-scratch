# 모델, 시스템 및 데이터 세트 카드

> 세 가지 문서 형식은 인공지능 투명성을 구성합니다. 모델 카드 (Mitchell et al. 2019년)  모델에 대한 영양 표지: 훈련 데이터, 양적 분산 분석, 윤리적 고려 사항, 경고 사항; Hugging Face 모델 카드의 0.3%만이 윤리적 고려 사항을 문서화합니다 (Oreamuno et al. 2023년) 데이터 세트의 데이터 Sheets (Gebru et al. 2018년, CACM)  동기부여, 구성, 수집 과정, 표기, 유통, 유지보수; 전자-데이터 시트 유사성. 데이터 카드 (Pushkarna et al., Google 2022)  모듈형 계층 세부 사항 (텔레스코피, 페리스코피, 미세상) 다양한 독자를 위한 경계 객체로 2024~2025년 개발: LLM를 통해 자동화된 생성 (CardGen, Liu et al. 2024년); 모델 카드 세부 사항은 HF (Liang et al. 2024); 검증 가능한 인증 (라미네터, 더두 등. 2024); 탄소/물 (Jouneaux et al. 2025년 7월); EU/ISO 규제 카드 출현 시스템 카드 (Sidhpurwala 2024; 메타 시스템 수준의 투명성; "블루프린트 오브 트러스트" arXiv:2509.20394)

**Type:** Build
**Languages:** Python (stdlib, model-card + datasheet + system-card generator)
**Prerequisites:** Phase 18 · 18 (safety frameworks), Phase 18 · 24 (regulatory)
**Time:** ~60 minutes

## 학습 목표

- 원래 미첼 등 2019년 모델 카드와 2018년 Gebru 등 2018년 데이터시트를 설명한다.
- 데이터 카드의 망원경/페리스코피/미경층을 설명한다.
- 시스템 카드 및 그 종결 간 커버리지를 설명해 주십시오.
- 2024~2025년 3가지 개발 (자동화된 생산, 검증 가능한 인증, 지속가능성 보고) 를 설명한다.

## 문제

규제 프레임워크 (강좌 24) 와 연구소 안전 정책 (강좌 18) 모두 문서화가 필요합니다. 문서 형식은 모델 특수한 (모델 카드) 에서 데이터 세트 특수한 (데이터 시트) 으로 시스템 특수한 (시스템 카드) 으로 발전했습니다. 각각은 투명성의 다른 범위를 다루고 있습니다. 2024-2025 자동화 및 검증 가능한 인증 작업은 오랜 채택 문제를 해결합니다.

## 개념

### 모델 카드 (Mitchell et al. 2019)

부문:
- 모델 세부사항
- 의도된 사용
- 평가에 필요한 중요한 인구 통계적 또는 환경적 요인
- 메트릭스
- 평가 자료
- 훈련 자료
- 양적 분석 (요인에 의해 분산)
- 윤리적 문제
- 동굴과 추천

입양 문제: Oreamuno et al. Hugging Face 모델 카드의 2023 감사는 0.3%만이 윤리적 고려 사항을 문서화 한 것을 발견했습니다.

### 데이터 세트의 데이터 Sheets (Gebru et al. 2018)

전자 자료 표의 유사성
- 동기부여 (데이터셋이 생성된 이유)
- 구성 (내용)
- 수집 과정 (어떻게 조립되었는지)
- 표기 (가하는 경우)
- 사용 (목적, 금지, 위험)
- 배포
- 유지보수

CACM 2021에서 발표된 데이터 시트는 상류 문서입니다. 모델 카드는 데이터 시트의 정확도에 달려 있습니다.

### 데이터 카드 (Pushkarna et al., Google 2022)

모듈형 레이어 디테일 세 가지 확대 레벨
- **Telescopic.**전문가 아닌 사람들을 위한 수준 높은 요약
- **Periscopic.**ML 실무자 중급의 전반적인 설명
- **Microscopic.**감사의 세부적인 기능 수준 문서

경계 객체 프레임: 다른 독자들은 같은 문서에서 다른 정보를 추출합니다.

### 시스템 카드

범주: 모델 + 안전 스택 + 배포 컨텍스트를 포함한 종단에서 종단까지의 인공지능 시스템. 섹션에는 일반적으로 다음과 같은 것들이 포함됩니다.
- 보안 기능
- 즉각적인 주입 보호
- 데이터 익스필트레이션 탐지
- 선언된 인간 가치에 대한 조화를 이루는 것
- 사고 대응

시드푸르발라 2024 및 메타 시스템 수준의 투명성 작업. "신뢰의 블루프린트" (arXiv:2509.20394) 는 시스템 카드를 모델 카드의 배포 계층 보완으로 공식화합니다.

### 2024~2025년 개발

- **CardGen (Liu et al. 2024).**LLM를 통해 자동화된 모델 카드 생성; 표준화된 미첼 2019 필드에서 많은 인간 작성 카드보다 높은 객관성을 보고합니다.
- **Download correlation (Liang et al. 2024).**상세한 모델 카드들은 HF  채택 압력에 대한 최대 29% 더 높은 다운로드 비율과 상관관계를 맺고 있으며, 현재 시장에 의해 주도되고, 준수에만 의해 주도되지 않습니다.
- **Laminator (Duddu et al. 2024).**하드웨어 TEE/ 암호 서명 (Cryptographic Signatures) 를 통해 확인할 수 있는 인증서들은 모델 카드에 단순히 청구서가 아니라 청구증서가 담겨있도록 한다.
- **Sustainability (Jouneaux et al. July 2025).**탄소, 물, 컴퓨팅 에너지 발자국 추가; 신흥 ISO 표준
- **Regulatory cards.**EU AI 법 (강좌 24) GPAI 실천법률 투명성 장은 준수 유물로서 모델 카드가 요구됩니다.

### 이 부분은 18단계에 맞게

24~25강은 규제와 CVE 계층입니다. 26강은 문서 계층입니다. 27강은 데이터 시트의 상류를 구성하는 훈련 데이터 지배입니다. 28강은 카드에서 참조된 평가들을 생산하는 연구 생태계입니다.

```figure
an-card-scopes
```

## 사용 하 고

`code/main.py`장난감 배포를 위한 최소 모델 카드, 데이터 시트, 시스템 카드를 생성합니다. 각각은 가공적인 섹션 구조를 따르습니다.

## 선박

이 교훈은`outputs/skill-card-audit.md`. 모델 카드, 데이터 시트 또는 시스템 카드에 따라, 그것은 섹션의 커버링, 수치 분할 및 검증 가능한 인증서가 있는지 여부를 감사합니다.

## 운동

1. 달아`code/main.py`생성된 카드들을 검사하고 약한 부문을 확인하고 (직자만) 어떤 증거가 그들을 강화할 수 있는지 명시합니다.

2. 양적 분산 분석으로 두 가지 인구조계 그룹에 걸쳐 모델 카드의 확장 (강좌 20).

3. 0.3%의 채택률에 대한 Oreamuno et al. 2023을 읽어 보세요. 윤리적 고려의 채택을 증가시킬 모델 카드 사양에 하나의 구조적 변경을 제안합니다.

4. 라미네이터 (Duddu et al. 2024) 는 검증 가능한 인증에 TEEs를 사용합니다. 평가 결과의 암호 인증서를 가지고 있는 모델 카드 필드를 설계하고 검증자의 역할을 설명합니다.

5. 과거 프로젝트 또는 가설적 배포에 대한 시스템 카드 (시스템 카드, 모델 카드 아닌) 를 작성하고, 제3자 감사자를 위한 가장 높은 가치 섹션을 식별하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Model Card | "the Mitchell card" | Mitchell et al. 2019 standard documentation for ML models |
| Datasheet | "the Gebru datasheet" | Gebru et al. 2018 standard documentation for datasets |
| Data Card | "the Pushkarna card" | Google 2022 modular layered data documentation |
| System Card | "the deployment card" | End-to-end AI system documentation including safety stack |
| Boundary object | "different readers, one doc" | Data Cards framing: same document serves diverse audiences |
| Verifiable attestation | "the Laminator attestation" | Cryptographic or TEE proof attached to a documentation claim |
| Sustainability field | "carbon / water footprint" | Emerging 2025 addition for environmental accounting |

## 더 많은 읽기

- [Mitchell et al. — Model Cards for Model Reporting (arXiv:1810.03993, FAT* 2019)](https://arxiv.org/abs/1810.03993) 신성 모델 카드
- [Gebru et al. — Datasheets for Datasets (CACM 2021, arXiv:1803.09010)](https://arxiv.org/abs/1803.09010) 데이터 시트 종이
- [Pushkarna et al. — Data Cards (Google 2022)](https://arxiv.org/abs/2204.01075) 계층화된 데이터 문서화
- [Sidhpurwala et al. — Blueprints of Trust (arXiv:2509.20394)](https://arxiv.org/abs/2509.20394) 시스템 카드 공식화
