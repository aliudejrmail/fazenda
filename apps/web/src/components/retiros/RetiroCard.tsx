import Link from "next/link";
import type { Retiro } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { RetiroActions } from "./RetiroActions";

type Props = {
  retiro: Retiro;
  onEdit: (retiro: Retiro) => void;
  onChanged: () => void | Promise<void>;
  onError: (message: string) => void;
};

export function RetiroCard({ retiro: r, onEdit, onChanged, onError }: Props) {
  const heads = r.herdLots?.reduce((s, l) => s + l.quantity, 0) ?? 0;
  const inactive = r.active === false;

  return (
    <div
      className={`ui-surface flex flex-col transition hover:border-[var(--green-soft)]/40 hover:shadow-[var(--shadow-md)] ${inactive ? "opacity-75" : ""}`}
    >
      <Link href={`/retiros/${r.id}`} className="group block flex-1 p-5 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--green)]">
            {r.name}
          </h3>
          {inactive ? (
            <span className="rounded-full border border-[var(--line-strong)] bg-[var(--cream-deep)] px-2 py-0.5 text-xs font-medium text-[var(--ink-muted)]">
              Inativo
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          {formatNumber(heads)} animais ·{" "}
          {formatNumber(r._count?.herdLots ?? r.herdLots?.length ?? 0)} lotes
        </p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          Prenhes: {formatNumber(r.matricesPregnant ?? 0)} · Vazias:{" "}
          {formatNumber(r.matricesEmpty ?? 0)}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--earth)] transition group-hover:gap-2">
          Abrir retiro
          <span aria-hidden>→</span>
        </span>
      </Link>
      <div className="flex flex-wrap gap-2 px-5 pb-5 empty:hidden">
        <RetiroActions
          retiro={r}
          onEdit={() => onEdit(r)}
          onToggled={onChanged}
          onDeleted={onChanged}
          onError={onError}
        />
      </div>
    </div>
  );
}
