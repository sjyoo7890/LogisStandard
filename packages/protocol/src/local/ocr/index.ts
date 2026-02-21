import { z } from 'zod';

/**
 * OCR 주소 인식 프로토콜
 * OCR(Optical Character Recognition) 시스템 연동
 * Profile B (소형통상/집배순로구분기) 전용
 */

// OCR 인식 요청
export interface OCRRequest {
  requestId: string;
  imageId: string;             // 이미지 ID
  imageSource: ImageSource;    // 이미지 소스
  mailType: string;            // 우편물 유형
  timestamp: string;
}

export enum ImageSource {
  TOP_CAMERA = 'TOP',         // 상면 카메라
  BOTTOM_CAMERA = 'BOTTOM',   // 하면 카메라
  SIDE_CAMERA = 'SIDE',       // 측면 카메라
  MANUAL = 'MANUAL',          // 수동 입력
}

// OCR 인식 결과
export interface OCRResult {
  resultId: string;
  requestId: string;
  recognitionStatus: OCRRecognitionStatus;
  addressResult?: AddressRecognition;
  zipCodeResult?: ZipCodeRecognition;
  rawText?: string;            // 인식된 원문
  confidence: number;          // 종합 신뢰도 (0.0 ~ 1.0)
  processingTimeMs: number;    // 처리 소요시간 (ms)
  timestamp: string;
}

export enum OCRRecognitionStatus {
  SUCCESS = 'SUCCESS',
  PARTIAL = 'PARTIAL',        // 일부 인식
  FAILED = 'FAILED',          // 인식 실패
  LOW_QUALITY = 'LOW_QUALITY',// 이미지 품질 불량
  NO_ADDRESS = 'NO_ADDRESS',  // 주소 없음
}

export interface AddressRecognition {
  fullAddress: string;         // 전체 주소
  sido?: string;               // 시도
  sigungu?: string;            // 시군구
  eupmyeondong?: string;       // 읍면동
  roadName?: string;           // 도로명
  buildingNumber?: string;     // 건물번호
  detailAddress?: string;      // 상세주소
  confidence: number;          // 주소 인식 신뢰도
}

export interface ZipCodeRecognition {
  zipCode: string;             // 인식된 우편번호
  confidence: number;          // 우편번호 인식 신뢰도
  method: ZipCodeMethod;       // 인식 방법
}

export enum ZipCodeMethod {
  DIRECT_READ = 'DIRECT_READ',         // 직접 판독
  ADDRESS_LOOKUP = 'ADDRESS_LOOKUP',    // 주소→우편번호 변환
  BARCODE_READ = 'BARCODE_READ',       // 바코드로부터 추출
}

export const OCRResultSchema = z.object({
  resultId: z.string().min(1),
  requestId: z.string(),
  recognitionStatus: z.nativeEnum(OCRRecognitionStatus),
  addressResult: z.object({
    fullAddress: z.string(),
    sido: z.string().optional(),
    sigungu: z.string().optional(),
    eupmyeondong: z.string().optional(),
    roadName: z.string().optional(),
    buildingNumber: z.string().optional(),
    detailAddress: z.string().optional(),
    confidence: z.number().min(0).max(1),
  }).optional(),
  zipCodeResult: z.object({
    zipCode: z.string(),
    confidence: z.number().min(0).max(1),
    method: z.nativeEnum(ZipCodeMethod),
  }).optional(),
  rawText: z.string().optional(),
  confidence: z.number().min(0).max(1),
  processingTimeMs: z.number().nonnegative(),
  timestamp: z.string().datetime(),
});

// OCR 엔진 설정
export interface OCREngineConfig {
  engineType: 'KPOST_OCR' | 'THIRD_PARTY';
  minConfidence: number;       // 최소 인식 신뢰도
  maxProcessingTimeMs: number; // 최대 처리 시간
  supportedLanguages: string[];
  enableAddressNormalization: boolean;  // 주소 정규화
  enableZipCodeLookup: boolean;        // 우편번호 자동 조회
  mlfFileVersion?: string;             // MLF 파일 버전
}
