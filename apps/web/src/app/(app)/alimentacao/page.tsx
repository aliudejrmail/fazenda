"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type {
  FeedAssignment,
  FeedDiet,
  FeedRecord,
  FeedingSummary,
  HerdLot,
  InventoryItem,
} from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatNumber,
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
import { Table, Tabs, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

type IngredientRow = { inventoryItemId: string; percent: string };

export default function AlimentacaoPage() {
  const [tab, setTab] = useState("resumo");
  const [summary, setSummary] = useState<FeedingSummary | null>(null);
  const [diets, setDiets] = useState<FeedDiet[]>([]);
  const [assignments, setAssignments] = useState<FeedAssignment[]>([]);
  const [records, setRecords] = useState<FeedRecord[]>([]);
  const [lots, setLots] = useState<HerdLot[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { inventoryItemId: "", percent: "" },
  ]);

  const feedItems = useMemo(
    () =>
      items.filter((i) => i.category === "RACAO" || i.category === "INSUMO"),
    [items],
  );

  const load = useCallback(async () => {
    setError("");
    try {
      const [s, d, a, r, l, i] = await Promise.all([
        api<FeedingSummary>("/feeding/summary"),
        api<FeedDiet[]>("/feeding/diets"),
        api<FeedAssignment[]>("/feeding/assignments"),
        api<FeedRecord[]>("/feeding/records"),
        api<HerdLot[]>("/herd/lots"),
        api<InventoryItem[]>("/inventory/items"),
      ]);
      setSummary(s);
      setDiets(d);
      setAssignments(a);
      setRecords(r);
      setLots(l.filter((x) => x.status !== "ENCERRADO" && x.status !== "VENDIDO"));
      setItems(i);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreateDiet(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const rows = ingredients.filter((r) => r.inventoryItemId && r.percent);
    try {
      await api("/feeding/diets", {
        method: "POST",
        body: JSON.stringify({
          name: String(fd.get("name")),
          description: String(fd.get("description") || "") || undefined,
          kgPerAnimal: Number(fd.get("kgPerAnimal")),
          ingredients: rows.map((r) => ({
            inventoryItemId: r.inventoryItemId,
            percent: Number(r.percent),
          })),
        }),
      });
      e.currentTarget.reset();
      setIngredients([{ inventoryItemId: "", percent: "" }]);
      await load();
      setTab("dietas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar dieta");
    } finally {
      setSubmitting(false);
    }
  }

  async function onAssign(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const kg = String(fd.get("kgPerAnimal") || "");
    try {
      await api("/feeding/assignments", {
        method: "POST",
        body: JSON.stringify({
          herdLotId: String(fd.get("herdLotId")),
          dietId: String(fd.get("dietId")),
          startDate: String(fd.get("startDate")),
          kgPerAnimal: kg ? Number(kg) : undefined,
        }),
      });
      e.currentTarget.reset();
      await load();
      setTab("atribuicoes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atribuir dieta");
    } finally {
      setSubmitting(false);
    }
  }

  async function onRecord(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const animals = String(fd.get("animals") || "");
    const kg = String(fd.get("kgPerAnimal") || "");
    const dietId = String(fd.get("dietId") || "");
    try {
      await api("/feeding/records", {
        method: "POST",
        body: JSON.stringify({
          herdLotId: String(fd.get("herdLotId")),
          dietId: dietId || undefined,
          date: String(fd.get("date")),
          animals: animals ? Number(animals) : undefined,
          kgPerAnimal: kg ? Number(kg) : undefined,
          notes: String(fd.get("notes") || "") || undefined,
        }),
      });
      e.currentTarget.reset();
      await load();
      setTab("consumo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar consumo");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeleteDiet(id: string) {
    if (!confirm("Excluir esta dieta?")) return;
    try {
      await api(`/feeding/diets/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir dieta");
    }
  }

  const percentSum = ingredients.reduce(
    (acc, r) => acc + (Number(r.percent) || 0),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Alimentação"
        description="Dietas, atribuição a lotes, consumo diário e custo"
      />

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <Tabs
        tabs={[
          { id: "resumo", label: "Resumo" },
          { id: "dietas", label: "Dietas" },
          { id: "atribuicoes", label: "Atribuições" },
          { id: "consumo", label: "Consumo" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "resumo" ? (
        <div className="mt-4 space-y-6">
          {summary ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Registros" value={formatNumber(summary.totals.records)} />
                <Stat label="Total consumido" value={`${formatNumber(summary.totals.totalKg)} kg`} />
                <Stat label="Custo total" value={formatCurrency(summary.totals.totalCost)} />
                <Stat
                  label="Custo médio/kg"
                  value={
                    summary.totals.avgCostPerKg != null
                      ? formatCurrency(summary.totals.avgCostPerKg)
                      : "—"
                  }
                />
              </div>

              {summary.lowStock.length > 0 ? (
                <section>
                  <h2 className="mb-2 text-sm font-semibold text-red-800">
                    Estoque baixo (ração/insumo)
                  </h2>
                  <Table headers={["Item", "Atual", "Mínimo"]}>
                    {summary.lowStock.map((i) => (
                      <tr key={i.id}>
                        <Td>{i.name}</Td>
                        <Td>
                          {formatNumber(i.quantity)} {i.unit}
                        </Td>
                        <Td>
                          {formatNumber(i.minQuantity)} {i.unit}
                        </Td>
                      </tr>
                    ))}
                  </Table>
                </section>
              ) : null}

              <section>
                <h2 className="mb-2 font-[family-name:var(--font-display)] text-xl text-[var(--green)]">
                  Por lote
                </h2>
                {summary.byLot.length === 0 ? (
                  <EmptyState message="Nenhum consumo registrado ainda." />
                ) : (
                  <Table headers={["Lote", "Registros", "kg", "Custo", "R$/kg", ""]}>
                    {summary.byLot.map((l) => (
                      <tr key={l.herdLotId}>
                        <Td className="font-medium">{l.herdLotName}</Td>
                        <Td>{formatNumber(l.records)}</Td>
                        <Td>{formatNumber(l.totalKg)}</Td>
                        <Td>{formatCurrency(l.totalCost)}</Td>
                        <Td>
                          {l.costPerKg != null ? formatCurrency(l.costPerKg) : "—"}
                        </Td>
                        <Td>
                          <Link href={`/rebanho/${l.herdLotId}`}>
                            <Button type="button" variant="ghost">
                              Ver lote
                            </Button>
                          </Link>
                        </Td>
                      </tr>
                    ))}
                  </Table>
                )}
              </section>
            </>
          ) : (
            <p className="text-sm text-[var(--ink-muted)]">Carregando...</p>
          )}
        </div>
      ) : null}

      {tab === "dietas" ? (
        <div className="mt-4 space-y-6">
          <FormCard title="Nova dieta" onSubmit={onCreateDiet} submitting={submitting}>
            <FormGrid>
              <Input label="Nome" name="name" required minLength={2} />
              <Input
                label="kg / animal / dia"
                name="kgPerAnimal"
                type="number"
                step="0.001"
                min={0}
                required
                defaultValue={10}
              />
              <Textarea label="Descrição" name="description" />
            </FormGrid>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--ink-muted)]">
                  Ingredientes (soma = 100%) — atual: {percentSum.toFixed(1)}%
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setIngredients((prev) => [
                      ...prev,
                      { inventoryItemId: "", percent: "" },
                    ])
                  }
                >
                  + item
                </Button>
              </div>
              {ingredients.map((row, idx) => (
                <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                  <Select
                    label={idx === 0 ? "Insumo" : ""}
                    value={row.inventoryItemId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setIngredients((prev) =>
                        prev.map((p, i) =>
                          i === idx ? { ...p, inventoryItemId: v } : p,
                        ),
                      );
                    }}
                  >
                    <option value="">Selecione</option>
                    {feedItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} ({formatNumber(it.quantity)} {it.unit})
                      </option>
                    ))}
                  </Select>
                  <Input
                    label={idx === 0 ? "%" : ""}
                    type="number"
                    step="0.01"
                    min={0.01}
                    max={100}
                    value={row.percent}
                    onChange={(e) => {
                      const v = e.target.value;
                      setIngredients((prev) =>
                        prev.map((p, i) =>
                          i === idx ? { ...p, percent: v } : p,
                        ),
                      );
                    }}
                  />
                  <div className={idx === 0 ? "pt-6" : ""}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setIngredients((prev) =>
                          prev.length === 1
                            ? prev
                            : prev.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </FormCard>

          {diets.length === 0 ? (
            <EmptyState message="Nenhuma dieta cadastrada." />
          ) : (
            <Table headers={["Nome", "kg/animal", "Ingredientes", "Status", ""]}>
              {diets.map((d) => (
                <tr key={d.id}>
                  <Td className="font-medium">{d.name}</Td>
                  <Td>{formatNumber(d.kgPerAnimal)}</Td>
                  <Td>
                    {d.ingredients.length === 0
                      ? "—"
                      : d.ingredients
                          .map(
                            (ing) =>
                              `${ing.inventoryItem?.name ?? "?"} ${formatNumber(ing.percent)}%`,
                          )
                          .join(", ")}
                  </Td>
                  <Td>{d.active ? "Ativa" : "Inativa"}</Td>
                  <Td>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => void onDeleteDiet(d.id)}
                    >
                      Excluir
                    </Button>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      ) : null}

      {tab === "atribuicoes" ? (
        <div className="mt-4 space-y-6">
          <FormCard
            title="Atribuir dieta ao lote"
            onSubmit={onAssign}
            submitting={submitting}
            submitLabel="Atribuir"
          >
            <FormGrid>
              <Select label="Lote" name="herdLotId" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({formatNumber(l.quantity)} cab)
                  </option>
                ))}
              </Select>
              <Select label="Dieta" name="dietId" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {diets
                  .filter((d) => d.active)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({formatNumber(d.kgPerAnimal)} kg/cab)
                    </option>
                  ))}
              </Select>
              <Input
                label="Início"
                name="startDate"
                type="date"
                required
                defaultValue={todayISO()}
              />
              <Input
                label="kg/animal (opcional)"
                name="kgPerAnimal"
                type="number"
                step="0.001"
                min={0}
              />
            </FormGrid>
          </FormCard>

          {assignments.length === 0 ? (
            <EmptyState message="Nenhuma atribuição ativa." />
          ) : (
            <Table headers={["Lote", "Dieta", "kg/animal", "Desde"]}>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <Td className="font-medium">{a.herdLot?.name ?? "—"}</Td>
                  <Td>{a.diet?.name ?? "—"}</Td>
                  <Td>
                    {formatNumber(
                      a.kgPerAnimal ?? a.diet?.kgPerAnimal ?? 0,
                    )}
                  </Td>
                  <Td>{formatDate(a.startDate)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      ) : null}

      {tab === "consumo" ? (
        <div className="mt-4 space-y-6">
          <FormCard
            title="Registrar consumo diário"
            onSubmit={onRecord}
            submitting={submitting}
            submitLabel="Registrar e baixar estoque"
          >
            <FormGrid>
              <Select label="Lote" name="herdLotId" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({formatNumber(l.quantity)} cab)
                  </option>
                ))}
              </Select>
              <Select label="Dieta (opcional se já atribuída)" name="dietId" defaultValue="">
                <option value="">Usar dieta do lote</option>
                {diets
                  .filter((d) => d.active)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </Select>
              <Input
                label="Data"
                name="date"
                type="date"
                required
                defaultValue={todayISO()}
              />
              <Input
                label="Animais (vazio = qtd do lote)"
                name="animals"
                type="number"
                min={1}
              />
              <Input
                label="kg/animal (vazio = da dieta)"
                name="kgPerAnimal"
                type="number"
                step="0.001"
                min={0}
              />
              <Textarea label="Observação" name="notes" />
            </FormGrid>
          </FormCard>

          {records.length === 0 ? (
            <EmptyState message="Nenhum consumo registrado." />
          ) : (
            <Table
              headers={[
                "Data",
                "Lote",
                "Dieta",
                "Cab",
                "kg/cab",
                "Total kg",
                "Custo",
                "R$/kg",
              ]}
            >
              {records.map((r) => (
                <tr key={r.id}>
                  <Td>{formatDate(r.date)}</Td>
                  <Td className="font-medium">{r.herdLot?.name ?? "—"}</Td>
                  <Td>{r.diet?.name ?? "—"}</Td>
                  <Td>{formatNumber(r.animals)}</Td>
                  <Td>{formatNumber(r.kgPerAnimal)}</Td>
                  <Td>{formatNumber(r.totalKg)}</Td>
                  <Td>{formatCurrency(r.totalCost)}</Td>
                  <Td>{formatCurrency(r.costPerKg)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      ) : null}
    </div>
  );
}
