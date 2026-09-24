"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type {
  BirthRecord,
  CullRecord,
  HerdLot,
  MortalityRecord,
  ReplacementRecord,
} from "@/lib/types";
import { Alert, PageHeader } from "@/components/ui/LayoutBits";
import { Tabs } from "@/components/ui/Table";
import {
  BirthsTab,
  CullsTab,
  MortalitiesTab,
  ReplacementsTab,
} from "@/components/rebanho/ReprodutivoTabs";

type TabId = "births" | "mortalities" | "culls" | "replacements";

export default function ReprodutivoPage() {
  const [tab, setTab] = useState<TabId>("births");
  const [lots, setLots] = useState<HerdLot[]>([]);
  const [births, setBirths] = useState<BirthRecord[]>([]);
  const [mortalities, setMortalities] = useState<MortalityRecord[]>([]);
  const [culls, setCulls] = useState<CullRecord[]>([]);
  const [replacements, setReplacements] = useState<ReplacementRecord[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [l, b, m, c, r] = await Promise.all([
        api<HerdLot[]>("/herd/lots"),
        api<BirthRecord[]>("/herd/births"),
        api<MortalityRecord[]>("/herd/mortalities"),
        api<CullRecord[]>("/herd/culls"),
        api<ReplacementRecord[]>("/herd/replacements"),
      ]);
      setLots(l);
      setBirths(b);
      setMortalities(m);
      setCulls(c);
      setReplacements(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(
    path: string,
    body: Record<string, unknown>,
    form: HTMLFormElement,
  ) {
    setSubmitting(true);
    setError("");
    try {
      await api(path, { method: "POST", body: JSON.stringify(body) });
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Reprodutivo"
        description="Nascimentos, mortalidade, descarte e reposição"
      />
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <Tabs
        tabs={[
          { id: "births", label: "Nascimentos" },
          { id: "mortalities", label: "Mortalidade" },
          { id: "culls", label: "Descarte" },
          { id: "replacements", label: "Reposição" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === "births" ? (
        <BirthsTab births={births} lots={lots} submitting={submitting} submit={submit} />
      ) : null}
      {tab === "mortalities" ? (
        <MortalitiesTab
          mortalities={mortalities}
          lots={lots}
          submitting={submitting}
          submit={submit}
        />
      ) : null}
      {tab === "culls" ? (
        <CullsTab culls={culls} lots={lots} submitting={submitting} submit={submit} />
      ) : null}
      {tab === "replacements" ? (
        <ReplacementsTab
          replacements={replacements}
          lots={lots}
          submitting={submitting}
          submit={submit}
        />
      ) : null}
    </div>
  );
}
