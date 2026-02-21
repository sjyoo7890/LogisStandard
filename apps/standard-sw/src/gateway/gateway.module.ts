import { Module } from '@nestjs/common';
import { SortingStreamGateway } from './sorting-stream.gateway';
import { AlarmStreamGateway } from './alarm-stream.gateway';
import { EquipmentStreamGateway } from './equipment-stream.gateway';
import { ChuteDisplayStreamGateway } from './chute-display-stream.gateway';
import { SortingModule } from '../sorting/sorting.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { ChuteDisplayModule } from '../chute-display/chute-display.module';

@Module({
  imports: [SortingModule, MonitoringModule, ChuteDisplayModule],
  providers: [
    SortingStreamGateway,
    AlarmStreamGateway,
    EquipmentStreamGateway,
    ChuteDisplayStreamGateway,
  ],
})
export class GatewayModule {}
