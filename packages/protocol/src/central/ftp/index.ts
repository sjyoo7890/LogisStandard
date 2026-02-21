import { z } from 'zod';

/**
 * FTP 연계 프로토콜
 * KPLAS ↔ 소형통상구분기 파일 전송
 */

// 배달점주소DB 파일
export interface DeliveryAddressDBFile {
  fileId: string;
  fileName: string;
  version: string;
  effectiveDate: string;
  records: DeliveryAddressRecord[];
  totalRecords: number;
  checksum: string;
  generatedAt: string;
}

export interface DeliveryAddressRecord {
  zipCode: string;           // 우편번호
  deliveryPoint: string;     // 배달점
  address: string;           // 주소
  sortCode: string;          // 구분코드
  routeCode: string;         // 순로코드
  boxNumber: number;         // 구분칸번호
  officeCode: string;        // 배달국코드
}

export const DeliveryAddressRecordSchema = z.object({
  zipCode: z.string().regex(/^\d{5}$/),
  deliveryPoint: z.string(),
  address: z.string(),
  sortCode: z.string(),
  routeCode: z.string(),
  boxNumber: z.number().int().nonnegative(),
  officeCode: z.string(),
});

// MLF(Machine Learning Feature) 파일 또는 주소DB파일
export interface MLFFile {
  fileId: string;
  fileName: string;
  fileType: MLFFileType;
  version: string;
  size: number;              // 파일 크기 (bytes)
  encoding: string;          // 인코딩 (UTF-8, EUC-KR 등)
  records: MLFRecord[];
  totalRecords: number;
  checksum: string;
  generatedAt: string;
}

export enum MLFFileType {
  MLF = 'MLF',                   // 머신러닝 특징 파일
  ADDRESS_DB = 'ADDRESS_DB',     // 주소DB 파일
  PATTERN_DB = 'PATTERN_DB',     // 패턴DB 파일
}

export interface MLFRecord {
  recordId: string;
  pattern: string;           // 인식 패턴
  sortCode: string;          // 매핑 구분코드
  confidence: number;        // 신뢰도 (0.0 ~ 1.0)
  category: string;          // 분류 카테고리
}

export const MLFRecordSchema = z.object({
  recordId: z.string(),
  pattern: z.string(),
  sortCode: z.string(),
  confidence: z.number().min(0).max(1),
  category: z.string(),
});

// 구분계획 파일
export interface SortingPlanFile {
  fileId: string;
  fileName: string;
  planDate: string;          // 구분계획 적용일
  equipmentId: string;       // 대상 설비 ID
  postOfficeCode: string;    // 관서코드
  plans: SortingPlanRecord[];
  totalPlans: number;
  checksum: string;
  generatedAt: string;
}

export interface SortingPlanRecord {
  sortCode: string;          // 구분코드
  destinationCode: string;   // 목적지코드
  destinationName: string;   // 목적지명
  chuteNumber: number;       // 슈트번호 (또는 구분칸번호)
  priority: number;          // 우선순위
  effectiveFrom: string;     // 유효시작시간
  effectiveTo: string;       // 유효종료시간
}

export const SortingPlanRecordSchema = z.object({
  sortCode: z.string(),
  destinationCode: z.string(),
  destinationName: z.string(),
  chuteNumber: z.number().int().nonnegative(),
  priority: z.number().int().positive(),
  effectiveFrom: z.string(),
  effectiveTo: z.string(),
});

// FTP 전송 상태
export enum FTPTransferStatus {
  PENDING = 'PENDING',
  TRANSFERRING = 'TRANSFERRING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  VALIDATING = 'VALIDATING',
}

export interface FTPTransferLog {
  transferId: string;
  fileName: string;
  direction: 'UPLOAD' | 'DOWNLOAD';
  status: FTPTransferStatus;
  fileSize: number;
  transferredBytes: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
}
