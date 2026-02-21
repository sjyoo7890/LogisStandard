import { Module } from '@nestjs/common';
import { SorterEngineModule } from '../sorter-engine/sorter-engine.module';
import { SimulatorStreamGateway } from './simulator-stream.gateway';
import { SimulatorStatusGateway } from './simulator-status.gateway';

@Module({
  imports: [SorterEngineModule],
  providers: [SimulatorStreamGateway, SimulatorStatusGateway],
})
export class GatewayModule {}
