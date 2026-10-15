# 재구성 및 동일성 증명: 차이 테스트, 바이트 비교 및 증거 루프

> 테스트를 통과하면 테스트에 동의를 증명할 수 있습니다. 그래서 평등은 모든 가장자리에 도달하고 이 부분을 매칭하는 자이트를 필요로 합니다.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 34 (lifting to pseudocode), Phase 13 · 35 (evidence, confidence, and unknowns)
**Time:** ~110 minutes

## 학습 목표

- 명령 목록에서 재건을 작성하고 그 증거 기록에서 왔던 증거를 명명하십시오.
- 위험 하나씩 한 클래스를 가진 입력 그리드를 구축하세요: 0 보호, 부정적인 값, 줄이는 분할, 32비트 overflow, 그리고 분할 함정.
- 원본과 재건을 하나의 프로그램으로 실행하고 함정을 포함한 모든 세포를 기록하세요.
- 원래 플래그와 재구성된 것을 다시 컴파일하고 이전 필드를 마스크한 후 함수 바이트를 비교하십시오.
- 이 위치에서 표시되는 상수를 읽어보고 비교해 보세요. 그래서 잘못된 문자 그대로가 통과할 수 없습니다.
- 작은 스튜디오 클라이언트에서 Rea의 MCP 서버를 구동하고 모든 단계를 증거 아이디로 기록하세요.
- 허공된 증거 기록을 만들어서 그 신원은 주장과 증거 링크를 어 놓은 것입니다.

## 문제

의 기능 사서 를 요청했군요`percent_change`우리들`ledger-x86_64-O1.o`기드라 12.1.4은 사이드코드를 반환했고, 에이전트는 이 C를 작성했습니다.

```c
int percent_change(int before, int after) {
    if (before == 0) return 0;
    return (int)(((long)after - before) * 100 / before);
}
```

4개의 시험이 통과됩니다.`(100, 150)`50이 됩니다.`(200, 100)`-50을 내면 됩니다.`(0, 5)`0을 내다`(50, 100)`100번으로 줄게 되는데, 에이전트도 다시 만들어졌어요`grade`4번`if`90번, 80번, 70번, 60번의 진술에 따르면 6번의 시험이 통과됐습니다.

이 보고서에서는 다음 질문들 중 어느 하나에 대해서도 답이 없습니다.

- 원래가 언제 돌아오는가?`(after - before) * 100`32비트 안에 들어가지 않는가?
- 원래의 점수는 110이면 얼마일까요?
- 재건은 원래와 같은 16바이트로 컴파일합니까?
- 두 개의 컴파일된 함수가 동일한 바이트를 가지고 있을 때, 그들의 이전은 동일한 상수점을 가리키는가?
- 어떤 증거 기록에서 재건이 나왔고, 에이전트가 목록이나 사이비코드를 읽었나요?
- C 컴파일러 없이 호스트에서 증명의 상태는 무엇입니까?

이 수업의 모든 목표가 우리가 작성하고 컴파일한 프로그램입니다. 32 수업의 범위와 법률 규칙은 변하지 않고 적용됩니다.

```figure
re-36-prove-equal
```

## 증거 는 무엇 을 알려 주는가

에이전트 루프`code/main.py`6번의 리아 6.5.0에 전화를 걸었습니다.`code/fixtures/runs/agent-run.json`서버가 응답했어요`initialize`프로토콜 버전으로`2025-11-25`3번의 전화로 증거 기록이 돌아왔습니다

| Step | Tool | Time | Evidence id |
|---|---|---|---|
| 2 | `analyze_function percent_change` | 6.31 s | `ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd` |
| 3 | `analyze_function grade` | 0.02 s | `ev_67b6d3f992eaf49a2e16de084b6ebfdd9884e8c5c7f75e175b7bb20f4f748ce1` |
| 4 | `read_bytes 0x1000b4, 20` | 0.00 s | `ev_c26146cfedf4c1ee146d8ff00cfa9a5d3f5335bdd9c97ccf4e1af5f6ea3ed6bc` |

첫 번째 전화는 기드라 수입과 자동 분석에 대한 지불입니다.`confidence: "observed"``authority: "shipped-artifact"`, 그리고 물체의 SHA-256`9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f`. 지드라는 이동 가능한 물체를 `.text``0x100000`그래서`percent_change``0x100000`그리고`grade``0x100010`- 그래

`percent_change`이 `long`다음 각 호의 경우

```c
undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)
{
  long lVar1;
  undefined1 auVar3 [16];
  if (param_1 != 0) {
    lVar1 = (long)((param_2 - param_1) * 100);
    auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
    auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
    return auVar3;
  }
  ...
}
```

디컴파일러는 봤어`cltd`그리고`idivl`둘 다 써라`edx`그리고`eax`그리고 16바이트의 반환 값을 64비트 분수로 모델링했습니다. 같은 기록에 있는 목록은 좀 더 명확하게 말합니다.

```
0x100000: TEST EDI, EDI
0x100002: JZ 0x0010000d
0x100004: SUB ESI, EDI
0x100006: IMUL EAX, ESI, 0x64
0x100009: CDQ
0x10000a: IDIV EDI
0x10000c: RET
0x10000d: XOR EAX, EAX
0x10000f: RET
```

모든 작업은 32비트 너비입니다.`IMUL EAX, ESI, 0x64`32 비트로 곱하고 절반을 낮게 유지합니다.`CDQ`신호 확장`eax``edx`그리고`IDIV EDI`64 비트 쌍을 32 비트 분수로 나눈다. 목록에 따라 재구성하는 것은`100 * (after - before) / before``int`- 그래

`grade`이 표의 이름은`*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)`, 그리고 `0x66666667`이 목록은 10으로 나뉘는 것을 보여줍니다`IMUL RAX, RAX, 0x66666667``SAR RCX, 0x22``SHR RAX, 0x3f``ADD ECX, EAX`- 그럼`ADD ECX, -0x6``CMP ECX, 0x4`그리고`JA`6에서 10까지 10개씩 유지하세요.`XOR EAX, EAX`비교하기 전에 기본값은 0입니다.`LEA RCX, [0x1000b4]`그리고`MOV EAX, dword ptr [RCX + RAX*0x4]`4바이트의 5개의 항목을 가지고 있는 테이블을 읽어보세요.

4단계: 20바이트를 읽어보세요`01000000 02000000 03000000 04000000 04000000`테이블은`1, 2, 3, 4, 4`10은 6, 7, 8, 9, 10입니다.`switch``ledger.c`,`case 10`그리고`case 9`4 값을 나눌 수 있습니다.

레아의 자신의 증거 페이지에 있는 두 증거 모두 목록에서 시작되었고`read_bytes`DX-Ball의 첫 번째 사이보코드는`FUN_00406400(void)`스택 입력 없이, 명령어 뷰에서 수정되었습니다. 먼저 목록을 읽어보십시오. 기록 ID를 인용하고, 다음 C를 작성하십시오.

## 후보자 를 적어

폴더`code/fixtures/candidates/`8개의 재건이 있습니다. 파일마다 하나의 함수입니다. 4개의 목록에 따라 또는 같은 코드로 컴파일합니다. 4개의 것은 믿을 수 있고 잘못된 것, 또는 한 손으로 작성된 테스트에서 발견되는 방식으로 잘못된 것 입니다.

| File | Source | What it does |
|---|---|---|
| `percent_change_mul_first.c` | `100 * (after - before) / before` | the listing in C |
| `percent_change_split.c` | `(after * 100 - before * 100) / before` | different text, same bytes after clang folds it |
| `percent_change_wide.c` | `(int)(((long)after - before) * 100 / before)` | the pseudocode's `long`, divides before it wraps |
| `percent_change_div_first.c` | `(after - before) / before * 100` | divides first, so rounding differs |
| `grade_switch.c` | `switch (score / 10)` with the five cases | the original source |
| `grade_table.c` | `unsigned slot = score / 10 - 6; slot < 5 ? points[slot] : 0` | the listing in C |
| `grade_thresholds.c` | `if (score >= 90) return 4; ...` | no upper bound on the top band |
| `grade_case10_wrong.c` | `case 10: return 3;` | one table entry wrong |

각 파일은 고정 명령으로 컴파일됩니다.`clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c`컴파일된 객체는 소스 옆에 배치되어 있어서 테스트는 클랜 없이 호스트에서 실행됩니다.

## 1번째 다리: 실행하고 비교

맥키먼의 1998년 정의의 차별적 테스트는 "두 개 이상의 비교 가능한 시스템"을 "기기적으로 생성된 테스트 케이스"로 먹여 다른 결과, 기 또는 충돌을 버그 후보로 취급합니다. 그는 어려운 부분을 이렇게 부릅니다. "시험에서 가장 끔찍한 문제는 시험 결과를 평가하는 것입니다". 올바른 답을 알아야 할 필요는 없습니다. 우리는 원래와 재건이 모든 위험을 달성하는 격자에서 어디에도 동의하지 않는 데 필요합니다.

### 그릴 설계

`input_grid()``code/main.py`92개의 세포를 만들어 냅니다.`percent_change`10개에서 10개씩씩씩`before`값과 7`after`값:

```
before: 0, 1, -1, 3, -3, 7, 100, -100, 2147483647, -2147483648
after:  0, 5, -5, 105, 536870911, 2147483647, -2147483648
```

`grade`이 점수는 22점입니다. 각 밴드 가장자리의 양쪽, 음점, 0, 110, 그리고 두 `int`제한이 있습니다.`classify()`각 세포를 표시합니다. 오버플로우는 32개의 세포를 가지고 있습니다. 음수 17, 경계 14, 평정 12, 그리고 0 보호 7. 음수 단축은 5, 회전 2, 스위치 2를 넘어, 함정 1.

각 클래스는 하나의 이유 때문에 존재합니다.`TEST EDI, EDI`분할을 확인하는 음성 세포: C 및 `idiv`0으로 돌고, 그래서`-9 / 10`0이고`-10 / 10`분배 전에 곱하는 것을 확인합니다`(105 - 100) * 100 / 100`5이 아니라 0이 됩니다.`(after - before) * 100`32 비트 이상으로 한 개의 함정 셀로 포장 된 제품이 동일합니다`INT_MIN``before`-1과 같죠

양, 첸, 이이드, 레거는 Csmith을 개발하여 정의되지 않은 행동 없이 프로그램을 생성했습니다. 정의되지 않은 행동에 대한 오라클의 의견이 붐이고 결코 버그 보고는 아닙니다. 서명 된 과잉은 C에서 정의되지 않습니다. 우리의 오라클은 한 고정된 행동으로 구성된 객체입니다. 따라서 과잉 셀은 범위에 있습니다. 교훈은 어떤 세포가 표준에 의존하고 어떤 세포가 컴파일된 바이트에 의존하는지 아는 것입니다.

### 운전자와 함정이

`code/driver.c`stdin에서 각 라인마다 한 셀을 읽고 입력, 원본 결과 및 재건 결과를 인쇄합니다. `build_harness()``-Dpercent_change=cand_percent_change -Dgrade=cand_grade`x86-64 리눅스 호스트에서 원래는 고정 객체 자체입니다. 다른 호스트에서는`ledger.c`본래 작성된 보고서 및 보고서 기록`original_kind: fixture-source`- 그래

운전자는 `SIGFPE``sigsetjmp`그리고`siglongjmp`- `before = -1`그리고`after = 536870911`, 차이점은 536870912이고 32비트 제품 팩은 -2147483648로 됩니다.`idiv`이 분배와 -1의 분배자가 함수에서 분배 오류 예외를 증가시킵니다. 분수는 32 비트에 맞지 않습니다 (Intel SDM 볼륨 2, IDIV). 핸들러는 그 값을 기록된 값으로 변환합니다.`trap`- 그래

AArch64에`sdiv`- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

### 결과

`prove_behaviour(PLAUSIBLE)``long`10개의 순수한 사례가 지나고 28개의 세포에 대한 네트워크가 실패합니다.

| Function | Inputs | Class | Original | Rebuild |
|---|---|---|---|---|
| `percent_change` | 3, 2147483647 | overflow | -133 | -1431655899 |
| `percent_change` | 100, 2147483647 | overflow | -101 | 2147483547 |
| `percent_change` | 2147483647, 5 | overflow | 0 | -99 |
| `grade` | 110 | beyond the switch | 0 | 4 |
| `grade` | 2147483647 | beyond the switch | 0 | 4 |

모두 26`percent_change`                      `|before| > 1`- `before`1 또는 -1에 해당하는 64비트 분수는 포장된 값으로 다시 줄여서, 따라서 이 세포들은 우연히 일치합니다.`grade`오리지널 스위치가 11개 이상 10개에 대해 근거가 없기 때문에 실패하고`110 / 10`11이 됩니다.

`prove_behaviour(EQUAL)`건설합니다`percent_change_mul_first.c`그리고`grade_switch.c`92개의 세포 모두 동의합니다`percent_change_div_first.c`네 가지 순진한 사례 중 두 가지가 실패합니다. 이것은 손으로 작성된 시험에서 발견되는 유일한 사례입니다.

`oracle_disagreements()`두 번째 점도 확인해 보세요.`percent_change_model()`그리고`grade_model()`목록의 파이썬 모델입니다.`wrap32()`32비트 곱하기`idiv32()`아키텍처 규칙에 대한 보고서는 모델을 각 세포에서 관찰된 원본과 비교합니다. 제로 불일치는 모든 세포에 대한 모델과 바이너리 동의를 의미합니다. 모델은 파생된 증거이며 실행은 관찰된 증거입니다. 보고서는 그들을 별도의 필드에서 유지합니다.

## 2번째 다리: 다시 집어넣고 비교

그릴에서의 행동은 한 발입니다. 두 번째 발은 동일한 컴파일러와 플래그로 컴파일된 재건이 동일한 바이트를 생성하는지 여부를 묻습니다. DX-Ball 프로젝트는 보조자에게 "63 개의 일치하는 바이트"를 보고했습니다. TH04 프로젝트는 2,139 바이트의 일치를 보고했습니다. 각각 자신의 시대의 컴파일러를 사용했습니다. rea 자체는 이것을 할 수 없습니다.`compare_functions`라인 디프스 제공자 텍스트 및 제한을 첨부합니다 "집합은 불투명한 제공자 텍스트; 이전 정상화는 사용할 수 없습니다".

### 객체를 읽어 보세요

`ElfObject``code/main.py`                            `struct.unpack_from`마법, 64비트 클래스, 작은 엔디안 데이터를 확인합니다`e_machine`62, 그리고`e_type`1.. 그러면 섹션 헤더, 문자열 테이블을 `.symtab`그리고 모든`.rela`부문. `percent_change`시작됩니다`.text`크기가 16인 0을 이산하고`grade``0x10`46 크기로`total`시작됩니다`0x40`크기가 31이고`grade_label``0x60`63장 크기로

16 바이트의`percent_change``85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`- 기능이 이전되지 않습니다.`grade`1개: 오프셋`0x26`함수 내부, 타입`R_X86_64_PC32`, 상징`.rodata`, 추가`0x10`7바이트에 속해있어요`leaq`이산화`0x23`, 마지막 4바이트는 이동 현장입니다.

### 마스크, 그리고 기록을 비교

RELA 객체에서 추가는 이전 기록에 살고 있으며 네 개의 필드 바이트는 0입니다.`grade_switch.o`이 두 이동은 다른 장소의 이름을 붙이는 동안 평정 바이트 비교가 통과합니다. `mask_relocations()`어쨌든 양쪽 모두에서 필드를 제로로 설정해 두면 REL 객체와 Mach-O에 대해 동일한 방법이 적용됩니다.

그럼`prove_bytes()`이 지역 이전 기록은 오프셋, 타입, 목표 섹션에 따라 비교됩니다. 원본은`.rodata+0x10`그리고 후보자는`.rodata-0x4`. 추가는 후보 객체가 `labels.rel`다른 부가 는 다른 함수 를 아닌 다른 오프셋 을 의미합니다.

### 이 위치에서 이동 지점의 상수를 읽어보세요

명령어를 종료하는 PC 관련 필드에서 CPU는 다음 명령어 주소를 추가하므로 목표물은 상징 + 추가 + 4입니다.`.rodata+0x14`, 그리고 후보에서 그것은 `.rodata+0x0`-`read_table()`여기 4바이트의 5개의 항목이 있습니다.`1, 2, 3, 4, 4`- 그래

다섯번째 숫자는 목록에서 나온다.`CMP ECX, 0x4``JA`0~4의 지수를 허용하고,`[RCX + RAX*0x4]`지표당 4바이트를 읽습니다. `CLAIMS``code/main.py``grade`그리고 `percent_change`- 그래

이 단계는 TH08 프로젝트가 문서화 한 오류로 인해 존재한다. 그 이전 비교는 "목적 주소를 명령어의 이전 필드에 재생하고, 그 주소에서 부동 문자 데이터를 확인하지 않고 명령 바이트를 비교했다.`0.0`따라서 목표에 맞게 정확해 보일 수 있습니다`128.0`"정치는 1548개의 부동 문자 참조를 감사하고 12개의 다른 참조를 수정했습니다. `grade_case10_wrong.c`이 버그의 버전은 46바이트의 코드와 동일하고, 이식 기록은 같은 모양이고, 테이블은`1, 2, 3, 4, 3`- 계속적인 체크만 실패합니다.

### 결과

| Candidate | Size | Masked bytes | Relocation records | Table | Status |
|---|---|---|---|---|---|
| `percent_change_mul_first` | 16 vs 16 | equal | none | none | pass |
| `percent_change_split` | 16 vs 16 | equal | none | none | pass |
| `percent_change_wide` | 16 vs 26 | size differs | none | none | fail |
| `percent_change_div_first` | 16 vs 18 | size differs | none | none | fail |
| `grade_switch` | 46 vs 46 | equal | same shape | `1,2,3,4,4` both | pass |
| `grade_table` | 46 vs 46 | equal | same shape | `1,2,3,4,4` both | pass |
| `grade_thresholds` | 46 vs 39 | size differs | 1 vs 0 | none | fail |
| `grade_case10_wrong` | 46 vs 46 | equal | same shape | `1,2,3,4,4` vs `1,2,3,4,3` | fail |

두 가지 결과는 두 번 더 살펴봐야 합니다.`percent_change_split.c`다른 소스 텍스트와 동일한 바이트를 가지고 있습니다. Clang는 서명된 overflow를 정의되지 않은 것으로 취급하고 접기 때문입니다.`after * 100 - before * 100`한 번 곱하기`grade_table.c`또한 바이트에 바이트와 일치하므로 컴파일러는 배열 지표에서 같은 테이블에 도달했습니다`switch`.바이트 일치는 이 컴파일러가 이 깃발들을 사용하여 후보자로부터 동일한 코드를 생성했다는 것을 증명한다.

크기는 진단이 아니라 수용입니다. rea의 증거 페이지들은 올바른 길이와 467개의 다른 바이트를 가진 1,825바이트의 후보자를 기록합니다.`wide`재건은 26 바이트입니다`movslq``imulq``cqto`그리고`idivq`32비트 양식을 대체했습니다. 목록은 어떤 컴파일도 하기 전에 너비를 알려줬습니다.

## 에이전트 루프 오버 리아

REA의 MCP 도구 중 65개는 CLI 명령이 없습니다.`verify_reconstruction`그 중 한 명입니다.`McpStdioClient``code/main.py`가장 작은 클라이언트가 그들에게 도달합니다.`npx -y rea-agents@6.5.0 mcp`,는 Stdin에 한 라인당 1개의 JSON-RPC 요청을 작성하고, 스드라우트에서 한 라인당 1개의 JSON 객체를 읽습니다.`initialize`프로토콜 버전으로`2025-11-25`그럼`notifications/initialized`그럼`tools/call`.전기 전화 한 통의 기본 제한은 330s입니다. 같은 수 rea는 Ghidra 냉동 시작을 허용합니다.

`agent_loop()`6개의 전화를 하고 각각 녹음합니다.

```json
{
  "step": 2,
  "tool": "analyze_function",
  "arguments": {"procedure": "percent_change"},
  "seconds": 6.31,
  "is_error": false,
  "evidence_id": "ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd",
  "confidence": "observed",
  "authority": "shipped-artifact",
  "limitations": ["Resolved reference metadata identifies computed, indirect, external, call, jump, and data edges; unresolved targetless flows remain unknown, and function classifications distinguish thunks and externals.", "..."],
  "result_sha256": "..."
}
```

전체 증거 기록은 동일한 파일에서 그들의 아이디 아래 저장됩니다.`table_address()``LEA``grade`목록에 올려서 `read_bytes`-`open_binary``get_evidence_bundle`그리고`close_binary`증거 기록이 반환되지 않으며 무효 인증을 기록합니다.

`run_agent(live=True)``npx`길을 가고 있습니다`GHIDRA_INSTALL_DIR`디렉토리를 이름 붙여서 다시 표시하고 stderr에 이렇게 말합니다. 테스트는 한 단계 더 나아갑니다.`code/tests/fake_rea_server.py`각각의 서버에 응답하는`tools/call`동일한 도구와 주장에 대한 기록된 기록과 함께 클라이언트와 루프는 모든 테스트 실행에서 그것을 상대로 실행합니다. rea, Ghidra, 또는 Java가 설치되지 않습니다.

### REA의 검증자가 말할 수 있고 말할 수 없는 것은

 `verify_reconstruction`비교 시점에서의 주장을 가져오기 위한 증거와 반환은 각 주장에 대해 통과, 실패 또는 알려지지 않습니다. 그 고정 한계 는 "Pass은 통과된 모든 선언된 주장을 의미합니다. 그것은 글로벌 구현 동등성을 정하지 않습니다". 함수에 대한 주장은 제공자의 텍스트를 비교합니다`compare_functions`. 행동적 주장은 `compare_process_captures`. 출처 기록이 불완전한 통화 커버리를 가지고 있는 경우, 통화에 대한 주장은`unknown`이 강의의 두 다리는 Rea가 당신에게 남겨둔 부분입니다.

REA의 채무 대책서는 증명서 기록을 기대합니다`predicate_type: "rea.reconstruction-proof"``operation: "verify_reconstruction_obligations"``confidence: "observed"`그리고`normalized_result.passed === true`공공연한 도구가 발사하지 않습니다.`build_proof()``code/main.py`은

```json
{
  "predicate_type": "rea.reconstruction-proof",
  "operation": "verify_reconstruction_obligations",
  "confidence": "observed",
  "authority": "controlled-replay",
  "normalized_result": {
    "passed": true,
    "status": "pass",
    "claims": [
      {"claim_id": "percent_change.behaviour", "kind": "behavioral", "status": "pass", "evidence_ids": ["ev_e88b10dc..."]},
      {"claim_id": "grade.behaviour", "kind": "behavioral", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]},
      {"claim_id": "percent_change.bytes", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_e88b10dc..."]},
      {"claim_id": "grade.bytes", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]},
      {"claim_id": "grade.referenced-constants", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]}
    ]
  },
  "evidence_links": ["ev_e88b10dc...", "ev_67b6d3f9..."],
  "evidence_id": "ev_..."
}
```

아이디는`ev_`ID 없이 기록의 SHA-256를 더해,`aggregate()`실패로 닫힌다: `fail`이겼으면`unknown`, 그리고 빈 청구 목록은`unknown`C 컴파일러 없이 호스트에서 두 가지 행동 주장은`unknown`기록에 의하면`unknown`심지어 두 바이트 요구가 통과될 때에도`authority` `controlled-replay`, 왜냐하면 증거는 우리 자신의 배너스에서 왔기 때문에

## 연구 결과 는 무엇 을 알려 주는가

류, 라프, 미킨스키는 2026년에 9개의 구성에서 8개의 디컴필레이션 시스템을 측정했습니다. 벤치마크에 포함된 모든 테스트를 통과한 후보자는 여전히 미루어진 입력에 대해 분리가 있었다. 전체적으로 4.9%에 달했고, 한 시스템에서는 13%까지 증가했습니다. 300개의 GitHub 라이브러리 기능과 287개의 CVE 기반 기능에서 가장 강력한 정비 모델은 Ghidra의 구축률을 75%에서 90%로 높였다. 같은 기능에 대한 행동 일치율은 74%에서 62%로 떨어졌습니다. 그들은 그 원인을 발명된 필드, 타입, 켈레, 그리고 경비로 추적했습니다. 전통적인 디컴파일러가 남겨둔 보이지 않는 것들을 대체했습니다.

우리들`percent_change_wide.c`이 사이드코드는`long`이 실험은, 이 실험의 결과와 함께, 10개의 테스트를 통과하고, 26개의 과잉세포를 실패하였다. 그레이드-레인지 리부빌은 발명된 방위이다. LLM4Decompile 메트릭에 따라 둘 다 다시 실행될 수 있다고 간주될 것이다. 이 메트릭은 출력을 다시 컴파일하고 벤치마크의 주장을 실행한다. 지드라의 자신의 사이비-C는 인유에발-데컴파일에서 20.12%의 주장을 통과했다.

디컴필 벤치는 실제 프로그램 130개에서 23,400개의 함수를 측정했다. 산업 디컴필러보다 52.2퍼센트 낮은 기능 정확성을 가진 LLM 방법들을 발견했다.

현장의 세 가지 증거는 여러분이 만들 수 있는 세 개의 다리입니다. 피닉스와 드림은 출력을 다시 컴파일하고 원래 프로그램의 테스트를 실행합니다. 맥키먼과 Csmith은 정의된 행동 내에서 유지되는 입력으로 원본에 비해 생성된 입력들을 실행합니다. 라모스와 앵글러는 제한된 상징적 실행으로 두 개의 C 함수를 검사하여 입력 크기에 이르기까지 모든 탐구된 경로에서 평등을 증명합니다. 이 교훈은 첫 두 가지에 대한 세 번째는 레슨 35의 증거서실의 연습 실험실입니다. 그릴 신뢰하기에는 너무 작을 때입니다.

## 건설 해

표준 도서관 띠를 실행:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/main.py
```

                                                                                                                                                                                                                                                              `unknown`- 그래

arm64 Mac에서 예상되는 모양:

```json
{
  "host": "aarch64 Darwin",
  "originalKind": "fixture-source",
  "gridCells": 92,
  "plausible": {"naivePassed": true, "gridMismatches": 28, "oracleDisagreements": 0},
  "equal": {"naivePassed": true, "gridMismatches": 0, "oracleDisagreements": 0},
  "legTwo": {
    "percent_change_mul_first": {"status": "pass", "reasons": []},
    "percent_change_wide": {"status": "fail", "reasons": ["size 16 vs 26 bytes"]},
    "grade_case10_wrong": {"status": "fail", "reasons": ["referenced constants differ: [1, 2, 3, 4, 4] vs [1, 2, 3, 4, 3]"]}
  },
  "agentRun": {"mode": "replayed fixture", "server": {"name": "rea", "version": "6.5.0", "protocolVersion": "2025-11-25"}},
  "proof": {"status": "pass", "evidence_id": "ev_..."}
}
```

읽으세요`code/main.py`이 순서로:

1. `wrap32()``c_div()``idiv32()`그리고 두 가지`*_model()`함수는 목록의 정수 의미론을 가지고 있습니다.
2. `input_grid()`그리고`classify()`92개의 세포를 만들어서 태그합니다.
3. `build_harness()`그리고`execute()`원본에서 한 프로그램을 컴파일하고,`driver.c`, 그리고 세포를 실행.
4. `prove_behaviour()`모형의 불합리와 불일치로 1단계 보고서를 반환합니다.
5. `ElfObject`헤더, 상징, 그리고`.rela`기록`mask_relocations()`그리고`read_table()`비교를 준비하세요.
6. `prove_bytes()`크기와 마스크된 범위, 이전 모양 및 테이블을 포함하는 2발 보고서를 반환합니다.
7. `McpStdioClient`그리고`agent_loop()`리얼 드라이브를 하고 모든 단계를 기록합니다.
8. `build_proof()`그리고`aggregate()`실패로 종료된 기록을 세운다.

## 사용 하 고

새로운 함수를 동등하게 증명하려면 다음 단계를 반복하십시오.

1. 가져오세요`analyze_function`함수와 증거 ID를 기록하고, 사이드코드에 앞서 목록을 읽어보세요.
2. 후보자를 목록의 동작 너비에서 작성하고 원본의 함수 이름을 유지하십시오.
3. 목록에서 모든 곱셈, 덧셈, 빼셈, 분배를 나열하고 각 항목을 넓게 어 넣는 격자 입력값을 추가합니다.
4. 목록에 있는 모든 비교 상수의 양변을 추가합니다.`grade`그 숫자는 수분 후 6과 4이었습니다.
5. 목표에 갇힐 수 있는 모든 분수를 더해, 그릴 실행한 구조를 기록해 보세요.
6. 두 다리를 모두 밟고 상태가 되기 전에 이유를 읽어보세요.
7. 후보자 옆에 증거 기록을 보관해`evidence_links`독자에게 청구소송의 기록이 무엇에 근거하는지 알려줍니다.

컴파일러 업데이트 후 두 다리를 다시 실행하세요. 바이트 일치는 하나의 컴파일러에 대한 하나의 플래그 세트를 가진 문항입니다.

## 인터랙티브 연구소

### 연구소 A: 모델과 실행

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal/code
python3 -q
```

실행:

```python
from main import *
percent_change_model(3, INT_MAX)
percent_change_model(-1, 536870911, "x86_64")
percent_change_model(-1, 536870911, "aarch64")
report = prove_behaviour(PLAUSIBLE)
report.naive_passed, len(report.mismatches), report.mismatches[0]
```

첫 번째 호출은 -133을, 포장된 제품은 3로 나뉘어 두 번째 호출은 -133을 제공합니다.`'trap'`그리고 세번째는 -2147483648입니다. 보고서는 10개의 순진한 사례가 통과되고 28개의 격자 세포가 실패한 것을 보여줍니다. 비교해 보세요.`report.oracle_disagreements`빈 목록이 있는

### 연구소 B: 객체를 읽어보세요

```python
obj = ElfObject(ORIGINAL_OBJECT)
grade = obj.function("grade")
grade.size, grade.data[0x26:0x2a].hex(), grade.relocations
read_table(obj, grade.relocations[0], 5, 4)
```

필드 바이트는`00000000`- 이전 이름`.rodata`추가로`0x10`, 그리고 테이블은`[1, 2, 3, 4, 4]`- 그래

### 연구소 C: 한 변수를 깨고

```python
report = prove_bytes("grade", CANDIDATES / "grade_case10_wrong.o")
report.masked_equal, report.relocations_match, report.tables_equal, report.reasons()
```

바이트가 일치하고 기록이 일치하고 테이블은 일치하지 않습니다. 이제 편집 `grade_case10_wrong.c`그래서`case 10`다시 4을 반환하고, 고정 명령어로 다시 컴파일하고, 상태 변경을 `pass`- 그래

### 연구소 D: 드라이브 리아

REA 6.5.0 및 Ghidra 12.1.4를 설치한 경우:

```bash
GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec \
JAVA_HOME=/opt/homebrew/opt/openjdk@21 \
python3 code/main.py --live
```

첫 번째`analyze_function`Ghidra가 객체를 수입하는 동안 몇 초가 걸립니다. 새로운 증거 ID를 약속된 실행과 비교하십시오. 동일한 분석 프로파일 아래의 동일한 바이트는 동일한 ID를 제공합니다. 왜냐하면 ID는 파일 경로를 배제하는 내용 하시이기 때문입니다.

## 연습 실험실

두 다리를 `total`그리고`grade_label`같은 물체에서

요구 사항:

- `total`, 입력값은 배열과 카운트입니다. 셀을 세는 것은 0을 세는 것, 음수, 하나의 요소, 그리고 32 비트로 묶는 합입니다.
- `grade_label`, 함수는 호출합니다`grade`직렬 및 읽기 `labels.rel`, 5개의 상대적인 문자열 오프셋의 테이블`.rela.rodata`- 그래
- `CLAIMS``grade_label`두 개의 이전과 5개의 4바이트 항목의 테이블을 사용하여 항목이 지향하는 문자열을 비교합니다.
- 모델과 실행이 어떤 세포에 대해 동의하지 않는지를 기록하고, 목록에서 각각의 세포를 설명하십시오.
- 증명 기록에 각각의 기능에 한 발자국 한 발자국 추가하고 합액을 실패로 닫지 않도록 한다.

성공이란 증거 기록이 네 가지 기능을 나열하고, 모든 주장은 증거 인증을 가지고 있다는 것을 의미합니다.`grade_label`한 개의 라벨 문자열이 다르면 실패합니다.

## 출력 능력

이 교훈은`outputs/skill-rebuild-and-prove-equal.md`. 기능 증거와 후보 재구성에서 두발의 증명과 증명 기록으로 변환하는 데 사용하십시오. 이 기술은 사이드코드에 앞서 목록, 모든 위험 클래스를 가진 격자, 이전 마스크링과 지속적인 체크, 그리고 실패 닫힌 집합을 요구합니다.

## 확인 해 보

데모와 테스트 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

35개의 테스트는 증명합니다.

- `c_div()`0으로 줄이는`wrap32()`2의 보완을 따르는
- 모델은 -133을 `(3, INT_MAX)``trap`x86-64의 함정 셀과 AArch64의 -2147483648
- 그릴에는 92개의 세포와 모든 위험 클래스가 있고, 순진한 경우들은 모든 하드 클래스를 피합니다.
- ELF 리더는 기록된 오프셋과 크기에 네 개의 함수를 찾습니다
- `percent_change`16바이트로 이전하지 않고`grade`한 가지`R_X86_64_PC32``0x26`
- 이 로컬레이션 필드 바이트는 0이고 마스크링은 이 RELA 객체에서 아무것도 변경하지 않습니다
- 모든 8명의 공약 후보들은 예상되는 지위를 달성하고, 기록된 이유와 함께
- `grade_case10_wrong`마스크된 바이트를 통과하고, 오직 상속 검사를 실패
- 기록된 1발의 경기는 10개의 순진한 경기가 있고 28개의 부합이 없고
- 컴파일러로 두 쌍 모두 같은 결과를 얻어 재구성하고 재보냅니다
- 대리인이 실행하는 목표물 SHA-256에 의해, 순서대로,`ev_`증거 단계마다 ID
- `read_bytes`기록은 ELF 리더가 발견한 테이블과 같습니다
- 클라이언트는 가짜 서버를 구동하고 실제 실행과 동일한 증거 ID를 기록합니다
- 서버에서 오류 결과가 실행 기록에 들어가
- `aggregate()`실패로 닫혀 있고 증명 ID는 그 내용에서 재 계산됩니다.

## 생산 실패 모드

| Failure | What the weak report says | What the harness must prove |
|---|---|---|
| Rebuild keeps the decompiler's `long` | "ten tests pass" | 26 overflow cells differ from the original |
| Thresholds replace a switch | "every grade band passes" | 110 and larger return 0 in the original |
| Divide before multiply | "formula is algebraically equal" | rounding cells differ, naive cases fail |
| Trap cell skipped | "no crashes" | x86-64 raises `#DE`, AArch64 returns `INT_MIN`, the report names the host |
| Byte compare without masking | "bytes equal" | relocation records name different offsets |
| Masking without reading constants | "bytes equal after masking" | `1,2,3,4,3` differs from `1,2,3,4,4` |
| Size taken as acceptance | "same length" | differing bytes inside the same length |
| Different compiler or flags | "bytes differ, rebuild wrong" | the same source gives different bytes, so the compare is void |
| Model treated as observation | "model agrees" | the run is observed, the model is derived, disagreements are listed |
| Claim without evidence id | "verified" | every claim links an `ev_` record of the function it covers |
| No compiler on the CI host | "passed" | behaviour claims are `unknown` and the aggregate is `unknown` |
| Pseudocode read as source | "decompiler says long" | the listing shows `IMUL EAX`, `CDQ`, `IDIV EDI` |

## 운영 규칙

목록에서 재구성된 것을 작성하고 그 기록의 이름을 붙여서 그 기록에 대해 작성하십시오. 그 기록은 모든 중간을 포괄하고 모든 비교 상수를 가로지르는 그리드 위에 실행합니다. 원래 깃발과 함께 다시 컴파일하고, 이전 필드를 마스크하고, 기록을 비교하고, 그 기록을 가리키는 상수를 읽으십시오. 각각의 주장을 증거 아이디로 기록하고, 검증되지 않은 주장이 알려지지 않도록하십시오.

## 더 많은 읽기

- [McKeeman, Differential Testing for Software, Digital Technical Journal 10(1), 1998](https://www.cs.tufts.edu/comp/150FP/archive/bill-mckeeman/DifferentailTesting.pdf)
- [Yang, Chen, Eide, Regehr, Finding and Understanding Bugs in C Compilers, PLDI 2011](https://doi.org/10.1145/1993498.1993532)
- [Ramos, Engler, Practical, Low-Effort Equivalence Verification of Real Code, CAV 2011](https://doi.org/10.1007/978-3-642-22110-1_55)
- [Schwartz, Lee, Woo, Brumley, Native x86 Decompilation Using Semantics-Preserving Structural Analysis, USENIX Security 2013](https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/schwartz)
- [Liu, Raff, Micinski, When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370, 2026](https://arxiv.org/abs/2609.05370)
- [Gao et al., DecompileBench, Findings of ACL 2025](https://aclanthology.org/2025.findings-acl.1194/)
- [Tan et al., LLM4Decompile, arXiv 2403.05286, 2024](https://arxiv.org/abs/2403.05286)
- [System V gABI, Chapter 4, Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html)
- [x86-64 psABI repository, relocation types](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 2, IDIV](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Arm Architecture Reference Manual for A-profile, DDI 0487, SDIV](https://developer.arm.com/documentation/ddi0487/latest)
- [rea 6.5.0 MCP contracts](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/mcp-contracts.md)
- [rea 6.5.0 reconstruction obligation ledgers](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/reconstruction-obligation-ledgers.md)
