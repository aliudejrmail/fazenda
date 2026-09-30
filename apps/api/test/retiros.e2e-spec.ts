import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiClient, apiClient } from './helpers/api-client';
import { createTestApp, login } from './helpers/test-app';
import {
  TEST_PASSWORD,
  Tenant,
  createTenant,
  destroyTenants,
} from './helpers/tenants';

const TODAY = new Date().toISOString();

type RetiroRow = { id: string; name: string; active: boolean; canDelete: boolean };

/**
 * Regras de retiros: nome único, inativação (histórico preservado, sem novos
 * lançamentos) e exclusão apenas sem vínculos.
 */
describe('Retiros: inativar e excluir (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenant: Tenant;
  let api: ApiClient;
  let viewerUserId: string | undefined;

  const createRetiro = async (name: string) =>
    (await api('post', '/retiros').send({ name }).expect(201)).body as RetiroRow;

  const createLot = (retiroId: string, name = 'Lote de teste') =>
    api('post', '/herd/lots').send({
      name,
      category: 'MATRIZ',
      system: 'CRIA',
      quantity: 1,
      retiroId,
    });

  const setActive = (id: string, active: boolean) =>
    api('patch', `/retiros/${id}`).send({ active }).expect(200);

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    tenant = await createTenant(prisma, 'RET');
    const { accessToken } = await login(app, tenant.email, TEST_PASSWORD);
    api = apiClient(app, accessToken, tenant.farmId);
  });

  afterAll(async () => {
    await destroyTenants(prisma, [tenant]);
    if (viewerUserId) {
      await prisma.user.deleteMany({ where: { id: viewerUserId } });
    }
    await app.close();
  });

  it('nome duplicado retorna 409 (criar e renomear)', async () => {
    await createRetiro('Retiro Duplicado');

    const dup = await api('post', '/retiros')
      .send({ name: 'Retiro Duplicado' })
      .expect(409);
    expect(dup.body.message).toMatch(/já existe um retiro/i);

    await api('patch', `/retiros/${tenant.retiroId}`)
      .send({ name: 'Retiro Duplicado' })
      .expect(409);
  });

  describe('inativação', () => {
    it('inativo continua na lista, mas não recebe lote, nascimento nem mortalidade', async () => {
      const retiro = await createRetiro('Retiro Inativo');
      await setActive(retiro.id, false);

      const list = (await api('get', '/retiros').expect(200)).body as RetiroRow[];
      expect(list.find((r) => r.id === retiro.id)?.active).toBe(false);

      await createLot(retiro.id).expect(400);
      await api('post', '/herd/births')
        .send({
          date: TODAY,
          matricesParidas: 1,
          bezerros: 1,
          bezerras: 0,
          retiroId: retiro.id,
        })
        .expect(400);
      await api('post', '/herd/mortalities')
        .send({ date: TODAY, quantity: 1, retiroId: retiro.id })
        .expect(400);

      await setActive(retiro.id, true);
      await createLot(retiro.id).expect(201);
    });

    it('lote que já estava no retiro continua editável após inativar', async () => {
      const retiro = await createRetiro('Retiro Com Lote');
      const lot = (await createLot(retiro.id, 'Lote antigo').expect(201)).body;
      await setActive(retiro.id, false);

      await api('patch', `/herd/lots/${lot.id}`)
        .send({ name: 'Lote renomeado' })
        .expect(200);
      await api('patch', `/herd/lots/${lot.id}`)
        .send({ retiroId: retiro.id })
        .expect(200);
    });

    it('não permite mover um lote para um retiro inativo', async () => {
      const retiro = await createRetiro('Retiro Destino Inativo');
      await setActive(retiro.id, false);

      await api('patch', `/herd/lots/${tenant.lotId}`)
        .send({ retiroId: retiro.id })
        .expect(400);
    });
  });

  describe('exclusão', () => {
    it('bloqueia com lote, depois com nascimento, e libera sem vínculos', async () => {
      const retiro = await createRetiro('Retiro Para Excluir');
      const lot = (await createLot(retiro.id).expect(201)).body;

      const withLot = await api('delete', `/retiros/${retiro.id}`).expect(409);
      expect(withLot.body.message).toMatch(/lote/i);
      const row = ((await api('get', '/retiros')).body as RetiroRow[]).find(
        (r) => r.id === retiro.id,
      );
      expect(row?.canDelete).toBe(false);

      // sem o lote, o nascimento registrado ainda é um vínculo
      await api('delete', `/herd/lots/${lot.id}`).expect(200);
      await api('post', '/herd/births')
        .send({
          date: TODAY,
          matricesParidas: 1,
          bezerros: 1,
          bezerras: 1,
          retiroId: retiro.id,
        })
        .expect(201);
      const withBirth = await api('delete', `/retiros/${retiro.id}`).expect(409);
      expect(withBirth.body.message).toMatch(/nascimento/i);

      await prisma.birthRecord.deleteMany({ where: { retiroId: retiro.id } });
      await api('delete', `/retiros/${retiro.id}`).expect(200);
      await api('get', `/retiros/${retiro.id}`).expect(404);
      expect(
        await prisma.retiro.findUnique({ where: { id: retiro.id } }),
      ).toBeNull();
    });

    it('o lote nunca é desvinculado em silêncio', async () => {
      const retiro = await createRetiro('Retiro Com Lote Fixo');
      const lot = (await createLot(retiro.id).expect(201)).body;

      await api('delete', `/retiros/${retiro.id}`).expect(409);

      const stored = await prisma.herdLot.findUniqueOrThrow({
        where: { id: lot.id },
      });
      expect(stored.retiroId).toBe(retiro.id);
    });

    it('após excluir, o nome pode ser reutilizado', async () => {
      const retiro = await createRetiro('Retiro Nome Reutilizado');
      await api('delete', `/retiros/${retiro.id}`).expect(200);
      await createRetiro('Retiro Nome Reutilizado');
    });
  });

  it('leitor (VIEWER) não consegue inativar nem excluir', async () => {
    const email = `e2e-viewer-${randomUUID().slice(0, 8)}@fazenda.test`;
    const user = await prisma.user.create({
      data: {
        name: 'E2E Viewer',
        email,
        passwordHash: await bcrypt.hash(TEST_PASSWORD, 4),
      },
    });
    viewerUserId = user.id;
    await prisma.membership.create({
      data: { userId: user.id, farmId: tenant.farmId, role: 'VIEWER' },
    });
    const { accessToken } = await login(app, email, TEST_PASSWORD);
    const asViewer = (path: string) =>
      request(app.getHttpServer())
        .patch(`/api/v1${path}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Farm-Id', tenant.farmId);

    await asViewer(`/retiros/${tenant.retiroId}`)
      .send({ active: false })
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/api/v1/retiros/${tenant.retiroId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Farm-Id', tenant.farmId)
      .expect(403);

    const retiro = await prisma.retiro.findUniqueOrThrow({
      where: { id: tenant.retiroId },
    });
    expect(retiro.active).toBe(true);
  });
});
