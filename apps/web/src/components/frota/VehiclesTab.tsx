"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { useFormSubmit } from "@/lib/use-form-submit";
import type { Vehicle } from "@/lib/types";
import { VEHICLE_TYPE_LABELS, labelOf } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { EntityActions } from "@/components/ui/EntityActions";
import { EmptyState, FormCard } from "@/components/ui/LayoutBits";
import { Table, Td } from "@/components/ui/Table";
import { InactiveBadge } from "@/components/vacinas/InactiveBadge";
import { VehicleFields, readVehicleForm } from "./VehicleFields";

type Props = {
  vehicles: Vehicle[];
  onChanged: () => void | Promise<void>;
  onError: (message: string) => void;
};

export function VehiclesTab({ vehicles, onChanged, onError }: Props) {
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const { submitting, submit } = useFormSubmit(onError);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    const target = editing;
    const ok = await submit(
      e,
      async (fd) => {
        await api(target ? `/fleet/vehicles/${target.id}` : "/fleet/vehicles", {
          method: target ? "PATCH" : "POST",
          body: JSON.stringify(readVehicleForm(fd)),
        });
        await onChanged();
      },
      target ? "Erro ao editar veículo" : "Erro ao salvar veículo",
    );
    if (ok) setEditing(null);
  }

  function startEdit(vehicle: Vehicle) {
    setEditing(vehicle);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <FormCard
        key={editing?.id ?? "new"}
        title={editing ? `Editar veículo — ${editing.name}` : "Novo veículo"}
        onSubmit={onSubmit}
        submitting={submitting}
      >
        <VehicleFields vehicle={editing ?? undefined} />
        {editing ? (
          <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
            Cancelar
          </Button>
        ) : null}
      </FormCard>

      {vehicles.length === 0 ? (
        <EmptyState message="Nenhum veículo cadastrado." />
      ) : (
        <Table headers={["Nome", "Tipo", "Placa", "Ano", ""]}>
          {vehicles.map((v) => (
            <tr key={v.id} className={v.active === false ? "opacity-70" : ""}>
              <Td>
                <span className="inline-flex flex-wrap items-center gap-2 font-medium">
                  {v.name}
                  {v.active === false ? <InactiveBadge label="Inativo" /> : null}
                </span>
              </Td>
              <Td>{labelOf(VEHICLE_TYPE_LABELS, v.type)}</Td>
              <Td>{v.plate ?? "—"}</Td>
              <Td>{v.year ?? "—"}</Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <EntityActions
                    path={`/fleet/vehicles/${v.id}`}
                    name={v.name}
                    noun="o veículo"
                    active={v.active !== false}
                    canDelete={v.canDelete}
                    inactivateEffect="Ele deixará de aparecer ao registrar abastecimento ou manutenção. O histórico é mantido e você pode reativá-lo depois."
                    blockedDeleteHint="Possui abastecimento ou manutenção. Inative em vez de excluir."
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
