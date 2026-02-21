import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { KeyingService } from './keying.service';

@ApiTags('Keying - 타건기시스템')
@Controller('api/keying')
export class KeyingController {
  constructor(private readonly keyingService: KeyingService) {}

  @Get('status')
  @ApiOperation({ summary: '타건기 시스템 상태' })
  getStatus() {
    return this.keyingService.getStatus();
  }

  @Get('stations')
  @ApiOperation({ summary: '타건 스테이션 목록' })
  getStations() {
    return this.keyingService.getAllStations();
  }

  @Get('stations/:stationId')
  @ApiOperation({ summary: '타건 스테이션 상세' })
  getStation(@Param('stationId') stationId: string) {
    return this.keyingService.getStation(stationId) || { error: 'Station not found' };
  }

  @Post('requests')
  @ApiOperation({ summary: '타건 요청 생성' })
  createRequest(@Body() body: { barcode: string; stationId: string }) {
    return this.keyingService.createRequest(body.barcode, body.stationId);
  }

  @Post('requests/:requestId/complete')
  @ApiOperation({ summary: '타건 결과 입력' })
  completeRequest(@Param('requestId') requestId: string, @Body() body: { buttonIndex: number }) {
    const result = this.keyingService.completeRequest(requestId, body.buttonIndex);
    return result || { error: 'Request not found or already completed' };
  }

  @Get('requests')
  @ApiOperation({ summary: '대기 중인 타건 요청' })
  @ApiQuery({ name: 'stationId', required: false })
  getRequests(@Query('stationId') stationId?: string) {
    return this.keyingService.getPendingRequests(stationId);
  }

  @Get('history')
  @ApiOperation({ summary: '타건 이력 조회' })
  @ApiQuery({ name: 'limit', required: false })
  getHistory(@Query('limit') limit?: string) {
    return this.keyingService.getHistory(limit ? parseInt(limit, 10) : 50);
  }

  @Get('stats')
  @ApiOperation({ summary: '타건 통계' })
  getStats() {
    return this.keyingService.getStats();
  }
}
