import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createLogger } from '@kpost/logger';

export type EquipmentType = 'TRACK' | 'INDUCTION' | 'CHUTE' | 'CONVEYOR';
export type EquipmentStatus = 'RUNNING' | 'STOPPED' | 'ERROR' | 'MAINTENANCE';
export type ChuteStatus = 'NORMAL' | 'NEAR_FULL' | 'FULL' | 'UNUSED' | 'JAM' | 'ERROR';
export type AlarmSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlarmStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface LayoutEquipment {
  id: string;
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  position: { x: number; y: number };
}

export interface SorterLayout {
  tracks: LayoutEquipment[];
  inductions: LayoutEquipment[];
  chutes: LayoutEquipment[];
  conveyors: LayoutEquipment[];
}

export interface ChuteState {
  chuteNumber: number;
  status: ChuteStatus;
  destination: string;
  currentCount: number;
  capacity: number;
  fillRate: number;
}

export interface Alarm {
  id: string;
  severity: AlarmSeverity;
  status: AlarmStatus;
  equipmentId: string;
  equipmentName: string;
  message: string;
  detail: string;
  occurredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  actionNote?: string;
}

export interface CommStatus {
  equipmentId: string;
  name: string;
  protocol: string;
  connected: boolean;
  lastActivity?: string;
  errorCount: number;
}

@Injectable()
export class MonitoringService implements OnModuleInit, OnModuleDestroy {
  private logger = createLogger({ service: 'monitoring' });
  private layout!: SorterLayout;
  private chuteStates = new Map<number, ChuteState>();
  private alarms: Alarm[] = [];
  private commStatuses: CommStatus[] = [];
  private alarmListeners: Array<(alarm: Alarm) => void> = [];
  private layoutListeners: Array<(layout: SorterLayout) => void> = [];
  private alarmIdCounter = 0;

  onModuleInit() {
    this.initializeLayout();
    this.initializeChuteStates();
    this.initializeCommStatuses();
    this.initializeSampleAlarms();
    this.logger.info('MonitoringService initialized');
  }

  onModuleDestroy() {
    this.logger.info('MonitoringService destroyed');
  }

  private initializeLayout(): void {
    this.layout = {
      tracks: [
        { id: 'TRK-01', name: '메인트랙 1', type: 'TRACK', status: 'RUNNING', position: { x: 0, y: 100 } },
        { id: 'TRK-02', name: '메인트랙 2', type: 'TRACK', status: 'RUNNING', position: { x: 0, y: 200 } },
      ],
      inductions: [
        { id: 'IND-01', name: '인덕션 1', type: 'INDUCTION', status: 'RUNNING', position: { x: 100, y: 100 } },
        { id: 'IND-02', name: '인덕션 2', type: 'INDUCTION', status: 'RUNNING', position: { x: 100, y: 200 } },
      ],
      chutes: Array.from({ length: 20 }, (_, i) => ({
        id: `CHT-${String(i + 1).padStart(2, '0')}`,
        name: `슈트 ${i + 1}`,
        type: 'CHUTE' as EquipmentType,
        status: 'RUNNING' as EquipmentStatus,
        position: { x: 200 + (i % 10) * 80, y: i < 10 ? 50 : 250 },
      })),
      conveyors: [
        { id: 'CNV-01', name: '입구 컨베이어', type: 'CONVEYOR', status: 'RUNNING', position: { x: 50, y: 150 } },
        { id: 'CNV-02', name: '분류 컨베이어', type: 'CONVEYOR', status: 'RUNNING', position: { x: 400, y: 150 } },
        { id: 'CNV-03', name: '출구 컨베이어', type: 'CONVEYOR', status: 'RUNNING', position: { x: 750, y: 150 } },
      ],
    };
  }

  private initializeChuteStates(): void {
    const destinations = ['서울강북', '서울강남', '서울서부', '서울동부', '경기북부',
      '경기남부', '경기광역', '인천/강원', '충청권', '전라/경상',
      '세종', '제주', '울산', '대구', '광주',
      '대전', '부산', '특수', '반송', '미구분'];
    for (let i = 1; i <= 20; i++) {
      const capacity = 200;
      const currentCount = Math.floor(Math.random() * 180);
      const fillRate = Math.round((currentCount / capacity) * 100);
      let status: ChuteStatus = 'NORMAL';
      if (fillRate >= 100) status = 'FULL';
      else if (fillRate >= 80) status = 'NEAR_FULL';

      this.chuteStates.set(i, {
        chuteNumber: i,
        status,
        destination: destinations[i - 1],
        currentCount,
        capacity,
        fillRate,
      });
    }
  }

  private initializeCommStatuses(): void {
    this.commStatuses = [
      { equipmentId: 'PLC-01', name: 'PLC 메인', protocol: 'TCP/IP', connected: true, lastActivity: new Date().toISOString(), errorCount: 0 },
      { equipmentId: 'PLC-02', name: 'PLC 보조', protocol: 'TCP/IP', connected: true, lastActivity: new Date().toISOString(), errorCount: 0 },
      { equipmentId: 'IPS-01', name: '이미지처리장치', protocol: 'TCP/IP', connected: true, lastActivity: new Date().toISOString(), errorCount: 0 },
      { equipmentId: 'SCL-01', name: '저울', protocol: 'RS232', connected: true, lastActivity: new Date().toISOString(), errorCount: 1 },
    ];
  }

  private initializeSampleAlarms(): void {
    this.raiseAlarm('WARNING', 'CHT-15', '슈트 15', '슈트 만재 근접', '현재 적재율 85%');
    this.raiseAlarm('INFO', 'CNV-03', '출구 컨베이어', '컨베이어 속도 조정', '정상 범위 내 속도 변경');
  }

  // ============================
  // 레이아웃
  // ============================

  getLayout(): SorterLayout {
    return this.layout;
  }

  getLayoutSummary() {
    const all = [...this.layout.tracks, ...this.layout.inductions, ...this.layout.chutes, ...this.layout.conveyors];
    return {
      totalEquipment: all.length,
      running: all.filter((e) => e.status === 'RUNNING').length,
      stopped: all.filter((e) => e.status === 'STOPPED').length,
      error: all.filter((e) => e.status === 'ERROR').length,
      tracks: this.layout.tracks.length,
      inductions: this.layout.inductions.length,
      chutes: this.layout.chutes.length,
      conveyors: this.layout.conveyors.length,
    };
  }

  // ============================
  // 슈트 상태
  // ============================

  getAllChuteStates(): ChuteState[] {
    return Array.from(this.chuteStates.values());
  }

  getChuteState(chuteNumber: number): ChuteState | undefined {
    return this.chuteStates.get(chuteNumber);
  }

  updateChuteStatus(chuteNumber: number, status: ChuteStatus): boolean {
    const chute = this.chuteStates.get(chuteNumber);
    if (!chute) return false;
    chute.status = status;
    return true;
  }

  // ============================
  // 알람 관리
  // ============================

  raiseAlarm(severity: AlarmSeverity, equipmentId: string, equipmentName: string, message: string, detail: string): Alarm {
    this.alarmIdCounter++;
    const alarm: Alarm = {
      id: `ALM-${String(this.alarmIdCounter).padStart(4, '0')}`,
      severity,
      status: 'ACTIVE',
      equipmentId,
      equipmentName,
      message,
      detail,
      occurredAt: new Date().toISOString(),
    };
    this.alarms.unshift(alarm);
    for (const listener of this.alarmListeners) {
      listener(alarm);
    }
    this.logger.warn(`Alarm raised: [${severity}] ${message}`);
    return alarm;
  }

  acknowledgeAlarm(alarmId: string): boolean {
    const alarm = this.alarms.find((a) => a.id === alarmId);
    if (!alarm || alarm.status !== 'ACTIVE') return false;
    alarm.status = 'ACKNOWLEDGED';
    alarm.acknowledgedAt = new Date().toISOString();
    return true;
  }

  resolveAlarm(alarmId: string, actionNote?: string): boolean {
    const alarm = this.alarms.find((a) => a.id === alarmId);
    if (!alarm || alarm.status === 'RESOLVED') return false;
    alarm.status = 'RESOLVED';
    alarm.resolvedAt = new Date().toISOString();
    if (actionNote) alarm.actionNote = actionNote;
    for (const listener of this.alarmListeners) {
      listener(alarm);
    }
    return true;
  }

  getAlarms(status?: AlarmStatus): Alarm[] {
    if (status) return this.alarms.filter((a) => a.status === status);
    return [...this.alarms];
  }

  getActiveAlarmCount(): number {
    return this.alarms.filter((a) => a.status === 'ACTIVE').length;
  }

  // ============================
  // 통신 현황
  // ============================

  getCommStatuses(): CommStatus[] {
    return [...this.commStatuses];
  }

  getStatus() {
    return {
      layout: this.getLayoutSummary(),
      activeAlarms: this.getActiveAlarmCount(),
      totalAlarms: this.alarms.length,
      commDevices: this.commStatuses.length,
      connectedDevices: this.commStatuses.filter((c) => c.connected).length,
    };
  }

  // ============================
  // 이벤트 리스너
  // ============================

  onAlarmEvent(listener: (alarm: Alarm) => void): void {
    this.alarmListeners.push(listener);
  }

  onLayoutChange(listener: (layout: SorterLayout) => void): void {
    this.layoutListeners.push(listener);
  }
}
