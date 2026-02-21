import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { StatisticsService, PeriodType } from './statistics.service';

@ApiTags('Statistics - 통계시스템')
@Controller('api/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('status')
  @ApiOperation({ summary: '통계 시스템 상태' })
  getStatus() {
    return this.statisticsService.getStatus();
  }

  @Get('summary')
  @ApiOperation({ summary: '일별 요약 통계' })
  @ApiQuery({ name: 'period', enum: ['DAILY', 'WEEKLY', 'MONTHLY'], required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  getSummary(
    @Query('period') period?: PeriodType,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.statisticsService.getSummary(period, dateFrom, dateTo);
  }

  @Get('induction')
  @ApiOperation({ summary: '인덕션별 통계' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  getInductionStats(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.statisticsService.getInductionStats(dateFrom, dateTo);
  }

  @Get('chute')
  @ApiOperation({ summary: '슈트별 통계' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  getChuteStats(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.statisticsService.getChuteStats(dateFrom, dateTo);
  }

  @Get('code')
  @ApiOperation({ summary: '우편번호 코드별 통계' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  getCodeStats(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.statisticsService.getCodeStats(dateFrom, dateTo);
  }

  @Get('sorter')
  @ApiOperation({ summary: '구분기별 통계' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  getSorterStats(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.statisticsService.getSorterStats(dateFrom, dateTo);
  }

  @Get('destination')
  @ApiOperation({ summary: '행선지별 통계' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  getDestinationStats(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.statisticsService.getDestinationStats(dateFrom, dateTo);
  }

  @Get('export')
  @ApiOperation({ summary: 'CSV 내보내기' })
  @ApiQuery({ name: 'type', enum: ['summary', 'induction', 'chute'], required: false })
  exportCSV(@Query('type') type: string, @Res() res: Response) {
    const csv = this.statisticsService.exportToCSV(type || 'summary');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=statistics-${type || 'summary'}.csv`);
    res.send(csv);
  }
}
