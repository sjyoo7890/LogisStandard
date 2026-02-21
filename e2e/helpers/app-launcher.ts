import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

/**
 * E2E 테스트용 4개 NestJS 앱 동시 기동 헬퍼
 */
export interface LaunchedApps {
  centralRelay: INestApplication;
  localRelay: INestApplication;
  standardSw: INestApplication;
  plcSimulator: INestApplication;
}

export class AppLauncher {
  private apps: Partial<LaunchedApps> = {};

  /**
   * 개별 앱 기동
   */
  async launchApp(
    name: keyof LaunchedApps,
    appModule: any,
    port: number,
  ): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [appModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.listen(port);
    this.apps[name] = app;

    console.log(`[AppLauncher] ${name} 시작 (port: ${port})`);
    return app;
  }

  /**
   * 모든 앱 동시 기동
   */
  async launchAll(modules: {
    centralRelayModule: any;
    localRelayModule: any;
    standardSwModule: any;
    plcSimulatorModule: any;
  }): Promise<LaunchedApps> {
    const [centralRelay, localRelay, standardSw, plcSimulator] = await Promise.all([
      this.launchApp('centralRelay', modules.centralRelayModule, 3100),
      this.launchApp('localRelay', modules.localRelayModule, 3101),
      this.launchApp('standardSw', modules.standardSwModule, 3102),
      this.launchApp('plcSimulator', modules.plcSimulatorModule, 3103),
    ]);

    this.apps = { centralRelay, localRelay, standardSw, plcSimulator };
    return this.apps as LaunchedApps;
  }

  /**
   * 앱 인스턴스 가져오기
   */
  getApp(name: keyof LaunchedApps): INestApplication | undefined {
    return this.apps[name];
  }

  /**
   * 모든 앱 종료
   */
  async shutdownAll(): Promise<void> {
    const shutdownPromises = Object.entries(this.apps).map(async ([name, app]) => {
      if (app) {
        try {
          await app.close();
          console.log(`[AppLauncher] ${name} 종료 완료`);
        } catch (error) {
          console.error(`[AppLauncher] ${name} 종료 실패:`, error);
        }
      }
    });

    await Promise.all(shutdownPromises);
    this.apps = {};
  }
}
