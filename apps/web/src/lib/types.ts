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

export type Retiro = {
  id: string;
  name: string;
  notes?: string | null;
  matricesPregnant?: number;
  matricesEmpty?: number;
  herdLots?: HerdLot[];
  _count?: { herdLots: number };
};

export type RetiroSummary = {
  retiro: Retiro;
  lots: HerdLot[];
  summary: {
    totalHeads: number;
    matrices: number;
    matricesPregnant: number;
    matricesEmpty: number;
    touros: number;
    birthsYear: number;
    deathsYear: number;
    byCategory: Record<string, number>;
    deathsByCategory: Record<string, number>;
  };
  recentBirths: BirthRecord[];
  recentMortalities: MortalityRecord[];
};

export type HerdLot = {
  id: string;
  name: string;
  category: string;
  system: string;
  sex?: string;
  quantity: number;
  initialQuantity?: number | null;
  entryDate?: string | null;
  entryWeightKg?: number | string | null;
  targetWeightKg?: number | string | null;
  trackingMode?: string;
  status?: string;
  notes?: string | null;
  retiroId?: string | null;
  retiro?: { id: string; name: string } | null;
  createdAt?: string;
};

export type LotWeighingItem = {
  id: string;
  date: string;
  quantity: number;
  avgWeightKg: number;
  totalWeightKg: number;
  gmd: number | null;
  notes?: string | null;
};

export type LotDetail = {
  lot: HerdLot;
  indicators: {
    daysInLot: number;
    currentWeightKg: number | null;
    weightGainPerAnimal: number | null;
    gmdPeriod: number | null;
    gmdAccumulated: number | null;
    remainingToTargetKg: number | null;
    daysToTarget: number | null;
    estimatedTargetDate: string | null;
  };
  weighings: LotWeighingItem[];
};

export type PendencyKind = "VACCINE" | "STOCK" | "WEIGHING" | "CULL";

export type DashboardPendency = {
  id: string;
  /** Código estável (ícone/destino); `type` é apenas o rótulo exibido. */
  kind: PendencyKind;
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

export type FeedDietIngredient = {
  id?: string;
  inventoryItemId: string;
  percent: number | string;
  inventoryItem?: InventoryItem;
};

export type FeedDiet = {
  id: string;
  name: string;
  description?: string | null;
  kgPerAnimal: number | string;
  active: boolean;
  ingredients: FeedDietIngredient[];
};

export type FeedAssignment = {
  id: string;
  herdLotId: string;
  dietId: string;
  startDate: string;
  endDate?: string | null;
  kgPerAnimal?: number | string | null;
  herdLot?: { id: string; name: string; quantity: number };
  diet?: { id: string; name: string; kgPerAnimal: number | string };
};

export type FeedRecord = {
  id: string;
  herdLotId: string;
  dietId: string;
  date: string;
  animals: number;
  kgPerAnimal: number | string;
  totalKg: number | string;
  totalCost: number | string;
  costPerKg: number | string;
  costPerAnimal: number | string;
  notes?: string | null;
  herdLot?: { id: string; name: string };
  diet?: { id: string; name: string };
};

export type FeedingSummary = {
  totals: {
    records: number;
    totalKg: number;
    totalCost: number;
    avgCostPerKg: number | null;
    avgCostPerAnimalDay: number | null;
  };
  byLot: Array<{
    herdLotId: string;
    herdLotName: string;
    totalKg: number;
    totalCost: number;
    records: number;
    costPerKg: number | null;
  }>;
  lowStock: Array<{
    id: string;
    name: string;
    quantity: number;
    minQuantity: number;
    unit: string;
  }>;
  recent: Array<{
    id: string;
    date: string;
    herdLotId: string;
    herdLotName: string;
    dietName: string;
    animals: number;
    totalKg: number;
    totalCost: number;
    costPerKg: number;
    costPerAnimal: number;
  }>;
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

export type PregnancyDiagnosis = {
  id: string;
  date: string;
  pregnantCount: number;
  emptyCount: number;
  method: string;
  notes?: string | null;
  retiroId?: string | null;
  herdLotId?: string | null;
  retiro?: { id: string; name: string } | null;
  herdLot?: { id: string; name: string } | null;
};

export type ReportsOverview = {
  period: { from: string; to: string };
  herd: {
    totalHeads: number;
    lots: Array<{
      id: string;
      name: string;
      category: string;
      system: string;
      quantity: number;
      retiro: string | null;
    }>;
    byCategory: Array<{ name: string; quantity: number }>;
    bySystem: Array<{ name: string; quantity: number }>;
    births: { matricesParidas: number; bezerros: number; bezerras: number };
    deaths: number;
    discarded: number;
  };
  pregnancy: {
    pregnant: number;
    empty: number;
    rate: number | null;
    byRetiro: Array<{
      id: string;
      name: string;
      pregnant: number;
      empty: number;
      rate: number | null;
    }>;
  };
  gmd: {
    lots: Array<{
      lotId: string;
      lotName: string;
      gmd: number;
      weighings: number;
    }>;
    avgGmd: number | null;
  };
  finance: {
    totalExpenses: number;
    totalRevenues: number;
    result: number;
    expensesByCenter: Array<{ costCenter: string; amount: number }>;
  };
  vaccines: Array<{
    id: string;
    date: string;
    vaccine: string;
    lot: string | null;
    doses: number;
    cost: number;
    nextDueDate?: string | null;
  }>;
  feeding: {
    totalKg: number;
    totalCost: number;
    costPerKg: number | null;
    records: Array<{
      id: string;
      date: string;
      lot: string;
      diet: string;
      animals: number;
      totalKg: number;
      totalCost: number;
    }>;
  };
  inventory: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    minQuantity: number;
    unit: string;
    low: boolean;
  }>;
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
