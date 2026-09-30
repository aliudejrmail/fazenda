import { Icon, type IconName } from "@/components/ui/Icons";

export type HeroStat = {
  label: string;
  value: string;
  hint?: string;
  icon: IconName;
  /** Destaca o valor com a cor terrosa (ex.: indicador principal de desempenho) */
  highlight?: boolean;
};

/** Faixa de indicadores principais em destaque (topo do painel). */
export function HeroStats({ caption, items }: { caption: string; items: HeroStat[] }) {
  return (
    <section
      aria-label="Indicadores principais"
      className="relative overflow-hidden rounded-[var(--radius)] bg-[var(--green)] px-5 py-5 text-[var(--cream)] shadow-[var(--shadow-md)] sm:px-8 sm:py-6"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #fff 0.6px, transparent 0.7px), radial-gradient(circle at 80% 40%, #fff 0.5px, transparent 0.6px)",
          backgroundSize: "18px 18px, 22px 22px",
        }}
        aria-hidden
      />
      <div className="relative">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
          {caption}
        </p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4 lg:gap-y-0">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`[container-type:inline-size] ${
                i > 0 ? "lg:border-l lg:border-white/12 lg:pl-6" : ""
              }`}
            >
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/70 sm:text-[13px]">
                <Icon name={item.icon} size={16} className="text-[var(--earth-soft)]" />
                {item.label}
              </dt>
              <dd
                className={`mt-2 font-[family-name:var(--font-display)] whitespace-nowrap text-[clamp(1.25rem,12cqw,2.25rem)] leading-none ${
                  item.highlight ? "text-[var(--earth-soft)]" : "text-white"
                }`}
              >
                {item.value}
              </dd>
              {item.hint ? (
                <p className="mt-2 text-sm text-white/70">{item.hint}</p>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
