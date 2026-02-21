import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces';

/**
 * NestJS 통합 테스트 헬퍼
 */
export class NestTestHelper {
  private module: TestingModule;
  private app: INestApplication;

  /**
   * 테스트 모듈 생성
   */
  static async createTestingModule(
    metadata: {
      imports?: any[];
      controllers?: any[];
      providers?: any[];
    },
    overrides?: Array<{ provide: any; useValue: any }>,
  ): Promise<NestTestHelper> {
    const helper = new NestTestHelper();

    let builder: TestingModuleBuilder = Test.createTestingModule({
      imports: metadata.imports || [],
      controllers: metadata.controllers || [],
      providers: metadata.providers || [],
    });

    if (overrides) {
      for (const override of overrides) {
        builder = builder.overrideProvider(override.provide).useValue(override.useValue);
      }
    }

    helper.module = await builder.compile();
    return helper;
  }

  /**
   * NestJS 앱 인스턴스 생성 (HTTP 테스트용)
   */
  async createApp(): Promise<INestApplication> {
    this.app = this.module.createNestApplication();
    await this.app.init();
    return this.app;
  }

  /**
   * 서비스 인스턴스 가져오기
   */
  get<T>(serviceType: Type<T>): T {
    return this.module.get<T>(serviceType);
  }

  /**
   * 토큰으로 프로바이더 가져오기
   */
  getByToken<T>(token: string | symbol): T {
    return this.module.get<T>(token);
  }

  /**
   * 테스트 정리
   */
  async cleanup(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
    if (this.module) {
      await this.module.close();
    }
  }

  /**
   * 앱 인스턴스 반환
   */
  getApp(): INestApplication {
    return this.app;
  }

  /**
   * 모듈 인스턴스 반환
   */
  getModule(): TestingModule {
    return this.module;
  }
}

/**
 * 간단한 통합 테스트 설정 유틸리티
 */
export async function createIntegrationTestApp(
  moduleType: Type<any>,
  overrides?: Array<{ provide: any; useValue: any }>,
): Promise<{ app: INestApplication; module: TestingModule }> {
  let builder = Test.createTestingModule({
    imports: [moduleType],
  });

  if (overrides) {
    for (const override of overrides) {
      builder = builder.overrideProvider(override.provide).useValue(override.useValue);
    }
  }

  const module = await builder.compile();
  const app = module.createNestApplication();
  await app.init();

  return { app, module };
}
