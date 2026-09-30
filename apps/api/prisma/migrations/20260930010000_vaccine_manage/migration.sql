-- Vacinas podem ser inativadas; campanhas passam a apontar para a despesa gerada.
ALTER TABLE "Vaccine" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "VaccinationCampaign" ADD COLUMN "expenseId" TEXT;

-- Vincula campanhas antigas à despesa criada por elas (apenas casos sem ambiguidade).
UPDATE "VaccinationCampaign" c
SET "expenseId" = (
  SELECT e."id"
  FROM "Expense" e
  JOIN "Vaccine" v ON v."id" = c."vaccineId"
  WHERE e."farmId" = c."farmId"
    AND e."deletedAt" IS NULL
    AND e."costCenter" = 'SANIDADE'
    AND e."description" = 'Campanha vacinal: ' || v."name"
    AND e."amount" = c."cost"
    AND e."date" = c."date"
  LIMIT 1
)
WHERE c."cost" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "VaccinationCampaign" c2
    WHERE c2."farmId" = c."farmId"
      AND c2."vaccineId" = c."vaccineId"
      AND c2."date" = c."date"
      AND c2."cost" = c."cost"
      AND c2."id" <> c."id"
  );
