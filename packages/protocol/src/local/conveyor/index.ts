import { z } from 'zod';

/**
 * 컨베이어(C/V) PLC 프로토콜
 * 컨베이어 벨트 제어 및 상태 모니터링
 */

export enum ConveyorCommand {
  START = 'CV_START',
  STOP = 'CV_STOP',
  SPEED_SET = 'CV_SPEED',
  REVERSE = 'CV_REVERSE',
  JOG_FORWARD = 'CV_JOG_FWD',
  JOG_REVERSE = 'CV_JOG_REV',
  EMERGENCY_STOP = 'CV_E_STOP',
}

export interface ConveyorStatus {
  conveyorId: string;
  name: string;
  zone: string;                 // 구역
  running: boolean;
  direction: 'FORWARD' | 'REVERSE' | 'STOPPED';
  currentSpeed: number;         // 현재 속도 (m/min)
  targetSpeed: number;          // 목표 속도
  motorCurrent: number;         // 모터 전류 (A)
  motorTemperature: number;     // 모터 온도 (°C)
  beltTension: number;          // 벨트 장력
  itemDetected: boolean;        // 물체 감지
  jam: boolean;                 // 잼 발생
  fault: boolean;               // 고장
  faultCode?: string;
  operatingHours: number;       // 총 가동시간 (시간)
  timestamp: string;
}

export const ConveyorStatusSchema = z.object({
  conveyorId: z.string(),
  name: z.string(),
  zone: z.string(),
  running: z.boolean(),
  direction: z.enum(['FORWARD', 'REVERSE', 'STOPPED']),
  currentSpeed: z.number().nonnegative(),
  targetSpeed: z.number().nonnegative(),
  motorCurrent: z.number().nonnegative(),
  motorTemperature: z.number(),
  beltTension: z.number().nonnegative(),
  itemDetected: z.boolean(),
  jam: z.boolean(),
  fault: z.boolean(),
  faultCode: z.string().optional(),
  operatingHours: z.number().nonnegative(),
  timestamp: z.string().datetime(),
});

// 컨베이어 구간 정의
export interface ConveyorSection {
  sectionId: string;
  name: string;
  conveyors: string[];         // 구간 내 컨베이어 ID 목록
  startPoint: string;
  endPoint: string;
  totalLength: number;         // 총 길이 (m)
}

// 상자적재대 PLC (Profile B 전용)
export interface BoxLoaderStatus {
  loaderId: string;
  binNumber: number;           // 구분칸 번호
  boxPresent: boolean;         // 상자 존재
  boxFull: boolean;            // 상자 가득 참
  itemCount: number;           // 적재 물량
  boxType: 'SMALL' | 'MEDIUM' | 'LARGE';
  lastLoadedAt?: string;
  status: 'READY' | 'LOADING' | 'FULL' | 'REPLACING' | 'ERROR';
}

export const BoxLoaderStatusSchema = z.object({
  loaderId: z.string(),
  binNumber: z.number().int(),
  boxPresent: z.boolean(),
  boxFull: z.boolean(),
  itemCount: z.number().int().nonnegative(),
  boxType: z.enum(['SMALL', 'MEDIUM', 'LARGE']),
  lastLoadedAt: z.string().optional(),
  status: z.enum(['READY', 'LOADING', 'FULL', 'REPLACING', 'ERROR']),
});
