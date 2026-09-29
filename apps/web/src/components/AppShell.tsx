"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

type NavItem = { href: string; label: string };
type NavGroup = { id: string; label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    id: "ops",
    label: "Operação",
    items: [
      { href: "/", label: "Painel" },
      { href: "/fazendas", label: "Fazendas" },
      { href: "/retiros", label: "Retiros" },
    ],
  },
  {
    id: "herd",
    label: "Rebanho",
    items: [
      { href: "/rebanho", label: "Lotes" },
      { href: "/rebanho/reprodutivo", label: "Reprodutivo" },
      { href: "/rebanho/movimentacoes", label: "Movimentações" },
      { href: "/alimentacao", label: "Alimentação" },
      { href: "/vacinas", label: "Vacinas" },
    ],
  },
  {
    id: "mgmt",
    label: "Gestão",
    items: [
      { href: "/financeiro", label: "Financeiro" },
      { href: "/relatorios", label: "Relatórios" },
      { href: "/almoxarifado", label: "Almoxarifado" },
      { href: "/frota", label: "Frota" },
      { href: "/funcionarios", label: "Funcionários" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--earth)]/90 text-[var(--cream)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
        aria-hidden
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c-1.2 0-2.2.7-2.7 1.7-.4-.2-.8-.3-1.3-.3-1.7 0-3 1.4-3 3.1 0 .5.1 1 .4 1.4C4.2 9.5 3.5 10.7 3.5 12c0 2.3 1.6 4.2 3.7 4.7.3 1.7 1.8 3 3.6 3h2.4c1.8 0 3.3-1.3 3.6-3 2.1-.5 3.7-2.4 3.7-4.7 0-1.3-.7-2.5-1.9-3.1.3-.4.4-.9.4-1.4 0-1.7-1.3-3.1-3-3.1-.5 0-.9.1-1.3.3C14.2 3.7 13.2 3 12 3z" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="font-[family-name:var(--font-display)] text-xl leading-none tracking-tight text-[var(--cream)]">
          Fazenda
        </p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
          Gestão pecuária
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, selectedFarm, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen text-[var(--ink)]">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[17.5rem] transform flex-col bg-[var(--green)] text-[var(--cream)] shadow-[8px_0_32px_rgba(47,59,36,0.12)] transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, #fff 0.6px, transparent 0.7px), radial-gradient(circle at 80% 40%, #fff 0.5px, transparent 0.6px)",
              backgroundSize: "18px 18px, 22px 22px",
            }}
            aria-hidden
          />
          <div className="relative flex h-full flex-col">
            <div className="border-b border-white/10 px-5 py-5">
              <BrandMark />
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
              {NAV_GROUPS.map((group) => (
                <div key={group.id}>
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`group relative flex items-center rounded-lg px-3 py-2 text-sm transition ${
                            active
                              ? "bg-white/14 font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                              : "text-white/75 hover:bg-white/8 hover:text-white"
                          }`}
                        >
                          {active ? (
                            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--earth-soft)]" />
                          ) : null}
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="relative border-t border-white/10 bg-black/10 px-4 py-4">
              <p className="truncate text-sm font-semibold">
                {selectedFarm?.name ?? "Nenhuma fazenda"}
              </p>
              <p className="mt-0.5 truncate text-xs text-white/55">
                {user?.name ?? "—"}
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left text-xs font-medium text-white/85 transition hover:bg-white/10"
              >
                Encerrar sessão
              </button>
            </div>
          </div>
        </aside>

        {open ? (
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-30 bg-[var(--green-dark)]/45 backdrop-blur-[2px] lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="ui-topbar sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--cream)]/85 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--surface-solid)] px-3 py-2 text-sm font-medium text-[var(--green)] shadow-[var(--shadow-sm)] lg:hidden"
              >
                <span className="flex flex-col gap-1" aria-hidden>
                  <span className="block h-0.5 w-4 rounded bg-[var(--green)]" />
                  <span className="block h-0.5 w-4 rounded bg-[var(--green)]" />
                  <span className="block h-0.5 w-3 rounded bg-[var(--green)]" />
                </span>
                Menu
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate font-[family-name:var(--font-display)] text-lg text-[var(--green)] lg:text-xl">
                  {selectedFarm?.name ?? "Selecione uma fazenda"}
                </p>
                <p className="hidden text-xs text-[var(--ink-muted)] sm:block">
                  Controle operacional do rebanho e da propriedade
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-solid)] px-3 py-1.5 text-xs text-[var(--ink-muted)] sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--green-soft)]" />
                {user?.name ?? "Usuário"}
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
