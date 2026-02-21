import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TestRunnerService, TestType } from './test-runner.service';

@ApiTags('Test')
@Controller('api/test')
export class TestRunnerController {
  constructor(private readonly testService: TestRunnerService) {}

  @Post('start')
  @ApiOperation({ summary: '테스트 실행' })
  async startTest(@Body() body: { type: TestType; name?: string }) {
    return this.testService.runTest(body.type, body.name);
  }

  @Get('reports')
  @ApiOperation({ summary: '전체 테스트 리포트 목록' })
  getReports() {
    return this.testService.getAllReports();
  }

  @Get('report/:id')
  @ApiOperation({ summary: '테스트 리포트 조회' })
  getReport(@Param('id') id: string) {
    return this.testService.getReport(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '테스트 취소' })
  cancelTest(@Param('id') id: string) {
    const result = this.testService.cancelTest(id);
    return { success: result };
  }
}
