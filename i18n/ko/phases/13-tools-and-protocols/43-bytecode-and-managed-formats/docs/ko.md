# 네이티브 코드 이외: 파이썬, JVM, .NET, 웹 어셈블리 바이텍ód

> 바이텍오드 파일은 프로그램과 컴파일러의 메모를 포함하고 이 수업은 각각의 컨테이너에서 어떤 메모를 보관하는지 보여주는 독자를 구성합니다.

**Type:** Build
**Languages:** Python, Java, C#, WebAssembly text
**Prerequisites:** Phase 13 · 32 (ELF from scratch), 33 (disassembly and control flow)
**Time:** ~150 minutes

## 학습 목표

- 16바이트를 읽어보세요`.pyc`PEP 552에서 헤더를 입력하고 `marshal`4개의 해석자 버전으로 작성된 파일들을 위한 모듈
- JVMS 4장에서 JVM 클래스 파일을 분석: 상수 풀, 필드, 방법, `Code`속성, 그리고 테이블`javac -g`추가합니다.
- JVM 오프코드를 `Ledger.class`그리고 에 대한 등록을 증명합니다`javap -c`같은 원천의 네 개의 구조물
- WebAssembly 모듈을 섹션별로 읽어, 모든 함수체에 대한 해독을 해보고, 결과를 증명합니다.`wasm-objdump -d`- 그래
- PE 데이터 디렉토리에서 .NET 집합의 ECMA-335 메타데이터를 `MethodDef`각 방법의 행과 CIL, ILSpy가 사용하는 리더 라이브러리에 의해 확인됩니다.
- 각각의 형식이 어떤 이름, 유형 및 제어 구조를 유지하고 어떤 것을 잃는지를 다섯 개의 컨테이너에서 한 함수에 대해 측정합니다.

## 문제

당신은 건설했습니다`ledger.py`그리고 발견`ledger.cpython-314.pyc``__pycache__`에이전트를 물어봤는데 파일은 뭐야?`Unsupported opcode`그리고 이렇게 말한 문장`# WARNING: Decompyle incomplete`에이전트는 이 파일이 흐려졌다고 결론 내렸다.

파일은 흐려지지 않았습니다. 첫 2바이트는`2b 0e`, 작은 엔디언 단어 3627. CPython 3.14의 숫자가 작성하고, 해독자의 opcode 테이블은 3.13. 도구는 구제되었습니다. 에이전트는 헤더를 읽지 않았으므로 차이를 알 수 없었습니다.

33강좌는 네이티브 코드에서 손실되는 것을 보여주었습니다.`switch`그 이  테이블이 되었습니다. 바이텍 코드 컨테이너는 덜 손실을 입으며, 각각의 컨테이너는 다른 것을 잃습니다. pyc는 모든 변수 이름을 유지하고 타입은 없습니다. 클래스 파일은 당신이 요청할 때만 타입과 로컬 이름을 저장합니다. 웨이스 모듈은 제어 구조를 유지하고 사용자 지정 섹션이 그것을 가지고 있지 않으면 이름을 떨어뜨립니다. .NET 집합은 테이블에 매개 변수 이름을 저장하고 별도의 파일로 로컬 이름을 남겨줍니다. 어떤 음반을 시작하기 전에 디컴파일러의 출력을 판단할 수 없습니다.

이 수업은 파이썬 표준 라이브러리에서 네 개의 리더를 구축합니다. 각각의 컨테이너는 첫 바이트에서 읽으며 하나의 함수를 나열하고, 당신이 만든 픽처에 형식의 고유 도구와 검증됩니다. 마지막 섹션은 `grade``ledger`5개의 컨테이너 모두에서 옆으로

```figure
re-43-five-containers
```

## pyc 헤더는 네 단어

PEP 552는 헤더를 4개의 32비트 단어로 정의합니다. 첫 번째는 마법 숫자입니다. 두 번째는 비트 필드입니다. 비트 0 세트는 파일이 해시 기반을 가지고 있음을 의미합니다. 비트 1 세트는 `check_source`: 인터프리터는 입력 시 소스를 해시하고 비교합니다. 비트 0 가 클리어되면, 단어 3 및 4 는 소스 mtime와 소스 크기를 나타냅니다. 비트 0 세트에서는 소스의 64 비트 SipHash를 보유하고 있습니다.

마법 숫자는 살아가고 있습니다`Include/internal/pycore_magic_number.h`3.11 이후의 규칙은 파이썬 3.n가 2900 + 50n에서 시작되며, 출시 주기의 내의 각 바이트 코드 변경은 하나 더합니다. 저장된 토큰은 16 비트 번호가 다음으로 `\r\n`, 그래서 텍스트 모드에서 열린 pyc는 잘못된 마법을 얻습니다. 최종 값은 3.11, 3531에 대한 3495입니다. 3.12, 3571에 대한 3.13, 3627에 대한 3.14, 그리고 3.15. 파이썬 3.15.0는 2026-10-09에 출시되었습니다. 그리고 이 고정 장치를 만든 기계에 설치되지 않습니다. 그래서 그 번호는 헤더 파일에서 나온 것이므로 여기서 파일에서 아닙니다.

이 조치는 인터프리터당 2개의 pyc 파일을 저장합니다.`compile_pyc.py``py_compile.compile(..., dfile="ledger.py")`저장된 파일 이름은`ledger.py`3.14 파일의 첫 16 바이트는

```text
checked-hash   2b 0e 0d 0a  03 00 00 00  c7 16 c7 fc c5 1d 81 01
timestamp      2b 0e 0d 0a  00 00 00 00  8d 60 cf 6a  f1 01 00 00
```

시간표 헤더를 단어에 따라 읽어보세요.`03 00 00 00`또는`00 00 00 00`깃발의 단어입니다.`8d 60 cf 6a`이 값은 0x6acf608d = 1791975565,`ledger.py`이 파일이 만들어졌을 때`f1 01 00 00`이 파일은 3개의 배트와 8개의 배트 배트로 표시되어 있습니다. 네 명의 해석자는 헤더의 모든 것을 동의합니다. 마법 단어 외에는:

| Interpreter | Magic bytes | Word | File bytes | `grade.co_code` bytes | `grade` instructions |
|---|---|---|---|---|---|
| 3.11.14 | `a7 0d 0d 0a` | 3495 | 1054 | 80 | 31 |
| 3.12.12 | `cb 0d 0d 0a` | 3531 | 937 | 62 | 26 |
| 3.13.12 | `f3 0d 0d 0a` | 3571 | 943 | 70 | 26 |
| 3.14.6 | `2b 0e 0d 0a` | 3627 | 965 | 96 | 35 |

`read_pyc_header()``code/main.py`이 필드를 반환하고 단어에서 버전을 이름합니다. `importlib.util.MAGIC_NUMBER`실행중인 통역자에 대해 동일한 4 바이트를 제공합니다. `python3 code/main.py compare`각 `python3.11` `python3.15``PATH`각 글에 대해 독자가 보는 헤더를 인쇄하고,

## 마셜은 코드 객체 필드를 필드별로 작성합니다

모든 장치의 16 바이트는`e3`- 그래요`0x80 | ord('c')`:                                            `FLAG_REF`세트, 이는 독자에게 나중에 객체를 기억하도록 말합니다 `r`참고 자료: Marshall 문서에서는 포맷이 의도적으로 문서화되지 않았으며 코드 객체는 버전들 사이에 호환되지 않는다고 말합니다. 두 가지 진술 모두 사실이며 포맷은 여전히 읽을 수 있을 정도로 작습니다. `Python/marshal.c`유형 코드를 나열합니다: `N`아무도 없죠`i`32비트 int,`s`바이트`z`그리고`Z`짧은 ASCII 문자열,`(`그리고`)``c`코드 객체,`r`컨테이너들은 그들의 어린이 앞에 컨테이너 공간을 예약하고, 독자는 똑같이 합니다.

`w_complex_object()`3.11에서 3.15까지의 객체 코드를 고정 순서로 작성합니다.`argcount``posonlyargcount``kwonlyargcount``stacksize``flags`32비트 인츠로,`code``consts``names``localsplusnames``localspluskinds``filename``name``qualname`객체로서,`firstlineno`그럼`linetable`그리고`exceptiontable`. 3.14 파일의 모듈 코드 객체를 17 바이트에서 손으로 해독합니다:

```text
00 00 00 00   argcount 0
00 00 00 00   posonlyargcount 0
00 00 00 00   kwonlyargcount 0
01 00 00 00   stacksize 1
00 00 00 00   flags 0
f3 22 00 00 00   type 's' with FLAG_REF, 34 bytes of co_code follow
80 00  52 06  74 00  52 01  17 00  74 01 ...
```

코드 바이트는 명령당 2개: `80 00` `RESUME 0``52 06` `LOAD_CONST 6``74 00` `STORE_NAME 0`그리고`17 00` `MAKE_FUNCTION`. 3.14의 목록은 같은 5개의 모듈 레벨 진술을 인쇄합니다.`code`네 개의 코드 객체를 둥지를 틀고 있는 상수들이 나오고, 그 다음에는`names`이 책:`('LABELS', 'percent_change', 'grade', 'total', 'grade_label')`- 그래

`Unmarshaller``code/main.py`이 레이아웃과 3.9와 3.10에서 사용된 오래된 레이아웃을 읽습니다.`nlocals``varnames``freevars`그리고`cellvars`서로 다른 분야가 되어서`CodeObject`실제 객체의 속성 이름과 같은`varnames`필터`localsplusnames``CO_FAST_LOCAL`조금`localspluskinds`- `grade`4개의 파일 중 하나하나에서 반환합니다`('score', 'bucket')``firstlineno`10개, 그리고 비공개`linetable`- 시험`test_unmarshaller_agrees_with_the_running_interpreter`각 분야를 비교합니다`marshal.loads()`다른 3개의 파일은 우리 코드에서 읽을 수 있고`marshal`이 통역자의 아래에서

## 4번 통역자, 4번 배타코드

디 문서화 에 각 버전 에 한 가지 경고 가 들어 있다. 바이트 코드는 CPython 의 구현 세부 사항 이며, 이 버전 이 동일 하 여 유지 될 수 있는 보증 은 없다.`python3.1N -m dis ledger.py`각 통역자를 위해 캡처되었습니다.

3.11`grade`이렇게 시작됩니다.

```text
 11           2 LOAD_FAST                0 (score)
              4 LOAD_CONST               1 (10)
              6 BINARY_OP                2 (//)
             10 STORE_FAST               1 (bucket)
 12          12 LOAD_FAST                1 (bucket)
             14 LOAD_CONST               2 (9)
             16 COMPARE_OP               5 (>=)
             22 POP_JUMP_FORWARD_IF_FALSE     2 (to 28)
```

`BINARY_OP`오프셋 6에서 위치하고 다음 명령은 10에서 위치하고 있습니다. 이 두 바이트는 PEP 659에서 인라인 캐시 입력입니다.`COMPARE_OP`16번은 22번이 이어집니다. 그래서 2번의 캐시 입력이 있습니다.`show_caches=True`3.12 대체`LOAD_CONST`더하기`RETURN_VALUE``RETURN_CONST`, 점프의 이름을 바꾸어`POP_JUMP_IF_FALSE`, 그리고 정신병자`grade`80~62바이트까지의 표기판 3.13`L1` `L4`이산화 대신 CLI를 제공합니다 `-C`캐시 및`-O`3.14 제거 `RETURN_CONST`다시 한 번, 추가합니다 `LOAD_SMALL_INT`그리고`LOAD_FAST_BORROW`, 그리고 삽입 `NOT_TAKEN`조건부 도약을 한 후:

```text
 12         20       LOAD_FAST_BORROW         1 (bucket)
            22       LOAD_SMALL_INT           9
            24       COMPARE_OP             188 (bool(>=))
            26       CACHE                    0 (counter: 0)
            28       POP_JUMP_IF_FALSE        3 (to L1)
            30       CACHE                    0 (counter: 0)
            32       NOT_TAKEN
```

`-C -O`목록에 표시된 13 `CACHE`내부에 있는 항목`grade`: 5일 후`BINARY_OP`, 한 번씩`COMPARE_OP`, 한 번씩`POP_JUMP_IF_FALSE`적응 장치가 캐시가 뭘 위한지 보여줘요`dis.dis(grade, adaptive=True)`발자국`RESUME_CHECK`그리고`COMPARE_OP_INT`일반 목록이 있는 곳`RESUME`그리고`COMPARE_OP`그리고`total`쇼`FOR_ITER_LIST``BINARY_OP_ADD_INT`그리고`JUMP_BACKWARD_NO_JIT`. 전문형태는 같은 곳에서 살고 있습니다`co_code`பை트는 결코 이 자원을 포함하지 않습니다. 왜냐하면 전문화는 메모리에 이루어지기 때문입니다.

이 때문에 디컴파일러에는 버전 천장이 있습니다. uncompyle6 3.9.3는 Python 1.0에서 3.8까지의 바이텍드를 받아들이고 있다고 명시합니다. decompyle3 3.9.3는 3.7과 3.8을 읽습니다. xdis 6.3.0, 둘 다 뒤에 있는 크로스 버전 디컴파일러는 3.13.`python_3_13.cpp`그 빌드 파일에서, 그리고 알려지지 않은 opcode 프린트에서`Unsupported opcode`3.6 이후 발매된 모든 버전을 주장하고 3.8에서 3.15까지의 인터프리터를 사용하여 자체 출력을 다시 컴파일하고 확인합니다. 3.14 파일에서는 첫 번째 세 가지가 거부하거나 실패하고 마지막 두 가지가만 적용됩니다. 도구를 선택하기 전에 마법 단어를 읽으십시오.

## 클래스 파일 은 자신 의 사전 을 유지 합니다

JVMS Java SE 25 섹션 4.1에서는 레이아웃을 하나의 구조로 제공합니다: `magic``minor_version``major_version``constant_pool_count`, 상속수,`access_flags``this_class``super_class`, 인터페이스, 필드, 방법, 속성`0xCAFEBABE`. 자바 SE 25 가상 머신은 주요 버전 45에서 69까지의 버전을 수용하고, 소형 버전은 65535의 프리뷰 기능 파일을 표시합니다.`Ledger-g.class``ca fe ba be 00 00 00 41 00 5e`: 메이저 65는 자바 21이고`0x5e`= 94은 상수 수입니다.`Ledger-jdk25.class`, javac 25.0.2에서 같은 소스에서 만든, 시작 `ca fe ba be 00 00 00 45`69대

상수 풀은 클래스 파일이 자신의 사전을 보관하는 곳입니다.`#13``-g`      `Methodref`이 점들은 수업에`#8`이름과 타입`#14`. 지수를 따라하면`Ledger.grade:(I)I`, 정확히 무슨`javap -v``//`- 설명자`(I)I`한 개`int`매개 변수와`int`결과`([I)I` `total`매개 변수가 라고 합니다.`int`배열. 코드가 만지는 모든 방법, 필드 및 클래스는 그러한 항목을 가지고 있으며, 섹션 4.10의 검증자는 명령어가 동의하지 않는 파일을 거부합니다.`ClassFile``code/main.py`테이블 4.4에서 모든 17 개의 상수 태그를 읽고`Long`또는`Double`두 슬롯으로 표시됩니다.

속성은 클래스, 각 필드, 각 메소드, 그리고`Code`JVMS는 가상 머신이 모르는 속성을 무시해야 한다고 말합니다. 그래서 디버깅 테이블은 메소드 몸체를 변경하지 않고 추가하거나 떨어뜨릴 수 있습니다. javac 설명서는`-g`로컬 변수를 포함한 모든 디버깅 정보를 생성하고 기본은 라인 번호와 소스 파일만 생성하고,`-g:none`3개는 측정값을 만듭니다.

| Build | Bytes | Constant pool count | `LineNumberTable` | `LocalVariableTable` | `SourceFile` | `grade` code bytes |
|---|---|---|---|---|---|---|
| `javac -g` | 1832 | 94 | 7 methods | 6 methods | yes | 50 |
| `javac` | 1581 | 82 | 7 methods | none | yes | 50 |
| `javac -g:none` | 1404 | 79 | none | none | no | 50 |

 50 바이트 코드`grade`3개의 파일 모두 동일하고 테스트가 확인합니다.`-g``grade`한 개`LocalVariableTable`줄: 시작 0, 길이가 50, 슬롯 0, 이름 `score`, 설명기`I`. 그 없이 디컴파일러는 0의 슬롯을 볼 수 있습니다 .`int`그리고 이름을 만들어야 합니다.`StackMapTable`모든 빌드에서 유지됩니다. 왜냐하면 검증자가 그것을 필요로 하기 때문입니다.`BootstrapMethods`속성은 남아있기 때문에`main` 연결된 문자열`invokedynamic`- 그래

## 테이블 스위치를 손으로 해독

JVMS 6장에서는 각 명령어를 하나의 오프코드 바이트와 오프코드 이름을 가진 오퍼랜드로 정의합니다. 지부 오프셋은 지부 오프코드의 주소와 관련하여 16 비트 서명된 값입니다. 이 값은 x86-64에서 다릅니다. 이 명령어는 다음 명령에 비해 이동합니다.`tableswitch`그리고`lookupswitch`0에서 3바이트까지 을 시작해서 32비트 오페란드는 4의 곱하기 주소를 시작하죠.

의 바이트`grade`4에서 pc`Ledger-g.class`이 부분의 본문은

```text
aa                 tableswitch at pc 4
00 00 00           padding to pc 8
00 00 00 2c        default: 4 + 44 = 48
00 00 00 06        low 6
00 00 00 0a        high 10
00 00 00 2a        case 6:  4 + 42 = 46
00 00 00 28        case 7:  4 + 40 = 44
00 00 00 26        case 8:  4 + 38 = 42
00 00 00 24        case 9:  4 + 36 = 40
00 00 00 24        case 10: 4 + 36 = 40
```

36바이트, 1개의 명령어, 그리고 전체`switch (score / 10)`9과 10의 공통 사례와 함께.`switch`33학습에서 한계 검증이 필요했습니다.`lea`, a `movslq`,`add`이 부분에서 표적이 명령에 포함되어 있고, 그 이유는 모두 함께 존재한다는 사실입니다.

`disassemble_jvm()`모든 202개의 정의된 오프코드를 그 오페란드 너비와 함께 커버하고,`javap`- 그래요`compare_with_javap()`포로가 된 사람들을 분석합니다`javap -c -p`다 줄자 문자를 포함한`tableswitch`블록, 그리고 모든 명령에 대한 오프셋, mnemonic, 그리고 오페란드를 확인합니다. 네 개의 빌드는 108 명령 중 108에 동의합니다. 테스트`test_branch_offsets_are_relative_to_the_branch_instruction`체크`ifne`6번의 pc 1 착륙`if_icmpge`33번 지점에서 13번 지점으로 착륙하고`goto`30분, 10분으로 돌아갑니다.

이 강의에 필요한 소스를 기반으로 만든 Radar2 6.2.4는 동일한 파일을 읽습니다.`rabin2 -I`보고서`arch java``lang java 21``linenum true`그리고`lsyms true`, 즉, 버전과 두 개의 디버깅 테이블의 읽기입니다. `pd 14 @ sym.Ledger.grade``tableswitch`5개의 목표에 화살표를 쏘아 올리는 것`Unable to parse code attribute: 2`이 파일에서, 도구 자체의 이름 제한이 있으며`javap`오라클처럼 이 형식의 디컴파일러는 파이썬과 비교하면 성숙합니다. CFR 0.152는 MIT의 라이선스입니다. 프로키온 0.6.0와 와인플라워 1.12.0는 아파치 2.0이고 와인플라워는 자바 21 지원이 있는 펠런플라워 포크이다. Fernflower 자체는 IntelliJ 커뮤니티 저장소 안에 살고 있습니다. JADX 1.5.6는 Android DEX 형식을 포함하고 있으며, JD-GUI는 2019년에 마지막으로 출시되었습니다. 하란드, 소토발레로, 몬페루스, 그리고 바우드리들은 2020년에 8개를 측정했다. 가장 잘 생산된 문법적으로 정확한 출력은 84%의 클래스와 의미적으로 동등한 출력은 78%입니다. 그들의 메타 디컴파일러는 어떤 도구도 처리하지 않는 클래스의 37.6%를 복구했습니다. 타입, 이름, 확인된 스택은 형식을 디컴파일할 수 있게 한다. 그들은 한 개의 디컴파일러를 완성하지 않습니다.

## 스 모듈 은 섹션 의 목록 이다

핵심 사양은 모듈을 선두로 정의합니다 `00 61 73 6d 01 00 00 00`, 줄이`\0asm`그리고 버전 1에 섹션이 이어집니다. 각 섹션은 1 ID 바이트, a`u32`크기는 LEB128 및 그 내용입니다. ID 1에서 13은 알려진 섹션입니다. 각은 최대 한 번과 순서로 이루어집니다. ID 0는 이름과 함께 사용자 지정 섹션입니다. 모든 정수들은 LEB128입니다. 따라서`e4 00`100이 됩니다`80 08`1024입니다.`wasm-objdump -h` `ledger.wasm`7개의 섹션 을 나열 하고 있습니다.`WasmModule`같은 7개의 배급량 이산점을 찾습니다.

| Section | Payload | Count | What it holds for ledger |
|---|---|---|---|
| Type | 10 to 26 | 3 | `(i32) -> nil`, `(i32, i32) -> i32`, `(i32) -> i32` |
| Import | 28 to 39 | 1 | `env.log` with type 0 |
| Function | 41 to 46 | 4 | type index for each defined function |
| Memory | 48 to 51 | 1 | one page, no maximum |
| Export | 53 to 110 | 5 | `memory` and the four function names |
| Code | 113 to 271 | 4 | bodies of 23, 63, 44, and 23 bytes |
| Data | 273 to 290 | 1 | `F\0D\0C\0B\0A\0` at offset 1024 |

함수와 코드 섹션 사이의 분할은 존재하므로 브라우저가 전체 파일 도착하기 전에 컴파일을 시작할 수 있습니다. 각 코드 항목은 크기와 로컬 선언의 벡터 및 표현입니다.`grade`지역인 벡터`01 7f`: 한 집단의 한 그룹`i32`- 그래요`bucket`, 그 종류와 그 이름 없이

제어 흐름은 구조로 구성되어 있습니다. 사양은 단지 을 목표로 할 수 있다고 말합니다.`block``loop`또는`if`레이블은 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 둥 `br_table`라벨 리스트를 지표하는 오페란드를 통해 간접 분사를 수행합니다.`grade`파일 오프셋`0xa3`이 부분의 본문은

```text
0e                  br_table
0b                  11 labels follow
04 04 04 04 04 04   buckets 0 to 5: label 4, the outermost block, returns 0
03 02 01 00         buckets 6, 7, 8, 9: labels 3, 2, 1, 0
00                  bucket 10: label 0, shared with 9
04                  default label 4
```

각 라벨은 깊이를 나타냅니다. 라벨 0은 가장 깊은 것입니다.`block`, 그리고 그 다음 코드`end` `i32.const 4`다음으로`br 4`결과 블록에서 나온 6`block`테이블 앞에 있는 지침, 11개의 라벨, 그리고 5개의 라벨`br`전체에 대한 지침이 있습니다`switch`, 그리고 검증자는 구조를 떠나는 모든 가지를 거부합니다.`disassemble_wasm()`깊이를 추적하여 목록의 실은`wasm-objdump`,는 에서 1 바이트의 모든 오프코드를 포함합니다`unreachable` `i64.extend32_s`, 그리고 포로가 된 것과 일치합니다`wasm-objdump -d`두 건물 모두에 대한 77의 77개의 지침에

이름만  수 있는 것 같습니다.`wasm-objdump`여전히 인쇄물`<grade>`왜냐하면 수출 섹션에서 문자열이 함수 인덱스 2로 지도를 그리기 때문에, 리더는 똑같이합니다. 290 바이트 파일에는 지역 이름이 없습니다. `wat2wasm --debug-names`사용자 지정 섹션을 추가합니다.`name`모듈 이름, 함수 이름, 로컬 이름의 하위 섹션이 있습니다. 파일은 425 바이트로 성장합니다.`{0: 'score', 1: 'bucket'}`함수 2 및`{0: 'values', 1: 'count', 2: 'sum', 3: 'i'}`함수 3에 대해`wasm-strip`툴 컨벤션 저장소에서는 더 많은 두 개의 통신체를 설명합니다. DWARF는`.debug_*`사용자 정의 섹션.`sourceMappingURL`사용자 정의 섹션은 복제형으로 바이트 오프셋이 있는 열 번호가 있는 소스 지도를 가리킬 수 있습니다.

2026년, 2026년, 2026년, 9월, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2026년, 2025년, 2026년, 2026년, 2026년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년, 20년,`wasm-decompile`, 그리고 Homebrew 이 기계에 대한 구축은 정확히 나머지 11 도구가 있습니다.`print``objdump`그리고`demangle`. Binaryen version_133는 `wasm-dis`6.2.4도 모듈을 읽습니다.`rabin2 -I`이렇게 말합니다`arch wasm`- 그 상징은`grade`시작됩니다`0x8e`, 지역인 vektor가 시작되는 곳,`wasm-objdump`이 기능에 대해 `0x8b`, 그 크기의 필드가 시작되는 곳입니다. 그 목록은 오래된 mnemonics를 사용합니다.`get_local``set_local`그리고`brtable 11 4 4 ...`라벨 수치가 인쇄된 상태에서 이 3가지 도구의 바이트는 동일하고 철자가 다르기 때문에 비교는 촬영된 도구의 이름을 지정해야 합니다. 이 수업에 대한 연구는 Ghidra의 프로세서 디렉토리에서 WebAssembly 프로세서 모듈이 발견되지 않았고, 그 목록은 완전히 읽지 않았습니다. 제3자 ghidra-wasm 플러그인 v2.4.0는 Ghidra 12.0를 대상으로 합니다. 그 특성은 하나의 살아있는 문서입니다. W3C 페이지`wasm-core-2`2026년 10월 13일, 추석에서 3.0 버전이 기술되어 있으며 편집자의 초안은 같은 날짜를 가지고 있습니다.

## ECMA-335 메타데이터는 프로그램의 데이터베이스입니다

.NET 어셈블리는 PE 파일입니다.`LedgerNet.dll``MZ`, 3개의 섹션이 있습니다`.text``.rsrc`그리고`.reloc`, 그리고 기계를 선언합니다`0x14c`컴파일러는 플랫폼 중립 코드를 발송했기 때문입니다. 선택적 헤더의 데이터 디렉토리 14 (CLR 런타임 헤더) 는 RVA를 가리키고 있습니다.`0x2008`. ECMA-335 II.25.3.3는 72 바이트를 정의합니다.

```text
48 00 00 00   Cb 72
02 00 05 00   MajorRuntimeVersion 2, MinorRuntimeVersion 5
78 21 00 00   MetaData RVA 0x2178
84 07 00 00   MetaData size 1924
01 00 00 00   Flags: COMIMAGE_FLAGS_ILONLY
05 00 00 06   EntryPointToken 0x06000005, MethodDef row 5, which is Main
```

RVA에서 메타데이터 루트`0x2178`서명으로 시작됩니다`42 53 4a 42`, 문장`BSJB`, 그리고 버전 1.1 그리고 문자열`v4.0.30319`5개의 스트림 헤더가 있습니다.`#~`이산화`0x6c`그럼`#Strings``#US``#GUID`그리고`#Blob`II.24.2는 각 종류의 흐름이 최대 한 번 발생한다고 말합니다.`#~` `HeapSizes`이 바이트는 0이고, 각 문자열, GUID, 블로브 인덱스는 2 바이트 너비이고, 64 비트입니다`Valid`표의 이름을 표시하는 마스크. 14 비트 설정:

| Table | Id | Rows | Row size | What the rows say |
|---|---|---|---|---|
| Module | 0x00 | 1 | 10 | the module name and its GUID |
| TypeRef | 0x01 | 21 | 6 | `System.Object`, `System.Console`, 19 more |
| TypeDef | 0x02 | 4 | 14 | `<Module>`, `Ledger`, and two compiler helpers |
| Field | 0x04 | 2 | 6 | `Labels` and a static array initialiser |
| MethodDef | 0x06 | 6 | 14 | the five methods and `.cctor` |
| Param | 0x08 | 5 | 6 | `before`, `after`, `score`, `values`, `score` |
| MemberRef | 0x0a | 16 | 6 | 12 attribute constructors and the 4 methods that `Main` calls |
| CustomAttribute | 0x0c | 12 | 6 | attributes the compiler and the SDK add |
| StandAloneSig | 0x11 | 3 | 2 | the three local variable signatures |
| Assembly, AssemblyRef, ClassLayout, FieldRva, NestedClass | | 1, 2, 1, 1, 1 | | identity, references, layout |

행 크기는 어디에도 저장되지 않습니다. II.22는 각 열에 유형을 부여하고 II.24.2.6는 크기의 규칙을 부여합니다.`HeapSizes`. 간단한 테이블 인덱스는 2 바이트이고 그 테이블에는 65536 줄이 적습니다. b 태그 비트로 n 테이블을 가리키는 코딩 인덱스는 2 바이트이고 그 테이블마다 2^(16-b) 줄이 적습니다. `CliAssembly`이 규칙에서 14 줄 크기를 계산하고 줄 수를 계산합니다. 시스템.반응.기체에 있는 메타데이터 덤프는 동일한 크기와 같은 테이블 오프셋을 보고합니다. 이것이 테스트가 수학적 결과를 증명하는 방법입니다.

III.1.9는 토큰을 정의합니다. 높은 바이트는 테이블이고 낮은 3 바이트는 1 기반 행입니다. `0x06000002` `MethodDef`2 줄 이 줄은 RVA `0x2060`, 이름`Grade`, 그리고 서명 블럽`00 01 08 08`: 기본 호출 컨벤션, 한 매개 변수, 반환 `int32`, 매개 변수`int32`- 그`ParamList``Param`, 그의 이름은`score`파람 테이블은 ILSpy가 인쇄할 수 있는 이유입니다`Grade(int score)`RVA에서`0x2060`방법의 몸체는 지방 헤더로 시작됩니다:

```text
13 30         flags 0x13: fat, init locals; size 3 dwords
02 00         MaxStack 2
2d 00 00 00   CodeSize 45
01 00 00 11   LocalVarSigTok 0x11000001
```

`StandAloneSig`1줄은 `07 01 08`이 책:`LOCAL_SIG`, 한 지역,`int32`. 로컬은 타입이 있고 이름이 없습니다. ECMA-335는 로컬 이름을 Partition V의 디버깅 교환 형식으로 저장하고, .NET SDK는 PDB에 작성합니다. 이 장치는`DebugType`아무도 없으니 테이블이나 파일은 이름이 없습니다`bucket`-`PercentChange`대신 작은 헤더를 가지고 있습니다: 첫 바이트`3a` `0x0e << 2 | 2`, 14바이트의 몸집이 없고, 8개의 기본 스택이 있습니다.

45 바이트 코드`Grade`Partition III opcode 테이블로 디코딩합니다. `switch`opcode입니다`0x45`다음으로`u32`그 숫자와 그 숫자가`int32`표 다음의 명령에 대한 목표:

```text
IL_0000: 02           ldarg.0
IL_0001: 1f 0a        ldc.i4.s 10
IL_0003: 5b           div
IL_0004: 0a           stloc.0
IL_0005: 06           ldloc.0
IL_0006: 1c           ldc.i4.6
IL_0007: 59           sub
IL_0008: 45 05 00 00 00 08 00 00 00 06 00 00 00 04 00 00 00 02 00 00 00 02 00 00 00
                      switch (IL_0029, IL_0027, IL_0025, IL_0023, IL_0023)
IL_0021: 2b 08        br.s IL_002b
IL_0023: 1a 2a        ldc.i4.4, ret
```

컴파일러는 6을 빼기 전에 `switch`6번 사례가 첫 번째 목표입니다`disassemble_cil()`표들을 통해 토큰을 렌더링합니다: `ldsfld Labels``call Grade``call System.Console::WriteLine`그리고`ldstr ' '``#US`이 모든 것의 오라클은`MetaDump`, C# 프로그램으로 만든 단편`System.Reflection.Metadata`ILSpy 내부의 라이브러리. 그것은 각 테이블의 행수, 크기, 오프셋, 각 방법의 RVA, 서명, 매개 변수 이름, IL 바이트, 그리고 226개의 필드를 인쇄합니다.`System.Reflection.Emit.OpCodes`-`compare_with_metadump()`모든 246개의 체크에 동의합니다. 실행 시간 테이블에는 218개의 오프코드가 더 8개 있습니다.`prefix`수업 테이블에는 219개의 항목이 있습니다.`no.`III.2.2에서, 배출 테이블은 결코 없었다.

형식 도구: ILSpy 11.0 (MIT, 2026-08-12) 는 Avalonia 데스크톱 빌드를 통해 macOS에서 실행됩니다.`ilspycmd`11.1.0.9782 발자국 IL`-il`그리고  로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 로 선택 합니다`-m 0x06000002`. dnSpyEx 6.6.0은 Windows에서만 dnSpy를 계속합니다.`ildasm`SDK 내부에서 아닌 NuGet 패키지로 배포됩니다. radare2 6.2.4은 메타데이터를 읽습니다:`rabin2 -I`이렇게 말합니다`arch cil`그리고`class PE32`그리고`is`목록`Ledger.Grade(int:score):int`이 픽처는 .NET SDK 8.0.205로 제작되었습니다. 왜냐하면 그것은 빌드 머신에 설치된 SDK이기 때문입니다. .NET 10은 2025-11-11부터 현재이며 동일한 ECMA-335 구조를 작성합니다.

## 모든 컨테이너 에서 보관 하는 것

      `grade`한 테이블의 모든 5개의 컨테이너에서`python3 code/main.py keeps`, 가시장 위에 가시장을 운반하는

| Container | Body bytes | Function name | Parameter names | Parameter and return types | Local names | Line numbers | Control flow |
|---|---|---|---|---|---|---|---|
| ELF object, clang -O0 | 118 | `grade` in `.symtab` | none | none | none | none, no `.debug_*` sections | 5 jumps and 1 indirect jump through a relocation table |
| CPython 3.14 pyc | 96 | `co_qualname` | `score` | none | `bucket` | `co_linetable`, first line 10 | 4 compare and `POP_JUMP_IF_FALSE` pairs |
| JVM class, `javac -g` | 50 | constant pool | `score` in `LocalVariableTable` | `(I)I` | none beyond the parameter | `LineNumberTable`, 6 rows | 1 `tableswitch` |
| WebAssembly | 63 | Export section | only with a name section | `(i32) -> i32` | only with a name section | none | 6 nested blocks, 1 `br_table`, 4 `br` |
| .NET assembly | 45 | `MethodDef` | `score` in `Param` | `static int32(int32)` | none, types only in `StandAloneSig` | none without a PDB | 1 `switch`, 1 `br.s` |

이 테이블은 당신이 볼 수 있는 디컴파일러 결과를 설명합니다.`int total(const int *, int)``int total(long param_1, uint param_2)`이 기드라는 네이티브 코드에서 추론했습니다. 네이티브 코드에서는 이러한 열이 없습니다. pyc는 모든 이름과 타입을 보관하고, 제어 흐름은 모든 버전에서 모양이 변경되는 점프입니다. 따라서 파이썬 디컴파일러는 버전별로 깨지고 이름을 무료로 복구합니다. 클래스 파일은 타입과 검증된 스택을 저장하고, 이름을 저장합니다.`-g`             `switch`하나의 명령으로, 바즈 모듈은 구조를 유지합니다.`wasm2wat`.NET 집합은 메타데이터 테이블이 규범적이기 때문에 가장 완전한 설명을 유지하며, 여전히 로컬 이름에 PDB가 필요합니다.

표는 디컴파일러가 어떤 작업을 수행해야 했는지, 그리고 어떤 출력들이 저장된 사실을 복사하고 어떤 출력들이 이를 추론하는지 알려줍니다. ILSpy 출력에서 매개 변수 이름은 복사입니다. 같은 출력에서 로컬 이름이 PDB가 존재하지 않는 한 추론입니다. 레슨 35은 각 주장의 권위로서 그 차이를 기록합니다.

## 건설 해

디모를 실행하세요:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
```

출력은 JSON 보고서입니다. 각 pyc에 두 개의 헤더, 파일 및 `grade`크기는, 캡처 된 목록에서 명령어 수와 opcode 이름을, 실행 중인 통역자가 읽을 수 있는지. 각 클래스 빌드에 대한 버전, 크기와 디버깅 테이블 수와 `javap`각 와즈스 빌드 에 대해 섹션, 유형, 기능, 이름 섹션 내용, 그리고`wasm-objdump`협정. 집합에 대해 CLI 헤더, 스트림, 테이블 라인 카운트, 메소드 및 시스템.레플렉션.메타데이터 협정을 제공합니다.`PATH`- 그래

읽으세요`code/main.py`이 순서로:

1. `Reader`커서와 정수 너비를 가지고 있습니다.`uleb()`그리고`sleb()`이 캔들은 WASM과 .NET 블랩 힙이 필요로 하는 LEB128 리더입니다.
2. `read_pyc_header()``Unmarshaller`그리고`PycFile`을 읽어봐`parse_dis_text()`포로가 된 것을 읽습니다`dis`목록에 있어서, 교차판 비교는 시험 시간에 네 명의 통역자가 필요하지 않습니다.
3. `ClassFile`수업 파일을 읽고 `disassemble_jvm()`그 코드를 해독합니다.`parse_javap_code()`그리고`compare_with_javap()`오라클의 검증입니다.
4. `WasmModule`이 부분들을 읽고`disassemble_wasm()`그 깊이와 함께 표현을 해독합니다.`compare_with_wasm_objdump()`오라클 체크입니다.
5. `CliAssembly`PE, CLI 헤더, 메타데이터 루트, 스트림 및 테이블을 이동합니다. `TABLE_SCHEMAS`그리고`CODED_INDEXES`자료로 II.22 및 II.24.2.6을 나타냅니다. `disassemble_cil()`신체를 해독하고`compare_with_metadump()`확인해
6. `NativeObject`함수 기호들을 나열하기 위해 ELF를 충분히 읽으며, 33번 수업의 나열을 텍스트로 받아들이고 있습니다. `what_each_keeps()`그리고`figure_data()`비교를 해봅시다.

5개의 명령이 더 있습니다.`python3 code/main.py pyc FILE``class FILE``wasm FILE`그리고`dll FILE`당신이 주는 파일에서 구조와 모든 함수의 목록을 인쇄합니다. `python3 code/main.py compare`컴파일`ledger.py`모든 통역자가 `PATH`그리고 각자가 쓴 것을 인쇄합니다.

## 사용 하 고

이 순서대로 독자를 만들어낸 컨테이너에 써보세요.

1. 첫 바이트를 읽고 형식을 이름 붙여 두 바이트를 `0d 0a``ca fe ba be`수업 파일,`00 61 73 6d`모듈,`4d 5a`데이터 디렉토리 14에 대한 집합을 설정합니다.
2. 헤더를 읽고 그 이름의 프로듀서 버전을 적어 보세요. pyc에 대해서는 마법 단어, 클래스 파일에는 메이저 버전, 집합에 대해서는 실행 시간 및 메타데이터 버전 문자열입니다.
3. 실행하기 전에 해당 버전을 실행할 계획의 모든 디컴파일러를 확인하고 천장과 도구가 문서화하는 위치를 기록하십시오.
4. 독자와 형식의 고유 도구를 같은 파일에서 실행하고, 줄을 따라 비교하십시오. 부합은 독자 또는 도구의 변경입니다. 목록이 증거가 되기 전에 둘 중 하나를 이해해야합니다.
5. 관심 있는 기능 을 위한 유지 테이블 을 채우고, 각 사실 을 저장 된 것 이나 손실 된 것 으로 표시 하고, 그 테이블, 속성, 또는 섹션 을 이름 붙여 주십시오.
6. 다음으로 디컴파일러 출력을 읽어내서 각 이름을 표시하고 저장된 사실의 복사본이나 추론으로 입력합니다.

오라클 텍스트 파일을 컨테이너에 보관하십시오. 인터프리터, JDK, SDK 또는 wabt 버전이 변경되면 `build_fixtures.sh`그리고 다시 잡을 수 있습니다. 왜냐하면 변경된 목록은 변경된 장치이기 때문입니다.

## 인터랙티브 연구소

### 연구소 A: 헤더를 읽고, 코드 객체를 읽으십시오

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats/code
python3 -q
```

실행:

```python
from main import *
pyc = load_pyc("ledger.cpython-311.pyc")
pyc.header.to_dict()
pyc.module.names
pyc.functions()["grade"].varnames
len(pyc.functions()["grade"].code)
```

첫 번째 전화 전에 마법 단어를 적어주세요`ledger.cpython-314.pyc`그리고 두 가지를 비교해 보세요`code`길이가 길어지면`import marshal; marshal.loads(pyc.data[16:])`번역기 아래의 3.11 파일에서 오류를 읽어보세요.

### 연구소 B: 상수 수영장 연쇄

```python
cls = load_class("Ledger-g.class")
cls.constant(13)
cls.constant(14)
cls.describe_constant(13)
[row["text"] for row in jvm_listing(cls, "grade")]
```

따라가`#13` `#8`그리고`#14`, 그리고 `Utf8`전화하기 전에 손으로 입력합니다`describe_constant`- 그럼 `Ledger-gnone.class`그리고 전화`cls.method("grade").attribute_names()`두 가지 모두`Code`배열은 동일하지만 속성은 그렇지 않습니다.

### 연구소 C: 깊이와 표기

```python
module = load_wasm("ledger.wasm")
[(row["depth"], row["text"]) for row in wasm_listing(module, "grade")]
module.function_name(2)
load_wasm("ledger-names.wasm").names["locals"][2]
```

`br_table`을 고 깊이 읽어라`end`그 다음 행을 열고 각각은 테이블의 라벨 번호와 일치합니다.`ledger.wat`그리고 `block $six`이 표지에는 3개의 이름이 있습니다.

### D 연구소: 토큰에서 바이트

```python
asm = load_assembly("LedgerNet.dll")
asm.method("Grade")
body = asm.method_body(asm.method("Grade")["RVA"])
body.fat, body.max_stack, body.code_size, hex(body.local_signature_token)
asm.token_text(0x11000001)
[row["text"] for row in cil_listing(asm, "GradeLabel")]
```

RVA의 파일 오프셋을 계산합니다 `0x2060``.text`이 부분의 헤더를 손으로 작성하고 비교해 보세요`asm.rva_to_offset(0x2060)`- 그럼 위로 봐`asm.row(0x08, 3)`그리고 이름이 어디에 있는지 찾아보세요`score`생명체

## 연습 실험실

비교에 다섯 번째 원본 언어를 추가하거나 테이블에 여섯 번째 사실을 추가하십시오.

요구 사항:

- 로프와 로컬 변수를 사용하는 함수를 작성하여, 예를 들어 Kotlin에서 클래스 파일 또는 Rust에서 Wasm 모듈에 컴파일하는 언어를 작성하십시오. 출력 및 오라클 목록은 정확한 명령으로 `build_fixtures.sh`- 그래
- 각 명령 에 대해 일치 하는 독자 를 오라클 에 동의 하게 하여, 단지 장치 가 필요 할 때 에 오프코드를 추가 하십시오.
- 확장`what_each_keeps()`새로운 컨테이너와 함께, 그리고 모든 컨테이너에 대한 한 가지 더 많은 사실: 배가 예외 테이블을 가지고 있는지 여부`try`지역
- 새로운 컨테이너를 추가합니다`figure_data()`그리고 재생`site/figures-re-43.js`- 그래
- 어떤 문자가 그 내용을 담은 테이블, 속성, 또는 섹션에 이름을 붙이지 않고 기록된 사실에 대해 보고할 때 실패하는 테스트를 작성하십시오.

성공이란`python3 code/main.py keeps`새로운 줄이 모든 세포에 대한 증거를 가지고 있고, 모든 오라클 비교는 여전히 동의합니다.

## 교훈 유물

이 교훈은`outputs/skill-bytecode-and-managed-formats.md`. 이 기능을 사용하여 바이트 코드 컨테이너를 헤더 보고서, 한 함수의 체크 리스트 및 각 이름, 타입 및 구조를 저장되거나 손실된 것으로 표시하는 사실 테이블로 변환합니다. 이 방법은 형식의 고유 도구인 오라클, 모든 디컴파일러 전에 버전 확인 및 손실된 사실마다 살았던 장소의 진술이 필요합니다.

## 확인 해 보

데모와 결정적 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

검증은 다음과 같은 사실을 증명해야 합니다.

- 네 개의 pyc 헤더에는 마법 단어 3495, 3531, 3571, 3627이 있고, 깃발 3과 8바이트 해시가 있고, 타임스테임 파일에는 깃발 0이 있고, 크기는 497입니다.
- 3.11와 그 이후의 모든 마법 단어들은`2900 + 50n`규칙은 그 방출을
- unmarshaller는 동일한 이름, 상수, 코드 바이트, 변수 이름, 라인 테이블을 반환합니다.`marshal.loads()`실행중인 통역자가 작성한 파일
- 네 개의 파일 모두 모듈 이름을 보관합니다.`('score', 'bucket')``grade`, 첫 번째 선 10 , 그리고`ledger.py`파일 이름
- `grade.co_code`4개의 버전에서 80, 62, 70 및 96 바이트를 기록하고, 캡처된 목록에는 31, 26, 26, 35의 명령어가 있습니다.
- 3.11 목록은 `POP_JUMP_FORWARD_IF_FALSE`, 3.12 및 3.13은`RETURN_CONST`, 3.14은`LOAD_SMALL_INT``LOAD_FAST_BORROW`그리고`NOT_TAKEN`
- 3.14`-C -O`목록은 `grade`5개씩 `BINARY_OP`, 그리고 적응적인 목록 쇼`COMPARE_OP_INT`
-  없는 헤더`0d 0a`, 줄여진 헤더, 그리고 코드 객체 아닌 몸매 `FormatError`
- 실행중인 통역자가 작성한 pyc에 대한 명령 목록이 존재하며 캡처된 것과 일치합니다 `dis`출력
- 클래스 파일은 메이저 65 또는 69이며, 크기는 1581, 1832, 1404, 1581, 그리고 상수 풀 수는 82, 94, 79, 82
- 일정`#13``Method Ledger.grade:(I)I`그리고`#47` `String F`
- JVM 분산기 `javap -c -p`네 개의 배형에서 108개의 명령어 중 108개에
- `tableswitch`pc 4에서는 36 바이트가 low 6, high 10, default 48와 target 46, 44, 42, 40, 40
- 세 개의 디버깅 레벨은 속성 수를 변경하고 50 바이트 코드를 `grade`동일
- `ifne``if_icmpge`그리고`goto`목표가 지점 오프코드에 관계
- 잘못된 마법, 배트 뒤처음, 그리고 정의되지 않은 오프코드 상승`FormatError`
- 7개의 스 섹션에는 이용하우가 적립되어 있습니다`wasm-objdump -h`인쇄, 그리고 이름의 구성은 추가 `name`관세부 293~425
- 종류,`env.log`수입, 5개의 수출, 그리고 1024 디코드`ledger.wat`
- 스 해체기는 동의합니다`wasm-objdump -d`두 건물 모두에서 77개의 명령 중 77개에
- `grade`6개의 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥지를 둥`br_table`표기 `4 4 4 4 4 4 3 2 1 0 0`그리고 기본적으로 4은 깊이 6이고 1은`i32`지역
- 함수 이름들은 이름 섹션 없이 수출에서 비롯되며, 로컬 이름들은 그것만 포함됩니다.
- LEB128 `e4 00`100이 됩니다.`7f`-1입니다.`80 08`이 값은 1024이고 블록 타입은`wasm-objdump`
- 잘못된 선두, 버전 2, 그리고 알려지지 않은 오프코드 상승`FormatError`
- 기계와 함께 PE32의 집합 `0x14c`, RVA에서 CLI 헤더`0x2008`, 실행시간 2.5`ILONLY`, 그리고 입구점`0x06000005`
- 메타데이터 버전은`v4.0.30319`, 5개의 스트림이 존재하고, 14개의 테이블은 오라클의 보고에 따라 줄의 수와 줄의 크기를 가지고 있습니다
- .NET 독자는 246개의 체크 중 246개의 시스템.레플렉션.메타데이터에 동의합니다
- `Grade`매개 변수를 가지고 있습니다`score`, 서명`static int32(int32)`, 뚱뚱한 헤더`MaxStack`2과 45바이트 코드, 그리고 1`int32`이름 없는 지역
- CIL `switch`목표물`br.s``ldsfld``call`그리고`ldstr`오퍼랜드는 테이블과 덩어리들을 통해 해결됩니다
- CIL 오프코드 테이블은 모든 실행 시간 오프코드를 포함하고 추가합니다.`no.`
- Keeps 테이블은 네 컨테이너에서 매개 변수 이름을 보고하고 네이티브 코드에는 아무것도 없습니다.
- 데모의 각 오라클 라인은 n의 n
- 상호작용적인 그림은 동일한 데이터를 담고 있습니다 `figure_data()`생산하는

## 생산 실패 모드

| Failure | What the weak tool reports | What the analysis must prove |
|---|---|---|
| Decompiler older than the interpreter | `Unsupported opcode`, output marked incomplete, or a claim of obfuscation | The magic word, the release it names, and the tool's documented ceiling |
| pyc read with the wrong interpreter | `marshal.loads` raises or returns garbage | Our unmarshaller reads names, constants, and sizes from any 3.9 to 3.15 file, and instructions come from the matching `dis` |
| Specialised opcodes mistaken for the file's content | `COMPARE_OP_INT` in a listing | A pyc holds the unspecialised form, specialisation happens in memory after warm-up |
| Local names reported for a default javac build | `var1`, `var2` presented as source names | `LocalVariableTable` is present only with `-g`, the 50 code bytes are identical either way |
| Branch target off by the instruction length | A JVM listing whose jumps land mid-instruction | Offsets relative to the branch opcode, checked against `javap` |
| Switch padding skipped | A `tableswitch` with a wrong default and shifted cases | Zero to three padding bytes to a 4-aligned pc, 36 bytes for five cases |
| Wasm names assumed stripped | "no symbols" | Exports name every exported function, locals need the `name` section, `wasm-strip` removes only that section |
| Three tools, three spellings | `get_local` versus `local.get`, a function at `0x8b` versus `0x8e` | Same bytes, and the listing that the comparison was captured with |
| Table row size guessed | Every row after the first table misread | Row sizes from `HeapSizes`, row counts, and coded index widths, equal to the oracle's |
| Local names expected in a release assembly | `V_0` presented as the source name | Locals have types in `StandAloneSig` and names only in a PDB that `DebugType` none did not write |
| Reader guesses an unknown opcode or type code | A plausible mnemonic | `FormatError` with the offset, and the oracle comparison stops there |
| Oracle captured from another build | Tests pass on stale text | `build_fixtures.sh` names every tool version and writes `versions.txt` and `sha256.txt` |

## 운영 규칙

헤더를 먼저 읽고 그 제품을 가리키는 이름을 읽어 보세요. 모르는 것을 거부하는 독자와 컨테이너를 읽어보고, 같은 파일의 형식의 도구와 비교하여 그 목록을 확인하세요. 다음으로는 디컴파일러의 출력에서 모든 이름과 타입을 사용하든 컨테이너가 저장했든, 도구가 추론했든 간에,

## 더 많은 읽기

- [PEP 552: Deterministic pycs](https://peps.python.org/pep-0552/)
- [CPython `Include/internal/pycore_magic_number.h`](https://github.com/python/cpython/blob/main/Include/internal/pycore_magic_number.h)
- [Python `marshal` module documentation](https://docs.python.org/3/library/marshal.html)
- [CPython `Python/marshal.c`](https://github.com/python/cpython/blob/main/Python/marshal.c)
- [Python 3.14 `dis` module documentation](https://docs.python.org/3.14/library/dis.html)
- [PEP 659: Specializing Adaptive Interpreter](https://peps.python.org/pep-0659/)
- [PEP 626: Precise line numbers for debugging and other tools](https://peps.python.org/pep-0626/)
- [PEP 790: Python 3.15 Release Schedule](https://peps.python.org/pep-0790/)
- [uncompyle6 on PyPI](https://pypi.org/project/uncompyle6/)[decompyle3 on PyPI](https://pypi.org/project/decompyle3/)[xdis on PyPI](https://pypi.org/project/xdis/)[pycdc on GitHub](https://github.com/zrax/pycdc)[PyLingual on GitHub](https://github.com/syssec-utd/pylingual)
- [The Java Virtual Machine Specification, Java SE 25, Chapter 4: The class File Format](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-4.html)
- [The Java Virtual Machine Specification, Java SE 25, Chapter 6: The Java Virtual Machine Instruction Set](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-6.html)
- [javac manual, Java SE 25](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javac.html)그리고[javap manual](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javap.html)
- [CFR](https://www.benf.org/other/cfr/)[Procyon](https://github.com/mstrobel/procyon)[Vineflower](https://github.com/Vineflower/vineflower)[Fernflower in intellij-community](https://github.com/JetBrains/intellij-community/tree/master/plugins/java-decompiler/engine)[JADX](https://github.com/skylot/jadx)
- [Harrand, Soto-Valero, Monperrus, Baudry, "Java Decompiler Diversity and its Application to Meta-decompilation" (JSS 2020)](https://arxiv.org/abs/2005.11315)
- [ECMA-335, Common Language Infrastructure, 6th edition (June 2012)](https://ecma-international.org/publications-and-standards/standards/ecma-335/)
- [PE Format, Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [System.Reflection.Metadata.Ecma335.TableIndex](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.metadata.ecma335.tableindex)
- [ILSpy on GitHub](https://github.com/icsharpcode/ILSpy)[ilspycmd on NuGet](https://www.nuget.org/packages/ilspycmd)[dnSpyEx on GitHub](https://github.com/dnSpyEx/dnSpy)
- [WebAssembly Core Specification: Binary Format, Modules](https://webassembly.github.io/spec/core/binary/modules.html)그리고[Values](https://webassembly.github.io/spec/core/binary/values.html)
- [WebAssembly Core Specification: Custom Sections (name section)](https://webassembly.github.io/spec/core/appendix/custom.html)
- [WebAssembly tool-conventions: Debugging](https://github.com/WebAssembly/tool-conventions/blob/main/Debugging.md)
- [wabt 1.0.42 release notes](https://github.com/WebAssembly/wabt/releases/tag/1.0.42)[wasm-tools](https://github.com/bytecodealliance/wasm-tools)[Binaryen](https://github.com/WebAssembly/binaryen)[ghidra-wasm-plugin](https://github.com/nneonneo/ghidra-wasm-plugin)
- [radare2 on GitHub](https://github.com/radareorg/radare2), 6.2.4 버전이 본 강의에 대한 소스를 기반으로 만들어졌습니다
