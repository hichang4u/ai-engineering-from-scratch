# 바이너리 디핑 및 상징적 실행: 기능과 입력의 일치 및 해결

> 두 함수 사이의 일치는 한 가지 품질의 한 서명에서 만든 주장이며, 풀린 입력은 한 경로 조건의 한 모델입니다. 이 교훈은 둘 다 구축하고 radiff2, Ghidra, angr 및 z3에 대한 검증을합니다.

**Type:** Build
**Languages:** Python, C, x86-64 assembly, Java (one Ghidra script)
**Prerequisites:** Phase 13 · 33 (disassembly and control flow), 34 (lifting to pseudocode), 36 (rebuild and prove equal)
**Time:** ~150 minutes

## 학습 목표

- 객체와 그 목록에서 다섯 개의 함수 서명을 구성하십시오. 정확한 바이트, 매스킹된 이전 필드 바이트, 음계열, 흐름 그래프 모양 및 상징 이름.
- BinDiff 스타일의 무대 탐욕적인 매치를 실행하세요. 이 두 편의 독특한 매치가 있을 때만 서명이 일치하는 곳이죠. 그리고 매 매치 뒤에 있는 스테이지와 품질을 기록하세요.
- 로드된 이미지에 바이트 상관관계를 놓친 두 바이트 동일 함수 있는 경우를 재현하고 마스크링 후 4 바이트 변경을 설명하는 이전 계산으로 전달한다.
- 레벤슈타인 거리에서 radiff2의 유사성 비율을 재현하고 비교에서 82 바이트의 레이더2를 사용할 때만 하나의 비율이 나타나는 이유를 설명하십시오.
- 작은 IR에 함수의 경로를 나열하고, 각 경로에 대한 조건을 가져와, 제한된 검색으로 입력값을 위한 각 페이지를 해결한다.
- 상징적인 경계로 루프에서 경로 폭발을 측정하고, 각 10.0.3 및 z3 5.1.0와 함께 계산, 클래스 및 모델을 비교하십시오.

## 문제

다시 지은 거야`ledger.c``-O2`그리고 에이전트를 물어봤어요`-O1`에이전트가 을 고 보고했어요`grade`로드 된 두 프로그램에서 바이트가 다르기 때문에 수정되었습니다.`grade`이 두 객체 파일에서 동일한 이미지입니다. 이 이전 후 비교된 이미지들은 다르며,`.rodata`                                        `-O2`프로그램, 그래서 1 이동 `grade`0x70으로 증가했습니다.

그날 오후, 어떤 점수를 얻는지 물어봤는데`grade`답 4. 에이전트는 사이드코드를 읽고 "90"라고 답했습니다. 그건 하나의 답입니다. 함수는 90에서 109까지의 모든 점수에 대해 4을 반환합니다. 질문에는 아무런 제한이 없었기 때문에 에이전트의 대답은 샘플이었습니다.

두 가지 실패는 같은 격차에서 발생합니다. 일치와 해결된 입력은 각각 메소드를 가진 주장입니다. 이 수업은 표준 라이브러리 파이썬에서 두 방법을 구축하고 그 옆에 생산 도구를 실행합니다. 도구와 코드가 동의하는 경우 두 가지 파생이 있습니다. 그들이 동의하지 않는 경우 주소, 바이트 또는 볼 수 있는 묶음입니다.

```figure
re-44-matches-and-paths
```

## 기능 서명 은 품질 을 가진 요구

플레이크는 2004년에 비슷한 실행 가능한 두 개의 함수 집합 사이의 동형성의 건설으로 바이너리 디퍼싱을 프레임했다. 2005년 듀린과 롤스는 기본 블록과 지침으로 확장했습니다. 이 작업에서 나온 전략은 BinDiff 개념 페이지에서 설명됩니다. 양쪽에서 각각의 함수에 대해 하나의 속성을 계산하십시오. 각 변에서 정확히 한 번 나타난 값은 일치합니다. 한 번 이상 나타나는 값은 모호하며 해당 동등성 클래스 내의 다음 속성을 통해 뚫립니다. 대조가 없는 값은 비교할 수 없는 값으로 유지된다. 각 패스 후, 새로운 매치의 호출자와 호출자는 다음 속성이 독특할 가능성이있는 작은 집합을 형성하고 다음 속성으로 프로세스가 반복됩니다.

각각의 일치 알고리즘은 어떤 품질을 가지고 있습니다. 페이지의 비율은 순수 함수 바이트의 해시 일치와 이름 해시 일치가 매우 좋으며, 흐름 그래프 MD 지수 및 프라임 서명을 일치하는 (각 mnemonic 작은 프라임, 함수에 대한 제품) 은 좋으며, 문자열 참조는 중소이며 루프 수 또는 주소 순서도 좋지 않습니다. 일치의 신뢰는 그것을 생성한 알고리즘의 평균 품질입니다. 함수의 유사성은 25% 정도의 일치하는 흐름 그래프 가장자리, 15%의 일치하는 기본 블록, 10%의 일치하는 명령어, 그리고 50%의 신뢰와 곱한 흐름 그래프 MD 지수의 차이입니다.

이 수업은 그 속성 중 다섯 가지와 중요한 규칙이 있습니다. 두 가지 측면에서도 독특하거나 일치하지 않습니다. MD 지수를 떨어뜨립니다. 왜냐하면 개념 페이지에서 공식이 없기 때문에, 그리고 그 자리에 단순한 수급 순서를 사용합니다. 품질 레이블은 남아 있습니다. 왜냐하면 일치하는 것은 그것을 생성한 가장 약한 사실만큼만 좋기 때문입니다.

## 한 기능 기록 에서 5개의 서명

이 오브젝트에 대해 두 가지 것을 읽습니다. ELF는 바이트, 상징 크기와`.rela.*`기록.`llvm-objdump -d`목록은 명령의 경계와 미네모닉을 제공합니다. 그리고 33번 강의는 이러한 객체의 모든 명령에 해당하는 디코더를 증명했습니다.`function_record()`목록에 있는 모든 명령어의 바이트가 해당 주소에서 객체의 바이트와 같다는 것을 확인하고 다른 방법으로 증가합니다.

이봐`grade``ledger-x86_64-O1.o`. 기호는 0x10의 오프셋과 크기가 46라고 말합니다. 그래서 기록은 0x10에서 0x3e까지 포함되며 2 바이트를 배제합니다.`nop`다음 함수를 조정합니다.

정확한 바이트 서명은 46 바이트 중 SHA-256입니다. 마스크 바이트 서명은 모든 이전 필드를 먼저 제로합니다. 한 필드 있습니다. 기록`R_X86_64_PC32 .rodata+0x10`0x36의 오프셋에서 4바이트 너비,`leaq (%rip), %rcx`RELA 객체에서 4 바이트는 이미 0을 가지고 있기 때문에 두 개의 서명이 여기 있는 모든 객체의 모든 함수에 동의합니다. 다음 섹션에 마스크가 있습니다.

모니크 서명이 14개의 모니크의 순서를 해시합니다.

```text
movslq imulq movq sarq shrq addl addl xorl cmpl ja movl leaq movl retq
```

흐름 그래프 모양의 서명은 입장이 도달할 수 있는 블록에 제한된 수업 33의 기본 블록과 타이핑한 가장자리에서 나온다. `grade``-O1`3개 블록과 3개의 가장자리가 있습니다.`ja 0x3d` ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ( ()  ()  ( ()  ()  ()  ()  ()  ()  ()  ()  ()  ( ()  ()  ( ()  ()  ()`3b 3e [0/2,1/1,2/0]`- `grade``-O0`기록은 5번을 통해 간접적으로 점프를 해줍니다`.rela.rodata`입문들은 33번 강의와 정확히 같아서 8개 블록과 11개의 가장자리가 4개로 되어 있습니다.`table`가장자리

이름 서명은 상징 이름입니다. 그것은 존재할 때 가장 강력한 사실이고, 빌드 제거되면 아무것도 없습니다.

나중에 패치 케이스에 한 가지 더 필드가 니다. 함수가 `lea`이식`.rodata`, 한계 확인, 그리고 지표된 부하,`referenced_table()`이 책에서 36강의 방식이`cmpl $0x4`이전`ja`5개의 항목과 로드를 제공합니다 `movl (%rcx,%rax,4), %eax`4바이트를 각각 `grade``-O1``.rodata+0x14`읽는다`1, 2, 3, 4, 4`- 그래

## 탐욕 한 부적 인 사람

`match_functions()`각 단계에 대해, 각 단계의 서명에 의해 여전히 비교되지 않는 함수를 그룹화하고 각 측면에 정확히 하나의 기능을 가진 모든 값을 받아들이고.

```python
for stage in order:
    for signature, candidates in left_groups.items():
        partners = right_groups.get(signature, [])
        if len(candidates) != 1 or len(partners) != 1:
            continue
        a, b = candidates[0], partners[0]
        agreeing = [s.id for s in STAGES if a.signatures()[s.id] == b.signatures()[s.id]]
        matches.append(Match(a, b, stage, agreeing, radare2_ratio(a.raw, b.raw), data_equal))
```

수업 순서는 4개의 구조 단계가 먼저, 이름들은 마지막으로 진행되므로 구조 단계들은 테스트되고 이름들은 그 후에 분류됩니다.`-O1`반대`-O2`이 부분의 본문은

| Function | Stage | Agreeing signatures | Similarity |
|---|---|---|---|
| `percent_change` | exact bytes | all five | 1.000 |
| `grade` | exact bytes | all five | 1.000 |
| `total` | name | name only | 0.171 |
| `grade_label` | exact bytes | all five | 1.000 |

`total`Clang은 SSE2로 루프를 벡터화하고 스칼라리 잔류 루프를 유지했기 때문에 31 바이트와 13 명령에서 140 바이트와 41 명령으로 성장했습니다. 그 모양은 5 블록과 5 가장자리에서 10 블록과 13 가장자리로 바뀌었습니다. 구조적인 것은 아무것도 남아 있지 않으며, 단지 상징만이 두 가지를 연결합니다.

`-O0`반대`-O1`같은 순서로 1개의 잘못된 일치가 발생한다.

| Function at -O0 | Matched at -O1 | Stage | Names agree |
|---|---|---|---|
| `percent_change` | `grade_label` | flow-graph shape | no |
| `grade` | `grade` | name | yes |
| `total` | `total` | name | yes |
| `grade_label` | unmatched | | |

`percent_change``-O0`4개 블록의 다이아몬드입니다.`before == 0`2개의 팔과 복귀하는 결합이 있습니다.`0/2, 1/1, 1/1, 2/0`-`grade_label``-O1``grade`이 라인은 2개의 다른 라인을 가지고 있습니다. 이 라인은 2개의 라인을 가지고 있습니다.`grade_label`오른쪽, 그래서 진짜 `percent_change`그리고`grade_label`쌍은 비교할 수 없습니다.

BinDiff 순서는 실제 이름이 존재할 때 두 번째 단계로 이름 일치를 실행합니다.`BINDIFF_ORDER`코드에 있는 것과 같은 순서로 네 가지`-O0`기능이 일치합니다`-O1`이름에 따라 버전, 그 결과는 기드라 아래 보고합니다. 수업은 두 가지 명령을 데모에 보관하므로 실패가 눈에 띄습니다. 네 개의 노드의 흐름 그래프 모양은 각 꼴입니다.`if`그리고`else`복귀 전에 합류하는

## 동일 바이트, 이전 운영체제

기드라는 객체를 수입할 때 이전을 적용합니다. 따라서 그 바이트 상관은 로드된 이미지를 비교하고, 이 때문에 마스크된 이전 필드를 적용합니다. `load_image()`이 항목은 이산된 부분을 헤더 순서로 순서대로 이동하여 각 항목을`sh_addralign`, 그리고 0x100000에서 그 값을 설정합니다.`S + A - P`서명된 32비트 값으로 작성된`R_X86_64_PC32`그리고`R_X86_64_PLT32``S + A`64 비트로 `R_X86_64_64`- 그래

레이아웃은 두 프로그램에서 시작되는 모든 섹션에서 Ghidra 12.1.4에 일치합니다. 테스트 스위트는 캡처 된 버전 추적 출력과 테스트합니다.

| Section | `-O1` program | `-O2` program |
|---|---|---|
| `.text` | 0x100000, 159 bytes | 0x100000, 271 bytes |
| `.rodata` | 0x1000a0 | 0x100110 |
| `.rodata.str1.1` | 0x1000f0 | 0x100160 |

`.text`에서 112 바이트 더 길게`-O2`,`total`그래서`.rodata`0x70 바이트 더 나아가서 시작합니다.`grade`이 두 프로그램 모두에서 0x100010에 위치하고 있습니다.`leaq`0x33의 오프셋은 0x36에서 그 이동 필드를 가지고 있으며 0x3a로 끝납니다. 이전 추가 0x10 더하기 일반적인 4는 테이블을 `.rodata+0x14`- 그래

`-O1`이미지: `0x1000a0 + 0x14 - 0x10003a = 0x7a = 122`- `-O2`이미지: `0x100110 + 0x14 - 0x10003a = 0xea = 234`. 필드 바이트는`7a 00 00 00`한 이미지로`ea 00 00 00`다른 쪽에서 46의 1 바이트가 다르고 레벤슈타인 비율은 0.978이고 정확한 바이트 단계가 실패합니다. 마스크 바이트 단계는 필드를 제로로 통과합니다.`grade_label`0x70와 같은 표로 이동하여, 이동이 같아서 두 관점에서도 정확한 바이트를 전달합니다.

지드라도 같은 분단 보고서를 제출했습니다.`-O1`반대`-O2`, 정확한 함수 바이트 일치 발견 `percent_change`그리고`grade_label`, 정확한 기능 지침 일치 그 두 가지 더 발견`grade`, 그리고 정확한 함수 미닉스 매치 같은 세 가지 발견. 명령 코레레이터는 오페란드를 마스크, 이 이동을 커버. 수업의 이미지 뷰는 정확히 두 함수와 같은 정확한 바이트 코레레이터가 발견 된 과이드라의 바이트 코레레이터와 마스크 바이트 협정을 위해 정확히 세 가지의 명령 코레레이터가 발견 한. 테스트 스위트는 두 가지 평등을 주장합니다.

6.5.0 rea `compare_functions`라인 디프스 공급자 텍스트. 집합 차원에는 "재동정상화가 불가능하다"라는 제한을 붙인다. 이 수업의 로더와 마스크는 정상화 공급을 합니다.

## 어떤 조치가

6.2.4 배`radiff2`- `-AC`이 파일은 파일과 파일을 분석하고 각각의 함수를 한 줄씩 인쇄합니다. 왼쪽 크기와 주소, MATCH 또는 UNMATCH, 비율, 그리고 오른쪽 크기와 주소.

| Pair | `percent_change` | `grade` | `total` | `grade_label` |
|---|---|---|---|---|
| `-O0` vs `-O1` | UNMATCH 0.130435 | UNMATCH 0.426829 | UNMATCH 0.106061 | UNMATCH 0.269841 |
| `-O1` vs `-O2` | MATCH 1.000000 | MATCH 1.000000 | UNMATCH 0.171429 | MATCH 1.000000 |
| `-O1` vs `-O1` | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 |

라다르2 소스의 비율은`1 - distance / max(len_a, len_b)`, 이 함수의 손가락 표기 2개와 손가락 표기 사이의 레벤슈타인 거리가 함수의 기본 블록의 주소 순서에서의 합계입니다.`radare2_ratio()``code/main.py`원본 함수의 바이트에 대한 동일한 공식을 구현하고 0.130435, 0.106061, 0.269841, 0.171429까지 6 십자수를 재생합니다.

0.426829을 재생산하지 않습니다`grade``-O0`. 함수의 118 바이트에 대한 비율은 0.296610.`118`크기의 열에 있습니다. 그 지문자루는 더 짧습니다. 적용된 이전없이 점프 테이블을 해결할 수 없습니다. 그래서 그 분석은 입력 블록에 도달합니다.`jmpq *%rax`, 기본 사례와 반환: 82 바이트, 레슨 33의 순수 재발적 하향이 주장한 같은 82`-O1`47입니다.`1 - 47/82 = 0.426829`- `-e bin.relocs.apply=true`radare2는 모든 118 바이트를 찾아서 0.288136을 인쇄합니다. 이 값은 이전된 이미지에 대한 수업 비율과 같으며, 4 개의 이동 바이트가 객체의 0 필드에서 다르기 때문입니다. 두 도구는 동일한 바이트를 비교할 때만 일치하며, 크기의 열은 어떤 바이트가 들어간지 말하지 않습니다.

`-O`손가락 표기판을 오프코드 바이트로 제한하고 오페란드를 제로로 합니다.`-O0`대조적으로`-O1`이 비율은 0.239130, 0.512195, 0.303030, 0.523810까지 증가하고,`total``-O1`대조적으로`-O2`전체 파일 거리도 존재합니다.`-s`(마이어스) 은 0.956의 유사성과 162의 거리를 보고합니다.`-ss`(레벤슈타인) 0.927 및 137. 그 숫자는 헤더, 상징 테이블, 이전 섹션과 함수들에 대해 아무 말도 하지 않습니다.

## 지드라 버전 추적 상관

지드라의 버전 추적 도구는 소스 프로그램과 목적 프로그램과 상관관계를 일치시킵니다. 함수 상관들은 정확한 함수 바이트 일치, 정확한 함수 명령어 일치 (오퍼런드 마스크), 정확한 함수 명맥 일치, 그리고 복제 함수 명령어 일치 (1:N 및 N:M) 이다. 데이터 상관들은 정확, 복제 및 유사한 데이터 일치입니다. 상징 상관들은 이름과 정확히 일치하거나 복제 또는 유사성으로 일치합니다. 참조 상관들은 더 많은 것을 찾기 위해 받아들여진 일치들을 사용합니다. 함수는 목적 프로그램에서 정의되어야 하며, 최소 함수 길이는 기본적으로 10 바이트로 설정됩니다. 자동 버전 추적은 정확한 상징 이름, 정확한 데이터, 정확한 함수 바이트, 정확한 함수 명령어, 정확한 함수 명소, 복제 함수 명령어, 다음 참조 상관관계를 실행하고, 받아들여진 항목에 대한 암시된 일치를 생성합니다. 11.2에 BSim 상관이 추가되었다.

수업은 상관관계를 머리가 없는 채로 잡았습니다.`capture_ghidra_vt.sh`3개의 객체를 프로젝트에 수입하고 실행합니다`ListVersionTrackingMatches.java`, 짧은 시나리오가 길어지는`AbstractGhidraVersionTrackingScript`,는 경로로 소스 및 목적 프로그램을 열고, 자동 버전 추적 순서에서 참조되지 않은 6 개의 상관관계를 실행하고, 블록, 함수, 상관관계 및 일치에 대한 한 줄을 인쇄합니다. 이 섹션의 모든 숫자는 이 두 텍스트 파일에서 나옵니다.

| Correlator | `-O0` to `-O1` | `-O1` to `-O2` |
|---|---|---|
| Exact Symbol Name Match | 4 functions | 4 functions, 5 data items (`labels.rel`, `.L.str.1` to `.L.str.4`) |
| Exact Data Match | 0 | 0 |
| Exact Function Bytes Match | 0 | 2 (`percent_change`, `grade_label`) |
| Exact Function Instructions Match | 0 | 3 (adds `grade`) |
| Exact Function Mnemonics Match | 0 | 3 |
| Duplicate Function Instructions Match | 0 | 0 |

각 함수는 `-O0`그리고`-O1`, 그래서 단지 이름만 일치합니다. 이것은 수업의 일치자가 빈디프 순서에서 주는 결과입니다. 모든 일치는 유사성 1.000 및 신뢰 10.000를 인쇄합니다. 도움말 페이지에서는 정확한 상관관계를 유사성 1.0 및 신뢰 1.0로 묘사합니다. 따라서 인쇄된 신뢰의 규모는 이 수업이 기록하고 해결하지 않는 열린 질문입니다.

프로그램 차이 (Program Differences) 는 도구 (Tools) 에 해당되는 다른 프로그램입니다. 이 프로그램은 바이트, 레이블, 코드 유닛, 참조, 댓글 및 동일한 주소에서 함수 같은 주소 공간을 가진 두 프로그램을 비교합니다.

## 디아포라 와 바이너리 닌자

디아포라는 2015년에 처음 출시된 IDA Pro 플러그인이며, 2026-08-18 버전 3.4.2에 출시되었다. 2.0 이후 AGPL-3.0이며 IDAPython가 필요하기 때문에 IDA Home 또는 IDA Pro에서 실행되며 IDA Free에서 실행되지 않습니다. SQLite에 각 데이터베이스를 수출하고 SQL 쿼리로 heuristics를 실행합니다. 각 유리스틱은 이름, 베스트, 부분 또는 신뢰할 수 없는 카테고리, 비율 유형 및 SAME_CPU 또는 SLOW와 같은 선택적 플래그를 가지고 있습니다. 현재 소스의 이름은 이 수업의 단계와 같은 내용입니다. 바이트 해시, 동일한 주소 및 mnemonics, 동일한 정제 집합, Mnemonics 소 원자산물, 동일한 노드, 가장자리, 루프 및 강하게 연결된 구성 요소, 토폴로지 분류 해시, 그리고 Hex-Rays 디컴파일러가 필요한 사이드코드 미묘한 해시. 발매 메모는 조율 역사를 보여줍니다: 느린 유리스틱은 약 2,000 개의 함수 아래로만 실행되며, "Same graph"는 신뢰할 수 없는 범주에 이동합니다. 이 움직임은 이 강의의 4 블록 다이아몬드입니다.

2026-09-03년에 출시된 바이너리 닌자 6.0는 공급자와 해상기들을 포함한 프레임워크로 바이너리 유사성을 추가했다. 이 회사는 이전 가능한 오페란드를 용납하는 정확한 기능 일치에 대한 구조 제공자와 WARP를 BinDiff에 배포하고, 그 가이드에서는 이전 가능한 명령어와 별도로 기능이 일치하는 WARP 및 재 컴파일 후 구조적으로 연관되어있는 BinDiff을 사용할 것이라고 말합니다. 이 기능은 Ultimate 에디션에서만 제공됩니다. 바이너리 닌자는 패키지 관리자가 설치되어 있지 않아 실행되지 않았기 때문에 이 문장은 문서에서 비롯된 것입니다.

BinDiff 자체는 Apache 2.0 버전의 v8를 통해 2023-09-25부터 오픈소스입니다. IDA Pro 9.4 또는 후기를 지원하는 BinExport 플러그인과 BinExport 플러그인이 필요합니다. 학습자의 무료 경로는 Ghidra + BinExport + BinDiff 명령 줄입니다. 수업은 실행되지 않았습니다. 그리고 그 연습 연구소는 귀하에게 요청합니다.

## 동일한 코드, 다른 상수

36강좌는  후보 재건을 유지했습니다`grade`그 표는 마지막 항목으로 3을 가지고 있고, 원본은 4을 가지고 있습니다. `grade_case10_wrong.o`46바이트 코드와 동일한`grade``-O1`. 일치하는 것은 모든 서명이 동의하는 바이트에 맞춰서 일치합니다. 참조 테이블 체크는`1, 2, 3, 4, 4`한 번 이사를 통해`1, 2, 3, 4, 3`다른 국가와 보고서를 통해`dataEqual: false`다른 세 명`-O1`좌측에서 함수들이 무궁화하기 때문에 후보 객체는 하나의 함수를 가지고 있기 때문입니다.

패치 분석 형태입니다. 바이트에서 멈추는 함수 차이가 아무 것도 변경되지 않는다고 말합니다. 지드라의 정확한 데이터 일치와 빈디프의 문자열 참조 일치는 같은 이유로 존재한다. 수업의 버전은 작습니다. 각각의 부쌍에 대해 바이트를 비교하여 각각의 함수의 이전 포인트를 확인합니다.

## 상징적 실행: 경로, 조건, 해결자

킹은 1976년 상징적 실행을 기술했다. 입력은 상징이 된다. 각 문장은 상징적인 저장소를 업데이트한다. 각 가지는 경로에 조건이 추가되고, 해상자는 경로가 실현 가능한지 여부를 결정하고 그 다음의 구체적인 입력을 생성한다. 가지의 함수는 경로의 나무가 되고, 잎은 조건이 첨부된 반환이다.

발도니, 코파, 디엘리아, 데메트레스쿠, 피노키는 2018년에 이 지역을 조사했습니다. 그들의 섹션 5은 중앙 비용으로 경로 폭발을 이름 붙여줍니다. 실행자는 모든 가지에서 포크를 할 수 있으므로, 국가 수는 가지의 수에서 기하급수적으로 증가 할 수 있으며, 경계가 상징적 입력에 의존하는 루프는 무제한 일련의 경로를 제공합니다. 그들이 나열한 완화들은 각 분자에서 해결함으로써 실현 불가능한 경로를 절단하고, 함수와 루프의 요약, 상태 합병 및 미흡한 근접을 말합니다. 콘콜릭 실행은 프로그램을 동시에 구체적이고 상징적으로 실행하고, 콘크리트 실행에 따라 조건을 기록하고, 하나를 부정하고, 다음 입력을 해제자에게 요청합니다. DART (2005), CUTE (2005), SAGE (2008) 는 이름 붙여진 시스템이다.

KLEE (Cadar, Dunbar, Engler, OSDI 2008) 는 LLVM 비트코드에 대한 상징적인 가상 기계입니다. 따라서 입력값은 `clang -emit-llvm`이 프로그램은 POSIX 환경 모델과 재생 라이브러리를 배포한다. 89 GNU 코루틸 프로그램에서는 개발자의 테스트에서 67.7%에 비해 84.5%의 라인 커버리를 달성했으며 56 개의 심각한 버그를 발견했습니다. KLEE 3.2는 NCSA 라이선스 아래 2025-12-23에 출시되었으며 LLVM 16이 권장되었습니다.

Angr는 바이너리에서 작동합니다.`angr.Project`객체를 지도하고 이전을 적용하는 CLE 로더, 블록을 VEX IR로 변환하는 리프트 (`block.vex`) 를 대체하여 파이프코드를 사용하며, 국가에 대한 공장을`SimState`레지스터, 메모리, 그리고 해제기를 보관합니다.`SimulationManager`국가들의 단계 저장소 이름`active``deadended``found``avoided`그리고`errored`그리고`explore(find=..., avoid=...)`각 단계에 따라 엔진이 순서대로 실행됩니다: 실패, syscall, 할크, 콘크리트 데이터에 대한 유니콘, 그리고 VEX는 후퇴. claripy는 Z3에 대한 해제 전 끝이며, Angr 10.0에서는 수입 된 자동화 된 Rust 구현입니다`from angr import claripy`.angr 10.0.3는 2026-10-10에 업로드되었으며, BSD-2-클라즈이며, 파이썬 3.12 또는 후 버전이 필요합니다. MIT에 의해 2026-08-16에 출시 된 Z3 5.1.0,는 angr, Triton 및 KLEE의 선택적 백엔드의 해결 장치입니다.

## 34 IR 교훈 을 넘나들 는 작은 집행자

에 있는 집행자`code/main.py`수업의 표현 모양이 있는 작은 IR를 사용합니다.`Assign``Branch``Jump``Return`, 더해`Switch`34강의 연습실이 요청한 단말기입니다.`Const``Var``Bin`너비로`Cast``Load`이름 붙여진 콘크리트 테이블에서`Not`. 네 개의 고정 기능은 단순화 후 레벨 34에 도달하는 단계에서 손으로 들어갑니다.`0x66666667`곱하기가 되었습니다`score / 10`, 그리고 모든 IR 블록은`check_ir_against_listing()`주소가 함수의 목록을 정확히 한 번 포함한다고 주장합니다.

`grade``-O0`이 IR에:

```text
0x30: local_8 = score; local_10 = score / 10 - 6; if (local_10 >u 4) goto 0x9a else 0x62
0x62: switch local_10 -> 0x91, 0x88, 0x7f, 0x76, 0x76
0x76: local_4 = 4; goto 0xa1        0x7f: local_4 = 3; goto 0xa1
0x88: local_4 = 2; goto 0xa1        0x91: local_4 = 1; goto 0xa1
0x9a: local_4 = 0                    0xa1: return local_4
```

  전환 목표가`jump_table_targets()`, 레슨 33와 같은 이전 수학적, 그래서 IR는 고정된 것을 읽습니다.

`execute()`경로 상태의 작업 목록을 유지합니다. 상태는 현재 블록, 블록의 흔적, 상태 목록 및 입력값에 대한 각 변수를 표현으로 매핑하는 환경을 가지고 있습니다. `Assign`환경이 원천으로 대체되고 결과를 저장합니다. `Branch`조건에 대입하고, 두 번 해제자에게 요청합니다. 한 번 조건이 추가되어, 한 번 부정되어. 해제자가 만족시킬 수 없는 한쪽은 떨어집니다. 이는 조사에서 묘사한 열망한 절단입니다. `Switch`표 항목을 목표에 따라 그룹화하고 포크를 개별 목표에 따라 입력 평등의 분해와 함께 한 번 묶습니다. Angr은 상징적인 점프 목표도 그렇게 처리합니다. `Return`그 값에 대입하여 잎을 닫습니다. 단계 한계를 넘어선 흔적이 단축된 경로를 표시하고 그것을 멈추게 합니다.

  길을 따라가`return 4`수동으로 입력합니다`local_10 = score / 10 - 6`- 지점 상태`local_10 >u 4`이 경로에서 잘못된 상태이기 때문에 조건 목록은 유효합니다`!(score / 10 - 6 >u 4)`. 스위치 입력 3 및 4 둘 다 0x76에 지점을 두면, 가려구로 0x76에 추가됩니다 `score / 10 - 6 == 3 || score / 10 - 6 == 4`. 블록 0x76의 할당`local_4 = 4`, 0xa1로 점프하고, 반환이 `4`이 잎은 그 조건과 그 값의 쌍입니다.

해결 방법은`BoundedSearch`. 입력당 한 개의 제한된 도메인을 보유하고 있으며, 도메인의 곱셈을 수록하고, C 의미로 각 제약을 평가합니다. 32 비트 랩라운드, 트롱킹 나눔, 서명 및 서명되지 않은 비교, 수학적 또는 논리적 전환. 0 으로 나뉘거나 테이블 외부의 테이블 인덱스는 그 제약을 실패하게 만듭니다.`score`-200에서 1200까지 5개의 경로`grade`값은 44,460 평가를 몇 밀리초. 입력 집합에 대한 각 잎을 해결하면 다음과 같습니다.

| Leaf | Returns | Condition | Scores in the bound |
|---|---|---|---|
| 0x76 | 4 | `!(q >u 4) && (q == 3 \|\| q == 4)` | 90 to 109, 20 inputs |
| 0x7f | 3 | `!(q >u 4) && q == 2` | 80 to 89, 10 inputs |
| 0x88 | 2 | `!(q >u 4) && q == 1` | 70 to 79, 10 inputs |
| 0x91 | 1 | `!(q >u 4) && q == 0` | 60 to 69, 10 inputs |
| 0x9a | 0 | `q >u 4` | 1,351 inputs, the rest of the bound |

`q``score / 10 - 6`같은 수업이 나온다`grade``-O1`, IR가 두 개의 경로를 가지고 있는 경우 테이블 경로가 돌아옵니다 `lookup_14[q]`그리고 기본 경로로로 0을 반환하면, 질문은 반환된 값에 대한 제약이 됩니다. 왜냐하면 도달할 수 있는 케이스 블록이 없기 때문입니다.`lookup_14`객체의 `.rodata`0x14에

한계란 방법의 한계이다. 한계 검색은 영역 내부에서 완료되고 그 외부에서 침묵합니다. -200에서 1200 사이에는 60에서 109의 어느 점수가 0을 반환하지 않으며 110 또는 그 이상의 점수가 0가 아닌 값을 반환하지 않습니다. z3는 모든 2^32 점수에 대해 둘 다 증명하고 다음 섹션에서는 두 방법이 다른 증인들을 반환하는 것을 보여줍니다.

## 경로 폭발 측정

`total``-O1`이 강의 33의 순환입니다.`count`, 더하는 루프 몸`values[rdx]`그리고 증가`rdx`, 그리고`jne`몸으로 돌아가는 동안`rdx != rcx`. IR에서`rcx` `zext64(count)`그리고`rdx`0에서 시작됩니다. 뒷변의 갈래를 통과하는 각 경로가 `rdx != count``rdx`이 변수는`count = c`몸의 주위를 `c`시간과 출구`count`0에서 2까지 제한된 실행자는 3 개의 경로를 찾습니다. 0에서 4까지 5을 찾습니다. 0에서 8까지 9을 찾습니다. 각 경로는 그 수의 삼각형 합을 반환합니다. (0, 0), (1, 1), (2, 3), 최대 (8, 36). angr은 3, 5 및 9 마감된 상태를보고하고 같은 9 개의 수와 합이쌍을 모두 세 가지 최적화 수준에서 제공합니다.`-O2`, 이 벡터 루프에는 최소 8의 수치가 필요하며 따라서 이 범위의 경로 수치가 절대 변하지 않습니다.

무제한 실행자는 결코 끝나지 않습니다. 왜냐하면 모든 반복 계산은 더 가능한 한 길이기 때문입니다.`count`64까지, 22개의 경로를 반환하고, 2를 줄이고, 65개 중 다른 41개를 시작하지 않습니다. 보고서는 그 세 개의 숫자를 제공합니다. 해상 비용은 또한 증가합니다.

## 같은 질문들에 대한

`capture_angr.py`CLE는 각 이동 가능한 객체에 ELF 백엔드를 0x400000로 로드했습니다.`-O0`그리고 다른 8개에 대해 4개의 상징을 풀어주었습니다.`grade`하나의 상징적인 64비트 논리로,`run()`5개 국가로 끝났습니다`-O0`그리고 2개`-O1`그리고`-O2`, 0.475, 0.408 그리고 0.318초에`eax == v`각 미제한 국가에 대해 해상자에게 서명된 최저와 최대값을 요청하여 60~69, 70~79, 80~89, 90~109을`v`각 레벨에서 1에서 4까지, 그리고 -2147483648에서 2147483647까지 0.

CFGFast을 사용했던 Reach-a-block 폼`grade``-O0`, 8개의 블록을 나열한 33번 강의 발견,`explore(find=0x400076)`4을 저장하는 블록에 대해 0.47초 동안 3개의 상태가 여전히 활성화되어 있는 상태가 하나, argument에서 최소 90개와 최대 109개와 샘플 91, 93, 94, 97, 101개와 함께 발견되었습니다.

`percent_change`, 두 개의 정해진 국가와 제한`before[31:0] != 0`그리고`before[31:0] == 0`0이 아닌 상태를 요청합니다`eax == 50`   `before = 21055744, after = 332315210``-O0``40566804, 834296877``-O1`그리고`-24484867, 993934694``-O2`- 16에서 16까지의 제한된 검색은`before = -10, after = -15`. z3에서 같은 질문을 던졌습니다.`before = -25092599, after = 305712160`. 테스트 스위트는 IR 평가자와 함께 다섯 쌍 모두 평가하고 각각 50을 제공합니다. 모델은 입력이 존재한다는 것을 증명합니다. 입력이 아닙니다. 그리고 세 가지 올바른 도구는 세 가지 다른 것을 제공합니다.

`capture_z3.py`모델 `-O1` 목록`grade`32 비트 비트 벡터와 곱, 두 시프트, 테이블, 그리고 4 가지 더 질문을 합니다.`switch`32 비트 점수를 위해: 0.068 초에 설정되지 않은, 그래서 컴파일 함수는 모든 2^32 입력에서 원천과 같습니다. 목록은 수업 36의 임계점 재구성에서 다릅니다: 점수를 706346536에서 설정했습니다.`score / 10`이 값은 70634653이고, 스위치는 기본값으로 떨어지고, 문턱이 반환되는 동안 4. 0에서 109까지 제한된 동일한 차이점은: 만족하지 못하기 때문에, 수업 36의 그리드는 그것을 볼 수 없었습니다.`percent_change``before == 3`결과 -133은 `after = 1073741823`, 36강의 초창기 세포, 그리고 제한된 검색은 그 영역 안에 두 번째 목격자를 찾습니다.`after = -1`, 어디`(-1 - 3) * 100 / 3`-133으로 줄여서, 전혀 과수되지 않습니다.

## 건설 해

디모를 실행하세요:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
```

출력은 하나의 JSON 보고서입니다. `diffs`객체 파일 및 로드된 이미지 일치 `-O0`반대`-O1`그리고`-O1`반대`-O2`, 더해`-O0`디프 순서에서 쌍`toolComparison`각 함수에서 radiff2 판례와 비율과 Ghidra 상관관계를 따라 수업의 단계를 설정합니다. `patch`이 `grade_case10_wrong.o`사건`radare2Ratios`radiff2 숫자를 복제합니다.`gradeRelocationCase`레이아웃과 두 개의 이동을 보여 줍니다.`symbolic`경로, 수업, 폭발 수를 가지고 있습니다.

읽으세요`code/main.py`이 순서로:

1. `ElfObject`섹션, 상징, 그리고`.rela.*`기록`parse_listing()``llvm-objdump`문자
2. `jump_table_targets()`그리고`build_cfg()`접근 가능한 블록과 타이핑한 가장자리를 제공합니다. `FunctionRecord.signatures()`5개의 서명들을 만들어냅니다.
3. `load_image()`할당된 부문을 규정하고 적용합니다 `S + A - P`그리고`S + A`- 그래
4. `match_functions()`은 은 은 은 은 은`levenshtein()`그리고`radare2_ratio()`비슷한 것을 보여드리겠습니다.
5. `parse_radiff2()`그리고`parse_ghidra_vt()`비교를 위해 캡처된 도구 출력을 읽어보십시오.
6. `evaluate()``substitute()`그리고`BoundedSearch`표현의 의미와 해상자입니다.
7. `execute()`경로를 나열합니다.`solve_returns()`각 잎에 입력 집합을 요청합니다.
8. `grade_ir_o0()``grade_ir_o1()``percent_change_ir_o1()`그리고`total_ir_o1()`이 책들은 그들의 명령 주소를 담고 있는 손높이기입니다.

3개의 명령이 더 있습니다.`python3 code/main.py diff A.o B.o`이 두 개의 객체를 구분하여 그 목록이 옆에 위치하고 있습니다.`--image`로드된 이미지를 구분합니다.`python3 code/main.py paths grade O0`하나의 함수의 경로와 클래스를 인쇄합니다. `paths total 8`이 있는 루프`python3 code/main.py figure-data`상호작용적인 그림이 삽입한 데이터를 인쇄합니다.

## 사용 하 고

이 순서로 differ과 exec를 두 개의 프로그램에서 사용하세요.

1. 각 객체에 대한 목록을 캡처하고 `function_record()`바이트에 대한 확인을 하고 다른 모든 것보다 먼저 리스트를 수정해
2. 먼저 객체 파일을 구분하여 매체의 단계를 읽어보고 두 번째 서명이 동의할 때까지 흐름 그래프 모양의 일치를 제안으로 간주하십시오.
3. 로드된 이미지를 구분합니다. 정확한 바이트에서 마스크된 바이트로 이동하는 함수는 데이터에 비해 이동하고, 이동 수학적 값은 이동한 섹션에 이름을 붙입니다.
4. 각각의 일치에 대한 참조 테이블을 비교하십시오. 다른 상수들을 가진 동일한 코드
5. 이름 단계를 실행하고 비교하십시오. 빌드에는 상징이있을 때, BinDiff 순서를 실행하고 구조 결과를 단계별로 분류하는 데만 사용합니다.
6. 도구가 비율을 보고할 때, 자신의 것과 비교하기 전에 어떤 바이트가 들어간지 알아보십시오.
7. 입력값을 원하는 함수의 경우 IR를 각 문장에 한 주소를 입력하여 실행합니다.`execute()`각각의 상징적인 루프 카운터에 한계를 넣고, 각각의 페이지를 풀고 그 결과를 보고하세요.
8. 같은 질서를 angr 또는 z3로 실행하여 클래스 한계를 비교하십시오. 샘플은 하나의 모델입니다.

## 인터랙티브 연구소

### 연구소 A: 5개의 서명

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution/code
python3 -q
```

실행:

```python
from main import *
grade = {r.name: r for r in fixture_records("ledger-x86_64-O1.o")}["grade"]
grade.raw.hex(" ")
grade.masked_bytes() == grade.raw
grade.mnemonics
grade.cfg_shape()
grade.signatures()
```

인쇄하기 전에 함수의 0x26의 오프셋에서 네 바이트를 적어 `grade.raw`그럼 같은 라인을 계속 `grade``ledger-x86_64-O0.o`그리고 계산해봐`table`   가장자리`grade.edges`- 그래

### B 실험실: 이전을 관찰해

```python
case = grade_relocation_case()
case["layout"]
case["displacements"], case["rodataShift"]
case["objectBytesEqual"], case["imageBytesEqual"], case["maskedImageBytesEqual"]
```

계산`0x100110 + 0x14 - 0x10003a`읽기 전에 종이 위에`displacements`그럼 기지를 바꿔`load_image()`0x400000에 대해 확인하고 두 오퍼랜드가 함께 움직이기 때문에 이동이 변하지 않는다는 것을 확인합니다.

### 실험실 C: 거짓 일치와 그것을 피하는 순서

```python
report = diff_fixtures("ledger-x86_64-O1.o", "ledger-x86_64-O2.o")
[(m.left.name, m.right.name, m.stage) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o")
[(m.left.name, m.right.name, m.stage, m.names_agree) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o", stages=BINDIFF_ORDER)
[(m.left.name, m.right.name, m.stage) for m in report.matches]
```

인쇄`records(...)["percent_change"].cfg_shape()``-O0`그리고`grade_label``-O1`그리고 두도 순서들을 읽어 보세요. 그리고 세분화된 모닉을 해시하는 여섯 번째 단계를 써보세요.

### 연구소 D: 경로와 경계가

```python
report = grade_paths("O0")
[(p["trace"], p["condition"], p["returns"]) for p in report["paths"]]
report["returns"]["4"]
total_paths(2), total_paths(4), total_paths(8)
total_paths(64, step_limit=24)["truncated"]
```

변화`SCORE_DOMAIN` `range(0, 110)`그리고 다시 실행`grade_paths("O0")`. 0의 클래스는 60개의 입력으로 줄어들고 두 개의 크로스 체크가 여전히 유지됩니다.`range(90, 100)`어떤 잎이 전혀 모델이 없는지 읽어보세요.

## 연습 실험실

뱅디프를 켜고 이미 3가지 결과와 비교해 보세요.

요구 사항:

- Ghidra 12.1.4에 BinExport 확장 프로그램을 설치하고 세 개의 리저 프로그램을 수출하고 BinExport 발매 태그와 Ghidra 버전을 기록하십시오.
- BinDiff 8 명령 줄을 설치하고 `-O0`대조적으로`-O1`그리고`-O1`대조적으로`-O2`유사성만 선택의 결과
- 각 기능에 대한 유사성과 신뢰성을 파악합니다.`code/fixtures/`정확한 명령으로`build_fixtures.sh`- 그래
- 확장`tool_comparison()``bindiff`          `-O1`대조적으로`-O2`수업의 마스크 바이트 세트와 함께
- BinDiff 알고리즘을 사용하는 한 문장을 작성하십시오.`grade`그리고 로드된 이미지를 비교했는지 여부를

성공은 데모가 각각의 함수마다 4개의 도구 열을 인쇄하고 새로운 테스트는 1개의 평등이나 1개의 설명된 차이를 나타냅니다.

## 교훈 유물

이 교훈은`outputs/skill-binary-diffing-and-symbolic-execution.md`. 두 개의 빌드와 함수를 매칭에 대한 명시된 품질과 함께 단계적 차이로 변환하는 데 사용하며, 모든 비교되지 않는 또는 변경된 함수의 설명과 한 잎에 대한 해결된 입력 집합과 그 결과를 낳은 경계와 함께 경로 보고서를 사용합니다.

## 확인 해 보

데모와 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

검증은 다음과 같은 사실을 증명해야 합니다.

- 기호 테이블은 크기가 46, 118, 66, 39인 4개의 함수를 `-O0`, 16, 46, 31, 63`-O1`, 그리고 16, 46, 140, 63`-O2`
- `.rela.text``-O1`객체에 대해 설명`llvm-objdump -r`인쇄
- 목록에 있는 모든 명령어는 상징 범위와 바이트가 객체와 같으며 변경된 바이트는 증가합니다.
- `total``-O1`5개의 블록, 5개의 가장자리, 1개의 자기 루프가 있고, 그 모양의 문자열은 결정적인
- `grade``-O0`5개의 점프 테이블 목표물을 복구합니다`.rela.rodata`8개와 11개의 가장자리가 있나니
- 테이블이 없는`grade``-O0`4 블록으로 82 바이트를 달성합니다
- `percent_change``-O0`그리고`grade_label``-O1`같은 4개 블록 모양
- 정확한 해시와 마스크된 해시가 이전 가능한 객체의 모든 함수에 동의합니다
- `-O1`그리고`-O2`3개의 함수들을 위한 바이트를 공유합니다.`-O0`그리고`-O1`공유하지 않습니다
- 참조된 표`grade`읽는다`1, 2, 3, 4, 4`그리고 후보자의 독서`1, 2, 3, 4, 3`
- 로더 장소`.text``.rodata`그리고`.rodata.str1.1`그리드라가 두 프로그램에 모두 참여시켰습니다.
- `R_X86_64_PC32`이 글은`S + A - P`그리고 이끄는 122, 그리고`R_X86_64_64` 항목`.data`문자열 주소를 수신
- `grade`바이트는 객체에서 일치하고 0x70의 변화로 이미지에 차이가 있으며 마스킹은 일치를 회복합니다
- `-O1`대조적으로`-O2`정확한 바이트에 3개의 함수를 일치합니다`total`이름; 이미지 보기 일치합니다 `grade`1 - 1/46의 유사성을 가진 마스크된 바이트에 의해
- 수업 순서는 1개의 잘못된 흐름 그래프 모양 일치를 생성합니다.`-O0`대조적으로`-O1`, 그리고 BinDiff 순서는 네 명과 일치합니다
- 패치 후보자는 바이트에 일치하고 참조된 데이터에 실패합니다
- 레벤슈타인 비율은 0.130435, 0.106061, 0.269841, 0.171429, 0.426829을 82 바이트에 걸쳐 재생하고, 이전된 바이트 비율은 이전된 바이트를 적용한 라디프2 프린트
- radiff2의 MATCH 집합은 exat-byte 단계와 같으며, Ghidra의 byte와 명령어 상관들은 image view의 exat 및 masked set에
- 지드라는 이름만 찾았어`-O0`대조적으로`-O1`, 모든 경기에서 1.0의 유사성과 10.0의 신뢰성을 가진
- 손으로 들어올린 IR는 목록에 있는 모든 명령어를 한 번 포함하고, 평가자는 C 의미론을 따르고 있습니다.
- `grade`5개의 경로를 가지고 있습니다.`-O0`                        `-O1`같은 클래스
- 제한된 클래스 60~69, 70~79, 80~89, 90~109 세 가지 레벨에서 모두 같은 각도와 z3'를, 5과 2개의 미완성 상태와 90~109의 범위의 블록
- 두 개의 크로스 체크는 bound, angr, 또는 z3에서 모델이 없습니다. z3는 목록이 소스 스위치와 같다는 것을 증명합니다.
- 모든`percent_change`한정된 검색, angr, z3에서 모델은 요청된 값으로 평가합니다
- `total`3과 5, 9개의 길이와 삼각형 합이, angr와 같을 수 있고, 단계 뚜은 22을 반환하고 2를 줄이고
- 그림 데이터는 두 개의 조회, 이전 번호, 그리고 입력 집합과 함께 다섯 개의 잎을 포함하고 있으며 사이트 모듈은 동일한 데이터를 포함합니다

## 생산 실패 모드

| Failure | What the weak tool reports | What the analysis must prove |
|---|---|---|
| Byte hash on a loaded image | "grade modified" between two builds with identical code | The field offset, the two displacements, and the section shift; the masked hash matches |
| Masked hash on a relocatable object | "masking made no difference" | The fields were already zero; the relocation records and the referenced constants carry the change |
| Flow-graph shape alone | A confident pair of unrelated functions | A second signature agrees, or the names contradict and the match is dropped |
| Names before structure on a stripped build | Nothing matches | The structural stages with their qualities, and the unmatched list |
| A ratio compared across tools | "radiff2 says 0.43 and the lesson says 0.30" | Which bytes each side fingerprinted; 82 bytes without relocations, 118 with |
| Same code, different constant | "exact match" | The table read through the relocation and the bounds check |
| One model reported as the input | "the score is 90" | The class 90 to 109 with its count, and the bound it was found in |
| Bounded search reported as unsat | "no input gives -133" | Unsat inside the bound only; z3 finds 1073741823 outside it |
| Symbolic loop without a bound | A timeout | The bound or the cap, the paths returned, truncated, and never started |
| Closed tool described as run | Numbers with no capture | A capture file with the command and version, or a sentence saying documentation only |

## 운영 규칙

한 번에 한 서명에 일치하고, 양쪽에서 고유한 값을만 받아들이고, 경기와 함께 스테이지와 그 품질을 유지하십시오. 객체와 로드 된 이미지를 구별하고 두 가지 사이의 스테이지 변경 기능을 설명하십시오. 각 지분에서 해제기로 경로를 나열하고, 모든 상징적인 루프를 묶어 그 경계로 입력 집합을 보고하십시오. 경계없는 단일 모델은 샘플입니다.

## 더 많은 읽기

- [BinDiff concepts: matching strategy, algorithms, and quality ratings](https://github.com/google/bindiff/blob/main/docs/concepts.md)
- [BinDiff repository and the v8 open-source release](https://github.com/google/bindiff/releases/tag/v8)
- [BinExport README: IDA Pro, Binary Ninja, and Ghidra exporters](https://github.com/google/binexport)
- [Flake, "Structural Comparison of Executable Objects" (DIMVA 2004) and Dullien, Rolles, "Graph-based comparison of Executable Objects" (SSTIC 2005), shipped in the BinDiff repository](https://github.com/google/bindiff/tree/main/docs/papers)
- [Diaphora README and heuristics source](https://github.com/joxeankoret/diaphora)
- [Ghidra Version Tracking correlators help page](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/VersionTracking/src/main/help/help/topics/VersionTrackingPlugin/VT_Correlators.html)
- [Ghidra Auto Version Tracking help page](https://www.ghidradocs.com/11.0_PUBLIC/help/VersionTracking/help/topics/VersionTrackingPlugin/VT_AutoVT.html)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Binary Ninja 6.0 "Krypton" release notes](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)그리고[Binary Similarity user guide](https://docs.binary.ninja/guide/similarity.html)
- [radare2 book: radiff2](https://book.rada.re/tools/radiff2/intro.html)그리고[radare2 6.2.4 source](https://github.com/radareorg/radare2/releases/tag/6.2.4)
- [King, "Symbolic execution and program testing" (CACM 1976)](https://dl.acm.org/doi/10.1145/360248.360252)
- [Baldoni et al., "A Survey of Symbolic Execution Techniques" (ACM Computing Surveys 2018)](https://dl.acm.org/doi/10.1145/3182657)
- [Cadar, Sen, "Symbolic execution for software testing: three decades later" (CACM 2013)](https://dl.acm.org/doi/10.1145/2408776.2408795)
- [Cadar, Dunbar, Engler, "KLEE: Unassisted and Automatic Generation of High-Coverage Tests for Complex Systems Programs" (OSDI 2008)](https://www.usenix.org/legacy/events/osdi08/tech/full_papers/cadar/cadar.pdf)그리고[KLEE 3.2 release](https://github.com/klee/klee/releases/tag/v3.2)
- [Shoshitaishvili et al., "SoK: (State of) The Art of War: Offensive Techniques in Binary Analysis" (IEEE S&P 2016)](https://oaklandsok.github.io/papers/shoshitaishvili2016.pdf)
- [angr documentation: loading, simulation managers, and the simulation pipeline](https://docs.angr.io/en/latest/core-concepts/toplevel.html)그리고[angr 10.0.3 on PyPI](https://pypi.org/project/angr/)
- [Z3 5.1.0 release](https://github.com/Z3Prover/z3/releases/tag/z3-5.1.0)
- [Triton dynamic binary analysis library](https://github.com/JonathanSalwan/Triton)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Table 4.9: Relocation Types](https://gitlab.com/x86-psABIs/x86-64-ABI)
