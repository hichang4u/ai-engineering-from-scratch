# 프로그램 해부학: 처음부터 ELF 리더

> 컴파일된 프로그램은 서로 지향하는 테이블의 집합입니다. 당신이 작성한 리더는 당신이 바이트에 따라 바이트를 확인할 수 있는 출력을 제공합니다.

**Type:** Build
**Languages:** Python (stdlib), C (fixture only)
**Prerequisites:** Phase 0 · 01 (Dev Environment) with clang installed, Python 3.10 or later, hexadecimal arithmetic
**Time:** ~120 minutes

## 학습 목표

- 이 트랙의 모든 목표에 대한 허가 규칙과 17 U.S.C. 1201 (f) 의 네 가지 제한을 명시하십시오.
- ELF 헤더, 섹션 헤더 테이블 및 두 문자열 테이블을 `struct.unpack`- 그래
- 해독`.symtab`항목 및`.rela`gABI와 x86-64 psABI의 이름을 가진 기록
- 이름 붙인 함수의 정확한 바이트를 반환하고, 모든 오프셋 파일을 소유한 구조로 지도하십시오.
- 프로그램 헤더를 읽고 가상 주소를 엽서로 오프셋한 파일로 매핑합니다`PT_LOAD`- 그래
- 마흐 오 객체의 로드 명령어를 읽어보고 각각의 ELF 아이디어에 해당하는 이름을 붙여주세요.

## 시작 하기 전: 허가 와 법

32~36강의 모든 목표가 당신이 작성하고 컴파일한 프로그램입니다.`code/fixtures/ledger.c`4개의 짧은 C 함수. 당신은 소스, 컴파일러 명령어, 그리고 생성된 객체 파일을 소유하고 있습니다. 읽을 수 있는 라이선스, 통과할 수 있는 보호, 그리고 코드를 열 수 있는 세 번째 당사자 없습니다. 트랙은 결코 소프트웨어 보호, 라이선스 확인, 또는 당신이 소유하지 않는 프로그램을 포함하지 않습니다.

이 규칙은 법이 해체하는 것을 복사하는 것과 같은 것이기 때문입니다. * 세가 엔터프라이즈 (Sega Enterprises Ltd) 에서 v. 아코lade, Inc.*, 977 F.2d 1510 (9th Cir. 1992년) 의 판결에 따르면, 해체 과정에서 만들어진 중간 복사본은 저작권법에 따라 복사본이다. 그 다음 이 법 은 "저작권 보호 를 받는 컴퓨터 프로그램 에 포함 된 아이디어 와 기능적 요소 를 해체 하는 것 이 유일한 방법 이 있고 그러한 접근 을 요청 하는 의 정당한 이유 가 있는 경우, 해체 는 저작권 보호 를 받는 저작물 의 공정한 사용 이 법 의 문제 로 간주 된다"고 판단 하였다.

두 번째 사건은 *소니 컴퓨터 엔터테인먼트, 인코네티스 코프와, 203 F.3d 596 (199년 9월 9일) 이다. 코네티스는 플레이스테이션 바이오스를 복사하여 에뮬레이터를 제작했으며 법원은 그 복사본을 공정한 사용으로 간주했다. 두 사건 모두 연구를 보호했다. 최종 제품에 복사된 코드를 보호하지 않았다.

두 가지 법령이 그 한계를 정하고 있습니다. 17 U.S.C. 1201 (f) 는 "컴퓨터 프로그램의 복사본을 사용 할 권리를 합법적으로 획득한" 사람이 "자립적으로 생성된 컴퓨터 프로그램의 다른 프로그램과의 상호 운용성을 달성하기 위해 필요한 프로그램의 요소들을 식별하고 분석하기 위한 유일한 목적으로 접근 통제를 회피할 수 있게 한다". 네 가지 제한 스택: 합법적인 복사본, 상호 운용성 목적, 이미 "물려서 사용할 수 없는" 요소 및 그렇지 않은 경우 위반되지 않는 분석. 1201 (f) 섹션은 피임 방지 규칙에 예외입니다. 복사 문제는 공정하게 사용되어야 합니다.

유럽 연합에서 2009/24/EC 조항 5 (??) (3) 는 연구를 포함합니다. 복사본을 사용할 권리를 가진 사람은 "프로그램의 어떤 요소에 기초하는 아이디어와 원칙을 결정하기 위해 프로그램의 기능을 관찰, 연구 또는 테스트 할 수 있습니다". 이 권리 는 프로그램을 로드, 표시, 실행, 전송 또는 저장하는 동안 적용됩니다.

제6조는 "자립적으로 만들어진 컴퓨터 프로그램의 상호 운용성을 달성하기 위해 필요한 정보를 얻는 것이 필수적"할 때 권리자의 허가 없이 복합을 허용합니다. 조건은 1201 (f) 에 일치한다. 라이센스 수급자는 그 행위들을 수행하고, 그 정보는 이미 쉽게 구할 수 없었고, 그 행위들은 필요한 부분 안에 남아 있다. 6  (2) 는 그 결과를 다른 목적이나 표현에 크게 유사한 프로그램에 사용하도록 금지합니다. 8조는 6조 또는 5조 (3) 에 반하는 계약 조건들을 무효로 한다.

| Source | What it allows | Conditions |
|---|---|---|
| 17 U.S.C. 1201(f) | Circumventing an access control to analyze a program | Lawful copy, interoperability purpose, information not readily available, no infringement |
| Directive 2009/24/EC Art. 5(3) | Observing, studying, and testing a running program | A right to use the copy, acts within normal loading and running |
| Directive 2009/24/EC Art. 6 | Decompilation | Licensee, interoperability purpose, information not readily available, confined to the needed parts |
| *Sega v. Accolade* | Disassembly as fair use | The only way to reach the ideas and functional elements, a legitimate reason |
| *Sony v. Connectix* | Intermediate copies during reverse engineering | A non-infringing final product |

이 메모는 법규와 의견에서 나온 것이며, 법률 자문이 아닙니다. 미래의 목표가 당신만의 것이 아니라면, 파일을 열기 전에 문서의 허가를 얻으시고 증거를 보관하십시오. 리버스 엔지니어링 101 수동서의 2.1 섹션에서는 전체 인용과 CJEU 사건들을 제공합니다.

## 문제

당신은 `ledger.c`그리고 도망쳤어요`llvm-objdump -t`객체에 출력 목록`percent_change`값에`0000000000000000`크기와 함께`0000000000000010`1768바이트 파일의 16바이트가 어떤 함수일까요?`R_X86_64_PC32 .rodata+0x10`이산화`0x36`이 파일의 4 바이트는 0입니다.`0x10`테이블이 시작될 때`0x14`- 그래요

rea는 `inspect_binary_layout`, 그리고 그 도구는 Linux x64에만 존재합니다. pwntools 4.15.0 뒤에 있습니다.`REA_PWNTOOLS_PYTHON`이 맥에서는 없죠`address_to_file_offset`Ghidra 세션과 SHA-256와 일치하는 오리지널 파일 바이트의 완전한 복사본이 필요합니다. `inspect_artifact`함수 안에 있는 내용을 길과 내용에 따라 나열합니다. 객체 파일 내의 테이블을 절대 열지 않습니다. 그래서 당신은 파이썬의 약 950 줄에 독자를 직접 작성합니다.`struct.unpack`그리고 의존도 없습니다. 테스트는 모든 테이블을`llvm-objdump`한 번 장착물에 담긴 텍스트

```figure
elf-byte-map
```

## 파일이 테이블 을 가리키는 테이블 이

시스템 V gABI, 4장, 그림 4-1, 한 파일의 두 개의 견해를 그리는 링크 뷰에는 ELF 헤더, 선택적 프로그램 헤더 테이블, 섹션 및 필요한 섹션 헤더 테이블이 있습니다. 실행 시선은 ELF 헤더, 요구되는 프로그램 헤더 테이블, 세그먼트 및 선택적인 섹션 헤더 테이블을 가지고 있습니다. gABI는 전체 독자를 지배하는 한 문장을 추가합니다. " 파일의 정해진 위치를 가진 ELF 헤더만 있습니다". 다른 구조물들은 다른 구조물에서 저장된 오프셋으로 발견됩니다.

gABI는 또한 스칼라 타입을 수정하고 "ELF는 비트 필드를 사용하지 않는다"고 말합니다. `Elf64_Addr`그리고`Elf64_Off`8 바이트입니다`Elf64_Half`2이 됩니다.`Elf64_Word`4이고`Elf64_Xword`x86-64 psABI, 섹션 4.1.1에 의해 요구됩니다.`ELFCLASS64``ELFDATA2LSB``e_machine` `EM_X86_64`(62) 및`e_flags`0. 고정 너비의 작은 은 평균`struct.unpack``<`전자판은 모든 기록을 한 번의 통화에서 읽습니다.

첫 64 바이트`ledger-x86_64-O1.o`이 부분의 본문은

```text
00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
00000010: 0100 3e00 0100 0000 0000 0000 0000 0000  ..>.............
00000020: 0000 0000 0000 0000 2804 0000 0000 0000  ........(.......
00000030: 0000 0000 4000 0000 0000 4000 0b00 0100  ....@.....@.....
```

그 내용을 GABI "ELF Header" 페이지에 올려보세요.`e_ident`16 바이트가 됩니다`7f 45 4c 46`(마법), 클래스 2 (64-비트), 데이터 1 (작은 엔디안), 버전 1, OS ABI 0 (시스템 V), 그리고 .

그럼`e_type` `0x0001` `ET_REL`, 이동 가능한 물체`e_machine` `0x003e`62입니다.`EM_X86_64`-`e_entry`0이므로 객체가 입점점이 없기 때문입니다.`e_phoff`객체가 프로그램 헤더가 없기 때문에 0입니다.`e_shoff` `0x428`, 섹션 헤더 테이블의 파일 오프셋. 마지막 줄은 `e_ehsize` `0x40``e_phentsize`0`e_phnum`0`e_shentsize` `0x40``e_shnum` `0x0b`(11개의 제목)`e_shstrndx` `0x0001`- 그래

독자는 그 줄을 하나의 호출으로 바꾸어:

```python
fields = struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
```

형식 문자열은 왼쪽에서 오른쪽으로 읽히는 gABI 인수입니다. 두 개의 반사문, 한 단어, 3 개의 8 바이트 값, 한 단어, 그리고 여섯 개의 반사문. 독자는 마법, 클래스 또는 바이트 순서가 다른 파일을 거부하고 거부합니다.`e_shentsize`또는`e_phentsize`64와 56이 아닌 값이 있는 값이 있습니다. 잘못된 너비는 모든 후속 오프셋이 잘못된 것을 만들어냅니다. 그래서 체크는 상단에 위치합니다.

## 섹션 헤더 및 두 개의 문자열 테이블

각 섹션 헤더는 `Elf64_Shdr`64 바이트의 (gABI 그림 4-8): `sh_name``sh_type``sh_flags``sh_addr``sh_offset``sh_size``sh_link``sh_info``sh_addralign`그리고`sh_entsize`. 형식 문자열은`<IIQQQQIIQQ`-`sh_name`이 부분의 지수는`e_shstrndx`이 객체에서`e_shstrndx`1이고, 그 섹션을 clang로 이름 붙여 `.strtab`, 그래서 하나의 테이블은 섹션 이름과 상징 이름 모두 제공 합니다.

리더는 -O1 객체의 11개의 헤더를 인쇄합니다.

```text
Idx Name             Type         Flags   Offset     Size       Addr Link Info Align
  0                  NULL                    0x0      0x0        0x0    0    0     0
  1 .strtab          STRTAB                0x368     0xbe        0x0    0    0     1
  2 .text            PROGBITS     AX        0x40     0x9f        0x0    0    0    16
  3 .rela.text       RELA         I        0x2a8     0x48        0x0   10    2     8
  4 .rodata          PROGBITS     A         0xe0     0x50        0x0    0    0     8
  5 .rela.rodata     RELA         I        0x2f0     0x78        0x0   10    4     8
  6 .rodata.str1.1   PROGBITS     AMS      0x130      0xa        0x0    0    0     1
  7 .comment         PROGBITS     MS       0x13a     0x2f        0x0    0    0     1
  8 .note.GNU-stack  PROGBITS              0x169      0x0        0x0    0    0     1
  9 .llvm_addrsig    LLVM_ADDRSIG E        0x368      0x0        0x0   10    0     1
 10 .symtab          SYMTAB                0x170    0x138        0x0    1    9     8
```

지수 0는 예약된 null 헤더입니다. `.text`파일 오프셋에서 159 바이트 코드를 포함합니다 `0x40`, 헤더 직후, 깃발이 `A`(기억으로 할당) 및`X`(실행가능)`.rodata`읽기 전용 데이터의 80바이트를 보유하고 있습니다. `.rodata.str1.1`5개의 라벨 문자열을 가지고 있습니다`F\0D\0C\0B\0A\0`, 10바이트, 깃발이 `M`(융합가능) 그리고`S`(줄)

`.comment`47바이트의 컴파일러 스탬프를 가지고 있습니다`\0Apple clang version 17.0.0 (clang-1700.6.3.2)\0`-`.llvm_addrsig`타입이 있습니다`0x6fff4c03`, OS 특수한 범위 내에서`SHT_LOOS` `SHT_HIOS`gABI의 예비역과 LLVM의`ELF.h`그 깃발이`E` `SHF_EXCLUDE`그래서 링커가 떨어뜨립니다.

`sh_link`그리고`sh_info`기둥은 테이블 사이의 포인터입니다. `.rela.text``sh_info`2 및`sh_link`10: 2부 를 수정하고 10부 에서 상징 을 취합니다.`.symtab``sh_link`1, 상징 이름의 문자열 테이블, 그리고 `sh_info`9, 첫 번째 비동포식 기호의 지표. `sh_addr`모든 행에 0이므로 객체가 아직 주소가 없습니다. 링크는 그들을 할당합니다.

두 개의 gABI 규칙은 독자가 파일의 완전한 지도를 그리도록 한다. 섹션은 "접근하고 초복되지 않는다"고, 파일은 "활동적이지 않은 공간을 포함할 수 있다". 독자는 모든 구조를 오프셋에 따라 분류하고 구멍을 채우며:

```text
     0x0 +64    header   ELF header
    0x40 +159   section  .text
    0xdf +1     gap      inactive space
    0xe0 +80    section  .rodata
   0x130 +10    section  .rodata.str1.1
   0x13a +47    section  .comment
   0x169 +7     gap      inactive space
   0x170 +312   section  .symtab
   0x2a8 +72    section  .rela.text
   0x2f0 +120   section  .rela.rodata
   0x368 +190   section  .strtab
   0x426 +2     gap      inactive space
   0x428 +704   table    section header table
```

3개의 격차는 총 10바이트이며, 각각의 격차는 조화를 이루고 있습니다.`.rodata``sh_addralign`8부터 시작하죠`0xe0`그보다는`0xdf`-`.symtab`7 바이트가 사용되지 않은 상태입니다`.comment`섹션 헤더 테이블 자체는 8에 맞게 되어 있습니다.

타입 섹션`SHT_NOBITS`이 파일의 바이트는 전혀 차지하지 않아서 지도는 그 바이트를 넘어서게 됩니다. 이 객체의 어떤 것도 그런 타입이 없습니다.`.bss`연결된 프로그램에서, 그리고 신뢰하는 독자`sh_size`그 파일은 지나고 있습니다.

## 상징: 결합, 유형, 섹션, 값, 크기

 `Elf64_Sym`24 바이트 (gABI 그림 4-18): `st_name``st_info``st_other``st_shndx``st_value``st_size`, 형식`<IBBHQQ`-`st_info`2개의 필드를 팩합니다. 높은 4 비트의 결합과 낮은 4 비트의 타입. gABI는 결합을 이름 낸다.`STB_LOCAL`0`STB_GLOBAL`1 ,`STB_WEAK`2 및 유형`STT_NOTYPE`0`STT_OBJECT`1 ,`STT_FUNC`2`STT_SECTION`3`STT_FILE`4.. 저 두 비트의`st_other`가시성을 유지하세요`STV_DEFAULT`여기 모두 0입니다.

```text
Idx            Value   Size Bind   Type    Section          Name
  0              0x0      0 LOCAL  NOTYPE  *UND*
  1              0x0      0 LOCAL  FILE    *ABS*            ledger.c
  2              0x0     20 LOCAL  OBJECT  .rodata          labels.rel
  3              0x0      0 LOCAL  SECTION .rodata          .rodata
  4              0x2      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.1
  5              0x4      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.2
  6              0x6      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.3
  7              0x8      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.4
  8              0x0      0 LOCAL  SECTION .rodata.str1.1   .rodata.str1.1
  9              0x0     16 GLOBAL FUNC    .text            percent_change
 10             0x10     46 GLOBAL FUNC    .text            grade
 11             0x40     31 GLOBAL FUNC    .text            total
 12             0x60     63 GLOBAL FUNC    .text            grade_label
```

지수 0는 정의되지 않은 상징으로 지정되어 있습니다. `st_shndx`3개의 예약된 값으로 기호를 정의하는 섹션의 이름을 지정합니다: `SHN_UNDEF`0`SHN_ABS` `0xfff1`파일 이름에 대해, 그리고`SHN_COMMON` `0xfff2`섹션 기호는 빈 이름입니다`llvm-objdump`각 부분의 이름을 인쇄하고 독자는 똑같이 합니다. gABI 규칙은 "STB_LOCAL 결합을 가진 모든 상징이 약한 및 글로벌 상징을 앞두고 있습니다"는 첫 9 줄으로 나타납니다.`.symtab`9년`sh_info`그 이유 때문에

이동 가능한 물체에`st_value`이 기호의 부분 안에 있는 오프셋입니다.`sh_addr`함수의 파일 오프셋은`sh_offset + st_value - sh_addr`, 그리고 그 길이는`st_size`이 부분의 본문은

```python
section = elf.sections[symbol.st_shndx]
file_offset = section.sh_offset + (symbol.st_value - section.sh_addr)
code = elf.data[file_offset : file_offset + symbol.st_size]
```

`percent_change`그게 바로`0x40 + 0`, 그리고 16 바이트는`85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`크기는 시작만큼이나 중요합니다.`grade``.text`이산`0x3e`2바이트`66 90`그 다음은`nop`컴파일러가 추가되어`total`시작됩니다`0x40`이 두 바이트는 어떤 상징에도 속하지 않습니다.`st_size`재건을 비교하기 전에 36강좌가 그들을 마스크합니다.

## 이전: 제로 바이트가 의미하는 바

 `Elf64_Rela`24 바이트 (gABI 그림 4-23): `r_offset``r_info`, 그리고 서명된`r_addend`, 형식`<QQq`- 가비가 갈라진다`r_info`2개의 매크로로: `ELF64_R_SYM(i)` `i >> 32`그리고`ELF64_R_TYPE(i)` `i & 0xffffffff`- 이식 가능한 파일`r_offset`테이블의 이름의 섹션 내부의 오프셋입니다`sh_info`. 타입 이름 및 공식은 x86-64 psABI, 표 4.9에서 나온다.`S`는 상징 값입니다.`A`추가 사항,`P`              `L`PLT 항목`R_X86_64_64` `S + A``R_X86_64_PC32` `S + A - P`그리고`R_X86_64_PLT32` `L + A - P`- 그래

-O1 객체는 8개의 기록이 있습니다.

```text
  .rela.text       0x36 R_X86_64_PC32          .rodata+0x10
  .rela.text       0x84 R_X86_64_PC32          .rodata+0x24
  .rela.text       0x93 R_X86_64_PC32          .rodata-0x4
  .rela.rodata      0x0 R_X86_64_PC32          .rodata.str1.1
  .rela.rodata      0x4 R_X86_64_PC32          .L.str.1+0x4
  .rela.rodata      0x8 R_X86_64_PC32          .L.str.2+0x8
  .rela.rodata      0xc R_X86_64_PC32          .L.str.3+0xc
  .rela.rodata     0x10 R_X86_64_PC32          .L.str.4+0x10
```

첫 번째를 떼어내라`0x36`내면에 있는`grade`, 그 범위는`0x10` `0x3e`. `0x33` `48 8d 0d 00 00 00 00`, a `lea`RIP에 대한 주소와 4 바이트 이동이 `0x36`. 프로세서는 다음 명령어 주소에 이 이동을 추가합니다.`0x3a`- 그래

컴파일러는 결과를 원합니다.`.rodata + 0x14`, 32비트 값의 5개의 입력 테이블`1, 2, 3, 4, 4`저장된 값은`(.rodata + 0x14) - 0x3a`. 공식`S + A - P``P = 0x36`주는`.rodata + A - 0x36`두 개의 값이 같을 때`A = 0x14 - 4 = 0x10`. 추가는 명령어 이동과 종료 사이의 4 바이트를 빼는 목표 오프셋을 가지고 있습니다.

이 표는 Clang이 `switch``grade`-O1에서 코드를 계산합니다`score / 10`곱하기 `0x66666667`그리고 두 차례, 6을 빼고 4과 비교하여 표를 지표합니다. -O1 ELF 객체는 표에 대한 상징이 없습니다. 참조는 섹션 상징입니다 `.rodata`추가로 추가된 이름과 같은 소스의 Arm64 빌드만 붙여줍니다`l_switch.table.grade`두 번째 기록은`0x84``grade_label`, 8 바이트 값의 두 번째 테이블에서 `.rodata + 0x28`세번째는`0x93`,`.rodata + 0x0`, 시작`labels.rel`- 그래

다섯 명`.rela.rodata`기록이 채워질 `labels.rel`각 항목은 오프셋에 위치합니다`4i`그리고 부가수를 얻습니다`4i`그래서`S + A - P`줄의 주소를 줄이고 테이블의 밑부분을 빼면 됩니다. `grade_label``movslq`, 테이블 기지를 다시 추가하고 포인터를 가지고 있습니다. 첫 번째 기록은 섹션 상징을 이름 냅니다`.rodata.str1.1`0을 추가로 추가하여 문자열이 `F`이 부분의 첫 바이트입니다. 다른 이름은`.L.str.1` `.L.str.4`, 컴파일러의 로컬 레이블`D``C``B`그리고`A`- 그래

동일한 소스는 세 가지 최적화 레벨에서 세 가지 다른 테이블로 컴파일합니다. 독자는 분해 장치 없이 차이를 보여줍니다:

| Build | Where `labels` lives | How `grade` selects | How `grade_label` reaches `grade` |
|---|---|---|---|
| -O0 | `.data`, five 8-byte pointers, five `R_X86_64_64` records | A jump table in `.rodata`: five `R_X86_64_PC32` records pointing into `.text` | A call with `R_X86_64_PLT32 grade-0x4` |
| -O1 | `.rodata` as `labels.rel`, five 32-bit relative entries | A value table at `.rodata+0x14`, one `R_X86_64_PC32` | Inlined, no call |
| -O2 | Same as -O1 | Same as -O1 | Inlined, `total` grows to 140 bytes |

-0에서`switch`5개의 항목이 다시 을 가리키는 실제 점프 테이블입니다.`.text``+0x91``+0x8c``+0x87``+0x82`그리고`+0x86`전화가`grade`같은 것을 가지고 있습니다`-0x4`이 과제 는`lea`-O1에서 최적화자는 모든 경우 상수를 반환하고 점프를 결과 테이블로 대체하는 것을 보았습니다.

## 프로그램 제목: 로더 의 견해

이동 가능한 객체는 프로그램 헤더가 없습니다.`e_phnum`실행 가능한 또는 공유된 객체가 가지고 있으며 로더는 다른 것을 읽지 않습니다.`Elf64_Phdr`56 바이트 (gABI 그림 5-1): `p_type``p_flags``p_offset``p_vaddr``p_paddr``p_filesz``p_memsz``p_align`, 형식`<IIQQQQQQ`GABI는 세 가지 규칙을 정합니다`PT_LOAD`엔트리, 상승하는 부분에서 나타납니다.`p_vaddr`순서, 그리고`p_memsz`보다 크다`p_filesz`0을 채우면 됩니다.`p_vaddr``p_offset`모두로`p_align`- 그래

이 트랙의 모든 목표물은 당신이 만든 프로그램입니다. 이 맥의 링크는 리눅스 실행 가능한`ledger.o`- 그래서 `tiny-x86_64``code/fixtures/build_tiny_elf.py`, 736바이트를 기록합니다`struct.pack`파일에는 ELF 헤더, 2개의 프로그램 헤더, 36바이트가 있습니다`_start`, 3바이트`.rodata`, 상징 표, 그리고 6개의 섹션 헤더.`_start`글쓰기`ok\n`리눅스 x86-64에서 실행됩니다. 여기서는 프로그램 헤더 경로의 고정입니다.

```text
Program headers:
  PT_LOAD          r-x offset=0x0 vaddr=0x400000 filesz=0x2e0 memsz=0x2e0 align=0x1000
  PT_GNU_STACK     rw- offset=0x0 vaddr=0x0 filesz=0x0 memsz=0x0 align=0x10

entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

싱글`PT_LOAD`전체 736 바이트 파일의 지도를 `0x400000`. 독자는 `PT_LOAD`그 안에 있는 컴퓨터와`p_offset + (address - p_vaddr)`입구점으로`0 + (0x4000b0 - 0x400000) = 0xb0`, 시작`.text`- 그래

이것은 Rea의 계산입니다`address_to_file_offset`지드라 목표물에 해당하는 도구가 돌아옵니다`{address, file_offset}`호퍼 공급자도 돌아왔다`provider_file_offset`그리고`image_base_file_offset`. 도구는 파일의 완전한 원본이 필요하며 그 복사본의 SHA-256은 목표와 일치해야 합니다.`inspect_binary_layout`"Linked address is not a runtime address"라는 줄을 추가합니다. 위치 독립된 실행 가능한 로드는 커널이 선택한 기지에 로드되며 파일 오프셋은 유일한 안정적인 좌표입니다.

프로그램 헤더는 또한 왜 제거된 실행 가능한 프로그램이 여전히 실행되는지 설명합니다. 링크는 섹션 헤더 테이블을 완전히 제거 할 수 있습니다.`e_shoff`이 도구는 어떤 부분을 지나가면 아무것도 보지 못합니다. 로더는 그것들을 보지 않습니다.

## 마흐오에서 같은 아이디어

애플은 Mach-O에 대한 프로사 사양을 발표하지 않습니다. XNU 소스의 헤더는 사양입니다: `EXTERNAL_HEADERS/mach-o/loader.h``nlist.h`그리고`reloc.h`- `ledger-arm64-O1.o`같은 것 같네요`ledger.c``clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables -c`- 그래

A`mach_header_64`32 바이트:`magic``cputype``cpusubtype``filetype``ncmds``sizeofcmds``flags``reserved`마법은`0xfeedfacf``MH_MAGIC_64`-`cputype` `0x0100000c``CPU_TYPE_ARM64`-`filetype`1이 됩니다.`MH_OBJECT`-`ncmds`5이 됩니다.`sizeofcmds`616: 로드 명령어는 헤더 다음의 616 바이트를 차지하고, 각 명령어는 `{cmd, cmdsize}`깃발`0x2000` `MH_SUBSECTIONS_VIA_SYMBOLS`- 그래

```text
Load commands:
  0 LC_SEGMENT_64                cmdsize=472 at 0x20
  1 LC_BUILD_VERSION             cmdsize=24 at 0x1f8
  2 LC_LINKER_OPTIMIZATION_HINT  cmdsize=16 at 0x210
  3 LC_SYMTAB                    cmdsize=24 at 0x220
  4 LC_DYSYMTAB                  cmdsize=80 at 0x238
```

`LC_SEGMENT_64`(0x19) 는 두 개의 ELF 테이블에 대한 Mach-O 답입니다.`segment_command_64``segname``vmaddr``vmsize``fileoff``filesize``maxprot``initprot``nsects`그리고`flags`- 그럼`nsects`유형 기록 `section_64`, 80바이트 각각, 같은 명령에 따라`loader.h``MH_OBJECT`이 부분들은 "그분 부지없이 이름 없는 한 부분"에 살고 있다고 합니다.`fileoff`648, `filesize`456개, 5개 섹션

```text
  Idx Section                    Addr   Size Offset Reloff Nreloc Type
    1 __TEXT,__text               0x0   0xd0    648   1104      6 S_REGULAR
    2 __DATA,__const             0xd0   0x28    856   1152      5 S_REGULAR
    3 __TEXT,__cstring           0xf8    0xa    896      0      0 S_CSTRING_LITERALS
    4 __TEXT,__const            0x108   0x40    912      0      0 S_REGULAR
    5 __LD,__compact_unwind     0x148   0x80    976   1192      4 S_REGULAR
```

각 섹션은 `segname`그래서 두 부문이 `__const`서로 다른 이유는`__DATA,__const`그리고 다른 `__TEXT,__const`이 지역은 각 구역으로 이동합니다`reloff`그리고`nreloc`, ELF가 별도의 `.rela.X`목표당 섹션

각각`relocation_info`8바이트입니다.`r_address`먼저 나오고, 다음으로 32비트 필드가`r_symbolnum`(24 비트)`r_pcrel`(1) `r_length`(2)`r_extern`(1) 및`r_type`(4) 여섯 가지`__text`기록은 3쌍입니다`ARM64_RELOC_PAGE21`그리고`ARM64_RELOC_PAGEOFF12`, 테이블 참조에 한 쌍.`adrp`더하기`add`한 사람 x86-64`lea`하지만, 각각의 참조는 두 개의 기록이 필요합니다.`__DATA,__const`기록은`ARM64_RELOC_UNSIGNED``r_length`3개, 그래서 각각 8바이트의 절대 포인터를 꽂습니다.

-O1에서 Arm64 빌딩이 유지되었습니다`labels`x86-64 빌드에서 상대 테이블을 만든

`LC_SYMTAB`(0x2) 를 유지합니다`symoff`1240년`nsyms`17년`stroff`1512년,`strsize`176과 1512+176은 1688입니다. 파일 크기가 각각`nlist_64`16 바이트:`n_strx``n_type``n_sect``n_desc``n_value`-`n_type`조금은 현장입니다.`N_TYPE`(마스크)`0x0e`) 에 해당한다`N_SECT`(`0xe`) 는 1 기반 순서값이 있는 섹션에서 정의된`n_sect`-`N_EXT`(`0x01`) 는 외부 상징을 나타냅니다.

`nlist_64`크기의 필드가 없습니다.`_percent_change`독자는 같은 섹션에서 다음 기호 주소를 선택합니다.`_grade``0x18`C호는 앞자리를 가지고 있습니다`_`여기, 함수는`_percent_change`- 그래

`LC_DYSYMTAB`(0xb) 에 에이플과 같은 지역적-첫 번째 규칙이 기록됩니다 `sh_info`이 책:`ilocalsym`0`nlocalsym`13, `iextdefsym`13, `nextdefsym`4..`LC_BUILD_VERSION`(0x32) 기록`platform`1 (macOS), `minos`26.0 및`sdk`26.2 포장된 대로`XXXX.YY.ZZ`전체자. 이 명령은 arm64 고정이 바이트로 설정되는 이유입니다. 다른 SDK를 가진 Mac에 빌드하면 다른 파일을 생성합니다.

독자의 `compare_formats`두 파일을 옆으로 배치합니다.

| Idea | ELF, `ledger-x86_64-O1.o` | Mach-O, `ledger-arm64-O1.o` |
|---|---|---|
| File identity | `e_ident` `7f 45 4c 46`, class 64, data LSB | `magic` `0xfeedfacf` |
| Machine | `e_machine` 62, `EM_X86_64` | `cputype` `0x100000c`, `CPU_TYPE_ARM64` |
| File kind | `e_type` 1, `ET_REL` | `filetype` 1, `MH_OBJECT` |
| Where the tables are | `e_shoff` `0x428`, 11 section headers | 5 load commands, 616 bytes after the header |
| The code | `.text` at `0x40`, size `0x9f`, flags `AX` | `__TEXT,__text` at 648, size `0xd0`, in the unnamed segment |
| Symbol names | `.symtab` (section 10), names in `.strtab` through `sh_link` 1 | `LC_SYMTAB` `symoff` 1240, `nsyms` 17, names at `stroff` 1512 |
| Symbol size | `st_size`: `percent_change` is 16 bytes | No field: next symbol minus this one, 24 bytes |
| Relocations | `.rela.text`, 3 records, `R_X86_64_PC32` | `__text` `reloff` 1104, 6 records, `PAGE21` and `PAGEOFF12` |
| Function bytes | `percent_change`: 16 bytes at `0x40` | `_percent_change`: 24 bytes at `0x288` |

rea는 Mach-O를 통해 읽습니다`inspect_macho`, 즉,`otool -h -l``nm -gjU``dyld_info -imports -exports`그리고`dwarfdump --uuid` `xcrun`독자는 그 중 어느 것도 필요하지 않고, 똑같은 것을 읽습니다.`symoff`그리고`stroff`그`otool -l`발자국`open_binary`REA의 도구는 마법 바이트에서 ELF, MZ, PE, 그리고 얇은 또는 보편적인 Mach-O를 감지합니다.`e_machine`이 파일은 헤더가 없는 파일로`format: raw-binary`기드라 공급자는 보편적 바이너리를 거부하고 얇은 조각을 요청합니다.`0xcafebabe`- 그래

## 건설 해

표준 도서관 리더를 실행하세요:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
```

데모는`ledger-x86_64-O1.o`그리고 헤더, 섹션, 상징, 이전 및 파일 오프셋 지도를 인쇄합니다.`ledger-arm64-O1.o`, 그리고 비교 테이블을 인쇄합니다.`tiny-x86_64`예상되는 라인:

```text
percent_change: 16 bytes at file offset 0x40: 85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3
grade: 46 bytes at file offset 0x50: 48 63 c7 48 69 c0 67 66 66 66 ...
entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

한 파일을 읽을 수 있는 경로를 통과하십시오: `python3 code/main.py code/fixtures/ledger-x86_64-O0.o`독자는 첫 4바이트에서 ELF 또는 Mach-O를 선택합니다.

읽으세요`code/main.py`이 순서로:

1. `ElfFile._read_header()`마법을 확인하고 클래스, 바이트 순서, 입력 크기를 확인하고 헤더를 풀습니다.
2. `ElfFile._read_sections()`그리고`read_cstring()`섹션 헤더 테이블을 읽어서 이름을 해결하세요`e_shstrndx`- 그래
3. `ElfFile._read_symbols()`분할`st_info`,  를 통해 이름을 해결합니다`sh_link`, 그리고 예약된 섹션 지수를 읽을 수 있도록 합니다.
4. `ElfFile._read_relocations()`모든 걸 걸어요`SHT_RELA`부문, 분할`r_info`, 그리고 표 4.9에서 이름의 유형
5. `ElfFile.function_span()`그리고`function_bytes()`이 기호를 파일 범위로 변환하고 그 안에 있는 바이트를
6. `ElfFile.file_offset_map()`모든 구조를 오프셋으로 분류하고 비활성 공간을 채우죠.
7. `ElfFile._read_program_headers()`그리고`address_to_file_offset()`실행 가능한 것을 처리합니다.
8. `MachOFile`헤더를 읽고, 로드 명령어를 읽습니다.`LC_SEGMENT_64`그 부분과 함께,`LC_SYMTAB``LC_BUILD_VERSION`, 그리고 각 구역으로 이전
9. `compare_formats()`두 파일의 값이 각각에서 읽혀진 동일한 아이디어를 붙여줍니다.

## 사용 하 고

`from main import ElfFile`이 수업을 더한 후`code``sys.path`33강습은 요구합니다`function_bytes`그리고`relocations_for(".text")`.35강은 관찰된 증거로 출력을 기록하고,36강은 바이트 비교 전에 매스킹을 할 수 있도록 이동 오프셋을 요구한다.

C를 같은 물체로 컴파일해`clang -target x86_64-unknown-linux-gnu -c`명령어 및 리더를 실행하십시오. x86-64 psABI 테이블 4.9에서 목록에 표시될 때만 이전 이름을 추가하십시오. gABI 또는 생성 도구 체인이 문서화 할 때만 섹션 유형을 추가하십시오. 리더가 이름없는 값을 충족하면 추측하는 대신 여섯십으로 숫자를 인쇄합니다.

## 인터랙티브 연구소

### 연구소 A: 헤더를 손으로

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/code
python3 -q
```

실행:

```python
import struct
from main import ElfFile, FIXTURES
data = (FIXTURES / "ledger-x86_64-O1.o").read_bytes()
data[:4], data[4], data[5]
struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
elf = ElfFile(data)
elf.header.e_shoff, elf.header.e_shnum, elf.sections[elf.header.e_shstrndx].name
```

튜플 쇼`e_type`1 ,`e_machine`62, 그리고`e_shoff`1064년, 즉`0x428`마지막 줄은 1부에서`.strtab`, 부문의 이름을 가지고 있습니다.

### 연구소 B: 스위치 뒤에 있는 값 테이블

```python
rodata = elf.section_bytes(elf.section(".rodata"))
[int.from_bytes(rodata[i : i + 4], "little") for i in range(0x14, 0x28, 4)]
[int.from_bytes(rodata[i : i + 8], "little") for i in range(0x28, 0x50, 8)]
[r for r in elf.relocations_for(".text") if r.symbol == ".rodata"]
```

두 테이블 모두 읽습니다`1, 2, 3, 4, 4`- 확인해봐`ledger.c`이 책:`grade(65)`계산기`65 / 10 - 6 = 0`그리고 입력값은 0이고, 1은 의 값입니다.`case 6`-`grade(100)`4번 항목이 되어 있는데, 4번값이 됩니다.`case 10`그리고`case 9`- 그래

### 연구소 C: 하나의 소스의 세 개의 빌드

```python
for level in ("O0", "O1", "O2"):
    obj = ElfFile.from_path(FIXTURES / f"ledger-x86_64-{level}.o")
    print(level, [s.name for s in obj.sections if s.name in (".data", ".rodata")])
    print(level, sorted({r.type_name for r in obj.relocations}))
    print(level, {s.name: s.st_size for s in obj.symbols if s.type == "FUNC"})
```

-O0 객체는 `.data`-O1 및 -O2 객체에는`.data`그리고 한 종류가 있습니다.`total`-O0에서 66바이트, -O1에서 31바이트, -O2에서 140바이트입니다.

### 연구소 D: Mach-O에서 동일한 함수

```python
from main import MachOFile
macho = MachOFile.from_path(FIXTURES / "ledger-arm64-O1.o")
[(c.name, c.cmdsize) for c in macho.load_commands]
macho.function_span("_percent_change")
macho.function_bytes("_percent_change")[:4].hex()
```

파일 오프셋 648에서 24 바이트의 스파인입니다. 첫 4 바이트는`a0000034`, 작은 의 형태를 `0x340000a0`,`llvm-objdump -d``cbz w0, 0x14`- 그게 바로`before == 0`, x86-64 빌드에서 `85 ff 74 09`- 그래

## 연습 실험실

리더를 연결된 프로그램으로 확장합니다. 리눅스 x86-64 기계에서,`clang -O1 -shared -fPIC code/fixtures/ledger.c -o libledger.so`그리고`clang -O1 code/fixtures/ledger.c -o ledger_main``main`두 개의 글자를 추가하고, 두 개의 글자를 실행합니다.

요구 사항:

- 읽으세요`.dynsym`같은 `Elf64_Sym``SHT_DYNSYM`11이 되고 기록은 변하지 않습니다.
- 읽으세요`.dynamic``Elf64_Dyn`기록`d_tag`그리고`d_val`, 그리고 이름`DT_NEEDED``DT_STRTAB``DT_SYMTAB``DT_RELA`그리고`DT_JMPREL`gABI "동동부" 페이지에서
- 정의되지 않은 기호들을 `st_shndx` `SHN_UNDEF`수입과`R_X86_64_JUMP_SLOT`기록`.rela.plt`전화 사이트로 그들을 찾아내는
- 모든 지도를`PT_LOAD`gABI 규칙을 사용하여 포함된 섹션으로 segment을 나누면 "물 파일 세그먼트는 하나 이상의 섹션이 포함됩니다".
- 증명해봐`address_to_file_offset`공유된 객체의 모든 정의된 함수의 바이트가 바이트라는 것을`function_bytes`돌아오는 것
- 포착`llvm-objdump -h -t -r -p`그리고`llvm-objdump -T`두 파일 모두 텍스트로 `code/fixtures/`독자를 시험에 비교해 보세요.

성공이란 수입 목록, 세그먼트 지도, 그리고 모든 함수 범위가 검출된 도구 출력과 일치한다는 것을 의미합니다. 테스트 중에 도구가 실행되지 않습니다.

## 교훈 유물

이 교훈은`outputs/skill-program-anatomy-elf-from-scratch.md`. 클로드, 커서, 코덱스, 오픈클라, 헤르메스 또는 SKILL.md를 읽는 다른 에이전트와 함께 사용하십시오. 이 기술은 사용자가 구성한 레이아웃 보고서로 컴파일 된 객체 또는 실행 가능한 것을 변환합니다. 보고서는 포착 된 도구 출력에 대한 모든 구조, 상징 및 이전 파일 범위를 제공합니다.

## 확인 해 보

데모와 결정적 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

스위트는 증명합니다.

- 각 섹션의 지표, 이름, 크기와 주소가 캡처된 것과 일치합니다`llvm-objdump -h`3개의 x86-64 객체와 작은 실행 가능한
- 모든 상징 값, 결합, 유형, 섹션, 크기와 이름이 캡처된 것과 일치합니다 `llvm-objdump -t`텍스트
- 모든 이동 오프셋, 타입 이름, 상징, 그리고 추가는 캡처된 것과 일치합니다`llvm-objdump -r`텍스트,`R_X86_64_PLT32`그리고`R_X86_64_64`-O0
- 두 가지 프로그램 리더`tiny-x86_64`포로가 된 것과 일치합니다`llvm-objdump -p`텍스트, 그리고 객체는 아무것도 없습니다
- `percent_change`파일 오프셋에서 16 바이트입니다`0x40`예상되는 바이트와 함께 모든 함수는 내부에 있습니다`.text`
- 파일 오프셋 지도는 모든 고정물의 모든 바이트를 한 번 덮고, -O1 객체의 세 개의 정렬 격차가 그 자리에 있습니다
- 의 입점점`tiny-x86_64`파일에 대한 지도를 오프셋`0xb0` `PT_LOAD`, 그리고 이동 가능한 객체는 주소 지도를 거부합니다
- 매치 오 헤더, 모든 로드 명령, 세그먼트, 다섯 섹션,`LC_SYMTAB`그리고`LC_BUILD_VERSION`포로가 된 것과 일치합니다`--private-headers`텍스트
- 마흐 오 기호와 15개의 이전은 포로가 된 것과 일치합니다`llvm-objdump`텍스트, 그리고`_percent_change`오프셋 648에서 24 바이트
- 잘못된 마법, 32비트 클래스, 빅엔디언 파일, 줄여진 테이블, 보편적 바이너리, C 소스 파일 모두 상승합니다.`FormatError`
- `build_tiny_elf.py``tiny-x86_64`바이트에 바이트
- 그림 모듈`site/figures-re-32.js`바이트의 정확한 바이트를 가지고 있습니다`ledger-x86_64-O1.o`

## 생산 실패 모드

| Failure | What the weak reading reports | What the reader must prove |
|---|---|---|
| `st_value` used as a file offset | "`percent_change` is at 0" | Offset is `sh_offset + st_value - sh_addr`, here `0x40` |
| Padding counted as code | "`grade` is 48 bytes" | `st_size` is 46 and the `66 90` after it belongs to no symbol |
| Section names read from the wrong table | Garbage names or an exception | `e_shstrndx` names the table, here section 1 |
| `sh_size` trusted for `SHT_NOBITS` | A read past the end of the file | `.bss` has no file bytes and the map skips it |
| Zero bytes read as the operand | "`lea 0(%rip)`" | The `.rela.text` record at `0x36` names `.rodata+0x10` |
| Addend read as the target offset | "the table starts at `0x10`" | `S + A - P` with the instruction end gives `0x14` |
| Sections walked on a stripped executable | "the file has no code" | `PT_LOAD` maps every address the loader uses |
| A linked address treated as a runtime address | A wrong offset under a random base | The file offset from `PT_LOAD` is the stable coordinate |
| A Mach-O section looked up by `sectname` alone | Two `__const` sections collapse into one | `segname,sectname` is the name |
| A size field expected in `nlist_64` | An exception or zero bytes | The next symbol in the same section ends the function |
| A universal binary read as one Mach-O | "magic `0xcafebabe` is unknown" | Refuse it and ask for a thinned slice |
| The arm64 object rebuilt on another Mac | "the fixture changed" | `LC_BUILD_VERSION` records the SDK, so the committed bytes are the fixture |

## 운영 규칙

신뢰할 수 있는 헤더를 읽어, 그 오프셋을 따라가며, 그것을 정의하는 사양에서 각 필드를 이름 붙여라. 당신이 비교한 도구 출력을 약속된 장치로 유지하십시오. 따라서 비교는 도구 없이 실행됩니다. 값이 사양에 이름이 없을 때, 숫자를 인쇄하십시오. 당신이 바이트에 바이트를 확인할 수 있는 독자는 모든 후속 수업이 구축하는 것입니다.

## 더 많은 읽기

- [System V gABI, chapter 4: Object Files](https://www.sco.com/developers/gabi/latest/ch4.intro.html)그리고[ELF Header](https://www.sco.com/developers/gabi/latest/ch4.eheader.html)[Sections](https://www.sco.com/developers/gabi/latest/ch4.sheader.html)[Symbol Table](https://www.sco.com/developers/gabi/latest/ch4.symtab.html)그리고[Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html)페이지
- [System V gABI, chapter 5: Program Header](https://www.sco.com/developers/gabi/latest/ch5.pheader.html)그리고[Dynamic Linking](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V ABI, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI), 테이블 4.9 이전 유형
- [Apple XNU `loader.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h)[`nlist.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h)그리고[`reloc.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/reloc.h)
- [17 U.S.C. 1201](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title17-section1201&num=0&edition=prelim)그리고[Directive 2009/24/EC](https://eur-lex.europa.eu/eli/dir/2009/24/oj/eng)
- [Sega v. Accolade, 977 F.2d 1510](https://law.resource.org/pub/us/case/reporter/F2/977/977.F2d.1510.92-15655.html)그리고[Sony v. Connectix, 203 F.3d 596](https://law.resource.org/pub/us/case/reporter/F3/203/203.F3d.596.99-15852.html)
- [rea 6.5.0 `docs/binary-diagnostics.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/binary-diagnostics.md)그리고[`docs/ghidra-provider.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
