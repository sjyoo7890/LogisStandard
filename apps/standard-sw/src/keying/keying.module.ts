import { Module } from '@nestjs/common';
import { KeyingService } from './keying.service';
import { KeyingController } from './keying.controller';

@Module({
  providers: [KeyingService],
  controllers: [KeyingController],
  exports: [KeyingService],
})
export class KeyingModule {}
