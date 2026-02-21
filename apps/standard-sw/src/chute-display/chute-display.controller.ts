import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChuteDisplayService, DisplayPlanMapping } from './chute-display.service';

@ApiTags('ChuteDisplay - 슈트현황판')
@Controller('api/chute-display')
export class ChuteDisplayController {
  constructor(private readonly chuteDisplayService: ChuteDisplayService) {}

  @Get()
  @ApiOperation({ summary: '슈트 현황판 전체 조회' })
  getAllDisplays() {
    return this.chuteDisplayService.getAllDisplays();
  }

  @Get('summary')
  @ApiOperation({ summary: '슈트 현황 요약' })
  getSummary() {
    return this.chuteDisplayService.getSummary();
  }

  @Get('chutes/:number')
  @ApiOperation({ summary: '개별 슈트 현황 조회' })
  getDisplay(@Param('number') num: string) {
    return this.chuteDisplayService.getDisplay(parseInt(num, 10)) || { error: 'Chute not found' };
  }

  @Post('apply-plan')
  @ApiOperation({ summary: '구분계획 일괄 적용' })
  applyPlan(@Body() body: { mappings: DisplayPlanMapping[] }) {
    return this.chuteDisplayService.applyPlan(body.mappings);
  }

  @Post('chutes/:number/increment')
  @ApiOperation({ summary: '슈트 카운트 증가' })
  incrementCount(@Param('number') num: string) {
    const result = this.chuteDisplayService.incrementCount(parseInt(num, 10));
    return result || { error: 'Chute not found' };
  }

  @Post('chutes/:number/reset')
  @ApiOperation({ summary: '슈트 카운트 리셋' })
  resetChute(@Param('number') num: string) {
    const success = this.chuteDisplayService.resetChute(parseInt(num, 10));
    return { success };
  }
}
