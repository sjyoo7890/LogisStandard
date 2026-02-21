import { Injectable } from '@nestjs/common';
import { PLCConnectionService } from './plc-connection/plc-connection.service';
import { EquipmentMonitorService } from './equipment-monitor/equipment-monitor.service';
import { SimulatorService } from './simulator/simulator.service';
import { OperationService } from './operation/operation.service';

@Injectable()
export class AppService {
  private startedAt = new Date().toISOString();

  constructor(
    private readonly plcService: PLCConnectionService,
    private readonly eqService: EquipmentMonitorService,
    private readonly simService: SimulatorService,
    private readonly opService: OperationService,
  ) {}

  getHealth() {
    return {
      status: 'ok',
      service: 'local-relay',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }

  getStatus() {
    return {
      system: this.getHealth(),
      mode: this.opService.getCurrentMode(),
      plc: this.plcService.getStatus(),
      equipment: this.eqService.getSystemOverview(),
      simulator: {
        running: this.simService.isRunning(),
        activeRule: this.simService.getActiveRule().rule,
      },
      uptime: this.startedAt,
    };
  }
}
