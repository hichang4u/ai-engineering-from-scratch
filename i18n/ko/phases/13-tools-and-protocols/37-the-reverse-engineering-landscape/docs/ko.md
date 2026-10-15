# 역공학 경관: 역사, 도구 가족, 그리고 디컴파일러의 제작 방법

> 다섯 개의 도구는 같은 물체를 읽고 네 개의 주소와 세 개의 블록을 계산하고 하나의 스위치에 두 개의 답을 제공합니다. 이 수업은 어느 것이 어느 것이인지를 보여주는 배너스를 만듭니다.

**Type:** Build
**Languages:** Python, C, x86-64 assembly, Java (one Ghidra script)
**Prerequisites:** Phase 13 · 32 (ELF from scratch), Phase 13 · 33 (disassembly and control flow), Phase 13 · 34 (lifting to pseudocode)
**Time:** ~150 minutes

## 학습 목표

- 현장의 주요 도구 를 1973 년 부터 2026 년 까지의 시간 연계 에 배치 하고 그 들 의 가족 의 이름 을 붙여 보십시오.
- 디컴파일러의 8단계와 기드라, 바이너리 닌자, 헥스 레이, 라다레2, 리진, 그리고 아그르가 각단계에 사용하는 용어를 명명하십시오.
- ESIL, RzIL, P-코드, VEX에 한 가지 명령어를 올려놓고 그 중 어느 쪽이 기호를 열망 있게 쓰고 어떤 쪽이 덩어리를 저장하는지 설명해 주세요.
- 5개의 도구의 주소를 1개로 줄여주십시오 `.text`한 함수에 대한 감소를 반과하고 증명합니다.
- 캡처 된 도구 출력을 읽고 명령 시작, 블록, 가장자리 및 함수 시작에 대한 합의를 보고하는 비교 띠를 구축하십시오.
- 캡처된 증거에서 이름을 따서, 각각의 도구가 코드를 발명하거나 코드를 놓치고 있거나 간접적인 점프에서 멈춘

## 문제

3개의 역공학 도구가 말하는 것을 요약해 달라고 요원에게 요청합니다`grade``ledger-x86_64-O1.o`. 에이전트는 각 도구를 실행하고 세 개의 목록을 읽고, 함수가 위치하고 있다고 보고합니다 `0x08000050`하나의 도구로`0x400010`다른 곳에서는`0x100010`3번째로, 도구들이 그 기능의 위치를 달리한다는 결론을 내립니다.

도구는 동의합니다. 객체는 이동 가능하며 로드 주소가 없습니다. 따라서 각 도구는 하나를 선택합니다. 각 도구가 부여한 주소를 빼십시오 `.text`그리고 모든 답은`0x10`에이전트는 원본 주소를 비교했는데 어떤 주소가 어떤 도구에 있는지 알려주지 않았기 때문입니다.

나중에 같은 에이전트가 읽습니다`grade``-O0`4개의 도구에서 3, 8, 8 및 9개의 기본 블록을 생성하고 보고합니다. 네 개의 숫자는 모두 실제입니다.`jmp rax`. 2개의 도구가 점프 테이블을 이재로 읽습니다. 한 도구는 점프에서 블록을 나뉘어 라벨을 붙입니다. 그 뒤에 이유가 없는 블록 카운트는 청구 없이 숫자가 됩니다.

이 교훈은 여러분이 그 숫자를 신뢰하기 전에 필요한 지도입니다. 32~36강은 디코더, 리프트, 증거 기록, 재건을 위한 트랙의 두 번째 반은 사람들이 사용하는 도구 옆에 놓습니다. 이를 위해 필드의 역사와 도구가 포함된 가족, 모든 디컴파일러가 실행되는 파이프라인, 그리고 직접 컴파일한 물체에 도구가 말하는 것을 비교하는 배너스가 필요합니다.

```figure
re-37-field-map
```

## 세 년 이 지어진 단계

이 필드는 대부분의 도구 보다 오래 된 것 이다. 아래의 날짜 는 추가 읽기 에 주요 자료 를 가지고 있다.

### 1973~1991: 디버거, 그리고 디모델링

최초의 디컴파일 테सिस은 1973년이다. 스탠퍼드 대학의 홀랜더와 퍼듀 대학의 하우스엘이 작성한 테सिस이며, 오늘날에도 인용을 통해 알려져 있다. 그 시대의 실용적인 도구는 디버거였다. 마란잔과 본은 `adb`1977년 벨 연구소에서 배그거를 배포한 UNIX V7`DEBUG`, 8086 디스몬더를 탑재하여 1981년 8월에 PC-DOS 1.00로 출시되었다. 리처드 스탈먼의 GDB는 1986년에 유통에 들어갔다.

배트 해체기 (batch disassemblers) 는 다음으로 왔습니다. 1988년 V 커뮤니케이션에서 소어서가 DOS 프로그램을 통해 여러 개의 패스를 실행하고 댓글을 달린 목록을 작성했습니다. GNU 바이누틸은 1988년 무등한 스냅샷으로 시작되었습니다.`objdump`1990년 저작권 소유자 인 Ilfak Guilfanov는 1991년 1월 IDA의 첫 선을 작성하고 1991년 5월 20일에 IDA 0.1을 공유 소프트웨어로 출시했다.

### 1991~2009: 인터랙티브 디스모델러와 최초의 디스컴필러

크리스티나 시푸엔테스는 1994년 7월 QUT에서 "반복 컴파일 기술"을 마쳤다. 그녀의 디컴파일러,`dcc`, i80286 DOS 프로그램을 C로 옮겼고, 1995년 Gough와 함께 발표한 논문에서는 모든 후속 디컴파일러가 보유한 단계를 설정했습니다. 1997년에 REC, 2002년에 Boomerang가 시작되었습니다.

IDA는 1996년 DataRescue에서 상업용 제품으로 전환되었고 1999년에 플러그인 SDK를 획득하였고 2005년에 설립된 Hex-Rays로 이전하였다. 헤크스 레이스 디컴파일러 1.0은 2007년 9월 17일에 발매되었다. 같은 해 마이크 반 에머릭은 "Dekompiliation for Static Single Assignment"을 제출했다. 하얼버 플레이크의 "실행 가능한 객체의 구조 비교" (2004) 는 다른 가족을 시작했으며, 빈디프는 2004년 8월에 판매에 올랐다.

radare는 2006년 2월 64비트 오프셋을 가진 법의학적인 헤크스 편집기로서 시작되었다. LGPL 3.0에 따라 모듈형 재편성된 radare2는 2009년 3월 7일에 처음 출시되었다.

### 2009~2019: 프레임워크 및 중간 표현

LLDB는 2010년 6월 8일에 LLVM 하부 프로젝트로 발표되었다. BAP는 CAV 2011에서 등장하였다. 2011년 3월 1일에 Google은 BinDiff의 제작자인 zynamics를 인수하였다. 2011년 3월 1일에 Hopper은 Mac App Store에서 등장하였다. 2011년 말 Matt Godbolt은 2012년 C++ 프로그래머가 컴파일러를 제작한 어셈블리를 볼 수 있도록 컴파일러 익스플로러를 시작했습니다.

angr은 2013년 8월에 첫 번째 코드 라인을 받았습니다. 피닉스 논문 (Schwartz, Lee, Woo, Brumley, USENIX Security 2013) 은 40 개의 의미 보존 구조를 보여주었습니다.`goto`8,676개의 함수들을 통해`goto`패턴에 독립된 구조를 가진 진술 벡터 35은 2015년 1월 14일에 설립되었으며, 바이너리 닌자는 2016년 7월 23일에 저 레벨 IL와 파이썬 API를 통해 판매에 올랐다. angr은 2015년에 공개되었으며 2016년 8월 DARPA 사이버 그랜드 챌린지에서 3위를 차지했다. 2016년 3월, BinDiff은 무료로 사용되었다. 커터 1.0은 2017년 12월 radare2에 Qt GUI를 제공했다. 2018년 Guilfanov는 Recon에서 "Decompiler internals: microcode"를 발표했다.

### 2019~2026: 오픈 디컴파일러와 연구 전환

기드라 9.0는 2019년 3월 5일 RSA 회의에서 Apache 2.0 아래 NSA에서 공개되었으며, 한 달 후 GitHub에서 전체 소스를 사용했습니다. 그 해 에 8.19.2.4 에 예비 디컴파일러 를 추가 하였다. 바이너리 닌자 2.0는 2020년 5월 20일에 하이 레벨 IL 디컴파일러를 배포했다. 리진은 2020년 12월 8일 라다레2의 포크로 발표되었으며, 커터 팀은 이 포크로 이동했다. IDA 프리웨어 7.6는 2021년 5월 클라우드 x64 디컴파일러를 추가했다.

BinDiff 8은 2023년 9월 25일 Apache-2.0에 의해 오픈소스로 공개되었다. SAILR (Basque and others, USENIX Security 2024) 는 angr의 기본 구조가 되었고, 단지 가짜라고 주장했다.`goto`이 문서는 Linux 6.1에서 3,754개의 문자를 가지고 있기 때문에 삭제되어야 합니다. 바이너리 닌자 4.0은 2024년 2월에 무료 버전과 IDA 9.0를 추가했습니다.`idalib`머리가 없는 사용에 대한 학습-분석기 논문들은 SLaDe (2023) 에서 LLM4Decompile (2024) 까지, DecompileBench (2025) 까지, 그리고 대리자 보조 가독성 및 더 많은 것을 컴파일하고 덜 보존하는 분석기 논문들에 대한 두 개의 2026 연구로 진행된다.

이 수업이 실행한 버전은 2026년 10월 14일 현재 버전: 기드라 12.1.4 (2026년 9월 21일), 라다레2 6.2.4 (2026년 10월 5일), 리진 0.9.1 (2026년 6월 29일), 안그라 10.0.3 (2026년 10월 10일) 이다. 바이너리 닌자 6.0 "크립톤" (2026년 9월 3일) 및 IDA 9.4 (2026년 7월 13일) 은 현재 폐쇄된 도구이다. 이 수업은 그들을 실행하지 않았다.

## 도구 가족

도구는 그 도구가 만들어내는 것만으로 가족에게 속해 있습니다. 가족들은 하나의 프로그램에서 겹쳐서, 겹치는 것이 대부분의 혼란이 시작되는 곳입니다.

### 분산기

라인형 스파이 쿼드는 코드 섹션의 첫 바이트에서 마지막 바이트까지 덱로드합니다.`objdump -d`그리고`llvm-objdump -d`이 방법은 모두 작동하고, 둘 중 어느 것도 제어 흐름 그래프를 만들지 않습니다.`objdump`이 도구는 명령어 경계를 표시하고 그 사이에 스와이를 합니다. binutils 2.47 (26 7 월 2026) 는 GPL-3.0 또는 후기입니다. LLVM 23.1.3 는 LLVM 예외를 제외하고 Apache-2.0입니다. 애플의 명령 라인 도구는 `llvm-objdump`"Apple LLVM 버전 17.0.0"라고 적혀 있습니다.

인터랙티브 디스 콤블러는 알려진 항목에서 리큐티브 다운스를 실행하고, 함수 시작에 대한 유리스틱을 추가하고 데이터베이스를 유지합니다.`Disassembler`+ 자동 분석 분석기), 바이너리 닌자 (복귀적 하락, 그리고 알려지지 않은 영역을 가로질러 선형 스윙), 호퍼, 라다레2 및 리진 (`aa``aaa``af`), 커터와 이아이토가 GUI로 이 가족에 속한다. 안드리세와 다른 사람들은 (USENIX 보안 2016) 컴파일러 생성 바이너리에서 9개를 측정했다. 명령 정확도는 100%에 가깝고 하드 원시적은 함수 시작으로 20% 이상의 거짓 음률을 가지고 있었다.

### 분해기

상업적 디컴파일러: 헤크스 레이스 디컴파일러 (x86에서 RISC-V까지 12개의 목표 가족), 바이너리 닌자 HLIL와 Pseudo C 렌더링, 그리고 호퍼의 Pseudo-코드 뷰. 오픈 디컴파일러: Ghidra 디컴파일러, Apache-2.0 아래의 C++ 엔진으로 r2ghidra와 rz-ghidra가 플러그인으로 재사용하고 pypcode가 리프터로 재사용하고, BSD-2-클로즈에 따라 SAILR 구조를 가진 AIL에 대한 Angr 디컴파일러, JavaScript에서 r2dec 및 jsdec, Boomerang 및`dcc`역사적으로, 레이더2도 내장된`pdc`, "C 형식의 해체법에서 가짜 해체 출력"`pdc`0. 9. 1 리진에서 존재하지 않습니다.`pdg`Rz-Gidra 플러그인을 필요로 합니다.

### 디버거

GDB (1986) 은 GEF 및 pwndbg 전면 끝, LLDB (2010), Time Travel Debugging (2017), OllyDbg (2014년 냉동), x64dbg (GPL-3.0, 2014), Ghidra Debugger (Ghidra Debugger) 은 파이썬 연결기, 바이너리 닌자 디버거 및 radare2 및 rizin의 내장 디버거를 포함합니다. 레슨 42는 두 가지의 자체 빌드에서 사용합니다.

### 바이너리 분석 프레임워크

angr (VEX IR, 상징적인 실행, `CFGFast`그리고`CFGEmulated`BAP (BIL, OCaml), Dyninst, Jakstab, 그리고 ByteWeight는 Andriesse의 이름이다.`import binaryninja`, 그리고 IDA를 통해`idalib`- 그래

### 형식 및 엔진 라이브러리

라이프 1.0.0 (2026년 7월 12일, 아파치 2.0) 는 ELF, PE, Mach-O, COFF, 안드로이드 형식을 분석한다. CLE, "CLE Loads Everything"는 Angr의 로더이다. Capstone 5.0.9 (28년 5월, BSD-3-Clause) 는 디코드; Keystone 0.9.2 (GPL-2.0) 집합; Unicorn 2.1.4 (GPL-2.0) 에뮬레이터. radare2 6.2.4 팩 Capstone 5 및 리진 0.9.1 판매자 Capstone, Zydis, 그리고 트리-시터.

### 디핑 도구 및 컴파일러 사이드 시청자

IDA Pro, Binary Ninja, Ghidra에 대한 BinDiff 8 (Apache-2.0) 와 함께, IDA 플러그인으로 IDA 3.4.3 (2026년 10월 11일, AGPL-3.0) 를 사용함.`radiff2`그리고`rz-diff`. 컴파일러 익스플로러 (BSD-2-클라즈) 는 컴파일러가 출처 조각을 위해 발사하는 집합을 보여줍니다. 이 목록의 다른 모든 것의 앞 방향입니다. 레슨 44는 다른 가족을 사용합니다.

### 버전, 라이선스, 그리고 이 수업의 내용

| Tool | Version read on 2026-10-14 | Licence | Headless entry | Ran here |
|---|---|---|---|---|
| Ghidra | 12.1.4 | Apache-2.0 | `analyzeHeadless`, `pyghidra.start()` | yes, on all four objects |
| radare2 | 6.2.4 | LGPL-3.0 | `r2 -qc '<cmds>' file`, `rabin2` | yes |
| rizin | 0.9.1 | LGPL-3.0 | `rizin -qc '<cmds>' file`, `rz-bin` | yes |
| angr | 10.0.3 | BSD-2-Clause | `angr.Project` in Python | yes |
| llvm-objdump | Apple LLVM 17.0.0 | Apache-2.0 with LLVM exception | `llvm-objdump -d -r` | yes |
| Binary Ninja | 6.0 "Krypton" | commercial; Free edition for non-commercial use | `binaryninja.load()` with a Commercial, Ultimate, or headless licence | no, documentation only |
| IDA Pro | 9.4 | commercial subscription; IDA Free for non-commercial x86 and x86-64 | `idat`, `ida -A -S`, `idalib` | no, documentation only |
| Hopper | 6.6.0 | commercial, perpetual | none documented | no, documentation only |
| Cutter | 2.5.0 | GPL-3.0 | GUI over rizin | no |

무료 버전의 바이너리 닌자는 x86, x86-64, ARMv7 및 AArch64만 해독하고 API가 없습니다. IDA 무료에는 IDAPython, SDK, 그리고 없습니다.`idalib`이 수업의 두 도구에 대한 모든 문서는 문서화와 발매 메모에서 나온다. 그리고 그 그림은 실행되지 않은 것으로 표시됩니다.

## 디컴파일러 파이프라인, 단계 가 단계

시푸엔테스는 1994년에 이 단계들을 명명하였다. 문법 분석, 의미 분석, 중간 코드 생성, 제어 흐름 그래프 생성, 데이터 흐름 분석, 제어 흐름 분석, 코드 생성. 기계에 의존하는 전면, 기계와 언어에 독립된 중간, 언어에 의존하는 뒷면으로 분할했습니다. 그 이후로 모든 디컴파일러는 그 모양을 유지하고 부품의 이름을 바꾸어 놓습니다. 아래 표 에서는 이 강의 에서 사용 되는 8 가지 단계 와 각 도구 의 이름 을 알려 줍니다. 그림은 도구 열을 선택할 수 있는 동일한 테이블을 보여줍니다.

| Stage | Ghidra | Binary Ninja | Hex-Rays / IDA | radare2 | rizin | angr |
|---|---|---|---|---|---|---|
| Loader | `ElfLoader`, `MachoLoader`, `PeLoader`; `.ldefs` picks the language | `BinaryView`, `BinaryViewType` | loader module (`LDSC`) | RBin (`rabin2`) | RzBin (`rz-bin`) | CLE (`cle.Loader`, `main_object`) |
| Disassembly | `Disassembler`; SLEIGH `.slaspec` compiled to `.sla`; analyzers "Disassemble Entry Points", "Function Start Search" | architecture plugin; Recursive Descent, then linear sweep phases | processor module (`ana.cpp`, `emu.cpp`, `out.cpp`); autoanalysis queues; FLIRT | RArch plugin to `RAnalOp`; `aa`, `aaa`, `af` | RzAnalysis plugin; `aa`, `aaa`, `af` | Capstone blocks; `CFGFast` function start search |
| CFG recovery | "Generate Basic Blocks and the CFG"; `BlockGraph`; "Decompiler Switch Analysis" | `Function`, `BasicBlock`; "Control Flow Graph (CFG) Analysis" phase | `mbl_graph_t`, ready at `MMAT_LOCOPT` | `afb`, `agf`, `aab` | `afb`, `agf`, `aab` (Nucleus) | `CFGFast`, `CFGEmulated`; `kb.functions`; IRSB |
| Lifting | "Generate Raw P-code"; Varnodes in `ram`, `register`, `const`, `unique` | Lifted IL, LLIL, Mapped MLIL, MLIL | microcode (`minsn_t`, `mop_t`); `MMAT_GENERATED` | ESIL (`asm.esil`, `ae`) | RzIL (`aoi`, `aez`) | VEX (`pyvex.lift`, IRSB), then AIL |
| SSA | `Heritage`, `ActionHeritage`; `MULTIEQUAL`, `INDIRECT` | LLIL SSA, MLIL SSA, HLIL SSA; `HLIL_VAR_PHI` | no named SSA; use-def data flow in `MMAT_GLBOPT1` to `3` | none; ESIL is built for emulation | none; RzIL is built for emulation | `_stage_transform_to_ssa_level0` and `level1`; `SeqNodeDephication` |
| Data flow and types | `ActionDeadCode`, `ActionInferTypes`, the `Rule` pool; prototype from `.cspec` | MLIL constant propagation, variables and types; `analyzeReturns` | "Transform microcode"; `MMAT_CALLS`, `MMAT_GLBOPT`, `MMAT_LVARS`; TIL | `afv`, `afc`, `aaft`; ESIL emulation | `afv`, `afc`, `aft` | `CallingConventionAnalysis`, `VariableRecoveryFast`, `Typehoon` |
| Structuring | `CollapseStructure`; `BlockIf`, `BlockWhileDo`, `BlockSwitch`, `BlockGoto` | `HLIL_IF`, `HLIL_WHILE`, `HLIL_SWITCH`; AST at `root` | "Generate ctree"; structural analysis; goto regions | `pdc`; `pdd` (r2dec); `pdg` (r2ghidra) | `pdg` (rz-ghidra); jsdec | `RegionIdentifier`; `RecursiveStructurer` with `SAILRStructurer` |
| Emission | "Emit Final C Tokens"; `PrintC`, `ActionNameVars`, `ActionSetCasts` | HLIL rendering; Pseudo C, Pseudo Rust, Pseudo Python | "Beautify ctree; Print ctree"; `cfunc_t` | text of `pdc`, `pdd`, `pdg` | `pdg` text | `CStructuredCodeGenerator`; `codegen.text` |

### 로더

로더는 컨테이너를 분석하고 섹션들을 지도하고, 상징과 이전을 읽습니다. 이전 가능한 객체에서 아직 어떤 것도 주소가 없으므로 로더는 하나를 선택합니다.`0x08000000`, 즉`.text``0x08000040`이 섹션은 파일 오프셋에서 시작되기 때문입니다`0x40`. CLE 장소`.text``0x400000`- 지드라의`ElfLoader``0x100000`-`llvm-objdump`부문 이산화와 전혀 기반이 없습니다.

로더는 또한 이전에 대해 다르죠. Ghidra는 수입에 따라 처리하고 CLE는 적용합니다. radare2는 객체를 열 때 암시를 인쇄합니다. 이전은 적용되지 않았습니다.`bin.relocs.apply=true`로더가 이전과 함께 하는 일은 나중에 볼 수 있는 모든 것을 결정합니다.`-O0`아래 테이블을 뛰어내라

### 분해

33강습은 두 가지 방법을 모두 만들었습니다. 테이블의 모든 도구는`llvm-objdump`리큐티브 다운스를 실행하고, 함수 시작을 검색합니다. 바이너리 닌자의 문서에서는 다음과 같은 순서로 단계들을 지정하고 있습니다. 반복적 하락, 호출 목표 분석, CFG 분석은 "알 수없는 지역의 선형 분해" 및 꼬리 호출 분석입니다. 지드라는 우선순위로 분석기를 실행하고, "입국 포인트를 분산"과 "기능 시작 검색"을 일찍 합니다. IDA는 자동 분석 줄을 유지하고 있으며, 각자는 우선순위를 가지고 있으며, 라이브러리 코드를 위한 FLIRT 서명도 합니다. `CFGFast`문서는 함수의 네 가지 원천을 시작합니다. 상징, 선두 스캔, 호출 목표, 그리고 나머지 바이트의 완전한 스캔. 그 마지막 원천은 에서 함수를 발명하는 곳입니다.

### CFG 회수

각 도구는 33번 강의와 같은 블록을 자르고, 한 차이로 측정합니다.`call`, IRSB는 단일 입구, 복수 출구 블록이고, 통화도 출구이기 때문에, 기드라, 라다르2, 그리고 리진은 통화로 실행됩니다.`grade_label``-O0`, 전화하는`grade`2개 블록과 나머지 3개 보고 1개 보고서는 동일한 지침입니다.

### 기

바이너리 닌자에서는 리프트를 "저 레벨 언어에서 더 높은 것으로 간주되는 중간 언어로 번역하는 것"이라고 정의합니다. IR는 어떤 용도로 사용되었는지에 따라 다릅니다. P 코드와 VEX는 분석과 분해를 위해 만들어졌습니다. ESIL와 RzIL는 에뮬레이션을 위해 만들어졌습니다. 둘 중 어느 것도 SSA 단계가 없습니다. Hex-Rays 마이크로 코드 는 72 개의 opcode와 RISC와 비슷한 코드로 시작되며 maturity 레벨을 통과합니다.`MMAT_GENERATED` `MMAT_LVARS`. 바이너리 닌자는 리프트 IL로 이동하고, 플래그를 LLIL에서 조건으로 접하고, MLIL는 "레지스터와 메모리 액세스을 변수로 변환한다". 다음 섹션에서는 이러한 IR의 네 가지를 한 명령에 옆으로 배치합니다.

### SSA

반 에메릭의 논문에서는 SSA가 디컴파일러를 구입하는 것을 나열합니다. 표현의 증식, 매개 변수 및 ABI 가설 없이 반환 식별, 보존 분석, 희소 데이터 흐름 문제로 타입 분석, 간접 점프 및 호출의 분석. 지드라는 SSA 구조를 말합니다.`Heritage`그리고 그래프에서만 존재하는 두 개의 동작을 더합니다.`MULTIEQUAL`phi 및`INDIRECT`부작용에 대해 설명합니다. 바이너리 닌자는 모든 IL 레벨에서 SSA 형태를 노출합니다. angr에는 SSA 단계가 두 가지 있습니다.`Clinic`. 헤크스 레이스는 SSA 양식을 지정하지 않으며 글로벌 최적화 패스에서 사용- def 데이터 흐름을 수행합니다. ESIL와 RzIL는 없습니다.

### 데이터 흐름과 유형

지드라의 주요 단순화 루프는 "죽은 코드를 제거하고, "지역 유형을 전파하고, "임기 재쓰기를 수행하라"를 실행합니다. 아무것도 바뀌지 않는 한, 재쓰기는 `Rule`엑스레이는 마이크로 코드를 변환하고,`MMAT_CALLS`, 그리고 지역 변수를`MMAT_LVARS`. 앵그러 `CallingConventionAnalysis``VariableRecoveryFast`그리고`Typehoon`, 노넌, 로기노프, 코크의 다형형형 추론의 구현입니다.

### 구조화

지드라의`CollapseStructure`구조와 일치하는 하위 그래프를 검색하면 하나의 노드로 붕괴하고, 붙어있을 때 가장자리를 제거하고 구조화되지 않은 것을 표시합니다. 헤크스 레이스는 CFG를`if``while``do`그리고`switch`그루는 단일 입국 및 단일 출국 지역을 식별하고,`SAILRStructurer`기본적으로 `PhoenixStructurer`그리고`DreamStructurer`34강은 한 구조가 손으로 썼습니다.

### 배출

지드라는 C 토큰을 전송합니다`PrintC`오펜의 예쁜 프린터로`ActionNameVars`그리고`ActionSetCasts`. 헥스 레이스는 ctree를 아름답게 만들고 인쇄합니다. 바이너리 닌자는 HLIL를 Pseudo C, Pseudo Rust, 또는 Pseudo Python로 표현합니다. angr는 반환합니다.`codegen.text`. 레이더 2 발자국`pdc``pdd`또는`pdg`- 그래

## 4개의 IR에서 하나의 명령

이봐`48 83 ec 10``subq $0x10, %rsp`33강의 규칙과 함께 종이 위에 해독해

1. `48`REX가 `W = 1`오페란드는 64비트입니다.
2. `83`8 비트 직속으로 그룹-1 수학적 오프코드입니다. ModRM reg 필드는 동작을 선택합니다.
3. `ec`ModRM입니다`11 101 100`-`mod = 11`등록 서류입니다.`reg = 101` `/5`, 즉`sub`-`r/m = 100` `%rsp`- 그래
4. `10`바로 16번입니다.

4명의 승강기들이 4바이트를 받았는데, 그 장치들은 정확한 명령과 전체 텍스트를 담고 있습니다.

ESIL은 radare2 6.2.4에서 30 개의 토큰으로 이루어진 코마로 분리된 문자열입니다.

```text
16,0x8000000000000000,-,!,16,rsp,-=,63,$o,^,of,:=,63,$s,sf,:=,$z,zf,:=,$p,pf,:=,64,$b,cf,:=,4,$b,af,:=
```

그것은 스택 기계입니다.`16,rsp,-=`그 다음 각 깃발은 내부 운영체로 작성됩니다:`$o`과잉`$s`표지판`$z`0`$p`평형성`$b`빌려주세요

리진 0. 9. 1에서 RzIL는 14  함수 있는 S 표현입니다.`set`영향:

```text
(seq (set op1 (var rsp)) (set op2 (bv 64 0x10)) (set sub (- (var op1) (var op2))) (set rsp (var sub))
     (set _result (var sub)) (set pf (! (lsb (let _val (cast 8 false (var _result)) ...))))
     (set zf (is_zero (var _result))) (set sf (msb (var _result))) ... (set cf (|| ...)) (set of (|| ...)) (set af (|| ...)))
```

모든 깃발은 비트벡터에 대한 볼어 표현입니다.`let`- 그래

SLEIGH 사양에서 P 코드`x86:LE:64:default`                                          `IMARK`이 부분의 본문은

```text
CF = RSP < 0x10
OF = sborrow(RSP, 0x10)
RSP = RSP - 0x10
SF = RSP s< 0x0
ZF = RSP == 0x0
unique[58300:8] = RSP & 0xff
unique[58400:1] = popcount(unique[58300:8])
unique[58500:1] = unique[58400:1] & 0x1
PF = unique[58500:1] == 0x0
```

이적자를 등록하고`unique`깃발은 명령에 따라 계산됩니다.`CF`그리고`OF`추출이 덮어쓰기 전에 계산됩니다 `RSP`- 그래

pyvex 10.0.3에서 VEX는`IMark`이 부분의 본문은

```text
t2 = GET:I64(offset=48)
t0 = Sub64(t2,0x0000000000000010)
PUT(offset=144) = 0x0000000000000008
PUT(offset=152) = t2
PUT(offset=160) = 0x0000000000000010
PUT(offset=168) = 0x0000000000000000
PUT(offset=48) = t0
```

플래그가 나타나지 않습니다. VEX 이름은 손님 국가에서의 오프셋에 따라 등록되며, 오프셋 48은 `rsp`144~168의 보상금`cc_op``cc_dep1``cc_dep2`그리고`cc_ndep`리프트는 64비트 추수인 동작 코드 8와 두 개의 오페란드를 저장합니다.`pcode.writesFlags`사실이고`vex.computesFlags`허위기술 보고서는 왜 VEX가 네 가지 중 가장 짧은지

같은 4개의 리프터`48 63 c7``movslq %edi, %rax`, 첫 번째 명령`grade``-O1`, 5개의 ESIL 토큰을 (`32,edi,~,rax,=`), 1 RzIL `set`, 1 P 코드 동작 (`RAX = sext(EDI)`), 그리고 4 VEX 진술. 어떤 리프터도 깃발을 쓰지 않습니다. 왜냐하면 명령어가 없기 때문입니다. 지드라의 직접 명령에 대한 목록은 머리없는 스크립트를 통해 캡처되어, 동일한 동작을 인쇄합니다.`(register, 0x0, 8) INT_SEXT (register, 0x38, 4)`: 레지스터 오프셋 0은`RAX`, 이산`0x38` `RDI`, 그리고 크기는 8과 4 바이트입니다.

`83 f9 04``cmpl $0x4, %ecx`, 국경 체크인`grade`, 30개의 ESIL 토큰, 13개의 RzIL`set`효과, 10개의 P 코드 작업, 그리고 7개의 VEX`cc_op`7은 32비트 추수입니다. 아무것도 쓰지 않습니다.`%ecx`VEX에서 발견되는 두 개의 추수 너비는 32 비트에 7이고 64 비트에 8이고, 여러분이 만든 번역기는 그 테이블을 가지고 있습니다.

## 하나의 기능에 대한 네 개의 주소 기반

이 리너스가 어떤 것을 비교할 수 있기 전에 함수가 어디에 있는지에 대해 스스로 동의해야 합니다.`grade``ledger-x86_64-O1.o`- 그래

| Tool | Address of `.text` | Address of `grade` | Offset |
|---|---|---|---|
| `llvm-objdump` | `0x0` | `0x10` | `0x10 - 0x0 = 0x10` |
| radare2, rizin | `0x08000040` | `0x08000050` | `0x08000050 - 0x08000040 = 0x10` |
| angr | `0x400000` | `0x400010` | `0x400010 - 0x400000 = 0x10` |
| Ghidra | `0x100000` | `0x100010` | `0x100010 - 0x100000 = 0x10` |

상징 표는`grade``.text + 0x10`46 크기의 모든 도구가 배지를 제거하면 동의합니다. 배지가 포착마다 배지를 읽습니다.`iSj`라다르2 및 리진에서`.text`                        `.text`지드라 포착의 메모리 블록, 그리고 스캔의 경우 0입니다. 테스트`test_every_tool_places_grade_at_offset_0x10_from_its_own_base`그 사실을 바로잡고

## 도구 가 일치 하고 나뉘는 곳

에 있는 `code/main.py`이 숫자는 보고되고, 테스트는 각각의 숫자를 확인합니다.

### 계약 사건: -O1에 있는 대책

4개의 함수, 56개의 명령어, 54개의 명령어, 54개의 명령어, 2개의 명령어. 모든 도구는 동일한 명령어를 보고합니다. 9, 14, 13 및 18개의 명령어.`total`이 강의 33번은 손으로 그려진 것입니다.

유일한 차이점은 이 있습니다. 함수들 사이의 3 바이트 (`66 90`그 후`grade``90`그 후`total`) 는 스웨이프, 멈추는 이유가 없는, 그리고 Angr,`sub_40003e`그리고`sub_40005f`라다레2, 리진, 지드라는 그 중 어느 것도 주장하지 않습니다.

### 벡터화된 경우: -O2에 있는 대책

`total`4개의 그래프 제작자 중 하나하나에 10개의 블록과 13개의 가장자리에 있는 41개의 명령어입니다.

### 점프 테이블: -O0

여기 도구가 갈라지고, 갈라지는 것은 교훈입니다.

| Tool | Blocks | Edges | What the capture says |
|---|---|---|---|
| radare2 | 3 | 2 | the block at `0x62` has no successor; bytes `0x76` to `0x9a` are never reached; 8 instruction starts missing |
| rizin | 8 | 11 | the block at `0x62` carries a `switch_op` with 5 cases and 4 distinct targets |
| angr | 8 | 7 | the case blocks exist, and the transfer at `0x62` goes to an unresolvable target node |
| Ghidra | 9 | 12 | `switchD` label at `0x74` splits the block; four `COMPUTED_JUMP` flows to `0x76`, `0x7f`, `0x88`, `0x91` |

네 사람은 모두 같은 33개의 명령어를 해독했습니다.`jmp rax`그리고 36바이트를 요구하지 않고, 실종된 코드로 거슬러 올라가는 해네스 이름들을 남겼습니다. 리진과 기드라는`.rela.rodata`. Angr는 내부의 케이스 블록을 목록으로 `grade`그리고 여전히 점프 블록에서 그들을 향해 가장자리를 가지고 있지 않습니다. 그 포착은 전송을 기록 `0x62`해결되지 않는 목표 노드에 이어지고 그 해독기는 컴퓨터 `goto`. 지드라는 같은 제어 흐름에 있어서 리진보다 한 블록과 한 가장자리가 더 많기 때문에 스위치 분석은 에 을 붙였다.`jmp rax`그리고 블록 모델은 레이블에서 새로운 블록을 시작합니다.

레슨-33 그래프는 8개의 블록과 11개의 가장자리를 가지고 있었습니다. 리진은 정확히 일치합니다. 9과 11과 7과 2는 발견된 코드의 4개의 측정이 아니라는 것을 알 수 있습니다. 그것들은 하나의 간접 도약을 얼마나 멀리 따라갔는지와 절기를 선택한지에 대한 네 가지 대답입니다.

### 코드 데이터: 스파이 트랩

`lookup`테이블 4 바이트와 함께 24 바이트입니다`31 c0 90 48``0x10`. 스웨이 보고 8 명령이 그 범위에서 시작됩니다. 배너스는 대다수와 차이점을 나열합니다.`0x10``0x12`그리고`0x13`, 그리고 `0x14`- 그게 바로`addq $0x1, %rax`레슨 33에서 1바이트 일찍 라다르2, 리진, 지드라 보고서 6 시작, 2 블록, 1 가장자리, 그리고 출발 `0x10` `0x14`                                                 `lookup`그리고 발명가`sub_400010`테이블 바이트: 4 바이트 블록에서 2개의 명령어`0x14`, 두 번째 블록의`lookup`시작, 그래서 REX 바이트 `0x13`이 객체에 대한 리네스의 마지막 발견은 그래프 제작자가 해독하지 않는다는 것입니다`0x10` `0x14`, 즉 이 바이트는 함수의 내부에 위치하고 있으며 데이터입니다.

### 도구에 의해 발명되고 놓친

4개의 물체들을 통해, 배너스는 9개의 함수를 이름 붙여서, 각 함수 테이블이나 장 테이블에서 기호 없이 발명한다.`grade``-O0`. 라인형 스웨이프에서 암호가 되지 않는 9개의 범위를 지정하고 그래프 제작자가 코드로 취급하지 않는 8개의  틈과 함정 테이블을 지정합니다.

## 3개의 디컴파일러가

캡처된 도구 중 3개가 C형 텍스트를 방출합니다`grade``-O1`- 원천은`switch (score / 10)`5개의 경우로, 한계 확인과 환불 값의 테이블로 작성되었습니다.

기드라 12.1.4:

```c
uint grade(int param_1)
{
  uint uVar1;
  uint uVar2;

  uVar2 = param_1 / 10 - 6;
  uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  if (uVar2 < 5) {
    uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
  }
  return uVar1;
}
```

10.0.3의 경우:

```c
extern unsigned int g_4000b4[4];

unsigned int grade(int a0)
{
    unsigned int v1;  // ecx
    unsigned int v2;  // eax

    v1 = (unsigned int)((long long)(a0 * 1717986919) >> 0x22) + (unsigned int)(a0 * 1717986919 >> 63) - 6;
    v2 = 0;
    if (v1 <= 4)
        v2 = g_4000b4[v1];
    return v2;
}
```

6.2.4 라다르`pdc`이 부분의 본문은

```c
void sym.grade (int64_t arg1) {
    rax = edi
    rax = rax * 0x66666667
    rcx = rax
    rcx >>= 0x22
    rax >>>= 0x3f
    ecx += eax
    ecx += 0xfffffffa
    eax = 0
    v = ecx - 4
    if (((unsigned) v) <= 0) {
        eax = ecx
        rcx = rip
        eax = dword [rcx + rax*4]
    }
    return
}
```

3을 파이프라인에 반해서 읽어보세요. 지드라의 용어 재쓰는 것은 곱셈을 곱하기`0x66666667`그리고 34으로 다시 `param_1 / 10`, 즉, 34강의 어휘입니다. Angr은 같은 바이트를 들어와`a0 * 1717986919 >> 0x22`. 라다르2`pdc`ESIL 에뮬레이션 + 사이드 문법: 레지스터 이름, 변수, 유형이 없습니다, 그리고 경계 체크는 `<= 0`기드라는 테이블의 부하를 입력했습니다.`DAT_001000b4`; 발령`g_4000b4[4]`기드라나 아랑은 사건의 수를 복구하지 못했는데,`-O1`바이트에 스위치가 없습니다`-O0`, 스프링 테이블이 있는 곳, 기드라 인쇄`switch(param_1 / 10)`6~10의 경우, 기본값과`goto`- 그래

리진은 자체적으로 디컴파일러를 가지고 있지요`pdc`이 강의에서 얻을 수 없는 두 가지 결과물인

## 건설 해

디모를 실행하세요:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
```

출력은 하나의 JSON 보고서입니다. 촬영 당시 기록된 도구 버전과 기계에 있는 도구로 열립니다. 다음으로 네 개 개 개체마다 상징의 확장,  틈, 각 도구가 사용하는 기틀, 함수는 발견되거나 발명된 모든 도구를 시작하며, 각 기능에 대한 명령-처리 협정, 블록 카운트, 가장자리 카운트, 그리고 각 도구가 부족한 가장자리. 그것은 도구마다 바이트 회계, 도구 자체의 메모, 단순한 문장으로 발견된 결과 목록, IR 섹션으로 끝납니다. 캡처 된 엘리베이터에서 측정된 세 가지 계산과 함께 번역자의 출력.

예상형:

```json
{
  "captureTools": {"llvm-objdump": "Apple LLVM version 17.0.0", "radare2": "radare2 6.2.4 ...", "rizin": "rizin 0.9.1 ...", "angr": "10.0.3", "ghidra": "12.1.4"},
  "localTools": {"radare2": "absent", "...": "..."},
  "fixtures": {
    "ledger-x86_64-O0.o": {
      "bases": {"llvm-objdump": "0x0", "radare2": "0x8000040", "angr": "0x400000", "ghidra": "0x100000", "...": "..."},
      "functions": {"grade": {"blocks": {"radare2": 3, "rizin": 8, "angr": 8, "ghidra": 9}, "edges": {"radare2": 2, "rizin": 11, "angr": 7, "ghidra": 12}, "...": "..."}},
      "findings": ["radare2 never reaches bytes 0x76-0x9a inside grade that the other graph builders decode", "..."]
    }
  },
  "ir": {"translator": [{"text": "subq $0x10, %rsp", "flags": {"pcodeLike": "eager", "vexLike": "thunk"}, "...": "..."}], "observed": {"...": "..."}}
}
```

읽으세요`code/main.py`이 순서로:

1. `read_text_symbols()`섹션 헤더와 `STT_FUNC``.text`상징 테이블은 배지판의 유일한 기본 진실이고`TextSection.gaps()`이 을 채우면
2. `parse_objdump()``parse_r2_family()``parse_angr()`그리고`parse_ghidra()`각 포획을 `ToolView`: 기본, 길이를 오프셋하는 지침, 그리고 1 `FunctionView`블록, 가장자리, 그리고 모든 분해된 텍스트를 가진 함수마다.
3. `majority()`그리고`ranges()`두 대의 대조는 서로 다른 대조를 할 수 있느뇨
4. `function_report()`그래프 제작자의 대부분과 명령 시작을 비교하고, 블록 카운트, 엣지 세트를 비교하고, 각각의 도구가 부족한 것을 나열합니다.
5. `byte_report()`모든 바이트를 상징 안에 있는 코드로 기록하고, 을 채우거나, 주장하지 않고, 발명하거나 놓친 것으로, 그리고 어떤 그래프 제작자도 암호를 해독하지 않는 상징 안에 있는 바이트를 이름 붙인다.
6. `findings()`문장을 만들죠.`compare()`개체마다 한 보고서를 작성합니다.
7. `decode_small()``to_pcode_like()`그리고`to_vex_like()`번역가입니다. 레지스터 형태로 3개의 코딩, 열망한 스타일, 톤 스타일.
8. `observed_ir()`잡힌 엘리베이터를 측정하고,`figure_data()`시간표, 스테이지 테이블, 그리고 그림에서 보여지는 증거들을 집계합니다.

3개의 명령이 더 있습니다.`python3 code/main.py compare FIXTURE.o`한 개체의 보고서를 인쇄합니다.`python3 code/main.py ir 4883ec10`번역자의 두 개의 양식을 한 가지 명령에 인쇄합니다. `python3 code/main.py figure-data`그림에 삽입된 데이터를 인쇄합니다.

포획은 한 번 해냈어요`code/fixtures/capture_tools.py`, 모든 명령과 버전을 기록하는`captures.json`. 나 테스트는 도구가 시작되지 않습니다. 도구가 있다면, 파일을 새로워지기 위해 캡처 스크립트를 실행하고, 필요한 환경에 대한 README 고정기를 읽으십시오.

## 사용 하 고

이 순서대로 새로운 물체에 배지를 사용하세요.

1. 객체를 직접 만들어 컴파일러 명령어를 유지하세요. 어떤 도구를 열기 전에 그 상징 표를 읽어보세요. 그래서 몇 개의 기능이 있고 이 어디에 있는지 알 수 있습니다.
2. 헤드리스 모드에서 한 번 각 도구를 캡처하세요. 원본 출력 및 정확한 명령어를 객체 옆에 저장하세요. 다시 읽을 수 없는 의견 충돌은 발견이 아닙니다.
3. 기본을 확인하고 함수를 선택하고 모든 도구가 그 함수를 빼면 같은 오프셋에 배치하는지 확인합니다`.text`만약 그렇지 않다면, 멈추고 그 도구가 무엇을 로드했는지 알아보세요.
4. 비교 명령이 먼저 시작됩니다. 그래프 제작자가 여기에 동의하지 않는다면, 나머지 비교는 분석이 아니라 디코딩에 관한 것입니다.
5. 블록과 가장자리를 비교하고, 계산을 판단하기 전에 각 도구의 메모를 읽어보십시오.`switch_op`, a `COMPUTED_JUMP`, 또는 해결되지 않는 목표 노드가 대부분의 차이를 설명합니다.
6. 바이트를 계산합니다. 도구가 주장하는 바이트는 작업 중인 유리스틱입니다. 도구가 떠나는 상징 바이트는 중지 된 걸음입니다. 그래프 제작자가 주장하지 않는 상징 바이트는 데이터입니다.
7. 어떤 도구 를 실행 하지 않았는지 적어 보십시오. 문서 에서 설명 하는 것 은 유용 하며, 캡처 에 비해 다른 증거 이다.

## 인터랙티브 연구소

### 연구소 A: 하나의 함수, 네 개의 기초

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape/code
python3 -q
```

실행:

```python
from main import *
views = load_views("ledger-x86_64-O1.o")
{tool: hex(view.base) for tool, view in views.items()}
{tool: hex(view.functions["grade"].start + view.base) for tool, view in views.items()}
```

두 번째 줄을 실행하기 전에 네 개의 원자 주소를 적어내고 이 수업의 테이블에 반해서 확인하고`grade``grade_label`그리고 그 기드라에 있는 곳을 손으로 계산해 보세요.

### B 실험실: 4편에서 점프 테이블

```python
report = compare("ledger-x86_64-O0.o")
report["functions"]["grade"]["blocks"]
report["functions"]["grade"]["edgesMissingPerTool"]["radare2"]
report["notes"]["rizin"]
report["notes"]["ghidra"]
report["bytes"]["radare2"]["misses"]
```

라다르 2의 가장자리를 계산하고 각 라인과 일치합니다`-O0`33강의 목록. 그 다음, 기드라 메모를 읽고`switchD`지드라 포착에 있는 라벨

### 연구소 C: 덩어리에 대한 열망의 깃발

```python
translate("48 83 ec 10")["pcodeLike"]
translate("48 83 ec 10")["vexLike"]
translate("83 f9 04")["vexLike"]
{row["name"]: (row["pcode"]["ops"], row["vex"]["statements"]) for row in observed_ir()["instructions"]}
```

`cc_op`두 출력에서 항상성을 가지고, 하나는 8이고 다른 하나는 7이 되는 이유를 설명해 주세요.`translate("48 01 c8")`그리고 읽으세요`TranslateError`- 그래

### 연구소 D: 5개의 도구 아래의 함정이

```python
report = compare("sweep-trap.o")
report["functions"]["lookup"]["instructionStarts"]
report["bytes"]["dataInsideSymbols"]
report["functionStarts"]["angr"]
```

바이트를 해독`31 c0 90 48 83 c0 01`종이 위에 이 이 이 이 이 이 이 이 이 이 이 이 이`jmp`두 개의 목록과 추가와 일치하면 실종 보고가 시작됩니다.

## 연습 실험실

다섯 번째 포착을 추가하고 배지를 확장하십시오.

요구 사항:

- 이 수업에서 발견되지 않은 도구 중 하나를 선택하여 컴퓨터에서 실행할 수 있습니다: GNU`objdump`, Capstone와 LIEF, 손으로 수출되는 바이너리 닌자 무료 세션, 또는 다른 분석기 세트와 함께 Ghidra.`captures.json`- 그래
- 포착을 으로 바꾸는 1개의 분석기를 작성하세요`ToolView`도구의 기초, 명령어, 기능, 도구가 가지고 있는 블록과 가장자리
-  도구 를 추가`TOOLS`그리고 그래프를 만들면`DESCENT_TOOLS`데모를 실행하고 대다수 세트에서 변경된 내용을 읽어보세요.
- 도구의 블록이 계산되는 것을 확인하는 테스트를 작성하십시오.`ledger-x86_64-O1.o`그리고 그 실험은 그 함정 테이블에 대해 무엇을 하는지 확인합니다.
- 도구 자체의 말대로 로더, 디스몬더, CFG라고 부르는 수업에 한 абзац을 적어 주세요.

성공이란`python3 code/main.py`새로운 도구에 대한 보고서를 `captureTools`, 모든 함수`ledger-x86_64-O1.o`계속 `allDescentToolsAgree`사실, 그리고 연구결과`sweep-trap.o`새로운 도구가 바이트를 어떻게 했는지 말해주세요`0x10` `0x14`- 그래

## 교훈 유물

이 교훈은`outputs/skill-the-reverse-engineering-landscape.md`. 당신이 만든 하나의 객체에서 여러 도구를 실행하고, 그들의 주소를 하나의 기본으로 줄이고, 명령어 시작, 블록, 가장자리에 동의하는 각각의 함수를 보고하고, 도구가 발명하거나 놓친 바이트를 사용하십시오. 기록된 명령어 및 버전으로 캡처, 파일에서 읽은 상징 테이블, 문서에서 설명 된 도구의 설명이 필요합니다.

## 확인 해 보

데모와 결정적 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

검증은 다음과 같은 사실을 증명해야 합니다.

- ELF 리더는 4개의 함수 기호를 찾습니다.`ledger-x86_64-O1.o`크기가 16, 46, 31 및 63이며 두 개의  구멍이 있습니다
- 스파이 포획은 4 개 개체에 대한 명령어 86, 56, 84 및 11을 포함합니다
- 라다레2와 리진은 동일한 명령어, 블록 및 가장자리를 `ledger-x86_64-O1.o`, 그리고 오직 레이더2만이`pdc`텍스트
- `sub_40003e`그리고`sub_40005f`기호가 없는 함수
- 지드라의 블록`total`강의 33의 5개 블록이 있고, 그 호출 흐름은 그래프 가장자리가 아닙니다.
- 모든 도구 장소`grade`이산화`0x10`그 기둥이 제거된 후
- 모든 도구는 모든 명령에 동의합니다`ledger-x86_64-O1.o`
- 네 개의 그래프 제작자는 동일한 가장자리 집합을 가진 3, 3, 5, 4 블록과 2, 3, 5, 4 가장자리를 보고합니다.
- `total``-O2`그래프 제작자마다 10개의 블록과 13개의 가장자리가 있습니다
- `grade``-O0`3, 8, 8 및 9 블록과 2, 11, 7 및 12 가장자리가 있으며, 각 도구의 메모에 그 이유를 표시하고 있습니다.
- `grade_label``-O0`모든 곳에 한 블록을 가지고 있습니다. Angr를 제외하고는,
- angr는 매핑 격차당 하나의 함수를 더해 함정에 있는 하나의 함수를 발명하고 다른 도구는 함수를 발명하거나 놓치지 않습니다
- 이 득이 시작됩니다`0x10``0x12``0x13`그리고 잃는`0x14`함정에 갇혀 있고 그래프 제작자가 해독하지 않습니다`0x10` `0x14`
- 연구 결과는 radare2에서 놓친 범위를 이름하고,
- 매니프스트는 모든 21개의 캡처 파일의 버전과 명령을 기록합니다
- 3개의 도구를 정리해 놓습니다`grade`, 그리고 오직 지드라만이 분단 모호를 접한다
- 번역자는 CF, OF, SF, ZF, PF를 한 스타일과 `cc_op`다른 쪽에 은, 등록을 작성하지 않습니다`cmp`, 그리고 깃발도 없습니다`movslq`
- 번역자는 메모리 양식, 다른 오코드, 추가 REX 비트 및 잘못된 길이를 거부합니다.
- 번역자의`cc_op`8번과 7번은 캡처된 VEX의 숫자와 같습니다
- 캡처된 엘리베이터는 세 가지 지침에 대한 9, 1, 10 P 코드 동작 및 7, 4, 7 VEX 문서를 제공합니다.
- 시선은 1973년부터 2026년까지 순서대로 진행되며, 파이프라인은 8단계와 6개의 도구가 있으며, 각각의 세포에 단어가 있습니다.
- 상호작용적인 그림은 배너스가 생성하는 동일한 데이터를 삽입합니다.

## 생산 실패 모드

| Failure | What the weak report says | What the harness must prove |
|---|---|---|
| Raw addresses from different tools | "the tools disagree about where grade is" | one offset after each base is removed, checked on one function |
| Block count as a measure of code found | "Ghidra found the most code" | the same instruction starts, with the extra block explained by a label |
| One tool as the oracle | "objdump shows the table bytes are instructions" | the sweep is a linear sweep; three graph builders leave the bytes unclaimed |
| Padding functions counted as discoveries | "angr found seven more functions" | every one sits in a padding gap or on data, and none has a symbol |
| A stopped walk reported as dead code | "the four case blocks are unreachable" | 36 bytes missed by one tool and reached by three |
| Edge counts compared without the notes | "rizin and Ghidra disagree on grade" | the same four computed targets, one extra split at a label |
| A decompiler's arithmetic read as the program | "the function multiplies by 1717986919" | the idiom from lesson 34, folded by one tool and left by another |
| A closed tool described as if run | "Binary Ninja reports five blocks" | the figure and the table mark it as documentation only |
| Captures without commands | "we ran radare2" | the manifest with version, command, and date for every file |
| An IR with no flags read as a lossy lift | "VEX dropped the flags" | the thunk in `cc_op`, `cc_dep1`, `cc_dep2`, evaluated at the branch |

## 운영 규칙

명령어 및 버전으로 모든 도구를 한 번 캡처하고 모든 주소를 하나의 기본으로 줄이고 블록과 가장자리 전에 블록을 시작하여 명령어를 비교하십시오. 주장, , 데이터 또는 놓친 바이트를 모두 계산하십시오. 도구의 숫자를 판단하기 전에 도구의 자신의 메모를 읽어보고 어떤 도구에 대해만 읽는지 확인하십시오.

## 더 많은 읽기

- [Cifuentes, "Reverse Compilation Techniques", PhD thesis, QUT (1994)](https://eprints.qut.edu.au/36820/)
- [Cifuentes and Gough, "Decompilation of Binary Programs", Software: Practice and Experience (1995)](https://doi.org/10.1002/spe.4380250706)
- [Van Emmerik, "Static Single Assignment for Decompilation", PhD thesis, University of Queensland (2007)](https://espace.library.uq.edu.au/view/UQ:158682)
- [Schwartz, Lee, Woo, Brumley, "Native x86 Decompilation Using Semantics-Preserving Structural Analysis and Iterative Control-Flow Structuring" (USENIX Security 2013)](https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/schwartz)
- [Yakdan et al., "No More Gotos" (NDSS 2015)](https://www.ndss-symposium.org/ndss2015/ndss-2015-programme/no-more-gotos-decompilation-using-pattern-independent-control-flow-structuring-and-semantics/)
- [Basque et al., "Ahoy SAILR! There is No Need to DREAM of C" (USENIX Security 2024)](https://www.usenix.org/conference/usenixsecurity24/presentation/basque)
- [Andriesse et al., "An In-Depth Analysis of Disassembly on Full-Scale x86/x64 Binaries" (USENIX Security 2016)](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)
- [Flake, "Structural Comparison of Executable Objects" (DIMVA 2004)](https://dl.gi.de/items/7f573931-cb51-49ef-a12c-0452a9fb0ea4)
- [Maranzano and Bourne, "A Tutorial Introduction to ADB", Bell Labs (1977)](http://squoze.net/UNIX/v7/files/doc/18_adb.pdf)
- [Stallman, KTH lecture on GDB entering distribution (30 October 1986)](https://www.gnu.org/philosophy/stallman-kth.html)
- [Hex-Rays, "IDA: celebrating 30 years of binary analysis innovation"](https://hex-rays.com/blog/ida-celebrating-30-years-of-binary-analysis-innovation)
- [Guilfanov, "Decompiler internals: microcode", Recon Brussels 2018 (slides)](https://www.recon.cx/2018/brussels/resources/slides/RECON-BRX-2018-Decompiler-internals-microcode.pdf)
- [Hex-Rays, microcode view and maturity levels](https://docs.hex-rays.com/core/decompiler/how-tos/microcode-view)
- [Hex-Rays, IDA 9.4 release notes](https://docs.hex-rays.com/release-notes/9_4)
- [Hex-Rays, IDA Free](https://hex-rays.com/ida-free)
- [Ghidra releases (12.1.4)](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Ghidra P-code reference](https://github.com/NationalSecurityAgency/ghidra/blob/master/GhidraDocs/languages/html/pcoderef.html)
- [Ghidra decompiler source, main work flow and Action classes](https://github.com/NationalSecurityAgency/ghidra/tree/master/Ghidra/Features/Decompiler/src/decompile/cpp)
- [Ghidra analyzeHeadless README](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/RuntimeScripts/support/analyzeHeadlessREADME.md)
- [Binary Ninja, BNIL overview](https://docs.binary.ninja/dev/bnil-overview.html)
- [Binary Ninja, "Architecture Agnostic Function Detection in Binaries" (2017)](https://binary.ninja/2017/11/06/architecture-agnostic-function-detection-in-binaries.html)
- [Binary Ninja, batch processing and headless licences](https://docs.binary.ninja/dev/batch.html)
- [Binary Ninja 6.0 "Krypton" release post](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)
- [Binary Ninja Free](https://binary.ninja/free/)
- [radare2 book, ESIL](https://book.rada.re/emulation/esil.html)
- [radare2 book, decompilers](https://book.rada.re/arch/decompile.html)
- [radare2 releases (6.2.4)](https://github.com/radareorg/radare2/releases)
- [rizin, RzIL design notes](https://github.com/rizinorg/rizin/blob/dev/doc/rzil.md)
- [rizin releases (0.9.1)](https://github.com/rizinorg/rizin/releases)
- [Announcing Rizin (8 December 2020)](https://rizin.re/posts/announcing-rizin/)
- [Cutter releases (2.5.0)](https://github.com/rizinorg/cutter/releases)
- [angr documentation, CFG recovery](https://docs.angr.io/en/latest/analyses/cfg.html)
- [angr documentation, the decompiler and its analysis passes](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [angr documentation, intermediate representation (VEX)](https://docs.angr.io/en/latest/advanced-topics/ir.html)
- [angr on PyPI (10.0.3)](https://pypi.org/project/angr/)
- [pypcode on PyPI](https://pypi.org/project/pypcode/)
- [llvm-objdump command guide](https://llvm.org/docs/CommandGuide/llvm-objdump.html)
- [GNU objdump manual](https://sourceware.org/binutils/docs/binutils/objdump.html)
- [LIEF documentation](https://lief.re/doc/stable/index.html)
- [Capstone releases](https://github.com/capstone-engine/capstone/releases)
- [BinDiff releases (v8, open source)](https://github.com/google/bindiff/releases/tag/v8)
- [Diaphora](https://github.com/joxeankoret/diaphora)
- [Hopper Disassembler downloads](https://www.hopperapp.com/download.html)
- [Compiler Explorer](https://github.com/compiler-explorer/compiler-explorer)
- [LLDB announced as an LLVM subproject (2010)](https://blog.llvm.org/2010/06/new-lldb-debugger.html)
- [Boomerang decompiler](https://boomerang.sourceforge.net/)
- [Tan et al., "LLM4Decompile" (EMNLP 2024)](https://aclanthology.org/2024.emnlp-main.203/)
- [Gao et al., "DecompileBench" (Findings of ACL 2025)](https://aclanthology.org/2025.findings-acl.1194/)
- [Liu, Raff, Micinski, "When LLM Decompilers Recompile More and Preserve Less" (2026)](https://arxiv.org/abs/2609.05370)
