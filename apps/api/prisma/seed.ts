import { PrismaClient, MembershipRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@fazenda.local' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@fazenda.local',
      passwordHash,
    },
  });

  let farm = await prisma.farm.findFirst({
    where: { name: 'Fazenda Modelo', deletedAt: null },
  });

  if (!farm) {
    farm = await prisma.farm.create({
      data: {
        name: 'Fazenda Modelo',
        city: 'Campo Grande',
        state: 'MS',
        memberships: {
          create: { userId: user.id, role: MembershipRole.OWNER },
        },
        expenseCategories: {
          create: [
            { name: 'Custos da propriedade', costCenter: 'PROPRIEDADE' },
            { name: 'Custos do confinamento', costCenter: 'CONFINAMENTO' },
            { name: 'Combustível', costCenter: 'FROTA' },
            { name: 'Manutenção de frota', costCenter: 'FROTA' },
            { name: 'Folha de pagamento', costCenter: 'RH' },
            { name: 'Almoxarifado', costCenter: 'ALMOXARIFADO' },
            { name: 'Sanidade / vacinas', costCenter: 'SANIDADE' },
          ],
        },
      },
    });
  } else {
    await prisma.membership.upsert({
      where: { userId_farmId: { userId: user.id, farmId: farm.id } },
      update: {},
      create: { userId: user.id, farmId: farm.id, role: MembershipRole.OWNER },
    });
  }

  const lotCount = await prisma.herdLot.count({ where: { farmId: farm.id } });
  if (lotCount === 0) {
    const matrizes = await prisma.herdLot.create({
      data: {
        farmId: farm.id,
        name: 'Matrizes Pasto Norte',
        category: 'MATRIZ',
        system: 'CRIA',
        quantity: 120,
      },
    });
    await prisma.herdLot.create({
      data: {
        farmId: farm.id,
        name: 'Bezerros Desmama',
        category: 'BEZERRO',
        system: 'RECRIA',
        quantity: 45,
      },
    });
    const confinamento = await prisma.herdLot.create({
      data: {
        farmId: farm.id,
        name: 'Confinamento Lote A',
        category: 'BOI_MAGRO',
        system: 'CONFINAMENTO',
        quantity: 80,
      },
    });

    await prisma.birthRecord.create({
      data: {
        farmId: farm.id,
        herdLotId: matrizes.id,
        date: new Date(),
        matricesParidas: 8,
        bezerros: 4,
        bezerras: 4,
      },
    });

    const vaccine = await prisma.vaccine.create({
      data: {
        farmId: farm.id,
        name: 'Aftosa',
        manufacturer: 'MSD',
      },
    });

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    await prisma.vaccinationCampaign.create({
      data: {
        farmId: farm.id,
        vaccineId: vaccine.id,
        herdLotId: matrizes.id,
        date: new Date(),
        nextDueDate: nextWeek,
        doses: 120,
        cost: 1800,
      },
    });

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    await prisma.lotWeighing.createMany({
      data: [
        {
          farmId: farm.id,
          herdLotId: confinamento.id,
          date: twoMonthsAgo,
          avgWeightKg: 320,
          quantity: 80,
        },
        {
          farmId: farm.id,
          herdLotId: confinamento.id,
          date: oneMonthAgo,
          avgWeightKg: 355,
          quantity: 80,
        },
        {
          farmId: farm.id,
          herdLotId: confinamento.id,
          date: new Date(),
          avgWeightKg: 390,
          quantity: 80,
        },
      ],
    });


    await prisma.vehicle.create({
      data: {
        farmId: farm.id,
        name: 'Trator John Deere',
        type: 'TRATOR',
        year: 2018,
      },
    });

    await prisma.employee.create({
      data: {
        farmId: farm.id,
        name: 'João Silva',
        role: 'Vaqueiro',
        salary: 2500,
      },
    });

    await prisma.inventoryItem.create({
      data: {
        farmId: farm.id,
        name: 'Ração confinamento',
        category: 'RACAO',
        unit: 'kg',
        quantity: 5000,
        minQuantity: 1000,
        avgUnitCost: 1.25,
      },
    });

    await prisma.expense.create({
      data: {
        farmId: farm.id,
        costCenter: 'CONFINAMENTO',
        description: 'Ração do mês',
        amount: 15000,
        date: new Date(),
      },
    });

    await prisma.revenue.create({
      data: {
        farmId: farm.id,
        type: 'VENDA_GADO',
        description: 'Venda parcial confinamento',
        amount: 42000,
        date: new Date(),
        quantity: 20,
        weightArroba: 360,
      },
    });
  }

  console.log('Seed OK');
  console.log('Login: admin@fazenda.local / admin123');
  console.log(`Fazenda: ${farm.name} (${farm.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
