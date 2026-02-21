import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PLCConnectionService } from './plc-connection.service';

@ApiTags('PLC Connection')
@Controller('api/plc')
export class PLCConnectionController {
  constructor(private readonly plcService: PLCConnectionService) {}

  @Get('status')
  @ApiOperation({ summary: 'PLC 연결 상태 및 전문 통계' })
  getStatus() {
    return this.plcService.getStatus();
  }

  @Get('channels')
  @ApiOperation({ summary: '전체 채널 목록' })
  getChannels() {
    return this.plcService.getAllChannels();
  }

  @Get('channels/:name')
  @ApiOperation({ summary: '특정 채널 상태' })
  getChannel(@Param('name') name: string) {
    return this.plcService.getChannel(name);
  }

  @Post('channels/:name/connect')
  @ApiOperation({ summary: '채널 연결' })
  connectChannel(@Param('name') name: string) {
    const result = this.plcService.connectChannel(name);
    return { success: result, channel: name };
  }

  @Post('channels/:name/disconnect')
  @ApiOperation({ summary: '채널 연결 해제' })
  disconnectChannel(@Param('name') name: string) {
    const result = this.plcService.disconnectChannel(name);
    return { success: result, channel: name };
  }

  @Get('telegrams')
  @ApiOperation({ summary: '최근 전문 로그' })
  getTelegramLog() {
    return this.plcService.getTelegramLog();
  }
}
