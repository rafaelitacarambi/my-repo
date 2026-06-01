// src/components/admin/tasks/GeneralTarefasPanel.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import {
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Search,
  Filter,
  Calendar,
  FileText,
  CheckCircle,
  RotateCcw,
  Play,
  X,
  Save,
  User,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, HistricodeInteraes } from '@/entities';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GeneralTarefasPanelProps {
  serviceType: 'locacoes' | 'vendas' | 'leilao';
  title: string;
  kanbanRoute: string;
  collection: string;
  serviceFilter: (record: ServiceRecords) => boolean;
  navigationComponent: React.ReactNode;
}

const TASK_COLUMNS = [
  { id: 'todo', name: 'A Fazer', color: 'bg-slate-100/60', borderColor: 'border-slate-200' },
  { id: 'in-progress', name: 'Em Andamento', color: 'bg-blue-50/50', borderColor: 'border-blue-200' },
  { id: 'done', name: 'Concluídas', color: 'bg-emerald-50/40', borderColor: 'border-emerald-200' }
];

const getColumnForStatus = (status?: string): string => {
  if (status === 'Concluída') return 'done';
  if (status === 'Em andamento' || status === 'Em Progresso' || status === 'Em Andamento') return 'in-progress';
  return 'todo';
};

const getStatusForColumn = (columnId: string): string => {
  if (columnId === 'done') return 'Concluída';
  if (columnId === 'in-progress') return 'Em Andamento';
  return 'A Fazer';
};

export const GeneralTarefasPanel: React.FC<GeneralTarefasPanelProps> = ({
  serviceType,
  title,
  kanbanRoute,
  collection,
  serviceFilter,
  navigationComponent
}) => {
  const navigate = useNavigate();
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [atendimentos, setAtendimentos] = useState<ServiceRecords[]>([]);
  const [usuarios, setUsuarios] = useState<UsuriosdoSistema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<any | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [responsavelFilter, setResponsavelFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    atendimentoRef: '',
    responsibleType: 'Interno',
    internalResponsibleId: '',
    dueDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tarefasResult, atendimentosResult, usuariosResult] = await Promise.all([
        BaseCrudService.getAll<any>(collection),
        BaseCrudService.getAll<ServiceRecords>('atendimentos'),
        BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema')
      ]);

      setTarefas(tarefasResult.items);
      setAtendimentos(atendimentosResult.items.filter(serviceFilter));
      setUsuarios(usuariosResult.items.filter(u => u.ativo !== false));
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const team = usuarios.filter(u => u.ativo !== false);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = getStatusForColumn(destination.droppableId);
    const tarefa = tarefas.find(t => t._id === draggableId);
    if (!tarefa) return;

    // Optimistic UI update
    setTarefas(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t));

    try {
      await BaseCrudService.update(collection, {
        _id: draggableId,
        status: newStatus
      });

      if (tarefa.atendimentoRef) {
        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef: tarefa.atendimentoRef,
          tipoEvento: 'Tarefa_Movida',
          interactionType: 'Mudança de status',
          interactionDescription: `Tarefa "${tarefa.titulo || tarefa.description}" movida para: ${TASK_COLUMNS.find(c => c.id === destination.droppableId)?.name}`,
          interactionDate: new Date().toISOString(),
          autorTipo: 'Sistema'
        });
      }

      toast.success(`Tarefa movida para ${TASK_COLUMNS.find(c => c.id === destination.droppableId)?.name}`);
      loadData();
    } catch (e) {
      toast.error('Erro ao mover tarefa');
      loadData();
    }
  };

  const handleCreate = () => {
    setEditingTarefa(null);
    setFormData({
      description: '',
      atendimentoRef: '',
      responsibleType: 'Interno',
      internalResponsibleId: '',
      dueDate: ''
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (tarefa: any) => {
    setEditingTarefa(tarefa);
    setFormData({
      description: tarefa.description || tarefa.titulo || '',
      atendimentoRef: tarefa.atendimentoRef || '',
      responsibleType: tarefa.responsibleType || 'Interno',
      internalResponsibleId: tarefa.internalResponsibleId || '',
      dueDate: tarefa.dueDate ? format(new Date(tarefa.dueDate), 'yyyy-MM-dd') : ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      setTarefas(prev => prev.filter(t => t._id !== id));
      await BaseCrudService.delete(collection, id);
      toast.success('Tarefa excluída');
      loadData();
    } catch (e) {
      toast.error('Erro ao excluir tarefa');
      loadData();
    }
  };

  const handleIniciar = async (tarefaId: string) => {
    const tarefa = tarefas.find(t => t._id === tarefaId);
    if (!tarefa) return;

    setTarefas(prev => prev.map(t => t._id === tarefaId ? { ...t, status: 'Em Andamento' } : t));

    try {
      await BaseCrudService.update(collection, {
        _id: tarefaId,
        status: 'Em Andamento'
      });

      if (tarefa.atendimentoRef) {
        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef: tarefa.atendimentoRef,
          tipoEvento: 'Tarefa_Iniciada',
          interactionType: 'Início de tarefa',
          interactionDescription: `Tarefa "${tarefa.titulo || tarefa.description}" foi iniciada`,
          interactionDate: new Date().toISOString(),
          autorTipo: 'Sistema'
        });
      }

      toast.success('Tarefa iniciada');
      loadData();
    } catch (e) {
      loadData();
    }
  };

  const handleConcluir = async (tarefaId: string) => {
    const tarefa = tarefas.find(t => t._id === tarefaId);
    if (!tarefa) return;

    setTarefas(prev => prev.map(t => t._id === tarefaId ? { ...t, status: 'Concluída' } : t));

    try {
      await BaseCrudService.update(collection, {
        _id: tarefaId,
        status: 'Concluída'
      });

      if (tarefa.atendimentoRef) {
        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef: tarefa.atendimentoRef,
          tipoEvento: 'Tarefa_Concluida',
          interactionType: 'Conclusão de tarefa',
          interactionDescription: `Tarefa "${tarefa.titulo || tarefa.description}" foi concluída`,
          interactionDate: new Date().toISOString(),
          autorTipo: 'Sistema'
        });
      }

      toast.success('Tarefa concluída');
      loadData();
    } catch (e) {
      loadData();
    }
  };

  const handleReabrir = async (tarefaId: string) => {
    const tarefa = tarefas.find(t => t._id === tarefaId);
    if (!tarefa) return;

    setTarefas(prev => prev.map(t => t._id === tarefaId ? { ...t, status: 'A Fazer' } : t));

    try {
      await BaseCrudService.update(collection, {
        _id: tarefaId,
        status: 'A Fazer'
      });

      if (tarefa.atendimentoRef) {
        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef: tarefa.atendimentoRef,
          tipoEvento: 'Tarefa_Reaberta',
          interactionType: 'Reabertura de tarefa',
          interactionDescription: `Tarefa "${tarefa.titulo || tarefa.description}" foi reaberta`,
          interactionDate: new Date().toISOString(),
          autorTipo: 'Sistema'
        });
      }

      toast.success('Tarefa reaberta');
      loadData();
    } catch (e) {
      loadData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.atendimentoRef) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const isSemResponsavel = formData.internalResponsibleId === 'sem_responsavel';

    const data = {
      titulo: formData.description.substring(0, 100),
      description: formData.description,
      status: editingTarefa ? editingTarefa.status : 'A Fazer',
      atendimentoRef: formData.atendimentoRef,
      responsibleType: isSemResponsavel ? 'Sem responsável' : 'Interno',
      responsavelExternoRef: isSemResponsavel ? undefined : formData.internalResponsibleId,
      internalResponsibleId: isSemResponsavel ? undefined : formData.internalResponsibleId,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      creationDate: editingTarefa ? undefined : new Date().toISOString()
    };

    try {
      if (editingTarefa) {
        await BaseCrudService.update(collection, { _id: editingTarefa._id, ...data });
        toast.success('Tarefa atualizada com sucesso');
      } else {
        await BaseCrudService.create(collection, { _id: crypto.randomUUID(), ...data });

        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef: formData.atendimentoRef,
          tipoEvento: 'Tarefa_Criada',
          interactionType: 'Criação de tarefa',
          interactionDescription: `Nova tarefa criada: "${data.titulo}"`,
          interactionDate: new Date().toISOString(),
          autorTipo: 'Sistema'
        });
        toast.success('Tarefa criada com sucesso');
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar tarefa');
    }
  };

  const getDaysOpen = (creationDate?: string) => {
    if (!creationDate) return 0;
    return differenceInDays(new Date(), new Date(creationDate));
  };

  const isOverdue = (dueDate?: string, status?: string) => {
    if (!dueDate || status === 'Concluída') return false;
    return new Date(dueDate) < new Date();
  };

  const getAtendimentoName = (ref?: string) => {
    if (!ref) return '—';
    const a = atendimentos.find(item => item._id === ref);
    if (!a) return '—';
    return `${a.contactName || 'Sem nome'} (${a.pastaInterna || 'S/P'})`;
  };

  const getTasksForColumn = (columnId: string) => {
    let filtered = tarefas.filter(t => {
      const taskColumn = getColumnForStatus(t.status);
      return taskColumn === columnId;
    });

    if (searchTerm) {
      filtered = filtered.filter(t =>
        (t.titulo || t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (responsavelFilter !== 'all') {
      filtered = filtered.filter(t => {
        if (responsavelFilter === 'sem_responsavel') {
          return t.responsibleType === 'Sem responsável' || !t.internalResponsibleId;
        }
        return t.internalResponsibleId === responsavelFilter;
      });
    }

    return filtered;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      {navigationComponent}

      <main className="flex-1 w-full max-w-[100rem] mx-auto p-6 lg:p-12 animate-in fade-in duration-300">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-emerald-600" />
              {title}
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-2.5 py-0.5 rounded-lg">
                {tarefas.filter(t => t.status !== 'Concluída').length} abertas
              </Badge>
            </h1>
            <p className="text-slate-500 font-semibold text-sm mt-1">Quadro Kanban de tarefas do módulo com suporte a Drag & Drop para gestão de fluxos de trabalho.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-xl h-12 px-5 font-bold border-slate-200 transition-all ${showFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white hover:bg-slate-50'}`}
            >
              <Filter className="w-4 h-4 mr-2" /> Filtros rápidos
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-6 font-bold shadow-lg shadow-emerald-100 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" /> Nova Tarefa
            </Button>
          </div>
        </div>

        {/* Filters drawer */}
        {showFilters && (
          <Card className="mb-6 border-slate-200 rounded-2xl shadow-sm animate-in slide-in-from-top-2 duration-200">
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-650">Buscar por texto</Label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Título ou descrição da tarefa..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="h-10 pl-10 border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-650">Responsável Atribuído</Label>
                <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
                  <SelectTrigger className="h-10 border-slate-200 rounded-xl">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="sem_responsavel">Sem responsável</SelectItem>
                    {team.map(u => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.name || u.emailLogin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm('');
                    setResponsavelFilter('all');
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl h-10 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kanban Board Container */}
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {TASK_COLUMNS.map(column => {
                const columnTasks = getTasksForColumn(column.id);

                return (
                  <div key={column.id} className="flex flex-col bg-slate-100/60 rounded-3xl border border-slate-200/50 p-4 min-h-[500px]">
                    {/* Column header */}
                    <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-slate-200">
                      <div>
                        <h3 className="font-extrabold text-slate-700 text-sm uppercase tracking-wider">{column.name}</h3>
                        <p className="text-[10px] text-slate-400 font-semibold">{columnTasks.length} {columnTasks.length === 1 ? 'tarefa' : 'tarefas'}</p>
                      </div>
                    </div>

                    {/* Droppable cards list */}
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 space-y-3 rounded-2xl p-1 transition-colors ${snapshot.isDraggingOver ? 'bg-slate-200/30' : ''}`}
                        >
                          <AnimatePresence>
                            {columnTasks.map((task, index) => {
                              const daysOpen = getDaysOpen(task.creationDate);
                              const overdue = isOverdue(task.dueDate, task.status);
                              const respUser = team.find(u => u._id === task.internalResponsibleId);

                              return (
                                <Draggable key={task._id} draggableId={task._id} index={index}>
                                  {(dragProvided, dragSnapshot) => (
                                    <motion.div
                                      ref={dragProvided.innerRef}
                                      {...(dragProvided.draggableProps as any)}
                                      {...(dragProvided.dragHandleProps as any)}
                                      layoutId={task._id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className={`p-4 bg-white border border-slate-100 rounded-2xl shadow-sm transition-all group hover:border-slate-300 ${dragSnapshot.isDragging ? 'shadow-xl ring-2 ring-emerald-500/50 rotate-1 scale-[1.02] cursor-grabbing' : 'cursor-grab'}`}
                                    >
                                      {/* Card header meta */}
                                      <div className="flex justify-between items-start mb-2">
                                        <Badge className={`text-[9px] font-bold border-none px-1.5 h-4.5 rounded-lg text-white ${task.status === 'Concluída' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                                          {daysOpen === 0 ? 'Criada hoje' : `Há ${daysOpen} ${daysOpen === 1 ? 'dia' : 'dias'}`}
                                        </Badge>
                                        {overdue && (
                                          <Badge className="bg-rose-500 text-white font-bold text-[9px] px-1.5 h-4.5 rounded uppercase">
                                            Atrasada
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Description / Title */}
                                      <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">{task.titulo || task.description}</h4>
                                      {task.description && task.titulo && (
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                                      )}

                                      {/* Atendimento reference */}
                                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                                          <FileText className="w-3 h-3 text-slate-350" />
                                          <span className="truncate">{getAtendimentoName(task.atendimentoRef)}</span>
                                        </div>

                                        <div className="flex justify-between items-center mt-0.5">
                                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{respUser ? respUser.name || respUser.emailLogin : 'Sem responsável'}</span>
                                          </div>
                                          {task.dueDate && (
                                            <span className={`text-[9px] font-bold flex items-center gap-1 ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
                                              📅 {format(new Date(task.dueDate), 'dd/MM')}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Column action triggers */}
                                      <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                                        {column.id === 'todo' && (
                                          <Button
                                            size="sm"
                                            onClick={() => handleIniciar(task._id)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-7 px-2.5 text-[10px] font-bold flex-1"
                                          >
                                            <Play className="w-3 h-3 mr-1" /> Iniciar
                                          </Button>
                                        )}
                                        {(column.id === 'todo' || column.id === 'in-progress') && (
                                          <Button
                                            size="sm"
                                            onClick={() => handleConcluir(task._id)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-7 px-2.5 text-[10px] font-bold flex-1"
                                          >
                                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Concluir
                                          </Button>
                                        )}
                                        {column.id === 'done' && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleReabrir(task._id)}
                                            className="rounded-lg h-7 px-2.5 text-[10px] font-bold border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 flex-1"
                                          >
                                            <RotateCcw className="w-3 h-3 mr-1" /> Reabrir
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEdit(task)}
                                          className="h-7 w-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDelete(task._id)}
                                          className="h-7 w-7 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                        {task.atendimentoRef && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => navigate(`${kanbanRoute}?openCard=${task.atendimentoRef}`)}
                                            className="h-7 w-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                            title="Ver Cartão"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </Draggable>
                              );
                            })}
                          </AnimatePresence>
                          {provided.placeholder}

                          {columnTasks.length === 0 && (
                            <div className="text-center py-16 text-slate-400 bg-white/40 border border-dashed border-slate-200/60 rounded-2xl">
                              <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-350" />
                              <p className="text-xs font-semibold">Tudo em dia!</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </main>

      {/* Creation / Editing Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-6.5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
              {editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="sm:col-span-2">
              <Label className="text-xs font-bold text-slate-650 block mb-1">Processo Associado *</Label>
              <Select
                value={formData.atendimentoRef}
                onValueChange={v => setFormData({ ...formData, atendimentoRef: v })}
                disabled={!!editingTarefa}
              >
                <SelectTrigger className="h-10 border-slate-200 rounded-xl">
                  <SelectValue placeholder="Selecione o processo" />
                </SelectTrigger>
                <SelectContent>
                  {atendimentos.map(a => (
                    <SelectItem key={a._id} value={a._id}>
                      {a.contactName} ({a.pastaInterna || 'Sem Pasta'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-650 block mb-1">Responsável Interno *</Label>
              <Select
                value={formData.internalResponsibleId}
                onValueChange={v => setFormData({ ...formData, internalResponsibleId: v })}
              >
                <SelectTrigger className="h-10 border-slate-200 rounded-xl">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem_responsavel">Deixar sem responsável</SelectItem>
                  {team.map(u => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name || u.emailLogin}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-650 block mb-1">Prazo limite</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="h-10 border-slate-200 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs font-bold text-slate-650 block mb-1">Descrição / Instruções *</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva claramente o que precisa ser feito..."
                rows={4}
                className="border-slate-200 rounded-xl text-sm resize-none"
              />
            </div>

            <div className="sm:col-span-2 flex gap-3 pt-3 border-t border-slate-100 mt-2">
              <Button
                type="submit"
                disabled={!formData.description || !formData.atendimentoRef}
                className="h-11 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-100"
              >
                <Save className="w-4 h-4 mr-2" /> {editingTarefa ? 'Salvar Alterações' : 'Criar Tarefa'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-11 px-5 border-slate-200 rounded-xl font-bold"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};
