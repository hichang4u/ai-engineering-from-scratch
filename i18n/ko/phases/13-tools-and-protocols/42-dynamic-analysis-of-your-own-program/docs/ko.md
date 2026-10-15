# 자신의 프로그램의 역동적 분석: 디버거, 추적 및 정적 주장을 확인

> 브레이크포인트 히트 (breakpoint hit) 는 하나의 구조의 한 라인에 대한 관찰입니다. 이 교훈은 이러한 관찰을 확인, 반박, 그리고 관찰되지 않은 판결로 바꾸는 관점을 구축합니다.

**Type:** Build
**Languages:** Python, C, arm64 assembly, lldb command language
**Prerequisites:** Phase 13 · 33 (disassembly and control flow), Phase 13 · 35 (evidence, confidence, and unknowns)
**Time:** ~130 minutes

## 학습 목표

- 리눅스 운영체제에서 디버거가 필요로 하는 것을 설명 (`ptrace`(Mac) 과 macOS (Mach Task Port 및 Exception Port) 에서, 그리고 Sandboxed shell가 디버깅을 실행할 수 없는 이유에서.
- 소프트웨어의 브레이크포인트를 이름과 주소를 나열하여 설정하고 하드웨어 감시점을 설정하고 프로세서가 두 가지에 부과하는 한계를 읽어보십시오.
- 매번 매개체, 메모리, 프레임 변수를 기록하는 스톱 할크로 파이썬에서 배치 모드에서 lldb를 드라이브하고, 시선으로 다시 기록된 문서를 분석합니다.
- 이 시간 라인: 논쟁 레지스터, 구조 필드 오프셋, 조건부 분자가 어떤 엣지를 가져왔고 어떤 호출이 일어났는지 확인합니다.
- 같은 계획을 실행합니다`-O2`해소하고 절대 타지 않는 브레이크포인트를 읽고, 그리고 증명하고 증명하지 않는 것을 말하십시오.
- 코어 파일을 저장하고 로드하고, 스택 스타일의 코어가 빠뜨리는 것을 명명하십시오.
- gdb 및 lldb 명령 세트를 지도하고 위치`strace``ltrace``bpftrace``dtrace`그리고`rr`올바른 운영 체제와 그 버전과 라이선스
- macOS 코드 서명 사실을 설명해 주세요. 이더블이 직접 만든 바이너리를 디버깅할 수 있도록 해주고,

## 문제

41강습`struct account`DWARF에서`balance`오프셋 4에 위치하고 있습니다. 33 수업은`classify`그리고 첫 번째 지부가 `return -1`이 두 가지 주장은`x0`그리고`x1`그 문장들은 모두 바이트에서 따온 것이었는데, 그 중 어느 것도 관찰되지 않았습니다.

에이전트가 같은 프로그램을 읽고 "중앙 통화"를 보고합니다.`bump``classify`그리고`sum_balances`"표는 세 가지 모두 리스트를 하고 있어 문장이 안전해 보입니다.`-O2`, 각 함수에 분기점을 설정하고 실행합니다. 프로세스는 네 줄과 출구를 인쇄합니다.`hit count = 0`- 그래

에이전트는 원천에 대해 잘못 알고 있었습니다. 그 질문에 대한 빌드에 대해 잘못 알고 있었습니다. 컴파일러는 세 번의 전화를 모두 적어놓고 접했습니다.`sum_balances(rows, 3)`이 기계의 이진값을 확인하는 유일한 방법은 디버거를 실행해서 확인하는 것입니다.

이 수업은 을 만들어서`account.c`, 목록을 읽고, 1개의 Ildb 세션을 계획하고 실행하고, 매개의 정적 주장을 중지된 것에 비하여 평가합니다.`confirmed`이 달리는 동안의 주장이 사실이라는 것을 증명한 정지입니다.`refuted`정지판이 거짓이라고 증명된 것을 의미합니다.`not-observed`35번 강의에서는 각 판결을`observed`권위 있는 기록`controlled-replay`- 그래

```figure
re-42-run-timeline
```

## 디버거는 세 가지 시스템 서비스와 테이블입니다

디버거는 자신이 코드가 없는 프로세스에 대해 네 가지 일을 합니다. 프로세스를 중지하고, 레지스터를 읽고 쓰고, 메모리를 읽고 쓰고, 프로세스가 다시 멈출 때 알려집니다. 커널은 서비스로서 이 모든 것을 제공하며, 운영 체제에 따라 서비스가 다릅니다.

리눅스에서 서비스 `ptrace(2)`. 설명서 페이지 는 "어떤 프로세스 (터커) 가 다른 프로세스 실행을 관찰하고 제어 할 수 있는 수단 을 제공한다"라고 말한다. `PTRACE_TRACEME`아이가 부모가 추적할 것이라고 발표하도록 합니다.`PTRACE_ATTACH`관련 없는 과정을 거친다.`PTRACE_PEEKDATA`"추적자의 기억에 있는 주소에서 한 단어"`PTRACE_GETREGS`등록을 읽고,`PTRACE_SINGLESTEP`한 명령어를 실행합니다. Yama 모듈 한계는 다음과 같습니다.`/proc/sys/kernel/yama/ptrace_scope`1의 기본값은 "목적 프로세스는 호출자의 후손이어야 한다"라는 뜻이고, 2는 관리자가만 첨부할 수 있고, 3는 아무도 첨부할 수 없다는 뜻이다.

macOS에`ptrace`작은 인터페이스입니다. 애플의 수동 목록`PT_TRACE_ME``PT_ATTACHEXC``PT_STEP``PT_CONTINUE`그리고`PT_KILL`, 그리고 이렇게 말합니다`PT_ATTACHEXC`"아이로부터의 신호는 마흐의 예외로 부모에게 전달된다".`ptrace`전혀. Ildb의`debugserver`전화`task_for_pid()`프로세스 작업 포트를 얻기 위해`task_set_exception_ports()`그래서 교차점이 예외 메시지로 도착합니다.`taskgated`누가 전화할 수 있는지 결정합니다`task_for_pid`- 그래

이 수업의 기록에서 그 디자인의 비용을 볼 수 있습니다. 세션의 껍질은 시트벨트 모래 상자 아래로 실행됩니다. 모래 상자 밖에서 11 개의 정류를 생성하는 동일한 계획은 내부에서 이것을 생성합니다.

```text
(lldb) run
error: process exited with status -1 (attach failed ((os/kern) invalid address))
```

이 프로세스는 만들어졌고, 채택되지 못했습니다. 오류는 디버거의 권리와 관련되어 있고, 프로그램에 대해 아무 말도 없습니다. 배너스는 발사 실패로 기록하고 있습니다.

테이블은 브레이크포인트 테이블입니다. 디버거는 어떤 명령어 바이트를 어떤 주소로 교체했는지 기억하고, 따라서 계속하면 원래를 다시 넣을 수 있으며, 위치마다 샷을 계산합니다. `breakpoint list`테이블을 인쇄하고, 각 라인의 끝에서 배지판이 읽습니다.

## 분해점: 한 바이트 또는 한 단어 대신

소프트웨어 ρή치 포인트는 프로세서가 함정에 놓은 명령어입니다. 명령어의 첫 바이트에 기록되어 있습니다. x86-64에서`INT3`, opcode`CC`, 1 바이트 길이의, 인텔 매뉴얼에서 설명 "실제 예외 처리기를 호출하기 위해 의도"`BRK #imm16`, 4 바이트 명령어, 그 예외는 "EC 값 0x3C를 사용하여 ESR_ELx에서 예외를 기록합니다".`BRK`명령 자체, 그래서 스톱은 대체된 명령의 주소를 보고하고 그 다음의 주소를 보고하지 않습니다.

lldb는 이름, 파일, 라인 또는 주소로 브레이크포인트를 설정합니다. 이름으로 프롤로그를 건너뛰습니다:

```text
(lldb) breakpoint set -n bump
Breakpoint 1: where = account-O0`bump + 12 at account.c:13:19, address = 0x00000001000004bc
```

`bump + 12`네 번째 명령입니다. 그 전에 세 가지 명령이 있습니다.`sub sp, sp, #0x10``str x0, [sp, #0x8]`그리고`str w1, [sp, #0x4]`, DWARF 라인 테이블에서 함수의 개막 라인에 부여되는 프레임 설정.`x0`그리고`x1`이 주장은 여전히 유지됩니다. 왜냐하면 선행은 단지 그것을 복사하기 때문입니다.

주소로, Ildb는 주소와 관련된 모듈을 알아야 합니다.`breakpoint set -a 0x100000504`이 프로세스가 존재하기 전에, 그 뒤에 섹션이 없는 로드 주소가 있습니다.`unresolved``hit count = 0`. 배너스가 사용하는 형태는 모듈의 이름을 붙여줍니다:

```text
(lldb) breakpoint set -a 0x100000504 -s account-O0
Breakpoint 4: address = 0x0000000100000504
```

`-s`번호는 파일 주소가 있습니다`account-O0`, lldb는 로드 슬라이드를 추가하고, 실행 후 위치가 읽습니다 `resolved, hit count = 2`. 수업 33 목록은 파일 주소를 제공합니다. 그래서 이것은 동적 정지로 정적 목록을 연결하는 양식입니다.

### 이 지문을 손으로 해독

1차 조건부 분자`classify``-O0`이 말은`36f800a8``0x1000004f0`,`llvm-objdump``tbz w8, #0x1f, 0x100000504`. A64 팔의 코딩에서 해독합니다`TBZ`- 그래

1. 31 bit은`b5`,비트 숫자의 높은 비트.
2. 30에서 25 bit은`011011`, 테스트와 분자 그룹. 비트 24는 0입니다.`TBZ`그리고 그렇지 않습니다`TBNZ`- 그래
3. 23에서 19까지의 비트`b40`, 비트 번호의 낮은 5 비트: `11111`= 31`b5`= 0 테스트 비트는 31, 32 비트 값의 신호 비트입니다.
4. 18에서 5까지의 비트`imm14`이 책:`00000000000101`= 5. 지부 오프셋은`imm14 * 4`= 20 = `0x14`, 그래서 목표가`0x1000004f0 + 0x14 = 0x100000504`- 그래
5. 4에서 0까지의 비트 `Rt`이 책:`01000`8이므로 레지스터는`w8`- 그래

`w8`                          `ldr w8, [x8, #0x4]`, 즉`a->balance`4번의 오프셋에서`TBZ`지점이 0이 되면 지점이 이 됩니다`balance >= 0`- 소스는`if (a->balance < 0) return -1;`, 그래서 컴파일러는 조건을 뒤집어:                                       `return -1`블록, 그리고    `0x1000004f4`따라서, 배너스가 가지고 있는 정적 주장은, 전사함과 함께 있는 가장자리 주장이다.`a->balance >= 0`다른 분포의 엘리베이터도 같은 방식으로 작동합니다.`subs w8, w8, #0xc8`계산기`balance - 200`그리고`b.le 0x100000524`이 값은 0이 될 때`balance <= 200`- 그래

## 경찰 지점 은 하드웨어 이며, 몇 개

워치포인트는 주소 메모리에 액세스할 때 프로세스를 중지합니다. 그것은 다른 위치에서 어떤 명령어도 액세스 할 수 있기 때문에 교체 명령이 될 수 없습니다. 따라서 프로세서는 작은 주소의 비교 장치를 가지고 있습니다. x86-64에는 디버깅 레지스터입니다:`DR0` `DR3`" 최대 4개의 브레이크포인트의 주소를 보유한다"`DR7`각이 가능하고 그 조건 (실행, 쓰기, 읽기-쓰기) 과 그 길이가 (1, 2, 4, 또는 8 바이트) 를 설정합니다.`DBGWVR<n>_EL1`, "시경점 일치에 사용되는 데이터 가상 주소를 저장하고 있습니다".`DBGWCR<n>_EL1`제어기, 그리고 팔 수동서에서는 "실제시스템은 2-64개의 감시 지점을 포함할 수 있습니다".

Ildb는 주어진 번호를 보고합니다.

```text
(lldb) watchpoint set variable a->balance
Watchpoint created: Watchpoint 1: addr = 0x16fdfe00c size = 4 state = enabled type = m
(lldb) watchpoint list
Number of supported hardware watchpoints: 4
```

4번 이 기계에, 감시된 주소`0x16fdfe00c` `x0 + 4`:              `bump`                                 `balance`-`size = 4`이 `int`-`type = m`슬롯이 끝나면 lldb는 다음 감시 지점을 거부하고, 2의 힘이 맞지 않는 지역이 두 슬롯을 취할 수 있기 때문에 설정할 수 있는 감시 지점 수는 4보다 작을 수 있습니다.

데이터 워치포인트는 액세스 후 보고합니다. 인텔 매뉴얼은 "메모리를 작성하는 명령은 데이터 브레이크포인트에서 생성된 디버그 예외가 생성되기 전에 원래 데이터를 덮어쓰고 있습니다". 그리고 lldb는 두 가지 모두 인쇄하기 위해 오래된 값을 자체 캐시에서 보관합니다:

```text
Watchpoint 1 hit:
old value: 250
new value: 255
* thread #1, queue = 'com.apple.main-thread', stop reason = watchpoint 1
    frame #0: 0x00000001000004d0 account-O0`bump(a=0x000000016fdfe008, by=5) at account.c:14:12
```

정류가 `0x1000004d0`, 다음 명령`str w8, [x9, #0x4]``0x1000004cc`출력을 분석하기 전에 아는 게 좋을 것 같아요`watchpoint set`, Ildb 발자국`Watchpoint 1 hit:`빈 값으로`new value: 250`첫 번째 판독이 되는데, 구전값이 없는 타격을 무시합니다.

## 발걸음, 을 멈추고, 배트 모드

Ildb의 명령 문법은`<noun> <verb> [-options] [arguments]`발걸음이란`thread step-in`(`s`), `thread step-over`(`n`), `thread step-inst`(`si`), `thread step-inst-over`(`ni`), 그리고`thread step-out`(`finish` ).`thread until 12`한 줄까지 달린다.`thread return <expr>`값으로 일찍 돌아옵니다. 배너스는 발걸음을 내지 않습니다. 계획된 주소에서 멈추고 스톱 할크가 읽기하도록 합니다.

```text
target stop-hook add -o "register read x0 x1 pc" -o "memory read -s4 -fx -c24 $x0" -o "frame variable -P 1"
```

`-o`반복될 수 있고, 모든 정류장에서 명령이 순서대로 실행됩니다.`register read`두 개의 논쟁 레지스터와 프로그램 카운터의 이름을 지정합니다. `memory read -s4 -fx -c24 $x0`24개의 4바이트 단어들을 엑스에서`x0`, 즉 96바이트, 3`struct account`줄이`frame variable -P 1`논증과 지역적 인 것을 인쇄하고 포인터를 한 단계 확장합니다.`a`5개의 영역을 나타냅니다.

배트 모드는`lldb -b`- 설명서는`--batch``-s``-S``-o`그리고`-O`그리고 나서 종료합니다. 명령이 "신호와 충돌로 인해 중단되면 디버거가 인터랙티브 프롬프트로 돌아갑니다".`-s`. 한 가지 중요한 요소:`settings set interpreter.stop-command-source-on-error false`- 그 없이 첫 번째`continue`프로세스가 종료된 후 전체 파일이 종료됩니다.`breakpoint list`절대 실행되지 않습니다.`error: Process must be launched.`그리고 계속합니다.

출력 모양에 대한 두 가지 사실들은 파서 작동 방식을 결정합니다. 첫째, 이 실행되는 동안  출력이 인쇄됩니다.`Process N stopped`블록과 함께 `frame #0`라인은 그 후 인쇄됩니다. 따라서 파서 는 레지스터, 메모리 및 변수 라인을 걸린 조각으로 수집하고 다음 조각에 붙인다.`frame #0`그 선이 보이는 것인데, 그 프로그램 카운터가`dyld``_dyld_start`프로그램 실행 전에 입력 정지입니다.`frame #0`두 번째로,`--auto-continue`이 배네스의 첫 번째 버전은 자동 계속을 사용했고 아무것도 기록하지 않았습니다. 계획에는 단순한 브레이크포인트와 고정된 예산이 사용됩니다.`continue`대신 명령

## 계획 은 목록 에서 나온 것 이다

`Plan.commands()``llvm-objdump -d`이진의 텍스트를 실행합니다.`account-O0`이 부분의 본문은

```text
breakpoint set -n bump
breakpoint set -n classify
breakpoint set -n sum_balances
breakpoint set -a 0x100000504 -s account-O0
breakpoint set -a 0x1000004f4 -s account-O0
breakpoint set -a 0x100000524 -s account-O0
breakpoint set -a 0x100000514 -s account-O0
target stop-hook add -o "register read x0 x1 pc" -o "memory read -s4 -fx -c24 $x0" -o "frame variable -P 1"
run
watchpoint set variable a->balance
watchpoint list
continue
...
breakpoint list
watchpoint list -v
```

3개의 이름 분단점은 함수 항목입니다. 4개의 주소 분단점은 각각의 조건부 분단의 목표와 틈새입니다.`Listing.conditional_branches()``classify`이 책:`tbz``0x1000004f0`그리고`b.le``0x100000510`. 첫 번째 정류장에서 감시 지점이 설정되어 있습니다.`bump`16년`continue`이 프로그램은 모든 실행 필요에 비해 더 많은 명령이 따르고, 그리고 남은 것은 출구 후 무해하게 실패합니다. 예산은 프로그램에 대한 지식이 아닙니다. 그것은 천장입니다.

이 주장은 같은 입력으로 만들어 졌습니다.`claims_for()`이 부분의 본문은

| Id | Kind | Claim | Source |
|---|---|---|---|
| `arg-registers` | argument-register | at every entry the first arguments arrive in `x0` and `x1` | lesson 32 and AAPCS64 |
| `field-offsets` | field-offset | `struct account` is 32 bytes with `kind` at 0, `balance` at 4, `code` at 8, `rate` at 16, `label` at 24 | lesson 41 and the DWARF dump |
| `branch-1` | branch-taken | `tbz` at `0x1000004f0` goes to `0x100000504` when `a->balance >= 0`, otherwise to `0x1000004f4` | lesson 33 edges and the lesson 34 lift |
| `branch-2` | branch-taken | `b.le` at `0x100000510` goes to `0x100000524` when `a->balance <= 200`, otherwise to `0x100000514` | lesson 33 edges and the lesson 34 lift |
| `calls` | call-edge | `main` calls `bump` once, `classify` three times, `sum_balances` once | source text and `nm` |
| `store-once` | store | `bump` writes `a->balance` once and the new value is the old value plus `by` | lesson 34 pseudocode |
| `stride` | struct-stride | `list[i].balance` sits at `list + 32*i + 4` | lesson 41 and the psABI aggregate rule |
| `output` | behaviour | the program prints `class 0 1 -1` and `sum 315` | source arithmetic |

필드 오프셋은`struct_layout()`, 문장`DW_TAG_structure_type``DW_AT_byte_size (0x20)`그리고 다섯 가지`DW_TAG_member`그들의 항목`DW_AT_data_member_location`DSYM 쓰레기통에서 나온 거야 계획에는 4번이 적혀있지 않아

## -0에서 달리는 경주: 11번의 정류

첫 번째 정류는`bump`은 이 점으로 을 막기 전에 이렇게 인쇄했습니다.

```text
      x0 = 0x000000016fdfe008
      x1 = 0x0000000000000005
      pc = 0x00000001000004bc  account-O0`bump + 12 at account.c:13:19
0x16fdfe008: 0x00000073 0x000000fa 0x00000009 0x00000000
0x16fdfe018: 0x00000000 0x3ff40000 0x00000719 0x00000001
0x16fdfe028: 0x0000006c 0xffffffd8 0x00000003 0x00000000
0x16fdfe038: 0x00000000 0x40000000 0x00000721 0x00000001
(account *) a = 0x000000016fdfe008 {
  kind = 's'
  balance = 250
  code = 9
  rate = 1.25
  label = 0x0000000100000719 "savings"
}
(int) by = 5
```

DWARF 오프셋에 대한 첫 번째 줄의 8개의 단어를 읽어보세요. 오프셋 0에서 단어 0는`0x73`, 즉`'s'`, `kind`바이트, 다음으로 3개의 바이트. 오프셋 4에서 1번의 단어`0xfa`= 250`balance`. 오프셋 8의 2번 단어는`0x9``code`, a `short`아래 절반에 2 바이트 이 있고, 위에는 2 바이트 이 있습니다. 오프셋 12에서 3 단어는 8 바이트 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이 `double`16번의 오프셋에서 4번과 5번의 단어는`0x3ff4000000000000`, 즉 IEEE-754의 1.225의 코딩입니다.`0x100000719`, `label``__TEXT`다음 8개의 단어는`0x6c`=`'l'`그리고`0xffffffd8`= -40: 세 번째 줄, `loan`32바이트 후에 모든 숫자가 일치합니다`frame variable`그래서`_check_layout()`기록`field-offsets``confirmed`이 정류장에서 다시 11개 정류장에서 다시 반복합니다.`x0`구조 지표를 가지고 있습니다.

`x0`=`a`그리고`x1`=`by`그래서`arg-registers`이 항목에서 확인됩니다. 은 선언된 주장만을 비교합니다.`classify`멈춰요`x1`아직도 읽는다`0x5`, `bump`그리고`classify`이 논증은 소음이고, 레슨 32 주장은 그것에 대해 아무것도 말하지 않습니다.

두 번째 정류는 관측 지점입니다. 오래된 값은 250, 새로운 값은 255,`by`5번의 한 번의 타격,`store-once`확인된 상태입니다.`classify`, 각기 그 입구역과 한두 개의 가장자리역을 가진

| Stop | Address | Stop reason | What it tests |
|---|---|---|---|
| 2 | `0x1000004e8` | breakpoint 2.1 | entry, `a->balance` = 100, `x0` = `a` |
| 3 | `0x100000504` | breakpoint 4.1 | `tbz` taken, 100 >= 0, `branch-1` confirmed |
| 4 | `0x100000524` | breakpoint 6.1 | `b.le` taken, 100 <= 200, `branch-2` confirmed |
| 5 | `0x1000004e8` | breakpoint 2.1 | entry, `a->balance` = 255 |
| 6 | `0x100000504` | breakpoint 4.1 | `tbz` taken, 255 >= 0 |
| 7 | `0x100000514` | breakpoint 7.1 | `b.le` fell through, 255 > 200 |
| 8 | `0x1000004e8` | breakpoint 2.1 | entry, `a->balance` = -40 |
| 9 | `0x1000004f4` | breakpoint 5.1 | `tbz` fell through, -40 < 0 |
| 10 | `0x100000544` | breakpoint 3.1 | `sum_balances` entry, `x1` = 3 |

`_check_branches()`스톱을 활성화로 그룹화하여 입점에서 균형을 읽으며 각 엣지 스톱에 대해 후속을 계산합니다.`branch-1`3번 확인됐어요`branch-2`2번, 5번의 정지표는 255번의 균형을 나타냅니다.

10번 정류장에서 은 24개의 단어를 읽었습니다`list`-`_check_stride()`단어 1, 단어 9, 단어 17, 즉, 4, 36, 68: 100, 255, 그리고 -40의 오프셋을 사용합니다.`classify`같은 주소에서 보았고, 315으로 합쳐서, 그 수를`sum 315`라인 프로그램 인쇄. 그 다음 프로세스는 상태 0 및 `breakpoint list`네 가장자리에 1, 3, 1의 히트 횟수를 표시하고, 네 가장자리에 2, 1, 1의 히트 횟수를 표시합니다.`confirmed`25개의 기록이 뒤쳐져 있는데, 23개는 정지점과 2개는 완주점으로 묶여 있습니다.

## -O2에서 달리는 경주: 제로 스톱

같은 자료입니다`-O2`다른 프로그램입니다.`llvm-objdump -d``main`4개`bl`모든 지침`printf`전화가 아닌`mov w8, #-0x1``mov w8, #0x1`, 0을 통과합니다`xzr`그리고`mov w8, #0x13b`, 즉 315. 컴파일러는 컴파일 시점에 모든 결과를 계산했습니다.`nm`여전히 목록`_bump``_classify`그리고`_sum_balances`, 왜냐하면 그것들은 외부 함수이기 때문에 다른 객체들이 호출하기 위해 외부 복사본이 존재해야 하기 때문입니다.`DW_TAG_subprogram`4개의 함수와 0에 대한 항목`DW_TAG_inlined_subroutine`입력, 그래서 디버깅 정보도 인라인링을 기록하지 않습니다.

이 건물의 계획은 3개의 이름의 교차점이 있고 가장자리 교차점이 없습니다.`classify``-O2`6개의 명령입니다.`ldr``cmp``cset``cmp``csinv``ret`, 조건부 분할이 없는 한`-O0`이 바이너리에는 목록이 없습니다. 그리고 리너스는 그들을 넘지 않습니다. 가장자리에 대한 주장은 가장자리를 가진 빌딩에 속합니다.

경주:

```text
(lldb) breakpoint set -n bump
Breakpoint 1: where = account-O2`bump at account.c:13:16, address = 0x0000000100000460
(lldb) run
sizeof 32 align 8
offsets 0 4 8 16 24
class 0 1 -1
sum 315
Process 48444 exited with status = 0 (0x00000000)
(lldb) watchpoint set variable a->balance
error: Command requires a process which is currently stopped.
(lldb) breakpoint list
1: name = 'bump', locations = 1, resolved = 1, hit count = 0
```

각각의 틈새점이 해결되었습니다. 주소도 있고, 상징도 있고,`BRK`사상자 수는 0명인데, 사상자 수는 없습니다.

| Claim | Verdict | Record |
|---|---|---|
| `calls` | refuted | after a full run with exit status 0, entry stops bump 0, classify 0, sum_balances 0 |
| `output` | confirmed | the four lines and exit status 0 |
| `arg-registers` | not-observed | no stop tested it, hit counts all 0 |
| `field-offsets` | not-observed | no stop tested it |
| `store-once` | not-observed | no stop in bump, so the watchpoint was never set |
| `stride` | not-observed | no stop in sum_balances |

반박에 대해 정확히 말해봐요`main`이 프로그램에서 3가지 기능을 호출합니다. 이 빌드와 이 런에서는 그렇지 않습니다. 그리고 리네스는 런이 완료되었는지 확인했습니다. 왜냐하면 출구 전에 0의 히트 카운트가 랜이 아직 호출에 도달하지 않았다는 것을 의미하기 때문입니다. 이 주장은 함수가 죽은 코드라고 말하지 않았고, 실행은 또한 그렇게 말하지 않습니다. 그들은 수출되고 다른 물체가 그들을 호출 할 수 있습니다. 나머지 네 가지 주장은 확인되거나 반박되지 않습니다. 구조는 여전히 `balance`이 빌드에서 4번의 오프셋에서, 그리고`-O2`DWARF은 그렇게 말하지만, 이 실행에서 멈추지 않고 기억을 읽어보도록 합니다.`not-observed`35강습은 미지의 것을 관찰할 때까지 열어두고 있습니다.

## 핵 쓰레기

핵심 파일은 프로세스의 메모리 및 디스크에 기록된 레지스터입니다. 그래서 디버거는 프로그램이 사라진 후 중지된 프로그램을 읽을 수 있습니다.`core(5)`"프로세스의 비정상적인 종료를 일으키는 작은 수의 신호는 또한 프로세스의 핵심 상태의 기록이 디스크에 기록되도록 합니다".`/cores/core.pid`"이 기계에 있는 디렉토리에서 작성 권한이 있는 상태에서 종료된 프로세스를 작성할 수 있습니다".`sysctl`보고서`kern.coredump: 1`그리고`kern.corefile: /cores/core.%P``/cores`모드와 함께 존재합니다`drwxrwxr-t root admin`, 그리고 껍질의`ulimit -c`0은 0으로 한계를 높이지 않는 한 커널 코어가 작성되지 않습니다`ulimit -c unlimited`, 또는 시스템 전체에서 `launchctl limit core unlimited`- 그래

Ildb는 충돌 없이 요구에 따라 핵을 작성합니다.`bump`분해점:

```text
(lldb) process save-core --style stack account-O0-stack.core
Saving 49152 bytes of data for memory region at 0x16fdf4000

Modified-memory or stack-memory only corefile created.  This corefile may 
not show library/framework/app binaries on a different system, or when 
those binaries have been updated/modified. Copies are not included
in this corefile.  Use --style full to include all process memory.
```

파일은 53,248바이트였는데, 로딩은 옆의 바이너리를 필요로 합니다.

```text
(lldb) target create "./account-O0" --core "account-O0-stack.core"
(lldb) bt
* thread #1, stop reason = ESR_EC_BRK_AARCH64 (fault address: 0x0)
  * frame #0: 0x00000001000004bc account-O0`bump(a=0x000000016fdfe008, by=5) at account.c:13:19
    frame #1: 0x0000000100000640 account-O0`main at account.c:40:5
    frame #2: 0x000000019a949d54 dyld`start + 7184
(lldb) frame variable *a
(account) *a = (kind = 's', balance = 250, code = 9, rate = 1.25, label = "")
(lldb) frame variable a->label
(const char *) a->label = 0x0000000100000719 ""
```

뒷자리와 정수분야는 손상되지 않습니다. 왜냐하면 그들은 핵이 저장한 스택에 살고 있기 때문입니다.`label`빈 문자열으로 인쇄된 지표가 손상되지 않은 지표`0x100000719`맞습니다. 이 바이트는 문자 그대로`"savings"``__TEXT`실행 가능한 부분, 그리고 스택 스타일의 코어는 해당 부분을 포함하지 않습니다. 포인터는 관찰입니다. 문자열은 사용할 수 없으며, lldb는 그것을 발명하지 않습니다. `--style full`모든 프로세스 메모리를 포함하고 있으며, 연구 기계에 있는 이 34 KB 프로그램의 전체 코어는 2.1 GB였습니다. 프로세스가 공유된 캐시를 지도화하기 때문입니다.`ESR_EC_BRK_AARCH64`: 핵은 `BRK`그 중에서도

리눅스에서 커널은 코어에 따라 작성합니다`/proc/sys/kernel/core_pattern`, `%p`PID에 대한`%e`명령 이름에 대해,`%s`신호에 대해, 그리고`%t`그 때, 그리고 선두`|`시스템에서 배포되는`systemd-coredump`그리고`coredumpctl list``info``dump`그리고`debug`저장된 것을 가져오세요.`gdb prog core`그리고`lldb -c core prog`둘 다 결과를 열어보세요.

## Gdb와 LLDb

두 디버거는 다른 단어로 동일한 작업을 수행합니다.`COMMAND_MAP`                    `python3 code/main.py commands`이 수업에서 사용하는 것:

| Task | gdb | lldb | lldb alias |
|---|---|---|---|
| break at a function | `break bump` | `breakpoint set -n bump` | `b bump` |
| break at an address in one module | `break *0x1000004f0` | `breakpoint set -a 0x1000004f0 -s account-O0` | |
| run commands at every stop | `define hook-stop` ... `end` | `target stop-hook add -o '...'` | |
| list breakpoints with hit counts | `info breakpoints` | `breakpoint list` | `br l` |
| watch a variable for writes | `watch a->balance` | `watchpoint set variable a->balance` | `wa s v a->balance` |
| list watchpoints | `info watchpoints` | `watchpoint list -v` | `wa l -v` |
| read one register | `p $x0` | `register read x0` | |
| read memory as words | `x/8xw 0x16fdfe008` | `memory read -s4 -fx -c8 0x16fdfe008` | `x -s4 -fx -c8 0x16fdfe008` |
| show arguments | `info args` | `frame variable --no-locals` | |
| step one instruction | `stepi` | `thread step-inst` | `si` |
| run until the function returns | `finish` | `thread step-out` | `finish` |
| write a core file | `gcore core` | `process save-core --style stack core` | |
| open a core file | `gdb account-O0 core` | `lldb -c core account-O0` | |

이드브의`p`이명칭은`dwim-print`, 즉 `frame variable`경로로로 돌아갑니다`expression`다른 모든 것에 대해`v` `frame variable`- 좋아`frame variable`배너스: DWARF 위치를 읽고 디버깅에 코드를 실행하지 않습니다.

2026-10-14에 대한 버전과 라이선스. lldb는 LLVM 버전 번호를 가지고 있으며, 현재 llvm.org 버전은 2026-10-06의 LLVM 23.1.3입니다.`lldb`이 기계선에서 지휘 선 도구`lldb-1703.0.236.21`, 애플의 자체 번호, 임베디드 파이썬 3.9.6와 애플의 lldb 이미 디버깅을 위해 서명되었습니다. GDB 18.1는 2026-09-25에 GPL-3.0 또는 후기 아래 출시되었습니다.`.gdb_index`, AArch64 `FPMR`, 그리고 파이썬`gdb.Corefile`GDB는 18.1까지 애플 실리콘 프로세스를 원산지 지원하지 않습니다: 15 패치 "초기의 AArch64-Darwin 지원" 시리즈는 2025년 10월에 게시되었으며, 2026년 2월에 관리자는 저작권 할당을 통해 그것을 착륙하는 경로를 설정하고 BFD 패치를 먼저합니다.`gdb`포뮬러에는 arm64 병이 있고 가짜로 만들어집니다`--target=x86_64-apple-darwin20`, 그리고 그들을 추가 한 pull 요청은 "GDB를 통해 aarch64-Darwin 바이너리를 디버깅하는 것은 불가능하다". macOS에 애플이 아닌 디버깅은 또한 자서 서명된 인증서와 `com.apple.security.cs.debugger`권리 또는`task_for_pid`"(os/kern) 실패 (0x5) "로 실패합니다. 이 코스에서 gdb의 장소는 Debian 안정적인 배가 gdb 16.3를 arm64에 배치하고,`rr`생명체

## 추적: 프로그램 은 핵 을 무엇 을 요구 했는가

디버거는 프로그램의 상태를 멈추게 하고, 트래서는 프로그램의 영향을 시스템에서 오랫동안 멈추지 않고 보여줍니다. 도구는 운영 체제마다 있습니다.

| Tool | OS | Version | Licence | What it records |
|---|---|---|---|---|
| `strace` | Linux | 7.2, 2026-08-18 | LGPL-2.1-or-later | system calls with arguments and return values |
| `ltrace` | Linux | 0.7.3 last tarball, git snapshots in Debian | GPL-2.0 | dynamic library calls |
| `bpftrace` | Linux | v0.27.0, 2026-09-10 | Apache-2.0 | kernel and user probes through eBPF |
| `dtrace` and `dtruss` | macOS | `Sun D 1.19` in macOS 26.2 | CDDL, from Sun's OpenSolaris | D probes; `dtruss` prints system calls |

`dtruss`이 설명서는 "이것이 DTrace를 사용하기 때문에 루트 권한이 있는 사용자만이 이 명령을 실행할 수 있습니다".`dtrace(1)`"전설 시스템 통합 보호 설정으로 D 프로그램은 커널 주소 값이나 커널 메모리 콘텐츠에 액세스 할 수 없습니다" 그리고 SIP에 의해 파괴적인 동작이 허용되지 않습니다. `sudo dtruss ./account-O0`이 기계에 이 수업에서 실행되지 않았기 때문에, 배너스는 뿌리없이 실행하고, 수업은 확인되지 않은 것으로 기록.`write`각`printf`"선"은 추적 질문입니다.`x1`5을 `bump`"라고 묻고, "두 가지 모두 실행에 옮깁니다.

## 녹음 및 재생

`rr`실행을 한 번 기록하고, 역행과 함께 gdb에서 결정적으로 재생합니다.`reverse-cont`글씨로 돌아가서 이 프로젝트는 "당신은 한번 실패를 기록하고, 그 다음, 당신이 원하는 만큼의 수차례에 걸쳐서, 결정적으로, 녹음을 디버깅합니다".라고 설명합니다. 현재 버전은 2025-02-13의 5.9.0입니다. MIT 라이선스 하에 BSD-2-클라즈 블록으로. 리눅스만 사용해요 지부를 계산하기 위해 하드웨어 성능 카운터가 필요합니다. 그래서 인텔 네하렘과 나중에 특정 AMD 젠 코어와 "어떤 AArch64 마이크로 아키텍처 (예를 들어 ARM 네오버스 N1 또는 애플 실리콘 M 시리즈) " 가상 머신 내부에서 카운터는 가상화되어야 합니다. 프로젝트 위키는 "Mac에서 다른 가상화도 없습니다". 라고 말합니다. 그래서 이 머신에서 도커와 콜리마는 실행할 수 없습니다. 페르노스코는 RR 녹음으로 만들어진 상업 서비스입니다.

Gdb는 자체 소프트웨어 레코더를 가지고 있습니다.`record full`"프로세스 실행 로그"를 기록하고, 기본적으로 200만 개의 명령으로 제한하고,`record btrace`이 MacOS 기계에서는, 이 배너스의 저장된 기록은 기록입니다. 같은 바이너리에서 동일한 플랜이 동일한 순서로 동일한 정점을 생성하고, 고정 테스트는 그 순서를 핀합니다.

## 달리기 를 하는 것 은 무엇 을 증명 합니까?

한 실행은 하나의 빌드에서 한 입력을 증명한다. C 표준은 정의되지 않은 행동을 "이 문서가 요구사항을 부과하지 않는 휴대용 또는 잘못된 프로그램 구성 또는 잘못된 데이터의 사용에 따라 행동"이라고 정의합니다.`int`합법적으로 다른 결과를 인쇄할 수 있습니다`-O0`그리고`-O2`36강습은 이 문제를`percent_change`UBSan은 질문을 멈추게 합니다.`-fsanitize=signed-integer-overflow -fsanitize-trap=undefined`이 과잉은 "사냥 명령"을 실행하게 합니다.

최적화된 코드는 또한 당신이 보고 싶은 것을 이동합니다. GDB의 설명서는 "오피마이저는 코드를 재편했습니다. 디버거는 실제로 존재하는 것을 보여줍니다". 그리고 존재하지 않는 최적화된 변수는 "GDB는 결코 보지 않습니다". GDB는 다음과 같은 값을 인쇄합니다.`<optimized out>`, 그리고 그 원천은 그 원천을`<unavailable>`: 최적화된 "프로그램에 실제로 존재하지 않는다", 가용되지 않는 "프로그램에 존재한다 (기계 수준에서), 그러나 GDB는 그것을 얻을 수 있는 수단이 없다". lldb 인쇄 `<variable not available>`프로그램 카운터가 변수의 DWARF 위치 목록의 모든 범위를 벗어나면, 레지스터에 사는 로컬에서 감시 포인트는 결코 열리지 않습니다. 레지스터는 메모리가 아니기 때문에 `-O2`이 경로는 극단적인 사례를 보여 줍니다. 전체 기능이 접혀있었고, 결코 설정되지 않은 감시 지점의 침묵은 아무것도 증명하지 않습니다.

그래서 은 세 종류의 기록을 기록하고 네 번째 기록은 절대 하지 않습니다.`confirmed`- 테스트를 해 보고 동의하지 않는 한`refuted`이 이 이 이`not-observed`이 점에서는, 이 점의 첫 번째 두 가지 요소가`observed`권위 있는 기록`controlled-replay`그리고 제3자를 공개적으로 알려지지 않은 것으로 유지합니다.

## macOS에서 자신만의 빌드만 디버깅

애플 실리콘에 링크가 표시되어 있습니다.`ld(1)``-adhoc_codesign`: "Apple Silicon 바이너리용 기본값은 ad-hoc 코드 설계입니다". `codesign -dvvv account-O0`고착형의 인쇄에:

```text
Format=Mach-O thin (arm64)
CodeDirectory v=20400 size=387 flags=0x20002(adhoc,linker-signed) hashes=9+0 location=embedded
Signature=adhoc
TeamIdentifier=not set
```

`0x20002` `CS_ADHOC`(`0x2`) 더하기`CS_LINKER_SIGNED`(`0x20000`), "Linker에 의해 자동으로 서명"`codesign -d --entitlements -`실행 가능한 이름 뒤에 아무것도 인쇄하지 않습니다: 바이너리는 권한이 없습니다. lldb는 그것을 시작, 모든 틈새점을 타, 하드웨어 감시점을 설정하고, 코어를 작성,`DevToolsSecurity -status`"개발자 모드가 현재 비활성화되어 있다"고 보고하고 시스템 완전성 보호가 활성화되어 있다.

두 가지 권리들은 누가 무엇을 디버깅할 수 있는지 통제하고, 그들은 반대편에 앉아 있습니다.`com.apple.security.cs.debugger`디버거에 대한: "앱이 디버거인지 다른 프로세스에 연결되거나 작업 포트를 얻을 수 있는지 표시하는 볼 값".`debugserver`그 개인 형태를 가지고 있으며,`codesign -d --entitlements -`명령 줄 도구의 복사 목록에 `com.apple.private.cs.debugger``com.apple.private.set-exception-port``com.apple.private.thread-set-state`그리고`com.apple.private.logging.diagnostic`-`com.apple.security.get-task-allow`Xcode는 디버깅 빌드에 주입하고, 수출을 해제하고, 공인증권은 여전히 그것을 보유한 바이너리를 거부합니다. 애플의 엔지니어는 거부 규칙을 명시합니다. 목표가 가혹된 실행 시간을 활성화하고 있지 않은 경우 작업 포트가 거부됩니다.`get-task-allow`- 평평한`clang`이 상태에서, 이 상태는 가혹되지 않습니다.`codesign --options runtime`, 다시 서명해`codesign -s - -f --entitlements get-task-allow.plist`디버깅 전에

세 가지 더 많은 사실들이 섹션을 닫습니다. 첫째, 로그인 세션에서 처음으로 "개발자 도구 액세스이 계속 디버깅을 하기 위해 다른 프로세스를 제어해야 합니다".`sudo DevToolsSecurity -enable`             `admin`또는`_developer`그룹. 둘째, SIP를 비활성화하여 자신의 코드를 디버깅하지 않습니다. 애플은 "Xcode에서 앱을 실행하고 디버깅하려면 SIP를 비활성화할 필요가 없습니다".라고 말합니다.`csrutil enable --without debug`세번째로, 이 세션의 시트벨트 모래 상자는`task_for_pid`완전히, 그리고 고정 `sandbox-O0.lldb.txt`시작할 수 없는 경주는 환경적 사실이고, 배너스는 그 사실을 보고합니다.

이 수업의 모든 것은 당신이 컴파일한 프로그램에 적용됩니다. 동일한 명령어는 다른 프로세스에 가입할 경우만 해당 프로세스의 소유자가 참여하도록 할 것입니다. 그리고 여기서 어떤 것도 그것을 변경하는 방법을 가르치지 않습니다.

## 건설 해

디모를 실행하세요:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
```

출력은 저장된 전본에 대한 한 개의 JSON 보고서입니다. 각 빌드마다 해상도와 히트수단, 하드웨어 워치포인트 수, 각 스톱과 레지스터와 аргумент, 출력 상태, 프로그램의 출력, 인쇄된 오류 lldb, 그리고 그들의 판결과 증거 기록과 함께 주장을 목록에 올립니다. 핵심 회전, 파이썬 API 결과, 샌드박스 오류, 그리고 이 기계에 어떤 외부 도구가 없는지 추가합니다.

예상형:

```json
{
  "program": "account.c",
  "variants": {
    "O0": {
      "binary": "account-O0",
      "breakpoints": {"1": {"spec": "name=bump", "address": "0x1000004bc", "resolved": true, "hits": 1}, "...": "..."},
      "hardwareWatchpoints": 4,
      "watchpoints": {"1": {"address": "0x16fdfe00c", "size": 4, "type": "m", "hits": [[250, 255]], "hitCount": 1}},
      "stops": [{"index": 0, "pc": "0x1000004bc", "function": "bump", "kind": "entry", "registers": {"x0": "0x16fdfe008", "x1": "0x5"}, "...": "..."}],
      "exitStatus": 0,
      "claims": [{"id": "arg-registers", "verdict": "confirmed", "confirmed": 5, "refuted": 0, "not-observed": 0, "...": "..."}],
      "evidence": [{"claim": "arg-registers", "verdict": "confirmed", "stop": 0, "observation": "bump: x0 = 0x16fdfe008 and a = 0x000000016fdfe008, x1 = 0x5 and by = 5"}]
    },
    "O2": {"stops": [], "claims": [{"id": "calls", "verdict": "refuted", "...": "..."}], "...": "..."}
  },
  "core": {"savedAt": {"function": "bump", "pc": "0x1000004bc"}, "labelString": "", "...": "..."},
  "types": {"python": "3.9.6", "size": 32, "...": "..."},
  "sandbox": {"stops": 0, "errors": ["process exited with status -1 (attach failed ((os/kern) invalid address))"]},
  "absentTools": ["bpftrace", "gdb", "llvm-objdump", "ltrace", "rr", "strace"]
}
```

읽으세요`code/main.py`이 순서로:

1. `Listing``llvm-objdump -d`함수와 명령으로 텍스트를 입력하고,`Function.conditional_branches()`그 가지들을 발견하고 그 목표와 그 구멍을 뚫고
2. `struct_layout()`  `llvm-dwarfdump`문자
3. `lift_condition()`한 조건부 분자를 선사자로 바꾸는 것, 수업 34 단계`tbz``cbz`, 그리고 비교 및 분자 양식
4. `Plan.commands()`목록에서 lldb 명령 파일을 작성하고,`Plan.lldb_command()`배트 호출입니다.
5. `parse_transcript()`출력 순서를 따라가며 `Stop`레지스터, 메모리, 변수 및 시점 값과 함께 분단점 테이블 및 출력 상태의 기록
6. `claims_for()`8개의 주장을 명시하고,`evaluate()`      `_check_*`기능
7. `rollup()`주장에 대한 판결을 한 명으로 줄이고, 반박은 확정보다 우선입니다.
8. `capture()`그리고`capture_extras()``live()`새로운 구조에서 전체 루프를 반복합니다`clang`그리고`lldb`달릴 수 있어

네 가지 명령이 더 있습니다.`python3 code/main.py plan O0`빌드 파일의 명령 파일을 인쇄합니다.`python3 code/main.py commands`GDB 및 LLDB 테이블을 인쇄합니다. `python3 code/main.py tools`외부 도구가 어떤 보고서에 적용되었는지`PATH`-`python3 code/main.py live O0`컴파일`account.c`임시 디렉토리에 들어가서, 새로 나열된 목록에서 계획을 세우고, lldb를 실행하고, 그 실행에 대한 주장을 평가합니다. 모래 상자 안에 lldb가 프로세스를 시작하지 못했다고 보고하고, 오류로 1을 빠져나갑니다.

## 사용 하 고

이 순서대로 자신의 프로그램에서 배포를 사용하세요.

1. 이 을 만들어`-g`이중화, dSYM 또는 DWARF를 보관하고,`llvm-objdump -d`함께 문자 보내세요.
2. 실행하기 전에 요구사항을 작성하세요. 각각의 요구사항은 함수, 레지스터 또는 주소 또는 오프셋, 예상 값 또는 가장자리, 그리고 그로부터 온 교훈 또는 문서에 대해 명명합니다. 중지점을 보고 작성한 요구사항은 중지 내용을 설명하고 아무것도 테스트하지 않습니다.
3. 목록에서 계획을 생성하고 읽어보십시오. 그 모든 주소가 목록의 한 줄에 따라 추적되어야 합니다. 만약 그 줄이 없는 분단 지점이 있다면, 그것을 제거하십시오.
4. 배트 모드에서 한번 실행하고 명령 줄과 디버거 버전을 헤더에 보관합니다.
5. 매번 읽으세요`not-observed`확인을 읽기 전에 그 이유와 그 이유를 기록합니다. 그 이유들은 어떤 주장이 다른 입력, 다른 빌드, 또는 다른 브레이크포인트가 필요한지 알려줍니다.
6. 동일한 요구사항을 사용하여 최적화된 빌드를 실행하고 컴파일러가 입력된 null 샷을 가진 해제된 브레이크포인트를 예상하고 해당 요구사항을 열려있게 유지하십시오.
7. 확인된 기록과 반박된 기록들을 수업 35의 대책서에 입력하여`observed`, 권위`controlled-replay`1번의 정지 1번의 기록으로, 관찰되지 않은 것을 알려지지 않은 것으로 남겨두고,

## 인터랙티브 연구소

### 연구소 A: 손으로 멈추는 것을 읽어보세요

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program/code
python3 -q
```

실행:

```python
from main import *
t = load_transcript("session-O0.lldb.txt")
s = t.stops[0]
hex(s.pc), s.function, s.reason, s.registers
[hex(w) for w in s.memory[:8]]
s.struct_pointer().fields
```

두 번째 줄 전에, 250개 단어와 1.25.`struct.unpack("<d", struct.pack("<II", s.memory[4], s.memory[5]))`그리고 비교해 보세요.`t.stops[1].watch_hit`그리고`t.stops[1].pc`, 그리고 그 주소를 찾아보세요`account-O0.objdump.txt`: 그것은 가게 후에 명령입니다.

### 연구소 B: 지부 및 그 후계자

```python
plan = make_plan("O0")
plan.branches()
classify = plan.listing.function("classify")
[lift_condition(classify, b, "a->balance")[0] for b in plan.branches()]
[(hex(s.pc), s.struct_pointer().field_int("balance")) for s in t.stops_in("classify")]
```

각 가장자리 정류를 입국 정류에 맞추고 증거에 대해 보기 전에, 선사자가 예측하는 후계자를 결정하십시오.`[e.to_dict() for e in evaluate(plan, t, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim.startswith("branch")]`그리고 비교해 보세요.

### 실험실 C: 멈추지 않는 달

```python
o2 = load_transcript("session-O2.lldb.txt")
len(o2.stops), o2.exit_status, o2.hits()
o2.errors[:3]
make_plan("O2").branches()
rollup(evaluate(make_plan("O2"), o2, struct_layout(open("fixtures/account-O2.dwarfdump.txt").read(), "account")))
```

각 점에 대해 설명해 주십시오.`not-observed`네 말대로, 그리고 열어`account-O2.objdump.txt`그리고 네 개의 상수를 찾아내`main`전화가 대신해`DW_TAG_inlined_subroutine``account-O2.dwarfdump.txt``count_tags()`- 그래

### 연구소 D: 증거를 깨뜨리

```python
text = open("fixtures/session-O0.lldb.txt").read().replace("x1 = 0x0000000000000005", "x1 = 0x0000000000000006", 1)
broken = parse_transcript(text)
[e.to_dict() for e in evaluate(plan, broken, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim == "arg-registers"][:2]
```

한 개의 편집된 레지스터가 첫 번째를 돌립니다`arg-registers`기록`refuted`그리고 그 다음으로 4개의 항목이 남아있을 때`confirmed`그럼 `old value: 250`경비점 정지 직전 경비선`store-once``not-observed`실패할 수 없는 평가는 평가를 받지 않는 것입니다.

만약 Ildb가 당신의 껍데기에 프로세스를 시작할 수 있다면,`python3 main.py live O0`그리고`python3 main.py live O2`- 대리점은 정식식과는 다를 겁니다.

## 연습 실험실

                                                                               `sum_balances`- 그래

요구 사항:

-                                                                                                                                                                                                                                                                                                                    `sum_balances``-O0``conditional_branches()`그리고 루프 헤더에 브레이크포인트를 추가합니다.
- 헤더가 실행하는 주장을 추가합니다 `count + 1``count`= 3 이 되는데, 이 값은 레슨 33 뒷면과 출력 테스트입니다.
- 스톱 할크 또는 플랜을 확장하여 할크가 각 헤더 스톱에서 루프 카운터의 스택 슬롯을 읽게 하고`_check_loop()`반값의 순서를 기록하는
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `python3 main.py capture O0`Lldb가 실행할 수 있는 기계에서, 그리고 스위트를 다시 실행할 수 있습니다.
- 이번번번역에 한 개의 카운터 값을 편집하여 주장의 회전을 확인하는 테스트를 추가합니다 `refuted`- 그래

성공은 보고서는 헤더가 그들의 반값과 순서대로 멈추는 것을 나타냅니다.`-O2`랜은 새로운 주장을 유지합니다`not-observed`루프가 벡터화되거나 접혀있기 때문일 것이다.

## 교훈 유물

이 교훈은`outputs/skill-dynamic-analysis-of-your-own-program.md`. 당신이 만든 프로그램과 그 목록과 정적 주장의 목록을 저장된 디버거 전본과 각 주장에 대한 판결로 변환하는 데 사용하십시오. 각 판결을 생산한 정지 및 지켜지지 않은 모든 주장의 이유를 포함합니다. 클로드, 커서, 코덱스, 오픈클라, 헤르메스 또는 SKILL.md를 읽는 모든 에이전트에 적용됩니다.

## 확인 해 보

데모와 결정적 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

이 스위트는 Ildb 없이 실행되고,`code/fixtures/`검증은 증명해야 합니다

- 목록 분석기는 네 개의 함수를 그 범위와 두 가지 조건부 분자를 찾습니다.`classify``-O0`목표와 타격
- `tbz w8, #0x1f` `a->balance >= 0`그리고 `subs`더하기`b.le` `a->balance <= 200`
- `main``-O0`전화`bump``classify`3번, 그리고`sum_balances`그리고`main``-O2`전화만`printf`
- x86-64 `j<cc>`기술은 조건부이고`jmp`그리고`callq`그렇지 않습니다
- DWARF 덤프는 0, 4, 8, 16 및 24의 구성원들로 구성된 32 바이트 구조를 생성합니다.
- `-O2`DWARF에는 4개의 하위 프로그램과 0개의 인라인 하위 프로그램 항목이 있으며,`nm`여전히 세 가지 기능을 나열합니다
- 이 플랜은 두 빌드 모두에 대한 약속된 명령 파일과 같으며, 이 스크립트 헤더는 실행한 LLDB 명령어를 기록합니다.
- `-O0`이번 글은 예상되는 함수들, 출력 상태 0 및 네 개의 출력 라인에서 11개의 정지
-  출력 이 따라오는 정류에 부착되어 있습니다.`x1`= 5, 메모리 시작 `x0`, 그리고 라벨 문자열
- 분단점 표는 해상도와 타격수치가 1, 3, 1, 2, 1, 1, 1
- 시경점은 4 바이트 타입의 수정`x0 + 4`, 이전 값 250과 새로운 값 255으로 한 번 타격을 받았으며, 4 개의 하드웨어 슬롯이 보고되었습니다
- `-O2`이번 글은 0번의 정지, 0번의 타격과 3번의 해제된 브레이크포인트, 감시포인트가 없고, 사용되지 않은 한번에 1번의 오류가 있습니다.`continue`
- 샌드박스 출동이 결함이 있어 정지 전에 실패
- 원자회로 여행은 뒤로 물러나고`balance`= 250 그리고 뒤에 있는 끈을 잃게 됩니다`label`
- 파이썬 API는 5개의 필드를 읽습니다. 크기는 32이고 함수는 프로세스가 없는 범위입니다.
- 손으로 작성된 x86-64번의 기록을 분석합니다`rdi``rsi`그리고`rip`
- 모든 주장은 확인됩니다`-O0`5, 11, 3, 2, 1, 1, 1 기록
- 지부 증거는 값, 조건, 가장자리
- 필드 오프셋 증거는 DWARF 레이아웃을 통해 단어를 해독합니다
- 저장소와 단계 증거는 새 값과 세 줄의 균형을 가지고 있습니다
- `-O2`실행은 호출 가장자리를 반박하고 다른 주장을 무시합니다
- 편집된 레지스터 값이 반증되고 삭제된 시점 타격이 관찰되지 않으며 반증된 값이 롤업을 획득합니다
- 명령 지도에는 각 라인마다 gdb 및 lldb 양식이 있으며 하드웨어 테이블에는 4 개의 x86 디버그 레지스터가 있습니다
- 데모는 실패하는 대신 없는 도구를 목록으로 표시하고, 라이브 모드는 실종된 도구를 이름으로 보고합니다.
- 이 두 세션에서 나온 수치 데이터는 사이트 모듈에서 동일한 데이터를 포함합니다

## 생산 실패 모드

| Failure | What the weak report says | What the harness must prove |
|---|---|---|
| Resolved breakpoint with zero hits | "the function runs" or "the function is dead" | a full run with exit status, hit counts, and the verdict `refuted` for the call edge only |
| Register read at the wrong stop | "`x1` = 5 inside `classify`" | compare only declared arguments at the entry stop |
| Struct read without offsets | a column of hex words | every word mapped to a `DW_AT_data_member_location` and compared with `frame variable` |
| Branch graded from the mnemonic | "`tbz` means taken when negative" | the lifted predicate from the encoding and the stop at the successor |
| Watchpoint on a register-resident local | "no write happened" | the watchpoint was set on an address and was hit, or the record is `not-observed` |
| Auto-continue breakpoints | a clean transcript with no stops | plain breakpoints, a stop hook, and a continue budget |
| Address breakpoint without a module | `unresolved, hit count = 0` | `-s MODULE` so the listing address resolves to a load address |
| First command error ends the batch | no `breakpoint list` at the end | `interpreter.stop-command-source-on-error false` |
| Stack-style core read as full memory | `label = ""` reported as the program's value | the core style, the pointer, and the segment it points into |
| Sandboxed shell | "lldb is broken" | `attach failed ((os/kern) invalid address)` recorded as an environment fact |
| Hardened target without `get-task-allow` | "macOS forbids debugging" | the two conditions from Apple's rule, and a re-sign of your own binary |
| Transcript discarded after grading | verdicts with no source | the transcript file, its command line, and the debugger version |

## 운영 규칙

목록에서 정지하는 것을 계획하고, 배트 모드에서 한 번 실행하고, 발음을 유지하고, 테스트 할 수있는 모든 정지에서 모든 정적 주장을 평가하십시오. 정지에서 확인하거나 반박하는 것을 작성하고, 타격 수와 이유를 사용하여 관찰되지 않은 것을 작성하고, 실행에 해결 된 분기점을 결코 정지하지 마십시오. 당신이 만든 빌드만 디버깅하십시오.

## 더 많은 읽기

- [LLDB Tutorial: command grammar, breakpoints, watchpoints, stop hooks](https://lldb.llvm.org/use/tutorial.html)
- [lldb(1) manual page: --batch, --one-line, --source, --core](https://lldb.llvm.org/man/lldb.html)
- [GDB to LLDB Command Map](https://lldb.llvm.org/use/map.html)
- [LLDB Python Reference: SBTarget, SBFrame, SBValue, and the embedded interpreter](https://lldb.llvm.org/use/python-reference.html)
- [LLDB Caveats: the Python build lldb links against](https://lldb.llvm.org/resources/caveats.html)
- [LLVM 23.1.3 release](https://github.com/llvm/llvm-project/releases/tag/llvmorg-23.1.3)
- [GDB 18.1 release announcement, 2026-09-25](https://sourceware.org/pipermail/gdb-announce/2026/000150.html)
- [GDB manual: Process Record and Replay](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Process-Record-and-Replay.html)
- [GDB manual: Debugging Optimized Code](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Optimized-Code.html)
- [GDB wiki: Permissions on Darwin, code signing a debugger](https://sourceware.org/gdb/wiki/PermissionsDarwin)
- [gdb-patches: Initial AArch64-Darwin support series, October 2025](https://sourceware.org/pipermail/gdb-patches/2025-October/222196.html)
- [Homebrew gdb formula pull request adding arm64 bottles](https://github.com/Homebrew/homebrew-core/pull/209753)
- [ptrace(2), Linux manual page](https://man7.org/linux/man-pages/man2/ptrace.2.html)
- [lldb debugserver MachTask.mm: task_for_pid and task_set_exception_ports](https://github.com/llvm/llvm-project/blob/main/lldb/tools/debugserver/source/MacOSX/MachTask.mm)
- [Intel SDM Volume 2: INT n, INTO, INT3, INT1](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Intel SDM Volume 3: debug registers DR0 to DR7 (Debug, Branch Profile, TSC, and Resource Monitoring Features)](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Arm A64 ISA: BRK, Breakpoint instruction](https://developer.arm.com/documentation/ddi0602/latest/Base-Instructions/BRK--Breakpoint-instruction-)
- [Arm A64 ISA: TBZ, Test bit and branch if zero](https://developer.arm.com/documentation/ddi0602/latest/Base-Instructions/TBZ--Test-bit-and-branch-if-zero-)
- [Arm Architecture Reference Manual, D2.9 Watchpoint exceptions](https://developer.arm.com/documentation/ddi0487/latest/)
- [Apple ld(1): -adhoc_codesign](https://keith.github.io/xcode-man-pages/ld.1.html)
- [Apple ld64 LinkEdit.hpp: CS_LINKER_SIGNED](https://github.com/apple-oss-distributions/ld64/blob/59a99ab60399c5e6c49e6945a9e1049c42b71135/src/ld/LinkEdit.hpp)
- [Apple: Debugging Tool Entitlement, com.apple.security.cs.debugger](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.cs.debugger)
- [Apple: Hardened Runtime](https://developer.apple.com/documentation/security/hardened-runtime)
- [Apple: Resolving common notarization issues, the get-task-allow entitlement](https://developer.apple.com/documentation/security/resolving-common-notarization-issues)
- [Apple: Disabling and Enabling System Integrity Protection](https://developer.apple.com/documentation/security/disabling-and-enabling-system-integrity-protection)
- [Apple Developer Forums: debugserver may not get the taskport of a hardened process](https://developer.apple.com/forums/thread/127544)
- [Apple DevToolsSecurity(8)](https://keith.github.io/xcode-man-pages/DevToolsSecurity.8.html)
- [Apple core(5)](https://keith.github.io/xcode-man-pages/core.5.html)
- [Apple Technical Note TN2124: Mac OS X Debugging Magic, core dumps](https://developer.apple.com/library/archive/technotes/tn2124/_index.html)
- [lldb `process save-core` help text](https://github.com/llvm/llvm-project/pull/143126)
- [core(5), Linux manual page](https://man7.org/linux/man-pages/man5/core.5.html)
- [coredumpctl(1)](https://man7.org/linux/man-pages/man1/coredumpctl.1.html)
- [Apple dtrace(1)](https://keith.github.io/xcode-man-pages/dtrace.1.html)
- [Apple dtruss(1m)](https://keith.github.io/xcode-man-pages/dtruss.1m.html)
- [strace releases](https://github.com/strace/strace/releases)
- [ltrace](https://ltrace.org/)
- [bpftrace CHANGELOG](https://github.com/bpftrace/bpftrace/blob/master/CHANGELOG.md)
- [rr project](https://rr-project.org/)
- [rr 5.9.0 release](https://github.com/rr-debugger/rr/releases/tag/5.9.0)
- [rr wiki: Building And Installing, hardware and VM requirements](https://github.com/rr-debugger/rr/wiki/Building-And-Installing)
- [Clang UndefinedBehaviorSanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)
- [ISO/IEC 9899:2024 working draft N3220, clause 3.5 undefined behavior](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3220.pdf)
- [DWARF Debugging Information Format Version 5](https://dwarfstd.org/doc/DWARF5.pdf)
- [Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64)](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI)
