// src/components/admin/tasks/GeneralPendenciasPanel.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  User,
  FileText,
  RotateCcw,
  CheckSquare,
  Eye,
  Settings,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, Clients, ServiceParties, HistricodeInteraes } from '@/entities';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GeneralPendenciasPanelProps {
  serviceType: 'locacoes' | 'vendas' | 'leilao';
  title: string;
  kanbanRoute: string;
  collection: string;
  serviceFilter: (record: ServiceRecords) => boolean;
  navigationComponent: React.ReactNode;
}

export const GeneralPendenciasPanel: React.FC<GeneralPendenciasPanelProps> = ({
  serviceType,
  title,
  kanbanRoute,
  collection,
  serviceFilter,
  navigationComponent
}) => {
  const navigate = useNavigate();
  const [pendencias, setPendencias] = useState<any[]>([]);
  const [filteredPendencias, setFilteredPendencias] = useState<any[]>([]);
  const [atendimentos, setAtendimentos] = useState<ServiceRecords[]>([]);
  const [clientes, setClientes] = useState<Clients[]>([]);
  const [serviceParties, setServiceParties] = useState<ServiceParties[]>([]);
  const [usuarios, setUsuarios] = useState<UsuriosdoSistema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<string>('all');
  const [prazoFilter, setPrazoFilter] = useState<string>('all');
  
  // Modal toggles
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPendencia, setEditingPendencia] = useState<any | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Column preferences
  const loadColumnPreferences = () => {
    const saved = localStorage.getItem(`pendenciasColumnPreferences_${serviceType}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading column preferences:', e);
      }
    }
    return {
      prazo: true,
      prioridade: true,
      responsavel: true,
      cpfProponente: false,
      bloqueante: true
    };
  };

  const [visibleColumns, setVisibleColumns] = useState(loadColumnPreferences());

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Pendente',
    priority: 'Média',
    atendimentoRef: '',
    responsiblePartyType: 'Cliente',
    responsiblePartyDetails: '',
    dueDate: '',
    bloqueiaFase: false
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPendencias();
  }, [pendencias, searchTerm, statusFilter, priorityFilter, responsavelFilter, prazoFilter]);

  useEffect(() => {
    localStorage.setItem(`pendenciasColumnPreferences_${serviceType}`, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pendenciasResult, atendimentosResult, clientesResult, partiesResult, usuariosResult] = await Promise.all([
        BaseCrudService.getAll<any>(collection),
        BaseCrudService.getAll<ServiceRecords>('atendimentos'),
        BaseCrudService.getAll<Clients>('clientes'),
        BaseCrudService.getAll<ServiceParties>('atendimentopartes'),
        BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema')
      ]);

      setPendencias(pendenciasResult.items);
      setAtendimentos(atendimentosResult.items.filter(serviceFilter));
      setClientes(clientesResult.items);
      setServiceParties(partiesResult.items);
      setUsuarios(usuariosResult.items);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const team = usuarios.filter(u => u.ativo !== false);

  const filterPendencias = () => {
    let filtered = [...pendencias];

    // Filter only active pendencias (not completed/resolved)
    filtered = filtered.filter(p => p.status !== 'Concluída' && p.status !== 'Resolvida');

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

    if (responsavelFilter !== 'all') {
      filtered = filtered.filter(p => {
        const details = p.responsiblePartyDetails || '';
        const type = p.responsiblePartyType || '';
        if (responsavelFilter === 'Interno') {
          return type === 'Interno';
        }
        if (responsavelFilter === 'Cliente') {
          return type === 'Cliente';
        }
        return (
          details.toLowerCase().includes(responsavelFilter.toLowerCase()) ||
          type.toLowerCase().includes(responsavelFilter.toLowerCase())
        );
      });
    }

    if (prazoFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(p => {
        if (!p.dueDate) return prazoFilter === 'sem-prazo';

        const dueDate = new Date(p.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        switch (prazoFilter) {
          case 'atrasado':
            return dueDate < today;
          case 'hoje':
            return dueDate.getTime() === today.getTime();
          case 'proximos-7-dias':
            const next7Days = new Date(today);
            next7Days.setDate(today.getDate() + 7);
            return dueDate >= today && dueDate <= next7Days;
          case 'proximos-30-dias':
            const next30Days = new Date(today);
            next30Days.setDate(today.getDate() + 30);
            return dueDate >= today && dueDate <= next30Days;
          case 'sem-prazo':
            return false;
          default:
            return true;
        }
      });
    }

    setFilteredPendencias(filtered);
  };

  const handleCreate = () => {
    setEditingPendencia(null);
    setFormData({
      title: '',
      description: '',
      status: 'Pendente',
      priority: 'Média',
      atendimentoRef: '',
      responsiblePartyType: 'Cliente',
      responsiblePartyDetails: '',
      dueDate: '',
      bloqueiaFase: false
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (pendencia: any) => {
    setEditingPendencia(pendencia);
    setFormData({
      title: pendencia.title || '',
      description: pendencia.description || '',
      status: pendencia.status || 'Pendente',
      priority: pendencia.priority || 'Média',
      atendimentoRef: pendencia.atendimentoRef || '',
      responsiblePartyType: pendencia.responsiblePartyType || 'Cliente',
      responsiblePartyDetails: pendencia.responsiblePartyDetails || '',
      dueDate: pendencia.dueDate ? format(new Date(pendencia.dueDate), 'yyyy-MM-dd') : '',
      bloqueiaFase: pendencia.bloqueiaFase || false
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pendência?')) return;
    try {
      setPendencias(prev => prev.filter(p => p._id !== id));
      await BaseCrudService.delete(collection, id);
      toast.success('Pendência excluída com sucesso');
    } catch (e) {
      toast.error('Erro ao excluir pendência');
      loadData();
    }
  };

  const handleConcluir = async (pendenciaId: string) => {
    const pendencia = pendencias.find(p => p._id === pendenciaId);
    if (!pendencia) return;

    const now = new Date().toISOString();

    // Optimistic UI update
    setPendencias(prev => prev.map(p => p._id === pendenciaId ? {
      ...p,
      status: 'Concluída',
      resolvedDate: now
    } : p));

    try {
      await BaseCrudService.update(collection, {
        _id: pendenciaId,
        status: 'Concluída',
        resolvedDate: now
      });

      if (pendencia.atendimentoRef) {
        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef: pendencia.atendimentoRef,
          tipoEvento: 'Pendencia_Concluida',
          interactionType: 'Conclusão de pendência',
          interactionDescription: `Pendência "${pendencia.title}" foi concluída`,
          interactionDate: now,
          autorTipo: 'Sistema'
        });
      }

      toast.success('Pendência concluída com sucesso');
      loadData();
    } catch (error) {
      console.error('Error completing pending:', error);
      toast.error('Erro ao concluir pendência');
      loadData(); // Revert
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.atendimentoRef) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const pendenciaData = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      atendimentoRef: formData.atendimentoRef,
      responsiblePartyType: formData.responsiblePartyType,
      responsiblePartyDetails: formData.responsiblePartyDetails,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      bloqueiaFase: formData.bloqueiaFase,
      creationDate: editingPendencia ? undefined : new Date().toISOString()
    };

    try {
      if (editingPendencia) {
        await BaseCrudService.update(collection, { _id: editingPendencia._id, ...pendenciaData });
        toast.success('Pendência atualizada com sucesso');
      } else {
        const _id = crypto.randomUUID();
        await BaseCrudService.create(collection, { _id, ...pendenciaData });

        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef: formData.atendimentoRef,
          tipoEvento: 'Pendencia_Criada',
          interactionType: 'Criação de pendência',
          interactionDescription: `Nova pendência criada: "${formData.title}"`,
          interactionDate: new Date().toISOString(),
          autorTipo: 'Sistema'
        });
        toast.success('Pendência criada com sucesso');
      }

      setIsDialogOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar pendência');
    }
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

  const getPriorityBadge = (priority?: string) => {
    const colors: Record<string, string> = {
      'Alta': 'bg-red-100 text-red-800 font-bold',
      'Média': 'bg-yellow-100 text-yellow-800 font-bold',
      'Baixa': 'bg-green-100 text-green-800 font-bold'
    };
    return (
      <Badge className={colors[priority || 'Média'] || colors['Média']}>
        {priority || 'Média'}
      </Badge>
    );
  };

  const getAtendimentoInfo = (atendimentoRef?: string) => {
    if (!atendimentoRef) return { name: '—', pasta: '—', cpf: '—' };
    const a = atendimentos.find(item => item._id === atendimentoRef);
    if (!a) return { name: '—', pasta: '—', cpf: '—' };
    
    let cpf = '—';
    if (a.clientePrincipalRef) {
      const cli = clientes.find(c => c._id === a.clientePrincipalRef);
      if (cli?.cpfCnpj) cpf = cli.cpfCnpj;
    }
    return {
      name: a.contactName || 'Sem nome',
      pasta: a.pastaInterna || '—',
      cpf
    };
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
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
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              {title}
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-2.5 py-0.5 rounded-lg">
                {pendencias.filter(p => p.status !== 'Concluída' && p.status !== 'Resolvida').length} pendentes
              </Badge>
            </h1>
            <p className="text-slate-500 font-semibold text-sm mt-1">Gerencie todas as pendências e impedimentos do módulo de forma centralizada.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-xl h-12 px-5 font-bold border-slate-200 transition-all ${showFilters ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white hover:bg-slate-50'}`}
            >
              <Filter className="w-4 h-4 mr-2" /> Filtros
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className={`rounded-xl h-12 px-5 font-bold border-slate-200 transition-all ${showColumnSettings ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white hover:bg-slate-50'}`}
            >
              <Settings className="w-4 h-4 mr-2" /> Colunas
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-6 font-bold shadow-lg shadow-emerald-100 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" /> Nova Pendência
            </Button>
          </div>
        </div>

        {/* Column Settings Card */}
        {showColumnSettings && (
          <Card className="mb-6 border-slate-200 rounded-2xl shadow-sm animate-in slide-in-from-top-2 duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">Escolha as Colunas Visíveis</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.prioridade}
                  onChange={e => setVisibleColumns({ ...visibleColumns, prioridade: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                /> Prioridade
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.prazo}
                  onChange={e => setVisibleColumns({ ...visibleColumns, prazo: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                /> Prazo de Solução
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.responsavel}
                  onChange={e => setVisibleColumns({ ...visibleColumns, responsavel: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                /> Responsável
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.cpfProponente}
                  onChange={e => setVisibleColumns({ ...visibleColumns, cpfProponente: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                /> CPF Proponente
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.bloqueante}
                  onChange={e => setVisibleColumns({ ...visibleColumns, bloqueante: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                /> Alerta de Bloqueio
              </label>
            </CardContent>
          </Card>
        )}

        {/* Filters Drawer Panel */}
        {showFilters && (
          <Card className="mb-6 border-slate-200 rounded-2xl shadow-sm animate-in slide-in-from-top-2 duration-200">
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Buscar por texto</Label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Título ou descrição..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="h-10 pl-10 border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Responsável</Label>
                <Select value={responsavelFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 border-slate-200 rounded-xl">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Cliente">Clientes</SelectItem>
                    <SelectItem value="Interno">Equipe Interna</SelectItem>
                    <SelectItem value="Banco">Banco/Financeira</SelectItem>
                    <SelectItem value="Caixa">Caixa Econômica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Prioridade</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-10 border-slate-200 rounded-xl">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Prazo de Solução</Label>
                <Select value={prazoFilter} onValueChange={setPrazoFilter}>
                  <SelectTrigger className="h-10 border-slate-200 rounded-xl">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="atrasado">Atrasados</SelectItem>
                    <SelectItem value="hoje">Para hoje</SelectItem>
                    <SelectItem value="proximos-7-dias">Próximos 7 dias</SelectItem>
                    <SelectItem value="proximos-30-dias">Próximos 30 dias</SelectItem>
                    <SelectItem value="sem-prazo">Sem prazo definido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setResponsavelFilter('all');
                    setPrazoFilter('all');
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl h-10 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table/List of Pendencies */}
        <Card className="rounded-2xl border-slate-200/80 shadow-md bg-white overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-16">
                <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-600"></div>
              </div>
            ) : filteredPendencias.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4 opacity-75" />
                <p className="text-sm font-semibold">Nenhuma pendência pendente encontrada.</p>
                <p className="text-xs mt-1 text-slate-400">Tudo limpo ou sem correspondência com os filtros atuais!</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 py-5.5 px-6">Pendência / Processo</TableHead>
                    {visibleColumns.prioridade && <TableHead className="font-bold text-slate-700">Prioridade</TableHead>}
                    {visibleColumns.prazo && <TableHead className="font-bold text-slate-700">Prazo</TableHead>}
                    {visibleColumns.responsavel && <TableHead className="font-bold text-slate-700">Responsável</TableHead>}
                    {visibleColumns.cpfProponente && <TableHead className="font-bold text-slate-700">CPF do Proponente</TableHead>}
                    <TableHead className="font-bold text-slate-700 text-right pr-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPendencias.map(p => {
                    const info = getAtendimentoInfo(p.atendimentoRef);
                    const overdue = isOverdue(p.dueDate);

                    return (
                      <TableRow key={p._id} className={`hover:bg-slate-50/40 transition-colors border-b border-slate-100 ${overdue ? 'bg-rose-50/20 hover:bg-rose-50/40' : ''}`}>
                        <TableCell className="py-4.5 px-6">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                              <span>👤 {info.name}</span>
                              <span>•</span>
                              <span>📂 Pasta: {info.pasta}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-800">{p.title}</h4>
                              {visibleColumns.bloqueante && p.bloqueiaFase && (
                                <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-[9px] px-1.5 h-4.5 rounded uppercase">
                                  Bloqueia Fase
                                </Badge>
                              )}
                              {overdue && (
                                <Badge className="bg-red-600 text-white font-black text-[9px] px-1.5 h-4.5 rounded uppercase">
                                  Atrasada
                                </Badge>
                              )}
                            </div>
                            {p.description && (
                              <p className="text-xs text-slate-500 leading-relaxed max-w-lg mt-1 line-clamp-2">{p.description}</p>
                            )}
                          </div>
                        </TableCell>
                        {visibleColumns.prioridade && (
                          <TableCell>{getPriorityBadge(p.priority)}</TableCell>
                        )}
                        {visibleColumns.prazo && (
                          <TableCell className="font-medium text-xs text-slate-600">
                            {p.dueDate ? (
                              <div className="flex items-center gap-1.5">
                                <Calendar className={`w-3.5 h-3.5 ${overdue ? 'text-red-500' : 'text-slate-400'}`} />
                                <span className={overdue ? 'text-red-600 font-bold' : ''}>
                                  {format(new Date(p.dueDate), 'dd/MM/yyyy')}
                                </span>
                              </div>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.responsavel && (
                          <TableCell className="text-xs font-semibold text-slate-650">
                            {p.responsiblePartyType === 'Interno'
                              ? team.find(u => u._id === p.responsiblePartyDetails)?.name || 'Interno'
                              : p.responsiblePartyDetails || p.responsiblePartyType || '—'}
                          </TableCell>
                        )}
                        {visibleColumns.cpfProponente && (
                          <TableCell className="text-xs text-slate-600 font-mono">{info.cpf}</TableCell>
                        )}
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-1.5">
                            {p.atendimentoRef && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`${kanbanRoute}?openCard=${p.atendimentoRef}`)}
                                className="rounded-xl border-slate-200 h-8 font-bold text-xs hover:bg-slate-50 hover:text-slate-800 gap-1.5 px-3"
                              >
                                <Eye className="w-3.5 h-3.5" /> Ver Cartão
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleConcluir(p._id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 font-bold text-xs gap-1.5 px-3"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Concluir
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(p)}
                              className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(p._id)}
                              className="h-8 w-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      </main>

      {/* Save/Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-6.5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              {editingPendencia ? 'Editar Pendência' : 'Nova Pendência'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="sm:col-span-2">
              <Label className="text-xs font-bold text-slate-600 block mb-1">Processo Associado *</Label>
              <Select
                value={formData.atendimentoRef}
                onValueChange={v => setFormData({ ...formData, atendimentoRef: v })}
                disabled={!!editingPendencia}
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
              <Label className="text-xs font-bold text-slate-600 block mb-1">Responsável *</Label>
              <Select
                value={formData.responsiblePartyType}
                onValueChange={v => setFormData({ ...formData, responsiblePartyType: v, responsiblePartyDetails: '' })}
              >
                <SelectTrigger className="h-10 border-slate-200 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cliente">Cliente Principal</SelectItem>
                  <SelectItem value="Interno">Equipe Interna</SelectItem>
                  <SelectItem value="Banco">Banco / Financeira</SelectItem>
                  <SelectItem value="Cartório">Cartório</SelectItem>
                  <SelectItem value="Caixa">Caixa Econômica</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.responsiblePartyType === 'Interno' ? (
              <div>
                <Label className="text-xs font-bold text-slate-600 block mb-1">Usuário Interno *</Label>
                <Select
                  value={formData.responsiblePartyDetails}
                  onValueChange={v => setFormData({ ...formData, responsiblePartyDetails: v })}
                >
                  <SelectTrigger className="h-10 border-slate-200 rounded-xl">
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
            ) : (
              <div>
                <Label className="text-xs font-bold text-slate-600 block mb-1">Detalhes do Responsável</Label>
                <Input
                  value={formData.responsiblePartyDetails}
                  onChange={e => setFormData({ ...formData, responsiblePartyDetails: e.target.value })}
                  placeholder="Nome, e-mail ou telefone..."
                  className="h-10 border-slate-200 rounded-xl"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <Label className="text-xs font-bold text-slate-600 block mb-1">Título da Pendência *</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título objetivo da pendência..."
                className="h-10 border-slate-200 rounded-xl text-slate-800 font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs font-bold text-slate-600 block mb-1">Descrição Detalhada</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva as ações necessárias e observações relevantes..."
                rows={3}
                className="border-slate-200 rounded-xl text-sm resize-none"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-600 block mb-1">Prazo de Solução</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="h-10 border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-600 block mb-1">Prioridade</Label>
              <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
                <SelectTrigger className="h-10 border-slate-200 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 flex items-center space-x-2 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
              <input
                type="checkbox"
                id="form-bloqueante"
                checked={formData.bloqueiaFase}
                onChange={e => setFormData({ ...formData, bloqueiaFase: e.target.checked })}
                className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <Label htmlFor="form-bloqueante" className="text-xs font-bold text-slate-700 cursor-pointer block select-none">
                  Esta pendência impede a mudança de fase (Bloqueante)
                </Label>
                <p className="text-[10px] text-slate-400 select-none">Impede o avanço do atendimento no painel principal.</p>
              </div>
            </div>

            <div className="sm:col-span-2 flex gap-3 pt-3 border-t border-slate-100 mt-2">
              <Button
                type="submit"
                disabled={!formData.title || !formData.atendimentoRef}
                className="h-11 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-100"
              >
                <Save className="w-4 h-4 mr-2" /> {editingPendencia ? 'Salvar Alterações' : 'Criar Pendência'}
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
