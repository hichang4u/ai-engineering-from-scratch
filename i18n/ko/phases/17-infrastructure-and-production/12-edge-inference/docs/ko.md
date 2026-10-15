# 엣지 인퍼런스  애플 신경 엔진, 퀄컴 헤엑사곤, 웹GPU/웹LLM, 제트슨

> 핵심 가장자리 제한은 메모리 대역폭입니다. 계산이 아닙니다. 모바일 DRAM는 50-90 GB/s에 위치하고 있으며, 데이터 센터 HBM3는 2-3 TB/s 에서 30-50x의 격차를 클리어합니다. 디코드는 메모리로 연결돼 있어 격차가 결정적이다. 2026년, 경관은 네 가지로 나뉘어 있습니다. 애플 M4/A18 신경 엔진은 통일 메모리로 38 TOPS (CPUNPU 복사본이 없습니다) 에 최고치를 기록합니다. 퀄컴 스냅드래곤 X 엘리트 / 8 Gen 4 헤엑사곤은 45 TOPS를 달성합니다. WebGPU + WebLLM는 M3 Max에서 Llama 3.1 8B (Q4) 를 ~41 tok/s로 실행한다 (내천의 약 70-80%); 17.6k GitHub 별, OpenAI 호환 API, ~70-75% 모바일 커버리지. NVIDIA 제트슨 오린 나노 슈퍼 (8GB) 는 Llama 3.2 3B / Phi-3에 적합합니다. AGX 오린은 vLLM를 통해 gpt-oss-20b를 ~ 40 토크/s로 실행합니다. TensorRT Edge-LLM는 EAGLE-3, NVFP4,  부스러기 전충을 지원합니다.

**Type:** Learn
**Languages:** Python (stdlib, toy bandwidth-bound decode simulator)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 17 · 09 (Production Quantization)
**Time:** ~60 minutes

## 학습 목표

- 모바일 LLM 추론이 메모리 대역폭에 제한되어 있고 계산이 부차적되는 이유를 설명하십시오.
- 네 개의 가장자리 목표 (Apple ANE, Qualcomm Hexagon, WebGPU/WebLLM, NVIDIA Jetson) 를 나열하고 각각의 사용 사례와 일치하십시오.
- 2026 WebGPU 커버링 격차 (Firefox Android 追赶) 및 Safari iOS 26 착륙을 명명하십시오.
- 목표에 따라 양화 형식을 선택하십시오 (Core ML INT4 + FP16 for ANE, QNN INT8/INT4 for Hexagon, WebGPU Q4 for browser, NVFP4 for Jetson Thor).

## 문제

고객들은 장치 내 채팅봇을 원합니다. 음성 먼저, 기본으로 개인, 오프라인에서 작동합니다. 맥북 프로 M3 맥스에서, Llama 3.1 8B Q4는 ~55 톤/초에 작동합니다. 아이폰 16 프로에서는 동일한 모델이 3 톤/초에 작동합니다. 스냅드래곤 8 Gen 3를 가진 중급 안드로이드에서 7 톤/초. Chrome 안드로이드 v121+에서 웹GPU를 통해 브라우저에서 장치에 따라 4-8 톤/초에 작동합니다.

출력차는 포팅 문제가 아닙니다. NPU가 사용자 공간에서 액세스 가능한지 양자 형식의 시간으로 대 한 대역폭 격차입니다. 2026 년 가장자리 추론은 네 가지 다른 솔루션으로 네 가지 다른 문제입니다.

## 개념

### 대역폭은 실제 천장입니다

디코드는 모든 토큰에 대한 전체 무게 세트를 읽습니다. Q4의 7B 모델은 3.5 GB입니다. 50 GB/s에서 3.5 GB를 읽는 것은 70 ms 입니다. 이론적 천장값은 ~ 14 tok/s입니다. 90 GB/s (고급 모바일 DRAM) 에서 천장은 ~ 25 tok/s로 이동합니다. 이 숫자에 비해 계산의 양이 도움이 없습니다.

데이터센터 HBM3 3 TB/s에서 같은 3.5 GB를 1.2 ms  천장 830 tok/s로 클리어합니다. 같은 모델, 같은 무게. 다른 메모리 하위 시스템.

### 애플 신경 엔진 (M4 / A18)

- 최대 38 TOPS. 통일된 메모리 (CPU와 ANE가 같은 풀을 공유한다)
- 코어 ML+를 통해 접근`.mlmodel`컴파일된 모델 또는 PyTorch를 통해 메탈 퍼포먼스 샤더 (MPS) 를 통해
- Llama.cpp 메탈 백엔드는 ANE를 직접 사용하지 않고 MPS를 사용합니다. 네이티브 ANE는 코어 ML 변환이 필요합니다.
- 2026년 iOS 앱의 가장 좋은 실용적인 경로: INT4 무게 + FP16 활성화를 위한 코어 ML.

### 퀄컴 헤엑사곤 (스냅드래곤 X 엘리트 / 8 Gen 4)

- 최대 45TPS, CPU와 GPU와 통합되어 있지만 별도의 메모리 도메인입니다.
- QNN (Qualcomm Neural Network) SDK와 AI Hub은 PyTorch/ONNX에서 변환을 제공합니다.
- 채팅 템플릿, Llama 3.2, Phi-3 모두 AI 허브에 1급 유물으로 배포됩니다.

### 인텔 / AMD NPU (문호, 라이젠 AI 300)

- 40-50 TOPS. 소프트웨어는 애플/쿼콤에 뒤쳐지고, 오픈비노는 개선되고 있지만 틈새가 있습니다.
- 윈도우 ARM 코파일트 앱에 가장 적합합니다. 로컬-프라이스트에 대한 AMD/Intel 데스크톱에서 원산지입니다.

### 웹GPU + 웹LLM

- 웹GPU 컴퓨팅 쉐더를 통해 브라우저에서 모델을 실행하십시오. 설치가 없습니다.
- Llama 3.1 8B Q4 M3 Max에서 ~ 41 tok/s  같은 백엔드를 통해 대략 70-80%의 원산지
- 17.6k GitHub 별 WebLLM; OpenAI 호환 JS API; Apache 2.0.
- 2026년 커버리: 크롬 안드로이드 v121+, 사파리 iOS 26 GA, 파이어폭스 안드로이드 여전히 따라오고 있습니다. 전체적으로 ~70-75%의 모바일 커버리지는 있습니다.

### NVIDIA 제트슨 가족

- 오린 나노 슈퍼 (8GB): Llama 3.2 3B, Phi-3에 잘 맞는 토크/s.
- AGX Orin: gpt-oss-20b를 vLLM로 ~40 tok/s로 실행합니다.
- Thor/ T4000 (JetPack 7.1): 2x AGX Orin 성능, EAGLE-3 및 NVFP4 지원
- TensorRT Edge-LLM (2026) 은 EAGLE-3 가상의 디코딩, NVFP4 무게,  데이터 센터 최적화 ported edge를 지원합니다.

### 목표별 양분 선택

| Target | Format | Notes |
|--------|--------|-------|
| Apple ANE | INT4 weights + FP16 activations | Core ML conversion path |
| Qualcomm Hexagon | QNN INT8 / INT4 | AI Hub converters |
| WebGPU / WebLLM | Q4 MLC (q4f16_1) | Use `mlc_llm convert_weight` + compiled `.wasm`; GGUF is not supported |
| Jetson Orin Nano | Q4 GGUF or TRT-LLM INT4 | Memory-bound |
| Jetson AGX / Thor | NVFP4 + FP8 KV | Edge-LLM path |

### 장편적 함정이 가장자리에 있습니다

Llama 3.1의 128K 컨텍스트는 데이터센터 기능이다. 8 GB RAM, 4 GB 모델 + 32K 토큰 + OS 오버헤드 = OOM에 대한 2 GB KV 캐시. 공격적인 KV 양량화 (Q4 KV) 가 허용되지 않는 한 엣지 배포는 컨텍스트를 4K-8K에서 유지합니다.

### 음성은 살인 앱입니다

음성 에이전트는 지연에 민감하다 (첫 번째 토큰 <500 ms). 로컬 추론은 네트워크 지연을 완전히 제거합니다. 음성- 텍스트 (비어스퍼 터보 변종이 가장자리에 실행됩니다) 과 결합하면 가장자리 추론은 생산 품질의 음성 루프가됩니다.

### 기억해야 할 숫자

- 애플 M4 / A18 ANE: 38 TOPS.
- 퀄컴 헤엑스agon SD X 엘리트: 45 TOPS
- WebLLM M3 Max: Llama 3.1 8B Q4에서 ~41 토크/초
- AGX Orin: vLLM를 통해 gpt-oss-20b에 ~40 tok/s.
- 데이터센터 가장자리 대역폭 격차: 30-50x
- 웹GPU 모바일 커버리: ~ 70-75% (Firefox 안드로이드 후퇴).

```figure
edge-bandwidth-pipe
```

## 사용 하 고

`code/main.py`엣지 목표에서 대역폭 제한된 수학에서 이론적 디코드 처리량을 정한다. 관찰된 벤치마크와 하이라이트와 비교하여 대역폭이 계산이 아닌 병목이 있는.

## 선박

이 교훈은`outputs/skill-edge-target-picker.md`. 플랫폼 (iOS/Android/browser/Jetson), 모델 및 지연기/메모리 예산을 고려하면 양화 형식과 변환 파이프라인을 선택합니다.

## 운동

1. 달아`code/main.py`. 스냅드래곤 8 Gen 3 (~77 GB/s 대역폭) 에 있는 Q4 7B 모델에 대해, 디코드 천장을 계산하십시오. 관찰된 6-8 tok/s와 비교하면  실행 시간은 효율적입니까?
2. 안드로이드의 WebGPU는 Chrome v121+를 필요로 한다. 같은 OpenAI 호환 API를 통해 오래된 브라우저에  서버 측으로  백업을 설계한다.
3. iOS 앱은 4K 컨텍스트 스트리밍이 필요합니다. 어떤 모델/프맷 조합은 iPhone 16에서 4GB의 활성 메모리를 유지할 수 있습니까?
4. 제트슨 AGX 오린은 40토크/초로 GPT-oss-20b를 실행하고 제트슨 나노는 3B에만 부합합니다.
5. "WebLLM는 2026년에 생산에 준비되어 있는지 여부를 주장하십시오". 포괄성과 성능, 그리고 Firefox 안드로이드 격차를 인용하십시오.

## 주요 용어

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ANE | "Apple neural engine" | On-device NPU in M-series and A-series; unified memory |
| Hexagon | "Qualcomm NPU" | Snapdragon NPU; QNN SDK for access |
| WebGPU | "browser GPU" | W3C-standardized browser GPU API; Chrome/Safari 2026 |
| WebLLM | "browser LLM runtime" | MLC-LLM project; Apache 2.0; OpenAI-compatible JS |
| Jetson | "NVIDIA edge" | Orin Nano / AGX / Thor / T4000 family |
| TRT Edge-LLM | "edge TensorRT" | 2026 edge port of TensorRT-LLM; EAGLE-3 + NVFP4 |
| Unified memory | "shared pool" | CPU and NPU see same RAM; no copy overhead |
| Bandwidth-bound | "memory limited" | Decode gated by bytes/sec reading weights |
| Core ML | "Apple conversion" | Apple framework for ANE-native models |
| QNN | "Qualcomm stack" | Qualcomm Neural Network SDK |

## 더 많은 읽기

- [On-Device LLMs State of the Union 2026](https://v-chandra.github.io/on-device-llms/) 풍경과 기준
- [NVIDIA Jetson Edge AI](https://developer.nvidia.com/blog/getting-started-with-edge-ai-on-nvidia-jetson-llms-vlms-and-foundation-models-for-robotics/) 오린 / AGX / 토르
- [NVIDIA TensorRT Edge-LLM](https://developer.nvidia.com/blog/accelerating-llm-and-vlm-inference-for-automotive-and-robotics-with-nvidia-tensorrt-edge-llm/)2026년 엣지 포트 발표
- [WebLLM (arXiv:2412.15803)](https://arxiv.org/html/2412.15803v2) 설계 및 기준
- [Apple Core ML](https://developer.apple.com/documentation/coreml) ANE-이족 변환
- [Qualcomm AI Hub](https://aihub.qualcomm.com/) 헤크사곤의 사전 변환된 모델
