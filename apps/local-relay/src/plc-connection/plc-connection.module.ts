import { Module } from '@nestjs/common';
import { PLCConnectionService } from './plc-connection.service';
import { PLCConnectionController } from './plc-connection.controller';

@Module({
  providers: [PLCConnectionService],
  controllers: [PLCConnectionController],
  exports: [PLCConnectionService],
})
export class PLCConnectionModule {}
