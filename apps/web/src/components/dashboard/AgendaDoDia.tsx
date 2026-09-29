import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icons";
import { formatDate } from "@/lib/format";
import type { DashboardSummary, PendencyKind } from "@/lib/types";
import { StatusPill } from "./DashBits";

type Pendency = DashboardSummary["pendencies"][number];

/** Ícone e destino por `kind` (contrato com dashboard.service). Record garante cobertura de novos kinds. */
const KIND_TARGETS: Record<PendencyKind, { icon: IconName; href: string }> = {
  VACCINE: { icon: "vaccine", href: "/vacinas" },
  WEIGHING: { icon: "scale", href: "/rebanho" },
  STOCK: { icon: "inventory", href: "/almoxarifado" },
  CULL: { icon: "reproductive", href: "/rebanho/reprodutivo" },
};

const FALLBACK_TARGET: { icon: IconName; href: string } = { icon: "alert", href: "/" };

function resolveTarget(kind: PendencyKind) {
  return KIND_TARGETS[kind] ?? FALLBACK_TARGET;
}

function todayLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function Chip({ children, tone }: { children: string; tone: "neutral" | "critical" | "late" }) {
  const styles = {
    neutral: "bg-[var(--cream-deep)] text-[var(--green)]",
    critical: "bg-red-600 text-white",
    late: "bg-[var(--earth)]/20 text-[var(--earth-strong)]",
  } as const;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}

/** "Agenda do dia": pendências reais (vacinas, pesagens, estoque, descarte) com atalho para resolver. */
export function AgendaDoDia({ data }: { data: Pendency[] }) {
  const critical = data.filter((p) => p.status === "CRITICO").length;
  const late = data.filter((p) => p.status === "ATRASADA").length;

  return (
    <section aria-labelledby="agenda-title" className="ui-surface flex flex-col p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2
            id="agenda-title"
            className="font-[family-name:var(--font-display)] text-lg text-[var(--green)]"
          >
            Agenda do dia
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs capitalize text-[var(--ink-muted)]">
            <Icon name="calendar" size={13} />
            {todayLabel()}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Chip tone="neutral">{`${data.length} ${data.length === 1 ? "item" : "itens"}`}</Chip>
          {critical > 0 ? <Chip tone="critical">{`${critical} crítico(s)`}</Chip> : null}
          {late > 0 ? <Chip tone="late">{`${late} atrasada(s)`}</Chip> : null}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--green-soft)]/20 text-[var(--green)]">
            <Icon name="check" size={22} strokeWidth={2.2} />
          </span>
          <p className="text-sm font-medium text-[var(--green-dark)]">Tudo em dia</p>
          <p className="text-xs text-[var(--ink-muted)]">Nenhuma pendência para hoje.</p>
        </div>
      ) : (
        <ul className="-mx-1 max-h-[26rem] space-y-1 overflow-y-auto px-1">
          {data.map((p) => {
            const { icon, href } = resolveTarget(p.kind);
            return (
              <li key={p.id}>
                <Link
                  href={href}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-[var(--cream-deep)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--earth)]/12 text-[var(--earth-strong)]">
                    <Icon name={icon} size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--ink)]">
                      {p.target}
                    </span>
                    <span className="block truncate text-xs text-[var(--ink-muted)]">
                      {p.type}
                      {p.status === "CRITICO" ? "" : ` · ${formatDate(p.dueDate)}`}
                    </span>
                  </span>
                  <StatusPill status={p.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
