"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Retiro } from "@/lib/types";
import {
  Alert,
  EmptyState,
  FormCard,
  PageHeader,
} from "@/components/ui/LayoutBits";
import { Button } from "@/components/ui/Button";
import {
  RetiroFields,
  readRetiroForm,
} from "@/components/retiros/RetiroFields";
import { RetiroCard } from "@/components/retiros/RetiroCard";

export default function RetirosPage() {
  const [retiros, setRetiros] = useState<Retiro[]>([]);
  const [editing, setEditing] = useState<Retiro | null>(null);
  const [showInactive, setShowInactive] = useState(false);
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

  async function save(
    e: FormEvent<HTMLFormElement>,
    request: { path: string; method: "POST" | "PATCH" },
    fallbackError: string,
  ): Promise<boolean> {
    setSubmitting(true);
    setError("");
    const form = e.currentTarget; // capturar antes do await
    const body = readRetiroForm(new FormData(form));
    try {
      await api(request.path, {
        method: request.method,
        body: JSON.stringify(body),
      });
      form.reset();
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : fallbackError);
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    await save(e, { path: "/retiros", method: "POST" }, "Erro ao criar retiro");
  }

  async function onEdit(e: FormEvent<HTMLFormElement>) {
    if (!editing) return;
    const ok = await save(
      e,
      { path: `/retiros/${editing.id}`, method: "PATCH" },
      "Erro ao editar retiro",
    );
    if (ok) setEditing(null);
  }

  function startEdit(retiro: Retiro) {
    setEditing(retiro);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const inactiveCount = retiros.filter((r) => r.active === false).length;
  const visible = showInactive
    ? retiros
    : retiros.filter((r) => r.active !== false);

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

      {editing ? (
        <FormCard
          key={editing.id}
          title={`Editar retiro — ${editing.name}`}
          onSubmit={onEdit}
          submitting={submitting}
        >
          <RetiroFields retiro={editing} />
          <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
            Cancelar
          </Button>
        </FormCard>
      ) : (
        <FormCard
          title="Adicionar retiro"
          onSubmit={onCreate}
          submitting={submitting}
        >
          <RetiroFields />
        </FormCard>
      )}

      {inactiveCount > 0 ? (
        <label className="mb-4 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[var(--ink-muted)] sm:min-h-0">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Mostrar inativos ({inactiveCount})
        </label>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--ink-muted)]">Carregando...</p>
      ) : visible.length === 0 ? (
        <EmptyState message="Nenhum retiro cadastrado. Adicione o primeiro acima." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <RetiroCard
              key={r.id}
              retiro={r}
              onEdit={startEdit}
              onChanged={load}
              onError={setError}
            />
          ))}
        </div>
      )}
    </div>
  );
}
