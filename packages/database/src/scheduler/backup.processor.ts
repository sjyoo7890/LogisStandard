import { PrismaClient } from '@prisma/client';
import { Job } from 'bull';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * BACKUP Processor
 *
 * 매주 일요일 오전 11시 30분 실행
 * - pg_dump를 이용한 PostgreSQL 데이터베이스 백업
 */
export class BackupProcessor {
  constructor(private prisma: PrismaClient) {}

  /**
   * 데이터베이스 백업 실행
   */
  async backupDatabase(job: Job): Promise<void> {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 10).replace(/-/g, '') +
      '_' + now.toTimeString().slice(0, 8).replace(/:/g, '');
    console.log(`[BACKUP] Starting database backup - ${timestamp}`);

    const backupDir = process.env.BACKUP_DIR ?? path.join(process.cwd(), 'backups');

    // 백업 디렉토리 생성
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured');
    }

    try {
      // psm_operation 스키마 백업
      const operationBackupFile = path.join(backupDir, `psm_operation_${timestamp}.sql`);
      execSync(
        `pg_dump "${databaseUrl}" --schema=psm_operation --file="${operationBackupFile}" --no-owner --no-privileges`,
        { timeout: 300000 } // 5분 타임아웃
      );
      console.log(`[BACKUP] psm_operation schema backed up: ${operationBackupFile}`);

      // psm_reginfo 스키마 백업
      const reginfoBackupFile = path.join(backupDir, `psm_reginfo_${timestamp}.sql`);
      execSync(
        `pg_dump "${databaseUrl}" --schema=psm_reginfo --file="${reginfoBackupFile}" --no-owner --no-privileges`,
        { timeout: 300000 }
      );
      console.log(`[BACKUP] psm_reginfo schema backed up: ${reginfoBackupFile}`);

      // 오래된 백업 파일 정리 (30일 이전)
      await this.cleanupOldBackups(backupDir, 30);

      console.log(`[BACKUP] Database backup completed successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[BACKUP] Database backup failed: ${message}`);
      throw error;
    }
  }

  /**
   * 오래된 백업 파일 정리
   */
  private async cleanupOldBackups(backupDir: string, retentionDays: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const files = fs.readdirSync(backupDir);
    let deletedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`[BACKUP] Cleaned up ${deletedCount} old backup files`);
    }
  }
}
