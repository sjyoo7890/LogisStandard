import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ConnectionService } from './connection/connection.service';
import { DataSyncService } from './data-sync/data-sync.service';
import { FallbackService } from './fallback/fallback.service';

@ApiTags('System')
@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly connectionService: ConnectionService,
    private readonly dataSyncService: DataSyncService,
    private readonly fallbackService: FallbackService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: '서버 헬스체크' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('status')
  @ApiOperation({ summary: '전체 시스템 상태' })
  getSystemStatus() {
    const connectionStatus = this.connectionService.getSystemStatus();
    const syncStatus = this.dataSyncService.getSyncStatus();
    const fallbackStatus = this.fallbackService.getStatus();

    return {
      system: connectionStatus.overall,
      timestamp: new Date().toISOString(),
      connections: {
        sims: connectionStatus.simsConnected,
        centers: {
          connected: connectionStatus.connectedCenters,
          total: connectionStatus.totalCenters,
        },
      },
      sync: syncStatus,
      fallback: {
        status: fallbackStatus.status,
        pendingRecords: fallbackStatus.pendingRecords,
      },
    };
  }
}
