"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { HerdLot, Retiro } from "@/lib/types";
import {
  HERD_CATEGORY_LABELS,
  LOT_SEX_LABELS,
  LOT_STATUS_LABELS,
  PRODUCTION_SYSTEM_LABELS,
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
} from "@/components/ui/LayoutBits";
import { Table, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

export default function RebanhoClient() {
  const searchParams = useSearchParams();
  const filterRetiro = searchParams.get("retiroId") ?? "";
  const [lots, setLots] = useState<HerdLot[]>([]);
  const [retiros, setRetiros] = useState<Retiro[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = filterRetiro ? `?retiroId=${filterRetiro}` : "";
      const [lotsData, retirosData] = await Promise.all([
        api<HerdLot[]>(`/herd/lots${qs}`),
        api<Retiro[]>("/retiros"),
      ]);
      setLots(lotsData);
      setRetiros(retirosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar lotes");
    } finally {
      setLoading(false);
    }
  }, [filterRetiro]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const retiroId = String(fd.get("retiroId") || "");
    const entryWeight = String(fd.get("entryWeightKg") || "");
    const targetWeight = String(fd.get("targetWeightKg") || "");
    try {
      await api("/herd/lots", {
        method: "POST",
        body: JSON.stringify({
          name: String(fd.get("name")),
          category: String(fd.get("category")),
          system: String(fd.get("system")),
          sex: String(fd.get("sex") || "MISTO"),
          quantity: Number(fd.get("quantity")),
          entryDate: String(fd.get("entryDate") || "") || undefined,
          entryWeightKg: entryWeight ? Number(entryWeight) : undefined,
          targetWeightKg: targetWeight ? Number(targetWeight) : undefined,
          trackingMode: String(fd.get("trackingMode") || "LOTE"),
          retiroId: retiroId || undefined,
          notes: String(fd.get("notes") || "") || undefined,
        }),
      });
      form.reset();
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
        description={
          filterRetiro
            ? "Lotes filtrados pelo retiro selecionado"
            : "Lotes e categorias do rebanho"
        }
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
          <Select label="Sexo" name="sex" defaultValue="MISTO">
            {optionsFrom(LOT_SEX_LABELS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select label="Retiro" name="retiroId" defaultValue={filterRetiro || ""}>
            <option value="">Sem retiro</option>
            {retiros
              .filter((r) => r.active !== false)
              .map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <Input
            label="Quantidade"
            name="quantity"
            type="number"
            min={0}
            required
            defaultValue={0}
          />
          <Input
            label="Data de entrada"
            name="entryDate"
            type="date"
            defaultValue={todayISO()}
          />
          <Input
            label="Peso entrada (kg)"
            name="entryWeightKg"
            type="number"
            step="0.01"
            min={0}
          />
          <Input
            label="Peso-meta (kg)"
            name="targetWeightKg"
            type="number"
            step="0.01"
            min={0}
          />
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
        <Table
          headers={["Nome", "Retiro", "Categoria", "Sistema", "Sexo", "Qtd", "Status", ""]}
        >
          {lots.map((lot) => (
            <tr key={lot.id}>
              <Td className="font-medium">
                <Link
                  href={`/rebanho/${lot.id}`}
                  className="text-[var(--green)] underline-offset-2 hover:underline"
                >
                  {lot.name}
                </Link>
              </Td>
              <Td>{lot.retiro?.name ?? "—"}</Td>
              <Td>{labelOf(HERD_CATEGORY_LABELS, lot.category)}</Td>
              <Td>{labelOf(PRODUCTION_SYSTEM_LABELS, lot.system)}</Td>
              <Td>{labelOf(LOT_SEX_LABELS, lot.sex)}</Td>
              <Td>{formatNumber(lot.quantity)}</Td>
              <Td>{labelOf(LOT_STATUS_LABELS, lot.status)}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  <Link href={`/rebanho/${lot.id}`}>
                    <Button type="button" variant="ghost">
                      Ver
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => void onDelete(lot.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
