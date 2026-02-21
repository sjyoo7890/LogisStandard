import { Module } from '@nestjs/common';
import { InfoLinkService } from './info-link.service';
import { InfoLinkController } from './info-link.controller';

@Module({
  providers: [InfoLinkService],
  controllers: [InfoLinkController],
  exports: [InfoLinkService],
})
export class InfoLinkModule {}
