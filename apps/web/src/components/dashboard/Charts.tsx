"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardSummary } from "@/lib/types";
import { HERD_CATEGORY_LABELS, formatNumber, labelOf } from "@/lib/format";
import { useNarrow } from "@/lib/use-narrow";
import { Table, Td } from "@/components/ui/Table";
import { categoryAxisProps, truncate, valueAxisProps } from "./chart-axis";
import { DashCard } from "./DashBits";

const CHART = {
  cria: "#5e7d42",
  recria: "#8fa86a",
  confin: "#c4a574",
  health: ["#4a6fa5", "#bc6c25", "#7a5c8c", "#6b4f3a"],
  line: "#5e7d42",
  gmd: "#3d4f2f",
};

export function CategoryBars({
  data,
}: {
  data: DashboardSummary["byCategoryStacked"];
}) {
  const narrow = useNarrow();
  const rows = data.map((d) => ({
    ...d,
    name: labelOf(HERD_CATEGORY_LABELS, d.category),
  }));

  return (
    <DashCard title="Animais por categoria">
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#6b655c]">Sem dados</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d6" vertical={false} />
              <XAxis dataKey="name" {...categoryAxisProps(narrow)} />
              <YAxis {...valueAxisProps(narrow)} />
              <Tooltip />
              <Bar dataKey="cria" stackId="a" fill={CHART.cria} name="Cria" radius={[0, 0, 0, 0]} />
              <Bar dataKey="recria" stackId="a" fill={CHART.recria} name="Recria" />
              <Bar
                dataKey="confin"
                stackId="a"
                fill={CHART.confin}
                name="Confinamento"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#6b655c]">
        <LegendDot color={CHART.cria} label="Cria" />
        <LegendDot color={CHART.recria} label="Recria" />
        <LegendDot color={CHART.confin} label="Confinamento" />
      </div>
    </DashCard>
  );
}

export function ReproductiveFunnel({
  data,
}: {
  data: DashboardSummary["reproductivePipeline"];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const widths = [100, 86, 72, 58, 46];

  return (
    <DashCard title="Pipeline reprodutivo">
      <div className="flex flex-col items-center gap-2 py-2">
        {data.map((item, i) => {
          const w = widths[i] ?? 40;
          const opacity = 1 - i * 0.12;
          return (
            <div
              key={item.stage}
              className="flex items-center justify-center rounded-md px-3 py-2 text-center text-white shadow-sm"
              style={{
                width: `${w}%`,
                backgroundColor: `rgba(61, 79, 47, ${opacity})`,
              }}
            >
              <span className="text-xs font-medium">
                {item.stage}:{" "}
                <strong className="text-sm">{formatNumber(item.value)}</strong>
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[10px] text-[#6b655c]">
        Baseado em lotes e lançamentos do período (controle por lote)
      </p>
      <span className="sr-only">max {max}</span>
    </DashCard>
  );
}

export function HealthBars({
  data,
}: {
  data: DashboardSummary["healthOccurrences"];
}) {
  const narrow = useNarrow();
  return (
    <DashCard title="Ocorrências de sanidade">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d6" vertical={false} />
            <XAxis dataKey="type" {...categoryAxisProps(narrow)} />
            <YAxis {...valueAxisProps(narrow)} />
            <Tooltip />
            <Bar dataKey="value" name="Qtd" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART.health[i % CHART.health.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
}

export function WeightLine({
  data,
}: {
  data: DashboardSummary["weightEvolution"];
}) {
  const narrow = useNarrow();
  return (
    <DashCard title="Evolução de peso">
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#6b655c]">
          Sem pesagens no período. Lance pesagens em Movimentações.
        </p>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d6" />
              <XAxis
                dataKey="month"
                interval={narrow ? "preserveStartEnd" : "preserveEnd"}
                minTickGap={narrow ? 24 : 5}
                tick={{ fontSize: narrow ? 10 : 11, fill: "#6b655c" }}
              />
              <YAxis {...valueAxisProps(narrow)} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="avgWeightKg"
                name="Peso médio (kg)"
                stroke={CHART.line}
                strokeWidth={2.5}
                dot={{ r: 4, fill: CHART.line }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashCard>
  );
}

export function GmdBars({ data }: { data: DashboardSummary["gmdByLot"] }) {
  const narrow = useNarrow();
  return (
    <DashCard title="GMD por lote">
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#6b655c]">
          Precisa de ao menos 2 pesagens por lote.
        </p>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6b655c" }} />
              <YAxis
                type="category"
                dataKey="lotName"
                width={narrow ? 64 : 90}
                tickFormatter={(v) => truncate(v, narrow ? 9 : 14)}
                tick={{ fontSize: narrow ? 10 : 11, fill: "#6b655c" }}
              />
              <Tooltip />
              <Bar dataKey="gmd" name="GMD (kg/dia)" fill={CHART.gmd} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashCard>
  );
}

export function LotControlTable({
  data,
}: {
  data: DashboardSummary["lotControl"];
}) {
  return (
    <DashCard title="Controle de lotes / pastagens" className="lg:col-span-2">
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#6b655c]">Nenhum lote ativo</p>
      ) : (
        <Table
          bare
          headers={["Lote", "Sistema", "Categoria", "Cabeças", "Dias no lote", "Indicador"]}
        >
          {data.map((row) => (
            <tr key={row.id}>
              <Td className="font-medium text-[#2f3b24]">{row.name}</Td>
              <Td className="text-[#6b655c]">{row.system}</Td>
              <Td className="text-[#6b655c]">
                {labelOf(HERD_CATEGORY_LABELS, row.category)}
              </Td>
              <Td>{formatNumber(row.quantity)}</Td>
              <Td>{formatNumber(row.daysInLot)}</Td>
              <Td>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    row.densityHint > 80
                      ? "bg-[#e8a54b] text-[#6b3f00]"
                      : "bg-[#3d4f2f] text-white"
                  }`}
                >
                  {row.densityHint} cab./ciclo
                </span>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </DashCard>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
