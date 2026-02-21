import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SimulatorService, SortingRule } from './simulator.service';

@ApiTags('Simulator')
@Controller('api/simulator')
export class SimulatorController {
  constructor(private readonly simService: SimulatorService) {}

  @Post('start')
  @ApiOperation({ summary: '시뮬레이션 시작' })
  start(@Body() body?: { intervalMs?: number }) {
    const result = this.simService.start(body?.intervalMs);
    return { success: result, status: result ? 'STARTED' : 'ALREADY_RUNNING' };
  }

  @Post('stop')
  @ApiOperation({ summary: '시뮬레이션 정지' })
  stop() {
    const result = this.simService.stop();
    return { success: result, status: result ? 'STOPPED' : 'NOT_RUNNING' };
  }

  @Post('reset')
  @ApiOperation({ summary: '시뮬레이터 리셋' })
  reset() {
    this.simService.reset();
    return { success: true };
  }

  @Post('rule')
  @ApiOperation({ summary: '구분 규칙 변경' })
  setRule(@Body() body: { rule: SortingRule }) {
    const result = this.simService.setRule(body.rule);
    return { success: result, activeRule: this.simService.getActiveRule() };
  }

  @Post('simulate-one')
  @ApiOperation({ summary: '단건 시뮬레이션' })
  simulateOne(@Body() body: { barcode: string; sortCode?: string }) {
    return this.simService.simulateOne(body.barcode, body.sortCode);
  }

  @Get('stats')
  @ApiOperation({ summary: '시뮬레이터 통계' })
  getStats() {
    return this.simService.getStats();
  }

  @Get('items')
  @ApiOperation({ summary: '시뮬레이션 결과 목록' })
  getItems(@Query('limit') limit?: string) {
    return this.simService.getItems(limit ? parseInt(limit) : 50);
  }

  @Get('rules')
  @ApiOperation({ summary: '구분 규칙 목록' })
  getRules() {
    return { rules: this.simService.getRules(), active: this.simService.getActiveRule() };
  }
}
