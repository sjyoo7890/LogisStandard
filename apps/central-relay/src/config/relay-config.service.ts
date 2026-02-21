import { Injectable } from '@nestjs/common';
import { createLogger } from '@kpost/logger';

export interface CenterConfig {
  centerId: string;
  centerName: string;
  host: string;
  port: number;
  protocol: 'TCP_SOCKET' | 'WEBSOCKET' | 'REST_API';
  enabled: boolean;
  syncIntervalMs: number;
  timeoutMs: number;
  maxRetries: number;
}

export interface SimsConfig {
  host: string;
  port: number;
  databaseUrl: string;
  heartbeatIntervalMs: number;
  timeoutMs: number;
}

export interface ProtocolConfig {
  db2db: { batchSize: number; pollIntervalMs: number; retryAttempts: number };
  ftp: { maxConcurrentTransfers: number; retryAttempts: number; timeoutMs: number };
  socket: { maxConnections: number; keepAliveMs: number };
}

export interface SyncConfig {
  receptionInfo: { intervalMs: number; batchSize: number };
  addressRouteDB: { intervalMs: number; batchSize: number };
  sortingResult: { intervalMs: number; batchSize: number };
  bindingInfo: { intervalMs: number; batchSize: number };
  statistics: { intervalMs: number; batchSize: number };
}

export interface RelayConfiguration {
  sims: SimsConfig;
  centers: CenterConfig[];
  protocol: ProtocolConfig;
  sync: SyncConfig;
}

/**
 * 중앙 중계기 설정 관리 서비스
 * - 집중국별 연결 설정
 * - 통신 프로토콜 설정
 * - 동기화 주기 설정
 */
@Injectable()
export class RelayConfigService {
  private logger = createLogger({ service: 'config' });
  private config: RelayConfiguration;

  constructor() {
    this.config = this.getDefaultConfig();
    this.logger.info('RelayConfigService initialized');
  }

  /**
   * 기본 설정
   */
  private getDefaultConfig(): RelayConfiguration {
    return {
      sims: {
        host: process.env.SIMS_HOST ?? 'sims.koreapost.go.kr',
        port: parseInt(process.env.SIMS_PORT ?? '5432', 10),
        databaseUrl: process.env.SIMS_DATABASE_URL ?? '',
        heartbeatIntervalMs: 10000,
        timeoutMs: 5000,
      },
      centers: [
        {
          centerId: 'SEOUL',
          centerName: '서울우편집중국',
          host: '10.10.1.100',
          port: 3100,
          protocol: 'TCP_SOCKET',
          enabled: true,
          syncIntervalMs: 30000,
          timeoutMs: 5000,
          maxRetries: 3,
        },
        {
          centerId: 'BUSAN',
          centerName: '부산우편집중국',
          host: '10.10.2.100',
          port: 3100,
          protocol: 'TCP_SOCKET',
          enabled: true,
          syncIntervalMs: 30000,
          timeoutMs: 5000,
          maxRetries: 3,
        },
        {
          centerId: 'DAEGU',
          centerName: '대구우편집중국',
          host: '10.10.3.100',
          port: 3100,
          protocol: 'TCP_SOCKET',
          enabled: true,
          syncIntervalMs: 30000,
          timeoutMs: 5000,
          maxRetries: 3,
        },
        {
          centerId: 'GWANGJU',
          centerName: '광주우편집중국',
          host: '10.10.4.100',
          port: 3100,
          protocol: 'TCP_SOCKET',
          enabled: true,
          syncIntervalMs: 30000,
          timeoutMs: 5000,
          maxRetries: 3,
        },
        {
          centerId: 'DAEJEON',
          centerName: '대전우편집중국',
          host: '10.10.5.100',
          port: 3100,
          protocol: 'TCP_SOCKET',
          enabled: true,
          syncIntervalMs: 30000,
          timeoutMs: 5000,
          maxRetries: 3,
        },
      ],
      protocol: {
        db2db: { batchSize: 100, pollIntervalMs: 1000, retryAttempts: 3 },
        ftp: { maxConcurrentTransfers: 3, retryAttempts: 3, timeoutMs: 300000 },
        socket: { maxConnections: 50, keepAliveMs: 30000 },
      },
      sync: {
        receptionInfo: { intervalMs: 60000, batchSize: 100 },
        addressRouteDB: { intervalMs: 3600000, batchSize: 500 },
        sortingResult: { intervalMs: 30000, batchSize: 100 },
        bindingInfo: { intervalMs: 30000, batchSize: 100 },
        statistics: { intervalMs: 600000, batchSize: 50 },
      },
    };
  }

  /**
   * 전체 설정 조회
   */
  getConfig(): RelayConfiguration {
    return { ...this.config };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(updates: Partial<RelayConfiguration>): RelayConfiguration {
    if (updates.sims) {
      Object.assign(this.config.sims, updates.sims);
    }
    if (updates.centers) {
      for (const center of updates.centers) {
        const existing = this.config.centers.find((c) => c.centerId === center.centerId);
        if (existing) {
          Object.assign(existing, center);
        }
      }
    }
    if (updates.protocol) {
      if (updates.protocol.db2db) Object.assign(this.config.protocol.db2db, updates.protocol.db2db);
      if (updates.protocol.ftp) Object.assign(this.config.protocol.ftp, updates.protocol.ftp);
      if (updates.protocol.socket) Object.assign(this.config.protocol.socket, updates.protocol.socket);
    }
    if (updates.sync) {
      for (const [key, value] of Object.entries(updates.sync)) {
        if (this.config.sync[key as keyof SyncConfig]) {
          Object.assign(this.config.sync[key as keyof SyncConfig], value);
        }
      }
    }

    this.logger.info('Configuration updated');
    return this.getConfig();
  }

  /**
   * 특정 집중국 설정 조회
   */
  getCenterConfig(centerId: string): CenterConfig | undefined {
    return this.config.centers.find((c) => c.centerId === centerId);
  }

  /**
   * 집중국 설정 업데이트
   */
  updateCenterConfig(centerId: string, updates: Partial<CenterConfig>): CenterConfig | null {
    const center = this.config.centers.find((c) => c.centerId === centerId);
    if (!center) return null;

    Object.assign(center, updates);
    this.logger.info(`Center config updated: ${centerId}`);
    return { ...center };
  }

  /**
   * SIMS 설정 조회
   */
  getSimsConfig(): SimsConfig {
    return { ...this.config.sims };
  }

  /**
   * 활성 집중국 목록
   */
  getActiveCenters(): CenterConfig[] {
    return this.config.centers.filter((c) => c.enabled);
  }
}
