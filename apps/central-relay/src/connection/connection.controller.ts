import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ConnectionService } from './connection.service';

@ApiTags('Connections')
@Controller('api/connections')
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

  @Get()
  @ApiOperation({ summary: '전체 연결 상태 조회' })
  getAllConnections() {
    return this.connectionService.getAllConnections();
  }

  @Get(':targetId')
  @ApiOperation({ summary: '특정 연결 상태 조회' })
  @ApiParam({ name: 'targetId', description: '연결 대상 ID (예: SIMS, SEOUL)' })
  getConnection(@Param('targetId') targetId: string) {
    return this.connectionService.getConnection(targetId);
  }

  @Post(':targetId/reconnect')
  @ApiOperation({ summary: '수동 재연결 트리거' })
  @ApiParam({ name: 'targetId', description: '연결 대상 ID' })
  async reconnect(@Param('targetId') targetId: string) {
    const result = await this.connectionService.reconnect(targetId);
    return { targetId, reconnected: result };
  }
}
