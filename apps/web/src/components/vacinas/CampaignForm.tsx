"use client";

import { FormEvent, useState } from "react";
import type { Campaign, HerdLot, Vaccine } from "@/lib/types";
import { formatNumber, isOpenLot, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { FormCard, FormGrid } from "@/components/ui/LayoutBits";

type Props = {
  vaccines: Vaccine[];
  lots: HerdLot[];
  /** Presente = modo edição. */
  campaign?: Campaign;
  submitting: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<unknown>;
  onCancel?: () => void;
};

/** Campos vazios viram `null` para que a edição consiga limpá-los. */
export function readCampaignForm(fd: FormData) {
  const text = (key: string) => String(fd.get(key) ?? "").trim() || null;
  return {
    vaccineId: String(fd.get("vaccineId")),
    date: String(fd.get("date")),
    doses: Number(fd.get("doses")),
    cost: Number(fd.get("cost") || 0),
    herdLotId: text("herdLotId"),
    batchNumber: text("batchNumber"),
    expiryDate: text("expiryDate"),
    nextDueDate: text("nextDueDate"),
    notes: text("notes"),
  };
}

export function CampaignForm({
  vaccines,
  lots,
  campaign,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  // Vacinas inativas só aparecem se já forem a da campanha em edição
  const options = vaccines.filter(
    (v) => v.active !== false || v.id === campaign?.vaccineId,
  );
  const selectedId = pickedId ?? campaign?.vaccineId ?? options[0]?.id ?? "";
  // Lote/validade: do cadastro ao trocar de vacina; senão os da própria campanha
  const picked = options.find((v) => v.id === pickedId);
  const selectedVaccine = options.find((v) => v.id === selectedId);
  const source = picked ?? campaign ?? options[0];
  const fieldKey = `${campaign?.id ?? "new"}-${selectedId}`;

  return (
    <FormCard
      title={campaign ? "Editar campanha" : "Nova campanha"}
      onSubmit={onSubmit}
      submitting={submitting}
    >
      <FormGrid>
        <Select
          label="Vacina"
          name="vaccineId"
          required
          value={selectedId}
          onChange={(e) => setPickedId(e.target.value)}
        >
          {options.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
        <Input
          label="Data"
          name="date"
          type="date"
          required
          defaultValue={campaign?.date.slice(0, 10) ?? todayISO()}
        />
        <Input
          label="Doses"
          name="doses"
          type="number"
          min={1}
          required
          defaultValue={campaign?.doses}
        />
        <Input
          label="Custo"
          name="cost"
          type="number"
          step="0.01"
          min={0}
          defaultValue={campaign?.cost ?? ""}
        />
        <Input
          key={`batch-${fieldKey}`}
          label="Lote da vacina"
          name="batchNumber"
          maxLength={60}
          placeholder="Ex.: L2345"
          defaultValue={source?.batchNumber ?? ""}
        />
        <Input
          key={`expiry-${fieldKey}`}
          label="Validade da vacina"
          name="expiryDate"
          type="date"
          defaultValue={source?.expiryDate?.slice(0, 10) ?? ""}
        />
        <Select
          label="Lote do rebanho"
          name="herdLotId"
          defaultValue={campaign?.herdLotId ?? ""}
        >
          <option value="">—</option>
          {lots
            .filter((l) => isOpenLot(l) || l.id === campaign?.herdLotId)
            .map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
        <Input
          label="Próxima dose"
          name="nextDueDate"
          type="date"
          defaultValue={campaign?.nextDueDate?.slice(0, 10) ?? ""}
        />
        <Textarea
          label="Observações"
          name="notes"
          defaultValue={campaign?.notes ?? ""}
        />
      </FormGrid>
      {selectedVaccine?.stock ? (
        <p className="text-sm text-[var(--ink-muted)]">
          Estoque de <strong>{selectedVaccine.name}</strong>:{" "}
          {formatNumber(selectedVaccine.stock.quantity)} {selectedVaccine.stock.unit}
          (s) no Almoxarifado. As doses informadas serão baixadas
          automaticamente; se o custo já foi lançado na entrada do estoque, deixe
          o campo Custo em branco.
        </p>
      ) : null}
      {onCancel ? (
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      ) : null}
    </FormCard>
  );
}
