// ============================================
// Brunch Bouaké PMS — NestJS Entry Point
// ============================================

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all API routes
  app.setGlobalPrefix('api');

  // CORS for Next.js frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.BACKEND_PORT || 3001;
  await app.listen(port);

  console.log(`🏨 Brunch Bouaké PMS API running on http://localhost:${port}/api`);
}

bootstrap();
