import { useState, useEffect } from 'react';
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
  ExternalLink,
  AlertCircle,
  X,
  Save,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FinancingNavigation from '@/components/FinancingNavigation';
import { BaseCrudService } from '@/integrations';
import { FinancingTasks, ServiceRecords, UsuriosdoSistema, HistricodeInteraes } from '@/entities';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Kanban columns for tasks (Trello-style)
const TASK_COLUMNS = [
  { id: 'todo', name: 'A Fazer', color: 'bg-gray-50', borderColor: 'border-gray-300' },
  { id: 'in-progress', name: 'Em Andamento', color: 'bg-blue-50', borderColor: 'border-blue-300' },
  { id: 'done', name: 'Concluídas', color: 'bg-green-50', borderColor: 'border-green-300' }
];

// Map task status to column
const getColumnForStatus = (status?: string): string => {
  if (status === 'Concluída') return 'done';
  if (status === 'Em andamento' || status === 'Em Progresso') return 'in-progress';
  return 'todo';
};

// Map column to status
const getStatusForColumn = (columnId: string): string => {
  if (columnId === 'done') return 'Concluída';
  if (columnId === 'in-progress') return 'Em andamento';
  return 'A Fazer';
};

export default function AdminFinancingTarefasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tarefas, setTarefas] = useState<FinancingTasks[]>([]);
  const [atendimentos, setAtendimentos] = useState<ServiceRecords[]>([]);
  const [usuarios, setUsuarios] = useState<UsuriosdoSistema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [atendimentoFilter, setAtendimentoFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<FinancingTasks | null>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    description: '',
    atendimentoRef: '',
    responsibleType: 'Interno',
    responsavelExternoRef: '',
    externalResponsibleName: '',
    externalResponsibleContact: '',
    dueDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    const [tarefasResult, atendimentosResult, usuariosResult] = await Promise.all([
      BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento'),
      BaseCrudService.getAll<ServiceRecords>('atendimentos'),
      BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema')
    ]);

    setTarefas(tarefasResult.items);
    setAtendimentos(atendimentosResult.items.filter(a => a.serviceType === 'Financiamento'));
    setUsuarios(usuariosResult.items.filter(u => u.ativo));
    setIsLoading(false);
  };

  // Get filtered tasks by column and filters (only active tasks - not completed)
  const getTasksByColumn = (columnId: string) => {
    // Filter out completed tasks from active columns
    let filtered = tarefas.filter(t => {
      const taskColumn = getColumnForStatus(t.status);
      // Only show completed tasks in the 'done' column
      if (columnId === 'done') {
        return taskColumn === 'done';
      } else {
        // For active columns, exclude completed tasks
        return taskColumn === columnId && t.status !== 'Concluída';
      }
    });

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (atendimentoFilter !== 'all') {
      filtered = filtered.filter(t => t.atendimentoRef === atendimentoFilter);
    }

    return filtered;
  };

  const handleCreate = () => {
    setEditingTarefa(null);
    setFormData({
      titulo: '',
      description: '',
      atendimentoRef: '',
      responsibleType: 'Interno',
      responsavelExternoRef: '',
      externalResponsibleName: '',
      externalResponsibleContact: '',
      dueDate: ''
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (tarefa: FinancingTasks) => {
    setEditingTarefa(tarefa);
    setFormData({
      titulo: tarefa.titulo || '',
      description: tarefa.description || '',
      atendimentoRef: tarefa.atendimentoRef || '',
      responsibleType: tarefa.responsibleType || 'Interno',
      responsavelExternoRef: tarefa.responsavelExternoRef || '',
      externalResponsibleName: tarefa.externalResponsibleName || '',
      externalResponsibleContact: tarefa.externalResponsibleContact || '',
      dueDate: tarefa.dueDate ? format(new Date(tarefa.dueDate), 'yyyy-MM-dd') : ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    setTarefas(prev => prev.filter(t => t._id !== id));
    
    await BaseCrudService.delete('tarefasfinanciamento', id);
    
    toast({
      title: "Tarefa excluída",
      description: "A tarefa foi removida com sucesso"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo || !formData.atendimentoRef) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e selecione um processo",
        variant: "destructive"
      });
      return;
    }

    const tarefaData = {
      titulo: formData.titulo,
      description: formData.description,
      status: 'A Fazer',
      atendimentoRef: formData.atendimentoRef,
      responsibleType: formData.responsibleType,
      responsavelExternoRef: formData.responsavelExternoRef || undefined,
      internalResponsibleId: formData.responsibleType === 'Interno' ? formData.responsavelExternoRef : undefined,
      externalResponsibleName: formData.externalResponsibleName || undefined,
      externalResponsibleContact: formData.externalResponsibleContact || undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      creationDate: editingTarefa ? undefined : new Date().toISOString()
    };

    if (editingTarefa) {
      setTarefas(prev => prev.map(t => 
        t._id === editingTarefa._id ? { ...t, ...tarefaData } : t
      ));
      
      await BaseCrudService.update('tarefasfinanciamento', {
        _id: editingTarefa._id,
        ...tarefaData
      });

      toast({
        title: "✅ Tarefa atualizada",
        description: "As alterações foram salvas"
      });
    } else {
      const newTarefa = {
        _id: crypto.randomUUID(),
        ...tarefaData
      } as FinancingTasks;

      setTarefas(prev => [newTarefa, ...prev]);
      
      await BaseCrudService.create('tarefasfinanciamento', newTarefa);

      if (newTarefa.atendimentoRef) {
        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef: newTarefa.atendimentoRef,
          tipoEvento: 'Tarefa_Criada',
          interactionType: 'Criação de tarefa',
          interactionDescription: `Nova tarefa criada manualmente: "${newTarefa.titulo}"`,
          interactionDate: new Date().toISOString(),
          autorTipo: 'Sistema'
        });
      }

      toast({
        title: "✅ Tarefa criada",
        description: "A nova tarefa foi adicionada ao processo"
      });
    }

    setIsDialogOpen(false);
    
    // Reload data to update counters
    await loadData();
  };

  const handleIniciar = async (tarefaId: string) => {
    const tarefa = tarefas.find(t => t._id === tarefaId);
    if (!tarefa) return;

    setTarefas(prev => prev.map(t => t._id === tarefaId ? { ...t, status: 'Em andamento' } : t));

    await BaseCrudService.update<FinancingTasks>('tarefasfinanciamento', {
      _id: tarefaId,
      status: 'Em andamento'
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

    toast({
      title: "▶️ Tarefa iniciada",
      description: `"${tarefa.titulo || tarefa.description}" está em andamento`
    });
  };

  const handleConcluir = async (tarefaId: string) => {
    const tarefa = tarefas.find(t => t._id === tarefaId);
    if (!tarefa) return;

    setTarefas(prev => prev.map(t => t._id === tarefaId ? { ...t, status: 'Concluída' } : t));

    await BaseCrudService.update<FinancingTasks>('tarefasfinanciamento', {
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

    toast({
      title: "✅ Tarefa concluída",
      description: `"${tarefa.titulo || tarefa.description}" foi finalizada e movida para o histórico`
    });
    
    // Reload data to update counters
    await loadData();
  };

  const handleReabrir = async (tarefaId: string) => {
    const tarefa = tarefas.find(t => t._id === tarefaId);
    if (!tarefa) return;

    setTarefas(prev => prev.map(t => t._id === tarefaId ? { ...t, status: 'A Fazer' } : t));

    await BaseCrudService.update<FinancingTasks>('tarefasfinanciamento', {
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

    toast({
      title: "🔄 Tarefa reaberta",
      description: `"${tarefa.titulo || tarefa.description}" foi reaberta e movida para 'A Fazer'`
    });
    
    // Reload data to update counters
    await loadData();
  };

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = getStatusForColumn(destination.droppableId);
    const tarefa = tarefas.find(t => t._id === draggableId);
    if (!tarefa) return;

    setTarefas(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t));

    await BaseCrudService.update<FinancingTasks>('tarefasfinanciamento', {
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

    toast({
      title: "📋 Tarefa movida",
      description: `Movida para: ${TASK_COLUMNS.find(c => c.id === destination.droppableId)?.name}`
    });
    
    // Reload data to update counters
    await loadData();
  };

  const getResponsibleName = (tarefa: FinancingTasks) => {
    if (tarefa.responsavelExternoRef) {
      const rsalesMap: Record<string, string> = {
        'catarina': 'Catarina',
        'rafael': 'Rafael',
        'gabriela': 'Gabriela',
        'isabela': 'Isabela'
      };
      return rsalesMap[tarefa.responsavelExternoRef.toLowerCase()] || tarefa.responsavelExternoRef;
    }
    if (tarefa.responsibleType === 'Interno' && tarefa.internalResponsibleId) {
      const usuario = usuarios.find(u => u._id === tarefa.internalResponsibleId);
      return usuario?.name || 'Usuário não encontrado';
    }
    return tarefa.externalResponsibleName || 'Não atribuído';
  };

  const isOverdue = (dueDate?: Date | string, status?: string) => {
    if (!dueDate || status === 'Concluída') return false;
    return new Date(dueDate) < new Date();
  };

  const getDaysOpen = (creationDate?: Date | string) => {
    if (!creationDate) return 0;
    return differenceInDays(new Date(), new Date(creationDate));
  };

  const getAtendimentoName = (atendimentoRef?: string) => {
    if (!atendimentoRef) return 'Sem processo';
    const atendimento = atendimentos.find(a => a._id === atendimentoRef);
    if (!atendimento) return `Processo ${atendimentoRef.substring(0, 8)}`;
    
    const clientName = atendimento.contactName || 'Cliente não informado';
    const folderName = atendimento.pastaInterna;
    
    if (folderName) {
      return `${clientName} (${folderName})`;
    }
    return clientName;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-gray">
        <Header />
        <FinancingNavigation />
        <div className="flex items-center justify-center py-24">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-gray">
      <Header />
      <FinancingNavigation />

      {/* Header Section */}
      <section className="w-full bg-gradient-to-br from-secondary via-secondary/90 to-buttonbackground py-8 sticky top-0 z-40 shadow-lg">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-heading text-3xl lg:text-4xl text-white mb-2">
                  Tarefas do Financiamento
                </h1>
                <p className="font-paragraph text-sm text-white/90">
                  Controle operacional estilo Trello - Arraste cartões entre colunas
                </p>
              </div>
              
              <Button
                onClick={handleCreate}
                className="h-11 bg-white text-secondary hover:bg-white/90 font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar tarefas..."
                  className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <Select value={atendimentoFilter} onValueChange={setAtendimentoFilter}>
                <SelectTrigger className="w-[280px] h-11 bg-white/10 border-white/20 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por processo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os processos</SelectItem>
                  {atendimentos.map(atendimento => (
                    <SelectItem key={atendimento._id} value={atendimento._id}>
                      {atendimento.contactName || `Processo ${atendimento._id.substring(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Kanban Board */}
      <section className="w-full py-6">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {TASK_COLUMNS.map((column) => {
                const columnTasks = getTasksByColumn(column.id);
                return (
                  <motion.div
                    key={column.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`${column.color} border-2 ${column.borderColor} rounded-xl p-4 min-h-[600px] transition-all ${
                            snapshot.isDraggingOver ? 'ring-4 ring-secondary/30 scale-[1.02]' : ''
                          }`}
                        >
                          {/* Column Header */}
                          <div className="mb-4 pb-3 border-b-2 border-gray-300">
                            <h3 className="font-heading text-base text-foreground font-bold uppercase tracking-wide mb-2">
                              {column.name}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {columnTasks.length} {columnTasks.length === 1 ? 'tarefa' : 'tarefas'}
                            </Badge>
                          </div>

                          {/* Tasks */}
                          <div className="space-y-3">
                            {columnTasks.map((tarefa, index) => {
                              const daysOpen = getDaysOpen(tarefa.creationDate);
                              const overdueStatus = isOverdue(tarefa.dueDate, tarefa.status);
                              const slaColor = daysOpen <= 1 ? 'bg-green-500' : daysOpen <= 3 ? 'bg-yellow-500' : 'bg-red-500';
                              
                              return (
                                <Draggable key={tarefa._id} draggableId={tarefa._id} index={index}>
                                  {(provided, snapshot) => (
                                    <motion.div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      whileHover={{ scale: snapshot.isDragging ? 1 : 1.02 }}
                                      transition={{ duration: 0.2 }}
                                      className={`bg-white rounded-lg p-4 border-2 border-gray-200 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing group ${
                                        snapshot.isDragging ? 'shadow-2xl ring-4 ring-secondary/50 rotate-1 scale-105' : ''
                                      } ${overdueStatus ? 'border-red-400 bg-red-50' : ''}`}
                                      style={{
                                        ...provided.draggableProps.style,
                                        opacity: snapshot.isDragging ? 0.9 : 1
                                      }}
                                    >
                                      {/* SLA Indicator */}
                                      <div className="flex items-center justify-between mb-3">
                                        <div className={`px-2 py-1 rounded text-xs font-bold text-white ${slaColor}`}>
                                          {daysOpen} {daysOpen === 1 ? 'dia' : 'dias'} aberta
                                        </div>
                                        {overdueStatus && (
                                          <Badge className="bg-red-600 text-white text-xs">
                                            ATRASADA
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Task Title */}
                                      <h4 className="font-heading text-sm font-bold text-foreground mb-2 line-clamp-2">
                                        {tarefa.titulo || tarefa.description}
                                      </h4>

                                      {/* Task Description */}
                                      {tarefa.description && tarefa.titulo && (
                                        <p className="text-xs text-foreground/70 mb-3 line-clamp-2">
                                          {tarefa.description}
                                        </p>
                                      )}

                                      {/* Process Info */}
                                      <div className="mb-3 pb-3 border-b border-gray-200">
                                        <div className="flex items-center gap-1 text-xs text-foreground/60">
                                          <FileText className="w-3 h-3" />
                                          <span className="font-semibold">{getAtendimentoName(tarefa.atendimentoRef)}</span>
                                        </div>
                                      </div>

                                      {/* Responsible */}
                                      <div className="mb-3">
                                        <div className="flex items-center gap-1 text-xs">
                                          <User className="w-3 h-3 text-foreground/60" />
                                          <span className="font-semibold text-foreground/80">
                                            {getResponsibleName(tarefa)}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Due Date */}
                                      {tarefa.dueDate && (
                                        <div className="mb-3">
                                          <div className={`flex items-center gap-1 text-xs ${overdueStatus ? 'text-red-600 font-bold' : 'text-foreground/60'}`}>
                                            <Calendar className="w-3 h-3" />
                                            <span>Prazo: {format(new Date(tarefa.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                          </div>
                                        </div>
                                      )}

                                      {/* Action Buttons */}
                                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                                        {column.id === 'todo' && (
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleIniciar(tarefa._id);
                                            }}
                                            className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                          >
                                            <Play className="w-3 h-3 mr-1" />
                                            Iniciar
                                          </Button>
                                        )}
                                        {(column.id === 'todo' || column.id === 'in-progress') && (
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleConcluir(tarefa._id);
                                            }}
                                            className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
                                          >
                                            <CheckSquare className="w-3 h-3 mr-1" />
                                            Concluir
                                          </Button>
                                        )}
                                        {column.id === 'done' && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleReabrir(tarefa._id);
                                            }}
                                            className="flex-1 h-8 text-xs"
                                          >
                                            <RotateCcw className="w-3 h-3 mr-1" />
                                            Reabrir
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(tarefa);
                                          }}
                                          className="h-8 w-8 p-0"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                        {tarefa.atendimentoRef && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigate(`/admin/financiamento/${tarefa.atendimentoRef}`);
                                            }}
                                            className="h-8 w-8 p-0"
                                            title="Abrir processo"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                          </Button>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>

                          {/* Empty State */}
                          {columnTasks.length === 0 && (
                            <div className="text-center py-12 text-foreground/40">
                              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">Nenhuma tarefa</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </motion.div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      </section>

      <Footer />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-secondary">
              {editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="font-paragraph text-sm mb-2 block font-semibold">Processo de Financiamento *</Label>
              <Select 
                value={formData.atendimentoRef} 
                onValueChange={(value) => setFormData({ ...formData, atendimentoRef: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o processo vinculado" />
                </SelectTrigger>
                <SelectContent>
                  {atendimentos.map((atendimento) => (
                    <SelectItem key={atendimento._id} value={atendimento._id}>
                      {atendimento.contactName || `Processo ${atendimento._id.substring(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="font-paragraph text-sm mb-2 block font-semibold">Título da Tarefa *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Enviar documentos para análise"
                className="h-11"
              />
            </div>

            <div>
              <Label className="font-paragraph text-sm mb-2 block font-semibold">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva os detalhes da tarefa..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-paragraph text-sm mb-2 block font-semibold">Tipo de Responsável *</Label>
                <Select 
                  value={formData.responsibleType} 
                  onValueChange={(value) => setFormData({ ...formData, responsibleType: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Interno">Interno (R Sales)</SelectItem>
                    <SelectItem value="Externo">Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-paragraph text-sm mb-2 block font-semibold">Prazo</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            {formData.responsibleType === 'Interno' ? (
              <div>
                <Label className="font-paragraph text-sm mb-2 block font-semibold">Responsável (R Sales) *</Label>
                <Select 
                  value={formData.responsavelExternoRef} 
                  onValueChange={(value) => setFormData({ ...formData, responsavelExternoRef: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione um membro da equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="catarina">Catarina</SelectItem>
                    <SelectItem value="rafael">Rafael</SelectItem>
                    <SelectItem value="gabriela">Gabriela</SelectItem>
                    <SelectItem value="isabela">Isabela</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-paragraph text-sm mb-2 block font-semibold">Nome do Responsável Externo</Label>
                  <Input
                    value={formData.externalResponsibleName}
                    onChange={(e) => setFormData({ ...formData, externalResponsibleName: e.target.value })}
                    placeholder="Nome completo"
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="font-paragraph text-sm mb-2 block font-semibold">Contato</Label>
                  <Input
                    value={formData.externalResponsibleContact}
                    onChange={(e) => setFormData({ ...formData, externalResponsibleContact: e.target.value })}
                    placeholder="Telefone ou email"
                    className="h-11"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border-gray">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-11 px-6"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-11 px-6 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingTarefa ? 'Salvar Alterações' : 'Criar Tarefa'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
