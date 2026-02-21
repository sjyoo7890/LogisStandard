import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SortingService } from './sorting.service';

@ApiTags('Sorting - 구분시스템')
@Controller('api/sorting')
export class SortingController {
  constructor(private readonly sortingService: SortingService) {}

  @Get('status')
  @ApiOperation({ summary: '구분시스템 상태' })
  getStatus() {
    return this.sortingService.getStatus();
  }

  @Get('plans')
  @ApiOperation({ summary: '구분계획 목록' })
  getPlans() {
    return this.sortingService.getAllPlans();
  }

  @Get('plans/active')
  @ApiOperation({ summary: '현재 활성 구분계획' })
  getActivePlan() {
    return this.sortingService.getActivePlan() || { error: 'No active plan' };
  }

  @Get('plans/:planId')
  @ApiOperation({ summary: '구분계획 상세' })
  getPlan(@Param('planId') planId: string) {
    return this.sortingService.getPlan(planId) || { error: 'Plan not found' };
  }

  @Post('plans')
  @ApiOperation({ summary: '구분계획 생성' })
  createPlan(@Body() body: { name: string }) {
    return this.sortingService.createPlan(body.name);
  }

  @Post('plans/:planId/activate')
  @ApiOperation({ summary: '구분계획 활성화' })
  activatePlan(@Param('planId') planId: string) {
    const success = this.sortingService.activatePlan(planId);
    return { success, planId };
  }

  @Get('plans/:planId/rules')
  @ApiOperation({ summary: '구분규칙 목록' })
  getRules(@Param('planId') planId: string) {
    return this.sortingService.getRulesForPlan(planId);
  }

  @Get('special-keys')
  @ApiOperation({ summary: '특수키 목록' })
  getSpecialKeys() {
    return this.sortingService.getSpecialKeys();
  }

  @Post('process')
  @ApiOperation({ summary: '바코드 구분 처리' })
  processBarcode(@Body() body: { barcode: string; inductionId?: string }) {
    return this.sortingService.processBarcode(body.barcode, body.inductionId);
  }

  @Get('history')
  @ApiOperation({ summary: '구분 이력 조회' })
  @ApiQuery({ name: 'limit', required: false })
  getHistory(@Query('limit') limit?: string) {
    return this.sortingService.getSortHistory(limit ? parseInt(limit, 10) : 50);
  }

  @Get('comm-log')
  @ApiOperation({ summary: '통신 로그 조회' })
  @ApiQuery({ name: 'limit', required: false })
  getCommLog(@Query('limit') limit?: string) {
    return this.sortingService.getCommLog(limit ? parseInt(limit, 10) : 50);
  }

  @Get('stats')
  @ApiOperation({ summary: '구분 통계' })
  getStats() {
    return this.sortingService.getStats();
  }
}
