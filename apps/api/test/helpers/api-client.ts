import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

/** Cliente autenticado (token + fazenda ativa) para os testes e2e. */
export function apiClient(
  app: INestApplication,
  token: string,
  farmId: string,
) {
  return (method: HttpMethod, path: string) =>
    request(app.getHttpServer())
      [method](`/api/v1${path}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Farm-Id', farmId);
}

export type ApiClient = ReturnType<typeof apiClient>;
