import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { PrismaService } from '../../src/prisma/prisma.service';

/** Sobe o app com a mesma configuração de produção (prefixo, pipes, CSRF, helmet). */
export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  return { app, prisma: app.get(PrismaService) };
}

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  cookies: string[];
};

export async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<LoginResult> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
    cookies: (res.headers['set-cookie'] as unknown as string[]) ?? [],
  };
}
