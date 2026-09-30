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

type VehicleRow = {
  id: string;
  name: string;
  active: boolean;
  canDelete: boolean;
};

/**
 * Frota: inativar (sem novos lançamentos) e excluir só sem abastecimento
 * nem manutenção.
 */
describe('Frota: inativar e excluir veículos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenant: Tenant;
  let api: ApiClient;

  const createVehicle = async (name: string) =>
    (
      await api('post', '/fleet/vehicles')
        .send({ name, type: 'TRATOR' })
        .expect(201)
    ).body as VehicleRow;

  const listVehicle = async (id: string) =>
    ((await api('get', '/fleet/vehicles').expect(200)).body as VehicleRow[]).find(
      (v) => v.id === id,
    )!;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    tenant = await createTenant(prisma, 'FLT');
    const { accessToken } = await login(app, tenant.email, TEST_PASSWORD);
    api = apiClient(app, accessToken, tenant.farmId);
  });

  afterAll(async () => {
    await destroyTenants(prisma, [tenant]);
    await app.close();
  });

  it('edita dados do veículo', async () => {
    const v = await createVehicle('Trator Editar');
    const res = await api('patch', `/fleet/vehicles/${v.id}`)
      .send({ plate: 'ABC1D23', year: 2020, notes: 'revisado' })
      .expect(200);
    expect(res.body.plate).toBe('ABC1D23');
    expect(res.body.year).toBe(2020);
  });

  it('inativo continua na lista, mas não recebe abastecimento nem manutenção', async () => {
    const v = await createVehicle('Trator Inativo');
    await api('patch', `/fleet/vehicles/${v.id}`)
      .send({ active: false })
      .expect(200);
    expect((await listVehicle(v.id)).active).toBe(false);

    const fuel = await api('post', '/fleet/fuel').send({
      vehicleId: v.id,
      date: '2026-09-29',
      liters: 10,
      unitPrice: 6.5,
    });
    expect(fuel.status).toBe(400);

    const maint = await api('post', '/fleet/maintenance').send({
      vehicleId: v.id,
      date: '2026-09-29',
      description: 'Troca de óleo',
      cost: 200,
    });
    expect(maint.status).toBe(400);

    await api('patch', `/fleet/vehicles/${v.id}`)
      .send({ active: true })
      .expect(200);
    await api('post', '/fleet/fuel')
      .send({
        vehicleId: v.id,
        date: '2026-09-29',
        liters: 10,
        unitPrice: 6.5,
      })
      .expect(201);
  });

  it('bloqueia exclusão com abastecimento; depois com manutenção; libera sem vínculos', async () => {
    const v = await createVehicle('Trator Para Excluir');

    await api('post', '/fleet/fuel')
      .send({
        vehicleId: v.id,
        date: '2026-09-29',
        liters: 5,
        unitPrice: 6,
      })
      .expect(201);
    const withFuel = await api('delete', `/fleet/vehicles/${v.id}`).expect(409);
    expect(withFuel.body.message).toMatch(/abastecimento/i);
    expect((await listVehicle(v.id)).canDelete).toBe(false);

    await prisma.fuelRecord.deleteMany({ where: { vehicleId: v.id } });
    await prisma.expense.deleteMany({
      where: { farmId: tenant.farmId, description: { startsWith: 'Combustível: Trator Para Excluir' } },
    });

    await api('post', '/fleet/maintenance')
      .send({
        vehicleId: v.id,
        date: '2026-09-29',
        description: 'Pneu',
        cost: 80,
      })
      .expect(201);
    const withMaint = await api('delete', `/fleet/vehicles/${v.id}`).expect(409);
    expect(withMaint.body.message).toMatch(/manuten/i);

    await prisma.maintenanceRecord.deleteMany({ where: { vehicleId: v.id } });
    await prisma.expense.deleteMany({
      where: { farmId: tenant.farmId, description: { startsWith: 'Manutenção: Trator Para Excluir' } },
    });

    await api('delete', `/fleet/vehicles/${v.id}`).expect(200);
    await api('get', '/fleet/vehicles').expect(200);
    expect(
      await prisma.vehicle.findUnique({ where: { id: v.id } }),
    ).toBeNull();
  });

  it('exclui de imediato um veículo sem lançamentos', async () => {
    const v = await createVehicle('Trator Vazio');
    expect((await listVehicle(v.id)).canDelete).toBe(true);
    await api('delete', `/fleet/vehicles/${v.id}`).expect(200);
  });
});
