"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Campaign, HerdLot, Vaccine } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber, todayISO } from "@/lib/format";
import { Input, Select, Textarea } from "@/components/ui/Field";
import {
  Alert,
  EmptyState,
  FormCard,
  FormGrid,
  PageHeader,
  Section,
} from "@/components/ui/LayoutBits";
import { Table, Tabs, Td } from "@/components/ui/Table";

export default function VacinasPage() {
  const [tab, setTab] = useState("vaccines");
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [upcoming, setUpcoming] = useState<Campaign[]>([]);
  const [lots, setLots] = useState<HerdLot[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [v, c, u, l] = await Promise.all([
        api<Vaccine[]>("/vaccines"),
        api<Campaign[]>("/vaccines/campaigns"),
        api<Campaign[]>("/vaccines/upcoming"),
        api<HerdLot[]>("/herd/lots"),
      ]);
      setVaccines(v);
      setCampaigns(c);
      setUpcoming(u);
      setLots(l);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onVaccine(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await api("/vaccines", {
        method: "POST",
        body: JSON.stringify({
          name: String(fd.get("name")),
          manufacturer: String(fd.get("manufacturer") || "") || undefined,
          notes: String(fd.get("notes") || "") || undefined,
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar vacina");
    } finally {
      setSubmitting(false);
    }
  }

  async function onCampaign(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await api("/vaccines/campaigns", {
        method: "POST",
        body: JSON.stringify({
          vaccineId: String(fd.get("vaccineId")),
          date: String(fd.get("date")),
          doses: Number(fd.get("doses")),
          cost: fd.get("cost") ? Number(fd.get("cost")) : undefined,
          herdLotId: String(fd.get("herdLotId") || "") || undefined,
          nextDueDate: String(fd.get("nextDueDate") || "") || undefined,
          notes: String(fd.get("notes") || "") || undefined,
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar campanha");
    } finally {
      setSubmitting(false);
    }
  }

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
        <>
          <FormCard title="Nova vacina" onSubmit={onVaccine} submitting={submitting}>
            <FormGrid>
              <Input label="Nome" name="name" required minLength={2} />
              <Input label="Fabricante" name="manufacturer" />
              <Textarea label="Observações" name="notes" />
            </FormGrid>
          </FormCard>
          {vaccines.length === 0 ? (
            <EmptyState message="Nenhuma vacina cadastrada." />
          ) : (
            <Table headers={["Nome", "Fabricante"]}>
              {vaccines.map((v) => (
                <tr key={v.id}>
                  <Td>{v.name}</Td>
                  <Td>{v.manufacturer ?? "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </>
      ) : (
        <>
          <FormCard title="Nova campanha" onSubmit={onCampaign} submitting={submitting}>
            <FormGrid>
              <Select label="Vacina" name="vaccineId" required>
                {vaccines.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </Select>
              <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
              <Input label="Doses" name="doses" type="number" min={1} required />
              <Input label="Custo" name="cost" type="number" step="0.01" />
              <Select label="Lote" name="herdLotId" defaultValue="">
                <option value="">—</option>
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </Select>
              <Input label="Próxima dose" name="nextDueDate" type="date" />
              <Textarea label="Observações" name="notes" />
            </FormGrid>
          </FormCard>
          {campaigns.length === 0 ? (
            <EmptyState message="Nenhuma campanha registrada." />
          ) : (
            <Table headers={["Data", "Vacina", "Doses", "Custo", "Próxima"]}>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <Td>{formatDate(c.date)}</Td>
                  <Td>{c.vaccine?.name ?? "—"}</Td>
                  <Td>{formatNumber(c.doses)}</Td>
                  <Td>{c.cost != null ? formatCurrency(c.cost) : "—"}</Td>
                  <Td>{formatDate(c.nextDueDate)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  );
}
