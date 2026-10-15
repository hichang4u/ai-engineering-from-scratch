# 분해 및 제어 흐름: 바이이트에서 그래프로 확인 할 수 있습니다

> 해체 목록은 어떤 바이트가 지침이냐에 대한 주장이며 이 교훈은 이 주장을 확인하는 디코더와 그래프를 만듭니다.

**Type:** Build
**Languages:** Python, C, x86-64 assembly
**Prerequisites:** Phase 13 · 32 (ELF from scratch)
**Time:** ~150 minutes

## 학습 목표

- 이 책에 있는 x86-64 명령어 하위 집합을 인텔 SDM 2권 2장 규칙에서 해독한다.
- 디코더를 `llvm-objdump -d`모든 건축물들의 명령에 따라
- 같은 바이트에 대한 선형 스캔과 재발성 다운로드를 실행하고 각각의 오류가 무엇인지 설명하십시오.
- 기본 블록으로 명령어를 잘라내서 엣지를 입력한 제어 흐름 그래프를 만들 수 있습니다.
- 쿠퍼, 하비, 케네디의 반복 알고리즘으로 즉각적인 지배자를 계산하고 뒷면에서 루프를 찾아라.
- 이 테이블에 있는 이재로 입력에서 간접 점프의 목표를 복구하십시오.

## 문제

당신은 `ledger.c``-O0`그리고 어떤 일을 하는 중재에게 물어봤어요`grade`에이전트는 디스몬더를 불러서 리스트를 읽고, 그 함수가`jmpq *%rax`알 수 없는 목표물을 가지고`return 0`- 그래

같은 물체를 열면`llvm-objdump -d`4개 블록 뒤에 4개, 3개, 2개, 1개 블록을 볼 수 있습니다.

목록은 하나의 질문에만 대답합니다. 어떤 명령어에서 어떤 명령어를 바이트로 작성하는지 알려줍니다. 어떤 명령어를 실행하는지, 어떤 순서로 실행하는지, 어디서 실행하는지 알려지지 않습니다. 그 질문에 답하려면 세 가지 구조가 필요합니다. 제어 흐름이 도달 할 수있는 바이트, 기본 블록 및 그 사이의 가장자리.

REA 6.5.0는 자체적으로 해체기가 없습니다. 심층적인 분석을 위해, 그 README는 Ghidra, Hopper, 또는 IDA를 가져오라고 요청합니다. 오프라인 검사에서 rea는 또한 설치된 GNU Objdump 또는 Rizin을 호출할 수 있습니다. 이 호출 그래프는 해결되지 않은 목표에 멈추고 있습니다. "콜/콜은 해결된 함수만 포함합니다.... 목표 없는 컴퓨터 흐름은 아직 알려지지 않았습니다". 이 교훈은 그 사실을 보여주는 부분을 구성하고, 도구가 보고할 때 그것을 판단할 수 있도록 합니다.

```figure
re-33-sweep-vs-descent
```

## 명령어 형식 은 각 분야 에 한 가지 규칙 이 있습니다

인텔 SDM 볼륨 2, 그림 2-1는 각 명령의 바이트 순서를 제공합니다. 우선 선택적 사전, 다음에는 1~3개의 오프코드 바이트, 선택적 ModRM 바이트, 선택적 SIB 바이트가 있습니다. 0, 1, 2 또는 4 바이트의 이동이 이어지고, 0 1, 2 또는 4 바이트의 즉각적인 이동이 이어집니다. 전체 명령은 최대 15 바이트 (SDM 2.3.11) 이다. AMD APM 3권, 1장, 1.1~1.7부에서는 동일한 형식을 더 적은 페이지로 설명하고 좋은 횡단검사를 한다.

각 필드는 다음 필드가 무엇을 의미하는지 결정합니다. 따라서 디코더는 작은 결정의 연쇄이며, 각 결정은 매뉴얼에 문장을 가지고 있습니다.

### 사전은 4개 그룹으로 나뉘어 있습니다.

SDM 2.1.1는 기존의 사전을 나열합니다.`F0`잠금 및 반복 전두환`F2`그리고`F3`그룹 2는 6개의 세그먼트 상장점을 보유하고 있습니다 (`2E` `%cs`) 과 지점 지적이 있습니다.`66`, 오페란드 크기의 오버라이드. 그룹 4은`67`, 주소 크기의 오버라이드

매 그룹에서 한 개의 사전을 사용할 수 있다고 설명합니다. 컴파일러는 더 많은 양의 방출을 합니다.`ledger-x86_64-O0.o`이산화`0xf2`읽는다`66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00`, 5개의 복사본`66``llvm-objdump``nopw %cs:(%rax,%rax)`그리고 여러분이 만든 디코더도 마찬가지입니다. 디코더는 보시는 모든 프리픽스 바이트를 수집하고 나중에 어떤 바이트가 중요하다고 묻습니다.

`66`SSE 명령어에서는 반드시 opcode를 선택하는 사전이므로`66 0f ef c0` `pxor %xmm0, %xmm0`16비트도 안 돼`F3 0f 6f` `movdqu`. 디코더는 먼저 필수 사전과 두 번째 오프코드 바이트 부쌍을 찾습니다. 그 부쌍이 입력이 없는 경우에만`66`16비트 오페란드라는 뜻이죠.

### REX는 4 비트를 추가하고 opcode 옆에 앉아야 합니다

SDM 2.2.1는 REX를 에서 1 바이트로 정의합니다.`40` `4F`모양으로`0100WRXB`-`W`64비트 오페란드를 선택합니다. `R`ModRM 레지 분야를 확장합니다. `X`SIB 지수 필드를 확장합니다. `B`ModRM r/m 필드, SIB 기본 필드 또는 opcode byte의 레지스터를 확장합니다 (表 2-4). REX는 opcode 또는 escape bytes 직전에 나타나야 하며, REX에 따라 legacy prefix이 무시됩니다.

내`48 89 e5`바이트`48`REX가 `W` `89` `MOV r/m, r`, 그리고 ModRM`e5`선택합니다`%rsp``%rbp`. REX를 제거하면 같은 바이트가 됩니다`movl %esp, %ebp`- 그래

REX는 바이트 레지스터의 이름을 변경합니다. REX가 존재하면 4~7 코딩을 선택합니다 `%spl``%bpl``%sil`그리고`%dil`대신`%ah``%ch``%dh`그리고`%bh`그래서 디코더는 두 개의 테이블을 보관합니다.

### 오프코드는 두 개의 지도에 걸쳐 있습니다.

1바이트의 오프코드는 일반적인 경우입니다.`0F`2바이트의 지도로 탈출하고`0F 38`또는`0F 3A`일부 오프코드는 ModRM reg 필드를 3개의 더 많은 오프코드 비트로 쓰며,`/digit`설명서에 있습니다.`83 /7` `cmp`8비트 직속으로`83 /5` `sub`그리고`FF /4`간접적인`jmp`- 그래

디코더`code/main.py`네 개의 고정 객체에 있는 오프코드를 포함하고 몇 개의 이웃을 포함합니다. 목록은 8개의 수학적 형태입니다.`mov``lea``movslq``movzbl``imul`, 시위,`test`그리고`idiv`계속 되죠`push``pop``call``ret`, 16개의 조건부 점프, 멀티바이트`nop`, 그리고 5개의 SSE2 오프코드`DecodeError`그 주소를 설명하고 그 이유를 설명해줘

### ModRM와 SIB는 오페란드를 선택한다

SDM 2.1.3은 ModRM를 `mod`(비츠 7:6), `reg`(5:3), 그리고`r/m`(2:0)`mod = 11`r/m는 레지스터입니다. `mod = 00``01`그리고`10`8비트 또는 32비트 이동이 없는 평균 메모리`r/m = 100`SIB의 배트가 다음으로 나뉘어`scale`(시 7:6), `index`(5:3), 그리고`base`(2:0), 그리고 `100`지수 등록이 없다는 뜻입니다.

표 2-2의 두 개의 특별 행은 64 비트 모드에서 발생합니다. `mod = 00``r/m = 101`아니죠`(%rbp)`. 다음 명령에 비해 32비트 이동 (SDM 2.2.1.6) `mod = 00`SIB 기반이 있는`101`기본 레지스터가 없는 32비트 이동 장치입니다.

이봐`8d 44 08 fa``grade``-O0`- 오프코드`8D` `lea`- ModRM`44` `01 000 100`: 8비트 이동, reg `%eax`, 그리고 SIB가 따라옵니다.`08` `00 001 000`: 규모 1, 지표 `%rcx`, 기하급수`%rax`. 이동 바이트`fa`AT&T의 텍스트는`leal -0x6(%rax,%rcx), %eax`, 계산하는`score / 10 - 6`, 스위치 지표

### 이 이동은 링크 편집자가 작성하는 장소입니다

`48 8d 0d 00 00 00 00` `leaq (%rip), %rcx`. 4 0 바이트는 RIP 관련 오페란드의 이동 필드입니다. 이전 가능한 객체에서는 위치 보유자입니다.`.rela.text`이산화`0x69`이렇게 말합니다`R_X86_64_PC32.rodata-0x4`. psABI (表 4.9) 는 정의합니다 `R_X86_64_PC32``S + A - P`: 상징 주소가 더하기 추가 주소가 빼면 필드의 주소가 됩니다.

프로세서는 다음 명령어의 주소로 필드를 추가하므로 최종 목표는 `S + A + (end - P)`- 이 때문에`lea`필드는 마지막 4 바이트입니다`end - P`4이고 목표가`.rodata + (-4) + 4 =.rodata + 0x0`-4의 부가 는 그 4 바이트 를 미리 보상 합니다.`.rodata+0x10``-O1` `lea`수단`.rodata+0x14`- 그래

디코더는 각 명령어 안에 있는 이동 필드의 오프셋을 기록합니다. `resolve_reference()`이 작업은 연계 후 연계된 연계값을 표시하는 것을 보고합니다.`leaq (%rip), %rcx`"오, 이 테이블에`.rodata+0x0`"

### 이 경우, 한 예외로, 최대 32 비트의 임시

SDM 2.2.1.5은 64비트 모드에서 최대 32비트 이상 유지되고 신호 확장된다고 말합니다. 예외는 `MOV r64, imm64`(`B8+r``REX.W`), AT&T의 문법에서 부르는`movabsq`. 디코더는 8비트 직렬을 수학적 (`83 c1 fa` `addl $-0x6, %ecx`) 및 시퀀스 카운트 및 믹스 렉터 (`pshufd $0xee`이 분할이 무슨 뜻인지`llvm-objdump`발자국

지각과 가까운`push`그리고`pop`64비트 오페란드로 기본 설정하고 무시합니다`66`(SDM 2.2.1.7) 그래서 디코더가 그 이름을 붙여 `pushq``popq``callq`그리고`retq`오페란드 크기의 사전을 읽지 않고

## 한 가지 명령어를 손으로 해독

코드를 신뢰하기 전에, 암호를 해독하세요`48 69 c0 67 66 66 66``grade`종이 위에

1. `48` `40` `4F`, 그래서 REX와 함께 `W = 1`오페란드 크기는 64비트입니다.
2. `69` `IMUL r, r/m, imm32`- 그래
3. `c0`ModRM입니다`11 000 000`: 등록식, 규정`%rax`, r/m`%rax`- 그래
4. 다음 4 바이트는 바로, 작은 엔디안입니다.`0x66666667`- 그래
5. AT&T 주문은 즉각, 출처, 목적지: `imulq $0x66666667, %rax, %rax`- 그래

7바이트입니다.`llvm-objdump`이 변수는 klang을 10으로 곱하고 `sarq $0x22`이 두 쌍은 34번 수업에서 다시 만나게 될 것입니다.`score / 10`- 그래

디코더는 이 5가지 단계를 수행합니다`Decoder.decode()``_State.modrm()`그리고`_State.finish()`. 그 순서대로 읽어서 각 분과와 그 문서줄에 나열된 SDM 섹션에 일치합니다.

## 선형 수색

슈워츠, 데브레이, 앤드루스는 "실행 코드 재검토 해부" (WCRE 2002) 의 3.1 섹션에서 선형 스래프를 기술한다. 코드 섹션의 첫 바이트에서 시작하여 하나의 명령어를 해독하고, 그 다음 바이트에서 계속하고, 끝에서 중지한다. `objdump`이 방법이 작동하고, 그리고 그렇게 합니다`llvm-objdump`- 그래

```python
def linear_sweep(code: bytes, start: int = 0, end: int | None = None) -> SweepResult:
    position = start
    while position < end:
        try:
            instruction = decode(code[:end], position)
        except DecodeError:
            undecodable.append((position, code[position]))
            position += 1
            continue
        instructions.append(instruction)
        position = instruction.end
```

이 방법은 하나의 실패 모드를 가지고 있으며, 논문의 그림 1에서 보여집니다. 데이터인 바이트는 명령어로 디코딩되며 디코더는 실제 명령어 경계를 잠시 놓치게 됩니다. x86에서 디코더는 보통 몇 바이트 안에 다시 동기화되는데, 이는 오류를 보기 어렵게 만듭니다. 검출은 유효하지 않은 opscode에서만 이루어지고 있으며 논문의 결론은 이러한 알고리즘이 "성묵히 실패한다"는 것입니다.

스파이도 이 수업의 오라클입니다. 디코더는 동의해야 합니다.`llvm-objdump -d`모든 명령에 따라 모든 일용품에 따라`llvm-objdump`그 자체로 선형적인 휩쓸기입니다.`code/fixtures/*.objdump.txt`. 테스트는 각 라인을 주소, 바이트, 텍스트로 분석하고, 다음 댓글을 `#`4개의 객체에는 86, 56, 84 및 11개의 명령어가 있습니다. 전체적으로 237개의 명령어가 있습니다.

## 반복적 인 하락

같은 논문의 3.2 섹션에서는 두 번째 방법을 리큐티브 트로스컬이라고 부른다. 알려진 입점에서 시작하여 제어 전송이 될 때까지 해독합니다. 직접 점프를 위해, 목표에서 계속하십시오. 조건부 분기에서는 목표와 다음 명령에 따라 계속하십시오. 그리고 호출을 위해, 호출이 반환되기 때문에 그 후에 계속하십시오. 반환을 위해, 중지하십시오. 걸어가는 것이 끝날 때까지 방문 된 주소의 집합을 유지하십시오.

```python
if instruction.flow == "branch":
    worklist.append(instruction.target)
    address = instruction.end
elif instruction.flow == "indirect-jump":
    table = resolver(instruction, instructions) if resolver else None
    if table is None:
        unresolved.append(instruction)
        break
```

실패 모드는 반대입니다. 간접 점프는 바이트에 목표가 없습니다. 걷기는 거기서 멈추고 점프로만 도달 할 수있는 모든 블록은 알려지지 않습니다. 논문의 그림 2는 두 번째 위험을 보여줍니다. 명령의 중간에 지향하는 이전으로부터 얻은 목표 집합.`main.py`이 사건은 충돌로 기록되고 그 경로를 막기 때문에 두 번 침묵으로 해독되는 대신 겹치는 부분이 눈에 띄게 됩니다.

안드리세와 다른 사람들은 981개의 컴파일러 생성 바이너리에서 9개의 디스몬더를 측정했다 (USENIX Security 2016). 실전 데이터와 상복 코드는 실제 컴파일러 출력에서 문헌이 가정한 것보다 드물게 발생했으며, 하드 원시적은 함수 경계 복구였다. 두 연구 결과를 명심하십시오. 다음 섹션의 함정은 컴파일러 출력에서 드물다. 간접적인 점프`grade`흔한 일입니다.

## 이 잘못 되고, 하락이 옳지 않은 이

`code/fixtures/sweep-trap.s`함수 몸 안에 4 바이트 테이블이 있는 24 바이트의 손으로 작성된 집합입니다. 함수는 테이블을 `movzbl (%rcx,%rax), %eax`그리고 그 위에 뛰어넘는 거죠.

```asm
lookup:
        movslq  %edi, %rax
        leaq    .Ltable(%rip), %rcx
        movzbl  (%rcx,%rax), %eax
        jmp     .Ldone
.Ltable:
        .byte   0x31, 0xc0, 0x90, 0x48
.Ldone:
        addl    $1, %eax
        retq
```

이 을 만들어`clang -target x86_64-unknown-linux-gnu -c sweep-trap.s`. 테이블의 네 바이트는 그럴듯한 명령으로 해독되도록 선택되었습니다.`31 c0` `xorl %eax, %eax`-`90` `nop`-`48`REX의 전자이기 때문에, 스파이는 3 바이트의 실제와 결합합니다.`addl $1, %eax`그리고 발자국`addq $0x1, %rax`포로가 된 사람들`llvm-objdump`출력 결과와 정확히

```text
       e: eb 04                        	jmp	0x14 <lookup+0x14>
      10: 31 c0                        	xorl	%eax, %eax
      12: 90                           	nop
      13: 48 83 c0 01                  	addq	$0x1, %rax
      17: c3                           	retq
```

이 목록에 있는 것은 아무것도 깨진 것 같지 않습니다. 모든 바이트는 해독, 모든 미네모닉은 실제, 그리고`retq`이 목록은 여전히 3가지로 잘못되었습니다.`0xe`목표 `0x14`, 그리고 목록에 있는 명령은`0x14`- 명령이 실행되는`0x14`32비트입니다`addl`, 그리고 목록은 64비트 `addq`1바이트 전에 테이블 4바이트가 코드로 표시됩니다.

`lookup`6개의 명령어를 해독하고, 점프를 따라`0x14`, 그리고 보고서`addl $0x1, %eax`4개의 테이블 바이트 중 어느 것도 주장하지 않고 8개의 팩 바이트 중 어느 것도 주장하지 않습니다`plus_one`-`trap_report()``main.py`비교를 인쇄합니다.

```json
"linearSweep": {
  "instructions": 9,
  "atJumpTarget": {"starts": "0x13", "text": "addq\t$0x1, %rax", "startsAtTarget": false},
  "claimedDataBytes": 4,
  "claimedPaddingBytes": 8
},
"recursiveDescent": {
  "instructions": 6,
  "atJumpTarget": "addl\t$0x1, %eax",
  "claimedDataBytes": 0,
  "claimedPaddingBytes": 0
}
```

시험`test_sweep_and_objdump_share_the_same_mistake`이를 주장합니다`llvm-objdump`인쇄`addq $0x1, %rax``0x13`오라클은 선형 스파이이고, 맹점을 물려받습니다. 오라클과 협의하면 디코더를 확인하고, 내려오는 것은 어떤 명령이 실행되는지 확인합니다.

## 기본 블록

앨런은 "컨트롤 플로우 분석" (1970년) 에서 기본 블록을 정의했다. 그것은 첫 번째 명령에만 입력되고 마지막에만 남겨진 명령의 연속이다. 야칸과 다른 사람들은 함수 입력으로 헤더 노드를 사용하여 "노 더 고토스" (NDSS 2015) 의 II.A.2 섹션에서 복합화하기 위해 다시 설명한다.

이 구성은 디코드 된 명령어에 대한 두 패스 스캔입니다. 주소를 따라 분류됩니다. 첫 패스는 리더를 수집합니다. 리더는 엔트리, 분자 또는 점프 목표, 테이블 목표 또는 모든 제어 전송 후 명령입니다. 두 번째 패스는 모든 리더와 주소 순서에서 모든 격차에서 새로운 블록을 시작합니다.

```python
for instruction in self.instructions:
    if instruction.address in leaders or current is None or current.end != instruction.address:
        current = Block(instruction.address, [])
        self.blocks[instruction.address] = current
    current.instructions.append(instruction)
```

가장자리는 각 블록의 마지막 명령에서 따라가며, 복귀는 후속자가 없습니다. 도약은 탭을 가지고 있습니다.`jump`조건부 분자는 두 가지로 표시됩니다`taken`그리고`fallthrough`. 블록 끝에서 간단한 명령은 다음 블록으로 넘어갑니다. 다음 명령은 지점 목표가 될 때 발생합니다. 간접 점프는 테이블의 목표가 표시됩니다.`table`, 또는 아무것도, 그리고 블록은 기록됩니다`unresolved`- 그래

같은 스캔에서 두 가지 더 많은 사실이 밝혀졌습니다. 입력이 도달할 수 없는 블록은 접근할 수 없습니다.`grade``-O0`다른 방법의 목록에 있는 명령에 해당하는 블록은 함락에서 겹치는 경우입니다.

## 전체의 제어 흐름 그래프

`total``-O1`31바이트와 13개의 명령어입니다.

```text
      40: 85 f6                        	testl	%esi, %esi
      42: 7e 18                        	jle	0x5c <total+0x1c>
      44: 89 f1                        	movl	%esi, %ecx
      46: 31 d2                        	xorl	%edx, %edx
      48: 31 c0                        	xorl	%eax, %eax
      4a: 66 0f 1f 44 00 00            	nopw	(%rax,%rax)
      50: 03 04 97                     	addl	(%rdi,%rdx,4), %eax
      53: 48 ff c2                     	incq	%rdx
      56: 48 39 d1                     	cmpq	%rdx, %rcx
      59: 75 f5                        	jne	0x50 <total+0x10>
      5b: c3                           	retq
      5c: 31 c0                        	xorl	%eax, %eax
      5e: c3                           	retq
```

지도자들은`0x40`(입장),`0x44`(이하`jle`), `0x50`(기본부 `jne`), `0x5b`(이하`jne`), 그리고`0x5c`(기본부 `jle`5개 블록, 5개의 가장자리

| From | To | Kind | Why |
|---|---|---|---|
| `0x40` | `0x44` | fallthrough | `jle` not taken, count is positive |
| `0x40` | `0x5c` | taken | count is zero or negative, return 0 |
| `0x44` | `0x50` | fallthrough | the `nopw` is alignment inside the block, execution passes through it |
| `0x50` | `0x50` | taken | `jne 0x50`, the loop |
| `0x50` | `0x5b` | fallthrough | loop exit, return the sum |

6바이트`nopw``0x4a`이 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 을 `0x50`16바이트의 한계에 위치하고 있습니다. 접근성이 높기 때문에 블록에 속합니다.`0x44`- 1바이트`nop``0x5f`마지막 후`retq`또한 이 이 되고, 아무것도 그 곳에 도달하지 않습니다. 함수를 휩쓸면, 그것은 여섯 번째 블록을 만듭니다.`unreachable()`그 목록에

`-O2`같은 함수는 140 바이트와 두 개의 루프입니다.`0x80` `paddd`, 그리고 스칼라 남은 것은 `0xc0`CFG는 뒷면 두 개 있습니다`0x80 -> 0x80`그리고`0xc0 -> 0xc0`, 그리고 테스트 스위트는 둘 다 확인합니다.

## 반복 알고리즘을 이용한 지배자

한 블록`d`블록을 지배합니다`b`입구에서 `b`지나가죠`d`- 바로 지배하는`b``b`가장 가까운 곳이죠`b`이 개념은 프로세르 (1959) 에서 앨런 (1970) 까지 거슬러 올라간다. 그리고 이 개념은 34번 강의에서 제시해야 할 구조입니다.`if`그리고`while`맞아요

쿠퍼, 하비, 케네디는 "단순하고 빠른 지배 알고리즘" (2001) 을 썼다. 그들은 컴팩트 표현으로 역전적 포스트질에서 실행되는 데이터 흐름 공식이 약 천 개의 노드에 있는 그래프에서 랭가워-타르얀 (1979) 를 제치고 있다고 주장합니다. 그들의 논문은 "새로운 알고리즘을 제시하는 것이 아니다"라고 말합니다. 간단한 알고리즘이 실제에서 승리할 수 있고 좋은 교육 도구임을 보여줍니다. CFG 함수는 거의 1000개의 노드를 가지고 있지 않습니다.

```python
def intersect(first: int, second: int) -> int:
    while first != second:
        while number[first] > number[second]:
            first = idom[first]
        while number[second] > number[first]:
            second = idom[second]
    return first

changed = True
while changed:
    changed = False
    for start in order[1:]:
        processed = [p for p in self.predecessors(start) if p in idom]
        candidate = processed[0]
        for other in processed[1:]:
            candidate = intersect(other, candidate)
        if idom.get(start) != candidate:
            idom[start] = candidate
            changed = True
```

`number`각 블록의 역부 순서상 위치를 가지고 있으며, 입력값은 0입니다. `intersect`현재 지배자 나무를 두 손가락으로 올라갈 때, 그 두 손가락이 만나기 전까지,`<`이 코드는 반향 순서 후 번호를 사용하므로 비교는`>`다른 모든 것은 신문의 사이비 코드입니다.

`total``-O1`그 결과`idom(0x44) = 0x40``idom(0x50) = 0x44``idom(0x5b) = 0x50`그리고`idom(0x5c) = 0x40`- 가장자리`0x50 -> 0x50`뒷면은 그 표적이 원천을 지배하고 뒷면은 루프를 표시하기 때문입니다 (Allen 1970). `back_edges()`검사를 돌려주면`test_dominators_on_a_hand_built_diamond_with_a_loop`16 바이트 순서로 같은 코드를 연결 포인트로 실행합니다.`intersect`두 명의 전신들을 보게 됩니다.

## -O0에서 점프 테이블

`-O0`clang은 `switch``grade`위치 독립적인 점프 테이블의 모호어:

```text
      5d: 83 e8 04                     	subl	$0x4, %eax
      60: 77 38                        	ja	0x9a <grade+0x6a>
      62: 48 8b 45 f0                  	movq	-0x10(%rbp), %rax
      66: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000069:  R_X86_64_PC32	.rodata-0x4
      6d: 48 63 04 81                  	movslq	(%rcx,%rax,4), %rax
      71: 48 01 c8                     	addq	%rcx, %rax
      74: ff e0                        	jmpq	*%rax
```

네 가지 사실로 읽어보세요.`subl $0x4`다음으로`ja`4 이상의 지수는 기본 경우로 이동합니다`0x9a`이 테이블에는 5개의 항목이 있습니다.`leaq`이식 시 테이블 주소를 `%rcx`, 그리고 이전 섹션에서는 그 주소가 `.rodata+0x0`- `movslq`4로 확장된 서명된 32비트 항목을 로드합니다.`addq`테이블 기지를 추가하여 각 항목은 테이블에서 케이스 블록까지의 거리가 됩니다.

객체 파일에서 테이블 바이트는 0입니다. 목표물은 단지 `.rela.rodata`이 부분의 본문은

```text
RELOCATION RECORDS FOR [.rodata]:
OFFSET           TYPE                     VALUE
0000000000000000 R_X86_64_PC32            .text+0x91
0000000000000004 R_X86_64_PC32            .text+0x8c
0000000000000008 R_X86_64_PC32            .text+0x87
000000000000000c R_X86_64_PC32            .text+0x82
0000000000000010 R_X86_64_PC32            .text+0x86
```

적용`S + A - P`입국`k`이산화`4k`저장된 값은`.text + A - (.rodata + 4k)`, 그리고 코드는 추가합니다`.rodata + 0`그래서 목표가`.text + A - 4k`. 입력 0은`0x91 - 0 = 0x91`, 항목 1은`0x8c - 4 = 0x88`, 그리고 항목 2는`0x87 - 8 = 0x7f`3 및 4 항목은`0x82 - 12 = 0x76`그리고`0x86 - 16 = 0x76`. 6, 7, 8, 9, 10번의 사건`score / 10`1, 2, 3, 4 및 4을 저장하는 블록으로 이동합니다. 9 및 10의 공유 케이스를 포함하여

`recover_table()`이 계산을 해봐`jump_table_resolver()`                      `jmpq`- 을 찾습니다`addq`이 기록은`movslq`이 이 이`leaq`그 밑바탕과 그 경계선을 지은`ja`. 하락은 다음 네 가지 다른 목표들을 밀어내고 계속됩니다. 연결된 실행형은 테이블에 최종 값을 가지고 있으며 이전도 없습니다. 같은 함수는 서명된 32 비트 항목을 읽고 테이블 주소를 추가합니다.`evidence`목표물을 생성하는 경로를 기록합니다.

`grade``-O0`,`python3 code/main.py cfg code/fixtures/ledger-x86_64-O0.o grade`이 부분의 본문은

| Method | Instructions | Blocks | Edges | Bytes | What is wrong |
|---|---|---|---|---|---|
| linear sweep | 34 | 9 | 7 | 118 code + 10 padding | 5 unreachable blocks, no edge into the four case blocks, padding decoded as `nopw` |
| recursive descent | 25 | 3 | 2 | 82 code | 36 code bytes never reached, `jmpq *%rax` at `0x74` unresolved |
| descent with the table | 33 | 8 | 11 | 118 code | nothing |

테이블에 의해 지배자 나무가 완성됩니다.`idom`각 사건 블록의`0x62`, 점프로 블록`idom``0xa1`이 항목은`0x30`, 왜냐하면 기본 경로가 `0x9a`도달합니다`0xa1`지나가지 않고`0x62`- 그래

## 최적화 장치가 -O1에 평가하는 데 어떤 역할을 했습니까?

당신은 보게 될 것입니다`grade`이 바이트는 좀 더 구체적인 것을 말합니다.`-O1`그리고`-O2`간접적으로 뛰어들 수 없습니다`grade`전혀:

```text
      2c: 83 f9 04                     	cmpl	$0x4, %ecx
      2f: 77 0c                        	ja	0x3d <grade+0x2d>
      31: 89 c8                        	movl	%ecx, %eax
      33: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000036:  R_X86_64_PC32	.rodata+0x10
      3a: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      3d: c3                           	retq
```

이전 추가`0x10`+ 보통 4은 테이블을 `.rodata+0x14`- 짐은 다`movl`, 그리고 그 바이트는`01 00 00 00 02 00 00 00 03 00 00 00 04 00 00 00 04 00 00 00`. 컴파일러는 5개의 케이스 블록을 5개의 반환 값의 테이블로 대체했습니다. 이식, 테이블 및 경계 확인이 있습니다. 제어 흐름은 3개의 블록과 3개의 가장자리가 한 가지 조건부 분과로 이루어져 있습니다. `find_value_tables()``value-table`항목을 포함하고 있습니다`[1, 2, 3, 4, 4]`그리고`evidence: "bytes"`- 그래

`grade_label``-O2`한 걸음 더 나아가죠.`labels`5개의 문자열 포인터의 배열이 5개의 32비트 오프셋의 테이블이 되었습니다`.rodata+0x0`. 각 항목에는 `R_X86_64_PC32`문자열 섹션에 대한 이전, 함수는 로드 항목에 테이블 주소를 추가합니다. `recover_table()`이 다섯 가지 이전과 반환의 대가를 `0, 2, 4, 6, 8``.rodata.str1.1`,`F``D``C``B`그리고`A`. 점프 테이블을 복구하는 같은 수학적 방법으로 상대적인 데이터 테이블을 복구합니다. 왜냐하면 둘 다 `S + A - P`알려진 한 대가로

두 빌드에서 배운 교훈은 바이트가 표시하는 것을 이름 붙이는 것입니다. 점프 테이블은 제어 흐름 그래프를 변경합니다. 값 테이블은 로드를 변경합니다. 둘 다 "스위치"라고 부르는 것은 수업 34에서 재구성해야 할 차이를 숨깁니다.

## 레아와 지드라가 당신에게 주는 것은

rea 6.5.0 과 Ghidra 12.1.4 제공자 는 에서 함수의 리스트 텍스트를 반환합니다`procedure_assembly`하나의 끈처럼`inspect_native_instruction`바이트, 길이, 디코더 텍스트, 오페란드 토큰, 입력된 참조 및 하나의 명령어의 흐름을 반환하며, 반환은 p 코드에서 분류됩니다. `xrefs`Ghidra's에서 분류된 고유의 소스 주소를 반환합니다 `ReferenceManager.getReferencesTo`-`analyze_function`CFG를 가지고 있고`body`함수의`procedure_info`이 기관은 포괄적인 범위로 보고 "공백과 공유된 꼬리는 소유된 바이트로 취급해서는 안 된다".

그 모든 사실들은 기드라의 재발적 계통과 그 분석기들이 연속화되어 있습니다.`instruction_flow_evidence``function_references`그리고`jump_table_evidence`따라서 결과 는 그 결과 를 만들어 낸 규칙 을 명명 한다. 그 결과 는 그 결과 를 보여주지 못한다. 그 결과 는 그 결과 를 보여주지 못한다. 그 결과 는 기드라가 테이블 을 찾지 못하면 흐름 이 "알지 않는다"고, 호출자, 호출자, CFG 에서 케이스 블록 이 없어진다.

이제 일을 해봐`python3 code/main.py cfg`같은 객체에서 블록 시작, 가장자리 계산, 그리고 복원 테이블을 제공자가 반환하는 것과 비교합니다. 그들이 동의하는 경우 두 개의 독립된 추리입니다. 그들이 다른 경우 당신은 특정 주소를 살펴보고 있습니다, 즉, 레슨 35가 알려지지 않은 것으로 기록하는 것입니다.

디코더에 대한 참고 프로그램. 캡스톤 6.0.0-알파10 (2026-07-21) 고정된 경계 밖에서 CVE-2026-55893 및 CVE-2026-55894 및 5.0.9 (2026-05-28) 백포트 CVE 수정 아래에서 읽고 작성합니다. 디코더는 작성하지 않은 바이트를 읽습니다. 15 바이트 제한, 단축 확인 `_Cursor.byte()`, 그리고 알려지지 않은 opscode 보호를 추측하는 거부`main.py`이 입력으로 만들어지지 않은

## 건설 해

디모를 실행하세요:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
```

출력은 JSON 보고서입니다. 각 고정 객체에 대해 오라클 협정을 제공합니다. 각 함수에 대해 세 가지 방법에 따라 명령, 블록 및 가장자리 수를 제공합니다. 또한 접근할 수없는 블록, 해결되지 않은 간접 점프, 뒷 가장자리, 즉각적인 지배자 및 모든 테이블을 나열합니다. 함정 비교로 끝납니다.

예상형:

```json
{
  "fixtures": {
    "ledger-x86_64-O0.o": {
      "oracle": "86/86 instructions agree with llvm-objdump",
      "functions": {
        "grade": {
          "range": "0x30-0xa6",
          "paddingBytes": 10,
          "linearSweep": {"instructions": 34, "blocks": 9, "edges": 7, "unreachableBlocks": ["0x76", "0x7f", "0x88", "0x91", "0xa6"], "...": "..."},
          "recursiveDescent": {"instructions": 25, "blocks": 3, "edges": 2, "unresolvedIndirectJumps": ["0x74"], "...": "..."},
          "recursiveDescentWithTables": {"instructions": 33, "blocks": 8, "edges": 11, "...": "..."},
          "tables": [{"kind": "jump-table", "table": ".rodata+0x0", "count": 5, "entries": ["0x91", "0x88", "0x7f", "0x76", "0x76"], "evidence": "relocation", "...": "..."}]
        }
      }
    }
  },
  "sweepTrap": {"...": "..."}
}
```

읽으세요`code/main.py`이 순서로:

1. `ElfObject`섹션 헤더, 상징, 그리고`.rela.*`항목 및`symbolize()`도로에 주소 이름을 붙여 `llvm-objdump`- 그렇죠
2. `Decoder.decode()`사전과 REX를 읽고, 1바이트 또는 2바이트의 오프코드 지도에 전송합니다.
3. `_State.modrm()`ModRM, SIB, 그리고 이동을 읽고 이동 현장 오프셋을 기록합니다.
4. `resolve_reference()`적용됩니다`S + A - P`이재 또는 직경 현장에 이재
5. `linear_sweep()`그리고`recursive_descent()`두 가지 방법, 각각의 실패가 기록되어 있습니다.
6. `recover_table()`그리고`jump_table_resolver()`테이블의 이전이나 바이트를 통해
7. `ControlFlowGraph`리더, 블록, 그리고 타이핑한 가장자리를 구축하고,`dominators()`이 알고리즘은 반복 알고리즘입니다.
8. `analyze_function()`모든 방법을 하나의 함수에 실행하고`compare_with_oracle()`디코더를 확인해

두 가지 명령이 더 있습니다.`python3 code/main.py disasm FILE.o`이식 대상과 함께 목록을 인쇄합니다.`python3 code/main.py cfg FILE.o FUNCTION`하나의 함수의 분석을 인쇄합니다.

## 사용 하 고

새로운 객체에 이 순서로 세 가지 방법을 사용하십시오.

1. 오라클 비교를 먼저 해봐`llvm-objdump`간단한 명령에 오류가 있고, 모든 후속 구조가 그것을 상속합니다.
2. 각 함수 기호에서 리커시브 다운로드를 실행하고 읽어보세요`unresolved`각 항목은 당신이 모르는 목표의 간접 점프 또는 호출입니다.
3. 해답 되지 않은 모든 점프에 대해 테이블 이디오스와 그 점프에 가리키는 이동을 찾아보세요. 이디오마가 일치하지 않는다면 점프 전에 바이트를 읽어보고 본 것을 적어 보세요. 이 노트는 수업 35에서 처음 알려지지 않은 노트입니다.
4. 스파이프와 다운바이트를 바이트에 비교해 보세요. 스파이프만 주장하는 바이트는 팩이나 데이터입니다. 어느 쪽도 주장하지 않는 바이트는 접근할 수 없습니다. 또는 당신이 찾지 않은 기능에 속합니다.
5. CFG를 내려가면서 복구된 테이블을 사용하여 만들어서 뒷면을 읽어보세요. 각각의 ループ은 34강이 될 ループ입니다.`while`또는`for`- 그래

오라클 텍스트 파일을 객체와 함께 보관합니다. 새로운 컴파일러 버전으로 이동하면 다시 캡처하십시오. 변경된 목록은 변경된 장치이기 때문입니다.

## 인터랙티브 연구소

### 연구소 A: 종이에서 해독하고 확인

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow/code
python3 -q
```

실행:

```python
from main import *
decode(bytes.fromhex("48 8d 0d 00 00 00 00"), 0).text
decode(bytes.fromhex("8d 44 08 fa"), 0).text
decode(bytes.fromhex("66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00"), 0).length
```

전화가 시작되기 전에 무엇을 기대하는지 적고,`48`첫 번째에서 오페란드 크기의 변화를 보시고`decode(bytes.fromhex("0f 0a"), 0)`그리고 읽으세요`DecodeError`- 그래

### 연구소 B: 이식

```python
elf = load_fixture("ledger-x86_64-O0.o")
code = elf.section(".text").data
lea = decode(code, 0x66)
lea.displacement_offset
resolve_reference(elf, lea)
```

참고 자료는`.rodata+0x0`주소를 변경하여`0x116``grade_label`그리고 참고서를 읽어보세요.`.data`그럼 `callq``0x10e`바로 현장으로 이동합니다`R_X86_64_PLT32 grade-0x4`, 그리고 해결된 목표는`0x30`, 즉`grade`- 그래

### 연구소 C: 두 가지 방법이 일치하지 않는 것을 관찰하십시오

```python
trap = load_fixture("sweep-trap.o")
text = trap.section(".text").data
[i.text for i in linear_sweep(text, 0, 0x20).instructions]
[i.text for i in recursive_descent(text, [0], 0x20).sorted_instructions()]
```

각 목록의 지침을 세우고 시작되는 목록을 찾아보세요`0x13`그러면 마지막 테이블 바이트를 입력하세요`sweep-trap.s``0x48` `0xe8`다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시 다시`addl`그리고`retq``callq`이 함수는 반환이 없는 것 같습니다.

### 연구소 D: 손으로 지배자

```python
analysis = analyze_function(load_fixture("ledger-x86_64-O1.o"), "total")
analysis.cfg.edges
analysis.cfg.reverse_postorder()
analysis.cfg.dominators()
analysis.cfg.back_edges()
```

5개의 블록을 종이 위에 그려서 결과를 보기 전에 지배자를 계산하고, 같은 4개의 줄을 실행합니다.`grade``-O0`그리고 왜 그런지 설명해 주세요`idom(0xa1)` `0x30`그리고 그렇지 않습니다`0x62`- 그래

## 연습 실험실

픽처에 간접 호출 위치를 추가하고 분석을 확장합니다.

요구 사항:

- 작은 배열에서 선택된 함수 포인터를 통해 호출하는 C 함수를 작성합니다.`-O0`그리고`-O1`그리고 그들의 물건과 함께 물건을 묶어`llvm-objdump`문자
- 두 개체에 있는 디코더와 오라클의 일치하도록 하여, 이 장치의 명령에 필요한 경우에만 오프코드를 추가하십시오.
- 확장`recursive_descent()`그래서 간접 호출은 호출 장소를 기록합니다`calls``None`목표물로 삼고 그 후에도 계속해 나가고 있습니다.
- 함수 포인터 배열을 이전을 통해 읽고 가능한 호출을 보고하는 해상자를 작성하십시오.
- 함수 보고서에 Callee 세트를 추가하여`indirectCalls`각각의 목표에 대한 증거 유형과 함께
- 해상자가 함수 상징이 아닌 목표를 반환할 때 실패하는 테스트를 작성하십시오.

성공이란`python3 code/main.py cfg`가능한 모든 호출자를 이름 붙여서 그 사실을 증명하는 이동을 하고, 오라클 비교는 여전히 모든 물체를 전달합니다.

## 교훈 유물

이 교훈은`outputs/skill-disassembly-and-control-flow.md`. 객체와 함수 이름을 체크된 목록, 블록, 타이핑한 가장자리, 지배자 및 모든 해결되지 않은 전송으로 변환하는 데 사용하십시오. 그것은 오라클 비교, 해체 방법, 바이트 회계, 복구 된 테이블에 대한 이동 증거 및 알려지지 않은 것을 설명해야합니다.

## 확인 해 보

데모와 결정적 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
python3 code/tests/test_main.py
```

검증은 다음과 같은 사실을 증명해야 합니다.

- 디코더가 동의합니다`llvm-objdump -d`4개의 고정된 물체의 모든 237개의 명령에
- REX.W는 64비트 오페란드를 선택하고 REX.R 및 REX.B는 레지스터 필드를 확장합니다
- 모드RM 및 SIB은 규모, 인덱스 및 서명된 이동을 포함한 AT&T 메모리 운영체제를 렌더링합니다.
- RIP에 대한 이동이 명령 안에 있는 필드 오프셋으로 기록됩니다.
- 반복된 레거시 프리픽스와 오라클과 같은 세그먼트 오버라이드 디코드
- 의무적인`66`사전은 SSE 오프코드를 선택하고 32비트 레지스터를 남겨줍니다
- 8비트 직속은 수학적 용도로 표시가 확장되고 시퀀스 계산에 서명되지 않습니다
- 15바이트 이상의 명령어, 줄여진 명령어, 그리고 알려지지 않은 오프코드 상승`DecodeError`
- `R_X86_64_PC32``lea`의결을 결정하고`R_X86_64_PLT32``call`소환자에게
- 스웨이 (sweep) 는 함정 테이블을 코드로 해독하고 점프 목표에 대한 지침이 없습니다.
- 내려오는 것은 테이블이나 을 주장하지 않고 읽습니다`addl $0x1, %eax`목표에
- `llvm-objdump`함정에 대한 휩쓸기와 같은 실수를 합니다.
- 명령어 안에 있는 항목은 충돌로 기록된다
- 해결되지 않은 간접 점프가 내려가기를 멈추고 목록에 나열됩니다
- `total``-O1`5개의 블록, 5개의 타이핑한 가장자리, 1개의 뒷 가장자리, 그리고 예상되는 즉각적인 지배자
- 루프로 손으로 만든 다이아몬드는 지배자에게 알고리즘을 정의합니다
- `total``-O2`두 개의 루프가 있습니다
- `grade``-O0`5개의 출입 테이블을 `.rela.rodata`목표 `0x91, 0x88, 0x7f, 0x76, 0x76`
- 테이블이 없는`grade``-O0`3개 블록과 1개의 풀리지 않은 점프
- `grade``-O1`그리고`-O2`값 테이블입니다`[1, 2, 3, 4, 4]`간접적인 점프가 없지
- `grade_label``-O2`5번의 이전을 통해 상대적인 문자열 테이블을 읽습니다
- 상호 작용적인 그림은 분석에서 생성되는 동일한 데이터를 포함합니다

## 생산 실패 모드

| Failure | What the weak tool reports | What the analysis must prove |
|---|---|---|
| Data inside `.text` | A plausible listing with every byte decoded | The descent claims no data byte and the jump target starts an instruction |
| Padding after the last return | A `nopw` instruction at the end of the function | The bytes are unreachable from the entry |
| Indirect jump through a table | "jmp rax" and four dead blocks | Table address from the `lea` relocation, entry count from the bounds check, targets from `.rela.rodata` |
| Switch turned into a value table | "a jump table with a relocation" | A `movl` load from `.rodata+0x14`, three blocks, no indirect transfer |
| Call with a zero displacement | `callq 0x113`, the next instruction | `R_X86_64_PLT32 grade-0x4` resolves to `0x30` |
| Decoder guesses an unknown opcode | A mnemonic that looks right | `DecodeError` with the address, and the sweep records the byte |
| Instruction longer than 15 bytes | A very long "instruction" | The cursor raises before reading byte 16 |
| Branch into the middle of an instruction | Two overlapping listings | A conflict record with both addresses |
| Loop reported as straight-line code | No `while` in the pseudocode | A back edge whose target dominates its source |
| Oracle captured from a different compiler | Tests pass on stale text | The fixture README names the exact compiler and command |

## 운영 규칙

오라클에 대한 해독, 알려진 항목에서 걷기 제어 흐름, 그리고 주장, , 데이터, 또는 도달할 수 없는 각 바이트를 설명. 이전 또는 표에서 간접 목표 각 복구 할 수 있습니다. 나머지 알 수 없습니다, 주소로 기록.

## 더 많은 읽기

- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 2, Chapter 2: Instruction Format](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [AMD64 Architecture Programmer's Manual Volume 3, Chapter 1: Instruction Encoding](https://docs.amd.com/v/u/en-US/24594_3.38_APM_Vol3_PUB)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Table 4.9: Relocation Types](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Schwarz, Debray, Andrews, "Disassembly of Executable Code Revisited" (WCRE 2002)](https://www2.cs.arizona.edu/~debray/Publications/disasm.pdf)
- [Andriesse et al., "An In-Depth Analysis of Disassembly on Full-Scale x86/x64 Binaries" (USENIX Security 2016)](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)
- [Allen, "Control Flow Analysis" (1970)](https://doi.org/10.1145/800028.808479)
- [Cooper, Harvey, Kennedy, "A Simple, Fast Dominance Algorithm" (2001)](https://www.cs.tufts.edu/~nr/cs257/archive/keith-cooper/dom14.pdf)
- [Lengauer, Tarjan, "A fast algorithm for finding dominators in a flowgraph" (1979)](https://doi.org/10.1145/357062.357071)
- [Capstone 6.0.0-Alpha10 release notes](https://github.com/capstone-engine/capstone/releases/tag/6.0.0-Alpha10)
-                         `3b79af2`이 교훈은 다음과 같이 설명합니다.`README.md``docs/ghidra-provider.md``docs/ghidra-dos.md``docs/reverse-engineering-tools.md``bridge/ghidra/ReaGhidraBridge.java``src/contracts/officialToolContracts.ts``src/ghidra/GhidraAnalysisProfile.ts`- 그래
