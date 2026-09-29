"use client";

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

// text-base no celular: fontes < 16px fazem o iOS dar zoom ao focar o campo.
const fieldClass =
  "w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface-solid)] px-3 py-2.5 text-base text-[var(--ink)] shadow-[var(--shadow-sm)] outline-none transition placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--green-soft)] focus:ring-2 focus:ring-[var(--green-soft)]/20 sm:text-sm";

// Altura mínima de toque (44px) para input/select; textarea define a própria.
const controlClass = `${fieldClass} min-h-11 sm:min-h-0`;

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]";

type FieldProps = {
  label: string;
  error?: string;
};

export function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? props.name;
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input id={inputId} className={`${controlClass} ${className}`} {...props} />
      {error ? (
        <span className="mt-1.5 block text-xs text-red-700">{error}</span>
      ) : null}
    </label>
  );
}

export function Select({
  label,
  error,
  className = "",
  id,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const inputId = id ?? props.name;
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select id={inputId} className={`${controlClass} ${className}`} {...props}>
        {children}
      </select>
      {error ? (
        <span className="mt-1.5 block text-xs text-red-700">{error}</span>
      ) : null}
    </label>
  );
}

export function Textarea({
  label,
  error,
  className = "",
  id,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const inputId = id ?? props.name;
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea
        id={inputId}
        className={`${fieldClass} min-h-[88px] resize-y ${className}`}
        {...props}
      />
      {error ? (
        <span className="mt-1.5 block text-xs text-red-700">{error}</span>
      ) : null}
    </label>
  );
}
