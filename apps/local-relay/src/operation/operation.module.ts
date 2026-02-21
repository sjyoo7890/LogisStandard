import { Module } from '@nestjs/common';
import { OperationService } from './operation.service';
import { OperationController } from './operation.controller';
import { PLCConnectionModule } from '../plc-connection/plc-connection.module';
import { SimulatorModule } from '../simulator/simulator.module';
import { EquipmentMonitorModule } from '../equipment-monitor/equipment-monitor.module';

@Module({
  imports: [PLCConnectionModule, SimulatorModule, EquipmentMonitorModule],
  providers: [OperationService],
  controllers: [OperationController],
  exports: [OperationService],
})
export class OperationModule {}
