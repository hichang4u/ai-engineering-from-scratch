# GPU 설정 및 클라우드

> CPU를 훈련시키는 것은 학습에 적합합니다. 실제 훈련은 GPU가 필요합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 minutes

## 학습 목표

- 로컬 GPU 가용성을 확인하여 `nvidia-smi`그리고 PyTorch의 CUDA API
- 무료 클라우드 기반 실험을 위해 T4 GPU로 Google Colab를 구성하십시오
- CPU와 GPU에 벤치 매트릭스 곱셈을 측정하고 가속도를 측정
- fp16 엄지손가락 규칙을 사용하여 VRAM에 맞는 가장 큰 모델을 추정하십시오

## 문제

1-3 단계의 대부분의 수업은 CPU에서 잘 진행됩니다. 하지만 CNN, 트랜스포머 또는 LLM (단계 4+) 를 훈련하기 시작하면 GPU 가속화가 필요합니다. CPU에서 8시간 동안 훈련하는 것은 GPU에서 10분 동안 진행됩니다.

3가지 옵션이 있습니다. 로컬 GPU, 클라우드 GPU, 또는 구글 콜라브 (무료).

## 개념

```
Your options:

1. Local NVIDIA GPU
   Cost: $0 (you already have it)
   Setup: Install CUDA + cuDNN
   Best for: Regular use, large datasets

2. Google Colab (free tier)
   Cost: $0
   Setup: None
   Best for: Quick experiments, no GPU at home

3. Cloud GPU (Lambda, RunPod, Vast.ai)
   Cost: $0.20-2.00/hr
   Setup: SSH + install
   Best for: Serious training, large models
```

```figure
s0-gpu-dispatch
```

## 건설 해

### 옵션 1: 로컬 NVIDIA GPU

혹시 있는지 확인해

```bash
nvidia-smi
```

CUDA를 사용하여 PyTorch를 설치합니다.

```python
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

### 옵션 2: 구글 콜라브

1. 가[colab.research.google.com](https://colab.research.google.com)
2. 실행시간 > 실행시간 유형 변경 > T4 GPU
3. 달아`!nvidia-smi`확인하기 위해서

이 코스에서 노트북을 바로 콜라브에 업로드하세요.

### 옵션 3: 클라우드 GPU

람다 랩스, 런팟 또는 Vast.ai:

```bash
ssh user@your-gpu-instance

pip install torch torchvision torchaudio
python -c "import torch; print(torch.cuda.get_device_name(0))"
```

### GPU가 없지?

대부분의 수업은 CPU에 적용됩니다. GPU가 필요한 사람들은 그렇게 말하고 Colab 링크를 포함합니다.

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using: {device}")
```

## 빌드 이: GPU vs CPU 벤치마크

```python
import torch
import time

size = 5000

a_cpu = torch.randn(size, size)
b_cpu = torch.randn(size, size)

start = time.time()
c_cpu = a_cpu @ b_cpu
cpu_time = time.time() - start
print(f"CPU: {cpu_time:.3f}s")

if torch.cuda.is_available():
    a_gpu = a_cpu.to("cuda")
    b_gpu = b_cpu.to("cuda")

    torch.cuda.synchronize()
    start = time.time()
    c_gpu = a_gpu @ b_gpu
    torch.cuda.synchronize()
    gpu_time = time.time() - start
    print(f"GPU: {gpu_time:.3f}s")
    print(f"Speedup: {cpu_time / gpu_time:.0f}x")
```

## 운동

1. 위의 벤치마크를 실행하고 CPU와 GPU 시간을 비교
2. GPU가 없다면 구글 콜라브에서 실행하고 비교해 보세요
3. 얼마나 많은 GPU 메모리를 가지고 있는지 확인하고, 가장 큰 모델을 추정하십시오.

### 암시

**Exercise 1.**빌드 이트 섹션에서 코드를 그대로 실행하고, CPU 시간, GPU 시간, 속도 라인을 기록하십시오. 두 번째 실행을 실행하십시오. 첫 번째 GPU 실행에는 시작 비용이 포함되어 있으므로 두 번째 숫자는 비교 할 수 있습니다.

**Exercise 2.**콜라브에서 실행시간을 선택하고 실행시간 유형을 변경하고 GPU를 선택하고 벤치마크를 셀에 붙여넣어 실행합니다 `!nvidia-smi`다른 세포에서 먼저 GPU 이름을 표시해야 합니다.

**Exercise 3.**전체 메모리를 읽어보세요`torch.cuda.get_device_properties(0).total_memory / 1e9`, 예를 들어`code/gpu_check.py`. 메모리를 바이트로 2로 나눈 후 fp16의 매개 변수를 계산하면, 마진을 유지해야 합니다. 왜냐하면 활성화와 CUDA 컨텍스트도 메모리를 사용하기 때문입니다.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| CUDA | "GPU programming" | NVIDIA's parallel computing platform that lets you run code on the GPU |
| VRAM | "GPU memory" | Video RAM on the GPU, separate from system RAM. Limits model size. |
| fp16 | "Half precision" | 16-bit floating point, uses half the memory of fp32 with minimal accuracy loss |
| Tensor Core | "Fast matrix hardware" | Specialized GPU cores for matrix multiplication, 4-8x faster than regular cores |
