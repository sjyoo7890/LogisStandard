import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CommLogService, LogDirection, LogLevel } from './comm-log.service';

@ApiTags('Logs')
@Controller('api/logs')
export class CommLogController {
  constructor(private readonly commLogService: CommLogService) {}

  @Get()
  @ApiOperation({ summary: '통신 로그 조회 (필터링)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO 날짜 (시작)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO 날짜 (종료)' })
  @ApiQuery({ name: 'direction', required: false, enum: ['INBOUND', 'OUTBOUND'] })
  @ApiQuery({ name: 'sourceId', required: false })
  @ApiQuery({ name: 'targetId', required: false })
  @ApiQuery({ name: 'protocol', required: false })
  @ApiQuery({ name: 'level', required: false, enum: ['INFO', 'WARN', 'ERROR'] })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  getLogs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('direction') direction?: LogDirection,
    @Query('sourceId') sourceId?: string,
    @Query('targetId') targetId?: string,
    @Query('protocol') protocol?: string,
    @Query('level') level?: LogLevel,
    @Query('keyword') keyword?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.commLogService.getLogs({
      startDate,
      endDate,
      direction,
      sourceId,
      targetId,
      protocol,
      level,
      keyword,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: '로그 통계' })
  getLogStats() {
    return this.commLogService.getLogStats();
  }
}
