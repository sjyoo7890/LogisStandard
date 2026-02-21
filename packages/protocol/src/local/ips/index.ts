import { z } from 'zod';

/**
 * IPS(BCR) 바코드 판독 프로토콜
 * IPS(Induction Position System) / BCR(Bar Code Reader)
 */

// 바코드 판독 요청
export interface IPSReadRequest {
  requestId: string;
  inductionId: string;         // 투입구 ID
  position: number;            // 인덕션 위치
  triggerType: TriggerType;    // 트리거 유형
  timestamp: string;
}

export enum TriggerType {
  SENSOR = 'SENSOR',           // 센서 트리거
  MANUAL = 'MANUAL',           // 수동 트리거
  CONTINUOUS = 'CONTINUOUS',   // 연속 판독
}

// 바코드 판독 결과
export interface IPSReadResult {
  resultId: string;
  requestId: string;
  inductionId: string;
  barcodes: BarcodeData[];     // 판독된 바코드 목록 (복수 가능)
  imageId?: string;            // 촬영 이미지 ID (추적용)
  readStatus: IPSReadStatus;
  confidence: number;          // 판독 신뢰도 (0.0 ~ 1.0)
  readTimeMs: number;          // 판독 소요시간 (ms)
  timestamp: string;
}

export enum IPSReadStatus {
  SUCCESS = 'SUCCESS',         // 정상 판독
  NO_READ = 'NO_READ',        // 미판독
  MULTI_READ = 'MULTI_READ',  // 다중 판독
  PARTIAL = 'PARTIAL',        // 일부 판독
  ERROR = 'ERROR',            // 판독 에러
}

export interface BarcodeData {
  barcode: string;             // 바코드 값
  barcodeType: BarcodeType;    // 바코드 유형
  position: BarcodePosition;   // 바코드 위치
  quality: number;             // 품질 지표 (0 ~ 100)
}

export enum BarcodeType {
  CODE128 = 'CODE128',
  CODE39 = 'CODE39',
  EAN13 = 'EAN13',
  EAN128 = 'EAN128',
  QR_CODE = 'QR_CODE',
  DATA_MATRIX = 'DATA_MATRIX',
  POSTNET = 'POSTNET',
  UNKNOWN = 'UNKNOWN',
}

export interface BarcodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;              // 회전각 (degree)
}

export const IPSReadResultSchema = z.object({
  resultId: z.string().min(1),
  requestId: z.string(),
  inductionId: z.string(),
  barcodes: z.array(z.object({
    barcode: z.string(),
    barcodeType: z.nativeEnum(BarcodeType),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      angle: z.number(),
    }),
    quality: z.number().min(0).max(100),
  })),
  imageId: z.string().optional(),
  readStatus: z.nativeEnum(IPSReadStatus),
  confidence: z.number().min(0).max(1),
  readTimeMs: z.number().nonnegative(),
  timestamp: z.string().datetime(),
});

// IPS 설정
export interface IPSConfig {
  inductionId: string;
  scannerModel: string;
  readTimeout: number;         // 판독 타임아웃 (ms)
  minConfidence: number;       // 최소 판독 신뢰도
  enableMultiRead: boolean;    // 다중 바코드 판독
  enableImageCapture: boolean; // 이미지 캡처 활성화
  supportedBarcodeTypes: BarcodeType[];
}
