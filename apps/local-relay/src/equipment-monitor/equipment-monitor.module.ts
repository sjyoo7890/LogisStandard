import { Module } from '@nestjs/common';
import { EquipmentMonitorService } from './equipment-monitor.service';
import { EquipmentMonitorController } from './equipment-monitor.controller';

@Module({
  providers: [EquipmentMonitorService],
  controllers: [EquipmentMonitorController],
  exports: [EquipmentMonitorService],
})
export class EquipmentMonitorModule {}
