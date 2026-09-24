"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Farm } from "@/lib/types";
import { Input } from "@/components/ui/Field";
import {
  Alert,
  EmptyState,
  FormCard,
  FormGrid,
  PageHeader,
} from "@/components/ui/LayoutBits";
import { Table, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

export default function FazendasPage() {
  const { selectedFarmId, selectFarm, refreshFarms } = useAuth();
  const router = useRouter();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await refreshFarms();
      setFarms(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao listar fazendas");
    } finally {
      setLoading(false);
    }
  }, [refreshFarms]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const farm = await api<Farm>("/farms", {
        method: "POST",
        skipFarm: true,
        body: JSON.stringify({
          name: String(fd.get("name")),
          city: String(fd.get("city") || "") || undefined,
          state: String(fd.get("state") || "") || undefined,
        }),
      });
      selectFarm(farm.id);
      e.currentTarget.reset();
      await load();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar fazenda");
    } finally {
      setSubmitting(false);
    }
  }

  function onSelect(id: string) {
    selectFarm(id);
    router.push("/");
  }

  return (
    <div>
      <PageHeader
        title="Fazendas"
        description="Cadastre e selecione a fazenda de trabalho"
      />

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <FormCard title="Nova fazenda" onSubmit={onCreate} submitting={submitting}>
        <FormGrid>
          <Input label="Nome" name="name" required minLength={2} />
          <Input label="Cidade" name="city" />
          <Input label="UF" name="state" maxLength={2} />
        </FormGrid>
      </FormCard>

      {loading ? (
        <p className="text-sm text-[var(--ink-muted)]">Carregando...</p>
      ) : farms.length === 0 ? (
        <EmptyState message="Nenhuma fazenda cadastrada. Crie a primeira acima." />
      ) : (
        <Table headers={["Nome", "Local", "Papel", ""]}>
          {farms.map((farm) => (
            <tr key={farm.id}>
              <Td>
                <span className="font-medium">{farm.name}</span>
                {selectedFarmId === farm.id ? (
                  <span className="ml-2 text-xs text-[var(--earth)]">(atual)</span>
                ) : null}
              </Td>
              <Td>
                {[farm.city, farm.state].filter(Boolean).join(" / ") || "—"}
              </Td>
              <Td>{farm.role ?? "—"}</Td>
              <Td>
                <Button
                  type="button"
                  variant={selectedFarmId === farm.id ? "secondary" : "primary"}
                  onClick={() => onSelect(farm.id)}
                >
                  {selectedFarmId === farm.id ? "Selecionada" : "Selecionar"}
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
