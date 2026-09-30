/**
 * Converte um campo de data de PATCH:
 * `undefined` = não alterar, `null`/vazio = limpar, texto = nova data.
 */
export function patchDate(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  return value ? new Date(value) : null;
}

/** Mesma regra para textos opcionais (aparados; vazio limpa). */
export function patchText(value?: string | null): string | null | undefined {
  if (value === undefined) return undefined;
  return value?.trim() || null;
}
