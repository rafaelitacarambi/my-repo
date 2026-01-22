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
  CheckSquare,
  ExternalLink,
  Eye,
  Settings
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
import { PendnciasdoFinanciamento, ServiceRecords, HistricodeInteraes, FinancingTasks, Clients, ServiceParties } from '@/entities';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminFinancingPendenciasPage() {
  console.log('[AdminFinancingPendenciasPage] Component mounted');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendencias, setPendencias] = useState<PendnciasdoFinanciamento[]>([]);
  const [filteredPendencias, setFilteredPendencias] = useState<PendnciasdoFinanciamento[]>([]);
  const [atendimentos, setAtendimentos] = useState<ServiceRecords[]>([]);
  const [clientes, setClientes] = useState<Clients[]>([]);
  const [serviceParties, setServiceParties] = useState<ServiceParties[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<string>('all');
  const [prazoFilter, setPrazoFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPendencia, setEditingPendencia] = useState<PendnciasdoFinanciamento | null>(null);
  const [selectedAtendimentoId, setSelectedAtendimentoId] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  
  // Load column preferences from localStorage
  const loadColumnPreferences = () => {
    const saved = localStorage.getItem('pendenciasColumnPreferences');
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
      numeroMatricula: false,
      numeroContrato: false,
      protocoloCartorio: false
    };
  };

  const [visibleColumns, setVisibleColumns] = useState(loadColumnPreferences());

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
  }, [pendencias, searchTerm, statusFilter, priorityFilter, responsavelFilter, prazoFilter, selectedColumn]);

  // Save column preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pendenciasColumnPreferences', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const loadData = async () => {
    console.log('[AdminFinancingPendenciasPage] loadData() called');
    setIsLoading(true);
    
    const [pendenciasResult, atendimentosResult, clientesResult, partiesResult] = await Promise.all([
      BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasfinanciamento'),
      BaseCrudService.getAll<ServiceRecords>('atendimentos'),
      BaseCrudService.getAll<Clients>('clientes'),
      BaseCrudService.getAll<ServiceParties>('atendimentopartes')
    ]);

    console.log('[AdminFinancingPendenciasPage] Data loaded:', {
      pendenciasCount: pendenciasResult.items.length,
      atendimentosCount: atendimentosResult.items.length,
      clientesCount: clientesResult.items.length,
      partiesCount: partiesResult.items.length
    });

    setPendencias(pendenciasResult.items);
    setAtendimentos(atendimentosResult.items);
    setClientes(clientesResult.items);
    setServiceParties(partiesResult.items);
    setIsLoading(false);
  };

  const filterPendencias = () => {
    let filtered = [...pendencias];

    // Filter only active pendencias (not completed)
    filtered = filtered.filter(p => p.status !== 'Concluída');

    // Filter by selected column (fase do financiamento)
    if (selectedColumn !== 'all') {
      filtered = filtered.filter(p => {
        if (!p.atendimentoRef) return false;
        const atendimento = atendimentos.find(a => a._id === p.atendimentoRef);
        return atendimento?.faseFinanciamento === selectedColumn;
      });
    }

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
        const responsavel = p.responsiblePartyDetails || p.responsiblePartyType || '';
        return responsavel.toLowerCase().includes(responsavelFilter.toLowerCase());
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

    // Validate required fields
    if (!formData.title || !formData.atendimentoRef) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e selecione um processo",
        variant: "destructive"
      });
      return;
    }

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

      toast({
        title: "✅ Pendência atualizada",
        description: "As alterações foram salvas com sucesso"
      });
    } else {
      console.log('[AdminFinancingPendenciasPage] Creating new pendência');
      const newPendencia = {
        _id: crypto.randomUUID(),
        ...pendenciaData
      } as PendnciasdoFinanciamento;

      setPendencias(prev => [newPendencia, ...prev]);
      
      await BaseCrudService.create('pendenciasfinanciamento', newPendencia);

      // AUTOMAÇÃO DESATIVADA: Não criar tarefa automaticamente
      // Tarefas devem ser criadas manualmente pelo usuário

      // Create history entry
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: formData.atendimentoRef,
        tipoEvento: 'Pendencia_Criada',
        interactionType: 'Criação de pendência',
        interactionDescription: `Nova pendência criada: "${formData.title}"`,
        interactionDate: new Date().toISOString(),
        autorTipo: 'Sistema'
      });

      toast({
        title: "✅ Pendência criada",
        description: "Pendência registrada com sucesso"
      });
    }

    setIsDialogOpen(false);
    console.log('[AdminFinancingPendenciasPage] Operation completed successfully');
    
    // Reload data to update counters
    await loadData();
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

  const getAtendimentoInfo = (atendimentoRef?: string) => {
    if (!atendimentoRef) return { 
      proponentePrincipal: '—', 
      pasta: '—',
      cpfProponente: '—',
      numeroMatricula: '—',
      numeroContrato: '—',
      protocoloCartorio: '—'
    };
    
    const atendimento = atendimentos.find(a => a._id === atendimentoRef);
    if (!atendimento) return { 
      proponentePrincipal: '—', 
      pasta: '—',
      cpfProponente: '—',
      numeroMatricula: '—',
      numeroContrato: '—',
      protocoloCartorio: '—'
    };

    // Get proponent principal name and CPF with priority logic
    let proponentePrincipal = '—';
    let cpfProponente = '—';
    let clientePrincipal: Clients | undefined;
    
    // Priority 1: atendimento.proponentePrincipalRef (if exists in future)
    // For now, this field doesn't exist in ServiceRecords, so skip
    
    // Priority 2: atendimento.clientePrincipalRef
    if (atendimento.clientePrincipalRef) {
      clientePrincipal = clientes.find(c => c._id === atendimento.clientePrincipalRef);
      proponentePrincipal = clientePrincipal?.clientName || clientePrincipal?.nomeRazaoSocial || atendimento.contactName || '—';
      cpfProponente = clientePrincipal?.cpfCnpj || '—';
    } 
    // Priority 3: Search in ServiceParties for "Proponente Principal"
    else {
      const principalParty = serviceParties.find(
        p => p.serviceRecordRef === atendimentoRef && p.roleInService === 'Proponente Principal'
      );
      if (principalParty && principalParty.clientRef) {
        clientePrincipal = clientes.find(c => c._id === principalParty.clientRef);
        proponentePrincipal = clientePrincipal?.clientName || clientePrincipal?.nomeRazaoSocial || '—';
        cpfProponente = clientePrincipal?.cpfCnpj || '—';
      } else if (atendimento.contactName) {
        proponentePrincipal = atendimento.contactName;
      }
    }

    // Get pasta
    const pasta = atendimento.pastaInterna || '—';

    // Get additional fields from atendimento
    // Note: These fields need to be added to the ServiceRecords entity in the future
    // For now, we'll check if they exist (they might be added via visual editing)
    const numeroMatricula = (atendimento as any).numeroMatricula || '—';
    const numeroContrato = (atendimento as any).numeroContrato || '—';
    const protocoloCartorio = (atendimento as any).numeroProtocoloCartorio || '—';

    return { 
      proponentePrincipal, 
      pasta,
      cpfProponente,
      numeroMatricula,
      numeroContrato,
      protocoloCartorio
    };
  };

  const handleConcluir = async (pendenciaId: string) => {
    const pendencia = pendencias.find(p => p._id === pendenciaId);
    if (!pendencia) return;

    const now = new Date().toISOString();

    // Optimistic update - update status to 'Concluída' and set resolvedDate
    setPendencias(prev => prev.map(p => p._id === pendenciaId ? { 
      ...p, 
      status: 'Concluída',
      resolvedDate: now
    } : p));

    try {
      await BaseCrudService.update<PendnciasdoFinanciamento>('pendenciasfinanciamento', {
        _id: pendenciaId,
        status: 'Concluída',
        resolvedDate: now
      });

      // Create history entry
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

      toast({
        title: "✅ Pendência concluída",
        description: `"${pendencia.title}" foi marcada como concluída`,
      });

      // Reload data to ensure consistency
      await loadData();
    } catch (error) {
      console.error('Error completing pending:', error);
      toast({
        title: "Erro ao concluir",
        description: "Não foi possível concluir a pendência",
        variant: "destructive"
      });
      await loadData(); // Revert on failure
    }
  };

  const handleReabrir = async (pendenciaId: string) => {
    const pendencia = pendencias.find(p => p._id === pendenciaId);
    if (!pendencia) return;

    // Optimistic update
    setPendencias(prev => prev.map(p => p._id === pendenciaId ? { 
      ...p, 
      status: 'Pendente',
      resolvedDate: undefined
    } : p));

    try {
      await BaseCrudService.update<PendnciasdoFinanciamento>('pendenciasfinanciamento', {
        _id: pendenciaId,
        status: 'Pendente',
        resolvedDate: undefined
      });

      // Create history entry
      if (pendencia.atendimentoRef) {
        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef: pendencia.atendimentoRef,
          tipoEvento: 'Pendencia_Reaberta',
          interactionType: 'Reabertura de pendência',
          interactionDescription: `Pendência "${pendencia.title}" foi reaberta`,
          interactionDate: new Date().toISOString(),
          autorTipo: 'Sistema'
        });
      }

      toast({
        title: "🔄 Pendência reaberta",
        description: `"${pendencia.title}" foi reaberta`,
      });

      await loadData();
    } catch (error) {
      console.error('Error reopening pending:', error);
      toast({
        title: "Erro ao reabrir",
        description: "Não foi possível reabrir a pendência",
        variant: "destructive"
      });
      await loadData(); // Revert on failure
    }
  };

  const handleOpenCard = (atendimentoId: string) => {
    setSelectedAtendimentoId(atendimentoId);
    setShowCardModal(true);
  };

  const renderPendenciasTable = () => {
    if (isLoading) {
      return (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-buttonbackground"></div>
        </div>
      );
    }

    if (filteredPendencias.length === 0) {
      return (
        <div className="p-12 text-center text-dark-gray font-paragraph">
          Nenhuma pendência ativa encontrada
        </div>
      );
    }

    // Check if any identification column is visible
    const hasIdentificationColumns = visibleColumns.cpfProponente || visibleColumns.numeroMatricula || 
                                      visibleColumns.numeroContrato || visibleColumns.protocoloCartorio;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-paragraph">Título</TableHead>
            {visibleColumns.prioridade && <TableHead className="font-paragraph">Prioridade</TableHead>}
            {visibleColumns.prazo && <TableHead className="font-paragraph">Prazo</TableHead>}
            {visibleColumns.responsavel && <TableHead className="font-paragraph">Responsável</TableHead>}
            {visibleColumns.cpfProponente && <TableHead className="font-paragraph">CPF Proponente</TableHead>}
            {visibleColumns.numeroMatricula && <TableHead className="font-paragraph">Nº Matrícula</TableHead>}
            {visibleColumns.numeroContrato && <TableHead className="font-paragraph">Nº Contrato</TableHead>}
            {visibleColumns.protocoloCartorio && <TableHead className="font-paragraph">Protocolo Cartório</TableHead>}
            <TableHead className="font-paragraph text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPendencias.map((pendencia) => {
            const overdueStatus = isOverdue(pendencia.dueDate, pendencia.status);
            const { proponentePrincipal, pasta, cpfProponente, numeroMatricula, numeroContrato, protocoloCartorio } = getAtendimentoInfo(pendencia.atendimentoRef);
            
            return (
              <TableRow key={pendencia._id} className={overdueStatus ? 'bg-red-50' : ''}>
                <TableCell className="font-paragraph font-medium">
                  <div>
                    {/* Identification: Show when identification columns are visible */}
                    {hasIdentificationColumns && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-sm font-semibold text-foreground mb-1">
                          Cliente: {proponentePrincipal}
                        </div>
                        <div className="text-xs text-dark-gray">
                          Pasta: {pasta}
                        </div>
                      </div>
                    )}
                    
                    {/* Simple identification when no identification columns visible */}
                    {!hasIdentificationColumns && (
                      <div className="text-xs text-dark-gray mb-2">
                        {proponentePrincipal} ({pasta})
                      </div>
                    )}
                    
                    {/* Title and badges */}
                    <div className={`flex items-center gap-2 ${overdueStatus ? 'text-red-700 font-bold' : ''}`}>
                      {pendencia.title}
                      {pendencia.bloqueiaFase && (
                        <Badge variant="destructive" className="text-xs">Bloqueante</Badge>
                      )}
                      {overdueStatus && (
                        <Badge className="text-xs bg-red-600 text-white">⚠️ ATRASADA</Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                {visibleColumns.prioridade && <TableCell>{getPriorityBadge(pendencia.priority)}</TableCell>}
                {visibleColumns.prazo && (
                  <TableCell className="font-paragraph">
                    {pendencia.dueDate ? (
                      <div className={overdueStatus ? 'text-red-600 font-semibold' : ''}>
                        {format(new Date(pendencia.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                        {overdueStatus && (
                          <div className="text-xs">Atrasada</div>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                )}
                {visibleColumns.responsavel && (
                  <TableCell className="font-paragraph">
                    {pendencia.responsiblePartyDetails || pendencia.responsiblePartyType || '—'}
                  </TableCell>
                )}
                {visibleColumns.cpfProponente && (
                  <TableCell className="font-paragraph">
                    {cpfProponente}
                  </TableCell>
                )}
                {visibleColumns.numeroMatricula && (
                  <TableCell className="font-paragraph">
                    {numeroMatricula}
                  </TableCell>
                )}
                {visibleColumns.numeroContrato && (
                  <TableCell className="font-paragraph">
                    {numeroContrato}
                  </TableCell>
                )}
                {visibleColumns.protocoloCartorio && (
                  <TableCell className="font-paragraph">
                    {protocoloCartorio}
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {pendencia.atendimentoRef && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCard(pendencia.atendimentoRef!)}
                        title="Abrir Cartão do Processo"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Abrir Cartão
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleConcluir(pendencia._id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckSquare className="w-4 h-4 mr-1" />
                      Concluir
                    </Button>
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
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <FinancingNavigation />
      
      <main className="flex-1 w-full">
        <div className="max-w-[100rem] mx-auto px-6 py-12">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-6 mb-4">
              <div className="flex-1">
                <h1 className="font-heading text-4xl font-bold text-foreground mb-3">
                  Pendências do Financiamento
                </h1>
                <p className="font-paragraph text-lg text-dark-gray">
                  Gerencie todas as pendências dos processos de financiamento
                </p>
              </div>
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="font-paragraph bg-white hover:bg-light-gray border-2 border-buttonbackground text-buttonbackground hover:text-buttonbackground font-semibold px-6 py-2 shadow-sm"
              >
                <Settings className="w-5 h-5 mr-2" />
                Colunas
              </Button>
            </div>
          </div>

          {/* Column Settings Panel */}
          {showColumnSettings && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Configurar Colunas Visíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="col-prioridade"
                      checked={visibleColumns.prioridade}
                      onChange={(e) => setVisibleColumns({ ...visibleColumns, prioridade: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="col-prioridade" className="font-paragraph cursor-pointer">
                      Prioridade
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="col-prazo"
                      checked={visibleColumns.prazo}
                      onChange={(e) => setVisibleColumns({ ...visibleColumns, prazo: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="col-prazo" className="font-paragraph cursor-pointer">
                      Prazo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="col-responsavel"
                      checked={visibleColumns.responsavel}
                      onChange={(e) => setVisibleColumns({ ...visibleColumns, responsavel: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="col-responsavel" className="font-paragraph cursor-pointer">
                      Responsável
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="col-cpfProponente"
                      checked={visibleColumns.cpfProponente}
                      onChange={(e) => setVisibleColumns({ ...visibleColumns, cpfProponente: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="col-cpfProponente" className="font-paragraph cursor-pointer">
                      CPF Proponente Principal
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="col-numeroMatricula"
                      checked={visibleColumns.numeroMatricula}
                      onChange={(e) => setVisibleColumns({ ...visibleColumns, numeroMatricula: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="col-numeroMatricula" className="font-paragraph cursor-pointer">
                      Número da Matrícula
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="col-numeroContrato"
                      checked={visibleColumns.numeroContrato}
                      onChange={(e) => setVisibleColumns({ ...visibleColumns, numeroContrato: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="col-numeroContrato" className="font-paragraph cursor-pointer">
                      Número do Contrato
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="col-protocoloCartorio"
                      checked={visibleColumns.protocoloCartorio}
                      onChange={(e) => setVisibleColumns({ ...visibleColumns, protocoloCartorio: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="col-protocoloCartorio" className="font-paragraph cursor-pointer">
                      Protocolo do Cartório
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters Section */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Column Filter (Fase do Financiamento) */}
                <div>
                  <Label className="font-paragraph text-sm mb-2 block">Fase do Kanban</Label>
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger className="font-paragraph">
                      <SelectValue placeholder="Todas as fases" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as fases</SelectItem>
                      <SelectItem value="aguardando-imovel">Aguardando o imóvel</SelectItem>
                      <SelectItem value="condicionados">Condicionados</SelectItem>
                      <SelectItem value="pendencia">Pendência</SelectItem>
                      <SelectItem value="consultar-restricao">Consultar restrição</SelectItem>
                      <SelectItem value="novos-clientes">Novos clientes</SelectItem>
                      <SelectItem value="analise-documentos">Análise de documentos</SelectItem>
                      <SelectItem value="cadastro-cliente">Cadastro de cliente</SelectItem>
                      <SelectItem value="avaliacao-risco">Avaliação de risco</SelectItem>
                      <SelectItem value="engenharia">Engenharia</SelectItem>
                      <SelectItem value="fgts">FGTS</SelectItem>
                      <SelectItem value="formularios">Formulários</SelectItem>
                      <SelectItem value="siopi">SIOPI</SelectItem>
                      <SelectItem value="solicitar-reserva">Solicitar reserva orçamentária</SelectItem>
                      <SelectItem value="sictd">SICTD</SelectItem>
                      <SelectItem value="conformidade">Conformidade</SelectItem>
                      <SelectItem value="entrevista">Entrevista</SelectItem>
                      <SelectItem value="assinatura-minuta">Assinatura minuta</SelectItem>
                      <SelectItem value="itbi">ITBI</SelectItem>
                      <SelectItem value="cartorio-rsales">Cartório (R Sales)</SelectItem>
                      <SelectItem value="cartorio-cliente">Cartório por conta do cliente</SelectItem>
                      <SelectItem value="garantia">Garantia</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="acompanhamento-obra">Acompanhamento de obra</SelectItem>
                      <SelectItem value="reprovados">Reprovados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Responsável Filter */}
                <div>
                  <Label className="font-paragraph text-sm mb-2 block">Responsável</Label>
                  <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
                    <SelectTrigger className="font-paragraph">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                      <SelectItem value="Vendedor">Vendedor</SelectItem>
                      <SelectItem value="Banco">Banco</SelectItem>
                      <SelectItem value="Interno">Interno</SelectItem>
                      <SelectItem value="Proponente">Proponente</SelectItem>
                      <SelectItem value="Caixa">Caixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Prioridade Filter */}
                <div>
                  <Label className="font-paragraph text-sm mb-2 block">Prioridade</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="font-paragraph">
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

                {/* Prazo Filter */}
                <div>
                  <Label className="font-paragraph text-sm mb-2 block">Prazo</Label>
                  <Select value={prazoFilter} onValueChange={setPrazoFilter}>
                    <SelectTrigger className="font-paragraph">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="atrasado">Atrasado</SelectItem>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="proximos-7-dias">Próximos 7 dias</SelectItem>
                      <SelectItem value="proximos-30-dias">Próximos 30 dias</SelectItem>
                      <SelectItem value="sem-prazo">Sem prazo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedColumn('all');
                      setResponsavelFilter('all');
                      setPriorityFilter('all');
                      setPrazoFilter('all');
                      setSearchTerm('');
                    }}
                    className="w-full font-paragraph"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pendências Table */}
          <Card className="mb-8">
            <CardContent className="p-0">
              {renderPendenciasTable()}
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
                    <SelectItem value="Concluída">Concluída</SelectItem>
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

      {/* Card Modal - Process Details Popup */}
      <Dialog open={showCardModal} onOpenChange={setShowCardModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Cartão do Processo
            </DialogTitle>
          </DialogHeader>
          {selectedAtendimentoId && (() => {
            const atendimento = atendimentos.find(a => a._id === selectedAtendimentoId);
            if (!atendimento) {
              return <div className="p-6 text-center text-dark-gray">Atendimento não encontrado</div>;
            }

            const { proponentePrincipal, pasta } = getAtendimentoInfo(selectedAtendimentoId);
            const casePendencias = pendencias.filter(p => p.atendimentoRef === selectedAtendimentoId && p.status !== 'Concluída');

            return (
              <div className="space-y-6 p-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-paragraph text-sm text-dark-gray">Proponente Principal</Label>
                      <p className="font-paragraph text-base font-semibold">{proponentePrincipal}</p>
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm text-dark-gray">Pasta Interna</Label>
                      <p className="font-paragraph text-base font-semibold">{pasta}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-paragraph text-sm text-dark-gray">Fase Atual</Label>
                      <p className="font-paragraph text-base">{atendimento.faseFinanciamento || '—'}</p>
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm text-dark-gray">Status</Label>
                      <p className="font-paragraph text-base">{atendimento.status || '—'}</p>
                    </div>
                  </div>

                  {atendimento.contactEmail && (
                    <div>
                      <Label className="font-paragraph text-sm text-dark-gray">Email</Label>
                      <p className="font-paragraph text-base">{atendimento.contactEmail}</p>
                    </div>
                  )}

                  {atendimento.contactPhone && (
                    <div>
                      <Label className="font-paragraph text-sm text-dark-gray">Telefone</Label>
                      <p className="font-paragraph text-base">{atendimento.contactPhone}</p>
                    </div>
                  )}

                  {atendimento.notes && (
                    <div>
                      <Label className="font-paragraph text-sm text-dark-gray">Observações</Label>
                      <p className="font-paragraph text-base">{atendimento.notes}</p>
                    </div>
                  )}
                </div>

                {/* Pendências */}
                <div>
                  <h3 className="font-heading text-lg font-bold mb-3">
                    Pendências Abertas ({casePendencias.length})
                  </h3>
                  {casePendencias.length === 0 ? (
                    <p className="text-dark-gray font-paragraph">Nenhuma pendência aberta</p>
                  ) : (
                    <div className="space-y-2">
                      {casePendencias.map(p => (
                        <Card key={p._id} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-paragraph font-semibold">{p.title}</span>
                                {getPriorityBadge(p.priority)}
                                {p.bloqueiaFase && (
                                  <Badge variant="destructive" className="text-xs">Bloqueante</Badge>
                                )}
                              </div>
                              {p.description && (
                                <p className="text-sm text-dark-gray font-paragraph">{p.description}</p>
                              )}
                              {p.dueDate && (
                                <p className="text-xs text-dark-gray font-paragraph mt-1">
                                  Prazo: {format(new Date(p.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowCardModal(false)}
                    className="font-paragraph"
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCardModal(false);
                      navigate(`/admin/financiamento/${selectedAtendimentoId}`);
                    }}
                    className="bg-buttonbackground hover:bg-buttonbackground/90 text-white font-paragraph"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Detalhes Completos
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
