import { Injectable } from '@nestjs/common';
import { createLogger } from '@kpost/logger';
import { PLCConnectionService } from '../plc-connection/plc-connection.service';
import { EquipmentMonitorService } from '../equipment-monitor/equipment-monitor.service';

export type InspectionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface InspectionItem {
  id: string;
  name: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'PENDING';
  detail: string;
  checkedAt?: string;
}

export interface InspectionReport {
  reportId: string;
  type: 'RELAY_BYPASS' | 'HW_CHECK' | 'FULL_INSPECTION';
  status: InspectionStatus;
  startedAt: string;
  completedAt?: string;
  items: InspectionItem[];
  passed: number;
  failed: number;
  summary: string;
}

/**
 * 유지보수 서비스
 * - 중계기 제거 후 배장비의 상위시스템 SW 연결 테스트
 * - H/W 장비 정상작동 여부 확인
 * - 유지보수 검사 기능
 */
@Injectable()
export class MaintenanceService {
  private logger = createLogger({ service: 'maintenance' });
  private reports = new Map<string, InspectionReport>();
  private reportCounter = 0;

  constructor(
    private readonly plcService: PLCConnectionService,
    private readonly eqService: EquipmentMonitorService,
  ) {}

  /**
   * 중계기 우회(bypass) 검사
   * 중계기 제거 후 상위시스템 SW가 직접 H/W 장비와 통신 가능한지 확인
   */
  async runRelayBypassInspection(): Promise<InspectionReport> {
    return this.runInspection('RELAY_BYPASS', [
      { name: 'PLC 채널 해제', category: '연결', detail: '중계기의 PLC 연결 정상 해제 확인' },
      { name: '상위SW 직접 연결', category: '연결', detail: '상위SW → PLC 직접 TCP 연결 가능 확인' },
      { name: 'HeartBeat 통신', category: '통신', detail: '상위SW-PLC 간 HeartBeat 정상 확인' },
      { name: '전문 송수신', category: '통신', detail: '상위SW-PLC 간 전문 송수신 정상 확인' },
      { name: '구분 동작', category: '동작', detail: '우편물 투입-구분-배출 전체 사이클 정상' },
    ]);
  }

  /**
   * H/W 장비 점검
   */
  async runHWCheck(): Promise<InspectionReport> {
    const equipment = this.eqService.getAllEquipment();
    const items: Array<Pick<InspectionItem, 'name' | 'category' | 'detail'>> = [
      { name: '구분기 모터', category: '기구부', detail: '메인 구분기 모터 정상 동작' },
      { name: '인덕션 모터', category: '기구부', detail: '인덕션 컨베이어 모터 정상 동작' },
      { name: '슈트 동작', category: '기구부', detail: '전체 슈트 개폐 정상 동작' },
      { name: 'IPS 바코드리더', category: '센서', detail: 'IPS 바코드 판독 정상 동작' },
      { name: 'OCR 인식기', category: '센서', detail: 'OCR 주소 인식 정상 동작' },
      { name: 'PLC 통신', category: '통신', detail: 'PLC 전문 통신 정상' },
      { name: '컨베이어 속도', category: '기구부', detail: '컨베이어 속도 설정값 일치' },
      { name: '비상정지', category: '안전', detail: '비상정지 버튼 정상 동작' },
    ];

    // 장비 상태 기반으로 추가 점검 항목
    for (const eq of equipment) {
      if (eq.type === 'CONVEYOR') {
        items.push({ name: `${eq.name} 점검`, category: '컨베이어', detail: `${eq.name} 동작 상태 확인` });
      }
    }

    return this.runInspection('HW_CHECK', items);
  }

  /**
   * 전체 검사
   */
  async runFullInspection(): Promise<InspectionReport> {
    const items: Array<Pick<InspectionItem, 'name' | 'category' | 'detail'>> = [
      // 통신
      { name: 'TCP 포트 연결 (7개)', category: '통신', detail: '7개 PLC 통신 포트 전체 연결 확인' },
      { name: 'HeartBeat 주기', category: '통신', detail: '5초 주기 HeartBeat 정상 송수신' },
      { name: '전문 라운드트립', category: '통신', detail: '전문 송신→수신 라운드트립 시간 확인' },
      // 장비
      { name: '구분기 가동', category: '장비', detail: '구분기 START/STOP 명령 정상 동작' },
      { name: '인덕션 모드', category: '장비', detail: '자동/타건 모드 전환 정상' },
      { name: '슈트 만재 감지', category: '장비', detail: '슈트 만재 센서 정상 동작' },
      { name: '오버플로 설정', category: '장비', detail: '오버플로 슈트 설정 정상 적용' },
      // 센서
      { name: 'IPS 판독률', category: '센서', detail: 'IPS 바코드 판독률 95% 이상' },
      { name: 'OCR 인식률', category: '센서', detail: 'OCR 주소 인식률 80% 이상' },
      // 프로토콜
      { name: '전문 헤더 검증', category: '프로토콜', detail: '12바이트 헤더 구조 준수 확인' },
      { name: '전문 번호 매핑', category: '프로토콜', detail: '20개 전문 올바른 포트 매핑' },
      { name: 'PID 범위', category: '프로토콜', detail: '인덕션별 PID 범위 정상 순환' },
    ];

    return this.runInspection('FULL_INSPECTION', items);
  }

  private async runInspection(type: InspectionReport['type'], items: Array<Pick<InspectionItem, 'name' | 'category' | 'detail'>>): Promise<InspectionReport> {
    const reportId = `MAINT_${++this.reportCounter}_${Date.now()}`;
    const report: InspectionReport = {
      reportId,
      type,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      items: [],
      passed: 0,
      failed: 0,
      summary: '',
    };

    this.reports.set(reportId, report);
    this.logger.info(`Maintenance inspection started: ${type} (${reportId})`);

    for (let i = 0; i < items.length; i++) {
      const passed = Math.random() > 0.08; // 92% pass rate simulation
      const item: InspectionItem = {
        id: `INSP_${i + 1}`,
        name: items[i].name,
        category: items[i].category,
        status: passed ? 'PASS' : 'FAIL',
        detail: items[i].detail,
        checkedAt: new Date().toISOString(),
      };
      report.items.push(item);
      if (passed) report.passed++;
      else report.failed++;
    }

    report.status = report.failed > 0 ? 'FAILED' : 'COMPLETED';
    report.completedAt = new Date().toISOString();
    report.summary = `${report.passed}/${report.items.length} 항목 통과 (${report.failed}건 실패)`;
    this.logger.info(`Inspection completed: ${type} - ${report.summary}`);
    return report;
  }

  getReport(reportId: string): InspectionReport | undefined {
    return this.reports.get(reportId);
  }

  getAllReports(): InspectionReport[] {
    return Array.from(this.reports.values()).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }
}
