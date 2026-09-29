import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { hashToken } from '../src/common/utils/token';
import { createTestApp, login } from './helpers/test-app';
import {
  TEST_PASSWORD,
  Tenant,
  createTenant,
  destroyTenants,
} from './helpers/tenants';

const CSRF = { 'X-Requested-With': 'fazenda-web' };

describe('Sessão: refresh token e cookies (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenant: Tenant;

  const http = () => request(app.getHttpServer());
  const refresh = (token: string) =>
    http().post('/api/v1/auth/refresh').send({ refreshToken: token });
  const cookieValue = (cookies: string[], name: string) =>
    cookies.find((c) => c.startsWith(`${name}=`))?.split(';')[0];

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    tenant = await createTenant(prisma, 'S');
  });

  beforeEach(() => {
    // padrão dos testes: qualquer reuso é tratado como roubo
    process.env.REFRESH_REUSE_GRACE_MS = '0';
  });

  afterAll(async () => {
    delete process.env.REFRESH_REUSE_GRACE_MS;
    await destroyTenants(prisma, [tenant]);
    await app.close();
  });

  it('emite refresh opaco (não-JWT) e persiste somente o hash', async () => {
    const { refreshToken } = await login(app, tenant.email, TEST_PASSWORD);

    expect(refreshToken.split('.')).toHaveLength(1);

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
    });
    expect(stored).not.toBeNull();
    expect(stored?.tokenHash).not.toBe(refreshToken);
    expect(stored?.usedAt).toBeNull();
  });

  it('entrega access e refresh em cookies httpOnly', async () => {
    const { cookies } = await login(app, tenant.email, TEST_PASSWORD);

    for (const name of ['fz_access', 'fz_refresh']) {
      const header = cookies.find((c) => c.startsWith(`${name}=`));
      expect(header).toBeDefined();
      expect(header).toMatch(/HttpOnly/i);
      expect(header).toMatch(/SameSite=Lax/i);
    }
    expect(cookies.find((c) => c.startsWith('fz_refresh='))).toMatch(
      /Path=\/api\/v1\/auth/,
    );
  });

  it('rotaciona o refresh mantendo a mesma família', async () => {
    const first = await login(app, tenant.email, TEST_PASSWORD);
    const res = await refresh(first.refreshToken).expect(200);

    expect(res.body.refreshToken).not.toBe(first.refreshToken);

    const [oldRow, newRow] = await Promise.all([
      prisma.refreshToken.findUniqueOrThrow({
        where: { tokenHash: hashToken(first.refreshToken) },
      }),
      prisma.refreshToken.findUniqueOrThrow({
        where: { tokenHash: hashToken(res.body.refreshToken) },
      }),
    ]);
    expect(oldRow.usedAt).not.toBeNull();
    expect(newRow.usedAt).toBeNull();
    expect(newRow.familyId).toBe(oldRow.familyId);
  });

  it('detecta reuso: token já consumido revoga a família inteira', async () => {
    const first = await login(app, tenant.email, TEST_PASSWORD);
    const second = (await refresh(first.refreshToken).expect(200)).body;

    // atacante reapresenta o token antigo
    await refresh(first.refreshToken).expect(401);

    // o token legítimo mais novo também foi invalidado
    await refresh(second.refreshToken).expect(401);

    const remaining = await prisma.refreshToken.count({
      where: { tokenHash: { in: [hashToken(first.refreshToken), hashToken(second.refreshToken)] } },
    });
    expect(remaining).toBe(0);
  });

  it('tolera reuso dentro da janela de corrida entre abas', async () => {
    process.env.REFRESH_REUSE_GRACE_MS = '60000';

    const first = await login(app, tenant.email, TEST_PASSWORD);
    await refresh(first.refreshToken).expect(200);
    await refresh(first.refreshToken).expect(200);
  });

  it('rejeita refresh desconhecido e refresh expirado', async () => {
    await refresh('token-que-nao-existe').expect(401);

    const first = await login(app, tenant.email, TEST_PASSWORD);
    await prisma.refreshToken.update({
      where: { tokenHash: hashToken(first.refreshToken) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await refresh(first.refreshToken).expect(401);
  });

  it('logout revoga a família e exige autenticação', async () => {
    const session = await login(app, tenant.email, TEST_PASSWORD);

    await http().post('/api/v1/auth/logout').send({}).expect(401);

    await http()
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({ refreshToken: session.refreshToken })
      .expect(200);

    await refresh(session.refreshToken).expect(401);
  });

  describe('CSRF em requisições autenticadas por cookie', () => {
    it('bloqueia mutação com cookie e sem header X-Requested-With', async () => {
      const { cookies } = await login(app, tenant.email, TEST_PASSWORD);
      const access = cookieValue(cookies, 'fz_access');

      await http()
        .post('/api/v1/auth/logout')
        .set('Cookie', access as string)
        .send({})
        .expect(403);
    });

    it('permite mutação com cookie e header correto', async () => {
      const { cookies } = await login(app, tenant.email, TEST_PASSWORD);
      const access = cookieValue(cookies, 'fz_access');

      await http()
        .post('/api/v1/auth/logout')
        .set('Cookie', access as string)
        .set(CSRF)
        .send({})
        .expect(200);
    });

    it('leitura autenticada por cookie funciona sem o header', async () => {
      const { cookies } = await login(app, tenant.email, TEST_PASSWORD);
      const access = cookieValue(cookies, 'fz_access');

      await http()
        .get('/api/v1/auth/me')
        .set('Cookie', access as string)
        .expect(200);
    });
  });
});
