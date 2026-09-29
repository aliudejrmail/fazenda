import type { IconName } from "@/components/ui/Icons";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Frase curta usada nos cards de atalho do painel */
  description: string;
};

export type NavGroup = { id: string; label: string; items: NavItem[] };

/** Fonte única de navegação: menu lateral, atalhos do painel e lançamentos rápidos. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "ops",
    label: "Operação",
    items: [
      { href: "/", label: "Painel", icon: "dashboard", description: "Visão geral da propriedade" },
      { href: "/fazendas", label: "Fazendas", icon: "farm", description: "Propriedades e acessos" },
      { href: "/retiros", label: "Retiros", icon: "retiro", description: "Áreas e matrizes por retiro" },
    ],
  },
  {
    id: "herd",
    label: "Rebanho",
    items: [
      { href: "/rebanho", label: "Lotes", icon: "lots", description: "Cria, recria e confinamento por lote" },
      { href: "/rebanho/reprodutivo", label: "Reprodutivo", icon: "reproductive", description: "Partos, prenhez e reposição" },
      { href: "/rebanho/movimentacoes", label: "Movimentações", icon: "movements", description: "Compras, vendas e transferências" },
      { href: "/alimentacao", label: "Alimentação", icon: "feeding", description: "Dietas, arraçoamento e custo" },
      { href: "/vacinas", label: "Vacinas", icon: "vaccine", description: "Campanhas e calendário sanitário" },
    ],
  },
  {
    id: "mgmt",
    label: "Gestão",
    items: [
      { href: "/financeiro", label: "Financeiro", icon: "finance", description: "Receitas, despesas e resultado" },
      { href: "/relatorios", label: "Relatórios", icon: "reports", description: "Visão consolidada do período" },
      { href: "/almoxarifado", label: "Almoxarifado", icon: "inventory", description: "Estoque de ração e insumos" },
      { href: "/frota", label: "Frota", icon: "fleet", description: "Veículos, combustível e manutenção" },
      { href: "/funcionarios", label: "Funcionários", icon: "employees", description: "Equipe e folha" },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function findNavItem(href: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((i) => i.href === href);
}

/** Grupo + item do menu que melhor corresponde à rota (maior prefixo vence: /rebanho/reprodutivo > /rebanho). */
export function findNavContext(pathname: string): { group: NavGroup; item: NavItem } | undefined {
  let best: { group: NavGroup; item: NavItem } | undefined;
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (!isActive(pathname, item.href)) continue;
      if (!best || item.href.length > best.item.href.length) best = { group, item };
    }
  }
  return best;
}

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type QuickAction = { label: string; href: string; icon: IconName };

/** Destinos onde o usuário registra as operações mais frequentes do dia a dia. */
export const QUICK_ACTIONS: QuickAction[] = [
  { label: "Registrar pesagem", href: "/rebanho", icon: "scale" },
  { label: "Registrar parto ou prenhez", href: "/rebanho/reprodutivo", icon: "reproductive" },
  { label: "Movimentar animais", href: "/rebanho/movimentacoes", icon: "movements" },
  { label: "Lançar arraçoamento", href: "/alimentacao", icon: "feeding" },
  { label: "Aplicar vacina", href: "/vacinas", icon: "vaccine" },
  { label: "Lançar despesa ou receita", href: "/financeiro", icon: "finance" },
  { label: "Movimentar estoque", href: "/almoxarifado", icon: "inventory" },
  { label: "Abastecer ou manutenção", href: "/frota", icon: "fleet" },
];
