"use client";

import type { FormEvent, ReactNode } from "react";
import type { BirthRecord, CullRecord, HerdLot, MortalityRecord, ReplacementRecord } from "@/lib/types";
import {
  CULL_REASON_LABELS,
  HERD_CATEGORY_LABELS,
  formatCurrency,
  formatDate,
  formatNumber,
  labelOf,
  optionsFrom,
  todayISO,
} from "@/lib/format";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { EmptyState, FormCard, FormGrid } from "@/components/ui/LayoutBits";
import { Table, Td } from "@/components/ui/Table";

type SubmitFn = (
  path: string,
  body: Record<string, unknown>,
  form: HTMLFormElement,
) => Promise<void>;

function LotSelect({ lots }: { lots: HerdLot[] }) {
  return (
    <Select label="Lote" name="herdLotId" defaultValue="">
      <option value="">—</option>
      {lots.map((l) => (
        <option key={l.id} value={l.id}>
          {l.name}
        </option>
      ))}
    </Select>
  );
}

export function BirthsTab({
  births,
  lots,
  submitting,
  submit,
}: {
  births: BirthRecord[];
  lots: HerdLot[];
  submitting: boolean;
  submit: SubmitFn;
}) {
  return (
    <>
      <FormCard
        title="Registrar nascimento"
        submitting={submitting}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          const fd = new FormData(e.currentTarget);
          return submit(
            "/herd/births",
            {
              date: String(fd.get("date")),
              matricesParidas: Number(fd.get("matricesParidas")),
              bezerros: Number(fd.get("bezerros")),
              bezerras: Number(fd.get("bezerras")),
              herdLotId: String(fd.get("herdLotId") || "") || undefined,
              notes: String(fd.get("notes") || "") || undefined,
            },
            e.currentTarget,
          );
        }}
      >
        <FormGrid>
          <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
          <Input label="Matrizes paridas" name="matricesParidas" type="number" min={1} required />
          <Input label="Bezerros" name="bezerros" type="number" min={0} required defaultValue={0} />
          <Input label="Bezerras" name="bezerras" type="number" min={0} required defaultValue={0} />
          <LotSelect lots={lots} />
          <Textarea label="Observações" name="notes" />
        </FormGrid>
      </FormCard>
      <ListEmpty empty={births.length === 0} message="Nenhum nascimento registrado.">
        <Table headers={["Data", "Matrizes", "Bezerros", "Bezerras"]}>
          {births.map((r) => (
            <tr key={r.id}>
              <Td>{formatDate(r.date)}</Td>
              <Td>{r.matricesParidas}</Td>
              <Td>{r.bezerros}</Td>
              <Td>{r.bezerras}</Td>
            </tr>
          ))}
        </Table>
      </ListEmpty>
    </>
  );
}

export function MortalitiesTab({
  mortalities,
  lots,
  submitting,
  submit,
}: {
  mortalities: MortalityRecord[];
  lots: HerdLot[];
  submitting: boolean;
  submit: SubmitFn;
}) {
  return (
    <>
      <FormCard
        title="Registrar mortalidade"
        submitting={submitting}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          const fd = new FormData(e.currentTarget);
          return submit(
            "/herd/mortalities",
            {
              date: String(fd.get("date")),
              quantity: Number(fd.get("quantity")),
              category: String(fd.get("category") || "") || undefined,
              herdLotId: String(fd.get("herdLotId") || "") || undefined,
              cause: String(fd.get("cause") || "") || undefined,
              notes: String(fd.get("notes") || "") || undefined,
            },
            e.currentTarget,
          );
        }}
      >
        <FormGrid>
          <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
          <Input label="Quantidade" name="quantity" type="number" min={1} required />
          <Select label="Categoria" name="category" defaultValue="">
            <option value="">—</option>
            {optionsFrom(HERD_CATEGORY_LABELS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <LotSelect lots={lots} />
          <Input label="Causa" name="cause" />
          <Textarea label="Observações" name="notes" />
        </FormGrid>
      </FormCard>
      <ListEmpty empty={mortalities.length === 0} message="Nenhuma mortalidade registrada.">
        <Table headers={["Data", "Qtd", "Categoria", "Causa"]}>
          {mortalities.map((r) => (
            <tr key={r.id}>
              <Td>{formatDate(r.date)}</Td>
              <Td>{r.quantity}</Td>
              <Td>{labelOf(HERD_CATEGORY_LABELS, r.category)}</Td>
              <Td>{r.cause ?? "—"}</Td>
            </tr>
          ))}
        </Table>
      </ListEmpty>
    </>
  );
}

export function CullsTab({
  culls,
  lots,
  submitting,
  submit,
}: {
  culls: CullRecord[];
  lots: HerdLot[];
  submitting: boolean;
  submit: SubmitFn;
}) {
  return (
    <>
      <FormCard
        title="Registrar descarte"
        submitting={submitting}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          const fd = new FormData(e.currentTarget);
          return submit(
            "/herd/culls",
            {
              date: String(fd.get("date")),
              quantity: Number(fd.get("quantity")),
              reason: String(fd.get("reason")),
              herdLotId: String(fd.get("herdLotId") || "") || undefined,
              notes: String(fd.get("notes") || "") || undefined,
            },
            e.currentTarget,
          );
        }}
      >
        <FormGrid>
          <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
          <Input label="Quantidade" name="quantity" type="number" min={1} required />
          <Select label="Motivo" name="reason" required defaultValue="IDADE">
            {optionsFrom(CULL_REASON_LABELS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <LotSelect lots={lots} />
          <Textarea label="Observações" name="notes" />
        </FormGrid>
      </FormCard>
      <ListEmpty empty={culls.length === 0} message="Nenhum descarte registrado.">
        <Table headers={["Data", "Qtd", "Motivo"]}>
          {culls.map((r) => (
            <tr key={r.id}>
              <Td>{formatDate(r.date)}</Td>
              <Td>{r.quantity}</Td>
              <Td>{labelOf(CULL_REASON_LABELS, r.reason)}</Td>
            </tr>
          ))}
        </Table>
      </ListEmpty>
    </>
  );
}

export function ReplacementsTab({
  replacements,
  lots,
  submitting,
  submit,
}: {
  replacements: ReplacementRecord[];
  lots: HerdLot[];
  submitting: boolean;
  submit: SubmitFn;
}) {
  return (
    <>
      <FormCard
        title="Registrar reposição"
        submitting={submitting}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          const fd = new FormData(e.currentTarget);
          return submit(
            "/herd/replacements",
            {
              date: String(fd.get("date")),
              quantity: Number(fd.get("quantity")),
              unitCost: Number(fd.get("unitCost")),
              herdLotId: String(fd.get("herdLotId") || "") || undefined,
              supplier: String(fd.get("supplier") || "") || undefined,
              notes: String(fd.get("notes") || "") || undefined,
            },
            e.currentTarget,
          );
        }}
      >
        <FormGrid>
          <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
          <Input label="Quantidade" name="quantity" type="number" min={1} required />
          <Input label="Custo unitário" name="unitCost" type="number" step="0.01" required />
          <LotSelect lots={lots} />
          <Input label="Fornecedor" name="supplier" />
          <Textarea label="Observações" name="notes" />
        </FormGrid>
      </FormCard>
      <ListEmpty empty={replacements.length === 0} message="Nenhuma reposição registrada.">
        <Table headers={["Data", "Qtd", "Custo unit.", "Fornecedor"]}>
          {replacements.map((r) => (
            <tr key={r.id}>
              <Td>{formatDate(r.date)}</Td>
              <Td>{formatNumber(r.quantity)}</Td>
              <Td>{formatCurrency(r.unitCost)}</Td>
              <Td>{r.supplier ?? "—"}</Td>
            </tr>
          ))}
        </Table>
      </ListEmpty>
    </>
  );
}

function ListEmpty({
  empty,
  message,
  children,
}: {
  empty: boolean;
  message: string;
  children: ReactNode;
}) {
  if (empty) return <EmptyState message={message} />;
  return <>{children}</>;
}
