import { Module } from '@nestjs/common';
import { FtpService } from './ftp.service';
import { FtpController } from './ftp.controller';
import { ConnectionModule } from '../connection/connection.module';

@Module({
  imports: [ConnectionModule],
  controllers: [FtpController],
  providers: [FtpService],
  exports: [FtpService],
})
export class FtpModule {}
