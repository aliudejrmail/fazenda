import { Logo } from "@/components/ui/Logo";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <Logo size={40} priority />
      <div className="min-w-0">
        <p className="font-[family-name:var(--font-display)] text-lg leading-tight tracking-tight text-[var(--cream)]">
          {APP_NAME}
        </p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
          {APP_TAGLINE}
        </p>
      </div>
    </div>
  );
}
