"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export type EntityActionsProps = {
  /** Endpoint do registro, ex.: `/retiros/abc`. */
  path: string;
  /** Nome exibido nas confirmações. */
  name: string;
  /** Tipo do registro em minúsculas, ex.: `retiro`, `vacina`. */
  noun: string;
  /** `undefined` = registro sem inativação (mostra só Editar/Excluir). */
  active?: boolean;
  /** Efeito de inativar, mostrado na confirmação. */
  inactivateEffect?: string;
  /** Padrão: pode excluir. */
  canDelete?: boolean;
  blockedDeleteHint?: string;
  onEdit: () => void;
  /** Chamado após inativar/reativar com sucesso. */
  onToggled?: () => void | Promise<void>;
  /** Chamado após excluir com sucesso. */
  onDeleted: () => void | Promise<void>;
  onError: (message: string) => void;
};

/**
 * Editar / Inativar (Reativar) / Excluir com confirmação e tratamento de erro.
 * Leitores (VIEWER) não veem as ações.
 */
export function EntityActions({
  path,
  name,
  noun,
  active,
  inactivateEffect = "Ele deixará de aparecer nas próximas seleções, mas o histórico é mantido e você pode reativá-lo depois.",
  canDelete = true,
  blockedDeleteHint = "Possui registros vinculados. Inative em vez de excluir.",
  onEdit,
  onToggled,
  onDeleted,
  onError,
}: EntityActionsProps) {
  const { selectedFarm } = useAuth();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  if (selectedFarm?.role === "VIEWER") return null;

  const hasToggle = active !== undefined;

  async function run(action: () => Promise<void>, fallback: string) {
    setBusy(true);
    onError("");
    try {
      await action();
    } catch (err) {
      onError(err instanceof Error ? err.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive() {
    const ok = await confirm(
      active
        ? {
            title: `Inativar ${noun}?`,
            message: `${name}\n\n${inactivateEffect}`,
            confirmLabel: "Inativar",
          }
        : {
            title: `Reativar ${noun}?`,
            message: name,
            confirmLabel: "Reativar",
          },
    );
    if (!ok) return;
    await run(async () => {
      await api(path, {
        method: "PATCH",
        body: JSON.stringify({ active: !active }),
      });
      await onToggled?.();
    }, "Erro ao atualizar o registro");
  }

  async function remove() {
    const ok = await confirm({
      title: `Excluir ${noun}?`,
      message: `${name}\n\nA exclusão é definitiva e não pode ser desfeita.`,
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    await run(async () => {
      await api(path, { method: "DELETE" });
      await onDeleted();
    }, "Erro ao excluir o registro");
  }

  return (
    <>
      <Button type="button" variant="secondary" disabled={busy} onClick={onEdit}>
        Editar
      </Button>
      {hasToggle ? (
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => void toggleActive()}
        >
          {active ? "Inativar" : "Reativar"}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="danger"
        disabled={busy || !canDelete}
        title={canDelete ? undefined : blockedDeleteHint}
        onClick={() => void remove()}
      >
        Excluir
      </Button>
    </>
  );
}
