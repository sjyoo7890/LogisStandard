import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLogger } from '@kpost/logger';
import { DEFAULT_PORTS } from '@kpost/common';

async function bootstrap() {
  const logger = createLogger({ service: 'local-relay' });
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Local Relay Server API')
    .setDescription('우정사업본부 로컬 중계기 서버 API')
    .setVersion('0.1.0')
    .addTag('System', '시스템 상태')
    .addTag('PLC Connection', 'PLC 소켓통신 관리')
    .addTag('IPS', 'IPS/BCR 바코드 판독')
    .addTag('Equipment', '장비 상태 모니터링')
    .addTag('Simulator', '시뮬레이터 모드')
    .addTag('Operation Mode', '운영 모드 전환')
    .addTag('Test', 'H/W 테스트')
    .addTag('Maintenance', '유지보수 점검')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || DEFAULT_PORTS.LOCAL_RELAY;
  await app.listen(port);
  logger.info(`Local Relay Server is running on port ${port}`);
  logger.info(`Swagger docs: http://localhost:${port}/api/docs`);
  logger.info('WebSocket: /ws/plc-stream, /ws/equipment-status, /ws/alarms');
}

bootstrap();
