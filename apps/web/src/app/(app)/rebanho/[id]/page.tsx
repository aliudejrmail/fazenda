"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useFormSubmit } from "@/lib/use-form-submit";
import type { FeedRecord, LotDetail } from "@/lib/types";
import {
  HERD_CATEGORY_LABELS,
  LOT_SEX_LABELS,
  LOT_STATUS_LABELS,
  PRODUCTION_SYSTEM_LABELS,
  formatCurrency,
  formatDate,
  formatGmd,
  formatKg,
  formatNumber,
  labelOf,
  optionsFrom,
  toDateInput,
  todayISO,
} from "@/lib/format";
import { Input, Select, Textarea } from "@/components/ui/Field";
import {
  Alert,
  EmptyState,
  FormCard,
  FormGrid,
  PageHeader,
  Stat,
} from "@/components/ui/LayoutBits";
import { Table, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

export default function LoteDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<LotDetail | null>(null);
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { submitting, submit } = useFormSubmit(setError);
  const [panel, setPanel] = useState<"none" | "weighing" | "edit">("none");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [lotDetail, feeds] = await Promise.all([
        api<LotDetail>(`/herd/lots/${id}`),
        api<FeedRecord[]>(`/feeding/records?herdLotId=${id}`),
      ]);
      setData(lotDetail);
      setFeedRecords(feeds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar lote");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onWeighing(e: FormEvent<HTMLFormElement>) {
    const ok = await submit(
      e,
      async (fd) => {
        await api("/herd/weighings", {
          method: "POST",
          body: JSON.stringify({
            herdLotId: id,
            date: String(fd.get("date")),
            avgWeightKg: Number(fd.get("avgWeightKg")),
            quantity: Number(fd.get("quantity")),
            notes: String(fd.get("notes") || "") || undefined,
          }),
        });
        await load();
      },
      "Erro ao registrar pesagem",
    );
    if (ok) setPanel("none");
  }

  async function onEdit(e: FormEvent<HTMLFormElement>) {
    const ok = await submit(
      e,
      async (fd) => {
        const entryWeight = String(fd.get("entryWeightKg") || "");
        const targetWeight = String(fd.get("targetWeightKg") || "");
        await api(`/herd/lots/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: String(fd.get("name")),
            sex: String(fd.get("sex")),
            quantity: Number(fd.get("quantity")),
            entryDate: String(fd.get("entryDate") || "") || undefined,
            entryWeightKg: entryWeight ? Number(entryWeight) : undefined,
            targetWeightKg: targetWeight ? Number(targetWeight) : undefined,
            notes: String(fd.get("notes") || "") || undefined,
          }),
        });
        await load();
      },
      "Erro ao editar lote",
    );
    if (ok) setPanel("none");
  }

  if (loading && !data) {
    return <p className="text-sm text-[var(--ink-muted)]">Carregando...</p>;
  }
  if (error && !data) return <Alert>{error}</Alert>;
  if (!data) return <EmptyState message="Lote não encontrado." />;

  const { lot, indicators: ind, weighings } = data;

  return (
    <div>
      <PageHeader
        title={lot.name}
        description="Indicadores de desempenho e histórico de pesagens"
        actions={
          <Link href="/rebanho">
            <Button type="button" variant="secondary">
              Voltar ao rebanho
            </Button>
          </Link>
        }
      />

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--ink-muted)]">
        <span>{labelOf(HERD_CATEGORY_LABELS, lot.category)}</span>
        <span>·</span>
        <span>{labelOf(PRODUCTION_SYSTEM_LABELS, lot.system)}</span>
        <span>·</span>
        <span>{labelOf(LOT_SEX_LABELS, lot.sex)}</span>
        <span>·</span>
        <span>{labelOf(LOT_STATUS_LABELS, lot.status)}</span>
        {lot.retiro?.name ? (
          <>
            <span>·</span>
            <span>Retiro: {lot.retiro.name}</span>
          </>
        ) : null}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Cabeças" value={formatNumber(lot.quantity)} />
        <Stat label="Dias no lote" value={formatNumber(ind.daysInLot)} />
        <Stat label="Peso atual" value={formatKg(ind.currentWeightKg)} />
        <Stat label="Peso-meta" value={formatKg(lot.targetWeightKg)} />
        <Stat label="Ganho/animal" value={formatKg(ind.weightGainPerAnimal)} />
        <Stat label="GMD período" value={formatGmd(ind.gmdPeriod)} />
        <Stat label="GMD acumulado" value={formatGmd(ind.gmdAccumulated)} />
        <Stat
          label="Falta p/ meta"
          value={
            ind.remainingToTargetKg == null
              ? "—"
              : ind.remainingToTargetKg <= 0
                ? "Meta atingida"
                : formatKg(ind.remainingToTargetKg)
          }
        />
        <Stat
          label="Dias p/ meta"
          value={
            ind.daysToTarget == null
              ? "—"
              : ind.daysToTarget === 0
                ? "0"
                : formatNumber(ind.daysToTarget)
          }
        />
        <Stat
          label="Previsão meta"
          value={
            ind.estimatedTargetDate
              ? formatDate(ind.estimatedTargetDate)
              : "—"
          }
        />
        <Stat label="Peso entrada" value={formatKg(lot.entryWeightKg)} />
        <Stat
          label="Data entrada"
          value={formatDate(lot.entryDate ?? lot.createdAt)}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button type="button" onClick={() => setPanel("weighing")}>
          Registrar pesagem
        </Button>
        <Button type="button" variant="secondary" onClick={() => setPanel("edit")}>
          Editar lote
        </Button>
        <Link href="/alimentacao">
          <Button type="button" variant="ghost">
            Alimentação
          </Button>
        </Link>
        {lot.retiroId ? (
          <Link href={`/retiros/${lot.retiroId}`}>
            <Button type="button" variant="ghost">
              Ver retiro
            </Button>
          </Link>
        ) : null}
      </div>

      {panel === "weighing" ? (
        <FormCard
          title="Nova pesagem"
          onSubmit={onWeighing}
          submitting={submitting}
          submitLabel="Salvar pesagem"
        >
          <FormGrid>
            <Input
              label="Data"
              name="date"
              type="date"
              required
              defaultValue={todayISO()}
            />
            <Input
              label="Peso médio (kg)"
              name="avgWeightKg"
              type="number"
              step="0.01"
              min={0}
              required
            />
            <Input
              label="Quantidade pesada"
              name="quantity"
              type="number"
              min={1}
              required
              defaultValue={lot.quantity}
            />
            <Textarea label="Observação" name="notes" />
          </FormGrid>
          <Button type="button" variant="ghost" onClick={() => setPanel("none")}>
            Cancelar
          </Button>
        </FormCard>
      ) : null}

      {panel === "edit" ? (
        <FormCard
          title="Editar lote"
          onSubmit={onEdit}
          submitting={submitting}
          submitLabel="Salvar"
        >
          <FormGrid>
            <Input label="Nome" name="name" required defaultValue={lot.name} />
            <Select label="Sexo" name="sex" defaultValue={lot.sex ?? "MISTO"}>
              {optionsFrom(LOT_SEX_LABELS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Input
              label="Quantidade"
              name="quantity"
              type="number"
              min={0}
              required
              defaultValue={lot.quantity}
            />
            <Input
              label="Data de entrada"
              name="entryDate"
              type="date"
              defaultValue={toDateInput(lot.entryDate ?? lot.createdAt)}
            />
            <Input
              label="Peso entrada (kg)"
              name="entryWeightKg"
              type="number"
              step="0.01"
              min={0}
              defaultValue={
                lot.entryWeightKg != null ? Number(lot.entryWeightKg) : ""
              }
            />
            <Input
              label="Peso-meta (kg)"
              name="targetWeightKg"
              type="number"
              step="0.01"
              min={0}
              defaultValue={
                lot.targetWeightKg != null ? Number(lot.targetWeightKg) : ""
              }
            />
            <Textarea
              label="Observações"
              name="notes"
              defaultValue={lot.notes ?? ""}
            />
          </FormGrid>
          <Button type="button" variant="ghost" onClick={() => setPanel("none")}>
            Cancelar
          </Button>
        </FormCard>
      ) : null}

      <section>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl text-[var(--green)]">
          Histórico de pesagens
        </h2>
        {weighings.length === 0 ? (
          <EmptyState message="Nenhuma pesagem registrada. Cadastre peso de entrada e pesagens para calcular GMD e previsão." />
        ) : (
          <Table
            headers={[
              "Data",
              "Qtd",
              "Peso médio",
              "Peso total",
              "GMD",
              "Obs.",
            ]}
          >
            {[...weighings].reverse().map((w) => (
              <tr key={w.id}>
                <Td>{formatDate(w.date)}</Td>
                <Td>{formatNumber(w.quantity)}</Td>
                <Td>{formatKg(w.avgWeightKg)}</Td>
                <Td>{formatKg(w.totalWeightKg)}</Td>
                <Td>{formatGmd(w.gmd)}</Td>
                <Td>{w.notes || "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl text-[var(--green)]">
          Alimentação recente
        </h2>
        {feedRecords.length === 0 ? (
          <EmptyState message="Nenhum consumo registrado para este lote." />
        ) : (
          <Table headers={["Data", "Dieta", "Cab", "Total kg", "Custo", "R$/kg"]}>
            {feedRecords.slice(0, 10).map((r) => (
              <tr key={r.id}>
                <Td>{formatDate(r.date)}</Td>
                <Td>{r.diet?.name ?? "—"}</Td>
                <Td>{formatNumber(r.animals)}</Td>
                <Td>{formatNumber(r.totalKg)}</Td>
                <Td>{formatCurrency(r.totalCost)}</Td>
                <Td>{formatCurrency(r.costPerKg)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </div>
  );
}
