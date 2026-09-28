-- CreateTable
CREATE TABLE "Retiro" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "matricesPregnant" INTEGER NOT NULL DEFAULT 0,
    "matricesEmpty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Retiro_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "HerdLot" ADD COLUMN "retiroId" TEXT;

-- AlterTable
ALTER TABLE "BirthRecord" ADD COLUMN "retiroId" TEXT;

-- AlterTable
ALTER TABLE "MortalityRecord" ADD COLUMN "retiroId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Retiro_farmId_name_key" ON "Retiro"("farmId", "name");

-- AddForeignKey
ALTER TABLE "Retiro" ADD CONSTRAINT "Retiro_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HerdLot" ADD CONSTRAINT "HerdLot_retiroId_fkey" FOREIGN KEY ("retiroId") REFERENCES "Retiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BirthRecord" ADD CONSTRAINT "BirthRecord_retiroId_fkey" FOREIGN KEY ("retiroId") REFERENCES "Retiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MortalityRecord" ADD CONSTRAINT "MortalityRecord_retiroId_fkey" FOREIGN KEY ("retiroId") REFERENCES "Retiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
