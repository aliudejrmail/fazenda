"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { ReportsOverview } from "@/lib/types";
import {
  COST_CENTER_LABELS,
  HERD_CATEGORY_LABELS,
  PRODUCTION_SYSTEM_LABELS,
  formatCurrency,
  formatDate,
  formatNumber,
  labelOf,
  todayISO,
} from "@/lib/format";
import { Input } from "@/components/ui/Field";
import {
  Alert,
  EmptyState,
  PageHeader,
  Stat,
} from "@/components/ui/LayoutBits";
import { Table, Tabs, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

function monthStartISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const v = String(cell ?? "");
          if (v.includes(",") || v.includes('"') || v.includes("\n")) {
            return `"${v.replace(/"/g, '""')}"`;
          }
          return v;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RelatoriosPage() {
  const [tab, setTab] = useState("herd");
  const [from, setFrom] = useState(monthStartISO());
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState<ReportsOverview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ from, to }).toString();
      setData(await api<ReportsOverview>(`/reports/overview?${qs}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const periodLabel = useMemo(() => {
    if (!data) return "";
    return `${formatDate(data.period.from)} a ${formatDate(data.period.to)}`;
  }, [data]);

  function exportCurrent() {
    if (!data) return;
    if (tab === "herd") {
      downloadCsv(`rebanho_${from}_${to}.csv`, [
        ["Nome", "Categoria", "Sistema", "Qtd", "Retiro"],
        ...data.herd.lots.map((l) => [
          l.name,
          labelOf(HERD_CATEGORY_LABELS, l.category),
          labelOf(PRODUCTION_SYSTEM_LABELS, l.system),
          String(l.quantity),
          l.retiro ?? "",
        ]),
      ]);
      return;
    }
    if (tab === "gmd") {
      downloadCsv(`gmd_${from}_${to}.csv`, [
        ["Lote", "GMD", "Pesagens"],
        ...data.gmd.lots.map((l) => [
          l.lotName,
          String(l.gmd),
          String(l.weighings),
        ]),
      ]);
      return;
    }
    if (tab === "finance") {
      downloadCsv(`financeiro_${from}_${to}.csv`, [
        ["Centro", "Valor"],
        ...data.finance.expensesByCenter.map((e) => [
          labelOf(COST_CENTER_LABELS, e.costCenter),
          String(e.amount),
        ]),
        ["Receitas", String(data.finance.totalRevenues)],
        ["Despesas", String(data.finance.totalExpenses)],
        ["Resultado", String(data.finance.result)],
      ]);
      return;
    }
    if (tab === "vaccines") {
      downloadCsv(`vacinas_${from}_${to}.csv`, [
        ["Data", "Vacina", "Lote", "Doses", "Custo", "Próxima"],
        ...data.vaccines.map((v) => [
          formatDate(v.date),
          v.vaccine,
          v.lot ?? "",
          String(v.doses),
          String(v.cost),
          v.nextDueDate ? formatDate(v.nextDueDate) : "",
        ]),
      ]);
      return;
    }
    downloadCsv(`alimentacao_${from}_${to}.csv`, [
      ["Data", "Lote", "Dieta", "Cab", "kg", "Custo"],
      ...data.feeding.records.map((r) => [
        formatDate(r.date),
        r.lot,
        r.diet,
        String(r.animals),
        String(r.totalKg),
        String(r.totalCost),
      ]),
    ]);
  }

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Visão consolidada por período com exportação CSV"
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <Input
              label="De"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              label="Até"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <Button type="button" variant="secondary" onClick={() => void load()}>
              Atualizar
            </Button>
            <Button type="button" onClick={exportCurrent} disabled={!data}>
              Exportar CSV
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => window.print()}
              disabled={!data}
            >
              Imprimir
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      {loading && !data ? (
        <p className="text-sm text-[var(--ink-muted)]">Carregando...</p>
      ) : null}

      {data ? (
        <>
          <p className="mb-3 text-sm text-[var(--ink-muted)]">
            Período: {periodLabel}
          </p>

          <Tabs
            tabs={[
              { id: "herd", label: "Rebanho" },
              { id: "gmd", label: "GMD" },
              { id: "finance", label: "Financeiro" },
              { id: "vaccines", label: "Vacinas" },
              { id: "feeding", label: "Alimentação" },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === "herd" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Cabeças" value={formatNumber(data.herd.totalHeads)} />
                <Stat
                  label="Nascimentos"
                  value={formatNumber(
                    data.herd.births.bezerros + data.herd.births.bezerras,
                  )}
                />
                <Stat label="Mortes" value={formatNumber(data.herd.deaths)} />
                <Stat
                  label="Taxa prenhez"
                  value={
                    data.pregnancy.rate != null
                      ? `${formatNumber(data.pregnancy.rate)}%`
                      : "—"
                  }
                />
              </div>
              <Table headers={["Lote", "Categoria", "Sistema", "Qtd", "Retiro"]}>
                {data.herd.lots.map((l) => (
                  <tr key={l.id}>
                    <Td className="font-medium">{l.name}</Td>
                    <Td>{labelOf(HERD_CATEGORY_LABELS, l.category)}</Td>
                    <Td>{labelOf(PRODUCTION_SYSTEM_LABELS, l.system)}</Td>
                    <Td>{formatNumber(l.quantity)}</Td>
                    <Td>{l.retiro ?? "—"}</Td>
                  </tr>
                ))}
              </Table>
              <section>
                <h2 className="mb-2 font-[family-name:var(--font-display)] text-xl text-[var(--green)]">
                  Prenhez por retiro
                </h2>
                {data.pregnancy.byRetiro.length === 0 ? (
                  <EmptyState message="Sem retiros." />
                ) : (
                  <Table headers={["Retiro", "Prenhes", "Vazias", "Taxa"]}>
                    {data.pregnancy.byRetiro.map((r) => (
                      <tr key={r.id}>
                        <Td>{r.name}</Td>
                        <Td>{formatNumber(r.pregnant)}</Td>
                        <Td>{formatNumber(r.empty)}</Td>
                        <Td>
                          {r.rate != null ? `${formatNumber(r.rate)}%` : "—"}
                        </Td>
                      </tr>
                    ))}
                  </Table>
                )}
              </section>
            </div>
          ) : null}

          {tab === "gmd" ? (
            <div className="space-y-4">
              <Stat
                label="GMD médio"
                value={
                  data.gmd.avgGmd != null
                    ? `${formatNumber(data.gmd.avgGmd)} kg/dia`
                    : "—"
                }
              />
              {data.gmd.lots.length === 0 ? (
                <EmptyState message="Sem pesagens suficientes no período." />
              ) : (
                <Table headers={["Lote", "GMD", "Pesagens"]}>
                  {data.gmd.lots.map((l) => (
                    <tr key={l.lotId}>
                      <Td className="font-medium">{l.lotName}</Td>
                      <Td>{formatNumber(l.gmd)} kg/dia</Td>
                      <Td>{formatNumber(l.weighings)}</Td>
                    </tr>
                  ))}
                </Table>
              )}
            </div>
          ) : null}

          {tab === "finance" ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat
                  label="Receitas"
                  value={formatCurrency(data.finance.totalRevenues)}
                />
                <Stat
                  label="Despesas"
                  value={formatCurrency(data.finance.totalExpenses)}
                />
                <Stat
                  label="Resultado"
                  value={formatCurrency(data.finance.result)}
                />
              </div>
              <Table headers={["Centro de custo", "Valor"]}>
                {data.finance.expensesByCenter.map((e) => (
                  <tr key={e.costCenter}>
                    <Td>{labelOf(COST_CENTER_LABELS, e.costCenter)}</Td>
                    <Td>{formatCurrency(e.amount)}</Td>
                  </tr>
                ))}
              </Table>
            </div>
          ) : null}

          {tab === "vaccines" ? (
            data.vaccines.length === 0 ? (
              <EmptyState message="Nenhuma campanha no período." />
            ) : (
              <Table headers={["Data", "Vacina", "Lote", "Doses", "Custo", "Próxima"]}>
                {data.vaccines.map((v) => (
                  <tr key={v.id}>
                    <Td>{formatDate(v.date)}</Td>
                    <Td>{v.vaccine}</Td>
                    <Td>{v.lot ?? "—"}</Td>
                    <Td>{formatNumber(v.doses)}</Td>
                    <Td>{formatCurrency(v.cost)}</Td>
                    <Td>
                      {v.nextDueDate ? formatDate(v.nextDueDate) : "—"}
                    </Td>
                  </tr>
                ))}
              </Table>
            )
          ) : null}

          {tab === "feeding" ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat
                  label="Consumo"
                  value={`${formatNumber(data.feeding.totalKg)} kg`}
                />
                <Stat
                  label="Custo"
                  value={formatCurrency(data.feeding.totalCost)}
                />
                <Stat
                  label="R$/kg"
                  value={
                    data.feeding.costPerKg != null
                      ? formatCurrency(data.feeding.costPerKg)
                      : "—"
                  }
                />
              </div>
              {data.feeding.records.length === 0 ? (
                <EmptyState message="Nenhum consumo no período." />
              ) : (
                <Table headers={["Data", "Lote", "Dieta", "Cab", "kg", "Custo"]}>
                  {data.feeding.records.map((r) => (
                    <tr key={r.id}>
                      <Td>{formatDate(r.date)}</Td>
                      <Td>{r.lot}</Td>
                      <Td>{r.diet}</Td>
                      <Td>{formatNumber(r.animals)}</Td>
                      <Td>{formatNumber(r.totalKg)}</Td>
                      <Td>{formatCurrency(r.totalCost)}</Td>
                    </tr>
                  ))}
                </Table>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
