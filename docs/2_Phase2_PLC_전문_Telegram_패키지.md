# Phase 2: PLC 전문(Telegram) 패키지 (packages/telegram)

> 우정사업본부 자동화설비 표준 인터페이스 및 통합플랫폼 구현 프롬프트

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
