import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createLogger } from '@kpost/logger';

export interface ConnectionTarget {
  id: string;
  name: string;
  type: 'SIMS' | 'LOCAL_CENTER';
  host: string;
  port: number;
}

export interface ConnectionState {
  target: ConnectionTarget;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  lastConnectedAt?: string;
  lastDisconnectedAt?: string;
  lastError?: string;
  reconnectAttempts: number;
  latencyMs?: number;
}

/**
 * 통신상태 관리 서비스
 * - SIMS DB2DB 연결 상태 모니터링
 * - 각 집중국 상위SW 연결 상태 모니터링
 * - 연결 실패 시 자동 재연결 (exponential backoff)
 */
@Injectable()
export class ConnectionService implements OnModuleInit, OnModuleDestroy {
  private logger = createLogger({ service: 'connection' });
  private connections = new Map<string, ConnectionState>();
  private reconnectTimers = new Map<string, NodeJS.Timeout>();
  private healthCheckInterval?: NodeJS.Timeout;

  // 기본 연결 대상 설정
  private readonly defaultTargets: ConnectionTarget[] = [
    { id: 'SIMS', name: 'SIMS (우정사업정보시스템)', type: 'SIMS', host: 'sims.koreapost.go.kr', port: 5432 },
    { id: 'SEOUL', name: '서울우편집중국', type: 'LOCAL_CENTER', host: '10.10.1.100', port: 3100 },
    { id: 'BUSAN', name: '부산우편집중국', type: 'LOCAL_CENTER', host: '10.10.2.100', port: 3100 },
    { id: 'DAEGU', name: '대구우편집중국', type: 'LOCAL_CENTER', host: '10.10.3.100', port: 3100 },
    { id: 'GWANGJU', name: '광주우편집중국', type: 'LOCAL_CENTER', host: '10.10.4.100', port: 3100 },
    { id: 'DAEJEON', name: '대전우편집중국', type: 'LOCAL_CENTER', host: '10.10.5.100', port: 3100 },
  ];

  private static readonly MAX_RECONNECT_ATTEMPTS = 10;
  private static readonly BASE_DELAY_MS = 1000;
  private static readonly MAX_DELAY_MS = 60000;
  private static readonly HEALTH_CHECK_INTERVAL_MS = 30000;

  onModuleInit() {
    this.initializeConnections();
    this.startHealthCheck();
    this.logger.info('ConnectionService initialized');
  }

  onModuleDestroy() {
    this.stopHealthCheck();
    this.clearAllReconnectTimers();
    this.logger.info('ConnectionService destroyed');
  }

  /**
   * 연결 대상 초기화
   */
  private initializeConnections(): void {
    for (const target of this.defaultTargets) {
      this.connections.set(target.id, {
        target,
        status: 'DISCONNECTED',
        reconnectAttempts: 0,
      });
      this.connect(target.id);
    }
  }

  /**
   * 특정 대상에 연결 시도
   */
  async connect(targetId: string): Promise<boolean> {
    const state = this.connections.get(targetId);
    if (!state) {
      this.logger.error(`Unknown connection target: ${targetId}`);
      return false;
    }

    state.status = 'CONNECTING';
    this.logger.info(`Connecting to ${state.target.name} (${state.target.host}:${state.target.port})`);

    try {
      const startTime = Date.now();
      const connected = await this.attemptConnection(state.target);
      const latency = Date.now() - startTime;

      if (connected) {
        state.status = 'CONNECTED';
        state.lastConnectedAt = new Date().toISOString();
        state.reconnectAttempts = 0;
        state.latencyMs = latency;
        state.lastError = undefined;
        this.logger.info(`Connected to ${state.target.name} (${latency}ms)`);
        return true;
      }

      throw new Error('Connection refused');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      state.status = 'ERROR';
      state.lastError = message;
      state.lastDisconnectedAt = new Date().toISOString();
      this.logger.error(`Connection failed to ${state.target.name}: ${message}`);
      this.scheduleReconnect(targetId);
      return false;
    }
  }

  /**
   * 실제 연결 시도 (TCP 소켓 체크)
   */
  private async attemptConnection(target: ConnectionTarget): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();
      const timeout = 5000;

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(target.port, target.host);
    });
  }

  /**
   * Exponential backoff 재연결 스케줄링
   */
  private scheduleReconnect(targetId: string): void {
    const state = this.connections.get(targetId);
    if (!state) return;

    if (state.reconnectAttempts >= ConnectionService.MAX_RECONNECT_ATTEMPTS) {
      this.logger.error(`Max reconnect attempts reached for ${state.target.name}`);
      return;
    }

    state.reconnectAttempts++;
    const delay = Math.min(
      ConnectionService.BASE_DELAY_MS * Math.pow(2, state.reconnectAttempts - 1),
      ConnectionService.MAX_DELAY_MS,
    );

    this.logger.info(
      `Scheduling reconnect for ${state.target.name} in ${delay}ms (attempt ${state.reconnectAttempts})`,
    );

    // 기존 타이머 제거
    const existingTimer = this.reconnectTimers.get(targetId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      this.connect(targetId);
    }, delay);

    this.reconnectTimers.set(targetId, timer);
  }

  /**
   * 주기적 헬스체크 시작
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [targetId, state] of this.connections) {
        if (state.status === 'CONNECTED') {
          const isAlive = await this.attemptConnection(state.target);
          if (!isAlive) {
            state.status = 'DISCONNECTED';
            state.lastDisconnectedAt = new Date().toISOString();
            this.logger.warn(`Lost connection to ${state.target.name}`);
            this.scheduleReconnect(targetId);
          }
        }
      }
    }, ConnectionService.HEALTH_CHECK_INTERVAL_MS);
  }

  /**
   * 헬스체크 중지
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * 모든 재연결 타이머 제거
   */
  private clearAllReconnectTimers(): void {
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();
  }

  /**
   * 전체 연결 상태 조회
   */
  getAllConnections(): ConnectionState[] {
    return Array.from(this.connections.values());
  }

  /**
   * 특정 연결 상태 조회
   */
  getConnection(targetId: string): ConnectionState | undefined {
    return this.connections.get(targetId);
  }

  /**
   * SIMS 연결 상태 확인
   */
  isSimsConnected(): boolean {
    const sims = this.connections.get('SIMS');
    return sims?.status === 'CONNECTED';
  }

  /**
   * 전체 시스템 상태 요약
   */
  getSystemStatus(): {
    overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    simsConnected: boolean;
    connectedCenters: number;
    totalCenters: number;
    connections: ConnectionState[];
  } {
    const connections = this.getAllConnections();
    const simsConnected = this.isSimsConnected();
    const centers = connections.filter((c) => c.target.type === 'LOCAL_CENTER');
    const connectedCenters = centers.filter((c) => c.status === 'CONNECTED').length;

    let overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    if (simsConnected && connectedCenters === centers.length) {
      overall = 'HEALTHY';
    } else if (!simsConnected) {
      overall = 'CRITICAL';
    } else {
      overall = 'DEGRADED';
    }

    return {
      overall,
      simsConnected,
      connectedCenters,
      totalCenters: centers.length,
      connections,
    };
  }

  /**
   * 연결 대상 업데이트 (설정 변경)
   */
  updateTarget(targetId: string, updates: Partial<ConnectionTarget>): boolean {
    const state = this.connections.get(targetId);
    if (!state) return false;

    Object.assign(state.target, updates);
    this.logger.info(`Updated connection target: ${targetId}`);
    return true;
  }

  /**
   * 수동 재연결 트리거
   */
  async reconnect(targetId: string): Promise<boolean> {
    const state = this.connections.get(targetId);
    if (!state) return false;

    state.reconnectAttempts = 0;
    return this.connect(targetId);
  }
}
