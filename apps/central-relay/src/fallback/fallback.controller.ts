import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FallbackService } from './fallback.service';

@ApiTags('Fallback')
@Controller('api/fallback')
export class FallbackController {
  constructor(private readonly fallbackService: FallbackService) {}

  @Get('status')
  @ApiOperation({ summary: 'Fallback 상태 조회' })
  getStatus() {
    return this.fallbackService.getStatus();
  }

  @Get('pending')
  @ApiOperation({ summary: '미전송 레코드 목록' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getPendingRecords(
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    return this.fallbackService.getPendingRecords({
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('events')
  @ApiOperation({ summary: 'Fallback 이벤트 이력' })
  @ApiQuery({ name: 'limit', required: false })
  getEvents(@Query('limit') limit?: string) {
    return this.fallbackService.getEvents(limit ? parseInt(limit, 10) : undefined);
  }

  @Get('csv-files')
  @ApiOperation({ summary: '생성된 CSV 파일 목록' })
  getCSVFiles() {
    return this.fallbackService.getCSVFiles();
  }

  @Post('generate-csv')
  @ApiOperation({ summary: '수동 CSV 생성 트리거' })
  @ApiQuery({ name: 'type', required: false })
  generateCSV(@Query('type') type?: 'SORTING_RESULT' | 'BINDING_INFO') {
    const filePath = this.fallbackService.triggerCSVGeneration(type);
    if (filePath) {
      return { success: true, filePath };
    }
    return { success: false, message: 'No pending records to export' };
  }
}
