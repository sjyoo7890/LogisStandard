import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createLogger } from '@kpost/logger';
import { TelegramBuilder, TELEGRAM_1_DEF } from '@kpost/telegram';
import { PLC_CONFIG } from '@kpost/common';
import { TcpServerService } from '../tcp-server/tcp-server.service';

@Injectable()
export class HeartbeatService implements OnModuleDestroy {
  private logger = createLogger({ service: 'heartbeat' });
  private interval?: NodeJS.Timeout;
  private heartbeatNo = 0;
  private running = false;

  constructor(private readonly tcpServer: TcpServerService) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.interval = setInterval(() => {
      this.sendHeartbeat();
    }, PLC_CONFIG.HEARTBEAT_INTERVAL_MS);
    this.logger.info('Heartbeat started (5s interval)');
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    this.logger.info('Heartbeat stopped');
  }

  reset(): void {
    this.heartbeatNo = 0;
  }

  private sendHeartbeat(): void {
    this.heartbeatNo++;
    if (this.heartbeatNo > 65535) this.heartbeatNo = 1;

    const buffer = TelegramBuilder.quickBuild(TELEGRAM_1_DEF, {
      acknowledgeStatus: 0,
      heartBeatNo: this.heartbeatNo,
    });

    this.tcpServer.sendToChannel('SEND_HEARTBEAT', buffer);
  }

  isRunning(): boolean {
    return this.running;
  }

  getHeartbeatNo(): number {
    return this.heartbeatNo;
  }

  onModuleDestroy() {
    this.stop();
  }
}
