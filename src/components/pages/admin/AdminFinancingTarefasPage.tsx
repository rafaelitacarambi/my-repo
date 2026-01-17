import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Plus, 
  Edit2, 
  Trash2, 
  Clock,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  User,
  FileText,
  CheckCircle,
  RotateCcw,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FinancingNavigation from '@/components/FinancingNavigation';
import { BaseCrudService } from '@/integrations';
import { FinancingTasks, ServiceRecords, UsuriosdoSistema, HistricodeInteraes } from '@/entities';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminFinancingTarefasPage() {
  console.log('[AdminFinancingTarefasPage] Component mounted');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tarefas, setTarefas] = useState<FinancingTasks[]>([]);
  const [filteredTarefas, setFilteredTarefas] = useState<FinancingTasks[]>([]);
  const [atendimentos, setAtendimentos] = useState<ServiceRecords[]>([]);
  const [usuarios, setUsuarios] = useState<UsuriosdoSistema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<FinancingTasks | null>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    description: '',
    status: 'Aberta',
    atendimentoRef: '',
    pendenciaRef: '',
    responsibleType: 'Interno',
    internalResponsibleId: '',
    externalResponsibleName: '',
    externalResponsibleContact: '',
    canalNotificacao: 'WhatsApp',
    dueDate: '',
    responsavelExternoRef: ''
  });

  useEffect(() => {
    console.log('[AdminFinancingTarefasPage] useEffect triggered - loading data');
    loadData();
  }, []);

  useEffect(() => {
    filterTarefas();
  }, [tarefas, searchTerm, statusFilter, responsibleFilter]);

  const loadData = async () => {
    console.log('[AdminFinancingTarefasPage] loadData() called');
    setIsLoading(true);
    
    const [tarefasResult, atendimentosResult, usuariosResult] = await Promise.all([
      BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento'),
      BaseCrudService.getAll<ServiceRecords>('atendimentos'),
      BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema')
    ]);

    console.log('[AdminFinancingTarefasPage] Data loaded:', {
      tarefasCount: tarefasResult.items.length,
      atendimentosCount: atendimentosResult.items.length,
      usuariosCount: usuariosResult.items.length
    });

    setTarefas(tarefasResult.items);
    setAtendimentos(atendimentosResult.items);
    setUsuarios(usuariosResult.items.filter(u => u.ativo));
    setIsLoading(false);
  };

  const filterTarefas = () => {
    let filtered = [...tarefas];

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (responsibleFilter !== 'all') {
      filtered = filtered.filter(t => t.responsibleType === responsibleFilter);
    }

    setFilteredTarefas(filtered);
  };

  const handleCreate = () => {
    console.log('[AdminFinancingTarefasPage] handleCreate() - Opening dialog');
    setEditingTarefa(null);
    setFormData({
      titulo: '',
      description: '',
      status: 'Aberta',
      atendimentoRef: '',
      pendenciaRef: '',
      responsibleType: 'Interno',
      internalResponsibleId: '',
      externalResponsibleName: '',
      externalResponsibleContact: '',
      canalNotificacao: 'WhatsApp',
      dueDate: '',
      responsavelExternoRef: ''
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (tarefa: FinancingTasks) => {
    console.log('[AdminFinancingTarefasPage] handleEdit() - Editing:', tarefa._id);
    setEditingTarefa(tarefa);
    setFormData({
      titulo: tarefa.titulo || '',
      description: tarefa.description || '',
      status: tarefa.status || 'Aberta',
      atendimentoRef: tarefa.atendimentoRef || '',
      pendenciaRef: tarefa.pendenciaRef || '',
      responsibleType: tarefa.responsibleType || 'Interno',
      internalResponsibleId: tarefa.internalResponsibleId || '',
      externalResponsibleName: tarefa.externalResponsibleName || '',
      externalResponsibleContact: tarefa.externalResponsibleContact || '',
      canalNotificacao: tarefa.canalNotificacao || 'WhatsApp',
      dueDate: tarefa.dueDate ? format(new Date(tarefa.dueDate), 'yyyy-MM-dd') : '',
      responsavelExternoRef: tarefa.responsavelExternoRef || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    console.log('[AdminFinancingTarefasPage] handleDelete() - Deleting:', id);
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    setTarefas(prev => prev.filter(t => t._id !== id));
    
    await BaseCrudService.delete('tarefasfinanciamento', id);
    console.log('[AdminFinancingTarefasPage] Tarefa deleted successfully');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AdminFinancingTarefasPage] handleSubmit() - Form data:', formData);

    const tarefaData: Partial<FinancingTasks> = {
      titulo: formData.titulo,
      description: formData.description,
      status: formData.status,
      atendimentoRef: formData.atendimentoRef,
      pendenciaRef: formData.pendenciaRef,
      responsibleType: formData.responsibleType,
      internalResponsibleId: formData.internalResponsibleId,
      externalResponsibleName: formData.externalResponsibleName,
      externalResponsibleContact: formData.externalResponsibleContact,
      canalNotificacao: formData.canalNotificacao,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      creationDate: editingTarefa ? undefined : new Date().toISOString(),
      responsavelExternoRef: formData.responsavelExternoRef
    };

    if (editingTarefa) {
      console.log('[AdminFinancingTarefasPage] Updating tarefa:', editingTarefa._id);
      setTarefas(prev => prev.map(t => 
        t._id === editingTarefa._id ? { ...t, ...tarefaData } : t
      ));
      
      await BaseCrudService.update('tarefasfinanciamento', {
        _id: editingTarefa._id,
        ...tarefaData
      });
    } else {
      console.log('[AdminFinancingTarefasPage] Creating new tarefa');
      const newTarefa = {
        _id: crypto.randomUUID(),
        ...tarefaData
      } as FinancingTasks;

      setTarefas(prev => [newTarefa, ...prev]);
      
      await BaseCrudService.create('tarefasfinanciamento', newTarefa);
    }

    setIsDialogOpen(false);
    console.log('[AdminFinancingTarefasPage] Operation completed successfully');
  };

  const getStatusBadge = (status?: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'Aberta': { variant: 'destructive', label: 'Aberta' },
      'Em andamento': { variant: 'secondary', label: 'Em andamento' },
      'Concluída': { variant: 'default', label: 'Concluída' }
    };
    const config = variants[status || 'Aberta'] || variants['Aberta'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isOverdue = (dueDate?: Date | string, status?: string) => {
    if (!dueDate || status === 'Concluída') return false;
    return new Date(dueDate) < new Date();
  };

  const hasActivityToday = (creationDate?: Date | string) => {
    if (!creationDate) return false;
    return new Date(creationDate).toDateString() === new Date().toDateString();
  };

  const handleIniciar = async (tarefaId: string) => {
    const tarefa = tarefas.find(t => t._id === tarefaId);
    if (!tarefa) return;

    // Optimistic update
    setTarefas(prev => prev.map(t => t._id === tarefaId ? { ...t, status: 'Em andamento' } : t));

    try {
      await BaseCrudService.update<FinancingTasks>('tarefasfinanciamento', {
        _id: tarefaId,
        status: 'Em andamento'
      });

      // Create history entry
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
        description: `"${tarefa.titulo || tarefa.description}" está em andamento`,
      });

      await loadData();
    } catch (error) {
      console.error('Error starting task:', error);
      toast({
        title: "Erro ao iniciar",
        description: "Não foi possível iniciar a tarefa",
        variant: "destructive"
      });
      await loadData(); // Revert on failure
    }
  };

  const handleConcluir = async (tarefaId: string) => {
    const tarefa = tarefas.find(t => t._id === tarefaId);
    if (!tarefa) return;

    // Optimistic update
    setTarefas(prev => prev.map(t => t._id === tarefaId ? { ...t, status: 'Concluída' } : t));

    try {
      await BaseCrudService.update<FinancingTasks>('tarefasfinanciamento', {
        _id: tarefaId,
        status: 'Concluída'
      });

      // Create history entry
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
        description: `"${tarefa.titulo || tarefa.description}" foi finalizada`,
      });

      await loadData();
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Erro ao concluir",
        description: "Não foi possível concluir a tarefa",
        variant: "destructive"
      });
      await loadData(); // Revert on failure
    }
  };

  const handleReabrir = async (tarefaId: string) => {
    const tarefa = tarefas.find(t => t._id === tarefaId);
    if (!tarefa) return;

    // Optimistic update
    setTarefas(prev => prev.map(t => t._id === tarefaId ? { ...t, status: 'Aberta' } : t));

    try {
      await BaseCrudService.update<FinancingTasks>('tarefasfinanciamento', {
        _id: tarefaId,
        status: 'Aberta'
      });

      // Create history entry
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
        description: `"${tarefa.titulo || tarefa.description}" foi reaberta`,
      });

      await loadData();
    } catch (error) {
      console.error('Error reopening task:', error);
      toast({
        title: "Erro ao reabrir",
        description: "Não foi possível reabrir a tarefa",
        variant: "destructive"
      });
      await loadData(); // Revert on failure
    }
  };

  const getResponsibleName = (tarefa: FinancingTasks) => {
    // Priority: responsavelExternoRef (R Sales team) > internalResponsibleId (system users) > externalResponsibleName
    if (tarefa.responsavelExternoRef) {
      // Map to R Sales team members
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <FinancingNavigation />
      
      <main className="flex-1 w-full">
        <div className="max-w-[100rem] mx-auto px-6 py-12">
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-heading text-4xl font-bold text-foreground mb-3">
                Tarefas do Financiamento
              </h1>
              <p className="font-paragraph text-lg text-dark-gray">
                Gerencie todas as tarefas dos processos de financiamento
              </p>
            </div>
            <Button
              onClick={handleCreate}
              className="bg-buttonbackground hover:bg-buttonbackground/90 text-white font-paragraph"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="font-paragraph mb-2">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-gray w-4 h-4" />
                    <Input
                      placeholder="Buscar tarefas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 font-paragraph"
                    />
                  </div>
                </div>
                <div>
                  <Label className="font-paragraph mb-2">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="font-paragraph">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Aberta">Aberta</SelectItem>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-paragraph mb-2">Responsável</Label>
                  <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                    <SelectTrigger className="font-paragraph">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Interno">Interno</SelectItem>
                      <SelectItem value="Externo">Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setResponsibleFilter('all');
                    }}
                    className="w-full font-paragraph"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-paragraph text-dark-gray">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading">{tarefas.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-paragraph text-dark-gray">Abertas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading text-red-600">
                  {tarefas.filter(t => t.status === 'Aberta').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-paragraph text-dark-gray">Em Andamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading text-yellow-600">
                  {tarefas.filter(t => t.status === 'Em andamento').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-paragraph text-dark-gray">Atrasadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading text-orange-600">
                  {tarefas.filter(t => t.status !== 'Concluída' && isOverdue(t.dueDate)).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-buttonbackground"></div>
                </div>
              ) : filteredTarefas.length === 0 ? (
                <div className="p-12 text-center text-dark-gray font-paragraph">
                  Nenhuma tarefa encontrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-paragraph">Título</TableHead>
                      <TableHead className="font-paragraph">Status</TableHead>
                      <TableHead className="font-paragraph">Responsável</TableHead>
                      <TableHead className="font-paragraph">Tipo</TableHead>
                      <TableHead className="font-paragraph">Prazo</TableHead>
                      <TableHead className="font-paragraph">Canal</TableHead>
                      <TableHead className="font-paragraph text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTarefas.map((tarefa) => {
                      const overdueStatus = isOverdue(tarefa.dueDate, tarefa.status);
                      const todayActivity = hasActivityToday(tarefa.creationDate);
                      
                      return (
                        <TableRow key={tarefa._id} className={
                          overdueStatus ? 'bg-red-50' : todayActivity ? 'bg-green-50' : ''
                        }>
                          <TableCell className="font-paragraph font-medium">
                            <div>
                              <div className={overdueStatus ? 'text-red-700 font-bold' : ''}>
                                {tarefa.titulo}
                                {overdueStatus && (
                                  <Badge className="ml-2 text-xs bg-red-600 text-white">⚠️ ATRASADA</Badge>
                                )}
                                {todayActivity && (
                                  <Badge className="ml-2 text-xs bg-green-600 text-white">✓ HOJE</Badge>
                                )}
                              </div>
                              {tarefa.description && (
                                <div className="text-sm text-dark-gray mt-1 line-clamp-1">
                                  {tarefa.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(tarefa.status)}</TableCell>
                          <TableCell className="font-paragraph">
                            <div>
                              <div className="font-semibold">{getResponsibleName(tarefa)}</div>
                              <div className="text-xs text-dark-gray">
                                {tarefa.responsavelExternoRef ? 'R Sales' : tarefa.responsibleType === 'Interno' ? 'Interno' : 'Externo'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-paragraph">
                            {tarefa.responsibleType || '-'}
                          </TableCell>
                          <TableCell className="font-paragraph">
                            {tarefa.dueDate ? (
                              <div className={overdueStatus ? 'text-red-600 font-semibold' : ''}>
                                {format(new Date(tarefa.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                                {overdueStatus && (
                                  <div className="text-xs">Atrasada</div>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="font-paragraph">
                            {tarefa.canalNotificacao || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {tarefa.status === 'Aberta' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleIniciar(tarefa._id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Iniciar
                                </Button>
                              )}
                              {(tarefa.status === 'Aberta' || tarefa.status === 'Em andamento') && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleConcluir(tarefa._id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckSquare className="w-4 h-4 mr-1" />
                                  Concluir
                                </Button>
                              )}
                              {tarefa.status === 'Concluída' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReabrir(tarefa._id)}
                                >
                                  <RotateCcw className="w-4 h-4 mr-1" />
                                  Reabrir
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(tarefa)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(tarefa._id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="font-paragraph">Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                className="font-paragraph"
              />
            </div>

            <div>
              <Label className="font-paragraph">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="font-paragraph"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-paragraph">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="font-paragraph">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aberta">Aberta</SelectItem>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-paragraph">Tipo de Responsável *</Label>
                <Select value={formData.responsibleType} onValueChange={(value) => setFormData({ ...formData, responsibleType: value })}>
                  <SelectTrigger className="font-paragraph">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Interno">Interno</SelectItem>
                    <SelectItem value="Externo">Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.responsibleType === 'Interno' ? (
              <div>
                <Label className="font-paragraph">Responsável Interno (R Sales) *</Label>
                <Select value={formData.responsavelExternoRef} onValueChange={(value) => setFormData({ ...formData, responsavelExternoRef: value })}>
                  <SelectTrigger className="font-paragraph">
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="catarina">Catarina</SelectItem>
                    <SelectItem value="rafael">Rafael</SelectItem>
                    <SelectItem value="gabriela">Gabriela</SelectItem>
                    <SelectItem value="isabela">Isabela</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-dark-gray mt-1">
                  Selecione o membro da equipe R Sales responsável por esta tarefa
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-paragraph">Nome do Responsável Externo</Label>
                  <Input
                    value={formData.externalResponsibleName}
                    onChange={(e) => setFormData({ ...formData, externalResponsibleName: e.target.value })}
                    placeholder="Nome completo"
                    className="font-paragraph"
                  />
                </div>
                <div>
                  <Label className="font-paragraph">Contato</Label>
                  <Input
                    value={formData.externalResponsibleContact}
                    onChange={(e) => setFormData({ ...formData, externalResponsibleContact: e.target.value })}
                    placeholder="Telefone ou email"
                    className="font-paragraph"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="font-paragraph">Atendimento</Label>
              <Select value={formData.atendimentoRef} onValueChange={(value) => setFormData({ ...formData, atendimentoRef: value })}>
                <SelectTrigger className="font-paragraph">
                  <SelectValue placeholder="Selecione um atendimento" />
                </SelectTrigger>
                <SelectContent>
                  {atendimentos.map((atendimento) => (
                    <SelectItem key={atendimento._id} value={atendimento._id}>
                      {atendimento.contactName || atendimento._id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-paragraph">Canal de Notificação</Label>
                <Select value={formData.canalNotificacao} onValueChange={(value) => setFormData({ ...formData, canalNotificacao: value })}>
                  <SelectTrigger className="font-paragraph">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Telefone">Telefone</SelectItem>
                    <SelectItem value="Sistema">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-paragraph">Prazo</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="font-paragraph"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="font-paragraph"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-buttonbackground hover:bg-buttonbackground/90 text-white font-paragraph"
              >
                {editingTarefa ? 'Salvar Alterações' : 'Criar Tarefa'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
