import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IPSService } from './ips.service';

@ApiTags('IPS')
@Controller('api/ips')
export class IPSController {
  constructor(private readonly ipsService: IPSService) {}

  @Get('devices')
  @ApiOperation({ summary: 'IPS 디바이스 목록' })
  getDevices() {
    return this.ipsService.getAllDevices();
  }

  @Get('devices/:id')
  @ApiOperation({ summary: '특정 IPS 디바이스 상태' })
  getDevice(@Param('id') id: string) {
    return this.ipsService.getDevice(id);
  }

  @Get('reads')
  @ApiOperation({ summary: '바코드 판독 이력' })
  getReads(@Query('limit') limit?: string) {
    return this.ipsService.getReadHistory({ limit: limit ? parseInt(limit) : 50 });
  }

  @Get('stats')
  @ApiOperation({ summary: 'IPS 통계' })
  getStats() {
    return this.ipsService.getOverallStats();
  }
}
