"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { FuelRecord, MaintenanceRecord, Vehicle } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  todayISO,
} from "@/lib/format";
import { Input, Select, Textarea } from "@/components/ui/Field";
import {
  Alert,
  EmptyState,
  FormCard,
  FormGrid,
  PageHeader,
} from "@/components/ui/LayoutBits";
import { Table, Tabs, Td } from "@/components/ui/Table";
import { useFormSubmit } from "@/lib/use-form-submit";
import { VehiclesTab } from "@/components/frota/VehiclesTab";

export default function FrotaPage() {
  const [tab, setTab] = useState("vehicles");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuel, setFuel] = useState<FuelRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [error, setError] = useState("");
  const { submitting, run } = useFormSubmit(setError);

  const load = useCallback(async () => {
    setError("");
    try {
      const [v, f, m] = await Promise.all([
        api<Vehicle[]>("/fleet/vehicles"),
        api<FuelRecord[]>("/fleet/fuel"),
        api<MaintenanceRecord[]>("/fleet/maintenance"),
      ]);
      setVehicles(v);
      setFuel(f);
      setMaintenance(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function vehicleName(id: string) {
    return vehicles.find((v) => v.id === id)?.name ?? id;
  }

  function post(path: string, body: Record<string, unknown>, form: HTMLFormElement) {
    return run(
      form,
      async () => {
        await api(path, { method: "POST", body: JSON.stringify(body) });
        await load();
      },
      "Erro ao salvar",
    );
  }

  const activeVehicles = vehicles.filter((v) => v.active !== false);

  return (
    <div>
      <PageHeader title="Frota" description="Veículos, combustível e manutenção" />
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <Tabs
        tabs={[
          { id: "vehicles", label: "Veículos" },
          { id: "fuel", label: "Combustível" },
          { id: "maintenance", label: "Manutenção" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "vehicles" ? (
        <VehiclesTab vehicles={vehicles} onChanged={load} onError={setError} />
      ) : null}

      {tab === "fuel" ? (
        <>
          <FormCard
            title="Abastecimento"
            submitting={submitting}
            onSubmit={(e) => {
              const fd = new FormData(e.currentTarget);
              return post(
                "/fleet/fuel",
                {
                  vehicleId: String(fd.get("vehicleId")),
                  date: String(fd.get("date")),
                  liters: Number(fd.get("liters")),
                  unitPrice: Number(fd.get("unitPrice")),
                  odometer: fd.get("odometer") ? Number(fd.get("odometer")) : undefined,
                  notes: String(fd.get("notes") || "") || undefined,
                },
                e.currentTarget,
              );
            }}
          >
            <FormGrid>
              <Select label="Veículo" name="vehicleId" required>
                {activeVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </Select>
              <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
              <Input label="Litros" name="liters" type="number" step="0.01" required />
              <Input label="Preço/L" name="unitPrice" type="number" step="0.01" required />
              <Input label="Odômetro" name="odometer" type="number" step="0.1" />
              <Textarea label="Observações" name="notes" />
            </FormGrid>
          </FormCard>
          {fuel.length === 0 ? (
            <EmptyState message="Nenhum abastecimento." />
          ) : (
            <Table headers={["Data", "Veículo", "Litros", "Preço/L", "Total"]}>
              {fuel.map((f) => (
                <tr key={f.id}>
                  <Td>{formatDate(f.date)}</Td>
                  <Td>{f.vehicle?.name ?? vehicleName(f.vehicleId)}</Td>
                  <Td>{formatNumber(f.liters)}</Td>
                  <Td>{formatCurrency(f.unitPrice)}</Td>
                  <Td>{formatCurrency(Number(f.liters) * Number(f.unitPrice))}</Td>
                </tr>
              ))}
            </Table>
          )}
        </>
      ) : null}

      {tab === "maintenance" ? (
        <>
          <FormCard
            title="Manutenção"
            submitting={submitting}
            onSubmit={(e) => {
              const fd = new FormData(e.currentTarget);
              return post(
                "/fleet/maintenance",
                {
                  vehicleId: String(fd.get("vehicleId")),
                  date: String(fd.get("date")),
                  description: String(fd.get("description")),
                  cost: Number(fd.get("cost")),
                  notes: String(fd.get("notes") || "") || undefined,
                },
                e.currentTarget,
              );
            }}
          >
            <FormGrid>
              <Select label="Veículo" name="vehicleId" required>
                {activeVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </Select>
              <Input label="Data" name="date" type="date" required defaultValue={todayISO()} />
              <Input label="Descrição" name="description" required minLength={2} />
              <Input label="Custo" name="cost" type="number" step="0.01" required />
              <Textarea label="Observações" name="notes" />
            </FormGrid>
          </FormCard>
          {maintenance.length === 0 ? (
            <EmptyState message="Nenhuma manutenção." />
          ) : (
            <Table headers={["Data", "Veículo", "Descrição", "Custo"]}>
              {maintenance.map((m) => (
                <tr key={m.id}>
                  <Td>{formatDate(m.date)}</Td>
                  <Td>{m.vehicle?.name ?? vehicleName(m.vehicleId)}</Td>
                  <Td>{m.description}</Td>
                  <Td>{formatCurrency(m.cost)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </>
      ) : null}
    </div>
  );
}
