import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { createLogger } from '@kpost/logger';
import { ChuteDisplayService } from '../chute-display/chute-display.service';

@WebSocketGateway({ namespace: '/ws/chute-display', cors: { origin: '*' } })
export class ChuteDisplayStreamGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;
  private logger = createLogger({ service: 'ws-chute-display' });
  private broadcastInterval?: NodeJS.Timeout;

  constructor(private readonly chuteDisplayService: ChuteDisplayService) {}

  afterInit() {
    this.chuteDisplayService.onDisplayChange((entry) => {
      this.server?.emit('display-update', entry);
    });

    this.broadcastInterval = setInterval(() => {
      this.server?.emit('display', this.chuteDisplayService.getAllDisplays());
    }, 2000);

    this.logger.info('Chute Display WebSocket Gateway initialized');
  }
}
