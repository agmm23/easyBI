import React from 'react';
import { WidgetConfig, DataSource } from '../types';
import { ChartRenderer } from './charts/ChartRenderer';
import { PlusCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface DashboardProps {
  widgets: WidgetConfig[];
  dataSources: DataSource[];
  onAddWidget: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ widgets, dataSources, onAddWidget }) => {
  
  const getSourceForWidget = (sourceId: string) => {
    return dataSources.find(ds => ds.id === sourceId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Panel de Control</h2>
          <p className="text-gray-500 text-sm">Vista general de métricas clave</p>
        </div>
        <Button onClick={onAddWidget} className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Añadir Gráfico
        </Button>
      </div>

      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border-2 border-dashed border-gray-300 text-gray-500">
          <div className="mb-4 p-4 bg-gray-100 rounded-full">
             <PlusCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium">No hay gráficos configurados</p>
          <p className="text-sm mb-4">Comienza añadiendo visualizaciones para tus datos</p>
          <Button onClick={onAddWidget} variant="secondary">Crear mi primer gráfico</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {widgets.map(widget => (
            <div key={widget.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[350px] transition-shadow hover:shadow-md">
              <div className="mb-4 flex justify-between items-start">
                 <div>
                    <h3 className="font-bold text-gray-800">{widget.title}</h3>
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                      {getSourceForWidget(widget.sourceId)?.name || 'Fuente desconocida'}
                    </span>
                 </div>
              </div>
              <div className="flex-grow min-h-0">
                <ChartRenderer config={widget} dataSource={getSourceForWidget(widget.sourceId)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
