"use client";

import { FormEvent, useCallback, useState } from "react";

/**
 * Centraliza o padrão de formulários: captura o <form> ANTES do primeiro
 * `await` (o React zera `currentTarget` depois), controla `submitting`,
 * trata erro e limpa o formulário em caso de sucesso.
 */
export function useFormSubmit(setError: (message: string) => void) {
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (
      e: FormEvent<HTMLFormElement>,
      action: (fd: FormData) => Promise<void>,
      fallbackError: string,
    ): Promise<boolean> => {
      const form = e.currentTarget;
      const fd = new FormData(form);
      setSubmitting(true);
      setError("");
      try {
        await action(fd);
        form.reset();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : fallbackError);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [setError],
  );

  return { submitting, submit };
}
