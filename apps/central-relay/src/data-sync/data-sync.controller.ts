import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DataSyncService, SyncDirection, SyncType } from './data-sync.service';

class TriggerSyncDto {
  direction!: SyncDirection;
  syncType!: SyncType;
  targetId?: string;
}

@ApiTags('Data Sync')
@Controller('api/sync')
export class DataSyncController {
  constructor(private readonly dataSyncService: DataSyncService) {}

  @Post('trigger')
  @ApiOperation({ summary: '수동 동기화 트리거' })
  async triggerSync(@Body() body: TriggerSyncDto) {
    return this.dataSyncService.triggerManualSync(
      body.direction,
      body.syncType,
      body.targetId,
    );
  }

  @Get('history')
  @ApiOperation({ summary: '동기화 이력 조회' })
  @ApiQuery({ name: 'direction', required: false })
  @ApiQuery({ name: 'syncType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getSyncHistory(
    @Query('direction') direction?: SyncDirection,
    @Query('syncType') syncType?: SyncType,
    @Query('status') status?: 'COMPLETED' | 'FAILED',
    @Query('limit') limit?: string,
  ) {
    return this.dataSyncService.getSyncHistory({
      direction,
      syncType,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('status')
  @ApiOperation({ summary: '동기화 상태 요약' })
  getSyncStatus() {
    return this.dataSyncService.getSyncStatus();
  }

  @Get('current')
  @ApiOperation({ summary: '현재 진행 중인 동기화 작업' })
  getCurrentJobs() {
    return this.dataSyncService.getCurrentJobs();
  }
}
