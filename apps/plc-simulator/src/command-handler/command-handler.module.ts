import { Module } from '@nestjs/common';
import { SorterEngineModule } from '../sorter-engine/sorter-engine.module';
import { CommandHandlerService } from './command-handler.service';

@Module({
  imports: [SorterEngineModule],
  providers: [CommandHandlerService],
  exports: [CommandHandlerService],
})
export class CommandHandlerModule {}
