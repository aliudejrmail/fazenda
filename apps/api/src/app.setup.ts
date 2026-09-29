import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { csrfMiddleware } from './common/utils/cookies';

type CorsOrigin =
  | string[]
  | true
  | ((
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => void);

const isProd = () => process.env.NODE_ENV === 'production';

export const isSwaggerEnabled = () =>
  process.env.ENABLE_SWAGGER === 'true' || !isProd();

function resolveCorsOrigins(): CorsOrigin {
  const raw = process.env.CORS_ORIGIN?.trim();

  if (!raw || raw === '*') {
    // Em produção exige lista explícita; em dev libera tudo.
    return isProd() ? [] : true;
  }

  const allowed = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return (origin, callback) => {
    callback(null, !origin || allowed.includes(origin));
  };
}

/**
 * Configuração compartilhada entre `main.ts` e os testes e2e:
 * headers de segurança, cookies, CSRF, prefixo, validação e CORS.
 */
export function configureApp(app: INestApplication) {
  // atrás do proxy do Render/Next: necessário para cookies Secure e IP real (throttler)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(
    helmet({
      // Swagger UI precisa de scripts/estilos inline
      contentSecurityPolicy: isSwaggerEnabled() ? false : undefined,
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.use(cookieParser());
  app.use(csrfMiddleware);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Farm-Id',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
  });
}

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Gestão Pecuária API')
    .setDescription(
      'API REST multi-fazenda para gestão de cria, recria e confinamento.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Farm-Id', in: 'header' }, 'farm-id')
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
}
