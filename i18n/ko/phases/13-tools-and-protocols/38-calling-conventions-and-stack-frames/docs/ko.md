# 컨벤션 및 스택 프레임 호출: 시스템 V, 윈도우 x64, AArch64

> 분산은 어떤 레지스터가 어떤 함수를 읽는지 보여줍니다. ABI는 그 레지스터가 무엇을 의미하는지 only ABI는 말합니다. ABI는 객체 헤더에 의해 선택됩니다. 그래서 이 수업은 먼저 헤더를 읽고 그 곳에 넣은 규칙에 따라 모든 레지스터를 검사합니다.

**Type:** Build
**Languages:** Python, C, x86-64 and AArch64 assembly
**Prerequisites:** Phase 13 · 32 (ELF from scratch), Phase 13 · 33 (disassembly and control flow)
**Time:** ~140 minutes

## 학습 목표

- 객체 헤더에서 호출 컨벤션을 선택하십시오: ELF x86-64는 System V psABI, COFF AMD64는 Microsoft x64, ELF AArch64는 AAPCS64, Mach-O arm64는 Apple의 변형입니다.
- 각 ABI에 대한 하나의 함수의 바이트에 의한 바이트의 전두표를 해독하고 저장된 모든 레지스터, 반환 주소가, 프레임 포인터는 입력 스택 포인터에서 그 오프셋에 배치합니다.
- 함수의 매개 변수 레지스터를 작성하기 전에 읽은 레지스터에서 입력하고, 입력 스택 포인터의 위의 로드에서 스택 аргумент 슬롯을 입력합니다.
- 마이크로소프트 x64의 위치 슬롯에서 시스템 V의 독립 레지스터 순서들을 말하며, AAPCS64의 NGRN와 NSRN 카운터에서 모두 말하며
- 모든 추론을 원본 서명, 사양의 규칙, 컴파일러의 자체 풀 데이터에 대한 확인`.pdata``.xdata`그리고`.eh_frame`- 그래
- 기드라, IDA, 바이너리 닌자, 라다레2, 리진, 그리고 아그르의 이름을 비교하고 같은 사실을 복구하고 출력이 소스와 일치하지 않는 부분을 기록하십시오.

## 문제

당신은 `convention.c`리눅스 x86-64에`-O2`그리고 radare2 6.2.4에 대해 요청했습니다.`eight_args`7번으로 답했습니다`rdi``rsi``rdx``r8``r9``rsp+0x8`그리고`rsp+0x10`C 소스는 8개의 매개 변수를 가지고 있습니다.`%rcx`정확히 한 번,`leaq (%rdx,%rcx), %rax`, 그리고 도구의 변수 복구에는 주소 안에만 나타나는 레지스터가 포함되지 않았습니다.

그러면 리진 0.9.1에서 같은 파일의 Windows 버드를 열었습니다.`amd64`그리고 발견`r8``rcx``rdx`COFF라는 객체, 그래서 컨벤션은 Microsoft x64이고, 네 번째 레지스터는`r9`두 도구는 같은 소스에서 다른 레지스터를 놓치고 있습니다.

목록은 명령의 순서입니다. 호출 협약은 목록 이외에 사는 계약입니다: 등록은 어떤 레지스터를 가지고 있으며, 호출자는 보존해야하며, 반환 주소와 스택 논쟁이 어디에 위치하고 있으며, 호출자가 스택 포인터 위에 남겨야 하는 것입니다. 여기서 중요한 계약은 네 개의 문서로 정의됩니다. 시스템 V AMD64 psABI (버전 1.0, 2025년 3월 12일 빌드) 3.2.1~3.23 섹션 마이크로소프트 x64 호출 컨벤션, 스택 사용 및 프리로그 및 에필로그 페이지 (2018-12-17에서 2025-03-19까지 페이지 날짜) AAPCS64 팔의 2025Q4 (2026년 1월 23일) 6.1~6.9부와 애플의 arm64 플랫폼 메모 이 수업은 그 규칙을 읽고, 세 가지 방법으로 컴파일된 C 파일에 적용하고, 리스트를 체크된 매개 변수 위치, 저장된 레지스터 및 프레임 오프셋 목록으로 변환하는 분석기를 구축합니다.

```figure
re-38-three-frames
```

## 한 명칭 이 규칙 을 선택 한다

`convention.c`12개의 기능을 가지고 있습니다.`leaf_add``eight_args``mixed``by_value``big_ret``sum_varargs``keeps`, 그리고 5명의 전화가`extern`같은 모양의 기능이 있습니다.`long long`왜냐하면`long`MSVC 목표에서 4 바이트, 다른 경우에는 8 바이트, 그리고 크기의 변경 컨벤션을 변경하는 구조입니다.`-target x86_64-unknown-linux-gnu``x86_64-pc-windows-msvc`그리고`aarch64-unknown-linux-gnu``-O0`그리고`-O2`그리고`arm64-apple-macos``-O2`. 리눅스나 윈도우 헤더가 설치되어 있지 않아 파일은 필요한 것을 선언하고 클랜그 자체만 포함합니다 `stdarg.h`그리고`stddef.h`- 그래

`describe_object()``code/main.py`4바이트 마법 번호와 1개의 기계 필드를 읽고 계약 이름을 붙인다:

| Header | Field | Value | Rulebook |
|---|---|---|---|
| `7f 45 4c 46` ELF | `e_machine` at offset 0x12 | 62 | System V AMD64 psABI |
| `64 86` COFF | `Machine` at offset 0 | 0x8664 | Microsoft x64 |
| `7f 45 4c 46` ELF | `e_machine` | 183 | AAPCS64 |
| `cf fa ed fe` Mach-O 64 | `cputype` at offset 4 | 0x0100000c | AAPCS64 with Apple differences |

다음 표의 거의 모든 줄에 있어서 세 개의 계약은 일치하지 않습니다. 각 값은 헤더 줄에 지정된 문서에서 인용되며, 각각의 값은 고정관념에 대한 테스트로 확인됩니다.

| Rule | System V psABI | Microsoft x64 | AAPCS64 |
|---|---|---|---|
| Integer arguments | `%rdi %rsi %rdx %rcx %r8 %r9`, next free register | `RCX RDX R8 R9`, by position | `x0` to `x7`, by NGRN |
| Floating-point arguments | `%xmm0` to `%xmm7`, next free register | `XMM0` to `XMM3`, by position | `v0` to `v7`, by NSRN |
| Integer result | `%rax`, then `%rdx` | `RAX` | `x0`, then `x1` |
| Floating-point result | `%xmm0`, then `%xmm1` | `XMM0` | `v0` |
| Result too large for registers | address passed in `%rdi` "as if it were the first argument", returned in `%rax` | pointer in `RCX`, arguments shifted right, returned in `RAX` | address in `x8`, `x0` to `x7` untouched |
| Callee-saved | `%rbp %rbx %r12` to `%r15` | `RBX RBP RDI RSI RSP R12` to `R15`, `XMM6` to `XMM15` | `r19` to `r29`, `SP`, low 64 bits of `v8` to `v15` |
| First stack argument on entry | `8(%rsp)` | `40(%rsp)`, above a 32-byte shadow store | `0(sp)` |
| Below the stack pointer | 128-byte red zone | "considered volatile" | no red zone (Apple: 128 bytes) |
| Alignment at the call | `(%rsp + 8)` multiple of 16 on entry | 16-byte aligned outside prolog and epilog | `SP mod 16 = 0` |
| Variadic marker | `%al` holds an upper bound on vector registers used | floats duplicated in the integer register | none in registers; Apple uses 8-byte stack slots |

## 시스템 V: 독립된 레지스터 세퀀스 2개와 빨간 구역

psABI 3.2.3는 각 논증의 8바이트를 INTEGER, SSE, 또는 MEMORY로 분류하고, 상호작용하지 않는 두 목록에서 레지스터를 할당합니다. "INTEGER"는 "%rdi, %rsi, %rdx, %rcx, %r8 및 %r9의 순서의 다음 사용 가능한 레지스터"를 취합니다. SSE는 `%xmm0` `%xmm7`"논론의 8바이트에 대한 레지스터가 없는 경우, 전체 논문은 스택에 전달된다"고, 메모리 논문은 "스택에 역 (우측~왼쪽) 순서로 밀어붙인다".

`eight_args(a, b, c, d, e, f, g, h)``-O2`이 값은 27 바이트입니다.

```text
      10: 48 01 fe                     	addq	%rdi, %rsi
      13: 48 8d 04 0a                  	leaq	(%rdx,%rcx), %rax
      17: 48 01 f0                     	addq	%rsi, %rax
      1a: 4c 01 c0                     	addq	%r8, %rax
      1d: 4c 01 c8                     	addq	%r9, %rax
      20: 48 03 44 24 08               	addq	0x8(%rsp), %rax
      25: 48 03 44 24 10               	addq	0x10(%rsp), %rax
      2a: c3                           	retq
```

6개의 레지스터, 그리고 2개의 로드`8(%rsp)`그리고`16(%rsp)`. psABI의 그림 3.3에서 "메모리 정수 8바이트 0"를 `16(%rbp)`언제`%rbp`프레임 기반입니다.`8(%rsp)`모든 밀림 전에 입구에 들어가면`g`8시입니다`h`16살 때

`mixed(int i, double d, long long l, float f)`두 개의 리스트를 보여 줍니다.`%edi`그리고`%rsi`, 1 및 2 INTEGER 레지스터.`%xmm0`그리고`%xmm1`, 1 및 2 SSE 등록.`cvtsi2sd %edi, %xmm2`그리고`%xmm2`함수가 읽기 전에 작성하는 스크래치 레지스터입니다.`cvtsi2sd`3번째 부동소수점 논리를 발명한 것처럼,`mixed``(double arg1, double arg2, double arg3)``xmm0``xmm1``xmm2`- 그래

`by_value(struct pair p)`16바이트 구조를 2 INTEGER 8바이트로 통과합니다`%rdi`그리고`%rsi`, 그리고 같은 방법으로 반환합니다:`leaq 0x1(%rdi), %rax; leaq -0x1(%rsi), %rdx; retq`-`big_ret(long long seed)`32 바이트를 반환합니다. 이는 클래스 메모리입니다. 그리고 psABI는 "콜러는 반환 값에 공간을 제공하고 이 저장소의 주소를 %rdi로 전달합니다. 마치 첫 번째 논증처럼".`seed``%rsi`, 그리고 함수는 `movq %rdi, %rax`왜냐하면 "%rax는 %rdi에서 호출자가 입력한 주소를 포함합니다".

빨간색 영역은 System V의 다른 서명입니다. psABI 3.2.2: "%rsp로 표시된 위치 이외의 128-바이트 영역은 예약된 것으로 간주되며 신호 또는 인터럽트 핸들러에 의해 수정되지 않습니다".`-O0``eight_args` `pushq %rbp; movq %rsp, %rbp`그리고 6개의 가게를 `-0x8(%rbp)` `-0x30(%rbp)``subq`매장은 스택 포인터보다 48바이트 아래로 위치해 있습니다`-O2``sum_varargs`88 바이트를 배정합니다`subq $0x58, %rsp`그리고 그 다음에는 레지스터 저장 영역을 `-0x58(%rsp)``-0x80(%rsp)`: 128 바이트 아래 스택 포인터, 전체 빨간 영역. 같은 파일을 만들 `-mno-red-zone`그리고`leaf_add``pushq %rax`그리고`addq $0x8, %rsp`8바이트의 현지인을 스택 포인터 위에 보관할 수 있습니다.

바리아디크 호출은 하나의 레지스터를 추가합니다. "%al는 사용된 벡터 레지스터의 수를 지정하기 위해 숨겨진 주장으로 사용됩니다". 0에서 8까지의 상위 경계. `call_varargs``xorl %eax, %eax``-O2`그리고`movb $0x0, %al``-O0`-`sum_varargs`먼저 읽어보세요:`testb %al, %al; je`8번을 건너가`movaps %xmmN`벡터 레지스터가 사용되지 않은 경우 저장합니다.

## 마이크로소프트 x64: 위치, 그림자 스토어, 빨간 구역이 없습니다

마이크로소프트 규칙은 위치적이다. "전체 arguments are passed in registers RCX, RDX, R8, and R9. 부동의 포인트 arguments are passed in XMM0L, XMM1L, XMM2L, and XMM3L. "그리고 "첫 번째 네 개의 매개 변수에서 부동의 포인트 및 두 배의 정확성 arguments are passed in XMM0 - XMM3, depending on position". 같은 `mixed``%ecx``%xmm1``%r8``%xmm3`: 슬롯 0는 int, 그래서 `RCX`; 슬롯 1은 더블, 그래서 `XMM1`; 슬롯 3는 떠 있는 것, 그래서 `XMM3`-`XMM0`그리고`XMM2`빈 채로

호출자는 또한 공간을 떠나야 합니다. " 호출자는 항상 네 개의 레지스터 매개 변수를 저장할 충분한 공간을 할당해야 합니다. 심지어 호출자가 그렇게 많은 매개 변수를 취하지 않더라도". 페이지들은 그것을 그림자 저장소 또는 홈 주소라고 부르며, 네 개의 슬롯은 "실제로 호출 함수의 소유입니다". 입문 `0(%rsp)`반환 주소가,`8(%rsp)` `39(%rsp)`4개의 집들이 있고, 첫 번째 겹판 논쟁은`40(%rsp)`-`eight_args``-O2`읽는다`0x28(%rsp)``0x30(%rsp)``0x38(%rsp)``0x40(%rsp)`: 40, 48, 56, 64

전화자 측은 수학적 결과를 보여줍니다.`call8``-O2` `subq $0x48, %rsp`그리고 5, 6, 7, 8의 매장을 `0x20(%rsp)` `0x38(%rsp)`이전`movl $1, %ecx`72 바이트는 그림자 저장소 32개, 32개는 4개의 스택 аргумент, 8개는 16바이트의 경계에서 반환 주소가 되는 것입니다.`call_varargs`단지 논증을 등록하고 여전히 할당합니다`subq $0x28, %rsp`: 32개 그림자 저장소 8개 조율`keeps`3개의 비휘발성 레지스터 (24 바이트) 를 밀어 넣고`subq $0x20, %rsp`그래서`ext`복귀 주소 아래 32바이트 그림자 저장소를 찾습니다.

스트럭트는 자신의 규칙을 따르고 있습니다. "8 바이트에 맞지 않는 모든 주장, 또는 1, 2, 4, 또는 8 바이트가 아닌 것은 참조로 통과되어야합니다".`by_value`따라서 `%rdx`, 숨겨진 결과 포인터 후 `%rcx`: "콜러는 반환 값에 대한 메모리를 할당하고 첫 번째 주장으로 포인터를 전달해야 합니다. 나머지 주장은 다음으로 오른쪽으로 한 주장을 이동합니다". `call_pair``0x20(%rsp)``movaps`, 통과`leaq 0x20(%rsp), %rdx`, 결과 버퍼를 통과합니다`leaq 0x38(%rsp), %rcx`, 그리고 읽습니다`.b``0x40(%rsp)`- 그래

빨간 영역은 없습니다. "RSP의 현재 주소를 넘어 모든 메모리는 변동적이라고 간주됩니다. OS 또는 디버거는 사용자 디버깅 세션 또는 인터럽트 핸들러에서 이 메모리를 덮어 쓸 수 있습니다".`-O0` `leaf_add`8바이트의 현지인이 필요하고,`pushq %rax`입국 시`popq %rcx`이전`retq`, 2개의 단일바이트 명령어 대신`subq`그리고`addq`. 스택 사용 페이지에서는 이렇게 할 수 있는 페이지를 정의합니다. "페이지 함수는 함수 테이블 항목이 필요하지 않습니다. RSP를 포함한 비휘발성 레지스터에 변경을 할 수 없습니다".

"바리아디크는 그들의 레지스터를 홈으로 부르고 있다. 바리아디크 또는 프로토타입 없는 함수들에 대해서는 모든 부동점 값은 해당 일반적 목적 레지스터에 복제되어야 한다". `sum_varargs``-O2`매장`%rdx``%r8``%r9` `0x18(%rsp)``0x20(%rsp)``0x28(%rsp)`한 번 후에`pushq %rax`, 즉 16, 24, 32의 입력 콤프레이스: 두 번째, 세 번째, 네 번째 레지스터 매개 변수들의 집.`va_list` `leaq 0x18(%rsp), %rax`, 집`%rdx`, 첫 번째 이름 없는 논쟁

## AAPCS64 및 애플이 변화하는 것

AAPCS64 6.8.2는 두 개의 카운터와 함께 규칙 목록을 진행합니다. C.9: 통합 주장 "x[NGRN]에서 가장 적은 비트에 복사된다" 및 NGRN 인krement. C.1는 NSRN와 부동 포인트 주장에 동일합니다. C.12: 최대 량의 복합`8 - NGRN`이중 단어 는 "열차 일반 용도의 레지스터 로 복사" 됩니다. C.13 는 "NGRN 는 argument stack 에 들어가면 8"로 설정 됩니다. 따라서 그 후 레지스터 로 아무것도 반환 되지 않습니다. `eight_args`사용 `x0` `x7`그리고 을 만지지 않는다`mixed` `w0``d0``x1``s1`-`by_value` `x0`그리고`x1`내보내서

6.9는 레지스터에서 전달되는 결과 "이 동일한 레지스터에서 반환된다"라고 말합니다. 그렇지 않으면 "메모리 블록의 주소는 x8 함수에 추가적인 주장으로 전달된다".`big_ret`글쓰기`str x0, [x8]``stur q0, [x8, #0x8]``str x9, [x8, #0x18]`그리고 절대 쓰지 않습니다`x0`-`call_big`집합 `mov x8, sp`그리고`seed`안 돼`x0`, 6.9에 "Callee가 x8에 저장된 값을 보존할 필요가 없다"고 추가하고 있습니다.`x8`논쟁의 기록 중 하나가 아닙니다.

6.1.1: "하루틴 호출은 r19-r29 및 SP의 레지스터의 내용을 보존해야 한다". 6.4.5.2: 공개 인터페이스 "SP mod 16 = 0". 스택은 완전히 내려가며 "무엇이 읽거나 쓰기 위해 비활성 영역에 액세스 할 수 없습니다".`-O0` `leaf_add`배출`sub sp, sp, #0x10`8바이트의 지역 주민들이 빨간색 영역을 사용했던 시스템 V

6.4.6는 프레임 레코드를 정의합니다. "더더더에 있는 두 개의 64 비트 값의 프레임 레코드... 가장 낮은 주소 두 단어로 이전 프레임 레코드를 가리키는 것이고 가장 높은 주소 두 단어로서는 현재 함수에 입력하면 LR에서 전달된 값을 포함합니다".`keeps``-O2`리눅스에서 기록은 아래쪽에 있습니다`stp x29, x30, [sp, #-0x30]!; mov x29, sp`. 같은 기능`-O0``sub sp, sp, #0x20; stp x29, x30, [sp, #0x10]; add x29, sp, #0x10`- 그래

애플의 arm64 메모는 레지스터와 조렬을 유지하며 프레임, 빨간 영역 및 변동 호출을 변경합니다. " 프레임 포인터 레지스터 (x29) 는 항상 유효한 프레임 기록을 다루어야합니다. 잎 기능 또는 꼬리 호출과 같은 일부 기능은 이 목록에 항목을 만들지 않기로 선택할 수 있습니다. "`keeps`절약합니다`x22, x21, x20, x19`첫 번째로 기록하고,`stp x29, x30, [sp, #0x20]; add x29, sp, #0x20`"플랫폼 리저브 레지스터 x18. 이 레지스터를 사용하지 마십시오". "ARM64 레드 영역은 스택 포인터 바로 아래에 있는 128 바이트로 구성되어 있습니다".`sub sp, sp, #0x10``-O0`이 문자는 "8 바이트 스택 슬롯의 적절한 숫자에" 지정되어 있고 "va_list는 char*의 별명이다".`call_varargs`애플 매장 10, 20, 30까지`[sp]``[sp, #8]``[sp, #0x10]`그리고 지나가만`w0`; 리눅스 빌드 통과 `w1``w2``w3`그리고 `b extva`- 사과`sum_varargs`읽는다`add x8, sp, #0x10`, 호출자의 스택 포인터, 그 `va_list`; 리눅스 `sum_varargs`절약합니다`x1` `x7`그리고`q0` `q7`224 바이트 프레임으로 구성되어 구조 필드를 초기화합니다 `__gr_offs`-56까지`__vr_offs`1개로 -128`mov x8, #-0x38; movk x8, #0xff80, lsl #32`- 그래

기호도 다르죠. 마흐-오는 C 기호를`_`, 그래서 목록에서 보여`_keeps`첫 번째 함수는 사설 표기 아래 나타납니다`ltmp0`분석기에는 표기 표를 통해 표를 다시 이름 붙인다.

## 한 번의 선구문을 손으로 세 번 해독

`keeps(int n)`전화`ext(i)`속으로 계속`n``i`그리고`acc`모든 ABI가 레지스터를 저장해야 합니다.`-O2`각 목표에 맞춰서

시스템 V, 4 바이트:

1. `55` `push r64`아래 3비트에 있는 레지스터: `50 + 5``%rbp`깊이 8`%rbp`입력 오프셋 -8에서 저장됩니다.
2. `41 56`이 책:`41`REX가 `B` 집합`56` `50 + 6`. REX.B는 6에서 14까지 확장됩니다.`pushq %r14`- 16분
3. `53` `50 + 3`이 책:`pushq %rbx`-24분

3번의 누르는 값은 24바이트입니다. 반환 주소는 8을 더하고 32는 16의 곱하기입니다.`callq ext`                         `subq`- 아니 `movq %rsp, %rbp`이 빌드에는 프레임 포인터가 없습니다.`%rbp`그 은 은 은`acc`(`xorl %ebp, %ebp``addl %eax, %ebp`에피로그는 거울입니다.`5b 41 5e 5d c3`- 그래

마이크로소프트 x64, 7 바이트:

1. `56` `pushq %rsi`-8에서`57` `pushq %rdi`- 16분`53` `pushq %rbx`-24. 여기 세가지 모두 비휘발성이고`RDI`그리고`RSI`제5제도의 논증 등록장이었죠.
2. `48 83 ec 20`: REX.W, opcode `83 /5`8비트 직속 ModRM`ec` `11 101 100`이 책:`subq $0x20, %rsp`깊이 56

56 + 반환 주소는 64입니다. 32 바이트는 그림자 저장소입니다.`ext`에피로그 페이지에서는 "RSP, 컨스탄트 또는 레아 RSP, 컨스탄트[FPReg]를 추가할 수 있으며, 그 다음에는 0 또는 더 많은 8 바이트 레지스터 팝업과 반환 또는 jmp의 일련의 바이트가 있습니다".`48 83 c4 20 5b 5f 5e c3`- 그래

AArch64, 16바이트 4개의 단어로, 작은 엔디안:

1. `a9bd7bfd` `stp`사전 지수를 가진 비트 31:30`10`64비트 레지스터를 선택, 비트 25:23 `011`pre-index을 선택하면, bit 22는 저장하기 위해 0입니다.`1111010`, 즉 -6, 8으로 확장된 -48. 14:10의 Rt2는 30입니다.`sp`), Rt 4:0는 29.`stp x29, x30, [sp, #-0x30]!`: 스택 포인터는 48으로 떨어집니다.`x29`-48로 올라갑니다.`x30`-40까지
2. `f9000bf5` `str`8으로 확장된 서명되지 않은 12 비트 오프셋으로: im12는 21:10에 2입니다. Rn는 `sp`, Rt는 21입니다.`str x21, [sp, #0x10]`- 32번 출입상태
3. `910003fd` `add`즉각: imm12 = 0, Rn = `sp`Rd는 29입니다`mov x29, sp`: 프레임 포인터는 -48에서 기록에 표시됩니다.
4. `a9024ff4` `stp`서명된 오프셋: imm7는 4, 32까지 확장됩니다. Rt2는 19, Rt는 20. `stp x20, x19, [sp, #0x20]`이 책:`x20`-16,`x19`-8

프레임은 48 바이트:`x29`0에서`x30`8시`x21`16배트, 8바이트, 24배트`x20`32세 때`x19`기록의 가장 낮은 단어는 이전 기록에 지향하고 다음 단어는 6.4.6의 요구에 따라 LR를 가지고 있습니다.`cmp w0, #0x1`첫 번째 저장소와 두 번째 저장소 사이에 위치하고 있습니다. 스케줄러는 프롤로그에 이동하고 분석기는 스택 작업 사이의 비교 또는 수학적 명령어를 용납합니다.

## 컴파일러 는 두 번 같은 사실 을 기록 하였다

선두 분석은 하나의 추리입니다. 컴파일러는 디위더를 위해 두 번째를 발사합니다. 두 가지가 동의해야 합니다.

윈도우에서 두 번째 파생은`.pdata`그리고`.xdata`- 을 만들`-O2` 없는 객체`-fno-asynchronous-unwind-tables`그리고`llvm-objdump -h`쇼`.xdata`0x34 바이트의`.pdata`0x48 바이트의 0x48는 72, 6`RUNTIME_FUNCTION`12바이트의 항목은 3개 `IMAGE_REL_AMD64_ADDR32NB`6개는 모두`sum_varargs``keeps``call8``call_varargs``call_pair`그리고`call_big`. 나머지 6개의 함수는 잎이고 예외 처리 페이지에는 "색이 함수 테이블 항목을 찾지 못하면 코드는 잎 함수의 일부로 가정되며, RSP는 직접 반환 포인터를 가리키고 있습니다".

`.xdata`바이트`keeps``01 07 04 00 07 32 03 30 02 70 01 60`-`UNWIND_INFO`3 비트 버전과 5 비트 플래그: 버전 1, 플래그 없습니다. 크기가 7입니다. CountOfCodes는 4, 프레임 레지스터와 프레임 오프셋은 0. 각 `UNWIND_CODE`이 문자는 선두에서 오프셋과 오프코드와 정보의 바이트를 가지고 있습니다.`07 32`: 오프셋 7에서, 오프셋 2은`UWOP_ALLOC_SMALL`, 정보 3는`3 * 8 + 8 = 32`바이트`03 30`: op 0은`UWOP_PUSH_NONVOL`, 레지스터 3는`rbx`-`02 70`이 책:`rdi`-`01 60`이 책:`rsi`. 코드는 실행 순서로 저장되며, 바이트와 동일한 3 번의 푸시와 같은 32 바이트 할당을 지정합니다 `56 57 53 48 83 ec 20`- `sum_varargs`입력은`01 01 01 00 01 02 00 00`: 1바이트의 단 하나의 코드`UWOP_ALLOC_SMALL`8바이트의 경우, 이렇게 윙어에서 볼 수 있습니다.`pushq %rax`: 할당금, 왜냐하면`%rax`변동적이고 아무것도 저장되지 않습니다.

리눅스에서 두 번째 파생은`.eh_frame`, PSABI 4.2.4에서 정의하고 DWARF 5 섹션 6.4에 코딩된`llvm-dwarfdump --eh-frame`이식 가능한 객체에서 각 함수마다 FDE를 1번 인쇄하여`R_X86_64_PC32`이 지역은 이동할 수 있어`keeps`이 부분의 본문은

```text
  DW_CFA_def_cfa_offset: +16
  DW_CFA_def_cfa_offset: +24
  DW_CFA_def_cfa_offset: +32
  DW_CFA_offset: RBX -32
  DW_CFA_offset: R14 -24
  DW_CFA_offset: RBP -16
```

CFA는 호출 전에 스택 포인터이며, 입국 스택 포인터보다 8 높습니다.`RBP -16`입금 이산 -8입니다.`R14 -24`-16,`RBX -32`-24이고, 32의 가장 깊은 CFA 오프셋은 24바이트 프레임 + 반환 주소가 있습니다.`keeps`이렇게 말합니다`DW_CFA_def_cfa: W29 +48``W29 -48``W30 -40``W21 -32``W20 -16``W19 -8`. CFA는 입력 스택 포인터 자체로 되어 있어서, 오프셋은 변환 없이 프레임 오프셋이며, CFA는 `x29`프레임 기록이 생중계되는 동안`eh_frame_cross_check()`이 비교는 두 개체의 12개의 FDE를 모두 비교합니다.`call8`시스템 V 아래는 두 개의 출력 논증을 몸의 중간으로 밀어 넣고, 가장 깊은 CFA 오프셋은 32이고, 프롤로그 프레임은 8이고, 체크는 몸의 가장 깊은 스택 포인터를 비교합니다. 24 + 8.

## 도구가 이것을 어떻게 부르는가

이 분야에 있는 모든 도구는 호출 컨벤션에 대한 데이터 구조와 함수에 하나를 할당하는 패스를 가지고 있습니다. 이름과 격차는 다릅니다. 닫힌 도구는 문서에서 설명되며, 개방된 도구는 고정 장치에서 실행되며, 출력이 객체 옆에 캡처됩니다.

**Ghidra 12.1.4 (Apache-2.0).**규칙은 컴파일러 사양 파일에서 생깁니다.`.cspec`, 슬라이드 언어 옆에.`x86-64-gcc.cspec`선언합니다`<default_proto>`이름`__stdcall`, "시스템 V 애플리케이션 바이너리 인터페이스 AMD64 아키텍처 프로세서 보충기"에서 유래된 2016년 4월`<pentry>``XMM0_Qa` `XMM7_Qa`그리고`RDI, RSI, RDX, RCX, R8, R9`, 오프셋 8에서 스택 입력, a `join_dual_class`16바이트까지의 타입, 출력`XMM0_Qa, XMM1_Qa, RAX, RDX`그리고`hidden_return`나머지 사람들은`x86-64-win.cspec`선언합니다`__fastcall`4개`<group>`짝짓기`XMM0_Qa``RCX``XMM1_Qa``RDX`, 그리고 그 밖의, 위치 규칙, 40의 오프셋에서 스택 입력`convert_to_ptr`3, 5, 6 또는 7 바이트의 스트랙에 대해서는 "등록을 위해 8,16,32,64 비트 크기의 스트랙만 포장할 수 있다"라는 코멘트를 씁니다.`unaffected`목록에 `RBX RBP RDI RSI RSP R12` `R15`그리고`XMM6` `XMM15`, 그리고`localrange`8~39단계, 그림자 매장입니다.`AARCH64.cspec`선언합니다`__cdecl`첫 번째 항목은`x8``storage="hiddenret"`그럼`q0` `q7`그리고`x0` `x7``convert_to_ptr`17바이트 이상의 스트럭에 대해, 그리고`killedbycall`포함`x8`"간접적인 결과 위치 레지스터, 펜트리 목록에 반영되지 않는다". 해독자의 마지막 단계는 "기능을 설치하는 프로토타입"이라고 불린다. 분석기는 "콜 컨벤션 ID"와 "해독자 파라미터 ID"입니다. 프로그램 옵션 "프로토타이프 평가"는 기본 모델을 선택합니다.

**IDA Pro and IDA Free (Hex-Rays, commercial; current release 9.4, build 9.4.260714).**함수 타입은 SetType를 통해 설정된 C 선언이며, "IDA는 함수 정제에 대한 정보와 함께 타입 정보를 사용하여 분해에 대해 언급합니다". 표준 협약이 생성하지 않는 위치들은 IDA의 자체 협약에 기록됩니다: `int __usercall func@<ebx>(int x, int y@<esi>)`결과를 `EBX`그리고`y``ESI`그리고`@<^12.4>`의 위치와 크기에 따라 이름 붙여줍니다.`__userpurge`Callee 스택 청소와 같은 것입니다. 같은 페이지 목록`__spoils`   `__hidden``__return_ptr`그리고`__struct_ptr`이 강의는 암시적인 주장에 대해 수동으로 복구합니다.`__usercall`IDA Free는 x86 및 x86-64만 지원합니다.

**Binary Ninja 6.0 "Krypton" (Vector 35, commercial, with a Free edition that decompiles x86, x86_64, ARMv7, and AArch64).**A`Platform`"다음식 실행 환경과 관련된 모든 정보를 포함하고 있으며, 주로 사용된 호출 컨벤션, 운영 체제 및 아키텍처"`linux-x86_64``windows-x86_64``linux-aarch64`그리고`mac-aarch64`, 각기`default_calling_convention`- A`CallingConvention``int_arg_regs``float_arg_regs``callee_saved_regs``caller_saved_regs``int_return_reg``high_int_return_reg``float_return_reg`, 그리고 이 수업의 차이를 직접 암호화하는 두 개의 깃발:`arg_regs_share_index`"True 때, Nth 논리는 전체수와 부동등록 목록의 Nth 슬롯을 소비한다".`stack_reserved_for_arg_regs`, "Windows x64 호출 컨벤션에서 사용되는 그림자/홈 공간".`eligible_for_heuristics``required_arg_regs`그리고`required_clobbered_regs`이 플랫폼 유형은 C 헤더로 되어 있습니다.`types/platform/`플랫폼 이름마다 1개

**radare2 6.2.4 (LGPL-3.0, run here).** `afcl`건축 플러그인이 알고 있는 컨벤션들을 목록으로 나열합니다: `amd64 amd64syscall dlang golang golang_abi0 ms p9 reg swift`x86-64 및`arm64 dlang golang p9 reg swift`AArch64에 대한`afc`현재 기능의 컨벤션에 대해 보고합니다. `afcr`발자국`cc.amd64.arg0: rdi` `arg5: r9`그리고`ret0: rax`, 그리고 프로파일은 SDB 파일입니다`cc-ARCH-BITS.sdb`. 레이더2 선택`amd64`ELF 객체에 대하여`ms`COFF 객체에 대해, 이는 올바른 분할입니다. `afv`주장과 변수를 목록하고,`afs`리눅스에서 서명을 인쇄합니다`-O2`객체`afv`7가지 주장을 찾았습니다`eight_args`그리고 떨어졌어요`rcx`; 발견한 윈도우 객체에`rcx, rdx, r8`4개의 스택 슬롯을 가지고 떨어뜨렸어요`r9`두 개의 실종 레지스터는`lea`- `mixed`보고했습니다`double arg1 @ xmm0, arg2 @ xmm1, arg3 @ xmm2`리눅스에서, 윈도우에서 전혀 논쟁이 없습니다. AArch64에서`x0` `x7``eight_args`, 그리고`big_ret`그 목록은`x0`그리고`double arg2 @ d1`함수가 `x8`그리고 상수를 로드합니다`q1`- 모든`afs`서명은 `void`, 왜냐하면 반환 유형은 추론되지 않기 때문입니다.`-O0`, 모든 주장이 프레임에 저장되어 있는`afv`8가지 주장을 모두 찾아냈어요`eight_args``rbp+0x10`그리고`rbp+0x18`스택 쌍을 위해

**rizin 0.9.1 (LGPL-3.0, run here) and Cutter 2.5.0.** `afcl`목록`amd64 amd64syscall ms reg swift`-`afc`돌아온`amd64`COFF 객체에 대해, Microsoft 프로필이 존재하고 형식에서 선택되지 않았습니다. `afi`7가지 주장을 제시합니다`eight_args`리눅스에서 다시 `rcx`, 그리고 윈도우`r8, rcx, rdx`3개의 스택 슬롯이 있는,`r9`그리고 `0x40`-`afv`존재하지 않습니다. 목록 명령은`afvl`커터는 리진보다 앞면이 그래픽이에요

**angr 10.0.3 (BSD-2, run here).** `CFGFast`다음으로`CompleteCallingConventions(recover_variables=True)`집합 `function.calling_convention` `SimCCSystemVAMD64``SimCCMicrosoftAMD64`또는`SimCCAArch64`, 바이너리 형식으로, 그리고`function.prototype`이 문서에서 8가지 주장을 모두 복구했습니다.`eight_args`세 가지 목표물에 숨겨진 지표가`big_ret`x86-64에`(BOT*, long long) -> BOT*`, Windows의 참고 구조`by_value``(BOT*, BOT*) -> BOT*`, 그리고 시스템 V 변수`sum_varargs``(long long, ...)`. 그 구멍은 레이더2와 다르죠.`mixed`다시 돌아왔는데`(long long, long long, double, float)`V 시스템과 AArch64에서, 오른쪽은 잘못된 순서로 등록됩니다. 왜냐하면 전체 목록은 부동 목록 전에 인쇄되기 때문입니다.`big_ret`다시 돌아왔는데`(long long) -> double`그래서`x8`회의가 놓쳐졌고 그 결과 벡터 매장이 읽혔고, AArch64 `sum_varargs`16개 매개 변수를 가지고 돌아왔는데, 전체 레지스터는 저장된 공간입니다.

**Others.**Hopper 6.6.0는 macOS 및 Linux용 상업적인 디스몬더 및 디컴파일러입니다. 이 수업에 대한 컨벤션 처리 작업은 실행되거나 문서화되지 않았습니다. lldb 1703 및 gdb는 라이브 프레임을 `frame info`그리고`register read`, 즉, 레슨 42의 동적 시각 같은 오프셋. 컴파일러 익스플로러는 원천에서 세 개의 리스트를 옆으로 표시합니다. 이는 바이트로 검색하기 전에 규칙을 확인하는 가장 빠른 방법입니다.

| Concept | Ghidra | IDA | Binary Ninja | radare2 / rizin | angr | this lesson |
|---|---|---|---|---|---|---|
| The convention object | `prototype` in a `.cspec` | calling convention keyword in the function type | `CallingConvention` on a `Platform` | `afc` name, `cc-ARCH-BITS.sdb` | `SimCC` subclass | `expected_locations(abi, name)` |
| Default per target | `<default_proto>` per cspec | compiler setting | `Platform.default_calling_convention` | `afc=`, `anal.cc` | by format | `describe_object()` |
| Argument registers | `<pentry>` list, `<group>` for positional | `@<reg>` in `__usercall` | `int_arg_regs`, `float_arg_regs`, `arg_regs_share_index` | `cc.NAME.argN` | `ARG_REGS`, `FP_ARG_REGS` | `INT_ARG_REGS`, `FLOAT_ARG_REGS` |
| Shadow store | `localrange` stack 8 to 39 | implicit | `stack_reserved_for_arg_regs` | `cc.ms.argn=stack` | `STACKARG_SP_DIFF` | `STACK_ARG_BASE[WIN64] = 40` |
| Hidden result pointer | `hidden_return`, `storage="hiddenret"` | `__return_ptr`, `__hidden` | return type too large for `int_return_reg` | not modelled | `BOT*` first argument | `HIDDEN_RETURN_REG` |
| Callee-saved | `<unaffected>` | `__spoils` lists the opposite | `callee_saved_regs` | profile | `CALLEE_CLEANUP` and arch | `CALLEE_SAVED` |
| Assigning one to a function | "Call Convention ID" analyzer, "Establish Function's Prototype" | user or type library | heuristic detection with `required_arg_regs` | `afc`, `afva`, `aaft` | `CallingConventionAnalysis` | read-before-write plus the rulebook |

## 건설 해

디모를 실행하세요:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames
python3 code/main.py
```

출력은 하나의 JSON 보고서입니다. 7개의 객체마다 형식, 기계, ABI를 지정하고 12개의 함수마다 프롤로그 바이트, 입력 오프셋을 가진 저장된 레지스터, 프레임 크기와 프레임 포인터, 파라미터 레지스터, 스택 аргумент 오프셋, 스릴, 반환 레지스터 또는 숨겨진 포인터, 호출 깊이, 그리고 호출자의 출력 레지스터 및 저장소를 지정합니다. 각각의 함수는 체크와 끝납니다. 규칙, 서명에서 예상되는 값, 바이트에서 관찰된 값, 그리고 그들이 동의하는지 여부. 보고서는 두 가지 풀기 검사를 통해 끝납니다. 84개의 기능 분석에서 489개의 검사가 진행되고 489개의 검사가 모두 동의합니다.

예상형:

```json
{
  "objects": {
    "convention-x86_64-windows-O2": {
      "format": "COFF", "machine": "AMD64", "abi": "Microsoft x64", "checks": "73/73 agree",
      "functions": {
        "keeps": {
          "prologue": ["56  pushq %rsi", "57  pushq %rdi", "53  pushq %rbx", "48 83 ec 20  subq $0x20, %rsp"],
          "frameBytes": 56,
          "savedRegisters": [{"register": "rsi", "entryOffset": -8}, {"register": "rdi", "entryOffset": -16}, {"register": "rbx", "entryOffset": -24}],
          "parameterRegisters": ["rcx"],
          "returnRegisters": ["rax"],
          "calls": [{"callee": "ext", "depth": 56}],
          "checks": [{"rule": "Microsoft x64: the caller must always allocate ...", "expected": "at least 32 bytes ...", "observed": [56], "agree": true}, "..."]
        }
      }
    }
  },
  "sehCrossCheck": ["..."],
  "ehFrameCrossCheck": {"...": "..."}
}
```

읽으세요`code/main.py`이 순서로:

1. `describe_object()`ELF, COFF 또는 Mach-O 헤더와 상징 표를 읽고 ABI와 함수 목록을 반환합니다.
2. `parse_listing()``llvm-objdump -d -r`함수로 텍스트를 입력하고, 모든 호출과 점프의 이동 목표물을 유지하며, 올바른 문법 표시자를 사용하여 댓글을 삭제합니다.`#`AT&T에 대해`//`그리고`;`AArch64에 대하여`#`즉각적인
3. `effect_x86()`그리고`effect_arm()`하나의 명령어를 읽기, 주소 읽기, 쓰기, 로드, 스토어 및 스택 포인터 델타로 변환합니다. 마지막 AT&T 오페란드는 목적지이며, 첫 번째 AArch64 오페란드는 매장, 비교 및 지부를 제외하고 목적지입니다. `lea`주소도 읽지만 아무것도 로드하지 않습니다.`mov``cvtsi2sd``setcc`, 그리고 0의 모호어`xor r, r`이 모든 것은 "전기"라고 쓰여진 것입니다.`sp`접근이 시작되기 전에, 그리고 지표가 된 후 로드가 그 다음으로 이동합니다.
4. `analyze_function()`한 번씩 몸을 걷고 첫 번째까지 올라갑니다`ret`또는 꼬리 점프. 그것은 입력 값 아래 스택 포인터의 깊이를 추적, 그래서 메모리 운영 `disp(%rsp)`입국 이산`disp - depth`그리고`disp(%rbp)``frame_pointer + disp`. 그것은 작성되기 전에 읽히는 논쟁 클래스 레지스터를 기록하고, ABI의 첫 번째 스택 논쟁의 오프셋에 로드하거나 그 이상으로, 프레임에 레지스터의 논쟁을 저장하고, 현재 스택 포인터 아래의 액세스 및 각 호출의 깊이.
5. `_return_registers()`출구 전에 마지막 접속이 기록이 될 때 결과 레지스터를 유지합니다. 데이터 오페란드로 읽으면 지원자를 죽인다. 주소베이스로 읽으면 그렇지 않습니다.`rax`살아있어요`big_ret`마이크로소프트 x64에 해당하는`movq %rcx, %rax``(%rax)`- 그래
6. `expected_locations()`C 서명에 세 가지 규칙서를 적용합니다. 두 개의 시스템 V 목록은 8바이트 클래스, 마이크로소프트 위치 슬롯은`x8`16바이트 이상의 결과
7. `run_checks()`두 가지의 비교를 하고 프레임 규칙을 추가합니다.`(rsp + 8) % 16 == 0`또는`sp % 16 == 0`모든 호출에 32 바이트 그림자, 모든 마이크로소프트 호출에 32 바이트 그림자, 마이크로소프트 및 AAPCS64에서 스택 포인터 아래 액세스 할 수 없습니다, 그리고 시스템 V에서 최대 128 바이트, 그리고 스택 포인터와 함께 프롤로그를 입력 값에 반영하는 에피로그
8. `seh_cross_check()`그리고`eh_frame_cross_check()`                      `-fno-asynchronous-unwind-tables`그리고 그 내용을 선행 분석과 비교해 보세요.

3개의 명령이 더 있습니다.`python3 code/main.py analyze convention-x86_64-windows-O2 keeps`하나의 함수를 인쇄합니다. `python3 code/main.py object FILE`헤더의 판결을 인쇄합니다.`python3 code/main.py seh`디코딩된 것을 인쇄합니다`UNWIND_INFO`하나 있는 모든 함수의

## 사용 하 고

이렇게 분석기를 사용해서 새로 만든 물체에

1. 달아`python3 code/main.py object FILE.o`그리고 ABI가 붙여진 이름을 적어 보세요. 헤더와 빌드 명령이 동의하지 않는다면, 멈추세요. 둘 중 하나가 잘못됐습니다.
2. 포착`llvm-objdump -d -r FILE.o`객체 옆에 있는 파일과 분석을 실행하고, 다른 모든 것 전에 프롤로그 바이트와 저장된 레지스터를 읽어, 프레임 크기와 누르기와 `sub`- 그래
3. 파라미터 레지스터와 스택 오프셋을 소스 서명에 대한 읽기. 서명에서 설명되지 않는 레지스터는 분석기관이 논쟁으로 오해한 숨겨진 포인터, 변함표 또는 스크래치 레지스터입니다. 마지막 경우는 효과 테이블의 버그입니다. 그 지침에 대한 일반적인 규칙으로 수정하십시오.
4. 서로 다른 체크를 읽어 보세요. 각각의 체크는 그 규칙에 근거한 규칙을 이름 붙이고, 먼저 체크해야 할 것은 규칙이고,
5. 객체가 윙 데이터를 가지고 있을 때, 크로스 체크를 실행하십시오. 이 수업에서 가장 강력한 증거는 동의하는 두 가지 추리입니다.
6. 다른 도구가 설치되면 정확한 명령어를 사용하여 출력을 캡처하고 비교합니다. 동의하는 경우 세 가지 추리점이 있습니다. 다른 경우 특정 레지스터와 특정 지침이 있습니다.

## 인터랙티브 연구소

### 연구소 A: 하나의 명령, 세 가지 효과

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames/code
python3 -q
```

실행:

```python
from main import *
effect(Instruction(0, "48 8d 04 0a", "leaq", "(%rdx,%rcx), %rax"), SYSV)
effect(Instruction(0, "f2 0f 2a d7", "cvtsi2sd", "%edi, %xmm2"), SYSV)
effect(Instruction(0, "a9bd7bfd", "stp", "x29, x30, [sp, #-0x30]!"), AAPCS64)
```

전화 전에 예상되는 읽기, 주소 읽기, 쓰기, 그리고 스택 델타를 적어주세요.`[sp, #-0x30]!` `[sp], #0x30``ldp`그리고 델타가 이동하는 것을 지켜보세요`sp_delta` `post_sp_delta`- 그래

### 연구소 B: 의 프레임

```python
info, listing = load_fixture("convention-aarch64-linux-O2")
keeps = analyze_function("keeps", listing["keeps"], info.abi)
keeps.saved
keeps.frame_pointer
[c.to_dict() for c in frame_cells(keeps)]
```

위와 손 디코딩을 비교하고 로드`convention-arm64-macos-O2`그리고 같은 3 줄을 실행하고, 기록은 -16, 그리고 4개의 기록이 그 아래로 위치하고 있습니다.`convention-x86_64-linux-O2-fp`그리고 읽으세요`saved``keeps`: 프레임 포인터는 다시 돌아왔고, `pushq %rax`그 유일한 직업은`(rsp + 8)`전화에서 16의 복수입니다.

### 연구실 C: 혼합된 상태에서 읽기 전 쓰기

```python
info, listing = load_fixture("convention-x86_64-linux-O2")
mixed = analyze_function("mixed", listing["mixed"], info.abi)
mixed.param_registers
mixed.return_registers
expected_locations(SYSV, "mixed")["parameters"]
expected_locations(WIN64, "mixed")["parameters"]
```

시스템 V 목록은`rdi, xmm0, rsi, xmm1`그리고 마이크로소프트 목록은`rcx, xmm1, r8, xmm3`이제 Windows 객체를 로드하고 첫 3 줄을 다시 실행하고, 리눅스 객체에 대한 radare2 캡처를 열고`[afv mixed]`세 번째를 설명하는 명령어를 찾아보세요.

### 연구소 D: 기기의 두 번째 의견

```python
for row in seh_cross_check():
    print(row["function"], row["sizeOfProlog"], row["unwindPushes"], row["unwindAllocBytes"], row["agree"])
for row in eh_frame_cross_check("convention-x86_64-linux-O2-eh"):
    print(row["function"], row["cfiSaved"], row["cfiMaxOffset"], row["deepestStack"], row["agree"])
```

`pushq %rax``sum_varargs`SEH 테이블에 들어가서, 왜 스 윙 코드가 이를 할당으로 기록하는지 설명합니다.`call8``.eh_frame`테이블에 가서 32을 설명해 주세요.

## 연습 실험실

네 번째 목표와 네 번째 규칙이 추가됩니다.

요구 사항:

- 컴파일`convention.c``-target x86_64-apple-macos -O2`그리고 그 목록을 캡처합니다.`describe_object()`마흐오를 읽으려면`cputype`0x01000007을 가지고, 시스템 V psABI에 지도를 만들어,`_`기호의 전두환
- 모든 함수가 시스템 V 검사와 일치하는지 확인하고, 선행에서 발견되는 유일한 차이를 기록하세요. 다윈은 모든 최적화 수준에서 프레임 포인터를 유지합니다.
- `-fstack-protector-strong`리눅스 x86-64 객체의 빌드.`%fs:0x28`그리고 그 아래의 가게는 지역 주민들이 기록한`canary`세포, 그리고 이전 비교`ret`에피로그를 지키는 체크처럼
- 카나리 매장이 은 논쟁으로 간주되면 실패하는 테스트를 추가하십시오.
- 프레임을 작성하세요`with_canary`분석기를 실행하기 전에 손으로 스타일 코드를 작성하고, 테스트 옆에 그림을 보관하세요.

성공이란`python3 code/main.py`새로운 객체를 보고하고 모든 체크에 동의하고 보호 함수의 프레임 셀들은 현지인과 저장된 레지스터 사이의 카나리어를 보여줍니다.

## 교훈 유물

이 교훈은`outputs/skill-calling-conventions-and-stack-frames.md`. 당신이 만든 객체와 그 목록과 C 서명들을 매개 변수 위치, 프레임 레이아웃, 반환 레지스터, 그리고 컴파일러의 풀 데이터와 기본 규칙에 대한 모든 추론을 확인하는 데 사용하십시오.`cvtsi2sd`또는`xor r, r`목적지들은 그 내용대로 되어 있고, 첫 번째 의견 충돌로 끝납니다.

## 확인 해 보

데모와 결정적 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

검증은 다음과 같은 사실을 증명해야 합니다.

- 7개의 객체 이름 System V, Microsoft x64, AAPCS64 및 Apple arm64의 ELF, COFF, Mach-O 헤더
- 각 객체의 상징 테이블은 Mach-O와 같은 12개의 함수를 나열합니다`_`앞음과 `ltmp0`라벨이 해결되었습니다
- 목록 분석자가 보관합니다`ext`AArch64를 `#-0x30`무사
- `leaq (%rdx,%rcx), %rax`두 개의 주소 레지스터를 읽고 아무것도 로드하지 않습니다. `xorl %eax, %eax`그리고`cvtsi2sd`글쓰기만 가능하고, 사전  индексацияланған`stp`움직여`sp`매장 앞에 있는 것과`ldp`짐을 싣고 나면
- `keeps``-O2` `55 41 56 53`24바이트 프레임과 프레임 포인터가 없는 시스템 V에, `56 57 53 48 83 ec 20`마이크로소프트 x64에서 56바이트 프레임으로,`a9bd7bfd`AArch64에서 첫 번째 기록은 -48
- 애플 빌드는 기록은 -16로 4개의 저장된 레지스터를 넘어서게 합니다
- 각 함수는 프레임 포인터를 `-O0`리눅스에서`-O2`그리고`-fno-omit-frame-pointer`그리고 다시 연결을 만들어
- `-O0`이 페이지에는 시스템 V에 8 바이트의 빨간색 영역이 사용된다.`pushq %rax`마이크로소프트 x64에 따라, 그리고`sub sp, sp, #0x10`AAPCS64에 따라`-mno-red-zone`빨간 구역 사용량을 제거합니다
- 각 에피로그는 선두를 반영하고 스택 포인터는 입구에 돌아갑니다
- `eight_args`6개의 레지스터와 슬롯 8 및 16을 읽는다. 4개의 레지스터와 슬롯 40에서 64까지, 또는 `x0` `x7`, 최적화 수준 두 가지에서
- `mixed` `rdi, xmm0, rsi, xmm1`시스템 V 및`rcx, xmm1, r8, xmm3`마이크로소프트 x64에 따라`xmm0`이 두 가지의 결과로
- 16바이트 구조는 시스템 V 및 AAPCS64의 두 개의 레지스터에서 이동하고 마이크로소프트 x64의 숨겨진 포인터 뒤에 참조
- 32바이트 구조는 `rdi``rcx`또는`x8`
- 리디컬레는`%al`, 가정`rdx, r8, r9`16, 24, 32,는 저장합니다`x1` `x7`그리고`q0` `q7`, 또는 애플에서 호출자의 스택 포인터를 읽습니다
- 호출자들은 예상된 레지스터를 설정하고, 7과 8을 0과 8 또는 5에서 8까지 32에서 56까지 저장합니다.`%al`                `rdi``rcx`또는`x8`
- 489개의 검사가 모두 그들의 규칙에 동의합니다
- 6번`UNWIND_INFO`입문들은 선두의 파스와 일치하고, 잎은 없습니다.
- 24 FDE는 저장된 레지스터 오프셋과 가장 깊은 스택 포인터를 일치합니다
- 이 도구는 레코드 레이더2를 캡처합니다`amd64`그리고`ms`리진의`amd64`COFF 객체에서 실종된`rcx`, 3개의 더블, 그리고 Angr의 프로토타입
- 사이트 모듈에 삽입된 수치 데이터는 분석기의 출력과 같습니다

## 생산 실패 모드

| Failure | What the weak tool reports | What the analysis must prove |
|---|---|---|
| COFF object read as System V | `rdi` and `rsi` as arguments that the function never reads | The header says 0x8664; the convention is Microsoft x64 |
| Register read only inside a `lea` | Seven arguments for an eight-argument function | Base and index registers are reads |
| `cvtsi2sd` destination counted as a read | A third double argument in `xmm2` | The first write to `xmm2` is a write; `mixed` has two SSE arguments |
| Positional slots read as sequences | `xmm0` named as the double argument on Windows | Slot 1 is `XMM1`, slot 3 is `XMM3` |
| `push rbp` taken as a frame pointer | A frame pointer in an `-O2` function that uses `rbp` as an accumulator | Only `mov %rsp, %rbp` after the push creates one |
| Red zone measured from the entry stack pointer | 216 bytes "below the stack pointer" | 128 bytes below the current stack pointer after an 88-byte `sub` |
| Shadow store treated as locals | Stack arguments at 8 to 32 | Microsoft stack arguments start at 40 |
| `lea` treated as a load | A stack argument at `0x60(%rsp)` in a variadic callee | `lea` computes `overflow_arg_area`; it loads nothing |
| Hidden pointer read as a normal argument | `big_ret(void *, long long)` | The pointer is stored through and copied to `rax`, `rax`, or stays in `x8` |
| Deepest CFA compared with the prologue frame | A mismatch on a caller that pushes outgoing arguments | Compare with the deepest stack pointer the body reaches |
| Convention asserted from the ISA | `amd64` for a COFF object | The format picks the rulebook, then the ISA picks the registers |
| Prototype trusted from one tool | Three doubles, or sixteen variadic parameters | The source signature or a second derivation must agree |

## 운영 규칙

첫 번째 명령어 전에 헤더를 읽어 규칙 책장을 이름지십시오. 저장된 모든 레지스터와 모든 주장을 입력 스택 포인터에서 오프셋으로 배치하고, 그것을 거기에 넣은 규칙과 컴파일러가 같은 프레임에 대해 작성한 풀 데이터에 대해 확인하십시오. 바이이트 또는 소스가 확인하는 때까지 도구의 프로토타입을 주장으로 간주하십시오.

## 더 많은 읽기

- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Version 1.0 (sections 3.2.1 to 3.2.3, 4.2.4)](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Microsoft x64 calling convention](https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention)
- [Microsoft x64 stack usage](https://learn.microsoft.com/en-us/cpp/build/stack-usage)
- [Microsoft x64 prolog and epilog](https://learn.microsoft.com/en-us/cpp/build/prolog-and-epilog)
- [Microsoft x64 exception handling: RUNTIME_FUNCTION, UNWIND_INFO, UNWIND_CODE](https://learn.microsoft.com/en-us/cpp/build/exception-handling-x64)
- [Arm Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64), release 2025Q4](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [Apple: Writing ARM64 code for Apple platforms](https://developer.apple.com/documentation/xcode/writing-arm64-code-for-apple-platforms)
- [DWARF Debugging Information Format Version 5, section 6.4 Call Frame Information](https://dwarfstd.org/doc/DWARF5.pdf)
- [Clang driver frame-pointer defaults, `useFramePointerForTargetByDefault` in `CommonArgs.cpp`](https://github.com/llvm/llvm-project/blob/main/clang/lib/Driver/ToolChains/CommonArgs.cpp)
- [Clang command line reference: `-fomit-frame-pointer`, `-momit-leaf-frame-pointer`](https://clang.llvm.org/docs/ClangCommandLineReference.html)
- [Fedora 38 change: frame pointers by default](https://fedoraproject.org/wiki/Changes/fno-omit-frame-pointer)
- [Ubuntu 24.04: performance engineering with frame pointers by default](https://ubuntu.com/blog/ubuntu-performance-engineering-with-frame-pointers-by-default)
- [Ghidra compiler specification: `x86-64-gcc.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/x86/data/languages/x86-64-gcc.cspec)
- [Ghidra compiler specification: `x86-64-win.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/x86/data/languages/x86-64-win.cspec)
- [Ghidra compiler specification: `AARCH64.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/AARCH64/data/languages/AARCH64.cspec)
- [Hex-Rays: SetType and the `__usercall` convention](https://docs.hex-rays.com/ida-actions/settype)
- [Hex-Rays: Decompile as call](https://docs.hex-rays.com/ida-actions/hx_userdefinedcall)
- [Binary Ninja API 6.0: `callingconvention` module](https://api.binary.ninja/binaryninja.callingconvention-module.html)
- [Binary Ninja API 6.0: `platform` module](https://api.binary.ninja/binaryninja.platform-module.html)
- [Binary Ninja user documentation: platform types](https://docs.binary.ninja/guide/types/platformtypes.html)
- [The Official Radare2 Book: calling conventions](https://book.rada.re/analysis/calling_conventions.html)
- [The Official Radare2 Book: code analysis](https://book.rada.re/analysis/code_analysis.html)
- [angr documentation: decompiler analysis passes, including calling convention recovery](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [radare2 6.2.4 release](https://github.com/radareorg/radare2/releases/tag/6.2.4)
- [rizin 0.9.1 release](https://github.com/rizinorg/rizin/releases/tag/v0.9.1)
