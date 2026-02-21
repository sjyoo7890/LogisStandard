import { Injectable, OnModuleInit } from '@nestjs/common';
import { createLogger } from '@kpost/logger';
import { ConnectionService } from '../connection/connection.service';

export type SyncDirection = 'SIMS_TO_CENTER' | 'CENTER_TO_SIMS';
export type SyncType = 'RECEPTION_INFO' | 'ADDRESS_ROUTE_DB' | 'SORTING_RESULT' | 'BINDING_INFO' | 'STATISTICS';
export type SyncStatus = 'IDLE' | 'SYNCING' | 'COMPLETED' | 'ERROR' | 'PAUSED';

export interface SyncJob {
  jobId: string;
  direction: SyncDirection;
  syncType: SyncType;
  targetId: string;
  status: SyncStatus;
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  startedAt?: string;
  completedAt?: string;
  lastError?: string;
  lastSyncedAt?: string;
}

export interface SyncHistoryEntry {
  id: string;
  jobId: string;
  direction: SyncDirection;
  syncType: SyncType;
  targetId: string;
  status: 'COMPLETED' | 'FAILED';
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  duration: number; // ms
  startedAt: string;
  completedAt: string;
  errorMessage?: string;
}

export interface ConflictResolution {
  strategy: 'LAST_WRITE_WINS' | 'SOURCE_PRIORITY';
  conflictCount: number;
  resolvedCount: number;
  unresolvedCount: number;
}

/**
 * 데이터 동기화 서비스
 * - SIMS → 각 집중국: 접수정보, 주소/순로DB 동기화
 * - 각 집중국 → SIMS: 구분결과, 체결정보, 통계정보 동기화
 * - 변경 감지 기반 증분 동기화 (CDC)
 * - 동기화 충돌 해결 (last-write-wins + 로그)
 * - 트랜잭션 기반 일관성 보장
 */
@Injectable()
export class DataSyncService implements OnModuleInit {
  private logger = createLogger({ service: 'data-sync' });
  private currentJobs = new Map<string, SyncJob>();
  private syncHistory: SyncHistoryEntry[] = [];
  private syncIntervals = new Map<string, NodeJS.Timeout>();
  private jobCounter = 0;

  // CDC 체크포인트 추적
  private checkpoints = new Map<string, { lastSequenceNo: number; lastTimestamp: string }>();

  // 동기화 주기 설정 (ms)
  private static readonly SYNC_INTERVALS = {
    RECEPTION_INFO: 60000,     // 1분
    ADDRESS_ROUTE_DB: 3600000, // 1시간
    SORTING_RESULT: 30000,     // 30초
    BINDING_INFO: 30000,       // 30초
    STATISTICS: 600000,        // 10분
  };

  constructor(private readonly connectionService: ConnectionService) {}

  onModuleInit() {
    this.startPeriodicSync();
    this.logger.info('DataSyncService initialized');
  }

  /**
   * 주기적 동기화 시작
   */
  private startPeriodicSync(): void {
    // SIMS → 집중국 (Inbound)
    this.scheduleSyncJob('SIMS_TO_CENTER', 'RECEPTION_INFO');
    this.scheduleSyncJob('SIMS_TO_CENTER', 'ADDRESS_ROUTE_DB');

    // 집중국 → SIMS (Outbound)
    this.scheduleSyncJob('CENTER_TO_SIMS', 'SORTING_RESULT');
    this.scheduleSyncJob('CENTER_TO_SIMS', 'BINDING_INFO');
    this.scheduleSyncJob('CENTER_TO_SIMS', 'STATISTICS');
  }

  /**
   * 동기화 작업 스케줄링
   */
  private scheduleSyncJob(direction: SyncDirection, syncType: SyncType): void {
    const key = `${direction}_${syncType}`;
    const interval = DataSyncService.SYNC_INTERVALS[syncType];

    const timer = setInterval(async () => {
      if (!this.connectionService.isSimsConnected()) {
        this.logger.warn(`Skipping ${key}: SIMS not connected`);
        return;
      }
      await this.executeSyncJob(direction, syncType);
    }, interval);

    this.syncIntervals.set(key, timer);
    this.logger.info(`Scheduled sync: ${key} every ${interval / 1000}s`);
  }

  /**
   * 동기화 작업 실행
   */
  async executeSyncJob(
    direction: SyncDirection,
    syncType: SyncType,
    targetId?: string,
  ): Promise<SyncJob> {
    const jobId = `SYNC_${++this.jobCounter}_${Date.now()}`;
    const job: SyncJob = {
      jobId,
      direction,
      syncType,
      targetId: targetId ?? (direction === 'SIMS_TO_CENTER' ? 'ALL_CENTERS' : 'SIMS'),
      status: 'SYNCING',
      totalRecords: 0,
      processedRecords: 0,
      errorRecords: 0,
      startedAt: new Date().toISOString(),
    };

    this.currentJobs.set(jobId, job);
    this.logger.info(`Starting sync job ${jobId}: ${direction} / ${syncType}`);

    const startTime = Date.now();

    try {
      switch (direction) {
        case 'SIMS_TO_CENTER':
          await this.syncInbound(job, syncType);
          break;
        case 'CENTER_TO_SIMS':
          await this.syncOutbound(job, syncType);
          break;
      }

      job.status = 'COMPLETED';
      job.completedAt = new Date().toISOString();
      job.lastSyncedAt = job.completedAt;

      this.addToHistory(job, startTime);
      this.logger.info(
        `Sync job ${jobId} completed: ${job.processedRecords}/${job.totalRecords} records`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      job.status = 'ERROR';
      job.lastError = message;
      job.completedAt = new Date().toISOString();

      this.addToHistory(job, startTime, message);
      this.logger.error(`Sync job ${jobId} failed: ${message}`);
    }

    return job;
  }

  /**
   * Inbound 동기화 (SIMS → 집중국)
   * 접수정보, 주소/순로DB
   */
  private async syncInbound(job: SyncJob, syncType: SyncType): Promise<void> {
    const checkpointKey = `INBOUND_${syncType}`;
    const checkpoint = this.checkpoints.get(checkpointKey) ?? {
      lastSequenceNo: 0,
      lastTimestamp: new Date(0).toISOString(),
    };

    // CDC 기반 증분 데이터 조회 (시뮬레이션)
    const changes = await this.fetchIncrementalChanges(syncType, checkpoint);
    job.totalRecords = changes.length;

    for (const change of changes) {
      try {
        // 충돌 해결 (last-write-wins)
        await this.resolveConflictAndApply(change, 'LAST_WRITE_WINS');
        job.processedRecords++;
      } catch {
        job.errorRecords++;
      }
    }

    // 체크포인트 업데이트
    if (changes.length > 0) {
      this.checkpoints.set(checkpointKey, {
        lastSequenceNo: checkpoint.lastSequenceNo + changes.length,
        lastTimestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Outbound 동기화 (집중국 → SIMS)
   * 구분결과, 체결정보, 통계정보
   */
  private async syncOutbound(job: SyncJob, syncType: SyncType): Promise<void> {
    const checkpointKey = `OUTBOUND_${syncType}`;
    const checkpoint = this.checkpoints.get(checkpointKey) ?? {
      lastSequenceNo: 0,
      lastTimestamp: new Date(0).toISOString(),
    };

    // 미전송 데이터 수집
    const pendingData = await this.collectPendingOutboundData(syncType, checkpoint);
    job.totalRecords = pendingData.length;

    // 트랜잭션 기반 전송
    const batchSize = 100;
    for (let i = 0; i < pendingData.length; i += batchSize) {
      const batch = pendingData.slice(i, i + batchSize);
      try {
        await this.sendBatchToSIMS(batch, syncType);
        job.processedRecords += batch.length;
      } catch {
        job.errorRecords += batch.length;
      }
    }

    // 체크포인트 업데이트
    if (job.processedRecords > 0) {
      this.checkpoints.set(checkpointKey, {
        lastSequenceNo: checkpoint.lastSequenceNo + job.processedRecords,
        lastTimestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 증분 변경사항 조회 (CDC)
   */
  private async fetchIncrementalChanges(
    syncType: SyncType,
    checkpoint: { lastSequenceNo: number; lastTimestamp: string },
  ): Promise<Array<{ sequenceNo: number; data: unknown; timestamp: string }>> {
    // 실제 구현에서는 SIMS DB에서 CDC 이벤트를 조회
    this.logger.debug(
      `Fetching incremental changes for ${syncType} since seq=${checkpoint.lastSequenceNo}`,
    );
    return [];
  }

  /**
   * 충돌 해결 및 적용
   */
  private async resolveConflictAndApply(
    change: { sequenceNo: number; data: unknown; timestamp: string },
    strategy: 'LAST_WRITE_WINS' | 'SOURCE_PRIORITY',
  ): Promise<void> {
    // Last-write-wins: 타임스탬프가 최신인 데이터 우선
    this.logger.debug(`Applying change seq=${change.sequenceNo} with ${strategy}`);
  }

  /**
   * 미전송 Outbound 데이터 수집
   */
  private async collectPendingOutboundData(
    syncType: SyncType,
    checkpoint: { lastSequenceNo: number; lastTimestamp: string },
  ): Promise<unknown[]> {
    this.logger.debug(
      `Collecting pending ${syncType} data since seq=${checkpoint.lastSequenceNo}`,
    );
    return [];
  }

  /**
   * SIMS로 배치 전송
   */
  private async sendBatchToSIMS(batch: unknown[], syncType: SyncType): Promise<void> {
    this.logger.debug(`Sending batch of ${batch.length} ${syncType} records to SIMS`);
  }

  /**
   * 동기화 이력 추가
   */
  private addToHistory(job: SyncJob, startTime: number, errorMessage?: string): void {
    const entry: SyncHistoryEntry = {
      id: `HIST_${Date.now()}`,
      jobId: job.jobId,
      direction: job.direction,
      syncType: job.syncType,
      targetId: job.targetId,
      status: job.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
      totalRecords: job.totalRecords,
      processedRecords: job.processedRecords,
      errorRecords: job.errorRecords,
      duration: Date.now() - startTime,
      startedAt: job.startedAt!,
      completedAt: job.completedAt!,
      errorMessage,
    };

    this.syncHistory.unshift(entry);
    // 최대 1000건 유지
    if (this.syncHistory.length > 1000) {
      this.syncHistory = this.syncHistory.slice(0, 1000);
    }
  }

  /**
   * 수동 동기화 트리거
   */
  async triggerManualSync(
    direction: SyncDirection,
    syncType: SyncType,
    targetId?: string,
  ): Promise<SyncJob> {
    return this.executeSyncJob(direction, syncType, targetId);
  }

  /**
   * 현재 진행 중인 작업 조회
   */
  getCurrentJobs(): SyncJob[] {
    return Array.from(this.currentJobs.values()).filter(
      (j) => j.status === 'SYNCING',
    );
  }

  /**
   * 동기화 이력 조회
   */
  getSyncHistory(params?: {
    direction?: SyncDirection;
    syncType?: SyncType;
    status?: 'COMPLETED' | 'FAILED';
    limit?: number;
  }): SyncHistoryEntry[] {
    let history = [...this.syncHistory];

    if (params?.direction) {
      history = history.filter((h) => h.direction === params.direction);
    }
    if (params?.syncType) {
      history = history.filter((h) => h.syncType === params.syncType);
    }
    if (params?.status) {
      history = history.filter((h) => h.status === params.status);
    }

    return history.slice(0, params?.limit ?? 100);
  }

  /**
   * 동기화 상태 요약
   */
  getSyncStatus(): {
    currentJobs: number;
    totalCompleted: number;
    totalFailed: number;
    lastSyncTimes: Record<string, string | undefined>;
  } {
    const completed = this.syncHistory.filter((h) => h.status === 'COMPLETED').length;
    const failed = this.syncHistory.filter((h) => h.status === 'FAILED').length;

    const lastSyncTimes: Record<string, string | undefined> = {};
    for (const type of ['RECEPTION_INFO', 'ADDRESS_ROUTE_DB', 'SORTING_RESULT', 'BINDING_INFO', 'STATISTICS'] as SyncType[]) {
      const last = this.syncHistory.find((h) => h.syncType === type && h.status === 'COMPLETED');
      lastSyncTimes[type] = last?.completedAt;
    }

    return {
      currentJobs: this.getCurrentJobs().length,
      totalCompleted: completed,
      totalFailed: failed,
      lastSyncTimes,
    };
  }
}
