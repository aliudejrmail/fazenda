"use client";

import type { FormEvent, ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-[var(--green)]/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--green)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Section({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--green)]">
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Alert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "info" | "success";
}) {
  const tones = {
    error: "border-red-300 bg-red-50 text-red-800",
    info: "border-[var(--green)]/20 bg-[var(--green)]/5 text-[var(--green)]",
    success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  };
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-[var(--green)]/20 px-4 py-8 text-center text-sm text-[var(--ink-muted)]">
      {message}
    </p>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}

export function FormCard({
  title,
  children,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
}: {
  title: string;
  children: ReactNode;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(e);
      }}
      className="mb-6 rounded-lg border border-[var(--green)]/15 bg-white/70 p-4"
    >
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--earth)]">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
      <div className="mt-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-[var(--green)] px-4 py-2 text-sm font-medium text-[var(--cream)] hover:bg-[var(--green-dark)] disabled:opacity-50"
        >
          {submitting ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
