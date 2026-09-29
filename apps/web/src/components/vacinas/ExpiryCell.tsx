import { formatDate } from "@/lib/format";

const DAY_MS = 24 * 60 * 60 * 1000;
const WARN_DAYS = 30;

/** Validade com aviso: "Vencida" ou "Vence em breve" (até 30 dias). */
export function ExpiryCell({ value }: { value?: string | null }) {
  if (!value) return <>—</>;
  const days = Math.floor((new Date(value).getTime() - Date.now()) / DAY_MS);
  const status =
    days < 0
      ? { label: "Vencida", cls: "border-red-300/80 bg-red-50 text-red-900" }
      : days <= WARN_DAYS
        ? {
            label: "Vence em breve",
            cls: "border-amber-300/80 bg-amber-50 text-amber-900",
          }
        : null;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {formatDate(value)}
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
