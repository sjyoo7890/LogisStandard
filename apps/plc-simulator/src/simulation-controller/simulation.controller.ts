import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SorterEngineService } from '../sorter-engine/sorter-engine.service';
import { HeartbeatService } from '../heartbeat/heartbeat.service';
import { ScenarioService } from '../scenario/scenario.service';
import { ProfileService } from '../profile/profile.service';
import { TcpServerService } from '../tcp-server/tcp-server.service';
import {
  UpdateConfigDto,
  StartScenarioDto,
  ApplyProfileDto,
  TriggerFaultDto,
} from './simulation.dto';

@ApiTags('Simulation')
@Controller('api/simulation')
export class SimulationController {
  constructor(
    private readonly sorterEngine: SorterEngineService,
    private readonly heartbeatService: HeartbeatService,
    private readonly scenarioService: ScenarioService,
    private readonly profileService: ProfileService,
    private readonly tcpServer: TcpServerService,
  ) {}

  // ── Simulation lifecycle ──

  @Post('start')
  @HttpCode(200)
  @ApiOperation({ summary: '시뮬레이션 시작' })
  start() {
    this.heartbeatService.start();
    this.sorterEngine.start();
    return { success: true, message: 'Simulation started' };
  }

  @Post('stop')
  @HttpCode(200)
  @ApiOperation({ summary: '시뮬레이션 정지' })
  stop() {
    this.sorterEngine.stop();
    this.heartbeatService.stop();
    return { success: true, message: 'Simulation stopped' };
  }

  @Post('reset')
  @HttpCode(200)
  @ApiOperation({ summary: '시뮬레이션 리셋' })
  reset() {
    this.sorterEngine.reset();
    this.heartbeatService.reset();
    return { success: true, message: 'Simulation reset' };
  }

  @Get('status')
  @ApiOperation({ summary: '시뮬레이션 상태/통계 조회' })
  getStatus() {
    return {
      sorter: this.sorterEngine.getSorterState(),
      heartbeat: {
        running: this.heartbeatService.isRunning(),
        heartbeatNo: this.heartbeatService.getHeartbeatNo(),
      },
      config: this.sorterEngine.getConfig(),
    };
  }

  @Get('state')
  @ApiOperation({ summary: '가상 구분기 전체 상태' })
  getState() {
    return this.sorterEngine.getFullState();
  }

  @Patch('config')
  @ApiOperation({ summary: '설정 변경' })
  updateConfig(@Body() dto: UpdateConfigDto) {
    this.sorterEngine.updateConfig(dto);
    return { success: true, config: this.sorterEngine.getConfig() };
  }

  // ── Scenarios ──

  @Post('scenario/start')
  @HttpCode(200)
  @ApiOperation({ summary: '시나리오 시작' })
  async startScenario(@Body() dto: StartScenarioDto) {
    await this.scenarioService.startScenario(dto.scenarioId);
    return { success: true, message: `Scenario '${dto.scenarioId}' started` };
  }

  @Post('scenario/stop')
  @HttpCode(200)
  @ApiOperation({ summary: '시나리오 정지' })
  stopScenario() {
    this.scenarioService.stopScenario();
    return { success: true, message: 'Scenario stopped' };
  }

  @Get('scenarios')
  @ApiOperation({ summary: '시나리오 목록' })
  getScenarios() {
    return this.scenarioService.getScenarios();
  }

  @Get('scenario/status')
  @ApiOperation({ summary: '시나리오 진행 상태' })
  getScenarioStatus() {
    return this.scenarioService.getStatus();
  }

  // ── Profiles ──

  @Post('profile/apply')
  @HttpCode(200)
  @ApiOperation({ summary: '프로파일 적용' })
  applyProfile(@Body() dto: ApplyProfileDto) {
    const profile = this.profileService.applyProfile(dto.type);
    return { success: true, profile };
  }

  @Get('profiles')
  @ApiOperation({ summary: '프로파일 목록' })
  getProfiles() {
    return this.profileService.getProfiles();
  }

  // ── Fault injection ──

  @Post('fault/trigger')
  @HttpCode(200)
  @ApiOperation({ summary: '장애 주입' })
  triggerFault(@Body() dto: TriggerFaultDto) {
    this.sorterEngine.triggerFault(dto.type, dto.inductionNo);
    return { success: true, message: `Fault '${dto.type}' triggered` };
  }

  @Post('fault/clear')
  @HttpCode(200)
  @ApiOperation({ summary: '장애 해제' })
  clearFault(@Body() body: { type?: string }) {
    this.sorterEngine.clearFault(body.type);
    return { success: true, message: `Fault cleared: ${body.type || 'ALL'}` };
  }

  // ── Monitoring ──

  @Get('telegrams')
  @ApiOperation({ summary: '전문 송수신 로그' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTelegrams(@Query('limit') limit?: string) {
    return this.tcpServer.getTelegramLog(limit ? parseInt(limit, 10) : 100);
  }

  @Get('channels')
  @ApiOperation({ summary: 'TCP 채널 상태' })
  getChannels() {
    return this.tcpServer.getChannelStatus();
  }

  @Get('items')
  @ApiOperation({ summary: '처리중 우편물 목록' })
  getItems() {
    return this.sorterEngine.getActiveItems();
  }
}
