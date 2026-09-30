"use client";

import { useState } from "react";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { FormGrid } from "@/components/ui/LayoutBits";
import { formatNumber } from "@/lib/format";
import type { InventoryItem, Vaccine } from "@/lib/types";

const NEW_ITEM = "__new__";

type Props = {
  vaccine?: Vaccine;
  /** Itens do Almoxarifado que podem controlar o estoque de doses. */
  items: InventoryItem[];
};

/** Campos compartilhados entre "Nova vacina" e "Editar vacina". */
export function VaccineFields({ vaccine, items }: Props) {
  const [stockMode, setStockMode] = useState(vaccine?.stock?.itemId ?? "");

  return (
    <FormGrid>
      <Input
        label="Nome"
        name="name"
        required
        minLength={2}
        defaultValue={vaccine?.name ?? ""}
      />
      <Input
        label="Fabricante"
        name="manufacturer"
        defaultValue={vaccine?.manufacturer ?? ""}
      />
      <Input
        label="Lote"
        name="batchNumber"
        maxLength={60}
        placeholder="Ex.: L2345"
        defaultValue={vaccine?.batchNumber ?? ""}
      />
      <Input
        label="Data de validade"
        name="expiryDate"
        type="date"
        defaultValue={vaccine?.expiryDate?.slice(0, 10) ?? ""}
      />
      <Select
        label="Estoque de doses (Almoxarifado)"
        name="inventoryItemId"
        value={stockMode}
        onChange={(e) => setStockMode(e.target.value)}
      >
        <option value="">Não controlar estoque</option>
        {vaccine?.stock ? null : (
          <option value={NEW_ITEM}>Criar item novo com estoque inicial</option>
        )}
        {items.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name} ({formatNumber(Number(i.quantity))} {i.unit})
          </option>
        ))}
      </Select>
      {stockMode === NEW_ITEM ? (
        <>
          <Input
            label="Estoque inicial (doses)"
            name="stockDoses"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={0}
          />
          <Input
            label="Estoque mínimo (doses)"
            name="minStockDoses"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
          />
        </>
      ) : null}
      <Textarea
        label="Observações"
        name="notes"
        defaultValue={vaccine?.notes ?? ""}
      />
    </FormGrid>
  );
}

/** Campos vazios viram `null` para que a edição consiga limpá-los. */
export function readVaccineForm(fd: FormData) {
  const text = (key: string) => String(fd.get(key) ?? "").trim() || null;
  const stockChoice = String(fd.get("inventoryItemId") ?? "");
  const createItem = stockChoice === NEW_ITEM;
  return {
    name: String(fd.get("name") ?? "").trim(),
    manufacturer: text("manufacturer"),
    batchNumber: text("batchNumber"),
    expiryDate: text("expiryDate"),
    notes: text("notes"),
    inventoryItemId: createItem ? undefined : stockChoice || null,
    stockDoses: createItem ? Number(fd.get("stockDoses") || 0) : undefined,
    minStockDoses: createItem ? Number(fd.get("minStockDoses") || 0) : undefined,
  };
}
