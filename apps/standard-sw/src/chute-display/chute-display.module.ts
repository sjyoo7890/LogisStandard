import { Module } from '@nestjs/common';
import { ChuteDisplayService } from './chute-display.service';
import { ChuteDisplayController } from './chute-display.controller';

@Module({
  providers: [ChuteDisplayService],
  controllers: [ChuteDisplayController],
  exports: [ChuteDisplayService],
})
export class ChuteDisplayModule {}
