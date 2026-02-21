import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createLogger } from '@kpost/logger';

export type SyncSystem = 'SIMS' | 'KPLAS';
export type SyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';

export interface SyncJob {
  id: string;
  system: SyncSystem;
  status: SyncStatus;
  startedAt: string;
  completedAt?: string;
  recordsSynced: number;
  error?: string;
}

export interface SortingDataRecord {
  id: string;
  zipCode: string;
  destination: string;
  chuteNumber: number;
  regionCode: string;
  deliveryPoint: string;
  updatedAt: string;
}

export interface SchedulerState {
  simsInterval: number;
  kplasInterval: number;
  simsEnabled: boolean;
  kplasEnabled: boolean;
  lastSimsSync?: string;
  lastKplasSync?: string;
  nextSimsSync?: string;
  nextKplasSync?: string;
}

@Injectable()
export class InfoLinkService implements OnModuleInit, OnModuleDestroy {
  private logger = createLogger({ service: 'info-link' });
  private syncJobs: SyncJob[] = [];
  private sortingData = new Map<string, SortingDataRecord>();
  private scheduler: SchedulerState = {
    simsInterval: 600000,
    kplasInterval: 1800000,
    simsEnabled: true,
    kplasEnabled: true,
  };
  private syncListeners: Array<(job: SyncJob) => void> = [];

  private static readonly REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원'];
  private static readonly DELIVERY_POINTS = ['서울중앙', '강남', '영등포', '부산중앙', '대전중앙'];

  onModuleInit() {
    this.initializeSortingData();
    this.updateSchedulerTimes();
    this.logger.info('InfoLinkService initialized with 20 sorting data records');
  }

  onModuleDestroy() {
    this.logger.info('InfoLinkService destroyed');
  }

  private initializeSortingData(): void {
    const baseZips = [
      '01000', '02000', '03000', '04000', '05000',
      '06000', '07000', '08000', '10000', '11000',
      '12000', '13000', '14000', '15000', '16000',
      '20000', '21000', '30000', '31000', '40000',
    ];
    for (let i = 0; i < 20; i++) {
      const zip = baseZips[i];
      const record: SortingDataRecord = {
        id: `SD-${String(i + 1).padStart(4, '0')}`,
        zipCode: zip,
        destination: `${InfoLinkService.REGIONS[i % 10]}지역`,
        chuteNumber: (i % 20) + 1,
        regionCode: `R${String((i % 10) + 1).padStart(2, '0')}`,
        deliveryPoint: InfoLinkService.DELIVERY_POINTS[i % 5],
        updatedAt: new Date().toISOString(),
      };
      this.sortingData.set(zip, record);
    }
  }

  private updateSchedulerTimes(): void {
    const now = Date.now();
    this.scheduler.nextSimsSync = new Date(now + this.scheduler.simsInterval).toISOString();
    this.scheduler.nextKplasSync = new Date(now + this.scheduler.kplasInterval).toISOString();
  }

  sync(system: SyncSystem): SyncJob {
    const job: SyncJob = {
      id: `SYNC-${Date.now()}`,
      system,
      status: 'SYNCING',
      startedAt: new Date().toISOString(),
      recordsSynced: 0,
    };
    this.syncJobs.unshift(job);

    // 시뮬레이션: 즉시 완료 처리
    const syncCount = system === 'SIMS' ? 150 : 80;
    job.status = 'SUCCESS';
    job.completedAt = new Date().toISOString();
    job.recordsSynced = syncCount;

    if (system === 'SIMS') {
      this.scheduler.lastSimsSync = job.completedAt;
    } else {
      this.scheduler.lastKplasSync = job.completedAt;
    }
    this.updateSchedulerTimes();

    for (const listener of this.syncListeners) {
      listener(job);
    }
    this.logger.info(`${system} sync completed: ${syncCount} records`);
    return job;
  }

  getSyncHistory(limit = 20): SyncJob[] {
    return this.syncJobs.slice(0, limit);
  }

  getAllData(): SortingDataRecord[] {
    return Array.from(this.sortingData.values());
  }

  getDataByZipCode(zipCode: string): SortingDataRecord | undefined {
    return this.sortingData.get(zipCode);
  }

  lookupDestination(zipCode: string): { found: boolean; destination?: string; chuteNumber?: number; deliveryPoint?: string } {
    const record = this.sortingData.get(zipCode);
    if (!record) {
      // 매칭되는 데이터가 없으면 앞 3자리로 검색
      const prefix = zipCode.substring(0, 3);
      for (const [key, value] of this.sortingData.entries()) {
        if (key.startsWith(prefix)) {
          return { found: true, destination: value.destination, chuteNumber: value.chuteNumber, deliveryPoint: value.deliveryPoint };
        }
      }
      return { found: false };
    }
    return { found: true, destination: record.destination, chuteNumber: record.chuteNumber, deliveryPoint: record.deliveryPoint };
  }

  getScheduler(): SchedulerState {
    return { ...this.scheduler };
  }

  getStatus() {
    return {
      totalRecords: this.sortingData.size,
      syncJobsCompleted: this.syncJobs.filter((j) => j.status === 'SUCCESS').length,
      lastSync: this.syncJobs[0]?.completedAt || null,
      scheduler: this.getScheduler(),
    };
  }

  onSyncEvent(listener: (job: SyncJob) => void): void {
    this.syncListeners.push(listener);
  }
}
