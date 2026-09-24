"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Employee, Payroll } from "@/lib/types";
import {
  EMPLOYEE_STATUS_LABELS,
  formatCurrency,
  formatDate,
  labelOf,
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

export default function FuncionariosPage() {
  const [tab, setTab] = useState("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [e, p] = await Promise.all([
        api<Employee[]>("/employees"),
        api<Payroll[]>("/employees/payroll"),
      ]);
      setEmployees(e);
      setPayroll(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onEmployee(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await api("/employees", {
        method: "POST",
        body: JSON.stringify({
          name: String(fd.get("name")),
          role: String(fd.get("role") || "") || undefined,
          phone: String(fd.get("phone") || "") || undefined,
          hireDate: String(fd.get("hireDate") || "") || undefined,
          salary: fd.get("salary") ? Number(fd.get("salary")) : undefined,
          notes: String(fd.get("notes") || "") || undefined,
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar funcionário");
    } finally {
      setSubmitting(false);
    }
  }

  async function onPayroll(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await api("/employees/payroll", {
        method: "POST",
        body: JSON.stringify({
          employeeId: String(fd.get("employeeId")),
          referenceMonth: String(fd.get("referenceMonth")),
          date: String(fd.get("date")),
          amount: Number(fd.get("amount")),
          description: String(fd.get("description") || "") || undefined,
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar folha");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Funcionários" description="Equipe e folha de pagamento" />
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <Tabs
        tabs={[
          { id: "employees", label: "Funcionários" },
          { id: "payroll", label: "Folha" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "employees" ? (
        <>
          <FormCard title="Novo funcionário" onSubmit={onEmployee} submitting={submitting}>
            <FormGrid>
              <Input label="Nome" name="name" required minLength={2} />
              <Input label="Função" name="role" />
              <Input label="Telefone" name="phone" />
              <Input label="Admissão" name="hireDate" type="date" />
              <Input label="Salário" name="salary" type="number" step="0.01" />
              <Textarea label="Observações" name="notes" />
            </FormGrid>
          </FormCard>
          {employees.length === 0 ? (
            <EmptyState message="Nenhum funcionário cadastrado." />
          ) : (
            <Table headers={["Nome", "Função", "Telefone", "Salário", "Status"]}>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <Td className="font-medium">{emp.name}</Td>
                  <Td>{emp.role ?? "—"}</Td>
                  <Td>{emp.phone ?? "—"}</Td>
                  <Td>{emp.salary != null ? formatCurrency(emp.salary) : "—"}</Td>
                  <Td>{labelOf(EMPLOYEE_STATUS_LABELS, emp.status)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </>
      ) : (
        <>
          <FormCard title="Lançar pagamento" onSubmit={onPayroll} submitting={submitting}>
            <FormGrid>
              <Select label="Funcionário" name="employeeId" required>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </Select>
              <Input
                label="Mês de referência"
                name="referenceMonth"
                type="date"
                required
                defaultValue={todayISO().slice(0, 8) + "01"}
              />
              <Input label="Data pagamento" name="date" type="date" required defaultValue={todayISO()} />
              <Input label="Valor" name="amount" type="number" step="0.01" required />
              <Input label="Descrição" name="description" />
            </FormGrid>
          </FormCard>
          {payroll.length === 0 ? (
            <EmptyState message="Nenhum lançamento de folha." />
          ) : (
            <Table headers={["Referência", "Pagamento", "Funcionário", "Valor", "Descrição"]}>
              {payroll.map((p) => (
                <tr key={p.id}>
                  <Td>{formatDate(p.referenceMonth)}</Td>
                  <Td>{formatDate(p.date)}</Td>
                  <Td>
                    {p.employee?.name ??
                      employees.find((e) => e.id === p.employeeId)?.name ??
                      "—"}
                  </Td>
                  <Td>{formatCurrency(p.amount)}</Td>
                  <Td>{p.description ?? "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  );
}
