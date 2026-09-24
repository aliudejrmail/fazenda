"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/fazendas", label: "Fazendas" },
  { href: "/rebanho", label: "Rebanho" },
  { href: "/rebanho/reprodutivo", label: "Reprodutivo" },
  { href: "/rebanho/movimentacoes", label: "Movimentações" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/vacinas", label: "Vacinas" },
  { href: "/almoxarifado", label: "Almoxarifado" },
  { href: "/frota", label: "Frota" },
  { href: "/funcionarios", label: "Funcionários" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, selectedFarm, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-[var(--green)]/15 bg-[var(--green)] text-[var(--cream)] transition-transform lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-5 py-5">
              <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
                Fazenda
              </p>
              <p className="mt-1 text-xs text-white/70">Gestão pecuária</p>
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
              {NAV.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-md px-3 py-2 text-sm transition ${
                      active
                        ? "bg-white/15 font-semibold"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 px-4 py-4 text-sm">
              <p className="truncate font-medium">
                {selectedFarm?.name ?? "Nenhuma fazenda"}
              </p>
              <p className="truncate text-xs text-white/60">{user?.name}</p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full rounded-md border border-white/20 px-3 py-1.5 text-left text-xs hover:bg-white/10"
              >
                Sair
              </button>
            </div>
          </div>
        </aside>

        {open ? (
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--green)]/10 bg-[var(--cream)]/95 px-4 py-3 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-md border border-[var(--green)]/20 px-3 py-1.5 text-sm text-[var(--green)]"
            >
              Menu
            </button>
            <div className="min-w-0">
              <p className="truncate font-[family-name:var(--font-display)] text-lg text-[var(--green)]">
                {selectedFarm?.name ?? "Fazenda"}
              </p>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
