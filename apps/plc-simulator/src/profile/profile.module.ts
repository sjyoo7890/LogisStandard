import { Module } from '@nestjs/common';
import { SorterEngineModule } from '../sorter-engine/sorter-engine.module';
import { ProfileService } from './profile.service';

@Module({
  imports: [SorterEngineModule],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
