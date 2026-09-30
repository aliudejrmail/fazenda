import { formatNumber } from "@/lib/format";
import type { Vaccine } from "@/lib/types";

/** Saldo de doses com aviso "Sem estoque" / "Estoque baixo" (mesma regra do Almoxarifado). */
export function StockCell({ stock }: { stock: Vaccine["stock"] }) {
  if (!stock) return <>—</>;
  const status =
    stock.quantity <= 0
      ? { label: "Sem estoque", cls: "border-red-300/80 bg-red-50 text-red-900" }
      : stock.low
        ? {
            label: "Estoque baixo",
            cls: "border-amber-300/80 bg-amber-50 text-amber-900",
          }
        : null;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {formatNumber(stock.quantity)} {stock.unit}
      {status ? (
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${status.cls}`}
        >
          {status.label}
        </span>
      ) : null}
    </span>
  );
}
