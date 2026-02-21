import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { createLogger } from '@kpost/logger';
import { CommLogService } from '../comm-log/comm-log.service';

/**
 * 실시간 로그 WebSocket Gateway
 * /ws/logs
 */
@Injectable()
@WebSocketGateway({ namespace: '/ws/logs', cors: { origin: '*' } })
export class LogsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private logger = createLogger({ service: 'ws-logs' });
  private broadcastTimer?: NodeJS.Timeout;
  private connectedClients = 0;
  private lastLogId = '';

  constructor(private readonly commLogService: CommLogService) {}

  afterInit() {
    this.logger.info('Logs WebSocket Gateway initialized');
    // 2초마다 새 로그 브로드캐스트
    this.broadcastTimer = setInterval(() => {
      this.broadcastNewLogs();
    }, 2000);
  }

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.info(`Logs client connected: ${client.id} (total: ${this.connectedClients})`);

    // 연결 시 최근 로그 전송
    const recentLogs = this.commLogService.getRecentLogs(20);
    client.emit('logs', recentLogs);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.info(`Logs client disconnected: ${client.id} (total: ${this.connectedClients})`);
  }

  private broadcastNewLogs() {
    if (this.connectedClients === 0) return;

    const recentLogs = this.commLogService.getRecentLogs(10);
    if (recentLogs.length === 0) return;

    // 새 로그만 전송
    if (recentLogs[0].id !== this.lastLogId) {
      const newLogs = [];
      for (const log of recentLogs) {
        if (log.id === this.lastLogId) break;
        newLogs.push(log);
      }
      if (newLogs.length > 0) {
        this.lastLogId = newLogs[0].id;
        this.server.emit('logs', newLogs);
      }
    }
  }

  /**
   * 외부에서 로그 이벤트를 즉시 push
   */
  emitLogEntry(logEntry: unknown) {
    if (this.connectedClients > 0) {
      this.server.emit('log', logEntry);
    }
  }

  onModuleDestroy() {
    if (this.broadcastTimer) {
      clearInterval(this.broadcastTimer);
    }
  }
}
