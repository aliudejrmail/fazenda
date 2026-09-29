"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Retiro } from "@/lib/types";
import { Button } from "@/components/ui/Button";

type Props = {
  retiro: Pick<Retiro, "id" | "name" | "active" | "canDelete">;
  onEdit: () => void;
  /** Chamado após inativar/reativar com sucesso. */
  onToggled: () => void | Promise<void>;
  /** Chamado após excluir com sucesso. */
  onDeleted: () => void | Promise<void>;
  onError: (message: string) => void;
};

/**
 * Editar / Inativar (Reativar) / Excluir de um retiro.
 * Excluir só fica disponível sem lotes ou movimentações vinculadas;
 * caso contrário o caminho é inativar. Leitores (VIEWER) não veem as ações.
 */
export function RetiroActions({
  retiro,
  onEdit,
  onToggled,
  onDeleted,
  onError,
}: Props) {
  const { selectedFarm } = useAuth();
  const [busy, setBusy] = useState(false);
  const isActive = retiro.active !== false;

  if (selectedFarm?.role === "VIEWER") return null;

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
    const message = isActive
      ? `Inativar o retiro "${retiro.name}"?\n\nEle deixará de aparecer nos seletores, no painel e nos relatórios, e não receberá novos lançamentos. O histórico é mantido e você pode reativá-lo depois.`
      : `Reativar o retiro "${retiro.name}"?`;
    if (!confirm(message)) return;
    await run(async () => {
      await api(`/retiros/${retiro.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !isActive }),
      });
      await onToggled();
    }, "Erro ao atualizar o retiro");
  }

  async function remove() {
    if (
      !confirm(
        `Excluir definitivamente o retiro "${retiro.name}"?\n\nEsta ação não pode ser desfeita.`,
      )
    )
      return;
    await run(async () => {
      await api(`/retiros/${retiro.id}`, { method: "DELETE" });
      await onDeleted();
    }, "Erro ao excluir o retiro");
  }

  return (
    <>
      <Button type="button" variant="secondary" disabled={busy} onClick={onEdit}>
        Editar
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        onClick={() => void toggleActive()}
      >
        {isActive ? "Inativar" : "Reativar"}
      </Button>
      <Button
        type="button"
        variant="danger"
        disabled={busy || !retiro.canDelete}
        title={
          retiro.canDelete
            ? undefined
            : "Possui lotes ou movimentações vinculados. Inative em vez de excluir."
        }
        onClick={() => void remove()}
      >
        Excluir
      </Button>
    </>
  );
}
