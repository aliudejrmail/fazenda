-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN "feedRecordId" TEXT;

-- CreateTable
CREATE TABLE "FeedDiet" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kgPerAnimal" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FeedDiet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedDietIngredient" (
    "id" TEXT NOT NULL,
    "dietId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "percent" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "FeedDietIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedAssignment" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "herdLotId" TEXT NOT NULL,
    "dietId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "kgPerAnimal" DECIMAL(10,3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedRecord" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "herdLotId" TEXT NOT NULL,
    "dietId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "animals" INTEGER NOT NULL,
    "kgPerAnimal" DECIMAL(10,3) NOT NULL,
    "totalKg" DECIMAL(14,3) NOT NULL,
    "totalCost" DECIMAL(14,2) NOT NULL,
    "costPerKg" DECIMAL(12,4) NOT NULL,
    "costPerAnimal" DECIMAL(12,4) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedDiet_farmId_name_key" ON "FeedDiet"("farmId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FeedDietIngredient_dietId_inventoryItemId_key" ON "FeedDietIngredient"("dietId", "inventoryItemId");

-- CreateIndex
CREATE INDEX "FeedAssignment_farmId_herdLotId_idx" ON "FeedAssignment"("farmId", "herdLotId");

-- CreateIndex
CREATE INDEX "FeedRecord_farmId_date_idx" ON "FeedRecord"("farmId", "date");

-- CreateIndex
CREATE INDEX "FeedRecord_herdLotId_date_idx" ON "FeedRecord"("herdLotId", "date");

-- CreateIndex
CREATE INDEX "StockMovement_feedRecordId_idx" ON "StockMovement"("feedRecordId");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_feedRecordId_fkey" FOREIGN KEY ("feedRecordId") REFERENCES "FeedRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedDiet" ADD CONSTRAINT "FeedDiet_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedDietIngredient" ADD CONSTRAINT "FeedDietIngredient_dietId_fkey" FOREIGN KEY ("dietId") REFERENCES "FeedDiet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedDietIngredient" ADD CONSTRAINT "FeedDietIngredient_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedAssignment" ADD CONSTRAINT "FeedAssignment_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedAssignment" ADD CONSTRAINT "FeedAssignment_herdLotId_fkey" FOREIGN KEY ("herdLotId") REFERENCES "HerdLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedAssignment" ADD CONSTRAINT "FeedAssignment_dietId_fkey" FOREIGN KEY ("dietId") REFERENCES "FeedDiet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedRecord" ADD CONSTRAINT "FeedRecord_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedRecord" ADD CONSTRAINT "FeedRecord_herdLotId_fkey" FOREIGN KEY ("herdLotId") REFERENCES "HerdLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedRecord" ADD CONSTRAINT "FeedRecord_dietId_fkey" FOREIGN KEY ("dietId") REFERENCES "FeedDiet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
