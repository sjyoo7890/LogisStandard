import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  RelayConfigService,
  RelayConfiguration,
  CenterConfig,
} from './relay-config.service';

@ApiTags('Config')
@Controller('api/config')
export class RelayConfigController {
  constructor(private readonly configService: RelayConfigService) {}

  @Get()
  @ApiOperation({ summary: '전체 설정 조회' })
  getConfig() {
    return this.configService.getConfig();
  }

  @Put()
  @ApiOperation({ summary: '설정 변경' })
  updateConfig(@Body() body: Partial<RelayConfiguration>) {
    return this.configService.updateConfig(body);
  }

  @Get('centers')
  @ApiOperation({ summary: '활성 집중국 목록' })
  getActiveCenters() {
    return this.configService.getActiveCenters();
  }

  @Get('centers/:centerId')
  @ApiOperation({ summary: '특정 집중국 설정 조회' })
  @ApiParam({ name: 'centerId', description: '집중국 ID (예: SEOUL)' })
  getCenterConfig(@Param('centerId') centerId: string) {
    return this.configService.getCenterConfig(centerId);
  }

  @Put('centers/:centerId')
  @ApiOperation({ summary: '집중국 설정 변경' })
  @ApiParam({ name: 'centerId', description: '집중국 ID' })
  updateCenterConfig(
    @Param('centerId') centerId: string,
    @Body() body: Partial<CenterConfig>,
  ) {
    const result = this.configService.updateCenterConfig(centerId, body);
    if (!result) {
      return { error: 'Center not found' };
    }
    return result;
  }

  @Get('sims')
  @ApiOperation({ summary: 'SIMS 설정 조회' })
  getSimsConfig() {
    return this.configService.getSimsConfig();
  }
}
