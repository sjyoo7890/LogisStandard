/**
 * 프로토콜 데모 데이터 (웹 대시보드용)
 */

// [1] 프로토콜 버전
export const protocolVersion = {
  version: '1.0.0',
  compatibleVersions: ['1.0.0'],
  status: 'STABLE',
};

// [2] 에러 코드 예시
export const errorExamples = [
  { code: 'E0001', severity: 'ERROR', category: '공통', message: '잘못된 메시지 형식' },
  { code: 'E1001', severity: 'CRITICAL', category: '상위단', message: 'DB2DB 동기화 실패' },
  { code: 'E1201', severity: 'CRITICAL', category: '상위단', message: 'SIMS 접속 불가' },
  { code: 'E2001', severity: 'CRITICAL', category: '하위단', message: 'PLC 연결 끊김' },
  { code: 'E2101', severity: 'ERROR', category: '하위단', message: 'IPS 바코드 판독 실패' },
  { code: 'E2201', severity: 'WARNING', category: '하위단', message: 'OCR 인식 실패' },
  { code: 'E2501', severity: 'MAJOR', category: '하위단', message: '컨베이어 잼 발생' },
];

// [3] 접수정보 (DB2DB Inbound)
export const receptionSamples = [
  { receptionId: 'RCP-2026-00001', mailType: '소포', barcode: '4201234567890', sender: '홍길동 (서울 강남구)', recipient: '김철수 (대전 유성구)', weight: 2500, status: '접수완료' },
  { receptionId: 'RCP-2026-00002', mailType: '등기', barcode: '6301234567890', sender: '이영희 (부산 해운대구)', recipient: '박민수 (서울 종로구)', weight: 350, status: '접수완료' },
  { receptionId: 'RCP-2026-00003', mailType: '익일특급', barcode: '5101234567890', sender: '정수연 (대구 수성구)', recipient: '최지영 (인천 남동구)', weight: 1200, status: '접수완료' },
  { receptionId: 'RCP-2026-00004', mailType: '국제', barcode: '7401234567890', sender: 'John (USA)', recipient: '한미영 (서울 마포구)', weight: 800, status: '접수완료' },
];

// [4] 구분결과 & 통계
export const sortingStatistics = {
  equipmentId: 'FSS-001',
  equipmentType: 'FSS (일반소포자동분류기)',
  postOffice: '서울우편집중국',
  reportDate: '2026-02-18',
  totalProcessed: 15000,
  successCount: 14200,
  rejectCount: 500,
  noReadCount: 200,
  errorCount: 100,
  throughput: 6000,
  operatingHours: 480,
  downtime: 30,
  availability: 94.12,
};

export const sortingResults = [
  { barcode: '4201234567890', sortCode: '34100', chute: 15, result: 'SUCCESS', dest: '대전우편집중국' },
  { barcode: '6301234567890', sortCode: '03050', chute: 42, result: 'SUCCESS', dest: '서울종로우체국' },
  { barcode: '5101234567890', sortCode: '21500', chute: 8, result: 'SUCCESS', dest: '인천남동우체국' },
  { barcode: '7401234567890', sortCode: '', chute: 0, result: 'NO_READ', dest: '리젝트' },
  { barcode: '9901234567890', sortCode: '', chute: 0, result: 'REJECT', dest: '리젝트 (규격초과)' },
];

// [5] CDC 변경감지 이벤트
export const cdcEvents = [
  { eventId: 'CDC-001', table: 'reception_info', operation: 'INSERT', seq: 1, time: '13:40:01', source: 'SIMS_DB' },
  { eventId: 'CDC-002', table: 'address_route_db', operation: 'UPDATE', seq: 2, time: '13:40:02', source: 'SIMS_DB' },
  { eventId: 'CDC-003', table: 'reception_info', operation: 'INSERT', seq: 3, time: '13:40:03', source: 'SIMS_DB' },
  { eventId: 'CDC-004', table: 'sorting_result', operation: 'INSERT', seq: 4, time: '13:40:05', source: 'LOCAL_DB' },
  { eventId: 'CDC-005', table: 'statistics_info', operation: 'UPDATE', seq: 5, time: '13:40:10', source: 'LOCAL_DB' },
];

// [6] FTP 구분계획
export const sortingPlans = [
  { sortCode: '34100', dest: 'DJN01', destName: '대전우편집중국', chute: 15, priority: 1 },
  { sortCode: '03050', dest: 'SEL02', destName: '서울종로우체국', chute: 42, priority: 1 },
  { sortCode: '21500', dest: 'ICN01', destName: '인천남동우체국', chute: 8, priority: 2 },
  { sortCode: '61000', dest: 'GWJ01', destName: '광주우편집중국', chute: 23, priority: 1 },
  { sortCode: '48000', dest: 'BSN01', destName: '부산우편집중국', chute: 31, priority: 1 },
  { sortCode: '41000', dest: 'SWN01', destName: '수원우편집중국', chute: 55, priority: 2 },
];

// [7] Fallback 상태
export const fallbackState = {
  status: 'INACTIVE',
  healthCheckInterval: 10000,
  failureThreshold: 3,
  recoveryThreshold: 5,
  flow: ['INACTIVE', 'ACTIVATED', 'RECOVERING', 'COMPLETED'],
};

// [8] PLC 상태
export const plcStatus = {
  equipmentId: 'FSS-001',
  running: true,
  speed: 120,
  mode: 'AUTO',
  motors: [
    { id: 'M-01', name: '메인모터', running: true, speed: 120, current: 15.2, temp: 42, fault: false },
    { id: 'M-02', name: '투입컨베이어', running: true, speed: 80, current: 8.5, temp: 38, fault: false },
    { id: 'M-03', name: '분류컨베이어', running: true, speed: 100, current: 12.1, temp: 45, fault: false },
    { id: 'M-04', name: '리젝트컨베이어', running: true, speed: 60, current: 5.3, temp: 35, fault: false },
  ],
  chutes: [
    { no: 1, dest: '서울', count: 245, full: false, rate: 49 },
    { no: 2, dest: '부산', count: 180, full: false, rate: 36 },
    { no: 3, dest: '대전', count: 420, full: true, rate: 100 },
    { no: 4, dest: '대구', count: 156, full: false, rate: 31 },
    { no: 5, dest: '광주', count: 98, full: false, rate: 20 },
    { no: 6, dest: '인천', count: 312, full: false, rate: 62 },
    { no: 7, dest: '수원', count: 267, full: false, rate: 53 },
    { no: 8, dest: '청주', count: 134, full: false, rate: 27 },
    { no: 9, dest: '전주', count: 89, full: false, rate: 18 },
    { no: 10, dest: '리젝트', count: 45, full: false, rate: 9 },
  ],
  alarms: [
    { code: 'A-001', severity: 'WARNING', message: '슈트 #3 적재 초과', zone: '분류구역', active: true },
  ],
};

// [9] IPS 바코드 판독
export const ipsResults = [
  { id: 'IPS-001', barcode: '4201234567890', type: 'CODE128', status: 'SUCCESS', confidence: 95, quality: 92, time: 12 },
  { id: 'IPS-002', barcode: '6301234567890', type: 'CODE128', status: 'SUCCESS', confidence: 98, quality: 96, time: 8 },
  { id: 'IPS-003', barcode: '', type: '-', status: 'NO_READ', confidence: 0, quality: 15, time: 50 },
  { id: 'IPS-004', barcode: '5101234567890', type: 'EAN128', status: 'SUCCESS', confidence: 88, quality: 85, time: 15 },
  { id: 'IPS-005', barcode: '9901234567890/9901234567891', type: 'CODE128', status: 'MULTI_READ', confidence: 72, quality: 60, time: 22 },
];

// [10] OCR 인식결과
export const ocrResults = [
  { id: 'OCR-001', status: 'SUCCESS', address: '대전광역시 유성구 과학로 456', zipCode: '34100', confidence: 91, time: 85 },
  { id: 'OCR-002', status: 'SUCCESS', address: '서울특별시 종로구 세종대로 209', zipCode: '03050', confidence: 94, time: 72 },
  { id: 'OCR-003', status: 'PARTIAL', address: '부산광역시 해운대구 ???', zipCode: '48000', confidence: 55, time: 120 },
  { id: 'OCR-004', status: 'FAILED', address: '(인식불가)', zipCode: '-', confidence: 12, time: 150 },
  { id: 'OCR-005', status: 'SUCCESS', address: '인천광역시 남동구 구월로 123', zipCode: '21500', confidence: 89, time: 90 },
];

// [11] 프로파일 비교
export const profileComparison = {
  profileA: {
    name: 'Profile A',
    subtitle: '소포/대형통상구분기',
    equipment: ['FSS (일반소포)', 'PPSS (등기소포)', 'IOSS (국제발착)'],
    features: ['IPS 바코드 판독', '타건기 (수동입력)', '슈트현황판', '상황관제현황판', 'SCADA', '컨베이어'],
    specs: { plc: 2, reader: '4 (IPS)', slots: '100 슈트', induction: 2, maxThroughput: '10,000/h' },
  },
  profileB: {
    name: 'Profile B',
    subtitle: '소형통상/집배순로구분기',
    equipment: ['AFCS (통상우편)', 'PLCS (소형택배)'],
    features: ['OCR 주소 인식', 'MLF파일 지원', '구분칸현황판', '작업현황판 (OP패널)', '상자적재대 PLC', 'SCADA'],
    specs: { plc: 2, reader: '6 (OCR)', slots: '200 구분칸', induction: 4, maxThroughput: '30,000/h' },
  },
  mapping: [
    { equip: 'FSS', name: '일반소포자동분류기', profile: 'A' },
    { equip: 'PPSS', name: '등기소포자동분류기', profile: 'A' },
    { equip: 'IOSS', name: '국제발착자동분류기', profile: 'A' },
    { equip: 'AFCS', name: '통상우편자동분류기', profile: 'B' },
    { equip: 'PLCS', name: '소형택배자동분류기', profile: 'B' },
  ],
};

// [12] 바이너리 직렬화 예시
export const binaryDemo = {
  input: { stx: '0x02', length: 17, equipId: 'FSS1', cmdCode: '0001', seqNo: 42 },
  hexBytes: ['02', '00', '00', '00', '11', '46', '53', '53', '31', '30', '30', '30', '31', '00', '00', '00', '2A'],
  fields: [
    { name: 'STX', offset: 0, length: 1, type: 'HEX', value: '02' },
    { name: 'LENGTH', offset: 1, length: 4, type: 'UINT32', value: '17' },
    { name: 'EQUIP_ID', offset: 5, length: 4, type: 'ASCII', value: 'FSS1' },
    { name: 'CMD_CODE', offset: 9, length: 4, type: 'ASCII', value: '0001' },
    { name: 'SEQ_NO', offset: 13, length: 4, type: 'UINT32', value: '42' },
  ],
};

// SCADA 환경 데이터
export const scadaData = {
  temperature: 42,
  humidity: 55,
  vibration: 0.3,
  powerConsumption: 85.2,
  noiseLevel: 72,
};

// ============================================================
// Phase 2: PLC 전문(Telegram) 데모 데이터
// ============================================================

// 전문 공통 헤더 구조
export const telegramHeader = {
  fields: [
    { name: 'STX', size: 1, type: 'Hex', desc: '패킷 시작 (0x02)', color: 'red' },
    { name: 'DataType', size: 1, type: 'Char', desc: '패킷 종류', color: 'orange' },
    { name: 'ModuleID', size: 6, type: 'Char', desc: '모듈 ID (PSM00)', color: 'blue' },
    { name: 'TelegramNo', size: 2, type: 'UInt16', desc: '메시지 번호', color: 'green' },
    { name: 'DataLength', size: 2, type: 'UInt16', desc: '데이터 길이', color: 'purple' },
  ],
  totalHeaderSize: 12,
  footerFields: [
    { name: 'ETX', size: 1, type: 'Hex', desc: '패킷 종료 (0x03)', color: 'red' },
  ],
};

// PLC → SMC 전문 목록
export const plcToSmcTelegrams = [
  { no: 1, name: 'HeartBeat', desc: 'PLC 하트비트 (생존 확인)', fields: 'AcknowledgeStatus(2), HeartBeatNo(2)', dataSize: 4, channel: 'Heartbeat:3001' },
  { no: 10, name: 'SorterStatus', desc: '구분기 운전/정지 상태', fields: 'SorterStatus(2)', dataSize: 2, channel: 'MCS:3010' },
  { no: 11, name: 'InductionStatus', desc: '인덕션 운전/정지 상태', fields: 'InductionCount(2), InductionNo(2), InductionStatus(2)', dataSize: 6, channel: 'MCS:3010' },
  { no: 12, name: 'InductionMode', desc: '인덕션 모드 상태', fields: 'InductionCount(2), InductionNo(2), InductionMode(2)', dataSize: 6, channel: 'MCS:3010' },
  { no: 20, name: 'ItemInducted', desc: '소포 투입 정보', fields: 'CellIndex(2), InductionNo(2), Mode(2), PID(4), CartNo(2), Dest1~8(각2)', dataSize: 26, channel: 'Induct:3006' },
  { no: 21, name: 'ItemDischarged', desc: '소포 배출 정보', fields: 'CellIndex(2), InductionNo(2), Mode(2), ChuteNo(2), RecircCount(2)', dataSize: 10, channel: 'Discharge:3000' },
  { no: 22, name: 'ItemSortedConfirm', desc: '구분완료 확인', fields: 'CellIndex(2), Mode(2), ChuteNo(2), RecircCount(2), Status(2)', dataSize: 10, channel: 'Confirm:3004' },
  { no: 40, name: 'CodeRequest', desc: '타건(수동입력) 요청', fields: 'InductionNo(2)', dataSize: 2, channel: 'Induct:3006' },
];

// SMC → PLC 전문 목록
export const smcToPlcTelegrams = [
  { no: 30, name: 'DestinationRequest', desc: '목적지 요청 (자동)', fields: 'InductionNo(2), PID(4), Dest1~8(각2)', dataSize: 22, channel: 'Destination:3003' },
  { no: 41, name: 'CodeResult', desc: '타건 결과', fields: 'TelegramNo(2), CellIndexNo(2), Dest1~8(각2)', dataSize: 20, channel: 'MCS:3011' },
  { no: 100, name: 'SetControlSorter', desc: '구분기 운전/정지 제어', fields: 'Request(2)', dataSize: 2, channel: 'MCS:3011' },
  { no: 101, name: 'SetControlSorterAck', desc: '구분기 제어 응답', fields: 'Request(2), Reason(2)', dataSize: 4, channel: 'MCS:3011' },
  { no: 110, name: 'SetControlInduction', desc: '인덕션 운전/정지', fields: 'InductionNo(2), Request(2)', dataSize: 4, channel: 'MCS:3011' },
  { no: 111, name: 'SetControlInductionAck', desc: '인덕션 제어 응답', fields: 'InductionNo(2), Status(2), Reason(2)', dataSize: 6, channel: 'MCS:3011' },
  { no: 120, name: 'SetInductionMode', desc: '모드 변경 (자동/타건)', fields: 'InductionNo(2), Request(2)', dataSize: 4, channel: 'MCS:3011' },
  { no: 121, name: 'SetInductionModeAck', desc: '모드 변경 응답', fields: 'InductionNo(2), Request(2)', dataSize: 4, channel: 'MCS:3011' },
  { no: 130, name: 'SetOverflowConfig', desc: '오버플로 설정', fields: 'OverflowChute1(2), OverflowChute2(2), MaxRecirc(2), Reason(2)', dataSize: 8, channel: 'MCS:3011' },
  { no: 131, name: 'SetOverflowConfigAck', desc: '오버플로 설정 응답', fields: 'OverflowChute1(2), OverflowChute2(2), MaxRecirc(2), Reason(2)', dataSize: 8, channel: 'MCS:3011' },
  { no: 140, name: 'SetResetRequest', desc: '알람 해제 요청', fields: 'ResetModule(2)', dataSize: 2, channel: 'MCS:3011' },
  { no: 141, name: 'SetResetRequestAck', desc: '알람 해제 응답', fields: 'ResetModule(2)', dataSize: 2, channel: 'MCS:3011' },
];

// 통신 포트(채널) 구성
export const commChannels = [
  { name: 'Send-Destination', port: 3003, dir: 'SEND', desc: '목적지 요청 (T30)', color: 'blue' },
  { name: 'Send-MCS', port: 3011, dir: 'SEND', desc: 'MCS 제어 명령 (T100~141)', color: 'blue' },
  { name: 'Send-Heartbeat', port: 3001, dir: 'SEND', desc: '하트비트 (T1)', color: 'blue' },
  { name: 'Recv-Discharge', port: 3000, dir: 'RECV', desc: '배출 정보 (T21)', color: 'green' },
  { name: 'Recv-Confirm', port: 3004, dir: 'RECV', desc: '구분완료 (T22)', color: 'green' },
  { name: 'Recv-MCS', port: 3010, dir: 'RECV', desc: 'MCS 상태 (T10~12)', color: 'green' },
  { name: 'Recv-Induct', port: 3006, dir: 'RECV', desc: '투입 정보 (T20,40)', color: 'green' },
];

// PID 범위 테이블
export const pidRanges = [
  { induction: 1, autoStart: 100001, autoEnd: 115000, keyStart: 115001, keyEnd: 130000 },
  { induction: 2, autoStart: 200001, autoEnd: 215000, keyStart: 215001, keyEnd: 230000 },
  { induction: 3, autoStart: 300001, autoEnd: 315000, keyStart: 315001, keyEnd: 330000 },
  { induction: 4, autoStart: 400001, autoEnd: 415000, keyStart: 415001, keyEnd: 430000 },
];

// 전문 빌드/파싱 Round-trip 예시 (Telegram 20: ItemInducted)
export const roundTripExample = {
  telegramNo: 20,
  name: 'ItemInducted (소포 투입)',
  input: {
    cellIndex: 150, inductionNo: 1, mode: 0, pid: 100042, cartNumber: 5,
    destination1: 15, destination2: 20, destination3: 0, destination4: 0,
    destination5: 0, destination6: 0, destination7: 0, destination8: 99,
  },
  hexBytes: [
    { offset: 0, byte: '02', field: 'STX', color: 'red' },
    { offset: 1, byte: '44', field: 'DataType', color: 'orange' },
    { offset: 2, byte: '50', field: 'ModuleID', color: 'blue' },
    { offset: 3, byte: '53', field: 'ModuleID', color: 'blue' },
    { offset: 4, byte: '4D', field: 'ModuleID', color: 'blue' },
    { offset: 5, byte: '30', field: 'ModuleID', color: 'blue' },
    { offset: 6, byte: '30', field: 'ModuleID', color: 'blue' },
    { offset: 7, byte: '00', field: 'ModuleID', color: 'blue' },
    { offset: 8, byte: '00', field: 'TelegramNo', color: 'green' },
    { offset: 9, byte: '14', field: 'TelegramNo', color: 'green' },
    { offset: 10, byte: '00', field: 'DataLength', color: 'purple' },
    { offset: 11, byte: '1A', field: 'DataLength', color: 'purple' },
    // Data area (26 bytes)
    { offset: 12, byte: '00', field: 'CellIndex', color: 'cyan' },
    { offset: 13, byte: '96', field: 'CellIndex', color: 'cyan' },
    { offset: 14, byte: '00', field: 'InductionNo', color: 'cyan' },
    { offset: 15, byte: '01', field: 'InductionNo', color: 'cyan' },
    { offset: 16, byte: '00', field: 'Mode', color: 'cyan' },
    { offset: 17, byte: '00', field: 'Mode', color: 'cyan' },
    { offset: 18, byte: '00', field: 'PID', color: 'yellow' },
    { offset: 19, byte: '01', field: 'PID', color: 'yellow' },
    { offset: 20, byte: '86', field: 'PID', color: 'yellow' },
    { offset: 21, byte: 'EA', field: 'PID', color: 'yellow' },
    { offset: 22, byte: '00', field: 'CartNo', color: 'cyan' },
    { offset: 23, byte: '05', field: 'CartNo', color: 'cyan' },
    { offset: 24, byte: '00', field: 'Dest1', color: 'gray' },
    { offset: 25, byte: '0F', field: 'Dest1', color: 'gray' },
    { offset: 26, byte: '00', field: 'Dest2', color: 'gray' },
    { offset: 27, byte: '14', field: 'Dest2', color: 'gray' },
    { offset: 28, byte: '00', field: 'Dest3-6', color: 'gray' },
    { offset: 29, byte: '00', field: '...', color: 'gray' },
    { offset: 36, byte: '00', field: 'Dest7', color: 'gray' },
    { offset: 37, byte: '63', field: 'Dest8=99', color: 'gray' },
    // ETX
    { offset: 38, byte: '03', field: 'ETX', color: 'red' },
  ],
  totalSize: 39,
};

// 테스트 결과 요약
export const testResults = {
  total: 31,
  passed: 31,
  failed: 0,
  time: '1.67s',
  suites: [
    { name: 'Round-trip 직렬화', tests: 10, desc: '10개 전문 Build→Parse 왕복 검증' },
    { name: 'autoParse', tests: 1, desc: '전문번호 자동 감지 파싱' },
    { name: 'Validator', tests: 4, desc: 'STX/ETX 오류, 버퍼 크기 검증' },
    { name: 'Registry', tests: 6, desc: '전문 조회, 20개 전문 등록 확인' },
    { name: 'PIDGenerator', tests: 6, desc: '범위 생성, 순환, 역추적, 리셋' },
    { name: 'Port Config', tests: 3, desc: '채널 매핑, 포트 유효성' },
  ],
};

// 실시간 전문 흐름 시뮬레이션 데이터
export const telegramFlowSimulation = [
  { time: '13:40:01.000', dir: 'PLC→SMC', no: 1, name: 'HeartBeat', data: 'ACK=1, HBNo=142', status: 'ok' },
  { time: '13:40:01.050', dir: 'SMC→PLC', no: 30, name: 'DestinationReq', data: 'Ind=1, PID=100042, Dest1=15', status: 'ok' },
  { time: '13:40:01.120', dir: 'PLC→SMC', no: 20, name: 'ItemInducted', data: 'Cell=150, Ind=1, PID=100042', status: 'ok' },
  { time: '13:40:01.350', dir: 'PLC→SMC', no: 21, name: 'ItemDischarged', data: 'Cell=150, Chute=15, Recirc=0', status: 'ok' },
  { time: '13:40:01.400', dir: 'PLC→SMC', no: 22, name: 'ItemSortedConfirm', data: 'Cell=150, Chute=15, Status=0', status: 'ok' },
  { time: '13:40:02.000', dir: 'PLC→SMC', no: 1, name: 'HeartBeat', data: 'ACK=1, HBNo=143', status: 'ok' },
  { time: '13:40:02.100', dir: 'PLC→SMC', no: 40, name: 'CodeRequest', data: 'Ind=2 (타건 요청)', status: 'warn' },
  { time: '13:40:03.200', dir: 'SMC→PLC', no: 41, name: 'CodeResult', data: 'Cell=201, Dest1=42', status: 'ok' },
  { time: '13:40:03.500', dir: 'PLC→SMC', no: 10, name: 'SorterStatus', data: 'Status=1 (가동중)', status: 'ok' },
  { time: '13:40:04.000', dir: 'PLC→SMC', no: 1, name: 'HeartBeat', data: 'ACK=1, HBNo=144', status: 'ok' },
];

// ============================================================
// Phase 3: 데이터베이스 설계 데모 데이터
// ============================================================

// DB 스키마 테이블 목록
export const dbSchemaOperationTables = [
  { category: '모델 정의', tables: [
    { name: 'tb_model_machine_mt', desc: '구분기 Model 정의 Master', pk: 'machine_id', rows: 3, fields: 8 },
    { name: 'tb_model_group_mt', desc: '모듈 Group 정의 Master', pk: 'group_id', rows: 4, fields: 6 },
    { name: 'tb_model_module_mt', desc: '모듈 정의 Master', pk: 'module_id', rows: 4, fields: 7 },
    { name: 'tb_model_machine_dt', desc: '구분기 모델 정의 상세', pk: 'uuid', rows: 0, fields: 8 },
    { name: 'tb_model_pc_mt', desc: 'PC 모델 정의', pk: 'pc_id', rows: 3, fields: 9 },
  ]},
  { category: '운영', tables: [
    { name: 'tb_oper_machine_state_ht', desc: '장비 모듈 상태 이력', pk: 'uuid', rows: 0, fields: 8 },
    { name: 'tb_oper_sorting_plan_mt', desc: '구분계획 정의 Master', pk: 'plan_id', rows: 1, fields: 10 },
    { name: 'tb_oper_sorting_plan_dt', desc: '구분계획 설정값 상세', pk: 'uuid', rows: 10, fields: 8 },
    { name: 'tb_oper_sorting_plan_ht', desc: '구분계획 변동 이력', pk: 'uuid', rows: 0, fields: 7 },
    { name: 'tb_oper_sorting_plan_config_dt', desc: '구분계획 운영 설정', pk: 'uuid', rows: 0, fields: 5 },
    { name: 'tb_oper_chute_management_dt', desc: '슈트현황판 행선지', pk: 'uuid', rows: 12, fields: 7 },
    { name: 'tb_oper_entrust_size_mt', desc: '위탁 크기 정의', pk: 'size_id', rows: 3, fields: 12 },
    { name: 'tb_group_code_mt', desc: '그룹코드 정의', pk: 'group_code', rows: 4, fields: 5 },
    { name: 'tb_sort_code_mt', desc: '구분코드 정의', pk: 'uuid', rows: 10, fields: 8 },
    { name: 'tb_office_code_mt', desc: '우체국코드 정의', pk: 'office_code', rows: 4, fields: 8 },
    { name: 'tb_oper_special_key_mt', desc: '특수키 Master', pk: 'special_key_id', rows: 0, fields: 7 },
    { name: 'tb_oper_special_key_dt', desc: '특수키 상세', pk: 'uuid', rows: 0, fields: 7 },
  ]},
  { category: 'CGS', tables: [
    { name: 'tb_hmi_alarm_mt', desc: 'HMI Alarm 정의 Master', pk: 'alarm_code', rows: 5, fields: 7 },
    { name: 'tb_hmi_alarm_ht', desc: 'HMI Alarm 이력', pk: 'uuid', rows: 0, fields: 8 },
  ]},
  { category: '소포', tables: [
    { name: 'tb_item_parcel_dt', desc: '소포정보 상세', pk: 'uuid', rows: 0, fields: 15 },
  ]},
  { category: '통계', tables: [
    { name: 'tb_stat_summary_statistics', desc: '요약 통계정보', pk: 'uuid', rows: 0, fields: 11 },
    { name: 'tb_stat_induction_statistics', desc: 'Induction별 통계', pk: 'uuid', rows: 0, fields: 9 },
    { name: 'tb_stat_chute_statistics', desc: 'Chute별 통계', pk: 'uuid', rows: 0, fields: 8 },
    { name: 'tb_stat_code_statistics', desc: '우편번호 코드별 통계', pk: 'uuid', rows: 0, fields: 7 },
    { name: 'tb_stat_sorter_statistics', desc: '구분기 통계', pk: 'uuid', rows: 0, fields: 11 },
  ]},
  { category: '접수정보', tables: [
    { name: 'tb_sim_regi_info', desc: '접수정보 연계', pk: 'uuid', rows: 0, fields: 11 },
  ]},
];

export const dbSchemaReginfoTables = [
  { name: 'psm_statistics', desc: '송신용 전체 통계', pk: 'uuid', rows: 0, fields: 10 },
  { name: 'psm_induction_statistics', desc: '송신용 공급부 통계', pk: 'uuid', rows: 0, fields: 9 },
  { name: 'psm_chute_statistics', desc: '송신용 구분구 통계', pk: 'uuid', rows: 0, fields: 9 },
  { name: 'psm_post_amount', desc: '송신용 우편번호 통계', pk: 'uuid', rows: 0, fields: 7 },
  { name: 'psm_request', desc: '송신용 완료 확인', pk: 'uuid', rows: 0, fields: 8 },
  { name: 'psm_reg_post_result', desc: '구분정보 연계', pk: 'uuid', rows: 0, fields: 9 },
  { name: 'poem_t0050', desc: '설비상태정보', pk: 'uuid', rows: 0, fields: 7 },
];

// 스케줄러 작업 상태
export const schedulerJobs = {
  batchReport: {
    name: 'BATCH_REPORT',
    status: 'RUNNING',
    jobs: [
      { name: 'Local 전체 통계', interval: '10분', lastRun: '13:40:00', nextRun: '13:50:00', status: 'OK' },
      { name: 'Local 인덕션별 통계', interval: '10분', lastRun: '13:40:01', nextRun: '13:50:00', status: 'OK' },
      { name: 'Local 구분구별 통계', interval: '10분', lastRun: '13:40:02', nextRun: '13:50:00', status: 'OK' },
      { name: 'Local 코드별 통계', interval: '10분', lastRun: '13:40:03', nextRun: '13:50:00', status: 'OK' },
      { name: 'Local 구분기별 통계', interval: '10분', lastRun: '13:40:04', nextRun: '13:50:00', status: 'OK' },
      { name: 'SIMS 전체 통계', interval: '30분', lastRun: '13:30:00', nextRun: '14:00:00', status: 'OK' },
      { name: 'SIMS 구분구별 통계', interval: '30분', lastRun: '13:30:01', nextRun: '14:00:00', status: 'OK' },
      { name: 'SIMS 코드별 통계', interval: '30분', lastRun: '13:30:02', nextRun: '14:00:00', status: 'OK' },
      { name: 'SIMS 구분기별 통계', interval: '30분', lastRun: '13:30:03', nextRun: '14:00:00', status: 'OK' },
    ],
  },
  batchDelete: {
    name: 'BATCH_DELETE',
    status: 'IDLE',
    schedule: '매일 12:15',
    jobs: [
      { name: 'Local 통계(전체)', retention: '60일', lastRun: '어제 12:15', deleted: 1240, status: 'OK' },
      { name: '걸업이력', retention: '60일', lastRun: '어제 12:15', deleted: 856, status: 'OK' },
      { name: '구분 데이터', retention: '60일', lastRun: '어제 12:15', deleted: 45230, status: 'OK' },
      { name: 'SIMS 통계(전체)', retention: '3일', lastRun: '어제 12:15', deleted: 720, status: 'OK' },
      { name: '접수정보', retention: '7일', lastRun: '어제 12:15', deleted: 3150, status: 'OK' },
      { name: '체결/구분 정보', retention: '14일', lastRun: '어제 12:15', deleted: 8420, status: 'OK' },
    ],
  },
  backup: {
    name: 'BACKUP',
    status: 'IDLE',
    schedule: '매주 일요일 11:30',
    lastRun: '2026-02-15 11:30',
    nextRun: '2026-02-22 11:30',
    lastBackupSize: '2.4 GB',
    schemas: ['psm_operation', 'psm_reginfo'],
  },
};

// DB seed 데이터 요약
export const seedDataSummary = [
  { table: '구분기 모델', count: 3, sample: 'PSM001(소포1호기), PSM002(소포2호기), CVY001(컨베이어)' },
  { table: '모듈 그룹', count: 4, sample: 'GRP_IND, GRP_SRT, GRP_CHT, GRP_SCN' },
  { table: '모듈', count: 4, sample: 'MOD_IND01~02, MOD_SRT01, MOD_SCN01' },
  { table: 'PC 모델', count: 3, sample: 'PC_MC001(Main), PC_SC001(Sub), PC_DP001(Display)' },
  { table: '그룹코드', count: 4, sample: 'RESULT, CTYPE, REGION, MSTATE' },
  { table: '구분코드', count: 10, sample: 'OK, NR, NM, RJ, N, R, O, 01~03(지역)' },
  { table: '우체국코드', count: 4, sample: '서울집중국, 경기집중국, 대전집중국, 종로우체국' },
  { table: 'HMI 알람', count: 5, sample: 'ALM_E001(비상정지), ALM_E002(모터과부하), ...' },
  { table: '슈트현황', count: 12, sample: '슈트1~10 + 리젝트(99) + 오버플로(100)' },
  { table: '구분계획', count: 1, sample: 'PLAN_PSM001_001(서울1호기 주간계획) + 상세10건' },
];

// ============================================================
// Phase 4: 중앙 중계기 서버 데모 데이터
// ============================================================

// 연결 상태
export const relayConnections = [
  { id: 'SIMS', name: 'SIMS (우정사업정보시스템)', type: 'SIMS', host: 'sims.koreapost.go.kr', port: 5432, status: 'CONNECTED', latency: 12, lastConnected: '13:38:01', reconnects: 0 },
  { id: 'SEOUL', name: '서울우편집중국', type: 'LOCAL', host: '10.10.1.100', port: 3100, status: 'CONNECTED', latency: 3, lastConnected: '13:38:02', reconnects: 0 },
  { id: 'BUSAN', name: '부산우편집중국', type: 'LOCAL', host: '10.10.2.100', port: 3100, status: 'CONNECTED', latency: 8, lastConnected: '13:38:03', reconnects: 0 },
  { id: 'DAEGU', name: '대구우편집중국', type: 'LOCAL', host: '10.10.3.100', port: 3100, status: 'CONNECTED', latency: 5, lastConnected: '13:38:04', reconnects: 0 },
  { id: 'GWANGJU', name: '광주우편집중국', type: 'LOCAL', host: '10.10.4.100', port: 3100, status: 'ERROR', latency: 0, lastConnected: '13:20:15', reconnects: 3 },
  { id: 'DAEJEON', name: '대전우편집중국', type: 'LOCAL', host: '10.10.5.100', port: 3100, status: 'CONNECTED', latency: 4, lastConnected: '13:38:05', reconnects: 0 },
];

// 데이터 동기화 이력
export const syncHistory = [
  { id: 'SYNC_001', direction: 'SIMS→집중국', type: '접수정보', target: 'ALL', records: 150, processed: 150, errors: 0, status: 'COMPLETED', duration: '2.3s', time: '13:40:00' },
  { id: 'SYNC_002', direction: '집중국→SIMS', type: '구분결과', target: 'SEOUL', records: 320, processed: 320, errors: 0, status: 'COMPLETED', duration: '4.1s', time: '13:39:30' },
  { id: 'SYNC_003', direction: '집중국→SIMS', type: '체결정보', target: 'BUSAN', records: 85, processed: 85, errors: 0, status: 'COMPLETED', duration: '1.1s', time: '13:39:00' },
  { id: 'SYNC_004', direction: '집중국→SIMS', type: '통계정보', target: 'ALL', records: 5, processed: 5, errors: 0, status: 'COMPLETED', duration: '0.8s', time: '13:30:00' },
  { id: 'SYNC_005', direction: 'SIMS→집중국', type: '주소/순로DB', target: 'ALL', records: 12500, processed: 12500, errors: 0, status: 'COMPLETED', duration: '45.2s', time: '12:00:00' },
  { id: 'SYNC_006', direction: '집중국→SIMS', type: '구분결과', target: 'GWANGJU', records: 200, processed: 180, errors: 20, status: 'FAILED', duration: '3.5s', time: '13:25:00' },
];

// FTP 전송 상태
export const ftpTransfers = [
  { id: 'FTP_001', fileName: 'address_db_20260218.dat', type: 'ADDRESS_DB', target: '서울', status: 'COMPLETED', size: '125 MB', progress: 100, time: '12:05:30' },
  { id: 'FTP_002', fileName: 'address_db_20260218.dat', type: 'ADDRESS_DB', target: '부산', status: 'COMPLETED', size: '125 MB', progress: 100, time: '12:06:15' },
  { id: 'FTP_003', fileName: 'mlf_model_v3.2.dat', type: 'MLF', target: '대전', status: 'COMPLETED', size: '48 MB', progress: 100, time: '12:10:00' },
  { id: 'FTP_004', fileName: 'sorting_plan_20260218.csv', type: 'SORTING_PLAN', target: '서울', status: 'COMPLETED', size: '2.1 MB', progress: 100, time: '06:00:15' },
  { id: 'FTP_005', fileName: 'sorting_plan_20260218.csv', type: 'SORTING_PLAN', target: '광주', status: 'FAILED', size: '2.1 MB', progress: 45, time: '06:01:00', error: '연결 타임아웃' },
];

// 통신 로그
export const commLogs = [
  { id: 'LOG_001', time: '13:40:05', direction: 'INBOUND', source: 'SIMS', target: 'CENTRAL', protocol: 'DB2DB', type: 'RECEPTION_INFO', size: 4096, level: 'INFO', message: '접수정보 150건 수신 완료' },
  { id: 'LOG_002', time: '13:39:32', direction: 'OUTBOUND', source: 'CENTRAL', target: 'SIMS', protocol: 'DB2DB', type: 'SORTING_RESULT', size: 8192, level: 'INFO', message: '구분결과 320건 송신 완료 (서울)' },
  { id: 'LOG_003', time: '13:38:15', direction: 'INBOUND', source: 'DAEJEON', target: 'CENTRAL', protocol: 'TCP_SOCKET', type: 'HEARTBEAT', size: 64, level: 'INFO', message: 'HeartBeat ACK (대전집중국)' },
  { id: 'LOG_004', time: '13:25:10', direction: 'OUTBOUND', source: 'CENTRAL', target: 'SIMS', protocol: 'DB2DB', type: 'SORTING_RESULT', size: 5120, level: 'ERROR', message: '구분결과 송신 실패 (광주) - 연결 끊김' },
  { id: 'LOG_005', time: '13:20:30', direction: 'OUTBOUND', source: 'CENTRAL', target: 'GWANGJU', protocol: 'TCP_SOCKET', type: 'RECONNECT', size: 0, level: 'WARN', message: '광주집중국 재연결 시도 (attempt 3)' },
  { id: 'LOG_006', time: '12:15:00', direction: 'INBOUND', source: 'SIMS', target: 'CENTRAL', protocol: 'FTP', type: 'FILE_TRANSFER', size: 131072000, level: 'INFO', message: '배달점주소DB 파일 수신 (125MB)' },
  { id: 'LOG_007', time: '12:10:00', direction: 'OUTBOUND', source: 'CENTRAL', target: 'DAEJEON', protocol: 'FTP', type: 'FILE_TRANSFER', size: 50331648, level: 'INFO', message: 'MLF 모델 파일 전송 완료 (48MB)' },
  { id: 'LOG_008', time: '06:01:00', direction: 'OUTBOUND', source: 'CENTRAL', target: 'GWANGJU', protocol: 'FTP', type: 'FILE_TRANSFER', size: 0, level: 'ERROR', message: '구분계획 파일 전송 실패 (광주) - 타임아웃' },
];

// 중계기 설정
export const relayConfig = {
  sims: { host: 'sims.koreapost.go.kr', port: 5432, heartbeat: '10초', timeout: '5초' },
  protocol: {
    db2db: { batchSize: 100, pollInterval: '1초', retryAttempts: 3 },
    ftp: { maxConcurrent: 3, retryAttempts: 3, timeout: '5분' },
    socket: { maxConnections: 50, keepAlive: '30초' },
  },
  sync: {
    receptionInfo: { interval: '1분', batchSize: 100 },
    addressRouteDB: { interval: '1시간', batchSize: 500 },
    sortingResult: { interval: '30초', batchSize: 100 },
    bindingInfo: { interval: '30초', batchSize: 100 },
    statistics: { interval: '10분', batchSize: 50 },
  },
};

// Fallback 상세 상태 (Phase 4)
export const fallbackDetailState = {
  status: 'INACTIVE',
  pendingRecords: 0,
  csvFilesGenerated: 0,
  consecutiveFailures: 0,
  consecutiveSuccesses: 28,
  events: [
    { time: '2026-02-17 15:30:00', type: 'RECOVERY_COMPLETED', detail: '미전송 1,250건 동기화 완료' },
    { time: '2026-02-17 15:25:00', type: 'RECOVERY_STARTED', detail: '미전송 데이터 재전송 시작' },
    { time: '2026-02-17 15:20:00', type: 'SIMS_RECOVERED', detail: 'SIMS 연결 복구 확인 (연속 5회 성공)' },
    { time: '2026-02-17 14:50:00', type: 'CSV_FILE_CREATED', detail: 'fallback_SORTING_RESULT_20260217_145000.csv (850건)' },
    { time: '2026-02-17 14:30:00', type: 'FALLBACK_ACTIVATED', detail: 'CSV Fallback 모드 활성화' },
    { time: '2026-02-17 14:30:00', type: 'SIMS_DOWN_DETECTED', detail: 'SIMS 연결 실패 (연속 3회)' },
  ],
};

// 중앙 중계기 API 엔드포인트 목록
export const relayApiEndpoints = [
  { method: 'GET', path: '/api/status', desc: '전체 시스템 상태' },
  { method: 'GET', path: '/api/connections', desc: '각 집중국 연결 상태' },
  { method: 'GET', path: '/api/logs', desc: '통신 로그 조회 (필터링)' },
  { method: 'POST', path: '/api/sync/trigger', desc: '수동 동기화 트리거' },
  { method: 'GET', path: '/api/sync/history', desc: '동기화 이력' },
  { method: 'PUT', path: '/api/config', desc: '설정 변경' },
  { method: 'GET', path: '/api/fallback/status', desc: 'Fallback 상태' },
];

export const relayWsEndpoints = [
  { namespace: '/ws/status', desc: '실시간 통신상태 스트림', interval: '3초' },
  { namespace: '/ws/logs', desc: '실시간 로그 스트림', interval: '2초' },
];

// 단위 테스트 결과 (Phase 4)
export const relayTestResults = {
  unit: { total: 45, passed: 45, failed: 0, suites: [
    { name: 'ConnectionService', tests: 8, desc: '연결 관리, exponential backoff, 상태 조회' },
    { name: 'DataSyncService', tests: 7, desc: 'CDC 동기화, 이력 관리, 수동 트리거' },
    { name: 'FtpService', tests: 7, desc: '파일 배포, 재전송, 이력 필터링' },
    { name: 'FallbackService', tests: 6, desc: 'SIMS 장애감지, CSV 생성, 복구' },
    { name: 'CommLogService', tests: 8, desc: '로그 기록, 필터, 페이지네이션, 통계' },
    { name: 'RelayConfigService', tests: 9, desc: '설정 조회/수정, 집중국 관리' },
  ]},
  e2e: { total: 17, passed: 17, failed: 0, desc: '전체 API 엔드포인트 통합 테스트' },
};

// ============================================================
// Phase 5: 로컬 중계기 서버 데모 데이터
// ============================================================

// PLC 채널 상태
export const localPlcChannels = [
  { name: 'Send-Destination', port: 3003, dir: 'SEND', status: 'CONNECTED', telegramsSent: 1240, telegramsReceived: 0, bytesTransferred: 48360, lastActivity: '13:40:02' },
  { name: 'Send-MCS', port: 3011, dir: 'SEND', status: 'CONNECTED', telegramsSent: 856, telegramsReceived: 0, bytesTransferred: 25680, lastActivity: '13:40:01' },
  { name: 'Send-Heartbeat', port: 3001, dir: 'SEND', status: 'CONNECTED', telegramsSent: 4320, telegramsReceived: 0, bytesTransferred: 17280, lastActivity: '13:40:05' },
  { name: 'Recv-Discharge', port: 3000, dir: 'RECV', status: 'CONNECTED', telegramsSent: 0, telegramsReceived: 1238, bytesTransferred: 14856, lastActivity: '13:40:03' },
  { name: 'Recv-Confirm', port: 3004, dir: 'RECV', status: 'CONNECTED', telegramsSent: 0, telegramsReceived: 1236, bytesTransferred: 14832, lastActivity: '13:40:04' },
  { name: 'Recv-MCS', port: 3010, dir: 'RECV', status: 'CONNECTED', telegramsSent: 0, telegramsReceived: 520, bytesTransferred: 3120, lastActivity: '13:39:55' },
  { name: 'Recv-Induct', port: 3006, dir: 'RECV', status: 'DISCONNECTED', telegramsSent: 0, telegramsReceived: 0, bytesTransferred: 0, lastActivity: '-' },
];

// 장비 상태 모니터링
export const localEquipment = [
  { equipmentId: 'SORTER-01', name: '구분기 메인', type: 'SORTER', status: 'RUNNING', speed: 120, temperature: 42, current: 15.2, operatingMinutes: 480, processedCount: 14200, errorCount: 0 },
  { equipmentId: 'IND-01', name: '인덕션 #1', type: 'INDUCTION', status: 'RUNNING', speed: 80, operatingMinutes: 480, processedCount: 7800, errorCount: 0 },
  { equipmentId: 'IND-02', name: '인덕션 #2', type: 'INDUCTION', status: 'RUNNING', speed: 80, operatingMinutes: 460, processedCount: 6400, errorCount: 1 },
  { equipmentId: 'CV-MAIN', name: '메인 컨베이어', type: 'CONVEYOR', status: 'RUNNING', speed: 100, temperature: 38, operatingMinutes: 480, processedCount: 0, errorCount: 0 },
  { equipmentId: 'CV-REJECT', name: '리젝트 컨베이어', type: 'CONVEYOR', status: 'RUNNING', speed: 60, operatingMinutes: 480, processedCount: 0, errorCount: 0 },
  { equipmentId: 'IPS-01', name: 'IPS 바코드리더 #1', type: 'IPS_BCR', status: 'RUNNING', operatingMinutes: 480, processedCount: 7800, errorCount: 2 },
  { equipmentId: 'IPS-02', name: 'IPS 바코드리더 #2', type: 'IPS_BCR', status: 'RUNNING', operatingMinutes: 460, processedCount: 6400, errorCount: 1 },
  { equipmentId: 'OCR-01', name: 'OCR 주소인식', type: 'OCR', status: 'RUNNING', operatingMinutes: 480, processedCount: 5200, errorCount: 3 },
  { equipmentId: 'BOX-01', name: '상자적재대 #1', type: 'BOX_LOADER', status: 'STOPPED', operatingMinutes: 0, processedCount: 0, errorCount: 0 },
];

// 장비 알람
export const localAlarms = [
  { alarmId: 'ALM_1', equipmentId: 'IND-02', code: 'A-2101', severity: 'WARNING', message: '인덕션 #2 진동 수치 상승', zone: '투입구역', active: true, occurredAt: '13:35:20' },
  { alarmId: 'ALM_2', equipmentId: 'IPS-01', code: 'A-3001', severity: 'INFO', message: 'IPS #1 캘리브레이션 완료', zone: 'IPS구역', active: false, occurredAt: '12:00:05', clearedAt: '12:00:08' },
  { alarmId: 'ALM_3', equipmentId: 'OCR-01', code: 'A-3201', severity: 'WARNING', message: 'OCR 인식률 85% 미만', zone: 'OCR구역', active: true, occurredAt: '13:20:15' },
];

// IPS 디바이스 상태
export const localIpsDevices = [
  { deviceId: 'IPS-IND01', name: 'IPS 인덕션1 BCR', status: 'ONLINE', inductionNo: 1, totalReads: 7800, successReads: 7410, failedReads: 390, successRate: 95.0 },
  { deviceId: 'IPS-IND02', name: 'IPS 인덕션2 BCR', status: 'ONLINE', inductionNo: 2, totalReads: 6400, successReads: 6080, failedReads: 320, successRate: 95.0 },
  { deviceId: 'IPS-IND03', name: 'IPS 인덕션3 BCR', status: 'ONLINE', inductionNo: 3, totalReads: 0, successReads: 0, failedReads: 0, successRate: 0 },
  { deviceId: 'IPS-IND04', name: 'IPS 인덕션4 BCR', status: 'OFFLINE', inductionNo: 4, totalReads: 0, successReads: 0, failedReads: 0, successRate: 0 },
];

// 시뮬레이터 상태
export const localSimulatorStats = {
  running: false,
  totalItems: 250,
  successCount: 220,
  rejectCount: 22,
  noReadCount: 8,
  startedAt: '12:00:00',
  itemsPerMinute: 120,
};

export const localSortingRules = [
  { rule: 'ODD_EVEN', description: '홀수 → 슈트1, 짝수 → 슈트2', params: 'oddChute=1, evenChute=2', active: true },
  { rule: 'DIVISIBLE', description: '3의 배수 → 슈트3', params: 'divisor=3, chute=3', active: false },
  { rule: 'RANGE', description: '우편번호 30000~39999 → 슈트15 (대전)', params: 'min=30000, max=39999, chute=15', active: false },
  { rule: 'MODULO', description: 'PID % 10 → 해당 슈트', params: 'modulo=10', active: false },
];

export const localSimulatedItems = [
  { pid: 100250, barcode: '4201234567890', inductionNo: 3, sortCode: '42012', assignedChute: 2, rule: 'ODD_EVEN', result: 'SUCCESS' },
  { pid: 100249, barcode: '5101987654321', inductionNo: 2, sortCode: '51019', assignedChute: 1, rule: 'ODD_EVEN', result: 'SUCCESS' },
  { pid: 100248, barcode: '', inductionNo: 1, sortCode: '', assignedChute: 0, rule: 'ODD_EVEN', result: 'NO_READ' },
  { pid: 100247, barcode: '6301122334455', inductionNo: 4, sortCode: '63011', assignedChute: 1, rule: 'ODD_EVEN', result: 'SUCCESS' },
  { pid: 100246, barcode: '7401555666777', inductionNo: 3, sortCode: '74015', assignedChute: 1, rule: 'ODD_EVEN', result: 'SUCCESS' },
  { pid: 100245, barcode: '3400112233445', inductionNo: 2, sortCode: '34001', assignedChute: 1, rule: 'ODD_EVEN', result: 'SUCCESS' },
];

// 운영 모드
export const localOperationMode = {
  currentMode: 'SIMULATOR' as const,
  safetyCheck: {
    passed: true,
    checks: [
      { name: '치명적 알람 없음', passed: true, detail: '정상' },
      { name: '시뮬레이터 정지 가능', passed: true, detail: '시뮬레이터 미실행' },
      { name: '장비 에러 없음', passed: true, detail: '정상' },
      { name: 'PLC 채널 초기화', passed: true, detail: '7개 채널 준비됨' },
    ],
  },
  modeHistory: [
    { from: 'OPERATION', to: 'SIMULATOR', switchedAt: '2026-02-18 12:00:00', switchedBy: '관리자', reason: '시뮬레이터 테스트 시작' },
    { from: 'SIMULATOR', to: 'OPERATION', switchedAt: '2026-02-18 09:00:00', switchedBy: '운영자', reason: '오전 운영 시작' },
  ],
};

// 테스트 러너 결과
export const localTestReports = [
  {
    name: 'SORTING Test', type: 'SORTING', status: 'COMPLETED', totalTests: 5, passed: 5, failed: 0,
    tests: [
      { name: '바코드 정상 구분', status: 'PASS', expected: 'SUCCESS', actual: 'SUCCESS' },
      { name: '미인식 처리', status: 'PASS', expected: 'REJECT_CHUTE', actual: 'REJECT_CHUTE' },
      { name: '다중 목적지', status: 'PASS', expected: 'DEST1_SELECTED', actual: 'DEST1_SELECTED' },
      { name: '만재 처리', status: 'PASS', expected: 'OVERFLOW', actual: 'OVERFLOW' },
      { name: '재순환 카운트', status: 'PASS', expected: 'MAX_RECIRC_REJECT', actual: 'MAX_RECIRC_REJECT' },
    ],
  },
  {
    name: 'COMMUNICATION Test', type: 'COMMUNICATION', status: 'COMPLETED', totalTests: 5, passed: 5, failed: 0,
    tests: [
      { name: 'HeartBeat 응답', status: 'PASS', expected: 'ACK_RECEIVED', actual: 'ACK_RECEIVED' },
      { name: '채널 연결', status: 'PASS', expected: 'ALL_CONNECTED', actual: 'ALL_CONNECTED' },
      { name: '전문 송수신', status: 'PASS', expected: 'RESPONSE_OK', actual: 'RESPONSE_OK' },
      { name: '타임아웃 처리', status: 'PASS', expected: 'RETRY_SUCCESS', actual: 'RETRY_SUCCESS' },
      { name: '연결 복구', status: 'PASS', expected: 'RECONNECTED', actual: 'RECONNECTED' },
    ],
  },
  {
    name: 'PROTOCOL Test', type: 'PROTOCOL', status: 'COMPLETED', totalTests: 6, passed: 6, failed: 0,
    tests: [
      { name: 'STX/ETX 검증', status: 'PASS', expected: 'VALID', actual: 'VALID' },
      { name: '헤더 파싱', status: 'PASS', expected: 'HEADER_VALID', actual: 'HEADER_VALID' },
      { name: '전문번호 매핑', status: 'PASS', expected: 'ALL_MAPPED', actual: 'ALL_MAPPED' },
      { name: 'PID 순환', status: 'PASS', expected: 'CYCLED', actual: 'CYCLED' },
      { name: '필드 크기 검증', status: 'PASS', expected: 'SIZE_MATCH', actual: 'SIZE_MATCH' },
      { name: '바이너리 Round-trip', status: 'PASS', expected: 'IDENTICAL', actual: 'IDENTICAL' },
    ],
  },
  {
    name: 'INTEGRATION Test', type: 'INTEGRATION', status: 'COMPLETED', totalTests: 4, passed: 4, failed: 0,
    tests: [
      { name: '투입→배출 전체 흐름', status: 'PASS', expected: 'CYCLE_COMPLETE', actual: 'CYCLE_COMPLETE' },
      { name: 'IPS 연동', status: 'PASS', expected: 'LINKED', actual: 'LINKED' },
      { name: '장비 상태 동기화', status: 'PASS', expected: 'SYNCED', actual: 'SYNCED' },
      { name: '알람 전파', status: 'PASS', expected: 'PROPAGATED', actual: 'PROPAGATED' },
    ],
  },
];

// 유지보수 점검 결과
export const localMaintenanceReports = [
  {
    type: 'RELAY_BYPASS', status: 'COMPLETED', items: 5, passed: 5, failed: 0,
    summary: '중계기 우회 검사 - 5/5 항목 통과',
    details: [
      { name: 'PLC 채널 해제', category: '연결', status: 'PASS' },
      { name: '상위SW 직접 연결', category: '연결', status: 'PASS' },
      { name: 'HeartBeat 통신', category: '통신', status: 'PASS' },
      { name: '전문 송수신', category: '통신', status: 'PASS' },
      { name: '구분 동작', category: '동작', status: 'PASS' },
    ],
  },
  {
    type: 'HW_CHECK', status: 'COMPLETED', items: 10, passed: 10, failed: 0,
    summary: 'H/W 장비 점검 - 10/10 항목 통과',
    details: [
      { name: '구분기 모터', category: '기구부', status: 'PASS' },
      { name: '인덕션 모터', category: '기구부', status: 'PASS' },
      { name: '슈트 동작', category: '기구부', status: 'PASS' },
      { name: 'IPS 바코드리더', category: '센서', status: 'PASS' },
      { name: 'OCR 인식기', category: '센서', status: 'PASS' },
      { name: 'PLC 통신', category: '통신', status: 'PASS' },
      { name: '컨베이어 속도', category: '기구부', status: 'PASS' },
      { name: '비상정지', category: '안전', status: 'PASS' },
      { name: '메인 컨베이어 점검', category: '컨베이어', status: 'PASS' },
      { name: '리젝트 컨베이어 점검', category: '컨베이어', status: 'PASS' },
    ],
  },
  {
    type: 'FULL_INSPECTION', status: 'COMPLETED', items: 12, passed: 12, failed: 0,
    summary: '전체 검사 - 12/12 항목 통과',
    details: [
      { name: 'TCP 포트 연결 (7개)', category: '통신', status: 'PASS' },
      { name: 'HeartBeat 주기', category: '통신', status: 'PASS' },
      { name: '전문 라운드트립', category: '통신', status: 'PASS' },
      { name: '구분기 가동', category: '장비', status: 'PASS' },
      { name: '인덕션 모드', category: '장비', status: 'PASS' },
      { name: '슈트 만재 감지', category: '장비', status: 'PASS' },
      { name: '오버플로 설정', category: '장비', status: 'PASS' },
      { name: 'IPS 판독률', category: '센서', status: 'PASS' },
      { name: 'OCR 인식률', category: '센서', status: 'PASS' },
      { name: '전문 헤더 검증', category: '프로토콜', status: 'PASS' },
      { name: '전문 번호 매핑', category: '프로토콜', status: 'PASS' },
      { name: 'PID 범위', category: '프로토콜', status: 'PASS' },
    ],
  },
];

// 로컬 중계기 WebSocket 엔드포인트
export const localWsEndpoints = [
  { namespace: '/ws/plc-stream', desc: 'PLC 상태 실시간 스트림', interval: '2초', events: ['plc_status', 'telegram_event'] },
  { namespace: '/ws/equipment-status', desc: '장비 상태 실시간 스트림', interval: '3초', events: ['equipment_status', 'status_change'] },
  { namespace: '/ws/alarms', desc: '알람 이벤트 푸시', interval: '실시간', events: ['alarm_event', 'alarm_clear'] },
];

// 로컬 중계기 REST API 엔드포인트
export const localApiEndpoints = [
  { method: 'GET', path: '/api/health', desc: '헬스체크' },
  { method: 'GET', path: '/api/status', desc: '시스템 전체 상태' },
  { method: 'GET', path: '/api/plc/status', desc: 'PLC 상태' },
  { method: 'GET', path: '/api/plc/channels', desc: 'PLC 채널 목록' },
  { method: 'POST', path: '/api/plc/connect/:name', desc: '채널 연결' },
  { method: 'POST', path: '/api/plc/disconnect/:name', desc: '채널 해제' },
  { method: 'GET', path: '/api/equipment', desc: '장비 목록' },
  { method: 'GET', path: '/api/equipment/overview', desc: '장비 개요' },
  { method: 'GET', path: '/api/ips/devices', desc: 'IPS 디바이스' },
  { method: 'GET', path: '/api/simulator/stats', desc: '시뮬레이터 통계' },
  { method: 'GET', path: '/api/simulator/rules', desc: '구분 규칙' },
  { method: 'POST', path: '/api/simulator/simulate-one', desc: '단건 시뮬레이션' },
  { method: 'GET', path: '/api/mode', desc: '운영 모드 조회' },
  { method: 'POST', path: '/api/mode/switch', desc: '모드 전환' },
  { method: 'POST', path: '/api/test/start', desc: '테스트 실행' },
  { method: 'POST', path: '/api/maintenance/hw-check', desc: 'H/W 점검' },
];

// 로컬 중계기 단위 테스트 결과
export const localRelayTestResults = {
  unit: { total: 62, passed: 62, failed: 0, suites: [
    { name: 'PLCConnectionService', tests: 10, desc: '채널 초기화, 연결/해제, 전문 송수신, 상태 조회' },
    { name: 'IPSService', tests: 9, desc: 'IPS 디바이스 관리, 바코드 판독, 알람, 통계' },
    { name: 'EquipmentMonitorService', tests: 10, desc: '장비 CRUD, 알람, 리스너, 개요 조회' },
    { name: 'SimulatorService', tests: 12, desc: '시작/정지, 규칙 설정, 시뮬레이션, 검증' },
    { name: 'OperationService', tests: 8, desc: '모드 전환, 안전 검증, 이력 관리' },
    { name: 'TestRunnerService', tests: 7, desc: '4종 테스트 실행, 리포트 관리' },
    { name: 'MaintenanceService', tests: 6, desc: '3종 점검, 리포트 관리' },
  ]},
  e2e: { total: 20, passed: 20, failed: 0, desc: '전체 REST API 통합 테스트 (16 엔드포인트)' },
};

// ============================================================
// Phase 6: 표준 SW (SMC/CGS 통합) 데모 데이터
// ============================================================

// [1] 정보연계 (InfoLink)
export const swInfoLink = {
  totalRecords: 20,
  syncJobsCompleted: 3,
  lastSync: '2026-02-19T09:30:00Z',
  scheduler: { simsInterval: 600000, kplasInterval: 1800000, simsEnabled: true, kplasEnabled: true },
  syncHistory: [
    { id: 'SYNC-001', system: 'SIMS' as const, status: 'SUCCESS' as const, recordsSynced: 150, startedAt: '2026-02-19T09:30:00Z', completedAt: '2026-02-19T09:30:02Z' },
    { id: 'SYNC-002', system: 'KPLAS' as const, status: 'SUCCESS' as const, recordsSynced: 80, startedAt: '2026-02-19T09:00:00Z', completedAt: '2026-02-19T09:00:01Z' },
    { id: 'SYNC-003', system: 'SIMS' as const, status: 'SUCCESS' as const, recordsSynced: 150, startedAt: '2026-02-19T08:30:00Z', completedAt: '2026-02-19T08:30:02Z' },
  ],
  sampleData: [
    { zipCode: '01000', destination: '서울지역', chuteNumber: 1, regionCode: 'R01', deliveryPoint: '서울중앙' },
    { zipCode: '02000', destination: '경기지역', chuteNumber: 2, regionCode: 'R02', deliveryPoint: '강남' },
    { zipCode: '03000', destination: '인천지역', chuteNumber: 3, regionCode: 'R03', deliveryPoint: '영등포' },
    { zipCode: '04000', destination: '부산지역', chuteNumber: 4, regionCode: 'R04', deliveryPoint: '부산중앙' },
    { zipCode: '05000', destination: '대구지역', chuteNumber: 5, regionCode: 'R05', deliveryPoint: '대전중앙' },
  ],
};

// [2] 구분시스템 (Sorting Engine)
export const swSortingPlans = [
  { id: 'PLAN-001', name: '일반우편 구분계획 A', status: 'ACTIVE' as const, rulesCount: 10, createdAt: '2026-02-19T08:00:00Z' },
  { id: 'PLAN-002', name: '등기우편 구분계획 B', status: 'DRAFT' as const, rulesCount: 10, createdAt: '2026-02-19T08:00:00Z' },
];

export const swSortingRules = [
  { id: 'R001', pattern: '01*', dest: '서울강북', chute: 1, priority: 1 },
  { id: 'R002', pattern: '02*', dest: '서울강남', chute: 2, priority: 2 },
  { id: 'R003', pattern: '03*', dest: '서울서부', chute: 3, priority: 3 },
  { id: 'R004', pattern: '04*', dest: '서울동부', chute: 4, priority: 4 },
  { id: 'R005', pattern: '05*', dest: '경기북부', chute: 5, priority: 5 },
  { id: 'R006', pattern: '06*', dest: '경기남부', chute: 6, priority: 6 },
  { id: 'R007', pattern: '1*', dest: '경기광역', chute: 7, priority: 7 },
  { id: 'R008', pattern: '2*', dest: '인천/강원', chute: 8, priority: 8 },
  { id: 'R009', pattern: '3*', dest: '충청권', chute: 9, priority: 9 },
  { id: 'R010', pattern: '4*', dest: '전라/경상', chute: 10, priority: 10 },
];

export const swSortingHistory = [
  { barcode: '4201234567890', zipCode: '01234', result: 'SUCCESS' as const, chute: 1, dest: '서울강북', time: '09:31:02' },
  { barcode: '4202345678901', zipCode: '02345', result: 'SUCCESS' as const, chute: 2, dest: '서울강남', time: '09:31:01' },
  { barcode: '4203456789012', zipCode: '03456', result: 'SUCCESS' as const, chute: 3, dest: '서울서부', time: '09:31:00' },
  { barcode: '4299999000000', zipCode: '99999', result: 'REJECT' as const, chute: 20, dest: '미구분', time: '09:30:59' },
  { barcode: '4204567890123', zipCode: '04567', result: 'SUCCESS' as const, chute: 4, dest: '서울동부', time: '09:30:58' },
  { barcode: '4205678901234', zipCode: '05678', result: 'SUCCESS' as const, chute: 5, dest: '경기북부', time: '09:30:57' },
  { barcode: 'INVALID_BC', zipCode: 'UNKNOWN', result: 'REJECT' as const, chute: 20, dest: '미구분', time: '09:30:56' },
  { barcode: '4230000000001', zipCode: '30000', result: 'SUCCESS' as const, chute: 9, dest: '충청권', time: '09:30:55' },
];

export const swSortingStats = { totalProcessed: 4850, successCount: 4472, rejectCount: 248, recheckCount: 130, successRate: 92.2 };

export const swSpecialKeys = [
  { keyCode: 'SP01', destination: '반송', chuteNumber: 19, description: '반송우편 처리' },
  { keyCode: 'SP02', destination: '미구분', chuteNumber: 20, description: '미구분우편 처리' },
  { keyCode: 'SP03', destination: '특수', chuteNumber: 18, description: '특수우편 처리' },
];

// [3] 통계시스템 (Statistics)
export const swDailyStats = [
  { date: '2026-02-19', totalProcessed: 5000, successCount: 4600, rejectCount: 250, recheckCount: 150, successRate: 92.0 },
  { date: '2026-02-18', totalProcessed: 4200, successCount: 3864, rejectCount: 210, recheckCount: 126, successRate: 92.0 },
  { date: '2026-02-17', totalProcessed: 3400, successCount: 3128, rejectCount: 170, recheckCount: 102, successRate: 92.0 },
];

export const swChuteStats = [
  { chute: 1, dest: '서울강북', items: 285, fullCount: 1, nearFullCount: 3 },
  { chute: 2, dest: '서울강남', items: 310, fullCount: 2, nearFullCount: 5 },
  { chute: 3, dest: '서울서부', items: 220, fullCount: 0, nearFullCount: 2 },
  { chute: 4, dest: '서울동부', items: 195, fullCount: 0, nearFullCount: 1 },
  { chute: 5, dest: '경기북부', items: 260, fullCount: 1, nearFullCount: 4 },
  { chute: 6, dest: '경기남부', items: 240, fullCount: 0, nearFullCount: 2 },
  { chute: 7, dest: '경기광역', items: 180, fullCount: 0, nearFullCount: 1 },
  { chute: 8, dest: '인천/강원', items: 150, fullCount: 0, nearFullCount: 0 },
  { chute: 9, dest: '충청권', items: 190, fullCount: 0, nearFullCount: 2 },
  { chute: 10, dest: '전라/경상', items: 230, fullCount: 1, nearFullCount: 3 },
];

export const swSorterStats = [
  { sorterId: 'SORTER-01', name: '1호기', totalProcessed: 2500, uptime: 97, errorCount: 1 },
  { sorterId: 'SORTER-02', name: '2호기', totalProcessed: 2350, uptime: 95, errorCount: 0 },
];

// [4] 모니터링/CGS (Monitoring)
export const swLayoutSummary = { tracks: 2, inductions: 2, chutes: 20, conveyors: 3, totalEquipment: 27, running: 27, error: 0 };

export const swChuteDisplayData = [
  { no: 1, dest: '서울강북', count: 142, capacity: 200, rate: 71, status: 'NORMAL' as const },
  { no: 2, dest: '서울강남', count: 178, capacity: 200, rate: 89, status: 'NEAR_FULL' as const },
  { no: 3, dest: '서울서부', count: 95, capacity: 200, rate: 48, status: 'NORMAL' as const },
  { no: 4, dest: '서울동부', count: 110, capacity: 200, rate: 55, status: 'NORMAL' as const },
  { no: 5, dest: '경기북부', count: 165, capacity: 200, rate: 83, status: 'NEAR_FULL' as const },
  { no: 6, dest: '경기남부', count: 88, capacity: 200, rate: 44, status: 'NORMAL' as const },
  { no: 7, dest: '경기광역', count: 52, capacity: 200, rate: 26, status: 'NORMAL' as const },
  { no: 8, dest: '인천/강원', count: 130, capacity: 200, rate: 65, status: 'NORMAL' as const },
  { no: 9, dest: '충청권', count: 145, capacity: 200, rate: 73, status: 'NORMAL' as const },
  { no: 10, dest: '전라/경상', count: 200, capacity: 200, rate: 100, status: 'FULL' as const },
  { no: 11, dest: '세종', count: 30, capacity: 200, rate: 15, status: 'NORMAL' as const },
  { no: 12, dest: '제주', count: 45, capacity: 200, rate: 23, status: 'NORMAL' as const },
  { no: 13, dest: '울산', count: 60, capacity: 200, rate: 30, status: 'NORMAL' as const },
  { no: 14, dest: '대구', count: 75, capacity: 200, rate: 38, status: 'NORMAL' as const },
  { no: 15, dest: '광주', count: 170, capacity: 200, rate: 85, status: 'NEAR_FULL' as const },
  { no: 16, dest: '대전', count: 55, capacity: 200, rate: 28, status: 'NORMAL' as const },
  { no: 17, dest: '부산', count: 120, capacity: 200, rate: 60, status: 'NORMAL' as const },
  { no: 18, dest: '특수', count: 20, capacity: 200, rate: 10, status: 'NORMAL' as const },
  { no: 19, dest: '반송', count: 35, capacity: 200, rate: 18, status: 'NORMAL' as const },
  { no: 20, dest: '미구분', count: 90, capacity: 200, rate: 45, status: 'NORMAL' as const },
];

export const swAlarms: Array<{ id: string; severity: string; status: string; equipmentId: string; equipmentName: string; message: string; detail: string; occurredAt: string }> = [
  { id: 'ALM-0001', severity: 'WARNING', status: 'ACTIVE', equipmentId: 'CHT-15', equipmentName: '슈트 15', message: '슈트 만재 근접', detail: '현재 적재율 85%', occurredAt: '2026-02-19T09:25:00Z' },
  { id: 'ALM-0002', severity: 'INFO', status: 'ACTIVE', equipmentId: 'CNV-03', equipmentName: '출구 컨베이어', message: '컨베이어 속도 조정', detail: '정상 범위 내 속도 변경', occurredAt: '2026-02-19T09:20:00Z' },
  { id: 'ALM-0003', severity: 'CRITICAL', status: 'RESOLVED', equipmentId: 'CHT-10', equipmentName: '슈트 10', message: '슈트 만재', detail: '만재 후 대체 슈트 투입', occurredAt: '2026-02-19T08:45:00Z' },
];

export const swCommStatuses = [
  { equipmentId: 'PLC-01', name: 'PLC 메인', protocol: 'TCP/IP', connected: true, errorCount: 0 },
  { equipmentId: 'PLC-02', name: 'PLC 보조', protocol: 'TCP/IP', connected: true, errorCount: 0 },
  { equipmentId: 'IPS-01', name: '이미지처리장치', protocol: 'TCP/IP', connected: true, errorCount: 0 },
  { equipmentId: 'SCL-01', name: '저울', protocol: 'RS232', connected: true, errorCount: 1 },
];

// [5] 타건기시스템 (Keying)
export const swKeyingStations = [
  { id: 'KST-01', name: '타건 스테이션 1', status: 'ONLINE' as const, buttons: 16, processedCount: 128, operatorId: 'OP-001' },
  { id: 'KST-02', name: '타건 스테이션 2', status: 'ONLINE' as const, buttons: 16, processedCount: 95, operatorId: 'OP-002' },
];

export const swKeyingHistory = [
  { requestId: 'KR-00001', stationId: 'KST-01', barcode: '4299001000000', dest: '서울강북', chute: 1, timeMs: 2300, completedAt: '09:31:15' },
  { requestId: 'KR-00002', stationId: 'KST-02', barcode: '4299002000000', dest: '경기남부', chute: 6, timeMs: 1800, completedAt: '09:31:10' },
  { requestId: 'KR-00003', stationId: 'KST-01', barcode: '4299003000000', dest: '충청권', chute: 9, timeMs: 3100, completedAt: '09:30:55' },
  { requestId: 'KR-00004', stationId: 'KST-02', barcode: '4299004000000', dest: '반송', chute: 19, timeMs: 1500, completedAt: '09:30:40' },
  { requestId: 'KR-00005', stationId: 'KST-01', barcode: '4299005000000', dest: '대전', chute: 16, timeMs: 2700, completedAt: '09:30:25' },
];

// [6] 상황관제 (Situation)
export const swSituationOverview = {
  totalProcessed: 4850,
  successRate: 92.3,
  rejectRate: 5.1,
  uptimeMinutes: 342,
  activeSorters: 2,
  totalSorters: 2,
  activeAlarms: 2,
};

export const swDeliveryPoints = [
  { id: 'DP-001', name: '서울중앙우체국', region: '서울', totalSorted: 485, chutes: [1, 2, 3, 4] },
  { id: 'DP-002', name: '강남우체국', region: '서울', totalSorted: 310, chutes: [2] },
  { id: 'DP-003', name: '영등포우체국', region: '서울', totalSorted: 220, chutes: [3] },
  { id: 'DP-004', name: '부산중앙우체국', region: '부산', totalSorted: 120, chutes: [17] },
  { id: 'DP-005', name: '대전중앙우체국', region: '대전', totalSorted: 55, chutes: [16] },
];

// [7] WebSocket 엔드포인트
export const swWsEndpoints = [
  { namespace: '/ws/sorting-stream', events: 'sort-event, comm-log, sort-status', interval: '2초' },
  { namespace: '/ws/alarms', events: 'alarm, alarm-clear', interval: '실시간' },
  { namespace: '/ws/equipment-status', events: 'layout, comm-status', interval: '3초' },
  { namespace: '/ws/chute-display', events: 'display-update, display', interval: '2초' },
];

// [8] REST API 엔드포인트
export const swApiEndpoints = [
  { method: 'GET', path: '/api/info-link/status', module: '정보연계', desc: '정보연계 상태' },
  { method: 'POST', path: '/api/info-link/sync', module: '정보연계', desc: 'SIMS/KPLAS 동기화' },
  { method: 'GET', path: '/api/info-link/data', module: '정보연계', desc: '구분데이터 조회' },
  { method: 'GET', path: '/api/info-link/lookup/:zip', module: '정보연계', desc: '우편번호 조회' },
  { method: 'GET', path: '/api/sorting/plans', module: '구분시스템', desc: '구분계획 목록' },
  { method: 'POST', path: '/api/sorting/process', module: '구분시스템', desc: '바코드 구분 처리' },
  { method: 'GET', path: '/api/sorting/history', module: '구분시스템', desc: '구분 이력' },
  { method: 'GET', path: '/api/sorting/comm-log', module: '구분시스템', desc: '통신 로그' },
  { method: 'GET', path: '/api/statistics/summary', module: '통계', desc: '일별 요약' },
  { method: 'GET', path: '/api/statistics/export', module: '통계', desc: 'CSV 내보내기' },
  { method: 'GET', path: '/api/monitoring/layout', module: '모니터링', desc: '구분기 레이아웃' },
  { method: 'GET', path: '/api/monitoring/alarms', module: '모니터링', desc: '알람 목록' },
  { method: 'GET', path: '/api/keying/stations', module: '타건기', desc: '스테이션 목록' },
  { method: 'POST', path: '/api/keying/requests', module: '타건기', desc: '타건 요청' },
  { method: 'GET', path: '/api/chute-display', module: '슈트현황', desc: '슈트 현황판' },
  { method: 'POST', path: '/api/chute-display/apply-plan', module: '슈트현황', desc: '계획 적용' },
  { method: 'GET', path: '/api/situation/overview', module: '상황관제', desc: '전체 현황' },
  { method: 'GET', path: '/api/situation/delivery-points', module: '상황관제', desc: '배달점별 정보' },
];

// [9] 테스트 결과
export const swTestResults = {
  unit: { total: 66, passed: 66, failed: 0, suites: [
    { name: 'InfoLinkService', tests: 8, desc: '초기화, SIMS/KPLAS 동기화, 우편번호 조회, 스케줄러' },
    { name: 'SortingService', tests: 12, desc: '계획 CRUD, 바코드 구분 엔진, 통신로그, 통계' },
    { name: 'StatisticsService', tests: 10, desc: '6종 통계, 기간필터, CSV 내보내기' },
    { name: 'MonitoringService', tests: 10, desc: '레이아웃, 슈트 상태, 알람 관리, 통신현황' },
    { name: 'KeyingService', tests: 10, desc: '스테이션, 타건 요청/결과, 이력, 통계' },
    { name: 'ChuteDisplayService', tests: 8, desc: '슈트 현황, 계획 적용, 만재 전환' },
    { name: 'SituationControlService', tests: 8, desc: '종합현황, 배달점, 알람, 구분기 상태' },
  ]},
  e2e: { total: 22, passed: 22, failed: 0, desc: '전체 REST API 통합 테스트 (18 엔드포인트)' },
};
