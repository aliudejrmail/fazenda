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
    <div className="ui-surface overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[var(--line)] bg-[var(--green)]/[0.04]">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-3.5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">{children}</tbody>
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
  return (
    <td className={`px-3.5 py-2.5 align-middle text-[var(--ink)] ${className}`}>
      {children}
    </td>
  );
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
    <div className="mb-5 flex flex-wrap gap-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-solid)]/80 p-1 shadow-[var(--shadow-sm)]">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--green)] text-[var(--cream)] shadow-[var(--shadow-sm)]"
                : "text-[var(--ink-muted)] hover:bg-[var(--green)]/6 hover:text-[var(--green)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
