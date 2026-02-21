import { Module } from '@nestjs/common';
import { PLCStreamGateway } from './plc-stream.gateway';
import { EquipmentStatusGateway } from './equipment-status.gateway';
import { AlarmsGateway } from './alarms.gateway';
import { PLCConnectionModule } from '../plc-connection/plc-connection.module';
import { EquipmentMonitorModule } from '../equipment-monitor/equipment-monitor.module';

@Module({
  imports: [PLCConnectionModule, EquipmentMonitorModule],
  providers: [PLCStreamGateway, EquipmentStatusGateway, AlarmsGateway],
})
export class GatewayModule {}
