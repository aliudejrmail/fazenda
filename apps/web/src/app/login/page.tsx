"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/LayoutBits";
import { Tabs } from "@/components/ui/Table";

export default function LoginPage() {
  const { login, register, hasToken, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("login");
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

  async function onRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await register(
        String(fd.get("name")),
        String(fd.get("email")),
        String(fd.get("password")),
      );
      router.replace("/fazendas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no cadastro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--green)]/15 bg-white/80 p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--green)]">
            Fazenda
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Gestão de rebanho, finanças e operação
          </p>
        </div>

        <Tabs
          tabs={[
            { id: "login", label: "Entrar" },
            { id: "register", label: "Cadastrar" },
          ]}
          active={tab}
          onChange={setTab}
        />

        {error ? (
          <div className="mb-3">
            <Alert>{error}</Alert>
          </div>
        ) : null}

        {tab === "login" ? (
          <form onSubmit={onLogin} className="space-y-3">
            <Input label="E-mail" name="email" type="email" required autoComplete="email" />
            <Input
              label="Senha"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-md bg-[var(--green)] px-4 py-2.5 text-sm font-medium text-[var(--cream)] hover:bg-[var(--green-dark)] disabled:opacity-50"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegister} className="space-y-3">
            <Input label="Nome" name="name" required minLength={2} autoComplete="name" />
            <Input label="E-mail" name="email" type="email" required autoComplete="email" />
            <Input
              label="Senha"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-md bg-[var(--green)] px-4 py-2.5 text-sm font-medium text-[var(--cream)] hover:bg-[var(--green-dark)] disabled:opacity-50"
            >
              {submitting ? "Cadastrando..." : "Criar conta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
