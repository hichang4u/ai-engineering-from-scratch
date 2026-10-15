# 이진 분석 에서 증거, 신뢰 및 알려지지 않은 것

> 컴파일된 프로그램에 대한 발견은 해시, 신뢰, 권위, 그리고 표시할 수 없는 목록이 있는 기록입니다.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32 (ELF from scratch), Phase 13 · 33 (disassembly and control flow), Phase 13 · 34 (lifting to pseudocode)
**Time:** ~105 minutes

## 학습 목표

- REA의 모델에 따라 증거 기록을 구축합니다`Evidence`관찰, 추론 및 추론된 신뢰를 가진
- 파일이 다른 폴더로 이동할 때 동일한 내용 해시 ID를 계산합니다.
- 각 공급자가 기록으로 이동하는 한계로 표시할 수 없는 것을 기록하십시오.
- 함수의 관찰된 실행이 이를 뒷받침하기 전까지는 결과를 명시하는 것을 거부한다.
- 남은 미지의 기록은 해시 체인으로 결합된 수정된 기록으로 보관합니다.
- 캐시 제공자는 정확한 키로 응답하고 오래된 재생을 거부합니다.

## 문제

에이전트를 물어봐`grade``ledger-x86_64-O1.o`55점으로 반환합니다. 에이전트는 rea를 호출하고 Ghidra의 사이드코드를 읽고 0에 답합니다. 리뷰어는 에이전트가 어떻게 알고 있는지 묻습니다. 에이전트는 Ghidra가 인쇄한 텍스트 블록을 가지고 있습니다. 기본 경로에서는 그 텍스트가 읽습니다.`uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);`이 시점에서 바이트는`xor eax, eax`- 그래

표현과 명령 모두 모든 입력에 대해 0을 생성합니다. 에이전트는 그것을 알지 못했습니다. 그것은 텍스트를 신뢰했습니다. 왜냐하면 도구가 그것을 생성했기 때문입니다. 2026 년 연구에 따르면 3 에이전트는 24 개의 역공학 작업에 대해 실행했습니다 ([NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)) 는 훈련 편견, 관찰에 대한 과도한 신뢰, 맥락 제한 및 계획 지속성 등 4 가지 반복적인 약점을 언급했습니다. 또 다른 2026 연구에서는 바이너리 안에 텍스트를 심어 40 가지의 사례 중 35 개에서 모델이 심어 놓은 안전하지 않은 행동을 제안했다고 발견했습니다 ([arXiv 2607.12507](https://arxiv.org/abs/2607.12507))

rea 6.5.0은 에이전트에 이를 위한 어휘를 제공합니다.`Evidence`기록`confidence``observed``derived`또는`inferred`,`authority`, 그리고 목록`limitations`. 패키지 기술 은 에이전트 에게 이렇게 말 합니다. "모든 결론 은 관찰, 추론, 그리고 알려지지 않은 것 을 구별 해야 합니다. 증거 인증을 인용 하십시오. 제한 과 불완전 한 포괄 을 유지 하십시오. 그리고 결코 정적 분석 은 관찰 된 실행 을 의미 하지 않습니다".

3가지 요소가 그대로 남아 있습니다. 스냅샷은 분석이 아닌 정확한 쿼리 결과를 캐쉬합니다. 비교 차원이 변하지 않을 때 검증은 주장을 통과합니다. 그리고 자체 댓글은 패스가 "전 세계 구현 동등성을 확립하지 않습니다".`verified`그 안에서

이 수업은 단순한 파이썬으로 부족한 부분을 구성합니다. 당신은 장치에 대한 모든 사실을 기록으로 저장하는 리저를 작성합니다.`percent_change`그리고`grade`2개의 실제 레코드와 그 스냅샷을 가져와서, 해시 레아가 작성한 모든 해시 레아를 다시 계산합니다.

```figure
re-evidence-ledger
```

## 신뢰 를 나타내는 세 단어, 권위 를 나타내는 다섯 단어

`confidence`세 값이 있는 enum이고, 결코 숫자가 아닙니다.`authority`5가지 값이 있습니다. 생산자가 아무 말도 하지 않을 때, rea는`shipped-artifact``observed`- 그래

| Value | Meaning on the fixture | Records in this lesson |
|---|---|---|
| `observed` | A fact read from bytes or from a run | the ELF reader's section and symbol reads, the two Ghidra records, 17 host runs |
| `derived` | A fact computed from observed records | the switch table model, the division model, every unknown mutation |
| `inferred` | An expectation that no observation states yet | 18 predictions |
| `shipped-artifact` | The file on disk was the source | every read of `ledger-x86_64-O1.o` |
| `controlled-replay` | A run you controlled produced the fact | the host runs of `harness.c` |
| `analyst-inference` | Your own judgement | predictions and unknown mutations |
| `historical-reference` | An older source tree or document | none here |
| `external-service` | A service outside the file and the host | none here |

두 가지 혼란은 가장 많은 시간을 소요합니다. 첫 번째 것은 사이드코드를 행동 관찰으로 간주합니다. 그것은 지드라가 인쇄한 것에 대한 관찰입니다. 두 번째는 빈 목록을 존재하지 않는다는 증거로 간주합니다. rea의 디자인 메모는 엄격합니다. "실종 된 커버리는 알려지지 않습니다.`code/main.py`두 가지 규칙을 암호화합니다.

## 기록

기록에는 정확히 16개의 필드가 있고, rea 6.5.0는 다른 필드를 거부합니다.`code/main.py`레아와 동일한 이름을 유지하기 때문에 양쪽의 기록이 다른 쪽에 유효합니다.`relationship_coverage`,는 호출자 또는 호출자의 목록이 얼마나 완전했는지 보여줍니다.`complete``partial`또는`unknown`또는`null`작전에서 전화 연결이 없는 경우

| Field | What it holds |
| --- | --- |
| `evidence_id` | `ev_` and 64 hex digits, a hash of the content |
| `subject` | `name`, `digest.sha256`, `format`, `architecture`, `local_path`, or `null` |
| `provider` | `id`, `name`, `version` or `null` |
| `analysis_profile` | the provider's settings and their digest, or `null`, always present |
| `predicate_type` | a tag, `rea.analysis` by default |
| `operation`, `parameters` | the tool and its input |
| `raw_result`, `normalized_result` | provider output and the canonical result |
| `confidence`, `authority` | the enums above |
| `environment` | `id`, `platform`, `architecture`, `isolation`, or `null` |
| `limitations` | plain sentences |
| `relationship_coverage` | `status` `complete`, `partial`, or `unknown` with diagnostics, or `null` |
| `locations` | `address`, `address-range`, `artifact-path`, `file-offset`, `file-offset-range` |
| `evidence_links` | the `ev_` ids this record rests on |

이것은 진짜 레아가 쓴 기록입니다`grade`여기 중요한 분야로 줄여서 전체 파일은`code/fixtures/rea-evidence-grade.json`, 37,573바이트

```json
{
  "evidence_id": "ev_67b6d3f992eaf49a2e16de084b6ebfdd9884e8c5c7f75e175b7bb20f4f748ce1",
  "subject": {
    "name": "ledger-x86_64-O1.o",
    "digest": { "sha256": "9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f" },
    "format": "elf",
    "architecture": "x86_64",
    "local_path": "/private/tmp/aiefs-re/phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/code/fixtures/ledger-x86_64-O1.o"
  },
  "provider": { "id": "ghidra", "name": "Ghidra", "version": "12.1.4" },
  "analysis_profile": {
    "provider": { "id": "ghidra", "name": "Ghidra", "version": "12.1.4" },
    "parameters": { "jump_table_evidence": "typed-case-default-blocks-v1", "import_mode": "ephemeral-source-immutable" },
    "digest": "9c7f6b24be69294e61da046e4583e3856cb9e40433b149c1bf8bb534d2fe03ef"
  },
  "operation": "analyze_function",
  "parameters": { "procedure": "grade" },
  "confidence": "observed",
  "authority": "shipped-artifact",
  "environment": null,
  "limitations": [
    "Default-space addresses use lowercase 0x-prefixed hexadecimal; other address spaces use <percent-encoded-space>:0x<hex>.",
    "Resolved reference metadata identifies computed, indirect, external, call, jump, and data edges; unresolved targetless flows remain unknown, and function classifications distinguish thunks and externals."
  ],
  "relationship_coverage": {
    "status": "complete",
    "diagnostics": [
      "Only resolved Ghidra call references are returned; unresolved computed or indirect calls remain unknown, while function classifications distinguish thunks and externals."
    ]
  },
  "locations": [],
  "evidence_links": []
}
```

진짜`parameters`프로파일 객체는 25개의 키를 가지고 있습니다.`limitations`목록은 10개의 문장을 가지고 있습니다. 그것들을 보관하세요. 한계가 내용의 일부입니다. 그래서 하나를 놓으면 아이디가 변경됩니다.

기록 에 무엇 이 알려지지 않았는지 알아보십시오.`environment` `null`그리드라는 파일을 읽고 아무것도 안 봤기 때문입니다.`locations`이 작업 보고서는 내부에 있는 주소를 보고 있기 때문에 빈`normalized_result`-`relationship_coverage`그 지위를 가지고 있습니다`complete`진단은 해결된 지드라 호출 참조만 반환되고 해결되지 않은 컴퓨터 또는 간접 호출이 알려지지 않는다고 말합니다. 따라서 호출자 및 호출자 목록은 해결된 호출에만 완전합니다.

## 아이디는 내용의 이고, 길이 그 안에 있지 않다

실제 계산기`evidence_id``ev_`RFC 8785의 정통 JSON에 SHA-256를 더하여 기록의 투영을 유지합니다.`digest``format`그리고`architecture`그리고 `name`그리고`local_path`- 떨어지는 것 같아`relationship_coverage`그 값이`null`, 그래서 호출 관계 없는 기록은 필드가 존재하기 전에 동일한 아이디를 유지합니다`raw_result`모든 한계가 해시됩니다.

RFC 8785는 객체 키를 분류하고 백공간을 제거하고 숫자 및 문자열 양식을 수정합니다. 숫자가 정수인 기록에 대해서는 파이썬의 표준 라이브러리는 동일한 바이트를 생성합니다.

```python
def canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
```

`code/main.py`RFC 8785와 파이썬은 일부 플롯을 다르게 인쇄하기 때문에 해시하기 전에 플롯을 거부합니다. 두 개의 리아 기록과 스냅샷은 플롯을 보유하지 않습니다. 따라서 레시피는 모든 리아 해시를 재생합니다.

| rea value | Recomputed by `code/main.py` |
|---|---|
| `ev_67b6d3f992eaf49a…` for `grade` | equal |
| `ev_e88b10dc0c6400e5…` for `percent_change` | equal |
| profile digest `9c7f6b24be69294e…` over `{provider, parameters}` | equal |
| `query_26122aebe9d8abae…` for the `grade` snapshot entry | equal |
| `query_0f95ef38038d3666…` for the `percent_change` entry | equal |

왜 경로를 배제하는 걸까요? 같은 바이트의 동일한 관찰은 모든 기계와 모든 폴더에서 동일한 ID를 얻습니다.`local_path`위의 목록에서 Mac의 폴더의 이름을 표시합니다.`/home/you/re`-`rebind_subject_path()`새로운 경로를 통해 음반을 보여주면 거부합니다`sha256``format`또는`architecture`6.5.0은 같은 것을 `rebindEvidenceToTargetPath`새로운 경로에서 목표물을 위한 스냅샷 레코드를 재생할 때

`validate_evidence()`이 경우, 이 기자가 재정하여 "증명 의미 식별자는 그 기록과 일치하지 않는다"라는 ReA의 문장과 일치하지 않는 것을 거부합니다.`analysis_profile.provider`그 `provider`- 시험`test_tampered_id_and_mismatched_profile_are_rejected`실제 `grade`기록하고 보고서에서 거절합니다.

## 그 물건 을 직접 관찰 하십시오

어떤 공급자보다 먼저, 리저는 파일을 읽습니다.`observe_object()`ELF64 섹션 헤더를 분석합니다. `.symtab``.strtab`그리고`.rela.text``struct.unpack_from`- 한글이 써있어요`inspect_object`기록과 하나`read_function_bytes`함수 기호에 따라 기록합니다.`observed`권위 있는 사람`shipped-artifact`, 원천은 디스크에 있는 파일이기 때문입니다.

| Record | Content | Id |
|---|---|---|
| `inspect_object` | five sections with offsets, sizes, and hashes, four functions, three relocations | `ev_645e0a145f28bd5c…` |
| `read_function_bytes percent_change` | 16 bytes at `.text+0x00` | `ev_2572a7d254ad15cb…` |
| `read_function_bytes grade` | 46 bytes at `.text+0x10`, SHA-256 `ffcb75c2a7bb1104…` | `ev_a467c2427bfc0c56…` |
| `read_function_bytes total` | 31 bytes at `.text+0x40` | `ev_b1e845cea2543073…` |
| `read_function_bytes grade_label` | 63 bytes at `.text+0x60` | `ev_c50041be26e6b7f4…` |

`llvm-objdump -t`동의합니다: `grade``0000000000000010`크기와 함께`2e`3번의 이전`.rela.text``R_X86_64_PC32`반대`.rodata`이산화`0x36``0x84`그리고`0x93`, 추가로`0x10``0x24`그리고`-0x4`각 음반에는`file-offset-range`위치 및 한 가지 제한: "부문 바이트는 디스크에 있는 파일에서 읽습니다. 리더는 이전을 적용하지 않으며 코드를 실행하지 않습니다".

32강은 독자의 전체적인 구성입니다. 여기서는 60줄입니다. 왜냐하면 이 강사는 독자의 기록에 관한 것이기 때문입니다.

## 표 를 도출 하여, 그 표 를 도출 하였다고 말

46 바이트의`grade`레슨 33에 의해 해독된 네 가지 패턴을 포함합니다.

| Bytes | Instruction | Offset in `grade` |
|---|---|---|
| `48 69 c0 67 66 66 66` | `imul rax, rax, 0x66666667` | 3 |
| `48 c1 f9 22` | `sar rcx, 34` | 13 |
| `83 c1 fa` | `add ecx, -6` | 23 |
| `83 f9 04 77 0c` | `cmp ecx, 4` then `ja` | 28 |

곱하기 `0x66666667`34의 시위와 함께 10으로 서명된 분할이 있습니다. 파일은 10을 가지고 있습니다.`derive_grade_model()`이 사실을 한계로 기록합니다. "분자 10은 곱수 0x66666667와 시위 34에서 파생된 것입니다. 파일은 10을 가지고 있습니다".

`add ecx, -6`첫 번째 사례는 6으로 설정됩니다.`cmp ecx, 4`서명되지 않은 점프로 5건을 인정합니다. 6~10건입니다.

`lea``.text+0x33`이적을 추가로 수행합니다`0x10`. PC32은 4 바이트 이동의 끝에서 이동을 측정하므로 테이블은 `.rodata+0x14`5개의 작은 앵무새 단어들이 읽혔습니다`1, 2, 3, 4, 4`- 스위치`ledger.c`60에서 69까지 1을 반환하고, 70년대에는 2을, 80년대에는 3을, 90에서 100년에 4을 반환합니다. 컴파일러는 스위치를 반환 값의 검색 테이블로 변환합니다.

그 결과 기록`ev_605106bff2d9998f…``confidence` `derived`, 그리고 그`evidence_links`이 기록은 2개의 기록으로 표시됩니다. 이 기록은 이 기록에서 배이트 기록을 제거하면 이 기록은 이 있는 링크를 가지고 있습니다. 위의 그림은 이 상태를 끄면 나타냅니다.`ev_a467c242…`- 그래

이제 Ghidra와 비교해 보세요. 같은 바이트의 사이드코드입니다.

```c
uint grade(int param_1)
{
  uint uVar1;
  uint uVar2;

  uVar2 = param_1 / 10 - 6;
  uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  if (uVar2 < 5) {
    uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
  }
  return uVar1;
}
```

지드라는 이사를 적용하고 테이블의 이름을 붙였다`DAT_001000b4`, 즉`.rodata+0x14`이 이 이 이 이 이`.text``0x100000`. 10와 5개의 케이스의 분배를 복구했습니다. 기본값에 대해 항상 0이고 결코 0가 아닌 표현을 인쇄했습니다.`native_value_flow`그 작전들을 표시합니다`is_dead: true`기록은 기드라의 충실한 관찰입니다. 당신이 읽은 의미는 그로부터 유래되고, 당신이 실행에서 기대하는 가치는 추론됩니다.

`percent_change`기록은 다른 실패를 보여줍니다.`undefined1 [16] percent_change(int param_1,int param_2,ulong param_3)`- 소스는`int percent_change(int before, int after)`-`idiv`글쓰기`EDX:EAX`, 그리고 0의 경로가 떠납니다`EDX`해독자는 16바이트의 반환과 제3의 매개 변수를 추론했습니다.`native_api.return_type.confidence``grade` `"low"`- 복구된 서명을 제공자의 추론으로 간주하고, 그 방식으로 기록하십시오.

## 예측 은 유래 기록 이다

예측은 어떤 관찰도 하지 않은 행동에 대한 주장이다. `claim_suite()`이 모델의 18개는 파생된 모델과 원천에서 만들어집니다. `record_prediction()`각 음반을 저장합니다`confidence` `inferred`그리고`authority` `analyst-inference`, 그 기록에 연결된

| Claim | Predicted value | Rests on |
|---|---|---|
| `percent_change(12400, 15500)` | 25, from 310000 / 12400 | division model `ev_076a9167…` |
| `percent_change(0, 5)` | 0, the zero guard | division model |
| `percent_change(100, 50)` | -50 | division model |
| `percent_change(-7, 3)` | -142, because `idiv` truncates toward zero | division model |
| `grade(55)` | 0, index -1 fails the unsigned compare | table model `ev_605106bf…` |
| `grade(60)`, `grade(69)` | 1, 1 | table model |
| `grade(70)`, `grade(85)` | 2, 3 | table model |
| `grade(95)`, `grade(100)`, `grade(105)` | 4, 4, 4 | table model |
| `grade(110)`, `grade(-5)` | 0, 0 | table model |
| `total(1, 2, 3)`, `total()` | 6, 0 | source record `ev_2f1e6d25…` |
| `grade_label(85)` | `"B"` | source record and table model |
| `grade(score)` for 90 to 100 | 4 for all eleven inputs | table model |

`predict()`C의 의미론을 사용하지만 파이썬의 의미론을 사용하지 않습니다.`c_div()`0으로 줄이는 것, 그리고`wrap32()`매 중간을 32 비트로 접합니다.`//`음의 무한으로 돌고, 그래서`(3 - -7) * 100 // -7`-143을 주고 C프로그램은 -142을 주고

각 예측은 1개의 미지의 잔해를 열고 미지의 것은`observed`권위 있는 증거`controlled-replay`그리고 하나의 탐사선을 추천합니다.`execute_function`다음 섹션에서는 그 증거를 생성합니다. 1급 주장에 대한 질문은 "조립된 함수가 실행될 때 점수가 ((95) == 4 유지되는가?"

## 달리는 사람 들 과 비교 해 보십시오

`code/fixtures/harness.c`포함됩니다`ledger.c`그리고 호출당 한 결과물을 인쇄합니다.`observe_runs()`1번의 `clang``cc`또는`gcc`PATH에 들어가서 그릴에 있는 모든 입력값을 한번 실행합니다.

```json
{
  "operation": "execute_function",
  "parameters": { "function": "grade", "args": [95] },
  "normalized_result": { "result": 4, "stdout": "4\n", "exit_code": 0 },
  "confidence": "observed",
  "authority": "controlled-replay",
  "environment": { "id": "host-process", "platform": "darwin", "architecture": "arm64", "isolation": "process" },
  "limitations": [
    "The run executed a host build of ledger.c, not the x86-64 object. The claim about the object rests on the shared source and on the compiler.",
    "One run observes one input. It proves nothing about other inputs."
  ]
}
```

실행 기록의 주제는 이 Mac에 있는 Mach-O arm64 파일인`course-harness`컴파일러 버전 라인, 여기`Apple clang version 17.0.0 (clang-1700.6.3.2)`- `evidence_links`출처 기록의 이름을 지정하십시오`ev_2f1e6d251543d017…`, 왜냐하면 실행과 객체가 공유하기 때문입니다`ledger.c`그 밖에 아무것도 없어요

x86-64 객체는 이 기계에서 실행되지 않았습니다. 실행된 것은 다른 아키텍처에 대한 동일한 소스의 두 번째 빌드였습니다. 그것은 여전히 관찰이며 에뮬레이터 없이 사용할 수있는 가장 강력한 것입니다. 그래서 주장은 그 문장을 첨부하고 있습니다. 그것을 생략하는 보고서는 독자가 필요로하는 정보를 잃었습니다.

17개의 단일 입력 경기는 모두 예측과 일치합니다.`code/fixtures/run-evidence.json`이 17개의 기록과 출처 기록을 보유하고 있으며,`--record`2026-10-13에 컴파일러가 없을 때`build_ledger()`이 보고서는 이 팩을 실행하기 보다는 수입하고 있습니다.`runs`현장

## 프로모션 규칙

청구서는 추론된 것에서 뒷받침된 것에만 관찰된 실행을 통해 이동합니다. `check_claim()``execute_function`동일한 기능과 주장을 가진 기록, 각 결과를 예측과 비교하고, 포함된 입력들을 계산합니다.

| Status | Condition | rea's completion ledger |
|---|---|---|
| `pass` | every input has an agreeing run and none disagrees | `pass` |
| `fail` | any run disagrees | `fail` |
| `unknown` | some inputs have runs, others have none | `unknown` |
| `unsupported` | no input has a run | `unsupported` |

`promote_claim()`엄밀한 형태입니다.`ClaimError`어떤 아이디가 있는 경우`inferred`또는`derived`. ID가 다른 함수 또는 다른 주장의 행렬을 이름 붙인 경우 발생한다. 목록이 빈 상태에서 발생하며 행렬이 주장보다 더 적은 입력량을 포함하면 발생한다. 기드라 사이드코드 기록과 테이블 모델은 모두 존재합니다.`grade(55)`, 그리고 둘 다 그것을 촉진할 수 없습니다.`ev_7be90c0c…`이 그림에서, 청구권이 `unsupported`두 개의 기록에 대해`grade`계속 남아

범위 주장은 부분 사례를 보여줍니다. 11개의 입력 중 95과 100은 실행 그리드에서 나타납니다. `check_claim()`수익금`unknown``covered`11개 중 2개, 그리고`promote_claim()`2개의 입력값은 11개의 입력값 중 2개의 입력값이 실행된 것을 거부합니다.

`completion_ledger()`  `EvidenceCompletionLedger`- 신분번호는`ecl_`그 기록의 합을 더하면`complete`이 말은`pass`=`total`- 데모 프린트`ecl_da64933ea13befed…``complete: false`, 그 한 가지 범위 주장 때문에.

## 알 수 없는 것은 해시 체인으로 기록된 것입니다.

rea는 엄격한 기록으로 알려지지 않은 잔액을 저장합니다. `code/main.py`같은 필드와 동일한 변수를 유지합니다.

아이디는`unk_`SHA-256를 더해`{domain, question, scope_digest}`이 두 분석가들은 같은 파일에 대해 같은 질문을 하는 경우 동일한 아이디를 얻습니다.`scope_digest`이 물체의 SHA-256입니다.

모든 변화는 새로운 개정입니다.`previous_revision_digest` `null`. 이후의 개정마다`revision_digest`그 이전에 있었던 것 (의) 의 기록이 있나니 그 기록은 그 외 모든 것을 덮어 있노라`verify_unknown_chain()`목록을 돌아다니고 각 디저트를 다시 계산합니다. 각 링크가 이전 수정에 지점을 두고 있는지 확인합니다. 각 수정 이름의 돌연변이 증거가 대책서에 있는지 확인합니다.

각 돌연변이는 자체적으로 증거 기록입니다.`rea-unknown-registry`우리들의 운반`confidence` `derived``authority` `analyst-inference`그 제한은 "기록물 돌연변이가 분석가 결정한 것을 기록합니다. 그것은 답을 증명하지 않습니다".

그래서 디모의 81개의 기록에는 36개의 유래 돌연변이 기록이 포함되어 있습니다. 18개의 개막과 18개의 업데이트.

모든 개정에서 세 가지 변동이 적용됩니다.

- `resolved`알 수 없는 사람이 `resolution`, 그리고 단지 수정 1만이 전신이 없습니다.
- A`contradicted`알려지지 않은 이름, 적어도 1개의 모순된 아이디가 있고, 두 목록 모두에 아이디가 없습니다.
- A`verified`해상도 최소 필요한 신뢰와 권한으로 한 증거 인증을 지정합니다.

세 번째 규칙은 리저에서 가장 자주 거부하는 것입니다. rea의 작업 흐름 메모는 "만 자격을 갖춘 관찰 된 증거가 해상도를 확인할 수 있습니다".`resolve_unknown()`따라서 표 모델을 거부하고, 관측된 기록을 당부로 거부합니다.`shipped-artifact`, 그리고 실행 기록을 받아들이는`ev_f4ffbe8f922ec7fe…`. `grade(95)`2번 개정과`previous_revision_digest` `ffca840b55a8a188…`, 수정 1의 소화

`update_unknown()``expected_revision`그리고 상승합니다`revision-conflict`류의 경우`update_unknown`류의 메모에서 나오는 올바른 반응은, 현재의 수정 내용을 다시 읽고 다시 결정하는 것입니다.

한 가지 알려지지 않은 것은 데모가 끝난 후 열려 있습니다.`unk_f2eb0d7f84c80a19…`, "조정된 함수가 실행될 때 90에서 100까지의 각 점수에 대해 4을 점수합니까?"`investigating`, 그 뒷받침 ID는 두 개의 실행을 포함하고, 그 탐사선은 여전히 실행 없이 9개의 입력 이름을 지정합니다.

## 응답의 캐시 는 분석 데이터베이스 로서는 안 된다

rea에는 캐시처럼 보이는 세 가지 요소가 있습니다. Ghidra 목표 스냅샷은 입력의 사적인 복사본입니다.`-readOnly -deleteProject`그리고 닫힌 순간 삭제되었습니다.`AnalysisSnapshotCache`한 개의 바이너리 아이덴티티에 대한 최대 10,000개의 항목을 포함합니다.`target``binding``entries``workflow_entries`, 그리고`evidence_bundle`- 그래

캐시 키는`query_`SHA-256를 더해`{target, binding, operation, parameters}`-`target` `{sha256, kind, format, architecture}`, 그리고`raw-binary`목표 또한 `entry_point`-`binding`제공자 및 전체 분석 프로파일, 소화 포함. 예를 들어 25개의 프로파일 매개 변수 중 하나를 변경하십시오`jump_table_evidence``typed-case-default-blocks-v1`a`v2`, 그리고 소화가 변하고, 그래서 모든 키가 변합니다.

`code/fixtures/rea-snapshot.json`이 파일은 두 번의 실행 중에 작성된 파일입니다. 142,690 바이트입니다. rea는 소유자만 권한으로 작성했으며, 약속된 복사본은 모든 사람이 읽을 수 있습니다.`AnswerCache.import_snapshot()`각 것을 다시 계산합니다`query_id`그리고 다른 파일이 있을 때 파일을 거부합니다.`target`또는`binding`                       `profile_mismatch`- 이 이 이 이 이`format_version`아니죠`course-answer-cache-1`- 그래

이 기계에서 3개의 측정이 이루어졌습니다.`grade`질의 8.6s, 신선한 Ghidra 수입.`percent_change`같은 스냅샷에 대한 질의 8.5 초 동안 사용되었는데, 다른 질의가 캐시 오류이기 때문입니다.`grade`질의 2.1s에 걸린 후 동일한 기록과 동일한 기록을 반환했습니다 `evidence_id`. rea에서 메모리 내 재 재생은 "지역 REA 분석 스냅샷에서 로드되었습니다. 이 호출은 제공자를 다시 실행하지 않았습니다".`lookup()`같은 문장을 추가하여 독자가 새로운 답변에서 반복을 구별할 수 있습니다.

돌연변이가 캐시를 종료합니다. rea 6.5.0에서, 개명 또는 댓글은 rea가 호출을 제공자에게 보내기 전에 스냅샷 캐시를 제거합니다. 실패한 응답은 스크립트가 다시 롤되었음을 증명할 수 없습니다. 따라서 실패한 스크립트는 또한 재생을 중단합니다. 데이터베이스를 변경하는 메타데이터 수입은 똑같이합니다.

## 왜 에이전트가 이것을 필요로 하는가

MCP를 통해 RE아를 운반하는 에이전트는 모든 통화에 대한 전체 기록을 보고 인용할 수 있습니다`evidence_id`2026 년 연구 는 그 가 잘못 된 곳 을 알려 준다. 도구 출력 에 대한 과도 한 신뢰 는 NDSS BAR 연구 의 네 가지 약점 중 하나 이다. 플랜드 텍스트 연구 에서, 데이터 로만 바이너리 콘텐츠 를 보여 주는 것 은 여전히 15 가지 안전 없는 제안 을 남겼으며, 도구 승인 과 함께 출력 검사 는 그것들을 제거 하였다. 세 번째 연구 는 에이전트 가 MCP 를 통해 Ghidra 를 운전 하는 것을 보았습니다.[arXiv 2606.06838](https://arxiv.org/abs/2606.06838)) 수백 개의 함수를 가진 바이너리에서, 에이전트가 덩어리를 생성하기 전에 실제 분석을 받은 비율은 10~15%에 불과했습니다.

이 모든 질문에 대책서는 기록으로 답하고, 대책서는 그 대책에 있는 내용만을 보고합니다. 관찰된 실행이 없는 주장은`unsupported`몇 번이나 득점한 주장은`unknown`. 공급자 텍스트는`observed`그 중 한 명은 공급자 뿐 아니라`outputs/`그리고 그 책에서 결론을 내리는 유일한 장소가 되죠. 클로드, 커서, 코덱스, 오픈클라, 헤르메스, SKILL.md를 읽는 어떤 에이전트도 마찬가지죠.

## 건설 해

표준 도서관 데모를 실행하세요:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
```

데모는 객체를 읽고, 두 개의 리아 기록을 수입하고, 리아 스냅샷을 확인하고 두 모델을 추출합니다. 그 다음 18 가지 예측을 기록하고, 18 가지 알려지지 않은 것을 열고, 배너스를 컴파일하고 실행하고, 모든 주장을 확인하고, 17 가지 알려지지 않은 것을 해결합니다. 예상된 모양:

```json
{
  "records": 81,
  "by_confidence": { "observed": 25, "derived": 38, "inferred": 18 },
  "rea_snapshot": { "entries": 2, "replay_hit": true, "stale_profile_refused": true },
  "grade_table": [1, 2, 3, 4, 4],
  "runs": "live: Apple clang version 17.0.0 (clang-1700.6.3.2)",
  "claims": [ { "claim_id": "grade(95)", "status": "pass", "covered": "1/1" }, { "claim_id": "grade(90..100)", "status": "unknown", "covered": "2/11" } ],
  "completion_ledger_id": "ecl_da64933ea13befed9483f8b00447bb3f4ceb74324c01e2515eff03f3af3ca750",
  "complete": false,
  "unknowns": { "resolved": 17, "investigating": 1 }
}
```

C 컴파일러 없이`runs`읽는다`imported 17 recorded run records from run-evidence.json`나머지는 똑같습니다.

읽으세요`code/main.py`이 순서로:

1. `canonical_json()`그리고`compute_evidence_id()`해시 레시피와 의미적인 투표를 유지하세요.
2. `create_evidence()`그리고`validate_evidence()`기록을 작성하고 확인하세요.
3. `EvidenceLedger.record()`그리고`import_bundle()`기록들을 저장하고 갈등을 거부합니다.
4. `open_unknown()``update_unknown()`그리고`resolve_unknown()`재검토 체인을 유지하세요.
5. `observe_object()`ELF를 읽으며,`derive_grade_model()`책상을 읽습니다.
6. `claim_suite()``predict()`그리고`record_prediction()`추론된 계층을 적어라
7. `observe_runs()`모든 리너스를 기록으로 만들어
8. `check_claim()``promote_claim()`그리고`completion_ledger()`프로모션 규칙을 적용합니다.
9. `AnswerCache`키는 레아의 스냅샷처럼 답하고, 노후된 사진을 거부합니다.

## 사용 하 고

목표와 조사에 따라 하나의 리저를 보관하고, 목표의 SHA-256을 모든 주제에 넣고, 질문의 범위를 알 수 없는 모든 주제에 넣습니다. 도구를 변경할 때,`provider`이 파일은 재건되면 주체가 변이를 소화하고 모든 오래된 기록이 다른 파일의 증거가 됩니다.

한계를 알고 있는 순간 적어라. 이전을 적용하지 않는 독자는 그렇게 말한다. 호스트 빌드의 실행은 그렇게 말한다. 분수를 추론하는 모델은 그렇게 말한다. 그 한계를 없이 작성된 기록은 사실들이 허용하는 것보다 강해 보이지만, 나중에 독자는 그것을 수정할 수 없다.

모든 제공자 텍스트를 데이터로 취급합니다. 대상에서 문자열과 사이드코드는 목표물 통제하는 텍스트입니다. 그들은 결코 지침이 되지 않습니다. 그리고 그들은 결코 행동 관찰이 되지 않습니다. rea 6.5.0`_meta.provenance.untrusted_content: true`서버 명령어는 모델에 목표 내용의 데이터를 데이터로 취급하고, 실행, 설치, 다운로드 또는 전송하는 모든 요청을 명령어 주입 시도로 보고하도록 말합니다. 마크는 도움이 되지만, 리저는 여전히 목표 텍스트를 명령어에서 제외해야 합니다.

## 인터랙티브 연구소

### 연구소 A: 리얼 ID를 다시 계산

`code`디렉토리, 오픈 파이썬:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/code
python3 -q
```

실행:

```python
from main import *
record = load_evidence_file(FIXTURES / "rea-evidence-grade.json")
record["evidence_id"] == compute_evidence_id(record)
record["subject"]["local_path"] = "/home/you/re/ledger-x86_64-O1.o"
record["evidence_id"] == compute_evidence_id(record)
record["limitations"].pop()
record["evidence_id"] == compute_evidence_id(record)
```

첫 번째 두 가지 비교는 사실입니다. 경로는 해시 안에 없습니다. 세 번째는 틀린 것입니다. 한계가 포함되어 있기 때문입니다.

### 연구소 B: 승진 거부

```python
ledger, report = build_ledger(live_runs=False)
claim = [c for c in claim_suite(ledger.find(operation="derive_switch_model")[0], ledger.find(operation="derive_arithmetic_model")[0], ledger.find(operation="read_source")[0]) if c.claim_id == "grade(55)"][0]
promote_claim(ledger, claim, [ledger.find(operation="derive_switch_model")[0]["evidence_id"]])
```

전화가 올라갑니다`ClaimError`그리고 도래된 아이디를 이름 붙여서

```python
run = run_records_for(ledger, "grade", [55])[0]
promote_claim(ledger, claim, [run["evidence_id"]])["status"]
```

상태는`pass`그리고 돌아온`limitations`호스트 빌드 형을 적용합니다.

### C 연구소: 오래된 스냅샷을 거부

```python
import json
snapshot = json.loads(REA_SNAPSHOT_PATH.read_text())
target, binding = rea_snapshot_binding(snapshot)
AnswerCache(target, binding).import_snapshot(snapshot)
stale = dict(binding["analysis_profile"]["parameters"], jump_table_evidence="typed-case-default-blocks-v2")
AnswerCache(target, {"provider": binding["provider"], "analysis_profile": make_profile(binding["provider"], stale)}).import_snapshot(snapshot)
```

첫 번째 수입이 2개로 증가합니다`CacheError``profile_mismatch`한 버전 문자열이 변경되어 전체 스냅샷이 거부됩니다.

### 연구소 D: 체인을 깨고

```python
unknown_id = [u for u, r in ledger.unknowns.items() if r[-1]["status"] == "investigating"][0]
ledger.verify_unknown_chain(unknown_id)
ledger.unknowns[unknown_id][0]["severity"] = "critical"
ledger.verify_unknown_chain(unknown_id)
```

첫 번째 호출이 돌아옵니다. 두 번째 호출이 올라갑니다.`EvidenceIntegrityError`, 개정 1편은 더 이상 자신의 소화와 일치하지 않기 때문에 개정 2편은 더 이상 존재하지 않는 소화와 일치하기 때문입니다.

## 연습 실험실

공개된 알려지지 않은 부분을 닫고 두 번째 제공자를 추가하십시오.

요구 사항:

- 확장`run_grid()`그래서 범위 주장의 9개의 실종 입력 실행, 그리고 알려지지 않은 이동을 확인합니다`resolved`3번 개정에서
- 추가`llvm-objdump -d`제2의 공급자로서`provider``grade``observed`- 그래
- 글씨를 써`derived`두 개의 목록인 지드라와 이블림 오브다임프의 기록이 같은 14개의 명령어를 해독하고 둘을 연결합니다.
- 알려지지 않은 사람을 열어`grade_label(105)`심각하게`high`, 표 지표 4이 이렇게 되어 있기 때문에 `labels[4]`그리고 그것을 실행으로 해결해내세요.
- 이력서를 `export_bundle()`새로운 리저에 가져오고 모든 체인이 여전히 검증되는 것을 증명합니다.

성공이란 모든 문장이 묶음에서 아이디를 인용하는 보고서를 의미합니다.`unknown`주장은 사라졌습니다.

## 교훈 유물

이 교훈은`outputs/skill-evidence-ledger.md`. 그것은 에이전트에 모든 발견을 신뢰, 권위, 제한 및 링크를 가지고 기록으로 작성하는 방법을 알려줍니다. 그것은 에이전트에 알려줍니다.`pass``fail``unknown`또는`unsupported`- 그래

## 확인 해 보

데모와 결정적 스위트를 실행하세요:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

28개의 테스트는 증명합니다.

- 두 가지 모두`evidence_id`값, 프로필 소화, 그리고 두 점상 모두`query_id`내용에서 재정된 값
- 변경된 경로는 ID를 유지하고 변경된 제한은 변경합니다
- 조작된 기록, 부합된 프로필 제공자, 플롯 및 알려지지 않은 enum 값이 거부됩니다.
- 복제된 기록이 반환됩니다`duplicate`, 충돌하는 기록이 상승하고,
- 기록된 운행 팩트 수입은 18개의 기록과 매달린 연결이 없습니다
- 1번 리비전에서 알려지지 않은 사람이 열리고,`expected_revision`, 그리고 관찰된 것만으로 해결됩니다`controlled-replay`증거
- 편집된 개정으로 체인이 끊어진다
- 프로모션은 추론, 추론, 빈, 그리고 관련 없는 증거를 거부하고, 동의하는 실행과 통과합니다
- 부분적인 커버링은`unknown`그리고 서로가 서로가 다른 행로로`fail`
- 캐시가 정확한 키를 입력하고 다른 매개 변수를 놓치고 있습니다.
- 캐시는 부러진 프로필 버전, 잘못된 목표, 잘못된 형식 버전 및 조작된 키를 거부합니다
- ELF 독자는 동의합니다`llvm-objdump`오프셋, 크기와 바이트, 이전과 관련된 표는`1, 2, 3, 4, 4`
- 예측은 C 분할을 사용하며 기록된 실행은 17개의 단일 입력 주장과 일치합니다
- 컴파일러가 존재하면 라이브 러닝도 동의합니다

## 생산 실패 모드

| Failure | What the weak report says | What the ledger requires |
|---|---|---|
| Pseudocode read as behaviour | "grade returns 0 for failing scores" | an `execute_function` record for that input, or `unsupported` |
| Decompiler signature trusted | "percent_change returns 16 bytes" | the signature marked as the provider's inference with its `low` confidence |
| Empty list read as absence | "the function has no callers" | an `unknown` status, or a coverage field when the tool provides one |
| Path hashed into the id | "the record changed" after a copy | the semantic projection without `name` and `local_path` |
| Limitation dropped from a copy | a record that looks stronger than the source | id mismatch and rejection on import |
| Partial grid rounded up | "all scores from 90 pass" | `unknown` with `covered` 2 of 11 |
| Host run presented as the object's run | "the x86-64 object returned 25" | the host-build limitation carried on the claim |
| Unknown closed by a sentence | "resolved, see above" | a `verified` resolution with observed ids of the required authority |
| Stale revision overwritten | two analysts' edits collide | `revision-conflict` and a reread |
| Old snapshot replayed after a release | answers from a changed contract | `profile_mismatch` on import |
| Cache kept after a rename | a replay that hides a metadata write | invalidation before dispatch and a failed export |

## 운영 규칙

읽은 내용, 계산한 내용, 그리고 예상한 내용들을 3가지 단어로 기록해 보세요. 익명의 내용을 아이디로 닫아주세요. 문장을 사용하지 마세요. 답을 저장된 키로만 다시 재생하고, 버전 문자열이 다르면 거절하세요.

## 더 많은 읽기

- [rea 6.5.0 source, `src/domain/evidence.ts` and `src/domain/residualUnknown.ts`](https://github.com/morluto/rea)
- [RFC 8785, JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Agent Failure Patterns in CTF Reverse Engineering, NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)
- [When Binaries Talk Back: Representation-Confusion Attacks on LLM-Assisted Reverse Engineering, arXiv 2607.12507](https://arxiv.org/abs/2607.12507)
- [Agentic decompilation study, arXiv 2606.06838](https://arxiv.org/abs/2606.06838)
- [When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370](https://arxiv.org/abs/2609.05370)
-                         `3b79af2`이 교훈은 다음과 같이 설명합니다.`src/domain/evidence.ts``.agents/skills/reverse-engineer-anything/SKILL.md``docs/cli.md``src/domain/reconstructionVerification.ts``src/application/ReconstructionObligationCandidates.ts``docs/tool-design.md``src/domain/evidenceCompletionLedger.ts``src/domain/residualUnknown.ts``src/application/investigation/UnknownEvidence.ts``.agents/skills/reverse-engineer-anything/references/evidence-workflows.md``src/application/binary/AnalysisSnapshotCache.ts``src/domain/analysisSnapshot.ts``src/application/binary/BinarySession.ts``src/application/binary/BinarySessionRecords.ts``docs/mcp-contracts.md`- 그래
