"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Campaign, HerdLot, InventoryItem, Vaccine } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";
import {
  Alert,
  EmptyState,
  PageHeader,
  Section,
} from "@/components/ui/LayoutBits";
import { Table, Tabs, Td } from "@/components/ui/Table";
import { VaccinesTab } from "@/components/vacinas/VaccinesTab";
import { CampaignsTab } from "@/components/vacinas/CampaignsTab";

export default function VacinasPage() {
  const [tab, setTab] = useState("vaccines");
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [upcoming, setUpcoming] = useState<Campaign[]>([]);
  const [lots, setLots] = useState<HerdLot[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [v, c, u, l, i] = await Promise.all([
        api<Vaccine[]>("/vaccines"),
        api<Campaign[]>("/vaccines/campaigns"),
        api<Campaign[]>("/vaccines/upcoming"),
        api<HerdLot[]>("/herd/lots"),
        api<InventoryItem[]>("/inventory/items"),
      ]);
      setVaccines(v);
      setCampaigns(c);
      setUpcoming(u);
      setLots(l);
      setItems(i);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Vacinas" description="Cadastro, campanhas e próximas doses" />
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <Section title="Próximas doses">
        {upcoming.length === 0 ? (
          <EmptyState message="Nenhuma dose agendada." />
        ) : (
          <Table headers={["Vacina", "Próxima dose", "Doses"]}>
            {upcoming.map((c) => (
              <tr key={c.id}>
                <Td>{c.vaccine?.name ?? "—"}</Td>
                <Td>{formatDate(c.nextDueDate)}</Td>
                <Td>{formatNumber(c.doses)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Tabs
        tabs={[
          { id: "vaccines", label: "Vacinas" },
          { id: "campaigns", label: "Campanhas" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "vaccines" ? (
        <VaccinesTab
          vaccines={vaccines}
          items={items}
          onChanged={load}
          onError={setError}
        />
      ) : (
        <CampaignsTab
          vaccines={vaccines}
          campaigns={campaigns}
          lots={lots}
          onChanged={load}
          onError={setError}
        />
      )}
    </div>
  );
}
