export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--earth)]/90 text-[var(--cream)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
        aria-hidden
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c-1.2 0-2.2.7-2.7 1.7-.4-.2-.8-.3-1.3-.3-1.7 0-3 1.4-3 3.1 0 .5.1 1 .4 1.4C4.2 9.5 3.5 10.7 3.5 12c0 2.3 1.6 4.2 3.7 4.7.3 1.7 1.8 3 3.6 3h2.4c1.8 0 3.3-1.3 3.6-3 2.1-.5 3.7-2.4 3.7-4.7 0-1.3-.7-2.5-1.9-3.1.3-.4.4-.9.4-1.4 0-1.7-1.3-3.1-3-3.1-.5 0-.9.1-1.3.3C14.2 3.7 13.2 3 12 3z" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="font-[family-name:var(--font-display)] text-xl leading-none tracking-tight text-[var(--cream)]">
          Fazenda
        </p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
          Gestão pecuária
        </p>
      </div>
    </div>
  );
}
