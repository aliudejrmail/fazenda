import { Input, Select, Textarea } from "@/components/ui/Field";
import { FormGrid } from "@/components/ui/LayoutBits";
import { VEHICLE_TYPE_LABELS, optionsFrom } from "@/lib/format";
import type { Vehicle } from "@/lib/types";

/** Campos compartilhados entre "Novo veículo" e "Editar veículo". */
export function VehicleFields({ vehicle }: { vehicle?: Vehicle }) {
  return (
    <FormGrid>
      <Input
        label="Nome"
        name="name"
        required
        minLength={2}
        defaultValue={vehicle?.name ?? ""}
      />
      <Select
        label="Tipo"
        name="type"
        required
        defaultValue={vehicle?.type ?? "TRATOR"}
      >
        {optionsFrom(VEHICLE_TYPE_LABELS).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <Input label="Placa" name="plate" defaultValue={vehicle?.plate ?? ""} />
      <Input
        label="Ano"
        name="year"
        type="number"
        defaultValue={vehicle?.year ?? ""}
      />
      <Textarea
        label="Observações"
        name="notes"
        defaultValue={vehicle?.notes ?? ""}
      />
    </FormGrid>
  );
}

export function readVehicleForm(fd: FormData) {
  const text = (key: string) => String(fd.get(key) ?? "").trim() || null;
  const year = String(fd.get("year") || "");
  return {
    name: String(fd.get("name") ?? "").trim(),
    type: String(fd.get("type")),
    plate: text("plate"),
    year: year ? Number(year) : null,
    notes: text("notes"),
  };
}
