import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { createLogger } from '@kpost/logger';
import { EquipmentMonitorService } from '../equipment-monitor/equipment-monitor.service';

@WebSocketGateway({ namespace: '/ws/equipment-status', cors: { origin: '*' } })
export class EquipmentStatusGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;
  private logger = createLogger({ service: 'ws-equipment' });
  private broadcastInterval?: NodeJS.Timeout;

  constructor(private readonly eqService: EquipmentMonitorService) {}

  afterInit() {
    this.eqService.onStatusChange((eq) => {
      this.server?.emit('status-change', eq);
    });
    this.broadcastInterval = setInterval(() => {
      this.server?.emit('overview', this.eqService.getSystemOverview());
      this.server?.emit('equipment', this.eqService.getAllEquipment());
    }, 3000);
    this.logger.info('Equipment Status WebSocket Gateway initialized');
  }
}
