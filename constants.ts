
import { DataSource, DataSourceType, DashboardSection } from './types';

// Helper to get dates relative to now for realistic demo
const now = new Date();
const currentYear = now.getFullYear();

const getRelativeDate = (monthsAgo: number) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toISOString().split('T')[0];
};

export const MOCK_SALES_DATA = [
  { month: 'Ene', date: `${currentYear}-01-15`, sales: 4000, profit: 2400, expenses: 1600 },
  { month: 'Feb', date: `${currentYear}-02-15`, sales: 3000, profit: 1398, expenses: 1602 },
  { month: 'Mar', date: `${currentYear}-03-15`, sales: 2000, profit: 9800, expenses: 2200 },
  { month: 'Abr', date: `${currentYear}-04-15`, sales: 2780, profit: 3908, expenses: 2000 },
  { month: 'May', date: `${currentYear}-05-15`, sales: 1890, profit: 4800, expenses: 2181 },
  { month: 'Jun', date: `${currentYear}-06-15`, sales: 2390, profit: 3800, expenses: 2500 },
  { month: 'Jul', date: `${currentYear}-07-15`, sales: 3490, profit: 4300, expenses: 2100 },
  { month: 'Ago', date: `${currentYear}-08-15`, sales: 3800, profit: 4100, expenses: 1900 },
  { month: 'Sep', date: `${currentYear}-09-15`, sales: 3100, profit: 3200, expenses: 1800 },
  { month: 'Oct', date: `${currentYear}-10-15`, sales: 2500, profit: 2800, expenses: 1500 },
  { month: 'Nov', date: `${currentYear}-11-15`, sales: 4100, profit: 4500, expenses: 2200 },
  { month: 'Dic', date: `${currentYear}-12-15`, sales: 4500, profit: 5000, expenses: 2400 },
];

export const MOCK_INVENTORY_DATA = [
  // Inventory is usually a snapshot, we use today's date so it appears in current filters
  { category: 'Electrónica', date: getRelativeDate(0), stock: 120, value: 15000 },
  { category: 'Ropa', date: getRelativeDate(0), stock: 340, value: 8500 },
  { category: 'Hogar', date: getRelativeDate(0), stock: 200, value: 9200 },
  { category: 'Juguetes', date: getRelativeDate(0), stock: 150, value: 4500 },
];

export const INITIAL_DATA_SOURCES: DataSource[] = [
  {
    id: 'src-001',
    name: `Ventas ${currentYear} (Excel)`,
    type: DataSourceType.EXCEL,
    data: MOCK_SALES_DATA,
    lastUpdated: `${currentYear}-05-20 10:30 AM`
  },
  {
    id: 'src-002',
    name: 'Inventario Principal (DB)',
    type: DataSourceType.DATABASE,
    data: MOCK_INVENTORY_DATA,
    lastUpdated: `${currentYear}-05-20 10:35 AM`
  }
];

export const INITIAL_SECTIONS: DashboardSection[] = [
  {
    id: 'sec-general',
    title: 'Visión General',
    description: 'Métricas principales de la empresa'
  },
  {
    id: 'sec-finance',
    title: 'Flujo de Caja',
    description: 'Análisis financiero y gastos'
  },
  {
    id: 'sec-inventory',
    title: 'Inventario',
    description: 'Control de stock y productos'
  }
];
