"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { HerdLot } from "@/lib/types";
import {
  HERD_CATEGORY_LABELS,
  LOT_STATUS_LABELS,
  PRODUCTION_SYSTEM_LABELS,
  formatNumber,
  labelOf,
  optionsFrom,
} from "@/lib/format";
import { Input, Select, Textarea } from "@/components/ui/Field";
import {
  Alert,
  EmptyState,
  FormCard,
  FormGrid,
  PageHeader,
} from "@/components/ui/LayoutBits";
import { Table, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

export default function RebanhoPage() {
  const [lots, setLots] = useState<HerdLot[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setLots(await api<HerdLot[]>("/herd/lots"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar lotes");
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
    const fd = new FormData(e.currentTarget);
    try {
      await api("/herd/lots", {
        method: "POST",
        body: JSON.stringify({
          name: String(fd.get("name")),
          category: String(fd.get("category")),
          system: String(fd.get("system")),
          quantity: Number(fd.get("quantity")),
          trackingMode: String(fd.get("trackingMode") || "LOTE"),
          notes: String(fd.get("notes") || "") || undefined,
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar lote");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Excluir este lote?")) return;
    try {
      await api(`/herd/lots/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  }

  return (
    <div>
      <PageHeader
        title="Rebanho"
        description="Lotes e categorias do rebanho"
      />

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <FormCard title="Novo lote" onSubmit={onCreate} submitting={submitting}>
        <FormGrid>
          <Input label="Nome" name="name" required minLength={2} />
          <Select label="Categoria" name="category" required defaultValue="MATRIZ">
            {optionsFrom(HERD_CATEGORY_LABELS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select label="Sistema" name="system" required defaultValue="CRIA">
            {optionsFrom(PRODUCTION_SYSTEM_LABELS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input label="Quantidade" name="quantity" type="number" min={0} required defaultValue={0} />
          <Select label="Rastreio" name="trackingMode" defaultValue="LOTE">
            <option value="LOTE">Lote</option>
            <option value="INDIVIDUAL">Individual</option>
          </Select>
          <Textarea label="Observações" name="notes" />
        </FormGrid>
      </FormCard>

      {loading ? (
        <p className="text-sm text-[var(--ink-muted)]">Carregando...</p>
      ) : lots.length === 0 ? (
        <EmptyState message="Nenhum lote cadastrado." />
      ) : (
        <Table headers={["Nome", "Categoria", "Sistema", "Qtd", "Status", ""]}>
          {lots.map((lot) => (
            <tr key={lot.id}>
              <Td className="font-medium">{lot.name}</Td>
              <Td>{labelOf(HERD_CATEGORY_LABELS, lot.category)}</Td>
              <Td>{labelOf(PRODUCTION_SYSTEM_LABELS, lot.system)}</Td>
              <Td>{formatNumber(lot.quantity)}</Td>
              <Td>{labelOf(LOT_STATUS_LABELS, lot.status)}</Td>
              <Td>
                <Button type="button" variant="ghost" onClick={() => void onDelete(lot.id)}>
                  Excluir
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
