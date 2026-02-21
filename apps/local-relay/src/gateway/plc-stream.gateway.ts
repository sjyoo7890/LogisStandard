import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { createLogger } from '@kpost/logger';
import { PLCConnectionService } from '../plc-connection/plc-connection.service';

@WebSocketGateway({ namespace: '/ws/plc-stream', cors: { origin: '*' } })
export class PLCStreamGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;
  private logger = createLogger({ service: 'ws-plc-stream' });
  private broadcastInterval?: NodeJS.Timeout;

  constructor(private readonly plcService: PLCConnectionService) {}

  afterInit() {
    this.plcService.onTelegramEvent((event) => {
      this.server?.emit('telegram', event);
    });
    this.broadcastInterval = setInterval(() => {
      this.server?.emit('plc-status', this.plcService.getStatus());
    }, 2000);
    this.logger.info('PLC Stream WebSocket Gateway initialized');
  }
}
