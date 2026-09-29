/** Converte TTL estilo JWT (15m, 7d, 1h) em Date futura. */
export function expiresAtFromTtl(
  ttl: string | undefined,
  fallbackMs: number,
): Date {
  const ms = parseTtlMs(ttl) ?? fallbackMs;
  return new Date(Date.now() + ms);
}

export function parseTtlMs(ttl: string | undefined): number | null {
  if (!ttl) return null;
  const match = /^(\d+)([smhd])$/i.exec(ttl.trim());
  if (!match) return null;
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  const mult =
    unit === 's'
      ? 1000
      : unit === 'm'
        ? 60_000
        : unit === 'h'
          ? 3_600_000
          : 86_400_000;
  return n * mult;
}
