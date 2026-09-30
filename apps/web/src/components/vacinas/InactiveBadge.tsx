export function InactiveBadge({ label = "Inativa" }: { label?: string }) {
  return (
    <span className="rounded-full border border-[var(--line-strong)] bg-[var(--cream-deep)] px-2 py-0.5 text-xs font-medium text-[var(--ink-muted)]">
      {label}
    </span>
  );
}
