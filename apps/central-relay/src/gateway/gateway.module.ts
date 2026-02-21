import { Module } from '@nestjs/common';
import { StatusGateway } from './status.gateway';
import { LogsGateway } from './logs.gateway';
import { ConnectionModule } from '../connection/connection.module';
import { CommLogModule } from '../comm-log/comm-log.module';

@Module({
  imports: [ConnectionModule, CommLogModule],
  providers: [StatusGateway, LogsGateway],
  exports: [StatusGateway, LogsGateway],
})
export class GatewayModule {}
