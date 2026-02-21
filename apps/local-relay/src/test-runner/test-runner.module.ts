import { Module } from '@nestjs/common';
import { TestRunnerService } from './test-runner.service';
import { TestRunnerController } from './test-runner.controller';
import { PLCConnectionModule } from '../plc-connection/plc-connection.module';
import { EquipmentMonitorModule } from '../equipment-monitor/equipment-monitor.module';

@Module({
  imports: [PLCConnectionModule, EquipmentMonitorModule],
  providers: [TestRunnerService],
  controllers: [TestRunnerController],
  exports: [TestRunnerService],
})
export class TestRunnerModule {}
