"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DashboardSummary } from "@/lib/types";
import {
  HERD_CATEGORY_LABELS,
  LOT_STATUS_LABELS,
  PRODUCTION_SYSTEM_LABELS,
  formatCurrency,
  formatNumber,
  todayISO,
} from "@/lib/format";
import { Alert, EmptyState, PageHeader, Stat } from "@/components/ui/LayoutBits";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  AlertIcon,
  CowIcon,
  DashCard,
  FilterSelect,
  KpiCard,
} from "@/components/dashboard/DashBits";
import {
  CategoryBars,
  GmdBars,
  HealthBars,
  LotControlTable,
  ReproductiveFunnel,
  WeightLine,
} from "@/components/dashboard/Charts";
import { AgendaDoDia } from "@/components/dashboard/AgendaDoDia";
import { HeroStats } from "@/components/dashboard/HeroStats";
import { ModuleShortcuts } from "@/components/dashboard/ModuleShortcuts";

/** "2026-09-28" -> "28/09/2026" (sem conversão de fuso, evita deslocar o dia). */
function formatBr(iso: string) {
  return iso.split("-").reverse().join("/");
}

function monthStartISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { selectedFarm } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(monthStartISO);
  const [to, setTo] = useState(todayISO);
  const [lotId, setLotId] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [system, setSystem] = useState("ALL");
  const [status, setStatus] = useState("ATIVO");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ from, to });
      const summary = await api<DashboardSummary>(
        `/dashboard/summary?${qs.toString()}`,
      );
      setData(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredLots = useMemo(() => {
    if (!data) return [];
    return data.lotControl.filter((l) => {
      if (lotId !== "ALL" && l.id !== lotId) return false;
      if (category !== "ALL" && l.category !== category) return false;
      if (system !== "ALL" && l.system !== system) return false;
      if (status !== "ALL" && l.status !== status) return false;
      return true;
    });
  }, [data, lotId, category, system, status]);

  const filteredStacked = useMemo(() => {
    if (!data) return [];
    if (category === "ALL" && system === "ALL" && lotId === "ALL") {
      return data.byCategoryStacked;
    }
    const map = new Map<
      string,
      { category: string; total: number; cria: number; recria: number; confin: number }
    >();
    for (const lot of filteredLots) {
      const cur = map.get(lot.category) ?? {
        category: lot.category,
        total: 0,
        cria: 0,
        recria: 0,
        confin: 0,
      };
      cur.total += lot.quantity;
      if (lot.system === "CRIA") cur.cria += lot.quantity;
      if (lot.system === "RECRIA") cur.recria += lot.quantity;
      if (lot.system === "CONFINAMENTO") cur.confin += lot.quantity;
      map.set(lot.category, cur);
    }
    return Array.from(map.values());
  }, [data, filteredLots, category, system, lotId]);

  const filteredHeads = filteredLots.reduce((s, l) => s + l.quantity, 0);

  if (loading && !data) {
    return <p className="text-sm text-[#6b655c]">Carregando painel...</p>;
  }
  if (error && !data) return <Alert>{error}</Alert>;
  if (!data) return <EmptyState message="Sem dados para exibir." />;

  const hasHerdFilter = lotId !== "ALL" || category !== "ALL" || system !== "ALL";
  const totalHeads = hasHerdFilter ? filteredHeads : data.totalHeads;

  // Números vivos exibidos nos cards de atalho (chave = href do módulo).
  const shortcutMetrics: Record<string, string> = {
    "/rebanho": `${formatNumber(data.lots.length)} lotes`,
    "/rebanho/reprodutivo": `${formatNumber(data.pregnancyRate)}% de partos`,
    "/vacinas": `${formatNumber(data.upcomingVaccines.length)} a vencer`,
    "/financeiro": formatCurrency(data.month.result),
    "/almoxarifado": `${formatNumber(data.lowStockCount)} em alerta`,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Painel pecuário"
        highlight="pecuário"
        description="Visão operacional da fazenda selecionada"
        actions={
          <label className="inline-flex items-center gap-2 rounded-xl bg-[var(--green)] px-3.5 py-2.5 text-sm text-[var(--cream)] shadow-[var(--shadow-sm)]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-75">
              Período
            </span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md bg-white/10 px-1.5 py-0.5 text-white outline-none"
            />
            <span className="opacity-60">a</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md bg-white/10 px-1.5 py-0.5 text-white outline-none"
            />
          </label>
        }
      />

      <div className="ui-surface flex flex-wrap gap-3 p-3.5">
        <div className="flex w-full flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
          Ciclo de produção
          <SegmentedControl
            label="Ciclo de produção"
            value={system}
            onChange={setSystem}
            options={[
              { value: "ALL", label: "Todos" },
              ...Object.entries(PRODUCTION_SYSTEM_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
        </div>
        <div className="flex min-w-[140px] flex-1 flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
          Propriedade
          <div className="rounded-lg border border-[var(--line-strong)] bg-[var(--cream-deep)] px-2.5 py-2 text-sm font-normal normal-case text-[var(--ink)]">
            {selectedFarm?.name ?? "—"}
          </div>
        </div>
        <FilterSelect
          label="Lote"
          value={lotId}
          onChange={setLotId}
          options={[
            { value: "ALL", label: "Todos" },
            ...data.lots.map((l) => ({ value: l.id, label: l.name })),
          ]}
        />
        <FilterSelect
          label="Categoria"
          value={category}
          onChange={setCategory}
          options={[
            { value: "ALL", label: "Todas" },
            ...Object.entries(HERD_CATEGORY_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "ALL", label: "Todos" },
            ...Object.entries(LOT_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <HeroStats
        caption={`Resumo do período · ${formatBr(from)} a ${formatBr(to)}`}
        items={[
          {
            label: "Total de animais",
            value: formatNumber(totalHeads),
            hint: `${formatNumber(data.youngHeads)} jovens`,
            icon: "lots",
          },
          {
            label: "Taxa de partos",
            value: `${formatNumber(data.pregnancyRate)}%`,
            hint: `${formatNumber(data.month.matricesParidas)} partos no período`,
            icon: "reproductive",
          },
          {
            label: "GMD médio",
            value: formatNumber(data.avgGmd),
            hint: "kg por animal/dia",
            icon: "scale",
            highlight: true,
          },
          {
            label: "Resultado",
            value: formatCurrency(data.month.result),
            hint: `Receitas ${formatCurrency(data.month.totalRevenues)}`,
            icon: "finance",
          },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Partos no período"
          value={formatNumber(data.month.matricesParidas)}
          icon={<CowIcon />}
        />
        <KpiCard
          label="Nascimentos"
          value={formatNumber(data.month.weanings)}
          icon={<CowIcon />}
        />
        <KpiCard
          label="Mortalidade"
          value={`${formatNumber(data.month.mortalityRate)}%`}
          icon={<CowIcon />}
        />
        <KpiCard
          label="Estoque em alerta"
          value={formatNumber(data.lowStockCount)}
          icon={<AlertIcon />}
        />
        <KpiCard
          label="Alertas críticos"
          value={formatNumber(data.criticalAlerts)}
          icon={<AlertIcon />}
          tone="alert"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ModuleShortcuts metrics={shortcutMetrics} />
        </div>
        <AgendaDoDia data={data.pendencies} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <CategoryBars data={filteredStacked} />
        <ReproductiveFunnel data={data.reproductivePipeline} />
        <HealthBars data={data.healthOccurrences} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <WeightLine data={data.weightEvolution} />
        <GmdBars data={data.gmdByLot} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <LotControlTable data={filteredLots} />
        <DashCard title="Financeiro do período">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <Stat
              label="Receitas"
              value={formatCurrency(data.month.totalRevenues)}
            />
            <Stat
              label="Despesas"
              value={formatCurrency(data.month.totalExpenses)}
            />
            <Stat
              label="Resultado"
              value={formatCurrency(data.month.result)}
              tone="accent"
            />
          </div>
        </DashCard>
      </div>
    </div>
  );
}
