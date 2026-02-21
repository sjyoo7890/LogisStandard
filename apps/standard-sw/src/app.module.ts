import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfoLinkModule } from './info-link/info-link.module';
import { SortingModule } from './sorting/sorting.module';
import { StatisticsModule } from './statistics/statistics.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { KeyingModule } from './keying/keying.module';
import { ChuteDisplayModule } from './chute-display/chute-display.module';
import { SituationControlModule } from './situation-control/situation-control.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    InfoLinkModule,
    SortingModule,
    StatisticsModule,
    MonitoringModule,
    KeyingModule,
    ChuteDisplayModule,
    SituationControlModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
