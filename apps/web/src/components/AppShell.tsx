"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/ui/Icons";
import { QuickActions } from "@/components/shell/QuickActions";
import { Sidebar } from "@/components/shell/Sidebar";

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

  // Visualizadores têm acesso somente leitura: sem ações de lançamento.
  const canCreate = selectedFarm?.role !== "VIEWER";

  return (
    <div className="min-h-screen text-[var(--ink)]">
      <div className="flex min-h-screen">
        <Sidebar
          open={open}
          pathname={pathname}
          farmName={selectedFarm?.name}
          userName={user?.name}
          onLogout={handleLogout}
        />

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
                <Icon name="menu" size={18} />
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

              {canCreate ? <QuickActions variant="topbar" /> : null}

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

      {canCreate ? <QuickActions variant="fab" /> : null}
    </div>
  );
}
