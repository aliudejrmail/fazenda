export const HERD_CATEGORY_LABELS: Record<string, string> = {
  MATRIZ: "Matriz",
  NOVILHA: "Novilha",
  BEZERRO: "Bezerro",
  BEZERRA: "Bezerra",
  GARROTE: "Garrote",
  BOI_MAGRO: "Boi magro",
  BOI_GORDO: "Boi gordo",
  TOURO: "Touro",
  DESCARTE: "Descarte",
};

export const PRODUCTION_SYSTEM_LABELS: Record<string, string> = {
  CRIA: "Cria",
  RECRIA: "Recria",
  CONFINAMENTO: "Confinamento",
};

export const COST_CENTER_LABELS: Record<string, string> = {
  PROPRIEDADE: "Propriedade",
  CONFINAMENTO: "Confinamento",
  FROTA: "Frota",
  RH: "RH",
  ALMOXARIFADO: "Almoxarifado",
  SANIDADE: "Sanidade",
  OUTROS: "Outros",
};

export const CULL_REASON_LABELS: Record<string, string> = {
  VAZIA_SEM_CRIA: "Vazia sem cria",
  IDADE: "Idade",
  DOENCA: "Doença",
  BAIXA_PRODUTIVIDADE: "Baixa produtividade",
  OUTRO: "Outro",
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  TRANSFERENCIA: "Transferência",
  VENDA: "Venda",
  COMPRA: "Compra",
  AJUSTE: "Ajuste",
};

export const REVENUE_TYPE_LABELS: Record<string, string> = {
  VENDA_GADO: "Venda de gado",
  LEITE: "Leite",
  OUTROS: "Outros",
};

export const INVENTORY_CATEGORY_LABELS: Record<string, string> = {
  RACAO: "Ração",
  MEDICAMENTO: "Medicamento",
  INSUMO: "Insumo",
  PECA: "Peça",
  OUTROS: "Outros",
};

export const STOCK_MOVEMENT_LABELS: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  AJUSTE: "Ajuste",
};

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  TRATOR: "Trator",
  CAMINHAO: "Caminhão",
  UTILITARIO: "Utilitário",
  OUTRO: "Outro",
};

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
};

export const LOT_STATUS_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  ENCERRADO: "Encerrado",
  VENDIDO: "Vendido",
};

export function labelOf(
  map: Record<string, string>,
  value?: string | null,
): string {
  if (!value) return "—";
  return map[value] ?? value;
}

export function formatCurrency(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function formatNumber(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("pt-BR").format(Number.isFinite(n) ? n : 0);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function optionsFrom(
  map: Record<string, string>,
): Array<{ value: string; label: string }> {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}
