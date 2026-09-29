-- Retiros podem ser inativados (histórico preservado, sem novos lançamentos).
ALTER TABLE "Retiro" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- A exclusão passa a ser definitiva. Retiros já excluídos (soft delete) tinham o
-- nome reservado pela chave única (farmId, name); renomeia para liberar o nome.
UPDATE "Retiro"
SET "name" = "name" || ' (excluído ' || "id" || ')'
WHERE "deletedAt" IS NOT NULL;
