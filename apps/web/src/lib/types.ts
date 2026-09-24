export type User = {
  id: string;
  name: string;
  email: string;
};

export type Farm = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  role?: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type HerdLot = {
  id: string;
  name: string;
  category: string;
  system: string;
  quantity: number;
  trackingMode?: string;
  status?: string;
  notes?: string | null;
};

export type DashboardPendency = {
  id: string;
  type: string;
  target: string;
  dueDate: string;
  status: "ATRASADA" | "PENDENTE" | "CRITICO";
};

export type DashboardSummary = {
  totalHeads: number;
  youngHeads: number;
  pregnancyRate: number;
  avgGmd: number;
  criticalAlerts: number;
  byCategory: Record<string, number>;
  bySystem: Record<string, number>;
  byCategoryStacked: Array<{
    category: string;
    total: number;
    cria: number;
    recria: number;
    confin: number;
  }>;
  reproductivePipeline: Array<{ stage: string; value: number }>;
  healthOccurrences: Array<{ type: string; value: number }>;
  weightEvolution: Array<{ month: string; avgWeightKg: number }>;
  gmdByLot: Array<{ lotId: string; lotName: string; gmd: number }>;
  lotControl: Array<{
    id: string;
    name: string;
    category: string;
    system: string;
    status: string;
    quantity: number;
    daysInLot: number;
    densityHint: number;
  }>;
  lots: Array<{
    id: string;
    name: string;
    category: string;
    system: string;
    status: string;
    quantity: number;
  }>;
  month: {
    matricesParidas: number;
    bezerros: number;
    bezerras: number;
    weanings: number;
    deaths: number;
    discarded: number;
    mortalityRate: number;
    totalExpenses: number;
    totalRevenues: number;
    result: number;
  };
  upcomingVaccines: Array<{
    id: string;
    nextDueDate?: string | null;
    vaccine?: { name: string };
    herdLot?: { name: string } | null;
  }>;
  pendencies: DashboardPendency[];
  lowStockCount: number;
  period: { from: string; to: string };
};

export type ExpenseCategory = {
  id: string;
  name: string;
  costCenter: string;
};

export type Expense = {
  id: string;
  costCenter: string;
  description: string;
  amount: number | string;
  date: string;
  categoryId?: string | null;
  notes?: string | null;
};

export type Revenue = {
  id: string;
  type: string;
  description: string;
  amount: number | string;
  date: string;
  quantity?: number | null;
  weightArroba?: number | string | null;
  notes?: string | null;
};

export type PeriodResult = {
  totalExpenses: number;
  totalRevenues: number;
  result: number;
};

export type Vaccine = {
  id: string;
  name: string;
  manufacturer?: string | null;
  notes?: string | null;
};

export type Campaign = {
  id: string;
  vaccineId: string;
  date: string;
  doses: number;
  cost?: number | string | null;
  herdLotId?: string | null;
  nextDueDate?: string | null;
  notes?: string | null;
  vaccine?: Vaccine;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number | string;
  minQuantity?: number | string | null;
  avgUnitCost?: number | string | null;
};

export type StockMovement = {
  id: string;
  itemId: string;
  type: string;
  quantity: number | string;
  date: string;
  unitCost?: number | string | null;
  notes?: string | null;
  item?: InventoryItem;
};

export type Vehicle = {
  id: string;
  name: string;
  type: string;
  plate?: string | null;
  year?: number | null;
  active?: boolean;
  notes?: string | null;
};

export type FuelRecord = {
  id: string;
  vehicleId: string;
  date: string;
  liters: number | string;
  unitPrice: number | string;
  odometer?: number | string | null;
  notes?: string | null;
  vehicle?: Vehicle;
};

export type MaintenanceRecord = {
  id: string;
  vehicleId: string;
  date: string;
  description: string;
  cost: number | string;
  notes?: string | null;
  vehicle?: Vehicle;
};

export type Employee = {
  id: string;
  name: string;
  role?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  salary?: number | string | null;
  status?: string;
  notes?: string | null;
};

export type Payroll = {
  id: string;
  employeeId: string;
  referenceMonth: string;
  date: string;
  amount: number | string;
  description?: string | null;
  employee?: Employee;
};

export type BirthRecord = {
  id: string;
  date: string;
  matricesParidas: number;
  bezerros: number;
  bezerras: number;
  herdLotId?: string | null;
  notes?: string | null;
};

export type MortalityRecord = {
  id: string;
  date: string;
  quantity: number;
  category?: string | null;
  herdLotId?: string | null;
  cause?: string | null;
  notes?: string | null;
};

export type CullRecord = {
  id: string;
  date: string;
  quantity: number;
  reason: string;
  herdLotId?: string | null;
  notes?: string | null;
};

export type ReplacementRecord = {
  id: string;
  date: string;
  quantity: number;
  unitCost: number | string;
  herdLotId?: string | null;
  supplier?: string | null;
  notes?: string | null;
};

export type MovementRecord = {
  id: string;
  type: string;
  date: string;
  quantity: number;
  fromLotId?: string | null;
  toLotId?: string | null;
  toSystem?: string | null;
  unitPrice?: number | string | null;
  totalPrice?: number | string | null;
  weightArroba?: number | string | null;
  notes?: string | null;
};

export type WeighingRecord = {
  id: string;
  herdLotId: string;
  date: string;
  avgWeightKg: number | string;
  quantity: number;
  notes?: string | null;
  herdLot?: HerdLot;
};
