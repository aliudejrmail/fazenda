import { Logo } from "@/components/ui/Logo";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <Logo size={40} priority />
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
