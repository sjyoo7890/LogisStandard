import { Injectable } from '@nestjs/common';
import { createLogger } from '@kpost/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export type FileType = 'ADDRESS_DB' | 'MLF' | 'SORTING_PLAN';

export type TransferStatus =
  | 'PENDING'
  | 'TRANSFERRING'
  | 'COMPLETED'
  | 'FAILED'
  | 'VALIDATING';

export interface TransferRecord {
  transferId: string;
  fileName: string;
  fileType: FileType;
  direction: 'UPLOAD' | 'DOWNLOAD';
  targetId: string;
  status: TransferStatus;
  fileSize: number;
  transferredBytes: number;
  checksum?: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  lastRetryError?: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * FTP 파일 전송 서비스
 * - KPLAS → 소형통상구분기: 배달점주소DB, MLF파일 전송
 * - 구분계획 파일 배포
 * - 파일 전송 상태 추적 및 재전송
 */
@Injectable()
export class FtpService {
  private logger = createLogger({ service: 'ftp' });
  private transfers = new Map<string, TransferRecord>();
  private transferHistory: TransferRecord[] = [];
  private transferCounter = 0;

  private static readonly MAX_RETRIES = 3;
  private static readonly STAGING_DIR = './ftp-staging';

  /**
   * 배달점주소DB 파일 배포
   */
  async distributeAddressDB(
    sourceFilePath: string,
    targetCenterIds: string[],
  ): Promise<TransferRecord[]> {
    this.logger.info(`Distributing Address DB to ${targetCenterIds.length} centers`);
    const results: TransferRecord[] = [];

    for (const centerId of targetCenterIds) {
      const record = await this.transferFile(
        sourceFilePath,
        'ADDRESS_DB',
        'UPLOAD',
        centerId,
      );
      results.push(record);
    }

    return results;
  }

  /**
   * MLF 파일 배포
   */
  async distributeMLFFile(
    sourceFilePath: string,
    targetCenterIds: string[],
  ): Promise<TransferRecord[]> {
    this.logger.info(`Distributing MLF file to ${targetCenterIds.length} centers`);
    const results: TransferRecord[] = [];

    for (const centerId of targetCenterIds) {
      const record = await this.transferFile(
        sourceFilePath,
        'MLF',
        'UPLOAD',
        centerId,
      );
      results.push(record);
    }

    return results;
  }

  /**
   * 구분계획 파일 배포
   */
  async distributeSortingPlan(
    sourceFilePath: string,
    targetCenterIds: string[],
  ): Promise<TransferRecord[]> {
    this.logger.info(`Distributing sorting plan to ${targetCenterIds.length} centers`);
    const results: TransferRecord[] = [];

    for (const centerId of targetCenterIds) {
      const record = await this.transferFile(
        sourceFilePath,
        'SORTING_PLAN',
        'UPLOAD',
        centerId,
      );
      results.push(record);
    }

    return results;
  }

  /**
   * 파일 전송 실행
   */
  private async transferFile(
    filePath: string,
    fileType: FileType,
    direction: 'UPLOAD' | 'DOWNLOAD',
    targetId: string,
  ): Promise<TransferRecord> {
    const transferId = `FTP_${++this.transferCounter}_${Date.now()}`;
    const fileName = path.basename(filePath);

    let fileSize = 0;
    try {
      const stat = fs.statSync(filePath);
      fileSize = stat.size;
    } catch {
      // 파일이 없을 경우 시뮬레이션
      fileSize = 0;
    }

    const record: TransferRecord = {
      transferId,
      fileName,
      fileType,
      direction,
      targetId,
      status: 'PENDING',
      fileSize,
      transferredBytes: 0,
      retryCount: 0,
      maxRetries: FtpService.MAX_RETRIES,
    };

    this.transfers.set(transferId, record);
    this.logger.info(`File transfer ${transferId}: ${fileName} → ${targetId}`);

    await this.executeTransfer(record, filePath);
    return record;
  }

  /**
   * 전송 실행 (재전송 로직 포함)
   */
  private async executeTransfer(
    record: TransferRecord,
    filePath: string,
  ): Promise<void> {
    while (record.retryCount <= record.maxRetries) {
      try {
        record.status = 'TRANSFERRING';
        record.startedAt = new Date().toISOString();

        // 파일 체크섬 계산
        record.checksum = await this.calculateChecksum(filePath);

        // FTP 전송 시뮬레이션
        await this.performFtpUpload(record, filePath);

        // 전송 후 검증
        record.status = 'VALIDATING';
        const valid = await this.validateTransfer(record);

        if (valid) {
          record.status = 'COMPLETED';
          record.transferredBytes = record.fileSize;
          record.completedAt = new Date().toISOString();
          this.logger.info(`Transfer ${record.transferId} completed successfully`);
          this.archiveTransfer(record);
          return;
        }

        throw new Error('Checksum validation failed');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        record.retryCount++;
        record.lastRetryError = message;
        this.logger.warn(
          `Transfer ${record.transferId} failed (attempt ${record.retryCount}): ${message}`,
        );

        if (record.retryCount > record.maxRetries) {
          record.status = 'FAILED';
          record.errorMessage = message;
          record.completedAt = new Date().toISOString();
          this.logger.error(`Transfer ${record.transferId} permanently failed`);
          this.archiveTransfer(record);
          return;
        }

        // 재시도 대기
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * record.retryCount),
        );
      }
    }
  }

  /**
   * FTP 업로드 수행
   */
  private async performFtpUpload(
    record: TransferRecord,
    _filePath: string,
  ): Promise<void> {
    // 실제 구현에서는 FTP 클라이언트를 사용
    this.logger.debug(
      `FTP upload: ${record.fileName} to ${record.targetId}`,
    );
    record.transferredBytes = record.fileSize;
  }

  /**
   * 전송 검증
   */
  private async validateTransfer(_record: TransferRecord): Promise<boolean> {
    // 실제 구현에서는 원격 파일 체크섬 비교
    return true;
  }

  /**
   * 파일 체크섬 계산
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    try {
      const data = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch {
      return 'N/A';
    }
  }

  /**
   * 완료된 전송을 이력으로 이동
   */
  private archiveTransfer(record: TransferRecord): void {
    this.transferHistory.unshift({ ...record });
    if (this.transferHistory.length > 500) {
      this.transferHistory = this.transferHistory.slice(0, 500);
    }
  }

  /**
   * 실패한 전송 재시도
   */
  async retryTransfer(transferId: string): Promise<TransferRecord | null> {
    const record = this.transfers.get(transferId);
    if (!record || record.status !== 'FAILED') return null;

    record.retryCount = 0;
    record.status = 'PENDING';
    record.errorMessage = undefined;
    await this.executeTransfer(record, '');
    return record;
  }

  /**
   * 현재 전송 목록 조회
   */
  getActiveTransfers(): TransferRecord[] {
    return Array.from(this.transfers.values()).filter(
      (t) => t.status === 'TRANSFERRING' || t.status === 'PENDING' || t.status === 'VALIDATING',
    );
  }

  /**
   * 전송 이력 조회
   */
  getTransferHistory(params?: {
    fileType?: FileType;
    status?: TransferStatus;
    limit?: number;
  }): TransferRecord[] {
    let history = [...this.transferHistory];

    if (params?.fileType) {
      history = history.filter((h) => h.fileType === params.fileType);
    }
    if (params?.status) {
      history = history.filter((h) => h.status === params.status);
    }

    return history.slice(0, params?.limit ?? 100);
  }

  /**
   * 전송 상태 요약
   */
  getTransferStatus(): {
    active: number;
    completed: number;
    failed: number;
    totalBytesTransferred: number;
  } {
    const active = this.getActiveTransfers().length;
    const completed = this.transferHistory.filter((t) => t.status === 'COMPLETED').length;
    const failed = this.transferHistory.filter((t) => t.status === 'FAILED').length;
    const totalBytes = this.transferHistory
      .filter((t) => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.transferredBytes, 0);

    return { active, completed, failed, totalBytesTransferred: totalBytes };
  }
}
