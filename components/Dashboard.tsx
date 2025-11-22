
import React, { useState, useEffect, useMemo } from 'react';
import { WidgetConfig, DataSource, DashboardSection, DateFilterState, DateRangeOption, DataPoint, GroupByOption } from '../types';
import { ChartRenderer } from './charts/ChartRenderer';
import { PlusCircle, Layout, Calendar, Filter, BarChart2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Input } from './ui/Input';

interface DashboardProps {
  widgets: WidgetConfig[];
  dataSources: DataSource[];
  sections: DashboardSection[];
  onAddWidget: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ widgets, dataSources, sections, onAddWidget }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  
  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    option: 'ALL',
    startDate: '',
    endDate: ''
  });

  // Aggregation State
  const [groupBy, setGroupBy] = useState<GroupByOption>('NONE');

  // Set initial active section when sections are loaded
  useEffect(() => {
    if (sections.length > 0 && !activeSectionId) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId]);

  const getSourceForWidget = (sourceId: string) => {
    return dataSources.find(ds => ds.id === sourceId);
  };

  // Helper to calculate standard date ranges
  const handleDateRangeChange = (option: string) => {
    const today = new Date();
    let start = '';
    let end = today.toISOString().split('T')[0];

    if (option === 'LAST_30_DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      start = d.toISOString().split('T')[0];
    } else if (option === 'THIS_YEAR') {
      const year = today.getFullYear();
      start = `${year}-01-01`;
    } else if (option === 'ALL') {
      start = '';
      end = '';
    }

    setDateFilter({
      option: option as DateRangeOption,
      startDate: start,
      endDate: end
    });
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateFilter(prev => ({
      ...prev,
      [field]: value,
      option: 'CUSTOM'
    }));
  };

  // Core filtering logic
  const getFilteredData = (dataSource: DataSource): DataPoint[] => {
    if (dateFilter.option === 'ALL') return dataSource.data;
    if (!dateFilter.startDate) return dataSource.data;

    const start = new Date(dateFilter.startDate);
    const end = dateFilter.endDate ? new Date(dateFilter.endDate) : new Date();
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    return dataSource.data.filter(item => {
      // Try to find a date field
      const dateVal = item['date'] || item['fecha'] || item['timestamp'] || item['createdAt'];
      
      if (!dateVal) return true; // If no date field, include it (avoid hiding data by mistake)
      
      const itemDate = new Date(String(dateVal));
      if (isNaN(itemDate.getTime())) return true; // Invalid date, include it

      return itemDate >= start && itemDate <= end;
    });
  };

  // Core Aggregation Logic
  const aggregateData = (data: DataPoint[], widget: WidgetConfig): DataPoint[] => {
    if (groupBy === 'NONE') return data;

    const groupedMap: Record<string, DataPoint> = {};

    data.forEach(item => {
       // Try to find date
       const dateVal = item['date'] || item['fecha'] || item['timestamp'] || item['createdAt'];
       if (!dateVal) return; // Cannot group without date
       
       const date = new Date(String(dateVal));
       if (isNaN(date.getTime())) return;

       let key = '';
       let label = '';

       // Determine Group Key
       const year = date.getFullYear();
       const month = date.getMonth() + 1;
       const day = date.getDate();

       switch (groupBy) {
         case 'YEAR':
           key = `${year}`;
           label = `${year}`;
           break;
         case 'MONTH':
           key = `${year}-${month.toString().padStart(2, '0')}`;
           label = date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
           break;
         case 'WEEK':
           // Simple week calculation
           const firstDay = new Date(date.getFullYear(), 0, 1);
           const pastDays = (date.getTime() - firstDay.getTime()) / 86400000;
           const weekNum = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
           key = `${year}-W${weekNum}`;
           label = `Sem ${weekNum}, ${year}`;
           break;
         case 'DAY':
           key = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
           label = date.toLocaleString('es-ES', { day: 'numeric', month: 'short' });
           break;
       }

       if (!groupedMap[key]) {
         // Initialize group object
         groupedMap[key] = {
           [widget.xAxisKey]: label, // Overwrite x-axis key with time label
           _sortKey: key, // Internal for sorting
           ...item // Copy other non-numeric properties (will be overwritten by sum if numeric)
         };
         
         // Reset numeric keys to 0 for accumulation
         widget.dataKeys.forEach(k => {
           groupedMap[key][k] = 0;
         });
       }

       // Sum numeric values
       widget.dataKeys.forEach(k => {
          const val = Number(item[k]);
          if (!isNaN(val)) {
            groupedMap[key][k] = (Number(groupedMap[key][k]) || 0) + val;
          }
       });
    });

    // Convert back to array and sort
    return Object.values(groupedMap).sort((a, b) => {
       if (a._sortKey < b._sortKey) return -1;
       if (a._sortKey > b._sortKey) return 1;
       return 0;
    });
  };

  const filteredWidgets = activeSectionId 
    ? widgets.filter(w => w.sectionId === activeSectionId)
    : [];

  const activeSection = sections.find(s => s.id === activeSectionId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Panel de Control</h2>
          <p className="text-gray-500 text-sm">
            {activeSection ? activeSection.description : 'Vista general de métricas clave'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
           {/* Date Filter */}
           <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select 
                className="bg-transparent border-none text-sm focus:ring-0 text-gray-700 font-medium cursor-pointer outline-none"
                value={dateFilter.option}
                onChange={(e) => handleDateRangeChange(e.target.value)}
              >
                <option value="ALL">Histórico Completo</option>
                <option value="THIS_YEAR">Este Año (YTD)</option>
                <option value="LAST_30_DAYS">Últimos 30 Días</option>
                <option value="CUSTOM">Personalizado</option>
              </select>
           </div>

           {/* Group By Filter */}
           <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm gap-2">
              <BarChart2 className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-400 font-medium uppercase">Agrupar:</span>
              <select 
                className="bg-transparent border-none text-sm focus:ring-0 text-gray-700 font-medium cursor-pointer outline-none"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
              >
                <option value="NONE">Original</option>
                <option value="YEAR">Por Año</option>
                <option value="MONTH">Por Mes</option>
                <option value="WEEK">Por Semana</option>
                <option value="DAY">Por Día</option>
              </select>
           </div>

           <Button onClick={onAddWidget} className="flex items-center gap-2 ml-2">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Configurar</span>
          </Button>
        </div>
      </div>

      {/* Custom Date Inputs (Visible only if CUSTOM) */}
      {dateFilter.option === 'CUSTOM' && (
        <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-lg animate-fade-in border border-indigo-100">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span className="text-sm text-indigo-900 font-medium">Rango:</span>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={dateFilter.startDate}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              value={dateFilter.endDate}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-gray-200 scrollbar-hide">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSectionId(section.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors flex items-center gap-2 ${
              activeSectionId === section.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Layout className="w-4 h-4" />
            {section.title}
          </button>
        ))}
        {sections.length === 0 && (
          <span className="text-gray-400 text-sm italic py-2">No hay secciones configuradas. Ve a Configuración para crear una.</span>
        )}
      </div>

      {/* Widgets Grid */}
      {sections.length === 0 ? (
         <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border-2 border-dashed border-gray-300 text-gray-500">
            <p>Por favor configura secciones primero.</p>
             <Button onClick={onAddWidget} variant="secondary" className="mt-4">Ir a Configuración</Button>
         </div>
      ) : filteredWidgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border-2 border-dashed border-gray-300 text-gray-500">
           <p>No hay gráficos en esta sección.</p>
           <Button onClick={onAddWidget} variant="secondary" className="mt-4">Agregar Gráfico</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredWidgets.map(widget => {
            const source = getSourceForWidget(widget.sourceId);
            // 1. Filter Data
            const filteredData = source ? getFilteredData(source) : [];
            // 2. Aggregate Data
            const processedData = aggregateData(filteredData, widget);

            return (
              <div key={widget.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">{widget.title}</h3>
                  {source && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md">
                       {processedData.length} items
                    </span>
                  )}
                </div>
                <div className="flex-1 min-h-0">
                  <ChartRenderer 
                    config={widget} 
                    dataSource={source} 
                    filteredData={processedData} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
