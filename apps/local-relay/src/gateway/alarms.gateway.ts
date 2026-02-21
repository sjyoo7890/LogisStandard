import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { createLogger } from '@kpost/logger';
import { EquipmentMonitorService } from '../equipment-monitor/equipment-monitor.service';

@WebSocketGateway({ namespace: '/ws/alarms', cors: { origin: '*' } })
export class AlarmsGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;
  private logger = createLogger({ service: 'ws-alarms' });

  constructor(private readonly eqService: EquipmentMonitorService) {}

  afterInit() {
    this.eqService.onAlarm((alarm) => {
      this.server?.emit('alarm', alarm);
    });
    this.logger.info('Alarms WebSocket Gateway initialized');
  }
}
