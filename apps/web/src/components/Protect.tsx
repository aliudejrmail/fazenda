"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

export function Protect({
  children,
  requireFarm = true,
}: {
  children: ReactNode;
  requireFarm?: boolean;
}) {
  const { loading, hasToken, selectedFarmId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!hasToken) {
      router.replace("/login");
      return;
    }
    if (requireFarm && !selectedFarmId && pathname !== "/fazendas") {
      router.replace("/fazendas");
    }
  }, [loading, hasToken, requireFarm, selectedFarmId, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--ink-muted)]">
        Carregando...
      </div>
    );
  }

  if (!hasToken) return null;
  if (requireFarm && !selectedFarmId && pathname !== "/fazendas") return null;

  return <>{children}</>;
}
