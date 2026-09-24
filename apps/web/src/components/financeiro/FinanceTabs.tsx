"use client";

import type { FormEvent } from "react";
import type { Expense, ExpenseCategory, Revenue } from "@/lib/types";
import {
  COST_CENTER_LABELS,
  REVENUE_TYPE_LABELS,
  formatCurrency,
  formatDate,
  labelOf,
  optionsFrom,
  todayISO,
} from "@/lib/format";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { EmptyState, FormCard, FormGrid } from "@/components/ui/LayoutBits";
import { Table, Td } from "@/components/ui/Table";

export function ExpensesTab({
  expenses,
  categories,
  submitting,
  onSubmit,
}: {
  expenses: Expense[];
  categories: ExpenseCategory[];
  submitting: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
}) {
  return (
    <>
      <FormCard title="Nova despesa" onSubmit={onSubmit} submitting={submitting}>
        <FormGrid>
          <Select label="Centro de custo" name="costCenter" required defaultValue="PROPRIEDADE">
            {optionsFrom(COST_CENTER_LABELS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select label="Categoria" name="categoryId" defaultValue="">
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input label="Descrição" name="description" required minLength={2} />
          <Input label="Valor" name="amount" type="number" step="0.01" required />
          <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
          <Textarea label="Observações" name="notes" />
        </FormGrid>
      </FormCard>
      {expenses.length === 0 ? (
        <EmptyState message="Nenhuma despesa no período." />
      ) : (
        <Table headers={["Data", "Centro", "Descrição", "Valor"]}>
          {expenses.map((x) => (
            <tr key={x.id}>
              <Td>{formatDate(x.date)}</Td>
              <Td>{labelOf(COST_CENTER_LABELS, x.costCenter)}</Td>
              <Td>{x.description}</Td>
              <Td>{formatCurrency(x.amount)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

export function RevenuesTab({
  revenues,
  submitting,
  onSubmit,
}: {
  revenues: Revenue[];
  submitting: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
}) {
  return (
    <>
      <FormCard title="Nova receita" onSubmit={onSubmit} submitting={submitting}>
        <FormGrid>
          <Select label="Tipo" name="type" required defaultValue="VENDA_GADO">
            {optionsFrom(REVENUE_TYPE_LABELS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input label="Descrição" name="description" required minLength={2} />
          <Input label="Valor" name="amount" type="number" step="0.01" required />
          <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
          <Input label="Quantidade" name="quantity" type="number" min={0} />
          <Input label="@ (arroba)" name="weightArroba" type="number" step="0.01" />
          <Textarea label="Observações" name="notes" />
        </FormGrid>
      </FormCard>
      {revenues.length === 0 ? (
        <EmptyState message="Nenhuma receita no período." />
      ) : (
        <Table headers={["Data", "Tipo", "Descrição", "Valor"]}>
          {revenues.map((x) => (
            <tr key={x.id}>
              <Td>{formatDate(x.date)}</Td>
              <Td>{labelOf(REVENUE_TYPE_LABELS, x.type)}</Td>
              <Td>{x.description}</Td>
              <Td>{formatCurrency(x.amount)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
