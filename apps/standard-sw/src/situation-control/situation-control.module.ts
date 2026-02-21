import { Module } from '@nestjs/common';
import { SituationControlService } from './situation-control.service';
import { SituationControlController } from './situation-control.controller';

@Module({
  providers: [SituationControlService],
  controllers: [SituationControlController],
  exports: [SituationControlService],
})
export class SituationControlModule {}
