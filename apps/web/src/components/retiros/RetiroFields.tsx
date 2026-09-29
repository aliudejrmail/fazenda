import { Input, Textarea } from "@/components/ui/Field";
import { FormGrid } from "@/components/ui/LayoutBits";
import type { Retiro } from "@/lib/types";

/** Campos compartilhados entre "Adicionar" e "Editar" retiro. */
export function RetiroFields({ retiro }: { retiro?: Retiro }) {
  return (
    <FormGrid>
      <Input
        label="Nome"
        name="name"
        required
        minLength={2}
        placeholder="Retiro 01"
        defaultValue={retiro?.name ?? ""}
      />
      <Input
        label="Matrizes prenhes"
        name="matricesPregnant"
        type="number"
        min={0}
        defaultValue={retiro?.matricesPregnant ?? 0}
      />
      <Input
        label="Matrizes vazias"
        name="matricesEmpty"
        type="number"
        min={0}
        defaultValue={retiro?.matricesEmpty ?? 0}
      />
      <Textarea
        label="Observações"
        name="notes"
        defaultValue={retiro?.notes ?? ""}
      />
    </FormGrid>
  );
}

/** Converte o formulário de retiro no corpo esperado pela API. */
export function readRetiroForm(fd: FormData) {
  return {
    name: String(fd.get("name") ?? "").trim(),
    matricesPregnant: Number(fd.get("matricesPregnant") || 0),
    matricesEmpty: Number(fd.get("matricesEmpty") || 0),
    notes: String(fd.get("notes") ?? ""),
  };
}
