import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiClient, apiClient } from './helpers/api-client';
import { createTestApp, login } from './helpers/test-app';
import {
  TEST_PASSWORD,
  Tenant,
  createTenant,
  destroyTenants,
} from './helpers/tenants';

type LotRow = {
  id: string;
  name: string;
  status: string;
  canDelete: boolean;
};

/**
 * Lote só pode ser excluído sem lançamentos. Com histórico, o caminho é encerrar.
 */
describe('Lotes: encerrar e excluir (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenant: Tenant;
  let api: ApiClient;

  const createLot = (name: string) =>
    api('post', '/herd/lots').send({
      name,
      category: 'MATRIZ',
      system: 'CRIA',
      quantity: 10,
    });

  const listLot = async (id: string) =>
    ((await api('get', '/herd/lots').expect(200)).body as LotRow[]).find(
      (l) => l.id === id,
    )!;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    tenant = await createTenant(prisma, 'LOT');
    const { accessToken } = await login(app, tenant.email, TEST_PASSWORD);
    api = apiClient(app, accessToken, tenant.farmId);
  });

  afterAll(async () => {
    await destroyTenants(prisma, [tenant]);
    await app.close();
  });

  it('exclui lote vazio e bloqueia lote com nascimento', async () => {
    const empty = (await createLot('Lote Vazio').expect(201)).body as LotRow;
    expect((await listLot(empty.id)).canDelete).toBe(true);
    await api('delete', `/herd/lots/${empty.id}`).expect(200);

    const lot = (await createLot('Lote Com Nascimento').expect(201))
      .body as LotRow;
    await api('post', '/herd/births')
      .send({
        date: '2026-09-29',
        matricesParidas: 1,
        bezerros: 1,
        bezerras: 0,
        herdLotId: lot.id,
      })
      .expect(201);

    const blocked = await api('delete', `/herd/lots/${lot.id}`).expect(409);
    expect(blocked.body.message).toMatch(/nascimento/i);
    expect((await listLot(lot.id)).canDelete).toBe(false);
  });

  it('lote encerrado não recebe pesagem nem movimentação', async () => {
    const lot = (await createLot('Lote Encerrar').expect(201)).body as LotRow;
    await api('patch', `/herd/lots/${lot.id}`)
      .send({ status: 'ENCERRADO' })
      .expect(200);

    await api('post', '/herd/weighings')
      .send({
        herdLotId: lot.id,
        date: '2026-09-29',
        avgWeightKg: 300,
        quantity: 10,
      })
      .expect(400);

    await api('post', '/herd/movements')
      .send({
        type: 'TRANSFERENCIA',
        date: '2026-09-29',
        quantity: 1,
        fromLotId: lot.id,
      })
      .expect(400);

    await api('patch', `/herd/lots/${lot.id}`)
      .send({ status: 'ATIVO' })
      .expect(200);
    await api('post', '/herd/weighings')
      .send({
        herdLotId: lot.id,
        date: '2026-09-29',
        avgWeightKg: 300,
        quantity: 10,
      })
      .expect(201);
    expect((await listLot(lot.id)).canDelete).toBe(false);
  });
});
