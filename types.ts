export enum DataSourceType {
  EXCEL = 'EXCEL',
  GOOGLE_SHEETS = 'GOOGLE_SHEETS',
  DATABASE = 'DATABASE',
  MANUAL = 'MANUAL'
}

export interface DataPoint {
  [key: string]: string | number;
}

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  data: DataPoint[];
  lastUpdated: string;
}

export enum ChartType {
  BAR = 'BAR',
  LINE = 'LINE',
  PIE = 'PIE',
  AREA = 'AREA'
}

export interface WidgetConfig {
  id: string;
  title: string;
  sourceId: string;
  chartType: ChartType;
  xAxisKey: string; // Key for category (e.g., 'month')
  dataKeys: string[]; // Keys for values (e.g., 'sales', 'profit')
  color?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}
