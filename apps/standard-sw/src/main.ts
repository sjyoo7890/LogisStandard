import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLogger } from '@kpost/logger';
import { DEFAULT_PORTS } from '@kpost/common';

async function bootstrap() {
  const logger = createLogger({ service: 'standard-sw' });
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: '*' });

  const config = new DocumentBuilder()
    .setTitle('Standard SW API')
    .setDescription('우정사업본부 표준 SW (SMC/CGS 통합) API')
    .setVersion('0.1.0')
    .addTag('System', '시스템 상태')
    .addTag('InfoLink - 정보연계', '정보연계시스템')
    .addTag('Sorting - 구분시스템', '구분시스템 (핵심 엔진)')
    .addTag('Statistics - 통계시스템', '통계시스템')
    .addTag('Monitoring - 모니터링/CGS', '모니터링/CGS')
    .addTag('Keying - 타건기시스템', '타건기시스템')
    .addTag('ChuteDisplay - 슈트현황판', '슈트현황판')
    .addTag('Situation - 상황관제', '상황관제')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || DEFAULT_PORTS.STANDARD_SW;
  await app.listen(port);
  logger.info(`Standard SW Server is running on port ${port}`);
}

bootstrap();
