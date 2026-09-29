import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, isSwaggerEnabled, setupSwagger } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const enableSwagger = isSwaggerEnabled();
  if (enableSwagger) setupSwagger(app);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`API rodando na porta ${port}`);
  if (enableSwagger) {
    console.log(`OpenAPI em /api/docs`);
  }
}

bootstrap();
