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
import { ConnectionService } from '../connection/connection.service';

/**
 * 실시간 통신상태 WebSocket Gateway
 * /ws/status
 */
@Injectable()
@WebSocketGateway({ namespace: '/ws/status', cors: { origin: '*' } })
export class StatusGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private logger = createLogger({ service: 'ws-status' });
  private broadcastTimer?: NodeJS.Timeout;
  private connectedClients = 0;

  constructor(private readonly connectionService: ConnectionService) {}

  afterInit() {
    this.logger.info('Status WebSocket Gateway initialized');
    // 3초마다 상태 브로드캐스트
    this.broadcastTimer = setInterval(() => {
      this.broadcastStatus();
    }, 3000);
  }

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.info(`Status client connected: ${client.id} (total: ${this.connectedClients})`);

    // 연결 즉시 현재 상태 전송
    const status = this.connectionService.getSystemStatus();
    client.emit('status', status);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.info(`Status client disconnected: ${client.id} (total: ${this.connectedClients})`);
  }

  private broadcastStatus() {
    if (this.connectedClients === 0) return;
    const status = this.connectionService.getSystemStatus();
    this.server.emit('status', status);
  }

  /**
   * Gateway 정리
   */
  onModuleDestroy() {
    if (this.broadcastTimer) {
      clearInterval(this.broadcastTimer);
    }
  }
}
