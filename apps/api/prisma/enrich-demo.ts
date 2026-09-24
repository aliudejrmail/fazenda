import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const farm = await prisma.farm.findFirst({ where: { deletedAt: null } });
  if (!farm) throw new Error('no farm');

  const lot = await prisma.herdLot.findFirst({
    where: { farmId: farm.id, system: 'CONFINAMENTO' },
  });
  const matriz = await prisma.herdLot.findFirst({
    where: { farmId: farm.id, category: 'MATRIZ' },
  });
  const vaccine = await prisma.vaccine.findFirst({
    where: { farmId: farm.id },
  });

  if (lot) {
    const count = await prisma.lotWeighing.count({
      where: { herdLotId: lot.id },
    });
    if (count === 0) {
      const d2 = new Date();
      d2.setMonth(d2.getMonth() - 2);
      const d1 = new Date();
      d1.setMonth(d1.getMonth() - 1);
      await prisma.lotWeighing.createMany({
        data: [
          {
            farmId: farm.id,
            herdLotId: lot.id,
            date: d2,
            avgWeightKg: 320,
            quantity: 80,
          },
          {
            farmId: farm.id,
            herdLotId: lot.id,
            date: d1,
            avgWeightKg: 355,
            quantity: 80,
          },
          {
            farmId: farm.id,
            herdLotId: lot.id,
            date: new Date(),
            avgWeightKg: 390,
            quantity: 80,
          },
        ],
      });
      console.log('weighings added');
    } else {
      console.log('weighings exist');
    }
  }

  if (vaccine && matriz) {
    const camp = await prisma.vaccinationCampaign.count({
      where: { farmId: farm.id },
    });
    if (camp === 0) {
      const next = new Date();
      next.setDate(next.getDate() + 5);
      await prisma.vaccinationCampaign.create({
        data: {
          farmId: farm.id,
          vaccineId: vaccine.id,
          herdLotId: matriz.id,
          date: new Date(),
          nextDueDate: next,
          doses: 120,
          cost: 1800,
        },
      });
      console.log('campaign added');
    } else {
      console.log('campaign exists');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
