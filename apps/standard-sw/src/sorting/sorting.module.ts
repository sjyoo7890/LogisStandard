import { Module } from '@nestjs/common';
import { SortingService } from './sorting.service';
import { SortingController } from './sorting.controller';

@Module({
  providers: [SortingService],
  controllers: [SortingController],
  exports: [SortingService],
})
export class SortingModule {}
