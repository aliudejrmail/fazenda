"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/LayoutBits";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { login, hasToken, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && hasToken) router.replace("/");
  }, [loading, hasToken, router]);

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await login(String(fd.get("email")), String(fd.get("password")));
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative hidden overflow-hidden bg-[var(--green)] text-[var(--cream)] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 70% 55% at 15% 20%, rgba(188,108,37,0.35), transparent 55%),
              radial-gradient(ellipse 50% 40% at 90% 80%, rgba(255,255,255,0.08), transparent 50%),
              linear-gradient(160deg, rgba(47,59,36,0.2), transparent 40%)
            `,
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
          aria-hidden
        />

        <div className="relative">
          <div className="inline-flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--earth)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 3c-1.2 0-2.2.7-2.7 1.7-.4-.2-.8-.3-1.3-.3-1.7 0-3 1.4-3 3.1 0 .5.1 1 .4 1.4C4.2 9.5 3.5 10.7 3.5 12c0 2.3 1.6 4.2 3.7 4.7.3 1.7 1.8 3 3.6 3h2.4c1.8 0 3.3-1.3 3.6-3 2.1-.5 3.7-2.4 3.7-4.7 0-1.3-.7-2.5-1.9-3.1.3-.4.4-.9.4-1.4 0-1.7-1.3-3.1-3-3.1-.5 0-.9.1-1.3.3C14.2 3.7 13.2 3 12 3z" />
              </svg>
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Campo · Rebanho · Resultado
            </p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <h1 className="font-[family-name:var(--font-display)] text-6xl leading-[0.95] tracking-tight xl:text-7xl">
            Fazenda
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/75">
            Gestão pecuária com visão clara do retiro ao confinamento —
            lotes, prenhez, alimentação e finanças no mesmo ritmo da operação.
          </p>
        </div>

        <div className="relative grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-8 text-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Foco
            </p>
            <p className="mt-1 font-medium text-white/90">Por lote</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Escala
            </p>
            <p className="mt-1 font-medium text-white/90">Multi-fazenda</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Decisão
            </p>
            <p className="mt-1 font-medium text-white/90">Dados do dia</p>
          </div>
        </div>
      </section>

      <section className="relative flex items-center justify-center px-5 py-[max(2.5rem,env(safe-area-inset-top))] sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--green)]">
              Fazenda
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Gestão de rebanho e operação
            </p>
          </div>

          <div className="ui-surface-solid p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--green)]">
                Entrar
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Acesse o painel da propriedade
              </p>
            </div>

            {error ? (
              <div className="mb-4">
                <Alert>{error}</Alert>
              </div>
            ) : null}

            <form onSubmit={onLogin} className="space-y-4">
              <Input
                label="E-mail"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
              <Input
                label="Senha"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
              />
              <Button type="submit" disabled={submitting} className="mt-2 w-full py-2.5">
                {submitting ? "Entrando..." : "Entrar na fazenda"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
