import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createLogger } from '@kpost/logger';

export interface OverviewData {
  totalProcessed: number;
  successRate: number;
  rejectRate: number;
  uptimeMinutes: number;
  activeSorters: number;
  totalSorters: number;
  activeAlarms: number;
  timestamp: string;
}

export interface SituationChuteInfo {
  chuteNumber: number;
  destination: string;
  sortedCount: number;
  status: string;
}

export interface DeliveryPointInfo {
  id: string;
  name: string;
  region: string;
  totalSorted: number;
  chuteNumbers: number[];
  lastUpdate: string;
}

export interface SituationAlarm {
  id: string;
  level: string;
  message: string;
  source: string;
  timestamp: string;
}

export type SorterRunStatus = 'RUNNING' | 'STOPPED' | 'WARMING_UP' | 'ERROR';

export interface SorterStatusInfo {
  sorterId: string;
  name: string;
  status: SorterRunStatus;
  speed: number;
  processedToday: number;
  errorCount: number;
}

@Injectable()
export class SituationControlService implements OnModuleInit, OnModuleDestroy {
  private logger = createLogger({ service: 'situation-control' });
  private startedAt = Date.now();
  private overview!: OverviewData;
  private chuteInfos: SituationChuteInfo[] = [];
  private deliveryPoints: DeliveryPointInfo[] = [];
  private alarms: SituationAlarm[] = [];
  private sorterStatuses: SorterStatusInfo[] = [];

  onModuleInit() {
    this.initializeOverview();
    this.initializeChuteInfos();
    this.initializeDeliveryPoints();
    this.initializeAlarms();
    this.initializeSorterStatuses();
    this.logger.info('SituationControlService initialized');
  }

  onModuleDestroy() {
    this.logger.info('SituationControlService destroyed');
  }

  private initializeOverview(): void {
    this.overview = {
      totalProcessed: 4850,
      successRate: 92.3,
      rejectRate: 5.1,
      uptimeMinutes: 0,
      activeSorters: 2,
      totalSorters: 2,
      activeAlarms: 2,
      timestamp: new Date().toISOString(),
    };
  }

  private initializeChuteInfos(): void {
    const destinations = [
      '서울강북', '서울강남', '서울서부', '서울동부', '경기북부',
      '경기남부', '경기광역', '인천/강원', '충청권', '전라/경상',
      '세종', '제주', '울산', '대구', '광주',
      '대전', '부산', '특수', '반송', '미구분',
    ];
    for (let i = 1; i <= 20; i++) {
      this.chuteInfos.push({
        chuteNumber: i,
        destination: destinations[i - 1],
        sortedCount: Math.floor(Math.random() * 300) + 50,
        status: i <= 17 ? 'NORMAL' : (i === 18 ? 'NEAR_FULL' : 'NORMAL'),
      });
    }
  }

  private initializeDeliveryPoints(): void {
    const points = [
      { id: 'DP-001', name: '서울중앙우체국', region: '서울', chutes: [1, 2, 3, 4] },
      { id: 'DP-002', name: '강남우체국', region: '서울', chutes: [2] },
      { id: 'DP-003', name: '영등포우체국', region: '서울', chutes: [3] },
      { id: 'DP-004', name: '부산중앙우체국', region: '부산', chutes: [17] },
      { id: 'DP-005', name: '대전중앙우체국', region: '대전', chutes: [16] },
    ];
    for (const p of points) {
      this.deliveryPoints.push({
        id: p.id,
        name: p.name,
        region: p.region,
        totalSorted: Math.floor(Math.random() * 500) + 100,
        chuteNumbers: p.chutes,
        lastUpdate: new Date().toISOString(),
      });
    }
  }

  private initializeAlarms(): void {
    this.alarms = [
      { id: 'SA-001', level: 'WARNING', message: '슈트 15 만재 근접 (85%)', source: 'CHT-15', timestamp: new Date().toISOString() },
      { id: 'SA-002', level: 'INFO', message: '출구 컨베이어 속도 조정', source: 'CNV-03', timestamp: new Date().toISOString() },
    ];
  }

  private initializeSorterStatuses(): void {
    this.sorterStatuses = [
      { sorterId: 'SORTER-01', name: '1호기', status: 'RUNNING', speed: 12000, processedToday: 2500, errorCount: 1 },
      { sorterId: 'SORTER-02', name: '2호기', status: 'RUNNING', speed: 11500, processedToday: 2350, errorCount: 0 },
    ];
  }

  // ============================
  // 조회 API
  // ============================

  getOverview(): OverviewData {
    this.overview.uptimeMinutes = Math.floor((Date.now() - this.startedAt) / 60000);
    this.overview.timestamp = new Date().toISOString();
    return { ...this.overview };
  }

  getChuteInfos(): SituationChuteInfo[] {
    return [...this.chuteInfos];
  }

  getDeliveryPoints(): DeliveryPointInfo[] {
    return [...this.deliveryPoints];
  }

  getAlarms(): SituationAlarm[] {
    return [...this.alarms];
  }

  getSorterStatuses(): SorterStatusInfo[] {
    return [...this.sorterStatuses];
  }

  getStatus() {
    return {
      overview: this.getOverview(),
      totalChutes: this.chuteInfos.length,
      deliveryPoints: this.deliveryPoints.length,
      activeAlarms: this.alarms.length,
      sorters: this.sorterStatuses.length,
    };
  }
}
