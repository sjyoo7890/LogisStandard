import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createLogger } from '@kpost/logger';
import { ConnectionService } from '../connection/connection.service';
import * as fs from 'fs';
import * as path from 'path';

type FallbackStatusType = 'INACTIVE' | 'ACTIVATED' | 'RECOVERING' | 'COMPLETED';

interface FallbackEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  details: string;
  csvFileName?: string;
  recordCount?: number;
}

interface PendingRecord {
  id: string;
  type: 'SORTING_RESULT' | 'BINDING_INFO';
  data: Record<string, unknown>;
  createdAt: string;
}

/**
 * SIMS 장애 대응(Fallback) 서비스
 * - SIMS 장애 감지 (HeartBeat 기반)
 * - 장애 시 CSV 파일 자동 생성 (체결정보 → Post-Net 직접 등록용)
 * - 장애 복구 후 미전송 데이터 자동 동기화
 */
@Injectable()
export class FallbackService implements OnModuleInit, OnModuleDestroy {
  private logger = createLogger({ service: 'fallback' });

  private status: FallbackStatusType = 'INACTIVE';
  private activatedAt?: string;
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private pendingRecords: PendingRecord[] = [];
  private csvFilesGenerated: string[] = [];
  private events: FallbackEvent[] = [];
  private healthCheckTimer?: NodeJS.Timeout;
  private eventCounter = 0;

  private static readonly FAILURE_THRESHOLD = 3;
  private static readonly RECOVERY_THRESHOLD = 5;
  private static readonly HEALTH_CHECK_INTERVAL_MS = 10000;
  private static readonly CSV_OUTPUT_DIR = './fallback';
  private static readonly MAX_ROWS_PER_FILE = 10000;

  constructor(private readonly connectionService: ConnectionService) {}

  onModuleInit() {
    this.startHealthCheck();
    this.ensureOutputDir();
    this.logger.info('FallbackService initialized');
  }

  onModuleDestroy() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
  }

  /**
   * 출력 디렉토리 확인/생성
   */
  private ensureOutputDir(): void {
    if (!fs.existsSync(FallbackService.CSV_OUTPUT_DIR)) {
      fs.mkdirSync(FallbackService.CSV_OUTPUT_DIR, { recursive: true });
    }
  }

  /**
   * SIMS HeartBeat 기반 상태 체크 시작
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.checkSimsHealth();
    }, FallbackService.HEALTH_CHECK_INTERVAL_MS);
  }

  /**
   * SIMS 상태 체크
   */
  private checkSimsHealth(): void {
    const simsConnected = this.connectionService.isSimsConnected();

    if (!simsConnected) {
      this.consecutiveSuccesses = 0;
      this.consecutiveFailures++;

      if (
        this.consecutiveFailures >= FallbackService.FAILURE_THRESHOLD &&
        this.status === 'INACTIVE'
      ) {
        this.activateFallback();
      }
    } else {
      this.consecutiveFailures = 0;
      this.consecutiveSuccesses++;

      if (
        this.consecutiveSuccesses >= FallbackService.RECOVERY_THRESHOLD &&
        this.status === 'ACTIVATED'
      ) {
        this.startRecovery();
      }
    }
  }

  /**
   * Fallback 활성화
   */
  private activateFallback(): void {
    this.status = 'ACTIVATED';
    this.activatedAt = new Date().toISOString();
    this.logger.warn('SIMS Fallback ACTIVATED - switching to CSV mode');

    this.addEvent('SIMS_DOWN_DETECTED', 'SIMS connection lost, fallback activated');
    this.addEvent('FALLBACK_ACTIVATED', `Fallback mode activated at ${this.activatedAt}`);
  }

  /**
   * 복구 프로세스 시작
   */
  private async startRecovery(): Promise<void> {
    this.status = 'RECOVERING';
    this.logger.info('SIMS recovery detected - starting data sync');
    this.addEvent('SIMS_RECOVERED', 'SIMS connection restored');
    this.addEvent('RECOVERY_STARTED', `Processing ${this.pendingRecords.length} pending records`);

    try {
      await this.syncPendingRecords();
      this.status = 'INACTIVE';
      this.activatedAt = undefined;
      this.consecutiveFailures = 0;
      this.addEvent('RECOVERY_COMPLETED', 'All pending records synchronized');
      this.logger.info('Fallback recovery completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.status = 'ACTIVATED';
      this.addEvent('RECOVERY_FAILED', `Recovery failed: ${message}`);
      this.logger.error(`Recovery failed: ${message}`);
    }
  }

  /**
   * 미전송 레코드를 SIMS로 전송
   */
  private async syncPendingRecords(): Promise<void> {
    const batchSize = 100;
    let processed = 0;

    while (this.pendingRecords.length > 0) {
      const batch = this.pendingRecords.splice(0, batchSize);
      // 실제 구현에서는 DataSyncService를 통해 SIMS로 전송
      processed += batch.length;
      this.addEvent(
        'RECOVERY_PROGRESS',
        `Processed ${processed} records`,
      );
    }
  }

  /**
   * Fallback 모드에서 데이터 추가 (CSV 생성용)
   */
  addPendingRecord(type: 'SORTING_RESULT' | 'BINDING_INFO', data: Record<string, unknown>): void {
    if (this.status !== 'ACTIVATED') return;

    this.pendingRecords.push({
      id: `PEND_${Date.now()}_${this.pendingRecords.length}`,
      type,
      data,
      createdAt: new Date().toISOString(),
    });

    // 임계값 도달 시 CSV 파일 자동 생성
    const typeRecords = this.pendingRecords.filter((r) => r.type === type);
    if (typeRecords.length >= FallbackService.MAX_ROWS_PER_FILE) {
      this.generateCSVFile(type);
    }
  }

  /**
   * CSV 파일 생성
   */
  generateCSVFile(type?: 'SORTING_RESULT' | 'BINDING_INFO'): string | null {
    const records = type
      ? this.pendingRecords.filter((r) => r.type === type)
      : [...this.pendingRecords];

    if (records.length === 0) return null;

    const timestamp = new Date()
      .toISOString()
      .replace(/[:\-T]/g, '')
      .slice(0, 14);
    const fileName = `fallback_${type ?? 'all'}_${timestamp}.csv`;
    const filePath = path.join(FallbackService.CSV_OUTPUT_DIR, fileName);

    // CSV 헤더 생성
    const headers = type === 'SORTING_RESULT'
      ? 'barcode,sortCode,destinationChute,result,processedAt,equipmentId,postOfficeCode'
      : 'barcode,containerNumber,destinationCode,bindingType,confirmedAt,operatorId,postOfficeCode';

    // CSV 행 생성
    const rows = records.map((r) => {
      const d = r.data;
      return Object.values(d).map((v) => `"${String(v ?? '')}"`).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');

    try {
      this.ensureOutputDir();
      fs.writeFileSync(filePath, csvContent, 'utf-8');
      this.csvFilesGenerated.push(fileName);
      this.addEvent('CSV_FILE_CREATED', `CSV file created: ${fileName}`, fileName, records.length);
      this.logger.info(`CSV file generated: ${fileName} (${records.length} records)`);

      // 생성된 레코드를 pending에서 제거
      const recordIds = new Set(records.map((r) => r.id));
      this.pendingRecords = this.pendingRecords.filter((r) => !recordIds.has(r.id));

      return filePath;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to generate CSV: ${message}`);
      return null;
    }
  }

  /**
   * 이벤트 추가
   */
  private addEvent(
    eventType: string,
    details: string,
    csvFileName?: string,
    recordCount?: number,
  ): void {
    this.events.unshift({
      eventId: `EVT_${++this.eventCounter}`,
      eventType,
      timestamp: new Date().toISOString(),
      details,
      csvFileName,
      recordCount,
    });

    // 최대 500건 유지
    if (this.events.length > 500) {
      this.events = this.events.slice(0, 500);
    }
  }

  /**
   * Fallback 상태 조회
   */
  getStatus(): {
    status: FallbackStatusType;
    activatedAt?: string;
    pendingRecords: number;
    csvFilesGenerated: number;
    lastCsvFile?: string;
    consecutiveFailures: number;
    consecutiveSuccesses: number;
  } {
    return {
      status: this.status,
      activatedAt: this.activatedAt,
      pendingRecords: this.pendingRecords.length,
      csvFilesGenerated: this.csvFilesGenerated.length,
      lastCsvFile: this.csvFilesGenerated[this.csvFilesGenerated.length - 1],
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
    };
  }

  /**
   * 미전송 레코드 목록 조회
   */
  getPendingRecords(params?: { type?: string; limit?: number }): PendingRecord[] {
    let records = [...this.pendingRecords];
    if (params?.type) {
      records = records.filter((r) => r.type === params.type);
    }
    return records.slice(0, params?.limit ?? 100);
  }

  /**
   * 이벤트 이력 조회
   */
  getEvents(limit?: number): FallbackEvent[] {
    return this.events.slice(0, limit ?? 50);
  }

  /**
   * 생성된 CSV 파일 목록
   */
  getCSVFiles(): string[] {
    return [...this.csvFilesGenerated];
  }

  /**
   * 수동 CSV 생성 트리거
   */
  triggerCSVGeneration(type?: 'SORTING_RESULT' | 'BINDING_INFO'): string | null {
    return this.generateCSVFile(type);
  }
}
