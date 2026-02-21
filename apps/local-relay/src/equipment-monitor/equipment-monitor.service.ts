import { Injectable } from '@nestjs/common';
import { createLogger } from '@kpost/logger';

export type EquipmentType = 'SORTER' | 'INDUCTION' | 'CONVEYOR' | 'IPS_BCR' | 'OCR' | 'CHUTE' | 'BOX_LOADER';
export type EquipmentStatus = 'RUNNING' | 'STOPPED' | 'ERROR' | 'MAINTENANCE' | 'OFFLINE';
export type AlarmSeverity = 'CRITICAL' | 'MAJOR' | 'WARNING' | 'INFO';

export interface EquipmentState {
  equipmentId: string;
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  speed?: number;
  temperature?: number;
  current?: number;
  operatingMinutes: number;
  processedCount: number;
  errorCount: number;
  lastUpdated: string;
}

export interface AlarmEvent {
  alarmId: string;
  equipmentId: string;
  code: string;
  severity: AlarmSeverity;
  message: string;
  zone: string;
  active: boolean;
  occurredAt: string;
  clearedAt?: string;
}

/**
 * 장비 상태 모니터링 서비스
 * - PLC 상태정보, 알람정보 수집
 * - IPS/OCR 상태 정보
 * - C/V PLC 상태정보
 * - 상자적재대 PLC 상태정보
 * - 장비 상태 변경 이벤트 발행
 */
@Injectable()
export class EquipmentMonitorService {
  private logger = createLogger({ service: 'equipment-monitor' });
  private equipment = new Map<string, EquipmentState>();
  private alarms: AlarmEvent[] = [];
  private alarmCounter = 0;
  private statusListeners: Array<(eq: EquipmentState) => void> = [];
  private alarmListeners: Array<(alarm: AlarmEvent) => void> = [];

  constructor() {
    this.initializeEquipment();
  }

  private initializeEquipment(): void {
    const defaults: Array<Omit<EquipmentState, 'operatingMinutes' | 'processedCount' | 'errorCount' | 'lastUpdated'>> = [
      { equipmentId: 'SORTER-01', name: '구분기 메인', type: 'SORTER', status: 'STOPPED', speed: 0, temperature: 25, current: 0 },
      { equipmentId: 'IND-01', name: '인덕션 #1', type: 'INDUCTION', status: 'STOPPED', speed: 0 },
      { equipmentId: 'IND-02', name: '인덕션 #2', type: 'INDUCTION', status: 'STOPPED', speed: 0 },
      { equipmentId: 'CV-MAIN', name: '메인 컨베이어', type: 'CONVEYOR', status: 'STOPPED', speed: 0, temperature: 28 },
      { equipmentId: 'CV-REJECT', name: '리젝트 컨베이어', type: 'CONVEYOR', status: 'STOPPED', speed: 0 },
      { equipmentId: 'IPS-01', name: 'IPS 바코드리더 #1', type: 'IPS_BCR', status: 'OFFLINE' },
      { equipmentId: 'IPS-02', name: 'IPS 바코드리더 #2', type: 'IPS_BCR', status: 'OFFLINE' },
      { equipmentId: 'OCR-01', name: 'OCR 주소인식', type: 'OCR', status: 'OFFLINE' },
      { equipmentId: 'BOX-01', name: '상자적재대 #1', type: 'BOX_LOADER', status: 'STOPPED' },
    ];

    const now = new Date().toISOString();
    for (const d of defaults) {
      this.equipment.set(d.equipmentId, {
        ...d,
        operatingMinutes: 0,
        processedCount: 0,
        errorCount: 0,
        lastUpdated: now,
      });
    }
    this.logger.info(`Initialized ${defaults.length} equipment entries`);
  }

  /**
   * 장비 상태 업데이트
   */
  updateStatus(equipmentId: string, updates: Partial<Pick<EquipmentState, 'status' | 'speed' | 'temperature' | 'current'>>): EquipmentState | null {
    const eq = this.equipment.get(equipmentId);
    if (!eq) return null;

    const prevStatus = eq.status;
    Object.assign(eq, updates);
    eq.lastUpdated = new Date().toISOString();

    if (prevStatus !== eq.status) {
      this.logger.info(`Equipment ${equipmentId} status: ${prevStatus} → ${eq.status}`);
      for (const listener of this.statusListeners) listener(eq);
    }
    return eq;
  }

  /**
   * 처리 카운트 증가
   */
  incrementProcessed(equipmentId: string, count = 1): void {
    const eq = this.equipment.get(equipmentId);
    if (eq) {
      eq.processedCount += count;
      eq.lastUpdated = new Date().toISOString();
    }
  }

  /**
   * 알람 발생
   */
  raiseAlarm(equipmentId: string, code: string, severity: AlarmSeverity, message: string, zone: string): AlarmEvent {
    const alarm: AlarmEvent = {
      alarmId: `ALM_${++this.alarmCounter}`,
      equipmentId,
      code,
      severity,
      message,
      zone,
      active: true,
      occurredAt: new Date().toISOString(),
    };

    this.alarms.unshift(alarm);
    if (this.alarms.length > 500) this.alarms = this.alarms.slice(0, 500);

    const eq = this.equipment.get(equipmentId);
    if (eq && severity === 'CRITICAL') {
      eq.status = 'ERROR';
      eq.errorCount++;
      eq.lastUpdated = alarm.occurredAt;
    }

    this.logger.warn(`Alarm [${severity}] ${code}: ${message} (${equipmentId})`);
    for (const listener of this.alarmListeners) listener(alarm);
    return alarm;
  }

  /**
   * 알람 해제
   */
  clearAlarm(alarmId: string): boolean {
    const alarm = this.alarms.find((a) => a.alarmId === alarmId);
    if (!alarm || !alarm.active) return false;
    alarm.active = false;
    alarm.clearedAt = new Date().toISOString();
    this.logger.info(`Alarm cleared: ${alarmId}`);
    return true;
  }

  /**
   * 리스너 등록
   */
  onStatusChange(listener: (eq: EquipmentState) => void): void {
    this.statusListeners.push(listener);
  }

  onAlarm(listener: (alarm: AlarmEvent) => void): void {
    this.alarmListeners.push(listener);
  }

  getAllEquipment(): EquipmentState[] {
    return Array.from(this.equipment.values());
  }

  getEquipment(id: string): EquipmentState | undefined {
    return this.equipment.get(id);
  }

  getEquipmentByType(type: EquipmentType): EquipmentState[] {
    return Array.from(this.equipment.values()).filter((e) => e.type === type);
  }

  getActiveAlarms(): AlarmEvent[] {
    return this.alarms.filter((a) => a.active);
  }

  getAllAlarms(limit = 100): AlarmEvent[] {
    return this.alarms.slice(0, limit);
  }

  getSystemOverview(): {
    totalEquipment: number;
    running: number;
    stopped: number;
    error: number;
    activeAlarms: number;
    totalProcessed: number;
  } {
    const all = this.getAllEquipment();
    return {
      totalEquipment: all.length,
      running: all.filter((e) => e.status === 'RUNNING').length,
      stopped: all.filter((e) => e.status === 'STOPPED').length,
      error: all.filter((e) => e.status === 'ERROR').length,
      activeAlarms: this.getActiveAlarms().length,
      totalProcessed: all.reduce((s, e) => s + e.processedCount, 0),
    };
  }
}
