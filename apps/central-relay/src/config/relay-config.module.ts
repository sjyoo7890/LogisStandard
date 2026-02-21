import { Module } from '@nestjs/common';
import { RelayConfigService } from './relay-config.service';
import { RelayConfigController } from './relay-config.controller';

@Module({
  controllers: [RelayConfigController],
  providers: [RelayConfigService],
  exports: [RelayConfigService],
})
export class RelayConfigModule {}
