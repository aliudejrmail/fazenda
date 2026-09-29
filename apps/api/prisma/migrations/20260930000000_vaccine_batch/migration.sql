-- Lote do fabricante e validade no cadastro da vacina.
ALTER TABLE "Vaccine" ADD COLUMN "batchNumber" TEXT;
ALTER TABLE "Vaccine" ADD COLUMN "expiryDate" TIMESTAMP(3);
