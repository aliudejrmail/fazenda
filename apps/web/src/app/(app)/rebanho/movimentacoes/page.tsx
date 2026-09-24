"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { HerdLot, MovementRecord, WeighingRecord } from "@/lib/types";
import {
  MOVEMENT_TYPE_LABELS,
  PRODUCTION_SYSTEM_LABELS,
  formatCurrency,
  formatDate,
  formatNumber,
  labelOf,
  optionsFrom,
  todayISO,
} from "@/lib/format";
import { Input, Select, Textarea } from "@/components/ui/Field";
import {
  Alert,
  EmptyState,
  FormCard,
  FormGrid,
  PageHeader,
} from "@/components/ui/LayoutBits";
import { Table, Tabs, Td } from "@/components/ui/Table";

export default function MovimentacoesPage() {
  const [tab, setTab] = useState("movements");
  const [lots, setLots] = useState<HerdLot[]>([]);
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [weighings, setWeighings] = useState<WeighingRecord[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [l, m, w] = await Promise.all([
        api<HerdLot[]>("/herd/lots"),
        api<MovementRecord[]>("/herd/movements"),
        api<WeighingRecord[]>("/herd/weighings"),
      ]);
      setLots(l);
      setMovements(m);
      setWeighings(w);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function lotName(id?: string | null) {
    if (!id) return "—";
    return lots.find((l) => l.id === id)?.name ?? id;
  }

  async function onMovement(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await api("/herd/movements", {
        method: "POST",
        body: JSON.stringify({
          type: String(fd.get("type")),
          date: String(fd.get("date")),
          quantity: Number(fd.get("quantity")),
          fromLotId: String(fd.get("fromLotId") || "") || undefined,
          toLotId: String(fd.get("toLotId") || "") || undefined,
          toSystem: String(fd.get("toSystem") || "") || undefined,
          unitPrice: fd.get("unitPrice") ? Number(fd.get("unitPrice")) : undefined,
          totalPrice: fd.get("totalPrice") ? Number(fd.get("totalPrice")) : undefined,
          weightArroba: fd.get("weightArroba")
            ? Number(fd.get("weightArroba"))
            : undefined,
          notes: String(fd.get("notes") || "") || undefined,
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  async function onWeighing(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await api("/herd/weighings", {
        method: "POST",
        body: JSON.stringify({
          herdLotId: String(fd.get("herdLotId")),
          date: String(fd.get("date")),
          avgWeightKg: Number(fd.get("avgWeightKg")),
          quantity: Number(fd.get("quantity")),
          notes: String(fd.get("notes") || "") || undefined,
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  const lotOpts = lots.map((l) => (
    <option key={l.id} value={l.id}>
      {l.name}
    </option>
  ));

  return (
    <div>
      <PageHeader
        title="Movimentações"
        description="Transferências, compras, vendas e pesagens"
      />
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <Tabs
        tabs={[
          { id: "movements", label: "Movimentações" },
          { id: "weighings", label: "Pesagens" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "movements" ? (
        <>
          <FormCard title="Nova movimentação" onSubmit={onMovement} submitting={submitting}>
            <FormGrid>
              <Select label="Tipo" name="type" required defaultValue="TRANSFERENCIA">
                {optionsFrom(MOVEMENT_TYPE_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
              <Input label="Quantidade" name="quantity" type="number" min={1} required />
              <Select label="Lote origem" name="fromLotId" defaultValue="">
                <option value="">—</option>
                {lotOpts}
              </Select>
              <Select label="Lote destino" name="toLotId" defaultValue="">
                <option value="">—</option>
                {lotOpts}
              </Select>
              <Select label="Sistema destino" name="toSystem" defaultValue="">
                <option value="">—</option>
                {optionsFrom(PRODUCTION_SYSTEM_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <Input label="Preço unitário" name="unitPrice" type="number" step="0.01" />
              <Input label="Preço total" name="totalPrice" type="number" step="0.01" />
              <Input label="@ (arroba)" name="weightArroba" type="number" step="0.01" />
              <Textarea label="Observações" name="notes" />
            </FormGrid>
          </FormCard>
          {movements.length === 0 ? (
            <EmptyState message="Nenhuma movimentação." />
          ) : (
            <Table headers={["Data", "Tipo", "Qtd", "Origem", "Destino", "Total"]}>
              {movements.map((m) => (
                <tr key={m.id}>
                  <Td>{formatDate(m.date)}</Td>
                  <Td>{labelOf(MOVEMENT_TYPE_LABELS, m.type)}</Td>
                  <Td>{formatNumber(m.quantity)}</Td>
                  <Td>{lotName(m.fromLotId)}</Td>
                  <Td>{lotName(m.toLotId)}</Td>
                  <Td>{m.totalPrice != null ? formatCurrency(m.totalPrice) : "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </>
      ) : (
        <>
          <FormCard title="Nova pesagem" onSubmit={onWeighing} submitting={submitting}>
            <FormGrid>
              <Select label="Lote" name="herdLotId" required>
                {lotOpts}
              </Select>
              <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
              <Input label="Peso médio (kg)" name="avgWeightKg" type="number" step="0.1" required />
              <Input label="Quantidade" name="quantity" type="number" min={1} required />
              <Textarea label="Observações" name="notes" />
            </FormGrid>
          </FormCard>
          {weighings.length === 0 ? (
            <EmptyState message="Nenhuma pesagem." />
          ) : (
            <Table headers={["Data", "Lote", "Peso médio", "Qtd"]}>
              {weighings.map((w) => (
                <tr key={w.id}>
                  <Td>{formatDate(w.date)}</Td>
                  <Td>{lotName(w.herdLotId)}</Td>
                  <Td>{formatNumber(w.avgWeightKg)} kg</Td>
                  <Td>{formatNumber(w.quantity)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  );
}
