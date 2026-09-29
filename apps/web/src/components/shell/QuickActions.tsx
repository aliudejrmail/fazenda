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

  return (
    <div
      ref={ref}
      className={
        isFab
          ? "no-print fixed bottom-5 right-5 z-30 lg:hidden"
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
        <div
          ref={menuRef}
          role="menu"
          aria-label="Lançamentos rápidos"
          onKeyDown={onMenuKeyDown}
          className={`absolute w-72 overflow-hidden rounded-xl border border-[var(--line-strong)] bg-[var(--surface-solid)] py-1.5 shadow-[var(--shadow-md)] ${
            isFab ? "bottom-full right-0 mb-3" : "right-0 top-full mt-2"
          }`}
        >
          <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Lançamentos rápidos
          </p>
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              role="menuitem"
              className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--ink)] transition hover:bg-[var(--cream-deep)] focus-visible:bg-[var(--cream-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--earth-strong)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--earth)]/12 text-[var(--earth-strong)]">
                <Icon name={action.icon} size={16} />
              </span>
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
