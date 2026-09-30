"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { useFormSubmit } from "@/lib/use-form-submit";
import type { InventoryItem, Vaccine } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { EntityActions } from "@/components/ui/EntityActions";
import { EmptyState, FormCard } from "@/components/ui/LayoutBits";
import { Table, Td } from "@/components/ui/Table";
import { ExpiryCell } from "./ExpiryCell";
import { InactiveBadge } from "./InactiveBadge";
import { StockCell } from "./StockCell";
import { VaccineFields, readVaccineForm } from "./VaccineFields";

type Props = {
  vaccines: Vaccine[];
  items: InventoryItem[];
  onChanged: () => void | Promise<void>;
  onError: (message: string) => void;
};

export function VaccinesTab({ vaccines, items, onChanged, onError }: Props) {
  const [editing, setEditing] = useState<Vaccine | null>(null);
  // Remonta o formulário após salvar (zera também o estado do controle de estoque)
  const [formKey, setFormKey] = useState(0);
  const { submitting, submit } = useFormSubmit(onError);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    const target = editing;
    const ok = await submit(
      e,
      async (fd) => {
        await api(target ? `/vaccines/${target.id}` : "/vaccines", {
          method: target ? "PATCH" : "POST",
          body: JSON.stringify(readVaccineForm(fd)),
        });
        await onChanged();
      },
      target ? "Erro ao editar vacina" : "Erro ao salvar vacina",
    );
    if (ok) {
      setEditing(null);
      setFormKey((k) => k + 1);
    }
  }

  function startEdit(vaccine: Vaccine) {
    setEditing(vaccine);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <FormCard
        key={`${editing?.id ?? "new"}-${formKey}`}
        title={editing ? `Editar vacina — ${editing.name}` : "Nova vacina"}
        onSubmit={onSubmit}
        submitting={submitting}
      >
        <VaccineFields vaccine={editing ?? undefined} items={items} />
        {editing ? (
          <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
            Cancelar
          </Button>
        ) : null}
      </FormCard>

      {vaccines.length === 0 ? (
        <EmptyState message="Nenhuma vacina cadastrada." />
      ) : (
        <Table headers={["Nome", "Fabricante", "Lote", "Validade", "Estoque", ""]}>
          {vaccines.map((v) => (
            <tr key={v.id} className={v.active === false ? "opacity-70" : ""}>
              <Td>
                <span className="inline-flex flex-wrap items-center gap-2">
                  {v.name}
                  {v.active === false ? <InactiveBadge /> : null}
                </span>
              </Td>
              <Td>{v.manufacturer ?? "—"}</Td>
              <Td>{v.batchNumber || "—"}</Td>
              <Td>
                <ExpiryCell value={v.expiryDate} />
              </Td>
              <Td>
                <StockCell stock={v.stock} />
              </Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <EntityActions
                    path={`/vaccines/${v.id}`}
                    name={v.name}
                    noun="a vacina"
                    active={v.active !== false}
                    canDelete={v.canDelete}
                    inactivateEffect="Ela deixará de aparecer ao criar campanhas. O histórico é mantido e você pode reativá-la depois."
                    blockedDeleteHint="Possui campanhas registradas. Inative em vez de excluir."
                    onEdit={() => startEdit(v)}
                    onToggled={onChanged}
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
