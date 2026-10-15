# 사이드코드로 전환: IR, SSA, 그리고 처음부터 구조화

> 디컴파일러 출력은 숨겨진 추리값을 가진 주장입니다. 당신이 직접 추리값을 만들 때, 그 출력의 모든 선이 확인할 수 있는 것이 됩니다.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32 (ELF from scratch), Phase 13 · 33 (disassembly and control flow)
**Time:** ~150 minutes

## 학습 목표

- 리프트는 x86-64 명령어를 작은 IR로 뚜렷한 플래그, 로드, 스토어, 지점, 호출 및 반환으로 해독했습니다.
- 프레임 슬롯을 로컬 변수로 변환하고 시스템 V 논증 레지스터를 매개 변수로 변환합니다.
- 지배적 경계에 phi 함수와 최소 SSA를 구축하고, 그 다음 유체 코드를 대체하고 단순화하고 제거하십시오.
- 회복`if``if``else``while`그리고`do while`제어 흐름 그래프에서 포스트다미나터와 뒷 가장자리
- 곱셈을 설명해 주세요`0x66666667`10으로 나누면 그 신원을 증명할 수 있습니다.
- 같은 함수들을 위한 기드라 사이드코드를 줄에 줄로 읽어보고 각각의 차이 뒤에 있는 명령어 또는 추측을 명명하세요.

## 문제

의 사이보코드를 에게 요청했네`percent_change``ledger-x86_64-O1.o`지드라 12.1.4는 10초 후에 대답했습니다.

```c
undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)

{
  long lVar1;
  undefined1 auVar2 [16];
  undefined1 auVar3 [16];
  
  if (param_1 != 0) {
    lVar1 = (long)((param_2 - param_1) * 100);
    auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
    auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
    return auVar3;
  }
  auVar2._8_8_ = 0;
  auVar2._0_8_ = param_3;
  return auVar2 << 0x40;
}
```

원천은 4 줄이고 2 줄이 걸립니다.`int`값과 반환 1 `int`. 지드라는 16바이트의 반환 값과 소스가 없는 세 번째 매개 변수를 보고합니다. 기계 코드 16바이트는 정확하고, 지드라는 각을 올바르게 해독했습니다. 서명은 추측이며 텍스트에 아무것도 그것을 1으로 표시하지 않습니다.

rea는 이 텍스트를`procedure_pseudo_code`이 제한은 "Pseudocode는 Ghidra 디컴파일러 출력, 원래 소스 및 Hopper 출력과 텍스트 동등하지 않습니다".`compare_functions`도구는 텍스트 라인처럼 사이드코드를 구분합니다. 자체 차원 기록은 "집합은 불투명한 공급자 텍스트"라고 말합니다. 그리고 이 이전 정상화는 사용할 수 없습니다. rea는 텍스트 내부를 볼 수 없으며, 단지 읽을 수있는 에이전트도 볼 수 없습니다.

RE아의 DX-Ball 기록은 비용을 보여줍니다.`FUN_00406400(void)`전화`__ftol()`명령어 뷰는 스택 입력과 x87 표현을 보여주었습니다. 두 뷰가 일치하지 않기 때문에 에이전트가 계속되었습니다.

이 수업은 디컴파일러가 숨기는 추리법을 구축합니다. 당신은 수업 33에서 디코딩한 56개의 명령어에서 시작하여 IR로 끌어올리고 SSA로 이름을 바꾸고 단순화하고 구조로 변경합니다.`percent_change``grade`그리고`total`테스트는 Clang로 출력을 컴파일하고 입력 그리드에서 출처에 맞게 실행합니다.

```figure
lifting-stages-percent-change
```

## 장과 오라클

`code/fixtures/ledger.c`이 과정의 이 부분의 공유 고정입니다:

```c
int percent_change(int before, int after) {
    if (before == 0) return 0;
    return (after - before) * 100 / before;
}

int grade(int score) {
    switch (score / 10) {
    case 10:
    case 9: return 4;
    case 8: return 3;
    case 7: return 2;
    case 6: return 1;
    default: return 0;
    }
}

int total(const int *values, int count) {
    int sum = 0;
    for (int i = 0; i < count; i++) sum += values[i];
    return sum;
}
```

`grade_label`이 강의에서 테스트되는 3가지 기능이 있습니다.

이 물체는 `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c`- `-O0`객체는 스택 슬롯 섹션에 옆에 앉아 있습니다. `code/fixtures/README.md`각 객체의 SHA-256와 Ghidra 고정물을 생성한 rea 명령어를 모두 목록으로 표시합니다. 빌드는 고정된 도구 체인에 바이트에 따라 재생 가능한 바이트입니다.

디코더의 오라클은`llvm-objdump -d -r`. 두 개체에 대한 텍스트는`ledger-x86_64-O1.objdump.txt`그리고`ledger-x86_64-O0.objdump.txt`테스트는 이 파일들을 분석하고 모든 명령어를 주소, 바이트, AT&T 텍스트에 따라 비교합니다.`-O1`그리고 모든 명령에`-O0`언제`llvm-objdump`고정된 경로에 설치되어 두 번째 테스트를 통해 다시 비교합니다.

여기 있네`percent_change`오라클이 인쇄한 것처럼

```text
0000000000000000 <percent_change>:
       0: 85 ff                        	testl	%edi, %edi
       2: 74 09                        	je	0xd <percent_change+0xd>
       4: 29 fe                        	subl	%edi, %esi
       6: 6b c6 64                     	imull	$0x64, %esi, %eax
       9: 99                           	cltd
       a: f7 ff                        	idivl	%edi
       c: c3                           	retq
       d: 31 c0                        	xorl	%eax, %eax
       f: c3                           	retq
```

## 단계 1: 명령에 대한 바이이트

33강습은 디코더를 만들었습니다. 이 강습은 작은 복사본을 유지하므로 코드는 자체적으로 실행됩니다. 복사본은 정확히 방출된 오프코드를 포함합니다.`ledger.c``-O0`그리고`-O1`다른 모든 것에 대해`DecodeError`주소와 오프코드 바이트를 포함합니다.

디코더는 인텔 SDM의 바이트 순서를 따르고 있습니다. 2권 2.1. 섹션.`0x40` `0x4F`, 즉, opcode 앞에 바로 앉아야 합니다. REX.W는 64비트 오페란드를 선택하고, REX.R는 `reg`REX.X는 SIB 지수를 확장하고, REX.B는 확장합니다 `r/m`2.1.3 섹션에서는 세 가지 ModR/M 필드를 정의합니다 `mod``reg`그리고`r/m`, 그리고 세 개의 SIB 필드`scale``index`그리고`base`64비트 모드에서`mod = 00``r/m = 101`다음 명령에 비해 32비트 이동을 의미합니다 (부 2.2.1.6).

| Opcode bytes | Form | Fixture example |
|---|---|---|
| `01 29 31 39 85 89` | `op Ev, Gv` | `29 fe` `subl %edi, %esi` |
| `03 2b 3b 8b 8d` | `op Gv, Ev` | `03 04 97` `addl (%rdi,%rdx,4), %eax` |
| `63` with REX.W | `movsxd Gv, Ev` | `48 63 c7` `movslq %edi, %rax` |
| `69` and `6b` | `imul Gv, Ev, imm` | `48 69 c0 67 66 66 66` |
| `83 /0 /5 /7` | `add sub cmp Ev, imm8` | `83 c1 fa` `addl $-0x6, %ecx` |
| `c1 /5 /7` | `shr sar Ev, imm8` | `48 c1 f9 22` `sarq $0x22, %rcx` |
| `f7 /7` | `idiv Ev` | `f7 ff` `idivl %edi` |
| `ff /0 /4` | `inc Ev`, `jmp Ev` | `48 ff c2` `incq %rdx` |
| `70` to `7f`, `eb`, `e8` | `jcc rel8`, `jmp rel8`, `call rel32` | `74 09` `je 0xd` |
| `99`, `c3`, `90`, `0f 1f` | `cltd`, `retq`, `nop` | `66 0f 1f 44 00 00` `nopw (%rax,%rax)` |

`leaq (%rip), %rcx``grade+0x23`이 객체는 이전을 수행합니다`R_X86_64_PC32.rodata+0x10`이산화`0x36`3단계에서 리프트가 해결합니다

## 2단계: 블록과 지배자

기본 블록은 상위에서 한 항목과 아래에서 한 출구로 된 일련의 진술입니다. 이것은 앨런 (1970) 의 정의입니다. 그리고 모든 디컴파일러 종이 그것을 재사용합니다. `build_blocks()`함수 입력, 함수 내부의 모든 점프 목표, 점프 또는 복귀 후의 모든 주소. 각 블록은 마지막 명령에서 후속자를 얻습니다. 조건적 점프에는 두 후속자와`jmp`1개 있습니다.`ret`어떤 블록도 없고, 일반적인 명령으로 끝나는 블록은 다음 리더에게 넘어갑니다.

`total``-O1`5개 블록이 있습니다.

| Block | Instructions | Successors |
|---|---|---|
| `0x40` | `testl %esi, %esi` then `jle 0x5c` | `0x5c`, `0x44` |
| `0x44` | `movl %esi, %ecx`, `xorl %edx, %edx`, `xorl %eax, %eax`, `nopw` | `0x50` |
| `0x50` | `addl (%rdi,%rdx,4), %eax`, `incq %rdx`, `cmpq %rdx, %rcx`, `jne 0x50` | `0x50`, `0x5b` |
| `0x5b` | `retq` | exit |
| `0x5c` | `xorl %eax, %eax` then `retq` | exit |

`immediate_dominators()`쿠퍼, 하비, 케네디 (2001) 의 반복 알고리즘이다. 이 알고리즘은 블록을 반전된 후계 순서로 이동하고 처리 된 전신들의 지배자를 아무것도 바뀌지 않는 한 교차한다. 이 작은 그래프에서는 두 번의 통과로 끝난다.`total`이렇게 써있어요`0x44`지배하는`0x50`- 또한 이렇게 써있어요`0x50`뒷면으로 자신을 지배합니다. 8단계에서는 루프를 찾습니다.

같은 함수는 두 번 더 실행됩니다.`dominance_frontiers()`5단계 SSA에 사용한다.`post_dominators()`가상 출력 노드로 역 그래프에 실행하여 8단계에서 결합을 찾습니다.

## 3단계: 작은 IR로 들어간

IR는 6가지 종류의 문장을 가지고 있습니다.`Assign``Store``Branch``Jump``IndirectJump`그리고`Return`. 표현은 상수, 변수, 너비의 바이너리 연산, 캐스트 (`sext``zext``trunc`), 그리고 부하. 5가지 형태가 더 존재하고 나중에 단순화될 뿐이다.`Flags``Cond``Concat``SignFill`그리고`Symbolic`- 그래

레지스터는 64비트 가문으로 지정된 변수입니다.`%eax``Assign` `rax`너비 32개,`%eax`이 글은`rax`64비트 모드에서는 32비트 로 write의 0이 전체 레지스터에 확장되므로 같은 값의 64비트 후속 읽기`zext`. 리프터는 도달 정의를 알지 못하기 때문에 읽기 너비를 기록하고 SSA가 5 단계에 캐스트를 삽입하도록 합니다.

| Instruction | IR statements |
|---|---|
| `subl %edi, %esi` | `flags = cmp(esi, edi)` then `esi = esi - edi` |
| `testl %edi, %edi` | `flags = test(edi, edi)` |
| `je 0xd` | `if je(flags) goto 0xd else goto 0x4` |
| `xorl %eax, %eax` | `eax = 0` |
| `cltd` | `edx = signfill(eax)` |
| `idivl %edi` | `dividend = edx:eax`, `eax = dividend / edi`, `edx = dividend % edi` |
| `movslq %edi, %rax` | `rax = sext64(edi)` |
| `sarq $0x22, %rcx` | `rcx = rcx >>s 34` |
| `shrq $0x3f, %rax` | `rax = rax >>u 63` |
| `addl (%rdi,%rdx,4), %eax` | `flags = add(eax, load32(rdi + rdx * 4))` then `eax = eax + load32(rdi + rdx * 4)` |
| `leaq (%rip), %rcx` with its relocation | `rcx = &.rodata+0x14` |
| `pushq %rbp`, `movq %rsp, %rbp`, `subq $0x10, %rsp`, `popq %rbp` | nothing, frame bookkeeping |
| `retq` | `return rax` |

### 깃발은 변수입니다

조건 코드를 설정하는 모든 명령에는 라는 이름을 가진 변수가 있습니다`flags`, 그리고 모든 조건부 점프가 그것을 읽습니다.`cmp a, b`글쓰기`cmp(a, b)`, a `test a, b`글쓰기`test(a, b)`그리고`sub`같은 글을 쓴다`cmp`부작용으로 형성되는 형태.`jcc``Branch(Cond(cc, flags), target, fallthrough)`조건 코드는 비교 사업자가 6단계에서 두 개의 만남을 할 때 결정합니다.

| Code | After `cmp(a, b)` | After `test(a, a)` |
|---|---|---|
| `je` | `a == b` | `a == 0` |
| `jne` | `a != b` | `a != 0` |
| `jl`, `jge`, `jle`, `jg` | signed `<`, `>=`, `<=`, `>` | signed compare with 0 |
| `jb`, `jae`, `jbe`, `ja` | unsigned `<`, `>=`, `<=`, `>` | unsigned compare with 0 |

`xorl %eax, %eax`바로 `eax = 0`- 깃발은 이렇게 적혀 있습니다`add`        `xor`언어는 중요한 문제입니다`grade`, 그 지드라가 지냈던 곳

### CLTD 및 IDV

`cltd`        `%edx``%eax`-`idivl %edi`64비트 쌍을 나눈다`%edx:%eax``%edi`, 이수수를 입력합니다`%eax`, 그리고 나머지`%edx`리프터가 이 쌍을 일시적으로 붙인 이름으로`dividend`먼저, 나머지 문서는`%eax`새로운 양수보다 높은 반은`signfill`단순화자 는 이 쌍을 하위 반으로 줄이고, 분할은 32 비트 됩니다.`/`- 그래

### -O0에서 스택 슬롯

`-O0`클랜그는 모든 현지인을 프레임에 넣고`percent_change`매장`%edi` `-0x8(%rbp)`그리고`%esi` `-0xc(%rbp)`그리고 각 용도로 다시 읽어줍니다.`pushq %rbp`다음으로`movq %rsp, %rbp`그 전개막 후, 기본으로 기억 오페란드`%rbp`, 지수가 없고, 이동이 이름의 변수가 됩니다.`local_<hex>`-`-0x8(%rbp)` `local_8``-0xc(%rbp)` `local_c`- 그래

프레임 명령 자체는 IR를 생성하지 않으며,`subq`그리고`addq` `%rsp`다른 메모리 오페란드는`Load`또는`Store`- 그래

### 이전

`leaq (%rip), %rcx``grade`이재가 정해진 상태에서`0x36`이렇게 말합니다`R_X86_64_PC32.rodata+0x10`커가 써줄게`S + A - P`현장에 들어가`S`주소가 `.rodata``A`이 부가`0x10`그리고`P`이 필드의 주소가 됩니다.`next_ip + disp = (P + 4) + S + A - P = S + A + 4`- 그래

리프터는 링크가 없는 동일한 수치를 적용합니다. 목표 오프셋은 추가 + 명령의 끝까지의 거리가 있습니다.`0x10 + 4 = 0x14`IR는`rcx = &.rodata+0x14`, 그리고 테이블은 5개를 담고 있습니다`int`가치`1, 2, 3, 4, 4`- 그래

## 4 단계: 초대 대회 의 매개 변수

시스템 V AMD64 psABI, 3.2.3 섹션에서는 INTEGER 클래스 주장을 통과합니다 `%rdi``%rsi``%rdx``%rcx``%r8``%r9`, 그 순서로. 결과는`%rax`그리고 그 다음`%rdx`3.2.1 섹션에서는`%rbp``%rbx`그리고`%r12` `%r15`모든 것이 소환자에게 있고, 보존되어야 합니다.

`collect_params()`하나의 규칙이 적용됩니다. 함수에서 어떤 글쓰기 전에 읽히는 논쟁 레지스터는 매개 변수입니다. 그러한 레지스터의 가장 높이는 계산을 고정합니다. 따라서 읽히는 함수 `%rsi`그리고 절대`%rdi`아직 두 개의 매개 변수를 가지고 있습니다.`percent_change`읽는다`%edi`그리고`%esi`그래서 `param_1`그리고`param_2`-`grade`읽기만 가능해요`%edi`-`total`읽는다`%rdi`64비트 기반으로`%esi`32비트 계산으로

이제 지드라가`param_3`설명이 있어요`idivl`글쓰기`%rdx`, 그리고 psABI는 128비트 INTEGER 반환을 허용합니다`%rax:%rdx`객체 파일에서는 반환 값의 폭을 알려주는 호출자가 없습니다. Ghidra는 반환 값으로 두 레지스터를 모두 보관했습니다.

0의 경로에서`xorl %eax, %eax`글쓰기만`%eax`- 글드라 읽다`%rdx`함수의 입력으로, 그 입력이 `param_3`지표는 지표가 열려 있는 부분을 추측하는 것입니다.

## 단계 5: SSA, 정의에 한 명칭

을 들어올린 후`grade`글쓰기`rax`4번이나`rcx`3번이나 사이트론, 페란테, 로젠, 웨그만, 그리고 자덱 (1991) 은 정적 단일 할당 형태를 정의합니다. 각 변수는 정확히 한 번 할당되며, 합성 지점에서 phi 함수는 그 정의들 중에서 선택합니다. 이 건물은 두 단계로 이루어져 있습니다. 섹션 5.1은 지배적 경계를 사용하여 phi 함수를 배치하고 섹션 5.2는 지배자 나무를 걸어서 모든 정의와 사용을 다시 이름 붙인다.`insert_phis()`그리고`rename()`이 두 부문을 따라가세요.

SSA 목록`total`건설이 무엇을 생산하는지 보여준다:

```text
block 0x44 -> 0x50
  ecx_1 = esi_0
  edx_1 = 0
  eax_1 = 0
block 0x50 -> 0x50, 0x5b
  eax_2 = phi(0x44: eax_1, 0x50: eax_3)
  rdx_2 = phi(0x44: edx_1, 0x50: rdx_3)
  flags_2 = phi(0x44: flags_1, 0x50: flags_5)
  flags_3 = add(eax_2, load32(rdi_0 + rdx_2 * 4))
  eax_3 = eax_2 + load32(rdi_0 + rdx_2 * 4)
  flags_4 = inc(rdx_2, 1)
  rdx_3 = rdx_2 + 1
  flags_5 = cmp(zext64(ecx_1), rdx_3)
  if jne(flags_5) goto 0x50 else goto 0x5b
```

레지스터의 버전 0은 입력 시 값입니다. `esi_0`그리고`rdi_0`이 부분의 내용은`0x50`설정 블록과 자체를 두 개의 전신으로 합니다. 따라서 루프에 정의가 있는 변수는 phi를 얻습니다.`flags_2`피가 도착했을 때 죽은 상태입니다. 최소 SSA는 그것을 배치합니다.`flags`두 개의 전래에서 정의가 있습니다. 그리고 6단계에서는 아무것도 읽지 않기 때문에 삭제합니다.

이름 변경 단계에서는 너비도 수정됩니다. `edx_1 = 0`32비트 정의입니다`rdx_3 = rdx_2 + 1`64비트, 그래서 phi`rdx_2`더 넓은 폭을 차지합니다.`%rcx``cmpq %rdx, %rcx`64비트이고 정의는`ecx_1 = esi_0`이 값은 32비트입니다`zext64(ecx_1)`마지막 사이드코드의 모든 캐스트는 이 규칙에서 나온다.

"라이트" 부분은 SSA에서 벗어나는 방법입니다.`coalesce_webs()`각 phi와 그 주장을 하나의 변수로 결합하여 웹이라고 부르며 웹에 하나의 이름을 부여한다. 이것은 컴파일러가 이러한 기능들을 위해 발사하는 모양에 대해 작동한다. 이 방법은 병렬 복사본으로 분해될 수 있으며, 두 phis이 한에서 교환 값을 결합하고, 수업은 그 경우를 처리하지 않는다. 사이트로의 섹션 7은 색칠을 통해 일반적인 출구를 설명한다.

## 단계 6: 단순화, 대체, 죽은 코드를 제거

`optimize()`단순화자 는 다음 규칙 을 사용하여 아래쪽에서 위로 표현 을 다시 작성 합니다.

| Before | After |
|---|---|
| `Cond(je, cmp(a, b))` | `a == b`, and the same for the other nine codes |
| `Cond(jle, test(a, a))` | `a <= 0` |
| `x + (-6)` | `x - 6` |
| `trunc32(zext64(x))` where `x` is 32-bit | `x` |
| `trunc32(a + b)` on 64-bit operands | `trunc32(a) + trunc32(b)` |
| `(signfill(x): x) / d` | `x / d` at width 32 |
| `load32(base + idx * 4)` | `base[idx]` |
| `trunc32(p >>s 34) + trunc32(p >>u 63)` with `p = sext64(x) * 0x66666667` | `x / 10` |

앞뒤 대체는 정의를 유일한 용도로 옮긴다. 규칙은 세 가지 조건을 가지고 있다. 사용은 같은 블록에 있다. 사용은 명령어이고 phi가 아니다. 정의가 로드를 포함하면 정의와 사용 사이에 저장 또는 호출이 없습니다. 상수 또는 섹션 주소는 phi를 제외하고는 어디에서나 대체됩니다. phi 주장은 웹에 변수가 남아 있어야 하기 때문에.

죽은 코드 제거는 목적지가 쓸모없는 과목 또는 phi를 삭제합니다.`percent_change`나머지`edx_2 = dividend_1 % edi_0`죽어서 먼저 가죠.`edx_1 = signfill(eax_1)`한 가지 사용으로 대체되므로`dividend_1 = edx_1:eax_1`- 그래

이 쌍의 법칙은`signfill(eax_1):eax_1` `eax_1`, 그리고 분할이 됩니다`eax_1 / edi_0`- 이제`eax_1 = esi_1 * 100`한 가지 용도로 사용되고`esi_1 = esi_0 - edi_0`한 가지 사용이 있고, 둘 다 반환 선언에 이동합니다.`flags`정의가 지점 조건으로 대체되어 사라집니다.

```c
return (param_2 - param_1) * 100 / param_1;
```

### 0x66666667 곱셈

`grade`점수를 10으로 나누고, 은 '아니오'를 내보내죠`idiv`- 방출합니다`imulq $0x66666667, %rax, %rax`그럼`sarq $0x22, %rcx`복사본을 찍어`shrq $0x3f, %rax`그랜런드와 몽고메리, "분배를 사용하여 변함없는 정수" (PLDI 1994), 는 방법을 설명합니다. 컴파일러는 곱자를 선택합니다.`m`그리고 시위`s`- 모든 것`x`범위에서,`(x * m) >> s`이 값은`x / d`- 그래

여기`m = 0x66666667 = 1717986919`그리고`s = 34`수학적 결과:`2^34 / 10 = 1717986918.4`, 그리고 천장은`1717986919`실수로`m * 10 - 2^34 = 6`32비트마다 신원을 유지하도록`x`, 오류 시간`2^31`아래로 내려가야 합니다`2^34`, 그래서 오류는 최대 8이어야 합니다. 6은 최대 8이어야 합니다.`(x * m) >> 34`=`floor(x / 10)`부정적 인 모든`int`- 그래

음향`x`바닥은 0에서 멀어지고 C는 0으로 향합니다.`shrq $0x3f`제품의 표지 빗을 추출합니다.`x`음수입니다. 추가하면 회전도 수정됩니다.

`magic_divisor(m, s)`후보 쌍을 테스트합니다. 계산합니다.`d`의 정수분자`2^s``m`그리고 시도합니다`d`그리고`d + 1`- `d`오직`m`의 천장과 같죠`2^s / d`그리고 오류 묶음도 유지됩니다.`s = 33`주는`d = 5`, 이는 사실, 왜냐하면`0x66666667`또한 `2^33 / 5`검사가 신분을 확인합니다`c_div(x, 10)`                `int`범위

인정받아`grade`읽는다`ecx_1 = param_1 / 10 - 6;`인식이 꺼지면, 데모는 원료 형태를 인쇄합니다.

```c
rax_1 = (long)param_1 * 0x66666667;
ecx_1 = (int)(rax_1 >> 34) + (int)((unsigned long)rax_1 >> 63) - 6;
```

두 가지 모두 같은 값을 컴파일하고 계산합니다. 스위치를 유지하세요. 여러분이 연구하지 않은 컴파일러에서 코드를 읽을 때, 원료 형태는 정직한 형태입니다.

## 7 단계: 사용 방법

기계 코드에는 너비가 있고 타입이 없습니다.`infer_types()`3가지 종류의 증거를 C형으로 변환합니다.`int`, 그리고 64비트 웹은`long`. 요소 접근의 기초가 되는 웹`base[idx]`4 바이트 요소를 가진`int *`. 포인터 타입은 복사본과 피스 사이를 퍼뜨리므로`local_8 = param_1``-O0`둘 다 만들어 냅니다`int *`. 반환 유형은 값의 너비입니다.`return`진술

그 결과`total` `int total(int *param_1, int param_2)`지드라가 썼습니다`int total(long param_1,uint param_2)`이 두 가지 모두 지침에 따라다. 리퍼는 스케일 로드를 포인터 증거로 사용했습니다. 기드라는 레지스터의 너비를 유지했고 접근을 이렇게 기록했습니다.`*(int *)(param_1 + uVar2 * 4)`- 둘 다 볼 수 없어요`const`, 그리고 둘 다 알 수 없습니다`int *``unsigned *`- 그래

리, 어버리노스, 브럼리 (TIE, NDSS 2011) 은 격자 위에 제한 해결으로 프레임 타입 복구. 결과는 한 추측 대신 상부와 하위 경계입니다. 노넌, 로기노프, 코크 (Retypd, PLDI 2016) 는 다형성과 재발을 추가합니다. 그들은 98%의 기억을 보고합니다.`const`이 수업은 그 직선에서 가장 저렴한 두 가지 규칙을 사용하며, 그들이 볼 수 없는 것을 이름 짓습니다.

서명되지 않은 수학적 계산은 변수 유형에 아닌 표현에 보관됩니다. `ja`그 후`cmpl $0x4, %ecx``(unsigned int)ecx_1 > 4`그리고`shrq``(unsigned long)rax_1 >> 63`. 변수는 서명되어 있어 독자가 레지스터 값을 보고 명령어가 서명되지 않은 것으로 취급하는 유일한 장소가 표시됩니다.

## 8단계: 그래프 에 따라 구조 를 만드는 것

시푸엔테스 (1994), 6장, 그래프의 영역과 고위 수준의 언어의 모양을 일치시킵니다. 루프는 먼저 (6.6.1) 와 이어 양방향 조건 (6.6.2) 와 이어 n방향 조건 (6.6.3) 와 이어집니다. 야칸, 에슈웨일러, 게르하르드스-파딜라, 스미스 (NDSS 2015) 는 다른 길을 간다. 그들은 각각의 노드가 실행하는 조건을 추출하고 그 조건에서 구조를 구축합니다. 고정된 모양이 없습니다. 그들의 동기는 측정입니다. 한 표본에서 1571 개의 헥스 레이를 생산하였다.`goto`49 514 라인에서 한 라인씩, 그리고 그 구조는 1,530 개의 핵심 함수에서 아무것도 생산하지 않았습니다.

`structure()`첫 번째 가족 중 작은 일원입니다. 두 가지 사실을 필요로 합니다. 2 단계부터.`Branch`조건부의 결합이다. 뒷한은 출처를 지배하는 블록의 가장자리이다. 자연 루프는 헤더를 통과하지 않고 뒷한의 출처에 도달하는 블록의 집합이다.

`Branch`         `j`이 부분의 본문은

- 만약`j`치 목표가 되는 것인데,`if (!cond) { fallthrough region }`그리고 계속`j`- 그래
- 만약`j`은 은 은`if (cond) { target region }`그리고 계속`j`- 그래
- 만약`j`이 함수는 출구, 두 팔이 돌아갑니다.`if (cond) {... }`그리고 그 뒤에 다른 팔이 있고`else`이 사진은 일찍 돌아온 것 입니다`percent_change`그리고`total`- 그래
- 그렇지 않으면 발사`if (cond) { target } else { fallthrough }`그리고 계속`j`- 이쪽은`percent_change``-O0`, 두 무기 모두 저장되는 곳`local_4`그리고 에피로그에서 만나겠습니다.

루프 헤더:

- 헤더가 a로 끝나는 경우`Branch`    `while (cond) { body }`-`total``-O0`이 표본은 비교합니다`local_14``local_c`그리고 잎은 계속`jge`- 그래
- 헤더가 뒷면으로 있는 블록이거나, 또는 로치가 출구하는 경우,`do { body } while (cond);`-`total``-O1`이 모양은: 블록`0x50`추가, 증가, 비교, 그리고 스스로로 뛰어납니다.

 `IndirectJump`후계자가 없는 블록을 끝내고 있습니다.`grade``-O0`진짜 점프 테이블이죠`jmpq *%rax`5개의 상대적인 이산으로`.rodata+0x0`이리엔 리프터가 메모를 인쇄합니다.`0x76``0x7f``0x88`그리고`0x91`이 실험실에서는 이 실험실의`switch`- 그래

### -O1가 스위치에 무슨 짓을 했나요?

`-O1`클랜그는 점프 테이블을 보관하지 않았습니다`grade`계산해봤어요`score / 10 - 6`그리고 그 결과 4를 서명되지 않은 숫자로 비교했습니다.`int``.rodata+0x14`. 서명되지 않은 비교는 두 가지 모두 포함되는 하나의 명령입니다`score / 10 < 6`그리고`score / 10 > 10`음의 차이가 큰 서명되지 않은 값이기 때문에 동일한 체크가 실패합니다.

테이블은 잘 잡을 수 있어요`1, 2, 3, 4, 4`6~10의 양수`switch`5개로`return`진술은`if`그리고 배열을 읽습니다. 리퍼는 정확히 그렇게 발사하고 테이블을 이름 붙입니다.`lookup_14`그 부분의 이산 후

테이블의 길이는 유리스틱입니다.`table_values()`테이블에서 시작하여 다음으로 읽습니다`.rodata`이 모든 것을`.text`이 객체에서 다음 참조된 오프셋은 `0x28`, 테이블`grade_label`그래서`lookup_14``(0x28 - 0x14) / 4 = 5`4과 비교할 때 서명되지 않은 비교가 동의합니다. 지드라는 길이를도 모릅니다.`*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)`, 바이트 주소를 더하여 오프셋을 추가하고,

## 지드라 와 함께

디모가 두 개마다 인쇄되어 있습니다.`code/fixtures/ghidra/*.json`2026년 10월 14일 다시 돌아온 증거 기록이 있습니다`npx -y rea-agents@6.5.0 decompile ledger-x86_64-O1.o <function> --provider ghidra --format json`모든 기록에는`confidence: observed`그리고`authority: shipped-artifact`본문에서 주장이 나온다고 기록이 밝히지 않고

### %_변화

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
int percent_change(int param_1, int param_2)   | undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)
{                                              | {
  if (param_1 == 0) {                          |   long lVar1;
    return 0;                                  |   undefined1 auVar2 [16];
  }                                            |   undefined1 auVar3 [16];
  return (param_2 - param_1) * 100 / param_1;  |   if (param_1 != 0) {
}                                              |     lVar1 = (long)((param_2 - param_1) * 100);
                                               |     auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
                                               |     auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
                                               |     return auVar3;
                                               |   }
                                               |   auVar2._8_8_ = 0;
                                               |   auVar2._0_8_ = param_3;
                                               |   return auVar2 << 0x40;
                                               | }
```

| Difference | Instruction or guess |
|---|---|
| Return type `undefined1 [16]` against `int` | Guess. `idivl` writes `%rax` and `%rdx`, and no caller fixes the return width. Both registers were kept. |
| `param_3` | Guess that follows from the first. On the zero path only `%eax` is written, so `%rdx` is read as an input. |
| `lVar1 / (long)param_1 & 0xffffffff` against `/ param_1` | Instruction. `cltd` plus `idivl` is a 64-bit division of a sign-extended 32-bit value, truncated to 32 bits. Both texts describe it. Ours reduced the pair with the `signfill` rule. |
| `lVar1 % (long)param_1` kept | Follows from the return type. The remainder in `%rdx` is dead in our analysis and alive in Ghidra's. |
| `if (param_1 != 0)` with the zero case after it | Instruction order. `je 0xd` jumps to the zero return. Ghidra put the computed arm first, we put the smaller arm first. Both are correct. |
| `return auVar2 << 0x40` | Guess. A 16-byte value with `param_3` in the low half, shifted into the high half, is how the decompiler expresses `%rax = 0` with `%rdx` unknown. |

`code/fixtures/ghidra/ledger-x86_64-O1.ghidra-repaired.c`이 함수를만 편집하고, 테스트는 81개의 입력쌍에 대한 소스와 비교합니다.

### 학위

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
static const int lookup_14[5] = {1, 2, 3, 4, 4}; | uint grade(int param_1)
int grade(int param_1)                         | {
{                                              |   uint uVar1;
  int eax_1;                                   |   uint uVar2;
  int ecx_1;                                   |   
                                               |   uVar2 = param_1 / 10 - 6;
  ecx_1 = param_1 / 10 - 6;                    |   uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  eax_1 = 0;                                   |   if (uVar2 < 5) {
  if ((unsigned int)ecx_1 <= 4) {              |     uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
    eax_1 = lookup_14[(unsigned long)(unsigned int)ecx_1]; |   }
  }                                            |   return uVar1;
  return eax_1;                                | }
}                                              |
```

| Difference | Instruction or guess |
|---|---|
| `param_1 / 10 - 6` in both | Instruction. Both recognized the `0x66666667` idiom. |
| `uVar1 = -(param_1 >> 0x1f) ^ (uint)(... >> 0x3f)` against `eax_1 = 0` | Instruction `xorl %eax, %eax` at `grade+0x1a`. The register is zero. Ghidra expressed the `xor` as the sign of `param_1` exclusive-or the sign bit of the product, two spellings of the same bit, and did not cancel them. The value is 0 for every `int`, and the test proves it over 141 scores. A reader who trusts the text believes the default depends on the score. |
| `uVar2 < 5` against `(unsigned int)ecx_1 <= 4` | Instruction `cmpl $0x4, %ecx` then `ja`. Same condition. Ghidra typed `uVar2` as `uint`, we cast at the use. |
| `*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)` against `lookup_14[...]` | Instruction plus relocation. Ghidra loaded the object with `.rodata` at `0x001000a0`, so `0x001000b4` is `.rodata + 0x14`. It applied the relocation and kept a byte address. We named the table and read its five values. |
| `uint` return against `int` | Guess on both sides. The instructions only say 32 bits. |

### 총

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
int total(int *param_1, int param_2)           | int total(long param_1,uint param_2)
{                                              | {
  int eax_1;                                   |   int iVar1;
  int ecx_1;                                   |   ulong uVar2;
  long rdx_1;                                  |   
                                               |   if (0 < (int)param_2) {
  if (param_2 <= 0) {                          |     uVar2 = 0;
    return 0;                                  |     iVar1 = 0;
  }                                            |     do {
  ecx_1 = param_2;                             |       iVar1 = iVar1 + *(int *)(param_1 + uVar2 * 4);
  rdx_1 = 0;                                   |       uVar2 = uVar2 + 1;
  eax_1 = 0;                                   |     } while (param_2 != uVar2);
  do {                                         |     return iVar1;
    eax_1 = eax_1 + param_1[rdx_1];            |   }
    rdx_1 = rdx_1 + 1;                         |   return 0;
  } while ((unsigned long)(unsigned int)ecx_1 != rdx_1); | }
  return eax_1;                                |
}                                              |
```

| Difference | Instruction or guess |
|---|---|
| `int *param_1` against `long param_1` | Inference on our side from `addl (%rdi,%rdx,4), %eax`. Ghidra kept the width. |
| `uint param_2` and `(int)param_2` against `int param_2` | Ghidra chose unsigned because `cmpq %rdx, %rcx` compares the zero-extended count. We kept `int` and cast at the compare. |
| `do { } while` in both | Instruction `jne 0x50` from the block to itself. The compiler rotated the loop. The `-O0` object keeps the `while`. |
| `ecx_1 = param_2` kept against `param_2 != uVar2` | Our substitution rule stays inside one block. The copy `movl %esi, %ecx` is in the setup block and the compare is in the loop, so the variable stays. Ghidra propagated it. |
| `(unsigned long)(unsigned int)ecx_1` | Instruction. `movl %esi, %ecx` zero-extends, and the 64-bit compare reads the full register. |

행동 테스트는 Ghidra 텍스트를 작성합니다`grade`그리고`total`변하지 않고 2개를 더합니다`typedef`라인 및 정의`DAT_001000b4`20바이트에서`.rodata+0x14`두 함수는 모두 그릴에서 출처와 일치합니다.

## Pseudocode 를 읽는 것 에 관해 연구 는 무엇 을 알려 주는가

LLM4Decompile (EMNLP 2024) 는 인적 에발-데컴필에 있어서 지드라만 20.12%의 재집행성으로 측정하였다. 5개의 함수 중 약 1개는 벤치마크와 함께 나오는 주장을 다시 컴파일하고 통과했습니다. 6.7B 모델로 기드라의 생산량을 정비하면 52.74%까지 올랐다. 디컴필 벤치 (ACL 2025의 발견) 는 130개 프로그램에서 23,400개의 기능에 대해 6개의 산업 디컴필러와 6개의 LLM 접근법을 실행했습니다. LLM 결과물은 더 잘 읽혀지고 52.2퍼센트 낮은 기능 정확성을 가지고 있었습니다.

류, 라프, 미킨스키 (arXiv 2609.05370, 2026년 9월) 는 이 격차를 설명한다. 그들은 300개의 GitHub 라이브러리 기능과 287개의 CVE 기반의 기능을 사용했습니다. 가장 강력한 정제 모델은 지드라의 구축률을 75에서 90퍼센트로 높였으며 행동적 일치율은 74에서 62퍼센트로 떨어졌다. 벤치마크에서 모든 테스트를 통과한 후보자들은 여전히 미루어진 입력에 대해 차이가 있었다. 8개의 시스템에서 4.9%의 경우, 그리고 하나의 시스템에서 13%까지 발생했습니다. 공개된 취약점의 10분의 1이까지 정비된 코드에서 사라졌습니다.

그 원인 은 간단 하다. 그 이유 는, 디컴파일러 가 텍스트 에 남긴 눈에 보이는 알려지지 않은 것 들 을 대체 하기 위해 발명 된 필드, 타입, 켈레, 그리고 경호자 들 입니다.

이 때문에 리프터 인쇄가`(unsigned long)(unsigned int)ecx_1`더 아름다운 이름 대신 메모를 인쇄합니다`switch`해결되지 않은 점프에 대해, 그리고`lookup_14`이 라인은 어떤 라인을 만들어서`code/main.py`- 지드라의`undefined1 [16]`고 정직한 모델이 깨끗해`int percent_change(int, int)`같은 모델은 다음 함수에 순수하게 잘못된 서명을 생성합니다.

## 건설 해

디모를 실행하세요:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
```

데모는 `-O1`이 모든 명령과`llvm-objdump`문자`percent_change``grade`그리고`total`SSA보다 먼저 IR, phi 함수와 함께 SSA 목록, 그리고 Ghidra 텍스트 옆에 있는 사이드코드를 인쇄합니다.`grade`분할 인식이 꺼져 있는 경우,`-O0``percent_change``total`그리고`grade_label`, 그리고 요약:

```json
{
  "functions": ["grade", "grade_label", "percent_change", "total"],
  "instructions": 56,
  "blocks": {"percent_change": 3, "grade": 3, "total": 5, "grade_label": 4},
  "phis": {"percent_change": 0, "grade": 1, "total": 2, "grade_label": 1},
  "objdumpDifferences": 0
}
```

읽으세요`code/main.py`이 순서로:

1. `read_object()`섹션 헤더, 상징 표, 그리고 `.rela`ELF64의 이동 가능한 물체의 섹션
2. `decode_one()`그리고`render_att()`한 가지 명령어를 해독하고 그 방법을 인쇄하십시오`llvm-objdump`- 그렇죠
3. `build_blocks()``immediate_dominators()`그리고`dominance_frontiers()`그래프의 사실을 만들어 보세요.
4. `lift_insn()`하나의 명령어를 IR 선언으로 변환하고 이전을 해결합니다.
5. `insert_phis()`그리고`rename()`SSA를 만들고 너비 캐스트를 삽입한다.
6. `make_simplifier()``substitute_once()`그리고`remove_dead_code()`내쪽으로 달려가`optimize()`- 그래
7. `collect_params()``coalesce_webs()`그리고`infer_types()`웹을 이름 붙이고 입력하세요.
8. `structure()``post_dominators()`그리고`natural_loops()`C 체체를 방출합니다.
9. `lift_function()`              `lift_all()`Callee의 서명으로 전체 물체를 들어 올립니다.

## 사용 하 고

자신의 객체에서 함수를 끌어올리기 위해, 그것을 `clang -target x86_64-unknown-linux-gnu -c`그리고 전화`lift_all(read_object(path))`디코더가 들어올 때`DecodeError`, 메시지의 opcode byte를 읽고 SDM opcode 지도에서 찾아내기 위해 파일 상단에 있는 테이블에 한 항목을 추가합니다. 리프터가 mnemonic에 올려지면, 1 규칙을 추가합니다.`lift_insn()`구조가 `goto`, 그래프를 `IrPrinter`그리고 어떤 모양 규칙이 빠진지 결정합니다. 각각의 덧셈은 작고 각각의 값은`llvm-objdump`또는 기존 테스트에 의해 윙크.

기드라가 설치되면 같은 함수를 실행하고 두 텍스트를 옆으로 배치하십시오. 텍스트 중 하나를 믿기 전에 차이 테이블을 채우십시오. 그 뒤에 명령이있는 차이점은 프레젠테이션 선택입니다. 그 뒤에 명령이없는 차이점은 추측이며 추측은 양쪽 모두 될 수 있습니다.

## 인터랙티브 연구소

### 연구소 A: 5단계로 하나의 기능

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode/code
python3 -q
```

실행:

```python
from main import *
obj = read_object(FIXTURES / "ledger-x86_64-O1.o")
lifted = lift_function(obj, "percent_change")
for insn in lifted.decoded: print(f"0x{insn.address:x}: {insn.raw.hex(' ')}  {insn.att()}")
print(lifted.ir_text)
print(lifted.ssa_text)
print(lifted.pseudocode)
```

따라가`%esi``subl %edi, %esi` `esi_1 = esi_0 - edi_0` `(param_2 - param_1)`- 바이트`fe`의 ModR/M가`subl`,`mod = 11``reg = edi`그리고`r/m = esi`- 그래

### 연구소 B: 분단 언어

```python
print(lift_function(obj, "grade", recognize_division=False).pseudocode)
print(magic_divisor(0x66666667, 34), magic_divisor(0x66666667, 33), magic_divisor(0x66666667, 31))
```

첫 번째 줄은 원자 복제와 이동을 인쇄합니다. 두 번째 선은`10 5 None`. 같은 곱셈을 5로 나누는 이유는 왜 1번의 변이가 적지 않은지, 그리고 왜 31번의 변이가 오류 범위를 놓치는지 알아보십시오.

### C 연구소: 새로운 객체가 디코더를 중지합니다

에서 고정된 장치를 만들`-O2`그리고 그것을 들어올라

```bash
clang -target x86_64-unknown-linux-gnu -O2 -fno-asynchronous-unwind-tables -c fixtures/ledger.c -o "$TMPDIR/ledger-O2.o"
python3 -c 'from main import *; from pathlib import Path; import os; lift_all(read_object(Path(os.environ["TMPDIR"]) / "ledger-O2.o"))'
```

디코더가 `0x56``opcode 81 is outside the fixture subset`- 오프코드`81`32비트 직속으로 그룹 1의 양식을 표시합니다.`andl $0x7ffffff8, %edx`, 그리고 클랜그는 벡터화된 루프에서 사용했습니다`total`옆으로 더해`0x83``decode_one()`, 반복하고, 다음 opcode를 중지하는 것을 참고하십시오. 하위 집합은 한 번에 한 항목을 증가시키고, 각 항목은 `llvm-objdump`- 그래

### 연구소 D: Ghidra의 기본값

```python
print(ghidra_pseudocode("grade"))
for score in (-25, 0, 59, 60, 100, 115):
    sign = -(score >> 31)
    product_sign = ((score * 0x66666667) & ((1 << 64) - 1)) >> 63
    print(score, sign ^ product_sign)
```

각 줄은 0을 찍습니다.`uVar1`표현은 정확하고 읽을 수 없습니다.`xorl %eax, %eax`2바이트로 표시합니다.

## 연습 실험실

추가`switch``grade``-O0`- 그래

요구 사항:

- 5번의 이전을 읽어보세요`.rela.rodata``ledger-x86_64-O0.o`, 각`R_X86_64_PC32.text+offset`, 그리고 5개의 사례 목표를 계산하여`.rodata+0x0`- 그래
- `Switch`                                     `ja`테이블을 싣기 전에
- 스위치 블록에 목표당 후속자가 하나씩 주어져 있어 패미네터, 포스트 패미네터, SSA가 계속 작동하도록
- 발사`switch (local_10) { case 0:... }`한 명으로`case`목표에 따라 공유된 에피로그
- 테이블을 묶을 수 없는 간접 점프에 대한 메모를 보관하세요.
- Clang를 사용하여 결과를 작성하고 테스트에서 점수 그리드에서 소스와 비교하십시오.

성공이란`grade``-O0`그리고`grade``-O1`그릴에서 동일한 출력을 생산하고,`switch`그리고 아니`goto`- 그래

## 유물

이 교훈은`outputs/skill-lifting-to-pseudocode.md`. 각 라인에서 추리된 함수를 들어 올리고 디컴파일러의 텍스트에 대한 차이 표를 채우기 위해 사용하십시오. 이 문자는 참조 분산, 이전, 호출 컨벤션, 컴파일 체크, 행동 비교 및 각 다른 라인에 대한 판결을 필요로합니다.

## 확인 해 보

데모와 결정적 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

25개의 테스트가 있습니다. 검증은 증명합니다.

- 디코더는 약속된 내용에 동의합니다.`llvm-objdump`두 개체의 모든 명령에 텍스트를 작성하고, 라이브 `llvm-objdump`설치 시
- REX, ModR/M, SIB, 그리고 의 이동 현장 이산`leaq (%rip), %rcx`SDM에서 설명하는 대로 해독됩니다
- 부수집단 외부의 opcode가 `DecodeError`추측하는 대신
- ELF 리더는 4개의 기능과 3개의 기능을 나열합니다 `.text`이전
- `total`5개 블록이 있습니다.`0x44`지배하는`0x50`그리고`0x50`몸으로 자신을 가진 루프 헤더입니다
- `%rdi`그리고`%rsi``param_1`그리고`param_2`그리고`param_1``total` `int *`
- `test`그리고`cmp``je``jle``ja`그리고`jge``==``<=`, 서명하지 않은`>`그리고`<`
- SSA는 의 루프 헤더에 2개의 라이브 phi 함수를 배치합니다`total`그리고 아무도 없습니다`percent_change`
- 의 사이드코드`percent_change``grade`그리고`total`예상된 텍스트와 같을 수 있습니다
- `grade`읽는다`param_1 / 10 - 6`인식과 함께, 그리고 무질서로 인식과 함께 배 multiply
- `0x66666667`시위 34이 10으로 나뉘는 시위 33이 5으로 나뉘는 시위
-  `-O0``local_4``local_8``local_c`, 그리고 프레임 포인터는 결코 나타나지 않습니다
- `.rodata+0x14`읽는다`1, 2, 3, 4, 4`이전을 통해
- 간접적으로 뛰어들게`grade``-O0`4개의 부동이 들어가지 않은 것으로 보고됩니다.
- 지드라 가구에는 16바이트의 반환이 포함되어 있습니다.`param_3`, 단순화되지 않은`xor`, 그리고`long param_1`
- 6개의 방출된 단위는 `clang -std=c11 -Wall -Werror``x86_64-unknown-linux-gnu`
- 픽업된 함수, 수리된 지드라 텍스트, 원천은 입력 그리드 위에 동일한 232 라인을 인쇄합니다

## 생산 실패 모드

| Failure | What the weak reading reports | What the derivation must show |
|---|---|---|
| Decompiler widens the return value | "returns a 16-byte struct" | `idivl` writes `%rdx`, and no caller fixes the width |
| Decompiler adds a parameter | "takes three arguments" | The register is read on one path only because the return width was guessed |
| Idiom goes unrecognized | "multiplies by a magic constant" | The multiplier is the ceiling of `2^s / d` and the error bound holds |
| Idiom is recognized and a `xor` is lost | "default depends on the input" | `xorl %eax, %eax` writes zero, two spellings of one bit cancel |
| Pointer typed as integer | "takes a long" | A scaled 4-byte load from the register is pointer evidence |
| Table length unknown | "reads past the table" | The next referenced offset or the section end bounds it, and the range check agrees |
| Loop shape misread | "while loop" | The header has no exit, the latch jumps back, so it is `do while` |
| Indirect jump guessed | "switch with five cases" | The targets come from `.rela.rodata`, or the jump is reported as unresolved |
| Substitution across a store | "one expression" | A loaded value moved past a store or a call changes meaning |
| Refinement model edits the text | "compiles and looks right" | Build rate up, behaviour match down, invented guards replaced visible unknowns |
| Decoder guesses an unknown opcode | "disassembly looks fine" | `DecodeError` with the address and the byte, then one table entry checked against `llvm-objdump` |

## 운영 규칙

이 두 문서는 서로 다른 각 줄 뒤에 명령어 또는 추측을 적어 놓아, 두 줄을 모두 작성하고, 두 줄을 모두 원본에 맞게 실행하십시오. 그 뒤에 명령어가 없는 선은 아무리 깨끗하게 읽어도 추측으로 남아 있습니다.

## 더 많은 읽기

- [Intel SDM Volume 2, chapter 2, Instruction Format](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [System V AMD64 psABI, section 3.2, Function Calling Sequence](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Cytron et al., Efficiently Computing Static Single Assignment Form and the Control Dependence Graph, TOPLAS 1991](https://doi.org/10.1145/115372.115320)
- [Cooper, Harvey, Kennedy, A Simple, Fast Dominance Algorithm, 2001](https://www.cs.tufts.edu/~nr/cs257/archive/keith-cooper/dom14.pdf)
- [Cifuentes, Reverse Compilation Techniques, PhD thesis, QUT 1994](https://eprints.qut.edu.au/36820/)
- [Yakdan et al., No More Gotos, NDSS 2015](https://www.ndss-symposium.org/ndss2015/ndss-2015-programme/no-more-gotos-decompilation-using-pattern-independent-control-flow-structuring-and-semantics/)
- [Granlund, Montgomery, Division by Invariant Integers using Multiplication, PLDI 1994](https://doi.org/10.1145/178243.178249)
- [Lee, Avgerinos, Brumley, TIE, NDSS 2011](https://www.ndss-symposium.org/ndss2011/tie-principled-reverse-engineering-of-types-in-binary-programs/)
- [Noonan, Loginov, Cok, Polymorphic Type Inference for Machine Code, PLDI 2016](https://arxiv.org/abs/1603.05495)
- [LLM4Decompile, EMNLP 2024](https://arxiv.org/abs/2403.05286)
- [DecompileBench, Findings of ACL 2025](https://aclanthology.org/2025.findings-acl.1194/)
- [Liu, Raff, Micinski, When LLM Decompilers Recompile More and Preserve Less, 2026](https://arxiv.org/abs/2609.05370)
- [rea 6.5.0 Ghidra provider notes](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
-                         `3b79af2`이 교훈은 다음과 같이 설명합니다.`src/domain/functionComparisonDimensions.ts``website/evidence/dx-ball-sound-pan.md`- 그래
