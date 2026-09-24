"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Expense, ExpenseCategory, PeriodResult, Revenue } from "@/lib/types";
import {
  COST_CENTER_LABELS,
  formatCurrency,
  labelOf,
  optionsFrom,
} from "@/lib/format";
import { Input, Select } from "@/components/ui/Field";
import {
  Alert,
  EmptyState,
  FormCard,
  FormGrid,
  PageHeader,
  Section,
} from "@/components/ui/LayoutBits";
import { Table, Tabs, Td } from "@/components/ui/Table";
import { ExpensesTab, RevenuesTab } from "@/components/financeiro/FinanceTabs";

export default function FinanceiroPage() {
  const [tab, setTab] = useState("expenses");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [result, setResult] = useState<PeriodResult | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const p = new URLSearchParams();
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      const q = p.toString() ? `?${p}` : "";
      const [cats, exp, rev, res] = await Promise.all([
        api<ExpenseCategory[]>("/finance/categories"),
        api<Expense[]>(`/finance/expenses${q}`),
        api<Revenue[]>(`/finance/revenues${q}`),
        api<PeriodResult>(`/finance/result${q}`),
      ]);
      setCategories(cats);
      setExpenses(exp);
      setRevenues(rev);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(
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
        title="Financeiro"
        description="Despesas, receitas e resultado do período"
      />

      <div className="mb-4 grid max-w-md grid-cols-2 gap-3">
        <Input
          label="De"
          name="from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="Até"
          name="to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <Section title="Resultado do período">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Receitas" value={formatCurrency(result?.totalRevenues ?? 0)} />
          <Metric label="Despesas" value={formatCurrency(result?.totalExpenses ?? 0)} />
          <Metric label="Resultado" value={formatCurrency(result?.result ?? 0)} accent />
        </div>
      </Section>

      <Tabs
        tabs={[
          { id: "expenses", label: "Despesas" },
          { id: "revenues", label: "Receitas" },
          { id: "categories", label: "Categorias" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "expenses" ? (
        <ExpensesTab
          expenses={expenses}
          categories={categories}
          submitting={submitting}
          onSubmit={(e) => {
            const fd = new FormData(e.currentTarget);
            return post(
              "/finance/expenses",
              {
                costCenter: String(fd.get("costCenter")),
                description: String(fd.get("description")),
                amount: Number(fd.get("amount")),
                date: String(fd.get("date")),
                categoryId: String(fd.get("categoryId") || "") || undefined,
                notes: String(fd.get("notes") || "") || undefined,
              },
              e.currentTarget,
            );
          }}
        />
      ) : null}

      {tab === "revenues" ? (
        <RevenuesTab
          revenues={revenues}
          submitting={submitting}
          onSubmit={(e) => {
            const fd = new FormData(e.currentTarget);
            return post(
              "/finance/revenues",
              {
                type: String(fd.get("type")),
                description: String(fd.get("description")),
                amount: Number(fd.get("amount")),
                date: String(fd.get("date")),
                quantity: fd.get("quantity") ? Number(fd.get("quantity")) : undefined,
                weightArroba: fd.get("weightArroba")
                  ? Number(fd.get("weightArroba"))
                  : undefined,
                notes: String(fd.get("notes") || "") || undefined,
              },
              e.currentTarget,
            );
          }}
        />
      ) : null}

      {tab === "categories" ? (
        <>
          <FormCard
            title="Nova categoria"
            submitting={submitting}
            onSubmit={(e) => {
              const fd = new FormData(e.currentTarget);
              return post(
                "/finance/categories",
                {
                  name: String(fd.get("name")),
                  costCenter: String(fd.get("costCenter")),
                },
                e.currentTarget,
              );
            }}
          >
            <FormGrid>
              <Input label="Nome" name="name" required minLength={2} />
              <Select
                label="Centro de custo"
                name="costCenter"
                required
                defaultValue="PROPRIEDADE"
              >
                {optionsFrom(COST_CENTER_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </FormGrid>
          </FormCard>
          {categories.length === 0 ? (
            <EmptyState message="Nenhuma categoria." />
          ) : (
            <Table headers={["Nome", "Centro de custo"]}>
              {categories.map((c) => (
                <tr key={c.id}>
                  <Td>{c.name}</Td>
                  <Td>{labelOf(COST_CENTER_LABELS, c.costCenter)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border-b border-[var(--green)]/15 py-2">
      <p className="text-xs uppercase text-[var(--ink-muted)]">{label}</p>
      <p
        className={`font-[family-name:var(--font-display)] text-2xl ${
          accent ? "text-[var(--earth)]" : "text-[var(--green)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
