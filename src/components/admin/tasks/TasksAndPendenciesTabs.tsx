// src/components/admin/tasks/TasksAndPendenciesTabs.tsx
import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Calendar,
  X,
  Save,
  User,
  AlertCircle,
  CheckSquare,
  RotateCcw,
  ListTodo
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { BaseCrudService } from '@/integrations';
import { Clients, UsuriosdoSistema, HistricodeInteraes } from '@/entities';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TasksAndPendenciesTabsProps {
  atendimentoRef: string;
  serviceType: 'locacoes' | 'vendas' | 'leilao' | 'financiamento';
  tab: 'pendencias' | 'tarefas';
  clients: Clients[];
  users: UsuriosdoSistema[];
  onSuccess?: () => void;
}

export const TasksAndPendenciesTabs: React.FC<TasksAndPendenciesTabsProps> = ({
  atendimentoRef,
  serviceType,
  tab,
  clients,
  users,
  onSuccess
}) => {
  const [pendings, setPendings] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals / Form visibility
  const [showPendingForm, setShowPendingForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingPending, setEditingPending] = useState<any | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Toggles
  const [showCompletedPendings, setShowCompletedPendings] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // Form states
  const [pendingFormData, setPendingFormData] = useState({
    title: '',
    description: '',
    responsiblePartyType: 'Cliente',
    responsiblePartyDetails: '',
    averageDaysToComplete: 7
  });

  const [taskFormData, setTaskFormData] = useState({
    description: '',
    responsibleType: 'Interno',
    internalResponsibleId: '',
    dueDate: ''
  });

  // Map serviceType to collection names
  const collections = {
    locacoes: { pendings: 'pendenciaslocacoes', tasks: 'tarefaslocacoes' },
    vendas: { pendings: 'pendenciasvendas', tasks: 'tarefasvendas' },
    leilao: { pendings: 'pendenciasleilao', tasks: 'tarefasleilao' },
    financiamento: { pendings: 'pendenciasfinanciamento', tasks: 'tarefasfinanciamento' }
  }[serviceType];

  const team = users.filter(u => u.ativo !== false);

  useEffect(() => {
    loadData();
  }, [atendimentoRef]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendRes, taskRes] = await Promise.all([
        BaseCrudService.getAll<any>(collections.pendings),
        BaseCrudService.getAll<any>(collections.tasks)
      ]);

      const filteredPendings = pendRes.items.filter(p => p.atendimentoRef === atendimentoRef);
      const filteredTasks = taskRes.items.filter(t => t.atendimentoRef === atendimentoRef);

      setPendings(filteredPendings);
      setTasks(filteredTasks);
    } catch (e) {
      console.error('Error loading tasks/pendings:', e);
    } finally {
      setLoading(false);
    }
  };

  // PENDENCIES METHODS
  const handleSavePending = async () => {
    if (!pendingFormData.description || !pendingFormData.title) return;

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (pendingFormData.averageDaysToComplete || 7));
      const now = new Date().toISOString();

      const data: any = {
        atendimentoRef,
        title: pendingFormData.title,
        description: pendingFormData.description,
        status: editingPending ? editingPending.status : 'Pendente',
        priority: editingPending ? editingPending.priority : 'Média',
        dueDate: dueDate.toISOString(),
        responsiblePartyType: pendingFormData.responsiblePartyType,
        responsiblePartyDetails: pendingFormData.responsiblePartyType === 'Interno' ? pendingFormData.responsiblePartyDetails : '',
        taskAutomaticallyCreated: false,
        creationDate: editingPending ? undefined : now
      };

      if (editingPending) {
        await BaseCrudService.update(collections.pendings, { _id: editingPending._id, ...data });
        toast.success('Pendência atualizada com sucesso');
      } else {
        await BaseCrudService.create(collections.pendings, { _id: crypto.randomUUID(), ...data });
        
        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef,
          tipoEvento: 'Pendencia_Criada',
          interactionType: 'Criação de pendência',
          interactionDescription: `Nova pendência criada: "${data.title}"`,
          interactionDate: now,
          autorTipo: 'Sistema'
        });
        toast.success('Pendência criada com sucesso');
      }

      setShowPendingForm(false);
      setEditingPending(null);
      setPendingFormData({
        title: '',
        description: '',
        responsiblePartyType: 'Cliente',
        responsiblePartyDetails: '',
        averageDaysToComplete: 7
      });
      loadData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving pending:', error);
      toast.error('Erro ao salvar pendência');
    }
  };

  const handleTogglePendingStatus = async (pending: any) => {
    const isCompleted = pending.status === 'Concluída' || pending.status === 'Resolvida';
    const newStatus = isCompleted ? 'Pendente' : 'Concluída';
    const now = new Date().toISOString();

    try {
      await BaseCrudService.update(collections.pendings, {
        _id: pending._id,
        status: newStatus,
        resolvedDate: newStatus === 'Concluída' ? now : undefined
      });

      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef,
        tipoEvento: newStatus === 'Concluída' ? 'Pendencia_Concluida' : 'Pendencia_Reaberta',
        interactionType: newStatus === 'Concluída' ? 'Conclusão de pendência' : 'Reabertura de pendência',
        interactionDescription: `Pendência "${pending.title}" foi ${newStatus === 'Concluída' ? 'concluída' : 'reaberta'}`,
        interactionDate: now,
        autorTipo: 'Sistema'
      });

      toast.success(newStatus === 'Concluída' ? 'Pendência concluída' : 'Pendência reaberta');
      loadData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error toggling pending status:', error);
    }
  };

  const handleDeletePending = async (pendingId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pendência?')) return;
    try {
      await BaseCrudService.delete(collections.pendings, pendingId);
      toast.success('Pendência excluída');
      loadData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error deleting pending:', error);
    }
  };

  // TASKS METHODS
  const handleSaveTask = async () => {
    if (!taskFormData.description) return;

    try {
      const now = new Date().toISOString();
      const dueDate = taskFormData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const data: any = {
        atendimentoRef,
        titulo: taskFormData.description.substring(0, 100),
        description: taskFormData.description,
        status: editingTask ? editingTask.status : 'A Fazer',
        responsibleType: taskFormData.responsibleType,
        responsavelExternoRef: taskFormData.responsibleType === 'Sem responsável' ? undefined : taskFormData.internalResponsibleId,
        internalResponsibleId: taskFormData.responsibleType === 'Sem responsável' ? undefined : taskFormData.internalResponsibleId,
        dueDate,
        creationDate: editingTask ? undefined : now
      };

      if (editingTask) {
        await BaseCrudService.update(collections.tasks, { _id: editingTask._id, ...data });
        toast.success('Tarefa atualizada com sucesso');
      } else {
        await BaseCrudService.create(collections.tasks, { _id: crypto.randomUUID(), ...data });

        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef,
          tipoEvento: 'Tarefa_Criada',
          interactionType: 'Criação de tarefa',
          interactionDescription: `Nova tarefa criada: "${data.titulo}"`,
          interactionDate: now,
          autorTipo: 'Sistema'
        });
        toast.success('Tarefa criada com sucesso');
      }

      setShowTaskForm(false);
      setEditingTask(null);
      setTaskFormData({
        description: '',
        responsibleType: 'Interno',
        internalResponsibleId: '',
        dueDate: ''
      });
      loadData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Erro ao salvar tarefa');
    }
  };

  const handleToggleTaskStatus = async (task: any) => {
    const isCompleted = task.status === 'Concluída';
    const newStatus = isCompleted ? 'A Fazer' : 'Concluída';
    const now = new Date().toISOString();

    try {
      await BaseCrudService.update(collections.tasks, {
        _id: task._id,
        status: newStatus
      });

      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef,
        tipoEvento: newStatus === 'Concluída' ? 'Tarefa_Concluida' : 'Tarefa_Reaberta',
        interactionType: newStatus === 'Concluída' ? 'Conclusão de tarefa' : 'Reabertura de tarefa',
        interactionDescription: `Tarefa "${task.titulo || task.description}" foi ${newStatus === 'Concluída' ? 'concluída' : 'reaberta'}`,
        interactionDate: now,
        autorTipo: 'Sistema'
      });

      toast.success(newStatus === 'Concluída' ? 'Tarefa concluída' : 'Tarefa reaberta');
      loadData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      await BaseCrudService.delete(collections.tasks, taskId);
      toast.success('Tarefa excluída');
      loadData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (tab === 'pendencias') {
    const activePendings = pendings.filter(p => p.status !== 'Concluída' && p.status !== 'Resolvida');
    const displayPendings = showCompletedPendings ? pendings : activePendings;

    return (
      <div className="space-y-6">
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Pendências do Cartão
                <Badge className="ml-2 bg-orange-500 text-white font-bold rounded-lg px-2 py-0.5">
                  {activePendings.length} abertas
                </Badge>
              </CardTitle>
              <Button
                onClick={() => {
                  setShowPendingForm(true);
                  setEditingPending(null);
                  setPendingFormData({
                    title: '',
                    description: '',
                    responsiblePartyType: 'Cliente',
                    responsiblePartyDetails: '',
                    averageDaysToComplete: 7
                  });
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 font-bold flex items-center gap-1.5 text-xs shadow-md shadow-emerald-100 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Nova Pendência
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            {/* Toggle Completed */}
            <div className="flex items-center space-x-2 justify-end mb-2">
              <Checkbox
                id="show-completed-pendings"
                checked={showCompletedPendings}
                onCheckedChange={(checked) => setShowCompletedPendings(checked as boolean)}
              />
              <label
                htmlFor="show-completed-pendings"
                className="text-xs font-semibold text-slate-500 cursor-pointer select-none"
              >
                Mostrar concluídas
              </label>
            </div>

            {/* Pending Form */}
            {showPendingForm && (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-500" />
                    {editingPending ? 'Editar Pendência' : 'Nova Pendência'}
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowPendingForm(false);
                      setEditingPending(null);
                    }}
                    className="h-7 w-7 p-0 rounded-full hover:bg-slate-200"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-650 block mb-1">Responsável *</Label>
                    <Select
                      value={pendingFormData.responsiblePartyType}
                      onValueChange={(value) => setPendingFormData({ ...pendingFormData, responsiblePartyType: value, responsiblePartyDetails: '' })}
                    >
                      <SelectTrigger className="h-10 bg-white border-slate-200 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cliente">Cliente</SelectItem>
                        <SelectItem value="Interno">Equipe Interna</SelectItem>
                        <SelectItem value="Parceiro Externo">Parceiro Externo</SelectItem>
                        <SelectItem value="Construtora">Construtora</SelectItem>
                        <SelectItem value="Caixa">Caixa</SelectItem>
                        <SelectItem value="Cartório">Cartório</SelectItem>
                        <SelectItem value="Sistema/Prazo legal">Sistema/Prazo legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {pendingFormData.responsiblePartyType === 'Interno' && (
                    <div>
                      <Label className="text-xs font-bold text-slate-650 block mb-1">Selecione o Usuário *</Label>
                      <Select
                        value={pendingFormData.responsiblePartyDetails}
                        onValueChange={(value) => setPendingFormData({ ...pendingFormData, responsiblePartyDetails: value })}
                      >
                        <SelectTrigger className="h-10 bg-white border-slate-200 rounded-xl">
                          <SelectValue placeholder="Selecione o usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          {team.map(u => (
                            <SelectItem key={u._id} value={u._id}>
                              {u.name || u.emailLogin}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {pendingFormData.responsiblePartyType !== 'Interno' && pendingFormData.responsiblePartyType !== 'Cliente' && (
                    <div>
                      <Label className="text-xs font-bold text-slate-650 block mb-1">Detalhes do Responsável</Label>
                      <Input
                        value={pendingFormData.responsiblePartyDetails}
                        onChange={(e) => setPendingFormData({ ...pendingFormData, responsiblePartyDetails: e.target.value })}
                        placeholder="Nome, contato, etc..."
                        className="h-10 bg-white border-slate-200 rounded-xl"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <Label className="text-xs font-bold text-slate-650 block mb-1">Título *</Label>
                    <Input
                      value={pendingFormData.title}
                      onChange={(e) => setPendingFormData({ ...pendingFormData, title: e.target.value })}
                      placeholder="Título curto da pendência..."
                      className="h-10 bg-white border-slate-200 rounded-xl text-slate-800 font-medium"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-xs font-bold text-slate-650 block mb-1">Descrição *</Label>
                    <Textarea
                      value={pendingFormData.description}
                      onChange={(e) => setPendingFormData({ ...pendingFormData, description: e.target.value })}
                      placeholder="Descreva detalhadamente o que está travando o processo..."
                      rows={3}
                      className="bg-white border-slate-200 rounded-xl text-slate-700 text-sm resize-none"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-650 block mb-1">Prazo para Solução (dias) *</Label>
                    <Input
                      type="number"
                      value={pendingFormData.averageDaysToComplete}
                      onChange={(e) => setPendingFormData({ ...pendingFormData, averageDaysToComplete: parseInt(e.target.value) || 7 })}
                      min="1"
                      className="h-10 bg-white border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-200">
                  <Button
                    onClick={handleSavePending}
                    disabled={!pendingFormData.description || !pendingFormData.title || (pendingFormData.responsiblePartyType === 'Interno' && !pendingFormData.responsiblePartyDetails)}
                    className="h-10 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-100"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPending ? 'Salvar Alterações' : 'Criar Pendência'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPendingForm(false);
                      setEditingPending(null);
                    }}
                    className="h-10 px-5 border-slate-200 rounded-xl font-bold"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Pending List */}
            <div className="grid grid-cols-1 gap-3">
              {displayPendings.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-35" />
                  <p className="text-sm font-semibold">Nenhuma pendência ativa</p>
                </div>
              ) : (
                displayPendings.map(pending => {
                  const isCompleted = pending.status === 'Concluída' || pending.status === 'Resolvida';
                  const overdue = pending.dueDate && new Date(pending.dueDate) < new Date() && !isCompleted;

                  return (
                    <div
                      key={pending._id}
                      className={`p-4 border rounded-2xl transition-all shadow-sm ${
                        isCompleted
                          ? 'bg-emerald-50/40 border-emerald-100/60'
                          : overdue
                            ? 'bg-rose-50/40 border-rose-100/60 shadow-rose-50'
                            : 'bg-white border-slate-100/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => handleTogglePendingStatus(pending)}
                              className="h-4.5 w-4.5 rounded-md border-slate-300"
                            />
                            <h4 className={`text-sm font-bold text-slate-800 flex items-center gap-1.5 ${isCompleted ? 'line-through text-slate-400 font-medium' : ''}`}>
                              {pending.title}
                            </h4>
                            {overdue && (
                              <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-[9px] px-1.5 h-4.5 uppercase rounded">
                                Atrasada
                              </Badge>
                            )}
                          </div>
                          <p className={`text-xs ${isCompleted ? 'text-slate-400' : 'text-slate-500'} leading-relaxed pl-6.5`}>
                            {pending.description}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1 pl-6.5">
                            <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 text-slate-500 h-5 px-2 rounded-lg">
                              👤 {pending.responsiblePartyType === 'Interno'
                                ? users.find(u => u._id === pending.responsiblePartyDetails)?.name || 'Interno'
                                : pending.responsiblePartyDetails || pending.responsiblePartyType}
                            </Badge>
                            {pending.dueDate && (
                              <Badge variant="outline" className={`text-[10px] font-semibold h-5 px-2 rounded-lg ${overdue ? 'bg-rose-50 text-rose-600 border-rose-100' : 'border-slate-200 text-slate-500'}`}>
                                📅 Prazo: {format(new Date(pending.dueDate), 'dd/MM/yyyy')}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingPending(pending);
                              setPendingFormData({
                                title: pending.title || '',
                                description: pending.description || '',
                                responsiblePartyType: pending.responsiblePartyType || 'Cliente',
                                responsiblePartyDetails: pending.responsiblePartyDetails || '',
                                averageDaysToComplete: 7
                              });
                              setShowPendingForm(true);
                            }}
                            className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePending(pending._id)}
                            className="h-8 w-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } else {
    // TAREFAS TAB CONTENT
    const activeTasks = tasks.filter(t => t.status !== 'Concluída');
    const displayTasks = showCompletedTasks ? tasks : activeTasks;

    return (
      <div className="space-y-6">
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-emerald-600" />
                Tarefas do Cartão
                <Badge className="ml-2 bg-emerald-600 text-white font-bold rounded-lg px-2 py-0.5">
                  {activeTasks.length} abertas
                </Badge>
              </CardTitle>
              <Button
                onClick={() => {
                  setShowTaskForm(true);
                  setEditingTask(null);
                  setTaskFormData({
                    description: '',
                    responsibleType: 'Interno',
                    internalResponsibleId: '',
                    dueDate: ''
                  });
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 font-bold flex items-center gap-1.5 text-xs shadow-md shadow-emerald-100 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Nova Tarefa
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            {/* Toggle Completed */}
            <div className="flex items-center space-x-2 justify-end mb-2">
              <Checkbox
                id="show-completed-tasks"
                checked={showCompletedTasks}
                onCheckedChange={(checked) => setShowCompletedTasks(checked as boolean)}
              />
              <label
                htmlFor="show-completed-tasks"
                className="text-xs font-semibold text-slate-500 cursor-pointer select-none"
              >
                Mostrar concluídas
              </label>
            </div>

            {/* Task Form */}
            {showTaskForm && (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-500" />
                    {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowTaskForm(false);
                      setEditingTask(null);
                    }}
                    className="h-7 w-7 p-0 rounded-full hover:bg-slate-200"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-650 block mb-1">Responsável *</Label>
                    <Select
                      value={taskFormData.internalResponsibleId}
                      onValueChange={(value) => setTaskFormData({ ...taskFormData, internalResponsibleId: value })}
                    >
                      <SelectTrigger className="h-10 bg-white border-slate-200 rounded-xl">
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {team.map(u => (
                          <SelectItem key={u._id} value={u._id}>
                            {u.name || u.emailLogin}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-650 block mb-1">Prazo</Label>
                    <Input
                      type="date"
                      value={taskFormData.dueDate ? new Date(taskFormData.dueDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                      className="h-10 bg-white border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-xs font-bold text-slate-650 block mb-1">Descrição da Tarefa *</Label>
                    <Textarea
                      value={taskFormData.description}
                      onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                      placeholder="Descreva objetivamente o que precisa ser feito..."
                      rows={3}
                      className="bg-white border-slate-200 rounded-xl text-slate-700 text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-200">
                  <Button
                    onClick={handleSaveTask}
                    disabled={!taskFormData.description || !taskFormData.internalResponsibleId}
                    className="h-10 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-100"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTaskForm(false);
                      setEditingTask(null);
                    }}
                    className="h-10 px-5 border-slate-200 rounded-xl font-bold"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Task List */}
            <div className="grid grid-cols-1 gap-3">
              {displayTasks.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-400">
                  <ListTodo className="w-10 h-10 mx-auto mb-2 opacity-35" />
                  <p className="text-sm font-semibold">Nenhuma tarefa ativa</p>
                </div>
              ) : (
                displayTasks.map(task => {
                  const isCompleted = task.status === 'Concluída';
                  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

                  return (
                    <div
                      key={task._id}
                      className={`p-4 border rounded-2xl transition-all shadow-sm ${
                        isCompleted
                          ? 'bg-emerald-50/40 border-emerald-100/60'
                          : overdue
                            ? 'bg-rose-50/40 border-rose-100/60 shadow-rose-50'
                            : 'bg-white border-slate-100/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => handleToggleTaskStatus(task)}
                              className="h-4.5 w-4.5 rounded-md border-slate-300"
                            />
                            <h4 className={`text-sm font-bold text-slate-800 flex items-center gap-1.5 ${isCompleted ? 'line-through text-slate-400 font-medium' : ''}`}>
                              {task.titulo || task.description}
                            </h4>
                            {overdue && (
                              <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-[9px] px-1.5 h-4.5 uppercase rounded">
                                Atrasada
                              </Badge>
                            )}
                          </div>
                          {task.description && task.titulo && (
                            <p className={`text-xs ${isCompleted ? 'text-slate-400' : 'text-slate-500'} leading-relaxed pl-6.5`}>
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 pt-1 pl-6.5">
                            <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 text-slate-500 h-5 px-2 rounded-lg">
                              👤 {users.find(u => u._id === task.internalResponsibleId)?.name || 'Sem responsável'}
                            </Badge>
                            {task.dueDate && (
                              <Badge variant="outline" className={`text-[10px] font-semibold h-5 px-2 rounded-lg ${overdue ? 'bg-rose-50 text-rose-600 border-rose-100' : 'border-slate-200 text-slate-500'}`}>
                                📅 Prazo: {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingTask(task);
                              setTaskFormData({
                                description: task.description || task.titulo || '',
                                responsibleType: task.responsibleType || 'Interno',
                                internalResponsibleId: task.internalResponsibleId || '',
                                dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : ''
                              });
                              setShowTaskForm(true);
                            }}
                            className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task._id)}
                            className="h-8 w-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
};
