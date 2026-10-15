# 데이터 및 유형 복구: 구조, 배열, C++ 객체 및 DWARF

> 디컴파일러 프린트`a->balance`타입 테이블이 있는 경우`*(int *)(param_1 + 4)`이 수업은 접근방식에서 테이블을 만들고, DWARF 5에서 실제 테이블을 읽고, 두 개의 동의를 보여줍니다.

**Type:** Build
**Languages:** Python, C, C++, x86-64 assembly
**Prerequisites:** Phase 13 · 33 (disassembly and control flow), Phase 13 · 34 (lifting to pseudocode)
**Time:** ~140 minutes

## 학습 목표

- 기본 레지스터 + 이동식으로 구성원 액세스 및 기본 + 인덱스 시간 단계로 배열 액세스, 인텔 SDM 주소 규칙에서 읽으십시오.
- 시스템 V 조율 규칙을 손으로 적용합니다`struct account`그리고 각 팩이팅 바이트를 설명합니다.
- 리스트의 접근을 필드 오프셋, 너비, 종류, 단계, 크기로 변환하는 타입 복구 패스를 만들어서 각각의 증거가 있습니다.
- DWARF 5 독자를 쓰세요`.debug_info``.debug_abbrev``.debug_str_offsets`그리고`.debug_addr`이전 가능한 물체의 경우,`llvm-dwarfdump`- 그래
- 복구된 레이아웃과 DWARF 레이아웃을 비교하고 모든 차이를 증거가 부족하거나 통합된 접근 또는 증명할 수 없는 유형으로 지정하십시오.
- 이타늄 C++ vtable, 그 타입정보, 그리고 이전에서 만든 이름들을 읽어보고, 슬롯에 가상 호출을 해소하십시오.

## 문제

당신은 `account.c``-g`그리고 어떤 일을 하는 중재에게 물어봤어요`bump`요원이 기드라 12.1.4로 물체를 보냈고 이 자료를 가져왔어요

```c
void bump(long param_1,int param_2)
{
  *(int *)(param_1 + 4) = param_2 + *(int *)(param_1 + 4);
  return;
}
```

같은 자료를 작성했습니다`-g`같은 디컴파일러에서

```c
int bump(account *a,int by)
{
  a->balance = by + a->balance;
  return a->balance;
}
```

두 개체에서 명령어는 동일합니다. 차이점은 타입 테이블입니다. 테이블과 함께 디컴파일러는 첫 번째 매개 변수가 32 바이트 구조에 지점을 둔 것을 알고 있습니다. 오프셋 4의 필드는 4 바이트입니다.`int`이름`balance`그 없이 디컴파일러는 8바이트 너비의 무언가가 들어왔다는 것을 알고 있습니다`%rdi`그리고 4 바이트가 `+4`읽혀지고 쓰여졌습니다.

이 테이블의 모든 것은 원천을 가지고 있습니다. 오프셋 4는 `addl 0x4(%rax), %ecx`너비 4은 `l`이 이름은`DW_TAG_member``.debug_info`이 수업은 두 가지 반을 구성합니다. 명령어에서 증명된 것을 복구하는 패스와 컴파일러가 기록한 것을 해독하는 리더. 둘 사이의 격차는 타입 이름의 비용이 얼마나 되는지입니다.

```figure
re-41-struct-recovery
```

## 회원 가입은 이동

인텔 SDM 볼륨 1 섹션 3.7.5에서 유효 주소`Offset = Base + (Index * Scale) + Displacement`, 1, 2, 4 또는 8의 규모와 8, 16 또는 32 비트의 이동.`RIP + Displacement`. 구조 구성원 액세스에는 인덱스 없이 첫 번째 형태를 사용합니다. 기본 레지스터는 객체의 주소를 보유하고 있으며 이동은 구성원 오프셋입니다. 배열 액세스에서는 인덱스 용어를 추가하고, 규모 또는 별도의 곱셈은 요소 크기를 가지고 있습니다.

이봐`bump``-O0`- `llvm-objdump -d -r`이 글은 이렇게 되어 있습니다.

```text
       4: 48 89 7d f8                  	movq	%rdi, -0x8(%rbp)
       e: 48 8b 45 f8                  	movq	-0x8(%rbp), %rax
      12: 03 48 04                     	addl	0x4(%rax), %ecx
      15: 89 48 04                     	movl	%ecx, 0x4(%rax)
```

해독`03 48 04`33강의 규칙과 함께`03` `ADD r32, r/m32`- ModRM`48` `01 001 000`이 책:`mod = 01`8비트 이동을 가진 메모리 오퍼랜드를 의미합니다.`reg = 001` `%ecx``r/m = 000` `%rax`. 이동 바이트는`04`명령어는 4 바이트로 되어 있습니다`%rax + 4`그리고 그것을 `%ecx`- `l`이 자사`llvm-objdump`프린트 크기는 오페란드 크기이기 때문에 필드는 4 바이트 너비입니다`%rax`에서 프레임 슬롯에서 왔어요`-0x8(%rbp)`, 그리고 그 슬롯은`%rdi`,는 시스템 V 호출 협약에 따라 첫 번째 정수 정수 정수입니다. 세 가지 사실은 다음과 같습니다: 첫 번째 매개 변수는 포인터이며, 표시되는 객체는 오프셋 4에서 4 바이트 필드를 가지고 있습니다.`bump`이 필드를 읽고 쓰고 있습니다.

이 바이트에 있는 것은 아무것도 없습니다`int``balance`또는`struct account`그 물체가 얼마나 큰지 알려지지 않은데, 나머지 28바이트는 눈에 보이지 않습니다.`bump`- 그래

## 시스템 V 레이아웃 규칙

x86-64 psABI, 섹션 3.1.2는 집합물에 대한 세 가지 규칙을 제공합니다. "구조와 조합은 가장 엄격하게 조립된 구성 요소의 조화를 가정합니다. 각 구성원은 적절한 조화를 가진 가장 낮은 사용할 수있는 오프셋에 할당됩니다. 어떤 객체의 크기는 항상 객체의 조선의 복수입니다. " 같은 문서의 3.1 그림은 스칼라 크기와 조화를 제공합니다: `char`1 및 1`short`2과 2`int`4과 4`double`8과 8, 8과 8의 모든 포인터

이 규칙은 구조에 적용되어야 합니다.`account.c`이 부분의 본문은

```c
struct account {
    char kind;
    int balance;
    short code;
    double rate;
    const char *label;
};
```

| Member | Size | Alignment | Lowest offset that fits | Padding before |
|---|---|---|---|---|
| `kind` | 1 | 1 | 0 | 0 |
| `balance` | 4 | 4 | 4 | 3 (bytes 1 to 3) |
| `code` | 2 | 2 | 8 | 0 |
| `rate` | 8 | 8 | 16 | 6 (bytes 10 to 15) |
| `label` | 8 | 8 | 24 | 0 |

마지막 멤버는 32로 끝납니다. 가장 엄격한 조정은 8이고 32는 8의 곱하기이기 때문에 크기는 32입니다. 꼬리 이 없습니다. 32의 9 바이트는 이, psABI는 "어떤 의 내용은 정의되지 않습니다".

구성원들의 순서가 크기를 결정합니다.`double, pointer, int, short, char`0, 8, 16, 20, 22에 풀 오프셋을 하고 23에 끝나는 것을 24까지 니다.`sysv_layout()``code/main.py`3가지 규칙을 적용하면 두 가지 결과를 모두 얻을 수 있습니다.`ctypes`모듈은 호스트 컴파일러의 컨벤션을 통해 동일한 규칙을 적용하고,`ctypes.sizeof``ctypes.alignment`, 그리고`.offset`각 필드의 32, 8을 `0, 4, 8, 16, 24`이 기계에서 만들 때 프로그램 자체는 세 번째 복사본을 인쇄합니다.

```text
sizeof 32 align 8
kind 0 balance 4 code 8 rate 16 label 24
sum 315 tag -3 projected 318.75 label_length 7
```

이 네이티브 빌드는 arm64입니다. AAPCS64 팔은 5.10.1 섹션에서 동일한 집합 규칙을 명시하고 있으며 애플의 arm64 문서에서는 이러한 다섯 개의 스칼라 크기를 유지하므로 두 목표에 대한 숫자는 일치합니다. 수업의 x86-64 객체는 `-target x86_64-unknown-linux-gnu`그래서 33강의 ELF 독자와 아래의 DWARF 독자는 이 책들을 연구할 수 있습니다.

## 나머지 구조 를 손으로 읽어 보십시오

`bump`한 필드를 볼 수 있습니다. 나머지 4개의 함수는`account.c`다른 모든 항목을 참조하면 각 항목에 다른 명령어 형태가 표시됩니다.`account-x86_64-O0-g.objdump.txt`- 그래

`sum_balances`구조의 배열을 지표합니다.

```text
      51: 48 8b 45 f8                  	movq	-0x8(%rbp), %rax
      55: 48 63 4d ec                  	movslq	-0x14(%rbp), %rcx
      59: 48 c1 e1 05                  	shlq	$0x5, %rcx
      5d: 48 01 c8                     	addq	%rcx, %rax
      60: 8b 40 04                     	movl	0x4(%rax), %eax
```

`%rax` `list``%rcx` `i`64비트까지 확장된 신호, 그리고`shlq $0x5`이 값은 32으로 곱합니다`addq``%rax` `list + 32 * i`, 그리고 부하는 4 바이트를 읽습니다`i`. shift count은 이 객체의 유일한 장소로 구조의 크기가 숫자로 표시됩니다. 이 명령어를 포함하는 루프는 `0x49``jmp 0x49``0x72`- 그래

`tag`두 개의 좁은 필드를 읽습니다.

```text
      8c: 0f be 00                     	movsbl	(%rax), %eax
      98: 0f bf 48 08                  	movswl	0x8(%rax), %ecx
```

`movsbl`오프셋 0에서 1 바이트를 로드하고 표시-확대합니다. 따라서 0의 필드는 서명된 1 바이트 정수입니다. `movswl`지표 확장과 함께 오프셋 8에서 2 바이트를 로드합니다. 그래서 8의 필드는 2 바이트의 서명된 정수입니다.`-O1`첫 번째 접근은`cmpb $0x6c, (%rdi)`,는 여전히 0을 오프셋으로 1 바이트라고 말하고

`projected`이 글은 이끄는 글이 있습니다

```text
      cc: f2 0f 2a 40 04               	cvtsi2sdl	0x4(%rax), %xmm0
      d5: f2 0f 59 40 10               	mulsd	0x10(%rax), %xmm0
```

`cvtsi2sdl`서명된 32 비트 정수 숫자를 메모리에서 더블로 변환하여, 오프셋 4은 서명된 4 바이트 정수를 보유하고 있음을 확인합니다. `mulsd`메모리에서 두 배로 곱하면, 오프셋 16는 8바이트의 부동 포인트를 가지고 있습니다.

`label_length`포인터를 읽고 다음으로 따라가면

```text
      f3: 48 8b 40 18                  	movq	0x18(%rax), %rax
      f7: 48 63 4d f4                  	movslq	-0xc(%rbp), %rcx
      fb: 80 3c 08 00                  	cmpb	$0x0, (%rax,%rcx)
```

`movq`8 바이트를 오프셋 24에서 읽습니다. 그 자체로 8 바이트 정수 또는 포인터입니다.`cmpb`로드 된 값은 메모리 오퍼랜드의 기초로 사용된다. 주소를 사용 하는 값은 포인터이다.`cmpb`지표에서 1 바이트를 읽습니다 `%rcx`그로부터, 그리고`-O1`포인터는 `leaq 0x1(%rcx), %rcx`루프 내부에 위치해있어서,

5개의 함수를 합쳐서 구조가 됩니다`{ i8 at 0, i32 at 4, i16 at 8, f64 at 16, pointer at 24 }`32의 단계로. 1에서 3까지의 격차와 10에서 15까지의 격차는 psABI 규칙에서 예측한 이 정확히 있습니다. 지침에서 말하지 않는 것은: 멤버 이름, 지표는`const char *`, 기호에서 표시된 0에 서명된 바이트의 선언된 유형`char`, 그리고 다섯 개의 함수는 같은 타입을 얻습니다. 마지막 주장은`main`, 즉, 하나의 프레임 객체를 다섯 개 모두로 전달합니다.`-O0`전화 사이트에서는 다음을 확인할 수 있습니다. `leaq -0x70(%rbp), %rdi`다음으로`addq $0x20, %rdi`이전`callq bump`그리고`addq $0x40, %rdi`이전`callq tag`. 이산 0.`0x20`그리고`0x40`하나의 배열의 세 가지 요소이며,`memcpy``0x60`이 바이트는 96바이트, 즉 32개의 3개의 요소입니다.

## 패스

`trace_function()``code/main.py`함수의 명령어를 주소 순서로 걸어 다니며 작은 추상 상태를 유지합니다. 홀더는 64 비트 레지스터 또는 프레임 슬롯입니다.`-0x8(%rbp)`. 각 보유자는 3가지 값 중 하나를 가지고 있습니다.`Pointer`이 값은 루트 + 상수 오프셋 + 단계의 집합을 더하여, 단계가 그 많은 바이트의 알려지지 않은 복수가 추가되었다는 것을 기록합니다.`Index`알 수 없는 값의 정수입니다. 그 밖의 모든 것은 아무것도 아닙니다.

국가는 6개의 시스템 V 논증 등록을 보유하는 것으로 시작됩니다.`Pointer("param0", 0)` `Pointer("param5", 0)`그러면 각 명령에 따라 하나의 규칙이 적용됩니다.

- A`movq`64 비트 레지스터와 프레임 슬롯 사이에 있는 값이 복사된다. 32 비트 또는 좁은 레지스터에 쓰면`Index`1등급으로
- A`leaq`지표 기지를 가지고 지표가 생성되고, 지표 레지스터를 가지고 더하기`scale * index_scale`이 단계에 대한`leaq`그 밑바탕은`%rbp`또는`%rsp`프레임 객체의 이름을 붙여서, 어떻게`main`통과`rows`- 그래
- `shlq $n``Index`그 규모를 곱하기`2^n`그리고`imulq $k`곱하기 `k`- 그래
- `addq`지표와 지표를 유지하고 지표 스케일을 단계에 추가합니다. `addq $k`지표에 대한 이산이 이동되고 그 레지스터의 증가로 기록됩니다.
- 호출은 호출자의 저장된 모든 레지스터를 알려주지 않으며 포인터를 보유한 논쟁 레지스터는 호출 사이트로 기록됩니다.
- 지표를 보유한 기본 레지스터의 메모리 오퍼란드는 `Access`지표의 뿌리와 오프셋과 모닉에서 폭과 종류와 함께

폭과 친절은 미네모닉에서만 나온다.`access_width()`지도를 `b``w``l`그리고`q`1, 2, 4 및 8 바이트의 후자호`movsbl`그리고`movswl`서명된 좁은 부하에`movzbl`서명하지 않은 사람,`sd`그리고`ss`8바이트 및 4바이트의 부동선에 대한 스칼라 SSE 지침`cvtsi2sdl`서명된 4 바이트 정수 소스를 16 바이트로`movaps`가속을 벡터로`leaq`그리고`nop`양식은 접근이 아닙니다.

```python
if memory.base in FRAME_REGISTERS:
    return Pointer(f"frame({memory.base}{format_signed(memory.displacement) if memory.displacement else ''})", 0)
base = env.get(memory.base)
if not isinstance(base, Pointer):
    return Unknown
strides = set(base.strides)
if memory.index is not None:
    index_value = env.get(memory.index)
    strides.add((index_value.scale if isinstance(index_value, Index) else 1) * memory.scale)
return Pointer(base.root, base.offset + memory.displacement, frozenset(strides), base.origin)
```

포인터를 통해 8 바이트의 로드가 생성되는 것은 새로운 포인터를 생성하는데, 그 지표의 뿌리는 `param0->0x18`. 그 값이 나중에 기초로 사용되거나 `leaq`,이 필드는 증명된 포인터로 표시됩니다. 이 규칙은 오프셋 24을 "8 바이트"에서 "포인터"로 변환합니다.

### 4가지 종류의 발걸음 증거

`infer_layout()`모든 증인 기능의 접근을 통합하고 4개의 소스에서 단계들을 수집하고, 각각의 명령으로 생성합니다.

| Kind | Where it comes from | Build that shows it |
|---|---|---|
| `scale` | an `Index` with scale above 1 reached a pointer, from `shlq $0x5` or `imulq` | `-O0`, `shlq $0x5, %rcx` at `0x59` |
| `loop-step` | a 64-bit increment of the base or index register inside a loop that also contains the access | `-O1`, `addq $0x20, %rdx` at `0x24` |
| `offset-delta` | same-width accesses through one base register inside one loop, at offsets a constant apart | `-O2`, eight loads 32 apart |
| `call-site` | the offsets at which one frame object is passed to the witness functions | `-O0`, `main` passes `rows`, `rows+0x20`, `rows+0x40` |

루프는 뒤로 돌아다니다`jmp`또는 조건부 분자, 그리고 괄호 범위가 괄호와 접근을 모두 포함하면만 증가수가 계산됩니다. 이 규칙은 괄호를 배제합니다.`addl $0x1, %eax`발전하는`i``-O0`, 그것은 32 비트 추가이기 때문에 접근이 통과하지 않기 때문에`%eax`. 마지막 단계 는 발견 된 모든 값의 가장 큰 공통 분자 이다. 크기는 단계 가 마지막 필드의 끝만큼 크면 단계 이다.

### -O2에 있는 벡터화된 루프

`-O2`   `sum_balances`.   루프 몸`0x50` `0xaa`패스당 8개의 요소를 읽습니다.

```text
      3b: 48 8d 87 e4 00 00 00         	leaq	0xe4(%rdi), %rax
      50: 66 0f 6e 50 80               	movd	-0x80(%rax), %xmm2
      55: 66 0f 6e 98 60 ff ff ff      	movd	-0xa0(%rax), %xmm3
      61: 66 0f 6e 90 40 ff ff ff      	movd	-0xc0(%rax), %xmm2
      69: 66 0f 6e a0 20 ff ff ff      	movd	-0xe0(%rax), %xmm4
      7d: 66 0f 6e 10                  	movd	(%rax), %xmm2
      81: 66 0f 6e 58 e0               	movd	-0x20(%rax), %xmm3
      8a: 66 0f 6e 50 c0               	movd	-0x40(%rax), %xmm2
      8f: 66 0f 6e 60 a0               	movd	-0x60(%rax), %xmm4
      a0: 48 05 00 01 00 00            	addq	$0x100, %rax
      aa: 75 a4                        	jne	0x50 <sum_balances+0x40>
```

`%rax`시작됩니다`list + 0xe4`8번의 이동은 짐을 대편으로 옮깁니다`0x04, 0x24, 0x44, 0x64, 0x84, 0xa4, 0xc4, 0xe4``list`, 즉`4, 36, 68, 100, 132, 164, 196, 228`. 증가율은`0x100`, 즉 256. 기록하는 패스는 8개의 필드와 최소 232바이트의 구조를 보고합니다.

`fold_unrolled()`한 규칙이 적용됩니다. 한 루프 내부에서, 한 기본 레지스터를 통해 같은 너비의 액세스`d`이쪽은 32입니다.`k * d`그리고 정확히`k`다른 오프셋, 루프 풀 `k`시간, 그리고 모든 액세스`(offset - lowest) mod d`여기`256 = 8 * 32`8개의 오프셋이 있고, 8개의 로드가 모두 오프셋 4에 접어들며,`offset-delta 32``unrolled 32`그리고`loop-step 256`. 스칼라 잔류 루프`0xe0`추가합니다`scale 32``shlq $0x5, %rdx`그리고`loop-step 32``addq $0x20, %rdx`. 다섯 값의 가장 큰 공통분수는 32입니다.

이 그림에는 접는 버튼이 있습니다. 접는 버튼이 닫힌 후,`-O2`이 상태는 루프 없이 이동을 신뢰하는 독자가 보는 상태입니다.

## DWARF 5 바이이트에서

`-g``account.c`8개의 디버깅 섹션을 포함합니다.`.debug_info`493바이트입니다.`.debug_abbrev`179,`.debug_str`230`.debug_str_offsets`124,`.debug_addr`112,`.debug_line`312,`.debug_line_str`12 , 그리고`.debug_frame`264. DWARF 5 표준 목록의 도입`.debug_str_offsets``.debug_addr`그리고`.debug_line_str`5번 버전의 새로운 버전으로`code/main.py`첫 5개도 필요해요

### 단위 헤더

표준의 7.5.1.1 섹션에서는 전체 컴파일 단위 헤더를 제공합니다: `unit_length``version``unit_type``address_size`그리고`debug_abbrev_offset`첫 12바이트`.debug_info`이

```text
e9 01 00 00   unit_length = 0x1e9 = 489
05 00         version = 5
01            unit_type = DW_UT_compile
08            address_size = 8
00 00 00 00   debug_abbrev_offset = 0
```

`unit_type`바이트는 버전 5에서 새로운 것이므로 표준은 같은 섹션에서 그렇게 말합니다. 길이는 바이트를 셀 수 있습니다. 따라서 다음 단위는 `4 + 489 = 493`, 섹션 끝`llvm-dwarfdump --debug-info`이 값은 5개의 값과 같은 값을 인쇄합니다.`Compile Unit:`선을 분석하고 비교하는 첫 번째 테스트입니다.

### 단축자

2.1 섹션 은 디버깅 정보 에 대한 각 항목 " 식별 에 대한 태그 와 일련 의 속성 을 포함 한다". 항목 자체 는 단지 약자 코드를 저장 합니다. 코드는 `.debug_abbrev`이 객체는 14개의 선언을 가지고 있습니다. 두 가지 문제입니다.

```text
[12] DW_TAG_structure_type  DW_CHILDREN_yes
     DW_AT_name              DW_FORM_strx1
     DW_AT_byte_size         DW_FORM_data1
     DW_AT_decl_file         DW_FORM_data1
     DW_AT_decl_line         DW_FORM_data1
[13] DW_TAG_member           DW_CHILDREN_no
     DW_AT_name              DW_FORM_strx1
     DW_AT_type              DW_FORM_ref4
     DW_AT_decl_file         DW_FORM_data1
     DW_AT_decl_line         DW_FORM_data1
     DW_AT_data_member_location  DW_FORM_data1
```

`parse_abbreviations()`ULEB128 코드, ULEB128 태그, 1 children byte, 그리고 속성 및 양식 쌍을 `0, 0`7.5.6 섹션에서는 양식 코딩을 제공합니다: `data1`1 바이트`ref4`이 단위와 비교하여 4 바이트의 오프셋입니다.`strx1`문자열 오프셋 테이블에 1 바이트 인덱스입니다.`sec_offset`그리고`data4`4 바이트입니다.`addrx`주소가 있는 표에 ULEB128 지표가 들어간 것입니다.`exprloc`길이가 ULEB128이고,`flag_present`바이트가 전혀 없습니다.

### 수동으로 균형 멤버를 해독

`account`오프셋에서 시작됩니다`0x195`바이트를 `0c 15 20 00 03`- 줄여서 12번, 구조`DW_AT_name`문자열 지표입니다`0x15``DW_AT_byte_size` `0x20`= 32`DW_AT_decl_file`0이고`DW_AT_decl_line`3이 되는데,`struct account {`소재에 있는

제2회 회원 가입은`0x1a3``0d 10 88 01 00 00 00 05 04`이 부분의 본문은

1. `0d`13번의 약칭은, a
2. `10` `DW_AT_name``strx1`: 문자열 지표 16
3. `88 01 00 00` `DW_AT_type``ref4`: 이산`0x188``DW_TAG_base_type`이름의 항목`int`- 그래
4. `00` `DW_AT_decl_file`그리고`05` `DW_AT_decl_line`: 5번 줄`account.c`- 그래
5. `04` `DW_AT_data_member_location`: 이산 4.

5.7.6 섹션에서는 멤버 항목 "DW_AT_data_member_location 속성 또는 DW_AT_data_bit_offset 속성"을 가질 수 있으며, 정수 상수 "내용 엔티티의 시작에서 바이트로 오프셋"이라고 합니다. 이 바이트는 `addl 0x4(%rax), %ecx`그리고`compare_layouts()`이 두 가지를 옆으로 놓는 함수입니다

### 문자열과 주소는 두 개의 테이블을 통과합니다

문자열 인덱스 16는 에 대한 대립이 아닙니다.`.debug_str`독자는 `DW_AT_str_offsets_base`8인 단위 항목에서 4바이트 항목을 읽습니다`8 + 4 * 16``.debug_str_offsets`이 항목은 `"balance"``.debug_str`. 주소를 동일하게 간접적으로 적용합니다.`sum_balances`바이트로 시작됩니다`07 07`: 약자 7, 하위 프로그램, 그리고`DW_AT_low_pc``addrx`7 지표 8 바이트 입력 `8 + 8 * 7``.debug_addr` `0x30`, 기능의 주소가 `.text`이 테이블의 첫 6개의 항목은 6개의 문자열의 주소가 있습니다.

이전 가능한 객체에서 어떤 테이블도 최종 값을 보유하지 않습니다.`.debug_str_offsets`파일에서 0이 되고`.rela.debug_str_offsets`29 `R_X86_64_32`이전`.debug_str`추가에 실제 이산이 포함됩니다.`.debug_addr`13이 있습니다`R_X86_64_64`이전`.text`그리고`.rodata.str1.1`-`.debug_info`네 개의 이전을 가지고 있습니다: 단축적 이산`DW_AT_str_offsets_base``.debug_str_offsets+0x8``DW_AT_stmt_list`그리고`DW_AT_addr_base``.debug_addr+0x8`-`ElfObject.relocated()`적용됩니다`S + A`32비트 및 64비트 타입에 대해 읽기자가 섹션을 분석하기 전에 섹션 심볼은 객체 파일에서 값 0이므로 필드는 추가 항목을 수신합니다. `llvm-dwarfdump`동일한 해상도를 가지고 있기 때문에 출력에는 각 지표가 해상된 경우 이름과 주소가 표시됩니다.

### 종류, 기능 및 위치

`DwarfInfo.type_name()`다음으로`DW_AT_type`참고문헌`label``DW_TAG_pointer_type`, 즉,`DW_TAG_const_type`, 이 점들은 `char`기본 타입, 그래서 이름은 `const char *`-`type_size()`수익금`DW_AT_byte_size`기본 타입과 구조에 대해서는 8개, 포인터에 대해서는 8개, 그리고 배열에 대해서는 요소 크기를 곱하기 계산한다. `type_kind()``DW_AT_encoding`기본 타입의`int`표지판을 가지고 있거나`float`, 그리고 `pointer`, 즉 비교에 사용되는 어휘입니다.

`DwarfInfo.functions()`6번을 읽습니다`DW_TAG_subprogram`입문`bump``0x0` `0x21`, 즉`DW_AT_low_pc`더하기`DW_AT_high_pc`길이가 높습니다. 프레임 밑부분은`DW_OP_reg6 RBP`, 그리고 그 매개 변수`a`위치 표현을 가지고 있습니다`91 78`이 책:`DW_OP_fbreg`SLEB128 값과 함께`0x78`, 즉 -8입니다.`-0x8(%rbp)`목록에 저장된`%rdi`주소`0x4`디버깅 정보와 지침은 두쪽에서 같은 슬롯을 설명합니다.

## 두 가지 구조 를 비교 해 보십시오

`compare_layouts()`DWARF 회원들을 걷고 같은 오프셋에서 추론된 필드를 찾습니다. 필드가 없는 회원은`no-evidence`다른 크기의 필드는`size-mismatch`. 지표 멤버는 이 이 이 이 이 이 이 이 이 이 이 이 이 이 이`pointer-unproven`. 반대하는 종류, 예를 들어, 명령어에서 정수 수학을 사용한 플롯은`kind-mismatch`. 멤버 내부 또는 패딩 내부에서 시작되는 인퍼레이션 필드는`unexpected`크기는 을 비교합니다`DW_AT_byte_size`- 그래

3개의 빌드들의 숫자는`python3 code/main.py`이 부분의 본문은

| Build | Accesses through the first parameter | Fields | Stride evidence | Members matched | Size |
|---|---|---|---|---|---|
| `-O0` | 11 | 5 | `scale 32`, `call-site 32`, `call-site 64` | 5 of 5 | 32, match |
| `-O1` | 9 | 5 | `loop-step 32` | 5 of 5 | 32, match |
| `-O2` | 17 | 5 after folding, 12 before | `offset-delta 32`, `unrolled 32`, `loop-step 256`, `scale 32`, `loop-step 32` | 5 of 5 | 32, match |

추론된 격차는 각 빌드에서 1~3 바이트, 10~15 바이트이며, 그것들은 DWARF 레이아웃의 바이트입니다. 추론된 각 필드는 자신의 크기의 복수에서 위치하고 있습니다.`natural_alignment_ok()`기록해

각각의 함수를 하나씩 추가하면 그림이 변합니다.`bump`레이아웃은 오프셋 4에서 한 필드이고 크기는 알려지지 않으며, 하위 경계선은 8입니다.`sum_balances`더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는 더하기는`tag`0 및 8의 오프셋을 추가합니다. `projected`16으로 떠 있는 것을 더합니다.`label_length`24로 포인터를 더하고 포인터가 된다는 것을 증명합니다. `main``-O0`그리고 아무것도 추가하지 않습니다`-O1`그리고`-O2`, 컴파일러는 모든 호출을 적어 놓았기 때문에

세 가지 요소가 접근하기 힘들어 지`const`이 방법은 지침에 포함되지 않습니다.`label`이 벡터에서 "element 1 byte away"를 나타냅니다.`leaq 0x1(%rcx), %rcx``char`그리고`unsigned char`그리고`_Bool`- `-O1`0의 오프셋에서 바이트의 표시가 알려지지 않았기 때문에`cmpb $0x6c, (%rdi)`          `int8`거기 그리고`i8``-O0`, 어디`movsbl`이 사실은 35번의 기록으로 알려지지 않은 것으로 기록되어 있습니다.

## C++ 객체

`shapes.cpp`정의합니다`Shape`가상 파괴자, 순수한 가상`area()`, 그리고 가상`name()`그리고`Rect`, 이 자료는`Shape`그리고 두 개를 더합니다`int`이타늄 C++ ABI는 clang이 x86-64 리눅스에서 어떻게 설정하는지 제어합니다.

### 어 이름

ABI의 5.1.2 섹션에서는 "명칭은 앞음으로 훼손된다"라고 명시되어 있습니다.`_Z`이 물체는 19개의 상징을 가지고 있습니다.`_ZNK4Rect4areaEv`이 글은`_Z`그럼`N`둥지를 틀어 붙인 이름`K`const 멤버 함수에서`4Rect`그리고`4area`길이가 고정된 소스 이름으로,`E`둥지를 틀어 놓은 이름을 닫기 위해`v`빈 매개 변수 목록에 대해`llvm-cxxfilt`발자국`Rect::area() const`-`_Z8describeRK5Shapei` `describe(Shape const&, int)`이 책:`R`참고 자료입니다.`K`이 함수는 const,`5Shape`이 수업은`i` `int`5.1.4 섹션의 특수명칭은`_ZTV``_ZTI`타입정보에 대해`_ZTS`타입정보 이름 문자열에 대해.`C1``C2``D0``D1`그리고`D2`그래서`_ZN4RectD0Ev`그리고`_ZN4RectD2Ev`두 가지 모두 인쇄`Rect::~Rect()`: 삭제 파괴자 및 기본 객체 파괴자 모두 원천 이름을 공유합니다.

`Demangler``code/main.py`5.1.5.2 섹션의 빌틴 타입 코드 및 `S_`5.1.10 섹션의 대체. 테스트는 19개의 이름 모두에서 실행되고`llvm-cxxfilt --no-strip-underscore`출력: 플래그가 macOS에서 중요하며, 도구는 기본적으로 1개의 주요 하위점을 제거하고, 그 다음으로는 인식하지 못합니다.`Z8describe...`- 그래

### 이전된 물품

ABI의 2.5.2 섹션에서는 가상 테이블의 구성 요소들을 순서대로 나열합니다. 가상 호출 오프셋, 가상 기본 오프셋, 오프셋에서 상위, 타입 인포 포인터, 그리고 가상 함수 포인터. 주소 포인트, 객체의 vptr의 값은 첫 번째 함수 포인터의 주소가 있습니다 (부 2.6.2). `Rect`가상 기반이 없기 때문에 테이블은 상위, 타입정보, 기능으로 오프셋됩니다.

상징`_ZTV4Rect`이 객체에서 모든 바이트는 0x30 바이트, 6 바이트 슬롯입니다.`.rela.data.rel.ro._ZTV4Rect`이 부분의 본문은

```text
0000000000000008 R_X86_64_64              _ZTI4Rect
0000000000000010 R_X86_64_64              _ZN4RectD2Ev
0000000000000018 R_X86_64_64              _ZN4RectD0Ev
0000000000000020 R_X86_64_64              _ZNK4Rect4areaEv
0000000000000028 R_X86_64_64              _ZNK4Rect4nameEv
```

슬롯 0는 오프셋을 상단에 유지하며 0이며 이전할 필요가 없습니다. 슬롯 1은 타입 인포입니다. 주소 지점은 `+16`0은 전체 객체 파괴자, 1은 삭제 파괴자, 2는`area`, 3부`name`-`read_vtable()`이 기호의 크기와 그 범위의 이동 및 0의 오프셋에서 0을 읽습니다.`Shape`테이블은 같은 모양입니다`__cxa_pure_virtual`순수한 가상 호출이 도달하는 실행 시간 함수입니다.

### RTTI

2.9.4 섹션에서는 `std::type_info`그 다음에는 mangled 타입 이름의 포인터가 붙어 있고, 파생된 클래스를 나열한다. `_ZTI4Rect`3개의 이전을 합니다: `_ZTVN10__cxxabiv120__si_class_type_infoE+0x10``_ZTS4Rect`그리고`_ZTI5Shape`첫 번째는`__si_class_type_info`, ABI가 오프셋 0에서 단일 공개 비 가상 기반을 가진 타입에 사용하는 클래스, 그리고 `+0x10`vtable의 주소 지점입니다. 문자열의 두 번째 지점`4Rect`, 즉, 형의 이름이며,`name()``type_info`3번째는 기본입니다.`_ZTI5Shape`사용 `__class_type_info`그리고 기본 지표가 없습니다.`read_typeinfo()`이 세 가지 사실을 반환합니다.

### 가상 통화

`describe``-O0`한 번의 가상 전화를 합니다.

```text
       f: 48 8b 7d f8                  	movq	-0x8(%rbp), %rdi
      13: 48 8b 07                     	movq	(%rdi), %rax
      16: ff 50 10                     	callq	*0x10(%rax)
```

첫 번째`movq`두 번째는 객체의 오프셋 0에서 8 바이트를 읽습니다. 이는 vptr이기 때문에 ABI는 가상 함수있는 클래스에 먼저 배치합니다.`callq``0x10`VPT를 지나고,`0x10 / 8`2번 슬롯입니다.`find_virtual_calls()`패턴과 일치하고 두 후보에 대해 보고합니다: `Rect::area() const``_ZTV4Rect`그리고`__cxa_pure_virtual``_ZTV5Shape`어떤 건 실행되는지는 객체에 달려 있습니다. 그래서 호출은 간접합니다.

DWARF는 같은 슬롯을 기록합니다.`DW_TAG_subprogram` 항목`area`두 클래스 모두 `DW_AT_vtable_elem_location (DW_OP_constu 0x2)``name`3번 슬롯을 들고 있고, 파괴자는 0번 슬롯을 가지고 있습니다.`Rect``DW_TAG_structure_type`16바이트의 `DW_TAG_inheritance``Shape`0 및 회원 `w`8시`h`12시`Shape`인공적인 단위로 8바이트`_vptr$Shape`. 두 개의 독립된 추리값은 2번 슬롯을 `area`: 이전 테이블과 디버깅 항목

`-O1`이 물체는 전혀 비터블이 없습니다.`main`건축물`Rect`로컬로 설정되어 있어서 컴파일러는 해결되었습니다`r.name()`그리고`describe(r, 2)`테이블의 주소를 아무것도 취하지 않으므로 테이블은 방출되지 않습니다.`describe`여전히 포함됩니다`movq (%rdi), %rax`그리고`callq *0x10(%rax)`, 그 매개 변수는`Shape`.실종 vtable는 하나의 객체 파일에 대한 사실이고, 테스트는`test_the_optimised_object_keeps_the_call_pattern_but_drops_the_vtables`두 반을 모두 확인해

마이크로소프트 ABI는 이 모든 세부 사항에 따라 다릅니다.`?`그리고 호출 컨벤션을 암호화하고,`void test(void)`C++로 컴파일`__cdecl` `?test@@ZAXXZ`RTTI 로케이터는`vfptr[-1]``_RTTICompleteObjectLocator`, 그리고 상징은`??_7`VFTAble 및`??_R4`마이크로소프트의 문서에서는 "컴파일러 공급업체들 사이에 C++ 이름 붙이는 표준이 없다"고 합니다. 이 수업의 장치는 이타늄만입니다.

## 도구 들 은 복구 된 종류 를 어떻게 알려 주는가

아래의 모든 줄에 출력 이름을 붙인 이 기계에서 생성되어`code/fixtures/tools/`여기에 설치되지 않은 도구에 대한 행은 그 문서들을 설명하고 그렇게 말합니다.

| Tool | Version, licence | Where types live | On our fixtures |
|---|---|---|---|
| Ghidra | 12.1.4, 2026-09-21, Apache-2.0 | Data Type Manager with built-in, user-defined, and derived types; `.gdt` archives; types used by a program are copied into it | With DWARF: `/DWARF/account.c/account size=32 align=8` and `a->balance = by + a->balance;`. Without: `*(int *)(param_1 + 4)` with `long param_1`, `tag(char *param_1)`, and `*(char **)(param_1 + 0x18)` |
| IDA Pro | 9.4, 2026-07-13, commercial; IDA Free is non-commercial with a cloud decompiler for x86 only | Local Types window, `.til` type libraries, DWARF and PDB import into a `dwarf` or `pdb` folder | Not installed. Documentation only |
| Binary Ninja | 6.0, 2026-09-03, commercial with a Free edition | Type editing, header import and export, type archives, debug info from DWARF and PDB, type libraries, platform types | Not installed. Documentation only |
| radare2 | 6.2.4, 2026-10-05, LGPLv3 | `ts`, `tsc`, `afvd` | `ts` and `tsc account` printed nothing for the relocatable object with `bin.dbginfo=true`; `pdf` shows `mov dword [rax + 4], ecx` with source line comments from DWARF |
| rizin | 0.9.1, 2026-06-29, LGPL core | `ts`, `tsc`, `afvd` | `tsc account` printed `struct account { char kind; int balance; short code; double rate; const char *label; };` from DWARF; the build without `-g` lists only its bundled header types |
| lldb | lldb-1703.0.236.21 | `image lookup -t` | `byte-size = 32` and the full `compiler_type` text from the ELF object |
| gdb | not installed here | `ptype /o` prints "the offsets and sizes of fields in a struct" with holes marked | Documentation only |
| pyelftools | 0.33, public domain | Python API over `.debug_info` | A 43-line script prints the same five members and `unit version 5` |
| llvm-dwarfdump | Apple LLVM 17.0.0 | `--debug-info`, `--debug-abbrev`, `--debug-str-offsets` | The oracle for every reader test |

DWARF 없이 Ghidra의 출력은 동일한 두 가지 규칙을 작동시키는 것을 보여줍니다.`char *`의 매개 변수에`tag`함수는 1 바이트를 비교하고`char **``0x18`왜냐하면`label_length`로드된 값을 더하여 바이트를 비교합니다. 이 수업의 패스가 적용되는 두 가지 규칙입니다. 명령에서 폭, 지표에서 지표. 지드라의 디컴파일러 문서에서는 p 코드 바르노드가 "ئۇلار와 관련된 데이터 타입이 반드시 없"고 말하고 있으며, 디컴파일러는 "결국 퍼포먼스를 통해 공식적인 데이터 타입을 지정한다". "변수 포인터를 입력하라"는 옵션은 동일한 확산을 상수까지 확장합니다. Ghidra 12.1은 디컴파일러에 비트 필드 복구 기능을 추가했습니다. 이 수업의 고정 장치들은 이를 사용하지 않습니다.

손으로 만든 테이블은 이야기의 다른 절반입니다. 기드라의 데이터 타입 관리자, IDA의 로컬 타입, 바이너리 닌자의 타입 아카이브, 그리고 리진의 `td`모든 것은 복구된 레이아웃에서 구조를 입력하고 디컴파일러 재전환을 관찰합니다. 패스는 무엇을 입력하고 어떤 필드를 추측하는지 알려줍니다.

rea 6.5.0 는 Ghidra 공급자와 함께 디컴파일러 텍스트를 기록으로 반환합니다. Ghidra 라인에서 모든 것이 적용되며 기록은 그 타입 이름을 생성한 증거 없이 가지고 있습니다. 실행 `python3 code/main.py infer`같은 목록에 있는 증거가 있습니다.

## 유형 인퍼런스 연구

여기서 패스는 한 파라미터에서 도달한 하나의 구조로 제한된 타입 추론 시스템의 제한 생성 반입니다.

- TIE (Lee, Avgerinos, Brumley, NDSS 2011) 는 제약 생성 및 바이너리 IR에 대한 해결으로 타입 재구성을 프레임하고 보수성과 정확성을 측정하고 87 개의 핵심 프로그램에서 상업적 디컴파일러와 비교했습니다.
- Retypd (Noonan, Loginov, Cok, PLDI 2016) 는 하위 타입, 다형성, 그리고 재발성 유형을 추가하고 포인터의 재구성 보고를 `const`98%의 회수율을 가진 해설.
- OSPREY (Zhang 및 다른, IEEE S&P 2021) 는 각 메모리 위치를 무작위 변수로 취급하고 가장 확률적인 유형을 추론합니다.
- DIRTY (Chen 및 기타, USENIX 보안 2022) 및 ReSym (Xie 및 기타, CCS 2024) 는 학습된 모델과 함께 프로세스 후 디컴파일러 출력, ReSym는 전체 구조 레이아웃에 대한 72.9%의 정확성을보고합니다.
- RecStruct (Chen 및 다른, USENIX 보안 2026) 은 파편화 장치 없이 둥지를 틀어 놓은 스트럭을 복구하며, 흐름에 민감한 상징적인 실행과 스택 슬롯에 대한 조합을 찾습니다.

스택 구조는 이 수업의 패스가 빠진 첫 번째 것입니다.`-O1``main`계속 `rows`스택에 표시된 코드에는`0x24(%rsp)``0x40(%rsp)``0x48(%rsp)``0x30(%rsp)`그리고`0x38(%rsp)`이 모듈 32의 이산은 4, 0, 8, 16 및 24입니다. 같은 구조입니다. 시어할 매개 변수가 없습니다.

## 건설 해

디모를 실행하세요:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types
python3 code/main.py
```

출력은 5개의 부분으로 이루어진 JSON 보고서입니다. `dwarf`단위 헤더, 구조 및 기능들을 보유하고 있습니다.`-O0`객체`oracles`psABI 규칙 레이아웃을 가지고 있습니다.`ctypes`레이아웃, DWARF 레이아웃, 네이티브 런, 그리고 `agree`깃발`builds`접근, 추론된 레이아웃, 그리고 세 개 개마다 비교를 담고 있습니다. `cxx` (vtables) 와 typeinfo 기록, 가상 호출, 그리고 DWARF 슬롯을 모두 포함합니다. `tools`캡처된 도구 출력을 목록으로 표시합니다.

예상형:

```json
{
  "dwarf": {"unit": {"unitLength": 489, "version": 5, "unitType": "DW_UT_compile", "addressSize": 8, "abbrevOffset": 0}, "...": "..."},
  "oracles": {"agree": true, "psabiRules": {"size": 32, "align": 8, "...": "..."}, "...": "..."},
  "builds": {
    "O0": {"layout": {"stride": 32, "size": 32, "gaps": [1, 2, 3, 10, 11, 12, 13, 14, 15], "...": "..."}, "comparison": {"matches": 5, "members": 5, "...": "..."}},
    "O1": {"...": "..."},
    "O2": {"...": "..."}
  },
  "cxx": {"virtualCalls": [{"slot": 2, "candidates": {"Shape": "__cxa_pure_virtual", "Rect": "_ZNK4Rect4areaEv"}, "...": "..."}], "...": "..."}
}
```

읽으세요`code/main.py`이 순서로:

1. `ElfObject`섹션, 상징, 이전을 읽습니다.`relocated()`적용됩니다`S + A`디버깅 섹션으로
2. `parse_abbreviations()`그리고`DwarfInfo._parse_unit()`헤더, 단축 테이블, 항목을 읽어보고 해결하세요 `strx`그리고`addrx`두 테이블을 통해
3. `DwarfInfo.struct_layouts()`그리고`functions()`항목을 로 변환`StructLayout`그리고`FunctionInfo`기록,`type_name()``type_size()`그리고`type_kind()`- 그래
4. `parse_listing()``parse_memory()`그리고`access_width()`이 문서를 읽어보세요`llvm-objdump`문자
5. `trace_function()`추상 상태 기계입니다.`fold_unrolled()`그리고`infer_layout()`접근을 레이아웃으로 바꾸어 놓습니다.
6. `compare_layouts()`상태 줄을 생성하고,`sysv_layout()`그리고`ctypes_layout()`두 가지 다른 오라클입니다.
7. `Demangler``read_vtable()``read_typeinfo()`그리고`find_virtual_calls()`C++ 객체를 덮어

네 가지 명령이 더 있습니다.`python3 code/main.py dwarf FILE.o`DWARF 5의 이전 가능한 모든 객체의 구조와 기능을 인쇄합니다. `python3 code/main.py infer LISTING.txt [FILE.o]`리스트에 패스를 실행하고 객체와 비교하여 DWARF에 비교합니다. `python3 code/main.py demangle NAME...`그리고`python3 code/main.py vtable FILE.o`C++의 절반을 차지합니다.

## 사용 하 고

당신이 직접 만든 새로운 물체에

1. 포착`llvm-objdump -d -r`이 문서는 그 문서를 읽습니다.
2. 달아`python3 code/main.py infer`목록에 있는. 먼저 증인 줄을 읽어 보세요: 그 값은 첫 번째 매개 변수가 메모리 베이스로 사용된 함수를 지정합니다. 함수가 없는 경우, 그 매개 변수는 메모리 오페란드를 달성하지 못하거나, 패스가 추적하지 않는 경로를 통해 하나에 도달했습니다.
3. 각 필드를 접근수와 함께 읽어 보세요. 한 접근수와 함께 한 증인으로 기록하세요.
4. 발걸음 증거들을 읽어보세요.`call-site`또는`scale`입구는 강하다.`loop-step`다른 종류의 입력이 약한 것은 무고 loop가 여러 요소의 단계를 보고하기 때문입니다.`unrolled`을 손으로 확인해 보세요.
5. 만약`-g`구축이 존재하고, 비교를 실행하고, 그렇지 않은 모든 줄을 읽으십시오 `match`- A`no-evidence`행은 함수가 닿지 않은 멤버를 이름합니다.`unexpected`행 이름은 패스가 놓을 수 없는 접근 장소입니다.
6. 구조로 툴의 타입 관리자에 레이아웃을 입력하고 어떤 필드, 이름, 타입이 추측인지 기록하십시오.

세 개의 오라클을 접근할 수 있게 해줘`ctypes`, 그리고 DWARF이 당신이 작성한 레이아웃에 동의하지 않습니다, 당신은 포장 된 구조, 비트 필드, 또는 다른 규칙이있는 목표를 발견했습니다.

## 인터랙티브 연구소

### 연구소 A: 회원 항목을 해독

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types/code
python3 -q
```

실행:

```python
from main import *
elf = load_object("account-x86_64-O0-g.o")
dwarf = DwarfInfo(elf)
dwarf.header()
elf.section(".debug_info").data[0x1a3:0x1ac].hex(" ")
dwarf.dies[0x1a3].attributes
dwarf.type_name(dwarf.type_of(dwarf.dies[0x1a3]))
```

9바이트를 13번으로 해독해서 사전에 들어가서`elf.section(".debug_str_offsets").data[8:16].hex()`, 그리고 이사를 한 사람,`elf.relocated(".debug_str_offsets")[8:16].hex()`, 그리고 그 차이를 설명해

### 연구소 B: 1개의 함수를 추적

```python
listing = load_listing("account-x86_64-O0-g.objdump.txt")
trace = trace_function("label_length", listing["label_length"])
[(hex(a.address), a.root, a.offset, a.width, a.kind) for a in trace.accesses]
trace.pointer_uses
trace_function("sum_balances", listing["sum_balances"]).loops
```

실행하기 전에, 오프셋 24가 포인터라는 것을 증명하는 접근을 적어라.`-O1`목록에 올려서 `leaq 0x1(%rcx), %rcx``trace.increments`- 그래

### 실험실 C: 벡터화된 루프를 접어라

```python
o2 = load_listing("account-x86_64-O2-g.objdump.txt")
trace = trace_function("sum_balances", o2["sum_balances"])
sorted({a.offset for a in trace.accesses})
folded, evidence = fold_unrolled(trace, trace.accesses)
sorted({a.offset for a in folded}), [(e.kind, e.value, e.text) for e in evidence]
```

그럼 도망쳐`analyze_build("O2", fold=False)["comparison"]`그리고 계산해봐`unexpected`라인. 접기 규칙을 변경하여 루프 단계가 정확히 필요합니다`k * d``k`적어도 2개, 그리고 확인합니다`-O1`루프, 하나의 접근과 단계 32로, 혼자 남겨집니다.

### 연구소 D: 표와 이름

```python
shapes = load_object("shapes-x86_64-O0-g.o")
read_vtable(shapes, "_ZTV4Rect")
read_typeinfo(shapes, "_ZTI4Rect")
demangle("_ZNK4Rect4areaEv"), demangle("_Z8describeRK5Shapei")
find_virtual_calls(load_listing("shapes-x86_64-O0-g.objdump.txt"), [read_vtable(shapes, "_ZTV5Shape"), read_vtable(shapes, "_ZTV4Rect")])
```

에서 슬롯을 계산합니다`callq *0x10(%rax)`종이 위에 써서 확인해 주세요`DwarfInfo(shapes).struct("Rect").virtual_methods`- 그럼 `shapes-x86_64-O1-g.o`그리고 시도해봐`read_vtable`이 책에 대해 읽어보세요`ElfError`그리고 그 기호가 왜 없는지 설명해 주세요.

## 연습 실험실

                                           `main``-O1`- 그래

요구 사항:

- 확장`trace_function()`프레임 슬롯 영역이 뿌리가 될 수 있도록 합니다.`movaps`  `0x0(%rsp)` `0x5f(%rsp)``.data.rel.ro`, 즉 96바이트의 초기화`rows`- 그래
- 입력된 접근을 지정합니다 `0x24(%rsp)``0x40(%rsp)``0x48(%rsp)``0x30(%rsp)`그리고`0x38(%rsp)`그 뿌리를 보고 그들의 보완 모두 후보 단계.
- 에서 루프에서 32 단계를 추출합니다`0x120` `0x12c`, 어디`%r14`4시부터 시작해서 4시까지 진행됩니다.`0x20``0x64`, 그리고 루프가 묶여있는 것을 보여주십시오`0x64`3개의 요소를 더하여 필드 오프셋을
- DWARF 레이아웃과 결과를 비교하고 5개의 일치에 도달하고 어떤 종류가 검증되지 않은지 기록하십시오.
- 프레임 루트가 매개 변수에 부여될 때 실패하는 테스트를 추가합니다.

성공이란`python3 code/main.py infer``-O1`목록 목록`main`프레임 루트와 함께 목격자로서, 비교는 5개의 일치를 보여줍니다`main`혼자

## 교훈 유물

이 교훈은`outputs/skill-recovering-data-and-types.md`. 목록 및 선택적 디버깅 빌딩을 각 필드별 증거, 자료와 함께 한 단계, DWARF에 대한 비교 및 알려지지 않은 목록으로 구성하는 구조 구조로 변환하는 데 사용하십시오.

## 확인 해 보

데모와 결정적 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

검증은 다음과 같은 사실을 증명해야 합니다.

- 단위 제목, 14개의 단축과 5개의 구성원 오프셋은 동의합니다.`llvm-dwarfdump`
- 이사를 통해 이름이 도착합니다`.debug_str_offsets`테이블과 단위의`str_offsets_base`그리고`addr_base`8개
- 6개의 함수는 범위를 가지고 있습니다.`DW_OP_reg6 RBP`그리고`DW_OP_fbreg`덤프에서 표시되는 위치, 그리고 그들의 낮은 주소가 목록의 기능 시작과 같습니다
-  없는 물체`.debug_info`이 고, LEB128 디코더 핸들`0x78`-8
- `pyelftools`그리고`lldb`독자와 같은 레이아웃을 인쇄
- psABI 규칙,`ctypes`, DWARF, 그리고 원주민 실행은 대상을 제공합니다`0, 4, 8, 16, 24`그리고 크기는 32이고, 다시 정리된 구조는 24바이트입니다
- 목록 분석기에는 13개의 명령어가 있습니다.`bump`, 부착`R_X86_64_PLT32 bump-0x4`전화로`0x194`, 그리고 뒤로 뛰어드는 것을 찾습니다`0x72`
- AT&T 텍스트와 mnemonic에서 메모리 오퍼랜드, 너비, 종류 및 표지판을 디코드
- `bump``-O0`프레임 슬롯에서 지표를 다시 읽고 오프셋 4에서 3번 접근합니다
- 이 발걸음은`shlq $0x5``-O0`,`addq $0x20, %rdx``-O1`, 그리고 8개의 부하에서 256개의 단계로 접혀`-O2`
- `label_length`오프셋 24에서 포인터를 디레퍼런스 함으로써 증명합니다
- `main`0의 오프셋에서 한 프레임 객체를 통과합니다. `0x20`그리고`0x40``-O0`그리고 아무것도 부르지 않습니다`printf``-O1`
- 각 빌드 5개 구성원 중 5개 구성원 중 32개 크기와 DWARF 이 같을 수 있는 격차와 일치합니다.
-  `-O2`보고서를 작성하여 7개의 필드를 32 바이트를 지나서 크기가 없습니다
- 해독자는 19개 모두 재생산합니다`llvm-cxxfilt`줄
- vtables, typeinfo 기록, 그리고 가상 통화`0x16`슬롯 2로 결정하고 DWARF는 동의합니다
- `-O1`C++ 객체는 호출 패턴을 유지하며 vtable가 없습니다
- 지드라, 리진, 라다르2 촬영은 DWARF와 구조를 표시하고 그 없이 원료의 오프셋을 보여줍니다
- 상호 작용적인 그림은 분석에서 생성되는 동일한 데이터를 포함합니다

## 생산 실패 모드

| Failure | What the weak tool reports | What the analysis must prove |
|---|---|---|
| Unrolled loop | Eight fields 32 bytes apart and a 232-byte struct | Loop step 256 equals 8 times the offset delta 32, so one field at offset 4 |
| Stride read from one increment | `sizeof` 256 from `addq $0x100` | The greatest common divisor of every stride source, with the scalar tail's `addq $0x20` |
| 8-byte field called a pointer | `void *` at offset 24 | A later access uses the loaded value as a base, or the kind stays `int64` |
| Pointer called an integer | `long` at offset 24 | The dereference at `0xfb`, recorded as pointer proof |
| Narrow compare | `char` with a sign | `cmpb` carries no sign; only `movsbl` or `movzbl` does |
| Five functions assumed to share a type | One struct with no evidence of aliasing | Call sites in `main` that pass one frame object, or an explicit analyst assertion |
| Strings read from `.debug_str` by index | Garbage names from a relocatable object | `str_offsets_base` plus the relocated `.debug_str_offsets` entry |
| Addresses read as numbers | `low_pc` of 0 for every function | `addrx` through the relocated `.debug_addr` table |
| DWARF 4 object | A reader that misparses the header | Version check on the second header field; 4 has no `unit_type` byte |
| Missing vtable | "the class has no virtual functions" | The `-O1` object inlined every call; the `-O0` object has the table and its relocations |
| Vtable slot read from the wrong base | Off-by-two slot numbers | The address point is 16 bytes past the symbol, after offset-to-top and typeinfo |
| Mangled name stripped | `Z8describeRK5Shapei` left as is | `--no-strip-underscore` on macOS, or a demangler that checks for `_Z` |
| Struct typed from one tool's guess | `char *param_1` taken as the field type | The width and the dereference, written as evidence, and the name marked as a guess |

## 운영 규칙

접근에서 필드를 복구하고 루프에서 단계를 복구하고 각 명령어를 붙여넣으십시오. 발걸음을 넘어서서 오프셋을 신뢰하기 전에 풀린 루프를 접어라. DWARF를 줄기와 이전 테이블을 통해 읽으십시오. 문자열 섹션으로  индекс하여 결코 읽지 마십시오. 필드별 비교를 해보고 모든 멤버를 증거 없이, 모든 증명되지 않은 포인터, 모든 이름을 알려지지 않은 것으로 적어 보세요. C++ 객체에서 vtable를 이전에서 읽고 호출에서 슬롯을 읽으십시오. 그리고 DWARF를 사용하여 읽은 슬롯을 확인합니다.

## 더 많은 읽기

- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, section 3.1.2: Data Representation](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64), section 5.10: Composite Types](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [Writing ARM64 code for Apple platforms](https://developer.apple.com/documentation/xcode/writing-arm64-code-for-apple-platforms)
- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 1, section 3.7.5: Specifying an Offset](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [DWARF Debugging Information Format Version 5, sections 2.1, 5.7.6, 7.5.1.1, 7.5.3, 7.5.6](https://dwarfstd.org/doc/DWARF5.pdf)
- [Itanium C++ ABI, sections 2.5 (Virtual Table Layout), 2.9 (Run-Time Type Information), 5.1 (External Names)](https://itanium-cxx-abi.github.io/cxx-abi/abi.html)
- [Microsoft Learn: Decorated names](https://learn.microsoft.com/en-us/cpp/build/reference/decorated-names?view=msvc-170)그리고[Name Decoration](https://learn.microsoft.com/en-us/cpp/error-messages/tool-errors/name-decoration?view=msvc-170)
- [llvm-dwarfdump command guide](https://llvm.org/docs/CommandGuide/llvm-dwarfdump.html)그리고[llvm-cxxfilt command guide](https://llvm.org/docs/CommandGuide/llvm-cxxfilt.html)
- [Python ctypes: Structure layout, sizeof, alignment](https://docs.python.org/3/library/ctypes.html)
- [Ghidra Data Type Manager](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Base/src/main/help/help/topics/DataTypeManagerPlugin/data_type_manager_description.htm)[Decompiler Concepts](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/main/help/help/topics/DecompilePlugin/DecompilerConcepts.html)[Decompiler Options](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/main/help/help/topics/DecompilePlugin/DecompilerOptions.html)그리고[Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_12.1.4_build)
- [IDA 9.1 user guide: Types](https://docs.hex-rays.com/9.1/user-guide/types)[IDA 9.4 release post](https://hex-rays.com/blog/ida-9.4-release-a-new-dyld-shared-cache-swift-analysis-new-teams-add-on-and-more-)그리고[IDA Free](https://hex-rays.com/ida-free)
- [Binary Ninja user guide: Types](https://docs.binary.ninja/guide/types/)그리고[Binary Ninja 6.0 Krypton](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)
- [radare2 6.2.4 release](https://github.com/radareorg/radare2/releases/tag/6.2.4)그리고[rizin v0.9.1 release](https://github.com/rizinorg/rizin/releases/tag/v0.9.1)
- [GDB manual: Examining the Symbol Table, ptype /o](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Symbols.html)
- [pyelftools on PyPI](https://pypi.org/project/pyelftools/)
- [Lee, Avgerinos, Brumley, "TIE: Principled Reverse Engineering of Types in Binary Programs" (NDSS 2011)](https://www.ndss-symposium.org/ndss2011/tie-principled-reverse-engineering-of-types-in-binary-programs/)
- [Noonan, Loginov, Cok, "Polymorphic Type Inference for Machine Code" (PLDI 2016)](https://arxiv.org/abs/1603.05495)그리고[the retypd repository](https://github.com/GrammaTech/retypd)
- [Zhang et al., "OSPREY: Recovery of Variable and Data Structure via Probabilistic Analysis for Stripped Binary" (IEEE S&P 2021)](https://ieeexplore.ieee.org/document/9519451/)
- [Chen et al., "Augmenting Decompiler Output with Learned Variable Names and Types" (USENIX Security 2022)](https://www.usenix.org/conference/usenixsecurity22/presentation/chen-qibin)
- [Xie et al., "ReSym: Harnessing LLMs to Recover Variable and Data Structure Symbols from Stripped Binaries" (CCS 2024)](https://dl.acm.org/doi/10.1145/3658644.3670340)
- [Chen et al., "RecStruct" (USENIX Security 2026)](https://www.usenix.org/conference/usenixsecurity26/presentation/chen-yuxin)
