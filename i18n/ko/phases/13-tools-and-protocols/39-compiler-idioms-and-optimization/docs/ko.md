# 컴파일러 어디움: 최적화 는 코드에 어떤 영향을 미치며 어떻게 다시 읽을 수 있습니까?

> 최적화 컴파일러는 원천 구성물을 더 저렴한 명령어 모양으로 대체합니다. 각 모양은 파생이 있으며, 이 수업은 파생물을 뒤로 실행하고 원천에 대한 검사를 하는 인식기를 구축합니다.

**Type:** Build
**Languages:** Python, C, x86-64 assembly, AArch64 assembly
**Prerequisites:** Phase 13 · 33 (disassembly and control flow), Phase 13 · 34 (lifting to pseudocode), Phase 13 · 38 (calling conventions)
**Time:** ~150 minutes

## 학습 목표

- 마법을 추출하고 Granlund-Montgomery의 한계와 함께 어떤 상수에서 분할을 위해 이동하고, 방출된 상수에서 분수를 복구하십시오.
- LLVM이 A을 낮추는 5가지 방법을 명명하세요`switch`그리고 항목의 수, 테이블의 위치, 그리고 객체에서 입력된 항목을 읽어보세요.
- 벡터화된 루프를 라인, 축적자, 반복당 요소, 트립 카운트 마스크, 줄여서, 잔류 루프로 읽으십시오.
- 꼬리 호출, 선진 쿨레, 가지 없는 선택, 그리고 이 된 루프를 인식합니다.`memset`또는`memcpy`- 그래
- 모든 언어와 증거 지침 및 암호화된 소스 양식을 x86-64 및 AArch64에 보고하십시오.`-O0` `-O3`- 그래
- 그 결과와 Ghidra, Angr, Radar2, Rizin, 그리고 LLDb의 동일한 바이트에 대한 결과의 비교를 해 보십시오.

## 문제

당신은 `idioms.c``-O2`그리고 어떤 일을 하는 중재에게 물어봤어요`div7u`에이전트가 읽은`imulq $0x24924925, %rax, %rax`그리고 함수가 613566757로 곱해, 변하고, 더해집니다. 모든 단어는 사실입니다. 함수는 계산합니다.`x / 7`- 그래

같은 물체는 `switch`7건의 사례가 전혀 뛰어내리지 않는 경우`switch`5개의 케이스가 있는 점프 테이블,`switch`두 가지 경우`sete`그리고`cmovne`, 그리고 루프 `n`2번의 반복에 8번의 정수를 실행하는 정수`xmm`기록하고 나머지 부분을 두 번째 루프로 끝내는 것입니다.`-O0`같은 출처에서 생산된`divl`7개의 점프 테이블과 1개의 스칼라 루프`-O1`7개의 쿼드가 값의 테이블이 되었고, 벡터 루프는 아직 존재하지 않았습니다.

이 형태는 어디움입니다. 컴파일러는 각각의 형태를 원천에서 읽을 수 있는 규칙에서 배포하고, 각각의 형태는 그로부터 온 구조로 복제될 수 있습니다. 복제법은 수학적이며 수학적도 확인할 수 있습니다.`0x66666667`이 수업은 모든 분들을 위한 인식기들을 만들고, 우리 자신의 코드 18개에 걸쳐 실행하고, C 소스에 대한 모든 373개의 보고서를 확인합니다.

```figure
re-39-idioms-by-level
```

## 언어 는 유래 를 가진 형태

어휘는 컴파일러가 하나의 소스 구성에 대해 발송하는 명령어의 연속이다. 세 가지 요소로 인식이 가능합니다. 그것은 고정된 모양을 가지고 있으며, 오페란드는 추리에서 예측되는 상수를 가지고 있으며, 형태는 프로그래머가 손으로 작성하는 것과 다릅니다.

인식기`code/main.py``llvm-objdump -d -r`, 33 수업은 명령어 경계를 위한 오라클로 설정되었습니다. 그것은 주소, 바이트, mnemonic, 오퍼랜드, 그리고 그 다음의 이전 라인을 가진 명령어로 각 함수를 분석합니다. 그것은 단지 두 가지에 대한 객체 파일을 읽습니다: 바이트의`.rodata`, 값 테이블이 있는 곳, 그리고 `.rela.rodata`점프 테이블 목표물이 연결하기 전에 살고 있는 항목

모든 탐지도`Idiom`기록`kind`, 해독된`source`양식, 목록`evidence`주소, a `detail`사전, 그리고 `verified`깃발은 C 소스에서 나온다`parse_source()`읽는다`idioms.c`, 각 함수를 찾아내고 분수를 추출합니다`/`그리고`%`,  이후의 곱셈`*`, `switch`사건과 그 가치,`? :`사업자,`for`루프, 그리고 호출. 분할 언어는 분할 목록에 있는 분자가 함수의 분할 목록에 있을 때 확인됩니다. 검색 테이블은 입력값이 경우 값과 일치할 때 확인됩니다. 일정 요소까지. 꼬리 호출은 소스에서 호출될 때 확인됩니다. 데모 보고는 `unverified`리스트, 테스트 스위트는 리스트가 18개의 빌드 모두에 대해 빈 상태라고 주장합니다.

디코딩은 이름에 필요합니다. 인식기에는 각각의 함수의 기본 블록에 대한 작은 상징적 평가기를 실행합니다. 목록 순서로, 시스템 V 및 AAPCS64 컨벤션의 정수 레지스터에서 소스에서 매개 변수 이름을 포함합니다. 수업 38.`-O0`각 블록 항목에서 전신들의 상태가 합쳐지고, 다른 경우 이전어에서 주어진 언어가 상수보다 승리하는 이름입니다.`cmovll %edx, %eax``digest`다시 읽습니다`sum % 10 < 5 ? sum % 10 : 5`: 루프 어휘는 축적자를 이름 붙였습니다`sum`, 분할 언어는 그 양수를`sum / 10`, 그리고 모두로 모유어에서 그 결과를`sum % 10`- 소스는 이렇게 썼습니다`rem > 5 ? 5 : rem`두 표현 모두에서 작은 것을 나타냅니다`rem`5번과 5번의 의견이 일치합니다.`rem == 5`- 그래

## 일정한 분배

그랜런드와 몽고메리, "배를 이용한 변함없는 정수들에 의한 분배" (PLDI 1994),`n / d`곱셈과  shift을 선택하세요`s`그리고 곱셈자리`m = ceil(2^s / d)`- 그럼`floor(n * m / 2^s)`=`floor(n / d)`모든`n`오류가 발생했을 때`e = m * d - 2^s`서명되지 않은 32비트용으로`n`경계는`e <= 2^(s - 32)`. 서명하기 위해`n``|n| < 2^31`경계는`e <= 2^(s - 31)`, 그리고 표시를 수정하면 1을 더합니다`n`음수입니다. 왜냐하면 바닥이 음수분자를 위해 잘못된 방향으로 회전하기 때문입니다.

`magic_numbers(d, bits, signed)``main.py`검색`s`32에서 위로 올라와 그 경계를 만족시키는 첫 번째 쌍을 반환합니다. 그 검색은 고정관념에서 방출되는 모든 일정 을 재생합니다.

### 10 손으로 서명하지 않은

`2^35 / 10 = 3435973836.8`천장은`3435973837 = 0xCCCCCCCD`실수로`0xCCCCCCCD * 10 - 2^35 = 2`, 그리고 `s = 35` `2^3 = 8`- `s = 34`실수는 6이 4의 한계에 맞게 되므로 35은 가장 작은 이동입니다`n = 123`이 책:`123 * 3435973837 = 422624781951`그리고`422624781951 >> 35 = 12`- 그래

클랜그는 바로 이런 것을 발사합니다`div10u``-O2`x86-64에 대해:

```text
       0: 89 f9                        	movl	%edi, %ecx
       2: b8 cd cc cc cc               	movl	$0xcccccccd, %eax
       7: 48 0f af c1                  	imulq	%rcx, %rax
       b: 48 c1 e8 23                  	shrq	$0x23, %rax
```

`0x23`35입니다.`movl %edi, %ecx`0은 32 비트의 논증을 64 비트 레지스터로 확장합니다.`movl $imm`이 두 개의 오페란드를 먹여주는`imulq`, 시 turno를 읽고 전화합니다`divisor_from_magic(0xCCCCCCCD, 35)`그 함수는 시도합니다`2^35 // m = 10`그리고 11을 받아 10을 받아`magic_numbers(10)`같은 곱셈을 하고 다시 이동합니다.

AArch64에서 동일한 함수는`mov w8, #0xcccd; movk w8, #0xcccc, lsl #16; umull x8, w0, w8; lsr x0, x8, #35`. ثابت은 16비트 반으로 나타납니다. 곱하기는`umull`, 그리고 이 변수는 십자수로 쓰여집니다. 인식기는 반을 합쳐서 같은 분수를 보고합니다.

### 손으로 서명되지 않은 7, 추가 수정

`2^35 / 7 = 4908534052.57`천장은`4908534053 = 0x124924925`, 33 비트가 필요합니다. 오류는 8의 한계에 3입니다. 따라서 이동은 35입니다. 그리고 작은 이동은 작동하지 않습니다. 32 비트 곱하기 곱기는 곱자를 유지할 수 없습니다. 그래서 컴파일러는 낮은 32 비트로 곱합니다.`0x24924925`그리고 이당을 고정된 순서로 다시 추가합니다.

```text
      32: 48 69 c0 25 49 92 24         	imulq	$0x24924925, %rax, %rax
      39: 48 c1 e8 20                  	shrq	$0x20, %rax
      3d: 29 c7                        	subl	%eax, %edi
      3f: d1 ef                        	shrl	%edi
      41: 01 f8                        	addl	%edi, %eax
      43: c1 e8 02                     	shrl	$0x2, %eax
```

이 글은`t = (n * 0x24924925) >> 32`그럼`q = (((n - t) >> 1) + t) >> 2`전체 변화는`32 + 1 + 2 = 35`- `n = 100`이 책:`t = 14``(100 - 14) >> 1 = 43``43 + 14 = 57``57 >> 2 = 14`인식기는 `sub``shr``add``shr`32비트 셔프 후 꼬리, 추가 `2^32`곱셈을 다시 곱하면 7을 되살아냅니다.`evaluate_division()`이 정확한 순서대로 실행하고 테스트는 그것을 검사합니다`n // 7`AArch64 양식은 `sub w9, w0, w8; add w8, w8, w9, lsr #1; lsr w0, w8, #2`, 1개의 명령이 짧아집니다. 왜냐하면,

### 3 손으로 서명

`2^32 / 3 = 1431655765.33`, 천장`1431655766 = 0x55555556`, 오류 2 , 그리고 서명된 `s = 32` `2^1 = 2`은 방영할 공간이 없어서 32번의 을 사용한다`shrq $0x20`- `n = -7`: 제품입니다`-10021590362`, 32으로 수학적 전환은 `-3`, 신호 비트가 설정되어 있으므로 수정하면 1을 더하면 결과입니다`-2`, 즉`-7 / 3`C. 서명된 장착장치`div10s`그리고`div3s`둘 다 수리장치를 가지고 있습니다`shrq $0x3f`제품의 복사본에 다음으로 `addl`- 그래

### 이 상수들은 무엇이 아닌지

곱셈자만으로 분자가 없습니다.`0x66666667`시위 34 은 10 이다. 시위 33 는 5 이다. 그래서 인식자 는 항상 이 곱자를 전체 시위 와 결합 합니다.`clangMatchesAlgorithm`두 개의 힘은 곱셈을 사용하지 않습니다.`magic_numbers()`컴파일러가 신호 편향을 가진 전환을 방출하기 때문에,`mod8s`다음 섹션에서는 그 모양을 보여줍니다.

### 이디오마는 명령 선택자에 속한다

`-O0``div10u` `movl $0xa, %ecx; xorl %edx, %edx; divl %ecx`-`div10s` `cltd; idivl %ecx`같은 물체에서`digest`와 10으로 루프 수를 나눈다`imulq $0x66666667`한 깃발이 그 차이를 설명합니다.`idioms-x86_64-nofastisel-O0.o``-O0 -mllvm -fast-isel=false`, 그리고 그 안에 모든 분배는 곱셈입니다`div10u``movl $0xcccccccd, %ecx; imulq %rcx, %rax; shrq $0x23`하드웨어 분할은 빠른 명령어 선택의 선택입니다`-O0`. 곱하기는 SelectionDAG의 하락이 되는데, 이것은 LLVM의`UnsignedDivisionByConstantInfo`그리고`SignedDivisionByConstantInfo`생산하는 것`digest`분할을 지탱하는 블록은 또한 `switch`, 그리고 그 블록은 선택 DAG에 갔습니다. 인식기에는 두 양식 모두 보고됩니다.`hardware idivl`그리고`magic multiply`, 그리고 그림은 혼합된 것을 보여줍니다`-O0`기능

## 모두로 는 양자 를 따르고 있다

`x % d` `x - (x / d) * d`. 컴파일러는 위의 이디오마와 양수를 계산하고, 그것을 복제하고, 빼고 있습니다. x86-64에서 10로 복제하는 것은 `addl %ecx, %ecx; leal (%rcx,%rcx,4), %ecx`, 즉`2 * q * 5`AArch64에 있어서 하나의 명령입니다`msub w0, w8, w9, w0`, 계산하는`w0 - w8 * w9``w9 = 10`. 인식기 는 복사본을 통해 양자 레지스터를 추적하고, 누적된 인수를 `add``lea``shl`그리고`imul`, 그리고 `sub`이 분자가 분자와 같을 때

같은 양분으로 다른 표현이 이루어지면 두 가지 표현이 보고서에 남아 있습니다.`-O1`컴파일러는 계산합니다`sum / 10`한 번씩`digest`그리고 그것을 사용합니다`switch`x86-64에서 이수수를 2번 더하기`leal (%rax,%rsi), %edi`모듈 및`addl %esi, %eax`스위치에 대한 인식기 (Recognizer) 는 한 분자와 한 모듈을 보고하고 분자를 공유하는 것으로 표시합니다. 여기서 분자를 잃는 보고서는`switch`지표는 읽을 수 없습니다.

2의 힘으로 서명된 모두로는 자신의 형태를 가지고 있습니다. 왜냐하면 양자는 결코 계산되지 않기 때문입니다.

```text
      92: 8d 48 07                     	leal	0x7(%rax), %ecx
      95: 85 ff                        	testl	%edi, %edi
      97: 0f 49 cf                     	cmovnsl	%edi, %ecx
      9a: 83 e1 f8                     	andl	$-0x8, %ecx
      9d: 29 c8                        	subl	%ecx, %eax
```

음의 경우`x`코드는 마스크링하기 전에 7으로 편향되어 C가 요구하는 대로 줄이는 것이 무대로 돌아갑니다. 마스크링 값은`x`8의 곱으로 반짝이는 다음 빼는 것은`x % 8`AArch64은`negs w8, w0; and w9, w0, #0x7; and w8, w8, #0x7; csneg w0, w9, w8, mi`: 두 마스크`x`그리고`-x`그 다음에는 표지판으로 선택하고 부정합니다.`RuleSignMod2nOpt`, "INT_SREM 양식을 변환하라: `(V + (sign >> (64-n)) & (2^n-1)) - (sign >> (64-n)) => V s% 2^n`"

`-O0`AArch64는 modulo를 이렇게 작성합니다`sdiv w9, w8, w10; mul w9, w9, w10; subs w0, w8, w9`. 인식기 또한 그 양식을 받아보고합니다`hardware sdiv + mul + subs`- 그래

## 스위치 를 낮추는 5 가지 방법

LLVM는 `switch`두 곳의`SimplifyCFG::simplifySwitchLookup``-O1`그리고 위와 모든 경우를 상수를 생성하는 스위치를 값 테이블로 변환합니다. 적어도 세 경우와 목표가 검색 테이블을 만들 수 있습니다.`SingleValueKind``LinearMapKind``BitMapKind`그리고`ArrayKind`- `-O0`파이프라인에서 이 경로를 통과할 수 없습니다. 나머지 스위치들은 도달합니다.`SwitchLowering::findJumpTables`명령어 선택에서, 클러스터가 적어도 `min-jump-table-entries`입력, 기본 4 개, 충분히 밀집: `NumCases * 100 >= Range * MinDensity``jump-table-density`10개의 정상적인 기능과 40개의`-Os`. 남은 것은 케이스 상수들을 상대로 바이너리 검색이 됩니다.`splitWorkItem`피보트를 선택합니다. 매출에 한 개의 기능이 있습니다.

| Function | Source | `-O0` x86-64 | `-O2` x86-64 | `-O2` AArch64 |
|---|---|---|---|---|
| `linear_switch` | cases 0 to 6 return 10 to 70 | jump table, 7 entries | linear map `10*k + 10`, default -1 | `madd` and `csinv` |
| `table_switch` | cases 0 to 6 return 10 to 60 then 71 | jump table, 7 entries | lookup table at `.rodata+0x28` | lookup table at `.rodata+0x0` |
| `call_switch` | cases 0 to 4 call one of five pointers | jump table, 5 entries | jump table, 5 entries | comparison tree, pivot 1 |
| `sparse_switch` | cases 1, 100, 10000, 1000000, 100000000 | compare chain | comparison tree, pivot 9999 | comparison tree, pivot 9999 |
| `two_cases` | cases 3 and 4 return 7 and 9 | compare chain | select chain `k != 3 ? (k == 4)*9 : 7` | two `csel` |

### 객체에서 읽은 검색 테이블

`table_switch``-O2`이 부분의 본문은

```text
      d0: b8 ff ff ff ff               	movl	$0xffffffff, %eax
      d5: 83 ff 06                     	cmpl	$0x6, %edi
      d8: 77 0c                        	ja	0xe6 <table_switch+0x16>
      da: 89 f8                        	movl	%edi, %eax
      dc: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		00000000000000df:  R_X86_64_PC32	.rodata+0x24
      e3: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      e6: c3                           	retq
```

국경 확인`cmpl $6; ja`7개의 유효한 항목을 의미합니다.`0x24`RIP 관련 필드의 4 바이트를 더하면 테이블이 `.rodata+0x28`, 규칙 33 수업에서 도출된 바이트가 있습니다`0a 00 00 00 14 00 00 00 ...`, 그래서 항목은`[10, 20, 30, 40, 50, 60, 71]`, 그리고 그들은 원천 케이스 값과 같습니다.`.Lswitch.table.table_switch``.s`이 문서에는 댓글이 있습니다`@switch.table.table_switch`이 객체에서 이동과 바이트만 남아 있습니다. 점프가 없습니다. 따라서 제어 흐름 그래프는 3 블록입니다.

AArch64 양식은 테이블 주소를 `adrp x8`그리고`add x8, x8, #0x0`, 각자가 자신의 이전을 `.rodata`, 그리고 `ldr w0, [x8, w0, uxtw #2]`. 인식기에는 `add`이전

### 테이블이 전혀 없는 선형 지도

`linear_switch`수익금`10 * (k + 1)``k`0에서 6까지`simplifySwitchLookup`이 같은 수치는

```text
      b0: 83 ff 07                     	cmpl	$0x7, %edi
      b3: 8d 04 bf                     	leal	(%rdi,%rdi,4), %eax
      b6: 8d 4c 00 0a                  	leal	0xa(%rax,%rax), %ecx
      ba: b8 ff ff ff ff               	movl	$0xffffffff, %eax
      bf: 0f 42 c1                     	cmovbl	%ecx, %eax
```

평가자는 `leal (%rdi,%rdi,4)``5*k``leal 0xa(%rax,%rax)``10*k + 10`, 그리고`cmovb`그 후`cmpl $7``k < 7 ? 10*k + 10 : -1`. 인식기 는 다음 각 원본 케이스 에 대한 공식 을 확인 하고 검증 된 언어 를 표시 합니다. AArch64 는 같은 표현 을 `madd w8, w0, w8, w9`그리고`csinv w0, w8, wzr, lo`, 어디`csinv``wzr`생산량`-1`기본 경로에서

### 이사를 통해 읽은 점프 테이블

`call_switch``-O2`                      `grade``-O0`이 책:`cmpl $4; ja`, a `leaq` `.rodata-0x4`, a `movslq`4바이트 입력의 `addq`그리고`jmpq *%rax`5개의 항목은`.rela.rodata`그리고`target = addend - 4k`주는`0x10c, 0x107, 0x10e, 0x110, 0x109`, 5개의 블록이 각각 함수 포인터를 통해 튀어나오게 됩니다`dispatch`이 팩스트는 16개의 케이스로 확장합니다. x86-64에서 16개의 이전 항목, AArch64에서 16개의 단일 바이트의 압축 테이블을 읽습니다.`ldrb w11, [x9, x8]`, 4으로 확장하여 `add x10, x10, x11, lsl #2`, 그리고`adr`첫 번째 케이스 블록의 인식기`[0x24, 0x74, 0x54, ...]`바이트 테이블과 보고서에서`compressed: true`- 그래

### 4단계 같은 스위치

`digest`켜져 있는 스위치`sum / 10`6~10의 경우 1, 2, 4, 8, 8의 값이 있고, 그 결과 16으로 곱하면 x86-64에서`-O0`, `-O1`항목을 포함하고 있습니다`[16, 32, 64, 128, 128]`, 그리고 다시  테이블`-O2`그리고`-O3`4개의 칸의 칸을 보관하고 있습니다`0x10``0x20``0x40``0x80`- `-O1`16으로 곱하는 것은 증가한 경우로 이동했습니다.`-O0`이 경우 1, 2, 4 및 8을 저장하고 곱셈은 스위치 후에 유지됩니다.`-O1`검색 테이블에서 인식기는 출처 값과 항목을 비교하고, 일정 비율을 찾으며 보고합니다 `foldedFactor: 16`AArch64에서`-O2`형태는 8의 피오트와 비교 나무입니다, 6, 7 및 8의 평등 테스트와 범위 테스트`sub w9, w9, #9; cmp w9, #2; b.hs`9번과 10번의 사례를 두 가지 명령으로 다루고 있습니다.`rangeTests: [[9, 10]]`- 그래

두 개의 깃발이 이 경계를 움직인다.`-fno-jump-tables` `table_switch``call_switch`, 그리고`digest`x86-64에서 7 케이스 함수에서 2 및 4의 회전점이 있는 비교 나무로 전환합니다.`-mllvm -min-jump-table-entries=4`잎`call_switch`비교 나무로서, 그 목표에 대한 입력 수치는 간접 호출의 5 개의 경우 전환에 결정적인 입력이 아니었다.`idioms-arm64-jt4-O2.o`기록이 실행됩니다.

GCC는 두 가지 결정을 모두 적용합니다`tree-switch-conversion.cc`, 수업과 함께`jump_table_cluster``bit_test_cluster``switch_decision_tree`그리고`switch_conversion`- 그`-ftree-switch-conversion``-O2``-fjump-tables`그리고`-fbit-tests``-O1`, 그리고 점프 테이블 문턱은 `case-values-threshold`이 기계에 GCC가 설치되어 있지 않기 때문에 그 이름은 GCC 소스와 매뉴얼에서 왔고, 컴파일러 익스플로러는

## 루프: 벡터화, 롤링 또는 교체

LLVM의 루프 벡터라이저는 `-O2``-O3`그리고`-Os`, 그리고 `-O0`그리고`-O1`, 2014년 1월 LLVM 3.4으로 거슬러 올라가는 규칙입니다. `sum_n``-O2`모양의 모든 부분을 표시합니다.

```text
     1f6: 83 fe 07                     	cmpl	$0x7, %esi
     1f9: 77 09                        	ja	0x204 <sum_n+0x14>
     206: 81 e2 f8 ff ff 7f            	andl	$0x7ffffff8, %edx
     230: f3 0f 6f 14 37               	movdqu	(%rdi,%rsi), %xmm2
     235: 66 0f fe c2                  	paddd	%xmm2, %xmm0
     239: f3 0f 6f 54 37 10            	movdqu	0x10(%rdi,%rsi), %xmm2
     23f: 66 0f fe ca                  	paddd	%xmm2, %xmm1
     243: 48 83 c6 20                  	addq	$0x20, %rsi
     24a: 75 e4                        	jne	0x230 <sum_n+0x40>
     24c: 66 0f fe c8                  	paddd	%xmm0, %xmm1
     250: 66 0f 70 c1 ee               	pshufd	$0xee, %xmm1, %xmm0
     262: 66 0f 7e c8                  	movd	%xmm1, %eax
     270: 03 04 97                     	addl	(%rdi,%rdx,4), %eax
     279: 75 f5                        	jne	0x270 <sum_n+0x80>
```

경비원`cmpl $7; ja`8 이하의 여행 번호를 스칼라 루프로 보내죠.`andl $0x7ffffff8`8의 복수까지 계산합니다.`xmm`축적 장치, 각 4개의 32비트 라인, 그래서 벡터화 인수는 4이고 틈새 인수는 2입니다`paddd`2`pshufd`, 두 개 더`paddd`그리고`movd`8개의 라인을 한 개로 줄일 수 있습니다.`0x270`마지막 0~7개의 요소의 스칼라 잔류입니다. 인식기는 뒷쪽에서 루프를 찾아 SIMD 레지스터를 보고, 에서 라인 카운트를 읽습니다.`paddd`, 각기 다른 축적자를 계산하고, 단계를 나눕니다`0x20`4에 의해, 그리고 보고서`4 lanes x 2 accumulators = 8 elements per iteration`, 마스크, 보호, 줄여서, 그리고 나머지 루프와 함께 필드.`ldp q2, q3`2`add v.4s``addv s0, v0.4s`그리고`fmov w8, s0`- 그래

고정된 트리프 카운트는 루프를 제거합니다.`sum4`한 개`movdqu`, 감소, 그리고`movd`뒷면이 없죠`poly8`벡터화할 수 없습니다. 왜냐하면 모든 반복이 이전 축적자에 달려 있기 때문에 컴파일러는 8번 풀 수 있습니다. 0에서 까지의 오프셋에서 8번의 로드`0x1c``%rdi`, 각 5에 의해 이동하고 계산하는 추수`acc * 31`. 인식기 는 한 기지에서 연속적인 오프셋을 가진 로드를 계산하고 보고합니다 `loop unrolled by 8, no back edge`AArch64에 4번과 같은 부하가 도착합니다`ldp`쌍으로

 벡터라이저를 끄세요`-fno-vectorize -fno-slp-vectorize`그리고`sum_n`8으로 풀린 스칼라 루프가 됩니다. 8으로 풀린 스칼라 루프가 됩니다.`addl k(%rdi,%rdx,4), %eax`그리고`addq $8`, 더해 남은 루프`sum4`4을 더하면 됩니다.`unrolled loop``copies: 8`그리고`indexStep: 8`첫 번째와`copies: 4`두 번째로

33강습은 2개의 뒷면이 발견되었습니다`total``-O2`이 강의에서는 두 개의 루프라고 불리는데, 이 루프의 한 벡터 몸과 한 벡터 몸의 나머지 부분이 있습니다.`is_loop()`확인해 보세요, 왜냐하면`digest`AArch64에 있는 AArch64에는 루프가 아닌 공유 기본 블록에 대한 후진 가지들이 포함되어 있으며, 인식기 최초의 버전은 그것들을 벡터 루프로 계산했습니다.

### 라이브러리 호출이 되는 루프

`LoopIdiomRecognize`모든 바이트에 0을 저장하는 루프를 호출으로 변환합니다`memset`,`-O1`위로 올라갑니다.`fill``-O2` `testl %esi, %esi; jle; movl %esi, %edx; xorl %esi, %esi; jmp memset@PLT`이명박은 이사를 통해`R_X86_64_PLT32 memset-0x4`, 그리고 함수는`retq`빈 경로에 있습니다.`store loop recognized as memset(...)`그리고 소스 루프에 대해 확인합니다. 왜냐하면 소스는 결코 이름을 밝히지 않기 때문입니다.`memset`- 그래

`copy16`전화`memcpy`16의 상수와 x86의 백엔드는`movups (%rsi), %xmm0; movups %xmm0, (%rdi)`1 개 매장 8개`memcpy`- `-O0`같은 호출은 2 8 바이트 `movq`쌍으로`-fno-builtin`전화는 전화로 남아 있습니다.`jmp memcpy@PLT``movl $0x10, %edx`그리고`fill`벡터라이저는 16바이트의 2개의 ループ으로 변환합니다.`movups`반복에 따라 저장합니다. 인식기 보고`vectorized store loop: 2 x 16-byte stores = 32 bytes per iteration`그 건물에 대한

## 사라진 전화 또는 점프가 되는 전화

`tail_caller`수익금`tail_target(x + 1)`- `-O0`그것은`addl $0x1, %edi; callq tail_target@PLT; addq $0x10, %rsp; popq %rbp; retq`- `-O2`그것은`incl %edi; jmp tail_target@PLT`전화자의 프레임이 없어지고 전화자는 전화자의 전화자에게 돌아옵니다. AArch64에서 점프는`b tail_target``R_AARCH64_JUMP26`. 인식기에서는`jmp`또는`b`레슨 33의 리큐티브 다운스는 함수 출구로 취급해야 합니다. 왜냐하면 목표가 함수 밖에 있기 때문입니다.

`twice_sum`전화`leaf_add`- `-O0`전화가 거기 있어요`callq leaf_add@PLT`- `-O1``leaf_add``leal (%rdi,%rsi), %eax`, 내부에 나타납니다`twice_sum`전화가 없어`-O0`clang은 모든 함수를 표시합니다`optnone`그리고`noinline`항상 직선형인터넷을 이용해서`twice_sum`전화`leaf_add`, 호출 또는 꼬리 점프 그것을 찾을 수 없습니다, 그리고 다시 호출자에서 Callee의 몸 모양을 찾고: mnemonic와 소스 오퍼랜드는 목적지를 제거, 그래서 `add w8, w1, w0`AArch64 호출자 일치에서`add w0, w1, w0`한 가지 증거는 일치합니다.

`dispatch`둘 다 결합합니다. 16개의  테이블이`movl %esi, %edi; jmp fN@PLT`. 인식기에는 하나의 스위치와 16개의 꼬리 호출이 보고되어 있으며, 모두 소스의 16개의 호출에 비해 확인되었습니다.

## 데이터 로 된 지부 들 이 이동

`clamp_max` `movl %esi, %eax; cmpl %esi, %edi; cmovgl %edi, %eax`평가자 이름`%edi``a`그리고`%esi``b`, 비교를 기록하고,`cmovg``a > b ? a : b`, 이 문서는 출처 문자로 되어 있습니다.`abs_int` `movl %edi, %eax; negl %eax; cmovsl %edi, %eax`그리고 이렇게 읽습니다.`-x < 0 ? x : -x`AArch64는 이렇게 적어줍니다`cmp w0, #0; cneg w0, w0, mi`그리고 이렇게 읽습니다.`x < 0 ? -x : x`-`is_pos` `xorl %eax, %eax; testl %edi, %edi; setg %al`, 이 글은`(x > 0)`- 이쪽은`-fif-conversion`이 같은 문제로`cmov`LLVM에서 선택. LLVM에서 선택 `X86CmovConversion`통과하면 `cmov`이윤을 판단할 때 다시 분할에 들어가서 같은 원천이 루프에서 양 형태를 나타낼 수 있는 이유입니다.

`-O0`이 중 어느 것도 존재하지 않습니다.`clamp_max`비교, a`jle`2개의 매장을 같은 슬롯에 넣고, 그리고 한 장을 넣고`-O0`그리고`branchless select``-O1`, 이것은 그림에서 볼 수 있는 사실 중 하나입니다.

`mul9`한 개`leal (%rdi,%rdi,8), %eax`, 그리고 인식기 보고서`strength reduction``x * 9`, 원천이 9으로 곱하기 때문에 원천이 계수를 가지고 있을 때만 그렇게 합니다.`lea`표의 지수를 확장하는 것은 곱셈이 아닙니다.

## 이디오미어 처럼 보이는 두 가지 가혹 한 특징

스택 보호자는 컴파일러 기능이며, 에이전트가 다른 방법으로 프로그램 논리처럼 읽을 수 있는 모양을 남겨줍니다. `canary.c``-fstack-protector-strong`x86-64에서 리눅스는 다음과 같다:

```text
       7: 64 48 8b 04 25 28 00 00 00   	movq	%fs:0x28, %rax
      10: 48 89 44 24 40               	movq	%rax, 0x40(%rsp)
      26: 64 48 8b 0c 25 28 00 00 00   	movq	%fs:0x28, %rcx
      2f: 48 3b 4c 24 40               	cmpq	0x40(%rsp), %rcx
      34: 75 05                        	jne	0x3b <with_canary+0x3b>
      3b: e8 00 00 00 00               	callq	0x40 <plain_leaf>
		000000000000003c:  R_X86_64_PLT32	__stack_chk_fail-0x4
```

`%fs:0x28` `stack_guard`Glibc에서`tcbhead_t`, 40바이트 오프셋, 그리고 LLVM의`getIRStackGuard`Glibc, Bionic, 그리고 Fuchsia를 위한 슬롯의 이름. 선두는 버퍼 위에 있는 경호를 복사하고, 에필로그는 비교하고, 실패 경로는 호출합니다.`__stack_chk_fail`AArch64 리눅스에서 경비자는 글로벌에서 온`__stack_chk_guard`GOT을 통해`adrp`그리고`ldr`, 그리고 실패는`bl __stack_chk_fail`. 인식기에서는 경비원, 슬롯, 비교 및 실패 호출을 보고합니다.`plain_leaf`, 무선, 카나리 미지`strong`, 즉, 배열을 통해 기능을 보호합니다.`alloca`연구 노트에는 MSVC 양식도 적혀 있습니다.`/GS`, 쿠키와 섞여`%rsp`그리고 확인되었습니다`__security_check_cookie`; 이 기계에 MSVC 링크터가 존재하지 않으므로 그 모양은 컴파일러의 집합 출력에서만 설명된다.

`-fcf-protection=full`     `endbr64`, 바이트`f3 0f 1e fa`, 모든 기능의 첫 번째 명령으로. 그것은 제어 흐름의 강제와 함께 프로세서에서 간접 지점의 착륙 패드입니다.`nop`다른 곳에서는. 지드라의 x86-64 함수 시작 패턴은`endbr64``push rbp; mov rbp, rsp`이 이유 때문에, 인식기에는`cet landing pad`, 즉, 4개의 특이한 바이트로 시작하는 함수는 데이터로 오해하지 않습니다.

## 기자 들 이 는 것

37강의 모든 디컴파일러는 이 파생 중 일부를 다시 쓰기 규칙으로 실행합니다.`ruleaction.cc`-`RuleDivOpt`"INT_MULT을 INT_DIV 또는 INT_SDIV로 변환하고 양식을 `sub( (zext(V)*c), d) >> e => V / (2^n/(c-1)) where n = d*8 + e`그리고 `sext`그리고`s>>`-`RuleModOpt`는 "INT_REM 및 INT_SREM을 최적화하는 표현을 단순화합니다".`RuleDivTermAdd`추가 수정을 처리합니다.`RuleSignDiv2` `(V + -1*(V s>> 31)) s>> 1``V s/ 2`그리고`RulePositiveDiv`서명된 값의 분배를 명확한 표지 비트로 서명되지 않은 것으로 변환합니다.`grade``-O1`, 그리고 출력값은`uVar2 = param_1 / 10 - 6;`- 부부는 접어들었어

이 규칙에 대한 입력은 자바 없이 볼 수 있습니다. venv의 pypcode 4.0.1는 Ghidra가 사용하는 SLEIGH 사양과 동일한 스펙을 갱신하고,`code/fixtures/idioms-x86_64-O2.lifts.json``div10s`: 7개의 지침에 대한 112개의 항목, 그 중 7개의 항목은`IMARK`각 명령어를 열 수 있는 표시기들 중`RAX = RAX * unique[95a00:8]`그 후`unique[95a00:8] = sext(0x66666667)``RCX = RCX >> unique[d1a00:4]`그리고`RAX = RAX s>> unique[c5c00:4]`- `shrq`41개의 사업과`sarq`40개씩 달리고 있고, 대부분 깃발을 계산합니다.`RuleDivOpt`이 스트림의 곱셈과 두 번의 전환이 일치합니다. 그리고 죽은 코드 제거는 아무것도 읽지 않는 깃발을 제거합니다.

Angr 10.0.3가 우리 쪽으로 `-O2`대상, 그리고`idioms-x86_64-O2.angr.json`20개의 함수를 위한 디컴파일러 출력을 유지합니다. 서명되지 않은 양식을 접합니다: `div10u` `return a0 / 10;`. 서명된 양식을 접하지 않습니다: `div10s` `v1 = a0 * 1717986919; return ((long long)(v1) >> 0x22) + (v1 >> 63);`그리고`mod10s` `a0 - (...) * 2 * 5`- `div7u`인쇄합니다`(a0 / 7 + ((a0 * 6 / 7 & 0xffffffff) >> 1 & 0xffffffff) & 0xffffffff) >> 2`, 즉, 정렬된 용어가 수학적 형태로 살아남는`mul9` `a0 * 9``linear_switch` `(a0 < 7 ? a0 * 10 + 10 : 0xffffffff)``clamp_max` `((int)a1 < (int)a0 ? a0 : a1)``is_pos` `a0 > 0`그리고`fill` `return memset(a0, 0, a1);`- 인쇄물`table_switch`짐으로`*(int *)(4 * a0 + 4195400)`값이 없는 것,`sum_n``_mm_add_epi32`그리고`_mm_shuffle_epi32`본질적인 요소, 그리고`tail_caller``tail_target(); return;`논쟁이 사라진 상태에서`digest`점프 테이블이 `goto *((void *)(...))`테이블 수학적 기록이 작성되어 있습니다.

리진 0.9.1와 라다레2 6.2.4은 같은 객체에서 연구 캐시에 출처에서 내장되었습니다.`pdc`발자국`div10s``rax = rax * 0x66666667; rcx >>>= 0x3f; rax >>= 0x22; eax += ecx`, 등록 레벨의 접어들지 않는 pseudo-C, 그리고`table_switch``eax = dword [rcx + rax*4]``RELOC 32 .rodata``lea`. 리진에는 내장된 디컴파일러가 없습니다.`aoi` `imul`128-비트 제품으로 lldb-1703.0.236.21는 ELF 객체와 그 `disassemble -n div10s`7개의 명령어를 인쇄합니다`llvm-objdump`, 왜냐하면 둘 다 LLVM의 해체기를 사용하기 때문입니다. Capstone 5.0.7는 동일한 바이트를 해독하고`ret`그리고`mode64`이 강의는 어떤 언어들이 겹쳐지는지에 대해 아무런 주장도 하지 않습니다. 이 강의는 이 단계의 문헌을 설명합니다.

컴파일러 익스플로러는 앞으로 방향을 설정하는 도구입니다.`idioms.c`, "x86-64 clang 18.1.0" 또는 "ARM64 GCC 14.2.0"와 같은 컴파일러 항목을 선택하고 플래그를 설정합니다. 서비스는 약 1,050 C 컴파일러 항목을 목록에 포함하고 API를 가지고 있습니다:`GET /api/compilers/c`식별자를 반환하고`POST /api/compiler/<id>/compile`Matt Godbolt의 2019 ACM Queue 문서는 이 도구로 분할, 인구 수, 연쇄 조건, 합 합 합식 아이디오미를 통해 돌아갑니다. 이 기계가 생성할 수 없는 GCC 출력에서 사용하십시오. 그리고 GCC의 점프 테이블 문턱을 비교하고`-O2`가이드라인을 통해 GCC 12에서 벡터화 기본 설정이 있습니다.

## 건설 해

디모를 실행하세요:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
```

출력은 JSON 보고서입니다. 18 개 빌드마다 모든 함수와 그 어휘를 목록으로 나열합니다. 종류, 소스 형태, 증거 주소, 검증 및 세부 필드.`-O2`대조적으로`-O3`두 건축물 모두 비교, 그리고 `unverified`목록

예상형:

```json
{
  "builds": {
    "idioms-x86_64-O2": {
      "arch": "x86_64", "level": "O2", "flags": "x86_64",
      "functions": {
        "div7u": [{"kind": "division", "source": "x / 7", "evidence": ["0x30", "0x32", "0x39", "0x3d", "0x3f", "0x41", "0x43"], "verified": true, "form": "magic multiply with add fix-up", "magic": "0x24924925", "effectiveMagic": "0x124924925", "shift": 35, "...": "..."}],
        "table_switch": [{"kind": "switch", "source": "switch (k) as lookup table", "table": ".rodata+0x28", "entries": 7, "values": [10, 20, 30, 40, 50, 60, 71], "...": "..."}],
        "sum_n": [{"kind": "vector loop", "lanes": 4, "accumulators": 2, "elementsPerIteration": 8, "...": "..."}]
      }
    }
  },
  "kindMatrix": {"idioms-x86_64-O2": {"division": 5, "modulo": 3, "switch": 6, "vector loop": 3, "...": "..."}},
  "sameCodeAtO2AndO3": {"x86_64": {"identical": true}, "arm64": {"identical": false, "differences": ["..."]}},
  "unverified": []
}
```

읽으세요`code/main.py`이 순서로:

1. `parse_listing()``llvm-objdump -d -r`두 구조에 대한 함수, 지침 및 첨부 이전으로 텍스트를 입력합니다.
2. `ElfFile`섹션, 상징, 그리고`.rela.*`항목 및`words()`테이블 항목을 읽습니다.
3. `magic_numbers()``divisor_from_magic()`그리고`evaluate_division()`그랜런드-몬트고메리 추리 (Granlund-Montgomery derivation) 는 앞으로, 뒤로, 그리고 명령 순서로
4. `parse_source()`C 파일에서 확인 요구사항을 구성하는 구조를 추출합니다.
5. `Evaluator`블록별로 상징적인 패스입니다. 이름 등록과 스택 슬롯을
6. `find_divisions()`그리고`find_modulos()`곱셈, 전환, 고정, 복제, 그리고 2의 힘의 형태를 일치시킵니다.
7. `find_switches()`점프 테이블, 검색 테이블, 선형 지도, 선을 선택, 비교 나무, 그리고 비교 선을 분류합니다.
8. `find_vector_loops()``find_unrolled_loops()``find_tail_calls()``find_inlined_calls()``find_selects()``find_memory_builtins()``find_stack_protector()``find_cet()`그리고`find_strength_reduction()`나머지는 덮어
9. `analyze_function()`각 언어의 결과 이름을 다음 평가자 패스에 입력하여 순서대로 실행합니다.

3개의 명령이 더 있습니다.`python3 code/main.py scan FILE.objdump.txt [FUNCTION]`하나의 리스트에 있는 인식기, 객체와 그에 맞는 C 파일이 옆에 있습니다. `python3 code/main.py magic DIVISOR [signed]`곱셈, 이동, 오류를 인쇄하고, 그 정체성이 가장자리 값에 유지되는지 여부를 보여줍니다. `python3 code/main.py figure-data`그림이 삽입한 데이터를 인쇄합니다.

## 사용 하 고

새로운 객체에서 이렇게 인식기를 사용하세요.

1. 포착`llvm-objdump -d -r`객체에서 정확한 컴파일러 명령을 옆에 두면, 인식기에서는 목록 헤더에서 구조를 읽습니다.
2. 달아`scan`목록에 올라가서`unverified`각각의 항목은 원본 분석자가 보지 못한 구조물 또는 인식기가 잘못 읽은 형태이며 둘 다 증거 주소를 살펴볼 자격이 있습니다.
3. 각 부문에서,`algorithm`시장을 `clangMatchesAlgorithm`사실 컴파일러는 가장 작은 유효한 전환을 선택했습니다. 잘못된 경우 컴파일러는 아직 모르는 이유를 가지고 있습니다.
4. 각 스위치에 대해 비교해 보세요`lowering`당신이 만든 레벨들을 넘어서서, 나무가 되는 테이블은
5. 각 루프에 대해 읽어보세요`elementsPerIteration`그리고`scalarRemainderLoop`, 두 개의 뒷면 리슨 33 보고서는 하나의 소스 루프입니다
6. 같은 객체에서 한 개의 디컴파일러를 실행하고, 각 언어 옆에 그 텍스트를 인용하고, 어떤 것을 접어 넣었는지 기록하세요. 그 기록은 45번 강의의 기본 라인입니다.

## 인터랙티브 연구소

### 실험실 A: 마법 숫자를 추출하고,

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization/code
python3 -q
```

실행:

```python
from main import *
magic_numbers(10), magic_numbers(10, signed=True)
magic_numbers(7), magic_numbers(7, signed=True)
divisor_from_magic(0x66666667, 34, signed=True), divisor_from_magic(0x66666667, 33, signed=True)
```

계산`ceil(2^35 / 10)`첫 번째 호출 전에 종이 위에 올려 놓습니다.`unsigned div13(unsigned x) { return x / 13; }``idioms.c`, `-O2``build_fixtures.sh`, 그리고 목록의 상수를 확인합니다`magic_numbers(13)`- 그래

### 연구소 B: 테이블과 나무

```python
listing = load_listing("idioms-x86_64-O2.objdump.txt")
elf = load_elf("idioms-x86_64-O2.o")
sources = load_source("idioms.c")
[i.to_dict() for i in analyze_function(listing, "table_switch", elf, sources)]
[i.to_dict() for i in analyze_function(listing, "sparse_switch", elf, sources)]
elf.words(".rodata", 0x28, 7)
```

변화`71`다시 `70``table_switch`, 재건`-O2`, 그리고 검색 테이블이 선형 지도가 되는 것을 관찰합니다.`ArrayKind`테이블

### 실험실 C: 3개의 설정에서 루프

```python
for name in ("idioms-x86_64-O1", "idioms-x86_64-O2", "idioms-x86_64-novec-O2"):
    print(name, [i.source for i in analyze_function(load_listing(name + ".objdump.txt"), "sum_n", load_elf(name + ".o"), sources)])
```

의 제어 흐름 그래프를 그리십시오`sum_n``-O2`손으로, 보호자, 마스크, 벡터 몸, 줄여서, 그리고 나머지 루프를 표시하고,`detail`필드

### 연구소 D: 공유 분자

```python
for name in ("idioms-x86_64-O1", "idioms-arm64-O1"):
    print([(i.kind, i.source, i.detail.get("sharedQuotient")) for i in analyze_function(load_listing(name + ".objdump.txt"), "digest", load_elf(name + ".o"), sources)])
```

이 문서를 읽어보세요`-O1` 목록`digest`그리고 x86-64에서 표시를 고정하는 양수와 결합하는 두 가지 지침을 찾아보세요.

## 연습 실험실

픽처에 비트 트릭을 추가하고 인식기를 확장하십시오.

요구 사항:

- 글쓰기`popcount``ctz`그리고`rotl`GCC 빌드와 함께 작동하는 기능과`-O2``-mpopcnt -mbmi`, 그리고 그 객체를 목록과 함께 채용합니다.
- `0x55555555``0x33333333``0x0f0f0f0f``0x01010101`인구 수록 순서`TargetLowering::expandCTPOP`발사하고, 보고하는`popcount`네 개의 상수들을 증거로
- 인식하라`rep bsfl``tzcnt`- 또는 -`bsf`코딩 및`roll %cl`로턴으로 돌아가서 두 개를 모두 빌트틴으로 디코드해
- 새로운 종을 추가합니다`parse_source()`검증, 그래서 a`popcount`언어는 소스가 호출할 때만 확인됩니다`__builtin_popcount`- 그래
- 기기 목록에서 상수를 읽는 언어별 테스트를 추가하십시오.

성공이란`python3 code/main.py`3가지 새로운 종을 보고합니다`verified: true`두 방 모두에서, 그리고 스위트는 여전히 빈`unverified`목록

## 교훈 유물

이 교훈은`outputs/skill-compiler-idioms-and-optimization.md`. 목록, 객체 및 그 소스를 디컴파일러 비교로 검증된 언어 보고서로 변환하는 데 사용하십시오. 그것은 모든 주장에 대한 증거 주소, 각 분할에 대한 마법 숫자 추리, 각 스위치의 하락 유형 및 입력 소스, 그리고 각 언어에 대한 인용된 디컴파일러 라인을 요구합니다.

## 확인 해 보

데모와 결정적 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

검증은 다음과 같은 사실을 증명해야 합니다.

- 목록 분석기는 에서 25개의 함수를 읽습니다.`-O2`객체, 바이트를 유지하고 붙여 `R_X86_64_PC32 .rodata+0x24``leaq``table_switch`
- ELF 리더가 반환합니다 `[10, 20, 30, 40, 50, 60, 71]``.rodata+0x28`그리고 10개의 이전`.rela.rodata`
- `magic_numbers`수익금`0xcccccccd`시위 35`0x66666667`34명과 함께`0x124924925`35과 추가 양식,`0x55555556`32과 함께, 그리고`0xaaaaaaab`33
- 이 신원은 2에서 64까지의 모든 분자에 대한 32비트 가장자리 값에 2의 힘을 아닌 서명 및 서명되지 않은 값에 해당합니다.
- `divisor_from_magic`10을, 5을, 7을, 3을 복원하고 잘못된 쌍을 거부합니다.
- 추가 고정 순서 계산 `n // 7`정확히
- 네 개의 x86-64 분할은 오른쪽 곱셈, 이동, 분자, 형태를 보고, 네 개의 AArch64 분할은 해독합니다 `mov`그리고`movk`
- `-O0`사용 `divl`그리고`idivl``-O0 -fast-isel=false`곱셈을 사용하며,`digest``-O0`두 가지를 섞어
- 모두로는 복제복으로 인식됩니다.`msub`, 2번 힘,`sdiv`더하기`mul`더하기`subs`, 그리고 하드웨어`idivl`
- 공유 분모는 분모와 모듈을 모두 `-O1`
- 5개의 하락은`-O2`두 구조에서 공식, 값, 목표, 중추점 및 선택 표현을
- `-O0`스위치는 x86-64에서 점프 테이블이고 AArch64에서 체인을 비교합니다
- `digest`스위치는 점프 테이블이고, 접힌 인수 16을 가진 검색 테이블이고, x86-64에서 4개의 다른 목표가 있는 점프 테이블이고, AArch64에서 9에서 10까지의 범위 테스트를 가진 비교 나무입니다
- `-fno-jump-tables`비교나무를 생산하고, 16개의 사례를`dispatch`x86-64에서 이전한 지점과 AArch64에서 압축된 바이트 테이블에서 목표물을 읽습니다.
- 벡터 루프는 4 라인, 2 축적 장치, 반복당 8개의 요소, 마스크, 보호, 감소 및 나머지 루프를 보고합니다.
- 고정된 여행 루프는 완전히 벡터화되거나 완전히 풀려납니다.`-fno-vectorize`8까지 풀
- `-O1`벡터화도 없습니다`-O2`그리고`-O3`x86-64에서 동일하고 AArch64에서 그들은 오직 `call_switch`, 어디`-O3`17개의 지침이 있습니다.`-O2`18년
- `-fno-builtin`저장소 루프를 벡터화된 저장소 루프로 변환하고 유지합니다`memcpy`전화
- 꼬리 전화, `memset`대체, 16바이트 인라인 복사본, 그리고 `-O0`2단법 복사본이 인식됩니다
- 이 이 이 이 이`-O1`몸 모양으로
- 으로  코드를 해독합니다`a > b ? a : b``-x < 0 ? x : -x``(x > 0)`그리고`sum % 10 < 5 ? sum % 10 : 5`
- 스택 보호자 보고서`%fs:0x28`, 슬롯, 그리고`__stack_chk_fail`그리고`endbr64`CET 빌딩의 모든 기능에 대한 보고가 있습니다
- 소스 파서에서는 함수 포인터 매개 변수, 스위치 케이스, 호출 및 축적자 이름들을 읽습니다.
- 모든 빌드에서 모든 어휘가 확인되고 그 종류의 매트릭스는 일치합니다
- 상호 작용적인 그림은 분석에서 생성되는 동일한 데이터를 포함합니다

## 생산 실패 모드

| Failure | What the weak tool reports | What the analysis must prove |
|---|---|---|
| Multiply by a large odd constant | "multiplies by 1717986919" | The constant is `ceil(2^s / d)` for one `d`, the error satisfies the bound, and the shift is the smallest valid one |
| Add fix-up after a 32-bit shift | Five arithmetic instructions | The multiplier is 33 bits wide and the tail is the add form of the same method |
| Same multiplier, different shift | The same divisor | The shift selects the divisor: 34 is 10, 33 is 5 |
| Power-of-two signed modulo | "adds 7, masks, subtracts" | The bias rounds toward zero and the result is `x % 8` |
| Indexed load from `.rodata` | "a jump table" | A lookup table of values, with entries read from the bytes at addend plus 4 |
| Affine arithmetic and a `cmov` | "computes 10k + 10" | A switch lowered as a linear map, verified against every source case |
| Compare chain with ordered splits | "a sequence of ifs" | A binary search over the case constants with the pivots named |
| Backward branch to a default block | "a loop" | The target leaves the region with an unconditional jump; it is a shared tail |
| Two back edges in one function | "two loops" | One source loop: the vector body and its scalar remainder |
| `jmp memset@PLT` with no `ret` | "the function has no return" | A tail call that returns through the callee, replacing a store loop |
| Callee missing from the call graph | "never called" | Inlined: the callee's body shape appears in the caller |
| `%fs:0x28` load and compare | "reads thread-local data" | The stack protector canary, with the fail path to `__stack_chk_fail` |
| Four odd bytes at function start | "data before the function" | `endbr64`, the CET landing pad |
| Decompiler shows raw arithmetic | "the tool is wrong" | The tool did not apply a fold; the derivation gives the source form and the quoted output records the gap |

## 운영 규칙

형태를 일치시켜서 추리값을 뒤쪽으로 실행하고 그것을 증명하는 상수를 작성합니다. 모든 언어와 증거 주소를 보고하고, 암호를 해독한 소스 형태를 보고, 각 언어는 컴파일한 소스에 맞게 확인하고, 각각의 디컴파일러가 동일한 바이트에 인쇄한 내용을 인용합니다.

## 더 많은 읽기

- [Granlund, Montgomery, "Division by Invariant Integers using Multiplication" (PLDI 1994)](https://gmplib.org/~tege/divcnst-pldi94.pdf)
- [Warren, Hacker's Delight, 2nd edition, Chapter 10: Integer Division By Constants](https://www.informit.com/store/hackers-delight-9780321842688)
- [Lemire, Kaser, Kurz, "Faster Remainder by Direct Computation" (2019)](https://arxiv.org/abs/1902.01961)
- [libdivide, header-only division by runtime constants](https://github.com/ridiculousfish/libdivide)
- [LLVM `DivisionByConstantInfo.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Support/DivisionByConstantInfo.cpp)
- [LLVM `SwitchLoweringUtils.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/SwitchLoweringUtils.cpp)그리고[`TargetLoweringBase.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/TargetLoweringBase.cpp)
- [LLVM `SimplifyCFG.cpp`, `simplifySwitchLookup`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Utils/SimplifyCFG.cpp)
- [LLVM Auto-Vectorization documentation](https://llvm.org/docs/Vectorizers.html)그리고[LLVM 3.4 release notes](https://releases.llvm.org/3.4/docs/ReleaseNotes.html)
- [LLVM `LoopIdiomRecognize.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Scalar/LoopIdiomRecognize.cpp)
- [LLVM `X86CmovConversion.cpp`](https://github.com/llvm/llvm-project/blob/release/20.x/llvm/lib/Target/X86/X86CmovConversion.cpp)
- [LLVM `StackProtector.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/StackProtector.cpp)그리고[`X86ISelLoweringCall.cpp`, `getIRStackGuard`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Target/X86/X86ISelLoweringCall.cpp)
- [glibc `sysdeps/x86_64/nptl/tls.h`, `tcbhead_t`](https://sourceware.org/git/?p=glibc.git;a=blob;f=sysdeps/x86_64/nptl/tls.h)
- [GCC `tree-switch-conversion.cc`](https://github.com/gcc-mirror/gcc/blob/master/gcc/tree-switch-conversion.cc)[GCC Optimize Options](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html)그리고[GCC 12 release notes](https://gcc.gnu.org/gcc-12/changes.html)
- [Ghidra decompiler `ruleaction.cc`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/decompile/cpp/ruleaction.cc)
- [angr decompiler documentation](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [radare2 book: decompilers](https://book.rada.re/arch/decompile.html)
- [Compiler Explorer API](https://github.com/compiler-explorer/compiler-explorer/blob/main/docs/API.md)
- [Godbolt, "Optimizations in C++ Compilers: A practical journey", ACM Queue 17(5), 2019](https://queue.acm.org/detail.cfm?id=3372264)
- [Microsoft, `/GS` (Buffer Security Check)](https://learn.microsoft.com/en-us/cpp/build/reference/gs-buffer-security-check)
