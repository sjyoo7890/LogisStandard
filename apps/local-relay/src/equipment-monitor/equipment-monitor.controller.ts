import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EquipmentMonitorService } from './equipment-monitor.service';

@ApiTags('Equipment')
@Controller('api/equipment')
export class EquipmentMonitorController {
  constructor(private readonly eqService: EquipmentMonitorService) {}

  @Get()
  @ApiOperation({ summary: '전체 장비 목록' })
  getAll() {
    return this.eqService.getAllEquipment();
  }

  @Get('overview')
  @ApiOperation({ summary: '장비 현황 요약' })
  getOverview() {
    return this.eqService.getSystemOverview();
  }

  @Get('alarms')
  @ApiOperation({ summary: '알람 목록' })
  getAlarms(@Query('active') active?: string) {
    return active === 'true' ? this.eqService.getActiveAlarms() : this.eqService.getAllAlarms();
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 장비 상태' })
  getEquipment(@Param('id') id: string) {
    return this.eqService.getEquipment(id);
  }

  @Post('alarms/:alarmId/clear')
  @ApiOperation({ summary: '알람 해제' })
  clearAlarm(@Param('alarmId') alarmId: string) {
    const result = this.eqService.clearAlarm(alarmId);
    return { success: result, alarmId };
  }

  @Post(':id/status')
  @ApiOperation({ summary: '장비 상태 변경' })
  updateStatus(@Param('id') id: string, @Body() body: { status?: string; speed?: number }) {
    return this.eqService.updateStatus(id, body as any);
  }
}
