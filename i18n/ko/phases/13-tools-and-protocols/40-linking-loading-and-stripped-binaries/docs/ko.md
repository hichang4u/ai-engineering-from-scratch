# 연결, 로딩 및 스트립 바이너리: PLT, GOT, 수입, 수정 및 함수 식별

> 연결된 프로그램은 포함되지 않은 함수를 호출합니다. 이 수업은 링크 편집자가 그 호출에 대해 작성한 테이블을 세 형식으로 읽으며, 로더가 채우는 슬롯에 한 번의 호출을 따라, 이름이 사라진 후에 빌드의 함수를 찾습니다.

**Type:** Build
**Languages:** Python, C, x86-64 and arm64 assembly
**Prerequisites:** Phase 13 · 32 (ELF from scratch), 33 (disassembly and control flow), 38 (calling conventions)
**Time:** ~160 minutes

## 학습 목표

- 이전 기록과 상징 표에서 링크 편집자가 그것을 어떻게 만드는지 결정하십시오. 고정된 거리가, GOT 슬롯이있는 PLT 항목 또는 동적 이전.
- 위치 독립 ELF 실행 가능한 역학 섹션, PLT 및 GOT를 읽고 psABI 공식으로 한 번의 호출을 따라가십시오.
- COFF 객체를 (20바이트 파일 헤더, 40바이트 섹션 항목, 18바이트 상징, 10바이트 이전) 및 PE32+ 이미지의 수입, 수출 및 기본 이전 디렉토리를 읽으십시오.
- 매치 오 체인 매치 오프 체인 해독을 단어에 단어로 해독하고`dyld_info`- 그래
- 어떻게 해야 하는지 알려주세요`strip`각각의 형식으로 남아있는 것을 제거하고, 그리고 제거된 프로그램을 실행하여 여전히 작동하는지 증명합니다.
-                                                                                                                                                                                                                                                                                                                                                                       `LC_FUNCTION_STARTS`, 선두 스캔, 그리고 호출 목표, 각각의 방법을 없는 쌍둥이의 상징 테이블에 점수를, FLIRT 모양의 서명으로 함수를 이름.

## 문제

연결해줬어`main.c`반대`libledger.dylib`그리고 어떤 기능을 하는지를 물었습니다.`main`전화`0x1000005a0`- 에이전트는 명령어를 해체하고 읽었습니다`bl 0x100000694`이 주소는 12바이트입니다`adrp x16``ldr x16, [x16, #0x38]``br x16`에이전트는 화물을 추적해`0x100004038`8바이트를 읽어봐`00 00 00 00 00 00 10 80`, 그리고 손상된 포인터를 통해 커널 공간에 전화를 신고했습니다.

그 다음, 같은 프로그램의 정적 빌드를 벗고 몇 개의 기능이 있는지 물어봤습니다.`nm`한 명만 봤어요`__mh_execute_header`그리고 한 가지 대답했습니다.

두 답은 모두 실행 과정처럼 파일을 읽습니다.`0x100004038`63 비트 는 bind, 12 비트 는 다음 fixup의 위치를 알려주고, 낮은 비트 는 어떤 수입을 bind 하는지를 알려줍니다.`_puts`이전`main`은 파일은 상징 표를 잃었고,`LC_FUNCTION_STARTS`, 5개의 함수를 모두 9바이트로 시작으로 나열합니다.

이 수업은 표준 라이브러리 파이썬에서 다섯 개의 리더를 구성합니다. 우리 자신의 객체에 대한 COFF 리더와 수입, 수출 및 기본 이전 디렉토리에 대한 PE32+ 리더. 로드 명령어, 줄기, 간접 상징 테이블, 체인된 수정 체인 및 수출 트리, 단어에 맞게 확인 된 말-O 리더`dyld_info`. 동적 섹션, PLT, GOT에 ELF 리더, 그리고 우리의 객체의 PIE 링크가 무엇을 만들지 말하는 플래너. 4 가지 방법과 각 점수를 가진 striped 빌드에 대한 함수 탐색기. 와일드카드 로컬로스 바이트와 꼬리의 CRC16를 가진 FLIRT 모양의 서명 빌더.

이 기계에 있는 Mach-O 연결은 오직 하나뿐입니다. arm64 실행형과 dylib는 연결, 벗겨지고 실행되었습니다. ELF 및 COFF 객체들은 여기에 `clang -target`, 그리고 ELF 또는 PE 링크 편집기가 설치되어 있지 않으므로, 이러한 형식의 두 개의 연결된 이미지는 고정 파일 폴더의 두 개의 파이썬 스크립트에서 스펙에서 바이트에 바이트로 작성되었습니다. `llvm-objdump`도서관 탐사도 마찬가지입니다. 실행되지 않았는데, 텍스트는 중요시하는 곳에 그렇게 말합니다.

```figure
re-40-call-through-three-formats
```

## 링크 편집자가 이전을 어떻게 하는지

32강좌에서 이전 기록과 33강좌에서 적용된`S + A - P`a`lea`- 기록은 장소의 이름을 붙여줍니다`P`, 타입, 상징`S`, 그리고 추가`A`. x86-64 psABI 표 4.9은 각 유형에 대한 공식 한 가지와 함께 `L`상징의 PLT 항목의 장소,`G`그 대가로 인하여`GOT`GOT 주소, 그리고`B`3개의 결과로 우리의 객체를 덮습니다.

링크 편집자는 값을 필드에 입력하고 기록이 사라집니다. `R_X86_64_PC32`입력값에서 정의된 기호에 대한 경우입니다. 한 이미지의 두 바이트 사이의 거리는 로드 주소가 무엇이든 변하지 않습니다.

링크 편집기는 PLT 항목과 GOT 슬롯을 만듭니다. `R_X86_64_PLT32`정의되지 않은 함수에 대한 경우입니다.`L + A - P`, 입구까지의 거리를, 입구가 슬롯을 뛰어넘는 거리를,`R_X86_64_JUMP_SLOT`기록`.rela.plt`동적 링크가 빈틈을 채우도록 지시합니다.

링크 편집기는 로더를 이동시키는 것을 유지합니다. `R_X86_64_64`8바이트의 절대 주소이며 위치 독립 실행 가능한 것은 로드 될 때까지 그 주소를 알지 못합니다. 기록은 `R_X86_64_RELATIVE`공식으로`B + A``.rela.dyn`- 그래

`main-x86_64-O1.o`18개의 기록이 있습니다. 14개의 기록이 있습니다.`.text`, 2인`.data.rel.ro`, 그리고 2개`.rodata`-`plan_dynamic_link()``code/main.py`이 세 가지 규칙은`ledger-x86_64-O1.o`이 부분의 본문은

| Record | Count | Decision | Why |
|---|---|---|---|
| `R_X86_64_PC32` to `.rodata`, `.L.str`, `fns`, the table in `.rodata` | 16 | in place | the symbol is defined in the inputs |
| `R_X86_64_PLT32` to `percent_change`, `grade`, `total`, `grade_label` | 4 | direct, no PLT | defined in `ledger-x86_64-O1.o`, so the link editor reduces PLT32 to PC32 |
| `R_X86_64_PLT32` to `puts` twice and `printf` twice | 4 | PLT entry and GOT slot | undefined, provided by a shared library |
| `R_X86_64_64` to `grade` in `fns[]` | 2 | `R_X86_64_RELATIVE` | an absolute field in a PIE |

두 개의 수입은`.plt`48 바이트 (PLT0 + 16의 두 항목) 의`.got.plt`40바이트 (예적된 슬롯 3개 더 2개)`.rela.plt`48 바이트의 두 상대적인 기록은`.rela.dyn`48바이트의 숫자는 우리의 기록에 적용된 스펙에서 나온다.`tiny-dyn-x86_64`이 계획의 PLT 부분을 동일한 두 수입에 적용하고, 그 크기는 계획과 일치합니다.

컴파일러는 이렇게 적습니다`PLT32`정의되거나 정의되지 않은 모든 호출에 대해, 2.31 (H.J. Lu, 2018-02-13) 및 LLVM 7.0.0 (D43383, 2018-02-20) 의 이중분기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기기`PLT32`따라서 객체에서 "콜"이 표시되고 PLT 항목이 존재할지 여부에 대해서는 아무 것도 말하지 않습니다. 다른 빌드에서 두 가지 유형이 나타납니다. `R_X86_64_GOTPCRELX`그리고`R_X86_64_REX_GOTPCRELX`(`G + GOT + A - P`) PLT 없이 GOT 슬롯을 요청합니다.`-fno-plt`생성하고 링크 편집자가 직접적으로 `lea`또는`call`기호가 로컬이 되면 (psABI 추가서 B). `R_X86_64_32`그리고`R_X86_64_32S`PIE에 주소를 저장할 수 없고 연결이 실패합니다.

## 동적 섹션, PLT, GOT

gABI 5장에서는 동적 연결에 참여하는 실행 가능한`PT_INTERP`로드 가능한 모든 세그먼트에 앞서야 하는 프로그램 헤더, 그리고 1 `PT_DYNAMIC`,`.dynamic`섹션. 섹션은 `Elf64_Dyn`쌍, 서명된 태그 및 값, `DT_NULL`- 그래

`tiny-dyn-x86_64`5184 바이트가 작성되었습니다`build_tiny_dyn_elf.py`가비와 psABI에서 나온다.`0x1000`이 부분의 본문은

| Tag | Number | Value | Meaning |
|---|---|---|---|
| `DT_NEEDED` | 1 | `libc.so.6` | a string table offset, `0xb`, the library to load |
| `DT_HASH` | 4 | `0x1a0` | the SysV hash table |
| `DT_STRTAB` | 5 | `0x188` | `.dynstr` |
| `DT_SYMTAB` | 6 | `0x140` | `.dynsym`, 24 bytes per entry |
| `DT_STRSZ` | 10 | `0x15` | 21 bytes of strings |
| `DT_SYMENT` | 11 | `0x18` | 24 |
| `DT_PLTGOT` | 3 | `0x10c0` | `.got.plt` |
| `DT_PLTRELSZ` | 2 | `0x30` | two 24-byte records |
| `DT_PLTREL` | 20 | 7 | the records are `DT_RELA` |
| `DT_JMPREL` | 23 | `0x1b8` | `.rela.plt` |
| `DT_FLAGS_1` | `0x6ffffffb` | `0x08000000` | `DF_1_PIE`, a GNU tag |
| `DT_NULL` | 0 | 0 | end |

왜 그런지`DT_JMPREL`이 로컬레이션 항목은 "제작 절차 연결 테이블에만 연관된 로컬레이션 항목의 주소를 저장합니다. 이 로컬레이션 항목을 분리하면, 빈부 결합이 가능하다면, 프로세스 초기화 중에 동적 링크가 그것들을 무시할 수 있습니다". `DF_BIND_NOW``DT_FLAGS``DF_1_NOW``DT_FLAGS_1`또는`LD_BIND_NOW`환경에서는 게으른 결합을 꺼내고 동적 링크러는 시작 시 처리합니다.

### PLT0 및 부착용 항목

psABI 섹션 5.2은 그림 5.2에서 두 가지 모양을 제공합니다. 여기 우리 파일의 바이트가 있습니다.

```text
     1f0: ff 35 d2 0e 00 00    pushq  0xed2(%rip)      # 0x10c8 = GOT+8
     1f6: ff 25 d4 0e 00 00    jmpq   *0xed4(%rip)     # 0x10d0 = GOT+16
     1fc: 0f 1f 40 00          nopl   (%rax)

     200: ff 25 d2 0e 00 00    jmpq   *0xed2(%rip)     # 0x10d8 = GOT+24, the slot for puts
     206: 68 00 00 00 00       pushq  $0x0             # index 0 into DT_JMPREL
     20b: e9 e0 ff ff ff       jmp    0x1f0            # PLT0
```

한 번 계산해 보세요. RIP의 상대적인 이동은 다음 명령에 상대적입니다. `0x1f6 + 0xed2 = 0x10c8`, 즉`.got.plt + 8`-`0x1fc + 0xed4 = 0x10d0`, 즉`.got.plt + 16`-`0x206 + 0xed2 = 0x10d8`, 네 번째 슬롯`0x210 - 0x20 = 0x1f0`각 항목은 16 바이트, 그래서 항목은 `exit`시작됩니다`0x210`, 밀어 `$0x1`, 그리고 읽습니다`0x10e0`- 그래

GOT는 세 개의 슬롯을 예약합니다. psABI 5.2: 입력 0은 `_DYNAMIC`, 그리고 "글로벌 오프셋 테이블의 1 및 2 항목도 예약되어 있습니다".`.got.plt`읽는다`0x1000, 0, 0, 0x206, 0x216`. glibc는 1번 슬롯을 채우며`struct link_map`그리고 2번 슬롯`_dl_runtime_resolve`파일 로드되면 3번 슬롯이 유지됩니다`0x206`이 파일은`pushq`내부`puts@plt`. psABI: "초기에 ... 다음 pushq 명령의 주소를 포함합니다".

그래서 첫 번째 전화가 실행됩니다`call 0x200``jmpq *0x10d8``pushq $0``jmp 0x1f0`GOT+8을 밀어내고 GOT+16을 통해  0의 기록을 읽는 해상자에 뛰어들게 됩니다.`DT_JMPREL``R_X86_64_JUMP_SLOT puts`, 보아`puts``libc.so.6`, 주소를 입력합니다`0x10d8`그리고 그 자리에 뛰어들게 되죠.`call``jmpq *0x10d8`드레퍼는 "첫 번째 호출을 제외한 모든 대용량 비용은 '만' 한 번 간접적으로 뛰어들었다"고 썼다.`%r11`레슨 38에서 한 레지스터 선택이 설명되는 것은 "PLT의 코드는 레지스터를 뱉어내지 않아도 되는" 스크래치 레지스터입니다.

전화 사이트`.text`읽는다`e8 d4 ff ff ff``0x227`그리고`0x22c - 0x2c = 0x200`-`llvm-objdump`발자국`callq 0x200 <puts@plt>`이 항목의 이름을 `.rela.plt`기록, 그리고 어떻게`plt_entries()`이름도 붙여주세요

### 파일에는 없는 것

파일에는 없습니다`PT_GNU_RELRO`. 자쿠브 제리네크는 2004-01-06에 RELRO를 이중용품 목록에 제안했습니다. 이중용품 목록에 2004-01-06에 RELRO를 제안했습니다. 이중용품 목록에 2004-01-06에 RELRO가 두 가지용품 목록에 포함된 것은 이중용용품 목록의 시작으로 이중용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용용`mprotect`그 후 독서만 가능하도록 합니다. GNU Id의 기본 스크립트는`.init_array``.fini_array``.data.rel.ro``.dynamic`그리고`.got`내부에 있고, 단지 3개의 예약된 슬롯을 보관합니다.`.got.plt`내부에 24바이트가 있는데 다른 슬롯은 게으른 글씨로 쓰여져 있습니다.`-z now`집합 `DF_BIND_NOW`그리고 전체를 움직인다`.got.plt`내부에 RELRO가 가득합니다. 왜냐하면 시작 후 아무것도 쓰이지 않기 때문입니다.`_dl_protect_relro`전화`mprotect(start, end - start, PROT_READ)`페이지에 맞춘 범위에서`-fno-plt`컴파일러 측면에서는 한 단계 더 나아갑니다. 호출은 통과합니다.`jmpq *name@GOTPCREL(%rip)`, 게으른 결합은 불가능하며, GCC의 설명서는 "모든 외부 상징은 로드 시점에 해결됩니다".라고 말합니다.

파일에는 버전 섹션도 없습니다.`libc.so.6`추가합니다`.gnu.version`1`Elfxx_Half`1`.dynsym`출입 및`.gnu.version_r`, a `Verneed`각 도서관에서`Vernaux`각 버전 이름에 대한 기록. `printf@GLIBC_2.2.5`수단: 의 입력`printf``.gnu.version`지수를 보유하고 있습니다.`Vernaux`누구의`vna_other`이 지수가 `vna_name`"GLIBC_2.2.5"에 해당하는`Verneed`누구의`vn_file`이 지수는 0이 로컬이고 1이 글로벌이고, 15이 비트 (`VERSYM_HIDDEN``0x8000`) 는 링크 편집기에서 버전을 숨깁니다.

해시 테이블은 SysV입니다`DT_HASH`한 바구니와 3개의 입력 체인, 24 바이트.`DT_HASH`또는`DT_GNU_HASH`이 파일은 아무것도 수출하지 않고 여기에 실행되지 않았기 때문에 glibc가 1 버킷 테이블을 받아들이는지 확인되지 않았습니다.

### .dynsym, .symtab, 그리고 strip

가비가 만들어내는`.dynsym`그리고`.dynstr`분할된 섹션 및`.symtab`그리고`.strtab`분배되지 않은 숫자. 동적 링크는 첫 번째 쌍을 읽으며 두 번째 쌍을 읽지 않습니다. 드레퍼: "정상적 기호 테이블은 실행 시간에 사용되지 않으므로 바이너리를 벗기는 필요가 없습니다. 그것은 성능에 영향을 미치지 않습니다".

GNU`strip --strip-all`제거합니다`.symtab``.strtab``.debug_*`그리고`.comment`. 각 분할된 섹션은:`.interp``.dynsym``.dynstr``.gnu.hash``.gnu.version*``.rela.dyn``.rela.plt``.plt``.text``.rodata``.eh_frame``.init_array``.dynamic``.got``.got.plt``.data``.bss`부문 헤더들은 당신이 추가하지 않는 한 계속 유지됩니다`--strip-section-headers`(부동물 2.41) 또는 실행`llvm-strip --strip-sections`-`--strip-debug`상징들을 보관합니다.`--only-keep-debug`디버그 파일을 작성합니다`--add-gnu-debuglink`                        `.gnu_debuglink`그리고`ld --build-id`글쓰기`.note.gnu.build-id`그래서 디버거가 둘 다 일치할 수 있습니다.

## COFF 객체

`clang -target x86_64-pc-windows-msvc -O1 -fno-asynchronous-unwind-tables -c`생산된`main-x86_64.obj`그리고`ledger-x86_64.obj`. PE 형식 페이지에서 객체를 정의합니다. 20 바이트 파일 헤더, 선택적 헤더가 없습니다. 40 바이트 항목의 섹션 테이블, 18 바이트 기록의 상징 테이블, 각 섹션에 대한 10 바이트 이전 기록.

`CoffObject``code/main.py`파일 헤더는 기계라고 합니다`0x8664`, 10개의 섹션, 37개의 상징 기록,`SizeOfOptionalHeader`0. 섹션 테이블 이름`.text``.data``.bss`, 6개의 섹션으로`.rdata`그리고`/16`. ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' '`/`문자열 테이블에 10번째로 오프셋된 값으로, 4바이트 크기로 시작된다.`/16``.llvm_addrsig`, 그게 이름입니다`llvm-objdump -h`발자국

37개의 기록에는 보조 기록이 포함되어 있습니다. 섹션 기호 (보장 클래스 3) 는 섹션 길이가, 이전 번호, 체크섬 및 COMDAT 선택이 포함된 것을 포함합니다.`.rdata`섹션에는 선택 2 "어떤 것"이 있으며, 각 문자열 문자열이 MSVC-가 잘못 된 이름 아래 있습니다.`??_C@_04JDDJEAHN@even?$AA@`이 문자열은 "even"입니다. 링크 편집기는 각 문자열의 한 장을 보관합니다. 마지막 기록은`.file`보조 기록 "main.c"로`llvm-objdump -t`이 글들을 이렇게 인쇄합니다`[ 0]``AUX scnlen ...``[ 2]`, 그리고 그 밖의, 보조 지수를 건너뛰고, 테스트는 우리의 지수와 이름 쌍을 그 텍스트와 비교합니다.

이전: 14 `IMAGE_REL_AMD64_REL32``.text`그리고 4`IMAGE_REL_AMD64_ADDR64``.rdata`-`REL32`이 위치가 이전된 다음의 바이트에서 32 비트 상대적 주소가 됩니다.`R_X86_64_PC32``-4`내장된: ELF 기록은 추가 `-4`기록에는 추가 필드가 있고 COFF 기록에는 없습니다. `ledger-x86_64.obj`3개`REL32``0x36``0x84`그리고`0x93`, 그리고 32번 강의`ledger-x86_64-O1.o`3개 `R_X86_64_PC32`같은 세 개의 오프셋을 사용하며, 코드는 동일하고, 포맷은 네 개의 글꼴만 다른 것입니다.`ADDR64`8바이트의 절대 주소입니다.`labels`문자열 포인터 테이블, 그리고 그것은 이미지의 기본 이동이 됩니다.`R_X86_64_64``R_X86_64_RELATIVE`- 그래

| | ELF `Elf64_Rela` | COFF relocation | Mach-O `relocation_info` |
|---|---|---|---|
| record size | 24 bytes | 10 bytes | 8 bytes |
| fields | offset, type and symbol in `r_info`, addend | offset, symbol index, type | address, then a 32-bit word with symbolnum:24, pcrel:1, length:2, extern:1, type:4 |
| addend | explicit | none, lives in the field | none, or an `ARM64_RELOC_ADDEND` record before the real one |
| the call to `puts` | `R_X86_64_PLT32 puts-0x4` | `IMAGE_REL_AMD64_REL32 puts` | `ARM64_RELOC_BRANCH26 _puts` |

## PE 이미지: 수입, 수출 및 기반 이전

`tiny-x86_64.exe`이 함수는 2 560 바이트입니다`build_tiny_pe.py`작은 ELF와 같은 역할을 합니다`puts`그리고`exit``msvcrt.dll`. 또한 하나의 이름을 수출하고 하나의 기지 이전을 수행합니다. 그래서 이 수업에 필요한 세 개의 디렉터리는 모두 있습니다. `pefile`2024.8.26 및`llvm-objdump -p`두 사람이 모두 읽었고, 두 사람이 모두 장착물입니다.

헤더를 따라가세요. MS-DOS의 줄기는`MZ`그리고 이산화`0x3c` `e_lfanew``0x40`- `0x40`서명`PE\0\0`. COFF 파일 헤더: 기계`0x8664`, 4부,`SizeOfOptionalHeader`240, 특징`0x22`(실행 가능한 이미지, 큰 주소 인식) 선택적 헤더는 `Magic`현장`0x20b`, 즉 PE32+`AddressOfEntryPoint` `0x1000``ImageBase` `0x140000000``SectionAlignment` `0x1000``FileAlignment` `0x200``SizeOfImage` `0x5000``Subsystem`3 (콘솔)`DllCharacteristics` `0x8160``HIGH_ENTROPY_VA 0x0020``DYNAMIC_BASE 0x0040``NX_COMPAT 0x0100`그리고`TERMINAL_SERVER_AWARE 0x8000`RVA와 크기의 16개의 데이터 디렉토리를 설정합니다.`0x2080`크기가`0x4d`, 수입`0x2000`크기가`0x28`, `0x4000`크기가`0xc`, IAT에서`0x2040`크기가`0x18`- 그래

이미지의 주소는 로드 베이스에서 오프셋 (overset) 을 나타내는 RVAs입니다. 섹션 테이블은 파일을 오프셋으로 매핑합니다.`.text`RVA `0x1000`파일에서`0x200``.rdata`RVA `0x2000``0x400``.data`RVA `0x3000``0x600``.reloc`RVA `0x4000``0x800`-`PeImage.rva_to_offset()`그 테이블입니다.

### 수입 목록

RVA에서`0x2000`20 바이트의 수입 설명서들이 0으로 끝나는 배열에 있습니다.`0x2028`, 시간표 0, 송신자 연쇄 0, 이름 `0x2068`, 수입 주소 테이블 `0x2040`. RVA 이름은 "msvcrt.dll"에 지점을 둔다. 검색 테이블에는 0으로 끝나는 64 비트 항목이 있습니다. 비트 63 집합은 순서대로 수입을 의미합니다. 순서로 15에서 0 비트에 있습니다. 비트 63은 명확하게 30에서 0 비트에 대한 의미입니다.`0x2058`(추적이 0, "쓰는") 및 `0x2060`(힌트 0, "출출")

스펙은 IAT가 "이입 검색 테이블의 내용과 동일한 것"이라고 말합니다.`0x2040`같은 두 RVA를 가지고 있고, 테스트는 24 바이트가`0x2028`24 바이트와 같을 수 있습니다`0x2040`. "부인 중, 수입 주소 테이블의 항목은 수입되는 상징의 32 비트 (PE32) 또는 64 비트 (PE32+) 주소로 덮여집니다". 윈도우 로더는 입력 포인트가 실행되기 전에 그렇게 합니다. 게으른 결합과 줄기가 없습니다. 코드는 슬롯에 직접 도달합니다:

```text
    100b: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1011 + 0x102f = 0x2040, the IAT slot of puts
    1013: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1019 + 0x102f = 0x2048, the IAT slot of exit
```

`FF /2`이 두 명령어는 동일한 바이트를 가지고 있습니다. 왜냐하면 각각 8 바이트 다음으로 앉아 있고, 8 바이트 다음으로 슬롯을 읽기 때문입니다.`iat_calls()``ff 15`, 6과 이동을 더하고 수입 디렉토리에서 슬롯을 이름 붙인다.

### 수출 목록

RVA에서`0x2080`40 바이트의 수출 디렉토리 테이블: 플래그, 타임 스탬프, 버전, "tiny-x86_64.exe"를 가리키는 RVA 이름, 정규기 1, 주소 테이블 항목 1, 이름 포인터. 다음에는 세 개의 테이블이 있습니다.`0x20a8`1개의 RVA를 보유하고 있습니다.`0x1000`. 수출 이름 지표 테이블`0x20ac`"tiny_entry" 문자열에 한 RVA를 포함합니다.`0x20b0`16비트 무방향 지수를 가진 0. 이름 `k`입력 주소 지도 `ordinals[k]`, 그리고 수출된 순서표는`ordinals[k] + ordinal base`.특정에는 우리가 사용하지 않는 규칙이 추가됩니다. 수출 섹션 내부에 지점을 둔 주소 항목은 `MYDLL.expfunc`, 그리고 이름 포인터 테이블은 "다음 검색을 허용하기 위해 렉시컬 순서로 순서로 되어 있습니다".

### 기반 이전

`.reloc`블록을 포함합니다. 각 블록은 페이지 RVA와 블록 크기로 시작됩니다. 다음 16 비트 항목은 위의 4 비트에서 타입과 낮은 12 페이지에서 페이지 오프셋을 포함합니다. 우리의 한 블록: 페이지`0x3000`, 크기가 12 , 항목`0xa000`, 10형`IMAGE_REL_BASED_DIR64`, 오프셋 0 및 타입 0의 기 항목`IMAGE_REL_BASED_ABSOLUTE`RVA에서 8바이트`0x3000`         `0x1400020d0`, 이미지 베이스 + 문자열의 RVA "손으로 연결된다". 로더가 이미지를 다른 곳에 배치하면 그 필드에 차이를 추가합니다. 스펙: " 이미지 파일에는 COFF 이전 내용이 없습니다 ... 이미지에는 .reloc 섹션에서 기본 이전 형태로 이전 정보가 포함되어 있습니다 (이 이미지가 IMAGE_FILE_RELOCS_STRIPPED 속성을 가지고 있지 않은 한) "`/DYNAMICBASE`현재 link.exe에서 기본적으로 활성화되어 있으므로 이미지가 `.reloc`그리고`DYNAMIC_BASE`- 그래

PE 이미지는 별다른 상징 표를 가지고 있지 않습니다. 파일 헤더는`PointerToSymbolTable`" COFF 디버깅 정보가 구약되었기 때문에 이미지에 대해 0이어야 합니다". 그리고 이름들은 별도의 PDB에 있습니다.`.pdata`,`RUNTIME_FUNCTION`항목은 스택을 할당하거나 다른 함수를 호출하는 모든 함수의 시작과 끝을 지정합니다.

## 마흐 오 이미지: 로드 명령어, 스터브, 그리고 간접 상징 테이블

`ledger_main`연결된 arm64 실행가능함입니다.`otool -h`19 로드 명령과 깃발을 인쇄합니다 `0x00200085`-`MH_NOUNDEFS 0x1``MH_DYLDLINK 0x4``MH_TWOLEVEL 0x80`그리고`MH_PIE 0x200000`19개의 명령은 4개입니다`LC_SEGMENT_64`(`__PAGEZERO``__TEXT``__DATA_CONST``__LINKEDIT`), 두 `LC_LOAD_DYLIB`(`@rpath/libledger.dylib`그럼`/usr/lib/libSystem.B.dylib`), 그리고 각각 1개`LC_DYLD_CHAINED_FIXUPS``LC_DYLD_EXPORTS_TRIE``LC_SYMTAB``LC_DYSYMTAB``LC_LOAD_DYLINKER``LC_UUID``LC_BUILD_VERSION``LC_SOURCE_VERSION``LC_MAIN``LC_RPATH``LC_FUNCTION_STARTS``LC_DATA_IN_CODE`그리고`LC_CODE_SIGNATURE`-`MachoFile.command_names()`같은 순서로 같은 목록을 반환합니다.`otool -l`- 그래

`__TEXT`시작됩니다`0x100000000`-`__text`256 바이트입니다`0x100000558``main`다른 것은 아닙니다. 왜냐하면 4개의 레저 기능들이 딜리브에 있기 때문입니다.`__stubs`84 바이트입니다`0x100000658`, 12바이트의 7개의 덩어리`__DATA_CONST`시작됩니다`0x100004000``__got`, 64 바이트, 8개의 섹션 타입의 포인터 슬롯`S_NON_LAZY_SYMBOL_POINTERS`그리고`__const`, 32 바이트,`fns[]`그리고`names[]``main.c`- 그래

### 한 줄기, 손으로

에 대한 `_puts``0x100000694`이 부분의 본문은

```text
    30 00 00 90    adrp x16, 0x100004000
    10 1e 40 f9    ldr  x16, [x16, #0x38]
    00 02 1f d6    br   x16
```

`0x90000030` `adrp`- 레지스터는 5비트, 16비트입니다`immlo`30에서 29까지의 비트입니다.`immhi`23배트에서 5배트까지,`immhi << 2 | immlo = 4`, 4,096 바이트의 페이지에서, 그래서 목표 페이지는 명령 페이지입니다,`0x100000000`, 더하기`0x4000`-`0xf9401e10` `ldr`8으로 확장된 12비트 오프셋이 서명되지 않은 경우: 21비트에서 10이 7이고, 8이`0x38`, 그래서 로드가 읽습니다`0x100004038`-`0xd61f0200` `br x16`ID64의 소스의 Arm64 덩어리는 정확히 3개의 명령입니다`StubAtom`- 그래

이 슬롯의 이름은 간접적인 상징 테이블에서 나온다.`LC_DYSYMTAB`15개의 지표에 있는 지점을 상징 표에 넣습니다.`reserved1`지수 순위가 시작되는 곳과`reserved2`각 줄기 크기는 (12) 포인터 섹션에서 사용 됩니다`reserved1`그리고 슬롯당 8바이트`__stubs`지표 0에서 시작됩니다.`__got`지표 7에서 5 지도를 표시하여 기호 표 항목 10에 `_puts`, 그리고 7번 슬롯`__got`같은 항목에 있는 지도. `otool -Iv`두 개의 샷을 찍고,`indirect_table()`모든 줄을 재생합니다.

### 2 레벨 이름 공간

`nm -m`발자국`(undefined) external _puts (from libSystem)`그리고`(undefined) external _grade (from libledger)`도서관은 상징 기록 자체로부터 나온다.`nlist.h`정의합니다`GET_LIBRARY_ORDINAL(n_desc)`15~8 bit의`n_desc`1번의 첫 번째`LC_LOAD_DYLIB`, 2번은 2번,`0xfe`역동적인 검색을 위해,`0xff`실행 가능한 것`ld(1)`: " -two_levelnamespace (전설) 를 사용하면 링크는 명령 줄에 있는 릴리브를 검색하여 어떤 릴리브가 발견되었는지 기록합니다". `nm_lines()`12개의 음반을 `n_type``n_sect``n_desc`그리고`n_value`, 그리고 테스트는 그 출력선을 포착된 라인과 비교합니다 `nm -m` 연결해`-Wl,-flat_namespace`그리고 읽으세요`otool -h``MH_TWOLEVEL`조금 사라져

## 체인된 수정, 바이트 대 바이트

`LC_DYLD_CHAINED_FIXUPS``linkedit_data_command`이 책:`dataoff 0x8000``datasize 208`208 바이트가 다음으로`fixup-chains.h`- 그래

헤더는 7개의 32비트 필드입니다.`fixups_version 0``starts_offset 32``imports_offset 80``symbols_offset 112``imports_count 8``imports_format 1`(`DYLD_CHAINED_IMPORT`), `symbols_format 0`(부단한)`llvm-objdump --macho --chained-fixups`이 7가지 값을 인쇄하고 테스트를 통해 비교합니다.

32번의 오프셋에서`dyld_chained_starts_in_image`이 책:`seg_count 4`그리고 4개의 오프셋, 각 세그먼트마다 1개, 정렬 없이 0개`__DATA_CONST`한 가지 있습니다.`dyld_chained_starts_in_segment`읽는다`size 24``page_size 0x4000``pointer_format 6`(`DYLD_CHAINED_PTR_64_OFFSET`, "목적은 vm 오프셋"),`segment_offset 0x4000``max_valid_pointer 0``page_count 1`그리고 한`page_start`0의`DYLD_CHAINED_PTR_START_NONE``0xffff`, 즉, 엉망이 없는 페이지가 될 것입니다.

체인은 파일 오프셋에서 시작됩니다`0x4000 + 0`64비트 단어마다 두가지가 있습니다. 무엇을 써야 하는지, 다음 단어의 위치를 알려주는 것이죠.

```text
  dyld_chained_ptr_64_bind    ordinal:24  addend:8  reserved:19  next:12  bind:1 = 1
  dyld_chained_ptr_64_rebase  target:36   high8:8   reserved:7   next:12  bind:1 = 0
```

첫 단어를 읽어봐`0x8010000000000000`63 bit 설정, `next`62에서 51까지의 비트입니다.`0x002`, 4 바이트의 단위로, 다음 수정은 8 바이트입니다. 순위자는 0.`0x4058``0x00000000000006db`63점, 리베이스`next`0은 연쇄의 끝입니다.`0x6db`, vm 오프셋, 그리고 이미지 베이스`0x100000000`이럴 수 있어요`0x1000006db`, " Odd "라는 문자열을 입력합니다`__cstring`그 단어 앞에 있는 단어`0x00100000000006d6`, 리베스`names[0]`"평등"으로

이 도보는 12개의 단어를 방문합니다. 8개의 단어들이 결합됩니다.`__got`0에서 7까지의 정렬을 가진 두 개의 결합`__const`0 (두 개의 항목)`fns[]``_grade`), 그리고 `names[]`-`chained_fixups()`파일 오프셋과 원자 단어와 함께 반환하고 테스트는 12을 비교합니다 `(offset, raw)``dyld_info -fixup_chain_details`, 인쇄하는`raw: 0x8010000000000000 bind: (next: 002, bindOrdinal: 0x000000)`첫 번째

오프셋 80의 수입 테이블에는 8개의 32비트 항목이 있습니다.`lib_ordinal:8``weak_import:1``name_offset:23`, 오프셋 112에 이름을 붙인 경우 0에서 3까지의 정규값은`_grade``_grade_label``_percent_change``_total`도서관 1번과 4번에서 7번까지`___stack_chk_fail``___stack_chk_guard``_printf``_puts`도서관 2`fixup_rows()`2개의 테이블을 선으로 연결합니다`dyld_info -fixups``__DATA_CONST __got 0x100004038 bind libSystem/_puts`, 그리고 테스트는 모두 12개와 비교합니다.

그래서 "부정된 지표"는`0x100004038`이 함수는 7을 가져오면, DYLD는 이 연쇄를 한 번 로드하면,`_puts`슬롯으로 들어가 애플의 WWDC22 세션에서 이렇게 표현했습니다. "DATA의 64비트 포인터 위치에서, 일부 비트에는 다음 수정 위치로 오프셋이 포함되어 있습니다. 또한, 수정이 bind 또는 rebase인지 알려주는 비트도 포함되어 있습니다". Xcode 13은 MacOS 12 또는 iOS 15의 배포 목표의 기본 형식을 만들었습니다. Xcode 13.3는 MacOS 11 및 iOS 13.4까지 확장했습니다. 이 형식에는 게으른 결합이 없습니다. 모든 슬롯은 앞면으로 묶여 있습니다`main`달리는 것

### 이 배열은

`ledger_main_nochain``-Wl,-no_fixup_chains`- 그래요`LC_DYLD_INFO_ONLY`대신, 4 바이트 코딩 테이블: 8 바이트 리베이스, 72, 게으른 바이트 120, 수출 64. 또한 사슬 파일의 3 섹션이 부족합니다: `__TEXT,__stub_helper`(108 바이트), a`__got`16바이트만 보유한`___stack_chk_guard`그리고`dyld_stub_binder`그리고`__DATA,__la_symbol_ptr`(56바이트, 7개의 슬롯)`dyld_info -fixups`7개의 목록`lazy-bind`7개의 줄과 7개의 기둥이 각각의 게으른 슬롯을 자신의 트램폴린에 가리키고 있습니다`__stub_helper`트램폴린은 지표를 밀어내고 다`dyld_stub_binder`, 즉 이전 섹션의 PLT와 GOT가 Mach-O 모양으로 되어 있습니다.`__la_symbol_ptr` `.got.plt``__stub_helper`PLT0이고`pushq $index`그리고`dyld_stub_binder` `_dl_runtime_resolve`-`code/main.py`이 파일의 오프셋과 섹션에 대해 보고하고 bind 오프코드를 해독하지 않습니다.

### 수출의 경우

`LC_DYLD_EXPORTS_TRIE`각 노드는 uleb128 터미널 크기가 있고, 만약 0이 아닌 경우 uleb128 플래그와 uleb128 오프셋이 있고, 1 바이트의 자식 카운트, 그리고 각 아이에게는 문자열 가장자리와 uleb128 노드 오프셋이 있습니다.`exports_trie()`걸고 있어`libledger.dylib`돌아옵니다`_percent_change 0x410``_grade 0x428``_total 0x464``_grade_label 0x498`, 네 개의 타율`dyld_info -exports`발자국, 실행형에 다시`__mh_execute_header``_fns`그리고`_main`- 그래

## 어떤 줄기 가

애플의`strip(1)`동적으로 연결된 실행형에 옵션이 없으므로 `-u -r`: 정의되지 않은 상징과 동적으로 참조된 상징을 저장합니다. `-x`지역 상징들을 제거합니다. `-N`전체 기호 테이블과 문자열 테이블을 제거합니다. "동적 공유 라이브러리에서는 최대 stripping 레벨은 일반적으로 -x"입니다. "동적 링크 프로세스에서 글로벌 기호만 사용됩니다".

우리 장비에서 관찰되었습니다.`strip ledger_main``LC_SYMTAB`12개에서 10개까지 기록하고 삭제되었습니다`_main``_fns`그리고`_names`8개의 불분정 수입은 남아있기 때문에, DILD은 그들의 이름을 묶어야 하기 때문에,`__mh_execute_header`   `REFERENCED_DYNAMICALLY`10번째 기록은 일종의 찔러진 작품입니다`N_OPT`이름`radr://5614542`, 애플의 도구가 작성하는 테이블은 결코 빈하지 않습니다.`nm`프로그램은 원래와 같은 3 줄을 인쇄하고 0을 출력합니다.`LC_FUNCTION_STARTS`아직 시작은 한 번만`main`- 그래

`strip libledger.dylib`선택의 여지가 없는 한, 남자 페이지의 일반적인 것보다 더 멀리 갔습니다.`-x`이 책:`LC_SYMTAB`0개의 기록이 있고`nm`"시호가 없다"를 인쇄합니다. 수출 트리는 여전히 같은 오프셋에서 네 가지 함수를 나열합니다. 왜냐하면 DYLD는 트리를 통해 결합하고 결코 잇지 않기 때문입니다.`LC_SYMTAB`-`LC_FUNCTION_STARTS`아직 4개의 시작을 기록하고 있습니다.`main.c`리브를 벗고 리브를 리브도 리브에 의해 링크 편집자가 서비스되는 것을 보여주기 위해서

| What | ELF after `--strip-all` | PE image | Mach-O after `strip` |
|---|---|---|---|
| static symbol table | gone | never present in an image | local and defined names gone, undefined imports stay |
| names the loader binds | `.dynsym` and `.dynstr` stay | import directory stays | imports stay in `LC_SYMTAB` and in the chained imports table |
| exported names | `.dynsym` stays | export directory stays | exports trie stays |
| function starts | `.eh_frame` FDEs, unless built without unwind tables | `.pdata` for non-leaf functions | `LC_FUNCTION_STARTS` stays |
| debug information | `.debug_*` gone | in the PDB, never in the image | in the dSYM, never in the image |
| section or load command headers | stay unless `--strip-section-headers` | stay | stay |

## 상징 없이 함수 를 찾는 것

`static-arm64-O2`링크`main-arm64-O2.o`그리고`ledger-arm64-O2.o`5개의 함수를 가진 하나의 실행 가능한`__text`-`nm -n`은 파일의 기본 진실입니다`_main``0x100000500`(244 바이트), `_percent_change``0x1000005f4`(24), `_grade``0x10000060c`(60), `_total``0x100000648`(248), `_grade_label``0x100000740`(72) `static-arm64-O2.stripped``N_SECT`내부의 상징`__text`-`FunctionFinder`4가지 방법을 적용하고`score()`모든 목록을 진실과 비교합니다.

### LC_FUNCTION_STARTS

명령 포인트는 9 바이트에 있습니다`__LINKEDIT`이 책:`80 0a f4 01 18 3c f8 01 00`. 형식은 Uleb128 델타스입니다.`__TEXT`주소`80 0a` `0x500`첫 시작은`0x100000500`-`f4 01` `0xf4`그래서`0x1000005f4`-`18`주는`0x10000060c``3c`주는`0x100000648``f8 01`주는`0x100000740`그리고`00`5개 중 5개, 거짓 긍정적이진 않습니다.`-O0`그리고`-O2`링크 편집자는 이 테이블을 기기 및 충돌 기자를 위해 작성합니다.`strip`기드라는 "Mach-O 기능이 시작된다"라는 분석기에서 읽습니다.`dyld_info -function_starts`인쇄하고 LIEF는 그것을 노출합니다`function_starts`- 그래

### 초고판 스캔

지드라의 AARCH64 시작 패턴은 시작됩니다`fd 7b bf a9`, 즉`stp x29, x30, [sp, #-0x10]!`우리 파일에서 2 레벨에서 5의 0을 찾습니다`sub sp, sp, #N`먼저 그리고 나서`stp x29, x30, [sp, #M]`양성적인 오프셋을 가지고 있기 때문에, 사전 지표 형태는 결코 발생하지 않습니다.`sub sp, sp, #imm``(word & 0xff0003ff) == 0xd10003ff`, 5에서 5을 찾습니다`-O0`, 각 함수가 프레임을 가지고 있고, 5에서 1은`-O2`, 어디`percent_change``grade``total`그리고`grade_label``percent_change``cbz w0, ...`.프로로그 스캔에서 컴파일러가 어떤 것을 배포하기로 결정했는지 보고하고, 수업 38에서는 그것이 얼마나 자주 아무것도 아니라는 것을 보여주었습니다.

이 스캔 중 어느 것도 잘못된 긍정을 생성하지 않았습니다. 왜냐하면 프로그램은 작기 때문입니다. x86-64와 같은 1 바이트 패턴`55``push rbp`다른 명령어 안에 넣는 것입니다. 그래서 지드라의 x86-64 패턴 파일은`55 48 89 e5``ret`또는`nop`그 이전 기능이 끝나야 합니다.

### 전화 대상

모든`bl``__text`함수의 시작을 이름 붙여줍니다.`bl`함수의 중간에 C를 위해 컴파일러가 방출하지 않는 것이 있습니다.`0x94000000`26비트 단어 중립을 위한 서명`bl``0x1000005a0`읽는다`3d 00 00 94`이 책:`0x3d`61, 4 곱하기`0xf4`, 그래서 목표가`0x100000694`- 내`ledger_main`이 은`_puts`. 정적 구조에서,`call_targets()`내부에서 목표물을 수집합니다`__text`, 내륙하는 사람들을 떨어뜨립니다`__stubs`, 그리고 `LC_MAIN`입구, 아무것도 전화하지 않기 때문에`main`. 두 레벨에서 다섯 중 다섯. 핵 (Andriesse, Slowinska, Bos, 2017) 은 컴파일러 생성 코드 이념에 따라 함수 탐지 기능을 구축하고 있으며, 안드리세와 다른 사람들은 2016 년에 함수 경계가 명령 경계에 비해 더 어려운 해체 부분이라는 것을 측정했습니다.

## FLIRT 모양 의 서명

헤크스 레이스는 문서에서 FLIRT를 설명합니다. 패턴은 "모든 변형 바이트가 표시되는 함수의 첫 32 바이트", 변형 바이트는 고정과 외부 참조에서 비롯되며, 패턴은 나무에 살고 있으며, 패턴을 넘어 "우리는 33 위치에서 시작하여 첫 변형 바이트까지 바이트의 CRC16를 계산하고 그 길이를 저장합니다". 같은 패턴과 CRC를 가진 두 함수는 서로 다른 위치에 있는 꼬리 바이트에 의해 분리되며, 그 다음에는 그들이 참조하는 이름에 의해 구분됩니다. 아무것도 분리하지 않는 충돌은 "자연적 지능으로 해결된다". 외부 참조 없이 4바이트보다 짧은 함수는 제외되며, "서명 파일은 원래 라이브러리에서 바이트를 포함하지 않습니다. 함수의 이름을 제외하고는".

`signatures_from_object()`이 을`ledger-arm64-O2.o`그리고`main-arm64-O2.o`, 플라이어가 도서관의 물건들을 이용해 만든 방식`relocation_info`기록은 4바이트의 단어를 포함하고, 그 바이트는 변이가 됩니다.`.pat`리진의 파서에서 기록된 라인 레이아웃은 패턴, CRC 길, CRC16 함수 길,`:0000`그리고 이름, 그리고`^offset name`각 참조된 이름에 대해:

```text
A00000342800004B890C8052087D091B000DC01AC0035FD6 00 0000 0018 :0000 _percent_change
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 003C :0000 _grade ^0000 l_switch.table.grade ^0001 l_switch.table.grade
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 0048 :0000 _grade_label ^0000 l_switch.table.grade_label ^0001 l_switch.table.grade_label ^0002 _labels ^0003 _labels
```

`_percent_change`이 함수는 24 바이트이고, 그 패턴은 전체 함수이고, CRC 길이는 0입니다.`_grade`이 시점은 60바이트로 처음 36바이트로 이전한 후 4바이트를 커버하는 CRC입니다.`.pat`파서 사용: 다항 `0x8408`, 초기 값`0xffff`, 보충, 그리고 두 바이트를 교환. ASCII 문자열 "123456789"의 값은 `0x6e90`, 그리고 테스트 핀을

`match_signatures()`                  `-O0`모든 5개의 함수는 이름을 얻는데, 아무 것도 충돌하지 않습니다.`-O2`위의 두 선이 충돌합니다.`grade_label``grade`, 즉 두 함수는 첫 36 바이트와 4 개의 CRC 바이트를 공유합니다.`0x10000060c`그리고`0x100000740`꼬리는 44바이트에서 그들을 갈라놓습니다`_grade``20`그리고`_grade_label``28`, 즉`ldr w0, [x9, w8, uxtw #2]`반대`ldr x8, [x9, w8, uxtw #3]`이 보고서는 충돌과 그 결정의 바이트를 기록하고 있습니다.

시험`test_object_bytes_equal_linked_bytes_outside_relocated_words`전제를 확인합니다. 각 객체 함수의 모든 비변형 바이트는 링크된 실행 가능한 동일한 오프셋에서 바이트와 같습니다. 따라서 링크 편집기는 이전 된 단어만 변경했습니다. `_total`이전도 없고 변종도 없습니다.

### 같은 아이디어로 도구가 무엇을 하는지

IDA Pro 9.4는 프로세서별 FLIRT 서명과`sigmake`이를 만드는 도구; IDA Free는 x86 및 x86-64만을 포함하고 비상용 용도로 사용된다. Lumina는 함수의 md5로 함수 메타데이터를 키하고 32 바이트 이하의 함수를 건너뛰는 서버입니다. 기드라 12.1.4 (Apache-2.0) 는 함수 ID를 가지고 있습니다. mnemonics 및 어드레싱 모드를 통해 "연결으로 인한 변경에 대한 견고하다"는 전체 해시와 일치하는 명령에 따라 점수를 얻은 상수 오페란드를 추가하는 특정 해시, 부모와 자녀 기능이 넥타이 브레이커로; 전송된 데이터베이스는 비주얼 스튜디오 라이브러리를 만 포함하고, 당신은 자신의 바이너리를 채집합니다. 바이너리 닌자 6.0 크립턴 (상용, 무료 버전) 은 WARP (Apache-2.0) 를 사용합니다: 함수 GUID는 기본 블록 GUID에 대한 UUIDv5이며, 각각의 UUIDv5는 블록 바이트에 대한 UUIDv5입니다. "모든 이전 가능한 명령어"를 제로화하고 NOP를 떨어뜨린 후 호출, 호출자 및 인접 함수와 함께 제한됩니다. BinDiff 8 (Apache-2.0) 는 두 개의 바이너리 사이의 함수를 일치시켜 단계의 고정 순서를 가지고 있습니다. 하시 일치에서 흐름 그래프 MD 지표에 의해 순서 일치라고 부르는 것까지, 일치한 가장자리, 블록, 명령어 및 흐름 그래프 MD 지표에서 유사성을 중량합니다. 디아포라 3.4.3 (AGPL-3.0, IDA만) 는 작은 프라이브 수를 추가합니다. 여기서 각 mnemonic는 프라이브에 지도를 그리며 함수가 제품이며, 순서 없는 멀티셋 손가락 표기입니다. 라다레2 6.2.4 (LGPL-3.0) 는 지호 (`zg``z/``zb`) 와 FLIRT `.sig``zfs`; 리진 0.9.1 (LGPL-3.0) 는 생성합니다 `.pat`또는`.sig``Fc`그리고 1을 적용합니다`Fs`- 그래

IDA와 바이너리 닌자는 닫혀 있으며 문서에서 설명되어 있습니다. 이 기계에 라다레2와 리진이 설치되어 있지 않으며, 그들의 명령은 그들의 책과 출처에서 인용됩니다. 이 장치에서 실행된 도구는`clang``ld``llvm-objdump``otool``nm``strip`그리고`dyld_info`이 조사를 통해 명령 줄 도구와 LIEF 1.0.0, pyelftools 0.33, 그리고 프로필 2024.8.26에서 확인합니다. LIEF는 0.17.0 이후 지원한 COFF 객체를 포함하여 모든 형식을 읽으며 10개의 결합과 2개의 리베이스를보고했습니다.`ledger_main`, 같은 12 개 수정. 필프툴은 ELF 파일만 읽습니다. 프로파일 거절`main-x86_64.obj``PEFormatError: 'DOS Header magic not found.'`그리고 작은 이미지를 읽어보세요.

## 건설 해

디모를 실행하세요:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
```

출력은 5개의 부분으로 이루어진 JSON 보고서입니다. `elf`두 개체의 이전 번호, 링크 계획 및 동적 섹션, PLT 및 GOT를 보유하고 있습니다 `tiny-dyn-x86_64`-`coff`두 개체의 섹션, 이전, 기능 및 정의되지 않은 이름을 가지고 있습니다. `pe`                                                  `tiny-x86_64.exe`-`macho` `ledger_main`                         `ledger_main_nochain`, 델리브, 그리고 두 개의 스트립 보고서`identification`4가지 방법과 점수를 가진 진실과 충돌한 서명`-O0`그리고`-O2`- 그래

예상형:

```json
{
  "elf": {"linkPlan": {"pltSymbols": ["puts", "printf"], "sizes": {".plt": 48, ".got.plt": 40, ".rela.plt": 48, ".rela.dyn": 48}, "...": "..."}, "tiny-dyn-x86_64": {"...": "..."}},
  "coff": {"main-x86_64.obj": {"...": "..."}},
  "pe": {"imports": [{"dll": "msvcrt.dll", "iat": "0x2040", "...": "..."}], "...": "..."},
  "macho": {"ledger_main": {"flags": "0x200085", "fixupRows": ["__DATA_CONST __got 0x100004000 bind libledger/_grade", "..."], "...": "..."}, "strip": {"...": "..."}},
  "identification": {"O2": {"methods": {"functionStarts": {"recall": "5/5"}, "prologueSub": {"recall": "1/5"}, "...": "..."}, "correctNames": 5}}
}
```

읽으세요`code/main.py`이 순서로:

1. `ElfFile`헤더, 섹션, 상징 표, 이전을 모두 읽습니다.`dynamic_entries()``jump_slots()``plt_entries()`그리고`plt0()`연결된 이미지를 읽어보세요.
2. `plan_dynamic_link()`이전 가능한 물체의 이전 기록에 대한 표 4.9 및 5.2 섹션에 적용됩니다.
3. `CoffObject`파일 헤더, 섹션 테이블, 보조 기록과 함께 18 바이트의 상징과 10 바이트의 이전을 읽습니다.
4. `PeImage`MS-DOS 스터브, PE 서명, 선택적 헤더, 데이터 디렉토리, 섹션, 그리고 수입, 수출 및 기본 이전 디렉토리 등을 읽습니다.`iat_calls()` 디코드`ff 15`- 그래
5. `MachoFile`로드 명령어, 세그먼트를 읽습니다.`nlist`기록, 간접 기호 테이블, 톱, 체인 수정, 수출 트리, 객체 이전
6. `FunctionFinder`4개의 시작 검색을 실행합니다`score()`모든 것을 진실과 비교합니다.
7. `signatures_from_object()`그리고`match_signatures()`FLIRT 모양의 서명들을 만들고 적용합니다.
8. `parse_*`함수는 테스트에서 비교되는 캡처 된 도구 텍스트를 읽습니다.

더 많은 명령:`python3 code/main.py elf FILE``coff FILE``pe FILE`그리고`macho FILE`1개의 보고서를 인쇄하세요.`python3 code/main.py plan OBJECT...`ELF 객체 집합에 대한 연결 플랜을 인쇄합니다. `python3 code/main.py functions STRIPPED UNSTRIPPED OBJECT...`다른 두 개의 자신의 빌드에서 발견자와 서명을 점수를합니다.

## 사용 하 고

여러분이 만든 프로그램에서 이런 순서로 독자를 사용하세요.

1. 헤더 를 읽어보고, 그 형식 과 그 종류 를 이름: 이전 할 수 있는 객체, 실행 할 수 있는 객체, 공유 할 수 있는 라이브러리. 독자는 모르는 것을 거부하고, 그 거부는 정보입니다.
2. 수입을 제공자와 함께 나열하라`DT_NEEDED`그리고`.dynsym`, 수입 목록 또는 체인 수입 테이블`LC_LOAD_DYLIB`그 목록에 있는 이름에 대한 모든 호출은 이미지가 사라집니다.
3. 한 번의 호출을 손으로 그 슬롯으로 따라가십시오. 호출 바이트, 스터브 또는 PLT 바이트, 슬롯 주소, 파일의 단어, 그리고 로더가 거기에 작성하는 것을 적어 보십시오. 파일의 단어가 쓰레기처럼 보이면, 쓰레기라고 부르기 전에 수정으로 해독하십시오.
4. 상징 표와 수출을 비교하면 함수가 시작됩니다. 로더가 필요로 하는 이름들이 생존합니다 `strip`디버거가 필요한 이름만 없습니다. 실종된 이름의 그룹이 어느 그룹에 속했는지 말해 주세요.
5. 형형형에서, 형형에 대한 형을 실행하고 형형형에 대한 형을 실행하면 됩니다. 형형형형은 형형형으로 만들어집니다.`LC_FUNCTION_STARTS``.pdata`또는`.eh_frame`, 바이트 패턴을 넘어서,
6. 네 개체에서 서명들을 만들고 적용해라. 모든 충돌과 그것을 나눈 바이트를 기록해라. 두 서명이 주장한 이름은 꼬리나 참조된 이름이 결정하기 전까지는 알려지지 않습니다.

포착된 도구 텍스트를 파일과 함께 보관하십시오. 도구 사슬이 변경되면, 다시 포착하십시오. 변경된 목록은 변경된 장치이기 때문입니다.

## 인터랙티브 연구소

### 연구소 A: 손으로 PLT

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code
python3 -q
```

실행:

```python
from main import *
elf = load_elf("tiny-dyn-x86_64")
[(e.tag_name, e.text) for e in elf.dynamic_entries()]
elf.plt0()
[(e.symbol, hex(e.address), hex(e.slot), hex(e.slot_initial)) for e in elf.plt_entries()]
[hex(w) for w in elf.got_plt_words()]
```

각 호출 전에 위의 텍스트의 바이트에서 응답을 계산하고 변경합니다.`IMPORTS``build_tiny_dyn_elf.py`3개의 이름을 붙이고, 재건하고, 새로운 크기를 예측합니다.`.plt``.got.plt`그리고`.rela.plt`당신이 읽기 전에

### 연구소 B: 한 개의 연쇄 된 수리

```python
exe = load_macho("ledger_main")
stub = next(s for s in exe.stubs() if s.symbol == "_puts")
stub.lines()
raw = int.from_bytes(exe.read(stub.slot, 8), "little")
hex(raw), raw >> 63, (raw >> 51) & 0xfff, raw & 0xffffff
[(i.index, i.name, i.library) for i in exe.chained_fixups()["imports"]]
```

먼저 종이 위에 bind 단어를 해독하세요.`next`4 바이트의 단위로 순위형을 표시합니다. 다음 8 바이트의 단어를 더 읽어보고 다음 수정임을 확인합니다.`0x100004058`그리고 그 이유를 설명해 주세요`next`0이 됩니다.

### 연구소 C:  strip 및 relink

장착 장치 디렉토리에서 새로운 프로그램을 완전히 벗은 릴리브에 연결하십시오.

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code/fixtures
clang -target arm64-apple-macos -O1 main.c -L. -lledger.stripped -Wl,-rpath,@executable_path -o /tmp/relinked
nm /tmp/relinked | grep ' U '
dyld_info -exports libledger.stripped.dylib
```

이 링크는 도서관에서 성공합니다`LC_SYMTAB`링크 편집기가 수출 트리를 읽기 때문에 빈 상태입니다.`python3 ../main.py macho libledger.stripped.dylib`그리고 비교`symtab``exports`그리고`functionStarts`그리고 정적 구조를 벗겨라`-N`대신 무슨 일이 일어나는지 보자`dyld_info -function_starts`아직 지문입니다.

### 연구소 D: 충돌

```python
from main import *
stripped = load_macho("static-arm64-O2.stripped")
sigs = signatures_from_object(load_macho("ledger-arm64-O2.o"))
[s.pat_line() for s in sigs]
starts = FunctionFinder(stripped).function_starts()
match_signatures(sigs, stripped, starts)
```

두 충돌 기록을 읽어보고`ledger-arm64-O0.o`, 그들을 상대합니다`static-arm64-O0.stripped`, 그리고 `.pat`왜 충돌이 일어나지 않는 지점`-O0`- 그럼 짧게`PATTERN_LENGTH`16까지 계산하고 몇 개의 함수가 충돌하는지 계산합니다.

## 연습 실험실

기존의 결합 테이블을 해독하고 PE 탐색기를 추가합니다.

요구 사항:

- `LC_DYLD_INFO_ONLY`                      `ledger_main_nochain`세그먼트, 섹션, 주소, 타입 및 목표가 있는 줄으로 나누고, 캡처된 21 줄과 같게 만들어 `dyld_info -fixups`문자
- `PT_GNU_RELRO`프로그램 헤더 및`DT_FLAGS``DF_BIND_NOW` `build_tiny_dyn_elf.py`움직여`.got.plt`커버된 범위 내에서, 그리고`llvm-objdump -p`새로운 헤더를 보여드리겠습니다. README 장치에서 전체 RELRO의 어느 부분이 재생되고 Glibc만이 수행할 수 있는 부분을 말해주세요.
- 글씨를 써`.pdata`PE32+ 이미지 및 함수 탐색기를 사용하는`RUNTIME_FUNCTION`주소를 시작해서 객체를 만들죠`clang -target x86_64-pc-windows-msvc -c``-fno-asynchronous-unwind-tables`, 그 책을 읽어보세요`.pdata`이전 및 테이블에서 생략되는 이 기능 중 어떤 기능이 잎 기능인지 표시합니다.
- 각 독자에게 촬영된 도구 텍스트와 비교하는 테스트를 작성하십시오.

성공이란`python3 code/main.py macho ledger_main_nochain`같은 21개의 정렬 줄을 인쇄합니다`dyld_info`발자국, 작은 ELF는 `PT_GNU_RELRO`그`llvm-objdump`목록, 그리고 `.pdata`검색자는 가능한 함수를 지정하고, 할 수 없는 잎 함수를 나열합니다.

## 교훈 유물

이 교훈은`outputs/skill-linking-loading-and-stripped-binaries.md`. 당신이 만든 프로그램을 제공자와 수입 목록으로 변환하는 데 사용하십시오.`strip`제거하고 살아남은 것, 그리고 점수를 얻은 기능의 시작과 이름의 제거된 빌드. 그것은 기본 진실으로 제거되지 않은 쌍둥이를 필요로, 모든 주장에 대한 캡처 된 도구 목록, 그리고 모든 충돌의 기록.

## 확인 해 보

데모와 결정적 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
python3 code/tests/test_main.py
```

검증은 다음과 같은 사실을 증명해야 합니다.

-  역동적인 부분`tiny-dyn-x86_64` 맞춤형`llvm-objdump -p`탭에 따라 탭`DT_FLAGS_1`운반`DF_1_PIE`
- 두 사람`R_X86_64_JUMP_SLOT`기록이 일치합니다`llvm-objdump -R`이름`puts`그리고`exit`
- PLT0는 GOT+8을 밀어내고 GOT+16을 뛰어넘는 것, 각 항목은 슬롯을 읽고 인덱스를 밀어 넣고, 각 슬롯은 자신의 주소를 가지고 있습니다 `pushq`
- 작은 ELF 경기의 섹션과 프로그램 헤더`llvm-objdump -h -p`
- 두 ELF 객체의 이전 기록이 일치합니다 `llvm-objdump -r`
- 링크 플랜은 2개의 PLT 상징, 4개의 직접 호출, 2개의 상대적인 이전과 작은 이미지의 크기를 찾습니다
- COFF 섹션 테이블, 37개의 상징 기록과 보조 기록, 이전과 일치하는`llvm-objdump -h -t -r`그리고`/16``.llvm_addrsig`
- 세 가지 COFF`REL32`기록`ledger`3개의 ELF에 앉아`PC32`이산
- PE 헤더`DllCharacteristics`, 그리고 데이터 디렉토리들이 일치합니다`llvm-objdump -p`
- 수입 디렉토리, 지적이/명 항목 및 IAT 일치 `llvm-objdump`그리고`pefile`, IAT는 결합하기 전에 검색 테이블과 같으며
- 수출 목록 및 `DIR64`기본 이전 해독, 이전 포인터는 문자열을 "손으로 연결"
- `ff 15`RVA에서`0x100b``puts`
- 마흐 오 플래그, 19개의 로드 명령어 이름, 그리고 두 개의 라이브러리가 일치합니다`otool`
- 7개의 톱니바스는 8개로 解码됩니다`__got`슬롯 및 간접 상징 테이블 일치 `otool -Iv`
- 이 이 이 이 이 이 이`llvm-objdump --macho --chained-fixups`
- 이 순서로 가는 것은`dyld_info -fixup_chain_details`
- 수립 행과 수입 표가 일치합니다 `dyld_info -fixups`그리고`-imports`
- 수출의 트리 일치`dyld_info -exports`과 그 유방에 대하여
- `nm_lines()`=`nm -m`실행 가능한 것과 그 복사본을 벗겨내는
- `strip`제거`_main``_fns`그리고`_names`9명의 이름을 지고 1명의 이름을 지었습니다`radr://5614542`찔러서, 그리고 벗겨진 프로그램에서 동일한 출력을 인쇄합니다
- 기존의 레이아웃은`LC_DYLD_INFO_ONLY`7개의 게으른 포인터와`__stub_helper`
- arm64 객체 이전 일치`llvm-objdump -r`
- `LC_FUNCTION_STARTS`2단계에서 5개에서 5개로 회복하고`nm`그리고`dyld_info -function_starts`
- `sub sp`스캔에서 5개에서 5개 발견됩니다`-O0`그리고 5명 중 1명`-O2`, 그리고`stp`프레임 스캔은 아무것도 발견하지 않습니다
- `bl`목표와 `LC_MAIN`입금 회복 5개
- 이 두 레벨의 다섯 가지 기능들을 모두 지명하고`grade`타격 44 바이트로 나뉘어
- "123456789"의 CRC16는`0x6e90`, 그리고 GOT 로드 쌍 아래 8 바이트`main`변종이
- 변함없는 객체 바이트는 연결된 바이트와 같습니다
- 데모와 그림 데이터에 동일한 주소와 사이트 모듈이 ES5에 동일한 데이터를 포함하고 있습니다

## 생산 실패 모드

| Failure | What the weak tool reports | What the analysis must prove |
|---|---|---|
| A `bl` or `call` lands in a stub | "calls an unnamed function at 0x694" | the stub bytes, the slot it loads, and the import the slot binds |
| A GOT word read from the file | "corrupt pointer 0x8010000000000007" | bit 63 is bind, `next` is 2, ordinal 7 is `_puts` from library 2 |
| `PLT32` in an object | "every call goes through the PLT" | defined symbols are reduced to a direct distance, only undefined ones get an entry |
| Partial RELRO read as full | "GOT is read-only" | `.got.plt` slots after the three reserved ones sit outside `PT_GNU_RELRO` without `-z now` |
| COFF `REL32` compared with ELF `PC32` | "the Windows build has different relocations" | same offsets, the `-4` lives in the ELF addend and in the COFF field |
| IAT read before load | "imports point at strings" | the IAT equals the lookup table until the loader binds, and the strings are hint/name entries |
| A stripped dylib | "no symbols, nothing exported" | the exports trie and `LC_FUNCTION_STARTS` list every function |
| `nm` on a stripped executable | "one function" | `LC_FUNCTION_STARTS` lists five starts, nine bytes long |
| A prologue scan at `-O2` | "one function" | four leaf functions have no frame, call targets and the starts table find them |
| Two functions share 36 bytes | "grade_label is grade" | the tail byte at 44 and the lengths 60 and 72 split the collision |
| A tool run on another machine's build | the numbers in this text | recapture every listing from your own fixtures |

## 운영 규칙

호출 사이트에서 로더가 채우는 슬롯까지 모든 외부 호출을 따라가며, 주소로 호출하기 전에 그 슬롯의 형식이 정의하는 단어로 암호를 해독하십시오. 로더가 필요한 것을 녹음한 후에야 벗겨야 합니다. 복원 기능은 바이트를 검색하기 전에 링크 편집자가 작성한 테이블에서 시작되며, 모든 파워더를 상징으로 된 쌍둥이를 상대로 점수를 받고, 그것을 나눈 바이트와 모든 서명 충돌을 기록합니다.

## 더 많은 읽기

- [System V gABI, chapter 5: Program Loading and Dynamic Linking](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement: section 5.2 and Table 4.9](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Drepper, "How To Write Shared Libraries", version 4.1.2](https://akkadia.org/drepper/dsohowto.pdf)
- [Drepper, "ELF Symbol Versioning"](https://akkadia.org/drepper/symbol-versioning)
- [Jelinek, "Little hardening DSOs/executables against exploits", binutils list, 2004-01-06](https://www.sourceware.org/ml/binutils/2004-01/msg00070.html)
- [Taylor, "Linker relro", 2008](https://www.airs.com/blog/archives/189)
- [binutils commit bd7ab16b: PLT32 for calls, 2018-02-13](https://gnu.googlesource.com/binutils-gdb/+/bd7ab16b4537788ad53521c45469a1bdae84ad4a)그리고[LLVM D43383](https://reviews.llvm.org/D43383)
- [GNU Binutils: strip](https://sourceware.org/binutils/docs/binutils/strip.html)그리고[llvm-objcopy](https://llvm.org/docs/CommandGuide/llvm-objcopy.html)
- [Microsoft, PE Format](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [CALL instruction reference, FF /2](https://www.felixcloutier.com/x86/call)
- [Apple, mach-o/loader.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h)그리고[mach-o/nlist.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h)
- [Apple dyld, mach-o/fixup-chains.h](https://github.com/apple-oss-distributions/dyld/blob/main/include/mach-o/fixup-chains.h)
- [Apple ld64, stub_arm64.hpp](https://github.com/apple-oss-distributions/ld64/blob/main/src/ld/passes/stubs/stub_arm64.hpp)
- [Xcode 13 release notes: chained fixups](https://developer.apple.com/documentation/xcode-release-notes/xcode-13-release-notes)그리고[WWDC22 session 110362, "Link fast: Improve build and launch times"](https://developer.apple.com/videos/play/wwdc2022/110362/)
- [strip(1)](https://keith.github.io/xcode-man-pages/strip.1.html)[ld(1)](https://keith.github.io/xcode-man-pages/ld.1.html)그리고[dyld(1)](https://keith.github.io/xcode-man-pages/dyld.1.html)
- [Hex-Rays, IDA F.L.I.R.T. Technology: In-Depth](https://docs.hex-rays.com/core/flirt/concepts/ida-f.l.i.r.t.-technology-in-depth)그리고[Lumina overview](https://docs.hex-rays.com/add-ons/lumina/overview)
- [Ghidra Function ID help](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/FunctionID/src/main/help/help/topics/FunctionID/FunctionID.html)그리고[AARCH64 function start patterns](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/AARCH64/data/patterns/AARCH64_LE_patterns.xml)
- [Vector 35, WARP](https://github.com/Vector35/warp)그리고[Binary Ninja WARP guide](https://docs.binary.ninja/guide/warp.html)
- [BinDiff manual](https://www.zynamics.com/bindiff/manual/)그리고[BinDiff source](https://github.com/google/bindiff)
- [Diaphora](https://github.com/joxeankoret/diaphora)
- [rizin pat.c, the .pat parser](https://github.com/rizinorg/rizin/blob/dev/librz/sign/pat.c)[radare2 flirt.c](https://github.com/radareorg/radare2/blob/master/libr/anal/flirt.c)그리고[radare2 book: Zignatures](https://book.rada.re/signatures/zignatures.html)
- [Andriesse et al., "An In-Depth Analysis of Disassembly on Full-Scale x86/x64 Binaries" (USENIX Security 2016)](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)그리고[Andriesse, Slowinska, Bos, "Compiler-Agnostic Function Detection in Binaries" (EuroS&P 2017)](https://danielandriesse.com/papers/eurosp-2017.pdf)
- [Bao et al., ByteWeight (USENIX Security 2014)](https://www.usenix.org/conference/usenixsecurity14/technical-sessions/presentation/bao)그리고[Shin, Song, Moazzezi, "Recognizing Functions in Binaries with Neural Networks" (USENIX Security 2015)](https://www.usenix.org/conference/usenixsecurity15/technical-sessions/presentation/shin)
- [LIEF changelog](https://lief.re/doc/latest/changelog.html)[pyelftools](https://github.com/eliben/pyelftools)그리고[pefile](https://github.com/erocarrera/pefile)
