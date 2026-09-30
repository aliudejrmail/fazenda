"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type {
  BirthRecord,
  CullRecord,
  HerdLot,
  MortalityRecord,
  PregnancyDiagnosis,
  ReplacementRecord,
  Retiro,
} from "@/lib/types";
import { useFormSubmit } from "@/lib/use-form-submit";
import { isOpenLot } from "@/lib/format";
import { Alert, PageHeader } from "@/components/ui/LayoutBits";
import { Tabs } from "@/components/ui/Table";
import {
  BirthsTab,
  CullsTab,
  MortalitiesTab,
  PregnancyTab,
  ReplacementsTab,
} from "@/components/rebanho/ReprodutivoTabs";

type TabId =
  | "pregnancy"
  | "births"
  | "mortalities"
  | "culls"
  | "replacements";

export default function ReprodutivoPage() {
  const [tab, setTab] = useState<TabId>("pregnancy");
  const [lots, setLots] = useState<HerdLot[]>([]);
  const [retiros, setRetiros] = useState<Retiro[]>([]);
  const [diagnoses, setDiagnoses] = useState<PregnancyDiagnosis[]>([]);
  const [births, setBirths] = useState<BirthRecord[]>([]);
  const [mortalities, setMortalities] = useState<MortalityRecord[]>([]);
  const [culls, setCulls] = useState<CullRecord[]>([]);
  const [replacements, setReplacements] = useState<ReplacementRecord[]>([]);
  const [error, setError] = useState("");
  const { submitting, run } = useFormSubmit(setError);

  const load = useCallback(async () => {
    setError("");
    try {
      const [l, retirosData, d, b, m, c, r] = await Promise.all([
        api<HerdLot[]>("/herd/lots"),
        api<Retiro[]>("/retiros"),
        api<PregnancyDiagnosis[]>("/herd/pregnancy-diagnoses"),
        api<BirthRecord[]>("/herd/births"),
        api<MortalityRecord[]>("/herd/mortalities"),
        api<CullRecord[]>("/herd/culls"),
        api<ReplacementRecord[]>("/herd/replacements"),
      ]);
      setLots(l.filter(isOpenLot));
      setRetiros(retirosData.filter((r) => r.active !== false));
      setDiagnoses(d);
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

  function submit(
    path: string,
    body: Record<string, unknown>,
    form: HTMLFormElement,
  ) {
    return run(
      form,
      async () => {
        await api(path, { method: "POST", body: JSON.stringify(body) });
        await load();
      },
      "Erro ao salvar",
    );
  }

  return (
    <div>
      <PageHeader
        title="Reprodutivo"
        description="Prenhez, nascimentos, mortalidade, descarte e reposição"
      />
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <Tabs
        tabs={[
          { id: "pregnancy", label: "Prenhez" },
          { id: "births", label: "Nascimentos" },
          { id: "mortalities", label: "Mortalidade" },
          { id: "culls", label: "Descarte" },
          { id: "replacements", label: "Reposição" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === "pregnancy" ? (
        <PregnancyTab
          diagnoses={diagnoses}
          lots={lots}
          retiros={retiros}
          submitting={submitting}
          submit={submit}
        />
      ) : null}
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
