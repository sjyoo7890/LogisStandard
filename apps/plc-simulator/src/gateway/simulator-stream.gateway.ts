import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server } from 'socket.io';
import { createLogger } from '@kpost/logger';
import { TelegramLogEntry } from '../tcp-server/tcp-server.types';

@WebSocketGateway({ namespace: '/ws/simulator-stream', cors: { origin: '*' } })
export class SimulatorStreamGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;
  private logger = createLogger({ service: 'ws-sim-stream' });

  afterInit() {
    this.logger.info('Simulator Stream WebSocket Gateway initialized');
  }

  @OnEvent('tcp.log')
  handleTelegramLog(entry: TelegramLogEntry) {
    this.server?.emit('telegram', entry);
  }

  @OnEvent('tcp.client.connected')
  handleClientConnected(data: { channel: string; port: number; address: string }) {
    this.server?.emit('client-connected', data);
  }

  @OnEvent('tcp.client.disconnected')
  handleClientDisconnected(data: { channel: string; port: number }) {
    this.server?.emit('client-disconnected', data);
  }
}
