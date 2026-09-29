-- Refresh tokens passam a ser opacos e armazenados apenas como hash.
-- Tokens antigos (texto puro) são descartados: sessões existentes exigirão novo login.
DELETE FROM "RefreshToken";

DROP INDEX "RefreshToken_token_key";

ALTER TABLE "RefreshToken"
  DROP COLUMN "token",
  ADD COLUMN "tokenHash" TEXT NOT NULL,
  ADD COLUMN "familyId" TEXT NOT NULL,
  ADD COLUMN "usedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");