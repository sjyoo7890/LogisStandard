import { z } from 'zod';

/**
 * 소켓통신 연계 프로토콜
 * PDA ↔ 소포체결 수작업시스템
 */

// 국명표바코드 정보
export interface LabelBarcodeInfo {
  barcode: string;              // 국명표 바코드
  labelType: LabelType;        // 라벨 유형
  officeCode: string;          // 관서코드
  officeName: string;           // 관서명
  scannedAt: string;            // 스캔 일시
  deviceId: string;             // PDA/스캐너 ID
}

export enum LabelType {
  OFFICE_LABEL = 'OFFICE_LABEL',     // 국명표
  ROUTE_LABEL = 'ROUTE_LABEL',       // 순로표
  ZONE_LABEL = 'ZONE_LABEL',         // 구역표
}

export const LabelBarcodeInfoSchema = z.object({
  barcode: z.string().min(1),
  labelType: z.nativeEnum(LabelType),
  officeCode: z.string(),
  officeName: z.string(),
  scannedAt: z.string().datetime(),
  deviceId: z.string(),
});

// 용기번호 정보
export interface ContainerNumberInfo {
  containerNumber: string;       // 용기번호
  containerType: ContainerType;  // 용기유형
  destinationCode: string;       // 목적지코드
  destinationName: string;       // 목적지명
  sealNumber?: string;           // 봉인번호
  itemCount: number;             // 수납 물량
  status: ContainerStatus;
  registeredAt: string;
  operatorId: string;
}

export enum ContainerType {
  POUCH = 'POUCH',         // 우편낭
  TRAY = 'TRAY',           // 트레이
  CAGE = 'CAGE',           // 케이지
  PALLET = 'PALLET',       // 파레트
  BOX = 'BOX',             // 상자
}

export enum ContainerStatus {
  EMPTY = 'EMPTY',
  LOADING = 'LOADING',
  SEALED = 'SEALED',
  DISPATCHED = 'DISPATCHED',
}

export const ContainerNumberInfoSchema = z.object({
  containerNumber: z.string().min(1),
  containerType: z.nativeEnum(ContainerType),
  destinationCode: z.string(),
  destinationName: z.string(),
  sealNumber: z.string().optional(),
  itemCount: z.number().int().nonnegative(),
  status: z.nativeEnum(ContainerStatus),
  registeredAt: z.string().datetime(),
  operatorId: z.string(),
});

// 등기바코드 정보
export interface RegisteredBarcodeInfo {
  barcode: string;              // 등기바코드 (13자리)
  mailType: string;             // 우편물유형
  weight: number;               // 중량 (g)
  scannedAt: string;
  deviceId: string;
  postOfficeCode: string;
}

export const RegisteredBarcodeInfoSchema = z.object({
  barcode: z.string().length(13),
  mailType: z.string(),
  weight: z.number().positive(),
  scannedAt: z.string().datetime(),
  deviceId: z.string(),
  postOfficeCode: z.string(),
});

// 체결확인 정보
export interface BindingConfirmInfo {
  confirmId: string;
  barcode: string;
  containerNumber: string;
  confirmed: boolean;
  confirmedAt: string;
  operatorId: string;
  deviceId: string;
  method: 'PDA' | 'MANUAL' | 'AUTO';
}

export const BindingConfirmInfoSchema = z.object({
  confirmId: z.string().min(1),
  barcode: z.string(),
  containerNumber: z.string(),
  confirmed: z.boolean(),
  confirmedAt: z.string().datetime(),
  operatorId: z.string(),
  deviceId: z.string(),
  method: z.enum(['PDA', 'MANUAL', 'AUTO']),
});

// 구분구정보
export interface SortingZoneInfo {
  zoneId: string;
  zoneName: string;
  equipmentId: string;
  chuteNumbers: number[];      // 소속 슈트 목록
  destinationCodes: string[];  // 배정 목적지코드 목록
  status: 'ACTIVE' | 'INACTIVE' | 'FULL';
  currentLoad: number;         // 현재 적재량
  maxCapacity: number;         // 최대 용량
  updatedAt: string;
}

export const SortingZoneInfoSchema = z.object({
  zoneId: z.string().min(1),
  zoneName: z.string(),
  equipmentId: z.string(),
  chuteNumbers: z.array(z.number().int()),
  destinationCodes: z.array(z.string()),
  status: z.enum(['ACTIVE', 'INACTIVE', 'FULL']),
  currentLoad: z.number().int().nonnegative(),
  maxCapacity: z.number().int().positive(),
  updatedAt: z.string().datetime(),
});
