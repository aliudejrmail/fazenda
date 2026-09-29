"use client";

import { usePathname } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";
import { findNavContext } from "@/components/shell/nav-config";

function TitleWithHighlight({ title, highlight }: { title: string; highlight?: string }) {
  const at = highlight ? title.indexOf(highlight) : -1;
  if (!highlight || at < 0) return <>{title}</>;
  return (
    <>
      {title.slice(0, at)}
      <span className="text-[var(--earth-strong)]">{highlight}</span>
      {title.slice(at + highlight.length)}
    </>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  highlight,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Texto acima do título. Padrão: grupo do menu da rota atual (Operação, Rebanho, Gestão). */
  eyebrow?: string;
  /** Trecho do título destacado na cor terrosa (ex.: "pecuário"). */
  highlight?: string;
}) {
  const pathname = usePathname();
  const context = findNavContext(pathname);
  const eyebrowText = eyebrow ?? context?.group.label;

  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2.5">
          <span className="h-1 w-10 shrink-0 rounded-full bg-[var(--earth)]" aria-hidden />
          {eyebrowText ? (
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--earth-strong)]">
              {context ? <Icon name={context.item.icon} size={13} /> : null}
              {eyebrowText}
            </p>
          ) : null}
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--green)] sm:text-[2rem]">
          <TitleWithHighlight title={title} highlight={highlight} />
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
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
    error: "border-red-300/80 bg-red-50/90 text-red-900",
    info: "border-[var(--line-strong)] bg-[var(--green)]/5 text-[var(--green)]",
    success: "border-emerald-300/80 bg-emerald-50/90 text-emerald-950",
  };
  return (
    <div
      className={`rounded-[var(--radius)] border px-3.5 py-2.5 text-sm shadow-[var(--shadow-sm)] ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="ui-surface px-6 py-12 text-center">
      <div
        className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--green)]/8 text-[var(--green-soft)]"
        aria-hidden
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8 2 5 5.5 5 9.5c0 5.2 5.2 10.4 6.4 11.5.3.3.8.3 1.1 0C13.8 19.9 19 14.7 19 9.5 19 5.5 16 2 12 2zm0 11.5c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
        </svg>
      </div>
      <p className="text-sm text-[var(--ink-muted)]">{message}</p>
    </div>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
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
      className="ui-surface mb-6 p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-[var(--earth)]" aria-hidden />
        <h3 className="text-sm font-semibold tracking-wide text-[var(--green)]">
          {title}
        </h3>
      </div>
      <div className="space-y-3.5">{children}</div>
      <div className="mt-5">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent";
}) {
  return (
    <div className="ui-stat">
      <p className="ui-stat-label">{label}</p>
      <p
        className={`ui-stat-value ${
          tone === "accent" ? "!text-[var(--earth)]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
