"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { useFormSubmit } from "@/lib/use-form-submit";
import type { Campaign, HerdLot, Vaccine } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { EntityActions } from "@/components/ui/EntityActions";
import { EmptyState } from "@/components/ui/LayoutBits";
import { Table, Td } from "@/components/ui/Table";
import { CampaignForm, readCampaignForm } from "./CampaignForm";
import { ExpiryCell } from "./ExpiryCell";

type Props = {
  vaccines: Vaccine[];
  campaigns: Campaign[];
  lots: HerdLot[];
  onChanged: () => void | Promise<void>;
  onError: (message: string) => void;
};

export function CampaignsTab({
  vaccines,
  campaigns,
  lots,
  onChanged,
  onError,
}: Props) {
  const [editing, setEditing] = useState<Campaign | null>(null);
  const { submitting, submit } = useFormSubmit(onError);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    const target = editing;
    const ok = await submit(
      e,
      async (fd) => {
        await api(
          target ? `/vaccines/campaigns/${target.id}` : "/vaccines/campaigns",
          {
            method: target ? "PATCH" : "POST",
            body: JSON.stringify(readCampaignForm(fd)),
          },
        );
        await onChanged();
      },
      target ? "Erro ao editar campanha" : "Erro ao salvar campanha",
    );
    if (ok) setEditing(null);
  }

  function startEdit(campaign: Campaign) {
    setEditing(campaign);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <CampaignForm
        key={editing?.id ?? "new"}
        vaccines={vaccines}
        lots={lots}
        campaign={editing ?? undefined}
        submitting={submitting}
        onSubmit={onSubmit}
        onCancel={editing ? () => setEditing(null) : undefined}
      />

      {campaigns.length === 0 ? (
        <EmptyState message="Nenhuma campanha registrada." />
      ) : (
        <Table
          headers={[
            "Data",
            "Vacina",
            "Lote da vacina",
            "Validade",
            "Doses",
            "Custo",
            "Próxima",
            "",
          ]}
        >
          {campaigns.map((c) => (
            <tr key={c.id}>
              <Td>{formatDate(c.date)}</Td>
              <Td>{c.vaccine?.name ?? "—"}</Td>
              <Td>{c.batchNumber || "—"}</Td>
              <Td>
                <ExpiryCell value={c.expiryDate} />
              </Td>
              <Td>{formatNumber(c.doses)}</Td>
              <Td>{c.cost != null ? formatCurrency(c.cost) : "—"}</Td>
              <Td>{formatDate(c.nextDueDate)}</Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <EntityActions
                    path={`/vaccines/campaigns/${c.id}`}
                    name={`${c.vaccine?.name ?? "Campanha"} de ${formatDate(c.date)}`}
                    noun="a campanha"
                    onEdit={() => startEdit(c)}
                    onDeleted={onChanged}
                    onError={onError}
                  />
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
