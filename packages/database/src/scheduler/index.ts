import Bull, { Queue, Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import { BatchReportProcessor } from './batch-report.processor';
import { BatchDeleteProcessor } from './batch-delete.processor';
import { BackupProcessor } from './backup.processor';

export type BatchJobType =
  | 'LOCAL_SUMMARY_STATS'
  | 'LOCAL_INDUCTION_STATS'
  | 'LOCAL_CHUTE_STATS'
  | 'LOCAL_CODE_STATS'
  | 'LOCAL_SORTER_STATS'
  | 'SIMS_SUMMARY_STATS'
  | 'SIMS_CHUTE_STATS'
  | 'SIMS_CODE_STATS'
  | 'SIMS_SORTER_STATS'
  | 'DELETE_LOCAL_STATS'
  | 'DELETE_MACHINE_STATE'
  | 'DELETE_SORT_DATA'
  | 'DELETE_SIMS_STATS'
  | 'DELETE_REGI_INFO'
  | 'DELETE_SORT_RESULT'
  | 'BACKUP_DATABASE';

export interface SchedulerConfig {
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  enabled?: boolean;
}

/**
 * 데이터 생명주기 스케줄러
 *
 * BATCH_REPORT: 매일 10분마다 (Local), 30분마다 (SIMS)
 * BATCH_DELETE: 매일 오후 12시 15분
 * BACKUP: 매주 일요일 오전 11시 30분
 */
export class DataLifecycleScheduler {
  private reportQueue: Queue;
  private deleteQueue: Queue;
  private backupQueue: Queue;
  private prisma: PrismaClient;
  private reportProcessor: BatchReportProcessor;
  private deleteProcessor: BatchDeleteProcessor;
  private backupProcessor: BackupProcessor;

  constructor(prisma: PrismaClient, config: SchedulerConfig) {
    this.prisma = prisma;

    const redisConfig = {
      host: config.redisHost,
      port: config.redisPort,
      password: config.redisPassword,
    };

    // Bull Queue 생성
    this.reportQueue = new Bull('batch-report', { redis: redisConfig });
    this.deleteQueue = new Bull('batch-delete', { redis: redisConfig });
    this.backupQueue = new Bull('batch-backup', { redis: redisConfig });

    // Processor 초기화
    this.reportProcessor = new BatchReportProcessor(prisma);
    this.deleteProcessor = new BatchDeleteProcessor(prisma);
    this.backupProcessor = new BackupProcessor(prisma);
  }

  /**
   * 스케줄러 시작 - 모든 반복 작업 등록
   */
  async start(): Promise<void> {
    // 기존 반복 작업 정리
    await this.clearExistingJobs();

    // Processor 등록
    this.registerProcessors();

    // BATCH_REPORT 작업 등록 (매 10분)
    await this.scheduleReportJobs();

    // BATCH_DELETE 작업 등록 (매일 12:15)
    await this.scheduleDeleteJobs();

    // BACKUP 작업 등록 (매주 일요일 11:30)
    await this.scheduleBackupJob();

    console.log('[DataLifecycleScheduler] All scheduled jobs registered');
  }

  /**
   * 스케줄러 중지
   */
  async stop(): Promise<void> {
    await this.reportQueue.close();
    await this.deleteQueue.close();
    await this.backupQueue.close();
    console.log('[DataLifecycleScheduler] Scheduler stopped');
  }

  /**
   * 기존 반복 작업 정리
   */
  private async clearExistingJobs(): Promise<void> {
    const reportRepeatables = await this.reportQueue.getRepeatableJobs();
    for (const job of reportRepeatables) {
      await this.reportQueue.removeRepeatableByKey(job.key);
    }
    const deleteRepeatables = await this.deleteQueue.getRepeatableJobs();
    for (const job of deleteRepeatables) {
      await this.deleteQueue.removeRepeatableByKey(job.key);
    }
    const backupRepeatables = await this.backupQueue.getRepeatableJobs();
    for (const job of backupRepeatables) {
      await this.backupQueue.removeRepeatableByKey(job.key);
    }
  }

  /**
   * Processor 등록
   */
  private registerProcessors(): void {
    // BATCH_REPORT Processors
    this.reportQueue.process('LOCAL_SUMMARY_STATS', (job: Job) =>
      this.reportProcessor.processLocalSummaryStats(job)
    );
    this.reportQueue.process('LOCAL_INDUCTION_STATS', (job: Job) =>
      this.reportProcessor.processLocalInductionStats(job)
    );
    this.reportQueue.process('LOCAL_CHUTE_STATS', (job: Job) =>
      this.reportProcessor.processLocalChuteStats(job)
    );
    this.reportQueue.process('LOCAL_CODE_STATS', (job: Job) =>
      this.reportProcessor.processLocalCodeStats(job)
    );
    this.reportQueue.process('LOCAL_SORTER_STATS', (job: Job) =>
      this.reportProcessor.processLocalSorterStats(job)
    );
    this.reportQueue.process('SIMS_SUMMARY_STATS', (job: Job) =>
      this.reportProcessor.processSimsSummaryStats(job)
    );
    this.reportQueue.process('SIMS_CHUTE_STATS', (job: Job) =>
      this.reportProcessor.processSimsChuteStats(job)
    );
    this.reportQueue.process('SIMS_CODE_STATS', (job: Job) =>
      this.reportProcessor.processSimsCodeStats(job)
    );
    this.reportQueue.process('SIMS_SORTER_STATS', (job: Job) =>
      this.reportProcessor.processSimsSorterStats(job)
    );

    // BATCH_DELETE Processors
    this.deleteQueue.process('DELETE_LOCAL_STATS', (job: Job) =>
      this.deleteProcessor.deleteLocalStats(job)
    );
    this.deleteQueue.process('DELETE_MACHINE_STATE', (job: Job) =>
      this.deleteProcessor.deleteMachineState(job)
    );
    this.deleteQueue.process('DELETE_SORT_DATA', (job: Job) =>
      this.deleteProcessor.deleteSortData(job)
    );
    this.deleteQueue.process('DELETE_SIMS_STATS', (job: Job) =>
      this.deleteProcessor.deleteSimsStats(job)
    );
    this.deleteQueue.process('DELETE_REGI_INFO', (job: Job) =>
      this.deleteProcessor.deleteRegiInfo(job)
    );
    this.deleteQueue.process('DELETE_SORT_RESULT', (job: Job) =>
      this.deleteProcessor.deleteSortResult(job)
    );

    // BACKUP Processor
    this.backupQueue.process('BACKUP_DATABASE', (job: Job) =>
      this.backupProcessor.backupDatabase(job)
    );

    // 에러 핸들링
    for (const queue of [this.reportQueue, this.deleteQueue, this.backupQueue]) {
      queue.on('failed', (job: Job, err: Error) => {
        console.error(`[Scheduler] Job ${job.name} failed:`, err.message);
      });
      queue.on('completed', (job: Job) => {
        console.log(`[Scheduler] Job ${job.name} completed`);
      });
    }
  }

  /**
   * BATCH_REPORT 작업 스케줄링
   * - Local 통계: 매 10분
   * - SIMS 통계: 매 30분
   */
  private async scheduleReportJobs(): Promise<void> {
    const every10Min = { repeat: { cron: '*/10 * * * *' } };
    const every30Min = { repeat: { cron: '*/30 * * * *' } };

    // Local 통계 (매 10분)
    await this.reportQueue.add('LOCAL_SUMMARY_STATS', {}, every10Min);
    await this.reportQueue.add('LOCAL_INDUCTION_STATS', {}, every10Min);
    await this.reportQueue.add('LOCAL_CHUTE_STATS', {}, every10Min);
    await this.reportQueue.add('LOCAL_CODE_STATS', {}, every10Min);
    await this.reportQueue.add('LOCAL_SORTER_STATS', {}, every10Min);

    // SIMS 통계 (매 30분)
    await this.reportQueue.add('SIMS_SUMMARY_STATS', {}, every30Min);
    await this.reportQueue.add('SIMS_CHUTE_STATS', {}, every30Min);
    await this.reportQueue.add('SIMS_CODE_STATS', {}, every30Min);
    await this.reportQueue.add('SIMS_SORTER_STATS', {}, every30Min);

    console.log('[Scheduler] BATCH_REPORT jobs scheduled (Local: 10min, SIMS: 30min)');
  }

  /**
   * BATCH_DELETE 작업 스케줄링
   * - 매일 오후 12시 15분
   */
  private async scheduleDeleteJobs(): Promise<void> {
    const dailyAt1215 = { repeat: { cron: '15 12 * * *' } };

    await this.deleteQueue.add('DELETE_LOCAL_STATS', { retentionDays: 60 }, dailyAt1215);
    await this.deleteQueue.add('DELETE_MACHINE_STATE', { retentionDays: 60 }, dailyAt1215);
    await this.deleteQueue.add('DELETE_SORT_DATA', { retentionDays: 60 }, dailyAt1215);
    await this.deleteQueue.add('DELETE_SIMS_STATS', { retentionDays: 3 }, dailyAt1215);
    await this.deleteQueue.add('DELETE_REGI_INFO', { retentionDays: 7 }, dailyAt1215);
    await this.deleteQueue.add('DELETE_SORT_RESULT', { retentionDays: 14 }, dailyAt1215);

    console.log('[Scheduler] BATCH_DELETE jobs scheduled (daily 12:15)');
  }

  /**
   * 백업 작업 스케줄링
   * - 매주 일요일 오전 11시 30분
   */
  private async scheduleBackupJob(): Promise<void> {
    await this.backupQueue.add(
      'BACKUP_DATABASE',
      {},
      { repeat: { cron: '30 11 * * 0' } } // 0 = Sunday
    );

    console.log('[Scheduler] BACKUP job scheduled (Sunday 11:30)');
  }

  /**
   * 큐 상태 조회
   */
  async getStatus(): Promise<{
    report: { waiting: number; active: number; completed: number; failed: number };
    delete: { waiting: number; active: number; completed: number; failed: number };
    backup: { waiting: number; active: number; completed: number; failed: number };
  }> {
    const getQueueStatus = async (queue: Queue) => ({
      waiting: await queue.getWaitingCount(),
      active: await queue.getActiveCount(),
      completed: await queue.getCompletedCount(),
      failed: await queue.getFailedCount(),
    });

    return {
      report: await getQueueStatus(this.reportQueue),
      delete: await getQueueStatus(this.deleteQueue),
      backup: await getQueueStatus(this.backupQueue),
    };
  }
}
