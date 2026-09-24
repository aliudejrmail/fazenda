"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { InventoryItem, StockMovement } from "@/lib/types";
import {
  INVENTORY_CATEGORY_LABELS,
  STOCK_MOVEMENT_LABELS,
  formatCurrency,
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
} from "@/components/ui/LayoutBits";
import { Table, Tabs, Td } from "@/components/ui/Table";

export default function AlmoxarifadoPage() {
  const [tab, setTab] = useState("items");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [i, m] = await Promise.all([
        api<InventoryItem[]>("/inventory/items"),
        api<StockMovement[]>("/inventory/movements"),
      ]);
      setItems(i);
      setMovements(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await api("/inventory/items", {
        method: "POST",
        body: JSON.stringify({
          name: String(fd.get("name")),
          category: String(fd.get("category")),
          unit: String(fd.get("unit")),
          quantity: fd.get("quantity") ? Number(fd.get("quantity")) : undefined,
          minQuantity: fd.get("minQuantity")
            ? Number(fd.get("minQuantity"))
            : undefined,
          avgUnitCost: fd.get("avgUnitCost")
            ? Number(fd.get("avgUnitCost"))
            : undefined,
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar item");
    } finally {
      setSubmitting(false);
    }
  }

  async function onMovement(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await api("/inventory/movements", {
        method: "POST",
        body: JSON.stringify({
          itemId: String(fd.get("itemId")),
          type: String(fd.get("type")),
          quantity: Number(fd.get("quantity")),
          date: String(fd.get("date")),
          unitCost: fd.get("unitCost") ? Number(fd.get("unitCost")) : undefined,
          notes: String(fd.get("notes") || "") || undefined,
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar movimento");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Almoxarifado" description="Itens de estoque e movimentações" />
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <Tabs
        tabs={[
          { id: "items", label: "Itens" },
          { id: "movements", label: "Movimentações" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "items" ? (
        <>
          <FormCard title="Novo item" onSubmit={onItem} submitting={submitting}>
            <FormGrid>
              <Input label="Nome" name="name" required minLength={2} />
              <Select label="Categoria" name="category" required defaultValue="RACAO">
                {optionsFrom(INVENTORY_CATEGORY_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
              <Input label="Unidade" name="unit" required placeholder="kg, L, un..." />
              <Input label="Quantidade" name="quantity" type="number" step="0.01" />
              <Input label="Estoque mínimo" name="minQuantity" type="number" step="0.01" />
              <Input label="Custo médio" name="avgUnitCost" type="number" step="0.01" />
            </FormGrid>
          </FormCard>
          {items.length === 0 ? (
            <EmptyState message="Nenhum item cadastrado." />
          ) : (
            <Table headers={["Nome", "Categoria", "Unidade", "Qtd", "Mín.", "Custo"]}>
              {items.map((i) => (
                <tr key={i.id}>
                  <Td className="font-medium">{i.name}</Td>
                  <Td>{labelOf(INVENTORY_CATEGORY_LABELS, i.category)}</Td>
                  <Td>{i.unit}</Td>
                  <Td>{formatNumber(i.quantity)}</Td>
                  <Td>{i.minQuantity != null ? formatNumber(i.minQuantity) : "—"}</Td>
                  <Td>{i.avgUnitCost != null ? formatCurrency(i.avgUnitCost) : "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </>
      ) : (
        <>
          <FormCard title="Nova movimentação" onSubmit={onMovement} submitting={submitting}>
            <FormGrid>
              <Select label="Item" name="itemId" required>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </Select>
              <Select label="Tipo" name="type" required defaultValue="ENTRADA">
                {optionsFrom(STOCK_MOVEMENT_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
              <Input label="Quantidade" name="quantity" type="number" step="0.01" required />
              <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
              <Input label="Custo unitário" name="unitCost" type="number" step="0.01" />
              <Textarea label="Observações" name="notes" />
            </FormGrid>
          </FormCard>
          {movements.length === 0 ? (
            <EmptyState message="Nenhuma movimentação." />
          ) : (
            <Table headers={["Data", "Item", "Tipo", "Qtd", "Custo"]}>
              {movements.map((m) => (
                <tr key={m.id}>
                  <Td>{formatDate(m.date)}</Td>
                  <Td>{m.item?.name ?? items.find((i) => i.id === m.itemId)?.name ?? "—"}</Td>
                  <Td>{labelOf(STOCK_MOVEMENT_LABELS, m.type)}</Td>
                  <Td>{formatNumber(m.quantity)}</Td>
                  <Td>{m.unitCost != null ? formatCurrency(m.unitCost) : "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  );
}
