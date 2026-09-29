const TICK_COLOR = "#6b655c";

/** Abrevia rótulos longos com reticências (o valor completo continua no tooltip). */
export function truncate(value: unknown, max: number): string {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Props do eixo X de categorias.
 * Celular: todos os rótulos visíveis, inclinados e abreviados (evita sobreposição).
 */
export function categoryAxisProps(narrow: boolean) {
  if (!narrow) {
    return { tick: { fontSize: 11, fill: TICK_COLOR } };
  }
  return {
    interval: 0 as const,
    angle: -35,
    textAnchor: "end" as const,
    height: 58,
    tickMargin: 4,
    tickFormatter: (value: unknown) => truncate(value, 9),
    tick: { fontSize: 10, fill: TICK_COLOR },
  };
}

/** Eixo Y numérico: mais estreito no celular para sobrar espaço ao gráfico. */
export function valueAxisProps(narrow: boolean) {
  return {
    width: narrow ? 32 : 60, // 60 = padrão do Recharts
    tick: { fontSize: narrow ? 10 : 11, fill: TICK_COLOR },
  };
}
