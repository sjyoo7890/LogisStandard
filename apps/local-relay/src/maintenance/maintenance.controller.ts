import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';

@ApiTags('Maintenance')
@Controller('api/maintenance')
export class MaintenanceController {
  constructor(private readonly maintService: MaintenanceService) {}

  @Post('relay-bypass')
  @ApiOperation({ summary: '중계기 우회 검사' })
  async relayBypass() {
    return this.maintService.runRelayBypassInspection();
  }

  @Post('hw-check')
  @ApiOperation({ summary: 'H/W 장비 점검' })
  async hwCheck() {
    return this.maintService.runHWCheck();
  }

  @Post('full-inspection')
  @ApiOperation({ summary: '전체 검사' })
  async fullInspection() {
    return this.maintService.runFullInspection();
  }

  @Get('reports')
  @ApiOperation({ summary: '점검 리포트 목록' })
  getReports() {
    return this.maintService.getAllReports();
  }

  @Get('report/:id')
  @ApiOperation({ summary: '점검 리포트 조회' })
  getReport(@Param('id') id: string) {
    return this.maintService.getReport(id);
  }
}
