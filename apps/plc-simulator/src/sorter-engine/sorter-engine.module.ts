import { Module } from '@nestjs/common';
import { SorterEngineService } from './sorter-engine.service';

@Module({
  providers: [SorterEngineService],
  exports: [SorterEngineService],
})
export class SorterEngineModule {}
