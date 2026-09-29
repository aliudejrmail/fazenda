"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { RetiroSummary } from "@/lib/types";
import {
  HERD_CATEGORY_LABELS,
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
  Stat,
} from "@/components/ui/LayoutBits";
import { Table, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import {
  RetiroFields,
  readRetiroForm,
} from "@/components/retiros/RetiroFields";
import { RetiroActions } from "@/components/retiros/RetiroActions";

export default function RetiroDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<RetiroSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [panel, setPanel] = useState<"none" | "birth" | "mortality" | "edit">(
    "none",
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api<RetiroSummary>(`/retiros/${id}/summary`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar retiro");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onBirth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await api("/herd/births", {
        method: "POST",
        body: JSON.stringify({
          retiroId: id,
          date: String(fd.get("date")),
          matricesParidas: Number(fd.get("matricesParidas")),
          bezerros: Number(fd.get("bezerros")),
          bezerras: Number(fd.get("bezerras")),
          notes: String(fd.get("notes") || "") || undefined,
        }),
      });
      setPanel("none");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar nascimento");
    } finally {
      setSubmitting(false);
    }
  }

  async function onMortality(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await api("/herd/mortalities", {
        method: "POST",
        body: JSON.stringify({
          retiroId: id,
          date: String(fd.get("date")),
          quantity: Number(fd.get("quantity")),
          category: String(fd.get("category") || "") || undefined,
          cause: String(fd.get("cause") || "") || undefined,
          notes: String(fd.get("notes") || "") || undefined,
        }),
      });
      setPanel("none");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar mortalidade");
    } finally {
      setSubmitting(false);
    }
  }

  async function onEditHerd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const body = readRetiroForm(new FormData(e.currentTarget));
    try {
      await api(`/retiros/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setPanel("none");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar retiro");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !data) {
    return <p className="text-sm text-[var(--ink-muted)]">Carregando...</p>;
  }
  if (error && !data) return <Alert>{error}</Alert>;
  if (!data) return <EmptyState message="Retiro não encontrado." />;

  const s = data.summary;
  const isActive = data.retiro.active !== false;

  return (
    <div>
      <PageHeader
        title={data.retiro.name}
        description="Resumo do retiro e ações rápidas"
        actions={
          <Link href="/retiros">
            <Button type="button" variant="secondary">
              Voltar aos retiros
            </Button>
          </Link>
        }
      />

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      {!isActive ? (
        <div className="mb-4">
          <Alert tone="info">
            Retiro inativo: o histórico é mantido, mas ele não recebe novos
            lançamentos e fica fora do painel e dos relatórios. Use
            &quot;Reativar&quot; para voltar a usá-lo.
          </Alert>
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total de animais" value={formatNumber(s.totalHeads)} />
        <Stat label="Matrizes" value={formatNumber(s.matrices)} />
        <Stat label="Matrizes prenhes" value={formatNumber(s.matricesPregnant)} />
        <Stat label="Matrizes vazias" value={formatNumber(s.matricesEmpty)} />
        <Stat label="Touros" value={formatNumber(s.touros)} />
        <Stat label="Nascimentos no ano" value={formatNumber(s.birthsYear)} />
        <Stat label="Mortalidade no ano" value={formatNumber(s.deathsYear)} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!isActive}
          onClick={() => setPanel("birth")}
        >
          Adicionar nascimento
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!isActive}
          onClick={() => setPanel("mortality")}
        >
          Registrar mortalidade
        </Button>
        <RetiroActions
          retiro={data.retiro}
          onEdit={() => setPanel("edit")}
          onToggled={load}
          onDeleted={() => router.replace("/retiros")}
          onError={setError}
        />
        <Link href={`/rebanho?retiroId=${id}`}>
          <Button type="button" variant="ghost">
            Ver lotes
          </Button>
        </Link>
      </div>

      {panel === "birth" ? (
        <FormCard
          title="Novo nascimento"
          onSubmit={onBirth}
          submitting={submitting}
          submitLabel="Salvar nascimento"
        >
          <FormGrid>
            <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
            <Input label="Matrizes paridas" name="matricesParidas" type="number" min={1} required defaultValue={1} />
            <Input label="Machos (bezerros)" name="bezerros" type="number" min={0} required defaultValue={0} />
            <Input label="Fêmeas (bezerras)" name="bezerras" type="number" min={0} required defaultValue={0} />
            <Textarea label="Observação" name="notes" />
          </FormGrid>
          <Button type="button" variant="ghost" onClick={() => setPanel("none")}>
            Cancelar
          </Button>
        </FormCard>
      ) : null}

      {panel === "mortality" ? (
        <FormCard
          title="Registrar mortalidade"
          onSubmit={onMortality}
          submitting={submitting}
          submitLabel="Registrar mortalidade"
        >
          <FormGrid>
            <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
            <Input label="Quantidade" name="quantity" type="number" min={1} required defaultValue={1} />
            <Select label="Categoria" name="category" defaultValue="MATRIZ">
              {optionsFrom(HERD_CATEGORY_LABELS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Input label="Motivo" name="cause" />
            <Textarea label="Observação" name="notes" />
          </FormGrid>
          <Button type="button" variant="ghost" onClick={() => setPanel("none")}>
            Cancelar
          </Button>
        </FormCard>
      ) : null}

      {panel === "edit" ? (
        <FormCard
          title="Editar informações do retiro"
          onSubmit={onEditHerd}
          submitting={submitting}
          submitLabel="Salvar"
        >
          <RetiroFields retiro={data.retiro} />
          <Button type="button" variant="ghost" onClick={() => setPanel("none")}>
            Cancelar
          </Button>
        </FormCard>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl text-[var(--green)]">
          Rebanho
        </h2>
        <Table headers={["Categoria", "Quantidade"]}>
          {Object.entries(s.byCategory).map(([cat, qty]) => (
            <tr key={cat}>
              <Td>{labelOf(HERD_CATEGORY_LABELS, cat)}</Td>
              <Td>{formatNumber(qty)}</Td>
            </tr>
          ))}
          <tr>
            <Td>
              <strong>Total</strong>
            </Td>
            <Td>
              <strong>{formatNumber(s.totalHeads)}</strong>
            </Td>
          </tr>
        </Table>
      </section>

      {data.lots.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl text-[var(--green)]">
            Lotes do retiro
          </h2>
          <Table headers={["Nome", "Categoria", "Qtd", ""]}>
            {data.lots.map((lot) => (
              <tr key={lot.id}>
                <Td className="font-medium">{lot.name}</Td>
                <Td>{labelOf(HERD_CATEGORY_LABELS, lot.category)}</Td>
                <Td>{formatNumber(lot.quantity)}</Td>
                <Td>
                  <Link href={`/rebanho/${lot.id}`}>
                    <Button type="button" variant="ghost">
                      Ver lote
                    </Button>
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl text-[var(--green)]">
            Nascimentos recentes
          </h2>
          {data.recentBirths.length === 0 ? (
            <EmptyState message="Nenhum nascimento neste ano." />
          ) : (
            <Table headers={["Data", "Machos", "Fêmeas", "Total"]}>
              {data.recentBirths.map((b) => (
                <tr key={b.id}>
                  <Td>{formatDate(b.date)}</Td>
                  <Td>{formatNumber(b.bezerros)}</Td>
                  <Td>{formatNumber(b.bezerras)}</Td>
                  <Td>{formatNumber(b.bezerros + b.bezerras)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </section>
        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl text-[var(--green)]">
            Mortalidade
          </h2>
          <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
            <Stat label="Total de mortes" value={formatNumber(s.deathsYear)} />
            {Object.entries(s.deathsByCategory).map(([cat, qty]) => (
              <Stat
                key={cat}
                label={labelOf(HERD_CATEGORY_LABELS, cat)}
                value={formatNumber(qty)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
