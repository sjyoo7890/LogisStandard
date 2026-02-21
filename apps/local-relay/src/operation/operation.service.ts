import { Injectable } from '@nestjs/common';
import { createLogger } from '@kpost/logger';
import { PLCConnectionService } from '../plc-connection/plc-connection.service';
import { SimulatorService } from '../simulator/simulator.service';
import { EquipmentMonitorService } from '../equipment-monitor/equipment-monitor.service';

export type OperationMode = 'SIMULATOR' | 'OPERATION' | 'SWITCHING';

export interface ModeHistory {
  from: OperationMode;
  to: OperationMode;
  switchedAt: string;
  switchedBy: string;
  reason: string;
  safetyCheckPassed: boolean;
}

export interface SafetyCheckResult {
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
  timestamp: string;
}

/**
 * 운영 모드 서비스
 * - 시뮬레이터 모드 ↔ 운영 모드 전환
 * - 운영 모드에서 실제 H/W 장비와 통신
 * - 모드 전환 시 안전 검증 절차
 */
@Injectable()
export class OperationService {
  private logger = createLogger({ service: 'operation' });
  private currentMode: OperationMode = 'SIMULATOR';
  private modeHistory: ModeHistory[] = [];

  constructor(
    private readonly plcService: PLCConnectionService,
    private readonly simService: SimulatorService,
    private readonly eqService: EquipmentMonitorService,
  ) {}

  /**
   * 모드 전환
   */
  async switchMode(targetMode: OperationMode, switchedBy: string, reason: string): Promise<{ success: boolean; safetyCheck: SafetyCheckResult; error?: string }> {
    if (this.currentMode === targetMode) {
      return { success: false, safetyCheck: this.createEmptySafetyCheck(), error: `Already in ${targetMode} mode` };
    }

    if (this.currentMode === 'SWITCHING') {
      return { success: false, safetyCheck: this.createEmptySafetyCheck(), error: 'Mode switch already in progress' };
    }

    // 안전 검증
    const safetyCheck = this.performSafetyCheck(targetMode);
    if (!safetyCheck.passed) {
      this.logger.warn(`Mode switch to ${targetMode} blocked: safety check failed`);
      return { success: false, safetyCheck, error: 'Safety check failed' };
    }

    const prevMode = this.currentMode;
    this.currentMode = 'SWITCHING';
    this.logger.info(`Switching mode: ${prevMode} → ${targetMode}`);

    try {
      if (targetMode === 'OPERATION') {
        // 시뮬레이터 정지 → PLC 연결
        this.simService.stop();
        this.plcService.connectAll();
      } else {
        // PLC 연결 해제 → 시뮬레이터 모드
        this.plcService.disconnectAll();
      }

      this.currentMode = targetMode;
      this.modeHistory.unshift({
        from: prevMode,
        to: targetMode,
        switchedAt: new Date().toISOString(),
        switchedBy,
        reason,
        safetyCheckPassed: true,
      });

      this.logger.info(`Mode switched to ${targetMode} successfully`);
      return { success: true, safetyCheck };
    } catch (error) {
      this.currentMode = prevMode;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Mode switch failed: ${msg}`);
      return { success: false, safetyCheck, error: msg };
    }
  }

  /**
   * 안전 검증 절차
   */
  private performSafetyCheck(targetMode: OperationMode): SafetyCheckResult {
    const checks: Array<{ name: string; passed: boolean; detail: string }> = [];

    // 1. 활성 알람 확인
    const activeAlarms = this.eqService.getActiveAlarms();
    const criticalAlarms = activeAlarms.filter((a) => a.severity === 'CRITICAL');
    checks.push({
      name: '치명적 알람 없음',
      passed: criticalAlarms.length === 0,
      detail: criticalAlarms.length > 0 ? `${criticalAlarms.length}건의 치명적 알람 활성` : '정상',
    });

    // 2. 시뮬레이터 정지 확인 (운영 모드 전환 시)
    if (targetMode === 'OPERATION') {
      checks.push({
        name: '시뮬레이터 정지 가능',
        passed: true,
        detail: this.simService.isRunning() ? '시뮬레이터 정지 예정' : '시뮬레이터 미실행',
      });
    }

    // 3. 장비 상태 확인
    const errorEquipment = this.eqService.getAllEquipment().filter((e) => e.status === 'ERROR');
    checks.push({
      name: '장비 에러 없음',
      passed: errorEquipment.length === 0,
      detail: errorEquipment.length > 0 ? `${errorEquipment.length}대 에러 상태` : '정상',
    });

    // 4. PLC 채널 확인 (운영 모드 시)
    if (targetMode === 'OPERATION') {
      checks.push({
        name: 'PLC 채널 초기화',
        passed: this.plcService.getAllChannels().length > 0,
        detail: `${this.plcService.getAllChannels().length}개 채널 준비됨`,
      });
    }

    const allPassed = checks.every((c) => c.passed);
    return { passed: allPassed, checks, timestamp: new Date().toISOString() };
  }

  private createEmptySafetyCheck(): SafetyCheckResult {
    return { passed: false, checks: [], timestamp: new Date().toISOString() };
  }

  getCurrentMode(): OperationMode {
    return this.currentMode;
  }

  getModeHistory(): ModeHistory[] {
    return this.modeHistory;
  }

  getStatus(): { mode: OperationMode; plcConnected: number; simulatorRunning: boolean; activeAlarms: number } {
    return {
      mode: this.currentMode,
      plcConnected: this.plcService.getConnectedCount(),
      simulatorRunning: this.simService.isRunning(),
      activeAlarms: this.eqService.getActiveAlarms().length,
    };
  }
}
