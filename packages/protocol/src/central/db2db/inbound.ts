import { z } from 'zod';

/**
 * SIMS → 구분기 수신 데이터 타입
 */

// 접수정보 (소포, 등기통상)
export interface ReceptionInfo {
  receptionId: string;          // 접수번호
  mailType: MailType;           // 우편물 유형
  barcode: string;              // 바코드
  senderName: string;           // 발송인
  senderZipCode: string;        // 발송인 우편번호
  senderAddress: string;        // 발송인 주소
  recipientName: string;        // 수취인
  recipientZipCode: string;     // 수취인 우편번호
  recipientAddress: string;     // 수취인 주소
  weight: number;               // 중량 (g)
  serviceType: string;          // 서비스 유형
  registeredAt: string;         // 접수 일시
  postOfficeCode: string;       // 접수 관서코드
}

export enum MailType {
  PARCEL = 'PARCEL',                  // 소포
  REGISTERED_MAIL = 'REGISTERED',     // 등기
  REGULAR_MAIL = 'REGULAR',           // 통상
  EXPRESS = 'EXPRESS',                // 익일특급
  INTERNATIONAL = 'INTERNATIONAL',   // 국제
}

export const ReceptionInfoSchema = z.object({
  receptionId: z.string().min(1),
  mailType: z.nativeEnum(MailType),
  barcode: z.string().min(1),
  senderName: z.string(),
  senderZipCode: z.string().regex(/^\d{5}$/),
  senderAddress: z.string(),
  recipientName: z.string(),
  recipientZipCode: z.string().regex(/^\d{5}$/),
  recipientAddress: z.string(),
  weight: z.number().positive(),
  serviceType: z.string(),
  registeredAt: z.string().datetime(),
  postOfficeCode: z.string(),
});

// 주소 및 순로DB (집배순로)
export interface AddressRouteDB {
  routeId: string;              // 순로 ID
  zipCode: string;              // 우편번호
  sido: string;                 // 시도
  sigungu: string;              // 시군구
  eupmyeondong: string;         // 읍면동
  roadName: string;             // 도로명
  buildingNumber: string;       // 건물번호
  detailAddress: string;        // 상세주소
  deliveryOfficeCode: string;   // 배달국 코드
  deliveryRouteCode: string;    // 배달순로 코드
  sortCode: string;             // 구분코드
  chuteNumber: number;          // 슈트번호
  effectiveDate: string;        // 유효시작일
  expirationDate: string;       // 유효종료일
}

export const AddressRouteDBSchema = z.object({
  routeId: z.string().min(1),
  zipCode: z.string().regex(/^\d{5}$/),
  sido: z.string(),
  sigungu: z.string(),
  eupmyeondong: z.string(),
  roadName: z.string(),
  buildingNumber: z.string(),
  detailAddress: z.string(),
  deliveryOfficeCode: z.string(),
  deliveryRouteCode: z.string(),
  sortCode: z.string(),
  chuteNumber: z.number().int().nonnegative(),
  effectiveDate: z.string(),
  expirationDate: z.string(),
});

// 수신 데이터 통합 타입
export interface DB2DBInbound {
  receptionInfo: ReceptionInfo[];
  addressRouteDB: AddressRouteDB[];
}
