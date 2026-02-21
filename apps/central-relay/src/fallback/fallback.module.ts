import { Module } from '@nestjs/common';
import { FallbackService } from './fallback.service';
import { FallbackController } from './fallback.controller';
import { ConnectionModule } from '../connection/connection.module';

@Module({
  imports: [ConnectionModule],
  controllers: [FallbackController],
  providers: [FallbackService],
  exports: [FallbackService],
})
export class FallbackModule {}
