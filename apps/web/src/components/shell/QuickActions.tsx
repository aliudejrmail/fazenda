"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icons";
import { QUICK_ACTIONS } from "./nav-config";

type Variant = "topbar" | "fab";

/**
 * Menu de lançamentos rápidos.
 * - "topbar": pílula "Novo lançamento" (visível em telas grandes)
 * - "fab": botão flutuante (visível em telas pequenas)
 */
export function QuickActions({ variant }: { variant: Variant }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const menuItems = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Ao abrir, o foco vai para o primeiro item (padrão WAI-ARIA para menus).
  useEffect(() => {
    if (open) menuItems()[0]?.focus();
  }, [open]);

  function onMenuKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const list = menuItems();
    if (list.length === 0) return;
    const current = list.indexOf(document.activeElement as HTMLElement);
    let next: number | null = null;
    if (e.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % list.length;
    else if (e.key === "ArrowUp") next = current <= 0 ? list.length - 1 : current - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = list.length - 1;
    else if (e.key === "Tab") setOpen(false);
    if (next !== null) {
      e.preventDefault();
      list[next].focus();
    }
  }

  function onButtonKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setOpen(true);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const isFab = variant === "fab";

  // Folha inferior aberta (celular): trava a rolagem da página ao fundo.
  useEffect(() => {
    if (!open || !isFab) return;
    const root = document.documentElement;
    root.classList.add("sheet-open");
    return () => root.classList.remove("sheet-open");
  }, [open, isFab]);

  return (
    <div
      ref={ref}
      className={
        isFab
          ? "no-print fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-30 lg:hidden"
          : "no-print relative hidden lg:block"
      }
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={isFab ? "Novo lançamento" : undefined}
        className={`inline-flex items-center justify-center bg-[var(--earth-strong)] font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--earth-strong)] ${
          isFab
            ? "h-14 w-14 rounded-full shadow-[0_8px_24px_rgba(47,59,36,0.35)]"
            : "gap-2 rounded-full px-4 py-2 text-sm shadow-[var(--shadow-sm)]"
        }`}
      >
        <Icon
          name="plus"
          size={isFab ? 26 : 18}
          strokeWidth={2.2}
          className={`transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        />
        {isFab ? null : "Novo lançamento"}
      </button>

      {open ? (
        <>
          {/* Celular: fundo escurecido que fecha a folha ao tocar fora dela. */}
          {isFab ? (
            <div
              aria-hidden
              className="fixed inset-0 -z-10 bg-[var(--green-dark)]/45 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />
          ) : null}
          <div
            ref={menuRef}
            role="menu"
            aria-label="Lançamentos rápidos"
            onKeyDown={onMenuKeyDown}
            className={
              isFab
                ? "sheet-up fixed inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-[var(--line-strong)] bg-[var(--surface-solid)] pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(47,59,36,0.18)]"
                : "absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-xl border border-[var(--line-strong)] bg-[var(--surface-solid)] py-1.5 shadow-[var(--shadow-md)]"
            }
          >
            {isFab ? (
              <div className="sticky top-0 z-10 bg-[var(--surface-solid)] pb-1 pt-2.5">
                <span
                  aria-hidden
                  className="mx-auto block h-1 w-10 rounded-full bg-[var(--line-strong)]"
                />
                <div className="flex items-center justify-between px-4 pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    Lançamentos rápidos
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      buttonRef.current?.focus();
                    }}
                    aria-label="Fechar lançamentos rápidos"
                    className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--ink-muted)] transition hover:bg-[var(--cream-deep)]"
                  >
                    <Icon name="close" size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                Lançamentos rápidos
              </p>
            )}
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                role="menuitem"
                className={`flex items-center gap-3 px-4 text-[var(--ink)] transition hover:bg-[var(--cream-deep)] focus-visible:bg-[var(--cream-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--earth-strong)] ${
                  isFab ? "min-h-14 py-2 text-base" : "min-h-11 py-2 text-sm"
                }`}
              >
                <span
                  className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--earth)]/12 text-[var(--earth-strong)] ${
                    isFab ? "h-10 w-10" : "h-8 w-8"
                  }`}
                >
                  <Icon name={action.icon} size={isFab ? 20 : 16} />
                </span>
                {action.label}
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
