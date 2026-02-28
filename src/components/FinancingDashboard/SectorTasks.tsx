import { useState } from 'react';
import { FinancingTasks, ServiceRecords, Clients } from '@/entities';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SectorTasksProps {
  tasks: FinancingTasks[];
  serviceRecords: ServiceRecords[];
  clients: Clients[];
  onOpenProcess: (process: ServiceRecords) => void;
  onTasksUpdated: () => void;
}

export default function SectorTasks({
  tasks,
  serviceRecords,
  clients,
  onOpenProcess,
  onTasksUpdated,
}: SectorTasksProps) {
  const [filterStatus, setFilterStatus] = useState<string>('Todas');

  const now = new Date();

  // Filter tasks by status
  let filteredTasks = tasks;

  if (filterStatus === 'Todas') {
    filteredTasks = tasks.filter(t => t.status !== 'Concluída' && t.status !== 'Cancelado');
  } else if (filterStatus === 'Em atraso') {
    filteredTasks = tasks.filter(t => {
      if (t.status === 'Concluída' || t.status === 'Cancelado') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < now;
    });
  } else if (filterStatus === 'Abertas') {
    filteredTasks = tasks.filter(t => t.status === 'Aberta');
  }

  // Sort: overdue first, then by creation date (newest first)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aIsOverdue = a.status !== 'Concluída' && a.dueDate && new Date(a.dueDate) < now;
    const bIsOverdue = b.status !== 'Concluída' && b.dueDate && new Date(b.dueDate) < now;

    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;

    const aDate = a._createdDate ? new Date(a._createdDate).getTime() : 0;
    const bDate = b._createdDate ? new Date(b._createdDate).getTime() : 0;
    return bDate - aDate;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Atrasada':
        return 'bg-red-100 text-red-800';
      case 'Aberta':
        return 'bg-yellow-100 text-yellow-800';
      case 'Em andamento':
        return 'bg-blue-100 text-blue-800';
      case 'Concluída':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientName = (serviceId?: string) => {
    const service = serviceRecords.find(s => s._id === serviceId);
    if (!service) return 'N/A';
    const client = clients.find(c => c._id === service.clientePrincipalRef);
    return client?.clientName || 'N/A';
  };

  return (
    <div className="bg-white rounded-lg border border-border-gray p-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Tarefas do Setor</h2>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['Todas', 'Em atraso', 'Abertas'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterStatus === status
              ? 'bg-buttonbackground text-white'
              : 'bg-light-gray text-foreground hover:bg-border-gray'
              }`}
          >
            {status}
          </button>
        ))}
      </div>

      {sortedTasks.length === 0 ? (
        <p className="text-dark-gray text-center py-8">Nenhuma tarefa encontrada</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedTasks.map(task => (
            <div
              key={task._id}
              className="flex items-start justify-between p-3 border border-border-gray rounded-lg hover:bg-light-gray transition-colors"
            >
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{task.titulo}</p>
                <p className="text-xs text-dark-gray mt-1">
                  Cliente: {getClientName(task.atendimentoRef)}
                </p>
                {task.dueDate && (
                  <p className="text-xs text-dark-gray mt-1">
                    Prazo: {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                )}
                <Badge className={`mt-2 ${getStatusColor(task.status)}`}>
                  {task.status}
                </Badge>
              </div>

              <div className="flex gap-2 ml-4">
                {task.atendimentoRef && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const service = serviceRecords.find(s => s._id === task.atendimentoRef);
                      if (service) onOpenProcess(service);
                    }}
                  >
                    Abrir
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
