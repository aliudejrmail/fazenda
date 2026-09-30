-- Estoque de doses: vacina ligada a um item do Almoxarifado; baixa por campanha.
ALTER TABLE "Vaccine" ADD COLUMN "inventoryItemId" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN "campaignId" TEXT;

CREATE INDEX "Vaccine_inventoryItemId_idx" ON "Vaccine"("inventoryItemId");

ALTER TABLE "Vaccine" ADD CONSTRAINT "Vaccine_inventoryItemId_fkey"
  FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "VaccinationCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
