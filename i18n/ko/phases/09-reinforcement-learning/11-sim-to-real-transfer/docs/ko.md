# 시프로 리얼 전송

> 하드웨어에 실패하는 시뮬레이터에서 훈련된 정책은 시뮬레이터를 기억한 정책입니다. 도메인 무작위화, 도메인 적응 및 시스템 식별은 학습된 컨트롤러를 현실 격차를 넘어서게 하는 세 가지 도구입니다.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 9 · 08 (PPO), Phase 2 · 10 (Bias/Variance)
**Time:** ~45 minutes

## 문제

실제 로봇 을 훈련 시키기는 느리고 위험하며 비싸다. 두발 다리는 걷기 를 배우기 위해 수백만 번 의 훈련 에피소드를 필요로 한다. 실제 두발 다리는 하드웨어 를 깨면 한 번이라도 넘어지는 것 이다. 시뮬레이션 은 무한 한 리셋, 결정적 재생 가능, 병렬 환경, 신체적 손해 를 주지 않는다.

하지만 시뮬레이터는 틀립니다. 베어링은 MuJoCo 모델보다 더 많은 마찰을 가지고 있습니다. 카메라는 렌즈 왜곡을 포함하지 않습니다. 모터에는 지연, 반작용, 그리고 포화로 인해 99%의 시뮬레이션 모델이 건너뛰습니다. 바람, 먼지, 변동적인 조명 sabotags 비균형 렌더링에 훈련 된 정책.**reality gap** sim 분포와 실제 분포의 체계적인 차이 은 로봇에 대한 RL의 핵심 문제입니다.

*시메트-실적 유통 전환에 견고한 정책이 필요합니다.* 세 가지 역사적 접근법: 시뮬레이터를 무작위로 (주적 무작위로) 조정, 약간의 실제 데이터를 사용하여 정책을 조정 (주적 적응 / 정렬) 또는 실제 시스템의 매개 변수를 식별하고 일치 (시스템 식별). 2026년, 지배적인 레시피는 세 가지 모두 대규모 병렬 시뮬레이션 (GPU에서 아이작 시ム, 아이작 랩, 무조코 MJX) 을 결합합니다.

## 개념

![Three sim-to-real regimes: domain randomization, adaptation, system identification](../assets/sim-to-real.svg)

**Domain Randomization (DR).**토빈 등 2017년, 핑 등 2018년 훈련 중에 실제 로봇에 따라 차이가 있을 수 있는 모든 시밍 매개 변수를 무작위로 설정하세요. 질량, 마찰 계수, 모터 PD 이득, 센서 소음, 카메라 위치, 조명, 텍스처, 접촉 모델. 정책은 "오늘날 어떤 시뮬레이션에 속하는지"에 대한 조건적 분포를 학습하고 전체 범위에 일반화합니다. 실제 로봇이 훈련 봉투에 속하면 정책이 작동합니다.

- **Upside:**실제 데이터가 필요없습니다. 하나의 레시피, 많은 로봇이 필요합니다.
- **Downside:**과도하게 무작위로 훈련이 "전체적"하지만 지나치게 신중한 정책을 만들어냅니다.

**System Identification (SI).**시뮬레이터의 매개 변수를 실제 데이터에 맞추어 훈련 전에 실제 로봇에 팔 관절 마찰을 측정할 수 있다면, 그것을 시뮬레이션에 연결해 보세요. 그런 다음 이러한 값을 예상하는 정책을 훈련하세요. 실제 시스템에 액세스 할 필요가 있지만 현실 격차를 직접 줄입니다.

- **Upside:**정확한 소음 적 훈련 목표
- **Downside:**남은 모델 오류는 정책에 보이지 않습니다. 작은 식별되지 않은 효과 (예를 들어, 모터 deadband) 는 여전히 배포를 중단합니다.

**Domain Adaptation.**시뮬레이션으로 훈련, 작은 양의 실제 데이터로 정렬.

- **Real2Sim2Real:**잔재 시뮬레이터를 배우십시오$f(s, a, z) - f_{\text{sim}}(s, a)$실제 로울을 사용하여 수정된 시밍을 훈련시켜 실제 데이터 없이 격차를 닫습니다.
- **Observation adaptation:**학습된 기능 추출기 (예를 들어, GAN 픽셀에서 픽셀) 를 통해 실제 OBS → SIM 같은 OBS를 지도하는 정책을 훈련합니다. 컨트롤러는 sim에서 유지됩니다.

**Privileged learning / teacher-student.**미키 등 2022 (ANYmal quadruped). 특권 정보 (지상 진실 마찰, 지형 높, IMU 파동) 를 이용할 수 있는 시뮬레이션에서 *교사를 훈련하십시오. 실제 센서 관측만 보는 *학생*을 분해하십시오. 학생은 물리적 매개 변수들을 통해 견고한 역사에서 특권 특징을 추론하는 것을 배우습니다.

**Massively parallel simulation.**2024~2026. 아이작 랩, 무조코 MJX, 브랙스는 모두 하나의 GPU에서 수천 개의 병렬 로봇을 실행합니다. 4,096 개의 병렬 인형형이있는 PPO는 몇 시간 동안 수년간의 경험을 수집합니다. 훈련 분포가 확대됨에 따라 "실상성 격차"는 줄어들습니다. 이 4,096 개의 엔브 중 각각이 다른 무작위로 구성된 매개 변수를 가지고있을 때 DR는 거의 자유로됩니다.

**The real-world 2026 recipe (quadruped walking example):**

1. 대대적으로 동행 시밍, 도메인 무작위 중력, 마찰, 모터 이득, 유용 부하.
2. 특권 정보 (지방 지도, 육체의 속도, 지상 진실) 를 가진 교육자 정책
3. 학생 정책은 교사의 직접 수용 (발절 관절 코더) 를 이용해서만 유출되었습니다.
4. 실제 IMU에서 자동코더를 통해 선택적으로 관찰 적응
5. 10개 이상의 환경에서 무사한 촬영을 해내면 안전 제한을 가진 PPO로 실제 세계 정렬을 몇 분 동안 해내세요

```figure
f3-reality-gap
```

## 건설 해

이 수업의 코드는 * 노이즈 * 전환으로 GridWorld에서 도메인 무작위화라는 작은 시범입니다. 우리는 "sim"에서 무작위적으로 슬립 확률을 경험하고 훈련 중에 본 적이 없는 슬립 레벨로 "진짜"에서 평가하는 정책을 훈련합니다. 모양은 직접 MuJoCo-to-hardware 전송으로 지도합니다.

### 단계 1: 매개 변수 시

```python
def step(state, action, slip):
    if rng.random() < slip:
        action = random_perpendicular(action)
    ...
```

`slip`실제 로봇에서 마찰, 질량, 운동 이득이 sim와 real 사이에 변하는 모든 것을 나타낼 수 있습니다.

### 단계 2: DR와 함께 훈련

각 에피소드 시작에서 샘플`slip ~ Uniform[0.0, 0.4]`PPO/Q 학습을 훈련시켜서 많은 에피소드를 해보세요.

### 단계 3: "실적" 슬라이드에서 0 샷을 평가하십시오

평가`slip ∈ {0.0, 0.1, 0.2, 0.3, 0.5, 0.7}`. 첫 번째 네 가지 교육 지원에 해당한다.`0.5`그리고`0.7`DR 훈련 정책은 내부 지원에 거의 최적의 상태를 유지해야 하고 외부에서 우아하게 떨어질 수 있습니다. 고정 슬립 훈련 정책은 훈련 슬립 밖에서 부서지기 마련입니다.

### 4단계: 좁은 훈련과 비교

두 번째 정책을 훈련합니다`slip = 0.0`같은 점에 대해 평가합니다`slip`실제 슬라이프가 0이 되면 재앙적인 하락이 나타날 것입니다.

## 함정

- **Too much randomization.**열차가 `slip ∈ [0, 0.9]`그리고 당신의 정책은 위험성이 너무 높아서 최적의 길을 시도하지 않습니다. 현실 세계 배포와 일치합니다. "어떤 일이 일어날 수 있습니다".
- **Too little randomization.**얇은 조각에 훈련하고 정책은 일반화 할 수 없습니다. 정책이 개선됨에 따라 배포를 확장하는 적응적 교육과정을 사용하십시오.
- **Misidentified parameter space.**잘못된 것을 무작위로 설정해 보세요 (실반의 차이는 모터 지연이 있는 경우 카메라 색채) DR는 도움이 되지 않습니다.
- **Privileged info leakage.**단순히 관찰이 아닌, 행동으로 글로벌 상태를 사용하는 교사는 따라잡을 수 없는 학생을 만들어낼 수 있습니다. 관찰 역사를 주어진 학생에게 교사의 정책이 실현될 수 있도록 보장합니다.
- **Sim-to-sim transfer failure.**만약 여러분의 정책이 더 어려운 SIM 버전에 견고하지 않는다면, 실제 세계에도 견고하지 않을 것입니다. 항상 배치하기 전에 견고한 SIM 버전에 테스트를 해 보세요.
- **No real-world safety envelope.**낮은 수준의 안전 보호막이 없는 시밍에서 작동하고 "실제에서 작동"하는 정책은 여전히 하드웨어를 깨뜨릴 수 있습니다. 학습되지 않은 컨트롤러에 속도 제한, 토크 제한, 공동 제한을 추가합니다.

## 사용 하 고

2026년 시미-투-리얼 스택:

| Domain | Stack |
|--------|-------|
| Legged locomotion (ANYmal, Spot, humanoid) | Isaac Lab + DR + privileged teacher / student |
| Manipulation (dexterous hands, pick-and-place) | Isaac Lab + DR + DR-GAN for vision |
| Autonomous driving | CARLA / NVIDIA DRIVE Sim + DR + real fine-tune |
| Drone racing | RotorS / Flightmare + DR + online adaptation |
| Finger/in-hand manipulation | OpenAI Dactyl (DR at unprecedented scale) |
| Industrial arms | MuJoCo-Warp + SI + small real fine-tune |

모든 규모의 제어에 있어서 작업 흐름은 일관성 있게 됩니다. 가능한 한 심을 잘 맞게 하고, 맞지 않는 것을 무작위로 조정하고, 거대한 정책을 훈련시키고, 디스틸하고, 안전 방패를 배치합니다.

## 선박

`outputs/skill-sim2real-planner.md`이 부분의 본문은

```markdown
---
name: sim2real-planner
description: Plan a sim-to-real transfer pipeline for a given robot + task, covering DR, SI, and safety.
version: 1.0.0
phase: 9
lesson: 11
tags: [rl, sim2real, robotics, domain-randomization]
---

Given a robot platform, a task, and access to real hardware time, output:

1. Reality gap inventory. Suspected sources ranked by expected impact (contact, sensing, actuation delay, vision).
2. DR parameters. Exact list, ranges, distribution. Justify each range against real measurements.
3. SI steps. Which parameters to measure; measurement method.
4. Teacher/student split. What privileged info the teacher uses; what obs the student uses.
5. Safety envelope. Low-level limits, emergency stops, backup controller.

Refuse to deploy without (a) a zero-shot sim-variant test, (b) a safety shield, (c) a rollback plan. Flag any DR range wider than 3× measured real variability as likely over-randomized.
```

## 운동

1. **Easy.**Q- 학습 에이전트를 고정 슬립 그리드월드 (slip=0.0) 에 훈련 시키십시오.$\text{slip} \in \lbrace 0.0, 0.1, 0.3, 0.5 \rbrace$- 이랑 이랑
2. **Medium.**DR Q 학습 에이전트 샘플링을 훈련합니다 `slip ~ Uniform[0, 0.3]`DR는 슬립=0.5 (분류되지 않은) 에서 얼마나 많이 구입합니까?
3. **Hard.**교육과정을 시행: 슬립=0.0로 시작하여 정책이 90%의 최적의 범위를 달성할 때마다 DR 범위를 넓혀라. 슬립=0.3의 0점과 고정된 DR 기본 기준을 달성하기 위해 전체 환경 단계를 측정하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Reality gap | "Sim-to-real difference" | Distribution shift between training and deployment physics/sensing. |
| Domain randomization (DR) | "Train across random sims" | Randomize sim parameters during training so policy generalizes. |
| System identification (SI) | "Measure real and fit sim" | Estimate real physical parameters; set sim to match. |
| Domain adaptation | "Fine-tune on real data" | Small real-world fine-tune after sim training; may adapt obs or dynamics. |
| Privileged info | "Ground truth for teacher" | Information only the sim has; student must infer it from obs history. |
| Teacher/student | "Distill privileged -> observable" | Teacher trained with shortcuts; student learns to mimic without them. |
| ADR | "Automatic Domain Randomization" | Curriculum that widens DR ranges as the policy improves. |
| Real2Sim | "Close the gap with real data" | Learn a residual to make the sim mimic real rollouts. |

## 더 많은 읽기

- [Tobin et al. (2017). Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World](https://arxiv.org/abs/1703.06907) 본래의 DR 문서 (로봇 기술 비전)
- [Peng et al. (2018). Sim-to-Real Transfer of Robotic Control with Dynamics Randomization](https://arxiv.org/abs/1710.06537) 역학, 네 배로 이동을 위한 DR
- [OpenAI et al. (2019). Solving Rubik's Cube with a Robot Hand](https://arxiv.org/abs/1910.07113) 다클리, ADR 규모
- [Miki et al. (2022). Learning robust perceptive locomotion for quadrupedal robots in the wild](https://www.science.org/doi/10.1126/scirobotics.abk2822)ANYmal의 교사와 학생
- [Makoviychuk et al. (2021). Isaac Gym: High Performance GPU Based Physics Simulation for Robot Learning](https://arxiv.org/abs/2108.10470) 2025~2026의 배포를 주도하는 대규모 병렬 시밍
- [Akkaya et al. (2019). Automatic Domain Randomization](https://arxiv.org/abs/1910.07113) ADR 교육과정 방법
- [Sutton & Barto (2018). Ch. 8 — Planning and Learning with Tabular Methods](http://incompleteideas.net/book/RLbook2020.pdf) 현대 시미-트리얼 파이프라인을 뒷받침하는 디나 프레임 (계획 + 투입 모델을 사용)
- [Zhao, Queralta & Westerlund (2020). Sim-to-Real Transfer in Deep Reinforcement Learning for Robotics: a Survey](https://arxiv.org/abs/2009.13303) 벤치마킹 결과를 가진 sim-to-real 방법의 분류학.
