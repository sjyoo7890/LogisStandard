import { Injectable } from '@nestjs/common';
import { createLogger } from '@kpost/logger';

export type LogDirection = 'INBOUND' | 'OUTBOUND';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface CommLogEntry {
  id: string;
  timestamp: string;
  direction: LogDirection;
  sourceId: string;
  targetId: string;
  protocol: string;
  messageType: string;
  dataSize: number;
  level: LogLevel;
  message: string;
  details?: Record<string, unknown>;
  duration?: number; // ms
}

/**
 * 통신 로그 서비스
 * - 모든 송수신 데이터 로깅
 * - 로그 검색/필터링 API
 * - 로그 보존 기간 관리 (60일)
 */
@Injectable()
export class CommLogService {
  private logger = createLogger({ service: 'comm-log' });
  private logs: CommLogEntry[] = [];
  private logCounter = 0;

  private static readonly MAX_LOG_ENTRIES = 100000;
  private static readonly RETENTION_DAYS = 60;

  /**
   * 통신 로그 기록
   */
  log(params: {
    direction: LogDirection;
    sourceId: string;
    targetId: string;
    protocol: string;
    messageType: string;
    dataSize: number;
    level?: LogLevel;
    message: string;
    details?: Record<string, unknown>;
    duration?: number;
  }): CommLogEntry {
    const entry: CommLogEntry = {
      id: `LOG_${++this.logCounter}`,
      timestamp: new Date().toISOString(),
      direction: params.direction,
      sourceId: params.sourceId,
      targetId: params.targetId,
      protocol: params.protocol,
      messageType: params.messageType,
      dataSize: params.dataSize,
      level: params.level ?? 'INFO',
      message: params.message,
      details: params.details,
      duration: params.duration,
    };

    this.logs.unshift(entry);

    // 메모리 제한
    if (this.logs.length > CommLogService.MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(0, CommLogService.MAX_LOG_ENTRIES);
    }

    // 레벨에 따른 로깅
    switch (entry.level) {
      case 'ERROR':
        this.logger.error(`[${entry.direction}] ${entry.message}`);
        break;
      case 'WARN':
        this.logger.warn(`[${entry.direction}] ${entry.message}`);
        break;
      default:
        this.logger.info(`[${entry.direction}] ${entry.message}`);
    }

    return entry;
  }

  /**
   * 로그 조회 (필터링)
   */
  getLogs(params?: {
    startDate?: string;
    endDate?: string;
    direction?: LogDirection;
    sourceId?: string;
    targetId?: string;
    protocol?: string;
    messageType?: string;
    level?: LogLevel;
    keyword?: string;
    limit?: number;
    offset?: number;
  }): { logs: CommLogEntry[]; total: number } {
    let filtered = [...this.logs];

    if (params?.startDate) {
      filtered = filtered.filter((l) => l.timestamp >= params.startDate!);
    }
    if (params?.endDate) {
      filtered = filtered.filter((l) => l.timestamp <= params.endDate!);
    }
    if (params?.direction) {
      filtered = filtered.filter((l) => l.direction === params.direction);
    }
    if (params?.sourceId) {
      filtered = filtered.filter((l) => l.sourceId === params.sourceId);
    }
    if (params?.targetId) {
      filtered = filtered.filter((l) => l.targetId === params.targetId);
    }
    if (params?.protocol) {
      filtered = filtered.filter((l) => l.protocol === params.protocol);
    }
    if (params?.messageType) {
      filtered = filtered.filter((l) => l.messageType === params.messageType);
    }
    if (params?.level) {
      filtered = filtered.filter((l) => l.level === params.level);
    }
    if (params?.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.message.toLowerCase().includes(keyword) ||
          l.sourceId.toLowerCase().includes(keyword) ||
          l.targetId.toLowerCase().includes(keyword),
      );
    }

    const total = filtered.length;
    const offset = params?.offset ?? 0;
    const limit = params?.limit ?? 50;

    return {
      logs: filtered.slice(offset, offset + limit),
      total,
    };
  }

  /**
   * 로그 통계
   */
  getLogStats(): {
    totalLogs: number;
    byDirection: Record<string, number>;
    byLevel: Record<string, number>;
    byProtocol: Record<string, number>;
    recentErrors: CommLogEntry[];
  } {
    const byDirection: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    const byProtocol: Record<string, number> = {};

    for (const log of this.logs) {
      byDirection[log.direction] = (byDirection[log.direction] ?? 0) + 1;
      byLevel[log.level] = (byLevel[log.level] ?? 0) + 1;
      byProtocol[log.protocol] = (byProtocol[log.protocol] ?? 0) + 1;
    }

    const recentErrors = this.logs
      .filter((l) => l.level === 'ERROR')
      .slice(0, 10);

    return {
      totalLogs: this.logs.length,
      byDirection,
      byLevel,
      byProtocol,
      recentErrors,
    };
  }

  /**
   * 보존 기간 초과 로그 삭제
   */
  cleanupExpiredLogs(): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - CommLogService.RETENTION_DAYS);
    const cutoffStr = cutoff.toISOString();

    const before = this.logs.length;
    this.logs = this.logs.filter((l) => l.timestamp >= cutoffStr);
    const deleted = before - this.logs.length;

    if (deleted > 0) {
      this.logger.info(`Cleaned up ${deleted} expired log entries`);
    }
    return deleted;
  }

  /**
   * 최근 로그 (실시간 스트림용)
   */
  getRecentLogs(count: number = 20): CommLogEntry[] {
    return this.logs.slice(0, count);
  }
}
