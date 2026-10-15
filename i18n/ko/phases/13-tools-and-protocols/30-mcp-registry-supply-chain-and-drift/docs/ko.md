# MCP 레지스트리 공급망: 입수, 유동 및 롤백

> 등록기록에 등록된 경우 출판사가 발표한 내용을 알려줍니다. 제작 입장이 당신이 가져온 것을 증명하고, 관찰한 것을, 승인한 것을, 그리고 안전하게 복원할 수 있는 것을 증명합니다.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 17 (gateways and registries), Phase 13 · 18 (production authentication)
**Time:** ~90 minutes

## 학습 목표

- 별도의 레지스트리 출판, 패키지 출처, 실행 시간 발견 및 지역 승인.
- MCP 서버 이름 공간을 확인하는 것은 자신의 기록 안에 있는 이름을 신뢰하지 않고
- 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필 필
- 등록 상태 변경 및 입학 후 실행 시간 유동을 감지합니다.
- 로팅을 과거로 다시 작성하지 않고 이전에 허용된 버전으로 되돌려 놓습니다.
- 모든 결정을 설명하는 명백한 입학 기록을 유지하십시오.

## 문제

- 알아냈어`com.example/inventory`레지스트리에서 설명이 맞습니다. 패키지가 존재합니다. 서버는 응답합니다.`server/discover`- 그래

이것은 하나의 사실이 아니라 여러 권위의 일련의 사실입니다.

1. 이름 공간에 대한 인증을 받은 출판사가 기록서를 제출했습니다.
2. 패키지 레지스트리는 특정 신분과 소화물을 가진 유물을 제공했습니다.
3. 실행되는 엔드포인트에서는 프로토콜 버전, 기능, 도구 및 진단 서버 정보를 보고했습니다.
4. 여러분의 조직은 이런 조합이 허용된다고 결정했습니다.

이 사실을 이 레지스트리에 있는 것으로 몰아넣는 것은 공급망의 맹점점을 만들어 냅니다. 유효한 출판물은 여전히 비효율적일 수 있습니다. 패키지 태그는 소화물을 지 않으면 예상치 못한 유물을 가리키기도 합니다. 서버는 검토 후 파괴적인 도구를 추가할 수 있습니다. 롤백은 침묵으로 허용되지 않은 버전을 선택할 수 있습니다.

모든 국경에 증거가 있는 입학 관리자입니다.

## 등록 은 당신의 승인 제도 로서 아니라 지표 이다

공식 MCP 레지스트리는 서버 메타데이터를 저장합니다.`server.json`서버 버전의 이름을 기록하고 하나 이상의 패키지 또는 원격 엔드포인트를 선언합니다. 출판 규칙은 네임스페이스 인증, 패키지 소유자 확인, 제한된 레지스트리 규칙 및 좁은 출판사 메타 데이터 위치를 추가합니다.

그 컨트롤은 출판문제에 답합니다.

| Boundary | Question | Evidence owner |
|---|---|---|
| Namespace | Was the publisher allowed to use this name? | Registry authentication plus your verified namespace input |
| Record | What did the publisher declare for this version? | Immutable `server.json` digest |
| Execution source | Which package or remote endpoint will execute? | Declared source fields, verified ownership result, transport, and trusted digest |
| Runtime | What does the endpoint expose now? | `server/discover` and tool descriptors |
| Admission | Did your policy approve this exact set? | Local pin and ledger entry |
| Operations | Is it still safe, and what can replace it? | Drift checks, status sync, health, and rollback route |

레지스트리 스키마 버전과 MCP 프로토콜 버전은 독립적입니다. 기록은 출판된 `2025-12-11`라이브 서버가 MCP를 지원하는 동안 서버 스케마`2026-07-28`절대 다른 사람으로부터 추론을 하지 말아요

```figure
mcp-registry-admission
```

## 입학 결정 한 가지 에 7 가지 통제

### 1. 이름 공간 검증

공식 레지스트리 이름들은 인증된 이름 공간을 사용합니다. 검증된 도메인은 역전 도메인 프리픽스에 지도를 할 수 있습니다. 예를 들어, `example.com`확립할 수 있습니다`com.example/*`- 그래

문자열 사전 확인을 허용하지 마십시오:

```python
server_name.startswith("com.example")
```

또한 받아들여집니다`com.exampleevil/tool`이름 나눌 수 있습니다`/`, 비공개 발그를 요구하고, 네임스페이스 세그먼트를 정확하게 비교합니다. 더 중요한 것은, 인증 결과에서 검증된 네임스페이스를 입력으로 전달합니다. 신뢰할 수 없는 기록에서 신뢰를 얻지 마십시오.

GitHub 지원 이름 공간과 도메인 지원 이름 공간은 서로 다른 인증 경로를 사용합니다. 어느 경로를 하나 입력 입력으로 정상화하십시오: 정확한 검증된 이름 공간 문자열.

### 2. 출산자

패키지 기록에 있어서, 선언과 가져온 유물은 명시된 필드에 결합되어야 합니다.

- 패키지 레지스트리 유형
- 패키지 식별자
- 패키지 버전
- 확인된 소유자 결과
- 다운로드 된 유물 소화

또한 선언된 패키지 운송을 검증하십시오. 원격 엔드포인트만 있는 기록은 유효하며 패키지 부족으로 거부할 수 없습니다. 원격 소스에서는 선언된 URL 및 운송 유형을 독립적으로 확인된 엔드포인트 소유권과 신뢰할 수 있는 연결 또는 배포 증거의 소화에 연결하십시오.

수업 코드는 소스 타입을 모두 지원하고, 레지스트리 소스, 서버 이름, 레지스트리 버전, 레지스트리 소화 및 증거 소화와 함께 선택한 소스를 해시합니다. 결과 출산 소화는 완전한 증거 집합에 대한 컴팩트 포인터입니다. 증거 보존을 대체하는 것은 아닙니다.

확인 하려고 하는 유물 에 의해서만 제공 된 소화 를 결코 받아들이지 말아 신뢰 할 만한 수확 한계 에서 계산 해 보십시오. 또는 확인 결과 를 확인 하는 패키지 서비스 에서 받아 들일 수 있습니다.

### 3. 결정에 꽂아, 단지 버전만이 아니라

레지스트리 버전은 고유한 출판 식별자입니다. 출판된 메타 데이터는 변경되지 않습니다. 변경된 기록은 새로운 버전이 필요합니다. 의미 버전화가 권장되지만 레지스트리는 그것을 필요로하지 않으며 버전 범위를 받아들이지 않습니다.

이것은`^1.4`lastest. 유용한 은 다음과 같은 것을 포함합니다.

```json
{
  "server": "com.example/inventory",
  "version": "1.0.0",
  "recordDigest": "...",
  "source": {"kind": "package", "registryType": "pypi"},
  "sourceDigest": "...",
  "toolsetDigest": "...",
  "provenanceDigest": "...",
  "registryStatus": "active"
}
```

여러 계층을 붙여서 어떤 경계가 변경되었는지 식별할 수 있습니다. 같은 레지스트리 버전의 레지스트리 소화 변경은 레지스트리 무결성 오류입니다. 동일한 패키지 좌표 또는 원격 배포 아래의 소스 소화 변경은 실행 소스 무결성 오류입니다. 도구 집합 소화 변경은 런타임 드리프입니다.

### 4. 생동감 유동 탐지

입학은 실제로 트래픽을 수신하는 서버를 관찰해야 합니다.`server/discover`, 목록 또는 다른 방법으로 신뢰할 수 있는 경로를 통해 노출 된 도구 설명서를 얻으세요, 그리고 확인하세요:

- `2026-07-28` `supportedVersions`
- 지역적으로 필요한 모든 기능이 존재합니다.
- 모든 도구 설명서는 필요한 아이덴티티와 스키마 표면을 가지고 있습니다
- 정상화된 설명기 소화 는 나중에 확인된 경우 허용된 핀과 일치한다

선택적 결과`_meta["io.modelcontextprotocol/serverInfo"]`값은 자기보고된 디스플레이, 로그 및 디버깅 컨텍스트입니다. 진단 증거로 기록하지만, 이름 공간, 패키지 소유권, 엔드포인트 소유권, 입수 또는 기타 보안 결정을 설정하는 데 절대 사용하지 않습니다. 직접적인 `serverInfo`외래의 별명`_meta`계약 분야가 아니므로 진단 증거로 승진해서는 안 됩니다.

순서가 없는 필드를 정상화하십시오. 샘플은 셰시링 전에 도구 목록을 안정적인 이름에 의해 분류하므로 유해한 목록 순서 변경은 유동을 일으키지 않습니다. 설명 필드를 배제하지 않습니다. 새로운 도구, 변경된 스케마, 변경된 설명 또는 새로운 해설이 핀을 변경합니다.

샘플은 잘못된 설명서와 설명서 소화 변경을 유동으로 처리하고, 핀을 격리하고, 활성 경로를 제거하고, 그 버전을 롤백 목표로 차단합니다. 생산 정책은 새로운 검토를 통해 편집 변경을 허용할 수 있습니다. 설명은 모델 도구 선택에 영향을 미치기 때문에.

### 5. 레지스트리 상태는 실시간 상태

레지스트리 API는 응답 레벨을 부착합니다 `_meta`서버 레코드마다 객체입니다. 레지스트리 관리된 필드는`_meta["io.modelcontextprotocol.registry/official"]`응답을 전달해`_meta`입학에 반대하고 읽습니다`_meta["io.modelcontextprotocol.registry/official"].status`- 직접적인`_meta.status`값은 공식적인 문자 모양이 아닙니다. 응답 메타데이터를 출판 기록의 자신의 데이터와 혼동하지 마십시오.`_meta`. 상태는 다음과 같다:

- `active`: 정해진 방법으로 반환되어 지역 입학에 해당됩니다
- `deprecated`: 여전히 경고로 발견되지만 더 이상 안전한 자동 선택이 아닙니다
- `deleted`: 삭제되거나 추가적인 조회로 역사 기록이 남아있는 동안 기본적으로 숨겨져 있습니다

입력 후 동기화 상태. 활성 버전이 구석되거나 삭제되면, 그 핀을 격리하고 새로운 작업을 로팅하는 것을 중단하십시오. 증거를 보관하십시오. 기본 목록에서 삭제하면 감사 추적을 삭제할 권한이 없습니다.

출판사에서 제공하는 사용자 정의 메타 데이터는 `_meta.io.modelcontextprotocol.registry/publisher-provided`출판 기록에 있는 자료. 등록 관리 응답 메타 데이터는 분리되어 있습니다. 출판사가 자체적인 공식적인 상태를 설정하지 마십시오.

### 6. 롤백은 경로를 복원하는 것을 의미합니다.

롤백 기간 동안 변경되지 않는 출판물은 편집되지 않습니다. 롤백은 이전에 허용된, 현재 유효한 핀을 선택하고 활성 경로를 변경합니다.

안전한 목표물은

1. 입학 기록이 완료된 상태가 되세요.
2. 여전히 보험에 따라 등록 상태가 활성화되어 있습니다.
3.  타임이나 보안 증거로 격리되지 않습니다.
4. 아직 꽂힌 패키지와 라이브 디스크립터 세트에 연결해
5. 현재 건강 검사를 통과하십시오.

샘플은 첫 번째 세 가지 조건에 초점을 맞추고 실제 화해자는 패키지를 다시 가져와 활성화 전에 실시간 엔드포인트를 다시 확인해야합니다.

### 7. 입학자책을 추가

입학 데이터베이스에 무엇이 활성화되어 있는지, 그리고 그 이유를 설명하는 책에

각 샘플 항목은 순서, 시간, 이벤트, 서버, 버전, 결과, 이유, 증거, 이전 항목 해시 및 자체 해시를 포함합니다. 이전 결과 변경은 해당 항목 및 모든 후속 링크의 검증을 중단합니다.

이것은 조작이 명백한 것이 아니라 마법적으로 조작이 불가능한 것입니다. 서명 된 출력 메타데이터 또는 한 번 작성 저장과 같은 별도의 신뢰 도메인에 매개 주기적인 리저를 고인합니다. 누가 추가 할 수 있는지 제한합니다. 승인 토큰, 패키지 인증서, 도구 аргумент 및 개인 엔드포인트 데이터를 증거로부터 멀리하십시오.

## 건설 해

실행 컨트롤러가 작동합니다`code/main.py`파이썬 표준 라이브러리를 이용합니다.

끝없는 시범으로 시작하세요:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
```

시위는 다섯 가지 작업을 수행합니다.

1. 인정해`1.0.0`일치하는 이름 공간, 패키지 출처, 프로토콜, 기능 및 도구
2. 인정해`1.1.0`그리고 그것을 활성화시켜라.
3. 실행 시점에 예상치 못한 삭제 도구를 관찰하십시오.
4.  등록기록의 상태를 관찰합니다`1.1.0``deprecated`- 그래
5. 아직 허용된 로팅을 복원합니다`1.0.0`

예상형:

```json
{
  "admitted": [true, true],
  "driftAllowed": false,
  "rollbackAllowed": true,
  "activeVersion": "1.0.0",
  "ledgerValid": true
}
```

이 순서로 실행을 읽어보세요:

1. `namespace_for_domain()`그리고`namespace_matches()`정확한 명칭 권한을 설정합니다.
2. `digest()`그리고`normalized_tools()`결정적인 증거를 생산합니다.
3. `RegistryAdmissionController.admit()`출판, 출처, 실행 시간 및 정책에 부합합니다.
4. `check_live()`새로운 관찰을 핑과 비교합니다.
5. `observe_registry_status()`등록 상태가 변경되는 격리판
6. `rollback()`이전에 허용된 지원 대상만을 활성화합니다.
7. `AdmissionLedger.verify()`기록된 역사의 변화를 감지합니다.

## 사용 하 고

탐지와 라우팅 사이에 컨트롤러를 넣으십시오:

```text
Registry sync -> artifact verifier -> live discovery -> admission controller -> route table
                                               |                 |
                                               v                 v
                                          evidence store    admission ledger
```

이 작업에 대해 별도의 아이덴티티를 사용하십시오. 레지스트리 동기화 작업자는 메타 데이터에 읽기 액세스 할 필요가 있습니다. 유물 확인자는 패키지 가져오기 액세스 할 필요가 있습니다. 로트 조정자는 승인된 핀을 활성화하려면 권한이 필요합니다. 그들 중 어느 누구도 모든 자격증이 필요하지 않습니다.

 승인된은 증거가 통과된 정책을 의미합니다.  활동적은 현재 그것을 선택하는 경로가 있음을 의미합니다.  격리된은 새로운 작업을 수신할 수 없다는 것을 의미합니다.  부피된은 다른 허용 된 버전이 활성화되어 있음을 의미합니다.

서버를 노출하기 전에 입력 실행`tools/list`그렇지 않으면 클라이언트는 출판과 정책 평가 사이의 격차를 겪으면서 도구를 발견할 수 있습니다.

## 인터랙티브 연구소

한 번에 한 국경이 무너지는 것을 지켜보실 겁니다.

### 연구소 A: 이름 공간 충돌

코드 디렉토리에서 파이썬 셸을 열:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/code
python3 -q
```

그럼 실행하세요:

```python
from main import namespace_matches
namespace_matches("com.example/inventory", "com.example")
namespace_matches("com.exampleevil/inventory", "com.example")
```

첫 번째 결과는`True`; 두 번째는`False`. 정확한 비교를 `startswith`그 다음, 두 번째 이름이 그 경계를 왜 넘는지 관찰하고, 계속하기 전에 정확한 비교를 회복하십시오.

### 연구소 B: 설명자 파동

```python
from main import *
times = iter(f"2026-08-21T12:00:{n:02d}+00:00" for n in range(10))
c = RegistryAdmissionController(clock=lambda: next(times))
meta = {OFFICIAL_META_KEY: {"status": "active"}}
c.admit(sample_record("1.0.0"), meta, "com.example", evidence_for("1.0.0"), sample_live("1.0.0"))
c.check_live("com.example/inventory", "1.0.0", sample_live("1.0.0", True))
```

이유 및 노선 상태를 확인하십시오. 패키지 및 레지스트리 기록은 변경되지 않았습니다. 실행 시간 도구 표면은 변경되었으므로 컨트롤러는 정화 및 핀을 비활성화했습니다. 이 때문에 공급망 제어는 설치 후 계속해야합니다.

### 연구실 C: 상태 및 반전

인정해`1.1.0`, 그것을 구약한 것으로 표시하고, 두 개의 롤백 목표물을 시도하십시오:

```python
c.admit(sample_record("1.1.0"), meta, "com.example", evidence_for("1.1.0"), sample_live("1.1.0"))
c.observe_registry_status("com.example/inventory", "1.1.0", "deprecated")
c.rollback("com.example/inventory", "1.1.0", "unsafe retry")
c.rollback("com.example/inventory", "1.0.0", "restore known release")
c.ledger.verify()
```

격리된 목표가 거절당하고, 이전 활성 핀이 받아들여지고,

## 연습 실험실

두 명의 승인을 위한 게이트로 컨트롤러를 확장한다.

요구 사항:

- 승인서를 서명된 증거 참조로 저장하고, 핀에 변경 가능한 이름이 아닙니다.
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `destructiveHint: true`- 그래
- 재검토자의 복제 신원을 거부합니다.
- 승인이 불완전할 때 원래 입시 시도를 사서로 보관한다.
- 0, 1의 시험, 복제, 그리고 두 개의 별도의 승인을 추가합니다.
- 서명, 자격증, 또는 완전한 개인 도구 논쟁을 기록하지 마십시오.

성공이란 파괴적인 도구가 두 정체성이 정확한 기록, 패키지, 도구 집합 소화를 승인하지 않는 한 활성화 될 수 없다는 것을 의미합니다.

## 배송된 유물

이 수업은 니다`outputs/skill-mcp-registry-admission.md`. 새로운 레지스트리 버전을 검토하거나 유동을 조사할 때 평면하고 재사용 가능한 런북으로 사용하십시오. 그것은 샘플 클래스 이름에 의존하지 않고 입력, 거부 규칙, 증거 묶음, 상태 조화 및 롤백 증명을 정의합니다.

## 확인 해 보

시범과 결정적 수단을 실행하세요:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

검증은 다음과 같은 사실을 증명해야 합니다.

- 정확한 이름 공간 경계는 비슷한 표본을 거부합니다
- 공식 이름 공간 레지스트리 상태만이 버전을 지원할 수 있습니다
- 검증되지 않은 또는 일치하지 않은 패키지 및 원격 증거가 거부됩니다.
- 출판사 메타데이터는 레지스트리 관리 메타데이터를 모방할 수 없습니다
- 도구 순서는 설명자 변경을 숨기지 않고 정상화됩니다
- 잘못된 포장 및 도구 구조는 안전하게 거부됩니다
- `serverInfo`진단과 같은 상태로 남아 있으며 입학청을 제공하지 않습니다.
- 디스크립터 드리프 격리, 비활성화 및 피인으로 돌아가는 블록
- 상태 변경 격리 활성 핀
- 롤백은 격리 된 또는 알려지지 않은 버전을 선택할 수 없습니다
- 리저 조작이 감지됩니다

## 생산 실패 모드

| Failure | Why it happens | Required response |
|---|---|---|
| Name looks valid but namespace was never authenticated | Policy trusted record text | Reject until a trusted namespace verifier supplies the exact prefix |
| Same package coordinate returns new bytes | Mutable upstream or compromised distribution | Stop activation, retain both digests, investigate the fetch boundary |
| “Latest” changes without review | Floating selection escaped the pin | Resolve only exact admitted versions and digests |
| New tool appears after approval | Runtime drift or a different deployment | Quarantine the route and capture a fresh descriptor observation |
| Deprecated version remains active | Status sync is missing or delayed | Reconcile status on a schedule and before activation |
| Deleted record disappears from default sync | Client requested only active records | Use incremental or deleted-aware reconciliation and preserve local history |
| Rollback target was never admitted | Route control and approval state are disconnected | Refuse rollback and run a new admission for the target |
| Ledger verifies locally after an attacker rewrites all entries | Hash chain has no external anchor | Publish signed ledger heads to a separate trust domain |
| Evidence contains bearer tokens or tool arguments | Logging copied whole requests | Redact at collection time and store only the minimum proof |

## 운영 규칙

출판 답변 이 정체성은 이 이름을 공개할 수 있습니까? 입수 답변 이 정확한 유물을 실행하고 정확한 행동을 노출시킬 수 있습니까?

## 더 많은 읽기

- [Official Registry server.json requirements](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [Official Registry OpenAPI contract](https://registry.modelcontextprotocol.io/openapi.yaml)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
