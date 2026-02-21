import { Injectable } from '@nestjs/common';
import { InfoLinkService } from './info-link/info-link.service';
import { SortingService } from './sorting/sorting.service';
import { StatisticsService } from './statistics/statistics.service';
import { MonitoringService } from './monitoring/monitoring.service';
import { KeyingService } from './keying/keying.service';
import { ChuteDisplayService } from './chute-display/chute-display.service';
import { SituationControlService } from './situation-control/situation-control.service';

@Injectable()
export class AppService {
  private startedAt = new Date().toISOString();

  constructor(
    private readonly infoLinkService: InfoLinkService,
    private readonly sortingService: SortingService,
    private readonly statisticsService: StatisticsService,
    private readonly monitoringService: MonitoringService,
    private readonly keyingService: KeyingService,
    private readonly chuteDisplayService: ChuteDisplayService,
    private readonly situationService: SituationControlService,
  ) {}

  getHealth() {
    return {
      status: 'ok',
      service: 'standard-sw',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }

  getStatus() {
    return {
      system: this.getHealth(),
      infoLink: this.infoLinkService.getStatus(),
      sorting: this.sortingService.getStatus(),
      statistics: this.statisticsService.getStatus(),
      monitoring: this.monitoringService.getStatus(),
      keying: this.keyingService.getStatus(),
      chuteDisplay: this.chuteDisplayService.getStatus(),
      situation: this.situationService.getStatus(),
      uptime: this.startedAt,
    };
  }
}
