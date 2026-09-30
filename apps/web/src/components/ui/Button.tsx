"use client";

import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-[var(--green)] text-[var(--cream)] border-transparent hover:bg-[var(--green-dark)] shadow-[var(--shadow-sm)]",
  secondary:
    "bg-[var(--surface-solid)] text-[var(--green)] border-[var(--line-strong)] hover:bg-[var(--cream-deep)] shadow-[var(--shadow-sm)]",
  ghost:
    "bg-transparent text-[var(--ink)] border-transparent hover:bg-[var(--green)]/6",
  danger:
    "bg-[var(--earth)] text-white border-transparent hover:brightness-95 shadow-[var(--shadow-sm)]",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** React 19: `ref` é uma prop comum em componentes de função. */
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium sm:min-h-0 transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
