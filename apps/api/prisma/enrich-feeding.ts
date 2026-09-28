/**
 * Enriquecimento one-shot: insumos de ração + dieta padrão (DB já semeado).
 * Uso: npx tsx prisma/enrich-feeding.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertItem(
  farmId: string,
  name: string,
  data: {
    category: 'RACAO' | 'INSUMO';
    unit: string;
    quantity: number;
    minQuantity: number;
    avgUnitCost: number;
  },
) {
  const existing = await prisma.inventoryItem.findFirst({
    where: { farmId, name, deletedAt: null },
  });
  if (existing) return existing;
  return prisma.inventoryItem.create({
    data: { farmId, name, ...data },
  });
}

async function main() {
  const farm = await prisma.farm.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  if (!farm) {
    console.log('Nenhuma fazenda encontrada.');
    return;
  }

  const milho = await upsertItem(farm.id, 'Milho', {
    category: 'RACAO',
    unit: 'kg',
    quantity: 6800,
    minQuantity: 1000,
    avgUnitCost: 0.95,
  });
  const nucleo = await upsertItem(farm.id, 'Núcleo', {
    category: 'RACAO',
    unit: 'kg',
    quantity: 1240,
    minQuantity: 200,
    avgUnitCost: 3.8,
  });
  const racao = await upsertItem(farm.id, 'Ração pronta', {
    category: 'RACAO',
    unit: 'kg',
    quantity: 3500,
    minQuantity: 500,
    avgUnitCost: 1.45,
  });
  await upsertItem(farm.id, 'Sal mineral', {
    category: 'INSUMO',
    unit: 'kg',
    quantity: 420,
    minQuantity: 80,
    avgUnitCost: 2.1,
  });

  let diet = await prisma.feedDiet.findFirst({
    where: { farmId: farm.id, name: 'Confinamento padrão', deletedAt: null },
    include: { ingredients: true },
  });

  if (!diet) {
    diet = await prisma.feedDiet.create({
      data: {
        farmId: farm.id,
        name: 'Confinamento padrão',
        description: 'Dieta de engorda 70/20/10',
        kgPerAnimal: 10,
        ingredients: {
          create: [
            { inventoryItemId: milho.id, percent: 70 },
            { inventoryItemId: nucleo.id, percent: 20 },
            { inventoryItemId: racao.id, percent: 10 },
          ],
        },
      },
      include: { ingredients: true },
    });
    console.log('Dieta criada:', diet.name);
  } else {
    console.log('Dieta já existe:', diet.name);
  }

  const confinamento = await prisma.herdLot.findFirst({
    where: {
      farmId: farm.id,
      deletedAt: null,
      system: 'CONFINAMENTO',
      status: 'ATIVO',
    },
    orderBy: { createdAt: 'asc' },
  });

  if (confinamento) {
    const active = await prisma.feedAssignment.findFirst({
      where: { farmId: farm.id, herdLotId: confinamento.id, endDate: null },
    });
    if (!active) {
      await prisma.feedAssignment.create({
        data: {
          farmId: farm.id,
          herdLotId: confinamento.id,
          dietId: diet.id,
          startDate: new Date(),
          kgPerAnimal: 10,
        },
      });
      console.log('Dieta atribuída ao lote:', confinamento.name);
    } else {
      console.log('Lote já tem dieta:', confinamento.name);
    }
  }

  console.log('Enrich feeding OK');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
