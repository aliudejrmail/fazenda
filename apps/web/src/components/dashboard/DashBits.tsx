"use client";

import type { ReactNode } from "react";

export function DashCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-[#d9d2c5] bg-white/90 p-4 shadow-[0_1px_2px_rgba(40,30,10,0.04)] ${className}`}
    >
      {title ? (
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-[#3d4f2f]">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function KpiCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: "default" | "alert" | "accent";
}) {
  const tones = {
    default: "border-[#d9d2c5]",
    alert: "border-red-300 bg-red-50/60",
    accent: "border-[#c4a574]",
  };
  return (
    <div
      className={`rounded-xl border bg-white/90 px-3 py-3 shadow-[0_1px_2px_rgba(40,30,10,0.04)] ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#6b655c]">
          {label}
        </p>
        {icon ? <span className="text-[#5e7d42] opacity-80">{icon}</span> : null}
      </div>
      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#2f3b24]">
        {value}
      </p>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    ATRASADA: "bg-[#e8a54b]/text-[#6b3f00]",
    PENDENTE: "bg-[#c4d4a5] text-[#2f3b24]",
    CRITICO: "bg-[#e07070] text-white",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        map[status] ?? "bg-stone-200 text-stone-700"
      }`}
    >
      {status === "ATRASADA"
        ? "Atrasada"
        : status === "PENDENTE"
          ? "Pendente"
          : status === "CRITICO"
            ? "Crítico"
            : status}
    </span>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex min-w-[120px] flex-1 flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-[#6b655c]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[#d9d2c5] bg-white px-2.5 py-2 text-sm font-normal normal-case text-[#2f3b24] outline-none focus:border-[#5e7d42]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 10c-1.1 0-2 .9-2 2v1H3v2h2v3c0 .55.45 1 1 1h1v-4h2v4h2v-4h2v4h1c.55 0 1-.45 1-1v-3h2v-2h-2v-1c0-1.1-.9-2-2-2H7zm10.5-5c-.83 0-1.5.67-1.5 1.5S16.67 8 17.5 8s1.5-.67 1.5-1.5S18.33 5 17.5 5zM6.5 5C5.67 5 5 5.67 5 6.5S5.67 8 6.5 8 8 7.33 8 6.5 7.33 5 6.5 5z" />
    </svg>
  );
}

export function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#c0392b" aria-hidden>
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  );
}

export function TrendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5e7d42" strokeWidth="2" aria-hidden>
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </svg>
  );
}
