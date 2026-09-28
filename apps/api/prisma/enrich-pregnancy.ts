/**
 * Diagnósticos de prenhez iniciais a partir dos retiros.
 * Uso: npx tsx prisma/enrich-pregnancy.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const farm = await prisma.farm.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  if (!farm) {
    console.log('Nenhuma fazenda encontrada.');
    return;
  }

  const existing = await prisma.pregnancyDiagnosis.count({
    where: { farmId: farm.id },
  });
  if (existing > 0) {
    console.log(`Já existem ${existing} diagnósticos. Skip.`);
    return;
  }

  const retiros = await prisma.retiro.findMany({
    where: { farmId: farm.id, deletedAt: null },
    orderBy: { name: 'asc' },
  });

  for (const r of retiros) {
    if (r.matricesPregnant + r.matricesEmpty === 0) continue;
    await prisma.pregnancyDiagnosis.create({
      data: {
        farmId: farm.id,
        retiroId: r.id,
        date: new Date(),
        pregnantCount: r.matricesPregnant,
        emptyCount: r.matricesEmpty,
        method: 'PALPACAO',
        notes: 'Diagnóstico inicial (enrich)',
      },
    });
    console.log(
      `${r.name}: ${r.matricesPregnant} prenhes / ${r.matricesEmpty} vazias`,
    );
  }

  console.log('Enrich pregnancy OK');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
