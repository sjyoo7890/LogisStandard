import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { PLCConnectionModule } from '../plc-connection/plc-connection.module';
import { EquipmentMonitorModule } from '../equipment-monitor/equipment-monitor.module';

@Module({
  imports: [PLCConnectionModule, EquipmentMonitorModule],
  providers: [MaintenanceService],
  controllers: [MaintenanceController],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
