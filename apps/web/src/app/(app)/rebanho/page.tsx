"use client";

import { Suspense } from "react";
import RebanhoPage from "./RebanhoClient";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--ink-muted)]">Carregando...</p>}>
      <RebanhoPage />
    </Suspense>
  );
}
