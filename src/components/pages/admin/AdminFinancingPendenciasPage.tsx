import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  Clock,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  User,
  FileText,
  RotateCcw,
  CheckSquare
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
import { PendnciasdoFinanciamento, ServiceRecords, HistricodeInteraes } from '@/entities';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminFinancingPendenciasPage() {
  console.log('[AdminFinancingPendenciasPage] Component mounted');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendencias, setPendencias] = useState<PendnciasdoFinanciamento[]>([]);
  const [filteredPendencias, setFilteredPendencias] = useState<PendnciasdoFinanciamento[]>([]);
  const [atendimentos, setAtendimentos] = useState<ServiceRecords[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPendencia, setEditingPendencia] = useState<PendnciasdoFinanciamento | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Pendente',
    priority: 'Média',
    atendimentoRef: '',
    tipo: 'Documento',
    categoria: 'Proponente',
    responsiblePartyType: 'Cliente',
    responsiblePartyDetails: '',
    dueDate: '',
    bloqueiaFase: false
  });

  useEffect(() => {
    console.log('[AdminFinancingPendenciasPage] useEffect triggered - loading data');
    loadData();
  }, []);

  useEffect(() => {
    filterPendencias();
  }, [pendencias, searchTerm, statusFilter, priorityFilter]);

  const loadData = async () => {
    console.log('[AdminFinancingPendenciasPage] loadData() called');
    setIsLoading(true);
    
    const [pendenciasResult, atendimentosResult] = await Promise.all([
      BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasfinanciamento'),
      BaseCrudService.getAll<ServiceRecords>('atendimentos')
    ]);

    console.log('[AdminFinancingPendenciasPage] Data loaded:', {
      pendenciasCount: pendenciasResult.items.length,
      atendimentosCount: atendimentosResult.items.length
    });

    setPendencias(pendenciasResult.items);
    setAtendimentos(atendimentosResult.items);
    setIsLoading(false);
  };

  const filterPendencias = () => {
    let filtered = [...pendencias];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(p => p.priority === priorityFilter);
    }

    setFilteredPendencias(filtered);
  };

  const handleCreate = () => {
    console.log('[AdminFinancingPendenciasPage] handleCreate() - Opening dialog');
    setEditingPendencia(null);
    setFormData({
      title: '',
      description: '',
      status: 'Pendente',
      priority: 'Média',
      atendimentoRef: '',
      tipo: 'Documento',
      categoria: 'Proponente',
      responsiblePartyType: 'Cliente',
      responsiblePartyDetails: '',
      dueDate: '',
      bloqueiaFase: false
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (pendencia: PendnciasdoFinanciamento) => {
    console.log('[AdminFinancingPendenciasPage] handleEdit() - Editing:', pendencia._id);
    setEditingPendencia(pendencia);
    setFormData({
      title: pendencia.title || '',
      description: pendencia.description || '',
      status: pendencia.status || 'Pendente',
      priority: pendencia.priority || 'Média',
      atendimentoRef: pendencia.atendimentoRef || '',
      tipo: pendencia.tipo || 'Documento',
      categoria: pendencia.categoria || 'Proponente',
      responsiblePartyType: pendencia.responsiblePartyType || 'Cliente',
      responsiblePartyDetails: pendencia.responsiblePartyDetails || '',
      dueDate: pendencia.dueDate ? format(new Date(pendencia.dueDate), 'yyyy-MM-dd') : '',
      bloqueiaFase: pendencia.bloqueiaFase || false
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    console.log('[AdminFinancingPendenciasPage] handleDelete() - Deleting:', id);
    if (!confirm('Tem certeza que deseja excluir esta pendência?')) return;

    setPendencias(prev => prev.filter(p => p._id !== id));
    
    await BaseCrudService.delete('pendenciasfinanciamento', id);
    console.log('[AdminFinancingPendenciasPage] Pendência deleted successfully');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AdminFinancingPendenciasPage] handleSubmit() - Form data:', formData);

    const pendenciaData: Partial<PendnciasdoFinanciamento> = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      atendimentoRef: formData.atendimentoRef,
      tipo: formData.tipo,
      categoria: formData.categoria,
      responsiblePartyType: formData.responsiblePartyType,
      responsiblePartyDetails: formData.responsiblePartyDetails,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      bloqueiaFase: formData.bloqueiaFase,
      creationDate: editingPendencia ? undefined : new Date().toISOString()
    };

    if (editingPendencia) {
      console.log('[AdminFinancingPendenciasPage] Updating pendência:', editingPendencia._id);
      setPendencias(prev => prev.map(p => 
        p._id === editingPendencia._id ? { ...p, ...pendenciaData } : p
      ));
      
      await BaseCrudService.update('pendenciasfinanciamento', {
        _id: editingPendencia._id,
        ...pendenciaData
      });
    } else {
      console.log('[AdminFinancingPendenciasPage] Creating new pendência');
      const newPendencia = {
        _id: crypto.randomUUID(),
        ...pendenciaData
      } as PendnciasdoFinanciamento;

      setPendencias(prev => [newPendencia, ...prev]);
      
      await BaseCrudService.create('pendenciasfinanciamento', newPendencia);
    }

    setIsDialogOpen(false);
    console.log('[AdminFinancingPendenciasPage] Operation completed successfully');
  };

  const getStatusBadge = (status?: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'Pendente': { variant: 'destructive', label: 'Pendente' },
      'Em Andamento': { variant: 'secondary', label: 'Em Andamento' },
      'Resolvida': { variant: 'default', label: 'Resolvida' }
    };
    const config = variants[status || 'Pendente'] || variants['Pendente'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority?: string) => {
    const colors: Record<string, string> = {
      'Alta': 'bg-red-100 text-red-800',
      'Média': 'bg-yellow-100 text-yellow-800',
      'Baixa': 'bg-green-100 text-green-800'
    };
    return (
      <Badge className={colors[priority || 'Média'] || colors['Média']}>
        {priority || 'Média'}
      </Badge>
    );
  };

  const isOverdue = (dueDate?: Date | string, status?: string) => {
    if (!dueDate || status === 'Concluída') return false;
    return new Date(dueDate) < new Date();
  };

  const handleUpdateStatus = async (pendenciaId: string, newStatus: string) => {
    const pendencia = pendencias.find(p => p._id === pendenciaId);
    if (!pendencia) return;

    // Optimistic update
    setPendencias(prev => prev.map(p => p._id === pendenciaId ? { 
      ...p, 
      status: newStatus,
      resolvedDate: newStatus === 'Concluída' ? new Date().toISOString() : undefined
    } : p));

    try {
      await BaseCrudService.update<PendnciasdoFinanciamento>('pendenciasfinanciamento', {
        _id: pendenciaId,
        status: newStatus,
        resolvedDate: newStatus === 'Concluída' ? new Date().toISOString() : undefined
      });

      // Create history entry
      if (pendencia.atendimentoRef) {
        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef: pendencia.atendimentoRef,
          tipoEvento: 'Pendencia_Atualizada',
          interactionType: 'Mudança de status',
          interactionDescription: `Pendência "${pendencia.title}" alterada para: ${newStatus}`,
          interactionDate: new Date().toISOString(),
          autorTipo: 'Sistema'
        });
      }

      toast({
        title: "Pendência atualizada",
        description: `Status alterado para: ${newStatus}`,
      });

      await loadData();
    } catch (error) {
      console.error('Error updating pending status:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a pendência",
        variant: "destructive"
      });
      await loadData(); // Revert on failure
    }
  };
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
                Pendências do Financiamento
              </h1>
              <p className="font-paragraph text-lg text-dark-gray">
                Gerencie todas as pendências dos processos de financiamento
              </p>
            </div>
            <Button
              onClick={handleCreate}
              className="bg-buttonbackground hover:bg-buttonbackground/90 text-white font-paragraph"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Pendência
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
                      placeholder="Buscar pendências..."
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
                      <SelectItem value="Resolvida">Resolvida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-paragraph mb-2">Prioridade</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="font-paragraph">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPriorityFilter('all');
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
                <div className="text-3xl font-bold font-heading">{pendencias.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-paragraph text-dark-gray">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading text-red-600">
                  {pendencias.filter(p => p.status === 'Pendente').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-paragraph text-dark-gray">Em Andamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading text-yellow-600">
                  {pendencias.filter(p => p.status === 'Em Andamento').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-paragraph text-dark-gray">Atrasadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading text-orange-600">
                  {pendencias.filter(p => p.status !== 'Resolvida' && isOverdue(p.dueDate)).length}
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
              ) : filteredPendencias.length === 0 ? (
                <div className="p-12 text-center text-dark-gray font-paragraph">
                  Nenhuma pendência encontrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-paragraph">Título</TableHead>
                      <TableHead className="font-paragraph">Status</TableHead>
                      <TableHead className="font-paragraph">Prioridade</TableHead>
                      <TableHead className="font-paragraph">Tipo</TableHead>
                      <TableHead className="font-paragraph">Prazo</TableHead>
                      <TableHead className="font-paragraph">Responsável</TableHead>
                      <TableHead className="font-paragraph text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendencias.map((pendencia) => {
                      const overdueStatus = isOverdue(pendencia.dueDate, pendencia.status);
                      
                      return (
                        <TableRow key={pendencia._id} className={overdueStatus ? 'bg-red-50' : ''}>
                          <TableCell className="font-paragraph font-medium">
                            <div>
                              <div className={`flex items-center gap-2 ${overdueStatus ? 'text-red-700 font-bold' : ''}`}>
                                {pendencia.title}
                                {pendencia.bloqueiaFase && (
                                  <Badge variant="destructive" className="text-xs">Bloqueante</Badge>
                                )}
                                {overdueStatus && (
                                  <Badge className="text-xs bg-red-600 text-white">⚠️ ATRASADA</Badge>
                                )}
                              </div>
                              {pendencia.description && (
                                <div className="text-sm text-dark-gray mt-1 line-clamp-1">
                                  {pendencia.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(pendencia.status)}</TableCell>
                          <TableCell>{getPriorityBadge(pendencia.priority)}</TableCell>
                          <TableCell className="font-paragraph">{pendencia.tipo}</TableCell>
                          <TableCell className="font-paragraph">
                            {pendencia.dueDate ? (
                              <div className={overdueStatus ? 'text-red-600 font-semibold' : ''}>
                                {format(new Date(pendencia.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                                {overdueStatus && (
                                  <div className="text-xs">Atrasada</div>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="font-paragraph">
                            {pendencia.responsiblePartyDetails || pendencia.responsiblePartyType || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {pendencia.status !== 'Concluída' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(pendencia._id, 'Concluída')}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckSquare className="w-4 h-4 mr-1" />
                                  Concluir
                                </Button>
                              )}
                              {pendencia.status === 'Concluída' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(pendencia._id, 'Pendente')}
                                >
                                  <RotateCcw className="w-4 h-4 mr-1" />
                                  Reabrir
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(pendencia)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(pendencia._id)}
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
              {editingPendencia ? 'Editar Pendência' : 'Nova Pendência'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="font-paragraph">Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    <SelectItem value="Resolvida">Resolvida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-paragraph">Prioridade *</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger className="font-paragraph">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-paragraph">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger className="font-paragraph">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Documento">Documento</SelectItem>
                    <SelectItem value="Informação">Informação</SelectItem>
                    <SelectItem value="Aprovação">Aprovação</SelectItem>
                    <SelectItem value="Correção">Correção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-paragraph">Categoria</Label>
                <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                  <SelectTrigger className="font-paragraph">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Proponente">Proponente</SelectItem>
                    <SelectItem value="Vendedor">Vendedor</SelectItem>
                    <SelectItem value="Imóvel">Imóvel</SelectItem>
                    <SelectItem value="Banco">Banco</SelectItem>
                    <SelectItem value="Documentação">Documentação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                <Label className="font-paragraph">Tipo de Responsável</Label>
                <Select value={formData.responsiblePartyType} onValueChange={(value) => setFormData({ ...formData, responsiblePartyType: value })}>
                  <SelectTrigger className="font-paragraph">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cliente">Cliente</SelectItem>
                    <SelectItem value="Vendedor">Vendedor</SelectItem>
                    <SelectItem value="Banco">Banco</SelectItem>
                    <SelectItem value="Interno">Interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-paragraph">Detalhes do Responsável</Label>
                <Input
                  value={formData.responsiblePartyDetails}
                  onChange={(e) => setFormData({ ...formData, responsiblePartyDetails: e.target.value })}
                  placeholder="Nome ou identificação"
                  className="font-paragraph"
                />
              </div>
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="bloqueiaFase"
                checked={formData.bloqueiaFase}
                onChange={(e) => setFormData({ ...formData, bloqueiaFase: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="bloqueiaFase" className="font-paragraph cursor-pointer">
                Esta pendência bloqueia a progressão de fase
              </Label>
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
                {editingPendencia ? 'Salvar Alterações' : 'Criar Pendência'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
