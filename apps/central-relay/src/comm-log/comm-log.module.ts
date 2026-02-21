import { Module } from '@nestjs/common';
import { CommLogService } from './comm-log.service';
import { CommLogController } from './comm-log.controller';

@Module({
  controllers: [CommLogController],
  providers: [CommLogService],
  exports: [CommLogService],
})
export class CommLogModule {}
