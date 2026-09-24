import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

function resolveCorsOrigins(): string[] | true {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw || raw === '*') {
    return true;
  }
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const origins = resolveCorsOrigins();
  app.enableCors({
    origin: origins === true
      ? true
      : (origin, callback) => {
          if (
            !origin ||
            origins.includes(origin) ||
            origins.includes('*') ||
            /\.onrender\.com$/.test(new URL(origin).hostname)
          ) {
            callback(null, true);
            return;
          }
          callback(null, false);
        },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Farm-Id',
      'Accept',
      'Origin',
    ],
  });

  const config = new DocumentBuilder()
    .setTitle('Gestão Pecuária API')
    .setDescription(
      'API REST multi-fazenda para gestão de cria, recria e confinamento. Pronta para web e app mobile.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Farm-Id', in: 'header' }, 'farm-id')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`API rodando na porta ${port}`);
  console.log(`OpenAPI em /api/docs`);
}

bootstrap();
