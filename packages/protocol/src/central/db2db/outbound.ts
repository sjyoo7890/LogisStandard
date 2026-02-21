import { z } from 'zod';
import { MailType } from './inbound';

/**
 * 구분기 → SIMS 송신 데이터 타입
 */

// 구분결과정보 (소포)
export interface SortingResultInfo {
  resultId: string;             // 결과 ID
  jobId: string;                // 작업 ID
  barcode: string;              // 바코드
  mailType: MailType;           // 우편물 유형
  sortCode: string;             // 구분코드
  destinationChute: number;     // 목적 슈트번호
  result: SortingResult;        // 구분결과
  rejectReason?: string;        // 리젝트 사유
  equipmentId: string;          // 설비 ID
  processedAt: string;          // 처리 일시
  postOfficeCode: string;       // 관서코드
}

export enum SortingResult {
  SUCCESS = 'SUCCESS',
  REJECT = 'REJECT',
  NO_READ = 'NO_READ',
  NO_MATCH = 'NO_MATCH',
  DOUBLE_FEED = 'DOUBLE_FEED',
  OVER_SIZE = 'OVER_SIZE',
  OVER_WEIGHT = 'OVER_WEIGHT',
}

export const SortingResultInfoSchema = z.object({
  resultId: z.string().min(1),
  jobId: z.string().min(1),
  barcode: z.string(),
  mailType: z.nativeEnum(MailType),
  sortCode: z.string(),
  destinationChute: z.number().int(),
  result: z.nativeEnum(SortingResult),
  rejectReason: z.string().optional(),
  equipmentId: z.string(),
  processedAt: z.string().datetime(),
  postOfficeCode: z.string(),
});

// 체결정보 (등기통상)
export interface BindingInfo {
  bindingId: string;            // 체결 ID
  barcode: string;              // 바코드
  containerNumber: string;      // 용기번호
  destinationCode: string;      // 목적지 코드
  destinationName: string;      // 목적지명
  bindingType: BindingType;     // 체결 유형
  confirmedAt: string;          // 체결확인 일시
  operatorId: string;           // 작업자 ID
  postOfficeCode: string;       // 관서코드
}

export enum BindingType {
  AUTO = 'AUTO',       // 자동체결
  MANUAL = 'MANUAL',   // 수동체결
  PDA = 'PDA',         // PDA체결
}

export const BindingInfoSchema = z.object({
  bindingId: z.string().min(1),
  barcode: z.string(),
  containerNumber: z.string(),
  destinationCode: z.string(),
  destinationName: z.string(),
  bindingType: z.nativeEnum(BindingType),
  confirmedAt: z.string().datetime(),
  operatorId: z.string(),
  postOfficeCode: z.string(),
});

// 통계정보 (모든 자동화설비)
export interface StatisticsInfo {
  statisticsId: string;         // 통계 ID
  equipmentId: string;          // 설비 ID
  equipmentType: string;        // 설비 유형
  postOfficeCode: string;       // 관서코드
  reportDate: string;           // 보고일자
  reportPeriod: ReportPeriod;   // 보고주기
  totalProcessed: number;       // 총 처리건수
  successCount: number;         // 성공건수
  rejectCount: number;          // 리젝트건수
  noReadCount: number;          // 미인식건수
  errorCount: number;           // 에러건수
  throughput: number;           // 시간당 처리량
  operatingHours: number;       // 가동시간 (분)
  downtime: number;             // 중단시간 (분)
  availability: number;         // 가동률 (%)
  generatedAt: string;          // 생성 일시
}

export enum ReportPeriod {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export const StatisticsInfoSchema = z.object({
  statisticsId: z.string().min(1),
  equipmentId: z.string(),
  equipmentType: z.string(),
  postOfficeCode: z.string(),
  reportDate: z.string(),
  reportPeriod: z.nativeEnum(ReportPeriod),
  totalProcessed: z.number().int().nonnegative(),
  successCount: z.number().int().nonnegative(),
  rejectCount: z.number().int().nonnegative(),
  noReadCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
  throughput: z.number().nonnegative(),
  operatingHours: z.number().nonnegative(),
  downtime: z.number().nonnegative(),
  availability: z.number().min(0).max(100),
  generatedAt: z.string().datetime(),
});

// 송신 데이터 통합 타입
export interface DB2DBOutbound {
  sortingResult: SortingResultInfo[];
  bindingInfo: BindingInfo[];
  statisticsInfo: StatisticsInfo[];
}
