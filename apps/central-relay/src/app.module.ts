import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConnectionModule } from './connection/connection.module';
import { DataSyncModule } from './data-sync/data-sync.module';
import { FtpModule } from './ftp/ftp.module';
import { FallbackModule } from './fallback/fallback.module';
import { CommLogModule } from './comm-log/comm-log.module';
import { RelayConfigModule } from './config/relay-config.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    ConnectionModule,
    DataSyncModule,
    FtpModule,
    FallbackModule,
    CommLogModule,
    RelayConfigModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
