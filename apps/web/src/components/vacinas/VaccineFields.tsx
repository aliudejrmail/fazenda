import { Input, Textarea } from "@/components/ui/Field";
import { FormGrid } from "@/components/ui/LayoutBits";
import type { Vaccine } from "@/lib/types";

/** Campos compartilhados entre "Nova vacina" e "Editar vacina". */
export function VaccineFields({ vaccine }: { vaccine?: Vaccine }) {
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
  return {
    name: String(fd.get("name") ?? "").trim(),
    manufacturer: text("manufacturer"),
    batchNumber: text("batchNumber"),
    expiryDate: text("expiryDate"),
    notes: text("notes"),
  };
}
