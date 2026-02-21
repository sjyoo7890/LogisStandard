import { Module } from '@nestjs/common';
import { SorterEngineModule } from '../sorter-engine/sorter-engine.module';
import { HeartbeatModule } from '../heartbeat/heartbeat.module';
import { ScenarioService } from './scenario.service';

@Module({
  imports: [SorterEngineModule, HeartbeatModule],
  providers: [ScenarioService],
  exports: [ScenarioService],
})
export class ScenarioModule {}
