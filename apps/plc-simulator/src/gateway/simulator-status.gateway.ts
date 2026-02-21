import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { createLogger } from '@kpost/logger';
import { SorterEngineService } from '../sorter-engine/sorter-engine.service';

@WebSocketGateway({ namespace: '/ws/simulator-status', cors: { origin: '*' } })
export class SimulatorStatusGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;
  private logger = createLogger({ service: 'ws-sim-status' });
  private broadcastInterval?: NodeJS.Timeout;

  constructor(private readonly sorterEngine: SorterEngineService) {}

  afterInit() {
    this.broadcastInterval = setInterval(() => {
      this.server?.emit('sorter-state', this.sorterEngine.getSorterState());
      this.server?.emit('inductions', this.sorterEngine.getInductions());
      this.server?.emit('items', this.sorterEngine.getActiveItems());
    }, 2000);
    this.logger.info('Simulator Status WebSocket Gateway initialized');
  }
}
