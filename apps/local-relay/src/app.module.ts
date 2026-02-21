import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PLCConnectionModule } from './plc-connection/plc-connection.module';
import { IPSModule } from './ips/ips.module';
import { EquipmentMonitorModule } from './equipment-monitor/equipment-monitor.module';
import { SimulatorModule } from './simulator/simulator.module';
import { OperationModule } from './operation/operation.module';
import { TestRunnerModule } from './test-runner/test-runner.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    PLCConnectionModule,
    IPSModule,
    EquipmentMonitorModule,
    SimulatorModule,
    OperationModule,
    TestRunnerModule,
    MaintenanceModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
