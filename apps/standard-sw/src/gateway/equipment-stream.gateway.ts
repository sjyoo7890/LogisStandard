import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { createLogger } from '@kpost/logger';
import { MonitoringService } from '../monitoring/monitoring.service';

@WebSocketGateway({ namespace: '/ws/equipment-status', cors: { origin: '*' } })
export class EquipmentStreamGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;
  private logger = createLogger({ service: 'ws-equipment-status' });
  private broadcastInterval?: NodeJS.Timeout;

  constructor(private readonly monitoringService: MonitoringService) {}

  afterInit() {
    this.monitoringService.onLayoutChange((layout) => {
      this.server?.emit('layout', layout);
    });

    this.broadcastInterval = setInterval(() => {
      this.server?.emit('layout', this.monitoringService.getLayout());
      this.server?.emit('comm-status', this.monitoringService.getCommStatuses());
    }, 3000);

    this.logger.info('Equipment Status WebSocket Gateway initialized');
  }
}
