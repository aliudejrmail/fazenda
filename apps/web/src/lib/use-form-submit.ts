"use client";

import { FormEvent, useCallback, useState } from "react";

/**
 * Centraliza o padrão de formulários: captura o <form> ANTES do primeiro
 * `await` (o React zera `currentTarget` depois), controla `submitting`,
 * trata erro e limpa o formulário em caso de sucesso.
 *
 * - `submit(e, action, erro)`: recebe o evento e lê o FormData.
 * - `run(form, action, erro)`: para telas que já leem o FormData no handler
 *   e só precisam do controle de envio/erro/reset.
 */
export function useFormSubmit(setError: (message: string) => void) {
  const [submitting, setSubmitting] = useState(false);

  const run = useCallback(
    async (
      form: HTMLFormElement,
      action: () => Promise<void>,
      fallbackError: string,
    ): Promise<boolean> => {
      setSubmitting(true);
      setError("");
      try {
        await action();
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

  const submit = useCallback(
    (
      e: FormEvent<HTMLFormElement>,
      action: (fd: FormData) => Promise<void>,
      fallbackError: string,
    ): Promise<boolean> => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      return run(form, () => action(fd), fallbackError);
    },
    [run],
  );

  return { submitting, submit, run };
}
