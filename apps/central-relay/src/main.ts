import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLogger } from '@kpost/logger';
import { DEFAULT_PORTS } from '@kpost/common';

async function bootstrap() {
  const logger = createLogger({ service: 'central-relay' });
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Central Relay Server API')
    .setDescription('우정사업본부 중앙 중계기 서버 API - SIMS ↔ 집중국 상위SW 데이터 중계')
    .setVersion('0.1.0')
    .addTag('System', '시스템 상태')
    .addTag('Connections', '통신 상태 관리')
    .addTag('Data Sync', '데이터 동기화')
    .addTag('FTP', '파일 전송')
    .addTag('Fallback', '장애 대응')
    .addTag('Logs', '통신 로그')
    .addTag('Config', '설정 관리')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || DEFAULT_PORTS.CENTRAL_RELAY;
  await app.listen(port);
  logger.info(`Central Relay Server is running on port ${port}`);
  logger.info(`Swagger docs: http://localhost:${port}/api/docs`);
  logger.info(`WebSocket /ws/status - Real-time connection status`);
  logger.info(`WebSocket /ws/logs - Real-time communication logs`);
}

bootstrap();
