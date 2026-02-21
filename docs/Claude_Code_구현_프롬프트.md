# 우정사업본부 자동화설비 표준 인터페이스 및 통합플랫폼 구현 프롬프트

> 이 문서는 Claude Code에 단계별로 입력하여 시스템을 구현하기 위한 프롬프트 모음입니다.
> 각 Phase를 순서대로 실행하되, 하나의 Phase가 완료된 후 다음 Phase를 진행하세요.

---

## Phase 0: 프로젝트 초기화 및 기술 스택 설정

```
우정사업본부 자동화설비 표준 인터페이스 통합플랫폼 프로젝트를 초기화해줘.

프로젝트명: kpost-automation-platform
모노레포 구조로 구성하고, 아래 기술 스택을 사용해:

[기술 스택]
- 언어: TypeScript (백엔드/프론트엔드 공통)
- 백엔드 프레임워크: NestJS
- 프론트엔드: React + Vite + TailwindCSS + shadcn/ui
- 데이터베이스: PostgreSQL (운영DB/통계DB), Redis (실시간 상태 캐싱)
- ORM: Prisma
- 통신: TCP 소켓 (PLC 전문 통신), WebSocket (실시간 모니터링), REST API (SIMS/KPLAS 연계)
- 파일 전송: FTP 클라이언트/서버 (MLF 파일, 주소DB 파일)
- 메시지 큐: Bull (Redis 기반, 비동기 작업 처리)
- 모니터링: Prometheus + Grafana
- 컨테이너: Docker + Docker Compose
- 테스트: Jest + Supertest
- 문서화: Swagger (API), AsyncAPI (소켓 통신)

[모노레포 구조]
kpost-automation-platform/
├── apps/
│   ├── central-relay/        # 중앙 중계기 서버
│   ├── local-relay/          # 로컬 중계기 서버
│   ├── standard-sw/          # 표준 SW (SMC/CGS 통합)
│   ├── web-dashboard/        # 웹 대시보드 (React)
│   └── plc-simulator/        # PLC 시뮬레이터 (테스트용)
├── packages/
│   ├── protocol/             # 표준 인터페이스 프로토콜 정의
│   ├── telegram/             # PLC 전문(Telegram) 파서/빌더
│   ├── database/             # Prisma 스키마 및 DB 유틸리티
│   ├── common/               # 공통 타입, 상수, 유틸리티
│   └── logger/               # 통합 로깅 모듈
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── Dockerfile.*
├── docs/
│   ├── architecture/
│   ├── interface-specs/
│   └── api/
├── turbo.json
├── package.json
└── tsconfig.base.json

각 패키지와 앱의 package.json, tsconfig.json을 설정하고, 
turborepo를 이용한 빌드 파이프라인을 구성해줘.
Docker Compose로 PostgreSQL, Redis, 개발 환경을 구성해줘.
```

---

## Phase 1: 표준 프로토콜 패키지 (packages/protocol)

```
packages/protocol 패키지를 구현해줘.
이 패키지는 우편물자동구분기의 상위단(중앙)과 하위단(로컬) 표준 인터페이스 프로토콜을 정의한다.

[1. 상위단(중앙) 인터페이스 프로토콜]

SIMS/KPLAS와 구분관리시스템 간 데이터 연계 프로토콜을 정의해:

// 연계 방식별 인터페이스
interface CentralProtocol {
  // DB2DB 연계
  db2db: {
    // SIMS → 구분기 (수신)
    inbound: {
      receptionInfo: ReceptionInfo;        // 접수정보 (소포, 등기통상)
      addressRouteDB: AddressRouteDB;      // 주소 및 순로DB (집배순로)
    };
    // 구분기 → SIMS (송신)
    outbound: {
      sortingResult: SortingResultInfo;    // 구분결과정보 (소포)
      bindingInfo: BindingInfo;            // 체결정보 (등기통상)
      statisticsInfo: StatisticsInfo;      // 통계정보 (모든 자동화설비)
    };
  };
  // FTP 연계
  ftp: {
    // KPLAS → 소형통상구분기
    deliveryAddressDB: DeliveryAddressDBFile;  // 배달점주소DB파일
    mlfFile: MLFFile;                          // MLF파일 (또는 주소DB파일)
    sortingPlan: SortingPlanFile;              // 구분계획
  };
  // 소켓통신 연계
  socket: {
    // PDA ↔ 소포체결 수작업시스템
    labelBarcode: LabelBarcodeInfo;       // 국명표바코드
    containerNumber: ContainerNumberInfo;  // 용기번호
    registeredBarcode: RegisteredBarcodeInfo; // 등기바코드
    bindingConfirm: BindingConfirmInfo;   // 체결확인
    sortingZoneInfo: SortingZoneInfo;     // 구분구정보
  };
}

각 인터페이스의 상세 타입을 정의하고, 직렬화/역직렬화 유틸리티를 구현해줘.
DB2DB 동기화를 위한 변경감지(CDC) 메커니즘도 포함해.
SIMS 장애 시 CSV 파일로 Post-Net에 직접 등록할 수 있는 Fallback 메커니즘도 구현해.

[2. 하위단(로컬) 인터페이스 프로토콜]

구분관리시스템과 PLC/IPS/OCR 등 H/W 장비 간 TCP/IP 소켓통신 프로토콜:

// 장비 유형별 프로토콜
interface LocalProtocol {
  plc: PLCProtocol;          // PLC 제어 전문
  ips: IPSProtocol;          // IPS(BCR) 바코드 판독
  ocr: OCRProtocol;          // OCR 주소 인식
  scada: SCADAProtocol;      // SCADA 상태 모니터링
  display: DisplayProtocol;  // 현황판 (슈트/구분칸/상황관제/작업)
  conveyor: ConveyorProtocol; // C/V PLC
}

프로토콜은 설비 유형에 따라 두 가지 프로파일로 구분해:
- Profile A (소포/대형통상구분기): IPS 바코드 기반, 타건기 지원, 슈트현황판, 상황관제
- Profile B (소형통상/집배순로구분기): OCR/IMS 기반, MLF파일 지원, 구분칸현황판, 작업현황판(OP패널), 상자적재대 PLC

모든 프로토콜에 대해:
- TypeScript 인터페이스 및 Zod 스키마 정의
- 바이너리 직렬화/역직렬화 (Buffer 기반)
- 프로토콜 버전 관리
- 에러 코드 정의
```

---

## Phase 2: PLC 전문(Telegram) 패키지 (packages/telegram)

```
packages/telegram 패키지를 구현해줘.
PLC와 SMC 간 송수신되는 표준 전문(Telegram) 메시지의 파서와 빌더를 구현한다.

[전문 공통 구조]
모든 전문은 다음 공통 헤더를 가진다:
- STX: 1 byte (Hex, 패킷 시작 문자 0x02)
- DataType: 1 byte (Char, 패킷 종류)  
- ModuleID: 6 byte (Char, 모듈ID - "PSM00" 형식)
- TelegramNo: 2 byte (Integer, 메시지 번호)
- DataLength: 2 byte (Integer, 데이터 길이)
- [... 전문별 가변 데이터 ...]
- ETX: 1 byte (Hex, 패킷 종료 문자 0x03)

[PLC → SMC 전문 목록]
Telegram 1  (HeartBeat): AcknowledgeStatus(2), HeartBeatNo(2)
Telegram 10 (SorterStatus): SorterStatus(2) - 구분기 운전/정지 상태
Telegram 11 (InductionStatus): InductionCount(2), InductionNo(2), InductionStatus(2) 
Telegram 12 (InductionMode): InductionCount(2), InductionNo(2), InductionMode(2)
Telegram 20 (ItemInducted): CellIndex(2), InductionNo(2), Mode(2), PID(4), CartNumber(2), Destination1~8(각 2) - 소포 투입
Telegram 21 (ItemDischarged): CellIndex(2), InductionNo(2), Mode(2), ChuteNumber(2), RecirculationCount(2) - 소포 배출
Telegram 22 (ItemSortedConfirm): CellIndex(2), Mode(2), ChuteNumber(2), RecirculationCount(2), Status(2) - 구분완료
Telegram 40 (CodeRequest): InductionNo(2) - 타건 요청

[SMC → PLC 전문 목록]  
Telegram 30 (DestinationRequest): InductionNo(2), PID(4), Destination1~8(각 2) - 목적지 요청(자동)
Telegram 41 (CodeResult): TelegramNo(2), CellIndexNo(2), Destination1~8(각 2) - 타건 결과
Telegram 100 (SetControlSorter): Request(2) - 구분기 운전/정지
Telegram 101 (SetControlSorterAck): Request(2), Reason(2) - 응답
Telegram 110 (SetControlInduction): InductionNo(2), Request(2) - 인덕션 운전/정지
Telegram 111 (SetControlInductionAck): InductionNo(2), Status(2), Reason(2) - 응답
Telegram 120 (SetInductionMode): InductionNo(2), Request(2) - 모드변경
Telegram 121 (SetInductionModeAck): InductionNo(2), Request(2) - 응답
Telegram 130 (SetOverflowConfiguration): OverflowChute1(2), OverflowChute2(2), MaxRecirculation(2), Reason(2) - 오버플로 설정
Telegram 131 (SetOverflowConfigurationAck): 응답
Telegram 140 (SetResetRequest): ResetModule(2) - 알람 해제
Telegram 141 (SetResetRequestAck): ResetModule(2) - 응답

[구현 요구사항]
1. TelegramFactory: 전문 번호로 적절한 파서/빌더를 반환하는 팩토리
2. TelegramParser: Buffer → TypeScript 객체 변환 (각 전문별)
3. TelegramBuilder: TypeScript 객체 → Buffer 변환 (각 전문별)
4. TelegramValidator: 전문 구조 유효성 검증 (STX/ETX, 길이, 필수 필드)
5. PID 생성 로직:
   - 자동: SPS(공급장치)에서 생성
   - 1번 인덕션: 자동 100001~115000 / 타건 115001~130000
   - 2번 인덕션: 자동 200001~215000 / 타건 215001~230000
   - 3번 인덕션: 자동 300001~315000 / 타건 315001~330000
   - 4번 인덕션: 자동 400001~415000 / 타건 415001~430000
6. 통신 포트 구성:
   - Send Channel-Destination: 3003
   - Send Channel-MCS: 3011
   - Send Channel-Heartbeat: 3001
   - Receive Channel-Discharge: 3000
   - Receive Channel-Confirm: 3004
   - Receive Channel-MCS: 3010
   - Receive Channel-Induct: 3006

모든 전문에 대한 단위 테스트를 작성하고, 
바이너리 직렬화/역직렬화가 정확한지 round-trip 테스트를 포함해줘.
```

---

## Phase 3: 데이터베이스 설계 (packages/database)

```
packages/database 패키지를 구현해줘. Prisma ORM을 사용한다.

[운영 DB - psm_operation 스키마]

1) 모델 정의 테이블:
- tb_model_machine_mt: 구분기 Model 정의 Master
  (machine_id VARCHAR(6) PK, machine_type VARCHAR(1) 소포:P/C:Conveyor/S:Sorter, 
   machine_name VARCHAR(14), machine_base_time VARCHAR(4), machine_desc VARCHAR(100),
   machine_center_name VARCHAR(30), sorting_mode VARCHAR(1) 일반:N/체결:C, 
   multi_yn VARCHAR(1) 멀티바코드 사용여부)
- tb_model_group_mt: 모듈 Group 정의 Master
- tb_model_module_mt: 모듈 정의 Master
- tb_model_machine_dt: 구분기 모델 정의 상세
- tb_model_pc_mt: PC 모델 정의

2) 운영 테이블:
- tb_oper_machine_state_ht: 장비 각 모듈의 상태 이력
- tb_oper_sorting_plan_mt: 구분계획 정의 Master
- tb_oper_sorting_plan_dt: 구분계획 설정값 상세
- tb_oper_sorting_plan_ht: 구분계획 변동 이력
- tb_oper_sorting_plan_config_dt: 구분계획 운영 설정 상세
- tb_oper_chute_management_dt: 슈트현황판 행선지 내용
- tb_oper_entrust_size_mt: 위탁 크기 정의 Master
- tb_group_code_mt: 그룹코드 정의
- tb_sort_code_mt: 구분코드 정의
- tb_office_code_mt: 우체국코드 정의
- tb_oper_special_key_mt: 구분계획 특수키 Master
- tb_oper_special_key_dt: 구분계획 특수키 상세

3) CGS 테이블:
- tb_hmi_alarm_mt: HMI(CGS) Alarm 정의 Master
- tb_hmi_alarm_ht: HMI(CGS) Alarm 이력

4) 소포 테이블:
- tb_item_parcel_dt: 소포정보 상세

5) 통계 테이블:
- tb_stat_summary_statistics: 요약 통계정보
- tb_stat_induction_statistics: Induction별 통계
- tb_stat_chute_statistics: Chute별 통계
- tb_stat_code_statistics: 우편번호 코드별 통계
- tb_stat_sorter_statistics: 구분기 통계

6) 접수정보 테이블:
- tb_sim_regi_info: 접수정보 연계

[SIMS 연계 통계 DB - psm_reginfo 스키마]
- psm_statistics: 송신용 전체 통계
- psm_induction_statistics: 송신용 공급부 통계
- psm_chute_statistics: 송신용 구분구 통계
- psm_post_amount: 송신용 우편번호 통계
- psm_request: 송신용 완료 확인
- psm_reg_post_result: 구분정보 연계
- poem_t0050: 설비상태정보

[데이터 생명주기 스케줄러]
다음 스케줄러를 구현해:
- BATCH_REPORT (매일 10분마다):
  - Local 전체 통계, Local 인덕션별 통계, Local 구분구별 통계
  - Local 코드별 통계, Local 구분기별 통계 (매 10분)
  - SIMS 전체 통계, SIMS 구분구별 통계
  - SIMS 코드별 통계, SIMS 구분기별 통계 (매 30분)
- BATCH_DELETE (매일 오후 12시 15분):
  - Local 통계(전체): 60일 이전 데이터 삭제
  - 걸업이력: 60일 이전
  - 구분 데이터: 60일 이전
  - SIMS 통계(전체): 3일 이전
  - 접수정보: 7일 이전
  - 체결/구분 정보: 14일 이전
- 백업: 매주 일요일 오전 11시 30분

Prisma 스키마, 마이그레이션, seed 데이터, 그리고 
Bull 기반의 스케줄러 서비스를 구현해줘.
```

---

## Phase 4: 중앙 중계기 서버 (apps/central-relay)

```
apps/central-relay를 NestJS 기반으로 구현해줘.
중앙 중계기는 우정사업정보센터의 SIMS와 각 집중국의 상위SW 사이에서 데이터를 중계하는 서버이다.

[핵심 모듈]

1. ConnectionModule (통신상태 관리):
   - SIMS와의 DB2DB 연결 상태 모니터링
   - 각 집중국 상위SW와의 연결 상태 모니터링
   - 연결 실패 시 자동 재연결 (exponential backoff)
   - 통신상태 대시보드 API

2. DataSyncModule (데이터 동기화):
   - SIMS → 각 집중국: 접수정보, 주소/순로DB 동기화
   - 각 집중국 → SIMS: 구분결과, 체결정보, 통계정보 동기화
   - 변경 감지 기반 증분 동기화
   - 동기화 충돌 해결 전략 (last-write-wins + 로그)
   - 트랜잭션 기반 일관성 보장

3. FTPModule (파일 전송):
   - KPLAS → 소형통상구분기: 배달점주소DB, MLF파일 전송
   - 구분계획 파일 배포
   - 파일 전송 상태 추적 및 재전송

4. FallbackModule (장애 대응):
   - SIMS 장애 감지 (HeartBeat 기반)
   - 장애 시 CSV 파일 자동 생성 (체결정보 → Post-Net 직접 등록용)
   - 장애 복구 후 미전송 데이터 자동 동기화

5. LogModule (통신 로그):
   - 모든 송수신 데이터 로깅
   - 로그 검색/필터링 API
   - 로그 보존 기간 관리 (60일)

6. ConfigModule (설정 관리):
   - 집중국별 연결 설정 (서울, 부산, 대구, 광주, 대전)
   - 통신 프로토콜 설정
   - 동기화 주기 설정

[API 엔드포인트]
- GET /api/status - 전체 시스템 상태
- GET /api/connections - 각 집중국 연결 상태
- GET /api/logs - 통신 로그 조회 (필터: 날짜, 집중국, 방향)
- POST /api/sync/trigger - 수동 동기화 트리거
- GET /api/sync/history - 동기화 이력
- PUT /api/config - 설정 변경
- GET /api/fallback/status - Fallback 상태 및 미전송 목록

WebSocket 엔드포인트:
- /ws/status - 실시간 통신상태 스트림
- /ws/logs - 실시간 로그 스트림

각 모듈에 대한 단위/통합 테스트를 작성해줘.
```

---

## Phase 5: 로컬 중계기 서버 (apps/local-relay)

```
apps/local-relay를 NestJS 기반으로 구현해줘.
로컬 중계기는 각 집중국의 상위SW와 H/W 장비(PLC) 사이에서 데이터를 중계하는 서버이다.

[핵심 모듈]

1. PLCConnectionModule (PLC 소켓통신):
   - TCP/IP 소켓 서버/클라이언트 (포트별 채널 관리)
   - packages/telegram 패키지를 사용한 전문 파싱/빌딩
   - HeartBeat 기반 연결 상태 관리
   - 자동 재연결 및 버퍼 관리
   - 포트 구성:
     * Send: 3003(Destination), 3011(MCS), 3001(Heartbeat)
     * Receive: 3000(Discharge), 3004(Confirm), 3010(MCS), 3006(Induct)

2. IPSModule (IPS/BCR 연계):
   - 바코드 판독 정보 수신
   - 우편물ID, 트리거 정보 처리
   - IPS 상태/알람 정보 모니터링

3. EquipmentMonitorModule (장비 상태 모니터링):
   - PLC 상태정보, 알람정보 수집
   - IPS/OCR 상태 정보
   - C/V PLC 상태정보
   - 상자적재대 PLC 상태정보 (소형통상/집배순로)
   - 장비 상태 변경 이벤트 발행

4. SimulatorModule (시뮬레이터 모드):
   - H/W 장비 연결 없이 표준 인터페이스 검증용
   - 가상 PLC 에뮬레이션 (모든 Telegram 응답 시뮬레이션)
   - 홀수/짝수/나눗셈 등의 구분규칙으로 실물 구분 테스트
   - 에뮬레이터에서 코드/데이터/제한시간의 기준값과 실제값 비교 검증
   - 수치/그래프 등 비교 분석 이상여부 확인

5. OperationModule (운영 모드):
   - 시뮬레이터 모드 ↔ 운영 모드 전환
   - 운영 모드에서 실제 H/W 장비와 통신
   - 모드 전환 시 안전 검증 절차

6. TestModule (테스트 기능):
   - 상위시스템 SW의 역할을 중계기가 대신하여 H/W 장비 직접 테스트
   - 실물 우편물 투입 → 구분결과 실시간 확인
   - 인터페이스 프로토콜 준수 여부 검증
   - 테스트 리포트 생성

7. MaintenanceModule (유지보수 기능):
   - 중계기 제거 후 배장비의 상위시스템 SW 연결 테스트
   - H/W 장비 정상작동 여부 확인
   - 유지보수 검사 기능

[API 및 WebSocket]
- GET /api/status - 전체 장비 상태
- GET /api/plc/status - PLC 연결 상태 및 전문 통계
- GET /api/equipment - 장비별 상세 상태
- GET /api/logs/comm - 통신 로그
- POST /api/mode/switch - 시뮬레이터/운영 모드 전환
- POST /api/test/start - 테스트 실행
- GET /api/test/report/:id - 테스트 리포트 조회
- PUT /api/config/equipment - 장비 설정
- PUT /api/config/comm - 통신 설정
- /ws/plc-stream - PLC 전문 실시간 스트림
- /ws/equipment-status - 장비 상태 실시간 스트림
- /ws/alarms - 알람 실시간 스트림

모든 모듈에 대한 테스트를 작성해줘.
```

---

## Phase 6: 표준 SW - 구분관리/관제/모니터링 시스템 (apps/standard-sw)

```
apps/standard-sw를 NestJS 기반으로 구현해줘.
이것은 기존 제작사별로 각각 개발되던 SMC, CGS 등을 통합한 표준 소프트웨어이다.

[1. 정보연계시스템 모듈 (InfoLinkModule)]
- DB 테이블, 쿼리, 스케줄러 설계 및 구현
- 구분데이터/통계테이블/스케줄러 생성
- 쿼리 작성 및 구분데이터 관리
- SIMS/KPLAS와의 데이터 동기화 처리

[2. 구분시스템 모듈 (SortingModule)]
- 통신로그/장비제어 화면 데이터 API
- 구분계획 관리 (생성/수정/삭제/활성화)
- 특수키 계획 관리 (특수키 등록/조회/삭제)
- 구분로직 엔진:
  * 바코드 판독정보 수집
  * 구분계획에 의한 목적지 검색
  * 목적지 할당 및 PLC 전송
  * 타건로직 (필요 시): 타건 요청 → 타건 결과 반영
- 구분계획 활성화/비활성화 관리

[3. 통계시스템 모듈 (StatisticsModule)]
- 통계 데이터 수집 (10분 주기 Local, 30분 주기 SIMS)
- 통계별 출력 API:
  * 요약 통계 (공급수/판독수/구분수/시간당처리량)
  * 인덕션별 통계
  * 슈트(Chute)/구분칸별 구분수
  * 코드별(우편번호) 통계
  * 구분기별 통계
  * 행선지별 구분수
- 통계 기간 필터링 (일별/주별/월별)
- CSV/Excel 내보내기

[4. 모니터링시스템 모듈 (MonitoringModule)]
- 장비별 CGS 편집 화면 데이터 API:
  * 소포구분기 전체 상태 (트랙, 인덕션, 구분구, C/V 등)
  * 각 구분구 번호 표시
  * 구분구별 상태: 만재, 미사용, JAM, Error
- 실시간 알람 관리:
  * 알람 발생/해제 이벤트 처리
  * 알람 이력 조회
  * 사용자 조치사항 입력 및 조회
- 장비 간 통신 현황 조회

[5. 타건기시스템 모듈 (KeyingModule)] - 소포/대형통상
- 타건기 화면 데이터 API
- 버튼별 기능 매핑
- 타건 요청 수신 → 타건 화면 표시 → 타건 결과 전송
- 타건 이력 관리

[6. 슈트현황판시스템 모듈 (ChuteDisplayModule)] - 소포
- 슈트현황판 내용 관리 (행선지 배정)
- 슈트별 구분수, 만재 상태 실시간 표시
- 구분계획 변경 시 자동 업데이트

[7. 상황관제시스템 모듈 (SituationControlModule)] - 소포
- 소포배달정별 구분정보 등 전체 현황
- Chute별 행선지 및 구분수량 표시
- 구분기 상태, 알람 메시지 표시

[API 엔드포인트 설계]
RESTful API로 각 모듈의 CRUD 및 조회 기능을 구현하고,
WebSocket으로 실시간 데이터 (구분 현황, 알람, 장비 상태)를 스트리밍해줘.

각 모듈의 단위/통합 테스트를 작성해줘.
```

---

## Phase 7: 웹 대시보드 (apps/web-dashboard)

```
apps/web-dashboard를 React + Vite + TailwindCSS + shadcn/ui로 구현해줘.
모든 시스템(중앙 중계기, 로컬 중계기, 표준 SW)의 통합 관제 대시보드이다.

[페이지 구성]

1. 대시보드 홈 (/dashboard):
   - 전체 시스템 상태 개요 (연결 상태, 가동률, 알람 수)
   - 집중국별 상태 카드 (서울, 부산, 대구, 광주, 대전)
   - 실시간 처리량 차트 (시간당 구분수)
   - 최근 알람 리스트

2. 구분계획 관리 (/sorting-plan):
   - 구분계획 목록/생성/수정/삭제
   - 특수키 관리
   - 구분계획 활성화/비활성화
   - 슈트별 행선지 배정 편집 (드래그앤드롭)

3. 실시간 모니터링 (/monitoring):
   - 소포구분기 레이아웃 뷰 (트랙, 인덕션, 슈트 시각화)
   - 장비별 상태 표시 (정상/경고/에러/미사용 색상 구분)
   - 구분구별 만재/JAM/Error 실시간 표시
   - 실시간 우편물 흐름 애니메이션

4. 통계 (/statistics):
   - 요약 통계 대시보드 (KPI 카드)
   - 인덕션별/슈트별/코드별/구분기별 차트
   - 기간 필터 (일/주/월)
   - CSV/Excel 다운로드

5. 알람 관리 (/alarms):
   - 실시간 알람 목록 (WebSocket)
   - 알람 이력 검색/필터
   - 조치사항 입력
   - 알람 종류별 분류 (PLC, IPS, DB, PC 등)

6. 통신 로그 (/logs):
   - 중앙/로컬 중계기 통신 로그 조회
   - 실시간 로그 스트림
   - 전문(Telegram) 상세 뷰어 (바이너리 → 구조체 파싱 표시)

7. 중계기 관리 (/relay):
   - 중앙/로컬 중계기 상태
   - 시뮬레이터/운영 모드 전환 UI
   - 테스트 실행 및 리포트 조회
   - 장비/통신 설정 관리

8. 타건기 화면 (/keying) - 소포/대형통상:
   - 우편물 이미지 표시
   - 구분 버튼 패널
   - 타건 이력

9. 슈트현황판 (/chute-display) - 소포:
   - 대형 모니터용 전체화면 뷰
   - 슈트별 행선지, 구분수량 실시간 표시

10. 상황관제 (/situation-control) - 소포:
    - 배달정별 구분정보 종합 현황
    - 상태/알람 메시지 실시간 표시

[기술 요구사항]
- 반응형 디자인 (데스크톱/태블릿)
- 다크모드 지원
- 실시간 데이터: WebSocket 연결 관리 (자동 재연결, 상태 표시)
- 차트: Recharts 사용
- 상태 관리: Zustand
- 라우팅: React Router v6
- 인증: JWT 기반 (역할: 관리자, 운영자, 모니터링)
- 국제화: 한국어 기본, 영어 지원
```

---

## Phase 8: PLC 시뮬레이터 (apps/plc-simulator)

```
apps/plc-simulator를 구현해줘.
실제 PLC H/W 없이 개발/테스트할 수 있는 PLC 시뮬레이터이다.

[기능]
1. TCP 소켓 서버로 동작하여 실제 PLC처럼 통신
2. 모든 Telegram 전문을 시뮬레이션:
   - HeartBeat 주기적 전송
   - 구분기/인덕션 상태 응답
   - 우편물 투입(ItemInducted) 이벤트 시뮬레이션
   - 우편물 배출(ItemDischarged) 이벤트 시뮬레이션
   - 구분완료(ItemSortedConfirm) 이벤트 시뮬레이션
   - 타건 요청(CodeRequest) 시뮬레이션
   - 제어 명령에 대한 ACK 응답

3. 시뮬레이션 시나리오:
   - 정상 운영: 일정 간격으로 우편물 투입 → 구분 → 완료
   - 장애 시나리오: PLC 에러, Motor trip, JAM 발생
   - 부하 테스트: 대량 우편물 동시 투입
   - 오버플로: 슈트 만재 상황 시뮬레이션

4. 설정 가능한 파라미터:
   - 인덕션 수 (1~4)
   - 슈트/구분구 수
   - 우편물 투입 간격
   - 에러 발생 확률
   - 구분 성공률

5. CLI 및 웹 UI 제공:
   - 시나리오 선택 및 실행
   - 실시간 전문 송수신 로그
   - 가상 장비 상태 표시

구분기 유형별(소포, 대형통상, 소형통상, 집배순로) 프로파일을 지원해줘.
```

---

## Phase 9: 통합 테스트 및 E2E 테스트

```
전체 시스템의 통합 테스트 및 E2E 테스트를 구현해줘.

[통합 테스트 시나리오]

1. 정상 구분 플로우 (소포구분기):
   접수정보 수신 → 구분계획 활성화 → PLC 가동 → 우편물 투입 
   → 바코드 판독 → 목적지 결정 → 구분 완료 → 통계 생성 → SIMS 전송

2. 타건 플로우:
   바코드 판독 실패 → 타건 요청 → 타건기 화면 표시 
   → 수동 입력 → 타건 결과 전송 → 구분 완료

3. 체결 플로우:
   소포 구분 완료 → 체결정보 생성 → SIMS 전송 
   (SIMS 장애 시 → CSV 파일 생성 → Post-Net 직접 등록)

4. 중계기 시뮬레이터 모드 테스트:
   시뮬레이터 모드 활성화 → 가상 PLC 연결 → 전문 송수신 검증
   → 에뮬레이터 기반 인터페이스 코드/데이터 비교 → 테스트 리포트 생성

5. 장애 복구 테스트:
   PLC 연결 끊김 → 재연결 → 미전송 데이터 복구
   SIMS 연결 끊김 → Fallback(CSV) → 복구 후 동기화

6. 데이터 생명주기 테스트:
   데이터 생성 → 스케줄러 실행 → 보존기간 초과 데이터 삭제 확인

[E2E 테스트]
Docker Compose로 전체 시스템(DB, Redis, 중앙중계기, 로컬중계기, 
표준SW, PLC시뮬레이터)을 기동하고, 위 시나리오를 자동화된 E2E 테스트로 실행해줘.

테스트 커버리지 목표: 80% 이상
```

---

## Phase 10: 배포 및 운영 환경 구성

```
프로덕션 배포 및 운영 환경을 구성해줘.

[Docker 이미지]
각 앱별 최적화된 Docker 이미지 (multi-stage build):
- central-relay
- local-relay  
- standard-sw
- web-dashboard
- plc-simulator

[Docker Compose 프로파일]
1. development: 전체 스택 로컬 실행
2. testing: 테스트 환경 (PLC 시뮬레이터 포함)
3. staging: 실증화 환경 (실제 PLC 연결)
4. production: 운영 환경

[모니터링]
- Prometheus: 메트릭 수집 (처리량, 응답시간, 에러율, 연결 상태)
- Grafana: 대시보드 (사전 구성된 패널)
  * 시스템 개요 (CPU, 메모리, 네트워크)
  * 구분기 성능 (시간당 처리량, 구분 성공률)
  * 통신 상태 (PLC 연결, SIMS 연결, 전문 송수신)
  * 알람 현황

[로깅]
- 구조화 로깅 (JSON format)
- 로그 레벨: ERROR, WARN, INFO, DEBUG
- 로그 로테이션 (일별, 60일 보존)

[환경 변수]
- 집중국별 설정 (DB 접속, PLC 주소, SIMS 연결 등)
- 보안 설정 (DB 비밀번호, JWT 시크릿 등)

[헬스체크]
각 서비스의 /health 엔드포인트:
- DB 연결 상태
- Redis 연결 상태
- PLC 연결 상태 (local-relay)
- SIMS 연결 상태 (central-relay)

README.md에 설치/실행/배포 가이드를 작성해줘.
```

---

## 실행 순서 가이드

| 순서 | Phase | 예상 소요 | 의존성 |
|------|-------|---------|--------|
| 1 | Phase 0: 프로젝트 초기화 | 30분 | 없음 |
| 2 | Phase 1: 프로토콜 패키지 | 2시간 | Phase 0 |
| 3 | Phase 2: Telegram 패키지 | 2시간 | Phase 0 |
| 4 | Phase 3: 데이터베이스 | 1.5시간 | Phase 0 |
| 5 | Phase 4: 중앙 중계기 | 3시간 | Phase 1, 3 |
| 6 | Phase 5: 로컬 중계기 | 3시간 | Phase 1, 2, 3 |
| 7 | Phase 6: 표준 SW | 4시간 | Phase 1, 2, 3 |
| 8 | Phase 7: 웹 대시보드 | 4시간 | Phase 4, 5, 6 |
| 9 | Phase 8: PLC 시뮬레이터 | 2시간 | Phase 2 |
| 10 | Phase 9: 통합 테스트 | 2시간 | Phase 4~8 |
| 11 | Phase 10: 배포 구성 | 1시간 | 전체 |

---

## 주의사항

1. **각 Phase를 하나씩 순서대로 진행하세요.** 한 번에 모든 Phase를 입력하지 마세요.
2. **Phase 완료 후 빌드/테스트를 확인한 뒤** 다음 Phase로 진행하세요.
3. **에러 발생 시** 해당 Phase 내에서 수정을 완료한 후 진행하세요.
4. Phase 내용이 너무 길면 모듈 단위로 나누어 입력해도 됩니다.
5. 프로젝트 컨텍스트가 유실되면 `CLAUDE.md` 파일을 참조하도록 요청하세요.
