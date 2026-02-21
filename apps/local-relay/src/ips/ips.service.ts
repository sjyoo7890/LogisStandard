import { Injectable } from '@nestjs/common';
import { createLogger } from '@kpost/logger';

export type BarcodeType = 'CODE128' | 'EAN128' | 'QR' | 'DATAMATRIX' | 'UNKNOWN';
export type ReadStatus = 'SUCCESS' | 'NO_READ' | 'MULTI_READ' | 'ERROR';
export type IPSDeviceStatus = 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';

export interface BarcodeReadResult {
  readId: string;
  inductionNo: number;
  barcode: string;
  barcodeType: BarcodeType;
  status: ReadStatus;
  confidence: number;
  quality: number;
  readTimeMs: number;
  triggerId: string;
  timestamp: string;
}

export interface IPSDeviceState {
  deviceId: string;
  name: string;
  status: IPSDeviceStatus;
  inductionNo: number;
  totalReads: number;
  successReads: number;
  failedReads: number;
  successRate: number;
  lastReadAt?: string;
  alarms: string[];
}

/**
 * IPS/BCR 연계 서비스
 * - 바코드 판독 정보 수신
 * - 우편물ID, 트리거 정보 처리
 * - IPS 상태/알람 정보 모니터링
 */
@Injectable()
export class IPSService {
  private logger = createLogger({ service: 'ips' });
  private devices = new Map<string, IPSDeviceState>();
  private readHistory: BarcodeReadResult[] = [];
  private readCounter = 0;
  private triggerCounter = 0;

  private static readonly MAX_HISTORY = 1000;

  constructor() {
    this.initializeDevices();
  }

  private initializeDevices(): void {
    const defaults: Array<{ id: string; name: string; induction: number }> = [
      { id: 'IPS-IND01', name: 'IPS 인덕션1 BCR', induction: 1 },
      { id: 'IPS-IND02', name: 'IPS 인덕션2 BCR', induction: 2 },
      { id: 'IPS-IND03', name: 'IPS 인덕션3 BCR', induction: 3 },
      { id: 'IPS-IND04', name: 'IPS 인덕션4 BCR', induction: 4 },
    ];

    for (const d of defaults) {
      this.devices.set(d.id, {
        deviceId: d.id,
        name: d.name,
        status: 'ONLINE',
        inductionNo: d.induction,
        totalReads: 0,
        successReads: 0,
        failedReads: 0,
        successRate: 0,
        alarms: [],
      });
    }
    this.logger.info(`Initialized ${defaults.length} IPS devices`);
  }

  /**
   * 바코드 판독 결과 처리
   */
  processRead(deviceId: string, barcode: string, barcodeType: BarcodeType, confidence: number, quality: number, readTimeMs: number): BarcodeReadResult {
    const device = this.devices.get(deviceId);
    const triggerId = `TRG_${++this.triggerCounter}`;
    const status: ReadStatus =
      !barcode ? 'NO_READ' :
      barcode.includes('/') ? 'MULTI_READ' :
      confidence >= 50 ? 'SUCCESS' : 'ERROR';

    const result: BarcodeReadResult = {
      readId: `READ_${++this.readCounter}`,
      inductionNo: device?.inductionNo ?? 0,
      barcode,
      barcodeType,
      status,
      confidence,
      quality,
      readTimeMs,
      triggerId,
      timestamp: new Date().toISOString(),
    };

    if (device) {
      device.totalReads++;
      if (status === 'SUCCESS') device.successReads++;
      else device.failedReads++;
      device.successRate = device.totalReads > 0 ? (device.successReads / device.totalReads) * 100 : 0;
      device.lastReadAt = result.timestamp;
    }

    this.readHistory.unshift(result);
    if (this.readHistory.length > IPSService.MAX_HISTORY) {
      this.readHistory = this.readHistory.slice(0, IPSService.MAX_HISTORY);
    }

    this.logger.info(`Barcode read [${deviceId}]: ${status} - ${barcode || 'N/A'} (${confidence}%)`);
    return result;
  }

  /**
   * 디바이스 상태 변경
   */
  setDeviceStatus(deviceId: string, status: IPSDeviceStatus): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;
    device.status = status;
    this.logger.info(`IPS device ${deviceId} status → ${status}`);
    return true;
  }

  /**
   * 알람 추가
   */
  addAlarm(deviceId: string, alarm: string): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;
    device.alarms.push(alarm);
    device.status = 'ERROR';
    this.logger.warn(`IPS alarm [${deviceId}]: ${alarm}`);
    return true;
  }

  /**
   * 알람 클리어
   */
  clearAlarms(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;
    device.alarms = [];
    if (device.status === 'ERROR') device.status = 'ONLINE';
    return true;
  }

  getAllDevices(): IPSDeviceState[] {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId: string): IPSDeviceState | undefined {
    return this.devices.get(deviceId);
  }

  getReadHistory(params?: { deviceId?: string; status?: ReadStatus; limit?: number }): BarcodeReadResult[] {
    let history = [...this.readHistory];
    if (params?.deviceId) {
      const device = this.devices.get(params.deviceId);
      if (device) history = history.filter((r) => r.inductionNo === device.inductionNo);
    }
    if (params?.status) history = history.filter((r) => r.status === params.status);
    return history.slice(0, params?.limit ?? 100);
  }

  getOverallStats(): { totalReads: number; successRate: number; avgReadTime: number } {
    const totalReads = this.readHistory.length;
    const successCount = this.readHistory.filter((r) => r.status === 'SUCCESS').length;
    const avgTime = totalReads > 0 ? this.readHistory.reduce((s, r) => s + r.readTimeMs, 0) / totalReads : 0;
    return {
      totalReads,
      successRate: totalReads > 0 ? (successCount / totalReads) * 100 : 0,
      avgReadTime: Math.round(avgTime * 10) / 10,
    };
  }
}
