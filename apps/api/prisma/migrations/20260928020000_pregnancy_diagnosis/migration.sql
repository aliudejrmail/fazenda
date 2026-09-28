-- CreateEnum
CREATE TYPE "PregnancyMethod" AS ENUM ('ULTRASSOM', 'PALPACAO', 'OUTRO');

-- CreateTable
CREATE TABLE "PregnancyDiagnosis" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "retiroId" TEXT,
    "herdLotId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "pregnantCount" INTEGER NOT NULL,
    "emptyCount" INTEGER NOT NULL,
    "method" "PregnancyMethod" NOT NULL DEFAULT 'PALPACAO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PregnancyDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PregnancyDiagnosis_farmId_date_idx" ON "PregnancyDiagnosis"("farmId", "date");

-- CreateIndex
CREATE INDEX "PregnancyDiagnosis_retiroId_date_idx" ON "PregnancyDiagnosis"("retiroId", "date");

-- AddForeignKey
ALTER TABLE "PregnancyDiagnosis" ADD CONSTRAINT "PregnancyDiagnosis_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PregnancyDiagnosis" ADD CONSTRAINT "PregnancyDiagnosis_retiroId_fkey" FOREIGN KEY ("retiroId") REFERENCES "Retiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PregnancyDiagnosis" ADD CONSTRAINT "PregnancyDiagnosis_herdLotId_fkey" FOREIGN KEY ("herdLotId") REFERENCES "HerdLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
