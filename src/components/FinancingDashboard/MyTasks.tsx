import { useState } from 'react';
import { FinancingTasks, ServiceRecords, Clients } from '@/entities';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';

interface MyTasksProps {
  tasks: FinancingTasks[];
  currentUserId?: string;
  serviceRecords: ServiceRecords[];
  clients: Clients[];
  onOpenProcess: (process: ServiceRecords) => void;
  onTasksUpdated: () => void;
}

export default function MyTasks({
  tasks,
  currentUserId,
  serviceRecords,
  clients,
  onOpenProcess,
  onTasksUpdated,
}: MyTasksProps) {
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Filter tasks assigned to current user
  const myTasks = tasks.filter(t => t.internalResponsibleId === currentUserId);

  // Sort tasks: overdue first, then open, then in progress
  const sortedTasks = [...myTasks].sort((a, b) => {
    const statusOrder = { 'Atrasada': 0, 'Aberta': 1, 'Em andamento': 2, 'Concluída': 3 };
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 999;
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 999;
    
    if (aOrder !== bOrder) return aOrder - bOrder;
    
    // If same status, sort by due date
    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aDate - bDate;
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

  const handleStartTask = async (taskId: string) => {
    try {
      setUpdatingTaskId(taskId);
      await BaseCrudService.update<FinancingTasks>('tarefasfinanciamento', {
        _id: taskId,
        status: 'Em andamento',
      });
      onTasksUpdated();
    } catch (error) {
      console.error('Error starting task:', error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      setUpdatingTaskId(taskId);
      await BaseCrudService.update<FinancingTasks>('tarefasfinanciamento', {
        _id: taskId,
        status: 'Concluída',
      });
      onTasksUpdated();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-border-gray p-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Minhas Tarefas</h2>
      
      {sortedTasks.length === 0 ? (
        <p className="text-dark-gray text-center py-8">Nenhuma tarefa atribuída</p>
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
                {task.status !== 'Em andamento' && task.status !== 'Concluída' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartTask(task._id)}
                    disabled={updatingTaskId === task._id}
                  >
                    Iniciar
                  </Button>
                )}
                {task.status !== 'Concluída' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCompleteTask(task._id)}
                    disabled={updatingTaskId === task._id}
                  >
                    Concluir
                  </Button>
                )}
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
