import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { createLogger } from '@kpost/logger';
import { DEFAULT_PORTS } from '@kpost/common';

async function bootstrap() {
  const logger = createLogger({ service: 'plc-simulator' });
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Validation pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('PLC Simulator API')
    .setDescription('PLC 시뮬레이터 제어/모니터링 API')
    .setVersion('0.1.0')
    .addTag('Health', '상태 확인')
    .addTag('Simulation', '시뮬레이션 제어')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || DEFAULT_PORTS.PLC_SIMULATOR;
  await app.listen(port);
  logger.info(`PLC Simulator is running on port ${port}`);
  logger.info(`Swagger UI: http://localhost:${port}/api/docs`);
  logger.info('TCP Channels: 3000, 3001, 3003, 3004, 3006, 3010, 3011');
}

bootstrap();
