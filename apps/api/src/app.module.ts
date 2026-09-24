import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FarmsModule } from './farms/farms.module';
import { HerdModule } from './herd/herd.module';
import { FinanceModule } from './finance/finance.module';
import { VaccinesModule } from './vaccines/vaccines.module';
import { InventoryModule } from './inventory/inventory.module';
import { FleetModule } from './fleet/fleet.module';
import { EmployeesModule } from './employees/employees.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FarmsModule,
    HerdModule,
    FinanceModule,
    VaccinesModule,
    InventoryModule,
    FleetModule,
    EmployeesModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
