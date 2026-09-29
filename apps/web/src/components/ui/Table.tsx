"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Copia o texto de cada cabeçalho para `data-label` das células do corpo.
 * No celular (< 768px) o CSS (`responsive.css`) usa esse rótulo para exibir
 * cada linha como um cartão "Rótulo: valor", sem exigir mudança nas páginas.
 */
function labelCells(table: HTMLTableElement, headers: string[]) {
  table.querySelectorAll<HTMLTableRowElement>(":scope > tbody > tr").forEach((row) => {
    row.setAttribute("role", "row");
    Array.from(row.children).forEach((cell, index) => {
      cell.setAttribute("data-label", headers[index] ?? "");
      cell.setAttribute("role", "cell");
    });
  });
}

export function Table({
  headers,
  children,
  bare = false,
}: {
  headers: string[];
  children: ReactNode;
  /** Sem moldura própria — para tabelas já dentro de um card. */
  bare?: boolean;
}) {
  const tableRef = useRef<HTMLTableElement>(null);

  // Sem deps: as linhas chegam via `children` e mudam a cada render do pai.
  useLayoutEffect(() => {
    if (tableRef.current) labelCells(tableRef.current, headers);
  });

  return (
    <div className={`${bare ? "" : "ui-surface "}rt-wrap overflow-x-auto`}>
      <table ref={tableRef} role="table" className="rt min-w-full text-left text-sm">
        <thead role="rowgroup" className="border-b border-[var(--line)] bg-[var(--green)]/[0.04]">
          <tr role="row">
            {headers.map((h, i) => (
              <th
                key={`${h}-${i}`}
                role="columnheader"
                className="whitespace-nowrap px-3.5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup" className="divide-y divide-[var(--line)]">
          {children}
        </tbody>
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
  // Celular: uma única linha rolável (evita abas quebrando em 2-3 linhas).
  return (
    <div className="scroll-x-hidden mb-5 flex gap-1 overflow-x-auto rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-solid)]/80 p-1 shadow-[var(--shadow-sm)] sm:flex-wrap">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={isActive ? "true" : undefined}
            onClick={() => onChange(tab.id)}
            className={`min-h-10 shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition ${
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
