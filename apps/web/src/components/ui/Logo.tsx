import Image from "next/image";
import { APP_NAME } from "@/lib/brand";

/**
 * Logo do sistema (emblema "J", arquivo em /public/brand/logo-j.png).
 * O arquivo tem fundo branco: por isso é exibido em um "azulejo" arredondado,
 * que funciona tanto sobre o verde do menu quanto sobre fundos claros.
 */
export function Logo({
  size = 40,
  priority = false,
  className = "",
}: {
  size?: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src="/brand/logo-j.png"
      alt={APP_NAME}
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 rounded-xl bg-white object-contain shadow-[0_0_0_1px_rgba(255,255,255,0.18)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
