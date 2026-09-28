import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const farm = await prisma.farm.findFirst({ where: { deletedAt: null } });
  if (!farm) return;

  const count = await prisma.retiro.count({
    where: { farmId: farm.id, deletedAt: null },
  });
  if (count > 0) {
    console.log('Retiros já existem');
    return;
  }

  const r1 = await prisma.retiro.create({
    data: {
      farmId: farm.id,
      name: 'Retiro 01',
      matricesPregnant: 90,
      matricesEmpty: 30,
    },
  });
  await prisma.retiro.createMany({
    data: [
      { farmId: farm.id, name: 'Retiro 02', matricesPregnant: 60, matricesEmpty: 20 },
      { farmId: farm.id, name: 'Retiro 03', matricesPregnant: 40, matricesEmpty: 15 },
      { farmId: farm.id, name: 'Retiro 04', matricesPregnant: 25, matricesEmpty: 10 },
    ],
  });

  await prisma.herdLot.updateMany({
    where: { farmId: farm.id, category: 'MATRIZ', deletedAt: null },
    data: { retiroId: r1.id },
  });

  console.log('Retiros criados e matrizes vinculadas ao Retiro 01');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
