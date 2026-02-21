import { Module } from '@nestjs/common';
import { IPSService } from './ips.service';
import { IPSController } from './ips.controller';

@Module({
  providers: [IPSService],
  controllers: [IPSController],
  exports: [IPSService],
})
export class IPSModule {}
