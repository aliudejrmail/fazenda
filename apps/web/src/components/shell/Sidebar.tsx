import Link from "next/link";
import { Icon } from "@/components/ui/Icons";
import { BrandMark } from "./BrandMark";
import { NAV_GROUPS, findNavContext } from "./nav-config";

type SidebarProps = {
  open: boolean;
  pathname: string;
  farmName?: string;
  userName?: string;
  onLogout: () => void;
  /** Fecha a gaveta (somente telas < lg). */
  onClose: () => void;
};

export function Sidebar({ open, pathname, farmName, userName, onLogout, onClose }: SidebarProps) {
  // Apenas o item mais específico fica ativo (evita "Lotes" e "Reprodutivo" juntos em /rebanho/reprodutivo).
  const activeHref = findNavContext(pathname)?.item.href;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[17.5rem] max-w-[86vw] transform flex-col bg-[var(--green)] text-[var(--cream)] shadow-[8px_0_32px_rgba(47,59,36,0.12)] transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
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
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <BrandMark />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-5" aria-label="Navegação principal">
          {NAV_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.href === activeHref;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition lg:py-2 ${
                        active
                          ? "bg-white/14 font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                          : "text-white/75 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      {active ? (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--earth-soft)]" />
                      ) : null}
                      <Icon
                        name={item.icon}
                        size={18}
                        className={
                          active
                            ? "text-[var(--earth-soft)]"
                            : "text-white/50 transition group-hover:text-white/85"
                        }
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative border-t border-white/10 bg-black/10 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="truncate text-sm font-semibold">{farmName ?? "Nenhuma fazenda"}</p>
          <p className="mt-0.5 truncate text-xs text-white/55">{userName ?? "—"}</p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 flex min-h-11 w-full items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left text-xs font-medium text-white/85 transition hover:bg-white/10"
          >
            <Icon name="logout" size={15} />
            Encerrar sessão
          </button>
        </div>
      </div>
    </aside>
  );
}
