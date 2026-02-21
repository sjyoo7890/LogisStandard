import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { createLogger } from '@kpost/logger';
import { SortingService } from '../sorting/sorting.service';

@WebSocketGateway({ namespace: '/ws/sorting-stream', cors: { origin: '*' } })
export class SortingStreamGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;
  private logger = createLogger({ service: 'ws-sorting-stream' });
  private broadcastInterval?: NodeJS.Timeout;

  constructor(private readonly sortingService: SortingService) {}

  afterInit() {
    this.sortingService.onSortEvent((event) => {
      this.server?.emit('sort-event', event);
    });

    this.sortingService.onCommLog((entry) => {
      this.server?.emit('comm-log', entry);
    });

    this.broadcastInterval = setInterval(() => {
      this.server?.emit('sort-status', this.sortingService.getStats());
    }, 2000);

    this.logger.info('Sorting Stream WebSocket Gateway initialized');
  }
}
