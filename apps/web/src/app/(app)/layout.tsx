"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Protect } from "@/components/Protect";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const requireFarm = pathname !== "/fazendas";

  return (
    <Protect requireFarm={requireFarm}>
      <AppShell>{children}</AppShell>
    </Protect>
  );
}
