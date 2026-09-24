"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-[var(--green)] text-[var(--cream)] hover:bg-[var(--green-dark)] border-transparent",
  secondary:
    "bg-transparent text-[var(--green)] border-[var(--green)]/30 hover:bg-[var(--green)]/5",
  ghost:
    "bg-transparent text-[var(--ink)] border-transparent hover:bg-black/5",
  danger:
    "bg-[var(--earth)] text-white border-transparent hover:opacity-90",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
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
      className={`inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
