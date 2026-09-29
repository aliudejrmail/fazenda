import Link from "next/link";
import { Icon } from "@/components/ui/Icons";
import { findNavItem } from "@/components/shell/nav-config";

/** Módulos exibidos como atalho no painel, na ordem desejada. */
const SHORTCUT_HREFS = [
  "/rebanho",
  "/rebanho/reprodutivo",
  "/rebanho/movimentacoes",
  "/alimentacao",
  "/vacinas",
  "/financeiro",
  "/almoxarifado",
  "/relatorios",
] as const;

/**
 * Cards de atalho por módulo. Título, ícone e descrição vêm de nav-config;
 * `metrics` (opcional, por href) mostra um número vivo do painel no card.
 */
export function ModuleShortcuts({ metrics = {} }: { metrics?: Record<string, string> }) {
  return (
    <section aria-labelledby="module-shortcuts-title" className="ui-surface p-4 sm:p-5">
      <h2
        id="module-shortcuts-title"
        className="font-[family-name:var(--font-display)] text-lg text-[var(--green)]"
      >
        Módulos
      </h2>
      <p className="mb-4 text-xs text-[var(--ink-muted)]">Acesse a área que precisa em um clique</p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {SHORTCUT_HREFS.map((href) => {
          const item = findNavItem(href);
          if (!item) return null;
          const metric = metrics[href];
          return (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] p-3.5 transition hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-md)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--earth)]/12 text-[var(--earth-strong)] transition group-hover:bg-[var(--earth-strong)] group-hover:text-white">
                  <Icon name={item.icon} size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[var(--green-dark)]">{item.label}</span>
                    <Icon
                      name="arrowRight"
                      size={16}
                      className="shrink-0 text-[var(--ink-muted)] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                    />
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-[var(--ink-muted)]">
                    {item.description}
                  </span>
                  {metric ? (
                    <span className="mt-2 inline-flex rounded-full bg-[var(--cream-deep)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--green)]">
                      {metric}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
