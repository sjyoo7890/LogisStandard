import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OperationService, OperationMode } from './operation.service';

@ApiTags('Operation Mode')
@Controller('api/mode')
export class OperationController {
  constructor(private readonly opService: OperationService) {}

  @Get()
  @ApiOperation({ summary: '현재 운영 모드' })
  getMode() {
    return this.opService.getStatus();
  }

  @Post('switch')
  @ApiOperation({ summary: '시뮬레이터/운영 모드 전환' })
  async switchMode(@Body() body: { mode: OperationMode; by?: string; reason?: string }) {
    return this.opService.switchMode(body.mode, body.by || 'system', body.reason || '모드 전환 요청');
  }

  @Get('history')
  @ApiOperation({ summary: '모드 전환 이력' })
  getHistory() {
    return this.opService.getModeHistory();
  }
}
