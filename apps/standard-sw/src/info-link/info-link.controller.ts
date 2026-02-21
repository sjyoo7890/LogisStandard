import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InfoLinkService, SyncSystem } from './info-link.service';

@ApiTags('InfoLink - 정보연계')
@Controller('api/info-link')
export class InfoLinkController {
  constructor(private readonly infoLinkService: InfoLinkService) {}

  @Get('status')
  @ApiOperation({ summary: '정보연계 상태 조회' })
  getStatus() {
    return this.infoLinkService.getStatus();
  }

  @Post('sync')
  @ApiOperation({ summary: 'SIMS/KPLAS 동기화 실행' })
  @ApiQuery({ name: 'system', enum: ['SIMS', 'KPLAS'], required: false })
  sync(@Query('system') system?: SyncSystem) {
    return this.infoLinkService.sync(system || 'SIMS');
  }

  @Get('data')
  @ApiOperation({ summary: '구분데이터 전체 조회' })
  getData() {
    return this.infoLinkService.getAllData();
  }

  @Get('lookup/:zipCode')
  @ApiOperation({ summary: '우편번호→목적지 조회' })
  lookupByZipCode(@Param('zipCode') zipCode: string) {
    return this.infoLinkService.lookupDestination(zipCode);
  }

  @Get('scheduler')
  @ApiOperation({ summary: '스케줄러 상태 조회' })
  getScheduler() {
    return this.infoLinkService.getScheduler();
  }

  @Get('sync-history')
  @ApiOperation({ summary: '동기화 이력 조회' })
  getSyncHistory(@Query('limit') limit?: string) {
    return this.infoLinkService.getSyncHistory(limit ? parseInt(limit, 10) : 20);
  }
}
