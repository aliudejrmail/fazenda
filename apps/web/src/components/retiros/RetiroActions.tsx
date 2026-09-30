"use client";

import type { Retiro } from "@/lib/types";
import { EntityActions } from "@/components/ui/EntityActions";

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
 * Ações do retiro. Excluir só fica disponível sem lotes ou movimentações
 * vinculadas; caso contrário o caminho é inativar.
 */
export function RetiroActions({ retiro, ...handlers }: Props) {
  return (
    <EntityActions
      path={`/retiros/${retiro.id}`}
      name={retiro.name}
      noun="o retiro"
      active={retiro.active !== false}
      canDelete={retiro.canDelete}
      inactivateEffect="Ele deixará de aparecer nos seletores, no painel e nos relatórios, e não receberá novos lançamentos. O histórico é mantido e você pode reativá-lo depois."
      blockedDeleteHint="Possui lotes ou movimentações vinculados. Inative em vez de excluir."
      {...handlers}
    />
  );
}
