import { Module } from '@nestjs/common';
import { DataSyncService } from './data-sync.service';
import { DataSyncController } from './data-sync.controller';
import { ConnectionModule } from '../connection/connection.module';

@Module({
  imports: [ConnectionModule],
  controllers: [DataSyncController],
  providers: [DataSyncService],
  exports: [DataSyncService],
})
export class DataSyncModule {}
