import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MonitoringService, AlarmStatus } from './monitoring.service';

@ApiTags('Monitoring - 모니터링/CGS')
@Controller('api/monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('status')
  @ApiOperation({ summary: '모니터링 상태 요약' })
  getStatus() {
    return this.monitoringService.getStatus();
  }

  @Get('layout')
  @ApiOperation({ summary: '구분기 레이아웃 조회' })
  getLayout() {
    return this.monitoringService.getLayout();
  }

  @Get('layout/summary')
  @ApiOperation({ summary: '레이아웃 요약' })
  getLayoutSummary() {
    return this.monitoringService.getLayoutSummary();
  }

  @Get('chutes')
  @ApiOperation({ summary: '슈트 상태 전체 조회' })
  getChuteStates() {
    return this.monitoringService.getAllChuteStates();
  }

  @Get('chutes/:number')
  @ApiOperation({ summary: '슈트 개별 상태 조회' })
  getChuteState(@Param('number') num: string) {
    return this.monitoringService.getChuteState(parseInt(num, 10)) || { error: 'Chute not found' };
  }

  @Get('alarms')
  @ApiOperation({ summary: '알람 목록 조회' })
  @ApiQuery({ name: 'status', enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'], required: false })
  getAlarms(@Query('status') status?: AlarmStatus) {
    return this.monitoringService.getAlarms(status);
  }

  @Post('alarms/:id/acknowledge')
  @ApiOperation({ summary: '알람 확인' })
  acknowledgeAlarm(@Param('id') id: string) {
    const success = this.monitoringService.acknowledgeAlarm(id);
    return { success, alarmId: id };
  }

  @Post('alarms/:id/resolve')
  @ApiOperation({ summary: '알람 해제' })
  resolveAlarm(@Param('id') id: string, @Body() body: { actionNote?: string }) {
    const success = this.monitoringService.resolveAlarm(id, body.actionNote);
    return { success, alarmId: id };
  }

  @Get('comm-status')
  @ApiOperation({ summary: '장비 통신 현황' })
  getCommStatus() {
    return this.monitoringService.getCommStatuses();
  }
}
