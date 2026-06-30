import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { setupPeriaDocs } from '@peria/adapters/nest';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  setupPeriaDocs(app, {
    route: '/docs',
    docsPath: 'docs',
    llmsPath: 'llms.txt',
  });
  await app.listen(Number(process.env.PORT ?? '3000'), '127.0.0.1');
}

bootstrap();
