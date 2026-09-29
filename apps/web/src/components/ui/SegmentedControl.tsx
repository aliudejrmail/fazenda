"use client";

import { useRef, type KeyboardEvent } from "react";

export type SegmentOption<T extends string> = { value: T; label: string };

/**
 * Seletor segmentado (radiogroup) com navegação por setas.
 * Uso: escolha única entre poucas opções (ex.: ciclo Cria / Recria / Confinamento).
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex max-w-full overflow-x-auto rounded-full border border-[var(--line-strong)] bg-[var(--cream-deep)] p-1"
    >
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--earth-strong)] ${
              selected
                ? "bg-[var(--green)] text-white shadow-[var(--shadow-sm)]"
                : "text-[var(--ink-muted)] hover:text-[var(--green)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
