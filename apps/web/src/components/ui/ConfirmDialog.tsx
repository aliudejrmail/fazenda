"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/Button";

export type ConfirmOptions = {
  title: string;
  /** Aceita quebras de linha (`\n`). */
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` destaca a ação (excluir) e foca "Cancelar" por segurança. */
  tone?: "default" | "danger";
};

type Pending = { options: ConfirmOptions; resolve: (ok: boolean) => void };
type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Substitui `window.confirm`: `const ok = await confirm({ title, message })`.
 * No celular abre como folha inferior (alvos de toque grandes); no desktop, como diálogo central.
 */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm precisa estar dentro de <ConfirmProvider>");
  return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const pendingRef = useRef<Pending | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      // Uma nova confirmação cancela a anterior ainda aberta.
      pendingRef.current?.resolve(false);
      const next = { options, resolve };
      pendingRef.current = next;
      setPending(next);
    });
  }, []);

  const close = useCallback((ok: boolean) => {
    pendingRef.current?.resolve(ok);
    pendingRef.current = null;
    setPending(null);
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending ? <ConfirmDialog options={pending.options} onClose={close} /> : null}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({
  options,
  onClose,
}: {
  options: ConfirmOptions;
  onClose: (ok: boolean) => void;
}) {
  const {
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    tone = "default",
  } = options;
  const titleId = useId();
  const messageId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Foco inicial (Cancelar em ações perigosas), devolução do foco e trava de rolagem.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    (tone === "danger" ? cancelRef : confirmRef).current?.focus();
    const root = document.documentElement;
    root.classList.add("sheet-open");
    return () => {
      root.classList.remove("sheet-open");
      previous?.focus?.();
    };
  }, [tone]);

  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose(false);
      return;
    }
    if (e.key !== "Tab") return;
    // Mantém o foco dentro do diálogo.
    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="no-print fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
      onKeyDown={onKeyDown}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[var(--green-dark)]/50 backdrop-blur-[2px]"
        onClick={() => onClose(false)}
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        className="sheet-up relative w-full max-w-md rounded-t-2xl border-t border-[var(--line-strong)] bg-[var(--surface-solid)] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_rgba(47,59,36,0.18)] sm:rounded-2xl sm:border sm:pb-5 sm:pt-5 sm:shadow-[var(--shadow-md)]"
      >
        <span
          aria-hidden
          className="mx-auto mb-3 block h-1 w-10 rounded-full bg-[var(--line-strong)] sm:hidden"
        />
        <h2
          id={titleId}
          className="font-[family-name:var(--font-display)] text-xl text-[var(--green)]"
        >
          {title}
        </h2>
        {message ? (
          <p
            id={messageId}
            className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--ink-muted)]"
          >
            {message}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            ref={cancelRef}
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => onClose(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            className="w-full sm:w-auto"
            onClick={() => onClose(true)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
