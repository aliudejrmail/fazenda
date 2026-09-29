"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Retiro } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { Input, Textarea } from "@/components/ui/Field";
import {
  Alert,
  EmptyState,
  FormCard,
  FormGrid,
  PageHeader,
} from "@/components/ui/LayoutBits";
import { Button } from "@/components/ui/Button";

export default function RetirosPage() {
  const [retiros, setRetiros] = useState<Retiro[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRetiros(await api<Retiro[]>("/retiros"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar retiros");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await api("/retiros", {
        method: "POST",
        body: JSON.stringify({
          name: String(fd.get("name")),
          notes: String(fd.get("notes") || "") || undefined,
          matricesPregnant: Number(fd.get("matricesPregnant") || 0),
          matricesEmpty: Number(fd.get("matricesEmpty") || 0),
        }),
      });
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar retiro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Retiros"
        description="Áreas da propriedade com resumo do rebanho"
      />

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <FormCard title="Adicionar retiro" onSubmit={onCreate} submitting={submitting}>
        <FormGrid>
          <Input label="Nome" name="name" required minLength={2} placeholder="Retiro 01" />
          <Input
            label="Matrizes prenhes"
            name="matricesPregnant"
            type="number"
            min={0}
            defaultValue={0}
          />
          <Input
            label="Matrizes vazias"
            name="matricesEmpty"
            type="number"
            min={0}
            defaultValue={0}
          />
          <Textarea label="Observações" name="notes" />
        </FormGrid>
      </FormCard>

      {loading ? (
        <p className="text-sm text-[var(--ink-muted)]">Carregando...</p>
      ) : retiros.length === 0 ? (
        <EmptyState message="Nenhum retiro cadastrado. Adicione o primeiro acima." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {retiros.map((r) => {
            const heads =
              r.herdLots?.reduce((s, l) => s + l.quantity, 0) ?? 0;
            return (
              <Link
                key={r.id}
                href={`/retiros/${r.id}`}
                className="ui-surface group block p-5 transition hover:-translate-y-0.5 hover:border-[var(--green-soft)]/40 hover:shadow-[var(--shadow-md)]"
              >
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--green)]">
                  {r.name}
                </h3>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  {formatNumber(heads)} animais ·{" "}
                  {formatNumber(r._count?.herdLots ?? r.herdLots?.length ?? 0)} lotes
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Prenhes: {formatNumber(r.matricesPregnant ?? 0)} · Vazias:{" "}
                  {formatNumber(r.matricesEmpty ?? 0)}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--earth)] transition group-hover:gap-2">
                  Abrir retiro
                  <span aria-hidden>→</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
