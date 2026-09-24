"use client";

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClass =
  "w-full rounded-md border border-[var(--green)]/20 bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)]/30";

const labelClass = "mb-1 block text-sm font-medium text-[var(--ink-muted)]";

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
      <input id={inputId} className={`${fieldClass} ${className}`} {...props} />
      {error ? <span className="mt-1 block text-xs text-red-700">{error}</span> : null}
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
      <select id={inputId} className={`${fieldClass} ${className}`} {...props}>
        {children}
      </select>
      {error ? <span className="mt-1 block text-xs text-red-700">{error}</span> : null}
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
        className={`${fieldClass} min-h-[80px] ${className}`}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-red-700">{error}</span> : null}
    </label>
  );
}
