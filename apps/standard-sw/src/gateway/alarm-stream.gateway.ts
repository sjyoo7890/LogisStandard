import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { createLogger } from '@kpost/logger';
import { MonitoringService } from '../monitoring/monitoring.service';

@WebSocketGateway({ namespace: '/ws/alarms', cors: { origin: '*' } })
export class AlarmStreamGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;
  private logger = createLogger({ service: 'ws-alarms' });

  constructor(private readonly monitoringService: MonitoringService) {}

  afterInit() {
    this.monitoringService.onAlarmEvent((alarm) => {
      if (alarm.status === 'RESOLVED') {
        this.server?.emit('alarm-clear', alarm);
      } else {
        this.server?.emit('alarm', alarm);
      }
    });

    this.logger.info('Alarm Stream WebSocket Gateway initialized');
  }
}
