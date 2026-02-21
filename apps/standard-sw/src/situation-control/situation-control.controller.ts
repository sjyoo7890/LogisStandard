import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SituationControlService } from './situation-control.service';

@ApiTags('Situation - 상황관제')
@Controller('api/situation')
export class SituationControlController {
  constructor(private readonly situationService: SituationControlService) {}

  @Get('status')
  @ApiOperation({ summary: '상황관제 상태' })
  getStatus() {
    return this.situationService.getStatus();
  }

  @Get('overview')
  @ApiOperation({ summary: '전체 현황 (처리량/성공률/가동시간)' })
  getOverview() {
    return this.situationService.getOverview();
  }

  @Get('chutes')
  @ApiOperation({ summary: '슈트별 행선지+구분수량' })
  getChuteInfos() {
    return this.situationService.getChuteInfos();
  }

  @Get('delivery-points')
  @ApiOperation({ summary: '배달점별 구분정보' })
  getDeliveryPoints() {
    return this.situationService.getDeliveryPoints();
  }

  @Get('alarms')
  @ApiOperation({ summary: '알람 메시지' })
  getAlarms() {
    return this.situationService.getAlarms();
  }

  @Get('sorter-status')
  @ApiOperation({ summary: '구분기 가동 상태' })
  getSorterStatus() {
    return this.situationService.getSorterStatuses();
  }
}
