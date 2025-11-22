
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
  config?: {
    fileName?: string;
    sheetId?: string;
    dbHost?: string;
    dbName?: string;
    [key: string]: any;
  };
}

export enum ChartType {
  BAR = 'BAR',
  LINE = 'LINE',
  PIE = 'PIE',
  AREA = 'AREA'
}

export interface DashboardSection {
  id: string;
  title: string;
  description: string;
}

export interface WidgetConfig {
  id: string;
  title: string;
  sourceId: string;
  sectionId: string; // Link widget to a section
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

export type DateRangeOption = 'ALL' | 'THIS_YEAR' | 'LAST_30_DAYS' | 'CUSTOM';
export type GroupByOption = 'NONE' | 'YEAR' | 'MONTH' | 'WEEK' | 'DAY';

export interface DateFilterState {
  option: DateRangeOption;
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate: string;   // ISO Date string YYYY-MM-DD
}