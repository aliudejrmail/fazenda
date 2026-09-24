"use client";

import type { ReactNode } from "react";

export function Table({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--green)]/15 bg-white/60">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[var(--green)]/10 bg-[var(--green)]/5 text-[var(--ink-muted)]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--green)]/8">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 border-b border-[var(--green)]/15">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "border-b-2 border-[var(--earth)] text-[var(--green)]"
                : "text-[var(--ink-muted)] hover:text-[var(--green)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
