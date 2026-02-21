import { Module } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { SimulatorController } from './simulator.controller';

@Module({
  providers: [SimulatorService],
  controllers: [SimulatorController],
  exports: [SimulatorService],
})
export class SimulatorModule {}
