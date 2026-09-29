-- Rastreabilidade: lote do fabricante e validade da vacina aplicada na campanha.
ALTER TABLE "VaccinationCampaign" ADD COLUMN "batchNumber" TEXT;
ALTER TABLE "VaccinationCampaign" ADD COLUMN "expiryDate" TIMESTAMP(3);
