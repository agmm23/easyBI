import { DataSource, DataSourceType } from './types';

export const MOCK_SALES_DATA = [
  { month: 'Ene', sales: 4000, profit: 2400, expenses: 1600 },
  { month: 'Feb', sales: 3000, profit: 1398, expenses: 1602 },
  { month: 'Mar', sales: 2000, profit: 9800, expenses: 2200 },
  { month: 'Abr', sales: 2780, profit: 3908, expenses: 2000 },
  { month: 'May', sales: 1890, profit: 4800, expenses: 2181 },
  { month: 'Jun', sales: 2390, profit: 3800, expenses: 2500 },
  { month: 'Jul', sales: 3490, profit: 4300, expenses: 2100 },
];

export const MOCK_INVENTORY_DATA = [
  { category: 'Electrónica', stock: 120, value: 15000 },
  { category: 'Ropa', stock: 340, value: 8500 },
  { category: 'Hogar', stock: 200, value: 9200 },
  { category: 'Juguetes', stock: 150, value: 4500 },
];

export const INITIAL_DATA_SOURCES: DataSource[] = [
  {
    id: 'src-001',
    name: 'Ventas 2024 (Excel)',
    type: DataSourceType.EXCEL,
    data: MOCK_SALES_DATA,
    lastUpdated: '2024-05-20 10:30 AM'
  },
  {
    id: 'src-002',
    name: 'Inventario Principal (DB)',
    type: DataSourceType.DATABASE,
    data: MOCK_INVENTORY_DATA,
    lastUpdated: '2024-05-20 10:35 AM'
  }
];
