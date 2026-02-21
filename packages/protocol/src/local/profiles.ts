/**
 * 설비 프로파일 정의
 * 설비 유형에 따라 사용하는 프로토콜 조합이 다름
 */

export enum EquipmentProfile {
  PROFILE_A = 'PROFILE_A',   // 소포/대형통상구분기
  PROFILE_B = 'PROFILE_B',   // 소형통상/집배순로구분기
}

/**
 * Profile A: 소포/대형통상구분기 (FSS, PPSS, IOSS)
 * - IPS 바코드 기반 구분
 * - 타건기 지원 (NO_READ 시 수동입력)
 * - 슈트현황판
 * - 상황관제현황판
 */
export interface ProfileAConfig {
  profile: EquipmentProfile.PROFILE_A;
  features: {
    ipsBarcode: true;            // IPS 바코드 판독
    manualKeyInput: true;        // 타건기 (수동 바코드 입력)
    chuteDisplay: true;          // 슈트현황판
    controlDisplay: true;        // 상황관제현황판
    scada: true;                 // SCADA 모니터링
    conveyor: true;              // 컨베이어 제어
  };
  equipment: {
    plcCount: number;            // PLC 대수
    ipsCount: number;            // IPS(BCR) 대수
    chuteCount: number;          // 슈트 수
    inductionCount: number;      // 투입구 수
    keyInputStations: number;    // 타건기 대수
    maxThroughput: number;       // 최대 시간당 처리량
  };
}

/**
 * Profile B: 소형통상/집배순로구분기 (AFCS, PLCS)
 * - OCR/IMS 기반 주소 인식
 * - MLF파일 지원
 * - 구분칸현황판
 * - 작업현황판(OP패널)
 * - 상자적재대 PLC
 */
export interface ProfileBConfig {
  profile: EquipmentProfile.PROFILE_B;
  features: {
    ocrRecognition: true;        // OCR 주소 인식
    imsIntegration: true;        // IMS 연동
    mlfSupport: true;            // MLF 파일 지원
    binDisplay: true;            // 구분칸현황판
    workDisplay: true;           // 작업현황판 (OP패널)
    boxLoader: true;             // 상자적재대 PLC
    scada: true;                 // SCADA 모니터링
    conveyor: true;              // 컨베이어 제어
  };
  equipment: {
    plcCount: number;
    ocrEngineCount: number;      // OCR 엔진 수
    binCount: number;            // 구분칸 수
    feedCount: number;           // 급지기 수
    boxLoaderCount: number;      // 상자적재대 수
    maxThroughput: number;       // 최대 시간당 처리량
  };
}

export type ProfileConfig = ProfileAConfig | ProfileBConfig;

/**
 * 설비 유형별 기본 프로파일 매핑
 */
export const EQUIPMENT_PROFILE_MAP: Record<string, EquipmentProfile> = {
  FSS: EquipmentProfile.PROFILE_A,    // 일반소포자동분류기
  PPSS: EquipmentProfile.PROFILE_A,   // 등기소포자동분류기
  IOSS: EquipmentProfile.PROFILE_A,   // 국제발착자동분류기
  AFCS: EquipmentProfile.PROFILE_B,   // 통상우편자동분류기
  PLCS: EquipmentProfile.PROFILE_B,   // 소형택배자동분류기
};

/**
 * 프로파일별 기본 설정 생성
 */
export function createDefaultProfileA(): ProfileAConfig {
  return {
    profile: EquipmentProfile.PROFILE_A,
    features: {
      ipsBarcode: true,
      manualKeyInput: true,
      chuteDisplay: true,
      controlDisplay: true,
      scada: true,
      conveyor: true,
    },
    equipment: {
      plcCount: 2,
      ipsCount: 4,
      chuteCount: 100,
      inductionCount: 2,
      keyInputStations: 4,
      maxThroughput: 10000,
    },
  };
}

export function createDefaultProfileB(): ProfileBConfig {
  return {
    profile: EquipmentProfile.PROFILE_B,
    features: {
      ocrRecognition: true,
      imsIntegration: true,
      mlfSupport: true,
      binDisplay: true,
      workDisplay: true,
      boxLoader: true,
      scada: true,
      conveyor: true,
    },
    equipment: {
      plcCount: 2,
      ocrEngineCount: 6,
      binCount: 200,
      feedCount: 4,
      boxLoaderCount: 200,
      maxThroughput: 30000,
    },
  };
}
