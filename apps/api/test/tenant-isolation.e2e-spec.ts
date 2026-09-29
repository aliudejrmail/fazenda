import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, login } from './helpers/test-app';
import {
  TEST_PASSWORD,
  Tenant,
  createTenant,
  destroyTenants,
} from './helpers/tenants';

const TODAY = new Date().toISOString();

/**
 * Isolamento multi-tenant: o usuário B (fazenda B) tenta usar recursos da fazenda A
 * informando IDs no corpo/URL. Nenhuma operação pode afetar ou revelar dados de A.
 */
describe('Isolamento entre fazendas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantA: Tenant;
  let tenantB: Tenant;
  let tokenB: string;

  const asB = (method: 'get' | 'post' | 'patch' | 'delete', path: string) =>
    request(app.getHttpServer())
      [method](`/api/v1${path}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Farm-Id', tenantB.farmId);

  const lotQuantityA = async () =>
    (await prisma.herdLot.findUniqueOrThrow({ where: { id: tenantA.lotId } }))
      .quantity;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    tenantA = await createTenant(prisma, 'A');
    tenantB = await createTenant(prisma, 'B');
    tokenB = (await login(app, tenantB.email, TEST_PASSWORD)).accessToken;
  });

  afterAll(async () => {
    await destroyTenants(prisma, [tenantA, tenantB]);
    await app.close();
  });

  it('não permite usar a fazenda A no header com o token do usuário B', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/herd/lots')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Farm-Id', tenantA.farmId)
      .expect(403);
  });

  it('listagem da fazenda B não contém o lote da fazenda A', async () => {
    const res = await asB('get', '/herd/lots').expect(200);
    const ids = (res.body as Array<{ id: string }>).map((l) => l.id);
    expect(ids).toContain(tenantB.lotId);
    expect(ids).not.toContain(tenantA.lotId);
  });

  describe('recursos de A referenciados por ID retornam 404', () => {
    const cases: Array<{
      name: string;
      method: 'get' | 'post' | 'patch' | 'delete';
      path: string;
      body?: (a: Tenant, b: Tenant) => object;
    }> = [
      { name: 'detalhe do lote', method: 'get', path: '/herd/lots/:lotA' },
      {
        name: 'editar lote',
        method: 'patch',
        path: '/herd/lots/:lotA',
        body: () => ({ name: 'invadido' }),
      },
      { name: 'excluir lote', method: 'delete', path: '/herd/lots/:lotA' },
      {
        name: 'mover lote próprio para retiro de A',
        method: 'patch',
        path: '/herd/lots/:lotB',
        body: (a) => ({ retiroId: a.retiroId }),
      },
      {
        name: 'criar lote em retiro de A',
        method: 'post',
        path: '/herd/lots',
        body: (a) => ({
          name: 'Lote invasor',
          category: 'MATRIZ',
          system: 'CRIA',
          quantity: 1,
          retiroId: a.retiroId,
        }),
      },
      {
        name: 'parto em lote de A',
        method: 'post',
        path: '/herd/births',
        body: (a) => ({
          date: TODAY,
          matricesParidas: 1,
          bezerros: 5,
          bezerras: 5,
          herdLotId: a.lotId,
        }),
      },
      {
        name: 'parto em retiro de A',
        method: 'post',
        path: '/herd/births',
        body: (a) => ({
          date: TODAY,
          matricesParidas: 1,
          bezerros: 1,
          bezerras: 1,
          retiroId: a.retiroId,
        }),
      },
      {
        name: 'mortalidade em lote de A',
        method: 'post',
        path: '/herd/mortalities',
        body: (a) => ({ date: TODAY, quantity: 1, herdLotId: a.lotId }),
      },
      {
        name: 'mortalidade em retiro de A',
        method: 'post',
        path: '/herd/mortalities',
        body: (a) => ({ date: TODAY, quantity: 1, retiroId: a.retiroId }),
      },
      {
        name: 'descarte em lote de A',
        method: 'post',
        path: '/herd/culls',
        body: (a) => ({
          date: TODAY,
          quantity: 1,
          reason: 'IDADE',
          herdLotId: a.lotId,
        }),
      },
      {
        name: 'reposição em lote de A',
        method: 'post',
        path: '/herd/replacements',
        body: (a) => ({
          date: TODAY,
          quantity: 3,
          unitCost: 100,
          herdLotId: a.lotId,
        }),
      },
      {
        name: 'movimentação com destino em lote de A',
        method: 'post',
        path: '/herd/movements',
        body: (a) => ({
          type: 'COMPRA',
          date: TODAY,
          quantity: 5,
          toLotId: a.lotId,
        }),
      },
      {
        name: 'movimentação com origem em lote de A',
        method: 'post',
        path: '/herd/movements',
        body: (a) => ({
          type: 'VENDA',
          date: TODAY,
          quantity: 1,
          fromLotId: a.lotId,
        }),
      },
      {
        name: 'pesagem de lote de A',
        method: 'post',
        path: '/herd/weighings',
        body: (a) => ({
          herdLotId: a.lotId,
          date: TODAY,
          avgWeightKg: 300,
          quantity: 1,
        }),
      },
      {
        name: 'diagnóstico de prenhez em lote de A',
        method: 'post',
        path: '/herd/pregnancy-diagnoses',
        body: (a) => ({
          date: TODAY,
          pregnantCount: 1,
          emptyCount: 0,
          herdLotId: a.lotId,
        }),
      },
      {
        name: 'editar veículo de A',
        method: 'patch',
        path: '/fleet/vehicles/:vehicleA',
        body: () => ({ name: 'invadido' }),
      },
      {
        name: 'abastecimento em veículo de A',
        method: 'post',
        path: '/fleet/fuel',
        body: (a) => ({
          vehicleId: a.vehicleId,
          date: TODAY,
          liters: 10,
          unitPrice: 6,
        }),
      },
      {
        name: 'manutenção em veículo de A',
        method: 'post',
        path: '/fleet/maintenance',
        body: (a) => ({
          vehicleId: a.vehicleId,
          date: TODAY,
          description: 'Troca de óleo',
          cost: 100,
        }),
      },
    ];

    it.each(cases)('$name', async ({ method, path, body }) => {
      const url = path
        .replace(':lotA', tenantA.lotId)
        .replace(':lotB', tenantB.lotId)
        .replace(':vehicleA', tenantA.vehicleId);

      const req = asB(method, url);
      if (body) req.send(body(tenantA, tenantB));
      await req.expect(404);
    });

    it('nenhuma tentativa alterou o lote de A', async () => {
      const lot = await prisma.herdLot.findUniqueOrThrow({
        where: { id: tenantA.lotId },
      });
      expect(lot.quantity).toBe(10);
      expect(lot.deletedAt).toBeNull();
      expect(lot.name).toBe('Lote A');
      expect(await lotQuantityA()).toBe(10);
    });

    it('nenhum registro vazou para a fazenda A', async () => {
      const [births, movements, fuel, lots] = await Promise.all([
        prisma.birthRecord.count({ where: { farmId: tenantA.farmId } }),
        prisma.herdMovement.count({ where: { farmId: tenantA.farmId } }),
        prisma.fuelRecord.count({ where: { farmId: tenantA.farmId } }),
        prisma.herdLot.count({ where: { farmId: tenantB.farmId, retiroId: tenantA.retiroId } }),
      ]);
      expect([births, movements, fuel, lots]).toEqual([0, 0, 0, 0]);
    });
  });

  it('controle positivo: B consegue operar no próprio lote', async () => {
    await asB('post', '/herd/births')
      .send({
        date: TODAY,
        matricesParidas: 1,
        bezerros: 2,
        bezerras: 1,
        herdLotId: tenantB.lotId,
      })
      .expect(201);

    const lotB = await prisma.herdLot.findUniqueOrThrow({
      where: { id: tenantB.lotId },
    });
    expect(lotB.quantity).toBe(13);
  });
});
