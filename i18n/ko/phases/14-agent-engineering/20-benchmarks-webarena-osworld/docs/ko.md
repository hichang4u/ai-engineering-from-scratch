# 벤치마크: WebArena 및 OSWorld

> 웹아레나는 네 개의 자체 호스팅 앱에서 웹 에이전트 기능을 테스트합니다. OSWorld는 우분투, 윈도우, 맥OS에서 데스크톱 에이전트 기능을 테스트합니다. 출시 (2023~2024) 에 두 가지 모두 클래스 최고의 에이전트와 인간 사이의 큰 격차를 나타냈습니다. 격차는 좁아지고 있습니다. 실패 모드는 변하지 않았습니다.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 19 (SWE-bench, GAIA)
**Time:** ~60 minutes

## 학습 목표

- 웹아레나의 네 개의 자체 호스팅 앱을 설명하고 실행 기반 평가가 중요한 이유는 무엇인지를 설명하십시오.
- OSWorld이 접근성 API 대신 실제 OS 스크린샷을 사용하는 이유를 설명하십시오.
- OSWorld의 두 가지 주요 실패 모드: GUI 지형 및 운영 지식
- 기본 기준에 추가된 OSWorld-G와 OSWorld-Human의 내용을 요약해 보십시오.

## 문제

일반주의 에이전트는 도구를 호출할 수 있습니다. 쇼핑 체크 아웃을 완료하기 위해 20 클릭으로 브라우저를 구동할 수 있습니까? 키보드와 마우스를 사용하여 리눅스 박스를 구성할 수 있습니까? 웹 아레나와 OSWorld이 대답하는 질문입니다.

## 개념

### 웹아레나 (Zhou et al., ICLR 2024)

- 4개의 자체 호스팅 웹 앱에서 812개의 긴 장면을 수행하는 작업: 쇼핑 사이트, 포럼, GitLab와 같은 개발 도구, 비즈니스 CMS.
- 그리고 공용품: 지도, 계산기, 스크래치패드
- 평가는 체육관 API를 통해 실행에 기반을 둔다.
- 발매 시: 최고의 GPT-4 에이전트는 14.41%의 성공률을 기록했고, 인간 78.24%의 성공률을 기록했다.

자율 주최 프레임링은 중요합니다  기준은 목표 앱이 고정되어 재생 가능하기 때문에 이 아닙니다.

### 확장

- **VisualWebArena** 영상 기반 작업, 성공이 이미지를 해석하는 데 달려 있습니다 (프라임 관찰으로 스크린샷).
- **TheAgentCompany**(Dec 2024) 는 터미널 + 코딩을 추가합니다. 실제 원격 작업 환경과 더 비슷합니다.

### OSWorld (Xie et al., NeurIPS 2024)

- 우부투, 윈도우, 맥오스에서 369개의 실제 컴퓨터 작업이 있습니다.
- 실제 응용 프로그램의 자유형 키보드 및 마우스 제어
- 1920×1080 스크린샷을 관찰으로
- 출시 시: 최고의 모델 12.24% 대 인간 72.36%.

### 주요 실패 모드

1. **GUI grounding.**픽셀 → 요소 지도. 모델은 1920×1080에서 UI 요소를 안정적으로 현지화하기 위해 고군분투합니다.
2. **Operational knowledge.**어떤 메뉴가 설정, 어떤 키보드 단축키, 어떤 선호도 패널을 가지고 있습니다.

### 후속

- **OSWorld-G**564개의 샘플 토지용 제품군 + 제다이 훈련장치. 계획에서 토지용을 분해하여 별도로 측정할 수 있습니다.
- **OSWorld-Human** 수동으로 정렬된 금의 행동 궤도. 상위 요원들이 필요한 것보다 1.4-2.7배 더 많은 단계를 사용한다고 보여준다 (궤도-효율 격차).

### 왜 이 점 이 중요 합니까?

클로드 컴퓨터 사용, 오픈AI CUA, 트메니 2.5 컴퓨터 사용 (강좌 21) 모두 WebArena 및 OSWorld가 형성한 작업량에 훈련합니다. 기준은 목표이며 생산 모델은 배송 된 답입니다.

### 벤치마킹이 잘못되는 곳

- **Screenshot-only evals.**OSWorld는 스크린샷으로 운영됩니다. OSWorld에서 DOM 또는 접근성 API를 사용하는 에이전트를 평가하는 것은 지형화 과제를 놓치고 있습니다.
- **Ignoring trajectory length.**성공률만 점수를 받는다면 OSWorld-Human의 1.4-2.7x 단계 부효율이 떨어집니다.
- **Stale self-hosted apps.**WebArena의 앱은 특정 버전을 핑; 재조정 없이 업데이트는 비교성을 깨고 있습니다.

```figure
ae-agent-human-gap
```

## 건설 해

`code/main.py`장난감 웹 에이전트 배너스를 구현합니다.

- 최소 "쇼핑 앱" 상태 기계: 리스트_아이템, add_to_cart, 체크아웃.
- 3개의 작업에 대한 금 궤도.
- 각 작업을 시도하는 스크립트 에이전트
- 실행 기반 평가자 (국립 검증) 및 궤도 효율성 측정기 (단계와 금)

실행하세요:

```
python3 code/main.py
```

출력: OSWorld-Human의 방법론을 반영한 작업 당 성공률과 궤도 효율성.

## 사용 하 고

- **WebArena Verified**지속적인 평가에 대한 내부 클러스터에 자체적으로 주관합니다.
- **OSWorld**데스크톱 에이전트들을 위한 VM 함대에서
- **Computer-use agents**(강좌 21)  클로드, 오픈AI CUA, 트메니 모두 이런 작업에 훈련 받았습니다.
- **Your own product flows** 당신의 20가지 주요 작업에 대한 금 궤도를 파악하고, 주간적으로 대리인을 대결시켜라.

## 선박

`outputs/skill-web-desktop-harness.md`실행 기반의 eval 및 궤도 효율성 측정값을 사용하여 웹/ 데스크톱 에이전트 을 구축합니다.

## 운동

1. 장난감 배지를 두 번째 앱 (포럼) 로 확장 하십시오. 3 가지 작업과 금색 궤도를 작성하세요.
2. 작업에 대한 궤도 효율성 보고를 추가하세요. 장난감에 있어서, 에이전트는 금보다 1x, 2x, 또는 3x가 있습니까?
3. 금 궤도가 절대 사용하지 않는 "중요한 방해자" 도구를 구현하세요. 스크립트 된 에이전트가 유혹을 당합니까?
4. OSWorld-G를 읽어보세요. 어떻게 기지 실패와 계획 실패를 구분할 수 있을까요?
5. 웹아레나의 앱을 읽어보세요. 어된 앱 버전 중 하나를 업그레이드하면 어떤 장애가 발생합니까?

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| WebArena | "Web agent benchmark" | 812 tasks across 4 self-hosted apps; gym-style evaluation |
| VisualWebArena | "Visual WebArena" | Visually grounded WebArena; screenshots are observations |
| OSWorld | "Desktop agent benchmark" | 369 tasks on real Ubuntu/Windows/macOS |
| GUI grounding | "Pixel-to-element mapping" | Model localizing UI elements in 1920x1080 |
| Operational knowledge | "OS know-how" | Which menu, which shortcut, which preference pane |
| OSWorld-G | "Grounding suite" | 564 grounding-only samples + training set |
| OSWorld-Human | "Gold trajectories" | Manual expert action sequences to measure efficiency |
| Trajectory efficiency | "Steps over gold" | Agent step count divided by human minimum |

## 더 많은 읽기

- [Zhou et al., WebArena (arXiv:2307.13854)](https://arxiv.org/abs/2307.13854) 네 앱 웹 벤치마크
- [Xie et al., OSWorld (arXiv:2404.07972)](https://arxiv.org/abs/2404.07972) 크로스OS 데스크톱 벤치마크
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) 클로드의 기준형 능력
- [OpenAI, Computer-Using Agent](https://openai.com/index/computer-using-agent/) OSWorld 및 WebArena 번호
