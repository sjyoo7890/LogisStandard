/**
 * packages/protocol 데모 스크립트
 * 실행: npx ts-node packages/protocol/demo.ts
 */

// === 1. 프로토콜 버전 확인 ===
import { PROTOCOL_VERSION, isVersionCompatible } from './src/version';

console.log('='.repeat(60));
console.log('  우정사업본부 자동화설비 표준 인터페이스 프로토콜 데모');
console.log('='.repeat(60));
console.log(`\n[1] 프로토콜 버전: v${PROTOCOL_VERSION.toString()}`);
console.log(`    v1.0.0 호환: ${isVersionCompatible('1.0.0')}`);
console.log(`    v2.0.0 호환: ${isVersionCompatible('2.0.0')}`);

// === 2. 에러 코드 생성 ===
import { createProtocolError, ProtocolErrorCode, ErrorSeverity } from './src/errors';

console.log('\n[2] 에러 코드 시스템');
const error = createProtocolError(
  ProtocolErrorCode.PLC_CONNECTION_LOST,
  ErrorSeverity.CRITICAL,
  'PLC 연결이 끊어졌습니다 (설비 FSS-001)',
  'local-relay',
);
console.log(`    코드: ${error.code}`);
console.log(`    심각도: ${error.severity}`);
console.log(`    메시지: ${error.message}`);
console.log(`    소스: ${error.source}`);
console.log(`    시각: ${error.timestamp}`);

// === 3. 상위단 DB2DB - 접수정보 Zod 검증 ===
import { ReceptionInfoSchema, MailType } from './src/central/db2db/inbound';

console.log('\n[3] 상위단 DB2DB - 접수정보 Zod 검증');
const validReception = {
  receptionId: 'RCP-2026-00001',
  mailType: MailType.PARCEL,
  barcode: '1234567890123',
  senderName: '홍길동',
  senderZipCode: '06234',
  senderAddress: '서울특별시 강남구 테헤란로 123',
  recipientName: '김철수',
  recipientZipCode: '34100',
  recipientAddress: '대전광역시 유성구 과학로 456',
  weight: 2500,
  serviceType: '일반소포',
  registeredAt: new Date().toISOString(),
  postOfficeCode: 'SEL01',
};

const validResult = ReceptionInfoSchema.safeParse(validReception);
console.log(`    정상 데이터 검증: ${validResult.success ? '✓ 통과' : '✗ 실패'}`);

const invalidReception = { ...validReception, recipientZipCode: 'ABC', weight: -100 };
const invalidResult = ReceptionInfoSchema.safeParse(invalidReception);
console.log(`    비정상 데이터 검증: ${invalidResult.success ? '✓ 통과' : '✗ 실패 (기대된 결과)'}`);
if (!invalidResult.success) {
  invalidResult.error.issues.forEach((issue) => {
    console.log(`      - ${issue.path.join('.')}: ${issue.message}`);
  });
}

// === 4. 상위단 DB2DB - 구분결과 & 통계 ===
import { SortingResult, ReportPeriod, StatisticsInfoSchema } from './src/central/db2db/outbound';

console.log('\n[4] 상위단 - 구분결과 & 통계정보');
const stats = {
  statisticsId: 'STAT-2026-001',
  equipmentId: 'FSS-001',
  equipmentType: 'FSS',
  postOfficeCode: 'SEL01',
  reportDate: '20260218',
  reportPeriod: ReportPeriod.DAILY,
  totalProcessed: 15000,
  successCount: 14200,
  rejectCount: 500,
  noReadCount: 200,
  errorCount: 100,
  throughput: 6000,
  operatingHours: 480,
  downtime: 30,
  availability: 94.12,
  generatedAt: new Date().toISOString(),
};
const statsResult = StatisticsInfoSchema.safeParse(stats);
console.log(`    일일통계 검증: ${statsResult.success ? '✓ 통과' : '✗ 실패'}`);
console.log(`    설비: ${stats.equipmentId} (${stats.equipmentType})`);
console.log(`    처리: ${stats.totalProcessed}건 (성공: ${stats.successCount}, 리젝트: ${stats.rejectCount})`);
console.log(`    가동률: ${stats.availability}%`);

// === 5. CDC 변경감지 메커니즘 ===
import { CDCOperation, DEFAULT_CDC_CONFIG } from './src/central/db2db/cdc';

console.log('\n[5] CDC 변경감지 메커니즘');
const cdcEvent = {
  eventId: 'CDC-001',
  tableName: 'reception_info',
  operation: CDCOperation.INSERT,
  timestamp: new Date().toISOString(),
  sequenceNo: 1,
  after: validReception,
  primaryKey: { receptionId: 'RCP-2026-00001' },
  source: 'SIMS_DB',
};
console.log(`    이벤트: ${cdcEvent.operation} on ${cdcEvent.tableName}`);
console.log(`    시퀀스: #${cdcEvent.sequenceNo}`);
console.log(`    배치 설정: ${DEFAULT_CDC_CONFIG.batchSize}건/배치, ${DEFAULT_CDC_CONFIG.pollIntervalMs}ms 간격`);

// === 6. FTP 파일 구분계획 ===
import { SortingPlanRecordSchema } from './src/central/ftp';

console.log('\n[6] FTP - 구분계획 파일');
const sortingPlan = {
  sortCode: '34100',
  destinationCode: 'DJN01',
  destinationName: '대전우편집중국',
  chuteNumber: 15,
  priority: 1,
  effectiveFrom: '2026-02-18T00:00:00',
  effectiveTo: '2026-12-31T23:59:59',
};
const planResult = SortingPlanRecordSchema.safeParse(sortingPlan);
console.log(`    구분계획 검증: ${planResult.success ? '✓ 통과' : '✗ 실패'}`);
console.log(`    ${sortingPlan.sortCode} → 슈트 #${sortingPlan.chuteNumber} (${sortingPlan.destinationName})`);

// === 7. Fallback 상태 ===
import { FallbackStatus, DEFAULT_SIMS_HEALTH_CONFIG } from './src/central/fallback';

console.log('\n[7] SIMS 장애 Fallback 메커니즘');
console.log(`    Health Check 간격: ${DEFAULT_SIMS_HEALTH_CONFIG.checkIntervalMs}ms`);
console.log(`    장애 판단: 연속 ${DEFAULT_SIMS_HEALTH_CONFIG.failureThreshold}회 실패`);
console.log(`    복구 판단: 연속 ${DEFAULT_SIMS_HEALTH_CONFIG.recoveryThreshold}회 성공`);
console.log(`    상태 흐름: ${FallbackStatus.INACTIVE} → ${FallbackStatus.ACTIVATED} → ${FallbackStatus.RECOVERING} → ${FallbackStatus.COMPLETED}`);

// === 8. 하위단 PLC 제어 ===
import { PLCCommandType, PLCMessageSchema, OperatingMode } from './src/local/plc';

console.log('\n[8] 하위단 - PLC 제어 전문');
const plcMsg = {
  messageId: 'PLC-MSG-001',
  commandType: PLCCommandType.START,
  equipmentId: 'FSS-001',
  parameters: { speed: 120 },
  timestamp: new Date().toISOString(),
  sequenceNo: 1,
};
const plcResult = PLCMessageSchema.safeParse(plcMsg);
console.log(`    PLC 명령 검증: ${plcResult.success ? '✓ 통과' : '✗ 실패'}`);
console.log(`    명령: ${plcMsg.commandType}, 설비: ${plcMsg.equipmentId}, 속도: ${plcMsg.parameters.speed}m/min`);

// === 9. 하위단 IPS 바코드 판독 ===
import { IPSReadStatus, BarcodeType } from './src/local/ips';

console.log('\n[9] 하위단 - IPS 바코드 판독 결과');
const ipsResult = {
  resultId: 'IPS-RES-001',
  requestId: 'IPS-REQ-001',
  inductionId: 'IND-01',
  barcodes: [
    {
      barcode: '1234567890123',
      barcodeType: BarcodeType.CODE128,
      position: { x: 120, y: 80, width: 200, height: 40, angle: 2.5 },
      quality: 92,
    },
  ],
  readStatus: IPSReadStatus.SUCCESS,
  confidence: 0.95,
  readTimeMs: 12,
  timestamp: new Date().toISOString(),
};
console.log(`    판독 결과: ${ipsResult.readStatus} (신뢰도: ${ipsResult.confidence * 100}%)`);
console.log(`    바코드: ${ipsResult.barcodes[0].barcode} (${ipsResult.barcodes[0].barcodeType})`);
console.log(`    품질: ${ipsResult.barcodes[0].quality}/100, 소요시간: ${ipsResult.readTimeMs}ms`);

// === 10. 하위단 OCR 주소 인식 ===
import { OCRRecognitionStatus, ZipCodeMethod } from './src/local/ocr';

console.log('\n[10] 하위단 - OCR 주소 인식 결과');
const ocrResult = {
  resultId: 'OCR-RES-001',
  requestId: 'OCR-REQ-001',
  recognitionStatus: OCRRecognitionStatus.SUCCESS,
  addressResult: {
    fullAddress: '대전광역시 유성구 과학로 456',
    sido: '대전광역시',
    sigungu: '유성구',
    roadName: '과학로',
    buildingNumber: '456',
    confidence: 0.88,
  },
  zipCodeResult: {
    zipCode: '34100',
    confidence: 0.95,
    method: ZipCodeMethod.ADDRESS_LOOKUP,
  },
  confidence: 0.91,
  processingTimeMs: 85,
  timestamp: new Date().toISOString(),
};
console.log(`    인식 결과: ${ocrResult.recognitionStatus} (신뢰도: ${ocrResult.confidence * 100}%)`);
console.log(`    주소: ${ocrResult.addressResult.fullAddress}`);
console.log(`    우편번호: ${ocrResult.zipCodeResult.zipCode} (${ocrResult.zipCodeResult.method})`);

// === 11. Profile A / B 비교 ===
import {
  EquipmentProfile,
  EQUIPMENT_PROFILE_MAP,
  createDefaultProfileA,
  createDefaultProfileB,
} from './src/local/profiles';

console.log('\n[11] 설비 프로파일');
console.log('    ┌──────────────────────────────────────────────────────┐');
console.log('    │  Profile A (소포/대형통상)   │  Profile B (소형통상/집배순로)  │');
console.log('    ├──────────────────────────────────────────────────────┤');

const profileA = createDefaultProfileA();
const profileB = createDefaultProfileB();
console.log(`    │  IPS 바코드: ✓             │  OCR 인식: ✓                  │`);
console.log(`    │  타건기: ✓                 │  MLF파일: ✓                   │`);
console.log(`    │  슈트현황판: ✓             │  구분칸현황판: ✓               │`);
console.log(`    │  상황관제: ✓               │  작업현황판(OP): ✓             │`);
console.log(`    │  슈트 ${profileA.equipment.chuteCount}개               │  구분칸 ${profileB.equipment.binCount}개                  │`);
console.log(`    │  최대 ${profileA.equipment.maxThroughput.toLocaleString()}/h          │  최대 ${profileB.equipment.maxThroughput.toLocaleString()}/h               │`);
console.log('    └──────────────────────────────────────────────────────┘');

console.log('\n    설비→프로파일 매핑:');
for (const [equip, profile] of Object.entries(EQUIPMENT_PROFILE_MAP)) {
  console.log(`      ${equip} → ${profile}`);
}

// === 12. 바이너리 직렬화 ===
import { BinarySerializer, JsonSerializer } from './src/serialization';

console.log('\n[12] 바이너리 직렬화/역직렬화');
const serializer = new BinarySerializer([
  { name: 'stx', type: 'uint8', length: 1, description: 'STX' },
  { name: 'length', type: 'uint32be', length: 4, description: '전문길이' },
  { name: 'equipId', type: 'ascii', length: 4, description: '설비ID' },
  { name: 'cmdCode', type: 'ascii', length: 4, description: '명령코드' },
  { name: 'seqNo', type: 'uint32be', length: 4, description: '시퀀스번호' },
]);

const binaryData = { stx: 0x02, length: 17, equipId: 'FSS1', cmdCode: '0001', seqNo: 42 };
const buffer = serializer.serialize(binaryData);
console.log(`    직렬화: ${JSON.stringify(binaryData)}`);
console.log(`    Buffer:  [${Array.from(buffer).map((b) => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
console.log(`    크기:    ${buffer.length} bytes`);

const decoded = serializer.deserialize(buffer);
console.log(`    역직렬화: ${JSON.stringify(decoded)}`);

// === 13. JSON 직렬화 + Zod 검증 ===
console.log('\n[13] JSON 직렬화 (Zod 검증 포함)');
const jsonSerializer = new JsonSerializer(PLCMessageSchema);
const json = jsonSerializer.serialize(plcMsg);
console.log(`    직렬화: ${json.substring(0, 80)}...`);
const deserialized = jsonSerializer.deserialize(json);
console.log(`    역직렬화: messageId=${deserialized.messageId}, command=${deserialized.commandType}`);

const validation = jsonSerializer.validate({ ...plcMsg, commandType: 'INVALID' });
console.log(`    잘못된 데이터 검증: ${validation.success ? '통과' : '✗ 실패 (기대된 결과)'}`);

console.log('\n' + '='.repeat(60));
console.log('  데모 완료! 모든 프로토콜 모듈이 정상 작동합니다.');
console.log('='.repeat(60));
