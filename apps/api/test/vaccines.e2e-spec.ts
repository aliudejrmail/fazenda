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

const DAY = '2026-09-29';

type VaccineRow = {
  id: string;
  active: boolean;
  canDelete: boolean;
  stock: { itemId: string; quantity: number; low: boolean } | null;
};
type CampaignRow = { id: string; expenseId: string | null };

/**
 * Vacinas e campanhas: exclusão só sem histórico, despesa de Sanidade em
 * sincronia e baixa de doses no Almoxarifado.
 */
describe('Vacinas e campanhas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantA: Tenant;
  let tenantB: Tenant;
  let api: ApiClient;
  let apiB: ApiClient;

  const createVaccine = async (body: object) =>
    (await api('post', '/vaccines').send(body).expect(201)).body as VaccineRow;

  const createCampaign = (vaccineId: string, extra: object = {}) =>
    api('post', '/vaccines/campaigns').send({
      vaccineId,
      date: DAY,
      doses: 1,
      ...extra,
    });

  const listVaccine = async (id: string) =>
    ((await api('get', '/vaccines').expect(200)).body as VaccineRow[]).find(
      (v) => v.id === id,
    )!;

  const itemQuantity = async (itemId: string) =>
    Number(
      (await prisma.inventoryItem.findUniqueOrThrow({ where: { id: itemId } }))
        .quantity,
    );

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    tenantA = await createTenant(prisma, 'VACA');
    tenantB = await createTenant(prisma, 'VACB');
    const a = await login(app, tenantA.email, TEST_PASSWORD);
    const b = await login(app, tenantB.email, TEST_PASSWORD);
    api = apiClient(app, a.accessToken, tenantA.farmId);
    apiB = apiClient(app, b.accessToken, tenantB.farmId);
  });

  afterAll(async () => {
    await destroyTenants(prisma, [tenantA, tenantB]);
    await app.close();
  });

  describe('cadastro, inativação e exclusão', () => {
    it('edita e limpa campos opcionais (null limpa, ausente mantém)', async () => {
      const v = await createVaccine({
        name: 'Aftosa',
        batchNumber: 'A1',
        expiryDate: '2027-05-01',
        manufacturer: 'MSD',
      });

      const res = await api('patch', `/vaccines/${v.id}`)
        .send({ batchNumber: 'B2', expiryDate: null })
        .expect(200);
      expect(res.body.batchNumber).toBe('B2');
      expect(res.body.expiryDate).toBeNull();
      expect(res.body.manufacturer).toBe('MSD');
    });

    it('excluir com campanha retorna 409; inativar é permitido; sem campanhas exclui', async () => {
      const v = await createVaccine({ name: 'Brucelose' });
      const c = (await createCampaign(v.id).expect(201)).body as CampaignRow;

      const blocked = await api('delete', `/vaccines/${v.id}`).expect(409);
      expect(blocked.body.message).toMatch(/campanha/i);
      expect((await listVaccine(v.id)).canDelete).toBe(false);

      await api('patch', `/vaccines/${v.id}`).send({ active: false }).expect(200);
      await api('delete', `/vaccines/campaigns/${c.id}`).expect(200);
      await api('delete', `/vaccines/${v.id}`).expect(200);
      expect(await prisma.vaccine.findUnique({ where: { id: v.id } })).toBeNull();
    });

    it('vacina inativa não entra em novas campanhas', async () => {
      const v = await createVaccine({ name: 'Raiva' });
      await api('patch', `/vaccines/${v.id}`).send({ active: false }).expect(200);
      await createCampaign(v.id).expect(400);

      await api('patch', `/vaccines/${v.id}`).send({ active: true }).expect(200);
      await createCampaign(v.id).expect(201);
    });

    it('recusa campanha com vacina vencida na data da aplicação', async () => {
      const v = await createVaccine({ name: 'Clostridiose' });
      await createCampaign(v.id, { expiryDate: '2026-01-01' }).expect(400);

      // herda a validade do cadastro quando não informada
      const vencida = await createVaccine({
        name: 'Leptospirose',
        expiryDate: '2026-01-01',
      });
      await createCampaign(vencida.id).expect(400);
    });

    it('campanha herda lote e validade do cadastro da vacina', async () => {
      const v = await createVaccine({
        name: 'IBR',
        batchNumber: 'L-99',
        expiryDate: '2027-12-31',
      });
      const res = await createCampaign(v.id).expect(201);
      expect(res.body.batchNumber).toBe('L-99');
      expect(res.body.expiryDate).toMatch(/^2027-12-31/);
    });
  });

  describe('despesa de Sanidade acompanha a campanha', () => {
    it('cria, atualiza, remove com custo 0 e libera ao excluir', async () => {
      const v = await createVaccine({ name: 'Botulismo' });
      const c = (await createCampaign(v.id, { cost: 100 }).expect(201))
        .body as CampaignRow;
      expect(c.expenseId).toBeTruthy();

      const expense = () =>
        prisma.expense.findUniqueOrThrow({ where: { id: c.expenseId! } });
      expect(Number((await expense()).amount)).toBe(100);

      await api('patch', `/vaccines/campaigns/${c.id}`)
        .send({ cost: 250 })
        .expect(200);
      const updated = await expense();
      expect(Number(updated.amount)).toBe(250);
      expect(updated.deletedAt).toBeNull();

      await api('patch', `/vaccines/campaigns/${c.id}`)
        .send({ cost: 0 })
        .expect(200);
      expect((await expense()).deletedAt).not.toBeNull();

      // custo volta a existir: nova despesa, sem duplicar a antiga ativa
      const again = (
        await api('patch', `/vaccines/campaigns/${c.id}`)
          .send({ cost: 80 })
          .expect(200)
      ).body as CampaignRow;
      const active = await prisma.expense.count({
        where: {
          farmId: tenantA.farmId,
          description: 'Campanha vacinal: Botulismo',
          deletedAt: null,
        },
      });
      expect(active).toBe(1);

      await api('delete', `/vaccines/campaigns/${c.id}`).expect(200);
      const left = await prisma.expense.findUniqueOrThrow({
        where: { id: again.expenseId! },
      });
      expect(left.deletedAt).not.toBeNull();
    });
  });

  describe('estoque de doses (Almoxarifado)', () => {
    it('criar com estoque inicial gera item e alerta de estoque baixo', async () => {
      const v = await createVaccine({
        name: 'Estoque Basico',
        stockDoses: 10,
        minStockDoses: 4,
      });
      const row = await listVaccine(v.id);
      expect(row.stock).toMatchObject({ quantity: 10, low: false });

      await createCampaign(v.id, { doses: 7 }).expect(201);
      expect(await listVaccine(v.id)).toMatchObject({
        stock: { quantity: 3, low: true },
      });
    });

    it('baixa ao criar, recalcula ao editar e devolve ao excluir', async () => {
      const v = await createVaccine({ name: 'Ciclo Completo', stockDoses: 20 });
      const itemId = (await listVaccine(v.id)).stock!.itemId;

      const c = (await createCampaign(v.id, { doses: 8 }).expect(201))
        .body as CampaignRow;
      expect(await itemQuantity(itemId)).toBe(12);
      expect(
        await prisma.stockMovement.count({
          where: { campaignId: c.id, type: 'SAIDA' },
        }),
      ).toBe(1);

      await api('patch', `/vaccines/campaigns/${c.id}`)
        .send({ doses: 12 })
        .expect(200);
      expect(await itemQuantity(itemId)).toBe(8);
      expect(await prisma.stockMovement.count({ where: { campaignId: c.id } })).toBe(1);

      await api('delete', `/vaccines/campaigns/${c.id}`).expect(200);
      expect(await itemQuantity(itemId)).toBe(20);
      expect(await prisma.stockMovement.count({ where: { campaignId: c.id } })).toBe(0);
    });

    it('saldo insuficiente retorna 400 e não altera nada (criar e editar)', async () => {
      const v = await createVaccine({ name: 'Saldo Curto', stockDoses: 5 });
      const itemId = (await listVaccine(v.id)).stock!.itemId;

      const tooMuch = await createCampaign(v.id, { doses: 6 }).expect(400);
      expect(tooMuch.body.message).toMatch(/estoque insuficiente/i);
      expect(await itemQuantity(itemId)).toBe(5);
      expect(
        await prisma.vaccinationCampaign.count({ where: { vaccineId: v.id } }),
      ).toBe(0);

      const c = (await createCampaign(v.id, { doses: 3 }).expect(201))
        .body as CampaignRow;
      await api('patch', `/vaccines/campaigns/${c.id}`)
        .send({ doses: 9 })
        .expect(400);
      // a edição falhou: continua com 3 doses baixadas
      expect(await itemQuantity(itemId)).toBe(2);
      const stored = await prisma.vaccinationCampaign.findUniqueOrThrow({
        where: { id: c.id },
      });
      expect(stored.doses).toBe(3);
    });

    it('trocar de vacina devolve ao item antigo e baixa do novo', async () => {
      const a = await createVaccine({ name: 'Troca A', stockDoses: 10 });
      const b = await createVaccine({ name: 'Troca B', stockDoses: 10 });
      const itemA = (await listVaccine(a.id)).stock!.itemId;
      const itemB = (await listVaccine(b.id)).stock!.itemId;

      const c = (await createCampaign(a.id, { doses: 4 }).expect(201))
        .body as CampaignRow;
      await api('patch', `/vaccines/campaigns/${c.id}`)
        .send({ vaccineId: b.id })
        .expect(200);

      expect(await itemQuantity(itemA)).toBe(10);
      expect(await itemQuantity(itemB)).toBe(6);
    });

    it('campanha antiga (sem baixa) não consome estoque ao ser editada', async () => {
      const v = await createVaccine({ name: 'Legado' });
      const c = (await createCampaign(v.id, { doses: 5 }).expect(201))
        .body as CampaignRow;

      // vacina passa a controlar estoque depois de a campanha existir
      const item = await prisma.inventoryItem.create({
        data: {
          farmId: tenantA.farmId,
          name: 'Legado (doses)',
          category: 'MEDICAMENTO',
          unit: 'dose',
          quantity: 10,
        },
      });
      await api('patch', `/vaccines/${v.id}`)
        .send({ inventoryItemId: item.id })
        .expect(200);

      await api('patch', `/vaccines/campaigns/${c.id}`)
        .send({ notes: 'ajuste de observação' })
        .expect(200);
      expect(await itemQuantity(item.id)).toBe(10);
    });

    it('estoque inicial e item existente juntos retornam 400; desligar mantém o item', async () => {
      const base = await createVaccine({ name: 'Origem', stockDoses: 5 });
      const itemId = (await listVaccine(base.id)).stock!.itemId;

      await api('post', '/vaccines')
        .send({ name: 'Conflito', inventoryItemId: itemId, stockDoses: 3 })
        .expect(400);

      const linked = await createVaccine({
        name: 'Ligada',
        inventoryItemId: itemId,
      });
      await api('patch', `/vaccines/${linked.id}`)
        .send({ inventoryItemId: null })
        .expect(200);
      expect((await listVaccine(linked.id)).stock).toBeNull();
      expect(await itemQuantity(itemId)).toBe(5);
    });

    it('não permite ajustar o estoque inicial pela vacina já ligada', async () => {
      const v = await createVaccine({ name: 'Ja Ligada', stockDoses: 5 });
      await api('patch', `/vaccines/${v.id}`).send({ stockDoses: 50 }).expect(400);
    });
  });

  describe('isolamento entre fazendas', () => {
    it('B não acessa vacina, campanha nem item de estoque de A', async () => {
      const v = await createVaccine({ name: 'Privada A', stockDoses: 5 });
      const itemId = (await listVaccine(v.id)).stock!.itemId;
      const c = (await createCampaign(v.id).expect(201)).body as CampaignRow;

      await apiB('patch', `/vaccines/${v.id}`).send({ active: false }).expect(404);
      await apiB('delete', `/vaccines/${v.id}`).expect(404);
      await apiB('patch', `/vaccines/campaigns/${c.id}`).send({ doses: 2 }).expect(404);
      await apiB('delete', `/vaccines/campaigns/${c.id}`).expect(404);
      await apiB('post', '/vaccines')
        .send({ name: 'Invasora', inventoryItemId: itemId })
        .expect(404);
      await apiB('post', '/vaccines/campaigns')
        .send({ vaccineId: v.id, date: DAY, doses: 1 })
        .expect(404);

      expect((await listVaccine(v.id)).active).toBe(true);
    });
  });
});
