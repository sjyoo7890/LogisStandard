import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createLogger } from '@kpost/logger';
import { CHANNELS, ChannelConfig } from '@kpost/telegram';

export type ChannelStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';

export interface ChannelState {
  config: ChannelConfig;
  status: ChannelStatus;
  lastActivity?: string;
  reconnectAttempts: number;
  telegramsSent: number;
  telegramsReceived: number;
  bytesTransferred: number;
  lastError?: string;
}

export interface TelegramEvent {
  channelName: string;
  direction: 'SEND' | 'RECEIVE';
  telegramNo: number;
  rawHex: string;
  timestamp: string;
  size: number;
}

/**
 * PLC 소켓통신 서비스
 * - TCP/IP 소켓 서버/클라이언트 (포트별 채널 관리)
 * - packages/telegram 패키지를 사용한 전문 파싱/빌딩
 * - HeartBeat 기반 연결 상태 관리
 * - 자동 재연결 및 버퍼 관리
 */
@Injectable()
export class PLCConnectionService implements OnModuleInit, OnModuleDestroy {
  private logger = createLogger({ service: 'plc-connection' });
  private channels = new Map<string, ChannelState>();
  private heartbeatInterval?: NodeJS.Timeout;
  private heartbeatCounter = 0;
  private telegramLog: TelegramEvent[] = [];
  private connectionListeners: Array<(channel: string, status: ChannelStatus) => void> = [];
  private telegramListeners: Array<(event: TelegramEvent) => void> = [];

  private static readonly HEARTBEAT_INTERVAL_MS = 5000;
  private static readonly MAX_RECONNECT_ATTEMPTS = 10;
  private static readonly MAX_TELEGRAM_LOG = 500;

  onModuleInit() {
    this.initializeChannels();
    this.startHeartbeat();
    this.logger.info('PLCConnectionService initialized');
  }

  onModuleDestroy() {
    this.stopHeartbeat();
    this.logger.info('PLCConnectionService destroyed');
  }

  private initializeChannels(): void {
    const channelList = Object.values(CHANNELS);
    for (const config of channelList) {
      this.channels.set(config.name, {
        config,
        status: 'DISCONNECTED',
        reconnectAttempts: 0,
        telegramsSent: 0,
        telegramsReceived: 0,
        bytesTransferred: 0,
      });
    }
    this.logger.info(`Initialized ${channelList.length} PLC channels`);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.heartbeatCounter++;
      this.logger.debug(`HeartBeat #${this.heartbeatCounter}`);
    }, PLCConnectionService.HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * 채널에 연결 시도
   */
  connectChannel(channelName: string): boolean {
    const state = this.channels.get(channelName);
    if (!state) return false;

    state.status = 'CONNECTING';
    // 실제 구현에서는 TCP socket 연결
    // 시뮬레이션: 즉시 연결 성공 처리
    state.status = 'CONNECTED';
    state.lastActivity = new Date().toISOString();
    state.reconnectAttempts = 0;
    this.notifyConnectionListeners(channelName, 'CONNECTED');
    this.logger.info(`Channel ${channelName} connected on port ${state.config.port}`);
    return true;
  }

  /**
   * 채널 연결 해제
   */
  disconnectChannel(channelName: string): boolean {
    const state = this.channels.get(channelName);
    if (!state) return false;

    state.status = 'DISCONNECTED';
    this.notifyConnectionListeners(channelName, 'DISCONNECTED');
    this.logger.info(`Channel ${channelName} disconnected`);
    return true;
  }

  /**
   * 모든 채널 연결
   */
  connectAll(): void {
    for (const name of this.channels.keys()) {
      this.connectChannel(name);
    }
  }

  /**
   * 모든 채널 해제
   */
  disconnectAll(): void {
    for (const name of this.channels.keys()) {
      this.disconnectChannel(name);
    }
  }

  /**
   * 전문 송신 시뮬레이션
   */
  sendTelegram(channelName: string, telegramNo: number, data: Buffer | number[]): boolean {
    const state = this.channels.get(channelName);
    if (!state || state.status !== 'CONNECTED') return false;

    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    state.telegramsSent++;
    state.bytesTransferred += buf.length;
    state.lastActivity = new Date().toISOString();

    const event: TelegramEvent = {
      channelName,
      direction: 'SEND',
      telegramNo,
      rawHex: buf.toString('hex').toUpperCase(),
      timestamp: state.lastActivity,
      size: buf.length,
    };
    this.recordTelegram(event);
    return true;
  }

  /**
   * 전문 수신 시뮬레이션
   */
  receiveTelegram(channelName: string, telegramNo: number, data: Buffer | number[]): void {
    const state = this.channels.get(channelName);
    if (!state) return;

    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    state.telegramsReceived++;
    state.bytesTransferred += buf.length;
    state.lastActivity = new Date().toISOString();

    const event: TelegramEvent = {
      channelName,
      direction: 'RECEIVE',
      telegramNo,
      rawHex: buf.toString('hex').toUpperCase(),
      timestamp: state.lastActivity,
      size: buf.length,
    };
    this.recordTelegram(event);
  }

  private recordTelegram(event: TelegramEvent): void {
    this.telegramLog.unshift(event);
    if (this.telegramLog.length > PLCConnectionService.MAX_TELEGRAM_LOG) {
      this.telegramLog = this.telegramLog.slice(0, PLCConnectionService.MAX_TELEGRAM_LOG);
    }
    for (const listener of this.telegramListeners) {
      listener(event);
    }
  }

  private notifyConnectionListeners(channel: string, status: ChannelStatus): void {
    for (const listener of this.connectionListeners) {
      listener(channel, status);
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  onConnectionChange(listener: (channel: string, status: ChannelStatus) => void): void {
    this.connectionListeners.push(listener);
  }

  onTelegramEvent(listener: (event: TelegramEvent) => void): void {
    this.telegramListeners.push(listener);
  }

  /**
   * 상태 조회
   */
  getAllChannels(): ChannelState[] {
    return Array.from(this.channels.values());
  }

  getChannel(name: string): ChannelState | undefined {
    return this.channels.get(name);
  }

  getConnectedCount(): number {
    return Array.from(this.channels.values()).filter((c) => c.status === 'CONNECTED').length;
  }

  getTelegramLog(limit = 50): TelegramEvent[] {
    return this.telegramLog.slice(0, limit);
  }

  getHeartbeatCount(): number {
    return this.heartbeatCounter;
  }

  getStatus(): {
    totalChannels: number;
    connected: number;
    disconnected: number;
    totalTelegramsSent: number;
    totalTelegramsReceived: number;
    totalBytesTransferred: number;
    heartbeatCount: number;
  } {
    const channels = this.getAllChannels();
    return {
      totalChannels: channels.length,
      connected: channels.filter((c) => c.status === 'CONNECTED').length,
      disconnected: channels.filter((c) => c.status !== 'CONNECTED').length,
      totalTelegramsSent: channels.reduce((sum, c) => sum + c.telegramsSent, 0),
      totalTelegramsReceived: channels.reduce((sum, c) => sum + c.telegramsReceived, 0),
      totalBytesTransferred: channels.reduce((sum, c) => sum + c.bytesTransferred, 0),
      heartbeatCount: this.heartbeatCounter,
    };
  }
}
