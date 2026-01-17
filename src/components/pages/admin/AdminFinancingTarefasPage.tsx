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
  CheckCircle
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
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { FinancingTasks, ServiceRecords, UsuriosdoSistema } from '@/entities';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminFinancingTarefasPage() {
  console.log('[AdminFinancingTarefasPage] Component mounted');
  
  const navigate = useNavigate();
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
    status: 'Pendente',
    atendimentoRef: '',
    pendenciaRef: '',
    responsibleType: 'Interno',
    internalResponsibleId: '',
    externalResponsibleName: '',
    externalResponsibleContact: '',
    canalNotificacao: 'WhatsApp',
    dueDate: ''
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
      status: 'Pendente',
      atendimentoRef: '',
      pendenciaRef: '',
      responsibleType: 'Interno',
      internalResponsibleId: '',
      externalResponsibleName: '',
      externalResponsibleContact: '',
      canalNotificacao: 'WhatsApp',
      dueDate: ''
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (tarefa: FinancingTasks) => {
    console.log('[AdminFinancingTarefasPage] handleEdit() - Editing:', tarefa._id);
    setEditingTarefa(tarefa);
    setFormData({
      titulo: tarefa.titulo || '',
      description: tarefa.description || '',
      status: tarefa.status || 'Pendente',
      atendimentoRef: tarefa.atendimentoRef || '',
      pendenciaRef: tarefa.pendenciaRef || '',
      responsibleType: tarefa.responsibleType || 'Interno',
      internalResponsibleId: tarefa.internalResponsibleId || '',
      externalResponsibleName: tarefa.externalResponsibleName || '',
      externalResponsibleContact: tarefa.externalResponsibleContact || '',
      canalNotificacao: tarefa.canalNotificacao || 'WhatsApp',
      dueDate: tarefa.dueDate ? format(new Date(tarefa.dueDate), 'yyyy-MM-dd') : ''
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
      creationDate: editingTarefa ? undefined : new Date().toISOString()
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
      'Pendente': { variant: 'destructive', label: 'Pendente' },
      'Em Andamento': { variant: 'secondary', label: 'Em Andamento' },
      'Concluída': { variant: 'default', label: 'Concluída' }
    };
    const config = variants[status || 'Pendente'] || variants['Pendente'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isOverdue = (dueDate?: Date | string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getResponsibleName = (tarefa: FinancingTasks) => {
    if (tarefa.responsibleType === 'Interno' && tarefa.internalResponsibleId) {
      const usuario = usuarios.find(u => u._id === tarefa.internalResponsibleId);
      return usuario?.name || 'Usuário não encontrado';
    }
    return tarefa.externalResponsibleName || 'Não atribuído';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 w-full">
        <div className="max-w-[100rem] mx-auto px-6 py-12">
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => {
                  console.log('[AdminFinancingTarefasPage] Navigating back to /admin/financiamento');
                  navigate('/admin/financiamento');
                }}
                className="mb-4 font-paragraph"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Hub
              </Button>
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
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
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
                <CardTitle className="text-sm font-paragraph text-dark-gray">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading text-red-600">
                  {tarefas.filter(t => t.status === 'Pendente').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-paragraph text-dark-gray">Em Andamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading text-yellow-600">
                  {tarefas.filter(t => t.status === 'Em Andamento').length}
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
                    {filteredTarefas.map((tarefa) => (
                      <TableRow key={tarefa._id}>
                        <TableCell className="font-paragraph font-medium">
                          <div>
                            <div>{tarefa.titulo}</div>
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
                            <div>{getResponsibleName(tarefa)}</div>
                            <div className="text-xs text-dark-gray">
                              {tarefa.responsibleType === 'Interno' ? 'Interno' : 'Externo'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-paragraph">
                          {tarefa.responsibleType || '-'}
                        </TableCell>
                        <TableCell className="font-paragraph">
                          {tarefa.dueDate ? (
                            <div className={isOverdue(tarefa.dueDate) && tarefa.status !== 'Concluída' ? 'text-red-600 font-semibold' : ''}>
                              {format(new Date(tarefa.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                              {isOverdue(tarefa.dueDate) && tarefa.status !== 'Concluída' && (
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
                    ))}
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
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
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
                <Label className="font-paragraph">Responsável Interno</Label>
                <Select value={formData.internalResponsibleId} onValueChange={(value) => setFormData({ ...formData, internalResponsibleId: value })}>
                  <SelectTrigger className="font-paragraph">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario._id} value={usuario._id}>
                        {usuario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
